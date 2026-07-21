-- Fix: Insert profiles for existing auth users
-- Run this in Supabase Dashboard → SQL Editor

INSERT INTO profiles (id, name, username, role, relationship, avatar_url)
VALUES 
  ('eb6dfbf6-8389-4cf2-b771-f52b9ac32cac', 'Ahmad Rio Prawiro', 'Ryo', 'owner', 'Cowo Ara ❤️', null),
  ('8cc49c82-072b-4b48-a329-9d6ddda94f52', 'Tiara Pertiwi', 'Ara', 'partner', 'Cewe Rio ❤️', null)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  username = EXCLUDED.username,
  role = EXCLUDED.role,
  relationship = EXCLUDED.relationship;

-- Verify
SELECT * FROM profiles;
