-- Optional: Add columns to classes for Add New Class modal (academic year, stream, status, capacity, notes, default teacher).
-- Run in Supabase SQL Editor if you want to persist these fields. The modal works without this (saves only class_name + sections).

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'classes' and column_name = 'academic_year') then
    alter table public.classes add column academic_year text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'classes' and column_name = 'stream') then
    alter table public.classes add column stream text default 'General';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'classes' and column_name = 'is_active') then
    alter table public.classes add column is_active boolean not null default true;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'classes' and column_name = 'max_capacity') then
    alter table public.classes add column max_capacity int default 30;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'classes' and column_name = 'internal_notes') then
    alter table public.classes add column internal_notes text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'classes' and column_name = 'default_teacher_id') then
    alter table public.classes add column default_teacher_id uuid references public.teachers(id) on delete set null;
  end if;
end $$;
