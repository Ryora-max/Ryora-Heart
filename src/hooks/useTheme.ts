"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light" | "aurora";

export function useTheme() {
  // Init "dark" di SSR & client render pertama agar tidak ada hydration
  // mismatch — nilai sebenarnya dibaca deferred dari data-theme (yang sudah
  // di-set inline script di <head> sebelum first paint) atau localStorage.
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const t = setTimeout(() => {
      const attr = document.documentElement.getAttribute("data-theme");
      const stored = (() => {
        try {
          return localStorage.getItem("ryora-theme");
        } catch {
          return null;
        }
      })();
      const next = attr === "light" || attr === "aurora" ? attr : stored === "light" || stored === "aurora" ? stored : "dark";
      setTheme(next);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  const changeTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("ryora-theme", newTheme);
  };

  return { theme, changeTheme };
}

