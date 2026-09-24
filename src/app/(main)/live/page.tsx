"use client";

import { useState, useEffect, useMemo } from "react";
import { APP_CONFIG } from "@/config";
import { useAuthStore } from "@/stores";
import { useActivities, usePartnerId } from "@/hooks/useDatabase";
import { playHeartPopSound, playChimeSound } from "@/lib/soundEffects";
import type { Activity, MoodType } from "@/types";

const QUICK_PRESETS: { title: string; mood: MoodType; emoji: string }[] = [
  { title: "Lagi Coding / Ngerjain Proyek", mood: "busy", emoji: "💻" },
  { title: "Lagi Belajar & Nugas", mood: "busy", emoji: "📚" },
  { title: "Makan Enak / Ngemil", mood: "happy", emoji: "🍜" },
  { title: "Sedang di Jalan / OTW", mood: "excited", emoji: "🛵" },
  { title: "Dengerin Musik Santai", mood: "calm", emoji: "🎧" },
  { title: "Siap-siap Bobo Pulas", mood: "sleepy", emoji: "😴" },
  { title: "Lagi Kangen Banget", mood: "miss", emoji: "🥺" },
  { title: "Santai Ngopi Hangat", mood: "love", emoji: "☕" },
];

const MOOD_OPTIONS: { value: MoodType; emoji: string; label: string }[] = [
  { value: "happy", emoji: "😊", label: "Happy" },
  { value: "love", emoji: "😍", label: "Love" },
  { value: "miss", emoji: "🥺", label: "Miss" },
  { value: "excited", emoji: "🤩", label: "Excited" },
  { value: "calm", emoji: "😌", label: "Calm" },
  { value: "sad", emoji: "😢", label: "Sad" },
  { value: "busy", emoji: "🤓", label: "Busy" },
  { value: "sleepy", emoji: "😴", label: "Sleepy" },
];

const MOOD_EMOJI: Record<MoodType, string> = {
  happy: "😊",
  love: "😍",
  miss: "🥺",
  excited: "🤩",
  calm: "😌",
  sad: "😢",
  busy: "🤓",
  sleepy: "😴",
};

function formatDuration(start: Date, end?: Date, now?: number): string {
  const endMs = end ? new Date(end).getTime() : (now ?? 0);
  const diffMs = endMs - new Date(start).getTime();
  if (diffMs < 0) return "baru saja";
  const totalMinutes = Math.floor(diffMs / 60000);
  if (totalMinutes < 1) return "baru saja";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}j ${minutes}m`;
  return `${minutes}m`;
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LivePage() {
  const { user, token } = useAuthStore();
  const { activities, loading, createActivity, stopActivity, deleteActivity } =
    useActivities(token || "");
  const { partnerId } = usePartnerId(token || "", user?.id);

  const [title, setTitle] = useState("");
  const [mood, setMood] = useState<MoodType>("happy");
  const [isLive, setIsLive] = useState(false);

  // "now" via state (Date.now() di render melanggar purity) — refresh tiap 30s
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const t0 = setTimeout(tick, 0);
    const interval = setInterval(tick, 30000);
    return () => {
      clearTimeout(t0);
      clearInterval(interval);
    };
  }, []);

  const ownerName = APP_CONFIG.users.owner.name;
  const partnerName = APP_CONFIG.users.partner.name;

  const isOwner = user?.role === "owner";
  const myId = user?.id || "";
  const partnerIdResolved = partnerId || "";

  // Determine which activities belong to each user
  const myActivities = useMemo(
    () => activities.filter((a) => a.createdBy === myId),
    [activities, myId]
  );
  const partnerActivities = useMemo(
    () => activities.filter((a) => a.createdBy === partnerIdResolved),
    [activities, partnerIdResolved]
  );

  const myLiveActivity = myActivities.find((a) => a.isLive);
  const partnerLiveActivity = partnerActivities.find((a) => a.isLive);

  // Build comparison cards: owner always left, partner always right
  const ownerLive = isOwner ? myLiveActivity : partnerLiveActivity;
  const partnerLive = isOwner ? partnerLiveActivity : myLiveActivity;

  const recentActivities = useMemo(
    () =>
      [...activities].sort(
        (a, b) =>
          new Date(b.startTime || b.date).getTime() -
          new Date(a.startTime || a.date).getTime()
      ),
    [activities]
  );

  const handleSubmit = async () => {
    if (!title.trim()) return;
    await createActivity({
      title: title.trim(),
      mood,
      isLive,
    });
    setTitle("");
    setMood("happy");
    setIsLive(false);
  };

  const handleStop = async (id: string) => {
    await stopActivity(id);
  };

  const handleQuickPreset = async (preset: { title: string; mood: MoodType; emoji: string }) => {
    playChimeSound();
    playHeartPopSound();
    await createActivity({
      title: `${preset.title} ${preset.emoji}`,
      mood: preset.mood,
      isLive: true,
    });
  };

  const handleDelete = async (id: string) => {
    await deleteActivity(id);
  };

  return (
    <div className="page-bg p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 text-center animate-fade-in-up">
          <h1 className="text-gradient-primary text-3xl font-bold md:text-4xl mb-2">
            Live Activities 📍
          </h1>
          <p className="text-body text-sm">
            Lihat apa yang {ownerName.split(" ")[0]} &amp; {partnerName.split(" ")[0]} lagi lakukan
          </p>
        </div>

        {/* Comparison widget: two cards side-by-side */}
        <div className="mb-8 grid grid-cols-2 gap-3 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          {/* Owner card (left) */}
          <LiveCard
            name={ownerName.split(" ")[0]}
            isOwnerCard
            liveActivity={ownerLive}
            now={now}
          />
          {/* Partner card (right) */}
          <LiveCard
            name={partnerName.split(" ")[0]}
            isOwnerCard={false}
            liveActivity={partnerLive}
            now={now}
          />
        </div>

        {/* Quick 1-Tap Activity Presets */}
        <div className="surface-card mb-6 p-4 sm:p-5 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-heading text-sm sm:text-base font-extrabold flex items-center gap-1.5">
              <span>⚡ Status Cepat 1-Tap</span>
              <span className="text-xs font-normal text-rose-500">Langsung Live Realtime</span>
            </h2>
            <span className="text-xs text-text-secondary">Klik &amp; otomatis aktif</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {QUICK_PRESETS.map((preset) => (
              <button
                key={preset.title}
                onClick={() => handleQuickPreset(preset)}
                className="touch-press p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/60 bg-surface-warm hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-all flex items-center gap-2 cursor-pointer shadow-sm group hover:scale-[1.02]"
              >
                <span className="text-2xl group-hover:scale-110 transition-transform flex-shrink-0">
                  {preset.emoji}
                </span>
                <div className="min-w-0">
                  <p className="text-heading text-xs font-bold truncate">{preset.title}</p>
                  <p className="text-text-muted text-[10px]">Set live</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Add new custom activity form */}
        <div
          className="surface-card mb-8 p-5 animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          <h2 className="text-heading text-lg font-bold mb-4">Tulis Aktivitas Kustom</h2>

          <input
            id="live-activity-title"
            name="activity-title"
            type="text"
            autoComplete="off"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Lagi ngapain nih? ✨"
            className="input-soft w-full px-4 py-3 mb-4"
            aria-label="Judul aktivitas kustom"
          />

          <p className="text-body text-xs mb-2">Pilih mood</p>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {MOOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMood(opt.value)}
                className={`touch-target touch-press flex flex-col items-center justify-center gap-1 rounded-xl p-2 transition-all cursor-pointer ${
                  mood === opt.value ? "scale-105" : ""
                }`}
                style={{
                  background:
                    mood === opt.value
                      ? "color-mix(in srgb, var(--primary) 22%, transparent)"
                      : "var(--surface-warm)",
                  border: `1px solid ${
                    mood === opt.value ? "var(--primary)" : "var(--border)"
                  }`,
                }}
                aria-label={opt.label}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span className="text-body text-[10px]">{opt.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setIsLive((v) => !v)}
              className="touch-target touch-press flex items-center gap-2 rounded-xl px-3 py-2 transition-all cursor-pointer"
              style={{
                background: isLive
                  ? "color-mix(in srgb, var(--primary) 18%, transparent)"
                  : "var(--surface-warm)",
                border: `1px solid ${isLive ? "var(--primary)" : "var(--border)"}`,
              }}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{
                  background: isLive ? "#ef4444" : "var(--text-secondary)",
                  animation: isLive ? "pulse 1.5s infinite" : "none",
                }}
              />
              <span className="text-heading text-sm font-medium">
                {isLive ? "Live sekarang" : "Mulai Live"}
              </span>
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="touch-target touch-press w-full rounded-xl px-4 py-3 font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "var(--primary)",
              color: "white",
            }}
          >
            {isLive ? "Mulai Live 🟢" : "Tambah Activity"}
          </button>
        </div>

        {/* Recent activities list */}
        <div className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <h2 className="text-heading text-lg font-bold mb-4">Aktivitas Terbaru</h2>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="surface-card animate-pulse rounded-xl p-4"
                  style={{ height: 64 }}
                />
              ))}
            </div>
          ) : recentActivities.length === 0 ? (
            <div className="surface-card p-8 text-center">
              <div className="text-4xl mb-2">💤</div>
              <p className="text-body text-sm">Belum ada aktivitas. Mulai tambah ya!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentActivities.map((activity, idx) => {
                const isMine = activity.createdBy === myId;
                const creatorName =
                  activity.createdBy === myId
                    ? isOwner
                      ? ownerName.split(" ")[0]
                      : partnerName.split(" ")[0]
                    : isOwner
                    ? partnerName.split(" ")[0]
                    : ownerName.split(" ")[0];

                return (
                  <div
                    key={activity.id}
                    className="surface-card touch-press animate-fade-in-up flex items-center gap-3 rounded-xl p-3"
                    style={{ animationDelay: `${0.4 + idx * 0.05}s` }}
                  >
                    {/* Mood emoji */}
                    <div
                      className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-xl"
                      style={{ background: "var(--surface-warm)" }}
                    >
                      {activity.mood ? MOOD_EMOJI[activity.mood] : "📝"}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {activity.isLive && (
                          <span
                            className="inline-block h-2 w-2 flex-shrink-0 rounded-full"
                            style={{
                              background: "#ef4444",
                              animation: "pulse 1.5s infinite",
                            }}
                          />
                        )}
                        <p className="text-heading text-sm font-medium truncate">
                          {activity.title}
                        </p>
                      </div>
                      <p className="text-body text-xs mt-0.5">
                        {creatorName} •{" "}
                        {activity.startTime
                          ? formatDuration(activity.startTime, activity.endTime, now ?? undefined)
                          : formatTime(activity.date)}
                        {activity.isLive && " • live"}
                      </p>
                    </div>

                    {/* Actions for own activities */}
                    {isMine && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {activity.isLive && (
                          <button
                            onClick={() => handleStop(activity.id)}
                            className="touch-target touch-press rounded-lg px-2 py-1 text-xs font-medium transition-all cursor-pointer"
                            style={{
                              background:
                                "color-mix(in srgb, var(--secondary) 20%, transparent)",
                              color: "var(--secondary)",
                            }}
                          >
                            Stop
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(activity.id)}
                          className="touch-target touch-press rounded-lg px-2 py-1 text-xs font-medium transition-all cursor-pointer"
                          style={{
                            background:
                              "color-mix(in srgb, #ef4444 15%, transparent)",
                            color: "#ef4444",
                          }}
                          aria-label="Hapus"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.3);
          }
        }
      `}</style>
    </div>
  );
}

function LiveCard({
  name,
  isOwnerCard,
  liveActivity,
  now,
}: {
  name: string;
  isOwnerCard: boolean;
  liveActivity?: Activity;
  now: number | null;
}) {
  const isLive = Boolean(liveActivity?.isLive);

  return (
    <div
      className={`rounded-2xl p-4 flex flex-col items-center text-center transition-all duration-300 relative overflow-hidden ${
        isLive
          ? "bg-gradient-to-b from-rose-50/90 to-amber-50/90 dark:from-rose-950/40 dark:to-amber-950/40 border-2 border-rose-300 dark:border-rose-700 shadow-md scale-[1.02]"
          : "surface-card border border-border"
      }`}
      style={{ minHeight: 155 }}
    >
      {/* Top Header with Avatar Badge */}
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-base">{isOwnerCard ? "🤴" : "👸"}</span>
        <p className="text-heading text-sm font-black">{name}</p>
        {isLive && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            LIVE
          </span>
        )}
      </div>

      {liveActivity ? (
        <>
          <div className="text-3xl mb-1.5 transform hover:scale-110 transition-transform">
            {liveActivity.mood ? MOOD_EMOJI[liveActivity.mood] : "📍"}
          </div>
          <p className="text-heading text-xs sm:text-sm font-bold mb-1 line-clamp-2 leading-tight">
            {liveActivity.title}
          </p>
          <div className="mt-auto pt-1">
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-black/5 dark:bg-white/10 text-body text-[10px] font-semibold">
              ⏱️{" "}
              {liveActivity.startTime
                ? formatDuration(liveActivity.startTime, liveActivity.endTime, now ?? undefined)
                : "baru saja"}
            </span>
          </div>
        </>
      ) : (
        <div className="my-auto">
          <div className="text-2xl mb-1 opacity-60">💤</div>
          <p className="text-body text-xs font-medium">Sedang santai di rumah</p>
        </div>
      )}
    </div>
  );
}
