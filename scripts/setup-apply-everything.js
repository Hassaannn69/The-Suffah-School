/**
 * Apply page – do everything: run migration SQL + create Storage bucket.
 *
 * Set in .env or environment:
 *   SUPABASE_DB_URL    (or DATABASE_URL) – Postgres connection string from Supabase → Project Settings → Database
 *   SUPABASE_SERVICE_ROLE_KEY            – from Supabase → Project Settings → API → service_role
 *   SUPABASE_URL       (optional)       – e.g. https://xxx.supabase.co
 *
 * Run: node scripts/setup-apply-everything.js
 * Or:  npm run setup-apply
 */
try { require('dotenv').config(); } catch (_) {}

const path = require('path');
const fs = require('fs');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kgwvbetqffvfcbswexre.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
const BUCKET_NAME = 'teacher-cvs';

async function runMigration() {
    if (!SUPABASE_DB_URL) {
        console.log('Skipping database migration (SUPABASE_DB_URL or DATABASE_URL not set).');
        console.log('  Run docs/apply_schema_migration.sql manually in Supabase → SQL Editor.');
        return false;
    }
    let pg;
    try {
        pg = require('pg');
    } catch (e) {
        console.log('Skipping database migration (install "pg" to run it from this script): npm install pg');
        console.log('  Run docs/apply_schema_migration.sql manually in Supabase → SQL Editor.');
        return false;
    }
    const sqlPath = path.join(__dirname, '..', 'docs', 'apply_schema_migration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    const client = new pg.Client({ connectionString: SUPABASE_DB_URL });
    try {
        await client.connect();
        await client.query(sql);
        console.log('Migration applied: online_applications columns, teacher_applications table, storage policy.');
        return true;
    } catch (err) {
        console.error('Migration failed:', err.message);
        throw err;
    } finally {
        await client.end();
    }
}

async function createBucket() {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
        console.log('Skipping bucket creation (SUPABASE_SERVICE_ROLE_KEY not set).');
        console.log('  Run: node scripts/setup-apply-storage.js with the key set.');
        return false;
    }
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 5242880,
        allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    });
    if (error) {
        if (error.message && error.message.includes('already exists')) {
            console.log('Bucket "%s" already exists.', BUCKET_NAME);
            return true;
        }
        throw new Error('Bucket creation failed: ' + error.message);
    }
    console.log('Bucket "%s" created.', BUCKET_NAME);
    return true;
}

async function main() {
    console.log('Apply setup: migration + storage bucket...\n');
    const ranMigration = await runMigration();
    const ranBucket = await createBucket();
    console.log('');
    if (ranMigration && ranBucket) {
        console.log('Done. Apply page (student + teacher + CV upload) is ready.');
    } else {
        if (!ranMigration) console.log('Run docs/apply_schema_migration.sql in Supabase SQL Editor if you have not.');
        if (!ranBucket) console.log('Run node scripts/setup-apply-storage.js with SUPABASE_SERVICE_ROLE_KEY.');
    }
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
