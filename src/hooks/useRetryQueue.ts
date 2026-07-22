"use client";

import { useState, useEffect, useCallback } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

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
              setQueue((prev) => prev.filter((q) => !successful.includes(q.action + q.timestamp)));
              setPendingCount((prev) => Math.max(0, prev - successful.length));
            }, 2000);
            return;
          }
        }
      }

      setQueue((prev) => prev.filter((q) => !successful.includes(q.action + q.timestamp)));
      setPendingCount((prev) => Math.max(0, prev - successful.length));
    }, 2000);

    return () => clearTimeout(timer);
  }, [online, queue]);

  const enqueue = useCallback((req: Omit<RetryableRequest, "timestamp">) => {
    setQueue((prev) => {
      const exists = prev.some((q) => q.action === req.action && q.token === req.token && JSON.stringify(q.params) === JSON.stringify(req.params));
      if (exists) return prev;
      return [...prev, { ...req, timestamp: Date.now() }];
    });
    setPendingCount((prev) => {
      const next = prev + 1;
      window.dispatchEvent(new CustomEvent("ryora-retry-enqueued"));
      return next;
    });
  }, []);

  const flush = useCallback(() => {
    setQueue([]);
    setPendingCount(0);
  }, []);

  return { queue, pendingCount, enqueue, flush };
}
