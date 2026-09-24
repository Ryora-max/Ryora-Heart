"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { APP_CONFIG } from "@/config";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { useAuthStore } from "@/stores";
import {
  getLocalProfile,
  sessionValueForRole,
  type LocalRole,
} from "@/lib/localAuth";

type Role = LocalRole;

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSelectRole = (role: Role) => {
    setSelectedRole(role);
    setPassword("");
    setError("");
  };

  const handleLogin = async () => {
    if (!selectedRole || !password) return;
    setError("");
    setLoading(true);

    try {
      // Verifikasi server-side — PIN tidak pernah ada di client bundle
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", role: selectedRole, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || "Password salah 😢");
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setLoading(false);
        return;
      }

      // Session cookie httpOnly sudah di-set server — sinkronkan store client
      setUser(data.user || getLocalProfile(selectedRole));
      setToken(sessionValueForRole(selectedRole));

      // Langsung masuk ke Dashboard Rumah Virtual
      router.push("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setError("Terjadi kendala. Coba lagi.");
      setLoading(false);
    }
  };

  return (
    <div className="landing-bg flex items-center justify-center p-4 safe-area-inset min-h-dvh">
      <div className="login-card animate-scale-soft w-full max-w-md">
        <div className="surface-card p-6 sm:p-8 rounded-3xl border border-amber-200/60 dark:border-amber-800/40 shadow-xl bg-white/90 dark:bg-surface/80 backdrop-blur-md">
          <div className="text-center mb-8">
            <div className="text-6xl mb-3 animate-breathe">💝</div>
            <h1 className="text-3xl font-extrabold text-amber-950 dark:text-amber-100 mb-1">
              {APP_CONFIG.name}
            </h1>
            <p className="text-xs text-amber-800 dark:text-amber-300/80 font-medium">{APP_CONFIG.subtitle}</p>
          </div>

          {!selectedRole ? (
            <div className="space-y-3">
              {(["owner", "partner"] as const).map((role, idx) => (
                <MagneticButton key={role}>
                  <button
                    onClick={() => handleSelectRole(role)}
                    className="login-option animate-slide-up-soft touch-press w-full p-4 rounded-2xl border-2 transition-all cursor-pointer group touch-target bg-amber-50/60 hover:bg-amber-100/80 dark:bg-white/5 dark:hover:bg-white/10 border-amber-200/80 dark:border-amber-800/40"
                    style={{ animationDelay: `${0.2 + idx * 0.1}s` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-4xl group-hover:scale-110 transition-transform">
                        {role === "owner" ? "🤴" : "👸"}
                      </div>
                      <div className="text-left flex-1">
                        <h2 className="font-bold text-amber-950 dark:text-amber-100 text-base">{APP_CONFIG.users[role].name}</h2>
                        <p className="text-xs text-amber-800/80 dark:text-amber-300/70">@{APP_CONFIG.users[role].username}</p>
                      </div>
                    </div>
                  </button>
                </MagneticButton>
              ))}
            </div>
          ) : (
            <div className={`space-y-4 ${shake ? "animate-shake" : ""}`}>
              <button
                onClick={() => { setSelectedRole(null); setPassword(""); setError(""); }}
                className="touch-target text-amber-800 hover:text-amber-950 dark:text-amber-300 dark:hover:text-amber-100 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                ← Pilih Profil Lain
              </button>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-amber-200/80 dark:border-amber-800/40 bg-amber-50/70 dark:bg-white/5">
                <div className="text-3xl">{selectedRole === "owner" ? "🤴" : "👸"}</div>
                <div>
                  <h2 className="font-bold text-amber-950 dark:text-amber-100 text-base">{APP_CONFIG.users[selectedRole].name}</h2>
                  <p className="text-xs text-amber-800 dark:text-amber-300/80">@{APP_CONFIG.users[selectedRole].username}</p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold text-amber-900 dark:text-amber-200 mb-1.5 text-center"
                >
                  Password Rumah Cinta
                </label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="w-full px-4 py-3 rounded-xl border border-amber-300 dark:border-amber-700/50 text-center text-lg tracking-wider bg-white dark:bg-surface-warm text-amber-950 dark:text-amber-100 font-mono shadow-inner focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Masukkan password 💝"
                  autoFocus
                />
              </div>

              {error && <p className="text-rose-600 text-xs font-bold text-center animate-pulse">{error}</p>}

              <MagneticButton>
                <button
                  onClick={handleLogin}
                  disabled={!password || loading}
                  className="touch-target touch-press w-full py-3.5 rounded-2xl text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg bg-gradient-to-r from-amber-600 via-rose-500 to-amber-600 cursor-pointer"
                >
                  {loading ? "Melangkah Masuk..." : "Masuk ke Rumah 💕"}
                </button>
              </MagneticButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
