// Teacher Exam Marks Module
const supabase = window.supabase;
const toast = window.toast || { success: (m) => alert(m), error: (m) => alert(m) };

let currentTeacher = null;
let assignedClasses = [];
let exams = [];
let selectedExamId = '';
let selectedClassId = '';
let selectedSection = '';
let selectedSubject = '';
let studentMarks = [];

export async function render(container) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: teacher } = await supabase.from('teachers').select('*').eq('auth_id', user.id).maybeSingle();
    currentTeacher = teacher;

    const { data: classAssists } = await supabase.from('teacher_assignments').select('*, classes(*)').eq('teacher_id', currentTeacher.id);
    assignedClasses = classAssists || [];

    const { data: activeExams } = await supabase.from('exams').select('*').eq('is_active', true);
    exams = activeExams || [];

    container.innerHTML = `
        <div class="space-y-6 animate-in fade-in duration-500">
            <!-- Header & Filters -->
            <div class="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 p-8">
                <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div class="space-y-4 flex-1">
                        <div>
                            <h2 class="text-3xl font-black text-gray-900 dark:text-white">Exams & Grading</h2>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Enter marks and track academic performance.</p>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Select Exam</label>
                                <select id="examSelector" class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white">
                                    <option value="">Select Exam...</option>
                                    ${exams.map(e => `<option value="${e.id}">${e.name} (${e.exam_type})</option>`).join('')}
                                </select>
                            </div>
                            <div class="space-y-1">
                                <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Class & Subject</label>
                                <select id="examClassSelector" class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white">
                                    <option value="">Select Class...</option>
                                    ${assignedClasses.map(ta => `<option value="${ta.class_id}|${ta.section}|${ta.subject}">${ta.classes.class_name} - ${ta.section || 'All'} (${ta.subject || 'All'})</option>`).join('')}
                                </select>
                            </div>
                            <div class="flex items-end">
                                <button id="loadMarksBtn" class="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 transition-all transform active:scale-95 disabled:opacity-50" disabled>Load Student List</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Marks Table -->
            <div class="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                <div id="marksTableContainer" class="p-6">
                    <div class="flex flex-col items-center justify-center py-20 text-gray-400 opacity-40">
                        <svg class="w-20 h-20 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                        <p class="font-bold">Select exam and class to enter marks</p>
                    </div>
                </div>
            </div>

            <div id="saveIndicator" class="fixed bottom-6 right-6 px-4 py-2 bg-gray-900 text-white rounded-full text-xs font-bold shadow-2xl opacity-0 transition-opacity flex items-center gap-2">
                <div class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                Saving Marks...
            </div>
        </div>
    `;

    setupListeners();
}

function setupListeners() {
    const examSel = document.getElementById('examSelector');
    const classSel = document.getElementById('examClassSelector');
    const loadBtn = document.getElementById('loadMarksBtn');

    const checkEnabled = () => {
        loadBtn.disabled = !(examSel.value && classSel.value);
    };

    examSel.addEventListener('change', checkEnabled);
    classSel.addEventListener('change', checkEnabled);

    loadBtn.addEventListener('click', async () => {
        selectedExamId = examSel.value;
        [selectedClassId, selectedSection, selectedSubject] = classSel.value.split('|');
        await loadExamData();
    });
}

async function loadExamData() {
    const container = document.getElementById('marksTableContainer');
    container.innerHTML = `<div class="py-20 text-center animate-pulse">Fetching records...</div>`;

    try {
        const ta = assignedClasses.find(a => a.class_id === selectedClassId && a.section === (selectedSection || ''));
        const { data: students } = await supabase.from('students').select('*').eq('class', ta.classes.class_name).eq('section', selectedSection || '').order('name');
        const { data: marks } = await supabase.from('exam_marks').select('*').eq('exam_id', selectedExamId).eq('subject', selectedSubject || 'General');

        const exam = exams.find(e => e.id === selectedExamId);

        renderMarksTable(container, students || [], marks || [], exam);
    } catch (err) {
        toast.error('Failed to load exam data');
    }
}

function renderMarksTable(container, students, marks, exam) {
    if (students.length === 0) {
        container.innerHTML = `<p class="text-center py-20 text-gray-500">No students found in this section.</p>`;
        return;
    }

    container.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="bg-gray-50 dark:bg-gray-800/50 uppercase tracking-widest text-[10px] font-black text-gray-500">
                    <tr>
                        <th class="px-6 py-4 text-left">Student</th>
                        <th class="px-6 py-4 text-center">Marks (Max: ${exam.total_marks})</th>
                        <th class="px-6 py-4 text-center">Grade</th>
                        <th class="px-6 py-4 text-right">Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                    ${students.map(s => {
        const m = marks.find(mark => mark.student_id === s.id);
        const score = m?.marks_obtained || '';
        const grade = calculateGrade(score, exam.total_marks);
        return `
                            <tr class="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-4">
                                        <div class="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-black text-gray-500">${s.name.charAt(0)}</div>
                                        <div>
                                            <p class="font-bold text-gray-900 dark:text-white">${s.name}</p>
                                            <p class="text-[10px] text-gray-500 uppercase font-mono tracking-tighter">Roll: ${s.roll_no}</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <input type="number" 
                                        max="${exam.total_marks}"
                                        onchange="window.saveExamMark('${s.id}', this.value, ${exam.total_marks})"
                                        value="${score}" 
                                        placeholder="00" 
                                        class="w-24 mx-auto px-4 py-2 bg-gray-100 dark:bg-gray-800 border-none rounded-xl text-center font-black text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 transition-all">
                                </td>
                                <td class="px-6 py-4 text-center">
                                    <span id="grade-${s.id}" class="px-3 py-1 rounded-lg text-xs font-black uppercase ${getGradeColor(grade)}">${grade}</span>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <div class="flex items-center justify-end gap-2">
                                        <span class="w-2 h-2 rounded-full ${m ? 'bg-emerald-500' : 'bg-gray-300'}"></span>
                                        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">${m ? 'Graded' : 'Pending'}</span>
                                    </div>
                                </td>
                            </tr>
                        `;
    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

window.saveExamMark = async (studentId, marks, maxMarks) => {
    if (marks > maxMarks) {
        toast.error('Marks cannot exceed ' + maxMarks);
        return;
    }

    const indicator = document.getElementById('saveIndicator');
    indicator.style.opacity = '1';

    const { data: existing } = await supabase.from('exam_marks')
        .select('id')
        .eq('exam_id', selectedExamId)
        .eq('student_id', studentId)
        .eq('subject', selectedSubject || 'General')
        .maybeSingle();

    let error;
    if (existing) {
        const { error: err } = await supabase.from('exam_marks').update({
            marks_obtained: marks,
            marked_by: currentTeacher.id
        }).eq('id', existing.id);
        error = err;
    } else {
        const { error: err } = await supabase.from('exam_marks').insert([{
            exam_id: selectedExamId,
            student_id: studentId,
            subject: selectedSubject || 'General',
            marks_obtained: marks,
            marked_by: currentTeacher.id
        }]);
        error = err;
    }

    if (error) toast.error('Save failed');
    else {
        const grade = calculateGrade(marks, maxMarks);
        const gradeEl = document.getElementById('grade-' + studentId);
        if (gradeEl) {
            gradeEl.textContent = grade;
            gradeEl.className = `px-3 py-1 rounded-lg text-xs font-black uppercase ${getGradeColor(grade)}`;
        }
    }

    setTimeout(() => { indicator.style.opacity = '0'; }, 800);
};

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
