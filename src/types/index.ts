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
