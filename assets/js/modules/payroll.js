// Use global Supabase client for production compatibility
// Last Updated: Smart Payroll System
const supabase = window.supabase || (() => {
    console.error('Supabase client not found on window object');
    throw new Error('Supabase client not initialized');
})();

let teachers = [];
let staff = [];
let salaries = [];       // teacher_salaries
let staffSalaries = [];  // staff_salaries (same structure: staff_id, base_salary, monthly_working_days)
let payrollData = [];
let attendanceData = [];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export async function render(container) {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    container.innerHTML = `
        <div class="space-y-6">
            <!-- Header -->
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Payroll & Salary Management</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage teacher and staff salaries and process monthly payments with automated deductions.</p>
                </div>
                
                <!-- Period Selector -->
                <div class="flex bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 border border-gray-200 dark:border-gray-700">
                    <select id="payrollMonth" class="bg-transparent border-none text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-0 cursor-pointer">
                        ${MONTHS.map((m, i) => `<option value="${i + 1}" ${i + 1 === currentMonth ? 'selected' : ''}>${m}</option>`).join('')}
                    </select>
                    <div class="w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
                    <select id="payrollYear" class="bg-transparent border-none text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-0 cursor-pointer">
                        ${[currentYear - 1, currentYear, currentYear + 1].map(y => `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('')}
                    </select>
                </div>
            </div>

            <!-- Main Content Area -->
            <div class="bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 overflow-hidden min-h-[600px] flex flex-col">
                
                <!-- Custom Tabs -->
                <div class="flex border-b border-gray-200 dark:border-gray-800">
                    <button id="tabProcess" class="flex-1 px-6 py-4 text-sm font-medium text-primary-600 border-b-2 border-primary-600 bg-primary-50/50 dark:bg-primary-900/10 dark:text-primary-400 dark:border-primary-400 transition-colors">
                        <div class="flex items-center justify-center gap-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            Process Payroll
                        </div>
                    </button>
                    <button id="tabSetup" class="flex-1 px-6 py-4 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors border-b-2 border-transparent">
                         <div class="flex items-center justify-center gap-2">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            Manage Salary (Setup)
                        </div>
                    </button>
                </div>

                <!-- Views Container -->
                <div class="p-6 flex-1 bg-gray-50/50 dark:bg-black/20">
                    
                    <!-- View 1: Payroll Processing -->
                    <div id="viewProcess" class="space-y-4">
                         <!-- Stats Row -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div class="text-xs font-semibold text-gray-500 uppercase">Pending Payments</div>
                                <div id="statPending" class="text-2xl font-bold text-yellow-600 mt-1">0</div>
                            </div>
                            <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div class="text-xs font-semibold text-gray-500 uppercase">Processed Payments</div>
                                <div id="statProcessed" class="text-2xl font-bold text-green-600 mt-1">0</div>
                            </div>
                            <div class="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                <div class="text-xs font-semibold text-gray-500 uppercase">Total Payout (This Month)</div>
                                <div id="statTotal" class="text-2xl font-bold text-primary-600 mt-1">Rs 0</div>
                            </div>
                        </div>

                        <!-- Processing List -->
                        <div class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <table class="w-full text-sm text-left">
                                <thead class="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th class="px-6 py-4">Employee</th>
                                        <th class="px-6 py-4 text-center">Type</th>
                                        <th class="px-6 py-4 text-center">Status</th>
                                        <th class="px-6 py-4 text-right">Base Salary</th>
                                        <th class="px-6 py-4 text-right">Net Payout</th>
                                        <th class="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody id="processTableBody" class="divide-y divide-gray-200 dark:divide-gray-800">
                                    <tr><td colspan="6" class="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- View 2: Salary Setup -->
                    <div id="viewSetup" class="hidden space-y-4">
                        <div class="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 p-4 rounded-lg mb-6 text-sm">
                            <span class="font-bold">Instructions:</span> Set the Base Monthly Salary and expected Working Days for each teacher. This data is required for automated daily rate calculations.
                        </div>
                        
                        <div class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                            <table class="w-full text-sm text-left">
                                <thead class="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 font-medium border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th class="px-6 py-4">Employee</th>
                                        <th class="px-6 py-4">Type</th>
                                        <th class="px-6 py-4">Base Salary (Rs)</th>
                                        <th class="px-6 py-4">Monthly Working Days</th>
                                        <th class="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody id="setupTableBody" class="divide-y divide-gray-200 dark:divide-gray-800">
                                    <!-- Populated via JS -->
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </div>

        <!-- Pay Modal -->
        <div id="payModal" class="modal-overlay fixed inset-0 bg-black/80 hidden items-center justify-center z-50 backdrop-blur-sm p-4 overflow-y-auto">
            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700 transform transition-all scale-95 opacity-0">
                
                <!-- Modal Header -->
                <div class="p-6 bg-gradient-to-r from-gray-900 to-gray-800 border-b border-gray-700 flex justify-between items-start">
                    <div>
                        <h3 class="text-xl font-bold text-white mb-1" id="payModalName">Teacher Name</h3>
                        <div class="text-gray-400 text-sm font-mono" id="payModalId">EMP-ID</div>
                    </div>
                     <button onclick="closePayModal()" class="text-gray-400 hover:text-white transition-colors">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div class="p-6 space-y-6">
                    <!-- Base Info Cards -->
                    <div class="grid grid-cols-2 gap-4">
                        <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div class="text-xs text-gray-500 uppercase font-semibold">Base Salary</div>
                            <div class="text-lg font-bold text-gray-900 dark:text-white" id="payModalBase">0</div>
                        </div>
                         <div class="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div class="text-xs text-gray-500 uppercase font-semibold">Daily Rate</div>
                            <div class="text-lg font-bold text-primary-600" id="payModalRate">0</div>
                            <div class="text-[10px] text-gray-400">Based on <span id="payModalDays">0</span> working days</div>
                        </div>
                    </div>

                    <!-- Auto Calculation Section -->
                    <div class="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 p-4 rounded-lg">
                        <div class="flex justify-between items-center mb-2">
                             <div class="text-sm font-medium text-red-800 dark:text-red-300 flex items-center gap-2">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                Absence Deduction
                             </div>
                             <div class="text-sm font-bold text-red-600 dark:text-red-400" id="payModalAbsentDeduction">- Rs 0</div>
                        </div>
                         <div class="text-xs text-gray-500 dark:text-gray-400">
                            Teacher was absent for <span class="font-bold text-gray-900 dark:text-white" id="payModalAbsentDays">0</span> days this month.
                        </div>
                    </div>

                    <!-- Manual Adjustments -->
                    <div class="space-y-4 pt-2">
                        <div>
                            <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Add Allowances (Bonus, etc.)</label>
                            <div class="relative">
                                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rs</span>
                                <input type="number" id="payInputAllowances" class="w-full pl-8 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-colors text-gray-900 dark:text-white font-medium" placeholder="0">
                            </div>
                        </div>
                         <div>
                            <label class="block text-xs font-semibold text-gray-500 uppercase mb-1">Extra Deductions (Fine, etc.)</label>
                            <div class="relative">
                                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Rs</span>
                                <input type="number" id="payInputDeductions" class="w-full pl-8 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-colors text-gray-900 dark:text-white font-medium" placeholder="0">
                            </div>
                        </div>
                    </div>

                    <!-- Final Total -->
                    <div class="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-end">
                        <div class="text-sm font-medium text-gray-500">Net Salary to Pay</div>
                        <div class="text-3xl font-extrabold text-gray-900 dark:text-white" id="payModalNet">Rs 0</div>
                    </div>

                    <button id="confirmPayBtn" class="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-500/30 transition-all active:scale-95 flex items-center justify-center gap-2">
                        Process Payment
                    </button>
                </div>
            </div>
        </div>

        <!-- Payslip Modal -->
        <div id="slipModal" class="modal-overlay fixed inset-0 bg-black/80 hidden items-center justify-center z-50 backdrop-blur-sm p-4 overflow-y-auto">
            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 dark:border-gray-700 transform transition-all scale-95 opacity-0">
                 <!-- Modal Header -->
                <div class="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center no-print">
                    <h3 class="font-bold text-gray-700 dark:text-gray-200">Salary Payslip</h3>
                     <div class="flex items-center gap-3">
                        <button onclick="window.printSlip()" class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-all">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                            Print Slip
                        </button>
                        <button onclick="window.closeSlipModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                </div>

                <!-- Print Content -->
                <div id="slipPrintArea" class="p-8 bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
                    <div class="text-center mb-8 border-b-2 border-indigo-600 pb-6">
                        <h2 class="text-3xl font-black text-indigo-600 tracking-tight uppercase">The Suffah School</h2>
                        <p class="text-sm font-medium text-gray-500 uppercase tracking-widest mt-1">Nurturing Minds, Building Future</p>
                    </div>

                    <div class="grid grid-cols-2 gap-8 mb-8">
                        <div class="space-y-1">
                            <div class="text-[10px] uppercase font-bold text-gray-400">Employee Details</div>
                            <div class="text-xl font-bold" id="slipTeacherName">-</div>
                            <div class="text-sm font-mono text-gray-500" id="slipEmployeeID">-</div>
                        </div>
                        <div class="text-right space-y-1">
                            <div class="text-[10px] uppercase font-bold text-gray-400">Pay Period</div>
                            <div class="text-lg font-bold" id="slipMonthYear">-</div>
                            <div class="text-sm text-gray-500">Paid on: <span id="slipPayDate">-</span></div>
                        </div>
                    </div>

                    <div class="border-y border-gray-100 dark:border-gray-800 py-6 my-6">
                        <div class="grid grid-cols-2 gap-12">
                            <!-- Earnings -->
                            <div>
                                <h4 class="text-xs font-bold text-gray-400 uppercase mb-4 tracking-wider">Earnings</h4>
                                <div class="space-y-3">
                                    <div class="flex justify-between text-sm">
                                        <span class="text-gray-500">Days Worked (<span id="slipPresentDays">0</span> × Rs <span id="slipDailyRate">0</span>)</span>
                                        <span class="font-bold">Rs <span id="slipGrossEarned">0</span></span>
                                    </div>
                                    <div class="flex justify-between text-sm">
                                        <span class="text-gray-500">Allowances & Bonuses</span>
                                        <span class="font-bold text-green-600">+ Rs <span id="slipBonus">0</span></span>
                                    </div>
                                </div>
                            </div>
                            <!-- Deductions -->
                            <div>
                                <h4 class="text-xs font-bold text-gray-400 uppercase mb-4 tracking-wider">Deductions</h4>
                                <div class="space-y-3">
                                    <div class="flex justify-between text-sm">
                                        <span class="text-gray-500">Extra Deductions / Fines</span>
                                        <span class="font-bold text-red-600">- Rs <span id="slipDeductions">0</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-xl flex justify-between items-center mt-8">
                        <div>
                            <div class="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">Net Payable Amount</div>
                            <div class="text-sm text-gray-500 dark:text-gray-400 italic">This is an electronically generated payslip.</div>
                        </div>
                        <div class="text-4xl font-black text-indigo-600 dark:text-indigo-400">
                             Rs <span id="slipNetTotal">0</span>
                        </div>
                    </div>

                    <div class="mt-12 pt-12 border-t border-gray-100 dark:border-gray-800 flex justify-between">
                         <div class="text-center">
                            <div class="w-32 h-px bg-gray-300 mx-auto mb-2"></div>
                            <div class="text-[10px] uppercase font-bold text-gray-400">Employee Signature</div>
                         </div>
                         <div class="text-center">
                            <div class="w-32 h-px bg-gray-300 mx-auto mb-2"></div>
                            <div class="text-[10px] uppercase font-bold text-gray-400">Authorized Official</div>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    setupTabs();
    setupEventListeners();
    await loadData();
}

// Combined list: all teachers + all staff (accountants, office staff, etc.). No role/designation filter.
function getEmployees() {
    const fromTeachers = Array.isArray(teachers) ? teachers.map(t => ({ ...t, _type: 'teacher' })) : [];
    const fromStaff = Array.isArray(staff) ? staff.map(s => ({ ...s, _type: 'staff' })) : [];
    const combined = [...fromTeachers, ...fromStaff];
    return combined.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

function formatEmployeeId(id) {
    if (id == null || id === '') return '-';
    return String(id).trim().replace(/^STF-/i, 'EMP-');
}

async function loadData() {
    const monthEl = document.getElementById('payrollMonth');
    const yearEl = document.getElementById('payrollYear');
    const month = monthEl ? monthEl.value : new Date().getMonth() + 1;
    const year = yearEl ? yearEl.value : new Date().getFullYear();

    try {
        // 1. Fetch ALL staff (accountants, office staff, etc.) – no role or designation filter
        staff = [];
        const { data: staffData, error: staffErr } = await supabase
            .from('staff')
            .select('*')
            .order('name', { ascending: true });
        if (staffErr) {
            console.warn('Payroll: staff fetch failed', staffErr);
        }
        staff = Array.isArray(staffData) ? staffData : [];

        // 2. Fetch active teachers
        teachers = [];
        const { data: tData } = await supabase.from('teachers').select('*').eq('is_active', true).order('name');
        teachers = Array.isArray(tData) ? tData : [];

        // 3. Salary configs (optional – don’t block list if tables missing)
        const { data: sData } = await supabase.from('teacher_salaries').select('*');
        salaries = Array.isArray(sData) ? sData : [];

        const { data: ssData, error: ssErr } = await supabase.from('staff_salaries').select('*');
        if (ssErr) console.warn('Payroll: staff_salaries fetch failed (table may not exist)', ssErr);
        staffSalaries = Array.isArray(ssData) ? ssData : [];

        const { data: pData } = await supabase.from('payroll')
            .select('*')
            .eq('month', month)
            .eq('year', year);
        payrollData = Array.isArray(pData) ? pData : [];

        renderProcessView();
        renderSetupView();
        updateStats();

    } catch (err) {
        console.error('Data load error:', err);
        staff = Array.isArray(staff) ? staff : [];
        teachers = Array.isArray(teachers) ? teachers : [];
    }
}

function renderProcessView() {
    const tbody = document.getElementById('processTableBody');
    const employees = getEmployees();
    if (!employees.length) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-8 text-center text-gray-500">No teachers or staff in the list. Add people in Manage Teachers and Staff &amp; Users, and ensure both tables are readable (e.g. RLS allows access).</td></tr>`;
        return;
    }

    tbody.innerHTML = employees.map(emp => {
        const isTeacher = emp._type === 'teacher';
        const salary = isTeacher ? salaries.find(s => s.teacher_id === emp.id) : staffSalaries.find(s => s.staff_id === emp.id);
        const payroll = payrollData.find(p => (isTeacher && p.teacher_id === emp.id) || (!isTeacher && p.staff_id === emp.id));
        const isPaid = payroll && payroll.status === 'paid';
        const isPending = payroll && payroll.status === 'pending';

        let statusHtml = '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">Not Processed</span>';
        if (isPaid) statusHtml = '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Paid</span>';
        else if (isPending) statusHtml = '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Draft</span>';

        const typeLabel = isTeacher ? 'Teacher' : 'Staff';
        const viewSlipFn = isTeacher ? `window.viewSlip('${emp.id}', 'teacher')` : `window.viewSlip('${emp.id}', 'staff')`;
        const payFn = isTeacher ? `window.payEmployee('${emp.id}', 'teacher')` : `window.payEmployee('${emp.id}', 'staff')`;

        return `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0">
                <td class="px-6 py-4">
                    <div class="flex items-center">
                        <div class="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm mr-3">
                            ${(emp.name || '').charAt(0)}
                        </div>
                        <div>
                            <div class="font-medium text-gray-900 dark:text-white">${emp.name}</div>
                            <div class="text-xs text-gray-500 font-mono">${formatEmployeeId(emp.employee_id)}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 text-center"><span class="px-2 py-0.5 rounded text-xs font-medium ${isTeacher ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}">${typeLabel}</span></td>
                <td class="px-6 py-4 text-center">${statusHtml}</td>
                <td class="px-6 py-4 text-right font-mono text-gray-600 dark:text-gray-400">
                    ${salary ? `Rs ${Number(salary.base_salary).toLocaleString()}` : '<span class="text-red-400 text-xs">Salary Not Set</span>'}
                </td>
                <td class="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                    ${isPaid || isPending ? `Rs ${Number(payroll.net_salary).toLocaleString()}` : '-'}
                </td>
                <td class="px-6 py-4 text-right">
                    ${isPaid
                ? `<button onclick="${viewSlipFn}" class="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center justify-end gap-1 ml-auto">View Slip</button>`
                : `<button onclick="${payFn}" class="text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg shadow-indigo-500/20 transition-all active:scale-95 ${!salary ? 'opacity-50 cursor-not-allowed' : ''}" ${!salary ? 'disabled' : ''}>Pay Now</button>`
            }
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * View payslip for teacher or staff (type = 'teacher' | 'staff')
 */
window.viewSlip = (employeeId, type) => {
    const isTeacher = type === 'teacher';
    const employee = isTeacher ? teachers.find(t => t.id === employeeId) : staff.find(s => s.id === employeeId);
    const payroll = payrollData.find(p => (isTeacher && p.teacher_id === employeeId) || (!isTeacher && p.staff_id === employeeId));
    const salaryConfig = isTeacher ? salaries.find(s => s.teacher_id === employeeId) : staffSalaries.find(s => s.staff_id === employeeId);

    if (!employee || !payroll) return alert('No payroll record found.');

    const modal = document.getElementById('slipModal');
    if (modal.parentElement !== document.body) document.body.appendChild(modal);

    document.getElementById('slipTeacherName').textContent = employee.name;
    document.getElementById('slipEmployeeID').textContent = formatEmployeeId(employee.employee_id) || employeeId;
    document.getElementById('slipMonthYear').textContent = `${MONTHS[payroll.month - 1]} ${payroll.year}`;
    document.getElementById('slipPayDate').textContent = new Date(payroll.paid_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

    // Populate Earnings/Deductions
    const dailyRate = Math.round((salaryConfig ? salaryConfig.base_salary : payroll.gross_salary) / (salaryConfig ? salaryConfig.monthly_working_days : 30));
    const presentDays = Math.round(payroll.gross_salary / dailyRate);

    document.getElementById('slipPresentDays').textContent = presentDays;
    document.getElementById('slipDailyRate').textContent = dailyRate.toLocaleString();
    document.getElementById('slipGrossEarned').textContent = payroll.gross_salary.toLocaleString();
    document.getElementById('slipBonus').textContent = (payroll.bonus || 0).toLocaleString();
    document.getElementById('slipDeductions').textContent = (payroll.deductions || 0).toLocaleString();
    document.getElementById('slipNetTotal').textContent = payroll.net_salary.toLocaleString();

    // Show Modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    setTimeout(() => {
        modal.querySelector('div').classList.remove('scale-95', 'opacity-0');
        modal.querySelector('div').classList.add('scale-100', 'opacity-100');
    }, 10);
};

window.closeSlipModal = () => {
    const modal = document.getElementById('slipModal');
    modal.querySelector('div').classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 200);
};

window.printSlip = () => {
    const slipContent = document.getElementById('slipPrintArea').innerHTML;
    const printWindow = window.open('', '', 'height=800,width=800');

    printWindow.document.write(`
        <html>
            <head>
                <title>Salary Slip - The Suffah School</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <style>
                    body { font-family: sans-serif; padding: 40px; }
                    @media print {
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="max-w-2xl mx-auto border-2 border-gray-100 p-8 rounded-xl shadow-sm">
                    ${slipContent}
                </div>
            </body>
        </html>
    `);

    printWindow.document.close();
    setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
    }, 500);
};

function renderSetupView() {
    const tbody = document.getElementById('setupTableBody');
    const employees = getEmployees();
    tbody.innerHTML = employees.map(emp => {
        const isTeacher = emp._type === 'teacher';
        const salary = isTeacher ? salaries.find(s => s.teacher_id === emp.id) : staffSalaries.find(s => s.staff_id === emp.id);
        const base = salary ? salary.base_salary : '';
        const days = salary ? (salary.monthly_working_days || 30) : 30;
        const typeLabel = isTeacher ? 'Teacher' : 'Staff';
        const dataKey = `${emp._type}-${emp.id}`;

        return `
            <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-100 dark:border-gray-800 last:border-0" id="setupRow-${dataKey}">
                <td class="px-6 py-4">
                    <div class="font-medium text-gray-900 dark:text-white">${emp.name}</div>
                    <div class="text-xs text-gray-500">${formatEmployeeId(emp.employee_id)}</div>
                </td>
                <td class="px-6 py-4"><span class="px-2 py-0.5 rounded text-xs font-medium ${isTeacher ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-700'}">${typeLabel}</span></td>
                <td class="px-6 py-4">
                    <input type="number" class="salary-input bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm w-32 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white placeholder-gray-400" 
                        value="${base}" placeholder="0" id="inputBase-${dataKey}" data-type="${emp._type}" data-id="${emp.id}">
                </td>
                <td class="px-6 py-4">
                    <input type="number" class="days-input bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm w-24 focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white placeholder-gray-400" 
                        value="${days}" placeholder="30" id="inputDays-${dataKey}">
                </td>
                <td class="px-6 py-4 text-right">
                    <button onclick="window.saveSalarySetup('${dataKey}')" class="text-primary-600 hover:text-primary-700 font-medium text-sm hover:underline">Save</button>
                </td>
            </tr>
        `;
    }).join('');
}

// dataKey is "teacher-<uuid>" or "staff-<uuid>" (uuid may contain dashes)
window.saveSalarySetup = async (dataKey) => {
    const parts = dataKey.split('-');
    const type = parts[0];
    const employeeId = parts.slice(1).join('-');
    const isTeacher = type === 'teacher';
    const baseInput = document.getElementById(`inputBase-${dataKey}`);
    const daysInput = document.getElementById(`inputDays-${dataKey}`);
    if (!baseInput || !daysInput) return;
    const base = parseFloat(baseInput.value) || 0;
    const days = parseFloat(daysInput.value) || 30;

    const row = document.getElementById(`setupRow-${dataKey}`);
    const btn = row ? row.querySelector('button') : null;
    if (btn) { btn.textContent = 'Saving...'; btn.disabled = true; }

    let error;
    if (isTeacher) {
        const existing = salaries.find(s => s.teacher_id === employeeId);
        const payload = { teacher_id: employeeId, base_salary: base, monthly_working_days: days };
        if (existing) {
            const res = await supabase.from('teacher_salaries').update(payload).eq('id', existing.id);
            error = res.error;
        } else {
            const res = await supabase.from('teacher_salaries').insert([payload]);
            error = res.error;
        }
    } else {
        const existing = staffSalaries.find(s => s.staff_id === employeeId);
        const payload = { staff_id: employeeId, base_salary: base, monthly_working_days: days };
        if (existing) {
            const res = await supabase.from('staff_salaries').update(payload).eq('id', existing.id);
            error = res.error;
        } else {
            const res = await supabase.from('staff_salaries').insert([payload]);
            error = res.error;
        }
    }

    if (error) {
        alert('Error saving: ' + error.message);
    } else {
        await loadData();
        if (btn) { btn.textContent = 'Saved!'; setTimeout(() => { btn.textContent = 'Save'; btn.disabled = false; }, 2000); }
    }
};

window.payTeacher = (teacherId) => window.payEmployee(teacherId, 'teacher');

window.payEmployee = async (employeeId, type) => {
    const isTeacher = type === 'teacher';
    const employee = isTeacher ? teachers.find(t => t.id === employeeId) : staff.find(s => s.id === employeeId);
    const salary = isTeacher ? salaries.find(s => s.teacher_id === employeeId) : staffSalaries.find(s => s.staff_id === employeeId);

    if (!employee || !salary) return alert('Please set up salary first.');

    const modal = document.getElementById('payModal');
    if (modal.parentElement !== document.body) document.body.appendChild(modal);

    const month = parseInt(document.getElementById('payrollMonth').value);
    const year = parseInt(document.getElementById('payrollYear').value);
    const totalWorkingDays = salary.monthly_working_days || 30;
    const dailyRate = Math.round(salary.base_salary / totalWorkingDays);
    let presentDays;

    if (isTeacher) {
        const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
        document.getElementById('payModalName').textContent = 'Loading...';
        modal.classList.remove('hidden');
        modal.classList.add('flex');

        const { data: attendanceData, error } = await supabase
            .from('teacher_attendance')
            .select('*')
            .eq('teacher_id', employeeId)
            .gte('date', startDate)
            .lte('date', endDate);
        if (error) {
            alert('Failed to fetch attendance data.');
            modal.classList.add('hidden');
            return;
        }
        const presentRecords = attendanceData.filter(a => a.status === 'present');
        const absentRecords = attendanceData.filter(a => a.status === 'absent');
        const leaveRecords = attendanceData.filter(a => a.status === 'leave');
        presentDays = presentRecords.length;
        const absentDays = absentRecords.length;
        const leaveDays = leaveRecords.length;
        const earnedBase = presentDays * dailyRate;

        const deductionSection = modal.querySelector('.bg-blue-50') || modal.querySelector('.bg-red-50');
        if (deductionSection) {
            deductionSection.className = "bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-lg";
            deductionSection.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                 <div class="text-sm font-medium text-blue-800 dark:text-blue-300 flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    Days Worked Calculation
                 </div>
                 <div class="text-sm font-bold text-blue-600 dark:text-blue-400" id="payModalConfirmedBase">Rs ${earnedBase.toLocaleString()}</div>
            </div>
             <div class="text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center">
                <span>Present Days: <strong class="text-gray-900 dark:text-white">${presentDays}</strong> / ${totalWorkingDays}</span>
                <span class="text-gray-400">(Absent: ${absentDays}, Leave: ${leaveDays})</span>
            </div>
        `;
        }
    } else {
        presentDays = totalWorkingDays;
        const deductionSection = modal.querySelector('.bg-blue-50') || modal.querySelector('.bg-red-50');
        if (deductionSection) {
            deductionSection.className = "bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 p-4 rounded-lg";
            deductionSection.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <div class="text-sm font-medium text-blue-800 dark:text-blue-300">Staff – Full month</div>
                <div class="text-sm font-bold text-blue-600 dark:text-blue-400">Rs ${(presentDays * dailyRate).toLocaleString()}</div>
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400">Working days: ${totalWorkingDays}</div>
            `;
        }
        const absentEl = document.getElementById('payModalAbsentDays');
        const absentDedEl = document.getElementById('payModalAbsentDeduction');
        if (absentEl) absentEl.textContent = '0';
        if (absentDedEl) absentDedEl.textContent = '- Rs 0';
    }

    document.getElementById('payModalName').textContent = employee.name;
    document.getElementById('payModalId').textContent = formatEmployeeId(employee.employee_id) || employeeId;

    document.getElementById('payModalBase').textContent = `Rs ${salary.base_salary.toLocaleString()}`;
    document.getElementById('payModalRate').textContent = `Rs ${dailyRate}`;
    document.getElementById('payModalDays').textContent = totalWorkingDays;

    // Reset Inputs
    const inpAllow = document.getElementById('payInputAllowances');
    const inpDeduct = document.getElementById('payInputDeductions');
    inpAllow.value = '';
    inpDeduct.value = '';

    currentPayState = {
        teacherId: employeeId,
        employeeId,
        employeeType: type,
        dailyRate,
        presentDays,
        allowances: 0,
        manualDeductions: 0
    };

    // Initial Calc (updates the Net Salary total at bottom)
    updateNetSalaryDisplay();

    // Show Modal Animation
    setTimeout(() => {
        modal.querySelector('div').classList.remove('scale-95', 'opacity-0');
        modal.querySelector('div').classList.add('scale-100', 'opacity-100');
    }, 10);
};

let currentPayState = {};

function updateNetSalaryDisplay() {
    // Formula: (Days Worked * Daily Rate) + Allowances - Deductions
    const workPay = currentPayState.presentDays * currentPayState.dailyRate;
    const net = workPay + currentPayState.allowances - currentPayState.manualDeductions;

    document.getElementById('payModalNet').textContent = `Rs ${net.toLocaleString()}`;
}

window.closePayModal = () => {
    const modal = document.getElementById('payModal');
    modal.querySelector('div').classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 200);
};

function setupTabs() {
    const tabProcess = document.getElementById('tabProcess');
    const tabSetup = document.getElementById('tabSetup');
    const viewProcess = document.getElementById('viewProcess');
    const viewSetup = document.getElementById('viewSetup');

    tabProcess.addEventListener('click', () => {
        // UI
        tabProcess.className = "flex-1 px-6 py-4 text-sm font-medium text-primary-600 border-b-2 border-primary-600 bg-primary-50/50 dark:bg-primary-900/10 dark:text-primary-400 dark:border-primary-400 transition-colors";
        tabSetup.className = "flex-1 px-6 py-4 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors border-b-2 border-transparent";
        // View
        viewProcess.classList.remove('hidden');
        viewSetup.classList.add('hidden');
    });

    tabSetup.addEventListener('click', () => {
        // UI
        tabSetup.className = "flex-1 px-6 py-4 text-sm font-medium text-primary-600 border-b-2 border-primary-600 bg-primary-50/50 dark:bg-primary-900/10 dark:text-primary-400 dark:border-primary-400 transition-colors";
        tabProcess.className = "flex-1 px-6 py-4 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800 transition-colors border-b-2 border-transparent";
        // View
        viewSetup.classList.remove('hidden');
        viewProcess.classList.add('hidden');
    });
}

function setupEventListeners() {
    // Period selectors
    document.getElementById('payrollMonth').addEventListener('change', loadData);
    document.getElementById('payrollYear').addEventListener('change', loadData);

    // Modal Inputs Re-calc
    const inpAllow = document.getElementById('payInputAllowances');
    const inpDeduct = document.getElementById('payInputDeductions');

    inpAllow.addEventListener('input', (e) => {
        currentPayState.allowances = parseFloat(e.target.value) || 0;
        updateNetSalaryDisplay();
    });

    inpDeduct.addEventListener('input', (e) => {
        currentPayState.manualDeductions = parseFloat(e.target.value) || 0;
        updateNetSalaryDisplay();
    });

    // Confirm Pay
    document.getElementById('confirmPayBtn').addEventListener('click', processPayment);
}

async function processPayment() {
    const btn = document.getElementById('confirmPayBtn');
    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processing...`;

    // Formula: (Days Worked * Daily Rate) + Allowances - Manual Deductions
    const earnedBase = currentPayState.presentDays * currentPayState.dailyRate;
    const net = earnedBase + currentPayState.allowances - currentPayState.manualDeductions;

    const month = parseInt(document.getElementById('payrollMonth').value);
    const year = parseInt(document.getElementById('payrollYear').value);

    const isTeacher = currentPayState.employeeType === 'teacher';
    const payload = {
        month,
        year,
        gross_salary: earnedBase,
        bonus: currentPayState.allowances,
        deductions: currentPayState.manualDeductions,
        net_salary: net,
        status: 'paid',
        paid_at: new Date().toISOString()
    };
    if (isTeacher) {
        payload.teacher_id = currentPayState.employeeId;
        payload.staff_id = null;
    } else {
        payload.staff_id = currentPayState.employeeId;
        payload.teacher_id = null;
    }

    try {
        const conflictKey = isTeacher ? 'teacher_id,month,year' : 'staff_id,month,year';
        const { error } = await supabase.from('payroll').upsert([payload], {
            onConflict: conflictKey
        });

        if (error) throw error;

        alert(`Payment Success! Rs ${net.toLocaleString()} recorded/updated.`);
        closePayModal();
        await loadData(); // refresh list to show 'Paid'
    } catch (err) {
        alert('Payment failed: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Process Payment';
    }
}

function updateStats() {
    const employees = getEmployees();
    const paid = payrollData.filter(p => p.status === 'paid');
    const totalPaid = paid.reduce((acc, curr) => acc + (curr.net_salary || 0), 0);
    const pendingCount = Math.max(0, employees.length - paid.length);

    document.getElementById('statPending').textContent = pendingCount;
    document.getElementById('statProcessed').textContent = paid.length;
    document.getElementById('statTotal').textContent = `Rs ${totalPaid.toLocaleString()}`;
}
