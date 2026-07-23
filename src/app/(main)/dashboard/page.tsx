"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { APP_CONFIG } from "@/config";
import { useAuthStore } from "@/stores";
import { calculateDaysTogether } from "@/lib/utils";
import { Heart, Calendar, MapPin, Music, Activity, Search } from "lucide-react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { LdrBanner } from "@/components/ldr/LdrBanner";
import { useActivities, useMoods, useGallery } from "@/hooks/useDatabase";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton, ListItemSkeleton } from "@/components/ui/LoadingSkeleton";

const MOOD_EMOJIS = [
  { value: "happy", emoji: "😊" },
  { value: "love", emoji: "😍" },
  { value: "excited", emoji: "🤩" },
  { value: "calm", emoji: "😌" },
  { value: "miss", emoji: "🥺" },
  { value: "sad", emoji: "😢" },
] as const;

export default function DashboardPage() {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { activities, loading: activitiesLoading } = useActivities(token || "");
  const { moods, loading: moodsLoading, addMood } = useMoods(token || "");
  const { photos, loading: galleryLoading } = useGallery(token || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [relationshipStartDate, setRelationshipStartDate] = useState(APP_CONFIG.relationship.startDate);

  useEffect(() => {
    if (!token) return;
    fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getUserSettings", token }),
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.relationshipStartDate) {
          setRelationshipStartDate(data.relationshipStartDate);
        }
      })
      .catch(() => {});
  }, [token]);

  const daysTogether = useMemo(() => calculateDaysTogether(relationshipStartDate), [relationshipStartDate]);
  const statsLoading = activitiesLoading || moodsLoading || galleryLoading;
  const stats = useMemo(() => [
    { label: "Days Together", value: daysTogether, icon: Heart, color: "from-pink-400 to-rose-400", emoji: "💝" },
    { label: "Activities", value: activities.length, icon: Calendar, color: "from-purple-400 to-pink-400", emoji: "📋" },
    { label: "Photos", value: photos.length, icon: MapPin, color: "from-blue-400 to-cyan-400", emoji: "📸" },
    { label: "Moods", value: moods.length, icon: Music, color: "from-amber-400 to-orange-400", emoji: "💭" },
  ], [daysTogether, activities.length, photos.length, moods.length]);

  const filteredActivities = activities.filter((a) => a.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="dashboard-card animate-fade-in-up mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-3">
            Welcome Home, <span className="bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">{user?.name?.split(" ")[0] || "Guest"}!</span>
          </h1>
          <p className="text-purple-600/70 text-lg">Here&apos;s what&apos;s happening in your world today 💕</p>
        </div>

        <LdrBanner tagline="Dashboard cinta jarak jauh: beda kota, tapi notif hati selalu nyambung. 💞" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} style={{ animationDelay: `${i * 0.05}s` }} />)
          ) : (
            stats.map((stat, i) => (
              <GlassPanel key={i} className="dashboard-card animate-fade-in-up p-4 sm:p-5 bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-[0.98]" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-xl shadow-lg`}>
                    {stat.emoji}
                  </div>
                </div>
                <p className="text-2xl font-bold text-gray-800 mb-1">{typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}</p>
                <p className="text-gray-600 text-sm">{stat.label}</p>
              </GlassPanel>
            ))
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <GlassPanel className="dashboard-card animate-fade-in-up p-6 lg:col-span-2 bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl" style={{ animationDelay: "0.5s" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Activity size={18} className="text-purple-500" />
                Recent Activities
              </h3>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="pl-8 pr-3 py-1.5 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm focus:border-purple-400 focus:outline-none w-36"
                />
              </div>
            </div>
            {activitiesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <ListItemSkeleton key={i} style={{ animationDelay: `${i * 0.05}s` }} />)}
              </div>
            ) : filteredActivities.length === 0 ? (
              <EmptyState emoji="💤" title="No activities yet" description="Start adding activities to see them here" />
            ) : (
              <div className="space-y-2">
                {filteredActivities.slice(0, 5).map((activity, idx) => (
                  <div key={activity.id} className="dashboard-card animate-fade-in-up flex items-center gap-3 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-all" style={{ animationDelay: `${0.7 + idx * 0.05}s` }}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${activity.completed ? "border-green-400 bg-green-400/20" : "border-gray-300"}`}>
                      {activity.completed && <Activity size={12} className="text-green-500" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${activity.completed ? "text-gray-500 line-through" : "text-gray-800 font-medium"}`}>{activity.title}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(activity.date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>

          <GlassPanel className="dashboard-card animate-fade-in-up p-6 bg-white/80 backdrop-blur-sm border-2 border-white/50 shadow-xl" style={{ animationDelay: "0.6s" }}>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Mood 💭</h3>
            <div className="flex justify-between mb-4">
              {MOOD_EMOJIS.map((mood) => (
                <MagneticButton key={mood.value}>
                  <button
                    onClick={() => addMood({ mood: mood.value })}
                    className="text-3xl hover:scale-125 transition-transform cursor-pointer p-2 hover:bg-white/50 rounded-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
                  >
                    {mood.emoji}
                  </button>
                </MagneticButton>
              ))}
            </div>
            {!moodsLoading && moods.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-gray-500 text-sm">Latest mood:</p>
                <p className="text-gray-800 font-medium mt-1 capitalize">{moods[0]?.mood || "No mood"}</p>
              </div>
            )}
          </GlassPanel>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Living Room", href: "/living-room", emoji: "🛋️", color: "from-blue-400 to-cyan-400" },
            { name: "Bedroom", href: "/bedroom", emoji: "🛏️", color: "from-pink-400 to-rose-400" },
            { name: "Garden", href: "/garden", emoji: "🌸", color: "from-green-400 to-emerald-400" },
            { name: "Rooftop", href: "/rooftop", emoji: "🌙", color: "from-indigo-400 to-purple-400" },
          ].map((room, i) => (
            <MagneticButton key={room.href}>
                <button
                  onClick={() => router.push(room.href)}
                  className="dashboard-card animate-fade-in-up bg-white/80 backdrop-blur-sm p-4 sm:p-6 text-center cursor-pointer w-full border-2 border-white/50 shadow-xl hover:shadow-2xl transition-all hover:scale-105 active:scale-[0.98] group"
                  style={{ animationDelay: `${0.9 + i * 0.1}s` }}
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${room.color} flex items-center justify-center text-2xl mx-auto mb-2 shadow-lg group-hover:scale-110 transition-transform`}>
                  {room.emoji}
                </div>
                <p className="text-gray-800 font-medium text-sm">{room.name}</p>
              </button>
            </MagneticButton>
          ))}
        </div>
      </div>
    </div>
  );
}
