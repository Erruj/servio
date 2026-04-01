
DROP VIEW IF EXISTS public.email_connections_safe;
CREATE VIEW public.email_connections_safe
  WITH (security_invoker = on)
  AS SELECT id, user_id, provider, email_address, is_active, last_sync_at, sync_error,
            imap_host, imap_port, smtp_host, smtp_port, use_ssl, created_at, updated_at
     FROM public.email_connections;
