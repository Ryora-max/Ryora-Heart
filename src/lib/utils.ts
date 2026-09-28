export function cn(...classes: (string | boolean | undefined | null | Record<string, boolean>)[]) {
  return classes
    .map((cls) => {
      if (typeof cls === "string") return cls;
      if (typeof cls === "object" && cls !== null) {
        return Object.entries(cls)
          .filter(([, val]) => val)
          .map(([key]) => key)
          .join(" ");
      }
      return "";
    })
    .filter(Boolean)
    .join(" ");
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatDistance(date: Date | string): string {
  const now = new Date();
  const target = new Date(date);
  const diff = now.getTime() - target.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days} hari ${hours} jam`;
  if (hours > 0) return `${hours} jam ${minutes} menit`;
  return `${minutes} menit`;
}

export function calculateDaysTogether(startDate: Date | string): number {
  // Parse "YYYY-MM-DD" sebagai hari lokal (bukan UTC midnight) agar hitungan hari
  // tidak bergeser di timezone positif (WIB/UTC+7 dst).
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(startDate));
  const start = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(startDate);
  const now = new Date();
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.floor((today.getTime() - startDay.getTime()) / (1000 * 60 * 60 * 24)));
}

/** Salam sesuai waktu lokal — pagi/siang/sore/malam. */
export function getTimeGreeting(date: Date = new Date()): { text: string; emoji: string } {
  const h = date.getHours();
  if (h >= 4 && h < 11) return { text: "Selamat pagi", emoji: "🌤️" };
  if (h >= 11 && h < 15) return { text: "Selamat siang", emoji: "☀️" };
  if (h >= 15 && h < 19) return { text: "Selamat sore", emoji: "🌇" };
  return { text: "Selamat malam", emoji: "🌙" };
}

/** "5 menit lalu" / "2 jam lalu" — untuk lastSeen partner. */
export function formatLastSeen(date: Date | string): string {
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60_000) return "baru saja";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

/** "1.234 km" — format ribuan Indonesia. */
export function formatDistanceKm(km: string | number): string {
  const n = typeof km === "string" ? parseFloat(km.replace(/[^\d.,]/g, "").replace(",", ".")) : km;
  if (!Number.isFinite(n)) return String(km);
  return `${n.toLocaleString("id-ID")} km`;
}

export function calculateDaysUntil(targetDate: Date | string): number {
  // Hari menuju tanggal target (0 = hari ini, negatif = sudah lewat).
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(targetDate));
  const target = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(targetDate);
  const now = new Date();
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((targetDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
