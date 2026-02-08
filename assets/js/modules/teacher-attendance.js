// Teacher Student Attendance Module - EduFlow Redesign
const supabase = window.supabase;
const toast = window.toast || { success: (m) => alert(m), error: (m) => alert(m) };

let currentTeacher = null;
let assignedClasses = [];
let students = [];
let attendanceData = [];
let selectedClassId = '';
let selectedSection = '';
const getLocalDateStr = (date = new Date()) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
};

let selectedDate = getLocalDateStr();
let attendanceChart = null;

export async function render(container) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get teacher details
    const { data: teacher } = await supabase
        .from('teachers')
        .select('*')
        .eq('auth_id', user.id)
        .maybeSingle();

    if (!teacher) {
        container.innerHTML = `<div class="p-8 text-center text-red-500">Teacher profile not found.</div>`;
        return;
    }
    currentTeacher = teacher;

    // Get assigned classes
    const { data: assignments } = await supabase
        .from('teacher_assignments')
        .select('*, classes(*)')
        .eq('teacher_id', currentTeacher.id);

    assignedClasses = assignments || [];

    container.innerHTML = `
        <div class="max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-500 pb-24">
            <!-- Filter Bar -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm items-end">
                <div class="space-y-1">
                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Class</label>
                    <select id="classSelector" class="w-full px-4 py-2 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white">
                        <option value="">Select Class...</option>
                        ${[...new Set(assignedClasses.map(a => a.classes.class_name))].map(name => `
                            <option value="${name}">${name}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="space-y-1">
                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Section</label>
                    <select id="sectionSelector" class="w-full px-4 py-2 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white">
                        <option value="">Select Section...</option>
                    </select>
                </div>
                <div class="space-y-1">
                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date</label>
                    <input type="date" id="attendanceDate" value="${selectedDate}" max="${selectedDate}" class="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white">
                </div>
                <div>
                    <button id="markAllPresentBtn" class="w-full px-6 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-black uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all flex items-center justify-center gap-2 group disabled:opacity-50" disabled>
                        <svg class="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        Bulk Mark Present
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Main Content: Student Cards -->
                <div class="lg:col-span-2 space-y-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Student Attendance</h2>
                            <p id="classMeta" class="text-sm text-gray-500 font-medium">Please select a class and section to begin.</p>
                        </div>
                        <div class="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-[10px] font-black uppercase tracking-widest">
                            <button class="px-4 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg shadow-sm">List</button>
                            <button class="px-4 py-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors">Grid</button>
                        </div>
                    </div>

                    <div id="studentContainer" class="space-y-3">
                        <div class="py-20 flex flex-col items-center justify-center text-gray-400 opacity-40">
                            <svg class="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                            <p class="font-bold">Select parameters above to load students</p>
                        </div>
                    </div>
                </div>

                <!-- Sidebar: Summary & Stats -->
                <div class="space-y-6">
                    <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center">
                        <h3 class="w-full flex items-center gap-3 text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight mb-8">
                            <svg class="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>
                            Today's Summary
                        </h3>
                        
                        <div class="relative w-48 h-48 mb-8">
                            <canvas id="attendanceDoughnut"></canvas>
                            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span id="percentInner" class="text-3xl font-black text-gray-900 dark:text-white tracking-widest">0%</span>
                                <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Present</span>
                            </div>
                        </div>

                        <div class="w-full space-y-4">
                            ${renderStatRow('Present', '0', 'bg-blue-600', 'stat-present')}
                            ${renderStatRow('Absent', '0', 'bg-rose-500', 'stat-absent')}
                            ${renderStatRow('Late', '0', 'bg-amber-500', 'stat-late')}
                            ${renderStatRow('Pending', '0', 'bg-gray-200 dark:bg-gray-700', 'stat-pending')}
                        </div>

                        <div class="w-full mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 space-y-4">
                            <button class="w-full py-3 flex items-center justify-between px-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-all group">
                                <span class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">Quick Reports</span>
                                <svg class="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                            </button>
                            <button class="w-full py-3 flex items-center justify-between px-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-all group">
                                <span class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-tight">Send Alerts to Parents</span>
                                <svg class="w-4 h-4 text-gray-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                            </button>
                        </div>
                    </div>

                    <!-- Pro Tip -->
                    <div class="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/30">
                        <div class="flex gap-4">
                            <div class="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white flex-shrink-0 animate-pulse">
                                <span class="text-sm font-black">i</span>
                            </div>
                            <div>
                                <h4 class="text-xs font-black text-indigo-900 dark:text-indigo-400 uppercase tracking-widest mb-1">Pro Tip</h4>
                                <p class="text-[11px] text-indigo-800/70 dark:text-indigo-300 font-medium leading-relaxed">
                                    Use <span class="font-black text-indigo-900 dark:text-indigo-200">Enter</span> to move to the next student and <span class="font-black text-indigo-900 dark:text-indigo-200 text-[10px]">1, 2, 3</span> keys to mark attendance status quickly.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bottom Action Bar -->
            <div class="fixed bottom-0 left-0 lg:left-64 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-t border-gray-100 dark:border-gray-800 p-4 z-40 transform transition-transform translate-y-0 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <div class="max-w-[1600px] mx-auto flex items-center justify-between gap-8">
                    <div class="flex items-center gap-6 flex-1 max-w-xl">
                        <div class="flex-shrink-0 text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest tabular-nums">
                            Selection: <span id="markedCount" class="text-primary-600">0/0</span> Marked
                        </div>
                        <div class="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                            <div id="progressBar" class="h-full bg-primary-600 transition-all duration-500" style="width: 0%"></div>
                        </div>
                    </div>
                    <div class="flex items-center gap-4">
                        <button class="text-sm font-black text-gray-400 dark:hover:text-white transition-colors uppercase tracking-widest">Save as Draft</button>
                        <button id="submitBtn" class="px-10 py-3 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-2xl shadow-xl shadow-primary-500/20 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 uppercase tracking-widest text-sm">
                            Submit Attendance
                            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.815 12.197l-7.532 1.255a.5.5 0 00-.386.318L2.3 20.728c-.248.64.421 1.25 1.035.942l18.001-9c.477-.238.477-.918 0-1.157l-18-9c-.615-.308-1.283.303-1.035.942l2.597 6.958a.5.5 0 00.386.318l7.532 1.255a.2.2 0 010 .394z"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    initChart();
    setupEventListeners();
}

function renderStatRow(label, value, colorClass, id) {
    return `
        <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-3">
                <div class="w-2 h-2 rounded-full ${colorClass}"></div>
                <span class="font-bold text-gray-500 uppercase tracking-widest">${label}</span>
            </div>
            <span id="${id}" class="font-black text-gray-900 dark:text-white tabular-nums">${value}</span>
        </div>
    `;
}

function initChart() {
    const ctx = document.getElementById('attendanceDoughnut').getContext('2d');
    attendanceChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Present', 'Absent', 'Late', 'Pending'],
            datasets: [{
                data: [0, 0, 0, 1],
                backgroundColor: ['#2563EB', '#F43F5E', '#F59E0B', '#E5E7EB'],
                borderWidth: 0,
                cutout: '85%',
                borderRadius: 20,
                spacing: 5
            }]
        },
        options: {
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            responsive: true,
            maintainAspectRatio: false,
            animation: { duration: 1000, easing: 'easeOutElastic' }
        }
    });
}

function setupEventListeners() {
    const classSel = document.getElementById('classSelector');
    const sectionSel = document.getElementById('sectionSelector');
    const dateInput = document.getElementById('attendanceDate');
    const markAllBtn = document.getElementById('markAllPresentBtn');

    classSel.addEventListener('change', async () => {
        const className = classSel.value;
        if (!className) {
            sectionSel.innerHTML = '<option value="">Select Section...</option>';
            resetUI();
            return;
        }

        const sections = assignedClasses
            .filter(a => a.classes.class_name === className)
            .map(a => a.section);

        sectionSel.innerHTML = '<option value="">Select Section...</option>' +
            [...new Set(sections)].map(s => `<option value="${s || ''}">${s || 'All Sections'}</option>`).join('');
    });

    sectionSel.addEventListener('change', async () => {
        if (!classSel.value) return;
        const ta = assignedClasses.find(a => a.classes.class_name === classSel.value && (a.section || '') === sectionSel.value);
        if (ta) {
            selectedClassId = ta.class_id;
            selectedSection = ta.section;
            markAllBtn.disabled = false;
            await loadData();
        }
    });

    dateInput.addEventListener('change', async () => {
        selectedDate = dateInput.value;
        if (selectedClassId) await loadData();
    });

    markAllBtn.addEventListener('click', async () => {
        await markAllAsPresent();
    });

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
        submitBtn.addEventListener('click', () => {
            const marked = attendanceData.length;
            const total = students.length;
            if (marked < total) {
                toast.success(`Progress Saved: ${marked}/${total} students marked. Complete the rest when ready!`);
            } else {
                toast.success('Attendance submitted successfully for the entire class!');
            }
        });
    }
}

async function loadData() {
    const container = document.getElementById('studentContainer');
    container.innerHTML = `<div class="py-20 flex flex-col items-center justify-center animate-pulse"><p class="font-black text-gray-400 uppercase tracking-widest text-xs">Fetching Class Data...</p></div>`;

    const ta = assignedClasses.find(a => a.class_id === selectedClassId && (a.section || '') === (selectedSection || ''));

    document.getElementById('classMeta').textContent = `Marking for ${ta.classes.class_name} • ${selectedSection || 'All Sections'}`;

    const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .eq('class', ta.classes.class_name)
        .eq('section', selectedSection || '')
        .order('name');

    students = studentsData || [];

    const { data: attData } = await supabase
        .from('student_attendance')
        .select('*')
        .eq('class_id', selectedClassId)
        .eq('date', selectedDate);

    attendanceData = attData || [];

    renderCards();
    updateDashboard();
}

function renderCards() {
    const container = document.getElementById('studentContainer');
    if (students.length === 0) {
        container.innerHTML = `<div class="py-20 text-center text-gray-500 font-bold">No students found in this section.</div>`;
        return;
    }

    container.innerHTML = students.map(student => {
        const record = attendanceData.find(a => a.student_id === student.id);
        const status = record?.status || '';

        return `
            <div class="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all flex items-center justify-between gap-6 group">
                <div class="flex items-center gap-4">
                    <div class="relative">
                        <div class="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center font-black text-gray-400 text-sm border-2 border-white dark:border-gray-900 shadow-sm overflow-hidden">
                            ${student.name.charAt(0)}
                        </div>
                        <div class="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-900 ${status ? 'bg-emerald-500' : 'bg-gray-300'}"></div>
                    </div>
                    <div>
                        <h4 class="font-black text-gray-900 dark:text-white uppercase tracking-tight text-sm">${student.name}</h4>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Roll No: #${student.roll_no.slice(-6)}</p>
                    </div>
                </div>

                <div class="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50 p-1 rounded-2xl border border-transparent focus-within:border-primary-500 transition-all">
                    <button onclick="window.updateStatus('${student.id}', 'Present')" class="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${status === 'Present' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-blue-600 hover:bg-white dark:hover:bg-gray-800'} flex items-center gap-2">
                        ${status === 'Present' ? '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>' : ''}
                        Present
                    </button>
                    <button onclick="window.updateStatus('${student.id}', 'Absent')" class="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${status === 'Absent' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-gray-400 hover:text-rose-500 hover:bg-white dark:hover:bg-gray-800'} flex items-center gap-2">
                         ${status === 'Absent' ? '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>' : ''}
                        Absent
                    </button>
                    <button onclick="window.updateStatus('${student.id}', 'Late')" class="px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${status === 'Late' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-amber-500 hover:bg-white dark:hover:bg-gray-800'} flex items-center gap-2">
                         ${status === 'Late' ? '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>' : ''}
                        Late
                    </button>
                    <button class="p-2 text-gray-300 hover:text-gray-500 border-l border-gray-100 dark:border-gray-700 ml-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function updateDashboard() {
    const total = students.length;
    const present = attendanceData.filter(a => a.status === 'Present').length;
    const absent = attendanceData.filter(a => a.status === 'Absent').length;
    const late = attendanceData.filter(a => a.status === 'Late').length;
    const marked = attendanceData.length;
    const pending = total - marked;

    // Numerical Stats
    document.getElementById('stat-present').textContent = present;
    document.getElementById('stat-absent').textContent = absent;
    document.getElementById('stat-late').textContent = late;
    document.getElementById('stat-pending').textContent = pending;

    // Bottom Progress
    document.getElementById('markedCount').textContent = `${marked}/${total}`;
    const percent = total > 0 ? (marked / total) * 100 : 0;
    document.getElementById('progressBar').style.width = `${percent}%`;

    // Chart Update
    if (attendanceChart) {
        attendanceChart.data.datasets[0].data = [present, absent, late, pending || (total === 0 ? 1 : 0)];
        attendanceChart.update();
    }

    // Inner Percent
    const presentPercent = total > 0 ? Math.round((present / total) * 100) : 0;
    document.getElementById('percentInner').textContent = `${presentPercent}%`;
}

window.updateStatus = async (studentId, status) => {
    if (!currentTeacher?.id || !selectedClassId) {
        toast.error('Session error: Please refresh and try again.');
        return;
    }

    const existing = attendanceData.find(a => a.student_id === studentId);

    // Save previous status for rollback if needed
    const prevStatus = existing?.status;

    // Optimistic Update
    if (existing) {
        existing.status = status;
    } else {
        // Create a temporary record without an ID
        attendanceData.push({
            student_id: studentId,
            status: status,
            date: selectedDate,
            class_id: selectedClassId,
            section: selectedSection || '',
            marked_by: currentTeacher.id
        });
    }
    renderCards();
    updateDashboard();

    try {
        let result;
        // CRITICAL FIX: Only update if we have a real database ID
        if (existing && existing.id) {
            result = await supabase.from('student_attendance')
                .update({ status, marked_by: currentTeacher.id })
                .eq('id', existing.id);
        } else {
            // Otherwise insert (this handles both brand new and previously "optimistically" added but not yet saved)
            result = await supabase.from('student_attendance').insert([{
                student_id: studentId,
                class_id: selectedClassId,
                section: selectedSection || '',
                date: selectedDate,
                status: status,
                marked_by: currentTeacher.id
            }]).select();
        }

        if (result.error) throw result.error;

        // Refresh specific record or the whole set
        const { data: freshData } = await supabase.from('student_attendance')
            .select('*')
            .eq('class_id', selectedClassId)
            .eq('date', selectedDate);

        attendanceData = freshData || [];
        updateDashboard();

    } catch (err) {
        console.error('Attendance Sync Error:', err);
        toast.error('Sync failed: ' + (err.message || 'Database error'));
        // Re-load to ensure UI matches DB
        await loadData();
    }
};

async function markAllAsPresent() {
    const unmarked = students.filter(s => !attendanceData.some(a => a.student_id === s.id));
    if (unmarked.length === 0) return;

    const newRecords = unmarked.map(s => ({
        student_id: s.id,
        class_id: selectedClassId,
        section: selectedSection || '',
        date: selectedDate,
        status: 'Present',
        marked_by: currentTeacher.id
    }));

    const { error } = await supabase.from('student_attendance').insert(newRecords);
    if (!error) {
        toast.success('All marked as present');
        loadData();
    }
}

function resetUI() {
    document.getElementById('studentContainer').innerHTML = `<div class="py-20 text-center text-gray-400 opacity-40 italic">Select parameters to load students</div>`;
    document.getElementById('classMeta').textContent = 'Please select a class and section to begin.';
    document.getElementById('markedCount').textContent = '0/0';
    document.getElementById('progressBar').style.width = '0%';
    document.getElementById('percentInner').textContent = '0%';
    if (attendanceChart) {
        attendanceChart.data.datasets[0].data = [0, 0, 0, 1];
        attendanceChart.update();
    }
}
