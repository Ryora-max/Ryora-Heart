"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { APP_CONFIG } from "@/config";
import { Sparkles, Heart } from "lucide-react";
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
    <div className="page-bg relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-6">
      {/* 1-Directional House Entry Animation Overlay */}
      {showTransition && (
        <HouseEntryTransition onEnter={handleFinishTransition} />
      )}

      {/* Floating hearts — playful ambient layer di atas orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <span className="absolute top-[18%] left-[12%] text-3xl animate-float-soft opacity-40">💗</span>
        <span className="absolute top-[30%] right-[14%] text-2xl animate-float-soft opacity-30" style={{ animationDelay: "1.2s" }}>💖</span>
        <span className="absolute bottom-[24%] left-[20%] text-2xl animate-float-soft opacity-30" style={{ animationDelay: "0.6s" }}>💜</span>
        <span className="absolute bottom-[36%] right-[22%] text-xl animate-float-soft opacity-25" style={{ animationDelay: "1.8s" }}>✨</span>
      </div>

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
        {/* Glass badge */}
        <div className="mb-6 flex items-center gap-2 rounded-full surface-glass px-4 py-1.5 animate-fade-in-soft">
          <Sparkles size={14} className="text-primary animate-spin" style={{ animationDuration: "8s" }} />
          <span className="text-xs font-bold text-heading tracking-wide">
            Ruang Rumah Digital Pasangan LDR
          </span>
        </div>

        {/* Logo — brand gradient */}
        <h1 className="mb-3 text-6xl font-black tracking-tight md:text-8xl">
          <span className="text-gradient-primary drop-shadow-sm">
            {APP_CONFIG.name}
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mb-3 text-lg md:text-xl font-bold text-heading animate-fade-in-soft">
          {APP_CONFIG.subtitle} 💕
        </p>

        {/* Tagline */}
        <p className="mb-10 text-xs md:text-sm text-body max-w-md font-medium leading-relaxed animate-fade-in-soft">
          Rumah digital hangat untuk berbagi mood, lokasi real-time, aktivitas harian, dan kenangan indah untuk {APP_CONFIG.users.owner.username} & {APP_CONFIG.users.partner.username}.
        </p>

        {/* CTA — gradient button */}
        <button
          onClick={handleEnterClick}
          className="group btn-gradient touch-press flex items-center gap-3 rounded-full px-9 py-4 text-base cursor-pointer animate-scale-soft"
        >
          <Heart size={20} className="group-hover:scale-125 transition-transform duration-300" fill="currentColor" />
          <span>Masuk ke Rumah Kita 🗝️</span>
        </button>

        {/* Footer info */}
        <p className="mt-14 text-[11px] text-muted font-medium animate-fade-in-soft">
          Dibuat dengan cinta untuk dua hati yang berjauhan ✨
        </p>
      </div>
    </div>
  );
}
