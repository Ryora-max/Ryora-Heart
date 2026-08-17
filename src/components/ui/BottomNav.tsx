"use client";

import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Activity, MessageCircle, MapPin, Settings } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/live", label: "Live", icon: Activity },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/map", label: "Map", icon: MapPin },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

/**
 * Bottom navigation untuk mobile (PWA-friendly).
 * - Fixed di bottom dengan safe-area-inset
 * - Hanya tampil di mobile (md:hidden)
 * - Touch target 44px+ (Apple HIG)
 * - Active state jelas
 */
export function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 surface-glass border-t safe-area-bottom"
      style={{ borderColor: "var(--border)" }}
      aria-label="Bottom navigation"
    >
      <div className="flex items-center justify-around px-2 py-1">
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
                "touch-target touch-press flex flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 transition-all flex-1 max-w-[72px]",
                isActive ? "text-primary" : "text-text-muted"
              )}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                size={22}
                className={cn("transition-transform", isActive && "scale-110")}
                fill={isActive ? "currentColor" : "none"}
              />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
