// Initialize Supabase Client (expects UMD build: dist/umd/supabase.js)
try {
    const lib = window.supabase || window.Supabase;
    if (lib && typeof lib.createClient === 'function') {
        const { createClient } = lib;
        window.SupabaseLib = lib;

        const SUPABASE_URL = 'https://kgwvbetqffvfcbswexre.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtnd3ZiZXRxZmZ2ZmNic3dleHJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NDY1MzUsImV4cCI6MjA4MDMyMjUzNX0.nQCwBiO6NpCTBOFkC4emJ2vPB6JaHj5tO06wUKI89uo';

        // Remember me: when false, session lives in sessionStorage (logout on tab close); when true, in localStorage (persist).
        const REMEMBER_ME_KEY = 'suffah_remember_me';
        const authStorage = {
            getItem: function (key) {
                if (key === REMEMBER_ME_KEY) return localStorage.getItem(REMEMBER_ME_KEY);
                const useLocal = localStorage.getItem(REMEMBER_ME_KEY) !== 'false';
                return (useLocal ? localStorage : sessionStorage).getItem(key);
            },
            setItem: function (key, value) {
                if (key === REMEMBER_ME_KEY) { localStorage.setItem(key, value); return; }
                const useLocal = localStorage.getItem(REMEMBER_ME_KEY) !== 'false';
                (useLocal ? localStorage : sessionStorage).setItem(key, value);
            },
            removeItem: function (key) {
                localStorage.removeItem(key);
                sessionStorage.removeItem(key);
            }
        };

        window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                persistSession: true,
                storage: authStorage,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });

        window.SUPABASE_URL = SUPABASE_URL;
        window.SUPABASE_ANON_KEY = SUPABASE_ANON_KEY;

        console.log('✅ Supabase client initialized:', SUPABASE_URL);
    } else {
        console.error('❌ Supabase library not found. Load the UMD build: .../supabase-js@2/dist/umd/supabase.js');
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

// Fetch currency setting only when client exists (silently fails if settings table doesn't exist)
(async () => {
    if (!window.supabase || typeof window.supabase.from !== 'function') return;
    try {
        const { data, error } = await window.supabase.from('settings').select('currency').single();
        if (error) {
            if (error.code === 'PGRST116' || error.code === '42P01' || error.message.includes('does not exist')) {
                console.log('ℹ️ Settings table not found, using default currency: PKR');
            }
            return;
        }
        if (data && data.currency) {
            window.currencySymbol = data.currency;
            console.log('💱 Currency set to:', window.currencySymbol);
        }
    } catch (e) {
        console.log('ℹ️ Using default currency: PKR');
    }
})();

