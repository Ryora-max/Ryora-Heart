import { query } from "./postgres";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

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
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}
