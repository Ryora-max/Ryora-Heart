"use client";

import { useState, useEffect } from "react";
import { LogOut, Moon, Sun, Heart, Calendar, Sparkles, Check, Bell, BellOff } from "lucide-react";
import { useAuthStore } from "@/stores";
import { APP_CONFIG } from "@/config";
import { useTheme, useUserSettings } from "@/hooks";
import { showToast } from "@/hooks/useToast";

/** Konversi VAPID public key (base64url) ke Uint8Array untuk pushManager.subscribe. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}


export default function SettingsPage() {
  const { user, logout, token } = useAuthStore();
  const { theme, changeTheme } = useTheme();
  const { settings, updateSettings } = useUserSettings(token || "");
  const [name, setName] = useState(user?.name || "");
  const [relationship, setRelationship] = useState(user?.relationship || "");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form pengaturan hubungan — init dari settings begitu fetch selesai.
  // null = belum disentuh user (tampilkan nilai settings mentah).
  const [startDate, setStartDate] = useState<string | null>(null);
  const [distanceKm, setDistanceKm] = useState<string | null>(null);
  const [meetupDate, setMeetupDate] = useState<string | null>(null);
  const [secretPin, setSecretPin] = useState<string | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Web Push — subscribe/unsubscribe via /api/push
  type PushState = "loading" | "unsupported" | "denied" | "off" | "on";
  const [pushState, setPushState] = useState<PushState>("loading");
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Deferred — browser API check tidak boleh sync-setState dalam effect.
    const t = setTimeout(() => {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (!cancelled) setPushState("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (!cancelled) setPushState("denied");
        return;
      }
      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => { if (!cancelled) setPushState(sub ? "on" : "off"); })
        .catch(() => { if (!cancelled) setPushState("off"); });
    }, 0);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  const handleTogglePush = async () => {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      showToast("Push belum dikonfigurasi (VAPID key missing)", "error");
      return;
    }
    setPushBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;

      if (pushState === "on") {
        const sub = await reg.pushManager.getSubscription();
        await sub?.unsubscribe();
        await fetch("/api/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "unsubscribe" }),
        }).catch(() => {});
        setPushState("off");
        showToast("Notifikasi push dimatikan", "info");
        return;
      }

      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setPushState("denied");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      });
      const res = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "subscribe", subscription: sub.toJSON() }),
      });
      if (!res.ok) throw new Error("subscribe failed");
      setPushState("on");
      showToast("Notifikasi push aktif 🔔", "success");
    } catch {
      showToast("Gagal mengatur notifikasi push", "error");
    } finally {
      setPushBusy(false);
    }
  };

  const startDateValue = startDate ?? settings?.relationshipStartDate ?? "";
  const distanceValue = distanceKm ?? settings?.distanceKm ?? "";
  const meetupValue = meetupDate ?? settings?.nextMeetupDate ?? "";
  const pinValue = secretPin ?? settings?.secretPin ?? "";

  const handleSave = async () => {
    if (!user || !token) return;
    setSaving(true);
    try {
      const res = await fetch("/api/db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateProfile", token, data: { name, relationship } }),
      });
      if (!res.ok) {
        showToast("Gagal menyimpan profile", "error");
        return;
      }
      const updatedUser = { ...user, name, relationship };
      useAuthStore.getState().setUser(updatedUser);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      console.error("Failed to save profile");
      showToast("Gagal menyimpan profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    if (secretPin !== null && secretPin !== "" && !/^\d{4}$/.test(secretPin)) {
      showToast("PIN harus 4 digit angka", "error");
      return;
    }
    setSettingsSaving(true);
    try {
      await updateSettings({
        relationshipStartDate: startDateValue || undefined,
        distanceKm: distanceValue || undefined,
        nextMeetupDate: meetupValue || undefined,
        secretPin: pinValue || undefined,
      });
    } finally {
      setSettingsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      const { getSupabaseBrowser } = await import("@/lib/supabase/client");
      const supabase = getSupabaseBrowser();
      await supabase.auth.signOut();
    } catch {}
    // Cookie sesi httpOnly hanya bisa di-clear server-side — kalau tidak,
    // proxy & session-restore langsung login-kan lagi user yang baru logout.
    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    } catch {}
    logout();
  };

  return (
    <div className="page-bg p-4 md:p-8 min-h-dvh">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8 pt-4">
          <h1 className="text-gradient-primary text-3xl md:text-4xl font-bold mb-2">
            ⚙️ Settings
          </h1>
          <p className="text-body text-sm">Atur profil & preferensi</p>
        </div>

        {/* Profile */}
        <div className="surface-card p-5 mb-5">
          <h2 className="text-heading text-lg font-bold mb-4 flex items-center gap-2">
            <Heart size={18} className="text-primary" /> Profile
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="settings-name" className="text-body text-sm block mb-2">Nama</label>
              <input
                id="settings-name"
                name="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-soft w-full px-4 py-3"
              />
            </div>
            <div>
              <label htmlFor="settings-relationship" className="text-body text-sm block mb-2">Relationship</label>
              <input
                id="settings-relationship"
                name="relationship"
                type="text"
                autoComplete="off"
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

        {/* Hubungan — tersinkron pair-level via user_settings */}
        <div className="surface-card p-5 mb-5">
          <h2 className="text-heading text-lg font-bold mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-primary" /> Hubungan
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="settings-start-date" className="text-body text-sm block mb-2">Tanggal Jadian</label>
              <input
                id="settings-start-date"
                name="relationship-start-date"
                type="date"
                value={startDateValue}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-soft w-full px-4 py-3"
              />
              <p className="text-text-muted text-xs mt-1.5">
                Dipakai untuk counter hari di dashboard & PIN kotak rahasia.
              </p>
            </div>
            <div>
              <label htmlFor="settings-distance" className="text-body text-sm block mb-2">Jarak (km)</label>
              <input
                id="settings-distance"
                name="distance-km"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={distanceValue}
                onChange={(e) => setDistanceKm(e.target.value)}
                placeholder="mis. 120"
                className="input-soft w-full px-4 py-3"
              />
            </div>
            <div>
              <label htmlFor="settings-meetup" className="text-body text-sm block mb-2">Tanggal Ketemu Berikutnya</label>
              <input
                id="settings-meetup"
                name="next-meetup-date"
                type="date"
                value={meetupValue}
                onChange={(e) => setMeetupDate(e.target.value)}
                className="input-soft w-full px-4 py-3"
              />
            </div>
            <div>
              <label htmlFor="settings-pin" className="text-body text-sm block mb-2">PIN Kotak Rahasia</label>
              <input
                id="settings-pin"
                name="secret-pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={4}
                value={pinValue}
                onChange={(e) => setSecretPin(e.target.value.replace(/\D/g, ""))}
                placeholder="4 digit"
                className="input-soft w-full px-4 py-3"
              />
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={settingsSaving}
              className="touch-target touch-press w-full py-2.5 rounded-xl text-white font-bold transition-all shadow-lg disabled:opacity-50"
              style={{ background: "linear-gradient(to right, var(--primary), var(--secondary))" }}
            >
              {settingsSaving ? "Menyimpan..." : "Simpan Pengaturan"}
            </button>
          </div>
        </div>

        {/* Theme */}
        <div className="surface-card p-5 mb-5">
          <h2 className="text-heading text-lg font-bold mb-4">Tema</h2>
          <div className="grid grid-cols-3 gap-3">
            {([
              {
                value: "light",
                label: "Light",
                icon: <Sun size={16} />,
                bg: "#FFF5F7",
                surface: "#FFFFFF",
                accent: "#E8A0BF",
                text: "#4A3F44",
              },
              {
                value: "dark",
                label: "Dark",
                icon: <Moon size={16} />,
                bg: "#1A1520",
                surface: "#241E28",
                accent: "#D4A0C0",
                text: "#F5F0F2",
              },
              {
                value: "aurora",
                label: "Aurora",
                icon: <Sparkles size={16} />,
                bg: "#0F0A14",
                surface: "#1A1225",
                accent: "#D4A0E8",
                text: "#F5F0F7",
              },
            ] as const).map((t) => {
              const active = theme === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => changeTheme(t.value)}
                  aria-pressed={active}
                  aria-label={`Tema ${t.label}`}
                  className="touch-target touch-press rounded-xl border-2 transition-all cursor-pointer overflow-hidden flex flex-col"
                  style={{
                    borderColor: active ? "var(--primary)" : "var(--border)",
                    boxShadow: active ? "0 0 0 3px color-mix(in srgb, var(--primary) 25%, transparent)" : "none",
                  }}
                >
                  {/* Mini preview — bg → surface card → accent bar */}
                  <div className="p-2 w-full" style={{ background: t.bg }}>
                    <div
                      className="rounded-md p-1.5 flex flex-col gap-1"
                      style={{ background: t.surface }}
                    >
                      <div className="h-1 w-3/4 rounded-full" style={{ background: t.text, opacity: 0.7 }} />
                      <div className="h-1 w-1/2 rounded-full" style={{ background: t.text, opacity: 0.35 }} />
                      <div className="h-1.5 w-2/3 rounded-full mt-0.5" style={{ background: t.accent }} />
                    </div>
                  </div>
                  <span
                    className="flex items-center justify-center gap-1 py-1.5 text-[11px] font-semibold w-full"
                    style={{
                      background: active ? "var(--primary-soft)" : "var(--surface-warm)",
                      color: active ? "var(--primary)" : "var(--text-secondary)",
                    }}
                  >
                    {t.icon}
                    {t.label}
                    {active && <Check size={12} aria-hidden="true" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Push Notifications */}
        <div className="surface-card p-5 mb-5">
          <h2 className="text-heading text-lg font-bold mb-1">Notifikasi Push</h2>
          <p className="text-body text-xs mb-4">
            Dapatkan kabar dari pasangan walau app tertutup — pesan chat, memo baru, dan pelukan sampai sebagai notifikasi HP.
          </p>
          <button
            type="button"
            onClick={handleTogglePush}
            disabled={pushBusy || pushState === "loading" || pushState === "unsupported" || pushState === "denied"}
            className="touch-target touch-press w-full py-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-center gap-2 font-medium disabled:opacity-60"
            style={{
              borderColor: pushState === "on" ? "var(--primary)" : "var(--border)",
              background: pushState === "on" ? "var(--primary-soft)" : "var(--surface-warm)",
              color: pushState === "on" ? "var(--primary)" : "var(--text-secondary)",
            }}
          >
            {pushState === "on" ? <Bell size={16} /> : <BellOff size={16} />}
            {pushBusy
              ? "Memproses..."
              : pushState === "on"
              ? "Push aktif — tap untuk matikan"
              : pushState === "denied"
              ? "Izin ditolak browser — aktifkan via settings browser"
              : pushState === "unsupported"
              ? "Browser tidak mendukung push"
              : pushState === "loading"
              ? "Memeriksa status..."
              : "Aktifkan notifikasi push"}
          </button>
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
