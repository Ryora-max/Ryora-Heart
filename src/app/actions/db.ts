/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { v4 as uuidv4 } from "uuid";
import { query, getOne, getAll, insert as dbInsert, generateId } from "@/lib/db/postgres";
import { initializeDatabase } from "@/lib/db/init";

initializeDatabase();

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

  const notificationId = generateId();
  await query(
    `INSERT INTO notifications (id, user_id, pair_id, message, type, read, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [notificationId, userId, pairId, `New mood added: ${mood}`, "mood", false, now]
  );

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
  const now = new Date().toISOString();

  await query(
    `INSERT INTO activities (id, pair_id, title, description, type, date, completed, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [id, pairId, title, description || null, type, date, false, userId]
  );

  const notificationId = generateId();
  await query(
    `INSERT INTO notifications (id, user_id, pair_id, message, type, read, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [notificationId, userId, pairId, `New activity created: ${title}`, "activity", false, now]
  );

  return { id, pair_id: pairId, title, description, type, date, completed: false, createdBy: userId };
}

export async function toggleActivity(userId: string, pairId: string, activityId: string, completed: boolean) {
  await query(
    "UPDATE activities SET completed = $1 WHERE id = $2 AND pair_id = $3",
    [completed, activityId, pairId]
  );

  const activity = await getOne("SELECT * FROM activities WHERE id = $1", [activityId]);
  if (activity) {
    const notificationId = generateId();
    await query(
      `INSERT INTO notifications (id, user_id, pair_id, message, type, read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [notificationId, userId, pairId, `${activity.title} marked as ${completed ? "completed" : "incomplete"}`, "activity", false, new Date().toISOString()]
    );
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

  const notificationId = generateId();
  await query(
    `INSERT INTO notifications (id, user_id, pair_id, message, type, read, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [notificationId, userId, pairId, "New photo added to gallery", "gallery", false, now]
  );

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

  const notificationId = generateId();
  await query(
    `INSERT INTO notifications (id, user_id, pair_id, message, type, read, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [notificationId, userId, pairId, `New event: ${title}`, "calendar", false, now]
  );

  return { id, title, date, type, description };
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

  const notificationId = generateId();
  await query(
    `INSERT INTO notifications (id, user_id, pair_id, message, type, read, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [notificationId, userId, pairId, `New letter: ${letter.title}`, "letter", false, now]
  );

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
