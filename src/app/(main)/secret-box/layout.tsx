import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Secret Box | Ryora",
  description: "Rahasia pribadi terenkripsi untuk pasangan",
};

export default function SecretBoxLayout({ children }: { children: React.ReactNode }) {
  return children;
}
