/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import type { MoodEntry, Activity, GalleryItem, CalendarEvent, Letter, Hug, StatusUpdate } from "@/types";
import { useRetryQueue } from "./useRetryQueue";
import { showToast } from "./useToast";

async function callDb(action: string, token: string, params?: any) {
  const result = await fetch("/api/db", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, token, ...params }),
    cache: "no-store",
  });

  if (!result.ok) {
    const error = await result.json().catch(() => ({}));
    throw new Error(error.error || "Database error");
  }
  return result.json();
}

export function useMoods(token: string) {
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { enqueue, flush } = useRetryQueue();

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
      enqueue({ action: "getMoods", token });
      console.error("Error fetching moods:", error);
    } finally {
      setLoading(false);
    }
  }, [token, enqueue]);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMoods();
    const interval = setInterval(fetchMoods, 3000);
    return () => clearInterval(interval);
  }, [fetchMoods, token]);

  const addMood = useCallback(async (mood: { mood: MoodEntry["mood"]; note?: string }) => {
    try {
      await callDb("addMood", token, { mood: mood.mood, note: mood.note });
      showToast("Mood saved 💭", "success");
      fetchMoods();
    } catch (error) {
      showToast("Gagal menyimpan mood", "error");
      console.error("Error adding mood:", error);
    }
  }, [token, fetchMoods]);

  return { moods, loading, addMood, flushOffline: flush };
}

export function useActivities(token: string) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { enqueue, flush } = useRetryQueue();

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
      enqueue({ action: "getActivities", token });
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  }, [token, enqueue]);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchActivities();
    const interval = setInterval(fetchActivities, 3000);
    return () => clearInterval(interval);
  }, [fetchActivities, token]);

  const createActivity = useCallback(async (title: string, type: Activity["type"], date: Date, description?: string) => {
    try {
      await callDb("createActivity", token, { title, type, date: date.toISOString(), description });
      showToast("Activity created 📅", "success");
      fetchActivities();
    } catch (error) {
      showToast("Gagal membuat activity", "error");
      console.error("Error creating activity:", error);
    }
  }, [token, fetchActivities]);

  const toggleActivity = useCallback(async (id: string, completed: boolean) => {
    try {
      await callDb("toggleActivity", token, { activityId: id, completed });
      fetchActivities();
    } catch (error) {
      showToast("Gagal mengubah activity", "error");
      console.error("Error toggling activity:", error);
    }
  }, [token, fetchActivities]);

  const updateActivity = useCallback(async (id: string, updates: { title?: string; description?: string }) => {
    try {
      await callDb("updateActivity", token, { activityId: id, ...updates });
      showToast("Activity diperbarui ✅", "success");
      fetchActivities();
    } catch (error) {
      showToast("Gagal memperbarui activity", "error");
      console.error("Error updating activity:", error);
    }
  }, [token, fetchActivities]);

  const deleteActivity = useCallback(async (id: string) => {
    try {
      await callDb("deleteActivity", token, { activityId: id });
      showToast("Activity dihapus 🗑️", "success");
      fetchActivities();
    } catch (error) {
      showToast("Gagal menghapus activity", "error");
      console.error("Error deleting activity:", error);
    }
  }, [token, fetchActivities]);

  return { activities, loading, createActivity, toggleActivity, updateActivity, deleteActivity, flushOffline: flush };
}

export function useGallery(token: string) {
  const [photos, setPhotos] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { enqueue, flush } = useRetryQueue();

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
      enqueue({ action: "getGallery", token });
      console.error("Error fetching gallery:", error);
    } finally {
      setLoading(false);
    }
  }, [token, enqueue]);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchGallery();
    const interval = setInterval(fetchGallery, 3000);
    return () => clearInterval(interval);
  }, [fetchGallery, token]);

  const addPhoto = useCallback(async (url: string, caption?: string) => {
    try {
      await callDb("addPhoto", token, { url, caption });
      showToast("Foto berhasil diupload 📸", "success");
      fetchGallery();
    } catch (error) {
      showToast("Gagal upload foto", "error");
      console.error("Error adding photo:", error);
    }
  }, [token, fetchGallery]);

  const deletePhoto = useCallback(async (id: string) => {
    try {
      await callDb("deletePhoto", token, { photoId: id });
      showToast("Foto dihapus 🗑️", "success");
      fetchGallery();
    } catch (error) {
      showToast("Gagal menghapus foto", "error");
      console.error("Error deleting photo:", error);
    }
  }, [token, fetchGallery]);

  return { photos, loading, addPhoto, deletePhoto, flushOffline: flush };
}

export function useCalendarEvents(token: string) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { enqueue, flush } = useRetryQueue();

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
      enqueue({ action: "getCalendarEvents", token });
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  }, [token, enqueue]);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEvents();
    const interval = setInterval(fetchEvents, 3000);
    return () => clearInterval(interval);
  }, [fetchEvents, token]);

  const addCalendarEvent = useCallback(async (title: string, date: Date, type: CalendarEvent["type"], description?: string) => {
    try {
      await callDb("addCalendarEvent", token, { title, date: date.toISOString(), type, description });
      showToast("Event ditambahkan 📅", "success");
      fetchEvents();
    } catch (error) {
      showToast("Gagal menambahkan event", "error");
      console.error("Error adding event:", error);
    }
  }, [token, fetchEvents]);

  const updateCalendarEvent = useCallback(async (eventId: string, data: { title?: string; date?: Date; type?: CalendarEvent["type"]; description?: string }) => {
    try {
      const payload: any = { eventId, data };
      if (data.date instanceof Date) payload.data.date = data.date.toISOString();
      await callDb("updateCalendarEvent", token, payload);
      showToast("Event diperbarui 📅", "success");
      fetchEvents();
    } catch (error) {
      showToast("Gagal memperbarui event", "error");
      console.error("Error updating event:", error);
    }
  }, [token, fetchEvents]);

  const deleteCalendarEvent = useCallback(async (eventId: string) => {
    try {
      await callDb("deleteCalendarEvent", token, { eventId });
      showToast("Event dihapus 🗑️", "success");
      fetchEvents();
    } catch (error) {
      showToast("Gagal menghapus event", "error");
      console.error("Error deleting event:", error);
    }
  }, [token, fetchEvents]);

  return { events, loading, addCalendarEvent, updateCalendarEvent, deleteCalendarEvent, flushOffline: flush };
}

export function useLetters(token: string) {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const { enqueue, flush } = useRetryQueue();

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
      enqueue({ action: "getLetters", token });
      console.error("Error fetching letters:", error);
    } finally {
      setLoading(false);
    }
  }, [token, enqueue]);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLetters();
    const interval = setInterval(fetchLetters, 3000);
    return () => clearInterval(interval);
  }, [fetchLetters, token]);

  const createLetter = useCallback(async (letter: { title: string; content: string; type: Letter["type"]; openDate?: Date }) => {
    try {
      await callDb("createLetter", token, { letter: { ...letter, openDate: letter.openDate?.toISOString() } });
      showToast("Surat terkirim 💌", "success");
      fetchLetters();
    } catch (error) {
      showToast("Gagal mengirim surat", "error");
      console.error("Error creating letter:", error);
    }
  }, [token, fetchLetters]);

  return { letters, loading, refetch: fetchLetters, createLetter, flushOffline: flush };
}

export function usePresence(token: string) {
  const [presence, setPresence] = useState<{ userId: string; status: string; lastSeen: string }[]>([]);
  const { enqueue, flush } = useRetryQueue();

  const fetchPresence = useCallback(async () => {
    try {
      const data = await callDb("getPresence", token);
      setPresence(data.map((p: any) => ({
        userId: p.user_id,
        status: p.status,
        lastSeen: p.last_seen,
      })));
    } catch (error) {
      enqueue({ action: "getPresence", token });
      console.error("Error fetching presence:", error);
    }
  }, [token, enqueue]);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPresence();
    const interval = setInterval(fetchPresence, 3000);
    return () => clearInterval(interval);
  }, [fetchPresence, token]);

  const updatePresence = useCallback(async (status: string) => {
    try {
      await callDb("updatePresence", token, { status });
      fetchPresence();
    } catch (error) {
      console.error("Error updating presence:", error);
    }
  }, [token, fetchPresence]);

  return { presence, updatePresence, flushOffline: flush };
}

export function useStatusUpdates(token: string) {
  const [updates, setUpdates] = useState<StatusUpdate[]>([]);
  const { enqueue, flush } = useRetryQueue();

  const fetchUpdates = useCallback(async () => {
    try {
      const data = await callDb("getStatusUpdates", token);
      setUpdates(data);
    } catch (error) {
      enqueue({ action: "getStatusUpdates", token });
      console.error("Error fetching status updates:", error);
    }
  }, [token, enqueue]);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUpdates();
    const interval = setInterval(fetchUpdates, 3000);
    return () => clearInterval(interval);
  }, [fetchUpdates, token]);

  const addUpdate = useCallback(async (message: string, emoji?: string) => {
    try {
      await callDb("addStatusUpdate", token, { message, emoji });
      showToast("Status updated 💬", "success");
      fetchUpdates();
    } catch (error) {
      showToast("Gagal update status", "error");
      console.error("Error adding status update:", error);
    }
  }, [token, fetchUpdates]);

  return { updates, addUpdate, refetch: fetchUpdates, flushOffline: flush };
}

export function useHugs(token: string) {
  const [hugs, setHugs] = useState<Hug[]>([]);
  const { enqueue, flush } = useRetryQueue();

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
      enqueue({ action: "getHugs", token });
      console.error("Error fetching hugs:", error);
    }
  }, [token, enqueue]);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHugs();
    const interval = setInterval(fetchHugs, 3000);
    return () => clearInterval(interval);
  }, [fetchHugs, token]);

  const sendHug = useCallback(async (receiverId: string, message?: string) => {
    try {
      await callDb("sendHug", token, { receiverId, message });
      showToast("Peluk terkirim! 🤗", "success");
      fetchHugs();
    } catch (error) {
      showToast("Gagal mengirim peluk", "error");
      console.error("Error sending hug:", error);
    }
  }, [token, fetchHugs]);

  return { hugs, sendHug, refetch: fetchHugs, flushOffline: flush };
}

export function useLoveMeter(token: string) {
  const [history, setHistory] = useState<{ userId: string; percentage: number; createdAt: Date }[]>([]);
  const { enqueue, flush } = useRetryQueue();

  const fetchHistory = useCallback(async () => {
    try {
      const data = await callDb("getLoveMeter", token);
      setHistory(data.map((l: any) => ({
        userId: l.userId,
        percentage: l.percentage,
        createdAt: new Date(l.createdAt),
      })));
    } catch (error) {
      enqueue({ action: "getLoveMeter", token });
      console.error("Error fetching love meter:", error);
    }
  }, [token, enqueue]);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHistory();
    const interval = setInterval(fetchHistory, 3000);
    return () => clearInterval(interval);
  }, [fetchHistory, token]);

  const update = useCallback(async (percentage: number) => {
    try {
      await callDb("updateLoveMeter", token, { percentage });
      showToast(`Love meter updated: ${percentage}% 💗`, "success");
      fetchHistory();
    } catch (error) {
      showToast("Gagal update love meter", "error");
      console.error("Error updating love meter:", error);
    }
  }, [token, fetchHistory]);

  const currentPercentage = history.length > 0 ? history[0].percentage : 0;

  return { history, currentPercentage, update, refetch: fetchHistory, flushOffline: flush };
}

export function useNotifications(token: string) {
  const [notifications, setNotifications] = useState<{ id: string; message: string; type: string; read: boolean; createdAt: string }[]>([]);
  const { enqueue, flush } = useRetryQueue();

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await callDb("getNotifications", token);
      setNotifications(data);
    } catch (error) {
      enqueue({ action: "getNotifications", token });
      console.error("Error fetching notifications:", error);
    }
  }, [token, enqueue]);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 3000);
    return () => clearInterval(interval);
  }, [fetchNotifications, token]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, refetch: fetchNotifications, flushOffline: flush };
}

export function usePartnerId(token: string, userId?: string) {
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [pairId, setPairId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !userId) return;
    let cancelled = false;
    let retryCount = 0;
    const maxRetries = 3;

    const fetchPartnerId = async () => {
      try {
        setError(null);
        const sessionRes = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "verify", token }),
        });
        if (!sessionRes.ok) {
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(fetchPartnerId, 1000 * retryCount);
            return;
          }
          throw new Error("Session verification failed");
        }
        const sessionData = await sessionRes.json();
        const currentPairId = sessionData.user?.pair_id || "";
        const currentUserId = sessionData.user?.id || userId;
        if (cancelled || !currentPairId) return;
        setPairId(currentPairId);
        const res = await fetch("/api/db", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "getPartnerId", token, userId: currentUserId, pairId: currentPairId }),
        });
        if (!res.ok) {
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(fetchPartnerId, 1000 * retryCount);
            return;
          }
          throw new Error("Failed to get partner ID");
        }
        const data = await res.json();
        if (!cancelled) {
          setPartnerId(data.partnerId || null);
          if (!data.partnerId) {
            showToast("Partner belum terhubung. Pastikan pasangan sudah mendaftarkan pair ID 💞", "warning");
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error fetching partner ID:", error);
          setError("Gagal memuat data partner");
          if (retryCount >= maxRetries) {
            showToast("Gagal memuat data partner. Coba refresh halaman.", "error");
          }
        }
      }
    };

    fetchPartnerId();
    return () => { cancelled = true; };
  }, [token, userId]);

  return { partnerId, pairId, error };
}

export function useLocations(token: string) {
  const [locations, setLocations] = useState<{ id: string; userId: string; place: string; note?: string; createdAt: string }[]>([]);
  const { enqueue, flush } = useRetryQueue();

  const fetchLocations = useCallback(async () => {
    try {
      const data = await callDb("getLocations", token);
      setLocations(data);
    } catch (error) {
      enqueue({ action: "getLocations", token });
      console.error("Error fetching locations:", error);
    }
  }, [token, enqueue]);

  useEffect(() => {
    if (!token) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchLocations();
    const interval = setInterval(fetchLocations, 3000);
    return () => clearInterval(interval);
  }, [fetchLocations, token]);

  const addLocation = useCallback(async (place: string, note?: string) => {
    try {
      await callDb("addLocation", token, { place, note });
      showToast("Lokasi dibagikan 📍", "success");
      fetchLocations();
    } catch (error) {
      showToast("Gagal membagikan lokasi", "error");
      console.error("Error adding location:", error);
    }
  }, [token, fetchLocations]);

  const markAsRead = useCallback(async () => {
    if (!token) return;
    try {
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markNotificationsAsRead", token }),
      });
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  }, [token]);

  return { locations, addLocation, refetch: fetchLocations, markAsRead, flushOffline: flush };
}

export function useDailyReset() {
  const [todayKey, setTodayKey] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  });

  useEffect(() => {
    const check = () => {
      const d = new Date();
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      setTodayKey((prev) => {
        if (prev !== key) {
          return key;
        }
        return prev;
      });
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  const isNewDay = useCallback(() => {
    const d = new Date();
    const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    return todayKey !== key;
  }, [todayKey]);

  return { todayKey, isNewDay };
}
