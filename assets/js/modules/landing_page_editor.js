/**
 * Landing Page Editor – admin module to manage landing content and media.
 * Layout: section list (left), edit form (center), live preview iframe (right).
 */
const supabase = window.supabase;

const SECTIONS = [
    { key: 'hero', label: 'Hero Section', desc: 'Main banner and introduction' },
    { key: 'about', label: 'About Us', desc: 'School philosophy and vision' },
    { key: 'stats', label: 'Stats', desc: 'Numbers and counters' },
    { key: 'programs', label: 'Programs', desc: 'Academic pathways and courses' },
    { key: 'news', label: 'News & Events', desc: 'Announcements and events' },
    { key: 'gallery', label: 'Photo Gallery', desc: 'Campus and event images' },
    { key: 'testimonials', label: 'Testimonials', desc: 'Quotes and achievements' },
    { key: 'cta', label: 'Call to Action', desc: 'Admissions CTA block' },
    { key: 'footer', label: 'Footer', desc: 'Links and contact' }
];

const BUCKET = 'landing-media';

let state = {
    sections: [],
    content: {},
    heroSlides: [],
    news: [],
    programs: [],
    gallery: [],
    testimonials: [],
    selectedSection: 'hero'
};

async function uploadToLandingMedia(file, folder = 'misc') {
    const ext = (file.name || '').split('.').pop() || 'jpg';
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return publicUrl;
}

async function fetchAll() {
    const [sectionsRes, contentRes, slidesRes, newsRes, programsRes, galleryRes, testimonialsRes] = await Promise.all([
        supabase.from('landing_sections').select('*').order('sort_order', { ascending: true }),
        supabase.from('landing_content').select('section_key, content'),
        supabase.from('landing_hero_slides').select('*').order('sort_order', { ascending: true }),
        supabase.from('landing_news').select('*').order('sort_order', { ascending: true }),
        supabase.from('landing_programs').select('*').order('sort_order', { ascending: true }),
        supabase.from('landing_gallery').select('*').order('sort_order', { ascending: true }),
        supabase.from('landing_testimonials').select('*').order('sort_order', { ascending: true })
    ]);
    state.sections = sectionsRes.data || [];
    state.content = {};
    (contentRes.data || []).forEach(r => { state.content[r.section_key] = r.content || {}; });
    state.heroSlides = slidesRes.data || [];
    state.news = newsRes.data || [];
    state.programs = programsRes.data || [];
    state.gallery = galleryRes.data || [];
    state.testimonials = testimonialsRes.data || [];
}

function getContent(key, def = {}) {
    return state.content[key] || def;
}

function getSection(key) {
    return state.sections.find(s => s.section_key === key);
}

function refreshPreview() {
    const iframe = document.getElementById('landing-editor-preview');
    if (iframe && iframe.contentWindow) iframe.contentWindow.location.reload();
}

function showSavedIndicator() {
    const el = document.getElementById('landing-editor-saved');
    if (!el) return;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 3000);
}

function renderSectionList(container) {
    const list = container.querySelector('#landing-editor-section-list');
    if (!list) return;
    list.innerHTML = SECTIONS.map(s => {
        const sec = getSection(s.key);
        const enabled = sec ? sec.enabled : true;
        return `
            <div class="flex items-center gap-2 py-2.5 px-3 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800/80 cursor-pointer border-l-4 ${state.selectedSection === s.key ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/20 dark:border-primary-400' : 'border-transparent'}" data-section="${s.key}">
                <span class="text-gray-400 dark:text-gray-500 cursor-grab" aria-hidden="true">⋮⋮</span>
                <div class="flex-1 min-w-0">
                    <p class="font-medium text-gray-900 dark:text-white truncate">${s.label}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 truncate">${s.desc}</p>
                </div>
                <button type="button" class="landing-section-toggle rounded-full w-10 h-6 transition-colors ${enabled ? 'bg-primary-500 dark:bg-primary-500 shadow-inner' : 'bg-gray-300 dark:bg-gray-600 dark:ring-1 dark:ring-gray-500'}" data-section="${s.key}" aria-label="Toggle ${s.label}"></button>
            </div>
        `;
    }).join('');

    list.querySelectorAll('#landing-editor-section-list > div').forEach(row => {
        row.addEventListener('click', (e) => {
            if (e.target.closest('.landing-section-toggle')) return;
            state.selectedSection = row.dataset.section;
            renderSectionList(container);
            renderEditorForm(container);
        });
    });
    list.querySelectorAll('.landing-section-toggle').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const key = btn.dataset.section;
            const sec = getSection(key);
            const newEnabled = !(sec ? sec.enabled : true);
            const id = sec?.id;
            if (id) {
                const { error } = await supabase.from('landing_sections').update({ enabled: newEnabled }).eq('id', id);
                if (error) { alert(error.message); return; }
            }
            await fetchAll();
            renderSectionList(container);
            renderEditorForm(container);
            refreshPreview();
            showSavedIndicator();
        });
    });
}

function renderEditorForm(container) {
    const center = container.querySelector('#landing-editor-center');
    if (!center) return;
    const key = state.selectedSection;
    const section = SECTIONS.find(s => s.key === key);
    if (!section) return;

    const content = getContent(key);

    if (key === 'hero') {
        center.innerHTML = `
            <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Edit Hero Section</h3>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Main Headline</label>
                    <input type="text" id="hero-headline" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent" value="${escapeAttr(content.headline || '')}" placeholder="Welcome to...">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subtext</label>
                    <textarea id="hero-subtext" rows="3" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Brief description...">${escapeAttr(content.subtext || '')}</textarea>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CTA Button Label</label>
                        <input type="text" id="hero-cta-label" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent" value="${escapeAttr(content.cta_label || '')}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CTA URL</label>
                        <input type="text" id="hero-cta-url" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent" value="${escapeAttr(content.cta_url || '')}" placeholder="#programs or index.html">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slide Images</label>
                    <p class="text-xs text-gray-500 mb-2">PNG, JPG or GIF (recommended max 1200×600px)</p>
                    <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-primary-400 dark:hover:border-primary-500 transition-colors" id="hero-upload-zone">
                        <p class="text-gray-500 dark:text-gray-400">Click or drag to upload</p>
                        <input type="file" id="hero-upload-input" accept="image/*" class="hidden" multiple>
                    </div>
                    <ul id="hero-slides-list" class="mt-4 space-y-2"></ul>
                </div>
            </div>
        `;
        const list = center.querySelector('#hero-slides-list');
        state.heroSlides.forEach((s, i) => {
            const li = document.createElement('li');
            li.className = 'flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg';
            li.innerHTML = `<img src="${s.image_url}" alt="" class="w-16 h-10 object-cover rounded"><span class="flex-1 text-sm text-gray-600 dark:text-gray-300 truncate">${s.caption || 'Slide ' + (i + 1)}</span><button type="button" class="text-red-600 dark:text-red-400 hover:underline text-sm" data-id="${s.id}">Delete</button>`;
            li.querySelector('button').addEventListener('click', async () => {
                await supabase.from('landing_hero_slides').delete().eq('id', s.id);
                await fetchAll();
                renderEditorForm(container);
                refreshPreview();
            });
            list.appendChild(li);
        });
        center.querySelector('#hero-upload-zone').addEventListener('click', () => center.querySelector('#hero-upload-input').click());
        center.querySelector('#hero-upload-input').addEventListener('change', async (e) => {
            const files = e.target.files;
            if (!files?.length) return;
            const maxOrder = state.heroSlides.length ? Math.max(...state.heroSlides.map(s => s.sort_order)) : -1;
            for (let i = 0; i < files.length; i++) {
                try {
                    const url = await uploadToLandingMedia(files[i], 'hero');
                    await supabase.from('landing_hero_slides').insert({ image_url: url, sort_order: maxOrder + 1 + i });
                } catch (err) {
                    alert('Upload failed: ' + err.message);
                }
            }
            e.target.value = '';
            await fetchAll();
            renderEditorForm(container);
            refreshPreview();
        });
        return;
    }

    if (key === 'about') {
        center.innerHTML = `
            <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Edit About Us</h3>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                    <input type="text" id="about-title" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent" value="${escapeAttr(content.title || '')}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Body</label>
                    <textarea id="about-body" rows="5" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent">${escapeAttr(content.body || '')}</textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Philosophy (optional)</label>
                    <input type="text" id="about-philosophy" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent" value="${escapeAttr(content.philosophy || '')}">
                </div>
            </div>
        `;
        return;
    }

    if (key === 'stats') {
        const items = Array.isArray(content.items) ? content.items : [];
        center.innerHTML = `
            <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Edit Stats</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">Add or edit stat items (label + value, e.g. "1,200+" or "15:1").</p>
                <div id="stats-items-container" class="space-y-3"></div>
                <button type="button" id="stats-add-row" class="text-primary-600 dark:text-primary-400 hover:underline text-sm font-medium">+ Add stat</button>
            </div>
        `;
        const containerEl = center.querySelector('#stats-items-container');
        function addStatRow(item = { label: '', value: '' }) {
            const div = document.createElement('div');
            div.className = 'flex gap-2 items-center';
            div.innerHTML = `
                <input type="text" placeholder="Label" class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent" value="${escapeAttr(item.label || '')}">
                <input type="text" placeholder="Value" class="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent" value="${escapeAttr(item.value || '')}">
                <button type="button" class="stats-remove text-red-600 dark:text-red-400 hover:underline text-sm">Remove</button>
            `;
            div.querySelector('.stats-remove').addEventListener('click', () => div.remove());
            containerEl.appendChild(div);
        }
        items.forEach(addStatRow);
        if (items.length === 0) addStatRow();
        center.querySelector('#stats-add-row').addEventListener('click', () => addStatRow());
        window._landingStatsCollect = () => {
            const rows = center.querySelectorAll('#stats-items-container > div');
            return Array.from(rows).map(row => {
                const [label, value] = row.querySelectorAll('input');
                return { label: label?.value || '', value: value?.value || '' };
            }).filter(i => i.label || i.value);
        };
        return;
    }

    if (key === 'cta') {
        center.innerHTML = `
            <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Edit Call to Action</h3>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                    <input type="text" id="cta-title" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent" value="${escapeAttr(content.title || '')}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea id="cta-desc" rows="2" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent">${escapeAttr(content.description || '')}</textarea>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Primary Button Label</label>
                        <input type="text" id="cta-primary-label" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" value="${escapeAttr(content.primary_label || '')}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Primary URL</label>
                        <input type="text" id="cta-primary-url" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" value="${escapeAttr(content.primary_url || '')}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Secondary Button Label</label>
                        <input type="text" id="cta-secondary-label" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" value="${escapeAttr(content.secondary_label || '')}">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Secondary URL</label>
                        <input type="text" id="cta-secondary-url" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" value="${escapeAttr(content.secondary_url || '')}">
                    </div>
                </div>
            </div>
        `;
        return;
    }

    if (key === 'footer') {
        const links = Array.isArray(content.quick_links) ? content.quick_links : [];
        const mission = content.mission || '';
        const newsletter = content.newsletter_text || '';
        center.innerHTML = `
            <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Edit Footer</h3>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mission / Tagline</label>
                    <input type="text" id="footer-mission" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" value="${escapeAttr(mission)}">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Newsletter Text</label>
                    <input type="text" id="footer-newsletter" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent" value="${escapeAttr(newsletter)}">
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400">Quick links: edit in JSON or add later. For now, portal link is always shown.</p>
            </div>
        `;
        window._landingFooterCollect = () => ({
            mission: center.querySelector('#footer-mission')?.value || '',
            newsletter_text: center.querySelector('#footer-newsletter')?.value || '',
            quick_links: content.quick_links || [],
            social: content.social || []
        });
        return;
    }

    // List-based sections: programs, news, gallery, testimonials
    if (key === 'programs') {
        center.innerHTML = `
            <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Programs</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">Add, edit, or remove program cards. Order by sort_order.</p>
                <div id="programs-list" class="space-y-4"></div>
                <button type="button" id="program-add" class="bg-primary-500 dark:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-600 dark:hover:bg-primary-400 shadow-sm">Add Program</button>
            </div>
        `;
        const list = center.querySelector('#programs-list');
        state.programs.forEach(p => {
            const div = document.createElement('div');
            div.className = 'border border-gray-200 dark:border-gray-600 rounded-xl p-4 space-y-2 bg-gray-50/50 dark:bg-gray-800/30';
            div.innerHTML = `
                <div class="flex justify-between"><strong class="text-gray-900 dark:text-white">${escapeHtml(p.title || '')}</strong><button type="button" class="program-delete text-red-600 dark:text-red-400 hover:underline text-sm font-medium" data-id="${p.id}">Delete</button></div>
                <input type="text" placeholder="Title" class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 program-title" value="${escapeAttr(p.title || '')}">
                <textarea placeholder="Description" rows="2" class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 program-desc">${escapeAttr(p.description || '')}</textarea>
                <input type="text" placeholder="Tag (e.g. Ages 3-5)" class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 program-tag" value="${escapeAttr(p.tag || '')}">
                <input type="text" placeholder="Link URL" class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 program-link" value="${escapeAttr(p.link_url || '')}">
                <div><img src="${p.image_url || ''}" alt="" class="w-20 h-14 object-cover rounded-lg program-img ${p.image_url ? '' : 'hidden'}"><input type="file" accept="image/*" class="program-upload mt-1 text-sm text-gray-600 dark:text-gray-400"></div>
            `;
            const imgEl = div.querySelector('.program-img');
            const uploadEl = div.querySelector('.program-upload');
            uploadEl.addEventListener('change', async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                    const url = await uploadToLandingMedia(f, 'programs');
                    await supabase.from('landing_programs').update({ image_url: url }).eq('id', p.id);
                    imgEl.src = url;
                    imgEl.classList.remove('hidden');
                } catch (err) { alert(err.message); }
                e.target.value = '';
            });
            div.querySelector('.program-delete').addEventListener('click', async () => {
                await supabase.from('landing_programs').delete().eq('id', p.id);
                await fetchAll();
                renderEditorForm(container);
                refreshPreview();
            });
            list.appendChild(div);
        });
        center.querySelector('#program-add').addEventListener('click', async () => {
            const { error } = await supabase.from('landing_programs').insert({ title: 'New Program', sort_order: state.programs.length });
            if (error) { alert(error.message); return; }
            await fetchAll();
            renderEditorForm(container);
            refreshPreview();
        });
        window._landingProgramsSave = async () => {
            const cards = center.querySelectorAll('#programs-list > div');
            for (const card of cards) {
                const id = card.querySelector('.program-delete')?.dataset?.id;
                if (!id) continue;
                const title = card.querySelector('.program-title')?.value || '';
                const description = card.querySelector('.program-desc')?.value || '';
                const tag = card.querySelector('.program-tag')?.value || '';
                const link_url = card.querySelector('.program-link')?.value || '';
                await supabase.from('landing_programs').update({ title, description, tag, link_url }).eq('id', id);
            }
        };
        return;
    }

    if (key === 'news') {
        center.innerHTML = `
            <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">News & Events</h3>
                <div id="news-list" class="space-y-4"></div>
                <button type="button" id="news-add" class="bg-primary-500 dark:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-600 dark:hover:bg-primary-400 shadow-sm">Add News Item</button>
            </div>
        `;
        const list = center.querySelector('#news-list');
        state.news.forEach(n => {
            const div = document.createElement('div');
            div.className = 'border border-gray-200 dark:border-gray-600 rounded-xl p-4 space-y-2 bg-gray-50/50 dark:bg-gray-800/30';
            div.innerHTML = `
                <div class="flex justify-between"><strong class="text-gray-900 dark:text-white">${escapeHtml(n.title || '')}</strong><button type="button" class="news-delete text-red-600 dark:text-red-400 hover:underline text-sm font-medium" data-id="${n.id}">Delete</button></div>
                <input type="text" placeholder="Title" class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 news-title" value="${escapeAttr(n.title || '')}">
                <input type="text" placeholder="Excerpt" class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 news-excerpt" value="${escapeAttr(n.excerpt || '')}">
                <input type="date" class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white news-date" value="${n.date || ''}">
                <input type="text" placeholder="Category" class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 news-category" value="${escapeAttr(n.category || '')}">
                <input type="text" placeholder="Link URL" class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 news-link" value="${escapeAttr(n.link_url || '')}">
                <div><img src="${n.image_url || ''}" alt="" class="w-20 h-14 object-cover rounded-lg news-img ${n.image_url ? '' : 'hidden'}"><input type="file" accept="image/*" class="news-upload mt-1 text-sm text-gray-600 dark:text-gray-400"></div>
            `;
            const imgEl = div.querySelector('.news-img');
            div.querySelector('.news-upload').addEventListener('change', async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                    const url = await uploadToLandingMedia(f, 'news');
                    await supabase.from('landing_news').update({ image_url: url }).eq('id', n.id);
                    imgEl.src = url;
                    imgEl.classList.remove('hidden');
                } catch (err) { alert(err.message); }
                e.target.value = '';
            });
            div.querySelector('.news-delete').addEventListener('click', async () => {
                await supabase.from('landing_news').delete().eq('id', n.id);
                await fetchAll();
                renderEditorForm(container);
                refreshPreview();
            });
            list.appendChild(div);
        });
        center.querySelector('#news-add').addEventListener('click', async () => {
            await supabase.from('landing_news').insert({ title: 'New News Item', sort_order: state.news.length });
            await fetchAll();
            renderEditorForm(container);
            refreshPreview();
        });
        window._landingNewsSave = async () => {
            const cards = center.querySelectorAll('#news-list > div');
            for (const card of cards) {
                const id = card.querySelector('.news-delete')?.dataset?.id;
                if (!id) continue;
                await supabase.from('landing_news').update({
                    title: card.querySelector('.news-title')?.value || '',
                    excerpt: card.querySelector('.news-excerpt')?.value || '',
                    date: card.querySelector('.news-date')?.value || null,
                    category: card.querySelector('.news-category')?.value || '',
                    link_url: card.querySelector('.news-link')?.value || ''
                }).eq('id', id);
            }
        };
        return;
    }

    if (key === 'gallery') {
        center.innerHTML = `
            <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Gallery</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">Upload images. Optional caption.</p>
                <div class="border-2 border-dashed rounded-lg p-4 text-center" id="gallery-upload-zone">
                    <input type="file" id="gallery-upload-input" accept="image/*" class="hidden" multiple>
                    <p class="text-gray-500 dark:text-gray-400">Click to upload images</p>
                </div>
                <div id="gallery-list" class="grid grid-cols-2 gap-2"></div>
            </div>
        `;
        const list = center.querySelector('#gallery-list');
        state.gallery.forEach(g => {
            const div = document.createElement('div');
            div.className = 'relative group';
            div.innerHTML = `
                <img src="${g.image_url}" alt="" class="w-full h-24 object-cover rounded">
                <input type="text" placeholder="Caption" class="w-full mt-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 gallery-caption" value="${escapeAttr(g.caption || '')}" data-id="${g.id}">
                <button type="button" class="absolute top-1 right-1 bg-red-500 text-white rounded p-1 text-xs gallery-del" data-id="${g.id}">×</button>
            `;
            div.querySelector('.gallery-del').addEventListener('click', async () => {
                await supabase.from('landing_gallery').delete().eq('id', g.id);
                await fetchAll();
                renderEditorForm(container);
                refreshPreview();
            });
            div.querySelector('.gallery-caption').addEventListener('blur', async (e) => {
                await supabase.from('landing_gallery').update({ caption: e.target.value }).eq('id', g.id);
                showSavedIndicator();
            });
            list.appendChild(div);
        });
        center.querySelector('#gallery-upload-zone').addEventListener('click', () => center.querySelector('#gallery-upload-input').click());
        center.querySelector('#gallery-upload-input').addEventListener('change', async (e) => {
            const files = e.target.files;
            if (!files?.length) return;
            const maxOrder = state.gallery.length ? Math.max(...state.gallery.map(x => x.sort_order)) : -1;
            for (let i = 0; i < files.length; i++) {
                try {
                    const url = await uploadToLandingMedia(files[i], 'gallery');
                    await supabase.from('landing_gallery').insert({ image_url: url, sort_order: maxOrder + 1 + i });
                } catch (err) { alert(err.message); }
            }
            e.target.value = '';
            await fetchAll();
            renderEditorForm(container);
            refreshPreview();
        });
        return;
    }

    if (key === 'testimonials') {
        center.innerHTML = `
            <div class="space-y-4">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Testimonials</h3>
                <div id="testimonials-list" class="space-y-4"></div>
                <button type="button" id="testimonials-add" class="bg-primary-500 dark:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-600 dark:hover:bg-primary-400 shadow-sm">Add Testimonial</button>
            </div>
        `;
        const list = center.querySelector('#testimonials-list');
        state.testimonials.forEach(t => {
            const div = document.createElement('div');
            div.className = 'border border-gray-200 dark:border-gray-600 rounded-xl p-4 space-y-2 bg-gray-50/50 dark:bg-gray-800/30';
            div.innerHTML = `
                <div class="flex justify-between"><button type="button" class="testimonial-delete text-red-600 dark:text-red-400 hover:underline text-sm font-medium" data-id="${t.id}">Delete</button></div>
                <textarea placeholder="Quote" rows="2" class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 testimonial-quote">${escapeAttr(t.quote || '')}</textarea>
                <input type="text" placeholder="Author name" class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 testimonial-name" value="${escapeAttr(t.author_name || '')}">
                <input type="text" placeholder="Role (e.g. Parent, Student)" class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 testimonial-role" value="${escapeAttr(t.author_role || '')}">
                <div><img src="${t.image_url || ''}" alt="" class="w-12 h-12 object-cover rounded-lg testimonial-img ${t.image_url ? '' : 'hidden'}"><input type="file" accept="image/*" class="testimonial-upload mt-1 text-sm text-gray-600 dark:text-gray-400"></div>
            `;
            const imgEl = div.querySelector('.testimonial-img');
            div.querySelector('.testimonial-upload').addEventListener('change', async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                try {
                    const url = await uploadToLandingMedia(f, 'testimonials');
                    await supabase.from('landing_testimonials').update({ image_url: url }).eq('id', t.id);
                    imgEl.src = url;
                    imgEl.classList.remove('hidden');
                } catch (err) { alert(err.message); }
                e.target.value = '';
            });
            div.querySelector('.testimonial-delete').addEventListener('click', async () => {
                await supabase.from('landing_testimonials').delete().eq('id', t.id);
                await fetchAll();
                renderEditorForm(container);
                refreshPreview();
            });
            list.appendChild(div);
        });
        center.querySelector('#testimonials-add').addEventListener('click', async () => {
            await supabase.from('landing_testimonials').insert({ quote: 'New testimonial', sort_order: state.testimonials.length });
            await fetchAll();
            renderEditorForm(container);
            refreshPreview();
        });
        window._landingTestimonialsSave = async () => {
            const cards = center.querySelectorAll('#testimonials-list > div');
            for (const card of cards) {
                const id = card.querySelector('.testimonial-delete')?.dataset?.id;
                if (!id) continue;
                await supabase.from('landing_testimonials').update({
                    quote: card.querySelector('.testimonial-quote')?.value || '',
                    author_name: card.querySelector('.testimonial-name')?.value || '',
                    author_role: card.querySelector('.testimonial-role')?.value || ''
                }).eq('id', id);
            }
        };
        return;
    }

    center.innerHTML = `<p class="text-gray-500 dark:text-gray-400">No editor for "${section.label}".</p>`;
}

function escapeHtml(s) {
    if (s == null) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
}
function escapeAttr(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function saveCurrentSection(container) {
    const key = state.selectedSection;

    if (key === 'hero') {
        const headline = container.querySelector('#hero-headline')?.value || '';
        const subtext = container.querySelector('#hero-subtext')?.value || '';
        const cta_label = container.querySelector('#hero-cta-label')?.value || '';
        const cta_url = container.querySelector('#hero-cta-url')?.value || '';
        const content = { ...getContent('hero'), headline, subtext, cta_label, cta_url };
        await supabase.from('landing_content').upsert({ section_key: 'hero', content, updated_at: new Date().toISOString() }, { onConflict: 'section_key' });
    } else if (key === 'about') {
        const content = {
            title: container.querySelector('#about-title')?.value || '',
            body: container.querySelector('#about-body')?.value || '',
            philosophy: container.querySelector('#about-philosophy')?.value || ''
        };
        await supabase.from('landing_content').upsert({ section_key: 'about', content, updated_at: new Date().toISOString() }, { onConflict: 'section_key' });
    } else if (key === 'stats' && window._landingStatsCollect) {
        const items = window._landingStatsCollect();
        await supabase.from('landing_content').upsert({ section_key: 'stats', content: { items }, updated_at: new Date().toISOString() }, { onConflict: 'section_key' });
    } else if (key === 'cta') {
        const content = {
            title: container.querySelector('#cta-title')?.value || '',
            description: container.querySelector('#cta-desc')?.value || '',
            primary_label: container.querySelector('#cta-primary-label')?.value || '',
            primary_url: container.querySelector('#cta-primary-url')?.value || '',
            secondary_label: container.querySelector('#cta-secondary-label')?.value || '',
            secondary_url: container.querySelector('#cta-secondary-url')?.value || ''
        };
        await supabase.from('landing_content').upsert({ section_key: 'cta', content, updated_at: new Date().toISOString() }, { onConflict: 'section_key' });
    } else if (key === 'footer' && window._landingFooterCollect) {
        const content = window._landingFooterCollect();
        await supabase.from('landing_content').upsert({ section_key: 'footer', content, updated_at: new Date().toISOString() }, { onConflict: 'section_key' });
    } else if (key === 'programs' && window._landingProgramsSave) {
        await window._landingProgramsSave();
    } else if (key === 'news' && window._landingNewsSave) {
        await window._landingNewsSave();
    } else if (key === 'testimonials' && window._landingTestimonialsSave) {
        await window._landingTestimonialsSave();
    }

    await fetchAll();
    refreshPreview();
    showSavedIndicator();
}

export async function render(container) {
    const role = (window.currentUser?.user_metadata?.role) || (document.getElementById('userRole')?.textContent?.toLowerCase());
    if (role !== 'admin') {
        container.innerHTML = `
            <div class="p-8 text-center">
                <p class="text-gray-600 dark:text-gray-400">Access denied. Only administrators can manage the landing page.</p>
            </div>
        `;
        return;
    }

    await fetchAll();

    const pathDir = window.location.pathname.replace(/[^/]+$/, '') || '/';
    const landingUrl = window.location.origin + pathDir + 'index.html';

    container.innerHTML = `
        <div class="flex flex-col h-full">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">Landing Page Editor</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Manage content sections for the school homepage.</p>
                </div>
                <div class="flex items-center gap-3">
                    <span id="landing-editor-saved" class="hidden flex items-center gap-2 text-green-600 dark:text-green-400 text-sm font-medium"><span class="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400"></span> Changes saved</span>
                    <button type="button" id="landing-editor-save" class="bg-primary-500 hover:bg-primary-600 dark:bg-primary-500 dark:hover:bg-primary-400 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm focus:ring-2 focus:ring-primary-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/></svg>
                        Save
                    </button>
                </div>
            </div>
            <div class="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
                <div class="lg:col-span-3 border border-gray-200 dark:border-gray-600 rounded-xl p-4 bg-white dark:bg-gray-900 overflow-y-auto shadow-sm dark:shadow-none">
                    <h3 class="font-semibold text-gray-900 dark:text-white mb-3">Sections</h3>
                    <div id="landing-editor-section-list" class="space-y-1"></div>
                </div>
                <div class="lg:col-span-5 border border-gray-200 dark:border-gray-600 rounded-xl p-6 bg-white dark:bg-gray-900 overflow-y-auto shadow-sm dark:shadow-none" id="landing-editor-center">
                    <!-- Form injected by renderEditorForm -->
                </div>
                <div class="lg:col-span-4 border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden bg-white dark:bg-gray-900 flex flex-col shadow-sm dark:shadow-none">
                    <div class="p-3 border-b border-gray-200 dark:border-gray-600 flex items-center gap-2 bg-gray-50 dark:bg-gray-800/50">
                        <span class="w-2 h-2 rounded-full bg-red-500 dark:bg-red-400" aria-hidden="true"></span>
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-200">Live Preview</span>
                    </div>
                    <div class="flex-1 min-h-0 relative">
                        <iframe id="landing-editor-preview" src="${escapeAttr(landingUrl)}" class="absolute inset-0 w-full h-full border-0" title="Landing page preview"></iframe>
                    </div>
                </div>
            </div>
        </div>
    `;

    renderSectionList(container);
    renderEditorForm(container);

    container.querySelector('#landing-editor-save').addEventListener('click', async () => {
        const btn = container.querySelector('#landing-editor-save');
        btn.disabled = true;
        try {
            await saveCurrentSection(container);
        } catch (err) {
            alert('Save failed: ' + (err.message || err));
        }
        btn.disabled = false;
    });
}
