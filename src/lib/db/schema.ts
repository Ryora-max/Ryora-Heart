import db from "./index";

export function initializeDatabase() {
  const sql = [
    "CREATE TABLE IF NOT EXISTS users (",
    "  id TEXT PRIMARY KEY,",
    "  username TEXT UNIQUE NOT NULL,",
    "  password TEXT NOT NULL,",
    "  name TEXT NOT NULL,",
    "  role TEXT NOT NULL CHECK(role IN ('owner', 'partner')),",
    "  relationship TEXT,",
    "  avatar_url TEXT,",
    "  pair_id TEXT,",
    "  created_at TEXT DEFAULT CURRENT_TIMESTAMP",
    ");",
    "",
    "CREATE TABLE IF NOT EXISTS moods (",
    "  id TEXT PRIMARY KEY,",
    "  user_id TEXT NOT NULL,",
    "  pair_id TEXT NOT NULL,",
    "  mood TEXT NOT NULL,",
    "  note TEXT,",
    "  created_at TEXT DEFAULT CURRENT_TIMESTAMP,",
    "  FOREIGN KEY (user_id) REFERENCES users(id)",
    ");",
    "",
    "CREATE TABLE IF NOT EXISTS activities (",
    "  id TEXT PRIMARY KEY,",
    "  pair_id TEXT NOT NULL,",
    "  title TEXT NOT NULL,",
    "  description TEXT,",
    "  type TEXT NOT NULL CHECK(type IN ('schedule', 'reminder', 'milestone')),",
    "  date TEXT NOT NULL,",
    "  completed INTEGER DEFAULT 0,",
    "  created_by TEXT NOT NULL,",
    "  FOREIGN KEY (created_by) REFERENCES users(id)",
    ");",
    "",
    "CREATE TABLE IF NOT EXISTS gallery (",
    "  id TEXT PRIMARY KEY,",
    "  pair_id TEXT NOT NULL,",
    "  url TEXT NOT NULL,",
    "  caption TEXT,",
    "  created_at TEXT DEFAULT CURRENT_TIMESTAMP,",
    "  created_by TEXT NOT NULL,",
    "  FOREIGN KEY (created_by) REFERENCES users(id)",
    ");",
    "",
    "CREATE TABLE IF NOT EXISTS calendar_events (",
    "  id TEXT PRIMARY KEY,",
    "  pair_id TEXT NOT NULL,",
    "  title TEXT NOT NULL,",
    "  date TEXT NOT NULL,",
    "  type TEXT NOT NULL CHECK(type IN ('vc', 'birthday', 'anniversary', 'reminder')),",
    "  description TEXT,",
    "  created_at TEXT DEFAULT CURRENT_TIMESTAMP",
    ");",
    "",
    "CREATE TABLE IF NOT EXISTS letters (",
    "  id TEXT PRIMARY KEY,",
    "  pair_id TEXT NOT NULL,",
    "  title TEXT NOT NULL,",
    "  content TEXT NOT NULL,",
    "  type TEXT NOT NULL CHECK(type IN ('open_when', 'love_letter', 'secret')),",
    "  open_date TEXT,",
    "  created_at TEXT DEFAULT CURRENT_TIMESTAMP,",
    "  created_by TEXT NOT NULL,",
    "  FOREIGN KEY (created_by) REFERENCES users(id)",
    ");",
    "",
    "CREATE TABLE IF NOT EXISTS notifications (",
    "  id TEXT PRIMARY KEY,",
    "  user_id TEXT NOT NULL,",
    "  pair_id TEXT NOT NULL,",
    "  message TEXT NOT NULL,",
    "  type TEXT NOT NULL,",
    "  read INTEGER DEFAULT 0,",
    "  created_at TEXT DEFAULT CURRENT_TIMESTAMP,",
    "  FOREIGN KEY (user_id) REFERENCES users(id)",
    ");",
    "",
    "CREATE TABLE IF NOT EXISTS sessions (",
    "  id TEXT PRIMARY KEY,",
    "  user_id TEXT NOT NULL,",
    "  token TEXT NOT NULL,",
    "  expires_at TEXT NOT NULL,",
    "  FOREIGN KEY (user_id) REFERENCES users(id)",
    ");",
    "",
    "CREATE TABLE IF NOT EXISTS user_settings (",
    "  id TEXT PRIMARY KEY,",
    "  user_id TEXT NOT NULL UNIQUE,",
    "  pair_id TEXT NOT NULL,",
    "  relationship_start_date TEXT,",
    "  distance_km TEXT,",
    "  next_meetup_date TEXT,",
    "  secret_pin TEXT DEFAULT '0101',",
    "  FOREIGN KEY (user_id) REFERENCES users(id)",
    ");",
    "",
    "CREATE INDEX IF NOT EXISTS idx_moods_pair_id ON moods(pair_id);",
    "CREATE INDEX IF NOT EXISTS idx_activities_pair_id ON activities(pair_id);",
    "CREATE INDEX IF NOT EXISTS idx_gallery_pair_id ON gallery(pair_id);",
    "CREATE INDEX IF NOT EXISTS idx_calendar_events_pair_id ON calendar_events(pair_id);",
    "CREATE INDEX IF NOT EXISTS idx_letters_pair_id ON letters(pair_id);",
    "CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);",
    "CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);",
  ].join("\n");

  db.exec(sql);

  seedData();
}

function seedData() {
  const count = db.prepare("SELECT COUNT(*) as c FROM users").get() as { c: number };
  if (count.c === 0) {
    const now = new Date().toISOString();
    const pairId = "pair-1";

    const insert = db.prepare(
      "INSERT INTO users (id, username, password, name, role, relationship, avatar_url, pair_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );

    insert.run("user-1", "Ryo", "11122004", "Ahmad Rio Prawiro", "owner", "Cowo Ara ❤️", null, pairId, now);
    insert.run("user-2", "Ara", "09062004", "Tiara Pertiwi", "partner", "Cewe Rio ❤️", null, pairId, now);
  }
}
