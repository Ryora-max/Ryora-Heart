"use client";

import { useEffect } from "react";

/**
 * Run a callback once after mount (client-only).
 * Avoids React 19 "set-state-in-effect" lint error.
 */
export function useMounted(callback: () => void) {
  useEffect(() => {
    callback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
