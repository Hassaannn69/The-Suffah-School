// Teacher Assignments Module
const supabase = window.supabase;
const toast = window.toast || { success: (m) => alert(m), error: (m) => alert(m) };

let currentTeacher = null;
let assignments = [];
let assignedClasses = [];
let viewMode = 'list'; // 'list' or 'submissions'
let activeAssignment = null;

export async function render(container) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: teacher } = await supabase.from('teachers').select('*').eq('auth_id', user.id).maybeSingle();
    if (!teacher) return;
    currentTeacher = teacher;

    const { data: classAssists } = await supabase.from('teacher_assignments').select('*, classes(*)').eq('teacher_id', currentTeacher.id);
    assignedClasses = classAssists || [];

    await loadAssignments();
    renderView(container);
}

function renderView(container) {
    if (viewMode === 'list') {
        renderList(container);
    } else {
        renderSubmissions(container);
    }
}

async function loadAssignments() {
    const { data } = await supabase
        .from('assignments')
        .select('*, classes(class_name)')
        .eq('teacher_id', currentTeacher.id)
        .order('created_at', { ascending: false });
    assignments = data || [];
}

function renderList(container) {
    container.innerHTML = `
        <div class="space-y-6 animate-in fade-in duration-500">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Assignments & Homework</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage tasks and grade student submissions.</p>
                </div>
                <button onclick="window.openNewAssignmentModal()" class="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-500/20 transition-all transform hover:scale-105 active:scale-95">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                    Create Assignment
                </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${assignments.length > 0 ? assignments.map(a => `
                    <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden hover:shadow-xl hover:border-primary-500/30 transition-all flex flex-col">
                        <div class="p-6 flex-1">
                            <div class="flex items-center justify-between mb-4">
                                <span class="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                                    ${a.classes?.class_name} - ${a.section || 'All'}
                                </span>
                                <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">${a.subject}</span>
                            </div>
                            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">${a.title}</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">${a.description || 'No description provided.'}</p>
                            
                            <div class="flex items-center gap-4 py-4 border-t border-gray-100 dark:border-gray-800">
                                <div class="flex-1">
                                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Due Date</p>
                                    <p class="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        ${a.due_date ? new Date(a.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'No Due Date'}
                                    </p>
                                </div>
                                <div class="text-right">
                                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Submissions</p>
                                    <p class="text-sm font-bold text-primary-600">--</p>
                                </div>
                            </div>
                        </div>
                        <div class="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 flex gap-2">
                            <button onclick="window.viewSubmissions('${a.id}')" class="flex-1 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold border border-gray-200 dark:border-gray-600 hover:bg-gray-50 transition-colors">View Submissions</button>
                            <button onclick="window.deleteAssignment('${a.id}')" class="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m4-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                            </button>
                        </div>
                    </div>
                `).join('') : `
                    <div class="col-span-full py-12 flex flex-col items-center justify-center text-gray-500 opacity-50">
                        <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
                        <p class="font-bold">No assignments created yet.</p>
                    </div>
                `}
            </div>
        </div>

        <!-- NEW ASSIGNMENT MODAL -->
        <div id="newAssignmentModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 hidden flex items-center justify-center p-4">
            <div class="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
                <div class="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">Create New Assignment</h3>
                    <button onclick="window.closeNewAssignmentModal()" class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                </div>
                <form id="newAssignmentForm" class="p-6 space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Class & Section</label>
                            <select name="class_info" required class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white">
                                <option value="">Select...</option>
                                ${assignedClasses.map(ta => `<option value="${ta.class_id}|${ta.section}|${ta.subject}">${ta.classes.class_name} - ${ta.section || 'All'}</option>`).join('')}
                            </select>
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Due Date</label>
                            <input type="date" name="due_date" required class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white">
                        </div>
                    </div>
                    <div class="space-y-1">
                        <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Title</label>
                        <input type="text" name="title" required placeholder="e.g. Algebra Quiz 1" class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white">
                    </div>
                    <div class="space-y-1">
                        <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Description</label>
                        <textarea name="description" rows="4" placeholder="Instructions for students..." class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white resize-none"></textarea>
                    </div>
                    <button type="submit" class="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl shadow-xl shadow-primary-500/20 transition-all transform active:scale-95 mt-4">Save Assignment</button>
                </form>
            </div>
        </div>
    `;

    document.getElementById('newAssignmentForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const [classId, section, subject] = formData.get('class_info').split('|');

        const { error } = await supabase.from('assignments').insert([{
            teacher_id: currentTeacher.id,
            class_id: classId,
            section: section || '',
            subject: subject || 'General',
            title: formData.get('title'),
            description: formData.get('description'),
            due_date: formData.get('due_date')
        }]);

        if (error) {
            toast.error('Failed to create assignment');
        } else {
            toast.success('Assignment created!');
            window.closeNewAssignmentModal();
            render(container);
        }
    });
}

window.openNewAssignmentModal = () => document.getElementById('newAssignmentModal').classList.remove('hidden');
window.closeNewAssignmentModal = () => document.getElementById('newAssignmentModal').classList.add('hidden');

window.deleteAssignment = async (id) => {
    if (!confirm('Are you sure you want to delete this assignment?')) return;
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else {
        toast.success('Assignment deleted');
        window.loadModule('teacher-assignments');
    }
};

window.viewSubmissions = async (id) => {
    activeAssignment = assignments.find(a => a.id === id);
    viewMode = 'submissions';
    const container = document.getElementById('mainContent');
    renderView(container);
};

// Submissions View
async function renderSubmissions(container) {
    container.innerHTML = `
        <div class="space-y-6 animate-in slide-in-from-right duration-500">
            <button onclick="window.backToList()" class="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold text-sm hover:translate-x-[-4px] transition-transform">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
                Back to Assignments
            </button>

            <div class="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div class="flex items-start justify-between">
                    <div>
                        <h2 class="text-3xl font-black text-gray-900 dark:text-white">${activeAssignment.title}</h2>
                        <p class="text-gray-500 mt-2">${activeAssignment.classes?.class_name} • ${activeAssignment.subject}</p>
                    </div>
                </div>
            </div>

            <div class="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                <div class="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h3 class="font-bold text-gray-900 dark:text-white">Student Submissions</h3>
                </div>
                <div id="submissionsList" class="p-6">
                    <p class="text-center text-gray-500 animate-pulse py-8">Loading submissions...</p>
                </div>
            </div>
        </div>
    `;

    // Load Submissions
    const ta = assignedClasses.find(a => a.class_id === activeAssignment.class_id && a.section === activeAssignment.section);
    const { data: students } = await supabase.from('students').select('*').eq('class', ta.classes.class_name).eq('section', ta.section).order('name');
    const { data: submissions } = await supabase.from('submissions').select('*').eq('assignment_id', activeAssignment.id);

    const listEl = document.getElementById('submissionsList');
    if (students.length === 0) {
        listEl.innerHTML = `<p class="text-center text-gray-500 py-8">No students found in this class.</p>`;
        return;
    }

    listEl.innerHTML = `
        <div class="divide-y divide-gray-100 dark:divide-gray-800">
            ${students.map(s => {
        const sub = submissions.find(subm => subm.student_id === s.id);
        return `
                    <div class="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">${s.name.charAt(0)}</div>
                            <div>
                                <p class="font-bold text-gray-900 dark:text-white">${s.name}</p>
                                <p class="text-[10px] text-gray-500 uppercase tracking-tighter">Roll: ${s.roll_no}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-4">
                            ${sub ? `
                                <span class="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold rounded-lg uppercase">Submitted</span>
                                <div class="flex items-center gap-2">
                                    <input type="number" 
                                        onchange="window.gradeSubmission('${sub.id}', this.value)"
                                        value="${sub.marks || ''}" 
                                        placeholder="Marks" 
                                        class="w-20 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border-none rounded-lg text-xs font-bold focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-white">
                                    <button onclick="window.viewSubmissionWork('${sub.file_url}')" class="p-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg></button>
                                </div>
                            ` : `
                                <span class="px-2 py-1 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded-lg uppercase">Missing</span>
                            `}
                        </div>
                    </div>
                `;
    }).join('')}
        </div>
    `;
}

window.backToList = () => {
    viewMode = 'list';
    renderView(document.getElementById('mainContent'));
};

window.gradeSubmission = async (id, marks) => {
    const { error } = await supabase.from('submissions').update({ marks, status: 'Graded' }).eq('id', id);
    if (!error) toast.success('Grade updated');
};

window.viewSubmissionWork = (url) => {
    if (url) window.open(url, '_blank');
    else toast.error('No file attached');
};
