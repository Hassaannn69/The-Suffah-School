/**
 * Public landing page – fetches content from Supabase and renders sections.
 * Requires: Supabase CDN + supabase-init.js loaded before this script.
 */
(function () {
    const supabase = window.supabase;
    if (!supabase) {
        console.error('Supabase not loaded');
        return;
    }

    const SECTION_KEYS = ['hero', 'about', 'stats', 'programs', 'news', 'gallery', 'testimonials', 'cta', 'footer'];

    let state = {
        settings: null,
        sections: [],
        content: {},
        heroSlides: [],
        news: [],
        programs: [],
        gallery: [],
        testimonials: []
    };

    async function fetchAll() {
        const [settingsRes, sectionsRes, contentRes, slidesRes, newsRes, programsRes, galleryRes, testimonialsRes] = await Promise.all([
            supabase.from('settings').select('school_name, logo_url').limit(1).maybeSingle(),
            supabase.from('landing_sections').select('*').order('sort_order', { ascending: true }),
            supabase.from('landing_content').select('section_key, content'),
            supabase.from('landing_hero_slides').select('*').order('sort_order', { ascending: true }),
            supabase.from('landing_news').select('*').order('sort_order', { ascending: true }),
            supabase.from('landing_programs').select('*').order('sort_order', { ascending: true }),
            supabase.from('landing_gallery').select('*').order('sort_order', { ascending: true }),
            supabase.from('landing_testimonials').select('*').order('sort_order', { ascending: true })
        ]);

        state.settings = settingsRes.data || { school_name: 'The Suffah School', logo_url: '' };
        state.sections = (sectionsRes.data || []).filter(s => s.enabled);
        state.content = {};
        (contentRes.data || []).forEach(row => { state.content[row.section_key] = row.content || {}; });
        state.heroSlides = slidesRes.data || [];
        state.news = newsRes.data || [];
        state.programs = programsRes.data || [];
        state.gallery = galleryRes.data || [];
        state.testimonials = testimonialsRes.data || [];
    }

    function getContent(key, defaultVal = {}) {
        return state.content[key] || defaultVal;
    }

    function isSectionEnabled(key) {
        return state.sections.some(s => s.section_key === key);
    }

    const schoolName = () => state.settings?.school_name || 'The Suffah School';
    const logoUrl = () => state.settings?.logo_url || 'assets/images/school-logo.jpg';

    function renderHeader() {
        const header = document.getElementById('landing-header');
        if (!header) return;
        header.innerHTML = `
            <div class="container mx-auto px-4 flex items-center justify-between h-16 md:h-20 gap-4">
                <a href="index.html" class="flex items-center gap-2 flex-shrink-0">
                    <img src="${logoUrl()}" alt="${schoolName()}" class="w-10 h-10 rounded-lg object-cover shadow">
                    <span class="font-bold text-gray-900 text-lg">${schoolName()}</span>
                </a>
                <button type="button" class="landing-nav-toggle md:hidden p-2.5 -mr-2 rounded-xl text-gray-600 hover:bg-gray-100 active:bg-gray-200 transition-colors flex-shrink-0" aria-label="Open menu">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/></svg>
                </button>
                <div class="landing-nav-backdrop md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 opacity-0 pointer-events-none transition-opacity duration-300" aria-hidden="true"></div>
                <nav class="landing-nav-menu flex fixed md:static inset-y-0 right-0 md:inset-auto w-[min(320px,88vw)] md:w-auto max-w-full md:max-w-none bg-white md:bg-transparent shadow-xl md:shadow-none z-50 md:z-0 flex-col md:flex-row items-stretch md:items-center justify-start md:justify-end gap-0 md:gap-4 lg:gap-6 p-0 md:p-0 flex-shrink-0 translate-x-full md:translate-x-0 transition-transform duration-300 ease-out pointer-events-none md:pointer-events-auto">
                    <div class="md:hidden flex items-center justify-between p-4 border-b border-gray-100">
                        <span class="font-semibold text-gray-900">Menu</span>
                        <button type="button" class="landing-nav-close p-2.5 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors" aria-label="Close menu">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                        </button>
                    </div>
                    <div class="md:hidden flex flex-col p-4 gap-1 overflow-y-auto">
                        <p class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">Explore</p>
                        <a href="#cta" class="landing-nav-link flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-700 font-medium hover:bg-indigo-50 hover:text-indigo-600 active:bg-indigo-100 transition-colors">
                            <span class="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 text-gray-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></span>
                            <span>Admissions</span>
                        </a>
                        <a href="#programs" class="landing-nav-link flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-700 font-medium hover:bg-indigo-50 hover:text-indigo-600 active:bg-indigo-100 transition-colors">
                            <span class="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 text-gray-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg></span>
                            <span>Academics</span>
                        </a>
                        <a href="#news" class="landing-nav-link flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-700 font-medium hover:bg-indigo-50 hover:text-indigo-600 active:bg-indigo-100 transition-colors">
                            <span class="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 text-gray-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg></span>
                            <span>Campus Life</span>
                        </a>
                        <a href="#about" class="landing-nav-link flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-700 font-medium hover:bg-indigo-50 hover:text-indigo-600 active:bg-indigo-100 transition-colors">
                            <span class="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 text-gray-600"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></span>
                            <span>About</span>
                        </a>
                    </div>
                    <div class="md:hidden flex flex-col p-4 pt-2 gap-3 border-t border-gray-100">
                        <p class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">Account</p>
                        <a href="login.html" class="landing-nav-link flex items-center justify-center gap-2.5 bg-gray-900 hover:bg-gray-800 text-white px-4 py-3.5 rounded-xl font-semibold transition-colors active:scale-[0.98]">
                            <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                            <span>Portal Login</span>
                        </a>
                        <a href="login.html" class="landing-nav-link flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3.5 rounded-xl font-semibold transition-colors active:scale-[0.98]">
                            <span>Apply Now</span>
                        </a>
                    </div>
                    <a href="#cta" class="hidden md:flex items-center gap-1.5 text-gray-600 hover:text-indigo-600 font-medium transition-colors"><svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg><span>Admissions</span></a>
                    <a href="#programs" class="hidden md:flex items-center gap-1.5 text-gray-600 hover:text-indigo-600 font-medium transition-colors"><svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg><span>Academics</span></a>
                    <a href="#news" class="hidden md:flex items-center gap-1.5 text-gray-600 hover:text-indigo-600 font-medium transition-colors"><svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg><span>Campus Life</span></a>
                    <a href="#about" class="hidden md:flex items-center gap-1.5 text-gray-600 hover:text-indigo-600 font-medium transition-colors"><svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg><span>About</span></a>
                    <a href="login.html" class="hidden md:flex items-center gap-2 border border-gray-300 bg-white text-gray-800 hover:border-indigo-500 hover:bg-gray-50 px-4 py-2.5 rounded-lg font-medium transition-colors"><svg class="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg><span>Portal Login</span></a>
                    <a href="login.html" class="hidden md:inline-flex items-center bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors">Apply Now</a>
                </nav>
            </div>
        `;
        const closeMenu = () => document.body.classList.remove('landing-nav-open');
        header.querySelector('.landing-nav-toggle')?.addEventListener('click', () => document.body.classList.add('landing-nav-open'));
        header.querySelector('.landing-nav-close')?.addEventListener('click', closeMenu);
        header.querySelector('.landing-nav-backdrop')?.addEventListener('click', closeMenu);
        header.querySelectorAll('.landing-nav-link').forEach(link => link.addEventListener('click', closeMenu));
    }

    function renderHero() {
        const el = document.getElementById('landing-hero');
        if (!el || !isSectionEnabled('hero')) { if (el) el.remove(); return; }
        const hero = getContent('hero', { headline: 'Welcome', subtext: '', cta_label: 'Explore Programs', cta_url: '#programs', video_url: '' });
        const bgImage = state.heroSlides.length ? state.heroSlides[0].image_url : '';
        const currentSlide = state.heroSlides[0];
        el.innerHTML = `
            <section class="landing-hero w-full" style="${bgImage ? `background-image: url(${bgImage})` : 'background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)'}">
                <div class="landing-hero-overlay"></div>
                <div class="container mx-auto px-4 py-16 md:py-24">
                    <div class="landing-hero-content max-w-2xl">
                        <p class="text-indigo-600 font-semibold text-sm uppercase tracking-wider mb-2">Excellence in Education</p>
                        <h1 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">${escapeHtml(hero.headline || 'Welcome')}</h1>
                        <p class="text-gray-600 text-lg mb-8">${escapeHtml(hero.subtext || '')}</p>
                        <div class="flex flex-wrap gap-4">
                            <a href="${escapeAttr(hero.cta_url || '#programs')}" class="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                                ${escapeHtml(hero.cta_label || 'Explore Programs')}
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                            </a>
                        </div>
                    </div>
                </div>
                ${state.heroSlides.length > 1 ? `<div class="landing-hero-dots" id="landing-hero-dots"></div>` : ''}
            </section>
        `;
        if (state.heroSlides.length > 1) {
            const dots = el.querySelector('#landing-hero-dots');
            state.heroSlides.forEach((slide, i) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.classList.add(i === 0 ? 'active' : '');
                btn.setAttribute('aria-label', `Slide ${i + 1}`);
                btn.addEventListener('click', () => setHeroSlide(el, i));
                dots.appendChild(btn);
            });
            let idx = 0;
            setInterval(() => {
                idx = (idx + 1) % state.heroSlides.length;
                setHeroSlide(el, idx);
            }, 5000);
        }
    }

    function setHeroSlide(heroSection, index) {
        const slide = state.heroSlides[index];
        if (!slide) return;
        heroSection.style.backgroundImage = `url(${slide.image_url})`;
        heroSection.querySelectorAll('.landing-hero-dots button').forEach((b, i) => b.classList.toggle('active', i === index));
    }

    function renderAbout() {
        const el = document.getElementById('landing-about');
        if (!el || !isSectionEnabled('about')) { if (el) el.remove(); return; }
        const about = getContent('about', { title: 'About Us', body: '', philosophy: '' });
        el.innerHTML = `
            <section id="about" class="landing-section landing-fade-in py-16 md:py-24 bg-white">
                <div class="container mx-auto px-4">
                    <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-6">${escapeHtml(about.title || 'About Us')}</h2>
                    <div class="max-w-3xl text-gray-600 leading-relaxed space-y-4">${escapeHtml(about.body || '').replace(/\n/g, '<br>')}</div>
                    ${about.philosophy ? `<p class="mt-6 text-indigo-600 font-medium">${escapeHtml(about.philosophy)}</p>` : ''}
                </div>
            </section>
        `;
    }

    function renderStats() {
        const el = document.getElementById('landing-stats');
        if (!el || !isSectionEnabled('stats')) { if (el) el.remove(); return; }
        const stats = getContent('stats', { items: [] });
        const items = Array.isArray(stats.items) ? stats.items : [];
        if (items.length === 0) { el.remove(); return; }
        el.innerHTML = `
            <section id="stats" class="landing-section landing-fade-in py-16 bg-gray-50">
                <div class="container mx-auto px-4">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                        ${items.map((item, i) => `
                            <div class="landing-stat-card bg-white rounded-xl p-6 text-center shadow-sm border border-gray-100">
                                <p class="text-3xl md:text-4xl font-bold text-indigo-600 mb-1 landing-counter" data-value="${escapeAttr(item.value || '')}">${escapeHtml(item.value || '0')}</p>
                                <p class="text-sm text-gray-500 uppercase tracking-wider">${escapeHtml(item.label || '')}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>
        `;
    }

    function renderPrograms() {
        const el = document.getElementById('landing-programs');
        if (!el || !isSectionEnabled('programs')) { if (el) el.remove(); return; }
        const items = state.programs;
        el.innerHTML = `
            <section id="programs" class="landing-section landing-fade-in py-16 md:py-24 bg-white">
                <div class="container mx-auto px-4">
                    <p class="text-indigo-600 font-semibold text-sm uppercase tracking-wider mb-2">Academics</p>
                    <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-10">Our Programs</h2>
                    <div class="grid md:grid-cols-3 gap-8">
                        ${items.length ? items.map(p => `
                            <div class="landing-card bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                ${p.image_url ? `<img src="${escapeAttr(p.image_url)}" alt="${escapeAttr(p.title)}" class="landing-card-image" loading="lazy">` : '<div class="landing-card-image bg-gray-100 flex items-center justify-center text-gray-400">No image</div>'}
                                <div class="p-6">
                                    ${p.tag ? `<span class="text-xs font-semibold text-indigo-600 uppercase tracking-wider">${escapeHtml(p.tag)}</span>` : ''}
                                    <h3 class="text-xl font-bold text-gray-900 mt-2 mb-2">${escapeHtml(p.title || '')}</h3>
                                    <p class="text-gray-600 text-sm mb-4 line-clamp-3">${escapeHtml(p.description || '')}</p>
                                    ${p.link_url ? `<a href="${escapeAttr(p.link_url)}" class="text-indigo-600 font-medium text-sm hover:underline">Learn more</a>` : ''}
                                </div>
                            </div>
                        `).join('') : '<p class="text-gray-500 col-span-3">No programs added yet.</p>'}
                    </div>
                </div>
            </section>
        `;
    }

    function renderNews() {
        const el = document.getElementById('landing-news');
        if (!el || !isSectionEnabled('news')) { if (el) el.remove(); return; }
        const items = state.news;
        el.innerHTML = `
            <section id="news" class="landing-section landing-fade-in py-16 md:py-24 bg-gray-50">
                <div class="container mx-auto px-4">
                    <p class="text-indigo-600 font-semibold text-sm uppercase tracking-wider mb-2">Campus Life</p>
                    <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Latest News & Events</h2>
                    <p class="text-gray-600 mb-10 max-w-2xl">Stay up to date with the latest from our community.</p>
                    <div class="grid md:grid-cols-3 gap-8">
                        ${items.length ? items.slice(0, 6).map(n => `
                            <article class="landing-card bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                ${n.image_url ? `<img src="${escapeAttr(n.image_url)}" alt="${escapeAttr(n.title)}" class="landing-card-image" loading="lazy">` : '<div class="landing-card-image bg-gray-100 flex items-center justify-center text-gray-400">No image</div>'}
                                <div class="p-6">
                                    ${n.date ? `<span class="text-xs text-indigo-600 font-medium">${escapeHtml(formatDate(n.date))}</span>` : ''}
                                    ${n.category ? `<span class="text-xs text-gray-500 uppercase ml-2">${escapeHtml(n.category)}</span>` : ''}
                                    <h3 class="text-lg font-bold text-gray-900 mt-2 mb-2">${escapeHtml(n.title || '')}</h3>
                                    <p class="text-gray-600 text-sm mb-4 line-clamp-2">${escapeHtml(n.excerpt || '')}</p>
                                    ${n.link_url ? `<a href="${escapeAttr(n.link_url)}" class="text-indigo-600 font-medium text-sm hover:underline">Read more</a>` : ''}
                                </div>
                            </article>
                        `).join('') : '<p class="text-gray-500 col-span-3">No news yet.</p>'}
                    </div>
                </div>
            </section>
        `;
    }

    function renderGallery() {
        const el = document.getElementById('landing-gallery');
        if (!el || !isSectionEnabled('gallery')) { if (el) el.remove(); return; }
        const items = state.gallery;
        el.innerHTML = `
            <section id="gallery" class="landing-section landing-fade-in py-16 md:py-24 bg-white">
                <div class="container mx-auto px-4">
                    <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-10">Gallery</h2>
                    <div class="landing-gallery-grid">
                        ${items.length ? items.map(g => `
                            <div class="landing-gallery-item" role="button" tabindex="0" data-src="${escapeAttr(g.image_url)}" data-caption="${escapeAttr(g.caption || '')}">
                                <img src="${escapeAttr(g.image_url)}" alt="${escapeAttr(g.caption || 'Gallery image')}" loading="lazy">
                            </div>
                        `).join('') : '<p class="text-gray-500">No images yet.</p>'}
                    </div>
                </div>
            </section>
            <div id="landing-lightbox" class="landing-lightbox hidden">
                <button type="button" class="landing-lightbox-close" aria-label="Close">×</button>
                <img src="" alt="">
            </div>
        `;
        el.querySelectorAll('.landing-gallery-item').forEach(item => {
            item.addEventListener('click', () => {
                const src = item.dataset.src;
                const cap = item.dataset.caption;
                const lb = document.getElementById('landing-lightbox');
                if (lb && src) {
                    lb.classList.remove('hidden');
                    lb.querySelector('img').src = src;
                    lb.querySelector('img').alt = cap || 'Image';
                }
            });
        });
        document.getElementById('landing-lightbox')?.addEventListener('click', function (e) {
            if (e.target === this || e.target.classList.contains('landing-lightbox-close')) this.classList.add('hidden');
        });
    }

    function renderTestimonials() {
        const el = document.getElementById('landing-testimonials');
        if (!el || !isSectionEnabled('testimonials')) { if (el) el.remove(); return; }
        const items = state.testimonials;
        el.innerHTML = `
            <section id="testimonials" class="landing-section landing-fade-in py-16 md:py-24 bg-gray-50">
                <div class="container mx-auto px-4">
                    <h2 class="text-3xl md:text-4xl font-bold text-gray-900 mb-10">What People Say</h2>
                    <div class="grid md:grid-cols-3 gap-8">
                        ${items.length ? items.map(t => `
                            <blockquote class="landing-card bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                                <p class="text-gray-700 italic mb-4">"${escapeHtml(t.quote || '')}"</p>
                                <footer class="flex items-center gap-3">
                                    ${t.image_url ? `<img src="${escapeAttr(t.image_url)}" alt="" class="w-12 h-12 rounded-full object-cover">` : '<div class="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">' + (t.author_name || '?').charAt(0) + '</div>'}
                                    <div>
                                        <cite class="font-semibold text-gray-900 not-italic">${escapeHtml(t.author_name || '')}</cite>
                                        ${t.author_role ? `<p class="text-sm text-gray-500">${escapeHtml(t.author_role)}</p>` : ''}
                                    </div>
                                </footer>
                            </blockquote>
                        `).join('') : '<p class="text-gray-500 col-span-3">No testimonials yet.</p>'}
                    </div>
                </div>
            </section>
        `;
    }

    function renderCta() {
        const el = document.getElementById('landing-cta');
        if (!el || !isSectionEnabled('cta')) { if (el) el.remove(); return; }
        const cta = getContent('cta', { title: 'Ready to Join?', description: '', primary_label: 'Apply Now', primary_url: 'login.html', secondary_label: 'Contact', secondary_url: '#contact' });
        el.innerHTML = `
            <section id="cta" class="landing-section landing-cta landing-fade-in py-16 md:py-24">
                <div class="container mx-auto px-4 text-center">
                    <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">${escapeHtml(cta.title || '')}</h2>
                    <p class="text-white/90 text-lg mb-8 max-w-2xl mx-auto">${escapeHtml(cta.description || '')}</p>
                    <div class="flex flex-wrap justify-center gap-4">
                        <a href="${escapeAttr(cta.primary_url || 'login.html')}" class="bg-white text-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">${escapeHtml(cta.primary_label || 'Apply Now')}</a>
                        <a href="${escapeAttr(cta.secondary_url || '#contact')}" class="border-2 border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors">${escapeHtml(cta.secondary_label || 'Contact')}</a>
                    </div>
                </div>
            </section>
        `;
    }

    function renderFooter() {
        const el = document.getElementById('landing-footer');
        if (!el || !isSectionEnabled('footer')) { if (el) el.remove(); return; }
        const footer = getContent('footer', { mission: '', quick_links: [], newsletter_text: '', social: [] });
        const links = Array.isArray(footer.quick_links) ? footer.quick_links : [];
        el.innerHTML = `
            <footer id="contact" class="landing-footer landing-section text-white py-16">
                <div class="container mx-auto px-4">
                    <div class="grid md:grid-cols-4 gap-12 mb-12">
                        <div>
                            <img src="${logoUrl()}" alt="${schoolName()}" class="w-12 h-12 rounded-lg object-cover mb-4">
                            <p class="text-white/80 text-sm">${escapeHtml(footer.mission || '')}</p>
                        </div>
                        <div>
                            <h3 class="font-bold mb-4">Quick Links</h3>
                            <ul class="space-y-2">
                                <li><a href="login.html" class="text-white/80 hover:text-white text-sm">Portal Login</a></li>
                                ${links.map(l => `<li><a href="${escapeAttr(l.url || '#')}" class="text-white/80 hover:text-white text-sm">${escapeHtml(l.label || '')}</a></li>`).join('')}
                            </ul>
                        </div>
                        <div>
                            <h3 class="font-bold mb-4">Contact</h3>
                            <p class="text-white/80 text-sm">Visit our portal for inquiries.</p>
                        </div>
                        <div>
                            <h3 class="font-bold mb-4">Stay Connected</h3>
                            <p class="text-white/80 text-sm mb-4">${escapeHtml(footer.newsletter_text || '')}</p>
                        </div>
                    </div>
                    <div class="border-t border-white/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/60">
                        <span>© ${new Date().getFullYear()} ${escapeHtml(schoolName())}. All rights reserved.</span>
                    </div>
                </div>
            </footer>
        `;
    }

    function escapeHtml(s) {
        if (s == null) return '';
        const div = document.createElement('div');
        div.textContent = s;
        return div.innerHTML;
    }
    function escapeAttr(s) {
        if (s == null) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }
    function formatDate(d) {
        if (!d) return '';
        const date = new Date(d);
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function setupScrollFade() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) e.target.classList.add('visible');
            });
        }, { rootMargin: '0px 0px -60px 0px', threshold: 0.1 });
        document.querySelectorAll('.landing-fade-in').forEach(el => observer.observe(el));
    }

    async function init() {
        await fetchAll();
        renderHeader();
        renderHero();
        renderAbout();
        renderStats();
        renderPrograms();
        renderNews();
        renderGallery();
        renderTestimonials();
        renderCta();
        renderFooter();
        setupScrollFade();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
