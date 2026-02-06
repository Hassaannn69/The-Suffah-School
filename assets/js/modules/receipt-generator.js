// Fee Receipt Generator Module
const supabase = window.supabase;

/**
 * UNIFIED BALANCE CALCULATION - Single Source of Truth
 * Paid amounts and outstanding come from fee_payments (actual transactions), not fees.paid_amount.
 * Calculates total outstanding using the same cumulative (month-by-month) logic as the ledger.
 * This ensures consistency across Dashboard, Receipt Header, and Ledger Balance.
 * EXPORTED for use in fees.js module.
 */
export function calculateUnifiedBalance(students, payments) {
    const allFees = [];
    students.forEach(s => {
        if (s.fees) allFees.push(...s.fees);
    });

    // Group fees by month (same logic as buildLedgerRows)
    const monthsMap = {};
    allFees.forEach(fee => {
        if (!monthsMap[fee.month]) {
            monthsMap[fee.month] = {
                actual: 0,
                disc: 0,
                paid: 0
            };
        }
        const m = monthsMap[fee.month];
        m.actual += Number(fee.amount || 0);
        m.disc += Number(fee.discount || 0);
        const paidForThisFee = (payments || []).filter(p => p.fee_id === fee.id).reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
        m.paid += paidForThisFee;
    });

    // Sort months ascending for cumulative calculation (Oldest First)
    const allMonths = Object.keys(monthsMap).sort();
    
    let cumulativeArrears = 0;
    
    // Calculate cumulative balance month by month (same as ledger)
    allMonths.forEach(month => {
        const data = monthsMap[month];
        const monthTotal = data.actual - data.disc; // Actual - Discount
        const totalPayableThisMonth = cumulativeArrears + monthTotal;
        const monthBalance = totalPayableThisMonth - data.paid;
        cumulativeArrears = monthBalance; // Carry forward to next month
    });
    
    // Return the final cumulative balance (matches latest ledger balance)
    return Math.max(0, cumulativeArrears); // Ensure non-negative for display
}

/**
 * Calculate per-student balance using the same cumulative ledger logic
 * This ensures individual student totals are accurate and match the ledger calculation
 */
function calculateStudentBalance(student, allStudents, allPayments, unifiedBalance) {
    const studentFees = student.fees || [];
    const studentPayments = (allPayments || []).filter(p => p.student_id === student.id);
    
    if (studentFees.length === 0) {
        return 0;
    }
    
    // Group fees by month (same logic as calculateUnifiedBalance and buildLedgerRows)
    const monthsMap = {};
    studentFees.forEach(fee => {
        if (!monthsMap[fee.month]) {
            monthsMap[fee.month] = {
                actual: 0,
                disc: 0,
                paid: 0
            };
        }
        const m = monthsMap[fee.month];
        m.actual += Number(fee.amount || 0);
        m.disc += Number(fee.discount || 0);
        // Use ACTUAL payment transactions for this fee (not fee.paid_amount)
        const paidForThisFee = studentPayments
            .filter(p => p.fee_id === fee.id)
            .reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
        m.paid += paidForThisFee;
    });
    
    // Sort months ascending for cumulative calculation (Oldest First)
    const allMonths = Object.keys(monthsMap).sort();
    
    let cumulativeArrears = 0;
    
    // Calculate cumulative balance month by month (same as ledger)
    allMonths.forEach(month => {
        const data = monthsMap[month];
        const monthTotal = data.actual - data.disc; // Actual - Discount
        const totalPayableThisMonth = cumulativeArrears + monthTotal;
        const monthBalance = totalPayableThisMonth - data.paid;
        cumulativeArrears = monthBalance; // Carry forward to next month
    });
    
    // Return the final cumulative balance for this student
    return Math.max(0, cumulativeArrears);
}

export async function generateReceipt(studentIds, isMultiple = false, copyType = 'Office Copy', paymentInfo = null) {
    try {
        // Fetch student and fee data
        const { data: students, error: studentError } = await supabase
            .from('students')
            .select('*, fees(*)')
            .in('id', studentIds);

        if (studentError) throw studentError;

        if (!students || students.length === 0) {
            alert('No student data found');
            return;
        }

        // Use first student with available guardian details (fallback across siblings)
        const primaryStudent = students.find(s => (s.father_name && s.father_name.trim()) || (s.father_cnic && s.father_cnic.trim()) || (s.phone && s.phone.trim())) || students[0];
        const fatherCNIC = (primaryStudent.father_cnic && String(primaryStudent.father_cnic).trim()) ? primaryStudent.father_cnic : 'N/A';
        const fatherName = (primaryStudent.father_name && String(primaryStudent.father_name).trim()) ? primaryStudent.father_name : 'N/A';
        const fatherPhone = (primaryStudent.phone && String(primaryStudent.phone).trim()) ? primaryStudent.phone : (primaryStudent.guardian_phone && String(primaryStudent.guardian_phone).trim()) ? primaryStudent.guardian_phone : 'N/A';

        const issueDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '/');
        const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '/');

        // Fetch payments for ledger history
        const { data: payments, error: paymentError } = await supabase
            .from('fee_payments')
            .select('*')
            .in('student_id', studentIds)
            .order('payment_date', { ascending: true }); // Ascending for cumulative calc

        // Build receipt HTML (pass paymentInfo which may contain paymentIds and feeIds)
        const receiptHTML = await buildReceiptHTML({
            fatherName,
            fatherCNIC,
            fatherPhone,
            issueDate,
            dueDate,
            students,
            payments,
            copyType,
            paymentInfo // { amountPaid, balance, receiptNo, paymentIds, feeIds }
        });

        // Try to open new window for receipt - check if popup was blocked
        let receiptWindow = window.open('', '_blank', 'width=900,height=1200');
        
        if (!receiptWindow || receiptWindow.closed || typeof receiptWindow.closed === 'undefined') {
            // Popup was blocked - try alternative method using blob URL
            try {
                const blob = new Blob([receiptHTML], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                receiptWindow = window.open(url, '_blank', 'width=900,height=1200');
                
                // Clean up blob URL after a delay
                setTimeout(() => {
                    URL.revokeObjectURL(url);
                }, 1000);
                
                if (!receiptWindow || receiptWindow.closed) {
                    alert('Popup blocked! Please allow popups for this site to print receipts.\n\nAlternatively, you can:\n1. Check your browser\'s popup blocker settings\n2. Try clicking the print button again');
                    return;
                }
            } catch (blobError) {
                console.error('Blob URL method failed:', blobError);
                alert('Failed to open receipt window. Please allow popups for this site.');
                return;
            }
        }

        // Write HTML content to the window (if using document.write method)
        if (receiptWindow.document) {
            receiptWindow.document.open();
            receiptWindow.document.write(receiptHTML);
            receiptWindow.document.close();
        }

        // Wait for window to fully load before allowing interactions
        const focusWindow = () => {
            if (receiptWindow && !receiptWindow.closed) {
                receiptWindow.focus();
            }
        };

        if (receiptWindow.addEventListener) {
            receiptWindow.addEventListener('load', focusWindow, { once: true });
        }

        // Fallback: If load event doesn't fire, wait a bit and focus anyway
        setTimeout(focusWindow, 200);
    } catch (error) {
        console.error('Error generating receipt:', error);
        alert('Failed to generate receipt: ' + error.message);
    }
}

async function buildReceiptHTML({ fatherName, fatherCNIC, fatherPhone, issueDate, dueDate, students, payments, copyType, paymentInfo }) {
    let studentRows = '';
    let grandTotal = 0;

    const ledgerRows = buildLedgerRows(students, payments);

    // For payment receipt: build merged rows (same table as normal receipt) and total paid / updated balance
    let paidFeesRows = [];
    let totalPaidThisTransaction = 0;
    if (paymentInfo && (paymentInfo.paymentIds && paymentInfo.paymentIds.length > 0)) {
        try {
            const { data: paymentData, error: paymentDataError } = await supabase
                .from('fee_payments')
                .select('*, fees(*)')
                .in('id', paymentInfo.paymentIds);
            if (!paymentDataError && paymentData) {
                const processedPaymentIds = new Set();
                paymentData.forEach(payment => {
                    if (processedPaymentIds.has(payment.id)) return;
                    processedPaymentIds.add(payment.id);
                    let paidFee = null;
                    students.forEach(student => {
                        const fee = (student.fees || []).find(f => f.id === payment.fee_id);
                        if (fee) paidFee = fee;
                    });
                    if (!paidFee && payment.fees) paidFee = payment.fees;
                    if (paidFee) {
                        const actual = Number(paidFee.amount || 0);
                        const disc = Number(paidFee.discount || 0);
                        const amountPaid = Number(payment.amount_paid || 0);
                        totalPaidThisTransaction += amountPaid;
                        paidFeesRows.push({
                            feeType: paidFee.fee_type,
                            month: formatMonthStr(paidFee.month),
                            actual,
                            disc,
                            amountPaid
                        });
                    }
                });
            }
        } catch (err) {
            console.warn('Could not fetch payment records for receipt:', err);
        }
    }

    // Calculate unified balance first (needed for per-student calculations)
    const unifiedBalance = calculateUnifiedBalance(students, payments);
    
    // Track individual student balances to ensure grand total accuracy
    let sumOfStudentBalances = 0;
    
    students.forEach(student => {
        const allFees = student.fees || [];
        const studentPayments = (payments || []).filter(p => p.student_id === student.id);

        // Show ALL individual fee entries - use ACTUAL payment transactions to calculate balance
        // This ensures Transport Fee and all other fee types are shown separately
        const feesWithBalance = allFees.filter(f => {
            // Calculate paid amount from actual payment transactions (not fee.paid_amount)
            const paidForThisFee = studentPayments
                .filter(p => p.fee_id === f.id)
                .reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
            
            const actual = Number(f.amount || 0);
            const disc = Number(f.discount || 0);
            const balance = actual - disc - paidForThisFee;
            
            // Show fee if it has any balance remaining
            return balance > 0;
        });

        // Sort by month then fee_type for consistent receipt order
        feesWithBalance.sort((a, b) => {
            const monthCompare = (a.month || '').localeCompare(b.month || '');
            if (monthCompare !== 0) return monthCompare;
            return (a.fee_type || '').localeCompare(b.fee_type || '');
        });

        let feeRows = '';

        // Render EVERY individual fee entry as its own row (including duplicates)
        // Show REMAINING balance using actual payment transactions
        feesWithBalance.forEach(fee => {
            const actual = Number(fee.amount || 0);
            const disc = Number(fee.discount || 0);
            
            // Use ACTUAL payment transactions for this specific fee (not fee.paid_amount)
            const paidForThisFee = studentPayments
                .filter(p => p.fee_id === fee.id)
                .reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
            
            const remaining = Math.max(0, actual - disc - paidForThisFee);

            feeRows += `
                <tr class="fee-row">
                    <td>${fee.fee_type || 'Fee'} (${formatMonthStr(fee.month)})</td>
                    <td class="text-right">${actual.toFixed(0)}</td>
                    <td class="text-right">${disc.toFixed(0)}</td>
                    <td class="text-right font-bold">${remaining.toFixed(0)}</td>
                </tr>
            `;
        });

        // Calculate student's balance using cumulative ledger logic
        const studentBalance = calculateStudentBalance(student, students, payments, unifiedBalance);
        sumOfStudentBalances += studentBalance;

        studentRows += `
            <tr class="student-header">
                <td colspan="4">
                    <strong>File No: ${student.roll_no || 'N/A'}</strong> &nbsp;&nbsp;
                    <strong>Name: ${student.name}</strong> &nbsp;&nbsp;
                    <strong>Class: ${student.class} ${student.section || ''}</strong> &nbsp;&nbsp;
                    <strong>Status: ${student.status || 'Regular'}</strong>
                </td>
            </tr>
            ${feeRows}
            <tr class="total-row bg-gray-100">
                <td colspan="3" class="text-right"><strong>Total Payable of ${student.name}:</strong></td>
                <td class="text-right"><strong>${studentBalance.toFixed(0)}</strong></td>
            </tr>
        `;
    });
    
    // Grand Total: Use unified balance (which should equal sum of individual balances)
    // This ensures consistency with the ledger calculation
    grandTotal = unifiedBalance;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Fee Receipt - The Suffah School</title>
    <style>
        ${getInlineStyles()}
    </style>
</head>
<body>
    <div class="print-actions no-print">
        <select onchange="window.updateCopyType(this.value)" class="copy-select">
            <option value="Office Copy" ${copyType === 'Office Copy' ? 'selected' : ''}>Office Copy</option>
            <option value="Student Copy" ${copyType === 'Student Copy' ? 'selected' : ''}>Student Copy</option>
        </select>
        <button class="print-btn" onclick="window.print()">🖨️ Print Receipt</button>
        <button class="print-btn close-btn" onclick="window.close()">✖ Close</button>
    </div>

    <div id="feeReceipt" class="receipt-container">
        <div class="receipt-header">
            <img src="/assets/images/school-logo.jpg" alt="School Logo" class="receipt-logo" onerror="this.style.display='none'">
            <div class="office-copy" id="copyLabel">${copyType}</div>
            <h1 class="receipt-school-name">THE SUFFAH SCHOOL</h1>
            <p class="receipt-address">Municipal Corporation Colony Dalazak Road Peshawar (0912247371)</p>
            <h2 class="receipt-title">FEE SLIP</h2>
        </div>

        <div class="receipt-meta">
            <div style="border-bottom: 2px solid #000; padding: 5px 0; margin-bottom: 10px; text-align: center; font-weight: bold; font-family: sans-serif;">
                School Counter
            </div>
            <div class="meta-row">
                <div><span class="meta-label">Father Name:</span> ${fatherName} (${fatherPhone})</div>
                <div><span class="meta-label">Issue Date:</span> ${issueDate}</div>
            </div>
            <div class="meta-row">
                <div><span class="meta-label">Father CNIC:</span> ${fatherCNIC}</div>
                <div><span class="meta-label">Due Date:</span> ${dueDate}</div>
            </div>
        </div>

        <!-- One receipt layout for both fee slip and payment: same table, ledger, summary -->
        <table class="receipt-table">
            <thead>
                <tr>
                    <th style="width: 45%;">Particulars</th>
                    <th style="width: 15%;">Actual Fee</th>
                    <th style="width: 15%;">Discount</th>
                    <th style="width: 25%;">${paidFeesRows.length > 0 ? 'Amount Paid' : 'Remaining'}</th>
                </tr>
            </thead>
            <tbody>
                ${paidFeesRows.length > 0
                    ? paidFeesRows.map(f => `
                        <tr class="fee-row">
                            <td>${f.feeType} (${f.month})</td>
                            <td class="text-right">${f.actual.toFixed(0)}</td>
                            <td class="text-right">${f.disc.toFixed(0)}</td>
                            <td class="text-right font-bold">${f.amountPaid.toFixed(0)}</td>
                        </tr>
                    `).join('') + `
                    <tr class="grand-total-row">
                        <td colspan="3" style="border-right: none;"><strong>Total:</strong></td>
                        <td class="text-right" style="border-left: none;"><strong>${totalPaidThisTransaction.toFixed(0)}</strong></td>
                    </tr>`
                    : `${studentRows}
                    <tr class="grand-total-row">
                        <td colspan="3" style="border-right: none;"><strong>Grand Total Payable:</strong></td>
                        <td class="text-right" style="border-left: none;"><strong>${unifiedBalance.toFixed(0)}</strong></td>
                    </tr>`
                }
            </tbody>
        </table>

        <div class="ledger-section">
            <table class="ledger-table">
                <thead>
                    <tr>
                        <th style="width: 70px;">Fee Month</th>
                        <th>Arrear</th>
                        <th>Actual</th>
                        <th>Disc</th>
                        <th>T.Fee</th>
                        <th>O.Fee</th>
                        <th>M.Total</th>
                        <th>Payable</th>
                        <th>Balance</th>
                        <th>Rec #</th>
                        <th style="width: 70px;">Entry Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${ledgerRows}
                </tbody>
            </table>

            <div class="payment-summary">
                <div class="summary-field"><span>Paid</span> <span>${paidFeesRows.length > 0 ? totalPaidThisTransaction.toFixed(0) : '___________'}</span></div>
                <div class="summary-field"><span>Balance</span> <span>${paidFeesRows.length > 0 ? unifiedBalance.toFixed(0) : '___________'}</span></div>
                <div class="summary-field"><span>Date:</span> <span>${paymentInfo?.date || issueDate}</span></div>
                <div class="summary-field"><span>Method:</span> <span>${paymentInfo?.method || 'Cash / Bank / Online'}</span></div>
                <div class="summary-field"><span>Receipt No:</span> <span>${paymentInfo?.receiptNo || '_______'}</span></div>
            </div>
        </div>

        <div class="signature-section">
            <div>
                <p class="sig-line">Accountant's Sign</p>
            </div>
            <div>
                <p class="sig-line">Parent Sign</p>
            </div>
        </div>

        <div class="footer-note">
            محترم والدین! فیس جمع کرانے کیلئے یہ رسید لانا لازمی ہے۔ شکریہ
        </div>
    </div>

    <script>
        window.updateCopyType = function(val) {
            const label = document.getElementById('copyLabel');
            if (label) label.textContent = val;
        };
        
        // Ensure content is fully loaded before allowing print
        window.addEventListener('load', function() {
            // Small delay to ensure all styles and content are rendered
            setTimeout(function() {
                // Auto-focus the window when loaded
                window.focus();
            }, 100);
        }, { once: true });
        
        // Fallback for browsers that don't fire load event properly
        if (document.readyState === 'complete') {
            setTimeout(function() {
                window.focus();
            }, 100);
        }
    </script>
</body>
</html>
    `;
}

function buildLedgerRows(students, payments) {
    const allFees = [];
    students.forEach(s => {
        if (s.fees) allFees.push(...s.fees);
    });

    // Group by month
    const monthsMap = {};
    allFees.forEach(fee => {
        if (!monthsMap[fee.month]) {
            monthsMap[fee.month] = {
                month: fee.month,
                actual: 0,
                disc: 0,
                tuition: 0,
                others: 0,
                paid: 0,
                total: 0
            };
        }
        const m = monthsMap[fee.month];
        m.actual += Number(fee.amount || 0);
        m.disc += Number(fee.discount || 0);
        if (fee.fee_type === 'Tuition Fee') m.tuition += Number(fee.amount || 0);
        else m.others += Number(fee.amount || 0);
        const paidForThisFee = (payments || []).filter(p => p.fee_id === fee.id).reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
        m.paid += paidForThisFee;
        m.total = m.actual - m.disc;
    });

    // Sort months ascending for cumulative calculation (Oldest First)
    const allMonths = Object.keys(monthsMap).sort();

    let cumulativeArrears = 0;
    const processedRows = [];

    allMonths.forEach(month => {
        const data = monthsMap[month];

        // Month Total = Actual - Discount
        const monthTotal = data.actual - data.disc;

        // Payable = Opening Balance + Month Total
        const totalPayableThisMonth = cumulativeArrears + monthTotal;

        // Month Balance = Payable - Paid
        const monthBalance = totalPayableThisMonth - data.paid;

        // Find all payments for this month
        const monthPayments = payments.filter(p => p.payment_date.startsWith(month));
        const recNo = monthPayments.length > 0
            ? monthPayments.map(p => p.receipt_no || p.id.toString().slice(-4).toUpperCase()).join(', ')
            : '-';
        const entryDate = monthPayments.length > 0
            ? (window.formatPaymentDateLocal || ((v) => new Date(v).toLocaleDateString('en-GB')))(monthPayments[monthPayments.length - 1].payment_date)
            : '-';

        processedRows.push({
            month,
            arrear: cumulativeArrears, // Opening Balance
            actual: data.actual,
            disc: data.disc,
            tuition: data.tuition,
            others: data.others,
            total: monthTotal,    // Current Month Charge
            payable: totalPayableThisMonth, // New Column
            paid: data.paid,
            balance: monthBalance, // Closing Balance
            recNo,
            entryDate
        });

        // Carry forward: Closing Balance becomes next month's Opening Arrear
        cumulativeArrears = monthBalance;
    });

    // Take the last 12 months for the display, reversed (Newest First) for viewing
    const displayRows = processedRows.reverse().slice(0, 12);

    let html = displayRows.map((row, index) => {
        // Highlight the Balance of the very first row (Most Recent)
        const isLatest = index === 0;
        const balanceStyle = isLatest
            ? 'font-weight: 900; font-size: 14px; color: #b71c1c;'
            : 'font-weight: bold; font-size: 11px;';

        return `
        <tr>
            <td style="font-size: 8px;">${formatMonthStr(row.month)}</td>
            <td>${row.arrear.toFixed(0)}</td>
            <td>${row.actual.toFixed(0)}</td>
            <td>${row.disc.toFixed(0)}</td>
            <td>${row.tuition.toFixed(0)}</td>
            <td>${row.others.toFixed(0)}</td>
            <td class="font-bold">${row.total.toFixed(0)}</td>
            <td class="font-bold" style="color: #444;">${row.payable.toFixed(0)}</td>
            <td style="${balanceStyle}">${row.balance.toFixed(0)}</td>
            <td style="font-size: 7px; max-width: 60px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${row.recNo}</td>
            <td>${row.entryDate}</td>
        </tr>
    `}).join('');

    // Add empty rows up to 6 (11 columns after removing Paid)
    for (let i = displayRows.length; i < 6; i++) {
        html += `<tr>${'<td>&nbsp;</td>'.repeat(11)}</tr>`;
    }

    return html;
}

function formatMonthStr(monthStr) {
    if (!monthStr) return '';
    // monthStr is expected to be 'YYYY-MM'
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    if (isNaN(date.getTime())) return monthStr;

    // Format to 'MMM-YYYY' e.g., 'Feb-2026'
    return date.toLocaleString('default', { month: 'short' }) + '-' + year;
}

function getInlineStyles() {
    return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #fff; color: #000; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .receipt-container { width: 100%; max-width: 210mm; margin: 0 auto; padding: 8mm; background: white; }
        .receipt-header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 5px; margin-bottom: 10px; position: relative; }
        .receipt-logo { width: 60px; height: 60px; position: absolute; left: 0; top: 0; }
        .receipt-school-name { font-size: 24px; font-weight: bold; margin: 0; letter-spacing: 1px; }
        .receipt-address { font-size: 11px; margin: 2px 0; }
        .receipt-title { font-size: 16px; font-weight: bold; margin: 5px 0; text-decoration: underline; }
        .office-copy { position: absolute; right: 0; top: 0; background: #000; color: #fff; padding: 3px 10px; font-size: 12px; font-weight: bold; }
        .receipt-meta { border: 2px solid #000; padding: 5px; margin-bottom: 10px; }
        .meta-row { display: grid; grid-template-columns: 1.5fr 1fr; gap: 10px; margin-bottom: 4px; font-size: 12px; }
        .meta-label { font-weight: bold; }
        .receipt-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .receipt-table th { background: #e0e0e0 !important; border: 2px solid #000; padding: 5px; text-align: center; font-size: 13px; font-weight: bold; }
        .receipt-table td { border: 1px solid #000; padding: 4px 6px; font-size: 12px; }
        .student-header { background: #f0f0f0 !important; font-weight: bold; border: 2px solid #000 !important; }
        .fee-row td { padding-left: 15px; }
        .total-row { font-weight: bold; font-size: 13px; }
        .grand-total-row { background: #e0e0e0 !important; font-weight: bold; font-size: 14px; }
        
        /* Ledger Styles */
        .ledger-section { margin-top: 5px; display: flex; gap: 10px; align-items: flex-start; }
        .ledger-table { flex: 1; border-collapse: collapse; font-size: 10px; line-height: 1.3; }
        .ledger-table th, .ledger-table td { border: 1px solid #444; padding: 3px 4px; text-align: center; height: 20px; vertical-align: middle; }
        .ledger-table th { background: #f0f0f0 !important; font-weight: bold; border-bottom: 2px solid #000; }
        
        .payment-summary { width: 220px; font-size: 11px; display: flex; flex-direction: column; gap: 4px; }
        .summary-field { border-bottom: 1px solid #000; padding-bottom: 1px; display: flex; justify-content: space-between; font-weight: bold; }
        
        .signature-section { margin-top: 50px; display: flex; justify-content: space-between; padding: 0 10px; }
        .sig-line { border-top: 1px solid #000; padding-top: 5px; width: 200px; font-size: 12px; font-weight: bold; text-align: center; }
        .footer-note { text-align: center; margin-top: 10px; font-size: 13px; direction: rtl; font-family: serif; }
        
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .no-print { display: none !important; }
        .print-actions { text-align: center; padding: 10px; background: #eee; border-bottom: 1px solid #ccc; position: fixed; top: 0; left: 0; width: 100%; z-index: 9999; }
        .copy-select { padding: 8px; border-radius: 4px; border: 1px solid #ccc; font-size: 14px; margin-right: 10px; }
        .print-btn { background: #4CAF50; color: white; border: none; padding: 10px 20px; font-size: 14px; border-radius: 4px; cursor: pointer; }
        .close-btn { background: #f44336; margin-left: 5px; }
        
        @media print {
            .print-actions { display: none !important; }
            body { background: #fff; margin: 0; padding: 0; }
            .receipt-container { margin: 0; padding: 5mm; border: none; }
        }
        @page { size: A4; margin: 0; }
    `;
}

window.generateFeeReceipt = generateReceipt;
