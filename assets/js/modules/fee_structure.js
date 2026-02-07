/**
 * Fee Structure Management – Versioned single source of truth.
 * Version history, fee structure editor (per-class), discount rules, publish/duplicate, brochure preview.
 * Legacy Fee Types + Class Fees tab kept for backward compatibility.
 */
const supabase = window.supabase || (() => {
    console.error('Supabase client not found on window object');
    throw new Error('Supabase client not initialized');
})();

const toast = window.toast || { error: (m) => alert(m), success: (m) => alert(m), warning: (m) => alert(m) };

let currentVersionId = null;
let versions = [];
let isArchivedView = false;

export async function render(container) {
    container.innerHTML = `
        <div class="space-y-6">
            <!-- Header -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-2">Fee Structure</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">Versioned fee structure. New students use the active version; existing students are never changed.</p>
            </div>

            <!-- Version History Tabs -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Version History</h3>
                <div id="versionTabs" class="flex flex-wrap gap-2">
                    <span class="text-gray-400 text-sm">Loading...</span>
                </div>
                <!-- Fee Structure History (audit table) -->
                <div id="versionHistoryTableWrap" class="mt-4 overflow-x-auto hidden">
                    <table class="w-full text-sm border-collapse">
                        <thead>
                            <tr class="border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400">
                                <th class="text-left py-2 px-2 font-medium">Version</th>
                                <th class="text-left py-2 px-2 font-medium">Effective from</th>
                                <th class="text-left py-2 px-2 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody id="versionHistoryTableBody" class="text-gray-700 dark:text-gray-300">
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Warning Banner -->
            <div id="feeStructureWarning" class="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 flex items-start gap-3">
                <svg class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
                <p class="text-sm font-medium text-amber-800 dark:text-amber-200">Changes will only affect future admissions. Existing students keep their current fee structure.</p>
            </div>

            <!-- Actions -->
            <div class="flex flex-wrap items-center gap-3">
                <button id="btnPublishVersion" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                    Publish New Version
                </button>
                <button id="btnDuplicateStructure" class="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    Duplicate Structure
                </button>
                <a id="btnPreviewLanding" href="brochure.html" target="_blank" rel="noopener" class="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                    Preview Landing Page
                </a>
            </div>

            <!-- Fee Structure Editor -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div class="p-6 border-b border-gray-100 dark:border-gray-700">
                    <h3 class="text-lg font-bold text-gray-800 dark:text-white">Fee Structure Editor</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Per-class base fee, admission, exam, and misc. Total is computed.</p>
                </div>
                <div id="feeStructureEditorContent" class="p-6">
                    <div id="versionEmpty" class="hidden text-center py-12 text-gray-500">
                        <p>No fee structure version found. Run the schema migration and seed, or create a version.</p>
                    </div>
                    <div id="versionLoading" class="text-center py-8 text-gray-500">Loading...</div>
                    <div id="versionTableWrap" class="hidden overflow-x-auto">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm uppercase tracking-wider">
                                    <th class="p-3 font-semibold rounded-tl-lg">Class / Grade</th>
                                    <th class="p-3 font-semibold text-right">Base Monthly Fee</th>
                                    <th class="p-3 font-semibold text-right">Admission Fee</th>
                                    <th class="p-3 font-semibold text-right">Exam Fee</th>
                                    <th class="p-3 font-semibold text-right">Misc Charges</th>
                                    <th class="p-3 font-semibold text-right">Total Fee</th>
                                    <th id="thActions" class="p-3 font-semibold text-right rounded-tr-lg">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="feeStructureTableBody" class="text-gray-700 dark:text-gray-300 text-sm divide-y divide-gray-100 dark:divide-gray-700">
                            </tbody>
                        </table>
                        <div id="addClassRowWrap" class="mt-4 hidden">
                            <button type="button" id="btnAddClassRow" class="text-indigo-600 dark:text-indigo-400 text-sm font-medium flex items-center gap-1">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                                Add class
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Auto-Discount Rules -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">Auto-Discount Rules</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Applied only at admission. Values are stored with the student and never changed by future fee structure edits.</p>
                <div id="discountRulesContent" class="space-y-4">
                    <div class="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="discountSiblingEnabled" class="w-4 h-4 text-indigo-600 rounded">
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Sibling discount</span>
                        </label>
                        <span class="text-sm text-gray-500">Applies to second and subsequent siblings.</span>
                        <input type="number" id="discountSiblingPercent" min="0" max="100" step="0.5" placeholder="10" class="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                        <span class="text-sm text-gray-500">%</span>
                    </div>
                    <div class="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="discountStaffEnabled" class="w-4 h-4 text-indigo-600 rounded">
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Staff child discount</span>
                        </label>
                        <span class="text-sm text-gray-500">Applies to children of staff members.</span>
                        <input type="number" id="discountStaffPercent" min="0" max="100" step="0.5" placeholder="20" class="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                        <span class="text-sm text-gray-500">%</span>
                    </div>
                    <div class="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                        <label class="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" id="discountEarlyEnabled" class="w-4 h-4 text-indigo-600 rounded">
                            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Early admission discount</span>
                        </label>
                        <input type="number" id="discountEarlyPercent" min="0" max="100" step="0.5" placeholder="0" class="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
                        <span class="text-sm text-gray-500">%</span>
                    </div>
                    <div id="discountRulesReadOnly" class="hidden text-sm text-gray-500">Discount rules are read-only for archived versions.</div>
                    <button type="button" id="btnSaveDiscountRules" class="hidden mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium">Save discount rules</button>
                </div>
            </div>

            <!-- Legacy tab: Fee Types & Class Fees -->
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div class="p-4 border-b border-gray-100 dark:border-gray-700">
                    <button id="tabLegacy" class="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border-b-2 border-transparent hover:border-gray-300">Legacy: Fee Types & Class Fees</button>
                </div>
                <div id="contentLegacy" class="hidden p-6">
                    <div class="flex space-x-4 border-b border-gray-200 dark:border-gray-700 mb-4">
                        <button id="tabFeeTypes" class="px-4 py-2 text-sm font-medium text-indigo-600 border-b-2 border-indigo-600">Fee Types</button>
                        <button id="tabClassFees" class="px-4 py-2 text-sm font-medium text-gray-500">Class Fees</button>
                    </div>
                    <div id="contentFeeTypes"></div>
                    <div id="contentClassFees" class="hidden"></div>
                </div>
            </div>
        </div>

        <!-- Modal: Add/Edit class row -->
        <div id="modalClassRow" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50 backdrop-blur-sm">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                <h3 id="modalClassRowTitle" class="text-lg font-bold text-gray-800 dark:text-white mb-4">Add class</h3>
                <input type="hidden" id="editClassRowId">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class / Grade</label>
                        <select id="modalClassSelect" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"></select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base monthly fee</label>
                        <input type="number" id="modalBaseFee" min="0" step="0.01" placeholder="0" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admission fee</label>
                        <input type="number" id="modalAdmissionFee" min="0" step="0.01" placeholder="0" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Exam fee (optional)</label>
                        <input type="number" id="modalExamFee" min="0" step="0.01" placeholder="0" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Misc charges (optional)</label>
                        <input type="number" id="modalMiscCharges" min="0" step="0.01" placeholder="0" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>
                </div>
                <div class="flex justify-end gap-2 mt-6">
                    <button type="button" id="modalClassRowCancel" class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg text-sm">Cancel</button>
                    <button type="button" id="modalClassRowSave" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm">Save</button>
                </div>
            </div>
        </div>

        <!-- Legacy: Fee Type Modal -->
        <div id="feeTypeModal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50 backdrop-blur-sm">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 id="feeTypeModalTitle" class="text-lg font-bold text-gray-800 dark:text-white">Add Fee Type</h3>
                    <button type="button" id="closeFeeTypeModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">&times;</button>
                </div>
                <form id="feeTypeForm" class="space-y-4">
                    <input type="hidden" id="feeTypeId">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fee Name</label>
                        <input type="text" id="feeTypeName" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="e.g. Tuition Fee">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <textarea id="feeTypeDesc" rows="2" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Default Amount</label>
                        <input type="number" id="feeTypeDefaultAmount" min="0" step="0.01" placeholder="0" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>
                    <div class="flex justify-end gap-2">
                        <button type="button" id="cancelFeeTypeBtn" class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg text-sm">Cancel</button>
                        <button type="submit" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm">Save</button>
                    </div>
                </form>
            </div>
        </div>
        <!-- Legacy: Assign Fee Modal -->
        <div id="assignFeeModal" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50 backdrop-blur-sm">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-bold text-gray-800 dark:text-white">Assign Fee to Class</h3>
                    <button type="button" id="closeAssignFeeModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">&times;</button>
                </div>
                <form id="assignFeeForm" class="space-y-4">
                    <input type="hidden" id="assignClassId">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fee Type</label>
                        <select id="assignFeeTypeSelect" required class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"></select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount</label>
                        <input type="number" id="assignAmount" required min="0" step="0.01" placeholder="0" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>
                    <div class="flex justify-end gap-2">
                        <button type="button" id="cancelAssignFeeBtn" class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg text-sm">Cancel</button>
                        <button type="submit" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm">Assign</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Modal: Publish new version -->
        <div id="modalPublish" class="fixed inset-0 bg-black/50 hidden items-center justify-center z-50 backdrop-blur-sm">
            <div class="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
                <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-2">Publish new version</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">This will create a new fee structure version. The current active version will be archived. New admissions will use the new version. Existing students are unaffected.</p>
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Version label (e.g. 2025-26)</label>
                        <input type="text" id="publishVersionLabel" placeholder="2025-26" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Effective from (date)</label>
                        <input type="date" id="publishEffectiveFrom" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>
                </div>
                <div class="flex justify-end gap-2 mt-6">
                    <button type="button" id="modalPublishCancel" class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-lg text-sm">Cancel</button>
                    <button type="button" id="modalPublishConfirm" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm">Publish</button>
                </div>
            </div>
        </div>
    `;

    // Version tabs and data
    await loadVersions();
    const versionTabsEl = document.getElementById('versionTabs');
    if (versions.length) {
        const active = versions.find(v => v.is_active);
        if (active) {
            currentVersionId = active.id;
            isArchivedView = false;
        } else {
            currentVersionId = (versions[0] && versions[0].id) || null;
            isArchivedView = true;
        }
        renderVersionTabs();
        await loadVersionData();
    } else {
        versionTabsEl.innerHTML = '<span class="text-gray-500 text-sm">No versions yet. Run the fee_structure_versioning_schema.sql migration.</span>';
        document.getElementById('versionLoading').classList.add('hidden');
        document.getElementById('versionEmpty').classList.remove('hidden');
    }

    // Button handlers
    document.getElementById('btnPublishVersion').addEventListener('click', openPublishModal);
    document.getElementById('btnDuplicateStructure').addEventListener('click', duplicateStructure);
    document.getElementById('btnSaveDiscountRules').addEventListener('click', saveDiscountRules);
    document.getElementById('btnAddClassRow').addEventListener('click', openAddClassRow);
    document.getElementById('modalClassRowCancel').addEventListener('click', () => closeModal('modalClassRow'));
    document.getElementById('modalClassRowSave').addEventListener('click', saveClassRow);
    document.getElementById('modalPublishCancel').addEventListener('click', () => closeModal('modalPublish'));
    document.getElementById('modalPublishConfirm').addEventListener('click', confirmPublish);

    document.getElementById('modalClassRow').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal('modalClassRow'); });
    document.getElementById('modalPublish').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal('modalPublish'); });

    // Legacy tab
    document.getElementById('tabLegacy').addEventListener('click', () => {
        document.getElementById('contentLegacy').classList.remove('hidden');
    });
    document.getElementById('contentLegacy').querySelector('#tabFeeTypes').addEventListener('click', () => {
        document.getElementById('contentFeeTypes').classList.remove('hidden');
        document.getElementById('contentClassFees').classList.add('hidden');
    });
    document.getElementById('contentLegacy').querySelector('#tabClassFees').addEventListener('click', () => {
        document.getElementById('contentClassFees').classList.remove('hidden');
        document.getElementById('contentFeeTypes').classList.add('hidden');
        if (typeof window.fetchClasses === 'function') window.fetchClasses();
    });

    // Load legacy content (reuse existing fee types / class fees UI)
    await renderLegacyContent();
}

function renderVersionTabs() {
    const el = document.getElementById('versionTabs');
    el.innerHTML = versions.map(v => {
        const isActive = v.is_active;
        const label = isActive ? `Active: ${v.version_label}` : v.version_label;
        return `<button type="button" data-version-id="${v.id}" class="version-tab px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentVersionId === v.id ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'}">${label}</button>`;
    }).join('');
    el.querySelectorAll('.version-tab').forEach(btn => {
        btn.addEventListener('click', () => selectVersion(btn.dataset.versionId));
    });

    const historyWrap = document.getElementById('versionHistoryTableWrap');
    const historyBody = document.getElementById('versionHistoryTableBody');
    if (historyWrap && historyBody) {
        if (versions.length === 0) {
            historyWrap.classList.add('hidden');
        } else {
            historyWrap.classList.remove('hidden');
            const formatDate = (d) => {
                if (!d) return '—';
                const s = String(d).slice(0, 10);
                if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
                return s;
            };
            historyBody.innerHTML = versions.map(v => `
                <tr class="border-b border-gray-100 dark:border-gray-700">
                    <td class="py-2 px-2 font-medium">${escapeHtml(v.version_label || '—')}</td>
                    <td class="py-2 px-2">${formatDate(v.effective_from)}</td>
                    <td class="py-2 px-2">${v.is_active ? 'Active' : 'Archived'}</td>
                </tr>
            `).join('');
        }
    }
}

function selectVersion(versionId) {
    currentVersionId = versionId;
    const v = versions.find(x => x.id === versionId);
    isArchivedView = v ? !v.is_active : true;
    renderVersionTabs();
    loadVersionData();
}

async function loadVersions() {
    const res = await supabase
        .from('fee_structure_versions')
        .select('*')
        .order('effective_from', { ascending: false });
    const data = res.data;
    const error = res.error;
    if (error) {
        console.error('Fee structure versions', error);
        versions = [];
        return;
    }
    versions = data || [];
}

async function loadVersionData() {
    const wrap = document.getElementById('versionTableWrap');
    const loading = document.getElementById('versionLoading');
    const empty = document.getElementById('versionEmpty');
    const tbody = document.getElementById('feeStructureTableBody');
    const addWrap = document.getElementById('addClassRowWrap');
    const thActions = document.getElementById('thActions');
    const btnSaveDiscount = document.getElementById('btnSaveDiscountRules');
    const discountReadOnly = document.getElementById('discountRulesReadOnly');

    if (!currentVersionId) {
        loading.classList.add('hidden');
        wrap.classList.add('hidden');
        empty.classList.remove('hidden');
        return;
    }

    loading.classList.remove('hidden');
    wrap.classList.add('hidden');
    empty.classList.add('hidden');

    const [classesRes, rulesRes] = await Promise.all([
        supabase.from('fee_structure_classes').select('*').eq('fee_structure_version_id', currentVersionId).order('class_name'),
        supabase.from('fee_structure_discount_rules').select('*').eq('fee_structure_version_id', currentVersionId).maybeSingle()
    ]);

    loading.classList.add('hidden');

    const classes = classesRes.data || [];
    const rules = rulesRes.data;

    // Discount rules UI
    const siblingEnabled = document.getElementById('discountSiblingEnabled');
    const siblingPercent = document.getElementById('discountSiblingPercent');
    const staffEnabled = document.getElementById('discountStaffEnabled');
    const staffPercent = document.getElementById('discountStaffPercent');
    const earlyEnabled = document.getElementById('discountEarlyEnabled');
    const earlyPercent = document.getElementById('discountEarlyPercent');

    if (isArchivedView) {
        siblingEnabled.disabled = staffEnabled.disabled = earlyEnabled.disabled = true;
        siblingPercent.disabled = staffPercent.disabled = earlyPercent.disabled = true;
        btnSaveDiscount.classList.add('hidden');
        discountReadOnly.classList.remove('hidden');
    } else {
        siblingEnabled.disabled = staffEnabled.disabled = earlyEnabled.disabled = false;
        siblingPercent.disabled = staffPercent.disabled = earlyPercent.disabled = false;
        btnSaveDiscount.classList.remove('hidden');
        discountReadOnly.classList.add('hidden');
    }

    if (rules) {
        siblingEnabled.checked = (rules.sibling_discount_percent || 0) > 0;
        const v = (x) => (x != null && Number(x) !== 0 ? String(x) : '');
        siblingPercent.value = v(rules.sibling_discount_percent);
        staffEnabled.checked = (rules.staff_child_discount_percent || 0) > 0;
        staffPercent.value = v(rules.staff_child_discount_percent);
        earlyEnabled.checked = (rules.early_admission_discount_percent || 0) > 0 || (rules.early_admission_discount_fixed || 0) > 0;
        earlyPercent.value = v(rules.early_admission_discount_percent);
    }

    const totalFee = (row) => (Number(row.base_monthly_fee) || 0) + (Number(row.admission_fee) || 0) + (Number(row.exam_fee) || 0) + (Number(row.misc_charges) || 0);

    tbody.innerHTML = classes.map(row => {
        const total = totalFee(row);
        const actions = isArchivedView ? '' : `
            <button type="button" data-edit-id="${row.id}" class="text-indigo-600 dark:text-indigo-400 hover:underline text-xs">Edit</button>
            <button type="button" data-delete-id="${row.id}" class="text-red-500 hover:underline text-xs ml-2">Delete</button>
        `;
        return `
            <tr class="border-b border-gray-100 dark:border-gray-700 last:border-0">
                <td class="p-3 font-medium text-gray-900 dark:text-white">${escapeHtml(row.class_name)}</td>
                <td class="p-3 text-right">${formatMoney(row.base_monthly_fee)}</td>
                <td class="p-3 text-right">${formatMoney(row.admission_fee)}</td>
                <td class="p-3 text-right">${formatMoney(row.exam_fee)}</td>
                <td class="p-3 text-right">${formatMoney(row.misc_charges)}</td>
                <td class="p-3 text-right font-medium">${formatMoney(total)}</td>
                <td class="p-3 text-right">${actions}</td>
            </tr>
        `;
    }).join('');

    if (!isArchivedView) {
        tbody.querySelectorAll('[data-edit-id]').forEach(btn => btn.addEventListener('click', () => openEditClassRow(btn.dataset.editId)));
        tbody.querySelectorAll('[data-delete-id]').forEach(btn => btn.addEventListener('click', () => deleteClassRow(btn.dataset.deleteId)));
    }

    addWrap.classList.toggle('hidden', isArchivedView);
    thActions.classList.toggle('hidden', isArchivedView);
    wrap.classList.remove('hidden');
}

function formatMoney(n) {
    const x = Number(n);
    return isNaN(x) ? '0.00' : x.toFixed(2);
}

function escapeHtml(s) {
    if (s == null) return '';
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}

function closeModal(id) {
    document.getElementById(id).classList.add('hidden');
    document.getElementById(id).classList.remove('flex');
}

function openModal(id) {
    document.getElementById(id).classList.remove('hidden');
    document.getElementById(id).classList.add('flex');
}

async function openAddClassRow() {
    if (!currentVersionId || isArchivedView) return;
    const classesRes = await supabase.from('classes').select('id, class_name').order('class_name');
    const classes = classesRes.data;
    const select = document.getElementById('modalClassSelect');
    select.innerHTML = (classes || []).map(c => `<option value="${escapeHtml(c.class_name)}">${escapeHtml(c.class_name)}</option>`).join('');
    document.getElementById('editClassRowId').value = '';
    document.getElementById('modalClassRowTitle').textContent = 'Add class';
    document.getElementById('modalBaseFee').value = '';
    document.getElementById('modalAdmissionFee').value = '';
    document.getElementById('modalExamFee').value = '';
    document.getElementById('modalMiscCharges').value = '';
    openModal('modalClassRow');
}

async function openEditClassRow(rowId) {
    const rowRes = await supabase.from('fee_structure_classes').select('*').eq('id', rowId).single();
    const row = rowRes.data;
    if (!row) return;
    document.getElementById('editClassRowId').value = row.id;
    document.getElementById('modalClassRowTitle').textContent = 'Edit class';
    const select = document.getElementById('modalClassSelect');
    const classesRes = await supabase.from('classes').select('id, class_name').order('class_name');
    const classes = classesRes.data;
    select.innerHTML = (classes || []).map(c => `<option value="${escapeHtml(c.class_name)}" ${c.class_name === row.class_name ? 'selected' : ''}>${escapeHtml(c.class_name)}</option>`).join('');
    const setOrPlaceholder = (v) => (v != null && Number(v) !== 0 ? v : '');
    document.getElementById('modalBaseFee').value = setOrPlaceholder(row.base_monthly_fee);
    document.getElementById('modalAdmissionFee').value = setOrPlaceholder(row.admission_fee);
    document.getElementById('modalExamFee').value = setOrPlaceholder(row.exam_fee);
    document.getElementById('modalMiscCharges').value = setOrPlaceholder(row.misc_charges);
    openModal('modalClassRow');
}

async function saveClassRow() {
    const editId = document.getElementById('editClassRowId').value;
    const class_name = document.getElementById('modalClassSelect').value.trim();
    const base_monthly_fee = Number(document.getElementById('modalBaseFee').value) || 0;
    const admission_fee = Number(document.getElementById('modalAdmissionFee').value) || 0;
    const exam_fee = Number(document.getElementById('modalExamFee').value) || 0;
    const misc_charges = Number(document.getElementById('modalMiscCharges').value) || 0;

    if (!class_name) {
        toast.error('Select a class.');
        return;
    }

    if (editId) {
        const updateRes = await supabase.from('fee_structure_classes').update({
            class_name,
            base_monthly_fee,
            admission_fee,
            exam_fee,
            misc_charges
        }).eq('id', editId);
        const error = updateRes.error;
        if (error) {
            toast.error(error.message);
            return;
        }
        toast.success('Updated.');
    } else {
        const insertRes = await supabase.from('fee_structure_classes').insert([{
            fee_structure_version_id: currentVersionId,
            class_name,
            base_monthly_fee,
            admission_fee,
            exam_fee,
            misc_charges
        }]);
        const error = insertRes.error;
        if (error) {
            toast.error(error.message);
            return;
        }
        toast.success('Class added.');
    }
    closeModal('modalClassRow');
    loadVersionData();
}

async function deleteClassRow(rowId) {
    if (!confirm('Remove this class from the fee structure?')) return;
    const res = await supabase.from('fee_structure_classes').delete().eq('id', rowId);
    const error = res.error;
    if (error) {
        toast.error(error.message);
        return;
    }
    toast.success('Removed.');
    loadVersionData();
}

async function saveDiscountRules() {
    if (!currentVersionId || isArchivedView) return;
    const sibling = document.getElementById('discountSiblingEnabled').checked ? (Number(document.getElementById('discountSiblingPercent').value) || 0) : 0;
    const staff = document.getElementById('discountStaffEnabled').checked ? (Number(document.getElementById('discountStaffPercent').value) || 0) : 0;
    const early = document.getElementById('discountEarlyEnabled').checked ? (Number(document.getElementById('discountEarlyPercent').value) || 0) : 0;

    const existingRes = await supabase.from('fee_structure_discount_rules').select('id').eq('fee_structure_version_id', currentVersionId).maybeSingle();
    const existing = existingRes.data;
    const payload = {
        fee_structure_version_id: currentVersionId,
        sibling_discount_percent: sibling,
        staff_child_discount_percent: staff,
        early_admission_discount_percent: early,
        early_admission_discount_fixed: 0
    };
    if (existing) {
        const updateRes = await supabase.from('fee_structure_discount_rules').update(payload).eq('id', existing.id);
        const error = updateRes.error;
        if (error) {
            toast.error(error.message);
            return;
        }
    } else {
        const insertRes = await supabase.from('fee_structure_discount_rules').insert([payload]);
        const error = insertRes.error;
        if (error) {
            toast.error(error.message);
            return;
        }
    }
    toast.success('Discount rules saved.');
}

function openPublishModal() {
    const nextYear = new Date().getFullYear() + 1;
    document.getElementById('publishVersionLabel').value = `${nextYear - 1}-${String(nextYear).slice(-2)}`;
    document.getElementById('publishEffectiveFrom').value = new Date().toISOString().slice(0, 10);
    openModal('modalPublish');
}

async function confirmPublish() {
    const version_label = document.getElementById('publishVersionLabel').value.trim();
    const effective_from = document.getElementById('publishEffectiveFrom').value;
    if (!version_label || !effective_from) {
        toast.error('Enter version label and effective from date.');
        return;
    }

    const active = versions.find(v => v.is_active);
    if (!active) {
        toast.error('No active version to copy from.');
        closeModal('modalPublish');
        return;
    }

    const userRes = await supabase.auth.getUser();
    const createdBy = (userRes.data && userRes.data.user) ? userRes.data.user.id : null;
    const versionRes = await supabase.from('fee_structure_versions').insert([{
        version_label,
        effective_from,
        is_active: true,
        status: 'active',
        created_by: createdBy
    }]).select('id').single();
    const newVersion = versionRes.data;
    const errVersion = versionRes.error;

    if (errVersion || !newVersion) {
        toast.error(errVersion ? errVersion.message : 'Failed to create version.');
        return;
    }

    const oldClassesRes = await supabase.from('fee_structure_classes').select('*').eq('fee_structure_version_id', active.id);
    const oldRulesRes = await supabase.from('fee_structure_discount_rules').select('*').eq('fee_structure_version_id', active.id).maybeSingle();
    const oldClasses = oldClassesRes.data;
    const oldRules = oldRulesRes.data;

    if (oldClasses && oldClasses.length) {
        const rows = oldClasses.map(c => ({
            fee_structure_version_id: newVersion.id,
            class_id: c.class_id,
            class_name: c.class_name,
            base_monthly_fee: c.base_monthly_fee,
            admission_fee: c.admission_fee,
            exam_fee: c.exam_fee,
            misc_charges: c.misc_charges
        }));
        await supabase.from('fee_structure_classes').insert(rows);
    }
    if (oldRules) {
        await supabase.from('fee_structure_discount_rules').insert([{
            fee_structure_version_id: newVersion.id,
            sibling_discount_percent: oldRules.sibling_discount_percent,
            staff_child_discount_percent: oldRules.staff_child_discount_percent,
            early_admission_discount_percent: oldRules.early_admission_discount_percent,
            early_admission_discount_fixed: oldRules.early_admission_discount_fixed
        }]);
    }

    await supabase.from('fee_structure_versions').update({ is_active: false, status: 'archived' }).eq('id', active.id);

    await loadVersions();
    currentVersionId = newVersion.id;
    isArchivedView = false;
    renderVersionTabs();
    await loadVersionData();
    closeModal('modalPublish');
    toast.success('New version published. It is now active.');
}

async function duplicateStructure() {
    const active = versions.find(v => v.is_active);
    if (!active) {
        toast.error('No active version to duplicate.');
        return;
    }
    document.getElementById('publishVersionLabel').value = active.version_label + ' (copy)';
    document.getElementById('publishEffectiveFrom').value = new Date().toISOString().slice(0, 10);
    openModal('modalPublish');
}

async function renderLegacyContent() {
    const contentFeeTypes = document.getElementById('contentFeeTypes');
    const contentClassFees = document.getElementById('contentClassFees');
    if (!contentFeeTypes || !contentClassFees) return;

    contentFeeTypes.innerHTML = `
        <div class="flex justify-end mb-4">
            <button id="addFeeTypeBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Add Fee Type</button>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm uppercase tracking-wider">
                        <th class="p-4 font-semibold">Name</th>
                        <th class="p-4 font-semibold">Description</th>
                        <th class="p-4 font-semibold">Default Amount</th>
                        <th class="p-4 font-semibold text-right">Actions</th>
                    </tr>
                </thead>
                <tbody id="feeTypesTableBody"></tbody>
            </table>
        </div>
    `;
    contentClassFees.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="md:col-span-1">
                <h3 class="font-semibold text-gray-800 dark:text-white mb-4">Select Class</h3>
                <div id="classList" class="space-y-2"></div>
            </div>
            <div class="md:col-span-2">
                <div id="classFeesContainer" class="hidden">
                    <h3 class="font-semibold text-gray-800 dark:text-white mb-4" id="selectedClassName">Class Fees</h3>
                    <button id="assignFeeBtn" class="text-indigo-600 text-sm font-medium mb-2">Assign Fee</button>
                    <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <table class="w-full text-sm">
                            <thead>
                                <tr class="text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                                    <th class="text-left pb-2">Fee Type</th>
                                    <th class="text-right pb-2">Amount</th>
                                    <th class="text-right pb-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody id="classFeesTableBody"></tbody>
                            <tfoot class="border-t border-gray-200 dark:border-gray-600">
                                <tr>
                                    <td class="pt-3 font-bold">Total</td>
                                    <td class="pt-3 text-right font-bold" id="totalClassFee">0.00</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
                <div id="noClassSelected" class="flex flex-col items-center justify-center h-64 text-gray-400">
                    <p>Select a class to manage legacy class fees.</p>
                </div>
            </div>
        </div>
    `;

    let selectedClassId = null;
    window.fetchClasses = async function () {
        const container = document.getElementById('classList');
        if (!container) return;
        container.innerHTML = 'Loading...';
        const res = await supabase.from('classes').select('*').order('class_name');
        const data = res.data;
        const error = res.error;
        if (error) {
            container.innerHTML = 'Error: ' + error.message;
            return;
        }
        if (window.sortClassesNatural) window.sortClassesNatural(data, 'class_name');
        container.innerHTML = (data || []).map(cls => `
            <button type="button" data-class-id="${cls.id}" data-class-name="${escapeHtml(cls.class_name)}" class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">${escapeHtml(cls.class_name)}</button>
        `).join('');
        container.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                selectedClassId = btn.dataset.classId;
                const name = btn.dataset.className;
                document.getElementById('selectedClassName').textContent = name + ' Fees';
                document.getElementById('noClassSelected').classList.add('hidden');
                document.getElementById('classFeesContainer').classList.remove('hidden');
                fetchClassFees(selectedClassId);
            });
        });
    };

    async function fetchClassFees(classId) {
        const tbody = document.getElementById('classFeesTableBody');
        const tfoot = document.getElementById('totalClassFee');
        if (!tbody) return;
        tbody.innerHTML = 'Loading...';
        const res = await supabase.from('class_fees').select('id, amount, fee_types(id, name)').eq('class_id', classId);
        const data = res.data;
        let total = 0;
        tbody.innerHTML = (data || []).map(item => {
            total += Number(item.amount);
            return `<tr class="border-b border-gray-100 dark:border-gray-700"><td class="py-3">${(item.fee_types && item.fee_types.name) || 'Unknown'}</td><td class="py-3 text-right">${Number(item.amount).toFixed(2)}</td><td class="py-3 text-right"><button type="button" data-delete-id="${item.id}" class="text-red-500 text-xs">Remove</button></td></tr>`;
        }).join('');
        if (tfoot) tfoot.textContent = total.toFixed(2);
        tbody.querySelectorAll('[data-delete-id]').forEach(b => b.addEventListener('click', async () => {
            await supabase.from('class_fees').delete().eq('id', b.dataset.deleteId);
            fetchClassFees(classId);
        }));
    }

    let legacySelectedClassId = null;
    async function fetchFeeTypes() {
        const tbody = document.getElementById('feeTypesTableBody');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center">Loading...</td></tr>';
        const res = await supabase.from('fee_types').select('*').order('name');
        const data = res.data;
        const error = res.error;
        if (error) {
            tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-red-500">Error: ' + error.message + '</td></tr>';
            return;
        }
        if (!data || !data.length) {
            tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-gray-400">No fee types. Add one above.</td></tr>';
            return;
        }
        tbody.innerHTML = data.map(type => `
            <tr class="border-b border-gray-100 dark:border-gray-700">
                <td class="p-4 font-medium text-gray-900 dark:text-white">${escapeHtml(type.name)}</td>
                <td class="p-4 text-gray-600 dark:text-gray-300">${escapeHtml(type.description || '-')}</td>
                <td class="p-4 text-gray-600 dark:text-gray-300">${formatMoney(type.default_amount || 0)}</td>
                <td class="p-4 text-right">
                    <button type="button" data-edit-id="${type.id}" class="text-indigo-600 hover:underline text-sm mr-2">Edit</button>
                    <button type="button" data-delete-id="${type.id}" class="text-red-500 hover:underline text-sm">Delete</button>
                </td>
            </tr>
        `).join('');
        tbody.querySelectorAll('[data-edit-id]').forEach(b => b.addEventListener('click', () => openLegacyFeeTypeModal(b.dataset.editId)));
        tbody.querySelectorAll('[data-delete-id]').forEach(b => b.addEventListener('click', () => deleteLegacyFeeType(b.dataset.deleteId)));
    }
    function openLegacyFeeTypeModal(editId) {
        const modal = document.getElementById('feeTypeModal');
        if (modal.parentElement !== document.body) document.body.appendChild(modal);
        if (!editId) {
            document.getElementById('feeTypeId').value = '';
            document.getElementById('feeTypeName').value = '';
            document.getElementById('feeTypeDesc').value = '';
            document.getElementById('feeTypeDefaultAmount').value = '';
            document.getElementById('feeTypeModalTitle').textContent = 'Add Fee Type';
        } else {
            supabase.from('fee_types').select('*').eq('id', editId).single().then(function (r) {
                var data = r.data;
                if (data) {
                    document.getElementById('feeTypeId').value = data.id;
                    document.getElementById('feeTypeName').value = data.name || '';
                    document.getElementById('feeTypeDesc').value = data.description || '';
                    document.getElementById('feeTypeDefaultAmount').value = (data.default_amount != null && Number(data.default_amount) !== 0 ? data.default_amount : '');
                    document.getElementById('feeTypeModalTitle').textContent = 'Edit Fee Type';
                }
            });
        }
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
    async function deleteLegacyFeeType(id) {
        if (!confirm('Delete this fee type? It will be removed from all classes.')) return;
        const res = await supabase.from('fee_types').delete().eq('id', id);
        const error = res.error;
        if (error) toast.error(error.message);
        else { toast.success('Deleted.'); fetchFeeTypes(); }
    }
    const addFeeTypeBtn = document.getElementById('addFeeTypeBtn');
    if (addFeeTypeBtn) addFeeTypeBtn.addEventListener('click', () => openLegacyFeeTypeModal());
    const closeFeeTypeModal = document.getElementById('closeFeeTypeModal');
    if (closeFeeTypeModal) closeFeeTypeModal.addEventListener('click', () => { document.getElementById('feeTypeModal').classList.add('hidden'); document.getElementById('feeTypeModal').classList.remove('flex'); });
    const cancelFeeTypeBtn = document.getElementById('cancelFeeTypeBtn');
    if (cancelFeeTypeBtn) cancelFeeTypeBtn.addEventListener('click', () => { document.getElementById('feeTypeModal').classList.add('hidden'); document.getElementById('feeTypeModal').classList.remove('flex'); });
    const feeTypeForm = document.getElementById('feeTypeForm');
    if (feeTypeForm) feeTypeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('feeTypeId').value;
        const payload = { name: document.getElementById('feeTypeName').value.trim(), description: document.getElementById('feeTypeDesc').value.trim(), default_amount: Number(document.getElementById('feeTypeDefaultAmount').value) || 0 };
        const res = id ? await supabase.from('fee_types').update(payload).eq('id', id) : await supabase.from('fee_types').insert([payload]);
        const error = res.error;
        if (error) toast.error(error.message);
        else { document.getElementById('feeTypeModal').classList.add('hidden'); document.getElementById('feeTypeModal').classList.remove('flex'); fetchFeeTypes(); toast.success('Saved.'); }
    });

    window.fetchClasses = async function () {
        const container = document.getElementById('classList');
        if (!container) return;
        container.innerHTML = 'Loading...';
        const classesRes = await supabase.from('classes').select('*').order('class_name');
        const data = classesRes.data;
        const error = classesRes.error;
        if (error) { container.innerHTML = 'Error: ' + error.message; return; }
        if (window.sortClassesNatural) window.sortClassesNatural(data, 'class_name');
        container.innerHTML = (data || []).map(cls => `
            <button type="button" data-class-id="${cls.id}" data-class-name="${escapeHtml(cls.class_name)}" class="w-full text-left px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">${escapeHtml(cls.class_name)}</button>
        `).join('');
        container.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                legacySelectedClassId = btn.dataset.classId;
                const name = btn.dataset.className;
                document.getElementById('selectedClassName').textContent = name + ' Fees';
                document.getElementById('noClassSelected').classList.add('hidden');
                document.getElementById('classFeesContainer').classList.remove('hidden');
                fetchClassFees(legacySelectedClassId);
            });
        });
    };
    async function fetchClassFees(classId) {
        const tbody = document.getElementById('classFeesTableBody');
        const tfoot = document.getElementById('totalClassFee');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="3" class="py-4 text-center">Loading...</td></tr>';
        const cfRes = await supabase.from('class_fees').select('id, amount, fee_types(id, name)').eq('class_id', classId);
        const data = cfRes.data;
        const error = cfRes.error;
        if (error) { tbody.innerHTML = '<tr><td colspan="3" class="py-4 text-center text-red-500">Error</td></tr>'; return; }
        let total = 0;
        tbody.innerHTML = (data || []).map(item => {
            total += Number(item.amount);
            return `<tr class="border-b border-gray-100 dark:border-gray-700"><td class="py-3 text-gray-800 dark:text-gray-200">${(item.fee_types && item.fee_types.name) || 'Unknown'}</td><td class="py-3 text-right">${formatMoney(item.amount)}</td><td class="py-3 text-right"><button type="button" data-delete-id="${item.id}" class="text-red-500 text-xs">Remove</button></td></tr>`;
        }).join('');
        if (tfoot) tfoot.textContent = total.toFixed(2);
        tbody.querySelectorAll('[data-delete-id]').forEach(b => b.addEventListener('click', async () => {
            await supabase.from('class_fees').delete().eq('id', b.dataset.deleteId);
            fetchClassFees(classId);
        }));
    }
    const assignFeeBtn = document.getElementById('assignFeeBtn');
    if (assignFeeBtn) assignFeeBtn.addEventListener('click', async () => {
        if (!legacySelectedClassId) { if (toast && toast.warning) toast.warning('Select a class first.'); return; }
        const modal = document.getElementById('assignFeeModal');
        if (modal.parentElement !== document.body) document.body.appendChild(modal);
        const select = document.getElementById('assignFeeTypeSelect');
        select.innerHTML = '<option value="">Loading...</option>';
        const typesRes = await supabase.from('fee_types').select('*').order('name');
        const types = typesRes.data;
        select.innerHTML = (types || []).map(t => `<option value="${t.id}">${escapeHtml(t.name)}</option>`).join('');
        document.getElementById('assignClassId').value = legacySelectedClassId;
        document.getElementById('assignAmount').value = '';
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    });
    const closeAssignFeeModal = document.getElementById('closeAssignFeeModal');
    if (closeAssignFeeModal) closeAssignFeeModal.addEventListener('click', () => { document.getElementById('assignFeeModal').classList.add('hidden'); document.getElementById('assignFeeModal').classList.remove('flex'); });
    const cancelAssignFeeBtn = document.getElementById('cancelAssignFeeBtn');
    if (cancelAssignFeeBtn) cancelAssignFeeBtn.addEventListener('click', () => { document.getElementById('assignFeeModal').classList.add('hidden'); document.getElementById('assignFeeModal').classList.remove('flex'); });
    const assignFeeForm = document.getElementById('assignFeeForm');
    if (assignFeeForm) assignFeeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const classId = document.getElementById('assignClassId').value;
        const fee_type_id = document.getElementById('assignFeeTypeSelect').value;
        const amount = document.getElementById('assignAmount').value;
        const insertRes = await supabase.from('class_fees').insert([{ class_id: classId, fee_type_id, amount }]);
        const error = insertRes.error;
        if (error) toast.error(error.code === '23505' ? 'Already assigned.' : error.message);
        else { document.getElementById('assignFeeModal').classList.add('hidden'); document.getElementById('assignFeeModal').classList.remove('flex'); fetchClassFees(classId); toast.success('Assigned.'); }
    });

    await fetchFeeTypes();
    if (typeof window.fetchClasses === 'function') window.fetchClasses();
}
