import { cookies } from "next/headers";
import { getLocalUserFromSessionValue, LOCAL_SESSION_COOKIE } from "@/lib/localAuth";
import type { User } from "@/types";

/**
 * Auth untuk API routes: local cookie session dulu (zero-network),
 * lalu Supabase cookie session. Return null kalau tidak ada sesi valid.
 */
export async function getAuthenticatedUser(): Promise<(User & { pair_id: string }) | null> {
  const cookieStore = await cookies();
  const localUser = getLocalUserFromSessionValue(cookieStore.get(LOCAL_SESSION_COOKIE)?.value);
  if (localUser) return localUser;

  try {
    const { getSupabaseUserProfile } = await import("@/lib/supabase/serverClient");
    const profile = await getSupabaseUserProfile();
    if (profile) {
      return {
        ...profile,
        relationship: profile.relationship ?? "",
        pair_id: profile.pair_id ?? "",
      };
    }
  } catch {
    // Supabase tidak dikonfigurasi atau gagal — diabaikan
  }

  return null;
}
