// RYORA Service Worker v3
// Strategies:
//   - Static assets (_next/static, fonts, icons): cache-first, immutable
//   - Navigation/HTML (pages): network-first, fallback to cache, then offline page
//   - Same-origin GET lainnya: stale-while-revalidate
//   - Cross-origin (Supabase, dll): network-only (tidak di-cache)

const VERSION = "v3";
const STATIC_CACHE = `ryora-static-${VERSION}`;
const PAGE_CACHE = `ryora-pages-${VERSION}`;
const RUNTIME_CACHE = `ryora-runtime-${VERSION}`;

const OFFLINE_URL = "/offline";

const PRECACHE_URLS = [
  "/",
  "/offline",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

// Asset statis Next.js + font Google + icon → cache-first
const STATIC_PATTERN = /^https?:\/\/[^/]+\/_next\/static\//;
const ICON_PATTERN = /^https?:\/\/[^/]+\/icon-\d+\.(png|svg|webp)$/;
const FONT_PATTERN = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;

// Origin Supabase (jangan di-cache)
const SUPABASE_PATTERN = /\.supabase\.co\//;

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // Pre-cache halaman offline dulu (paling penting), abaikan yang lain jika gagal
      await Promise.allSettled(
        PRECACHE_URLS.map(async (url) => {
          try {
            const res = await fetch(url, { cache: "reload" });
            if (res && res.ok) await cache.put(url, res.clone());
          } catch {
            /* ignore individual failures */
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith("ryora-") &&
              ![STATIC_CACHE, PAGE_CACHE, RUNTIME_CACHE].includes(key)
          )
          .map((key) => caches.delete(key))
      );
      // Klaim semua client supaya SW aktif langsung
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

function isStaticAsset(url) {
  return STATIC_PATTERN.test(url) || ICON_PATTERN.test(url) || FONT_PATTERN.test(url);
}

// Cache-first untuk asset statis
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const networkRes = await fetch(request);
    if (networkRes && networkRes.ok && networkRes.type === "basic") {
      cache.put(request, networkRes.clone());
    }
    return networkRes;
  } catch {
    return cached || Response.error();
  }
}

// Network-first untuk navigasi (HTML), fallback ke cache lalu offline page
async function networkFirstNavigation(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const networkRes = await fetch(request);
    if (networkRes && networkRes.ok) {
      cache.put(request, networkRes.clone());
    }
    return networkRes;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await cache.match(OFFLINE_URL);
    if (offline) return offline;
    return new Response(
      "<h1>Offline</h1><p>Ryora butuh koneksi internet. Coba lagi nanti.</p>",
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}

// Stale-while-revalidate untuk GET same-origin lain
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((networkRes) => {
      if (networkRes && networkRes.ok && networkRes.type === "basic") {
        cache.put(request, networkRes.clone());
      }
      return networkRes;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Hanya tangani GET
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Cross-origin Supabase → network-only (jangan intercept)
  if (SUPABASE_PATTERN.test(url.href)) return;

  // Navigasi (HTML page request)
  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  // Asset statis → cache-first
  if (isStaticAsset(url.href)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Same-origin GET lain → stale-while-revalidate
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }

  // Cross-origin lain (font Google sudah ditangani di atas) → biarkan browser
});

// Bersihkan cache runtime kalau ukurannya kebanyakan
self.addEventListener("message", async (event) => {
  if (event.data === "CLEAN_RUNTIME") {
    const cache = await caches.open(RUNTIME_CACHE);
    const keys = await cache.keys();
    await Promise.all(keys.slice(0, Math.max(0, keys.length - 30)).map((k) => cache.delete(k)));
  }
});
