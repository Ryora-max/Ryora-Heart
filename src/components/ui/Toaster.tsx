"use client";

import { useToast } from "@/hooks/useToast";

export function Toaster() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`glass-panel p-4 rounded-xl min-w-[300px] flex items-center justify-between animate-slide-up ${
            toast.type === "success"
              ? "border-green-500/30"
              : toast.type === "error"
              ? "border-red-500/30"
              : "border-primary/30"
          }`}
        >
          <p className="text-white text-sm">{toast.message}</p>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-white/40 hover:text-white transition-colors ml-4"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
