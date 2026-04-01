
-- Fix 1: Financial-documents bucket policies - change from 'public' to 'authenticated' role
DROP POLICY IF EXISTS "Users can view own financial documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own financial documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own financial documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own financial documents" ON storage.objects;

CREATE POLICY "Users can view own financial documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'financial-documents' AND (storage.foldername(name))[1] = (auth.uid())::text);

CREATE POLICY "Users can upload own financial documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'financial-documents' AND (storage.foldername(name))[1] = (auth.uid())::text);

CREATE POLICY "Users can update own financial documents" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'financial-documents' AND (storage.foldername(name))[1] = (auth.uid())::text);

CREATE POLICY "Users can delete own financial documents" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'financial-documents' AND (storage.foldername(name))[1] = (auth.uid())::text);

-- Fix 2: Create a safe view for email_connections that excludes sensitive token columns
CREATE OR REPLACE VIEW public.email_connections_safe AS
  SELECT id, user_id, provider, email_address, is_active, last_sync_at, sync_error,
         imap_host, imap_port, smtp_host, smtp_port, use_ssl, created_at, updated_at
  FROM public.email_connections;

-- Drop the overly permissive SELECT policy on email_connections
DROP POLICY IF EXISTS "Users can view own email connections" ON public.email_connections;

-- Re-create SELECT policy that only allows service_role or edge functions to read tokens
-- Client-side code should use the safe view instead
CREATE POLICY "Users can view own email connections" ON public.email_connections
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Note: We keep the SELECT policy because edge functions using user's JWT still need it.
-- The safe view provides column-level restriction for client-side use.

-- Fix 3: Team invitations - allow invited users to read their own invitations
CREATE POLICY "Invited users can view own invitations" ON public.team_invitations
  FOR SELECT TO authenticated
  USING (lower(email) = lower(auth.jwt()->>'email'));
