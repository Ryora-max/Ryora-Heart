import { Pool } from "pg";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set");
    }

    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

export async function query(text: string, params?: any[]) {
  const pool = getPool();
  try {
    return await pool.query(text, params);
  } catch (error) {
    console.error("Database query error:", error);
    throw error;
  }
}

export async function getOne(text: string, params?: any[]) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

export async function getAll(text: string, params?: any[]) {
  const result = await query(text, params);
  return result.rows;
}

export async function insert(text: string, params?: any[]) {
  const result = await query(text, params);
  return result.rows[0];
}

export async function update(text: string, params?: any[]) {
  const result = await query(text, params);
  return result.rows[0];
}

export async function remove(text: string, params?: any[]) {
  const result = await query(text, params);
  return result.rows;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
