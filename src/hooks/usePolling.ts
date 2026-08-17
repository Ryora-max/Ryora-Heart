"use client";

import { useEffect, useRef } from "react";

/**
 * Smart polling: jalan hanya saat tab visible.
 * - Pause saat tab hidden (hemat bandwidth & battery)
 * - Resume saat tab visible lagi (langsung fetch sekali, lalu interval)
 * - Cleanup otomatis saat unmount
 *
 * @param callback Fungsi yang dipanggil setiap interval
 * @param intervalMs Interval dalam ms (default 10000)
 * @param enabled Kalau false, tidak jalan
 */
export function usePolling(
  callback: () => void,
  intervalMs: number = 10000,
  enabled: boolean = true
) {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  });

  useEffect(() => {
    if (!enabled) return;

    let intervalId: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (intervalId !== null) return;
      // Fetch langsung sekali saat resume
      callbackRef.current();
      intervalId = setInterval(() => callbackRef.current(), intervalMs);
    };

    const stop = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        start();
      } else {
        stop();
      }
    };

    // Init
    if (document.visibilityState === "visible") {
      start();
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [intervalMs, enabled]);
}
