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
    <div className="page-bg flex items-center justify-center p-4 safe-area-inset min-h-dvh">
      {/* Ambient hearts */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <span className="absolute top-[14%] right-[16%] text-2xl animate-float-soft opacity-30">💗</span>
        <span className="absolute bottom-[20%] left-[14%] text-xl animate-float-soft opacity-25" style={{ animationDelay: "1.4s" }}>💜</span>
      </div>

      <div className="login-card animate-scale-soft w-full max-w-md relative z-10">
        <div className="surface-card p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-3 animate-breathe">💝</div>
            <h1 className="text-3xl font-extrabold mb-1">
              <span className="text-gradient-primary">{APP_CONFIG.name}</span>
            </h1>
            <p className="text-xs text-body font-medium">{APP_CONFIG.subtitle}</p>
          </div>

          {!selectedRole ? (
            <div className="space-y-3">
              {(["owner", "partner"] as const).map((role, idx) => (
                <MagneticButton key={role}>
                  <button
                    onClick={() => handleSelectRole(role)}
                    className="login-option animate-slide-up-soft touch-press w-full p-4 rounded-2xl border transition-all cursor-pointer group touch-target bg-surface-warm border-border hover:border-primary/50 hover:shadow-soft-hover"
                    style={{ animationDelay: `${0.2 + idx * 0.1}s` }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform"
                        style={{ background: "var(--gradient-primary)" }}
                      >
                        {role === "owner" ? "🤴" : "👸"}
                      </div>
                      <div className="text-left flex-1">
                        <h2 className="font-bold text-heading text-base">{APP_CONFIG.users[role].name}</h2>
                        <p className="text-xs text-muted">@{APP_CONFIG.users[role].username}</p>
                      </div>
                      <span className="text-muted group-hover:text-primary group-hover:translate-x-1 transition-all">→</span>
                    </div>
                  </button>
                </MagneticButton>
              ))}
            </div>
          ) : (
            <div className={`space-y-4 ${shake ? "animate-shake" : ""}`}>
              <button
                onClick={() => { setSelectedRole(null); setPassword(""); setError(""); }}
                className="touch-target text-body hover:text-heading text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                ← Pilih Profil Lain
              </button>

              <div className="flex items-center gap-3 p-3.5 rounded-2xl border border-border bg-surface-warm">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  {selectedRole === "owner" ? "🤴" : "👸"}
                </div>
                <div>
                  <h2 className="font-bold text-heading text-base">{APP_CONFIG.users[selectedRole].name}</h2>
                  <p className="text-xs text-muted">@{APP_CONFIG.users[selectedRole].username}</p>
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-bold text-body mb-1.5 text-center"
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
                  className="input-soft w-full px-4 py-3 text-center text-lg tracking-wider font-mono"
                  placeholder="Masukkan password 💝"
                  autoFocus
                />
              </div>

              {error && <p className="text-rose-500 text-xs font-bold text-center animate-pulse">{error}</p>}

              <MagneticButton>
                <button
                  onClick={handleLogin}
                  disabled={!password || loading}
                  className="btn-gradient touch-target touch-press w-full py-3.5 rounded-2xl text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
