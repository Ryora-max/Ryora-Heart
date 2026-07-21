"use client";

import { useEffect, useState, useRef, useCallback } from "react";

const LERP_FACTOR = 0.12;
const CURSOR_SIZE = 28;
const SPARKLE_COUNT = 5;

interface Sparkle {
  id: number;
  x: number;
  y: number;
  angle: number;
  delay: number;
}

function getInitialEnabled() {
  if (typeof window === "undefined") return false;
  const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  if (isTouchDevice) return false;
  const stored = localStorage.getItem("ryora-custom-cursor");
  return stored !== "false";
}

export default function CustomCursor() {
  const [enabled, setEnabled] = useState(getInitialEnabled);
  const [position, setPosition] = useState({ x: -100, y: -100 });
  const [isVisible, setIsVisible] = useState(false);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const rafRef = useRef<number | null>(null);
  const currentPos = useRef({ x: -100, y: -100 });
  const targetPos = useRef({ x: -100, y: -100 });

  useEffect(() => {
    if (!enabled) return;

    const handlePointerMove = (e: PointerEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
      if (!isVisible) setIsVisible(true);
    };

    const handlePointerLeave = () => {
      setIsVisible(false);
      targetPos.current = { x: -100, y: -100 };
    };

    const handlePointerEnter = () => {
      setIsVisible(true);
    };

    const animate = () => {
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * LERP_FACTOR;
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * LERP_FACTOR;
      setPosition({ x: currentPos.current.x, y: currentPos.current.y });
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("pointerenter", handlePointerEnter);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("pointerenter", handlePointerEnter);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, isVisible]);

  const handleDoubleClick = useCallback(() => {
    const newSparkles: Sparkle[] = [];
    for (let i = 0; i < SPARKLE_COUNT; i++) {
      newSparkles.push({
        id: Date.now() + i,
        x: position.x + (Math.random() - 0.5) * 60,
        y: position.y + (Math.random() - 0.5) * 60,
        angle: Math.random() * 360,
        delay: i * 0.08,
      });
    }
    setSparkles((prev) => [...prev, ...newSparkles]);
    setTimeout(() => {
      setSparkles((prev) => prev.filter((s) => !newSparkles.find((ns) => ns.id === s.id)));
    }, 800);
  }, [position]);

  useEffect(() => {
    if (!enabled) return;
    const handleDoubleClickEvent = () => handleDoubleClick();
    window.addEventListener("dblclick", handleDoubleClickEvent);
    return () => window.removeEventListener("dblclick", handleDoubleClickEvent);
  }, [enabled, handleDoubleClick]);

  const toggleCursor = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("ryora-custom-cursor", String(next));
      return next;
    });
  }, []);

  useEffect(() => {
    if (!enabled) {
      document.body.style.cursor = "auto";
    } else {
      document.body.style.cursor = "none";
      const style = document.createElement("style");
      style.id = "custom-cursor-style";
      style.textContent = `
        a, button, input, textarea, select, [role="button"], [onclick], .cursor-pointer {
          cursor: none !important;
        }
      `;
      if (!document.getElementById("custom-cursor-style")) {
        document.head.appendChild(style);
      }
    }
    return () => {
      document.body.style.cursor = "auto";
      const styleEl = document.getElementById("custom-cursor-style");
      if (styleEl) styleEl.remove();
    };
  }, [enabled]);

  if (!enabled) {
    return (
      <button
        onClick={toggleCursor}
        className="fixed bottom-4 right-4 z-50 p-2 rounded-full bg-white/90 backdrop-blur-sm border-2 border-pink-200 shadow-lg hover:shadow-xl transition-all"
        title="Enable custom cursor"
      >
        <span className="text-sm">💖</span>
      </button>
    );
  }

  return (
    <>
      <button
        onClick={toggleCursor}
        className="fixed bottom-4 right-4 z-50 p-2 rounded-full bg-white/90 backdrop-blur-sm border-2 border-pink-200 shadow-lg hover:shadow-xl transition-all"
        title="Disable custom cursor"
      >
        <span className="text-sm">✨</span>
      </button>

      {isVisible && (
        <div
          className="fixed top-0 left-0 pointer-events-none z-[9999]"
          style={{ transform: `translate(${position.x - CURSOR_SIZE / 2}px, ${position.y - CURSOR_SIZE / 2}px)` }}
        >
          <svg width={CURSOR_SIZE} height={CURSOR_SIZE} viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="heartGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FF69B4" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#EC4899" stopOpacity="0.4" />
              </radialGradient>
            </defs>
            <path
              d="M14 24C14 24 4 17 4 10C4 6.5 6.5 4 9.5 4C11.5 4 13 5 14 6.5C15 5 16.5 4 18.5 4C21.5 4 24 6.5 24 10C24 17 14 24 14 24Z"
              fill="url(#heartGlow)"
              stroke="#EC4899"
              strokeWidth="1.2"
            />
            <circle cx="11" cy="10" r="1.2" fill="white" fillOpacity="0.9" />
            <circle cx="17" cy="10" r="1.2" fill="white" fillOpacity="0.9" />
          </svg>

          {sparkles.map((s) => (
            <svg
              key={s.id}
              width="8"
              height="8"
              viewBox="0 0 8 8"
              fill="none"
              style={{
                position: "absolute",
                left: s.x - position.x,
                top: s.y - position.y,
                animation: `sparkle-fly 0.7s ease-out ${s.delay}s forwards`,
                opacity: 0,
              }}
            >
              <path d="M4 0L4.7 3.3L8 4L4.7 4.7L4 8L3.3 4.7L0 4L3.3 3.3L4 0Z" fill="#F472B6" />
            </svg>
          ))}
        </div>
      )}
    </>
  );
}
