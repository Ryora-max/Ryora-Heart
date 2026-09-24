"use client";

import { useState } from "react";
import { Music, Link2, X } from "lucide-react";
import { useAuthStore } from "@/stores";
import { useUserExtra } from "@/hooks";
import { playChimeSound } from "@/lib/soundEffects";

/**
 * Musik Kita — embed Spotify yang dishare berdua.
 * URL disimpan pair-scoped di user_extras ("spotify_url") → sinkron
 * ke kedua partner via realtime. Tanpa OAuth — embed publik Spotify.
 */

function toEmbedUrl(url: string): string | null {
  // Terima: open.spotify.com/{track|playlist|album|episode|show}/ID
  const m = url.match(/open\.spotify\.com\/(track|playlist|album|episode|show)\/([A-Za-z0-9]+)/);
  if (!m) return null;
  return `https://open.spotify.com/embed/${m[1]}/${m[2]}?utm_source=generator&theme=0`;
}

export function MusicPlayer() {
  const { token } = useAuthStore();
  const { value: spotifyUrl, setValue: setSpotifyUrl } = useUserExtra(token || "", "spotify_url");
  const [editing, setEditing] = useState(false);
  const [input, setInput] = useState("");
  const [err, setErr] = useState(false);

  const embedUrl = spotifyUrl ? toEmbedUrl(spotifyUrl) : null;

  const handleSave = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (!toEmbedUrl(trimmed)) {
      setErr(true);
      return;
    }
    setErr(false);
    playChimeSound();
    await setSpotifyUrl(trimmed);
    setInput("");
    setEditing(false);
  };

  const handleClear = async () => {
    await setSpotifyUrl("");
  };

  return (
    <div className="p-4 rounded-2xl bg-white/70 dark:bg-amber-950/60 backdrop-blur-md border border-emerald-200/60 dark:border-emerald-800/60 shadow-md">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-emerald-200/40 dark:border-emerald-800/40">
        <div className="flex items-center gap-2">
          <Music size={16} className="text-emerald-500" />
          <span className="text-xs font-extrabold">Musik Kita 🎧</span>
        </div>
        <div className="flex items-center gap-1.5">
          {embedUrl && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Hapus lagu"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-200 text-[10px] font-bold hover:bg-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
          >
            <Link2 size={11} />
            {embedUrl ? "Ganti" : "Set Lagu"}
          </button>
        </div>
      </div>

      {editing && (
        <div className="mb-3 space-y-2 animate-fade-in-soft">
          <input
            id="spotify-url"
            name="spotifyUrl"
            type="url"
            autoComplete="off"
            value={input}
            onChange={(e) => { setInput(e.target.value); setErr(false); }}
            placeholder="Paste link Spotify (lagu / playlist)..."
            className={`w-full text-xs p-2.5 rounded-xl border bg-transparent focus:outline-none focus:ring-2 ${
              err ? "border-rose-400 focus:ring-rose-400" : "border-emerald-300 dark:border-emerald-700 focus:ring-emerald-400"
            }`}
            aria-label="Link Spotify"
          />
          {err && (
            <p className="text-[10px] text-rose-500 font-semibold">
              Link tidak valid — pakai format open.spotify.com/track/... atau /playlist/...
            </p>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!input.trim()}
            className="w-full py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 disabled:opacity-50 text-white text-xs font-bold shadow-md cursor-pointer"
          >
            Pasang Musik 🎵
          </button>
        </div>
      )}

      {embedUrl ? (
        <iframe
          src={embedUrl}
          title="Spotify — Musik Kita"
          className="w-full rounded-xl"
          height="152"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        />
      ) : (
        !editing && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center py-3">
            Belum ada lagu — set link Spotify untuk dengarkan bareng 🎶
          </p>
        )
      )}
    </div>
  );
}
