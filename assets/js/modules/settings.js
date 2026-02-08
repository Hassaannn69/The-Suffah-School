// Use global Supabase client for production compatibility
const supabase = window.supabase || (() => {
    console.error('Supabase client not found on window object');
    throw new Error('Supabase client not initialized');
})();

export async function render(container) {
    container.innerHTML = `
        <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden max-w-3xl mx-auto transition-colors duration-200">
            <div class="p-6 border-b border-gray-200 dark:border-gray-800">
                <h2 class="text-xl font-bold text-gray-900 dark:text-white">Settings</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your application preferences and configurations.</p>
            </div>
            
            <form id="settingsForm" class="p-6 space-y-8">
                <input type="hidden" id="settingsId">
                
                <!-- School Profile (Admin Only) -->
                <div id="schoolProfileSection" class="space-y-6 hidden">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">School Profile</h3>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">School Name</label>
                        <input type="text" id="schoolName" class="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white placeholder-gray-500 transition-colors">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo URL</label>
                        <input type="url" id="logoUrl" placeholder="https://example.com/logo.png" class="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white placeholder-gray-500 transition-colors">
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
                        <select id="currency" class="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white transition-colors">
                            <option value="PKR">PKR (Rs)</option>
                            <option value="USD">USD ($)</option>
                            <option value="INR">INR (₹)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                            <option value="AED">AED (Dh)</option>
                            <option value="SAR">SAR (SR)</option>
                        </select>
                    </div>

                    <div class="pt-2">
                        <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Default Fee Structure</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Tuition Fee</label>
                                <input type="number" id="defaultTuition" placeholder="0" class="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white placeholder-gray-500 transition-colors">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Transport Fee</label>
                                <input type="number" id="defaultTransport" placeholder="0" class="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 dark:text-white placeholder-gray-500 transition-colors">
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Sidebar Access Control (All Roles) -->
                <div class="space-y-6">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">Sidebar Access Control</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label class="relative flex items-start p-4 cursor-pointer rounded-xl border-2 border-gray-100 dark:border-gray-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all group has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50/30 dark:has-[:checked]:bg-indigo-900/10">
                            <input type="radio" name="sidebar_mode" value="hover" class="mt-1 app-checkbox-circular text-indigo-600 focus:ring-indigo-500 h-4 w-4">
                            <div class="ml-3">
                                <span class="block text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">Hover to Open</span>
                                <span class="block text-xs text-gray-500 dark:text-gray-400 mt-1">Sidebar automatically expands when you hover over it (Desktop only).</span>
                            </div>
                        </label>

                        <label class="relative flex items-start p-4 cursor-pointer rounded-xl border-2 border-gray-100 dark:border-gray-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all group has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50/30 dark:has-[:checked]:bg-indigo-900/10">
                            <input type="radio" name="sidebar_mode" value="toggle" checked class="mt-1 app-checkbox-circular text-indigo-600 focus:ring-indigo-500 h-4 w-4">
                            <div class="ml-3">
                                <span class="block text-sm font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 transition-colors">Toggle Button</span>
                                <span class="block text-xs text-gray-500 dark:text-gray-400 mt-1">Sidebar only opens and closes via the menu button.</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div class="flex justify-end pt-4">
                    <button type="submit" id="saveBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-indigo-500/20 active:scale-95">
                        Save Preferences
                    </button>
                </div>
            </form>
        </div>
    `;

    // Role-based visibility logic
    const currentUser = (await supabase.auth.getUser()).data.user;
    const role = currentUser?.user_metadata?.role || 'student';
    if (role === 'admin') {
        const profileSec = document.getElementById('schoolProfileSection');
        if (profileSec) profileSec.classList.remove('hidden');
    }

    document.getElementById('settingsForm').addEventListener('submit', handleSave);
    await fetchSettings();
}

async function fetchSettings() {
    const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1)
        .single();

    if (error && error.code !== 'PGRST116') { // Ignore no rows error
        console.error('Error fetching settings:', error);
        return;
    }

    if (data) {
        document.getElementById('settingsId').value = data.id;
        if (document.getElementById('schoolName')) {
            document.getElementById('schoolName').value = data.school_name || '';
            document.getElementById('logoUrl').value = data.logo_url || '';
            document.getElementById('currency').value = data.currency || 'PKR';
        }

        if (data.default_fee_structure && document.getElementById('defaultTuition')) {
            const setOrPlaceholder = (v) => (v != null && Number(v) !== 0 ? v : '');
            document.getElementById('defaultTuition').value = setOrPlaceholder(data.default_fee_structure.tuition);
            document.getElementById('defaultTransport').value = setOrPlaceholder(data.default_fee_structure.transport);
        }

        // Load sidebar mode from localStorage (fallback to toggle)
        const savedMode = localStorage.getItem('suffah_sidebar_mode') || 'toggle';
        const radio = document.querySelector(`input[name="sidebar_mode"][value="${savedMode}"]`);
        if (radio) radio.checked = true;
    }
}

async function handleSave(e) {
    e.preventDefault();
    const btn = document.getElementById('saveBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const id = document.getElementById('settingsId').value;
    const schoolNameInput = document.getElementById('schoolName');
    const sidebarMode = document.querySelector('input[name="sidebar_mode"]:checked')?.value || 'toggle';

    const payload = {};

    // Only include school profile if current user is admin (and thus inputs exist)
    if (schoolNameInput) {
        payload.school_name = schoolNameInput.value;
        payload.logo_url = document.getElementById('logoUrl').value;
        payload.currency = document.getElementById('currency').value;
        payload.default_fee_structure = {
            tuition: Number(document.getElementById('defaultTuition').value) || 0,
            transport: Number(document.getElementById('defaultTransport').value) || 0
        };
    }

    let error;
    if (id) {
        const res = await supabase.from('settings').update(payload).eq('id', id);
        error = res.error;
    } else {
        const res = await supabase.from('settings').insert([payload]);
        error = res.error;
    }

    if (error) {
        alert('Error saving settings: ' + error.message);
    } else {
        // Update global currency immediately
        if (payload.currency) window.currencySymbol = payload.currency;

        // Persist sidebar mode to localStorage
        localStorage.setItem('suffah_sidebar_mode', sidebarMode);
        if (window.updateSidebarMode) window.updateSidebarMode(sidebarMode);

        alert('Settings saved successfully!');
    }

    btn.disabled = false;
    btn.textContent = 'Save Changes';
}
