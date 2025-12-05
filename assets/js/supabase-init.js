// Global Supabase client (non-module version)
// This file creates a global supabase client using the CDN-loaded Supabase library

// HARDCODED CREDENTIALS
const SUPABASE_URL = 'https://kgwvbetqffvfcbswexre.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZiZXRxZmZ2ZmNic3dleHJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDY1MzUsImV4cCI6MjA4MDMyMjUzNX0.nQCwBiO6NpCTBOFkC4emJ2vPB6JaHj5tO06wUKI89uo';

// Create the Supabase client using the globally available supabase object from CDN
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

// Expose config for modules to create secondary clients
window.SUPABASE_URL = SUPABASE_URL;
window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

console.log('✅ Supabase client initialized:', SUPABASE_URL);

// Global Currency Helper
window.currencySymbol = 'PKR'; // Default fallback
window.formatCurrency = (amount) => {
    return `${window.currencySymbol} ${parseFloat(amount || 0).toLocaleString()}`;
};

// Fetch currency setting immediately
(async () => {
    try {
        // Wait for supabase to be ready if needed, but here it's synchronous
        const { data } = await window.supabase.from('settings').select('currency').single();
        if (data && data.currency) {
            window.currencySymbol = data.currency;
            console.log('💱 Currency set to:', window.currencySymbol);
        }
    } catch (e) {
        console.warn('Could not fetch currency setting:', e);
    }
})();
