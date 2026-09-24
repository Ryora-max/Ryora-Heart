"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "ryora:install-prompt-dismissed";
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 hari

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Sudah pernah install? Skip.
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(display-mode: standalone)").matches
    ) {
      return;
    }

    // Cek dismiss TTL
    try {
      const raw = window.localStorage.getItem(DISMISS_KEY);
      if (raw) {
        const dismissedAt = Number(raw);
        if (Number.isFinite(dismissedAt) && Date.now() - dismissedAt < DISMISS_TTL_MS) {
          return;
        }
      }
    } catch {
      /* localStorage unavailable */
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") setVisible(false);
    } catch {
      /* ignore */
    } finally {
      setDeferred(null);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* ignore */
    }
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="ryora-install-title"
      className="fixed bottom-24 md:bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl border border-border bg-surface/90 backdrop-blur-xl p-4 shadow-soft-hover safe-area-inset"
    >
      <div className="flex items-start gap-3">
        <div className="text-3xl shrink-0">💝</div>
        <div className="flex-1 min-w-0">
          <h2 id="ryora-install-title" className="font-semibold text-text-primary text-base">
            Pasang Ryora di HP kamu
          </h2>
          <p className="text-sm text-text-secondary mt-1">
            Akses cepat dari home screen, full-screen, tanpa address bar.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleInstall}
              className="px-4 py-2 rounded-full bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Pasang
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="px-4 py-2 rounded-full bg-transparent text-text-secondary text-sm font-medium hover:bg-surface-warm transition-colors"
            >
              Nanti saja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
