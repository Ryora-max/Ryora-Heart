"use client";

import { useState, useMemo } from "react";
import { APP_CONFIG } from "@/config";
import { useAuthStore } from "@/stores";
import { useActivities, usePartnerId } from "@/hooks/useDatabase";
import type { Activity, MoodType } from "@/types";

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

function formatDuration(start: Date, end?: Date): string {
  const endMs = end ? new Date(end).getTime() : Date.now();
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
            liveActivity={ownerLive}
          />
          {/* Partner card (right) */}
          <LiveCard
            name={partnerName.split(" ")[0]}
            liveActivity={partnerLive}
          />
        </div>

        {/* Add new activity form */}
        <div
          className="surface-card mb-8 p-5 animate-fade-in-up"
          style={{ animationDelay: "0.2s" }}
        >
          <h2 className="text-heading text-lg font-bold mb-4">Tambah Activity</h2>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Lagi ngapain nih? ✨"
            className="input-soft w-full px-4 py-3 mb-4"
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
                          ? formatDuration(activity.startTime, activity.endTime)
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
  liveActivity,
}: {
  name: string;
  liveActivity?: Activity;
}) {
  return (
    <div
      className="surface-card rounded-2xl p-4 flex flex-col items-center text-center"
      style={{ minHeight: 140 }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        {liveActivity?.isLive && (
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{
              background: "#ef4444",
              animation: "pulse 1.5s infinite",
            }}
          />
        )}
        <p className="text-heading text-sm font-bold">{name}</p>
      </div>

      {liveActivity ? (
        <>
          <div className="text-3xl mb-2">
            {liveActivity.mood ? MOOD_EMOJI[liveActivity.mood] : "📍"}
          </div>
          <p className="text-heading text-sm font-medium mb-1 line-clamp-2">
            {liveActivity.title}
          </p>
          <p className="text-body text-xs">
            {liveActivity.startTime
              ? formatDuration(liveActivity.startTime, liveActivity.endTime)
              : "baru saja"}
          </p>
        </>
      ) : (
        <>
          <div className="text-3xl mb-2 opacity-50">😴</div>
          <p className="text-body text-xs">Tidak ada aktivitas live</p>
        </>
      )}
    </div>
  );
}
