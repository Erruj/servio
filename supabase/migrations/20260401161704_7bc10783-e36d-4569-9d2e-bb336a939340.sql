-- Create storage buckets for invoices, receipts, and documents
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('receipts', 'receipts', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT (id) DO NOTHING;

-- RLS policies for invoices bucket
CREATE POLICY "Users can upload own invoices" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'invoices' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own invoices" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'invoices' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own invoices" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'invoices' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS policies for receipts bucket
CREATE POLICY "Users can upload own receipts" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own receipts" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own receipts" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'receipts' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS policies for documents bucket
CREATE POLICY "Users can upload own documents" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own documents" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own documents" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text);