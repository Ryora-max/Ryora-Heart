import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bedroom | Ryora",
  description: "Surat cinta & voice note di bedroom virtual",
};

export default function BedroomLayout({ children }: { children: React.ReactNode }) {
  return children;
}
