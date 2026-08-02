/* eslint-disable @typescript-eslint/no-explicit-any */

// LocalStorage fallback data layer — used when DB (Supabase) is unavailable
// Mirrors the /api/db action interface so callDb can transparently fall back

const PREFIX = "ryora-data-";

function getKey(action: string, pairId?: string) {
  return `${PREFIX}${action}${pairId ? `-${pairId}` : ""}`;
}

function read(key: string): any[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(key: string, data: any[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

function genId() {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getCurrentUserId(): string {
  if (typeof window === "undefined") return "user-1";
  try {
    const stored = localStorage.getItem("ryora-auth");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.user?.id || "user-1";
    }
  } catch {}
  return "user-1";
}

function getPairId(): string {
  if (typeof window === "undefined") return "pair-1";
  try {
    const stored = localStorage.getItem("ryora-auth");
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.user?.pair_id || "pair-1";
    }
  } catch {}
  return "pair-1";
}

// Handle read actions — return data from localStorage
export function localRead(action: string, _token: string, params?: any): any {
  const pairId = getPairId();
  const userId = getCurrentUserId();

  switch (action) {
    case "getMoods":
      return read(getKey("moods", pairId));
    case "getActivities":
      return read(getKey("activities", pairId));
    case "getGallery":
      return read(getKey("gallery", pairId));
    case "getCalendarEvents":
      return read(getKey("calendar", pairId));
    case "getLetters":
      return read(getKey("letters", pairId));
    case "getNotifications":
      return read(getKey("notifications", userId));
    case "getPresence":
      return read(getKey("presence", pairId));
    case "getStatusUpdates":
      return read(getKey("statusUpdates", pairId));
    case "getHugs":
      return read(getKey("hugs", pairId));
    case "getLoveMeter":
      const meter = read(getKey("loveMeter", pairId));
      return meter.length > 0 ? meter[0] : { percentage: 50 };
    case "getLocations":
      return read(getKey("locations", pairId));
    case "getPartnerId": {
      const myId = getCurrentUserId();
      const partnerId = myId === "user-1" ? "user-2" : "user-1";
      return { partnerId };
    }
    case "getUserSettings":
      try {
        const raw = localStorage.getItem(getKey("settings", userId));
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    case "getUserExtra":
      return null;
    case "getAchievements":
      return [];
    case "getChatMessages":
      return read(getKey("chat", pairId));
    case "getVoiceNotes":
      return read(getKey("voiceNotes", pairId));
    case "getGameScores":
      return read(getKey("gameScores", pairId));
    default:
      return [];
  }
}

// Handle write actions — save to localStorage
export function localWrite(action: string, token: string, params?: any): any {
  const pairId = getPairId();
  const userId = getCurrentUserId();

  switch (action) {
    case "addMood": {
      const items = read(getKey("moods", pairId));
      items.unshift({
        id: genId(),
        userId,
        mood: params.mood,
        note: params.note || null,
        createdAt: new Date().toISOString(),
      });
      write(getKey("moods", pairId), items);
      return items[0];
    }
    case "createActivity": {
      const items = read(getKey("activities", pairId));
      const newItem = {
        id: genId(),
        userId,
        pairId,
        title: params.title,
        type: params.type,
        date: params.date,
        description: params.description || null,
        completed: false,
        createdAt: new Date().toISOString(),
      };
      items.unshift(newItem);
      write(getKey("activities", pairId), items);
      return newItem;
    }
    case "toggleActivity": {
      const items = read(getKey("activities", pairId));
      const item = items.find((a: any) => a.id === params.activityId) as any;
      if (item) item.completed = params.completed;
      write(getKey("activities", pairId), items);
      return { success: true };
    }
    case "deleteActivity": {
      const items = read(getKey("activities", pairId));
      write(getKey("activities", pairId), items.filter((a: any) => a.id !== params.activityId));
      return { success: true };
    }
    case "addPhoto": {
      const items = read(getKey("gallery", pairId));
      const newItem = {
        id: genId(),
        userId,
        pairId,
        url: params.url,
        caption: params.caption || null,
        createdAt: new Date().toISOString(),
      };
      items.unshift(newItem);
      write(getKey("gallery", pairId), items);
      return newItem;
    }
    case "deletePhoto": {
      const items = read(getKey("gallery", pairId));
      write(getKey("gallery", pairId), items.filter((p: any) => p.id !== params.photoId));
      return { success: true };
    }
    case "addCalendarEvent": {
      const items = read(getKey("calendar", pairId));
      const newItem = {
        id: genId(),
        userId,
        pairId,
        title: params.title,
        date: params.date,
        type: params.type,
        description: params.description || null,
        createdAt: new Date().toISOString(),
      };
      items.unshift(newItem);
      write(getKey("calendar", pairId), items);
      return newItem;
    }
    case "deleteCalendarEvent": {
      const items = read(getKey("calendar", pairId));
      write(getKey("calendar", pairId), items.filter((e: any) => e.id === params.eventId));
      return { success: true };
    }
    case "createLetter": {
      const items = read(getKey("letters", pairId));
      const newItem = {
        id: genId(),
        userId,
        pairId,
        title: params.letter.title,
        content: params.letter.content,
        type: params.letter.type || "open",
        openDate: params.letter.openDate || null,
        createdAt: new Date().toISOString(),
        createdBy: userId,
      };
      items.unshift(newItem);
      write(getKey("letters", pairId), items);
      return newItem;
    }
    case "deleteLetter": {
      const items = read(getKey("letters", pairId));
      write(getKey("letters", pairId), items.filter((l: any) => l.id !== params.letterId));
      return { success: true };
    }
    case "updatePresence": {
      const items = read(getKey("presence", pairId));
      const existing = items.find((p: any) => p.userId === userId) as any;
      if (existing) {
        existing.status = params.status;
        existing.lastSeen = new Date().toISOString();
      } else {
        items.push({ userId, status: params.status, lastSeen: new Date().toISOString() });
      }
      write(getKey("presence", pairId), items);
      return { success: true };
    }
    case "addStatusUpdate": {
      const items = read(getKey("statusUpdates", pairId));
      const newItem = {
        id: genId(),
        userId,
        message: params.message,
        emoji: params.emoji || null,
        createdAt: new Date().toISOString(),
      };
      items.unshift(newItem);
      write(getKey("statusUpdates", pairId), items);
      return newItem;
    }
    case "sendHug": {
      const items = read(getKey("hugs", pairId));
      const newItem = {
        id: genId(),
        senderId: userId,
        receiverId: params.receiverId,
        message: params.message || null,
        emoji: "🤗",
        createdAt: new Date().toISOString(),
      };
      items.unshift(newItem);
      write(getKey("hugs", pairId), items);
      return newItem;
    }
    case "updateLoveMeter": {
      const items = read(getKey("loveMeter", pairId));
      const newItem = {
        id: genId(),
        userId,
        pairId,
        percentage: params.percentage,
        createdAt: new Date().toISOString(),
      };
      items.unshift(newItem);
      write(getKey("loveMeter", pairId), items.slice(0, 20));
      return newItem;
    }
    case "addLocation": {
      const items = read(getKey("locations", pairId));
      const newItem = {
        id: genId(),
        userId,
        place: params.place,
        note: params.note || null,
        createdAt: new Date().toISOString(),
      };
      items.unshift(newItem);
      write(getKey("locations", pairId), items);
      return newItem;
    }
    case "updateProfile":
    case "updateSettings": {
      try {
        localStorage.setItem(getKey("settings", userId), JSON.stringify(params.data));
      } catch {}
      return { success: true };
    }
    case "sendChatMessage": {
      const items = read(getKey("chat", pairId));
      const newItem = {
        id: genId(),
        userId,
        text: params.text,
        emoji: params.emoji || null,
        createdAt: new Date().toISOString(),
      };
      items.push(newItem);
      write(getKey("chat", pairId), items.slice(-100));
      return newItem;
    }
    case "addVoiceNote": {
      const items = read(getKey("voiceNotes", pairId));
      const newItem = {
        id: genId(),
        userId,
        audioUrl: params.audioUrl,
        duration: params.duration,
        title: params.title || null,
        createdAt: new Date().toISOString(),
      };
      items.unshift(newItem);
      write(getKey("voiceNotes", pairId), items);
      return newItem;
    }
    case "addGameScore": {
      const items = read(getKey("gameScores", pairId));
      const newItem = {
        id: genId(),
        userId,
        game: params.game,
        score: params.score,
        data: params.data || null,
        createdAt: new Date().toISOString(),
      };
      items.unshift(newItem);
      write(getKey("gameScores", pairId), items);
      return newItem;
    }
    case "markNotificationsAsRead":
      return { success: true };
    default:
      return { success: true };
  }
}

// Check if an action is a read operation
const READ_ACTIONS = [
  "getMoods", "getActivities", "getGallery", "getCalendarEvents", "getLetters",
  "getNotifications", "getPresence", "getStatusUpdates", "getHugs", "getLoveMeter",
  "getLocations", "getPartnerId", "getUserSettings", "getUserExtra", "getAchievements",
  "getChatMessages", "getVoiceNotes", "getGameScores",
];

export function isReadAction(action: string): boolean {
  return READ_ACTIONS.includes(action);
}
