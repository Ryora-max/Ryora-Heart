const CACHE_NAME = "ryora-v4";
const urlsToCache = [
  "/",
  "/home",
  "/living-room",
  "/bedroom",
  "/garden",
  "/rooftop",
  "/secret-box",
  "/game-arcade",
  "/ldr",
  "/settings",
  "/manifest.json",
];

const isDev = self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1" || self.location.hostname === "0.0.0.0";

if (!isDev) {
  self.addEventListener("install", (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
    );
  });

  self.addEventListener("fetch", (event) => {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then((r) => r || new Response("Offline", { status: 503 })))
    );
  });

  self.addEventListener("activate", (event) => {
    event.waitUntil(
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        );
      })
    );
  });
} else {
  self.addEventListener("install", (event) => {
    self.skipWaiting();
  });
  self.addEventListener("activate", (event) => {
    event.waitUntil(
      caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key)))).then(() => self.clients.claim())
    );
  });
  self.addEventListener("fetch", (event) => {
    event.respondWith(fetch(event.request));
  });
}
