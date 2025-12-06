// Use global Supabase client for production compatibility
const supabase = window.supabase || (() => {
    console.error('Supabase client not found on window object');
    throw new Error('Supabase client not initialized');
})();

export async function render(container) {
    container.innerHTML = `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 class="text-xl font-bold text-gray-800">Classes & Sections</h2>
                <button id="addClassBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add Class
                </button>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6" id="classesGrid">
                <div class="col-span-full text-center py-10 text-gray-500">Loading classes...</div>
            </div>
        </div>

        <!-- Modal -->
        <div id="classModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 backdrop-blur-sm">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 my-4 overflow-hidden">
                <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 class="text-lg font-bold text-gray-800">Add New Class</h3>
                    <button id="closeModalBtn" class="text-gray-400 hover:text-gray-600">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form id="classForm" class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
                        <input type="text" id="className" required placeholder="e.g. Class 10" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Sections (comma separated)</label>
                        <input type="text" id="sections" required placeholder="e.g. A, B, C" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                    </div>

                    <div class="flex justify-end pt-4">
                        <button type="button" id="cancelBtn" class="mr-3 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">Save Class</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Event Listeners
    document.getElementById('addClassBtn').addEventListener('click', openModal);
    document.getElementById('closeModalBtn').addEventListener('click', closeModal);
    document.getElementById('cancelBtn').addEventListener('click', closeModal);
    document.getElementById('classForm').addEventListener('submit', handleFormSubmit);

    await fetchClasses();
}

async function fetchClasses() {
    const grid = document.getElementById('classesGrid');

    const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('class_name', { ascending: true });

    if (error) {
        console.error('Error fetching classes:', error);
        grid.innerHTML = `<div class="col-span-full text-center text-red-500">Error: ${error.message}</div>`;
        return;
    }

    if (data.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-10 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            No classes found. Add one to get started.
        </div>`;
        return;
    }

    grid.innerHTML = data.map(cls => `
        <div class="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:shadow-md transition-shadow relative group">
            <div class="flex justify-between items-start mb-4">
                <div class="bg-indigo-100 text-indigo-700 font-bold text-xl h-12 w-12 rounded-lg flex items-center justify-center">
                    ${cls.class_name.replace(/[^0-9]/g, '') || cls.class_name.charAt(0)}
                </div>
                <button onclick="window.deleteClass('${cls.id}')" class="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
            <h3 class="text-lg font-bold text-gray-800 mb-2">${cls.class_name}</h3>
            <div class="flex flex-wrap gap-2">
                ${cls.sections.map(sec => `<span class="bg-white border border-gray-200 text-gray-600 text-xs font-medium px-2.5 py-0.5 rounded">${sec}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

window.deleteClass = async (id) => {
    if (!confirm('Are you sure? This will not delete students in this class.')) return;

    const { error } = await supabase.from('classes').delete().eq('id', id);
    if (error) {
        alert('Error deleting class: ' + error.message);
    } else {
        fetchClasses();
    }
};

function openModal() {
    document.getElementById('classModal').classList.remove('hidden');
    document.getElementById('classModal').classList.add('flex');
}

function closeModal() {
    document.getElementById('classModal').classList.add('hidden');
    document.getElementById('classModal').classList.remove('flex');
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const className = document.getElementById('className').value;
    const sectionsStr = document.getElementById('sections').value;
    const sections = sectionsStr.split(',').map(s => s.trim()).filter(s => s);

    const { error } = await supabase.from('classes').insert([{
        class_name: className,
        sections: sections
    }]);

    if (error) {
        alert('Error saving class: ' + error.message);
    } else {
        document.getElementById('classForm').reset();
        closeModal();
        fetchClasses();
    }
}
