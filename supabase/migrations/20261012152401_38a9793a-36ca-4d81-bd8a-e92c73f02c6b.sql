ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS folder text NOT NULL DEFAULT 'inbox';
ALTER TABLE public.emails DROP CONSTRAINT IF EXISTS emails_folder_check;
ALTER TABLE public.emails ADD CONSTRAINT emails_folder_check CHECK (folder IN ('inbox','archive','trash','spam','sent','drafts'));
CREATE INDEX IF NOT EXISTS emails_user_folder_received_idx ON public.emails (user_id, folder, received_at DESC);