-- Ryora v2 — chat, rindu notifications, live activities with mood/time
-- Run this in Supabase SQL Editor

-- ─── Chat Messages ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

-- ─── Rindu Notifications ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS rindu_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair_id TEXT NOT NULL,
  sender_id TEXT NOT NULL,
  receiver_id TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'rindu', -- 'kangen' | 'rindu' | 'rindu_banget'
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at TIMESTAMPTZ,
  response TEXT -- 'aku_juga' | 'ignored'
);

-- ─── Live Activities (replace old activities) ──────────────────
-- Add mood + start_time + end_time to existing activities table
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS mood TEXT DEFAULT NULL,        -- 'happy' | 'love' | 'miss' | 'excited' | 'calm' | 'sad' | 'busy' | 'sleepy'
  ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false;

-- ─── Live Locations (extend existing ldr_locations) ────────────
-- Add lat/lng for GPS realtime
ALTER TABLE ldr_locations
  ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lng DOUBLE PRECISION DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS accuracy DOUBLE PRECISION DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- ─── RLS Policies ──────────────────────────────────────────────

-- Chat: pair members can read/write
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "chat_pair_read" ON chat_messages;
CREATE POLICY "chat_pair_read" ON chat_messages
  FOR SELECT USING (pair_id = auth_pair_id());
DROP POLICY IF EXISTS "chat_pair_insert" ON chat_messages;
CREATE POLICY "chat_pair_insert" ON chat_messages
  FOR INSERT WITH CHECK (pair_id = auth_pair_id() AND sender_id = auth_user_id());

-- Rindu: pair members can read/write
ALTER TABLE rindu_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rindu_pair_read" ON rindu_notifications;
CREATE POLICY "rindu_pair_read" ON rindu_notifications
  FOR SELECT USING (pair_id = auth_pair_id());
DROP POLICY IF EXISTS "rindu_pair_insert" ON rindu_notifications;
CREATE POLICY "rindu_pair_insert" ON rindu_notifications
  FOR INSERT WITH CHECK (pair_id = auth_pair_id() AND sender_id = auth_user_id());
DROP POLICY IF EXISTS "rindu_pair_update" ON rindu_notifications;
CREATE POLICY "rindu_pair_update" ON rindu_notifications
  FOR UPDATE USING (pair_id = auth_pair_id() AND receiver_id = auth_user_id());

-- ─── Realtime ──────────────────────────────────────────────────
ALTER TABLE chat_messages REPLICA IDENTITY FULL;
ALTER TABLE rindu_notifications REPLICA IDENTITY FULL;
ALTER TABLE activities REPLICA IDENTITY FULL;
ALTER TABLE ldr_locations REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE rindu_notifications;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE activities;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE ldr_locations;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
