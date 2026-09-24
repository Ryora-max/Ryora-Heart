import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseFetch } from "./fetch";

/**
 * Server-side Supabase client yang baca session dari cookies.
 * Pakai di Server Components, Route Handlers, dan Server Actions.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY harus di-set"
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    global: { fetch: supabaseFetch },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Read-only di Server Component — diabaikan.
        }
      },
    },
  });
}

/**
 * Ambil user profile dari tabel `users` berdasarkan Supabase Auth session.
 * Return null kalau tidak ada session atau profile tidak ditemukan.
 */
export async function getSupabaseUserProfile() {
  try {
    const supabase = await getSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (!user || !user.email || userError) return null;

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("email", user.email)
      .single();

    if (!profile || profileError) return null;

    return {
      id: profile.id as string,
      username: profile.username as string,
      name: profile.name as string,
      role: profile.role as "owner" | "partner",
      relationship: profile.relationship as string | undefined,
      avatar_url: profile.avatar_url as string | undefined,
      pair_id: profile.pair_id as string | undefined,
      email: user.email,
    };
  } catch {
    return null;
  }
}
