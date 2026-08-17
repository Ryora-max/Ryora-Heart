"use client";

import { useEffect, useRef } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Update a ref inside an effect (React 19 strict mode: no ref writes during render).
 */
function useUpdatingRef<T>(value: T) {
  const ref = useRef<T>(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

/**
 * Subscribe ke Supabase Realtime postgres_changes untuk satu tabel.
 * Callback dipanggil saat INSERT/UPDATE/DELETE terjadi di tabel tersebut.
 *
 * @param table    Nama tabel (e.g. "moods", "activities")
 * @param filter   Optional filter, e.g. "pair_id=eq.abc123"
 * @param onEvent  Callback yang dipanggil dengan payload row + event type
 * @param enabled  Set false untuk disable subscription (e.g. saat no auth)
 *
 * @example
 * useRealtime("moods", undefined, ({ eventType, new: row }) => {
 *   if (eventType === "INSERT") setMoods(prev => [...prev, row]);
 * });
 */
export function useRealtime(
  table: string,
  filter: string | undefined,
  onEvent: (payload: {
    eventType: "INSERT" | "UPDATE" | "DELETE";
    new: Record<string, unknown>;
    old: Record<string, unknown>;
  }) => void,
  enabled = true
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  // Simpan callback di ref supaya tidak re-subscribe saat callback berubah
  const cbRef = useUpdatingRef(onEvent);

  useEffect(() => {
    if (!enabled) return;

    const supabase = getSupabaseBrowser();
    // Unique suffix per effect mount — avoids React Strict Mode double-invoke
    // collision where supabase.channel(name) returns an already-subscribed channel.
    const channelName = `rt:${table}:${filter || "all"}:${Math.random().toString(36).slice(2, 8)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          ...(filter ? { filter } : {}),
        },
        (payload: { eventType: string; new: Record<string, unknown> | null; old: Record<string, unknown> | null }) => {
          cbRef.current({
            eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
            new: (payload.new as Record<string, unknown>) || {},
            old: (payload.old as Record<string, unknown>) || {},
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // cbRef is a stable ref — intentionally excluded from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, filter, enabled]);
}

/**
 * Subscribe ke multiple tabel sekaligus.
 * Lebih efisien daripada multiple useRealtime calls (1 channel untuk semua).
 *
 * @param tables  Array of { table, filter? }
 * @param onEvent Callback dengan table name + payload
 * @param enabled Set false untuk disable
 *
 * @example
 * useRealtimeMulti(
 *   [{ table: "moods" }, { table: "activities" }],
 *   (table, { eventType, new: row }) => { ... }
 * );
 */
export function useRealtimeMulti(
  tables: Array<{ table: string; filter?: string }>,
  onEvent: (
    table: string,
    payload: {
      eventType: "INSERT" | "UPDATE" | "DELETE";
      new: Record<string, unknown>;
      old: Record<string, unknown>;
    }
  ) => void,
  enabled = true
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const cbRef = useUpdatingRef(onEvent);

  // Stable key untuk re-subscribe hanya saat tabel list berubah
  const tablesKey = tables.map((t) => `${t.table}:${t.filter || ""}`).join(",");

  useEffect(() => {
    if (!enabled || tables.length === 0) return;

    const supabase = getSupabaseBrowser();
    // Unique suffix per effect mount — avoids React Strict Mode double-invoke
    // collision where supabase.channel(name) returns an already-subscribed channel.
    const channelName = `rt:multi:${tablesKey}:${Math.random().toString(36).slice(2, 8)}`;
    let channel = supabase.channel(channelName);

    for (const { table, filter } of tables) {
      channel = channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          ...(filter ? { filter } : {}),
        },
        (payload: { eventType: string; new: Record<string, unknown> | null; old: Record<string, unknown> | null }) => {
          cbRef.current(table, {
            eventType: payload.eventType as "INSERT" | "UPDATE" | "DELETE",
            new: (payload.new as Record<string, unknown>) || {},
            old: (payload.old as Record<string, unknown>) || {},
          });
        }
      );
    }

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tablesKey, enabled]);
}
