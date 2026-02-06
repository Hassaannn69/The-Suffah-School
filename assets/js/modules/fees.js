// Use global Supabase client for production compatibility
const supabase = window.supabase || (() => {
    console.error('Supabase client not found on window object');
    throw new Error('Supabase client not initialized');
})();

// Import receipt generator
import { generateReceipt } from './receipt-generator.js';

// State management
let allFamilies = [];
let filteredFamilies = [];
let currentPage = 1;
const itemsPerPage = 6;
let currentFamily = null;
let currentStudentId = null;

export async function render(container) {
    window.feesContainer = container;

    if (!document.getElementById('fees-dashboard-style')) {
        const link = document.createElement('link');
        link.id = 'fees-dashboard-style';
        link.rel = 'stylesheet';
        link.href = 'assets/css/fees-dashboard.css';
        document.head.appendChild(link);
    }

    renderFamilyList();
}

/**
 * Layer 1: Family Fee List (Parent View)
 */
async function renderFamilyList() {
    const container = window.feesContainer;
    container.innerHTML = `
        <div class="fees-container p-6 animate-fade-in">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 class="text-3xl font-extrabold text-white tracking-tight">Family Fee Management</h1>
                    <p class="text-slate-400 mt-1 font-medium" id="familyCountSubtext">Reviewing families...</p>
                </div>
                <div class="flex items-center gap-3 w-full md:w-auto">
                    <div class="relative flex-grow md:w-80">
                        <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </span>
                        <input type="text" id="familySearch" placeholder="Search by name or family ID..." 
                            class="glass-input w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none">
                    </div>
                </div>
            </div>

            <div class="kpi-row">
                <div class="kpi-card">
                    <div class="kpi-icon-wrapper bg-blue-500/10 text-blue-500"><svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Assigned</p>
                    <h3 class="text-2xl font-black mt-1" id="kpi-total-assigned">...</h3>
                    <span class="badge-pill bg-blue-500/20 text-blue-400 mt-2 inline-block">+12%</span>
                </div>
                <div class="kpi-card">
                    <div class="kpi-icon-wrapper bg-emerald-500/10 text-emerald-500"><svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Paid</p>
                    <h3 class="text-2xl font-black mt-1" id="kpi-total-paid">...</h3>
                    <span class="badge-pill bg-emerald-500/20 text-emerald-400 mt-2 inline-block" id="kpi-paid-percentage">0%</span>
                </div>
                <div class="kpi-card">
                    <div class="kpi-icon-wrapper bg-amber-500/10 text-amber-500"><svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Outstanding</p>
                    <h3 class="text-2xl font-black mt-1 text-amber-500" id="kpi-outstanding">...</h3>
                    <span class="badge-pill bg-amber-500/20 text-amber-400 mt-2 inline-block">High</span>
                </div>
                <div class="kpi-card">
                    <div class="kpi-icon-wrapper bg-purple-500/10 text-purple-500"><svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" /></svg></div>
                    <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Families</p>
                    <h3 class="text-2xl font-black mt-1" id="kpi-total-families">...</h3>
                </div>
            </div>

            <div id="familyGrid" class="family-grid min-h-[400px]">
                <div class="col-span-full flex items-center justify-center py-20 text-slate-500">Loading families...</div>
            </div>

            <div class="pagination-container">
                <p class="text-slate-500 text-sm font-medium" id="paginationInfo">Showing 0 to 0 of 0 families</p>
                <div class="pagination-bar" id="paginationBar"></div>
            </div>
        </div>
        
        ${renderPaymentModalTemplate()}
    `;

    document.getElementById('familySearch').addEventListener('input', debounce(handleSearch, 300));
    await initializeData();
}

function renderPaymentModalTemplate() {
    return `
        <div id="paymentModal" class="modal-overlay fixed inset-0 bg-black/80 hidden items-center justify-center z-[100] backdrop-blur-sm">
            <div class="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden border border-slate-700 flex flex-col max-h-[90vh]">
                <div class="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                    <div>
                        <h3 class="text-xl font-bold text-white">Record Payment</h3>
                        <p class="text-slate-400 text-sm mt-1" id="paymentModalSubtitle">Select payment distribution method</p>
                    </div>
                    <button onclick="window.closePaymentModal()" class="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-lg">
                        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div class="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <form id="paymentForm" class="space-y-6">
                        <input type="hidden" id="paymentTargetId">
                        
                        <!-- Payment Mode Selection -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label class="cursor-pointer relative">
                                <input type="radio" name="paymentMode" value="collective" class="peer sr-only" checked onchange="window.togglePaymentMode('collective')">
                                <div class="p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-all peer-checked:border-blue-500 peer-checked:bg-blue-500/10 peer-checked:ring-1 peer-checked:ring-blue-500">
                                    <div class="flex items-center gap-3 mb-2">
                                        <div class="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                        </div>
                                        <h4 class="font-bold text-white">Collective Payment</h4>
                                    </div>
                                    <p class="text-xs text-slate-400 leading-relaxed">Enter total amount. System automatically distributes it proportionally across all unpaid fee types.</p>
                                </div>
                            </label>
                            
                            <label class="cursor-pointer relative">
                                <input type="radio" name="paymentMode" value="partial" class="peer sr-only" onchange="window.togglePaymentMode('partial')">
                                <div class="p-4 rounded-xl border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-all peer-checked:border-emerald-500 peer-checked:bg-emerald-500/10 peer-checked:ring-1 peer-checked:ring-emerald-500">
                                    <div class="flex items-center gap-3 mb-2">
                                        <div class="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                        </div>
                                        <h4 class="font-bold text-white">Partial / Custom Split</h4>
                                    </div>
                                    <p class="text-xs text-slate-400 leading-relaxed">Manually allocate specific amounts to each fee type. Ideal for paying specific bills.</p>
                                </div>
                            </label>
                        </div>

                        <!-- Common Details -->
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div class="md:col-span-1">
                                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Date</label>
                                <input type="date" id="paymentDate" required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500 transition-colors">
                            </div>
                            <div class="md:col-span-1">
                                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Method</label>
                                <select id="paymentMethod" required class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500 transition-colors">
                                    <option value="Cash">Cash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="EasyPaisa">EasyPaisa</option>
                                    <option value="JazzCash">JazzCash</option>
                                    <option value="Online">Online Banking</option>
                                </select>
                            </div>
                            <div class="md:col-span-1">
                                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Amount (PKR)</label>
                                <input type="number" id="paymentAmount" required min="1" oninput="window.updatePaymentPreview()" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500 transition-colors font-mono text-lg font-bold" placeholder="0">
                            </div>
                        </div>

                        <!-- Dynamic Content Area -->
                        <div id="paymentDynamicContent" class="space-y-4">
                            <!-- Injected via JS based on mode -->
                        </div>

                        <!-- Summary Footer -->
                        <div class="bg-black/20 rounded-xl p-4 border border-slate-800 flex justify-between items-center">
                            <div>
                                <p class="text-xs text-slate-500 font-bold uppercase">Allocated / Total</p>
                                <p class="text-lg font-mono font-bold text-white"><span id="allocatedAmountDisplay" class="text-emerald-400">0</span> / <span id="totalAmountDisplay">0</span></p>
                            </div>
                            <div class="flex gap-3">
                                <button type="button" onclick="window.closePaymentModal()" class="px-6 py-2.5 rounded-xl border border-slate-700 text-slate-400 font-semibold hover:bg-slate-700 hover:text-white transition-all">Cancel</button>
                                <button type="submit" id="submitPaymentBtn" class="px-8 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                                    Confirm Payment
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
}

async function initializeData() {
    try {
        const { data: feesData, error } = await supabase.from('fees').select('*, students(*)').order('issued_at', { ascending: false });
        const { data: allPayments } = await supabase.from('fee_payments').select('*').order('payment_date', { ascending: false });
        if (error) throw error;

        const familiesMap = new Map();
        feesData.forEach(fee => {
            if (!fee.students) return;
            const s = fee.students;
            const key = s.family_code || s.father_cnic || s.id;
            if (!familiesMap.has(key)) {
                familiesMap.set(key, {
                    key: key,
                    code: (s.family_code || (s.father_cnic ? `FAM-${s.father_cnic.slice(-4)}` : `ID-${s.id.slice(0, 4)}`)).toUpperCase(),
                    seniorMember: s.name,
                    guardian: s.father_name || 'N/A',
                    phone: s.phone || '+92 000 0000000',
                    students: new Map(),
                    totalAssigned: 0,
                    totalPaid: 0,
                    lastPayment: 'N/A',
                    status: 'paid',
                    overdueDays: 0,
                    allFees: []
                });
            }
            const f = familiesMap.get(key);
            if (!f.students.has(s.id)) {
                f.students.set(s.id, {
                    id: s.id,
                    name: s.name,
                    class: s.class,
                    photo_url: s.photo_url,
                    totalFees: 0,
                    paidAmount: 0,
                    outstanding: 0,
                    fees: []
                });
            }

            const student = f.students.get(s.id);
            const net = Math.max(0, (fee.amount || 0) - (fee.discount || 0));
            const paid = (fee.paid_amount || 0);

            student.totalFees += net;
            student.paidAmount += paid;
            student.outstanding = Math.max(0, student.totalFees - student.paidAmount);
            student.fees.push(fee);
            f.totalAssigned += net;
            f.totalPaid += paid;
            f.allFees.push(fee);

            if (net > paid) {
                const dueDate = fee.due_date ? new Date(fee.due_date) : null;
                const now = new Date();
                if (dueDate && !isNaN(dueDate.getTime()) && now > dueDate) {
                    const diff = now - dueDate;
                    f.status = 'overdue';
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    f.overdueDays = Math.max(f.overdueDays, days);
                } else if (f.status !== 'overdue') {
                    f.status = 'partial';
                }
            }
        });

        allFamilies = Array.from(familiesMap.values()).map(f => {
            // Link payments to students and find last payment
            const familyStudentIds = Array.from(f.students.keys());
            const familyPayments = (allPayments || []).filter(p => familyStudentIds.includes(p.student_id));

            f.students.forEach(student => {
                student.payments = familyPayments.filter(p => p.student_id === student.id);
            });

            if (familyPayments.length > 0) {
                f.lastPayment = new Date(familyPayments[0].payment_date).toLocaleDateString('en-GB');
            }

            f.totalDue = Math.max(0, f.totalAssigned - f.totalPaid);
            return f;
        }).sort((a, b) => b.totalAssigned - a.totalAssigned);

        filteredFamilies = [...allFamilies];
        updateStats();
        renderFamilyGrid();
        renderPagination();

        const form = document.getElementById('paymentForm');
        if (form) form.onsubmit = handlePaymentSubmit;
    } catch (err) { console.error(err); }
}

function updateStats() {
    const assigned = allFamilies.reduce((s, f) => s + f.totalAssigned, 0);
    const paid = allFamilies.reduce((s, f) => s + f.totalPaid, 0);
    const outstanding = Math.max(0, assigned - paid);
    const hasDefaulters = allFamilies.some(f => f.status === 'overdue');

    document.getElementById('kpi-total-assigned').textContent = formatCompactCurrency(assigned);
    document.getElementById('kpi-total-paid').textContent = formatCompactCurrency(paid);

    const outstandingEl = document.getElementById('kpi-outstanding');
    outstandingEl.textContent = formatCompactCurrency(outstanding);
    // Change color to red if there are any defaulters or high delinquency
    if (hasDefaulters) {
        outstandingEl.classList.remove('text-amber-500');
        outstandingEl.classList.add('text-red-500');
    } else {
        outstandingEl.classList.remove('text-red-500');
        outstandingEl.classList.add('text-amber-500');
    }

    document.getElementById('kpi-total-families').textContent = allFamilies.length;
    document.getElementById('kpi-paid-percentage').textContent = assigned > 0 ? Math.round((paid / assigned) * 100) + '%' : '0%';
    document.getElementById('familyCountSubtext').textContent = `Reviewing ${allFamilies.length} family accounts...`;
}

function renderFamilyGrid() {
    const grid = document.getElementById('familyGrid');
    const pageItems = filteredFamilies.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    if (!grid) return;
    if (pageItems.length === 0) { grid.innerHTML = '<div class="col-span-full py-20 text-center text-slate-500">No records found.</div>'; return; }

    grid.innerHTML = pageItems.map((f, i) => {
        const isDefaulter = f.status === 'overdue';
        const initials = f.seniorMember.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const overtext = isDefaulter ? `Payment Overdue: ${f.overdueDays} Days` : `Last Payment: ${f.lastPayment}`;

        // Find if any student in this family has a photo to use as the family representative
        const familyPhoto = Array.from(f.students.values()).find(s => s.photo_url)?.photo_url;

        return `
            <div class="family-card ${isDefaulter ? 'defaulter-card' : ''} animate-fade-in shadow-xl shadow-black/20">
                ${isDefaulter ? '<span class="defaulter-tag">Defaulter</span>' : ''}
                <div class="flex items-start gap-4">
                    <div class="avatar-box ${isDefaulter ? 'bg-red-500' : 'bg-blue-600'} text-white font-bold overflow-hidden">
                        ${familyPhoto ? `<img src="${familyPhoto}" class="w-full h-full object-cover">` : initials}
                    </div>
                    <div class="flex-grow min-w-0">
                        <div class="flex items-center gap-2">
                            <h4 class="text-white font-bold truncate">${f.seniorMember}</h4>
                            <span class="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono uppercase">${f.code}</span>
                        </div>
                        <p class="text-xs text-slate-400 mt-0.5">Guardian: ${f.guardian}</p>
                        <div class="flex items-center gap-1.5 mt-2 text-blue-400 text-[11px] font-bold">
                            <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            ${f.students.size} Students Enrolled
                        </div>
                    </div>
                </div>
                <div class="financial-block">
                    <div class="border-r border-slate-700/50"><p class="financial-stat-label">ASSIGNED</p><p class="financial-stat-value text-white">${formatValue(f.totalAssigned)}</p></div>
                    <div class="border-r border-slate-700/50"><p class="financial-stat-label">PAID</p><p class="financial-stat-value text-emerald-400">${formatValue(f.totalPaid)}</p></div>
                    <div><p class="financial-stat-label">DUE</p><p class="financial-stat-value ${f.totalDue > 0 ? (isDefaulter ? 'text-red-500 font-black' : 'text-amber-500') : 'text-slate-500'}">${formatValue(f.totalDue)}</p></div>
                </div>
                <div class="flex justify-between items-center mb-4">
                    <p class="text-[10px] text-slate-500 font-medium">${overtext}</p>
                    <div class="flex items-center gap-2"><span class="status-dot ${isDefaulter ? 'dot-red' : (f.totalDue > 0 ? 'dot-orange' : 'dot-green')}"></span><span class="text-[10px] font-bold text-slate-300 uppercase">${isDefaulter ? 'Overdue' : (f.totalDue > 0 ? 'Partial' : 'Paid')}</span></div>
                </div>
                <button onclick="window.viewFamilyProfile('${f.key}')" class="view-profile-btn ${isDefaulter ? 'solid-red-btn' : 'ghost-btn-blue'}">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    View Family Profile
                </button>
            </div>
        `;
    }).join('');

    const start = (currentPage - 1) * itemsPerPage + 1;
    document.getElementById('paginationInfo').textContent = `Showing ${filteredFamilies.length > 0 ? start : 0} to ${Math.min(currentPage * itemsPerPage, filteredFamilies.length)} of ${filteredFamilies.length} families`;
}

function renderPagination() {
    const bar = document.getElementById('paginationBar');
    const total = Math.ceil(filteredFamilies.length / itemsPerPage);
    if (!bar) return;
    bar.innerHTML = total <= 1 ? '' : `<div class="pagination-item" onclick="window.changePage(${currentPage - 1})">Prev</div>` + Array.from({ length: total }, (_, i) => `<div class="pagination-item ${i + 1 === currentPage ? 'active' : ''}" onclick="window.changePage(${i + 1})">${i + 1}</div>`).join('') + `<div class="pagination-item" onclick="window.changePage(${currentPage + 1})">Next</div>`;
}

window.changePage = (p) => { if (p > 0 && p <= Math.ceil(filteredFamilies.length / itemsPerPage)) { currentPage = p; renderFamilyGrid(); renderPagination(); } };
function handleSearch(e) { filteredFamilies = allFamilies.filter(f => f.seniorMember.toLowerCase().includes(e.target.value.toLowerCase()) || f.code.toLowerCase().includes(e.target.value.toLowerCase())); currentPage = 1; renderFamilyGrid(); renderPagination(); }

/**
 * Layer 2: Family Financial Profile
 */
window.viewFamilyProfile = (key) => {
    const family = allFamilies.find(f => f.key === key);
    if (!family) return;
    currentFamily = family;

    const studentIds = Array.from(family.students.keys());
    currentStudentId = studentIds[0];

    const container = window.feesContainer;
    container.innerHTML = `
        <div class="family-profile-container p-8 animate-fade-in min-h-screen">
            <div class="flex items-center gap-2 text-slate-500 text-sm mb-6">
                <button onclick="window.feesModuleBackToList()" class="hover:text-white transition-colors flex items-center gap-1"><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>Back to Families</button>
                <span>/</span><span class="text-slate-300 font-bold">Family Profile</span>
            </div>

            <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
                <div class="flex items-center gap-5">
                    <div class="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-black text-white shadow-xl shadow-blue-600/20 overflow-hidden">
                        ${Array.from(family.students.values()).find(s => s.photo_url)?.photo_url ? `<img src="${Array.from(family.students.values()).find(s => s.photo_url).photo_url}" class="w-full h-full object-cover">` : family.seniorMember.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                        <div class="flex items-center gap-3"><h2 class="text-3xl font-black text-white">${family.seniorMember}</h2><span class="bg-slate-800 text-slate-400 px-3 py-1 rounded-lg font-mono text-sm font-bold uppercase tracking-wider">${family.code}</span></div>
                        <div class="flex items-center gap-4 mt-1 text-slate-400/80 font-medium">
                            <div class="flex items-center gap-1.5"><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>${family.phone}</div>
                            <div class="flex items-center gap-1.5"><svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>${family.students.size} Siblings</div>
                        </div>
                    </div>
                </div>
                <div class="flex gap-3">
                    <div class="w-12 h-12 rounded-full border border-slate-700 overflow-hidden bg-slate-800 flex items-center justify-center text-white font-bold text-xs uppercase">${family.seniorMember.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
                </div>
            </div>

            <div class="mb-8">
                <p class="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-4">Select Student</p>
                <div class="sibling-selector-bar no-scrollbar">
                    ${Array.from(family.students.values()).map(s => `
                        <div class="sibling-card ${s.id === currentStudentId ? 'active' : ''} mb-2" onclick="window.profileSelectStudent('${s.id}')">
                            <div class="avatar-sm overflow-hidden">
                                ${s.photo_url ? `<img src="${s.photo_url}" class="w-full h-full object-cover">` : s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                                <p class="text-sm font-bold text-white leading-tight truncate max-w-[120px]">${s.name}</p>
                                <p class="text-[10px] text-slate-500 font-bold uppercase mt-0.5">${s.class}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div id="studentProfileContent"></div>
        </div>
        ${renderPaymentModalTemplate()}
    `;
    window.renderStudentFinancials();
};

window.renderStudentFinancials = async () => {
    try {
        const student = currentFamily ? currentFamily.students.get(currentStudentId) : null;
        if (!student) {
            console.error('Student not found for ID:', currentStudentId);
            return;
        }

        const content = document.getElementById('studentProfileContent');
        if (!content) return;

        // Ensure fees array exists
        const studentFees = student.fees || [];
        const isOverdue = student.outstanding > 0 && studentFees.some(f => new Date(f.due_date) < new Date() && (f.amount - (f.discount || 0)) > (f.paid_amount || 0));

        // Use pre-fetched payments from student object
        const studentPayments = student.payments || [];

        const timelineHTML = studentPayments.length > 0
            ? studentPayments.slice(0, 3).map((p, i) => `
                <div class="timeline-item">
                    <span class="timeline-dot ${i === 0 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'}"></span>
                    <p class="text-sm font-bold text-white">${i === 0 ? 'Payment Received' : (p.amount_paid < 1000 ? 'Partial Payment' : 'Payment Received')}</p>
                    <p class="text-[10px] text-slate-500 mt-1 uppercase">${new Date(p.payment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} • Receipt #${p.id.slice(0, 4).toUpperCase()}</p>
                </div>
            `).join('')
            : `<div class="timeline-item"><span class="timeline-dot bg-slate-600"></span><p class="text-sm font-bold text-slate-500">No recent payments</p></div>`;

        content.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-2 space-y-8">
                    <div class="student-kpi-row">
                        <div class="kpi-card bg-[#1E293B]/60 backdrop-blur-sm">
                            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Fees</p>
                            <h4 class="text-2xl font-black text-white mt-1">${window.formatCurrency(student.totalFees)}</h4>
                        </div>
                        <div class="kpi-card bg-[#1E293B]/60 backdrop-blur-sm">
                            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Paid Amount</p>
                            <h4 class="text-2xl font-black text-white mt-1">${window.formatCurrency(student.paidAmount)}</h4>
                        </div>
                        <div class="kpi-card bg-[#1E293B]/60 backdrop-blur-sm border-amber-500/30">
                            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Outstanding</p>
                            <h4 class="text-2xl font-black ${isOverdue ? 'text-red-500' : 'text-amber-500'} mt-1">${window.formatCurrency(student.outstanding)}</h4>
                        </div>
                    </div>

                    <div class="ledger-table-container shadow-2xl shadow-black/40">
                        <div class="ledger-header">
                            <div><h3 class="text-xl font-black text-white">Fee Breakdown</h3><p class="text-xs text-slate-500 font-medium">Financial details for ${student.name}</p></div>
                            <div class="flex gap-2">
                                 <button onclick="window.openPaymentModal('${currentFamily.key}')" class="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-500 transition-colors font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20">
                                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                    Record Payment
                                 </button>
                                 <button class="bg-slate-800 text-slate-400 p-2 rounded-lg hover:text-white transition-colors" title="Filter"><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg></button>
                                 <button onclick="window.printStudentReceipt('${student.id}')" class="bg-slate-800 text-slate-400 p-2 rounded-lg hover:text-white transition-colors" title="Download Statement">
                                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                 </button>
                            </div>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="ledger-table">
                                <thead><tr><th>FEE TYPE</th><th>TOTAL FEE</th><th>DISCOUNT</th><th>PAID</th><th>BALANCE</th><th>STATUS</th></tr></thead>
                                <tbody>
                                    ${studentFees.sort((a, b) => (b.month || '').localeCompare(a.month || '')).map(f => {
            const net = Number(f.amount || 0) - Number(f.discount || 0);
            const bal = Math.max(0, net - Number(f.paid_amount || 0));
            const cls = bal <= 0 ? 'pill-paid' : (Number(f.paid_amount || 0) > 0 ? 'pill-partial' : 'pill-unpaid');
            const lbl = bal <= 0 ? 'PAID' : (Number(f.paid_amount || 0) > 0 ? 'PARTIAL' : 'UNPAID');
            return `<tr><td class="font-bold text-white">${f.fee_type} (${f.month || ''})</td><td class="font-medium text-slate-300">${net.toLocaleString()}</td><td class="text-amber-500 font-medium">${Number(f.discount || 0).toLocaleString()}</td><td class="text-emerald-400 font-medium">${Number(f.paid_amount || 0).toLocaleString()}</td><td class="font-black ${bal > 0 ? 'text-red-500' : 'text-slate-500'}">${bal.toLocaleString()}</td><td><span class="status-pill ${cls}">${lbl}</span></td></tr>`;
        }).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="transactions-section bg-[#1E293B]/40 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl">
                        <div class="p-6 border-b border-slate-700/50">
                             <div class="flex items-center gap-3">
                                <div class="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                                <div>
                                    <h3 class="text-xl font-black text-white">Payment Transactions (Receipts)</h3>
                                    <p class="text-xs text-slate-500 font-medium">Official history of payments made for the current student</p>
                                </div>
                             </div>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="ledger-table">
                                <thead><tr><th>DATE</th><th>RECEIPT #</th><th>METHOD</th><th>AMOUNT</th><th>FEE TYPE/MONTH</th><th>ACTIONS</th></tr></thead>
                                <tbody>
                                    ${studentPayments && studentPayments.length > 0 ? studentPayments.slice(0, 5).map(p => {
            const matchingFee = studentFees.find(f => f.id === p.fee_id);
            return `
                                        <tr>
                                            <td class="text-slate-300 font-medium">${new Date(p.payment_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                            <td class="text-slate-500 font-mono">#${p.id.slice(0, 4).toUpperCase()}</td>
                                            <td><span class="method-pill">${(p.payment_method || 'CASH').toUpperCase()}</span></td>
                                            <td class="font-black text-emerald-400">PKR ${Number(p.amount_paid).toLocaleString()}</td>
                                            <td class="text-slate-400 text-sm">${matchingFee ? matchingFee.fee_type : 'Fee Payment'} (${matchingFee ? matchingFee.month : '--'})</td>
                                            <td>
                                                <button onclick="window.printReceiptById('${p.id}')" class="text-slate-500 hover:text-white transition-colors">
                                                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4h10z" /></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    `;
        }).join('') : '<tr><td colspan="6" class="text-center py-8 text-slate-500 font-medium">No transaction record found</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                        ${studentPayments && studentPayments.length > 5 ? `
                        <div class="p-4 border-t border-slate-700/50 flex justify-center">
                            <button class="text-[11px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors">Load More History</button>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <div class="space-y-8">
                    <div class="bg-[#1E293B]/40 border border-slate-700/50 rounded-2xl p-6 backdrop-blur-md">
                        <h4 class="text-xs font-black text-slate-300 uppercase mb-6 flex items-center gap-2">
                            <span class="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            Recent Activity
                        </h4>
                        <div class="timeline">${timelineHTML}</div>
                        <button class="w-full mt-6 py-3 rounded-xl border border-slate-700/50 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all">View All Logs</button>
                    </div>

                    <div class="consolidated-card relative overflow-hidden shadow-2xl shadow-blue-500/20 p-8">
                        <div class="relative z-10">
                            <p class="text-[10px] font-black text-white/60 uppercase tracking-widest mb-1">Total Family Dues</p>
                            <h3 class="text-4xl font-black text-white mb-2">PKR ${currentFamily.totalDue.toLocaleString()}</h3>
                            <p class="text-[11px] text-white/50 leading-relaxed mb-8">Calculated for ${currentFamily.students.size} siblings including current balance</p>
                            <button onclick="window.printParentReceipt(null, '${currentFamily.code}')" class="w-full bg-white text-blue-600 py-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] transition-all mb-8">
                                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4h10z" /></svg>
                                    Print Consolidated Statement
                                </button>
                            </div>
                        </div>
                        <div class="absolute -bottom-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                    </div>
                </div>
            </div>
        `;
    } catch (e) {
        console.error('Render Fatal Error:', e);
        document.getElementById('studentProfileContent').innerHTML = `<div class="p-8 text-center text-red-500 font-bold">Error loading profile: ${e.message}</div>`;
    }
};

// Window-level helpers
window.feesModuleBackToList = () => { currentFamily = null; currentStudentId = null; renderFamilyList(); };
window.profileSelectStudent = (sid) => { currentStudentId = sid; document.querySelectorAll('.sibling-card').forEach(c => c.classList.toggle('active', c.getAttribute('onclick').includes(sid))); window.renderStudentFinancials(); };
// Helper to get pending fees for current target
function getPendingFees(familyKey) {
    const f = allFamilies.find(x => x.key === familyKey);
    if (!f) return [];
    return f.allFees.filter(x => {
        const net = (x.amount || 0) - (x.discount || 0);
        return net > (x.paid_amount || 0);
    });
}

window.closePaymentModal = () => {
    document.getElementById('paymentModal').classList.remove('flex');
    document.getElementById('paymentModal').classList.add('hidden');
};

window.openPaymentModal = (key) => {
    const f = allFamilies.find(f => f.key === key);
    if (!f) return;

    document.getElementById('paymentTargetId').value = key;
    document.getElementById('paymentAmount').value = f.totalDue;
    document.getElementById('paymentDate').valueAsDate = new Date();
    document.getElementById('paymentModalSubtitle').textContent = `Recording payment for ${f.seniorMember} (${f.code})`;

    // Reset to collective mode by default
    const collectiveRadio = document.querySelector('input[name="paymentMode"][value="collective"]');
    if (collectiveRadio) {
        collectiveRadio.checked = true;
        window.togglePaymentMode('collective'); // Triggers preview update
    }

    document.getElementById('paymentModal').classList.remove('hidden');
    document.getElementById('paymentModal').classList.add('flex');
};

window.togglePaymentMode = (mode) => {
    const container = document.getElementById('paymentDynamicContent');
    const totalAmountInput = document.getElementById('paymentAmount');

    if (mode === 'collective') {
        container.innerHTML = `
            <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Payment Distribution Preview</h4>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr>
                                <th class="pb-2 text-[10px] font-black text-slate-500 uppercase">Fee Type</th>
                                <th class="pb-2 text-[10px] font-black text-slate-500 uppercase text-right">Total Due</th>
                                <th class="pb-2 text-[10px] font-black text-slate-500 uppercase text-right">Allocation</th>
                            </tr>
                        </thead>
                        <tbody id="collectivePreviewBody" class="text-sm">
                            <!-- Populated via JS -->
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        totalAmountInput.readOnly = false;
        totalAmountInput.classList.remove('opacity-50', 'cursor-not-allowed');
        window.updatePaymentPreview();

    } else {
        const familyKey = document.getElementById('paymentTargetId').value;
        const pendingFees = getPendingFees(familyKey);

        const rows = pendingFees.map(fee => {
            const net = (fee.amount || 0) - (fee.discount || 0);
            const due = net - (fee.paid_amount || 0);
            const student = fee.students;

            return `
                <div class="grid grid-cols-12 gap-4 items-center p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                    <div class="col-span-5">
                        <p class="font-bold text-white text-sm">${fee.fee_type}</p>
                        <p class="text-[10px] text-slate-400 uppercase">${student ? student.name : 'Unknown Student'} • ${fee.month || 'N/A'}</p>
                    </div>
                    <div class="col-span-3 text-right">
                        <p class="text-xs font-bold text-amber-500">Due: ${due.toLocaleString()}</p>
                    </div>
                    <div class="col-span-4">
                        <input type="number" 
                            data-fee-id="${fee.id}" 
                            data-max="${due}" 
                            class="partial-payment-input w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-white text-right font-mono text-sm outline-none focus:border-emerald-500 transition-colors" 
                            placeholder="0" 
                            min="0" 
                            max="${due}"
                            oninput="window.recalculateAllocations()">
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700 max-h-[300px] overflow-y-auto custom-scrollbar space-y-2">
                ${rows.length > 0 ? rows : '<p class="text-slate-500 text-center py-4 bg-slate-900 rounded-lg italic">No pending fees to display.</p>'}
            </div>
        `;

        // In partial mode, total amount is derived from inputs, so we can make the main input read-only or just sync it
        totalAmountInput.readOnly = true;
        totalAmountInput.classList.add('opacity-50', 'cursor-not-allowed');
        window.recalculateAllocations();
    }
};

window.updatePaymentPreview = () => {
    const totalPay = Number(document.getElementById('paymentAmount').value) || 0;
    const familyKey = document.getElementById('paymentTargetId').value;
    const pendingFees = getPendingFees(familyKey);
    const tbody = document.getElementById('collectivePreviewBody');

    document.getElementById('totalAmountDisplay').textContent = totalPay.toLocaleString();
    document.getElementById('allocatedAmountDisplay').textContent = totalPay.toLocaleString();

    if (!tbody || pendingFees.length === 0) return;

    // Calculate Total Outstanding
    const totalOutstanding = pendingFees.reduce((sum, f) => {
        const net = (f.amount || 0) - (f.discount || 0);
        return sum + (net - (f.paid_amount || 0));
    }, 0);

    // Generate Rows with Proportional Logic
    let remainingToDistribute = totalPay;

    tbody.innerHTML = pendingFees.map((fee, index) => {
        const net = (fee.amount || 0) - (fee.discount || 0);
        const due = net - (fee.paid_amount || 0);

        // Proportional Calculation: (Due / TotalOutstanding) * TotalPay
        // For the last item, we might need to adjust for rounding, but let's keep it simple first
        // Or better: use the logic requested: "Tuition Fee: 50% of total unpaid -> 1000 from 2000"

        let allocation = 0;
        if (totalOutstanding > 0) {
            const proportion = due / totalOutstanding;
            allocation = Math.floor(totalPay * proportion);
        }

        // Simple cap to ensure we don't overpay a single fee if totalPay > totalOutstanding (though UI should prevent this ideally)
        allocation = Math.min(allocation, due);

        // Visual check
        const isFullyPaid = allocation >= due;

        return `
            <tr class="border-b border-slate-700/50 last:border-0">
                <td class="py-2 pr-2">
                    <p class="text-sm font-medium text-slate-300 truncate max-w-[150px]">${fee.fee_type}</p>
                    <p class="text-[10px] text-slate-500">${fee.students?.name || ''}</p>
                </td>
                <td class="py-2 px-2 text-right font-mono text-xs text-amber-500">${due.toLocaleString()}</td>
                <td class="py-2 pl-2 text-right font-mono text-sm font-bold ${isFullyPaid ? 'text-emerald-400' : 'text-white'}">${allocation.toLocaleString()}</td>
            </tr>
        `;
    }).join('');
};

window.recalculateAllocations = () => {
    const inputs = document.querySelectorAll('.partial-payment-input');
    let total = 0;
    inputs.forEach(input => {
        let val = Number(input.value);
        const max = Number(input.dataset.max);
        if (val > max) {
            val = max;
            input.value = max; // Enforce max cap
        }
        if (val < 0) {
            val = 0;
            input.value = 0;
        }
        total += val;
    });

    document.getElementById('paymentAmount').value = total;
    document.getElementById('totalAmountDisplay').textContent = total.toLocaleString();
    document.getElementById('allocatedAmountDisplay').textContent = total.toLocaleString();
};

async function handlePaymentSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('submitPaymentBtn');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processing...';

    try {
        const mode = document.querySelector('input[name="paymentMode"]:checked').value;
        const familyKey = document.getElementById('paymentTargetId').value;
        const date = document.getElementById('paymentDate').value;
        const method = document.getElementById('paymentMethod').value;

        let paymentsToRecord = [];

        if (mode === 'collective') {
            const totalPay = Number(document.getElementById('paymentAmount').value);
            const pendingFees = getPendingFees(familyKey);
            const totalOutstanding = pendingFees.reduce((sum, f) => sum + ((f.amount - (f.discount || 0)) - (f.paid_amount || 0)), 0);

            if (totalPay <= 0) throw new Error("Please enter a valid amount.");
            if (pendingFees.length === 0) throw new Error("No pending fees to pay.");

            // Distribute proportionally
            let remaining = totalPay;

            // We need two passes: 
            // 1. Calculate ideal proportional amounts
            // 2. Adjust for integer rounding errors to match totalPay exactly (if possible without overpaying)

            let allocations = pendingFees.map(fee => {
                const net = (fee.amount || 0) - (fee.discount || 0);
                const due = net - (fee.paid_amount || 0);
                const proportion = totalOutstanding > 0 ? due / totalOutstanding : 0;
                let allocated = Math.floor(totalPay * proportion);

                // Cap at due
                allocated = Math.min(allocated, due);

                return { fee, due, allocated };
            });

            // Distribute any remainder (caused by floor) to the fees with remaining due, largest first
            let allocatedSum = allocations.reduce((s, a) => s + a.allocated, 0);
            let leftOver = totalPay - allocatedSum;

            if (leftOver > 0) {
                // Sort by due amount descending to absorb remainder
                allocations.sort((a, b) => b.due - a.due);

                for (let item of allocations) {
                    if (leftOver <= 0) break;
                    const room = item.due - item.allocated;
                    const add = Math.min(leftOver, room);
                    item.allocated += add;
                    leftOver -= add;
                }
            }

            paymentsToRecord = allocations.filter(a => a.allocated > 0).map(a => ({
                fee_id: a.fee.id,
                student_id: a.fee.student_id || a.fee.students?.id,
                amount_paid: a.allocated,
                payment_date: date,
                payment_method: method
            }));

        } else {
            // Partial Mode
            const inputs = document.querySelectorAll('.partial-payment-input');
            inputs.forEach(input => {
                const val = Number(input.value);
                if (val > 0) {
                    paymentsToRecord.push({
                        fee_id: input.dataset.feeId,
                        student_id: getStudentIdFromFee(input.dataset.feeId, familyKey), // Helper needed or use map
                        amount_paid: val,
                        payment_date: date,
                        payment_method: method
                    });
                }
            });

            if (paymentsToRecord.length === 0) throw new Error("Please allocate an amount to at least one fee.");
        }

        // Execute Payments
        for (const p of paymentsToRecord) {
            // 1. Insert Payment Record
            const { error: insertError } = await supabase.from('fee_payments').insert({
                fee_id: p.fee_id,
                student_id: p.student_id,
                amount_paid: p.amount_paid,
                payment_date: p.payment_date,
                payment_method: p.payment_method
            });
            if (insertError) throw insertError;

            // 2. Update Fee Status
            // We need to fetch the latest state of this fee to ensure consistency
            const { data: latestFee } = await supabase.from('fees').select('amount, discount, paid_amount').eq('id', p.fee_id).single();
            if (latestFee) {
                const currentPaid = (latestFee.paid_amount || 0);
                const newPaid = currentPaid + p.amount_paid;
                const netMsg = (latestFee.amount || 0) - (latestFee.discount || 0);
                const newStatus = newPaid >= netMsg ? 'paid' : 'partial';

                await supabase.from('fees').update({
                    paid_amount: newPaid,
                    status: newStatus
                }).eq('id', p.fee_id);
            }
        }

        window.toast?.success(`Successfully recorded ${paymentsToRecord.length} payment(s).`);
        window.closePaymentModal();
        await initializeData();

        // Refresh family view if open
        if (currentFamily) {
            const fresh = allFamilies.find(f => f.key === currentFamily.key);
            if (fresh) {
                window.viewFamilyProfile(fresh.key);
                if (currentStudentId) window.profileSelectStudent(currentStudentId);
            }
        }

    } catch (err) {
        console.error('Payment Processing Error:', err);
        alert('Payment Failed: ' + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// Helper needed because partial inputs don't have student context directly attached easily without looking up
function getStudentIdFromFee(feeId, familyKey) {
    const f = allFamilies.find(x => x.key === familyKey);
    const fee = f.allFees.find(x => x.id === feeId);
    return fee?.student_id || fee?.students?.id;
}

window.printStudentReceipt = sid => generateReceipt([sid]);
window.printParentReceipt = (cnic, fcode) => {
    supabase.from('students').select('id').or(`family_code.eq.${fcode},father_cnic.eq.${cnic}`).then(({ data }) => {
        if (data && data.length) generateReceipt(data.map(s => s.id), true);
    });
};
window.feesModuleBulkPay = () => { const f = allFamilies.find(t => t.totalDue > 0); if (f) window.openPaymentModal(f.key); };

function debounce(f, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => f(...a), ms); }; }
function formatCompactCurrency(v) {
    if (v >= 1000000) return `PKR ${(v / 1000000).toFixed(1)}M`.replace('.0M', 'M');
    if (v >= 1000) return `PKR ${(v / 1000).toFixed(1)}K`.replace('.0K', 'K');
    return `PKR ${v}`;
}
function formatValue(v) {
    if (v >= 1000) return (v / 1000).toFixed(1).replace('.0', '') + 'K';
    return v;
}

window.formatCurrency = (amount) => {
    return 'PKR ' + (Number(amount) || 0).toLocaleString();
};
