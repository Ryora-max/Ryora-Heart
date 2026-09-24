"use client";

import { WifiOff, RefreshCw, X } from "lucide-react";

interface OfflineIndicatorProps {
  pendingCount?: number;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function OfflineIndicator({ pendingCount = 0, onRetry, onDismiss }: OfflineIndicatorProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-amber-100 dark:bg-amber-950/90 border-b-2 border-amber-300 dark:border-amber-800 px-4 py-2.5 flex items-center justify-between shadow-soft safe-area-top" role="alert">
      <div className="flex items-center gap-2 min-w-0">
        <WifiOff className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <p className="text-sm font-medium text-amber-800 dark:text-amber-200 truncate">
          You are offline
          {pendingCount > 0 && (
            <span className="ml-2 bg-amber-200 dark:bg-amber-800/60 px-2 py-0.5 rounded-full text-xs">
              {pendingCount} pending
            </span>
          )}
        </p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {onRetry && (
          <button
            onClick={onRetry}
            className="p-2 hover:bg-amber-200 dark:hover:bg-amber-800/60 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center text-amber-700 dark:text-amber-300"
            aria-label="Retry connection"
          >
            <RefreshCw size={16} />
          </button>
        )}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-2 hover:bg-amber-200 dark:hover:bg-amber-800/60 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center text-amber-700 dark:text-amber-300"
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
