// assignment_reports.js - Assignment & Homework Reporting Module
const supabase = window.supabase || (() => { throw new Error('Supabase not initialized'); })();

// --- State ---
let activeReport = 'submission_status';
let allClassesList = [];
let currentRole = 'student';
let assignedClasses = [];
let teacherId = null;

const REPORTS = [
    { id: 'submission_status', label: 'Assignment Submission Report', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m6 4h3m-6-4h.01M9 16h.01' },
    { id: 'evaluation_stats', label: 'Assignment Evaluation Report', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
    { id: 'student_assignment_history', label: 'Student Assignment History', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' }
];

export async function render(container) {
    container.innerHTML = `
        <div class="flex flex-col gap-4 md:gap-6 h-[calc(100vh-100px)] min-h-0 flex-1">
            <div class="flex flex-col md:flex-row gap-4 md:gap-6 flex-1 min-h-0">
                <!-- Sidebar -->
                <div class="hidden md:flex w-72 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 flex-col overflow-hidden shrink-0">
                    <div class="p-6 border-b border-gray-100 dark:border-gray-800">
                        <h2 class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Homework Hub</h2>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Assignment Analytics</p>
                    </div>
                    <div class="overflow-y-auto flex-1 p-3 space-y-2">
                        ${REPORTS.map(r => `
                            <button onclick="window.selectAssignmentReport('${r.id}')" 
                                id="btn-${r.id}"
                                class="report-nav-btn w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeReport === r.id ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}">
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
                            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1" id="reportSubtitle">Real-time Submission Data</p>
                        </div>
                        <div class="flex gap-3">
                            <button onclick="window.print()" class="px-6 py-2.5 text-xs font-black uppercase tracking-widest bg-primary-500 text-white rounded-full hover:bg-primary-600 shadow-lg shadow-primary-500/25 transition-all">Export PDF</button>
                        </div>
                    </div>

                    <div class="flex-1 min-h-0 p-6 pt-0">
                        <div class="h-full rounded-2xl border-2 border-gray-100 dark:border-gray-800 overflow-hidden relative flex flex-col">
                            <div id="reportLoader" class="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10 hidden">
                                <div class="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <div class="flex-1 overflow-auto custom-scrollbar" id="reportTableScroll">
                                <table class="w-full text-left text-sm border-collapse">
                                    <thead class="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800/80 backdrop-blur-md">
                                        <tr id="tableHeaderRow"></tr>
                                    </thead>
                                    <tbody id="tableBody" class="divide-y divide-gray-50 dark:divide-gray-800/50"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    await initStructure();
    window.selectAssignmentReport('submission_status');
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
                teacherId = teacher.id;
                const { data: ta } = await supabase.from('teacher_assignments').select('*, classes(class_name)').eq('teacher_id', teacher.id);
                assignedClasses = ta || [];
                const assignedClassNames = [...new Set(assignedClasses.map(a => a.classes?.class_name))];
                list = list.filter(c => assignedClassNames.includes(c.class_name));
            }
        }
        allClassesList = list;
    }
}

window.selectAssignmentReport = (reportId) => {
    activeReport = reportId;

    document.querySelectorAll('.report-nav-btn').forEach(btn => {
        const isSelected = btn.id === `btn-${reportId}`;
        btn.classList.toggle('bg-primary-500', isSelected);
        btn.classList.toggle('text-white', isSelected);
        btn.classList.toggle('shadow-lg', isSelected);
        btn.classList.toggle('text-gray-500', !isSelected);
        btn.classList.toggle('dark:text-gray-400', !isSelected);
    });

    document.getElementById('reportTitle').textContent = REPORTS.find(r => r.id === reportId).label;
    setupFilters(reportId);
    window.runAssignmentReport();
};

function setupFilters(reportId) {
    const container = document.getElementById('reportFilters');
    const classOptions = allClassesList.map(c => `<option value="${c.class_name}">${c.class_name}</option>`).join('');

    if (reportId === 'submission_status' || reportId === 'evaluation_stats') {
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Target Class</label>
                    <select id="f_class" class="app-select w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-bold"><option value="">${currentRole === 'teacher' ? 'Your Assigned Classes' : 'Select Class'}</option>${classOptions}</select>
                </div>
                <div class="md:col-span-2">
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Subject / Assignment Title</label>
                    <input type="text" id="f_search" placeholder="e.g. Mathematics or Midterm Assignment" class="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-bold">
                </div>
                <div>
                    <button onclick="window.runAssignmentReport()" class="w-full bg-gray-900 dark:bg-primary-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest">Generate Analysis</button>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="flex gap-4 items-end">
                <div class="flex-1">
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Trace Student History</label>
                    <input type="text" id="f_student_search" placeholder="Enter Registration # or Name..." class="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-bold">
                </div>
                <button onclick="window.runAssignmentReport()" class="bg-primary-500 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest">Fetch History</button>
            </div>
        `;
    }
}

window.runAssignmentReport = async () => {
    const loader = document.getElementById('reportLoader');
    if (loader) loader.classList.remove('hidden');

    try {
        const filters = {
            class: document.getElementById('f_class')?.value,
            search: document.getElementById('f_search')?.value,
            studentSearch: document.getElementById('f_student_search')?.value
        };

        if (activeReport === 'submission_status') {
            await renderSubmissionStatus(filters);
        } else if (activeReport === 'evaluation_stats') {
            await renderEvaluationStats(filters);
        } else if (activeReport === 'student_assignment_history') {
            await renderStudentAssignmentHistory(filters);
        }
    } catch (err) {
        console.error(err);
    } finally {
        if (loader) loader.classList.add('hidden');
    }
};

async function renderSubmissionStatus(f) {
    let q = supabase.from('assignments').select('*, teachers(name), classes(class_name)');

    if (f.class) {
        const classId = (allClassesList.find(c => c.class_name === f.class))?.id;
        if (classId) q = q.eq('class_id', classId);
    }

    if (f.search) q = q.or(`title.ilike.%${f.search}%,subject.ilike.%${f.search}%`);

    if (currentRole === 'teacher') {
        q = q.eq('teacher_id', teacherId);
    }

    const { data: assignments } = await q.limit(50);

    if (!assignments || assignments.length === 0) {
        renderTable(['Notice'], [['No assignments found for matching filters']]);
        return;
    }

    const assignmentIds = assignments.map(a => a.id);
    const { data: submissions } = await supabase.from('submissions').select('*').in('assignment_id', assignmentIds);

    const headers = ['Teacher', 'Class', 'Subject', 'Title', 'Due Date', 'Submitted'];
    const rows = assignments.map(a => {
        const subCount = submissions?.filter(s => s.assignment_id === a.id).length || 0;
        return [
            a.teachers?.name || 'Admin',
            a.classes?.class_name || '-',
            a.subject,
            a.title,
            new Date(a.due_date).toLocaleDateString(),
            subCount
        ];
    });

    renderTable(headers, rows);
}

async function renderEvaluationStats(f) {
    let q = supabase.from('assignments').select('*, teachers(name), classes(class_name)');

    if (f.class) {
        const classId = (allClassesList.find(c => c.class_name === f.class))?.id;
        if (classId) q = q.eq('class_id', classId);
    }

    if (currentRole === 'teacher') {
        q = q.eq('teacher_id', teacherId);
    }

    const { data: assignments } = await q.limit(50);

    const assignmentIds = assignments.map(a => a.id);
    const { data: submissions } = await supabase.from('submissions').select('*').in('assignment_id', assignmentIds);

    const headers = ['Assignment', 'Class', 'Subject', 'Total Submitted', 'Graded', 'Unchecked', 'Avg Marks'];
    const rows = assignments.map(a => {
        const sub = submissions?.filter(s => s.assignment_id === a.id) || [];
        const graded = sub.filter(s => s.status === 'Graded').length;
        const sum = sub.reduce((acc, curr) => acc + (curr.marks || 0), 0);
        return [
            a.title,
            a.classes?.class_name || '-',
            a.subject,
            sub.length,
            graded,
            sub.length - graded,
            sub.length > 0 ? (sum / sub.length).toFixed(1) : '-'
        ];
    });

    renderTable(headers, rows);
}

async function renderStudentAssignmentHistory(f) {
    if (!f.studentSearch) return;

    const { data: student } = await supabase.from('students').select('*').or(`roll_no.eq.${f.studentSearch},name.ilike.%${f.studentSearch}%`).maybeSingle();
    if (!student) {
        alert('Student not found');
        return;
    }

    if (currentRole === 'teacher') {
        const assignedClassNames = [...new Set(assignedClasses.map(a => a.classes?.class_name))];
        if (!assignedClassNames.includes(student.class)) {
            alert('Access Denied: You can only view history for students in your assigned classes.');
            return;
        }
    }

    const { data: subs } = await supabase.from('submissions').select('*, assignments(*)').eq('student_id', student.id);

    const headers = ['Assignment', 'Subject', 'Submission Date', 'Status', 'Marks', 'Remarks'];
    const rows = (subs || []).map(s => [
        s.assignments.title,
        s.assignments.subject,
        new Date(s.submitted_at).toLocaleDateString(),
        s.status,
        s.marks || 'Not Graded',
        s.remarks || '-'
    ]);

    renderTable(headers, rows);
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
