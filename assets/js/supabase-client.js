// Non-module Supabase client - uses window.supabase from CDN
// This replaces the ES6 module version

// Wait for window.supabase to be available from CDN
if (!window.supabase || !window.supabase.createClient) {
    console.error('❌ Supabase CDN not loaded! Make sure <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script> is loaded first.');
    throw new Error('Supabase CDN not available');
}

// HARDCODED CREDENTIALS
const SUPABASE_URL = 'https://kgwvbetqffvfcbswexre.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZiZXRxZmZ2ZmNic3dleHJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDY1MzUsImV4cCI6MjA4MDMyMjUzNX0.nQCwBiO6NpCTBOFkC4emJ2vPB6JaHj5tO06wUKI89uo';

// Create and export the Supabase client
export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

console.log('✅ Supabase client initialized (non-module):', SUPABASE_URL);
