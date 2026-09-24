import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { uploadToStorage } from "@/lib/supabase/upload";
import { getLocalUserFromSessionValue, LOCAL_SESSION_COOKIE, LOCAL_PAIR_ID } from "@/lib/localAuth";
import type { User } from "@/types";

async function getAuthenticatedUser(): Promise<(User & { pair_id: string }) | null> {
  const cookieStore = await cookies();
  const localUser = getLocalUserFromSessionValue(cookieStore.get(LOCAL_SESSION_COOKIE)?.value);
  if (localUser) return localUser as User & { pair_id: string };

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
  } catch {}

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pairId = user.pair_id || LOCAL_PAIR_ID;


    // Coba Supabase Storage dulu (butuh SUPABASE_SERVICE_ROLE_KEY)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const publicUrl = await uploadToStorage(file, pairId);
        if (publicUrl) {
          return NextResponse.json({ url: publicUrl, storage: "supabase" });
        }
      } catch (storageError) {
        console.warn("Storage upload failed, falling back to base64:", storageError);
        // Fall through ke base64 fallback
      }
    }

    // Fallback: base64 data URL (lama)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`;

    return NextResponse.json({ url: base64, storage: "base64" });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
