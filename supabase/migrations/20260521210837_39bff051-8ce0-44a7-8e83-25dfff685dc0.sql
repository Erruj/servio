CREATE INDEX IF NOT EXISTS idx_emails_user_received ON public.emails (user_id, received_at DESC);
CREATE INDEX IF NOT EXISTS idx_emails_user_isread ON public.emails (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_emails_user_connection ON public.emails (user_id, connection_id);
CREATE INDEX IF NOT EXISTS idx_emails_thread ON public.emails (user_id, thread_id);