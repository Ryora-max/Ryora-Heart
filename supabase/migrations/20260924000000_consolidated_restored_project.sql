-- Consolidated migration for hftcdemqxtlbdbzyvxtn (restored original project)
-- Brings old schema up to current code contract.

-- ─── 1. users: email column + drop legacy password cols ─────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
UPDATE users SET email = 'ryo@ryora.app' WHERE id = 'user-1' AND username = 'Ryo';
UPDATE users SET email = 'ara@ryora.app' WHERE id = 'user-2' AND username = 'Ara';
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
ALTER TABLE users DROP COLUMN IF EXISTS password;
DROP TABLE IF EXISTS sessions CASCADE;

-- ─── 2. chat_messages: drop old schema, create v2 ───────────────
DROP TABLE IF EXISTS chat_messages;
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- ─── 3. rindu_notifications ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS rindu_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'rindu',
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  response TEXT
);

-- ─── 4. activities + ldr_locations column adds ──────────────────
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS mood TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false;

ALTER TABLE ldr_locations
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS accuracy DOUBLE PRECISION DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ─── 5. RLS helper functions (email-mapped) ─────────────────────
CREATE OR REPLACE FUNCTION auth_pair_id()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT pair_id FROM users WHERE email = auth.jwt() ->> 'email' LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION auth_user_id()
RETURNS TEXT LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT id FROM users WHERE email = auth.jwt() ->> 'email' LIMIT 1;
$$;

-- ─── 6. Enable RLS on all tables ────────────────────────────────
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
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE rindu_notifications ENABLE ROW LEVEL SECURITY;

-- ─── 7. Policies ────────────────────────────────────────────────
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

-- user_settings & user_extras: pair-scoped (shared settings, love points,
-- game state, push subscriptions live here — realtime needs pair visibility)
DROP POLICY IF EXISTS "user_settings_user_all" ON user_settings;
DROP POLICY IF EXISTS "user_settings_pair_all" ON user_settings;
CREATE POLICY "user_settings_pair_all" ON user_settings
  FOR ALL USING (pair_id = auth_pair_id()) WITH CHECK (pair_id = auth_pair_id());

DROP POLICY IF EXISTS "user_extras_user_all" ON user_extras;
DROP POLICY IF EXISTS "user_extras_pair_all" ON user_extras;
CREATE POLICY "user_extras_pair_all" ON user_extras
  FOR ALL USING (pair_id = auth_pair_id()) WITH CHECK (pair_id = auth_pair_id());

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

DROP POLICY IF EXISTS "chat_pair_read" ON chat_messages;
CREATE POLICY "chat_pair_read" ON chat_messages
  FOR SELECT USING (pair_id = auth_pair_id());
DROP POLICY IF EXISTS "chat_pair_insert" ON chat_messages;
CREATE POLICY "chat_pair_insert" ON chat_messages
  FOR INSERT WITH CHECK (pair_id = auth_pair_id() AND sender_id = auth_user_id());
DROP POLICY IF EXISTS "chat_pair_update" ON chat_messages;
CREATE POLICY "chat_pair_update" ON chat_messages
  FOR UPDATE USING (pair_id = auth_pair_id());

DROP POLICY IF EXISTS "rindu_pair_read" ON rindu_notifications;
CREATE POLICY "rindu_pair_read" ON rindu_notifications
  FOR SELECT USING (pair_id = auth_pair_id());
DROP POLICY IF EXISTS "rindu_pair_insert" ON rindu_notifications;
CREATE POLICY "rindu_pair_insert" ON rindu_notifications
  FOR INSERT WITH CHECK (pair_id = auth_pair_id() AND sender_id = auth_user_id());
DROP POLICY IF EXISTS "rindu_pair_update" ON rindu_notifications;
CREATE POLICY "rindu_pair_update" ON rindu_notifications
  FOR UPDATE USING (pair_id = auth_pair_id() AND receiver_id = auth_user_id());

-- ─── 8. Storage bucket ───────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('gallery', 'gallery', true, 10485760,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "gallery_public_read" ON storage.objects;
CREATE POLICY "gallery_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'gallery');
DROP POLICY IF EXISTS "gallery_service_write" ON storage.objects;
CREATE POLICY "gallery_service_write" ON storage.objects
  FOR INSERT TO service_role WITH CHECK (bucket_id = 'gallery');
DROP POLICY IF EXISTS "gallery_service_delete" ON storage.objects;
CREATE POLICY "gallery_service_delete" ON storage.objects
  FOR DELETE TO service_role USING (bucket_id = 'gallery');

-- ─── 9. Realtime ─────────────────────────────────────────────────
ALTER TABLE moods REPLICA IDENTITY FULL;
ALTER TABLE activities REPLICA IDENTITY FULL;
ALTER TABLE gallery REPLICA IDENTITY FULL;
ALTER TABLE calendar_events REPLICA IDENTITY FULL;
ALTER TABLE letters REPLICA IDENTITY FULL;
ALTER TABLE notifications REPLICA IDENTITY FULL;
ALTER TABLE user_settings REPLICA IDENTITY FULL;
ALTER TABLE user_extras REPLICA IDENTITY FULL;
ALTER TABLE ldr_presence REPLICA IDENTITY FULL;
ALTER TABLE ldr_status_updates REPLICA IDENTITY FULL;
ALTER TABLE ldr_hugs REPLICA IDENTITY FULL;
ALTER TABLE ldr_love_meter REPLICA IDENTITY FULL;
ALTER TABLE ldr_locations REPLICA IDENTITY FULL;
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER TABLE rindu_notifications REPLICA IDENTITY FULL;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'moods','activities','gallery','calendar_events','letters','notifications',
    'user_settings','user_extras','ldr_presence','ldr_status_updates',
    'ldr_hugs','ldr_love_meter','ldr_locations','chat_messages','rindu_notifications'
  ] LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END LOOP;
END $$;
