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
      })
      .catch((error) => {
        console.log("SW registration failed:", error);
      });
  }, []);

  return null;
}
