"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

/**
 * Browser-side Supabase client.
 * Uses NEXT_PUBLIC_ env vars (anon key) — respects RLS policies.
 * Pakai @supabase/ssr createBrowserClient supaya session disimpan di cookies
 * (bukan localStorage) — server-side client bisa baca session dari cookies.
 * Singleton supaya tidak bikin koneksi berulang.
 */
export function getSupabaseBrowser(): SupabaseClient {
  if (browserClient) return browserClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY harus di-set di environment"
    );
  }

  browserClient = createBrowserClient(url, anonKey, {
    realtime: {
      params: { eventsPerSecond: 5 },
    },
  });

  return browserClient;
}
