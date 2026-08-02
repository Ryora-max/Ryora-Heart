"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  angle: number;
  distance: number;
}

const REACTIONS = [
  { face: "🥰", text: "I miss you..." },
  { face: "😊", text: "Thinking of you" },
  { face: "🥺", text: "Wish you were here" },
  { face: "❤️", text: "Love you, sayang" },
  { face: "😌", text: "You make me happy" },
  { face: "💕", text: "My heart is yours" },
];

const AUTO_MESSAGES = [
  { face: "🥰", text: "Kamu lagi apa sayang?" },
  { face: "😊", text: "Senyum dong, biar aku ikut senum" },
  { face: "🥺", text: "Aku kangen kamu tau..." },
  { face: "❤️", text: "Jangan lupa makan ya!" },
  { face: "😌", text: "Hari ini aku beruntung punya kamu" },
  { face: "💕", text: "You are my favorite hello" },
  { face: "🤗", text: "Virtual hug untuk kamu" },
  { face: "🌙", text: "Tidur yang nyenyak ya" },
];

const PARTICLE_EMOJIS = ["💕", "✨", "💖", "🌸", "💗", "⭐", "💜", "🤍"];

export function Mascot({
  size = "large",
  emoji = "🧸",
  onTickle,
  autoMessage = false,
}: {
  size?: "small" | "medium" | "large";
  emoji?: string;
  onTickle?: () => void;
  autoMessage?: boolean;
}) {
  const [reaction, setReaction] = useState<{ face: string; text: string } | null>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [isPulsing, setIsPulsing] = useState(false);
  const particleId = useRef(0);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-messages — random romantic quote every 10s
  useEffect(() => {
    if (!autoMessage) return;
    const id = setInterval(() => {
      const r = AUTO_MESSAGES[Math.floor(Math.random() * AUTO_MESSAGES.length)];
      setReaction(r);
      setIsPulsing(true);
      if (reactionTimer.current) clearTimeout(reactionTimer.current);
      reactionTimer.current = setTimeout(() => {
        setReaction(null);
        setIsPulsing(false);
      }, 3000);
    }, 10000);
    return () => clearInterval(id);
  }, [autoMessage]);

  const sizeClass = size === "large" ? "w-28 h-28 sm:w-32 sm:h-32 text-5xl sm:text-6xl" : size === "medium" ? "w-20 h-20 text-4xl" : "w-14 h-14 text-2xl";

  const handleTap = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      let clientX: number, clientY: number;
      if ("touches" in e) {
        clientX = e.touches[0]?.clientX || rect.left + rect.width / 2;
        clientY = e.touches[0]?.clientY || rect.top + rect.height / 2;
      } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
      }
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      // Soft chime sound
      try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
        setTimeout(() => ctx.close(), 500);
      } catch {}

      // Spawn particles
      const newParticles: Particle[] = [];
      const count = 4 + Math.floor(Math.random() * 3);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
        const distance = 30 + Math.random() * 40;
        newParticles.push({
          id: particleId.current++,
          x,
          y,
          emoji: PARTICLE_EMOJIS[Math.floor(Math.random() * PARTICLE_EMOJIS.length)],
          angle,
          distance,
        });
      }
      setParticles((prev) => [...prev, ...newParticles]);

      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => !newParticles.find((np) => np.id === p.id)));
      }, 1500);

      // Random reaction
      const r = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
      setReaction(r);
      setIsPulsing(true);

      if (reactionTimer.current) clearTimeout(reactionTimer.current);
      reactionTimer.current = setTimeout(() => {
        setReaction(null);
        setIsPulsing(false);
      }, 2000);

      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(15);
      onTickle?.();
    },
    [onTickle]
  );

  useEffect(() => {
    return () => {
      if (reactionTimer.current) clearTimeout(reactionTimer.current);
    };
  }, []);

  return (
    <div className="relative inline-flex flex-col items-center select-none">
      {/* Particles */}
      <div className="pointer-events-none absolute inset-0 overflow-visible z-30">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute text-base sm:text-lg animate-heart-float"
            style={{
              left: `${p.x}px`,
              top: `${p.y}px`,
              "--tx": `${Math.cos(p.angle) * p.distance}px`,
              "--ty": `${Math.sin(p.angle) * p.distance - 30}px`,
              animationDuration: "1.2s",
            } as React.CSSProperties}
          >
            {p.emoji}
          </div>
        ))}
      </div>

      {/* Speech bubble */}
      {reaction && (
        <div className="absolute -top-10 sm:-top-12 left-1/2 -translate-x-1/2 z-20 whitespace-nowrap px-4 py-2 rounded-2xl bg-white/95 backdrop-blur-sm shadow-lg text-xs sm:text-sm font-medium text-rose-700 animate-bubble-pop border border-rose-100">
          {reaction.text}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white/95 rotate-45 border-r border-b border-rose-100" />
        </div>
      )}

      {/* Mascot — soft glowing orb with character */}
      <button
        onClick={handleTap}
        aria-label="Tap to send love"
        className={`relative ${sizeClass} rounded-full cursor-pointer transition-all duration-300 active:scale-90 ${isPulsing ? "animate-bounce-fast" : "animate-mascot-idle"}`}
        style={{
          background: "radial-gradient(circle at 35% 30%, #FFF0F5, #FFB6C1 60%, #FF69B4)",
          boxShadow: isPulsing
            ? "0 0 40px 12px rgba(255,105,180,0.4), inset -4px -4px 12px rgba(255,20,147,0.1), inset 4px 4px 12px rgba(255,255,255,0.4)"
            : "0 4px 20px rgba(255,105,180,0.2), inset -4px -4px 12px rgba(255,20,147,0.08), inset 4px 4px 12px rgba(255,255,255,0.3)",
        }}
      >
        {/* Soft highlight */}
        <div className="absolute top-[12%] left-[18%] w-[25%] h-[20%] rounded-full bg-white/50 blur-sm" />

        {/* Character face */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={size === "large" ? "text-4xl sm:text-5xl" : size === "medium" ? "text-3xl" : "text-xl"} style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.1))" }}>
            {reaction ? reaction.face : emoji}
          </span>
        </div>

        {/* Sparkle */}
        {isPulsing && (
          <>
            <div className="absolute -top-1 -right-1 text-sm animate-pulse">✨</div>
            <div className="absolute -bottom-1 -left-1 text-xs animate-pulse" style={{ animationDelay: "0.3s" }}>✨</div>
          </>
        )}
      </button>

      {/* Soft shadow */}
      <div className={`mt-1.5 ${size === "large" ? "w-20 h-2.5 sm:w-24 sm:h-3" : "w-14 h-2"} rounded-full bg-rose-900/10 blur-md`} />
    </div>
  );
}
