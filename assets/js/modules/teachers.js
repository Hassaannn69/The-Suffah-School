// Use global Supabase client for production compatibility
const supabase = window.supabase || (() => {
    console.error('Supabase client not found on window object');
    throw new Error('Supabase client not initialized');
})();

let currentTeachers = [];
let parsedTeachers = []; // For bulk upload

export async function render(container) {
    container.innerHTML = `
        <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors duration-200">
            <div class="p-6 border-b border-gray-200 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">Teachers Directory</h2>
                <div class="flex space-x-3">
                    <input type="text" id="searchTeacherInput" placeholder="Search teachers..." class="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white placeholder-gray-500 transition-colors">
                    
                    <!-- Dropdown Button -->
                    <div class="relative">
                        <button id="addTeacherDropdown" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-lg shadow-primary-500/20">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Add Teacher
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        
                        <!-- Dropdown Menu -->
                        <div id="teacherDropdownMenu" class="hidden absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20">
                            <button id="addSingleTeacher" class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center transition-colors border-b border-gray-100 dark:border-gray-700 group">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 text-primary-500 dark:text-primary-400 group-hover:text-primary-600 dark:group-hover:text-primary-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Add a Teacher</div>
                                    <div class="text-xs text-gray-500 dark:text-gray-400">Single entry</div>
                                </div>
                            </button>
                            <button id="addBulkTeachers" class="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center transition-colors group">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-3 text-green-500 dark:text-green-400 group-hover:text-green-600 dark:group-hover:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <div>
                                    <div class="font-medium text-gray-900 dark:text-white">Bulk Import</div>
                                    <div class="text-xs text-gray-500 dark:text-gray-400">Upload Excel file</div>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Teacher Table -->
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th class="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Teacher</th>
                            <th class="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee ID</th>
                            <th class="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subjects</th>
                            <th class="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phone</th>
                            <th class="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                            <th class="p-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="teachersTableBody" class="divide-y divide-gray-200 dark:divide-gray-800">
                        <tr><td colspan="6" class="p-4 text-center text-gray-500 dark:text-gray-400">Loading...</td></tr>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div class="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
                <span class="text-xs text-gray-500 dark:text-gray-500">Showing all records</span>
            </div>
        </div>

        <!-- Add/Edit Teacher Modal -->
        <div id="teacherModal" class="modal-overlay fixed inset-0 bg-black/80 hidden items-center justify-center z-50 backdrop-blur-sm overflow-y-auto transition-opacity duration-300">
            <div class="bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl mx-4 my-4 overflow-hidden transform transition-all duration-300 ease-out opacity-0 scale-95 translate-y-4 border border-gray-800">
                <div class="bg-gradient-to-r from-primary-600 to-indigo-600 p-6 flex justify-between items-center">
                    <h3 id="teacherModalTitle" class="text-xl font-bold text-white">Add New Teacher</h3>
                    <button id="closeTeacherModalBtn" class="text-white hover:text-gray-200 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form id="teacherForm" class="p-6 space-y-4">
                    <input type="hidden" id="teacherId">
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Full Name *</label>
                            <input type="text" id="teacherName" required class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 outline-none">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Employee ID *</label>
                            <input type="text" id="employeeId" required class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 outline-none">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Email</label>
                            <input type="email" id="teacherEmail" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 outline-none">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                            <input type="tel" id="teacherPhone" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 outline-none">
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">Address</label>
                        <input type="text" id="teacherAddress" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 outline-none">
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Qualification</label>
                            <input type="text" id="teacherQualification" placeholder="e.g. M.Ed, B.Sc" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 outline-none">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Date of Birth *</label>
                            <input type="date" id="teacherDOB" required class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500 outline-none">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Date of Joining</label>
                            <input type="date" id="teacherDoj" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 outline-none">
                        </div>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">Subjects (comma separated)</label>
                        <input type="text" id="teacherSubjects" placeholder="e.g. Mathematics, Physics" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 outline-none">
                    </div>

                    <div class="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                        <button type="button" id="cancelTeacherBtn" class="px-4 py-2 text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700">Cancel</button>
                        <button type="submit" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-lg shadow-primary-500/20">Save Teacher</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Profile Modal -->
         <div id="teacherProfileModal" class="modal-overlay fixed inset-0 bg-black/80 hidden items-center justify-center z-50 backdrop-blur-sm overflow-y-auto">
            <div class="bg-gray-900 rounded-xl shadow-2xl w-full max-w-3xl mx-4 my-4 overflow-hidden border border-gray-800 flex flex-col">
                <!-- Header with Photo -->
                <div class="relative h-40 flex-shrink-0 group">
                    <div class="absolute inset-0 overflow-hidden">
                        <div class="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black"></div>
                        <div class="absolute -top-24 -right-24 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl opacity-50"></div>
                        <div class="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl opacity-50"></div>
                    </div>

                    <button id="closeTeacherProfileBtn" class="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-20 bg-black/20 hover:bg-black/40 rounded-full p-2 backdrop-blur-sm border border-white/5">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    <div class="absolute -bottom-12 left-8 flex items-end z-20">
                        <div class="relative group/photo">
                            <div class="h-28 w-28 rounded-full border-4 border-gray-900 bg-gray-800 shadow-2xl overflow-hidden relative z-10 ring-1 ring-gray-700/50">
                                <img id="teacherProfilePhoto" src="" alt="Profile" class="h-full w-full object-cover hidden">
                                <div id="teacherProfilePhotoPlaceholder" class="h-full w-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800 text-white text-3xl font-bold">
                                    T
                                </div>
                            </div>
                            <label for="teacherPhotoInput" class="absolute bottom-1 right-1 bg-gray-800 rounded-full p-2 shadow-lg cursor-pointer hover:bg-gray-700 transition-colors text-gray-400 hover:text-white border border-gray-700 z-20 group-hover/photo:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <input type="file" id="teacherPhotoInput" accept="image/*" class="hidden">
                            </label>
                        </div>
                        <div class="ml-5 mb-2">
                            <h2 id="teacherProfileName" class="text-3xl font-bold text-white tracking-tight drop-shadow-md">Teacher Name</h2>
                            <div class="flex items-center mt-1 space-x-2">
                                <span id="teacherProfileEmpId" class="px-2.5 py-0.5 rounded-full bg-gray-800/80 border border-gray-700 text-gray-300 text-xs font-medium backdrop-blur-sm">EMP-001</span>
                                <span id="teacherProfileStatus" class="px-2.5 py-0.5 rounded-full bg-green-900/50 border border-green-700 text-green-400 text-xs font-medium">Active</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex-1 p-6 pt-16 overflow-y-auto">
                    <!-- Tabs -->
                    <div class="flex border-b border-gray-800 mb-6">
                        <button id="teacherTabBtnPersonal" class="px-4 py-2 text-primary-500 border-b-2 border-primary-500 font-medium transition-all">Personal Info</button>
                        <button id="teacherTabBtnAccount" class="px-4 py-2 text-gray-400 hover:text-white font-medium transition-all">Account & Credentials</button>
                    </div>

                    <div id="teacherTabPersonal" class="space-y-6">
                        <input type="hidden" id="profileTeacherId">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-white">
                            <div class="space-y-4">
                                <div>
                                    <label class="text-[10px] text-gray-500 uppercase font-bold">Official Email</label>
                                    <p id="teacherProfileEmail" class="font-medium lowercase"></p>
                                </div>
                                <div>
                                    <label class="text-[10px] text-gray-500 uppercase font-bold">Contact Number</label>
                                    <p id="teacherProfilePhone" class="font-medium"></p>
                                </div>
                            </div>
                            <div class="space-y-4">
                                <div>
                                    <label class="text-[10px] text-gray-500 uppercase font-bold">Qualification</label>
                                    <p id="teacherProfileQualification" class="font-medium"></p>
                                </div>
                                <div>
                                    <label class="text-[10px] text-gray-500 uppercase font-bold">Joining Date</label>
                                    <p id="teacherProfileDoj" class="font-medium"></p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label class="text-[10px] text-gray-500 uppercase font-bold mb-2 block">residential Address</label>
                            <p id="teacherProfileAddress" class="text-white text-sm"></p>
                        </div>
                        <div>
                            <label class="text-[10px] text-gray-500 uppercase font-bold mb-2 block">Subjects Expertise</label>
                            <div id="teacherProfileSubjects" class="flex flex-wrap gap-2"></div>
                        </div>
                        
                        <div class="flex gap-3 pt-4 border-t border-gray-800 mt-6">
                            <button id="editTeacherProfileBtn" class="flex-1 flex items-center justify-center px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm font-medium text-white transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                Edit Profile
                            </button>
                            <button id="toggleTeacherStatusBtn" class="flex-1 flex items-center justify-center px-4 py-2 bg-yellow-900/10 hover:bg-yellow-900/30 border border-yellow-700/50 rounded-lg text-sm font-medium text-yellow-400 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                                <span id="toggleStatusText">Deactivate</span>
                            </button>
                            <button id="deleteTeacherProfileBtn" class="px-4 py-2 bg-red-900/10 hover:bg-red-900/30 border border-red-700/50 rounded-lg text-sm font-medium text-red-500 transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    </div>

                    <div id="teacherTabAccount" class="hidden space-y-6">
                        <div class="bg-gray-800/30 rounded-2xl p-6 border border-gray-800">
                             <h4 class="text-white font-bold mb-4 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 2.944a11.955 11.955 0 01-8.618 3.04m16.512 0L12 12V2.944m0 0a11.955 11.955 0 018.618 3.04" />
                                </svg>
                                Portal Credentials
                            </h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                                    <label class="text-[10px] text-gray-500 uppercase font-bold block mb-1">Login ID</label>
                                    <p id="teacherProfileCredId" class="text-white font-mono text-lg"></p>
                                </div>
                                <div class="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                                    <label class="text-[10px] text-gray-500 uppercase font-bold block mb-1">Password</label>
                                    <p id="teacherProfileCredPass" class="text-white font-mono text-lg"></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Bulk Upload Modal -->
        <div id="bulkTeacherModal" class="modal-overlay fixed inset-0 bg-black/80 hidden items-center justify-center z-50 backdrop-blur-sm overflow-y-auto transition-opacity duration-300">
            <div class="bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl mx-4 my-4 overflow-hidden transform transition-all duration-300 ease-out opacity-0 scale-95 translate-y-4 border border-gray-800">
                <div class="bg-gradient-to-r from-green-600 to-emerald-600 p-6 flex justify-between items-center">
                    <h3 class="text-xl font-bold text-white">Bulk Import Teachers</h3>
                    <button id="closeBulkTeacherModalBtn" class="text-white hover:text-gray-200 transition-colors">
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
                                    <strong>Instructions:</strong> Download the Excel template, fill in teacher details, and upload the file.
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Download Template -->
                    <div class="mb-6">
                        <button id="downloadTeacherTemplateBtn" class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium flex items-center justify-center transition-colors shadow-lg shadow-green-500/20">
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
                            <input type="file" id="teacherExcelFileInput" accept=".xlsx,.xls" class="hidden">
                            <label for="teacherExcelFileInput" class="cursor-pointer">
                                <svg class="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                                <p class="mt-2 text-sm text-gray-400">Click to select Excel file or drag and drop</p>
                                <p class="text-xs text-gray-500">XLSX or XLS files only</p>
                            </label>
                        </div>
                        <p id="selectedTeacherFileName" class="mt-2 text-sm text-gray-400"></p>
                    </div>

                    <!-- Preview/Errors -->
                    <div id="teacherUploadResults" class="hidden mb-6">
                        <h4 class="font-semibold text-white mb-2">Upload Summary</h4>
                        <div id="teacherUploadSummary" class="bg-gray-800 rounded-lg p-4 text-sm text-gray-300"></div>
                    </div>

                    <!-- Actions -->
                    <div class="flex justify-end space-x-3">
                        <button type="button" id="cancelBulkTeacherBtn" class="px-4 py-2 text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700">Cancel</button>
                        <button type="button" id="uploadTeachersBtn" disabled class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary-500/20">Upload Teachers</button>
                    </div>
                </div>
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
    const dropdown = document.getElementById('addTeacherDropdown');
    const dropdownMenu = document.getElementById('teacherDropdownMenu');

    if (dropdown && dropdownMenu) {
        dropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownMenu.classList.toggle('hidden');
        });

        document.addEventListener('click', () => {
            dropdownMenu.classList.add('hidden');
        });
    }

    // Single teacher modal
    addEvent('addSingleTeacher', 'click', () => {
        if (dropdownMenu) dropdownMenu.classList.add('hidden');
        openTeacherModal();
    });

    addEvent('closeTeacherModalBtn', 'click', closeTeacherModal);
    addEvent('cancelTeacherBtn', 'click', closeTeacherModal);
    addEvent('teacherForm', 'submit', handleTeacherFormSubmit);

    // Bulk upload modal
    addEvent('addBulkTeachers', 'click', () => {
        if (dropdownMenu) dropdownMenu.classList.add('hidden');
        openBulkTeacherModal();
    });

    addEvent('closeBulkTeacherModalBtn', 'click', closeBulkTeacherModal);
    addEvent('cancelBulkTeacherBtn', 'click', closeBulkTeacherModal);
    addEvent('downloadTeacherTemplateBtn', 'click', downloadTeacherTemplate);
    addEvent('teacherExcelFileInput', 'change', handleTeacherFileSelect);
    addEvent('uploadTeachersBtn', 'click', handleBulkTeacherUpload);

    // Profile modal
    addEvent('closeTeacherProfileBtn', 'click', closeTeacherProfile);
    addEvent('editTeacherProfileBtn', 'click', () => {
        const id = document.getElementById('profileTeacherId').value;
        closeTeacherProfile();
        window.editTeacher(id);
    });
    addEvent('toggleTeacherStatusBtn', 'click', toggleTeacherStatus);
    addEvent('deleteTeacherProfileBtn', 'click', () => {
        const id = document.getElementById('profileTeacherId').value;
        window.deleteTeacher(id);
    });
    addEvent('teacherPhotoInput', 'change', handleTeacherPhotoUpload);

    // Tab Switching
    addEvent('teacherTabBtnPersonal', 'click', () => switchTeacherTab('personal'));
    addEvent('teacherTabBtnAccount', 'click', () => switchTeacherTab('account'));

    // Search
    addEvent('searchTeacherInput', 'input', handleTeacherSearch);

    // Initial fetch
    fetchTeachers();
}

async function fetchTeachers() {
    const tbody = document.getElementById('teachersTableBody');
    tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gray-400">Loading...</td></tr>';

    const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching teachers:', error);
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-red-400">Error loading teachers. Make sure the teachers table exists.</td></tr>';
        return;
    }

    currentTeachers = data || [];
    renderTeacherTable(currentTeachers);
}

function renderTeacherTable(teachers) {
    const tbody = document.getElementById('teachersTableBody');

    if (!teachers || teachers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gray-500 dark:text-gray-400">No teachers found</td></tr>';
        return;
    }

    tbody.innerHTML = teachers.map(teacher => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group border-b border-gray-200 dark:border-gray-800 last:border-0">
            <td class="p-4">
                <button onclick="window.viewTeacherProfile('${teacher.id}')" class="text-left hover:text-primary-600 dark:hover:text-primary-400 transition-colors focus:outline-none flex items-center">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm mr-3 shadow-lg shadow-primary-500/20">
                        ${teacher.name ? teacher.name.charAt(0).toUpperCase() : 'T'}
                    </div>
                    <div>
                        <div class="font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">${teacher.name}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">${teacher.email || 'No email'}</div>
                    </div>
                </button>
            </td>
            <td class="p-4 text-gray-600 dark:text-gray-300 font-mono text-sm">${teacher.employee_id}</td>
            <td class="p-4">
                <div class="flex flex-wrap gap-1">
                    ${(teacher.subjects || []).slice(0, 2).map(sub => `<span class="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium">${sub}</span>`).join('')}
                    ${(teacher.subjects || []).length > 2 ? `<span class="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">+${teacher.subjects.length - 2}</span>` : ''}
                </div>
            </td>
            <td class="p-4 text-gray-600 dark:text-gray-300">${teacher.phone || '-'}</td>
            <td class="p-4">
                ${teacher.is_active
            ? '<span class="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">Active</span>'
            : '<span class="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-medium">Inactive</span>'
        }
            </td>
            <td class="p-4 text-right">
                <button onclick="window.viewTeacherProfile('${teacher.id}')" class="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-primary-400 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center ml-auto border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    View Profile
                </button>
            </td>
        </tr>
    `).join('');
}

// Window functions
window.viewTeacherProfile = async (id) => {
    const teacher = currentTeachers.find(t => t.id === id);
    if (!teacher) {
        alert('Teacher not found');
        return;
    }

    const modal = document.getElementById('teacherProfileModal');
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    const content = modal.querySelector('div');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    void modal.offsetWidth;
    content.classList.remove('opacity-0', 'scale-95', 'translate-y-4');
    content.classList.add('opacity-100', 'scale-100', 'translate-y-0');

    // Populate data
    document.getElementById('profileTeacherId').value = teacher.id;
    document.getElementById('teacherProfileName').textContent = teacher.name || 'N/A';
    document.getElementById('teacherProfileEmpId').textContent = teacher.employee_id || 'N/A';
    document.getElementById('teacherProfileEmail').textContent = teacher.email || '-';
    document.getElementById('teacherProfilePhone').textContent = teacher.phone || '-';
    document.getElementById('teacherProfileAddress').textContent = teacher.address || '-';
    document.getElementById('teacherProfileQualification').textContent = teacher.qualification || '-';
    document.getElementById('teacherProfileDoj').textContent = teacher.date_of_joining || '-';

    // Status
    const statusEl = document.getElementById('teacherProfileStatus');
    const toggleText = document.getElementById('toggleStatusText');
    if (teacher.is_active) {
        statusEl.textContent = 'Active';
        statusEl.className = 'px-2.5 py-0.5 rounded-full bg-green-900/50 border border-green-700 text-green-400 text-xs font-medium';
        toggleText.textContent = 'Deactivate';
    } else {
        statusEl.textContent = 'Inactive';
        statusEl.className = 'px-2.5 py-0.5 rounded-full bg-red-900/50 border border-red-700 text-red-400 text-xs font-medium';
        toggleText.textContent = 'Activate';
    }

    // Subjects
    const subjectsEl = document.getElementById('teacherProfileSubjects');
    if (teacher.subjects && teacher.subjects.length > 0) {
        subjectsEl.innerHTML = teacher.subjects.map(sub => `<span class="px-2 py-1 bg-indigo-900/30 text-indigo-400 rounded text-xs">${sub}</span>`).join('');
    } else {
        subjectsEl.innerHTML = '<span class="text-gray-500 text-sm">No subjects assigned</span>';
    }

    // Photo
    const photoImg = document.getElementById('teacherProfilePhoto');
    const placeholder = document.getElementById('teacherProfilePhotoPlaceholder');
    if (teacher.photo_url) {
        photoImg.src = teacher.photo_url;
        photoImg.classList.remove('hidden');
        placeholder.classList.add('hidden');
    } else {
        photoImg.classList.add('hidden');
        placeholder.classList.remove('hidden');
        placeholder.textContent = teacher.name ? teacher.name.charAt(0).toUpperCase() : 'T';
    }

    // NEW: Credentials Tab Population
    document.getElementById('teacherProfileCredId').textContent = teacher.employee_id;
    document.getElementById('teacherProfileCredPass').textContent = teacher.date_of_birth ? teacher.date_of_birth.split('-').reverse().join('') : 'Not Set';

    // Default to Personal tab
    switchTeacherTab('personal');
};

function switchTeacherTab(tabName) {
    const personalBtn = document.getElementById('teacherTabBtnPersonal');
    const accountBtn = document.getElementById('teacherTabBtnAccount');
    const personalContent = document.getElementById('teacherTabPersonal');
    const accountContent = document.getElementById('teacherTabAccount');

    if (tabName === 'personal') {
        personalBtn.className = 'px-4 py-2 text-primary-500 border-b-2 border-primary-500 font-medium transition-all';
        accountBtn.className = 'px-4 py-2 text-gray-400 hover:text-white font-medium transition-all';
        personalContent.classList.remove('hidden');
        accountContent.classList.add('hidden');
    } else {
        accountBtn.className = 'px-4 py-2 text-primary-500 border-b-2 border-primary-500 font-medium transition-all';
        personalBtn.className = 'px-4 py-2 text-gray-400 hover:text-white font-medium transition-all';
        personalContent.classList.add('hidden');
        accountContent.classList.remove('hidden');
    }
}

window.editTeacher = (id) => {
    const teacher = currentTeachers.find(t => t.id === id);
    if (teacher) {
        openTeacherModal(teacher);
    }
};

window.deleteTeacher = async (id) => {
    if (!confirm('Are you sure you want to delete this teacher?')) return;

    const { error } = await supabase.from('teachers').delete().eq('id', id);
    if (error) {
        alert('Error deleting teacher: ' + error.message);
    } else {
        closeTeacherProfile();
        fetchTeachers();
    }
};

window.toggleTeacherStatus = async () => {
    const id = document.getElementById('profileTeacherId').value;
    const teacher = currentTeachers.find(t => t.id === id);
    if (!teacher) return;

    const newStatus = !teacher.is_active;
    const action = newStatus ? 'activate' : 'deactivate';

    if (!confirm(`Are you sure you want to ${action} this teacher?`)) return;

    try {
        const { error } = await supabase
            .from('teachers')
            .update({ is_active: newStatus })
            .eq('id', id);

        if (error) throw error;

        // Update local state
        teacher.is_active = newStatus;

        // Update UI
        const statusEl = document.getElementById('teacherProfileStatus');
        const toggleText = document.getElementById('toggleStatusText');

        if (newStatus) {
            statusEl.textContent = 'Active';
            statusEl.className = 'px-2.5 py-0.5 rounded-full bg-green-900/50 border border-green-700 text-green-400 text-xs font-medium';
            toggleText.textContent = 'Deactivate';
        } else {
            statusEl.textContent = 'Inactive';
            statusEl.className = 'px-2.5 py-0.5 rounded-full bg-red-900/50 border border-red-700 text-red-400 text-xs font-medium';
            toggleText.textContent = 'Activate';
        }

        fetchTeachers(); // Refresh list
        alert(`Teacher ${action}d successfully.`);

    } catch (err) {
        console.error('Error updating status:', err);
        alert('Failed to update status: ' + err.message);
    }
};

// Helper to generate next employee ID
async function getNextEmployeeId(count = 1) {
    try {
        // Get the latest employee ID from database
        const { data, error } = await supabase
            .from('teachers')
            .select('employee_id')
            .order('created_at', { ascending: false })
            .limit(1);

        let nextSerial = 1;

        if (!error && data && data.length > 0) {
            const lastId = data[0].employee_id;
            // Expected format: EMP-XXXX
            const match = lastId.match(/EMP-(\d+)/);
            if (match) {
                nextSerial = parseInt(match[1]) + 1;
            }
        }

        if (count === 1) {
            return `EMP-${nextSerial.toString().padStart(3, '0')}`;
        }

        const ids = [];
        for (let i = 0; i < count; i++) {
            ids.push(`EMP-${(nextSerial + i).toString().padStart(3, '0')}`);
        }
        return ids;
    } catch (err) {
        console.error('Error generating employee ID:', err);
        // Fallback
        return `EMP-${Date.now().toString().slice(-4)}`;
    }
}

function openTeacherModal(teacher = null) {
    const modal = document.getElementById('teacherModal');
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    const content = modal.querySelector('div');
    const title = document.getElementById('teacherModalTitle');
    const form = document.getElementById('teacherForm');
    const employeeIdInput = document.getElementById('employeeId');

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    void modal.offsetWidth;
    content.classList.remove('opacity-0', 'scale-95', 'translate-y-4');
    content.classList.add('opacity-100', 'scale-100', 'translate-y-0');

    if (teacher) {
        title.textContent = 'Edit Teacher';
        document.getElementById('teacherId').value = teacher.id;
        document.getElementById('teacherName').value = teacher.name || '';
        employeeIdInput.value = teacher.employee_id || '';
        employeeIdInput.readOnly = true; // Cannot change ID during edit
        employeeIdInput.classList.add('bg-gray-700', 'cursor-not-allowed');

        document.getElementById('teacherEmail').value = teacher.email || '';
        document.getElementById('teacherPhone').value = teacher.phone || '';
        document.getElementById('teacherAddress').value = teacher.address || '';
        document.getElementById('teacherQualification').value = teacher.qualification || '';
        document.getElementById('teacherDoj').value = teacher.date_of_joining || '';
        document.getElementById('teacherSubjects').value = (teacher.subjects || []).join(', ');
    } else {
        title.textContent = 'Add New Teacher';
        form.reset();
        document.getElementById('teacherId').value = '';

        // Auto-generate Employee ID
        employeeIdInput.value = 'Generating...';
        employeeIdInput.readOnly = true;
        employeeIdInput.classList.add('bg-gray-700', 'cursor-not-allowed');

        getNextEmployeeId().then(id => {
            if (document.getElementById('teacherId').value === '') { // Only if still in add mode
                employeeIdInput.value = id;
            }
        });
    }
}

function closeTeacherModal() {
    const modal = document.getElementById('teacherModal');
    const content = modal.querySelector('div');
    const employeeIdInput = document.getElementById('employeeId');

    content.classList.remove('opacity-100', 'scale-100', 'translate-y-0');
    content.classList.add('opacity-0', 'scale-95', 'translate-y-4');

    // Reset input style
    if (employeeIdInput) {
        employeeIdInput.classList.remove('bg-gray-700', 'cursor-not-allowed');
        employeeIdInput.readOnly = false;
    }

    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
}

function closeTeacherProfile() {
    const modal = document.getElementById('teacherProfileModal');
    const content = modal.querySelector('div');

    content.classList.remove('opacity-100', 'scale-100', 'translate-y-0');
    content.classList.add('opacity-0', 'scale-95', 'translate-y-4');

    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
}

async function handleTeacherFormSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('teacherId').value;
    const subjectsStr = document.getElementById('teacherSubjects').value;
    const subjects = subjectsStr.split(',').map(s => s.trim()).filter(s => s);

    const teacherData = {
        name: document.getElementById('teacherName').value.trim(),
        employee_id: document.getElementById('employeeId').value.trim(),
        email: document.getElementById('teacherEmail').value.trim() || null,
        phone: document.getElementById('teacherPhone').value.trim() || null,
        address: document.getElementById('teacherAddress').value.trim() || null,
        qualification: document.getElementById('teacherQualification').value.trim() || null,
        date_of_birth: document.getElementById('teacherDOB').value || null,
        date_of_joining: document.getElementById('teacherDoj').value || null,
        subjects: subjects
    };

    const saveBtn = e.target.querySelector('button[type="submit"]');
    const originalBtnText = saveBtn.textContent;
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    try {
        let result;
        if (id) {
            result = await supabase.from('teachers').update(teacherData).eq('id', id).select();
        } else {
            result = await supabase.from('teachers').insert([teacherData]).select();
        }

        if (result.error) throw result.error;

        // AUTH SYNC: Create/Update teacher portal access
        const teacher = result.data[0];
        if (teacher && teacher.date_of_birth) {
            await syncTeacherAuth(teacher);
        }

        closeTeacherModal();
        fetchTeachers();
    } catch (error) {
        console.error('Error saving teacher:', error);
        alert('Error saving teacher: ' + error.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.textContent = originalBtnText;
    }
}

async function syncTeacherAuth(teacher) {
    try {
        const password = teacher.date_of_birth.split('-').reverse().join('');
        const loginEmail = `${teacher.employee_id.toLowerCase()}@teacher.suffah.school`;

        const tempClient = window.SupabaseLib.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
        });

        const { data, error } = await tempClient.auth.signUp({
            email: loginEmail,
            password: password,
            options: {
                data: {
                    role: 'teacher',
                    name: teacher.name,
                    employee_id: teacher.employee_id
                }
            }
        });

        if (error && !error.message.includes('already registered')) throw error;

        // Link auth_id back to profile
        if (data && data.user) {
            await supabase.from('teachers').update({ auth_id: data.user.id }).eq('id', teacher.id);
        }

    } catch (err) {
        console.error('Teacher Auth Sync Failed:', err);
    }
}

async function handleTeacherPhotoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const teacherId = document.getElementById('profileTeacherId').value;
    if (!teacherId) return;

    const img = document.getElementById('teacherProfilePhoto');
    img.style.opacity = '0.5';

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `teacher-${teacherId}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('teacher-photos')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('teacher-photos')
            .getPublicUrl(filePath);

        const { error: updateError } = await supabase
            .from('teachers')
            .update({ photo_url: publicUrl })
            .eq('id', teacherId);

        if (updateError) throw updateError;

        img.src = publicUrl;
        img.classList.remove('hidden');
        document.getElementById('teacherProfilePhotoPlaceholder').classList.add('hidden');

        const teacher = currentTeachers.find(t => t.id === teacherId);
        if (teacher) teacher.photo_url = publicUrl;

        alert('Profile photo updated!');

    } catch (err) {
        console.error('Error uploading photo:', err);
        alert('Error uploading photo: ' + err.message);
    } finally {
        img.style.opacity = '1';
    }
}

function handleTeacherSearch(e) {
    const term = e.target.value.toLowerCase();
    const filtered = currentTeachers.filter(t =>
        t.name.toLowerCase().includes(term) ||
        t.employee_id.toLowerCase().includes(term) ||
        (t.email && t.email.toLowerCase().includes(term))
    );
    renderTeacherTable(filtered);
}

// Bulk Upload Functions
function openBulkTeacherModal() {
    const modal = document.getElementById('bulkTeacherModal');
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    const content = modal.querySelector('div');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    void modal.offsetWidth;
    content.classList.remove('opacity-0', 'scale-95', 'translate-y-4');
    content.classList.add('opacity-100', 'scale-100', 'translate-y-0');

    // Reset
    parsedTeachers = [];
    document.getElementById('teacherExcelFileInput').value = '';
    document.getElementById('selectedTeacherFileName').textContent = '';
    document.getElementById('teacherUploadResults').classList.add('hidden');
    document.getElementById('uploadTeachersBtn').disabled = true;
}

function closeBulkTeacherModal() {
    const modal = document.getElementById('bulkTeacherModal');
    const content = modal.querySelector('div');

    content.classList.remove('opacity-100', 'scale-100', 'translate-y-0');
    content.classList.add('opacity-0', 'scale-95', 'translate-y-4');

    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
}

// Download Excel Template
async function downloadTeacherTemplate() {
    try {
        await window.loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
        const wb = XLSX.utils.book_new();
        const templateData = [
            ['Name', 'Email', 'Phone', 'Address', 'Qualification', 'Subjects', 'Date of Joining'],
            ['John Doe', 'john@school.com', '1234567890', '123 Main St', 'M.Ed', 'Mathematics, Physics', '2024-01-15']
        ];

        const ws = XLSX.utils.aoa_to_sheet(templateData);
        ws['!cols'] = [
            { wch: 20 }, { wch: 25 }, { wch: 15 },
            { wch: 30 }, { wch: 15 }, { wch: 25 }, { wch: 15 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Teachers');
        XLSX.writeFile(wb, 'Teacher_Bulk_Upload_Template.xlsx');
    } catch (err) {
        alert('Failed to load Excel library. Please check your connection.');
    }
}

// Handle File Selection
async function handleTeacherFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
        await window.loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');

        document.getElementById('selectedTeacherFileName').textContent = `Selected: ${file.name}`;

        const reader = new FileReader();
        reader.onload = function (event) {
            try {
                const data = new Uint8Array(event.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                const { valid, teachers, errors } = validateTeacherExcelData(jsonData);

                if (valid) {
                    parsedTeachers = teachers;
                    document.getElementById('uploadTeachersBtn').disabled = false;
                    showTeacherUploadSummary(teachers, errors);
                } else {
                    parsedTeachers = [];
                    document.getElementById('uploadTeachersBtn').disabled = true;
                    showTeacherUploadSummary([], errors);
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

function validateTeacherExcelData(jsonData) {
    const teachers = [];
    const errors = [];

    jsonData.forEach((row, index) => {
        const rowNum = index + 2;
        const rowErrors = [];

        if (!row['Name'] || row['Name'].toString().trim() === '') {
            rowErrors.push(`Row ${rowNum}: Name is required`);
        }

        // Employee ID is auto-generated, so we don't validate it from Excel

        if (rowErrors.length === 0) {
            const subjectsStr = row['Subjects'] ? row['Subjects'].toString() : '';
            const subjects = subjectsStr.split(',').map(s => s.trim()).filter(s => s);

            teachers.push({
                name: row['Name'].toString().trim(),
                // employee_id: Generated during upload
                email: row['Email'] ? row['Email'].toString().trim() : null,
                phone: row['Phone'] ? row['Phone'].toString().trim() : null,
                address: row['Address'] ? row['Address'].toString().trim() : null,
                qualification: row['Qualification'] ? row['Qualification'].toString().trim() : null,
                subjects: subjects,
                date_of_joining: row['Date of Joining'] ? row['Date of Joining'].toString().trim() : null,
                is_active: true
            });
        } else {
            errors.push(...rowErrors);
        }
    });

    return {
        valid: errors.length === 0 && teachers.length > 0,
        teachers,
        errors
    };
}

function showTeacherUploadSummary(teachers, errors) {
    const resultsDiv = document.getElementById('teacherUploadResults');
    const summaryDiv = document.getElementById('teacherUploadSummary');

    resultsDiv.classList.remove('hidden');

    let html = '';
    if (teachers.length > 0) {
        html += `<div class="text-green-400 font-semibold mb-2">✓ ${teachers.length} teacher(s) ready to upload</div>`;
        html += `<div class="text-xs text-gray-500 mb-2">Employee IDs will be auto-generated starting from the next available ID.</div>`;
    }

    if (errors.length > 0) {
        html += `<div class="text-red-400 font-semibold mb-2">✗ ${errors.length} error(s) found:</div>`;
        html += '<ul class="list-disc list-inside text-red-400 text-xs space-y-1">';
        errors.forEach(err => {
            html += `<li>${err}</li>`;
        });
        html += '</ul>';
    }

    summaryDiv.innerHTML = html;
}

async function handleBulkTeacherUpload() {
    if (parsedTeachers.length === 0) return;

    const uploadBtn = document.getElementById('uploadTeachersBtn');
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Generating IDs & Uploading...';

    try {
        // Generate IDs for all teachers
        const ids = await getNextEmployeeId(parsedTeachers.length);
        const teachersWithIds = parsedTeachers.map((t, i) => ({
            ...t,
            employee_id: Array.isArray(ids) ? ids[i] : ids // Handle single vs multiple return
        }));

        const { data, error } = await supabase.from('teachers').insert(teachersWithIds);

        if (error) throw error;

        alert(`Success! ${parsedTeachers.length} teacher(s) added successfully.`);
        closeBulkTeacherModal();
        fetchTeachers();

    } catch (error) {
        console.error('Bulk upload error:', error);
        alert('Error uploading teachers: ' + error.message);
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Upload Teachers';
    }
}
