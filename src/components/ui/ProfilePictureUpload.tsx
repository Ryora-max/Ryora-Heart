"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Loader2 } from "lucide-react";
import Image from "next/image";
import { useAuthStore } from "@/stores";
import { showToast } from "@/hooks/useToast";

const MAX_FILE_BYTES = 15 * 1024 * 1024;

interface ProfilePictureUploadProps {
  currentUrl?: string;
  onUpload: (url: string) => void;
}

export function ProfilePictureUpload({ currentUrl, onUpload }: ProfilePictureUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useRef<string | null>(null);
  const { token } = useAuthStore();

  useEffect(() => {
    return () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    };
  }, []);

  const clearPreview = () => {
    if (previewUrl.current) {
      URL.revokeObjectURL(previewUrl.current);
      previewUrl.current = null;
    }
    setPreview(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    if (file.size > MAX_FILE_BYTES) {
      showToast("Ukuran file melebihi 15 MB", "error");
      e.target.value = "";
      return;
    }

    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = URL.createObjectURL(file);
    setPreview(previewUrl.current);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("token", token);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      onUpload(data.url);
      clearPreview();
    } catch (error) {
      console.error("Upload error:", error);
      showToast("Gagal upload foto profil", "error");
      clearPreview();
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        className="relative w-24 h-24 rounded-full overflow-hidden cursor-pointer group border-2 border-dashed border-glass-border hover:border-primary/50 transition-all"
        role="button"
        tabIndex={0}
        aria-label="Ganti foto profil"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
      >
        {(preview || currentUrl) ? (
          <Image
            src={preview || currentUrl || ""}
            alt="Profile picture"
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <Camera size={24} className="text-white/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {uploading ? (
            <Loader2 size={24} className="text-white animate-spin" />
          ) : (
            <Camera size={24} className="text-white" />
          )}
        </div>
      </div>
    </div>
  );
}
