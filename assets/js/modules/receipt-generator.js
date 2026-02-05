// Fee Receipt Generator Module
const supabase = window.supabase;

export async function generateReceipt(studentIds, isMultiple = false) {
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

        // Group by family (father_cnic)
        const fatherCNIC = students[0].father_cnic;
        const fatherName = students[0].father_name;
        const fatherPhone = students[0].phone || 'N/A';

        // Get current date and due date
        const issueDate = new Date().toLocaleDateString('en-GB');
        const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB');

        // Build receipt HTML
        const receiptHTML = buildReceiptHTML({
            fatherName,
            fatherCNIC,
            fatherPhone,
            issueDate,
            dueDate,
            students
        });

        // Open receipt in new window
        const receiptWindow = window.open('', '_blank', 'width=800,height=1000');
        receiptWindow.document.write(receiptHTML);
        receiptWindow.document.close();
    } catch (error) {
        console.error('Error generating receipt:', error);
        alert('Failed to generate receipt: ' + error.message);
    }
}

function buildReceiptHTML({ fatherName, fatherCNIC, fatherPhone, issueDate, dueDate, students }) {
    let studentRows = '';
    let grandTotal = 0;

    students.forEach(student => {
        const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
        const unpaidFees = student.fees?.filter(f => f.status !== 'paid') || [];

        // Find current tuition fee
        const currentTuition = unpaidFees.find(f => f.fee_type === 'Tuition Fee' && f.month === currentMonth);
        const otherFees = unpaidFees.filter(f => f !== currentTuition);

        let studentTotal = 0;
        let feeRows = '';

        // 1. Show Current Tuition Fee if exists
        if (currentTuition) {
            const actual = Number(currentTuition.final_amount || 0);
            const disc = Number(currentTuition.discount || 0);
            const net = actual - disc;
            studentTotal += net;

            feeRows += `
                <tr class="fee-row">
                    <td>Tuition Fee (${currentTuition.month})</td>
                    <td class="text-right">${actual.toFixed(0)}</td>
                    <td class="text-right">${disc.toFixed(0)}</td>
                    <td class="text-right">${net.toFixed(0)}</td>
                </tr>
            `;
        } else {
            // If no current tuition, maybe show a placeholder or just Skip
        }

        // 2. Group all other unpaid fees as Arrears
        if (otherFees.length > 0) {
            const months = [...new Set(otherFees.map(f => f.month))].sort().join(', ');
            const totalArrears = otherFees.reduce((sum, f) => sum + (Number(f.final_amount) - Number(f.discount || 0)), 0);
            studentTotal += totalArrears;

            feeRows += `
                <tr class="fee-row">
                    <td>Arrears (${months})</td>
                    <td class="text-right"></td>
                    <td class="text-right"></td>
                    <td class="text-right">${totalArrears.toFixed(0)}</td>
                </tr>
            `;
        }

        grandTotal += studentTotal;

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
            <tr class="total-row">
                <td colspan="3"><strong>Total Payable of ${student.name}:</strong></td>
                <td class="text-right"><strong>${studentTotal.toFixed(0)}</strong></td>
            </tr>
        `;
    });

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
        <button class="print-btn" onclick="window.print()">🖨️ Print Receipt</button>
        <button class="print-btn close-btn" onclick="window.close()">✖ Close</button>
    </div>

    <div id="feeReceipt" class="receipt-container">
        <div class="receipt-header">
            <img src="/assets/images/school-logo.jpg" alt="School Logo" class="receipt-logo" onerror="this.style.display='none'">
            <div class="office-copy">Office Copy</div>
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

        <table class="receipt-table">
            <thead>
                <tr>
                    <th style="width: 50%;">Particulars</th>
                    <th style="width: 15%;">Actual Fee</th>
                    <th style="width: 15%;">Discount</th>
                    <th style="width: 20%;">Amount</th>
                </tr>
            </thead>
            <tbody>
                ${studentRows}
                <tr class="grand-total-row">
                    <td colspan="3" style="border-right: none;"><strong>Grand Total Payable:</strong></td>
                    <td class="text-right" style="border-left: none;"><strong>${grandTotal.toFixed(0)}</strong></td>
                </tr>
            </tbody>
        </table>
    </div>

    <script>
        // Auto-focus print dialog after load
        window.onload = function() {
            setTimeout(() => {
                // Uncomment to auto-print
                // window.print();
            }, 500);
        };
    </script>
</body>
</html>
    `;
}

function getInlineStyles() {
    return `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f5f5f5; }
        .receipt-container { max-width: 210mm; margin: 20px auto; padding: 20px; background: white; color: #000; }
        .receipt-header { text-align: center; border-bottom: 3px solid #000; padding-bottom: 10px; margin-bottom: 15px; position: relative; }
        .receipt-logo { width: 80px; height: 80px; position: absolute; left: 0; top: 0; }
        .receipt-school-name { font-size: 28px; font-weight: bold; margin: 0; letter-spacing: 2px; }
        .receipt-address { font-size: 12px; margin: 5px 0; }
        .receipt-title { font-size: 18px; font-weight: bold; margin: 10px 0; text-decoration: underline; }
        .office-copy { position: absolute; right: 0; top: 0; background: #000; color: #fff; padding: 5px 15px; font-size: 14px; font-weight: bold; }
        .receipt-meta { border: 2px solid #000; padding: 10px; margin-bottom: 15px; }
        .meta-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 8px; font-size: 13px; }
        .meta-label { font-weight: bold; }
        .receipt-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .receipt-table th { background: #e0e0e0; border: 2px solid #000; padding: 8px; text-align: center; font-size: 14px; font-weight: bold; }
        .receipt-table td { border: 1px solid #000; padding: 6px 8px; font-size: 13px; }
        .student-header { background: #f5f5f5; font-weight: bold; border: 2px solid #000 !important; }
        .fee-row td { padding-left: 20px; }
        .total-row { font-weight: bold; font-size: 14px; }
        .grand-total-row { background: #f0f0f0; font-weight: bold; font-size: 16px; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .print-actions { text-align: center; margin: 20px 0; padding: 20px; }
        .print-btn { background: #4CAF50; color: white; border: none; padding: 12px 30px; font-size: 16px; border-radius: 5px; cursor: pointer; margin: 0 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
        .print-btn:hover { background: #45a049; }
        .close-btn { background: #f44336; }
        .close-btn:hover { background: #da190b; }
        @media print {
            body * { visibility: hidden; }
            #feeReceipt, #feeReceipt * { visibility: visible; }
            #feeReceipt { position: absolute; left: 0; top: 0; width: 100%; }
            .no-print { display: none !important; }
        }
        @page { size: A4; margin: 15mm; }
    `;
}

// Export for use in fees module
window.generateFeeReceipt = generateReceipt;
