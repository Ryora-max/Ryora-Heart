"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { APP_CONFIG, ROOMS } from "@/config";
import { useAuthStore } from "@/stores";
import { calculateDaysTogether } from "@/lib/utils";
import { Activity, Search, ArrowRight } from "lucide-react";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { LdrBanner } from "@/components/ldr/LdrBanner";
import { useActivities, useMoods, useGallery } from "@/hooks/useDatabase";
import type { MoodEntry } from "@/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton, ListItemSkeleton } from "@/components/ui/LoadingSkeleton";

const MOOD_EMOJIS = [
  { value: "happy", emoji: "😊", label: "Happy" },
  { value: "love", emoji: "😍", label: "Love" },
  { value: "excited", emoji: "🤩", label: "Excited" },
  { value: "calm", emoji: "😌", label: "Calm" },
  { value: "miss", emoji: "🥺", label: "Miss" },
  { value: "sad", emoji: "😢", label: "Sad" },
] as const;

export default function DashboardPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { activities, loading: activitiesLoading } = useActivities(token || "");
  const { moods, loading: moodsLoading, addMood } = useMoods(token || "");
  const { photos, loading: galleryLoading } = useGallery(token || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [relationshipStartDate, setRelationshipStartDate] = useState(APP_CONFIG.relationship.startDate);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getUserSettings", token }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.relationshipStartDate) {
          setRelationshipStartDate(data.relationshipStartDate);
        }
      })
      .catch(() => {});
  }, [token]);

  const daysTogether = useMemo(() => calculateDaysTogether(relationshipStartDate), [relationshipStartDate]);
  const statsLoading = activitiesLoading || moodsLoading || galleryLoading;
  const stats = useMemo(
    () => [
      { label: "Days Together", value: daysTogether, emoji: "💝", tint: "var(--primary)" },
      { label: "Activities", value: activities.length, emoji: "📋", tint: "var(--secondary)" },
      { label: "Photos", value: photos.length, emoji: "📸", tint: "var(--accent)" },
      { label: "Moods", value: moods.length, emoji: "💭", tint: "var(--lavender)" },
    ],
    [daysTogether, activities.length, photos.length, moods.length]
  );

  const filteredActivities = activities.filter((a) =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleMoodClick = (mood: { value: MoodEntry["mood"]; emoji: string }) => {
    setSelectedMood(mood.value);
    addMood({ mood: mood.value });
  };

  const quickRooms = ROOMS.filter((r) =>
    ["/living-room", "/bedroom", "/garden", "/rooftop"].includes(r.href)
  );

  return (
    <div className="page-bg p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="dashboard-card animate-fade-in-up mb-8 text-center">
          <p className="text-muted mb-2 text-sm font-medium tracking-wide uppercase">Welcome Home</p>
          <h1 className="text-gradient-primary mb-3 text-4xl font-bold md:text-5xl">
            {user?.name?.split(" ")[0] || "Guest"} 💕
          </h1>
          <p className="text-body text-lg">Here&apos;s what&apos;s happening in your world today</p>
        </div>

        <LdrBanner tagline="Dashboard cinta jarak jauh: beda kota, tapi notif hati selalu nyambung. 💞" />

        {/* Stats grid */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <CardSkeleton key={i} style={{ animationDelay: `${i * 0.05}s` }} />
            ))
          ) : (
            stats.map((stat, i) => (
              <div
                key={i}
                className="surface-card touch-press dashboard-card animate-fade-in-up p-4 sm:p-5"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div
                  className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl text-xl shadow-lg"
                  style={{ background: `color-mix(in srgb, ${stat.tint} 25%, transparent)`, color: stat.tint }}
                >
                  {stat.emoji}
                </div>
                <p className="text-heading mb-1 text-2xl font-bold md:text-3xl">
                  {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
                </p>
                <p className="text-body text-sm">{stat.label}</p>
              </div>
            ))
          )}
        </div>

        {/* Main grid: activities + mood */}
        <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3 md:gap-6">
          {/* Activities */}
          <div
            className="surface-card dashboard-card animate-fade-in-up p-5 lg:col-span-2 md:p-6"
            style={{ animationDelay: "0.5s" }}
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-heading flex items-center gap-2 text-lg font-bold">
                <Activity size={18} className="text-primary" />
                Recent Activities
              </h3>
              <div className="relative flex-shrink-0">
                <Search size={14} className="text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="input-soft w-full max-w-[140px] pl-8 pr-3 py-2 text-sm md:max-w-xs"
                />
              </div>
            </div>
            {activitiesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <ListItemSkeleton key={i} style={{ animationDelay: `${i * 0.05}s` }} />
                ))}
              </div>
            ) : filteredActivities.length === 0 ? (
              <EmptyState emoji="💤" title="No activities yet" description="Start adding activities to see them here" />
            ) : (
              <div className="space-y-2">
                {filteredActivities.slice(0, 5).map((activity, idx) => (
                  <div
                    key={activity.id}
                    className="dashboard-card animate-fade-in-up flex items-center gap-3 rounded-xl p-3 transition-all touch-press"
                    style={{
                      animationDelay: `${0.7 + idx * 0.05}s`,
                      background: "var(--surface-warm)",
                    }}
                  >
                    <div
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 ${
                        activity.completed ? "border-accent" : "border-muted"
                      }`}
                      style={activity.completed ? { background: "color-mix(in srgb, var(--accent) 20%, transparent)" } : {}}
                    >
                      {activity.completed && <Activity size={12} className="text-accent" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm truncate ${
                          activity.completed ? "text-muted line-through" : "text-heading font-medium"
                        }`}
                      >
                        {activity.title}
                      </p>
                    </div>
                    <span className="text-muted flex-shrink-0 text-xs">
                      {new Date(activity.date).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mood picker */}
          <div
            className="surface-card dashboard-card animate-fade-in-up p-5 md:p-6"
            style={{ animationDelay: "0.6s" }}
          >
            <h3 className="text-heading mb-1 text-lg font-bold">How do you feel?</h3>
            <p className="text-muted mb-4 text-xs">Tap to share your mood</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {MOOD_EMOJIS.map((mood) => (
                <MagneticButton key={mood.value}>
                  <button
                    onClick={() => handleMoodClick(mood)}
                    className={`touch-target touch-press flex flex-col items-center justify-center gap-1 rounded-xl p-2 transition-all cursor-pointer ${
                      selectedMood === mood.value
                        ? "bg-primary/20 scale-105"
                        : "hover:bg-surface-warm"
                    }`}
                    aria-label={mood.label}
                  >
                    <span className="text-2xl transition-transform hover:scale-125">{mood.emoji}</span>
                    <span className="text-muted text-[10px]">{mood.label}</span>
                  </button>
                </MagneticButton>
              ))}
            </div>
            {!moodsLoading && moods.length > 0 && (
              <div className="border-t pt-3" style={{ borderColor: "var(--border)" }}>
                <p className="text-muted text-xs">Latest mood:</p>
                <p className="text-heading mt-1 font-medium capitalize">
                  {moods[0]?.mood || "No mood"}{" "}
                  {MOOD_EMOJIS.find((m) => m.value === moods[0]?.mood)?.emoji}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick rooms */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-heading text-xl font-bold">Quick Rooms</h2>
            <button
              onClick={() => router.push("/home")}
              className="text-body hover:text-primary flex items-center gap-1 text-sm transition-colors touch-target"
            >
              See all <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
            {quickRooms.map((room, i) => (
              <MagneticButton key={room.href}>
                <button
                  onClick={() => router.push(room.href)}
                  className="surface-card touch-press dashboard-card animate-fade-in-up group w-full cursor-pointer p-4 text-center sm:p-6"
                  style={{ animationDelay: `${0.9 + i * 0.1}s` }}
                >
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-2xl shadow-lg transition-transform group-hover:scale-110">
                    {room.emoji}
                  </div>
                  <p className="text-heading font-medium text-sm">{room.name}</p>
                </button>
              </MagneticButton>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
