"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_CONFIG } from "@/config";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { Heart, Sparkles } from "lucide-react";
import { useMounted } from "@/hooks/useMounted";

interface Star {
  id: number;
  width: number;
  height: number;
  top: number;
  left: number;
  opacity: number;
  delay: number;
}

function createStars(count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      width: Math.random() * 3 + 1,
      height: Math.random() * 3 + 1,
      top: Math.random() * 100,
      left: Math.random() * 100,
      opacity: Math.random() * 0.5 + 0.2,
      delay: Math.random() * 3,
    });
  }
  return stars;
}

export default function LandingPage() {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [stars, setStars] = useState<Star[]>([]);
  useMounted(() => setStars(createStars(80)));

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <div ref={containerRef} className="page-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      {/* Floating hearts background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {stars.map((star) => (
          <div
            key={star.id}
            className="star absolute rounded-full bg-primary/60 animate-fade-in-soft"
            style={{
              width: `${star.width}px`,
              height: `${star.height}px`,
              top: `${star.top}%`,
              left: `${star.left}%`,
              opacity: star.opacity,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Soft glow orbs */}
      <div className="pointer-events-none absolute top-[15%] left-[10%] h-[400px] w-[400px] rounded-full bg-primary/20 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[10%] right-[10%] h-[500px] w-[500px] rounded-full bg-secondary/20 blur-[140px]" />

      {/* Hero content */}
      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Badge */}
        <div className="surface-glass mb-8 flex items-center gap-2 rounded-full px-4 py-2 animate-fade-in-soft" style={{ animationDelay: "0.1s" }}>
          <Sparkles size={14} className="text-primary" />
          <span className="text-xs font-medium text-body tracking-wide">A private space for two</span>
        </div>

        {/* Logo */}
        <h1 className="mb-4 text-7xl font-bold tracking-tight text-heading md:text-9xl drop-shadow-sm">
          {APP_CONFIG.name.split("").map((char, idx) => (
            <span
              key={idx}
              className="logo-letter text-gradient-primary inline-block animate-fade-in-soft"
              style={{ animationDelay: `${0.3 + idx * 0.1}s` }}
            >
              {char}
            </span>
          ))}
        </h1>

        {/* Subtitle */}
        <p
          className="subtitle text-body animate-fade-in-soft mb-3 text-xl font-light tracking-wide md:text-2xl"
          style={{ animationDelay: "0.6s" }}
        >
          {APP_CONFIG.subtitle}
        </p>

        {/* Tagline */}
        <p
          className="text-muted animate-fade-in-soft mb-12 max-w-md text-sm font-light md:text-base"
          style={{ animationDelay: "0.75s" }}
        >
          Your shared digital home — moods, memories, letters, and little moments, all in one place.
        </p>

        {/* CTA */}
        <MagneticButton>
          <a
            href="/login"
            onClick={(e) => {
              e.preventDefault();
              handleLogin();
            }}
            className="landing-btn touch-press animate-scale-soft flex items-center gap-2 rounded-full border-2 border-primary/30 bg-surface/80 px-10 py-4 text-lg font-bold text-heading backdrop-blur-xl shadow-soft transition-all hover:shadow-soft-hover cursor-pointer"
            style={{ animationDelay: "0.9s" }}
          >
            <Heart size={20} className="text-primary" fill="currentColor" />
            Enter Our Home
          </a>
        </MagneticButton>

        {/* Footer hint */}
        <p
          className="text-muted animate-fade-in-soft mt-16 text-xs"
          style={{ animationDelay: "1.2s" }}
        >
          Made with love for {APP_CONFIG.users.owner.username} & {APP_CONFIG.users.partner.username}
        </p>
      </div>
    </div>
  );
}
