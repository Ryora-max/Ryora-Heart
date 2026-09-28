"use client";

import { useSyncExternalStore, useCallback, useEffect } from "react";
import { incrementPendingSync, decrementPendingSync } from "@/lib/syncStatus";
import { showToast } from "./useToast";

type RetryableRequest = {
  action: string;
  token: string;
  params?: Record<string, unknown>;
  timestamp: number;
};

const STORAGE_KEY = "ryora-retry-queue";
// Item expired setelah 10 menit — cukup untuk menahan outage singkat/
// jaringan jelek tanpa menahan request basi selamanya.
const TTL_MS = 10 * 60 * 1000;

// ─── Shared module-level queue ────────────────────────────────
// Satu queue untuk seluruh app — hook instance per fitur (useMoods,
// useChat, dst) hanya enqueue ke sini. Tanpa ini, setiap instance
// me-restore + me-replay antrian yang sama → duplikasi write.
let moduleQueue: RetryableRequest[] = [];
let processorTimer: ReturnType<typeof setTimeout> | null = null;
let listenersAttached = false;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

function persistQueue() {
  try {
    if (moduleQueue.length === 0) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(moduleQueue));
  } catch {
    /* storage penuh / private mode — abaikan */
  }
}

function loadQueue(): RetryableRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (q): q is RetryableRequest =>
        typeof q === "object" && q !== null &&
        Date.now() - (q as RetryableRequest).timestamp <= TTL_MS
    );
  } catch {
    return [];
  }
}

function setQueue(next: RetryableRequest[]) {
  moduleQueue = next;
  persistQueue();
  notify();
}

async function processQueue() {
  processorTimer = null;
  if (moduleQueue.length === 0 || !navigator.onLine) return;

  const successful = new Set<string>();
  let expired = 0;
  let networkDown = false;

  for (const req of [...moduleQueue]) {
    if (Date.now() - req.timestamp > TTL_MS) {
      successful.add(req.action + req.timestamp);
      expired++;
      continue;
    }
    try {
      const res = await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: req.action, token: req.token, ...req.params }),
        cache: "no-store",
        // Tanpa timeout, request yang hang memblokir seluruh antrian.
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) successful.add(req.action + req.timestamp);
      // 401/400 = request memang invalid — drop agar tidak stuck selamanya.
      else if (res.status === 400 || res.status === 401) {
        successful.add(req.action + req.timestamp);
      }
    } catch {
      networkDown = true;
      break; // jaringan mati — coba lagi saat online/interval berikutnya
    }
  }

  if (successful.size > 0) {
    setQueue(moduleQueue.filter((q) => !successful.has(q.action + q.timestamp)));
    decrementPendingSync(successful.size);
  }
  if (expired > 0) {
    showToast(`${expired} perubahan gagal tersimpan`, "error");
  }

  // Retry lagi kalau masih ada sisa & network tidak down.
  if (moduleQueue.length > 0 && !networkDown) {
    scheduleProcess(2000);
  }
}

function scheduleProcess(delay = 2000) {
  if (processorTimer !== null) return;
  processorTimer = setTimeout(() => {
    processorTimer = null;
    void processQueue();
  }, delay);
}

function ensureListeners() {
  if (listenersAttached || typeof window === "undefined") return;
  listenersAttached = true;
  window.addEventListener("online", () => scheduleProcess(500));
}

// Hydrate + proses sekali saat module pertama dipakai di client.
function ensureStarted() {
  ensureListeners();
  if (moduleQueue.length === 0) {
    const restored = loadQueue();
    if (restored.length > 0) {
      moduleQueue = restored;
      incrementPendingSync(restored.length);
      notify();
    }
  }
  if (moduleQueue.length > 0) scheduleProcess(1500);
}

export function useRetryQueue() {
  const pendingCount = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => moduleQueue.length,
    () => 0
  );

  useEffect(() => {
    ensureStarted();
  }, []);

  const enqueue = useCallback((req: Omit<RetryableRequest, "timestamp">) => {
    ensureStarted();
    const exists = moduleQueue.some(
      (q) =>
        q.action === req.action &&
        q.token === req.token &&
        JSON.stringify(q.params) === JSON.stringify(req.params)
    );
    if (exists) return;

    setQueue([...moduleQueue, { ...req, timestamp: Date.now() }]);
    incrementPendingSync();
    window.dispatchEvent(new CustomEvent("ryora-retry-enqueued"));
    scheduleProcess();
  }, []);

  const flush = useCallback(() => {
    decrementPendingSync(moduleQueue.length);
    setQueue([]);
  }, []);

  return { queue: moduleQueue, pendingCount, enqueue, flush };
}
