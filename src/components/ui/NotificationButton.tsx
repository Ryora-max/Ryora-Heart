"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";
import { useNotifications } from "@/hooks/useDatabase";
import { useAuthStore } from "@/stores";

export function NotificationButton() {
  const [open, setOpen] = useState(false);
  const { token } = useAuthStore();
  const { notifications, unreadCount, refetch } = useNotifications(token || "");

  useEffect(() => {
    if (open) {
      refetch();
      if (token) {
        fetch("/api/db", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "markNotificationsAsRead", token }),
        }).catch(() => {});
      }
    }
  }, [open, token, refetch]);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-pink-200 shadow-2xl z-50 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-pink-100 flex items-center justify-between">
              <h3 className="font-bold text-pink-700 flex items-center gap-2">
                <Bell size={18} /> Notifications
              </h3>
              <button onClick={() => setOpen(false)} className="text-pink-400 hover:text-pink-600">
                <X size={18} />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-pink-600/70 text-center py-6 text-sm">No notifications yet 💤</p>
              ) : (
                notifications.slice(0, 15).map((n) => (
                  <div key={n.id} className={`p-3 border-b border-pink-50 hover:bg-pink-50 transition-all ${!n.read ? "bg-pink-50/50" : ""}`}>
                    <p className={`text-sm ${!n.read ? "font-semibold text-pink-800" : "text-pink-600"}`}>
                      {n.message}
                    </p>
                    <p className="text-pink-400/70 text-xs mt-0.5">
                      {new Date(n.createdAt).toLocaleString("id-ID", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
