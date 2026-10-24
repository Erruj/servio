-- Isolated database regression fixtures; always roll back after assertions.
BEGIN;
INSERT INTO public.email_connections(id,user_id,provider,email_address,is_active)
VALUES ('88888888-0000-4000-8000-000000000001','88888888-0000-4000-8000-000000000010','imap','reminder-test@example.invalid',false);
DO $$ DECLARE days integer; sent public.emails; reply public.emails; BEGIN
  FOREACH days IN ARRAY ARRAY[2,3,7] LOOP
    INSERT INTO public.emails(user_id,connection_id,external_id,from_email,to_emails,received_at,folder,draft_data)
    VALUES ('88888888-0000-4000-8000-000000000010','88888888-0000-4000-8000-000000000001','follow-up-'||days,'reminder-test@example.invalid',ARRAY['client@example.invalid'],now(),'drafts',jsonb_build_object('followUpDays',days)) RETURNING * INTO sent;
    UPDATE public.emails SET folder='sent',send_status='sent',draft_data=NULL WHERE id=sent.id RETURNING * INTO sent;
    IF sent.follow_up_at IS DISTINCT FROM sent.received_at+make_interval(days=>days) THEN RAISE EXCEPTION 'Follow-up deadline % days failed',days; END IF;
  END LOOP;
  INSERT INTO public.emails(user_id,connection_id,external_id,from_email,to_emails,received_at,folder,snoozed_until)
  VALUES ('88888888-0000-4000-8000-000000000010','88888888-0000-4000-8000-000000000001','snooze-test','client@example.invalid',ARRAY['reminder-test@example.invalid'],now()-interval '1 day','snoozed',now()+interval '5 minutes') RETURNING * INTO sent;
  PERFORM public.process_mail_reminders();
  SELECT * INTO sent FROM public.emails WHERE id=sent.id;
  IF sent.folder<>'snoozed' THEN RAISE EXCEPTION 'Early snooze return'; END IF;
  UPDATE public.emails SET snoozed_until=now()-interval '1 second' WHERE id=sent.id;
  PERFORM public.process_mail_reminders();
  SELECT * INTO sent FROM public.emails WHERE id=sent.id;
  IF sent.folder<>'inbox' OR sent.is_read OR sent.snoozed_until IS NOT NULL OR NOT (sent.labels @> ARRAY['SNOOZED']) OR sent.inbox_returned_at IS NULL OR sent.received_at<>now()-interval '1 day' THEN RAISE EXCEPTION 'Snooze return failed'; END IF;
  UPDATE public.emails SET received_at=now()-interval '1 day',follow_up_at=now()-interval '1 second',thread_id='follow-up-thread',message_id='<follow-up@example.invalid>' WHERE external_id='follow-up-2' AND user_id='88888888-0000-4000-8000-000000000010';
  PERFORM public.process_mail_reminders();
  SELECT * INTO sent FROM public.emails WHERE external_id='follow-up-2' AND user_id='88888888-0000-4000-8000-000000000010';
  IF NOT sent.follow_up_pending OR sent.folder<>'inbox' OR sent.is_read THEN RAISE EXCEPTION 'Due follow-up failed'; END IF;
  reply:=sent; reply.id:=gen_random_uuid(); reply.from_email:='client@example.invalid'; reply.send_status:='draft'; reply.folder:='inbox'; reply.received_at:=now(); reply.user_id:='88888888-0000-4000-8000-000000000011';
  IF public.mail_reply_matches(sent,reply) THEN RAISE EXCEPTION 'Cross-owner reply matched'; END IF;
  reply.user_id:=sent.user_id; reply.connection_id:=gen_random_uuid();
  IF public.mail_reply_matches(sent,reply) THEN RAISE EXCEPTION 'Cross-mailbox reply matched'; END IF;
  INSERT INTO public.emails(user_id,connection_id,external_id,from_email,to_emails,received_at,folder,thread_id)
  VALUES(sent.user_id,sent.connection_id,'follow-up-answer','client@example.invalid',ARRAY[sent.from_email],now(),'inbox','follow-up-thread');
  SELECT * INTO sent FROM public.emails WHERE id=sent.id;
  IF sent.follow_up_pending OR sent.follow_up_at IS NOT NULL OR sent.folder<>'sent' THEN RAISE EXCEPTION 'Answered follow-up not cancelled'; END IF;
END $$;
ROLLBACK;