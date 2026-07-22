"use client";

import { useEffect, useState } from "react";
import { X, ZoomIn, Search } from "lucide-react";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { LdrBanner } from "@/components/ldr/LdrBanner";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useGallery } from "@/hooks/useDatabase";
import { useAuthStore } from "@/stores";
import type { GalleryItem } from "@/types";
import { EmptyState } from "@/components/ui/EmptyState";
import { ImageGridSkeleton } from "@/components/ui/LoadingSkeleton";

export default function GalleryPage() {
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);
  const [viewMode, setViewMode] = useState<"masonry" | "grid">("masonry");
  const [searchQuery, setSearchQuery] = useState("");

  const { token } = useAuthStore();
  const { photos, loading, addPhoto, deletePhoto } = useGallery(token || "");

  const filteredPhotos = photos.filter((p) => p.caption?.toLowerCase().includes(searchQuery.toLowerCase()));

  const openLightbox = (photo: GalleryItem) => setSelectedPhoto(photo);

  useEffect(() => {
    if (selectedPhoto) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [selectedPhoto]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-rose-100 p-3 sm:p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-500 to-pink-600 bg-clip-text text-transparent mb-2">
            📸 Gallery
          </h1>
          <p className="text-purple-600/70">Your precious memories together</p>
        </div>

        <LdrBanner tagline="Galeri LDR: foto-foto yang bikin rindu makin valid. 📸💞" />

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full sm:w-auto">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search memories..."
                className="pl-9 pr-4 py-2.5 bg-white/80 border-2 border-purple-200 rounded-xl text-sm focus:border-purple-400 focus:outline-none w-full sm:w-48 text-purple-900 min-h-[44px]"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setViewMode("masonry")} className={`px-3 py-2.5 rounded-lg text-sm transition-all min-h-[44px] min-w-[44px] ${viewMode === "masonry" ? "bg-purple-500 text-white" : "bg-white/80 text-purple-600 hover:bg-white"}`}>Masonry</button>
              <button onClick={() => setViewMode("grid")} className={`px-3 py-2.5 rounded-lg text-sm transition-all min-h-[44px] min-w-[44px] ${viewMode === "grid" ? "bg-purple-500 text-white" : "bg-white/80 text-purple-600 hover:bg-white"}`}>Grid</button>
              <ImageUpload onUpload={(url) => addPhoto(url)} />
            </div>
          </div>

        {loading ? (
          <ImageGridSkeleton count={8} />
        ) : filteredPhotos.length === 0 ? (
          <EmptyState emoji="📸" title="No photos yet" description="Upload your first memory!" action={<ImageUpload onUpload={(url) => addPhoto(url)} />} />
        ) : (
          <div className={`gallery-grid ${viewMode === "masonry" ? "columns-1 sm:columns-2 lg:columns-3 gap-3 sm:gap-4 space-y-3 sm:space-y-4" : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4"}`}>
            {filteredPhotos.map((photo, idx) => (
              <MagneticButton key={photo.id} strength={0.15}>
                <div
                  className="gallery-item animate-slide-in group relative break-inside-avoid rounded-2xl overflow-hidden cursor-pointer border-2 border-purple-200 hover:border-pink-300 hover:shadow-xl transition-all"
                  style={{ aspectRatio: viewMode === "grid" ? 1 : photo.aspectRatio ?? 1, animationDelay: `${idx * 0.05}s` }}
                  onClick={() => openLightbox(photo)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.caption || "Relationship memory"}
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
            ))}
          </div>
        )}

        {selectedPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4" onClick={() => setSelectedPhoto(null)}>
              <div className="lightbox-content animate-scale-in relative max-w-5xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setSelectedPhoto(null)} className="absolute -top-10 sm:-top-12 right-0 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]">
                <X size={20} className="text-white" />
              </button>
              <div className="bg-white/10 backdrop-blur-sm p-2 rounded-2xl border-2 border-white/20">
                <div className="w-full rounded-xl flex items-center justify-center overflow-hidden bg-black/40 max-h-[75vh]" style={{ aspectRatio: selectedPhoto.aspectRatio ?? 1.5 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedPhoto.url}
                    alt={selectedPhoto.caption || "Relationship memory"}
                    className="max-w-full max-h-[75vh] object-contain rounded-xl"
                  />
                </div>
                {selectedPhoto.caption && (
                  <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">{selectedPhoto.caption}</p>
                      <p className="text-white/40 text-sm mt-1">
                        {selectedPhoto.createdAt.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <button onClick={() => { deletePhoto(selectedPhoto.id); setSelectedPhoto(null); }} className="text-red-400 hover:text-red-300 text-sm cursor-pointer font-semibold p-2 min-h-[44px] flex items-center justify-center">Delete</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
