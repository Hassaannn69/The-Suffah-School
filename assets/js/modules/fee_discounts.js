// fee_discounts.js - Manage Student Discounts & Concessions
const supabase = window.supabase || (() => { throw new Error('Supabase not init'); })();

export async function render(container) {
    container.innerHTML = `
        <style>
            @keyframes pulse-indigo {
                0%, 100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4); }
                50% { box-shadow: 0 0 0 10px rgba(79, 70, 229, 0); }
            }
            .btn-pulse { animation: pulse-indigo 2s infinite; }
            .discount-card { background: #1e293b; border: 1px solid rgba(255,255,255,0.05); }
            .input-dark { background: #0f172a; border: 1px solid #334155; color: #FFFFFF !important; }
            .input-dark::placeholder { color: #94a3b8 !important; }
            .select-dark option { background: #1e293b; color: #FFFFFF !important; }
            
            /* High Contrast Force */
            .text-white-force { color: #FFFFFF !important; }
            .placeholder-visible::placeholder { color: #94a3b8 !important; opacity: 1; }
            
            /* Ensure alignment */
            .main-workspace-container { display: flex; gap: 24px; align-items: flex-start; }
            .sidebar-column { width: 30%; display: flex; flex-direction: column; gap: 24px; }
            .content-column { width: 70%; display: flex; flex-direction: column; gap: 24px; }
        </style>

        <div class="space-y-6">
            <!-- Header & Actions -->
            <div class="bg-white dark:bg-[#1e293b] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700/50 p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h2 class="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Discounts & Concessions</h2>
                    <p class="text-sm text-gray-500 dark:text-indigo-300 font-medium">Configure individual grants and automated sibling rules</p>
                </div>
                <div>
                    <button onclick="window.syncSiblingDiscounts()" class="btn-pulse px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all flex items-center shadow-lg shadow-indigo-500/20 active:scale-95">
                        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        Auto-Apply Sibling Rules
                    </button>
                </div>
            </div>

            <!-- Three-Section Grid (30/70 Split) -->
            <div class="main-workspace-container flex flex-col lg:flex-row">
                
                <!-- 1. Left Sidebar (The Control Column - 30% Width) -->
                <div class="sidebar-column w-full lg:w-[30%]">
                    <!-- Student Finder Card -->
                    <div class="dark:bg-[#1e293b] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700/50 overflow-hidden">
                        <div class="px-8 py-5 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
                            <h3 class="font-black text-gray-800 dark:text-white text-[10px] uppercase tracking-widest">Student Finder</h3>
                        </div>
                        <div class="p-8">
                            <label class="block text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">Search Student</label>
                            <div class="relative">
                                <input type="text" id="disc_studentSearch" placeholder="Enter Name or Roll No..." 
                                    class="input-dark w-full px-5 py-3 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none pl-12 transition-all placeholder-visible">
                                <svg class="w-5 h-5 text-white absolute left-4 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                <div id="disc_searchResults" class="mt-2 max-h-64 overflow-y-auto bg-white dark:bg-[#0f172a] border border-gray-100 dark:border-gray-700 rounded-xl hidden shadow-2xl absolute w-full z-[100] left-0 animate-fadeIn text-white"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Student Profile Card (RESTORED) -->
                    <div id="disc_selectedInfo" class="dark:bg-[#1e293b] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700/50 overflow-hidden animate-fadeIn">
                        <div class="px-8 py-4 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
                            <h3 class="font-black text-gray-800 dark:text-white text-[10px] uppercase tracking-widest">Student Profile</h3>
                        </div>
                        <div class="p-8">
                            <div id="disc_profileContent" class="hidden">
                                <div class="flex items-center gap-4">
                                    <div class="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20" id="disc_sInitial">?</div>
                                    <div>
                                        <h3 class="font-black text-gray-900 dark:text-white text-lg tracking-tight" id="disc_sName">Student Name</h3>
                                        <p class="text-xs text-indigo-600 dark:text-indigo-400 font-black mt-1 uppercase tracking-wider" id="disc_sDetail">Class | Roll</p>
                                    </div>
                                </div>
                                <input type="hidden" id="disc_selectedId">
                            </div>
                            <div id="disc_profilePlaceholder" class="py-6 text-center">
                                <p class="text-[10px] font-black uppercase text-gray-500 tracking-widest">No Student Selected</p>
                            </div>
                        </div>
                    </div>

                    <!-- Create New Discount Card (RESTORED) -->
                    <div class="dark:bg-[#1e293b] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700/50 overflow-hidden">
                        <div class="px-8 py-5 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30 flex items-center gap-3">
                            <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0h-3m-9-4h18c1.104 0 2 .896 2 2v8c0 1.104-.896 2-2 2H3c-1.104 0-2-.896-2-2V7c0-1.104.896-2 2-2z"/></svg>
                            <h3 class="text-[10px] font-black uppercase tracking-widest text-gray-800 dark:text-white">Create New Discount</h3>
                        </div>
                        <div id="disc_formContainer" class="p-8">
                           <div id="disc_formPlaceholder" class="py-12 text-center">
                                <p class="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-4">Select student to create grant</p>
                                <div class="w-12 h-12 rounded-full border-2 border-dashed border-gray-700 mx-auto flex items-center justify-center text-gray-700">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                                </div>
                           </div>
                           <form id="addDiscountForm" class="space-y-5 hidden">
                                <div>
                                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Discount Category</label>
                                    <select id="d_feeType" required class="input-dark select-dark w-full px-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-white-force">
                                        <!-- Options Loaded Dynamically -->
                                    </select>
                                </div>
                                
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Benefit Value</label>
                                        <input type="number" id="d_value" required min="0" step="0.01" placeholder="0.00" class="input-dark w-full px-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-white-force placeholder-visible">
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Grant Type</label>
                                        <select id="d_type" class="input-dark select-dark w-full px-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-white-force">
                                            <option value="percentage">Percent (%)</option>
                                            <option value="fixed">Fixed (PKR)</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Starts From</label>
                                        <input type="month" id="d_start" required style="color-scheme: dark;" class="input-dark w-full px-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-white-force">
                                    </div>
                                    <div>
                                        <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Active Until</label>
                                        <input type="month" id="d_end" required style="color-scheme: dark;" class="input-dark w-full px-4 py-3 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-white-force">
                                    </div>
                                </div>

                                <div class="pt-4">
                                    <button type="submit" class="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-indigo-500/20 active:scale-95">Save Grant Policy</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- 2. & 3. Right-Hand Pane (Intelligence + Data Workspace - 70% Width) -->
                <div class="content-column w-full lg:w-[70%]">
                    
                    <!-- Sibling Matching Intelligence (Banner) (RESTORED TOP ALIGNMENT) -->
                    <div id="disc_siblingBox" class="dark:bg-[#1e293b] rounded-2xl border border-dashed border-gray-700 p-6 flex items-center gap-5 transition-all">
                        <div id="disc_siblingIcon" class="w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center text-gray-600 font-black">
                            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        </div>
                        <div>
                            <h4 class="font-black text-gray-500 dark:text-white uppercase text-[10px] tracking-widest">Sibling Matching Intelligence</h4>
                            <p class="text-sm text-gray-500 mt-1 font-medium" id="disc_siblingText">Waiting for student selection...</p>
                        </div>
                    </div>

                    <!-- Active Policy Grants Card (Workspace) -->
                    <div class="dark:bg-[#1e293b] rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700/50 overflow-hidden flex-1 flex flex-col">
                        <div class="px-8 py-5 border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30 flex justify-between items-center">
                            <h3 class="font-black text-gray-800 dark:text-white text-[10px] uppercase tracking-widest">Active Policy Grants</h3>
                            <span class="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase rounded-lg">Real-time Data</span>
                        </div>
                        <div class="flex-1 overflow-x-auto min-h-[400px]">
                            <table class="w-full text-left text-sm">
                                <thead class="bg-gray-50 dark:bg-[#0f172a] uppercase font-black text-[10px] tracking-widest border-b border-gray-100 dark:border-gray-800">
                                    <tr class="text-white-force">
                                        <th class="px-8 py-5 text-white-force font-black">Fee Category</th>
                                        <th class="px-8 py-5 text-white-force font-black">Benefit</th>
                                        <th class="px-8 py-5 text-white-force font-black">Validity Range</th>
                                        <th class="px-8 py-5 text-white-force font-black">Origin</th>
                                        <th class="px-8 py-5 text-right text-white-force font-black">Control</th>
                                    </tr>
                                </thead>
                                <tbody id="disc_tableBody" class="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                                    <tr>
                                        <td colspan="5" class="px-8 py-32 text-center text-white-force">
                                            <div class="flex flex-col items-center justify-center">
                                                <div class="w-24 h-24 bg-indigo-600/10 rounded-full flex items-center justify-center text-indigo-500 mb-8 border border-indigo-500/20">
                                                    <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                                                </div>
                                                <h4 class="font-black text-white text-xl uppercase tracking-tighter">No Student Selected</h4>
                                                <p class="text-xs text-gray-400 mt-3 max-w-sm font-medium leading-relaxed">Use the Student Finder on the left to view active grants, sibling concessions, and scholarship history.</p>
                                            </div>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- 4. Footer Cards (RESTORED ALIGNMENT) -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="p-8 dark:bg-[#1e293b] rounded-2xl border border-dashed border-gray-100 dark:border-gray-700/50 flex gap-5">
                            <div class="w-12 h-12 rounded-xl bg-indigo-600/10 flex items-center justify-center text-indigo-500 flex-shrink-0">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            </div>
                            <div>
                                <h5 class="text-[10px] font-black uppercase text-gray-400 dark:text-white tracking-widest mb-2">Grant Priority</h5>
                                <p class="text-[11px] text-gray-500 dark:text-indigo-200/60 leading-relaxed font-medium">Automatic sibling discounts are always processed first. Manual grants will override defaults.</p>
                            </div>
                        </div>
                        <div class="p-8 dark:bg-[#1e293b] rounded-2xl border border-dashed border-gray-100 dark:border-gray-700/50 flex gap-5">
                            <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0">
                                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                            </div>
                            <div>
                                <h5 class="text-[10px] font-black uppercase text-gray-400 dark:text-white tracking-widest mb-2">System Integrity</h5>
                                <p class="text-[11px] text-gray-500 dark:text-emerald-200/60 leading-relaxed font-medium">All changes are logged. Deleting a grant will instantly revert the next fee generation.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    ;

    // Initialize module features
    loadFeeTypes();
    const searchInput = document.getElementById('disc_studentSearch');
    if (searchInput) searchInput.addEventListener('input', debounce(searchStudents, 300));

    const discountForm = document.getElementById('addDiscountForm');
    if (discountForm) discountForm.addEventListener('submit', handleSaveDiscount);
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
    document.getElementById('disc_sInitial').textContent = name.charAt(0).toUpperCase();

    // Toggle Visibility
    const profPlaceholder = document.getElementById('disc_profilePlaceholder');
    const profContent = document.getElementById('disc_profileContent');
    const formPlaceholder = document.getElementById('disc_formPlaceholder');
    const formActual = document.getElementById('addDiscountForm');

    if (profPlaceholder) profPlaceholder.classList.add('hidden');
    if (profContent) profContent.classList.remove('hidden');
    if (formPlaceholder) formPlaceholder.classList.add('hidden');
    if (formActual) formActual.classList.remove('hidden');

    document.getElementById('disc_searchResults').classList.add('hidden');
    document.getElementById('disc_studentSearch').value = '';

    // Load Data
    await refreshTable(id);
    await checkSiblings(familyId, id);
}

async function refreshTable(studentId) {
    const tbody = document.getElementById('disc_tableBody');
    tbody.innerHTML = '<tr><td colspan="5" class="px-8 py-12 text-center text-gray-400"><div class="flex flex-col items-center"><div class="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div><span class="mt-2 text-[10px] font-black uppercase tracking-widest text-white-force">Accessing Ledger...</span></div></td></tr>';

    const { data: discounts } = await supabase
        .from('student_discounts')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

    if (!discounts || discounts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-8 py-20">
                    <div class="flex flex-col items-center text-center">
                        <div class="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500 mb-4">
                            <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        </div>
                        <h4 class="font-black text-gray-900 dark:text-white text-lg">Clean Slab</h4>
                        <p class="text-xs text-gray-500 dark:text-indigo-200/60 mt-2 max-w-sm">This student is currently paying 100% of their dues. No specific concessions found.</p>
                    </div>
                </td>
            </tr>`;
        return;
    }

    tbody.innerHTML = discounts.map(d => `
        <tr class="group hover:bg-gray-50 dark:hover:bg-indigo-600/5 transition-colors">
            <td class="px-8 py-4 font-black text-gray-900 dark:text-white text-sm uppercase tracking-tight">${d.fee_type}</td>
            <td class="px-8 py-4">
                <div class="flex items-center gap-2">
                    <span class="px-2 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black rounded-lg">
                        ${d.discount_type === 'percentage' ? d.discount_value + '%' : 'Rs ' + d.discount_value}
                    </span>
                </div>
            </td>
            <td class="px-8 py-4 text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest">${d.start_month} <span class="text-indigo-500 mx-1">→</span> ${d.end_month}</td>
            <td class="px-8 py-4">
                ${d.is_automatic
            ? '<span class="px-3 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase rounded-lg border border-orange-500/20">System ID</span>'
            : '<span class="px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase rounded-lg border border-indigo-500/20">Authorized</span>'}
            </td>
            <td class="px-8 py-4 text-right">
                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="window.deleteDiscount('${d.id}')" class="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
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
    const box = document.getElementById('disc_siblingBox');
    const text = document.getElementById('disc_siblingText');
    const icon = document.getElementById('disc_siblingIcon');

    if (!familyId) {
        text.textContent = "No sibling data available for this student.";
        text.className = "text-sm text-gray-400 mt-1";
        if (icon) icon.className = "w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center text-gray-600 font-black";
        return;
    }

    const { data: siblings } = await supabase
        .from('students')
        .select('id')
        .eq('father_cnic', familyId);

    if (siblings && siblings.length > 1) {
        siblings.sort((a, b) => a.id.localeCompare(b.id));
        const index = siblings.findIndex(s => s.id === studentId);
        const members = siblings.length;

        box.className = "bg-emerald-500/10 dark:bg-emerald-600/10 rounded-2xl border border-emerald-500/20 p-6 flex items-center gap-5 transition-all";
        if (icon) icon.className = "w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 font-black";

        if (index === 1) {
            text.textContent = `2nd Sibling detected (${members} total). Eligible for 20% Tuition Discount.`;
            text.className = "text-sm text-emerald-600 dark:text-emerald-400 mt-1 font-black uppercase tracking-tight";
        } else if (index > 1) {
            text.textContent = `Sibling #${index + 1} of ${members}. Multiple-sibling policy applies.`;
            text.className = "text-sm text-emerald-600 dark:text-emerald-400 mt-1 font-bold";
        } else {
            text.textContent = `Eldest of ${members} siblings. Automatic rules may not apply.`;
            text.className = "text-sm text-indigo-500 dark:text-indigo-400 mt-1 font-bold";
        }
    } else {
        text.textContent = "This student is currently recorded as the only enrolled member of their family.";
        text.className = "text-sm text-gray-500 mt-1";
        if (icon) icon.className = "w-14 h-14 bg-gray-800 rounded-2xl flex items-center justify-center text-gray-600 font-black";
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
