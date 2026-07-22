"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plane, Heart, MapPin, Clock, MessageCircle, Video, Gift, Star, Sparkles, Send, HeartHandshake, Bell, X, Navigation } from "lucide-react";
import { useAuthStore } from "@/stores";
import { usePresence, useStatusUpdates, useHugs, useLoveMeter, useNotifications, usePartnerId, useLocations } from "@/hooks/useDatabase";
import type { Hug, StatusUpdate } from "@/types";

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

const STATUS_EMOJIS = ["💬", "😊", "😴", "💕", "🤗", "✨", "😋", "🥺", "😎", "💪"];

interface FloatingHeart {
  id: number;
  left: number;
  emoji: string;
}

interface ToastNotification {
  id: number;
  message: string;
  type: "hug" | "status" | "love" | "letter" | "mood" | "activity" | "gallery";
  emoji?: string;
}

export default function LdrPage() {
  const { user } = useAuthStore();
  const token = user?.token || "";

  const [animal, setAnimal] = useState(ANIMALS[0]);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [nextMeet, setNextMeet] = useState<{ days: number; hours: number }>({ days: 0, hours: 0 });
  const [hearts, setHearts] = useState<FloatingHeart[]>([]);
  const [statusText, setStatusText] = useState("");
  const [statusEmoji, setStatusEmoji] = useState("💬");
  const [settings, setSettings] = useState<{ distance?: string; nextMeetupDate?: string }>({});
  const [hugMsg, setHugMsg] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [showNotifPanel, setShowNotifPanel] = useState(false);
  const [letter, setLetter] = useState("");
  const [currentPlace, setCurrentPlace] = useState("");
  const [placeNote, setPlaceNote] = useState("");

  const prevNotificationsRef = useRef<string>("");
  const toastIdRef = useRef(0);

  const { presence, updatePresence } = usePresence(token);
  const { updates, addUpdate } = useStatusUpdates(token);
  const { hugs, sendHug } = useHugs(token);
  const { currentPercentage, update: updateLoveMeter } = useLoveMeter(token);
  const { notifications, unreadCount } = useNotifications(token);
  const { partnerId } = usePartnerId(token, user?.id);
  const { locations, addLocation } = useLocations(token);

  useEffect(() => {
    if (!token) return;
    updatePresence("online");
    const interval = setInterval(() => updatePresence("online"), 30000);

    const handleOffline = () => updatePresence("offline");
    window.addEventListener("beforeunload", handleOffline);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) updatePresence("offline");
      else updatePresence("online");
    });

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleOffline);
    };
  }, [token, updatePresence]);

  useEffect(() => {
    const stored = localStorage.getItem("ryora-settings");
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      try { setSettings(JSON.parse(stored)); } catch {}
    }
  }, []);

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

  const spawnHearts = useCallback((count: number) => {
    for (let i = 0; i < count; i++) {
      const emoji = ["💗", "💕", "🩷", "💞", "🌸", "✨"][Math.floor(Math.random() * 6)];
      const h: FloatingHeart = { id: Date.now() + i + Math.random(), left: Math.random() * 90, emoji };
      setHearts((prev) => [...prev, h]);
      setTimeout(() => setHearts((prev) => prev.filter((x) => x.id !== h.id)), 2500);
    }
  }, []);

  const addToast = useCallback((message: string, type: ToastNotification["type"], emoji?: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type, emoji }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    const notifKey = notifications.map((n) => `${n.id}-${n.read}`).join(",");
    if (prevNotificationsRef.current && notifKey !== prevNotificationsRef.current) {
      const newNotifs = notifications.filter((n) => !n.read);
      if (newNotifs.length > 0) {
        const latest = newNotifs[0];
        let type: ToastNotification["type"] = "mood";
        let emoji = "🔔";
        if (latest.type === "hug") { type = "hug"; emoji = "🤗"; }
        else if (latest.type === "status") { type = "status"; emoji = "💬"; }
        else if (latest.type === "love_meter") { type = "love"; emoji = "💗"; }
        else if (latest.type === "letter") { type = "letter"; emoji = "💌"; }
        else if (latest.type === "calendar") { type = "activity"; emoji = "📅"; }
        else if (latest.type === "gallery") { type = "gallery"; emoji = "📸"; }
        addToast(latest.message, type, emoji);
      }
    }
    prevNotificationsRef.current = notifKey;
  }, [notifications, addToast]);

  const handleSendHug = useCallback(async () => {
    if (!partnerId) return;
    const messages = ["Sent a virtual hug 🤗", "Peluk dikirim lewat WiFi 🤗", "Peluk panjang 12 detik 🤗"];
    const msg = messages[Math.floor(Math.random() * messages.length)];
    await sendHug(partnerId, msg);
    setHugMsg(msg);
    spawnHearts(14);
    setTimeout(() => setHugMsg(null), 4000);
  }, [partnerId, sendHug, spawnHearts]);

  const handleStatusUpdate = useCallback(async () => {
    if (!statusText.trim()) return;
    await addUpdate(statusText.trim(), statusEmoji);
    setStatusText("");
  }, [statusText, statusEmoji, addUpdate]);

  const handleShareLocation = useCallback(async () => {
    if (!currentPlace.trim() || !partnerId) return;
    await addLocation(currentPlace.trim(), placeNote || undefined);
    setCurrentPlace("");
    setPlaceNote("");
  }, [currentPlace, placeNote, partnerId, addLocation]);

  const getLastSeenText = (lastSeen: string) => {
    // eslint-disable-next-line react-hooks/purity
    const diff = Date.now() - new Date(lastSeen).getTime();
    if (diff < 60000) return "baru saja";
    if (diff < 3600000) return `${Math.floor(diff / 60000)} menit lalu`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} jam lalu`;
    return `${Math.floor(diff / 86400000)} hari lalu`;
  };

  const partnerPresence = presence.find((p) => p.userId === partnerId);
  const isPartnerOnline = partnerPresence?.status === "online" && partnerPresence?.lastSeen ? (() => {
    // eslint-disable-next-line react-hooks/purity
    const diff = Date.now() - new Date(partnerPresence.lastSeen).getTime();
    return diff < 60000;
  })() : false;

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "hug": return "🤗";
      case "status": return "💬";
      case "love_meter": return "💗";
      case "letter": return "💌";
      case "calendar": return "📅";
      case "gallery": return "📸";
      case "mood": return "😊";
      case "activity": return "✅";
      default: return "🔔";
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-rose-100 via-pink-100 to-fuchsia-100 p-3 sm:p-4 md:p-8 overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        {hearts.map((h) => (
          <span key={h.id} className="absolute bottom-10 text-3xl animate-float-up" style={{ left: `${h.left}%` }}>
            {h.emoji}
          </span>
        ))}
      </div>

      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`fixed top-4 right-4 z-50 animate-slide-in-right bg-gradient-to-r ${toast.type === "hug" ? "from-fuchsia-500 to-pink-500" : toast.type === "status" ? "from-blue-500 to-cyan-500" : toast.type === "love" ? "from-rose-500 to-red-500" : "from-pink-500 to-rose-500"} text-white px-6 py-4 rounded-2xl shadow-2xl border-2 border-white/30 max-w-sm`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl">{toast.emoji}</span>
            <div className="flex-1">
              <p className="font-semibold text-sm">{toast.message}</p>
            </div>
          </div>
        </div>
      ))}

      <div className="fixed top-4 right-4 z-40">
        <button
          onClick={async () => {
            setShowNotifPanel(!showNotifPanel);
            if (!showNotifPanel && token) {
              await fetch("/api/db", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "markNotificationsAsRead", token }),
              });
            }
          }}
          className="relative p-3 bg-white/90 backdrop-blur-sm rounded-full border-2 border-pink-200 shadow-lg hover:shadow-xl transition-all"
        >
          <Bell className="text-pink-500" size={22} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>

        {showNotifPanel && (
          <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-pink-200 shadow-2xl max-h-96 overflow-hidden">
            <div className="p-4 border-b border-pink-100 flex items-center justify-between">
              <h3 className="font-bold text-pink-700 flex items-center gap-2">
                <Bell size={18} /> Notifikasi
              </h3>
              <button onClick={() => setShowNotifPanel(false)} className="text-pink-400 hover:text-pink-600">
                <X size={18} />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-pink-600/70 text-center py-6 text-sm">Belum ada notifikasi 💤</p>
              ) : (
                notifications.slice(0, 15).map((n) => (
                  <div key={n.id} className={`p-3 border-b border-pink-50 hover:bg-pink-50 transition-all ${!n.read ? "bg-pink-50/50" : ""}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{getNotifIcon(n.type)}</span>
                      <div className="flex-1">
                        <p className={`text-sm ${!n.read ? "font-semibold text-pink-800" : "text-pink-600"}`}>
                          {n.message}
                        </p>
                        <p className="text-pink-400/70 text-xs mt-0.5">
                          {new Date(n.createdAt).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                        </p>
                      </div>
                      {!n.read && <div className="w-2 h-2 bg-pink-500 rounded-full mt-1 flex-shrink-0" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-1 sm:px-4">
        <div className="ldr-header animate-fade-in-up text-center mb-10">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-pink-500 to-fuchsia-600 bg-clip-text text-transparent mb-2">
            💞 LDR Zone
          </h1>
          <p className="text-pink-600/70 text-lg">Pacaran jarak jauh: lucu, absurd, tapi kita bertahan. 🫶</p>
        </div>

        <div className="animate-fade-in-up grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-8" style={{ animationDelay: "0.1s" }}>
          <div className="group bg-white/80 backdrop-blur-sm p-5 rounded-2xl border-2 border-pink-200 shadow-lg hover:shadow-xl hover:border-pink-300 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white">
                <MapPin size={20} />
              </div>
              <div>
                <p className="text-pink-500 text-xs font-semibold uppercase tracking-wider">Jarak Kita</p>
                <p className="text-2xl font-bold text-pink-700">~{distanceKm.toLocaleString()} km</p>
              </div>
            </div>
            <p className="text-pink-400/70 text-xs">atau {distanceKm.toLocaleString()} tangis rindu</p>
          </div>
          <div className="group bg-white/80 backdrop-blur-sm p-5 rounded-2xl border-2 border-fuchsia-200 shadow-lg hover:shadow-xl hover:border-fuchsia-300 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-400 to-purple-500 flex items-center justify-center text-white">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-fuchsia-500 text-xs font-semibold uppercase tracking-wider">Menuju Ketemu</p>
                <p className="text-2xl font-bold text-fuchsia-700">{nextMeet.days}h {nextMeet.hours}j</p>
              </div>
            </div>
            <p className="text-fuchsia-400/70 text-xs">hitung mundur peluk virtual</p>
          </div>
          <div className="group bg-white/80 backdrop-blur-sm p-5 rounded-2xl border-2 border-rose-200 shadow-lg hover:shadow-xl hover:border-rose-300 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${isPartnerOnline ? "bg-gradient-to-br from-green-400 to-emerald-500" : "bg-gradient-to-br from-gray-400 to-slate-500"}`}>
                {isPartnerOnline ? <Sparkles size={20} /> : <Plane size={20} />}
              </div>
              <div>
                <p className="text-rose-500 text-xs font-semibold uppercase tracking-wider">Status Partner</p>
                <p className="text-2xl font-bold text-rose-700">{isPartnerOnline ? "Online 💕" : "Offline 💤"}</p>
              </div>
            </div>
            <p className="text-rose-400/70 text-xs">
              {isPartnerOnline ? "Partner lagi aktif" : partnerPresence ? `Terakhir online ${getLastSeenText(partnerPresence.lastSeen)}` : "Belum ada data"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="animate-fade-in-up bg-white/80 backdrop-blur-sm p-6 rounded-3xl border-2 border-pink-200 shadow-xl" style={{ animationDelay: "0.15s" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-pink-700 flex items-center gap-2">
                <Sparkles size={20} /> Mood Binatang LDR
              </h2>
              <button
            onClick={() => setAnimal(ANIMALS[Math.floor(Math.random() * ANIMALS.length)])}
            className="px-4 py-2.5 rounded-full bg-pink-500 text-white text-sm font-semibold hover:bg-pink-600 transition-all shadow-md cursor-pointer hover:scale-105 transform min-h-[44px]"
          >
                Acak 🎲
              </button>
            </div>
            <p className="text-2xl text-center py-8 text-pink-600 font-medium animate-pulse">{animal}</p>
          </div>

          <div className="animate-fade-in-up bg-gradient-to-br from-pink-400 to-fuchsia-500 p-6 rounded-3xl shadow-xl text-center" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-xl font-bold text-white mb-4">💌 Quote Receh LDR</h2>
            <p className="text-4xl mb-4">{LDR_QUOTES[quoteIdx].emoji}</p>
            <p className="text-white text-lg md:text-xl font-medium leading-relaxed mb-6">{LDR_QUOTES[quoteIdx].text}</p>
            <button
            onClick={() => setQuoteIdx((i) => (i + 1) % LDR_QUOTES.length)}
            className="px-6 py-2.5 rounded-full bg-white/90 text-fuchsia-600 font-semibold hover:bg-white transition-all shadow-md cursor-pointer hover:scale-105 transform min-h-[44px]"
          >
              Quote Lain ➡️
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="animate-fade-in-up bg-white/80 backdrop-blur-sm p-6 rounded-3xl border-2 border-pink-200 shadow-xl" style={{ animationDelay: "0.25s" }}>
            <h2 className="text-xl font-bold text-center text-pink-700 mb-4">💗 Love Meter Hari Ini</h2>
            <div className="text-center mb-4">
              <p className="text-6xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent mb-3">{currentPercentage}%</p>
              <div className="w-full h-5 bg-pink-100 rounded-full overflow-hidden mb-4 shadow-inner">
                <div className="h-full bg-gradient-to-r from-pink-400 via-rose-400 to-red-400 rounded-full transition-all duration-700 shadow-lg" style={{ width: `${currentPercentage}%` }} />
              </div>
              <div className="flex gap-2 justify-center flex-wrap">
                <button onClick={() => updateLoveMeter(Math.max(0, currentPercentage - 7))} className="px-4 py-2.5 rounded-full bg-pink-200 text-pink-700 font-semibold hover:bg-pink-300 transition-all cursor-pointer hover:scale-105 transform min-h-[44px] text-sm">Kurangin 😜</button>
                <button onClick={() => updateLoveMeter(Math.min(100, currentPercentage + 7))} className="px-4 py-2.5 rounded-full bg-pink-500 text-white font-semibold hover:bg-pink-600 transition-all cursor-pointer hover:scale-105 transform min-h-[44px] text-sm">Tambah 💕</button>
                <button onClick={() => { updateLoveMeter(100); spawnHearts(15); }} className="px-4 py-2.5 rounded-full bg-rose-500 text-white font-semibold hover:bg-rose-600 transition-all cursor-pointer hover:scale-105 transform min-h-[44px] text-sm">MAX 100% 🔥</button>
              </div>
            </div>
          </div>

          <div className="animate-fade-in-up bg-gradient-to-br from-fuchsia-400 to-pink-500 p-6 rounded-3xl shadow-xl" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-xl font-bold text-center text-white mb-4">🤗 Peluk Virtual</h2>
            <div className="text-center">
              <button onClick={handleSendHug} className="px-6 py-3 rounded-full bg-white/90 text-fuchsia-600 font-bold text-base md:text-lg hover:bg-white transition-all shadow-md cursor-pointer flex items-center gap-2 mx-auto hover:scale-105 transform min-h-[44px]">
                <HeartHandshake size={22} /> Kirim Peluk 💞
              </button>
              {hugMsg && (
                <p className="mt-4 text-white text-lg font-medium animate-pop">{hugMsg}</p>
              )}
              <div className="mt-4 text-left">
                <p className="text-white/80 text-sm font-semibold mb-2">📜 Riwayat Peluk:</p>
                {hugs.length === 0 ? (
                  <p className="text-white/60 text-sm">Belum ada peluk 😢</p>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {hugs.slice(0, 5).map((h: Hug) => (
                      <div key={h.id} className="bg-white/20 rounded-xl p-2 text-sm text-white flex items-center justify-between">
                        <span className="font-semibold">{h.emoji} {h.message}</span>
                        <span className="text-white/60 text-xs">{new Date(h.createdAt).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="animate-fade-in-up bg-white/80 backdrop-blur-sm p-6 rounded-3xl border-2 border-pink-200 shadow-xl mb-8" style={{ animationDelay: "0.35s" }}>
          <h2 className="text-xl font-bold text-center text-pink-700 mb-4">✉️ Generator Surat Rindu</h2>
          <div className="text-center">
            <LetterGenerator onGenerate={setLetter} spawnHearts={spawnHearts} />
            {letter && (
              <p className="text-pink-700 text-lg leading-relaxed animate-pop bg-pink-50 p-4 rounded-2xl border-2 border-pink-100 mt-4">{letter}</p>
            )}
          </div>
        </div>

        <div className="animate-fade-in-up bg-white/80 backdrop-blur-sm p-6 rounded-3xl border-2 border-pink-200 shadow-xl mb-8" style={{ animationDelay: "0.4s" }}>
          <h2 className="text-xl font-bold text-center text-pink-700 mb-4">💬 Status & Update</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            <input
              type="text"
              value={statusText}
              onChange={(e) => setStatusText(e.target.value)}
              placeholder="Apa yang kamu lakukan sekarang?"
              className="flex-1 min-w-[180px] px-4 py-3 rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-pink-900 text-sm min-h-[44px]"
              onKeyDown={(e) => e.key === "Enter" && handleStatusUpdate()}
            />
            <select
              value={statusEmoji}
              onChange={(e) => setStatusEmoji(e.target.value)}
              className="px-3 py-2.5 rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-pink-900 text-sm min-h-[44px]"
            >
              {STATUS_EMOJIS.map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
            <button
              onClick={handleStatusUpdate}
              disabled={!statusText.trim()}
              className="px-6 py-2.5 rounded-xl bg-pink-500 text-white font-bold hover:bg-pink-600 disabled:opacity-50 transition-all hover:scale-105 transform min-h-[44px] text-sm"
            >
              Kirim
            </button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {updates.length === 0 ? (
              <p className="text-pink-600/70 text-center py-4">Belum ada update... Ayo kasih tau partner lagi ngapain! 💬</p>
            ) : (
              updates.map((u: StatusUpdate) => (
                <div key={u.id} className="bg-pink-50 rounded-xl p-3 border-2 border-pink-100 hover:border-pink-200 transition-all">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{u.emoji}</span>
                    <span className="text-pink-700 font-semibold text-sm">
                      {u.userId === user?.id ? "Kamu" : "Partner"}
                    </span>
                    <span className="text-pink-400/70 text-xs ml-auto">
                      {new Date(u.createdAt).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-pink-800 text-sm">{u.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="animate-fade-in-up bg-white/80 backdrop-blur-sm p-6 rounded-3xl border-2 border-pink-200 shadow-xl mb-8" style={{ animationDelay: "0.42s" }}>
          <h2 className="text-xl font-bold text-center text-pink-700 mb-4 flex items-center gap-2">
            <Navigation size={20} /> Lokasi Saat Ini
          </h2>
          <p className="text-pink-600/70 text-sm text-center mb-4">Beri tau partner kamu lagi di mana 💕</p>
          <div className="flex flex-wrap gap-2 mb-4">
            <input
              type="text"
              value={currentPlace}
              onChange={(e) => setCurrentPlace(e.target.value)}
              placeholder="Contoh: Kantor, Rumah, Kafe..."
              className="flex-1 min-w-[160px] px-4 py-2.5 rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-pink-900 text-sm min-h-[44px]"
              onKeyDown={(e) => e.key === "Enter" && handleShareLocation()}
            />
            <input
              type="text"
              value={placeNote}
              onChange={(e) => setPlaceNote(e.target.value)}
              placeholder="Catatan (opsional)"
              className="flex-1 min-w-[160px] px-4 py-2.5 rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-pink-900 text-sm min-h-[44px]"
            />
            <button
              onClick={handleShareLocation}
              disabled={!currentPlace.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold hover:from-pink-600 hover:to-rose-600 disabled:opacity-50 transition-all hover:scale-105 transform min-h-[44px] text-sm"
            >
              Share
            </button>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {locations.length === 0 ? (
              <p className="text-pink-600/70 text-center py-3 text-sm">Belum ada lokasi yang dibagikan 📍</p>
            ) : (
              locations.slice(0, 10).map((loc) => (
                <div key={loc.id} className="bg-pink-50 rounded-xl p-3 border-2 border-pink-100 flex items-center gap-3">
                  <span className="text-xl">📍</span>
                  <div className="flex-1">
                    <p className="text-pink-800 text-sm font-medium">{loc.place}</p>
                    {loc.note && <p className="text-pink-500 text-xs">{loc.note}</p>}
                  </div>
                  <span className="text-pink-400/70 text-xs">
                    {new Date(loc.createdAt).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="animate-fade-in-up mb-8" style={{ animationDelay: "0.45s" }}>
          <h2 className="text-2xl font-bold text-center text-fuchsia-700 mb-6">📋 Hal Receh yang Kita Lakuin</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {LDR_THINGS.map((thing, i) => {
              const Icon = thing.icon;
              return (
                <div key={i} className="group bg-white/80 backdrop-blur-sm p-5 rounded-2xl border-2 border-pink-200 shadow-lg hover:shadow-xl hover:border-pink-300 hover:scale-[1.02] transition-all cursor-default">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center text-pink-500 group-hover:from-pink-200 group-hover:to-rose-200 transition-all">
                      <Icon size={20} />
                    </div>
                    <span className="text-2xl">{thing.emoji}</span>
                    <h3 className="font-bold text-pink-800 text-sm">{thing.title}</h3>
                  </div>
                  <p className="text-pink-600/80 text-xs leading-relaxed">{thing.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="animate-fade-in-up mb-8" style={{ animationDelay: "0.5s" }}>
          <h2 className="text-2xl font-bold text-center text-fuchsia-700 mb-6">🤔 Pertanyaan Absurd Khas LDR</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {SILLY_QUESTIONS.map((q, i) => (
              <div key={i} className="bg-white/70 backdrop-blur-sm p-4 rounded-2xl border-2 border-fuchsia-200 shadow-md hover:shadow-lg hover:border-fuchsia-300 transition-all flex items-start gap-3">
                <span className="text-fuchsia-400 font-bold text-lg flex-shrink-0">{i + 1}.</span>
                <p className="text-fuchsia-700 text-sm">{q}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="animate-fade-in-up text-center py-8" style={{ animationDelay: "0.55s" }}>
          <p className="text-pink-600/70 text-lg">
            Jarak cuma angka. Kangen itu bukti kalau hati tetep di tempat yang sama. 💗
          </p>
        </div>
      </div>
    </div>
  );
}

function LetterGenerator({ onGenerate, spawnHearts }: { onGenerate: (text: string) => void; spawnHearts: (count: number) => void }) {
  const LETTER_TEMPLATES = [
    "Hai sayang, hari ini aku kangen {n} kali. Nanti kalau ketemu, aku traktir {makan}. 💗",
    "To: Kamu. Rindu mode ON. Target: peluk {n} detik pas ketemu. Persiapan: {makan} dulu. 💌",
    "Dear kamu yang di sana, jarak cuma {n} centimeter di hati. Mau {makan} bareng nanti ya. 🥺",
  ];

  const generateLetter = () => {
    const tpl = LETTER_TEMPLATES[Math.floor(Math.random() * LETTER_TEMPLATES.length)];
    const n = Math.floor(Math.random() * 40) + 5;
    const makan = ["bakso", "sate", "mie ayam", "es campur", "nasi goreng"][Math.floor(Math.random() * 5)];
    onGenerate(tpl.replace("{n}", String(n)).replace("{makan}", makan));
    spawnHearts(6);
  };

  return (
    <button onClick={generateLetter} className="px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg cursor-pointer flex items-center gap-2 mx-auto hover:scale-105 transform min-h-[44px] text-sm sm:text-base">
      <Send size={18} /> Buat Surat 💌
    </button>
  );
}
