/**
 * Creates the Supabase Storage bucket "teacher-cvs" for teacher CV uploads (apply.html).
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in environment.
 *
 * Run: node scripts/setup-apply-storage.js
 * Or:  SUPABASE_SERVICE_ROLE_KEY=your_key node scripts/setup-apply-storage.js
 */
try { require('dotenv').config(); } catch (_) {}

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://kgwvbetqffvfcbswexre.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET_NAME = 'teacher-cvs';

async function main() {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
        console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Set it in .env or as an environment variable.');
        console.error('Get it from: Supabase Dashboard → Project Settings → API → service_role (secret)');
        process.exit(1);
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

    const { data, error } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    });

    if (error) {
        if (error.message && error.message.includes('already exists')) {
            console.log('Bucket "%s" already exists. Nothing to do.', BUCKET_NAME);
            return;
        }
        console.error('Failed to create bucket:', error.message);
        process.exit(1);
    }

    console.log('Bucket "%s" created successfully. CV uploads from apply.html will use it.', BUCKET_NAME);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
