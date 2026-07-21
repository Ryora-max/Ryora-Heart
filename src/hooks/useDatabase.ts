/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import type { MoodEntry, Activity, GalleryItem, CalendarEvent, Letter, Hug, StatusUpdate } from "@/types";

async function callDb(action: string, token: string, params?: any) {
  const result = await fetch("/api/db", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, token, ...params }),
    cache: "no-store",
  });

  if (!result.ok) {
    const error = await result.json();
    throw new Error(error.error || "Database error");
  }
  return result.json();
}

export function useMoods(token: string) {
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMoods = useCallback(async () => {
    try {
      const data = await callDb("getMoods", token);
      setMoods(data.map((m: any) => ({
        id: m.id,
        userId: m.userId,
        mood: m.mood as MoodEntry["mood"],
        note: m.note || undefined,
        createdAt: new Date(m.createdAt),
      })));
    } catch (error) {
      console.error("Error fetching moods:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMoods();
    const interval = setInterval(fetchMoods, 3000);
    return () => clearInterval(interval);
  }, [fetchMoods, token]);

  const addMood = useCallback(async (mood: { mood: MoodEntry["mood"]; note?: string }) => {
    await callDb("addMood", token, { mood: mood.mood, note: mood.note });
    fetchMoods();
  }, [token, fetchMoods]);

  return { moods, loading, addMood };
}

export function useActivities(token: string) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivities = useCallback(async () => {
    try {
      const data = await callDb("getActivities", token);
      setActivities(data.map((a: any) => ({
        id: a.id,
        title: a.title,
        description: a.description || undefined,
        type: a.type as Activity["type"],
        date: new Date(a.date),
        completed: Boolean(a.completed),
        createdBy: a.createdBy,
      })));
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchActivities();
    const interval = setInterval(fetchActivities, 3000);
    return () => clearInterval(interval);
  }, [fetchActivities, token]);

  const createActivity = useCallback(async (title: string, type: Activity["type"], date: Date, description?: string) => {
    await callDb("createActivity", token, { title, type, date: date.toISOString(), description });
    fetchActivities();
  }, [token, fetchActivities]);

  const toggleActivity = useCallback(async (id: string, completed: boolean) => {
    await callDb("toggleActivity", token, { activityId: id, completed });
    fetchActivities();
  }, [token, fetchActivities]);

  return { activities, loading, createActivity, toggleActivity };
}

export function useGallery(token: string) {
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGallery = useCallback(async () => {
    try {
      const data = await callDb("getGallery", token);
      setPhotos(data.map((g: any) => ({
        id: g.id,
        url: g.url,
        caption: g.caption || undefined,
        createdAt: new Date(g.createdAt),
        createdBy: g.createdBy,
      })));
    } catch (error) {
      console.error("Error fetching gallery:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGallery();
    const interval = setInterval(fetchGallery, 3000);
    return () => clearInterval(interval);
  }, [fetchGallery, token]);

  const addPhoto = useCallback(async (url: string, caption?: string) => {
    await callDb("addPhoto", token, { url, caption });
    fetchGallery();
  }, [token, fetchGallery]);

  const deletePhoto = useCallback(async (id: string) => {
    await callDb("deletePhoto", token, { photoId: id });
    fetchGallery();
  }, [token, fetchGallery]);

  return { photos, loading, addPhoto, deletePhoto };
}

export function useCalendarEvents(token: string) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = useCallback(async () => {
    try {
      const data = await callDb("getCalendarEvents", token);
      setEvents(data.map((e: any) => ({
        id: e.id,
        title: e.title,
        date: new Date(e.date),
        type: e.type as CalendarEvent["type"],
        description: e.description || undefined,
      })));
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEvents();
    const interval = setInterval(fetchEvents, 3000);
    return () => clearInterval(interval);
  }, [fetchEvents, token]);

  const addCalendarEvent = useCallback(async (title: string, date: Date, type: CalendarEvent["type"], description?: string) => {
    await callDb("addCalendarEvent", token, { title, date: date.toISOString(), type, description });
    fetchEvents();
  }, [token, fetchEvents]);

  const updateCalendarEvent = useCallback(async (eventId: string, data: { title?: string; date?: Date; type?: CalendarEvent["type"]; description?: string }) => {
    const payload: any = { eventId, data };
    if (data.date instanceof Date) payload.data.date = data.date.toISOString();
    await callDb("updateCalendarEvent", token, payload);
    fetchEvents();
  }, [token, fetchEvents]);

  const deleteCalendarEvent = useCallback(async (eventId: string) => {
    await callDb("deleteCalendarEvent", token, { eventId });
    fetchEvents();
  }, [token, fetchEvents]);

  return { events, loading, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent };
}

export function useLetters(token: string) {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLetters = useCallback(async () => {
    try {
      const data = await callDb("getLetters", token);
      setLetters(data.map((l: any) => ({
        id: l.id,
        title: l.title,
        content: l.content,
        type: l.type as Letter["type"],
        openDate: l.openDate ? new Date(l.openDate) : undefined,
        createdAt: new Date(l.createdAt),
        createdBy: l.createdBy,
      })));
    } catch (error) {
      console.error("Error fetching letters:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLetters();
    const interval = setInterval(fetchLetters, 3000);
    return () => clearInterval(interval);
  }, [fetchLetters, token]);

  const createLetter = useCallback(async (letter: { title: string; content: string; type: Letter["type"]; openDate?: Date }) => {
    await callDb("createLetter", token, { letter: { ...letter, openDate: letter.openDate?.toISOString() } });
    fetchLetters();
  }, [token, fetchLetters]);

  return { letters, loading, refetch: fetchLetters, createLetter };
}

export function usePresence(token: string) {
  const [presence, setPresence] = useState<{ userId: string; status: string; lastSeen: string }[]>([]);

  const fetchPresence = useCallback(async () => {
    try {
      const data = await callDb("getPresence", token);
      setPresence(data);
    } catch (error) {
      console.error("Error fetching presence:", error);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPresence();
    const interval = setInterval(fetchPresence, 3000);
    return () => clearInterval(interval);
  }, [fetchPresence, token]);

  const updatePresence = useCallback(async (status: string) => {
    await callDb("updatePresence", token, { status });
    fetchPresence();
  }, [token, fetchPresence]);

  return { presence, updatePresence };
}

export function useStatusUpdates(token: string) {
  const [updates, setUpdates] = useState<StatusUpdate[]>([]);

  const fetchUpdates = useCallback(async () => {
    try {
      const data = await callDb("getStatusUpdates", token);
      setUpdates(data);
    } catch (error) {
      console.error("Error fetching status updates:", error);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUpdates();
    const interval = setInterval(fetchUpdates, 3000);
    return () => clearInterval(interval);
  }, [fetchUpdates, token]);

  const addUpdate = useCallback(async (message: string, emoji?: string) => {
    await callDb("addStatusUpdate", token, { message, emoji });
    fetchUpdates();
  }, [token, fetchUpdates]);

  return { updates, addUpdate, refetch: fetchUpdates };
}

export function useHugs(token: string) {
  const [hugs, setHugs] = useState<Hug[]>([]);

  const fetchHugs = useCallback(async () => {
    try {
      const data = await callDb("getHugs", token);
      setHugs(data.map((h: any) => ({
        id: h.id,
        senderId: h.sender_id,
        receiverId: h.receiver_id,
        message: h.message,
        emoji: h.emoji,
        createdAt: new Date(h.createdAt),
      })));
    } catch (error) {
      console.error("Error fetching hugs:", error);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHugs();
    const interval = setInterval(fetchHugs, 3000);
    return () => clearInterval(interval);
  }, [fetchHugs, token]);

  const sendHug = useCallback(async (receiverId: string, message?: string) => {
    await callDb("sendHug", token, { receiverId, message });
    fetchHugs();
  }, [token, fetchHugs]);

  return { hugs, sendHug, refetch: fetchHugs };
}

export function useLoveMeter(token: string) {
  const [history, setHistory] = useState<{ userId: string; percentage: number; createdAt: Date }[]>([]);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await callDb("getLoveMeter", token);
      setHistory(data.map((l: any) => ({
        userId: l.userId,
        percentage: l.percentage,
        createdAt: new Date(l.createdAt),
      })));
    } catch (error) {
      console.error("Error fetching love meter:", error);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHistory();
    const interval = setInterval(fetchHistory, 3000);
    return () => clearInterval(interval);
  }, [fetchHistory, token]);

  const update = useCallback(async (percentage: number) => {
    await callDb("updateLoveMeter", token, { percentage });
    fetchHistory();
  }, [token, fetchHistory]);

  const currentPercentage = history.length > 0 ? history[0].percentage : 0;

  return { history, currentPercentage, update, refetch: fetchHistory };
}

export function useNotifications(token: string) {
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: string; read: boolean; createdAt: string }[]>([]);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await callDb("getNotifications", token);
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 3000);
    return () => clearInterval(interval);
  }, [fetchNotifications, token]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, refetch: fetchNotifications };
}
