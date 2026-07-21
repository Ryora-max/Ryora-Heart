"use client";

import { Star, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { LdrBanner } from "@/components/ldr/LdrBanner";

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  total?: number;
  color: string;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: "1", title: "100 Days Together", description: "Reached 100 days of love", icon: "💝", unlocked: true, color: "from-pink-400 to-rose-400" },
  { id: "2", title: "First Photo", description: "Uploaded your first photo", icon: "📸", unlocked: true, color: "from-blue-400 to-cyan-400" },
  { id: "3", title: "Love Letter", description: "Wrote your first love letter", icon: "💌", unlocked: true, color: "from-purple-400 to-pink-400" },
  { id: "4", title: "First Video Call", description: "Had your first video call", icon: "📹", unlocked: true, color: "from-green-400 to-emerald-400" },
  { id: "5", title: "First Trip", description: "Went on your first trip together", icon: "✈️", unlocked: false, progress: 0, total: 1, color: "from-orange-400 to-amber-400" },
  { id: "6", title: "100 Photos", description: "Uploaded 100 photos", icon: "📸", unlocked: false, progress: 0, total: 100, color: "from-cyan-400 to-blue-400" },
  { id: "7", title: "365 Days", description: "Reached 1 year together", icon: "🏆", unlocked: false, progress: 100, total: 365, color: "from-yellow-400 to-orange-400" },
  { id: "8", title: "100 Letters", description: "Wrote 100 love letters", icon: "💌", unlocked: false, progress: 0, total: 100, color: "from-indigo-400 to-purple-400" },
  { id: "9", title: "LDR Survivor", description: "Bertahan rindu beda kota", icon: "💞", unlocked: true, color: "from-pink-400 to-rose-400" },
  { id: "10", title: "First Meetup", description: "Ketemu setelah LDR", icon: "✈️", unlocked: false, progress: 0, total: 1, color: "from-orange-400 to-amber-400" },
];

export default function AchievementsPage() {
  const unlockedCount = ACHIEVEMENTS.filter((a) => a.unlocked).length;
  const totalCount = ACHIEVEMENTS.length;

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ACHIEVEMENTS.map((achievement, i) => (
            <MagneticButton key={achievement.id}>
              <div
                className={cn(
                  "achievement-card animate-scale-in bg-white/80 backdrop-blur-sm p-5 rounded-2xl border-2 shadow-lg transition-all",
                  achievement.unlocked ? "border-amber-200 hover:border-amber-300 cursor-pointer hover:scale-105" : "opacity-60 border-gray-200"
                )}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${achievement.color} flex items-center justify-center text-3xl mb-3 shadow-md`}>
                  {achievement.icon}
                </div>
                <h3 className="font-bold text-gray-800 mb-1">{achievement.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{achievement.description}</p>
                {achievement.unlocked ? (
                  <div className="flex items-center gap-1 text-green-600 text-sm font-medium">
                    <Star size={14} fill="currentColor" />
                    Unlocked
                  </div>
                ) : achievement.progress !== undefined && achievement.total !== undefined ? (
                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>
                        {achievement.progress}/{achievement.total}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gray-300 rounded-full" style={{ width: `${(achievement.progress / achievement.total) * 100}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-gray-400 text-sm">
                    <Lock size={14} />
                    Locked
                  </div>
                )}
              </div>
            </MagneticButton>
          ))}
        </div>
      </div>
    </div>
  );
}
