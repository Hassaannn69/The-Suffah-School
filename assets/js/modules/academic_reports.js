// academic_reports.js - Academic Performance Reporting Module
const supabase = window.supabase || (() => { throw new Error('Supabase not initialized'); })();

// --- State ---
let activeReport = 'exam_results';
let allClassesList = [];
let allExamsList = [];
let currentRole = 'student';
let assignedClasses = [];

const REPORTS = [
    { id: 'exam_results', label: 'Exam Result Report', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'class_analysis', label: 'Class Performance Analysis', icon: 'M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' },
    { id: 'student_progress', label: 'Student Progress Report', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' }
];

export async function render(container) {
    container.innerHTML = `
        <div class="flex flex-col gap-4 md:gap-6 h-[calc(100vh-100px)] min-h-0 flex-1">
            <div class="flex flex-col md:flex-row gap-4 md:gap-6 flex-1 min-h-0">
                <!-- Sidebar -->
                <div class="hidden md:flex w-72 bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 flex-col overflow-hidden shrink-0">
                    <div class="p-6 border-b border-gray-100 dark:border-gray-800">
                        <h2 class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Academic Portal</h2>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Select Analysis Mode</p>
                    </div>
                    <div class="overflow-y-auto flex-1 p-3 space-y-2">
                        ${REPORTS.map(r => `
                            <button onclick="window.selectAcademicReport('${r.id}')" 
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
                            <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1" id="reportSubtitle">Real-time Performance Data</p>
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
                                <div id="academicContent" class="hidden p-8"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    await initStructure();
    window.selectAcademicReport('exam_results');
}

async function initStructure() {
    const { data: { user } } = await supabase.auth.getUser();
    currentRole = user?.user_metadata?.role || 'student';

    const [{ data: classes }, { data: exams }] = await Promise.all([
        supabase.from('classes').select('*'),
        supabase.from('exams').select('*').order('created_at', { ascending: false })
    ]);

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
    if (exams) allExamsList = exams;
}

window.selectAcademicReport = (reportId) => {
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
    window.runAcademicReport();
};

function setupFilters(reportId) {
    const container = document.getElementById('reportFilters');
    const classOptions = allClassesList.map(c => `<option value="${c.class_name}">${c.class_name}</option>`).join('');
    const examOptions = allExamsList.map(e => `<option value="${e.id}">${e.name} (${e.academic_year})</option>`).join('');

    if (reportId === 'exam_results' || reportId === 'class_analysis') {
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Select Exam</label>
                    <select id="f_exam" class="app-select w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-bold">${examOptions}</select>
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Target Class</label>
                    <select id="f_class" class="app-select w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-bold"><option value="">${currentRole === 'teacher' ? 'Your Assigned Classes' : 'All Classes'}</option>${classOptions}</select>
                </div>
                <div>
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Subject</label>
                    <input type="text" id="f_subject" placeholder="e.g. English" class="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-bold">
                </div>
                <div>
                    <button onclick="window.runAcademicReport()" class="w-full bg-gray-900 dark:bg-primary-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest">Generate Report</button>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="flex gap-4 items-end">
                <div class="flex-1">
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Find Student</label>
                    <input type="text" id="f_search" placeholder="Enter Roll Number or Name..." class="w-full px-4 py-2.5 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm font-bold">
                </div>
                <button onclick="window.runAcademicReport()" class="bg-primary-500 text-white px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest">View Progress</button>
            </div>
        `;
    }
}

window.runAcademicReport = async () => {
    const loader = document.getElementById('reportLoader');
    if (loader) loader.classList.remove('hidden');

    try {
        const filters = {
            examId: document.getElementById('f_exam')?.value,
            class: document.getElementById('f_class')?.value,
            subject: document.getElementById('f_subject')?.value,
            search: document.getElementById('f_search')?.value
        };

        if (activeReport === 'exam_results') {
            await renderExamResults(filters);
        } else if (activeReport === 'class_analysis') {
            await renderClassAnalysis(filters);
        } else if (activeReport === 'student_progress') {
            await renderStudentProgress(filters);
        }
    } catch (err) {
        console.error(err);
    } finally {
        if (loader) loader.classList.add('hidden');
    }
};

async function renderExamResults(f) {
    if (!f.examId) return;

    const exam = allExamsList.find(e => e.id === f.examId);
    let q = supabase.from('exam_marks').select('*, students(*)').eq('exam_id', f.examId);

    if (f.subject) q = q.ilike('subject', `%${f.subject}%`);
    const { data: marks } = await q;

    let filteredMarks = marks;
    if (f.class) {
        filteredMarks = marks.filter(m => m.students.class === f.class);
    } else if (currentRole === 'teacher') {
        const assignedClassNames = [...new Set(assignedClasses.map(a => a.classes?.class_name))];
        filteredMarks = marks.filter(m => assignedClassNames.includes(m.students.class));
    }

    const headers = ['S#', 'Roll #', 'Student Name', 'Class', 'Subject', 'Marks', 'Max Marks', 'Grade'];
    const rows = filteredMarks.map((m, i) => {
        const grade = calculateGrade(m.marks_obtained, exam.total_marks);
        return [
            i + 1,
            m.students.roll_no || '-',
            m.students.name,
            m.students.class,
            m.subject,
            m.marks_obtained,
            exam.total_marks,
            `<span class="px-2 py-1 rounded-lg text-[10px] font-black uppercase ${getGradeColor(grade)}">${grade}</span>`
        ];
    });

    document.getElementById('academicContent').classList.add('hidden');
    document.querySelector('table').classList.remove('hidden');
    renderTable(headers, rows);
}

async function renderClassAnalysis(f) {
    if (!f.examId) return;

    const exam = allExamsList.find(e => e.id === f.examId);
    let q = supabase.from('exam_marks').select('*, students(*)').eq('exam_id', f.examId);
    if (f.subject) q = q.ilike('subject', `%${f.subject}%`);
    const { data: marks } = await q;

    let studentsByClass = marks;
    if (f.class) {
        studentsByClass = marks.filter(m => m.students.class === f.class);
    } else if (currentRole === 'teacher') {
        const assignedClassNames = [...new Set(assignedClasses.map(a => a.classes?.class_name))];
        studentsByClass = marks.filter(m => assignedClassNames.includes(m.students.class));
    }

    const classStats = new Map();
    studentsByClass.forEach(m => {
        const cls = m.students.class;
        if (!classStats.has(cls)) classStats.set(cls, { total: 0, sum: 0, pass: 0, fail: 0, max: 0, min: 1000 });
        const s = classStats.get(cls);
        s.total++;
        s.sum += parseFloat(m.marks_obtained);
        if (parseFloat(m.marks_obtained) >= (exam.total_marks * 0.4)) s.pass++;
        else s.fail++;
        s.max = Math.max(s.max, m.marks_obtained);
        s.min = Math.min(s.min, m.marks_obtained);
    });

    const headers = ['Class', 'Students', 'Class Avg', 'Highest', 'Lowest', 'Pass %'];
    const rows = Array.from(classStats.entries()).map(([name, s]) => [
        name,
        s.total,
        (s.sum / s.total).toFixed(1),
        s.max,
        s.min,
        ((s.pass / s.total) * 100).toFixed(1) + '%'
    ]);

    document.getElementById('academicContent').classList.add('hidden');
    document.querySelector('table').classList.remove('hidden');
    renderTable(headers, rows);
}

async function renderStudentProgress(f) {
    if (!f.search) return;

    const { data: student } = await supabase.from('students')
        .select('*')
        .or(`roll_no.eq.${f.search},name.ilike.%${f.search}%`)
        .maybeSingle();

    if (!student) {
        alert('Student not found');
        return;
    }

    // Role check for student progress
    if (currentRole === 'teacher') {
        const assignedClassNames = [...new Set(assignedClasses.map(a => a.classes?.class_name))];
        if (!assignedClassNames.includes(student.class)) {
            alert('Access Denied: You can only view progress for students in your assigned classes.');
            return;
        }
    }

    const { data: marks } = await supabase.from('exam_marks')
        .select('*, exams(*)')
        .eq('student_id', student.id);

    const headers = ['Exam Name', 'Subject', 'Obtained', 'Total', 'Grade', 'Date'];
    const rows = (marks || []).map(m => {
        const grade = calculateGrade(m.marks_obtained, m.exams.total_marks);
        return [
            m.exams.name,
            m.subject,
            m.marks_obtained,
            m.exams.total_marks,
            grade,
            new Date(m.created_at).toLocaleDateString()
        ];
    });

    document.getElementById('academicContent').classList.add('hidden');
    document.querySelector('table').classList.remove('hidden');
    renderTable(headers, rows);
}

function calculateGrade(marks, max) {
    if (!marks || marks === '') return '--';
    const percent = (marks / max) * 100;
    if (percent >= 90) return 'A+';
    if (percent >= 80) return 'A';
    if (percent >= 70) return 'B';
    if (percent >= 60) return 'C';
    if (percent >= 50) return 'D';
    return 'F';
}

function getGradeColor(grade) {
    if (grade === 'A+') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (grade === 'A') return 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-500';
    if (grade === 'B') return 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-500';
    if (grade === 'C') return 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-500';
    if (grade === 'D') return 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-500';
    if (grade === 'F') return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
    return 'bg-gray-100 text-gray-500';
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
