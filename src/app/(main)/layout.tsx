"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores";
import { APP_CONFIG, ROOMS } from "@/config";
import { cn } from "@/lib/utils";
import { Menu, LogOut, Home, BookOpen } from "lucide-react";
import CustomCursor from "@/components/ui/CustomCursor";
import { NotificationButton } from "@/components/ui/NotificationButton";
import { Toaster } from "@/components/ui/Toaster";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { GuideModal } from "@/components/ui/GuideModal";
import { usePresence, usePartnerId } from "@/hooks/useDatabase";

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
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const online = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);

  const authToken = token || "";
  const { presence, updatePresence } = usePresence(authToken);
  const { partnerId } = usePartnerId(authToken, user?.id);

  useEffect(() => {
    if (!authToken) return;
    updatePresence("online");
    const interval = setInterval(() => updatePresence("online"), 30000);
    return () => clearInterval(interval);
  }, [authToken, updatePresence]);

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
        const cookies = document.cookie.split(";").reduce((acc, c) => {
          const [k, v] = c.trim().split("=");
          acc[k] = v;
          return acc;
        }, {} as Record<string, string>);
        effectiveToken = cookies["ryora-session"] || null;
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
          cache: "no-store",
        });
      } catch {}
    }
    logout();
    if (typeof document !== "undefined") {
      document.cookie = "ryora-session=; Max-Age=0; path=/;";
    }
    router.push("/");
  }, [logout, router, token]);

  const navigateTo = useCallback((href: string) => {
    router.push(href);
    setSidebarOpen(false);
  }, [router]);

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

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
        {sidebarOpen && <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="h-full bg-gradient-to-b from-pink-200/95 to-purple-200/95 backdrop-blur-xl p-4 md:p-6 flex flex-col shadow-soft border-r border-white/40">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-600">🏠 RYORA</h2>
                <span
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-semibold border",
                    isPartnerOnline
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : "bg-white/60 text-text-secondary border-white/40"
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full inline-block mr-1", isPartnerOnline ? "bg-emerald-500" : "bg-gray-400")} />
                  {isPartnerOnline ? "Online 💕" : "Offline 💤"}
                </span>
              </div>
              <p className="text-text-secondary text-xs font-medium">{APP_CONFIG.name}</p>
            </div>

            <nav className="flex-1 space-y-1.5 overflow-y-auto">
              <button
                onClick={() => navigateTo("/home")}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px]",
                  pathname === "/home" ? "bg-white/80 text-pink-700 shadow-soft font-semibold" : "text-text-primary hover:bg-white/60"
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
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all min-h-[44px]",
                    pathname === room.href ? "bg-white/80 text-pink-700 shadow-soft font-semibold" : "text-text-primary hover:bg-white/60"
                  )}
                >
                  <span className="text-lg">{room.emoji}</span>
                  {room.name}
                </button>
              ))}

              <button
                onClick={() => { setIsGuideOpen(true); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-amber-700 bg-amber-100/80 hover:bg-amber-200/80 transition-all min-h-[44px] mt-2 border border-amber-200/60"
              >
                <BookOpen size={18} className="text-amber-600" />
                Panduan 📘
              </button>
            </nav>

            <div className="mt-auto pt-4 border-t border-white/40">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center text-lg flex-shrink-0 shadow-soft">
                  {user.role === "owner" ? "🤴" : "👸"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{user.name}</p>
                  <p className="text-xs text-text-secondary truncate">@{user.username}</p>
                </div>
                <NotificationButton />
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-white/60 hover:bg-white/80 text-text-primary text-sm transition-all min-h-[44px] shadow-soft"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-h-screen">
          <div className="md:hidden sticky top-0 z-40 flex items-center justify-between p-3 safe-area-inset bg-white/80 backdrop-blur-md border-b border-border">
             <button onClick={() => setSidebarOpen(true)} className="w-10 h-10 rounded-xl bg-primary-soft/50 flex items-center justify-center min-h-[44px] min-w-[44px] active:scale-95 transition-transform">
               <Menu size={20} className="text-text-primary" />
             </button>
             <div className="flex items-center gap-2">
               <h1 className="text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-600">🏠 RYORA</h1>
               <span className={cn("w-2 h-2 rounded-full", isPartnerOnline ? "bg-emerald-500" : "bg-gray-300")} />
             </div>
             <button onClick={() => setIsGuideOpen(true)} className="w-10 h-10 rounded-xl bg-primary-soft/50 flex items-center justify-center min-h-[44px] min-w-[44px] text-text-primary active:scale-95 transition-transform">
               <BookOpen size={18} />
             </button>
           </div>
           {children}
        </main>
      </div>
      <Toaster />
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      {!online && <OfflineIndicator pendingCount={pendingCount} onDismiss={() => setPendingCount(0)} />}
    </>
  );
}
