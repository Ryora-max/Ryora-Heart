/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { getSupabaseServer } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";

// Note: initializeDatabase() dari lib/db/init.ts TIDAK dipanggil lagi di sini.
// Table creation sekarang dihandle via Supabase SQL migrations.
// lib/db/init.ts masih dipanggil di actions/auth.ts untuk backward compatibility.

// ─── Helpers ──────────────────────────────────────────────────────────────

function mapMood(r: any) {
  return {
    id: r.id,
    userId: r.user_id,
    mood: r.mood,
    note: r.note || undefined,
    createdAt: r.created_at,
  };
}

function mapActivity(r: any) {
  return {
    id: r.id,
    pair_id: r.pair_id,
    title: r.title,
    description: r.description || undefined,
    type: r.type,
    date: r.date,
    completed: r.completed,
    createdBy: r.created_by,
  };
}

function mapGallery(r: any) {
  return {
    id: r.id,
    url: r.url,
    caption: r.caption || undefined,
    createdAt: r.created_at,
    createdBy: r.created_by,
  };
}

function mapCalendarEvent(r: any) {
  return {
    id: r.id,
    title: r.title,
    date: r.date,
    type: r.type,
    description: r.description || undefined,
  };
}

function mapLetter(r: any) {
  return {
    id: r.id,
    title: r.title,
    content: r.content,
    type: r.type,
    openDate: r.open_date || undefined,
    createdAt: r.created_at,
    createdBy: r.created_by,
  };
}

function mapNotification(r: any) {
  return {
    id: r.id,
    message: r.message,
    type: r.type,
    read: r.read,
    createdAt: r.created_at,
  };
}

function mapHug(r: any) {
  return {
    id: r.id,
    senderId: r.sender_id,
    receiverId: r.receiver_id,
    message: r.message,
    emoji: r.emoji,
    createdAt: r.created_at,
  };
}

function mapLoveMeter(r: any) {
  return {
    userId: r.user_id,
    percentage: r.percentage,
    createdAt: r.created_at,
  };
}

function mapLocation(r: any) {
  return {
    id: r.id,
    userId: r.user_id,
    place: r.place,
    note: r.note || undefined,
    createdAt: r.created_at,
  };
}

function mapStatusUpdate(r: any) {
  return {
    id: r.id,
    userId: r.user_id,
    message: r.message,
    emoji: r.emoji,
    createdAt: r.created_at,
  };
}

function mapPresence(r: any) {
  return {
    user_id: r.user_id,
    status: r.status,
    last_seen: r.last_seen,
  };
}

function genId(): string {
  return crypto.randomUUID();
}

// ─── Partner / Notifications ──────────────────────────────────────────────

export async function getPartnerId(userId: string, pairId: string): Promise<string | null> {
  const supabase = getSupabaseServer();
  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("pair_id", pairId)
    .neq("id", userId)
    .limit(1)
    .maybeSingle();
  return data?.id || null;
}

async function notifyPartner(supabase: SupabaseClient, userId: string, pairId: string, message: string, type: string) {
  const partnerId = await getPartnerId(userId, pairId);
  if (!partnerId) return;
  await supabase.from("notifications").insert({
    id: genId(),
    user_id: partnerId,
    pair_id: pairId,
    message,
    type,
    read: false,
    created_at: new Date().toISOString(),
  });
}

// ─── Moods ────────────────────────────────────────────────────────────────

export async function getMoods(pairId: string) {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("moods")
    .select("*")
    .eq("pair_id", pairId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []).map(mapMood);
}

export async function addMood(userId: string, pairId: string, mood: string, note?: string) {
  const supabase = getSupabaseServer();
  const now = new Date().toISOString();
  const id = genId();

  const { error } = await supabase.from("moods").insert({
    id,
    user_id: userId,
    pair_id: pairId,
    mood,
    note: note || null,
    created_at: now,
  });
  if (error) throw error;

  await notifyPartner(supabase, userId, pairId, `New mood added: ${mood}`, "mood");

  return { id, userId, mood, note, createdAt: now };
}

// ─── Activities ───────────────────────────────────────────────────────────

export async function getActivities(pairId: string) {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("pair_id", pairId)
    .order("date", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []).map(mapActivity);
}

export async function createActivity(userId: string, pairId: string, title: string, type: string, date: string, description?: string) {
  const supabase = getSupabaseServer();
  const id = genId();

  const { error } = await supabase.from("activities").insert({
    id,
    pair_id: pairId,
    title,
    description: description || null,
    type,
    date,
    completed: false,
    created_by: userId,
  });
  if (error) throw error;

  await notifyPartner(supabase, userId, pairId, `New activity created: ${title}`, "activity");

  return { id, pair_id: pairId, title, description, type, date, completed: false, createdBy: userId };
}

export async function toggleActivity(userId: string, pairId: string, activityId: string, completed: boolean) {
  const supabase = getSupabaseServer();
  const { error } = await supabase
    .from("activities")
    .update({ completed })
    .eq("id", activityId)
    .eq("pair_id", pairId);
  if (error) throw error;

  const { data: activity } = await supabase.from("activities").select("*").eq("id", activityId).maybeSingle();
  if (activity) {
    await notifyPartner(supabase, userId, pairId, `${activity.title} marked as ${completed ? "completed" : "incomplete"}`, "activity");
  }

  return { success: true };
}

export async function updateActivity(userId: string, pairId: string, activityId: string, title?: string, description?: string) {
  const supabase = getSupabaseServer();
  const updates: Record<string, unknown> = {};
  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description || null;

  if (Object.keys(updates).length === 0) return { success: true };

  const { error } = await supabase.from("activities").update(updates).eq("id", activityId).eq("pair_id", pairId);
  if (error) throw error;

  if (title) {
    await notifyPartner(supabase, userId, pairId, `Activity updated: ${title}`, "activity");
  }

  return { success: true };
}

export async function deleteActivity(userId: string, pairId: string, activityId: string) {
  const supabase = getSupabaseServer();
  const { data: activity } = await supabase.from("activities").select("*").eq("id", activityId).maybeSingle();

  const { error } = await supabase.from("activities").delete().eq("id", activityId).eq("pair_id", pairId);
  if (error) throw error;

  if (activity) {
    await notifyPartner(supabase, userId, pairId, `Activity deleted: ${activity.title}`, "activity");
  }

  return { success: true };
}

// ─── Gallery ──────────────────────────────────────────────────────────────

export async function getGallery(pairId: string) {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("gallery")
    .select("*")
    .eq("pair_id", pairId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapGallery);
}

export async function addPhoto(userId: string, pairId: string, url: string, caption?: string) {
  const supabase = getSupabaseServer();
  const id = genId();
  const now = new Date().toISOString();

  const { error } = await supabase.from("gallery").insert({
    id,
    pair_id: pairId,
    url,
    caption: caption || null,
    created_at: now,
    created_by: userId,
  });
  if (error) throw error;

  await notifyPartner(supabase, userId, pairId, "New photo added to gallery", "gallery");

  return { id, url, caption, createdAt: now, createdBy: userId };
}

export async function deletePhoto(userId: string, pairId: string, photoId: string) {
  const supabase = getSupabaseServer();
  const { data: photo } = await supabase.from("gallery").select("url").eq("id", photoId).eq("pair_id", pairId).maybeSingle();

  const { error } = await supabase.from("gallery").delete().eq("id", photoId).eq("pair_id", pairId);
  if (error) throw error;

  if (photo?.url && photo.url.includes("/gallery/")) {
    try {
      const { deleteFromStorage } = await import("@/lib/supabase/upload");
      await deleteFromStorage(photo.url);
    } catch {
      /* ignore — cleanup non-kritis */
    }
  }

  return { success: true };
}

// ─── Calendar Events ──────────────────────────────────────────────────────

export async function getCalendarEvents(pairId: string) {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("pair_id", pairId)
    .order("date", { ascending: true });
  if (error) throw error;
  return (data || []).map(mapCalendarEvent);
}

export async function addCalendarEvent(userId: string, pairId: string, title: string, date: string, type: string, description?: string) {
  const supabase = getSupabaseServer();
  const id = genId();
  const now = new Date().toISOString();

  const { error } = await supabase.from("calendar_events").insert({
    id,
    pair_id: pairId,
    title,
    date,
    type,
    description: description || null,
    created_at: now,
  });
  if (error) throw error;

  await notifyPartner(supabase, userId, pairId, `New event: ${title}`, "calendar");

  return { id, title, date, type, description };
}

export async function updateCalendarEvent(userId: string, pairId: string, eventId: string, data: { title?: string; date?: string; type?: string; description?: string }) {
  const supabase = getSupabaseServer();
  const { data: event } = await supabase.from("calendar_events").select("*").eq("id", eventId).eq("pair_id", pairId).maybeSingle();
  if (!event) return null;

  const updates: Record<string, unknown> = {};
  if (data.title !== undefined) updates.title = data.title;
  if (data.date !== undefined) updates.date = data.date;
  if (data.type !== undefined) updates.type = data.type;
  if (data.description !== undefined) updates.description = data.description;

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from("calendar_events").update(updates).eq("id", eventId);
    if (error) throw error;
  }

  await notifyPartner(supabase, userId, pairId, `Event updated: ${data.title || event.title}`, "calendar");

  const { data: updated } = await supabase.from("calendar_events").select("*").eq("id", eventId).maybeSingle();
  return updated ? mapCalendarEvent(updated) : null;
}

export async function deleteCalendarEvent(userId: string, pairId: string, eventId: string) {
  const supabase = getSupabaseServer();
  const { data: event } = await supabase.from("calendar_events").select("*").eq("id", eventId).eq("pair_id", pairId).maybeSingle();
  if (!event) return false;

  const { error } = await supabase.from("calendar_events").delete().eq("id", eventId).eq("pair_id", pairId);
  if (error) throw error;

  await notifyPartner(supabase, userId, pairId, `Event deleted: ${event.title}`, "calendar");

  return true;
}

// ─── Letters ──────────────────────────────────────────────────────────────

export async function getLetters(pairId: string) {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("letters")
    .select("*")
    .eq("pair_id", pairId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapLetter);
}

export async function createLetter(userId: string, pairId: string, letter: { title: string; content: string; type: string; openDate?: string }) {
  const supabase = getSupabaseServer();
  const id = genId();
  const now = new Date().toISOString();

  const { error } = await supabase.from("letters").insert({
    id,
    pair_id: pairId,
    title: letter.title,
    content: letter.content,
    type: letter.type,
    open_date: letter.openDate || null,
    created_at: now,
    created_by: userId,
  });
  if (error) throw error;

  await notifyPartner(supabase, userId, pairId, `New letter: ${letter.title}`, "letter");

  return { id, title: letter.title, content: letter.content, type: letter.type, openDate: letter.openDate, createdAt: now, createdBy: userId };
}

export async function deleteLetter(userId: string, pairId: string, letterId: string) {
  const supabase = getSupabaseServer();
  const { error } = await supabase.from("letters").delete().eq("id", letterId).eq("pair_id", pairId);
  if (error) throw error;
  return { success: true };
}

// ─── Notifications ────────────────────────────────────────────────────────

export async function getNotifications(userId: string) {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data || []).map(mapNotification);
}

export async function markNotificationsAsRead(userId: string) {
  const supabase = getSupabaseServer();
  const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
  if (error) throw error;
  return { success: true };
}

// ─── Presence ─────────────────────────────────────────────────────────────

export async function updatePresence(userId: string, pairId: string, status: string) {
  const supabase = getSupabaseServer();
  const now = new Date().toISOString();

  const { data: existing } = await supabase.from("ldr_presence").select("id").eq("user_id", userId).maybeSingle();

  if (existing) {
    const { error } = await supabase.from("ldr_presence").update({ status, last_seen: now }).eq("user_id", userId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("ldr_presence").insert({
      id: genId(),
      user_id: userId,
      pair_id: pairId,
      status,
      last_seen: now,
    });
    if (error) throw error;
  }
  return { success: true };
}

export async function getPresence(pairId: string) {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("ldr_presence")
    .select("user_id, status, last_seen")
    .eq("pair_id", pairId);
  if (error) throw error;
  return (data || []).map(mapPresence);
}

// ─── Status Updates ───────────────────────────────────────────────────────

export async function addStatusUpdate(userId: string, pairId: string, message: string, emoji?: string) {
  const supabase = getSupabaseServer();
  const id = genId();
  const now = new Date().toISOString();

  const { error } = await supabase.from("ldr_status_updates").insert({
    id,
    user_id: userId,
    pair_id: pairId,
    message,
    emoji: emoji || "💬",
    created_at: now,
  });
  if (error) throw error;

  await notifyPartner(supabase, userId, pairId, `Status update: ${message}`, "status");

  return { id, message, emoji: emoji || "💬", createdAt: now };
}

export async function getStatusUpdates(pairId: string) {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("ldr_status_updates")
    .select("*")
    .eq("pair_id", pairId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []).map(mapStatusUpdate);
}

// ─── Hugs ─────────────────────────────────────────────────────────────────

export async function sendHug(userId: string, pairId: string, receiverId: string, message?: string) {
  const supabase = getSupabaseServer();
  const id = genId();
  const now = new Date().toISOString();
  const hugMessage = message || "Sent a virtual hug 🤗";

  const { error } = await supabase.from("ldr_hugs").insert({
    id,
    sender_id: userId,
    receiver_id: receiverId,
    pair_id: pairId,
    message: hugMessage,
    emoji: "🤗",
    created_at: now,
  });
  if (error) throw error;

  // Insert notification for receiver
  await supabase.from("notifications").insert({
    id: genId(),
    user_id: receiverId,
    pair_id: pairId,
    message: `Virtual hug from your partner: ${hugMessage}`,
    type: "hug",
    read: false,
    created_at: now,
  });

  return { id, message: hugMessage, emoji: "🤗", createdAt: now };
}

export async function getHugs(pairId: string) {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("ldr_hugs")
    .select("*")
    .eq("pair_id", pairId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data || []).map(mapHug);
}

// ─── Love Meter ───────────────────────────────────────────────────────────

export async function updateLoveMeter(userId: string, pairId: string, percentage: number) {
  const supabase = getSupabaseServer();
  const id = genId();
  const now = new Date().toISOString();

  const { error } = await supabase.from("ldr_love_meter").insert({
    id,
    user_id: userId,
    pair_id: pairId,
    percentage,
    created_at: now,
  });
  if (error) throw error;

  await notifyPartner(supabase, userId, pairId, `Love meter updated: ${percentage}%`, "love_meter");

  return { id, percentage, createdAt: now };
}

export async function getLoveMeter(pairId: string) {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("ldr_love_meter")
    .select("*")
    .eq("pair_id", pairId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data || []).map(mapLoveMeter);
}

// ─── Locations ────────────────────────────────────────────────────────────

export async function addLocation(userId: string, pairId: string, place: string, note?: string) {
  const supabase = getSupabaseServer();
  const id = genId();
  const now = new Date().toISOString();

  const { error } = await supabase.from("ldr_locations").insert({
    id,
    user_id: userId,
    pair_id: pairId,
    place,
    note: note || null,
    created_at: now,
  });
  if (error) throw error;

  await notifyPartner(supabase, userId, pairId, `Location update: ${place}`, "location");

  return { id, userId, place, note, createdAt: now };
}

export async function getLocations(pairId: string) {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("ldr_locations")
    .select("*")
    .eq("pair_id", pairId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw error;
  return (data || []).map(mapLocation);
}

// ─── User Extras ──────────────────────────────────────────────────────────

export async function getUserExtra(userId: string, key: string) {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase
    .from("user_extras")
    .select("value")
    .eq("user_id", userId)
    .eq("key", key)
    .maybeSingle();
  if (error) throw error;
  return data?.value || null;
}

export async function setUserExtra(userId: string, pairId: string, key: string, value: string) {
  const supabase = getSupabaseServer();
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("user_extras")
    .select("id")
    .eq("user_id", userId)
    .eq("key", key)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from("user_extras").update({ value, updated_at: now }).eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("user_extras").insert({
      id: genId(),
      user_id: userId,
      pair_id: pairId,
      key,
      value,
      created_at: now,
      updated_at: now,
    });
    if (error) throw error;
  }
  return { success: true };
}

// ─── Achievements ─────────────────────────────────────────────────────────

export async function getAchievements(pairId: string) {
  const supabase = getSupabaseServer();

  const [{ count: galleryCount }, { count: letterCount }, { count: vcCount }, { count: milestoneCount }] = await Promise.all([
    supabase.from("gallery").select("*", { count: "exact", head: true }).eq("pair_id", pairId),
    supabase.from("letters").select("*", { count: "exact", head: true }).eq("pair_id", pairId).in("type", ["love_letter", "open_when"]),
    supabase.from("calendar_events").select("*", { count: "exact", head: true }).eq("pair_id", pairId).eq("type", "vc"),
    supabase.from("activities").select("*", { count: "exact", head: true }).eq("pair_id", pairId).eq("type", "milestone"),
  ]);

  const { data: settings } = await supabase
    .from("user_settings")
    .select("relationship_start_date, next_meetup_date")
    .eq("pair_id", pairId)
    .limit(1)
    .maybeSingle();

  const startDate = settings?.relationship_start_date ? new Date(settings.relationship_start_date) : new Date("2023-01-01");
  const daysTogether = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const meetupPassed = settings?.next_meetup_date ? new Date(settings.next_meetup_date) < new Date() : false;

  return {
    galleryCount: galleryCount || 0,
    letterCount: letterCount || 0,
    vcCount: vcCount || 0,
    daysTogether,
    meetupPassed,
    milestoneCount: milestoneCount || 0,
  };
}
