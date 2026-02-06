-- Landing Page CMS: tables, storage bucket, and RLS
-- Run this in Supabase SQL Editor after main schema.

-- 1. Tables

-- Section visibility and order (one row per section)
create table if not exists public.landing_sections (
  id uuid primary key default uuid_generate_v4(),
  section_key text not null unique,
  enabled boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamp with time zone default now()
);

-- Singleton content for hero, about, CTA, footer, stats
create table if not exists public.landing_content (
  id uuid primary key default uuid_generate_v4(),
  section_key text not null unique,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamp with time zone default now()
);

-- Hero slideshow images
create table if not exists public.landing_hero_slides (
  id uuid primary key default uuid_generate_v4(),
  image_url text not null,
  caption text,
  sort_order integer not null default 0,
  created_at timestamp with time zone default now()
);

-- News / announcements / events
create table if not exists public.landing_news (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  excerpt text,
  body text,
  image_url text,
  category text,
  date date,
  link_url text,
  sort_order integer not null default 0,
  created_at timestamp with time zone default now()
);

-- Programs / courses cards
create table if not exists public.landing_programs (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  image_url text,
  tag text,
  link_url text,
  sort_order integer not null default 0,
  created_at timestamp with time zone default now()
);

-- Gallery images
create table if not exists public.landing_gallery (
  id uuid primary key default uuid_generate_v4(),
  image_url text not null,
  caption text,
  sort_order integer not null default 0,
  created_at timestamp with time zone default now()
);

-- Testimonials
create table if not exists public.landing_testimonials (
  id uuid primary key default uuid_generate_v4(),
  quote text not null,
  author_name text,
  author_role text,
  image_url text,
  sort_order integer not null default 0,
  created_at timestamp with time zone default now()
);

-- Seed default sections (order matches plan)
insert into public.landing_sections (section_key, enabled, sort_order) values
  ('hero', true, 0),
  ('about', true, 1),
  ('stats', true, 2),
  ('programs', true, 3),
  ('news', true, 4),
  ('gallery', true, 5),
  ('testimonials', true, 6),
  ('cta', true, 7),
  ('footer', true, 8)
on conflict (section_key) do update set sort_order = excluded.sort_order;

-- Seed default content placeholders
insert into public.landing_content (section_key, content) values
  ('hero', '{"headline":"Welcome to The Suffah School","subtext":"Empowering students to achieve excellence through innovation, creativity, and community.","cta_label":"Explore Programs","cta_url":"#programs","video_url":""}'::jsonb),
  ('about', '{"title":"About Us","body":"We are committed to providing a holistic education that nurtures future leaders.","philosophy":""}'::jsonb),
  ('stats', '{"items":[{"label":"Students Enrolled","value":"1,200+"},{"label":"Student-Teacher Ratio","value":"15:1"},{"label":"Awards Won","value":"50+"},{"label":"University Acceptance","value":"100%"}]}'::jsonb),
  ('cta', '{"title":"Ready to Join Our Community?","description":"Discover the possibilities that await. Schedule a visit or start your application today.","primary_label":"Apply Now","primary_url":"index.html","secondary_label":"Contact Admissions","secondary_url":"#contact"}'::jsonb),
  ('footer', '{"mission":"Excellence in education.","quick_links":[{"label":"About Us","url":"#about"},{"label":"Admissions","url":"#admissions"},{"label":"Contact","url":"#contact"}],"newsletter_text":"Subscribe for updates.","social":[]}'::jsonb)
on conflict (section_key) do nothing;

-- 2. RLS

alter table public.landing_sections enable row level security;
alter table public.landing_content enable row level security;
alter table public.landing_hero_slides enable row level security;
alter table public.landing_news enable row level security;
alter table public.landing_programs enable row level security;
alter table public.landing_gallery enable row level security;
alter table public.landing_testimonials enable row level security;

-- Read: anon + authenticated (for public landing page and editor)
create policy "Anyone can read landing_sections"
on public.landing_sections for select using ( true );

create policy "Anyone can read landing_content"
on public.landing_content for select using ( true );

create policy "Anyone can read landing_hero_slides"
on public.landing_hero_slides for select using ( true );

create policy "Anyone can read landing_news"
on public.landing_news for select using ( true );

create policy "Anyone can read landing_programs"
on public.landing_programs for select using ( true );

create policy "Anyone can read landing_gallery"
on public.landing_gallery for select using ( true );

create policy "Anyone can read landing_testimonials"
on public.landing_testimonials for select using ( true );

-- Write: admin only
create policy "Admins can manage landing_sections"
on public.landing_sections for all
using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

create policy "Admins can manage landing_content"
on public.landing_content for all
using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

create policy "Admins can manage landing_hero_slides"
on public.landing_hero_slides for all
using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

create policy "Admins can manage landing_news"
on public.landing_news for all
using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

create policy "Admins can manage landing_programs"
on public.landing_programs for all
using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

create policy "Admins can manage landing_gallery"
on public.landing_gallery for all
using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

create policy "Admins can manage landing_testimonials"
on public.landing_testimonials for all
using ( (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' );

-- 3. Storage bucket for landing media

insert into storage.buckets (id, name, public)
values ('landing-media', 'landing-media', true)
on conflict (id) do update set public = true;

-- Public read
drop policy if exists "Public read landing-media" on storage.objects;
create policy "Public read landing-media"
on storage.objects for select
using ( bucket_id = 'landing-media' );

-- Authenticated upload/update/delete (admin enforced in app)
drop policy if exists "Authenticated write landing-media" on storage.objects;
create policy "Authenticated write landing-media"
on storage.objects for insert
with check ( bucket_id = 'landing-media' and auth.role() = 'authenticated' );

drop policy if exists "Authenticated update landing-media" on storage.objects;
create policy "Authenticated update landing-media"
on storage.objects for update
using ( bucket_id = 'landing-media' and auth.role() = 'authenticated' );

drop policy if exists "Authenticated delete landing-media" on storage.objects;
create policy "Authenticated delete landing-media"
on storage.objects for delete
using ( bucket_id = 'landing-media' and auth.role() = 'authenticated' );
