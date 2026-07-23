"use client";

import { useEffect, useState } from "react";
import { Plane, MapPin, Heart, Signal, Wifi } from "lucide-react";

const RECEH = [
  "Bedanya cuma geografis, sisanya sama: sama-sama ngefans sama kamu. 💕",
  "Kita beda kota, tapi overthinking-nya selalu ketemu di satu grup. 🤪",
  "Pacaran jarak jauh: level pro di sabar, level pemula di peluk. 🫂",
  "Lebih semangat nabung buat tiket daripada buat baju. ✈️",
  "Kalo capek, inget aja: susah sinyal, gampang jatuh cinta. 📶",
  "Our love story is loading... 87% (terhambat kuota). ⏳",
  "Rindu itu bukti kalau hati tetep di alamat yang sama. 📮",
  "LDR: Love Distance Relationship, tapi Distance-nya kalah sama cinta. 💞",
];

const SIGNAL_ROYO = [
  "📶 4 bar · lagi rebahan",
  "📶 2 bar · di warnet peluk receiver",
  "📡 3 bar · di angkot ngebut",
  "📵 1 bar · sinyal main hide and seek",
];
const SIGNAL_ARA = [
  "📶 4 bar · lagi senyum sendirian",
  "📶 3 bar · di kos nunggu vc",
  "📡 2 bar · lagi di rooftop ngelihat bulan",
  "📵 1 bar · HP kecharge dulu ya",
];

interface FloatingHeart {
  id: number;
  left: number;
  delay: number;
  emoji: string;
}

export function LdrBanner({ tagline }: { tagline?: string }) {
  const [quote, setQuote] = useState(RECEH[0]);
  const [meet, setMeet] = useState({ days: 0, hours: 0, mins: 0 });
  const [kangen, setKangen] = useState(0);
  const [sigRyo, setSigRyo] = useState(SIGNAL_ROYO[0]);
  const [sigAra, setSigAra] = useState(SIGNAL_ARA[0]);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);

  useEffect(() => {
    const target = new Date();
    target.setDate(target.getDate() + 12);
    target.setHours(18, 0, 0, 0);
    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff > 0) {
        setMeet({
          days: Math.floor(diff / 86400000),
          hours: Math.floor((diff % 86400000) / 3600000),
          mins: Math.floor((diff % 3600000) / 60000),
        });
      }
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  const spawnHeart = () => {
    const emoji = ["💗", "💕", "🩷", "💞", "🌸"][Math.floor(Math.random() * 5)];
    const h: FloatingHeart = { id: Date.now() + Math.random(), left: Math.random() * 90, delay: 0, emoji };
    setHearts((prev) => [...prev, h]);
    setTimeout(() => setHearts((prev) => prev.filter((x) => x.id !== h.id)), 2500);
  };

  const kangenClick = () => {
    setKangen((k) => k + 1);
    spawnHeart();
  };

  return (
    <div className="ldr-banner animate-fade-in-up relative mb-6 sm:mb-8 overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-pink-400 via-fuchsia-400 to-rose-400 p-4 sm:p-5 shadow-xl border-2 border-white/30 text-white">
      <div className="pointer-events-none absolute inset-0">
        {hearts.map((h) => (
          <span
            key={h.id}
            className="absolute bottom-0 text-xl sm:text-2xl animate-float-up"
            style={{ left: `${h.left}%`, animationDelay: `${h.delay}s` }}
          >
            {h.emoji}
          </span>
        ))}
      </div>

      <div className="relative z-10">
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
          <span className="text-xl sm:text-2xl">💞</span>
          <span className="font-bold tracking-wide text-xs sm:text-sm uppercase opacity-90">LDR Mode • On</span>
          <Plane size={16} className="animate-bounce sm:hidden" />
          <Plane size={18} className="animate-bounce hidden sm:block" />
        </div>

        <p className="text-base sm:text-lg md:text-xl font-semibold leading-snug text-center">{tagline || quote}</p>

        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-2 sm:mt-3 text-xs sm:text-sm">
          <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
            <MapPin size={12} className="sm:hidden" />
            <MapPin size={14} className="hidden sm:block" /> 📍 Ryo di sini
          </span>
          <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
            <MapPin size={12} className="sm:hidden" />
            <MapPin size={14} className="hidden sm:block" /> 🌏 Ara di sana
          </span>
          <span className="flex items-center gap-1 bg-white/20 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
            <Heart size={12} className="sm:hidden" />
            <Heart size={14} className="hidden sm:block" /> Ketemu dalam {meet.days}h {meet.hours}j {meet.mins}m 💗
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 mt-2 sm:mt-3 text-xs">
          <button
            onClick={() => setSigRyo(SIGNAL_ROYO[Math.floor(Math.random() * SIGNAL_ROYO.length)])}
            className="flex items-center gap-1 bg-black/15 hover:bg-black/25 px-2 py-1 sm:px-3 sm:py-1 rounded-full transition-all cursor-pointer active:scale-95"
          >
            <Signal size={10} className="sm:hidden" />
            <Signal size={12} className="hidden sm:block" /> Sinyal Ryo: {sigRyo}
          </button>
          <button
            onClick={() => setSigAra(SIGNAL_ARA[Math.floor(Math.random() * SIGNAL_ARA.length)])}
            className="flex items-center gap-1 bg-black/15 hover:bg-black/25 px-2 py-1 sm:px-3 sm:py-1 rounded-full transition-all cursor-pointer active:scale-95"
          >
            <Wifi size={10} className="sm:hidden" />
            <Wifi size={12} className="hidden sm:block" /> Sinyal Ara: {sigAra}
          </button>
          <button
            onClick={() => setQuote(RECEH[Math.floor(Math.random() * RECEH.length)])}
            className="bg-white/30 hover:bg-white/40 px-2 py-1 sm:px-3 sm:py-1 rounded-full font-semibold transition-all cursor-pointer active:scale-95"
          >
            Quote receh 🎲
          </button>
          <button
            onClick={kangenClick}
            className="bg-white/30 hover:bg-white/40 px-2 py-1 sm:px-3 sm:py-1 rounded-full font-semibold transition-all cursor-pointer active:scale-95"
          >
            🥺 Kangen ({kangen})
          </button>
        </div>
      </div>
    </div>
  );
}
