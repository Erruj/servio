INSERT INTO storage.buckets (id, name, public) VALUES ('brand-assets', 'brand-assets', true) ON CONFLICT (id) DO UPDATE SET public = true;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='storage' AND tablename='objects' AND policyname='Brand assets public read') THEN
    CREATE POLICY "Brand assets public read" ON storage.objects FOR SELECT USING (bucket_id = 'brand-assets');
  END IF;
END $$;