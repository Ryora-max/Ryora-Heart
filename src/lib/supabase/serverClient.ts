import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client yang baca session dari cookies.
 * Pakai di Server Components, Route Handlers, dan Server Actions.
 *
 * Next.js 16: cookies() adalah async function — harus di-await.
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
  const allCookies = cookieStore.getAll();
  console.log("[getSupabaseServerClient] cookies:", allCookies.map(c => ({ name: c.name, len: c.value.length })));

  return createServerClient(url, anonKey, {
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
          // Called from Server Component — cookies read-only di Server Component.
          // Ini OK kalau hanya baca session. Set akan dihandle oleh Route Handler/Action.
        }
      },
    },
  });
}

/**
 * Ambil user profile dari tabel `users` berdasarkan email Supabase Auth.
 * Return null kalau tidak ada session atau profile tidak ditemukan.
 */
export async function getSupabaseUserProfile() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log("[getSupabaseUserProfile] user:", user?.email, "error:", userError?.message);

  if (!user || !user.email) return null;

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("email", user.email)
    .single();

  console.log("[getSupabaseUserProfile] profile:", profile?.id, "error:", profileError?.message);

  if (!profile) return null;

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
}
