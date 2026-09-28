"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Di dev, SW boleh serve chunk Turbopack stale (URL path-based, bukan
    // content-hash) — unregister + bersihkan cache supaya selalu dari network.
    if (process.env.NODE_ENV === "development") {
      navigator.serviceWorker.getRegistrations().then(async (regs) => {
        if (!regs.length) return;
        await Promise.all(regs.map((r) => r.unregister()));
        const keys = await caches.keys();
        await Promise.all(
          keys.filter((k) => k.startsWith("ryora-")).map((k) => caches.delete(k))
        );
        if (!sessionStorage.getItem("ryora_sw_purged")) {
          sessionStorage.setItem("ryora_sw_purged", "1");
          location.reload();
        }
      });
      return;
    }

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered:", registration);

        // Auto-update: SW baru "installed" tapi "waiting" → minta
        // skipWaiting, lalu reload sekali saat controller berganti.
        // Tanpa ini user bisa stuck di versi lama sampai semua tab ditutup.
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              newWorker.postMessage("SKIP_WAITING");
            }
          });
        });
        // SW lama sudah aktif tapi ada versi baru → cek juga waiting.
        if (registration.waiting && navigator.serviceWorker.controller) {
          registration.waiting.postMessage("SKIP_WAITING");
        }
        // Cek update tiap jam selama app terbuka.
        setInterval(() => registration.update(), 60 * 60 * 1000);
      })
      .catch((error) => {
        console.log("SW registration failed:", error);
      });

    // Reload SEKALI saat SW baru mengambil alih — guard sessionStorage
    // supaya tidak reload-loop kalau SW flip-flop.
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });
  }, []);

  return null;
}
