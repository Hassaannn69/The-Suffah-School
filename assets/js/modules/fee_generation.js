import { supabase } from '../supabase-client.js';

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
                <div class="p-6 border-b border-gray-100 dark:border-gray-700">
                    <h3 class="text-lg font-bold text-gray-800 dark:text-white">Fee Generation Preview</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1" id="previewSummary"></p>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse">
                        <thead>
                            <tr class="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm uppercase tracking-wider">
                                <th class="p-4 font-semibold">Student</th>
                                <th class="p-4 font-semibold">Class</th>
                                <th class="p-4 font-semibold">Fee Types</th>
                                <th class="p-4 font-semibold">Total Amount</th>
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

function handleTargetChange(e) {
    const container = document.getElementById('classSelectContainer');
    container.classList.toggle('hidden', e.target.value !== 'class');
}

async function handlePreview() {
    const month = document.getElementById('feeMonth').value;
    const target = document.getElementById('generateTarget').value;
    const className = document.getElementById('classSelect').value;

    if (!month) {
        toast.warning('Please select a month');
        return;
    }

    // Show loading
    const previewSection = document.getElementById('previewSection');
    const tbody = document.getElementById('previewTableBody');
    previewSection.classList.remove('hidden');
    tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center">Loading preview...</td></tr>';

    // Fetch students
    let studentsQuery = supabase.from('students').select('id, name, roll_no, class');
    if (target === 'class') {
        studentsQuery = studentsQuery.eq('class', className);
    }

    const { data: students, error: studentsError } = await studentsQuery;

    if (studentsError || !students || students.length === 0) {
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

    // Check for existing fees
    const { data: existingFees } = await supabase
        .from('fees')
        .select('student_id, fee_type')
        .eq('month', month);

    const existingFeeKeys = new Set(
        existingFees?.map(f => `${f.student_id}-${f.fee_type}`) || []
    );

    // Build preview data
    const previewData = students.map(student => {
        const classFees = classFeesMap[student.class] || [];
        const totalAmount = classFees.reduce((sum, cf) => sum + Number(cf.amount), 0);
        const hasAnyExisting = classFees.some(cf =>
            existingFeeKeys.has(`${student.id}-${cf.fee_types.name}`)
        );

        return {
            student,
            classFees,
            totalAmount,
            hasAnyExisting
        };
    });

    // Render preview
    tbody.innerHTML = previewData.map(item => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <td class="p-4">
                <div class="font-medium text-gray-900 dark:text-white">${item.student.name}</div>
                <div class="text-xs text-gray-500">Roll: ${item.student.roll_no}</div>
            </td>
            <td class="p-4">${item.student.class}</td>
            <td class="p-4">
                <div class="text-xs space-y-1">
                    ${item.classFees.map(cf => `<div>${cf.fee_types.name}: $${Number(cf.amount).toFixed(2)}</div>`).join('')}
                </div>
            </td>
            <td class="p-4 font-medium">$${item.totalAmount.toFixed(2)}</td>
            <td class="p-4">
                ${item.hasAnyExisting
            ? '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Some Exist</span>'
            : '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">New</span>'
        }
            </td>
        </tr>
    `).join('');

    const newCount = previewData.filter(p => !p.hasAnyExisting).length;
    const existingCount = previewData.filter(p => p.hasAnyExisting).length;
    document.getElementById('previewSummary').textContent =
        `${previewData.length} students found (${newCount} new, ${existingCount} have some existing fees)`;
}


async function handleGenerate(e) {
    e.preventDefault();

    const month = document.getElementById('feeMonth').value;
    const target = document.getElementById('generateTarget').value;
    const className = document.getElementById('classSelect').value;
    const regenerate = document.getElementById('regenerateExisting').checked;

    if (!month) {
        toast.warning('Please select a month');
        return;
    }

    if (!await confirmDialog.show({
        title: 'Generate Fees',
        message: `Generate fees for ${month}?`,
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
        // Fetch students
        let studentsQuery = supabase.from('students').select('id, name, class');
        if (target === 'class') {
            studentsQuery = studentsQuery.eq('class', className);
        }

        const { data: students, error: studentsError } = await studentsQuery;

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

        // Delete existing if regenerate is checked
        if (regenerate && existingFees && existingFees.length > 0) {
            const { error: deleteError } = await supabase
                .from('fees')
                .delete()
                .eq('month', month);

            if (deleteError) throw deleteError;
            existingFeeKeys.clear(); // Clear the set since we deleted everything
        }

        // Prepare fees to insert
        const feesToInsert = [];
        let skippedCount = 0;

        for (const student of students) {
            const classFees = classFeesMap[student.class] || [];

            if (classFees.length === 0) {
                console.warn(`No fees assigned to class: ${student.class}`);
                continue;
            }

            for (const classFee of classFees) {
                const feeKey = `${student.id}-${classFee.fee_types.name}`;

                // Skip only if this specific fee type already exists for this student
                if (!regenerate && existingFeeKeys.has(feeKey)) {
                    skippedCount++;
                    continue;
                }

                const totalAmount = Number(classFee.amount);

                feesToInsert.push({
                    student_id: student.id,
                    fee_type: classFee.fee_types.name,
                    month: month,
                    amount: totalAmount,
                    final_amount: totalAmount,
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

        // Reset form
        document.getElementById('generateFeeForm').reset();

    } catch (error) {
        console.error('Error generating fees:', error);
        toast.error('Error generating fees: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}
