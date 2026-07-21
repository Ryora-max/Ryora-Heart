"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { LdrBanner } from "@/components/ldr/LdrBanner";

const ROOMS = [
  { id: "living-room", name: "Living Room", emoji: "🛋️", color: "from-pink-400 to-rose-400" },
  { id: "bedroom", name: "Bedroom", emoji: "🛏️", color: "from-purple-400 to-pink-400" },
  { id: "garden", name: "Garden", emoji: "🌸", color: "from-green-400 to-emerald-400" },
  { id: "rooftop", name: "Rooftop", emoji: "🌙", color: "from-indigo-400 to-purple-400" },
  { id: "gallery", name: "Gallery", emoji: "📸", color: "from-yellow-400 to-orange-400" },
  { id: "calendar", name: "Calendar", emoji: "📅", color: "from-blue-400 to-cyan-400" },
  { id: "achievements", name: "Achievements", emoji: "🏆", color: "from-amber-400 to-yellow-400" },
  { id: "secret-box", name: "Secret Box", emoji: "💝", color: "from-red-400 to-pink-400" },
  { id: "ldr", name: "LDR Zone", emoji: "💞", color: "from-fuchsia-400 to-pink-400" },
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
  const stars = useMemo(() => createStars(50), []);

  return (
    <div className="relative min-h-screen overflow-hidden cursor-pointer">
      <div className="absolute inset-0 bg-gradient-to-b from-indigo-900 via-purple-900 to-pink-900" />

      <div className="absolute inset-0">
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

      <div className="relative z-20 flex items-center justify-center min-h-screen p-4">
        <div className="house-float animate-float relative w-full max-w-2xl">
          <div className="relative bg-gradient-to-b from-pink-100 to-purple-100 rounded-3xl p-8 shadow-2xl border-4 border-white/20">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-16">
              <div className="absolute inset-0 bg-gradient-to-b from-pink-400 to-rose-500 rounded-t-full" />
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-red-400 rounded-full animate-pulse" />
            </div>

            <div onClick={() => router.push("/living-room")} className="room-btn animate-scale-in mx-auto w-20 h-28 bg-gradient-to-b from-purple-400 to-pink-500 rounded-t-2xl rounded-b-lg cursor-pointer relative group shadow-lg hover:shadow-xl transition-all hover:scale-110" style={{ animationDelay: "0.3s" }}>
              <div className="absolute inset-2 border-2 border-white/30 rounded-t-xl rounded-b-lg" />
              <div className="absolute right-3 top-1/2 w-2 h-2 bg-yellow-300 rounded-full shadow-lg" />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap">
                🛋️ Living Room
              </div>
            </div>

            <div onClick={() => router.push("/bedroom")} className="absolute top-8 left-8 w-16 h-16 bg-gradient-to-br from-blue-300 to-cyan-300 rounded-xl border-4 border-white/30 shadow-inner cursor-pointer hover:scale-110 transition-transform">
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
            <div onClick={() => router.push("/garden")} className="absolute top-8 right-8 w-16 h-16 bg-gradient-to-br from-blue-300 to-cyan-300 rounded-xl border-4 border-white/30 shadow-inner cursor-pointer hover:scale-110 transition-transform">
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>

            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4">
              {ROOMS.map((room, i) => (
                <button key={room.id} onClick={() => router.push(`/${room.id}`)} className={`room-btn animate-scale-in group relative p-4 rounded-2xl bg-gradient-to-br ${room.color} text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 hover:-translate-y-1`} style={{ animationDelay: `${0.3 + i * 0.08}s` }}>
                  <div className="text-3xl mb-2 group-hover:scale-125 transition-transform">{room.emoji}</div>
                  <div className="text-xs font-semibold">{room.name}</div>
                </button>
              ))}
            </div>

            <div className="absolute -top-4 -left-4 text-4xl animate-bounce">💖</div>
            <div className="absolute -top-4 -right-4 text-4xl animate-bounce" style={{ animationDelay: "0.5s" }}>💕</div>
            <div className="absolute -bottom-4 -left-4 text-4xl animate-bounce" style={{ animationDelay: "1s" }}>💗</div>
            <div className="absolute -bottom-4 -right-4 text-4xl animate-bounce" style={{ animationDelay: "1.5s" }}>💖</div>
          </div>

          <div className="mt-6 relative z-20">
            <LdrBanner tagline="Rumah kita virtual: beda alamat, tapi satu hati. 🏠💞" />
          </div>
        </div>
      </div>

      <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center z-30">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-2 animate-pulse">🏠</h1>
        <h2 className="text-2xl md:text-4xl font-bold text-white mb-2">RYORA</h2>
        <p className="text-white/80 text-sm md:text-base">Our Home • HeartSync</p>
      </div>
    </div>
  );
}
