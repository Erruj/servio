CREATE TABLE public.mail_document_imports (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, email_id uuid REFERENCES public.emails(id) ON DELETE SET NULL, attachment_key text NOT NULL, kind text NOT NULL, document_id uuid NOT NULL DEFAULT gen_random_uuid(), status text NOT NULL DEFAULT 'processing', file_path text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,email_id,attachment_key));
GRANT SELECT ON public.mail_document_imports TO authenticated;
GRANT ALL ON public.mail_document_imports TO service_role;
ALTER TABLE public.mail_document_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY mail_document_imports_owner_read ON public.mail_document_imports FOR SELECT TO authenticated USING (user_id=auth.uid());
CREATE FUNCTION public.validate_mail_document_import() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN
IF NEW.kind NOT IN ('invoice','receipt') OR NEW.status NOT IN ('processing','ready','failed') OR length(NEW.attachment_key)>1024 THEN RAISE EXCEPTION 'Ongeldige bijlage-import'; END IF;
IF NEW.email_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.emails WHERE id=NEW.email_id AND user_id=NEW.user_id) THEN RAISE EXCEPTION 'Deze mail behoort niet tot jouw account'; END IF;
NEW.updated_at=now(); RETURN NEW; END $$;
CREATE TRIGGER validate_mail_document_import BEFORE INSERT OR UPDATE ON public.mail_document_imports FOR EACH ROW EXECUTE FUNCTION public.validate_mail_document_import();
CREATE INDEX mail_document_imports_document ON public.mail_document_imports(user_id,document_id);