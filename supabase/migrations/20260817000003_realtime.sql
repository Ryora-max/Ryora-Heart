-- RYORA: Enable Supabase Realtime untuk semua tabel
-- Jalankan di Supabase SQL Editor
--
-- Setelah ini, juga enable di Dashboard:
-- Database → Replication → toggle "realtime" untuk semua tabel di bawah
--
-- Atau cukup jalankan SQL ini (alternatif):

-- 1. Drop existing realtime publication (kalau ada) lalu recreate
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE
  moods,
  activities,
  gallery,
  calendar_events,
  letters,
  notifications,
  user_settings,
  user_extras,
  ldr_presence,
  ldr_status_updates,
  ldr_hugs,
  ldr_love_meter,
  ldr_locations;

-- 2. Pastikan REPLICA IDENTITY FULL (supaya old data dikirim di UPDATE/DELETE)
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

-- 3. Grant realtime access ke authenticated users
-- (Supabase handle ini otomatis kalau RLS sudah enabled)
