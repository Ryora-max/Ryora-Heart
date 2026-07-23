"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LdrBanner } from "@/components/ldr/LdrBanner";
import { BookOpen, Sparkles, Heart } from "lucide-react";
import { GuideModal } from "@/components/ui/GuideModal";
import { useAuthStore } from "@/stores";
import { usePresence, usePartnerId } from "@/hooks/useDatabase";

const ROOMS = [
  { id: "living-room", name: "Living Room", emoji: "🛋️", color: "from-pink-400 to-rose-500", desc: "Checklist harian & aktivitas bersama" },
  { id: "bedroom", name: "Bedroom", emoji: "🛏️", color: "from-purple-400 to-pink-500", desc: "Surat cinta & voice note kaset pita" },
  { id: "garden", name: "Garden", emoji: "🌸", color: "from-emerald-400 to-teal-500", desc: "Taman bunga & tanaman impian" },
  { id: "rooftop", name: "Rooftop", emoji: "🌙", color: "from-indigo-500 to-purple-600", desc: "Menatap bintang & harapan bersama" },
  { id: "gallery", name: "Gallery", emoji: "📸", color: "from-amber-400 to-orange-500", desc: "Foto kenangan & kenangan manis" },
  { id: "calendar", name: "Calendar", emoji: "📅", color: "from-blue-400 to-cyan-500", desc: "Jadwal meetup, VC & anniversary" },
  { id: "achievements", name: "Achievements", emoji: "🏆", color: "from-yellow-400 to-amber-500", desc: "Pencapaian & milestone LDR" },
  { id: "secret-box", name: "Secret Box", emoji: "💝", color: "from-rose-500 to-pink-600", desc: "Kotak rahasia ber-PIN & self-destruct" },
  { id: "ldr", name: "LDR Zone", emoji: "💞", color: "from-fuchsia-500 to-pink-500", desc: "Love meter, peluk virtual & lokasi" },
];

interface Star {
  id: number;
  width: number;
  height: number;
  top: number;
  left: number;
  opacity: number;
  delay: number;
}

function createStars(count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      id: i,
      width: ((i * 13 + 7) % 3) + 1,
      height: ((i * 17 + 3) % 3) + 1,
      top: ((i * 23 + 11) % 100),
      left: ((i * 29 + 17) % 100),
      opacity: ((i * 31 + 19) % 50 + 20) / 100,
      delay: ((i * 37 + 23) % 30) / 10,
    });
  }
  return stars;
}

export default function HomePage() {
  const router = useRouter();
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const stars = useMemo(() => createStars(40), []);

  const { user, token } = useAuthStore();
  const authToken = token || "";
  const { presence } = usePresence(authToken);
  const { partnerId } = usePartnerId(authToken, user?.id);

  const partnerPresence = presence.find((p) => p.userId === partnerId);
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const lastSeenRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    lastSeenRef.current = partnerPresence?.lastSeen;
  }, [partnerPresence?.lastSeen]);

  useEffect(() => {
    const tick = () => {
      const lastSeen = lastSeenRef.current;
      if (!lastSeen) {
        setIsPartnerOnline(false);
        return;
      }
      const diff = Date.now() - new Date(lastSeen).getTime();
      setIsPartnerOnline(diff < 60000);
    };
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-indigo-950 via-purple-900 to-pink-950 p-4 sm:p-6 md:p-8">
      {/* Background Stars */}
      <div className="pointer-events-none absolute inset-0">
        {stars.map((star) => (
          <div
            key={star.id}
            className="star absolute rounded-full bg-white animate-pulse"
            style={{
              width: `${star.width}px`,
              height: `${star.height}px`,
              top: `${star.top}%`,
              left: `${star.left}%`,
              opacity: star.opacity,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="text-center pt-4 pb-2 animate-fade-in-down">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-semibold mb-3">
            <span className={`w-2.5 h-2.5 rounded-full ${isPartnerOnline ? "bg-emerald-400 animate-pulse" : "bg-gray-400"}`} />
            {isPartnerOnline ? "Partner Kamu Sedang Online 💕" : "Partner Sedang Offline 💤"}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-pink-300 via-purple-200 to-pink-400 bg-clip-text text-transparent mb-2">
            🏠 Rumah Virtual RYORA
          </h1>
          <p className="text-pink-200/80 text-sm sm:text-base max-w-xl mx-auto">
            Ruang hangat milik Rio & Ara. Pilih ruangan di bawah ini untuk memulai aktivitas harian bersama.
          </p>

          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="px-4 py-2 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-300/40 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-lg min-h-[44px] cursor-pointer"
            >
              <BookOpen size={16} /> Buku Panduan 📘
            </button>
            <button
              onClick={() => router.push("/ldr")}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs sm:text-sm font-semibold hover:from-pink-600 hover:to-rose-600 transition-all flex items-center gap-2 shadow-lg min-h-[44px] cursor-pointer"
            >
              <Heart size={16} className="fill-white" /> LDR Zone 💞
            </button>
          </div>
        </div>

        {/* LDR Quote Banner */}
        <div className="animate-fade-in-up">
          <LdrBanner tagline="Rumah kita virtual: beda alamat, tapi satu hati. 🏠💞" />
        </div>

        {/* Room Grid Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="text-pink-400" size={20} /> Jelajahi Ruangan
            </h2>
            <span className="text-xs text-white/60 font-medium">9 Ruangan Interaktif</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {ROOMS.map((room, idx) => (
              <div
                 key={room.id}
                 onClick={() => router.push(`/${room.id}`)}
                 className={`group relative p-4 sm:p-5 rounded-3xl bg-gradient-to-br ${room.color} text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer border-2 border-white/20 flex flex-col justify-between min-h-[120px] sm:min-h-[140px] animate-scale-in`}
                 style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
               >
                <div className="flex items-start justify-between">
                  <span className="text-4xl group-hover:scale-125 transition-transform duration-300">{room.emoji}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                    Masuk ➡️
                  </span>
                </div>

                <div className="mt-3">
                  <h3 className="text-lg font-bold text-white mb-0.5">{room.name}</h3>
                  <p className="text-xs text-white/80 line-clamp-2 leading-relaxed">{room.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 pb-4 text-white/60 text-xs">
          <p>RYORA • Daily LDR Application for Rio & Ara ❤️</p>
        </div>
      </div>

      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
}

