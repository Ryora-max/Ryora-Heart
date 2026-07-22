"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores";
import { APP_CONFIG, ROOMS } from "@/config";
import { cn } from "@/lib/utils";
import { Menu, LogOut, Home } from "lucide-react";
import CustomCursor from "@/components/ui/CustomCursor";
import { NotificationButton } from "@/components/ui/NotificationButton";
import { Toaster } from "@/components/ui/Toaster";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, isAuthenticated, logout, setUser, setToken } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const online = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const handleEnqueue = () => {
      setPendingCount((prev) => prev + 1);
    };
    window.addEventListener("ryora-retry-enqueued", handleEnqueue);
    return () => window.removeEventListener("ryora-retry-enqueued", handleEnqueue);
  }, []);

  useEffect(() => {
    const verifySession = async () => {
      if (isAuthenticated) {
        setVerifying(false);
        return;
      }

      let effectiveToken = token;

      if (!effectiveToken && typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("ryora-auth");
          if (stored) {
            const parsed = JSON.parse(stored);
            effectiveToken = parsed.token || null;
          }
        } catch {
          // ignore
        }
      }

      if (!effectiveToken) {
        setVerifying(false);
        return;
      }

      try {
        const response = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "verify", token: effectiveToken }),
        });
        const data = await response.json();
        if (response.ok && data.user) {
          setUser(data.user);
          setToken(effectiveToken);
        } else {
          logout();
        }
      } catch {
        logout();
      } finally {
        setVerifying(false);
      }
    };

    verifySession();
  }, [isAuthenticated, token, setUser, setToken, logout]);

  useEffect(() => {
    if (!verifying && !isAuthenticated) {
      router.push("/login");
    }
  }, [verifying, isAuthenticated, router]);

  const handleLogout = useCallback(async () => {
    if (token) {
      try {
        await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "logout", token }),
        });
      } catch {}
    }
    logout();
    router.push("/");
  }, [logout, router, token]);

  const navigateTo = useCallback((href: string) => {
    router.push(href);
    setSidebarOpen(false);
  }, [router]);

  if (verifying) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <>
      <CustomCursor />
      <div className="flex min-h-screen">
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="h-full bg-gradient-to-b from-pink-400/90 to-purple-400/90 backdrop-blur-xl p-4 md:p-6 flex flex-col shadow-2xl">
            <div className="mb-6 md:mb-8">
              <h2 className="text-3xl font-bold text-white mb-1">🏠</h2>
              <p className="text-white/80 text-xs font-medium">{APP_CONFIG.name}</p>
              <p className="text-white/60 text-xs">{APP_CONFIG.subtitle}</p>
            </div>

            <nav className="flex-1 space-y-2 overflow-y-auto">
              <button
                onClick={() => navigateTo("/home")}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px]",
                  pathname === "/home" ? "bg-white/30 text-white" : "text-white/80 hover:bg-white/20"
                )}
              >
                <Home size={18} />
                Home
              </button>
              {ROOMS.map((room) => (
                <button
                  key={room.href}
                  onClick={() => navigateTo(room.href)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all min-h-[44px]",
                    pathname === room.href ? "bg-white/30 text-white" : "text-white/80 hover:bg-white/20"
                  )}
                >
                  <span className="text-lg">{room.emoji}</span>
                  {room.name}
                </button>
              ))}
            </nav>

            <div className="mt-auto pt-4 border-t border-white/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center text-lg flex-shrink-0">
                  {user.role === "owner" ? "🤴" : "👸"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-xs text-white/70 truncate">@{user.username}</p>
                </div>
                <NotificationButton />
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm transition-all min-h-[44px]"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-h-screen">
          <div className="md:hidden flex items-center justify-between p-3 md:p-4 bg-gradient-to-r from-pink-400 to-purple-400">
            <button onClick={() => setSidebarOpen(true)} className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center min-h-[44px] min-w-[44px]">
              <Menu size={20} className="text-white" />
            </button>
            <h1 className="text-lg font-bold text-white">🏠 RYORA</h1>
            <div className="w-10" />
          </div>
          {children}
        </main>
      </div>
      <Toaster />
      {!online && <OfflineIndicator pendingCount={pendingCount} onDismiss={() => setPendingCount(0)} />}
    </>
  );
}
