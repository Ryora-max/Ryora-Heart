"use client";

import { useEffect, useRef, useState } from "react";
import { Plane, Heart, MapPin, Clock, MessageCircle, Video, Gift, Star, Sparkles, Send, HeartHandshake } from "lucide-react";
import { APP_CONFIG } from "@/config";

const DEFAULT_SETTINGS = {
  relationshipStartDate: APP_CONFIG.relationship.startDate,
  distance: "1382",
  nextMeetupDate: "",
};

const ANIMALS = [
  "🐧 Penguin yang nunggu es batu meleleh",
  "🦥 Sloth yang ngegas buat video call",
  "🐙 Gurita yang 4 tangan pegang HP",
  "🦊 Rubah yang nyaru jadi notif WhatsApp",
  "🐢 Kura-kura ngebut buat beli kuota",
];

const LDR_QUOTES = [
  { text: "Kita beda kota, tapi overthinking-nya selalu ketemu di satu grup.", emoji: "🤪" },
  { text: "Pacaran jarak jauh: level pro di sabar, level pemula di peluk.", emoji: "🫂" },
  { text: "Selisih jam doang bedanya. Biar makin berasa kaya punya pasangan di luar negeri.", emoji: "🌏" },
  { text: "Kalo capek, inget aja: susah sinyal, gampang jatuh cinta.", emoji: "📶" },
  { text: "Our love story is loading... 87% (terhambat kuota)", emoji: "⏳" },
  { text: "Bedanya cuma geografis, sisanya sama: sama-sama ngefans sama kamu.", emoji: "💕" },
  { text: "Rindu itu bukti kalau hati tetep di alamat yang sama. 📮", emoji: "✉️" },
  { text: "LDR: Love Distance Relationship, tapi Distance-nya kalah sama cinta.", emoji: "💞" },
];

const LDR_THINGS = [
  { icon: Video, title: "Video Call 'Kita Makan Bareng'", desc: "Makan nasi padang sendiri-sendiri tapi pura-pura di meja yang sama.", emoji: "🍽️" },
  { icon: MessageCircle, title: "Good Morning & Good Night Wajib", desc: "Salah satu lupa = drama satu episode.", emoji: "🌞" },
  { icon: Gift, title: "Kirim Paket Misterius", desc: "Isinya mie instan + surat tangan tangan + bau parfum biar keinget.", emoji: "📦" },
  { icon: Plane, title: "Nabung Buat Tiket", desc: "Lebih semangat nabung dari buat beli baju.", emoji: "✈️" },
  { icon: Star, title: "Lihat Bulan Bareng", desc: "Kita nggak satu atap, tapi lihat bulan yang sama. Romantis receh.", emoji: "🌕" },
  { icon: Heart, title: "Saling Kirim SS Receh", desc: "Dari meme kucing sampai screenshoot bensin naik, semua dilaporkan.", emoji: "📸" },
];

const SILLY_QUESTIONS = [
  "Menurut kamu, aku lebih mirip filter Tiktok yang mana?",
  "Kalau jadi makanan, aku mau jadi apa di piring kamu?",
  "Lebih suka video call sambil tiduran atau sambil ngunyah?",
  "Kalau aku jadi notif, pesan apa yang pengen aku kasih tiap jam 3 pagi?",
  "Kita LDR, tapi emangnya kamu lebih sering kangen atau lebih sering lupa charge HP?",
  "Kalau hujan di kotaku, apa yang kamu lakuin di kotamu?",
];

const HUGS = [
  "🤗 Peluk virtual terkirim! Ara otomatis melek.",
  "🫂 Peluk panjang 12 detik. Sains bilang ini kurangin stres (dan rindu).",
  "💞 Peluk dikirim lewat WiFi. Sampai tanpa kuota.",
  "🌸 Peluk hangat buat Ryo yang lagi nunggu tiket.",
];

const LETTER_TEMPLATES = [
  "Hai sayang, hari ini aku kangen {n} kali. Nanti kalau ketemu, aku traktir {makan}. 💗",
  "To: Ara. Rindu mode ON. Target: peluk {n} detik pas ketemu. Persiapan: {makan} dulu. 💌",
  "Dear kamu yang di sana, jarak cuma {n} centimeter di hati. Mau {makan} bareng nanti ya. 🥺",
];

interface FloatingHeart {
  id: number;
  left: number;
  emoji: string;
}

export default function LdrPage() {
  const [animal, setAnimal] = useState(ANIMALS[0]);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [nextMeet, setNextMeet] = useState<{ days: number; hours: number }>({ days: 0, hours: 0 });
  const [loveMeter, setLoveMeter] = useState(87);
  const [hugMsg, setHugMsg] = useState<string | null>(null);
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [settings] = useState(() => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
      const stored = localStorage.getItem("ryora-settings");
      if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch {}
    return DEFAULT_SETTINGS;
  });
  const hugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [letter, setLetter] = useState("");

  useEffect(() => {
    const targetDate: Date = settings.nextMeetupDate ? new Date(settings.nextMeetupDate) : (() => {
      const d = new Date();
      d.setDate(d.getDate() + 12);
      d.setHours(18, 0, 0, 0);
      return d;
    })();

    const tick = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        setNextMeet({ days, hours });
      }
    };
    tick();
    const id = setInterval(tick, 1000 * 60);
    return () => clearInterval(id);
  }, [settings.nextMeetupDate]);

  const distanceKm = parseInt(settings.distance || "1382", 10) || 1382;

  const spawnHearts = (count: number) => {
    for (let i = 0; i < count; i++) {
      const emoji = ["💗", "💕", "🩷", "💞", "🌸", "✨"][Math.floor(Math.random() * 6)];
      const h: FloatingHeart = { id: Date.now() + i + Math.random(), left: Math.random() * 90, emoji };
      setHearts((prev) => [...prev, h]);
      setTimeout(() => setHearts((prev) => prev.filter((x) => x.id !== h.id)), 2500);
    }
  };

  const sendHug = () => {
    setHugMsg(HUGS[Math.floor(Math.random() * HUGS.length)]);
    spawnHearts(14);
    if (hugTimer.current) clearTimeout(hugTimer.current);
    hugTimer.current = setTimeout(() => setHugMsg(null), 4000);
  };

  const generateLetter = () => {
    const tpl = LETTER_TEMPLATES[Math.floor(Math.random() * LETTER_TEMPLATES.length)];
    const n = Math.floor(Math.random() * 40) + 5;
    const makan = ["bakso", "sate", "mie ayam", "es campur", "nasi goreng"][Math.floor(Math.random() * 5)];
    setLetter(tpl.replace("{n}", String(n)).replace("{makan}", makan));
    spawnHearts(6);
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-rose-100 via-pink-100 to-fuchsia-100 p-4 md:p-8 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        {hearts.map((h) => (
          <span key={h.id} className="absolute bottom-10 text-3xl animate-float-up" style={{ left: `${h.left}%` }}>
            {h.emoji}
          </span>
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="ldr-header animate-fade-in-up text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-pink-500 to-fuchsia-600 bg-clip-text text-transparent mb-2">
            💞 LDR Zone
          </h1>
          <p className="text-pink-600/70 text-lg">Pacaran jarak jauh: lucu, absurd, tapi kita bertahan. 🫶</p>
        </div>

        <div className="animate-fade-in-up grid grid-cols-1 md:grid-cols-3 gap-4 mb-10" style={{ animationDelay: "0.1s" }}>
          <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border-2 border-pink-200 shadow-lg text-center">
            <MapPin className="text-pink-400 mx-auto mb-2" size={28} />
            <p className="text-pink-500 text-sm">Jarak Kita</p>
            <p className="text-2xl font-bold text-pink-700">~{distanceKm.toLocaleString()} km</p>
            <p className="text-pink-400/70 text-xs mt-1">atau {distanceKm.toLocaleString()} tangis rindu</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border-2 border-fuchsia-200 shadow-lg text-center">
            <Clock className="text-fuchsia-400 mx-auto mb-2" size={28} />
            <p className="text-fuchsia-500 text-sm">Menuju Ketemu</p>
            <p className="text-2xl font-bold text-fuchsia-700">{nextMeet.days}h {nextMeet.hours}j</p>
            <p className="text-fuchsia-400/70 text-xs mt-1">hitung mundur peluk virtual</p>
          </div>
          <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border-2 border-rose-200 shadow-lg text-center">
            <Plane className="text-rose-400 mx-auto mb-2" size={28} />
            <p className="text-rose-500 text-sm">Status</p>
            <p className="text-2xl font-bold text-rose-700">Loading 💗</p>
            <p className="text-rose-400/70 text-xs mt-1">87% — mandek di kuota</p>
          </div>
        </div>

        <div className="animate-fade-in-up bg-white/80 backdrop-blur-sm p-6 rounded-3xl border-2 border-pink-200 shadow-xl mb-10" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-pink-700 flex items-center gap-2">
              <Sparkles size={20} /> Mood Binatang LDR Kita
            </h2>
            <button
              onClick={() => setAnimal(ANIMALS[Math.floor(Math.random() * ANIMALS.length)])}
              className="px-4 py-2 rounded-full bg-pink-500 text-white text-sm font-semibold hover:bg-pink-600 transition-all shadow-md cursor-pointer"
            >
              Acak 🎲
            </button>
          </div>
          <p className="text-2xl text-center py-6 text-pink-600 font-medium">{animal}</p>
        </div>

        <div className="animate-fade-in-up mb-10" style={{ animationDelay: "0.3s" }}>
          <h2 className="text-2xl font-bold text-center text-fuchsia-700 mb-6">💌 Quote Receh LDR</h2>
          <div className="bg-gradient-to-r from-pink-400 to-fuchsia-500 p-8 rounded-3xl shadow-xl text-center">
            <p className="text-4xl mb-4">{LDR_QUOTES[quoteIdx].emoji}</p>
            <p className="text-white text-xl md:text-2xl font-medium leading-relaxed">{LDR_QUOTES[quoteIdx].text}</p>
            <button
              onClick={() => setQuoteIdx((i) => (i + 1) % LDR_QUOTES.length)}
              className="mt-6 px-6 py-2 rounded-full bg-white/90 text-fuchsia-600 font-semibold hover:bg-white transition-all shadow-md cursor-pointer"
            >
              Quote Lain ➡️
            </button>
          </div>
        </div>

        <div className="animate-fade-in-up mb-10" style={{ animationDelay: "0.35s" }}>
          <h2 className="text-2xl font-bold text-center text-pink-700 mb-6">💗 Love Meter Hari Ini</h2>
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border-2 border-pink-200 shadow-xl text-center">
            <p className="text-5xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent mb-2">{loveMeter}%</p>
            <div className="w-full h-4 bg-pink-100 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-gradient-to-r from-pink-400 to-rose-500 rounded-full transition-all duration-700" style={{ width: `${loveMeter}%` }} />
            </div>
            <div className="flex gap-2 justify-center flex-wrap">
              <button onClick={() => setLoveMeter((v) => Math.max(0, v - 7))} className="px-4 py-2 rounded-full bg-pink-200 text-pink-700 font-semibold hover:bg-pink-300 transition-all cursor-pointer">Kurangin 😜</button>
              <button onClick={() => setLoveMeter((v) => Math.min(100, v + 7))} className="px-4 py-2 rounded-full bg-pink-500 text-white font-semibold hover:bg-pink-600 transition-all cursor-pointer">Tambah 💕</button>
              <button onClick={() => { setLoveMeter(100); spawnHearts(10); }} className="px-4 py-2 rounded-full bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-all cursor-pointer">MAX 100% 🔥</button>
            </div>
          </div>
        </div>

        <div className="animate-fade-in-up mb-10" style={{ animationDelay: "0.4s" }}>
          <h2 className="text-2xl font-bold text-center text-fuchsia-700 mb-6">🤗 Peluk Virtual</h2>
          <div className="bg-gradient-to-r from-fuchsia-400 to-pink-500 p-8 rounded-3xl shadow-xl text-center">
            <button onClick={sendHug} className="px-8 py-4 rounded-full bg-white/90 text-fuchsia-600 font-bold text-lg hover:bg-white transition-all shadow-md cursor-pointer flex items-center gap-2 mx-auto">
              <HeartHandshake size={22} /> Kirim Peluk 💞
            </button>
            {hugMsg && (
              <p className="mt-5 text-white text-lg font-medium animate-pop">{hugMsg}</p>
            )}
          </div>
        </div>

        <div className="animate-fade-in-up mb-10" style={{ animationDelay: "0.45s" }}>
          <h2 className="text-2xl font-bold text-center text-pink-700 mb-6">✉️ Generator Surat Rindu</h2>
          <div className="bg-white/80 backdrop-blur-sm p-6 rounded-3xl border-2 border-pink-200 shadow-xl text-center">
            <button onClick={generateLetter} className="px-6 py-2 rounded-full bg-pink-500 text-white font-semibold hover:bg-pink-600 transition-all shadow-md cursor-pointer flex items-center gap-2 mx-auto mb-4">
              <Send size={18} /> Buat Surat 💌
            </button>
            {letter && (
              <p className="text-pink-700 text-lg leading-relaxed animate-pop bg-pink-50 p-4 rounded-2xl border-2 border-pink-100">{letter}</p>
            )}
          </div>
        </div>

        <div className="animate-fade-in-up mb-10" style={{ animationDelay: "0.5s" }}>
          <h2 className="text-2xl font-bold text-center text-pink-700 mb-6">📋 Hal Receh yang Kita Lakuin</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {LDR_THINGS.map((thing, i) => {
              const Icon = thing.icon;
              return (
                <div key={i} className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border-2 border-pink-200 shadow-lg hover:shadow-xl transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="text-pink-400" size={22} />
                    <span className="text-2xl">{thing.emoji}</span>
                    <h3 className="font-bold text-pink-800">{thing.title}</h3>
                  </div>
                  <p className="text-pink-600/80 text-sm">{thing.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="animate-fade-in-up mb-10" style={{ animationDelay: "0.55s" }}>
          <h2 className="text-2xl font-bold text-center text-fuchsia-700 mb-6">🤔 Pertanyaan Absurd Khas LDR</h2>
          <div className="space-y-3">
            {SILLY_QUESTIONS.map((q, i) => (
              <div key={i} className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl border-2 border-fuchsia-200 shadow-md flex items-start gap-3">
                <span className="text-fuchsia-400 font-bold text-lg">{i + 1}.</span>
                <p className="text-fuchsia-700">{q}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-fade-in-up text-center py-8" style={{ animationDelay: "0.6s" }}>
          <p className="text-pink-600/70 text-lg">
            Jarak cuma angka. Kangen itu bukti kalau hati tetep di tempat yang sama. 💗
          </p>
        </div>
      </div>
    </div>
  );
}
