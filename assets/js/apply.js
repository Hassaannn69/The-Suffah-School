/**
 * Apply page – Student & Teacher admission forms.
 * Choice screen → multi-step form → submit to Supabase.
 */
(function () {
    const supabase = window.supabase && typeof window.supabase.from === 'function' ? window.supabase : null;

    function showUnavailableBanner() {
        const banner = document.createElement('div');
        banner.className = 'apply-unavailable-banner fixed top-0 left-0 right-0 z-50 bg-amber-500 text-gray-900 px-4 py-3 text-center text-sm font-medium shadow-lg';
        banner.innerHTML = 'Application service is temporarily unavailable. Please contact the school administration to submit your application.';
        document.body.insertBefore(banner, document.body.firstChild);
        const main = document.querySelector('.apply-main');
        if (main) main.style.paddingTop = '52px';
    }

    if (!supabase) {
        console.error('Supabase not loaded – apply form will not submit.');
        showUnavailableBanner();
        // Still run init so choice screen and steps work; submit will show message
    }

    const APPLY_CHOICE = 'apply-choice';
    const APPLY_STUDENT = 'apply-student-form';
    const APPLY_TEACHER = 'apply-teacher-form';
    const APPLY_SUCCESS = 'apply-success';

    const TOTAL_STUDENT_STEPS = 4;
    const TOTAL_TEACHER_STEPS = 4;
    const CV_BUCKET = 'teacher-cvs';
    const CV_MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const CV_ACCEPT = '.pdf,.doc,.docx';

    let studentStep = 1;
    let teacherStep = 1;

    function showScreen(id) {
        document.querySelectorAll('.apply-screen').forEach(el => el.classList.add('hidden'));
        const el = document.getElementById(id);
        if (el) el.classList.remove('hidden');
    }

    function setStudentStep(step) {
        studentStep = step;
        document.querySelectorAll('#apply-student-form .apply-form-step').forEach(el => el.classList.add('hidden'));
        const stepEl = document.querySelector(`#apply-student-form .apply-form-step[data-step="${step}"]`);
        if (stepEl) stepEl.classList.remove('hidden');

        document.querySelectorAll('#apply-student-form .apply-step').forEach((el, i) => {
            const num = i + 1;
            const numEl = el.querySelector('.apply-step-num');
            const labelEl = el.querySelector('.apply-step-label');
            const lineEl = el.nextElementSibling?.classList?.contains('apply-step-line') ? el.nextElementSibling : null;
            if (numEl) {
                numEl.classList.toggle('active', num <= step);
                numEl.classList.toggle('bg-indigo-600', num <= step);
                numEl.classList.toggle('text-white', num <= step);
                numEl.classList.toggle('bg-gray-200', num > step);
                numEl.classList.toggle('text-gray-500', num > step);
            }
            if (labelEl) {
                labelEl.classList.toggle('active', num <= step);
                labelEl.classList.toggle('text-indigo-600', num <= step);
                labelEl.classList.toggle('text-gray-500', num > step);
            }
            if (lineEl && num < 4) lineEl.classList.toggle('completed', num < step);
        });

        document.getElementById('student-prev').classList.toggle('hidden', step <= 1);
        document.getElementById('student-next').classList.toggle('hidden', step >= TOTAL_STUDENT_STEPS);
        document.getElementById('student-submit').classList.toggle('hidden', step !== TOTAL_STUDENT_STEPS);
    }

    function setTeacherStep(step) {
        teacherStep = step;
        document.querySelectorAll('#apply-teacher-form .apply-form-step').forEach(el => el.classList.add('hidden'));
        const stepEl = document.querySelector(`#apply-teacher-form .apply-form-step[data-step="${step}"]`);
        if (stepEl) stepEl.classList.remove('hidden');

        document.querySelectorAll('#apply-teacher-form .apply-step').forEach((el, i) => {
            const num = i + 1;
            const numEl = el.querySelector('.apply-step-num');
            const labelEl = el.querySelector('.apply-step-label');
            const lineEl = el.nextElementSibling?.classList?.contains('apply-step-line') ? el.nextElementSibling : null;
            if (numEl) {
                numEl.classList.toggle('bg-indigo-600', num <= step);
                numEl.classList.toggle('text-white', num <= step);
                numEl.classList.toggle('bg-gray-200', num > step);
                numEl.classList.toggle('text-gray-500', num > step);
            }
            if (labelEl) {
                labelEl.classList.toggle('text-indigo-600', num <= step);
                labelEl.classList.toggle('text-gray-500', num > step);
            }
            if (lineEl && num < 4) lineEl.classList.toggle('completed', num < step);
        });

        document.getElementById('teacher-prev').classList.toggle('hidden', step <= 1);
        document.getElementById('teacher-next').classList.toggle('hidden', step >= TOTAL_TEACHER_STEPS);
        document.getElementById('teacher-submit').classList.toggle('hidden', step !== TOTAL_TEACHER_STEPS);
    }

    function validateStudentStep(step) {
        if (step === 1) {
            const name = document.getElementById('student-name').value.trim();
            const dob = document.getElementById('student-dob').value;
            const gender = document.getElementById('student-gender').value;
            const grade = document.getElementById('student-grade').value;
            if (!name) { showToast('Please enter the student\'s full name.'); return false; }
            if (!dob) { showToast('Please select date of birth.'); return false; }
            if (!gender) { showToast('Please select gender.'); return false; }
            if (!grade) { showToast('Please select class applying for.'); return false; }
        }
        if (step === 2) {
            const parentName = document.getElementById('parent-name').value.trim();
            const relationship = document.getElementById('parent-relationship').value;
            const contact = document.getElementById('parent-contact').value.trim();
            const email = document.getElementById('parent-email').value.trim();
            if (!parentName) { showToast('Please enter parent/guardian name.'); return false; }
            if (!relationship) { showToast('Please select relationship to student.'); return false; }
            if (!contact) { showToast('Please enter contact number.'); return false; }
            if (!email) { showToast('Please enter email address.'); return false; }
        }
        return true;
    }

    function validateTeacherStep(step) {
        if (step === 1) {
            const name = document.getElementById('teacher-name').value.trim();
            const dob = document.getElementById('teacher-dob').value;
            const gender = document.getElementById('teacher-gender').value;
            if (!name) { showToast('Please enter your full name.'); return false; }
            if (!dob) { showToast('Please select date of birth.'); return false; }
            if (!gender) { showToast('Please select gender.'); return false; }
        }
        if (step === 2) {
            const contact = document.getElementById('teacher-contact').value.trim();
            const email = document.getElementById('teacher-email').value.trim();
            if (!contact) { showToast('Please enter contact number.'); return false; }
            if (!email) { showToast('Please enter email address.'); return false; }
        }
        if (step === 3) {
            const cv = document.getElementById('teacher-cv');
            if (!cv || !cv.files || !cv.files.length) { showToast('Please upload your CV/Resume.'); return false; }
            const file = cv.files[0];
            if (file.size > CV_MAX_SIZE) { showToast('CV file must be under 5MB.'); return false; }
        }
        return true;
    }

    function buildStudentReviewHtml() {
        const fmt = (v) => (v == null || String(v).trim() === '' ? '—' : String(v).trim());
        const dob = document.getElementById('student-dob').value;
        const dobFmt = dob ? new Date(dob + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
        return `
            <div class="review-block">
                <h3>Student Information</h3>
                <div class="review-grid">
                    <p><strong>Full Name:</strong> ${escapeHtml(fmt(document.getElementById('student-name').value))}</p>
                    <p><strong>Date of Birth:</strong> ${escapeHtml(dobFmt)}</p>
                    <p><strong>Gender:</strong> ${escapeHtml(fmt(document.getElementById('student-gender').value))}</p>
                    <p><strong>Class Applying For:</strong> ${escapeHtml(fmt(document.getElementById('student-grade').value))}</p>
                </div>
            </div>
            <div class="review-block">
                <h3>Parent / Guardian Details</h3>
                <div class="review-grid">
                    <p><strong>Name:</strong> ${escapeHtml(fmt(document.getElementById('parent-name').value))}</p>
                    <p><strong>Relationship:</strong> ${escapeHtml(fmt(document.getElementById('parent-relationship').value))}</p>
                    <p><strong>Contact:</strong> +92 ${escapeHtml(fmt(document.getElementById('parent-contact').value))}</p>
                    <p><strong>Email:</strong> ${escapeHtml(fmt(document.getElementById('parent-email').value))}</p>
                    <p class="col-span-2"><strong>Address:</strong> ${escapeHtml(fmt(document.getElementById('parent-address').value))}</p>
                    <p class="col-span-2"><strong>Occupation:</strong> ${escapeHtml(fmt(document.getElementById('parent-occupation').value))}</p>
                </div>
            </div>
            <div class="review-block">
                <h3>Educational Background</h3>
                <div class="review-grid">
                    <p><strong>Previous School:</strong> ${escapeHtml(fmt(document.getElementById('previous-school').value))}</p>
                    <p><strong>Last Grade Completed:</strong> ${escapeHtml(fmt(document.getElementById('last-grade').value))}</p>
                    <p><strong>Reason for Leaving:</strong> ${escapeHtml(fmt(document.getElementById('reason-leaving').value))}</p>
                    <p class="col-span-2"><strong>Extra-curricular:</strong> ${escapeHtml(fmt(document.getElementById('extracurricular').value))}</p>
                </div>
            </div>
        `;
    }

    function buildTeacherReviewHtml() {
        const fmt = (v) => (v == null || String(v).trim() === '' ? '—' : String(v).trim());
        const dob = document.getElementById('teacher-dob').value;
        const dobFmt = dob ? new Date(dob + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
        const cv = document.getElementById('teacher-cv');
        const cvName = cv && cv.files && cv.files[0] ? cv.files[0].name : '—';
        return `
            <div class="review-block">
                <h3>Personal Information</h3>
                <div class="review-grid">
                    <p><strong>Full Name:</strong> ${escapeHtml(fmt(document.getElementById('teacher-name').value))}</p>
                    <p><strong>Date of Birth:</strong> ${escapeHtml(dobFmt)}</p>
                    <p><strong>Gender:</strong> ${escapeHtml(fmt(document.getElementById('teacher-gender').value))}</p>
                    <p><strong>Subject(s) / Grade(s):</strong> ${escapeHtml(fmt(document.getElementById('teacher-subjects').value))}</p>
                </div>
            </div>
            <div class="review-block">
                <h3>Contact & Address</h3>
                <div class="review-grid">
                    <p><strong>Contact:</strong> +92 ${escapeHtml(fmt(document.getElementById('teacher-contact').value))}</p>
                    <p><strong>Email:</strong> ${escapeHtml(fmt(document.getElementById('teacher-email').value))}</p>
                    <p class="col-span-2"><strong>Address:</strong> ${escapeHtml(fmt(document.getElementById('teacher-address').value))}</p>
                    <p class="col-span-2"><strong>Qualifications:</strong> ${escapeHtml(fmt(document.getElementById('teacher-qualifications').value))}</p>
                </div>
            </div>
            <div class="review-block">
                <h3>Experience & CV</h3>
                <div class="review-grid">
                    <p><strong>Experience (years):</strong> ${escapeHtml(fmt(document.getElementById('teacher-experience').value))}</p>
                    <p><strong>Previous School:</strong> ${escapeHtml(fmt(document.getElementById('teacher-previous-school').value))}</p>
                    <p class="col-span-2"><strong>CV File:</strong> ${escapeHtml(cvName)}</p>
                </div>
            </div>
        `;
    }

    function escapeHtml(s) {
        if (s == null) return '';
        const div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    async function submitStudentApplication(isDraft) {
        if (!supabase) {
            showToast('Application service is unavailable. Please contact the school administration.');
            return;
        }
        const payload = {
            status: 'pending',
            student_name: document.getElementById('student-name').value.trim(),
            date_of_birth: document.getElementById('student-dob').value || null,
            gender: document.getElementById('student-gender').value || null,
            grade_applying: document.getElementById('student-grade').value,
            parent_name: document.getElementById('parent-name').value.trim(),
            parent_relationship: document.getElementById('parent-relationship').value || 'Father',
            parent_contact: document.getElementById('parent-contact').value.trim() ? '+92 ' + document.getElementById('parent-contact').value.trim() : null,
            parent_email: document.getElementById('parent-email').value.trim() || null,
            parent_occupation: document.getElementById('parent-occupation').value.trim() || null,
            previous_school: document.getElementById('previous-school').value.trim() || null,
            reason_for_leaving: document.getElementById('reason-leaving').value.trim() || null,
            home_address: document.getElementById('parent-address').value.trim() || null,
            extra_curricular: document.getElementById('extracurricular').value.trim() || null,
            last_grade_completed: document.getElementById('last-grade').value.trim() || null,
            updated_at: new Date().toISOString()
        };
        const { error } = await supabase.from('online_applications').insert([payload]);
        if (error) {
            console.error('Student application insert error:', error);
            const generic = error.code === '42501' || error.message?.includes('row-level security')
                ? 'Submission is not allowed at the moment. Please contact the school administration.'
                : 'Unable to submit application. Please try again. If this continues, contact the school administration.';
            const detail = (error.message || error.code || '').toString().trim();
            showToast(detail ? generic + ' Error: ' + (detail.length > 60 ? detail.slice(0, 60) + '…' : detail) : generic);
            return;
        }
        document.getElementById('apply-success-message').textContent = 'Thank you. We have received your application and will review it shortly.';
        showScreen(APPLY_SUCCESS);
    }

    async function uploadTeacherCV() {
        const input = document.getElementById('teacher-cv');
        if (!input || !input.files || !input.files[0]) return null;
        const file = input.files[0];
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const path = safeName;

        const { data, error } = await supabase.storage.from(CV_BUCKET).upload(path, file, {
            cacheControl: '3600',
            upsert: false
        });
        if (error) {
            console.error('CV upload error:', error);
            return null;
        }
        const { data: urlData } = supabase.storage.from(CV_BUCKET).getPublicUrl(data.path);
        return urlData?.publicUrl || null;
    }

    async function submitTeacherApplication() {
        if (!supabase) {
            showToast('Application service is unavailable. Please contact the school administration.');
            return;
        }
        let cvUrl = null;
        try {
            cvUrl = await uploadTeacherCV();
        } catch (e) {
            console.error('CV upload failed:', e);
        }
        const payload = {
            status: 'pending',
            full_name: document.getElementById('teacher-name').value.trim(),
            date_of_birth: document.getElementById('teacher-dob').value || null,
            gender: document.getElementById('teacher-gender').value || null,
            subjects_grades: document.getElementById('teacher-subjects').value.trim() || null,
            contact_number: document.getElementById('teacher-contact').value.trim() ? '+92 ' + document.getElementById('teacher-contact').value.trim() : null,
            email: document.getElementById('teacher-email').value.trim() || null,
            home_address: document.getElementById('teacher-address').value.trim() || null,
            qualifications: document.getElementById('teacher-qualifications').value.trim() || null,
            experience_years: document.getElementById('teacher-experience').value ? parseInt(document.getElementById('teacher-experience').value, 10) : null,
            previous_school: document.getElementById('teacher-previous-school').value.trim() || null,
            cv_url: cvUrl,
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from('teacher_applications').insert([payload]);
        if (error) {
            console.error('Teacher application insert error:', error);
            const generic = error.code === '42501' || error.message?.includes('row-level security')
                ? 'Submission is not allowed at the moment. Please contact the school administration.'
                : 'Unable to submit application. Please try again. If this continues, contact the school administration.';
            const detail = (error.message || error.code || '').toString().trim();
            showToast(detail ? generic + ' Error: ' + (detail.length > 60 ? detail.slice(0, 60) + '…' : detail) : generic);
            return;
        }
        document.getElementById('apply-success-message').textContent = 'Thank you. We have received your teacher application and will review it shortly.';
        showScreen(APPLY_SUCCESS);
    }

    function showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl text-sm font-medium z-[9999] transform transition-all duration-300 translate-y-4 opacity-0';
        toast.textContent = message;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.remove('translate-y-4', 'opacity-0'));
        setTimeout(() => {
            toast.classList.add('translate-y-4', 'opacity-0');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    function initChoice() {
        document.getElementById('apply-as-student').addEventListener('click', () => {
            showScreen(APPLY_STUDENT);
            setStudentStep(1);
        });
        document.getElementById('apply-as-teacher').addEventListener('click', () => {
            showScreen(APPLY_TEACHER);
            setTeacherStep(1);
        });
    }

    function initStudentForm() {
        document.getElementById('student-next').addEventListener('click', () => {
            if (!validateStudentStep(studentStep)) return;
            if (studentStep < TOTAL_STUDENT_STEPS) {
                if (studentStep === 3) {
                    document.getElementById('student-review-content').innerHTML = buildStudentReviewHtml();
                }
                setStudentStep(studentStep + 1);
            }
        });
        document.getElementById('student-prev').addEventListener('click', () => {
            if (studentStep > 1) setStudentStep(studentStep - 1);
        });
        document.getElementById('student-save-draft').addEventListener('click', () => {
            if (!validateStudentStep(1) || !validateStudentStep(2)) return;
            submitStudentApplication(true);
        });
        document.getElementById('student-submit').addEventListener('click', () => {
            submitStudentApplication(false);
        });
    }

    function initTeacherForm() {
        document.getElementById('teacher-next').addEventListener('click', () => {
            if (!validateTeacherStep(teacherStep)) return;
            if (teacherStep < TOTAL_TEACHER_STEPS) {
                if (teacherStep === 3) {
                    document.getElementById('teacher-review-content').innerHTML = buildTeacherReviewHtml();
                }
                setTeacherStep(teacherStep + 1);
            }
        });
        document.getElementById('teacher-prev').addEventListener('click', () => {
            if (teacherStep > 1) setTeacherStep(teacherStep - 1);
        });
        document.getElementById('teacher-submit').addEventListener('click', () => {
            if (!validateTeacherStep(1) || !validateTeacherStep(2) || !validateTeacherStep(3)) return;
            submitTeacherApplication();
        });
    }

    function initBackToChoice() {
        const studentForm = document.getElementById('apply-student-form');
        const teacherForm = document.getElementById('apply-teacher-form');
        if (studentForm && !studentForm.querySelector('[data-back-to-choice]')) {
            const back = document.createElement('a');
            back.href = 'apply.html';
            back.textContent = '← Choose another application type';
            back.className = 'text-indigo-600 hover:underline text-sm mb-4 inline-block';
            back.setAttribute('data-back-to-choice', '1');
            studentForm.querySelector('.apply-card').insertBefore(back, studentForm.querySelector('.apply-progress'));
        }
        if (teacherForm && !teacherForm.querySelector('[data-back-to-choice]')) {
            const back = document.createElement('a');
            back.href = 'apply.html';
            back.textContent = '← Choose another application type';
            back.className = 'text-indigo-600 hover:underline text-sm mb-4 inline-block';
            back.setAttribute('data-back-to-choice', '1');
            teacherForm.querySelector('.apply-card').insertBefore(back, teacherForm.querySelector('.apply-progress'));
        }
    }

    function setFooterYear() {
        const y = document.getElementById('apply-year');
        if (y) y.textContent = new Date().getFullYear();
    }

    function init() {
        initChoice();
        initStudentForm();
        initTeacherForm();
        initBackToChoice();
        setFooterYear();
        showScreen(APPLY_CHOICE);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
