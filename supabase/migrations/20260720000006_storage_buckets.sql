-- ============================================================
-- Migration 006: Storage Buckets & RLS Policies
-- Foco em Dados
-- ============================================================

-- ################################################################
-- Criar buckets
-- ################################################################
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('uploads', 'uploads', false, 10485760, '{text/csv,text/plain,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('exports', 'exports', false, 52428800, '{application/pdf,image/png,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet}')
ON CONFLICT (id) DO NOTHING;

-- ################################################################
-- RLS: uploads bucket (isolamento por auth.uid())
-- ################################################################
CREATE POLICY "uploads_select_own" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "uploads_insert_own" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "uploads_update_own" ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "uploads_delete_own" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'uploads' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ################################################################
-- RLS: exports bucket (isolamento por auth.uid())
-- ################################################################
CREATE POLICY "exports_select_own" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "exports_insert_own" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "exports_delete_own" ON storage.objects
  FOR DELETE
  USING (bucket_id = 'exports' AND auth.uid()::text = (storage.foldername(name))[1]);
