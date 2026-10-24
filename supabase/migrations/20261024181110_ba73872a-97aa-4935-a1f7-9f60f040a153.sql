CREATE OR REPLACE FUNCTION public.validate_email_send_state() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
IF TG_OP='DELETE' THEN IF auth.role()='authenticated' AND OLD.send_status IN ('sending','uncertain') THEN RAISE EXCEPTION 'Delivery already started'; END IF; RETURN OLD; END IF;
IF NEW.folder NOT IN ('inbox','archive','trash','spam','sent','drafts','scheduled') THEN RAISE EXCEPTION 'Invalid mail folder'; END IF;
IF auth.role()='authenticated' THEN
IF TG_OP='UPDATE' THEN
IF OLD.send_status IN ('sending','uncertain') OR OLD.folder='scheduled' THEN RAISE EXCEPTION 'Use the secure send endpoint'; END IF;
IF NEW.send_at IS DISTINCT FROM OLD.send_at OR NEW.undo_until IS DISTINCT FROM OLD.undo_until OR NEW.send_payload IS DISTINCT FROM OLD.send_payload OR NEW.send_error IS DISTINCT FROM OLD.send_error OR NEW.send_status IS DISTINCT FROM OLD.send_status THEN RAISE EXCEPTION 'Use the secure send endpoint'; END IF;
ELSE
IF NEW.send_at IS NOT NULL OR NEW.undo_until IS NOT NULL OR NEW.send_payload IS NOT NULL OR NEW.send_status NOT IN ('draft','failed') THEN RAISE EXCEPTION 'Use the secure send endpoint'; END IF;
END IF;
IF NEW.folder='scheduled' THEN RAISE EXCEPTION 'Use the secure send endpoint'; END IF;
END IF; RETURN NEW; END $$;