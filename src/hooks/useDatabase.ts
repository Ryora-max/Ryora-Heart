/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { MoodEntry, Activity, ChatMessage, RinduNotification, RinduLevel, LiveLocation, Presence, MoodType } from "@/types";
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
  const { enqueue, flush } = useRetryQueue();

  const fetchPresence = useCallback(async () => {
    try {
      const data = await callDb("getPresence", token);
      setPresence(data.map((p: any) => ({
        id: p.id,
        userId: p.userId,
        status: p.status,
        lastSeen: new Date(p.lastSeen),
      })));
    } catch (error) {
      enqueue({ action: "getPresence", token });
      console.error("Error fetching presence:", error);
    } finally {
      setLoading(false);
    }
  }, [token, enqueue]);

  usePolling(fetchPresence, 15000, true);
  useRealtimeRefetch("ldr_presence", fetchPresence, true);

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
  const [partnerId, setPartnerId] = useState<string | null>(null);
  useEffect(() => {
    if (!token || !userId) return;
    callDb("getPartnerId", token).then((data) => setPartnerId(data.partnerId)).catch(() => {});
  }, [token, userId]);
  return { partnerId };
}

// ─── Moods ────────────────────────────────────────────────────
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
        mood: m.mood as MoodType,
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

  usePolling(fetchMoods, 30000, true);
  useRealtimeRefetch("moods", fetchMoods, true);

  const addMood = useCallback(async (mood: { mood: MoodType; note?: string }) => {
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

// ─── Live Activities (with mood + time) ───────────────────────
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
        mood: a.mood as MoodType | undefined,
        startTime: a.startTime ? new Date(a.startTime) : undefined,
        endTime: a.endTime ? new Date(a.endTime) : undefined,
        isLive: a.isLive,
      })));
    } catch (error) {
      enqueue({ action: "getActivities", token });
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  }, [token, enqueue]);

  usePolling(fetchActivities, 30000, true);
  useRealtimeRefetch("activities", fetchActivities, true);

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
      showToast("Gagal membuat activity", "error");
      console.error("Error creating activity:", error);
    }
  }, [token, fetchActivities]);

  const stopActivity = useCallback(async (id: string) => {
    try {
      await callDb("updateActivity", token, { activityId: id, title: undefined, description: undefined, endTime: new Date().toISOString(), isLive: false });
      showToast("Activity selesai ✓", "success");
      fetchActivities();
    } catch (error) {
      showToast("Gagal update activity", "error");
      console.error("Error stopping activity:", error);
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

  return { activities, loading, createActivity, stopActivity, deleteActivity, flushOffline: flush };
}

// ─── Chat ─────────────────────────────────────────────────────
export function useChat(token: string, pairId?: string, userId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { enqueue, flush } = useRetryQueue();

  const fetchMessages = useCallback(async () => {
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
      enqueue({ action: "getChatMessages", token });
      console.error("Error fetching chat:", error);
    } finally {
      setLoading(false);
    }
  }, [token, enqueue]);

  usePolling(fetchMessages, 10000, true);
  useRealtimeRefetch("chat_messages", fetchMessages, true);

  const sendMessage = useCallback(async (content: string, receiverId: string) => {
    try {
      await callDb("sendChatMessage", token, { content, receiverId });
      fetchMessages();
    } catch (error) {
      showToast("Gagal kirim pesan", "error");
      console.error("Error sending chat:", error);
    }
  }, [token, fetchMessages]);

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

  const fetchRindu = useCallback(async () => {
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

  usePolling(fetchRindu, 15000, true);
  useRealtimeRefetch("rindu_notifications", fetchRindu, true);

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
export function useLiveLocation(token: string) {
  const [locations, setLocations] = useState<LiveLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const { enqueue, flush } = useRetryQueue();

  const fetchLocations = useCallback(async () => {
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
      enqueue({ action: "getLocations", token });
      console.error("Error fetching locations:", error);
    } finally {
      setLoading(false);
    }
  }, [token, enqueue]);

  usePolling(fetchLocations, 30000, true);
  useRealtimeRefetch("ldr_locations", fetchLocations, true);

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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await callDb("getNotifications", token);
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  usePolling(fetchNotifications, 30000, true);
  useRealtimeRefetch("notifications", fetchNotifications, true);

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
