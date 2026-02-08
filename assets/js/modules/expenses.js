// Expenses Module
const supabase = window.supabase;
let currentExpenses = [];

export async function render(container) {
    container.innerHTML = `
        <div class="space-y-6 animate-fadeIn">
            <!-- Header Section -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Expenses Management</h2>
                    <p class="text-gray-500 dark:text-gray-400 mt-1">Track and manage all school operational costs</p>
                </div>
                <button id="addExpenseBtn" class="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-lg shadow-indigo-600/20 font-semibold group">
                    <svg class="w-5 h-5 transition-transform group-hover:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    Add Expense
                </button>
            </div>

            <!-- Filters Section -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div class="relative">
                    <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </span>
                    <input type="text" id="expenseSearch" placeholder="Search by title or description..." 
                        class="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all">
                </div>
                <div>
                    <select id="categoryFilter" class="app-select w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all" style="color-scheme: dark;">
                        <option value="">All Categories</option>
                        <option value="Staff Salaries">Staff Salaries</option>
                        <option value="Utilities">Utilities</option>
                        <option value="Rent">Rent</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Stationery">Stationery</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="flex gap-2 text-sm">
                    <div class="flex-1 flex items-center justify-between p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 rounded-lg border border-indigo-100 dark:border-indigo-800">
                        <span>Total Expenses</span>
                        <span id="totalExDisplay" class="font-bold">PKR 0</span>
                    </div>
                </div>
            </div>

            <!-- Table Section -->
            <div class="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider font-semibold">
                                <th class="px-6 py-4">Title</th>
                                <th class="px-6 py-4">Category</th>
                                <th class="px-6 py-4">Amount</th>
                                <th class="px-6 py-4">Date</th>
                                <th class="px-6 py-4">Description</th>
                                <th class="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="expensesTableBody" class="divide-y divide-gray-100 dark:divide-gray-700">
                            <!-- Rows will be injected here -->
                            <tr>
                                <td colspan="6" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400">Loading expenses...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Add/Edit Expense Modal -->
        <div id="expenseModal" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] hidden items-center justify-center p-4">
            <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all opacity-0 scale-95 translate-y-4 duration-300">
                <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-indigo-600">
                    <h3 id="modalTitle" class="text-xl font-bold text-white">Add New Expense</h3>
                    <button id="closeModalBtn" class="text-indigo-100 hover:text-white transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>
                <form id="expenseForm" class="p-6 space-y-4">
                    <input type="hidden" id="expenseId" name="id">
                    
                    <div class="grid grid-cols-1 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expense Title*</label>
                            <input type="text" name="title" required placeholder="e.g., Electricity Bill Jan"
                                class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all">
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category*</label>
                                <select name="category" required class="app-select w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 transition-all" style="color-scheme: dark;">
                                    <option value="">Select Category</option>
                                    <option value="Staff Salaries">Staff Salaries</option>
                                    <option value="Utilities">Utilities</option>
                                    <option value="Rent">Rent</option>
                                    <option value="Maintenance">Maintenance</option>
                                    <option value="Stationery">Stationery</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount (PKR)*</label>
                                <input type="number" name="amount" required step="0.01" placeholder="0.00"
                                    class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all">
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date*</label>
                            <input type="date" name="date" required
                                class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all">
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                            <textarea name="description" rows="3" placeholder="Optional notes about this expense..."
                                class="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white transition-all resize-none"></textarea>
                        </div>
                    </div>

                    <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button type="button" id="cancelBtn" class="px-6 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl font-medium transition-colors">
                            Cancel
                        </button>
                        <button type="submit" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2">
                            <span id="submitBtnText">Save Expense</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Initialize module logic
    initExpenses();
}

async function initExpenses() {
    const tableBody = document.getElementById('expensesTableBody');
    const searchInput = document.getElementById('expenseSearch');
    const categoryFilter = document.getElementById('categoryFilter');
    const addBtn = document.getElementById('addExpenseBtn');
    const modal = document.getElementById('expenseModal');
    const modalContent = modal.querySelector('div');
    const form = document.getElementById('expenseForm');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    // Fetch initial data
    await fetchExpenses();

    // Event Listeners
    addBtn.addEventListener('click', () => openModal());
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    searchInput.addEventListener('input', debounce(() => renderTable(), 300));
    categoryFilter.addEventListener('change', () => renderTable());

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        data.amount = parseFloat(data.amount);

        try {
            window.loadingOverlay.show('Saving expense...');
            let error;
            if (data.id) {
                ({ error } = await supabase.from('expenses').update(data).eq('id', data.id));
            } else {
                delete data.id;
                ({ error } = await supabase.from('expenses').insert(data));
            }

            if (error) throw error;

            window.toast.success(`Expense ${data.id ? 'updated' : 'added'} successfully`);
            closeModal();
            await fetchExpenses();
        } catch (err) {
            console.error('Error saving expense:', err);
            window.toast.error(err.message);
        } finally {
            window.loadingOverlay.hide();
        }
    });

    // Modal Helpers
    function openModal(item = null) {
        // Move modal to body
        if (modal.parentElement !== document.body) document.body.appendChild(modal);

        form.reset();
        document.getElementById('modalTitle').textContent = item ? 'Edit Expense' : 'Add New Expense';
        document.getElementById('submitBtnText').textContent = item ? 'Update Expense' : 'Save Expense';

        if (item) {
            document.getElementById('expenseId').value = item.id;
            form.querySelector('[name="title"]').value = item.title;
            form.querySelector('[name="category"]').value = item.category;
            form.querySelector('[name="amount"]').value = item.amount;
            form.querySelector('[name="date"]').value = item.date;
            form.querySelector('[name="description"]').value = item.description || '';
        } else {
            form.querySelector('[name="date"]').value = new Date().toISOString().split('T')[0];
        }

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => {
            modalContent.classList.remove('opacity-0', 'scale-95', 'translate-y-4');
            modalContent.classList.add('opacity-100', 'scale-100', 'translate-y-0');
        }, 10);
    }

    function closeModal() {
        modalContent.classList.add('opacity-0', 'scale-95', 'translate-y-4');
        modalContent.classList.remove('opacity-100', 'scale-100', 'translate-y-0');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 300);
    }
}

async function fetchExpenses() {
    try {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .order('date', { ascending: false });

        if (error) {
            // Check if table exists
            if (error.code === 'P0001' || error.message.includes('relation "expenses" does not exist')) {
                document.getElementById('expensesTableBody').innerHTML = `
                    <tr>
                        <td colspan="6" class="px-6 py-12 text-center">
                            <div class="flex flex-col items-center gap-3">
                                <div class="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                                    <svg class="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                    </svg>
                                </div>
                                <p class="text-gray-900 dark:text-white font-semibold">Table Not Found</p>
                                <p class="text-gray-500 dark:text-gray-400 text-sm max-w-xs">The "expenses" table doesn't exist in your database. Please run the SQL migration.</p>
                            </div>
                        </td>
                    </tr>
                `;
                return;
            }
            throw error;
        }

        currentExpenses = data || [];
        renderTable();
    } catch (err) {
        console.error('Error fetching expenses:', err);
    }
}

function renderTable() {
    const tableBody = document.getElementById('expensesTableBody');
    const search = document.getElementById('expenseSearch').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;

    const filtered = currentExpenses.filter(ex => {
        const matchesSearch = ex.title.toLowerCase().includes(search) || (ex.description && ex.description.toLowerCase().includes(search));
        const matchesCategory = !category || ex.category === category;
        return matchesSearch && matchesCategory;
    });

    // Update Totals
    const total = filtered.reduce((sum, ex) => sum + parseFloat(ex.amount), 0);
    document.getElementById('totalExDisplay').textContent = `PKR ${total.toLocaleString()}`;

    if (filtered.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="px-6 py-12 text-center text-gray-500">No expenses found matching your criteria.</td></tr>`;
        return;
    }

    tableBody.innerHTML = filtered.map(ex => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">${ex.title}</td>
            <td class="px-6 py-4">
                <span class="px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryStyle(ex.category)}">
                    ${ex.category}
                </span>
            </td>
            <td class="px-6 py-4 font-bold text-gray-900 dark:text-white">PKR ${parseFloat(ex.amount).toLocaleString()}</td>
            <td class="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm">${new Date(ex.date).toLocaleDateString()}</td>
            <td class="px-6 py-4 text-gray-500 dark:text-gray-400 text-sm max-w-xs truncate">${ex.description || '-'}</td>
            <td class="px-6 py-4 text-right space-x-2">
                <button onclick="window.editExpense('${ex.id}')" class="p-1.5 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                </button>
                <button onclick="window.deleteExpense('${ex.id}')" class="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </td>
        </tr>
    `).join('');
}

function getCategoryStyle(cat) {
    switch (cat) {
        case 'Staff Salaries': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
        case 'Utilities': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
        case 'Rent': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
        case 'Maintenance': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
        case 'Stationery': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
        default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-400';
    }
}

// Global handlers for table actions
window.editExpense = (id) => {
    const item = currentExpenses.find(ex => ex.id === id);
    if (item) {
        // Need to access the local openModal function. 
        // We'll expose it or just use a message.
        // Actually, since this is a module, we can expose a dedicated function.
    }
};

window.deleteExpense = async (id) => {
    if (await window.confirmDialog.show({
        title: 'Delete Expense',
        message: 'Are you sure you want to delete this expense record? This action cannot be undone.',
        type: 'danger'
    })) {
        try {
            window.loadingOverlay.show('Deleting...');
            const { error } = await supabase.from('expenses').delete().eq('id', id);
            if (error) throw error;
            window.toast.success('Expense deleted successfully');
            await fetchExpenses();
        } catch (err) {
            window.toast.error(err.message);
        } finally {
            window.loadingOverlay.hide();
        }
    }
};

// Re-implementing edit mapping safely
window.editExpense = (id) => {
    const item = currentExpenses.find(ex => ex.id === id);
    if (item) {
        // Find the modal and form in DOM
        const modal = document.getElementById('expenseModal');
        const modalContent = modal.querySelector('div');
        const form = document.getElementById('expenseForm');

        document.getElementById('modalTitle').textContent = 'Edit Expense';
        document.getElementById('submitBtnText').textContent = 'Update Expense';
        document.getElementById('expenseId').value = item.id;
        form.querySelector('[name="title"]').value = item.title;
        form.querySelector('[name="category"]').value = item.category;
        form.querySelector('[name="amount"]').value = item.amount;
        form.querySelector('[name="date"]').value = item.date;
        form.querySelector('[name="description"]').value = item.description || '';

        modal.classList.remove('hidden');
        modal.classList.add('flex');
        setTimeout(() => {
            modalContent.classList.remove('opacity-0', 'scale-95', 'translate-y-4');
            modalContent.classList.add('opacity-100', 'scale-100', 'translate-y-0');
        }, 10);
    }
};

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
