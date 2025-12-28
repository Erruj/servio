-- Fix audit_log INSERT policy to only allow users to insert their own logs
-- Drop the existing overly permissive INSERT policy
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_log;

-- Create a new INSERT policy that restricts to user's own logs
CREATE POLICY "Users can insert own audit logs"
ON public.audit_log FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);