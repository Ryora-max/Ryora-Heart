"use client";

import { useEffect, useState, useCallback } from "react";
import { X, ZoomIn, Search } from "lucide-react";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { LdrBanner } from "@/components/ldr/LdrBanner";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useGallery } from "@/hooks/useDatabase";
import { useAuthStore } from "@/stores";
import type { GalleryItem } from "@/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { ImageGridSkeleton } from "@/components/ui/LoadingSkeleton";

/**
 * Detect aspect ratio dari image URL dengan onLoad.
 * Return [naturalWidth, naturalHeight] atau [0,0] kalau belum load.
 */
function useImageSize(url: string): [number, number] {
  const [size, setSize] = useState<[number, number]>([0, 0]);
  useEffect(() => {
    if (!url) return;
    const img = new Image();
    img.onload = () => setSize([img.naturalWidth, img.naturalHeight]);
    img.src = url;
  }, [url]);
  return size;
}

/** Photo card dengan auto-detect aspect ratio — support landscape, portrait, square, semua ukuran */
function PhotoCard({
  photo,
  viewMode,
  idx,
  onClick,
}: {
  photo: GalleryItem;
  viewMode: "masonry" | "grid";
  idx: number;
  onClick: () => void;
}) {
  const [w, h] = useImageSize(photo.url);
  // Default 1 (square) sampai image load. Setelah load, pakai rasio asli.
  // Grid mode: always square (crop). Masonry: pakai rasio asli.
  const aspectRatio = viewMode === "grid" ? 1 : (w && h ? w / h : photo.aspectRatio ?? 1);

  return (
    <MagneticButton key={photo.id} strength={0.15}>
      <div
        className="gallery-item animate-slide-in group relative break-inside-avoid rounded-2xl overflow-hidden cursor-pointer border-border hover:shadow-xl transition-all bg-surface-warm"
        style={{ aspectRatio, animationDelay: `${idx * 0.05}s` }}
        onClick={onClick}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo.url}
          alt={photo.caption || "Relationship memory"}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <ZoomIn className="text-white/80" size={32} />
        </div>
        {photo.caption && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
            <p className="text-white text-sm font-medium">{photo.caption}</p>
          </div>
        )}
      </div>
    </MagneticButton>
  );
}

export default function GalleryPage() {
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);
  const [viewMode, setViewMode] = useState<"masonry" | "grid">("masonry");
  const [searchQuery, setSearchQuery] = useState("");

  const { token } = useAuthStore();
  const { photos, loading, addPhoto, deletePhoto } = useGallery(token || "");

  const filteredPhotos = searchQuery
    ? photos.filter((p) => p.caption?.toLowerCase().includes(searchQuery.toLowerCase()))
    : photos;

  const openLightbox = useCallback((photo: GalleryItem) => setSelectedPhoto(photo), []);

  useEffect(() => {
    document.body.style.overflow = selectedPhoto ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedPhoto]);

  return (
    <div className="page-bg p-3 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-gradient-primary text-3xl sm:text-4xl md:text-5xl font-bold mb-2">
            📸 Gallery
          </h1>
          <p className="text-body">Your precious memories together</p>
        </div>

        <LdrBanner tagline="Galeri LDR: foto-foto yang bikin rindu makin valid. 📸💞" />

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:w-auto">
              <Search size={16} className="text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search memories..."
                className="input-soft pl-9 pr-4 py-2.5 text-sm w-full sm:w-48 touch-target"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setViewMode("masonry")} className={`touch-target touch-press px-3 py-2.5 rounded-lg text-sm transition-all ${viewMode === "masonry" ? "text-white" : "text-text-secondary hover:bg-surface-warm"}`} style={viewMode === "masonry" ? { background: "linear-gradient(to right, var(--primary), var(--secondary))" } : { background: "var(--surface)" }}>Masonry</button>
              <button onClick={() => setViewMode("grid")} className={`touch-target touch-press px-3 py-2.5 rounded-lg text-sm transition-all ${viewMode === "grid" ? "text-white" : "text-text-secondary hover:bg-surface-warm"}`} style={viewMode === "grid" ? { background: "linear-gradient(to right, var(--primary), var(--secondary))" } : { background: "var(--surface)" }}>Grid</button>
              <ImageUpload onUpload={(url) => addPhoto(url)} />
            </div>
          </div>

        {loading ? (
          <ImageGridSkeleton count={8} />
        ) : filteredPhotos.length === 0 ? (
          <EmptyState emoji="📸" title="No photos yet" description="Upload your first memory!" action={<ImageUpload onUpload={(url) => addPhoto(url)} />} />
        ) : (
          <div className={`gallery-grid ${viewMode === "masonry" ? "columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 sm:gap-4 space-y-3 sm:space-y-4" : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4"}`}>
            {filteredPhotos.map((photo, idx) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                viewMode={viewMode}
                idx={idx}
                onClick={() => openLightbox(photo)}
              />
            ))}
          </div>
        )}

        {selectedPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4 safe-area-inset" onClick={() => setSelectedPhoto(null)}>
              <div className="lightbox-content animate-scale-in relative max-w-5xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setSelectedPhoto(null)} className="touch-target absolute -top-10 sm:-top-12 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors active:scale-95">
                <X size={20} className="text-white" />
              </button>
              <div className="bg-white/10 backdrop-blur-sm p-2 rounded-2xl border border-white/20">
                <div className="w-full rounded-xl flex items-center justify-center overflow-hidden bg-black/40 max-h-[75vh]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedPhoto.url}
                    alt={selectedPhoto.caption || "Relationship memory"}
                    className="max-w-full max-h-[75vh] object-contain rounded-xl"
                  />
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    {selectedPhoto.caption && (
                      <p className="text-white font-medium">{selectedPhoto.caption}</p>
                    )}
                    <p className="text-white/40 text-sm mt-1">
                      {selectedPhoto.createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <button onClick={() => { deletePhoto(selectedPhoto.id); setSelectedPhoto(null); }} className="touch-target text-red-400 hover:text-red-300 text-sm cursor-pointer font-semibold p-2 flex items-center justify-center">Delete</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
