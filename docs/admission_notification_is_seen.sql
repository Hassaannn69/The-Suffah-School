-- ========== ADMISSION NOTIFICATION: is_seen (persistent badge state) ==========
-- Run after apply_schema_migration.sql. Adds is_seen so badge does not reappear after refresh.

-- Add column (nullable first for existing rows, then backfill and set NOT NULL)
ALTER TABLE online_applications ADD COLUMN IF NOT EXISTS is_seen boolean DEFAULT false;

-- Backfill: treat all existing rows as already seen so badge does not spike after migration
UPDATE online_applications SET is_seen = true;

-- Enforce NOT NULL for new rows (default already set above)
ALTER TABLE online_applications ALTER COLUMN is_seen SET NOT NULL;
ALTER TABLE online_applications ALTER COLUMN is_seen SET DEFAULT false;

-- Index for fast unseen count (badge query)
CREATE INDEX IF NOT EXISTS idx_online_applications_is_seen ON online_applications(is_seen) WHERE is_seen = false;
