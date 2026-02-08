// student_reports.js - Student Reporting Module
const supabase = window.supabase || (() => { throw new Error('Supabase not initialized'); })();

// --- State ---
let activeReport = 'class_roster';
let allClassesList = [];
let currentRole = 'student';
let assignedClasses = [];

const REPORTS = [
    { id: 'class_roster', label: 'Class Roster Report', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'enrollment_analytics', label: 'Enrollment Analytics', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'student_snapshot', label: 'Student Profile Snapshot', icon: 'M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2' }
];

export async function render(container) {
    // Listener for data changes
    if (!window.hasStudentReportsListener) {
        window.addEventListener('appDataChange', (e) => {
            if (e.detail?.type === 'class' || e.detail?.type === 'student') {
                console.log('[StudentReports] Refreshing filters due to data change');
                initStructure();
            }
        });
        window.hasStudentReportsListener = true;
    }
    container.innerHTML = `
        <div class="flex flex-col gap-4 md:gap-6 h-[calc(100vh-100px)] min-h-0 flex-1">
            <div class="flex flex-col md:flex-row gap-4 md:gap-6 flex-1 min-h-0">
                <!-- Sidebar -->
                <div class="hidden md:flex w-72 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 flex-col overflow-hidden shrink-0">
                    <div class="p-6 border-b border-gray-100 dark:border-gray-800">
                        <h2 class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Student Insights</h2>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Analytics Hub</p>
                    </div>
                    <div class="overflow-y-auto flex-1 p-3 space-y-2">
                        ${REPORTS.map(r => `
                            <button onclick="window.selectStudentReport('${r.id}')" 
                                id="btn-${r.id}"
                                class="report-nav-btn w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeReport === r.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}">
                                <div class="w-8 h-8 rounded-xl flex items-center justify-center ${activeReport === r.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800'} transition-transform">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="${r.icon}"></path></svg>
                                </div>
                                ${r.label}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Content Area -->
                <div id="reportContentArea" class="flex-1 flex flex-col min-h-0 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div class="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/20" id="reportFilters"></div>

                    <div class="px-8 py-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div>
                            <h2 class="text-2xl font-black text-gray-900 dark:text-white tracking-tighter" id="reportTitle">Report</h2>
                            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1" id="reportSubtitle">Real-time Admission Data</p>
                        </div>
                        <div class="flex gap-3">
                            <button onclick="window.print()" class="px-6 py-2.5 text-xs font-black uppercase tracking-widest bg-indigo-600 text-white rounded-full hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-all">Print Report</button>
                        </div>
                    </div>

                    <div class="flex-1 min-h-0 p-6 pt-0">
                        <div class="h-full rounded-2xl border-2 border-gray-100 dark:border-gray-800 overflow-hidden relative flex flex-col">
                            <div id="reportLoader" class="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10 hidden">
                                <div class="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <div class="flex-1 overflow-auto custom-scrollbar" id="reportTableScroll">
                                <table class="w-full text-left text-sm border-collapse">
                                    <thead class="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800/80 backdrop-blur-md">
                                        <tr id="tableHeaderRow"></tr>
                                    </thead>
                                    <tbody id="tableBody" class="divide-y divide-gray-50 dark:divide-gray-800/50"></tbody>
                                </table>
                                <div id="analyticsContent" class="hidden p-6"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    await initStructure();
    window.selectStudentReport('class_roster');
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
    }
}

window.selectStudentReport = (reportId) => {
    activeReport = reportId;

    document.querySelectorAll('.report-nav-btn').forEach(btn => {
        const isSelected = btn.id === `btn-${reportId}`;
        btn.classList.toggle('bg-indigo-600', isSelected);
        btn.classList.toggle('text-white', isSelected);
        btn.classList.toggle('shadow-lg', isSelected);
        btn.classList.toggle('text-gray-500', !isSelected);
        btn.classList.toggle('dark:text-gray-400', !isSelected);
    });

    document.getElementById('reportTitle').textContent = REPORTS.find(r => r.id === reportId).label;
    setupFilters(reportId);
    window.runStudentReport();
};

function setupFilters(reportId) {
    const container = document.getElementById('reportFilters');
    const classOptions = allClassesList.map(c => `<option value="${c.class_name}">${c.class_name}</option>`).join('');

    if (reportId === 'class_roster') {
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Target Class</label>
                    <select id="f_class" class="app-select w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-bold"><option value="">${currentRole === 'teacher' ? 'Your Assigned Classes' : 'Select Class'}</option>${classOptions}</select>
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Section</label>
                    <select id="f_section" class="app-select w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-bold"><option value="">All Sections</option></select>
                </div>
                <div>
                    <button onclick="window.runStudentReport()" class="w-full bg-gray-900 dark:bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest">Generate Roster</button>
                </div>
            </div>
        `;
    } else if (reportId === 'enrollment_analytics') {
        container.innerHTML = `<button onclick="window.runStudentReport()" class="bg-indigo-600 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest">Refresh Statistics</button>`;
    } else {
        container.innerHTML = `<div class="flex gap-4 items-end">
            <div class="flex-1">
                <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Find Student</label>
                <input type="text" id="f_search" placeholder="Enter Registration # or Name..." class="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-bold">
            </div>
            <button onclick="window.runStudentReport()" class="bg-indigo-600 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest">Fetch Snapshot</button>
        </div>`;
    }

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

window.runStudentReport = async () => {
    const loader = document.getElementById('reportLoader');
    loader.classList.remove('hidden');

    try {
        const filters = {
            class: document.getElementById('f_class')?.value,
            section: document.getElementById('f_section')?.value,
            search: document.getElementById('f_search')?.value
        };

        if (activeReport === 'class_roster') {
            await renderClassRoster(filters);
        } else if (activeReport === 'enrollment_analytics') {
            await renderEnrollmentAnalytics();
        } else if (activeReport === 'student_snapshot') {
            await renderStudentSnapshot(filters);
        }
    } catch (err) {
        console.error(err);
    } finally {
        loader.classList.add('hidden');
    }
};

async function renderClassRoster(f) {
    let targetClass = f.class;

    if (currentRole === 'teacher' && !targetClass) {
        // Auto-filter for teacher if no class selected
    }

    let q = supabase.from('students').select('*');
    if (targetClass) q = q.eq('class', targetClass);
    if (f.section) q = q.eq('section', f.section);

    const { data: students } = await q.order('roll_no');

    let filteredStudents = students || [];
    if (currentRole === 'teacher') {
        const assignedClassNames = [...new Set(assignedClasses.map(a => a.classes?.class_name))];
        filteredStudents = filteredStudents.filter(s => assignedClassNames.includes(s.class));
    }

    const headers = ['S#', 'Roll #', 'Student Name', 'Father Name', 'Phone', 'Family Code', 'Status'];
    const rows = filteredStudents.map((s, i) => [
        i + 1,
        s.roll_no || '-',
        s.name,
        s.father_name || '-',
        s.phone || '-',
        s.family_code || '-',
        `<span class="px-2 py-1 rounded-full text-[10px] font-bold uppercase ${s.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}">${s.status || 'Regular'}</span>`
    ]);

    document.getElementById('analyticsContent').classList.add('hidden');
    document.querySelector('table').classList.remove('hidden');
    renderTable(headers, rows);
}

async function renderEnrollmentAnalytics() {
    const { data: students } = await supabase.from('students').select('class, section, status, gender');

    let filtered = students || [];
    if (currentRole === 'teacher') {
        const assignedClassNames = [...new Set(assignedClasses.map(a => a.classes?.class_name))];
        filtered = filtered.filter(s => assignedClassNames.includes(s.class));
    }

    const classMap = new Map();
    filtered.forEach(s => {
        const cls = s.class || 'Unassigned';
        if (!classMap.has(cls)) classMap.set(cls, { total: 0, m: 0, f: 0, active: 0 });
        const stats = classMap.get(cls);
        stats.total++;
        if (s.gender === 'Male' || s.gender === 'M') stats.m++;
        if (s.gender === 'Female' || s.gender === 'F') stats.f++;
        if (s.status === 'active') stats.active++;
    });

    const headers = ['Class Name', 'Total Students', 'Active', 'Male', 'Female'];
    const rows = Array.from(classMap.entries()).map(([name, s]) => [name, s.total, s.active, s.m, s.f]);

    document.getElementById('analyticsContent').classList.add('hidden');
    document.querySelector('table').classList.remove('hidden');
    renderTable(headers, rows);
}

async function renderStudentSnapshot(f) {
    if (!f.search) return;

    const { data: s } = await supabase.from('students')
        .select('*')
        .or(`roll_no.eq.${f.search},name.ilike.%${f.search}%`)
        .maybeSingle();

    if (!s) {
        alert('Student not found');
        return;
    }

    if (currentRole === 'teacher') {
        const assignedClassNames = [...new Set(assignedClasses.map(a => a.classes?.class_name))];
        if (!assignedClassNames.includes(s.class)) {
            alert('Access Denied: Student belongs to another class.');
            return;
        }
    }

    const content = document.getElementById('analyticsContent');
    document.querySelector('table').classList.add('hidden');
    content.classList.remove('hidden');

    content.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="space-y-6">
                <div class="p-6 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                    <h3 class="text-xs font-black text-indigo-500 uppercase tracking-widest mb-4">Personal Details</h3>
                    <div class="space-y-3">
                        <div class="flex justify-between">
                            <span class="text-gray-400 text-xs font-bold uppercase">Full Name</span>
                            <span class="text-gray-700 dark:text-gray-200 font-bold">${s.name}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400 text-xs font-bold uppercase">Father Name</span>
                            <span class="text-gray-700 dark:text-gray-200 font-bold">${s.father_name || '-'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400 text-xs font-bold uppercase">Roll Number</span>
                            <span class="text-gray-700 dark:text-gray-200 font-bold">${s.roll_no || '-'}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-400 text-xs font-bold uppercase">Class / Sec</span>
                            <span class="text-gray-700 dark:text-gray-200 font-bold">${s.class} (${s.section || '-'})</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderTable(headers, rows) {
    const headerRow = document.getElementById('tableHeaderRow');
    const body = document.getElementById('tableBody');

    headerRow.innerHTML = headers.map(h => `<th class="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100 dark:border-gray-800">${h}</th>`).join('');
    body.innerHTML = rows.map(row => `
        <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
            ${row.map(cell => `<td class="px-6 py-4 text-xs font-bold text-gray-700 dark:text-gray-300">${cell}</td>`).join('')}
        </tr>
    `).join('');
}
