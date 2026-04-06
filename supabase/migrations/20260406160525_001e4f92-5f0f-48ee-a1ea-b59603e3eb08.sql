
-- Add personalization columns to user_settings
ALTER TABLE public.user_settings 
  ADD COLUMN IF NOT EXISTS ai_personality text DEFAULT 'neutral',
  ADD COLUMN IF NOT EXISTS ai_custom_personality text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS email_signature text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS accent_color text DEFAULT 'blue',
  ADD COLUMN IF NOT EXISTS compact_layout boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sidebar_order jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sidebar_favorites text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dashboard_widgets jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS quick_actions jsonb DEFAULT NULL;

-- Create AI corrections table for learning
CREATE TABLE public.ai_corrections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email_id uuid REFERENCES public.emails(id) ON DELETE SET NULL,
  original_reply text NOT NULL,
  corrected_reply text NOT NULL,
  tone text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.ai_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own corrections" ON public.ai_corrections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own corrections" ON public.ai_corrections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own corrections" ON public.ai_corrections FOR DELETE TO authenticated USING (auth.uid() = user_id);
