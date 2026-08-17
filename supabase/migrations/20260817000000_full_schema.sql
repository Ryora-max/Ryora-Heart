-- RYORA: Full schema + seed data
-- Jalankan di Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)
--
-- PRASYARAT: 2 user sudah dibuat di Supabase Auth:
--   - ryo@ryora.app (ID: eb6dfbf6-8389-4cf2-b771-f52b9ac32cac)
--   - ara@ryora.app (ID: 8cc49c82-072b-4b48-a329-9d6ddda94f52)

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. CREATE TABLES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'owner',
  relationship TEXT DEFAULT '',
  avatar_url TEXT,
  pair_id TEXT NOT NULL,
  email TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS moods (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  pair_id TEXT NOT NULL,
  mood TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  pair_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'date',
  date TIMESTAMPTZ NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS gallery (
  id TEXT PRIMARY KEY,
  pair_id TEXT NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  pair_id TEXT NOT NULL,
  title TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL DEFAULT 'date',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS letters (
  id TEXT PRIMARY KEY,
  pair_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'love_letter',
  open_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  pair_id TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  pair_id TEXT NOT NULL,
  relationship_start_date DATE,
  distance_km TEXT,
  next_meetup_date DATE,
  secret_pin TEXT DEFAULT '0101'
);

CREATE TABLE IF NOT EXISTS user_extras (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  pair_id TEXT NOT NULL,
  key TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ldr_presence (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  pair_id TEXT NOT NULL,
  status TEXT DEFAULT 'offline',
  last_seen TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ldr_status_updates (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  pair_id TEXT NOT NULL,
  message TEXT NOT NULL,
  emoji TEXT DEFAULT '💬',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ldr_hugs (
  id TEXT PRIMARY KEY,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  pair_id TEXT NOT NULL,
  message TEXT,
  emoji TEXT DEFAULT '🤗',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ldr_love_meter (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  pair_id TEXT NOT NULL,
  percentage INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ldr_locations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  pair_id TEXT NOT NULL,
  place TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. SEED DATA — Ryo & Ara
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO users (id, username, name, role, relationship, pair_id, email) VALUES
  ('eb6dfbf6-8389-4cf2-b771-f52b9ac32cac', 'Ryo', 'Ahmad Rio Prawiro', 'owner', 'in a relationship', 'ryora-pair-001', 'ryo@ryora.app'),
  ('8cc49c82-072b-4b48-a329-9d6ddda94f52', 'Ara', 'Tiara Pertiwi', 'partner', 'in a relationship', 'ryora-pair-001', 'ara@ryora.app')
ON CONFLICT (id) DO UPDATE SET
  username = EXCLUDED.username,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  pair_id = EXCLUDED.pair_id,
  email = EXCLUDED.email;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. ENABLE RLS
-- ═══════════════════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION auth_pair_id()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT pair_id FROM users WHERE email = auth.jwt() ->> 'email' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION auth_user_id()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT id FROM users WHERE email = auth.jwt() ->> 'email' LIMIT 1;
$$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "users_select_own_pair" ON users;
CREATE POLICY "users_select_own_pair" ON users
  FOR SELECT USING (pair_id = auth_pair_id());

DROP POLICY IF EXISTS "moods_pair_all" ON moods;
CREATE POLICY "moods_pair_all" ON moods
  FOR ALL USING (pair_id = auth_pair_id()) WITH CHECK (pair_id = auth_pair_id());

DROP POLICY IF EXISTS "activities_pair_all" ON activities;
CREATE POLICY "activities_pair_all" ON activities
  FOR ALL USING (pair_id = auth_pair_id()) WITH CHECK (pair_id = auth_pair_id());

DROP POLICY IF EXISTS "gallery_pair_all" ON gallery;
CREATE POLICY "gallery_pair_all" ON gallery
  FOR ALL USING (pair_id = auth_pair_id()) WITH CHECK (pair_id = auth_pair_id());

DROP POLICY IF EXISTS "calendar_events_pair_all" ON calendar_events;
CREATE POLICY "calendar_events_pair_all" ON calendar_events
  FOR ALL USING (pair_id = auth_pair_id()) WITH CHECK (pair_id = auth_pair_id());

DROP POLICY IF EXISTS "letters_pair_all" ON letters;
CREATE POLICY "letters_pair_all" ON letters
  FOR ALL USING (pair_id = auth_pair_id()) WITH CHECK (pair_id = auth_pair_id());

DROP POLICY IF EXISTS "notifications_user_select" ON notifications;
CREATE POLICY "notifications_user_select" ON notifications
  FOR SELECT USING (user_id = auth_user_id());

DROP POLICY IF EXISTS "notifications_user_update" ON notifications;
CREATE POLICY "notifications_user_update" ON notifications
  FOR UPDATE USING (user_id = auth_user_id());

DROP POLICY IF EXISTS "notifications_pair_insert" ON notifications;
CREATE POLICY "notifications_pair_insert" ON notifications
  FOR INSERT WITH CHECK (pair_id = auth_pair_id());

DROP POLICY IF EXISTS "user_settings_user_all" ON user_settings;
CREATE POLICY "user_settings_user_all" ON user_settings
  FOR ALL USING (user_id = auth_user_id()) WITH CHECK (user_id = auth_user_id());

DROP POLICY IF EXISTS "user_extras_user_all" ON user_extras;
CREATE POLICY "user_extras_user_all" ON user_extras
  FOR ALL USING (user_id = auth_user_id()) WITH CHECK (user_id = auth_user_id());

DROP POLICY IF EXISTS "ldr_presence_pair_all" ON ldr_presence;
CREATE POLICY "ldr_presence_pair_all" ON ldr_presence
  FOR ALL USING (pair_id = auth_pair_id()) WITH CHECK (pair_id = auth_pair_id());

DROP POLICY IF EXISTS "ldr_status_updates_pair_all" ON ldr_status_updates;
CREATE POLICY "ldr_status_updates_pair_all" ON ldr_status_updates
  FOR ALL USING (pair_id = auth_pair_id()) WITH CHECK (pair_id = auth_pair_id());

DROP POLICY IF EXISTS "ldr_hugs_pair_all" ON ldr_hugs;
CREATE POLICY "ldr_hugs_pair_all" ON ldr_hugs
  FOR ALL USING (pair_id = auth_pair_id()) WITH CHECK (pair_id = auth_pair_id());

DROP POLICY IF EXISTS "ldr_love_meter_pair_all" ON ldr_love_meter;
CREATE POLICY "ldr_love_meter_pair_all" ON ldr_love_meter
  FOR ALL USING (pair_id = auth_pair_id()) WITH CHECK (pair_id = auth_pair_id());

DROP POLICY IF EXISTS "ldr_locations_pair_all" ON ldr_locations;
CREATE POLICY "ldr_locations_pair_all" ON ldr_locations
  FOR ALL USING (pair_id = auth_pair_id()) WITH CHECK (pair_id = auth_pair_id());

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. REALTIME PUBLICATION
-- ═══════════════════════════════════════════════════════════════════════════

ALTER PUBLICATION supabase_realtime ADD TABLE moods;
ALTER PUBLICATION supabase_realtime ADD TABLE activities;
ALTER PUBLICATION supabase_realtime ADD TABLE gallery;
ALTER PUBLICATION supabase_realtime ADD TABLE calendar_events;
ALTER PUBLICATION supabase_realtime ADD TABLE letters;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE ldr_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE ldr_status_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE ldr_hugs;
ALTER PUBLICATION supabase_realtime ADD TABLE ldr_love_meter;
ALTER PUBLICATION supabase_realtime ADD TABLE ldr_locations;

ALTER TABLE moods REPLICA IDENTITY FULL;
ALTER TABLE activities REPLICA IDENTITY FULL;
ALTER TABLE gallery REPLICA IDENTITY FULL;
ALTER TABLE calendar_events REPLICA IDENTITY FULL;
ALTER TABLE letters REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE ldr_presence REPLICA IDENTITY FULL;
ALTER TABLE ldr_status_updates REPLICA IDENTITY FULL;
ALTER TABLE ldr_hugs REPLICA IDENTITY FULL;
ALTER TABLE ldr_love_meter REPLICA IDENTITY FULL;
ALTER TABLE ldr_locations REPLICA IDENTITY FULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. STORAGE BUCKET
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "gallery_bucket_public_read" ON storage.objects;
CREATE POLICY "gallery_bucket_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'gallery');

DROP POLICY IF EXISTS "gallery_bucket_auth_insert" ON storage.objects;
CREATE POLICY "gallery_bucket_auth_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'gallery' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "gallery_bucket_auth_delete" ON storage.objects;
CREATE POLICY "gallery_bucket_auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'gallery' AND auth.role() = 'authenticated');
