// Use global Supabase client for production compatibility
const supabase = window.supabase || (() => {
    console.error('Supabase client not found on window object');
    throw new Error('Supabase client not initialized');
})();

// Import receipt generator and unified balance calculation
import { generateReceipt, calculateUnifiedBalance } from './receipt-generator.js';

// Source of truth: Paid amounts and outstanding in the UI come from fee_payments (and receipts).
// fees.paid_amount is kept in sync by the DB trigger (on fee_payments) and by void-receipt logic.

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
                                    <p class="text-xs text-slate-400 leading-relaxed">Enter total amount. System automatically distributes it equally across all unpaid fee types.</p>
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
                                <input type="date" id="paymentDate" required onkeydown="if(event.key==='Enter'){event.preventDefault();}" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500 transition-colors">
                            </div>
                            <div class="md:col-span-1">
                                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Method</label>
                                <select id="paymentMethod" required onkeydown="if(event.key==='Enter'){event.preventDefault();}" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500 transition-colors">
                                    <option value="Cash">Cash</option>
                                    <option value="Bank Transfer">Bank Transfer</option>
                                    <option value="EasyPaisa">EasyPaisa</option>
                                    <option value="JazzCash">JazzCash</option>
                                    <option value="Online">Online Banking</option>
                                </select>
                            </div>
                            <div class="md:col-span-1">
                                <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Amount (PKR)</label>
                                <input type="number" id="paymentAmount" required min="1" oninput="window.updatePaymentPreview()" onkeydown="if(event.key==='Enter'){event.preventDefault();document.getElementById('submitPaymentBtn')?.click();}" class="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500 transition-colors font-mono text-lg font-bold" placeholder="0">
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
        const { data: feesData, error } = await supabase.from('fees').select('*, students(*)').order('generated_at', { ascending: false });
        let allPayments;
        const { data: paymentsWithReceipts, error: payErr } = await supabase.from('fee_payments').select('*, receipts(receipt_number, payment_date, payment_method, total_paid)').order('payment_date', { ascending: false });
        if (payErr) {
            const { data: paymentsOnly } = await supabase.from('fee_payments').select('*').order('payment_date', { ascending: false });
            allPayments = paymentsOnly || [];
        } else {
            allPayments = paymentsWithReceipts || [];
        }
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

            student.totalFees += net;
            student.fees.push(fee);
            f.totalAssigned += net;
            f.allFees.push(fee);
        });

        allFamilies = Array.from(familiesMap.values()).map(f => {
            // Link payments to students and find last payment
            const familyStudentIds = Array.from(f.students.keys());
            const familyPayments = (allPayments || []).filter(p => familyStudentIds.includes(p.student_id));

            // Paid amounts from ACTUAL payment transactions (not fees.paid_amount)
            const familyTotalPaid = familyPayments.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
            f.totalPaid = familyTotalPaid;

            f.students.forEach(student => {
                student.payments = familyPayments.filter(p => p.student_id === student.id);
                const studentPaid = student.payments.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
                student.paidAmount = studentPaid;
                // Use unified balance calculation for consistency (same as Total Family Dues)
                const studentStudentsArray = [{ id: student.id, fees: student.fees || [] }];
                student.outstanding = calculateUnifiedBalance(studentStudentsArray, student.payments);
            });

            if (familyPayments.length > 0) {
                f.lastPayment = (window.formatPaymentDateLocal || ((v) => new Date(v).toLocaleDateString('en-GB')))(familyPayments[0].payment_date);
            }

            // USE UNIFIED BALANCE CALCULATION - Single Source of Truth
            const studentsArray = Array.from(f.students.values()).map(s => ({
                id: s.id,
                fees: s.fees || []
            }));
            f.totalDue = calculateUnifiedBalance(studentsArray, familyPayments);

            // Status/overdue from actual outstanding (based on payments, not fee.paid_amount)
            f.overdueDays = 0;
            if (f.totalDue <= 0) {
                f.status = 'paid';
            } else {
                f.status = 'partial';
                f.students.forEach(student => {
                    if (student.outstanding > 0 && student.fees) {
                        student.fees.forEach(fee => {
                            const net = (fee.amount || 0) - (fee.discount || 0);
                            const paidForFee = student.payments.filter(p => p.fee_id === fee.id).reduce((s, p) => s + Number(p.amount_paid || 0), 0);
                            if (net > paidForFee && fee.due_date) {
                                const d = new Date(fee.due_date);
                                if (!isNaN(d.getTime()) && new Date() > d) {
                                    f.status = 'overdue';
                                    const days = Math.floor((new Date() - d) / (1000 * 60 * 60 * 24));
                                    f.overdueDays = Math.max(f.overdueDays, days);
                                }
                            }
                        });
                    }
                });
            }

            return f;
        }).sort((a, b) => b.totalAssigned - a.totalAssigned);

        filteredFamilies = [...allFamilies];
        updateStats();
        renderFamilyGrid();
        renderPagination();

        // Attach form handler to prevent default submission
        const form = document.getElementById('paymentForm');
        if (form) {
            // Remove any existing handlers to avoid duplicates
            form.onsubmit = null;
            form.removeEventListener('submit', handlePaymentSubmit);
            // Add handler
            form.onsubmit = handlePaymentSubmit;
            form.addEventListener('submit', handlePaymentSubmit, false);
        }
        // Auto-open a specific student's family profile if redirected from student profile
        const pendingTarget = sessionStorage.getItem('suffah_open_fee_student');
        if (pendingTarget) {
            sessionStorage.removeItem('suffah_open_fee_student');
            try {
                const { familyKey, studentId } = JSON.parse(pendingTarget);
                const targetFamily = allFamilies.find(f => f.key === familyKey);
                if (targetFamily) {
                    window.viewFamilyProfile(targetFamily.key);
                    if (studentId && window.profileSelectStudent) {
                        window.profileSelectStudent(studentId);
                    }
                }
            } catch (e) { console.warn('Auto-open fee profile failed:', e); }
        }

    } catch (err) { console.error(err); }
}

function updateStats() {
    const assigned = allFamilies.reduce((s, f) => s + f.totalAssigned, 0);
    const paid = allFamilies.reduce((s, f) => s + f.totalPaid, 0);
    // Use unified balance (totalDue) for consistency - same calculation as Total Family Dues
    const outstanding = allFamilies.reduce((s, f) => s + f.totalDue, 0);
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
        const displayName = f._searchMatchName || f.seniorMember;
        const showSeniorNote = f._searchMatchName && f._searchMatchName !== f.seniorMember;
        const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const overtext = isDefaulter ? `Payment Overdue: ${f.overdueDays} Days` : `Last Payment: ${f.lastPayment}`;

        // Find if any student in this family has a photo to use as the family representative
        // If search matched a specific student, prefer their photo
        let familyPhoto;
        if (f._searchMatchName) {
            const matchedStudent = Array.from(f.students.values()).find(s => s.name === f._searchMatchName);
            familyPhoto = matchedStudent?.photo_url || Array.from(f.students.values()).find(s => s.photo_url)?.photo_url;
        } else {
            familyPhoto = Array.from(f.students.values()).find(s => s.photo_url)?.photo_url;
        }

        return `
            <div class="family-card animate-fade-in shadow-xl shadow-black/20">
                ${isDefaulter ? '<span class="defaulter-tag">Defaulter</span>' : ''}
                <div class="flex items-start gap-4">
                    <div class="avatar-box bg-slate-600 text-white font-bold overflow-hidden">
                        ${familyPhoto ? `<img src="${familyPhoto}" class="w-full h-full object-cover">` : initials}
                    </div>
                    <div class="flex-grow min-w-0">
                        <div class="flex items-center gap-2">
                            <h4 class="text-white font-bold truncate">${displayName}</h4>
                            <span class="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono uppercase">${f.code}</span>
                        </div>
                        ${showSeniorNote ? `<p class="text-[10px] text-indigo-400 mt-0.5">Family of: ${f.seniorMember}</p>` : ''}
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
                <button onclick="window.viewFamilyProfile('${f.key}')" class="view-profile-btn view-profile-btn-neutral">
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
function handleSearch(e) {
    const query = e.target.value.trim().toLowerCase();
    if (!query) {
        filteredFamilies = [...allFamilies];
        // Clear any search match annotations
        allFamilies.forEach(f => delete f._searchMatchName);
    } else {
        filteredFamilies = allFamilies.filter(f => {
            // Clear previous match
            delete f._searchMatchName;

            // Match on senior member name
            if (f.seniorMember.toLowerCase().includes(query)) return true;
            // Match on family code
            if (f.code.toLowerCase().includes(query)) return true;
            // Match on guardian name
            if (f.guardian.toLowerCase().includes(query)) return true;

            // Match on ANY student name in the family
            for (const student of f.students.values()) {
                if (student.name.toLowerCase().includes(query)) {
                    f._searchMatchName = student.name; // Tag who matched
                    return true;
                }
            }
            return false;
        });
    }
    currentPage = 1;
    renderFamilyGrid();
    renderPagination();
}

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
        // Use ACTUAL payment transactions as source of truth (not fees.paid_amount which can be wrong)
        const studentPayments = student.payments || [];
        const actualPaidTotal = studentPayments.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
        
        // Calculate student's unified balance (same as Total Family Dues logic) for consistency
        const studentsArray = [{ id: student.id, fees: studentFees }];
        const studentUnifiedBalance = calculateUnifiedBalance(studentsArray, studentPayments);
        
        const isOverdue = studentUnifiedBalance > 0 && studentFees.some(f => {
            const net = f.amount - (f.discount || 0);
            const paidForFee = studentPayments.filter(p => p.fee_id === f.id).reduce((s, p) => s + Number(p.amount_paid || 0), 0);
            return new Date(f.due_date) < new Date() && net > paidForFee;
        });

        // Group payments by receipt (one row per receipt; legacy payments with no receipt_id = one row each)
        const receiptGroups = (() => {
            const groups = [];
            const seenReceiptIds = new Set();
            for (const p of studentPayments) {
                if (p.receipt_id) {
                    if (!seenReceiptIds.has(p.receipt_id)) {
                        seenReceiptIds.add(p.receipt_id);
                        const sameReceipt = studentPayments.filter(x => x.receipt_id === p.receipt_id);
                        const rec = p.receipts || {};
                        const total = rec.total_paid != null ? Number(rec.total_paid) : sameReceipt.reduce((s, x) => s + Number(x.amount_paid || 0), 0);
                        const feeLabels = sameReceipt.map(x => {
                            const f = studentFees.find(fee => fee.id === x.fee_id);
                            return f ? `${f.fee_type} (${f.month || ''})` : 'Fee';
                        });
                        groups.push({
                            receiptId: p.receipt_id,
                            receiptNumber: rec.receipt_number || p.receipt_id.slice(0, 8),
                            paymentDate: rec.payment_date || p.payment_date,
                            paymentMethod: rec.payment_method || p.payment_method,
                            totalPaid: total,
                            payments: sameReceipt,
                            feeTypesSummary: feeLabels.join(', ')
                        });
                    }
                } else {
                    const f = studentFees.find(fee => fee.id === p.fee_id);
                    groups.push({
                        receiptId: null,
                        receiptNumber: '#' + (p.id || '').toString().slice(0, 4).toUpperCase(),
                        paymentDate: p.payment_date,
                        paymentMethod: p.payment_method,
                        totalPaid: Number(p.amount_paid || 0),
                        payments: [p],
                        feeTypesSummary: f ? `${f.fee_type} (${f.month || ''})` : 'Fee'
                    });
                }
            }
            groups.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
            return groups;
        })();

        const timelineHTML = studentPayments.length > 0
            ? studentPayments.slice(0, 3).map((p, i) => {
                const rec = p.receipts;
                const recNo = rec && rec.receipt_number ? rec.receipt_number : ('#' + (p.id || '').toString().slice(0, 4).toUpperCase());
                return `
                <div class="timeline-item">
                    <span class="timeline-dot ${i === 0 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'}"></span>
                    <p class="text-sm font-bold text-white">${i === 0 ? 'Payment Received' : (p.amount_paid < 1000 ? 'Partial Payment' : 'Payment Received')}</p>
                    <p class="text-[10px] text-slate-500 mt-1 uppercase">${(window.formatPaymentDateLocal || ((v) => new Date(v).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })))(p.payment_date)} • Receipt ${recNo}</p>
                </div>
            `;
            }).join('')
            : `<div class="timeline-item"><span class="timeline-dot bg-slate-600"></span><p class="text-sm font-bold text-slate-500">No recent payments</p></div>`;

        content.innerHTML = `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div class="lg:col-span-2 space-y-8">
                    <!-- Paid and Outstanding are derived from fee_payments (actual transactions) only -->
                    <div class="student-kpi-row">
                        <div class="kpi-card bg-[#1E293B]/60 backdrop-blur-sm">
                            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Fees</p>
                            <h4 class="text-2xl font-black text-white mt-1">${window.formatCurrency(student.totalFees)}</h4>
                        </div>
                        <div class="kpi-card bg-[#1E293B]/60 backdrop-blur-sm">
                            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Paid Amount</p>
                            <h4 class="text-2xl font-black text-white mt-1">${window.formatCurrency(actualPaidTotal)}</h4>
                        </div>
                        <div class="kpi-card bg-[#1E293B]/60 backdrop-blur-sm border-amber-500/30">
                            <p class="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Outstanding</p>
                            <h4 class="text-2xl font-black ${isOverdue ? 'text-red-500' : 'text-amber-500'} mt-1">${window.formatCurrency(studentUnifiedBalance)}</h4>
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
            const paidForThisFee = studentPayments.filter(p => p.fee_id === f.id).reduce((s, p) => s + Number(p.amount_paid || 0), 0);
            const bal = Math.max(0, net - paidForThisFee);
            const cls = bal <= 0 ? 'pill-paid' : (paidForThisFee > 0 ? 'pill-partial' : 'pill-unpaid');
            const lbl = bal <= 0 ? 'PAID' : (paidForThisFee > 0 ? 'PARTIAL' : 'UNPAID');
            return `<tr><td class="font-bold text-white">${f.fee_type} (${f.month || ''})</td><td class="font-medium text-slate-300">${net.toLocaleString()}</td><td class="text-amber-500 font-medium">${Number(f.discount || 0).toLocaleString()}</td><td class="text-emerald-400 font-medium">${paidForThisFee.toLocaleString()}</td><td class="font-black ${bal > 0 ? 'text-red-500' : 'text-slate-500'}">${bal.toLocaleString()}</td><td><span class="status-pill ${cls}">${lbl}</span></td></tr>`;
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
                                <thead><tr><th>DATE</th><th>RECEIPT #</th><th>METHOD</th><th>AMOUNT</th><th>FEE TYPES</th><th>ACTIONS</th></tr></thead>
                                <tbody>
                                    ${receiptGroups.length > 0 ? receiptGroups.slice(0, 10).map(g => {
            const dateStr = (window.formatPaymentDateLocal || ((v) => new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })))(g.paymentDate);
            const firstPaymentId = g.payments[0] && g.payments[0].id;
            const printArg = g.receiptId ? `'${g.receiptId}'` : (firstPaymentId ? `null,'${firstPaymentId}'` : 'null');
            const deleteArg = g.receiptId ? `'${g.receiptId}', null` : (firstPaymentId ? `null, '${firstPaymentId}'` : 'null, null');
            const deleteTitle = g.receiptId ? 'Void receipt' : 'Delete transaction';
            return `
                                        <tr>
                                            <td class="text-slate-300 font-medium">${dateStr}</td>
                                            <td class="text-slate-500 font-mono">${g.receiptNumber}</td>
                                            <td><span class="method-pill">${(g.paymentMethod || 'CASH').toUpperCase()}</span></td>
                                            <td class="font-black text-emerald-400">PKR ${Number(g.totalPaid).toLocaleString()}</td>
                                            <td class="text-slate-400 text-sm max-w-[200px] truncate" title="${(g.feeTypesSummary || '').replace(/"/g, '&quot;')}">${g.feeTypesSummary || '—'}</td>
                                            <td class="flex items-center gap-2">
                                                <button onclick="window.printReceiptByReceiptOrPayment(${printArg})" class="text-slate-500 hover:text-white transition-colors" title="Print Receipt">
                                                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4h10z" /></svg>
                                                </button>
                                                <button onclick="window.voidReceiptOrDeleteTransaction(${deleteArg})" class="text-slate-500 hover:text-red-500 transition-colors" title="${deleteTitle}">
                                                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    `;
        }).join('') : '<tr><td colspan="6" class="text-center py-8 text-slate-500 font-medium">No transaction record found</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                        ${receiptGroups.length > 10 ? `
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
                            <button onclick="window.printParentReceiptFromFamily('${currentFamily.key}')" class="w-full bg-white text-blue-600 py-4 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl hover:scale-[1.02] transition-all mb-8">
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
        const errEl = document.getElementById('studentProfileContent');
        if (errEl) errEl.innerHTML = `<div class="p-8 text-center text-red-500 font-bold">Error loading profile: ${e.message}</div>`;
    }
};

// Window-level helpers
window.feesModuleBackToList = () => { currentFamily = null; currentStudentId = null; renderFamilyList(); };
window.profileSelectStudent = (sid) => { currentStudentId = sid; document.querySelectorAll('.sibling-card').forEach(c => c.classList.toggle('active', c.getAttribute('onclick').includes(sid))); window.renderStudentFinancials(); };
// Helper: due amount for a fee using actual payment transactions (not stale fee.paid_amount)
function getFeeDue(fee, family) {
    const net = Math.max(0, (fee.amount || 0) - (fee.discount || 0));
    const student = family.students.get(fee.student_id);
    const paid = student
        ? student.payments.filter(p => p.fee_id === fee.id).reduce((s, p) => s + Number(p.amount_paid || 0), 0)
        : 0;
    return Math.max(0, net - paid);
}

// Helper to get pending fees for current target (only fees with remaining balance)
function getPendingFees(familyKey) {
    const f = allFamilies.find(x => x.key === familyKey);
    if (!f) return [];
    return f.allFees.filter(fee => getFeeDue(fee, f) > 0);
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
    const today = new Date();
    document.getElementById('paymentDate').value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    document.getElementById('paymentModalSubtitle').textContent = `Recording payment for ${f.seniorMember} (${f.code})`;

    // Reset to collective mode by default
    const collectiveRadio = document.querySelector('input[name="paymentMode"][value="collective"]');
    if (collectiveRadio) {
        collectiveRadio.checked = true;
        window.togglePaymentMode('collective'); // Triggers preview update
    }

    // Ensure form handler is attached and prevent default submission
    const form = document.getElementById('paymentForm');
    if (form) {
        form.onsubmit = handlePaymentSubmit;
        // Also add event listener as backup
        form.addEventListener('submit', handlePaymentSubmit);
    }

    // Prevent Enter key from submitting form inappropriately
    // Allow Enter to submit only when clicking the submit button or when appropriate
    const paymentAmountInput = document.getElementById('paymentAmount');
    if (paymentAmountInput) {
        paymentAmountInput.onkeydown = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                // Trigger payment submission when Enter is pressed in amount field
                const submitBtn = document.getElementById('submitPaymentBtn');
                if (submitBtn && !submitBtn.disabled) {
                    submitBtn.click();
                }
            }
        };
    }

    // Prevent Enter in partial payment inputs from submitting form
    setTimeout(() => {
        const partialInputs = document.querySelectorAll('.partial-payment-input');
        partialInputs.forEach(input => {
            input.onkeydown = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    // Move to next input or submit if last input
                    const inputs = Array.from(document.querySelectorAll('.partial-payment-input'));
                    const currentIndex = inputs.indexOf(input);
                    if (currentIndex < inputs.length - 1) {
                        inputs[currentIndex + 1].focus();
                    } else {
                        // Last input - submit payment
                        const submitBtn = document.getElementById('submitPaymentBtn');
                        if (submitBtn && !submitBtn.disabled) {
                            submitBtn.click();
                        }
                    }
                }
            };
        });
    }, 100);

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
        const family = allFamilies.find(f => f.key === familyKey);
        const pendingFees = getPendingFees(familyKey);

        if (!family) {
            container.innerHTML = '<p class="text-slate-500 text-center py-4 bg-slate-900 rounded-lg italic">Family not found.</p>';
            totalAmountInput.readOnly = true;
            totalAmountInput.classList.add('opacity-50', 'cursor-not-allowed');
            return;
        }

        // Group pending fees by student (student_id -> { studentName, fees[] })
        const byStudent = new Map();
        pendingFees.forEach(fee => {
            const sid = fee.student_id;
            const studentName = fee.students?.name || 'Unknown Student';
            if (!byStudent.has(sid)) {
                byStudent.set(sid, { studentName, fees: [] });
            }
            byStudent.get(sid).fees.push(fee);
        });

        const studentSections = Array.from(byStudent.entries()).map(([studentId, { studentName, fees }]) => {
            const feeRows = fees.map(fee => {
                const due = getFeeDue(fee, family);
                return `
                    <tr class="border-b border-slate-700/40 last:border-0 hover:bg-slate-800/40 transition-colors">
                        <td class="py-2.5 pl-4 pr-2">
                            <p class="font-medium text-white text-sm">${fee.fee_type}</p>
                            <p class="text-[10px] text-slate-500 uppercase tracking-wider">${fee.month || 'N/A'}</p>
                        </td>
                        <td class="py-2.5 px-2 text-right font-mono text-sm font-bold text-amber-400">${due.toLocaleString()}</td>
                        <td class="py-2.5 pl-2 pr-4 w-28">
                            <input type="number"
                                data-fee-id="${fee.id}"
                                data-max="${due}"
                                class="partial-payment-input w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-right font-mono text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30 transition-colors"
                                placeholder="0"
                                min="0"
                                max="${due}"
                                oninput="window.recalculateAllocations()"
                                onkeydown="if(event.key==='Enter'){event.preventDefault();const inputs=Array.from(document.querySelectorAll('.partial-payment-input'));const idx=inputs.indexOf(this);if(idx<inputs.length-1){inputs[idx+1].focus();}else{document.getElementById('submitPaymentBtn')?.click();}}">
                        </td>
                    </tr>
                `;
            }).join('');

            return `
                <div class="rounded-xl border border-slate-700 overflow-hidden bg-slate-800/40">
                    <div class="px-4 py-3 bg-slate-800/80 border-b border-slate-700 flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-indigo-500/30 text-indigo-300 flex items-center justify-center text-sm font-bold">
                            ${studentName.charAt(0).toUpperCase()}
                        </div>
                        <h4 class="font-bold text-white">${studentName}</h4>
                        <span class="text-[10px] text-slate-400 font-medium">${fees.length} fee type${fees.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-700/60">
                                    <th class="py-2 pl-4 pr-2">Fee Type</th>
                                    <th class="py-2 px-2 text-right">Due (PKR)</th>
                                    <th class="py-2 pl-2 pr-4 text-right w-28">Pay</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${feeRows}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="space-y-4 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                <p class="text-xs text-slate-400 font-medium uppercase tracking-wider">Allocate amount per fee — grouped by student</p>
                ${studentSections.length > 0 ? studentSections : '<p class="text-slate-500 text-center py-8 bg-slate-900 rounded-xl italic border border-slate-700">No pending fees to display.</p>'}
            </div>
        `;

        // In partial mode, total amount is derived from inputs, so we make the main input read-only
        totalAmountInput.readOnly = true;
        totalAmountInput.classList.add('opacity-50', 'cursor-not-allowed');
        window.recalculateAllocations();
    }
};

window.updatePaymentPreview = () => {
    const totalPay = Number(document.getElementById('paymentAmount').value) || 0;
    const familyKey = document.getElementById('paymentTargetId').value;
    const family = allFamilies.find(f => f.key === familyKey);
    const pendingFees = getPendingFees(familyKey);
    const tbody = document.getElementById('collectivePreviewBody');

    document.getElementById('totalAmountDisplay').textContent = totalPay.toLocaleString();
    document.getElementById('allocatedAmountDisplay').textContent = totalPay.toLocaleString();

    if (!tbody || pendingFees.length === 0 || !family) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-slate-500 text-sm">No pending fees</td></tr>';
        return;
    }

    // EQUAL DISTRIBUTION: Divide payment equally across all fee types
    const feeCount = pendingFees.length;
    const equalAmount = Math.floor(totalPay / feeCount);
    const remainder = totalPay % feeCount; // Handle rounding remainder

    let totalAllocated = 0;
    const allocations = [];

    // First pass: assign equal amounts (capped at due amount)
    pendingFees.forEach((fee, index) => {
        const due = getFeeDue(fee, family);

        // Start with equal share, but cap at what's actually due
        let allocation = Math.min(equalAmount, due);
        allocations.push({ fee, due, allocation, index });
        totalAllocated += allocation;
    });

    // Second pass: distribute remainder to fees that can still accept more
    let remaining = totalPay - totalAllocated;
    if (remaining > 0) {
        // Sort by remaining capacity (due - allocated) descending
        allocations.sort((a, b) => (b.due - b.allocation) - (a.due - a.allocation));
        
        for (let item of allocations) {
            if (remaining <= 0) break;
            const room = item.due - item.allocation;
            if (room > 0) {
                const add = Math.min(remaining, room);
                item.allocation += add;
                totalAllocated += add;
                remaining -= add;
            }
        }
    }

    // Restore original order for display
    allocations.sort((a, b) => a.index - b.index);

    // Render the preview table
    tbody.innerHTML = allocations.map((item) => {
        const { fee, due, allocation } = item;
        const isFullyPaid = allocation >= due;
        const isOverdue = allocation > due; // Shouldn't happen, but safety check

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

    // Update allocated display to show actual allocated amount (may be less than totalPay if some fees are fully paid)
    document.getElementById('allocatedAmountDisplay').textContent = totalAllocated.toLocaleString();
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
    // Always prevent default form submission to avoid page reload
    if (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
    }
    
    // Prevent multiple submissions
    const btn = document.getElementById('submitPaymentBtn');
    if (!btn) {
        console.error('Submit button not found');
        return false;
    }
    
    if (btn.disabled) {
        console.log('Payment already being processed');
        return false;
    }
    
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Processing...';
    
    // Return false to prevent any form submission
    try {
        const mode = document.querySelector('input[name="paymentMode"]:checked').value;
        const familyKey = document.getElementById('paymentTargetId').value;
        // Use today's local date when recording so "just made" payments show today, not the date when modal was opened
        const now = new Date();
        const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const method = document.getElementById('paymentMethod').value;

        let paymentsToRecord = [];

        if (mode === 'collective') {
            const totalPay = Number(document.getElementById('paymentAmount').value);
            const family = allFamilies.find(f => f.key === familyKey);
            const pendingFees = getPendingFees(familyKey);

            if (totalPay <= 0) throw new Error("Please enter a valid amount.");
            if (pendingFees.length === 0) throw new Error("No pending fees to pay.");
            if (!family) throw new Error("Family not found.");

            // EQUAL DISTRIBUTION: Divide payment equally across all fee types
            const feeCount = pendingFees.length;
            const equalAmount = Math.floor(totalPay / feeCount);
            const remainder = totalPay % feeCount; // Handle rounding remainder

            let allocations = [];
            let totalAllocated = 0;

            // First pass: assign equal amounts (capped at due amount)
            pendingFees.forEach((fee, index) => {
                const due = getFeeDue(fee, family);

                // Start with equal share, but cap at what's actually due
                let allocated = Math.min(equalAmount, due);
                allocations.push({ fee, due, allocated, index });
                totalAllocated += allocated;
            });

            // Second pass: distribute remainder to fees that can still accept more
            let remaining = totalPay - totalAllocated;
            if (remaining > 0) {
                // Sort by remaining capacity (due - allocated) descending
                allocations.sort((a, b) => (b.due - b.allocated) - (a.due - a.allocated));
                
                for (let item of allocations) {
                    if (remaining <= 0) break;
                    const room = item.due - item.allocated;
                    if (room > 0) {
                        const add = Math.min(remaining, room);
                        item.allocated += add;
                        totalAllocated += add;
                        remaining -= add;
                    }
                }
            }

            // Validate: ensure we're not trying to allocate more than totalPay
            if (totalAllocated > totalPay) {
                throw new Error(`Calculation error: Allocated ${totalAllocated} exceeds payment ${totalPay}`);
            }

            // Filter out zero allocations and create payment records
            paymentsToRecord = allocations
                .filter(a => a.allocated > 0)
                .map(a => ({
                    fee_id: a.fee.id,
                    student_id: a.fee.student_id || a.fee.students?.id,
                    amount_paid: a.allocated,
                    payment_date: date,
                    payment_method: method
                }));

            // Final validation
            const sumOfPayments = paymentsToRecord.reduce((sum, p) => sum + p.amount_paid, 0);
            if (Math.abs(sumOfPayments - totalPay) > 0.01 && sumOfPayments < totalPay) {
                // If there's a small rounding difference and we haven't allocated everything,
                // it means some fees were capped. This is acceptable, but log it.
                console.log(`Note: Allocated ${sumOfPayments} out of ${totalPay} due to fee caps`);
            }

        } else {
            // Partial Mode - Admin manually allocates amounts
            const inputs = document.querySelectorAll('.partial-payment-input');
            let totalAllocated = 0;
            
            inputs.forEach(input => {
                const val = Number(input.value) || 0;
                const max = Number(input.dataset.max) || 0;
                
                // Validate: amount should be between 0 and max (due amount)
                if (val < 0) {
                    throw new Error(`Invalid amount: Cannot allocate negative amount for fee ${input.dataset.feeId}`);
                }
                if (val > max) {
                    throw new Error(`Invalid amount: Cannot allocate ${val} when only ${max} is due for this fee.`);
                }
                
                if (val > 0) {
                    totalAllocated += val;
                    paymentsToRecord.push({
                        fee_id: input.dataset.feeId,
                        student_id: getStudentIdFromFee(input.dataset.feeId, familyKey),
                        amount_paid: val,
                        payment_date: date,
                        payment_method: method
                    });
                }
            });

            if (paymentsToRecord.length === 0) {
                throw new Error("Please allocate an amount to at least one fee type.");
            }
            
            if (totalAllocated <= 0) {
                throw new Error("Total allocated amount must be greater than zero.");
            }
        }

        // One receipt per payment action: create receipt first, then attach receipt_id to all fee_payments
        const totalPaid = paymentsToRecord.reduce((sum, p) => sum + p.amount_paid, 0);
        const paymentDate = paymentsToRecord[0].payment_date;
        const paymentMethod = paymentsToRecord[0].payment_method;
        let receipt = null;
        const receiptNumber = await getNextReceiptNumber();
        if (receiptNumber) {
            const { data: insertedReceipt, error: receiptError } = await supabase.from('receipts').insert({
                receipt_number: receiptNumber,
                payment_date: paymentDate,
                payment_method: paymentMethod,
                total_paid: totalPaid
            }).select().single();
            if (!receiptError && insertedReceipt) receipt = insertedReceipt;
        }

        // Execute Payments — batch insert all at once (1 query instead of N)
        const studentIds = [...new Set(paymentsToRecord.map(p => p.student_id))];
        const payloads = paymentsToRecord.map(p => ({
            fee_id: p.fee_id,
            student_id: p.student_id,
            amount_paid: p.amount_paid,
            payment_date: p.payment_date,
            payment_method: p.payment_method,
            ...(receipt && receipt.id ? { receipt_id: receipt.id } : {})
        }));

        const { data: insertedPayments, error: insertError } = await supabase
            .from('fee_payments').insert(payloads).select();
        if (insertError) throw insertError;

        const createdPaymentIds = (insertedPayments || []).map(p => p.id);
        const totalAmountPaid = (insertedPayments || []).reduce((s, p) => s + Number(p.amount_paid || 0), 0);

        // Update Fee Statuses — batch fetch all affected fees (1 query), then update in parallel
        const feeIds = [...new Set(paymentsToRecord.map(p => p.fee_id))];
        const { data: latestFees } = await supabase
            .from('fees').select('id, amount, discount, paid_amount').in('id', feeIds);

        if (latestFees && latestFees.length > 0) {
            // Sum payments per fee_id
            const paymentsByFee = {};
            paymentsToRecord.forEach(p => {
                paymentsByFee[p.fee_id] = (paymentsByFee[p.fee_id] || 0) + p.amount_paid;
            });

            // Fire all fee updates in parallel (not sequential)
            await Promise.all(latestFees.map(fee => {
                const newPaid = (fee.paid_amount || 0) + (paymentsByFee[fee.id] || 0);
                const net = (fee.amount || 0) - (fee.discount || 0);
                const newStatus = newPaid >= net ? 'paid' : 'partial';
                return supabase.from('fees').update({
                    paid_amount: newPaid,
                    status: newStatus
                }).eq('id', fee.id);
            }));
        }

        window.toast?.success(`Successfully recorded ${paymentsToRecord.length} payment(s).`);

        // Generate single merged receipt for all payments in this transaction (one receipt number)
        if (createdPaymentIds.length > 0 && studentIds.length > 0) {
            await generateReceipt(studentIds, studentIds.length > 1, 'Office Copy', {
                receiptNo: receipt && receipt.receipt_number ? receipt.receipt_number : createdPaymentIds.map(id => id.slice(0, 4).toUpperCase()).join('-'),
                receiptId: receipt && receipt.id ? receipt.id : null,
                date: (window.formatPaymentDateLocal || ((v) => new Date(v).toLocaleDateString('en-GB')))(paymentDate),
                method: paymentMethod,
                paymentIds: createdPaymentIds
            });
        }

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
        window.toast?.error('Payment Failed: ' + (err.message || 'Unknown error'));
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
    
    // Always return false to prevent form submission and page reload
    return false;
}

// Helper needed because partial inputs don't have student context directly attached easily without looking up
function getStudentIdFromFee(feeId, familyKey) {
    const f = allFamilies.find(x => x.key === familyKey);
    const fee = f.allFees.find(x => x.id === feeId);
    return fee?.student_id || fee?.students?.id;
}

/** Generate next receipt number (R-YYYY-NNNN). Returns null if receipts table not available. */
async function getNextReceiptNumber() {
    try {
        const year = new Date().getFullYear();
        const prefix = `R-${year}-`;
        const { data: rows, error } = await supabase
            .from('receipts')
            .select('receipt_number')
            .like('receipt_number', prefix + '%')
            .order('receipt_number', { ascending: false })
            .limit(1);
        if (error) return null;
        let nextNum = 1;
        if (rows && rows.length > 0) {
            const last = rows[0].receipt_number || '';
            const numPart = last.replace(prefix, '').replace(/^\0+/, '');
            const n = parseInt(numPart, 10);
            if (!isNaN(n)) nextNum = n + 1;
        }
        return prefix + String(nextNum).padStart(4, '0');
    } catch (e) {
        return null;
    }
}

window.printStudentReceipt = async (sid) => {
    try {
        await generateReceipt([sid]);
    } catch (error) {
        console.error('Error printing student receipt:', error);
        window.toast?.error('Failed to print receipt: ' + (error.message || 'Unknown error'));
    }
};

// Print receipt directly from current family (most reliable method)
window.printParentReceiptFromFamily = async (familyKey) => {
    try {
        const family = allFamilies.find(f => f.key === familyKey);
        if (!family) {
            window.toast?.error('Family not found. Please refresh the page.');
            return;
        }

        const studentIds = Array.from(family.students.keys());
        if (studentIds.length === 0) {
            window.toast?.error('No students found in this family.');
            return;
        }

        await generateReceipt(studentIds, studentIds.length > 1, 'Office Copy');
    } catch (error) {
        console.error('Error printing parent receipt:', error);
        window.toast?.error('Failed to print receipt: ' + (error.message || 'Unknown error'));
    }
};

// Legacy function for backward compatibility - searches by family code or CNIC
window.printParentReceipt = async (cnic, fcode) => {
    try {
        // If we have a current family and the code matches, use it directly
        if (currentFamily && currentFamily.key) {
            const family = allFamilies.find(f => f.key === currentFamily.key);
            if (family) {
                const studentIds = Array.from(family.students.keys());
                if (studentIds.length > 0) {
                    await generateReceipt(studentIds, studentIds.length > 1, 'Office Copy');
                    return;
                }
            }
        }

        // Fallback: Query database if family not found in memory
        let query = supabase.from('students').select('id');
        
        if (fcode && fcode !== 'null' && fcode !== 'undefined') {
            // Try to match family_code first, then try as display code
            query = query.or(`family_code.eq.${fcode},family_code.ilike.%${fcode}%`);
        }
        
        if (cnic && cnic !== 'null' && cnic !== 'undefined') {
            if (fcode) {
                query = query.or(`family_code.eq.${fcode},father_cnic.eq.${cnic}`);
            } else {
                query = query.eq('father_cnic', cnic);
            }
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        if (data && data.length) {
            await generateReceipt(data.map(s => s.id), data.length > 1, 'Office Copy');
        } else {
            window.toast?.error('No students found for this family code.');
        }
    } catch (error) {
        console.error('Error printing parent receipt:', error);
        window.toast?.error('Failed to print receipt: ' + (error.message || 'Unknown error'));
    }
};

/** Print by receipt (full receipt) or by single payment (legacy). */
window.printReceiptByReceiptOrPayment = async (receiptId, paymentId) => {
    try {
        if (receiptId) {
            const { data: receipt, error: rErr } = await supabase.from('receipts').select('*').eq('id', receiptId).single();
            if (rErr || !receipt) throw new Error('Receipt not found');
            const { data: payments, error: pErr } = await supabase.from('fee_payments').select('id, student_id').eq('receipt_id', receiptId);
            if (pErr || !payments || payments.length === 0) throw new Error('No payments found for this receipt');
            const studentIds = [...new Set(payments.map(p => p.student_id))];
            const paymentIds = payments.map(p => p.id);
            await generateReceipt(studentIds, studentIds.length > 1, 'Office Copy', {
                receiptNo: receipt.receipt_number,
                receiptId: receipt.id,
                date: (window.formatPaymentDateLocal || ((v) => new Date(v).toLocaleDateString('en-GB')))(receipt.payment_date),
                method: receipt.payment_method,
                paymentIds
            });
        } else if (paymentId) {
            await window.printReceiptById(paymentId);
        }
    } catch (err) {
        console.error('Print receipt error:', err);
        window.toast?.error('Failed to print receipt: ' + (err.message || 'Unknown error'));
    }
};

/** Void entire receipt or delete single payment (legacy). */
window.voidReceiptOrDeleteTransaction = async (receiptId, paymentId) => {
    if (receiptId) {
        const confirmed = await window.confirmDialog?.show({
            title: 'Void Receipt',
            message: 'Void this receipt and reverse all payments? Fee balances will be updated. This cannot be undone.',
            confirmText: 'Void',
            cancelText: 'Cancel',
            type: 'danger'
        });
        if (!confirmed) return;
        window.loadingOverlay?.show('Voiding receipt and updating fee records...');
        try {
            const { data: payments, error: listErr } = await supabase.from('fee_payments').select('id, fee_id, amount_paid').eq('receipt_id', receiptId);
            if (listErr || !payments || payments.length === 0) {
                throw new Error('No payments found for this receipt');
            }
            for (const p of payments) {
                const { data: fee } = await supabase.from('fees').select('paid_amount, amount, discount').eq('id', p.fee_id).single();
                if (fee) {
                    const newPaid = Math.max(0, Number(fee.paid_amount || 0) - Number(p.amount_paid || 0));
                    const net = Number(fee.amount || 0) - Number(fee.discount || 0);
                    const newStatus = newPaid >= net ? 'paid' : newPaid > 0 ? 'partial' : 'unpaid';
                    await supabase.from('fees').update({ paid_amount: newPaid, status: newStatus }).eq('id', p.fee_id);
                }
                await supabase.from('fee_payments').delete().eq('id', p.id);
            }
            await supabase.from('receipts').delete().eq('id', receiptId);
            window.toast?.success('Receipt voided. All payments reversed.');
            await initializeData();
            if (currentFamily) {
                const fresh = allFamilies.find(f => f.key === currentFamily.key);
                if (fresh) {
                    window.viewFamilyProfile(fresh.key);
                    if (currentStudentId) window.profileSelectStudent(currentStudentId);
                }
            }
            window.dispatchEvent(new CustomEvent('paymentDeleted', { detail: { receiptId } }));
        } catch (err) {
            console.error('Void receipt error:', err);
            window.toast?.error('Failed to void receipt: ' + (err.message || 'Unknown error'));
        } finally {
            window.loadingOverlay?.hide();
        }
        return;
    }
    if (paymentId) await window.deleteTransaction(paymentId);
};

window.deleteTransaction = async (paymentId) => {
    // Use proper confirmation dialog
    const confirmed = await window.confirmDialog?.show({
        title: 'Delete Payment Transaction',
        message: 'Are you sure you want to delete this payment record? This will update the student\'s fee balance and cannot be undone.',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger'
    });

    if (!confirmed) return;

    // Show loading overlay
    window.loadingOverlay?.show('Deleting payment and updating fee records...');

    try {
        // 1. Fetch the payment record to know how much to subtract
        const { data: payment, error: pError } = await supabase
            .from('fee_payments')
            .select('*, fees(*, students(*))')
            .eq('id', paymentId)
            .single();

        if (pError || !payment) throw new Error('Payment record not found');

        // 2. Fetch the current fee state (get latest to ensure consistency)
        const { data: fee, error: fError } = await supabase
            .from('fees')
            .select('paid_amount, amount, discount, status, student_id')
            .eq('id', payment.fee_id)
            .single();

        if (fError || !fee) throw new Error('Fee record not found');

        // 3. Calculate new paid amount and status
        const currentPaidAmount = Number(fee.paid_amount || 0);
        const paymentAmount = Number(payment.amount_paid || 0);
        const newPaidAmount = Math.max(0, currentPaidAmount - paymentAmount);
        const netAmount = Number(fee.amount || 0) - Number(fee.discount || 0);
        const newStatus = newPaidAmount >= netAmount ? 'paid' : (newPaidAmount > 0 ? 'partial' : 'unpaid');

        // 4. Update the fee record
        const { error: updateError } = await supabase
            .from('fees')
            .update({
                paid_amount: newPaidAmount,
                status: newStatus
            })
            .eq('id', payment.fee_id);

        if (updateError) throw updateError;

        // 5. Delete the payment record
        const { error: deleteError } = await supabase
            .from('fee_payments')
            .delete()
            .eq('id', paymentId);

        if (deleteError) throw deleteError;

        window.toast?.success(`Payment of PKR ${paymentAmount.toLocaleString()} deleted successfully. Fee balance updated.`);

        // 6. Refresh all data and views
        await initializeData(); // This refreshes family list, stats, and grid

        // Refresh family profile view if currently viewing one
        if (currentFamily) {
            const fresh = allFamilies.find(f => f.key === currentFamily.key);
            if (fresh) {
                // Re-view the profile to update the UI
                window.viewFamilyProfile(fresh.key);
                // Re-select the student to update the ledger table and payment history
                if (currentStudentId) {
                    window.profileSelectStudent(currentStudentId);
                }
            }
        }

        // Trigger dashboard refresh if dashboard module is loaded
        // This ensures dashboard stats update if user navigates back
        if (window.loadModule && typeof window.loadModule === 'function') {
            // Dashboard will auto-refresh when navigated to, but we can trigger a custom event
            window.dispatchEvent(new CustomEvent('paymentDeleted', { 
                detail: { paymentId, studentId: fee.student_id } 
            }));
        }

    } catch (error) {
        console.error('Delete transaction error:', error);
        window.toast?.error('Failed to delete transaction: ' + (error.message || 'Unknown error'));
    } finally {
        window.loadingOverlay?.hide();
    }
};

window.printReceiptById = async (paymentId) => {
    try {
        const { data: payment, error } = await supabase
            .from('fee_payments')
            .select('*, students(*), fees(*)')
            .eq('id', paymentId)
            .single();

        if (error) throw error;
        if (!payment) throw new Error('Payment not found');

        // IMPORTANT: Only show THIS specific payment, not auto-group with others
        // The receipt should match exactly what's shown in the transaction history
        // If payments were made together, they should have been grouped at creation time
        
        // Generate receipt for ONLY this payment
        await generateReceipt([payment.student_id], false, 'Office Copy', {
            amountPaid: Number(payment.amount_paid || 0), // Exact amount from this payment
            balance: 'N/A',
            receiptNo: paymentId.slice(0, 4).toUpperCase(), // Receipt number from this payment
            date: (window.formatPaymentDateLocal || ((v) => new Date(v).toLocaleDateString('en-GB')))(payment.payment_date),
            method: payment.payment_method,
            feeIds: [payment.fee_id], // Only the fee_id for this payment
            paymentIds: [paymentId] // Only this payment ID
        });
    } catch (err) {
        console.error('Print error:', err);
        window.toast?.error('Failed to print receipt: ' + (err.message || 'Unknown error'));
    }
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
