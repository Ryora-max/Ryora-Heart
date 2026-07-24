"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LdrBanner } from "@/components/ldr/LdrBanner";
import { BookOpen, Sparkles, Heart } from "lucide-react";
import { GuideModal } from "@/components/ui/GuideModal";
import { useAuthStore } from "@/stores";
import { usePresence, usePartnerId } from "@/hooks/useDatabase";

const ROOMS = [
  { id: "living-room", name: "Living Room", emoji: "🛋️", color: "from-pink-300 to-rose-300", desc: "Checklist harian & aktivitas bersama" },
  { id: "bedroom", name: "Bedroom", emoji: "🛏️", color: "from-purple-300 to-pink-300", desc: "Surat cinta & voice note kaset pita" },
  { id: "garden", name: "Garden", emoji: "🌸", color: "from-emerald-300 to-teal-300", desc: "Taman bunga & tanaman impian" },
  { id: "rooftop", name: "Rooftop", emoji: "🌙", color: "from-indigo-300 to-purple-300", desc: "Menatap bintang & harapan bersama" },
  { id: "gallery", name: "Gallery", emoji: "📸", color: "from-amber-300 to-orange-300", desc: "Foto kenangan & kenangan manis" },
  { id: "calendar", name: "Calendar", emoji: "📅", color: "from-blue-300 to-cyan-300", desc: "Jadwal meetup, VC & anniversary" },
  { id: "achievements", name: "Achievements", emoji: "🏆", color: "from-yellow-300 to-amber-300", desc: "Pencapaian & milestone LDR" },
  { id: "secret-box", name: "Secret Box", emoji: "💝", color: "from-rose-300 to-pink-300", desc: "Kotak rahasia ber-PIN & self-destruct" },
  { id: "ldr", name: "LDR Zone", emoji: "💞", color: "from-fuchsia-300 to-pink-300", desc: "Love meter, peluk virtual & lokasi" },
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
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-pink-100 via-purple-50 to-indigo-100 p-4 sm:p-6 md:p-8">
      {/* Background Stars */}
      <div className="pointer-events-none absolute inset-0">
        {stars.map((star) => (
          <div
            key={star.id}
            className="star absolute rounded-full bg-pink-300/60 animate-fade-in-soft"
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
        <div className="text-center pt-4 pb-2 animate-fade-in-soft">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-border text-text-primary text-xs font-semibold mb-3 shadow-soft">
            <span className={`w-2.5 h-2.5 rounded-full ${isPartnerOnline ? "bg-emerald-500" : "bg-gray-300"}`} />
            {isPartnerOnline ? "Partner Kamu Sedang Online 💕" : "Partner Sedang Offline 💤"}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-600 mb-2">
            🏠 Rumah Virtual RYORA
          </h1>
          <p className="text-text-secondary text-sm sm:text-base max-w-xl mx-auto">
            Ruang hangat milik Rio & Ara. Pilih ruangan di bawah ini untuk memulai aktivitas harian bersama.
          </p>

          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="px-4 py-2 rounded-full bg-amber-100 hover:bg-amber-200 text-amber-700 border border-amber-200 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-soft min-h-[44px] cursor-pointer"
            >
              <BookOpen size={16} /> Buku Panduan 📘
            </button>
            <button
              onClick={() => router.push("/ldr")}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 text-white text-xs sm:text-sm font-semibold hover:from-pink-500 hover:to-purple-500 transition-all flex items-center gap-2 shadow-soft min-h-[44px] cursor-pointer"
            >
              <Heart size={16} className="fill-white" /> LDR Zone 💞
            </button>
          </div>
        </div>

        {/* LDR Quote Banner */}
        <div className="animate-fade-in-soft">
          <LdrBanner tagline="Rumah kita virtual: beda alamat, tapi satu hati. 🏠💞" />
        </div>

        {/* Room Grid Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary flex items-center gap-2">
              <Sparkles className="text-pink-400" size={20} /> Jelajahi Ruangan
            </h2>
            <span className="text-xs text-text-muted font-medium">9 Ruangan Interaktif</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {ROOMS.map((room, idx) => (
              <div
                 key={room.id}
                 onClick={() => router.push(`/${room.id}`)}
                 className={`group relative p-4 sm:p-5 rounded-3xl bg-gradient-to-br ${room.color} text-white shadow-soft hover:shadow-soft-hover transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer border-2 border-white/30 flex flex-col justify-between min-h-[120px] sm:min-h-[140px] animate-scale-soft`}
                 style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
               >
                 <div className="flex items-start justify-between">
                   <span className="text-4xl group-hover:scale-125 transition-transform duration-300">{room.emoji}</span>
                   <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-white/30 backdrop-blur-sm border border-white/40">
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
        <div className="text-center pt-8 pb-4 text-text-muted text-xs">
          <p>RYORA • Daily LDR Application for Rio & Ara ❤️</p>
        </div>
      </div>

      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
}

