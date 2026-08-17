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

export async function updateSettings(userId: string, data: { relationshipStartDate?: string; distance?: string; nextMeetupDate?: string; secretPin?: string }) {
  const supabase = getSupabaseServer();

  if (data.relationshipStartDate === undefined && data.distance === undefined && data.nextMeetupDate === undefined && data.secretPin === undefined) {
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
  if (data.distance !== undefined) updates.distance_km = data.distance || null;
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
  const { data: settings, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
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
