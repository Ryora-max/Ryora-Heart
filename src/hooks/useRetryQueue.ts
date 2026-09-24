"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { incrementPendingSync, decrementPendingSync } from "@/lib/syncStatus";

type RetryableRequest = {
  action: string;
  token: string;
  params?: Record<string, unknown>;
  timestamp: number;
};

export function useRetryQueue() {
  const online = useOnlineStatus();
  const [queue, setQueue] = useState<RetryableRequest[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  // Mirror queue di ref supaya enqueue bisa dedupe tanpa side-effect
  // di dalam state updater (StrictMode double-invokes updaters).
  const queueRef = useRef<RetryableRequest[]>([]);

  useEffect(() => {
    if (!online || queue.length === 0) return;

    const timer = setTimeout(async () => {
      const next = [...queue];
      const successful: string[] = [];

      for (let i = 0; i < next.length; i++) {
        const req = next[i];
        if (Date.now() - req.timestamp > 60000) {
          successful.push(req.action + req.timestamp);
          continue;
        }

        try {
          const res = await fetch("/api/db", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: req.action, token: req.token, ...req.params }),
            cache: "no-store",
          });
          if (res.ok) {
            successful.push(req.action + req.timestamp);
          }
        } catch {
          if (i === 0) {
            setTimeout(() => {
              setQueue((prev) => {
                const kept = prev.filter((q) => !successful.includes(q.action + q.timestamp));
                queueRef.current = kept;
                return kept;
              });
              setPendingCount((prev) => Math.max(0, prev - successful.length));
              decrementPendingSync(successful.length);
            }, 2000);
            return;
          }
        }
      }

      setQueue((prev) => {
        const kept = prev.filter((q) => !successful.includes(q.action + q.timestamp));
        queueRef.current = kept;
        return kept;
      });
      setPendingCount((prev) => Math.max(0, prev - successful.length));
      decrementPendingSync(successful.length);
    }, 2000);

    return () => clearTimeout(timer);
  }, [online, queue]);

  const enqueue = useCallback((req: Omit<RetryableRequest, "timestamp">) => {
    const exists = queueRef.current.some(
      (q) => q.action === req.action && q.token === req.token && JSON.stringify(q.params) === JSON.stringify(req.params)
    );
    if (exists) return;

    const next = [...queueRef.current, { ...req, timestamp: Date.now() }];
    queueRef.current = next;
    setQueue(next);
    setPendingCount(next.length);
    incrementPendingSync();
    window.dispatchEvent(new CustomEvent("ryora-retry-enqueued"));
  }, []);

  const flush = useCallback(() => {
    decrementPendingSync(queueRef.current.length);
    queueRef.current = [];
    setQueue([]);
    setPendingCount(0);
  }, []);

  return { queue, pendingCount, enqueue, flush };
}
