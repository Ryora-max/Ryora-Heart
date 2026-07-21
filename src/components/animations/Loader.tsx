"use client";

import { useEffect, useState } from "react";

export default function Loader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.style.overflow = "hidden";

    const timer = setTimeout(() => {
      setLoading(false);
      document.body.style.overflow = "";
    }, 5000);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = "";
    };
  }, []);

  if (!loading) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400"
      suppressHydrationWarning
    >
      <div className="text-center">
        <div className="text-6xl md:text-8xl mb-4 animate-bounce">💝</div>
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 animate-pulse">RYORA</h1>
        <p className="text-white/80 text-sm md:text-base mb-6">HeartSync • Our Home</p>
        <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden mx-auto">
          <div className="h-full bg-white rounded-full loading-bar" style={{ width: "0%" }} />
        </div>
      </div>
    </div>
  );
}
