-- Classes module: teacher_assignments, optional students.status
-- Run in Supabase SQL Editor. Requires: classes, teachers tables.

-- 1. Teacher assignments (persist Assign Class; used by Overview, Subjects, Teachers tabs)
create table if not exists public.teacher_assignments (
  id uuid primary key default uuid_generate_v4(),
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  section text not null default '',
  subject text not null default '',
  role text not null default 'subject_teacher' check (role in ('class_teacher', 'subject_teacher')),
  is_active boolean not null default true,
  created_at timestamp with time zone default now(),
  unique(teacher_id, class_id, section, subject)
);

create index if not exists idx_teacher_assignments_class_id on public.teacher_assignments(class_id);
create index if not exists idx_teacher_assignments_teacher_id on public.teacher_assignments(teacher_id);

alter table public.teacher_assignments enable row level security;

drop policy if exists "Admins can manage teacher_assignments" on public.teacher_assignments;
create policy "Admins can manage teacher_assignments"
on public.teacher_assignments for all
using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

drop policy if exists "Everyone can read teacher_assignments" on public.teacher_assignments;
create policy "Everyone can read teacher_assignments"
on public.teacher_assignments for select
using ( true );

-- Teachers can read their own assignments (for role-based filtering in Classes module)
drop policy if exists "Teachers can read own teacher_assignments" on public.teacher_assignments;
create policy "Teachers can read own teacher_assignments"
on public.teacher_assignments for select
using (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'teacher'
  and teacher_id in (select id from public.teachers where auth_id = auth.uid())
);

-- 2. Student status (active / transferred / promoted) for Students tab
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'students' and column_name = 'status'
  ) then
    alter table public.students add column status text default 'active';
    comment on column public.students.status is 'active, transferred, promoted';
  end if;
end $$;

-- Backfill existing rows
update public.students set status = 'active' where status is null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'students_status_check'
  ) then
    alter table public.students add constraint students_status_check
      check (status is null or status in ('active', 'transferred', 'promoted'));
  end if;
end $$;
