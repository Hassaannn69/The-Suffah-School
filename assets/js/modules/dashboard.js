// Admin Dashboard Module - Modern FinTech Design
const supabase = window.supabase;

export async function render(container) {
    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Main Content (Left Side) -->
            <div class="lg:col-span-9 space-y-6">
                <!-- Top Stats Row -->
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Total Students with Attendance Gauge -->
                    <div class="bg-white dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6">
                        <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Total Students</p>
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-4xl font-black text-gray-900 dark:text-white" id="statTotalStudents">...</p>
                                <p class="text-xs text-emerald-500 font-semibold mt-1">Today: <span id="attendancePercent">85%</span> Present</p>
                            </div>
                            <div class="relative w-20 h-20">
                                <svg class="w-20 h-20 transform -rotate-90">
                                    <circle cx="40" cy="40" r="32" stroke="currentColor" stroke-width="6" fill="none" class="text-gray-200 dark:text-gray-700" />
                                    <circle id="attendanceCircle" cx="40" cy="40" r="32" stroke="currentColor" stroke-width="6" fill="none" class="text-indigo-500 transition-all duration-1000" stroke-dasharray="201" stroke-dashoffset="50" stroke-linecap="round" />
                                </svg>
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <span class="text-sm font-bold text-indigo-600 dark:text-indigo-400" id="attendanceGaugeText">85%</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Fees Collected -->
                    <div class="bg-white dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6">
                        <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Fees Collected</p>
                        <p class="text-4xl font-black text-gray-900 dark:text-white" id="statFeesCollected">...</p>
                        <div class="mt-2 flex items-center gap-2">
                            <div class="h-1.5 flex-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div id="feeProgressBar" class="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000" style="width: 0%"></div>
                            </div>
                        </div>
                        <p class="text-xs text-gray-400 mt-1"><span id="feePercentage">0%</span> of target (PKR <span id="statTotalFees">...</span>)</p>
                    </div>

                    <!-- Pending Dues -->
                    <div class="bg-white dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6 relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                        <p class="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2 relative z-10">Pending Dues</p>
                        <p class="text-4xl font-black text-gray-900 dark:text-white relative z-10" id="statPendingFees">...</p>
                        <div class="mt-2 flex items-center gap-2 relative z-10">
                            <svg class="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                            </svg>
                            <p class="text-xs text-red-500 font-semibold">Urgent Follow-up</p>
                        </div>
                    </div>
                </div>

                <!-- Monthly Revenue Chart -->
                <div class="bg-white dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Profit Margin Analysis
                        </h3>
                        <div class="flex items-center gap-4 text-xs">
                            <div class="flex items-center gap-1.5">
                                <div class="w-3 h-3 rounded-full bg-indigo-500"></div>
                                <span class="text-gray-600 dark:text-gray-400">Revenue</span>
                            </div>
                            <div class="flex items-center gap-1.5">
                                <div class="w-3 h-3 rounded-full bg-rose-500"></div>
                                <span class="text-gray-600 dark:text-gray-400">Expenses</span>
                            </div>
                        </div>
                    </div>
                    <div style="height: 250px;">
                        <canvas id="revenueChart"></canvas>
                    </div>
                </div>

                <!-- Follow-Up List (Arrears Management) -->
                <div class="bg-white dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6">
                    <div class="flex items-center justify-between mb-6">
                        <div>
                            <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Follow-Up List (Arrears)
                            </h3>
                            <p class="text-xs text-gray-500 mt-1">Students with highest outstanding balances</p>
                        </div>
                        <span class="px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-full">High Priority</span>
                    </div>
                    <div class="overflow-x-auto custom-scrollbar">
                        <table class="w-full">
                            <thead>
                                <tr class="text-left text-[10px] text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700/50">
                                    <th class="pb-3 font-semibold">Student</th>
                                    <th class="pb-3 font-semibold">Total Fee</th>
                                    <th class="pb-3 font-semibold">Paid</th>
                                    <th class="pb-3 font-semibold">Balance Due</th>
                                    <th class="pb-3 font-semibold text-right">Quick Action</th>
                                </tr>
                            </thead>
                            <tbody id="urgentFollowups" class="divide-y divide-gray-100 dark:divide-gray-700/50">
                                <tr>
                                    <td colspan="5" class="py-8 text-center text-gray-400 text-sm">Loading arrears data...</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700/50 text-center">
                        <button onclick="window.loadModule('fee_reports')" class="text-sm font-semibold text-indigo-500 hover:text-indigo-600 transition-colors inline-flex items-center gap-1 group">
                            View Full Arrears Report 
                            <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Right Sidebar -->
            <div class="lg:col-span-3 space-y-6">
                <!-- Quick Actions -->
                <div class="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-700/50 p-6">
                    <div class="flex items-center gap-2 mb-6">
                        <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <h3 class="text-lg font-bold text-white">Quick Actions</h3>
                    </div>
                    <div class="space-y-3">
                        <button class="w-full flex items-center gap-3 px-4 py-3 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl transition-all group relative">
                            <!-- Notification Dot -->
                            <div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-gray-900 animate-pulse" id="smsNotificationDot" style="display: none;"></div>
                            <div class="p-2 bg-indigo-500/20 rounded-lg group-hover:scale-110 transition-transform">
                                <svg class="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            </div>
                            <div class="text-left flex-1">
                                <p class="text-sm font-semibold text-white">Send SMS to Absentees</p>
                                <p class="text-xs text-gray-400">Notify parents</p>
                            </div>
                        </button>

                        <button class="w-full flex items-center gap-3 px-4 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all group">
                            <div class="p-2 bg-emerald-500/20 rounded-lg group-hover:scale-110 transition-transform">
                                <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <div class="text-left flex-1">
                                <p class="text-sm font-semibold text-white">Generate Bulk Fee Slips</p>
                                <p class="text-xs text-gray-400">For all students</p>
                            </div>
                        </button>

                        <button class="w-full flex items-center gap-3 px-4 py-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl transition-all group">
                            <div class="p-2 bg-purple-500/20 rounded-lg group-hover:scale-110 transition-transform">
                                <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                                </svg>
                            </div>
                            <div class="text-left flex-1">
                                <p class="text-sm font-semibold text-white">Assign New Class</p>
                                <p class="text-xs text-gray-400">To teacher</p>
                            </div>
                        </button>
                    </div>
                </div>

                <!-- Recent Activity Feed -->
                <div class="bg-white dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6 flex flex-col">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Recent Activity
                        </h3>
                    </div>
                    
                    <div class="relative space-y-4" id="recentActivity">
                        <!-- Activity items -->
                        <div class="text-center py-8 text-gray-400 text-sm">Feeding live stream...</div>
                    </div>

                    <div class="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700/50 text-center">
                        <button onclick="window.loadModule('students')" class="text-sm font-semibold text-indigo-500 hover:text-indigo-600 transition-colors inline-flex items-center gap-1 group">
                            View Activity Log
                            <svg class="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Class Distribution Chart -->
                <div class="bg-white dark:bg-gray-800/50 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 p-6">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Class Distribution</h3>
                    <div style="height: 280px;">
                        <canvas id="classDistributionChart"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <style>
            .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #4f46e5;
                border-radius: 3px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #4338ca;
            }
        </style>
    `;

    // Load all data
    await Promise.all([
        loadDashboardStats(),
        loadCharts(),
        checkAttendanceSMS(),
        loadUrgentFollowups(),
        loadRecentActivity()
    ]);

    // Setup Realtime Subscription for Activity Feed
    // This allows the "Automatically update" requirement to be met
    if (window.activityChannel) {
        supabase.removeChannel(window.activityChannel);
    }

    window.activityChannel = supabase.channel('dashboard-feed')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'students' }, (payload) => {
            console.log('Real-time Admission:', payload);
            loadRecentActivity();
            loadDashboardStats(); // Also update stats
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fee_payments' }, (payload) => {
            console.log('Real-time Payment:', payload);
            loadRecentActivity();
            loadDashboardStats(); // Also update stats
            loadUrgentFollowups(); // Update arrears
        })
        .subscribe();
};

async function checkAttendanceSMS() {
    try {
        const today = new Date().toISOString().slice(0, 10);

        // Check if SMS was sent today (you can add a table for SMS logs)
        // For now, we'll check if attendance was marked today
        const { data: attendanceToday } = await supabase
            .from('attendance')
            .select('id')
            .eq('date', today)
            .limit(1);

        // Show notification dot if attendance exists but SMS not sent
        // You can enhance this by checking an sms_logs table
        const notificationDot = document.getElementById('smsNotificationDot');
        if (attendanceToday && attendanceToday.length > 0 && notificationDot) {
            notificationDot.style.display = 'block';
        }
    } catch (error) {
        console.error('Error checking attendance SMS:', error);
    }
}

async function loadDashboardStats() {
    try {
        const [studentsRes, classesRes, feesRes] = await Promise.all([
            supabase.from('students').select('id, class'),
            supabase.from('classes').select('id'),
            supabase.from('fees').select('final_amount, paid_amount, student_id')
        ]);

        const students = studentsRes.data || [];
        const classes = classesRes.data || [];
        const fees = feesRes.data || [];

        const totalStudents = students.length;

        // Calculate total fees (what should be collected)
        const totalFees = fees.reduce((sum, f) => sum + (parseFloat(f.final_amount) || 0), 0);

        // Calculate collected from paid_amount in fees table
        const collected = fees.reduce((sum, f) => sum + (parseFloat(f.paid_amount) || 0), 0);

        const pending = totalFees - collected;

        const collectionPercent = totalFees > 0 ? Math.round((collected / totalFees) * 100) : 0;

        // Update UI
        document.getElementById('statTotalStudents').textContent = totalStudents;
        document.getElementById('statFeesCollected').textContent = 'PKR ' + collected.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        document.getElementById('statTotalFees').textContent = totalFees.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        document.getElementById('statPendingFees').textContent = 'PKR ' + pending.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
        document.getElementById('feePercentage').textContent = collectionPercent + '%';

        // Animate progress bar
        setTimeout(() => {
            document.getElementById('feeProgressBar').style.width = collectionPercent + '%';
        }, 100);

        // Animate attendance gauge (mock 85%)
        const attendancePercent = 85;
        const circumference = 2 * Math.PI * 32;
        const offset = circumference - (attendancePercent / 100) * circumference;
        setTimeout(() => {
            document.getElementById('attendanceCircle').style.strokeDashoffset = offset;
        }, 100);

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadCharts() {
    try {
        if (typeof Chart === 'undefined') {
            await window.loadScript('https://cdn.jsdelivr.net/npm/chart.js');
        }

        // Get last 6 months
        const months = [];
        const monthLabels = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthStr = date.toISOString().slice(0, 7); // YYYY-MM
            months.push(monthStr);
            monthLabels.push(date.toLocaleDateString('en-US', { month: 'short' }));
        }

        // Fetch revenue (fee payments) for last 6 months
        const { data: feePayments } = await supabase
            .from('fee_payments')
            .select('amount, payment_date')
            .gte('payment_date', months[0] + '-01');

        // Fetch expenses (teacher salaries paid) for last 6 months
        const { data: salaryPayments } = await supabase
            .from('salary_payments')
            .select('amount, payment_date')
            .gte('payment_date', months[0] + '-01');

        // Aggregate by month
        const revenueByMonth = months.map(month => {
            const total = feePayments?.filter(p => p.payment_date?.startsWith(month))
                .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;
            return total;
        });

        const expensesByMonth = months.map(month => {
            const total = salaryPayments?.filter(p => p.payment_date?.startsWith(month))
                .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) || 0;
            return total;
        });

        // Revenue Chart (Line)
        const revenueCtx = document.getElementById('revenueChart').getContext('2d');
        new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: monthLabels,
                datasets: [{
                    label: 'Revenue',
                    data: revenueByMonth,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Expenses',
                    data: expensesByMonth,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280' },
                        grid: { color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb' }
                    },
                    x: {
                        ticks: { color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280' },
                        grid: { display: false }
                    }
                }
            }
        });

        // Class Distribution (Bar)
        const { data: students } = await supabase.from('students').select('class');
        const classCounts = {};
        students?.forEach(s => {
            classCounts[s.class] = (classCounts[s.class] || 0) + 1;
        });
        const sortedClasses = Object.keys(classCounts).sort();

        const classCtx = document.getElementById('classDistributionChart').getContext('2d');
        new Chart(classCtx, {
            type: 'bar',
            data: {
                labels: sortedClasses,
                datasets: [{
                    data: sortedClasses.map(c => classCounts[c]),
                    backgroundColor: '#10b981',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280' },
                        grid: { color: document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb' }
                    },
                    x: {
                        ticks: { color: document.documentElement.classList.contains('dark') ? '#9ca3af' : '#6b7280' },
                        grid: { display: false }
                    }
                }
            }
        });

    } catch (error) {
        console.error('Error loading charts:', error);
    }
}

async function loadUrgentFollowups() {
    try {
        const { data: fees, error } = await supabase
            .from('fees')
            .select('*, students(name, class, phone)')
            .order('paid_amount', { ascending: true });

        if (error) {
            console.error('Error fetching urgent followups:', error);
            document.getElementById('urgentFollowups').innerHTML = '<tr><td colspan="5" class="py-12 text-center text-red-400">Error loading data</td></tr>';
            return;
        }

        // Group fees by student and calculate total REMAINING balance
        const studentBalances = {};
        fees?.forEach(f => {
            const studentId = f.student_id;
            const totalFee = parseFloat(f.final_amount) || parseFloat(f.amount) || 0;
            const paidAmount = parseFloat(f.paid_amount) || 0;
            const remainingBalance = totalFee - paidAmount;

            if (!studentBalances[studentId]) {
                studentBalances[studentId] = {
                    student_id: studentId,
                    name: f.students?.name || 'Unknown',
                    class: f.students?.class || '-',
                    phone: f.students?.phone || '',
                    totalFee: 0,
                    totalPaid: 0,
                    totalRemaining: 0
                };
            }
            if (remainingBalance > 0) {
                studentBalances[studentId].totalFee += totalFee;
                studentBalances[studentId].totalPaid += paidAmount;
                studentBalances[studentId].totalRemaining += remainingBalance;
            }
        });

        // Sort by balance descending
        const urgentList = Object.values(studentBalances)
            .filter(s => s.totalRemaining > 0)
            .sort((a, b) => b.totalRemaining - a.totalRemaining)
            .slice(0, 10);

        const html = urgentList.length > 0 ? urgentList.map((student, index) => {
            return `
                <tr class="group hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td class="py-4">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-primary-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <span class="text-[10px] font-bold text-white">${student.name?.charAt(0) || 'S'}</span>
                            </div>
                            <div>
                                <p class="text-sm font-bold text-gray-900 dark:text-white">${student.name}</p>
                                <p class="text-[10px] text-gray-500 dark:text-gray-400 capitalize">Class ${student.class}</p>
                            </div>
                        </div>
                    </td>
                    <td class="py-4 text-xs font-medium text-gray-600 dark:text-gray-400">
                        PKR ${student.totalFee.toLocaleString()}
                    </td>
                    <td class="py-4 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        PKR ${student.totalPaid.toLocaleString()}
                    </td>
                    <td class="py-4">
                        <span class="text-sm font-black text-red-600 dark:text-red-500">
                            PKR ${student.totalRemaining.toLocaleString()}
                        </span>
                    </td>
                    <td class="py-4 text-right">
                        <div class="flex items-center justify-end gap-2">
                            <button onclick="window.location.href='tel:${student.phone}'" class="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-lg transition-all" title="Call Parent">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </button>
                            <button class="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all opacity-0 group-hover:opacity-100">
                                Send Reminder
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('') : '<tr><td colspan="5" class="py-12 text-center text-gray-400 text-sm">No pending arrears found</td></tr>';

        document.getElementById('urgentFollowups').innerHTML = html;

    } catch (error) {
        console.error('Error loading urgent followups:', error);
    }
}

async function loadRecentActivity() {
    try {
        // Fetch Parallel Data for the feed
        const [paymentsRes, admissionsRes] = await Promise.all([
            supabase.from('fee_payments')
                .select('id, amount_paid, payment_date, payment_method, created_at, student_id, students(name)')
                .order('created_at', { ascending: false })
                .limit(10),
            supabase.from('students')
                .select('id, name, class, created_at, admission_date')
                .order('created_at', { ascending: false })
                .limit(10)
        ]);

        if (paymentsRes.error) console.error('Error fetching payments for feed:', paymentsRes.error);
        if (admissionsRes.error) console.error('Error fetching admissions for feed:', admissionsRes.error);

        const activities = [];

        // Add Payments to activities
        paymentsRes.data?.forEach(p => {
            // Use created_at for the actual time the record was made, 
            // fallback to payment_date if created_at is missing
            const timestamp = p.created_at ? new Date(p.created_at) : new Date(p.payment_date);
            activities.push({
                type: 'payment',
                title: 'Fee Payment Received',
                description: `${p.students?.name || 'Student'} paid PKR ${(parseFloat(p.amount_paid) || 0).toLocaleString()} via ${p.payment_method || 'Cash'}`,
                timestamp: timestamp,
                icon: `<div class="p-1.5 bg-emerald-500/10 rounded-full"><svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>`
            });
        });

        // Add Admissions to activities
        admissionsRes.data?.forEach(s => {
            const date = s.created_at ? new Date(s.created_at) : (s.admission_date ? new Date(s.admission_date) : new Date());
            activities.push({
                type: 'admission',
                title: 'New Admission',
                description: `${s.name} was admitted to Class ${s.class}`,
                timestamp: date,
                icon: `<div class="p-1.5 bg-blue-500/10 rounded-full"><svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg></div>`
            });
        });

        // Sort by timestamp descending
        activities.sort((a, b) => b.timestamp - a.timestamp);

        // Take only top 10 activities
        const finalActivities = activities.slice(0, 10);

        const html = finalActivities.length > 0 ? finalActivities.map(act => {
            return `
                <div class="relative pl-8 pb-4">
                    <div class="absolute left-0 mt-1">
                        ${act.icon}
                    </div>
                    <div>
                        <div class="flex items-center justify-between">
                            <p class="text-xs font-bold text-gray-900 dark:text-white">${act.title}</p>
                            <span class="text-[10px] text-gray-400 font-medium">${getTimeAgo(act.timestamp)}</span>
                        </div>
                        <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1 font-medium">${act.description}</p>
                    </div>
                </div>
            `;
        }).join('') : '<div class="text-center py-8 text-gray-400 text-sm">No recent activity recorded</div>';

        const container = document.getElementById('recentActivity');
        if (container) {
            container.innerHTML = html;
        }

    } catch (error) {
        console.error('Error loading recent activity:', error);
        const container = document.getElementById('recentActivity');
        if (container) {
            container.innerHTML = '<div class="text-center py-8 text-red-400 text-sm">Error loading activities</div>';
        }
    }
}

function formatCurrency(amount) {
    return 'PKR ' + Number(amount).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + 'm ago';
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + 'h ago';
    const days = Math.floor(hours / 24);
    return days + 'd ago';
}

window.formatCurrency = formatCurrency;
