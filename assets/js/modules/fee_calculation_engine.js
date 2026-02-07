/**
 * FEE CALCULATION ENGINE
 * Aligned with actual schema: fee_structure_versions, fee_structure_classes, student_fee_snapshots,
 * and legacy class_fees + fee_types + student_discounts. No references to fee_structures or student_fee_balances.
 */

const supabase = window.supabase;

/**
 * Calculate total fees for a student. Uses snapshot for versioned students, class_fees + student_discounts for legacy.
 * @param {string} studentId - Student UUID
 * @returns {Promise<Object>} Fee calculation result
 */
export async function calculateStudentFees(studentId) {
    if (!supabase) throw new Error('Supabase client not initialized');

    try {
        const { data: student, error: studentError } = await supabase
            .from('students')
            .select('id, name, class, fee_structure_version_id, family_code')
            .eq('id', studentId)
            .single();

        if (studentError) throw studentError;
        if (!student) throw new Error('Student not found');

        let feeBreakdown = [];
        let totalFee = 0;
        let totalDiscount = 0;
        let has_sibling_discount = false;

        if (student.fee_structure_version_id) {
            const { data: snapshot, error: snapError } = await supabase
                .from('student_fee_snapshots')
                .select('*')
                .eq('student_id', studentId)
                .maybeSingle();

            if (!snapError && snapshot) {
                const base = Number(snapshot.base_fee) || 0;
                const finalMonthly = Number(snapshot.final_base_monthly) || 0;
                const admission = Number(snapshot.admission_fee) || 0;
                const exam = Number(snapshot.exam_fee) || 0;
                const misc = Number(snapshot.misc_charges) || 0;
                const siblingPct = Number(snapshot.sibling_discount_percent) || 0;
                const staffPct = Number(snapshot.staff_discount_percent) || 0;

                if (siblingPct > 0 || staffPct > 0) has_sibling_discount = true;

                feeBreakdown.push({
                    fee_type_id: null,
                    fee_type_name: 'Tuition Fee',
                    fee_type_code: 'TUITION',
                    amount: finalMonthly,
                    discount_amount: Math.max(0, base - finalMonthly),
                    net_amount: finalMonthly,
                    display_order: 0
                });
                totalFee += finalMonthly;
                totalDiscount += Math.max(0, base - finalMonthly);
                if (admission > 0) {
                    feeBreakdown.push({
                        fee_type_id: null,
                        fee_type_name: 'Admission Fee',
                        fee_type_code: 'ADMISSION',
                        amount: admission,
                        discount_amount: 0,
                        net_amount: admission,
                        display_order: 1
                    });
                    totalFee += admission;
                }
                if (exam > 0) {
                    feeBreakdown.push({
                        fee_type_id: null,
                        fee_type_name: 'Exam Fee',
                        fee_type_code: 'EXAM',
                        amount: exam,
                        discount_amount: 0,
                        net_amount: exam,
                        display_order: 2
                    });
                    totalFee += exam;
                }
                if (misc > 0) {
                    feeBreakdown.push({
                        fee_type_id: null,
                        fee_type_name: 'Misc Charges',
                        fee_type_code: 'MISC',
                        amount: misc,
                        discount_amount: 0,
                        net_amount: misc,
                        display_order: 3
                    });
                    totalFee += misc;
                }
            }
        }

        if (feeBreakdown.length === 0) {
            const classFees = await getLegacyClassFees(student.class);
            const { data: studentDiscounts } = await supabase
                .from('student_discounts')
                .select('*')
                .eq('student_id', studentId)
                .lte('start_month', new Date().toISOString().slice(0, 7))
                .gte('end_month', new Date().toISOString().slice(0, 7));

            let siblingDiscountPct = 0;
            const siblingEligible = await checkSiblingDiscountLegacy(student);
            if (siblingEligible) {
                has_sibling_discount = true;
                siblingDiscountPct = 20;
            }

            classFees.forEach((cf, i) => {
                const amount = Number(cf.amount) || 0;
                const disc = (studentDiscounts || []).find(d => (d.fee_type || '').toLowerCase() === (cf.name || '').toLowerCase());
                let discountAmount = 0;
                if (disc) {
                    if (disc.discount_type === 'percentage') discountAmount = (amount * Number(disc.discount_value || 0)) / 100;
                    else discountAmount = Number(disc.discount_value || 0);
                }
                if (cf.name && (cf.name.toLowerCase().includes('tuition') || cf.name.toLowerCase().includes('monthly')) && siblingDiscountPct > 0) {
                    discountAmount += (amount * siblingDiscountPct) / 100;
                }
                discountAmount = Math.min(discountAmount, amount);
                const netAmount = Math.max(0, amount - discountAmount);
                feeBreakdown.push({
                    fee_type_id: cf.fee_type_id || null,
                    fee_type_name: cf.name || 'Fee',
                    fee_type_code: (cf.name || '').toUpperCase().replace(/\s/g, '_').slice(0, 20),
                    amount,
                    discount_amount: discountAmount,
                    net_amount: netAmount,
                    display_order: i
                });
                totalFee += amount;
                totalDiscount += discountAmount;
            });
        }

        const totalPayable = totalFee - totalDiscount;
        const currentOutstanding = await getStudentOutstandingBalance(studentId);
        const totalDue = currentOutstanding + totalPayable;

        return {
            student_id: studentId,
            student_name: student.name,
            class_name: student.class,
            fee_breakdown: feeBreakdown.sort((a, b) => a.display_order - b.display_order),
            total_fee: totalFee,
            total_discount: totalDiscount,
            total_payable: totalPayable,
            current_outstanding: currentOutstanding,
            total_due: totalDue,
            has_sibling_discount: has_sibling_discount
        };
    } catch (error) {
        console.error('Error calculating student fees:', error);
        throw error;
    }
}

async function getLegacyClassFees(className) {
    if (!className || !supabase) return [];
    const { data: classes } = await supabase
        .from('classes')
        .select('id, class_name')
        .eq('class_name', className)
        .limit(1);
    const classId = classes && classes[0] ? classes[0].id : null;
    if (!classId) return [];
    const { data: classFees } = await supabase
        .from('class_fees')
        .select('amount, fee_types(id, name)')
        .eq('class_id', classId);
    return (classFees || []).map(cf => ({
        fee_type_id: cf.fee_types?.id,
        name: cf.fee_types?.name,
        amount: cf.amount
    }));
}

async function checkSiblingDiscountLegacy(student) {
    if (!student.family_code || !supabase) return false;
    const { count } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('family_code', student.family_code);
    return count != null && count >= 2;
}

/**
 * Apply discounts to fee breakdown (for callers that build breakdown themselves)
 */
export function applyDiscounts(feeBreakdown, discounts, hasSiblingDiscount) {
    return feeBreakdown.map(fee => {
        let discountAmount = 0;
        const feeDiscount = (discounts || []).find(d => d.fee_type_id === fee.fee_type_id || d.fee_type_id === null);
        if (feeDiscount) {
            if (feeDiscount.discount_method === 'percentage') {
                discountAmount = (fee.amount * Number(feeDiscount.discount_value)) / 100;
            } else {
                discountAmount = Number(feeDiscount.discount_value);
            }
        }
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

export function validatePayment(amountPaid, totalDue) {
    if (amountPaid <= 0) {
        return { valid: false, error: 'Payment amount must be greater than zero' };
    }
    if (amountPaid > totalDue) {
        return { valid: false, error: 'Payment amount cannot exceed total due' };
    }
    return { valid: true };
}

export function calculateRemainingBalance(totalDue, amountPaid) {
    return Math.max(0, totalDue - amountPaid);
}

/**
 * Get student's current outstanding from fees table (no student_fee_balances).
 */
export async function getStudentOutstandingBalance(studentId) {
    if (!supabase) return 0;
    try {
        const { data: fees, error } = await supabase
            .from('fees')
            .select('final_amount, paid_amount, amount, discount, status')
            .eq('student_id', studentId)
            .in('status', ['unpaid', 'partial']);

        if (error) throw error;
        if (!fees || fees.length === 0) return 0;

        return fees.reduce((sum, f) => {
            const due = Number(f.final_amount ?? (Number(f.amount) - Number(f.discount || 0))) || 0;
            const paid = Number(f.paid_amount) || 0;
            return sum + Math.max(0, due - paid);
        }, 0);
    } catch (error) {
        console.error('Error getting outstanding balance:', error);
        return 0;
    }
}
