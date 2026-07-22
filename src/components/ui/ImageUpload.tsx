"use client";

import { useState, useRef } from "react";
import { Upload, X, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useAuthStore } from "@/stores";
import Image from "next/image";

interface ImageUploadProps {
  onUpload: (url: string) => void;
}

export function ImageUpload({ onUpload }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token } = useAuthStore();

  const resetPreview = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadFile = async (file: File) => {
    setPreview(URL.createObjectURL(file));
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
      setPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
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
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {preview && (
        <div className="relative rounded-xl overflow-hidden">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-48 object-cover"
          />
          <button
            onClick={resetPreview}
            disabled={uploading}
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
        <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 border-2 border-red-200 text-red-700">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium">Upload failed</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
          <button
            onClick={handleRetry}
            disabled={uploading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold transition-all min-h-[44px]"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full py-2.5 rounded-xl border-2 border-dashed border-purple-200 hover:border-purple-400 bg-white/70 hover:bg-purple-50 text-purple-700 font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 text-sm shadow-sm"
      >
        {uploading ? (
          <>
            <Loader2 size={18} className="animate-spin text-purple-500" />
            Uploading...
          </>
        ) : (
          <>
            <Upload size={18} className="text-purple-500" />
            Upload Photo
          </>
        )}
      </button>
    </div>
  );
}
