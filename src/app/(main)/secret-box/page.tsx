"use client";

import { useState, useRef } from "react";
import { Unlock, Eye, EyeOff, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { LdrBanner } from "@/components/ldr/LdrBanner";
import { useLetters } from "@/hooks/useDatabase";
import { useAuthStore } from "@/stores";

const DEFAULT_PIN = "0101";

export default function SecretBoxPage() {
  const envelopeRef = useRef<HTMLDivElement>(null);
  const [pin, setPin] = useState(() => {
    if (typeof window === "undefined") return "";
    const stored = localStorage.getItem("ryora-secret-pin");
    return stored ? stored.slice(0, 4) : "";
  });
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [shake, setShake] = useState(false);
  const [secretForm, setSecretForm] = useState(false);
  const [secretTitle, setSecretTitle] = useState("");
  const [secretContent, setSecretContent] = useState("");
  const { token } = useAuthStore();
  const { letters, loading, createLetter } = useLetters(token || "");

  const savedPin = typeof window !== "undefined" ? localStorage.getItem("ryora-secret-pin") || DEFAULT_PIN : DEFAULT_PIN;

  const secretLetters = letters.filter((l) => l.type === "secret");

  const handleUnlock = () => {
    if (pin === savedPin) {
      setIsUnlocked(true);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleCreateSecret = async () => {
    if (!secretTitle.trim() || !secretContent.trim() || !token) return;
    await createLetter({
      title: secretTitle.trim(),
      content: secretContent.trim(),
      type: "secret",
    });
    setSecretTitle("");
    setSecretContent("");
    setSecretForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 via-rose-100 to-pink-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-500 to-pink-600 bg-clip-text text-transparent mb-2">
            💝 Secret Box
          </h1>
          <p className="text-pink-600/70">Your private encrypted space</p>
        </div>

        <LdrBanner tagline="Rahasia LDR: PIN-nya tanggal pertama kita video call. 🤫💞" />

        {!isUnlocked ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div ref={envelopeRef} className={cn("secret-card bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border-2 border-pink-200 max-w-sm w-full", shake && "border-red-300")}>
              <div className="text-center">
                <div className="text-6xl mb-4 animate-bounce">💌</div>
                <h3 className="text-2xl font-bold text-pink-900 mb-2">Enter PIN</h3>
                <p className="text-pink-600/70 text-sm mb-6">Enter 4-digit PIN to unlock</p>

                <div className="flex justify-center gap-2 mb-6">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={cn("w-4 h-4 rounded-full transition-all duration-300", pin[i] ? "bg-pink-500 scale-100 shadow-lg" : "bg-pink-200 scale-75")} />
                  ))}
                </div>

                <div className="relative mb-6">
                  <input
                    type={showPin ? "text" : "password"}
                    maxLength={4}
                    value={pin}
                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    className="w-full bg-pink-50 border-2 border-pink-200 rounded-xl px-4 py-3 text-center text-2xl tracking-[1em] text-pink-900 placeholder-pink-300 focus:outline-none focus:border-pink-400 transition-colors"
                    placeholder="••••"
                  />
                  <button onClick={() => setShowPin(!showPin)} className="absolute right-4 top-1/2 -translate-y-1/2 text-pink-400 hover:text-pink-600 transition-colors">
                    {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <MagneticButton>
                  <button
                    onClick={handleUnlock}
                    disabled={pin.length === 0}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  >
                    <Unlock size={18} />
                    Unlock
                  </button>
                </MagneticButton>
              </div>
            </div>
          </div>
        ) : (
          <div className="secret-card bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border-2 border-green-200">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🔓</div>
              <h3 className="text-2xl font-bold text-green-600">Unlocked!</h3>
              <p className="text-pink-600/70 text-sm mt-2">Your private secrets are safe here</p>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-pink-900 flex items-center gap-2">
                <Heart size={18} className="text-pink-500" />
                Secret Letters ({secretLetters.length})
              </h4>
              <MagneticButton>
                <button
                  onClick={() => setSecretForm(!secretForm)}
                  className="px-4 py-1.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-sm font-semibold hover:from-pink-600 hover:to-rose-600 transition-all"
                >
                  {secretForm ? "Cancel" : "Write Secret 💌"}
                </button>
              </MagneticButton>
            </div>

            {secretForm && (
              <div className="mb-6 p-4 rounded-xl bg-pink-50 border-2 border-pink-200 animate-scale-in space-y-3">
                <input
                  type="text"
                  value={secretTitle}
                  onChange={(e) => setSecretTitle(e.target.value)}
                  placeholder="Secret title 🤫"
                  className="w-full px-4 py-2 rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-pink-900 text-sm"
                />
                <textarea
                  value={secretContent}
                  onChange={(e) => setSecretContent(e.target.value)}
                  placeholder="Write your secret here..."
                  rows={4}
                  className="w-full px-4 py-2 rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-pink-900 text-sm resize-none"
                />
                <button
                  onClick={handleCreateSecret}
                  disabled={!secretTitle.trim() || !secretContent.trim()}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 transition-all"
                >
                  Save Secret
                </button>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : secretLetters.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-2">🤫</p>
                <p className="text-pink-600/70">No secrets yet. Write your first one!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {secretLetters.map((letter, idx) => (
                  <div
                    key={letter.id}
                    className="secret-item bg-gradient-to-br from-pink-50 to-rose-50 p-4 rounded-xl border-2 border-pink-100 hover:border-pink-300 hover:shadow-lg transition-all"
                    style={{ animationDelay: `${idx * 0.08}s` }}
                  >
                    <h5 className="font-bold text-pink-900 text-sm mb-1">{letter.title}</h5>
                    <p className="text-pink-700/80 text-xs leading-relaxed line-clamp-3">{letter.content}</p>
                    <p className="text-pink-400 text-xs mt-2">
                      From: {letter.createdBy === "user-1" ? "Ryo" : "Ara"} • {new Date(letter.createdAt).toLocaleDateString("id-ID")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
