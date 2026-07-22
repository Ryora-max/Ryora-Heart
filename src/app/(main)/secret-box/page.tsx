"use client";

import { useState, useRef, useEffect } from "react";
import { Unlock, Eye, EyeOff, Heart, Settings, Trash2 } from "lucide-react";
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
  const [showSettings, setShowSettings] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [selfDestruct, setSelfDestruct] = useState(false);
  const [disguiseMode, setDisguiseMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("ryora-disguise-mode") === "true";
  });
  const [pinMessage, setPinMessage] = useState<string | null>(null);
  const { token } = useAuthStore();
  const { letters, loading, createLetter, refetch } = useLetters(token || "");

  const savedPin = typeof window !== "undefined" ? localStorage.getItem("ryora-secret-pin") || DEFAULT_PIN : DEFAULT_PIN;

  const secretLetters = letters.filter((l) => l.type === "secret");

  useEffect(() => {
    const originalTitle = typeof window !== "undefined" ? document.title : "RYORA";
    if (disguiseMode) {
      document.title = "Notes App";
      if (envelopeRef.current) {
        envelopeRef.current.style.display = "none";
      }
    } else {
      document.title = originalTitle;
      if (envelopeRef.current) {
        envelopeRef.current.style.display = "";
      }
    }
  }, [disguiseMode]);

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
      content: selfDestruct ? `[SELF_DESTRUCT]${secretContent.trim()}` : secretContent.trim(),
      type: "secret",
    });
    setSecretTitle("");
    setSecretContent("");
    setSecretForm(false);
    setSelfDestruct(false);
  };

  const handleChangePin = () => {
    if (newPin.length !== 4 || newPin !== confirmPin) return;
    localStorage.setItem("ryora-secret-pin", newPin);
    setNewPin("");
    setConfirmPin("");
    setShowSettings(false);
    setPinMessage("PIN updated successfully!");
    setTimeout(() => setPinMessage(null), 3000);
  };

  const toggleDisguiseMode = () => {
    const newMode = !disguiseMode;
    setDisguiseMode(newMode);
    localStorage.setItem("ryora-disguise-mode", String(newMode));
  };

  const handleDeleteSecret = async (id: string) => {
    if (!confirm("Are you sure you want to delete this secret? This cannot be undone.")) return;
    await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deleteLetter", token, letterId: id }),
    });
    refetch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 via-rose-100 to-pink-100 p-3 sm:p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-500 to-pink-600 bg-clip-text text-transparent mb-2">
            {disguiseMode ? "📝 My Notes" : "💝 Secret Box"}
          </h1>
          <p className="text-pink-600/70">{disguiseMode ? "Your personal notes" : "Your private encrypted space"}</p>
          {!isUnlocked && (
            <button
              onClick={toggleDisguiseMode}
              className="mt-3 px-4 py-2 rounded-full bg-pink-200 text-pink-700 text-sm font-semibold hover:bg-pink-300 transition-all cursor-pointer flex items-center gap-2 mx-auto min-h-[44px]"
            >
              {disguiseMode ? <Eye size={16} /> : <EyeOff size={16} />}
              {disguiseMode ? "Exit Disguise" : "Disguise Mode"}
            </button>
          )}
        </div>

        {!disguiseMode && <LdrBanner tagline="Rahasia LDR: PIN-nya tanggal pertama kita video call. 🤫💞" />}

        {!isUnlocked && !disguiseMode ? (
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
                    className="w-full bg-pink-50 border-2 border-pink-200 rounded-xl px-4 py-3 text-center text-2xl tracking-[1em] text-pink-900 placeholder-pink-300 focus:outline-none focus:border-pink-400 transition-colors min-h-[48px]"
                    placeholder="••••"
                  />
                  <button onClick={() => setShowPin(!showPin)} className="absolute right-4 top-1/2 -translate-y-1/2 text-pink-400 hover:text-pink-600 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center">
                    {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-4 max-w-[200px] mx-auto">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        if (key === "⌫") {
                          setPin(pin.slice(0, -1));
                        } else if (key) {
                          setPin(pin + key);
                        }
                      }}
                      className={`py-3 rounded-xl text-lg font-bold transition-all min-h-[44px] ${key ? "bg-pink-100 hover:bg-pink-200 text-pink-700" : "bg-transparent"}`}
                    >
                      {key}
                    </button>
                  ))}
                </div>

                <MagneticButton>
                  <button
                    onClick={handleUnlock}
                    disabled={pin.length === 0}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 min-h-[48px]"
                  >
                    <Unlock size={18} />
                    Unlock
                  </button>
                </MagneticButton>
              </div>
            </div>
          </div>
        ) : (
          <div className="secret-card bg-white/90 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-green-200">
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
              <div className="flex gap-2">
                <MagneticButton>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-xl text-sm font-semibold transition-all flex items-center gap-1 cursor-pointer min-h-[44px]"
                  >
                    <Settings size={16} /> PIN
                  </button>
                </MagneticButton>
                <MagneticButton>
                  <button
                    onClick={() => setSecretForm(!secretForm)}
                    className="px-4 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl text-sm font-semibold hover:from-pink-600 hover:to-rose-600 transition-all min-h-[44px]"
                  >
                    {secretForm ? "Cancel" : "Write Secret 💌"}
                  </button>
                </MagneticButton>
              </div>
            </div>

            {showSettings && (
              <div className="mb-6 p-4 rounded-xl bg-purple-50 border-2 border-purple-200 animate-scale-in space-y-3">
                <h4 className="font-bold text-purple-900">Change PIN</h4>
                <input
                  type="password"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="New 4-digit PIN"
                  className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-400 focus:outline-none text-purple-900 text-sm min-h-[44px]"
                />
                <input
                  type="password"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="Confirm PIN"
                  className="w-full px-4 py-3 rounded-xl border-2 border-purple-200 focus:border-purple-400 focus:outline-none text-purple-900 text-sm min-h-[44px]"
                />
                <button
                  onClick={handleChangePin}
                  disabled={newPin.length !== 4 || newPin !== confirmPin}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all min-h-[44px]"
                >
                  Update PIN
                </button>
                {pinMessage && (
                  <p className="text-green-600 text-sm mt-2 text-center animate-fade-in-up">{pinMessage}</p>
                )}
              </div>
            )}

            {secretForm && (
              <div className="mb-6 p-4 rounded-xl bg-pink-50 border-2 border-pink-200 animate-scale-in space-y-3">
                <input
                  type="text"
                  value={secretTitle}
                  onChange={(e) => setSecretTitle(e.target.value)}
                  placeholder="Secret title 🤫"
                  className="w-full px-4 py-3 rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-pink-900 text-sm min-h-[44px]"
                />
                <textarea
                  value={secretContent}
                  onChange={(e) => setSecretContent(e.target.value)}
                  placeholder="Write your secret here..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-pink-900 text-sm resize-none"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="selfDestruct"
                    checked={selfDestruct}
                    onChange={(e) => setSelfDestruct(e.target.checked)}
                    className="w-4 h-4 text-pink-600 rounded border-pink-300 focus:ring-pink-500"
                  />
                  <label htmlFor="selfDestruct" className="text-sm text-pink-700 flex items-center gap-1 cursor-pointer">
                    <Trash2 size={14} /> Self-destruct after reading
                  </label>
                </div>
                <button
                  onClick={handleCreateSecret}
                  disabled={!secretTitle.trim() || !secretContent.trim()}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 transition-all min-h-[44px]"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {secretLetters.map((letter, idx) => (
                  <div
                    key={letter.id}
                    className="secret-item bg-gradient-to-br from-pink-50 to-rose-50 p-4 rounded-xl border-2 border-pink-100 hover:border-pink-300 hover:shadow-lg transition-all"
                    style={{ animationDelay: `${idx * 0.08}s` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-bold text-pink-900 text-sm mb-1 flex items-center gap-1">
                          {letter.content.startsWith("[SELF_DESTRUCT]") && <Trash2 size={14} className="text-red-400" />}
                          {letter.title}
                        </h5>
                        <p className="text-pink-700/80 text-xs leading-relaxed line-clamp-3">
                          {letter.content.startsWith("[SELF_DESTRUCT]") ? letter.content.replace("[SELF_DESTRUCT]", "") : letter.content}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteSecret(letter.id)}
                        className="text-red-400 hover:text-red-600 transition-colors p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
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
