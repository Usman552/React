-- Scheduled GitHub sync (every 12 hours) via pg_cron + pg_net.
--
-- The job calls the github-sync Edge Function with a shared secret. It reads
-- two Vault secrets, which you add once per environment (see README):
--   project_url  e.g. https://<ref>.supabase.co
--   cron_secret  same value as the CRON_SECRET Edge Function secret
-- Until both exist, or while sync/auto-sync is disabled in the admin, the job
-- does nothing.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'github-auto-sync',
  '0 */12 * * *',
  $job$
    select net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
             || '/functions/v1/github-sync',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
      ),
      body := '{"action":"scheduled"}'::jsonb,
      timeout_milliseconds := 30000
    )
    where exists (select 1 from public.github_sync where id = 1 and enabled and auto_sync and username <> '')
      and exists (select 1 from vault.decrypted_secrets where name = 'project_url')
      and exists (select 1 from vault.decrypted_secrets where name = 'cron_secret');
  $job$
);
