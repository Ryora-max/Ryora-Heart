export interface User {
  id: string;
  name: string;
  username: string;
  role: "owner" | "partner";
  relationship: string;
  avatar_url?: string;
  token?: string;
  pairId?: string;
}

export interface RelationshipStats {
  daysTogether: number;
  firstChat: Date;
  firstCall: Date;
  firstMeet: Date;
  totalPhotos: number;
  totalLetters: number;
  totalTrips: number;
}

export interface MoodEntry {
  id: string;
  userId: string;
  mood: "happy" | "love" | "miss" | "excited" | "calm" | "sad";
  note?: string;
  createdAt: Date;
}

export interface Activity {
  id: string;
  title: string;
  description?: string;
  type: "schedule" | "reminder" | "milestone";
  date: Date;
  completed: boolean;
  createdBy: string;
}

export interface GalleryItem {
  id: string;
  url: string;
  caption?: string;
  createdAt: Date;
  createdBy: string;
  aspectRatio?: number;
}

export interface Letter {
  id: string;
  title: string;
  content: string;
  type: "open_when" | "love_letter" | "secret";
  openDate?: Date;
  createdAt: Date;
  createdBy: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: "vc" | "birthday" | "anniversary" | "reminder";
  description?: string;
}

export interface Hug {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  emoji: string;
  createdAt: Date;
}

export interface StatusUpdate {
  id: string;
  userId: string;
  message: string;
  emoji: string;
  createdAt: Date;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  requirement: {
    type: "days" | "photos" | "letters" | "trips" | "video_calls";
    value: number;
  };
}
