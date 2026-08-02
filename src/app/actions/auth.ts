/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import { query, getOne, generateId, initializeDatabase } from "@/lib/db";
import { isSupabaseConfigured, selectOne, insertRow, updateRow as supabaseUpdate } from "@/lib/db/supabaseClient";

const useSupabase = isSupabaseConfigured();

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
  try {
    await initializeDatabase();
    let result: any = null;
    if (useSupabase) {
      result = await selectOne("users", { username });
    } else {
      result = await getOne("SELECT * FROM users WHERE username = $1", [username]);
    }
    if (!result) return null;

    const stored = result.password_hash;
    let valid = false;
    if (stored && /^\$2[aby]\$\d{2}\$/.test(stored)) {
      valid = await bcrypt.compare(password, stored);
    } else {
      valid = password === stored;
    }
    if (!valid) return null;

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + SESSION_DURATION).toISOString();
    if (useSupabase) {
      await insertRow("sessions", { id: generateId(), user_id: result.id, token, expires_at: expiresAt });
    } else {
      await query("INSERT INTO sessions (id, user_id, token, expires_at) VALUES ($1, $2, $3, $4)", [generateId(), result.id, token, expiresAt]);
    }

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
  } catch (error) {
    console.error("Login error:", error);
    return null;
  }
}

export async function logout(token: string) {
  if (useSupabase) { try { await import("@/lib/db/supabaseClient").then(m => m.deleteRow("sessions", { token })); } catch {} return; }
  await query("DELETE FROM sessions WHERE token = $1", [token]);
}

export async function getSession(token: string): Promise<Session | null> {
  await initializeDatabase();
  if (useSupabase) {
    const session = await selectOne("sessions", { token });
    if (!session) return null;
    if (new Date(session.expires_at) < new Date()) return null;
    const user = await selectOne("users", { id: session.user_id });
    if (!user) return null;
    return {
      user: { id: user.id, username: user.username, name: user.name, role: user.role, relationship: user.relationship, avatar_url: user.avatar_url || undefined, pair_id: user.pair_id },
      token: session.token,
    };
  }
  const result = await getOne(`
    SELECT s.*, u.id as user_id, u.username, u.name, u.role, u.relationship, u.avatar_url, u.pair_id
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = $1 AND s.expires_at > $2
  `, [token, new Date().toISOString()]);
  if (!result) return null;
  return {
    user: { id: result.user_id, username: result.username, name: result.name, role: result.role, relationship: result.relationship, avatar_url: result.avatar_url || undefined, pair_id: result.pair_id },
    token: result.token,
  };
}

export async function updateProfile(userId: string, data: { name?: string; relationship?: string; avatar_url?: string }) {
  if (useSupabase) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.relationship !== undefined) updateData.relationship = data.relationship;
    if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;
    if (Object.keys(updateData).length === 0) return;
    await supabaseUpdate("users", { id: userId }, updateData);
    return;
  }
  const fields: string[] = []; const values: any[] = [];
  if (data.name !== undefined) { fields.push("name = $" + (values.length + 1)); values.push(data.name); }
  if (data.relationship !== undefined) { fields.push("relationship = $" + (values.length + 1)); values.push(data.relationship); }
  if (data.avatar_url !== undefined) { fields.push("avatar_url = $" + (values.length + 1)); values.push(data.avatar_url); }
  if (fields.length === 0) return;
  values.push(userId);
  await query(`UPDATE users SET ${fields.join(", ")} WHERE id = $${values.length}`, values);
}

export async function updateSettings(userId: string, data: { relationshipStartDate?: string; distance?: string; nextMeetupDate?: string; secretPin?: string }) {
  let pairId: string | undefined;
  if (useSupabase) {
    const user = await selectOne("users", { id: userId });
    if (!user) return;
    pairId = user.pair_id;
    const existing = await selectOne("user_settings", { user_id: userId });
    const updateData: any = {};
    if (data.relationshipStartDate !== undefined) updateData.relationship_start_date = data.relationshipStartDate || null;
    if (data.distance !== undefined) updateData.distance_km = data.distance || null;
    if (data.nextMeetupDate !== undefined) updateData.next_meetup_date = data.nextMeetupDate || null;
    if (data.secretPin !== undefined) updateData.secret_pin = data.secretPin || "0101";
    if (Object.keys(updateData).length === 0) return;
    if (existing) { await supabaseUpdate("user_settings", { user_id: userId }, updateData); }
    else { await insertRow("user_settings", { id: generateId(), user_id: userId, pair_id: pairId, ...updateData }); }
    return;
  }
  const user = await getOne("SELECT pair_id FROM users WHERE id = $1", [userId]);
  if (!user) return;
  pairId = user.pair_id;
  if (data.relationshipStartDate !== undefined || data.distance !== undefined || data.nextMeetupDate !== undefined || data.secretPin !== undefined) {
    const countResult = await getOne("SELECT COUNT(*) as c FROM user_settings WHERE user_id = $1", [userId]);
    const count = countResult?.c || 0;
    if (count === 0) {
      await query(`INSERT INTO user_settings (id, user_id, pair_id, relationship_start_date, distance_km, next_meetup_date, secret_pin) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [generateId(), userId, pairId, data.relationshipStartDate || null, data.distance || null, data.nextMeetupDate || null, data.secretPin || "0101"]);
    } else {
      const fields: string[] = []; const values: any[] = [];
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
  let settings: any = null;
  if (useSupabase) { settings = await selectOne("user_settings", { user_id: userId }); }
  else { settings = await getOne("SELECT * FROM user_settings WHERE user_id = $1", [userId]); }
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
