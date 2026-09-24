"use client";

import { useSyncExternalStore } from "react";

/**
 * Global pending-sync counter — dipakai OfflineIndicator/topbar badge
 * untuk menampilkan "n perubahan menunggu sinkron".
 * Module-level karena useRetryQueue dipakai per-hook (instance terpisah).
 */
const listeners = new Set<() => void>();
let pending = 0;

function emit() {
  for (const l of listeners) l();
}

export function incrementPendingSync() {
  pending += 1;
  emit();
}

export function decrementPendingSync(n = 1) {
  pending = Math.max(0, pending - n);
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePendingSyncCount(): number {
  return useSyncExternalStore(subscribe, () => pending, () => 0);
}
