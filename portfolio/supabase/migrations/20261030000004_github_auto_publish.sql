-- Push to GitHub → shows on the portfolio.
--
-- github_sync.auto_publish decides which new repositories the sync imports
-- and publishes on its own:
--   off        never (import by hand in Admin → GitHub)
--   complete   README has a description, at least one screenshot and features
--   described  any repository with a description
-- projects.github_auto_update keeps an imported project in step with its
-- README: when the repository changes, the sync refreshes the project's
-- content fields. Turning it off protects manual edits.
-- github_repos.dismissed remembers repositories whose project was deleted,
-- so the sync never brings them back on its own.

alter table public.github_sync
  add column auto_publish text not null default 'off'
    check (auto_publish in ('off', 'complete', 'described'));

alter table public.projects
  add column github_auto_update boolean not null default false;

alter table public.github_repos
  add column dismissed boolean not null default false;

-- Deleting a GitHub project dismisses its repository.
create or replace function public.dismiss_deleted_github_project()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.github_repo_id is not null then
    update public.github_repos set dismissed = true where id = old.github_repo_id;
  end if;
  return old;
end;
$$;

create trigger projects_dismiss_github_repo
  after delete on public.projects
  for each row execute function public.dismiss_deleted_github_project();

-- A manual import (or re-link) clears the dismissal.
create or replace function public.undismiss_linked_github_repo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.github_repo_id is not null then
    update public.github_repos set dismissed = false where id = new.github_repo_id and dismissed;
  end if;
  return new;
end;
$$;

create trigger projects_undismiss_github_repo
  after insert on public.projects
  for each row execute function public.undismiss_linked_github_repo();

-- Sync every 15 minutes instead of every 12 hours, so a push shows up quickly.
-- Unchanged repositories cost one GitHub request per run.
select cron.alter_job(
  (select jobid from cron.job where jobname = 'github-auto-sync'),
  schedule := '*/15 * * * *'
);
