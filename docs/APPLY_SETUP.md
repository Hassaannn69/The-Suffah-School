# Apply Page – Full Setup (Do Everything)

> **Not SQL.** This is a setup guide (Markdown). Do **not** paste this file into the Supabase SQL Editor. For database setup, run **`apply_schema_migration.sql`** in the SQL Editor instead.

One-command setup for the **Apply** flow (student + teacher applications and teacher CV uploads).

## One command (recommended)

1. **Get credentials from Supabase Dashboard:**
   - **Project Settings → Database** → Connection string (URI), e.g. `postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres`
   - **Project Settings → API** → `service_role` (secret key)

2. **Set them** (once) in a `.env` file in the project root:

   ```
   SUPABASE_DB_URL=postgresql://postgres:YOUR_PASSWORD@db.xxx.supabase.co:5432/postgres
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

   Or set the same variables in your environment.

3. **Install dependencies and run:**

   ```bash
   npm install
   npm run setup-apply
   ```

   This runs the migration SQL (adds columns, creates `teacher_applications`, storage policy) and creates the **teacher-cvs** bucket. When it finishes, the Apply page is fully set up.

---

## If you prefer to do it in two steps

### Step 1: Database

In **Supabase Dashboard** → **SQL Editor**, run the entire file:

- **`docs/apply_schema_migration.sql`**

### Step 2: Storage bucket

```bash
# Set service role key, then:
npm run setup-apply-storage
```

Or create the bucket manually: **Storage** → **New bucket** → name **`teacher-cvs`** → Public.

---

## What gets set up

- **Student applications** → `online_applications` (including `home_address`, `extra_curricular`, `last_grade_completed`).
- **Teacher applications** → `teacher_applications` table.
- **Teacher CVs** → Storage bucket **`teacher-cvs`** and policy so the apply page can upload.

Landing **Apply Now** goes to **`apply.html`** (Student / Teacher choice and forms).

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Student submit fails (column does not exist) | Run **`docs/apply_schema_migration.sql`** in Supabase SQL Editor (or run `npm run setup-apply` with `SUPABASE_DB_URL` set). |
| Teacher submit fails (table does not exist) | Same: run the migration. |
| Teacher CV upload fails | Ensure bucket **`teacher-cvs`** exists (`npm run setup-apply-storage` or create in Storage). Ensure migration was run so the storage policy exists. |
| "new row violates row-level security" on upload | Re-run the migration so the **"Allow public upload teacher-cvs"** policy exists. |
| `npm run setup-apply` skips migration | Set **SUPABASE_DB_URL** (or **DATABASE_URL**) and ensure **pg** is installed (`npm install`). |
| **Applications not showing in admin panel** | Ensure the admin user has **User Metadata** or **App Metadata** set to `{"role": "admin"}` (Supabase → Authentication → Users → edit user). RLS policies check both; if it still fails, check the browser console for the exact error. |
