"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { APP_CONFIG } from "@/config";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { useAuthStore } from "@/stores";
import { getSupabaseBrowser } from "@/lib/supabase/client";

type Role = "owner" | "partner";

const ROLE_EMAILS: Record<Role, string> = {
  owner: "ryo@ryora.app",
  partner: "ara@ryora.app",
};

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const handleLogin = async () => {
    if (!selectedRole || !password) return;
    setError("");
    setLoading(true);

    try {
      // 1. Sign in dengan Supabase Auth
      const supabase = getSupabaseBrowser();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: ROLE_EMAILS[selectedRole],
        password,
      });

      if (authError || !authData.user) {
        setError("Password salah 😢");
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      }

      // 2. Ambil user profile dari /api/auth (yang baca Supabase session dari cookie)
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify" }),
      });

      const data = await response.json();

      if (response.ok && data.user) {
        setUser(data.user);
        setToken(authData.session?.access_token || "");
        router.push("/home");
      } else {
        setError("Gagal memuat profile. Coba lagi.");
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-bg flex items-center justify-center p-4 safe-area-inset">
      <div className="login-card animate-scale-soft w-full max-w-md">
        <div className="surface-card p-6 sm:p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4 animate-breathe">💝</div>
            <h1 className="text-gradient-primary text-4xl font-bold mb-2">
              {APP_CONFIG.name}
            </h1>
            <p className="text-body text-sm">{APP_CONFIG.subtitle}</p>
          </div>

          {!selectedRole ? (
            <div className="space-y-3">
              {(["owner", "partner"] as const).map((role, idx) => (
                <MagneticButton key={role}>
                <button
                  onClick={() => setSelectedRole(role)}
                  className="login-option animate-slide-up-soft touch-press w-full p-4 rounded-2xl border-2 transition-all cursor-pointer group touch-target"
                  style={{
                    animationDelay: `${0.3 + idx * 0.1}s`,
                    background: "var(--surface-warm)",
                    borderColor: "var(--border)",
                  }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-4xl group-hover:scale-110 transition-transform">
                        {role === "owner" ? "🤴" : "👸"}
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-heading">{APP_CONFIG.users[role].name}</h3>
                        <p className="text-xs text-body">@{APP_CONFIG.users[role].username}</p>
                      </div>
                    </div>
                  </button>
                </MagneticButton>
              ))}
            </div>
          ) : (
            <div className={`space-y-4 ${shake ? "animate-shake" : ""}`}>
              <button onClick={() => { setSelectedRole(null); setPassword(""); setError(""); }} className="touch-target text-body hover:text-primary text-sm flex items-center gap-1 transition-colors">
                ← Back
              </button>

              <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ background: "var(--surface-warm)", borderColor: "var(--border)" }}>
                <div className="text-3xl">{selectedRole === "owner" ? "🤴" : "👸"}</div>
                <div>
                  <h3 className="font-bold text-heading">{APP_CONFIG.users[selectedRole].name}</h3>
                  <p className="text-xs text-body">@{APP_CONFIG.users[selectedRole].username}</p>
                </div>
              </div>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="input-soft w-full px-4 py-3 text-center text-lg tracking-wider"
                placeholder="Enter password 💝"
                autoFocus
              />

              {error && <p className="text-red-500 text-sm text-center animate-pulse">{error}</p>}

              <MagneticButton>
                <button
                  onClick={handleLogin}
                  disabled={!password || loading}
                  className="touch-target touch-press w-full py-3 rounded-xl text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-soft hover:shadow-soft-hover"
                  style={{ background: "linear-gradient(to right, var(--primary), var(--secondary))" }}
                >
                  {loading ? "Loading..." : "Login 💕"}
                </button>
              </MagneticButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
