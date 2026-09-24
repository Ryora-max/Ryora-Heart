export const APP_CONFIG = {
  name: "RYORA",
  subtitle: "HeartSync • Our Home",
  users: {
    owner: {
      name: "Ahmad Rio Prawiro",
      username: "Ryo",
      email: "ryo@ryora.app",
      relationship: "Cowo Ara ❤️",
    },
    partner: {
      name: "Tiara Pertiwi",
      username: "Ara",
      email: "ara@ryora.app",
      relationship: "Cewe Rio ❤️",
    },
  },
  relationship: {
    startDate: "2024-10-29",
  },
} as const;

export const ROOMS = [
  { name: "Rumah Utama", href: "/dashboard", emoji: "🏠" },
  { name: "Kegiatan", href: "/live", emoji: "📍" },
  { name: "Chat Cinta", href: "/chat", emoji: "💬" },
  { name: "Peta LDR", href: "/map", emoji: "🗺️" },
  { name: "Riwayat", href: "/history", emoji: "📜" },
  { name: "Pengaturan", href: "/settings", emoji: "⚙️" },
] as const;
