// fee_reports.js - Fee Reporting Module
// Handles complex reporting with family-based aggregation (Highest Class Sibling Rule)

const supabase = window.supabase || (() => { throw new Error('Supabase not init'); })();

// --- State ---
let activeReport = 'daily_collection';
let familyMap = new Map(); // Map<StudentId, RepresentativeStudent>
let classRank = new Map(); // Map<ClassName, RankNumber>
let studentsMap = new Map(); // Map<StudentId, StudentObj>
let feeTypes = [];
let defaultersData = []; // processed rows for defaulters report
let allClassesList = []; // full class list for defaulters filters
let isDefaultersMode = false; // track if we're in defaulters mode

// --- Config ---
const REPORTS = [
    { id: 'daily_collection', label: 'Daily Fee Collection', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2' },
    { id: 'daily_summary', label: 'Income & Expense Today (Profit)', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'monthly_collection', label: 'Monthly Collection', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'outstanding', label: 'Outstanding / Pending', icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'fee_type', label: 'Fee Type Report', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2' },
    { id: 'payment_mode', label: 'Payment Mode', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    { id: 'discounts', label: 'Discounts / Concessions', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
    { id: 'late_payment', label: 'Late / Overdue', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'custom_filter', label: 'Custom / Filtered', icon: 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z' },
    { id: 'student_history', label: 'Student History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'class_collection', label: 'Class Collection', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { id: 'defaulters', label: 'Defaulters Report (Family)', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' }
];

// --- Main Render ---
export async function render(container) {
    container.innerHTML = `
        <div class="flex flex-col gap-4 md:gap-6 h-[calc(100vh-100px)] min-h-0 flex-1">
            <!-- Mobile: report type dropdown (full width); Desktop: sidebar + content -->
            <div class="flex flex-col md:flex-row gap-4 md:gap-6 flex-1 min-h-0">
                <!-- Mobile-only report type selector -->
                <div class="md:hidden w-full shrink-0">
                    <label for="reportTypeSelect" class="sr-only">Report type</label>
                    <select id="reportTypeSelect" class="w-full px-3 py-2.5 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500">
                        ${REPORTS.map(r => `<option value="${r.id}" ${activeReport === r.id ? 'selected' : ''}>${r.label}</option>`).join('')}
                    </select>
                </div>

                <!-- Sidebar (desktop only) -->
                <div class="hidden md:flex w-64 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex-col overflow-hidden shrink-0">
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
                <div id="reportContentArea" class="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <!-- Filters Toolbar -->
                    <div class="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 flex flex-wrap gap-3 items-center shrink-0" id="reportFilters">
                        <span class="text-gray-400 text-sm">Loading filters...</span>
                    </div>

                    <!-- Report Header & Actions -->
                    <div class="px-4 md:px-6 py-4 flex flex-wrap justify-between items-center gap-2 border-b border-gray-50 dark:border-gray-800 shrink-0">
                        <div>
                            <h2 class="text-lg font-bold text-gray-800 dark:text-white" id="reportTitle">Report</h2>
                            <p class="text-xs text-gray-500" id="reportSubtitle">Generated on ${new Date().toLocaleDateString()}</p>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="window.exportReport('csv')" class="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Export CSV</button>
                            <button onclick="window.exportReport('print')" class="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 dark:shadow-none">Print PDF</button>
                        </div>
                    </div>

                    <!-- Data Table (only this area scrolls) -->
                    <div class="flex-1 min-h-0 overflow-auto relative">
                        <div id="reportLoader" class="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center z-10 hidden">
                            <div class="flex flex-col items-center">
                                <div class="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                <span class="text-xs font-medium text-indigo-600 mt-2">Generating Report...</span>
                            </div>
                        </div>
                        <div class="overflow-x-auto min-h-0 h-full">
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
            </div>
        </div>
    `;

    // Mobile report type dropdown: when user changes selection, switch report
    const reportTypeSelect = document.getElementById('reportTypeSelect');
    if (reportTypeSelect) {
        reportTypeSelect.addEventListener('change', () => {
            window.selectReport(reportTypeSelect.value);
        });
    }

    // Init Logic
    await initStructure();
    const initialReport = window.dashboardReportTarget || 'daily_collection';
    if (window.dashboardReportTarget) delete window.dashboardReportTarget;
    window.selectReport(initialReport);
}

// --- Initialization ---
async function initStructure() {
    // 1. Fetch Classes for Ranking
    const { data: classes } = await supabase.from('classes').select('*');
    if (classes) {
        if (window.sortClassesNatural) window.sortClassesNatural(classes, 'class_name');
        allClassesList = classes; // Store for defaulters filters
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

    // Check if still on reports page
    const contentArea = document.getElementById('reportContentArea');
    if (!contentArea) return; // User navigated away

    // Update Sidebar UI (desktop)
    document.querySelectorAll('[id^="btn-"]').forEach(btn => {
        if (btn.id === `btn-${reportIds}`) {
            btn.classList.add('bg-indigo-50', 'text-indigo-700', 'dark:bg-indigo-900/20', 'dark:text-indigo-300');
            btn.classList.remove('text-gray-600', 'dark:text-gray-400');
        } else {
            btn.classList.remove('bg-indigo-50', 'text-indigo-700', 'dark:bg-indigo-900/20', 'dark:text-indigo-300');
            btn.classList.add('text-gray-600', 'dark:text-gray-400');
        }
    });
    // Sync mobile dropdown
    const reportTypeSelect = document.getElementById('reportTypeSelect');
    if (reportTypeSelect) reportTypeSelect.value = reportIds;

    // Special case: Defaulters Report has its own UI
    if (reportIds === 'defaulters') {
        isDefaultersMode = true;
        contentArea.innerHTML = getDefaultersHTML();
        initDefaultersFilters();
        return;
    }

    // Restore normal layout if coming from defaulters mode
    if (isDefaultersMode) {
        isDefaultersMode = false;
        contentArea.innerHTML = getNormalContentHTML();
    }

    const reportConfig = REPORTS.find(r => r.id === reportIds);
    const titleEl = document.getElementById('reportTitle');
    if (titleEl) titleEl.textContent = reportConfig.label;

    // Setup Filters
    setupFilters(reportIds);

    // Initial Run
    runReport();
}

function setupFilters(reportId) {
    const container = document.getElementById('reportFilters');
    if (!container) return; // User navigated away
    let html = '';
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

    if (reportId === 'daily_collection') {
        html += `<input type="date" id="f_date" value="${today}" class="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white">`;
    }
    else if (reportId === 'daily_summary') {
        html += `<span class="text-sm text-gray-500 dark:text-gray-400">Date: <strong>${today}</strong> (Income &amp; Expense Today)</span>`;
    }
    else if (reportId === 'monthly_collection' || reportId === 'class_collection') {
        html += `<input type="month" id="f_month" value="${currentMonth}" class="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white">`;
    }
    else if (reportId === 'payment_mode' || reportId === 'custom_filter') {
        html += `<input type="date" id="f_start" value="${today}" class="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white">`;
        html += `<span class="text-xs">to</span>`;
        html += `<input type="date" id="f_end" value="${today}" class="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white">`;
    }
    else if (reportId === 'fee_type') {
        html += `<select id="f_feetype" class="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white">
            <option value="" class="bg-white dark:bg-gray-800">All Fee Types</option>
            ${feeTypes.map(t => `<option value="${t.name}" class="bg-white dark:bg-gray-800">${t.name}</option>`).join('')}
         </select>`;
        html += `<input type="month" id="f_month" value="${currentMonth}" class="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white">`;
    }
    else if (reportId === 'student_history') {
        html += `<input type="text" id="f_search" placeholder="Search Student/Roll..." class="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 w-48 text-gray-900 dark:text-white">`;
    }

    if (['outstanding', 'late_payment', 'discounts'].includes(reportId)) {
        html += `<select id="f_class" class="border rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-white">
            <option value="" class="bg-white dark:bg-gray-800">All Classes</option>
            ${Array.from(classRank.keys()).map(c => `<option value="${c}" class="bg-white dark:bg-gray-800">${c}</option>`).join('')}
         </select>`;
    }

    html += `<button onclick="window.runReport()" class="px-3 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-sm font-medium rounded transition-colors dark:bg-indigo-900/50 dark:text-indigo-300">Run</button>`;

    container.innerHTML = html;
}

// --- Report Entry Point ---
window.runReport = async () => {
    const loader = document.getElementById('reportLoader');
    if (!loader) return; // User navigated away, abort silently
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
            case 'daily_summary':
                ({ headers, rows, footer } = await reportDailySummary(filters));
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

        // Check if user navigated away during async fetch
        if (!document.getElementById('tableHeaderRow')) return;

        renderTable(headers, rows, footer);

    } catch (err) {
        console.error("Report Error", err);
        // Only show alert if still on reports page
        if (document.getElementById('reportLoader')) {
            alert("Error generating report: " + err.message);
        }
    } finally {
        const loaderEl = document.getElementById('reportLoader');
        if (loaderEl) loaderEl.classList.add('hidden');
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

// 1b. Income & Expense Today (Profit Report) – with income and expense details
async function reportDailySummary() {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    const dateLabel = today.toLocaleDateString('en-PK', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

    const [{ data: payments }, { data: expenses }] = await Promise.all([
        supabase.from('fee_payments').select('id, amount_paid, payment_method, payment_date, students(name)').eq('payment_date', todayStr).order('created_at', { ascending: true }),
        supabase.from('expenses').select('id, title, category, amount, date').eq('date', todayStr).order('created_at', { ascending: true })
    ]);

    const rows = [];
    let incomeTotal = 0;
    let expenseTotal = 0;

    // Income details
    (payments || []).forEach(p => {
        const amt = parseFloat(p.amount_paid) || 0;
        incomeTotal += amt;
        const particular = (p.students && p.students.name) ? `Fee payment – ${p.students.name}` : 'Fee payment';
        rows.push(['Income', particular, formatMoney(amt), p.payment_method || '–']);
    });

    // Expense details
    (expenses || []).forEach(e => {
        const amt = parseFloat(e.amount) || 0;
        expenseTotal += amt;
        rows.push(['Expense', e.title || '–', formatMoney(amt), e.category || '–']);
    });

    const net = incomeTotal - expenseTotal;

    // Summary rows
    if (rows.length > 0) rows.push(['', '', '', '']);
    rows.push(['', 'Total Income', formatMoney(incomeTotal), '']);
    rows.push(['', 'Total Expense', formatMoney(expenseTotal), '']);
    rows.push(['', 'Net Today', formatMoney(net), '']);

    return {
        headers: ['Type', 'Particular', 'Amount (PKR)', 'Method / Category'],
        rows: rows.length ? rows : [['–', 'No income or expense recorded for ' + dateLabel, '–', '–']],
        footer: { label: 'Net Today', value: formatMoney(net) }
    };
}

// 2. Monthly Collection (based on actual payments received in the selected month)
async function reportMonthlyCollection(filters) {
    if (!filters.month) return { headers: ['Please select a month'], rows: [] };

    const [y, m] = filters.month.split('-').map(Number);
    const startDate = `${filters.month}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${filters.month}-${String(lastDay).padStart(2, '0')}`;

    const { data: payments } = await supabase
        .from('fee_payments')
        .select('id, amount_paid, payment_date, payment_method, student_id, students(id, name, class, roll_no)')
        .gte('payment_date', startDate)
        .lte('payment_date', endDate);

    if (!payments || payments.length === 0) {
        return {
            headers: ['Family Rep', 'Class', 'Total Paid', 'Payment Methods'],
            rows: [],
            footer: { label: 'Total Monthly', value: formatMoney(0) }
        };
    }

    const agg = new Map();
    payments.forEach(p => {
        const rep = familyMap.get(p.student_id);
        if (!rep) return;

        if (!agg.has(rep.id)) {
            agg.set(rep.id, { rep, total_paid: 0, methods: new Set() });
        }
        const entry = agg.get(rep.id);
        entry.total_paid += Number(p.amount_paid || 0);
        if (p.payment_method) entry.methods.add(p.payment_method);
    });

    const rows = Array.from(agg.values()).map(item => [
        item.rep.name,
        item.rep.class || '-',
        formatMoney(item.total_paid),
        Array.from(item.methods).join(', ') || '-'
    ]);

    const total = Array.from(agg.values()).reduce((sum, i) => sum + i.total_paid, 0);

    return {
        headers: ['Family Rep', 'Class', 'Total Paid', 'Payment Methods'],
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
        const fAmt = Number(f.amount || 0) - Number(f.discount || 0);
        entry.pending += Math.max(0, fAmt - Number(f.paid_amount || 0));
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
        e.final += Math.max(0, Number(f.amount || 0) - Number(f.discount || 0));
        e.paid += Number(f.paid_amount || 0);
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

    const discountFees = fees.filter(f => Number(f.discount || 0) > 0);

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

        const disc = Number(f.discount || 0);
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
        const fNet = Math.max(0, Number(f.amount || 0) - Number(f.discount || 0));
        const pend = Math.max(0, fNet - Number(f.paid_amount || 0));
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

    const rows = (fees || []).map(f => {
        const netAmt = Math.max(0, Number(f.amount || 0) - Number(f.discount || 0));
        const paidAmt = Number(f.paid_amount || 0);
        return [
            f.month,
            f.fee_type,
            formatMoney(netAmt),
            formatMoney(paidAmt),
            formatMoney(Math.max(0, netAmt - paidAmt)),
            f.status.toUpperCase()
        ];
    });

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
            classAgg.set(cls, classAgg.get(cls) + Number(f.paid_amount || 0));
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



// ========================================================================
// DEFAULTERS REPORT (Family Senior Students List) - Integrated Sub-Report
// ========================================================================

function drGetCurrentSession() {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    if (m >= 4) return `${y}-${y + 1}`;
    return `${y - 1}-${y}`;
}

function drGetCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function drPrevMonth(ym) {
    const [y, m] = ym.split('-').map(Number);
    if (m === 1) return `${y - 1}-12`;
    return `${y}-${String(m - 1).padStart(2, '0')}`;
}

function drMonthToNum(ym) {
    if (!ym) return 0;
    const [y, m] = ym.split('-').map(Number);
    return y * 12 + m;
}

function drGetClassRank(className) {
    if (!className) return 999;
    const rank = classRank.get(className);
    if (rank !== undefined) return rank;
    const num = parseInt(String(className).replace(/\D/g, ''));
    return isNaN(num) ? 999 : num;
}

function getNormalContentHTML() {
    const today = new Date().toLocaleDateString();
    return `
        <!-- Filters Toolbar -->
        <div class="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 flex flex-wrap gap-3 items-center shrink-0" id="reportFilters">
            <span class="text-gray-400 text-sm">Loading filters...</span>
        </div>
        <!-- Report Header & Actions -->
        <div class="px-4 md:px-6 py-4 flex flex-wrap justify-between items-center gap-2 border-b border-gray-50 dark:border-gray-800">
            <div>
                <h2 class="text-lg font-bold text-gray-800 dark:text-white" id="reportTitle">Report</h2>
                <p class="text-xs text-gray-500" id="reportSubtitle">Generated on ${today}</p>
            </div>
            <div class="flex gap-2">
                <button onclick="window.exportReport('csv')" class="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-200 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Export CSV</button>
                <button onclick="window.exportReport('print')" class="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200 dark:shadow-none">Print PDF</button>
            </div>
        </div>
        <!-- Data Table (only this area scrolls) -->
        <div class="flex-1 min-h-0 overflow-auto relative">
            <div id="reportLoader" class="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center z-10 hidden">
                <div class="flex flex-col items-center">
                    <div class="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <span class="text-xs font-medium text-indigo-600 mt-2">Generating Report...</span>
                </div>
            </div>
            <div class="overflow-x-auto min-h-0 h-full">
                <table class="w-full text-left text-sm border-collapse">
                    <thead class="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium sticky top-0 z-0">
                        <tr id="tableHeaderRow"></tr>
                    </thead>
                    <tbody id="tableBody" class="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300"></tbody>
                    <tfoot id="tableFooter" class="bg-gray-50 dark:bg-gray-800 border-t-2 border-gray-100 dark:border-gray-700 font-bold hidden"></tfoot>
                </table>
            </div>
        </div>
    `;
}

function getDefaultersHTML() {
    return `
        <!-- Defaulters Report Options - Compact -->
        <div class="px-3 py-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20">
            <div class="flex items-center justify-between mb-1.5">
                <h3 class="text-xs font-bold text-gray-800 dark:text-white flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
                    Report Options
                </h3>
                <span class="text-[10px] text-gray-400 dark:text-gray-500">Family Senior Students List</span>
            </div>
            <div class="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-1.5 mb-1.5">
                <div>
                    <label class="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5">Session</label>
                    <input type="text" id="dr_session" value="${drGetCurrentSession()}" class="w-full border border-gray-200 dark:border-gray-600 rounded px-1.5 py-1 text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500 focus:border-transparent" placeholder="2025-2026">
                </div>
                <div>
                    <label class="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5">Class</label>
                    <select id="dr_class" class="w-full border border-gray-200 dark:border-gray-600 rounded px-1.5 py-1 text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500">
                        <option value="all">ALL</option>
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5">Section</label>
                    <select id="dr_section" class="w-full border border-gray-200 dark:border-gray-600 rounded px-1.5 py-1 text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500">
                        <option value="all">ALL</option>
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5">Gender</label>
                    <select id="dr_gender" class="w-full border border-gray-200 dark:border-gray-600 rounded px-1.5 py-1 text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500">
                        <option value="all">ALL</option>
                        <option value="Male">Boys</option>
                        <option value="Female">Girls</option>
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5">Status</label>
                    <select id="dr_status" class="w-full border border-gray-200 dark:border-gray-600 rounded px-1.5 py-1 text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500">
                        <option value="active" selected>Regular</option>
                        <option value="inactive">Left</option>
                        <option value="all">All</option>
                    </select>
                </div>
                <div>
                    <label class="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5">Upto Month</label>
                    <input type="month" id="dr_upto_month" value="${drGetCurrentMonth()}" class="w-full border border-gray-200 dark:border-gray-600 rounded px-1.5 py-1 text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500">
                </div>
                <div>
                    <label class="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5">Min Outstanding</label>
                    <input type="number" id="dr_min_dues" value="0" min="0" class="w-full border border-gray-200 dark:border-gray-600 rounded px-1.5 py-1 text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500">
                </div>
                <div>
                    <label class="block text-[10px] font-medium text-gray-500 dark:text-gray-400 mb-0.5">Months Def.</label>
                    <input type="number" id="dr_months_def" value="" min="0" placeholder="Any" class="w-full border border-gray-200 dark:border-gray-600 rounded px-1.5 py-1 text-[11px] bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-indigo-500">
                </div>
                <div class="flex items-end gap-1.5 col-span-2">
                    <label class="flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-300 cursor-pointer whitespace-nowrap">
                        <input type="checkbox" id="dr_exclude_paid" class="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 w-3 h-3">
                        Excl. paid
                    </label>
                    <label class="flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-300 cursor-pointer whitespace-nowrap">
                        <input type="checkbox" id="dr_exclude_pending" class="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 w-3 h-3">
                        Excl. pending
                    </label>
                    <label class="flex items-center gap-1 text-[10px] text-gray-600 dark:text-gray-300 cursor-pointer whitespace-nowrap">
                        <input type="checkbox" id="dr_non_defaulters" class="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 w-3 h-3">
                        Non-def. only
                    </label>
                </div>
            </div>
            <!-- Actions Row -->
            <div class="flex items-center justify-between">
                <div class="flex gap-1.5">
                    <button onclick="window.drProcess()" class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-medium rounded transition-colors shadow-sm flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        Process
                    </button>
                    <button onclick="window.drClear()" class="px-2.5 py-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-700 dark:text-white text-[11px] font-medium rounded transition-colors flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                        Clear
                    </button>
                </div>
                <div class="flex gap-1.5 items-center">
                    <div id="dr_stats" class="flex gap-1.5 text-[10px] mr-2"></div>
                    <button onclick="window.drPrint()" class="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-medium rounded transition-colors shadow-sm flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                        Print
                    </button>
                    <button onclick="window.drExport()" class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium rounded transition-colors shadow-sm flex items-center gap-1">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        Export
                    </button>
                </div>
            </div>
        </div>

        <!-- Defaulters Report Header -->
        <div class="px-3 py-1.5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <div>
                <h2 class="text-xs font-bold text-gray-800 dark:text-white">Defaulters Report (Family Senior Students List)</h2>
                <p class="text-[10px] text-gray-500 dark:text-gray-400" id="dr_subtitle">Click "Process" to generate report</p>
            </div>
        </div>

        <!-- Defaulters Loader -->
        <div id="dr_loader" class="flex items-center justify-center py-8 hidden">
            <div class="flex flex-col items-center">
                <div class="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <span class="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 mt-1">Generating Report...</span>
            </div>
        </div>

        <!-- Defaulters Table -->
        <div class="flex-1 overflow-auto" id="dr_table_wrapper">
            <table class="w-full text-left border-collapse" style="font-size:10px;" id="dr_table">
                <thead class="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium sticky top-0 z-10">
                    <tr>
                        <th class="px-1 py-1.5 whitespace-nowrap">#</th>
                        <th class="px-1 py-1.5 whitespace-nowrap">Family #</th>
                        <th class="px-1 py-1.5 whitespace-nowrap">File #</th>
                        <th class="px-1 py-1.5 whitespace-nowrap">Student Name</th>
                        <th class="px-1 py-1.5 whitespace-nowrap">Father Name</th>
                        <th class="px-1 py-1.5 whitespace-nowrap">CNIC</th>
                        <th class="px-1 py-1.5 whitespace-nowrap">Class/Sec</th>
                        <th class="px-1 py-1.5 whitespace-nowrap">Contact #</th>
                        <th class="px-1 py-1.5 whitespace-nowrap text-right">Arrears</th>
                        <th class="px-1 py-1.5 whitespace-nowrap text-right">Monthly</th>
                        <th class="px-1 py-1.5 whitespace-nowrap text-right">Other</th>
                        <th class="px-1 py-1.5 whitespace-nowrap text-right">Sib.Disc</th>
                        <th class="px-1 py-1.5 whitespace-nowrap text-right">Spc.Disc</th>
                        <th class="px-1 py-1.5 whitespace-nowrap text-right">Cur.Due</th>
                        <th class="px-1 py-1.5 whitespace-nowrap text-right">Total</th>
                        <th class="px-1 py-1.5 whitespace-nowrap text-right">PaidAdj</th>
                        <th class="px-1 py-1.5 whitespace-nowrap text-right">Paid</th>
                        <th class="px-1 py-1.5 whitespace-nowrap text-right">Balance</th>
                        <th class="px-1 py-1.5 whitespace-nowrap">Paid Date</th>
                        <th class="px-1 py-1.5 whitespace-nowrap text-center">Rem</th>
                    </tr>
                </thead>
                <tbody id="dr_tbody" class="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                    <tr>
                        <td colspan="20" class="px-4 py-8 text-center text-gray-400 dark:text-gray-500">
                            <svg class="w-6 h-6 mx-auto mb-1 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            Set filters and click <strong>Process</strong> to generate the defaulters report.
                        </td>
                    </tr>
                </tbody>
                <tfoot id="dr_tfoot" class="bg-gray-50 dark:bg-gray-800 border-t-2 border-gray-200 dark:border-gray-600 font-bold hidden"></tfoot>
            </table>
        </div>
    `;
}

function initDefaultersFilters() {
    const classSelect = document.getElementById('dr_class');
    if (classSelect && allClassesList.length > 0) {
        allClassesList.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.class_name;
            opt.textContent = c.class_name;
            classSelect.appendChild(opt);
        });
    } else if (classSelect) {
        // Fallback: use classRank keys
        Array.from(classRank.keys()).forEach(cn => {
            const opt = document.createElement('option');
            opt.value = cn;
            opt.textContent = cn;
            classSelect.appendChild(opt);
        });
    }

    if (classSelect) {
        classSelect.addEventListener('change', () => {
            const secSelect = document.getElementById('dr_section');
            if (!secSelect) return;
            secSelect.innerHTML = '<option value="all">ALL</option>';
            if (classSelect.value === 'all') return;
            const cls = allClassesList.find(c => c.class_name === classSelect.value);
            if (cls && cls.sections) {
                let sections = [];
                try { sections = typeof cls.sections === 'string' ? JSON.parse(cls.sections) : cls.sections; } catch (e) { sections = []; }
                if (Array.isArray(sections)) {
                    sections.forEach(s => {
                        const opt = document.createElement('option');
                        opt.value = s;
                        opt.textContent = s;
                        secSelect.appendChild(opt);
                    });
                }
            }
        });
    }
}

function drGetFilters() {
    return {
        session: document.getElementById('dr_session')?.value || '',
        class: document.getElementById('dr_class')?.value || 'all',
        section: document.getElementById('dr_section')?.value || 'all',
        gender: document.getElementById('dr_gender')?.value || 'all',
        status: document.getElementById('dr_status')?.value || 'active',
        uptoMonth: document.getElementById('dr_upto_month')?.value || drGetCurrentMonth(),
        minDues: parseFloat(document.getElementById('dr_min_dues')?.value) || 0,
        monthsDefaulters: document.getElementById('dr_months_def')?.value ? parseInt(document.getElementById('dr_months_def').value) : null,
        excludePaid: document.getElementById('dr_exclude_paid')?.checked || false,
        excludePending: document.getElementById('dr_exclude_pending')?.checked || false,
        nonDefaulters: document.getElementById('dr_non_defaulters')?.checked || false,
    };
}

function drCalculateUnpaidMonths(familyFees, uptoMonth) {
    if (!familyFees || familyFees.length === 0) return 0;
    let earliestMonth = uptoMonth;
    familyFees.forEach(f => {
        if (f.month && f.month < earliestMonth) earliestMonth = f.month;
    });
    let unpaidCount = 0;
    let currentCheck = uptoMonth;
    while (drMonthToNum(currentCheck) >= drMonthToNum(earliestMonth)) {
        const monthFees = familyFees.filter(f => f.month === currentCheck);
        if (monthFees.length > 0) {
            const allPaid = monthFees.every(f => f.status === 'paid');
            if (!allPaid) unpaidCount++;
            else break;
        }
        currentCheck = drPrevMonth(currentCheck);
    }
    return unpaidCount;
}

window.drProcess = async function () {
    const loader = document.getElementById('dr_loader');
    const tbody = document.getElementById('dr_tbody');
    const tfoot = document.getElementById('dr_tfoot');
    const subtitle = document.getElementById('dr_subtitle');

    if (!tbody || !tfoot) return; // User navigated away

    if (loader) loader.classList.remove('hidden');
    tbody.innerHTML = '';
    tfoot.innerHTML = ''; tfoot.classList.add('hidden');

    try {
        const filters = drGetFilters();

        // Fetch data in parallel (including student_discounts for sibling discount identification)
        const [feesRes, studentsRes, paymentsRes, discountsRes] = await Promise.all([
            supabase.from('fees').select('*'),
            supabase.from('students').select('*'),
            supabase.from('fee_payments').select('*'),
            supabase.from('student_discounts').select('*')
        ]);

        // Check if user navigated away during fetch
        if (!document.getElementById('dr_tbody')) return;

        const allFees = feesRes.data || [];
        const allStudents = studentsRes.data || [];
        const allPayments = paymentsRes.data || [];
        const allDiscountRules = discountsRes.data || [];

        // Filter students
        let filteredStudents = allStudents;
        if (filters.status === 'active') {
            filteredStudents = allStudents.filter(s => s.status !== 'inactive' && s.status !== 'left');
        } else if (filters.status === 'inactive') {
            filteredStudents = allStudents.filter(s => s.status === 'inactive' || s.status === 'left');
        }
        if (filters.gender !== 'all') {
            filteredStudents = filteredStudents.filter(s => s.gender === filters.gender);
        }

        // Group students by family
        const familyGroups = new Map();
        filteredStudents.forEach(s => {
            const key = s.family_code || s.father_cnic || s.id;
            if (!familyGroups.has(key)) familyGroups.set(key, []);
            familyGroups.get(key).push(s);
        });

        const uptoMonthNum = drMonthToNum(filters.uptoMonth);
        const currentMonth = filters.uptoMonth;

        // Build fee & payment indexes
        const feesByStudent = new Map();
        allFees.forEach(f => {
            if (!feesByStudent.has(f.student_id)) feesByStudent.set(f.student_id, []);
            feesByStudent.get(f.student_id).push(f);
        });
        const paymentsByStudent = new Map();
        allPayments.forEach(p => {
            if (!paymentsByStudent.has(p.student_id)) paymentsByStudent.set(p.student_id, []);
            paymentsByStudent.get(p.student_id).push(p);
        });

        // Build discount rule lookup: student_id-fee_type -> discount rule
        // Used to identify sibling discounts (is_automatic=true) vs special discounts
        const discountRuleMap = new Map();
        allDiscountRules.forEach(d => {
            const key = `${d.student_id}-${d.fee_type}`;
            discountRuleMap.set(key, d);
        });

        const familyRows = [];
        let rowNum = 0;

        familyGroups.forEach((members, familyKey) => {
            // Sort: highest class first, then earliest admission (for consistent juniorMemberIds)
            members.sort((a, b) => {
                const rankA = drGetClassRank(a.class);
                const rankB = drGetClassRank(b.class);
                if (rankA !== rankB) return rankB - rankA;
                const dateA = a.admission_date || a.created_at || '';
                const dateB = b.admission_date || b.created_at || '';
                return dateA.localeCompare(dateB);
            });

            // Gather all fees for the family up to uptoMonth (for juniorMemberIds and filtering)
            const familyFees = [];
            members.forEach(m => {
                const sFees = feesByStudent.get(m.id) || [];
                sFees.forEach(f => {
                    if (drMonthToNum(f.month) <= uptoMonthNum) familyFees.push(f);
                });
            });

            // Determine junior members (2nd+ child by admission date) for sibling discount classification
            const membersByAdmission = [...members].sort((a, b) => {
                const dateA = a.admission_date || a.created_at || '';
                const dateB = b.admission_date || b.created_at || '';
                return dateA.localeCompare(dateB);
            });
            const juniorMemberIds = new Set(
                membersByAdmission.slice(1).map(m => m.id)
            );

            const familyCode = members[0].family_code || familyKey;

            // One row per student (every family member)
            members.forEach(member => {
                // Class/section filter: apply per student
                if (filters.class !== 'all' && member.class !== filters.class) return;
                if (filters.section !== 'all' && member.section !== filters.section) return;

                const studentFees = familyFees.filter(f => f.student_id === member.id);
                const studentPayments = paymentsByStudent.get(member.id) || [];

                let arrears = 0, monthlyFees = 0, otherFees = 0;
                let siblingDiscount = 0, specialDiscount = 0, currentMonthDues = 0, totalPaidAdj = 0;

                studentFees.forEach(f => {
                    const amt = Number(f.amount) || 0;
                    const discountAmt = Number(f.discount) || 0;
                    const finalAmt = Math.max(0, amt - discountAmt);
                    const feeType = (f.fee_type || '').toLowerCase();
                    const isMonthly = feeType.includes('monthly') || feeType.includes('tuition');

                    const feePayments = studentPayments.filter(p => p.fee_id === f.id);
                    const paidAmt = feePayments.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);

                    if (f.month === currentMonth) {
                        if (isMonthly) monthlyFees += amt;
                        else otherFees += amt;
                        currentMonthDues += Math.max(0, finalAmt - paidAmt);
                    } else {
                        const remaining = finalAmt - paidAmt;
                        if (remaining > 0) arrears += remaining;
                    }

                    if (discountAmt > 0) {
                        const discountKey = `${f.student_id}-${f.fee_type}`;
                        const rule = discountRuleMap.get(discountKey);
                        const isJuniorMember = juniorMemberIds.has(f.student_id);

                        if (rule && rule.is_automatic === true) {
                            siblingDiscount += discountAmt;
                        } else if (!rule && isJuniorMember && isMonthly) {
                            siblingDiscount += discountAmt;
                        } else {
                            specialDiscount += discountAmt;
                        }
                    }
                    totalPaidAdj += paidAmt;
                });

                const totalDues = arrears + Math.max(0, currentMonthDues);
                const balance = totalDues > 0 ? totalDues : 0;

                let lastPaidDate = '';
                const sortedPay = studentPayments.filter(p => p.payment_date).sort((a, b) => b.payment_date.localeCompare(a.payment_date));
                if (sortedPay.length > 0) lastPaidDate = sortedPay[0].payment_date;

                const paidFromPayments = studentPayments.reduce((sum, p) => sum + (Number(p.amount_paid) || 0), 0);
                const unpaidMonths = drCalculateUnpaidMonths(studentFees, currentMonth);

                // Row-level filters
                if (filters.excludePaid && balance <= 0) return;
                if (filters.nonDefaulters && balance > 0) return;
                if (filters.excludePending && balance > 0 && unpaidMonths === 0) return;
                if (filters.minDues > 0 && balance < filters.minDues) return;
                if (filters.monthsDefaulters !== null && filters.monthsDefaulters > 0 && unpaidMonths < filters.monthsDefaulters) return;

                rowNum++;
                familyRows.push({
                    rowNum,
                    familyCode,
                    fileNo: member.roll_no || member.id?.slice(0, 6) || '-',
                    studentName: member.name || '-',
                    fatherName: member.father_name || '-',
                    cnic: member.father_cnic || '-',
                    classSection: `${member.class || '-'} / ${member.section || '-'}`,
                    className: member.class || '',
                    section: member.section || '',
                    contact: member.phone || member.emergency_contact || '-',
                    arrears, monthlyFees, otherFees, siblingDiscount, specialDiscount,
                    currentMonthDues: Math.max(0, currentMonthDues),
                    totalDues, paidAdj: totalPaidAdj, paid: paidFromPayments,
                    balance, paidDate: lastPaidDate, remarks: unpaidMonths
                });
            });
        });

        // Sort by class rank, section, name
        familyRows.sort((a, b) => {
            const rA = drGetClassRank(a.className), rB = drGetClassRank(b.className);
            if (rA !== rB) return rA - rB;
            const sc = (a.section || '').localeCompare(b.section || '');
            if (sc !== 0) return sc;
            return (a.studentName || '').localeCompare(b.studentName || '');
        });
        familyRows.forEach((r, i) => r.rowNum = i + 1);

        defaultersData = familyRows;
        drRenderTable(familyRows);

        if (subtitle) {
            subtitle.textContent = `Generated ${new Date().toLocaleDateString()} | Session: ${filters.session} | Upto: ${filters.uptoMonth} | ${familyRows.length} students`;
        }
        const statsEl = document.getElementById('dr_stats');
        if (statsEl) {
            const totalBal = familyRows.reduce((s, r) => s + r.balance, 0);
            const totalPd = familyRows.reduce((s, r) => s + r.paid, 0);
            statsEl.innerHTML = `
                <span class="px-1.5 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded font-medium" style="font-size:10px;">Bal: ${formatMoney(totalBal)}</span>
                <span class="px-1.5 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded font-medium" style="font-size:10px;">Paid: ${formatMoney(totalPd)}</span>
                <span class="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded font-medium" style="font-size:10px;">${familyRows.length} students</span>
            `;
        }
    } catch (err) {
        console.error('Defaulters Report Error:', err);
        if (tbody) tbody.innerHTML = `<tr><td colspan="20" class="px-6 py-8 text-center text-red-500">Error: ${err.message}</td></tr>`;
    } finally {
        if (loader) loader.classList.add('hidden');
    }
};

function drRenderTable(rows) {
    const tbody = document.getElementById('dr_tbody');
    const tfoot = document.getElementById('dr_tfoot');
    if (!tbody || !tfoot) return;

    if (rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="20" class="px-6 py-12 text-center text-gray-400 dark:text-gray-500">No defaulters found matching the selected criteria.</td></tr>`;
        tfoot.classList.add('hidden');
        return;
    }

    // Group by Class -> Section
    const groups = new Map();
    rows.forEach(r => {
        const gk = `${r.className}|${r.section}`;
        if (!groups.has(gk)) groups.set(gk, []);
        groups.get(gk).push(r);
    });

    const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
        const [cA, sA] = a.split('|');
        const [cB, sB] = b.split('|');
        const rA = drGetClassRank(cA), rB = drGetClassRank(cB);
        if (rA !== rB) return rA - rB;
        return (sA || '').localeCompare(sB || '');
    });

    let html = '';
    const gt = { arrears: 0, monthlyFees: 0, otherFees: 0, siblingDiscount: 0, specialDiscount: 0, currentMonthDues: 0, totalDues: 0, paidAdj: 0, paid: 0, balance: 0 };

    sortedKeys.forEach(key => {
        const [cn, sec] = key.split('|');
        const gr = groups.get(key);

        html += `<tr class="bg-indigo-50 dark:bg-indigo-900/20">
            <td colspan="20" class="px-1 py-1 font-bold text-indigo-700 dark:text-indigo-300" style="font-size:10px;">
                ${cn || 'Unknown'} ${sec ? '- ' + sec : ''}
                <span class="ml-1 font-normal text-gray-500 dark:text-gray-400">(${gr.length})</span>
            </td>
        </tr>`;

        gr.forEach(r => {
            const rbg = r.remarks === 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                : r.remarks === 1 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';

            html += `<tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                <td class="px-1 py-1 text-gray-400 dark:text-gray-500">${r.rowNum}</td>
                <td class="px-1 py-1"><span class="px-1 py-0.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded" style="font-size:9px;">${r.familyCode}</span></td>
                <td class="px-1 py-1 text-gray-700 dark:text-gray-200">${r.fileNo}</td>
                <td class="px-1 py-1 font-medium text-gray-800 dark:text-white max-w-[100px] truncate">${r.studentName}</td>
                <td class="px-1 py-1 text-gray-700 dark:text-gray-200 max-w-[90px] truncate">${r.fatherName}</td>
                <td class="px-1 py-1 font-mono text-gray-600 dark:text-gray-300" style="font-size:9px;">${r.cnic}</td>
                <td class="px-1 py-1 text-gray-700 dark:text-gray-200">${r.classSection}</td>
                <td class="px-1 py-1 text-gray-600 dark:text-gray-300" style="font-size:9px;">${r.contact}</td>
                <td class="px-1 py-1 text-right font-mono text-gray-800 dark:text-gray-100">${r.arrears > 0 ? formatMoney(r.arrears) : '-'}</td>
                <td class="px-1 py-1 text-right font-mono text-gray-800 dark:text-gray-100">${r.monthlyFees > 0 ? formatMoney(r.monthlyFees) : '-'}</td>
                <td class="px-1 py-1 text-right font-mono text-gray-800 dark:text-gray-100">${r.otherFees > 0 ? formatMoney(r.otherFees) : '-'}</td>
                <td class="px-1 py-1 text-right font-mono text-green-600 dark:text-green-400">${r.siblingDiscount > 0 ? formatMoney(r.siblingDiscount) : '-'}</td>
                <td class="px-1 py-1 text-right font-mono text-green-600 dark:text-green-400">${r.specialDiscount > 0 ? formatMoney(r.specialDiscount) : '-'}</td>
                <td class="px-1 py-1 text-right font-mono text-gray-800 dark:text-gray-100">${r.currentMonthDues > 0 ? formatMoney(r.currentMonthDues) : '-'}</td>
                <td class="px-1 py-1 text-right font-mono font-bold text-gray-900 dark:text-white">${formatMoney(r.totalDues)}</td>
                <td class="px-1 py-1 text-right font-mono text-gray-800 dark:text-gray-100">${r.paidAdj > 0 ? formatMoney(r.paidAdj) : '-'}</td>
                <td class="px-1 py-1 text-right font-mono text-blue-600 dark:text-blue-400">${r.paid > 0 ? formatMoney(r.paid) : '-'}</td>
                <td class="px-1 py-1 text-right font-mono font-bold ${r.balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}">${r.balance !== undefined && r.balance !== null ? formatMoney(r.balance) : formatMoney(0)}</td>
                <td class="px-1 py-1 text-gray-600 dark:text-gray-300" style="font-size:9px;">${r.paidDate || '-'}</td>
                <td class="px-1 py-1 text-center"><span class="inline-block px-1.5 py-0.5 rounded-full font-bold ${rbg}" style="font-size:9px;">${r.remarks}</span></td>
            </tr>`;

            gt.arrears += r.arrears; gt.monthlyFees += r.monthlyFees; gt.otherFees += r.otherFees;
            gt.siblingDiscount += r.siblingDiscount; gt.specialDiscount += r.specialDiscount;
            gt.currentMonthDues += r.currentMonthDues; gt.totalDues += r.totalDues;
            gt.paidAdj += r.paidAdj; gt.paid += r.paid; gt.balance += r.balance;
        });
    });

    tbody.innerHTML = html;

    tfoot.innerHTML = `<tr>
        <td colspan="8" class="px-1 py-1.5 text-right font-bold text-gray-700 dark:text-gray-200" style="font-size:10px;">Grand Totals</td>
        <td class="px-1 py-1.5 text-right font-mono font-bold text-gray-800 dark:text-gray-100" style="font-size:10px;">${formatMoney(gt.arrears)}</td>
        <td class="px-1 py-1.5 text-right font-mono font-bold text-gray-800 dark:text-gray-100" style="font-size:10px;">${formatMoney(gt.monthlyFees)}</td>
        <td class="px-1 py-1.5 text-right font-mono font-bold text-gray-800 dark:text-gray-100" style="font-size:10px;">${formatMoney(gt.otherFees)}</td>
        <td class="px-1 py-1.5 text-right font-mono font-bold text-green-600 dark:text-green-400" style="font-size:10px;">${formatMoney(gt.siblingDiscount)}</td>
        <td class="px-1 py-1.5 text-right font-mono font-bold text-green-600 dark:text-green-400" style="font-size:10px;">${formatMoney(gt.specialDiscount)}</td>
        <td class="px-1 py-1.5 text-right font-mono font-bold text-gray-800 dark:text-gray-100" style="font-size:10px;">${formatMoney(gt.currentMonthDues)}</td>
        <td class="px-1 py-1.5 text-right font-mono font-bold text-gray-800 dark:text-gray-100" style="font-size:10px;">${formatMoney(gt.totalDues)}</td>
        <td class="px-1 py-1.5 text-right font-mono font-bold text-gray-800 dark:text-gray-100" style="font-size:10px;">${formatMoney(gt.paidAdj)}</td>
        <td class="px-1 py-1.5 text-right font-mono font-bold text-blue-600 dark:text-blue-400" style="font-size:10px;">${formatMoney(gt.paid)}</td>
        <td class="px-1 py-1.5 text-right font-mono font-bold text-red-600 dark:text-red-400" style="font-size:10px;">${formatMoney(gt.balance)}</td>
        <td class="px-1 py-1.5"></td>
        <td class="px-1 py-1.5"></td>
    </tr>`;
    tfoot.classList.remove('hidden');
}

window.drClear = function () {
    const els = {
        dr_session: drGetCurrentSession(), dr_class: 'all', dr_section: 'all',
        dr_gender: 'all', dr_status: 'active', dr_upto_month: drGetCurrentMonth(),
        dr_min_dues: '0', dr_months_def: ''
    };
    for (const [id, val] of Object.entries(els)) {
        const el = document.getElementById(id);
        if (el) el.value = val;
    }
    const secSel = document.getElementById('dr_section');
    if (secSel) secSel.innerHTML = '<option value="all">ALL</option>';
    ['dr_exclude_paid', 'dr_exclude_pending', 'dr_non_defaulters'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.checked = false;
    });
    const tbody = document.getElementById('dr_tbody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="20" class="px-6 py-12 text-center text-gray-400 dark:text-gray-500">Set filters and click <strong>Process</strong> to generate the defaulters report.</td></tr>`;
    const tfoot = document.getElementById('dr_tfoot');
    if (tfoot) { tfoot.innerHTML = ''; tfoot.classList.add('hidden'); }
    const stats = document.getElementById('dr_stats');
    if (stats) stats.innerHTML = '';
    const sub = document.getElementById('dr_subtitle');
    if (sub) sub.textContent = 'Click "Process" to generate report';
    defaultersData = [];
};

window.drExport = function () {
    if (defaultersData.length === 0) {
        alert('No data to export. Please generate the report first.');
        return;
    }
    const filters = drGetFilters();
    let csv = "data:text/csv;charset=utf-8,";
    csv += `"The Suffah School"\n"Defaulters Report (Family Senior Students List)"\n`;
    csv += `"Session: ${filters.session} | Upto Month: ${filters.uptoMonth}"\n"Generated: ${new Date().toLocaleString()}"\n\n`;

    const headers = ['#','Family #','File #','Student Name','Father Name','CNIC','Class / Section','Contact #','Arrears','Monthly Fees','Other Fees','Sibling Discount','Special Discount','Current Dues','Total Dues','Paid Adjusted','Paid','Balance','Paid Date','Remarks'];
    csv += headers.map(h => `"${h}"`).join(',') + '\n';

    const groups = new Map();
    defaultersData.forEach(r => {
        const gk = `${r.className}|${r.section}`;
        if (!groups.has(gk)) groups.set(gk, []);
        groups.get(gk).push(r);
    });
    const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
        const [cA, sA] = a.split('|');
        const [cB, sB] = b.split('|');
        const rA = drGetClassRank(cA), rB = drGetClassRank(cB);
        if (rA !== rB) return rA - rB;
        return (sA || '').localeCompare(sB || '');
    });

    const gt = { arrears: 0, monthlyFees: 0, otherFees: 0, siblingDiscount: 0, specialDiscount: 0, currentMonthDues: 0, totalDues: 0, paidAdj: 0, paid: 0, balance: 0 };

    sortedKeys.forEach(key => {
        const [cn, sec] = key.split('|');
        const gr = groups.get(key);
        csv += `\n"${cn}${sec ? ' - ' + sec : ''} (${gr.length} students)"\n`;
        gr.forEach(r => {
            csv += [r.rowNum,`"${r.familyCode}"`,`"${r.fileNo}"`,`"${r.studentName}"`,`"${r.fatherName}"`,`"${r.cnic}"`,`"${r.classSection}"`,`"${r.contact}"`,r.arrears,r.monthlyFees,r.otherFees,r.siblingDiscount,r.specialDiscount,r.currentMonthDues,r.totalDues,r.paidAdj,r.paid,r.balance,`"${r.paidDate || ''}"`,r.remarks].join(',') + '\n';
            gt.arrears += r.arrears; gt.monthlyFees += r.monthlyFees; gt.otherFees += r.otherFees;
            gt.siblingDiscount += r.siblingDiscount; gt.specialDiscount += r.specialDiscount;
            gt.currentMonthDues += r.currentMonthDues; gt.totalDues += r.totalDues;
            gt.paidAdj += r.paidAdj; gt.paid += r.paid; gt.balance += r.balance;
        });
    });

    csv += `\n"","","","","","","","Grand Totals",${gt.arrears},${gt.monthlyFees},${gt.otherFees},${gt.siblingDiscount},${gt.specialDiscount},${gt.currentMonthDues},${gt.totalDues},${gt.paidAdj},${gt.paid},${gt.balance},"",""\n`;

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `Defaulters_Report_${filters.uptoMonth}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

window.drPrint = function () {
    if (defaultersData.length === 0) {
        alert('No data to print. Please generate the report first.');
        return;
    }

    const filters = drGetFilters();
    const tableEl = document.getElementById('dr_table');
    if (!tableEl) {
        alert('Table not found.');
        return;
    }

    const tableHtml = tableEl.outerHTML;
    const totalBal = defaultersData.reduce((s, r) => s + r.balance, 0);
    const totalPd = defaultersData.reduce((s, r) => s + r.paid, 0);

    const printWindow = window.open('', '', 'height=900,width=1200');

    printWindow.document.write(`
        <html>
            <head>
                <title>Defaulters Report - Print</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: Arial, sans-serif; padding: 15px; font-size: 9px; color: #333; }
                    .header { text-align: center; margin-bottom: 10px; border-bottom: 2px solid #333; padding-bottom: 8px; }
                    .header img { width: 50px; height: 50px; object-fit: contain; margin-bottom: 4px; }
                    .header h1 { font-size: 16px; font-weight: bold; text-transform: uppercase; margin-bottom: 2px; }
                    .header h2 { font-size: 13px; color: #4f46e5; margin-bottom: 2px; }
                    .header p { font-size: 9px; color: #666; }
                    .summary { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 9px; }
                    .summary span { padding: 2px 6px; border-radius: 3px; font-weight: bold; }
                    .bal { background: #fee2e2; color: #dc2626; }
                    .paid { background: #d1fae5; color: #059669; }
                    .count { background: #e0e7ff; color: #4f46e5; }
                    table { width: 100%; border-collapse: collapse; font-size: 8px; }
                    th { background-color: #f3f4f6; color: #374151; padding: 3px 2px; text-align: left; border: 1px solid #d1d5db; white-space: nowrap; font-size: 8px; }
                    td { padding: 2px 2px; border: 1px solid #e5e7eb; white-space: nowrap; }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    .font-bold { font-weight: bold; }
                    .font-mono { font-family: 'Courier New', monospace; }
                    .group-row { background: #eef2ff; font-weight: bold; color: #4338ca; }
                    .text-red { color: #dc2626; }
                    .text-green { color: #059669; }
                    .text-blue { color: #2563eb; }
                    tr:nth-child(even) { background-color: #fafafa; }
                    tfoot td { background: #f3f4f6; font-weight: bold; border-top: 2px solid #374151; }
                    .footer { margin-top: 10px; text-align: center; font-size: 8px; color: #999; border-top: 1px solid #e5e7eb; padding-top: 6px; }
                    @media print {
                        body { padding: 5px; }
                        @page { size: landscape; margin: 8mm; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="/assets/images/school-logo.jpg" alt="Logo" onerror="this.style.display='none'">
                    <h1>The Suffah School</h1>
                    <h2>Defaulters Report (Family Senior Students List)</h2>
                    <p>Session: ${filters.session} | Upto: ${filters.uptoMonth} | Generated: ${new Date().toLocaleString()}</p>
                </div>
                <div class="summary">
                    <span class="count">${defaultersData.length} Students</span>
                    <span class="paid">Total Paid: ${formatMoney(totalPd)}</span>
                    <span class="bal">Total Balance: ${formatMoney(totalBal)}</span>
                </div>
                ${tableHtml}
                <div class="footer">
                    Generated from School Management System | Printed on ${new Date().toLocaleString()}
                </div>
                <script>
                    window.onload = function() {
                        setTimeout(function() { window.print(); }, 600);
                    }
                </script>
            </body>
        </html>
    `);

    printWindow.document.close();
};

// ========================================================================
// END DEFAULTERS REPORT
// ========================================================================

// --- Utils ---
function formatMoney(amount) {
    return 'Rs ' + parseFloat(amount).toLocaleString();
}

// --- Export & Print ---
window.exportReport = (type) => {
    const titleEl = document.getElementById('reportTitle');
    const subtitleEl = document.getElementById('reportSubtitle');
    if (!titleEl || !subtitleEl) return; // User navigated away
    const title = titleEl.textContent;
    const subtitle = subtitleEl.textContent;

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

    if (!thead || !tbody || !tfoot) return; // User navigated away

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
