import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | Ryora",
  description: "Pengaturan akun & preferensi",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
