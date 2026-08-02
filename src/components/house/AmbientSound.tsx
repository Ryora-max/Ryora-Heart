"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Volume2, VolumeX } from "lucide-react";

type SoundType = "none" | "rain" | "fireplace" | "lofi";

interface SoundOption {
  id: SoundType;
  label: string;
  emoji: string;
  color: string;
}

const SOUND_OPTIONS: SoundOption[] = [
  { id: "none", label: "Off", emoji: "🔇", color: "bg-gray-100 text-gray-500 border-gray-200" },
  { id: "rain", label: "Hujan", emoji: "🌧️", color: "bg-blue-50 text-blue-600 border-blue-200" },
  { id: "fireplace", label: "Fireplace", emoji: "🔥", color: "bg-orange-50 text-orange-600 border-orange-200" },
  { id: "lofi", label: "Lo-Fi", emoji: "🎵", color: "bg-purple-50 text-purple-600 border-purple-200" },
];

// Web Audio API based ambient sound generator
// No external files needed — generates sounds procedurally
type AudioContextConstructor = typeof AudioContext;
declare global {
  interface Window {
    webkitAudioContext?: AudioContextConstructor;
  }
}

function getAudioContext(): AudioContext {
  const Ctor = window.AudioContext || window.webkitAudioContext;
  if (!Ctor) throw new Error("AudioContext not supported");
  return new Ctor();
}

function useAmbientSound() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ gain: GainNode; sources: AudioNode[] } | null>(null);

  const stop = useCallback(() => {
    if (nodesRef.current) {
      nodesRef.current.sources.forEach((s) => {
        try { s.disconnect(); } catch {}
      });
      nodesRef.current.gain.disconnect();
      nodesRef.current = null;
    }
  }, []);

  const play = useCallback((type: SoundType) => {
    stop();
    if (type === "none") return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = getAudioContext();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();

    const gain = ctx.createGain();
    gain.gain.value = 0.15;
    gain.connect(ctx.destination);
    const sources: AudioNode[] = [];

    if (type === "rain") {
      // White noise filtered for rain sound
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1200;
      const highFilter = ctx.createBiquadFilter();
      highFilter.type = "highpass";
      highFilter.frequency.value = 200;
      noise.connect(highFilter);
      highFilter.connect(filter);
      filter.connect(gain);
      noise.start();
      sources.push(noise, filter, highFilter);
    } else if (type === "fireplace") {
      // Crackling fire — brown noise with pops
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 800;
      noise.connect(filter);
      filter.connect(gain);
      noise.start();
      sources.push(noise, filter);
    } else if (type === "lofi") {
      // Simple lo-fi ambient — soft sine wave chords
      const freqs = [261.63, 329.63, 392.0]; // C, E, G
      freqs.forEach((freq) => {
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;
        const oscGain = ctx.createGain();
        oscGain.gain.value = 0.3;
        // Slow tremolo
        const tremolo = ctx.createOscillator();
        tremolo.frequency.value = 0.3;
        const tremoloGain = ctx.createGain();
        tremoloGain.gain.value = 0.15;
        tremolo.connect(tremoloGain);
        tremoloGain.connect(oscGain.gain);
        osc.connect(oscGain);
        oscGain.connect(gain);
        osc.start();
        tremolo.start();
        sources.push(osc, oscGain, tremolo, tremoloGain);
      });
    }

    nodesRef.current = { gain, sources };
  }, [stop]);

  useEffect(() => {
    return () => {
      stop();
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch {}
      }
    };
  }, [stop]);

  return { play, stop };
}

export function AmbientSoundToggle() {
  const [active, setActive] = useState<SoundType>(() => {
    if (typeof window === "undefined") return "none";
    const saved = localStorage.getItem("ryora-ambient") as SoundType | null;
    return saved && saved !== "none" ? saved : "none";
  });
  const [showPicker, setShowPicker] = useState(false);
  const { play } = useAmbientSound();

  const handleSelect = (type: SoundType) => {
    setActive(type);
    play(type);
    if (typeof window !== "undefined") {
      localStorage.setItem("ryora-ambient", type);
    }
    setShowPicker(false);
  };

  const currentOption = SOUND_OPTIONS.find((s) => s.id === active) || SOUND_OPTIONS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setShowPicker(!showPicker)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 transition-all active:scale-95 cursor-pointer ${currentOption.color} shadow-soft text-xs font-semibold`}
      >
        {active === "none" ? <VolumeX size={14} /> : <Volume2 size={14} className="animate-pulse" />}
        <span>{currentOption.emoji}</span>
        <span className="hidden sm:inline">{currentOption.label}</span>
      </button>

      {showPicker && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
          <div className="absolute top-full mt-1 right-0 z-50 bg-white rounded-2xl shadow-2xl p-2 min-w-[140px] animate-scale-in">
            <p className="text-[10px] font-bold text-text-muted px-2 py-1">Ambient Sound</p>
            {SOUND_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all active:scale-95 cursor-pointer ${active === opt.id ? opt.color + " ring-2 ring-pink-200" : "hover:bg-gray-50"}`}
              >
                <span className="text-base">{opt.emoji}</span>
                <span>{opt.label}</span>
                {active === opt.id && <span className="ml-auto text-[10px]">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
