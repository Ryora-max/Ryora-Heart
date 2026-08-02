"use client";

export interface StatusPreset {
  id: string;
  label: string;
  emoji: string;
  color: string;
  bg: string;
}

export const STATUS_PRESETS: StatusPreset[] = [
  { id: "online", label: "Online", emoji: "💚", color: "text-emerald-600", bg: "bg-emerald-50/80 border-emerald-200" },
  { id: "gabut", label: "Gabut", emoji: "🌙", color: "text-amber-600", bg: "bg-amber-50/80 border-amber-200" },
  { id: "sibuk", label: "Sibuk", emoji: "📝", color: "text-blue-600", bg: "bg-blue-50/80 border-blue-200" },
  { id: "makan", label: "Lagi Makan", emoji: "🍜", color: "text-orange-600", bg: "bg-orange-50/80 border-orange-200" },
  { id: "jalan", label: "Lagi Jalan", emoji: "🚶", color: "text-purple-600", bg: "bg-purple-50/80 border-purple-200" },
  { id: "tidur", label: "Tidur", emoji: "😴", color: "text-indigo-600", bg: "bg-indigo-50/80 border-indigo-200" },
  { id: "kerja", label: "Kerja", emoji: "💻", color: "text-cyan-600", bg: "bg-cyan-50/80 border-cyan-200" },
  { id: "main", label: "Main Game", emoji: "🎮", color: "text-pink-600", bg: "bg-pink-50/80 border-pink-200" },
  { id: "dengar", label: "Dengar Musik", emoji: "🎧", color: "text-violet-600", bg: "bg-violet-50/80 border-violet-200" },
  { id: "rindu", label: "Rindu Kamu", emoji: "🥺", color: "text-rose-600", bg: "bg-rose-50/80 border-rose-200" },
];

export function getStatusPreset(status: string): StatusPreset {
  return STATUS_PRESETS.find((s) => s.id === status) || STATUS_PRESETS[0];
}

export interface TimeInfo {
  time: string;
  hour: number;
  isDay: boolean;
}

export function getTimeInZone(offset: number, now: Date): TimeInfo {
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const local = new Date(utc + offset * 3600000);
  const h = local.getHours();
  const m = local.getMinutes();
  return {
    time: `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
    hour: h,
    isDay: h >= 6 && h < 18,
  };
}

export interface RoomSpot {
  id: string;
  name: string;
  href: string;
  emoji: string;
  bg: string;
  wallColor: string;
  floorColor: string;
  furniture: { emoji: string; top: string; left: string; size?: string };
  label: string;
  desc: string;
  partnerActivity: string;
  accent: string;
}

export const ROOM_SPOTS: RoomSpot[] = [
  {
    id: "living-room",
    name: "Living Room",
    href: "/living-room",
    emoji: "💬",
    bg: "from-rose-100 via-pink-50 to-amber-50",
    wallColor: "#FFE4E1",
    floorColor: "#FFDAB9",
    furniture: { emoji: "💌", top: "50%", left: "50%", size: "text-3xl sm:text-4xl" },
    label: "Chat & Activities",
    desc: "Ngobrol & checklist bareng",
    partnerActivity: "lagi nunggu chat dari kamu",
    accent: "#FF69B4",
  },
  {
    id: "bedroom",
    name: "Bedroom",
    href: "/bedroom",
    emoji: "🛏️",
    bg: "from-violet-100 via-purple-50 to-rose-50",
    wallColor: "#E6E0F8",
    floorColor: "#F3E5F5",
    furniture: { emoji: "✉️", top: "50%", left: "50%", size: "text-3xl sm:text-4xl" },
    label: "Letters & Voice",
    desc: "Surat cinta & voice note",
    partnerActivity: "lagi baca surat cinta darimu",
    accent: "#9C27B0",
  },
  {
    id: "garden",
    name: "Garden",
    href: "/garden",
    emoji: "🌸",
    bg: "from-green-100 via-emerald-50 to-teal-50",
    wallColor: "#E0F2F1",
    floorColor: "#C8E6C9",
    furniture: { emoji: "🌷", top: "50%", left: "50%", size: "text-3xl sm:text-4xl" },
    label: "Gallery & Moods",
    desc: "Foto & mood harian",
    partnerActivity: "lagi lihat foto kita berdua",
    accent: "#4DB6AC",
  },
  {
    id: "rooftop",
    name: "Rooftop",
    href: "/rooftop",
    emoji: "🌙",
    bg: "from-indigo-100 via-blue-50 to-violet-50",
    wallColor: "#E8EAF6",
    floorColor: "#C5CAE9",
    furniture: { emoji: "🔭", top: "50%", left: "50%", size: "text-2xl sm:text-3xl" },
    label: "Calendar & Wishes",
    desc: "Jadwal & harapan bintang",
    partnerActivity: "lagi menatap bintang sambil mikir kamu",
    accent: "#5C6BC0",
  },
];

export const EXTRA_SPOTS = [
  { id: "secret-box", href: "/secret-box", emoji: "💝", label: "Secret Box", top: "6%", left: "90%" },
  { id: "ldr", href: "/ldr", emoji: "💞", label: "Love & Hugs", top: "6%", left: "10%" },
  { id: "game-arcade", href: "/game-arcade", emoji: "🎮", label: "Game Arcade", top: "94%", left: "90%" },
  { id: "settings", href: "/settings", emoji: "⚙️", label: "Settings", top: "94%", left: "10%" },
];

export interface Star {
  id: number;
  top: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
}

export function createStars(count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      top: ((i * 23 + 11) % 70),
      left: ((i * 29 + 17) % 100),
      size: ((i * 13 + 7) % 3) + 1,
      delay: ((i * 37 + 23) % 50) / 10,
      duration: 2 + ((i * 17 + 3) % 30) / 10,
    });
  }
  return stars;
}
