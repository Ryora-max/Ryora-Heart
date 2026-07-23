"use client";

import { useState, useEffect } from "react";
import { X, Send, Search, Play, Square, Mic, Moon, Sun, Star } from "lucide-react";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { LdrBanner } from "@/components/ldr/LdrBanner";
import { useLetters } from "@/hooks/useDatabase";
import { useAuthStore } from "@/stores";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListItemSkeleton } from "@/components/ui/LoadingSkeleton";

type Tab = "love" | "openwhen" | "voice" | "secret";

const GOOD_NIGHT_MESSAGES = [
  "Good night, my love 🌙 Sweet dreams!",
  "Sleep tight, sayang 😴💕",
  "Tonight I'll dream of you 🌙✨",
  "Close your eyes, I'm right here 💫",
  "Good night, my everything 🌙❤️",
];

export default function BedroomPage() {
  const [activeTab, setActiveTab] = useState<Tab>("love");
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [voiceType, setVoiceType] = useState<"normal" | "cute" | "chipmunk" | "deep">("cute");
  const [searchQuery, setSearchQuery] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [nightMode, setNightMode] = useState(false);
  const [stars] = useState(() => [...Array(20)].map(() => ({
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 2 + Math.random() * 3,
    size: 8 + Math.random() * 8,
  })));

  const { token, user } = useAuthStore();
  const { letters, loading, createLetter } = useLetters(token || "");

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, [activeTab]);

  const filteredLetters = letters
    .filter((l) => {
      if (activeTab === "love") return l.type === "love_letter";
      if (activeTab === "openwhen") return l.type === "open_when" && l.content && !l.content.startsWith("[VOICE:");
      if (activeTab === "voice") return l.type === "open_when" && l.content && l.content.startsWith("[VOICE:");
      if (activeTab === "secret") return l.type === "secret";
      return false;
    })
    .filter((l) => l.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSubmit = async () => {
    if (!newTitle.trim() || !newContent.trim() || !token) return;
    
    let contentToSave = newContent.trim();
    if (activeTab === "voice") {
      contentToSave = `[VOICE:${voiceType}]${contentToSave}`;
    }

    const typeMap: Record<Tab, "love_letter" | "open_when" | "secret"> = {
      love: "love_letter",
      openwhen: "open_when",
      voice: "open_when",
      secret: "secret",
    };

    await createLetter({
      title: newTitle.trim(),
      content: contentToSave,
      type: typeMap[activeTab],
      openDate: activeTab === "openwhen" ? new Date() : undefined,
    });

    setNewTitle("");
    setNewContent("");
    setShowForm(false);
  };

  const handleGoodNight = async () => {
    if (!token) return;
    const msg = GOOD_NIGHT_MESSAGES[Math.floor(Math.random() * GOOD_NIGHT_MESSAGES.length)];
    await createLetter({
      title: "Good Night 💌",
      content: msg,
      type: "love_letter",
    });
  };

  const handlePlayVoice = (id: string, text: string, type: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (playingId === id) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    setPlayingId(id);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "id-ID";

    if (type === "chipmunk") {
      utterance.pitch = 1.6;
      utterance.rate = 1.25;
    } else if (type === "cute") {
      utterance.pitch = 1.35;
      utterance.rate = 1.1;
    } else if (type === "deep") {
      utterance.pitch = 0.65;
      utterance.rate = 0.9;
    } else {
      utterance.pitch = 1.0;
      utterance.rate = 1.0;
    }

    utterance.onend = () => setPlayingId(null);
    utterance.onerror = () => setPlayingId(null);

    window.speechSynthesis.speak(utterance);
  };

  const tabs: { key: Tab; label: string; icon: string; gradient: string }[] = [
    { key: "love", label: "Love Letters", icon: "💌", gradient: "from-pink-400 to-rose-400" },
    { key: "openwhen", label: "Open When...", icon: "💭", gradient: "from-purple-400 to-pink-400" },
    { key: "voice", label: "Voice Notes", icon: "🎵", gradient: "from-blue-400 to-cyan-400" },
    { key: "secret", label: "Secret Box", icon: "🤫", gradient: "from-amber-400 to-orange-400" },
  ];

  return (
    <div className={`relative min-h-screen p-3 sm:p-4 md:p-8 transition-all duration-500 ${nightMode ? "bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950" : "bg-gradient-to-br from-pink-100 via-purple-100 to-indigo-100"}`}>
      {nightMode && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {stars.map((star, i) => (
            <div
              key={i}
              className="absolute text-white/20 animate-pulse"
              style={{
                left: `${star.left}%`,
                top: `${star.top}%`,
                animationDelay: `${star.delay}s`,
                animationDuration: `${star.duration}s`,
              }}
            >
              <Star size={star.size} fill="white" />
            </div>
          ))}
        </div>
      )}

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-8 text-center">
          <h1 className={`text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent mb-2 ${nightMode ? "bg-gradient-to-r from-indigo-300 to-purple-300" : "bg-gradient-to-r from-pink-500 to-purple-600"}`}>
            🛏️ Bedroom
          </h1>
          <p className={`text-sm sm:text-base ${nightMode ? "text-indigo-300/70" : "text-purple-600/70"}`}>
            {nightMode ? "Night mode: quiet talks and sweet dreams 🌙" : "Your private intimate space"}
          </p>
          <button
            onClick={() => setNightMode(!nightMode)}
            className={`mt-3 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 mx-auto min-h-[44px] ${nightMode ? "bg-indigo-800 text-indigo-200 hover:bg-indigo-700" : "bg-purple-200 text-purple-700 hover:bg-purple-300"}`}
          >
            {nightMode ? <Sun size={16} /> : <Moon size={16} />}
            {nightMode ? "Day Mode" : "Night Mode"}
          </button>
        </div>

        <LdrBanner tagline="Surat cinta LDR: dikirim lewat WiFi, sampainya ke hati. 💌🌙" />

        <div className="mb-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setShowForm(false);
              }}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer min-h-[44px] active:scale-95 ${
                activeTab === tab.key
                  ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg scale-105`
                  : nightMode ? "bg-indigo-900/50 text-indigo-200 hover:bg-indigo-800/50" : "bg-white/50 text-purple-700 hover:bg-white/80"
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className={`${nightMode ? "bg-indigo-900/30 border-indigo-700/50" : "bg-white/80 backdrop-blur-sm border-pink-200"} rounded-2xl p-4 sm:p-6 border-2 shadow-xl mb-6`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className={`text-lg sm:text-xl font-bold ${nightMode ? "text-indigo-200" : "text-purple-900"}`}>{tabs.find((t) => t.key === activeTab)?.label}</h3>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${nightMode ? "text-indigo-400" : "text-purple-400"}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className={`pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none w-32 md:w-40 min-h-[44px] ${nightMode ? "bg-indigo-900/50 border-2 border-indigo-700 text-indigo-100 placeholder-indigo-400 focus:border-indigo-500" : "bg-pink-50 border-2 border-pink-200 text-purple-900 placeholder-purple-300 focus:border-purple-400"}`}
                />
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-1 cursor-pointer min-h-[44px] ${nightMode ? "bg-indigo-700 text-indigo-100 hover:bg-indigo-600" : "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700"}`}
              >
                {showForm ? "Cancel" : "Tulis Surat Baru 💌"}
              </button>
            </div>
          </div>

          {showForm && (
            <div className={`${nightMode ? "bg-indigo-900/50 border-indigo-700" : "bg-white/80 border-pink-200"} backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-6 border-2 animate-fade-in-up`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-bold ${nightMode ? "text-indigo-200" : "text-purple-900"}`}>
                  New {tabs.find((t) => t.key === activeTab)?.label.slice(0, -1)}
                </h3>
                <button onClick={() => setShowForm(false)} className={`${nightMode ? "text-indigo-400 hover:text-indigo-200" : "text-purple-400 hover:text-purple-600"} cursor-pointer p-2 min-h-[44px] min-w-[44px] flex items-center justify-center`}>
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Title 💝"
                  className={`w-full px-4 py-3 rounded-xl border-2 text-sm min-h-[44px] ${nightMode ? "bg-indigo-900/50 border-indigo-700 text-indigo-100 placeholder-indigo-400 focus:border-indigo-500 focus:outline-none" : "bg-white border-pink-200 text-purple-900 placeholder-purple-300 focus:border-purple-400 focus:outline-none"}`}
                />

                {activeTab === "voice" && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl ${nightMode ? "bg-indigo-900/50 border border-indigo-700" : "bg-blue-50 border border-blue-200"}`}>
                    <span className={`text-xs font-bold ${nightMode ? "text-indigo-300" : "text-blue-700"}`}>Cute Pitch Mode 🐹:</span>
                    <select
                      value={voiceType}
                      onChange={(e) => setVoiceType(e.target.value as "normal" | "cute" | "chipmunk" | "deep")}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs focus:outline-none min-h-[44px] ${nightMode ? "bg-indigo-900 border-indigo-700 text-indigo-100 focus:border-indigo-500" : "bg-white border-blue-200 text-blue-900 focus:border-blue-400"}`}
                    >
                      <option value="cute">Cute 🌸</option>
                      <option value="chipmunk">Chipmunk 🐹</option>
                      <option value="deep">Deep 🐻</option>
                      <option value="normal">Normal 🧑</option>
                    </select>
                  </div>
                )}

                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder={activeTab === "voice" ? "Type the message you want to speak... 🎙️" : "Write your heart out..."}
                  rows={4}
                  className={`w-full px-4 py-3 rounded-xl border-2 resize-none text-sm ${nightMode ? "bg-indigo-900/50 border-indigo-700 text-indigo-100 placeholder-indigo-400 focus:border-indigo-500 focus:outline-none" : "bg-white border-pink-200 text-purple-900 placeholder-purple-300 focus:border-purple-400 focus:outline-none"}`}
                />

                <div className="flex gap-2">
                  <MagneticButton>
                    <button
                      onClick={handleSubmit}
                      disabled={!newTitle.trim() || !newContent.trim()}
                      className={`flex-1 py-3 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-2 min-h-[44px] ${nightMode ? "bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50" : "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 disabled:opacity-50"}`}
                    >
                      <Send size={18} />
                      Send to Partner
                    </button>
                  </MagneticButton>
                  {nightMode && (
                    <button
                      onClick={handleGoodNight}
                      className="px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold hover:from-indigo-500 hover:to-purple-500 transition-all cursor-pointer flex items-center gap-2 min-h-[44px]"
                    >
                      🌙 Good Night
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <ListItemSkeleton key={i} />)}
            </div>
          ) : filteredLetters.length === 0 ? (
            <EmptyState emoji="📬" title="No letters yet" description="Write your first one!" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {filteredLetters.map((letter, idx) => {
                const isVoice = letter.content.startsWith("[VOICE:");
                let text = letter.content;
                let vType = "cute";

                if (isVoice) {
                  const match = letter.content.match(/^\[VOICE:(normal|cute|chipmunk|deep)\]([\s\S]*)/);
                  vType = match ? match[1] : "cute";
                  text = match ? match[2] : letter.content;
                }

                return (
                  <div
                    key={letter.id}
                    className={`${nightMode ? "bg-indigo-900/50 border-indigo-700" : "bg-gradient-to-br from-pink-50/70 to-purple-50/70 border-pink-100"} p-4 sm:p-5 rounded-2xl border-2 hover:shadow-lg transition-all flex flex-col justify-between`}
                    style={{ animationDelay: `${idx * 0.08}s` }}
                  >
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={`font-bold text-base ${nightMode ? "text-indigo-200" : "text-purple-900"}`}>
                          {letter.title}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-md ${nightMode ? "text-indigo-400 bg-indigo-900/50" : "text-purple-400 bg-white/50"}`}>
                          {new Date(letter.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                        </span>
                      </div>

                      {isVoice ? (
                        <div className="my-4 bg-slate-800 rounded-xl p-4 text-white relative overflow-hidden border border-slate-700 shadow-inner">
                          <div className="flex items-center justify-between mb-3 border-b border-slate-700/50 pb-2">
                            <span className="text-2xs uppercase tracking-wider text-pink-400 font-bold flex items-center gap-1">
                              <Mic size={10} /> Cassette Tape Player
                            </span>
                            <span className="text-2xs text-slate-400">Voice: {vType}</span>
                          </div>

                          <div className="flex items-center justify-around py-2 bg-slate-900/60 rounded-lg relative">
                            <div className="flex items-center gap-6">
                              <div className={`w-10 h-10 rounded-full border-4 border-slate-700 flex items-center justify-center relative ${playingId === letter.id ? "animate-spin" : ""}`} style={{ animationDuration: "2.5s" }}>
                                <div className="w-3 h-3 bg-slate-800 rounded-full" />
                                <div className="absolute top-0 w-1 h-3 bg-slate-500 rounded-full" />
                                <div className="absolute bottom-0 w-1 h-3 bg-slate-500 rounded-full" />
                              </div>
                              <div className="w-16 h-4 bg-slate-800 rounded flex justify-center items-center">
                                <div className="w-10 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                  <div className={`h-full bg-pink-400 transition-all ${playingId === letter.id ? "w-full animate-pulse" : "w-1/3"}`} />
                                </div>
                              </div>
                              <div className={`w-10 h-10 rounded-full border-4 border-slate-700 flex items-center justify-center relative ${playingId === letter.id ? "animate-spin" : ""}`} style={{ animationDuration: "2.5s" }}>
                                <div className="w-3 h-3 bg-slate-800 rounded-full" />
                                <div className="absolute top-0 w-1 h-3 bg-slate-500 rounded-full" />
                                <div className="absolute bottom-0 w-1 h-3 bg-slate-500 rounded-full" />
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between">
                            <button
                              onClick={() => handlePlayVoice(letter.id, text, vType)}
                              className="px-4 py-2 rounded-lg bg-pink-500 hover:bg-pink-600 text-xs font-bold text-white transition-all flex items-center gap-1 cursor-pointer min-h-[44px]"
                            >
                              {playingId === letter.id ? (
                                <>
                                  <Square size={10} fill="white" /> Stop
                                </>
                              ) : (
                                <>
                                  <Play size={10} fill="white" /> Play Tape
                                </>
                              )}
                            </button>
                            {playingId === letter.id && (
                              <div className="flex gap-0.5 items-end h-4">
                                <div className="w-1 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                                <div className="w-1 h-4 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "0.3s" }} />
                                <div className="w-1 h-2 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                                <div className="w-1 h-4 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <p className={`text-sm leading-relaxed my-3 font-normal whitespace-pre-wrap ${nightMode ? "text-indigo-200" : "text-purple-700/80"}`}>
                          {text}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-purple-100/50 pt-3">
                      <span className={`inline-block text-2xs px-2.5 py-0.5 rounded-full bg-gradient-to-r from-pink-400/80 to-purple-400/80 text-white font-medium capitalize`}>
                        {isVoice ? "voice note" : letter.type.replace("_", " ")}
                      </span>
                      <span className={`text-3xs ${nightMode ? "text-indigo-400" : "text-purple-400"}`}>
                        From: {letter.createdBy === user?.id ? (user?.name?.split(" ")[0] || "You") : "Partner"}
                      </span>
                    </div>
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
