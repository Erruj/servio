-- Data API grants ontbraken volledig op email_connections en de veilige view,
-- waardoor de client geen koppelingen kon ophalen (lege "Gekoppelde accounts").

GRANT ALL ON public.email_connections TO service_role;
GRANT SELECT ON public.email_connections_safe TO service_role;

-- Alleen niet-gevoelige kolommen leesbaar voor de app (geen tokens/wachtwoorden).
GRANT SELECT (
  id, user_id, provider, email_address, is_active, last_sync_at, sync_error,
  imap_host, imap_port, smtp_host, smtp_port, use_ssl, created_at, updated_at
) ON public.email_connections TO authenticated;

GRANT INSERT (
  id, user_id, provider, email_address, is_active,
  imap_host, imap_port, smtp_host, smtp_port, use_ssl
) ON public.email_connections TO authenticated;

GRANT UPDATE (
  email_address, is_active, imap_host, imap_port, smtp_host, smtp_port, use_ssl
) ON public.email_connections TO authenticated;

GRANT DELETE ON public.email_connections TO authenticated;

-- security_invoker view: expliciete SELECT nodig voor de app.
GRANT SELECT ON public.email_connections_safe TO authenticated;