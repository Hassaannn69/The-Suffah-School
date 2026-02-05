// Student Dashboard - A completely separate dashboard for students
// Shows student-specific data: profile, fees, family fees, attendance, assignments, homework, exams, tests, notifications

const supabase = window.supabase;

let currentStudent = null;
let familyMembers = [];

export async function render(container) {
    // Show loading state
    container.innerHTML = `
        <div class="flex items-center justify-center min-h-[60vh]">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
    `;

    try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            container.innerHTML = '<div class="text-center text-red-500 p-8">Please log in to view your dashboard.</div>';
            return;
        }

        // Get student data by roll number (extracted from email)
        const userEmail = session.user.email;
        // Email format is: rollno@student.suffah.school or rollno@...
        // Extract roll number from email (before the @)
        const rollNo = userEmail.split('@')[0];

        console.log('Looking up student with roll_no:', rollNo);

        // Try to find by roll_no first (case-insensitive)
        let { data: student, error } = await supabase
            .from('students')
            .select('*')
            .ilike('roll_no', rollNo)
            .single();

        // If not found by roll_no, try by email
        if (error || !student) {
            const result = await supabase
                .from('students')
                .select('*')
                .eq('email', userEmail)
                .single();
            student = result.data;
            error = result.error;
        }

        if (error || !student) {
            console.error('Student not found:', error);
            container.innerHTML = `<div class="text-center text-red-500 p-8">Student profile not found. Roll No: ${rollNo}</div>`;
            return;
        }

        currentStudent = student;

        // Fetch all data in parallel
        const [feesData, familyData, attendanceData, notificationsData, paymentsData, resultsData] = await Promise.all([
            fetchStudentFees(student.id),
            fetchFamilyMembers(student.family_code, student.id),
            fetchAttendance(student.id),
            fetchNotifications(student.class, student.section, student.id),
            fetchPaymentHistory(student.id, student.family_code),
            fetchResults(student.id)
        ]);

        familyMembers = familyData || [];

        // Render the dashboard
        renderStudentDashboard(container, student, feesData, familyData, attendanceData, notificationsData, paymentsData, resultsData);

    } catch (err) {
        console.error('Student Dashboard Error:', err);
        container.innerHTML = `<div class="text-center text-red-500 p-8">Error loading dashboard: ${err.message}</div>`;
    }
}

function renderStudentDashboard(container, student, fees, family, attendance, notifications, payments = [], results = []) {
    const totalFees = fees.reduce((sum, f) => sum + (f.final_amount || f.amount || 0), 0);
    const paidFees = fees.reduce((sum, f) => sum + (f.paid_amount || 0), 0);
    const pendingFees = Math.max(0, totalFees - paidFees);

    // Calculate family totals
    let familyPending = pendingFees;
    family.forEach(member => {
        if (member.fees) {
            const memberTotal = member.fees.reduce((sum, f) => sum + (f.final_amount || f.amount || 0), 0);
            const memberPaid = member.fees.reduce((sum, f) => sum + (f.paid_amount || 0), 0);
            familyPending += Math.max(0, memberTotal - memberPaid);
        }
    });

    // Calculate attendance
    const totalDays = attendance.length;
    const presentDays = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
    const attendancePercent = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    container.innerHTML = `
        <div class="space-y-6">
            <!-- Welcome Header -->
            <div class="bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl p-6 text-white shadow-lg">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold">Welcome, ${student.name}!</h1>
                        <p class="text-primary-100 mt-1">${student.class} - Section ${student.section} | Roll No: ${student.roll_no}</p>
                    </div>
                    <div class="hidden md:block">
                        <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
                            ${student.name ? student.name.charAt(0).toUpperCase() : '?'}
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Stats Cards -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Attendance Card -->
                <div class="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Attendance</p>
                            <p class="text-2xl font-bold text-green-500 mt-1">${attendancePercent}%</p>
                            <p class="text-xs text-gray-400 mt-1">${presentDays}/${totalDays} days</p>
                        </div>
                        <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- My Pending Fees -->
                <div class="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">My Pending</p>
                            <p class="text-2xl font-bold ${pendingFees > 0 ? 'text-red-500' : 'text-green-500'} mt-1">PKR ${pendingFees.toLocaleString()}</p>
                            <p class="text-xs text-gray-400 mt-1">of ${totalFees.toLocaleString()}</p>
                        </div>
                        <div class="w-12 h-12 ${pendingFees > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'} rounded-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 ${pendingFees > 0 ? 'text-red-500' : 'text-green-500'}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- Family Total -->
                <div class="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Family Total</p>
                            <p class="text-2xl font-bold ${familyPending > 0 ? 'text-orange-500' : 'text-green-500'} mt-1">PKR ${familyPending.toLocaleString()}</p>
                            <p class="text-xs text-gray-400 mt-1">${family.length + 1} members</p>
                        </div>
                        <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- Notifications -->
                <div class="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Notifications</p>
                            <p class="text-2xl font-bold text-blue-500 mt-1">${notifications.length}</p>
                            <p class="text-xs text-gray-400 mt-1">unread</p>
                        </div>
                        <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Content Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Left Column: Profile & Family -->
                <div class="space-y-6">
                    <!-- Profile Card -->
                    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div class="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                            <h3 class="font-bold text-gray-900 dark:text-white flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                My Profile
                            </h3>
                        </div>
                        <div class="p-4 space-y-3 text-sm">
                            <div class="flex justify-between"><span class="text-gray-500">Name</span><span class="font-medium text-gray-900 dark:text-white">${student.name}</span></div>
                            <div class="flex justify-between"><span class="text-gray-500">Roll Number</span><span class="font-medium text-gray-900 dark:text-white">${student.roll_no}</span></div>
                            <div class="flex justify-between"><span class="text-gray-500">Class</span><span class="font-medium text-gray-900 dark:text-white">${student.class} - ${student.section}</span></div>
                            <div class="flex justify-between"><span class="text-gray-500">Father Name</span><span class="font-medium text-gray-900 dark:text-white">${student.father_name || '-'}</span></div>
                            <div class="flex justify-between"><span class="text-gray-500">Contact</span><span class="font-medium text-gray-900 dark:text-white">${student.phone || '-'}</span></div>
                            <div class="flex justify-between"><span class="text-gray-500">Date of Birth</span><span class="font-medium text-gray-900 dark:text-white">${student.date_of_birth || '-'}</span></div>
                            <div class="flex justify-between"><span class="text-gray-500">Admission Date</span><span class="font-medium text-gray-900 dark:text-white">${student.admission_date || '-'}</span></div>
                            <div class="flex justify-between"><span class="text-gray-500">Family Code</span><span class="font-medium text-primary-500">${student.family_code || 'Not assigned'}</span></div>
                        </div>
                    </div>

                    <!-- Family Members -->
                    ${family.length > 0 ? `
                    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div class="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                            <h3 class="font-bold text-gray-900 dark:text-white flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Family Members (${family.length})
                            </h3>
                        </div>
                        <div class="divide-y divide-gray-100 dark:divide-gray-800">
                            ${family.map(member => {
        const memberTotal = member.fees ? member.fees.reduce((sum, f) => sum + (f.amount || 0), 0) : 0;
        const memberPaid = member.fees ? member.fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + (f.amount || 0), 0) : 0;
        const memberPending = memberTotal - memberPaid;
        return `
                                <div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <p class="font-medium text-gray-900 dark:text-white">${member.name}</p>
                                            <p class="text-xs text-gray-500">${member.class} - ${member.section}</p>
                                        </div>
                                        <div class="text-right">
                                            <p class="text-sm font-bold ${memberPending > 0 ? 'text-red-500' : 'text-green-500'}">PKR ${memberPending.toLocaleString()}</p>
                                            <p class="text-xs text-gray-400">pending</p>
                                        </div>
                                    </div>
                                </div>
                            `}).join('')}
                        </div>
                    </div>
                    ` : ''}

                    <!-- Quick Actions -->
                    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div class="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                            <h3 class="font-bold text-gray-900 dark:text-white">Quick Actions</h3>
                        </div>
                        <div class="p-4 grid grid-cols-3 gap-3">
                            <button onclick="document.getElementById('fees-section')?.scrollIntoView({behavior: 'smooth'})" class="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg text-center hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors group">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mx-auto text-primary-500 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p class="text-xs font-medium text-gray-700 dark:text-gray-300 mt-2">Fees</p>
                            </button>
                            <button onclick="document.getElementById('attendance-section')?.scrollIntoView({behavior: 'smooth'})" class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors group">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mx-auto text-green-500 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p class="text-xs font-medium text-gray-700 dark:text-gray-300 mt-2">Attendance</p>
                            </button>
                            <button onclick="document.getElementById('results-section')?.scrollIntoView({behavior: 'smooth'})" class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors group">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mx-auto text-blue-500 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <p class="text-xs font-medium text-gray-700 dark:text-gray-300 mt-2">Results</p>
                            </button>
                        </div>
                    </div>

                    <!-- Notifications -->
                    <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div class="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                            <h3 class="font-bold text-gray-900 dark:text-white flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                Notifications
                            </h3>
                        </div>
                        <div class="divide-y divide-gray-100 dark:divide-gray-800 max-h-64 overflow-y-auto">
                            ${notifications.length > 0 ? notifications.map(n => `
                            <div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <div class="flex items-start space-x-3">
                                    <div class="w-8 h-8 rounded-full flex items-center justify-center ${n.type === 'fee_reminder' ? 'bg-red-100 text-red-500' :
                n.type === 'exam' ? 'bg-purple-100 text-purple-500' :
                    n.type === 'assignment' ? 'bg-blue-100 text-blue-500' :
                        'bg-gray-100 text-gray-500'
            }">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <p class="text-sm font-medium text-gray-900 dark:text-white">${n.title}</p>
                                        <p class="text-xs text-gray-500 mt-1 truncate">${n.message}</p>
                                    </div>
                                </div>
                            </div>
                            `).join('') : `
                            <div class="p-8 text-center text-gray-500">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <p class="text-sm">No notifications</p>
                            </div>
                            `}
                        </div>
                    </div>



                </div>

                <!-- Middle Column: Fees Module -->
                <div class="lg:col-span-2 space-y-6">
                    <!-- Professional Fees Module -->
                    <div id="fees-section" class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div class="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h3 class="font-bold text-gray-900 dark:text-white flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Fees & Payments
                            </h3>
                            <div class="flex items-center gap-2">
                                ${pendingFees > 0 ? `
                                <button id="printFeeBill" class="text-xs bg-primary-500 hover:bg-primary-600 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2h6z" />
                                    </svg>
                                    Print Bill
                                </button>
                                ` : ''}
                                <span class="px-2 py-0.5 text-[10px] font-bold rounded-full ${pendingFees <= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                                    ${pendingFees <= 0 ? 'CLEAR' : 'PENDING'}
                                </span>
                            </div>
                        </div>
                        
                        <div class="p-4 space-y-6">
                            <!-- 1. Fee Overview (Read-only Summary) -->
                            <div class="grid grid-cols-3 gap-3">
                                <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-center border border-gray-100 dark:border-gray-700">
                                    <p class="text-[10px] text-gray-500 uppercase tracking-wider">Total Fee</p>
                                    <p class="font-bold text-gray-900 dark:text-white mt-1">PKR ${totalFees.toLocaleString()}</p>
                                </div>
                                <div class="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg text-center border border-green-100 dark:border-green-900/20">
                                    <p class="text-[10px] text-green-600 uppercase tracking-wider">Paid</p>
                                    <p class="font-bold text-green-700 dark:text-green-400 mt-1">PKR ${paidFees.toLocaleString()}</p>
                                </div>
                                <div class="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg text-center border border-red-100 dark:border-red-900/20">
                                    <p class="text-[10px] text-red-600 uppercase tracking-wider">Pending</p>
                                    <p class="font-bold text-red-700 dark:text-red-400 mt-1">PKR ${pendingFees.toLocaleString()}</p>
                                </div>
                            </div>

                            <!-- 2. Fee Breakdown & History -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center">
                                        <span class="w-1 h-3 bg-primary-500 mr-2 rounded-full"></span>
                                        Fee Breakdown
                                    </h4>
                                    <div class="space-y-2 max-h-60 overflow-y-auto pr-1">
                                        ${fees.length > 0 ? fees.map(fee => {
                const isPaid = fee.status === 'paid';
                return `
                                            <div class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg group hover:border-primary-200 transition-colors">
                                                <div class="flex-1">
                                                    <div class="flex items-center gap-2">
                                                        <p class="font-bold text-gray-800 dark:text-gray-200 text-sm">${fee.fee_type}</p>
                                                        <span class="text-[9px] px-1.5 py-0.5 rounded-full ${isPaid ? 'bg-green-100 text-green-700' :
                        fee.status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-50 text-red-600'}">
                                                            ${fee.status.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div class="flex items-center gap-3 mt-1">
                                                        <p class="text-[10px] text-gray-400">${fee.month}</p>
                                                        ${isPaid && fee.paid_date ? `
                                                        <p class="text-[10px] text-green-500 font-medium">Paid: ${new Date(fee.paid_date).toLocaleDateString()}</p>
                                                        ` : ''}
                                                    </div>
                                                </div>
                                                <div class="text-right">
                                                    <p class="font-bold text-gray-900 dark:text-white text-sm">PKR ${(fee.final_amount || fee.amount || 0).toLocaleString()}</p>
                                                    <p class="text-[9px] text-gray-400">Bal: PKR ${((fee.final_amount || fee.amount || 0) - (fee.paid_amount || 0)).toLocaleString()}</p>
                                                </div>
                                            </div>
                                            `;
            }).join('') : '<div class="text-center py-4 bg-gray-50 dark:bg-gray-800/20 rounded-lg text-xs text-gray-500">No fee records found.</div>'}
                                    </div>
                                </div>

                                <div>
                                    <h4 class="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center">
                                        <span class="w-1 h-3 bg-green-500 mr-2 rounded-full"></span>
                                        Recent Payments
                                    </h4>
                                    ${payments.length > 0 ? `
                                    <div class="overflow-x-auto">
                                        <table class="w-full text-xs text-left">
                                            <thead>
                                                <tr class="text-gray-400 border-b border-gray-100 dark:border-gray-800">
                                                    <th class="pb-2 font-medium">Date</th>
                                                    <th class="pb-2 font-medium text-right">Amount</th>
                                                    <th class="pb-2 font-medium text-center">Receipt</th>
                                                </tr>
                                            </thead>
                                            <tbody class="divide-y divide-gray-50 dark:divide-gray-800">
                                                ${payments.slice(0, 5).map(payment => `
                                                <tr class="group">
                                                    <td class="py-3">
                                                        <p class="text-gray-800 dark:text-gray-200 font-medium">${new Date(payment.payment_date).toLocaleDateString()}</p>
                                                        <p class="text-[9px] text-gray-400">${payment.payment_method}</p>
                                                    </td>
                                                    <td class="py-3 text-right">
                                                        <p class="font-bold text-green-600 dark:text-green-400">PKR ${payment.amount_paid.toLocaleString()}</p>
                                                        <p class="text-[9px] text-gray-400">${payment.receipt_no || '#' + payment.id.toString().slice(-6).toUpperCase()}</p>
                                                    </td>
                                                    <td class="py-3 text-center">
                                                        <button onclick="window.printTransactionReceipt('${payment.id}', '${payment.student_id}')" 
                                                            class="p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-primary-500 hover:text-white rounded transition-all text-gray-500">
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2-2v4a2 2 0 002 2h6z" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                                `).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                    ` : '<div class="text-center py-4 bg-gray-50 dark:bg-gray-800/20 rounded-lg text-xs text-gray-500">No payment history found.</div>'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Attendance Details -->
                    <div id="attendance-section" class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div class="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                            <h3 class="font-bold text-gray-900 dark:text-white flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                This Month's Attendance
                            </h3>
                        </div>
                        <div class="p-4">
                            <div class="flex items-center justify-center mb-4">
                                <div class="relative w-24 h-24">
                                    <svg class="w-24 h-24 transform -rotate-90">
                                        <circle cx="48" cy="48" r="40" stroke="currentColor" stroke-width="8" fill="none" class="text-gray-200 dark:text-gray-700"></circle>
                                        <circle cx="48" cy="48" r="40" stroke="currentColor" stroke-width="8" fill="none" 
                                            stroke-dasharray="${2 * Math.PI * 40}" 
                                            stroke-dashoffset="${2 * Math.PI * 40 * (1 - attendancePercent / 100)}"
                                            class="text-green-500 transition-all duration-500"></circle>
                                    </svg>
                                    <span class="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-900 dark:text-white">${attendancePercent}%</span>
                                </div>
                            </div>
                            <div class="grid grid-cols-3 gap-2 text-center text-sm">
                                <div class="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                    <p class="font-bold text-green-600">${attendance.filter(a => a.status === 'present').length}</p>
                                    <p class="text-xs text-gray-500">Present</p>
                                </div>
                                <div class="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                    <p class="font-bold text-red-600">${attendance.filter(a => a.status === 'absent').length}</p>
                                    <p class="text-xs text-gray-500">Absent</p>
                                </div>
                                <div class="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                                    <p class="font-bold text-yellow-600">${attendance.filter(a => a.status === 'late').length}</p>
                                    <p class="text-xs text-gray-500">Late</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Exam Results (New Module) -->
                    <div id="results-section" class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div class="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h3 class="font-bold text-gray-900 dark:text-white flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                Exam Results
                            </h3>
                            <button onclick="window.fetchResults ? window.location.reload() : null" class="text-xs text-primary-500 hover:text-primary-600 font-medium">
                                Refresh
                            </button>
                        </div>
                        <div class="p-4">
                            ${results.length > 0 ? `
                                <div class="space-y-3">
                                    ${results.map(r => `
                                    <div class="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between group hover:shadow-md transition-all">
                                        <div>
                                            <p class="font-bold text-gray-900 dark:text-white">${r.exam_name || 'Exam'}</p>
                                            <p class="text-xs text-gray-500">${r.date || new Date().toLocaleDateString()}</p>
                                        </div>
                                        <div class="text-right">
                                            <div class="text-lg font-bold ${r.percentage >= 50 ? 'text-green-500' : 'text-red-500'}">
                                                ${r.obtained_marks}/${r.total_marks}
                                            </div>
                                            <p class="text-[10px] text-gray-400 font-medium rounded px-1.5 py-0.5 ${r.percentage >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} inline-block">
                                                ${r.grade || (r.percentage >= 50 ? 'PASS' : 'FAIL')}
                                            </p>
                                        </div>
                                    </div>
                                    `).join('')}
                                </div>
                            ` : `
                                <div class="text-center py-8">
                                    <div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <p class="text-sm text-gray-500 dark:text-gray-400">No exam results declared yet.</p>
                                </div>
                            `}
                        </div>
                    </div>
                </div>


            </div>
        </div>
    `;

    // Add function for printing specific transaction receipts
    window.printTransactionReceipt = async (paymentId, studentId) => {
        const btn = event.currentTarget;
        const originalContent = btn.innerHTML;
        btn.innerHTML = '...';
        btn.disabled = true;

        try {
            const { generateReceipt } = await import('./receipt-generator.js');

            // Get all siblings from the already fetched family data
            const familyIds = [student.id, ...(family || []).map(m => m.id)];

            // Fetch precise payment info for the payment summary section
            const { data: payment } = await supabase.from('fee_payments').select('*').eq('id', paymentId).single();

            await generateReceipt(familyIds, familyIds.length > 1, 'Student Copy', {
                amountPaid: payment.amount_paid,
                receiptNo: payment.receipt_no || 'REC-' + payment.id.toString().slice(-6).toUpperCase(),
                date: new Date(payment.payment_date).toLocaleDateString('en-GB')
            });
        } catch (err) {
            console.error('Print Error:', err);
            alert('Failed to generate receipt.');
        } finally {
            if (btn) {
                btn.innerHTML = originalContent;
                btn.disabled = false;
            }
        }
    };

    // Add event listener for general bill printing (pending fees)
    const printBillBtn = document.getElementById('printFeeBill');
    if (printBillBtn) {
        printBillBtn.onclick = async () => {
            const originalContent = printBillBtn.innerHTML;
            printBillBtn.innerHTML = 'Generating...';
            printBillBtn.disabled = true;

            try {
                const { generateReceipt } = await import('./receipt-generator.js');
                // Generate bill for all family members
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
        const { data, error } = await supabase
            .from('fees')
            .select('*')
            .eq('student_id', studentId)
            .order('generated_at', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching fees:', err);
        return [];
    }
}

async function fetchFamilyMembers(familyCode, currentStudentId) {
    if (!familyCode) return [];

    try {
        const { data: members, error } = await supabase
            .from('students')
            .select('id, name, class, section, roll_no')
            .eq('family_code', familyCode)
            .neq('id', currentStudentId);

        if (error) throw error;

        // Fetch fees for each family member
        for (let member of members) {
            const { data: fees } = await supabase
                .from('fees')
                .select('*')
                .eq('student_id', member.id);
            member.fees = fees || [];
        }

        return members || [];
    } catch (err) {
        console.error('Error fetching family:', err);
        return [];
    }
}

async function fetchPaymentHistory(studentId, familyCode) {
    try {
        // Fetch all student IDs in the family
        let studentIds = [studentId];
        if (familyCode) {
            const { data: family } = await supabase.from('students').select('id').eq('family_code', familyCode);
            if (family) studentIds = family.map(s => s.id);
        }

        const { data, error } = await supabase
            .from('fee_payments')
            .select(`
                *,
                students (name, roll_no),
                fees (fee_type, month)
            `)
            .in('student_id', studentIds)
            .order('payment_date', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching payment history:', err);
        return [];
    }
}

async function fetchAttendance(studentId) {
    try {
        // Get current month attendance
        const { data, error } = await supabase
            .from('attendance')
            .select('*')
            .eq('student_id', studentId)
            .order('date', { ascending: false })
            .limit(30);

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching attendance:', err);
        return [];
    }
}

async function fetchNotifications(className, section, studentId) {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .or(`target_type.eq.all,and(target_type.eq.class,target_class.eq.${className}),and(target_type.eq.student,target_student_id.eq.${studentId})`)
            .eq('is_read', false)
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('Error fetching notifications:', err);
        return [];
    }
}

async function fetchResults(studentId) {
    try {
        const { data, error } = await supabase
            .from('exam_results')
            .select('*')
            .eq('student_id', studentId)
            .order('date', { ascending: false });

        if (error) {
            // Table mismatch or missing, return mock empty or log query error but don't crash
            console.warn('Results fetch error (table might be missing):', error.message);
            return [];
        }
        return data || [];
    } catch (err) {
        console.error('Error fetching results:', err);
        return [];
    }
}
