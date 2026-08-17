-- RYORA: Supabase Auth migration
-- Jalankan di Supabase SQL Editor
--
-- PRASYARAT:
-- 1. Buat 2 user di Supabase Dashboard → Authentication → Users → "Add user":
--    - Email: ryo@ryora.app   Password: (password Ryo)
--    - Email: ara@ryora.app   Password: (password Ara)
-- 2. Lalu jalankan migration ini

-- 1. Tambah kolom email ke users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- 2. Set email untuk existing users
UPDATE users SET email = 'ryo@ryora.app' WHERE id = 'user-1' AND username = 'Ryo';
UPDATE users SET email = 'ara@ryora.app' WHERE id = 'user-2' AND username = 'Ara';

-- 3. Enable RLS di semua tabel
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE ldr_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE ldr_status_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE ldr_hugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ldr_love_meter ENABLE ROW LEVEL SECURITY;
ALTER TABLE ldr_locations ENABLE ROW LEVEL SECURITY;

-- 4. Helper function: dapatkan pair_id user yang sedang login
CREATE OR REPLACE FUNCTION auth_pair_id()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT pair_id FROM users WHERE email = auth.jwt() ->> 'email' LIMIT 1;
$$;

-- 5. Helper function: dapatkan user id yang sedang login
CREATE OR REPLACE FUNCTION auth_user_id()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM users WHERE email = auth.jwt() ->> 'email' LIMIT 1;
$$;

-- 6. RLS Policies
-- users: user hanya bisa baca profile sendiri + partner (same pair_id)
DROP POLICY IF EXISTS "users_select_own_pair" ON users;
CREATE POLICY "users_select_own_pair" ON users
  FOR SELECT USING (pair_id = auth_pair_id());

-- moods: pair members bisa CRUD
DROP POLICY IF EXISTS "moods_pair_all" ON moods;
CREATE POLICY "moods_pair_all" ON moods
  FOR ALL USING (pair_id = auth_pair_id()) WITH CHECK (pair_id = auth_pair_id());

-- activities: pair members bisa CRUD
DROP POLICY IF EXISTS "activities_pair_all" ON activities;
CREATE POLICY "activities_pair_all" ON activities
  FOR ALL USING (pair_id = auth_pair_id()) WITH CHECK (pair_id = auth_pair_id());

-- gallery: pair members bisa CRUD
DROP POLICY IF EXISTS "gallery_pair_all" ON gallery;
CREATE POLICY "gallery_pair_all" ON gallery
  FOR ALL USING (pair_id = auth_pair_id()) WITH CHECK (pair_id = auth_pair_id());

-- calendar_events: pair members bisa CRUD
DROP POLICY IF EXISTS "calendar_events_pair_all" ON calendar_events;
CREATE POLICY "calendar_events_pair_all" ON calendar_events
  FOR ALL USING (pair_id = auth_pair_id()) WITH CHECK (pair_id = auth_pair_id());

-- letters: pair members bisa CRUD
DROP POLICY IF EXISTS "letters_pair_all" ON letters;
CREATE POLICY "letters_pair_all" ON letters
  FOR ALL USING (pair_id = auth_pair_id()) WITH CHECK (pair_id = auth_pair_id());

-- notifications: user hanya bisa baca notif sendiri
DROP POLICY IF EXISTS "notifications_user_select" ON notifications;
CREATE POLICY "notifications_user_select" ON notifications
  FOR SELECT USING (user_id = auth_user_id());

DROP POLICY IF EXISTS "notifications_user_update" ON notifications;
CREATE POLICY "notifications_user_update" ON notifications
  FOR UPDATE USING (user_id = auth_user_id());

-- notifications: pair members bisa INSERT notif untuk partner (untuk notifyPartner)
DROP POLICY IF EXISTS "notifications_pair_insert" ON notifications;
CREATE POLICY "notifications_pair_insert" ON notifications
  FOR INSERT WITH CHECK (pair_id = auth_pair_id());

-- user_settings: user hanya bisa baca/update settings sendiri
DROP POLICY IF EXISTS "user_settings_user_all" ON user_settings;
CREATE POLICY "user_settings_user_all" ON user_settings
  FOR ALL USING (user_id = auth_user_id()) WITH CHECK (user_id = auth_user_id());

-- user_extras: user hanya bisa baca/update extras sendiri
DROP POLICY IF EXISTS "user_extras_user_all" ON user_extras;
CREATE POLICY "user_extras_user_all" ON user_extras
  FOR ALL USING (user_id = auth_user_id()) WITH CHECK (user_id = auth_user_id());

-- ldr_presence: pair members bisa CRUD
DROP POLICY IF EXISTS "ldr_presence_pair_all" ON ldr_presence;
CREATE POLICY "ldr_presence_pair_all" ON ldr_presence
  FOR ALL USING (pair_id = auth_pair_id()) WITH CHECK (pair_id = auth_pair_id());

-- ldr_status_updates: pair members bisa CRUD
DROP POLICY IF EXISTS "ldr_status_updates_pair_all" ON ldr_status_updates;
CREATE POLICY "ldr_status_updates_pair_all" ON ldr_status_updates
  FOR ALL USING (pair_id = auth_pair_id()) WITH CHECK (pair_id = auth_pair_id());

-- ldr_hugs: pair members bisa CRUD
DROP POLICY IF EXISTS "ldr_hugs_pair_all" ON ldr_hugs;
CREATE POLICY "ldr_hugs_pair_all" ON ldr_hugs
  FOR ALL USING (pair_id = auth_pair_id()) WITH CHECK (pair_id = auth_pair_id());

-- ldr_love_meter: pair members bisa CRUD
DROP POLICY IF EXISTS "ldr_love_meter_pair_all" ON ldr_love_meter;
CREATE POLICY "ldr_love_meter_pair_all" ON ldr_love_meter
  FOR ALL USING (pair_id = auth_pair_id()) WITH CHECK (pair_id = auth_pair_id());

-- ldr_locations: pair members bisa CRUD
DROP POLICY IF EXISTS "ldr_locations_pair_all" ON ldr_locations;
CREATE POLICY "ldr_locations_pair_all" ON ldr_locations
  FOR ALL USING (pair_id = auth_pair_id()) WITH CHECK (pair_id = auth_pair_id());

-- 7. Hapus sessions table (tidak lagi dipakai — Supabase Auth manage session sendiri)
-- COMMENT dulu untuk safety, uncomment setelah migrasi sukses:
-- DROP TABLE IF EXISTS sessions;
