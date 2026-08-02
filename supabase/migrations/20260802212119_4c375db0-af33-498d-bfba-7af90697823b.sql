ALTER TABLE public.emails DROP CONSTRAINT emails_connection_id_fkey;
ALTER TABLE public.emails ALTER COLUMN connection_id DROP NOT NULL;
ALTER TABLE public.emails ADD CONSTRAINT emails_connection_id_fkey
  FOREIGN KEY (connection_id) REFERENCES public.email_connections(id) ON DELETE SET NULL;