/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { query, getOne, getAll, generateId, initializeDatabase } from "@/lib/db";
import { isSupabaseConfigured, select, selectOne, insertRow, updateRow, deleteRow } from "@/lib/db/supabaseClient";

initializeDatabase();

const useSupabase = isSupabaseConfigured();

export async function getPartnerId(userId: string, pairId: string): Promise<string | null> {
  if (useSupabase) {
    const result = await select("users", { pair_id: pairId });
    const partner = result.find((u: any) => u.id !== userId);
    return partner?.id || null;
  }
  const result = await getOne("SELECT id FROM users WHERE pair_id = $1 AND id != $2 LIMIT 1", [pairId, userId]);
  return result?.id || null;
}

async function notifyPartner(userId: string, pairId: string, message: string, type: string) {
  const partnerId = await getPartnerId(userId, pairId);
  if (!partnerId) return;
  if (useSupabase) {
    await insertRow("notifications", { id: generateId(), user_id: partnerId, pair_id: pairId, message, type, read: false, created_at: new Date().toISOString() });
    return;
  }
  const notificationId = generateId();
  await query(
    `INSERT INTO notifications (id, user_id, pair_id, message, type, read, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [notificationId, partnerId, pairId, message, type, false, new Date().toISOString()]
  );
}

export async function getMoods(pairId: string) {
  if (useSupabase) return await select("moods", { pair_id: pairId }, { order: "created_at", limit: 50 });
  const result = await getAll(`SELECT id, user_id as "userId", mood, note, created_at as "createdAt" FROM moods WHERE pair_id = $1 ORDER BY created_at DESC LIMIT 50`, [pairId]);
  return result;
}

export async function addMood(userId: string, pairId: string, mood: string, note?: string) {
  const id = generateId();
  const now = new Date().toISOString();
  if (useSupabase) {
    await insertRow("moods", { id, user_id: userId, pair_id: pairId, mood, note: note || null, created_at: now });
    await notifyPartner(userId, pairId, `New mood added: ${mood}`, "mood");
    return { id, userId, mood, note, createdAt: now };
  }
  await query(`INSERT INTO moods (id, user_id, pair_id, mood, note, created_at) VALUES ($1, $2, $3, $4, $5, $6)`, [id, userId, pairId, mood, note || null, now]);
  await notifyPartner(userId, pairId, `New mood added: ${mood}`, "mood");
  return { id, userId, mood, note, createdAt: now };
}

export async function getActivities(pairId: string) {
  if (useSupabase) return await select("activities", { pair_id: pairId }, { order: "date", limit: 50 });
  const result = await getAll(`SELECT id, pair_id, title, description, type, date, completed, created_by as "createdBy" FROM activities WHERE pair_id = $1 ORDER BY date DESC LIMIT 50`, [pairId]);
  return result;
}

export async function createActivity(userId: string, pairId: string, title: string, type: string, date: string, description?: string) {
  const id = generateId();
  if (useSupabase) {
    await insertRow("activities", { id, pair_id: pairId, title, description: description || null, type, date, completed: false, created_by: userId });
    await notifyPartner(userId, pairId, `New activity created: ${title}`, "activity");
    return { id, pair_id: pairId, title, description, type, date, completed: false, createdBy: userId };
  }
  await query(`INSERT INTO activities (id, pair_id, title, description, type, date, completed, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [id, pairId, title, description || null, type, date, false, userId]);
  await notifyPartner(userId, pairId, `New activity created: ${title}`, "activity");
  return { id, pair_id: pairId, title, description, type, date, completed: false, createdBy: userId };
}

export async function toggleActivity(userId: string, pairId: string, activityId: string, completed: boolean) {
  if (useSupabase) { await updateRow("activities", { id: activityId, pair_id: pairId }, { completed }); return { success: true }; }
  await query("UPDATE activities SET completed = $1 WHERE id = $2 AND pair_id = $3", [completed, activityId, pairId]);
  const activity = await getOne("SELECT * FROM activities WHERE id = $1", [activityId]);
  if (activity) await notifyPartner(userId, pairId, `${activity.title} marked as ${completed ? "completed" : "incomplete"}`, "activity");
  return { success: true };
}

export async function updateActivity(userId: string, pairId: string, activityId: string, title?: string, description?: string) {
  if (useSupabase) {
    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description || null;
    if (Object.keys(data).length === 0) return { success: true };
    await updateRow("activities", { id: activityId, pair_id: pairId }, data);
    return { success: true };
  }
  const updates: string[] = []; const values: any[] = []; let idx = 1;
  if (title !== undefined) { updates.push(`title = $${idx++}`); values.push(title); }
  if (description !== undefined) { updates.push(`description = $${idx++}`); values.push(description || null); }
  if (updates.length === 0) return { success: true };
  values.push(activityId, pairId);
  await query(`UPDATE activities SET ${updates.join(", ")} WHERE id = $${idx++} AND pair_id = $${idx}`, values);
  const activity = await getOne("SELECT * FROM activities WHERE id = $1", [activityId]);
  if (activity && title) await notifyPartner(userId, pairId, `Activity updated: ${title}`, "activity");
  return { success: true };
}

export async function deleteActivity(userId: string, pairId: string, activityId: string) {
  if (useSupabase) { await deleteRow("activities", { id: activityId, pair_id: pairId }); return { success: true }; }
  const activity = await getOne("SELECT * FROM activities WHERE id = $1", [activityId]);
  await query("DELETE FROM activities WHERE id = $1 AND pair_id = $2", [activityId, pairId]);
  if (activity) await notifyPartner(userId, pairId, `Activity deleted: ${activity.title}`, "activity");
  return { success: true };
}

export async function getGallery(pairId: string) {
  if (useSupabase) return await select("gallery", { pair_id: pairId }, { order: "created_at", limit: 100 });
  const result = await getAll(`SELECT id, url, caption, created_at as "createdAt", created_by as "createdBy" FROM gallery WHERE pair_id = $1 ORDER BY created_at DESC`, [pairId]);
  return result;
}

export async function addPhoto(userId: string, pairId: string, url: string, caption?: string) {
  const id = generateId(); const now = new Date().toISOString();
  if (useSupabase) {
    await insertRow("gallery", { id, pair_id: pairId, url, caption: caption || null, created_at: now, created_by: userId });
    await notifyPartner(userId, pairId, "New photo added to gallery", "gallery");
    return { id, url, caption, createdAt: now, createdBy: userId };
  }
  await query(`INSERT INTO gallery (id, pair_id, url, caption, created_at, created_by) VALUES ($1, $2, $3, $4, $5, $6)`, [id, pairId, url, caption || null, now, userId]);
  await notifyPartner(userId, pairId, "New photo added to gallery", "gallery");
  return { id, url, caption, createdAt: now, createdBy: userId };
}

export async function deletePhoto(userId: string, pairId: string, photoId: string) {
  if (useSupabase) { await deleteRow("gallery", { id: photoId, pair_id: pairId }); return { success: true }; }
  await query("DELETE FROM gallery WHERE id = $1 AND pair_id = $2", [photoId, pairId]);
  return { success: true };
}

export async function getCalendarEvents(pairId: string) {
  if (useSupabase) return await select("calendar_events", { pair_id: pairId }, { order: "date", ascending: true });
  const result = await getAll(`SELECT id, title, date, type, description FROM calendar_events WHERE pair_id = $1 ORDER BY date ASC`, [pairId]);
  return result;
}

export async function addCalendarEvent(userId: string, pairId: string, title: string, date: string, type: string, description?: string) {
  const id = generateId(); const now = new Date().toISOString();
  if (useSupabase) {
    await insertRow("calendar_events", { id, pair_id: pairId, title, date, type, description: description || null, created_at: now });
    await notifyPartner(userId, pairId, `New event: ${title}`, "calendar");
    return { id, title, date, type, description };
  }
  await query(`INSERT INTO calendar_events (id, pair_id, title, date, type, description, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [id, pairId, title, date, type, description || null, now]);
  await notifyPartner(userId, pairId, `New event: ${title}`, "calendar");
  return { id, title, date, type, description };
}

export async function updateCalendarEvent(userId: string, pairId: string, eventId: string, data: { title?: string; date?: string; type?: string; description?: string }) {
  if (useSupabase) {
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.date !== undefined) updateData.date = data.date;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.description !== undefined) updateData.description = data.description;
    if (Object.keys(updateData).length === 0) return null;
    return await updateRow("calendar_events", { id: eventId, pair_id: pairId }, updateData);
  }
  const event = await getOne("SELECT * FROM calendar_events WHERE id = $1 AND pair_id = $2", [eventId, pairId]);
  if (!event) return null;
  const fields: string[] = []; const values: any[] = [];
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
  if (useSupabase) { await deleteRow("calendar_events", { id: eventId, pair_id: pairId }); return true; }
  const event = await getOne("SELECT * FROM calendar_events WHERE id = $1 AND pair_id = $2", [eventId, pairId]);
  if (!event) return false;
  await query("DELETE FROM calendar_events WHERE id = $1 AND pair_id = $2", [eventId, pairId]);
  await notifyPartner(userId, pairId, `Event deleted: ${event.title}`, "calendar");
  return true;
}

export async function getLetters(pairId: string) {
  if (useSupabase) return await select("letters", { pair_id: pairId }, { order: "created_at", limit: 50 });
  const result = await getAll(`SELECT id, title, content, type, open_date as "openDate", created_at as "createdAt", created_by as "createdBy" FROM letters WHERE pair_id = $1 ORDER BY created_at DESC`, [pairId]);
  return result;
}

export async function createLetter(userId: string, pairId: string, letter: { title: string; content: string; type: string; openDate?: string }) {
  const id = generateId(); const now = new Date().toISOString();
  if (useSupabase) {
    await insertRow("letters", { id, pair_id: pairId, title: letter.title, content: letter.content, type: letter.type, open_date: letter.openDate || null, created_at: now, created_by: userId });
    await notifyPartner(userId, pairId, `New letter: ${letter.title}`, "letter");
    return { id, title: letter.title, content: letter.content, type: letter.type, openDate: letter.openDate, createdAt: now, createdBy: userId };
  }
  await query(`INSERT INTO letters (id, pair_id, title, content, type, open_date, created_at, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [id, pairId, letter.title, letter.content, letter.type, letter.openDate || null, now, userId]);
  await notifyPartner(userId, pairId, `New letter: ${letter.title}`, "letter");
  return { id, title: letter.title, content: letter.content, type: letter.type, openDate: letter.openDate, createdAt: now, createdBy: userId };
}

export async function getNotifications(userId: string) {
  if (useSupabase) return await select("notifications", { user_id: userId }, { order: "created_at", limit: 20 });
  const result = await getAll(`SELECT id, message, type, read, created_at as "createdAt" FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`, [userId]);
  return result;
}

export async function markNotificationsAsRead(userId: string) {
  if (useSupabase) { await updateRow("notifications", { user_id: userId, read: false }, { read: true }); return { success: true }; }
  await query("UPDATE notifications SET read = true WHERE user_id = $1 AND read = false", [userId]);
  return { success: true };
}

export async function deleteLetter(userId: string, pairId: string, letterId: string) {
  if (useSupabase) { await deleteRow("letters", { id: letterId, pair_id: pairId }); return { success: true }; }
  await query("DELETE FROM letters WHERE id = $1 AND pair_id = $2", [letterId, pairId]);
  return { success: true };
}

export async function updatePresence(userId: string, pairId: string, status: string) {
  const now = new Date().toISOString();
  if (useSupabase) {
    const existing = await selectOne("ldr_presence", { user_id: userId });
    if (existing) { await updateRow("ldr_presence", { user_id: userId }, { status, last_seen: now }); }
    else { await insertRow("ldr_presence", { id: generateId(), user_id: userId, pair_id: pairId, status, last_seen: now }); }
    return { success: true };
  }
  const existing = await getOne("SELECT id FROM ldr_presence WHERE user_id = $1", [userId]);
  if (existing) { await query("UPDATE ldr_presence SET status = $1, last_seen = $2 WHERE user_id = $3", [status, now, userId]); }
  else { await query("INSERT INTO ldr_presence (id, user_id, pair_id, status, last_seen) VALUES ($1, $2, $3, $4, $5)", [generateId(), userId, pairId, status, now]); }
  return { success: true };
}

export async function getPresence(pairId: string) {
  if (useSupabase) return await select("ldr_presence", { pair_id: pairId });
  const result = await getAll(`SELECT user_id, status, last_seen FROM ldr_presence WHERE pair_id = $1`, [pairId]);
  return result;
}

export async function addStatusUpdate(userId: string, pairId: string, message: string, emoji?: string) {
  const id = generateId(); const now = new Date().toISOString();
  if (useSupabase) {
    await insertRow("ldr_status_updates", { id, user_id: userId, pair_id: pairId, message, emoji: emoji || "💬", created_at: now });
    await notifyPartner(userId, pairId, `Status update: ${message}`, "status");
    return { id, message, emoji: emoji || "💬", createdAt: now };
  }
  await query(`INSERT INTO ldr_status_updates (id, user_id, pair_id, message, emoji, created_at) VALUES ($1, $2, $3, $4, $5, $6)`, [id, userId, pairId, message, emoji || "💬", now]);
  await notifyPartner(userId, pairId, `Status update: ${message}`, "status");
  return { id, message, emoji: emoji || "💬", createdAt: now };
}

export async function getStatusUpdates(pairId: string) {
  if (useSupabase) return await select("ldr_status_updates", { pair_id: pairId }, { order: "created_at", limit: 50 });
  const result = await getAll(`SELECT id, user_id, message, emoji, created_at as "createdAt" FROM ldr_status_updates WHERE pair_id = $1 ORDER BY created_at DESC LIMIT 50`, [pairId]);
  return result;
}

export async function sendHug(userId: string, pairId: string, receiverId: string, message?: string) {
  const id = generateId(); const now = new Date().toISOString(); const hugMessage = message || "Sent a virtual hug 🤗";
  if (useSupabase) {
    await insertRow("ldr_hugs", { id, sender_id: userId, receiver_id: receiverId, pair_id: pairId, message: hugMessage, emoji: "🤗", created_at: now });
    await insertRow("notifications", { id: generateId(), user_id: receiverId, pair_id: pairId, message: `Virtual hug from your partner: ${hugMessage}`, type: "hug", read: false, created_at: now });
    return { id, message: hugMessage, emoji: "🤗", createdAt: now };
  }
  await query(`INSERT INTO ldr_hugs (id, sender_id, receiver_id, pair_id, message, emoji, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [id, userId, receiverId, pairId, hugMessage, "🤗", now]);
  await query(`INSERT INTO notifications (id, user_id, pair_id, message, type, read, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [generateId(), receiverId, pairId, `Virtual hug from your partner: ${hugMessage}`, "hug", false, now]);
  return { id, message: hugMessage, emoji: "🤗", createdAt: now };
}

export async function getHugs(pairId: string) {
  if (useSupabase) return await select("ldr_hugs", { pair_id: pairId }, { order: "created_at", limit: 20 });
  const result = await getAll(`SELECT id, sender_id, receiver_id, message, emoji, created_at as "createdAt" FROM ldr_hugs WHERE pair_id = $1 ORDER BY created_at DESC LIMIT 20`, [pairId]);
  return result;
}

export async function updateLoveMeter(userId: string, pairId: string, percentage: number) {
  const id = generateId(); const now = new Date().toISOString();
  if (useSupabase) {
    await insertRow("ldr_love_meter", { id, user_id: userId, pair_id: pairId, percentage, created_at: now });
    await notifyPartner(userId, pairId, `Love meter updated: ${percentage}%`, "love_meter");
    return { id, percentage, createdAt: now };
  }
  await query(`INSERT INTO ldr_love_meter (id, user_id, pair_id, percentage, created_at) VALUES ($1, $2, $3, $4, $5)`, [id, userId, pairId, percentage, now]);
  await notifyPartner(userId, pairId, `Love meter updated: ${percentage}%`, "love_meter");
  return { id, percentage, createdAt: now };
}

export async function getLoveMeter(pairId: string) {
  if (useSupabase) { const rows = await select("ldr_love_meter", { pair_id: pairId }, { order: "created_at", limit: 10 }); return rows.length > 0 ? rows : [{ percentage: 0 }]; }
  const result = await getAll(`SELECT user_id, percentage, created_at as "createdAt" FROM ldr_love_meter WHERE pair_id = $1 ORDER BY created_at DESC LIMIT 10`, [pairId]);
  return result;
}

export async function addLocation(userId: string, pairId: string, place: string, note?: string) {
  const id = generateId(); const now = new Date().toISOString();
  if (useSupabase) {
    await insertRow("ldr_locations", { id, user_id: userId, pair_id: pairId, place, note: note || null, created_at: now });
    await notifyPartner(userId, pairId, `Location update: ${place}`, "location");
    return { id, userId, place, note, createdAt: now };
  }
  await query(`INSERT INTO ldr_locations (id, user_id, pair_id, place, note, created_at) VALUES ($1, $2, $3, $4, $5, $6)`, [id, userId, pairId, place, note || null, now]);
  await notifyPartner(userId, pairId, `Location update: ${place}`, "location");
  return { id, userId, place, note, createdAt: now };
}

export async function getLocations(pairId: string) {
  if (useSupabase) return await select("ldr_locations", { pair_id: pairId }, { order: "created_at", limit: 20 });
  const result = await getAll(`SELECT id, user_id, place, note, created_at as "createdAt" FROM ldr_locations WHERE pair_id = $1 ORDER BY created_at DESC LIMIT 20`, [pairId]);
  return result;
}

export async function getUserExtra(userId: string, key: string) {
  if (useSupabase) { const result = await selectOne("user_extras", { user_id: userId, key }); return result?.value || null; }
  const result = await getOne("SELECT value FROM user_extras WHERE user_id = $1 AND key = $2", [userId, key]);
  return result?.value || null;
}

export async function setUserExtra(userId: string, pairId: string, key: string, value: string) {
  const now = new Date().toISOString();
  if (useSupabase) {
    const existing = await selectOne("user_extras", { user_id: userId, key });
    if (existing) { await updateRow("user_extras", { id: existing.id }, { value, updated_at: now }); }
    else { await insertRow("user_extras", { id: generateId(), user_id: userId, pair_id: pairId, key, value, created_at: now, updated_at: now }); }
    return { success: true };
  }
  const existing = await getOne("SELECT id FROM user_extras WHERE user_id = $1 AND key = $2", [userId, key]);
  if (existing) { await query("UPDATE user_extras SET value = $1, updated_at = $2 WHERE id = $3", [value, now, existing.id]); }
  else { const id = generateId(); await query("INSERT INTO user_extras (id, user_id, pair_id, key, value, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7)", [id, userId, pairId, key, value, now, now]); }
  return { success: true };
}

export async function getAchievements(pairId: string) {
  if (useSupabase) {
    const [gallery, letters, events, milestones] = await Promise.all([select("gallery", { pair_id: pairId }), select("letters", { pair_id: pairId }), select("calendar_events", { pair_id: pairId }), select("activities", { pair_id: pairId })]);
    return { galleryCount: gallery.length, letterCount: letters.filter((l: any) => l.type === "love_letter" || l.type === "open_when").length, vcCount: events.filter((e: any) => e.type === "vc").length, daysTogether: Math.floor((Date.now() - new Date("2023-01-01").getTime()) / (1000 * 60 * 60 * 24)), meetupPassed: false, milestoneCount: milestones.filter((m: any) => m.type === "milestone").length };
  }
  const result = await getOne(`SELECT COUNT(*) as gallery_count FROM gallery WHERE pair_id = $1`, [pairId]);
  const galleryCount = result?.gallery_count || 0;
  const lettersResult = await getOne(`SELECT COUNT(*) as letter_count FROM letters WHERE pair_id = $1 AND type IN ('love_letter', 'open_when')`, [pairId]);
  const letterCount = lettersResult?.letter_count || 0;
  const eventsResult = await getOne(`SELECT COUNT(*) as event_count FROM calendar_events WHERE pair_id = $1 AND type = 'vc'`, [pairId]);
  const vcCount = eventsResult?.event_count || 0;
  const settings = await getOne("SELECT relationship_start_date, next_meetup_date FROM user_settings WHERE pair_id = $1 LIMIT 1", [pairId]);
  const startDate = settings?.relationship_start_date ? new Date(settings.relationship_start_date) : new Date("2023-01-01");
  const daysTogether = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const meetupPassed = settings?.next_meetup_date ? new Date(settings.next_meetup_date) < new Date() : false;
  const milestones = await getOne(`SELECT COUNT(*) as count FROM activities WHERE pair_id = $1 AND type = 'milestone'`, [pairId]);
  const milestoneCount = milestones?.count || 0;
  return { galleryCount, letterCount, vcCount, daysTogether, meetupPassed, milestoneCount };
}

export async function getChatMessages(pairId: string, limit = 50) {
  if (useSupabase) { const rows = await select("chat_messages", { pair_id: pairId }, { order: "created_at", limit }); return rows.reverse(); }
  const result = await getAll(`SELECT id, user_id as "userId", text, emoji, created_at as "createdAt" FROM chat_messages WHERE pair_id = $1 ORDER BY created_at DESC LIMIT $2`, [pairId, limit]);
  return result.reverse();
}

export async function sendChatMessage(userId: string, pairId: string, text: string, emoji?: string) {
  const id = generateId(); const now = new Date().toISOString();
  if (useSupabase) { await insertRow("chat_messages", { id, pair_id: pairId, user_id: userId, text, emoji: emoji || null, created_at: now }); return { id, userId, text, emoji: emoji || null, createdAt: now }; }
  await query(`INSERT INTO chat_messages (id, pair_id, user_id, text, emoji, created_at) VALUES ($1, $2, $3, $4, $5, $6)`, [id, pairId, userId, text, emoji || null, now]);
  return { id, userId, text, emoji: emoji || null, createdAt: now };
}

export async function getVoiceNotes(pairId: string) {
  if (useSupabase) return await select("voice_notes", { pair_id: pairId }, { order: "created_at", limit: 50 });
  const result = await getAll(`SELECT id, user_id as "userId", audio_url as "audioUrl", duration, title, created_at as "createdAt" FROM voice_notes WHERE pair_id = $1 ORDER BY created_at DESC LIMIT 50`, [pairId]);
  return result;
}

export async function addVoiceNote(userId: string, pairId: string, audioUrl: string, duration: number, title?: string) {
  const id = generateId(); const now = new Date().toISOString();
  if (useSupabase) { await insertRow("voice_notes", { id, pair_id: pairId, user_id: userId, audio_url: audioUrl, duration, title: title || null, created_at: now }); return { id, userId, audioUrl, duration, title: title || null, createdAt: now }; }
  await query(`INSERT INTO voice_notes (id, pair_id, user_id, audio_url, duration, title, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [id, pairId, userId, audioUrl, duration, title || null, now]);
  return { id, userId, audioUrl, duration, title: title || null, createdAt: now };
}

export async function getGameScores(pairId: string) {
  if (useSupabase) return await select("game_scores", { pair_id: pairId }, { order: "created_at", limit: 50 });
  const result = await getAll(`SELECT id, user_id as "userId", game, score, data, created_at as "createdAt" FROM game_scores WHERE pair_id = $1 ORDER BY created_at DESC LIMIT 50`, [pairId]);
  return result;
}

export async function addGameScore(userId: string, pairId: string, game: string, score: number, data?: string) {
  const id = generateId(); const now = new Date().toISOString();
  if (useSupabase) { await insertRow("game_scores", { id, pair_id: pairId, user_id: userId, game, score, data: data || null, created_at: now }); return { id, userId, game, score, data: data || null, createdAt: now }; }
  await query(`INSERT INTO game_scores (id, pair_id, user_id, game, score, data, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [id, pairId, userId, game, score, data || null, now]);
  return { id, userId, game, score, data: data || null, createdAt: now };
}
