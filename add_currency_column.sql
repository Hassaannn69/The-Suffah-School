ALTER TABLE settings ADD COLUMN IF NOT EXISTS currency text DEFAULT 'PKR';

-- Update existing row if any to default
UPDATE settings SET currency = 'PKR' WHERE currency IS NULL;
