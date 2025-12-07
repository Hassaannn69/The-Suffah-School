// Use global Supabase client for production compatibility
const supabase = window.supabase || (() => {
    console.error('Supabase client not found on window object');
    throw new Error('Supabase client not initialized');
})();

export async function render(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Header -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">Generate Monthly Fees</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">Auto-generate fees for students based on their class fee structure</p>
            </div>

            <!-- Generation Form -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <form id="generateFeeForm" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Month Selection -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Select Month
                            </label>
                            <input type="month" id="feeMonth" required 
                                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        </div>

                        <!-- Target Selection -->
                        <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Generate For
                            </label>
                            <select id="generateTarget" 
                                class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                <option value="all">All Students</option>
                                <option value="class">Specific Class</option>
                                <option value="student">Specific Student</option>
                                <option value="family">Specific Family</option>
                            </select>
                        </div>
                    </div>

                    <!-- Class Selection (Hidden by default) -->
                    <div id="classSelectContainer" class="hidden">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Select Class
                        </label>
                        <select id="classSelect" 
                            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            <!-- Populated dynamically -->
                        </select>
                    </div>

                    <!-- Student Search (Hidden by default) -->
                    <div id="studentSearchContainer" class="hidden">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Search Student (by Name or Roll No)
                        </label>
                        <input type="text" id="studentSearch" placeholder="Type to search..." 
                            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <div id="studentSearchResults" class="mt-2 max-h-48 overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hidden"></div>
                        <input type="hidden" id="selectedStudentId">
                        <div id="selectedStudentDisplay" class="mt-2 hidden p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
                            <span class="text-sm text-green-700 dark:text-green-300">Selected: <strong id="selectedStudentName"></strong></span>
                            <button type="button" id="clearStudentBtn" class="ml-2 text-red-500 text-xs">[Clear]</button>
                        </div>
                    </div>

                    <!-- Family Code Search (Hidden by default) -->
                    <div id="familySearchContainer" class="hidden">
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Enter Family Code
                        </label>
                        <input type="text" id="familyCodeInput" placeholder="e.g., FAM001" 
                            class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <button type="button" id="searchFamilyBtn" class="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Find Family Members</button>
                        <div id="familyMembersDisplay" class="mt-2 hidden"></div>
                    </div>

                    <!-- Manual Fee Amount (for students without class fee structure) -->
                    <div class="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <label class="block text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                            Manual Fee Amount (for classes without fee structure)
                        </label>
                        <div class="flex items-center space-x-4">
                            <input type="text" id="manualFeeType" placeholder="Fee Type (e.g., Tuition Fee)" 
                                class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                            <input type="number" id="manualFeeAmount" placeholder="Amount" min="0" step="0.01"
                                class="w-32 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        </div>
                        <p class="text-xs text-yellow-600 dark:text-yellow-400 mt-1">Use this for students whose class doesn't have a fee structure defined</p>
                    </div>

                    <!-- Regenerate Option -->
                    <div class="flex items-center">
                        <input type="checkbox" id="regenerateExisting" 
                            class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                        <label for="regenerateExisting" class="ml-2 text-sm text-gray-700 dark:text-gray-300">
                            Regenerate fees if already generated for this month
                        </label>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex justify-end space-x-3">
                        <button type="button" id="previewBtn" 
                            class="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Preview
                        </button>
                        <button type="submit" 
                            class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Generate Fees
                        </button>
                    </div>
                </form>
            </div>

            <!-- Preview Section -->
            <div id="previewSection" class="hidden bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div class="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h3 class="text-lg font-bold text-gray-800 dark:text-white">Fee Generation Preview</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1" id="previewSummary"></p>
                    </div>
                    <div class="flex items-center space-x-2">
                        <label class="text-sm text-gray-600 dark:text-gray-300">Select:</label>
                        <button type="button" id="selectAllBtn" class="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">All</button>
                        <button type="button" id="selectNoneBtn" class="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200">None</button>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm uppercase tracking-wider">
                                <th class="p-4 font-semibold w-12">
                                    <input type="checkbox" id="selectAllCheckbox" class="w-4 h-4 text-indigo-600 rounded">
                                </th>
                                <th class="p-4 font-semibold">Student</th>
                                <th class="p-4 font-semibold">Class</th>
                                <th class="p-4 font-semibold">Fee Breakdown</th>
                                <th class="p-4 font-semibold">Total Assigned</th>
                                <th class="p-4 font-semibold">Status</th>
                            </tr>
                        </thead>
                        <tbody id="previewTableBody" class="text-gray-700 dark:text-gray-300 text-sm divide-y divide-gray-100 dark:divide-gray-700">
                            <!-- Populated dynamically -->
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;

    // Event Listeners
    document.getElementById('generateTarget').addEventListener('change', handleTargetChange);
    document.getElementById('previewBtn').addEventListener('click', handlePreview);
    document.getElementById('generateFeeForm').addEventListener('submit', handleGenerate);

    // Student search listeners
    document.getElementById('studentSearch').addEventListener('input', debounce(handleStudentSearch, 300));
    document.getElementById('clearStudentBtn').addEventListener('click', clearSelectedStudent);

    // Family search listener
    document.getElementById('searchFamilyBtn').addEventListener('click', handleFamilySearch);

    // Selection listeners (will be active after preview loads)
    document.getElementById('selectAllBtn').addEventListener('click', () => {
        document.querySelectorAll('.student-checkbox').forEach(cb => cb.checked = true);
        document.getElementById('selectAllCheckbox').checked = true;
    });
    document.getElementById('selectNoneBtn').addEventListener('click', () => {
        document.querySelectorAll('.student-checkbox').forEach(cb => cb.checked = false);
        document.getElementById('selectAllCheckbox').checked = false;
    });
    document.getElementById('selectAllCheckbox').addEventListener('change', (e) => {
        document.querySelectorAll('.student-checkbox').forEach(cb => cb.checked = e.target.checked);
    });

    // Load classes
    await loadClasses();
}

async function loadClasses() {
    const select = document.getElementById('classSelect');
    const { data, error } = await supabase.from('classes').select('class_name').order('class_name');

    if (data) {
        select.innerHTML = data.map(c => `<option value="${c.class_name}">${c.class_name}</option>`).join('');
    }
}

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

function handleTargetChange(e) {
    const value = e.target.value;

    // Hide all optional containers
    document.getElementById('classSelectContainer').classList.add('hidden');
    document.getElementById('studentSearchContainer').classList.add('hidden');
    document.getElementById('familySearchContainer').classList.add('hidden');

    // Show the relevant one
    if (value === 'class') {
        document.getElementById('classSelectContainer').classList.remove('hidden');
    } else if (value === 'student') {
        document.getElementById('studentSearchContainer').classList.remove('hidden');
    } else if (value === 'family') {
        document.getElementById('familySearchContainer').classList.remove('hidden');
    }
}

// Store for selected student/family members
let selectedStudent = null;
let familyStudents = [];

async function handleStudentSearch(e) {
    const term = e.target.value.trim().toLowerCase();
    const resultsContainer = document.getElementById('studentSearchResults');

    if (term.length < 2) {
        resultsContainer.classList.add('hidden');
        return;
    }

    const { data: students, error } = await supabase
        .from('students')
        .select('id, name, roll_no, class, section')
        .or(`name.ilike.%${term}%,roll_no.ilike.%${term}%`)
        .limit(10);

    if (error || !students || students.length === 0) {
        resultsContainer.innerHTML = '<div class="p-3 text-gray-500 text-sm">No students found</div>';
        resultsContainer.classList.remove('hidden');
        return;
    }

    resultsContainer.innerHTML = students.map(s => `
        <div class="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0" 
             onclick="window.selectStudent('${s.id}', '${s.name}', '${s.roll_no}', '${s.class}')">
            <div class="font-medium text-gray-900 dark:text-white">${s.name}</div>
            <div class="text-xs text-gray-500">${s.roll_no} - ${s.class} ${s.section}</div>
        </div>
    `).join('');
    resultsContainer.classList.remove('hidden');
}

window.selectStudent = function (id, name, rollNo, className) {
    selectedStudent = { id, name, roll_no: rollNo, class: className };
    document.getElementById('selectedStudentId').value = id;
    document.getElementById('selectedStudentName').textContent = `${name} (${rollNo})`;
    document.getElementById('selectedStudentDisplay').classList.remove('hidden');
    document.getElementById('studentSearchResults').classList.add('hidden');
    document.getElementById('studentSearch').value = '';
};

function clearSelectedStudent() {
    selectedStudent = null;
    document.getElementById('selectedStudentId').value = '';
    document.getElementById('selectedStudentDisplay').classList.add('hidden');
}

async function handleFamilySearch() {
    const familyCode = document.getElementById('familyCodeInput').value.trim();
    const displayContainer = document.getElementById('familyMembersDisplay');

    if (!familyCode) {
        toast.warning('Please enter a family code');
        return;
    }

    const { data: students, error } = await supabase
        .from('students')
        .select('id, name, roll_no, class, section')
        .eq('family_code', familyCode);

    if (error || !students || students.length === 0) {
        displayContainer.innerHTML = '<div class="p-3 text-red-500 text-sm">No students found with this family code</div>';
        displayContainer.classList.remove('hidden');
        familyStudents = [];
        return;
    }

    familyStudents = students;
    displayContainer.innerHTML = `
        <div class="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg">
            <p class="text-sm font-medium text-green-700 dark:text-green-300 mb-2">Found ${students.length} family members:</p>
            <ul class="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                ${students.map(s => `<li>• ${s.name} (${s.roll_no}) - ${s.class}</li>`).join('')}
            </ul>
        </div>
    `;
    displayContainer.classList.remove('hidden');
}

async function handlePreview() {
    const month = document.getElementById('feeMonth').value;
    const target = document.getElementById('generateTarget').value;
    const className = document.getElementById('classSelect').value;

    if (!month) {
        toast.warning('Please select a month');
        return;
    }

    // Validate target-specific requirements
    if (target === 'student' && !selectedStudent) {
        toast.warning('Please search and select a student');
        return;
    }
    if (target === 'family' && familyStudents.length === 0) {
        toast.warning('Please search for a family first');
        return;
    }

    // Show loading
    const previewSection = document.getElementById('previewSection');
    const tbody = document.getElementById('previewTableBody');
    previewSection.classList.remove('hidden');
    tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">Loading preview...</td></tr>';

    // Fetch students based on target
    let students = [];

    if (target === 'student') {
        // Single student
        students = [selectedStudent];
    } else if (target === 'family') {
        // Family members
        students = familyStudents;
    } else {
        // All or specific class
        let studentsQuery = supabase.from('students').select('id, name, roll_no, class');
        if (target === 'class') {
            studentsQuery = studentsQuery.eq('class', className);
        }
        const { data, error: studentsError } = await studentsQuery;
        if (studentsError) {
            tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-red-400">Error loading students</td></tr>';
            return;
        }
        students = data || [];
    }

    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-gray-400">No students found</td></tr>';
        return;
    }

    // Fetch all classes with their fees
    const { data: classes } = await supabase
        .from('classes')
        .select(`
            id,
            class_name,
            class_fees (
                amount,
                fee_types (name)
            )
        `);

    const classFeesMap = {};
    classes.forEach(cls => {
        classFeesMap[cls.class_name] = cls.class_fees || [];
    });

    // Get manual fee info
    const manualFeeType = document.getElementById('manualFeeType').value.trim() || 'Monthly Fee';
    const manualFeeAmount = parseFloat(document.getElementById('manualFeeAmount').value) || 0;

    // Fetch existing/historical fees for these students
    const studentIds = students.map(s => s.id);
    const { data: allStudentFees } = await supabase
        .from('fees')
        .select('*')
        .in('student_id', studentIds)
        .order('month', { ascending: false });

    // Group fees by student
    const studentFeesMap = {};
    const existingFeeKeys = new Set(); // For duplicate checking in current month

    allStudentFees?.forEach(fee => {
        if (!studentFeesMap[fee.student_id]) studentFeesMap[fee.student_id] = [];
        studentFeesMap[fee.student_id].push(fee);

        if (fee.month === month) {
            existingFeeKeys.add(`${fee.student_id}-${fee.fee_type}`);
        }
    });

    // Helper to format month
    const formatMonth = (m) => {
        if (!m) return '';
        const d = new Date(m + "-01");
        return isNaN(d) ? m : d.toLocaleString('default', { month: 'short', year: 'numeric' });
    };

    // Build preview data
    const previewData = students.map(student => {
        let classFees = classFeesMap[student.class] || [];
        const studentExistingFees = studentFeesMap[student.id] || [];

        let newFees = [];
        let newTotal = 0;

        // Determine new fees to be generated
        if (classFees.length > 0) {
            // Use Class Fee Structure
            classFees.forEach(cf => {
                const isDuplicate = existingFeeKeys.has(`${student.id}-${cf.fee_types.name}`);
                if (!isDuplicate) {
                    newFees.push({
                        name: cf.fee_types.name,
                        amount: Number(cf.amount),
                        month: month,
                        type: 'new'
                    });
                    newTotal += Number(cf.amount);
                }
            });
        } else if (manualFeeAmount > 0) {
            // Use Manual Fee
            const isDuplicate = existingFeeKeys.has(`${student.id}-${manualFeeType}`);
            if (!isDuplicate) {
                newFees.push({
                    name: manualFeeType,
                    amount: manualFeeAmount,
                    month: month,
                    type: 'new'
                });
                newTotal += manualFeeAmount;
            }
        }

        // Calculate Grand Total (All assigned fees ever)
        // Adjust: "Calculates the sum of all assigned fees"
        // This includes existing fees + new fees to be generated
        const existingTotal = studentExistingFees.reduce((sum, f) => sum + Number(f.final_amount), 0);
        const grandTotal = existingTotal + newTotal;

        const hasAnyExisting = studentExistingFees.some(f => f.month === month);

        return {
            student,
            newFees,
            existingFees: studentExistingFees,
            classFeesLength: classFees.length,
            grandTotal,
            hasAnyExisting
        };
    });

    // Render preview with checkboxes
    tbody.innerHTML = previewData.map(item => {
        // Format Fee List
        // Combined list: New first (Green), then Existing (Gray)

        const newFeesHtml = item.newFees.map(f =>
            `<div class="text-green-600 dark:text-green-400 font-medium">+ ${f.name} (${formatMonth(f.month)})</div>`
        ).join('');

        const existingFeesHtml = item.existingFees.map(f =>
            `<div class="text-gray-500 dark:text-gray-400 text-xs">${f.fee_type} (${formatMonth(f.month)})</div>`
        ).join('');

        return `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
            <td class="p-4 align-top">
                <input type="checkbox" class="student-checkbox w-4 h-4 text-indigo-600 rounded" 
                    data-student-id="${item.student.id}" 
                    data-student-class="${item.student.class}"
                    ${!item.hasAnyExisting ? 'checked' : ''}>
            </td>
            <td class="p-4 align-top">
                <div class="font-medium text-gray-900 dark:text-white">${item.student.name}</div>
                <div class="text-xs text-gray-500">Roll: ${item.student.roll_no}</div>
            </td>
            <td class="p-4 align-top">${item.student.class}</td>
            <td class="p-4 align-top">
                <div class="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                    ${newFeesHtml}
                    ${item.newFees.length === 0 && item.classFeesLength === 0 && item.existingFees.length === 0 ? '<span class="text-yellow-500 text-xs">No fee structure & no manual fee</span>' : ''}
                    ${existingFeesHtml}
                    ${item.existingFees.length === 0 && item.newFees.length === 0 ? '<span class="text-gray-400 text-xs">-</span>' : ''}
                </div>
            </td>
            <td class="p-4 align-top font-bold text-gray-800 dark:text-gray-200">
                $${item.grandTotal.toFixed(2)}
            </td>
            <td class="p-4 align-top">
                ${item.hasAnyExisting
                ? '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Some Exist</span>'
                : '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">New</span>'
            }
            </td>
        </tr>
    `}).join('');

    const newCount = previewData.filter(p => !p.hasAnyExisting).length;
    const existingCount = previewData.filter(p => p.hasAnyExisting).length;
    const selectedCount = document.querySelectorAll('.student-checkbox:checked').length;
    document.getElementById('previewSummary').textContent =
        `${previewData.length} students found (${selectedCount} selected, ${newCount} new, ${existingCount} have existing fees)`;
}


async function handleGenerate(e) {
    e.preventDefault();

    const month = document.getElementById('feeMonth').value;
    const regenerate = document.getElementById('regenerateExisting').checked;

    if (!month) {
        toast.warning('Please select a month');
        return;
    }

    // Get selected students from checkboxes
    const selectedCheckboxes = document.querySelectorAll('.student-checkbox:checked');
    if (selectedCheckboxes.length === 0) {
        toast.warning('Please select at least one student');
        return;
    }

    // Get selected student IDs
    const selectedStudentIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.studentId);

    // Get manual fee info
    const manualFeeType = document.getElementById('manualFeeType').value.trim() || 'Monthly Fee';
    const manualFeeAmount = parseFloat(document.getElementById('manualFeeAmount').value) || 0;

    if (!await confirmDialog.show({
        title: 'Generate Fees',
        message: `Generate fees for ${selectedStudentIds.length} student(s) for ${month}?`,
        confirmText: 'Generate',
        cancelText: 'Cancel',
        type: 'info'
    })) {
        return;
    }

    // Show loading
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>';

    try {
        // Fetch only the selected students
        const { data: students, error: studentsError } = await supabase
            .from('students')
            .select('id, name, class')
            .in('id', selectedStudentIds);

        if (studentsError) throw studentsError;
        if (!students || students.length === 0) {
            toast.warning('No students found');
            btn.disabled = false;
            btn.innerHTML = originalText;
            return;
        }

        // Fetch all classes with their fees
        const { data: classes } = await supabase
            .from('classes')
            .select(`
                id,
                class_name,
                class_fees (
                    amount,
                    fee_types (id, name)
                )
            `);

        const classFeesMap = {};
        classes.forEach(cls => {
            classFeesMap[cls.class_name] = cls.class_fees || [];
        });

        // Check existing fees - need to check by student AND fee type
        const { data: existingFees } = await supabase
            .from('fees')
            .select('student_id, fee_type')
            .eq('month', month);

        // Create a set of "studentId-feeType" combinations that already exist
        const existingFeeKeys = new Set(
            existingFees?.map(f => `${f.student_id}-${f.fee_type}`) || []
        );

        // Delete existing ONLY for selected students if regenerate is checked
        if (regenerate && selectedStudentIds.length > 0) {
            const { error: deleteError } = await supabase
                .from('fees')
                .delete()
                .eq('month', month)
                .in('student_id', selectedStudentIds);

            if (deleteError) throw deleteError;
        }

        // Prepare fees to insert
        const feesToInsert = [];
        let skippedCount = 0;

        for (const student of students) {
            const classFees = classFeesMap[student.class] || [];
            let feesForInitialProcessing = [];

            // Logic: Use Class Fees if available, otherwise check for Manual Fee
            if (classFees.length > 0) {
                feesForInitialProcessing = classFees.map(cf => ({
                    fee_type: cf.fee_types.name,
                    amount: Number(cf.amount)
                }));
            } else if (manualFeeAmount > 0) {
                feesForInitialProcessing = [{
                    fee_type: manualFeeType,
                    amount: manualFeeAmount
                }];
            }

            if (feesForInitialProcessing.length === 0) {
                console.warn(`No fees to generate for student ${student.roll_no} (Class: ${student.class})`);
                continue;
            }

            for (const fee of feesForInitialProcessing) {
                const feeKey = `${student.id}-${fee.fee_type}`;

                // Skip only if this specific fee type already exists for this student
                // Logic: If regenerate is TRUE, existingFeeKeys acts as a filter for what WAS fetched before delete?
                // Actually, if regenerate is TRUE, we deleted scope-specific fees, so we should allow insertion.
                // existingFeeKeys was built from `select * from fees where month...`
                // If we deleted them, we should ignore existingFeeKeys check if regenerate is true.

                if (!regenerate && existingFeeKeys.has(feeKey)) {
                    skippedCount++;
                    continue;
                }

                feesToInsert.push({
                    student_id: student.id,
                    fee_type: fee.fee_type,
                    month: month,
                    amount: fee.amount,
                    final_amount: fee.amount,
                    paid_amount: 0,
                    status: 'unpaid',
                    generated_at: new Date().toISOString()
                });
            }
        }

        if (feesToInsert.length === 0) {
            toast.info('No fees to generate. All students already have fees for this month.');
            btn.disabled = false;
            btn.innerHTML = originalText;
            return;
        }

        // Insert fees
        const { error: insertError } = await supabase
            .from('fees')
            .insert(feesToInsert);

        if (insertError) throw insertError;

        const uniqueStudents = new Set(feesToInsert.map(f => f.student_id)).size;
        toast.success(`Successfully generated ${feesToInsert.length} fee records for ${uniqueStudents} students!`);

        // Refresh the preview to show updated status (don't reset form)
        await handlePreview();

    } catch (error) {
        console.error('Error generating fees:', error);
        toast.error('Error generating fees: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}
