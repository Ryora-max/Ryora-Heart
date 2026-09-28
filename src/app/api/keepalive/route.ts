import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * Keep-alive untuk Supabase free tier — Vercel Cron memanggil ini
 * tiap hari (lihat vercel.json) supaya project tidak di-pause karena
 * inaktivitas ~7 hari. Hanya melakukan read trivial; tidak expose data.
 */
export async function GET(request: NextRequest) {
  // Kalau CRON_SECRET di-set, wajib Authorization: Bearer <secret>
  // (Vercel mengirim header ini otomatis untuk cron job).
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const supabase = getSupabaseServer();
    const { error } = await supabase.from("users").select("id").limit(1);
    if (error) throw error;
    return NextResponse.json({ ok: true, at: new Date().toISOString() });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error:
          err instanceof Error
            ? err.message
            : JSON.stringify(err, Object.getOwnPropertyNames(err as object)),
      },
      { status: 500 }
    );
  }
}
