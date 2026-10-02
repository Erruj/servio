CREATE OR REPLACE FUNCTION public.choose_free_plan()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niet ingelogd' USING ERRCODE = '42501'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_settings WHERE user_id = auth.uid() AND subscription_status = 'active') THEN
    RAISE EXCEPTION 'Je hebt een actief betaald abonnement. Zeg dit eerst op in het klantportaal.' USING ERRCODE = '42501';
  END IF;
  UPDATE public.user_settings SET subscription_status = 'free', updated_at = now() WHERE user_id = auth.uid();
END;
$$;
REVOKE ALL ON FUNCTION public.choose_free_plan() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.choose_free_plan() TO authenticated;