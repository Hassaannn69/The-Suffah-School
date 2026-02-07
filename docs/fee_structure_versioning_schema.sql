-- Fee Structure Versioning Schema
-- Single source of truth: versioned fee structures, immutable history, no retroactive changes.
-- Run in Supabase SQL Editor after main schema. Does NOT alter existing fees or student_discounts.

-- 1. Fee structure versions (one active per school)
create table if not exists public.fee_structure_versions (
  id uuid primary key default gen_random_uuid(),
  version_label text not null,
  effective_from date not null,
  is_active boolean not null default false,
  status text not null default 'archived' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  updated_at timestamptz default now()
);

create unique index if not exists idx_fee_structure_versions_one_active
  on public.fee_structure_versions (is_active) where is_active = true;

create index if not exists idx_fee_structure_versions_effective on public.fee_structure_versions(effective_from desc);

-- 2. Per-class fees per version (class_name for compatibility with students.class text)
create table if not exists public.fee_structure_classes (
  id uuid primary key default gen_random_uuid(),
  fee_structure_version_id uuid not null references public.fee_structure_versions(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  class_name text not null,
  base_monthly_fee numeric not null check (base_monthly_fee >= 0) default 0,
  admission_fee numeric check (admission_fee >= 0) default 0,
  exam_fee numeric check (exam_fee >= 0) default 0,
  misc_charges numeric check (misc_charges >= 0) default 0,
  created_at timestamptz default now(),
  unique(fee_structure_version_id, class_name)
);

create index if not exists idx_fee_structure_classes_version on public.fee_structure_classes(fee_structure_version_id);

-- 3. Discount rules per version (applied only at admission; stored with student snapshot)
create table if not exists public.fee_structure_discount_rules (
  id uuid primary key default gen_random_uuid(),
  fee_structure_version_id uuid not null references public.fee_structure_versions(id) on delete cascade,
  sibling_discount_percent numeric check (sibling_discount_percent >= 0 and sibling_discount_percent <= 100) default 0,
  staff_child_discount_percent numeric check (staff_child_discount_percent >= 0 and staff_child_discount_percent <= 100) default 0,
  early_admission_discount_percent numeric check (early_admission_discount_percent >= 0 and early_admission_discount_percent <= 100) default 0,
  early_admission_discount_fixed numeric check (early_admission_discount_fixed >= 0) default 0,
  created_at timestamptz default now(),
  unique(fee_structure_version_id)
);

-- 4. Student fee snapshot (locked at admission; never updated by version changes)
create table if not exists public.student_fee_snapshots (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  fee_structure_version_id uuid not null references public.fee_structure_versions(id) on delete restrict,
  base_fee numeric not null check (base_fee >= 0) default 0,
  admission_fee numeric check (admission_fee >= 0) default 0,
  exam_fee numeric check (exam_fee >= 0) default 0,
  misc_charges numeric check (misc_charges >= 0) default 0,
  sibling_discount_percent numeric default 0,
  staff_discount_percent numeric default 0,
  early_discount_value numeric default 0,
  final_base_monthly numeric not null check (final_base_monthly >= 0) default 0,
  discount_rules_applied jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(student_id)
);

create index if not exists idx_student_fee_snapshots_student on public.student_fee_snapshots(student_id);
create index if not exists idx_student_fee_snapshots_version on public.student_fee_snapshots(fee_structure_version_id);

-- 5. Add version link to students (nullable for existing students)
alter table public.students add column if not exists fee_structure_version_id uuid references public.fee_structure_versions(id) on delete set null;

create index if not exists idx_students_fee_structure_version on public.students(fee_structure_version_id);

-- 6. RLS
alter table public.fee_structure_versions enable row level security;
alter table public.fee_structure_classes enable row level security;
alter table public.fee_structure_discount_rules enable row level security;
alter table public.student_fee_snapshots enable row level security;

-- Versions: admin/accountant manage; anon can read active (for brochure)
drop policy if exists "Admin accountant manage fee_structure_versions" on public.fee_structure_versions;
create policy "Admin accountant manage fee_structure_versions" on public.fee_structure_versions
  for all using ( (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'accountant') );

drop policy if exists "Public read active fee_structure_versions" on public.fee_structure_versions;
create policy "Public read active fee_structure_versions" on public.fee_structure_versions
  for select using ( is_active = true );

-- Classes: admin/accountant manage; anon can read where version is active
drop policy if exists "Admin accountant manage fee_structure_classes" on public.fee_structure_classes;
create policy "Admin accountant manage fee_structure_classes" on public.fee_structure_classes
  for all using ( (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'accountant') );

drop policy if exists "Public read fee_structure_classes active" on public.fee_structure_classes;
create policy "Public read fee_structure_classes active" on public.fee_structure_classes
  for select using (
    exists (select 1 from public.fee_structure_versions v where v.id = fee_structure_version_id and v.is_active = true)
  );

-- Discount rules: admin/accountant manage; anon read for active version
drop policy if exists "Admin accountant manage fee_structure_discount_rules" on public.fee_structure_discount_rules;
create policy "Admin accountant manage fee_structure_discount_rules" on public.fee_structure_discount_rules
  for all using ( (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'accountant') );

drop policy if exists "Public read fee_structure_discount_rules active" on public.fee_structure_discount_rules;
create policy "Public read fee_structure_discount_rules active" on public.fee_structure_discount_rules
  for select using (
    exists (select 1 from public.fee_structure_versions v where v.id = fee_structure_version_id and v.is_active = true)
  );

-- Snapshots: admin/accountant full; students read own (if needed later)
drop policy if exists "Admin accountant manage student_fee_snapshots" on public.student_fee_snapshots;
create policy "Admin accountant manage student_fee_snapshots" on public.student_fee_snapshots
  for all using ( (auth.jwt() -> 'user_metadata' ->> 'role') in ('admin', 'accountant') );

drop policy if exists "Teachers read student_fee_snapshots" on public.student_fee_snapshots;
create policy "Teachers read student_fee_snapshots" on public.student_fee_snapshots
  for select using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher' );

-- 7. Seed one active version if none exists (so dashboard and brochure have data)
insert into public.fee_structure_versions (version_label, effective_from, is_active, status)
select '2024-25', current_date, true, 'active'
where not exists (select 1 from public.fee_structure_versions where is_active = true);
