"use client";

import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const typeStyles = {
  success: "border-green-500/30 bg-green-500/10 text-green-700",
  error: "border-red-500/30 bg-red-500/10 text-red-700",
  info: "border-blue-500/30 bg-blue-500/10 text-blue-700",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-700",
} as const;

const typeIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
} as const;

interface ToastProps {
  message: string;
  type: "success" | "error" | "info" | "warning";
  onClose: () => void;
  className?: string;
}

export function Toast({ message, type, onClose, className }: ToastProps) {
  const Icon = typeIcons[type];

  return (
    <div
      role="alert"
      className={cn(
        "glass-panel flex items-start gap-3 p-4 rounded-xl border shadow-lg animate-slide-in pointer-events-auto",
        typeStyles[type],
        className
      )}
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <p className="text-sm font-medium flex-1 min-w-0 break-words">{message}</p>
      <button
        onClick={onClose}
        className="text-current/40 hover:text-current transition-colors rounded-lg p-1 min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0"
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}
