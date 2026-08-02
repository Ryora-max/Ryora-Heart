import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Living Room | Ryora",
  description: "Chat & activities bareng pasangan di living room virtual",
};

export default function LivingRoomLayout({ children }: { children: React.ReactNode }) {
  return children;
}
