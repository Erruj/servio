-- 1. user_settings: alleen voorkeurskolommen bewerkbaar door gebruikers
REVOKE INSERT, UPDATE ON public.user_settings FROM authenticated, anon;
GRANT UPDATE (theme, language, ai_tone, auto_reply_enabled, auto_categorize, auto_vat_calculation, monthly_summary, tag_suggestions, ai_personality, ai_custom_personality, email_signature, accent_color, compact_layout, sidebar_order, sidebar_favorites, dashboard_widgets, quick_actions, auto_export_enabled, preferred_tone, auto_process_invoice_attachments, updated_at)
  ON public.user_settings TO authenticated;
GRANT INSERT (user_id, theme, language, ai_tone, auto_reply_enabled, auto_categorize, auto_vat_calculation, monthly_summary, tag_suggestions, ai_personality, ai_custom_personality, email_signature, accent_color, compact_layout, sidebar_order, sidebar_favorites, dashboard_widgets, quick_actions, auto_export_enabled, preferred_tone, auto_process_invoice_attachments)
  ON public.user_settings TO authenticated;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
CREATE POLICY "Users can update own settings" ON public.user_settings FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. user_roles: geen directe INSERT/UPDATE meer
DROP POLICY IF EXISTS "Owners manage roles in own organization" ON public.user_roles;
DROP POLICY IF EXISTS "Owners update roles in own organization" ON public.user_roles;
REVOKE INSERT, UPDATE ON public.user_roles FROM authenticated, anon;

CREATE OR REPLACE FUNCTION public.update_team_member_role(_role_id uuid, _role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org uuid := public.current_organization_id();
  _target record;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niet ingelogd' USING ERRCODE = '42501'; END IF;
  IF NOT (public.has_role(auth.uid(), 'owner') OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Alleen een eigenaar of beheerder kan rollen wijzigen' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO _target FROM public.user_roles WHERE id = _role_id;
  IF _target IS NULL OR _target.organization_id IS DISTINCT FROM _org THEN
    RAISE EXCEPTION 'Teamlid niet gevonden in jouw organisatie' USING ERRCODE = '42501';
  END IF;
  IF _target.user_id = auth.uid() THEN
    RAISE EXCEPTION 'Je kunt je eigen rol niet wijzigen' USING ERRCODE = '42501';
  END IF;
  IF _role = 'owner' AND NOT public.has_role(auth.uid(), 'owner') THEN
    RAISE EXCEPTION 'Alleen een eigenaar kan iemand eigenaar maken' USING ERRCODE = '42501';
  END IF;
  IF _target.role = 'owner' AND NOT public.has_role(auth.uid(), 'owner') THEN
    RAISE EXCEPTION 'Alleen een eigenaar kan een eigenaar wijzigen' USING ERRCODE = '42501';
  END IF;
  UPDATE public.user_roles SET role = _role WHERE id = _role_id;
END;
$$;
REVOKE ALL ON FUNCTION public.update_team_member_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_team_member_role(uuid, app_role) TO authenticated;

-- 3. usage_tracking: alleen lezen voor gebruikers, ophogen via server
DROP POLICY IF EXISTS "Users can insert own usage" ON public.usage_tracking;
DROP POLICY IF EXISTS "Users can update own usage" ON public.usage_tracking;
REVOKE INSERT, UPDATE, DELETE ON public.usage_tracking FROM authenticated, anon;

CREATE UNIQUE INDEX IF NOT EXISTS usage_tracking_user_month_uidx ON public.usage_tracking(user_id, month_year);

-- Atomisch ophogen met limietcontrole. Alleen service role (edge functions).
CREATE OR REPLACE FUNCTION public.consume_usage(_user_id uuid, _kind text, _limit integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _month text := to_char(now() AT TIME ZONE 'Europe/Amsterdam', 'YYYY-MM');
  _ok boolean;
BEGIN
  INSERT INTO public.usage_tracking (user_id, month_year, email_count, ai_call_count)
  VALUES (_user_id, _month, 0, 0)
  ON CONFLICT (user_id, month_year) DO NOTHING;

  IF _kind = 'email' THEN
    UPDATE public.usage_tracking SET email_count = email_count + 1, updated_at = now()
    WHERE user_id = _user_id AND month_year = _month AND (_limit IS NULL OR email_count < _limit)
    RETURNING true INTO _ok;
  ELSIF _kind = 'ai' THEN
    UPDATE public.usage_tracking SET ai_call_count = ai_call_count + 1, updated_at = now()
    WHERE user_id = _user_id AND month_year = _month AND (_limit IS NULL OR ai_call_count < _limit)
    RETURNING true INTO _ok;
  ELSE
    RAISE EXCEPTION 'Onbekend type gebruik: %', _kind;
  END IF;
  RETURN coalesce(_ok, false);
END;
$$;
REVOKE ALL ON FUNCTION public.consume_usage(uuid, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_usage(uuid, text, integer) TO service_role;