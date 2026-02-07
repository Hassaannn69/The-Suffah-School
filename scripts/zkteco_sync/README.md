# ZKTeco K20 → Website Attendance Sync

Your K20 only has **IP, Subnet, Gateway, DHCP, Password**—no "Server URL". So the device cannot push to the web. This script **pulls** attendance from the K20 and sends it to your Supabase `teacher_attendance` table so it shows on your website.

## How it works

1. Run this script on a **PC that can reach the K20** (same LAN).
2. The script connects to the K20 over the network (default port 4370), fetches all attendance logs.
3. For each punch it finds a teacher by **Employee ID** (the user ID on the device must match the teacher’s **Employee ID** in your site).
4. It inserts a **present** record for that teacher for that date in `teacher_attendance` (only if not already there).

## Setup

### 1. On the K20

- Set **IP address** (or use DHCP and note the IP).
- If you set **Password in comm.**, you’ll need that for the script.

### 2. Enroll teachers on the K20

- When adding a user on the device, set the **User ID / PIN** to the **same value** as that teacher’s **Employee ID** in your website (e.g. `T001`, `EMP-101`).  
  Then the script can match punches to teachers.

### 3. On the PC (same network as K20)

```bash
cd scripts/zkteco_sync
pip install -r requirements.txt
```

Copy env example and edit:

```bash
copy .env.example .env
```

Edit `.env`:

| Variable | Meaning |
|----------|--------|
| `ZK_IP` | K20’s IP (yours: `192.168.1.201`) |
| `ZK_PORT` | Usually `4370` |
| `ZK_PASSWORD` | Leave empty unless you set "Password in comm." on the device |
| `SUPABASE_URL` | Your Supabase project URL (e.g. `https://kgwvbetqffvfcbswexre.supabase.co`) |
| `SUPABASE_SERVICE_KEY` | **Service role** key from Supabase Dashboard → Project Settings → API (keep this secret) |

### 4. Run the sync

```bash
python zkteco_sync.py
```

Run it whenever you want to pull new punches (e.g. once in the morning, or on a schedule with Task Scheduler / cron).

## Optional: run on a schedule

- **Windows:** Task Scheduler → create a task that runs `python C:\path\to\scripts\zkteco_sync\zkteco_sync.py` daily (e.g. after school).
- **Linux/Mac:** Add a cron job, e.g. `0 18 * * * cd /path/to/zkteco_sync && python zkteco_sync.py`.

## Troubleshooting

- **"Device connection failed"**  
  Same network as K20? Correct `ZK_IP`? If the device has a communication password, set `ZK_PASSWORD` in `.env`.

- **"No matching punches"**  
  Make sure teachers are enrolled on the K20 with **User ID = Employee ID** from your website. Check that `teachers` in Supabase have `employee_id` set.

- **Supabase errors**  
  Use the **service_role** key (not anon). Ensure `teacher_attendance` table exists and RLS allows the service role to insert.
