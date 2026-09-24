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
  const treeWaterCount = syncedTreeWater ? parseInt(syncedTreeWater, 10) || 12 : 12;
  const lovePoints = syncedLovePoints ? parseInt(syncedLovePoints, 10) || 0 : 0;
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
    onSendHeartPing();
    setTimeout(() => setWaterAnimation(false), 1500);
  };

  const handleFeedTreat = async (treat: string, name: string) => {
    playHeartPopSound();
    setFeedMessage(`Kamu menyuapkan ${treat} ${name} ke ${partnerName} dengan penuh cinta! 💕`);
    addLovePoints(1);
    onSendHeartPing();
    try {
      await sendHug(partnerId, `${myName} menyuapkan ${treat} ${name} di meja makan rumah! 😋💕`);
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
        className={`relative rounded-3xl p-4 sm:p-6 transition-all duration-700 border border-amber-900/10 shadow-2xl overflow-hidden ${getAmbienceBg()}`}
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
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2.5 mb-4 pb-3 border-b border-amber-900/10 dark:border-amber-100/10">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onReenterDoor}
              title="Ketuk Pintu Depan Rumah"
              className="group flex items-center justify-center w-9 h-9 rounded-2xl bg-amber-100/80 hover:bg-amber-200/80 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100 shadow-sm border border-amber-300/50 transition-transform active:scale-95 cursor-pointer"
            >
              <span className="text-lg group-hover:scale-110 transition-transform">🚪</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Rumah {myName} & {partnerName} 🏡
                </h2>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 dark:text-amber-200 bg-amber-200/60 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
                  <Flame size={11} className="text-orange-500 fill-orange-500 animate-pulse" />
                  {daysTogether} Hari
                </span>
              </div>
              <p className="text-[11px] opacity-80 font-medium flex items-center gap-1">
                {isPartnerOnline ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
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
                  : "bg-white/70 dark:bg-amber-950/60 border-amber-300/50 text-amber-900 dark:text-amber-200"
              }`}
              title="Dekorasi ruangan pakai Love Points"
            >
              🎨
              <span className="hidden sm:inline">Dekor</span>
            </button>
            <button
              onClick={handleToggleAmbience}
              className="px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer bg-white/70 dark:bg-amber-950/60 border-amber-300/50 shadow-sm hover:scale-105 active:scale-95"
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
                  : "bg-white/70 dark:bg-amber-950/60 border-amber-300/50 text-amber-900 dark:text-amber-200"
              }`}
              title={musicPlaying ? "Matikan Melodi Cozy" : "Putar Melodi Romantis"}
            >
              {musicPlaying ? <Volume2 size={14} className="animate-pulse" /> : <VolumeX size={14} />}
            </button>
          </div>
        </div>

        {/* Room Navigation Tabs (Game Style ala Talking Tom Friends) */}
        <div className="relative z-10 grid grid-cols-4 gap-1.5 mb-4 p-1 rounded-2xl bg-amber-900/10 dark:bg-black/20 backdrop-blur-md border border-amber-900/10 dark:border-white/10">
          <button
            onClick={() => handleRoomChange("living")}
            className={`flex flex-col sm:flex-row items-center justify-center gap-1 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeRoom === "living"
                ? "bg-white dark:bg-amber-900/80 text-amber-950 dark:text-amber-100 shadow-md scale-100 border border-amber-200/60 dark:border-amber-700"
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
                ? "bg-white dark:bg-amber-900/80 text-amber-950 dark:text-amber-100 shadow-md scale-100 border border-amber-200/60 dark:border-amber-700"
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
                ? "bg-white dark:bg-amber-900/80 text-amber-950 dark:text-amber-100 shadow-md scale-100 border border-amber-200/60 dark:border-amber-700"
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
                ? "bg-white dark:bg-amber-900/80 text-amber-950 dark:text-amber-100 shadow-md scale-100 border border-amber-200/60 dark:border-amber-700"
                : "opacity-70 hover:opacity-100"
            }`}
          >
            <span className="text-base">🌸</span>
            <span className="text-[10px] sm:text-xs">Taman</span>
          </button>
        </div>

        {/* FEED TREAT ALERT */}
        {feedMessage && (
          <div className="relative z-20 mb-3 p-2 rounded-xl bg-pink-500 text-white text-xs font-bold text-center shadow-lg animate-bounce">
            {feedMessage}
          </div>
        )}

        {/* CENTER STAGE: TALKING TOM STYLE CHARACTERS (Ryo & Ara) */}
        <div className="relative z-10 rounded-2xl p-2 sm:p-4 bg-white/40 dark:bg-black/20 backdrop-blur-sm border border-amber-900/5 dark:border-white/5 mb-4">
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
          />
        </div>

        {/* ================= ROOM DECOR STRIP ================= */}
        {activeDecor.length > 0 && (
          <div className="relative z-10 flex items-center justify-center gap-3 mb-3 py-2 px-3 rounded-2xl bg-white/40 dark:bg-black/20 border border-amber-900/10 dark:border-white/10 animate-fade-in-soft">
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
          <div className="relative z-10 mb-4 p-3.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-rose-200/60 dark:border-rose-900/40 shadow-md animate-fade-in-soft">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                🎨 Dekorasi Ruangan
              </h4>
              <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                💖 {lovePoints} Love Points
              </span>
            </div>

            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 font-semibold uppercase tracking-wide">Wallpaper ruangan ini</p>
            <div className="flex gap-2 mb-3 flex-wrap">
              {WALLPAPERS.map((w) => (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => handleSetWallpaper(w.id)}
                  aria-pressed={roomCustom.wallpaper[activeRoom] === w.id}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border-2 transition-all cursor-pointer bg-gradient-to-b ${w.cls} text-amber-950 dark:text-amber-100 ${
                    roomCustom.wallpaper[activeRoom] === w.id
                      ? "border-rose-500 scale-105 shadow-md"
                      : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>

            <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-2 font-semibold uppercase tracking-wide">Dekorasi (unlock pakai points)</p>
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
                        ? "bg-emerald-100/80 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 cursor-default"
                        : affordable
                        ? "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 hover:scale-105 cursor-pointer"
                        : "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed"
                    }`}
                  >
                    <span className="text-xl block">{item.emoji}</span>
                    <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 block leading-tight">
                      {item.label}
                    </span>
                    <span className="text-[9px] font-bold block mt-0.5">
                      {owned ? (
                        <span className="text-emerald-600 dark:text-emerald-400">✓ Terpasang</span>
                      ) : (
                        <span className="text-rose-500">💖 {item.cost}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center">
              Kumpulkan Love Points: siram pohon 💧 +1, suapin cemilan 🍓 +1, kirim memo 💌 +2
            </p>
          </div>
        )}

        {/* ================= ROOM SPECIFIC CONTENT ================= */}

        {/* ROOM 1: LIVING ROOM (Ruang Tamu & TV) */}
        {activeRoom === "living" && (
          <div className={`relative z-10 space-y-4 animate-fade-in-soft rounded-2xl bg-gradient-to-b ${activeWallpaper} p-3`}>
            {/* Interactive Smart TV */}
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-amber-950/60 backdrop-blur-md border border-amber-200/60 dark:border-amber-800/60 shadow-md">
              <div className="flex items-center justify-between mb-2 pb-2 border-b border-amber-200/40 dark:border-amber-800/40">
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
                  <p className="text-[11px] text-amber-900/80 dark:text-amber-200/80 mt-0.5">
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

            {/* Quick Live Activities Side-by-Side */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* My Status Card */}
              <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-amber-950/60 backdrop-blur-md border border-blue-200/60 dark:border-blue-900/60 shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-300">{isOwner ? "🤴" : "👸"} Status Kamu ({myName})</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-0.5">
                  {myActivity ? `✨ ${myActivity.title}` : "Sedang bersantai di rumah ☕"}
                </p>
                <Link
                  href="/live"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-2"
                >
                  Update kegiatan harian &rarr;
                </Link>
              </div>

              {/* Partner Status Card */}
              <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-amber-950/60 backdrop-blur-md border border-pink-200/60 dark:border-pink-900/60 shadow-sm">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-pink-900 dark:text-pink-300">{isOwner ? "👸" : "🤴"} Status {partnerName}</span>
                  <span className={`w-2 h-2 rounded-full ${isPartnerOnline ? "bg-emerald-500 animate-ping" : "bg-gray-400"}`} />
                </div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mb-0.5">
                  {partnerActivity ? `✨ ${partnerActivity.title}` : isPartnerOnline ? "Sedang aktif di rumah 💖" : "Sedang istirahat 💤"}
                </p>
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-pink-600 dark:text-pink-400 hover:underline mt-2"
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
            <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-amber-950/60 backdrop-blur-md border border-amber-200/60 dark:border-amber-800/60 shadow-sm">
              <h4 className="text-xs font-extrabold mb-2 flex items-center gap-1.5">
                <span>🍽️ Meja Makan Virtual: Suapin {partnerName} Cemilan!</span>
              </h4>
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => handleFeedTreat("🍓", "Strawberry Segar")}
                  className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 border border-rose-200/60 flex flex-col items-center gap-1 text-[11px] font-semibold transition-transform active:scale-95 cursor-pointer"
                >
                  <span className="text-xl">🍓</span>
                  <span>Strawberry</span>
                </button>
                <button
                  onClick={() => handleFeedTreat("🧋", "Boba Brown Sugar")}
                  className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 border border-amber-200/60 flex flex-col items-center gap-1 text-[11px] font-semibold transition-transform active:scale-95 cursor-pointer"
                >
                  <span className="text-xl">🧋</span>
                  <span>Boba</span>
                </button>
                <button
                  onClick={() => handleFeedTreat("☕", "Kopi Hangat")}
                  className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 border border-orange-200/60 flex flex-col items-center gap-1 text-[11px] font-semibold transition-transform active:scale-95 cursor-pointer"
                >
                  <span className="text-xl">☕</span>
                  <span>Kopi</span>
                </button>
                <button
                  onClick={() => handleFeedTreat("🥞", "Pancake Manis")}
                  className="p-2 rounded-xl bg-yellow-50 dark:bg-yellow-950/40 hover:bg-yellow-100 border border-yellow-200/60 flex flex-col items-center gap-1 text-[11px] font-semibold transition-transform active:scale-95 cursor-pointer"
                >
                  <span className="text-xl">🥞</span>
                  <span>Pancake</span>
                </button>
              </div>
            </div>

            {/* Love Notes Fridge Component */}
            <LoveNotesFridge currentUserName={myName} partnerName={partnerName} onSendHeart={handleHeartClick} onEarnPoints={addLovePoints} />
          </div>
        )}

        {/* ROOM 3: BEDROOM (Kamar Tidur) */}
        {activeRoom === "bedroom" && (
          <div className={`relative z-10 space-y-4 animate-fade-in-soft rounded-2xl bg-gradient-to-b ${activeWallpaper} p-3`}>
            <div className="p-5 rounded-2xl bg-white/80 dark:bg-amber-950/70 backdrop-blur-md border border-rose-200/60 dark:border-rose-900/60 shadow-sm text-center">
              <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-500 mb-2 shadow-inner">
                <BedDouble size={28} />
              </div>

              <h3 className="text-sm font-black text-rose-950 dark:text-rose-100 mb-1">
                Kamar Tidur Berbintang & Pelukan Hangat
              </h3>
              <p className="text-xs text-rose-900/70 dark:text-rose-300/70 mb-4 max-w-sm mx-auto">
                Tempat melepas lelah setelah seharian beraktivitas, memeluk guling sambil membayangkan kamu di sebelahku.
              </p>

              {/* Blanket / Tuck In Button */}
              <div className="flex justify-center mb-4">
                <button
                  onClick={() => {
                    playChimeSound();
                    handleHeartClick();
                  }}
                  className="touch-press px-5 py-2.5 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold shadow-lg hover:shadow-xl flex items-center gap-2 cursor-pointer transition-transform"
                >
                  <span>🛌</span>
                  <span>Tarik Selimut & Peluk {partnerName} zZz</span>
                </button>
              </div>

              {/* Night Whispers Card */}
              <div className="p-3.5 rounded-xl bg-rose-50/80 dark:bg-rose-950/40 border border-rose-200/50 text-center">
                <p className="text-[11px] font-bold text-rose-950 dark:text-rose-200 mb-0.5">
                  Bisikan Kasih Malam Ini 🌙
                </p>
                <p className="text-xs text-rose-800 dark:text-rose-300 italic">
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
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50/90 to-teal-50/90 dark:from-emerald-950/50 dark:to-teal-950/50 backdrop-blur-md border border-emerald-200/60 dark:border-emerald-800/60 shadow-sm text-center">
              <div className="relative inline-block mb-2">
                <span className={`text-5xl block transition-transform ${waterAnimation ? "scale-125 animate-bounce" : ""}`}>
                  🌳
                </span>
                {waterAnimation && (
                  <span className="absolute -top-3 right-0 text-xl animate-ping">💧</span>
                )}
              </div>

              <h3 className="text-sm font-black text-emerald-950 dark:text-emerald-100 mb-0.5">
                Pohon Cinta {myName} & {partnerName} 🌱
              </h3>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mb-3">
                Sudah disiram dengan cinta sebanyak <strong className="text-emerald-600 dark:text-emerald-400">{treeWaterCount} kali</strong>
              </p>

              <button
                onClick={handleWaterTree}
                className="touch-press inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md cursor-pointer transition-transform"
              >
                <Droplets size={14} className={waterAnimation ? "animate-bounce" : ""} />
                <span>Siram Pohon Cinta 💧</span>
              </button>
            </div>

            {/* Radar LDR & Red Thread of Fate */}
            <div className="p-5 rounded-2xl bg-white/80 dark:bg-amber-950/70 backdrop-blur-md border border-teal-200/60 dark:border-teal-900/60 shadow-sm text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-600 mb-2 shadow-inner">
                <Compass size={24} className="animate-spin-slow" />
              </div>

              <h4 className="text-sm font-black text-teal-950 dark:text-teal-100 mb-1">
                Radar Benang Merah LDR 🧵
              </h4>
              <p className="text-xs text-teal-800/80 dark:text-teal-300/80 mb-3">
                Meskipun raga berada di koordinat berbeda, benang takdir kita selalu terhubung rapat.
              </p>

              <Link
                href="/map"
                className="touch-press inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all"
              >
                <MapPin size={14} />
                <span>Buka Radar & Peta Live Posisi &rarr;</span>
              </Link>
            </div>
          </div>
        )}

        {/* BOTTOM QUICK RINDU HEART EXPLOSION BUTTON */}
        <div className="relative z-10 mt-6 pt-4 border-t border-amber-900/10 dark:border-amber-100/10 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-400">
              Detak Rindu Instan
            </p>
            <p className="text-xs opacity-75">
              Ketuk untuk mengirimkan pelukan hangat realtime ke {partnerName}
            </p>
          </div>

          <button
            onClick={handleHeartClick}
            className={`touch-press flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs shadow-md transition-all cursor-pointer ${
              heartBurst
                ? "bg-rose-600 text-white scale-110 ring-4 ring-rose-300"
                : "bg-rose-500 hover:bg-rose-600 text-white"
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
