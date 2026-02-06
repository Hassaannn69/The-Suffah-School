// TWO-PHASE FIX FOR ROLL NUMBERS
// Copy this function and replace the fixAllRollNumbers function in students.js

async function fixAllRollNumbers() {
    const confirmMsg = 'This will FORCE UPDATE ALL student roll numbers!\n\n' +
        'Uses TWO-PHASE update to avoid conflicts:\n' +
        'Phase 1: Set all to TEMP-XXX\n' +
        'Phase 2: Set all to ST-XXX\n\n' +
        'Do you want to continue?';

    if (!await confirm(confirmMsg)) {
        return;
    }

    try {
        const tbody = document.getElementById('studentsTableBody');
        const originalContent = tbody.innerHTML;

        // PHASE 1: Set all to temporary roll numbers to avoid unique constraint conflicts
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-blue-600 font-bold">⚙️ PHASE 1: Clearing conflicts...</td></tr>';

        const { data: students, error: fetchError } = await supabase
            .from('students')
            .select('*')
            .order('created_at', { ascending: true });

        if (fetchError) {
            console.error('Fetch error:', fetchError);
            throw fetchError;
        }

        if (!students || students.length === 0) {
            tbody.innerHTML = originalContent;
            alert('No students found.');
            return;
        }

        const totalStudents = students.length;
        console.log(`🔧 TWO-PHASE UPDATE for ${totalStudents} students...`);
        console.log('PHASE 1: Setting temporary roll numbers to avoid conflicts...');

        // PHASE 1: Update all to temporary values (TEMP-XXX) to clear conflicts
        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            const tempRollNo = `TEMP-${(i + 1).toString().padStart(3, '0')}`;

            await supabase
                .from('students')
                .update({ roll_no: tempRollNo })
                .eq('id', student.id);

            if ((i + 1) % 5 === 0 || i === students.length - 1) {
                tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-blue-600 font-bold">⚙️ PHASE 1: ${i + 1}/${totalStudents}</td></tr>`;
            }
        }

        console.log('✅ PHASE 1 Complete! All students have temporary roll numbers.');
        console.log('PHASE 2: Setting final sequential roll numbers...');

        // PHASE 2: Update all to final values (ST-XXX)
        tbody.innerHTML = '<tr><td colspan="5" class="p-4 text-center text-green-600 font-bold">⚙️ PHASE 2: Assigning final roll numbers...</td></tr>';

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            const newRollNo = `ST-${(i + 1).toString().padStart(3, '0')}`;

            console.log(`Setting: ${student.name} → ${newRollNo}`);

            const { error } = await supabase
                .from('students')
                .update({ roll_no: newRollNo })
                .eq('id', student.id);

            if (error) {
                console.error(`❌ FAILED: ${student.name}`, error);
                errorCount++;
            } else {
                console.log(`✅ ${student.name} → ${newRollNo}`);
                successCount++;
            }

            if ((i + 1) % 5 === 0 || i === students.length - 1) {
                tbody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-green-600 font-bold">⚙️ PHASE 2: ${i + 1}/${totalStudents} (✓${successCount} ✗${errorCount})</td></tr>`;
            }
        }

        console.log('✅ PHASE 2 Complete!');
        console.log(`Final result: ${successCount} success, ${errorCount} failed`);

        if (errorCount > 0) {
            alert(`⚠️ Completed:\n\n✓ Fixed: ${successCount}\n✗ Failed: ${errorCount}\n\nCheck console (F12) for details.`);
        } else {
            alert(`✅ SUCCESS!\n\nUpdated ALL ${totalStudents} students!\n\nRoll numbers: ST-001 to ST-${totalStudents.toString().padStart(3, '0')}\n\nAll conflicts resolved!`);
        }

        await fetchStudents();

    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error: ' + error.message);
        await fetchStudents();
    }
}
