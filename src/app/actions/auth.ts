/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { v4 as uuidv4 } from "uuid";
import { query, getOne, generateId } from "@/lib/db/postgres";
import { initializeDatabase } from "@/lib/db/init";
import jwt from "jsonwebtoken";

initializeDatabase();

const JWT_SECRET = process.env.JWT_SECRET || "ryora-secret-key-change-in-production";
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000;

export interface User {
  id: string;
  username: string;
  name: string;
  role: "owner" | "partner";
  relationship: string;
  avatar_url?: string;
  pair_id?: string;
}

export interface Session {
  user: User;
  token: string;
}

export async function login(username: string, password: string): Promise<Session | null> {
  const result = await getOne("SELECT * FROM users WHERE username = $1 AND password = $2", [username, password]);
  if (!result) return null;

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString();

  await query(
    "INSERT INTO sessions (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)",
    [generateId(), result.id, token, expiresAt]
  );

  return {
    user: {
      id: result.id,
      username: result.username,
      name: result.name,
      role: result.role,
      relationship: result.relationship,
      avatar_url: result.avatar_url || undefined,
      pair_id: result.pair_id,
    },
    token,
  };
}

export async function logout(token: string) {
  await query("DELETE FROM sessions WHERE token = $1", [token]);
}

export async function getSession(token: string): Promise<Session | null> {
  const result = await getOne(`
    SELECT s.*, u.id as user_id, u.username, u.name, u.role, u.relationship, u.avatar_url, u.pair_id
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = $1 AND s.expires_at > $2
  `, [token, new Date().toISOString()]);

  if (!result) return null;

  return {
    user: {
      id: result.user_id,
      username: result.username,
      name: result.name,
      role: result.role,
      relationship: result.relationship,
      avatar_url: result.avatar_url || undefined,
      pair_id: result.pair_id,
    },
    token: result.token,
  };
}

export async function createJWT(user: User): Promise<string> {
  return jwt.sign({ userId: user.id, pairId: user.pair_id }, JWT_SECRET, { expiresIn: "7d" });
}

export async function verifyJWT(token: string): Promise<User | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await getOne("SELECT * FROM users WHERE id = $1", [decoded.userId]);
    if (!user) return null;
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      relationship: user.relationship,
      avatar_url: user.avatar_url || undefined,
      pair_id: user.pair_id,
    };
  } catch {
    return null;
  }
}

export async function updateProfile(userId: string, data: { name?: string; relationship?: string; avatar_url?: string }) {
  const fields: string[] = [];
  const values: any[] = [];

  if (data.name !== undefined) { fields.push("name = $" + (values.length + 1)); values.push(data.name); }
  if (data.relationship !== undefined) { fields.push("relationship = $" + (values.length + 1)); values.push(data.relationship); }
  if (data.avatar_url !== undefined) { fields.push("avatar_url = $" + (values.length + 1)); values.push(data.avatar_url); }

  if (fields.length === 0) return;

  values.push(userId);
  await query(`UPDATE users SET ${fields.join(", ")} WHERE id = $${values.length}`, values);
}

export async function updateSettings(userId: string, data: { relationshipStartDate?: string; distance?: string; nextMeetupDate?: string; secretPin?: string }) {
  const user = await getOne("SELECT pair_id FROM users WHERE id = $1", [userId]);
  if (!user) return;

  if (data.relationshipStartDate !== undefined || data.distance !== undefined || data.nextMeetupDate !== undefined || data.secretPin !== undefined) {
    const pairId = user.pair_id;
    const countResult = await getOne("SELECT COUNT(*) as c FROM user_settings WHERE user_id = $1", [userId]);
    const count = countResult?.c || 0;

    if (count === 0) {
      await query(
        `INSERT INTO user_settings (id, user_id, pair_id, relationship_start_date, distance_km, next_meetup_date, secret_pin)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [generateId(), userId, pairId, data.relationshipStartDate || null, data.distance || null, data.nextMeetupDate || null, data.secretPin || "0101"]
      );
    } else {
      const fields: string[] = [];
      const values: any[] = [];
      if (data.relationshipStartDate !== undefined) { fields.push("relationship_start_date = $" + (values.length + 1)); values.push(data.relationshipStartDate); }
      if (data.distance !== undefined) { fields.push("distance_km = $" + (values.length + 1)); values.push(data.distance); }
      if (data.nextMeetupDate !== undefined) { fields.push("next_meetup_date = $" + (values.length + 1)); values.push(data.nextMeetupDate); }
      if (data.secretPin !== undefined) { fields.push("secret_pin = $" + (values.length + 1)); values.push(data.secretPin); }
      values.push(userId);
      await query(`UPDATE user_settings SET ${fields.join(", ")} WHERE user_id = $${values.length}`, values);
    }
  }
}

export async function getUserSettings(userId: string) {
  const settings = await getOne("SELECT * FROM user_settings WHERE user_id = $1", [userId]);
  if (!settings) return null;
  const formatDate = (d: string | Date | null) => {
    if (!d) return "";
    const date = new Date(d);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  };
  return {
    relationshipStartDate: formatDate(settings.relationship_start_date),
    distance: settings.distance_km || "",
    nextMeetupDate: formatDate(settings.next_meetup_date),
    secretPin: settings.secret_pin || "0101",
  };
}
