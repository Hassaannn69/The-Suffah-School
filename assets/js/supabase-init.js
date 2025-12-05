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
