"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
  return (
    <div className="page-bg min-h-dvh flex items-center justify-center">
      <p className="text-body">Memuat...</p>
    </div>
  );
}
