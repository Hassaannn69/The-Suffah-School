// Use global Supabase client for production compatibility
const supabase = window.supabase || (() => {
    console.error('Supabase client not found on window object');
    throw new Error('Supabase client not initialized');
})();

const toast = window.toast || { success: (m) => alert(m), error: (m) => alert(m), warning: (m) => alert(m) };

// State: list vs detail view; selected class for detail
let state = {
    viewMode: 'list',
    selectedClassId: null,
    selectedClassName: null,
    activeTab: 'overview',
    currentTeacherId: null,
    isTeacherReadOnly: false
};

let classesListData = [];
let listStats = { totalStudents: 0, totalSections: 0 };
let classStudentCountMap = {};
let listSearch = '';
let listPage = 1;
const listPerPage = 10;

let studentsTabList = [];
let studentsTabPage = 1;
let studentsTabPerPage = 10;
let studentsTabSearch = '';
let studentsTabSectionFilter = '';
let studentsTabStatusFilter = '';
let studentsTabSelectedIds = new Set();

export async function render(container) {
    // Shared listener for global data changes
    if (!window.hasClassesDataListener) {
        window.addEventListener('appDataChange', async (e) => {
            if (e.detail?.type === 'student' || e.detail?.type === 'class') {
                console.log(`[Classes] Refreshing due to change: ${e.detail?.type}`);
                if (state.viewMode === 'detail') {
                    const main = document.getElementById('mainContent');
                    if (main) await renderDetailView(main);
                } else {
                    await fetchClasses();
                }
            }
        });
        window.hasClassesDataListener = true;
    }

    try {
        const savedClassId = sessionStorage.getItem('suffah_class_detail_id');
        const savedClassName = sessionStorage.getItem('suffah_class_detail_name');
        if (savedClassId && savedClassName) {
            state.viewMode = 'detail';
            state.selectedClassId = savedClassId;
            state.selectedClassName = savedClassName;
        } else {
            state.viewMode = 'list';
            state.selectedClassId = null;
            state.selectedClassName = null;
        }
    } catch (_) { }
    await resolveCurrentUserContext();
    if (state.viewMode === 'detail') {
        await renderDetailView(container);
    } else {
        renderListView(container);
    }
}

async function resolveCurrentUserContext() {
    const role = await getCurrentRole();
    state.isTeacherReadOnly = role === 'teacher';
    if (role === 'teacher') {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
            const { data: row } = await supabase.from('teachers').select('id').eq('auth_id', user.id).maybeSingle();
            state.currentTeacherId = row?.id || null;
        }
    }
}

async function getCurrentRole() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.user_metadata?.role || (document.getElementById('userRole')?.textContent?.trim().toLowerCase()) || 'admin';
}

async function renderListView(container) {
    container.innerHTML = `
        <div class="app-page-tile bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors duration-200">
            <div class="app-bar p-4 border-b border-gray-200 dark:border-gray-800">
                <nav class="flex items-center gap-2 text-sm">
                    <button type="button" id="breadcrumbHome" class="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium">Home</button>
                    <span class="text-gray-400 dark:text-gray-500">/</span>
                    <span class="text-gray-900 dark:text-white font-medium">Classes</span>
                </nav>
            </div>
            <div class="app-bar p-6 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Classes Management</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and organize all class sections, streams, and academic years.</p>
                </div>
                <button id="addClassBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                    Add New Class
                </button>
            </div>
            <div id="classesListContent" class="p-6">
                <div class="text-center py-10 text-gray-500 dark:text-gray-400">Loading classes...</div>
            </div>
        </div>
        ${getClassModalHtml()}
        ${getEditClassModalHtml()}
    `;
    document.getElementById('breadcrumbHome').addEventListener('click', () => { if (window.loadModule) window.loadModule('dashboard'); });
    document.getElementById('addClassBtn').addEventListener('click', openModal);
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('classForm').addEventListener('submit', handleFormSubmit);
    bindAddClassModal();
    bindEditClassModal();
    await fetchClasses();
}

function getClassModalHtml() {
    const currentYear = new Date().getFullYear();
    const yearOptions = [0, 1, 2, 3, 4].map(i => `${currentYear + i}-${currentYear + i + 1}`);
    return `
        <div id="classModal" class="modal-overlay fixed inset-0 bg-black/50 hidden items-center justify-center z-50 backdrop-blur-sm transition-opacity duration-300 p-4">
            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden border border-gray-200 dark:border-gray-800 transform transition-all scale-95 opacity-0 max-h-[90vh] flex flex-col">
                <div class="p-6 pb-2 flex-shrink-0">
                    <div class="flex justify-between items-start gap-4">
                        <div>
                            <h3 class="text-xl font-bold text-gray-900 dark:text-white">Add New Class</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Create a new class for the academic schedule.</p>
                        </div>
                        <button type="button" id="closeModalBtn" class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>
                <form id="classForm" class="flex flex-col flex-1 min-h-0" autocomplete="off">
                    <div class="px-6 py-4 space-y-5 overflow-y-auto flex-1">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Class Name <span class="text-red-500">*</span></label>
                            <div class="relative">
                                <input type="text" id="className" placeholder="e.g. Grade 10 - Mercury" autocomplete="off" class="add-class-input w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors" data-validate="required">
                                <span id="classNameError" class="hidden absolute right-3 top-1/2 -translate-y-1/2 text-red-500" aria-hidden="true">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </span>
                            </div>
                            <p id="classNameErrorText" class="hidden mt-1 text-sm text-red-500 dark:text-red-400">Class Name is required.</p>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Academic Year <span class="text-red-500">*</span></label>
                            <select id="academicYear" class="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white text-sm">
                                ${yearOptions.map(y => `<option value="${y}">${y}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stream</label>
                            <div class="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-0.5">
                                <button type="button" class="add-class-stream flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors bg-indigo-600 text-white" data-stream="General">General</button>
                                <button type="button" class="add-class-stream flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700" data-stream="Science">Science</button>
                                <button type="button" class="add-class-stream flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700" data-stream="Arts">Arts</button>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Class Status</label>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Enable or disable this class for enrollment</p>
                            <div class="flex items-center justify-between">
                                <span id="classStatusLabel" class="text-sm font-medium text-gray-900 dark:text-white">Active</span>
                                <button type="button" id="classStatusToggle" class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900" role="switch" aria-checked="true">
                                    <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform translate-x-5"></span>
                                </button>
                            </div>
                        </div>
                        <div class="border-t border-gray-200 dark:border-gray-700 pt-5">
                            <button type="button" id="advancedConfigToggle" class="w-full flex items-center justify-between text-sm font-medium text-gray-900 dark:text-white hover:opacity-90">
                                <span class="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    Advanced Configuration
                                </span>
                                <svg id="advancedConfigChevron" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" /></svg>
                            </button>
                            <div id="advancedConfigPanel" class="mt-4 space-y-4 hidden">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Default Sections</label>
                                    <div id="sectionPillsContainer" class="flex flex-wrap gap-2 min-h-[42px] px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
                                        <input type="text" id="sectionPillInput" placeholder="Type and press Enter..." autocomplete="off" class="flex-1 min-w-[120px] bg-transparent border-0 py-1 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm outline-none">
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Default Class Teacher (Optional)</label>
                                    <div class="relative">
                                        <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                        <input type="text" id="defaultTeacherSearch" placeholder="Search teacher..." autocomplete="off" class="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                                        <input type="hidden" id="defaultTeacherId" value="">
                                        <div id="defaultTeacherDropdown" class="hidden absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto"></div>
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Max Capacity</label>
                                    <div class="flex items-center gap-2">
                                        <button type="button" id="capacityMinus" class="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">−</button>
                                        <input type="number" id="maxCapacity" value="30" min="1" max="999" class="w-20 text-center px-2 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm">
                                        <button type="button" id="capacityPlus" class="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">+</button>
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Internal Notes</label>
                                    <textarea id="internalNotes" rows="3" placeholder="Add any specific details or requirements for this class..." class="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm resize-y outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="p-6 pt-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0 space-y-4">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="createAnotherClass" class="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-800">
                            <span class="text-sm text-gray-700 dark:text-gray-300">Create another class</span>
                        </label>
                        <div class="flex justify-end gap-3">
                            <button type="button" id="cancelBtn" class="px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                            <button type="submit" id="saveClassBtn" class="px-4 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                                Save Class
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `;
}

function getEditClassModalHtml() {
    const currentYear = new Date().getFullYear();
    const yearOptions = [0, 1, 2, 3, 4].map(i => `${currentYear + i}-${currentYear + i + 1}`);
    return `
        <div id="editClassModal" class="modal-overlay fixed inset-0 bg-black/50 hidden items-center justify-center z-50 backdrop-blur-sm transition-opacity duration-300 p-4">
            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden border border-gray-200 dark:border-gray-800 transform transition-all scale-95 opacity-0 max-h-[90vh] flex flex-col">
                <div class="p-6 pb-2 flex-shrink-0">
                    <div class="flex justify-between items-start gap-4">
                        <div>
                            <h3 class="text-xl font-bold text-gray-900 dark:text-white">Edit Class</h3>
                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Update class details, stream, and settings.</p>
                        </div>
                        <button type="button" id="closeEditClassModalBtn" class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>
                <form id="editClassForm" class="flex flex-col flex-1 min-h-0" autocomplete="off">
                    <input type="hidden" id="editClassId">
                    <div class="px-6 py-4 space-y-5 overflow-y-auto flex-1">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Class Name <span class="text-red-500">*</span></label>
                            <input type="text" id="editClassName" required placeholder="e.g. Grade 10 - Mercury" autocomplete="off" class="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Academic Year</label>
                            <select id="editAcademicYear" class="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white text-sm">
                                ${yearOptions.map(y => `<option value="${y}">${y}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stream</label>
                            <div class="flex rounded-lg overflow-hidden border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-0.5">
                                <button type="button" class="edit-class-stream flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors bg-indigo-600 text-white" data-stream="General">General</button>
                                <button type="button" class="edit-class-stream flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700" data-stream="Science">Science</button>
                                <button type="button" class="edit-class-stream flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700" data-stream="Arts">Arts</button>
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Class Status</label>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Enable or disable this class for enrollment</p>
                            <div class="flex items-center justify-between">
                                <span id="editClassStatusLabel" class="text-sm font-medium text-gray-900 dark:text-white">Active</span>
                                <button type="button" id="editClassStatusToggle" class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900" role="switch" aria-checked="true">
                                    <span class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform translate-x-5"></span>
                                </button>
                            </div>
                        </div>
                        <div class="border-t border-gray-200 dark:border-gray-700 pt-5">
                            <button type="button" id="editAdvancedConfigToggle" class="w-full flex items-center justify-between text-sm font-medium text-gray-900 dark:text-white hover:opacity-90">
                                <span class="flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    Advanced Configuration
                                </span>
                                <svg id="editAdvancedConfigChevron" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" /></svg>
                            </button>
                            <div id="editAdvancedConfigPanel" class="mt-4 space-y-4 hidden">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Default Sections</label>
                                    <div id="editSectionPillsContainer" class="flex flex-wrap gap-2 min-h-[42px] px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
                                        <input type="text" id="editSectionPillInput" placeholder="Type and press Enter..." autocomplete="off" class="flex-1 min-w-[120px] bg-transparent border-0 py-1 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm outline-none">
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Default Class Teacher (Optional)</label>
                                    <div class="relative">
                                        <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                        <input type="text" id="editDefaultTeacherSearch" placeholder="Search teacher..." autocomplete="off" class="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                                        <input type="hidden" id="editDefaultTeacherId" value="">
                                        <div id="editDefaultTeacherDropdown" class="hidden absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto"></div>
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Max Capacity</label>
                                    <div class="flex items-center gap-2">
                                        <button type="button" id="editCapacityMinus" class="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">−</button>
                                        <input type="number" id="editMaxCapacity" value="30" min="1" max="999" class="w-20 text-center px-2 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm">
                                        <button type="button" id="editCapacityPlus" class="flex items-center justify-center w-10 h-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">+</button>
                                    </div>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Internal Notes</label>
                                    <textarea id="editInternalNotes" rows="3" placeholder="Add any specific details or requirements for this class..." autocomplete="off" class="w-full px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm resize-y outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="p-6 pt-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
                        <div class="flex justify-end gap-3">
                            <button type="button" id="editClassCancelBtn" class="px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                            <button type="submit" class="px-4 py-2.5 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                                Save
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `;
}

async function openEditClassModal(classId) {
    const modal = document.getElementById('editClassModal');
    if (!modal) return;
    const { data: row } = await supabase.from('classes').select('*').eq('id', classId).single();
    if (!row) { toast.error('Class not found.'); return; }

    document.getElementById('editClassId').value = classId;
    document.getElementById('editClassName').value = row.class_name || '';
    const academicYear = row.academic_year || '';
    const editAcademicYearEl = document.getElementById('editAcademicYear');
    if (editAcademicYearEl) {
        editAcademicYearEl.value = academicYear;
        if (!editAcademicYearEl.querySelector(`option[value="${academicYear}"]`)) {
            const opt = document.createElement('option');
            opt.value = academicYear;
            opt.textContent = academicYear || '—';
            editAcademicYearEl.appendChild(opt);
            editAcademicYearEl.value = academicYear;
        }
    }
    const stream = (row.stream || 'General');
    document.querySelectorAll('.edit-class-stream').forEach(btn => {
        const s = btn.getAttribute('data-stream');
        btn.classList.toggle('bg-indigo-600', s === stream);
        btn.classList.toggle('text-white', s === stream);
        btn.classList.toggle('text-gray-600', s !== stream);
        btn.classList.toggle('dark:text-gray-400', s !== stream);
    });
    const isActive = row.is_active !== false;
    const toggle = document.getElementById('editClassStatusToggle');
    const statusLabel = document.getElementById('editClassStatusLabel');
    if (toggle) {
        toggle.setAttribute('aria-checked', isActive ? 'true' : 'false');
        const thumb = toggle.querySelector('span');
        if (isActive) {
            toggle.classList.remove('bg-gray-200', 'dark:bg-gray-700'); toggle.classList.add('bg-indigo-600');
            thumb.classList.add('translate-x-5'); thumb.classList.remove('translate-x-0');
        } else {
            toggle.classList.add('bg-gray-200', 'dark:bg-gray-700'); toggle.classList.remove('bg-indigo-600');
            thumb.classList.remove('translate-x-5'); thumb.classList.add('translate-x-0');
        }
        if (statusLabel) statusLabel.textContent = isActive ? 'Active' : 'Inactive';
    }
    const editSectionPillsContainer = document.getElementById('editSectionPillsContainer');
    if (editSectionPillsContainer) {
        editSectionPillsContainer.querySelectorAll('.edit-section-pill').forEach(el => el.remove());
        const sections = (row.sections && Array.isArray(row.sections)) ? row.sections : [];
        sections.forEach(v => {
            const label = (v || '').toLowerCase().startsWith('section') ? v : 'Section ' + (v || '');
            const pill = document.createElement('span');
            pill.className = 'edit-section-pill inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400';
            pill.setAttribute('data-section', v || '');
            pill.innerHTML = `${escapeHtml(label)} <button type="button" class="edit-pill-remove ml-0.5 rounded-full p-0.5 hover:bg-indigo-200 dark:hover:bg-indigo-800/50" aria-label="Remove">×</button>`;
            pill.querySelector('.edit-pill-remove')?.addEventListener('click', () => pill.remove());
            editSectionPillsContainer.insertBefore(pill, document.getElementById('editSectionPillInput'));
        });
    }
    document.getElementById('editSectionPillInput').value = '';
    document.getElementById('editDefaultTeacherId').value = row.default_teacher_id || '';
    document.getElementById('editDefaultTeacherSearch').value = '';
    if (row.default_teacher_id) {
        const { data: t } = await supabase.from('teachers').select('name').eq('id', row.default_teacher_id).single();
        if (t) document.getElementById('editDefaultTeacherSearch').value = t.name || '';
    }
    document.getElementById('editMaxCapacity').value = row.max_capacity != null ? row.max_capacity : 30;
    document.getElementById('editInternalNotes').value = row.internal_notes || '';
    document.getElementById('editAdvancedConfigPanel').classList.add('hidden');
    document.getElementById('editAdvancedConfigChevron').classList.remove('rotate-180');

    if (modal.parentElement !== document.body) document.body.appendChild(modal);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    const panel = modal.querySelector('div.bg-white');
    if (panel) {
        panel.classList.remove('scale-95', 'opacity-0');
        panel.classList.add('scale-100', 'opacity-100');
    }

    const closeEdit = () => {
        if (panel) {
            panel.classList.remove('scale-100', 'opacity-100');
            panel.classList.add('scale-95', 'opacity-0');
        }
        setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 200);
    };
    document.getElementById('closeEditClassModalBtn').onclick = closeEdit;
    document.getElementById('editClassCancelBtn').onclick = closeEdit;

    document.getElementById('editClassForm').onsubmit = async (e) => {
        e.preventDefault();
        const id = document.getElementById('editClassId').value;
        const class_name = document.getElementById('editClassName').value.trim();
        if (!class_name) { toast.error('Class name is required.'); return; }
        const pillEls = document.getElementById('editSectionPillsContainer')?.querySelectorAll('.edit-section-pill') || [];
        const sections = Array.from(pillEls).map(p => p.getAttribute('data-section')).filter(Boolean);
        const finalSections = sections.length ? sections : ['A'];
        const academic_year = document.getElementById('editAcademicYear').value || null;
        const streamBtn = document.querySelector('.edit-class-stream.bg-indigo-600');
        const streamVal = streamBtn ? streamBtn.getAttribute('data-stream') : 'General';
        const isActiveVal = document.getElementById('editClassStatusToggle').getAttribute('aria-checked') === 'true';
        const default_teacher_id = (document.getElementById('editDefaultTeacherId').value || '').trim() || null;
        const max_capacity = parseInt(document.getElementById('editMaxCapacity').value, 10) || 30;
        const internal_notes = (document.getElementById('editInternalNotes').value || '').trim() || null;

        const minimalPayload = { class_name, sections: finalSections };
        const fullPayload = { ...minimalPayload };
        if (academic_year) fullPayload.academic_year = academic_year;
        fullPayload.stream = streamVal;
        fullPayload.is_active = isActiveVal;
        fullPayload.max_capacity = max_capacity;
        if (internal_notes !== null) fullPayload.internal_notes = internal_notes;
        fullPayload.default_teacher_id = default_teacher_id || null;

        const { error } = await supabase.from('classes').update(fullPayload).eq('id', id);
        if (error) {
            if (error.message.includes('column') || error.code === '42703') {
                const { error: err2 } = await supabase.from('classes').update(minimalPayload).eq('id', id);
                if (err2) {
                    toast.error(err2.message);
                    return;
                }
                toast.success('Class updated.');
                closeEdit();
                await fetchClasses();
                if (state.viewMode === 'detail' && state.selectedClassId === id) {
                    state.selectedClassName = class_name;
                    const container = document.getElementById('mainContent');
                    if (container) await renderDetailView(container);
                }
                return;
            }
            toast.error(error.message);
            return;
        }
        await supabase.from('teacher_assignments').delete().eq('class_id', id).eq('role', 'class_teacher');
        if (default_teacher_id) {
            await supabase.from('teacher_assignments').insert([{ teacher_id: default_teacher_id, class_id: id, section: finalSections[0] || '', subject: '', role: 'class_teacher', is_active: true }]);
        }
        toast.success('Class updated.');
        closeEdit();
        await fetchClasses();
        if (window.broadcastDataChange) window.broadcastDataChange('class');
        if (state.viewMode === 'detail' && state.selectedClassId === id) {
            state.selectedClassName = class_name;
            const container = document.getElementById('mainContent');
            if (container) await renderDetailView(container);
        }
    };
}

function bindEditClassModal() {
    const modal = document.getElementById('editClassModal');
    if (!modal) return;

    document.querySelectorAll('.edit-class-stream').forEach(btn => {
        btn.addEventListener('click', function () {
            const stream = this.getAttribute('data-stream');
            document.querySelectorAll('.edit-class-stream').forEach(b => {
                const s = b.getAttribute('data-stream');
                b.classList.toggle('bg-indigo-600', s === stream);
                b.classList.toggle('text-white', s === stream);
                b.classList.toggle('text-gray-600', s !== stream);
                b.classList.toggle('dark:text-gray-400', s !== stream);
            });
        });
    });
    document.getElementById('editClassStatusToggle')?.addEventListener('click', function () {
        const on = this.getAttribute('aria-checked') !== 'true';
        this.setAttribute('aria-checked', on ? 'true' : 'false');
        const thumb = this.querySelector('span');
        const label = document.getElementById('editClassStatusLabel');
        if (on) {
            this.classList.remove('bg-gray-200', 'dark:bg-gray-700'); this.classList.add('bg-indigo-600');
            thumb.classList.add('translate-x-5'); thumb.classList.remove('translate-x-0');
            if (label) label.textContent = 'Active';
        } else {
            this.classList.add('bg-gray-200', 'dark:bg-gray-700'); this.classList.remove('bg-indigo-600');
            thumb.classList.remove('translate-x-5'); thumb.classList.add('translate-x-0');
            if (label) label.textContent = 'Inactive';
        }
    });
    document.getElementById('editAdvancedConfigToggle')?.addEventListener('click', () => {
        document.getElementById('editAdvancedConfigPanel').classList.toggle('hidden');
        document.getElementById('editAdvancedConfigChevron').classList.toggle('rotate-180');
    });
    const editSectionPillInput = document.getElementById('editSectionPillInput');
    const editSectionPillsContainer = document.getElementById('editSectionPillsContainer');
    editSectionPillInput?.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const raw = editSectionPillInput.value.trim();
        const v = raw.replace(/^Section\s+/i, '') || raw;
        if (!v) return;
        const label = (v || '').toLowerCase().startsWith('section') ? v : 'Section ' + v;
        const pill = document.createElement('span');
        pill.className = 'edit-section-pill inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400';
        pill.setAttribute('data-section', v);
        pill.innerHTML = `${escapeHtml(label)} <button type="button" class="edit-pill-remove ml-0.5 rounded-full p-0.5 hover:bg-indigo-200 dark:hover:bg-indigo-800/50" aria-label="Remove">×</button>`;
        pill.querySelector('.edit-pill-remove')?.addEventListener('click', () => pill.remove());
        editSectionPillsContainer?.insertBefore(pill, editSectionPillInput);
        editSectionPillInput.value = '';
    });
    let editTeachersCache = [];
    const editDefaultTeacherSearch = document.getElementById('editDefaultTeacherSearch');
    const editDefaultTeacherId = document.getElementById('editDefaultTeacherId');
    const editDefaultTeacherDropdown = document.getElementById('editDefaultTeacherDropdown');
    async function refreshEditTeacherDropdown() {
        if (editTeachersCache.length === 0) {
            const { data } = await supabase.from('teachers').select('id, name').order('name');
            editTeachersCache = data || [];
        }
        const q = (editDefaultTeacherSearch?.value || '').trim().toLowerCase();
        const list = q ? editTeachersCache.filter(t => (t.name || '').toLowerCase().includes(q)) : editTeachersCache;
        if (!editDefaultTeacherDropdown) return;
        editDefaultTeacherDropdown.innerHTML = list.length ? list.map(t => `<button type="button" class="edit-teacher-option w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" data-id="${t.id}" data-name="${escapeHtml(t.name || '')}">${escapeHtml(t.name || '')}</button>`).join('') : '<p class="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">No teachers found</p>';
        editDefaultTeacherDropdown.classList.remove('hidden');
    }
    editDefaultTeacherSearch?.addEventListener('focus', refreshEditTeacherDropdown);
    editDefaultTeacherSearch?.addEventListener('input', refreshEditTeacherDropdown);
    editDefaultTeacherDropdown?.addEventListener('click', (e) => {
        const btn = e.target.closest('.edit-teacher-option');
        if (!btn) return;
        editDefaultTeacherId.value = btn.getAttribute('data-id') || '';
        editDefaultTeacherSearch.value = btn.getAttribute('data-name') || '';
        editDefaultTeacherDropdown.classList.add('hidden');
    });
    document.getElementById('editCapacityMinus')?.addEventListener('click', () => {
        const el = document.getElementById('editMaxCapacity');
        el.value = Math.max(1, parseInt(el.value, 10) - 1);
    });
    document.getElementById('editCapacityPlus')?.addEventListener('click', () => {
        const el = document.getElementById('editMaxCapacity');
        el.value = Math.min(999, parseInt(el.value, 10) + 1);
    });
}


async function fetchClasses() {
    const content = document.getElementById('classesListContent');
    if (!content) return;

    let query = supabase.from('classes').select('*').order('class_name', { ascending: true });
    if (state.isTeacherReadOnly && state.currentTeacherId) {
        const { data: assigned } = await supabase.from('teacher_assignments').select('class_id').eq('teacher_id', state.currentTeacherId);
        const classIds = [...new Set((assigned || []).map(a => a.class_id))];
        if (classIds.length === 0) {
            content.innerHTML = `<div class="text-center py-10 text-gray-500 dark:text-gray-400">You are not assigned to any class.</div>`;
            return;
        }
        query = query.in('id', classIds);
    }

    const { data: classesData, error } = await query;
    if (error) {
        content.innerHTML = `<div class="text-center text-red-500 dark:text-red-400">Error: ${error.message}</div>`;
        return;
    }

    classesListData = classesData || [];
    if (window.sortClassesNatural) window.sortClassesNatural(classesListData, 'class_name');

    const visibleClassNames = classesListData.map(c => c.class_name);
    const { data: studentsData } = await supabase.from('students').select('class, section').in('class', visibleClassNames);
    classStudentCountMap = {};
    const classActualSectionsMap = {};
    let totalStudents = 0;
    (studentsData || []).forEach(s => {
        if (s.class) {
            classStudentCountMap[s.class] = (classStudentCountMap[s.class] || 0) + 1;
            totalStudents++;
            if (s.section) {
                if (!classActualSectionsMap[s.class]) classActualSectionsMap[s.class] = new Set();
                classActualSectionsMap[s.class].add(s.section);
            }
        }
    });
    listStats.totalStudents = totalStudents;

    // Merge defined sections with actual student sections for true count
    listStats.totalSections = classesListData.reduce((acc, c) => {
        const defined = (c.sections && Array.isArray(c.sections)) ? c.sections : [];
        const actual = classActualSectionsMap[c.class_name] || new Set();
        const merged = new Set([...defined, ...actual]);
        return acc + merged.size;
    }, 0);

    const searchLower = listSearch.trim().toLowerCase();
    const filtered = searchLower
        ? classesListData.filter(c => (c.class_name || '').toLowerCase().includes(searchLower))
        : classesListData;
    const totalFiltered = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / listPerPage));
    listPage = Math.min(listPage, totalPages);
    const start = (listPage - 1) * listPerPage;
    const pageRows = filtered.slice(start, start + listPerPage);

    const avgClassSize = classesListData.length ? Math.round(totalStudents / classesListData.length) : 0;

    const summaryCards = `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </div>
                    <div>
                        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Classes</p>
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">${classesListData.length}</p>
                    </div>
                </div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                    <div>
                        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Students</p>
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">${totalStudents}</p>
                    </div>
                </div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                    </div>
                    <div>
                        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Active Sections</p>
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">${listStats.totalSections}</p>
                    </div>
                </div>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                    <div>
                        <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg Class Size</p>
                        <p class="text-2xl font-bold text-gray-900 dark:text-white">${avgClassSize}</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    const toolbar = `
        <div class="flex flex-wrap items-center gap-3 mb-4">
            <div class="relative flex-1 min-w-[200px]">
                <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                <input type="text" id="classesSearchInput" placeholder="Search by class name, stream..." value="${escapeHtml(listSearch)}" autocomplete="off" class="w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm">
            </div>
            <select id="classesFilterStatus" class="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm">
                <option value="">Status: All</option>
                <option value="active">Active</option>
            </select>
            <button type="button" id="classesDownloadBtn" class="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" title="Download">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
        </div>
    `;

    if (pageRows.length === 0) {
        content.innerHTML = summaryCards + toolbar + `
            <div class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
                <div class="p-10 text-center text-gray-500 dark:text-gray-400">No classes match your search. Add a class or clear filters.</div>
            </div>
        `;
        bindListEvents(content);
        return;
    }

    const tableRows = pageRows.map(cls => {
        const strSections = (cls.sections && Array.isArray(cls.sections)) ? cls.sections : [];
        const actualSet = classActualSectionsMap[cls.class_name] || new Set();
        const sections = [...new Set([...strSections, ...actualSet])].sort();
        const studentCount = classStudentCountMap[cls.class_name] || 0;
        const escapedName = escapeHtml(cls.class_name || '');
        const badgeNum = (cls.class_name || '').replace(/[^0-9]/g, '') || (cls.class_name || '').charAt(0);
        const academicYearCell = (cls.academic_year && String(cls.academic_year).trim()) ? escapeHtml(String(cls.academic_year)) : '—';
        const streamCell = (cls.stream && String(cls.stream).trim()) ? escapeHtml(String(cls.stream)) : '—';
        return `
        <tr class="classes-table-row hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer border-b border-gray-200 dark:border-gray-700" data-class-id="${cls.id}" data-class-name="${(cls.class_name || '').replace(/"/g, '&quot;')}">
            <td class="p-4">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold flex items-center justify-center text-sm">${escapeHtml(badgeNum)}</div>
                    <div>
                        <p class="font-medium text-gray-900 dark:text-white">${escapedName}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400"></p>
                    </div>
                </div>
            </td>
            <td class="p-4 text-gray-600 dark:text-gray-400 text-sm">${academicYearCell}</td>
            <td class="p-4 text-gray-600 dark:text-gray-400 text-sm">${streamCell}</td>
            <td class="p-4 text-gray-900 dark:text-white font-medium">${studentCount}</td>
            <td class="p-4">
                <div class="flex flex-wrap gap-1">
                    ${sections.slice(0, 4).map(sec => `<span class="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">${escapeHtml(sec)}</span>`).join('')}
                    ${sections.length > 4 ? `<span class="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">+${sections.length - 4}</span>` : ''}
                </div>
            </td>
            <td class="p-4">
                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span> Active
                </span>
            </td>
            <td class="p-4 text-right">
                <div class="relative inline-block">
                    <button type="button" class="classes-kebab p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700" data-class-id="${cls.id}" data-class-name="${(cls.class_name || '').replace(/"/g, '&quot;')}" aria-label="Actions">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>
                    </button>
                    <div id="kebab-${cls.id}" class="hidden absolute right-0 mt-1 w-40 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
                        <button type="button" class="classes-action-view w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700" data-class-id="${cls.id}" data-class-name="${(cls.class_name || '').replace(/"/g, '&quot;')}">View</button>
                        ${state.isTeacherReadOnly ? '' : `<button type="button" class="classes-action-edit w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700" data-class-id="${cls.id}">Edit</button>
                        <button type="button" class="classes-action-delete w-full text-left px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20" data-class-id="${cls.id}">Delete</button>`}
                    </div>
                </div>
            </td>
        </tr>`;
    }).join('');

    const pagination = `
        <div class="mt-4 flex flex-wrap items-center justify-between gap-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">Showing ${start + 1} to ${Math.min(start + listPerPage, totalFiltered)} of ${totalFiltered} results</p>
            <div class="flex items-center gap-2">
                <button type="button" class="classes-page-prev px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50" ${listPage <= 1 ? 'disabled' : ''}>Previous</button>
                <span class="px-2 text-sm text-gray-500 dark:text-gray-400">${listPage} / ${totalPages}</span>
                <button type="button" class="classes-page-next px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50" ${listPage >= totalPages ? 'disabled' : ''}>Next</button>
            </div>
        </div>
    `;

    content.innerHTML = summaryCards + toolbar + `
        <div class="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800">
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th class="p-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Class Name</th>
                            <th class="p-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Academic Year</th>
                            <th class="p-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Stream</th>
                            <th class="p-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Students</th>
                            <th class="p-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Sections</th>
                            <th class="p-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th class="p-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-700">${tableRows}</tbody>
                </table>
            </div>
            ${pagination}
        </div>
    `;

    bindListEvents(content);
}

function bindListEvents(content) {
    const searchInput = content.querySelector('#classesSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => { listSearch = searchInput.value; listPage = 1; fetchClasses(); });
        searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') { listSearch = searchInput.value; listPage = 1; fetchClasses(); } });
    }
    content.querySelector('#classesDownloadBtn')?.addEventListener('click', () => {
        const csv = ['Class Name,Academic Year,Stream,Students,Sections,Status'];
        const searchLower = listSearch.trim().toLowerCase();
        const list = searchLower ? classesListData.filter(c => (c.class_name || '').toLowerCase().includes(searchLower)) : classesListData;
        list.forEach(c => {
            const sections = c.sections && Array.isArray(c.sections) ? c.sections : [];
            const students = classStudentCountMap[c.class_name] || 0;
            csv.push(`"${(c.class_name || '').replace(/"/g, '""')}",—,—,${students},"${sections.join(', ')}",Active`);
        });
        const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'classes.csv'; a.click(); URL.revokeObjectURL(a.href);
        toast.success('Downloaded classes.csv');
    });

    content.querySelectorAll('.classes-table-row').forEach(row => {
        row.addEventListener('click', (e) => {
            if (e.target.closest('.classes-kebab') || e.target.closest('[id^="kebab-"]') || e.target.closest('button')) return;
            const id = row.getAttribute('data-class-id');
            const name = row.getAttribute('data-class-name') || '';
            if (id) openClassDetail(id, name.replace(/&quot;/g, '"'));
        });
    });

    content.querySelectorAll('.classes-kebab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-class-id');
            const dropdown = content.querySelector(`#kebab-${id}`);
            content.querySelectorAll('[id^="kebab-"]').forEach(d => { if (d !== dropdown) d.classList.add('hidden'); });
            dropdown?.classList.toggle('hidden');
        });
    });
    document.addEventListener('click', () => content.querySelectorAll('[id^="kebab-"]').forEach(d => d.classList.add('hidden')), { capture: true });

    content.querySelectorAll('.classes-action-view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = btn.getAttribute('data-class-id');
            const name = (btn.getAttribute('data-class-name') || '').replace(/&quot;/g, '"');
            content.querySelectorAll('[id^="kebab-"]').forEach(d => d.classList.add('hidden'));
            if (id) openClassDetail(id, name);
        });
    });
    if (!state.isTeacherReadOnly) {
        content.querySelectorAll('.classes-action-edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-class-id');
                content.querySelectorAll('[id^="kebab-"]').forEach(d => d.classList.add('hidden'));
                openEditClassModal(id);
            });
        });
        content.querySelectorAll('.classes-action-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-class-id');
                content.querySelectorAll('[id^="kebab-"]').forEach(d => d.classList.add('hidden'));
                if (id && (await confirm('Are you sure? This will not delete students in this class.'))) {
                    const { error } = await supabase.from('classes').delete().eq('id', id);
                    if (error) toast.error(error.message);
                    else { toast.success('Class deleted.'); fetchClasses(); }
                }
            });
        });
    }

    content.querySelector('.classes-page-prev')?.addEventListener('click', () => { if (listPage > 1) { listPage--; fetchClasses(); } });
    content.querySelector('.classes-page-next')?.addEventListener('click', () => { listPage++; fetchClasses(); });
}

function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}

async function renderDetailView(container) {
    const className = state.selectedClassName || 'Class';
    const classId = state.selectedClassId;

    const [studentsRes, assignmentsRes] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }).eq('class', className),
        supabase.from('teacher_assignments').select('id, role, teachers(name)').eq('class_id', classId).eq('is_active', true)
    ]);
    const studentCount = studentsRes.count ?? 0;
    const assignments = assignmentsRes.data || [];
    const classTeacher = assignments.find(a => a.role === 'class_teacher');
    const classTeacherName = classTeacher?.teachers?.name || '—';
    const distinctTeachers = [...new Set(assignments.map(a => a.teachers?.name).filter(Boolean))].length;
    const { data: classRow } = await supabase.from('classes').select('*').eq('id', classId).single();
    const { data: studentSections } = await supabase.from('students').select('section').eq('class', className);
    const definedSecs = (classRow?.sections && Array.isArray(classRow.sections)) ? classRow.sections : [];
    const actualSecs = [...new Set((studentSections || []).map(s => s.section).filter(Boolean))];
    const mergedSections = [...new Set([...definedSecs, ...actualSecs])].sort();
    const sectionsCount = mergedSections.length;
    const academicYearDisplay = (classRow?.academic_year && String(classRow.academic_year).trim()) ? String(classRow.academic_year) : '—';
    const streamDisplay = (classRow?.stream && String(classRow.stream).trim()) ? String(classRow.stream) : '—';
    const subjectsCount = [...new Set(assignments.map(a => a.subject).filter(Boolean))].length;

    const tabLabels = {
        overview: 'Overview',
        sections: `Sections ${sectionsCount}`,
        subjects: `Subjects ${subjectsCount}`,
        students: `Students ${studentCount}`,
        teachers: `Teachers ${distinctTeachers}`
    };
    state.detailTabLabels = tabLabels;

    container.innerHTML = `
        <div class="app-page-tile bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors duration-200">
            <div class="app-bar p-4 border-b border-gray-200 dark:border-gray-800">
                <nav class="flex items-center gap-2 text-sm">
                    <button type="button" id="classDetailBack" class="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium">Dashboard</button>
                    <span class="text-gray-400 dark:text-gray-500">/</span>
                    <button type="button" id="classDetailBackClasses" class="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium">Classes</button>
                    <span class="text-gray-400 dark:text-gray-500">/</span>
                    <span class="text-gray-900 dark:text-white font-medium">${escapeHtml(className)}</span>
                    <span class="text-gray-400 dark:text-gray-500">/</span>
                    <span class="text-gray-900 dark:text-white font-medium" id="classDetailBreadcrumbTab">${escapeHtml(tabLabels[state.activeTab] || state.activeTab)}</span>
                </nav>
            </div>
            <div class="app-bar p-6 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-start gap-4">
                    <div class="w-14 h-14 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">${escapeHtml(className)}</h2>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1" id="classDetailSubtitle">Class Teacher: ${escapeHtml(classTeacherName)} | Academic Year: ${escapeHtml(academicYearDisplay)} | Stream: ${escapeHtml(streamDisplay)}</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button type="button" id="classDetailEditBtn" class="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        Edit Class
                    </button>
                    <button type="button" id="classDetailAddStudentBtn" class="px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" /></svg>
                        Add Student
                    </button>
                </div>
            </div>
            <div class="app-tab-bar border-b border-gray-200 dark:border-gray-800">
                <div class="flex flex-wrap gap-1 px-4">
                    <button type="button" data-tab="overview" class="class-detail-tab px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">${escapeHtml(tabLabels.overview)}</button>
                    <button type="button" data-tab="sections" class="class-detail-tab px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">${escapeHtml(tabLabels.sections)}</button>
                    <button type="button" data-tab="subjects" class="class-detail-tab px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">${escapeHtml(tabLabels.subjects)}</button>
                    <button type="button" data-tab="students" class="class-detail-tab px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"><span>Students</span> <span class="ml-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">${studentCount}</span></button>
                    <button type="button" data-tab="teachers" class="class-detail-tab px-4 py-3 text-sm font-medium border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">${escapeHtml(tabLabels.teachers)}</button>
                </div>
            </div>
            <div id="classDetailContent" class="p-6 min-h-[320px]">
                <div class="text-gray-500 dark:text-gray-400">Loading...</div>
            </div>
        </div>
        ${getClassModalHtml()}
        ${getEditClassModalHtml()}
    `;

    document.getElementById('classDetailBack').addEventListener('click', () => { if (window.loadModule) window.loadModule('dashboard'); });
    document.getElementById('classDetailBackClasses').addEventListener('click', backToList);
    document.getElementById('classDetailEditBtn').addEventListener('click', () => openEditClassModal(state.selectedClassId));
    document.getElementById('classDetailAddStudentBtn').addEventListener('click', () => { if (window.loadModule) window.loadModule('add_student'); });
    document.querySelectorAll('.class-detail-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-tab');
            const breadcrumbTab = document.getElementById('classDetailBreadcrumbTab');
            if (breadcrumbTab && state.detailTabLabels) breadcrumbTab.textContent = state.detailTabLabels[tab] || tab;
            switchTab(tab);
        });
    });
    bindEditClassModal();
    switchTab(state.activeTab);
}

function switchTab(tabName) {
    state.activeTab = tabName;
    document.querySelectorAll('.class-detail-tab').forEach(btn => {
        const isActive = btn.getAttribute('data-tab') === tabName;
        btn.classList.toggle('border-indigo-600', isActive);
        btn.classList.toggle('text-indigo-600', isActive);
        btn.classList.toggle('dark:text-indigo-400', isActive);
        btn.classList.toggle('border-transparent', !isActive);
        btn.classList.toggle('text-gray-500', !isActive);
    });
    const content = document.getElementById('classDetailContent');
    if (!content) return;
    if (tabName === 'overview') loadOverview(content);
    else if (tabName === 'sections') loadSections(content);
    else if (tabName === 'subjects') loadSubjects(content);
    else if (tabName === 'students') loadStudents(content);
    else if (tabName === 'teachers') loadTeachers(content);
}

async function loadOverview(content) {
    content.innerHTML = '<div class="text-gray-500 dark:text-gray-400">Loading...</div>';
    const classId = state.selectedClassId;
    const className = state.selectedClassName;

    const [classRow, studentsRes, assignmentsRes] = await Promise.all([
        supabase.from('classes').select('sections').eq('id', classId).single(),
        supabase.from('students').select('id', { count: 'exact', head: true }).eq('class', className),
        supabase.from('teacher_assignments').select('subject, teacher_id').eq('class_id', classId).eq('is_active', true)
    ]);

    const sections = (classRow.data?.sections && Array.isArray(classRow.data.sections)) ? classRow.data.sections : [];
    const totalSections = sections.length;
    const totalStudents = studentsRes.count ?? 0;
    const assignments = assignmentsRes.data || [];
    const distinctSubjects = [...new Set(assignments.map(a => a.subject).filter(Boolean))];
    const distinctTeachers = [...new Set(assignments.map(a => a.teacher_id))];

    content.innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Students</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">${totalStudents}</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Sections</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">${totalSections}</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Subjects</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">${distinctSubjects.length}</p>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
                <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Assigned Teachers</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">${distinctTeachers.length}</p>
            </div>
        </div>
    `;
}

async function loadSections(content) {
    content.innerHTML = '<div class="text-gray-500 dark:text-gray-400">Loading...</div>';
    const classId = state.selectedClassId;
    const className = state.selectedClassName;

    const { data: classRow } = await supabase.from('classes').select('sections').eq('id', classId).single();
    const { data: students } = await supabase.from('students').select('section').eq('class', className);

    const definedSecs = (classRow?.sections && Array.isArray(classRow.sections)) ? classRow.sections : [];
    const actualSecs = [...new Set((students || []).map(s => s.section).filter(Boolean))];
    const sections = [...new Set([...definedSecs, ...actualSecs])].sort();

    const countBySection = {};
    sections.forEach(sec => { countBySection[sec] = 0; });
    (students || []).forEach(s => {
        if (s.section && countBySection[s.section] !== undefined) countBySection[s.section]++;
    });

    if (sections.length === 0) {
        content.innerHTML = '<p class="text-gray-500 dark:text-gray-400">No sections defined for this class.</p>';
        return;
    }

    content.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                        <th class="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Section</th>
                        <th class="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Students</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                    ${sections.map(sec => `
                        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td class="p-3 font-medium text-gray-900 dark:text-white">${escapeHtml(sec)}</td>
                            <td class="p-3 text-gray-600 dark:text-gray-400">${countBySection[sec] ?? 0}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function loadSubjects(content) {
    content.innerHTML = '<div class="text-gray-500 dark:text-gray-400">Loading...</div>';
    const classId = state.selectedClassId;

    let query = supabase.from('teacher_assignments').select('id, subject, section, is_active, teachers(name)').eq('class_id', classId).order('subject');
    if (state.isTeacherReadOnly && state.currentTeacherId) {
        query = query.eq('teacher_id', state.currentTeacherId);
    }
    const { data: rows, error } = await query;

    if (error) {
        content.innerHTML = `<p class="text-red-500 dark:text-red-400">${error.message}</p>`;
        return;
    }
    const list = rows || [];

    if (list.length === 0) {
        content.innerHTML = '<p class="text-gray-500 dark:text-gray-400">No subjects assigned for this class.</p>';
        return;
    }

    content.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                        <th class="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Subject</th>
                        <th class="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Section</th>
                        <th class="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Assigned Teacher</th>
                        <th class="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Status</th>
                        ${state.isTeacherReadOnly ? '' : '<th class="p-3 text-right font-semibold text-gray-600 dark:text-gray-300">Actions</th>'}
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                    ${list.map(r => {
        const teacherName = r.teachers?.name ?? '—';
        const status = r.is_active !== false ? 'Active' : 'Disabled';
        return `
                        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td class="p-3 font-medium text-gray-900 dark:text-white">${escapeHtml(r.subject || '—')}</td>
                            <td class="p-3 text-gray-600 dark:text-gray-400">${escapeHtml(r.section || '—')}</td>
                            <td class="p-3 text-gray-600 dark:text-gray-400">${escapeHtml(teacherName)}</td>
                            <td class="p-3"><span class="px-2 py-0.5 rounded text-xs font-medium ${r.is_active !== false ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}">${status}</span></td>
                            ${state.isTeacherReadOnly ? '' : `<td class="p-3 text-right"><button type="button" class="subject-toggle-active text-indigo-600 dark:text-indigo-400 hover:underline text-sm" data-id="${r.id}" data-active="${r.is_active !== false}">${r.is_active !== false ? 'Disable' : 'Enable'}</button></td>`}
                        </tr>`;
    }).join('')}
                </tbody>
            </table>
        </div>
    `;

    if (!state.isTeacherReadOnly) {
        content.querySelectorAll('.subject-toggle-active').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.getAttribute('data-id');
                const active = btn.getAttribute('data-active') === 'true';
                const { error: err } = await supabase.from('teacher_assignments').update({ is_active: !active }).eq('id', id);
                if (err) toast.error(err.message);
                else { toast.success(active ? 'Subject disabled.' : 'Subject enabled.'); loadSubjects(content); }
            });
        });
    }
}

function studentInitials(s) {
    if (!s || !s.name) return '?';
    const parts = String(s.name).trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (parts[0][0] || '?').toUpperCase();
}

function studentStatusClasses(status) {
    const st = (status || 'active').toLowerCase();
    if (st === 'active') return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
    if (st === 'transferred' || st === 'on_leave') return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
    return 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
}

async function loadStudents(content) {
    content.innerHTML = '<div class="text-gray-500 dark:text-gray-400">Loading...</div>';
    const className = state.selectedClassName;

    let query = supabase.from('students').select('*').eq('class', className).order('roll_no');
    const { data: students, error } = await query;
    if (error) {
        content.innerHTML = `<p class="text-red-500 dark:text-red-400">${error.message}</p>`;
        return;
    }
    studentsTabList = students || [];
    const { data: classRow } = await supabase.from('classes').select('sections').eq('id', state.selectedClassId).single();
    const definedSecs = (classRow?.sections && Array.isArray(classRow.sections)) ? classRow.sections : [];
    const actualSecs = [...new Set((students || []).map(s => s.section).filter(Boolean))];
    const sections = [...new Set([...definedSecs, ...actualSecs])].sort();

    renderStudentsTabContent(content, sections, className);
}

function applyStudentsTabFilters() {
    let list = [...studentsTabList];
    if (studentsTabSearch) {
        const q = studentsTabSearch.toLowerCase();
        list = list.filter(s => (s.name && s.name.toLowerCase().includes(q)) || (s.roll_no && String(s.roll_no).toLowerCase().includes(q)) || (s.email && s.email.toLowerCase().includes(q)));
    }
    if (studentsTabSectionFilter) list = list.filter(s => s.section === studentsTabSectionFilter);
    if (studentsTabStatusFilter) list = list.filter(s => (s.status || 'active') === studentsTabStatusFilter);
    return list;
}

function renderStudentsTabContent(content, sections, className) {
    const filtered = applyStudentsTabFilters();
    const total = filtered.length;
    const start = (studentsTabPage - 1) * studentsTabPerPage;
    const pageList = filtered.slice(start, start + studentsTabPerPage);
    const totalPages = Math.max(1, Math.ceil(total / studentsTabPerPage));

    const searchVal = document.getElementById('classDetailStudentSearch')?.value ?? studentsTabSearch;
    const sectionVal = document.getElementById('classDetailStudentSection')?.value ?? studentsTabSectionFilter;
    const statusVal = document.getElementById('classDetailStudentStatus')?.value ?? studentsTabStatusFilter;

    const tableHtml = `
        <div class="mb-4 flex flex-wrap items-center gap-3">
            <div class="relative flex-1 min-w-[200px] max-w-sm">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </span>
                <input type="text" id="classDetailStudentSearch" value="${escapeHtml(searchVal)}" placeholder="Search by name, roll no..." autocomplete="off" class="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm">
            </div>
            <select id="classDetailStudentSection" class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
                <option value="">All Sections</option>
                ${sections.map(s => `<option value="${escapeHtml(s)}" ${sectionVal === s ? 'selected' : ''}>${escapeHtml(s)}</option>`).join('')}
            </select>
            <select id="classDetailStudentStatus" class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
                <option value="">Status: All</option>
                <option value="active" ${statusVal === 'active' ? 'selected' : ''}>Active</option>
                <option value="transferred" ${statusVal === 'transferred' ? 'selected' : ''}>Transferred</option>
                <option value="promoted" ${statusVal === 'promoted' ? 'selected' : ''}>Promoted</option>
            </select>
            <button type="button" id="classDetailStudentFilterBtn" class="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800" title="Apply filters">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
            </button>
            <button type="button" id="classDetailStudentDownloadBtn" class="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800" title="Download">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            </button>
            <button type="button" id="classDetailStudentPrintBtn" class="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800" title="Print">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            </button>
        </div>
        <div class="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table class="w-full text-sm">
                <thead class="bg-gray-50 dark:bg-gray-800">
                    <tr>
                        ${state.isTeacherReadOnly ? '' : '<th class="p-3 text-left"><input type="checkbox" id="classDetailStudentSelectAll" class="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-800"></th>'}
                        <th class="p-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Roll No</th>
                        <th class="p-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Student Name</th>
                        <th class="p-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Section</th>
                        <th class="p-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Gender</th>
                        <th class="p-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>
                        <th class="p-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Attendance</th>
                        ${state.isTeacherReadOnly ? '' : '<th class="p-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Actions</th>'}
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                    ${pageList.length === 0 ? `<tr><td colspan="${state.isTeacherReadOnly ? 6 : 8}" class="p-6 text-center text-gray-500 dark:text-gray-400">No students found.</td></tr>` : pageList.map(s => {
        const status = s.status || 'active';
        const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
        const checked = studentsTabSelectedIds.has(s.id);
        const nameCell = s.photo_url
            ? `<img src="${escapeHtml(s.photo_url)}" alt="" class="w-9 h-9 rounded-full object-cover flex-shrink-0">`
            : `<span class="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-sm font-medium">${escapeHtml(studentInitials(s))}</span>`;
        return `
                        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50" data-student-id="${s.id}">
                            ${state.isTeacherReadOnly ? '' : `<td class="p-3"><input type="checkbox" class="student-row-cb rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 dark:bg-gray-800" data-id="${s.id}" ${checked ? 'checked' : ''}></td>`}
                            <td class="p-3 font-mono text-gray-900 dark:text-white">${escapeHtml(s.roll_no || '—')}</td>
                            <td class="p-3">
                                <div class="flex items-center gap-3">
                                    ${nameCell}
                                    <div>
                                        <p class="font-medium text-gray-900 dark:text-white">${escapeHtml(s.name || '—')}</p>
                                        ${s.email ? `<p class="text-xs text-gray-500 dark:text-gray-400">${escapeHtml(s.email)}</p>` : ''}
                                    </div>
                                </div>
                            </td>
                            <td class="p-3"><span class="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400">Sec ${escapeHtml(s.section || '—')}</span></td>
                            <td class="p-3 text-gray-600 dark:text-gray-400">${escapeHtml(s.gender || '—')}</td>
                            <td class="p-3"><span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full ${status === 'active' ? 'bg-green-500' : status === 'transferred' || status === 'on_leave' ? 'bg-amber-500' : 'bg-gray-400 dark:bg-gray-500'}"></span><span class="px-2 py-0.5 rounded text-xs font-medium ${studentStatusClasses(status)}">${escapeHtml(statusLabel)}</span></span></td>
                            <td class="p-3 text-gray-500 dark:text-gray-400">—</td>
                            ${state.isTeacherReadOnly ? '' : `<td class="p-3 text-right">
                                <button type="button" class="student-change-section text-indigo-600 dark:text-indigo-400 hover:underline text-xs mr-2" data-id="${s.id}">Section</button>
                                <button type="button" class="student-change-roll text-indigo-600 dark:text-indigo-400 hover:underline text-xs mr-2" data-id="${s.id}">Roll No</button>
                                <button type="button" class="student-transfer text-indigo-600 dark:text-indigo-400 hover:underline text-xs" data-id="${s.id}">Transfer</button>
                            </td>`}
                        </tr>`;
    }).join('')}
                </tbody>
            </table>
        </div>
        <div class="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>Rows per page:</span>
                <select id="classDetailStudentsPerPage" class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm">
                    <option value="10" ${studentsTabPerPage === 10 ? 'selected' : ''}>10</option>
                    <option value="25" ${studentsTabPerPage === 25 ? 'selected' : ''}>25</option>
                    <option value="50" ${studentsTabPerPage === 50 ? 'selected' : ''}>50</option>
                </select>
                <span>${total === 0 ? '0' : `${start + 1}–${Math.min(start + studentsTabPerPage, total)} of ${total}`}</span>
            </div>
            <div class="flex items-center gap-1">
                <button type="button" class="class-detail-students-prev px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50" ${studentsTabPage <= 1 ? 'disabled' : ''}>Previous</button>
                ${(() => {
            const start = Math.max(1, Math.min(studentsTabPage - 2, totalPages - 4));
            const end = Math.min(totalPages, start + 4);
            const range = Math.max(1, end - start + 1);
            return Array.from({ length: range }, (_, i) => {
                const p = start + i;
                const active = p === studentsTabPage;
                return `<button type="button" class="class-detail-students-page px-3 py-1.5 rounded-lg text-sm font-medium ${active ? 'bg-indigo-600 dark:bg-indigo-600 text-white' : 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}" data-page="${p}">${p}</button>`;
            }).join('');
        })()}
                <button type="button" class="class-detail-students-next px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50" ${studentsTabPage >= totalPages ? 'disabled' : ''}>Next</button>
            </div>
        </div>
        <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <button type="button" class="class-detail-action-card text-left p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" data-action="promote">
                <div class="flex items-center gap-3">
                    <span class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
                    </span>
                    <div>
                        <p class="font-semibold text-gray-900 dark:text-white">Promote Class</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Move students to next grade</p>
                    </div>
                </div>
            </button>
            <button type="button" class="class-detail-action-card text-left p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" data-action="transfer">
                <div class="flex items-center gap-3">
                    <span class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                    </span>
                    <div>
                        <p class="font-semibold text-gray-900 dark:text-white">Transfer Students</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Move to another section</p>
                    </div>
                </div>
            </button>
            <button type="button" class="class-detail-action-card text-left p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" data-action="bulk-assign">
                <div class="flex items-center gap-3">
                    <span class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                    </span>
                    <div>
                        <p class="font-semibold text-gray-900 dark:text-white">Bulk Assign</p>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Assign sections to selected</p>
                    </div>
                </div>
            </button>
        </div>
    `;
    content.innerHTML = tableHtml;

    document.getElementById('classDetailStudentSearch').value = searchVal;
    studentsTabSearch = searchVal;
    studentsTabSectionFilter = sectionVal;
    studentsTabStatusFilter = statusVal;

    document.getElementById('classDetailStudentFilterBtn')?.addEventListener('click', () => {
        studentsTabSearch = document.getElementById('classDetailStudentSearch').value.trim();
        studentsTabSectionFilter = document.getElementById('classDetailStudentSection').value;
        studentsTabStatusFilter = document.getElementById('classDetailStudentStatus').value;
        studentsTabPage = 1;
        renderStudentsTabContent(content, sections, className);
    });
    document.getElementById('classDetailStudentSearch')?.addEventListener('keypress', (e) => { if (e.key === 'Enter') document.getElementById('classDetailStudentFilterBtn')?.click(); });
    document.getElementById('classDetailStudentSection')?.addEventListener('change', () => {
        studentsTabSectionFilter = document.getElementById('classDetailStudentSection').value;
        studentsTabPage = 1;
        renderStudentsTabContent(content, sections, className);
    });
    document.getElementById('classDetailStudentStatus')?.addEventListener('change', () => {
        studentsTabStatusFilter = document.getElementById('classDetailStudentStatus').value;
        studentsTabPage = 1;
        renderStudentsTabContent(content, sections, className);
    });
    document.getElementById('classDetailStudentDownloadBtn')?.addEventListener('click', () => {
        const filtered = applyStudentsTabFilters();
        const headers = ['Roll No', 'Name', 'Section', 'Gender', 'Status', 'Email'];
        const rows = filtered.map(s => [s.roll_no || '', s.name || '', s.section || '', s.gender || '', s.status || 'active', s.email || '']);
        const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
        const a = document.createElement('a');
        a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
        a.download = `students-${className.replace(/\s+/g, '-')}.csv`;
        a.click();
    });
    document.getElementById('classDetailStudentPrintBtn')?.addEventListener('click', () => window.print());

    document.getElementById('classDetailStudentsPerPage')?.addEventListener('change', (e) => {
        studentsTabPerPage = parseInt(e.target.value, 10);
        studentsTabPage = 1;
        renderStudentsTabContent(content, sections, className);
    });
    content.querySelectorAll('.class-detail-students-prev').forEach(btn => {
        btn.addEventListener('click', () => { if (studentsTabPage > 1) { studentsTabPage--; renderStudentsTabContent(content, sections, className); } });
    });
    content.querySelectorAll('.class-detail-students-next').forEach(btn => {
        btn.addEventListener('click', () => { if (studentsTabPage < totalPages) { studentsTabPage++; renderStudentsTabContent(content, sections, className); } });
    });
    content.querySelectorAll('.class-detail-students-page').forEach(btn => {
        btn.addEventListener('click', () => { studentsTabPage = parseInt(btn.getAttribute('data-page'), 10); renderStudentsTabContent(content, sections, className); });
    });

    document.getElementById('classDetailStudentSelectAll')?.addEventListener('change', (e) => {
        const checked = e.target.checked;
        pageList.forEach(s => { if (checked) studentsTabSelectedIds.add(s.id); else studentsTabSelectedIds.delete(s.id); });
        content.querySelectorAll('.student-row-cb').forEach(cb => { cb.checked = checked; });
    });
    content.querySelectorAll('.student-row-cb').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const id = e.target.getAttribute('data-id');
            if (e.target.checked) studentsTabSelectedIds.add(id); else studentsTabSelectedIds.delete(id);
        });
    });

    content.querySelectorAll('.class-detail-action-card').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.getAttribute('data-action');
            if (action === 'promote') { toast.info('Promote Class: Select target class and confirm.'); }
            else if (action === 'transfer') { toast.info('Transfer Students: Select students and target section.'); }
            else if (action === 'bulk-assign') { toast.info('Bulk Assign: Assign sections to selected students.'); }
        });
    });

    if (!state.isTeacherReadOnly) {
        content.querySelectorAll('.student-change-section').forEach(btn => {
            btn.addEventListener('click', () => openStudentSectionModal(btn.getAttribute('data-id'), className, sections, content));
        });
        content.querySelectorAll('.student-change-roll').forEach(btn => {
            btn.addEventListener('click', () => openStudentRollModal(btn.getAttribute('data-id'), content));
        });
        content.querySelectorAll('.student-transfer').forEach(btn => {
            btn.addEventListener('click', () => openStudentTransferModal(btn.getAttribute('data-id'), className, content));
        });
    }
}

async function loadTeachers(content) {
    content.innerHTML = '<div class="text-gray-500 dark:text-gray-400">Loading...</div>';
    const classId = state.selectedClassId;

    let query = supabase.from('teacher_assignments').select('id, section, subject, role, teachers(id, name)').eq('class_id', classId).order('subject');
    if (state.isTeacherReadOnly && state.currentTeacherId) {
        query = query.eq('teacher_id', state.currentTeacherId);
    }
    const { data: rows, error } = await query;

    if (error) {
        content.innerHTML = `<p class="text-red-500 dark:text-red-400">${error.message}</p>`;
        return;
    }
    const list = rows || [];
    const byTeacher = {};
    list.forEach(r => {
        const tid = r.teachers?.id;
        const tname = r.teachers?.name || 'Unknown';
        if (!byTeacher[tid]) byTeacher[tid] = { name: tname, subjects: [], roles: new Set() };
        if (r.subject) byTeacher[tid].subjects.push(r.subject);
        byTeacher[tid].roles.add(r.role);
        if (!byTeacher[tid].assignmentIds) byTeacher[tid].assignmentIds = [];
        byTeacher[tid].assignmentIds.push(r.id);
    });

    const teacherList = Object.entries(byTeacher).map(([tid, t]) => ({ id: tid, ...t }));

    if (teacherList.length === 0) {
        content.innerHTML = '<p class="text-gray-500 dark:text-gray-400">No teachers assigned for this class.</p>';
        return;
    }

    content.innerHTML = `
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                        <th class="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Teacher</th>
                        <th class="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Assigned Subjects</th>
                        <th class="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Role</th>
                        ${state.isTeacherReadOnly ? '' : '<th class="p-3 text-right font-semibold text-gray-600 dark:text-gray-300">Actions</th>'}
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                    ${teacherList.map(t => `
                        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                            <td class="p-3 font-medium text-gray-900 dark:text-white">${escapeHtml(t.name)}</td>
                            <td class="p-3 text-gray-600 dark:text-gray-400">${(t.subjects || []).map(s => escapeHtml(s)).join(', ') || '—'}</td>
                            <td class="p-3 text-gray-600 dark:text-gray-400">${[...(t.roles || [])].map(r => r === 'class_teacher' ? 'Class Teacher' : 'Subject Teacher').join(', ') || '—'}</td>
                            ${state.isTeacherReadOnly ? '' : `<td class="p-3 text-right"><button type="button" class="teacher-remove-assignment text-red-600 dark:text-red-400 hover:underline text-xs" data-ids="${(t.assignmentIds || []).join(',')}">Remove</button></td>`}
                        </tr>`).join('')}
                </tbody>
            </table>
        </div>
    `;

    if (!state.isTeacherReadOnly) {
        content.querySelectorAll('.teacher-remove-assignment').forEach(btn => {
            btn.addEventListener('click', async () => {
                const ids = btn.getAttribute('data-ids').split(',').filter(Boolean);
                if (!ids.length || !confirm('Remove this teacher from all listed assignments for this class?')) return;
                for (const id of ids) {
                    await supabase.from('teacher_assignments').delete().eq('id', id);
                }
                toast.success('Assignment(s) removed.');
                loadTeachers(content);
            });
        });
    }
}

function openStudentSectionModal(studentId, className, sections, content) {
    const section = prompt('New section:', '');
    if (section === null || section === '') return;
    const trimmed = section.trim();
    if (!sections.includes(trimmed)) {
        toast.warning('Section must be one of: ' + sections.join(', '));
        return;
    }
    supabase.from('students').update({ section: trimmed }).eq('id', studentId).then(({ error }) => {
        if (error) toast.error(error.message);
        else { toast.success('Section updated.'); loadStudents(content); }
    });
}

function openStudentRollModal(studentId, content) {
    const roll = prompt('New roll number:', '');
    if (roll === null) return;
    const trimmed = roll.trim();
    if (!trimmed) { toast.warning('Roll number is required.'); return; }
    supabase.from('students').update({ roll_no: trimmed }).eq('id', studentId).then(({ error }) => {
        if (error) toast.error(error.code === '23505' ? 'This roll number is already in use.' : error.message);
        else { toast.success('Roll number updated.'); loadStudents(content); }
    });
}

async function openStudentTransferModal(studentId, currentClassName, content) {
    const { data: classes } = await supabase.from('classes').select('id, class_name').order('class_name');
    const options = (classes || []).filter(c => c.class_name !== currentClassName).map(c => `${c.class_name}`).join('\n');
    const name = prompt('Enter target class name (exact):', '');
    if (name === null || !name.trim()) return;
    const target = (classes || []).find(c => c.class_name === name.trim());
    if (!target) {
        toast.warning('Class not found. Use exact name from: ' + (classes || []).map(c => c.class_name).join(', '));
        return;
    }
    const section = prompt('Section in target class (e.g. A):', '');
    if (section === null) return;
    const { error } = await supabase.from('students').update({ class: target.class_name, section: section.trim() }).eq('id', studentId);
    if (error) toast.error(error.message);
    else { toast.success('Student transferred.'); loadStudents(content); }
}

async function openClassDetail(id, name) {
    state.viewMode = 'detail';
    state.selectedClassId = id;
    state.selectedClassName = name;
    state.activeTab = 'overview';
    try {
        sessionStorage.setItem('suffah_class_detail_id', id);
        sessionStorage.setItem('suffah_class_detail_name', name);
    } catch (_) { }
    const container = document.getElementById('mainContent');
    if (container) await renderDetailView(container);
}

function backToList() {
    state.viewMode = 'list';
    state.selectedClassId = null;
    state.selectedClassName = null;
    try {
        sessionStorage.removeItem('suffah_class_detail_id');
        sessionStorage.removeItem('suffah_class_detail_name');
    } catch (_) { }
    const container = document.getElementById('mainContent');
    if (container) render(container);
}

window.openClassDetail = openClassDetail;
window.refreshClassDetailIfOpen = function (classId) {
    if (state.viewMode === 'detail' && state.selectedClassId === classId) {
        const content = document.getElementById('classDetailContent');
        if (content) switchTab(state.activeTab);
    }
};

window.deleteClass = async (id) => {
    if (!await confirm('Are you sure? This will not delete students in this class.')) return;
    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (error) toast.error(error.message);
    else {
        toast.success('Class deleted.');
        await fetchClasses();
        if (window.broadcastDataChange) window.broadcastDataChange('class');
    }
};

function openModal() {
    const modal = document.getElementById('classModal');
    if (!modal) return;
    if (modal.parentElement !== document.body) document.body.appendChild(modal);
    resetAddClassForm();
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    const content = modal.querySelector('div.bg-white');
    setTimeout(() => {
        content?.classList.remove('scale-95', 'opacity-0');
        content?.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function resetAddClassForm() {
    const nameEl = document.getElementById('className');
    const nameError = document.getElementById('classNameError');
    const nameErrorText = document.getElementById('classNameErrorText');
    if (nameEl) { nameEl.value = ''; nameEl.classList.remove('border-red-500'); }
    if (nameError) nameError.classList.add('hidden');
    if (nameErrorText) nameErrorText.classList.add('hidden');
    document.querySelectorAll('.add-class-stream').forEach(btn => {
        const s = btn.getAttribute('data-stream');
        btn.classList.toggle('bg-indigo-600', s === 'General');
        btn.classList.toggle('text-white', s === 'General');
        btn.classList.toggle('text-gray-600', s !== 'General');
        btn.classList.toggle('dark:text-gray-400', s !== 'General');
    });
    const toggle = document.getElementById('classStatusToggle');
    const statusLabel = document.getElementById('classStatusLabel');
    if (toggle) { toggle.setAttribute('aria-checked', 'true'); toggle.classList.remove('bg-gray-200', 'dark:bg-gray-700'); toggle.classList.add('bg-indigo-600'); toggle.querySelector('span').classList.add('translate-x-5'); toggle.querySelector('span').classList.remove('translate-x-0'); }
    if (statusLabel) statusLabel.textContent = 'Active';
    document.getElementById('sectionPillsContainer')?.querySelectorAll('.section-pill').forEach(el => el.remove());
    const pillInput = document.getElementById('sectionPillInput');
    if (pillInput) pillInput.value = '';
    document.getElementById('defaultTeacherSearch').value = '';
    document.getElementById('defaultTeacherId').value = '';
    document.getElementById('maxCapacity').value = '30';
    document.getElementById('internalNotes').value = '';
    document.getElementById('createAnotherClass').checked = false;
}

function closeModal() {
    const modal = document.getElementById('classModal');
    const content = modal?.querySelector('div.bg-white');
    if (content) {
        content.classList.remove('scale-100', 'opacity-100');
        content.classList.add('scale-95', 'opacity-0');
    }
    setTimeout(() => { modal?.classList.add('hidden'); modal?.classList.remove('flex'); }, 300);
}

function bindAddClassModal() {
    const classNameInput = document.getElementById('className');
    const classNameError = document.getElementById('classNameError');
    const classNameErrorText = document.getElementById('classNameErrorText');
    function validateClassName() {
        const v = (classNameInput?.value || '').trim();
        const invalid = !v;
        if (classNameInput) classNameInput.classList.toggle('border-red-500', invalid);
        if (classNameError) classNameError.classList.toggle('hidden', !invalid);
        if (classNameErrorText) classNameErrorText.classList.toggle('hidden', !invalid);
        return !invalid;
    }
    classNameInput?.addEventListener('blur', validateClassName);
    classNameInput?.addEventListener('input', () => { validateClassName(); });

    document.querySelectorAll('.add-class-stream').forEach(btn => {
        btn.addEventListener('click', () => {
            const stream = btn.getAttribute('data-stream');
            document.querySelectorAll('.add-class-stream').forEach(b => {
                const s = b.getAttribute('data-stream');
                b.classList.toggle('bg-indigo-600', s === stream);
                b.classList.toggle('text-white', s === stream);
                b.classList.toggle('text-gray-600', s !== stream);
                b.classList.toggle('dark:text-gray-400', s !== stream);
            });
        });
    });

    const classStatusToggle = document.getElementById('classStatusToggle');
    const classStatusLabel = document.getElementById('classStatusLabel');
    if (classStatusToggle) {
        classStatusToggle.addEventListener('click', () => {
            const on = classStatusToggle.getAttribute('aria-checked') !== 'true';
            classStatusToggle.setAttribute('aria-checked', on ? 'true' : 'false');
            const thumb = classStatusToggle.querySelector('span');
            if (on) {
                classStatusToggle.classList.remove('bg-gray-200', 'dark:bg-gray-700'); classStatusToggle.classList.add('bg-indigo-600');
                thumb.classList.add('translate-x-5'); thumb.classList.remove('translate-x-0');
                if (classStatusLabel) classStatusLabel.textContent = 'Active';
            } else {
                classStatusToggle.classList.add('bg-gray-200', 'dark:bg-gray-700'); classStatusToggle.classList.remove('bg-indigo-600');
                thumb.classList.remove('translate-x-5'); thumb.classList.add('translate-x-0');
                if (classStatusLabel) classStatusLabel.textContent = 'Inactive';
            }
        });
    }

    const advancedToggle = document.getElementById('advancedConfigToggle');
    const advancedPanel = document.getElementById('advancedConfigPanel');
    const advancedChevron = document.getElementById('advancedConfigChevron');
    advancedToggle?.addEventListener('click', () => {
        advancedPanel?.classList.toggle('hidden');
        advancedChevron?.classList.toggle('rotate-180');
    });

    const sectionPillsContainer = document.getElementById('sectionPillsContainer');
    const sectionPillInput = document.getElementById('sectionPillInput');
    sectionPillInput?.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const raw = sectionPillInput.value.trim();
        const v = raw.replace(/^Section\s+/i, '') || raw;
        if (!v) return;
        const label = v.toLowerCase().startsWith('section') ? v : 'Section ' + v;
        const pill = document.createElement('span');
        pill.className = 'section-pill inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400';
        pill.setAttribute('data-section', v);
        pill.innerHTML = `${escapeHtml(label)} <button type="button" class="section-pill-remove ml-0.5 rounded-full p-0.5 hover:bg-indigo-200 dark:hover:bg-indigo-800/50" aria-label="Remove">×</button>`;
        pill.querySelector('.section-pill-remove')?.addEventListener('click', () => pill.remove());
        sectionPillsContainer?.insertBefore(pill, sectionPillInput);
        sectionPillInput.value = '';
    });

    let teachersCache = [];
    const defaultTeacherSearch = document.getElementById('defaultTeacherSearch');
    const defaultTeacherId = document.getElementById('defaultTeacherId');
    const defaultTeacherDropdown = document.getElementById('defaultTeacherDropdown');
    async function refreshTeacherDropdown() {
        if (teachersCache.length === 0) {
            const { data } = await supabase.from('teachers').select('id, name').order('name');
            teachersCache = data || [];
        }
        const q = (defaultTeacherSearch?.value || '').trim().toLowerCase();
        const list = q ? teachersCache.filter(t => (t.name || '').toLowerCase().includes(q)) : teachersCache;
        if (!defaultTeacherDropdown) return;
        defaultTeacherDropdown.innerHTML = list.length ? list.map(t => `<button type="button" class="teacher-option w-full text-left px-3 py-2 text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700" data-id="${t.id}" data-name="${escapeHtml(t.name || '')}">${escapeHtml(t.name || '')}</button>`).join('') : '<p class="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">No teachers found</p>';
        defaultTeacherDropdown.classList.remove('hidden');
    }
    defaultTeacherSearch?.addEventListener('focus', refreshTeacherDropdown);
    defaultTeacherSearch?.addEventListener('input', refreshTeacherDropdown);
    defaultTeacherDropdown?.addEventListener('click', (e) => {
        const btn = e.target.closest('.teacher-option');
        if (!btn) return;
        defaultTeacherId.value = btn.getAttribute('data-id') || '';
        defaultTeacherSearch.value = btn.getAttribute('data-name') || '';
        defaultTeacherDropdown.classList.add('hidden');
    });
    document.addEventListener('click', (e) => {
        if (defaultTeacherDropdown && !defaultTeacherDropdown.contains(e.target) && e.target !== defaultTeacherSearch) defaultTeacherDropdown.classList.add('hidden');
    });

    const capacityMinus = document.getElementById('capacityMinus');
    const capacityPlus = document.getElementById('capacityPlus');
    const maxCapacity = document.getElementById('maxCapacity');
    capacityMinus?.addEventListener('click', () => { const n = Math.max(1, parseInt(maxCapacity.value, 10) - 1); maxCapacity.value = n; });
    capacityPlus?.addEventListener('click', () => { const n = Math.min(999, parseInt(maxCapacity.value, 10) + 1); maxCapacity.value = n; });
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const className = (document.getElementById('className').value || '').trim();
    const classNameError = document.getElementById('classNameError');
    const classNameErrorText = document.getElementById('classNameErrorText');
    if (!className) {
        document.getElementById('className').classList.add('border-red-500');
        if (classNameError) classNameError.classList.remove('hidden');
        if (classNameErrorText) classNameErrorText.classList.remove('hidden');
        return;
    }
    document.getElementById('className').classList.remove('border-red-500');
    if (classNameError) classNameError.classList.add('hidden');
    if (classNameErrorText) classNameErrorText.classList.add('hidden');

    const academicYear = document.getElementById('academicYear').value;
    const streamBtn = document.querySelector('.add-class-stream.bg-indigo-600');
    const stream = streamBtn ? streamBtn.getAttribute('data-stream') : 'General';
    const isActive = document.getElementById('classStatusToggle').getAttribute('aria-checked') === 'true';
    const pillEls = document.getElementById('sectionPillsContainer')?.querySelectorAll('.section-pill') || [];
    const sections = Array.from(pillEls).map(p => p.getAttribute('data-section')).filter(Boolean);
    const finalSections = sections.length ? sections : ['A'];
    const defaultTeacherId = (document.getElementById('defaultTeacherId').value || '').trim() || null;
    const maxCapacity = parseInt(document.getElementById('maxCapacity').value, 10) || 30;
    const internalNotes = (document.getElementById('internalNotes').value || '').trim() || null;
    const createAnother = document.getElementById('createAnotherClass').checked;

    const payload = { class_name: className, sections: finalSections };
    if (academicYear) payload.academic_year = academicYear;
    if (stream) payload.stream = stream;
    payload.is_active = isActive;
    if (maxCapacity) payload.max_capacity = maxCapacity;
    if (internalNotes) payload.internal_notes = internalNotes;
    if (defaultTeacherId) payload.default_teacher_id = defaultTeacherId;
    let result = await supabase.from('classes').insert([payload]).select();
    if (result.error && (result.error.message.includes('column') || result.error.code === '42703')) {
        result = await supabase.from('classes').insert([{ class_name: className, sections: finalSections }]).select();
    }
    if (result.error) {
        toast.error(result.error.message);
        return;
    }
    const newClassId = result.data?.[0]?.id;
    if (defaultTeacherId && newClassId) {
        await supabase.from('teacher_assignments').insert([{ teacher_id: defaultTeacherId, class_id: newClassId, section: finalSections[0] || '', subject: '', role: 'class_teacher', is_active: true }]);
    }
    toast.success('Class added.');
    await fetchClasses();
    if (window.broadcastDataChange) window.broadcastDataChange('class');
    if (createAnother) {
        resetAddClassForm();
        document.getElementById('className').focus();
    } else {
        closeModal();
    }
}
