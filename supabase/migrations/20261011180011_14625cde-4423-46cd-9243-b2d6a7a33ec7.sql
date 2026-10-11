CREATE OR REPLACE FUNCTION public.cron_secret_matches(_provided text)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, vault AS $$
DECLARE _s text;
BEGIN
  IF _provided IS NULL OR length(_provided) = 0 THEN RETURN false; END IF;
  SELECT decrypted_secret INTO _s FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1;
  RETURN _s IS NOT NULL AND _s = _provided;
END; $$;
REVOKE ALL ON FUNCTION public.cron_secret_matches(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cron_secret_matches(text) TO service_role;

CREATE TABLE IF NOT EXISTS public.cron_health (
  job_name text PRIMARY KEY,
  last_success_at timestamptz,
  last_error_at timestamptz,
  last_error text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.cron_health ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cron_health FROM anon, authenticated;
GRANT ALL ON public.cron_health TO service_role;

CREATE OR REPLACE FUNCTION public.get_cron_health()
RETURNS TABLE(job_name text, schedule text, active boolean, last_run_at timestamptz, last_success_at timestamptz, last_error_at timestamptz, last_error text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, cron AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND lower(p.email) = 'info@getservio.co') THEN
    RAISE EXCEPTION 'Alleen de beheerder van Servio kan de systeemstatus bekijken' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT j.jobname::text, j.schedule::text, j.active,
    (SELECT max(d.start_time) FROM cron.job_run_details d WHERE d.jobid = j.jobid),
    h.last_success_at, h.last_error_at, h.last_error
  FROM cron.job j
  LEFT JOIN public.cron_health h ON h.job_name = regexp_replace(j.jobname, '-(15min|daily|monthly)$', '')
  ORDER BY j.jobname;
END; $$;
REVOKE ALL ON FUNCTION public.get_cron_health() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_cron_health() TO authenticated;