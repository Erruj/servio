
-- 1. Brand-assets bucket: add user-scoped write policies
CREATE POLICY "Users can upload own brand assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'brand-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own brand assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'brand-assets' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'brand-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own brand assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'brand-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 2. Hide sensitive columns from authenticated role (service_role still has full access)
REVOKE SELECT (access_token, refresh_token, encrypted_password) ON public.email_connections FROM authenticated, anon;
REVOKE SELECT (stripe_customer_id, stripe_subscription_id) ON public.user_settings FROM authenticated, anon;

-- 3. Lock down internal trigger/event-trigger functions (not callable from PostgREST)
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

-- log_audit_event and has_role remain callable by authenticated users (intentional)
REVOKE ALL ON FUNCTION public.log_audit_event(text, text, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_audit_event(text, text, text, text, text) TO authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
