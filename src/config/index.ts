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
    startDate: "2023-01-01",
  },
} as const;

export const ROOMS = [
  { name: "Dashboard", href: "/dashboard", emoji: "🏠" },
  { name: "Live", href: "/live", emoji: "📍" },
  { name: "Chat", href: "/chat", emoji: "💬" },
  { name: "Map", href: "/map", emoji: "🗺️" },
  { name: "Settings", href: "/settings", emoji: "⚙️" },
] as const;
