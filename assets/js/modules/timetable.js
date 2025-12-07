// Use global Supabase client for production compatibility
const supabase = window.supabase || (() => {
    console.error('Supabase client not found on window object');
    throw new Error('Supabase client not initialized');
})();

let currentTimetable = [];
let availableTeachers = [];
let availableClasses = [];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [
    { number: 1, start: '08:00', end: '08:45' },
    { number: 2, start: '08:45', end: '09:30' },
    { number: 3, start: '09:30', end: '10:15' },
    { number: 4, start: '10:30', end: '11:15' },
    { number: 5, start: '11:15', end: '12:00' },
    { number: 6, start: '12:00', end: '12:45' },
    { number: 7, start: '02:00', end: '02:45' },
    { number: 8, start: '02:45', end: '03:30' }
];

export async function render(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Header -->
            <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-200">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Timetable Management</h2>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Assign teachers to classes and periods</p>
                    </div>
                    <div class="flex space-x-3">
                        <select id="viewBySelect" class="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white">
                            <option value="class">View by Class</option>
                            <option value="teacher">View by Teacher</option>
                        </select>
                        <select id="filterSelect" class="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white">
                            <option value="">Select...</option>
                        </select>
                        <button id="addSlotBtn" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-lg shadow-primary-500/20">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Add Slot
                        </button>
                    </div>
                </div>
            </div>

            <!-- Timetable Grid -->
            <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors duration-200">
                <div class="overflow-x-auto">
                    <table class="w-full min-w-[800px]">
                        <thead class="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th class="p-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700 w-24">Period</th>
                                ${DAYS.map(day => `<th class="p-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">${day}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody id="timetableBody" class="divide-y divide-gray-200 dark:divide-gray-800">
                            <tr><td colspan="${DAYS.length + 1}" class="p-8 text-center text-gray-500 dark:text-gray-400">Select a class or teacher to view timetable</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Add Slot Modal -->
        <div id="slotModal" class="modal-overlay fixed inset-0 bg-black/80 hidden items-center justify-center z-50 backdrop-blur-sm overflow-y-auto transition-opacity duration-300">
            <div class="bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg mx-4 my-4 overflow-hidden transform transition-all duration-300 ease-out opacity-0 scale-95 translate-y-4 border border-gray-800">
                <div class="bg-gradient-to-r from-primary-600 to-indigo-600 p-6 flex justify-between items-center">
                    <h3 class="text-xl font-bold text-white">Add Timetable Slot</h3>
                    <button id="closeSlotModalBtn" class="text-white hover:text-gray-200 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form id="slotForm" class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">Teacher *</label>
                        <select id="slotTeacher" required class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500 outline-none">
                            <option value="">Select Teacher</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">Class *</label>
                        <select id="slotClass" required class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500 outline-none">
                            <option value="">Select Class</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">Subject *</label>
                        <input type="text" id="slotSubject" required placeholder="e.g. Mathematics" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 outline-none">
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Day *</label>
                            <select id="slotDay" required class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500 outline-none">
                                ${DAYS.map((day, i) => `<option value="${i + 1}">${day}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Period *</label>
                            <select id="slotPeriod" required class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500 outline-none">
                                ${PERIODS.map(p => `<option value="${p.number}">Period ${p.number} (${p.start} - ${p.end})</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div id="clashWarning" class="hidden bg-red-900/30 border border-red-700 rounded-lg p-3 text-red-400 text-sm">
                        <strong>⚠️ Clash Detected:</strong> <span id="clashMessage"></span>
                    </div>

                    <div class="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                        <button type="button" id="cancelSlotBtn" class="px-4 py-2 text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700">Cancel</button>
                        <button type="submit" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-lg shadow-primary-500/20">Save Slot</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Event Listeners
    document.getElementById('addSlotBtn').addEventListener('click', openSlotModal);
    document.getElementById('closeSlotModalBtn').addEventListener('click', closeSlotModal);
    document.getElementById('cancelSlotBtn').addEventListener('click', closeSlotModal);
    document.getElementById('slotForm').addEventListener('submit', handleSlotSubmit);
    document.getElementById('viewBySelect').addEventListener('change', handleViewChange);
    document.getElementById('filterSelect').addEventListener('change', loadTimetable);

    // Check for clash on change
    document.getElementById('slotTeacher').addEventListener('change', checkForClash);
    document.getElementById('slotDay').addEventListener('change', checkForClash);
    document.getElementById('slotPeriod').addEventListener('change', checkForClash);

    await loadData();
}

async function loadData() {
    // Load teachers
    const { data: teachers } = await supabase.from('teachers').select('id, name').eq('is_active', true).order('name');
    availableTeachers = teachers || [];

    // Load classes
    const { data: classes } = await supabase.from('classes').select('id, class_name').order('class_name');
    availableClasses = classes || [];

    // Populate dropdowns
    const teacherSelect = document.getElementById('slotTeacher');
    const filterSelect = document.getElementById('filterSelect');

    if (teacherSelect) {
        teacherSelect.innerHTML = '<option value="">Select Teacher</option>' +
            availableTeachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    }

    const classSelect = document.getElementById('slotClass');
    if (classSelect) {
        classSelect.innerHTML = '<option value="">Select Class</option>' +
            availableClasses.map(c => `<option value="${c.id}">${c.class_name}</option>`).join('');
    }

    // Initial filter options (classes by default)
    handleViewChange();
}

function handleViewChange() {
    const viewBy = document.getElementById('viewBySelect').value;
    const filterSelect = document.getElementById('filterSelect');

    if (viewBy === 'class') {
        filterSelect.innerHTML = '<option value="">Select Class</option>' +
            availableClasses.map(c => `<option value="${c.id}">${c.class_name}</option>`).join('');
    } else {
        filterSelect.innerHTML = '<option value="">Select Teacher</option>' +
            availableTeachers.map(t => `<option value="${t.id}">${t.name}</option>`).join('');
    }

    document.getElementById('timetableBody').innerHTML = `<tr><td colspan="${DAYS.length + 1}" class="p-8 text-center text-gray-500 dark:text-gray-400">Select a ${viewBy} to view timetable</td></tr>`;
}

async function loadTimetable() {
    const viewBy = document.getElementById('viewBySelect').value;
    const filterId = document.getElementById('filterSelect').value;

    if (!filterId) {
        document.getElementById('timetableBody').innerHTML = `<tr><td colspan="${DAYS.length + 1}" class="p-8 text-center text-gray-500 dark:text-gray-400">Select a ${viewBy} to view timetable</td></tr>`;
        return;
    }

    let query = supabase.from('timetable').select(`
        *,
        teachers (id, name),
        classes (id, class_name)
    `);

    if (viewBy === 'class') {
        query = query.eq('class_id', filterId);
    } else {
        query = query.eq('teacher_id', filterId);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error loading timetable:', error);
        document.getElementById('timetableBody').innerHTML = `<tr><td colspan="${DAYS.length + 1}" class="p-8 text-center text-red-400">Error loading timetable. Make sure the timetable table exists.</td></tr>`;
        return;
    }

    currentTimetable = data || [];
    renderTimetable(viewBy);
}

function renderTimetable(viewBy) {
    const tbody = document.getElementById('timetableBody');

    tbody.innerHTML = PERIODS.map(period => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <td class="p-3 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div class="font-medium text-gray-900 dark:text-white">Period ${period.number}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">${period.start} - ${period.end}</div>
            </td>
            ${DAYS.map((day, dayIndex) => {
        const slot = currentTimetable.find(s => s.day_of_week === dayIndex + 1 && s.period_number === period.number);
        if (slot) {
            return `
                        <td class="p-2 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                            <div class="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-2 text-center group relative">
                                <div class="font-medium text-primary-700 dark:text-primary-300 text-sm">${slot.subject}</div>
                                <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">${viewBy === 'class' ? slot.teachers?.name : slot.classes?.class_name}</div>
                                <button onclick="window.deleteSlot('${slot.id}')" class="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">×</button>
                            </div>
                        </td>
                    `;
        } else {
            return `<td class="p-2 border-r border-gray-200 dark:border-gray-700 last:border-r-0 text-center text-gray-300 dark:text-gray-600">-</td>`;
        }
    }).join('')}
        </tr>
    `).join('');
}

async function checkForClash() {
    const teacherId = document.getElementById('slotTeacher').value;
    const day = document.getElementById('slotDay').value;
    const period = document.getElementById('slotPeriod').value;
    const warningDiv = document.getElementById('clashWarning');

    if (!teacherId || !day || !period) {
        warningDiv.classList.add('hidden');
        return;
    }

    const { data } = await supabase.from('timetable')
        .select('*, classes(class_name)')
        .eq('teacher_id', teacherId)
        .eq('day_of_week', day)
        .eq('period_number', period);

    if (data && data.length > 0) {
        document.getElementById('clashMessage').textContent = `This teacher is already assigned to ${data[0].classes?.class_name || 'another class'} at this time.`;
        warningDiv.classList.remove('hidden');
    } else {
        warningDiv.classList.add('hidden');
    }
}

function openSlotModal() {
    const modal = document.getElementById('slotModal');
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    const content = modal.querySelector('div');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    void modal.offsetWidth;
    content.classList.remove('opacity-0', 'scale-95', 'translate-y-4');
    content.classList.add('opacity-100', 'scale-100', 'translate-y-0');

    document.getElementById('slotForm').reset();
    document.getElementById('clashWarning').classList.add('hidden');
}

function closeSlotModal() {
    const modal = document.getElementById('slotModal');
    const content = modal.querySelector('div');

    content.classList.remove('opacity-100', 'scale-100', 'translate-y-0');
    content.classList.add('opacity-0', 'scale-95', 'translate-y-4');

    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
}

async function handleSlotSubmit(e) {
    e.preventDefault();

    const slotData = {
        teacher_id: document.getElementById('slotTeacher').value,
        class_id: document.getElementById('slotClass').value,
        subject: document.getElementById('slotSubject').value.trim(),
        day_of_week: parseInt(document.getElementById('slotDay').value),
        period_number: parseInt(document.getElementById('slotPeriod').value)
    };

    const { error } = await supabase.from('timetable').insert([slotData]);

    if (error) {
        alert('Error saving slot: ' + error.message);
    } else {
        closeSlotModal();
        loadTimetable();
    }
}

window.deleteSlot = async (id) => {
    if (!confirm('Delete this timetable slot?')) return;

    const { error } = await supabase.from('timetable').delete().eq('id', id);
    if (error) {
        alert('Error deleting slot: ' + error.message);
    } else {
        loadTimetable();
    }
};
