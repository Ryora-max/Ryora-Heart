/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import type { MoodEntry, Activity, GalleryItem, CalendarEvent, Letter } from "@/types";

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

  return { events, loading, addCalendarEvent };
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
