import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Garden | Ryora",
  description: "Gallery foto & mood harian di taman virtual",
};

export default function GardenLayout({ children }: { children: React.ReactNode }) {
  return children;
}
