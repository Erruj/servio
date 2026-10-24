ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS list_unsubscribe text, ADD COLUMN IF NOT EXISTS list_unsubscribe_post text;
CREATE TABLE public.blocked_senders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, sender_email text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,sender_email)
);
GRANT SELECT,INSERT,DELETE ON public.blocked_senders TO authenticated;
GRANT ALL ON public.blocked_senders TO service_role;
ALTER TABLE public.blocked_senders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own blocked senders read" ON public.blocked_senders FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY "Own blocked senders add" ON public.blocked_senders FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid());
CREATE POLICY "Own blocked senders remove" ON public.blocked_senders FOR DELETE TO authenticated USING(user_id=auth.uid());
CREATE FUNCTION public.normalize_blocked_sender() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
 NEW.sender_email:=lower(trim(NEW.sender_email));
 IF length(NEW.sender_email)>320 OR NEW.sender_email !~ '^[^[:space:]@<>]+@[^[:space:]@<>]+\.[^[:space:]@<>]+$' THEN RAISE EXCEPTION 'Ongeldig e-mailadres'; END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.normalize_blocked_sender() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER normalize_blocked_sender BEFORE INSERT OR UPDATE ON public.blocked_senders FOR EACH ROW EXECUTE FUNCTION public.normalize_blocked_sender();
CREATE TRIGGER blocked_sender_updated BEFORE UPDATE ON public.blocked_senders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();