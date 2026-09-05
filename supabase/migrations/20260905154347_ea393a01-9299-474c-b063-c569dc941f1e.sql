-- 0. Kapotte trigger (user_roles heeft geen updated_at kolom)
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;

-- 1. Organisatie-kolom op user_roles
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS organization_id uuid;
UPDATE public.user_roles SET organization_id = user_id WHERE organization_id IS NULL;
ALTER TABLE public.user_roles ALTER COLUMN organization_id SET NOT NULL;
CREATE INDEX IF NOT EXISTS user_roles_organization_id_idx ON public.user_roles(organization_id);

ALTER TABLE public.team_invitations ADD COLUMN IF NOT EXISTS organization_id uuid;
UPDATE public.team_invitations ti SET organization_id = COALESCE(
  (SELECT ur.organization_id FROM public.user_roles ur WHERE ur.user_id = ti.inviter_id LIMIT 1),
  ti.inviter_id
) WHERE organization_id IS NULL;

-- 2. Helper: organisatie van de ingelogde gebruiker
CREATE OR REPLACE FUNCTION public.current_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_organization_id() FROM public;
GRANT EXECUTE ON FUNCTION public.current_organization_id() TO authenticated;

-- 3. RLS op user_roles: strikt binnen eigen organisatie
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only owners can manage roles" ON public.user_roles;

CREATE POLICY "View roles in own organization"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid() OR organization_id = public.current_organization_id());

CREATE POLICY "Owners manage roles in own organization"
ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'owner') AND organization_id = public.current_organization_id());

CREATE POLICY "Owners update roles in own organization"
ON public.user_roles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'owner') AND organization_id = public.current_organization_id())
WITH CHECK (public.has_role(auth.uid(), 'owner') AND organization_id = public.current_organization_id());

CREATE POLICY "Owners delete roles in own organization"
ON public.user_roles FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'owner')
  AND organization_id = public.current_organization_id()
  AND user_id <> auth.uid()
);

-- 4. Uitnodigingen ook scopen op organisatie
DROP POLICY IF EXISTS "Owners and admins can manage invitations" ON public.team_invitations;
CREATE POLICY "Owners and admins manage own organization invitations"
ON public.team_invitations FOR ALL TO authenticated
USING (
  (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'))
  AND organization_id = public.current_organization_id()
)
WITH CHECK (
  (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin'))
  AND organization_id = public.current_organization_id()
);

-- 5. Teamleden ophalen zonder brede tabeltoegang
CREATE OR REPLACE FUNCTION public.get_team_members()
RETURNS TABLE (id uuid, user_id uuid, role app_role, email text, full_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.id, ur.user_id, ur.role, p.email, p.full_name
  FROM public.user_roles ur
  LEFT JOIN public.profiles p ON p.id = ur.user_id
  WHERE auth.uid() IS NOT NULL
    AND ur.organization_id = public.current_organization_id()
  ORDER BY ur.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_team_members() FROM public;
GRANT EXECUTE ON FUNCTION public.get_team_members() TO authenticated;

-- 6. Nieuwe gebruikers zijn hun eigen organisatie
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));

  INSERT INTO public.user_settings (user_id) VALUES (NEW.id);

  INSERT INTO public.user_roles (user_id, role, organization_id)
  VALUES (NEW.id, 'owner', NEW.id);

  RETURN NEW;
END;
$$;