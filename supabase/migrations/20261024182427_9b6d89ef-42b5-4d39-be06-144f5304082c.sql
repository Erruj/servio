ALTER TABLE public.emails ADD COLUMN inbox_returned_at timestamptz, ADD COLUMN follow_up_pending boolean NOT NULL DEFAULT false;
CREATE INDEX emails_reminder_due_idx ON public.emails(snoozed_until,follow_up_at) WHERE snoozed_until IS NOT NULL OR follow_up_at IS NOT NULL;
CREATE INDEX emails_reply_match_idx ON public.emails(user_id,connection_id,thread_id,received_at);
CREATE OR REPLACE FUNCTION public.mail_reply_matches(s public.emails, r public.emails) RETURNS boolean LANGUAGE sql STABLE SET search_path=public AS $$ SELECT r.id<>s.id AND r.user_id=s.user_id AND r.connection_id=s.connection_id AND r.received_at>s.received_at AND r.folder NOT IN ('sent','drafts','scheduled') AND r.send_status<>'sent' AND lower(r.from_email)<>lower(s.from_email) AND lower(r.from_email) IN (SELECT lower(a) FROM unnest(coalesce(s.to_emails,'{}')||coalesce(s.cc_emails,'{}')) a) AND ((s.thread_id IS NOT NULL AND r.thread_id=s.thread_id) OR (s.message_id IS NOT NULL AND trim(both '<>' from s.message_id) IN (SELECT trim(both '<>' from a) FROM unnest(coalesce(r.reference_ids,'{}')) a)) OR (s.message_id IS NOT NULL AND trim(both '<>' from s.message_id)=trim(both '<>' from r.thread_id))); $$;
REVOKE ALL ON FUNCTION public.mail_reply_matches(public.emails,public.emails) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.mail_reply_matches(public.emails,public.emails) TO service_role;
CREATE OR REPLACE FUNCTION public.set_mail_snooze(_email_id uuid,_until timestamptz) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'session'; END IF;
IF _until IS NOT NULL AND _until<=now() THEN RAISE EXCEPTION 'future'; END IF;
UPDATE public.emails SET folder=CASE WHEN _until IS NULL THEN 'inbox' ELSE 'snoozed' END,snoozed_until=_until,inbox_returned_at=CASE WHEN _until IS NULL THEN now() ELSE NULL END WHERE id=_email_id AND user_id=auth.uid() AND folder IN ('inbox','archive','snoozed');
IF NOT FOUND THEN RAISE EXCEPTION 'missing'; END IF;
END; $$;
REVOKE ALL ON FUNCTION public.set_mail_snooze(uuid,timestamptz) FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.set_mail_snooze(uuid,timestamptz) TO authenticated;
CREATE OR REPLACE FUNCTION public.init_mail_follow_up() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ DECLARE days integer; BEGIN
IF NEW.send_status='sent' AND OLD.send_status IS DISTINCT FROM 'sent' THEN
 days:=CASE WHEN NEW.draft_data->>'followUpDays' IN ('2','3','7') THEN (NEW.draft_data->>'followUpDays')::integer END;
 NEW.follow_up_at:=CASE WHEN days IS NULL THEN NULL ELSE NEW.received_at+make_interval(days=>days) END; NEW.follow_up_pending:=false;
END IF;
IF OLD.folder='snoozed' AND NEW.folder NOT IN ('snoozed','inbox') THEN NEW.snoozed_until:=NULL; END IF;
RETURN NEW; END; $$;
CREATE TRIGGER init_mail_follow_up BEFORE UPDATE ON public.emails FOR EACH ROW EXECUTE FUNCTION public.init_mail_follow_up();
CREATE OR REPLACE FUNCTION public.cancel_answered_follow_ups() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF NEW.folder NOT IN ('sent','drafts','scheduled') AND NEW.send_status<>'sent' THEN
UPDATE public.emails s SET follow_up_at=NULL,follow_up_pending=false,folder=CASE WHEN s.follow_up_pending AND s.folder='inbox' THEN 'sent' ELSE s.folder END,inbox_returned_at=CASE WHEN s.follow_up_pending THEN NULL ELSE s.inbox_returned_at END WHERE s.user_id=NEW.user_id AND s.connection_id=NEW.connection_id AND (s.follow_up_at IS NOT NULL OR s.follow_up_pending) AND public.mail_reply_matches(s,NEW);
END IF; RETURN NEW; END; $$;
REVOKE ALL ON FUNCTION public.cancel_answered_follow_ups() FROM PUBLIC;
CREATE TRIGGER cancel_answered_follow_ups AFTER INSERT OR UPDATE OF thread_id,reference_ids,received_at ON public.emails FOR EACH ROW EXECUTE FUNCTION public.cancel_answered_follow_ups();
CREATE OR REPLACE FUNCTION public.process_mail_reminders() RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN
IF NOT pg_try_advisory_xact_lock(hashtext('servio-mail-reminders')) THEN RETURN; END IF;
UPDATE public.emails s SET follow_up_at=NULL,follow_up_pending=false,folder=CASE WHEN s.follow_up_pending AND s.folder='inbox' THEN 'sent' ELSE s.folder END,inbox_returned_at=CASE WHEN s.follow_up_pending THEN NULL ELSE s.inbox_returned_at END WHERE (s.follow_up_at IS NOT NULL OR s.follow_up_pending) AND EXISTS(SELECT 1 FROM public.emails r WHERE r.user_id=s.user_id AND r.connection_id=s.connection_id AND public.mail_reply_matches(s,r));
UPDATE public.emails SET folder='inbox',snoozed_until=NULL,is_read=false,inbox_returned_at=now(),labels=CASE WHEN 'SNOOZED'=ANY(coalesce(labels,'{}')) THEN labels ELSE array_append(coalesce(labels,'{}'),'SNOOZED') END WHERE id IN (SELECT id FROM public.emails WHERE folder='snoozed' AND snoozed_until<=now() ORDER BY snoozed_until LIMIT 500 FOR UPDATE SKIP LOCKED);
UPDATE public.emails SET folder='inbox',is_read=false,follow_up_pending=true,follow_up_at=NULL,inbox_returned_at=now() WHERE id IN (SELECT id FROM public.emails WHERE folder='sent' AND send_status='sent' AND follow_up_at<=now() ORDER BY follow_up_at LIMIT 500 FOR UPDATE SKIP LOCKED);
END; $$;
REVOKE ALL ON FUNCTION public.process_mail_reminders() FROM PUBLIC; GRANT EXECUTE ON FUNCTION public.process_mail_reminders() TO service_role;
CREATE OR REPLACE FUNCTION public.get_mail_folder_counts(_connection_id uuid DEFAULT NULL) RETURNS jsonb LANGUAGE sql STABLE SET search_path=public AS $$ SELECT CASE WHEN auth.uid() IS NULL THEN NULL ELSE jsonb_build_object('inbox',count(*) FILTER(WHERE folder='inbox' AND NOT coalesce(is_read,false)),'starred',count(*) FILTER(WHERE is_starred AND folder NOT IN ('trash','spam','drafts','scheduled','snoozed')),'drafts',count(*) FILTER(WHERE folder='drafts'),'scheduled',count(*) FILTER(WHERE folder='scheduled'),'snoozed',count(*) FILTER(WHERE folder='snoozed'),'sent',count(*) FILTER(WHERE folder='sent'),'archive',count(*) FILTER(WHERE folder='archive'),'spam',count(*) FILTER(WHERE folder='spam'),'trash',count(*) FILTER(WHERE folder='trash')) END FROM public.emails WHERE user_id=auth.uid() AND (_connection_id IS NULL OR connection_id=_connection_id); $$;