"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";

/**
 * Typing indicator via Supabase Realtime broadcast — ephemeral (tidak ada
 * DB write, tidak masuk retry queue). Channel: `typing:{pairId}`.
 *
 * - sendTyping(): throttle ke 1 broadcast per 1.5 detik — panggil saat
 *   input berubah; juga kirim "stop" saat pesan terkirim / input kosong.
 * - partnerTyping: true saat partner mengirim event typing dalam 4 detik
 *   terakhir.
 */
export function useTypingIndicator(
  pairId: string | undefined,
  myUserId: string | undefined
) {
  const [partnerTyping, setPartnerTyping] = useState(false);
  const channelRef = useRef<ReturnType<
    ReturnType<typeof getSupabaseBrowser>["channel"]
  > | null>(null);
  const lastSentRef = useRef(0);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!pairId || !myUserId) return;
    let cancelled = false;

    try {
      const supabase = getSupabaseBrowser();
      const channel = supabase.channel(`typing:${pairId}`, {
        config: { broadcast: { self: false } },
      });
      channel.on("broadcast", { event: "typing" }, ({ payload }) => {
        if (cancelled) return;
        const p = payload as { userId?: string; typing?: boolean };
        if (p.userId === myUserId) return;
        if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
        if (p.typing === false) {
          setPartnerTyping(false);
        } else {
          setPartnerTyping(true);
          // Auto-clear kalau tidak ada event lanjutan (partner berhenti
          // mengetik / kirim pesan / pindah tab tanpa event "stop").
          clearTimerRef.current = setTimeout(() => setPartnerTyping(false), 4000);
        }
      });
      channel.subscribe();
      channelRef.current = channel;
    } catch {
      // Supabase belum terkonfigurasi — indikator mati diam-diam.
    }

    return () => {
      cancelled = true;
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      if (channelRef.current) {
        try {
          getSupabaseBrowser().removeChannel(channelRef.current);
        } catch {}
        channelRef.current = null;
      }
    };
  }, [pairId, myUserId]);

  const sendTyping = useCallback(
    (typing: boolean) => {
      const channel = channelRef.current;
      if (!channel || !myUserId) return;
      const now = Date.now();
      if (typing && now - lastSentRef.current < 1500) return;
      lastSentRef.current = now;
      channel
        .send({
          type: "broadcast",
          event: "typing",
          payload: { userId: myUserId, typing },
        })
        .catch(() => {});
    },
    [myUserId]
  );

  return { partnerTyping, sendTyping };
}
