-- Expenses Table for The Suffah School
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.expenses (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  category text NOT NULL,
  amount numeric NOT NULL CHECK (amount >= 0),
  date date NOT NULL DEFAULT current_date,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Add Security Policies
-- Admins and Accountants can manage all expenses
CREATE POLICY "Admins and Accountants can manage expenses"
ON public.expenses FOR ALL
USING ( (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'accountant') );

-- Teachers can view expenses for transparency
CREATE POLICY "Teachers can view expenses"
ON public.expenses FOR SELECT
USING ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher' );

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
