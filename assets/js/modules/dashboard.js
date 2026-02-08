// Admin Dashboard Module - Modern FinTech Design
const supabase = window.supabase;

import { calculateUnifiedBalance } from './receipt-generator.js';

// Ensure loadModule is accessible for tile clicks
if (!window.loadModule) {
    window.loadModule = (moduleName) => {
        const event = new CustomEvent('navigate', { detail: moduleName });
        window.dispatchEvent(event);
    };
}
export async function render(container) {
    container.innerHTML = `
        <div class="dashboard-root grid grid-cols-1 lg:grid-cols-12 gap-6">
            <!-- Main Content (Left Side) -->
            <div class="lg:col-span-9 space-y-6">
                <!-- Top Stats Grid (6 Individual Tiles) -->
                <!-- Top Stats Grid (6 Individual Tiles) -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Tile 1: Total Students -->
                    <div class="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-[#334155]/50 rounded-2xl p-5 relative overflow-hidden group hover:border-gray-300 dark:hover:border-[#475569] transition-all shadow-sm">
                        <div class="flex justify-between items-start">
                            <div>
                                <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Students</p>
                                <p class="text-4xl font-bold text-gray-900 dark:text-white mt-1" id="statTotalStudents">...</p>
                            </div>
                            <!-- Circular Progress -->
                            <div class="relative w-16 h-16">
                                <svg class="w-full h-full transform -rotate-90">
                                    <circle cx="32" cy="32" r="28" stroke="currentColor" stroke-width="6" fill="none" class="text-gray-100 dark:text-gray-800" />
                                    <circle id="attendanceCircle" cx="32" cy="32" r="28" stroke="currentColor" stroke-width="6" fill="none" class="text-blue-500 transition-all duration-1000" stroke-dasharray="175.93" stroke-dashoffset="175.93" stroke-linecap="round" />
                                </svg>
                                <div class="absolute inset-0 flex items-center justify-center">
                                    <span class="text-sm font-bold text-gray-900 dark:text-white" id="attendanceGaugeText">0%</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="h-px bg-gray-100 dark:bg-gray-700/50 my-4 w-full"></div>

                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-[10px] text-gray-500 mb-0.5">Attendance</p>
                                <div class="flex items-center gap-1">
                                    <p class="text-base font-bold text-blue-500 dark:text-blue-400 leading-none" id="attendanceCount">0 / 0</p>
                                </div>
                            </div>
                             <button onclick="window.loadModule('students')" class="bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center transition-colors cursor-pointer group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20">
                                Details
                                <svg class="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>

                    <!-- Tile 2: Monthly Fees -->
                    <div onclick="window.openDashboardReport && window.openDashboardReport('monthly_collection')" class="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-[#334155]/50 rounded-2xl p-5 relative overflow-hidden cursor-pointer group hover:border-gray-300 dark:hover:border-[#475569] transition-all shadow-sm">
                        <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1" id="feesPeriodLabel">Monthly Fees</p>
                        <div class="mt-1 mb-4 flex items-baseline gap-1.5">
                            <p class="text-lg font-bold text-gray-600 dark:text-gray-400 mb-0.5">PKR</p>
                            <p class="text-4xl font-bold text-gray-900 dark:text-white leading-none" id="statFeesCollectedVal">0</p>
                        </div>
                        <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mb-2 overflow-hidden">
                            <div id="feeProgressBar" class="bg-indigo-500 h-1.5 rounded-full transition-all duration-1000" style="width: 0%"></div>
                        </div>
                        <p class="text-[10px] text-gray-500 text-right"><span id="feePercentage">0%</span> collected</p>
                    </div>

                    <!-- Tile 3: Monthly Expenses -->
                    <div class="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-[#334155]/50 rounded-2xl p-5 relative overflow-hidden group hover:border-gray-300 dark:hover:border-[#475569] transition-all shadow-sm">
                        <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1" id="expensesPeriodLabel">Monthly Expenses</p>
                        <div class="mt-1 mb-4 flex items-baseline gap-1.5">
                            <p class="text-lg font-bold text-gray-600 dark:text-gray-400 mb-0.5">PKR</p>
                            <p class="text-4xl font-bold text-gray-900 dark:text-white leading-none" id="statMonthlyExpensesVal">0</p>
                        </div>
                        <div class="flex items-center text-xs text-red-500 font-medium">
                            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
                            <span>Operational Costs</span>
                        </div>
                    </div>

                    <!-- Tile 4: Income Today -->
                    <div onclick="window.openDashboardReport && window.openDashboardReport('daily_collection')" class="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-[#334155]/50 rounded-2xl p-5 relative overflow-hidden cursor-pointer group hover:border-gray-300 dark:hover:border-[#475569] transition-all shadow-sm">
                        <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1" id="todayIncomeLabel">Income Today</p>
                        <div class="mb-3 flex items-baseline gap-1.5">
                            <span class="text-lg font-bold text-emerald-600 dark:text-emerald-400">PKR</span>
                            <p class="text-4xl font-bold text-emerald-500" id="statCollectedToday">0</p>
                        </div>
                        <div class="flex items-center text-xs text-emerald-500 font-medium">
                            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                            <span>Direct Cashflow</span>
                        </div>
                    </div>

                    <!-- Tile 5: Expense Today -->
                    <div onclick="window.openDashboardReport && window.openDashboardReport('daily_voucher_detail')" class="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-[#334155]/50 rounded-2xl p-5 relative overflow-hidden cursor-pointer group hover:border-gray-300 dark:hover:border-[#475569] transition-all shadow-sm">
                        <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1" id="todayExpenseLabel">Expense Today</p>
                        <div class="mb-3 flex items-baseline gap-1.5">
                            <span class="text-lg font-bold text-rose-600 dark:text-rose-400">PKR</span>
                            <p class="text-4xl font-bold text-rose-500" id="statExpensesToday">0</p>
                        </div>
                        <div class="flex items-center text-xs text-rose-500 font-medium">
                            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                            <span>Daily Spending</span>
                        </div>
                    </div>

                    <!-- Tile 6: Net Today -->
                    <div id="netTodayCard" onclick="window.openDashboardReport && window.openDashboardReport('daily_summary')" class="bg-white dark:bg-[#1e293b] border border-gray-200 dark:border-[#334155]/50 rounded-2xl p-5 relative overflow-hidden cursor-pointer group hover:border-gray-300 dark:hover:border-[#475569] transition-all shadow-sm">
                        <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1" id="todayNetLabel">Net Today</p>
                        <div class="mb-3 flex items-baseline gap-1.5">
                            <span class="text-lg font-bold text-gray-600 dark:text-gray-400">PKR</span>
                            <p class="text-4xl font-bold text-gray-900 dark:text-white" id="statNetToday">0</p>
                        </div>
                        <div class="flex items-center text-xs text-gray-500 font-medium">
                            <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            <span>Daily Balance</span>
                        </div>
                    </div>
                </div>

                <!-- Monthly Revenue Chart (Profit Margin Analysis) -->
                <div class="dashboard-stat-card p-6">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                        <div>
                            <h3 class="dashboard-title text-lg text-gray-900 dark:text-white flex items-center gap-2">
                                <svg class="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                                Profit Margin Analysis
                            </h3>
                            <div class="flex items-center gap-4 text-[10px] mt-1 ml-7">
                                <div class="flex items-center gap-1.5">
                                    <div class="w-2 h-2 rounded-full bg-indigo-500"></div>
                                    <span class="text-gray-500">Revenue</span>
                                </div>
                                <div class="flex items-center gap-1.5">
                                    <div class="w-2 h-2 rounded-full bg-rose-500"></div>
                                    <span class="text-gray-500">Expenses</span>
                                </div>
                            </div>
                        </div>

                        <!-- Timeframe Filters -->
                        <div class="flex items-center gap-2 p-1 bg-gray-100 dark:bg-[#0f172a] rounded-xl border border-gray-200 dark:border-gray-800">
                            <button data-period="daily" class="chart-filter-btn px-4 py-1.5 text-xs font-bold rounded-lg transition-all text-[#E2E8F0] dark:text-[#E2E8F0] hover:text-indigo-600 dark:hover:text-white">Daily</button>
                            <button data-period="weekly" class="chart-filter-btn px-4 py-1.5 text-xs font-bold rounded-lg transition-all text-[#E2E8F0] dark:text-[#E2E8F0] hover:text-indigo-600 dark:hover:text-white">Weekly</button>
                            <button data-period="monthly" class="chart-filter-btn px-4 py-1.5 text-xs font-bold rounded-lg transition-all bg-white dark:bg-indigo-600 dark:text-white text-indigo-600 shadow-sm border border-gray-200 dark:border-indigo-500">Monthly</button>
                            <div class="relative group">
                                <button id="customRangeTrigger" class="px-4 py-1.5 text-xs font-bold rounded-lg text-indigo-600 dark:text-[#E2E8F0] hover:text-indigo-800 dark:hover:text-white flex items-center gap-1 transition-colors">
                                    Custom
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                                </button>
                                <!-- Custom Date Picker (Strict Theme Fix) -->
                                <div id="customRangePicker" class="hidden absolute right-0 mt-2 p-5 bg-white dark:bg-[#1a1f2e] rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700/50 z-[100] min-w-[240px] animate-fadeIn">
                                    <div class="space-y-4">
                                        <div>
                                            <label class="block text-[10px] uppercase font-bold text-gray-500 dark:text-[#E2E8F0] mb-2">Start Date</label>
                                            <input type="date" id="chartStartDate" class="w-full px-3 py-2.5 text-xs bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                                        </div>
                                        <div>
                                            <label class="block text-[10px] uppercase font-bold text-gray-500 dark:text-[#E2E8F0] mb-2">End Date</label>
                                            <input type="date" id="chartEndDate" class="w-full px-3 py-2.5 text-xs bg-gray-50 dark:bg-[#0f172a] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all">
                                        </div>
                                        <button id="applyCustomRange" class="w-full py-3 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95">Apply Range</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style="height: 250px;">
                        <canvas id="revenueChart"></canvas>
                    </div>
                </div>

                <!-- Follow-Up List (Arrears Management) -->
                <div class="dashboard-stat-card p-6">
                    <div class="flex items-center justify-between mb-6">
                        <div>
                            <h3 class="dashboard-title text-lg text-gray-900 dark:text-white flex items-center gap-2">
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
                                    <th class="pb-3 font-semibold">Balance Due</th>
                                    <th class="pb-3 font-semibold text-center">Overdue Days</th>
                                    <th class="pb-3 font-semibold text-right">Action</th>
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
                <!-- Quick Actions (semi-transparent tints, cohesive) -->


                <!-- Quick Reports (Modern Pill Series) -->
                <div class="dashboard-stat-card p-6">
                    <div class="flex items-center gap-2 mb-6">
                        <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h3 class="dashboard-title text-lg text-gray-900 dark:text-white">Quick Reports</h3>
                    </div>
                    <div class="space-y-3">
                        <button onclick="window.loadModule('fee_reports')" class="w-full flex items-center justify-between px-5 py-4 rounded-full border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-800 transition-all group shadow-sm">
                            <span class="text-[10px] font-black uppercase tracking-widest text-[#1e293b] dark:text-white">FINANCIAL SUMMARY</span>
                            <svg class="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                        <button onclick="window.loadModule('student_reports')" class="w-full flex items-center justify-between px-5 py-4 rounded-full border border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-800 transition-all group shadow-sm">
                            <span class="text-[10px] font-black uppercase tracking-widest text-[#1e293b] dark:text-white">ENROLLMENT ANALYTICS</span>
                            <svg class="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Recent Activity Feed -->
                <div class="dashboard-stat-card p-6 flex flex-col">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="dashboard-title text-lg text-gray-900 dark:text-white flex items-center gap-2">
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
                <div class="dashboard-stat-card p-6">
                    <h3 class="dashboard-title text-lg text-gray-900 dark:text-white mb-4">Class Distribution</h3>
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
    // Load stats and charts
    loadDashboardStats();
    loadCharts();
    await Promise.all([
        startClock(),
        checkAttendanceSMS(),
        loadUrgentFollowups(),
        loadRecentActivity()
    ]);

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
        .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'fee_payments' }, (payload) => {
            console.log('Real-time Payment Deleted:', payload);
            loadRecentActivity();
            loadDashboardStats(); // Update stats when payment deleted
            loadUrgentFollowups(); // Update arrears
        })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'fees' }, (payload) => {
            console.log('Real-time Fee Updated:', payload);
            loadDashboardStats(); // Update stats when fee status changes
            loadUrgentFollowups(); // Update arrears
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'student_attendance' }, (payload) => {
            console.log('Real-time Attendance Update:', payload);
            loadDashboardStats();
        })
        .subscribe();

    // Global Event Listener (Sync across modules)
    if (!window.hasDashboardDataListener) {
        window.addEventListener('appDataChange', (e) => {
            console.log(`[Dashboard] Refreshing due to change: ${e.detail?.type}`);
            loadDashboardStats();
            loadRecentActivity();
            loadUrgentFollowups();
        });
        window.hasDashboardDataListener = true;
    }

    // Also listen for custom paymentDeleted event from fees module
    window.addEventListener('paymentDeleted', () => {
        console.log('Payment deleted event received, refreshing dashboard...');
        loadDashboardStats();
        loadUrgentFollowups();
        loadRecentActivity();
    });

    // Chart Timeframe Listeners
    const filterBtns = document.querySelectorAll('.chart-filter-btn');
    const customTrigger = document.getElementById('customRangeTrigger');
    const customPicker = document.getElementById('customRangePicker');
    const applyCustom = document.getElementById('applyCustomRange');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update UI - Force light colors and prevent black text inversion
            filterBtns.forEach(b => {
                b.classList.remove('bg-white', 'dark:bg-indigo-600', 'text-indigo-600', 'dark:text-white', 'shadow-sm', 'border', 'dark:border-indigo-500');
                b.classList.add('text-gray-500', 'dark:text-[#E2E8F0]');
            });
            btn.classList.remove('text-gray-500', 'dark:text-[#E2E8F0]');
            btn.classList.add('bg-white', 'dark:bg-indigo-600', 'text-indigo-600', 'dark:text-white', 'shadow-sm', 'border', 'border-gray-200', 'dark:border-indigo-500');

            const period = btn.dataset.period;
            // Isolate chart update - do not refresh global dashboard stats
            loadCharts(period);
        });
    });

    customTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        customPicker.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
        if (!customPicker.contains(e.target) && e.target !== customTrigger) {
            customPicker.classList.add('hidden');
        }
    });

    applyCustom.addEventListener('click', () => {
        const start = document.getElementById('chartStartDate').value;
        const end = document.getElementById('chartEndDate').value;
        if (start && end) {
            // Isolate chart update
            loadCharts('custom', start, end);
            customPicker.classList.add('hidden');
            // Remove active style from presets
            filterBtns.forEach(b => {
                b.classList.remove('bg-white', 'dark:bg-indigo-600', 'text-indigo-600', 'dark:text-white', 'shadow-sm', 'border');
                b.classList.add('text-gray-500', 'dark:text-[#E2E8F0]');
            });
        } else {
            if (window.toast) window.toast.error('Please select both start and end dates');
        }
    });
};

function startClock() {
    const timeEl = document.getElementById('currentTime');
    const dateEl = document.getElementById('currentDate');

    if (!timeEl || !dateEl) return;

    function update() {
        const now = new Date();

        // Time
        timeEl.textContent = now.toLocaleTimeString('en-US', {
            hour12: true,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        // Date
        const options = { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
        dateEl.textContent = now.toLocaleDateString('en-US', options);
    }

    update();
    setInterval(update, 1000);
}

async function checkAttendanceSMS() {
    try {
        const today = new Date().toISOString().slice(0, 10);

        // Check if SMS was sent today (you can add a table for SMS logs)
        // For now, we'll check if attendance was marked today
        const { data: attendanceToday } = await supabase
            .from('student_attendance')
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
const getLocalDateStr = (date) => {
    const d = new Date(date);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
};

async function loadDashboardStats(period = 'monthly', customStart = null, customEnd = null) {
    try {
        const now = new Date();
        const todayStr = getLocalDateStr(now);
        let startDate, endDate, labelPrefix = "Monthly";

        if (period === 'daily') {
            const d = new Date(now);
            d.setDate(d.getDate() - 13);
            d.setHours(0, 0, 0, 0);
            startDate = d;
            endDate = new Date(now);
            labelPrefix = "14-Day";
        } else if (period === 'weekly') {
            const d = new Date(now);
            d.setDate(d.getDate() - (7 * 11));
            d.setHours(0, 0, 0, 0);
            startDate = d;
            endDate = new Date(now);
            labelPrefix = "Quarterly";
        } else if (period === 'custom') {
            startDate = new Date(customStart);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(customEnd);
            endDate.setHours(23, 59, 59, 999);
            labelPrefix = "Range";
        } else {
            // Default: Current Month
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            labelPrefix = "Monthly";
        }

        const startISO = startDate.toISOString();
        const endISO = endDate.toISOString();
        const startDayStr = getLocalDateStr(startDate);
        const endDayStr = getLocalDateStr(endDate);

        // Fetch Data
        // For 'Today' tiles (4,5,6), if we are in custom mode, we show the range total.
        // If in preset mode, we show today's total.
        const tStartQuery = (period === 'custom') ? startISO : new Date(now.setHours(0, 0, 0, 0)).toISOString();
        const tEndQuery = (period === 'custom') ? endISO : new Date(now.setHours(23, 59, 59, 999)).toISOString();
        const tStartDayStr = (period === 'custom') ? startDayStr : todayStr;
        const tEndDayStr = (period === 'custom') ? endDayStr : todayStr;

        const [studentsRes, attendanceRes, periodPayments, periodExpenses, allFees, rangePayments, rangeExpenses] = await Promise.all([
            supabase.from('students').select('id'),
            supabase.from('student_attendance').select('status').eq('date', todayStr),
            // RECONCILIATION FIX: Use payment_date for period totals to match Reports and Graph logic
            supabase.from('fee_payments').select('amount_paid').gte('payment_date', startDayStr).lte('payment_date', endDayStr),
            supabase.from('expenses').select('amount').gte('date', startDayStr).lte('date', endDayStr),
            supabase.from('fees').select('final_amount'),
            // CRITICAL SYNC: Use 'payment_date' for Today's Income to match the Fee Reports perfectly
            supabase.from('fee_payments').select('amount_paid').eq('payment_date', todayStr),
            supabase.from('expenses').select('amount').eq('date', todayStr)
        ]);

        const totalStudents = studentsRes.data?.length || 0;
        const attendanceData = attendanceRes.data || [];
        const presentCount = attendanceData.filter(a => ['present', 'Present', 'late', 'Late'].includes(a.status)).length;
        const attendancePercent = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

        const periodRevenue = periodPayments.data?.reduce((sum, p) => sum + (parseFloat(p.amount_paid) || 0), 0) || 0;
        const periodExpenseTotal = periodExpenses.data?.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) || 0;

        const incomeInFocus = rangePayments.data?.reduce((sum, p) => sum + (parseFloat(p.amount_paid) || 0), 0) || 0;
        const expenseInFocus = rangeExpenses.data?.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) || 0;
        const netInFocus = incomeInFocus - expenseInFocus;

        // Current Month Progress
        const currentMonthFees = allFees.data?.reduce((sum, f) => sum + (parseFloat(f.final_amount) || 0), 0) || 0;
        const progressPercent = currentMonthFees > 0 ? Math.round((periodRevenue / currentMonthFees) * 100) : 0;

        // Update UI Labels for Today Tiles if in Custom Mode
        const todayIncomeLabel = document.getElementById('todayIncomeLabel');
        const todayExpenseLabel = document.getElementById('todayExpenseLabel');
        const todayNetLabel = document.getElementById('todayNetLabel');

        if (period === 'custom') {
            if (todayIncomeLabel) todayIncomeLabel.textContent = "Income (Range)";
            if (todayExpenseLabel) todayExpenseLabel.textContent = "Expense (Range)";
            if (todayNetLabel) todayNetLabel.textContent = "Net (Range)";
        } else {
            if (todayIncomeLabel) todayIncomeLabel.textContent = "Income Today";
            if (todayExpenseLabel) todayExpenseLabel.textContent = "Expense Today";
            if (todayNetLabel) todayNetLabel.textContent = "Net Today";
        }

        document.getElementById('feesPeriodLabel').textContent = `${labelPrefix} Fees`;
        document.getElementById('expensesPeriodLabel').textContent = `${labelPrefix} Expenses`;

        document.getElementById('statFeesCollectedVal').textContent = periodRevenue.toLocaleString('en-PK');
        document.getElementById('statMonthlyExpensesVal').textContent = periodExpenseTotal.toLocaleString('en-PK');

        document.getElementById('statCollectedToday').textContent = incomeInFocus.toLocaleString('en-PK');
        document.getElementById('statExpensesToday').textContent = expenseInFocus.toLocaleString('en-PK');

        // Net Today with dynamic coloring
        const netEl = document.getElementById('statNetToday');
        const netCard = document.getElementById('netTodayCard');
        netEl.textContent = netInFocus.toLocaleString('en-PK');

        if (netInFocus > 0) {
            netEl.className = 'text-4xl font-bold text-emerald-500';
        } else if (netInFocus < 0) {
            netEl.className = 'text-4xl font-bold text-rose-500';
        } else {
            netEl.className = 'text-4xl font-bold text-gray-900 dark:text-white';
        }

        document.getElementById('statTotalStudents').textContent = totalStudents;
        // document.getElementById('totalStudentsCount').textContent = totalStudents; // This ID is missing in HTML
        document.getElementById('attendanceCount').textContent = presentCount + ' / ' + totalStudents;
        document.getElementById('attendanceGaugeText').textContent = attendancePercent + '%';

        document.getElementById('feePercentage').textContent = progressPercent + '%';
        const progressBar = document.getElementById('feeProgressBar');
        if (progressBar) progressBar.style.width = Math.min(progressPercent, 100) + '%';

        // Animate gauge
        const circumference = 2 * Math.PI * 28; // Corrected radius r=28
        const offset = circumference - (attendancePercent / 100) * circumference;
        const circle = document.getElementById('attendanceCircle');
        if (circle) {
            circle.style.strokeDasharray = circumference;
            circle.style.strokeDashoffset = offset;
        }

    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadCharts(period = 'monthly', customStart = null, customEnd = null) {
    try {
        if (typeof Chart === 'undefined') {
            await window.loadScript('https://cdn.jsdelivr.net/npm/chart.js');
        }

        const stats = await getChartDataView(period, customStart, customEnd);
        const { labels, revenue, expenses } = stats;

        // Sync check: Ensure February (current month) matches the card if we are in monthly view
        // In this app, we refresh the dashboard when data changes, so it should stay synced.

        const canvas = document.getElementById('revenueChart');
        if (!canvas) return;
        const revenueCtx = canvas.getContext('2d');
        const existingChart = Chart.getChart(revenueCtx);
        if (existingChart) existingChart.destroy();

        // Soft gradient fill beneath each line (use container height so chart always has valid fill)
        const chartHeight = canvas.parentElement?.clientHeight || 250;
        const revGradient = revenueCtx.createLinearGradient(0, 0, 0, chartHeight);
        revGradient.addColorStop(0, 'rgba(99, 102, 241, 0.35)');
        revGradient.addColorStop(0.5, 'rgba(99, 102, 241, 0.08)');
        revGradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
        const expGradient = revenueCtx.createLinearGradient(0, 0, 0, chartHeight);
        expGradient.addColorStop(0, 'rgba(244, 63, 94, 0.28)');
        expGradient.addColorStop(0.5, 'rgba(244, 63, 94, 0.06)');
        expGradient.addColorStop(1, 'rgba(244, 63, 94, 0)');

        new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Revenue',
                    data: revenue,
                    borderColor: '#6366f1',
                    backgroundColor: revGradient,
                    borderWidth: 2,
                    tension: 0.45,
                    fill: true,
                    pointBackgroundColor: '#6366f1',
                    pointBorderColor: '#fff',
                    pointRadius: 3,
                    pointHoverRadius: 8,
                    pointHoverBorderWidth: 2,
                    spanGaps: true
                }, {
                    label: 'Expenses',
                    data: expenses,
                    borderColor: '#f43f5e',
                    backgroundColor: expGradient,
                    borderWidth: 2,
                    tension: 0.45,
                    fill: true,
                    pointBackgroundColor: '#f43f5e',
                    pointBorderColor: '#fff',
                    pointRadius: 3,
                    pointHoverRadius: 8,
                    pointHoverBorderWidth: 2,
                    spanGaps: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                devicePixelRatio: typeof window !== 'undefined' && window.devicePixelRatio ? Math.min(window.devicePixelRatio, 2) : 1,
                animation: {
                    duration: 800,
                    easing: 'easeOutQuart'
                },
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        padding: 12,
                        cornerRadius: 10,
                        titleFont: { size: 14, weight: '800' },
                        titleColor: '#FFFFFF',
                        bodyFont: { size: 12 },
                        bodyColor: '#E2E8F0',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.1)',
                        callbacks: {
                            label: function (context) {
                                let val = context.parsed.y || 0;
                                return ` ${context.dataset.label}: PKR ${val.toLocaleString()}`;
                            },
                            footer: function (items) {
                                const rev = items[0].parsed.y || 0;
                                const ex = items[1]?.parsed.y || 0;
                                const profit = rev - ex;
                                return `\nNet Profit: PKR ${profit.toLocaleString()}`;
                            }
                        },
                        footerFont: { size: 12, weight: 'bold' },
                        footerColor: '#10b981'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#9ca3af',
                            font: { size: 11 },
                            callback: v => v >= 1000 ? (v / 1000) + 'k' : v
                        },
                        grid: { color: 'rgba(156, 163, 175, 0.12)', drawBorder: false }
                    },
                    x: {
                        ticks: { color: '#9ca3af', font: { size: 10 } },
                        grid: { display: false }
                    }
                }
            }
        });

        // Update Class Distribution as well
        await loadClassChart();

    } catch (error) {
        console.error('Error loading charts:', error);
    }
}

async function getChartDataView(period, customStart, customEnd) {
    let startDate, endDate, labels = [], bucketFn;
    const now = new Date();

    if (period === 'daily') {
        startDate = new Date();
        startDate.setDate(now.getDate() - 13); // Last 14 days
        endDate = now;

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            labels.push(d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }));
        }
        bucketFn = d => d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });

    } else if (period === 'weekly') {
        startDate = new Date();
        startDate.setDate(now.getDate() - (7 * 11)); // Last 12 weeks
        // Align to Monday
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day == 0 ? -6 : 1);
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0); // Set to start of day
        endDate = now;

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
            const endWeek = new Date(d);
            endWeek.setDate(d.getDate() + 6);
            labels.push(`${d.getDate()}/${d.getMonth() + 1} - ${endWeek.getDate()}/${endWeek.getMonth() + 1}`);
        }
        bucketFn = d => {
            const start = new Date(d);
            const day = start.getDay();
            const diff = start.getDate() - day + (day == 0 ? -6 : 1);
            start.setDate(diff);
            start.setHours(0, 0, 0, 0); // Ensure consistent start of week
            const end = new Date(start);
            end.setDate(start.getDate() + 6);
            return `${start.getDate()}/${start.getMonth() + 1} - ${end.getDate()}/${end.getMonth() + 1}`;
        };

    } else if (period === 'custom') {
        startDate = new Date(customStart);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(customEnd);
        endDate.setHours(23, 59, 59, 999);

        const dayDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        if (dayDiff > 60) {
            // Group by Month if range > 2 months
            // Ensure we add months correctly to avoid skipping
            let current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
            while (current <= endDate) {
                labels.push(current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
                current.setMonth(current.getMonth() + 1);
            }
            bucketFn = d => d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        } else {
            // Group by Day
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                labels.push(d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }));
            }
            bucketFn = d => d.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
        }
    } else {
        // Default: Monthly (6 months)
        startDate = new Date();
        startDate.setMonth(now.getMonth() - 5);
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate = now;

        for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
            labels.push(d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
        }
        bucketFn = d => d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }

    const startDayStr = getLocalDateStr(startDate);
    const endDayStr = getLocalDateStr(endDate);

    // Fetch Data
    const [{ data: payments }, { data: expensesRaw }] = await Promise.all([
        supabase.from('fee_payments').select('amount_paid, created_at').gte('created_at', startDate.toISOString()).lte('created_at', endDate.toISOString()),
        supabase.from('expenses').select('amount, date').gte('date', startDayStr).lte('date', endDayStr)
    ]);

    // Aggregate
    const revenueMap = {};
    const expenseMap = {};
    labels.forEach(l => { revenueMap[l] = 0; expenseMap[l] = 0; });

    payments?.forEach(p => {
        const d = new Date(p.created_at);
        const l = bucketFn(d);
        if (revenueMap.hasOwnProperty(l)) revenueMap[l] += parseFloat(p.amount_paid) || 0;
    });

    expensesRaw?.forEach(e => {
        const d = new Date(e.date);
        const l = bucketFn(d);
        if (expenseMap.hasOwnProperty(l)) expenseMap[l] += parseFloat(e.amount) || 0;
    });

    // Zero-Data Handling: For Monthly/Weekly, we skip labels at the beginning that have zero data
    if (period === 'monthly' || period === 'weekly') {
        let firstIndex = 0;
        for (let i = 0; i < labels.length - 1; i++) {
            if (revenueMap[labels[i]] > 0 || expenseMap[labels[i]] > 0) {
                firstIndex = i;
                break;
            }
            if (i === labels.length - 2) firstIndex = i; // Show at least last 2 points if all are zero
        }

        // Final Sync Override: Ensure the very last point matches the dashboard totals
        // if period is 'monthly' or 'weekly' and the last bucket is the current one.
        const lastLabel = labels[labels.length - 1];
        const nowLabel = bucketFn(now);
        if (lastLabel === nowLabel) {
            // Calculate start of current month/week correctly for sync
            let syncStartDate;
            if (period === 'monthly') {
                syncStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
            } else {
                syncStartDate = new Date(now);
                const day = syncStartDate.getDay();
                const diff = syncStartDate.getDate() - day + (day == 0 ? -6 : 1);
                syncStartDate.setDate(diff);
                syncStartDate.setHours(0, 0, 0, 0);
            }

            const syncStartDayStr = getLocalDateStr(syncStartDate);
            const syncEndDayStr = getLocalDateStr(now);
            const syncStartISO = syncStartDate.toISOString();
            const syncEndISO = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();

            const [preciseRev, preciseExp] = await Promise.all([
                // Sync Monthly end point: Match the Card (which uses payment_date for 'Today' consistency or accrual)
                // To match Tiles (27,800), we query by 'payment_date' within the current month/week
                supabase.from('fee_payments').select('amount_paid').gte('payment_date', syncStartDayStr).lte('payment_date', syncEndDayStr),
                supabase.from('expenses').select('amount').gte('date', syncStartDayStr).lte('date', syncEndDayStr)
            ]);

            revenueMap[lastLabel] = preciseRev.data?.reduce((sum, p) => sum + (parseFloat(p.amount_paid) || 0), 0) || 0;
            expenseMap[lastLabel] = preciseExp.data?.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) || 0;
        }

        const filteredLabels = labels.slice(firstIndex);
        return {
            labels: filteredLabels,
            revenue: filteredLabels.map(l => revenueMap[l]),
            expenses: filteredLabels.map(l => expenseMap[l])
        };
    }

    return {
        labels: labels,
        revenue: labels.map(l => revenueMap[l]),
        expenses: labels.map(l => expenseMap[l])
    };
}

async function loadClassChart() {
    const classCtx = document.getElementById('classDistributionChart');
    if (!classCtx) return;

    const { data: students } = await supabase.from('students').select('class');
    const classCounts = {};
    students?.forEach(s => {
        classCounts[s.class] = (classCounts[s.class] || 0) + 1;
    });
    const sortedClasses = Object.keys(classCounts).sort();

    const existing = Chart.getChart(classCtx);
    if (existing) existing.destroy();

    new Chart(classCtx.getContext('2d'), {
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
                    ticks: { color: '#9ca3af' },
                    grid: { color: 'rgba(156, 163, 175, 0.1)', drawBorder: false }
                },
                x: {
                    ticks: { color: '#9ca3af' },
                    grid: { display: false }
                }
            }
        }
    });
}

async function loadUrgentFollowups() {
    try {
        const [{ data: fees, error: feesError }, { data: allPayments, error: payError }] = await Promise.all([
            supabase.from('fees').select('*, students(name, class, phone)').order('generated_at', { ascending: false }),
            supabase.from('fee_payments').select('id, student_id, fee_id, amount_paid')
        ]);

        if (feesError) {
            console.error('Error fetching urgent followups:', feesError);
            document.getElementById('urgentFollowups').innerHTML = '<tr><td colspan="5" class="py-12 text-center text-red-400">Error loading data</td></tr>';
            return;
        }
        if (payError) console.warn('Urgent followups: fee_payments fetch failed, showing balances from fee rows only.', payError);

        const paymentsByStudent = new Map();
        (allPayments || []).forEach(p => {
            if (!paymentsByStudent.has(p.student_id)) paymentsByStudent.set(p.student_id, []);
            paymentsByStudent.get(p.student_id).push(p);
        });

        const feesByStudent = new Map();
        (fees || []).forEach(f => {
            if (!feesByStudent.has(f.student_id)) feesByStudent.set(f.student_id, { student: f.students, fees: [] });
            feesByStudent.get(f.student_id).fees.push(f);
        });

        const studentBalances = [];
        feesByStudent.forEach((data, studentId) => {
            const studentFees = data.fees;
            const studentPayments = paymentsByStudent.get(studentId) || [];
            const totalRemaining = calculateUnifiedBalance([{ id: studentId, fees: studentFees }], studentPayments);
            if (totalRemaining <= 0) return;

            let maxDaysOverdue = 0;
            studentFees.forEach(f => {
                const net = (Number(f.amount) || 0) - (Number(f.discount) || 0);
                const paidForFee = studentPayments.filter(p => p.fee_id === f.id).reduce((s, p) => s + Number(p.amount_paid || 0), 0);
                const remaining = net - paidForFee;
                if (remaining <= 0) return;
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                let targetDate;
                if (f.due_date) targetDate = new Date(f.due_date);
                else if (f.month) {
                    const [y, m] = f.month.split('-').map(Number);
                    targetDate = new Date(y, m - 1, 10);
                } else if (f.created_at) targetDate = new Date(f.created_at);
                else targetDate = new Date(today.getFullYear(), today.getMonth(), 10);
                targetDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
                if (today > targetDate) {
                    const days = Math.floor((today - targetDate) / (1000 * 60 * 60 * 24));
                    if (days > maxDaysOverdue) maxDaysOverdue = days;
                }
            });

            studentBalances.push({
                student_id: studentId,
                name: data.student?.name || 'Unknown',
                class: data.student?.class || '-',
                phone: data.student?.phone || '',
                totalRemaining,
                maxDaysOverdue
            });
        });

        const urgentList = studentBalances
            .filter(s => s.totalRemaining > 0)
            .sort((a, b) => b.totalRemaining - a.totalRemaining)
            .slice(0, 10);

        const html = urgentList.length > 0 ? urgentList.map((student, index) => {
            // Format phone number: Remove non-digits and ensure country code (92 for Pakistan)
            let cleanPhone = student.phone.replace(/[^0-9]/g, '');
            if (cleanPhone.startsWith('0')) {
                cleanPhone = '92' + cleanPhone.substring(1);
            } else if (!cleanPhone.startsWith('92') && cleanPhone.length === 10) {
                cleanPhone = '92' + cleanPhone;
            }

            // Fix "Class Class 10" redundancy
            const className = student.class.toLowerCase().includes('class') ? student.class : `Class ${student.class}`;
            const formattedBalance = student.totalRemaining.toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

            const waMessage = `Dear Parent, this is a reminder regarding the pending dues for ${student.name} of ${className}. The current outstanding balance is PKR ${formattedBalance}. Please clear the dues at your earliest convenience. Thank you.`;

            // Use wa.me for mobile and api.whatsapp.com for broad compatibility
            const waLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(waMessage)}`;

            return `
                <tr class="group hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td class="py-4">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-primary-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <span class="text-[10px] font-bold text-white">${student.name?.charAt(0) || 'S'}</span>
                            </div>
                            <div>
                                <p class="text-sm font-bold text-gray-900 dark:text-white">${student.name}</p>
                                <p class="text-[10px] text-gray-500 dark:text-gray-400 capitalize">${className}</p>
                            </div>
                        </div>
                    </td>
                    <td class="py-4 font-black text-red-600 dark:text-red-500 text-sm">
                        PKR ${student.totalRemaining.toLocaleString()}
                    </td>
                    <td class="py-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                        ${student.maxDaysOverdue} Days
                    </td>
                    <td class="py-4 text-right">
                        <div class="flex items-center justify-end gap-2">
                            <a href="${waLink}" target="_blank" class="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded-lg shadow-lg shadow-emerald-500/20 transition-all opacity-0 group-hover:opacity-100">
                                <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                </svg>
                                WhatsApp
                            </a>
                        </div>
                    </td>
                </tr>
            `;
        }).join('') : '<tr><td colspan="4" class="py-12 text-center text-gray-400 text-sm">No pending arrears found</td></tr>';

        document.getElementById('urgentFollowups').innerHTML = html;

    } catch (error) {
        console.error('Error loading urgent followups:', error);
    }
}

async function loadRecentActivity() {
    try {
        // Fetch payments with receipt_id so we can group by receipt (one activity per receipt)
        const [paymentsRes, admissionsRes] = await Promise.all([
            supabase.from('fee_payments')
                .select('id, amount_paid, payment_date, payment_method, created_at, student_id, receipt_id, students(name)')
                .order('created_at', { ascending: false })
                .limit(50),
            supabase.from('students')
                .select('id, name, class, created_at, admission_date')
                .order('created_at', { ascending: false })
                .limit(10)
        ]);

        if (paymentsRes.error) console.error('Error fetching payments for feed:', paymentsRes.error);
        if (admissionsRes.error) console.error('Error fetching admissions for feed:', admissionsRes.error);

        const activities = [];

        // Group payments by receipt (same receipt = one activity line); legacy payments without receipt_id = one each
        const paymentGroups = new Map();
        (paymentsRes.data || []).forEach(p => {
            const key = p.receipt_id || p.id;
            if (!paymentGroups.has(key)) {
                paymentGroups.set(key, []);
            }
            paymentGroups.get(key).push(p);
        });

        paymentGroups.forEach((payments) => {
            const total = payments.reduce((sum, p) => sum + (parseFloat(p.amount_paid) || 0), 0);
            const first = payments[0];
            const timestamp = first.created_at ? new Date(first.created_at) : new Date(first.payment_date);
            const method = first.payment_method || 'Cash';
            const names = [...new Set(payments.map(p => p.students?.name || 'Student').filter(Boolean))];
            const label = names.length === 1 ? names[0] : (names.length + ' students');
            activities.push({
                type: 'payment',
                title: 'Fee Payment Received',
                description: `${label} paid PKR ${total.toLocaleString()} via ${method}`,
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

