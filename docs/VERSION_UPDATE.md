# Website version (landing page + login page)

The **landing page** footer and the **login page** (left panel below “TRUSTED PLATFORM”) show:

**Website vX · Updated D MMM YYYY, HH:MM**

Values come from the root file **`version.json`**.

## Automatic updates on deploy (real website)

On **every deploy** (e.g. when you push to git and Netlify builds):

- The build runs `npm run build`, which runs **`update_cache_buster.js`**.
- That script reads **git** (short commit SHA and last commit date) and writes **`version.json`**.
- So the **live site** always shows the version and date of the commit that was deployed.

No manual edit of `version.json` is needed for the real website after each deploy.

## Manual updates (optional)

If you deploy without git (e.g. zip upload) or want to override, you can edit **`version.json`**:

- **version** – e.g. `"abc1234"` (git short SHA) or `"1.0.0"`.
- **updated_at** – ISO 8601 date-time, e.g. `"2026-02-08T15:30:00"`.

The note is small, muted text and does not affect layout.
