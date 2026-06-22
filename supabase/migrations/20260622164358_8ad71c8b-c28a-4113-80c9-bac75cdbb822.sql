
ALTER TABLE public.email_category_corrections
  ADD COLUMN IF NOT EXISTS sender_email text,
  ADD COLUMN IF NOT EXISTS correction_count integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS email_category_corrections_user_sender_cat_idx
  ON public.email_category_corrections (user_id, sender_email, corrected_category)
  WHERE sender_email IS NOT NULL;

ALTER TABLE public.emails
  ADD COLUMN IF NOT EXISTS category_from_correction boolean NOT NULL DEFAULT false;
