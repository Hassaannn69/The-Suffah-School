# Landing Page – Staff Guide

This guide explains how to update the school website’s public landing page (hero, about, news, gallery, etc.) from the admin portal **without editing any code**.

---

## Opening the Landing Page Editor

1. Log in to the **school portal** as an **Admin**.
2. In the **left sidebar**, click **Landing Page**.
3. The **Landing Page Editor** opens with three areas:
   - **Left:** List of sections (Hero, About Us, Stats, Programs, News, Gallery, Testimonials, Call to Action, Footer).
   - **Center:** Edit form for the section you have selected.
   - **Right:** **Live preview** of the public landing page (refreshes after you save).

---

## Section Toggles

- Each section has an **on/off toggle** (right side of the row).
- **On (blue):** The section is shown on the public landing page.
- **Off (grey):** The section is hidden.
- Click the toggle to change it; changes take effect immediately (you can confirm in the preview).

---

## Editing Each Section

### Hero Section (main banner)

- **Main Headline** – Large title on the hero (e.g. “Welcome to The Suffah School”).
- **Subtext** – Short description below the headline.
- **CTA Button Label** – Text on the main button (e.g. “Explore Programs”).
- **CTA URL** – Link for that button (e.g. `#programs` or `index.html`).
- **Slide images** – Hero background/slideshow:
  - Click or drag images into the upload area.
  - Recommended size: about **1200×600 px** (or similar). Formats: PNG, JPG, GIF.
  - You can add several slides; the first is used by default and they can rotate.
  - Use **Delete** next to a slide to remove it.

### About Us

- **Title** – Section heading (e.g. “About Us”).
- **Body** – Main text (you can use multiple lines).
- **Philosophy** – Optional short tagline or philosophy line.

### Stats (counters)

- List of stat items, each with:
  - **Label** – e.g. “Students Enrolled”, “Awards Won”.
  - **Value** – e.g. “1,200+”, “15:1”, “100%”.
- Use **+ Add stat** to add a row; use **Remove** on a row to delete it.

### Programs

- Each program card has: **Title**, **Description**, **Tag** (e.g. “Ages 3–5”), **Link URL**, and an **image**.
- **Add Program** – Creates a new program card.
- **Delete** – Removes that program.
- To add/change an image, use the **file input** under the card; recommended size around **800×500 px**.

### News & Events

- Each item has: **Title**, **Excerpt**, **Date**, **Category**, **Link URL**, and an **image**.
- **Add News Item** – Creates a new news entry.
- **Delete** – Removes that item.
- Use the file input to set or change the image.

### Photo Gallery

- **Click to upload** – Add one or more images.
- Each image can have a **Caption** (edit in the text field and click outside or press Enter to save).
- Use the **×** on an image to remove it from the gallery.

### Testimonials

- Each testimonial has: **Quote**, **Author name**, **Role** (e.g. Parent, Student), and optional **image**.
- **Add Testimonial** – Creates a new one.
- **Delete** – Removes that testimonial.

### Call to Action (CTA)

- **Title** – Main line (e.g. “Ready to Join Our Community?”).
- **Description** – Short supporting text.
- **Primary / Secondary button** – Label and URL for each button (e.g. “Apply Now” → `index.html`).

### Footer

- **Mission / Tagline** – Short line under the logo.
- **Newsletter text** – Text for the “Stay connected” area.

---

## Saving Changes

- After editing any section, click the **Save** button (top right of the editor).
- The **Live preview** (right side) will refresh so you can check the result.
- A short **“Changes saved”** message appears after a successful save.
- **Important:** If you switch to another section without clicking **Save**, changes in the current section are not saved. Always click **Save** when you are done editing a section.

---

## Image Guidelines

- **Hero slides:** About **1200×600 px** (or similar 2:1 ratio). PNG, JPG, or GIF.
- **Program / News / Testimonials:** About **800×500 px** or similar. Keeps the site fast and clear.
- **Gallery:** Any reasonable size; the page will scale them. Prefer compressed JPG/PNG.
- Avoid very large files (e.g. multi‑MB) so the landing page stays fast.

---

## Viewing the Public Landing Page

- **From the editor:** Use the **Live preview** panel on the right.
- **In the browser:** Open your school site and go to the **landing page** (e.g. `yoursite.com/landing.html`).
- **Portal login:** From the landing page, use **Portal Login** or **Apply Now** to go to the login page (`index.html`).

---

## Troubleshooting

- **“Access denied”** – Only users with the **Admin** role can open the Landing Page Editor. If you don’t see **Landing Page** in the sidebar, your account may not be an admin.
- **Preview not updating** – Click **Save** and wait a moment; the iframe will reload. If it doesn’t, refresh the dashboard page and open **Landing Page** again.
- **Images not showing** – Ensure the image was uploaded successfully (no error message). If the bucket or permissions were changed, contact your technical admin.

---

## Need More Help?

For technical issues (e.g. schema, storage, or permissions), refer to the project documentation or your system administrator. The landing content is stored in Supabase; the editor is the only place staff need to update text and images.
