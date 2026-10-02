CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH t AS (
    SELECT auth.uid() AS uid,
      date_trunc('day', now()) AS today_start,
      now() - interval '7 days' AS week_start,
      date_trunc('month', now()) AS month_start,
      date_trunc('month', now()) - interval '1 month' AS last_month_start
  )
  SELECT CASE WHEN (SELECT uid FROM t) IS NULL THEN NULL ELSE jsonb_build_object(
    'total_emails', (SELECT count(*) FROM emails e, t WHERE e.user_id = t.uid),
    'unread_emails', (SELECT count(*) FROM emails e, t WHERE e.user_id = t.uid AND e.is_read = false),
    'today_emails', (SELECT count(*) FROM emails e, t WHERE e.user_id = t.uid AND e.received_at >= t.today_start),
    'week_emails', (SELECT count(*) FROM emails e, t WHERE e.user_id = t.uid AND e.received_at >= t.week_start),
    'month_emails', (SELECT count(*) FROM emails e, t WHERE e.user_id = t.uid AND e.received_at >= t.month_start),
    'total_invoices', (SELECT count(*) FROM invoices i, t WHERE i.user_id = t.uid),
    'total_receipts', (SELECT count(*) FROM receipts r, t WHERE r.user_id = t.uid),
    'total_documents', (SELECT count(*) FROM documents d, t WHERE d.user_id = t.uid),
    'connections', (SELECT count(*) FROM email_connections c, t WHERE c.user_id = t.uid),
    'read_emails_this_month', (SELECT count(*) FROM emails e, t WHERE e.user_id = t.uid AND e.is_read = true AND e.updated_at >= t.month_start),
    'read_emails_last_month', (SELECT count(*) FROM emails e, t WHERE e.user_id = t.uid AND e.is_read = true AND e.updated_at >= t.last_month_start AND e.updated_at < t.month_start),
    'invoices_this_month', (SELECT count(*) FROM invoices i, t WHERE i.user_id = t.uid AND i.created_at >= t.month_start),
    'invoices_last_month', (SELECT count(*) FROM invoices i, t WHERE i.user_id = t.uid AND i.created_at >= t.last_month_start AND i.created_at < t.month_start),
    'ai_this_month', (SELECT count(*) FROM ai_corrections a, t WHERE a.user_id = t.uid AND a.created_at >= t.month_start),
    'ai_last_month', (SELECT count(*) FROM ai_corrections a, t WHERE a.user_id = t.uid AND a.created_at >= t.last_month_start AND a.created_at < t.month_start)
  ) END;
$$;

REVOKE ALL ON FUNCTION public.get_dashboard_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;