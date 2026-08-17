-- RYORA: Storage bucket untuk gallery & profile pictures
-- Jalankan di Supabase SQL Editor

-- 1. Buat bucket 'gallery' (public read, authenticated write)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'gallery',
  'gallery',
  true,
  10485760, -- 10 MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS: public bisa baca (public bucket)
CREATE POLICY "gallery_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'gallery');

-- 3. RLS: service_role bisa tulis (untuk /api/upload server-side)
--    (service_role bypass RLS by default, tapi explicit policy untuk kejelasan)
CREATE POLICY "gallery_service_write" ON storage.objects
  FOR INSERT TO service_role WITH CHECK (bucket_id = 'gallery');

CREATE POLICY "gallery_service_delete" ON storage.objects
  FOR DELETE TO service_role USING (bucket_id = 'gallery');

-- 4. Setelah migrasi auth ke Supabase Auth (Phase 2c), tambah policy:
-- CREATE POLICY "gallery_authed_write" ON storage.objects
--   FOR INSERT TO authenticated WITH CHECK (
--     bucket_id = 'gallery'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   );
