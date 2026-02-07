/**
 * Add Student – Full-page multi-step form.
 * Steps: 1) Student Info  2) Parent Info  3) Academic Info  4) Review & Submit
 */

const supabase = window.supabase || (() => { throw new Error('Supabase client not initialized'); })();

let availableClasses = [];
let currentStep = 1;
const TOTAL_STEPS = 4;
const STEP_LABELS = ['Student', 'Parents', 'Academic', 'Review'];

// ── Class code mapping (mirrors students.js) ──
const CLASS_MAP = {
    'play group': '01', 'pg': '01', 'prep': '02',
    'class 1': '03', '1': '03', 'class 2': '04', '2': '04',
    'class 3': '05', '3': '05', 'class 4': '06', '4': '06',
    'class 5': '07', '5': '07', 'class 6': '08', '6': '08',
    'class 7': '09', '7': '09', 'class 8': '10', '8': '10',
    'class 9': '11', '9': '11', 'class 10': '12', '10': '12'
};

function getClassCode(className) {
    const n = className.toLowerCase().replace(/\s*\([a-z]\)$/i, '').trim();
    return CLASS_MAP[n] || '99';
}

async function getNextRollNumber(className) {
    const year = new Date().getFullYear();
    const yearCode = year.toString().slice(-2);
    const classCode = getClassCode(className);
    try {
        const { data, error } = await supabase
            .from('students')
            .select('roll_no')
            .eq('admission_year', year)
            .ilike('class', `%${className.split('(')[0].trim()}%`)
            .order('roll_no', { ascending: false })
            .limit(1);
        if (error) throw error;
        let next = 1;
        if (data && data.length > 0) {
            const m = data[0].roll_no.match(/SUF\d{2}\d{2}(\d{4})$/);
            if (m) next = parseInt(m[1]) + 1;
        }
        return `SUF${yearCode}${classCode}${next.toString().padStart(4, '0')}`;
    } catch (err) {
        return `SUF${yearCode}${classCode}0001`;
    }
}

// ── Validation helpers ──
function validatePhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 11 && cleaned.startsWith('0');
}
function validateCNIC(cnic) {
    return /^\d{5}-\d{7}-\d{1}$/.test(cnic);
}
function formatCNICInput(e) {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 13) v = v.substring(0, 13);
    if (v.length > 5) v = v.substring(0, 5) + '-' + v.substring(5);
    if (v.length > 13) v = v.substring(0, 13) + '-' + v.substring(13);
    e.target.value = v;
}

// ── Family Code helpers ──
let autoFamilyCode = '';   // the auto-generated value
let familyCodeIsAuto = true;  // whether the field is using auto value
let fcLookupTimer = null;

async function getNextFamilyCode() {
    try {
        const { data, error } = await supabase
            .from('students')
            .select('family_code')
            .not('family_code', 'is', null)
            .ilike('family_code', 'FAM-%')
            .order('family_code', { ascending: false })
            .limit(1);
        if (error) throw error;
        let next = 1;
        if (data && data.length > 0) {
            const m = data[0].family_code.match(/^FAM-(\d+)$/i);
            if (m) next = parseInt(m[1]) + 1;
        }
        return `FAM-${next.toString().padStart(3, '0')}`;
    } catch (err) {
        return `FAM-001`;
    }
}

async function lookupFamilyCode(code) {
    if (!code || code.length < 3) return null;
    try {
        const { data, error } = await supabase
            .from('students')
            .select('name, class, father_name, family_code')
            .eq('family_code', code)
            .order('name');
        if (error) throw error;
        return (data && data.length > 0) ? data : null;
    } catch (err) {
        return null;
    }
}

// ── Field value helpers ──
function val(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }

// ── Entry point ──
export async function render(container) {
    container.innerHTML = `<div class="flex items-center justify-center py-16"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>`;

    // Load classes + auto-generate family code in parallel
    const [classRes] = await Promise.all([
        supabase.from('classes').select('class_name, sections').order('class_name'),
        getNextFamilyCode().then(fc => { autoFamilyCode = fc; })
    ]);
    availableClasses = classRes.data || [];
    if (window.sortClassesNatural) window.sortClassesNatural(availableClasses, 'class_name');

    // Reset family code state
    familyCodeIsAuto = true;
    formData.family_code = autoFamilyCode;

    currentStep = 1;
    renderForm(container);
}

// ── Main render ──
function renderForm(container) {
    container.innerHTML = `
        <!-- Stepper -->
        <div class="max-w-3xl mx-auto mb-8">
            <div class="flex items-center justify-between">
                ${STEP_LABELS.map((label, i) => {
                    const step = i + 1;
                    const done = step < currentStep;
                    const active = step === currentStep;
                    return `
                        <div class="flex flex-col items-center flex-1 relative">
                            ${i > 0 ? `<div class="absolute top-5 right-1/2 w-full h-0.5 ${done || active ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-700'} -z-10"></div>` : ''}
                            <div class="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold z-10 transition-all ${
                                done ? 'bg-primary-600 text-white' :
                                active ? 'bg-primary-600 text-white ring-4 ring-primary-500/20' :
                                'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                            }">
                                ${done ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>' : step}
                            </div>
                            <span class="mt-2 text-xs font-semibold ${active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}">${label}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>

        <!-- Form card -->
        <div class="max-w-3xl mx-auto">
            <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div class="p-8">
                    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-1">Add New Student</h2>
                    <p class="text-gray-500 dark:text-gray-400 text-sm mb-8">Please fill out the form carefully to register a new student.</p>

                    <form id="addStudentForm" autocomplete="off">
                        ${stepContent(currentStep)}
                    </form>
                </div>

                <!-- Footer actions -->
                <div class="px-8 py-5 border-t border-gray-200 dark:border-gray-800 flex items-center ${currentStep === 1 ? 'justify-end' : 'justify-between'}">
                    ${currentStep > 1 ? `
                        <button type="button" id="as-prev" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                            Back
                        </button>
                    ` : ''}
                    <div class="flex gap-3">
                        ${currentStep === TOTAL_STEPS ? `
                            <button type="button" id="as-cancel" class="px-5 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                Cancel
                            </button>
                            <button type="button" id="as-submit" class="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                                Save Student
                            </button>
                        ` : `
                            <button type="button" id="as-next" class="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20">
                                Next
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                            </button>
                        `}
                    </div>
                </div>
            </div>

            <!-- Help footer -->
            <p class="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
                Need help? Contact the <span class="underline cursor-pointer">Admin Office</span> or call <span class="font-medium">+92 (XXX) XXX-XXXX</span>
            </p>
        </div>
    `;

    bindStepEvents(container);
}

// ── Step HTML ──
function stepContent(step) {
    switch (step) {
        case 1: return step1_student();
        case 2: return step2_parents();
        case 3: return step3_academic();
        case 4: return step4_review();
        default: return '';
    }
}

function inputClass(extra = '') {
    return `w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-colors ${extra}`;
}

function labelClass() {
    return 'block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5';
}

function selectClass() {
    return inputClass('appearance-none');
}

function sectionHeading(icon, title) {
    return `<div class="flex items-center gap-3 mb-6"><span class="text-xl">${icon}</span><h3 class="text-base font-bold text-gray-900 dark:text-white">${title}</h3></div>`;
}

// ─── Step 1: Student Info ───
function step1_student() {
    return `
        ${sectionHeading('🎓', 'Student Information')}
        <div class="space-y-5">
            <div>
                <label class="${labelClass()}">Full Name of Student <span class="text-red-500">*</span></label>
                <input type="text" id="as-name" class="${inputClass()}" placeholder="Enter legal full name" required>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label class="${labelClass()}">Date of Birth <span class="text-red-500">*</span></label>
                    <input type="date" id="as-dob" class="${inputClass()}" required>
                </div>
                <div>
                    <label class="${labelClass()}">Gender <span class="text-red-500">*</span></label>
                    <select id="as-gender" class="${selectClass()}" required>
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                    </select>
                </div>
            </div>
            <div>
                <label class="${labelClass()}">Contact Number <span class="text-red-500">*</span></label>
                <input type="tel" id="as-phone" class="${inputClass()}" maxlength="11" placeholder="03001234567" required>
            </div>
        </div>
    `;
}

// ─── Step 2: Parent Info ───
function step2_parents() {
    return `
        ${sectionHeading('👨‍👩‍👦', 'Parent / Guardian Details')}
        <div class="space-y-5">
            <div>
                <label class="${labelClass()}">Father Name <span class="text-red-500">*</span></label>
                <input type="text" id="as-father-name" class="${inputClass()}" placeholder="Enter father's name" required>
            </div>
            <div>
                <label class="${labelClass()}">Father CNIC Number <span class="text-red-500">*</span></label>
                <input type="text" id="as-father-cnic" class="${inputClass()}" maxlength="15" placeholder="12345-1234567-1" required>
            </div>
            <!-- Family Code – smart auto-generated + live lookup -->
            <div>
                <label class="${labelClass()}">Family Code</label>
                <div class="relative flex items-stretch">
                    <span class="inline-flex items-center px-3.5 rounded-l-xl border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-sm font-bold text-gray-600 dark:text-gray-300 select-none">FAM-</span>
                    <input type="text" id="as-family-code" class="flex-1 px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-r-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent outline-none text-sm transition-colors pr-24" maxlength="10" placeholder="001" inputmode="numeric">
                    <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                        <span id="as-fc-badge" class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${familyCodeIsAuto ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400' : 'hidden'}">Auto</span>
                        <button type="button" id="as-fc-reset" class="${familyCodeIsAuto ? 'hidden' : ''} p-1 rounded-md text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="Use auto-generated code">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                        </button>
                    </div>
                </div>
                <!-- Family preview panel (appears when existing code is typed) -->
                <div id="as-fc-preview" class="hidden mt-2 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl transition-all duration-200 animate-fade-in">
                    <div id="as-fc-preview-content"></div>
                </div>
                <p id="as-fc-hint" class="mt-1.5 text-xs text-gray-400 dark:text-gray-500">Auto-generated for new families. Type an existing number to link siblings.</p>
            </div>
        </div>
    `;
}

// ─── Step 3: Academic Info ───
function step3_academic() {
    const classOpts = availableClasses.map(c => `<option value="${c.class_name}">${c.class_name}</option>`).join('');
    return `
        ${sectionHeading('🎒', 'Academic Information')}
        <div class="space-y-5">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label class="${labelClass()}">Class <span class="text-red-500">*</span></label>
                    <select id="as-class" class="${selectClass()}" required>
                        <option value="">Select Class</option>
                        ${classOpts}
                    </select>
                </div>
                <div>
                    <label class="${labelClass()}">Section <span class="text-red-500">*</span></label>
                    <select id="as-section" class="${selectClass()}" required>
                        <option value="">Select Section</option>
                    </select>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label class="${labelClass()}">Roll Number</label>
                    <input type="text" id="as-roll" class="${inputClass('bg-gray-100 dark:bg-gray-800/60 cursor-not-allowed')}" placeholder="Auto-generated" readonly>
                </div>
                <div>
                    <label class="${labelClass()}">Admission Date</label>
                    <input type="date" id="as-admission-date" class="${inputClass()}" value="${new Date().toISOString().split('T')[0]}">
                </div>
            </div>
            <div>
                <label class="${labelClass()}">Previous School Attended <span class="text-gray-400 font-normal">(optional)</span></label>
                <input type="text" id="as-prev-school" class="${inputClass()}" placeholder="Name of previous institution">
            </div>
            <div>
                <label class="${labelClass()}">Email <span class="text-gray-400 font-normal">(optional – auto-generated if left empty)</span></label>
                <input type="email" id="as-email" class="${inputClass()}" placeholder="student@gmail.com">
            </div>
        </div>
    `;
}

// ─── Step 4: Review ───
function step4_review() {
    const d = gatherData();
    return `
        <div class="mb-6">
            <div class="flex items-center gap-3 mb-2"><span class="text-xl">📋</span><h3 class="text-base font-bold text-gray-900 dark:text-white">Review Details</h3></div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Please verify all information before saving.</p>
        </div>

        ${reviewSection('Student Information', [
            ['Full Name', d.name],
            ['Date of Birth', d.date_of_birth || '—'],
            ['Gender', d.gender || '—'],
            ['Contact', d.phone || '—']
        ])}

        ${reviewSection('Parent / Guardian', [
            ['Father Name', d.father_name],
            ['Father CNIC', d.father_cnic],
            ['Family Code', (d.family_code || '—') + (familyCodeIsAuto ? ' <span class="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400">Auto</span>' : '')]
        ])}

        ${reviewSection('Academic Information', [
            ['Class', d.class || '—'],
            ['Section', d.section || '—'],
            ['Roll Number', d.roll_no || 'Auto-generated'],
            ['Admission Date', d.admission_date || '—'],
            ['Previous School', d.from_which_school || '—'],
            ['Email', d.email || 'Auto-generated']
        ])}
    `;
}

function reviewSection(title, rows) {
    return `
        <div class="mb-6 p-5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
            <h4 class="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">${title}</h4>
            <div class="grid grid-cols-2 gap-x-6 gap-y-3">
                ${rows.map(([label, value]) => `
                    <div>
                        <p class="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">${label}</p>
                        <p class="text-sm font-medium text-gray-900 dark:text-white mt-0.5">${value}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// ── Persisted form data across steps ──
const formData = {};

function saveCurrentStep() {
    switch (currentStep) {
        case 1:
            formData.name = val('as-name');
            formData.date_of_birth = val('as-dob');
            formData.gender = val('as-gender');
            formData.phone = val('as-phone');
            break;
        case 2:
            formData.father_name = val('as-father-name');
            formData.father_cnic = val('as-father-cnic');
            const fcNum = val('as-family-code');
            formData.family_code = fcNum ? `FAM-${fcNum}` : '';
            break;
        case 3:
            formData.class = val('as-class');
            formData.section = val('as-section');
            formData.roll_no = val('as-roll');
            formData.admission_date = val('as-admission-date');
            formData.from_which_school = val('as-prev-school');
            formData.email = val('as-email');
            break;
    }
}

function restoreStepValues() {
    requestAnimationFrame(() => {
        switch (currentStep) {
            case 1:
                setVal('as-name', formData.name);
                setVal('as-dob', formData.date_of_birth);
                setVal('as-gender', formData.gender);
                setVal('as-phone', formData.phone);
                break;
            case 2:
                setVal('as-father-name', formData.father_name);
                setVal('as-father-cnic', formData.father_cnic);
                setVal('as-family-code', (formData.family_code || autoFamilyCode).replace(/^FAM-/i, ''));
                // Restore auto/manual badge state
                (() => {
                    const badge = document.getElementById('as-fc-badge');
                    const reset = document.getElementById('as-fc-reset');
                    if (familyCodeIsAuto) {
                        if (badge) badge.classList.remove('hidden');
                        if (reset) reset.classList.add('hidden');
                    } else {
                        if (badge) badge.classList.add('hidden');
                        if (reset) reset.classList.remove('hidden');
                    }
                })();
                break;
            case 3:
                setVal('as-class', formData.class);
                // Populate sections after class is set
                handleClassChangeAS();
                setVal('as-section', formData.section);
                setVal('as-roll', formData.roll_no);
                setVal('as-admission-date', formData.admission_date || new Date().toISOString().split('T')[0]);
                setVal('as-prev-school', formData.from_which_school);
                setVal('as-email', formData.email);
                break;
        }
    });
}

function setVal(id, value) {
    const el = document.getElementById(id);
    if (el && value != null) el.value = value;
}

function gatherData() {
    return { ...formData };
}

// ── Step validation ──
function validateStep(step) {
    switch (step) {
        case 1: {
            if (!formData.name) return showError('Full Name is required.');
            if (!formData.date_of_birth) return showError('Date of Birth is required.');
            if (!formData.gender) return showError('Gender is required.');
            if (!formData.phone) return showError('Contact Number is required.');
            if (!validatePhone(formData.phone)) return showError('Invalid phone number. Enter 11 digits starting with 0 (e.g., 03001234567).');
            return true;
        }
        case 2: {
            if (!formData.father_name) return showError('Father Name is required.');
            if (!formData.father_cnic) return showError('Father CNIC is required.');
            if (!validateCNIC(formData.father_cnic)) return showError('Invalid CNIC format. Use: 12345-1234567-1');
            return true;
        }
        case 3: {
            if (!formData.class) return showError('Class is required.');
            if (!formData.section) return showError('Section is required.');
            return true;
        }
        default: return true;
    }
}

function showError(msg) {
    // Inline error toast
    let errEl = document.getElementById('as-error');
    if (!errEl) {
        errEl = document.createElement('div');
        errEl.id = 'as-error';
        errEl.className = 'fixed bottom-6 right-6 bg-red-600 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-medium z-[9999] transform transition-all duration-300';
        document.body.appendChild(errEl);
    }
    errEl.textContent = msg;
    errEl.classList.remove('opacity-0', 'translate-y-4');
    clearTimeout(errEl._timer);
    errEl._timer = setTimeout(() => {
        errEl.classList.add('opacity-0', 'translate-y-4');
        setTimeout(() => errEl.remove(), 300);
    }, 3500);
    return false;
}

function showToast(msg, type = 'success') {
    const colors = { success: 'bg-green-600', error: 'bg-red-600' };
    const t = document.createElement('div');
    t.className = `fixed bottom-6 right-6 ${colors[type] || colors.success} text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-medium z-[9999] transform transition-all duration-300 translate-y-4 opacity-0`;
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.remove('translate-y-4', 'opacity-0'));
    setTimeout(() => { t.classList.add('translate-y-4', 'opacity-0'); setTimeout(() => t.remove(), 300); }, 3000);
}

// ── Academic step: class → section + roll number ──
function handleClassChangeAS() {
    const classSelect = document.getElementById('as-class');
    const sectionSelect = document.getElementById('as-section');
    if (!classSelect || !sectionSelect) return;

    const className = classSelect.value;
    sectionSelect.innerHTML = '<option value="">Select Section</option>';

    if (!className) return;
    const found = availableClasses.find(c => c.class_name === className);
    if (found && found.sections && found.sections.length > 0) {
        sectionSelect.innerHTML += found.sections.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    // Auto-generate roll number
    const rollInput = document.getElementById('as-roll');
    if (rollInput) {
        rollInput.value = 'Generating...';
        getNextRollNumber(className).then(rn => { rollInput.value = rn; formData.roll_no = rn; }).catch(() => { rollInput.value = 'Error'; });
    }
}

// ── Event binding ──
function bindStepEvents(container) {
    const nextBtn = document.getElementById('as-next');
    const prevBtn = document.getElementById('as-prev');
    const submitBtn = document.getElementById('as-submit');
    const cancelBtn = document.getElementById('as-cancel');

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            saveCurrentStep();
            if (validateStep(currentStep)) {
                currentStep++;
                renderForm(container);
                restoreStepValues();
            }
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            saveCurrentStep();
            currentStep--;
            renderForm(container);
            restoreStepValues();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', async () => {
            const confirmed = await window.confirmDialog.show({
                title: 'Cancel Form',
                message: 'Are you sure you want to cancel? All entered data will be lost.',
                confirmText: 'Yes, Cancel',
                cancelText: 'No, Stay',
                type: 'warning'
            });
            if (confirmed) {
                Object.keys(formData).forEach(k => delete formData[k]);
                currentStep = 1;
                window.loadModule('students');
            }
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', () => handleSubmit(container, submitBtn));
    }

    // CNIC auto-format
    const cnicInput = document.getElementById('as-father-cnic');
    if (cnicInput) cnicInput.addEventListener('input', formatCNICInput);

    // Class change → populate sections + roll number
    const classSelect = document.getElementById('as-class');
    if (classSelect) classSelect.addEventListener('change', handleClassChangeAS);

    // Family Code: live lookup + auto/manual toggle
    bindFamilyCodeEvents();

    // Restore values if coming back to a step
    restoreStepValues();
}

// ── Family Code smart field ──
function bindFamilyCodeEvents() {
    const fcInput = document.getElementById('as-family-code');
    const fcBadge = document.getElementById('as-fc-badge');
    const fcReset = document.getElementById('as-fc-reset');
    const fcPreview = document.getElementById('as-fc-preview');
    const fcPreviewContent = document.getElementById('as-fc-preview-content');
    if (!fcInput) return;

    // Extract the number part of the auto-generated code for comparison
    const autoNum = autoFamilyCode.replace(/^FAM-/i, '');

    // When user types → switch to manual mode + debounced lookup
    fcInput.addEventListener('input', () => {
        const typed = fcInput.value.trim();

        // If user clears the field or types something different from auto
        if (typed !== autoNum) {
            familyCodeIsAuto = false;
            if (fcBadge) fcBadge.classList.add('hidden');
            if (fcReset) fcReset.classList.remove('hidden');
        } else {
            familyCodeIsAuto = true;
            if (fcBadge) fcBadge.classList.remove('hidden');
            if (fcReset) fcReset.classList.add('hidden');
        }

        // Debounced family lookup (prepend FAM- for the DB query)
        clearTimeout(fcLookupTimer);
        if (typed.length >= 1) {
            fcLookupTimer = setTimeout(async () => {
                const fullCode = `FAM-${typed}`;
                const family = await lookupFamilyCode(fullCode);
                renderFamilyPreview(family, fcPreview, fcPreviewContent);
            }, 350);
        } else {
            if (fcPreview) fcPreview.classList.add('hidden');
        }
    });

    // Reset button → revert to auto-generated
    if (fcReset) {
        fcReset.addEventListener('click', () => {
            fcInput.value = autoNum;
            familyCodeIsAuto = true;
            if (fcBadge) fcBadge.classList.remove('hidden');
            fcReset.classList.add('hidden');
            if (fcPreview) fcPreview.classList.add('hidden');
        });
    }
}

function renderFamilyPreview(familyData, previewEl, contentEl) {
    if (!previewEl || !contentEl) return;
    if (!familyData || familyData.length === 0) {
        previewEl.classList.add('hidden');
        return;
    }

    const parentName = familyData[0].father_name || '—';
    const code = familyData[0].family_code;

    contentEl.innerHTML = `
        <div class="flex items-center gap-2 mb-3">
            <div class="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                <svg class="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <div>
                <p class="text-xs font-bold text-gray-900 dark:text-white">Existing Family Found</p>
                <p class="text-[10px] text-gray-500 dark:text-gray-400">${code} &middot; Parent: ${parentName}</p>
            </div>
        </div>
        <div class="space-y-1.5">
            ${familyData.map(s => `
                <div class="flex items-center gap-2.5 px-3 py-2 bg-white dark:bg-gray-900/60 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div class="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-600 dark:text-gray-300">
                        ${(s.name || '?').charAt(0).toUpperCase()}
                    </div>
                    <span class="text-sm font-medium text-gray-900 dark:text-white flex-1">${s.name || '—'}</span>
                    <span class="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">${s.class || '—'}</span>
                </div>
            `).join('')}
        </div>
        <p class="mt-2.5 text-[10px] text-gray-400 dark:text-gray-500">This student will be linked to this family.</p>
    `;
    previewEl.classList.remove('hidden');
}

// ── Submit ──
async function handleSubmit(container, btn) {
    const d = gatherData();
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<svg class="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Saving...';

    try {
        // Duplicate check
        const { data: existing } = await supabase
            .from('students')
            .select('id')
            .eq('name', d.name)
            .eq('father_name', d.father_name)
            .eq('father_cnic', d.father_cnic)
            .maybeSingle();

        if (existing) {
            showError('Duplicate: A student with this Name, Father Name, and CNIC already exists.');
            btn.disabled = false;
            btn.innerHTML = originalText;
            return;
        }

        let email = d.email;
        if (!email) email = `${d.roll_no}@student.suffah.school`;

        const studentData = {
            name: d.name,
            roll_no: d.roll_no,
            class: d.class,
            section: d.section,
            email,
            phone: d.phone,
            gender: d.gender,
            date_of_birth: d.date_of_birth,
            password_changed: false,
            father_name: d.father_name,
            father_cnic: d.father_cnic,
            from_which_school: d.from_which_school || null,
            family_code: d.family_code || null,
            admission_date: d.admission_date || new Date().toISOString().split('T')[0],
            admission_year: new Date().getFullYear()
        };

        // Apply active fee structure at admission (version + snapshot; discounts applied once)
        let feeResult = null;
        try {
            const { applyFeeStructureAtAdmission } = await import('./fee_admission.js');
            feeResult = await applyFeeStructureAtAdmission(supabase, {
                className: d.class,
                familyCode: d.family_code || null,
                isStaffChild: false,
                earlyAdmission: false
            });
        } catch (e) {
            console.warn('Fee structure at admission:', e);
        }
        if (feeResult) {
            studentData.fee_structure_version_id = feeResult.versionId;
            if (feeResult.tuition_fee != null) studentData.tuition_fee = feeResult.tuition_fee;
            if (feeResult.admission_fee != null) studentData.admission_fee = feeResult.admission_fee;
        }

        const result = await supabase.from('students').insert([studentData]).select();
        if (result.error) throw result.error;

        const student = result.data ? result.data[0] : null;
        if (student && feeResult) {
            try {
                const { saveStudentFeeSnapshot } = await import('./fee_admission.js');
                await saveStudentFeeSnapshot(supabase, student.id, feeResult, {
                    tuition_fee: feeResult.tuition_fee,
                    admission_fee: feeResult.admission_fee
                });
            } catch (e) {
                console.warn('Save fee snapshot:', e);
            }
        }

        // Auth sync
        if (student && student.date_of_birth) {
            await syncStudentAuth(student);
        }

        showToast('Student added successfully!');
        Object.keys(formData).forEach(k => delete formData[k]);
        currentStep = 1;

        // Navigate to student list after a short delay
        setTimeout(() => window.loadModule('students'), 800);

    } catch (err) {
        console.error('Error saving student:', err);
        showError('Error saving student: ' + err.message);
        btn.disabled = false;
        btn.innerHTML = originalText;
    }
}

// ── Auth sync (mirrors students.js) ──
async function syncStudentAuth(student) {
    try {
        const password = student.date_of_birth.split('-').reverse().join('');
        const loginEmail = `${student.roll_no.toLowerCase()}@student.suffah.school`;
        const tempClient = window.SupabaseLib.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
        });
        const { data, error } = await tempClient.auth.signUp({
            email: loginEmail,
            password,
            options: { data: { role: 'student', name: student.name, roll_no: student.roll_no } }
        });
        if (error && !error.message.includes('already registered')) throw error;
        if (data && data.user) {
            await supabase.from('students').update({ auth_id: data.user.id }).eq('id', student.id);
        }
    } catch (err) {
        console.error('Student Auth Sync Failed:', err);
    }
}
