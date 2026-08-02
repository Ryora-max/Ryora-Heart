"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_CONFIG } from "@/config";
import { MagneticButton } from "@/components/animations/MagneticButton";

interface Star {
  id: number;
  width: number;
  height: number;
  top: number;
  left: number;
  opacity: number;
}

function createStars(count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      width: ((i * 13 + 7) % 3) + 1,
      height: ((i * 17 + 3) % 3) + 1,
      top: ((i * 23 + 11) % 100),
      left: ((i * 29 + 17) % 100),
      opacity: ((i * 31 + 19) % 50 + 20) / 100,
    });
  }
  return stars;
}

export default function LandingPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [stars] = useState<Star[]>(() => createStars(80));

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <div ref={containerRef} className="relative min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-br from-pink-200 via-purple-100 to-indigo-100">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {stars.map((star) => (
          <div key={star.id} className="star absolute rounded-full bg-white/70 animate-fade-in-soft" style={{ width: `${star.width}px`, height: `${star.height}px`, top: `${star.top}%`, left: `${star.left}%`, opacity: star.opacity, animationDelay: `${star.id * 0.02}s` }} />
        ))}
      </div>

      <div className="relative z-10 text-center">
        <h1 className="text-7xl md:text-9xl font-bold mb-4 tracking-tight text-text-primary drop-shadow-sm">
          {APP_CONFIG.name.split("").map((char, idx) => (
            <span key={idx} className="logo-letter inline-block animate-fade-in-soft" style={{ animationDelay: `${0.3 + idx * 0.1}s` }}>{char}</span>
          ))}
        </h1>
        <p className="subtitle animate-fade-in-soft text-xl md:text-2xl text-text-secondary font-light tracking-wide mb-12" style={{ animationDelay: "0.6s" }}>
          {APP_CONFIG.subtitle}
        </p>
        <MagneticButton>
          <button
            onClick={handleLogin}
            className="landing-btn animate-scale-soft px-10 py-4 text-lg rounded-full bg-white/80 backdrop-blur-xl border-2 border-pink-200 text-text-primary font-bold hover:bg-white transition-all shadow-soft hover:shadow-soft-hover cursor-pointer"
          >
            Enter Our Home 💝
          </button>
        </MagneticButton>
      </div>
    </div>
  );
}
