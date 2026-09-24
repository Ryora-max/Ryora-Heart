"use client";

import { useState, useEffect } from "react";
import { Heart, Sparkles, Key } from "lucide-react";
import { APP_CONFIG } from "@/config";

interface HouseEntryTransitionProps {
  onEnter: () => void;
  partnerName?: string;
  isPartnerOnline?: boolean;
}

const COUPLE_NAMES = `${APP_CONFIG.users.owner.username} & ${APP_CONFIG.users.partner.username}`;

export function HouseEntryTransition({
  onEnter,
  partnerName = APP_CONFIG.users.partner.username,
  isPartnerOnline = false,
}: HouseEntryTransitionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [greeting, setGreeting] = useState("Selamat Datang di Rumah Kita");

  // Deferred supaya tidak setState sinkron di effect (lint rule) &
  // tidak ada hydration mismatch (server render pakai default greeting).
  useEffect(() => {
    const t = setTimeout(() => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 11) {
        setGreeting(`Selamat Pagi di Rumah Hangat ${COUPLE_NAMES} ☀️`);
      } else if (hour >= 11 && hour < 15) {
        setGreeting("Selamat Siang di Rumah Penuh Cinta 🌿");
      } else if (hour >= 15 && hour < 18) {
        setGreeting("Selamat Sore, Waktunya Santai Bersama ☕");
      } else {
        setGreeting(`Selamat Malam di Pelukan Rumah ${COUPLE_NAMES} 🌙`);
      }
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const handleOpenDoor = () => {
    if (isEntering) return;
    setIsEntering(true);
    setIsOpen(true);

    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([40, 60, 40]);
    }

    setTimeout(() => {
      onEnter();
    }, 1200);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-all duration-1000 ${
        isEntering ? "opacity-0 pointer-events-none scale-105" : "opacity-100"
      }`}
      style={{
        background: "radial-gradient(circle at center, #FFF5EC 0%, #F5E6D3 50%, #E8D3BC 100%)",
      }}
    >
      {/* Soft warm glowing background light */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-amber-200/40 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-10 left-10 w-72 h-72 bg-rose-200/30 rounded-full blur-[80px]" />
        <div className="absolute top-20 right-10 w-80 h-80 bg-orange-200/30 rounded-full blur-[90px]" />
      </div>

      {/* House Front Frame / Entrance Header */}
      <div className="relative z-10 text-center max-w-sm px-6 mb-8 animate-fade-in-soft">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-amber-200/60 shadow-sm text-xs font-semibold text-amber-900 mb-4">
          <Sparkles size={14} className="text-amber-500 animate-spin" style={{ animationDuration: "6s" }} />
          <span>Heartopia Cozy Entry</span>
        </div>

        <h1 className="text-3xl font-extrabold text-amber-950 tracking-tight mb-2 drop-shadow-sm">
          {greeting}
        </h1>

        <p className="text-xs text-amber-800/80 font-medium">
          {isPartnerOnline ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              {partnerName} ada di dalam rumah sekarang! 💕
            </span>
          ) : (
            <span>Rumah siap menyambut rindu kalian berdua 🧸</span>
          )}
        </p>
      </div>

      {/* 3D Wooden Door Frame Animation */}
      <div className="relative z-10 w-72 h-[340px] perspective-1000 my-2">
        {/* Door Arch Header */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-64 h-8 bg-amber-900/10 rounded-t-full border-t-2 border-amber-300/40 flex items-center justify-center">
          <span className="text-xs text-amber-900/70 font-serif italic font-bold">{COUPLE_NAMES} Cozy Haven</span>
        </div>

        {/* Door Container */}
        <div className="relative w-full h-full rounded-t-3xl border-4 border-amber-800/20 bg-amber-950/20 shadow-2xl overflow-hidden flex justify-between">
          {/* Left Door Leaf */}
          <div
            className={`w-1/2 h-full border-r border-amber-700/40 shadow-inner flex flex-col justify-between p-4 transition-all duration-1000 ease-in-out origin-left ${
              isOpen ? "-rotate-y-90 opacity-40 scale-x-50" : "rotate-y-0"
            }`}
            style={{
              transformStyle: "preserve-3d",
              backgroundImage: "radial-gradient(circle at 30% 30%, #A76D43 0%, #6E4123 70%, #4A2810 100%)",
            }}
          >
            <div className="w-full h-24 rounded-lg border border-amber-600/30 bg-amber-900/40 shadow-inner flex items-center justify-center">
              <Heart size={20} className="text-amber-300/30" />
            </div>
            <div className="w-full h-28 rounded-lg border border-amber-600/30 bg-amber-900/40 shadow-inner" />
          </div>

          {/* Right Door Leaf */}
          <div
            className={`w-1/2 h-full border-l border-amber-700/40 shadow-inner flex flex-col justify-between p-4 transition-all duration-1000 ease-in-out origin-right relative ${
              isOpen ? "rotate-y-90 opacity-40 scale-x-50" : "rotate-y-0"
            }`}
            style={{
              transformStyle: "preserve-3d",
              backgroundImage: "radial-gradient(circle at 70% 30%, #A76D43 0%, #6E4123 70%, #4A2810 100%)",
            }}
          >
            <div className="w-full h-24 rounded-lg border border-amber-600/30 bg-amber-900/40 shadow-inner flex items-center justify-center">
              <Heart size={20} className="text-amber-300/30" />
            </div>

            {/* Door Handle */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <div className="w-5 h-8 bg-amber-300 rounded-full shadow-lg border border-amber-100 flex flex-col items-center justify-center">
                <div className="w-1.5 h-3 bg-amber-800 rounded-full" />
              </div>
            </div>

            <div className="w-full h-28 rounded-lg border border-amber-600/30 bg-amber-900/40 shadow-inner" />
          </div>

          {/* Warm Interior View Visible Behind Open Door */}
          <div
            className={`absolute inset-0 bg-gradient-to-b from-amber-100 via-rose-100 to-amber-200 flex flex-col items-center justify-center p-6 text-center transition-opacity duration-700 ${
              isOpen ? "opacity-100 scale-100" : "opacity-0 scale-90"
            }`}
          >
            <div className="w-16 h-16 rounded-full bg-amber-300/60 blur-md absolute animate-ping" />
            <Sparkles size={36} className="text-amber-600 relative z-10 mb-2 animate-bounce" />
            <p className="text-sm font-bold text-amber-900 relative z-10">Melangkah Masuk...</p>
            <p className="text-xs text-amber-700 relative z-10">Menuju Ruang Hangat Kita 💖</p>
          </div>
        </div>
      </div>

      {/* Interactive Entry Button */}
      <div className="relative z-10 mt-8 animate-fade-in-soft" style={{ animationDelay: "0.3s" }}>
        <button
          onClick={handleOpenDoor}
          disabled={isEntering}
          className="group touch-press flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-amber-600 via-rose-500 to-amber-600 text-white font-bold text-base shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border-2 border-amber-200/50 cursor-pointer"
        >
          {isEntering ? (
            <>
              <Sparkles size={20} className="animate-spin" />
              <span>Membuka Pintu...</span>
            </>
          ) : (
            <>
              <Key size={20} className="group-hover:rotate-45 transition-transform duration-300 text-amber-200" />
              <span>Buka Pintu & Masuk Rumah 🗝️</span>
            </>
          )}
        </button>
      </div>

      <p className="relative z-10 text-[11px] text-amber-800/60 mt-6 font-medium">
        LDR Private Haven • HeartSync Ryora v2.0
      </p>
    </div>
  );
}
