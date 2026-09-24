import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { roleFromSessionValue, LOCAL_SESSION_COOKIE } from "@/lib/localAuth";
import { supabaseFetch } from "@/lib/supabase/fetch";

/**
 * Proxy (Next.js 16 — pengganti middleware.ts): cek sesi lokal
 * (ryora-session cookie) ATAU Supabase Auth.
 * Prioritas: cookie lokal dulu — kalau ada, langsung masuk.
 */
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip rute publik, static, api, login, offline
  if (
    pathname === "/" ||
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon-") ||
    pathname.startsWith("/manifest") ||
    pathname.startsWith("/sw.js") ||
    pathname.startsWith("/offline")
  ) {
    return NextResponse.next();
  }

  // 1. Cek local session cookie — kalau valid, langsung masuk tanpa Supabase
  const localSession = request.cookies.get(LOCAL_SESSION_COOKIE)?.value;
  if (roleFromSessionValue(localSession)) {
    return NextResponse.next();
  }

  // 2. Cek Supabase session (kalau dikonfigurasi & reachable).
  //    getUser() adalah network call — wajib try/catch + timeout supaya
  //    host Supabase yang mati tidak me-stall semua navigasi.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (url && anonKey) {
    try {
      const supabase = createServerClient(url, anonKey, {
        global: { fetch: supabaseFetch },
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {
            // No-op in proxy
          },
        },
      });

      const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
      const result = await Promise.race([supabase.auth.getUser(), timeout]);

      if (result?.data?.user) {
        return NextResponse.next();
      }
    } catch {
      // Supabase unreachable — jatuh ke redirect login di bawah
    }
  }

  // Tidak ada sesi valid — redirect ke login
  const loginUrl = new URL("/login", request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api|login|favicon|icon-|manifest|sw\\.js|offline).*)"],
};
