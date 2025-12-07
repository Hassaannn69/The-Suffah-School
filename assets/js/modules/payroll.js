// Use global Supabase client for production compatibility
const supabase = window.supabase || (() => {
    console.error('Supabase client not found on window object');
    throw new Error('Supabase client not initialized');
})();

let availableTeachers = [];
let currentSalaries = [];
let payrollRecords = [];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export async function render(container) {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    container.innerHTML = `
        <div class="space-y-6">
            <!-- Header -->
            <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 transition-colors duration-200">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 class="text-xl font-bold text-gray-900 dark:text-white">Payroll Management</h2>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage teacher salaries and generate payslips</p>
                    </div>
                    <div class="flex space-x-3">
                        <select id="payrollMonth" class="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white">
                            ${MONTHS.map((m, i) => `<option value="${i + 1}" ${i + 1 === currentMonth ? 'selected' : ''}>${m}</option>`).join('')}
                        </select>
                        <select id="payrollYear" class="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white">
                            ${[currentYear - 1, currentYear, currentYear + 1].map(y => `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('')}
                        </select>
                        <button id="generatePayrollBtn" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-lg shadow-primary-500/20">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            Generate Payroll
                        </button>
                    </div>
                </div>
            </div>

            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 transition-colors">
                    <div class="text-sm text-gray-500 dark:text-gray-400">Total Payroll</div>
                    <div id="totalPayroll" class="text-2xl font-bold text-gray-900 dark:text-white mt-1">Rs 0</div>
                </div>
                <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-green-200 dark:border-green-900 p-4 transition-colors">
                    <div class="text-sm text-green-600 dark:text-green-400">Paid</div>
                    <div id="paidCount" class="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">0</div>
                </div>
                <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-yellow-200 dark:border-yellow-900 p-4 transition-colors">
                    <div class="text-sm text-yellow-600 dark:text-yellow-400">Pending</div>
                    <div id="pendingCount" class="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">0</div>
                </div>
                <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-blue-200 dark:border-blue-900 p-4 transition-colors">
                    <div class="text-sm text-blue-600 dark:text-blue-400">Teachers</div>
                    <div id="teacherCount" class="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">0</div>
                </div>
            </div>

            <!-- Payroll Table -->
            <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors duration-200">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th class="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Teacher</th>
                                <th class="p-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Base Salary</th>
                                <th class="p-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Allowances</th>
                                <th class="p-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Deductions</th>
                                <th class="p-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Net Salary</th>
                                <th class="p-4 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                <th class="p-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody id="payrollTableBody" class="divide-y divide-gray-200 dark:divide-gray-800">
                            <tr><td colspan="7" class="p-4 text-center text-gray-500 dark:text-gray-400">Loading...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Set Salary Modal -->
        <div id="salaryModal" class="modal-overlay fixed inset-0 bg-black/80 hidden items-center justify-center z-50 backdrop-blur-sm overflow-y-auto transition-opacity duration-300">
            <div class="bg-gray-900 rounded-xl shadow-2xl w-full max-w-lg mx-4 my-4 overflow-hidden transform transition-all duration-300 ease-out opacity-0 scale-95 translate-y-4 border border-gray-800">
                <div class="bg-gradient-to-r from-primary-600 to-indigo-600 p-6 flex justify-between items-center">
                    <h3 id="salaryModalTitle" class="text-xl font-bold text-white">Set Salary Structure</h3>
                    <button id="closeSalaryModalBtn" class="text-white hover:text-gray-200 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form id="salaryForm" class="p-6 space-y-4">
                    <input type="hidden" id="salaryTeacherId">
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">Teacher</label>
                        <input type="text" id="salaryTeacherName" disabled class="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-1">Base Salary *</label>
                        <input type="number" id="baseSalary" required class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500 outline-none">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Allowances</label>
                            <input type="number" id="allowances" value="0" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500 outline-none">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Deductions</label>
                            <input type="number" id="deductions" value="0" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-primary-500 outline-none">
                        </div>
                    </div>

                    <div class="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                        <button type="button" id="cancelSalaryBtn" class="px-4 py-2 text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700">Cancel</button>
                        <button type="submit" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors shadow-lg shadow-primary-500/20">Save Salary</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    // Event Listeners
    document.getElementById('payrollMonth').addEventListener('change', loadPayroll);
    document.getElementById('payrollYear').addEventListener('change', loadPayroll);
    document.getElementById('generatePayrollBtn').addEventListener('click', generatePayroll);
    document.getElementById('closeSalaryModalBtn').addEventListener('click', closeSalaryModal);
    document.getElementById('cancelSalaryBtn').addEventListener('click', closeSalaryModal);
    document.getElementById('salaryForm').addEventListener('submit', handleSalarySave);

    await loadTeachers();
    await loadPayroll();
}

async function loadTeachers() {
    const { data } = await supabase.from('teachers').select('*').eq('is_active', true).order('name');
    availableTeachers = data || [];
    document.getElementById('teacherCount').textContent = availableTeachers.length;

    // Load salary structures
    const { data: salaries } = await supabase.from('teacher_salaries').select('*');
    currentSalaries = salaries || [];
}

async function loadPayroll() {
    const month = document.getElementById('payrollMonth').value;
    const year = document.getElementById('payrollYear').value;

    const { data, error } = await supabase
        .from('payroll')
        .select('*, teachers(id, name, employee_id)')
        .eq('month', month)
        .eq('year', year);

    if (error) {
        console.error('Error loading payroll:', error);
    }

    payrollRecords = data || [];
    renderPayrollTable();
    updateStats();
}

function renderPayrollTable() {
    const tbody = document.getElementById('payrollTableBody');

    if (payrollRecords.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-gray-500 dark:text-gray-400">
            No payroll records for this month. Click "Generate Payroll" to create.
        </td></tr>`;
        return;
    }

    tbody.innerHTML = payrollRecords.map(record => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <td class="p-4">
                <div class="flex items-center">
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm mr-3">
                        ${record.teachers?.name?.charAt(0).toUpperCase() || 'T'}
                    </div>
                    <div>
                        <div class="font-medium text-gray-900 dark:text-white">${record.teachers?.name || '-'}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">${record.teachers?.employee_id || '-'}</div>
                    </div>
                </div>
            </td>
            <td class="p-4 text-right text-gray-600 dark:text-gray-300">Rs ${(record.gross_salary || 0).toLocaleString()}</td>
            <td class="p-4 text-right text-green-600 dark:text-green-400">+Rs ${(record.bonus || 0).toLocaleString()}</td>
            <td class="p-4 text-right text-red-600 dark:text-red-400">-Rs ${(record.deductions || 0).toLocaleString()}</td>
            <td class="p-4 text-right font-bold text-gray-900 dark:text-white">Rs ${(record.net_salary || 0).toLocaleString()}</td>
            <td class="p-4 text-center">
                ${record.status === 'paid'
            ? '<span class="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">Paid</span>'
            : '<span class="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full text-xs font-medium">Pending</span>'
        }
            </td>
            <td class="p-4 text-right">
                <div class="flex justify-end space-x-2">
                    ${record.status === 'pending' ? `
                        <button onclick="window.markAsPaid('${record.id}')" class="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-sm font-medium">
                            Mark Paid
                        </button>
                    ` : ''}
                    <button onclick="window.viewPayslip('${record.id}')" class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium">
                        View Slip
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function updateStats() {
    const total = payrollRecords.reduce((sum, r) => sum + (r.net_salary || 0), 0);
    const paid = payrollRecords.filter(r => r.status === 'paid').length;
    const pending = payrollRecords.filter(r => r.status === 'pending').length;

    document.getElementById('totalPayroll').textContent = `Rs ${total.toLocaleString()}`;
    document.getElementById('paidCount').textContent = paid;
    document.getElementById('pendingCount').textContent = pending;
}

async function generatePayroll() {
    const month = parseInt(document.getElementById('payrollMonth').value);
    const year = parseInt(document.getElementById('payrollYear').value);

    if (!confirm(`Generate payroll for ${MONTHS[month - 1]} ${year}? This will create records for all teachers with salary structures.`)) {
        return;
    }

    const newRecords = [];

    for (const teacher of availableTeachers) {
        // Check if record already exists
        const exists = payrollRecords.find(r => r.teacher_id === teacher.id);
        if (exists) continue;

        // Find salary structure
        const salary = currentSalaries.find(s => s.teacher_id === teacher.id);
        if (!salary) continue;

        const grossSalary = parseFloat(salary.base_salary) || 0;
        const allowances = parseFloat(salary.allowances) || 0;
        const deductions = parseFloat(salary.deductions) || 0;
        const bonus = parseFloat(salary.bonus) || 0;
        const netSalary = grossSalary + allowances + bonus - deductions;

        newRecords.push({
            teacher_id: teacher.id,
            month,
            year,
            gross_salary: grossSalary,
            deductions,
            bonus: allowances + bonus,
            net_salary: netSalary,
            status: 'pending'
        });
    }

    if (newRecords.length === 0) {
        alert('No new payroll records to generate. Either all teachers already have records or no salary structures are defined.');
        return;
    }

    const { error } = await supabase.from('payroll').insert(newRecords);

    if (error) {
        alert('Error generating payroll: ' + error.message);
    } else {
        alert(`Generated ${newRecords.length} payroll record(s).`);
        await loadPayroll();
    }
}

window.markAsPaid = async (id) => {
    const { error } = await supabase.from('payroll').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id);
    if (error) {
        alert('Error updating status: ' + error.message);
    } else {
        await loadPayroll();
    }
};

window.viewPayslip = (id) => {
    const record = payrollRecords.find(r => r.id === id);
    if (!record) return;

    const month = document.getElementById('payrollMonth').value;
    const year = document.getElementById('payrollYear').value;

    alert(`Payslip for ${record.teachers?.name}\n\nMonth: ${MONTHS[month - 1]} ${year}\nGross Salary: Rs ${record.gross_salary?.toLocaleString()}\nBonus/Allowances: Rs ${record.bonus?.toLocaleString()}\nDeductions: Rs ${record.deductions?.toLocaleString()}\n\nNet Salary: Rs ${record.net_salary?.toLocaleString()}\n\nStatus: ${record.status?.toUpperCase()}`);
};

window.setSalary = (teacherId) => {
    const teacher = availableTeachers.find(t => t.id === teacherId);
    if (!teacher) return;

    const salary = currentSalaries.find(s => s.teacher_id === teacherId);

    const modal = document.getElementById('salaryModal');
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

    const content = modal.querySelector('div');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    void modal.offsetWidth;
    content.classList.remove('opacity-0', 'scale-95', 'translate-y-4');
    content.classList.add('opacity-100', 'scale-100', 'translate-y-0');

    document.getElementById('salaryTeacherId').value = teacherId;
    document.getElementById('salaryTeacherName').value = teacher.name;
    document.getElementById('baseSalary').value = salary?.base_salary || '';
    document.getElementById('allowances').value = salary?.allowances || 0;
    document.getElementById('deductions').value = salary?.deductions || 0;
};

function closeSalaryModal() {
    const modal = document.getElementById('salaryModal');
    const content = modal.querySelector('div');

    content.classList.remove('opacity-100', 'scale-100', 'translate-y-0');
    content.classList.add('opacity-0', 'scale-95', 'translate-y-4');

    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }, 300);
}

async function handleSalarySave(e) {
    e.preventDefault();

    const teacherId = document.getElementById('salaryTeacherId').value;
    const salaryData = {
        teacher_id: teacherId,
        base_salary: parseFloat(document.getElementById('baseSalary').value) || 0,
        allowances: parseFloat(document.getElementById('allowances').value) || 0,
        deductions: parseFloat(document.getElementById('deductions').value) || 0,
        effective_from: new Date().toISOString().split('T')[0]
    };

    const existing = currentSalaries.find(s => s.teacher_id === teacherId);

    let error;
    if (existing) {
        const res = await supabase.from('teacher_salaries').update(salaryData).eq('id', existing.id);
        error = res.error;
    } else {
        const res = await supabase.from('teacher_salaries').insert([salaryData]);
        error = res.error;
    }

    if (error) {
        alert('Error saving salary: ' + error.message);
    } else {
        closeSalaryModal();
        await loadTeachers();
        await loadPayroll();
    }
}
