// Use global Supabase client for production compatibility
const supabase = window.supabase || (() => {
    console.error('Supabase client not found on window object');
    throw new Error('Supabase client not initialized');
})();

export async function render(container) {
    container.innerHTML = `
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-200">
            <div class="p-6 border-b border-gray-100 dark:border-gray-700">
                <h2 class="text-xl font-bold text-gray-800 dark:text-white">Fee Structure Management</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage fee types and assign fees to classes.</p>
            </div>
            
            <div class="p-6">
                <!-- Tabs -->
                <div class="flex space-x-4 border-b border-gray-200 dark:border-gray-700 mb-6">
                    <button id="tabFeeTypes" class="px-4 py-2 text-sm font-medium text-indigo-600 border-b-2 border-indigo-600 focus:outline-none">Fee Types</button>
                    <button id="tabClassFees" class="px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none">Class Fees</button>
                </div>

                <!-- Fee Types Content -->
                <div id="contentFeeTypes">
                    <div class="flex justify-end mb-4">
                        <button id="addFeeTypeBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Add Fee Type
                        </button>
                    </div>
                    
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm uppercase tracking-wider">
                                    <th class="p-4 font-semibold rounded-tl-lg">Name</th>
                                    <th class="p-4 font-semibold">Description</th>
                                    <th class="p-4 font-semibold">Default Amount</th>
                                    <th class="p-4 font-semibold text-right rounded-tr-lg">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="feeTypesTableBody" class="text-gray-700 dark:text-gray-300 text-sm divide-y divide-gray-100 dark:divide-gray-700">
                                <tr><td colspan="3" class="p-4 text-center">Loading...</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Class Fees Content -->
                <div id="contentClassFees" class="hidden">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <!-- Class Selection -->
                        <div class="md:col-span-1 border-r border-gray-200 dark:border-gray-700 pr-6">
                            <h3 class="font-semibold text-gray-800 dark:text-white mb-4">Select Class</h3>
                            <div id="classList" class="space-y-2">
                                <p class="text-sm text-gray-500">Loading classes...</p>
                            </div>
                        </div>

                        <!-- Fees for Selected Class -->
                        <div class="md:col-span-2">
                            <div id="classFeesContainer" class="hidden">
                                <div class="flex justify-between items-center mb-4">
                                    <h3 class="font-semibold text-gray-800 dark:text-white" id="selectedClassName">Class Fees</h3>
                                    <button id="assignFeeBtn" class="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                        Assign Fee
                                    </button>
                                </div>
                                
                                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <table class="w-full text-sm">
                                        <thead>
                                            <tr class="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                                                <th class="text-left pb-2">Fee Type</th>
                                                <th class="text-right pb-2">Amount</th>
                                                <th class="text-right pb-2">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody id="classFeesTableBody" class="text-gray-700 dark:text-gray-300">
                                            <!-- Dynamic Rows -->
                                        </tbody>
                                        <tfoot class="border-t border-gray-200 dark:border-gray-600">
                                            <tr>
                                                <td class="pt-3 font-bold text-gray-800 dark:text-white">Total</td>
                                                <td class="pt-3 text-right font-bold text-gray-800 dark:text-white" id="totalClassFee">0.00</td>
                                                <td></td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                            <div id="noClassSelected" class="flex flex-col items-center justify-center h-64 text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <p>Select a class to manage its fee structure</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Fee Type Modal -->
        <div id="feeTypeModal" class="modal-overlay fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 backdrop-blur-sm">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all">
                <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700">
                    <h3 class="text-lg font-bold text-gray-800 dark:text-white" id="feeTypeModalTitle">Add Fee Type</h3>
                    <button id="closeFeeTypeModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form id="feeTypeForm" class="p-6 space-y-4">
                    <input type="hidden" id="feeTypeId">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fee Name</label>
                        <input type="text" id="feeTypeName" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="e.g. Lab Fee">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea id="feeTypeDesc" rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Amount</label>
                        <input type="number" id="feeTypeDefaultAmount" min="0" step="0.01" value="0" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="0.00">
                    </div>
                    <div class="flex items-center">
                        <input type="checkbox" id="feeTypeAllowCustom" checked class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                        <label for="feeTypeAllowCustom" class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Allow custom amount for each student
                        </label>
                    </div>
                    <div class="flex justify-end pt-4">
                        <button type="button" id="cancelFeeTypeBtn" class="mr-3 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">Save</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Assign Fee Modal -->
        <div id="assignFeeModal" class="modal-overlay fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 backdrop-blur-sm">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden transform transition-all">
                <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700">
                    <h3 class="text-lg font-bold text-gray-800 dark:text-white">Assign Fee to Class</h3>
                    <button id="closeAssignFeeModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form id="assignFeeForm" class="p-6 space-y-4">
                    <input type="hidden" id="assignClassId">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fee Type</label>
                        <select id="assignFeeTypeSelect" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            <!-- Options populated dynamically -->
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                        <input type="number" id="assignAmount" required min="0" step="0.01" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>
                    <div class="flex justify-end pt-4">
                        <button type="button" id="cancelAssignFeeBtn" class="mr-3 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">Assign</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Initialize Tabs
    const tabFeeTypes = document.getElementById('tabFeeTypes');
    const tabClassFees = document.getElementById('tabClassFees');
    const contentFeeTypes = document.getElementById('contentFeeTypes');
    const contentClassFees = document.getElementById('contentClassFees');

    tabFeeTypes.addEventListener('click', () => {
        tabFeeTypes.classList.add('text-indigo-600', 'border-b-2', 'border-indigo-600');
        tabFeeTypes.classList.remove('text-gray-500', 'dark:text-gray-400');
        tabClassFees.classList.remove('text-indigo-600', 'border-b-2', 'border-indigo-600');
        tabClassFees.classList.add('text-gray-500', 'dark:text-gray-400');
        contentFeeTypes.classList.remove('hidden');
        contentClassFees.classList.add('hidden');
    });

    tabClassFees.addEventListener('click', () => {
        tabClassFees.classList.add('text-indigo-600', 'border-b-2', 'border-indigo-600');
        tabClassFees.classList.remove('text-gray-500', 'dark:text-gray-400');
        tabFeeTypes.classList.remove('text-indigo-600', 'border-b-2', 'border-indigo-600');
        tabFeeTypes.classList.add('text-gray-500', 'dark:text-gray-400');
        contentClassFees.classList.remove('hidden');
        contentFeeTypes.classList.add('hidden');
        fetchClasses(); // Refresh classes when tab is clicked
    });

    // Fee Types Logic
    document.getElementById('addFeeTypeBtn').addEventListener('click', () => openFeeTypeModal());
    document.getElementById('closeFeeTypeModal').addEventListener('click', closeFeeTypeModal);
    document.getElementById('cancelFeeTypeBtn').addEventListener('click', closeFeeTypeModal);
    document.getElementById('feeTypeForm').addEventListener('submit', handleFeeTypeSubmit);

    // Class Fees Logic
    document.getElementById('assignFeeBtn').addEventListener('click', openAssignFeeModal);
    document.getElementById('closeAssignFeeModal').addEventListener('click', closeAssignFeeModal);
    document.getElementById('cancelAssignFeeBtn').addEventListener('click', closeAssignFeeModal);
    document.getElementById('assignFeeForm').addEventListener('submit', handleAssignFeeSubmit);

    // Initial Fetch
    await fetchFeeTypes();
}

// --- Fee Types Functions ---

async function fetchFeeTypes() {
    const tbody = document.getElementById('feeTypesTableBody');
    tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center">Loading...</td></tr>';

    const { data, error } = await supabase.from('fee_types').select('*').order('name');

    if (error) {
        console.error('Error fetching fee types:', error);
        tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-red-500">Error: ${error.message}</td></tr>`;
        return;
    }

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-gray-400">No fee types defined.</td></tr>';
        return;
    }

    tbody.innerHTML = data.map(type => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0">
            <td class="p-4 font-medium text-gray-900 dark:text-white">${type.name}</td>
            <td class="p-4 text-gray-600 dark:text-gray-300">${type.description || '-'}</td>
            <td class="p-4 text-gray-600 dark:text-gray-300">$${Number(type.default_amount || 0).toFixed(2)}</td>
            <td class="p-4 text-right">
                <button onclick="window.editFeeType('${type.id}', '${type.name}', '${type.description || ''}', ${type.default_amount || 0}, ${type.allow_custom !== false})" class="text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400 mr-3">Edit</button>
                <button onclick="window.deleteFeeType('${type.id}')" class="text-red-600 hover:text-red-900 dark:hover:text-red-400">Delete</button>
            </td>
        </tr>
    `).join('');
}

function openFeeTypeModal(id = '', name = '', description = '', defaultAmount = 0, allowCustom = true) {
    const modal = document.getElementById('feeTypeModal');

    // Move modal to body to break out of dashboard layout
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    const title = document.getElementById('feeTypeModalTitle');

    document.getElementById('feeTypeId').value = id;
    document.getElementById('feeTypeName').value = name;
    document.getElementById('feeTypeDesc').value = description;
    document.getElementById('feeTypeDefaultAmount').value = defaultAmount;
    document.getElementById('feeTypeAllowCustom').checked = allowCustom;

    title.textContent = id ? 'Edit Fee Type' : 'Add Fee Type';

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeFeeTypeModal() {
    const modal = document.getElementById('feeTypeModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

async function handleFeeTypeSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('feeTypeId').value;
    const name = document.getElementById('feeTypeName').value;
    const description = document.getElementById('feeTypeDesc').value;
    const defaultAmount = document.getElementById('feeTypeDefaultAmount').value;
    const allowCustom = document.getElementById('feeTypeAllowCustom').checked;

    const feeTypeData = {
        name,
        description,
        default_amount: defaultAmount,
        allow_custom: allowCustom
    };

    let error;
    if (id) {
        const res = await supabase.from('fee_types').update(feeTypeData).eq('id', id);
        error = res.error;
    } else {
        const res = await supabase.from('fee_types').insert([feeTypeData]);
        error = res.error;
    }

    if (error) {
        toast.error('Error saving fee type: ' + error.message);
    } else {
        closeFeeTypeModal();
        fetchFeeTypes();
    }
}

// Expose to window
window.editFeeType = openFeeTypeModal;
window.deleteFeeType = async (id) => {
    if (!await confirm('Are you sure? This will delete the fee type and remove it from all classes.')) return;

    const { error } = await supabase.from('fee_types').delete().eq('id', id);
    if (error) {
        toast.error('Error deleting fee type: ' + error.message);
    } else {
        fetchFeeTypes();
    }
};


// --- Class Fees Functions ---

let selectedClassId = null;

async function fetchClasses() {
    const container = document.getElementById('classList');
    container.innerHTML = '<p class="text-sm text-gray-500">Loading...</p>';

    const { data, error } = await supabase.from('classes').select('*').order('class_name');

    if (error) {
        container.innerHTML = `<p class="text-sm text-red-500">Error: ${error.message}</p>`;
        return;
    }

    if (data.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-400">No classes found.</p>';
        return;
    }

    container.innerHTML = data.map(cls => `
        <button onclick="window.selectClass('${cls.id}', '${cls.class_name}')" 
            class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedClassId === cls.id ? 'bg-indigo-50 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300' : 'text-gray-700 dark:text-gray-300'}">
            ${cls.class_name}
        </button>
    `).join('');
}

window.selectClass = async (id, name) => {
    selectedClassId = id;
    document.getElementById('selectedClassName').textContent = `${name} Fees`;
    document.getElementById('noClassSelected').classList.add('hidden');
    document.getElementById('classFeesContainer').classList.remove('hidden');

    // Update visual selection
    fetchClasses(); // Re-render list to show active state

    // Fetch fees for this class
    fetchClassFees(id);
};

async function fetchClassFees(classId) {
    const tbody = document.getElementById('classFeesTableBody');
    const tfoot = document.getElementById('totalClassFee');
    tbody.innerHTML = '<tr><td colspan="3" class="py-4 text-center text-gray-400">Loading fees...</td></tr>';

    const { data, error } = await supabase
        .from('class_fees')
        .select(`
            id,
            amount,
            fee_types (id, name)
        `)
        .eq('class_id', classId);

    if (error) {
        tbody.innerHTML = `<tr><td colspan="3" class="py-4 text-center text-red-500">Error: ${error.message}</td></tr>`;
        return;
    }

    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="py-4 text-center text-gray-400">No fees assigned to this class.</td></tr>';
        tfoot.textContent = '0.00';
        return;
    }

    let total = 0;
    tbody.innerHTML = data.map(item => {
        total += Number(item.amount);
        return `
            <tr class="border-b border-gray-100 dark:border-gray-700 last:border-0">
                <td class="py-3 text-gray-800 dark:text-gray-200">${item.fee_types?.name || 'Unknown'}</td>
                <td class="py-3 text-right text-gray-800 dark:text-gray-200">${Number(item.amount).toFixed(2)}</td>
                <td class="py-3 text-right">
                    <button onclick="window.deleteClassFee('${item.id}')" class="text-red-500 hover:text-red-700 text-xs">Remove</button>
                </td>
            </tr>
        `;
    }).join('');

    tfoot.textContent = total.toFixed(2);
}

async function openAssignFeeModal() {
    if (!selectedClassId) return;

    const modal = document.getElementById('assignFeeModal');

    // Move modal to body to break out of dashboard layout
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    const select = document.getElementById('assignFeeTypeSelect');

    // Populate dropdown
    select.innerHTML = '<option>Loading...</option>';
    const { data } = await supabase.from('fee_types').select('*').order('name');

    if (data) {
        select.innerHTML = data.map(type => `<option value="${type.id}">${type.name}</option>`).join('');
    }

    document.getElementById('assignClassId').value = selectedClassId;
    document.getElementById('assignAmount').value = '';

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeAssignFeeModal() {
    const modal = document.getElementById('assignFeeModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

async function handleAssignFeeSubmit(e) {
    e.preventDefault();

    const classId = document.getElementById('assignClassId').value;
    const feeTypeId = document.getElementById('assignFeeTypeSelect').value;
    const amount = document.getElementById('assignAmount').value;

    const { error } = await supabase.from('class_fees').insert([{
        class_id: classId,
        fee_type_id: feeTypeId,
        amount: amount
    }]);

    if (error) {
        if (error.code === '23505') { // Unique violation
            toast.warning('This fee type is already assigned to this class.');
        } else {
            toast.error('Error assigning fee: ' + error.message);
        }
    } else {
        closeAssignFeeModal();
        fetchClassFees(classId);
    }
}

window.deleteClassFee = async (id) => {
    if (!await confirm('Remove this fee from the class?')) return;

    const { error } = await supabase.from('class_fees').delete().eq('id', id);
    if (error) {
        toast.error('Error removing fee: ' + error.message);
    } else {
        fetchClassFees(selectedClassId);
    }
};
