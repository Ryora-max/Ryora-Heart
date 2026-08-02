import { Plane, Heart, MapPin, Clock, MessageCircle, Video, Gift, Star, Sparkles, Send, HeartHandshake, Bell, X, Navigation, Save, Flame, Sliders } from "lucide-react";

export const ANIMALS = [
  "🐧 Penguin yang nunggu es batu meleleh",
  "🦥 Sloth yang ngegas buat video call",
  "🐙 Gurita yang 4 tangan pegang HP",
  "🦊 Rubah yang nyaru jadi notif WhatsApp",
  "🐢 Kura-kura ngebut buat beli kuota",
];

export const LDR_QUOTES = [
  { text: "Kita beda kota, tapi overthinking-nya selalu ketemu di satu grup.", emoji: "🤪" },
  { text: "Pacaran jarak jauh: level pro di sabar, level pemula di peluk.", emoji: "🫂" },
  { text: "Selisih jam doang bedanya. Biar makin berasa kaya punya pasangan di luar negeri.", emoji: "🌏" },
  { text: "Kalo capek, inget aja: susah sinyal, gampang jatuh cinta.", emoji: "📶" },
  { text: "Our love story is loading... 87% (terhambat kuota)", emoji: "⏳" },
  { text: "Bedanya cuma geografis, sisanya sama: sama-sama ngefans sama kamu.", emoji: "💕" },
  { text: "Rindu itu bukti kalau hati tetep di alamat yang sama. 📮", emoji: "✉️" },
  { text: "LDR: Love Distance Relationship, tapi Distance-nya kalah sama cinta.", emoji: "💞" },
];

export const LDR_THINGS = [
  { icon: Video, title: "Video Call 'Kita Makan Bareng'", desc: "Makan nasi padang sendiri-sendiri tapi pura-pura di meja yang sama.", emoji: "🍽️" },
  { icon: MessageCircle, title: "Good Morning & Good Night Wajib", desc: "Salah satu lupa = drama satu episode.", emoji: "🌞" },
  { icon: Gift, title: "Kirim Paket Misterius", desc: "Isinya mie instan + surat tangan tangan + bau parfum biar keinget.", emoji: "📦" },
  { icon: Plane, title: "Nabung Buat Tiket", desc: "Lebih semangat nabung dari buat beli baju.", emoji: "✈️" },
  { icon: Star, title: "Lihat Bulan Bareng", desc: "Kita nggak satu atap, tapi lihat bulan yang sama. Romantis receh.", emoji: "🌕" },
  { icon: Heart, title: "Saling Kirim SS Receh", desc: "Dari meme kucing sampai screenshoot bensin naik, semua dilaporkan.", emoji: "📸" },
];

export const SILLY_QUESTIONS = [
  "Menurut kamu, aku lebih mirip filter Tiktok yang mana?",
  "Kalau jadi makanan, aku mau jadi apa di piring kamu?",
  "Lebih suka video call sambil tiduran atau sambil ngunyah?",
  "Kalau aku jadi notif, pesan apa yang pengen aku kasih tiap jam 3 pagi?",
  "Kita LDR, tapi emangnya kamu lebih sering kangen atau lebih sering lupa charge HP?",
  "Kalau hujan di kotaku, apa yang kamu lakuin di kotamu?",
];

export const STATUS_EMOJIS = ["💬", "😊", "😴", "💕", "🤗", "✨", "😋", "🥺", "😎", "💪"];

export const HUG_PRESETS = [
  "Peluk Hangat 🤗",
  "Peluk Panjang 🫂",
  "Peluk Surprise 🎉",
  "Peluk Sedih 🥺",
  "Peluk Semangat 💪",
];

export interface FloatingHeart {
  id: number;
  left: number;
  emoji: string;
}

export { Plane, Heart, MapPin, Clock, MessageCircle, Video, Gift, Star, Sparkles, Send, HeartHandshake, Bell, X, Navigation, Save, Flame, Sliders };
