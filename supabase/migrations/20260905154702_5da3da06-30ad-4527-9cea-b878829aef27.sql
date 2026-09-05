REVOKE ALL ON FUNCTION public.current_organization_id() FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.get_team_members() FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.set_invitation_organization() FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.get_onboarding_status() FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_organization_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_members() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_onboarding_status() TO authenticated;