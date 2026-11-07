-- Richer GitHub import: README screenshots, features, tech and languages.
--
-- github_repos gets the details parsed from each repository's README and its
-- language breakdown. They are refreshed only when the repository has new
-- pushes, to stay well inside GitHub's rate limit.
-- projects gets a features list, shown in the public project dialog.

alter table public.github_repos
  add column default_branch text,
  add column languages jsonb not null default '{}' check (jsonb_typeof(languages) = 'object'),
  add column readme_title text,
  add column readme_summary text,
  add column readme_features text[] not null default '{}',
  add column readme_tech text[] not null default '{}',
  add column readme_topics text[] not null default '{}',
  add column readme_demo_url text,
  -- [{ "url": "...", "alt": "..." }]
  add column readme_images jsonb not null default '[]' check (jsonb_typeof(readme_images) = 'array'),
  -- pushed_at value the details were fetched for; null means "fetch again".
  add column details_pushed_at timestamptz,
  add column details_error text;

alter table public.projects
  add column features text[] not null default '{}'
    check (cardinality(features) <= 12);

-- Same function as before, now also returning features.
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
    ), '[]'::jsonb)
  );
$$;
