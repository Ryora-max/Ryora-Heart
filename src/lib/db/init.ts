import { query, getOne } from "./postgres";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import bcrypt from "bcryptjs";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function initializeDatabase() {
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      console.warn("DATABASE_URL is not set, skipping database initialization");
      return;
    }

    const schema = readFileSync(join(__dirname, "schema-postgres.sql"), "utf-8");
    await query(schema);
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
    const result = await getOne("SELECT id FROM users WHERE id = $1", [user.id]);
    if (result) {
      const hash = await bcrypt.hash(user.password, 10);
      await query("UPDATE users SET password_hash = $1 WHERE id = $2", [hash, user.id]);
      console.log(`Hashed password for ${user.id}`);
    }
  }
}
