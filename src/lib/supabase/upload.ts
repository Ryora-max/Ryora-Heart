import { getSupabaseServer } from "./server";

const BUCKET = "gallery";
const MAX_SIZE = 15 * 1024 * 1024; // 15 MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heif",
  "image/bmp",
  "image/svg+xml",
];

/**
 * Upload file ke Supabase Storage (server-side, service_role).
 * Return public URL, atau null kalau gagal.
 */
export async function uploadToStorage(
  file: File,
  pairId: string
): Promise<string | null> {
  if (file.size > MAX_SIZE) {
    throw new Error("File terlalu besar (max 10 MB)");
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Tipe file tidak didukung (hanya JPEG, PNG, WebP, GIF)");
  }

  const supabase = getSupabaseServer();

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filename = `${pairId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filename, buffer, {
      contentType: file.type,
      cacheControl: "31536000, immutable",
      upsert: false,
    });

  if (error) {
    console.error("Storage upload error:", error);
    throw new Error(`Upload gagal: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

/**
 * Hapus file dari Storage by URL.
 */
export async function deleteFromStorage(url: string): Promise<void> {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/gallery\/(.+)$/);
    if (!pathMatch) return;
    const filePath = pathMatch[1];
    const supabase = getSupabaseServer();
    await supabase.storage.from(BUCKET).remove([filePath]);
  } catch {
    /* ignore — mungkin bukan URL Storage */
  }
}
