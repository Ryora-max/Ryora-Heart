"use client";

import { useState, useEffect } from "react";
import { APP_CONFIG } from "@/config";
import { useAuthStore } from "@/stores";
import {
  usePresence,
  usePartnerId,
  useMoods,
  useActivities,
  useNotifications,
} from "@/hooks/useDatabase";
import type { MoodType, Presence, MoodEntry, Activity } from "@/types";

const MOOD_EMOJIS: Record<MoodType, string> = {
  happy: "😊",
  love: "😍",
  miss: "🥺",
  excited: "🤩",
  calm: "😌",
  sad: "😢",
  busy: "💼",
  sleepy: "😴",
};

const MOOD_LABELS: Record<MoodType, string> = {
  happy: "Happy",
  love: "In Love",
  miss: "Missing You",
  excited: "Excited",
  calm: "Calm",
  sad: "Sad",
  busy: "Busy",
  sleepy: "Sleepy",
};

function getLatestMoodForUser(
  moods: MoodEntry[],
  userId: string | undefined
): MoodEntry | undefined {
  if (!userId) return undefined;
  return moods
    .filter((m) => m.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
}

function getLiveActivityForUser(
  activities: Activity[],
  userId: string | undefined
): Activity | undefined {
  if (!userId) return undefined;
  return activities.find((a) => a.isLive && a.createdBy === userId);
}

function getPresenceForUser(
  presence: Presence[],
  userId: string | undefined
): Presence | undefined {
  if (!userId) return undefined;
  return presence.find((p) => p.userId === userId);
}

function formatLastSeen(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function DashboardPage() {
  const { user, token } = useAuthStore();
  const { presence } = usePresence(token || "");
  const { partnerId } = usePartnerId(token || "", user?.id);
  const { moods } = useMoods(token || "");
  const { activities } = useActivities(token || "");
  const { notifications } = useNotifications(token || "");

  const [animatedDays, setAnimatedDays] = useState(0);
  const [daysTogether] = useState(() => {
    const start = new Date(APP_CONFIG.relationship.startDate);
    const diff = Date.now() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  });

  // Animate the days counter on mount
  useEffect(() => {
    let frame: number;
    const duration = 1500;
    const startTime = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedDays(Math.floor(eased * daysTogether));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [daysTogether]);

  const ownerId = user?.id;
  const ownerName = APP_CONFIG.users.owner.username;
  const partnerName = APP_CONFIG.users.partner.username;

  const isOwner = user?.role === "owner";
  const myName = isOwner ? ownerName : partnerName;
  const partnerDisplayName = isOwner ? partnerName : ownerName;

  const myId = ownerId;
  const partnerDisplayId = isOwner ? partnerId : ownerId;

  const myPresence = getPresenceForUser(presence, myId);
  const partnerPresence = getPresenceForUser(presence, partnerDisplayId || undefined);

  const myMood = getLatestMoodForUser(moods, myId);
  const partnerMood = getLatestMoodForUser(moods, partnerDisplayId || undefined);

  const myActivity = getLiveActivityForUser(activities, myId);
  const partnerActivity = getLiveActivityForUser(activities, partnerDisplayId || undefined);

  const totalMessages = 1284; // placeholder count
  const totalRindu = notifications?.length || 42; // fallback placeholder

  const userCards = [
    {
      name: myName,
      presence: myPresence,
      mood: myMood,
      activity: myActivity,
    },
    {
      name: partnerDisplayName,
      presence: partnerPresence,
      mood: partnerMood,
      activity: partnerActivity,
    },
  ];

  return (
    <div
      className="page-bg"
      style={{ minHeight: "100vh", padding: "20px 16px" }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Header */}
        <div
          className="animate-slide-up-soft"
          style={{ textAlign: "center", marginBottom: 28 }}
        >
          <p
            className="text-body"
            style={{
              fontSize: 13,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Welcome Home
          </p>
          <h1
            className="text-gradient-primary"
            style={{ fontSize: 28, fontWeight: 800, margin: 0 }}
          >
            {user?.name?.split(" ")[0] || myName} 💕
          </h1>
        </div>

        {/* Days Together Big Counter */}
        <div
          className="surface-card animate-breathe"
          style={{
            textAlign: "center",
            padding: "32px 20px",
            marginBottom: 24,
            borderRadius: 24,
            background:
              "linear-gradient(135deg, var(--surface) 0%, var(--surface-warm) 100%)",
            border: "1px solid var(--border)",
          }}
        >
          <p
            className="text-body"
            style={{ fontSize: 13, marginBottom: 8, letterSpacing: "0.05em" }}
          >
            Days Together
          </p>
          <div
            className="text-gradient-primary"
            style={{
              fontSize: 64,
              fontWeight: 900,
              lineHeight: 1,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {animatedDays.toLocaleString()}
          </div>
          <p className="text-body" style={{ fontSize: 14, marginTop: 10 }}>
            Since{" "}
            {new Date(APP_CONFIG.relationship.startDate).toLocaleDateString(
              "en-US",
              { year: "numeric", month: "long", day: "numeric" }
            )}{" "}
            ✨
          </p>
        </div>

        {/* User Cards — single column on mobile, 2-column on larger */}
        <div
          className="ryora-user-grid"
          style={{ marginBottom: 24 }}
        >
          {userCards.map((u, idx) => {
            const isOnline = u.presence?.status === "online";
            return (
              <div
                key={idx}
                className="surface-card animate-slide-up-soft"
                style={{
                  padding: 18,
                  borderRadius: 20,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  animationDelay: `${0.1 + idx * 0.1}s`,
                }}
              >
                {/* Name + online status */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  <span style={{ fontSize: 20 }}>{isOnline ? "🟢" : "⚪"}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      className="text-heading"
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        margin: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {u.name}
                    </p>
                    <p className="text-body" style={{ fontSize: 11, margin: 0 }}>
                      {isOnline
                        ? "Online"
                        : u.presence
                        ? `Last seen ${formatLastSeen(u.presence.lastSeen)}`
                        : "Offline"}
                    </p>
                  </div>
                </div>

                {/* Mood */}
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: "var(--surface-warm)",
                    marginBottom: 10,
                    border: "1px solid var(--border)",
                  }}
                >
                  <p
                    className="text-body"
                    style={{ fontSize: 11, marginBottom: 4 }}
                  >
                    💭 Mood
                  </p>
                  <p
                    className="text-heading"
                    style={{ fontSize: 14, fontWeight: 600, margin: 0 }}
                  >
                    {u.mood
                      ? `${MOOD_EMOJIS[u.mood.mood]} ${MOOD_LABELS[u.mood.mood]}`
                      : "—"}
                  </p>
                </div>

                {/* Activity */}
                <div
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    background: "var(--surface-warm)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <p
                    className="text-body"
                    style={{ fontSize: 11, marginBottom: 4 }}
                  >
                    📍 Current Activity
                  </p>
                  <p
                    className="text-heading"
                    style={{ fontSize: 14, fontWeight: 600, margin: 0 }}
                  >
                    {u.activity ? `✨ ${u.activity.title}` : "—"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div
          className="animate-slide-up-soft"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 12,
            marginBottom: 24,
            animationDelay: "0.3s",
          }}
        >
          <div
            className="surface-card"
            style={{
              padding: 18,
              borderRadius: 16,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              textAlign: "center",
            }}
          >
            <p className="text-body" style={{ fontSize: 12, marginBottom: 6 }}>
              💬 Chat Messages
            </p>
            <p
              className="text-heading"
              style={{
                fontSize: 24,
                fontWeight: 800,
                margin: 0,
                color: "var(--primary)",
              }}
            >
              {totalMessages.toLocaleString()}
            </p>
          </div>
          <div
            className="surface-card"
            style={{
              padding: 18,
              borderRadius: 16,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              textAlign: "center",
            }}
          >
            <p className="text-body" style={{ fontSize: 12, marginBottom: 6 }}>
              💕 Rindu Sent
            </p>
            <p
              className="text-heading"
              style={{
                fontSize: 24,
                fontWeight: 800,
                margin: 0,
                color: "var(--secondary)",
              }}
            >
              {totalRindu.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Footer note */}
        <div
          className="animate-slide-up-soft"
          style={{ textAlign: "center", padding: "16px 0", animationDelay: "0.4s" }}
        >
          <p className="text-body" style={{ fontSize: 13, opacity: 0.7 }}>
            Every day with you is a gift 💝
          </p>
        </div>
      </div>

      {/* Responsive grid: 1 column on mobile, 2 columns on larger screens */}
      <style>{`
        .ryora-user-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        @media (min-width: 640px) {
          .ryora-user-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
}
