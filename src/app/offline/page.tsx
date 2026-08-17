import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Offline — RYORA",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-gradient-to-br from-pink-200 via-purple-100 to-indigo-100">
      <div className="relative z-10">
        <div className="text-7xl mb-6 animate-breathe">💝</div>
        <h1 className="text-4xl md:text-5xl font-bold mb-3 text-text-primary tracking-tight">
          You&apos;re offline
        </h1>
        <p className="text-lg text-text-secondary font-light max-w-md mx-auto mb-8">
          Ryora butuh koneksi internet untuk memuat kenangan kamu. Coba cek sinyal
          atau Wi-Fi kamu, lalu buka ulang.
        </p>
        <Link
          href="/"
          className="inline-block px-8 py-3 rounded-full bg-white/80 backdrop-blur-xl border-2 border-pink-200 text-text-primary font-semibold shadow-soft hover:shadow-soft-hover transition-all"
        >
          Coba lagi
        </Link>
        <p className="mt-10 text-sm text-text-muted">
          RYORA • HeartSync • Our Home
        </p>
      </div>
    </main>
  );
}
