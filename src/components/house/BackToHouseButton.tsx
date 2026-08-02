"use client";

import { useRouter } from "next/navigation";

export function BackToHouseButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push("/home")}
      className={`fixed top-4 left-4 z-50 w-11 h-11 rounded-full bg-white/90 backdrop-blur-md shadow-lg flex items-center justify-center text-xl transition-all hover:scale-110 active:scale-95 cursor-pointer border-2 border-white/60 ${className}`}
      aria-label="Back to house"
    >
      🏠
    </button>
  );
}
