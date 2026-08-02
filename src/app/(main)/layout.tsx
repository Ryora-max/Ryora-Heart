"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import { LogOut, BookOpen, Home } from "lucide-react";
import CustomCursor from "@/components/ui/CustomCursor";
import { Toaster } from "@/components/ui/Toaster";
import { OfflineIndicator } from "@/components/ui/OfflineIndicator";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { GuideModal } from "@/components/ui/GuideModal";
import { usePresence } from "@/hooks/useDatabase";
import { broadcastRefetch } from "@/hooks/useRealtimePolling";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, token, isAuthenticated, logout, setUser, setToken } = useAuthStore();
  const [verifying, setVerifying] = useState(true);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const online = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);

  const authToken = token || "";
  const { updatePresence } = usePresence(authToken);

  useEffect(() => {
    if (!authToken) return;
    // Only set online on initial load — don't override custom status from HouseExperience
    updatePresence("online");
    const interval = setInterval(() => {
      // Only refresh presence if page is visible — don't override custom status
      if (!document.hidden) {
        // Check if HouseExperience is managing status (via sessionStorage flag)
        const customStatus = sessionStorage.getItem("ryora-custom-status");
        if (!customStatus) {
          updatePresence("online");
        }
      }
    }, 30000);

    const handleVisibility = () => {
      if (document.hidden) {
        updatePresence("away");
      } else {
        const customStatus = sessionStorage.getItem("ryora-custom-status");
        if (!customStatus) {
          updatePresence("online");
        }
        broadcastRefetch();
      }
    };
    const handleBeforeUnload = () => {
      updatePresence("offline");
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [authToken, updatePresence]);

  useEffect(() => {
    const handleEnqueue = () => setPendingCount((prev) => prev + 1);
    window.addEventListener("ryora-retry-enqueued", handleEnqueue);
    return () => window.removeEventListener("ryora-retry-enqueued", handleEnqueue);
  }, []);

  useEffect(() => {
    const verifySession = async () => {
      if (isAuthenticated && user && token) {
        setVerifying(false);
        fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "verify", token }),
        }).then((res) => res.json()).then((data) => {
          if (!data.user) logout();
        }).catch(() => {});
        return;
      }

      let effectiveToken = token;

      if (!effectiveToken && typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("ryora-auth");
          if (stored) {
            const parsed = JSON.parse(stored);
            effectiveToken = parsed.token || null;
            if (parsed.user && effectiveToken) {
              setUser(parsed.user);
              setToken(effectiveToken);
              setVerifying(false);
              fetch("/api/auth", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "verify", token: effectiveToken }),
              }).then((res) => res.json()).then((data) => {
                if (!data.user) logout();
              }).catch(() => {});
              return;
            }
          }
        } catch { /* ignore */ }
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
  }, [isAuthenticated, token, user, setUser, setToken, logout]);

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

  if (verifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">
        <div className="text-center">
          <div className="text-5xl mb-3 animate-bounce">🏠</div>
          <div className="w-8 h-8 border-4 border-pink-400 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <>
      <CustomCursor />
      <main className="min-h-screen relative">
        {children}
      </main>

      {/* Floating top-right controls */}
      <div className="fixed top-3 right-3 z-50 flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => router.push("/home")}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center text-pink-500 hover:bg-white transition-colors"
          aria-label="Home"
        >
          <Home size={16} />
        </button>
        <button
          onClick={() => setIsGuideOpen(true)}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center text-text-primary hover:bg-white transition-colors"
          aria-label="Guide"
        >
          <BookOpen size={16} />
        </button>
        <button
          onClick={handleLogout}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/80 backdrop-blur-md shadow-lg flex items-center justify-center text-red-400 hover:bg-white transition-colors"
          aria-label="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>

      <Toaster />
      <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      {!online && <OfflineIndicator pendingCount={pendingCount} onDismiss={() => setPendingCount(0)} />}
    </>
  );
}
