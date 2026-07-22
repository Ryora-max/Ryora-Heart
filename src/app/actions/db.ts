/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { query, getOne, getAll, generateId } from "@/lib/db/postgres";
import { initializeDatabase } from "@/lib/db/init";

initializeDatabase();

export async function getPartnerId(userId: string, pairId: string): Promise<string | null> {
  const result = await getOne("SELECT id FROM users WHERE pair_id = $1 AND id != $2 LIMIT 1", [pairId, userId]);
  return result?.id || null;
}

async function notifyPartner(userId: string, pairId: string, message: string, type: string) {
  const partnerId = await getPartnerId(userId, pairId);
  if (!partnerId) return;
  const notificationId = generateId();
  await query(
    `INSERT INTO notifications (id, user_id, pair_id, message, type, read, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [notificationId, partnerId, pairId, message, type, false, new Date().toISOString()]
  );
}

export async function getMoods(pairId: string) {
  const result = await getAll(`
    SELECT id, user_id as "userId", mood, note, created_at as "createdAt"
    FROM moods
    WHERE pair_id = $1
    ORDER BY created_at DESC
    LIMIT 50
  `, [pairId]);
  return result;
}

export async function addMood(userId: string, pairId: string, mood: string, note?: string) {
  const id = generateId();
  const now = new Date().toISOString();

  await query(
    `INSERT INTO moods (id, user_id, pair_id, mood, note, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, userId, pairId, mood, note || null, now]
  );

  await notifyPartner(userId, pairId, `New mood added: ${mood}`, "mood");

  return { id, userId, mood, note, createdAt: now };
}

export async function getActivities(pairId: string) {
  const result = await getAll(`
    SELECT id, pair_id, title, description, type, date, completed, created_by as "createdBy"
    FROM activities
    WHERE pair_id = $1
    ORDER BY date DESC
    LIMIT 50
  `, [pairId]);
  return result;
}

export async function createActivity(userId: string, pairId: string, title: string, type: string, date: string, description?: string) {
  const id = generateId();

  await query(
    `INSERT INTO activities (id, pair_id, title, description, type, date, completed, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, pairId, title, description || null, type, date, false, userId]
  );

  await notifyPartner(userId, pairId, `New activity created: ${title}`, "activity");

  return { id, pair_id: pairId, title, description, type, date, completed: false, createdBy: userId };
}

export async function toggleActivity(userId: string, pairId: string, activityId: string, completed: boolean) {
  await query(
    "UPDATE activities SET completed = $1 WHERE id = $2 AND pair_id = $3",
    [completed, activityId, pairId]
  );

  const activity = await getOne("SELECT * FROM activities WHERE id = $1", [activityId]);
  if (activity) {
    await notifyPartner(userId, pairId, `${activity.title} marked as ${completed ? "completed" : "incomplete"}`, "activity");
  }

  return { success: true };
}

export async function updateActivity(userId: string, pairId: string, activityId: string, title?: string, description?: string) {
  const updates: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (title !== undefined) { updates.push(`title = $${idx++}`); values.push(title); }
  if (description !== undefined) { updates.push(`description = $${idx++}`); values.push(description || null); }

  if (updates.length === 0) return { success: true };

  values.push(activityId, pairId);
  await query(`UPDATE activities SET ${updates.join(", ")} WHERE id = $${idx++} AND pair_id = $${idx}`, values);

  const activity = await getOne("SELECT * FROM activities WHERE id = $1", [activityId]);
  if (activity && title) {
    await notifyPartner(userId, pairId, `Activity updated: ${title}`, "activity");
  }

  return { success: true };
}

export async function deleteActivity(userId: string, pairId: string, activityId: string) {
  const activity = await getOne("SELECT * FROM activities WHERE id = $1", [activityId]);
  await query("DELETE FROM activities WHERE id = $1 AND pair_id = $2", [activityId, pairId]);
  if (activity) {
    await notifyPartner(userId, pairId, `Activity deleted: ${activity.title}`, "activity");
  }
  return { success: true };
}

export async function getGallery(pairId: string) {
  const result = await getAll(`
    SELECT id, url, caption, created_at as "createdAt", created_by as "createdBy"
    FROM gallery
    WHERE pair_id = $1
    ORDER BY created_at DESC
  `, [pairId]);
  return result;
}

export async function addPhoto(userId: string, pairId: string, url: string, caption?: string) {
  const id = generateId();
  const now = new Date().toISOString();

  await query(
    `INSERT INTO gallery (id, pair_id, url, caption, created_at, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, pairId, url, caption || null, now, userId]
  );

  await notifyPartner(userId, pairId, "New photo added to gallery", "gallery");

  return { id, url, caption, createdAt: now, createdBy: userId };
}

export async function deletePhoto(userId: string, pairId: string, photoId: string) {
  await query("DELETE FROM gallery WHERE id = $1 AND pair_id = $2", [photoId, pairId]);
  return { success: true };
}

export async function getCalendarEvents(pairId: string) {
  const result = await getAll(`
    SELECT id, title, date, type, description
    FROM calendar_events
    WHERE pair_id = $1
    ORDER BY date ASC
  `, [pairId]);
  return result;
}

export async function addCalendarEvent(userId: string, pairId: string, title: string, date: string, type: string, description?: string) {
  const id = generateId();
  const now = new Date().toISOString();

  await query(
    `INSERT INTO calendar_events (id, pair_id, title, date, type, description, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, pairId, title, date, type, description || null, now]
  );

  await notifyPartner(userId, pairId, `New event: ${title}`, "calendar");

  return { id, title, date, type, description };
}

export async function updateCalendarEvent(userId: string, pairId: string, eventId: string, data: { title?: string; date?: string; type?: string; description?: string }) {
  const event = await getOne("SELECT * FROM calendar_events WHERE id = $1 AND pair_id = $2", [eventId, pairId]);
  if (!event) return null;

  const fields: string[] = [];
  const values: any[] = [];

  if (data.title !== undefined) { fields.push("title = $" + (values.length + 1)); values.push(data.title); }
  if (data.date !== undefined) { fields.push("date = $" + (values.length + 1)); values.push(data.date); }
  if (data.type !== undefined) { fields.push("type = $" + (values.length + 1)); values.push(data.type); }
  if (data.description !== undefined) { fields.push("description = $" + (values.length + 1)); values.push(data.description); }

  if (fields.length === 0) return event;

  values.push(eventId);
  await query(`UPDATE calendar_events SET ${fields.join(", ")} WHERE id = $${values.length}`, values);

  await notifyPartner(userId, pairId, `Event updated: ${data.title || event.title}`, "calendar");

  return await getOne("SELECT * FROM calendar_events WHERE id = $1", [eventId]);
}

export async function deleteCalendarEvent(userId: string, pairId: string, eventId: string) {
  const event = await getOne("SELECT * FROM calendar_events WHERE id = $1 AND pair_id = $2", [eventId, pairId]);
  if (!event) return false;

  await query("DELETE FROM calendar_events WHERE id = $1 AND pair_id = $2", [eventId, pairId]);

  await notifyPartner(userId, pairId, `Event deleted: ${event.title}`, "calendar");

  return true;
}

export async function getLetters(pairId: string) {
  const result = await getAll(`
    SELECT id, title, content, type, open_date as "openDate", created_at as "createdAt", created_by as "createdBy"
    FROM letters
    WHERE pair_id = $1
    ORDER BY created_at DESC
  `, [pairId]);
  return result;
}

export async function createLetter(userId: string, pairId: string, letter: { title: string; content: string; type: string; openDate?: string }) {
  const id = generateId();
  const now = new Date().toISOString();

  await query(
    `INSERT INTO letters (id, pair_id, title, content, type, open_date, created_at, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, pairId, letter.title, letter.content, letter.type, letter.openDate || null, now, userId]
  );

  await notifyPartner(userId, pairId, `New letter: ${letter.title}`, "letter");

  return { id, title: letter.title, content: letter.content, type: letter.type, openDate: letter.openDate, createdAt: now, createdBy: userId };
}

export async function getNotifications(userId: string) {
  const result = await getAll(`
    SELECT id, message, type, read, created_at as "createdAt"
    FROM notifications
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 20
  `, [userId]);
  return result;
}

export async function markNotificationsAsRead(userId: string) {
  await query("UPDATE notifications SET read = true WHERE user_id = $1 AND read = false", [userId]);
  return { success: true };
}

export async function deleteLetter(userId: string, pairId: string, letterId: string) {
  await query("DELETE FROM letters WHERE id = $1 AND pair_id = $2", [letterId, pairId]);
  return { success: true };
}

export async function updatePresence(userId: string, pairId: string, status: string) {
  const existing = await getOne("SELECT id FROM ldr_presence WHERE user_id = $1", [userId]);
  if (existing) {
    await query("UPDATE ldr_presence SET status = $1, last_seen = $2 WHERE user_id = $3", [status, new Date().toISOString(), userId]);
  } else {
    await query("INSERT INTO ldr_presence (id, user_id, pair_id, status, last_seen) VALUES ($1, $2, $3, $4, $5)", [generateId(), userId, pairId, status, new Date().toISOString()]);
  }
  return { success: true };
}

export async function getPresence(pairId: string) {
  const result = await getAll(`
    SELECT user_id, status, last_seen FROM ldr_presence WHERE pair_id = $1
  `, [pairId]);
  return result;
}

export async function addStatusUpdate(userId: string, pairId: string, message: string, emoji?: string) {
  const id = generateId();
  const now = new Date().toISOString();
  await query(
    `INSERT INTO ldr_status_updates (id, user_id, pair_id, message, emoji, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, userId, pairId, message, emoji || "💬", now]
  );

  await notifyPartner(userId, pairId, `Status update: ${message}`, "status");

  return { id, message, emoji: emoji || "💬", createdAt: now };
}

export async function getStatusUpdates(pairId: string) {
  const result = await getAll(`
    SELECT id, user_id, message, emoji, created_at as "createdAt"
    FROM ldr_status_updates
    WHERE pair_id = $1
    ORDER BY created_at DESC
    LIMIT 50
  `, [pairId]);
  return result;
}

export async function sendHug(userId: string, pairId: string, receiverId: string, message?: string) {
  const id = generateId();
  const now = new Date().toISOString();
  const hugMessage = message || "Sent a virtual hug 🤗";

  await query(
    `INSERT INTO ldr_hugs (id, sender_id, receiver_id, pair_id, message, emoji, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, userId, receiverId, pairId, hugMessage, "🤗", now]
  );

  const notificationId = generateId();
  await query(
    `INSERT INTO notifications (id, user_id, pair_id, message, type, read, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [notificationId, receiverId, pairId, `Virtual hug from your partner: ${hugMessage}`, "hug", false, now]
  );

  return { id, message: hugMessage, emoji: "🤗", createdAt: now };
}

export async function getHugs(pairId: string) {
  const result = await getAll(`
    SELECT id, sender_id, receiver_id, message, emoji, created_at as "createdAt"
    FROM ldr_hugs
    WHERE pair_id = $1
    ORDER BY created_at DESC
    LIMIT 20
  `, [pairId]);
  return result;
}

export async function updateLoveMeter(userId: string, pairId: string, percentage: number) {
  const id = generateId();
  const now = new Date().toISOString();
  await query(
    `INSERT INTO ldr_love_meter (id, user_id, pair_id, percentage, created_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [id, userId, pairId, percentage, now]
  );

  await notifyPartner(userId, pairId, `Love meter updated: ${percentage}%`, "love_meter");

  return { id, percentage, createdAt: now };
}

export async function getLoveMeter(pairId: string) {
  const result = await getAll(`
    SELECT user_id, percentage, created_at as "createdAt"
    FROM ldr_love_meter
    WHERE pair_id = $1
    ORDER BY created_at DESC
    LIMIT 10
  `, [pairId]);
  return result;
}

export async function addLocation(userId: string, pairId: string, place: string, note?: string) {
  const id = generateId();
  const now = new Date().toISOString();
  await query(
    `INSERT INTO ldr_locations (id, user_id, pair_id, place, note, created_at)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [id, userId, pairId, place, note || null, now]
  );
  await notifyPartner(userId, pairId, `Location update: ${place}`, "location");
  return { id, userId, place, note, createdAt: now };
}

export async function getLocations(pairId: string) {
  const result = await getAll(`
    SELECT id, user_id, place, note, created_at as "createdAt"
    FROM ldr_locations
    WHERE pair_id = $1
    ORDER BY created_at DESC
    LIMIT 20
  `, [pairId]);
  return result;
}
