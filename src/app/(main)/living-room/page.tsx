"use client";

import { useState, useCallback } from "react";
import { CheckCircle2, User, Search } from "lucide-react";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { LdrBanner } from "@/components/ldr/LdrBanner";
import { useActivities, useMoods } from "@/hooks/useDatabase";
import { useAuthStore } from "@/stores";
import type { MoodEntry } from "@/types";

interface ConfettiHeart {
  id: number;
  left: number;
  emoji: string;
}

const MOOD_OPTIONS = [
  { value: "happy", label: "Happy", icon: "😊", color: "text-yellow-500" },
  { value: "love", label: "Love", icon: "😍", color: "text-pink-500" },
  { value: "excited", label: "Excited", icon: "🤩", color: "text-green-500" },
  { value: "calm", label: "Calm", icon: "😌", color: "text-blue-500" },
  { value: "miss", label: "Miss", icon: "🥺", color: "text-purple-500" },
  { value: "sad", label: "Sad", icon: "😢", color: "text-gray-500" },
] as const;

export default function LivingRoomPage() {
  const [selectedMood, setSelectedMood] = useState<MoodEntry["mood"] | null>(null);
  const [moodNote, setMoodNote] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newActivityTitle, setNewActivityTitle] = useState("");
  const [newActivityType, setNewActivityType] = useState<"schedule" | "reminder" | "milestone">("schedule");
  const [confetti, setConfetti] = useState<ConfettiHeart[]>([]);
  const { token } = useAuthStore();
  const { activities, loading: activitiesLoading, createActivity, toggleActivity } = useActivities(token || "");
  const { moods, loading: moodsLoading, addMood } = useMoods(token || "");

  const spawnConfetti = useCallback(() => {
    const hearts: ConfettiHeart[] = [];
    for (let i = 0; i < 12; i++) {
      hearts.push({
        id: Date.now() + i,
        left: Math.random() * 90,
        emoji: ["💖", "💕", "🩷", "✨", "🎉"][Math.floor(Math.random() * 5)],
      });
    }
    setConfetti((prev) => [...prev, ...hearts]);
    setTimeout(() => {
      setConfetti((prev) => prev.filter((h) => !hearts.find((c) => c.id === h.id)));
    }, 1500);
  }, []);

  const handleToggleActivity = async (id: string, completed: boolean) => {
    await toggleActivity?.(id, completed);
    if (completed) spawnConfetti();
  };

  const handleMoodSubmit = async () => {
    if (!selectedMood || !token) return;
    await addMood({ mood: selectedMood, note: moodNote || undefined });
    setSelectedMood(null);
    setMoodNote("");
  };

  const handleAddActivity = async () => {
    if (!newActivityTitle.trim() || !createActivity) return;
    await createActivity(newActivityTitle.trim(), newActivityType, new Date());
    setNewActivityTitle("");
    setShowAddForm(false);
  };

  const todayActivities = activities.filter((a) => {
    const today = new Date();
    const d = new Date(a.date);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  });

  const filteredActivities = todayActivities.filter((a) => a.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-cyan-100 to-teal-100 p-3 sm:p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-500 to-cyan-600 bg-clip-text text-transparent mb-2">
            🛋️ Living Room
          </h1>
          <p className="text-blue-600/70">Where you spend quality time together</p>
        </div>

        <LdrBanner tagline="Living room virtual: kita duduk bersebelahan lewat layar. Saling senggol pixel. 🛋️💞" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
          <div className="room-card animate-fade-in-up lg:col-span-2 bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-blue-200 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-bold text-blue-900 flex items-center gap-2">
            <User size={18} className="text-blue-500" />
            Today&apos;s Activity
          </h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-8 pr-3 py-2 bg-blue-50 border-2 border-blue-200 rounded-lg text-sm focus:border-blue-400 focus:outline-none w-32 md:w-36 min-h-[44px]"
              />
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-2.5 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-all flex items-center gap-1 cursor-pointer min-h-[44px]"
            >
                  {showAddForm ? "Cancel" : "+ Add"}
                </button>
              </div>
            </div>

            {showAddForm && (
              <div className="mb-4 p-4 rounded-xl bg-blue-50 border-2 border-blue-200 animate-scale-in space-y-3">
                <h4 className="text-sm font-bold text-blue-900">Add Daily Activity 📅</h4>
                <div className="flex flex-col sm:flex-row gap-2">
                   <input
                    type="text"
                    value={newActivityTitle}
                    onChange={(e) => setNewActivityTitle(e.target.value)}
                    placeholder="E.g., Virtual dinner date, Watch movie..."
                    className="flex-1 px-3 py-2.5 bg-white border-2 border-blue-200 rounded-xl text-sm focus:border-blue-400 focus:outline-none text-blue-900 min-h-[44px]"
                  />
                  <select
                    value={newActivityType}
                    onChange={(e) => setNewActivityType(e.target.value as "schedule" | "reminder" | "milestone")}
                    className="px-3 py-2.5 bg-white border-2 border-blue-200 rounded-xl text-sm focus:border-blue-400 focus:outline-none text-blue-900 min-h-[44px]"
                  >
                    <option value="schedule">Schedule</option>
                    <option value="reminder">Reminder</option>
                    <option value="milestone">Milestone</option>
                  </select>
                   <button
                    onClick={handleAddActivity}
                    disabled={!newActivityTitle.trim()}
                    className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-all cursor-pointer min-h-[44px]"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {activitiesLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : filteredActivities.length === 0 ? (
              <p className="text-blue-600/70 text-center py-8">No activities today 💤</p>
            ) : (
              <div className="space-y-2">
                {filteredActivities.map((activity) => (
                  <div
                     key={activity.id}
                     onClick={() => handleToggleActivity(activity.id, !activity.completed)}
                     className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/50 hover:bg-blue-50 transition-all cursor-pointer group"
                   >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all group-hover:scale-110 ${activity.completed ? "border-green-400 bg-green-400/20" : "border-blue-300"}`}>
                      {activity.completed && <CheckCircle2 size={12} className="text-green-500" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm transition-all ${activity.completed ? "text-blue-600/50 line-through" : "text-blue-900 font-medium group-hover:text-blue-600"}`}>{activity.title}</p>
                    </div>
                    <span className="text-xs text-blue-400">
                      {new Date(activity.date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            )}

          </div>

          <div className="room-card bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-pink-200 shadow-xl">
            <h3 className="text-lg font-bold text-pink-900 mb-4 text-center">How are you feeling?</h3>
            {selectedMood ? (
              <div className="space-y-4 text-center">
                <div className="text-5xl animate-bounce">{MOOD_OPTIONS.find((m) => m.value === selectedMood)?.icon}</div>
                 <textarea
                  value={moodNote}
                  onChange={(e) => setMoodNote(e.target.value)}
                  placeholder="Add a note..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-pink-900 placeholder-pink-300 resize-none text-sm min-h-[44px]"
                />
                <div className="flex gap-2">
                  <button onClick={() => setSelectedMood(null)} className="flex-1 py-2 rounded-xl border-2 border-pink-200 text-pink-600 hover:bg-pink-50 transition-all text-sm">Cancel</button>
                  <MagneticButton>
                    <button onClick={handleMoodSubmit} className="flex-1 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold hover:from-pink-600 hover:to-rose-600 transition-all text-sm">Save</button>
                  </MagneticButton>
                </div>
              </div>
            ) : (
                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                 {MOOD_OPTIONS.map((mood, idx) => (
                   <MagneticButton key={mood.value}>
                     <button
                       onClick={() => setSelectedMood(mood.value)}
                       className="room-card animate-fade-in-up flex flex-col items-center gap-1 p-3 rounded-xl bg-gradient-to-br from-pink-50 to-rose-50 hover:from-pink-100 hover:to-rose-100 border-2 border-pink-200 hover:border-pink-300 transition-all hover:scale-105"
                       style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      <span className="text-2xl">{mood.icon}</span>
                      <span className="text-xs text-pink-700 font-medium">{mood.label}</span>
                    </button>
                  </MagneticButton>
                ))}
              </div>
            )}
          </div>

          {confetti.length > 0 && (
            <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
              {confetti.map((h) => (
                <span
                  key={h.id}
                  className="absolute text-2xl select-none"
                  style={{
                    left: `${h.left}%`,
                    bottom: "20%",
                    animation: "float-up 1.2s ease-out forwards",
                  }}
                >
                  {h.emoji}
                </span>
              ))}
            </div>
          )}
        </div>

                 <div className="room-card animate-fade-in-up bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border-2 border-purple-200 shadow-xl" style={{ animationDelay: "0.2s" }}>
          <h3 className="text-lg font-bold text-purple-900 mb-4">Recent Moods 💭</h3>
          {moodsLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : moods.length === 0 ? (
            <p className="text-purple-600/70 text-center py-8">No moods yet. How are you feeling?</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {moods.slice(0, 10).map((mood) => {
                const moodOption = MOOD_OPTIONS.find((m) => m.value === mood.mood);
                return (
                  <div key={mood.id} className="flex-shrink-0 bg-gradient-to-br from-pink-50 to-purple-50 p-4 rounded-xl border-2 border-pink-100 text-center min-w-[120px] hover:scale-105 transition-transform cursor-pointer">
                    <div className="text-3xl mb-2">{moodOption?.icon}</div>
                    <p className="text-xs text-purple-700 font-medium capitalize">{mood.mood}</p>
                    {mood.note && <p className="text-xs text-purple-500 mt-1 truncate">{mood.note}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
