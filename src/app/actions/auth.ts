/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { v4 as uuidv4 } from "uuid";
import db from "@/lib/db/index";
import { initializeDatabase } from "@/lib/db/schema";
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
  const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password) as any;
  if (!user) return null;

  const token = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString();

  db.prepare("INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)").run(uuidv4(), user.id, token, expiresAt);

  return {
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      relationship: user.relationship,
      avatar_url: user.avatar_url || undefined,
      pair_id: user.pair_id,
    },
    token,
  };
}

export async function logout(token: string) {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}

export async function getSession(token: string): Promise<Session | null> {
  const session = db.prepare(`
    SELECT s.*, u.id as user_id, u.username, u.name, u.role, u.relationship, u.avatar_url, u.pair_id
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ?
  `).get(token, new Date().toISOString()) as any;

  if (!session) return null;

  return {
    user: {
      id: session.user_id,
      username: session.username,
      name: session.name,
      role: session.role,
      relationship: session.relationship,
      avatar_url: session.avatar_url || undefined,
      pair_id: session.pair_id,
    },
    token: session.token,
  };
}

export async function createJWT(user: User): Promise<string> {
  return jwt.sign({ userId: user.id, pairId: user.pair_id }, JWT_SECRET, { expiresIn: "7d" });
}

export async function verifyJWT(token: string): Promise<User | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(decoded.userId) as any;
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

  if (data.name !== undefined) { fields.push("name = ?"); values.push(data.name); }
  if (data.relationship !== undefined) { fields.push("relationship = ?"); values.push(data.relationship); }
  if (data.avatar_url !== undefined) { fields.push("avatar_url = ?"); values.push(data.avatar_url); }

  if (fields.length === 0) return;

  values.push(userId);
  db.prepare(`UPDATE users SET ${fields.join(", ")} WHERE id = ?`).run(...values);
}

export async function updateSettings(userId: string, data: { relationshipStartDate?: string; distance?: string; nextMeetupDate?: string; secretPin?: string }) {
  const user = db.prepare("SELECT pair_id FROM users WHERE id = ?").get(userId) as any;
  if (!user) return;

  if (data.relationshipStartDate !== undefined || data.distance !== undefined || data.nextMeetupDate !== undefined || data.secretPin !== undefined) {
    const pairId = user.pair_id;
    const count = db.prepare("SELECT COUNT(*) as c FROM user_settings WHERE user_id = ?").get(userId) as { c: number };

    if (count.c === 0) {
      db.prepare(`
        INSERT INTO user_settings (id, user_id, pair_id, relationship_start_date, distance_km, next_meetup_date, secret_pin)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(uuidv4(), userId, pairId, data.relationshipStartDate || null, data.distance || null, data.nextMeetupDate || null, data.secretPin || "0101");
    } else {
      const fields: string[] = [];
      const values: any[] = [];
      if (data.relationshipStartDate !== undefined) { fields.push("relationship_start_date = ?"); values.push(data.relationshipStartDate); }
      if (data.distance !== undefined) { fields.push("distance_km = ?"); values.push(data.distance); }
      if (data.nextMeetupDate !== undefined) { fields.push("next_meetup_date = ?"); values.push(data.nextMeetupDate); }
      if (data.secretPin !== undefined) { fields.push("secret_pin = ?"); values.push(data.secretPin); }
      values.push(userId);
      db.prepare(`UPDATE user_settings SET ${fields.join(", ")} WHERE user_id = ?`).run(...values);
    }
  }
}

export async function getUserSettings(userId: string) {
  const settings = db.prepare("SELECT * FROM user_settings WHERE user_id = ?").get(userId) as any;
  if (!settings) return null;
  return {
    relationshipStartDate: settings.relationship_start_date || "",
    distance: settings.distance_km || "",
    nextMeetupDate: settings.next_meetup_date || "",
    secretPin: settings.secret_pin || "0101",
  };
}
