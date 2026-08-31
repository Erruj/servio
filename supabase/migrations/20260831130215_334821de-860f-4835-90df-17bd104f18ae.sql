-- Cron-jobs 2 en 3 hadden het CRON_SECRET hard in het commando staan (leesbaar in cron.job).
-- Herconfigureer ze naar hetzelfde vault-patroon als jobs 4 en 5.
select cron.unschedule('proactive-insights-daily');
select cron.unschedule('auto-export-monthly');

select cron.schedule(
  'proactive-insights-daily',
  '0 8 * * *',
  $$
  select net.http_post(
    url := 'https://avtzjxknxnajzutcoayl.supabase.co/functions/v1/proactive-insights',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'CRON_SECRET' limit 1)
    ),
    body := '{"source":"cron"}'::jsonb
  );
  $$
);

select cron.schedule(
  'auto-export-monthly',
  '0 3 1 * *',
  $$
  select net.http_post(
    url := 'https://avtzjxknxnajzutcoayl.supabase.co/functions/v1/auto-export',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'CRON_SECRET' limit 1)
    ),
    body := '{"source":"cron"}'::jsonb
  );
  $$
);