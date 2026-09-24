import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseUserProfile } from "@/lib/supabase/serverClient";
import { cookies } from "next/headers";
import {
  getLocalUserFromSessionValue,
  getLocalProfile,
  sessionValueForRole,
  LOCAL_SESSION_COOKIE,
  type LocalRole,
} from "@/lib/localAuth";
import { APP_CONFIG } from "@/config";

const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 hari

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case "login": {
        const { role, password } = body as { role?: string; password?: string };
        if (role !== "owner" && role !== "partner") {
          return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
        }
        if (!password) {
          return NextResponse.json({ error: "Password wajib diisi" }, { status: 400 });
        }

        // 1) Supabase Auth dulu — path utama saat project aktif.
        //    Password Supabase user di-set di Dashboard (beda dari local PIN).
        try {
          const supabase = await getSupabaseServerClient();
          const email =
            role === "owner"
              ? APP_CONFIG.users.owner.email
              : APP_CONFIG.users.partner.email;
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (!error && data.user) {
            const profile = await getSupabaseUserProfile();
            if (profile) {
              return NextResponse.json({ user: profile });
            }
            return NextResponse.json({ user: getLocalProfile(role) });
          }
          // Hanya tolak kalau Supabase PASTI merespons kredensial salah
          // (AuthApiError status 400). Network/timeout (status 0/5xx,
          // AuthRetryableFetchError) → lanjut ke local PIN fallback.
          if (error && error.status === 400) {
            return NextResponse.json({ error: "Password salah 😢" }, { status: 401 });
          }
        } catch {
          // Supabase unreachable → lanjut ke local PIN check
        }

        // 2) Local fallback — PIN diverifikasi server-side via env vars
        const expected =
          role === "owner" ? process.env.OWNER_PIN : process.env.PARTNER_PIN;
        if (!expected || password !== expected) {
          return NextResponse.json({ error: "Password salah 😢" }, { status: 401 });
        }

        const response = NextResponse.json({ user: getLocalProfile(role as LocalRole) });
        response.cookies.set(LOCAL_SESSION_COOKIE, sessionValueForRole(role), {
          path: "/",
          maxAge: SESSION_MAX_AGE,
          sameSite: "lax",
          httpOnly: true,
        });
        return response;
      }

      case "logout": {
        try {
          const supabase = await getSupabaseServerClient();
          await supabase.auth.signOut();
        } catch {
          // Supabase unreachable — tetap clear local session
        }
        const response = NextResponse.json({ success: true });
        response.cookies.delete(LOCAL_SESSION_COOKIE);
        return response;
      }

      case "verify": {
        // Local cookie dulu — zero network, selalu reliable
        const cookieStore = await cookies();
        const localUser = getLocalUserFromSessionValue(cookieStore.get(LOCAL_SESSION_COOKIE)?.value);
        if (localUser) {
          return NextResponse.json({ user: localUser });
        }

        try {
          const profile = await getSupabaseUserProfile();
          if (profile) {
            return NextResponse.json({ user: profile });
          }
          return NextResponse.json({ error: "Sesi tidak valid", debug: "no_profile" }, { status: 401 });
        } catch (err) {
          console.error("Verify error:", err);
          return NextResponse.json({ error: "Sesi tidak valid", debug: String(err) }, { status: 401 });
        }
      }

      default:
        return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
    }
  } catch (error) {
    console.error("Auth API error:", error);
    return NextResponse.json(
      { error: "Kesalahan server, periksa konfigurasi Supabase" },
      { status: 500 }
    );
  }
}
