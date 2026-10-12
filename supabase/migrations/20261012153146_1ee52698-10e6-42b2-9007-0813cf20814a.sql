ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS trashed_at timestamptz;

CREATE OR REPLACE FUNCTION public.set_email_trashed_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.folder = 'trash' AND (TG_OP = 'INSERT' OR OLD.folder IS DISTINCT FROM 'trash') THEN
    NEW.trashed_at := now();
  ELSIF NEW.folder <> 'trash' THEN
    NEW.trashed_at := NULL;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS set_email_trashed_at_trg ON public.emails;
CREATE TRIGGER set_email_trashed_at_trg BEFORE INSERT OR UPDATE OF folder ON public.emails
FOR EACH ROW EXECUTE FUNCTION public.set_email_trashed_at();

CREATE OR REPLACE FUNCTION public.get_mail_folder_counts(_connection_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE WHEN auth.uid() IS NULL THEN NULL ELSE jsonb_build_object(
    'inbox', count(*) FILTER (WHERE folder = 'inbox' AND NOT coalesce(is_read, false)),
    'starred', count(*) FILTER (WHERE is_starred AND folder NOT IN ('trash','spam')),
    'drafts', count(*) FILTER (WHERE folder = 'drafts'),
    'sent', count(*) FILTER (WHERE folder = 'sent'),
    'archive', count(*) FILTER (WHERE folder = 'archive'),
    'spam', count(*) FILTER (WHERE folder = 'spam'),
    'trash', count(*) FILTER (WHERE folder = 'trash')
  ) END
  FROM public.emails
  WHERE user_id = auth.uid() AND (_connection_id IS NULL OR connection_id = _connection_id);
$$;
REVOKE EXECUTE ON FUNCTION public.get_mail_folder_counts(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_mail_folder_counts(uuid) TO authenticated;

CREATE INDEX IF NOT EXISTS emails_trash_purge_idx ON public.emails (trashed_at) WHERE folder = 'trash';

SELECT cron.unschedule('purge-trash-daily') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-trash-daily');
SELECT cron.schedule('purge-trash-daily', '20 3 * * *',
  $$DELETE FROM public.emails WHERE folder = 'trash' AND coalesce(trashed_at, updated_at) < now() - interval '30 days'$$);