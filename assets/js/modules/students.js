// Use global Supabase client for production compatibility
const supabase = window.supabase || (() => {
    console.error('Supabase client not found on window object');
    throw new Error('Supabase client not initialized');
})();

let currentStudents = [];
let availableClasses = []; // Store classes and their sections

export async function render(container) {
    container.innerHTML = `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 class="text-xl font-bold text-gray-800">Students Directory</h2>
                <div class="flex space-x-3">
                    <input type="text" id="searchInput" placeholder="Search students..." class="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                    
                    <!-- Dropdown Button -->
                    <div class="relative">
                        <button id="addStudentDropdown" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Add Student
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        
                        <!-- Dropdown Menu -->
                        <div id="studentDropdownMenu" class="hidden absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
                            <button id="addSingleStudent" class="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center transition-colors border-b border-gray-100">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <div>
                                    <div class="font-medium text-gray-900">Add a Student</div>
                                    <div class="text-xs text-gray-500">Single admission</div>
                                </div>
                            </button>
                            <button id="addBulkStudents" class="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <div>
                                    <div class="font-medium text-gray-900">Add Bulk Students</div>
                                    <div class="text-xs text-gray-500">Upload Excel file</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                            <th class="p-4 font-semibold">Name</th>
                            <th class="p-4 font-semibold">Roll No</th>
                            <th class="p-4 font-semibold">Class</th>
                            <th class="p-4 font-semibold">Contact</th>
                            <th class="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="studentsTableBody" class="text-gray-700 text-sm divide-y divide-gray-100">
                        <tr><td colspan="5" class="p-4 text-center">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
            
            <!-- Pagination (Simple) -->
            <div class="p-4 border-t border-gray-100 flex justify-end">
                <span class="text-xs text-gray-400">Showing all records</span>
            </div>
        </div>

        <!-- Modal -->
        <div id="studentModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 backdrop-blur-sm">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden transform transition-all">
                <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 class="text-lg font-bold text-gray-800" id="modalTitle">Add New Student</h3>
                    <button id="closeModalBtn" class="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form id="studentForm" class="p-6 space-y-4">
                    <input type="hidden" id="studentId">
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input type="text" id="name" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
                            <input type="text" id="roll_no" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Class</label>
                            <select id="class" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                                <option value="">Select Class</option>
                                <!-- Populated dynamically -->
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Section</label>
                            <select id="section" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                                <option value="">Select Section</option>
                                <!-- Populated dynamically based on class -->
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" id="email" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input type="tel" id="phone" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                        </div>
                    </div>

                     <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                        <select id="gender" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div class="flex justify-end pt-4">
                        <button type="button" id="cancelBtn" class="mr-3 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">Save Student</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Bulk Upload Modal -->
        <div id="bulkUploadModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 backdrop-blur-sm">
            <!-- ... (existing bulk modal content) ... -->
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden transform transition-all">
                <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 class="text-lg font-bold text-gray-800">Add Bulk Students</h3>
                    <button id="closeBulkModalBtn" class="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-6">
                    <!-- Instructions -->
                    <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg class="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                                </svg>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm text-blue-700">
                                    <strong>Instructions:</strong> Download the Excel template, fill in student details, and upload the file to add multiple students at once.
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Download Template -->
                    <div class="mb-6">
                        <button id="downloadTemplateBtn" class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download Excel Template
                        </button>
                    </div>

                    <!-- Upload File -->
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Upload Filled Excel File</label>
                        <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
                            <input type="file" id="excelFileInput" accept=".xlsx,.xls" class="hidden">
                            <label for="excelFileInput" class="cursor-pointer">
                                <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                                <p class="mt-2 text-sm text-gray-600">Click to select Excel file or drag and drop</p>
                                <p class="text-xs text-gray-500">XLSX or XLS files only</p>
                            </label>
                        </div>
                        <p id="selectedFileName" class="mt-2 text-sm text-gray-600"></p>
                    </div>

                    <!-- Preview/Errors -->
                    <div id="uploadResults" class="hidden mb-6">
                        <h4 class="font-semibold text-gray-800 mb-2">Upload Summary</h4>
                        <div id="uploadSummary" class="bg-gray-50 rounded-lg p-4 text-sm"></div>
                    </div>

                    <!-- Actions -->
                    <div class="flex justify-end space-x-3">
                        <button type="button" id="cancelBulkBtn" class="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                        <button type="button" id="uploadStudentsBtn" disabled class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Upload Students</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Credentials Modal -->
        <div id="credentialsModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 backdrop-blur-sm">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all animate-bounce-in">
                <div class="bg-green-500 p-6 text-center">
                    <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 class="text-2xl font-bold text-white">Student Added!</h3>
                    <p class="text-green-100 mt-1">Credentials generated successfully</p>
                </div>
                <div class="p-6 space-y-4">
                    <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div class="mb-3">
                            <label class="text-xs text-gray-500 uppercase font-semibold">Email / Username</label>
                            <div class="flex items-center justify-between mt-1">
                                <code id="credEmail" class="text-lg font-mono text-gray-800 font-bold">user@school.com</code>
                                <button onclick="navigator.clipboard.writeText(document.getElementById('credEmail').textContent)" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Copy</button>
                            </div>
                        </div>
                        <div>
                            <label class="text-xs text-gray-500 uppercase font-semibold">Password</label>
                            <div class="flex items-center justify-between mt-1">
                                <code id="credPassword" class="text-lg font-mono text-gray-800 font-bold">Pass123!</code>
                                <button onclick="navigator.clipboard.writeText(document.getElementById('credPassword').textContent)" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium">Copy</button>
                            </div>
                        </div>
                    </div>
                    <p class="text-sm text-gray-500 text-center">Please share these credentials with the student.</p>
                    <button id="closeCredModalBtn" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg shadow-lg transition-transform transform hover:-translate-y-0.5">
                        Done
                    </button>
                </div>
            </div>
        </div>
    `;

    // Event Listeners
    // Dropdown toggle
    const dropdown = document.getElementById('addStudentDropdown');
    const dropdownMenu = document.getElementById('studentDropdownMenu');

    dropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        dropdownMenu.classList.add('hidden');
    });

    // Single student modal
    document.getElementById('addSingleStudent').addEventListener('click', () => {
        dropdownMenu.classList.add('hidden');
        openModal();
    });

    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('studentForm').addEventListener('submit', handleFormSubmit);

    // Bulk upload modal
    document.getElementById('addBulkStudents').addEventListener('click', () => {
        dropdownMenu.classList.add('hidden');
        openBulkModal();
    });

    document.getElementById('closeBulkModalBtn').addEventListener('click', closeBulkModal);
    document.getElementById('cancelBulkBtn').addEventListener('click', closeBulkModal);
    document.getElementById('downloadTemplateBtn').addEventListener('click', downloadTemplate);
    document.getElementById('excelFileInput').addEventListener('change', handleFileSelect);
    document.getElementById('uploadStudentsBtn').addEventListener('click', handleBulkUpload);
    document.getElementById('closeCredModalBtn').addEventListener('click', () => {
        document.getElementById('credentialsModal').classList.add('hidden');
    });

    // Search
    document.getElementById('searchInput').addEventListener('input', handleSearch);

    // Class selection change listener for dynamic sections
    document.getElementById('class').addEventListener('change', handleClassChange);

    await fetchStudents();
}

let parsedStudents = []; // Store parsed students from Excel

async function fetchStudents() {
    const tbody = document.getElementById('studentsTableBody');
    tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">Loading...</td></tr>';

    const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching students:', error);
        tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500">Error: ${error.message}</td></tr>`;
        return;
    }

    currentStudents = data;
    renderTable(currentStudents);
}

function renderTable(students) {
    const tbody = document.getElementById('studentsTableBody');

    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-400">No students found.</td></tr>';
        return;
    }

    tbody.innerHTML = students.map(student => `
        <tr class="hover:bg-gray-50 transition-colors group">
            <td class="p-4">
                <div class="flex items-center">
                    <div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold mr-3 text-xs">
                        ${student.name.charAt(0)}
                    </div>
                    <div>
                        <div class="font-medium text-gray-900">${student.name}</div>
                        <div class="text-xs text-gray-500">${student.email || ''}</div>
                    </div>
                </div>
            </td>
            <td class="p-4 text-gray-600">${student.roll_no}</td>
            <td class="p-4 text-gray-600">${student.class} (${student.section})</td>
            <td class="p-4 text-gray-600">${student.phone || '-'}</td>
            <td class="p-4 text-right">
                <button onclick="window.editStudent('${student.id}')" class="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
                <button onclick="window.deleteStudent('${student.id}')" class="text-red-600 hover:text-red-900">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Expose functions to window for inline onclicks (simple approach)
window.editStudent = (id) => {
    const student = currentStudents.find(s => s.id === id);
    if (student) openModal(student);
};

window.deleteStudent = async (id) => {
    if (!confirm('Are you sure you want to delete this student?')) return;

    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) {
        alert('Error deleting student: ' + error.message);
    } else {
        fetchStudents();
    }
};

async function openModal(student = null) {
    const modal = document.getElementById('studentModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('studentForm');
    const rollNoInput = document.getElementById('roll_no');

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Load classes into dropdown
    await loadClassesIntoDropdown();

    if (student) {
        title.textContent = 'Edit Student';
        document.getElementById('studentId').value = student.id;
        document.getElementById('name').value = student.name;

        rollNoInput.value = student.roll_no;
        rollNoInput.readOnly = true; // Roll no shouldn't change usually
        rollNoInput.classList.add('bg-gray-100');

        document.getElementById('class').value = student.class;

        // Trigger class change to load sections, then select the correct section
        handleClassChange();
        document.getElementById('section').value = student.section;

        document.getElementById('email').value = student.email || '';
        document.getElementById('phone').value = student.phone || '';
        document.getElementById('gender').value = student.gender || 'Male';
    } else {
        title.textContent = 'Add New Student';
        form.reset();
        document.getElementById('studentId').value = '';

        // Auto-generate Roll No
        rollNoInput.value = 'Loading...';
        rollNoInput.readOnly = true;
        rollNoInput.classList.add('bg-gray-100');

        const nextRoll = await generateNextRollNo();
        rollNoInput.value = nextRoll;
    }
}

async function loadClassesIntoDropdown() {
    const select = document.getElementById('class');
    const { data, error } = await supabase.from('classes').select('class_name, sections').order('class_name');

    if (data && data.length > 0) {
        availableClasses = data;
        const currentValue = select.value;
        select.innerHTML = '<option value="">Select Class</option>' +
            data.map(c => `<option value="${c.class_name}">${c.class_name}</option>`).join('');
        if (currentValue) {
            select.value = currentValue;
        }
    }
}

function handleClassChange() {
    const classSelect = document.getElementById('class');
    const sectionSelect = document.getElementById('section');
    const selectedClassName = classSelect.value;

    // Clear existing options
    sectionSelect.innerHTML = '<option value="">Select Section</option>';

    if (!selectedClassName) return;

    const selectedClass = availableClasses.find(c => c.class_name === selectedClassName);

    if (selectedClass && selectedClass.sections && selectedClass.sections.length > 0) {
        sectionSelect.innerHTML += selectedClass.sections.map(s => `<option value="${s}">${s}</option>`).join('');
    } else {
        // If no sections defined, maybe show a default or keep empty
        // User requested "only those sections which are created by user"
        // So we leave it empty or show "No sections found"
    }
}

async function generateNextRollNo() {
    try {
        const { data, error } = await supabase
            .from('students')
            .select('roll_no')
            .order('created_at', { ascending: false })
            .limit(1);

        if (data && data.length > 0) {
            const lastRoll = data[0].roll_no;
            // Try to extract number part
            const match = lastRoll.match(/(\d+)$/);
            if (match) {
                const numberPart = match[1];
                const prefix = lastRoll.substring(0, lastRoll.length - numberPart.length);
                const nextNumber = parseInt(numberPart) + 1;
                // Pad with zeros to match length of previous number
                return `${prefix}${nextNumber.toString().padStart(numberPart.length, '0')}`;
            }
        }
        return 'ST-001'; // Default start
    } catch (err) {
        console.error('Error generating roll no:', err);
        return 'ST-001';
    }
}

function closeModal() {
    const modal = document.getElementById('studentModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('studentId').value;
    const name = document.getElementById('name').value.trim();
    const roll_no = document.getElementById('roll_no').value;
    const studentClass = document.getElementById('class').value;
    const section = document.getElementById('section').value;
    const phone = document.getElementById('phone').value;
    const gender = document.getElementById('gender').value;
    let email = document.getElementById('email').value.trim();

    const saveBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        let generatedCreds = null;

        // If new student (no ID), handle credential generation
        if (!id) {
            // 1. Generate Credentials if email is empty
            if (!email) {
                // Generate username from name (e.g., John Doe -> john.doe)
                const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
                const randomSuffix = Math.floor(Math.random() * 100); // Add small number to avoid collision
                const username = `${cleanName}${randomSuffix}`;
                email = `${username}@school.com`;
            }

            // 2. Generate Password (e.g., Name123!)
            const firstName = name.split(' ')[0];
            const password = `${firstName}123!`;

            // 3. Create Auth User (using secondary client)
            console.log('Creating auth user for:', email);
            const authUser = await createAuthUser(email, password, name);

            if (authUser) {
                generatedCreds = { email, password };
            }
        }

        const studentData = {
            name,
            roll_no,
            class: studentClass,
            section,
            email,
            phone,
            gender,
        };

        let error;
        if (id) {
            // Update
            const res = await supabase.from('students').update(studentData).eq('id', id);
            error = res.error;
        } else {
            // Insert
            const res = await supabase.from('students').insert([studentData]);
            error = res.error;
        }

        if (error) throw error;

        closeModal();
        fetchStudents();

        // Show credentials if generated
        if (generatedCreds) {
            showCredentialsModal(generatedCreds.email, generatedCreds.password);
        } else {
            // alert('Student saved successfully!');
        }

    } catch (error) {
        console.error('Error saving student:', error);
        alert('Error saving student: ' + error.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalBtnText;
    }
}

// Helper to create auth user without logging out admin
async function createAuthUser(email, password, name) {
    try {
        // Create a temporary client using the global config
        if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY) {
            throw new Error('Supabase config not found');
        }

        const tempClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
            auth: {
                persistSession: false, // IMPORTANT: Do not persist session
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });

        const { data, error } = await tempClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role: 'student',
                    name: name
                }
            }
        });

        if (error) throw error;
        return data.user;

    } catch (err) {
        console.error('Error creating auth user:', err);
        // We don't block student creation if auth fails (maybe they already exist), 
        // but we should warn the admin.
        alert('Warning: Could not create login account. ' + err.message);
        return null;
    }
}

function showCredentialsModal(email, password) {
    const modal = document.getElementById('credentialsModal');
    document.getElementById('credEmail').textContent = email;
    document.getElementById('credPassword').textContent = password;
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function handleSearch(e) {
    const term = e.target.value.toLowerCase();
    const filtered = currentStudents.filter(s =>
        s.name.toLowerCase().includes(term) ||
        s.roll_no.toLowerCase().includes(term)
    );
    renderTable(filtered);
}

// ========== BULK UPLOAD FUNCTIONS ==========

function openBulkModal() {
    const modal = document.getElementById('bulkUploadModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Reset state
    parsedStudents = [];
    document.getElementById('excelFileInput').value = '';
    document.getElementById('selectedFileName').textContent = '';
    document.getElementById('uploadResults').classList.add('hidden');
    document.getElementById('uploadStudentsBtn').disabled = true;
}

function closeBulkModal() {
    const modal = document.getElementById('bulkUploadModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// Download Excel Template
function downloadTemplate() {
    const wb = XLSX.utils.book_new();

    // Template data with headers and sample row
    const templateData = [
        ['Name', 'Roll No', 'Class', 'Section', 'Gender', 'Email', 'Phone', 'Address'],
        ['John Doe', 'ST-001', 'Class 10', 'A', 'Male', 'john@example.com', '1234567890', '123 Main St']
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);

    // Set column widths
    ws['!cols'] = [
        { wch: 20 }, // Name
        { wch: 12 }, // Roll No
        { wch: 12 }, // Class
        { wch: 10 }, // Section
        { wch: 10 }, // Gender
        { wch: 25 }, // Email
        { wch: 15 }, // Phone
        { wch: 30 }  // Address
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'Student_Bulk_Upload_Template.xlsx');
}

// Handle File Selection
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    document.getElementById('selectedFileName').textContent = `Selected: ${file.name}`;

    const reader = new FileReader();
    reader.onload = function (event) {
        try {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            // Get first sheet
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            // Validate and parse
            const { valid, students, errors } = validateExcelData(jsonData);

            if (valid) {
                parsedStudents = students;
                document.getElementById('uploadStudentsBtn').disabled = false;
                showUploadSummary(students, errors);
            } else {
                parsedStudents = [];
                document.getElementById('uploadStudentsBtn').disabled = true;
                showUploadSummary([], errors);
            }

        } catch (error) {
            alert('Error reading Excel file: ' + error.message);
        }
    };

    reader.readAsArrayBuffer(file);
}

// Validate Excel Data
function validateExcelData(jsonData) {
    const students = [];
    const errors = [];

    jsonData.forEach((row, index) => {
        const rowNum = index + 2; // +2 because Excel is 1-indexed and has header row
        const rowErrors = [];

        // Required fields validation
        if (!row['Name'] || row['Name'].toString().trim() === '') {
            rowErrors.push(`Row ${rowNum}: Name is required`);
        }
        if (!row['Roll No'] || row['Roll No'].toString().trim() === '') {
            rowErrors.push(`Row ${rowNum}: Roll No is required`);
        }
        if (!row['Class'] || row['Class'].toString().trim() === '') {
            rowErrors.push(`Row ${rowNum}: Class is required`);
        }
        if (!row['Section'] || row['Section'].toString().trim() === '') {
            rowErrors.push(`Row ${rowNum}: Section is required`);
        }

        if (rowErrors.length === 0) {
            students.push({
                name: row['Name'].toString().trim(),
                roll_no: row['Roll No'].toString().trim(),
                class: row['Class'].toString().trim(),
                section: row['Section'].toString().trim(),
                gender: row['Gender'] ? row['Gender'].toString().trim() : 'Male',
                email: row['Email'] ? row['Email'].toString().trim() : '',
                phone: row['Phone'] ? row['Phone'].toString().trim() : '',
                address: row['Address'] ? row['Address'].toString().trim() : ''
            });
        } else {
            errors.push(...rowErrors);
        }
    });

    return {
        valid: errors.length === 0 && students.length > 0,
        students,
        errors
    };
}

// Show Upload Summary
function showUploadSummary(students, errors) {
    const resultsDiv = document.getElementById('uploadResults');
    const summaryDiv = document.getElementById('uploadSummary');

    resultsDiv.classList.remove('hidden');

    let html = '';

    if (students.length > 0) {
        html += `<div class="text-green-600 font-semibold mb-2">✓ ${students.length} student(s) ready to upload</div>`;
    }

    if (errors.length > 0) {
        html += `<div class="text-red-600 font-semibold mb-2">✗ ${errors.length} error(s) found:</div>`;
        html += '<ul class="list-disc list-inside text-red-600 text-xs space-y-1">';
        errors.forEach(err => {
            html += `<li>${err}</li>`;
        });
        html += '</ul>';
    }

    summaryDiv.innerHTML = html;
}

// Handle Bulk Upload
async function handleBulkUpload() {
    if (parsedStudents.length === 0) return;

    const uploadBtn = document.getElementById('uploadStudentsBtn');
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';

    try {
        // Check for duplicate roll numbers in database
        const rollNumbers = parsedStudents.map(s => s.roll_no);
        const { data: existing } = await supabase
            .from('students')
            .select('roll_no')
            .in('roll_no', rollNumbers);

        const existingRollNos = existing ? existing.map(s => s.roll_no) : [];

        if (existingRollNos.length > 0) {
            const duplicates = existingRollNos.join(', ');
            alert(`Error: The following roll numbers already exist: ${duplicates}\n\nPlease remove duplicates and try again.`);
            uploadBtn.disabled = false;
            uploadBtn.textContent = 'Upload Students';
            return;
        }

        // Insert all students
        const { data, error } = await supabase
            .from('students')
            .insert(parsedStudents);

        if (error) {
            throw error;
        }

        alert(`Success! ${parsedStudents.length} student(s) added successfully.`);
        closeBulkModal();
        fetchStudents();

    } catch (error) {
        console.error('Bulk upload error:', error);
        alert('Error uploading students: ' + error.message);
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Upload Students';
    }
}
