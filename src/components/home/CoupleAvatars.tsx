"use client";

import { useState, useEffect, useId } from "react";
import {
  Heart,
  Sparkles,
} from "lucide-react";
import {
  playHeartPopSound,
  playKissSound,
  playPurrSound,
  playChimeSound,
} from "@/lib/soundEffects";
import type { Activity, MoodEntry } from "@/types";

interface CoupleAvatarsProps {
  myName: string;
  partnerName: string;
  isOwner: boolean; // true if logged in as Ryo, false if Ara
  isPartnerOnline: boolean;
  myActivity?: Activity;
  partnerActivity?: Activity;
  myMood?: MoodEntry;
  partnerMood?: MoodEntry;
  currentRoom: "living" | "kitchen" | "bedroom" | "garden";
  onSendHeart: () => void;
  onSendAction?: (actionName: string, emoji: string) => void;
}

interface FloatingParticle {
  id: number;
  emoji: string;
  x: number;
  y: number;
}

export function CoupleAvatars({
  myName,
  partnerName,
  isOwner,
  isPartnerOnline,
  myActivity,
  partnerActivity,
  myMood,
  partnerMood,
  currentRoom,
  onSendHeart,
  onSendAction,
}: CoupleAvatarsProps) {
  const ryoEyeGradId = useId();
  const araEyeGradId = useId();
  const [ryoBlink, setRyoBlink] = useState(false);
  const [araBlink, setAraBlink] = useState(false);
  const [ryoBlush, setRyoBlush] = useState(false);
  const [araBlush, setAraBlush] = useState(false);
  const [selectedPartnerAction, setSelectedPartnerAction] = useState<string | null>(null);
  const [particles, setParticles] = useState<FloatingParticle[]>([]);

  // Realistic cute blinking loop
  useEffect(() => {
    const ryoInterval = setInterval(() => {
      setRyoBlink(true);
      setTimeout(() => setRyoBlink(false), 220);
    }, 3800 + Math.random() * 1500);

    const araInterval = setInterval(() => {
      setAraBlink(true);
      setTimeout(() => setAraBlink(false), 200);
    }, 4200 + Math.random() * 1200);

    return () => {
      clearInterval(ryoInterval);
      clearInterval(araInterval);
    };
  }, []);

  const spawnParticles = (emoji: string, origin: "ryo" | "ara") => {
    const newItems: FloatingParticle[] = Array.from({ length: 5 }).map((_, i) => ({
      id: Date.now() + i,
      emoji,
      x: (origin === "ryo" ? 25 : 75) + (Math.random() * 20 - 10),
      y: 60 - Math.random() * 30,
    }));
    setParticles((prev) => [...prev, ...newItems]);
    setTimeout(() => {
      setParticles((prev) => prev.filter((p) => !newItems.some((n) => n.id === p.id)));
    }, 1500);
  };

  const handleTapAvatar = (who: "ryo" | "ara") => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([40, 30, 40]);
    }

    if (who === "ryo") {
      setRyoBlush(true);
      playPurrSound();
      spawnParticles("💖", "ryo");
      setTimeout(() => setRyoBlush(false), 2000);
    } else {
      setAraBlush(true);
      playHeartPopSound();
      spawnParticles("💕", "ara");
      setTimeout(() => setAraBlush(false), 2000);
    }

    onSendHeart();
  };

  const handleAction = (label: string, emoji: string, sound: "kiss" | "pop" | "chime" | "purr") => {
    setSelectedPartnerAction(`${emoji} ${label}`);
    if (sound === "kiss") playKissSound();
    else if (sound === "pop") playHeartPopSound();
    else if (sound === "chime") playChimeSound();
    else playPurrSound();

    spawnParticles(emoji, isOwner ? "ara" : "ryo");
    if (onSendAction) {
      onSendAction(label, emoji);
    }
    onSendHeart();

    setTimeout(() => setSelectedPartnerAction(null), 3000);
  };

  // Activity Status text format
  const getActivityBubble = (userRole: "owner" | "partner") => {
    const isTargetOwner = userRole === "owner";
    const act = isTargetOwner ? (isOwner ? myActivity : partnerActivity) : (!isOwner ? myActivity : partnerActivity);
    const mood = isTargetOwner ? (isOwner ? myMood : partnerMood) : (!isOwner ? myMood : partnerMood);

    if (act?.title) {
      return act.title;
    }
    if (mood?.mood) {
      const moodMap: Record<string, string> = {
        happy: "Lagi happy banget! 😊",
        love: "Kangen kamu sayang 😍",
        miss: "Pengen ketemu... 🥺",
        excited: "Lagi semangat! 🤩",
        calm: "Santai di rumah 😌",
        sad: "Butuh pelukan 😢",
        busy: "Lagi fokus sebentar 🤓",
        sleepy: "Ngantuk zZz... 😴",
      };
      return moodMap[mood.mood] || "Di rumah bersama 💕";
    }

    if (currentRoom === "bedroom") return "Siap tidur pulas 🌙";
    if (currentRoom === "kitchen") return "Cari cemilan enak 🍰";
    if (currentRoom === "garden") return "Menatap langit bintang 🌟";
    return isTargetOwner ? "Bersantai di sofa 🛋️" : (isPartnerOnline ? "Sedang menemanimu ✨" : "Sedang istirahat 💤");
  };

  return (
    <div className="relative w-full select-none py-2">
      {/* Floating Action Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute text-2xl transition-all duration-1000 transform -translate-x-1/2 -translate-y-1/2 animate-bounce opacity-90"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
            }}
          >
            {p.emoji}
          </span>
        ))}
      </div>

      {/* Floating Action Banner Alert if tapped */}
      {selectedPartnerAction && (
        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-40 bg-white/95 dark:bg-amber-950/95 border border-rose-300 shadow-xl px-4 py-1.5 rounded-full text-xs font-bold text-rose-600 animate-fade-in-soft flex items-center gap-1.5">
          <Sparkles size={14} className="text-amber-500 animate-spin" />
          <span>{selectedPartnerAction}</span>
        </div>
      )}

      {/* Characters Stage: Ryo (Left) & Ara (Right) */}
      <div className="relative flex items-end justify-around px-2 sm:px-8 pt-10 min-h-[220px]">
        {/* CHARACTER 1: RYO (The Chibi Cool Cat) */}
        <div className="flex flex-col items-center group cursor-pointer relative z-20">
          {/* Thought Bubble */}
          <div
            onClick={() => handleTapAvatar("ryo")}
            className="mb-2 max-w-[130px] sm:max-w-[160px] p-2 rounded-2xl bg-white/95 dark:bg-amber-950/95 border border-blue-200 dark:border-blue-800 shadow-md text-center transition-transform group-hover:scale-105 active:scale-95 cursor-pointer relative"
          >
            <p className="text-[11px] sm:text-xs font-semibold text-blue-950 dark:text-blue-100 line-clamp-2 leading-snug">
              {getActivityBubble("owner")}
            </p>
            {/* Bubble Tail */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-amber-950 border-r border-b border-blue-200 dark:border-blue-800 transform rotate-45" />
          </div>

          {/* SVG Character Avatar: Ryo */}
          <div
            onClick={() => handleTapAvatar("ryo")}
            className="relative transform transition-all duration-300 group-hover:-translate-y-1 active:scale-95"
          >
            <svg
              width="110"
              height="120"
              viewBox="0 0 110 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-lg"
            >
              <defs>
                <linearGradient id={ryoEyeGradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" />
                  <stop offset="100%" stopColor="#1E3A8A" />
                </linearGradient>
              </defs>

              {/* Cat Ears */}
              <polygon points="25,40 10,12 44,28" fill="#6B7280" />
              <polygon points="25,38 15,18 39,28" fill="#F472B6" opacity="0.6" />
              <polygon points="85,40 100,12 66,28" fill="#6B7280" />
              <polygon points="85,38 95,18 71,28" fill="#F472B6" opacity="0.6" />

              {/* Head */}
              <ellipse cx="55" cy="55" rx="38" ry="34" fill="#9CA3AF" />
              <ellipse cx="55" cy="62" rx="24" ry="18" fill="#E5E7EB" />

              {/* Cheeks / Blush */}
              <circle cx="30" cy="64" r="5" fill="#F87171" opacity={ryoBlush ? "0.85" : "0.25"} />
              <circle cx="80" cy="64" r="5" fill="#F87171" opacity={ryoBlush ? "0.85" : "0.25"} />

              {/* Eyes */}
              {ryoBlink || currentRoom === "bedroom" ? (
                <>
                  <path d="M 33 54 Q 40 60 47 54" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <path d="M 63 54 Q 70 60 77 54" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </>
              ) : (
                <>
                  {/* Left Eye */}
                  <ellipse cx="40" cy="52" rx="6" ry="8" fill={`url(#${ryoEyeGradId})`} />
                  <circle cx="38" cy="49" r="2.5" fill="white" />
                  <circle cx="42" cy="54" r="1.2" fill="white" />
                  {/* Right Eye */}
                  <ellipse cx="70" cy="52" rx="6" ry="8" fill={`url(#${ryoEyeGradId})`} />
                  <circle cx="68" cy="49" r="2.5" fill="white" />
                  <circle cx="72" cy="54" r="1.2" fill="white" />
                </>
              )}

              {/* Nose & Mouth */}
              <polygon points="55,60 52,57 58,57" fill="#EC4899" />
              <path d="M 55 60 Q 50 67 45 64" stroke="#4B5563" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              <path d="M 55 60 Q 60 67 65 64" stroke="#4B5563" strokeWidth="1.8" strokeLinecap="round" fill="none" />

              {/* Whiskers */}
              <line x1="20" y1="58" x2="32" y2="60" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="18" y1="65" x2="31" y2="64" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="90" y1="58" x2="78" y2="60" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="92" y1="65" x2="79" y2="64" stroke="#6B7280" strokeWidth="1.5" strokeLinecap="round" />

              {/* Body & Hoodie/Suit */}
              <path d="M 28 85 C 28 78 82 78 82 85 L 87 115 C 87 118 23 118 23 115 Z" fill="#3B82F6" />
              {/* White collar/hoodie bib */}
              <path d="M 45 82 L 55 98 L 65 82 Z" fill="#EFF6FF" />

              {/* Crown / Prince Icon */}
              <polygon points="55,20 50,28 60,28" fill="#FBBF24" />
              <circle cx="55" cy="19" r="2" fill="#EF4444" />
            </svg>

            {/* Little Name Badge */}
            <div className="text-center mt-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border border-blue-300/60">
                🤴 {isOwner ? myName : partnerName}
              </span>
            </div>
          </div>
        </div>

        {/* CENTER INTERACTION / RED THREAD OF FATE */}
        <div className="flex flex-col items-center justify-center px-1 mb-6">
          <button
            onClick={() => {
              playHeartPopSound();
              spawnParticles("💘", "ryo");
              spawnParticles("💖", "ara");
              onSendHeart();
            }}
            title="Kirim Cinta Berdua"
            className="group relative p-2.5 sm:p-3 rounded-full bg-gradient-to-tr from-rose-500 via-pink-500 to-amber-400 text-white shadow-lg hover:scale-110 active:scale-90 transition-all cursor-pointer"
          >
            <Heart size={22} className="fill-white animate-pulse" />
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-rose-700 dark:text-rose-300 opacity-0 group-hover:opacity-100 transition-opacity">
              Tap Cinta 💕
            </span>
          </button>
        </div>

        {/* CHARACTER 2: ARA (The Cute Angela Style Cat) */}
        <div className="flex flex-col items-center group cursor-pointer relative z-20">
          {/* Thought Bubble */}
          <div
            onClick={() => handleTapAvatar("ara")}
            className="mb-2 max-w-[130px] sm:max-w-[160px] p-2 rounded-2xl bg-white/95 dark:bg-amber-950/95 border border-pink-200 dark:border-pink-800 shadow-md text-center transition-transform group-hover:scale-105 active:scale-95 cursor-pointer relative"
          >
            <p className="text-[11px] sm:text-xs font-semibold text-pink-950 dark:text-pink-100 line-clamp-2 leading-snug">
              {getActivityBubble("partner")}
            </p>
            {/* Bubble Tail */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-amber-950 border-r border-b border-pink-200 dark:border-pink-800 transform rotate-45" />
          </div>

          {/* SVG Character Avatar: Ara */}
          <div
            onClick={() => handleTapAvatar("ara")}
            className="relative transform transition-all duration-300 group-hover:-translate-y-1 active:scale-95"
          >
            <svg
              width="110"
              height="120"
              viewBox="0 0 110 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="drop-shadow-lg"
            >
              <defs>
                <linearGradient id={araEyeGradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" />
                  <stop offset="100%" stopColor="#047857" />
                </linearGradient>
              </defs>

              {/* Cat Ears */}
              <polygon points="25,40 10,12 44,28" fill="#FDF2F8" />
              <polygon points="25,38 15,18 39,28" fill="#F472B6" opacity="0.6" />
              <polygon points="85,40 100,12 66,28" fill="#FDF2F8" />
              <polygon points="85,38 95,18 71,28" fill="#F472B6" opacity="0.6" />

              {/* Pink Bow Ribbon on Ear */}
              <circle cx="28" cy="24" r="4.5" fill="#EC4899" />
              <polygon points="28,24 16,17 18,31" fill="#F43F5E" />
              <polygon points="28,24 40,17 38,31" fill="#F43F5E" />

              {/* Head (White Angelic Cat) */}
              <ellipse cx="55" cy="55" rx="38" ry="34" fill="#FFFFFF" />
              <ellipse cx="55" cy="63" rx="24" ry="18" fill="#FFF1F2" />

              {/* Cheeks / Blush */}
              <circle cx="30" cy="64" r="5" fill="#FB7185" opacity={araBlush ? "0.9" : "0.35"} />
              <circle cx="80" cy="64" r="5" fill="#FB7185" opacity={araBlush ? "0.9" : "0.35"} />

              {/* Eyes with Eyelashes */}
              {araBlink || currentRoom === "bedroom" ? (
                <>
                  <path d="M 33 54 Q 40 60 47 54" stroke="#9D174D" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                  <path d="M 63 54 Q 70 60 77 54" stroke="#9D174D" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                </>
              ) : (
                <>
                  {/* Eyelash details */}
                  <path d="M 33 46 L 31 43" stroke="#831843" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M 45 45 L 48 42" stroke="#831843" strokeWidth="1.5" strokeLinecap="round" />
                  {/* Left Eye (Emerald/Aqua) */}
                  <ellipse cx="40" cy="52" rx="6.5" ry="8" fill={`url(#${araEyeGradId})`} />
                  <circle cx="38" cy="49" r="2.8" fill="white" />
                  <circle cx="42" cy="54" r="1.3" fill="white" />

                  {/* Eyelash details right */}
                  <path d="M 65 45 L 62 42" stroke="#831843" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M 77 46 L 79 43" stroke="#831843" strokeWidth="1.5" strokeLinecap="round" />
                  {/* Right Eye */}
                  <ellipse cx="70" cy="52" rx="6.5" ry="8" fill={`url(#${araEyeGradId})`} />
                  <circle cx="68" cy="49" r="2.8" fill="white" />
                  <circle cx="72" cy="54" r="1.3" fill="white" />
                </>
              )}

              {/* Nose & Mouth */}
              <polygon points="55,60 52,57 58,57" fill="#FB7185" />
              <path d="M 55 60 Q 50 67 45 64" stroke="#831843" strokeWidth="1.8" strokeLinecap="round" fill="none" />
              <path d="M 55 60 Q 60 67 65 64" stroke="#831843" strokeWidth="1.8" strokeLinecap="round" fill="none" />

              {/* Whiskers */}
              <line x1="20" y1="58" x2="32" y2="60" stroke="#F472B6" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="18" y1="65" x2="31" y2="64" stroke="#F472B6" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="90" y1="58" x2="78" y2="60" stroke="#F472B6" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="92" y1="65" x2="79" y2="64" stroke="#F472B6" strokeWidth="1.5" strokeLinecap="round" />

              {/* Dress / Body */}
              <path d="M 28 85 C 28 78 82 78 82 85 L 87 115 C 87 118 23 118 23 115 Z" fill="#F43F5E" />
              {/* Pearl necklace */}
              <circle cx="48" cy="85" r="2" fill="#FCE7F3" />
              <circle cx="55" cy="87" r="2.5" fill="#FCE7F3" />
              <circle cx="62" cy="85" r="2" fill="#FCE7F3" />
            </svg>

            {/* Little Name Badge */}
            <div className="text-center mt-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-pink-100 dark:bg-pink-900/60 text-pink-800 dark:text-pink-200 border border-pink-300/60">
                👸 {isOwner ? partnerName : myName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Talking Tom & Friends Quick Action Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 px-2">
        <button
          onClick={() => handleAction("Peluk Erat", "🤗", "purr")}
          className="touch-press px-3 py-1.5 rounded-full bg-white/80 dark:bg-amber-950/80 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold shadow-sm hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-1 cursor-pointer transition-all"
        >
          <span>🤗</span> Peluk
        </button>
        <button
          onClick={() => handleAction("Kecup Manis", "💋", "kiss")}
          className="touch-press px-3 py-1.5 rounded-full bg-white/80 dark:bg-amber-950/80 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold shadow-sm hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-1 cursor-pointer transition-all"
        >
          <span>💋</span> Kecup
        </button>
        <button
          onClick={() => handleAction("Beri Bunga", "🌹", "chime")}
          className="touch-press px-3 py-1.5 rounded-full bg-white/80 dark:bg-amber-950/80 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold shadow-sm hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-1 cursor-pointer transition-all"
        >
          <span>🌹</span> Mawar
        </button>
        <button
          onClick={() => handleAction("Beri Boba", "🧋", "pop")}
          className="touch-press px-3 py-1.5 rounded-full bg-white/80 dark:bg-amber-950/80 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold shadow-sm hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-1 cursor-pointer transition-all"
        >
          <span>🧋</span> Boba
        </button>
        <button
          onClick={() => handleAction("Cubit Manja", "🤏", "pop")}
          className="touch-press px-3 py-1.5 rounded-full bg-white/80 dark:bg-amber-950/80 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold shadow-sm hover:bg-rose-50 dark:hover:bg-rose-950/50 flex items-center gap-1 cursor-pointer transition-all"
        >
          <span>🤏</span> Cubit
        </button>
      </div>
    </div>
  );
}
