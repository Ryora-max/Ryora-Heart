import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Love & Hugs | Ryora",
  description: "LDR hub — jarak, waktu, dan cinta dalam satu layar",
};

export default function LdrLayout({ children }: { children: React.ReactNode }) {
  return children;
}
