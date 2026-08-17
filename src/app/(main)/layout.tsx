"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/stores";
import { APP_CONFIG, ROOMS } from "@/config";
import { cn } from "@/lib/utils";
import { Menu, LogOut, Home } from "lucide-react";
import CustomCursor from "@/components/ui/CustomCursor";
import { NotificationButton } from "@/components/ui/NotificationButton";
import { BottomNav } from "@/components/ui/BottomNav";
import { Toaster } from "@/components/ui/Toaster";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
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
  const lastSeenRef = useRef<Date | undefined>(undefined);

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

      try {
        // Cek Supabase session dari cookies (browser client)
        const supabase = getSupabaseBrowser();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          setVerifying(false);
          return;
        }

        // Ambil user profile dari /api/auth (baca Supabase session dari cookie)
        const response = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "verify" }),
        });
        const data = await response.json();
        if (response.ok && data.user) {
          setUser(data.user);
          setToken(session.access_token);
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
    try {
      const supabase = getSupabaseBrowser();
      await supabase.auth.signOut();
    } catch {}
    logout();
    if (typeof document !== "undefined") {
      document.cookie = "ryora-session=; Max-Age=0; path=/;";
    }
    router.push("/");
  }, [logout, router]);

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
      <div className="page-bg flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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
          <div className="surface-glass h-full p-4 md:p-6 flex flex-col shadow-soft border-r" style={{ borderColor: "var(--border)" }}>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-gradient-primary text-2xl font-bold">🏠 RYORA</h2>
                <span
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-semibold border touch-target",
                    isPartnerOnline
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : "bg-surface-warm text-text-secondary"
                  )}
                  style={!isPartnerOnline ? { borderColor: "var(--border)" } : {}}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full inline-block mr-1", isPartnerOnline ? "bg-emerald-500" : "bg-text-muted")} />
                  {isPartnerOnline ? "Online 💕" : "Offline 💤"}
                </span>
              </div>
              <p className="text-body text-xs font-medium">{APP_CONFIG.name}</p>
            </div>

            <nav className="flex-1 space-y-1.5 overflow-y-auto no-scrollbar">
              <button
                onClick={() => navigateTo("/home")}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all touch-target touch-press",
                  pathname === "/home" ? "bg-primary-soft text-primary shadow-soft font-semibold" : "text-text-primary hover:bg-surface-warm"
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
                    "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all touch-target touch-press",
                    pathname === room.href ? "bg-primary-soft text-primary shadow-soft font-semibold" : "text-text-primary hover:bg-surface-warm"
                  )}
                >
                  <span className="text-lg">{room.emoji}</span>
                  {room.name}
                </button>
              ))}
            </nav>

            <div className="mt-auto pt-4 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-lg flex-shrink-0 shadow-soft">
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
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-text-primary text-sm transition-all touch-target touch-press shadow-soft"
                style={{ background: "var(--surface-warm)" }}
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-h-screen pb-16 md:pb-0">
          <div className="md:hidden sticky top-0 z-40 flex items-center justify-between p-3 safe-area-top surface-glass border-b" style={{ borderColor: "var(--border)" }}>
             <button onClick={() => setSidebarOpen(true)} className="touch-target rounded-xl flex items-center justify-center active:scale-95 transition-transform" style={{ background: "var(--primary-soft)" }} aria-label="Open menu">
               <Menu size={20} className="text-text-primary" />
             </button>
             <div className="flex items-center gap-2">
               <h1 className="text-gradient-primary text-base font-bold">🏠 RYORA</h1>
               <span className={cn("w-2 h-2 rounded-full", isPartnerOnline ? "bg-emerald-500" : "bg-text-muted")} />
             </div>
             <NotificationButton />
           </div>
           {children}
        </main>
      </div>
      <BottomNav />
      <Toaster />
      {!online && <OfflineIndicator pendingCount={pendingCount} onDismiss={() => setPendingCount(0)} />}
    </>
  );
}
