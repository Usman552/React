-- Portfolio CMS schema.
-- Public visitors (anon) can only read published content. Every write goes
-- through RLS policies that require a row in public.admins, or through Edge
-- Functions that use the service role on the server.

-- ------------------------------------------------------------
-- Helpers
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Accepts absolute http(s) URLs, site-relative paths ("/resume.pdf") and
-- in-page anchors ("#contact"). Rejects javascript:, data: and friends.
create or replace function public.is_safe_url(value text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select value is null
      or value = ''
      or value ~* '^https?://[^\s<>"]+$'
      or value ~ '^/[^/\s<>"][^\s<>"]*$'
      or value = '/'
      or value ~ '^#[A-Za-z0-9_-]*$'
      or value ~* '^mailto:[^\s<>"]+$';
$$;

-- ------------------------------------------------------------
-- Admins
-- ------------------------------------------------------------
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create policy "admins can see their own row"
  on public.admins for select
  to authenticated
  using (user_id = (select auth.uid()));

-- ------------------------------------------------------------
-- Profile (single row)
-- ------------------------------------------------------------
create table public.profile (
  id smallint primary key default 1 check (id = 1),
  name text not null default '' check (char_length(name) <= 80),
  logo_text text not null default '' check (char_length(logo_text) <= 30),
  title text not null default '' check (char_length(title) <= 120),
  roles text[] not null default '{}',
  hero_badge text not null default '' check (char_length(hero_badge) <= 120),
  hero_heading text not null default '' check (char_length(hero_heading) <= 200),
  hero_subtitle text not null default '' check (char_length(hero_subtitle) <= 600),
  availability_open boolean not null default true,
  availability_label text not null default '' check (char_length(availability_label) <= 40),
  bio text[] not null default '{}',
  location text not null default '' check (char_length(location) <= 80),
  languages text not null default '' check (char_length(languages) <= 80),
  photo_url text check (public.is_safe_url(photo_url)),
  resume_url text check (public.is_safe_url(resume_url)),
  show_resume boolean not null default true,
  experience_years smallint check (experience_years between 0 and 60),
  email text not null default '' check (email = '' or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  response_time text not null default '' check (char_length(response_time) <= 80),
  socials jsonb not null default '[]' check (jsonb_typeof(socials) = 'array'),
  cta_primary jsonb not null default '{}' check (jsonb_typeof(cta_primary) = 'object'),
  cta_secondary jsonb not null default '{}' check (jsonb_typeof(cta_secondary) = 'object'),
  stats jsonb not null default '[]' check (jsonb_typeof(stats) = 'array'),
  quick_facts jsonb not null default '[]' check (jsonb_typeof(quick_facts) = 'array'),
  focus text[] not null default '{}',
  hero_stack text[] not null default '{}',
  hero_tags text[] not null default '{}',
  contact_intro text not null default '' check (char_length(contact_intro) <= 600),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Site settings (single row)
-- ------------------------------------------------------------
create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  site_title text not null default '' check (char_length(site_title) <= 120),
  seo_title text not null default '' check (char_length(seo_title) <= 120),
  seo_description text not null default '' check (char_length(seo_description) <= 320),
  seo_keywords text not null default '' check (char_length(seo_keywords) <= 400),
  og_image text check (public.is_safe_url(og_image)),
  favicon_url text check (public.is_safe_url(favicon_url)),
  footer_tagline text not null default '' check (char_length(footer_tagline) <= 300),
  footer_note text not null default '' check (char_length(footer_note) <= 120),
  -- { about: { visible, label, title, lead }, services: {...}, ... }
  sections jsonb not null default '{}' check (jsonb_typeof(sections) = 'object'),
  -- { showFilters, initialCount, showGithubLink }
  project_display jsonb not null default '{}' check (jsonb_typeof(project_display) = 'object'),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- GitHub
-- ------------------------------------------------------------
create table public.github_repos (
  id bigint primary key, -- GitHub's stable numeric repository id
  name text not null,
  full_name text not null,
  description text,
  html_url text not null,
  homepage text,
  language text,
  topics text[] not null default '{}',
  stargazers integer not null default 0,
  forks integer not null default 0,
  is_fork boolean not null default false,
  archived boolean not null default false,
  pushed_at timestamptz,
  repo_created_at timestamptz,
  repo_updated_at timestamptz,
  -- active: returned by the last sync; archived: archived on GitHub;
  -- missing: no longer returned (deleted, renamed away, or made private).
  state text not null default 'active' check (state in ('active', 'archived', 'missing')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.github_sync (
  id smallint primary key default 1 check (id = 1),
  username text not null default '' check (username = '' or username ~ '^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$'),
  enabled boolean not null default false,
  auto_sync boolean not null default false,
  include_forks boolean not null default false,
  last_run_at timestamptz,
  last_success_at timestamptz,
  last_status text not null default 'idle' check (last_status in ('idle', 'running', 'success', 'error')),
  last_error text,
  last_result jsonb,
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Projects
-- ------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) <= 80),
  title text not null check (char_length(title) between 1 and 120),
  summary text not null default '' check (char_length(summary) <= 400),
  details text not null default '' check (char_length(details) <= 5000),
  category text not null default 'Other' check (char_length(category) between 1 and 40),
  tech text[] not null default '{}',
  tags text[] not null default '{}',
  thumbnail_url text check (public.is_safe_url(thumbnail_url)),
  gallery jsonb not null default '[]' check (jsonb_typeof(gallery) = 'array'),
  cover text not null default 'violet-cyan'
    check (cover in ('violet-cyan', 'pink-violet', 'cyan-mint', 'mint-violet', 'cyan-violet')),
  demo_url text check (public.is_safe_url(demo_url)),
  repo_url text check (public.is_safe_url(repo_url)),
  status text not null default 'draft' check (status in ('draft', 'published')),
  featured boolean not null default false,
  show_on_home boolean not null default true,
  sort_order integer not null default 0,
  completed_at date,
  source text not null default 'manual' check (source in ('manual', 'github')),
  github_repo_id bigint unique references public.github_repos (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_public_idx on public.projects (status, sort_order);

-- ------------------------------------------------------------
-- Services
-- ------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 100),
  description text not null default '' check (char_length(description) <= 600),
  icon text not null default '◆' check (char_length(icon) <= 4),
  tags text[] not null default '{}',
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Skills
-- ------------------------------------------------------------
create table public.skill_categories (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 80),
  blurb text not null default '' check (char_length(blurb) <= 300),
  accent text not null default 'violet' check (accent in ('violet', 'cyan', 'pink', 'mint')),
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.skill_categories (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  -- Optional. Null means "show the skill without a proficiency bar".
  level smallint check (level between 0 and 100),
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index skills_category_idx on public.skills (category_id, sort_order);

-- ------------------------------------------------------------
-- Contact messages
-- ------------------------------------------------------------
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) <= 254),
  message text not null check (char_length(message) between 1 and 5000),
  status text not null default 'unread' check (status in ('unread', 'read', 'contacted', 'archived')),
  ip_hash text,
  user_agent text check (char_length(user_agent) <= 400),
  read_at timestamptz,
  contacted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contact_messages_status_idx on public.contact_messages (status, created_at desc);
create index contact_messages_ip_idx on public.contact_messages (ip_hash, created_at desc);

-- ------------------------------------------------------------
-- updated_at triggers
-- ------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profile', 'site_settings', 'github_repos', 'github_sync', 'projects',
    'services', 'skill_categories', 'skills', 'contact_messages'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_updated_at', t
    );
  end loop;
end;
$$;

-- Stamp published_at the first time a project goes live.
create or replace function public.stamp_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

create trigger projects_published_at
  before insert or update on public.projects
  for each row execute function public.stamp_published_at();

-- ------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------
alter table public.profile enable row level security;
alter table public.site_settings enable row level security;
alter table public.github_repos enable row level security;
alter table public.github_sync enable row level security;
alter table public.projects enable row level security;
alter table public.services enable row level security;
alter table public.skill_categories enable row level security;
alter table public.skills enable row level security;
alter table public.contact_messages enable row level security;

-- Profile / settings: public read, admin update. Rows are created by the seed.
create policy "profile is public" on public.profile
  for select to anon, authenticated using (true);
create policy "admins update profile" on public.profile
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "settings are public" on public.site_settings
  for select to anon, authenticated using (true);
create policy "admins update settings" on public.site_settings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Projects: published rows are public, drafts are admin-only.
create policy "published projects are public" on public.projects
  for select to anon, authenticated
  using (status = 'published' or public.is_admin());
create policy "admins insert projects" on public.projects
  for insert to authenticated with check (public.is_admin());
create policy "admins update projects" on public.projects
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete projects" on public.projects
  for delete to authenticated using (public.is_admin());

-- Services, skill categories, skills: same pattern with a published flag.
create policy "published services are public" on public.services
  for select to anon, authenticated using (published or public.is_admin());
create policy "admins insert services" on public.services
  for insert to authenticated with check (public.is_admin());
create policy "admins update services" on public.services
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete services" on public.services
  for delete to authenticated using (public.is_admin());

create policy "published skill categories are public" on public.skill_categories
  for select to anon, authenticated using (published or public.is_admin());
create policy "admins insert skill categories" on public.skill_categories
  for insert to authenticated with check (public.is_admin());
create policy "admins update skill categories" on public.skill_categories
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete skill categories" on public.skill_categories
  for delete to authenticated using (public.is_admin());

create policy "published skills are public" on public.skills
  for select to anon, authenticated using (published or public.is_admin());
create policy "admins insert skills" on public.skills
  for insert to authenticated with check (public.is_admin());
create policy "admins update skills" on public.skills
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete skills" on public.skills
  for delete to authenticated using (public.is_admin());

-- Contact messages: never public. Inserts happen only in the contact-submit
-- Edge Function with the service role.
revoke all on public.contact_messages from anon;
create policy "admins read messages" on public.contact_messages
  for select to authenticated using (public.is_admin());
create policy "admins update messages" on public.contact_messages
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete messages" on public.contact_messages
  for delete to authenticated using (public.is_admin());

-- GitHub data: admin read. Repo rows are written only by the sync function.
revoke all on public.github_repos from anon;
revoke all on public.github_sync from anon;
create policy "admins read repos" on public.github_repos
  for select to authenticated using (public.is_admin());
create policy "admins read sync config" on public.github_sync
  for select to authenticated using (public.is_admin());
create policy "admins update sync config" on public.github_sync
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Admins table is managed with the service role only.
revoke insert, update, delete on public.admins from anon, authenticated;

-- ------------------------------------------------------------
-- Public content in a single round trip
-- ------------------------------------------------------------
-- SECURITY INVOKER: RLS still applies, so drafts never leak even if the
-- filters below were removed.
create or replace function public.get_public_content()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'profile', (
      select to_jsonb(p) - 'id' - 'updated_at' from public.profile p where p.id = 1
    ),
    'settings', (
      select to_jsonb(s) - 'id' - 'updated_at' from public.site_settings s where s.id = 1
    ),
    'projects', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', pr.id, 'slug', pr.slug, 'title', pr.title, 'summary', pr.summary,
          'details', pr.details, 'category', pr.category, 'tech', pr.tech,
          'tags', pr.tags, 'thumbnail_url', pr.thumbnail_url, 'gallery', pr.gallery,
          'cover', pr.cover, 'demo_url', pr.demo_url, 'repo_url', pr.repo_url,
          'featured', pr.featured, 'show_on_home', pr.show_on_home,
          'completed_at', pr.completed_at
        )
        order by pr.sort_order, pr.created_at
      )
      from public.projects pr
      where pr.status = 'published'
    ), '[]'::jsonb),
    'services', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', sv.id, 'title', sv.title, 'description', sv.description,
          'icon', sv.icon, 'tags', sv.tags
        )
        order by sv.sort_order, sv.created_at
      )
      from public.services sv
      where sv.published
    ), '[]'::jsonb),
    'skill_categories', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', c.id, 'title', c.title, 'blurb', c.blurb, 'accent', c.accent,
          'skills', coalesce((
            select jsonb_agg(
              jsonb_build_object('id', sk.id, 'name', sk.name, 'level', sk.level)
              order by sk.sort_order, sk.created_at
            )
            from public.skills sk
            where sk.category_id = c.id and sk.published
          ), '[]'::jsonb)
        )
        order by c.sort_order, c.created_at
      )
      from public.skill_categories c
      where c.published
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.get_public_content() from public;
grant execute on function public.get_public_content() to anon, authenticated;

-- ------------------------------------------------------------
-- Admin dashboard metrics (real counts only)
-- ------------------------------------------------------------
create or replace function public.get_admin_overview()
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'projects_total', (select count(*) from public.projects),
    'projects_published', (select count(*) from public.projects where status = 'published'),
    'projects_draft', (select count(*) from public.projects where status = 'draft'),
    'services_total', (select count(*) from public.services),
    'services_published', (select count(*) from public.services where published),
    'skills_total', (select count(*) from public.skills),
    'skill_categories_total', (select count(*) from public.skill_categories),
    'messages_unread', (select count(*) from public.contact_messages where status = 'unread'),
    'messages_total', (select count(*) from public.contact_messages),
    'repos_total', (select count(*) from public.github_repos),
    'repos_missing', (select count(*) from public.github_repos where state = 'missing'),
    'github', (
      select jsonb_build_object(
        'username', g.username, 'enabled', g.enabled, 'auto_sync', g.auto_sync,
        'last_run_at', g.last_run_at, 'last_success_at', g.last_success_at,
        'last_status', g.last_status, 'last_error', g.last_error
      )
      from public.github_sync g where g.id = 1
    ),
    'recent', coalesce((
      select jsonb_agg(r order by r.updated_at desc)
      from (
        select * from (
          select 'project' as kind, id::text as id, title as label, updated_at from public.projects
          union all
          select 'service', id::text, title, updated_at from public.services
          union all
          select 'skill', id::text, name, updated_at from public.skills
          union all
          select 'profile', '1', 'Profile', updated_at from public.profile
          union all
          select 'settings', '1', 'Site settings', updated_at from public.site_settings
        ) all_rows
        order by updated_at desc
        limit 6
      ) r
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_admin_overview() from public, anon;
grant execute on function public.get_admin_overview() to authenticated;

-- ------------------------------------------------------------
-- Singleton rows
-- ------------------------------------------------------------
insert into public.profile (id) values (1) on conflict do nothing;
insert into public.site_settings (id) values (1) on conflict do nothing;
insert into public.github_sync (id) values (1) on conflict do nothing;

-- ------------------------------------------------------------
-- Storage: public-read media bucket, admin-only writes
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif', 'application/pdf']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "admins upload media" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());
create policy "admins update media" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());
create policy "admins delete media" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
create policy "admins list media" on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and public.is_admin());
