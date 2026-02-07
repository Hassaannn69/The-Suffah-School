"""
ZKTeco K20 → Supabase Teacher Attendance Sync

Run this script on a PC that can reach the K20 on your LAN.
It pulls attendance logs from the device and marks teachers as 'present'
in your Supabase teacher_attendance table for the punch dates.

Requirements:
  - K20 and this PC on the same network
  - Teachers enrolled on K20 with Employee ID as the user ID (PIN)
  - Python 3.7+, pyzk, requests, python-dotenv

Usage:
  pip install -r requirements.txt
  Copy .env.example to .env and fill in values
  python zkteco_sync.py
"""

import os
import sys
from datetime import datetime, timezone
from collections import defaultdict

try:
    from zk import ZK
except ImportError:
    print("Install pyzk: pip install pyzk")
    sys.exit(1)

try:
    import requests
except ImportError:
    print("Install requests: pip install requests")
    sys.exit(1)

try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv():
        pass

load_dotenv()

# ------------ Config (from environment) ------------
ZK_IP = os.getenv("ZK_IP", "").strip()
ZK_PORT = int(os.getenv("ZK_PORT", "4370"))
ZK_PASSWORD = os.getenv("ZK_PASSWORD", "").strip() or None
SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY", "").strip()

if not ZK_IP:
    print("Set ZK_IP in .env (e.g. 192.168.1.100)")
    sys.exit(1)
if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("Set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env (use Service Role key from Supabase Dashboard)")
    sys.exit(1)


def fetch_teachers():
    """Fetch all active teachers and map employee_id -> teacher id."""
    url = f"{SUPABASE_URL}/rest/v1/teachers"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    params = {"is_active": "eq.true", "select": "id,employee_id"}
    r = requests.get(url, headers=headers, params=params, timeout=15)
    r.raise_for_status()
    rows = r.json()
    # Normalize employee_id to string for matching (device often sends numeric string)
    return {str(t["employee_id"]).strip(): str(t["id"]) for t in rows if t.get("employee_id")}


def get_existing_attendance(teacher_ids, dates):
    """Return set of (teacher_id, date) already in teacher_attendance."""
    if not teacher_ids or not dates:
        return set()
    url = f"{SUPABASE_URL}/rest/v1/teacher_attendance"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    teacher_list = list(teacher_ids)[:200]
    date_list = list(dates)[:100]
    params = {
        "teacher_id": "in.(" + ",".join(f'"{t}"' for t in teacher_list) + ")",
        "date": "in.(" + ",".join(f'"{d}"' for d in date_list) + ")",
        "select": "teacher_id,date",
    }
    r = requests.get(url, headers=headers, params=params, timeout=15)
    r.raise_for_status()
    rows = r.json()
    return {(row["teacher_id"], row["date"]) for row in rows}


def insert_attendance(rows):
    """Insert teacher_attendance rows (teacher_id, date, status=present)."""
    if not rows:
        return
    url = f"{SUPABASE_URL}/rest/v1/teacher_attendance"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json",
    }
    payload = [
        {"teacher_id": r["teacher_id"], "date": r["date"], "status": "present"}
        for r in rows
    ]
    r = requests.post(url, headers=headers, json=payload, timeout=15)
    r.raise_for_status()


def main():
    print("Fetching teacher list from Supabase...")
    emp_to_teacher = fetch_teachers()
    print(f"  Found {len(emp_to_teacher)} teachers with employee_id")

    print("Connecting to ZKTeco K20 at", ZK_IP, "port", ZK_PORT)
    zk = ZK(ZK_IP, port=ZK_PORT, timeout=10, password=ZK_PASSWORD)
    conn = None
    try:
        conn = zk.connect()
        logs = conn.get_attendance()
    except Exception as e:
        print("Device connection failed:", e)
        print("Check: same network, correct ZK_IP, and Password in comm. (ZK_PASSWORD) if set on device.")
        sys.exit(1)
    finally:
        if conn:
            conn.disconnect()

    # Build (teacher_id, date) from punches. Use date in UTC if timestamp is naive.
    punch_by_teacher_date = defaultdict(set)
    for rec in logs:
        user_id = getattr(rec, "user_id", None)
        if user_id is None:
            continue
        ts = getattr(rec, "timestamp", None)
        if not ts:
            continue
        teacher_id = emp_to_teacher.get(str(user_id).strip())
        if not teacher_id:
            continue
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
        date_str = ts.date().isoformat()
        punch_by_teacher_date[(teacher_id, date_str)].add(ts)

    if not punch_by_teacher_date:
        print("No matching punches (ensure teachers are enrolled on K20 with Employee ID as user ID)")
        return

    teacher_ids = {t for t, _ in punch_by_teacher_date}
    dates = {d for _, d in punch_by_teacher_date}
    existing = get_existing_attendance(teacher_ids, dates)
    to_insert = [
        {"teacher_id": t, "date": d}
        for (t, d) in punch_by_teacher_date
        if (t, d) not in existing
    ]
    if not to_insert:
        print("All punched dates already in teacher_attendance. Done.")
        return

    print("Inserting", len(to_insert), "attendance record(s)...")
    insert_attendance(to_insert)
    print("Done. Teacher attendance updated in your website.")


if __name__ == "__main__":
    main()
