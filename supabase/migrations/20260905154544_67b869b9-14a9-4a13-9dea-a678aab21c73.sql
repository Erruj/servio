ALTER TABLE public.team_invitations ALTER COLUMN organization_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.set_invitation_organization()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := public.current_organization_id();
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_invitation_organization() FROM public;

DROP TRIGGER IF EXISTS set_invitation_organization_trg ON public.team_invitations;
CREATE TRIGGER set_invitation_organization_trg
BEFORE INSERT ON public.team_invitations
FOR EACH ROW EXECUTE FUNCTION public.set_invitation_organization();