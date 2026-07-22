"use client";

import { useEffect, useState, useCallback } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

let addToastGlobal: (toast: Omit<ToastItem, "id">) => void;

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const handleRemove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    addToastGlobal = (toast) => {
      const id = Date.now().toString() + Math.random().toString(36).slice(2, 8);
      setToasts((prev) => [...prev, { ...toast, id }]);
      const duration = toast.duration ?? 4000;
      if (duration > 0) {
        setTimeout(() => handleRemove(id), duration);
      }
    };

    return () => {
      addToastGlobal = () => {};
    };
  }, [handleRemove]);

  return { toasts, removeToast: handleRemove };
}

export function showToast(message: string, type: ToastType = "info", duration?: number) {
  addToastGlobal({ message, type, duration });
}
