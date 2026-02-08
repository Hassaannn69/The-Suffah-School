// Teacher Productivity Dashboard Module
const supabase = window.supabase;
const toast = window.toast || { success: (m) => alert(m), error: (m) => alert(m) };

export async function render(container) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Phase 1: Get Teacher ID
    const { data: teacherProfile } = await supabase.from('teachers').select('id, name').eq('auth_id', user.id).maybeSingle();
    if (!teacherProfile) return;

    const teacherId = teacherProfile.id;
    const getLocalDateStr = (d = new Date()) => {
        const date = new Date(d);
        date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
        return date.toISOString().split('T')[0];
    };
    const today = getLocalDateStr();

    const [assignmentsRes, classAssistsRes, attendanceRes, submissionsRes, marksRes] = await Promise.all([
        supabase.from('assignments').select('*, classes(class_name)').eq('teacher_id', teacherId),
        supabase.from('teacher_assignments').select('*, classes(*)').eq('teacher_id', teacherId),
        supabase.from('student_attendance').select('*').eq('date', today).eq('marked_by', teacherId),
        supabase.from('submissions').select('*, assignments(*)').is('marks', null),
        supabase.from('exam_marks').select('*, exams(*)').eq('marked_by', teacherId)
    ]);

    const assignments = assignmentsRes.data || [];
    const classAssists = classAssistsRes.data || [];
    const attendance = attendanceRes.data || [];
    const pendingSubmissions = submissionsRes.data || [];
    const allMarks = marksRes.data || [];

    // Group marks by Subject/Class for the performance cards
    const classPerformance = {};
    allMarks.forEach(m => {
        const key = `${m.subject}`;
        if (!classPerformance[key]) classPerformance[key] = { total: 0, count: 0, marks: [] };
        classPerformance[key].total += parseFloat(m.marks_obtained);
        classPerformance[key].count += 1;
        classPerformance[key].marks.push(parseFloat(m.marks_obtained));
    });

    const performanceCards = Object.entries(classPerformance).map(([subject, data]) => {
        const avg = Math.round(data.total / data.count);
        const lastAvg = data.marks.length > 1 ? data.marks[data.marks.length - 2] : avg;
        const diff = avg - lastAvg;
        const change = diff >= 0 ? `+${diff}%` : `${diff}%`;
        return { subject, avg: `${avg}%`, change, marks: data.marks.slice(-7) };
    }).slice(0, 3); // Top 3 subjects

    // Group pending submissions by assignment
    const gradingQueue = {};
    pendingSubmissions.forEach(s => {
        const aid = s.assignment_id;
        if (!gradingQueue[aid]) {
            gradingQueue[aid] = {
                title: s.assignments?.title || 'Untitled Assignment',
                meta: `${s.assignments?.subject || 'General'} • DUE ${s.assignments?.due_date ? new Date(s.assignments.due_date).toLocaleDateString() : 'N/A'}`,
                total: assignments.find(a => a.id === aid)?.total_students || 30, // Fallback total
                count: 0
            };
        }
        gradingQueue[aid].count += 1;
    });

    // Calculate Attendance Percentage (Refined to filter by Class AND Section)
    const assignedGroups = classAssists.map(a => ({
        className: a.classes?.class_name,
        section: a.section || ''
    })).filter(a => a.className);

    // Fetch all students in the relevant classes
    const classNames = [...new Set(assignedGroups.map(a => a.className))];
    const { data: allStudents } = await supabase.from('students').select('id, class, section').in('class', classNames);

    // Filter locally to only include students in the teacher's specific sections
    const relevantStudents = (allStudents || []).filter(s =>
        assignedGroups.some(a => a.className === s.class && (a.section === (s.section || '')))
    );

    // Get unique student IDs (in case a teacher is assigned multiple subjects to the same section)
    const uniqueStudentIds = [...new Set(relevantStudents.map(s => s.id))];
    const totalStudents = uniqueStudentIds.length;

    const presentCount = attendance.filter(a => ['present', 'Present', 'late', 'Late'].includes(a.status)).length;
    const attendancePercent = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

    const pendingReview = Object.keys(gradingQueue).length;
    const upcomingAssignments = assignments.filter(a => a.due_date && new Date(a.due_date) > now).sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    container.innerHTML = `
        <div class="max-w-[1600px] mx-auto space-y-8 pb-12 animate-in fade-in duration-700">
            <!-- Top Navigation / Search area -->
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div class="relative flex-1 max-w-2xl">
                    <input type="text" placeholder="Search student records, assignments, or resources..." class="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white transition-all shadow-inner">
                    <svg class="w-5 h-5 absolute left-4 top-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                </div>
                <div class="flex items-center gap-4">
                    <button class="relative p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl text-gray-500 hover:text-primary-600 transition-colors group">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                        <span class="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white dark:border-gray-900 animate-pulse"></span>
                    </button>
                    <button onclick="window.loadModule('teacher-exams')" class="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl font-black shadow-xl shadow-primary-500/20 transition-all transform hover:scale-105 active:scale-95 text-sm uppercase tracking-wider">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                        Post Grade
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-4 gap-8">
                <!-- Main Content (Col 1-3) -->
                <div class="xl:col-span-3 space-y-8">
                    <!-- Title Area -->
                    <div>
                        <h1 class="text-4xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Productivity Dashboard</h1>
                        <p class="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">${dateStr} • You have ${pendingReview} assignments pending review.</p>
                    </div>

                    <!-- Stat Tiles -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <!-- Total Students Tile -->
                        <div class="bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-6">
                            <div class="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
                            </div>
                            <div>
                                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Students</p>
                                <h3 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">${totalStudents}</h3>
                                <p class="text-[9px] font-bold text-emerald-500 flex items-center gap-1 mt-1">
                                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clip-rule="evenodd"/></svg>
                                    Active Learners
                                </p>
                            </div>
                        </div>

                        <!-- Class Attendance Tile -->
                        <div class="bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-6">
                            <div class="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            </div>
                            <div>
                                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Today's Attendance</p>
                                <h3 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">${attendancePercent}%</h3>
                                <p class="text-[9px] font-bold text-emerald-500 flex items-center gap-1 mt-1">
                                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>
                                    Consistent performance
                                </p>
                            </div>
                        </div>

                        <!-- Pending Grading Tile -->
                        <div class="bg-white dark:bg-gray-900 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex items-center gap-6">
                            <div class="w-14 h-14 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center text-rose-600 dark:text-rose-400">
                                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                            </div>
                            <div>
                                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tasks to Grade</p>
                                <h3 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">${pendingSubmissions.length}</h3>
                                <p class="text-[9px] font-bold text-rose-500 flex items-center gap-1 mt-1">
                                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/></svg>
                                    Action Required
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Graph Cards -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        ${performanceCards.length > 0 ? performanceCards.map((p, i) => renderGraphCard(p.subject, p.avg, p.change, `chart-perf-${i}`)).join('') : `
                            <div class="md:col-span-3 bg-gray-50 dark:bg-gray-800/20 p-8 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-gray-700 text-center">
                                <p class="text-gray-400 font-bold uppercase tracking-widest text-xs">No Performance Data Yet • Post exam marks to see analytics</p>
                            </div>
                        `}
                    </div>

                    <!-- Middle Grid -->
                    <div class="grid grid-cols-1 gap-8">
                        <!-- Grading Queue -->
                        <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col">
                            <div class="flex items-center justify-between mb-8">
                                <h3 class="flex items-center gap-3 text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                    <div class="p-2 bg-primary-50 dark:bg-primary-900/30 rounded-xl">
                                        <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
                                    </div>
                                    Grading Queue
                                </h3>
                                <button class="text-primary-600 dark:text-primary-400 text-sm font-black uppercase tracking-widest hover:underline">View All</button>
                            </div>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                                ${Object.values(gradingQueue).length > 0 ? Object.values(gradingQueue).slice(0, 4).map(item => renderGradingItem(item.title, item.meta, item.count, item.total, 'GRADE')).join('') : `
                                    <div class="md:col-span-2 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs border border-dashed border-gray-200 dark:border-gray-700 rounded-3xl">
                                        All caught up! No pending submissions.
                                    </div>
                                `}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Sidebar (Col 4) -->
                <div class="space-y-8">
                    <!-- Daily Agenda -->
                    <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm">
                        <div class="flex items-center justify-between mb-8">
                            <h3 class="flex items-center gap-3 text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z"/></svg>
                                Daily Agenda
                            </h3>
                            <span class="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-black rounded uppercase tracking-widest">${now.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }).toUpperCase()}</span>
                        </div>

                        <div class="relative space-y-8 before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 dark:before:bg-gray-800">
                            ${classAssists.length > 0 ? classAssists.map((a, i) => {
        const status = i === 0 ? 'active' : 'waiting';
        const time = i === 0 ? 'UPCOMING NOW' : `${8 + i}:00 AM`;
        return renderAgendaItem(time, `${a.classes?.class_name || 'N/A'} • ${a.section || 'General'}`, `Subject: ${a.subject || 'N/A'}`, status);
    }).join('') : `
                                <p class="text-xs text-gray-400 italic">No assigned classes today.</p>
                            `}
                        </div>

                        <!-- Today's Reminders -->
                        <div class="mt-12 pt-12 border-t border-gray-100 dark:border-gray-800">
                            <h4 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6">Today's Reminders</h4>
                            <div class="space-y-4">
                                ${upcomingAssignments.length > 0 ? upcomingAssignments.slice(0, 3).map(a => renderReminderItem(`Review: ${a.title} (Due ${new Date(a.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })})`, false)).join('') : `
                                    <p class="text-[11px] text-gray-400 italic">No upcoming assignment deadlines.</p>
                                `}
                            </div>
                        </div>

                        <!-- Footer Stats -->
                        <div class="mt-8 pt-8 flex border-t border-gray-100 dark:border-gray-800 text-center">
                            <div class="flex-1">
                                <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Avg Rating</p>
                                <p class="text-lg font-black text-gray-900 dark:text-white">4.9/5</p>
                            </div>
                            <div class="w-px bg-gray-100 dark:bg-gray-800"></div>
                            <div class="flex-1">
                                <p class="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Attendance</p>
                                <p class="text-lg font-black text-gray-900 dark:text-white">${attendancePercent}%</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Initialize Charts after rendering
    setTimeout(() => {
        performanceCards.forEach((p, i) => {
            initSparkline(`chart-perf-${i}`, p.marks, i % 2 === 0 ? '#4F46E5' : '#0D9488');
        });
    }, 100);
}

function renderGraphCard(title, percentage, change, chartId) {
    const isPositive = change.startsWith('+');
    return `
        <div class="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-sm hover:translate-y-[-4px] transition-all duration-300 group">
            <div class="flex items-center justify-between mb-4">
                <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">${title}</span>
                <svg class="w-5 h-5 text-gray-300 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V5l12 12H9z"/></svg>
            </div>
            <div class="flex items-baseline gap-2 mb-4">
                <span class="text-4xl font-black text-gray-900 dark:text-white">${percentage}</span>
                <span class="text-xs font-black ${isPositive ? 'text-emerald-500' : 'text-rose-500'}">${change}</span>
            </div>
            <div class="h-16 w-full overflow-hidden">
                <canvas id="${chartId}"></canvas>
            </div>
        </div>
    `;
}

function renderGradingItem(title, meta, current, total, action) {
    const percent = (current / total) * 100;
    let buttonClass = 'bg-primary-600 text-white';
    let label = 'GRADE';

    if (action === 'RESUME') {
        buttonClass = 'bg-gray-100 dark:bg-gray-800 text-primary-600 dark:text-primary-400';
        label = 'RESUME';
    } else if (action === 'WAITING') {
        buttonClass = 'hidden';
        label = '';
    }

    return `
        <div class="bg-gray-50 dark:bg-gray-800/30 p-5 rounded-2xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-all">
            <div class="flex items-start justify-between mb-3">
                <div>
                    <h4 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">${title}</h4>
                    <p class="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">${meta}</p>
                </div>
                ${label ? `<button class="px-4 py-1.5 ${buttonClass} rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">${label}</button>` : `<span class="text-[9px] font-bold text-gray-400 italic">No submissions yet</span>`}
            </div>
            <div class="flex items-center gap-4">
                <div class="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                    <div class="h-full bg-primary-600 rounded-full" style="width: ${percent}%"></div>
                </div>
                <span class="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tabular-nums">${current}/${total} Graded</span>
            </div>
        </div>
    `;
}

function renderAgendaItem(time, title, location, status) {
    const styles = {
        active: 'border-primary-600 ring-4 ring-primary-500/10 bg-primary-600',
        break: 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900',
        waiting: 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900',
        duty: 'border-amber-500 bg-amber-500 ring-4 ring-amber-500/10',
        meeting: 'border-indigo-600 bg-white dark:bg-gray-900'
    };

    const cardStyles = {
        active: 'bg-primary-600 text-white shadow-xl shadow-primary-500/30 border-none',
        break: 'bg-gray-50 dark:bg-gray-800/50 text-gray-400 dark:text-gray-500 italic border-transparent',
        duty: 'bg-amber-50 dark:bg-amber-900/10 border-amber-500/20 text-gray-900 dark:text-white'
    };

    return `
        <div class="flex gap-6 relative">
            <div class="flex-shrink-0 w-8 h-8 rounded-full border-2 ${styles[status] || styles.waiting} z-10 flex items-center justify-center transition-all">
                ${status === 'active' ? '<div class="w-2.5 h-2.5 bg-white rounded-full animate-pulse shadow-sm shadow-white"></div>' : ''}
            </div>
            <div class="flex-1 -mt-1">
                <p class="text-[10px] font-black ${status === 'active' ? 'text-primary-600' : 'text-gray-400'} uppercase tracking-widest mb-2">${time}</p>
                <div class="p-4 rounded-2xl border ${cardStyles[status] || 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'} shadow-sm transition-all hover:translate-x-1">
                    <h4 class="text-sm font-black uppercase tracking-tight">${title}</h4>
                    ${location ? `<p class="text-[10px] opacity-70 font-bold uppercase tracking-widest mt-1">${location}</p>` : ''}
                </div>
            </div>
        </div>
    `;
}

function renderReminderItem(text, checked) {
    return `
        <label class="flex items-center gap-3 cursor-pointer group">
            <div class="relative">
                <input type="checkbox" ${checked ? 'checked' : ''} class="peer sr-only">
                <div class="w-5 h-5 border-2 border-gray-200 dark:border-gray-700 rounded-lg group-hover:border-primary-500 transition-all peer-checked:bg-primary-600 peer-checked:border-primary-600"></div>
                ${checked ? `<svg class="w-3.5 h-3.5 absolute top-0.5 left-0.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>` : ''}
            </div>
            <span class="text-sm font-bold text-gray-600 dark:text-gray-300 group-hover:text-primary-600 transition-colors ${checked ? 'line-through opacity-50' : ''}">${text}</span>
        </label>
    `;
}

function initSparkline(id, data, color) {
    const ctx = document.getElementById(id).getContext('2d');
    const isDark = document.documentElement.classList.contains('dark');

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map((_, i) => i),
            datasets: [{
                data: data,
                borderColor: color,
                borderWidth: 3,
                tension: 0.45,
                pointRadius: 0,
                fill: true,
                backgroundColor: (context) => {
                    const chart = context.chart;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return null;
                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, color + '22');
                    gradient.addColorStop(1, color + '00');
                    return gradient;
                }
            }]
        },
        options: {
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            scales: { x: { display: false }, y: { display: false } }
        }
    });
}
