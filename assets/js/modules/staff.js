// Use global Supabase client for production compatibility
const supabase = window.supabase || (() => {
    console.error('Supabase client not found on window object');
    throw new Error('Supabase client not initialized');
})();

let currentStaff = [];

export async function render(container) {
    container.innerHTML = `
        <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden transition-colors duration-200">
            <div class="p-6 border-b border-gray-200 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">Staff & User Management</h2>
                <div class="flex space-x-3">
                    <input type="text" id="searchStaffInput" placeholder="Search staff..." class="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white placeholder-gray-500 transition-colors">
                    <button id="addStaffBtn" class="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center transition-colors shadow-lg shadow-primary-500/20">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Add Staff Member
                    </button>
                </div>
            </div>

            <!-- Staff Table -->
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th class="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                            <th class="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Employee ID</th>
                            <th class="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                            <th class="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                            <th class="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                            <th class="p-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="staffTableBody" class="divide-y divide-gray-200 dark:divide-gray-800">
                        <tr><td colspan="6" class="p-4 text-center text-gray-500 dark:text-gray-400">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Staff Modal -->
        <div id="staffModal" class="modal-overlay fixed inset-0 bg-black/80 hidden items-center justify-center z-50 backdrop-blur-sm overflow-y-auto">
            <div class="bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl mx-4 my-4 overflow-hidden border border-gray-800">
                <div class="bg-gradient-to-r from-primary-600 to-indigo-600 p-6 flex justify-between items-center">
                    <h3 id="staffModalTitle" class="text-xl font-bold text-white">Add Staff Member</h3>
                    <button id="closeStaffModalBtn" class="text-white hover:text-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <form id="staffForm" class="p-6 space-y-4">
                    <input type="hidden" id="staffId">
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Full Name *</label>
                            <input type="text" id="staffName" required class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Role *</label>
                            <select id="staffRole" required class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                                <option value="accountant">Accountant</option>
                                <option value="staff">General Staff</option>
                            </select>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Employee ID *</label>
                            <input type="text" id="staffEmployeeId" required class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Date of Birth *</label>
                            <input type="date" id="staffDOB" required class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Email (Login Identity)</label>
                            <input type="email" id="staffEmail" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                            <input type="tel" id="staffPhone" class="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white">
                        </div>
                    </div>

                    <div class="flex justify-end space-x-3 pt-4 border-t border-gray-800">
                        <button type="button" id="cancelStaffBtn" class="px-4 py-2 text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700">Cancel</button>
                        <button type="submit" class="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg">Save Staff</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Staff Profile Modal -->
         <div id="staffProfileModal" class="modal-overlay fixed inset-0 bg-black/80 hidden items-center justify-center z-50 backdrop-blur-sm overflow-y-auto">
            <div class="bg-gray-900 rounded-xl shadow-2xl w-full max-w-3xl mx-4 my-4 overflow-hidden border border-gray-800 flex flex-col">
                <div class="bg-gradient-to-r from-primary-600 to-indigo-600 p-6 flex justify-between items-center">
                    <h3 class="text-xl font-bold text-white">Staff Profile</h3>
                    <button id="closeStaffProfileBtn" class="text-white hover:text-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div class="flex-1 p-6 overflow-y-auto">
                    <!-- Tabs -->
                    <div class="flex border-b border-gray-800 mb-6">
                        <button id="tabPersonal" onclick="window.switchStaffTab('personal')" class="px-4 py-2 text-primary-500 border-b-2 border-primary-500 font-medium transition-colors">Personal Details</button>
                        <button id="tabAccount" onclick="window.switchStaffTab('account')" class="px-4 py-2 text-gray-400 hover:text-white font-medium transition-colors">Account & Credentials</button>
                    </div>

                    <div class="mt-4">
                        <!-- Personal Details Content -->
                        <div id="contentPersonal" class="block">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="space-y-4">
                                    <div>
                                        <label class="text-xs text-gray-500 uppercase tracking-wider">Name</label>
                                        <p id="profStaffName" class="text-white font-medium"></p>
                                    </div>
                                    <div>
                                        <label class="text-xs text-gray-500 uppercase tracking-wider">Employee ID</label>
                                        <p id="profStaffId" class="text-white font-medium"></p>
                                    </div>
                                    <div>
                                        <label class="text-xs text-gray-500 uppercase tracking-wider">Role</label>
                                        <p id="profStaffRole" class="text-white font-medium"></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Account Details Content -->
                        <div id="contentAccount" class="hidden">
                            <div class="space-y-4">
                                <div class="p-4 bg-gray-800/50 rounded-xl border border-gray-800">
                                    <h4 class="text-sm font-semibold text-primary-400 mb-3 flex items-center">
                                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                                        Login Credentials
                                    </h4>
                                    <div class="space-y-2">
                                        <div>
                                            <label class="text-[10px] text-gray-500 uppercase">Username / ID</label>
                                            <p id="profStaffUser" class="text-white text-sm font-mono"></p>
                                        </div>
                                        <div>
                                            <label class="text-[10px] text-gray-500 uppercase">Current Password</label>
                                            <p id="profStaffPass" class="text-white text-sm font-mono"></p>
                                        </div>
                                        <p class="text-[10px] text-gray-500 mt-2 italic">* Password is derived from Date of Birth (DDMMYYYY)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    setupEventListeners();
    fetchStaff();
}

async function fetchStaff() {
    const { data, error } = await supabase.from('staff').select('*').order('created_at', { ascending: false });
    if (error) {
        console.error('Error fetching staff:', error);
        return;
    }
    currentStaff = data;
    renderStaffTable(data);
}

function renderStaffTable(staff) {
    const tbody = document.getElementById('staffTableBody');
    if (!staff || staff.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gray-500">No staff members found</td></tr>';
        return;
    }

    tbody.innerHTML = staff.map(s => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
            <td class="p-4">
                <div class="font-medium text-gray-900 dark:text-white capitalize">${s.name}</div>
            </td>
            <td class="p-4 text-gray-600 dark:text-gray-400 font-mono text-sm">${s.employee_id}</td>
            <td class="p-4">
                <span class="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded text-xs font-medium uppercase">${s.role}</span>
            </td>
            <td class="p-4 text-gray-500 dark:text-gray-400 text-sm">${s.email || '-'}</td>
            <td class="p-4">
                <span class="flex items-center">
                    <span class="w-2 h-2 rounded-full ${s.is_active ? 'bg-green-500' : 'bg-red-500'} mr-2"></span>
                    <span class="text-xs ${s.is_active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">${s.is_active ? 'Active' : 'Inactive'}</span>
                </span>
            </td>
            <td class="p-4 text-right">
                <button onclick="viewStaffProfile('${s.id}')" class="text-primary-600 hover:text-primary-700 font-medium text-sm mr-3">View</button>
                <button onclick="editStaff('${s.id}')" class="text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white font-medium text-sm">Edit</button>
            </td>
        </tr>
    `).join('');
}

window.viewStaffProfile = (id) => {
    const s = currentStaff.find(item => item.id === id);
    if (!s) return;

    document.getElementById('profStaffName').textContent = s.name;
    document.getElementById('profStaffId').textContent = s.employee_id;
    document.getElementById('profStaffRole').textContent = s.role.toUpperCase();
    document.getElementById('profStaffUser').textContent = s.employee_id;
    document.getElementById('profStaffPass').textContent = s.date_of_birth ? s.date_of_birth.split('-').reverse().join('') : 'Not Set';

    document.getElementById('staffProfileModal').classList.remove('hidden');
    document.getElementById('staffProfileModal').classList.add('flex');
};

window.editStaff = (id) => {
    const s = currentStaff.find(item => item.id === id);
    if (!s) return;

    document.getElementById('staffId').value = s.id;
    document.getElementById('staffName').value = s.name;
    document.getElementById('staffRole').value = s.role;
    document.getElementById('staffEmployeeId').value = s.employee_id;
    document.getElementById('staffDOB').value = s.date_of_birth;
    document.getElementById('staffEmail').value = s.email || '';
    document.getElementById('staffPhone').value = s.phone || '';

    document.getElementById('staffModalTitle').textContent = 'Edit Staff Member';
    document.getElementById('staffModal').classList.remove('hidden');
    document.getElementById('staffModal').classList.add('flex');
};

window.switchStaffTab = (tab) => {
    const tabPersonal = document.getElementById('tabPersonal');
    const tabAccount = document.getElementById('tabAccount');
    const contentPersonal = document.getElementById('contentPersonal');
    const contentAccount = document.getElementById('contentAccount');

    if (tab === 'personal') {
        tabPersonal.className = 'px-4 py-2 text-primary-500 border-b-2 border-primary-500 font-medium transition-colors';
        tabAccount.className = 'px-4 py-2 text-gray-400 hover:text-white font-medium transition-colors';
        contentPersonal.classList.remove('hidden');
        contentAccount.classList.add('hidden');
    } else {
        tabPersonal.className = 'px-4 py-2 text-gray-400 hover:text-white font-medium transition-colors';
        tabAccount.className = 'px-4 py-2 text-primary-500 border-b-2 border-primary-500 font-medium transition-colors';
        contentPersonal.classList.add('hidden');
        contentAccount.classList.remove('hidden');
    }
};

function setupEventListeners() {
    document.getElementById('addStaffBtn').onclick = () => {
        document.getElementById('staffForm').reset();
        document.getElementById('staffId').value = '';
        document.getElementById('staffModalTitle').textContent = 'Add Staff Member';
        document.getElementById('staffModal').classList.remove('hidden');
        document.getElementById('staffModal').classList.add('flex');

        // Auto-generate ID if empty
        generateNextStaffId();
    };

    document.getElementById('closeStaffModalBtn').onclick = () => {
        document.getElementById('staffModal').classList.add('hidden');
    };

    document.getElementById('cancelStaffBtn').onclick = () => {
        document.getElementById('staffModal').classList.add('hidden');
    };

    document.getElementById('closeStaffProfileBtn').onclick = () => {
        document.getElementById('staffProfileModal').classList.add('hidden');
    };

    document.getElementById('staffForm').onsubmit = handleStaffSubmit;

    document.getElementById('searchStaffInput').oninput = (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = currentStaff.filter(s =>
            s.name.toLowerCase().includes(term) ||
            s.employee_id.toLowerCase().includes(term) ||
            (s.email && s.email.toLowerCase().includes(term))
        );
        renderStaffTable(filtered);
    };
}

async function generateNextStaffId() {
    const { data } = await supabase.from('staff').select('employee_id').order('created_at', { ascending: false }).limit(1);
    let nextNum = 1;
    if (data && data.length > 0) {
        const match = data[0].employee_id.match(/STF-(\d+)/);
        if (match) nextNum = parseInt(match[1]) + 1;
    }
    document.getElementById('staffEmployeeId').value = `STF-${nextNum.toString().padStart(3, '0')}`;
}

async function handleStaffSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('staffId').value;
    const name = document.getElementById('staffName').value;
    const role = document.getElementById('staffRole').value;
    const employee_id = document.getElementById('staffEmployeeId').value;
    const dob = document.getElementById('staffDOB').value;
    const email = document.getElementById('staffEmail').value || null;
    const phone = document.getElementById('staffPhone').value || null;

    const staffData = { name, role, employee_id, date_of_birth: dob, email, phone };

    try {
        let result;
        if (id) {
            result = await supabase.from('staff').update(staffData).eq('id', id);
        } else {
            result = await supabase.from('staff').insert([staffData]).select();
        }

        if (result.error) throw result.error;

        // AUTH SYNC: Create/Update user in Supabase Auth
        await syncStaffAuth(result.data ? result.data[0] : { ...staffData, id });

        alert('Staff member saved successfully and portal access synchronized.');
        document.getElementById('staffModal').classList.add('hidden');
        fetchStaff();
    } catch (err) {
        alert('Error: ' + err.message);
    }
}

async function syncStaffAuth(staff) {
    const password = staff.date_of_birth.split('-').reverse().join('');
    // Use Employee ID as primary login, but Supabase Auth requires email
    const authEmail = `${staff.employee_id.toLowerCase()}@staff.suffah.school`;

    try {
        // We use a helper from a central auth utility or recreate logic here
        // For brevity and to ensure bypass of admin session, we use the tempClient approach
        const tempClient = window.SupabaseLib.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
        });

        const { data, error } = await tempClient.auth.signUp({
            email: authEmail,
            password: password,
            options: { data: { role: staff.role, name: staff.name, employee_id: staff.employee_id } }
        });

        if (error && !error.message.includes('already registered')) throw error;

        // Link auth_id back to staff table if just created
        if (data && data.user) {
            await supabase.from('staff').update({ auth_id: data.user.id }).eq('id', staff.id);
        }
    } catch (err) {
        console.error('Auth Sync Error:', err);
    }
}
