-- lovable-cron-fallback-reviewed: No enabled delay-until provider; minute precision fallback is armed on enqueue and unscheduled after queue drain.
ALTER TABLE public.emails ADD COLUMN send_at timestamptz, ADD COLUMN undo_until timestamptz, ADD COLUMN send_payload jsonb, ADD COLUMN send_error text;
ALTER TABLE public.emails DROP CONSTRAINT emails_folder_check;
CREATE INDEX emails_scheduled_due ON public.emails(send_at) WHERE folder='scheduled' AND send_status='queued';
CREATE TABLE public.mail_send_preferences(user_id uuid PRIMARY KEY, undo_seconds integer NOT NULL DEFAULT 8, updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mail_send_preferences TO authenticated;
GRANT ALL ON public.mail_send_preferences TO service_role;
ALTER TABLE public.mail_send_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_send_preferences ON public.mail_send_preferences FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE FUNCTION public.validate_mail_send_preferences() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF NEW.undo_seconds NOT IN (5,8,10,20,30) THEN RAISE EXCEPTION 'Invalid undo delay'; END IF; NEW.updated_at=now(); RETURN NEW; END $$;
CREATE TRIGGER validate_mail_send_preferences BEFORE INSERT OR UPDATE ON public.mail_send_preferences FOR EACH ROW EXECUTE FUNCTION public.validate_mail_send_preferences();
CREATE TABLE public.mail_send_queue_config(singleton boolean PRIMARY KEY DEFAULT true, callback_url text NOT NULL, apikey text NOT NULL);
GRANT ALL ON public.mail_send_queue_config TO service_role;
ALTER TABLE public.mail_send_queue_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_queue_config ON public.mail_send_queue_config FOR ALL TO service_role USING(true) WITH CHECK(true);
CREATE FUNCTION public.validate_email_send_state() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
IF TG_OP='DELETE' THEN IF auth.role()='authenticated' AND OLD.send_status IN ('sending','uncertain') THEN RAISE EXCEPTION 'Delivery already started'; END IF; RETURN OLD; END IF;
IF NEW.folder NOT IN ('inbox','archive','trash','spam','sent','drafts','scheduled') THEN RAISE EXCEPTION 'Invalid mail folder'; END IF;
IF auth.role()='authenticated' THEN
IF TG_OP='UPDATE' AND OLD.send_status IN ('sending','uncertain') THEN RAISE EXCEPTION 'Delivery already started'; END IF;
IF NEW.folder='scheduled' OR NEW.send_at IS NOT NULL OR NEW.undo_until IS NOT NULL OR NEW.send_payload IS NOT NULL OR NEW.send_status NOT IN ('draft','failed') THEN RAISE EXCEPTION 'Use the secure send endpoint'; END IF;
END IF; RETURN NEW; END $$;
CREATE TRIGGER validate_email_send_state BEFORE INSERT OR UPDATE OR DELETE ON public.emails FOR EACH ROW EXECUTE FUNCTION public.validate_email_send_state();
CREATE FUNCTION public.refresh_mail_send_job() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE cfg public.mail_send_queue_config; command text; j bigint; BEGIN
PERFORM pg_advisory_xact_lock(68124006);
SELECT * INTO cfg FROM public.mail_send_queue_config WHERE singleton=true;
IF NOT FOUND THEN RETURN; END IF;
SELECT jobid INTO j FROM cron.job WHERE jobname='scheduled-mail-delivery';
IF EXISTS(SELECT 1 FROM public.emails WHERE folder='scheduled' AND send_status='queued' AND send_at IS NOT NULL) THEN
IF j IS NULL THEN
command=format('SELECT net.http_post(url := %L, headers := jsonb_build_object(''Content-Type'',''application/json'',''apikey'',%L,''x-cron-secret'',(SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name=''CRON_SECRET'' LIMIT 1)), body := ''{}''::jsonb, timeout_milliseconds := 60000);',cfg.callback_url,cfg.apikey);
PERFORM cron.schedule('scheduled-mail-delivery','* * * * *',command);
END IF;
ELSIF j IS NOT NULL THEN PERFORM cron.unschedule(j); END IF; END $$;
REVOKE ALL ON FUNCTION public.refresh_mail_send_job() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_mail_send_job() TO service_role;
CREATE FUNCTION public.wake_mail_send_queue() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE cfg public.mail_send_queue_config; secret text; BEGIN
PERFORM public.refresh_mail_send_job();
IF TG_OP!='DELETE' AND NEW.folder='scheduled' AND NEW.send_status='queued' THEN
SELECT * INTO cfg FROM public.mail_send_queue_config WHERE singleton=true;
SELECT decrypted_secret INTO secret FROM vault.decrypted_secrets WHERE name='CRON_SECRET' LIMIT 1;
IF cfg.callback_url IS NOT NULL AND secret IS NOT NULL THEN
PERFORM net.http_post(url:=cfg.callback_url,headers:=jsonb_build_object('Content-Type','application/json','apikey',cfg.apikey,'x-cron-secret',secret),body:=jsonb_build_object('draftId',NEW.id),timeout_milliseconds:=60000);
END IF; END IF; RETURN NULL; END $$;
REVOKE ALL ON FUNCTION public.wake_mail_send_queue() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER wake_mail_send_queue AFTER INSERT OR UPDATE OF folder,send_status,send_at OR DELETE ON public.emails FOR EACH ROW EXECUTE FUNCTION public.wake_mail_send_queue();
CREATE OR REPLACE FUNCTION public.get_mail_folder_counts(_connection_id uuid DEFAULT NULL) RETURNS jsonb LANGUAGE sql STABLE SET search_path=public AS $$ SELECT CASE WHEN auth.uid() IS NULL THEN NULL ELSE jsonb_build_object('inbox',count(*) FILTER(WHERE folder='inbox' AND NOT coalesce(is_read,false)),'starred',count(*) FILTER(WHERE is_starred AND folder NOT IN ('trash','spam','drafts','scheduled')),'drafts',count(*) FILTER(WHERE folder='drafts'),'scheduled',count(*) FILTER(WHERE folder='scheduled'),'sent',count(*) FILTER(WHERE folder='sent'),'archive',count(*) FILTER(WHERE folder='archive'),'spam',count(*) FILTER(WHERE folder='spam'),'trash',count(*) FILTER(WHERE folder='trash')) END FROM public.emails WHERE user_id=auth.uid() AND (_connection_id IS NULL OR connection_id=_connection_id); $$;