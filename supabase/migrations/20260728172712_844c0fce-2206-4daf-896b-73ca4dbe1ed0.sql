ALTER TABLE public.user_settings
ADD COLUMN IF NOT EXISTS review_requested_at timestamp with time zone;

CREATE INDEX IF NOT EXISTS idx_user_settings_review_requested_at
  ON public.user_settings (review_requested_at);