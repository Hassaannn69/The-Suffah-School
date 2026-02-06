/**
 * FEE CALCULATION ENGINE
 * Data-driven, accurate, auditable fee calculation system
 * All calculations are based on Supabase data
 */

const supabase = window.supabase;

/**
 * Calculate total fees for a student based on their class and fee structures
 * @param {string} studentId - Student UUID
 * @returns {Promise<Object>} Fee calculation result
 */
export async function calculateStudentFees(studentId) {
    try {
        // Fetch student data
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('*, classes(*)')
            .eq('id', studentId)
            .single();

        if (studentError) throw studentError;
        if (!student || !student.class_id) {
            throw new Error('Student or class not found');
        }

        // Fetch all fee types
        const { data: feeTypes, error: feeTypesError } = await supabase
            .from('fee_types')
            .select('*')
            .order('display_order', { ascending: true });

        if (feeTypesError) throw feeTypesError;

        // Fetch fee structure for student's class
        const { data: feeStructures, error: structuresError } = await supabase
            .from('fee_structures')
            .select('*, fee_types(*)')
            .eq('class_id', student.class_id)
            .eq('is_active', true);

        if (structuresError) throw structuresError;

        // Fetch current balances
        const { data: balances, error: balancesError } = await supabase
            .from('student_fee_balances')
            .select('*, fee_types(*)')
            .eq('student_id', studentId);

        if (balancesError) throw balancesError;

        // Fetch active discounts
        const { data: discounts, error: discountsError } = await supabase
            .from('discounts')
            .select('*, fee_types(*)')
            .eq('student_id', studentId)
            .eq('is_active', true)
            .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString().split('T')[0]}`);

        if (discountsError) throw discountsError;

        // Check for sibling discount
        const siblingDiscount = await checkSiblingDiscount(student);

        // Build fee breakdown
        const feeBreakdown = [];
        let totalFee = 0;
        let totalDiscount = 0;

        // Process each fee type
        for (const feeType of feeTypes) {
            // Find fee structure for this fee type
            const structure = feeStructures.find(s => s.fee_type_id === feeType.id);
            
            // Get current balance if exists
            const balance = balances.find(b => b.fee_type_id === feeType.id);
            
            // Base amount from structure or balance
            let amount = 0;
            if (structure) {
                amount = Number(structure.amount || 0);
            } else if (balance) {
                amount = Number(balance.total_assigned || 0);
            }

            // Apply discounts
            let discountAmount = 0;
            
            // Check for fee-specific discount
            const feeDiscount = discounts.find(d => 
                d.fee_type_id === feeType.id || d.fee_type_id === null
            );

            if (feeDiscount) {
                if (feeDiscount.discount_method === 'percentage') {
                    discountAmount = (amount * Number(feeDiscount.discount_value)) / 100;
                } else {
                    discountAmount = Number(feeDiscount.discount_value);
                }
            }

            // Apply sibling discount (20% on tuition fee)
            if (feeType.code === 'TUITION' && siblingDiscount) {
                const siblingDiscountAmount = (amount * 20) / 100;
                discountAmount += siblingDiscountAmount;
            }

            const netAmount = Math.max(0, amount - discountAmount);

            feeBreakdown.push({
                fee_type_id: feeType.id,
                fee_type_name: feeType.name,
                fee_type_code: feeType.code,
                amount: amount,
                discount_amount: discountAmount,
                net_amount: netAmount,
                display_order: feeType.display_order
            });

            totalFee += amount;
            totalDiscount += discountAmount;
        }

        // Sort by display order
        feeBreakdown.sort((a, b) => a.display_order - b.display_order);

        // Calculate total payable
        const totalPayable = totalFee - totalDiscount;

        // Get current outstanding from balances
        const currentOutstanding = balances.reduce((sum, b) => {
            return sum + Number(b.remaining_balance || 0);
        }, 0);

        // Total due = current outstanding + new fees - discounts
        const totalDue = currentOutstanding + totalPayable;

        return {
            student_id: studentId,
            student_name: student.name,
            class_name: student.classes?.name || student.class,
            fee_breakdown: feeBreakdown,
            total_fee: totalFee,
            total_discount: totalDiscount,
            total_payable: totalPayable,
            current_outstanding: currentOutstanding,
            total_due: totalDue,
            has_sibling_discount: !!siblingDiscount
        };

    } catch (error) {
        console.error('Error calculating student fees:', error);
        throw error;
    }
}

/**
 * Check if student is eligible for sibling discount
 * @param {Object} student - Student object
 * @returns {Promise<boolean>} True if eligible
 */
async function checkSiblingDiscount(student) {
    if (!student.family_id) return false;

    try {
        // Count siblings in same family
        const { data: siblings, error } = await supabase
            .from('students')
            .select('id')
            .eq('family_id', student.family_id)
            .eq('status', 'active')
            .order('admission_date', { ascending: true });

        if (error) throw error;

        // Find this student's position
        const studentIndex = siblings.findIndex(s => s.id === student.id);
        
        // 2nd child or later gets discount
        return studentIndex >= 1;
    } catch (error) {
        console.error('Error checking sibling discount:', error);
        return false;
    }
}

/**
 * Apply discounts to fee breakdown
 * @param {Array} feeBreakdown - Fee breakdown array
 * @param {Array} discounts - Active discounts
 * @param {boolean} hasSiblingDiscount - Whether sibling discount applies
 * @returns {Array} Updated fee breakdown with discounts applied
 */
export function applyDiscounts(feeBreakdown, discounts, hasSiblingDiscount) {
    return feeBreakdown.map(fee => {
        let discountAmount = 0;

        // Apply fee-specific discount
        const feeDiscount = discounts.find(d => 
            d.fee_type_id === fee.fee_type_id || d.fee_type_id === null
        );

        if (feeDiscount) {
            if (feeDiscount.discount_method === 'percentage') {
                discountAmount = (fee.amount * Number(feeDiscount.discount_value)) / 100;
            } else {
                discountAmount = Number(feeDiscount.discount_value);
            }
        }

        // Apply sibling discount (20% on tuition)
        if (fee.fee_type_code === 'TUITION' && hasSiblingDiscount) {
            discountAmount += (fee.amount * 20) / 100;
        }

        return {
            ...fee,
            discount_amount: discountAmount,
            net_amount: Math.max(0, fee.amount - discountAmount)
        };
    });
}

/**
 * Validate payment amount
 * @param {number} amountPaid - Amount being paid
 * @param {number} totalDue - Total amount due
 * @returns {Object} Validation result
 */
export function validatePayment(amountPaid, totalDue) {
    if (amountPaid <= 0) {
        return { valid: false, error: 'Payment amount must be greater than zero' };
    }

    if (amountPaid > totalDue) {
        return { valid: false, error: 'Payment amount cannot exceed total due' };
    }

    return { valid: true };
}

/**
 * Calculate remaining balance after payment
 * @param {number} totalDue - Total amount due
 * @param {number} amountPaid - Amount being paid
 * @returns {number} Remaining balance
 */
export function calculateRemainingBalance(totalDue, amountPaid) {
    return Math.max(0, totalDue - amountPaid);
}

/**
 * Get student's current outstanding balance
 * @param {string} studentId - Student UUID
 * @returns {Promise<number>} Total outstanding balance
 */
export async function getStudentOutstandingBalance(studentId) {
    try {
        const { data: balances, error } = await supabase
            .from('student_fee_balances')
            .select('remaining_balance')
            .eq('student_id', studentId);

        if (error) throw error;

        return balances.reduce((sum, b) => sum + Number(b.remaining_balance || 0), 0);
    } catch (error) {
        console.error('Error getting outstanding balance:', error);
        return 0;
    }
}
