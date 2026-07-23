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
  { name: "Living Room", href: "/living-room", emoji: "🛋️" },
  { name: "Bedroom", href: "/bedroom", emoji: "🛏️" },
  { name: "Gallery", href: "/gallery", emoji: "📸" },
  { name: "Garden", href: "/garden", emoji: "🌸" },
  { name: "Rooftop", href: "/rooftop", emoji: "🌙" },
  { name: "Calendar", href: "/calendar", emoji: "📅" },
  { name: "Achievements", href: "/achievements", emoji: "🏆" },
  { name: "Secret Box", href: "/secret-box", emoji: "💝" },
  { name: "LDR Zone", href: "/ldr", emoji: "💞" },
  { name: "Settings", href: "/settings", emoji: "⚙️" },
] as const;
