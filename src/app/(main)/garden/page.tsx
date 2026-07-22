"use client";

import { useState, useCallback } from "react";
import { Flower2, Plus, X, TreeDeciduous, Leaf } from "lucide-react";
import { useActivities } from "@/hooks/useDatabase";
import { useAuthStore } from "@/stores";
import { EmptyState } from "@/components/ui/EmptyState";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";

interface SelectedMilestone {
  id: string;
  title: string;
  description?: string;
  date: Date;
}

export default function GardenPage() {
  const { token } = useAuthStore();
  const { activities, loading, createActivity } = useActivities(token || "");

  const [selected, setSelected] = useState<SelectedMilestone | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState("");

  const milestones = activities
    .filter((a) => a.type === "milestone")
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const handleCreate = useCallback(async () => {
    if (!newTitle.trim() || !newDate || !token) return;
    await createActivity(newTitle.trim(), "milestone", new Date(newDate), newDesc || undefined);
    setNewTitle("");
    setNewDesc("");
    setNewDate("");
    setShowForm(false);
  }, [newTitle, newDesc, newDate, token, createActivity]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-green-100 via-emerald-100 to-teal-100 p-3 sm:p-4 md:p-8 overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <div className="garden-header animate-fade-in-up text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent mb-2">
            🌳 Garden
          </h1>
          <p className="text-green-600/70 text-sm sm:text-base">Your relationship timeline, growing like a plant 🌱</p>
        </div>

        {loading ? (
          <CardSkeleton />
        ) : milestones.length === 0 ? (
          <EmptyState icon={Flower2} emoji="🌱" title="No milestones yet" description="Add your first memory!" action={
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 px-6 py-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg cursor-pointer"
            >
              <Plus size={18} className="inline mr-2" /> Add Milestone
            </button>
          } />
        ) : (
          <div className="relative">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <TreeDeciduous size={64} className="text-green-600 animate-fade-in-up" />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-8 bg-gradient-to-b from-green-800 to-green-900 rounded-full" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {milestones.map((milestone, i) => {
                const isEven = i % 2 === 0;
                const fruitEmojis = ["🍎", "🍊", "🍋", "🍇", "🍓", "🍑", "🥝", "🍒"];
                const emoji = fruitEmojis[i % fruitEmojis.length];
                return (
                  <button
                    key={milestone.id}
                    onClick={() => setSelected(milestone)}
                    className="group relative flex flex-col items-center animate-fade-in-up hover:scale-110 transition-all cursor-pointer"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div className={`relative ${isEven ? "mt-4" : "mb-4"}`}>
                      <span className="text-3xl sm:text-4xl filter drop-shadow-lg group-hover:animate-bounce transition-all">
                        {emoji}
                      </span>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-3 bg-green-700 rounded-full" />
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-xs sm:text-sm font-semibold text-green-800 line-clamp-1">{milestone.title}</p>
                      <p className="text-xs text-green-600/70">
                        {new Date(milestone.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:from-green-600 hover:to-emerald-600 transition-all shadow-lg cursor-pointer flex items-center gap-2 hover:scale-105 transform"
              >
                <Plus size={18} /> Add Milestone
              </button>
            </div>
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelected(null)}>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border-2 border-green-200 shadow-xl max-w-md w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-green-900 flex items-center gap-2">
                <Leaf className="text-green-500" size={20} /> {selected.title}
              </h3>
              <button onClick={() => setSelected(null)} className="text-green-400 hover:text-green-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <p className="text-green-600/70 text-sm mb-2">
              {new Date(selected.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            {selected.description && <p className="text-green-800 text-sm leading-relaxed">{selected.description}</p>}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border-2 border-green-200 shadow-xl max-w-md w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-green-900">Add Milestone 🌱</h3>
              <button onClick={() => setShowForm(false)} className="text-green-400 hover:text-green-600 cursor-pointer">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Milestone title..."
                className="w-full px-4 py-3 rounded-xl border-2 border-green-200 focus:border-green-400 focus:outline-none text-green-900 text-sm"
              />
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-green-200 focus:border-green-400 focus:outline-none text-green-900 text-sm"
              />
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Description (optional)..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl border-2 border-green-200 focus:border-green-400 focus:outline-none text-green-900 text-sm resize-none"
              />
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim() || !newDate}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 transition-all cursor-pointer"
              >
                Save Milestone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
