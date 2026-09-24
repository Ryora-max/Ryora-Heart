export interface User {
  id: string;
  name: string;
  username: string;
  role: "owner" | "partner";
  relationship: string;
  avatar_url?: string;
  token?: string;
  pair_id?: string;
  email?: string;
}

export interface MoodEntry {
  id: string;
  userId: string;
  mood: MoodType;
  note?: string;
  createdAt: Date;
}

export type MoodType = "happy" | "love" | "miss" | "excited" | "calm" | "sad" | "busy" | "sleepy";

export interface Activity {
  id: string;
  title: string;
  description?: string;
  type: "schedule" | "reminder" | "milestone";
  date: Date;
  completed: boolean;
  createdBy: string;
  mood?: MoodType;
  startTime?: Date;
  endTime?: Date;
  isLive?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date;
  readAt?: Date;
}

export type RinduLevel = "kangen" | "rindu" | "rindu_banget";

export interface RinduNotification {
  id: string;
  senderId: string;
  receiverId: string;
  level: RinduLevel;
  message?: string;
  createdAt: Date;
  respondedAt?: Date;
  response?: "aku_juga" | "ignored";
}

export interface LiveLocation {
  id: string;
  userId: string;
  place: string;
  note?: string;
  lat?: number;
  lng?: number;
  accuracy?: number;
  updatedAt?: Date;
}

export interface Presence {
  id: string;
  userId: string;
  status: "online" | "offline";
  lastSeen: Date;
}

export interface GalleryItem {
  id: string;
  url: string;
  caption?: string;
  createdAt: Date;
  createdBy: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: "date" | "anniversary" | "birthday" | "vc" | "reminder";
  description?: string;
}

export interface Letter {
  id: string;
  title: string;
  content: string;
  type: "love_letter" | "open_when" | "secret" | "fridge_note";
  openDate?: Date;
  createdAt: Date;
  createdBy: string;
}

export interface Hug {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  emoji: string;
  createdAt: Date;
}

export interface LoveMeter {
  userId: string;
  percentage: number;
  createdAt: Date;
}

export interface UserSettings {
  relationshipStartDate?: string;
  distanceKm?: string;
  nextMeetupDate?: string;
  secretPin?: string;
}

export interface AppNotification {
  id: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

