"use client";

import { useState, useEffect, useMemo } from "react";
import { Heart, Plus, Trash2, Sparkles, Mail, MailOpen, Lock } from "lucide-react";
import { playHeartPopSound, playChimeSound } from "@/lib/soundEffects";
import { useAuthStore } from "@/stores";
import { useLetters } from "@/hooks";
import { APP_CONFIG } from "@/config";
import { cn } from "@/lib/utils";
import type { Letter } from "@/types";

const NOTE_COLORS = ["pink", "yellow", "mint", "lavender"] as const;
const NOTE_MAGNETS = ["heart", "star", "cat", "strawberry"] as const;
type NoteColor = (typeof NOTE_COLORS)[number];
type NoteMagnet = (typeof NOTE_MAGNETS)[number];
type Tab = "memo" | "surat";

interface LoveNote {
  id: string;
  sender: string;
  text: string;
  color: NoteColor;
  magnet: NoteMagnet;
  timestamp: string;
}

const DEFAULT_NOTES: LoveNote[] = [
  {
    id: "note-1",
    sender: APP_CONFIG.users.owner.username,
    text: "Semangat buat hari ini ya kesayanganku! Jangan lupa minum air putih & makan tepat waktu ❤️",
    color: "pink",
    magnet: "heart",
    timestamp: "Hari ini",
  },
  {
    id: "note-2",
    sender: APP_CONFIG.users.partner.username,
    text: "Makasih selalu ada buat kamu. Walaupun jauh, hatiku selalu ada di dekatmu 💕",
    color: "yellow",
    magnet: "star",
    timestamp: "Hari ini",
  },
];

const MAGNET_ICONS: Record<NoteMagnet, string> = {
  heart: "💖",
  star: "⭐",
  cat: "🐱",
  strawberry: "🍓",
};

const COLOR_CLASSES: Record<NoteColor, string> = {
  pink: "bg-pink-100/95 text-pink-950 border-pink-200 shadow-pink-200/50",
  yellow: "bg-amber-100/95 text-amber-950 border-amber-200 shadow-amber-200/50",
  mint: "bg-emerald-100/95 text-emerald-950 border-emerald-200 shadow-emerald-200/50",
  lavender: "bg-purple-100/95 text-purple-950 border-purple-200 shadow-purple-200/50",
};

/** Parse JSON meta di letter.title — validasi color/magnet ke union type. */
function parseNoteMeta(title: string): { color: NoteColor; magnet: NoteMagnet; sender: string } {
  try {
    const parsed = JSON.parse(title) as { color?: string; magnet?: string; sender?: string };
    return {
      color: (NOTE_COLORS as readonly string[]).includes(parsed.color || "")
        ? (parsed.color as NoteColor)
        : "pink",
      magnet: (NOTE_MAGNETS as readonly string[]).includes(parsed.magnet || "")
        ? (parsed.magnet as NoteMagnet)
        : "heart",
      sender: parsed.sender || "Pasangan",
    };
  } catch {
    return { color: "pink", magnet: "heart", sender: title || "Pasangan" };
  }
}

function senderName(createdBy: string, myName: string, partnerName: string): string {
  if (createdBy === "user-1") return APP_CONFIG.users.owner.username;
  if (createdBy === "user-2") return APP_CONFIG.users.partner.username;
  return createdBy === myName ? myName : partnerName;
}

interface LoveNotesFridgeProps {
  currentUserName: string;
  partnerName?: string;
  onSendHeart: () => void;
  /** Dipanggil saat memo/surat berhasil dibuat — untuk Love Points. */
  onEarnPoints?: (n: number) => void;
}

export function LoveNotesFridge({ currentUserName, partnerName, onSendHeart, onEarnPoints }: LoveNotesFridgeProps) {
  const { token } = useAuthStore();
  const { letters, createLetter, deleteLetter } = useLetters(token || "");

  const [tab, setTab] = useState<Tab>("memo");
  const [localNotes, setLocalNotes] = useState<LoveNote[]>(DEFAULT_NOTES);
  const [isAdding, setIsAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [newColor, setNewColor] = useState<NoteColor>("pink");
  const [newMagnet, setNewMagnet] = useState<NoteMagnet>("heart");

  // Surat form state
  const [letterTitle, setLetterTitle] = useState("");
  const [letterText, setLetterText] = useState("");
  const [openWhen, setOpenWhen] = useState("");
  const [openedLetter, setOpenedLetter] = useState<string | null>(null);

  // "now" dari state (bukan Date.now() di render — melanggar purity).
  // Di-refresh tiap 30 detik supaya label "Xm lalu" tetap akurat.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const t0 = setTimeout(tick, 0);
    const interval = setInterval(tick, 30000);
    return () => {
      clearTimeout(t0);
      clearInterval(interval);
    };
  }, []);

  const formatTime = (createdAt: Date) => {
    if (now === null) {
      return new Date(createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
    }
    const diffMin = Math.floor((now - new Date(createdAt).getTime()) / 60000);
    return diffMin < 1
      ? "Baru saja"
      : diffMin < 60
      ? `${diffMin}m lalu`
      : new Date(createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  // Memo tab — fridge_note type
  const notes = useMemo(() => {
    const dbFridgeNotes = letters.filter((l) => l.type === "fridge_note");

    const dbNotes: LoveNote[] = dbFridgeNotes.map((l) => {
      const meta = parseNoteMeta(l.title);
      return {
        id: l.id,
        sender: meta.sender || currentUserName,
        text: l.content,
        color: meta.color,
        magnet: meta.magnet,
        timestamp: formatTime(l.createdAt),
      };
    });

    // Optimistic notes yang belum ter-reconcile di DB (match by text+sender)
    const pending = localNotes.filter(
      (n) => !dbNotes.some((d) => d.text === n.text && d.sender === n.sender)
    );

    if (dbNotes.length === 0) {
      return [...pending, ...DEFAULT_NOTES];
    }
    return [...pending, ...dbNotes];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letters, localNotes, currentUserName, now]);

  // Surat tab — semua type selain fridge_note
  const loveLetters = useMemo(
    () =>
      letters
        .filter((l) => l.type !== "fridge_note")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [letters]
  );

  const isLetterLocked = (l: Letter) =>
    l.type === "open_when" && l.openDate && now !== null && new Date(l.openDate).getTime() > now;

  const handleAddNote = async () => {
    if (!newText.trim()) return;

    const trimmed = newText.trim();
    const metaStr = JSON.stringify({
      color: newColor,
      magnet: newMagnet,
      sender: currentUserName,
    });

    const optimisticEntry: LoveNote = {
      id: "note-" + Date.now(),
      sender: currentUserName,
      text: trimmed,
      color: newColor,
      magnet: newMagnet,
      timestamp: "Baru saja",
    };

    setLocalNotes((prev) => [optimisticEntry, ...prev]);
    setNewText("");
    setIsAdding(false);
    playChimeSound();
    onSendHeart();
    onEarnPoints?.(2);

    try {
      await createLetter({
        title: metaStr,
        content: trimmed,
        type: "fridge_note",
      });
    } catch {
      // Graceful fallback
    }
  };

  const handleAddLetter = async () => {
    if (!letterTitle.trim() || !letterText.trim()) return;
    try {
      await createLetter({
        title: letterTitle.trim(),
        content: letterText.trim(),
        type: openWhen ? "open_when" : "love_letter",
        openDate: openWhen || undefined,
      });
      setLetterTitle("");
      setLetterText("");
      setOpenWhen("");
      setIsAdding(false);
      playChimeSound();
      onSendHeart();
      onEarnPoints?.(2);
    } catch {
      // Graceful fallback
    }
  };

  const handleDelete = async (id: string) => {
    setLocalNotes((prev) => prev.filter((n) => n.id !== id));
    playHeartPopSound();
    try {
      await deleteLetter(id);
    } catch {
      // Graceful
    }
  };

  return (
    <div className="relative rounded-3xl p-4 sm:p-6 bg-gradient-to-b from-slate-100 via-slate-50 to-slate-200 dark:from-slate-800 dark:to-slate-900 border-2 border-slate-300 dark:border-slate-700 shadow-xl overflow-hidden">
      {/* Header + Tabs */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-300/80 dark:border-slate-700">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl">💌</span>
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span className="truncate">Pesan Cinta {currentUserName}{partnerName ? ` & ${partnerName}` : ""}</span>
              <Sparkles size={14} className="text-amber-500 fill-amber-500 flex-shrink-0" />
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Memo kulkas &amp; surat cinta dalam satu tempat
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="touch-press px-3 py-1.5 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-md flex items-center gap-1 cursor-pointer transition-transform flex-shrink-0"
        >
          <Plus size={14} />
          <span>{isAdding ? "Batal" : tab === "memo" ? "Tulis Memo" : "Tulis Surat"}</span>
        </button>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-4" role="tablist" aria-label="Jenis pesan">
        {(
          [
            { key: "memo", label: "📝 Memo Kulkas", count: notes.length },
            { key: "surat", label: "💌 Surat Cinta", count: loveLetters.length },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => { setTab(t.key); setIsAdding(false); }}
            className={cn(
              "touch-press px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border",
              tab === t.key
                ? "bg-rose-500 text-white border-rose-400 shadow-md"
                : "bg-white/60 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600"
            )}
          >
            {t.label}
            <span className="ml-1 opacity-70">({t.count})</span>
          </button>
        ))}
      </div>

      {/* Add forms */}
      {isAdding && tab === "memo" && (
        <div className="mb-4 p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-md animate-fade-in-soft space-y-3">
          <textarea
            id="fridge-note-text"
            name="note"
            autoComplete="off"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            placeholder="Tulis pesan manismu untuk pasangan di sini..."
            rows={2}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-rose-400"
            aria-label="Tulis pesan untuk pasangan"
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Warna:</span>
              {NOTE_COLORS.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setNewColor(col)}
                  aria-label={`Warna ${col}`}
                  aria-pressed={newColor === col}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    newColor === col ? "scale-125 border-rose-500 ring-2 ring-rose-300" : "border-transparent"
                  } ${
                    col === "pink"
                      ? "bg-pink-300"
                      : col === "yellow"
                      ? "bg-amber-300"
                      : col === "mint"
                      ? "bg-emerald-300"
                      : "bg-purple-300"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Magnet:</span>
              {NOTE_MAGNETS.map((mag) => (
                <button
                  key={mag}
                  type="button"
                  onClick={() => setNewMagnet(mag)}
                  aria-label={`Magnet ${mag}`}
                  aria-pressed={newMagnet === mag}
                  className={`p-1 rounded-lg text-sm transition-transform ${
                    newMagnet === mag ? "scale-125 bg-rose-100 dark:bg-rose-900" : "opacity-60"
                  }`}
                >
                  {MAGNET_ICONS[mag]}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddNote}
              disabled={!newText.trim()}
              className="touch-press px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 disabled:opacity-50 text-white text-xs font-bold shadow-md cursor-pointer ml-auto"
            >
              Tempel ke Kulkas 📌
            </button>
          </div>
        </div>
      )}

      {isAdding && tab === "surat" && (
        <div className="mb-4 p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-md animate-fade-in-soft space-y-3">
          <input
            id="letter-title"
            name="letterTitle"
            type="text"
            autoComplete="off"
            value={letterTitle}
            onChange={(e) => setLetterTitle(e.target.value)}
            placeholder="Judul surat — mis. 'Untuk kamu yang lagi sedih'"
            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-rose-400"
            aria-label="Judul surat"
          />
          <textarea
            id="letter-content"
            name="letterContent"
            autoComplete="off"
            value={letterText}
            onChange={(e) => setLetterText(e.target.value)}
            placeholder="Tulis isi surat cintamu..."
            rows={4}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-transparent focus:outline-none focus:ring-2 focus:ring-rose-400"
            aria-label="Isi surat"
          />
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="letter-open-when" className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
              <Lock size={11} /> Buka saat (opsional):
            </label>
            <input
              id="letter-open-when"
              name="openWhen"
              type="date"
              value={openWhen}
              onChange={(e) => setOpenWhen(e.target.value)}
              className="text-xs p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-transparent"
            />
            <button
              type="button"
              onClick={handleAddLetter}
              disabled={!letterTitle.trim() || !letterText.trim()}
              className="touch-press px-4 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 disabled:opacity-50 text-white text-xs font-bold shadow-md cursor-pointer ml-auto"
            >
              Kirim Surat 💌
            </button>
          </div>
        </div>
      )}

      {/* Memo tab — sticky notes grid */}
      {tab === "memo" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`relative p-4 rounded-2xl border shadow-md transform transition-all hover:scale-[1.02] ${
                COLOR_CLASSES[note.color]
              }`}
            >
              {/* Cute 3D Magnet on Top Center */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl filter drop-shadow">
                {MAGNET_ICONS[note.magnet]}
              </div>

              <div className="flex items-center justify-between text-[10px] font-bold opacity-75 mb-1 pt-1">
                <span>Dari: {note.sender}</span>
                <span>{note.timestamp}</span>
              </div>

              <p className="text-xs font-medium leading-relaxed my-1.5 whitespace-pre-wrap">
                {note.text}
              </p>

              <div className="flex items-center justify-between pt-1 border-t border-black/5 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    playHeartPopSound();
                    onSendHeart();
                  }}
                  title="Sukai Memo"
                  className="text-[11px] font-bold text-rose-600 flex items-center gap-1 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                >
                  <Heart size={12} className="fill-rose-500" />
                  <span>Love</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(note.id)}
                  title="Lepas Memo"
                  aria-label="Lepas memo"
                  className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors cursor-pointer"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Surat tab — envelope cards */}
      {tab === "surat" && (
        <div className="space-y-2.5">
          {loveLetters.length === 0 && (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-xs">Belum ada surat cinta — tulis yang pertama!</p>
            </div>
          )}
          {loveLetters.map((letter) => {
            const locked = isLetterLocked(letter);
            const opened = openedLetter === letter.id;
            return (
              <div
                key={letter.id}
                className="p-4 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-rose-200/70 dark:border-rose-900/40 shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {locked ? (
                      <Lock size={16} className="text-amber-500 flex-shrink-0" />
                    ) : opened ? (
                      <MailOpen size={16} className="text-rose-500 flex-shrink-0" />
                    ) : (
                      <Mail size={16} className="text-rose-400 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                        {letter.title}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        Dari {senderName(letter.createdBy, currentUserName, partnerName || "Pasangan")} ·{" "}
                        {formatTime(letter.createdAt)}
                        {letter.type === "open_when" && letter.openDate && (
                          <span className="ml-1 text-amber-600 dark:text-amber-400">
                            · 🔒 buka {new Date(letter.openDate).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(letter.id)}
                    title="Hapus surat"
                    aria-label="Hapus surat"
                    className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors cursor-pointer flex-shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                {locked ? (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 italic mt-2">
                    Surat ini masih tersegel — sabar ya 💝
                  </p>
                ) : opened ? (
                  <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed mt-2 whitespace-pre-wrap animate-fade-in-soft">
                    {letter.content}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => { setOpenedLetter(letter.id); playHeartPopSound(); }}
                    className="mt-2 text-[11px] font-bold text-rose-500 hover:text-rose-600 cursor-pointer"
                  >
                    Buka surat →
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
