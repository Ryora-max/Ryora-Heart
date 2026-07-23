"use client";

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { LdrBanner } from "@/components/ldr/LdrBanner";
import { useAuthStore } from "@/stores";

interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  requirement: {
    type: "days" | "photos" | "letters" | "video_calls" | "milestones";
    value: number;
  };
}

const ALL_ACHIEVEMENTS: AchievementDef[] = [
  { id: "1", title: "100 Days Together", description: "Reached 100 days of love", icon: "💝", color: "from-pink-400 to-rose-400", requirement: { type: "days", value: 100 } },
  { id: "2", title: "First Photo", description: "Uploaded your first photo", icon: "📸", color: "from-blue-400 to-cyan-400", requirement: { type: "photos", value: 1 } },
  { id: "3", title: "Love Letter", description: "Wrote your first love letter", icon: "💌", color: "from-purple-400 to-pink-400", requirement: { type: "letters", value: 1 } },
  { id: "4", title: "First Video Call", description: "Had your first video call", icon: "📹", color: "from-green-400 to-emerald-400", requirement: { type: "video_calls", value: 1 } },
  { id: "5", title: "First Milestone", description: "Created your first milestone", icon: "✨", color: "from-orange-400 to-amber-400", requirement: { type: "milestones", value: 1 } },
  { id: "6", title: "100 Photos", description: "Uploaded 100 photos", icon: "📸", color: "from-cyan-400 to-blue-400", requirement: { type: "photos", value: 100 } },
  { id: "7", title: "365 Days", description: "Reached 1 year together", icon: "🏆", color: "from-yellow-400 to-orange-400", requirement: { type: "days", value: 365 } },
  { id: "8", title: "100 Letters", description: "Wrote 100 love letters", icon: "💌", color: "from-indigo-400 to-purple-400", requirement: { type: "letters", value: 100 } },
  { id: "9", title: "LDR Survivor", description: "Bertahan rindu beda kota", icon: "💞", color: "from-pink-400 to-rose-400", requirement: { type: "days", value: 30 } },
  { id: "10", title: "Milestone Master", description: "Created 5 milestones together", icon: "🌟", color: "from-teal-400 to-emerald-400", requirement: { type: "milestones", value: 5 } },
];

interface AchievementProgress {
  daysTogether: number;
  photos: number;
  letters: number;
  videoCalls: number;
  milestones: number;
}

export default function AchievementsPage() {
  const { token } = useAuthStore();
  const [progress, setProgress] = useState<AchievementProgress>({
    daysTogether: 0,
    photos: 0,
    letters: 0,
    videoCalls: 0,
    milestones: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function fetchAchievements() {
      try {
        const res = await fetch("/api/db", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "getAchievements", token }),
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        if (!cancelled) {
          setProgress({
            daysTogether: data.daysTogether || 0,
            photos: data.galleryCount || 0,
            letters: data.letterCount || 0,
            videoCalls: data.vcCount || 0,
            milestones: data.milestoneCount || 0,
          });
        }
      } catch {
        if (!cancelled) {
          setProgress({ daysTogether: 0, photos: 0, letters: 0, videoCalls: 0, milestones: 0 });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchAchievements();
    return () => { cancelled = true; };
  }, [token]);

  const getCurrentValue = (type: AchievementDef["requirement"]["type"]): number => {
    switch (type) {
      case "days": return progress.daysTogether;
      case "photos": return progress.photos;
      case "letters": return progress.letters;
      case "video_calls": return progress.videoCalls;
      case "milestones": return progress.milestones;
      default: return 0;
    }
  };

  const unlockedCount = ALL_ACHIEVEMENTS.filter((a) => getCurrentValue(a.requirement.type) >= a.requirement.value).length;
  const totalCount = ALL_ACHIEVEMENTS.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-yellow-100 to-orange-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent mb-2">
            🏆 Achievements
          </h1>
          <p className="text-amber-600/70">Your love milestones and badges</p>
        </div>

        <LdrBanner tagline="Achievement LDR: bertahan rindu tanpa pegang tangan. Level legend. 🏆💞" />

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-8 border-2 border-amber-200 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-amber-900">Progress</h3>
              <p className="text-amber-600/70 text-sm">{unlockedCount} of {totalCount} unlocked</p>
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
              {Math.round((unlockedCount / totalCount) * 100)}%
            </div>
          </div>
          <div className="w-full h-3 bg-amber-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000" style={{ width: `${(unlockedCount / totalCount) * 100}%` }} />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border-2 border-amber-200 shadow-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ALL_ACHIEVEMENTS.map((achievement, i) => {
              const current = getCurrentValue(achievement.requirement.type);
              const required = achievement.requirement.value;
              const isUnlocked = current >= required;
              return (
                <MagneticButton key={achievement.id}>
                  <div
                    className={cn(
                      "achievement-card bg-white/80 backdrop-blur-sm p-5 rounded-2xl border-2 shadow-lg transition-all",
                      isUnlocked ? "border-amber-200 hover:border-amber-300 cursor-pointer hover:scale-105" : "opacity-60 border-gray-200"
                    )}
                    style={{ animationDelay: `${i * 0.08}s` }}
                  >
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${achievement.color} flex items-center justify-center text-3xl mb-3 shadow-md`}>
                      {achievement.icon}
                    </div>
                    <h3 className="font-bold text-gray-800 mb-1">{achievement.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{achievement.description}</p>
                    {isUnlocked ? (
                      <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                        <Star size={14} fill="currentColor" />
                        Unlocked
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span>Progress</span>
                          <span>{current}/{required}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gray-300 rounded-full" style={{ width: `${Math.min(100, (current / required) * 100)}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                </MagneticButton>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
