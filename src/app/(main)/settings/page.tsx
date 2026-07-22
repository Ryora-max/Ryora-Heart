"use client";

import { useState, useEffect } from "react";
import { Bell, Shield, Database, LogOut, Moon, Sun } from "lucide-react";
import { useAuthStore } from "@/stores";
import { APP_CONFIG } from "@/config";
import { ProfilePictureUpload } from "@/components/ui/ProfilePictureUpload";
import { LdrBanner } from "@/components/ldr/LdrBanner";
import { useTheme } from "@/hooks";

type Theme = "dark" | "light" | "aurora";

interface Settings {
  relationshipStartDate: string;
  distance: string;
  nextMeetupDate: string;
  secretPin: string;
}

const DEFAULT_SETTINGS: Settings = {
  relationshipStartDate: APP_CONFIG.relationship.startDate,
  distance: "",
  nextMeetupDate: "",
  secretPin: "0101",
};

export default function SettingsPage() {
  const { user, logout, token } = useAuthStore();
  const { theme, changeTheme } = useTheme();
  const [name, setName] = useState(user?.name || "");
  const [relationship, setRelationship] = useState(user?.relationship || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getUserSettings", token }),
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          setSettings({ ...DEFAULT_SETTINGS, ...data });
        }
      })
      .catch(() => {});
  }, [token]);

  const updateSetting = async <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      if (token) {
        (async () => {
          try {
            setSaveError(null);
            const res = await fetch("/api/db", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "updateSettings", token, data: next }),
            });
            if (!res.ok) throw new Error("Failed to save");
          } catch {
            setSaveError("Failed to save setting");
          }
        })();
      }
      if (key === "secretPin" && typeof window !== "undefined") {
        localStorage.setItem("ryora-secret-pin", value);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!user || !token) return;
    setSaving(true);
    setSaveError(null);
    try {
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateProfile", token, data: { name, relationship, avatar_url: avatarUrl } }),
      });
      const updatedUser = { ...user, name, relationship, avatar_url: avatarUrl };
      useAuthStore.getState().setUser(updatedUser);
    } catch {
      setSaveError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout", token }),
      });
    }
    logout();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-slate-100 to-zinc-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-600 to-slate-600 bg-clip-text text-transparent mb-2">
            ⚙️ Settings
          </h1>
          <p className="text-gray-600/70">Manage your preferences</p>
        </div>

        <LdrBanner tagline="Setting LDR: notifikasi prioritas = chat doi. 🔔💞" />

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border-2 border-gray-200 shadow-xl">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Profile</h3>
          <div className="flex flex-col md:flex-row items-start gap-6">
            <ProfilePictureUpload currentUrl={avatarUrl} onUpload={setAvatarUrl} />
            <div className="flex-1 space-y-4 w-full">
              <div>
                <label className="text-gray-600 text-sm block mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-gray-400 focus:outline-none text-gray-900"
                />
              </div>
              <div>
                <label className="text-gray-600 text-sm block mb-2">Relationship</label>
                <input
                  type="text"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-gray-400 focus:outline-none text-gray-900"
                />
              </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-gray-500 to-slate-600 text-white font-bold hover:from-gray-600 hover:to-slate-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                {saveError && (
                  <p className="text-red-500 text-xs mt-2 text-center">{saveError}</p>
                )}
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border-2 border-gray-200 shadow-xl">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Appearance</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { value: "dark", label: "Dark", icon: <Moon size={18} /> },
              { value: "light", label: "Light", icon: <Sun size={18} /> },
              { value: "aurora", label: "Aurora", icon: <Sun size={18} /> },
             ].map((t, i) => (
               <button
                 key={t.value}
                 onClick={() => changeTheme(t.value as Theme)}
                 className={`settings-item animate-fade-in-left p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${theme === t.value ? "border-gray-400 bg-gray-100" : "border-gray-200 hover:border-gray-300"}`}
                 style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className={theme === t.value ? "text-gray-700" : "text-gray-400"}>{t.icon}</div>
                <span className="text-gray-800 font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border-2 border-gray-200 shadow-xl">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Relationship</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-600 text-sm block mb-2">Relationship Start Date</label>
              <input
                type="date"
                value={settings.relationshipStartDate}
                onChange={(e) => updateSetting("relationshipStartDate", e.target.value)}
                className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-gray-400 focus:outline-none text-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="text-gray-600 text-sm block mb-2">Distance (KM)</label>
              <input
                type="number"
                value={settings.distance}
                onChange={(e) => updateSetting("distance", e.target.value)}
                placeholder="e.g. 1200"
                className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-gray-400 focus:outline-none text-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="text-gray-600 text-sm block mb-2">Next Meetup Date</label>
              <input
                type="date"
                value={settings.nextMeetupDate}
                onChange={(e) => updateSetting("nextMeetupDate", e.target.value)}
                className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-gray-400 focus:outline-none text-gray-900 text-sm"
              />
            </div>
            <div>
              <label className="text-gray-600 text-sm block mb-2">Secret Box PIN</label>
              <input
                type="password"
                maxLength={4}
                value={settings.secretPin}
                onChange={(e) => updateSetting("secretPin", e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="****"
                className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-gray-400 focus:outline-none text-gray-900 text-sm tracking-widest"
              />
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {[
            { icon: <Bell size={20} />, label: "Notifications", description: "Manage alerts" },
            { icon: <Shield size={20} />, label: "Privacy & Security", description: "Control your data" },
            { icon: <Database size={20} />, label: "Data Management", description: "Export or clear data" },
          ].map((item, i) => (
            <div key={i} className="settings-item animate-fade-in-left bg-white/80 backdrop-blur-sm p-4 rounded-xl border-2 border-gray-200 flex items-center gap-4 cursor-pointer hover:border-gray-300 hover:shadow-lg transition-all" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">{item.icon}</div>
              <div className="flex-1">
                <span className="text-gray-800 font-medium block">{item.label}</span>
                <span className="text-gray-500 text-sm">{item.description}</span>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          ))}
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-xl border-2 border-red-200 text-red-500 hover:bg-red-50 transition-all cursor-pointer flex items-center justify-center gap-2 font-medium"
        >
          <LogOut size={18} />
          Logout
        </button>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">{APP_CONFIG.name} • {APP_CONFIG.subtitle}</p>
        </div>
      </div>
    </div>
  );
}
