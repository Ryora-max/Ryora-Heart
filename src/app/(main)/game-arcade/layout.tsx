import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Game Arcade | Ryora",
  description: "Main game bareng pasangan LDR",
};

export default function GameArcadeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
