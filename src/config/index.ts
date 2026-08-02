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
  { name: "Home", href: "/home", emoji: "🏠" },
  { name: "Living Room", href: "/living-room", emoji: "🛋️" },
  { name: "Bedroom", href: "/bedroom", emoji: "🛏️" },
  { name: "Garden", href: "/garden", emoji: "🌸" },
  { name: "Rooftop", href: "/rooftop", emoji: "🌙" },
  { name: "Gallery", href: "/gallery", emoji: "📸" },
  { name: "LDR Zone", href: "/ldr", emoji: "�" },
  { name: "Secret Box", href: "/secret-box", emoji: "💝" },
  { name: "Game Arcade", href: "/game-arcade", emoji: "🎮" },
  { name: "Settings", href: "/settings", emoji: "⚙️" },
] as const;
