"use client";

import { useState, useRef } from "react";
import { useMounted } from "@/hooks/useMounted";
import { useRouter } from "next/navigation";
import { LdrBanner } from "@/components/ldr/LdrBanner";
import { BookOpen, Sparkles, Heart } from "lucide-react";
import { GuideModal } from "@/components/ui/GuideModal";
import { useAuthStore } from "@/stores";

const ROOMS = [
  { id: "living-room", name: "Living Room", emoji: "🛋️", tint: "var(--primary)", desc: "Checklist harian & aktivitas bersama" },
  { id: "bedroom", name: "Bedroom", emoji: "🛏️", tint: "var(--lavender)", desc: "Surat cinta & voice note kaset pita" },
  { id: "garden", name: "Garden", emoji: "🌸", tint: "var(--accent)", desc: "Taman bunga & tanaman impian" },
  { id: "rooftop", name: "Rooftop", emoji: "🌙", tint: "var(--secondary)", desc: "Menatap bintang & harapan bersama" },
  { id: "gallery", name: "Gallery", emoji: "📸", tint: "var(--peach)", desc: "Foto kenangan & kenangan manis" },
  { id: "calendar", name: "Calendar", emoji: "📅", tint: "var(--secondary)", desc: "Jadwal meetup, VC & anniversary" },
  { id: "achievements", name: "Achievements", emoji: "🏆", tint: "var(--peach)", desc: "Pencapaian & milestone LDR" },
  { id: "secret-box", name: "Secret Box", emoji: "💝", tint: "var(--primary)", desc: "Kotak rahasia ber-PIN & self-destruct" },
  { id: "ldr", name: "LDR Zone", emoji: "💞", tint: "var(--primary)", desc: "Love meter, peluk virtual & lokasi" },
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
  const [stars, setStars] = useState<Star[]>([]);
  useMounted(() => setStars(createStars(40)));

  const { user, token } = useAuthStore();
  const authToken = token || "";

  // Temporarily disabled to isolate error
  // const { presence } = usePresence(authToken);
  // const { partnerId } = usePartnerId(authToken, user?.id);
  const presence: { userId: string; status: string; lastSeen: string }[] = [];
  const partnerId: string | null = null;

  const partnerPresence = presence.find((p) => p.userId === partnerId);
  const [isPartnerOnline, setIsPartnerOnline] = useState(false);
  const lastSeenRef = useRef<string | undefined>(undefined);

  return (
    <div className="page-bg relative overflow-x-hidden p-4 sm:p-6 md:p-8">
      {/* Background Stars */}
      <div className="pointer-events-none absolute inset-0">
        {stars.map((star) => (
          <div
            key={star.id}
            className="star absolute rounded-full bg-primary/40 animate-fade-in-soft"
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
          <div className="surface-glass inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-text-primary text-xs font-semibold mb-3 shadow-soft border" style={{ borderColor: "var(--border)" }}>
            <span className={`w-2.5 h-2.5 rounded-full ${isPartnerOnline ? "bg-emerald-500" : "bg-text-muted"}`} />
            {isPartnerOnline ? "Partner Kamu Sedang Online 💕" : "Partner Sedang Offline 💤"}
          </div>
          <h1 className="text-gradient-primary text-4xl sm:text-5xl md:text-6xl font-extrabold mb-2">
            🏠 Rumah Virtual RYORA
          </h1>
          <p className="text-body text-sm sm:text-base max-w-xl mx-auto">
            Ruang hangat milik Rio & Ara. Pilih ruangan di bawah ini untuk memulai aktivitas harian bersama.
          </p>

          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setIsGuideOpen(true)}
              className="touch-target touch-press px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-soft cursor-pointer border"
              style={{
                background: "color-mix(in srgb, var(--peach) 20%, transparent)",
                borderColor: "color-mix(in srgb, var(--peach) 40%, transparent)",
                color: "var(--peach)",
              }}
            >
              <BookOpen size={16} /> Buku Panduan 📘
            </button>
            <button
              onClick={() => router.push("/ldr")}
              className="touch-target touch-press px-4 py-2 rounded-full text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-soft cursor-pointer"
              style={{ background: "linear-gradient(to right, var(--primary), var(--secondary))" }}
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
            <h2 className="text-heading text-xl sm:text-2xl font-bold flex items-center gap-2">
              <Sparkles className="text-primary" size={20} /> Jelajahi Ruangan
            </h2>
            <span className="text-muted text-xs font-medium">9 Ruangan Interaktif</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {ROOMS.map((room, idx) => (
              <div
                 key={room.id}
                 onClick={() => router.push(`/${room.id}`)}
                 className="surface-card touch-press group relative p-4 sm:p-5 rounded-3xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer flex flex-col justify-between min-h-[120px] sm:min-h-[140px] animate-scale-soft"
                 style={{
                   animationDelay: `${0.1 + idx * 0.05}s`,
                   background: `linear-gradient(135deg, color-mix(in srgb, ${room.tint} 25%, var(--surface)), color-mix(in srgb, ${room.tint} 10%, var(--surface)))`,
                 }}
               >
                 <div className="flex items-start justify-between">
                   <span className="text-4xl group-hover:scale-125 transition-transform duration-300">{room.emoji}</span>
                   <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border" style={{ background: "color-mix(in srgb, var(--surface) 60%, transparent)", borderColor: "var(--border)", color: "var(--text-secondary)" }}>
                     Masuk ➡️
                   </span>
                 </div>

                 <div className="mt-3">
                   <h3 className="text-heading text-lg font-bold mb-0.5">{room.name}</h3>
                   <p className="text-body text-xs line-clamp-2 leading-relaxed">{room.desc}</p>
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-8 pb-4 text-muted text-xs">
          <p>RYORA • Daily LDR Application for Rio & Ara ❤️</p>
        </div>
      </div>

      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
    </div>
  );
}

