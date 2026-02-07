# ZKTeco K20 Sync — Start Here

Do these steps **in order** on a Windows PC that is on the **same Wi‑Fi/network** as the K20 (192.168.1.201).

---

## Step 1: Install Python (if you don’t have it)

1. Open **https://www.python.org/downloads/**
2. Click **Download Python 3.x**
3. Run the installer
4. **Important:** Tick **“Add Python to PATH”**, then click **Install Now**
5. Close and reopen any Command Prompt or PowerShell window after installation

To check: open **Command Prompt** and type:

```text
python --version
```

You should see something like `Python 3.11.x`. If you see “not recognized”, Python is not in PATH—run the installer again and tick “Add Python to PATH”.

---

## Step 2: Open the sync folder in Command Prompt

1. Press **Win + R**, type `cmd`, press Enter
2. Go to your project folder and then into the sync folder. For example, if your project is on the Desktop:

```text
cd Desktop\Suffah_School_Website\scripts\zkteco_sync
```

If your project is somewhere else, change the path. Example if it’s in `C:\Projects\Suffah_School_Website`:

```text
cd C:\Projects\Suffah_School_Website\scripts\zkteco_sync
```

---

## Step 3: Install the script’s dependencies

In the same Command Prompt window, run:

```text
py -m pip install -r requirements.txt
```

(On Windows, `py -m pip` often works when `pip` alone doesn’t. If that fails, try `python -m pip install -r requirements.txt`.)

Wait until it finishes without errors.

---

## Step 4: Create your `.env` file

1. In File Explorer, go to:  
   `Suffah_School_Website\scripts\zkteco_sync`
2. Find the file **`.env.example`**
3. **Copy** it (right‑click → Copy)
4. **Paste** in the same folder (right‑click → Paste)
5. **Rename** the copied file from `.env.example` to **`.env`**  
   (If you don’t see the dot, enable “Show file name extensions” in File Explorer.)
6. Open **`.env`** in Notepad and leave the first lines as they are. You only need to add the **Supabase Service Key** (Step 5).

---

## Step 5: Get your Supabase Service Key

1. Open **https://supabase.com** and sign in
2. Open your **Suffah** project
3. Click **Project Settings** (gear icon in the left menu)
4. Click **API** in the left sidebar
5. On the right you’ll see:
   - **Project URL** — already in your `.env` as `SUPABASE_URL`
   - **Project API keys** — find the key named **`service_role`** (not “anon”)
6. Click **Reveal** next to `service_role` and **Copy** the long key
7. Open your **`.env`** file again and paste that key after the `=` on the line that says:

```text
SUPABASE_SERVICE_KEY=
```

So it looks like:

```text
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...very long key...
```

8. Save the file and close Notepad.

**Important:** Never share the `service_role` key or put it on the internet. It’s only for this script on your PC.

---

## Step 6: Match teachers on the K20 to your website

On your **website** (Teacher Attendance or Teachers list), each teacher has an **Employee ID** (e.g. `T001`, `101`).

On the **K20 device**, when you add a user, set the **User ID / PIN** to **exactly** that same Employee ID.  
Then when someone punches in, the script can mark the right teacher as present.

If you’re not sure:
- Add one teacher on the website and note their Employee ID
- On the K20, add that person and use that same ID as the user number/PIN

---

## Step 7: Run the sync

1. Open **Command Prompt** again
2. Go to the sync folder (same as Step 2):

```text
cd Desktop\Suffah_School_Website\scripts\zkteco_sync
```

(Change the path if your project is elsewhere.)

3. Run:

```text
py zkteco_sync.py
```

(If that says “py is not recognized”, try `python zkteco_sync.py` instead.)

4. You should see messages like:
   - Fetching teacher list from Supabase...
   - Connecting to ZKTeco K20 at 192.168.1.201...
   - Inserting X attendance record(s)...
   - Done.

5. Open your **website** → **Teacher Attendance** and pick today’s date. Teachers who punched in should show as **Present**.

---

## If something goes wrong

- **“Set ZK_IP in .env”**  
  Open `.env` and make sure the line `ZK_IP=192.168.1.201` is there and has no extra spaces.

- **“Device connection failed”**  
  - Is the PC on the same Wi‑Fi/network as the K20?
  - Can you ping the device? In Command Prompt type: `ping 192.168.1.201`
  - If you set a “Password in comm.” on the K20, add it in `.env` as `ZK_PASSWORD=yourpassword`

- **“Set SUPABASE_URL and SUPABASE_SERVICE_KEY”**  
  You didn’t add the service role key. Do Step 5 again and paste the **service_role** key into `SUPABASE_SERVICE_KEY=` in `.env`.

- **“No matching punches”**  
  Either no one has punched in yet, or the User ID on the K20 doesn’t match the Employee ID on the website. Check Step 6.

---

## Run it again later

Whenever you want to update attendance from the K20:

1. Open Command Prompt
2. `cd` to `Suffah_School_Website\scripts\zkteco_sync`
3. Run: `python zkteco_sync.py`

You can run it once a day (e.g. after school) or more often if you like.
