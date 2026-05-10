-- Email category corrections table for AI training
CREATE TABLE public.email_category_corrections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  email_id UUID NOT NULL,
  original_category TEXT NOT NULL,
  corrected_category TEXT NOT NULL,
  email_subject TEXT,
  email_snippet TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.email_category_corrections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own corrections"
  ON public.email_category_corrections FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own corrections"
  ON public.email_category_corrections FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own corrections"
  ON public.email_category_corrections FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_email_category_corrections_user_created
  ON public.email_category_corrections(user_id, created_at DESC);

-- Add columns to emails table
ALTER TABLE public.emails
  ADD COLUMN IF NOT EXISTS thread_summary TEXT,
  ADD COLUMN IF NOT EXISTS thread_summary_updated_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS customer_sentiment TEXT,
  ADD COLUMN IF NOT EXISTS ai_category TEXT,
  ADD COLUMN IF NOT EXISTS ai_urgency TEXT;

CREATE INDEX IF NOT EXISTS idx_emails_user_urgency_unread
  ON public.emails(user_id, ai_urgency, is_read, received_at DESC);