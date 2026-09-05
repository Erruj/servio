CREATE OR REPLACE FUNCTION public.get_onboarding_status()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'connections', (SELECT count(*) FROM public.email_connections WHERE user_id = auth.uid()),
    'read_emails', (SELECT count(*) FROM public.emails WHERE user_id = auth.uid() AND is_read = true),
    'invoices', (SELECT count(*) FROM public.invoices WHERE user_id = auth.uid()),
    'has_company', (SELECT coalesce(nullif(btrim(coalesce(company_name, '')), ''), '') <> '' FROM public.profiles WHERE id = auth.uid())
  )
  WHERE auth.uid() IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.get_onboarding_status() FROM public;
GRANT EXECUTE ON FUNCTION public.get_onboarding_status() TO authenticated;