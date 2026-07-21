"use client";

import { useEffect, useState, useCallback } from "react";

type Toast = {
  id: string;
  message: string;
  type: "success" | "info" | "error";
};

let addToast: (toast: Omit<Toast, "id">) => void;

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    addToast = (toast) => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { ...toast, id }]);
      setTimeout(() => removeToast(id), 3000);
    };

    return () => {
      addToast = () => {};
    };
  }, [removeToast]);

  return { toasts, removeToast };
}

export function showToast(message: string, type: Toast["type"] = "info") {
  addToast({ message, type });
}
