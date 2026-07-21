/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { v4 as uuidv4 } from "uuid";
import db from "@/lib/db/index";
import { initializeDatabase } from "@/lib/db/schema";

initializeDatabase();

export async function getMoods(pairId: string) {
  return db.prepare(`
    SELECT id, user_id as userId, mood, note, created_at as createdAt
    FROM moods
    WHERE pair_id = ?
    ORDER BY created_at DESC
    LIMIT 50
  `).all(pairId) as any[];
}

export async function addMood(userId: string, pairId: string, mood: string, note?: string) {
  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO moods (id, user_id, pair_id, mood, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, userId, pairId, mood, note || null, now);

  const notificationId = uuidv4();
  db.prepare(`
    INSERT INTO notifications (id, user_id, pair_id, message, type, read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(notificationId, userId, pairId, `New mood added: ${mood}`, "mood", 0, now);

  return { id, userId, mood, note, createdAt: now };
}

export async function getActivities(pairId: string) {
  return db.prepare(`
    SELECT id, pair_id, title, description, type, date, completed, created_by as createdBy
    FROM activities
    WHERE pair_id = ?
    ORDER BY date DESC
    LIMIT 50
  `).all(pairId) as any[];
}

export async function createActivity(userId: string, pairId: string, title: string, type: string, date: string, description?: string) {
  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO activities (id, pair_id, title, description, type, date, completed, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, pairId, title, description || null, type, date, 0, userId);

  const notificationId = uuidv4();
  db.prepare(`
    INSERT INTO notifications (id, user_id, pair_id, message, type, read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(notificationId, userId, pairId, `New activity created: ${title}`, "activity", 0, now);

  return { id, pair_id: pairId, title, description, type, date, completed: false, createdBy: userId };
}

export async function toggleActivity(userId: string, pairId: string, activityId: string, completed: boolean) {
  db.prepare("UPDATE activities SET completed = ? WHERE id = ? AND pair_id = ?").run(completed ? 1 : 0, activityId, pairId);

  const activity = db.prepare("SELECT * FROM activities WHERE id = ?").get(activityId) as any;
  if (activity) {
    const notificationId = uuidv4();
    db.prepare(`
      INSERT INTO notifications (id, user_id, pair_id, message, type, read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(notificationId, userId, pairId, `${activity.title} marked as ${completed ? "completed" : "incomplete"}`, "activity", 0, new Date().toISOString());
  }

  return { success: true };
}

export async function getGallery(pairId: string) {
  return db.prepare(`
    SELECT id, url, caption, created_at as createdAt, created_by as createdBy
    FROM gallery
    WHERE pair_id = ?
    ORDER BY created_at DESC
  `).all(pairId) as any[];
}

export async function addPhoto(userId: string, pairId: string, url: string, caption?: string) {
  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO gallery (id, pair_id, url, caption, created_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, pairId, url, caption || null, now, userId);

  const notificationId = uuidv4();
  db.prepare(`
    INSERT INTO notifications (id, user_id, pair_id, message, type, read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(notificationId, userId, pairId, "New photo added to gallery", "gallery", 0, now);

  return { id, url, caption, createdAt: now, createdBy: userId };
}

export async function deletePhoto(userId: string, pairId: string, photoId: string) {
  db.prepare("DELETE FROM gallery WHERE id = ? AND pair_id = ?").run(photoId, pairId);
  return { success: true };
}

export async function getCalendarEvents(pairId: string) {
  return db.prepare(`
    SELECT id, title, date, type, description
    FROM calendar_events
    WHERE pair_id = ?
    ORDER BY date ASC
  `).all(pairId) as any[];
}

export async function addCalendarEvent(userId: string, pairId: string, title: string, date: string, type: string, description?: string) {
  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO calendar_events (id, pair_id, title, date, type, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, pairId, title, date, type, description || null, now);

  const notificationId = uuidv4();
  db.prepare(`
    INSERT INTO notifications (id, user_id, pair_id, message, type, read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(notificationId, userId, pairId, `New event: ${title}`, "calendar", 0, now);

  return { id, title, date, type, description };
}

export async function getLetters(pairId: string) {
  return db.prepare(`
    SELECT id, title, content, type, open_date as openDate, created_at as createdAt, created_by as createdBy
    FROM letters
    WHERE pair_id = ?
    ORDER BY created_at DESC
  `).all(pairId) as any[];
}

export async function createLetter(userId: string, pairId: string, letter: { title: string; content: string; type: string; openDate?: string }) {
  const id = uuidv4();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO letters (id, pair_id, title, content, type, open_date, created_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, pairId, letter.title, letter.content, letter.type, letter.openDate || null, now, userId);

  const notificationId = uuidv4();
  db.prepare(`
    INSERT INTO notifications (id, user_id, pair_id, message, type, read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(notificationId, userId, pairId, `New letter: ${letter.title}`, "letter", 0, now);

  return { id, title: letter.title, content: letter.content, type: letter.type, openDate: letter.openDate, createdAt: now, createdBy: userId };
}

export async function getNotifications(userId: string) {
  return db.prepare(`
    SELECT id, message, type, read, created_at as createdAt
    FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 20
  `).all(userId) as any[];
}
