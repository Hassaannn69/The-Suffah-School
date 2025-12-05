-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create Tables

-- A) Students
create table public.students (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  roll_no text unique not null,
  class text not null,
  section text not null,
  gender text check (gender in ('Male', 'Female', 'Other')),
  email text,
  phone text,
  address text,
  admission_date date default current_date,
  tuition_fee numeric default 0,
  transport_fee numeric default 0,
  admission_fee numeric default 0,
  created_at timestamp with time zone default now()
);

-- B) Classes
create table public.classes (
  id uuid primary key default uuid_generate_v4(),
  class_name text not null unique,
  sections text[] not null default '{}'
);

-- C) Fees
create table public.fees (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid references public.students(id) on delete cascade,
  fee_type text not null,
  month text not null,
  amount numeric not null,
  due_date date,
  discount numeric default 0,
  additional_charges numeric default 0,
  status text default 'unpaid' check (status in ('paid', 'unpaid', 'partial')),
  issued_at timestamp with time zone default now()
);

-- E) Settings
create table public.settings (
  id uuid primary key default uuid_generate_v4(),
  school_name text default 'My School',
  logo_url text,
  default_fee_structure jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default now()
);

-- Insert default settings row if not exists
insert into public.settings (id, school_name)
select uuid_generate_v4(), 'My School'
where not exists (select 1 from public.settings);

-- F) Fee Types
create table public.fee_types (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  description text,
  created_at timestamp with time zone default now()
);

-- G) Class Fees (Junction table linking classes to fee types with amounts)
create table public.class_fees (
  id uuid primary key default uuid_generate_v4(),
  class_id uuid references public.classes(id) on delete cascade,
  fee_type_id uuid references public.fee_types(id) on delete cascade,
  amount numeric not null check (amount >= 0),
  created_at timestamp with time zone default now(),
  unique(class_id, fee_type_id)
);

-- 2. Enable Row Level Security (RLS)
alter table public.students enable row level security;
alter table public.classes enable row level security;
alter table public.fees enable row level security;
alter table public.settings enable row level security;
alter table public.fee_types enable row level security;
alter table public.class_fees enable row level security;

-- 3. Create Policies

-- Helper function to check user role (assuming metadata contains 'role')
-- Note: In a real scenario, we might use a custom claims or a separate users table linked to auth.users.
-- For this setup, we'll rely on Supabase Auth Metadata or a simplified check.
-- Since we can't easily modify auth.users metadata from SQL without triggers, 
-- we will assume the client sets up metadata or we check a public profile table.
-- HOWEVER, the prompt says "User roles in Supabase 'auth.users' metadata".
-- Accessing metadata in RLS: (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role'

-- Students Table Policies
create policy "Admins have full access to students"
on public.students for all
using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

create policy "Teachers have read-only access to students"
on public.students for select
using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher' );

create policy "Accountants have read/write access to students"
on public.students for all
using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'accountant' );

-- Fees Table Policies
create policy "Admins and Accountants can manage fees"
on public.fees for all
using ( (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'accountant') );

create policy "Teachers can read fees"
on public.fees for select
using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher' );

create policy "Students can read their own fees"
on public.fees for select
using ( student_id::text = (auth.uid()::text) ); -- This assumes students authenticate and their Auth ID matches Student ID, OR we link them. 
-- *Correction*: The prompt says "Students cannot access other students' data". 
-- If students are users, we need to link auth.users to students table. 
-- For now, let's assume the 'student' role logic if they log in. 
-- If students don't log in (only admin/staff), this policy might be moot but good for safety.

-- Classes Table Policies
create policy "Everyone can read classes"
on public.classes for select
using ( true );

create policy "Admins can manage classes"
on public.classes for all
using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

-- Settings Table Policies
create policy "Admins can manage settings"
on public.settings for all
using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

create policy "Everyone can read settings"
on public.settings for select
using ( true );

-- Fee Types Table Policies
create policy "Admins and Accountants can manage fee types"
on public.fee_types for all
using ( (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'accountant') );

create policy "Teachers can read fee types"
on public.fee_types for select
using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher' );

create policy "Everyone can read fee types"
on public.fee_types for select
using ( true );

-- Class Fees Table Policies
create policy "Admins and Accountants can manage class fees"
on public.class_fees for all
using ( (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'accountant') );

create policy "Teachers can read class fees"
on public.class_fees for select
using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher' );

create policy "Everyone can read class fees"
on public.class_fees for select
using ( true );

-- 4. Storage (Optional - for Logo)
-- insert into storage.buckets (id, name) values ('school-assets', 'school-assets');
-- create policy "Public Access to Logos" on storage.objects for select using ( bucket_id = 'school-assets' );
