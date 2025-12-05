// Use global Supabase client for production compatibility
const supabase = window.supabase;

let allStudents = [];

export async function render(container) {
    container.innerHTML = `
        <div class="space-y-6 animate-fade-in">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <!-- Stat Cards will be injected here -->
                <div class="stat-card skeleton h-32"></div>
                <div class="stat-card skeleton h-32"></div>
                <div class="stat-card skeleton h-32"></div>
                <div class="stat-card skeleton h-32"></div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="modern-card p-6 animate-slide-in-left">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-lg font-bold text-text">Fee Collection Trends</h3>
                        <div class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <svg class="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                            </svg>
                        </div>
                    </div>
                    <div style="position: relative; height: 300px;">
                        <canvas id="feesChart"></canvas>
                    </div>
                </div>
                <div class="modern-card p-6 animate-slide-in-right">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-lg font-bold text-text">Student Distribution</h3>
                        <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                            </svg>
                        </div>
                    </div>
                    <div style="position: relative; height: 300px;">
                        <canvas id="studentsChart"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <!-- Students Modal -->
        <div id="dashboardStudentsModal" class="modal-backdrop hidden items-center justify-center z-50">
            <div class="modal-content w-full max-w-4xl mx-4 overflow-hidden flex flex-col max-h-[90vh]">
                <div class="p-6 border-b border-custom flex justify-between items-center bg-surface-elevated">
                    <div>
                        <h3 class="text-xl font-bold text-text">All Students</h3>
                        <p class="text-sm text-text-secondary mt-1">View and filter student records</p>
                    </div>
                    <div class="flex items-center space-x-3">
                        <select id="dashboardClassFilter" class="modern-input text-sm py-2 px-3 min-w-[150px]">
                            <option value="all">All Classes</option>
                        </select>
                        <button id="closeDashboardModalBtn" class="p-2 rounded-lg text-text-secondary hover:text-text hover:bg-surface-elevated transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="p-0 overflow-auto flex-1">
                    <table class="modern-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Roll No</th>
                                <th>Class</th>
                                <th>Contact</th>
                            </tr>
                        </thead>
                        <tbody id="dashboardStudentsTableBody">
                            <!-- Rows -->
                        </tbody>
                    </table>
                </div>
                <div class="p-4 border-t border-custom bg-surface-elevated text-right text-sm text-text-secondary">
                    Total: <span id="dashboardTotalCount" class="font-semibold text-text">0</span> students
                </div>
            </div>
        </div>
    `;

    try {
        if (!supabase) {
            throw new Error('Supabase client not initialized');
        }
        
        // Fetch Stats in parallel
        const [studentsCount, classesCount, feesStats] = await Promise.all([
            supabase.from('students').select('*', { count: 'exact', head: true }),
            supabase.from('classes').select('*', { count: 'exact', head: true }),
            supabase.from('fees').select('amount, status')
        ]);

        const totalStudents = studentsCount.count || 0;
        const totalClasses = classesCount.count || 0;

        let totalFeesIssued = 0;
        let totalFeesCollected = 0;
        let paidCount = 0;
        let unpaidCount = 0;

        if (feesStats.data) {
            feesStats.data.forEach(fee => {
                totalFeesIssued += (fee.amount || 0);
                if (fee.status === 'paid') {
                    totalFeesCollected += (fee.amount || 0);
                    paidCount++;
                } else {
                    unpaidCount++;
                }
            });
        }

        // Update UI with modern stat cards
        const statsHtml = `
            <div id="total-students-card" class="stat-card cursor-pointer group animate-scale-in" style="animation-delay: 0.1s">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <p class="text-sm font-semibold text-text-secondary mb-2">Total Students</p>
                        <h3 class="text-3xl font-bold text-text mb-1">${totalStudents}</h3>
                        <p class="text-xs text-text-muted">Active enrollment</p>
                    </div>
                    <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    </div>
                </div>
            </div>

            <div class="stat-card animate-scale-in" style="animation-delay: 0.2s">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <p class="text-sm font-semibold text-text-secondary mb-2">Total Classes</p>
                        <h3 class="text-3xl font-bold text-text mb-1">${totalClasses}</h3>
                        <p class="text-xs text-text-muted">Active classes</p>
                    </div>
                    <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    </div>
                </div>
            </div>

            <div class="stat-card animate-scale-in" style="animation-delay: 0.3s">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <p class="text-sm font-semibold text-text-secondary mb-2">Fees Collected</p>
                        <h3 class="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">$${totalFeesCollected.toLocaleString()}</h3>
                        <p class="text-xs text-text-muted">of $${totalFeesIssued.toLocaleString()} total</p>
                    </div>
                    <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                        <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                </div>
            </div>

            <div class="stat-card animate-scale-in" style="animation-delay: 0.4s">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <p class="text-sm font-semibold text-text-secondary mb-2">Pending Fees</p>
                        <h3 class="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">${unpaidCount}</h3>
                        <p class="text-xs text-text-muted">students pending</p>
                    </div>
                    <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                        <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                </div>
            </div>
        `;

        const statsContainer = container.querySelector('.grid');
        statsContainer.innerHTML = statsHtml;
        
        // Add stagger animation
        statsContainer.querySelectorAll('.stat-card').forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });

        // Fetch student distribution by class
        const { data: students } = await supabase.from('students').select('class');

        // Render Charts
        renderCharts(paidCount, unpaidCount, students);

        // Event Listeners for Modal
        document.getElementById('total-students-card').addEventListener('click', openStudentsModal);
        document.getElementById('closeDashboardModalBtn').addEventListener('click', closeStudentsModal);
        document.getElementById('dashboardClassFilter').addEventListener('change', filterStudents);

    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        container.innerHTML += `<div class="bg-red-50 p-4 rounded text-red-600">Error loading stats: ${error.message}</div>`;
    }
}

async function openStudentsModal() {
    const modal = document.getElementById('dashboardStudentsModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');

    await fetchAndRenderStudents();
}

function closeStudentsModal() {
    const modal = document.getElementById('dashboardStudentsModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

async function fetchAndRenderStudents() {
    const tbody = document.getElementById('dashboardStudentsTableBody');
    tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center">Loading...</td></tr>';

    if (!supabase) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-red-500">Error: Supabase client not initialized</td></tr>';
        return;
    }

    const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('name');

    if (error) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-red-500">Error: ${error.message}</td></tr>`;
        return;
    }

    allStudents = data;

    // Populate Class Filter
    const classes = [...new Set(data.map(s => s.class))].sort();
    const filterSelect = document.getElementById('dashboardClassFilter');

    // Keep "All Classes" and append others
    filterSelect.innerHTML = '<option value="all">All Classes</option>';
    classes.forEach(cls => {
        if (cls) {
            const option = document.createElement('option');
            option.value = cls;
            option.textContent = cls;
            filterSelect.appendChild(option);
        }
    });

    renderStudentsTable(allStudents);
}

function renderStudentsTable(students) {
    const tbody = document.getElementById('dashboardStudentsTableBody');
    const countSpan = document.getElementById('dashboardTotalCount');

    countSpan.textContent = students.length;

    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-gray-400">No students found.</td></tr>';
        return;
    }

    tbody.innerHTML = students.map((student, index) => `
        <tr class="animate-fade-in" style="animation-delay: ${index * 0.05}s">
            <td>
                <div class="flex items-center py-4">
                    <div class="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm mr-3 shadow-md">
                        ${student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div class="font-semibold text-text">${student.name}</div>
                    </div>
                </div>
            </td>
            <td class="text-text-secondary font-medium">${student.roll_no}</td>
            <td>
                <span class="badge badge-info">${student.class}</span>
                ${student.section ? `<span class="text-text-muted text-xs ml-2">${student.section}</span>` : ''}
            </td>
            <td class="text-text-secondary">${student.phone || '-'}</td>
        </tr>
    `).join('');
}

function filterStudents(e) {
    const selectedClass = e.target.value;

    if (selectedClass === 'all') {
        renderStudentsTable(allStudents);
    } else {
        const filtered = allStudents.filter(s => s.class === selectedClass);
        renderStudentsTable(filtered);
    }
}

function renderCharts(paid, unpaid, students) {
    const ctxFees = document.getElementById('feesChart').getContext('2d');
    new Chart(ctxFees, {
        type: 'doughnut',
        data: {
            labels: ['Paid', 'Unpaid'],
            datasets: [{
                data: [paid, unpaid],
                backgroundColor: ['#10B981', '#EF4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    // Group students by class
    const classDistribution = {};
    if (students && students.length > 0) {
        students.forEach(student => {
            const className = student.class || 'Unknown';
            classDistribution[className] = (classDistribution[className] || 0) + 1;
        });
    }

    // Convert to arrays for Chart.js
    const classLabels = Object.keys(classDistribution).sort();
    const classCounts = classLabels.map(label => classDistribution[label]);

    // If no data, show a message instead of empty chart
    const ctxStudents = document.getElementById('studentsChart').getContext('2d');

    if (classLabels.length === 0) {
        // Show placeholder message - only replace the canvas wrapper
        const canvas = document.getElementById('studentsChart');
        canvas.parentElement.innerHTML = `
            <div class="flex items-center justify-center h-full text-gray-400">
                <p>No students added yet. Add students to see distribution.</p>
            </div>
        `;
    } else {
        new Chart(ctxStudents, {
            type: 'bar',
            data: {
                labels: classLabels,
                datasets: [{
                    label: 'Students',
                    data: classCounts,
                    backgroundColor: '#6366F1',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }
}
