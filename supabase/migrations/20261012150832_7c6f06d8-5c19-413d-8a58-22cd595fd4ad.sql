CREATE TABLE public.email_image_preferences (
  user_id uuid PRIMARY KEY,
  mode text NOT NULL DEFAULT 'ask',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_image_preferences TO authenticated;
GRANT ALL ON public.email_image_preferences TO service_role;
ALTER TABLE public.email_image_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Eigen afbeeldingsvoorkeur" ON public.email_image_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND mode IN ('ask','always','never'));

CREATE TABLE public.email_image_trusted_senders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  sender_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, sender_email)
);
GRANT SELECT, INSERT, DELETE ON public.email_image_trusted_senders TO authenticated;
GRANT ALL ON public.email_image_trusted_senders TO service_role;
ALTER TABLE public.email_image_trusted_senders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Eigen vertrouwde afzenders" ON public.email_image_trusted_senders FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());