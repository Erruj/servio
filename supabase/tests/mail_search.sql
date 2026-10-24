-- Run in a disposable database with migrations applied. No production mail is changed.
BEGIN;
INSERT INTO public.emails(id,user_id,external_id,from_email,from_name,subject,body_text,received_at,folder,is_read,has_attachments)
VALUES
('00000000-0000-4000-8000-000000001001','00000000-0000-4000-8000-000000000001','search-test-1','newsletter@capterra.com','Capterra','Testbijlage','meertalig budget','2026-10-09T12:00:00Z','inbox',false,true),
('00000000-0000-4000-8000-000000001002','00000000-0000-4000-8000-000000000001','search-test-2','newsletter@capterra.com','Capterra','Geen bijlage','ander bericht','2026-10-10T12:00:00Z','inbox',true,false),
('00000000-0000-4000-8000-000000001003','00000000-0000-4000-8000-000000000002','search-test-3','newsletter@capterra.com','Capterra','Ander account','budget','2026-10-09T12:00:00Z','inbox',false,true);
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
DO $$ BEGIN
IF (SELECT array_agg(id) FROM public.search_mail('{"from":["capterra"],"attachment":true}','inbox')) IS DISTINCT FROM ARRAY['00000000-0000-4000-8000-000000001001'::uuid] THEN RAISE EXCEPTION 'Capterra attachment or owner isolation failed'; END IF;
IF (SELECT array_agg(id) FROM public.search_mail('{"unread":true,"before":"2026-10-10"}','inbox')) IS DISTINCT FROM ARRAY['00000000-0000-4000-8000-000000001001'::uuid] THEN RAISE EXCEPTION 'Unread before date failed'; END IF;
IF (SELECT array_agg(id) FROM public.search_mail('{"words":"budget"}','inbox')) IS DISTINCT FROM ARRAY['00000000-0000-4000-8000-000000001001'::uuid] THEN RAISE EXCEPTION 'Body full-text or owner isolation failed'; END IF;
END $$;
ROLLBACK;