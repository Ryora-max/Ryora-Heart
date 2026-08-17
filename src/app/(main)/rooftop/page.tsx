"use client";

import { useState, useCallback, useEffect } from "react";
import { CloudMoon, CalendarDays, Star, Heart, Plus, X, Moon } from "lucide-react";
import { APP_CONFIG } from "@/config";
import { calculateDaysTogether } from "@/lib/utils";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { LdrBanner } from "@/components/ldr/LdrBanner";
import { useAuthStore } from "@/stores";

const DEFAULT_SETTINGS = {
  relationshipStartDate: APP_CONFIG.relationship.startDate,
};

const DREAM_EMOJIS = ["🏠", "✈️", "🌅", "🎨", "📚", "🎵", "🍳", "🌊", "🌙", "⭐", "💫", "🌟"];

interface DreamItem {
  emoji: string;
  note: string;
}

export default function RooftopPage() {
  const { token } = useAuthStore();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const daysTogether = calculateDaysTogether(settings.relationshipStartDate);
  const [wishes, setWishes] = useState<string[]>([]);
  const [dreams, setDreams] = useState<DreamItem[]>([]);
  const [newWish, setNewWish] = useState("");
  const [showWishForm, setShowWishForm] = useState(false);
  const [selectedDream, setSelectedDream] = useState<{ emoji: string; note: string } | null>(null);
  const [dreamNote, setDreamNote] = useState("");
  const [stargazing, setStargazing] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function fetchData() {
      try {
        const [wishesRes, dreamsRes] = await Promise.all([
          fetch("/api/db", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "getUserExtra", token, key: "wishes" }),
            cache: "no-store",
          }),
          fetch("/api/db", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "getUserExtra", token, key: "dreams" }),
            cache: "no-store",
          }),
        ]);

        const wishesData = wishesRes.ok ? await wishesRes.json() : null;
        const dreamsData = dreamsRes.ok ? await dreamsRes.json() : null;

        if (!cancelled) {
          const wishList = wishesData?.value ? JSON.parse(wishesData.value) : ["Visit Japan together 🌸", "Build a treehouse 🏡", "Stargaze in the desert ✨"];
          setWishes(wishList);

          const dreamList = dreamsData?.value ? JSON.parse(dreamsData.value) : [];
          setDreams(dreamList);
        }
      } catch {
        if (!cancelled) {
          setWishes(["Visit Japan together 🌸", "Build a treehouse 🏡", "Stargaze in the desert ✨"]);
        }
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [token]);

  useEffect(() => {
    if (!token || !wishes.length) return;
    const timeout = setTimeout(() => {
      fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setUserExtra", token, key: "wishes", value: JSON.stringify(wishes) }),
      }).catch(() => {});
    }, 500);
    return () => clearTimeout(timeout);
  }, [wishes, token]);

  useEffect(() => {
    if (!token || !dreams.length) return;
    const timeout = setTimeout(() => {
      fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "setUserExtra", token, key: "dreams", value: JSON.stringify(dreams) }),
      }).catch(() => {});
    }, 500);
    return () => clearTimeout(timeout);
  }, [dreams, token]);
  const [stars] = useState(() => [...Array(30)].map(() => ({
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 2 + Math.random() * 3,
    size: 4 + Math.random() * 6,
  })));

  const addWish = useCallback(() => {
    if (newWish.trim()) {
      setWishes([...wishes, newWish.trim()]);
      setNewWish("");
      setShowWishForm(false);
    }
  }, [newWish, wishes]);

  const handleDreamClick = useCallback((emoji: string) => {
    const existing = dreams.find((d) => d.emoji === emoji);
    if (existing) {
      setSelectedDream(existing);
    } else {
      setSelectedDream({ emoji, note: "" });
    }
    setDreamNote(existing?.note || "");
  }, [dreams]);

   const saveDreamNote = useCallback(() => {
    if (!selectedDream) return;
    setDreams((prev) => {
      const filtered = prev.filter((d) => d.emoji !== selectedDream.emoji);
      return [...filtered, { emoji: selectedDream.emoji, note: dreamNote }];
    });
    setSelectedDream(null);
    setDreamNote("");
  }, [selectedDream, dreamNote]);

  useEffect(() => {
    if (!token || !settings.relationshipStartDate) return;
    fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getUserSettings", token }),
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data && data.relationshipStartDate) {
          setSettings({ relationshipStartDate: data.relationshipStartDate });
        }
      })
      .catch(() => {});
  }, [token, settings.relationshipStartDate]);

  return (
    <div className={`relative min-h-screen p-3 sm:p-4 md:p-8 transition-all duration-500 ${stargazing ? "bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950" : "page-bg"}`}>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {stars.map((star, i) => (
          <div
            key={i}
            className={`absolute rounded-full ${stargazing ? "text-white animate-pulse" : "text-indigo-300/40"}`}
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              animationDelay: `${star.delay}s`,
              animationDuration: `${star.duration}s`,
            }}
          >
            <Star size={star.size} fill="currentColor" />
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="rooftop-card animate-fade-in-up text-center mb-8 sm:mb-12" style={{ animationDelay: "0s" }}>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gradient-primary mb-2">
            🌙 Rooftop
          </h1>
          <p className="text-body text-sm sm:text-base">Under the stars, making wishes</p>
          <button
            onClick={() => setStargazing(!stargazing)}
            className={`mt-3 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 mx-auto touch-target touch-press ${stargazing ? "bg-indigo-800 text-indigo-200 hover:bg-indigo-700" : "text-body"}`}
            style={stargazing ? undefined : { background: "var(--surface-warm)", border: "1px solid var(--border)" }}
          >
            <Moon size={16} />
            {stargazing ? "Stop Stargazing" : "Stargazing Mode"}
          </button>
        </div>

        <LdrBanner tagline="Atap LDR: kita nggak satu atap, tapi lihat bulan yang sama. Romantis receh. 🌕💞" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8">
          <div className={`rooftop-card animate-fade-in-up rounded-2xl p-6 sm:p-8 border-2 shadow-xl text-center ${stargazing ? "bg-indigo-900/50 border-indigo-700" : "surface-card"}`} style={{ animationDelay: "0.15s" }}>
            <CloudMoon size={48} className={`mx-auto mb-4 ${stargazing ? "text-indigo-300" : "text-primary"}`} />
            <h3 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: stargazing ? "#c7d2fe" : "var(--text-primary)" }}>Night Sky</h3>
            <p className={`text-sm ${stargazing ? "text-indigo-300/70" : "text-body"}`}>Countless stars, one special connection</p>
          </div>

          <div className={`rooftop-card animate-fade-in-up rounded-2xl p-6 sm:p-8 border-2 shadow-xl text-center ${stargazing ? "bg-purple-900/50 border-purple-700" : "surface-card"}`} style={{ animationDelay: "0.3s" }}>
            <CalendarDays size={48} className={`mx-auto mb-4 ${stargazing ? "text-purple-300" : "text-secondary"}`} />
            <h3 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: stargazing ? "#c4b5fd" : "var(--text-primary)" }}>{daysTogether} Days</h3>
            <p className={`text-sm ${stargazing ? "text-purple-300/70" : "text-body"}`}>Together and counting 💕</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className={`rooftop-card animate-fade-in-up rounded-2xl p-6 border-2 shadow-xl ${stargazing ? "bg-yellow-900/30 border-yellow-700" : "surface-card"}`} style={{ animationDelay: "0.45s" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold flex items-center gap-2 ${stargazing ? "text-yellow-200" : "text-heading"}`}>
                <Star size={20} className={stargazing ? "text-yellow-300" : "text-yellow-500"} />
                Wish List
              </h3>
              <MagneticButton>
                <button onClick={() => setShowWishForm(!showWishForm)} className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all touch-target ${stargazing ? "bg-yellow-900/50 hover:bg-yellow-800/50 text-yellow-300" : "text-body"}`} style={stargazing ? undefined : { background: "var(--surface-warm)", border: "1px solid var(--border)" }}>
                  <Plus size={18} />
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
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm touch-target ${stargazing ? "bg-yellow-900/30 border-2 border-yellow-700 text-yellow-100 placeholder-yellow-400 focus:border-yellow-500 focus:outline-none" : "input-soft"}`}
                  autoFocus
                />
                <button onClick={addWish} className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all touch-target touch-press ${stargazing ? "bg-yellow-600 text-white hover:bg-yellow-500" : "text-white"}`} style={stargazing ? undefined : { background: "linear-gradient(to right, var(--primary), var(--secondary))" }}>Add</button>
              </div>
            )}

            <div className="space-y-2">
              {wishes.map((wish, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${stargazing ? "bg-yellow-900/20 hover:bg-yellow-900/30" : ""}`} style={stargazing ? undefined : { background: "var(--surface-warm)" }}>
                  <Star size={16} className={stargazing ? "text-yellow-300" : "text-yellow-500"} />
                  <p className={`text-sm flex-1 ${stargazing ? "text-yellow-100" : "text-heading"}`}>{wish}</p>
                   <button onClick={() => setWishes(wishes.filter((_, idx) => idx !== i))} className={`transition-colors opacity-0 group-hover:opacity-100 p-2 touch-target flex items-center justify-center ${stargazing ? "text-yellow-400 hover:text-red-400" : "text-yellow-400 hover:text-red-400"}`}>
                     <X size={14} />
                   </button>
                </div>
              ))}
            </div>
          </div>

          <div className={`rooftop-card animate-fade-in-up rounded-2xl p-6 border-2 shadow-xl ${stargazing ? "bg-pink-900/30 border-pink-700" : "surface-card"}`} style={{ animationDelay: "0.6s" }}>
            <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${stargazing ? "text-pink-200" : "text-heading"}`}>
              <Heart size={20} className={stargazing ? "text-pink-300" : "text-primary"} />
              Dream Box
            </h3>
            <p className={`text-xs mb-4 ${stargazing ? "text-pink-300/70" : "text-body"}`}>Tap a dream to write your wishes</p>
            <div className="dream-board grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
              {DREAM_EMOJIS.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => handleDreamClick(emoji)}
                  className={`dream-emoji animate-fade-in-scale p-3 sm:p-4 rounded-xl text-center border-2 transition-all cursor-pointer min-h-[60px] flex items-center justify-center touch-press ${stargazing ? "bg-pink-900/30 border-pink-700 hover:border-pink-500 hover:scale-110" : ""}`}
                  style={stargazing ? { animationDelay: `${i * 0.1}s` } : { animationDelay: `${i * 0.1}s`, background: "var(--surface-warm)", border: "1px solid var(--border)" }}
                >
                  <span className="text-2xl sm:text-3xl">{emoji}</span>
                </button>
              ))}
            </div>
            {dreams.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className={`text-xs font-semibold ${stargazing ? "text-pink-300" : "text-body"}`}>Your Dream Notes:</p>
                {dreams.map((dream) => (
                  <div key={dream.emoji} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${stargazing ? "bg-pink-900/20 text-pink-200" : ""}`} style={stargazing ? undefined : { background: "var(--surface-warm)", color: "var(--text-primary)" }}>
                    <span>{dream.emoji}</span>
                    <span className="flex-1 truncate">{dream.note || "Empty dream..."}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedDream && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSelectedDream(null)}>
          <div className={`rounded-2xl p-6 border-2 shadow-xl max-w-md w-full animate-scale-in ${stargazing ? "bg-indigo-900/90 border-indigo-700" : "surface-card"}`} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold flex items-center gap-2 ${stargazing ? "text-indigo-200" : "text-heading"}`}>
                <span className="text-3xl">{selectedDream.emoji}</span> Dream Note
              </h3>
              <button onClick={() => setSelectedDream(null)} className={stargazing ? "text-indigo-400 hover:text-indigo-200 cursor-pointer p-2 touch-target flex items-center justify-center" : "text-muted hover:text-primary cursor-pointer p-2 touch-target flex items-center justify-center"}>
                <X size={20} />
              </button>
            </div>
            <textarea
              value={dreamNote}
              onChange={(e) => setDreamNote(e.target.value)}
              placeholder="Write your dream here..."
              rows={4}
              className={`w-full px-4 py-3 rounded-xl border-2 resize-none text-sm min-h-[120px] ${stargazing ? "bg-indigo-900/50 border-indigo-700 text-indigo-100 placeholder-indigo-400 focus:border-indigo-500 focus:outline-none" : "input-soft"}`}
            />
            <button
              onClick={saveDreamNote}
              disabled={!dreamNote.trim()}
              className={`mt-3 w-full py-3 rounded-xl font-bold transition-all cursor-pointer touch-target touch-press ${stargazing ? "bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50" : "text-white disabled:opacity-50"}`}
              style={stargazing ? undefined : { background: "linear-gradient(to right, var(--primary), var(--secondary))" }}
            >
              Save Dream
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
