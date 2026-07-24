"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { APP_CONFIG } from "@/config";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { useAuthStore } from "@/stores";

type Role = "owner" | "partner";

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
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          username: selectedRole === "owner" ? "Ryo" : "Ara",
          password,
        }),
      });

      const data = await response.json();

      if (response.ok && data.user) {
        setUser(data.user);
        setToken(data.token);
        router.push("/home");
      } else {
        setError("Password salah 😢");
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pink-200 via-purple-100 to-indigo-100">
      <div className="login-card animate-scale-soft w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-soft border border-border">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4 animate-breathe">💝</div>
            <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-purple-600 mb-2">
              {APP_CONFIG.name}
            </h1>
            <p className="text-text-secondary text-sm">{APP_CONFIG.subtitle}</p>
          </div>

          {!selectedRole ? (
            <div className="space-y-3">
              {(["owner", "partner"] as const).map((role, idx) => (
                <MagneticButton key={role}>
                <button
                  onClick={() => setSelectedRole(role)}
                  className="login-option animate-slide-up-soft w-full p-4 rounded-2xl bg-pink-50 hover:bg-pink-100 border-2 border-pink-100 hover:border-pink-200 transition-all cursor-pointer group"
                  style={{ animationDelay: `${0.3 + idx * 0.1}s` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-4xl group-hover:scale-110 transition-transform">
                        {role === "owner" ? "🤴" : "👸"}
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-text-primary">{APP_CONFIG.users[role].name}</h3>
                        <p className="text-xs text-text-secondary">@{APP_CONFIG.users[role].username}</p>
                      </div>
                    </div>
                  </button>
                </MagneticButton>
              ))}
            </div>
          ) : (
            <div className={`space-y-4 ${shake ? "animate-shake" : ""}`}>
              <button onClick={() => { setSelectedRole(null); setPassword(""); setError(""); }} className="text-text-secondary hover:text-text-primary text-sm flex items-center gap-1 transition-colors">
                ← Back
              </button>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-pink-50 border border-pink-100">
                <div className="text-3xl">{selectedRole === "owner" ? "🤴" : "👸"}</div>
                <div>
                  <h3 className="font-bold text-text-primary">{APP_CONFIG.users[selectedRole].name}</h3>
                  <p className="text-xs text-text-secondary">@{APP_CONFIG.users[selectedRole].username}</p>
                </div>
              </div>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full px-4 py-3 rounded-xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-center text-lg tracking-wider text-text-primary placeholder-pink-300 bg-white"
                placeholder="Enter password 💝"
                autoFocus
              />

              {error && <p className="text-red-500 text-sm text-center animate-pulse">{error}</p>}

              <MagneticButton>
                <button
                  onClick={handleLogin}
                  disabled={!password || loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-400 to-purple-400 text-white font-bold hover:from-pink-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-soft hover:shadow-soft-hover"
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
