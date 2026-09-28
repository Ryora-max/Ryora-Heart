"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light" | "aurora";

export function useTheme() {
  // Init "light" di SSR & client render pertama agar tidak ada hydration
  // mismatch — nilai sebenarnya dibaca deferred dari data-theme (yang sudah
  // di-set inline script di <head> sebelum first paint) atau localStorage.
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const t = setTimeout(() => {
      const attr = document.documentElement.getAttribute("data-theme");
      const stored = (() => {
        try {
          return localStorage.getItem("ryora-theme-v2");
        } catch {
          return null;
        }
      })();
      const next = attr === "dark" || attr === "aurora" ? attr : stored === "dark" || stored === "aurora" ? stored : "light";
      setTheme(next);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("ryora-theme-v2", newTheme);
  };

  return { theme, changeTheme };
}

