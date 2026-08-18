const CACHE = "europe-2026-v2";
const PRECACHE = [
  "/",
  "/essentials",
  "/photos/dolomites.jpg",
  "/photos/seceda-clouds.jpg",
  "/photos/seceda-panorama.jpg",
  "/photos/seceda-approach.jpg",
  "/photos/munich.jpg",
  "/photos/venice.jpg",
  "/photos/innsbruck.jpg",
  "/photos/ortisei.jpg",
  "/photos/resciesa.jpg",
  "/photos/firenze.jpg",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE).catch(() => undefined)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  const isTile =
    url.hostname.includes("openfreemap.org") || url.pathname.includes("/photos/");
  const isNavigate = request.mode === "navigate";

  if (isTile) {
    event.respondWith(cacheFirst(request));
    return;
  }
  if (isNavigate) {
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(staleWhileRevalidate(request));
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  const cache = await caches.open(CACHE);
  cache.put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE);
    cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || caches.match("/") || Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}
