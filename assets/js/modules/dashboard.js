// Use global Supabase client for production compatibility
const supabase = window.supabase;

let allStudents = [];

export async function render(container) {
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Stat Cards -->
            <div id="card-students" class="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 h-32 flex items-center justify-center cursor-pointer hover:shadow-md transition-all">
                <div class="animate-pulse flex space-x-4 w-full">
                    <div class="flex-1 space-y-4 py-1">
                        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                    <div class="rounded-full bg-gray-200 dark:bg-gray-700 h-12 w-12"></div>
                </div>
            </div>
            <div id="card-classes" class="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 h-32 flex items-center justify-center transition-colors">
                <div class="animate-pulse flex space-x-4 w-full">
                    <div class="flex-1 space-y-4 py-1">
                        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                    <div class="rounded-full bg-gray-200 dark:bg-gray-700 h-12 w-12"></div>
                </div>
            </div>
            <div id="card-fees-collected" class="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 h-32 flex items-center justify-center transition-colors">
                <div class="animate-pulse flex space-x-4 w-full">
                    <div class="flex-1 space-y-4 py-1">
                        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                    <div class="rounded-full bg-gray-200 dark:bg-gray-700 h-12 w-12"></div>
                </div>
            </div>
            <div id="card-fees-pending" class="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 h-32 flex items-center justify-center transition-colors">
                <div class="animate-pulse flex space-x-4 w-full">
                    <div class="flex-1 space-y-4 py-1">
                        <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div class="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                    <div class="rounded-full bg-gray-200 dark:bg-gray-700 h-12 w-12"></div>
                </div>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 transition-colors">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Fee Collection Trends</h3>
                <div style="position: relative; height: 300px;">
                    <canvas id="feesChart"></canvas>
                </div>
            </div>
            <div class="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 transition-colors">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Student Distribution</h3>
                <div style="position: relative; height: 300px;">
                    <canvas id="studentsChart"></canvas>
                </div>
            </div>
        </div>

        <!-- Students Modal -->
        <div id="dashboardStudentsModal" class="modal-overlay fixed inset-0 bg-black/80 hidden items-center justify-center z-50 backdrop-blur-sm">
            <div class="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden flex flex-col max-h-[90vh] border border-gray-200 dark:border-gray-800">
                <div class="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white">All Students</h3>
                    <div class="flex items-center space-x-4">
                        <select id="dashboardClassFilter" class="px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none text-gray-900 dark:text-white bg-white dark:bg-gray-800">
                            <option value="all">All Classes</option>
                        </select>
                        <button id="closeDashboardModalBtn" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="p-0 overflow-auto flex-1 bg-white dark:bg-gray-900">
                    <table class="w-full text-left border-collapse">
                        <thead class="sticky top-0 bg-gray-50 dark:bg-gray-800 shadow-sm z-10">
                            <tr class="text-gray-500 dark:text-gray-400 text-sm uppercase tracking-wider">
                                <th class="p-4 font-semibold">Name</th>
                                <th class="p-4 font-semibold">Roll No</th>
                                <th class="p-4 font-semibold">Class</th>
                                <th class="p-4 font-semibold">Contact</th>
                            </tr>
                        </thead>
                        <tbody id="dashboardStudentsTableBody" class="text-gray-700 dark:text-gray-300 text-sm divide-y divide-gray-200 dark:divide-gray-800">
                            <!-- Rows -->
                        </tbody>
                    </table>
                </div>
                <div class="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 text-right text-xs text-gray-500 dark:text-gray-400">
                    Total: <span id="dashboardTotalCount">0</span>
                </div>
            </div>
        </div>
    `;

    // Event Listeners
    document.getElementById('card-students').addEventListener('click', openStudentsModal);
    document.getElementById('closeDashboardModalBtn').addEventListener('click', closeStudentsModal);
    document.getElementById('dashboardClassFilter').addEventListener('change', filterStudents);

    if (!supabase) {
        console.error('Supabase client not initialized');
        return;
    }

    // Progressive Loading

    // 1. Students (Count + Chart)
    supabase.from('students').select('class')
        .then(({ data, error }) => {
            if (!error && data) {
                updateStudentCard(data.length);
                renderStudentsChart(data);
            } else {
                console.error('Error fetching students:', error);
                updateStudentCard(0);
            }
        });

    // 2. Classes (Count)
    supabase.from('classes').select('*', { count: 'exact', head: true })
        .then(({ count, error }) => {
            if (!error) {
                updateClassesCard(count);
            } else {
                console.error('Error fetching classes:', error);
                updateClassesCard(0);
            }
        });

    // 3. Fees (Stats + Chart)
    supabase.from('fees').select('amount, status')
        .then(({ data, error }) => {
            if (!error && data) {
                processFeeStats(data);
            } else {
                console.error('Error fetching fees:', error);
                processFeeStats([]);
            }
        });
}

function updateStudentCard(count) {
    const card = document.getElementById('card-students');
    if (card) {
        card.innerHTML = `
            <div class="flex items-center justify-between w-full">
                <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</p>
                    <h3 class="text-2xl font-bold text-gray-900 dark:text-white mt-1">${count}</h3>
                </div>
                <div class="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                </div>
            </div>
        `;
    }
}

function updateClassesCard(count) {
    const card = document.getElementById('card-classes');
    if (card) {
        card.innerHTML = `
            <div class="flex items-center justify-between w-full">
                <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Classes</p>
                    <h3 class="text-2xl font-bold text-gray-900 dark:text-white mt-1">${count || 0}</h3>
                </div>
                <div class="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                    <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
            </div>
        `;
    }
}

function processFeeStats(fees) {
    let totalFeesIssued = 0;
    let totalFeesCollected = 0;
    let paidCount = 0;
    let unpaidCount = 0;

    fees.forEach(fee => {
        totalFeesIssued += (fee.amount || 0);
        if (fee.status === 'paid') {
            totalFeesCollected += (fee.amount || 0);
            paidCount++;
        } else {
            unpaidCount++;
        }
    });

    // Update Collected Card
    const collectedCard = document.getElementById('card-fees-collected');
    if (collectedCard) {
        collectedCard.innerHTML = `
            <div class="flex items-center justify-between w-full">
                <div class="flex-1 min-w-0 pr-3">
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Fees Collected</p>
                    <h3 class="text-2xl font-bold text-green-600 dark:text-green-400 mt-1 truncate">${window.formatCurrency(totalFeesCollected)}</h3>
                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">out of ${window.formatCurrency(totalFeesIssued)}</p>
                </div>
                <div class="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg flex-shrink-0">
                    <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
            </div>
        `;
    }

    // Update Pending Card
    const pendingCard = document.getElementById('card-fees-pending');
    if (pendingCard) {
        pendingCard.innerHTML = `
            <div class="flex items-center justify-between w-full">
                <div>
                    <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Fees</p>
                    <h3 class="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">${unpaidCount}</h3>
                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">students</p>
                </div>
                <div class="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                    <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
            </div>
        `;
    }

    renderFeesChart(paidCount, unpaidCount);
}

async function openStudentsModal() {
    const modal = document.getElementById('dashboardStudentsModal');

    // Move modal to body to break out of dashboard layout
    if (modal.parentElement !== document.body) {
        document.body.appendChild(modal);
    }

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

    tbody.innerHTML = students.map(student => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <td class="p-4">
                <div class="flex items-center">
                    <div class="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold mr-3 text-xs">
                        ${student.name.charAt(0)}
                    </div>
                    <div class="font-medium text-gray-900 dark:text-white">${student.name}</div>
                </div>
            </td>
            <td class="p-4 text-gray-600 dark:text-gray-300">${student.roll_no}</td>
            <td class="p-4 text-gray-600 dark:text-gray-300">${student.class} (${student.section})</td>
            <td class="p-4 text-gray-600 dark:text-gray-300">${student.phone || '-'}</td>
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

function renderFeesChart(paid, unpaid) {
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
}

function renderStudentsChart(students) {
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
