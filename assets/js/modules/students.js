// Use global Supabase client for production compatibility
const supabase = window.supabase || (() => {
    console.error('Supabase client not found on window object');
    throw new Error('Supabase client not initialized');
})();

let currentStudents = [];
let availableClasses = []; // Store classes and their sections
let parsedStudents = []; // Store parsed students from Excel file for bulk upload

export async function render(container) {
    // Clean up any existing modals in body to prevent duplicates
    const existingModals = ['profileModal', 'studentModal', 'bulkUploadModal', 'credentialsModal', 'changePasswordModal'];
    existingModals.forEach(id => {
        const old = document.getElementById(id);
        if (old && old.parentElement === document.body) {
            old.remove();
        }
    });

    container.innerHTML = `
        <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors duration-200">
            <div class="p-6 border-b border-gray-200 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">Students Directory</h2>
                <div class="flex space-x-3">
                    <input type="text" id="searchInput" placeholder="Search students..." class="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white placeholder-gray-500 transition-colors">
                    
                    <!-- Dropdown Button -->
                    <div class="relative">
                        <button id="addStudentDropdown" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-lg shadow-primary-500/20">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Add Student
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        
                        <!-- Dropdown Menu -->
                        <div id="studentDropdownMenu" class="hidden absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20">
                            <button id="addSingleStudent" class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center transition-colors border-b border-gray-100 dark:border-gray-700 group">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 text-primary-500 dark:text-primary-400 group-hover:text-primary-600 dark:group-hover:text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Add a Student</div>
                                    <div class="text-xs text-gray-500 dark:text-gray-400">Single admission</div>
                                </div>
                            </button>
                            <button id="addBulkStudents" class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center transition-colors group">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 text-green-500 dark:text-green-400 group-hover:text-green-600 dark:group-hover:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Add Bulk Students</div>
                                    <div class="text-xs text-gray-500 dark:text-gray-400">Upload Excel file</div>
                                </div>
                            </button>
                            <button id="fixRollNumbers" class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center transition-colors border-t border-gray-100 dark:border-gray-700 group">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 text-orange-500 dark:text-orange-400 group-hover:text-orange-600 dark:group-hover:text-orange-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Fix Roll Numbers</div>
                                    <div class="text-xs text-gray-500 dark:text-gray-400">Recalculate all roll numbers</div>
                                </div>
                            </button>
                            <button id="fixClassNames" class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center transition-colors border-t border-gray-100 dark:border-gray-700 group">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 text-blue-500 dark:text-blue-400 group-hover:text-blue-600 dark:group-hover:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Fix Class Names</div>
                                    <div class="text-xs text-gray-500 dark:text-gray-400">Normalize class names</div>
                                </div>
                            </button>
                            <button id="syncPortals" class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center transition-colors border-t border-gray-100 dark:border-gray-700 group">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 text-purple-500 dark:text-purple-400 group-hover:text-purple-600 dark:group-hover:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Sync All to Portal</div>
                                    <div class="text-xs text-gray-500 dark:text-gray-400">Create login for all students</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Student Table -->
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th class="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                            <th class="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Roll No</th>
                            <th class="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Class</th>
                            <th class="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone</th>
                            <th class="p-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="studentsTableBody" class="divide-y divide-gray-200 dark:divide-gray-800">
                        <tr><td colspan="5" class="p-4 text-center text-gray-500 dark:text-gray-400">Loading...</td></tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination (Simple) -->
            <div class="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
                <span class="text-xs text-gray-500 dark:text-gray-500">Showing all records</span>
            </div>
        </div>

        <!-- Student Modal (Add/Edit) -->
        <div id="studentModal" class="modal-overlay fixed inset-0 bg-black/80 hidden items-center justify-center z-50 backdrop-blur-sm overflow-y-auto transition-opacity duration-300">
            <div class="bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl mx-4 my-4 overflow-hidden transform transition-all duration-300 ease-out opacity-0 scale-95 translate-y-4 border border-gray-800">
                <div class="bg-gradient-to-r from-primary-600 to-indigo-600 p-6 flex justify-between items-center">
                    <h3 id="modalTitle" class="text-xl font-bold text-white">Add New Student</h3>
                    <button id="closeModalBtn" class="text-white hover:text-gray-200 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form id="studentForm" class="p-6 space-y-4">
                    <input type="hidden" id="studentId">
                    
                    <!-- Personal Information Section -->
                    <div class="mb-6">
                        <h4 class="text-sm font-bold text-primary-400 uppercase tracking-wide mb-3 pb-2 border-b border-gray-800">Personal Information</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-1">Full Name *</label>
                                <input type="text" id="name" required class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Enter student's full name">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-1">Date of Birth *</label>
                                <input type="date" id="date_of_birth" required class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500 outline-none">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-1">Gender *</label>
                                <select id="gender" required class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500 outline-none">
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-1">Contact Number *</label>
                                <input type="tel" id="phone" required maxlength="11" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="03001234567">
                            </div>
                        </div>
                    </div>

                    <!-- Father Information Section -->
                    <div class="mb-6">
                        <h4 class="text-sm font-bold text-primary-400 uppercase tracking-wide mb-3 pb-2 border-b border-gray-800">Father Information</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-1">Father Name *</label>
                                <input type="text" id="father_name" required class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Enter father's name">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-1">Father CNIC Number *</label>
                                <input type="text" id="father_cnic" required maxlength="15" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="12345-1234567-1">
                            </div>
                        </div>
                    </div>

                    <!-- Academic Information Section -->
                    <div class="mb-6">
                        <h4 class="text-sm font-bold text-primary-400 uppercase tracking-wide mb-3 pb-2 border-b border-gray-800">Academic Information</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-1">Class *</label>
                                <select id="class" required class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500 outline-none">
                                    <option value="">Select Class</option>
                                    <!-- Populated dynamically -->
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-1">Section *</label>
                                <select id="section" required class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500 outline-none">
                                    <option value="">Select Section</option>
                                    <!-- Populated dynamically -->
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-1">Roll Number *</label>
                                <input type="text" id="roll_no" required class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Auto-generated">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-1">Admission Date</label>
                                <input type="date" id="admission_date" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500 outline-none">
                            </div>
                        </div>
                    </div>

                    <!-- Additional Information Section -->
                    <div class="mb-6">
                        <h4 class="text-sm font-bold text-primary-400 uppercase tracking-wide mb-3 pb-2 border-b border-gray-800">Additional Information</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-1">From Which School</label>
                                <input type="text" id="from_which_school" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Previous school name">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-1">Family Code</label>
                                <input type="text" id="family_code" maxlength="20" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="For sibling identification">
                            </div>
                            <div class="md:col-span-2">
                                <label class="block text-sm font-medium text-gray-300 mb-1">Gmail (Optional)</label>
                                <input type="email" id="email" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 outline-none" placeholder="student@gmail.com (optional)">
                                <p class="text-xs text-gray-500 mt-1">Note: Login uses Student ID + Date of Birth, not email</p>
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                        <button type="button" id="cancelBtn" class="px-4 py-2 text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700">Cancel</button>
                        <button type="submit" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-lg shadow-primary-500/20">Save Student</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Bulk Upload Modal -->
        <div id="bulkUploadModal" class="modal-overlay fixed inset-0 bg-black/80 hidden items-center justify-center z-50 backdrop-blur-sm overflow-y-auto transition-opacity duration-300">
            <div class="bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl mx-4 my-4 overflow-hidden transform transition-all duration-300 ease-out opacity-0 scale-95 translate-y-4 border border-gray-800">
                <div class="bg-gradient-to-r from-green-600 to-emerald-600 p-6 flex justify-between items-center">
                    <h3 class="text-xl font-bold text-white">Bulk Upload Students</h3>
                    <button id="closeBulkModalBtn" class="text-white hover:text-gray-200 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-6">
                    <!-- Instructions -->
                    <div class="bg-blue-900/20 border-l-4 border-blue-500 p-4 mb-6">
                        <div class="flex">
                            <div class="flex-shrink-0">
                                <svg class="h-5 w-5 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                                </svg>
                            </div>
                            <div class="ml-3">
                                <p class="text-sm text-blue-300">
                                    <strong>Instructions:</strong> Download the Excel template, fill in student details, and upload the file to add multiple students at once.
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Download Template -->
                    <div class="mb-6">
                        <button id="downloadTemplateBtn" class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center transition-colors shadow-lg shadow-green-500/20">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download Excel Template
                        </button>
                    </div>

                    <!-- Upload File -->
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-300 mb-2">Upload Filled Excel File</label>
                        <div class="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-primary-500 hover:bg-gray-800 transition-all">
                            <input type="file" id="excelFileInput" accept=".xlsx,.xls" class="hidden">
                            <label for="excelFileInput" class="cursor-pointer">
                                <svg class="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                                <p class="mt-2 text-sm text-gray-400">Click to select Excel file or drag and drop</p>
                                <p class="text-xs text-gray-500">XLSX or XLS files only</p>
                            </label>
                        </div>
                        <p id="selectedFileName" class="mt-2 text-sm text-gray-400"></p>
                    </div>

                    <!-- Preview/Errors -->
                    <div id="uploadResults" class="hidden mb-6">
                        <h4 class="font-semibold text-white mb-2">Upload Summary</h4>
                        <div id="uploadSummary" class="bg-gray-800 rounded-lg p-4 text-sm text-gray-300"></div>
                    </div>

                    <!-- Actions -->
                    <div class="flex justify-end space-x-3">
                        <button type="button" id="cancelBulkBtn" class="px-4 py-2 text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700">Cancel</button>
                        <button type="button" id="uploadStudentsBtn" disabled class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20">Upload Students</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Credentials Modal -->
        <div id="credentialsModal" class="modal-overlay fixed inset-0 bg-black/80 hidden items-center justify-center z-50 backdrop-blur-sm overflow-y-auto transition-opacity duration-300">
            <div class="bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mx-4 my-4 overflow-hidden transform transition-all duration-300 ease-out opacity-0 scale-95 translate-y-0 border border-gray-800">
                <div class="bg-green-600 p-6 text-center">
                    <div class="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h3 class="text-2xl font-bold text-white">Student Added!</h3>
                    <p class="text-green-100 mt-1">Credentials generated successfully</p>
                </div>
                <div class="p-6 space-y-4">
                    <div class="bg-gray-800 p-4 rounded-lg border border-gray-700">
                        <div class="mb-3">
                            <label class="text-xs text-gray-400 uppercase font-semibold">Email / Username</label>
                            <div class="flex items-center justify-between mt-1">
                                <code id="credEmail" class="text-lg font-mono text-white font-bold">user@school.com</code>
                                <button onclick="navigator.clipboard.writeText(document.getElementById('credEmail').textContent)" class="text-primary-400 hover:text-primary-300 text-sm font-medium">Copy</button>
                            </div>
                        </div>
                        <div>
                            <label class="text-xs text-gray-400 uppercase font-semibold">Password</label>
                            <div class="flex items-center justify-between mt-1">
                                <code id="credPassword" class="text-lg font-mono text-white font-bold">Pass123!</code>
                                <button onclick="navigator.clipboard.writeText(document.getElementById('credPassword').textContent)" class="text-primary-400 hover:text-primary-300 text-sm font-medium">Copy</button>
                            </div>
                        </div>
                    </div>
                    <p class="text-sm text-gray-400 text-center">Please share these credentials with the student.</p>
                    <button id="closeCredModalBtn" class="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg shadow-lg transition-transform transform hover:-translate-y-0.5">
                        Done
                    </button>
                </div>
            </div>
        </div>

        <!-- Profile Modal -->
        <div id="profileModal" class="modal-overlay fixed inset-0 bg-black/80 hidden items-center justify-center z-50 backdrop-blur-sm overflow-y-auto transition-opacity duration-300">
            <div class="bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl mx-4 my-4 max-h-[90vh] overflow-hidden transform transition-all duration-300 ease-out opacity-0 scale-95 translate-y-0 flex flex-col border border-gray-800">
                <!-- Header with Photo -->
                <div class="relative h-40 flex-shrink-0 group">
                    <!-- Background Wrapper (Clipped) -->
                    <div class="absolute inset-0 overflow-hidden">
                        <!-- Background with subtle gradient -->
                        <div class="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black"></div>
                        
                        <!-- Decorative Circle/Glow -->
                        <div class="absolute -top-24 -right-24 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl opacity-50"></div>
                        <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl opacity-50"></div>
                    </div>

                    <button id="closeProfileModalBtn" class="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-20 bg-black/20 hover:bg-black/40 rounded-full p-2 backdrop-blur-sm border border-white/5">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div class="absolute -bottom-12 left-8 flex items-end z-20">
                        <div class="relative group/photo">
                            <div class="h-28 w-28 rounded-full border-4 border-gray-900 bg-gray-800 shadow-2xl overflow-hidden relative z-10 ring-1 ring-gray-700/50">
                                <img id="profilePhoto" src="" alt="Profile" class="h-full w-full object-cover">
                                <div id="profilePhotoPlaceholder" class="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800 text-white text-3xl font-bold">
                                    <!-- Initial -->
                                </div>
                            </div>
                            <label for="profilePhotoInput" class="absolute bottom-1 right-1 bg-gray-800 rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-700 transition-colors text-gray-400 hover:text-white border border-gray-700 z-20 group-hover/photo:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <input type="file" id="profilePhotoInput" accept="image/*" class="hidden">
                            </label>
                        </div>
                        <div class="ml-5 mb-2">
                            <h2 id="profileName" class="text-3xl font-bold text-white tracking-tight drop-shadow-md">Student Name</h2>
                            <div class="flex items-center mt-1 space-x-2">
                                <span id="profileClass" class="px-2.5 py-0.5 rounded-full bg-gray-800/80 border border-gray-700 text-gray-300 text-xs font-medium backdrop-blur-sm">Class 10 (A)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <!-- Tab Navigation -->
                <div class="bg-gray-900 border-b border-gray-800 px-8 pt-14 pb-0">
                    <nav class="-mb-px flex space-x-6 overflow-x-auto no-scrollbar" aria-label="Tabs">
                        <button class="tab-btn active-tab border-primary-500 text-primary-400 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors" data-tab="personal">
                            Personal Info
                        </button>
                        <button class="tab-btn border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors" data-tab="academic">
                            Academic
                        </button>
                        <button class="tab-btn border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors" data-tab="fee">
                            Fee Details
                        </button>
                        <button class="tab-btn border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors" data-tab="attendance">
                            Attendance
                        </button>
                        <button class="tab-btn border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors" data-tab="discipline">
                            Discipline
                        </button>
                        <button class="tab-btn border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors" data-tab="documents">
                            Documents
                        </button>
                        <button class="tab-btn border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-600 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors" data-tab="account">
                            Account
                        </button>
                    </nav>
                </div>

                <!-- Content -->
                <div class="p-8 overflow-y-auto flex-grow bg-gray-950">
                    <input type="hidden" id="profileStudentId">
                    
                    <!-- Tab: Personal Info -->
                    <div id="tab-personal" class="tab-content block">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        <!-- Left Column: Details -->
                        <div class="md:col-span-2 space-y-6">
                            <!-- Personal Details -->
                            <div class="bg-gray-900 rounded-lg border border-gray-800 p-5 shadow-sm">
                                <h3 class="text-sm font-bold text-white uppercase tracking-wide mb-4 border-b border-gray-800 pb-2">Personal Details</h3>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                                    <div>
                                        <label class="text-xs text-gray-500 block">Roll Number</label>
                                        <span id="profileRollNo" class="text-sm font-medium text-white">-</span>
                                    </div>
                                    <div>
                                        <label class="text-xs text-gray-500 block">Date of Birth</label>
                                        <span id="profileDOB" class="text-sm font-medium text-white">-</span>
                                    </div>
                                    <div>
                                        <label class="text-xs text-gray-500 block">Gender</label>
                                        <span id="profileGender" class="text-sm font-medium text-white">-</span>
                                    </div>
                                    <div>
                                        <label class="text-xs text-gray-500 block">Phone</label>
                                        <span id="profilePhone" class="text-sm font-medium text-white">-</span>
                                    </div>
                                    <div>
                                        <label class="text-xs text-gray-500 block">Father Name</label>
                                        <span id="profileFatherName" class="text-sm font-medium text-white">-</span>
                                    </div>
                                    <div>
                                        <label class="text-xs text-gray-500 block">Father CNIC</label>
                                        <span id="profileFatherCNIC" class="text-sm font-medium text-white">-</span>
                                    </div>
                                    <div>
                                        <label class="text-xs text-gray-500 block">From Which School</label>
                                        <span id="profileFromSchool" class="text-sm font-medium text-white">-</span>
                                    </div>
                                    <div>
                                        <label class="text-xs text-gray-500 block">Admission Date</label>
                                        <span id="profileDate" class="text-sm font-medium text-white">-</span>
                                    </div>
                                    <div>
                                        <label class="text-xs text-gray-500 block">Family Code</label>
                                        <span id="profileFamilyCode" class="text-sm font-medium text-white">-</span>
                                    </div>
                                    <div class="sm:col-span-2">
                                        <label class="text-xs text-gray-500 block">Email</label>
                                        <span id="profileEmail" class="text-sm font-medium text-white">-</span>
                                    </div>
                                </div>
                            </div>


                        </div>

                        <!-- Right Column: Credentials & Actions -->
                        <div class="space-y-6">


                            <!-- Actions -->
                            <div class="bg-gray-900 rounded-lg border border-gray-800 p-5 shadow-sm">
                                <h3 class="text-sm font-bold text-white uppercase tracking-wide mb-4 border-b border-gray-800 pb-2">Actions</h3>
                                <div class="space-y-3">
                                    <button id="editProfileBtn" class="w-full flex items-center justify-center px-4 py-2 border border-gray-700 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit Details
                                    </button>
                                    <button id="deleteProfileBtn" class="w-full flex items-center justify-center px-4 py-2 border border-red-900/50 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/20 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete Student
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    </div> <!-- End Personal Tab -->

                    <!-- Other Tabs -->
                    <div id="tab-academic" class="tab-content hidden">
                        <div class="space-y-6">
                            <!-- Performance Stats -->
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div class="bg-gray-900 p-4 rounded-lg border border-gray-800 shadow-sm text-center">
                                    <div class="text-xs text-gray-400 uppercase font-bold">CGPA</div>
                                    <div class="text-2xl font-bold text-primary-400">-</div>
                                </div>
                                <div class="bg-gray-900 p-4 rounded-lg border border-gray-800 shadow-sm text-center">
                                    <div class="text-xs text-gray-400 uppercase font-bold">Attendance</div>
                                    <div class="text-2xl font-bold text-green-400">0%</div>
                                </div>
                                <div class="bg-gray-900 p-4 rounded-lg border border-gray-800 shadow-sm text-center">
                                    <div class="text-xs text-gray-400 uppercase font-bold">Rank</div>
                                    <div class="text-2xl font-bold text-blue-400">-</div>
                                </div>
                                <div class="bg-gray-900 p-4 rounded-lg border border-gray-800 shadow-sm text-center">
                                    <div class="text-xs text-gray-400 uppercase font-bold">Grade</div>
                                    <div class="text-2xl font-bold text-purple-400">-</div>
                                </div>
                            </div>

                            <!-- Recent Exams -->
                            <!-- Recent Exams -->
                            <div class="bg-gray-900 rounded-lg border border-gray-800 shadow-sm overflow-hidden">
                                <div class="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                                    <h3 class="font-bold text-white">Recent Exam Results</h3>
                                    <button class="text-primary-400 text-sm font-medium hover:text-primary-300 disabled:opacity-50" disabled>View All</button>
                                </div>
                                <table class="w-full text-sm text-left">
                                    <thead class="bg-gray-800 text-gray-400 font-medium">
                                        <tr>
                                            <th class="px-6 py-3">Subject</th>
                                            <th class="px-6 py-3">Marks</th>
                                            <th class="px-6 py-3">Grade</th>
                                            <th class="px-6 py-3">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-gray-800">
                                        <tr>
                                            <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                                                No exam results recorded yet.
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div id="tab-fee" class="tab-content hidden">
                        <div class="max-w-4xl mx-auto">
                            <!-- Fee Summary -->
                            <!-- Fee Summary -->
                            <div class="bg-gray-900 rounded-lg border border-gray-800 p-5 shadow-sm mb-6">
                                <h3 class="text-sm font-bold text-white uppercase tracking-wide mb-4 border-b border-gray-800 pb-2">Fee Status</h3>
                                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div class="bg-blue-900/20 p-3 rounded-lg text-center border border-blue-900/30">
                                        <div class="text-xs text-blue-400 font-medium uppercase">Total Fees</div>
                                        <div id="feeTotal" class="text-lg font-bold text-blue-300">...</div>
                                    </div>
                                    <div class="bg-green-900/20 p-3 rounded-lg text-center border border-green-900/30">
                                        <div class="text-xs text-green-400 font-medium uppercase">Paid</div>
                                        <div id="feePaid" class="text-lg font-bold text-green-300">...</div>
                                    </div>
                                    <div class="bg-red-900/20 p-3 rounded-lg text-center border border-red-900/30">
                                        <div class="text-xs text-red-400 font-medium uppercase">Remaining</div>
                                        <div id="feeRemaining" class="text-lg font-bold text-red-300">...</div>
                                    </div>
                                </div>
                                <div class="mt-4 text-xs text-gray-400 text-center">
                                    Last Payment: <span id="feeLastPayment" class="font-medium text-gray-300">-</span>
                                </div>
                            </div>
                            
                            <div class="flex justify-end">
                                <button class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center shadow-lg shadow-primary-500/20">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                    Add Fee Payment
                                </button>
                            </div>
                        </div>
                    </div>
                    <div id="tab-attendance" class="tab-content hidden">
                        <div class="space-y-6">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <!-- Stats -->
                                <!-- Stats -->
                                <div class="bg-gray-900 p-5 rounded-lg border border-gray-800 shadow-sm">
                                    <h4 class="text-xs font-bold text-gray-400 uppercase mb-4">Yearly Overview</h4>
                                    <div class="flex items-center justify-center relative h-32 w-32 mx-auto">
                                        <svg class="h-full w-full transform -rotate-90" viewBox="0 0 36 36">
                                            <path class="text-gray-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3.8" />
                                            <path class="text-green-500" stroke-dasharray="0, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" stroke-width="3.8" />
                                        </svg>
                                        <div class="absolute flex flex-col items-center">
                                            <span class="text-2xl font-bold text-white">0%</span>
                                            <span class="text-xs text-gray-400">Present</span>
                                        </div>
                                    </div>
                                    <div class="mt-4 grid grid-cols-2 gap-2 text-center text-xs">
                                        <div class="bg-green-900/20 p-2 rounded text-green-400 font-medium border border-green-900/30">0 Present</div>
                                        <div class="bg-red-900/20 p-2 rounded text-red-400 font-medium border border-red-900/30">0 Absent</div>
                                    </div>
                                </div>

                                <!-- Recent History -->
                                <!-- Recent History -->
                                <div class="md:col-span-2 bg-gray-900 rounded-lg border border-gray-800 shadow-sm overflow-hidden">
                                    <div class="px-6 py-4 border-b border-gray-800">
                                        <h3 class="font-bold text-white">Recent Attendance</h3>
                                    </div>
                                    <div class="divide-y divide-gray-800">
                                        <div class="px-6 py-8 text-center text-gray-500">
                                            No attendance records found.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="tab-discipline" class="tab-content hidden">
                        <div class="space-y-4">
                            <div class="bg-gray-900 p-8 rounded-lg border border-gray-800 shadow-sm text-center">
                                <div class="inline-flex items-center justify-center h-12 w-12 rounded-full bg-gray-800 mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 class="text-lg font-medium text-white">Clean Record</h3>
                                <p class="text-gray-400 mt-1">No discipline records or remarks found for this student.</p>
                            </div>
                        </div>
                    </div>
                    <div id="tab-documents" class="tab-content hidden">
                        <div class="bg-gray-900 rounded-lg border border-gray-800 shadow-sm overflow-hidden">
                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                                <!-- Upload New -->
                                <div class="border-2 border-dashed border-gray-700 rounded-lg p-4 hover:border-primary-500 hover:bg-gray-800 transition-all cursor-pointer flex flex-col items-center justify-center text-center h-full min-h-[140px] group">
                                    <div class="h-10 w-10 rounded-full bg-gray-800 flex items-center justify-center text-primary-400 mb-2 group-hover:scale-110 transition-transform">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <span class="text-sm font-medium text-primary-400">Upload Document</span>
                                    <span class="text-xs text-gray-500 mt-1">PDF, JPG, PNG</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="tab-account" class="tab-content hidden">
                        <div class="max-w-2xl mx-auto space-y-6">
                            <!-- Credentials Card -->
                            <div class="bg-gray-900 rounded-lg border border-gray-800 p-5 shadow-sm">
                                <h3 class="text-sm font-bold text-primary-400 uppercase tracking-wide mb-4 border-b border-gray-800 pb-2">Login Credentials</h3>
                                <div class="space-y-3">
                                    <div>
                                        <label class="text-xs text-gray-500 block">Student ID</label>
                                        <div class="flex items-center justify-between">
                                            <code id="profileCredEmail" class="text-sm font-mono font-bold text-white truncate mr-2">user@school.com</code>
                                            <button onclick="navigator.clipboard.writeText(document.getElementById('profileCredEmail').textContent)" class="text-primary-400 hover:text-primary-300">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label class="text-xs text-gray-500 block">Default Password</label>
                                        <div class="flex items-center justify-between">
                                            <code id="profileCredPass" class="text-sm font-mono font-bold text-white">Pass123!</code>
                                            <button onclick="navigator.clipboard.writeText(document.getElementById('profileCredPass').textContent)" class="text-primary-400 hover:text-primary-300">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Password Management Card -->
                            <div class="bg-gray-900 rounded-lg border border-gray-800 p-5 shadow-sm">
                                <h3 class="text-sm font-bold text-primary-400 uppercase tracking-wide mb-4 border-b border-gray-800 pb-2">Password Management</h3>
                                <div class="space-y-3">
                                    <button id="changePasswordBtn" class="w-full flex items-center justify-center px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium text-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                        </svg>
                                        Change Password
                                    </button>
                                    <button id="resetPasswordBtn" class="w-full flex items-center justify-center px-4 py-2.5 border border-gray-700 hover:bg-gray-800 text-gray-300 hover:text-white rounded-lg transition-colors font-medium text-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Reset to DOB Password (Admin)
                                    </button>
                                    <button id="syncSinglePortalBtn" class="w-full flex items-center justify-center px-4 py-2.5 bg-indigo-900/40 border border-indigo-700/50 hover:bg-indigo-800/60 text-indigo-300 hover:text-white rounded-lg transition-colors font-medium text-sm">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                        Sync Access Now
                                    </button>
                                    <p class="text-xs text-gray-500 mt-2">
                                        <span class="font-semibold">Note:</span> Default password is your date of birth in DDMMYYYY format.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Change Password Modal -->
        <div id="changePasswordModal" class="modal-overlay fixed inset-0 bg-black/80 hidden items-center justify-center z-50 backdrop-blur-sm">
            <div class="bg-gray-900 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all duration-300 ease-out opacity-0 scale-95 translate-y-4 border border-gray-800">
                <div class="bg-gradient-to-r from-primary-600 to-indigo-600 p-6 flex justify-between items-center">
                    <h3 class="text-lg font-bold text-white">Change Password</h3>
                    <button id="closeChangePasswordBtn" class="text-white hover:text-gray-200 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form id="changePasswordForm" class="p-6 space-y-4">
                    <input type="hidden" id="changePasswordStudentId">
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">Current Password *</label>
                        <input type="password" id="currentPassword" required class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 outline-none">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">New Password * (min 6 characters)</label>
                        <input type="password" id="newPassword" required minlength="6" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 outline-none">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">Confirm New Password *</label>
                        <input type="password" id="confirmPassword" required minlength="6" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 outline-none">
                    </div>

                    <div class="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                        <button type="button" id="cancelChangePasswordBtn" class="px-4 py-2 text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700">Cancel</button>
                        <button type="submit" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-lg shadow-primary-500/20">Change Password</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Event Listeners
    const addEvent = (id, event, handler) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(event, handler);
        else console.warn(`Element ${id} not found`);
    };

    // Dropdown toggle
    const dropdown = document.getElementById('addStudentDropdown');
    const dropdownMenu = document.getElementById('studentDropdownMenu');

    if (dropdown && dropdownMenu) {
        dropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            dropdownMenu.classList.add('hidden');
        });
    }

    // Single student modal
    addEvent('addSingleStudent', 'click', () => {
        if (dropdownMenu) dropdownMenu.classList.add('hidden');
        openModal();
    });

    addEvent('closeModalBtn', 'click', closeModal);
    addEvent('cancelBtn', 'click', closeModal);
    addEvent('studentForm', 'submit', handleFormSubmit);
    addEvent('class', 'change', handleClassChange);

    // Bulk upload modal
    addEvent('addBulkStudents', 'click', () => {
        if (dropdownMenu) dropdownMenu.classList.add('hidden');
        openBulkModal();
    });

    // Fix Roll Numbers button
    addEvent('fixRollNumbers', 'click', async () => {
        if (dropdownMenu) dropdownMenu.classList.add('hidden');
        await fixAllRollNumbers();
    });

    // Fix Class Names button
    addEvent('fixClassNames', 'click', async () => {
        if (dropdownMenu) dropdownMenu.classList.add('hidden');
        await fixClassNames();
    });

    // Sync Portals button
    addEvent('syncPortals', 'click', async () => {
        if (dropdownMenu) dropdownMenu.classList.add('hidden');
        await syncAllPortals();
    });

    addEvent('closeBulkModalBtn', 'click', closeBulkModal);
    addEvent('cancelBulkBtn', 'click', closeBulkModal);
    addEvent('downloadTemplateBtn', 'click', downloadTemplate);
    addEvent('excelFileInput', 'change', handleFileSelect);
    addEvent('uploadStudentsBtn', 'click', handleBulkUpload);

    addEvent('closeCredModalBtn', 'click', () => {
        const modal = document.getElementById('credentialsModal');
        if (modal) {
            const content = modal.querySelector('div');
            content.classList.remove('opacity-100', 'scale-100', 'translate-y-0');
            content.classList.add('opacity-0', 'scale-95', 'translate-y-4');
            setTimeout(() => {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }, 300);
        }
    });

    // Profile Modal Listeners
    addEvent('closeProfileModalBtn', 'click', closeProfileModal);
    addEvent('editProfileBtn', 'click', () => {
        closeProfileModal();
        const idInput = document.getElementById('profileStudentId');
        if (idInput && window.editStudent) {
            window.editStudent(idInput.value);
        }
    });
    addEvent('deleteProfileBtn', 'click', () => {
        const idInput = document.getElementById('profileStudentId');
        if (idInput && window.deleteStudent) {
            window.deleteStudent(idInput.value);
        }
    });
    addEvent('profilePhotoInput', 'change', handlePhotoUpload);

    // Password Management Listeners
    addEvent('changePasswordBtn', 'click', openChangePasswordModal);
    addEvent('closeChangePasswordBtn', 'click', closeChangePasswordModal);
    addEvent('cancelChangePasswordBtn', 'click', closeChangePasswordModal);
    addEvent('changePasswordForm', 'submit', handleChangePassword);
    addEvent('resetPasswordBtn', 'click', handleResetPassword);
    addEvent('syncSinglePortalBtn', 'click', handleSyncSinglePortal);

    // CNIC Auto-formatting
    addEvent('father_cnic', 'input', formatCNICInput);

    // Search Listener
    addEvent('searchInput', 'input', handleSearch);

    // Tab Switching Logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active state from all tabs
            tabBtns.forEach(b => {
                b.classList.remove('active-tab', 'border-indigo-500', 'text-indigo-600');
                b.classList.add('border-transparent', 'text-gray-500');
            });

            // Add active state to clicked tab
            btn.classList.add('active-tab', 'border-indigo-500', 'text-indigo-600');
            btn.classList.remove('border-transparent', 'text-gray-500');

            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.add('hidden');
                content.classList.remove('block');
            });

            // Show target tab content
            const targetId = `tab-${btn.dataset.tab}`;
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.remove('hidden');
                targetContent.classList.add('block');
            }
        });
    });

    // Initial Fetch
    fetchStudents();
};

async function fetchStudents() {
    const tbody = document.getElementById('studentsTableBody');
    tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-400">Loading...</td></tr>';

    const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching students:', error);
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-red-400">Error loading students</td></tr>';
        return;
    }

    currentStudents = data;
    renderTable(data);
}

function renderTable(students) {
    const tbody = document.getElementById('studentsTableBody');

    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-500 dark:text-gray-400">No students found</td></tr>';
        return;
    }

    tbody.innerHTML = students.map(student => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group border-b border-gray-200 dark:border-gray-800 last:border-0">
            <td class="p-4">
                <button onclick="window.viewProfile('${student.id}')" class="text-left hover:text-primary-600 dark:hover:text-primary-400 transition-colors focus:outline-none">
                    <div class="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">${student.name}</div>
                    <div class="text-xs text-gray-500 dark:text-gray-400">${student.email || 'No email'}</div>
                </button>
            </td>
            <td class="p-4 text-gray-600 dark:text-gray-300">${student.roll_no}</td>
            <td class="p-4">
                <span class="px-2 py-1 bg-indigo-50 dark:bg-primary-900/20 text-indigo-700 dark:text-primary-300 rounded-full text-xs font-medium border border-indigo-100 dark:border-primary-900/30">
                    ${student.class} ${student.section ? `(${student.section})` : ''}
                </span>
            </td>
            <td class="p-4 text-gray-600 dark:text-gray-300">${student.phone || '-'}</td>
            <td class="p-4 text-right">
                <button onclick="window.viewProfile('${student.id}')" class="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-primary-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center ml-auto border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    View Profile
                </button>
            </td>
        </tr>
    `).join('');
}

// Expose functions to window
window.viewProfile = async (id) => {
    console.log('viewProfile called with ID:', id);

    // Try to find student in current array first
    let student = currentStudents.find(s => s.id === id);

    // If not found in array, fetch directly from database
    if (!student) {
        console.warn('Student not found in currentStudents array, fetching from database...');
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            if (data) {
                student = data;
                console.log('Student fetched from database:', student);
            } else {
                console.error('Student not found in database');
                alert('Error: Student not found. Please refresh the page.');
                return;
            }
        } catch (err) {
            console.error('Error fetching student:', err);
            alert('Error loading student profile: ' + err.message);
            return;
        }
    } else {
        console.log('Student found in array:', student);
    }

    // Show modal immediately with basic info
    const modal = document.getElementById('profileModal');
    if (!modal) {
        console.error('Profile modal not found');
        return;
    }

    // Move modal to body to break out of dashboard layout
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    const content = modal.querySelector('.bg-gray-900.rounded-xl') || modal.querySelector('div.bg-gray-900');

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Reset Tabs to Personal Info
    try {
        const tabBtns = modal.querySelectorAll('.tab-btn');
        tabBtns.forEach(b => {
            b.classList.remove('active-tab', 'border-primary-500', 'text-primary-400', 'border-indigo-500', 'text-indigo-600');
            b.classList.add('border-transparent', 'text-gray-400');
        });

        const personalTabBtn = modal.querySelector('.tab-btn[data-tab="personal"]');
        if (personalTabBtn) {
            personalTabBtn.classList.add('active-tab', 'border-primary-500', 'text-primary-400');
            personalTabBtn.classList.remove('border-transparent', 'text-gray-400');
        }

        modal.querySelectorAll('.tab-content').forEach(c => {
            c.classList.add('hidden');
            c.classList.remove('block');
        });
        const personalTab = modal.querySelector('#tab-personal');
        if (personalTab) {
            personalTab.classList.remove('hidden');
            personalTab.classList.add('block');
        }
    } catch (err) {
        console.warn('Error resetting profile tabs:', err);
    }

    // Animate In with tiny timeout to ensure display change reflects
    setTimeout(() => {
        if (content) {
            content.classList.remove('opacity-0', 'scale-95', 'translate-y-4');
            content.classList.add('opacity-100', 'scale-100', 'translate-y-0');
        } else {
            console.error('Profile modal content div not found');
        }
    }, 10);

    // Safe Population Helpers
    const setContent = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text || '-';
    };

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
    };

    // Populate Basic Info
    setVal('profileStudentId', student.id);
    setContent('profileName', student.name);
    setContent('profileClass', `${student.class || 'N/A'} (${student.section || 'N/A'})`);
    setContent('profileRollNo', student.roll_no);
    setContent('profileGender', student.gender);
    setContent('profilePhone', student.phone);
    setContent('profileEmail', student.email);
    setContent('profileDate', student.admission_date || (student.created_at ? new Date(student.created_at).toLocaleDateString() : '-'));

    // Populate additional fields
    setContent('profileDOB', student.date_of_birth);
    setContent('profileFatherName', student.father_name);
    setContent('profileFatherCNIC', student.father_cnic);
    setContent('profileFromSchool', student.from_which_school);
    setContent('profileFamilyCode', student.family_code);

    // Photo Management
    const photoImg = document.getElementById('profilePhoto');
    const placeholder = document.getElementById('profilePhotoPlaceholder');

    if (photoImg && placeholder) {
        if (student.photo_url) {
            photoImg.src = student.photo_url;
            photoImg.classList.remove('hidden');
            placeholder.classList.add('hidden');
        } else {
            photoImg.classList.add('hidden');
            placeholder.classList.remove('hidden');
            placeholder.textContent = student.name ? student.name.charAt(0) : '?';
        }
    }

    // Credentials
    setContent('profileCredEmail', student.roll_no || 'Not assigned');
    const dobPassword = student.date_of_birth ? student.date_of_birth.split('-').reverse().join('') : 'Not set';
    setContent('profileCredPass', dobPassword);

    // Fetch Financial Data
    try {
        await fetchStudentFees(student.id);
    } catch (err) {
        console.error('Secondary error in fee fetching:', err);
    }
};

window.editStudent = async (id) => {
    console.log('editStudent called with ID:', id);
    console.log('currentStudents array length:', currentStudents.length);

    let student = currentStudents.find(s => s.id === id);

    // If not found in array, fetch from database
    if (!student) {
        console.warn('Student not found in currentStudents array, fetching from database...');
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            if (data) {
                student = data;
                console.log('Student fetched from database:', student);
            } else {
                console.error('Student not found in database');
                alert('Error: Student not found. Please refresh the page.');
                return;
            }
        } catch (err) {
            console.error('Error fetching student:', err);
            alert('Error loading student: ' + err.message);
            return;
        }
    } else {
        console.log('Student found:', student);
    }

    closeProfileModal(); // Close profile modal first
    await openModal(student); // Open edit modal
};

window.deleteStudent = async (id) => {
    if (!confirm('Are you sure you want to delete this student?')) return;

    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) {
        alert('Error deleting student: ' + error.message);
    } else {
        closeProfileModal(); // Close profile modal
        fetchStudents();
    }
};

async function fetchStudentFees(studentId) {
    // Reset to loading
    const elements = ['feeTotal', 'feePaid', 'feeRemaining', 'feeLastPayment'];
    elements.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '...';
    });

    try {
        const { data: fees, error } = await supabase
            .from('fees')
            .select('*')
            .eq('student_id', studentId);

        if (error) throw error;

        let total = 0;
        let paid = 0;
        let lastPayment = null;

        fees.forEach(fee => {
            const feeTotal = parseFloat(fee.final_amount) || parseFloat(fee.amount) || 0;
            const feePaid = parseFloat(fee.paid_amount) || 0;

            total += feeTotal;
            paid += feePaid;

            if (feePaid > 0) {
                const paymentDate = new Date(fee.updated_at || fee.issued_at);
                if (!lastPayment || paymentDate > lastPayment) {
                    lastPayment = paymentDate;
                }
            }
        });

        const remaining = total - paid;
        const format = window.formatCurrency || ((val) => `PKR ${val.toLocaleString()}`);

        const setC = (id, text) => {
            const el = document.getElementById(id);
            if (el) el.textContent = text;
        };

        setC('feeTotal', format(total));
        setC('feePaid', format(paid));
        setC('feeRemaining', format(remaining));
        setC('feeLastPayment', lastPayment ? lastPayment.toLocaleDateString() : 'Never');

    } catch (err) {
        console.error('Error fetching fees:', err);
        const el = document.getElementById('feeTotal');
        if (el) el.textContent = 'Error';
    }
}

async function handlePhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const studentId = document.getElementById('profileStudentId').value;
    if (!studentId) return;

    // Show uploading state
    const img = document.getElementById('profilePhoto');
    img.style.opacity = '0.5';

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${studentId}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from('student-photos')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('student-photos')
            .getPublicUrl(filePath);

        // Update Student Record
        const { error: updateError } = await supabase
            .from('students')
            .update({ photo_url: publicUrl })
            .eq('id', studentId);

        if (updateError) throw updateError;

        // Update UI
        img.src = publicUrl;
        img.classList.remove('hidden');
        document.getElementById('profilePhotoPlaceholder').classList.add('hidden');

        // Update local data
        const student = currentStudents.find(s => s.id === studentId);
        if (student) student.photo_url = publicUrl;

        alert('Profile photo updated!');

    } catch (err) {
        console.error('Error uploading photo:', err);
        alert('Error uploading photo: ' + err.message);
    } finally {
        img.style.opacity = '1';
    }
}

// Password Management Functions
function openChangePasswordModal() {
    const studentId = document.getElementById('profileStudentId').value;
    if (!studentId) return;

    const modal = document.getElementById('changePasswordModal');
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    const content = modal.querySelector('div');
    document.getElementById('changePasswordStudentId').value = studentId;
    document.getElementById('changePasswordForm').reset();

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    void modal.offsetWidth;
    content.classList.remove('opacity-0', 'scale-95', 'translate-y-4');
    content.classList.add('opacity-100', 'scale-100', 'translate-y-0');
}

function closeChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    const content = modal.querySelector('div');

    content.classList.remove('opacity-100', 'scale-100', 'translate-y-0');
    content.classList.add('opacity-0', 'scale-95', 'translate-y-4');

    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
}

async function handleChangePassword(e) {
    e.preventDefault();

    const studentId = document.getElementById('changePasswordStudentId').value;
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validation
    if (newPassword !== confirmPassword) {
        alert('New passwords do not match!');
        return;
    }

    if (newPassword.length < 6) {
        alert('Password must be at least 6 characters long!');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Changing...';

    try {
        // Get student email
        const student = currentStudents.find(s => s.id === studentId);
        if (!student || !student.email) {
            throw new Error('Student email not found');
        }

        // Verify current password by attempting to sign in
        const tempClient = window.SupabaseLib.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });

        const { error: signInError } = await tempClient.auth.signInWithPassword({
            email: student.email,
            password: currentPassword
        });

        if (signInError) {
            throw new Error('Current password is incorrect');
        }

        // Update password
        const { error: updateError } = await tempClient.auth.updateUser({
            password: newPassword
        });

        if (updateError) throw updateError;

        // Update password_changed flag in database
        await supabase.from('students').update({ password_changed: true }).eq('id', studentId);

        alert('Password changed successfully!');
        closeChangePasswordModal();

    } catch (error) {
        console.error('Error changing password:', error);
        alert('Error: ' + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function handleResetPassword() {
    const studentId = document.getElementById('profileStudentId').value;
    if (!studentId) return;

    const student = currentStudents.find(s => s.id === studentId);
    if (!student) {
        alert('Student not found');
        return;
    }

    if (!student.date_of_birth) {
        alert('Cannot reset password: Date of birth not set for this student');
        return;
    }

    if (!confirm(`Reset password to DOB (${student.date_of_birth}) for ${student.name}?`)) {
        return;
    }

    try {
        // Generate password from DOB
        const password = generatePasswordFromDOB(student.date_of_birth);
        if (!password) {
            throw new Error('Invalid date of birth format');
        }

        // Update password_changed flag
        await supabase.from('students').update({ password_changed: false }).eq('id', studentId);

        alert(`Password reset to DOB format!\n\nNew Password: ${password}\n\nNote: Admin will need to manually reset the auth password in Supabase.`);

    } catch (error) {
        console.error('Error resetting password:', error);
        alert('Error resetting password: ' + error.message);
    }
}

function closeProfileModal() {
    const modal = document.getElementById('profileModal');
    const content = modal.querySelector('div');

    content.classList.remove('opacity-100', 'scale-100', 'translate-y-0');
    content.classList.add('opacity-0', 'scale-95', 'translate-y-4');

    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
}

async function openModal(student = null) {
    const modal = document.getElementById('studentModal');

    // Move modal to body to break out of dashboard layout
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    const content = modal.querySelector('.bg-gray-900');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('studentForm');
    const rollNoInput = document.getElementById('roll_no');

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Animate In with tiny timeout to ensure display change reflects
    setTimeout(() => {
        content.classList.remove('opacity-0', 'scale-95', 'translate-y-4');
        content.classList.add('opacity-100', 'scale-100', 'translate-y-0');
    }, 10);

    // Load classes into dropdown
    await loadClassesIntoDropdown();

    if (student) {
        title.textContent = 'Edit Student';
        document.getElementById('studentId').value = student.id;
        document.getElementById('name').value = student.name;

        rollNoInput.value = student.roll_no;
        rollNoInput.readOnly = true; // Roll no shouldn't change usually
        rollNoInput.classList.remove('bg-gray-100', 'text-gray-900');
        rollNoInput.classList.add('bg-gray-800/50', 'text-gray-400', 'border-gray-700/50');

        document.getElementById('class').value = student.class;

        // Trigger class change to load sections, then select the correct section
        handleClassChange();
        document.getElementById('section').value = student.section;

        document.getElementById('email').value = student.email || '';
        document.getElementById('phone').value = student.phone || '';
        document.getElementById('gender').value = student.gender || 'Male';
        document.getElementById('date_of_birth').value = student.date_of_birth || '';

        // Populate new fields
        document.getElementById('father_name').value = student.father_name || '';
        document.getElementById('father_cnic').value = student.father_cnic || '';
        document.getElementById('from_which_school').value = student.from_which_school || '';
        document.getElementById('family_code').value = student.family_code || '';
        document.getElementById('admission_date').value = student.admission_date || '';
    } else {
        title.textContent = 'Add New Student';
        form.reset();
        document.getElementById('studentId').value = '';

        // Roll number will be auto-generated when class is selected
        rollNoInput.value = 'Select class first...';
        rollNoInput.readOnly = true;
        rollNoInput.classList.remove('bg-gray-100', 'text-gray-900');
        rollNoInput.classList.add('bg-gray-800/50', 'text-gray-400', 'border-gray-700/50');
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
    }

    // Auto-generate roll number for new students when class is selected
    const studentId = document.getElementById('studentId').value;
    if (!studentId) { // Only for new students
        const rollNoInput = document.getElementById('roll_no');
        rollNoInput.value = 'Generating...';

        // Generate roll number based on selected class
        getNextRollNumber(selectedClassName, new Date().getFullYear(), 1)
            .then(rollNo => {
                rollNoInput.value = rollNo;
            })
            .catch(err => {
                console.error('Error generating roll number:', err);
                rollNoInput.value = 'Error - please retry';
            });
    }
}

// ========== NEW ROLL NUMBER SYSTEM ==========
// Format: SUF<YY><CLASSCODE><NNNN>
// Example: SUF2507015 = The Suffah School, 2025, Class 5, Student #15

// Class Code Mapping
function getClassCode(className) {
    // Remove section info and normalize class name
    const normalizedClass = className.toLowerCase().replace(/\s*\([a-z]\)$/i, '').trim();

    const classMap = {
        'play group': '01',
        'pg': '01',
        'prep': '02',
        'class 1': '03',
        '1': '03',
        'class 2': '04',
        '2': '04',
        'class 3': '05',
        '3': '05',
        'class 4': '06',
        '4': '06',
        'class 5': '07',
        '5': '07',
        'class 6': '08',
        '6': '08',
        'class 7': '09',
        '7': '09',
        'class 8': '10',
        '8': '10',
        'class 9': '11',
        '9': '11',
        'class 10': '12',
        '10': '12'
    };

    return classMap[normalizedClass] || '99'; // 99 for unknown classes
}

// Get admission year (last 2 digits)
function getAdmissionYearCode(year) {
    if (!year) {
        year = new Date().getFullYear();
    }
    return year.toString().slice(-2); // Last 2 digits
}

// Generate next roll number for a specific class and year
async function getNextRollNumber(className, admissionYear = null, count = 1) {
    try {
        if (!className) {
            throw new Error('Class name is required for roll number generation');
        }

        // Get class code
        const classCode = getClassCode(className);

        // Get year code
        if (!admissionYear) {
            admissionYear = new Date().getFullYear();
        }
        const yearCode = getAdmissionYearCode(admissionYear);

        // Query for max serial number in this class + year combination
        const { data, error } = await supabase
            .from('students')
            .select('roll_no, class, admission_year')
            .eq('admission_year', admissionYear)
            .ilike('class', `%${className.split('(')[0].trim()}%`) // Match class ignoring section
            .order('roll_no', { ascending: false })
            .limit(1);

        if (error) throw error;

        let nextSerial = 1;

        if (data && data.length > 0) {
            // Extract serial number from existing roll number
            const lastRollNo = data[0].roll_no;
            // Format: SUF<YY><CC><NNNN> - extract last 4 digits
            const match = lastRollNo.match(/SUF\d{2}\d{2}(\d{4})$/);
            if (match) {
                nextSerial = parseInt(match[1]) + 1;
            }
        }

        // Generate roll number(s)
        if (count === 1) {
            const serial = nextSerial.toString().padStart(4, '0');
            return `SUF${yearCode}${classCode}${serial}`;
        }

        // For bulk upload - return array
        const rollNumbers = [];
        for (let i = 0; i < count; i++) {
            const serial = (nextSerial + i).toString().padStart(4, '0');
            rollNumbers.push(`SUF${yearCode}${classCode}${serial}`);
        }
        return rollNumbers;

    } catch (err) {
        console.error('Error generating roll number:', err);
        // Fallback
        const yearCode = getAdmissionYearCode(admissionYear || new Date().getFullYear());
        const classCode = getClassCode(className || 'Class 1');
        if (count === 1) {
            return `SUF${yearCode}${classCode}0001`;
        }
        const fallbackRolls = [];
        for (let i = 0; i < count; i++) {
            const serial = (i + 1).toString().padStart(4, '0');
            fallbackRolls.push(`SUF${yearCode}${classCode}${serial}`);
        }
        return fallbackRolls;
    }
}

// Legacy function for backward compatibility - now uses centralized function
async function generateNextRollNo() {
    return await getNextRollNumber(1);
}

// ========== FIX ALL ROLL NUMBERS ==========
// Convert all existing students to new SUF<YY><CLASSCODE><NNNN> format
async function fixAllRollNumbers() {
    const confirmMsg = 'This will convert ALL student roll numbers to the NEW FORMAT!\n\n' +
        'New Format: SUF<YY><CLASSCODE><NNNN>\n' +
        'Example: SUF2507001 = The Suffah School, 2025, Class 5, Student #1\n\n' +
        'This will:\n' +
        '- Group students by CLASS + ADMISSION YEAR\n' +
        '- Assign sequential numbers within each group\n' +
        '- Skip students already in SUF format\n' +
        '- Use admission year from created_at if not set\n\n' +
        'Do you want to continue?';

    if (!confirm(confirmMsg)) {
        return;
    }

    try {
        const tbody = document.getElementById('studentsTableBody');
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-blue-600 font-bold">ðŸ“Š Loading students...</td></tr>';

        const { data: students, error: fetchError } = await supabase
            .from('students')
            .select('*')
            .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;

        if (!students || students.length === 0) {
            alert('No students found.');
            return;
        }

        const totalStudents = students.length;
        console.log(`ðŸ”„ Processing ${totalStudents} students...`);

        // Check which students already have SUF format
        const sufPattern = /^SUF\d{2}\d{2}\d{4}$/;
        const alreadyConverted = students.filter(s => sufPattern.test(s.roll_no));
        const needsConversion = students.filter(s => !sufPattern.test(s.roll_no));

        console.log(`âœ“ Already in SUF format: ${alreadyConverted.length}`);
        console.log(`âš  Needs conversion: ${needsConversion.length}`);

        if (needsConversion.length === 0) {
            alert('âœ… All students already have SUF format roll numbers!');
            return;
        }

        // Group ALL students (including already converted) by class + admission_year
        // This ensures we don't create duplicate roll numbers
        const groups = {};
        const usedRollNumbers = new Set(); // Track all used roll numbers

        students.forEach(student => {
            const admissionYear = student.admission_year || new Date(student.created_at).getFullYear();
            const className = student.class.split('(')[0].trim(); // Remove section
            const groupKey = `${className}_${admissionYear}`;

            if (!groups[groupKey]) {
                groups[groupKey] = {
                    className,
                    admissionYear,
                    students: [],
                    nextSerial: 1
                };
            }

            // If student already has SUF format, track their roll number
            if (sufPattern.test(student.roll_no)) {
                usedRollNumbers.add(student.roll_no);
                // Extract serial number to determine next available
                const match = student.roll_no.match(/SUF\d{2}\d{2}(\d{4})$/);
                if (match) {
                    const serial = parseInt(match[1]);
                    if (serial >= groups[groupKey].nextSerial) {
                        groups[groupKey].nextSerial = serial + 1;
                    }
                }
            }

            groups[groupKey].students.push(student);
        });

        // PHASE: Assign new roll numbers to students that need conversion
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-green-600 font-bold">âš™ï¸ Assigning roll numbers...</td></tr>';
        console.log('âš¡ Assigning SUF format roll numbers...');

        let successCount = 0;
        let failedCount = 0;
        let skippedCount = 0;
        let processedCount = 0;

        for (const [groupKey, group] of Object.entries(groups)) {
            const classCode = getClassCode(group.className);
            const yearCode = getAdmissionYearCode(group.admissionYear);
            let serial = group.nextSerial;

            for (const student of group.students) {
                processedCount++;

                // Skip if already in SUF format
                if (sufPattern.test(student.roll_no)) {
                    console.log(`â­ Skipping ${student.name}: Already has ${student.roll_no}`);
                    skippedCount++;
                    continue;
                }

                // Find next available roll number
                let newRollNo;
                let attempts = 0;
                do {
                    newRollNo = `SUF${yearCode}${classCode}${serial.toString().padStart(4, '0')}`;
                    serial++;
                    attempts++;
                    if (attempts > 1000) {
                        console.error(`âŒ Too many attempts for ${student.name}`);
                        failedCount++;
                        break;
                    }
                } while (usedRollNumbers.has(newRollNo));

                if (attempts > 1000) continue;

                // Update student
                const { error } = await supabase
                    .from('students')
                    .update({
                        roll_no: newRollNo,
                        admission_year: group.admissionYear
                    })
                    .eq('id', student.id);

                if (error) {
                    console.error(`âŒ Error updating ${student.name}:`, error);
                    console.error('Error details:', error.message, error.details, error.hint);
                    failedCount++;
                } else {
                    console.log(`âœ… ${student.name}: ${student.roll_no} â†’ ${newRollNo}`);
                    usedRollNumbers.add(newRollNo); // Mark as used
                    successCount++;
                }

                // Update progress every 5 students
                if (processedCount % 5 === 0 || processedCount === totalStudents) {
                    tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-green-600 font-bold">âš™ï¸ Processing: ${processedCount}/${totalStudents} students...</td></tr>`;
                }
            }
        }

        console.log('âœ… Process Complete!');
        console.log(`Skipped: ${skippedCount} | Converted: ${successCount} | Failed: ${failedCount}`);

        if (failedCount > 0) {
            alert(`âš ï¸ Completed:\n\nâ­ Already converted: ${skippedCount}\nâœ“ Newly converted: ${successCount}\nâœ— Failed: ${failedCount}\n\nCheck console for error details.`);
        } else {
            alert(`âœ… SUCCESS!\n\nâ­ Already in SUF format: ${skippedCount}\nâœ“ Newly converted: ${successCount}\n\nAll students now have proper SUF<YY><CLASSCODE><NNNN> roll numbers!`);
        }

        // Refresh table
        await fetchStudents();

    } catch (error) {
        console.error('âŒ Error:', error);
        alert('Error: ' + error.message);
        await fetchStudents();
    }
}


function closeModal() {
    const modal = document.getElementById('studentModal');
    const content = modal.querySelector('.bg-gray-900');

    content.classList.remove('opacity-100', 'scale-100', 'translate-y-0');
    content.classList.add('opacity-0', 'scale-95', 'translate-y-4');

    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
}

// Validation and Formatting Functions
function formatCNICInput(e) {
    let value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length > 13) value = value.substring(0, 13);

    // Format as XXXXX-XXXXXXX-X
    if (value.length > 5) {
        value = value.substring(0, 5) + '-' + value.substring(5);
    }
    if (value.length > 13) {
        value = value.substring(0, 13) + '-' + value.substring(13);
    }

    e.target.value = value;
}

function validateCNIC(cnic) {
    const cnicPattern = /^\d{5}-\d{7}-\d{1}$/;
    return cnicPattern.test(cnic);
}

function validatePhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 11 && cleaned.startsWith('0');
}



async function handleFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('studentId').value;
    const name = document.getElementById('name').value.trim();
    const roll_no = document.getElementById('roll_no').value;
    const studentClass = document.getElementById('class').value;
    const section = document.getElementById('section').value;
    const phone = document.getElementById('phone').value.trim();
    const gender = document.getElementById('gender').value;
    const dateOfBirth = document.getElementById('date_of_birth').value;
    let email = document.getElementById('email').value.trim();

    // New fields
    const fatherName = document.getElementById('father_name').value.trim();
    const fatherCNIC = document.getElementById('father_cnic').value.trim();
    const fromWhichSchool = document.getElementById('from_which_school').value.trim();
    const familyCode = document.getElementById('family_code').value.trim();
    const admissionDate = document.getElementById('admission_date').value;

    // Validation
    if (!validatePhone(phone)) {
        alert('Invalid phone number. Please enter 11 digits starting with 0 (e.g., 03001234567)');
        return;
    }

    if (!validateCNIC(fatherCNIC)) {
        alert('Invalid CNIC format. Please use format: 12345-1234567-1');
        return;
    }

    const saveBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        let generatedCreds = null;

        // If new student (no ID), handle duplication check and credential generation
        if (!id) {
            // Check for duplicate student (Name + Father Name + CNIC)
            const { data: existingStudent, error: checkError } = await supabase
                .from('students')
                .select('id')
                .eq('name', name)
                .eq('father_name', fatherName)
                .eq('father_cnic', fatherCNIC)
                .maybeSingle();

            if (checkError) {
                console.error('Error checking for duplicate:', checkError);
            }

            if (existingStudent) {
                alert('Duplicate Entry Detected: A student with this Name, Father Name, and CNIC already exists in the system.');
                return;
            }

            // 1. Generate email from roll number if not provided (fallback logic)
            if (!email) {
                email = `${roll_no}@student.suffah.school`;
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
            date_of_birth: dateOfBirth,
            password_changed: false,
            // New fields
            father_name: fatherName,
            father_cnic: fatherCNIC,
            from_which_school: fromWhichSchool || null,
            family_code: familyCode || null,
            admission_date: admissionDate || new Date().toISOString().split('T')[0]
        };

        // Add admission_year for new students
        if (!id) {
            studentData.admission_year = new Date().getFullYear();
        }

        let result;
        if (id) {
            // Update
            result = await supabase.from('students').update(studentData).eq('id', id).select();
        } else {
            // Insert
            result = await supabase.from('students').insert([studentData]).select();
        }

        if (result.error) throw result.error;

        // AUTH SYNC: Create/Update student portal access
        const student = result.data ? result.data[0] : null;
        if (student && student.date_of_birth) {
            await syncStudentAuth(student);
        }

        closeModal();
        fetchStudents();
    } catch (error) {
        console.error('Error saving student:', error);
        alert('Error saving student: ' + error.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalBtnText;
    }
}

async function syncStudentAuth(student) {
    try {
        const password = student.date_of_birth.split('-').reverse().join('');
        const loginEmail = `${student.roll_no.toLowerCase()}@student.suffah.school`;

        const tempClient = window.SupabaseLib.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
        });

        const { data, error } = await tempClient.auth.signUp({
            email: loginEmail,
            password: password,
            options: {
                data: {
                    role: 'student',
                    name: student.name,
                    roll_no: student.roll_no
                }
            }
        });

        if (error && !error.message.includes('already registered')) throw error;

        // Link auth_id back to profile
        if (data && data.user) {
            await supabase.from('students').update({ auth_id: data.user.id }).eq('id', student.id);
        }

    } catch (err) {
        console.error('Student Auth Sync Failed:', err);
    }
}

function showCredentialsModal(studentId, password) {
    const modal = document.getElementById('credentialsModal');

    // Move modal to body to break out of dashboard layout
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    const content = modal.querySelector('div');

    document.getElementById('credEmail').textContent = studentId;
    document.getElementById('credPassword').textContent = password;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Animate In with tiny timeout to ensure display change reflects
    setTimeout(() => {
        content.classList.remove('opacity-0', 'scale-95', 'translate-y-4');
        content.classList.add('opacity-100', 'scale-100', 'translate-y-0');
    }, 10);
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

    // Move modal to body to break out of dashboard layout
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    const content = modal.querySelector('div'); // Assuming first div inside modal is the content container
    // Actually, in the HTML, the content div is the direct child.
    // Let's be safe and select by class or structure if needed, but querySelector('div') should get the first div.
    // Looking at HTML: <div id="bulkUploadModal"> <div class="bg-white...">

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    // Animate In with tiny timeout to ensure display change reflects
    setTimeout(() => {
        innerContent.classList.remove('opacity-0', 'scale-95', 'translate-y-4');
        innerContent.classList.add('opacity-100', 'scale-100', 'translate-y-0');
    }, 10);

    // Reset state
    parsedStudents = [];
    document.getElementById('excelFileInput').value = '';
    document.getElementById('selectedFileName').textContent = '';
    document.getElementById('uploadResults').classList.add('hidden');
    document.getElementById('uploadStudentsBtn').disabled = true;
}

function closeBulkModal() {
    const modal = document.getElementById('bulkUploadModal');
    const content = modal.querySelector('.bg-white');

    content.classList.remove('opacity-100', 'scale-100', 'translate-y-0');
    content.classList.add('opacity-0', 'scale-95', 'translate-y-4');

    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
}

// Download Excel Template
async function downloadTemplate() {
    try {
        await window.loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
        const wb = XLSX.utils.book_new();
        // ... rest of the function ...
        // Note: I'll include the rest in the next block if needed, but I can target the whole block.
        // Actually, I'll replace the whole blocks to be safe.

        // Template data with headers and sample row (Roll No will be auto-generated)
        const templateData = [
            ['Name', 'Father Name', 'Father CNIC', 'Contact Number', 'Date of Birth', 'Class', 'Section', 'Gender', 'From Which School', 'Admission Date', 'Family Code', 'Gmail'],
            ['John Doe', 'Mr. John Sr.', '12345-1234567-1', '03001234567', '2010-08-15', 'Class 10', 'A', 'Male', 'ABC School', '2025-01-01', 'FAM001', 'john@gmail.com']
        ];

        const ws = XLSX.utils.aoa_to_sheet(templateData);

        // Set column widths
        ws['!cols'] = [
            { wch: 20 }, // Name
            { wch: 20 }, // Father Name
            { wch: 18 }, // Father CNIC
            { wch: 15 }, // Contact Number
            { wch: 15 }, // Date of Birth
            { wch: 12 }, // Class
            { wch: 10 }, // Section
            { wch: 10 }, // Gender
            { wch: 20 }, // From Which School
            { wch: 15 }, // Admission Date
            { wch: 12 }, // Family Code
            { wch: 25 }  // Gmail
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Students');
        XLSX.writeFile(wb, 'Student_Bulk_Upload_Template.xlsx');
    } catch (err) {
        alert('Failed to load Excel library. Please check your connection.');
    }
}

// Handle File Selection
async function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
        await window.loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');

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
    } catch (err) {
        alert('Failed to load Excel library. Please check your connection.');
    }
}

// Validate Excel Data (Roll No will be auto-generated, not required in file)
function validateExcelData(jsonData) {
    const students = [];
    const errors = [];

    jsonData.forEach((row, index) => {
        const rowNum = index + 2; // +2 because Excel is 1-indexed and has header row
        const rowErrors = [];

        // Required fields validation (Roll No is NOT required - will be auto-generated)
        if (!row['Name'] || row['Name'].toString().trim() === '') {
            rowErrors.push(`Row ${rowNum}: Name is required`);
        }
        if (!row['Father Name'] || row['Father Name'].toString().trim() === '') {
            rowErrors.push(`Row ${rowNum}: Father Name is required`);
        }
        if (!row['Father CNIC'] || row['Father CNIC'].toString().trim() === '') {
            rowErrors.push(`Row ${rowNum}: Father CNIC is required`);
        } else if (!validateCNIC(row['Father CNIC'].toString().trim())) {
            rowErrors.push(`Row ${rowNum}: Invalid CNIC format (use: 12345-1234567-1)`);
        }
        if (!row['Contact Number'] || row['Contact Number'].toString().trim() === '') {
            rowErrors.push(`Row ${rowNum}: Contact Number is required`);
        } else if (!validatePhone(row['Contact Number'].toString().trim())) {
            rowErrors.push(`Row ${rowNum}: Invalid phone format (11 digits starting with 0)`);
        }
        if (!row['Class'] || row['Class'].toString().trim() === '') {
            rowErrors.push(`Row ${rowNum}: Class is required`);
        }
        if (!row['Section'] || row['Section'].toString().trim() === '') {
            rowErrors.push(`Row ${rowNum}: Section is required`);
        }
        if (!row['Date of Birth'] || row['Date of Birth'].toString().trim() === '') {
            rowErrors.push(`Row ${rowNum}: Date of Birth is required`);
        }

        if (rowErrors.length === 0) {
            students.push({
                name: row['Name'].toString().trim(),
                father_name: row['Father Name'].toString().trim(),
                father_cnic: row['Father CNIC'].toString().trim(),
                phone: row['Contact Number'].toString().trim(),
                date_of_birth: row['Date of Birth'].toString().trim(),
                // roll_no will be auto-generated in handleBulkUpload
                class: row['Class'].toString().trim(),
                section: row['Section'].toString().trim(),
                gender: row['Gender'] ? row['Gender'].toString().trim() : 'Male',
                from_which_school: row['From Which School'] ? row['From Which School'].toString().trim() : null,
                admission_date: row['Admission Date'] ? row['Admission Date'].toString().trim() : null,
                family_code: row['Family Code'] ? row['Family Code'].toString().trim() : null,
                email: row['Gmail'] ? row['Gmail'].toString().trim() : ''
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
        html += `<div class="text-green-600 font-semibold mb-2">âœ“ ${students.length} student(s) ready to upload</div>`;
    }

    if (errors.length > 0) {
        html += `<div class="text-red-600 font-semibold mb-2">âœ— ${errors.length} error(s) found:</div>`;
        html += '<ul class="list-disc list-inside text-red-600 text-xs space-y-1">';
        errors.forEach(err => {
            html += `<li>${err}</li>`;
        });
        html += '</ul>';
    }

    summaryDiv.innerHTML = html;
}

// Handle Bulk Upload with New Roll Number Format
async function handleBulkUpload() {
    if (parsedStudents.length === 0) return;

    const uploadBtn = document.getElementById('uploadStudentsBtn');
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Generating Roll Numbers...';

    try {
        const currentYear = new Date().getFullYear();

        // Group students by class
        const studentsByClass = {};
        parsedStudents.forEach(student => {
            const className = student.class;
            if (!studentsByClass[className]) {
                studentsByClass[className] = [];
            }
            studentsByClass[className].push(student);
        });

        // Generate roll numbers for each class group
        const studentsWithRollNo = [];

        for (const [className, classStudents] of Object.entries(studentsByClass)) {
            // Get roll numbers for this class
            const rollNumbers = await getNextRollNumber(className, currentYear, classStudents.length);

            // Assign roll numbers to students in this class
            classStudents.forEach((student, index) => {
                const rollNo = rollNumbers[index];
                studentsWithRollNo.push({
                    ...student,
                    roll_no: rollNo,
                    // Generate email from roll number if not provided
                    email: student.email || `${rollNo}@student.suffah.school`,
                    admission_year: currentYear
                });
            });
        }

        uploadBtn.textContent = 'Uploading...';

        // Insert all students with auto-generated roll numbers
        const { data, error } = await supabase
            .from('students')
            .insert(studentsWithRollNo);

        if (error) {
            throw error;
        }

        alert(`Success! ${parsedStudents.length} student(s) added successfully with new roll number format (SUF format).`);
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

// ========== FIX CLASS NAMES ==========
async function fixClassNames() {
    if (!confirm('This will update student class names to match the standard format (e.g., "7" -> "Class 7"). Continue?')) {
        return;
    }

    const loadingMsg = 'Fixing class names...';
    // Use loadingOverlay instead of toast.loading
    if (window.loadingOverlay) window.loadingOverlay.show(loadingMsg);
    else console.log(loadingMsg);

    try {
        // 1. Get valid classes
        const { data: classes, error: classError } = await supabase
            .from('classes')
            .select('class_name');

        if (classError) throw classError;

        const validClassNames = new Set(classes.map(c => c.class_name));

        // 2. Get all students
        const { data: students, error: studentError } = await supabase
            .from('students')
            .select('id, class');

        if (studentError) throw studentError;

        // 3. Identify updates
        const updates = [];
        students.forEach(student => {
            const currentClass = student.class;
            // If class is NOT in valid list
            if (currentClass && !validClassNames.has(currentClass)) {
                // Try adding "Class " prefix
                const fixedClass = `Class ${currentClass}`;
                // If adding prefix makes it valid, then it's a candidate for update
                if (validClassNames.has(fixedClass)) {
                    updates.push({ id: student.id, class: fixedClass });
                }
            }
        });

        if (updates.length === 0) {
            if (window.loadingOverlay) window.loadingOverlay.hide();
            if (window.toast) window.toast.info('No class names needed fixing.');
            else alert('No class names needed fixing.');
            return;
        }

        // 4. Perform updates
        // We'll do parallel promises
        const updatePromises = updates.map(u =>
            supabase.from('students').update({ class: u.class }).eq('id', u.id)
        );

        await Promise.all(updatePromises);

        if (window.loadingOverlay) window.loadingOverlay.hide();
        if (window.toast) window.toast.success(`Fixed ${updates.length} student class names!`);
        else alert(`Fixed ${updates.length} student class names!`);

        // Refresh table
        await fetchStudents();

    } catch (error) {
        console.error(error);
        if (window.loadingOverlay) window.loadingOverlay.hide();
        if (window.toast) window.toast.error('Failed to fix class names');
        else alert('Failed to fix class names');
    }
}

// ========== PORTAL SYNC SYSTEM ==========
async function syncAllPortals() {
    if (!confirm('This will create portal login access for all students. It may take a while if you have many students. Continue?')) {
        return;
    }

    if (window.loadingOverlay) window.loadingOverlay.show('Syncing Student Portals...');

    try {
        const { data: students, error } = await supabase.from('students').select('*');
        if (error) throw error;

        let successCount = 0;
        let skipCount = 0;

        for (const student of students) {
            // Only attempt if they have DOB
            if (student.date_of_birth) {
                try {
                    // Use the new centralized helper
                    await syncStudentAuth(student);
                    successCount++;
                } catch (e) {
                    console.error('Error syncing individual student:', e);
                    skipCount++; // Count as skipped/failed but continue
                }
            } else {
                skipCount++;
            }
        }

        if (window.loadingOverlay) window.loadingOverlay.hide();
        alert(`Portal Sync Complete!\n\nProcessed: ${successCount} students\nSkipped (No DOB/Error): ${skipCount}`);
        await fetchStudents();

    } catch (error) {
        console.error('Sync error:', error);
        if (window.loadingOverlay) window.loadingOverlay.hide();
        alert('Sync failed: ' + error.message);
    }
}

async function handleSyncSinglePortal() {
    const studentId = document.getElementById('profileStudentId').value;
    const student = currentStudents.find(s => s.id === studentId);

    if (!student) return;
    if (!student.date_of_birth) {
        alert('Date of Birth is required to enable portal access.');
        return;
    }

    const btn = document.getElementById('syncSinglePortalBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'Syncing...';

    try {
        await syncStudentAuth(student);

        const password = student.date_of_birth.split('-').reverse().join('');
        alert(`Portal access enabled successfully!\n\nLogin User ID: ${student.roll_no}\nPassword: ${password}\n\nThe student can now log in using only their Roll Number.`);
        await fetchStudents();
    } catch (error) {
        alert('Sync failed: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}
