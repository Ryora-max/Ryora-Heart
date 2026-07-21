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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-400">
      <div className="login-card animate-scale-in w-full max-w-md">
        <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4 animate-bounce">💝</div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent mb-2">
              {APP_CONFIG.name}
            </h1>
            <p className="text-purple-600/70 text-sm">{APP_CONFIG.subtitle}</p>
          </div>

          {!selectedRole ? (
            <div className="space-y-3">
              {(["owner", "partner"] as const).map((role, idx) => (
                <MagneticButton key={role}>
                <button
                  onClick={() => setSelectedRole(role)}
                  className="login-option animate-fade-in-left w-full p-4 rounded-2xl bg-gradient-to-r from-pink-100 to-purple-100 hover:from-pink-200 hover:to-purple-200 border-2 border-pink-200 hover:border-pink-300 transition-all cursor-pointer group"
                  style={{ animationDelay: `${0.3 + idx * 0.1}s` }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-4xl group-hover:scale-110 transition-transform">
                        {role === "owner" ? "🤴" : "👸"}
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold text-purple-900">{APP_CONFIG.users[role].name}</h3>
                        <p className="text-xs text-purple-600/70">@{APP_CONFIG.users[role].username}</p>
                      </div>
                    </div>
                  </button>
                </MagneticButton>
              ))}
            </div>
          ) : (
            <div className={`space-y-4 ${shake ? "animate-shake" : ""}`}>
              <button onClick={() => { setSelectedRole(null); setPassword(""); setError(""); }} className="text-purple-600/70 hover:text-purple-900 text-sm flex items-center gap-1">
                ← Back
              </button>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-pink-100 to-purple-100">
                <div className="text-3xl">{selectedRole === "owner" ? "🤴" : "👸"}</div>
                <div>
                  <h3 className="font-bold text-purple-900">{APP_CONFIG.users[selectedRole].name}</h3>
                  <p className="text-xs text-purple-600/70">@{APP_CONFIG.users[selectedRole].username}</p>
                </div>
              </div>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full px-4 py-3 rounded-xl border-2 border-pink-200 focus:border-purple-400 focus:outline-none text-center text-lg tracking-wider text-purple-900 placeholder-purple-300"
                placeholder="Enter password 💝"
                autoFocus
              />

              {error && <p className="text-red-500 text-sm text-center animate-pulse">{error}</p>}

              <MagneticButton>
                <button
                  onClick={handleLogin}
                  disabled={!password || loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
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
