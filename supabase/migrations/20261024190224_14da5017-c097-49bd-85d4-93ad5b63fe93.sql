CREATE TABLE public.mail_preferences(user_id uuid PRIMARY KEY, default_connection_id uuid, notification_mode text NOT NULL DEFAULT 'off', created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE,DELETE ON public.mail_preferences TO authenticated; GRANT ALL ON public.mail_preferences TO service_role;
ALTER TABLE public.mail_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_mail_preferences ON public.mail_preferences FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE TABLE public.mailbox_preferences(connection_id uuid PRIMARY KEY REFERENCES public.email_connections(id) ON DELETE CASCADE,user_id uuid NOT NULL,signature text NOT NULL DEFAULT '',vacation_enabled boolean NOT NULL DEFAULT false,vacation_start timestamptz,vacation_end timestamptz,vacation_text text NOT NULL DEFAULT '',vacation_error text,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE,DELETE ON public.mailbox_preferences TO authenticated;GRANT ALL ON public.mailbox_preferences TO service_role;
ALTER TABLE public.mailbox_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_mailbox_preferences ON public.mailbox_preferences FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid() AND EXISTS(SELECT 1 FROM public.email_connections c WHERE c.id=connection_id AND c.user_id=auth.uid()));
CREATE TABLE public.mail_vacation_replies(user_id uuid NOT NULL,sender_email text NOT NULL,last_claimed_at timestamptz NOT NULL DEFAULT now(),audit_id uuid NOT NULL,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(user_id,sender_email));
GRANT SELECT ON public.mail_vacation_replies TO authenticated;GRANT ALL ON public.mail_vacation_replies TO service_role;
ALTER TABLE public.mail_vacation_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_vacation_history ON public.mail_vacation_replies FOR SELECT TO authenticated USING(user_id=auth.uid());
ALTER TABLE public.emails ADD COLUMN auto_reply_suppressed boolean NOT NULL DEFAULT false;
CREATE FUNCTION public.validate_mail_preferences() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
IF TG_TABLE_NAME='mail_preferences' THEN
 IF NEW.notification_mode NOT IN ('all','urgent','off') THEN RAISE EXCEPTION 'Ongeldige meldingskeuze';END IF;
 IF NEW.default_connection_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.email_connections WHERE id=NEW.default_connection_id AND user_id=NEW.user_id) THEN RAISE EXCEPTION 'Mailbox hoort niet bij dit account';END IF;
ELSE
 IF length(NEW.signature)>10000 OR length(NEW.vacation_text)>10000 THEN RAISE EXCEPTION 'Tekst is te lang';END IF;
 IF NEW.vacation_enabled AND (NEW.vacation_start IS NULL OR NEW.vacation_end IS NULL OR NEW.vacation_end<=NEW.vacation_start OR btrim(NEW.vacation_text)='') THEN RAISE EXCEPTION 'Vul een geldige afwezigheidsperiode en tekst in';END IF;
END IF; NEW.updated_at=now(); RETURN NEW;END $$;
CREATE TRIGGER validate_mail_preferences BEFORE INSERT OR UPDATE ON public.mail_preferences FOR EACH ROW EXECUTE FUNCTION public.validate_mail_preferences();
CREATE TRIGGER validate_mailbox_preferences BEFORE INSERT OR UPDATE ON public.mailbox_preferences FOR EACH ROW EXECUTE FUNCTION public.validate_mail_preferences();
CREATE FUNCTION public.claim_vacation_reply(_user_id uuid,_connection_id uuid,_email_id uuid) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE m public.emails;p public.mailbox_preferences;a uuid:=gen_random_uuid();ok uuid;BEGIN
SELECT * INTO m FROM public.emails WHERE id=_email_id AND user_id=_user_id AND connection_id=_connection_id AND folder='inbox';
SELECT * INTO p FROM public.mailbox_preferences WHERE connection_id=_connection_id AND user_id=_user_id AND vacation_enabled AND now()>=vacation_start AND now()<vacation_end;
IF m.id IS NULL OR p.connection_id IS NULL OR m.received_at<p.vacation_start OR m.auto_reply_suppressed OR m.list_unsubscribe IS NOT NULL OR lower(coalesce(m.ai_category,'')) IN ('newsletter','nieuwsbrief','newsletters') OR m.from_email !~ '^[^[:space:]@<>]+@[^[:space:]@<>]+\.[^[:space:]@<>]+$' OR lower(split_part(m.from_email,'@',1)) ~ '(no.?reply|do.?not.?reply|mailer.?daemon|postmaster|bounce|newsletter)' OR EXISTS(SELECT 1 FROM public.email_connections c WHERE c.user_id=_user_id AND lower(c.email_address)=lower(m.from_email)) OR EXISTS(SELECT 1 FROM public.blocked_senders b WHERE b.user_id=_user_id AND b.sender_email=lower(m.from_email)) THEN RETURN NULL;END IF;
INSERT INTO public.mail_vacation_replies(user_id,sender_email,last_claimed_at,audit_id) VALUES(_user_id,lower(m.from_email),now(),a) ON CONFLICT(user_id,sender_email) DO UPDATE SET last_claimed_at=now(),audit_id=a,updated_at=now() WHERE mail_vacation_replies.last_claimed_at<=now()-interval '4 days' RETURNING audit_id INTO ok;
IF ok IS NULL THEN RETURN NULL;END IF;
INSERT INTO public.audit_log(id,user_id,action,status,endpoint) VALUES(a,_user_id,'Afwezigheidsbericht','pending','mail-vacation');RETURN a;END $$;
REVOKE ALL ON FUNCTION public.claim_vacation_reply(uuid,uuid,uuid) FROM PUBLIC,anon,authenticated;GRANT EXECUTE ON FUNCTION public.claim_vacation_reply(uuid,uuid,uuid) TO service_role;