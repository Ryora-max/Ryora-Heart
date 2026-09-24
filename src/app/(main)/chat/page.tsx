"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useAuthStore } from "@/stores";
import { APP_CONFIG } from "@/config";
import { useChat, useRindu, usePartnerId, usePresence } from "@/hooks/useDatabase";
import type { RinduNotification, RinduLevel } from "@/types";
import { cn } from "@/lib/utils";

// ─── Rindu config ──────────────────────────────────────────────
const RINDU_LEVELS: { level: RinduLevel; label: string }[] = [
  { level: "kangen", label: "Kangen 😢" },
  { level: "rindu", label: "Rindu 💕" },
  { level: "rindu_banget", label: "Rindu Banget 🔥" },
];

const RINDU_VIBRATION: Record<RinduLevel, number[]> = {
  kangen: [200, 100, 200],
  rindu: [400, 200, 400, 200, 400],
  rindu_banget: [800, 300, 800, 300, 800, 300, 800],
};

const RINDU_TEXT: Record<RinduLevel, string> = {
  kangen: "{name} kangen sama kamu 😢",
  rindu: "{name} rindu kamu 💕",
  rindu_banget: "{name} rindu banget sama kamu! 💕",
};

const RINDU_FREQUENCIES: Record<RinduLevel, number[]> = {
  kangen: [523],
  rindu: [523, 659],
  rindu_banget: [523, 659, 784],
};

// ─── Sound + vibration controller ──────────────────────────────
function playRinduSound(level: RinduLevel): {
  stop: () => void;
} {
  let ctx: AudioContext | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let vibrationIntervalId: ReturnType<typeof setInterval> | null = null;
  let stopped = false;

  const playTone = () => {
    if (stopped) return;
    try {
      if (!ctx) {
        const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        ctx = new Ctor();
      }
      if (ctx.state === "suspended") ctx.resume();
      const freqs = RINDU_FREQUENCIES[level];
      const now = ctx.currentTime;
      freqs.forEach((freq, i) => {
        const osc = ctx!.createOscillator();
        const gain = ctx!.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const start = now + i * 0.18;
        const dur = 0.5;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.25, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        osc.connect(gain);
        gain.connect(ctx!.destination);
        osc.start(start);
        osc.stop(start + dur);
      });
    } catch (e) {
      console.error("Rindu sound error:", e);
    }
  };

  const vibrate = () => {
    if (stopped) return;
    try {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(RINDU_VIBRATION[level]);
      }
    } catch (e) {
      console.error("Vibration error:", e);
    }
  };

  // initial
  playTone();
  vibrate();
  // repeat every 2 seconds
  intervalId = setInterval(playTone, 2000);
  // vibration pattern duration depends on level; re-trigger after 3s to keep going
  vibrationIntervalId = setInterval(vibrate, 3000);

  return {
    stop: () => {
      stopped = true;
      if (intervalId) clearInterval(intervalId);
      if (vibrationIntervalId) clearInterval(vibrationIntervalId);
      try {
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(0);
      } catch {}
      try {
        if (ctx) {
          ctx.close();
          ctx = null;
        }
      } catch {}
    },
  };
}

// ─── Helpers ───────────────────────────────────────────────────
function formatTime(date: Date): string {
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// ─── Page ──────────────────────────────────────────────────────
export default function ChatPage() {
  const { user, token } = useAuthStore();
  const authToken = token || "";

  const { partnerId } = usePartnerId(authToken, user?.id);
  const { messages, loading, sendMessage, markRead } = useChat(
    authToken,
    user?.pair_id,
    user?.id
  );
  const { rinduList, sendRindu, respondRindu } = useRindu(authToken);
  const { presence } = usePresence(authToken);

  // Partner info from config (the other user)
  const partnerName = useMemo(() => {
    if (!user) return "";
    const partnerRole = user.role === "owner" ? "partner" : "owner";
    return APP_CONFIG.users[partnerRole].name;
  }, [user]);

  const partnerUsername = useMemo(() => {
    if (!user) return "";
    const partnerRole = user.role === "owner" ? "partner" : "owner";
    return APP_CONFIG.users[partnerRole].username;
  }, [user]);

  // Partner online status
  const partnerPresence = presence.find((p) => p.userId === partnerId);
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const lastSeenRef = useRef<Date | undefined>(undefined);
  useEffect(() => {
    lastSeenRef.current = partnerPresence?.lastSeen;
  }, [partnerPresence?.lastSeen]);
  useEffect(() => {
    const tick = () => {
      const lastSeen = lastSeenRef.current;
      if (!lastSeen) {
        setIsPartnerOnline(false);
        return;
      }
      const diff = Date.now() - new Date(lastSeen).getTime();
      setIsPartnerOnline(diff < 60000);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  // ─── Message input ───────────────────────────────────────────
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((smooth = true) => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: smooth ? "smooth" : "auto",
        block: "end",
      });
    });
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom(false);
  }, [messages, scrollToBottom]);

  // Mark read on load + when new messages arrive
  useEffect(() => {
    if (!authToken) return;
    const hasUnread = messages.some(
      (m) => m.receiverId === user?.id && !m.readAt
    );
    if (hasUnread) {
      markRead();
    }
  }, [authToken, messages, user?.id, markRead]);

  const handleSend = useCallback(async () => {
    const content = input.trim();
    if (!content || !partnerId) return;
    setInput("");
    await sendMessage(content, partnerId);
  }, [input, partnerId, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Rindu menu ──────────────────────────────────────────────
  const [rinduMenuOpen, setRinduMenuOpen] = useState(false);
  const rinduMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rinduMenuRef.current && !rinduMenuRef.current.contains(e.target as Node)) {
        setRinduMenuOpen(false);
      }
    };
    if (rinduMenuOpen) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [rinduMenuOpen]);

  const handleSendRindu = useCallback(
    async (level: RinduLevel) => {
      setRinduMenuOpen(false);
      if (!partnerId) return;
      await sendRindu(level, partnerId);
    },
    [partnerId, sendRindu]
  );

  // ─── Incoming rindu popup ────────────────────────────────────
  const [respondedIds, setRespondedIds] = useState<string[]>([]);
  const soundControllerRef = useRef<{ stop: () => void } | null>(null);

  // The latest unresponded rindu sent to me (derived, not stored separately)
  const activeRindu = useMemo<RinduNotification | null>(() => {
    if (!user) return null;
    return (
      rinduList
        .filter(
          (r) =>
            r.receiverId === user.id &&
            !r.respondedAt &&
            !r.response &&
            !respondedIds.includes(r.id)
        )
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] || null
    );
  }, [rinduList, user, respondedIds]);

  // Start sound + vibration when a rindu becomes active, stop when dismissed
  useEffect(() => {
    if (!activeRindu) return;
    soundControllerRef.current = playRinduSound(activeRindu.level);
    return () => {
      soundControllerRef.current?.stop();
      soundControllerRef.current = null;
    };
  }, [activeRindu]);

  const handleRespondRindu = useCallback(
    async (response: "aku_juga" | "ignored") => {
      if (!activeRindu) return;
      // stop sound + vibration immediately
      soundControllerRef.current?.stop();
      soundControllerRef.current = null;
      const id = activeRindu.id;
      setRespondedIds((prev) => [...prev, id]);
      await respondRindu(id, response);
    },
    [activeRindu, respondRindu]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      soundControllerRef.current?.stop();
    };
  }, []);

  // ─── Render ──────────────────────────────────────────────────
  if (!user) return null;

  const unreadCount = messages.filter(
    (m) => m.receiverId === user.id && !m.readAt
  ).length;

  return (
    <div className="page-bg flex flex-col flex-1 min-h-0 safe-area-inset">
      {/* Header */}
      <header
        className="flex items-center gap-3 px-4 py-3 border-b surface-glass sticky top-0 z-30"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 shadow-soft"
            style={{ background: "var(--surface-warm)" }}
          >
            {user.role === "owner" ? "👸" : "🤴"}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-gradient-primary text-base font-bold truncate">
              {partnerName}
            </h1>
            <p className="text-xs flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full inline-block",
                  isPartnerOnline ? "bg-emerald-500" : "bg-text-muted"
                )}
              />
              {isPartnerOnline ? "Online 💕" : "Offline 💤"}
              <span className="opacity-60">· @{partnerUsername}</span>
            </p>
          </div>
        </div>

        {/* Rindu button */}
        <div className="relative" ref={rinduMenuRef}>
          <button
            onClick={() => setRinduMenuOpen((v) => !v)}
            className="touch-target touch-press rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-soft"
            style={{
              background: "var(--primary)",
              color: "#fff",
              width: 44,
              height: 44,
            }}
            aria-label="Kirim rindu"
            title="Kirim rindu 💕"
          >
            <span className="text-xl">💕</span>
          </button>

          {rinduMenuOpen && (
            <div
              className="absolute right-0 top-12 z-40 surface-card rounded-2xl shadow-soft border py-2 min-w-[180px] animate-scale-soft origin-top-right"
              style={{ borderColor: "var(--border)" }}
            >
              <p
                className="px-4 pt-1 pb-2 text-[11px] font-semibold uppercase tracking-wide"
                style={{ color: "var(--text-secondary)" }}
              >
                Kirim rindu
              </p>
              {RINDU_LEVELS.map(({ level, label }) => (
                <button
                  key={level}
                  onClick={() => handleSendRindu(level)}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium transition-colors touch-target touch-press hover:bg-surface-warm"
                  style={{ color: "var(--text-primary)" }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
      >
        {loading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Memuat pesan…
            </p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-6">
            <div className="text-5xl mb-2 animate-breathe">💬</div>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              Belum ada pesan
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Mulai ngobrol dengan {partnerName} 💕
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.senderId === user.id;
            const prev = messages[idx - 1];
            const showDateDivider =
              !prev || !isSameDay(prev.createdAt, msg.createdAt);
            return (
              <div key={msg.id}>
                {showDateDivider && (
                  <div className="flex justify-center my-3">
                    <span
                      className="text-[11px] px-3 py-1 rounded-full surface-card border"
                      style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                    >
                      {msg.createdAt.toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </span>
                  </div>
                )}
                <div
                  className={cn(
                    "flex flex-col max-w-[78%]",
                    isMine ? "items-end ml-auto" : "items-start"
                  )}
                >
                  <div
                    className={cn(
                      "px-4 py-2.5 rounded-2xl text-sm break-words shadow-soft",
                      isMine ? "rounded-br-md" : "rounded-bl-md"
                    )}
                    style={
                      isMine
                        ? {
                            background: "var(--primary)",
                            color: "#fff",
                          }
                        : {
                            background: "var(--surface)",
                            color: "var(--text-primary)",
                          }
                    }
                  >
                    {msg.content}
                  </div>
                  <div
                    className="flex items-center gap-1 mt-1 px-1 text-[10px]"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <span>{formatTime(msg.createdAt)}</span>
                    {isMine && (
                      <span
                        className={cn(
                          "font-semibold",
                          msg.readAt ? "" : "opacity-100"
                        )}
                        style={{ color: msg.readAt ? "var(--text-secondary)" : "var(--secondary)" }}
                      >
                        {msg.readAt ? "✓✓" : "✓"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Unread indicator */}
      {unreadCount > 0 && (
        <div
          className="absolute top-16 right-4 z-20 text-[10px] font-bold rounded-full px-2 py-0.5 shadow-soft animate-breathe"
          style={{ background: "var(--secondary)", color: "#fff" }}
        >
          {unreadCount} belum dibaca
        </div>
      )}

      {/* Input area */}
      <div
        className="px-3 py-3 border-t surface-glass safe-area-bottom"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <input
            id="chat-input"
            name="message"
            type="text"
            autoComplete="off"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Tulis pesan untuk ${partnerName}…`}
            className="input-soft flex-1 px-4 py-3 text-sm"
            disabled={!partnerId}
            aria-label={`Tulis pesan untuk ${partnerName}`}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || !partnerId}
            className="touch-target touch-press rounded-full flex items-center justify-center active:scale-95 transition-transform shadow-soft disabled:opacity-40"
            style={{
              background: "var(--primary)",
              color: "#fff",
              width: 48,
              height: 48,
            }}
            aria-label="Kirim pesan"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </div>
      </div>

      {/* Rindu popup overlay */}
      {activeRindu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
          <div
            className="surface-card rounded-3xl p-8 max-w-sm w-full text-center shadow-soft border animate-scale-soft"
            style={{ borderColor: "var(--border)" }}
          >
            {/* Animated heart */}
            <div className="relative flex items-center justify-center mb-6">
              <div
                className="absolute w-24 h-24 rounded-full animate-ping opacity-30"
                style={{ background: "var(--secondary)" }}
              />
              <div
                className="text-7xl animate-breathe"
                style={{ filter: "drop-shadow(0 0 12px var(--secondary))" }}
              >
                💕
              </div>
            </div>

            <p
              className="text-lg font-bold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              {RINDU_TEXT[activeRindu.level].replace("{name}", partnerName)}
            </p>
            <p className="text-xs mb-6" style={{ color: "var(--text-secondary)" }}>
              {formatTime(activeRindu.createdAt)}
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => handleRespondRindu("aku_juga")}
                className="touch-target touch-press w-full py-3 rounded-2xl font-semibold text-sm active:scale-95 transition-transform shadow-soft"
                style={{ background: "var(--primary)", color: "#fff" }}
              >
                Aku juga rindu 💕
              </button>
              <button
                onClick={() => handleRespondRindu("ignored")}
                className="touch-target touch-press w-full py-3 rounded-2xl font-semibold text-sm active:scale-95 transition-transform border"
                style={{
                  background: "var(--surface-warm)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              >
                Nanti ya 😅
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
