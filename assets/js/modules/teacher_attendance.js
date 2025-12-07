// Use global Supabase client for production compatibility
const supabase = window.supabase || (() => {
    console.error('Supabase client not found on window object');
    throw new Error('Supabase client not initialized');
})();

let currentAttendance = [];
let availableTeachers = [];
let selectedDate = new Date().toISOString().split('T')[0];

export async function render(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Header -->
            <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-200">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Teacher Attendance</h2>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Track daily teacher attendance</p>
                    </div>
                    <div class="flex space-x-3 items-center">
                        <input type="date" id="attendanceDate" value="${selectedDate}" class="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white">
                        <button id="markAllPresentBtn" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                            Mark All Present
                        </button>
                    </div>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 transition-colors">
                    <div class="text-sm text-gray-500 dark:text-gray-400">Total Teachers</div>
                    <div id="totalTeachers" class="text-2xl font-bold text-gray-900 dark:text-white mt-1">0</div>
                </div>
                <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-green-200 dark:border-green-900 p-4 transition-colors">
                    <div class="text-sm text-green-600 dark:text-green-400">Present</div>
                    <div id="presentCount" class="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">0</div>
                </div>
                <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-red-200 dark:border-red-900 p-4 transition-colors">
                    <div class="text-sm text-red-600 dark:text-red-400">Absent</div>
                    <div id="absentCount" class="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">0</div>
                </div>
                <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-yellow-200 dark:border-yellow-900 p-4 transition-colors">
                    <div class="text-sm text-yellow-600 dark:text-yellow-400">On Leave</div>
                    <div id="leaveCount" class="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">0</div>
                </div>
            </div>

            <!-- Attendance Table -->
            <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors duration-200">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th class="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Teacher</th>
                                <th class="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee ID</th>
                                <th class="p-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th class="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Remarks</th>
                            </tr>
                        </thead>
                        <tbody id="attendanceTableBody" class="divide-y divide-gray-200 dark:divide-gray-800">
                            <tr><td colspan="4" class="p-4 text-center text-gray-500 dark:text-gray-400">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Event Listeners
    document.getElementById('attendanceDate').addEventListener('change', (e) => {
        selectedDate = e.target.value;
        loadAttendance();
    });

    document.getElementById('markAllPresentBtn').addEventListener('click', markAllPresent);

    await loadTeachers();
    await loadAttendance();
}

async function loadTeachers() {
    const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('is_active', true)
        .order('name');

    if (error) {
        console.error('Error loading teachers:', error);
        return;
    }

    availableTeachers = data || [];
    document.getElementById('totalTeachers').textContent = availableTeachers.length;
}

async function loadAttendance() {
    const { data, error } = await supabase
        .from('teacher_attendance')
        .select('*')
        .eq('date', selectedDate);

    if (error) {
        console.error('Error loading attendance:', error);
        // Table might not exist yet
    }

    currentAttendance = data || [];
    renderAttendanceTable();
    updateStats();
}

function renderAttendanceTable() {
    const tbody = document.getElementById('attendanceTableBody');

    if (availableTeachers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-gray-500 dark:text-gray-400">No teachers found. Add teachers first.</td></tr>';
        return;
    }

    tbody.innerHTML = availableTeachers.map(teacher => {
        const record = currentAttendance.find(a => a.teacher_id === teacher.id);
        const status = record?.status || 'unmarked';

        return `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <td class="p-4">
                    <div class="flex items-center">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm mr-3">
                            ${teacher.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div class="font-medium text-gray-900 dark:text-white">${teacher.name}</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400">${teacher.email || '-'}</div>
                        </div>
                    </div>
                </td>
                <td class="p-4 text-gray-600 dark:text-gray-300 font-mono text-sm">${teacher.employee_id}</td>
                <td class="p-4">
                    <div class="flex justify-center space-x-2">
                        <button onclick="window.markAttendance('${teacher.id}', 'present')" class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${status === 'present' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-600'}">
                            Present
                        </button>
                        <button onclick="window.markAttendance('${teacher.id}', 'absent')" class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${status === 'absent' ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600'}">
                            Absent
                        </button>
                        <button onclick="window.markAttendance('${teacher.id}', 'leave')" class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${status === 'leave' ? 'bg-yellow-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 hover:text-yellow-600'}">
                            Leave
                        </button>
                    </div>
                </td>
                <td class="p-4">
                    <input type="text" placeholder="Add remarks..." value="${record?.remarks || ''}" onchange="window.updateRemarks('${teacher.id}', this.value)" class="w-full px-2 py-1 bg-transparent border-b border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 focus:border-primary-500 outline-none">
                </td>
            </tr>
        `;
    }).join('');
}

function updateStats() {
    const present = currentAttendance.filter(a => a.status === 'present').length;
    const absent = currentAttendance.filter(a => a.status === 'absent').length;
    const leave = currentAttendance.filter(a => a.status === 'leave').length;

    document.getElementById('presentCount').textContent = present;
    document.getElementById('absentCount').textContent = absent;
    document.getElementById('leaveCount').textContent = leave;
}

window.markAttendance = async (teacherId, status) => {
    const existing = currentAttendance.find(a => a.teacher_id === teacherId);

    let error;
    if (existing) {
        const res = await supabase.from('teacher_attendance').update({ status }).eq('id', existing.id);
        error = res.error;
    } else {
        const res = await supabase.from('teacher_attendance').insert([{
            teacher_id: teacherId,
            date: selectedDate,
            status: status
        }]);
        error = res.error;
    }

    if (error) {
        alert('Error marking attendance: ' + error.message);
    } else {
        await loadAttendance();
    }
};

window.updateRemarks = async (teacherId, remarks) => {
    const existing = currentAttendance.find(a => a.teacher_id === teacherId);

    if (existing) {
        const { error } = await supabase.from('teacher_attendance').update({ remarks }).eq('id', existing.id);
        if (error) {
            alert('Error updating remarks: ' + error.message);
        }
    }
};

async function markAllPresent() {
    const toInsert = availableTeachers
        .filter(t => !currentAttendance.find(a => a.teacher_id === t.id))
        .map(t => ({
            teacher_id: t.id,
            date: selectedDate,
            status: 'present'
        }));

    const toUpdate = currentAttendance.map(a => a.id);

    try {
        // Update existing
        if (toUpdate.length > 0) {
            await supabase.from('teacher_attendance').update({ status: 'present' }).in('id', toUpdate);
        }

        // Insert new
        if (toInsert.length > 0) {
            await supabase.from('teacher_attendance').insert(toInsert);
        }

        await loadAttendance();
    } catch (err) {
        alert('Error marking attendance: ' + err.message);
    }
}
