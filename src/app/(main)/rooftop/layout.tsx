import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rooftop | Ryora",
  description: "Kalender & harapan bintang di rooftop virtual",
};

export default function RooftopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
