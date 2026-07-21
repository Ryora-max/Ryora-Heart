"use client";

import { useEffect, useState } from "react";

interface TrailHeart {
  id: number;
  x: number;
  y: number;
  size: number;
  emoji: string;
}

export function CustomCursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [trail, setTrail] = useState<TrailHeart[]>([]);
  const [clickBurst, setClickBurst] = useState<TrailHeart[]>([]);

  useEffect(() => {
    let lastTime = 0;

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });

      const now = Date.now();
      if (now - lastTime > 80) {
        lastTime = now;
        const emoji = ["💖", "💕", "🩷", "💞", "🌸", "✨"][Math.floor(Math.random() * 6)];
        const size = Math.random() * 10 + 6;
        const newHeart: TrailHeart = {
          id: now + Math.random(),
          x: e.clientX,
          y: e.clientY,
          size,
          emoji,
        };
        setTrail((prev) => [...prev, newHeart].slice(-8));
        setTimeout(() => {
          setTrail((prev) => prev.filter((h) => h.id !== newHeart.id));
        }, 800);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const burst: TrailHeart[] = [];
      for (let i = 0; i < 6; i++) {
        const emoji = ["💖", "💕", "✨", "🩷"][Math.floor(Math.random() * 4)];
        const size = Math.random() * 14 + 10;
        burst.push({
          id: Date.now() + i + Math.random(),
          x: e.clientX + (Math.random() - 0.5) * 60,
          y: e.clientY + (Math.random() - 0.5) * 60,
          size,
          emoji,
        });
      }
      setClickBurst((prev) => [...prev, ...burst]);
      setTimeout(() => {
        setClickBurst((prev) => prev.filter((h) => !burst.find((b) => b.id === h.id)));
      }, 1000);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "BUTTON" ||
        target.tagName === "A" ||
        target.closest("button") ||
        target.closest("a") ||
        target.classList.contains("cursor-pointer")
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("click", handleClick);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("click", handleClick);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, []);

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-[9998] overflow-hidden hidden md:block">
        {trail.map((heart) => (
          <span
            key={heart.id}
            className="absolute select-none text-pink-400"
            style={{
              left: `${heart.x - heart.size / 2}px`,
              top: `${heart.y - heart.size / 2}px`,
              fontSize: `${heart.size}px`,
              animation: "float-up 0.8s ease-out forwards",
            }}
          >
            {heart.emoji}
          </span>
        ))}
        {clickBurst.map((heart) => (
          <span
            key={heart.id}
            className="absolute select-none text-pink-400"
            style={{
              left: `${heart.x - heart.size / 2}px`,
              top: `${heart.y - heart.size / 2}px`,
              fontSize: `${heart.size}px`,
              animation: "float-up 1s ease-out forwards",
            }}
          >
            {heart.emoji}
          </span>
        ))}
      </div>

      <div
        className="fixed top-0 left-0 pointer-events-none z-[9999] hidden md:block select-none transition-transform duration-75 ease-out"
        style={{
          transform: `translate(${position.x - 12}px, ${position.y - 12}px)`,
        }}
      >
        <span
          className="text-2xl inline-block transition-transform duration-300"
          style={{
            transform: isHovering ? "scale(1.4) rotate(15deg)" : "scale(1) rotate(0deg)",
            filter: "drop-shadow(0 2px 4px rgba(236,72,153,0.4))",
          }}
        >
          💖
        </span>
      </div>
    </>
  );
}

