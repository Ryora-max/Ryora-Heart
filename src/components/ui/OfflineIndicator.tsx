"use client";

import { WifiOff, RefreshCw, X } from "lucide-react";

interface OfflineIndicatorProps {
  pendingCount?: number;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function OfflineIndicator({ pendingCount = 0, onRetry, onDismiss }: OfflineIndicatorProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between shadow-lg" role="alert">
      <div className="flex items-center gap-2 min-w-0">
        <WifiOff className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        <p className="text-sm font-medium truncate">
          You are offline
          {pendingCount > 0 && (
            <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
              {pendingCount} pending
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Retry connection"
          >
            <RefreshCw size={16} />
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
