"use server";

import { getSupabaseServer } from "@/lib/supabase/server";

// Note: login(), logout(), getSession() dihapus — auth sekarang dihandle oleh Supabase Auth
// Lihat: src/lib/supabase/serverClient.ts (getSupabaseUserProfile)
// Lihat: src/app/(auth)/login/page.tsx (signInWithPassword)
// Lihat: src/app/(main)/layout.tsx (verify via supabase.auth.getSession)

export interface User {
  id: string;
  username: string;
  name: string;
  role: "owner" | "partner";
  relationship: string;
  avatar_url?: string;
  pair_id?: string;
}

export async function updateProfile(userId: string, data: { name?: string; relationship?: string; avatar_url?: string }) {
  const supabase = getSupabaseServer();
  const updates: Record<string, unknown> = {};

  if (data.name !== undefined) updates.name = data.name;
  if (data.relationship !== undefined) updates.relationship = data.relationship;
  if (data.avatar_url !== undefined) updates.avatar_url = data.avatar_url;

  if (Object.keys(updates).length === 0) return;

  const { error } = await supabase.from("users").update(updates).eq("id", userId);
  if (error) throw error;
}

export async function updateSettings(userId: string, data: { relationshipStartDate?: string; distanceKm?: string; nextMeetupDate?: string; secretPin?: string }) {
  const supabase = getSupabaseServer();

  if (data.relationshipStartDate === undefined && data.distanceKm === undefined && data.nextMeetupDate === undefined && data.secretPin === undefined) {
    return;
  }

  // Get pair_id for this user
  const { data: user } = await supabase.from("users").select("pair_id").eq("id", userId).maybeSingle();
  if (!user) return;

  const pairId = user.pair_id;

  // Check if settings row exists
  const { data: existing } = await supabase.from("user_settings").select("id").eq("user_id", userId).maybeSingle();

  const updates: Record<string, unknown> = {};
  if (data.relationshipStartDate !== undefined) updates.relationship_start_date = data.relationshipStartDate || null;
  if (data.distanceKm !== undefined) updates.distance_km = data.distanceKm || null;
  if (data.nextMeetupDate !== undefined) updates.next_meetup_date = data.nextMeetupDate || null;
  if (data.secretPin !== undefined) updates.secret_pin = data.secretPin;

  if (existing) {
    const { error } = await supabase.from("user_settings").update(updates).eq("user_id", userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("user_settings").insert({
      id: crypto.randomUUID(),
      user_id: userId,
      pair_id: pairId,
      ...updates,
    });
    if (error) throw error;
  }
}

export async function getUserSettings(userId: string) {
  const supabase = getSupabaseServer();

  // Settings bersifat pair-level (tanggal jadian & PIN dipakai berdua):
  // ambil row milik user, lalu isi field yang kosong dari row partner di pair sama.
  const { data: me } = await supabase
    .from("users")
    .select("pair_id")
    .eq("id", userId)
    .maybeSingle();

  const query = supabase.from("user_settings").select("*");
  const { data: rows, error } = me?.pair_id
    ? await query.eq("pair_id", me.pair_id)
    : await query.eq("user_id", userId);
  if (error) throw error;
  if (!rows || rows.length === 0) return null;

  const own = rows.find((r) => r.user_id === userId);
  const merged = { ...(rows[0] || {}), ...(own || {}) } as Record<string, unknown>;
  // Field yang masih kosong di row sendiri → fallback ke row partner mana pun.
  for (const r of rows) {
    for (const key of ["relationship_start_date", "distance_km", "next_meetup_date", "secret_pin"] as const) {
      if ((merged[key] === null || merged[key] === undefined || merged[key] === "") && r[key] != null && r[key] !== "") {
        merged[key] = r[key];
      }
    }
  }

  const formatDate = (d: string | Date | null | undefined) => {
    if (!d) return "";
    const date = new Date(d);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().split("T")[0];
  };

  return {
    relationshipStartDate: formatDate(merged.relationship_start_date as string | Date | null),
    distanceKm: (merged.distance_km as string) || "",
    nextMeetupDate: formatDate(merged.next_meetup_date as string | Date | null),
    secretPin: (merged.secret_pin as string) || "0101",
  };
}
