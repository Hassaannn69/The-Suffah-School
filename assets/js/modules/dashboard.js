// Use global Supabase client for production compatibility
const supabase = window.supabase;

let allStudents = [];

export async function render(container) {
    container.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <!-- Stat Cards will be injected here -->
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse h-32"></div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse h-32"></div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse h-32"></div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse h-32"></div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Fee Collection Trends</h3>
                <div style="position: relative; height: 300px;">
                    <canvas id="feesChart"></canvas>
                </div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Student Distribution</h3>
                <div style="position: relative; height: 300px;">
                    <canvas id="studentsChart"></canvas>
                </div>
            </div>
        </div>

        <!-- Students Modal -->
        <div id="dashboardStudentsModal" class="fixed inset-0 bg-black bg-opacity-50 hidden items-center justify-center z-50 backdrop-blur-sm">
            <div class="bg-white rounded-xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden flex flex-col max-h-[90vh]">
                <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 class="text-lg font-bold text-gray-800">All Students</h3>
                    <div class="flex items-center space-x-4">
                        <select id="dashboardClassFilter" class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700 bg-white">
                            <option value="all">All Classes</option>
                        </select>
                        <button id="closeDashboardModalBtn" class="text-gray-400 hover:text-gray-600">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="p-0 overflow-auto flex-1">
                    <table class="w-full text-left border-collapse">
                        <thead class="sticky top-0 bg-gray-50 shadow-sm z-10">
                            <tr class="text-gray-600 text-sm uppercase tracking-wider">
                                <th class="p-4 font-semibold">Name</th>
                                <th class="p-4 font-semibold">Roll No</th>
                                <th class="p-4 font-semibold">Class</th>
                                <th class="p-4 font-semibold">Contact</th>
                            </tr>
                        </thead>
                        <tbody id="dashboardStudentsTableBody" class="text-gray-700 text-sm divide-y divide-gray-100">
                            <!-- Rows -->
                        </tbody>
                    </table>
                </div>
                <div class="p-4 border-t border-gray-100 bg-gray-50 text-right text-xs text-gray-500">
                    Total: <span id="dashboardTotalCount">0</span>
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

        // Update UI
        const statsHtml = `
            <div id="total-students-card" class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow">
                <div>
                    <p class="text-sm font-medium text-gray-500">Total Students</p>
                    <h3 class="text-2xl font-bold text-gray-800 mt-1">${totalStudents}</h3>
                </div>
                <div class="bg-blue-50 p-3 rounded-lg">
                    <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                </div>
            </div>

            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500">Total Classes</p>
                    <h3 class="text-2xl font-bold text-gray-800 mt-1">${totalClasses}</h3>
                </div>
                <div class="bg-purple-50 p-3 rounded-lg">
                    <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
            </div>

            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500">Fees Collected</p>
                    <h3 class="text-2xl font-bold text-green-600 mt-1">$${totalFeesCollected.toLocaleString()}</h3>
                    <p class="text-xs text-gray-400 mt-1">out of $${totalFeesIssued.toLocaleString()}</p>
                </div>
                <div class="bg-green-50 p-3 rounded-lg">
                    <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
            </div>

            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-gray-500">Pending Fees</p>
                    <h3 class="text-2xl font-bold text-red-600 mt-1">${unpaidCount}</h3>
                    <p class="text-xs text-gray-400 mt-1">students</p>
                </div>
                <div class="bg-red-50 p-3 rounded-lg">
                    <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
            </div>
        `;

        container.querySelector('.grid').innerHTML = statsHtml;

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

    tbody.innerHTML = students.map(student => `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="p-4">
                <div class="flex items-center">
                    <div class="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold mr-3 text-xs">
                        ${student.name.charAt(0)}
                    </div>
                    <div class="font-medium text-gray-900">${student.name}</div>
                </div>
            </td>
            <td class="p-4 text-gray-600">${student.roll_no}</td>
            <td class="p-4 text-gray-600">${student.class} (${student.section})</td>
            <td class="p-4 text-gray-600">${student.phone || '-'}</td>
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
