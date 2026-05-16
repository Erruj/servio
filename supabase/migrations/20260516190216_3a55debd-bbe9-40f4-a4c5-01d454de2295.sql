
-- 1. Fix privilege escalation on user_roles: add WITH CHECK to ALL policy
DROP POLICY IF EXISTS "Only owners can manage roles" ON public.user_roles;

CREATE POLICY "Only owners can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'owner'::app_role))
WITH CHECK (has_role(auth.uid(), 'owner'::app_role));

-- handle_new_user runs as SECURITY DEFINER so it bypasses RLS and still works.

-- 2. Remove client INSERT on audit_log; route through SECURITY DEFINER function
DROP POLICY IF EXISTS "Users can insert own audit logs" ON public.audit_log;

CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action text,
  _status text,
  _endpoint text DEFAULT NULL,
  _ip_address text DEFAULT NULL,
  _user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.audit_log (user_id, action, status, endpoint, ip_address, user_agent)
  VALUES (auth.uid(), _action, _status, _endpoint, _ip_address, _user_agent)
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_audit_event(text, text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.log_audit_event(text, text, text, text, text) TO authenticated;

-- 3. Add UPDATE storage policies for invoices and receipts buckets
CREATE POLICY "Users can update own invoice files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'invoices' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'invoices' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own receipt files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);
