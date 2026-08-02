"use client";

import { useEffect, useRef, useCallback } from "react";

type FetchFn = () => Promise<void> | void;

const channel = typeof window !== "undefined" && "BroadcastChannel" in window
  ? new BroadcastChannel("ryora-sync")
  : null;

export function useRealtimePolling(
  fetchFn: FetchFn,
  intervalMs: number = 2000,
  deps: unknown[] = []
) {
  const fnRef = useRef(fetchFn);
  useEffect(() => { fnRef.current = fetchFn; });

  const trigger = useCallback(() => {
    fnRef.current();
  }, []);

  useEffect(() => {
    if (!deps[0]) return;

    // Initial fetch
    fnRef.current();

    // Polling
    const interval = setInterval(() => {
      if (!document.hidden) {
        fnRef.current();
      }
    }, intervalMs);

    // Refetch on tab focus
    const handleVisibility = () => {
      if (!document.hidden) {
        fnRef.current();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // Cross-tab sync
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "refetch") {
        fnRef.current();
      }
    };
    channel?.addEventListener("message", handleMessage);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      channel?.removeEventListener("message", handleMessage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { trigger };
}

export function broadcastRefetch() {
  channel?.postMessage({ type: "refetch" });
}
