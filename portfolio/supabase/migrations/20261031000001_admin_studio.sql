-- Admin studio: appearance settings, experience timeline, GitHub skill
-- suggestions and a richer dashboard.
--
-- site_settings.theme      { mode, allow_toggle, accent } for the public site
-- experience               work, education and certifications (public timeline)
-- skill_suggestion_dismissals  technologies found on GitHub that the admin
--                          chose not to add as skills, so they stay hidden

-- ------------------------------------------------------------
-- Appearance
-- ------------------------------------------------------------
alter table public.site_settings
  add column theme jsonb not null default '{}' check (jsonb_typeof(theme) = 'object');

-- ------------------------------------------------------------
-- Experience
-- ------------------------------------------------------------
create table public.experience (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'work' check (kind in ('work', 'education', 'certification')),
  title text not null check (char_length(title) between 1 and 120),
  organization text not null default '' check (char_length(organization) <= 120),
  location text not null default '' check (char_length(location) <= 80),
  -- "Full-time", "Freelance", "Remote"… free text, optional.
  employment_type text not null default '' check (char_length(employment_type) <= 40),
  start_date date,
  end_date date,
  is_current boolean not null default false,
  description text not null default '' check (char_length(description) <= 1200),
  highlights text[] not null default '{}' check (cardinality(highlights) <= 8),
  url text check (public.is_safe_url(url)),
  logo_url text check (public.is_safe_url(logo_url)),
  credential_id text not null default '' check (char_length(credential_id) <= 120),
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

create index experience_public_idx on public.experience (published, kind);

create trigger experience_updated_at
  before update on public.experience
  for each row execute function public.set_updated_at();

alter table public.experience enable row level security;

create policy "published experience is public" on public.experience
  for select to anon, authenticated using (published or public.is_admin());
create policy "admins insert experience" on public.experience
  for insert to authenticated with check (public.is_admin());
create policy "admins update experience" on public.experience
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete experience" on public.experience
  for delete to authenticated using (public.is_admin());

-- ------------------------------------------------------------
-- Skill suggestions the admin dismissed
-- ------------------------------------------------------------
create table public.skill_suggestion_dismissals (
  -- Normalised name ("next.js", "tailwind css"), see _shared/skills.js.
  key text primary key check (char_length(key) between 1 and 60),
  name text not null check (char_length(name) between 1 and 60),
  created_at timestamptz not null default now()
);

alter table public.skill_suggestion_dismissals enable row level security;
revoke all on public.skill_suggestion_dismissals from anon;

create policy "admins read dismissals" on public.skill_suggestion_dismissals
  for select to authenticated using (public.is_admin());
create policy "admins insert dismissals" on public.skill_suggestion_dismissals
  for insert to authenticated with check (public.is_admin());
create policy "admins delete dismissals" on public.skill_suggestion_dismissals
  for delete to authenticated using (public.is_admin());

-- ------------------------------------------------------------
-- Public content, now with the experience timeline
-- ------------------------------------------------------------
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
          'details', pr.details, 'features', pr.features, 'category', pr.category,
          'tech', pr.tech, 'tags', pr.tags, 'thumbnail_url', pr.thumbnail_url,
          'gallery', pr.gallery, 'cover', pr.cover, 'demo_url', pr.demo_url,
          'repo_url', pr.repo_url, 'featured', pr.featured,
          'show_on_home', pr.show_on_home, 'completed_at', pr.completed_at
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
    ), '[]'::jsonb),
    -- Newest first: current roles, then by end (or start) date.
    'experience', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', e.id, 'kind', e.kind, 'title', e.title, 'organization', e.organization,
          'location', e.location, 'employment_type', e.employment_type,
          'start_date', e.start_date, 'end_date', e.end_date, 'is_current', e.is_current,
          'description', e.description, 'highlights', e.highlights, 'url', e.url,
          'logo_url', e.logo_url, 'credential_id', e.credential_id
        )
        order by e.is_current desc, coalesce(e.end_date, e.start_date) desc nulls last, e.sort_order, e.created_at
      )
      from public.experience e
      where e.published
    ), '[]'::jsonb)
  );
$$;

-- ------------------------------------------------------------
-- Dashboard: counts plus a content health check
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
    'experience_total', (select count(*) from public.experience),
    'messages_unread', (select count(*) from public.contact_messages where status = 'unread'),
    'messages_total', (select count(*) from public.contact_messages),
    'messages_week', (select count(*) from public.contact_messages where created_at > now() - interval '7 days'),
    'repos_total', (select count(*) from public.github_repos),
    'repos_missing', (select count(*) from public.github_repos where state = 'missing'),
    'media_total', (select count(*) from storage.objects where bucket_id = 'media'),
    'media_bytes', (
      select coalesce(sum((metadata ->> 'size')::bigint), 0) from storage.objects where bucket_id = 'media'
    ),
    'health', (
      select jsonb_build_object(
        'profile_photo', coalesce(p.photo_url, '') <> '',
        'resume', coalesce(p.resume_url, '') <> '',
        'bio', cardinality(p.bio) > 0,
        'socials', jsonb_array_length(p.socials),
        'seo_description', coalesce(s.seo_description, '') <> '',
        'og_image', coalesce(s.og_image, '') <> '',
        'published_without_cover', (
          select count(*) from public.projects
          where status = 'published' and coalesce(thumbnail_url, '') = ''
        ),
        'published_without_summary', (
          select count(*) from public.projects
          where status = 'published' and summary = ''
        )
      )
      from public.profile p, public.site_settings s
      where p.id = 1 and s.id = 1
    ),
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
          select 'experience', id::text, title, updated_at from public.experience
          union all
          select 'profile', '1', 'Profile', updated_at from public.profile
          union all
          select 'settings', '1', 'Site settings', updated_at from public.site_settings
        ) all_rows
        order by updated_at desc
        limit 7
      ) r
    ), '[]'::jsonb)
  );
end;
$$;
