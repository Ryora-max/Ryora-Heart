"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { usePresence } from "@/hooks/useDatabase";

type AudioContextConstructor = typeof AudioContext;
declare global {
  interface Window {
    webkitAudioContext?: AudioContextConstructor;
  }
}

function getAudioContext(): AudioContext {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) throw new Error("AudioContext not supported");
  return new Ctor();
}

interface KnockData {
  from: string;
  timestamp: number;
}

export function useKnockKnock(token: string, partnerId: string | undefined) {
  const [knockReceived, setKnockReceived] = useState<KnockData | null>(null);
  const [knocking, setKnocking] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const lastKnockRef = useRef<number>(0);
  const lastSentRef = useRef<number>(0);

  // Check for knocks via presence status pattern
  // We use presence status "knock" as a signal
  const { presence, updatePresence } = usePresence(token);

  const partnerPresence = presence.find((p) => p.userId === partnerId);

  useEffect(() => {
    if (partnerPresence?.status === "knock") {
      const knockTime = new Date(partnerPresence.lastSeen).getTime();
      // Only show knock if it's new (within last 10 seconds) and we haven't seen it
      if (knockTime > lastKnockRef.current && Date.now() - knockTime < 10000) {
        lastKnockRef.current = knockTime;
        setKnockReceived({ from: partnerPresence.userId, timestamp: knockTime });
        // Browser notification when tab not visible
        if (typeof window !== "undefined" && document.hidden && "Notification" in window && Notification.permission === "granted") {
          new Notification("🚪 Tok tok tok!", { body: "Pasanganmu ketuk pintu rumah 💕", icon: "/icon-192.png" });
        }
        // Play knock received sound
        try {
          const ctx = getAudioContext();
          [0, 0.2].forEach((delay) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = 200;
            osc.type = "sine";
            gain.gain.setValueAtTime(0.25, ctx.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.15);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + delay);
            osc.stop(ctx.currentTime + delay + 0.15);
          });
          setTimeout(() => ctx.close(), 800);
        } catch {}
      }
    }
  }, [partnerPresence?.status, partnerPresence?.lastSeen, partnerPresence?.userId]);

  const sendKnock = useCallback(() => {
    // 30s cooldown
    const now = Date.now();
    if (now - lastSentRef.current < 30000) return;
    lastSentRef.current = now;
    // Request notification permission on first knock
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([30, 50, 30]);
    setKnocking(true);
    setCooldown(true);
    updatePresence("knock");
    // Play knock sound
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 150;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);

      // Second knock
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.frequency.value = 150;
      osc2.type = "sine";
      gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.35);

      setTimeout(() => ctx.close(), 500);
    } catch {}

    setTimeout(() => {
      setKnocking(false);
      updatePresence("online");
    }, 2000);

    // Clear cooldown after 30s
    setTimeout(() => {
      setCooldown(false);
    }, 30000);
  }, [updatePresence]);

  const dismissKnock = useCallback(() => {
    setKnockReceived(null);
  }, []);

  return { knockReceived, sendKnock, knocking, cooldown, dismissKnock };
}

export function KnockNotification({
  knock,
  onDismiss,
  onEnter,
}: {
  knock: KnockData | null;
  onDismiss: () => void;
  onEnter: () => void;
}) {
  if (!knock) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in" onClick={onDismiss} />
      <div className="relative bg-white rounded-3xl shadow-2xl p-6 w-full max-w-xs text-center animate-scale-in">
        <div className="text-5xl mb-3 animate-bounce">🚪</div>
        <h3 className="text-lg font-bold text-text-primary mb-1">Tok tok tok!</h3>
        <p className="text-sm text-text-secondary mb-4">Pasanganmu ketuk pintu rumah 💕</p>
        <div className="flex gap-2">
          <button
            onClick={() => { onDismiss(); }}
            className="flex-1 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-all active:scale-95"
          >
            Nanti aja
          </button>
          <button
            onClick={() => { onEnter(); onDismiss(); }}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-400 to-purple-400 text-white text-sm font-bold hover:from-pink-500 hover:to-purple-500 transition-all active:scale-95"
          >
            Buka pintu ❤️
          </button>
        </div>
      </div>
    </div>
  );
}
