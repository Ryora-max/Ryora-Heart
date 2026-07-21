"use client";

import { useState } from "react";
import { CloudMoon, CalendarDays, Star, Heart, Plus, X } from "lucide-react";
import { APP_CONFIG } from "@/config";
import { calculateDaysTogether } from "@/lib/utils";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { LdrBanner } from "@/components/ldr/LdrBanner";

const DEFAULT_SETTINGS = {
  relationshipStartDate: APP_CONFIG.relationship.startDate,
};

export default function RooftopPage() {
  const [settings] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
      const stored = localStorage.getItem("ryora-settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {}
    return DEFAULT_SETTINGS;
  });
  const daysTogether = calculateDaysTogether(settings.relationshipStartDate);
  const [wishes, setWishes] = useState(["Visit Japan together 🌸", "Build a treehouse 🏡", "Stargaze in the desert ✨"]);
  const [newWish, setNewWish] = useState("");
  const [showWishForm, setShowWishForm] = useState(false);

  const addWish = () => {
    if (newWish.trim()) {
      setWishes([...wishes, newWish.trim()]);
      setNewWish("");
      setShowWishForm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="rooftop-card animate-fade-in-up text-center mb-12" style={{ animationDelay: "0s" }}>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            🌙 Rooftop
          </h1>
          <p className="text-indigo-600/70">Under the stars, making wishes</p>
        </div>

        <LdrBanner tagline="Atap LDR: kita nggak satu atap, tapi lihat bulan yang sama. Romantis receh. 🌕💞" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="rooftop-card animate-fade-in-up bg-white/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-indigo-200 shadow-xl text-center" style={{ animationDelay: "0.15s" }}>
            <CloudMoon size={48} className="text-indigo-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-indigo-900 mb-2">Night Sky</h3>
            <p className="text-indigo-600/70">Countless stars, one special connection</p>
          </div>

          <div className="rooftop-card animate-fade-in-up bg-white/80 backdrop-blur-sm rounded-2xl p-8 border-2 border-purple-200 shadow-xl text-center" style={{ animationDelay: "0.3s" }}>
            <CalendarDays size={48} className="text-purple-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-purple-900 mb-2">{daysTogether} Days</h3>
            <p className="text-purple-600/70">Together and counting 💕</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rooftop-card animate-fade-in-up bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-yellow-200 shadow-xl" style={{ animationDelay: "0.45s" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-yellow-900 flex items-center gap-2">
                <Star size={20} className="text-yellow-500" />
                Wish List
              </h3>
              <MagneticButton>
                <button onClick={() => setShowWishForm(!showWishForm)} className="w-8 h-8 rounded-lg bg-yellow-100 hover:bg-yellow-200 flex items-center justify-center transition-all">
                  <Plus size={18} className="text-yellow-600" />
                </button>
              </MagneticButton>
            </div>

            {showWishForm && (
              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={newWish}
                  onChange={(e) => setNewWish(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addWish()}
                  placeholder="Add a wish..."
                  className="flex-1 px-4 py-2 rounded-xl border-2 border-yellow-200 focus:border-yellow-400 focus:outline-none text-yellow-900 placeholder-yellow-400 text-sm"
                  autoFocus
                />
                <button onClick={addWish} className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 text-white text-sm font-bold hover:from-yellow-500 hover:to-amber-600 transition-all">Add</button>
              </div>
            )}

            <div className="space-y-2">
              {wishes.map((wish, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-yellow-50/50 hover:bg-yellow-50 transition-all group">
                  <Star size={16} className="text-yellow-500 flex-shrink-0" />
                  <p className="text-yellow-900 text-sm flex-1">{wish}</p>
                  <button onClick={() => setWishes(wishes.filter((_, idx) => idx !== i))} className="text-yellow-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rooftop-card animate-fade-in-up bg-white/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-pink-200 shadow-xl" style={{ animationDelay: "0.6s" }}>
            <h3 className="text-lg font-bold text-pink-900 mb-4 flex items-center gap-2">
              <Heart size={20} className="text-pink-500" />
              Dream Board
            </h3>
            <div className="dream-board grid grid-cols-4 gap-3">
              {["🏠", "✈️", "🌅", "🎨", "📚", "🎵", "🍳", "🌊"].map((emoji, i) => (
                <div key={i} className="dream-emoji animate-fade-in-scale bg-gradient-to-br from-pink-50 to-rose-50 p-4 rounded-xl text-center border-2 border-pink-200 hover:border-pink-300 hover:scale-110 transition-all cursor-pointer" style={{ animationDelay: `${i * 0.1}s` }}>
                  <span className="text-3xl">{emoji}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
