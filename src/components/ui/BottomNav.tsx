"use client";

import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Activity, MessageCircle, MapPin, ScrollText, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Rumah", icon: Home },
  { href: "/live", label: "Kegiatan", icon: Activity },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/map", label: "Posisi", icon: MapPin },
  { href: "/history", label: "Riwayat", icon: ScrollText },
  { href: "/settings", label: "Pengaturan", icon: Settings },
] as const;

export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-3 left-4 right-4 z-40 safe-area-bottom pointer-events-auto"
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around px-1.5 py-2 rounded-full bg-white/85 dark:bg-amber-950/85 backdrop-blur-xl border border-amber-200/60 dark:border-amber-800/60 shadow-xl">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                "touch-press flex flex-col items-center justify-center gap-1 rounded-full px-1 py-1.5 min-h-[44px] transition-all flex-1 min-w-0 cursor-pointer relative",
                isActive
                  ? "text-rose-600 dark:text-rose-400 font-bold scale-105"
                  : "text-amber-900/60 dark:text-amber-200/60 hover:text-amber-950"
              )}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <span className="absolute -top-1 w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              )}
              <Icon
                size={20}
                className={cn("transition-transform", isActive && "scale-110")}
                fill={isActive ? "currentColor" : "none"}
              />
              <span className="text-[10px] leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
