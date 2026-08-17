import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Middleware: cek Supabase Auth session.
 * Kalau tidak ada session dan bukan di /login, redirect ke /login.
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip static assets & API routes
  if (
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

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Kalau Supabase belum dikonfigurasi, fallback ke cookie lama
    const oldToken = request.cookies.get("ryora-session")?.value;
    if (!oldToken) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Buat Supabase client di middleware untuk cek session
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        // No-op di middleware — response cookies dihandle oleh Route Handler
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|api|login|favicon|icon-|manifest|sw\\.js|offline).*)"],
};
