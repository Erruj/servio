BEGIN;
INSERT INTO public.email_connections(id,user_id,provider,email_address,is_active) VALUES('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000001','imap','owner@example.com',true);
INSERT INTO public.mailbox_preferences(connection_id,user_id,vacation_enabled,vacation_start,vacation_end,vacation_text) VALUES('00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000001',true,now()-interval '1 hour',now()+interval '1 day','Ik ben afwezig');
INSERT INTO public.emails(id,user_id,connection_id,external_id,from_email,folder,received_at) VALUES
('00000000-0000-4000-8000-000000000021','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011','test-1','client@example.com','inbox',now()),
('00000000-0000-4000-8000-000000000022','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011','test-2','client@example.com','inbox',now()),
('00000000-0000-4000-8000-000000000023','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011','test-3','noreply@example.com','inbox',now());
DO $$ BEGIN
IF public.claim_vacation_reply('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000021') IS NULL THEN RAISE EXCEPTION 'First reply blocked';END IF;
IF public.claim_vacation_reply('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000022') IS NOT NULL THEN RAISE EXCEPTION 'Duplicate reply allowed';END IF;
IF public.claim_vacation_reply('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000023') IS NOT NULL THEN RAISE EXCEPTION 'Noreply allowed';END IF;
IF (SELECT count(*) FROM public.audit_log WHERE endpoint='mail-vacation')<>1 THEN RAISE EXCEPTION 'Audit missing';END IF;
END $$;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000099',true);
DO $$ BEGIN
IF (SELECT count(*) FROM public.mailbox_preferences)<>0 THEN RAISE EXCEPTION 'Another account can read mailbox preferences';END IF;
IF has_function_privilege(current_user,'public.claim_vacation_reply(uuid,uuid,uuid)','EXECUTE') THEN RAISE EXCEPTION 'Client can bypass the vacation cooldown';END IF;
END $$;
ROLLBACK;
