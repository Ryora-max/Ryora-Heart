-- RYORA: Phase 2e cleanup — drop legacy auth tables
-- Jalankan di Supabase SQL Editor SETELAH memastikan Supabase Auth berfungsi
--
-- WARNING: Ini menghapus data sessions lama. Pastikan:
-- 1. Supabase Auth sudah berfungsi (login via ryo@ryora.app / ara@ryora.app)
-- 2. Tidak ada lagi kode yang pakai custom JWT/sessions table

-- 1. Drop sessions table (custom JWT auth — sekarang dihandle Supabase Auth)
DROP TABLE IF EXISTS sessions CASCADE;

-- 2. Drop password_hash column dari users (Supabase Auth manage password sendiri)
-- Cek dulu kolomnya ada:
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users DROP COLUMN password_hash;
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password'
  ) THEN
    ALTER TABLE users DROP COLUMN password;
  END IF;
END $$;

-- 3. Cleanup: hapus policy lama kalau ada (dari sebelum RLS migration)
DROP POLICY IF EXISTS "sessions_select_own" ON sessions;
