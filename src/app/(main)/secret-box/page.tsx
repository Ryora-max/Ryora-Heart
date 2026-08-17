"use client";

import { useState, useRef, useEffect } from "react";
import { Unlock, Eye, EyeOff, Heart, Settings, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { LdrBanner } from "@/components/ldr/LdrBanner";
import { useLetters } from "@/hooks/useDatabase";
import { useAuthStore } from "@/stores";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListItemSkeleton } from "@/components/ui/LoadingSkeleton";

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
  const [pinError, setPinError] = useState("");
  const [secretTitleError, setSecretTitleError] = useState("");
  const [secretContentError, setSecretContentError] = useState("");
  const [newPinError, setNewPinError] = useState("");
  const { token } = useAuthStore();
  const { letters, loading, createLetter, refetch } = useLetters(token || "");

  const savedPin = typeof window !== "undefined" ? localStorage.getItem("ryora-secret-pin") || DEFAULT_PIN : DEFAULT_PIN;

  const secretLetters = letters.filter((l) => l.type === "secret");

  const isSelfDestruct = (content: string) => content.startsWith("[SELF_DESTRUCT]");
  const getCleanContent = (content: string) => content.replace("[SELF_DESTRUCT]", "");

  const handleReadSecret = async (id: string, content: string) => {
    const clean = getCleanContent(content);
    const proceed = confirm("Peringatan: Surat ini hanya bisa dibaca SEKALI. Setelah ini, surat akan dihapus selamanya. Tetap lanjutkan?");
    if (!proceed) return;
    alert(clean);
    await handleDeleteSecret(id);
  };

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
    setPinError("");
    if (pin === savedPin) {
      setIsUnlocked(true);
    } else {
      setShake(true);
      setPinError("Incorrect PIN");
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleCreateSecret = async () => {
    setSecretTitleError("");
    setSecretContentError("");
    if (!secretTitle.trim()) {
      setSecretTitleError("Title is required");
      return;
    }
    if (!secretContent.trim()) {
      setSecretContentError("Content is required");
      return;
    }
    if (!token) return;
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
    setNewPinError("");
    if (newPin.length !== 4) {
      setNewPinError("PIN must be 4 digits");
      return;
    }
    if (newPin !== confirmPin) {
      setNewPinError("PINs do not match");
      return;
    }
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
    <div className="page-bg p-3 sm:p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gradient-primary mb-2">
            {disguiseMode ? "📝 My Notes" : "💝 Secret Box"}
          </h1>
          <p className="text-body">{disguiseMode ? "Your personal notes" : "Your private encrypted space"}</p>
          {!isUnlocked && (
            <button
              onClick={toggleDisguiseMode}
              className="mt-3 px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 mx-auto touch-target touch-press"
              style={{ background: "var(--surface-warm)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
            >
              {disguiseMode ? <Eye size={16} /> : <EyeOff size={16} />}
              {disguiseMode ? "Exit Disguise" : "Disguise Mode"}
            </button>
          )}
        </div>

        {!disguiseMode && <LdrBanner tagline="Rahasia LDR: PIN-nya tanggal pertama kita video call. 🤫💞" />}

        {!isUnlocked && !disguiseMode ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div ref={envelopeRef} className={cn("secret-card surface-card rounded-3xl p-8 max-w-sm w-full", shake && "border-red-300")}>
              <div className="text-center">
                <div className="text-6xl mb-4 animate-bounce">💌</div>
                <h3 className="text-2xl font-bold text-heading mb-2">Enter PIN</h3>
                <p className="text-body text-sm mb-6">Enter 4-digit PIN to unlock</p>

                <div className="flex justify-center gap-2 mb-6">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={cn("w-4 h-4 rounded-full transition-all duration-300", pin[i] ? "bg-primary scale-100 shadow-lg" : "bg-primary-soft scale-75")} />
                  ))}
                </div>

                 <div className="relative mb-6">
                   <input
                     type={showPin ? "text" : "password"}
                     maxLength={4}
                     value={pin}
                     onChange={(e) => { setPin(e.target.value.replace(/\D/g, "").slice(0, 4)); setPinError(""); }}
                     className="w-full input-soft rounded-xl px-4 py-3 text-center text-2xl tracking-[1em] focus:outline-none transition-colors touch-target"
                     placeholder="••••"
                   />
                  {pinError && <p className="text-red-500 text-xs mt-2 text-center">{pinError}</p>}
                  <button onClick={() => setShowPin(!showPin)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors p-2 touch-target flex items-center justify-center">
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
                      className={`py-3 rounded-xl text-lg font-bold transition-all touch-target ${key ? "touch-press" : "bg-transparent"}`}
                      style={key ? { background: "var(--surface-warm)", borderColor: "var(--border)", color: "var(--text-secondary)" } : undefined}
                    >
                      {key}
                    </button>
                  ))}
                </div>

                <MagneticButton>
                  <button
                    onClick={handleUnlock}
                    disabled={pin.length === 0}
                    className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 touch-target touch-press"
                    style={{ background: "linear-gradient(to right, var(--primary), var(--secondary))" }}
                  >
                    <Unlock size={18} />
                    Unlock
                  </button>
                </MagneticButton>
              </div>
            </div>
          </div>
        ) : (
          <div className="secret-card surface-card rounded-3xl p-6 sm:p-8">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🔓</div>
              <h3 className="text-2xl font-bold text-green-600">Unlocked!</h3>
              <p className="text-body text-sm mt-2">Your private secrets are safe here</p>
            </div>

            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-heading flex items-center gap-2">
                <Heart size={18} className="text-primary" />
                Secret Letters ({secretLetters.length})
              </h4>
              <div className="flex gap-2">
                <MagneticButton>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="px-3 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-1 cursor-pointer touch-target touch-press"
                    style={{ background: "var(--surface-warm)", borderColor: "var(--border)", color: "var(--text-secondary)" }}
                  >
                    <Settings size={16} /> PIN
                  </button>
                </MagneticButton>
                <MagneticButton>
                  <button
                    onClick={() => setSecretForm(!secretForm)}
                    className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold transition-all touch-target touch-press"
                    style={{ background: "linear-gradient(to right, var(--primary), var(--secondary))" }}
                  >
                    {secretForm ? "Cancel" : "Write Secret 💌"}
                  </button>
                </MagneticButton>
              </div>
            </div>

            {showSettings && (
              <div className="mb-6 p-4 rounded-xl animate-scale-in space-y-3" style={{ background: "var(--surface-warm)", border: "1px solid var(--border)" }}>
                <h4 className="font-bold text-heading">Change PIN</h4>
                <input
                  type="password"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="New 4-digit PIN"
                  className="w-full px-4 py-3 rounded-xl input-soft text-sm touch-target"
                />
                <input
                  type="password"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="Confirm PIN"
                  className="w-full px-4 py-3 rounded-xl input-soft text-sm touch-target"
                />
                {newPinError && <p className="text-red-500 text-xs">{newPinError}</p>}
                <button
                  onClick={handleChangePin}
                  className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50 transition-all touch-target touch-press"
                  style={{ background: "linear-gradient(to right, var(--primary), var(--secondary))" }}
                >
                  Update PIN
                </button>
                {pinMessage && (
                  <p className="text-green-600 text-sm mt-2 text-center animate-fade-in-up">{pinMessage}</p>
                )}
              </div>
            )}

            {secretForm && (
              <div className="mb-6 p-4 rounded-xl animate-scale-in space-y-3" style={{ background: "var(--surface-warm)", border: "1px solid var(--border)" }}>
                <input
                  type="text"
                  value={secretTitle}
                  onChange={(e) => { setSecretTitle(e.target.value); setSecretTitleError(""); }}
                  placeholder="Secret title 🤫"
                  className="w-full px-4 py-3 rounded-xl input-soft text-sm touch-target"
                />
                {secretTitleError && <p className="text-red-500 text-xs">{secretTitleError}</p>}
                 <textarea
                   value={secretContent}
                   onChange={(e) => { setSecretContent(e.target.value); setSecretContentError(""); }}
                   placeholder="Write your secret here..."
                   rows={4}
                   className="w-full px-4 py-3 rounded-xl input-soft text-sm resize-none touch-target"
                 />
                {secretContentError && <p className="text-red-500 text-xs">{secretContentError}</p>}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="selfDestruct"
                    checked={selfDestruct}
                    onChange={(e) => setSelfDestruct(e.target.checked)}
                    className="w-4 h-4 rounded focus:ring-2"
                    style={{ accentColor: "var(--primary)" }}
                  />
                  <label htmlFor="selfDestruct" className="text-sm text-body flex items-center gap-1 cursor-pointer">
                    <Trash2 size={14} /> Self-destruct after reading
                  </label>
                </div>
                <button
                  onClick={handleCreateSecret}
                  disabled={!secretTitle.trim() || !secretContent.trim()}
                  className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50 transition-all touch-target touch-press"
                  style={{ background: "linear-gradient(to right, var(--primary), var(--secondary))" }}
                >
                  Save Secret
                </button>
              </div>
            )}

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <ListItemSkeleton key={i} />)}
              </div>
            ) : secretLetters.length === 0 ? (
              <EmptyState emoji="🤫" title="No secrets yet" description="Write your first one!" />
             ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {secretLetters.map((letter, idx) => (
                  <div
                    key={letter.id}
                    className="secret-item p-4 rounded-xl hover:shadow-lg transition-all"
                    style={{ background: "var(--surface-warm)", border: "1px solid var(--border)", animationDelay: `${idx * 0.08}s` }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h5 className="font-bold text-heading text-sm mb-1 flex items-center gap-1">
                          {isSelfDestruct(letter.content) && <Trash2 size={14} className="text-red-400" />}
                          {letter.title}
                        </h5>
                        {isSelfDestruct(letter.content) ? (
                          <button
                            onClick={() => handleReadSecret(letter.id, letter.content)}
                            className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-xs font-semibold hover:bg-red-200 transition-all"
                          >
                            🔴 Baca Sekali & Hapus
                          </button>
                        ) : (
                          <p className="text-body text-xs leading-relaxed line-clamp-3">
                            {letter.content}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteSecret(letter.id)}
                        className="text-red-400 hover:text-red-600 transition-colors p-1 touch-target flex items-center justify-center"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <p className="text-text-muted text-xs mt-2">
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
