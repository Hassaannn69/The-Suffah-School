// Use global Supabase client for production compatibility
const supabase = window.supabase || (() => {
    console.error('Supabase client not found on window object');
    throw new Error('Supabase client not initialized');
})();

let teachersData = [];
let classesData = [];

// State Management
const state = {
    selectedTeacher: '',
    selectedClass: '',
    selectedSubject: ''
};

export async function render(container) {
    container.innerHTML = `
        <div class="flex items-center justify-center min-h-[50vh]">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 w-full max-w-xl overflow-hidden relative">
                <!-- Decorative Top Border -->
                <div class="h-1.5 bg-gradient-to-r from-primary-500 to-indigo-600 w-full"></div>
                
                <div class="p-8">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Assign Class to Teacher</h2>
                    <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">Select a teacher, class, and subject to create a schedule assignment.</p>
                    
                    <form id="assignClassForm" class="space-y-6">
                        <!-- Teacher Selection -->
                        <div class="space-y-2">
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300">Teacher</label>
                            <div class="relative">
                                <select id="selectTeacher" class="w-full h-12 px-4 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer">
                                    <option value="">Select a teacher...</option>
                                    <option disabled>Loading teachers...</option>
                                </select>
                                <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>

                        <!-- Class Selection -->
                        <div class="space-y-2">
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300">Class & Section</label>
                            <div class="relative">
                                <select id="selectClass" class="w-full h-12 px-4 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer">
                                    <option value="">Select a class...</option>
                                    <option disabled>Loading classes...</option>
                                </select>
                                <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>

                        <!-- Subject Selection -->
                        <div class="space-y-2">
                            <label class="block text-sm font-semibold text-gray-700 dark:text-gray-300">Subject</label>
                            <div class="relative">
                                <select id="selectSubject" disabled class="w-full h-12 px-4 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all appearance-none cursor-not-allowed opacity-75">
                                    <option value="">Select a teacher first...</option>
                                </select>
                                <div class="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Populated based on teacher's expertise</p>
                        </div>

                        <!-- Action Button -->
                        <div class="pt-2">
                            <button type="submit" id="assignBtn" class="w-full h-12 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg shadow-lg shadow-primary-500/30 transition-all flex items-center justify-center gap-2 transform active:scale-95">
                                Assign Class
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    setupEventListeners();
    await fetchAndPopulateData();
}

async function fetchAndPopulateData() {
    try {
        const [teachersReq, classesReq] = await Promise.all([
            supabase.from('teachers').select('*').order('name'),
            supabase.from('classes').select('*').order('class_name')
        ]);

        if (teachersReq.error) throw teachersReq.error;
        if (classesReq.error) throw classesReq.error;

        teachersData = teachersReq.data || [];
        classesData = classesReq.data || [];

        populateDropdowns();

    } catch (err) {
        console.error('Error fetching data:', err);
        alert('Failed to load data: ' + err.message);
    }
}

function populateDropdowns() {
    const teacherSelect = document.getElementById('selectTeacher');
    const classSelect = document.getElementById('selectClass');

    // Populate Teachers
    teacherSelect.innerHTML = '<option value="">Select a teacher...</option>';
    teachersData.forEach(t => {
        const option = document.createElement('option');
        option.value = t.id;
        option.textContent = `${t.name} (${t.employee_id})`;
        teacherSelect.appendChild(option);
    });

    // Populate Classes
    classSelect.innerHTML = '<option value="">Select a class...</option>';
    classesData.forEach(c => {
        // Flatten selections for simplicity: Each section is an option, e.g., "Class 10 - A"
        if (c.sections && c.sections.length > 0) {
            c.sections.forEach(sec => {
                const option = document.createElement('option');
                option.value = `${c.id}|${c.class_name}|${sec}`; // Store composite value
                option.textContent = `${c.class_name} - Section ${sec}`;
                classSelect.appendChild(option);
            });
        } else {
            const option = document.createElement('option');
            option.value = `${c.id}|${c.class_name}|Main`;
            option.textContent = c.class_name;
            classSelect.appendChild(option);
        }
    });
}

function updateSubjectDropdown(teacherId) {
    const teacher = teachersData.find(t => t.id === teacherId);
    const subjectSelect = document.getElementById('selectSubject');

    subjectSelect.innerHTML = '<option value="">Select a subject...</option>';

    if (teacher && teacher.subjects && teacher.subjects.length > 0) {
        subjectSelect.disabled = false;
        subjectSelect.classList.remove('bg-gray-100', 'dark:bg-gray-900', 'cursor-not-allowed', 'opacity-75');
        subjectSelect.classList.add('bg-gray-50', 'dark:bg-gray-700', 'cursor-pointer');

        teacher.subjects.forEach(sub => {
            const option = document.createElement('option');
            option.value = sub;
            option.textContent = sub;
            subjectSelect.appendChild(option);
        });
    } else {
        subjectSelect.disabled = true;
        subjectSelect.classList.add('bg-gray-100', 'dark:bg-gray-900', 'cursor-not-allowed', 'opacity-75');
        subjectSelect.classList.remove('bg-gray-50', 'dark:bg-gray-700', 'cursor-pointer');
        subjectSelect.innerHTML = '<option value="">No subjects assigned to this teacher</option>';
    }
}

function setupEventListeners() {
    const teacherSelect = document.getElementById('selectTeacher');
    const classSelect = document.getElementById('selectClass');
    const subjectSelect = document.getElementById('selectSubject');
    const form = document.getElementById('assignClassForm');

    teacherSelect.addEventListener('change', (e) => {
        state.selectedTeacher = e.target.value;
        updateSubjectDropdown(e.target.value);
        validateForm();
    });

    classSelect.addEventListener('change', (e) => {
        state.selectedClass = e.target.value;
        validateForm();
    });

    subjectSelect.addEventListener('change', (e) => {
        state.selectedSubject = e.target.value;
        validateForm();
    });

    form.addEventListener('submit', handleSubmit);
}

function validateForm() {
    const isValid = state.selectedTeacher && state.selectedClass && state.selectedSubject;
    const btn = document.getElementById('assignBtn');

    // We can also visually highlight fields here if needed
    if (isValid) {
        btn.classList.add('hover:bg-primary-700');
        btn.style.opacity = '1';
    }
}

async function handleSubmit(e) {
    e.preventDefault();

    const teacherEl = document.getElementById('selectTeacher');
    const classEl = document.getElementById('selectClass');
    const subjectEl = document.getElementById('selectSubject');

    // Validation
    let hasError = false;
    [teacherEl, classEl, subjectEl].forEach(el => {
        if (!el.value) {
            el.classList.add('ring-2', 'ring-red-500', 'border-red-500');
            hasError = true;
        } else {
            el.classList.remove('ring-2', 'ring-red-500', 'border-red-500');
        }
    });

    if (hasError) {
        // Shake animation or simple alert
        return;
    }

    // Set Loading State
    const btn = document.getElementById('assignBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `
        <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Assigning...
    `;

    // Simulate Network Request
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Log Logic
    const teacher = teachersData.find(t => t.id === state.selectedTeacher);
    const [classId, className, section] = state.selectedClass.split('|');

    const assignmentData = {
        teacher_id: state.selectedTeacher,
        teacher_name: teacher.name,
        class_id: classId,
        class_name: className,
        section: section,
        subject: state.selectedSubject,
        assigned_at: new Date().toISOString()
    };

    console.log('--------------------------------');
    console.log(' CLASS ASSIGNMENT SUCCESSFUL');
    console.log('--------------------------------');
    console.log('Data:', assignmentData);

    // Show Success Notification
    alert(`Success!\n\n${teacher.name} has been assigned to:\n${className} (${section}) - ${state.selectedSubject}`);

    // Reset Form
    e.target.reset();
    state.selectedTeacher = '';
    state.selectedClass = '';
    state.selectedSubject = '';
    updateSubjectDropdown(null); // Reset subject dropdown

    // Reset Button
    btn.innerHTML = `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
        Assigned!
    `;
    btn.classList.replace('bg-primary-600', 'bg-green-600');

    setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        btn.classList.replace('bg-green-600', 'bg-primary-600');
    }, 2000);
}
