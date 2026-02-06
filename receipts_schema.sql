-- One Receipt Per Payment Action
-- Run this in Supabase SQL Editor after fee_generation_schema.sql

-- 1. Create receipts table (parent of fee_payments for one receipt per collection action)
create table if not exists public.receipts (
  id uuid primary key default uuid_generate_v4(),
  receipt_number text unique not null,
  payment_date date not null,
  payment_method text check (payment_method in ('Cash', 'Bank', 'JazzCash', 'EasyPaisa', 'Cheque', 'Other')),
  total_paid numeric not null check (total_paid > 0),
  created_at timestamp with time zone default now()
);

-- 2. Add receipt_id to fee_payments (nullable for existing rows)
alter table public.fee_payments add column if not exists receipt_id uuid references public.receipts(id) on delete cascade;

create index if not exists idx_fee_payments_receipt_id on public.fee_payments(receipt_id);

-- 3. RLS for receipts (same roles as fee_payments)
alter table public.receipts enable row level security;

create policy "Admins and Accountants can manage receipts"
on public.receipts for all
using ( (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'accountant') );

create policy "Teachers can read receipts"
on public.receipts for select
using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher' );

-- Receipt numbers are generated in the app (e.g. R-2026-0001) by querying max(receipt_number) for current year.
