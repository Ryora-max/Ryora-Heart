"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { APP_CONFIG } from "@/config";
import { useAuthStore } from "@/stores";
import { useLiveLocation, usePartnerId } from "@/hooks/useDatabase";
import type { LiveLocation } from "@/types";

// Fix default marker icon (Leaflet has issues with bundlers)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom colored icons for the two users
const ownerIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="background: var(--primary, #e11d48); width: 28px; height: 28px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><span style="transform: rotate(45deg); font-size: 14px;">🤴</span></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

const partnerIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="background: var(--secondary, #f43f5e); width: 28px; height: 28px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;"><span style="transform: rotate(45deg); font-size: 14px;">👸</span></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

// Default center: Indonesia
const DEFAULT_CENTER: [number, number] = [-2.5, 118];
const DEFAULT_ZOOM = 5;

// ─── Haversine distance (km) ──────────────────────────────────
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function formatTime(date?: Date): string {
  if (!date) return "—";
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Auto-fit bounds component ────────────────────────────────
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.setView(points[0], 13, { animate: true });
      return;
    }
    const bounds = L.latLngBounds(points);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  }, [points, map]);

  return null;
}

export default function MapPage() {
  const { user, token } = useAuthStore();
  const { locations, loading, updateLocation } = useLiveLocation(token || "");
  const { partnerId } = usePartnerId(token || "", user?.id);

  const [mounted] = useState(() => typeof window !== "undefined");
  const [updating, setUpdating] = useState(false);
  const [watching, setWatching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  // Resolve user names
  const ownerName = APP_CONFIG.users.owner.name;
  const partnerName = APP_CONFIG.users.partner.name;

  const myLocation = useMemo(
    () => locations.find((l) => l.userId === user?.id),
    [locations, user?.id]
  );
  const partnerLocation = useMemo(
    () => locations.find((l) => l.userId === partnerId),
    [locations, partnerId]
  );

  // Build marker points + list
  const markers = useMemo(() => {
    const list: {
      location: LiveLocation;
      name: string;
      isOwner: boolean;
      position: [number, number];
    }[] = [];
    if (myLocation && myLocation.lat != null && myLocation.lng != null) {
      list.push({
        location: myLocation,
        name: user?.role === "partner" ? partnerName : ownerName,
        isOwner: user?.role !== "partner",
        position: [myLocation.lat, myLocation.lng],
      });
    }
    if (
      partnerLocation &&
      partnerLocation.lat != null &&
      partnerLocation.lng != null
    ) {
      list.push({
        location: partnerLocation,
        name: user?.role === "partner" ? ownerName : partnerName,
        isOwner: user?.role === "partner",
        position: [partnerLocation.lat, partnerLocation.lng],
      });
    }
    return list;
  }, [myLocation, partnerLocation, user?.role, ownerName, partnerName]);

  const markerPoints = useMemo(
    () => markers.map((m) => m.position),
    [markers]
  );

  // Distance + travel time
  const distanceInfo = useMemo(() => {
    if (
      !myLocation?.lat ||
      !myLocation?.lng ||
      !partnerLocation?.lat ||
      !partnerLocation?.lng
    ) {
      return null;
    }
    const km = haversineDistance(
      myLocation.lat,
      myLocation.lng,
      partnerLocation.lat,
      partnerLocation.lng
    );
    const travelHours = km / 60; // rough estimate 60 km/h
    const travelMin = Math.round(travelHours * 60);
    let travelLabel: string;
    if (travelMin < 60) {
      travelLabel = `${travelMin} menit`;
    } else {
      const h = Math.floor(travelMin / 60);
      const m = travelMin % 60;
      travelLabel = m > 0 ? `${h} jam ${m} menit` : `${h} jam`;
    }
    return { km, travelLabel };
  }, [myLocation, partnerLocation]);

  // ─── GPS handlers ───────────────────────────────────────────
  const handleGeolocationError = useCallback((err: GeolocationPositionError) => {
    let msg = "Gagal mendapatkan lokasi";
    if (err.code === err.PERMISSION_DENIED) {
      msg = "Izin lokasi ditolak. Aktifkan permission di browser.";
    } else if (err.code === err.POSITION_UNAVAILABLE) {
      msg = "Lokasi tidak tersedia. Coba lagi di tempat terbuka.";
    } else if (err.code === err.TIMEOUT) {
      msg = "Timeout. Gagal mendapatkan lokasi.";
    }
    setError(msg);
  }, []);

  const handleUpdateLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError("Geolocation tidak didukung browser ini");
      return;
    }
    setUpdating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        updateLocation({
          place: "Lokasi saat ini",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setUpdating(false);
      },
      (err) => {
        handleGeolocationError(err);
        setUpdating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [updateLocation, handleGeolocationError]);

  const toggleWatch = useCallback(() => {
    if (watching) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setWatching(false);
      return;
    }
    if (!navigator.geolocation) {
      setError("Geolocation tidak didukung browser ini");
      return;
    }
    setError(null);
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        updateLocation({
          place: "Lokasi live",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (err) => {
        handleGeolocationError(err);
        setWatching(false);
        if (watchIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchIdRef.current);
          watchIdRef.current = null;
        }
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 5000 }
    );
    watchIdRef.current = id;
    setWatching(true);
  }, [watching, updateLocation, handleGeolocationError]);

  // Location cards data
  const locationCards = useMemo(() => {
    const cards: {
      name: string;
      emoji: string;
      location?: LiveLocation;
    }[] = [
      {
        name: ownerName,
        emoji: "🤴",
        location: locations.find((l) => l.userId === user?.id && user?.role === "owner")
          || locations.find((l) => l.userId === partnerId && user?.role === "partner"),
      },
      {
        name: partnerName,
        emoji: "👸",
        location: locations.find((l) => l.userId === partnerId && user?.role === "owner")
          || locations.find((l) => l.userId === user?.id && user?.role === "partner"),
      },
    ];
    return cards;
  }, [locations, user?.id, user?.role, partnerId, ownerName, partnerName]);

  return (
    <div className="page-bg min-h-screen safe-area-inset">
      <div className="mx-auto max-w-2xl px-4 pt-6 pb-10">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-gradient-primary text-3xl font-bold mb-1">
            🗺️ Peta Kita
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Lokasi live kamu &amp; pasangan
          </p>
        </div>

        {/* Map */}
        <div
          className="surface-card overflow-hidden mb-4"
          style={{
            height: "70vh",
            borderRadius: 20,
            border: "1px solid var(--border)",
          }}
        >
          {mounted && typeof window !== "undefined" ? (
            <MapContainer
              center={DEFAULT_CENTER}
              zoom={DEFAULT_ZOOM}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {markers.map((m, idx) => (
                <Marker
                  key={`${m.location.userId}-${idx}`}
                  position={m.position}
                  icon={m.isOwner ? ownerIcon : partnerIcon}
                >
                  <Popup>
                    <div style={{ minWidth: 160 }}>
                      <div style={{ fontWeight: 700, marginBottom: 4 }}>
                        {m.isOwner ? "🤴" : "👸"} {m.name}
                      </div>
                      <div style={{ fontSize: 13, color: "#555" }}>
                        📍 {m.location.place}
                      </div>
                      <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                        🕐 {formatTime(m.location.updatedAt)}
                      </div>
                      {m.location.accuracy != null && (
                        <div style={{ fontSize: 12, color: "#888" }}>
                          🎯 ±{Math.round(m.location.accuracy)}m
                        </div>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
              <FitBounds points={markerPoints} />
            </MapContainer>
          ) : (
            <div
              className="flex items-center justify-center h-full"
              style={{ color: "var(--text-secondary)" }}
            >
              Memuat peta...
            </div>
          )}
        </div>

        {/* Location cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {locationCards.map((card) => (
            <div
              key={card.name}
              className="surface-card p-4"
              style={{ borderRadius: 16, border: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{card.emoji}</span>
                <h3
                  className="font-semibold text-sm"
                  style={{ color: "var(--text-primary)" }}
                >
                  {card.name}
                </h3>
              </div>
              {card.location ? (
                <div className="space-y-1">
                  <p
                    className="text-sm font-medium"
                    style={{ color: "var(--text-primary)" }}
                  >
                    📍 {card.location.place}
                  </p>
                  {card.location.lat != null && card.location.lng != null && (
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {card.location.lat.toFixed(5)},{" "}
                      {card.location.lng.toFixed(5)}
                    </p>
                  )}
                  <p
                    className="text-xs"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    🕐 {formatTime(card.location.updatedAt)}
                  </p>
                  {card.location.accuracy != null && (
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      🎯 ±{Math.round(card.location.accuracy)}m
                    </p>
                  )}
                </div>
              ) : (
                <p
                  className="text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Belum ada lokasi
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Distance card */}
        <div
          className="surface-card p-4 mb-4"
          style={{ borderRadius: 16, border: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">📏</span>
            <h3
              className="font-semibold text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              Jarak &amp; Estimasi
            </h3>
          </div>
          {distanceInfo ? (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p
                  className="text-2xl font-bold text-gradient-primary"
                >
                  {distanceInfo.km < 1
                    ? `${Math.round(distanceInfo.km * 1000)} m`
                    : `${distanceInfo.km.toFixed(1)} km`}
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Jarak lurus
                </p>
              </div>
              <div className="text-right">
                <p
                  className="text-lg font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  🚗 {distanceInfo.travelLabel}
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Estimasi (~60 km/h)
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {loading
                ? "Memuat data lokasi..."
                : "Butuh lokasi kedua user untuk menghitung jarak"}
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div
            className="p-3 rounded-xl mb-4 text-sm"
            style={{
              background: "var(--surface-warm)",
              border: "1px solid var(--border)",
              color: "var(--primary)",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleUpdateLocation}
            disabled={updating}
            className="touch-target touch-press flex-1 py-3 px-4 rounded-2xl font-semibold transition-all disabled:opacity-50"
            style={{
              background: "var(--primary)",
              color: "white",
              border: "none",
            }}
          >
            {updating ? "📡 Mendapatkan lokasi..." : "📍 Update Lokasi"}
          </button>

          <button
            onClick={toggleWatch}
            className="touch-target touch-press flex-1 py-3 px-4 rounded-2xl font-semibold transition-all"
            style={{
              background: watching ? "var(--secondary)" : "var(--surface)",
              color: watching ? "white" : "var(--text-primary)",
              border: `1px solid var(--border)`,
            }}
          >
            {watching ? "⏹️ Stop Watch GPS" : "👁️ Watch GPS"}
          </button>
        </div>

        {watching && (
          <p
            className="text-xs text-center mt-2"
            style={{ color: "var(--text-secondary)" }}
          >
            🟢 GPS live aktif — lokasi diupdate otomatis
          </p>
        )}
      </div>
    </div>
  );
}
