ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS ai_classified_at timestamptz;
CREATE INDEX IF NOT EXISTS emails_unclassified_idx ON public.emails (user_id, received_at DESC) WHERE ai_classified_at IS NULL;
-- bestaande handmatig geanalyseerde mails niet opnieuw doen
UPDATE public.emails SET ai_classified_at = updated_at WHERE ai_category IS NOT NULL AND ai_classified_at IS NULL;

CREATE TABLE IF NOT EXISTS public.ai_job_state (
  job_name text PRIMARY KEY,
  locked_until timestamptz,
  paused_reason text,
  paused_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ai_job_state TO service_role;
ALTER TABLE public.ai_job_state ENABLE ROW LEVEL SECURITY;

-- Atomische lease: geeft true als deze run de lock krijgt
CREATE OR REPLACE FUNCTION public.acquire_ai_job_lock(_job text, _seconds integer)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE _ok boolean;
BEGIN
  INSERT INTO public.ai_job_state (job_name) VALUES (_job) ON CONFLICT DO NOTHING;
  UPDATE public.ai_job_state SET locked_until = now() + make_interval(secs => _seconds), updated_at = now()
  WHERE job_name = _job AND (locked_until IS NULL OR locked_until < now()) AND paused_reason IS NULL
  RETURNING true INTO _ok;
  RETURN coalesce(_ok, false);
END $$;
REVOKE ALL ON FUNCTION public.acquire_ai_job_lock(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.acquire_ai_job_lock(text, integer) TO service_role;