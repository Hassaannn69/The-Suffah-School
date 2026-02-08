// Teacher Timetable Module (Read-only)
const supabase = window.supabase;

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [
    { number: 1, start: '08:00', end: '08:45' },
    { number: 2, start: '08:45', end: '09:30' },
    { number: 3, start: '09:30', end: '10:15' },
    { number: 4, start: '10:30', end: '11:15' },
    { number: 5, start: '11:15', end: '12:00' },
    { number: 6, start: '12:00', end: '12:45' },
    { number: 7, start: '02:00', end: '02:45' },
    { number: 8, start: '02:45', end: '03:30' }
];

export async function render(container) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: teacher } = await supabase.from('teachers').select('*').eq('auth_id', user.id).maybeSingle();
    if (!teacher) return;

    const { data: timetable } = await supabase
        .from('timetable')
        .select('*, classes(class_name)')
        .eq('teacher_id', teacher.id);

    container.innerHTML = `
        <div class="space-y-6 animate-in fade-in duration-500">
            <div class="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-8 shadow-sm">
                <h2 class="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">My Weekly Schedule</h2>
                <p class="text-gray-500 mt-1 italic">Filtered view of your assigned periods and classes.</p>
            </div>

            <div class="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                <div class="overflow-x-auto">
                    <table class="w-full min-w-[800px]">
                        <thead>
                            <tr class="bg-gray-50 dark:bg-gray-800/50">
                                <th class="p-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700 w-32">Period</th>
                                ${DAYS.map(day => `<th class="p-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700">${day}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                            ${PERIODS.map(period => `
                                <tr class="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                                    <td class="p-4 bg-gray-50/30 dark:bg-gray-800/10 border-r border-gray-100 dark:border-gray-800">
                                        <div class="font-black text-gray-900 dark:text-white text-xs">PERIOD ${period.number}</div>
                                        <div class="text-[10px] text-gray-400 font-bold uppercase mt-1">${period.start} - ${period.end}</div>
                                    </td>
                                    ${DAYS.map((day, dayIndex) => {
        const slot = timetable?.find(s => s.day_of_week === dayIndex + 1 && s.period_number === period.number);
        if (slot) {
            return `
                                                <td class="p-2">
                                                    <div class="bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500 rounded-xl p-3 text-center">
                                                        <div class="font-black text-primary-700 dark:text-primary-400 text-xs uppercase tracking-tight">${slot.subject}</div>
                                                        <div class="text-[9px] font-bold text-gray-500 dark:text-gray-500 mt-1 uppercase">${slot.classes?.class_name}</div>
                                                    </div>
                                                </td>
                                            `;
        }
        return `<td class="p-2 text-center text-gray-200 dark:text-gray-800 font-black text-xl leading-none">·</td>`;
    }).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="p-6 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    </div>
                    <p class="text-xs text-indigo-800 dark:text-indigo-300">
                        <strong>Note:</strong> Timetable changes can only be requested through the School Administration. Contact the Admin Office for adjustments.
                    </p>
                </div>
            </div>
        </div>
    `;
}
