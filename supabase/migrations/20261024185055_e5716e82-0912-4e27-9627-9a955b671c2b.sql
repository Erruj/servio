CREATE INDEX IF NOT EXISTS emails_search_fulltext_idx ON public.emails USING gin (to_tsvector('simple',coalesce(subject,'')||' '||coalesce(body_text,'')||' '||coalesce(from_name,'')||' '||coalesce(from_email,'')));
CREATE OR REPLACE FUNCTION public.search_mail(_filters jsonb DEFAULT '{}'::jsonb, _view text DEFAULT 'inbox', _connection_id uuid DEFAULT NULL, _offset integer DEFAULT 0, _limit integer DEFAULT 50)
RETURNS SETOF public.emails LANGUAGE sql STABLE SECURITY INVOKER SET search_path=public AS $$
SELECT e.* FROM public.emails e
WHERE e.user_id=auth.uid()
AND (_connection_id IS NULL OR e.connection_id=_connection_id)
AND (CASE WHEN _filters ? 'in' THEN e.folder=(_filters->>'in') WHEN _view='all' THEN true WHEN _view='starred' THEN e.is_starred AND e.folder NOT IN ('trash','spam','drafts','scheduled','snoozed') ELSE e.folder=_view END)
AND (NOT _filters ? 'words' OR to_tsvector('simple',coalesce(e.subject,'')||' '||coalesce(e.body_text,'')||' '||coalesce(e.from_name,'')||' '||coalesce(e.from_email,'')) @@ websearch_to_tsquery('simple',_filters->>'words'))
AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(coalesce(_filters->'from','[]')) v WHERE position(lower(v) in lower(coalesce(e.from_name,'')||' '||e.from_email))=0)
AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(coalesce(_filters->'to','[]')) v WHERE NOT EXISTS (SELECT 1 FROM unnest(coalesce(e.to_emails,'{}')||coalesce(e.cc_emails,'{}')) a WHERE position(lower(v) in lower(a))>0))
AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(coalesce(_filters->'subject','[]')) v WHERE position(lower(v) in lower(coalesce(e.subject,'')))=0)
AND NOT EXISTS (SELECT 1 FROM jsonb_array_elements_text(coalesce(_filters->'label','[]')) v WHERE NOT EXISTS(SELECT 1 FROM unnest(coalesce(e.labels,'{}')) a WHERE lower(a)=lower(v)))
AND (NOT coalesce((_filters->>'attachment')::boolean,false) OR e.has_attachments)
AND (NOT coalesce((_filters->>'unread')::boolean,false) OR NOT coalesce(e.is_read,false))
AND (NOT coalesce((_filters->>'starred')::boolean,false) OR e.is_starred)
AND (NOT _filters ? 'before' OR e.received_at < ((_filters->>'before')::date::timestamp AT TIME ZONE 'Europe/Amsterdam'))
AND (NOT _filters ? 'after' OR e.received_at >= (((_filters->>'after')::date+1)::timestamp AT TIME ZONE 'Europe/Amsterdam'))
ORDER BY e.received_at DESC,e.id DESC
OFFSET greatest(_offset,0) LIMIT least(greatest(_limit,1),100);
$$;
REVOKE ALL ON FUNCTION public.search_mail(jsonb,text,uuid,integer,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.search_mail(jsonb,text,uuid,integer,integer) TO authenticated,service_role;
CREATE TABLE public.mail_saved_views(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, name text NOT NULL, query text NOT NULL, view text NOT NULL DEFAULT 'inbox', created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE,DELETE ON public.mail_saved_views TO authenticated;
GRANT ALL ON public.mail_saved_views TO service_role;
ALTER TABLE public.mail_saved_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_saved_mail_views ON public.mail_saved_views FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE TRIGGER mail_saved_views_updated BEFORE UPDATE ON public.mail_saved_views FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();