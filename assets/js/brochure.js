/**
 * Brochure page: Load fee schedule from active fee structure (Supabase), then PDF download.
 * Uses html2pdf.js to generate PDF from #brochure-pdf-content.
 */
(function () {
    const pdfContentEl = document.getElementById('brochure-pdf-content');
    const downloadBtn = document.getElementById('brochure-download-pdf');
    const loadingEl = document.getElementById('brochure-fee-loading');
    const tableEl = document.getElementById('brochure-fee-table');
    const tbodyEl = document.getElementById('brochure-fee-tbody');
    const errorEl = document.getElementById('brochure-fee-error');
    const versionBadge = document.getElementById('brochure-version-badge');
    const pdfVersionBadge = document.getElementById('brochure-pdf-version-badge');
    const discountNote = document.getElementById('brochure-discount-note');

    function formatFee(n) {
        const v = parseFloat(n);
        if (isNaN(v)) return '—';
        return (Math.round(v * 100) / 100).toLocaleString() + '/-';
    }

    function setVersionLabel(label) {
        const text = label ? 'MONTHLY FEE SCHEDULE (' + label + ')' : 'MONTHLY FEE SCHEDULE';
        if (versionBadge) versionBadge.textContent = text;
        if (pdfVersionBadge) pdfVersionBadge.textContent = text;
    }

    async function loadFeeSchedule() {
        if (!loadingEl || !tbodyEl || !tableEl || !errorEl) return;
        if (!window.supabase || typeof window.supabase.from !== 'function') {
            loadingEl.classList.add('hidden');
            errorEl.classList.remove('hidden');
            return;
        }
        try {
            var verRes = await window.supabase
                .from('fee_structure_versions')
                .select('id, version_label')
                .eq('is_active', true)
                .limit(1);
            if (verRes.error || !verRes.data || !verRes.data.length) {
                loadingEl.classList.add('hidden');
                errorEl.classList.remove('hidden');
                setVersionLabel('');
                return;
            }
            var version = verRes.data[0];
            setVersionLabel(version.version_label);

            var classRes = await window.supabase
                .from('fee_structure_classes')
                .select('class_name, base_monthly_fee, admission_fee, exam_fee, misc_charges')
                .eq('fee_structure_version_id', version.id)
                .order('class_name');
            if (classRes.error) {
                loadingEl.classList.add('hidden');
                errorEl.classList.remove('hidden');
                return;
            }

            var discountRules = null;
            var rulesRes = await window.supabase
                .from('fee_structure_discount_rules')
                .select('sibling_discount_percent, staff_child_discount_percent, early_admission_discount_percent')
                .eq('fee_structure_version_id', version.id)
                .maybeSingle();
            if (rulesRes.data) discountRules = rulesRes.data;

            loadingEl.classList.add('hidden');
            errorEl.classList.add('hidden');
            var classes = classRes.data;
            if (!classes || classes.length === 0) {
                tbodyEl.innerHTML = '<tr><td colspan="6" class="py-4 text-center text-gray-500">No fee data for this version.</td></tr>';
            } else {
                tbodyEl.innerHTML = classes.map(function (row) {
                    const base = parseFloat(row.base_monthly_fee) || 0;
                    const admission = parseFloat(row.admission_fee) || 0;
                    const exam = parseFloat(row.exam_fee) || 0;
                    const misc = parseFloat(row.misc_charges) || 0;
                    const total = base + admission + exam + misc;
                    return '<tr class="border-b border-gray-100 hover:bg-gray-50/50">' +
                        '<td class="py-2.5 px-3 font-medium text-gray-900">' + escapeHtml(row.class_name) + '</td>' +
                        '<td class="py-2.5 px-3 text-right">' + formatFee(row.base_monthly_fee) + '</td>' +
                        '<td class="py-2.5 px-3 text-right">' + formatFee(row.admission_fee) + '</td>' +
                        '<td class="py-2.5 px-3 text-right">' + formatFee(row.exam_fee) + '</td>' +
                        '<td class="py-2.5 px-3 text-right">' + formatFee(row.misc_charges) + '</td>' +
                        '<td class="py-2.5 px-3 text-right brochure-bg-green/30 font-medium">' + formatFee(total) + '</td>' +
                        '</tr>';
                }).join('');
            }
            tableEl.classList.remove('hidden');

            if (discountNote) {
                var parts = [];
                if (discountRules) {
                    if (parseFloat(discountRules.sibling_discount_percent) > 0) parts.push('Sibling discount available.');
                    if (parseFloat(discountRules.staff_child_discount_percent) > 0) parts.push('Staff child discount available.');
                    if (parseFloat(discountRules.early_admission_discount_percent) > 0) parts.push('Early admission discount may apply.');
                }
                if (parts.length) {
                    discountNote.textContent = parts.join(' ');
                    discountNote.classList.remove('hidden');
                } else {
                    discountNote.classList.add('hidden');
                }
            }
        } catch (e) {
            if (loadingEl) loadingEl.classList.add('hidden');
            if (errorEl) { errorEl.classList.remove('hidden'); }
            if (tableEl) tableEl.classList.add('hidden');
        }
    }

    function escapeHtml(s) {
        if (s == null) return '';
        var div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }

    if (versionBadge) setVersionLabel('');
    loadFeeSchedule();

    if (!downloadBtn || !pdfContentEl) return;

    downloadBtn.addEventListener('click', function () {
        if (typeof html2pdf === 'undefined') {
            alert('PDF library is loading. Please try again in a moment.');
            return;
        }

        downloadBtn.disabled = true;
        downloadBtn.textContent = 'Generating PDF…';

        var titleEl = pdfContentEl.querySelector('.brochure-pdf-title');
        if (titleEl) titleEl.style.display = 'block';

        document.body.classList.add('brochure-pdf-one-page');

        var versionText = pdfVersionBadge ? pdfVersionBadge.textContent : 'Fee Schedule';
        var filename = 'The-Suffah-School-Fee-Schedule.pdf';
        if (versionText && versionText.indexOf('(') !== -1) {
            var match = versionText.match(/\(([^)]+)\)/);
            if (match) filename = 'The-Suffah-School-Fee-Schedule-' + match[1].replace(/\s/g, '-') + '.pdf';
        }

        const opt = {
            margin: [5, 5, 5, 5],
            filename: filename,
            image: { type: 'png' },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true, allowTaint: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all'] }
        };

        html2pdf().set(opt).from(pdfContentEl).save().then(function () {
            document.body.classList.remove('brochure-pdf-one-page');
            if (titleEl) titleEl.style.display = '';
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg> Download PDF';
        }).catch(function () {
            document.body.classList.remove('brochure-pdf-one-page');
            if (titleEl) titleEl.style.display = '';
            downloadBtn.disabled = false;
            downloadBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg> Download PDF';
            alert('Could not generate PDF. Try using Print → Save as PDF from your browser.');
        });
    });
})();
