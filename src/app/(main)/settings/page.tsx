"use client";

import { useState, useEffect } from "react";
import { LogOut, Moon, Sun, Heart } from "lucide-react";
import { useAuthStore } from "@/stores";
import { APP_CONFIG } from "@/config";
import { useTheme } from "@/hooks";

type Theme = "dark" | "light" | "aurora";

export default function SettingsPage() {
  const { user, logout, token } = useAuthStore();
  const { theme, changeTheme } = useTheme();
  const [name, setName] = useState(user?.name || "");
  const [relationship, setRelationship] = useState(user?.relationship || "");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async () => {
    if (!user || !token) return;
    setSaving(true);
    try {
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateProfile", token, data: { name, relationship } }),
      });
      const updatedUser = { ...user, name, relationship };
      useAuthStore.getState().setUser(updatedUser);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      console.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { getSupabaseBrowser } = await import("@/lib/supabase/client");
      const supabase = getSupabaseBrowser();
      await supabase.auth.signOut();
    } catch {}
    logout();
  };

  return (
    <div className="page-bg p-4 md:p-8 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 pt-4">
          <h1 className="text-gradient-primary text-3xl md:text-4xl font-bold mb-2">
            ⚙️ Settings
          </h1>
          <p className="text-body text-sm">Atur profil & preferensi</p>
        </div>

        {/* Profile */}
        <div className="surface-card p-5 mb-5">
          <h3 className="text-heading text-lg font-bold mb-4 flex items-center gap-2">
            <Heart size={18} className="text-primary" /> Profile
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-body text-sm block mb-2">Nama</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-soft w-full px-4 py-3"
              />
            </div>
            <div>
              <label className="text-body text-sm block mb-2">Relationship</label>
              <input
                type="text"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                className="input-soft w-full px-4 py-3"
              />
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="touch-target touch-press w-full py-2.5 rounded-xl text-white font-bold transition-all shadow-lg disabled:opacity-50"
              style={{ background: "linear-gradient(to right, var(--primary), var(--secondary))" }}
            >
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
            {saveSuccess && (
              <p className="text-accent text-xs text-center">✓ Profile tersimpan</p>
            )}
          </div>
        </div>

        {/* Theme */}
        <div className="surface-card p-5 mb-5">
          <h3 className="text-heading text-lg font-bold mb-4">Tema</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "dark", label: "Dark", icon: <Moon size={18} /> },
              { value: "light", label: "Light", icon: <Sun size={18} /> },
              { value: "aurora", label: "Aurora", icon: <Heart size={18} /> },
            ].map((t) => (
              <button
                key={t.value}
                onClick={() => changeTheme(t.value as Theme)}
                className="touch-target touch-press p-3 rounded-xl border-2 transition-all cursor-pointer flex flex-col items-center gap-2"
                style={{
                  background: theme === t.value ? "var(--primary-soft)" : "var(--surface-warm)",
                  borderColor: theme === t.value ? "var(--primary)" : "var(--border)",
                  color: theme === t.value ? "var(--primary)" : "var(--text-secondary)",
                }}
              >
                {t.icon}
                <span className="text-xs font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="touch-target touch-press w-full py-3 rounded-xl border-2 text-red-500 transition-all cursor-pointer flex items-center justify-center gap-2 font-medium"
          style={{ borderColor: "color-mix(in srgb, #ef4444 30%, transparent)", background: "color-mix(in srgb, #ef4444 5%, transparent)" }}
        >
          <LogOut size={18} />
          Logout
        </button>

        <div className="mt-8 text-center pb-4">
          <p className="text-muted text-xs">{APP_CONFIG.name} • {APP_CONFIG.subtitle}</p>
        </div>
      </div>
    </div>
  );
}
