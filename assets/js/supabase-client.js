
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// HARDCODED CREDENTIALS FOR INFINITYFREE DEPLOYMENT
// Do not use process.env or import.meta.env here
const SUPABASE_URL = 'https://kgwvbetqffvfcbswexre.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZiZXRxZmZ2ZmNic3dleHJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDY1MzUsImV4cCI6MjA4MDMyMjUzNX0.nQCwBiO6NpCTBOFkC4emJ2vPB6JaHj5tO06wUKI89uo';

// Create and export the Supabase client
// We use 'persistSession: true' to ensure the user stays logged in across pages
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

console.log('Supabase client initialized with hardcoded URL:', SUPABASE_URL);
