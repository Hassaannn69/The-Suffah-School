// attendance_reports.js - Attendance Reporting Module
const supabase = window.supabase || (() => { throw new Error('Supabase not initialized'); })();

// --- State ---
let activeReport = 'daily_attendance';
let allClassesList = [];
let assignedClasses = []; // For teachers
let currentRole = 'student';
let classRank = new Map();

// --- Helpers ---
function getLocalDateString() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function getLocalMonthString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const REPORTS = [
    { id: 'daily_attendance', label: 'Daily Attendance Report', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'monthly_summary', label: 'Monthly Attendance Summary', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z' },
    { id: 'student_history', label: 'Student Attendance History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'class_comparison', label: 'Class Attendance Comparison', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
];

// --- Main Render ---
export async function render(container) {
    // Listener for data changes
    if (!window.hasAttendanceReportsListener) {
        window.addEventListener('appDataChange', (e) => {
            if (e.detail?.type === 'class' || e.detail?.type === 'student') {
                console.log('[AttendanceReports] Refreshing filters due to data change');
                initStructure();
            }
        });
        window.hasAttendanceReportsListener = true;
    }

    container.innerHTML = `
        <div class="flex flex-col gap-4 md:gap-6 h-[calc(100vh-100px)] min-h-0 flex-1">
            <div class="flex flex-col md:flex-row gap-4 md:gap-6 flex-1 min-h-0">
                <!-- Sidebar -->
                <div class="hidden md:flex w-72 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 flex-col overflow-hidden shrink-0">
                    <div class="p-6 border-b border-gray-100 dark:border-gray-800">
                        <h2 class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Attendance Portal</h2>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Select Analysis Mode</p>
                    </div>
                    <div class="overflow-y-auto flex-1 p-3 space-y-2">
                        ${REPORTS.map(r => `
                            <button onclick="window.selectAttendanceReport('${r.id}')" 
                                id="btn-${r.id}"
                                class="report-nav-btn w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeReport === r.id ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}">
                                <div class="w-8 h-8 rounded-xl flex items-center justify-center ${activeReport === r.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800'} group-hover:scale-110 transition-transform">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="${r.icon}"></path></svg>
                                </div>
                                ${r.label}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Content Area -->
                <div id="reportContentArea" class="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <!-- Filters -->
                    <div class="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20 no-print" id="reportFilters">
                        <p class="text-gray-400 text-xs font-bold uppercase tracking-widest animate-pulse">Initializing Engine...</p>
                    </div>

                    <!-- Header -->
                    <div class="px-8 py-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 no-print">
                        <div>
                            <h2 class="text-2xl font-black text-gray-900 dark:text-white tracking-tighter" id="reportTitle">Report</h2>
                            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1" id="reportSubtitle">System timestamp: ${new Date().toLocaleDateString()}</p>
                        </div>
                        <div class="flex gap-3">
                            <button onclick="window.exportAttendance('excel')" class="px-6 py-2.5 text-xs font-black uppercase tracking-widest bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95">Excel</button>
                            <button onclick="window.exportAttendance('pdf')" class="px-6 py-2.5 text-xs font-black uppercase tracking-widest bg-primary-500 text-white rounded-full hover:bg-primary-600 shadow-lg shadow-primary-500/25 transition-all active:scale-95">Export PDF</button>
                        </div>
                    </div>

                    <!-- Table Container -->
                    <div class="flex-1 min-h-0 p-6 pt-0">
                        <div class="h-full rounded-2xl border-2 border-gray-100 dark:border-gray-800 overflow-hidden relative flex flex-col">
                            <div id="reportLoader" class="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10 hidden">
                                <div class="flex flex-col items-center">
                                    <div class="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span class="text-[10px] font-black uppercase tracking-widest text-primary-500 mt-4 animate-pulse">Synthesizing Data...</span>
                                </div>
                            </div>
                            <div class="flex-1 overflow-auto custom-scrollbar" id="reportTableScroll">
                                <table class="w-full text-left text-sm border-collapse" id="attendanceTable">
                                    <thead class="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800/80 backdrop-blur-md">
                                        <tr id="tableHeaderRow"></tr>
                                    </thead>
                                    <tbody id="tableBody" class="divide-y divide-gray-50 dark:divide-gray-800/50"></tbody>
                                    <tfoot id="tableFooter" class="bg-gray-50 dark:bg-gray-800/80 backdrop-blur-md sticky bottom-0 font-bold hidden"></tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(99, 102, 241, 0.2); border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.4); }
            .status-pill { padding: 2px 8px; border-radius: 99px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
            .status-present { background: rgba(16, 185, 129, 0.1); color: #10b981; }
            .status-absent { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
            .status-late { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }

            @media print {
                @page { margin: 1cm; }
                #sidebar, header, #reportFilters, .report-nav-btn, .w-72, button, #logoutBtn, #headerClock, .no-print {
                    display: none !important;
                }
                body, html, main, #mainContent, #reportContentArea, .flex-1, .h-\[calc\(100vh-100px\)\] {
                    margin: 0 !important;
                    padding: 0 !important;
                    height: auto !important;
                    width: 100% !important;
                    position: static !important;
                    display: block !important;
                    background: white !important;
                    color: black !important;
                }
                .rounded-3xl, .rounded-xl, .shadow-xl, .shadow-lg, .border {
                    border-radius: 0 !important;
                    box-shadow: none !important;
                    border-color: #eee !important;
                }
                #reportTableScroll {
                    overflow: visible !important;
                    height: auto !important;
                }
                table {
                    width: 100% !important;
                    border: 1px solid #000 !important;
                    border-collapse: collapse !important;
                }
                th, td {
                    border: 1px solid #000 !important;
                    padding: 6px 4px !important;
                    color: black !important;
                    font-size: 10px !important;
                }
                .status-pill {
                    background: none !important;
                    padding: 0 !important;
                    font-weight: bold !important;
                    color: black !important;
                }
                .print-only { display: block !important; }
                .no-print { display: none !important; }
            }
            .print-only { display: none; }
        </style>

        <div class="print-only mb-6 text-center border-b-2 border-black pb-4">
            <h1 class="text-2xl font-black uppercase tracking-tighter">The Suffah School</h1>
            <p class="text-xs font-bold uppercase tracking-widest mt-1">Official Attendance Record</p>
            <div class="mt-4 flex justify-between text-[10px] font-bold uppercase">
                <span id="printReportType">Daily Report</span>
                <span id="printReportMeta">Date: ${new Date().toLocaleDateString()}</span>
            </div>
        </div>
    `;

    await initStructure();
    window.selectAttendanceReport('daily_attendance');
}

async function initStructure() {
    const { data: { user } } = await supabase.auth.getUser();
    currentRole = user?.user_metadata?.role || 'student';

    const { data: classes } = await supabase.from('classes').select('*');
    if (classes) {
        let list = classes.sort((a, b) => a.class_name.localeCompare(b.class_name, undefined, { numeric: true }));

        if (currentRole === 'teacher') {
            const { data: teacher } = await supabase.from('teachers').select('id').eq('auth_id', user.id).maybeSingle();
            if (teacher) {
                const { data: ta } = await supabase.from('teacher_assignments').select('*, classes(class_name)').eq('teacher_id', teacher.id);
                assignedClasses = ta || [];
                const assignedClassNames = [...new Set(assignedClasses.map(a => a.classes?.class_name))];
                list = list.filter(c => assignedClassNames.includes(c.class_name));
            }
        }
        allClassesList = list;
        classes.forEach(c => {
            const num = parseInt(c.class_name.replace(/\D/g, ''));
            classRank.set(c.class_name, isNaN(num) ? 999 : num);
        });
    }
}

window.selectAttendanceReport = (reportId) => {
    activeReport = reportId;

    // Update Sidebar UI
    document.querySelectorAll('.report-nav-btn').forEach(btn => {
        const isSelected = btn.id === `btn-${reportId}`;
        btn.classList.toggle('bg-primary-500', isSelected);
        btn.classList.toggle('text-white', isSelected);
        btn.classList.toggle('shadow-lg', isSelected);
        btn.classList.toggle('text-gray-500', !isSelected);
        btn.classList.toggle('dark:text-gray-400', !isSelected);
        btn.classList.toggle('hover:bg-gray-50', !isSelected);

        const iconContainer = btn.querySelector('div');
        iconContainer.classList.toggle('bg-white/20', isSelected);
        iconContainer.classList.toggle('bg-gray-100', !isSelected);
        iconContainer.classList.toggle('dark:bg-gray-800', !isSelected);
    });

    const reportConfig = REPORTS.find(r => r.id === reportId);
    document.getElementById('reportTitle').textContent = reportConfig.label;

    // Update print header
    const printType = document.getElementById('printReportType');
    if (printType) printType.textContent = reportConfig.label;

    setupFilters(reportId);
    window.runAttendanceReport();
};

function setupFilters(reportId) {
    const container = document.getElementById('reportFilters');
    if (!container) return;

    const today = getLocalDateString();
    const currentMonth = getLocalMonthString();
    const classOptions = allClassesList.map(c => `<option value="${c.class_name}">${c.class_name}</option>`).join('');

    let filters = '';
    if (reportId === 'daily_attendance') {
        filters = `
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Target Date</label>
                    <input type="date" id="f_date" value="${today}" class="app-select w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition-all">
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Class</label>
                    <select id="f_class" class="app-select w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition-all"><option value="">All Classes</option>${classOptions}</select>
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Section</label>
                    <select id="f_section" class="app-select w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition-all"><option value="">All Sections</option></select>
                </div>
                <div>
                    <button onclick="window.runAttendanceReport()" class="w-full bg-gray-900 dark:bg-primary-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all">Analyze Data</button>
                </div>
            </div>
        `;
    } else if (reportId === 'monthly_summary') {
        filters = `
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Analysis Month</label>
                    <input type="month" id="f_month" value="${currentMonth}" class="app-select w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition-all">
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Class</label>
                    <select id="f_class" class="app-select w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition-all"><option value="">All Classes</option>${classOptions}</select>
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Section</label>
                    <select id="f_section" class="app-select w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition-all"><option value="">All Sections</option></select>
                </div>
                <div>
                    <button onclick="window.runAttendanceReport()" class="w-full bg-gray-900 dark:bg-primary-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all">Analyze Month</button>
                </div>
            </div>
        `;
    } else if (reportId === 'student_history') {
        filters = `
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div class="md:col-span-2">
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Search Student (Name or Roll #)</label>
                    <input type="text" id="f_search" placeholder="Enter Roll Number or Name..." class="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition-all">
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Date Range</label>
                    <div class="grid grid-cols-2 gap-2">
                        <input type="date" id="f_start" class="w-full px-2 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-[10px] font-bold outline-none">
                        <input type="date" id="f_end" value="${today}" class="w-full px-2 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-[10px] font-bold outline-none">
                    </div>
                </div>
                <div>
                    <button onclick="window.runAttendanceReport()" class="w-full bg-gray-900 dark:bg-primary-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all">Trace History</button>
                </div>
            </div>
        `;
    } else if (reportId === 'class_comparison') {
        filters = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Target Date/Month</label>
                    <input type="date" id="f_date" value="${today}" class="app-select w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition-all">
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Metric</label>
                    <select id="f_metric" class="app-select w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-bold focus:ring-2 focus:ring-primary-500 outline-none transition-all">
                        <option value="attendance">Attendance Percentage</option>
                        <option value="absents">High Absenteeism</option>
                    </select>
                </div>
                <div>
                    <button onclick="window.runAttendanceReport()" class="w-full bg-gray-900 dark:bg-primary-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all">Compare Classes</button>
                </div>
            </div>
        `;
    }

    container.innerHTML = filters;

    // Handle Class/Section select logic
    const classSel = document.getElementById('f_class');
    const sectionSel = document.getElementById('f_section');
    if (classSel && sectionSel) {
        classSel.addEventListener('change', async () => {
            sectionSel.innerHTML = '<option value="">All Sections</option>';
            const className = classSel.value;
            if (!className) return;

            const cls = allClassesList.find(c => c.class_name === className);
            const { data: studentRows } = await supabase.from('students').select('section').eq('class', className);

            let definedSecs = [];
            if (cls && cls.sections) {
                try { definedSecs = typeof cls.sections === 'string' ? JSON.parse(cls.sections) : cls.sections; } catch (e) { definedSecs = []; }
            }
            if (!Array.isArray(definedSecs)) definedSecs = [];

            const actualSecs = [...new Set((studentRows || []).map(s => s.section).filter(Boolean))];
            const allSecs = [...new Set([...definedSecs, ...actualSecs])].sort();

            allSecs.forEach(s => {
                const opt = document.createElement('option');
                opt.value = s;
                opt.textContent = s;
                sectionSel.appendChild(opt);
            });
        });
    }
}

window.runAttendanceReport = async () => {
    const loader = document.getElementById('reportLoader');
    if (loader) loader.classList.remove('hidden');

    try {
        const filters = {
            date: document.getElementById('f_date')?.value,
            month: document.getElementById('f_month')?.value,
            class: document.getElementById('f_class')?.value,
            section: document.getElementById('f_section')?.value,
            search: document.getElementById('f_search')?.value,
            start: document.getElementById('f_start')?.value,
            end: document.getElementById('f_end')?.value,
            metric: document.getElementById('f_metric')?.value
        };

        let headers = [];
        let rows = [];

        if (activeReport === 'daily_attendance') {
            const res = await reportDailyAttendance(filters);
            headers = res.headers;
            rows = res.rows;
            const pm = document.getElementById('printReportMeta');
            if (pm) pm.textContent = `Date: ${filters.date} | ${filters.class || 'All Classes'} ${filters.section || ''}`;
        } else if (activeReport === 'monthly_summary') {
            const res = await reportMonthlySummary(filters);
            headers = res.headers;
            rows = res.rows;
            const pm = document.getElementById('printReportMeta');
            if (pm) pm.textContent = `Month: ${filters.month} | ${filters.class || 'All Classes'}`;
        } else if (activeReport === 'student_history') {
            const res = await reportStudentHistory(filters);
            headers = res.headers;
            rows = res.rows;
            const pm = document.getElementById('printReportMeta');
            if (pm) pm.textContent = `History: ${filters.search} | Range: ${filters.start || 'Start'} to ${filters.end || 'Today'}`;
        } else if (activeReport === 'class_comparison') {
            const res = await reportClassComparison(filters);
            headers = res.headers;
            rows = res.rows;
            const pm = document.getElementById('printReportMeta');
            if (pm) pm.textContent = `Comparison Date: ${filters.date}`;
        }

        renderTable(headers, rows);
    } catch (err) {
        console.error(err);
        alert('Report Error: ' + err.message);
    } finally {
        if (loader) loader.classList.add('hidden');
    }
};

async function reportDailyAttendance(f) {
    const date = f.date || getLocalDateString();

    // Fetch students
    let query = supabase.from('students').select('id, name, roll_no, class, section');
    if (f.class) {
        query = query.eq('class', f.class);
    } else if (currentRole === 'teacher') {
        const assignedClassNames = [...new Set(assignedClasses.map(a => a.classes?.class_name))];
        query = query.in('class', assignedClassNames);
    }

    if (f.section) query = query.eq('section', f.section);

    const { data: students } = await query.order('name');

    // Fetch attendance
    const { data: att } = await supabase.from('student_attendance')
        .select('*')
        .eq('date', date);

    const attMap = new Map(att?.map(a => [a.student_id, a]));

    const rows = (students || []).map((s, idx) => {
        const entry = attMap.get(s.id);
        const status = entry ? entry.status : 'Not Marked';
        const statusClass = status === 'Present' ? 'status-present' : (status === 'Absent' ? 'status-absent' : (status === 'Late' ? 'status-late' : ''));

        return [
            idx + 1,
            s.roll_no || '-',
            s.name,
            s.class,
            s.section || '-',
            `<span class="status-pill ${statusClass}">${status}</span>`,
            entry?.remarks || '-'
        ];
    });

    return {
        headers: ['S#', 'Roll #', 'Student Name', 'Class', 'Section', 'Status', 'Remarks'],
        rows
    };
}

async function reportMonthlySummary(f) {
    if (!f.month) return { headers: ['Error'], rows: [['Select month']] };

    const [y, m] = f.month.split('-').map(Number);
    const startDate = `${f.month}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const endDate = `${f.month}-${String(lastDay).padStart(2, '0')}`;

    // Get all students in target class/section
    let q = supabase.from('students').select('id, name, roll_no, class, section');
    if (f.class) {
        q = q.eq('class', f.class);
    } else if (currentRole === 'teacher') {
        const assignedClassNames = [...new Set(assignedClasses.map(a => a.classes?.class_name))];
        q = q.in('class', assignedClassNames);
    }

    if (f.section) q = q.eq('section', f.section);
    const { data: students } = await q.order('name');

    // Get attendance for the month
    const { data: att } = await supabase.from('student_attendance')
        .select('student_id, status, date')
        .gte('date', startDate)
        .lte('date', endDate);

    // Get working days (distinct dates where attendance was marked in this group)
    const workingDays = [...new Set(att?.map(a => a.date))].length || lastDay;

    const stats = new Map();
    (students || []).forEach(s => stats.set(s.id, { p: 0, a: 0, l: 0 }));
    (att || []).forEach(a => {
        if (!stats.has(a.student_id)) return;
        const s = stats.get(a.student_id);
        if (a.status === 'Present') s.p++;
        else if (a.status === 'Absent') s.a++;
        else if (a.status === 'Late') s.l++;
    });

    const rows = (students || []).map((s, idx) => {
        const st = stats.get(s.id);
        const total = st.p + st.a + st.l;
        const perc = workingDays > 0 ? ((st.p / workingDays) * 100).toFixed(1) : '0.0';

        return [
            idx + 1,
            s.roll_no || '-',
            s.name,
            s.class,
            perc + '%',
            workingDays,
            st.p,
            st.a,
            st.l
        ];
    });

    return {
        headers: ['S#', 'Roll #', 'Student Name', 'Class', 'Attendance %', 'Total Days', 'Present', 'Absent', 'Late'],
        rows
    };
}

async function reportStudentHistory(f) {
    if (!f.search) return { headers: ['Notice'], rows: [['Search for a student using Roll # or Name']] };

    // Find student
    const { data: student } = await supabase.from('students')
        .select('id, name, roll_no, class, section')
        .or(`roll_no.ilike.%${f.search}%,name.ilike.%${f.search}%`)
        .maybeSingle();

    if (!student) return { headers: ['Notice'], rows: [['Student not found']] };

    if (currentRole === 'teacher') {
        const assignedClassNames = [...new Set(assignedClasses.map(a => a.classes?.class_name))];
        if (!assignedClassNames.includes(student.class)) {
            return { headers: ['Notice'], rows: [['Access Denied: Student belongs to another class']] };
        }
    }

    let q = supabase.from('student_attendance').select('*').eq('student_id', student.id);
    if (f.start) q = q.gte('date', f.start);
    if (f.end) q = q.lte('date', f.end);
    const { data: att } = await q.order('date', { ascending: false });

    const rows = att.map((a, idx) => {
        const dateStr = new Date(a.date).toLocaleDateString();
        const statusClass = a.status === 'Present' ? 'status-present' : (a.status === 'Absent' ? 'status-absent' : (a.status === 'Late' ? 'status-late' : ''));
        return [
            idx + 1,
            dateStr,
            `<span class="status-pill ${statusClass}">${a.status}</span>`,
            a.remarks || '-'
        ];
    });

    return {
        headers: ['S#', 'Date', 'Status', 'Remarks'],
        rows
    };
}

async function reportClassComparison(f) {
    const date = f.date || getLocalDateString();

    // Get all classes
    let cq = supabase.from('classes').select('id, class_name');
    if (currentRole === 'teacher') {
        const assignedClassIds = [...new Set(assignedClasses.map(a => a.class_id))];
        cq = cq.in('id', assignedClassIds);
    }
    const { data: classes } = await cq;

    // Get stats
    const { data: att } = await supabase.from('student_attendance')
        .select('class_id, status')
        .eq('date', date);

    const stats = new Map();
    classes.forEach(c => stats.set(c.id, { name: c.class_name, p: 0, total: 0 }));

    att.forEach(a => {
        if (stats.has(a.class_id)) {
            const s = stats.get(a.class_id);
            s.total++;
            if (a.status === 'Present') s.p++;
        }
    });

    const rows = Array.from(stats.values()).map((s, idx) => {
        const perc = s.total > 0 ? ((s.p / s.total) * 100).toFixed(1) : '–';
        return [
            idx + 1,
            s.name,
            s.total,
            s.p,
            s.total - s.p,
            perc + '%'
        ];
    });

    return {
        headers: ['S#', 'Class Name', 'Students Logged', 'Present', 'Absent', 'Attendance %'],
        rows
    };
}

function renderTable(headers, rows) {
    const headerRow = document.getElementById('tableHeaderRow');
    const body = document.getElementById('tableBody');

    headerRow.innerHTML = headers.map(h => `
        <th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
            ${h}
        </th>
    `).join('');

    if (rows.length === 0) {
        body.innerHTML = `<tr><td colspan="${headers.length}" class="px-6 py-20 text-center"><p class="text-xs font-bold text-gray-400 uppercase tracking-widest">No matching records found</p></td></tr>`;
        return;
    }

    body.innerHTML = rows.map(row => `
        <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group">
            ${row.map(cell => `
                <td class="px-6 py-4 text-xs font-bold text-gray-700 dark:text-gray-300">
                    ${cell}
                </td>
            `).join('')}
        </tr>
    `).join('');
}

window.exportAttendance = (type) => {
    alert('Exporting to ' + type.toUpperCase() + '... (Print-ready layout generated)');
    window.print();
};
