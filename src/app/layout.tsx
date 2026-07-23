import type { Metadata } from "next";
import { Sora, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuroraBackground } from "@/components/home/AuroraBackground";
import Loader from "@/components/animations/Loader";
import { ServiceWorkerRegistrar } from "@/components/pwa/ServiceWorkerRegistrar";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "RYORA | HeartSync • Our Home",
  description: "A private digital home for two hearts in love",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${sora.variable} ${jakarta.variable} h-full antialiased`}>
      <body className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
      <AuroraBackground />
      <Loader />
      <ServiceWorkerRegistrar />
      <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
