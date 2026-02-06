# Landing Page – Test Cases

Use this checklist to verify the public landing page and the Landing Page Editor. Run these manually after changes or before release.

---

## 1. Public Landing Page (`landing.html`)

### 1.1 Load and content

| # | Step | Expected |
|---|------|----------|
| 1.1.1 | Open `landing.html` in a browser (no login). | Page loads without errors. |
| 1.1.2 | Check header: logo and school name. | Shows school name and logo (from Settings or default). |
| 1.1.3 | Check “Portal Login” and “Apply Now”. | Both link to `index.html` (or configured URL). |
| 1.1.4 | Scroll through all sections. | Hero, About, Stats, Programs, News, Gallery, Testimonials, CTA, Footer render (or are hidden if disabled in editor). |
| 1.1.5 | If hero has multiple slides. | Slides advance automatically and/or dots work. |
| 1.1.6 | Click a gallery image. | Lightbox opens with full image; close button or click outside closes it. |

### 1.2 Responsiveness

| # | Step | Expected |
|---|------|----------|
| 1.2.1 | Desktop (e.g. 1920×1080). | Layout is readable; sections use full width appropriately. |
| 1.2.2 | Tablet (e.g. 768×1024). | Nav and cards reflow; no horizontal scroll. |
| 1.2.3 | Mobile (e.g. 375×667). | Mobile menu opens from header; all sections stack vertically; buttons and links are tappable. |
| 1.2.4 | Resize from desktop to mobile. | No broken layout; menu and content adapt. |

### 1.3 Performance and SEO

| # | Step | Expected |
|---|------|----------|
| 1.3.1 | Open DevTools Network; reload landing page. | No failed requests (except optional analytics). Images load (or lazy-load below fold). |
| 1.3.2 | Check page title and meta description. | Meaningful title and description in `<head>`. |
| 1.3.3 | Check images. | All images have an `alt` attribute (from caption or title). |

---

## 2. Landing Page Editor (Admin)

### 2.1 Access and layout

| # | Step | Expected |
|---|------|----------|
| 2.1.1 | Log in as **Admin**; open **Landing Page** from sidebar. | Editor loads with section list (left), form (center), live preview (right). |
| 2.1.2 | Log in as **Teacher** or **Student**. | “Landing Page” is not visible in the sidebar. |
| 2.1.3 | If a non-admin opens the editor URL directly. | “Access denied” or equivalent (no write access). |

### 2.2 Section list and toggles

| # | Step | Expected |
|---|------|----------|
| 2.2.1 | Click each section in the list. | Center form updates to that section’s fields. |
| 2.2.2 | Turn off a section (e.g. Gallery) via toggle. | Preview updates (after refresh if needed); section disappears on public landing. |
| 2.2.3 | Turn the section back on. | Section reappears on landing page. |

### 2.3 Save and preview

| # | Step | Expected |
|---|------|----------|
| 2.3.1 | Edit Hero headline; click **Save**. | “Changes saved” (or similar) appears; preview iframe refreshes; public `landing.html` shows new headline. |
| 2.3.2 | Edit About body; click **Save**. | Changes persist and appear in preview and on public page. |
| 2.3.3 | Change CTA button label and URL; **Save**. | Button text and link update on landing page. |

### 2.4 Hero slides

| # | Step | Expected |
|---|------|----------|
| 2.4.1 | Upload one image in Hero “Slide images”. | Image appears in list; preview shows it as hero background. |
| 2.4.2 | Upload a second image. | Both slides present; preview shows first or cycling. |
| 2.4.3 | Delete one slide. | Slide removed from list and from landing page. |

### 2.5 Stats, Programs, News, Gallery, Testimonials

| # | Step | Expected |
|---|------|----------|
| 2.5.1 | Stats: add a new stat row; set label and value; **Save**. | New stat appears on landing page. |
| 2.5.2 | Programs: **Add Program**; set title, description, tag; upload image; **Save**. | New program card appears in Programs section. |
| 2.5.3 | News: **Add News Item**; set title, excerpt, date; **Save**. | New item appears in News section. |
| 2.5.4 | Gallery: upload one or more images; set caption. | Images appear in gallery; lightbox shows correct image and caption. |
| 2.5.5 | Testimonials: **Add Testimonial**; set quote, author, role; **Save**. | New testimonial appears in Testimonials section. |

### 2.6 Footer

| # | Step | Expected |
|---|------|----------|
| 2.6.1 | Edit footer mission and newsletter text; **Save**. | Footer on landing page shows updated text. |

---

## 3. Cross-browser (critical paths)

Run at least:

- **Chrome** (latest): Landing load, editor open, save hero, preview refresh.
- **Firefox** (latest): Same as above.
- **Safari** (latest, if available): Same as above.
- **Edge** (latest): Same as above.

Expected: No console errors; save works; preview and public page show saved content.

---

## 4. Quick smoke test (minimal)

1. Open `landing.html` → page loads, header and hero visible.
2. Log in as Admin → open **Landing Page** → editor loads.
3. Change Hero headline → **Save** → preview and public page show new headline.
4. On mobile width, open landing page → menu works; no layout break.

If all four pass, the main flow is working.
