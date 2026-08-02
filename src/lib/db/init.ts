import { query, getOne } from "./postgres";
import bcrypt from "bcryptjs";

let initPromise: Promise<void> | null = null;

export async function initializeDatabase() {
  if (initPromise) return initPromise;
  initPromise = doInit().catch((err) => {
    initPromise = null;
    throw err;
  });
  return initPromise;
}

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('owner', 'partner')), relationship TEXT, avatar_url TEXT, pair_id TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS moods (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), pair_id TEXT NOT NULL, mood TEXT NOT NULL, note TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS activities (id TEXT PRIMARY KEY, pair_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT, type TEXT NOT NULL CHECK(type IN ('schedule', 'reminder', 'milestone')), date TIMESTAMP NOT NULL, completed BOOLEAN DEFAULT FALSE, created_by TEXT NOT NULL REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS gallery (id TEXT PRIMARY KEY, pair_id TEXT NOT NULL, url TEXT NOT NULL, caption TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, created_by TEXT NOT NULL REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS calendar_events (id TEXT PRIMARY KEY, pair_id TEXT NOT NULL, title TEXT NOT NULL, date TIMESTAMP NOT NULL, type TEXT NOT NULL CHECK(type IN ('vc', 'birthday', 'anniversary', 'reminder')), description TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS letters (id TEXT PRIMARY KEY, pair_id TEXT NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL, type TEXT NOT NULL CHECK(type IN ('open_when', 'love_letter', 'secret')), open_date TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, created_by TEXT NOT NULL REFERENCES users(id))`,
  `CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), pair_id TEXT NOT NULL, message TEXT NOT NULL, type TEXT NOT NULL, read BOOLEAN DEFAULT FALSE, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), token TEXT NOT NULL, expires_at TIMESTAMP NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS user_settings (id TEXT PRIMARY KEY, user_id TEXT NOT NULL UNIQUE REFERENCES users(id), pair_id TEXT NOT NULL, relationship_start_date TIMESTAMP, distance_km TEXT, next_meetup_date TIMESTAMP, secret_pin TEXT DEFAULT '0101')`,
  `CREATE TABLE IF NOT EXISTS user_extras (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), pair_id TEXT NOT NULL, key TEXT NOT NULL, value TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE(user_id, key))`,
  `CREATE TABLE IF NOT EXISTS ldr_presence (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), pair_id TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'online', last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS ldr_status_updates (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), pair_id TEXT NOT NULL, message TEXT NOT NULL, emoji TEXT DEFAULT '💬', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS ldr_hugs (id TEXT PRIMARY KEY, sender_id TEXT NOT NULL REFERENCES users(id), receiver_id TEXT NOT NULL REFERENCES users(id), pair_id TEXT NOT NULL, message TEXT NOT NULL, emoji TEXT DEFAULT '🤗', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS ldr_love_meter (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), pair_id TEXT NOT NULL, percentage INTEGER NOT NULL DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS ldr_locations (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), pair_id TEXT NOT NULL, place TEXT NOT NULL, note TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS chat_messages (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), pair_id TEXT NOT NULL, text TEXT NOT NULL, emoji TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS voice_notes (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), pair_id TEXT NOT NULL, audio_url TEXT NOT NULL, duration INTEGER DEFAULT 0, title TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE TABLE IF NOT EXISTS game_scores (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), pair_id TEXT NOT NULL, game TEXT NOT NULL, score INTEGER DEFAULT 0, data TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS idx_moods_pair_id ON moods(pair_id)`,
  `CREATE INDEX IF NOT EXISTS idx_activities_pair_id ON activities(pair_id)`,
  `CREATE INDEX IF NOT EXISTS idx_gallery_pair_id ON gallery(pair_id)`,
  `CREATE INDEX IF NOT EXISTS idx_calendar_events_pair_id ON calendar_events(pair_id)`,
  `CREATE INDEX IF NOT EXISTS idx_letters_pair_id ON letters(pair_id)`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`,
  `CREATE INDEX IF NOT EXISTS idx_ldr_presence_pair_id ON ldr_presence(pair_id)`,
  `CREATE INDEX IF NOT EXISTS idx_ldr_status_pair_id ON ldr_status_updates(pair_id)`,
  `CREATE INDEX IF NOT EXISTS idx_ldr_hugs_pair_id ON ldr_hugs(pair_id)`,
  `CREATE INDEX IF NOT EXISTS idx_ldr_love_meter_pair_id ON ldr_love_meter(pair_id)`,
  `CREATE INDEX IF NOT EXISTS idx_ldr_locations_pair_id ON ldr_locations(pair_id)`,
  `CREATE INDEX IF NOT EXISTS idx_user_extras_user_key ON user_extras(user_id, key)`,
  `CREATE INDEX IF NOT EXISTS idx_chat_messages_pair_id ON chat_messages(pair_id)`,
  `CREATE INDEX IF NOT EXISTS idx_voice_notes_pair_id ON voice_notes(pair_id)`,
  `CREATE INDEX IF NOT EXISTS idx_game_scores_pair_id ON game_scores(pair_id)`,
  `INSERT INTO users (id, username, password_hash, name, role, relationship, pair_id, created_at) VALUES ('user-1', 'Ryo', 'PLACEHOLDER', 'Ahmad Rio Prawiro', 'owner', 'Cowo Ara ❤️', 'pair-1', CURRENT_TIMESTAMP) ON CONFLICT (username) DO NOTHING`,
  `INSERT INTO users (id, username, password_hash, name, role, relationship, pair_id, created_at) VALUES ('user-2', 'Ara', 'PLACEHOLDER', 'Tiara Pertiwi', 'partner', 'Cewe Rio ❤️', 'pair-1', CURRENT_TIMESTAMP) ON CONFLICT (username) DO NOTHING`,
];

async function doInit() {
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.warn("DATABASE_URL is not set, skipping database initialization");
      return;
    }

    for (const stmt of SCHEMA_STATEMENTS) {
      try {
        await query(stmt);
      } catch (err) {
        if (!String(err).includes("already exists")) {
          console.error("Schema statement error:", err);
        }
      }
    }
    console.log("Database initialized successfully");

    await hashSeedPasswords();
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

async function hashSeedPasswords() {
  const users = [
    { id: "user-1", password: process.env.OWNER_PASSWORD || "11122004" },
    { id: "user-2", password: process.env.PARTNER_PASSWORD || "09062004" },
  ];

  for (const user of users) {
    const result = await getOne("SELECT id, password_hash FROM users WHERE id = $1", [user.id]);
    if (!result) continue;

    const currentHash = result.password_hash;
    if (currentHash && /^\$2[aby]\$\d{2}\$/.test(currentHash)) {
      continue;
    }

    const hash = await bcrypt.hash(user.password, 10);
    await query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, user.id]);
    console.log(`Hashed password for ${user.id}`);
  }
}
