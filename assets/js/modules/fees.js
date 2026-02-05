// Use global Supabase client for production compatibility
const supabase = window.supabase || (() => {
    console.error('Supabase client not found on window object');
    throw new Error('Supabase client not initialized');
})();

// Import receipt generator
import { generateReceipt } from './receipt-generator.js';

export async function render(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Header with Stats -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <!-- Total Fees Card -->
                <div class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                    <div class="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-indigo-500/20"></div>
                    <div class="flex justify-between items-start relative z-10">
                        <div>
                            <p class="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Fees</p>
                            <h3 class="text-2xl font-black text-gray-800 dark:text-gray-100 mt-1" id="statTotalFees">...</h3>
                            <div class="flex items-center mt-2 text-xs">
                                <span class="flex items-center text-green-500 font-bold bg-green-500/10 px-1.5 py-0.5 rounded">
                                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                                    12%
                                </span>
                                <span class="text-gray-400 ml-2">vs last month</span>
                            </div>
                        </div>
                        <div class="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- Collected Card -->
                <div class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                    <div class="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-emerald-500/20"></div>
                    <div class="flex justify-between items-start relative z-10">
                        <div>
                            <p class="text-xs font-bold text-gray-400 uppercase tracking-wider">Collected</p>
                            <h3 class="text-2xl font-black text-gray-800 dark:text-gray-100 mt-1" id="statCollected">...</h3>
                            <div class="flex items-center mt-2 text-xs">
                                <span class="flex items-center text-emerald-500 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                                    Good
                                </span>
                                <span class="text-gray-400 ml-2">on track</span>
                            </div>
                        </div>
                        <div class="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- Pending Card -->
                <div class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                    <div class="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-rose-500/20"></div>
                    <div class="flex justify-between items-start relative z-10">
                        <div>
                            <p class="text-xs font-bold text-gray-400 uppercase tracking-wider">Pending</p>
                            <h3 class="text-2xl font-black text-gray-800 dark:text-gray-100 mt-1" id="statPending">...</h3>
                            <div class="flex items-center mt-2 text-xs">
                                <span class="flex items-center text-rose-500 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded">
                                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                    Action
                                </span>
                                <span class="text-gray-400 ml-2">needs follow-up</span>
                            </div>
                        </div>
                        <div class="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl shadow-lg shadow-rose-500/20 group-hover:scale-110 transition-transform duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- Collection Rate Card -->
                <div class="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                     <div class="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-blue-500/20"></div>
                    <div class="flex justify-between items-start relative z-10">
                        <div>
                            <p class="text-xs font-bold text-gray-400 uppercase tracking-wider">Rate</p>
                            <h3 class="text-2xl font-black text-gray-800 dark:text-gray-100 mt-1" id="statRate">0%</h3>
                            <div class="flex items-center mt-2 text-xs">
                                <span class="text-gray-400">Total collection efficiency</span>
                            </div>
                        </div>
                        <div class="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Filters and Search -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Student</label>
                        <input type="text" id="searchStudent" placeholder="Name or Roll No" 
                            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Class</label>
                        <select id="filterClass" 
                            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            <option value="">All Classes</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Month</label>
                        <input type="month" id="filterMonth" 
                            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Status</label>
                        <select id="filterStatus" 
                            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            <option value="">All Status</option>
                            <option value="paid">Paid</option>
                            <option value="unpaid">Unpaid</option>
                            <option value="partial">Partial</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Fee Collection Table -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm uppercase tracking-wider">
                                <th class="p-4 font-semibold">Student</th>
                                <th class="p-4 font-semibold">Total Amount</th>
                                <th class="p-4 font-semibold">Paid</th>
                                <th class="p-4 font-semibold">Balance</th>
                                <th class="p-4 font-semibold text-center">Status</th>
                                <th class="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="feesTableBody" class="text-gray-700 dark:text-gray-300 text-sm divide-y divide-gray-100 dark:divide-gray-700">
                            <tr><td colspan="8" class="p-4 text-center">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Payment Modal -->
        <div id="paymentModal" class="modal-overlay fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 backdrop-blur-sm">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 my-4 overflow-hidden max-h-[90vh] flex flex-col">
                <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700">
                    <h3 class="text-lg font-bold text-gray-800 dark:text-white">Collect Payment</h3>
                    <button id="closePaymentModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div class="p-6 overflow-y-auto flex-1">
                    <input type="hidden" id="paymentFeeId">
                    <input type="hidden" id="paymentStudentId">
                    
                    <!-- Fee Details -->
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p class="text-gray-500 dark:text-gray-400">Student</p>
                                <p class="font-medium text-gray-800 dark:text-white" id="paymentStudentName">-</p>
                            </div>
                            <div>
                                <p class="text-gray-500 dark:text-gray-400">Fee Type</p>
                                <p class="font-medium text-gray-800 dark:text-white" id="paymentFeeType">-</p>
                            </div>
                            <div>
                                <p class="text-gray-500 dark:text-gray-400">Total Amount</p>
                                <p class="font-medium text-gray-800 dark:text-white" id="paymentTotalAmount">...</p>
                            </div>
                            <div>
                                <p class="text-gray-500 dark:text-gray-400">Already Paid</p>
                                <p class="font-medium text-green-600 dark:text-green-400" id="paymentAlreadyPaid">...</p>
                            </div>
                            <div class="col-span-2">
                                <p class="text-gray-500 dark:text-gray-400">Remaining Balance</p>
                                <p class="text-2xl font-bold text-red-600 dark:text-red-400" id="paymentBalance">...</p>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Form -->
                    <form id="paymentForm" class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Amount Paying</label>
                                <input type="number" id="paymentAmount" required min="0.01" step="0.01" 
                                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Date</label>
                                <input type="date" id="paymentDate" required 
                                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            </div>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Payment Method</label>
                            <select id="paymentMethod" required 
                                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                <option value="Cash">Cash</option>
                                <option value="Bank">Bank Transfer</option>
                                <option value="JazzCash">JazzCash</option>
                                <option value="EasyPaisa">EasyPaisa</option>
                                <option value="Cheque">Cheque</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes (Optional)</label>
                            <textarea id="paymentNotes" rows="3" 
                                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"></textarea>
                        </div>
                    </form>

                    <!-- Payment History -->
                    <div class="mt-6">
                        <h4 class="font-semibold text-gray-800 dark:text-white mb-3">Payment History</h4>
                        <div id="paymentHistory" class="space-y-2 max-h-40 overflow-y-auto">
                            <!-- Populated dynamically -->
                        </div>
                    </div>
                </div>
                <div class="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                    <div class="flex justify-end space-x-3">
                        <button type="button" id="cancelPaymentBtn" class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button type="button" id="submitPaymentBtn" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
                            Record Payment
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Fee History Modal -->
        <div id="historyModal" class="modal-overlay fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 backdrop-blur-sm">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl mx-4 my-4 overflow-hidden max-h-[90vh] flex flex-col">
                <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700">
                    <div>
                        <h3 class="text-lg font-bold text-gray-800 dark:text-white">Fee History</h3>
                        <p id="historyStudentName" class="text-sm text-gray-500 dark:text-gray-400">-</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <button id="printHistoryReceipt" class="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print Slip
                        </button>
                        <button id="closeHistoryModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="p-6 overflow-y-auto flex-1 space-y-8">
                    <!-- Billing History -->
                    <div>
                        <h4 class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center">
                            <span class="w-1 h-3 bg-indigo-500 mr-2 rounded-full"></span>
                            Billing History (Fees)
                        </h4>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                                        <th class="pb-3 font-semibold">Month/Date</th>
                                        <th class="pb-3 font-semibold">Type</th>
                                        <th class="pb-3 font-semibold">Amount</th>
                                        <th class="pb-3 font-semibold">Paid</th>
                                        <th class="pb-3 font-semibold">Balance</th>
                                        <th class="pb-3 font-semibold">Status</th>
                                        <th class="pb-3 font-semibold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="historyTableBody" class="text-gray-700 dark:text-gray-300 text-sm">
                                    <!-- Populated dynamically -->
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Payment Transaction History -->
                    <div>
                        <h4 class="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4 flex items-center">
                            <span class="w-1 h-3 bg-green-500 mr-2 rounded-full"></span>
                            Payment Transactions (Receipts)
                        </h4>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr class="text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                                        <th class="pb-3 font-semibold">Date</th>
                                        <th class="pb-3 font-semibold">Receipt #</th>
                                        <th class="pb-3 font-semibold">Method</th>
                                        <th class="pb-3 font-semibold">Amount</th>
                                        <th class="pb-3 font-semibold text-right">Fee Type/Month</th>
                                    </tr>
                                </thead>
                                <tbody id="paymentHistoryTableBody" class="text-gray-700 dark:text-gray-300">
                                    <tr><td colspan="5" class="py-8 text-center text-gray-500">No transactions found.</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex justify-end">
                    <button type="button" onclick="window.closeHistoryModal()" class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-lg transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;

    // Event Listeners
    document.getElementById('searchStudent').addEventListener('input', debounce(fetchFees, 300));
    document.getElementById('filterClass').addEventListener('change', fetchFees);
    document.getElementById('filterMonth').addEventListener('change', fetchFees);
    document.getElementById('filterStatus').addEventListener('change', fetchFees);
    document.getElementById('closePaymentModal').addEventListener('click', closePaymentModal);
    document.getElementById('cancelPaymentBtn').addEventListener('click', closePaymentModal);
    document.getElementById('submitPaymentBtn').addEventListener('click', handlePayment);
    document.getElementById('closeHistoryModal').addEventListener('click', window.closeHistoryModal);

    // Set default date to today
    document.getElementById('paymentDate').valueAsDate = new Date();

    // Load initial data
    await loadClasses();
    await fetchStats();
    await fetchFees();
}

async function loadClasses() {
    const select = document.getElementById('filterClass');
    const { data } = await supabase.from('classes').select('class_name').order('class_name');

    if (data) {
        const options = data.map(c => `<option value="${c.class_name}">${c.class_name}</option>`).join('');
        select.innerHTML = '<option value="">All Classes</option>' + options;
    }
}

async function fetchStats() {
    const { data, error } = await supabase
        .from('fees')
        .select('final_amount, paid_amount');

    if (error) {
        console.error('Error fetching stats:', error);
        return;
    }

    const totalFees = data.reduce((sum, f) => sum + Number(f.final_amount || 0), 0);
    const collected = data.reduce((sum, f) => sum + Number(f.paid_amount || 0), 0);
    const pending = totalFees - collected;
    const rate = totalFees > 0 ? (collected / totalFees * 100) : 0;

    document.getElementById('statTotalFees').textContent = window.formatCurrency(totalFees);
    document.getElementById('statCollected').textContent = window.formatCurrency(collected);
    document.getElementById('statPending').textContent = window.formatCurrency(pending);
    document.getElementById('statRate').textContent = `${rate.toFixed(1)}%`;
}

async function fetchFees() {
    const tbody = document.getElementById('feesTableBody');
    tbody.innerHTML = '<tr><td colspan="8" class="p-4 text-center">Loading...</td></tr>';

    // Get filter values
    const search = document.getElementById('searchStudent').value.toLowerCase();
    const classFilter = document.getElementById('filterClass').value;
    const monthFilter = document.getElementById('filterMonth').value;
    const statusFilter = document.getElementById('filterStatus').value;

    let query = supabase
        .from('fees')
        .select(`
            *,
            students (id, name, roll_no, class, father_cnic, family_code)
        `)
        .order('issued_at', { ascending: false });

    if (monthFilter) {
        query = query.eq('month', monthFilter);
    }

    if (statusFilter) {
        query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching fees:', error);
        tbody.innerHTML = `<tr><td colspan="8" class="p-4 text-center text-red-500">Error: ${error.message}</td></tr>`;
        return;
    }

    // Apply client-side filters
    let filteredData = data;

    if (search) {
        filteredData = filteredData.filter(fee =>
            fee.students?.name.toLowerCase().includes(search) ||
            fee.students?.roll_no.toLowerCase().includes(search)
        );
    }

    if (classFilter) {
        filteredData = filteredData.filter(fee => fee.students?.class === classFilter);
    }

    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="p-4 text-center text-gray-400">No fee records found.</td></tr>';
        return;
    }

    // Group by Student
    const studentGroups = new Map();

    filteredData.forEach(fee => {
        const studentId = fee.student_id;
        if (!studentGroups.has(studentId)) {
            studentGroups.set(studentId, {
                student: fee.students,
                total: 0,
                paid: 0,
                count: 0
            });
        }
        const group = studentGroups.get(studentId);
        group.total += Number(fee.final_amount || fee.amount || 0);
        group.paid += Number(fee.paid_amount || 0);
        group.count++;
    });

    if (studentGroups.size === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="p-12 text-center">
                    <div class="flex flex-col items-center justify-center opacity-50">
                        <div class="w-16 h-16 bg-indigo-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                            <svg class="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                            </svg>
                        </div>
                        <h4 class="text-lg font-bold text-gray-700 dark:text-gray-300">No Students Found</h4>
                        <p class="text-sm text-gray-500 dark:text-gray-500 mt-1">Try adjusting your filters or search terms</p>
                    </div>
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = Array.from(studentGroups.values()).map(group => {
        const balance = group.total - group.paid;
        const student = group.student;
        const percentage = group.total > 0 ? (group.paid / group.total) * 100 : 0;

        return `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-700/50">
                <td class="p-4 align-middle">
                    <div class="font-bold text-gray-800 dark:text-gray-100">${student?.name || 'Unknown'}</div>
                    <div class="text-xs text-gray-400 font-mono mt-1">Roll: <span class="text-gray-500 dark:text-gray-400">${student?.roll_no || '-'}</span> <span class="mx-1">|</span> Class: <span class="text-gray-500 dark:text-gray-400">${student?.class || '-'}</span></div>
                </td>
                <td class="p-4 align-middle font-semibold text-gray-700 dark:text-gray-200 tracking-wide">${window.formatCurrency(group.total)}</td>
                <td class="p-4 align-middle font-semibold text-green-600 dark:text-green-400 tracking-wide">${window.formatCurrency(group.paid)}</td>
                <td class="p-4 align-middle font-bold ${balance > 0 ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'} tracking-wide">${window.formatCurrency(balance)}</td>
                <td class="p-4 align-middle text-center">
                    <span class="px-3 py-1 text-[10px] font-bold tracking-wider rounded-md border backdrop-blur-md uppercase ${balance <= 0
                ? 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400'
                : group.paid > 0
                    ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20 dark:text-yellow-400'
                    : 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400'
            }">
                        ${balance <= 0 ? 'PAID' : (group.paid > 0 ? 'PARTIAL' : 'UNPAID')}
                    </span>
                </td>
                <td class="p-4 align-middle text-right">
                    <div class="flex items-center justify-end gap-3">
                        <!-- Receipt (Eye) -->
                        <button onclick="window.printStudentReceipt('${student?.id}')" title="View Receipt"
                            class="group p-2 rounded-lg border border-blue-200 dark:border-blue-800 text-blue-500 dark:text-blue-400 hover:bg-blue-500 hover:text-white hover:border-blue-500 transition-all duration-200">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </button>

                        <!-- Sibling Receipt (Users) -->
                        ${student?.father_cnic || student?.family_code ? `
                            <button onclick="window.printParentReceipt('${student.father_cnic || ''}', '${student.family_code || ''}')" title="Sibling Receipt"
                                class="group p-2 rounded-lg border border-purple-200 dark:border-purple-800 text-purple-500 dark:text-purple-400 hover:bg-purple-600 hover:text-white hover:border-purple-600 transition-all duration-200">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </button>
                        ` : ''}

                        <!-- History (Clock) -->
                        <button onclick="window.viewFeeHistory('${student?.id}', '${student?.name?.replace(/'/g, "\\\\'")}')" title="View History"
                            class="group p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-400 hover:bg-gray-500 hover:text-white hover:border-gray-500 transition-all duration-200">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                        
                        <!-- Collect (Wallet/Plus) -->
                        ${balance > 0 ? `
                            <button onclick="window.viewFeeHistory('${student?.id}', '${student?.name?.replace(/'/g, "\\\\'")}')" 
                                class="group flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-500/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-200 font-semibold text-xs tracking-wide">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm-5-1a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span>Collect</span>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

window.openPayment = async (feeId, studentId, studentName, feeType, totalAmount, paidAmount) => {
    const balance = totalAmount - paidAmount;

    document.getElementById('paymentFeeId').value = feeId;
    document.getElementById('paymentStudentId').value = studentId;
    document.getElementById('paymentStudentName').textContent = studentName;
    document.getElementById('paymentFeeType').textContent = feeType;
    document.getElementById('paymentTotalAmount').textContent = window.formatCurrency(totalAmount);
    document.getElementById('paymentAlreadyPaid').textContent = window.formatCurrency(paidAmount);
    document.getElementById('paymentBalance').textContent = window.formatCurrency(balance);
    document.getElementById('paymentAmount').value = balance.toFixed(2);
    document.getElementById('paymentAmount').max = balance;

    // Load payment history
    await loadPaymentHistory(feeId);

    const modal = document.getElementById('paymentModal');

    // Move modal to body to break out of dashboard layout
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

window.viewFeeHistory = async (studentId, studentName) => {
    if (!studentId) return;

    const modal = document.getElementById('historyModal');
    const nameEl = document.getElementById('historyStudentName');
    const tbody = document.getElementById('historyTableBody');

    nameEl.textContent = studentName;
    tbody.innerHTML = '<tr><td colspan="6" class="py-8 text-center text-gray-500">Loading history...</td></tr>';

    // Set up print button
    const printBtn = document.getElementById('printHistoryReceipt');
    printBtn.onclick = () => window.printStudentReceipt(studentId);

    // Move modal to body
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    try {
        // Fetch Fees (Billing History)
        const { data: feesData, error: feesError } = await supabase
            .from('fees')
            .select('*')
            .eq('student_id', studentId)
            .order('month', { ascending: false });

        if (feesError) throw feesError;

        if (!feesData || feesData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="py-8 text-center text-gray-500">No fee history found.</td></tr>';
        } else {
            tbody.innerHTML = feesData.map(fee => {
                const final = Number(fee.final_amount || 0);
                const paid = Number(fee.paid_amount || 0);
                const balance = final - paid;
                const status = fee.status || 'unpaid';

                return `
                    <tr class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td class="py-4 font-medium text-gray-900 dark:text-white">${fee.month}</td>
                        <td class="py-4">${fee.fee_type}</td>
                        <td class="py-4">${window.formatCurrency(final)}</td>
                        <td class="py-4 text-green-600 dark:text-green-400">${window.formatCurrency(paid)}</td>
                        <td class="py-4 font-medium ${balance > 0 ? 'text-red-500' : 'text-gray-500'}">${window.formatCurrency(balance)}</td>
                        <td class="py-4">
                            <span class="px-2 py-0.5 text-[10px] font-bold rounded-full ${status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        status === 'partial' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}">
                                ${status.toUpperCase()}
                            </span>
                        </td>
                        <td class="py-4 text-right">
                            ${balance > 0 ? `
                                <button onclick="window.openPayment('${fee.id}', '${studentId}', '${studentName?.replace(/'/g, "\\'")}', '${fee.fee_type}', ${final}, ${paid})" 
                                    class="text-indigo-600 hover:text-indigo-900 dark:hover:text-indigo-400 font-medium text-xs">
                                    Pay
                                </button>
                            ` : '<span class="text-green-500 text-xs font-medium">Clear</span>'}
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // Fetch Payments (Transaction History)
        const paymentTbody = document.getElementById('paymentHistoryTableBody');
        const { data: paymentsData, error: paymentsError } = await supabase
            .from('fee_payments')
            .select('*, fees(fee_type, month)')
            .eq('student_id', studentId)
            .order('payment_date', { ascending: false });

        if (paymentsError) throw paymentsError;

        if (!paymentsData || paymentsData.length === 0) {
            paymentTbody.innerHTML = '<tr><td colspan="5" class="py-8 text-center text-gray-500">No payment transactions found.</td></tr>';
        } else {
            paymentTbody.innerHTML = paymentsData.map(payment => `
                <tr class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td class="py-3">${new Date(payment.payment_date).toLocaleDateString('en-GB')}</td>
                    <td class="py-3 text-xs font-mono text-gray-500">${payment.receipt_no || 'REC-' + payment.id.toString().slice(-6).toUpperCase()}</td>
                    <td class="py-3">${payment.payment_method}</td>
                    <td class="py-3 font-bold text-green-600 dark:text-green-400">${window.formatCurrency(payment.amount_paid)}</td>
                    <td class="py-3 text-right">
                        <div class="text-xs text-gray-800 dark:text-gray-200">${payment.fees?.fee_type || 'General'}</div>
                        <div class="text-[10px] text-gray-400">${payment.fees?.month || '-'}</div>
                    </td>
                </tr>
            `).join('');
        }

    } catch (err) {
        console.error('Error loading history:', err);
        tbody.innerHTML = '<tr><td colspan="7" class="py-8 text-center text-red-500">Error loading record.</td></tr>';
    }
};

window.closeHistoryModal = () => {
    const modal = document.getElementById('historyModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
};

async function loadPaymentHistory(feeId) {
    const container = document.getElementById('paymentHistory');
    container.innerHTML = '<p class="text-sm text-gray-500">Loading...</p>';

    const { data, error } = await supabase
        .from('fee_payments')
        .select('*')
        .eq('fee_id', feeId)
        .order('payment_date', { ascending: false });

    if (error) {
        container.innerHTML = '<p class="text-sm text-red-500">Error loading history</p>';
        return;
    }

    if (!data || data.length === 0) {
        container.innerHTML = '<p class="text-sm text-gray-400">No previous payments</p>';
        return;
    }

    container.innerHTML = data.map(payment => `
        <div class="flex justify-between items-center text-sm bg-gray-100 dark:bg-gray-600 p-2 rounded">
            <div>
                <span class="font-medium text-gray-800 dark:text-white">${window.formatCurrency(payment.amount_paid)}</span>
                <span class="text-gray-500 dark:text-gray-400 ml-2">${payment.payment_method}</span>
            </div>
            <span class="text-gray-500 dark:text-gray-400">${new Date(payment.payment_date).toLocaleDateString()}</span>
        </div>
    `).join('');
}

function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.getElementById('paymentForm').reset();
    document.getElementById('paymentDate').valueAsDate = new Date();
}

async function handlePayment() {
    const feeId = document.getElementById('paymentFeeId').value;
    const studentId = document.getElementById('paymentStudentId').value;
    const amount = document.getElementById('paymentAmount').value;
    const date = document.getElementById('paymentDate').value;
    const method = document.getElementById('paymentMethod').value;
    const notes = document.getElementById('paymentNotes').value;

    if (!amount || amount <= 0) {
        toast.warning('Please enter a valid amount');
        return;
    }

    const btn = document.getElementById('submitPaymentBtn');
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Processing...';

    try {
        // Insert payment record
        const { error: paymentError } = await supabase
            .from('fee_payments')
            .insert([{
                fee_id: feeId,
                student_id: studentId,
                amount_paid: amount,
                payment_date: date,
                payment_method: method,
                notes: notes
            }]);

        if (paymentError) throw paymentError;

        toast.success('Payment recorded successfully!');

        // Auto-generate receipt with payment info
        const paymentInfo = {
            amountPaid: window.formatCurrency(amount),
            balance: window.formatCurrency(document.getElementById('paymentBalance').textContent.replace(/[^0-9.]/g, '') - amount),
            date: new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '/'),
            method: method,
            receiptNo: 'NEW' // Temporary until we get DB ID if needed, or just leave for manual entry if preferred
        };

        closePaymentModal();
        await fetchStats();
        await fetchFees();

        // Prompt for receipt
        const shouldPrint = await confirmDialog.show({
            title: 'Payment Successful',
            message: 'Would you like to print the receipt now?',
            confirmText: 'Print Receipt',
            cancelText: 'Later',
            type: 'info'
        });

        if (shouldPrint) {
            await generateReceipt([studentId], false, 'Office Copy', paymentInfo);
        }

        // Refresh history if open
        const historyModal = document.getElementById('historyModal');
        if (historyModal && !historyModal.classList.contains('hidden')) {
            const studentId = document.getElementById('paymentStudentId').value;
            const studentName = document.getElementById('historyStudentName').textContent;
            await window.viewFeeHistory(studentId, studentName);
        }

    } catch (error) {
        console.error('Error recording payment:', error);
        toast.error('Error recording payment: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = originalText;
    }
}

// Print Handlers
window.printStudentReceipt = async (studentId) => {
    if (!studentId) return;
    await generateReceipt([studentId]);
};

window.printParentReceipt = async (fatherCNIC, familyCode = null) => {
    if (!fatherCNIC && !familyCode) return;

    let query = supabase.from('students').select('id');

    if (familyCode) {
        query = query.eq('family_code', familyCode);
    } else {
        query = query.eq('father_cnic', fatherCNIC);
    }

    const { data: siblings, error } = await query;

    if (error) {
        toast.error('Error finding siblings: ' + error.message);
        return;
    }

    if (!siblings || siblings.length === 0) {
        toast.error('No students found for this family');
        return;
    }

    const ids = siblings.map(s => s.id);
    await generateReceipt(ids, true);
};

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
