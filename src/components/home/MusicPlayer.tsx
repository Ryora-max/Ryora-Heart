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
    <div className="surface-card p-4">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Music size={16} className="text-accent" />
          <span className="text-xs font-extrabold text-heading">Musik Kita 🎧</span>
        </div>
        <div className="flex items-center gap-1.5">
          {embedUrl && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Hapus lagu"
              className="p-1.5 rounded-lg text-muted hover:text-red-500 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="px-2.5 py-1 rounded-lg bg-accent-soft text-accent text-[10px] font-bold hover:opacity-80 transition-opacity cursor-pointer flex items-center gap-1"
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
            className={`input-soft w-full text-xs p-2.5 ${
              err ? "!border-red-400" : ""
            }`}
            aria-label="Link Spotify"
          />
          {err && (
            <p className="text-[10px] text-red-500 font-semibold">
              Link tidak valid — pakai format open.spotify.com/track/... atau /playlist/...
            </p>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!input.trim()}
            className="btn-gradient w-full py-2 text-xs disabled:opacity-50 cursor-pointer"
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
          <p className="text-[11px] text-body text-center py-3">
            Belum ada lagu — set link Spotify untuk dengarkan bareng 🎶
          </p>
        )
      )}
    </div>
  );
}
