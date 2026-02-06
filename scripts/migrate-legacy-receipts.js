/**
 * Retroactive Receipt Migration
 * Groups legacy fee_payments (receipt_id IS NULL) by collection event and creates
 * one receipt per group. Idempotent: only processes rows without receipt_id.
 *
 * Run: npm run migrate-legacy-receipts   OR   node scripts/migrate-legacy-receipts.js
 * Optional env: SUPABASE_URL, SUPABASE_ANON_KEY (defaults from app config)
 *
 * If RLS blocks writes, run from Supabase Dashboard SQL or use a service role key in env.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kgwvbetqffvfcbswexre.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZiZXRxZmZ2ZmNic3dleHJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDY1MzUsImV4cCI6MjA4MDMyMjUzNX0.nQCwBiO6NpCTBOFkC4emJ2vPB6JaHj5tO06wUKI89uo';

let supabase;

async function getSupabase() {
    if (supabase) return supabase;
    try {
        const { createClient } = require('@supabase/supabase-js');
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return supabase;
    } catch (e) {
        console.error('Install @supabase/supabase-js: npm install @supabase/supabase-js');
        throw e;
    }
}

function minuteKey(createdAt) {
    if (!createdAt) return '';
    const d = new Date(createdAt);
    return d.toISOString ? d.toISOString().slice(0, 16) : '';
}

function familyKey(student) {
    if (!student) return '';
    const s = student;
    return (s.family_code && String(s.family_code).trim()) || (s.father_cnic && String(s.father_cnic).trim()) || (s.id || '');
}

function groupKey(payment, studentMap) {
    const student = studentMap.get(payment.student_id);
    const fk = familyKey(student);
    const date = payment.payment_date || '';
    const method = payment.payment_method && payment.payment_method.trim() ? payment.payment_method.trim() : 'Cash';
    const min = minuteKey(payment.created_at);
    return `${fk}|${date}|${method}|${min}`;
}

function parseReceiptNumber(rn) {
    if (!rn || typeof rn !== 'string') return null;
    const m = rn.match(/^R-(\d{4})-(\d+)$/);
    if (!m) return null;
    return { year: m[1], num: parseInt(m[2], 10) };
}

async function run() {
    console.log('Retroactive receipt migration: starting...');
    const db = await getSupabase();

    // 1. Fetch legacy payments
    const { data: payments, error: payErr } = await db
        .from('fee_payments')
        .select('id, student_id, fee_id, amount_paid, payment_date, payment_method, created_at')
        .is('receipt_id', null)
        .order('created_at', { ascending: true });

    if (payErr) {
        console.error('Failed to fetch fee_payments:', payErr);
        process.exit(1);
    }

    if (!payments || payments.length === 0) {
        console.log('No legacy payments (receipt_id IS NULL). Nothing to migrate.');
        return;
    }

    console.log(`Found ${payments.length} legacy payment(s).`);

    // 2. Fetch students for family key
    const studentIds = [...new Set(payments.map(p => p.student_id))];
    const { data: students, error: stuErr } = await db
        .from('students')
        .select('id, family_code, father_cnic')
        .in('id', studentIds);

    if (stuErr) {
        console.error('Failed to fetch students:', stuErr);
        process.exit(1);
    }

    const studentMap = new Map();
    (students || []).forEach(s => studentMap.set(s.id, s));

    // 3. Group by collection event
    const groupsMap = new Map();
    for (const p of payments) {
        const key = groupKey(p, studentMap);
        if (!groupsMap.has(key)) groupsMap.set(key, []);
        groupsMap.get(key).push(p);
    }

    const groups = Array.from(groupsMap.values());
    console.log(`Grouped into ${groups.length} collection event(s).`);

    // 4. Sort by min(created_at)
    groups.sort((a, b) => {
        const ta = a.length ? new Date(a[0].created_at).getTime() : 0;
        const tb = b.length ? new Date(b[0].created_at).getTime() : 0;
        return ta - tb;
    });

    // 5. Per-year receipt counter from existing receipts
    const { data: existingReceipts, error: recErr } = await db.from('receipts').select('receipt_number');
    if (recErr) {
        console.error('Failed to fetch existing receipts:', recErr);
        process.exit(1);
    }

    const yearMax = {};
    (existingReceipts || []).forEach(r => {
        const parsed = parseReceiptNumber(r.receipt_number);
        if (parsed) {
            const n = yearMax[parsed.year];
            yearMax[parsed.year] = n === undefined ? parsed.num : Math.max(n, parsed.num);
        }
    });

    function nextReceiptNumber(paymentDate) {
        const year = (paymentDate || '').toString().slice(0, 4);
        if (!year) return `R-${new Date().getFullYear()}-0001`;
        const max = yearMax[year];
        const next = (max === undefined ? 0 : max) + 1;
        yearMax[year] = next;
        return `R-${year}-${String(next).padStart(4, '0')}`;
    }

    // 6. For each group: insert receipt, update fee_payments
    let created = 0;
    let updated = 0;
    for (const group of groups) {
        if (group.length === 0) continue;

        const first = group[0];
        const payment_date = first.payment_date;
        const payment_method = (first.payment_method && first.payment_method.trim()) || 'Cash';
        const total_paid = group.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);

        if (total_paid <= 0) {
            console.warn('Skipping group with total_paid <= 0:', first.id);
            continue;
        }

        const receipt_number = nextReceiptNumber(payment_date);

        const { data: receipt, error: insertErr } = await db
            .from('receipts')
            .insert({ receipt_number, payment_date, payment_method, total_paid })
            .select('id')
            .single();

        if (insertErr) {
            console.error('Insert receipt failed:', receipt_number, insertErr);
            continue;
        }
        created++;

        const ids = group.map(p => p.id);
        const { error: updateErr } = await db
            .from('fee_payments')
            .update({ receipt_id: receipt.id })
            .in('id', ids);

        if (updateErr) {
            console.error('Update fee_payments failed for receipt', receipt.id, updateErr);
            continue;
        }
        updated += ids.length;
    }

    console.log(`Created ${created} receipt(s), updated ${updated} fee_payment(s).`);

    // 7. Verification
    const { count: nullCount } = await db.from('fee_payments').select('*', { count: 'exact', head: true }).is('receipt_id', null);
    console.log(`Remaining fee_payments with receipt_id IS NULL: ${nullCount ?? 0}.`);

    // Totals verification: receipt.total_paid should equal sum(fee_payments.amount_paid)
    const { data: allReceipts } = await db.from('receipts').select('id, receipt_number, total_paid');
    const { data: allLinkedPayments } = await db.from('fee_payments').select('receipt_id, amount_paid').not('receipt_id', 'is', null);
    const sumByReceipt = new Map();
    (allLinkedPayments || []).forEach(p => {
        const id = p.receipt_id;
        sumByReceipt.set(id, (sumByReceipt.get(id) || 0) + Number(p.amount_paid || 0));
    });
    let mismatches = 0;
    (allReceipts || []).forEach(r => {
        const sum = sumByReceipt.get(r.id) || 0;
        const total = Number(r.total_paid || 0);
        if (Math.abs(sum - total) > 0.01) {
            console.warn(`Mismatch: ${r.receipt_number} total_paid=${total} sum(fee_payments)=${sum}`);
            mismatches++;
        }
    });
    if (mismatches === 0) console.log('Verification: all receipt totals match sum of fee_payments.');
    else console.warn(`Verification: ${mismatches} receipt(s) have total_paid != sum(fee_payments).`);

    console.log('Migration finished.');
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
