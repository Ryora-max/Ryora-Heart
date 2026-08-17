import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseUserProfile } from "@/lib/supabase/serverClient";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    const supabase = await getSupabaseServerClient();

    switch (action) {
      case "login": {
        // Login sekarang dihandle client-side via supabase.auth.signInWithPassword
        // Route ini tetap ada untuk backward compatibility, tapi tidak dipakai
        return NextResponse.json({
          error: "Login via Supabase Auth client. Gunakan signInWithPassword.",
        }, { status: 400 });
      }

      case "logout": {
        await supabase.auth.signOut();
        const response = NextResponse.json({ success: true });
        // Hapus cookie lama juga (cleanup)
        response.cookies.delete("ryora-session");
        return response;
      }

      case "verify": {
        // Baca session dari Supabase cookies
        try {
          const profile = await getSupabaseUserProfile();
          if (!profile) {
            return NextResponse.json({ error: "Sesi tidak valid", debug: "no_profile" }, { status: 401 });
          }
          return NextResponse.json({ user: profile });
        } catch (err) {
          console.error("Verify error:", err);
          return NextResponse.json({ error: "Verify error", debug: String(err) }, { status: 500 });
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
