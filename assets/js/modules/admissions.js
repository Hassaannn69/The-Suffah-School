/**
 * Online Admissions Review – admin reviews applications submitted from the landing page.
 * Layout: stats cards, application table (left), detail side-panel (right).
 */

const supabase = window.supabase || (() => { throw new Error('Supabase client not initialized'); })();

let applications = [];
let filteredApps = [];
let selectedApp = null;
let currentPage = 1;
const PAGE_SIZE = 4;
let currentFilter = 'all';
let searchQuery = '';

// ── Fetch ──
async function fetchApplications() {
    const { data, error } = await supabase
        .from('online_applications')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching applications:', error);
        applications = [];
    } else {
        applications = data || [];
    }
    applyFilters();
}

function applyFilters() {
    filteredApps = applications.filter(app => {
        const matchesFilter = currentFilter === 'all' || app.status === currentFilter;
        const matchesSearch = !searchQuery ||
            app.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.parent_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.grade_applying?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });
    currentPage = 1;
}

// ── Stats ──
function getStats() {
    const total = applications.length;
    const pending = applications.filter(a => a.status === 'pending').length;
    const approved = applications.filter(a => a.status === 'approved').length;
    const rejected = applications.filter(a => a.status === 'rejected').length;
    return { total, pending, approved, rejected };
}

// ── Helpers ──
function initials(name) {
    if (!name) return '?';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function statusBadge(status) {
    const map = {
        pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
        approved: 'bg-green-500/20 text-green-400 border-green-500/30',
        rejected: 'bg-red-500/20 text-red-400 border-red-500/30'
    };
    const cls = map[status] || map.pending;
    return `<span class="px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border ${cls}">${status}</span>`;
}

function avatarColor(name) {
    const colors = [
        'bg-blue-600', 'bg-green-600', 'bg-purple-600', 'bg-pink-600',
        'bg-indigo-600', 'bg-teal-600', 'bg-orange-600', 'bg-red-600'
    ];
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

// ── Render ──
export async function render(container) {
    container.innerHTML = `<div class="admissions-loading flex items-center justify-center py-24">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>`;

    await fetchApplications();
    renderPage(container);
}

function renderPage(container) {
    const stats = getStats();
    const totalPages = Math.max(1, Math.ceil(filteredApps.length / PAGE_SIZE));
    const pageApps = filteredApps.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    container.innerHTML = `
        <div class="flex flex-col lg:flex-row gap-6 h-full">
            <!-- LEFT: Main panel -->
            <div class="flex-1 flex flex-col gap-6 min-w-0">
                <!-- Header -->
                <div>
                    <h1 class="text-2xl font-bold text-white">Admissions Review</h1>
                    <p class="text-gray-400 text-sm mt-1">Manage online applications</p>
                </div>

                <!-- Stats Cards -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    ${statsCard('TOTAL APPLICATIONS', stats.total, 'text-white', 'all')}
                    ${statsCard('PENDING REVIEW', stats.pending, 'text-yellow-400', 'pending')}
                    ${statsCard('APPROVED', stats.approved, 'text-green-400', 'approved')}
                    ${statsCard('REJECTED', stats.rejected, 'text-red-400', 'rejected')}
                </div>

                <!-- Search bar -->
                <div class="flex items-center gap-3">
                    <div class="relative flex-1 max-w-sm">
                        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                        <input type="text" id="admissions-search" placeholder="Search applications..."
                            value="${searchQuery}"
                            class="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors">
                    </div>
                </div>

                <!-- Table -->
                <div class="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full">
                            <thead class="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th class="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student Name</th>
                                    <th class="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date Applied</th>
                                    <th class="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Grade</th>
                                    <th class="p-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody id="admissions-tbody" class="divide-y divide-gray-200 dark:divide-gray-800">
                                ${pageApps.length ? pageApps.map(app => appRow(app)).join('') :
                                    `<tr><td colspan="4" class="p-8 text-center text-gray-500 dark:text-gray-400">
                                        <div class="flex flex-col items-center gap-2">
                                            <svg class="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                                            <p>No applications found</p>
                                        </div>
                                    </td></tr>`
                                }
                            </tbody>
                        </table>
                    </div>

                    <!-- Pagination -->
                    <div class="p-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                        <span class="text-xs text-gray-500 dark:text-gray-400">
                            Showing ${pageApps.length} of ${filteredApps.length} applications
                        </span>
                        <div class="flex gap-2">
                            <button id="admissions-prev" ${currentPage <= 1 ? 'disabled' : ''}
                                class="p-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                            </button>
                            <button id="admissions-next" ${currentPage >= totalPages ? 'disabled' : ''}
                                class="p-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- RIGHT: Detail side-panel -->
            <div id="admissions-detail" class="w-full lg:w-[420px] flex-shrink-0 transition-all duration-300 ${selectedApp ? '' : 'hidden lg:block'}">
                ${selectedApp ? detailPanel(selectedApp) : emptyDetail()}
            </div>
        </div>
    `;

    bindEvents(container);
}

function statsCard(label, value, colorClass, filterKey) {
    const isActive = currentFilter === filterKey;
    return `
        <button data-filter="${filterKey}" class="admissions-stat-card bg-white dark:bg-gray-900 rounded-xl p-5 text-left border ${isActive ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-gray-200 dark:border-gray-800'} hover:border-primary-500/50 transition-all cursor-pointer group">
            <p class="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">${label}</p>
            <p class="text-3xl font-bold ${colorClass}">${value}</p>
        </button>
    `;
}

function appRow(app) {
    const isSelected = selectedApp && selectedApp.id === app.id;
    return `
        <tr data-app-id="${app.id}" class="admissions-row cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isSelected ? 'bg-primary-50 dark:bg-primary-900/10' : ''}">
            <td class="p-4">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full ${avatarColor(app.student_name)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                        ${initials(app.student_name)}
                    </div>
                    <span class="font-medium text-gray-900 dark:text-white text-sm">${app.student_name || '—'}</span>
                </div>
            </td>
            <td class="p-4 text-sm text-gray-500 dark:text-gray-400">${formatDate(app.created_at)}</td>
            <td class="p-4 text-sm text-gray-500 dark:text-gray-400">Grade ${app.grade_applying || '—'}</td>
            <td class="p-4">${statusBadge(app.status)}</td>
        </tr>
    `;
}

function emptyDetail() {
    return `
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 h-full flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
            <svg class="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            <p class="text-gray-500 dark:text-gray-400 font-medium">Select an application</p>
            <p class="text-gray-400 dark:text-gray-500 text-sm mt-1">Click on a row to view details</p>
        </div>
    `;
}

function detailPanel(app) {
    return `
        <div class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col">
            <!-- Header -->
            <div class="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <h2 class="text-lg font-bold text-gray-900 dark:text-white">Application Details</h2>
                <button id="admissions-close-detail" class="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </div>

            <!-- Scrollable content -->
            <div class="flex-1 overflow-y-auto p-6 space-y-6">
                <!-- Student Information -->
                <div>
                    <div class="flex items-center gap-2 mb-4">
                        <span class="text-lg">🎓</span>
                        <h3 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Student Information</h3>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Full Name</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-white">${app.student_name || '—'}</p>
                        </div>
                        <div>
                            <p class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">DOB</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-white">${formatDate(app.date_of_birth)}</p>
                        </div>
                        <div>
                            <p class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Gender</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-white">${app.gender || '—'}</p>
                        </div>
                        <div>
                            <p class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Grade Applying</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-white">Grade ${app.grade_applying || '—'}</p>
                        </div>
                    </div>
                </div>

                <!-- Parent / Guardian -->
                <div>
                    <div class="flex items-center gap-2 mb-4">
                        <span class="text-lg">👨‍👩‍👦</span>
                        <h3 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Parent / Guardian</h3>
                    </div>
                    <div class="space-y-3">
                        <div>
                            <p class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Name / Relationship</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-white">${app.parent_name || '—'} (${app.parent_relationship || '—'})</p>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Contact</p>
                                <p class="text-sm font-medium text-gray-900 dark:text-white">${app.parent_contact || '—'}</p>
                            </div>
                            <div>
                                <p class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Email</p>
                                <p class="text-sm font-medium text-gray-900 dark:text-white">${app.parent_email || '—'}</p>
                            </div>
                        </div>
                        <div>
                            <p class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Occupation</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-white">${app.parent_occupation || '—'}</p>
                        </div>
                    </div>
                </div>

                <!-- Education -->
                <div>
                    <div class="flex items-center gap-2 mb-4">
                        <span class="text-lg">🎒</span>
                        <h3 class="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Education</h3>
                    </div>
                    <div class="space-y-3">
                        <div>
                            <p class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Previous School</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-white">${app.previous_school || '—'}</p>
                        </div>
                        <div>
                            <p class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Reason for Leaving</p>
                            <p class="text-sm font-medium text-gray-900 dark:text-white">${app.reason_for_leaving || '—'}</p>
                        </div>
                    </div>
                </div>

                <!-- Admin Notes -->
                <div>
                    <label class="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Internal Admin Notes</label>
                    <textarea id="admissions-notes" rows="4" placeholder="Add feedback or notes for this application..."
                        class="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none transition-colors"
                    >${app.admin_notes || ''}</textarea>
                </div>
            </div>

            <!-- Action buttons (sticky bottom) -->
            <div class="p-6 border-t border-gray-200 dark:border-gray-800 flex gap-3">
                <button id="admissions-reject" class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-red-500/30 text-red-400 hover:bg-red-500/10 font-semibold text-sm transition-colors ${app.status === 'rejected' ? 'opacity-50 cursor-not-allowed' : ''}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    Reject
                </button>
                <button id="admissions-approve" class="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm transition-colors shadow-lg shadow-green-600/20 ${app.status === 'approved' ? 'opacity-50 cursor-not-allowed' : ''}">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                    Approve
                </button>
            </div>
        </div>
    `;
}

// ── Events ──
function bindEvents(container) {
    // Row clicks → open detail
    container.querySelectorAll('.admissions-row').forEach(row => {
        row.addEventListener('click', () => {
            const id = row.dataset.appId;
            selectedApp = applications.find(a => a.id === id) || null;
            renderPage(container);
        });
    });

    // Close detail
    const closeBtn = container.querySelector('#admissions-close-detail');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            selectedApp = null;
            renderPage(container);
        });
    }

    // Stats filter cards
    container.querySelectorAll('.admissions-stat-card').forEach(card => {
        card.addEventListener('click', () => {
            currentFilter = card.dataset.filter;
            applyFilters();
            renderPage(container);
        });
    });

    // Search
    const searchInput = container.querySelector('#admissions-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            applyFilters();
            renderPage(container);
        });
    }

    // Pagination
    const prevBtn = container.querySelector('#admissions-prev');
    const nextBtn = container.querySelector('#admissions-next');
    if (prevBtn) prevBtn.addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderPage(container); } });
    if (nextBtn) {
        const totalPages = Math.ceil(filteredApps.length / PAGE_SIZE);
        nextBtn.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; renderPage(container); } });
    }

    // Approve / Reject
    const approveBtn = container.querySelector('#admissions-approve');
    const rejectBtn = container.querySelector('#admissions-reject');

    if (approveBtn && selectedApp && selectedApp.status !== 'approved') {
        approveBtn.addEventListener('click', () => updateStatus(container, 'approved'));
    }
    if (rejectBtn && selectedApp && selectedApp.status !== 'rejected') {
        rejectBtn.addEventListener('click', () => updateStatus(container, 'rejected'));
    }
}

async function updateStatus(container, newStatus) {
    if (!selectedApp) return;

    const notes = container.querySelector('#admissions-notes')?.value || '';

    const { error } = await supabase
        .from('online_applications')
        .update({
            status: newStatus,
            admin_notes: notes,
            reviewed_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .eq('id', selectedApp.id);

    if (error) {
        console.error('Error updating application:', error);
        showToast('Failed to update application', 'error');
        return;
    }

    // Update local state
    selectedApp.status = newStatus;
    selectedApp.admin_notes = notes;
    const idx = applications.findIndex(a => a.id === selectedApp.id);
    if (idx !== -1) applications[idx] = { ...selectedApp };
    applyFilters();

    showToast(`Application ${newStatus} successfully`, 'success');
    renderPage(container);
}

function showToast(message, type = 'info') {
    const colors = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-primary-600'
    };
    const toast = document.createElement('div');
    toast.className = `fixed bottom-6 right-6 ${colors[type] || colors.info} text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-medium z-[9999] transform transition-all duration-300 translate-y-4 opacity-0`;
    toast.textContent = message;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.classList.remove('translate-y-4', 'opacity-0');
    });
    setTimeout(() => {
        toast.classList.add('translate-y-4', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
