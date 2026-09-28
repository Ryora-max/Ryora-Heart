"use client";

import { useState, useEffect, useMemo } from "react";
import { Bell, X } from "lucide-react";
import { useNotifications } from "@/hooks/useDatabase";
import { useAuthStore } from "@/stores";
import type { AppNotification } from "@/types";

/**
 * Komponen menerima data via props bila sudah di-fetch parent (layout) —
 * kalau tidak ada props, fallback fetch sendiri. Ini mencegah 2 poller
 * paralel saat tombol dirender dua kali (sidebar + mobile topbar).
 */
export function NotificationButton({
  notifications: propNotifications,
  markRead: propMarkRead,
}: {
  notifications?: AppNotification[];
  markRead?: () => Promise<void> | void;
} = {}) {
  const [open, setOpen] = useState(false);
  const { token } = useAuthStore();
  // Fallback fetch hanya jalan bila parent tidak suplai data — hook internal
  // tetap dipanggil (rules of hooks) tapi polling dimatikan via token palsu
  // kosong saat prop tersedia.
  const self = useNotifications(propNotifications ? "" : token || "");

  const notifications = propNotifications ?? self.notifications;
  const markRead = propMarkRead ?? self.markRead;

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  useEffect(() => {
    if (open && unreadCount > 0) {
      markRead();
    }
  }, [open, unreadCount, markRead]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl bg-surface/60 hover:bg-surface/80 text-text-primary transition-all min-h-[44px] min-w-[44px] flex items-center justify-center shadow-soft"
        aria-label={unreadCount > 0 ? `Notifikasi (${unreadCount} belum dibaca)` : "Notifikasi"}
        aria-expanded={open}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-pink-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-1.5rem)] bg-surface border border-border rounded-2xl shadow-soft-hover z-50 max-h-96 overflow-hidden animate-scale-soft">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-bold text-text-primary flex items-center gap-2">
                <Bell size={18} /> Notifikasi
              </h3>
              <button type="button" onClick={() => setOpen(false)} aria-label="Tutup notifikasi" className="text-text-muted hover:text-text-primary transition-colors p-1 min-h-[44px] min-w-[44px] flex items-center justify-center">
                <X size={18} />
              </button>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-text-muted text-center py-6 text-sm">Belum ada notifikasi 💤</p>
              ) : (
                notifications.slice(0, 15).map((n) => (
                  <div key={n.id} className={`p-3 border-b border-border hover:bg-surface-warm transition-all ${!n.read ? "bg-surface-warm" : ""}`}>
                    <p className={`text-sm ${!n.read ? "font-semibold text-text-primary" : "text-text-secondary"}`}>
                      {n.message}
                    </p>
                    <p className="text-text-muted text-xs mt-0.5">
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
