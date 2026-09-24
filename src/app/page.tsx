"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { APP_CONFIG } from "@/config";
import { Sparkles, Key } from "lucide-react";
import { HouseEntryTransition } from "@/components/home/HouseEntryTransition";

export default function LandingPage() {
  const router = useRouter();
  const [showTransition, setShowTransition] = useState(false);

  const handleEnterClick = () => {
    setShowTransition(true);
  };

  const handleFinishTransition = () => {
    router.push("/login");
  };

  return (
    <div className="landing-bg relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6">
      {/* 1-Directional House Entry Animation Overlay */}
      {showTransition && (
        <HouseEntryTransition onEnter={handleFinishTransition} />
      )}

      {/* Floating warm soft glow ambient circles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[10%] left-[15%] h-[400px] w-[400px] rounded-full bg-rose-200/40 dark:bg-rose-500/10 blur-[130px]" />
        <div className="absolute bottom-[15%] right-[15%] h-[450px] w-[450px] rounded-full bg-amber-200/50 dark:bg-amber-500/10 blur-[140px]" />
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
        {/* Badge */}
        <div className="mb-6 flex items-center gap-2 rounded-full border border-amber-300/60 dark:border-amber-700/40 bg-white/80 dark:bg-white/5 px-4 py-1.5 shadow-sm backdrop-blur-md animate-fade-in-soft">
          <Sparkles size={14} className="text-amber-500 dark:text-amber-400 animate-spin" style={{ animationDuration: "8s" }} />
          <span className="text-xs font-bold text-amber-950 dark:text-amber-100 tracking-wide">
            Ruang Rumah Digital Pasangan LDR
          </span>
        </div>

        {/* Logo */}
        <h1 className="mb-3 text-6xl font-black tracking-tight text-amber-950 md:text-8xl drop-shadow-sm">
          <span className="bg-gradient-to-r from-amber-700 via-rose-600 to-amber-800 dark:from-amber-300 dark:via-rose-400 dark:to-amber-500 bg-clip-text text-transparent">
            {APP_CONFIG.name}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mb-3 text-lg md:text-xl font-bold text-amber-900/90 dark:text-amber-200/90 animate-fade-in-soft">
          {APP_CONFIG.subtitle} 💕
        </p>

        {/* Tagline */}
        <p className="mb-10 text-xs md:text-sm text-amber-800/80 dark:text-amber-200/70 max-w-md font-medium leading-relaxed animate-fade-in-soft">
          Rumah impian hangat tempat berbagi mood, lokasi real-time, aktivitas harian, dan kenangan indah untuk {APP_CONFIG.users.owner.username} & {APP_CONFIG.users.partner.username}.
        </p>

        {/* CTA Button with 1-Directional Entry Flow */}
        <button
          onClick={handleEnterClick}
          className="group touch-press flex items-center gap-3 rounded-full bg-gradient-to-r from-amber-600 via-rose-500 to-amber-600 dark:from-amber-500 dark:via-rose-500 dark:to-amber-500 px-9 py-4 text-base font-bold text-white shadow-xl hover:shadow-2xl transition-all hover:scale-105 border-2 border-amber-200/50 dark:border-amber-400/30 cursor-pointer animate-scale-soft"
        >
          <Key size={20} className="text-amber-200 group-hover:rotate-45 transition-transform duration-300" />
          <span>Buka Pintu & Masuk Rumah 🗝️</span>
        </button>

        {/* Footer info */}
        <p className="mt-14 text-[11px] text-amber-800/60 dark:text-amber-200/50 font-medium animate-fade-in-soft">
          Didesain dengan kehangatan & cinta sejati ✨
        </p>
      </div>
    </div>
  );
}
