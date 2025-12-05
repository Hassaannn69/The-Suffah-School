# 👥 How to Assign User Roles

Since your application uses **Supabase Auth Metadata** for roles, you need to assign roles directly in your Supabase project.

## 🎭 Available Roles
- **`admin`**: Full access to everything (Dashboard, Settings, Students, Teachers, etc.)
- **`teacher`**: Access to Dashboard, Students, Classes
- **`accountant`**: Access to Dashboard, Students, Fee Collection, Fee Generation
- **`student`**: Access to Dashboard only (Default role)

---

## 🔹 Method 1: Using Supabase Dashboard (Easiest)

1.  **Log in** to your [Supabase Dashboard](https://supabase.com/dashboard).
2.  Go to **Authentication** > **Users** from the left sidebar.
3.  Find the user you want to assign a role to.
4.  Click the **three dots (⋮)** next to their email and select **Edit User**.
5.  (Note: Supabase UI might not have a direct "Metadata" editor in the simple view yet. If not, use Method 2).

---

## 🔹 Method 2: Using SQL Editor (Recommended)

You can run a simple SQL command in your Supabase SQL Editor to assign a role to any user by their email.

1.  Go to the **SQL Editor** in your Supabase Dashboard.
2.  Click **New Query**.
3.  Paste the following code (replace the email and role):

```sql
-- UPDATE USER ROLE
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'  -- Change to: 'teacher', 'accountant', or 'admin'
)
WHERE email = 'newuser@example.com'; -- Change to the user's email
```

4.  Click **Run**.

---

## 🔹 Method 3: When Creating a New User (Invite)

If you are inviting a user via the Supabase Dashboard:

1.  Go to **Authentication** > **Users**.
2.  Click **Invite User**.
3.  Enter their email.
4.  There isn't a default field for metadata in the invite UI, so you will likely need to run the **SQL command from Method 2** after they accept the invite or immediately after you create them.

---

## 🔍 How to Verify a Role

To check what role a user has, run this SQL:

```sql
SELECT email, raw_user_meta_data->>'role' as role 
FROM auth.users 
WHERE email = 'newuser@example.com';
```
