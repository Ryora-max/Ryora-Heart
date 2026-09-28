"use client";

import { useState } from "react";
import { Camera, Trash2, X } from "lucide-react";
import { useGallery } from "@/hooks/useDatabase";
import { useAuthStore } from "@/stores";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { showToast } from "@/hooks/useToast";
import type { GalleryItem } from "@/types";

/**
 * Galeri Kenangan — grid foto pair + upload + lightbox.
 * Upload lewat ImageUpload → URL Supabase Storage → addPhoto.
 * Realtime via useGallery (table "gallery").
 */
export function PhotoGallery() {
  const { token } = useAuthStore();
  const { gallery, loading, addPhoto, deletePhoto } = useGallery(token || "");
  const [active, setActive] = useState<GalleryItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleUpload = async (url: string) => {
    try {
      await addPhoto(url);
      setUploadOpen(false);
      showToast("Foto ditambahkan ke galeri 📸", "success");
    } catch {
      showToast("Gagal menyimpan foto — coba lagi", "error");
    }
  };

  const handleDelete = async (item: GalleryItem) => {
    if (deleting) return;
    setDeleting(true);
    try {
      await deletePhoto(item.id);
      setActive(null);
      showToast("Foto dihapus", "info");
    } catch {
      showToast("Gagal menghapus foto", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="surface-card p-4">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Camera size={16} className="text-violet-500" />
          <span className="text-xs font-extrabold">Galeri Kenangan 📸</span>
          {gallery.length > 0 && (
            <span className="text-[10px] font-bold text-muted">({gallery.length})</span>
          )}
        </div>
        <button
          onClick={() => setUploadOpen((v) => !v)}
          className="px-2.5 py-1 rounded-lg bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-200 text-[10px] font-bold hover:bg-violet-200 transition-colors cursor-pointer"
        >
          {uploadOpen ? "Tutup" : "+ Tambah"}
        </button>
      </div>

      {uploadOpen && (
        <div className="mb-3 animate-fade-in-soft">
          <ImageUpload onUpload={handleUpload} />
        </div>
      )}

      {loading && gallery.length === 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="aspect-square rounded-xl bg-black/5 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : gallery.length === 0 ? (
        <p className="text-[11px] text-body text-center py-4">
          Belum ada foto — tambahkan kenangan pertama kalian 💕
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {gallery.map((item) => (
            <button
              key={item.id}
              onClick={() => setActive(item)}
              className="aspect-square rounded-xl overflow-hidden border border-border cursor-pointer hover:scale-[1.03] transition-transform focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label={item.caption || "Foto kenangan"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.caption || "Kenangan"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-fade-in-soft"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Foto kenangan"
        >
          <div
            className="relative max-w-lg w-full surface-card rounded-2xl overflow-hidden border border-border animate-scale-soft"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.url}
              alt={active.caption || "Kenangan"}
              className="w-full max-h-[70vh] object-contain bg-black/20"
            />
            <div className="flex items-center justify-between gap-2 p-3">
              <p className="text-xs text-body truncate">
                {active.caption ||
                  new Date(active.createdAt).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
              </p>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => handleDelete(active)}
                  disabled={deleting}
                  className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                  aria-label="Hapus foto"
                >
                  <Trash2 size={16} />
                </button>
                <button
                  onClick={() => setActive(null)}
                  className="p-2 rounded-lg text-body hover:bg-surface-warm transition-colors cursor-pointer"
                  aria-label="Tutup"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
