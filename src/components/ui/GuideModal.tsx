"use client";

import { useState } from "react";
import { X, BookOpen, Heart, Bell, Lock, Radio, Calendar, Image as ImageIcon, MapPin, Smile, ShieldCheck } from "lucide-react";

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GuideModal({ isOpen, onClose }: GuideModalProps) {
  const [activeTab, setActiveTab] = useState<"general" | "presence" | "features" | "security">("general");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-3 sm:p-4" onClick={onClose}>
      <div
        className="bg-white/95 backdrop-blur-xl rounded-3xl border-2 border-pink-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <BookOpen size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold">📘 Buku Panduan RYORA LDR</h2>
              <p className="text-xs text-white/80">Panduan lengkap & fitur spesial untuk pasangan Rio & Ara 💕</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-pink-100 bg-pink-50/50 p-2 gap-1 flex-shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab("general")}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[44px] whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "general" ? "bg-white text-pink-600 shadow-sm" : "text-gray-600 hover:bg-pink-100/50"
            }`}
          >
            <Heart size={16} /> Umum & Notifikasi
          </button>
          <button
            onClick={() => setActiveTab("presence")}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[44px] whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "presence" ? "bg-white text-pink-600 shadow-sm" : "text-gray-600 hover:bg-pink-100/50"
            }`}
          >
            <Radio size={16} /> Status Online Realtime
          </button>
          <button
            onClick={() => setActiveTab("features")}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[44px] whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "features" ? "bg-white text-pink-600 shadow-sm" : "text-gray-600 hover:bg-pink-100/50"
            }`}
          >
            <Smile size={16} /> Ruangan & Fitur LDR
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[44px] whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "security" ? "bg-white text-pink-600 shadow-sm" : "text-gray-600 hover:bg-pink-100/50"
            }`}
          >
            <Lock size={16} /> PIN & Penyamaran
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-gray-700 text-sm leading-relaxed">
          {activeTab === "general" && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="p-4 rounded-2xl bg-pink-50 border border-pink-100 space-y-2">
                <h3 className="font-bold text-pink-700 flex items-center gap-2 text-base">
                  <Bell size={18} /> System Notifikasi Real-time 🔔
                </h3>
                <p>
                  Setiap kali pasangan Anda mengirimkan <strong>Peluk Virtual</strong>, memperbarui <strong>Love Meter</strong>, mengunggah <strong>Foto Galeri</strong>, menambahkan <strong>Event Kalender</strong>, atau mengirim <strong>Surat Cinta</strong>, sebuah notifikasi akan dikirimkan secara otomatis!
                </p>
                <p className="text-xs text-pink-500 font-medium">
                  💡 Lonceng notifikasi di pojok kanan atas aplikasi akan menampilkan lencana merah saat ada notifikasi belum dibaca.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50 border border-purple-100 space-y-2">
                <h3 className="font-bold text-purple-700 flex items-center gap-2 text-base">
                  <Heart size={18} /> Tema Global Aplikasi ✨
                </h3>
                <p>
                  Anda dapat mengubah suasana visual aplikasi melalui menu <strong>Settings</strong>. Pilihan tema meliputi:
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs text-purple-800">
                  <li><strong>Light Mode</strong>: Tampilan cerah, romantis, dan ceria.</li>
                  <li><strong>Dark Mode</strong>: Suasana malam yang hangat dan nyaman di mata.</li>
                  <li><strong>Aurora Mode</strong>: Gradien ungu-pink magis khas impian LDR.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === "presence" && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 space-y-2">
                <h3 className="font-bold text-emerald-700 flex items-center gap-2 text-base">
                  <Radio size={18} /> Keterhubungan Status Online 🟢
                </h3>
                <p>
                  RYORA secara otomatis mendeteksi ketika pasangan Anda membuka dan menggunakan aplikasi.
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-emerald-200">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold text-emerald-800">Online 💕</span>
                    <span className="text-gray-500">- Pasangan sedang aktif membuka web RYORA.</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white border border-gray-200">
                    <span className="w-3 h-3 rounded-full bg-gray-400" />
                    <span className="font-bold text-gray-700">Offline 💤</span>
                    <span className="text-gray-500">- Menampilkan estimasi waktu terakhir kali online (misal: "15 menit lalu").</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "features" && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-pink-50 border border-pink-100 space-y-1">
                  <p className="font-bold text-pink-800 text-xs flex items-center gap-1.5"><Heart size={14} /> LDR Zone</p>
                  <p className="text-[12px] text-pink-600">Hitung mundur ketemuan, Love Meter Slider, Kirim Peluk Virtual, dan Bagikan Lokasi.</p>
                </div>
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-100 space-y-1">
                  <p className="font-bold text-purple-800 text-xs flex items-center gap-1.5"><Radio size={14} /> Bedroom & Voice Note</p>
                  <p className="text-[12px] text-purple-600">Menulis surat cinta & memutar voice note kaset pita retro dengan suara chipmunk imut.</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 space-y-1">
                  <p className="font-bold text-blue-800 text-xs flex items-center gap-1.5"><Calendar size={14} /> Kalender Pasangan</p>
                  <p className="text-[12px] text-blue-600">Jadwal Video Call dinner, ulang tahun, anniversary, dan pengingat kencan online.</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-100 space-y-1">
                  <p className="font-bold text-amber-800 text-xs flex items-center gap-1.5"><ImageIcon size={14} /> Galeri Kenangan</p>
                  <p className="text-[12px] text-amber-600">Grid foto masonry berkualitas tinggi dan viewer lightbox layar penuh.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 space-y-2">
                <h3 className="font-bold text-rose-700 flex items-center gap-2 text-base">
                  <ShieldCheck size={18} /> Kunci PIN Secret Box 🔒
                </h3>
                <p>
                  <strong>Secret Box</strong> dilindungi oleh PIN rahasia 4 angka.
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs text-rose-800">
                  <li><strong>PIN Default</strong>: <code className="bg-white px-1.5 py-0.5 rounded border border-rose-200 font-mono text-rose-600">0101</code> (diambil dari tanggal jadian).</li>
                  <li><strong>Kustomisasi PIN</strong>: PIN dapat diubah melalui menu Settings atau di dalam Secret Box.</li>
                  <li><strong>Self-Destruct Letter</strong>: Surat rahasia yang otomatis terhapus permanen setelah dibaca 1 kali!</li>
                  <li><strong>Disguise Mode</strong>: Mode penyamaran judul aplikasi menjadi "Notes App".</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-pink-50/80 border-t border-pink-100 flex items-center justify-between flex-shrink-0">
          <p className="text-xs text-pink-600 font-medium">Dibuat khusus untuk Rio & Ara ❤️</p>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold text-xs hover:from-pink-600 hover:to-rose-600 shadow-md transition-all cursor-pointer min-h-[44px]"
          >
            Tutup Panduan
          </button>
        </div>
      </div>
    </div>
  );
}
