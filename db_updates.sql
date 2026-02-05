-- Add discount column to fees table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fees' AND column_name = 'discount') THEN
        ALTER TABLE public.fees ADD COLUMN discount NUMERIC(10, 2) DEFAULT 0;
    END IF;
END $$;
