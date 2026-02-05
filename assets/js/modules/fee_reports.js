// fee_reports.js - Fee Reporting Module
// Handles complex reporting with family-based aggregation (Highest Class Sibling Rule)

const supabase = window.supabase || (() => { throw new Error('Supabase not init'); })();

// --- State ---
let activeReport = 'daily_collection';
let familyMap = new Map(); // Map<StudentId, RepresentativeStudent>
let classRank = new Map(); // Map<ClassName, RankNumber>
let studentsMap = new Map(); // Map<StudentId, StudentObj>
let feeTypes = [];

// --- Config ---
const REPORTS = [
    { id: 'daily_collection', label: 'Daily Fee Collection', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2' },
    { id: 'monthly_collection', label: 'Monthly Collection', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'outstanding', label: 'Outstanding / Pending', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'fee_type', label: 'Fee Type Report', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2' },
    { id: 'payment_mode', label: 'Payment Mode', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { id: 'discounts', label: 'Discounts / Concessions', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
    { id: 'late_payment', label: 'Late / Overdue', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'custom_filter', label: 'Custom / Filtered', icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z' },
    { id: 'student_history', label: 'Student History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'class_collection', label: 'Class Collection', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' }
];

// --- Main Render ---
export async function render(container) {
    container.innerHTML = `
        <div class="flex flex-col md:flex-row gap-6 h-[calc(100vh-100px)]">
            <!-- Sidebar -->
            <div class="w-full md:w-64 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden shrink-0">
                <div class="p-4 border-b border-gray-100 dark:border-gray-700 font-bold text-gray-700 dark:text-gray-200">
                    Run Reports
                </div>
                <div class="overflow-y-auto flex-1 p-2 space-y-1">
                    ${REPORTS.map(r => `
                        <button onclick="window.selectReport('${r.id}')" 
                            id="btn-${r.id}"
                            class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeReport === r.id ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'}">
                            <svg class="w-5 h-5 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${r.icon}"></path></svg>
                            ${r.label}
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- Content Area -->
            <div class="flex-1 flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <!-- Filters Toolbar -->
                <div class="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 flex flex-wrap gap-3 items-center" id="reportFilters">
                    <!-- Filters injected dynamically based on report type -->
                    <span class="text-gray-400 text-sm">Loading filters...</span>
                </div>

                <!-- Report Header & Actions -->
                <div class="px-6 py-4 flex justify-between items-center border-b border-gray-50 dark:border-gray-800">
                    <div>
                        <h2 class="text-lg font-bold text-gray-800 dark:text-white" id="reportTitle">Report</h2>
                        <p class="text-xs text-gray-500" id="reportSubtitle">Generated on ${new Date().toLocaleDateString()}</p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="window.exportReport('csv')" class="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Export CSV</button>
                        <button onclick="window.exportReport('print')" class="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 dark:shadow-none">Print PDF</button>
                    </div>
                </div>

                <!-- Data Table -->
                <div class="flex-1 overflow-auto p-0 relative">
                    <div id="reportLoader" class="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center z-10 hidden">
                        <div class="flex flex-col items-center">
                            <div class="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <span class="text-xs font-medium text-indigo-600 mt-2">Generating Report...</span>
                        </div>
                    </div>
                    <table class="w-full text-left text-sm border-collapse">
                        <thead class="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium sticky top-0 z-0">
                            <tr id="tableHeaderRow">
                                <!-- Headers injected -->
                            </tr>
                        </thead>
                        <tbody id="tableBody" class="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                            <!-- Rows injected -->
                        </tbody>
                        <tfoot id="tableFooter" class="bg-gray-50 dark:bg-gray-800 border-t-2 border-gray-100 dark:border-gray-700 font-bold hidden">
                            <!-- Footer totals -->
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Init Logic
    await initStructure();
    window.selectReport('daily_collection');
}

// --- Initialization ---
async function initStructure() {
    // 1. Fetch Classes for Ranking
    const { data: classes } = await supabase.from('classes').select('*');
    if (classes) {
        classes.forEach(c => {
            // Try to extract number, fallback to name
            const num = parseInt(c.class_name.replace(/\D/g, ''));
            classRank.set(c.class_name, isNaN(num) ? 999 : num);
        });
    }

    // 2. Fetch Fee Types
    const { data: fTypes } = await supabase.from('fee_types').select('*');
    feeTypes = fTypes || [];

    // 3. Fetch All Students & Build Family Map
    const { data: students } = await supabase.from('students').select('*');
    studentsMap.clear();
    familyMap.clear();

    if (students) {
        // Group by Family (Father CNIC or Family Code)
        const grouping = new Map();

        students.forEach(s => {
            studentsMap.set(s.id, s);
            const key = s.family_code || s.father_cnic || s.id; // Fallback to self if no family info
            if (!grouping.has(key)) grouping.set(key, []);
            grouping.get(key).push(s);
        });

        // Determine Rep for each group
        grouping.forEach((groupStudents, key) => {
            // Sort by class rank (descending - highest first), then by age/admission if needed
            groupStudents.sort((a, b) => {
                const rankA = classRank.get(a.class) || 0;
                const rankB = classRank.get(b.class) || 0;
                return rankB - rankA; // Higher rank first
            });

            const rep = groupStudents[0];
            // Map every student ID in this family to the Representative
            groupStudents.forEach(s => {
                familyMap.set(s.id, rep);
            });
        });
    }
}

// --- Report Switching ---
window.selectReport = (reportIds) => {
    activeReport = reportIds;

    // Update Sidebar UI
    document.querySelectorAll('[id^="btn-"]').forEach(btn => {
        if (btn.id === `btn-${reportIds}`) {
            btn.classList.add('bg-indigo-50', 'text-indigo-700', 'dark:bg-indigo-900/20', 'dark:text-indigo-300');
            btn.classList.remove('text-gray-600', 'dark:text-gray-400');
        } else {
            btn.classList.remove('bg-indigo-50', 'text-indigo-700', 'dark:bg-indigo-900/20', 'dark:text-indigo-300');
            btn.classList.add('text-gray-600', 'dark:text-gray-400');
        }
    });

    const reportConfig = REPORTS.find(r => r.id === reportIds);
    document.getElementById('reportTitle').textContent = reportConfig.label;

    // Setup Filters
    setupFilters(reportIds);

    // Initial Run
    runReport();
}

function setupFilters(reportId) {
    const container = document.getElementById('reportFilters');
    let html = '';
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    if (reportId === 'daily_collection') {
        html += `<input type="date" id="f_date" value="${today}" class="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 dark:border-gray-600">`;
    }
    else if (reportId === 'monthly_collection' || reportId === 'class_collection') {
        html += `<input type="month" id="f_month" value="${currentMonth}" class="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 dark:border-gray-600">`;
    }
    else if (reportId === 'payment_mode' || reportId === 'custom_filter') {
        html += `<input type="date" id="f_start" value="${today}" class="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 dark:border-gray-600">`;
        html += `<span class="text-xs">to</span>`;
        html += `<input type="date" id="f_end" value="${today}" class="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 dark:border-gray-600">`;
    }
    else if (reportId === 'fee_type') {
        html += `<select id="f_feetype" class="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 dark:border-gray-600">
            <option value="">All Fee Types</option>
            ${feeTypes.map(t => `<option value="${t.name}">${t.name}</option>`).join('')}
         </select>`;
        html += `<input type="month" id="f_month" value="${currentMonth}" class="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 dark:border-gray-600">`;
    }
    else if (reportId === 'student_history') {
        html += `<input type="text" id="f_search" placeholder="Search Student/Roll..." class="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 w-48">`;
    }

    if (['outstanding', 'late_payment', 'discounts'].includes(reportId)) {
        html += `<select id="f_class" class="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 dark:border-gray-600">
            <option value="">All Classes</option>
            ${Array.from(classRank.keys()).map(c => `<option value="${c}">${c}</option>`).join('')}
         </select>`;
    }

    html += `<button onclick="window.runReport()" class="px-3 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-sm font-medium rounded transition-colors dark:bg-indigo-900/50 dark:text-indigo-300">Run</button>`;

    container.innerHTML = html;
}

// --- Report Entry Point ---
window.runReport = async () => {
    const loader = document.getElementById('reportLoader');
    loader.classList.remove('hidden');

    try {
        const filters = getFilterValues();
        let headers = [];
        let rows = [];
        let footer = {};

        // Dispatch to specific handler
        switch (activeReport) {
            case 'daily_collection':
                ({ headers, rows, footer } = await reportDailyCollection(filters));
                break;
            case 'monthly_collection':
                ({ headers, rows, footer } = await reportMonthlyCollection(filters));
                break;
            case 'outstanding':
                ({ headers, rows, footer } = await reportOutstanding(filters));
                break;
            case 'fee_type':
                ({ headers, rows, footer } = await reportFeeType(filters));
                break;
            case 'payment_mode':
                ({ headers, rows, footer } = await reportPaymentMode(filters));
                break;
            case 'discounts':
                ({ headers, rows, footer } = await reportDiscounts(filters));
                break;
            case 'late_payment':
                ({ headers, rows, footer } = await reportLatePayment(filters));
                break;
            case 'custom_filter':
                ({ headers, rows, footer } = await reportCustom(filters));
                break;
            case 'student_history':
                ({ headers, rows, footer } = await reportStudentHistory(filters));
                break;
            case 'class_collection':
                ({ headers, rows, footer } = await reportClassCollection(filters));
                break;
            default:
                ({ headers, rows, footer } = { headers: ['Notice'], rows: [['Report logic not found']], footer: {} });
        }

        renderTable(headers, rows, footer);

    } catch (err) {
        console.error("Report Error", err);
        alert("Error generating report: " + err.message);
    } finally {
        loader.classList.add('hidden');
    }
}

function getFilterValues() {
    return {
        date: document.getElementById('f_date')?.value,
        month: document.getElementById('f_month')?.value,
        start: document.getElementById('f_start')?.value,
        end: document.getElementById('f_end')?.value,
        feeType: document.getElementById('f_feetype')?.value,
        search: document.getElementById('f_search')?.value?.toLowerCase(),
        class: document.getElementById('f_class')?.value,
    };
}

// --- Report Logic Implementations ---

// 1. Daily Collection
async function reportDailyCollection(filters) {
    const { data: payments } = await supabase
        .from('fee_payments')
        .select('*, students(id, name, class, roll_no), fees(fee_type)')
        .eq('payment_date', filters.date);

    if (!payments) return { headers: ['No Data'], rows: [] };

    // Aggregate by Family Rep
    const agg = new Map();

    payments.forEach(p => {
        const rep = familyMap.get(p.student_id);
        if (!rep) return; // Should not happen

        if (!agg.has(rep.id)) {
            agg.set(rep.id, {
                rep: rep,
                amount: 0,
                modes: new Set(),
                siblings_paid_for: new Set() // For info only
            });
        }
        const entry = agg.get(rep.id);
        entry.amount += Number(p.amount_paid);
        entry.modes.add(p.payment_method);
        if (p.students.id !== rep.id) entry.siblings_paid_for.add(`${p.students.name} (${p.students.class})`);
    });

    const rows = Array.from(agg.values()).map(item => [
        item.rep.name,
        `${item.rep.class} (${item.rep.roll_no})`, // Highest Class
        item.rep.father_cnic || '-',
        Array.from(item.modes).join(', '),
        item.siblings_paid_for.size > 0 ? Array.from(item.siblings_paid_for).join(', ') : 'Self',
        formatMoney(item.amount)
    ]);

    const total = Array.from(agg.values()).reduce((sum, i) => sum + i.amount, 0);

    return {
        headers: ['Representative Student', 'Class (Roll)', 'Family ID', 'Pay Mode', 'Paid For', 'Amount'],
        rows: rows,
        footer: { label: 'Total Collected', value: formatMoney(total) }
    };
}

// 2. Monthly Collection
async function reportMonthlyCollection(filters) {
    if (!filters.month) return { headers: ['Please select a month'], rows: [] };

    // We want FEES for this month that are PAID or PARTIAL
    const { data: fees } = await supabase
        .from('fees')
        .select('*, students(id, name, class, roll_no)')
        .eq('month', filters.month)
        .gt('paid_amount', 0); // Only touched fees

    if (!fees) return { headers: ['No Data'], rows: [] };

    const agg = new Map();
    fees.forEach(f => {
        const rep = familyMap.get(f.student_id);
        if (!rep) return;

        if (!agg.has(rep.id)) {
            agg.set(rep.id, { rep, total_paid: 0, status: new Set() });
        }
        const entry = agg.get(rep.id);
        entry.total_paid += Number(f.paid_amount);
        entry.status.add(f.status);
    });

    const rows = Array.from(agg.values()).map(item => [
        item.rep.name,
        item.rep.class,
        formatMoney(item.total_paid),
        Array.from(item.status).join(', ')
    ]);

    const total = Array.from(agg.values()).reduce((sum, i) => sum + i.total_paid, 0);

    return {
        headers: ['Family Rep', 'Class', 'Total Paid', 'Status'],
        rows: rows,
        footer: { label: 'Total Monthly', value: formatMoney(total) }
    };
}

// 3. Outstanding
async function reportOutstanding(filters) {
    let query = supabase
        .from('fees')
        .select('*, students(id, name, class, roll_no)')
        .neq('status', 'paid'); // Everything not fully paid

    // Filter by class (on DB or Client? Client is safe for now as filtering students is tricky in join)
    const { data: fees } = await query;
    if (!fees) return { headers: ['No Data'], rows: [] };

    // Aggregate
    const agg = new Map();

    fees.forEach(f => {
        const rep = familyMap.get(f.student_id);
        if (!rep) return;

        // Class filter
        if (filters.class && rep.class !== filters.class) return;

        if (!agg.has(rep.id)) agg.set(rep.id, { rep, pending: 0, months: new Set() });

        const entry = agg.get(rep.id);
        entry.pending += (Number(f.final_amount) - Number(f.paid_amount));
        entry.months.add(f.month);
    });

    const rows = Array.from(agg.values()).map(item => [
        item.rep.name,
        item.rep.class,
        item.months.size, // Count of pending months
        formatMoney(item.pending)
    ]);

    const total = Array.from(agg.values()).reduce((sum, i) => sum + i.pending, 0);

    return {
        headers: ['Family Rep', 'Class', 'Months Pending', 'Total Outstanding'],
        rows: rows,
        footer: { label: 'Total Outstanding', value: formatMoney(total) }
    };
}

// 4. Fee Type Report
async function reportFeeType(filters) {
    if (!filters.month) return { headers: ['Select Month'], rows: [] };

    let query = supabase
        .from('fees')
        .select('*, students(id, name, class)')
        .eq('month', filters.month);

    if (filters.feeType) {
        query = query.eq('fee_type', filters.feeType);
    } else {
        // Exclude 0 amount fees if showing all types? No, show all generated.
    }

    const { data: fees } = await query;
    if (!fees) return { headers: ['No Data'], rows: [] };

    const agg = new Map();
    fees.forEach(f => {
        const rep = familyMap.get(f.student_id);
        if (!rep) return;

        if (!agg.has(rep.id)) agg.set(rep.id, { rep, final: 0, paid: 0, types: new Set() });
        const e = agg.get(rep.id);
        e.final += Number(f.final_amount);
        e.paid += Number(f.paid_amount);
        e.types.add(f.fee_type);
    });

    const rows = Array.from(agg.values()).map(i => [
        i.rep.name,
        i.rep.class,
        Array.from(i.types).join(', ').slice(0, 50) + (i.types.size > 3 ? '...' : ''),
        formatMoney(i.final),
        formatMoney(i.paid),
        formatMoney(i.final - i.paid)
    ]);

    const total = Array.from(agg.values()).reduce((s, i) => s + i.paid, 0);

    return {
        headers: ['Representative', 'Class', 'Fee Types', 'Assigned', 'Paid', 'Balance'],
        rows: rows,
        footer: { label: 'Total Paid', value: formatMoney(total) }
    };
}

// 5. Payment Mode Report
async function reportPaymentMode(filters) {
    const { data: payments } = await supabase
        .from('fee_payments')
        .select('*')
        .gte('payment_date', filters.start)
        .lte('payment_date', filters.end);

    if (!payments) return { headers: ['No Data'], rows: [] };

    const agg = new Map(); // Key: RepId
    const methods = ['Cash', 'Bank', 'Easypaisa', 'JazzCash', 'Cheque', 'Other'];

    payments.forEach(p => {
        const rep = familyMap.get(p.student_id);
        if (!rep) return;

        if (!agg.has(rep.id)) {
            agg.set(rep.id, { rep, total: 0, breakdown: {} });
            methods.forEach(m => agg.get(rep.id).breakdown[m] = 0);
        }

        const entry = agg.get(rep.id);
        const method = methods.includes(p.payment_method) ? p.payment_method : 'Other';
        entry.breakdown[method] += Number(p.amount_paid);
        entry.total += Number(p.amount_paid);
    });

    const rows = Array.from(agg.values()).map(i => [
        i.rep.name,
        i.rep.class,
        ...methods.map(m => formatMoney(i.breakdown[m] || 0)),
        formatMoney(i.total)
    ]);

    const total = Array.from(agg.values()).reduce((s, i) => s + i.total, 0);

    return {
        headers: ['Representative', 'Class', ...methods, 'Total'],
        rows: rows,
        footer: { label: 'Grand Total', value: formatMoney(total) }
    };
}

// 6. Discounts (Fees where amount > final_amount)
async function reportDiscounts(filters) {
    // We assume discount = amount - final_amount > 0
    let query = supabase.from('fees').select('*, students(id)');
    // Supabase JS doesn't support col comparison easily directly? 
    // Fallback: fetch fees with amount > 0 and filter in JS

    const { data: fees } = await query;
    if (!fees) return { headers: ['No Data'], rows: [] };

    const discountFees = fees.filter(f => Number(f.amount) > Number(f.final_amount));

    if (filters.month) {
        // Filter by month in JS
        // Actually filtering array is easier
    }

    const agg = new Map();
    discountFees.forEach(f => {
        const rep = familyMap.get(f.student_id);
        if (!rep) return;
        if (filters.class && rep.class !== filters.class) return;

        if (!agg.has(rep.id)) agg.set(rep.id, { rep, discount: 0, original: 0 });
        const e = agg.get(rep.id);

        const disc = Number(f.amount) - Number(f.final_amount);
        e.discount += disc;
        e.original += Number(f.amount);
    });

    const rows = Array.from(agg.values()).map(i => [
        i.rep.name,
        i.rep.class,
        formatMoney(i.original),
        formatMoney(i.discount)
    ]);

    const total = Array.from(agg.values()).reduce((s, i) => s + i.discount, 0);

    return {
        headers: ['Representative', 'Class', 'Original Fee', 'Discount Given'],
        rows: rows,
        footer: { label: 'Total Discounts', value: formatMoney(total) }
    };
}

// 7. Late Payment
async function reportLatePayment(filters) {
    // Logic: Unpaid fees from previous months
    const currentMonth = new Date().toISOString().slice(0, 7);

    const { data: fees } = await supabase
        .from('fees')
        .select('*')
        .lt('month', currentMonth)
        .neq('status', 'paid');

    if (!fees) return { headers: ['No Data'], rows: [] };

    const agg = new Map();
    fees.forEach(f => {
        const rep = familyMap.get(f.student_id);
        if (!rep) return;
        if (filters.class && rep.class !== filters.class) return;

        if (!agg.has(rep.id)) agg.set(rep.id, { rep, count: 0, amount: 0 });
        const e = agg.get(rep.id);
        const pend = Number(f.final_amount) - Number(f.paid_amount);
        e.amount += pend;
        e.count++;
    });

    const rows = Array.from(agg.values()).map(i => [
        i.rep.name,
        i.rep.class,
        i.count,
        formatMoney(i.amount)
    ]);
    const total = Array.from(agg.values()).reduce((s, i) => s + i.amount, 0);

    return {
        headers: ['Representative', 'Class', 'Months Overdue', 'Total Arrears'],
        rows: rows,
        footer: { label: 'Total Arrears', value: formatMoney(total) }
    };
}

// 8. Custom Filter
async function reportCustom(filters) {
    // Very similar to Fee Type but broader
    let result = await reportFeeType({
        month: filters.month || new Date().toISOString().slice(0, 7),
        feeType: filters.feeType
    });
    // Can filter rows by class here if needed
    if (filters.class) {
        result.rows = result.rows.filter(r => r[1] === filters.class);
    }
    return result;
}

// 9. Student History
async function reportStudentHistory(filters) {
    if (!filters.search) return { headers: ['Search Required'], rows: [['Please enter a name or roll number to search.']] };

    // Find student ID
    const { data: students } = await supabase
        .from('students')
        .select('id, name, roll_no, class')
        .or(`name.ilike.%${filters.search}%,roll_no.ilike.%${filters.search}%`)
        .limit(1);

    if (!students || students.length === 0) return { headers: ['Not Found'], rows: [['Student not found.']] };

    const student = students[0];

    // Fetch Fees
    const { data: fees } = await supabase
        .from('fees')
        .select('*')
        .eq('student_id', student.id)
        .order('month', { ascending: false });

    const rows = (fees || []).map(f => [
        f.month,
        f.fee_type,
        formatMoney(f.final_amount),
        formatMoney(f.paid_amount),
        formatMoney(f.final_amount - f.paid_amount),
        f.status.toUpperCase()
    ]);

    return {
        headers: [`History for ${student.name} (${student.roll_no}) - Month`, 'Fee Type', 'Amount', 'Paid', 'Balance', 'Status'],
        rows: rows,
        footer: {} // No meaningful total for mixed types
    };
}

// 10. Class Collection (Group by Rep Class)
async function reportClassCollection(filters) {
    if (!filters.month) return { headers: ['Select Month'], rows: [] };

    // Fetch payments in this month (or fees?)
    // "Aggregated fees collected per class for the month" -> Payments made in this month OR Fees for this month collected?
    // Usually "Monthly Collection Report" key is "Fees collected in this month" regardless of fee month (cash flow)
    // OR "Fees generated for this month that are collected" (accrual matching)
    // Let's assume Cash Flow: Payments made in the selected month (date-wise check, input is month YYYY-MM)

    // Actually, reportMonthlyCollection used Fees table 'month' column. That implies Accrual view (Fees belonging to Jan, collected whenever).
    // Let's stick to Accrual view for consistency with report 2, OR switch to Payments view if "Sales" perspective is needed.
    // "Collection Report" usually implies Cash Received.
    // Let's use `fees` table `paid_amount` where `month` == selected month. This shows how much of Jan fees were recovered.

    const { data: fees } = await supabase
        .from('fees')
        .select('paid_amount, student_id')
        .eq('month', filters.month)
        .gt('paid_amount', 0);

    const classAgg = new Map(); // ClassName -> Total

    if (fees) {
        fees.forEach(f => {
            const rep = familyMap.get(f.student_id);
            if (!rep) return;
            // The collection counts towards the Rep's Class
            const cls = rep.class;
            if (!classAgg.has(cls)) classAgg.set(cls, 0);
            classAgg.set(cls, classAgg.get(cls) + Number(f.paid_amount));
        });
    }

    const rows = Array.from(classAgg.entries())
        .sort((a, b) => (classRank.get(a[0]) || 0) - (classRank.get(b[0]) || 0)) // Sort by class rank (asc)
        .map(([cls, amount]) => [
            cls,
            formatMoney(amount)
        ]);

    const total = Array.from(classAgg.values()).reduce((sum, v) => sum + v, 0);

    return {
        headers: ['Class (Highest Sibling)', 'Total Collected (Family Adjusted)'],
        rows: rows,
        footer: { label: 'Total', value: formatMoney(total) }
    };
}



// --- Utils ---
function formatMoney(amount) {
    return 'Rs ' + parseFloat(amount).toLocaleString();
}

// --- Export & Print ---
window.exportReport = (type) => {
    const title = document.getElementById('reportTitle').textContent;
    const subtitle = document.getElementById('reportSubtitle').textContent;

    // Get Headers
    const headers = Array.from(document.querySelectorAll('#tableHeaderRow th')).map(th => th.textContent.trim());

    // Get Rows
    const rows = Array.from(document.querySelectorAll('#tableBody tr')).map(tr =>
        Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim())
    );

    // Get Footer if visible
    const tfoot = document.getElementById('tableFooter');
    let footerRow = null;
    if (!tfoot.classList.contains('hidden')) {
        // Footer structure is tricky: first cell has colspan.
        // We'll just grab the text content of the two cells usually present
        const cells = tfoot.querySelectorAll('td');
        if (cells.length >= 2) {
            // We need to pad the beginning with empty strings to match column count
            // Standard footer: [Label (colspan=N-1), Value]
            // CSV: [Label, "", ..., Value]
            const label = cells[0].textContent.trim();
            const value = cells[cells.length - 1].textContent.trim();

            footerRow = new Array(headers.length).fill('');
            footerRow[0] = label;
            footerRow[headers.length - 1] = value;
        }
    }

    if (type === 'csv') {
        let csvContent = "data:text/csv;charset=utf-8,";

        // Add Title info
        csvContent += `"${title}"\n"${subtitle}"\n\n`;

        // Add Headers
        csvContent += headers.map(h => `"${h}"`).join(",") + "\n";

        // Add Rows
        rows.forEach(row => {
            csvContent += row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",") + "\n";
        });

        // Add Footer
        if (footerRow) {
            csvContent += footerRow.map(cell => `"${cell}"`).join(",") + "\n";
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    else if (type === 'print') {
        const printWindow = window.open('', '', 'height=800,width=1000');

        const tableHtml = document.querySelector('table').outerHTML;

        printWindow.document.write(`
            <html>
                <head>
                    <title>${title} - Print</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        body { font-family: sans-serif; padding: 40px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f3f4f6; color: #374151; }
                        tr:nth-child(even) { background-color: #f9fafb; }
                        .text-right { text-align: right; }
                        .font-bold { font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="flex flex-col items-center text-center mb-8">
                        <img src="/assets/images/school-logo.jpg" alt="School Logo" style="width: 80px; height: 80px; margin-bottom: 12px; object-fit: contain;">
                        <h1 class="text-2xl font-bold text-gray-800 uppercase tracking-wide">The Suffah School</h1>
                        <h2 class="text-xl font-semibold text-indigo-700 mt-2">${title}</h2>
                        <p class="text-sm text-gray-500 mt-1">${subtitle}</p>
                    </div>
                    
                    ${tableHtml}
                    
                    <div class="mt-8 text-xs text-center text-gray-400 border-t pt-4">
                        Generated from School Management System | Printed on ${new Date().toLocaleString()}
                    </div>
                    <script>
                        // Auto-print after small delay to allow image load
                        window.onload = function() {
                            setTimeout(() => {
                                window.print();
                            }, 800);
                        }
                    </script>
                </body>
            </html>
        `);

        printWindow.document.close();
    }
};

function renderTable(headers, rows, footer) {
    const thead = document.getElementById('tableHeaderRow');
    const tbody = document.getElementById('tableBody');
    const tfoot = document.getElementById('tableFooter');

    thead.innerHTML = headers.map(h => `<th class="px-6 py-3 whitespace-nowrap">${h}</th>`).join('');

    if (rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="${headers.length}" class="px-6 py-8 text-center text-gray-400">No records found matching filters.</td></tr>`;
        tfoot.classList.add('hidden');
        return;
    }

    tbody.innerHTML = rows.map(r => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            ${r.map(cell => `<td class="px-6 py-3 whitespace-nowrap">${cell}</td>`).join('')}
        </tr>
    `).join('');

    if (footer && footer.value) {
        tfoot.innerHTML = `
            <tr>
                <td colspan="${headers.length - 1}" class="px-6 py-3 text-right text-gray-500">${footer.label}</td>
                <td class="px-6 py-3 text-indigo-600 dark:text-indigo-400">${footer.value}</td>
            </tr>
        `;
        tfoot.classList.remove('hidden');
    } else {
        tfoot.classList.add('hidden');
    }
}
