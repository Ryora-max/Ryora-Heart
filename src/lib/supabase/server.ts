import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client dengan service_role key.
 * BYPASS RLS — hanya untuk server/API routes, JANGAN expose ke client.
 *
 * Butuh env var:
 *   SUPABASE_SERVICE_ROLE_KEY  (ambil dari Supabase Dashboard → Settings → API)
 */
export function getSupabaseServer(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY harus di-set untuk server client"
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
