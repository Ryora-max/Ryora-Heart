"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, X, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useAuthStore } from "@/stores";

interface ImageUploadProps {
  onUpload: (url: string) => void;
}

const MAX_FILE_BYTES = 15 * 1024 * 1024; // 15 MB — samakan dengan copy di bawah

export function ImageUpload({ onUpload }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useRef<string | null>(null);
  const { token } = useAuthStore();

  // Lepas object URL saat komponen unmount — mencegah memory leak.
  useEffect(() => {
    return () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    };
  }, []);

  const resetPreview = () => {
    if (previewUrl.current) {
      URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = null;
    }
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadFile = async (file: File) => {
    if (file.size > MAX_FILE_BYTES) {
      setError("Ukuran file melebihi 15 MB — pilih foto yang lebih kecil");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = URL.createObjectURL(file);
    setPreview(previewUrl.current);
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("token", token || "");

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      const result = await response.json();
      onUpload(result.url);
      resetPreview();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const handleRetry = async () => {
    const input = fileInputRef.current;
    const file = input?.files?.[0];
    if (file) {
      setError(null);
      await uploadFile(file);
    } else {
      input?.click();
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/avif,image/heic,image/heif,image/bmp,image/svg+xml,image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {preview && (
        <div className="relative rounded-xl overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover"
          />
          <button
            type="button"
            onClick={resetPreview}
            disabled={uploading}
            aria-label="Hapus preview gambar"
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors"
          >
            <X size={16} className="text-white" />
          </button>
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Loader2 size={32} className="animate-spin text-white" />
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Upload gagal</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
          <button
            type="button"
            onClick={handleRetry}
            disabled={uploading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 dark:bg-red-900/60 dark:hover:bg-red-900 text-red-700 dark:text-red-300 text-xs font-semibold transition-all min-h-[44px]"
          >
            <RefreshCw size={14} />
            Coba lagi
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full py-2.5 rounded-xl border-2 border-dashed border-primary/40 hover:border-primary bg-surface/70 hover:bg-primary-soft/50 text-text-primary font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 text-sm shadow-sm"
      >
        {uploading ? (
          <>
            <Loader2 size={18} className="animate-spin text-primary" />
            Mengunggah...
          </>
        ) : (
          <>
            <Upload size={18} className="text-primary" />
            Upload Foto
          </>
        )}
      </button>
      <p className="text-xs text-center text-text-muted mt-1">
        JPG, PNG, WebP, GIF, HEIC, AVIF — max 15 MB
      </p>
    </div>
  );
}
