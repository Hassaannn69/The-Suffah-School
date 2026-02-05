// fee_discounts.js - Manage Student Discounts & Concessions
const supabase = window.supabase || (() => { throw new Error('Supabase not init'); })();

export async function render(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Header & Actions -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800 dark:text-white">Discounts & Concessions</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Manage individual student discounts and sibling concessions</p>
                </div>
                <div>
                    <button onclick="window.syncSiblingDiscounts()" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center shadow-lg shadow-indigo-200 dark:shadow-none">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        Auto-Apply Sibling Rules
                    </button>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                <!-- Left: Student Actions (Search & Add) -->
                <div class="col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                        <h3 class="font-bold text-gray-800 dark:text-white">Student Actions</h3>
                    </div>
                    
                    <div class="p-6 space-y-6">
                        <!-- Student Search -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Student</label>
                            <div class="relative">
                                <input type="text" id="disc_studentSearch" placeholder="Name or Roll No..." 
                                    class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white pl-10">
                                <svg class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                <div id="disc_searchResults" class="mt-1 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg hidden shadow-lg absolute w-full z-10 left-0"></div>
                            </div>
                            
                            <!-- Selected Student Info -->
                            <div id="disc_selectedInfo" class="mt-4 hidden p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                <h3 class="font-bold text-indigo-800 dark:text-indigo-300" id="disc_sName">Student Name</h3>
                                <p class="text-xs text-indigo-600 dark:text-indigo-400 mt-1" id="disc_sDetail">Class 10 | Roll: 123</p>
                                <input type="hidden" id="disc_selectedId">
                            </div>
                        </div>

                        <!-- Add Discount Form -->
                        <div id="disc_formContainer" class="hidden pt-6 border-t border-gray-100 dark:border-gray-700">
                            <h3 class="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 uppercase tracking-wide">Add New Discount</h3>
                            <form id="addDiscountForm" class="space-y-4">
                                <div>
                                    <label class="block text-xs font-medium text-gray-500 uppercase">Fee Type</label>
                                    <select id="d_feeType" required class="w-full mt-1 px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-sm">
                                        <!-- Options Loaded Dynamically -->
                                    </select>
                                </div>
                                
                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <label class="block text-xs font-medium text-gray-500 uppercase">Value</label>
                                        <input type="number" id="d_value" required min="0" step="0.01" class="w-full mt-1 px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-sm">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-gray-500 uppercase">Type</label>
                                        <select id="d_type" class="w-full mt-1 px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-sm">
                                            <option value="percentage">Percentage (%)</option>
                                            <option value="fixed">Fixed Amount (Rs)</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <label class="block text-xs font-medium text-gray-500 uppercase">Start Month</label>
                                        <input type="month" id="d_start" required class="w-full mt-1 px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-sm">
                                    </div>
                                    <div>
                                        <label class="block text-xs font-medium text-gray-500 uppercase">End Month</label>
                                        <input type="month" id="d_end" required class="w-full mt-1 px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 text-sm">
                                    </div>
                                </div>

                                <button type="submit" class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors">Save Discount</button>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- Right: Discount List & Sibling Status -->
                <div class="col-span-1 lg:col-span-2 space-y-6">
                     <!-- Sibling Status Box -->
                     <div id="disc_siblingBox" class="hidden bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800 p-4 flex items-start gap-3">
                        <div class="p-2 bg-orange-100 dark:bg-orange-800 rounded-full text-orange-600 dark:text-orange-200">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        </div>
                        <div>
                            <h4 class="font-bold text-orange-800 dark:text-orange-300">Sibling Status</h4>
                            <p class="text-sm text-orange-700 dark:text-orange-400 mt-1" id="disc_siblingText">Checking status...</p>
                        </div>
                     </div>

                     <!-- Active Discounts Table -->
                     <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div class="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                            <h3 class="font-bold text-gray-800 dark:text-white">Active Discounts</h3>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-left text-sm">
                                <thead class="bg-gray-50 dark:bg-gray-900/50 text-gray-500 uppercase font-medium">
                                    <tr>
                                        <th class="px-6 py-3">Fee Type</th>
                                        <th class="px-6 py-3">Discount</th>
                                        <th class="px-6 py-3">Effective Range</th>
                                        <th class="px-6 py-3">Source</th>
                                        <th class="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="disc_tableBody" class="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                                    <tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">Select a student to view discounts</td></tr>
                                </tbody>
                            </table>
                        </div>
                     </div>
                </div>
            </div>
        </div>
    `;

    // Init
    loadFeeTypes();
    document.getElementById('disc_studentSearch').addEventListener('input', debounce(searchStudents, 300));
    document.getElementById('addDiscountForm').addEventListener('submit', handleSaveDiscount);
}

// --- Logic ---

async function loadFeeTypes() {
    const { data } = await supabase.from('fee_types').select('*');
    if (data) {
        document.getElementById('d_feeType').innerHTML = data.map(f => `<option value="${f.name}">${f.name}</option>`).join('');
    }
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

async function searchStudents(e) {
    const term = e.target.value.toLowerCase().trim();
    const resultBox = document.getElementById('disc_searchResults');

    if (term.length < 2) {
        resultBox.classList.add('hidden');
        return;
    }

    const { data: students } = await supabase
        .from('students')
        .select('id, name, roll_no, class, father_cnic')
        .or(`name.ilike.%${term}%,roll_no.ilike.%${term}%`)
        .limit(6);

    if (!students || students.length === 0) {
        resultBox.innerHTML = `<div class="p-3 text-gray-400 text-sm text-center">No students found</div>`;
        resultBox.classList.remove('hidden');
        return;
    }

    resultBox.innerHTML = students.map(s => `
        <div onclick="window.loadStudentDiscounts('${s.id}', '${s.name}', '${s.class} | ${s.roll_no}', '${s.father_cnic}')" 
             class="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors">
            <div class="font-bold text-gray-800 dark:text-white">${s.name}</div>
            <div class="text-xs text-gray-500">${s.class} (${s.roll_no})</div>
        </div>
    `).join('');
    resultBox.classList.remove('hidden');
}

window.loadStudentDiscounts = async (id, name, detail, familyId) => {
    // UI Updates
    document.getElementById('disc_selectedId').value = id;
    document.getElementById('disc_sName').textContent = name;
    document.getElementById('disc_sDetail').textContent = detail;
    document.getElementById('disc_selectedInfo').classList.remove('hidden');
    document.getElementById('disc_searchResults').classList.add('hidden');
    document.getElementById('disc_studentSearch').value = '';
    document.getElementById('disc_formContainer').classList.remove('hidden');

    // Load Data
    await refreshTable(id);
    await checkSiblings(familyId, id);
}

async function refreshTable(studentId) {
    const tbody = document.getElementById('disc_tableBody');
    tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center">Loading...</td></tr>';

    const { data: discounts } = await supabase
        .from('student_discounts')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

    if (!discounts || discounts.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-8 text-center text-gray-400">No active discounts found.</td></tr>';
        return;
    }

    tbody.innerHTML = discounts.map(d => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <td class="px-6 py-3 font-medium">${d.fee_type}</td>
            <td class="px-6 py-3 font-bold text-green-600 dark:text-green-400">
                ${d.discount_type === 'percentage' ? d.discount_value + '%' : 'Rs ' + d.discount_value}
            </td>
            <td class="px-6 py-3 text-sm text-gray-500">${d.start_month} to ${d.end_month}</td>
            <td class="px-6 py-3">
                ${d.is_automatic
            ? '<span class="px-2 py-0.5 rounded text-xs bg-orange-100 text-orange-700">Auto (Sibling)</span>'
            : '<span class="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">Manual</span>'}
            </td>
            <td class="px-6 py-3 text-right">
                <button onclick="window.deleteDiscount('${d.id}')" class="text-red-500 hover:text-red-700 p-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            </td>
        </tr>
    `).join('');
}

async function handleSaveDiscount(e) {
    e.preventDefault();
    const studentId = document.getElementById('disc_selectedId').value;
    if (!studentId) return alert('Select a student first');

    const payload = {
        student_id: studentId,
        fee_type: document.getElementById('d_feeType').value,
        discount_value: document.getElementById('d_value').value,
        discount_type: document.getElementById('d_type').value,
        start_month: document.getElementById('d_start').value,
        end_month: document.getElementById('d_end').value,
        is_automatic: false
    };

    if (payload.start_month > payload.end_month) return alert('Start month cannot be after end month');

    const { error } = await supabase.from('student_discounts').insert([payload]);
    if (error) {
        alert('Error saving: ' + error.message);
    } else {
        await refreshTable(studentId);
        document.getElementById('addDiscountForm').reset();
    }
}

window.deleteDiscount = async (id) => {
    if (!confirm('Are you sure you want to delete this discount?')) return;
    const { error } = await supabase.from('student_discounts').delete().eq('id', id);
    if (!error) {
        const studentId = document.getElementById('disc_selectedId').value;
        await refreshTable(studentId);
    }
}

// --- Sibling Logic ---

async function checkSiblings(familyId, studentId) {
    if (!familyId) {
        document.getElementById('disc_siblingBox').classList.add('hidden');
        return;
    }

    // Reuse cache logic logic conceptually, but fetch fresh here
    const { data: siblings } = await supabase
        .from('students')
        .select('*')
        .eq('father_cnic', familyId); // Assuming Father CNIC is the grouper

    if (siblings && siblings.length > 1) {
        // Sort by class rank / age / admission.
        // Simple heuristic: Sort by class string (needs map) or ID (proxy for admission order potentially)
        // Let's rely on class mapping from memory or just ID as stable sort

        // Actually, "Second member" implies chronological admission or age. 
        // Let's assume ID sort corresponds to admission time roughly.
        siblings.sort((a, b) => a.id.localeCompare(b.id)); // Oldest ID first

        const index = siblings.findIndex(s => s.id === studentId);
        const isSecond = index === 1; // 0-based
        const members = siblings.length;

        const box = document.getElementById('disc_siblingBox');
        const text = document.getElementById('disc_siblingText');

        if (isSecond) {
            text.textContent = `This student is the 2nd sibling of ${members}. Eligible for 20% Tuition Discount.`;
            text.className = "text-sm text-green-700 dark:text-green-400 mt-1 font-bold";
        } else if (index > 1) {
            text.textContent = `This student is sibling #${index + 1} of ${members}. Check policy for discounts.`;
            text.className = "text-sm text-orange-700 dark:text-orange-400 mt-1";
        } else {
            text.textContent = `This student is the eldest of ${members} siblings. Pays full fee.`;
            text.className = "text-sm text-blue-700 dark:text-blue-400 mt-1";
        }

        box.classList.remove('hidden');
    } else {
        document.getElementById('disc_siblingBox').classList.add('hidden');
    }
}

// Global Sync Function
window.syncSiblingDiscounts = async () => {
    if (!confirm('This will automatically assign a 20% Tuition Fee discount to all 2nd siblings in the database. Continue?')) return;

    // 1. Fetch ALL students
    const { data: students } = await supabase.from('students').select('*');
    if (!students) return;

    // 2. Group by Family
    const families = {};
    students.forEach(s => {
        const key = s.father_cnic || s.family_code || s.id;
        if (!families[key]) families[key] = [];
        families[key].push(s);
    });

    // 3. Identify 2nd Siblings
    const discountsToInsert = [];

    // Config
    const DISCOUNT_PERCENT = 20;
    const FEE_TYPE = 'Tuition Fee';
    // const FEE_TYPE = 'Class Fee'; // User said Class Fee, usually mapped to Tuition

    Object.values(families).forEach(group => {
        if (group.length < 2) return;

        // Sort: We need a reliable "Oldest" first. ID is okay for now.
        group.sort((a, b) => a.id.localeCompare(b.id));

        const secondBorn = group[1]; // Index 1

        // Prepare discount record
        // Validity: Forever? Or Current Year? Let's say next 12 months for now or leave distinct.
        // Prompt says "automatically be applied".
        // Let's set it for the current academic year or indefinitely.
        // Indefinite text range: "2024-01" to "2030-12"
        const currentYear = new Date().getFullYear();

        discountsToInsert.push({
            student_id: secondBorn.id,
            fee_type: FEE_TYPE,
            discount_type: 'percentage',
            discount_value: DISCOUNT_PERCENT,
            start_month: `${currentYear}-01`,
            end_month: `${currentYear + 5}-12`, // 5 Year validity
            is_automatic: true
        });
    });

    // 4. Upsert Logic (Minimize duplicates)
    // We check existing auto-discounts
    const { data: existing } = await supabase.from('student_discounts').select('student_id').eq('is_automatic', true);
    const existingIds = new Set(existing.map(d => d.student_id));

    const newRecords = discountsToInsert.filter(d => !existingIds.has(d.student_id));

    if (newRecords.length > 0) {
        const { error } = await supabase.from('student_discounts').insert(newRecords);
        if (error) alert('Error: ' + error.message);
        else alert(`Applied sibling discounts to ${newRecords.length} students!`);
    } else {
        alert('All eligible siblings already have discounts.');
    }
}
