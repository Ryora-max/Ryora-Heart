"use client";

import { useState, useEffect } from "react";
import { Bell, Shield, Database, LogOut, Moon, Sun } from "lucide-react";
import { useAuthStore } from "@/stores";
import { APP_CONFIG } from "@/config";
import { ProfilePictureUpload } from "@/components/ui/ProfilePictureUpload";
import { LdrBanner } from "@/components/ldr/LdrBanner";
import { useTheme } from "@/hooks";
import { GuideModal } from "@/components/ui/GuideModal";
import { BackToHouseButton } from "@/components/house/BackToHouseButton";
import { showToast } from "@/hooks/useToast";

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
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [relationship, setRelationship] = useState(user?.relationship || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || "");
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    try {
      const stored = localStorage.getItem("ryora-settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {}
    return DEFAULT_SETTINGS;
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [nameError, setNameError] = useState("");
  const [relationshipError, setRelationshipError] = useState("");

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

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const prev = settings;
    const next = { ...prev, [key]: value };
    setSettings(next);
    if (key === "secretPin" && typeof window !== "undefined") {
      localStorage.setItem("ryora-secret-pin", value);
    }
    if (typeof window !== "undefined") {
      localStorage.setItem("ryora-settings", JSON.stringify(next));
    }

    if (token) {
      (async () => {
        try {
          setSaveError(null);
          const res = await fetch("/api/db", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "updateSettings", token, data: { [key]: value } }),
          });
          if (!res.ok) throw new Error("Gagal menyimpan");
        } catch {
          setSaveError("Gagal menyimpan pengaturan");
        }
      })();
    }
  };

  const handleSave = async () => {
    if (!user || !token) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    setNameError("");
    setRelationshipError("");

    if (!name.trim()) {
      setNameError("Nama wajib diisi");
      setSaving(false);
      return;
    }
    if (!relationship.trim()) {
      setRelationshipError("Status hubungan wajib diisi");
      setSaving(false);
      return;
    }

    try {
      await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateProfile", token, data: { name, relationship, avatar_url: avatarUrl } }),
      });
      const updatedUser = { ...user, name, relationship, avatar_url: avatarUrl };
      useAuthStore.getState().setUser(updatedUser);
      setSaveSuccess("Profil berhasil disimpan!");
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch {
      setSaveError("Gagal menyimpan profil");
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
      <BackToHouseButton />
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-600 to-slate-600 bg-clip-text text-transparent mb-2">
            ⚙️ Pengaturan
          </h1>
          <p className="text-gray-600/70">Kelola preferensi kamu</p>
        </div>

        <LdrBanner tagline="Setting LDR: notifikasi prioritas = chat doi. 🔔💞" />

         <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-6 border-2 border-gray-200 shadow-xl">
           <h3 className="text-xl font-bold text-gray-900 mb-4">Profil</h3>
           <div className="flex flex-col items-start gap-4">
             <ProfilePictureUpload currentUrl={avatarUrl} onUpload={setAvatarUrl} />
             <div className="flex-1 space-y-4 w-full">
               <div>
                 <label className="text-gray-600 text-sm block mb-2">Nama</label>
                 <input
                   type="text"
                   value={name}
                   onChange={(e) => { setName(e.target.value); setNameError(""); }}
                   className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gray-400 focus:outline-none text-gray-900"
                 />
                {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
              </div>
              <div>
                <label className="text-gray-600 text-sm block mb-2">Status Hubungan</label>
                <input
                  type="text"
                  value={relationship}
                  onChange={(e) => { setRelationship(e.target.value); setRelationshipError(""); }}
                  className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-gray-400 focus:outline-none text-gray-900"
                />
                {relationshipError && <p className="text-red-500 text-xs mt-1">{relationshipError}</p>}
              </div>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-gray-500 to-slate-600 text-white font-bold hover:from-gray-600 hover:to-slate-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
                {saveError && (
                  <p className="text-red-500 text-xs mt-2 text-center">Gagal menyimpan profil</p>
                )}
                {saveSuccess && (
                  <p className="text-green-600 text-xs mt-2 text-center">Profil berhasil disimpan!</p>
                )}
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border-2 border-gray-200 shadow-xl">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Tampilan</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { value: "dark", label: "Gelap", icon: <Moon size={18} /> },
              { value: "light", label: "Terang", icon: <Sun size={18} /> },
              { value: "aurora", label: "Aurora", icon: <Sun size={18} /> },
             ].map((t, i) => (
                <button
                  key={t.value}
                  onClick={() => changeTheme(t.value as Theme)}
                  className={`settings-item animate-fade-in-left p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 min-h-[44px] ${theme === t.value ? "border-gray-400 bg-gray-100" : "border-gray-200 hover:border-gray-300"}`}
                  style={{ animationDelay: `${i * 0.1}s` }}
               >
                <div className={theme === t.value ? "text-gray-700" : "text-gray-400"}>{t.icon}</div>
                <span className="text-gray-800 font-medium">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

         <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-6 border-2 border-gray-200 shadow-xl">
           <h3 className="text-xl font-bold text-gray-900 mb-4">Hubungan</h3>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
             <div>
               <label className="text-gray-600 text-sm block mb-2">Tanggal Jadian</label>
               <input
                 type="date"
                 value={settings.relationshipStartDate}
                 onChange={(e) => updateSetting("relationshipStartDate", e.target.value)}
                 className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gray-400 focus:outline-none text-gray-900 text-sm"
               />
             </div>
             <div>
               <label className="text-gray-600 text-sm block mb-2">Jarak (KM)</label>
               <input
                 type="number"
                 value={settings.distance}
                 onChange={(e) => updateSetting("distance", e.target.value)}
                 placeholder="e.g. 1200"
                 className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gray-400 focus:outline-none text-gray-900 text-sm"
               />
             </div>
             <div>
               <label className="text-gray-600 text-sm block mb-2">Tanggal Ketemu Lagi</label>
               <input
                 type="date"
                 value={settings.nextMeetupDate}
                 onChange={(e) => updateSetting("nextMeetupDate", e.target.value)}
                 className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gray-400 focus:outline-none text-gray-900 text-sm"
               />
             </div>
             <div>
               <label className="text-gray-600 text-sm block mb-2">PIN Secret Box</label>
               <input
                 type="password"
                 maxLength={4}
                 value={settings.secretPin}
                 onChange={(e) => updateSetting("secretPin", e.target.value.replace(/\D/g, "").slice(0, 4))}
                 placeholder="****"
                 className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gray-400 focus:outline-none text-gray-900 text-sm tracking-widest"
               />
             </div>
           </div>
           <button
             onClick={() => {
               if (token) {
                 fetch("/api/db", {
                   method: "POST",
                   headers: { "Content-Type": "application/json" },
                   body: JSON.stringify({ action: "updateSettings", token, data: settings }),
                 }).then(() => {
                   showToast("Pengaturan hubungan disimpan!", "success");
                 }).catch(() => {
                   showToast("Gagal menyimpan pengaturan", "error");
                 });
               }
             }}
             className="w-full mt-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold hover:from-pink-600 hover:to-rose-600 transition-all shadow-lg cursor-pointer"
           >
             Simpan Pengaturan Hubungan
           </button>
         </div>

        <div className="space-y-3 mb-6">
          {[
            { icon: <Bell size={20} />, label: "Notifikasi", description: "Atur peringatan", action: () => {
              if (typeof window !== "undefined" && "Notification" in window) {
                if (Notification.permission === "default") {
                  Notification.requestPermission().then((p) => {
                    showToast(p === "granted" ? "Notifikasi diaktifkan!" : "Notifikasi diblokir", p === "granted" ? "success" : "error");
                  });
                } else {
                  showToast(`Notifikasi: ${Notification.permission === "granted" ? "aktif" : "diblokir"}`, "info");
                }
              } else {
                showToast("Browser tidak support notifikasi", "error");
              }
            }},
            { icon: <Shield size={20} />, label: "Privasi & Keamanan", description: "Kontrol data kamu", action: () => {
              showToast("Data kamu terenkripsi & hanya bisa diakses dengan token kamu", "info");
            }},
            { icon: <Database size={20} />, label: "Manajemen Data", description: "Ekspor atau hapus data", action: () => {
              if (confirm("Hapus semua data lokal (cache, settings)? Data server tidak terhapus.")) {
                localStorage.clear();
                sessionStorage.clear();
                showToast("Data lokal dibersihkan. Halaman akan reload...", "success");
                setTimeout(() => window.location.reload(), 1500);
              }
            }},
          ].map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className="settings-item animate-fade-in-left w-full bg-white/80 backdrop-blur-sm p-4 rounded-xl border-2 border-gray-200 flex items-center gap-4 transition-all hover:border-gray-300 hover:bg-gray-50 cursor-pointer text-left"
              style={{ animationDelay: `${0.3 + i * 0.1}s` }}
            >
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">{item.icon}</div>
              <div className="flex-1">
                <span className="text-gray-800 font-medium block">{item.label}</span>
                <span className="text-gray-500 text-sm">{item.description}</span>
              </div>
              <span className="text-gray-400">→</span>
            </button>
          ))}
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 mb-6 border-2 border-amber-200 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
                <Bell size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Buku Panduan 📘</h3>
                <p className="text-xs text-gray-500">Panduan lengkap notifikasi, status online & fitur LDR</p>
              </div>
            </div>
            <button
              onClick={() => setIsGuideOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-md cursor-pointer min-h-[44px]"
            >
              Buka Panduan
            </button>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-xl border-2 border-red-200 text-red-500 hover:bg-red-50 transition-all cursor-pointer flex items-center justify-center gap-2 font-medium min-h-[44px]"
        >
          <LogOut size={18} />
          Keluar
        </button>

        <GuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">{APP_CONFIG.name} • {APP_CONFIG.subtitle}</p>
        </div>
      </div>
    </div>
  );
}
