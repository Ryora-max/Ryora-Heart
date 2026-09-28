"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Heart,
  MapPin,
  MessageCircle,
  Tv,
  BedDouble,
  Sun,
  Moon,
  Sunset,
  Volume2,
  VolumeX,
  Droplets,
  Compass,
  Flame,
} from "lucide-react";
import { useAuthStore } from "@/stores";
import {
  useHugs,
  useUserExtra,
  usePartnerId,
} from "@/hooks";
import { CoupleAvatars } from "./CoupleAvatars";
import { LoveNotesFridge } from "./LoveNotesFridge";
import { MusicPlayer } from "./MusicPlayer";
import { TicTacToe } from "./TicTacToe";
import { PhotoGallery } from "./PhotoGallery";
import {
  playHeartPopSound,
  playSwitchSound,
  playChimeSound,
  startCozyMelody,
  stopCozyMelody,
} from "@/lib/soundEffects";
import type { MoodEntry, Activity, Presence } from "@/types";

interface VirtualCozyHouseProps {
  daysTogether: number;
  daysUntilMeetup?: number | null;
  myName: string;
  partnerName: string;
  isOwner?: boolean;
  myPresence?: Presence;
  partnerPresence?: Presence;
  myMood?: MoodEntry;
  partnerMood?: MoodEntry;
  myActivity?: Activity;
  partnerActivity?: Activity;
  isPartnerOnline: boolean;
  onSendHeartPing: () => void;
  onReenterDoor: () => void;
}

type RoomType = "living" | "kitchen" | "bedroom" | "garden";
type TimeAmbience = "day" | "sunset" | "night";

// ─── Room Customization ──────────────────────────────────────
// State disimpan pair-scoped di user_extras key "room_custom" → JSON
// { wallpaper: Record<RoomType, string>, decor: string[] }
// Love points di user_extras key "love_points".

const WALLPAPERS = [
  { id: "cream", label: "Krim", cls: "from-[#FFF9F0] to-[#F7E9D2] dark:from-[#2A2018] dark:to-[#1E150E]" },
  { id: "rose", label: "Mawar", cls: "from-[#FFF0F3] to-[#FAD9E3] dark:from-[#2E1A22] dark:to-[#221118]" },
  { id: "mint", label: "Mint", cls: "from-[#EFF9F3] to-[#D5EDDE] dark:from-[#16241D] dark:to-[#0F1A14]" },
  { id: "lavender", label: "Lavender", cls: "from-[#F4F0FB] to-[#E2D8F5] dark:from-[#201A2E] dark:to-[#161022]" },
  { id: "sky", label: "Langit", cls: "from-[#EFF6FC] to-[#D3E7F5] dark:from-[#15202E] dark:to-[#0E1622]" },
] as const;

const DECOR_ITEMS = [
  { id: "plant", emoji: "🪴", label: "Tanaman Pojok", cost: 5 },
  { id: "photo", emoji: "🖼️", label: "Bingkai Foto Berdua", cost: 10 },
  { id: "bear", emoji: "🧸", label: "Boneka Beruang", cost: 15 },
  { id: "candle", emoji: "🕯️", label: "Lilin Aromaterapi", cost: 20 },
  { id: "balloon", emoji: "🎈", label: "Balon Cinta", cost: 25 },
  { id: "cat", emoji: "🐈", label: "Kucing Peliharaan", cost: 40 },
] as const;

type RoomCustom = {
  wallpaper: Record<RoomType, string>;
  decor: Record<RoomType, string[]>;
};

const DEFAULT_ROOM_CUSTOM: RoomCustom = {
  wallpaper: { living: "cream", kitchen: "cream", bedroom: "rose", garden: "mint" },
  decor: { living: [], kitchen: [], bedroom: [], garden: [] },
};

function parseRoomCustom(raw: string | null): RoomCustom {
  try {
    const p = raw ? (JSON.parse(raw) as Partial<RoomCustom>) : {};
    return {
      wallpaper: { ...DEFAULT_ROOM_CUSTOM.wallpaper, ...(p.wallpaper || {}) },
      decor: { ...DEFAULT_ROOM_CUSTOM.decor, ...(p.decor || {}) },
    };
  } catch {
    return DEFAULT_ROOM_CUSTOM;
  }
}

const TV_CHANNELS = [
  {
    title: "Movie Night Romantis 🎬",
    desc: "Nonton film berdua sambil pelukan virtual di sofa empuk.",
    icon: "🍿",
  },
  {
    title: "Lofi Cinta untuk Kita 🎵",
    desc: "Melodi lembut peneman rindu di kala jarak memisahkan.",
    icon: "🎶",
  },
  {
    title: "Koleksi Kenangan Manis 📸",
    desc: "Mengingat kembali tawa pertama kali kita mengobrol hingga larut.",
    icon: "💖",
  },
];

export function VirtualCozyHouse({
  daysTogether,
  daysUntilMeetup,
  myName,
  partnerName,
  isOwner = true,
  myMood,
  partnerMood,
  myActivity,
  partnerActivity,
  isPartnerOnline,
  onSendHeartPing,
  onReenterDoor,
}: VirtualCozyHouseProps) {
  const { token, user } = useAuthStore();
  const { sendHug } = useHugs(token || "");
  const { value: syncedTreeWater, setValue: setSyncedTreeWater } = useUserExtra(token || "", "tree_water_count");
  const { value: syncedLovePoints, setValue: setSyncedLovePoints } = useUserExtra(token || "", "love_points");
  const { value: syncedRoomCustom, setValue: setSyncedRoomCustom } = useUserExtra(token || "", "room_custom");
  const { partnerId } = usePartnerId(token || "", user?.id);

  const [activeRoom, setActiveRoom] = useState<RoomType>("living");
  const [ambience, setAmbience] = useState<TimeAmbience>("day");
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);
  const [currentTvChannel, setCurrentTvChannel] = useState(0);
  const [waterAnimation, setWaterAnimation] = useState(false);
  const [feedMessage, setFeedMessage] = useState<string | null>(null);
  const [decorMode, setDecorMode] = useState(false);

  // Synced Tree Water count
  const parsedWater = parseInt(syncedTreeWater ?? "", 10);
  const treeWaterCount = Number.isNaN(parsedWater) ? 12 : parsedWater;
  const parsedPoints = parseInt(syncedLovePoints ?? "", 10);
  const lovePoints = Number.isNaN(parsedPoints) ? 0 : parsedPoints;
  const roomCustom = parseRoomCustom(syncedRoomCustom);

  const addLovePoints = async (n: number) => {
    try {
      await setSyncedLovePoints((lovePoints + n).toString());
    } catch {
      // Graceful
    }
  };

  const handleSetWallpaper = async (wallpaperId: string) => {
    playSwitchSound();
    const next: RoomCustom = {
      ...roomCustom,
      wallpaper: { ...roomCustom.wallpaper, [activeRoom]: wallpaperId },
    };
    try {
      await setSyncedRoomCustom(JSON.stringify(next));
    } catch {
      // Graceful
    }
  };

  const handleUnlockDecor = async (itemId: string, cost: number) => {
    if (lovePoints < cost) return;
    playChimeSound();
    const next: RoomCustom = {
      ...roomCustom,
      decor: {
        ...roomCustom.decor,
        [activeRoom]: [...roomCustom.decor[activeRoom], itemId],
      },
    };
    try {
      await setSyncedLovePoints((lovePoints - cost).toString());
      await setSyncedRoomCustom(JSON.stringify(next));
    } catch {
      // Graceful
    }
  };

  // Cleanup music & speech when unmounted
  useEffect(() => {
    return () => {
      stopCozyMelody();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleRoomChange = (room: RoomType) => {
    playChimeSound();
    setActiveRoom(room);
  };

  const handleToggleAmbience = () => {
    playSwitchSound();
    setAmbience((prev) => (prev === "day" ? "sunset" : prev === "sunset" ? "night" : "day"));
  };

  const handleToggleMusic = () => {
    if (musicPlaying) {
      stopCozyMelody();
      setMusicPlaying(false);
    } else {
      startCozyMelody();
      setMusicPlaying(true);
    }
  };

  const handleHeartClick = () => {
    setHeartBurst(true);
    playHeartPopSound();
    onSendHeartPing();
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([40, 50, 40]);
    }
    setTimeout(() => setHeartBurst(false), 1200);
  };

  const handleWaterTree = async () => {
    setWaterAnimation(true);
    playChimeSound();
    const nextCount = treeWaterCount + 1;
    await setSyncedTreeWater(nextCount.toString());
    addLovePoints(1);
    setTimeout(() => setWaterAnimation(false), 1500);
  };

  const handleFeedTreat = async (treat: string, name: string) => {
    playHeartPopSound();
    setFeedMessage(`Kamu menyuapkan ${treat} ${name} ke ${partnerName} dengan penuh cinta! 💕`);
    addLovePoints(1);
    try {
      if (partnerId) {
        await sendHug(partnerId, `${myName} menyuapkan ${treat} ${name} di meja makan rumah! 😋💕`);
      }
    } catch {
      // Graceful
    }
    setTimeout(() => setFeedMessage(null), 3000);
  };


  // Wallpaper + dekor untuk room aktif
  const activeWallpaper =
    WALLPAPERS.find((w) => w.id === roomCustom.wallpaper[activeRoom])?.cls ||
    WALLPAPERS[0].cls;
  const activeDecor = roomCustom.decor[activeRoom] || [];

  // Background styling per ambience
  const getAmbienceBg = () => {
    switch (ambience) {
      case "day":
        return "bg-gradient-to-b from-[#FFFDF9] via-[#FAF3E8] to-[#F5EAD7] text-amber-950";
      case "sunset":
        return "bg-gradient-to-b from-[#FFE8D6] via-[#F9D5E5] to-[#EEACD0] text-purple-950";
      case "night":
        return "bg-gradient-to-b from-[#1E1724] via-[#17121C] to-[#0F0C14] text-amber-100";
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 pb-24 pt-1 animate-fade-in-soft">
      {/* Warm Ambient House Lighting Container */}
      <div
        className={`relative rounded-3xl p-4 sm:p-6 transition-all duration-700 border border-border shadow-2xl overflow-hidden ${getAmbienceBg()}`}
      >
        {/* Soft Ambient Glows */}
        <div
          className={`absolute -top-10 -right-10 w-72 h-72 rounded-full blur-[80px] pointer-events-none transition-opacity duration-700 ${
            ambience === "day"
              ? "bg-amber-300/30 opacity-70"
              : ambience === "sunset"
              ? "bg-rose-400/40 opacity-80"
              : "bg-indigo-900/50 opacity-90"
          }`}
        />
        <div
          className={`absolute bottom-0 -left-10 w-72 h-72 rounded-full blur-[80px] pointer-events-none transition-opacity duration-700 ${
            ambience === "day"
              ? "bg-rose-200/30 opacity-60"
              : ambience === "sunset"
              ? "bg-orange-300/40 opacity-70"
              : "bg-purple-950/60 opacity-90"
          }`}
        />

        {/* House Top Status & Controls */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 mb-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onReenterDoor}
              title="Ketuk Pintu Depan Rumah"
              className="group flex items-center justify-center w-9 h-9 rounded-2xl bg-surface-warm hover:bg-surface text-heading shadow-sm border border-border transition-transform active:scale-95 cursor-pointer"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">🚪</span>
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Rumah {myName} & {partnerName} 🏡
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-heading bg-primary-soft px-2 py-0.5 rounded-full whitespace-nowrap">
                  <Flame size={11} className="text-orange-500 fill-orange-500 animate-pulse" />
                  {daysTogether} Hari
                </span>
                {daysUntilMeetup !== null && daysUntilMeetup !== undefined && daysUntilMeetup >= 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-white px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap" style={{ background: "var(--gradient-primary)" }}>
                    💕 {daysUntilMeetup === 0 ? "Ketemu hari ini!" : `${daysUntilMeetup} hari lagi ketemu`}
                  </span>
                )}
              </div>
              <p className="text-[11px] opacity-80 font-medium flex items-center gap-1">
                {isPartnerOnline ? (
                  <span className="text-accent font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                    {partnerName} sedang bersamamu di rumah 💕
                  </span>
                ) : (
                  <span>Menantikan pasangan kembali ke pelukan ✨</span>
                )}
              </p>
            </div>
          </div>

          {/* Quick House Controls (Ambience & Melody & Decor) */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={() => setDecorMode((v) => !v)}
              className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${
                decorMode
                  ? "bg-rose-500 text-white border-rose-400"
                  : "bg-surface-warm border-border text-heading"
              }`}
              title="Dekorasi ruangan pakai Love Points"
            >
              🎨
              <span className="hidden sm:inline">Dekor</span>
            </button>
            <button
              onClick={handleToggleAmbience}
              className="px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer bg-surface-warm border-border shadow-sm hover:scale-105 active:scale-95"
              title="Ganti Suasana Waktu (Pagi / Senja / Malam)"
            >
              {ambience === "day" && <Sun size={14} className="text-amber-500" />}
              {ambience === "sunset" && <Sunset size={14} className="text-orange-500" />}
              {ambience === "night" && <Moon size={14} className="text-indigo-400" />}
              <span className="hidden sm:inline capitalize">{ambience}</span>
            </button>

            <button
              onClick={handleToggleMusic}
              aria-label={musicPlaying ? "Matikan Melodi Cozy" : "Putar Melodi Romantis"}
              aria-pressed={musicPlaying}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 ${
                musicPlaying
                  ? "bg-rose-500 text-white border-rose-400"
                  : "bg-surface-warm border-border text-heading"
              }`}
              title={musicPlaying ? "Matikan Melodi Cozy" : "Putar Melodi Romantis"}
            >
              {musicPlaying ? <Volume2 size={14} className="animate-pulse" /> : <VolumeX size={14} />}
            </button>
          </div>
        </div>

        {/* Room Navigation Tabs (Game Style ala Talking Tom Friends) */}
        <div className="relative z-10 grid grid-cols-4 gap-1.5 mb-4 p-1 rounded-2xl bg-black/5 dark:bg-white/5 backdrop-blur-md border border-border">
          <button
            onClick={() => handleRoomChange("living")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeRoom === "living"
                ? "text-white shadow-md scale-100 tab-active-gradient"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            <span className="text-base">🛋️</span>
            <span className="text-[10px] sm:text-xs">Tamu</span>
          </button>

          <button
            onClick={() => handleRoomChange("kitchen")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeRoom === "kitchen"
                ? "text-white shadow-md scale-100 tab-active-gradient"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            <span className="text-base">🍳</span>
            <span className="text-[10px] sm:text-xs">Dapur</span>
          </button>

          <button
            onClick={() => handleRoomChange("bedroom")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeRoom === "bedroom"
                ? "text-white shadow-md scale-100 tab-active-gradient"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            <span className="text-base">🛏️</span>
            <span className="text-[10px] sm:text-xs">Kamar</span>
          </button>

          <button
            onClick={() => handleRoomChange("garden")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeRoom === "garden"
                ? "text-white shadow-md scale-100 tab-active-gradient"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            <span className="text-base">🌸</span>
            <span className="text-[10px] sm:text-xs">Taman</span>
          </button>
        </div>

        {/* FEED TREAT ALERT */}
        {feedMessage && (
          <div className="relative z-20 mb-3 p-2 rounded-xl text-white text-xs font-bold text-center shadow-lg animate-bounce" style={{ background: "var(--gradient-primary)" }}>
            {feedMessage}
          </div>
        )}

        {/* CENTER STAGE: TALKING TOM STYLE CHARACTERS (Ryo & Ara) */}
        <div className="relative z-10 rounded-2xl p-2 sm:p-4 surface-card mb-4">
          <CoupleAvatars
            myName={myName}
            partnerName={partnerName}
            isOwner={isOwner}
            isPartnerOnline={isPartnerOnline}
            myActivity={myActivity}
            partnerActivity={partnerActivity}
            myMood={myMood}
            partnerMood={partnerMood}
            currentRoom={activeRoom}
            onSendHeart={handleHeartClick}
            onSendAction={(label, emoji) => {
              if (!partnerId) return;
              sendHug(partnerId, `${myName} mengirimkan ${label} ${emoji}`);
            }}
          />
        </div>

        {/* ================= ROOM DECOR STRIP ================= */}
        {activeDecor.length > 0 && (
          <div className="relative z-10 flex items-center justify-center gap-3 mb-3 py-2 px-3 rounded-2xl surface-card animate-fade-in-soft">
            {activeDecor.map((decorId, i) => {
              const item = DECOR_ITEMS.find((d) => d.id === decorId);
              return item ? (
                <span key={`${decorId}-${i}`} className="text-2xl drop-shadow-md animate-breathe" title={item.label}>
                  {item.emoji}
                </span>
              ) : null;
            })}
          </div>
        )}

        {/* ================= DECOR SHOP PANEL ================= */}
        {decorMode && (
          <div className="relative z-10 mb-4 p-3.5 rounded-2xl surface-card animate-fade-in-soft">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-extrabold text-heading">
                🎨 Dekorasi Ruangan
              </h4>
              <span className="text-[11px] font-bold text-primary bg-primary-soft px-2 py-0.5 rounded-full">
                💖 {lovePoints} Love Points
              </span>
            </div>

            <p className="text-[10px] text-muted mb-2 font-semibold uppercase tracking-wide">Wallpaper ruangan ini</p>
            <div className="flex gap-2 mb-3 flex-wrap">
              {WALLPAPERS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => handleSetWallpaper(w.id)}
                  aria-pressed={roomCustom.wallpaper[activeRoom] === w.id}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border-2 transition-all cursor-pointer bg-gradient-to-b ${w.cls} text-heading ${
                    roomCustom.wallpaper[activeRoom] === w.id
                      ? "border-primary scale-105 shadow-md"
                      : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>

            <p className="text-[10px] text-muted mb-2 font-semibold uppercase tracking-wide">Dekorasi (unlock pakai points)</p>
            <div className="grid grid-cols-3 gap-2">
              {DECOR_ITEMS.map((item) => {
                const owned = activeDecor.includes(item.id);
                const affordable = lovePoints >= item.cost;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={owned || !affordable}
                    onClick={() => handleUnlockDecor(item.id, item.cost)}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      owned
                        ? "bg-accent-soft border-accent/40 cursor-default"
                        : affordable
                        ? "bg-primary-soft border-primary/40 hover:scale-105 cursor-pointer"
                        : "bg-surface-warm border-border opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <span className="text-xl block">{item.emoji}</span>
                    <span className="text-[9px] font-bold text-heading block leading-tight">
                      {item.label}
                    </span>
                    <span className="text-[9px] font-bold block mt-0.5">
                      {owned ? (
                        <span className="text-accent">✓ Terpasang</span>
                      ) : (
                        <span className="text-primary">💖 {item.cost}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-muted mt-2 text-center">
              Kumpulkan Love Points: siram pohon 💧 +1, suapin cemilan 🍓 +1, kirim memo 💌 +2
            </p>
          </div>
        )}

        {/* ================= ROOM SPECIFIC CONTENT ================= */}

        {/* ROOM 1: LIVING ROOM (Ruang Tamu & TV) */}
        {activeRoom === "living" && (
          <div className={`relative z-10 space-y-4 animate-fade-in-soft rounded-2xl bg-gradient-to-b ${activeWallpaper} p-3`}>
            {/* Interactive Smart TV */}
            <div className="surface-card p-4">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-border">
                <div className="flex items-center gap-2">
                  <Tv size={16} className="text-rose-500" />
                  <span className="text-xs font-extrabold">TV Ruang Tamu {myName} & {partnerName}</span>
                </div>
                <button
                  onClick={() => {
                    playSwitchSound();
                    setCurrentTvChannel((prev) => (prev + 1) % TV_CHANNELS.length);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-200 text-[10px] font-bold hover:bg-rose-200 transition-colors cursor-pointer"
                >
                  Ganti Saluran 📺
                </button>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-gradient-to-r from-rose-50/80 to-amber-50/80 dark:from-rose-950/40 dark:to-amber-950/40 border border-rose-200/40">
                <span className="text-3xl">{TV_CHANNELS[currentTvChannel].icon}</span>
                <div>
                  <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                    {TV_CHANNELS[currentTvChannel].title}
                  </h4>
                  <p className="text-[11px] text-body mt-0.5">
                    {TV_CHANNELS[currentTvChannel].desc}
                  </p>
                </div>
              </div>
            </div>

            {/* Musik & Game Berdua */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <MusicPlayer />
              <TicTacToe partnerName={partnerName} />
            </div>

            {/* Galeri Kenangan — foto berdua */}
            <PhotoGallery />

            {/* Quick Live Activities Side-by-Side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* My Status Card */}
              <div className="surface-card p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-primary">{isOwner ? "🤴" : "👸"} Status Kamu ({myName})</span>
                  <span className="w-2 h-2 rounded-full bg-accent" />
                </div>
                <p className="text-xs font-bold text-heading mb-0.5">
                  {myActivity ? `✨ ${myActivity.title}` : "Sedang bersantai di rumah ☕"}
                </p>
                <Link
                  href="/live"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline mt-2"
                >
                  Update kegiatan harian &rarr;
                </Link>
              </div>

              {/* Partner Status Card */}
              <div className="surface-card p-3.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-secondary">{isOwner ? "👸" : "🤴"} Status {partnerName}</span>
                  <span className={`w-2 h-2 rounded-full ${isPartnerOnline ? "bg-accent animate-ping" : "bg-gray-400"}`} />
                </div>
                <p className="text-xs font-bold text-heading mb-0.5">
                  {partnerActivity ? `✨ ${partnerActivity.title}` : isPartnerOnline ? "Sedang aktif di rumah 💖" : "Sedang istirahat 💤"}
                </p>
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary hover:underline mt-2"
                >
                  <MessageCircle size={12} /> Kirim pesan rindu &rarr;
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ROOM 2: KITCHEN (Dapur & Kulkas Love Notes) */}
        {activeRoom === "kitchen" && (
          <div className={`relative z-10 space-y-4 animate-fade-in-soft rounded-2xl bg-gradient-to-b ${activeWallpaper} p-3`}>
            {/* Treat Feeding Bar */}
            <div className="surface-card p-3.5">
              <h4 className="text-xs font-extrabold mb-2 flex items-center gap-1.5">
                <span>🍽️ Meja Makan Virtual: Suapin {partnerName} Cemilan!</span>
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { emoji: "🍓", label: "Strawberry", name: "Strawberry Segar" },
                  { emoji: "🧋", label: "Boba", name: "Boba Brown Sugar" },
                  { emoji: "☕", label: "Kopi", name: "Kopi Hangat" },
                  { emoji: "🥞", label: "Pancake", name: "Pancake Manis" },
                ].map((t) => (
                  <button
                    key={t.label}
                    onClick={() => handleFeedTreat(t.emoji, t.name)}
                    className="p-2 rounded-xl bg-surface-warm hover:bg-peach-soft border border-border flex flex-col items-center gap-1 text-[11px] font-semibold text-heading transition-transform active:scale-95 cursor-pointer"
                  >
                    <span className="text-xl">{t.emoji}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Love Notes Fridge Component */}
            <LoveNotesFridge currentUserName={myName} partnerName={partnerName} onEarnPoints={addLovePoints} />
          </div>
        )}

        {/* ROOM 3: BEDROOM (Kamar Tidur) */}
        {activeRoom === "bedroom" && (
          <div className={`relative z-10 space-y-4 animate-fade-in-soft rounded-2xl bg-gradient-to-b ${activeWallpaper} p-3`}>
            <div className="surface-card p-5 text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-primary-soft flex items-center justify-center text-primary mb-2 shadow-inner">
                <BedDouble size={28} />
              </div>

              <h3 className="text-sm font-black text-heading mb-1">
                Kamar Tidur Berbintang & Pelukan Hangat
              </h3>
              <p className="text-xs text-body mb-4 max-w-sm mx-auto">
                Tempat melepas lelah setelah seharian beraktivitas, memeluk guling sambil membayangkan kamu di sebelahku.
              </p>

              {/* Blanket / Tuck In Button */}
              <div className="flex justify-center mb-4">
                <button
                  onClick={() => {
                    playChimeSound();
                    // Peluk malam = notifikasi ringan (hug), bukan ping rindu_banget.
                    if (partnerId) {
                      sendHug(partnerId, `${myName} menyelimuti & memelukmu selamat malam 🛌💕`).catch(() => {});
                    }
                  }}
                  className="touch-press btn-gradient px-5 py-2.5 rounded-full text-xs flex items-center gap-2 cursor-pointer"
                >
                  <span>🛌</span>
                  <span>Tarik Selimut & Peluk {partnerName} zZz</span>
                </button>
              </div>

              {/* Night Whispers Card */}
              <div className="p-3.5 rounded-xl bg-primary-soft border border-border text-center">
                <p className="text-[11px] font-bold text-heading mb-0.5">
                  Bisikan Kasih Malam Ini 🌙
                </p>
                <p className="text-xs text-body italic">
                  &ldquo;Tidur yang nyenyak ya sayang. Di dalam mimpi, tidak ada kilometer yang memisahkan kita.&rdquo;
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ROOM 4: GARDEN & RADAR (Taman Cinta & Radar LDR) */}
        {activeRoom === "garden" && (
          <div className={`relative z-10 space-y-4 animate-fade-in-soft rounded-2xl bg-gradient-to-b ${activeWallpaper} p-3`}>
            {/* Love Tree (Pohon Cinta yang Bisa Disiram) */}
            <div className="surface-card p-5 text-center" style={{ background: "color-mix(in srgb, var(--accent-soft) 55%, var(--surface))" }}>
              <div className="relative inline-block mb-2">
                <span className={`text-5xl block transition-transform ${waterAnimation ? "scale-125 animate-bounce" : ""}`}>
                  🌳
                </span>
                {waterAnimation && (
                  <span className="absolute -top-3 right-0 text-xl animate-ping">💧</span>
                )}
              </div>

              <h3 className="text-sm font-black text-heading mb-0.5">
                Pohon Cinta {myName} & {partnerName} 🌱
              </h3>
              <p className="text-[11px] text-body mb-3">
                Sudah disiram dengan cinta sebanyak <strong className="text-accent">{treeWaterCount} kali</strong>
              </p>

              <button
                onClick={handleWaterTree}
                className="touch-press inline-flex items-center gap-2 px-5 py-2 rounded-full text-white text-xs font-bold shadow-md cursor-pointer transition-transform hover:opacity-90"
                style={{ background: "var(--accent)" }}
              >
                <Droplets size={14} className={waterAnimation ? "animate-bounce" : ""} />
                <span>Siram Pohon Cinta 💧</span>
              </button>
            </div>

            {/* Radar LDR & Red Thread of Fate */}
            <div className="surface-card p-5 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-accent-soft flex items-center justify-center text-accent mb-2 shadow-inner">
                <Compass size={24} className="animate-spin-slow" />
              </div>

              <h4 className="text-sm font-black text-heading mb-1">
                Radar Benang Merah LDR 🧵
              </h4>
              <p className="text-xs text-body mb-3">
                Meskipun raga berada di koordinat berbeda, benang takdir kita selalu terhubung rapat.
              </p>

              <Link
                href="/map"
                className="touch-press inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-bold text-xs shadow-md hover:shadow-lg transition-all hover:opacity-90"
                style={{ background: "var(--accent)" }}
              >
                <MapPin size={14} />
                <span>Buka Radar & Peta Live Posisi &rarr;</span>
              </Link>
            </div>
          </div>
        )}

        {/* BOTTOM QUICK RINDU HEART EXPLOSION BUTTON */}
        <div className="relative z-10 mt-6 pt-4 border-t border-border flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-primary">
              Detak Rindu Instan
            </p>
            <p className="text-xs opacity-75">
              Ketuk untuk mengirimkan pelukan hangat realtime ke {partnerName}
            </p>
          </div>

          <button
            onClick={handleHeartClick}
            className={`touch-press btn-gradient flex items-center gap-2 px-4 py-2.5 rounded-full text-xs cursor-pointer ${
              heartBurst ? "scale-110 ring-4 ring-primary-soft" : ""
            }`}
          >
            <Heart size={16} className={`fill-white ${heartBurst ? "animate-ping" : ""}`} />
            <span>{heartBurst ? "Terkirim! 💖" : "Kirim Rindu"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
