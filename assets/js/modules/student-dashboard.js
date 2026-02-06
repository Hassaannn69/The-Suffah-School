// Student Dashboard - A completely separate dashboard for students
const supabase = window.supabase;

let currentStudent = null;
let familyMembers = [];

export async function render(container) {
    // Show loading state
    container.innerHTML = `
        <div class="flex items-center justify-center min-h-[60vh] animate-pulse">
            <div class="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    `;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            container.innerHTML = '<div class="text-center text-rose-500 p-8 font-black uppercase tracking-widest">Session Expired. Please Login.</div>';
            return;
        }

        const userEmail = session.user.email;
        const rollNo = userEmail.split('@')[0];

        let { data: student, error } = await supabase
            .from('students')
            .select('*')
            .ilike('roll_no', rollNo)
            .single();

        if (error || !student) {
            const result = await supabase.from('students').select('*').eq('email', userEmail).single();
            student = result.data;
            error = result.error;
        }

        if (error || !student) {
            container.innerHTML = `<div class="text-center text-rose-500 p-8 font-black uppercase tracking-widest">Profile not found for ID: ${rollNo}</div>`;
            return;
        }

        currentStudent = student;

        const [feesData, familyData, attendanceData, notificationsData, paymentsData, resultsData] = await Promise.all([
            fetchStudentFees(student.id),
            fetchFamilyMembers(student.family_code, student.id),
            fetchAttendance(student.id),
            fetchNotifications(student.class, student.section, student.id),
            fetchPaymentHistory(student.id, student.family_code),
            fetchResults(student.id)
        ]);

        familyMembers = familyData || [];
        renderStudentDashboard(container, student, feesData, familyData, attendanceData, notificationsData, paymentsData, resultsData);

    } catch (err) {
        console.error('Student Dashboard Error:', err);
        container.innerHTML = `<div class="text-center text-rose-500 p-8">Critical error: ${err.message}</div>`;
    }
}

function renderStudentDashboard(container, student, fees, family, attendance, notifications, payments = [], results = []) {
    const totalFees = fees.reduce((sum, f) => sum + (f.final_amount || f.amount || 0), 0);
    const paidFees = fees.reduce((sum, f) => sum + (f.paid_amount || 0), 0);
    const pendingFees = Math.max(0, totalFees - paidFees);

    // Group payments by receipt (one card per receipt; legacy = one card per payment)
    const receiptGroups = (() => {
        const groups = [];
        const seenReceiptIds = new Set();
        for (const p of payments) {
            if (p.receipt_id) {
                if (!seenReceiptIds.has(p.receipt_id)) {
                    seenReceiptIds.add(p.receipt_id);
                    const sameReceipt = payments.filter(x => x.receipt_id === p.receipt_id);
                    const rec = p.receipts || {};
                    const total = rec.total_paid != null ? Number(rec.total_paid) : sameReceipt.reduce((s, x) => s + Number(x.amount_paid || 0), 0);
                    groups.push({
                        receiptId: p.receipt_id,
                        receiptNumber: rec.receipt_number || p.receipt_id.toString().slice(0, 8),
                        paymentDate: rec.payment_date || p.payment_date,
                        paymentMethod: rec.payment_method || p.payment_method,
                        totalPaid: total,
                        payments: sameReceipt
                    });
                }
            } else {
                groups.push({
                    receiptId: null,
                    receiptNumber: '#' + (p.id || '').toString().slice(-6).toUpperCase(),
                    paymentDate: p.payment_date,
                    paymentMethod: p.payment_method,
                    totalPaid: Number(p.amount_paid || 0),
                    payments: [p]
                });
            }
        }
        groups.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
        return groups;
    })();

    let familyPending = pendingFees;
    family.forEach(member => {
        if (member.fees) {
            const memberTotal = member.fees.reduce((sum, f) => sum + (f.final_amount || f.amount || 0), 0);
            const memberPaid = member.fees.reduce((sum, f) => sum + (f.paid_amount || 0), 0);
            familyPending += Math.max(0, memberTotal - memberPaid);
        }
    });

    const totalDays = attendance.length;
    const presentDays = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const attendancePercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    container.innerHTML = `
        <style>
            .bento-card {
                background: rgba(30, 41, 59, 0.4);
                backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.05);
                border-radius: 1.5rem;
                padding: 1.5rem;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .bento-card:hover { border-color: rgba(99, 102, 241, 0.2); }
            
            .stat-value { font-size: 1.875rem; font-weight: 900; line-height: 1.1; }
            .stat-label { font-size: 0.65rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; }
            
            .badge-status {
                padding: 0.25rem 0.625rem;
                border-radius: 0.5rem;
                font-size: 0.6rem;
                font-weight: 900;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }

            .row-card {
                background: rgba(15, 23, 42, 0.3);
                border: 1px solid rgba(255, 255, 255, 0.03);
                border-radius: 1rem;
                padding: 1rem;
                transition: all 0.2s;
            }
            .row-card:hover { background: rgba(15, 23, 42, 0.5); border-color: rgba(255, 255, 255, 0.08); }

            ::-webkit-scrollbar { width: 5px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        </style>

        <div class="space-y-8 animate-fade-in no-scrollbar">
            <!-- Hero Header -->
            <div class="bento-card bg-gradient-to-br from-indigo-950/50 to-blue-950/50 border-indigo-500/20 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div class="flex items-center gap-6">
                    <div class="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-xl shadow-indigo-500/20">
                        ${student.name ? student.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div class="text-left">
                        <h1 class="text-3xl font-black text-white tracking-tight">Assalam-o-Alaikum, ${student.name.split(' ')[0]}!</h1>
                        <p class="text-indigo-400 text-sm font-bold uppercase tracking-widest mt-1">${student.class} - ${student.section} | ID: ${student.roll_no}</p>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    <button id="printFeeBill" class="px-6 h-12 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 flex items-center gap-2">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2h6z" /></svg>
                        Print Latest Bill
                    </button>
                </div>
            </div>

            <!-- Stats Grid -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <!-- Attendance -->
                <div class="bento-card overflow-hidden group">
                    <p class="stat-label mb-3">Attendance Rank</p>
                    <div class="flex items-end justify-between">
                        <h3 class="stat-value text-emerald-400">${attendancePercent}%</h3>
                        <div class="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>
                    <div class="h-1 w-full bg-white/5 rounded-full mt-6 overflow-hidden">
                        <div class="h-full bg-emerald-500 transition-all duration-1000" style="width: ${attendancePercent}%"></div>
                    </div>
                </div>

                <!-- My Fees -->
                <div class="bento-card group">
                    <p class="stat-label mb-3">My Pending Dues</p>
                    <div class="flex items-end justify-between">
                        <h3 class="stat-value ${pendingFees > 0 ? 'text-rose-400' : 'text-emerald-400'}">Rs ${pendingFees.toLocaleString()}</h3>
                        <div class="w-10 h-10 ${pendingFees > 0 ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </div>
                </div>

                <!-- Family Fees -->
                <div class="bento-card group">
                    <p class="stat-label mb-3">Family Exposure</p>
                    <div class="flex items-end justify-between">
                        <h3 class="stat-value ${familyPending > 0 ? 'text-orange-400' : 'text-emerald-400'}">Rs ${familyPending.toLocaleString()}</h3>
                        <div class="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-400 border border-orange-500/20 group-hover:scale-110 transition-transform">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                    </div>
                </div>

                <!-- Notifications -->
                <div class="bento-card group">
                    <p class="stat-label mb-3">Alerts & Updates</p>
                    <div class="flex items-end justify-between">
                        <h3 class="stat-value text-blue-400">${notifications.length}</h3>
                        <div class="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-transform">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Workspace -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                <!-- Left Column (4/12) -->
                <div class="lg:col-span-4 space-y-6">
                    <!-- Profile Detals -->
                    <div class="bento-card">
                        <div class="flex items-center gap-3 mb-8">
                            <div class="w-2 h-2 rounded-full bg-indigo-500 glow-indigo"></div>
                            <h3 class="stat-label !text-white font-black tracking-widest">My Identity</h3>
                        </div>
                        <div class="space-y-5">
                            <div class="flex justify-between items-center"><span class="text-xs text-slate-500 font-bold uppercase tracking-wider">Full Name</span><span class="text-sm font-black text-white">${student.name}</span></div>
                            <div class="flex justify-between items-center"><span class="text-xs text-slate-500 font-bold uppercase tracking-wider">Level</span><span class="text-sm font-black text-white">${student.class} - ${student.section}</span></div>
                            <div class="flex justify-between items-center"><span class="text-xs text-slate-500 font-bold uppercase tracking-wider">Roll Code</span><span class="text-sm font-black text-white">${student.roll_no}</span></div>
                            <div class="flex justify-between items-center"><span class="text-xs text-slate-500 font-bold uppercase tracking-wider">Family ID</span><span class="text-sm font-black text-indigo-400">${student.family_code || '-'}</span></div>
                        </div>
                    </div>

                    <!-- Family Intelligence -->
                    ${family.length > 0 ? `
                        <div class="bento-card">
                            <div class="flex items-center gap-3 mb-8">
                                <div class="w-2 h-2 rounded-full bg-orange-500 glow-orange"></div>
                                <h3 class="stat-label !text-white font-black tracking-widest">Connected Family</h3>
                            </div>
                            <div class="space-y-4">
                                ${family.map(member => {
        const mTotal = member.fees ? member.fees.reduce((sum, f) => sum + (f.final_amount || f.amount || 0), 0) : 0;
        const mPaid = member.fees ? member.fees.reduce((sum, f) => sum + (f.paid_amount || 0), 0) : 0;
        const mPending = mTotal - mPaid;
        return `
                                        <div class="row-card flex items-center justify-between">
                                            <div>
                                                <p class="text-[11px] font-black text-white uppercase tracking-tight">${member.name}</p>
                                                <p class="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">${member.class} - ${member.section}</p>
                                            </div>
                                            <div class="text-right">
                                                <p class="text-[11px] font-black ${mPending > 0 ? 'text-rose-500' : 'text-emerald-500'}">Rs ${mPending.toLocaleString()}</p>
                                                <p class="text-[8px] text-slate-600 font-black uppercase tracking-widest">Pending</p>
                                            </div>
                                        </div>
                                    `;
    }).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <!-- Notifications -->
                    <div class="bento-card">
                        <div class="flex items-center gap-3 mb-8">
                            <div class="w-2 h-2 rounded-full bg-blue-500 glow-blue"></div>
                            <h3 class="stat-label !text-white font-black tracking-widest">Broadcasts</h3>
                        </div>
                        <div class="space-y-4 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                            ${notifications.length > 0 ? notifications.map(n => `
                                <div class="row-card group cursor-pointer hover:border-blue-500/30">
                                    <div class="flex items-start gap-3">
                                        <div class="mt-1 w-2 h-2 rounded-full ${n.type === 'fee_reminder' ? 'bg-rose-500' : 'bg-blue-500'} flex-shrink-0"></div>
                                        <div class="min-w-0">
                                            <p class="text-[10px] font-black text-white uppercase tracking-tight">${n.title}</p>
                                            <p class="text-[9px] text-slate-500 mt-1 font-medium leading-relaxed">${n.message}</p>
                                        </div>
                                    </div>
                                </div>
                            `).join('') : '<p class="text-[10px] text-slate-600 font-black text-center uppercase tracking-widest py-8">System Secured • No Alerts</p>'}
                        </div>
                    </div>
                </div>

                <!-- Right Column (8/12) -->
                <div class="lg:col-span-8 space-y-8">
                    
                    <!-- Advanced Fee Module -->
                    <div id="fees-section" class="bento-card !p-0 overflow-hidden flex flex-col min-h-[500px]">
                        <div class="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                <h3 class="text-xl font-black text-white tracking-tight">Financial Coverage</h3>
                                <p class="text-[10px] text-slate-500 mt-1 font-bold uppercase tracking-widest">Authenticated Transaction Log & Invoices</p>
                            </div>
                            <div class="flex items-center gap-3">
                                <span class="badge-status ${pendingFees <= 0 ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}">
                                    ${pendingFees <= 0 ? 'Fully Settled' : 'Dues Pending'}
                                </span>
                            </div>
                        </div>
                        
                        <div class="p-8 space-y-10">
                            <!-- Fee Breadown -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h4 class="stat-label mb-5 border-l-2 border-indigo-500 pl-3">Policy Breakdown</h4>
                                    <div class="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                                        ${fees.length > 0 ? fees.map(fee => {
        const isPaid = fee.status === 'paid';
        return `
                                                <div class="row-card group flex items-center justify-between">
                                                    <div>
                                                        <div class="flex items-center gap-2">
                                                            <p class="text-[11px] font-black text-white uppercase tracking-tight">${fee.fee_type}</p>
                                                            <span class="badge-status ${isPaid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'} !text-[7px]">
                                                                ${fee.status}
                                                            </span>
                                                        </div>
                                                        <p class="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">${fee.month}</p>
                                                    </div>
                                                    <div class="text-right">
                                                        <p class="text-sm font-black text-white">Rs ${(fee.final_amount || fee.amount || 0).toLocaleString()}</p>
                                                        <p class="text-[9px] ${isPaid ? 'text-emerald-500' : 'text-slate-500'} font-bold uppercase tracking-widest mt-1">
                                                            ${isPaid ? 'Verified' : 'Unpaid Bal: ' + ((fee.final_amount || fee.amount || 0) - (fee.paid_amount || 0)).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            `;
    }).join('') : '<div class="text-center py-12"><p class="text-[10px] text-slate-600 font-black uppercase tracking-widest">Zero Dues Recorded</p></div>'}
                                    </div>
                                </div>

                                <!-- Transaction History -->
                                <div>
                                    <h4 class="stat-label mb-5 border-l-2 border-emerald-500 pl-3">Verified Receipts</h4>
                                    <div class="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                                        ${receiptGroups.length > 0 ? receiptGroups.map(g => {
                                            const recId = g.receiptId ? `'${g.receiptId}'` : 'null';
                                            const payId = g.payments[0] && g.payments[0].id ? `'${g.payments[0].id}'` : 'null';
                                            return `
                                            <div class="row-card group flex items-center justify-between">
                                                <div class="flex items-center gap-4">
                                                    <div class="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                    </div>
                                                    <div>
                                                        <p class="text-[11px] font-black text-white uppercase tracking-tight">${(window.formatPaymentDateLocal || ((v) => new Date(v).toLocaleDateString('en-GB')))(g.paymentDate)}</p>
                                                        <p class="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">${g.paymentMethod || 'CASH'}</p>
                                                    </div>
                                                </div>
                                                <div class="text-right flex items-center gap-4">
                                                    <div>
                                                        <p class="text-[11px] font-black text-emerald-400">Rs ${Number(g.totalPaid).toLocaleString()}</p>
                                                        <p class="text-[8px] text-slate-600 font-black uppercase tracking-widest mt-1">${g.receiptNumber}</p>
                                                    </div>
                                                    <button onclick="window.printTransactionReceipt(${recId}, ${payId})" class="p-2 hidden group-hover:block bg-white/5 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 rounded-lg transition-all">
                                                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2h6z" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        `;
                                        }).join('') : '<p class="text-[10px] text-slate-600 font-black text-center uppercase tracking-widest py-12">No transactions detected</p>'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Academic Results -->
                    <div id="results-section" class="bento-card">
                         <div class="flex items-center justify-between mb-8">
                            <div class="flex items-center gap-3">
                                <div class="w-2 h-2 rounded-full bg-violet-500 glow-violet"></div>
                                <h3 class="stat-label !text-white font-black tracking-widest">Academic Performance</h3>
                            </div>
                            <span class="text-[9px] font-black text-slate-500 uppercase tracking-widest">Official Transcripts</span>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            ${results.length > 0 ? results.map(r => `
                                <div class="row-card border-l-4 ${r.percentage >= 50 ? 'border-l-indigo-500' : 'border-l-rose-500'}">
                                    <div class="flex justify-between items-start mb-4">
                                        <div class="min-w-0">
                                            <p class="text-[10px] font-black text-white uppercase tracking-tight truncate">${r.exam_name || 'Standardized Test'}</p>
                                            <p class="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-1">${r.date || 'LATEST'}</p>
                                        </div>
                                        <div class="text-right">
                                            <span class="text-xs font-black ${r.percentage >= 50 ? 'text-indigo-400' : 'text-rose-400'}">${r.obtained_marks}/${r.total_marks}</span>
                                        </div>
                                    </div>
                                    <div class="flex items-center justify-between border-t border-white/5 pt-3">
                                        <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Grade Points</span>
                                        <span class="badge-status ${r.percentage >= 50 ? 'bg-indigo-500/10 text-indigo-400' : 'bg-rose-500/10 text-rose-400'} !text-[9px] font-black">${r.grade || (r.percentage >= 50 ? 'PASS' : 'FAIL')}</span>
                                    </div>
                                </div>
                            `).join('') : `
                                <div class="col-span-full py-16 text-center opacity-30">
                                    <svg class="w-12 h-12 mx-auto text-slate-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    <p class="text-[10px] font-black uppercase tracking-widest">Awaiting result declaration...</p>
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Print logic
    window.printTransactionReceipt = async (receiptId, paymentId) => {
        const btn = event?.currentTarget;
        const originalContent = btn?.innerHTML || '';
        if (btn) {
            btn.innerHTML = '<span class="animate-spin h-3 w-3 border-2 border-indigo-500 border-t-transparent rounded-full"></span>';
            btn.disabled = true;
        }

        try {
            const { generateReceipt } = await import('./receipt-generator.js');
            const familyIds = [student.id, ...(family || []).map(m => m.id)];

            if (receiptId) {
                const { data: receipt, error: rErr } = await supabase.from('receipts').select('*').eq('id', receiptId).single();
                if (rErr || !receipt) throw new Error('Receipt not found');
                const { data: payments, error: pErr } = await supabase.from('fee_payments').select('id, student_id').eq('receipt_id', receiptId);
                if (pErr || !payments || payments.length === 0) throw new Error('No payments for this receipt');
                const studentIds = [...new Set(payments.map(p => p.student_id))];
                const paymentIds = payments.map(p => p.id);
                await generateReceipt(studentIds.length > 0 ? studentIds : familyIds, studentIds.length > 1, 'Student Copy', {
                    receiptNo: receipt.receipt_number,
                    receiptId: receipt.id,
                    date: (window.formatPaymentDateLocal || ((v) => new Date(v).toLocaleDateString('en-GB')))(receipt.payment_date),
                    method: receipt.payment_method,
                    paymentIds
                });
            } else if (paymentId) {
                const { data: payment, error } = await supabase.from('fee_payments').select('*, receipts(receipt_number)').eq('id', paymentId).single();
                if (error) throw error;
                if (!payment) throw new Error('Payment not found');
                const rec = payment.receipts;
                await generateReceipt(familyIds, familyIds.length > 1, 'Student Copy', {
                    amountPaid: payment.amount_paid,
                    receiptNo: rec && rec.receipt_number ? rec.receipt_number : 'REC-' + payment.id.toString().slice(-6).toUpperCase(),
                    date: (window.formatPaymentDateLocal || ((v) => new Date(v).toLocaleDateString('en-GB')))(payment.payment_date),
                    method: payment.payment_method,
                    paymentIds: [paymentId]
                });
            }
        } catch (err) {
            console.error('Print Error:', err);
            alert('Failed to generate receipt: ' + (err.message || 'Unknown error'));
        } finally {
            if (btn) {
                btn.innerHTML = originalContent;
                btn.disabled = false;
            }
        }
    };

    const printBillBtn = document.getElementById('printFeeBill');
    if (printBillBtn) {
        printBillBtn.onclick = async () => {
            const originalContent = printBillBtn.innerHTML;
            printBillBtn.innerHTML = '<span class="animate-pulse">GENERATE...</span>';
            printBillBtn.disabled = true;

            try {
                const { generateReceipt } = await import('./receipt-generator.js');
                const familyIds = [student.id, ...(family || []).map(m => m.id)];
                await generateReceipt(familyIds, familyIds.length > 1, 'Bank Copy');
            } catch (err) {
                console.error('Print Error:', err);
                alert('Failed to generate bill.');
            } finally {
                printBillBtn.innerHTML = originalContent;
                printBillBtn.disabled = false;
            }
        };
    }
}

// Data Fetching Functions
async function fetchStudentFees(studentId) {
    try {
        const { data, error } = await supabase.from('fees').select('*').eq('student_id', studentId).order('generated_at', { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (err) { console.error('Error fetching fees:', err); return []; }
}

async function fetchFamilyMembers(familyCode, currentStudentId) {
    if (!familyCode) return [];
    try {
        const { data: members, error } = await supabase.from('students').select('id, name, class, section, roll_no').eq('family_code', familyCode).neq('id', currentStudentId);
        if (error) throw error;
        for (let member of members) {
            const { data: fees } = await supabase.from('fees').select('*').eq('student_id', member.id);
            member.fees = fees || [];
        }
        return members || [];
    } catch (err) { console.error('Error fetching family:', err); return []; }
}

async function fetchPaymentHistory(studentId, familyCode) {
    try {
        let studentIds = [studentId];
        if (familyCode) {
            const { data: family } = await supabase.from('students').select('id').eq('family_code', familyCode);
            if (family) studentIds = family.map(s => s.id);
        }
        const { data: withReceipts, error: err1 } = await supabase.from('fee_payments').select('*, students (name, roll_no), fees (fee_type, month), receipts(receipt_number, payment_date, payment_method, total_paid)').in('student_id', studentIds).order('payment_date', { ascending: false });
        if (!err1 && withReceipts) return withReceipts;
        const { data: withoutReceipts, error } = await supabase.from('fee_payments').select('*, students (name, roll_no), fees (fee_type, month)').in('student_id', studentIds).order('payment_date', { ascending: false });
        if (error) throw error;
        return withoutReceipts || [];
    } catch (err) { console.error('Error fetching payments:', err); return []; }
}

async function fetchAttendance(studentId) {
    try {
        const { data, error } = await supabase.from('attendance').select('*').eq('student_id', studentId).order('date', { ascending: false }).limit(30);
        if (error) throw error;
        return data || [];
    } catch (err) { console.error('Error fetching attendance:', err); return []; }
}

async function fetchNotifications(className, section, studentId) {
    try {
        const { data, error } = await supabase.from('notifications').select('*')
            .or(`target_type.eq.all,and(target_type.eq.class,target_class.eq.${className}),and(target_type.eq.student,target_student_id.eq.${studentId})`)
            .eq('is_read', false).order('created_at', { ascending: false }).limit(10);
        if (error) throw error;
        return data || [];
    } catch (err) { console.error('Error fetching notifications:', err); return []; }
}

async function fetchResults(studentId) {
    try {
        const { data, error } = await supabase.from('exam_results').select('*').eq('student_id', studentId).order('date', { ascending: false });
        if (error) return [];
        return data || [];
    } catch (err) { console.error('Error fetching results:', err); return []; }
}
