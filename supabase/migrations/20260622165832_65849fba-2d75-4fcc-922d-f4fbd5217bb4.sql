
CREATE TABLE public.ai_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  message text NOT NULL,
  action_url text,
  severity text NOT NULL DEFAULT 'info',
  read boolean NOT NULL DEFAULT false,
  dedup_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE, DELETE ON public.ai_notifications TO authenticated;
GRANT ALL ON public.ai_notifications TO service_role;

ALTER TABLE public.ai_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notifications" ON public.ai_notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users update own notifications" ON public.ai_notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own notifications" ON public.ai_notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_ai_notifications_user_created ON public.ai_notifications(user_id, created_at DESC);
CREATE UNIQUE INDEX idx_ai_notifications_dedup ON public.ai_notifications(user_id, dedup_key) WHERE dedup_key IS NOT NULL AND read = false;

CREATE TRIGGER update_ai_notifications_updated_at
  BEFORE UPDATE ON public.ai_notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_notifications;
