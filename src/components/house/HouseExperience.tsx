"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import { usePresence, usePartnerId, useLoveMeter, useChat, useLetters, useGallery } from "@/hooks/useDatabase";
import { AmbientSoundToggle } from "@/components/house/AmbientSound";
import { useKnockKnock, KnockNotification } from "@/components/house/KnockKnock";
import { StatusPicker } from "@/components/house/StatusPicker";
import { Mascot } from "@/components/house/Mascot";
import { PartnerAvatar } from "@/components/house/PartnerAvatar";
import { getStatusPreset, getTimeInZone, ROOM_SPOTS, EXTRA_SPOTS, createStars } from "@/components/house/houseData";

type Phase = "exterior" | "entering" | "interior";

// ===== ROMANTIC EXTERIOR — Dreamy Night Sky =====
function HouseExterior({
  onEnter,
  isPartnerOnline,
  isEntering,
  partnerName,
  partnerStatus,
  onKnock,
  knocking,
  cooldown,
}: {
  onEnter: () => void;
  isPartnerOnline: boolean;
  isEntering: boolean;
  partnerName: string;
  partnerStatus: string;
  onKnock: () => void;
  knocking: boolean;
  cooldown: boolean;
}) {
  const stars = useMemo(() => createStars(50), []);
  const partnerPreset = getStatusPreset(partnerStatus);
  const [now, setNow] = useState(new Date());
  const [taps, setTaps] = useState(0);
  const [weather, setWeather] = useState<"clear" | "rain" | "snow">("clear");

  // Mood-based house tint — reflects partner's status
  const moodTint = useMemo(() => {
    const tints: Record<string, string> = {
      "online": "rgba(255,200,220,0.08)",
      "tidur": "rgba(180,180,220,0.06)",
      "rindu-kamu": "rgba(255,150,180,0.1)",
      "main-game": "rgba(200,180,255,0.06)",
      "dengar-musik": "rgba(180,200,255,0.06)",
      "jalan": "rgba(200,220,200,0.05)",
      "gabut": "rgba(220,220,200,0.05)",
    };
    return tints[partnerStatus] || "rgba(255,200,220,0.05)";
  }, [partnerStatus]);

  // Streak counter — consecutive days visited
  const streak = useMemo(() => {
    if (typeof window === "undefined") return 0;
    const today = new Date().toDateString();
    const lastVisit = localStorage.getItem("ryora-last-visit");
    const streakStr = localStorage.getItem("ryora-streak") || "0";
    let count = parseInt(streakStr, 10);
    if (lastVisit !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (lastVisit === yesterday) count += 1;
      else count = 1;
      localStorage.setItem("ryora-last-visit", today);
      localStorage.setItem("ryora-streak", String(count));
    }
    return count;
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  // Random weather — changes every 5 min
  useEffect(() => {
    const pick = () => {
      const r = Math.random();
      if (r < 0.15) setWeather("rain");
      else if (r < 0.22) setWeather("snow");
      else setWeather("clear");
    };
    pick();
    const id = setInterval(pick, 300000);
    return () => clearInterval(id);
  }, []);

  const hour = now.getHours();
  const isNight = hour >= 18 || hour < 6;
  const isDawn = (hour >= 5 && hour < 7) || (hour >= 17 && hour < 19);

  // Greeting based on time
  const greeting = hour < 5 ? "Tidur yang nyenyak, sayang 🌙" :
    hour < 11 ? "Selamat pagi, sayang ☀️" :
    hour < 15 ? "Selamat siang 💕" :
    hour < 18 ? "Selamat sore, sayang 🌸" :
    hour < 22 ? "Selamat malam, sayang 🌙" :
    "Jangan begadang ya, sayang 😴";

  // Soft romantic gradients
  const skyGradient = isNight
    ? "from-[#1a1a3e] via-[#2d2d5e] to-[#4a3a6b]"
    : isDawn && hour >= 17
    ? "from-[#6b5b8e] via-[#c89bb3] to-[#f4c2c2]"
    : isDawn
    ? "from-[#f4c2c2] via-[#f9d5d5] to-[#fce4ec]"
    : "from-[#fce4ec] via-[#f8e1e7] to-[#fff0f5]";

  return (
    <div className={`relative min-h-screen overflow-hidden bg-gradient-to-b ${skyGradient} transition-[background] duration-[2000ms]`}>
      {/* Stars — soft twinkle */}
      {isNight && (
        <div className="pointer-events-none absolute inset-0">
          {stars.map((star) => (
            <div
              key={star.id}
              className="absolute rounded-full bg-white"
              style={{
                width: `${star.size}px`,
                height: `${star.size}px`,
                top: `${star.top}%`,
                left: `${star.left}%`,
                opacity: 0.6,
                animation: `star-twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* Moon — soft glow */}
      {isNight && (
        <div className="absolute top-[8%] right-[10%] w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#fef9ef] animate-moon-pulse" style={{ boxShadow: "0 0 40px 15px rgba(254,249,239,0.3)" }}>
          <div className="absolute top-[25%] left-[30%] w-2.5 h-2.5 rounded-full bg-[#e8e0d0]/50" />
          <div className="absolute top-[50%] right-[25%] w-2 h-2 rounded-full bg-[#e8e0d0]/50" />
        </div>
      )}

      {/* Soft clouds — dreamy */}
      <div className="absolute top-[15%] left-0 opacity-40 text-4xl sm:text-5xl" style={{ animation: "cloud-drift 40s linear infinite" }}>☁️</div>
      <div className="absolute top-[25%] left-0 opacity-30 text-3xl sm:text-4xl" style={{ animation: "cloud-drift 55s linear 12s infinite" }}>☁️</div>

      {/* Floating hearts — ambient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {["💕", "✨", "💖", "🌸"].map((emoji, i) => (
          <div
            key={i}
            className="absolute text-sm opacity-25 animate-float-bounce"
            style={{
              top: `${15 + i * 20}%`,
              left: `${10 + i * 25}%`,
              animationDelay: `${i * 0.8}s`,
              animationDuration: `${4 + i * 0.5}s`,
          }}
          >
            {emoji}
          </div>
        ))}
      </div>

      {/* Weather FX — rain */}
      {weather === "rain" && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={`rain-${i}`}
              className="absolute w-px h-8 bg-blue-200/40"
              style={{
                left: `${(i * 3.3) % 100}%`,
                top: `-10%`,
                animation: `rain-fall ${0.5 + (i % 5) * 0.15}s linear ${(i % 7) * 0.1}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {/* Weather FX — snow */}
      {weather === "snow" && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={`snow-${i}`}
              className="absolute text-xs text-white/70"
              style={{
                left: `${(i * 5) % 100}%`,
                top: `-5%`,
                animation: `snow-fall ${4 + (i % 4)}s ease-in ${(i % 5) * 0.5}s infinite`,
              }}
            >
              ❄
            </div>
          ))}
        </div>
      )}

      {/* Shooting stars at night */}
      {isNight && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[0, 1].map((i) => (
            <div
              key={`shoot-${i}`}
              className="absolute"
              style={{
                top: `${10 + i * 20}%`,
                left: `${20 + i * 40}%`,
                animation: `shooting-star ${8 + i * 4}s ease-in ${i * 3}s infinite`,
              }}
            >
              <div className="w-16 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" style={{ transform: "rotate(-25deg)" }} />
            </div>
          ))}
        </div>
      )}

      {/* Top — greeting + partner status + streak */}
      <div className="absolute top-10 sm:top-12 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5">
        <p className="text-xs sm:text-sm font-medium text-white/70 italic animate-fade-in">{greeting}</p>
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/70 backdrop-blur-md shadow-md text-xs sm:text-sm font-medium border border-white/60">
          <span className={`w-2.5 h-2.5 rounded-full ${isPartnerOnline ? "bg-emerald-400 animate-pulse" : "bg-gray-300"}`} />
          {isPartnerOnline ? (
            <span className="text-gray-700">{partnerName} {partnerPreset.emoji} {partnerPreset.label}</span>
          ) : (
            <span className="text-gray-500">{partnerName} sedang pergi... 💤</span>
          )}
        </div>
        {streak > 1 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/70 backdrop-blur-sm shadow-sm text-[10px] font-medium text-amber-600 border border-amber-200/60">
            <span>🔥</span>
            <span>{streak} hari beruntun</span>
          </div>
        )}
      </div>

      {/* Main area — flat house + mascot */}
      <div className="relative flex flex-col items-center justify-center min-h-screen pt-20 pb-28">
        <div className={`relative ${isEntering ? "animate-door-zoom" : "animate-house-approach"}`} style={{ transformOrigin: "center 70%" }}>
          {/* Chimney */}
          <div className="absolute -top-1 right-10 sm:right-14 w-6 h-12 sm:w-7 sm:h-14 bg-[#d4a5a5] rounded-t-xl z-10">
            {[0, 1, 2].map((i) => (
              <div key={i} className="absolute -top-2 left-1/2 -translate-x-1/2 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white/40" style={{ animation: `chimney-smoke 4s ease-out ${i * 1.2}s infinite` }} />
            ))}
          </div>

          {/* Roof */}
          <div className="relative w-[220px] h-[90px] sm:w-[270px] sm:h-[105px] mx-auto rounded-t-[45px]" style={{ background: "linear-gradient(135deg, #d4a5a5, #c49b9b)", boxShadow: "0 4px 20px rgba(180,140,140,0.25)" }}>
            <div className="absolute inset-0 rounded-t-[45px] opacity-20" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.5), transparent 50%)" }} />
            <div className="absolute top-[25%] left-1/2 -translate-x-1/2 text-xl sm:text-2xl animate-pulse" style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))" }}>❤️</div>
          </div>

          {/* House body — mood-tinted */}
          <div className="relative w-[200px] h-[170px] sm:w-[240px] sm:h-[200px] mx-auto -mt-1 rounded-3xl overflow-hidden animate-house-wobble" style={{ background: `linear-gradient(180deg, #fff9f5, #fff0e8)`, boxShadow: "0 8px 35px rgba(180,140,140,0.15), inset 0 -4px 0 rgba(0,0,0,0.03)" }}>
            {/* Mood tint overlay */}
            <div className="absolute inset-0 pointer-events-none" style={{ background: moodTint }} />
            {/* Welcome sign */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
              <div className="px-3 py-1 rounded-full text-[10px] sm:text-xs font-medium text-rose-600 bg-white/80 backdrop-blur-sm shadow-sm border border-rose-100 animate-sign-swing" style={{ transformOrigin: "top center" }}>
                Rumah Kita 🏡
              </div>
            </div>

            {/* Windows */}
            <div className="absolute top-[35px] left-[14px] sm:left-[18px]">
              <div className={`relative w-[34px] h-[34px] sm:w-[42px] sm:h-[42px] rounded-2xl border-2 border-[#c49b9b] overflow-hidden ${isNight ? "animate-window-glow" : ""}`} style={{ background: isNight ? "radial-gradient(circle, #ffd9a0, #ffb74d)" : "radial-gradient(circle, #e3f2fd, #bbdefb)" }}>
                <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-[#c49b9b]" />
                <div className="absolute top-0 bottom-0 left-1/2 w-[1.5px] bg-[#c49b9b]" />
                {isNight && <div className="absolute inset-0 bg-amber-200/20" style={{ animation: "candle-flicker 3s ease-in-out infinite" }} />}
              </div>
            </div>
            <div className="absolute top-[35px] right-[14px] sm:right-[18px]">
              <div className={`relative w-[34px] h-[34px] sm:w-[42px] sm:h-[42px] rounded-2xl border-2 border-[#c49b9b] overflow-hidden ${isNight ? "animate-window-glow" : ""}`} style={{ background: isNight ? "radial-gradient(circle, #ffd9a0, #ffb74d)" : "radial-gradient(circle, #e3f2fd, #bbdefb)", animationDelay: "1.5s" }}>
                <div className="absolute top-1/2 left-0 right-0 h-[1.5px] bg-[#c49b9b]" />
                <div className="absolute top-0 bottom-0 left-1/2 w-[1.5px] bg-[#c49b9b]" />
                {isNight && <div className="absolute inset-0 bg-amber-200/20" style={{ animation: "candle-flicker 3.5s ease-in-out 0.5s infinite" }} />}
              </div>
            </div>

            {/* Door */}
            <button onClick={onEnter} className="absolute bottom-0 left-1/2 -translate-x-1/2 group cursor-pointer" aria-label="Masuk rumah">
              <div className={`relative w-[52px] h-[80px] sm:w-[60px] sm:h-[95px] rounded-t-[28px] rounded-b-lg transition-all duration-500 group-hover:scale-105 group-active:scale-95 ${isEntering ? "animate-door-swing" : ""}`} style={{ background: "linear-gradient(180deg, #b89589, #9c7a6e)", boxShadow: "inset -3px 0 6px rgba(0,0,0,0.15)", transformOrigin: "left center" }}>
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-amber-200/60 border border-[#9c7a6e]" />
                <div className="absolute top-1/2 right-1.5 text-xs sm:text-sm animate-pulse">💌</div>
              </div>
            </button>
          </div>

          {/* Ground shadow */}
          <div className="w-[100px] h-[10px] sm:w-[120px] sm:h-[12px] mx-auto rounded-full bg-rose-900/8 blur-sm -mt-0.5" />
        </div>

        {/* Mascot */}
        <div className="mt-6 animate-slide-up-bounce">
          <Mascot emoji="🧸" size="large" onTickle={() => setTaps((t) => t + 1)} />
        </div>
        {taps > 0 && (
          <div className="mt-3 text-center animate-pop-in-scale">
            <p className="text-xs sm:text-sm font-medium text-rose-200/80">
              {taps < 3 ? `Kamu mengirim ${taps}x cinta 💌` : taps < 7 ? `${taps} cinta terkirim... 💕` : `Kamu benar-benar rindu ya? (${taps}x) 🥺❤️`}
            </p>
          </div>
        )}
      </div>

      {/* Bottom action bar — soft, minimal */}
      <div className="absolute bottom-5 sm:bottom-7 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/70 backdrop-blur-md shadow-lg border border-white/60 animate-slide-up-bounce">
        <button
          onClick={onEnter}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-400 to-pink-400 text-white text-sm font-medium shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
        >
          Masuk 💌
        </button>
        <div className="w-px h-7 bg-rose-200" />
        <button
          onClick={onKnock}
          disabled={knocking || cooldown}
          className="w-11 h-11 rounded-xl bg-white/80 text-rose-400 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center text-lg disabled:opacity-40 border border-rose-100"
          aria-label="Ketuk pintu"
        >
          {knocking ? "🚪" : cooldown ? "⏳" : "🔔"}
        </button>
      </div>

      {/* Butterfly (day) or Fireflies (night) */}
      {!isNight && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[0, 1].map((i) => (
            <div
              key={`butterfly-${i}`}
              className="absolute text-lg"
              style={{
                top: `${40 + i * 20}%`,
                left: `${10 + i * 60}%`,
                animation: `butterfly-fly ${10 + i * 5}s ease-in-out ${i * 2}s infinite`,
              }}
            >
              🦋
            </div>
          ))}
        </div>
      )}
      {isNight && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={`firefly-${i}`}
              className="absolute w-1.5 h-1.5 rounded-full bg-amber-200"
              style={{
                top: `${30 + (i * 13) % 50}%`,
                left: `${(i * 17) % 100}%`,
                boxShadow: "0 0 6px 2px rgba(255,200,100,0.4)",
                animation: `firefly-glow ${3 + (i % 4)}s ease-in-out ${(i % 5) * 0.4}s infinite`,
              }}
            />
          ))}
        </div>
      )}

      {isEntering && <div className="absolute inset-0 bg-white animate-fade-to-white z-40 pointer-events-none" />}
    </div>
  );
}

// ===== ROMANTIC INTERIOR — Cozy & Warm =====
function HouseInterior({
  onOpenRoom,
  onGoOutside,
  isPartnerOnline,
  userName,
  partnerName,
  partnerEmoji,
  myEmoji,
  lovePercentage,
  partnerRoomIndex,
  partnerActivity,
  partnerStatus,
  myStatus,
  onUpdateStatus,
  roomBadges,
  galleryPhotos,
  isLoading,
  partnerTyping = false,
}: {
  onOpenRoom: (href: string) => void;
  onGoOutside: () => void;
  isPartnerOnline: boolean;
  userName: string;
  partnerName: string;
  partnerEmoji: string;
  myEmoji: string;
  lovePercentage: number;
  partnerRoomIndex: number;
  partnerActivity: string;
  partnerStatus: string;
  myStatus: string;
  onUpdateStatus: (status: string) => void;
  roomBadges: Record<string, number>;
  galleryPhotos: { id: string; emoji: string }[];
  isLoading?: boolean;
  partnerTyping?: boolean;
}) {
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [clockNow, setClockNow] = useState(new Date());
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [mascotTaps, setMascotTaps] = useState(0);
  const [longPressAction, setLongPressAction] = useState<{ emoji: string; text: string } | null>(null);
  const [lovePulse, setLovePulse] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [pressedRoom, setPressedRoom] = useState<string | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const [showToast, setShowToast] = useState<string | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const pullStartY = useRef(0);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevLoveRef = useRef(lovePercentage);
  const prevBadgesRef = useRef<Record<string, number>>({});

  useEffect(() => {
    const id = setInterval(() => setClockNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const myTime = useMemo(() => getTimeInZone(7, clockNow), [clockNow]);
  const partnerTime = useMemo(() => getTimeInZone(9, clockNow), [clockNow]);
  const isPartnerSleeping = partnerTime.hour >= 22 || partnerTime.hour < 6;

  const myPreset = getStatusPreset(myStatus);
  const partnerPreset = getStatusPreset(partnerStatus);

  const interiorHour = clockNow.getHours();
  const isInteriorNight = interiorHour >= 19 || interiorHour < 5;
  const isInteriorDusk = interiorHour >= 17 && interiorHour < 19;
  const bgGradient = isInteriorNight
    ? "linear-gradient(180deg, #2a2a4e 0%, #3d3a5e 40%, #5a4a6e 100%)"
    : isInteriorDusk
    ? "linear-gradient(180deg, #6b5b8e 0%, #c89bb3 40%, #f4c2c2 100%)"
    : interiorHour >= 5 && interiorHour < 7
    ? "linear-gradient(180deg, #f4c2c2 0%, #f9d5d5 40%, #fce4ec 100%)"
    : "linear-gradient(180deg, #fce4ec 0%, #fff0f5 40%, #fff5f8 100%)";

  // LDR countdown — days since last meeting (stored in localStorage)
  const ldrDays = useMemo(() => {
    if (typeof window === "undefined") return null;
    const lastMet = localStorage.getItem("ryora-last-met");
    if (!lastMet) return null;
    const diff = Date.now() - parseInt(lastMet, 10);
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [clockNow]);

  // Interior greeting
  const interiorGreeting = interiorHour < 5 ? "Masih malam, sayang 🌙" :
    interiorHour < 11 ? "Selamat pagi 💕" :
    interiorHour < 15 ? "Selamat siang, sayang ☀️" :
    interiorHour < 18 ? "Selamat sore 🌸" :
    interiorHour < 22 ? "Selamat malam 🌙" :
    "Jangan begadang ya 😴";

  // Auto-status suggestion based on time
  const suggestedStatus = interiorHour >= 22 || interiorHour < 5 ? "tidur" :
    interiorHour >= 6 && interiorHour < 9 ? "gabut" : null;

  // Love meter pulse + confetti
  useEffect(() => {
    if (lovePercentage > prevLoveRef.current) {
      setLovePulse(true);
      setTimeout(() => setLovePulse(false), 600);
      if (lovePercentage >= 100 && prevLoveRef.current < 100) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    }
    prevLoveRef.current = lovePercentage;
  }, [lovePercentage]);

  // Partner last seen
  const partnerLastSeen = useMemo(() => {
    if (isPartnerOnline) return null;
    if (typeof window === "undefined") return null;
    const stored = localStorage.getItem("ryora-partner-last-seen");
    if (!stored) return null;
    const diff = Date.now() - parseInt(stored, 10);
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "baru saja";
    if (mins < 60) return `${mins} menit lalu`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} jam lalu`;
    return `${Math.floor(hours / 24)} hari lalu`;
  }, [clockNow, isPartnerOnline]);

  // Daily love quote — changes each day based on date
  const dailyQuote = useMemo(() => {
    const quotes = [
      "Jarak bukan halangan, cinta kita justru bertumbuh dalam rindu.",
      "Setiap detik jauh darimu, aku belajar mencintai lebih dalam.",
      "Kamu adalah alasan aku tersenyum hari ini, bahkan dari jauh.",
      "Rindu ini bukan kelemahan, tapi bukti cinta kita nyata.",
      "Bintang malam ini sama dengan yang kamu lihat, kita terhubung.",
      "Setiap pagi aku berdoa, semoga harimu seindah cintamu padaku.",
      "Menunggu bukan masalah, selama ujungnya adalah kamu.",
    ];
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return quotes[dayOfYear % quotes.length];
  }, []);

  // House temperature based on love meter
  const houseTemp = useMemo(() => {
    if (lovePercentage >= 80) return { label: "Hangat & Nyaman", emoji: "🔥", color: "text-rose-500" };
    if (lovePercentage >= 50) return { label: "Lumayan Hangat", emoji: "♨️", color: "text-amber-500" };
    if (lovePercentage >= 25) return { label: "Sejuk", emoji: "🌤️", color: "text-blue-400" };
    return { label: "Dingin, butuh peluk", emoji: "🥶", color: "text-cyan-500" };
  }, [lovePercentage]);

  // Meetup countdown — days until next meeting (stored in localStorage)
  const meetupDays = useMemo(() => {
    if (typeof window === "undefined") return null;
    const next = localStorage.getItem("ryora-next-meet");
    if (!next) return null;
    const diff = parseInt(next, 10) - Date.now();
    if (diff < 0) return 0;
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, [clockNow]);

  // Sleep tracker — partner sleeping based on timezone
  const partnerSleeping = isPartnerSleeping;

  // Heartbeat sync — beat interval based on love meter
  const heartbeatInterval = useMemo(() => {
    if (lovePercentage >= 80) return 0.6;
    if (lovePercentage >= 50) return 0.9;
    if (lovePercentage >= 25) return 1.2;
    return 1.5;
  }, [lovePercentage]);

  // Surprise gift box — one per day
  const [giftOpened, setGiftOpened] = useState(false);
  const [giftContent, setGiftContent] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const today = new Date().toDateString();
    const lastGift = localStorage.getItem("ryora-gift-date");
    if (lastGift === today) setGiftOpened(true);
  }, []);

  const openGift = useCallback(() => {
    if (giftOpened) return;
    const gifts = [
      "Sebuah peluk virtual untuk hari ini 🤗",
      "1000 ciuman terkirim ke pasangan 😘",
      "Bintang keberuntungan untuk kalian berdua ⭐",
      "Doa indah untuk hubungan kalian 🙏",
      "Sepucuk surat cinta dari semesta 💌",
      "Sebuah lagu yang dibuat khusus untukmu 🎵",
    ];
    const gift = gifts[Math.floor(Math.random() * gifts.length)];
    setGiftContent(gift);
    setGiftOpened(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("ryora-gift-date", new Date().toDateString());
    }
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([20, 40, 20]);
  }, [giftOpened]);

  // Mood ring — combined mood color
  const moodRingColor = useMemo(() => {
    const myMood = myStatus;
    const partnerMood = partnerStatus;
    const bothOnline = isPartnerOnline;
    if (bothOnline && (myMood === "rindu-kamu" || partnerMood === "rindu-kamu")) return "#ff6b9d";
    if (bothOnline) return "#ff9a76";
    if (partnerMood === "tidur" || myMood === "tidur") return "#7b8ab8";
    return "#c4b89d";
  }, [myStatus, partnerStatus, isPartnerOnline]);

  // Notification toast for new badges
  useEffect(() => {
    const newBadges: string[] = [];
    for (const key of Object.keys(roomBadges)) {
      if ((roomBadges[key] || 0) > (prevBadgesRef.current[key] || 0)) {
        newBadges.push(key);
      }
    }
    if (newBadges.length > 0 && Object.keys(prevBadgesRef.current).length > 0) {
      const labels: Record<string, string> = { "living-room": "Pesan baru di ruang tamu!", "bedroom": "Surat cinta baru!", "garden": "Foto baru di galeri!" };
      const msg = newBadges.map((k) => labels[k] || "Notifikasi baru").join(" ");
      setShowToast(msg);
      setTimeout(() => setShowToast(null), 4000);
    }
    prevBadgesRef.current = roomBadges;
  }, [roomBadges]);

  // Sound on room click
  const playRoomSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(784, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
      setTimeout(() => ctx.close(), 300);
    } catch {}
  }, []);

  // Long-press mascot actions
  const handleMascotLongPress = useCallback(() => {
    const actions = [
      { emoji: "🤗", text: "Hug terkirim ke pasangan!" },
      { emoji: "😘", text: "Kiss terkirim ke pasangan!" },
      { emoji: "💞", text: "Heart burst terkirim!" },
    ];
    const action = actions[Math.floor(Math.random() * actions.length)];
    setLongPressAction(action);
    // Heartbeat sound
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      [0, 0.15].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 600;
        gain.gain.setValueAtTime(0.15, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.1);
      });
      setTimeout(() => ctx.close(), 500);
    } catch {}
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([30, 50, 30]);
    setTimeout(() => setLongPressAction(null), 2500);
  }, []);

  const handleMascotMouseDown = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      handleMascotLongPress();
    }, 600);
  }, [handleMascotLongPress]);

  const handleMascotMouseUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
    };
  }, []);

  // Pull-to-refresh (mobile)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      pullStartY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling) return;
    const diff = e.touches[0].clientY - pullStartY.current;
    if (diff > 0 && window.scrollY === 0) {
      setPullDistance(Math.min(diff * 0.5, 80));
    }
  }, [isPulling]);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance > 60) {
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(20);
      window.location.reload();
    }
    setPullDistance(0);
    setIsPulling(false);
  }, [pullDistance]);

  return (
    <div
      className="relative min-h-screen overflow-x-hidden animate-interior-reveal"
      style={{ background: bgGradient, transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined, transition: isPulling ? "none" : "transform 0.3s ease" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {pullDistance > 5 && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center" style={{ opacity: Math.min(pullDistance / 60, 1) }}>
          <div className={`text-2xl ${pullDistance > 60 ? "animate-spin" : ""}`} style={{ animationDuration: "1s" }}>💞</div>
          <span className="text-[10px] text-rose-400 font-medium">{pullDistance > 60 ? "Lepas untuk refresh" : "Tarik untuk refresh"}</span>
        </div>
      )}

      {/* Confetti at 100% love */}
      {showConfetti && (
        <div className="pointer-events-none absolute inset-0 z-50 overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={`confetti-${i}`}
              className="absolute text-sm"
              style={{
                left: `${(i * 3.3) % 100}%`,
                top: `-5%`,
                animation: `confetti-fall ${2 + (i % 4) * 0.5}s ease-in ${(i % 7) * 0.1}s forwards`,
              }}
            >
              {['💕', '✨', '💖', '🎉', '🌸', '💗'][i % 6]}
            </div>
          ))}
        </div>
      )}

      {/* Soft floating hearts */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {["💕", "✨", "💖", "🌸", "💕", "✨", "💗", "🤍"].map((emoji, i) => (
          <div key={i} className="absolute text-sm sm:text-base opacity-20 animate-float-bounce" style={{ top: `${8 + i * 12}%`, left: `${3 + i * 12}%`, animationDelay: `${i * 0.4}s`, animationDuration: `${3 + i * 0.3}s` }}>
            {emoji}
          </div>
        ))}
      </div>

      {/* Interior lamp glow at night */}
      {isInteriorNight && (
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,200,150,0.08), transparent 70%)" }} />
      )}

      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-28">
        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-2.5 mb-5 animate-pulse">
            <div className="h-10 rounded-xl bg-white/40" />
            <div className="h-10 rounded-xl bg-white/40" />
            <div className="h-8 rounded-xl bg-white/30" />
          </div>
        )}

        {/* Top — greeting + status + love + clock, soft cards */}
        {!isLoading && (
        <div className="space-y-2.5 mb-5">
          {/* Interior greeting */}
          <p className="text-center text-xs sm:text-sm font-medium italic text-gray-500/70 animate-fade-in">{interiorGreeting}</p>

          {/* Status row + suggestion */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStatusPicker(true)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all active:scale-95 cursor-pointer ${myPreset.bg} shadow-sm border`}
            >
              <span className="text-sm">{myPreset.emoji}</span>
              <span className={`text-xs font-medium ${myPreset.color}`}>Kamu: {myPreset.label}</span>
            </button>
            {suggestedStatus && suggestedStatus !== myStatus && (
              <button
                onClick={() => onUpdateStatus(suggestedStatus)}
                className="px-2.5 py-2 rounded-xl bg-rose-100/80 border border-rose-200 text-[10px] font-medium text-rose-500 animate-pulse cursor-pointer whitespace-nowrap"
              >
                💡 {suggestedStatus === "tidur" ? "Tidur?" : "Gabut?"}
              </button>
            )}
            <AmbientSoundToggle />
          </div>

          {/* Love meter — soft gradient + pulse */}
          <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/70 backdrop-blur-sm shadow-sm border border-rose-100 transition-transform duration-300 ${lovePulse ? "scale-[1.02] ring-2 ring-rose-300" : ""}`}>
            <span className="text-base">{myEmoji}</span>
            <div className="flex-1 h-3 rounded-full bg-rose-50 overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-rose-300 via-pink-400 to-rose-400 rounded-full transition-all duration-1000" style={{ width: `${Math.max(lovePercentage, 8)}%` }} />
              {lovePulse && <div className="absolute inset-0 rounded-full bg-rose-300/30 animate-ping" />}
            </div>
            <span className="text-xs font-medium text-rose-500 min-w-[35px] text-right">{lovePercentage}%</span>
            <span className="text-base">{partnerEmoji}</span>
          </div>

          {/* Clock — dual time */}
          <div className="flex items-center justify-center gap-3 px-4 py-2 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm border border-white/40 text-xs sm:text-sm">
            <span>{myTime.isDay ? "☀️" : "🌙"}</span>
            <span className="font-mono font-medium text-gray-600">{myTime.time}</span>
            <span className="text-gray-400 text-[10px]">Kamu</span>
            <span className="text-rose-200">─</span>
            <span>{partnerTime.isDay ? "☀️" : "🌙"}</span>
            <span className="font-mono font-medium text-gray-600">{partnerTime.time}</span>
            <span className="text-gray-400 text-[10px]">{partnerName}</span>
            {isPartnerSleeping && <span className="text-xs">😴</span>}
          </div>
        </div>
        )}

        {/* LDR Countdown */}
        {ldrDays !== null && (
          <div className="flex items-center justify-center gap-2 mb-4 px-4 py-2 rounded-xl bg-white/50 backdrop-blur-sm shadow-sm border border-white/40 text-xs sm:text-sm">
            <span className="text-rose-400">📅</span>
            <span className="text-gray-600 font-medium">{ldrDays} hari terakhir ketemu</span>
            <span className="text-gray-400">·</span>
            <span className="text-rose-400 italic">Rindu 💕</span>
          </div>
        )}

        {/* Daily love quote */}
        <div className="mb-4 px-5 py-3 rounded-2xl bg-gradient-to-br from-rose-50/80 to-pink-50/60 backdrop-blur-sm shadow-sm border border-rose-100/60 text-center">
          <p className="text-xs sm:text-sm italic text-rose-600/80 leading-relaxed">"{dailyQuote}"</p>
        </div>

        {/* House temperature */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-sm shadow-sm border border-white/40 text-xs ${houseTemp.color}`}>
            <span>{houseTemp.emoji}</span>
            <span className="font-medium">{houseTemp.label}</span>
          </div>
          {/* Mood ring */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-sm shadow-sm border border-white/40 text-xs text-gray-500">
            <span className="w-3 h-3 rounded-full transition-colors duration-700" style={{ background: moodRingColor, boxShadow: `0 0 8px ${moodRingColor}80` }} />
            <span className="font-medium">Mood</span>
          </div>
        </div>

        {/* Meetup countdown + Sleep tracker + Heartbeat */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          {/* Meetup countdown */}
          {meetupDays !== null && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50/70 backdrop-blur-sm shadow-sm border border-purple-100/60 text-xs text-purple-500">
              <span>🗓️</span>
              <span className="font-medium">{meetupDays === 0 ? "Hari ini ketemu! 🎉" : `${meetupDays} hari lagi`}</span>
            </div>
          )}
          {/* Sleep tracker */}
          {partnerSleeping && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50/70 backdrop-blur-sm shadow-sm border border-indigo-100/60 text-xs text-indigo-400">
              <span>😴</span>
              <span className="font-medium">{partnerName} sedang tidur</span>
            </div>
          )}
          {/* Heartbeat sync */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-sm shadow-sm border border-white/40 text-xs text-rose-400">
            <span style={{ animation: `heartbeat ${heartbeatInterval}s ease-in-out infinite` }}>💗</span>
            <span className="font-medium">Detak cinta</span>
          </div>
        </div>

        {/* Surprise gift box */}
        <div className="flex flex-col items-center mb-4">
          {!giftOpened ? (
            <button
              onClick={openGift}
              className="group flex flex-col items-center cursor-pointer"
              aria-label="Buka hadiah harian"
            >
              <div className="text-3xl transition-transform group-hover:scale-110 group-active:scale-90 animate-float-bounce">🎁</div>
              <span className="mt-1 text-[10px] font-medium text-rose-400">Buka hadiah hari ini!</span>
            </button>
          ) : giftContent ? (
            <div className="animate-pop-in-scale px-4 py-2.5 rounded-xl bg-gradient-to-br from-rose-50/80 to-pink-50/60 backdrop-blur-sm shadow-sm border border-rose-100/60 text-center max-w-xs">
              <p className="text-xs sm:text-sm text-rose-600/80 font-medium">{giftContent}</p>
              <span className="mt-1 block text-[10px] text-gray-400">Come back besok untuk hadiah baru ✨</span>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-gray-50/60 text-xs text-gray-400 text-center">
              🎁 Kamu sudah buka hadiah hari ini. Come back besok!
            </div>
          )}
        </div>

        {/* Photo memory wall — polaroid style */}
        {galleryPhotos.length > 0 && (
          <div className="flex items-center justify-center gap-2 mb-5">
            {galleryPhotos.map((photo, i) => (
              <div
                key={photo.id}
                className="relative bg-white p-1.5 pb-4 rounded-sm shadow-md border border-gray-100"
                style={{ transform: `rotate(${i === 0 ? -3 : 3}deg)`, width: "60px", height: "70px" }}
              >
                <div className="w-full h-full rounded-sm bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center text-lg">
                  {photo.emoji}
                </div>
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[7px] text-gray-400 font-medium">kenangan</div>
              </div>
            ))}
          </div>
        )}

        {/* Mascot — center, soft, with long-press */}
        <div
          className="flex flex-col items-center mb-5"
          onMouseDown={handleMascotMouseDown}
          onMouseUp={handleMascotMouseUp}
          onMouseLeave={handleMascotMouseUp}
          onTouchStart={handleMascotMouseDown}
          onTouchEnd={handleMascotMouseUp}
        >
          <Mascot emoji="🧸" size="medium" onTickle={() => setMascotTaps((t) => t + 1)} autoMessage />
          {longPressAction && (
            <div className="mt-2 animate-pop-in-scale flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-100/80 border border-rose-200">
              <span className="text-base">{longPressAction.emoji}</span>
              <span className="text-xs font-medium text-rose-600">{longPressAction.text}</span>
            </div>
          )}
          {mascotTaps > 0 && !longPressAction && (
            <p className="mt-2 text-xs font-medium text-rose-300/70 animate-pop-in-scale">
              {mascotTaps < 3 ? `${mascotTaps}x cinta terkirim 💌` : `Rindu ya? ${mascotTaps}x 🥺💕`}
            </p>
          )}
          <p className="mt-2 text-xs sm:text-sm text-gray-500/80 text-center max-w-xs italic">
            {isPartnerOnline ? `${partnerName} ${partnerActivity}` : `${partnerName} sedang pergi... 💤`}
          </p>
          {partnerTyping && isPartnerOnline && (
            <div className="mt-1 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50/80 border border-rose-100">
              <span className="text-[10px] text-rose-400 font-medium">{partnerName} sedang mengetik</span>
              <span className="flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: "0s", animationDuration: "0.8s" }} />
                <span className="w-1 h-1 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: "0.2s", animationDuration: "0.8s" }} />
                <span className="w-1 h-1 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: "0.4s", animationDuration: "0.8s" }} />
              </span>
            </div>
          )}
          {partnerLastSeen && !isPartnerOnline && (
            <p className="mt-0.5 text-[10px] text-gray-400/60">Terakhir online: {partnerLastSeen}</p>
          )}
          <p className="mt-1 text-[10px] text-gray-400/60">Hold untuk kirim hug/kiss 💞</p>
        </div>

        {/* Partner avatar — visible in interior */}
        {isPartnerOnline && (
          <div className="relative h-0">
            <PartnerAvatar
              isOnline={isPartnerOnline}
              roomIndex={partnerRoomIndex}
              activity={partnerActivity}
              partnerEmoji={partnerEmoji}
              partnerName={partnerName}
              statusEmoji={partnerPreset.emoji}
            />
          </div>
        )}

        {/* Room cards — soft, cozy, romantic */}
        <div className="grid grid-cols-2 gap-3">
          {ROOM_SPOTS.map((room, idx) => {
            const badge = roomBadges[room.id] || 0;
            return (
              <button
                key={room.id}
                onClick={() => { playRoomSound(); onOpenRoom(room.href); }}
                onMouseEnter={() => setHoveredRoom(room.id)}
                onMouseLeave={() => { setHoveredRoom(null); setPressedRoom(null); }}
                onMouseDown={() => setPressedRoom(room.id)}
                onMouseUp={() => setPressedRoom(null)}
                aria-label={`Masuk ${room.name}`}
                className={`relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:z-10 active:scale-95 focus-visible:ring-2 focus-visible:ring-rose-300 focus-visible:z-10 group bg-gradient-to-b ${room.bg} animate-room-pop-in border ${isPartnerOnline && partnerRoomIndex === idx ? "border-rose-300 ring-2 ring-rose-200/50" : "border-white/60"} shadow-sm`}
                style={{ height: "130px", animationDelay: `${idx * 0.1}s` }}
              >
                {/* Ripple on press */}
                {pressedRoom === room.id && (
                  <div className="absolute inset-0 z-10 bg-white/20 animate-ping pointer-events-none rounded-2xl" />
                )}
                {/* Soft wall texture */}
                <div className="absolute inset-0 opacity-15" style={{ background: `linear-gradient(180deg, ${room.wallColor} 0%, ${room.floorColor} 100%)` }} />

                {/* Night overlay */}
                {isInteriorNight && <div className="absolute inset-0 bg-indigo-950/20 pointer-events-none" />}

                {/* Gallery photos */}
                {(room.id === "living-room" || room.id === "bedroom") && galleryPhotos.length > 0 && (
                  <>
                    <div className="absolute top-2 right-2 w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-amber-200 bg-white/70 flex items-center justify-center text-sm shadow-sm">
                      {galleryPhotos[0]?.emoji || "🖼️"}
                    </div>
                    {galleryPhotos.length > 1 && (
                      <div className="absolute top-2 right-12 sm:right-14 w-8 h-8 sm:w-10 sm:h-10 rounded-lg border border-amber-200 bg-white/70 flex items-center justify-center text-sm shadow-sm">
                        {galleryPhotos[1]?.emoji || "🖼️"}
                      </div>
                    )}
                  </>
                )}

                {/* Floor */}
                <div className="absolute bottom-0 left-0 right-0 h-8 rounded-b-2xl" style={{ background: room.floorColor, opacity: 0.4 }} />

                {/* Furniture — soft wobble */}
                <div className={`absolute ${room.furniture.size || "text-3xl"} transition-transform duration-300 group-hover:scale-110 animate-furniture-wobble`} style={{ top: room.furniture.top, left: room.furniture.left, transform: "translate(-50%, -50%)" }}>
                  {room.furniture.emoji}
                </div>

                {/* Badge */}
                {badge > 0 && (
                  <div className="absolute top-2 right-2 z-20 min-w-[20px] h-5 px-1.5 rounded-full bg-rose-400 text-white text-[10px] font-medium flex items-center justify-center shadow-sm border border-white/80">
                    {badge > 9 ? "9+" : badge}
                  </div>
                )}

                {/* Room label — soft pill */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] sm:text-xs font-medium bg-white/80 backdrop-blur-sm shadow-sm whitespace-nowrap text-gray-600">
                  {room.label}
                </div>

                {/* Room icon */}
                <div className="absolute top-2 left-2 text-sm sm:text-base opacity-40">{room.emoji}</div>

                {/* Desc on hover */}
                <div className={`absolute bottom-2.5 left-1/2 -translate-x-1/2 text-[10px] text-center text-gray-500 bg-white/70 rounded-full px-2.5 py-0.5 transition-all duration-300 ${hoveredRoom === room.id ? "opacity-100" : "opacity-0"}`}>
                  {room.desc}
                </div>

                {/* Soft glow on hover */}
                <div className={`absolute inset-0 transition-opacity duration-300 ${hoveredRoom === room.id ? "opacity-100" : "opacity-0"}`} style={{ background: `radial-gradient(ellipse at center, ${room.accent}15, transparent 70%)` }} />

                {/* Partner here indicator */}
                {isPartnerOnline && partnerRoomIndex === idx && (
                  <div className="absolute top-2 left-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100/80 border border-rose-200 text-[9px] font-medium text-rose-500 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                    {partnerName}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Extra spots — soft floating bubbles */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
          {EXTRA_SPOTS.map((spot) => (
            <button
              key={spot.id}
              onClick={() => onOpenRoom(spot.href)}
              aria-label={spot.label}
              className="group flex flex-col items-center cursor-pointer focus-visible:ring-2 focus-visible:ring-rose-300 rounded-full"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/70 backdrop-blur-sm shadow-sm flex items-center justify-center text-xl sm:text-2xl transition-all group-hover:scale-105 group-active:scale-90 animate-float-bounce border border-rose-100">
                {spot.emoji}
              </div>
              <span className="mt-1 text-[10px] font-medium text-gray-500/70">
                {spot.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Notification toast */}
      {showToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-pop-in-scale">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/90 backdrop-blur-md shadow-lg border border-rose-100 text-xs sm:text-sm">
            <span className="text-base">💌</span>
            <span className="font-medium text-rose-600">{showToast}</span>
          </div>
        </div>
      )}

      {/* Goodbye overlay */}
      {isLeaving && (
        <div className="fixed inset-0 z-50 bg-gradient-to-b from-rose-50 to-pink-100 flex flex-col items-center justify-center animate-fade-to-white">
          <div className="text-5xl mb-3 animate-float-bounce">👋</div>
          <p className="text-sm font-medium text-rose-400 italic">Sampai jumpa, sayang 💕</p>
        </div>
      )}

      {/* Bottom action bar — soft, minimal */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/70 backdrop-blur-md shadow-lg border border-white/60">
        <button
          onClick={() => {
            setIsLeaving(true);
            setTimeout(onGoOutside, 800);
          }}
          className="px-5 py-2.5 rounded-xl bg-white/80 text-gray-600 text-sm font-medium shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer border border-rose-100"
        >
          🏠 Keluar
        </button>
        <div className="w-px h-7 bg-rose-100" />
        <button
          onClick={() => setShowStatusPicker(true)}
          className="w-11 h-11 rounded-xl bg-white/80 shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center text-lg border border-rose-100"
          aria-label="Ganti status"
        >
          {myPreset.emoji}
        </button>
      </div>

      {showStatusPicker && (
        <StatusPicker
          currentStatus={myStatus}
          onPick={onUpdateStatus}
          onClose={() => setShowStatusPicker(false)}
        />
      )}
    </div>
  );
}

// ===== Main =====
export function HouseExperience() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const [phase, setPhase] = useState<Phase>(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("ryora-entered")) return "interior";
    return "exterior";
  });

  const authToken = token || "";
  const { presence, updatePresence } = usePresence(authToken);
  const { partnerId } = usePartnerId(authToken, user?.id);
  const { currentPercentage } = useLoveMeter(authToken);
  const { messages: chatMessages, loading: chatLoading } = useChat(authToken);
  const { letters, loading: lettersLoading } = useLetters(authToken);
  const { photos: galleryPhotos, loading: galleryLoading } = useGallery(authToken);
  const { knockReceived, sendKnock, knocking, cooldown, dismissKnock } = useKnockKnock(authToken, partnerId || undefined);

  const partnerPresence = presence.find((p) => p.userId === partnerId);
  const myPresence = presence.find((p) => p.userId === user?.id);

  const isPartnerOnline = !!partnerPresence && partnerPresence.status !== "offline" && partnerPresence.status !== "away";
  const myStatus = myPresence?.status || "online";
  const partnerStatus = partnerPresence?.status || "offline";

  const partnerRoomIndex = useMemo(() => {
    const statusMap: Record<string, number> = { "living-room": 0, "bedroom": 1, "garden": 2, "rooftop": 3, "online": 0, "tidur": 1, "jalan": 2, "dengar-musik": 3, "main-game": 0, "rindu-kamu": 1 };
    return statusMap[partnerStatus] ?? 0;
  }, [partnerStatus]);

  const partnerActivity = useMemo(() => {
    const room = ROOM_SPOTS[partnerRoomIndex];
    return room?.partnerActivity || "lagi di rumah";
  }, [partnerRoomIndex]);

  const roomBadges = useMemo(() => {
    const badges: Record<string, number> = {};
    if (!chatLoading) badges["living-room"] = chatMessages.filter((m) => m.userId === partnerId).length;
    if (!lettersLoading) badges["bedroom"] = letters.filter((l) => l.createdBy === partnerId).length;
    if (!galleryLoading) badges["garden"] = galleryPhotos.length;
    return badges;
  }, [chatMessages, letters, galleryPhotos, chatLoading, lettersLoading, galleryLoading, partnerId]);

  const galleryEmojiPhotos = useMemo(() => galleryPhotos.slice(0, 2).map((p) => ({ id: p.id, emoji: "📸" })), [galleryPhotos]);

  // Partner typing indicator — last message within 15s
  const partnerTyping = useMemo(() => {
    if (!partnerId || chatLoading) return false;
    const partnerMsgs = chatMessages.filter((m) => m.userId === partnerId);
    if (partnerMsgs.length === 0) return false;
    const lastMsg = partnerMsgs[partnerMsgs.length - 1];
    const created = new Date(lastMsg.createdAt).getTime();
    return Date.now() - created < 15000;
  }, [chatMessages, partnerId, chatLoading]);

  const handleEnter = useCallback(() => {
    setPhase("entering");
    setTimeout(() => {
      setPhase("interior");
      sessionStorage.setItem("ryora-entered", "true");
    }, 1200);
  }, []);

  const handleGoOutside = useCallback(() => {
    sessionStorage.removeItem("ryora-entered");
    setPhase("exterior");
  }, []);

  const [roomTransition, setRoomTransition] = useState(false);
  const handleOpenRoom = useCallback((href: string) => {
    setRoomTransition(true);
    setTimeout(() => router.push(href), 300);
  }, [router]);

  const handleUpdateStatus = useCallback((status: string) => {
    updatePresence(status);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(15);
  }, [updatePresence]);

  if (phase === "exterior" || phase === "entering") {
    return (
      <>
        <HouseExterior
          onEnter={handleEnter}
          isPartnerOnline={isPartnerOnline}
          isEntering={phase === "entering"}
          partnerName={user?.relationship || "Pasangan"}
          partnerStatus={partnerStatus}
          onKnock={sendKnock}
          knocking={knocking}
          cooldown={cooldown}
        />
        {knockReceived && <KnockNotification knock={knockReceived} onDismiss={dismissKnock} onEnter={handleEnter} />}
      </>
    );
  }

  return (
    <>
      {roomTransition && <div className="fixed inset-0 bg-white z-50 animate-fade-to-white pointer-events-none" />}
      <HouseInterior
        onOpenRoom={handleOpenRoom}
        onGoOutside={handleGoOutside}
        isPartnerOnline={isPartnerOnline}
        userName={user?.name || "Sayang"}
        partnerName={user?.relationship || "Pasangan"}
        partnerEmoji="🧑"
        myEmoji="👩"
        lovePercentage={currentPercentage}
        partnerRoomIndex={partnerRoomIndex}
        partnerActivity={partnerActivity}
        partnerStatus={partnerStatus}
        myStatus={myStatus}
        onUpdateStatus={handleUpdateStatus}
        roomBadges={roomBadges}
        galleryPhotos={galleryEmojiPhotos}
        isLoading={chatLoading || lettersLoading || galleryLoading}
        partnerTyping={partnerTyping}
      />
      {knockReceived && <KnockNotification knock={knockReceived} onDismiss={dismissKnock} onEnter={handleEnter} />}
    </>
  );
}
