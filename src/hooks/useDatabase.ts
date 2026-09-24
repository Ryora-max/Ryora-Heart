/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type {
  MoodEntry,
  Activity,
  ChatMessage,
  RinduNotification,
  RinduLevel,
  LiveLocation,
  Presence,
  MoodType,
  GalleryItem,
  CalendarEvent,
  Letter,
  Hug,
  LoveMeter,
  UserSettings,
  AppNotification,
} from "@/types";
import { useRetryQueue } from "./useRetryQueue";
import { showToast } from "./useToast";
import { usePolling } from "./usePolling";
import { useRealtime } from "./useRealtime";

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

function useRealtimeRefetch(table: string, refetch: () => void, enabled: boolean) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refetchRef = useRef(refetch);
  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);
  useRealtime(
    table,
    undefined,
    () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        refetchRef.current();
        timerRef.current = null;
      }, 300);
    },
    enabled
  );
}

// ─── Presence ─────────────────────────────────────────────────
export function usePresence(token: string) {
  const [presence, setPresence] = useState<Presence[]>([]);
  const [loading, setLoading] = useState(true);
  const { flush } = useRetryQueue();
  const enabled = Boolean(token);

  const fetchPresence = useCallback(async () => {
    if (!token) return;
    try {
      const data = await callDb("getPresence", token);
      setPresence(data.map((p: any) => ({
        id: p.id,
        userId: p.userId,
        status: p.status,
        lastSeen: new Date(p.lastSeen),
      })));
    } catch (error) {
      console.error("Error fetching presence:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  usePolling(fetchPresence, 15000, enabled);
  useRealtimeRefetch("ldr_presence", fetchPresence, enabled);

  const updatePresence = useCallback(async (status: "online" | "offline") => {
    try {
      await callDb("updatePresence", token, { status });
    } catch (error) {
      console.error("Error updating presence:", error);
    }
  }, [token]);

  return { presence, loading, updatePresence, flushOffline: flush };
}

export function usePartnerId(token: string, userId?: string) {
  const getFallback = (id?: string) => {
    if (!id) return "user-2";
    if (id === "user-1" || id.includes("eb6dfbf6")) return "user-2";
    if (id === "user-2" || id.includes("8cc49c82")) return "user-1";
    return "user-2";
  };

  // Hanya hasil server yang disimpan di state — fallback di-derive langsung
  // dari userId (pure, tidak perlu effect sync).
  const [serverPartnerId, setServerPartnerId] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !userId) return;
    let cancelled = false;
    callDb("getPartnerId", token)
      .then((data) => {
        if (!cancelled && data?.partnerId) setServerPartnerId(data.partnerId);
      })
      .catch(() => {
        // Keeps fallback
      });
    return () => {
      cancelled = true;
    };
  }, [token, userId]);

  return { partnerId: serverPartnerId || getFallback(userId) };
}

// ─── Moods ────────────────────────────────────────────────────
export function useMoods(token: string) {
  const [moods, setMoods] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { enqueue, flush } = useRetryQueue();
  const enabled = Boolean(token);

  const fetchMoods = useCallback(async () => {
    if (!token) return;
    try {
      const data = await callDb("getMoods", token);
      setMoods(data.map((m: any) => ({
        id: m.id,
        userId: m.userId,
        mood: m.mood as MoodType,
        note: m.note || undefined,
        createdAt: new Date(m.createdAt),
      })));
    } catch (error) {
      console.error("Error fetching moods:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  usePolling(fetchMoods, 30000, enabled);
  useRealtimeRefetch("moods", fetchMoods, enabled);

  const addMood = useCallback(async (mood: { mood: MoodType; note?: string }) => {
    try {
      await callDb("addMood", token, { mood: mood.mood, note: mood.note });
      showToast("Mood saved 💭", "success");
      fetchMoods();
    } catch (error) {
      enqueue({ action: "addMood", token, params: { mood: mood.mood, note: mood.note } });
      showToast("Gagal menyimpan mood", "error");
      console.error("Error adding mood:", error);
    }
  }, [token, fetchMoods, enqueue]);

  return { moods, loading, addMood, flushOffline: flush };
}

// ─── Live Activities (with mood + time) ───────────────────────
export function useActivities(token: string) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const { enqueue, flush } = useRetryQueue();
  const enabled = Boolean(token);

  const fetchActivities = useCallback(async () => {
    if (!token) return;
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
        mood: a.mood as MoodType | undefined,
        startTime: a.startTime ? new Date(a.startTime) : undefined,
        endTime: a.endTime ? new Date(a.endTime) : undefined,
        isLive: a.isLive,
      })));
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  usePolling(fetchActivities, 30000, enabled);
  useRealtimeRefetch("activities", fetchActivities, enabled);

  const createActivity = useCallback(async (data: {
    title: string;
    type?: Activity["type"];
    mood?: MoodType;
    description?: string;
    isLive?: boolean;
  }) => {
    try {
      await callDb("createActivity", token, {
        title: data.title,
        type: data.type || "schedule",
        mood: data.mood,
        description: data.description,
        isLive: data.isLive,
        date: new Date().toISOString(),
      });
      showToast("Activity ditambahkan ✨", "success");
      fetchActivities();
    } catch (error) {
      enqueue({ action: "createActivity", token, params: {
        title: data.title, type: data.type || "schedule", mood: data.mood,
        description: data.description, isLive: data.isLive, date: new Date().toISOString(),
      } });
      showToast("Gagal membuat activity", "error");
      console.error("Error creating activity:", error);
    }
  }, [token, fetchActivities, enqueue]);

  const stopActivity = useCallback(async (id: string) => {
    const params = { activityId: id, endTime: new Date().toISOString(), isLive: false };
    try {
      await callDb("updateActivity", token, params);
      showToast("Activity selesai ✓", "success");
      fetchActivities();
    } catch (error) {
      enqueue({ action: "updateActivity", token, params });
      showToast("Gagal update activity", "error");
      console.error("Error stopping activity:", error);
    }
  }, [token, fetchActivities, enqueue]);

  const deleteActivity = useCallback(async (id: string) => {
    try {
      await callDb("deleteActivity", token, { activityId: id });
      showToast("Activity dihapus 🗑️", "success");
      fetchActivities();
    } catch (error) {
      enqueue({ action: "deleteActivity", token, params: { activityId: id } });
      showToast("Gagal menghapus activity", "error");
      console.error("Error deleting activity:", error);
    }
  }, [token, fetchActivities, enqueue]);

  return { activities, loading, createActivity, stopActivity, deleteActivity, flushOffline: flush };
}

// ─── Chat ─────────────────────────────────────────────────────
export function useChat(token: string, pairId?: string, userId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { enqueue, flush } = useRetryQueue();
  const enabled = Boolean(token);

  const fetchMessages = useCallback(async () => {
    if (!token) return;
    try {
      const data = await callDb("getChatMessages", token);
      setMessages(data.map((m: any) => ({
        id: m.id,
        senderId: m.senderId,
        receiverId: m.receiverId,
        content: m.content,
        createdAt: new Date(m.createdAt),
        readAt: m.readAt ? new Date(m.readAt) : undefined,
      })));
    } catch (error) {
      console.error("Error fetching chat:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  usePolling(fetchMessages, 3000, enabled);
  useRealtimeRefetch("chat_messages", fetchMessages, enabled);

  const sendMessage = useCallback(async (content: string, receiverId: string) => {
    const tempId = "temp-" + Date.now();
    const optimisticMsg: ChatMessage = {
      id: tempId,
      senderId: userId || (token.includes("partner") ? "user-2" : "user-1"),
      receiverId,
      content,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      await callDb("sendChatMessage", token, { content, receiverId });
      fetchMessages();
    } catch (error) {
      enqueue({ action: "sendChatMessage", token, params: { content, receiverId } });
      showToast("Gagal kirim pesan", "error");
      console.error("Error sending chat:", error);
      fetchMessages();
    }
  }, [token, userId, fetchMessages, enqueue]);

  const markRead = useCallback(async () => {
    try {
      await callDb("markChatRead", token);
      fetchMessages();
    } catch (error) {
      console.error("Error marking read:", error);
    }
  }, [token, fetchMessages]);

  return { messages, loading, sendMessage, markRead, flushOffline: flush };
}

// ─── Rindu Notifications ──────────────────────────────────────
export function useRindu(token: string) {
  const [rinduList, setRinduList] = useState<RinduNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const enabled = Boolean(token);

  const fetchRindu = useCallback(async () => {
    if (!token) return;
    try {
      const data = await callDb("getRinduNotifications", token);
      setRinduList(data.map((r: any) => ({
        id: r.id,
        senderId: r.senderId,
        receiverId: r.receiverId,
        level: r.level as RinduLevel,
        message: r.message || undefined,
        createdAt: new Date(r.createdAt),
        respondedAt: r.respondedAt ? new Date(r.respondedAt) : undefined,
        response: r.response,
      })));
    } catch (error) {
      console.error("Error fetching rindu:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  usePolling(fetchRindu, 15000, enabled);
  useRealtimeRefetch("rindu_notifications", fetchRindu, enabled);

  const sendRindu = useCallback(async (level: RinduLevel, receiverId: string, message?: string) => {
    try {
      await callDb("sendRindu", token, { level, receiverId, message });
      showToast(`${level === "rindu_banget" ? "Rindu banget" : level === "rindu" ? "Rindu" : "Kangen"} terkirim 💕`, "success");
    } catch (error) {
      showToast("Gagal kirim rindu", "error");
      console.error("Error sending rindu:", error);
    }
  }, [token]);

  const respondRindu = useCallback(async (id: string, response: "aku_juga" | "ignored") => {
    try {
      await callDb("respondRindu", token, { rinduId: id, response });
      fetchRindu();
    } catch (error) {
      console.error("Error responding rindu:", error);
    }
  }, [token, fetchRindu]);

  return { rinduList, loading, sendRindu, respondRindu };
}

// ─── Live Location ────────────────────────────────────────────
export function useLiveLocation(token: string, pollIntervalMs = 30000) {
  const [locations, setLocations] = useState<LiveLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const { flush } = useRetryQueue();
  const enabled = Boolean(token);

  const fetchLocations = useCallback(async () => {
    if (!token) return;
    try {
      const data = await callDb("getLocations", token);
      setLocations(data.map((l: any) => ({
        id: l.id,
        userId: l.userId,
        place: l.place,
        note: l.note || undefined,
        lat: l.lat,
        lng: l.lng,
        accuracy: l.accuracy,
        updatedAt: l.updatedAt ? new Date(l.updatedAt) : undefined,
      })));
    } catch (error) {
      console.error("Error fetching locations:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  usePolling(fetchLocations, pollIntervalMs, enabled);
  useRealtimeRefetch("ldr_locations", fetchLocations, enabled);

  const updateLocation = useCallback(async (data: {
    place?: string;
    note?: string;
    lat?: number;
    lng?: number;
    accuracy?: number;
  }) => {
    try {
      await callDb("addLocation", token, {
        place: data.place || "Lokasi saat ini",
        note: data.note,
        lat: data.lat,
        lng: data.lng,
        accuracy: data.accuracy,
      });
      fetchLocations();
    } catch (error) {
      showToast("Gagal update lokasi", "error");
      console.error("Error updating location:", error);
    }
  }, [token, fetchLocations]);

  return { locations, loading, updateLocation, flushOffline: flush };
}

// ─── Notifications ────────────────────────────────────────────
export function useNotifications(token: string) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const enabled = Boolean(token);

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const data = await callDb("getNotifications", token);
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  usePolling(fetchNotifications, 30000, enabled);
  useRealtimeRefetch("notifications", fetchNotifications, enabled);

  const markRead = useCallback(async () => {
    try {
      await callDb("markNotificationsAsRead", token);
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notifications:", error);
    }
  }, [token, fetchNotifications]);

  return { notifications, loading, markRead };
}

// ─── Gallery ──────────────────────────────────────────────────
export function useGallery(token: string) {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const enabled = Boolean(token);

  const fetchGallery = useCallback(async () => {
    if (!token) return;
    try {
      const data = await callDb("getGallery", token);
      setGallery(
        data.map((g: any) => ({
          id: g.id,
          url: g.url,
          caption: g.caption || undefined,
          createdAt: new Date(g.createdAt),
          createdBy: g.createdBy,
        }))
      );
    } catch (error) {
      console.error("Error fetching gallery:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  usePolling(fetchGallery, 20000, enabled);
  useRealtimeRefetch("gallery", fetchGallery, enabled);

  const addPhoto = useCallback(
    async (url: string, caption?: string) => {
      try {
        await callDb("addPhoto", token, { url, caption });
        showToast("Foto berhasil ditambahkan ke Galeri 📸", "success");
        fetchGallery();
      } catch (error) {
        showToast("Gagal menyimpan foto", "error");
        console.error("Error adding photo:", error);
      }
    },
    [token, fetchGallery]
  );

  const deletePhoto = useCallback(
    async (photoId: string) => {
      try {
        await callDb("deletePhoto", token, { photoId });
        showToast("Foto dihapus 🗑️", "success");
        fetchGallery();
      } catch (error) {
        showToast("Gagal menghapus foto", "error");
        console.error("Error deleting photo:", error);
      }
    },
    [token, fetchGallery]
  );

  return { gallery, loading, addPhoto, deletePhoto, refetch: fetchGallery };
}

// ─── Calendar Events ──────────────────────────────────────────
export function useCalendarEvents(token: string) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const enabled = Boolean(token);

  const fetchEvents = useCallback(async () => {
    if (!token) return;
    try {
      const data = await callDb("getCalendarEvents", token);
      setEvents(
        data.map((e: any) => ({
          id: e.id,
          title: e.title,
          date: new Date(e.date),
          type: e.type,
          description: e.description || undefined,
        }))
      );
    } catch (error) {
      console.error("Error fetching calendar events:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  usePolling(fetchEvents, 20000, enabled);
  useRealtimeRefetch("calendar_events", fetchEvents, enabled);

  const addEvent = useCallback(
    async (data: { title: string; date: string; type: string; description?: string }) => {
      try {
        await callDb("addCalendarEvent", token, data);
        showToast("Event ditambahkan ke Kalender 📅", "success");
        fetchEvents();
      } catch (error) {
        showToast("Gagal menambah event", "error");
        console.error("Error adding event:", error);
      }
    },
    [token, fetchEvents]
  );

  const deleteEvent = useCallback(
    async (eventId: string) => {
      try {
        await callDb("deleteCalendarEvent", token, { eventId });
        showToast("Event dihapus 🗑️", "success");
        fetchEvents();
      } catch (error) {
        showToast("Gagal menghapus event", "error");
        console.error("Error deleting event:", error);
      }
    },
    [token, fetchEvents]
  );

  return { events, loading, addEvent, deleteEvent, refetch: fetchEvents };
}

// ─── Letters & Fridge Notes ───────────────────────────────────
export function useLetters(token: string) {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const enabled = Boolean(token);

  const fetchLetters = useCallback(async () => {
    if (!token) return;
    try {
      const data = await callDb("getLetters", token);
      setLetters(
        data.map((l: any) => ({
          id: l.id,
          title: l.title,
          content: l.content,
          type: l.type,
          openDate: l.openDate ? new Date(l.openDate) : undefined,
          createdAt: new Date(l.createdAt),
          createdBy: l.createdBy,
        }))
      );
    } catch (error) {
      console.error("Error fetching letters:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  usePolling(fetchLetters, 15000, enabled);
  useRealtimeRefetch("letters", fetchLetters, enabled);

  const createLetter = useCallback(
    async (letter: { title: string; content: string; type: string; openDate?: string }) => {
      try {
        await callDb("createLetter", token, { letter });
        showToast("Surat / Memo berhasil disimpan 💌", "success");
        fetchLetters();
      } catch (error) {
        showToast("Gagal menyimpan surat", "error");
        console.error("Error creating letter:", error);
      }
    },
    [token, fetchLetters]
  );

  const deleteLetter = useCallback(
    async (letterId: string) => {
      try {
        await callDb("deleteLetter", token, { letterId });
        showToast("Surat / Memo dihapus 🗑️", "success");
        fetchLetters();
      } catch (error) {
        showToast("Gagal menghapus surat", "error");
        console.error("Error deleting letter:", error);
      }
    },
    [token, fetchLetters]
  );

  return { letters, loading, createLetter, deleteLetter, refetch: fetchLetters };
}

// ─── Love Meter ───────────────────────────────────────────────
export function useLoveMeter(token: string) {
  const [loveMeterList, setLoveMeterList] = useState<LoveMeter[]>([]);
  const [loading, setLoading] = useState(true);
  const enabled = Boolean(token);

  const fetchLoveMeter = useCallback(async () => {
    if (!token) return;
    try {
      const data = await callDb("getLoveMeter", token);
      setLoveMeterList(
        data.map((m: any) => ({
          userId: m.userId,
          percentage: m.percentage,
          createdAt: new Date(m.createdAt),
        }))
      );
    } catch (error) {
      console.error("Error fetching love meter:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  usePolling(fetchLoveMeter, 20000, enabled);
  useRealtimeRefetch("ldr_love_meter", fetchLoveMeter, enabled);

  const updateLoveMeter = useCallback(
    async (percentage: number) => {
      try {
        await callDb("updateLoveMeter", token, { percentage });
        showToast(`Love Meter diset ke ${percentage}% 💖`, "success");
        fetchLoveMeter();
      } catch (error) {
        showToast("Gagal update love meter", "error");
        console.error("Error updating love meter:", error);
      }
    },
    [token, fetchLoveMeter]
  );

  const latestLoveMeter = loveMeterList[0] || null;

  return { loveMeterList, latestLoveMeter, loading, updateLoveMeter, refetch: fetchLoveMeter };
}

// ─── Hugs ─────────────────────────────────────────────────────
export function useHugs(token: string) {
  const [hugs, setHugs] = useState<Hug[]>([]);
  const [loading, setLoading] = useState(true);
  const enabled = Boolean(token);

  const fetchHugs = useCallback(async () => {
    if (!token) return;
    try {
      const data = await callDb("getHugs", token);
      setHugs(
        data.map((h: any) => ({
          id: h.id,
          senderId: h.senderId,
          receiverId: h.receiverId,
          message: h.message,
          emoji: h.emoji,
          createdAt: new Date(h.createdAt),
        }))
      );
    } catch (error) {
      console.error("Error fetching hugs:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  usePolling(fetchHugs, 15000, enabled);
  useRealtimeRefetch("ldr_hugs", fetchHugs, enabled);

  const sendHug = useCallback(
    async (receiverId: string, message?: string) => {
      try {
        await callDb("sendHug", token, { receiverId, message });
        showToast("Peluk virtual terkirim 🤗💕", "success");
        fetchHugs();
      } catch (error) {
        showToast("Gagal mengirim pelukan", "error");
        console.error("Error sending hug:", error);
      }
    },
    [token, fetchHugs]
  );

  return { hugs, loading, sendHug, refetch: fetchHugs };
}

// ─── User Settings ────────────────────────────────────────────
export function useUserSettings(token: string) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const enabled = Boolean(token);

  // Server action sudah return UserSettings shape (camelCase) — pass through langsung.
  const fetchSettings = useCallback(async () => {
    if (!token) return;
    try {
      const data = await callDb("getUserSettings", token);
      if (data) {
        setSettings({
          relationshipStartDate: data.relationshipStartDate || undefined,
          distanceKm: data.distanceKm || undefined,
          nextMeetupDate: data.nextMeetupDate || undefined,
          secretPin: data.secretPin || "0101",
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    // Defer — fetchSettings memanggil setState; tidak boleh sinkron di effect.
    const t = setTimeout(fetchSettings, 0);
    return () => clearTimeout(t);
  }, [token, fetchSettings]);
  useRealtimeRefetch("user_settings", fetchSettings, enabled);

  const updateSettings = useCallback(
    async (data: Partial<UserSettings>) => {
      try {
        // Kirim camelCase — sesuai kontrak updateSettings server action.
        await callDb("updateSettings", token, {
          data: {
            relationshipStartDate: data.relationshipStartDate,
            distanceKm: data.distanceKm,
            nextMeetupDate: data.nextMeetupDate,
            secretPin: data.secretPin,
          },
        });
        showToast("Pengaturan tersimpan ✓", "success");
        fetchSettings();
      } catch (error) {
        showToast("Gagal menyimpan pengaturan", "error");
        console.error("Error updating settings:", error);
      }
    },
    [token, fetchSettings]
  );

  return { settings, loading, updateSettings, refetch: fetchSettings };
}

// ─── Shared User Extra (e.g. tree water count) ─────────────────
export function useUserExtra(token: string, key: string) {
  const [value, setValueState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const enabled = Boolean(token);

  const fetchExtra = useCallback(async () => {
    if (!token) return;
    try {
      const data = await callDb("getUserExtra", token, { key });
      setValueState(data);
    } catch (error) {
      console.error(`Error fetching extra ${key}:`, error);
    } finally {
      setLoading(false);
    }
  }, [token, key]);

  usePolling(fetchExtra, 20000, enabled);
  useRealtimeRefetch("user_extras", fetchExtra, enabled);

  const setValue = useCallback(
    async (newVal: string) => {
      setValueState(newVal);
      try {
        await callDb("setUserExtra", token, { key, value: newVal });
        fetchExtra();
      } catch (error) {
        console.error(`Error setting extra ${key}:`, error);
      }
    },
    [token, key, fetchExtra]
  );

  return { value, loading, setValue, refetch: fetchExtra };
}

