// Teacher Profile Module
const supabase = window.supabase;
const toast = window.toast || { success: (m) => alert(m), error: (m) => alert(m) };

export async function render(container) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: teacher } = await supabase.from('teachers').select('*').eq('auth_id', user.id).maybeSingle();
    if (!teacher) return;

    container.innerHTML = `
        <div class="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <!-- Header Profile card -->
            <div class="relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden">
                <div class="h-40 bg-gradient-to-r from-primary-600 to-indigo-700"></div>
                <div class="px-8 pb-8">
                    <div class="relative flex justify-between items-end -mt-16">
                        <div class="relative">
                            <div class="w-32 h-32 rounded-3xl bg-white dark:bg-gray-800 p-1 shadow-2xl">
                                <div class="w-full h-full rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                                    <span class="text-4xl font-black text-gray-300">${teacher.name.charAt(0)}</span>
                                </div>
                            </div>
                            <button class="absolute bottom-2 right-2 p-2 bg-primary-600 text-white rounded-xl shadow-lg hover:bg-primary-700 transition-all transform hover:scale-110">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                            </button>
                        </div>
                        <div class="flex gap-3">
                            <button onclick="window.loadModule('dashboard')" class="px-6 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 transition-all">Cancel</button>
                            <button form="profileForm" type="submit" class="px-6 py-2.5 bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-all">Save Changes</button>
                        </div>
                    </div>
                    <div class="mt-6">
                        <h2 class="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">${teacher.name}</h2>
                        <p class="text-sm font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest">${teacher.subject || 'Academic Faculty'}</p>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Left: Info -->
                <div class="lg:col-span-2 space-y-6">
                    <form id="profileForm" class="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
                        <h3 class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest border-l-4 border-primary-500 pl-4 mb-6">Personal Information</h3>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-1">
                                <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email (Read-only)</label>
                                <input type="email" value="${teacher.email || ''}" readonly class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-none rounded-xl text-sm font-medium text-gray-500 cursor-not-allowed">
                            </div>
                            <div class="space-y-1">
                                <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                                <input type="text" name="phone" value="${teacher.phone || ''}" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white">
                            </div>
                        </div>

                        <div class="space-y-1 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <h3 class="text-lg font-black text-gray-900 dark:text-white uppercase tracking-widest border-l-4 border-emerald-500 pl-4 mb-6">Security</h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div class="space-y-1">
                                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">New Password</label>
                                    <input type="password" id="newPass" placeholder="••••••••" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white">
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm Password</label>
                                    <input type="password" id="confirmPass" placeholder="••••••••" class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white">
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <!-- Right: Employment Details -->
                <div class="space-y-6">
                    <div class="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                        <h3 class="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest mb-6">Employment Info</h3>
                        <div class="space-y-6">
                            ${renderInfoRow('Employee ID', teacher.employee_id, 'STF')}
                            ${renderInfoRow('Joining Date', teacher.joining_date ? new Date(teacher.joining_date).toLocaleDateString() : 'N/A', 'CAL')}
                            ${renderInfoRow('Base Salary', 'PKR ' + (teacher.salary?.toLocaleString() || '0'), 'AMT')}
                            ${renderInfoRow('Status', teacher.is_active ? 'Active' : 'Inactive', 'STAT')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const phone = new FormData(e.target).get('phone');
        const newPass = document.getElementById('newPass').value;
        const confirmPass = document.getElementById('confirmPass').value;

        if (newPass && newPass !== confirmPass) {
            toast.error('Passwords do not match');
            return;
        }

        try {
            // Update Auth Password if provided
            if (newPass) {
                const { error: pError } = await supabase.auth.updateUser({ password: newPass });
                if (pError) throw pError;
            }

            // Update Profile
            await supabase.from('teachers').update({ phone }).eq('id', teacher.id);

            toast.success('Profile updated successfully!');
            document.getElementById('newPass').value = '';
            document.getElementById('confirmPass').value = '';
        } catch (err) {
            toast.error(err.message);
        }
    });
}

function renderInfoRow(label, value, tag) {
    return `
        <div>
            <div class="flex items-center justify-between mb-1">
                <span class="text-[9px] font-black text-gray-400 uppercase tracking-widest">${label}</span>
                <span class="text-[8px] font-bold text-primary-500 bg-primary-50 dark:bg-primary-900/30 px-1.5 rounded uppercase">${tag}</span>
            </div>
            <p class="text-sm font-bold text-gray-900 dark:text-white">${value}</p>
        </div>
    `;
}
