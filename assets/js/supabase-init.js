// Initialize Supabase Client
try {
    // Save the library globally for later use (e.g. creating secondary clients)
    window.SupabaseLib = window.supabase;

    if (window.SupabaseLib) {
        const { createClient } = window.SupabaseLib;

        const SUPABASE_URL = 'https://kgwvbetqffvfcbswexre.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZiZXRxZmZ2ZmNic3dleHJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDY1MzUsImV4cCI6MjA4MDMyMjUzNX0.nQCwBiO6NpCTBOFkC4emJ2vPB6JaHj5tO06wUKI89uo';

        window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                storage: window.localStorage,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });

        // Expose config for modules to create secondary clients
        window.SUPABASE_URL = SUPABASE_URL;
        window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

        console.log('✅ Supabase client initialized:', SUPABASE_URL);
    } else {
        console.error('❌ Supabase library not found. CDN might be blocked or failed to load.');
    }
} catch (error) {
    console.error('❌ Error initializing Supabase:', error);
}

// Global Currency Helper
window.currencySymbol = 'PKR'; // Default fallback
window.formatCurrency = (amount) => {
    return `${window.currencySymbol} ${parseFloat(amount || 0).toLocaleString()}`;
};

// Format payment_date (YYYY-MM-DD) as local date to avoid timezone off-by-one in payment history
window.formatPaymentDateLocal = (value, options = { day: '2-digit', month: 'short', year: 'numeric' }) => {
    if (value == null || value === '') return '—';
    const s = String(value).trim();
    const match = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
        const [, y, m, d] = match;
        return new Date(Number(y), Number(m) - 1, Number(d)).toLocaleDateString('en-GB', options);
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-GB', options);
};

// Fetch currency setting immediately (silently fails if settings table doesn't exist)
(async () => {
    try {
        const { data, error } = await window.supabase.from('settings').select('currency').single();
        if (error) {
            // Settings table may not exist - this is normal for new installations
            if (error.code === 'PGRST116' || error.code === '42P01' || error.message.includes('does not exist')) {
                console.log('ℹ️ Settings table not found, using default currency: PKR');
            }
            // Don't log other errors to avoid console noise
            return;
        }
        if (data && data.currency) {
            window.currencySymbol = data.currency;
            console.log('💱 Currency set to:', window.currencySymbol);
        }
    } catch (e) {
        // Silently use default - settings table may not be set up
        console.log('ℹ️ Using default currency: PKR');
    }
})();

