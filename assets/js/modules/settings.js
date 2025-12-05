import { supabase } from '../supabase-client.js';

export async function render(container) {
    container.innerHTML = `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden max-w-3xl mx-auto">
            <div class="p-6 border-b border-gray-100">
                <h2 class="text-xl font-bold text-gray-800">School Settings</h2>
                <p class="text-sm text-gray-500 mt-1">Manage your school profile and default configurations.</p>
            </div>
            
            <form id="settingsForm" class="p-6 space-y-6">
                <input type="hidden" id="settingsId">
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                    <input type="text" id="schoolName" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                    <input type="url" id="logoUrl" placeholder="https://example.com/logo.png" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                    <p class="text-xs text-gray-400 mt-1">Direct link to your school logo image.</p>
                </div>

                <div class="border-t border-gray-100 pt-6">
                    <h3 class="text-lg font-medium text-gray-800 mb-4">Default Fee Structure</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Default Tuition Fee</label>
                            <input type="number" id="defaultTuition" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Default Transport Fee</label>
                            <input type="number" id="defaultTransport" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900">
                        </div>
                    </div>
                </div>

                <div class="flex justify-end pt-4">
                    <button type="submit" id="saveBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-200">
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    `;

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
        document.getElementById('schoolName').value = data.school_name || '';
        document.getElementById('logoUrl').value = data.logo_url || '';

        if (data.default_fee_structure) {
            document.getElementById('defaultTuition').value = data.default_fee_structure.tuition || 0;
            document.getElementById('defaultTransport').value = data.default_fee_structure.transport || 0;
        }
    }
}

async function handleSave(e) {
    e.preventDefault();
    const btn = document.getElementById('saveBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    const id = document.getElementById('settingsId').value;
    const schoolName = document.getElementById('schoolName').value;
    const logoUrl = document.getElementById('logoUrl').value;
    const defaultTuition = document.getElementById('defaultTuition').value;
    const defaultTransport = document.getElementById('defaultTransport').value;

    const payload = {
        school_name: schoolName,
        logo_url: logoUrl,
        default_fee_structure: {
            tuition: defaultTuition,
            transport: defaultTransport
        }
    };

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
        alert('Settings saved successfully!');
    }

    btn.disabled = false;
    btn.textContent = 'Save Changes';
}
