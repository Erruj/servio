
-- 1) Restrict column-level SELECT on email_connections (hide tokens/credentials)
REVOKE SELECT ON public.email_connections FROM anon, authenticated;
GRANT SELECT
  (id, user_id, provider, email_address, token_expires_at, scopes,
   is_active, last_sync_at, sync_error, created_at, updated_at,
   imap_host, imap_port, smtp_host, smtp_port, use_ssl)
  ON public.email_connections TO authenticated;
GRANT SELECT ON public.email_connections_safe TO authenticated;

-- 2) Restrict column-level SELECT on user_settings (hide Stripe IDs)
REVOKE SELECT ON public.user_settings FROM anon, authenticated;
GRANT SELECT
  (id, user_id, theme, language, ai_tone, auto_reply_enabled,
   created_at, updated_at, auto_categorize, auto_vat_calculation,
   monthly_summary, tag_suggestions, subscription_status,
   trial_start_date, trial_end_date, subscription_current_period_end,
   ai_personality, ai_custom_personality, email_signature,
   accent_color, compact_layout, sidebar_order, sidebar_favorites,
   dashboard_widgets, quick_actions, auto_export_enabled, preferred_tone)
  ON public.user_settings TO authenticated;

-- 3) Lock down realtime topic subscriptions to authenticated users only
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated users can receive realtime" ON realtime.messages;
CREATE POLICY "Authenticated users can receive realtime"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (true);
