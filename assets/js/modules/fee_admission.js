/**
 * Fee structure application at admission.
 * Used by add_student and admissions when saving a new student.
 * Fetches active version, resolves class, applies discount rules once, returns version id + snapshot for student.
 */

/**
 * Normalize class name for matching (e.g. "Grade 1" vs "Class 1").
 * @param {string} className
 * @returns {string[]} candidates to try (e.g. [original, normalized])
 */
function classMatchCandidates(className) {
    if (!className || typeof className !== 'string') return [];
    const t = className.trim();
    const lower = t.toLowerCase();
    const candidates = [t];
    if (lower.startsWith('grade ')) {
        const num = t.slice(6).trim();
        if (num) candidates.push('Class ' + num, 'Class ' + num + 'st', 'Class ' + num + 'nd', 'Class ' + num + 'rd');
    }
    if (lower.startsWith('class ')) {
        const num = t.slice(6).trim();
        if (num) candidates.push('Grade ' + num);
    }
    return [...new Set(candidates)];
}

/**
 * Apply active fee structure at admission. Compute snapshot and discounts.
 * @param {object} supabase - Supabase client
 * @param {object} opts - { className, familyCode?, isStaffChild?, earlyAdmission? }
 * @returns {Promise<{ versionId: string, snapshotRow: object, tuition_fee: number, admission_fee: number } | null>}
 */
export async function applyFeeStructureAtAdmission(supabase, opts) {
    const { className, familyCode, isStaffChild = false, earlyAdmission = false } = opts || {};
    if (!className || !supabase || typeof supabase.from !== 'function') return null;

    const { data: versions, error: verErr } = await supabase
        .from('fee_structure_versions')
        .select('id')
        .eq('is_active', true)
        .limit(1);
    if (verErr || !versions || versions.length === 0) return null;
    const versionId = versions[0].id;

    const { data: classRows, error: classErr } = await supabase
        .from('fee_structure_classes')
        .select('*')
        .eq('fee_structure_version_id', versionId);
    if (classErr || !classRows || classRows.length === 0) return null;

    const candidates = classMatchCandidates(className);
    const classRow = classRows.find(r => candidates.some(c => (r.class_name || '').trim().toLowerCase() === c.toLowerCase()))
        || classRows.find(r => (r.class_name || '').toLowerCase().includes((className || '').trim().toLowerCase()));
    if (!classRow) return null;

    const { data: rulesRow } = await supabase
        .from('fee_structure_discount_rules')
        .select('*')
        .eq('fee_structure_version_id', versionId)
        .maybeSingle();

    let baseFee = Number(classRow.base_monthly_fee) || 0;
    const admissionFee = Number(classRow.admission_fee) || 0;
    const examFee = Number(classRow.exam_fee) || 0;
    const miscCharges = Number(classRow.misc_charges) || 0;

    let siblingPercent = 0;
    let staffPercent = 0;
    let earlyValue = 0;
    const discountRulesApplied = {};

    if (rulesRow) {
        const siblingPct = Number(rulesRow.sibling_discount_percent) || 0;
        const staffPct = Number(rulesRow.staff_child_discount_percent) || 0;
        const earlyPct = Number(rulesRow.early_admission_discount_percent) || 0;
        const earlyFixed = Number(rulesRow.early_admission_discount_fixed) || 0;

        let isSibling = false;
        if (familyCode && siblingPct > 0) {
            const { count } = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true })
                .eq('family_code', familyCode);
            if (count != null && count >= 1) isSibling = true;
            if (isSibling) {
                siblingPercent = siblingPct;
                baseFee = baseFee * (1 - siblingPct / 100);
                discountRulesApplied.sibling_discount_percent = siblingPct;
            }
        }
        if (isStaffChild && staffPct > 0) {
            staffPercent = staffPct;
            baseFee = baseFee * (1 - staffPct / 100);
            discountRulesApplied.staff_child_discount_percent = staffPct;
        }
        if (earlyAdmission) {
            if (earlyFixed > 0) {
                earlyValue = earlyFixed;
                baseFee = Math.max(0, baseFee - earlyFixed);
                discountRulesApplied.early_admission_discount_fixed = earlyFixed;
            } else if (earlyPct > 0) {
                earlyValue = baseFee * (earlyPct / 100);
                baseFee = baseFee * (1 - earlyPct / 100);
                discountRulesApplied.early_admission_discount_percent = earlyPct;
            }
        }
    }

    const finalBaseMonthly = Math.max(0, Math.round(baseFee * 100) / 100);

    const snapshotRow = {
        fee_structure_version_id: versionId,
        base_fee: Number(classRow.base_monthly_fee) || 0,
        admission_fee: admissionFee,
        exam_fee: examFee,
        misc_charges: miscCharges,
        sibling_discount_percent: siblingPercent,
        staff_discount_percent: staffPercent,
        early_discount_value: earlyValue,
        final_base_monthly: finalBaseMonthly,
        discount_rules_applied: discountRulesApplied
    };

    return {
        versionId,
        snapshotRow,
        tuition_fee: finalBaseMonthly,
        admission_fee: admissionFee
    };
}

/**
 * After inserting a student, save their fee snapshot and optionally update student with tuition_fee/admission_fee.
 * @param {object} supabase
 * @param {string} studentId
 * @param {object} result - from applyFeeStructureAtAdmission
 * @param {object} studentUpdate - optional { tuition_fee, admission_fee } to write back to students row
 */
export async function saveStudentFeeSnapshot(supabase, studentId, result, studentUpdate = null) {
    if (!studentId || !result || !result.snapshotRow) return;
    const row = { ...result.snapshotRow, student_id: studentId };
    await supabase.from('student_fee_snapshots').upsert(row, { onConflict: 'student_id' });
    if (studentUpdate && (studentUpdate.tuition_fee != null || studentUpdate.admission_fee != null)) {
        const update = {};
        if (studentUpdate.tuition_fee != null) update.tuition_fee = studentUpdate.tuition_fee;
        if (studentUpdate.admission_fee != null) update.admission_fee = studentUpdate.admission_fee;
        if (Object.keys(update).length) await supabase.from('students').update(update).eq('id', studentId);
    }
}
