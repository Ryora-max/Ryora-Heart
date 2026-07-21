-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('owner', 'partner')),
  relationship TEXT,
  avatar_url TEXT,
  pair_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Moods table
CREATE TABLE IF NOT EXISTS moods (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  pair_id TEXT NOT NULL,
  mood TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  pair_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK(type IN ('schedule', 'reminder', 'milestone')),
  date TIMESTAMP NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_by TEXT NOT NULL REFERENCES users(id)
);

-- Gallery table
CREATE TABLE IF NOT EXISTS gallery (
  id TEXT PRIMARY KEY,
  pair_id TEXT NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL REFERENCES users(id)
);

-- Calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  pair_id TEXT NOT NULL,
  title TEXT NOT NULL,
  date TIMESTAMP NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('vc', 'birthday', 'anniversary', 'reminder')),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Letters table
CREATE TABLE IF NOT EXISTS letters (
  id TEXT PRIMARY KEY,
  pair_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('open_when', 'love_letter', 'secret')),
  open_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL REFERENCES users(id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  pair_id TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
  pair_id TEXT NOT NULL,
  relationship_start_date TIMESTAMP,
  distance_km TEXT,
  next_meetup_date TIMESTAMP,
  secret_pin TEXT DEFAULT '0101'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_moods_pair_id ON moods(pair_id);
CREATE INDEX IF NOT EXISTS idx_activities_pair_id ON activities(pair_id);
CREATE INDEX IF NOT EXISTS idx_gallery_pair_id ON gallery(pair_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_pair_id ON calendar_events(pair_id);
CREATE INDEX IF NOT EXISTS idx_letters_pair_id ON letters(pair_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

-- Seed data
INSERT INTO users (id, username, password, name, role, relationship, pair_id, created_at)
VALUES 
  ('user-1', 'Ryo', '11122004', 'Ahmad Rio Prawiro', 'owner', 'Cowo Ara ❤️', 'pair-1', CURRENT_TIMESTAMP),
  ('user-2', 'Ara', '09062004', 'Tiara Pertiwi', 'partner', 'Cewe Rio ❤️', 'pair-1', CURRENT_TIMESTAMP)
ON CONFLICT (username) DO NOTHING;
