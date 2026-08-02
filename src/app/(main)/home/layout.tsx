import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rumah Kita | Ryora",
  description: "Rumah virtual untuk pasangan LDR",
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
