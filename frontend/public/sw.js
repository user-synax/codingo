/* Codingo service worker — offline-first PWA shell.
   Strategies (same-origin GET only; the Render API is cross-origin and untouched):
   - Navigations: network-first, falling back to the cached /offline page.
   - Versioned static assets (/_next/static, icons, sounds, images): stale-while-revalidate.
   - Everything else (RSC payloads, pages): network-first with cache fallback.
   Bump VERSION to force a clean refresh of all caches. */

const VERSION = "codingo-v2";
const OFFLINE_URL = "/offline";
const CORE = [OFFLINE_URL, "/android-chrome-192x192.png", "/apple-touch-icon.png"];

const STATIC_RE =
  /^\/(_next\/static\/|android-chrome-|apple-touch-icon|favicon\.ico|.*\.(png|jpg|jpeg|webp|svg|gif|mp3|woff2?))$/;

const MAX_NAV_ENTRIES = 30;

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    await cache.delete(keys[0]);
    return trimCache(cache, maxEntries);
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(VERSION);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => cached);
  return cached || network;
}

async function networkFirst(request, fallback) {
  const cache = await caches.open(VERSION);
  try {
    const res = await fetch(request);
    if (res && res.ok) {
      cache.put(request, res.clone());
      trimCache(cache, MAX_NAV_ENTRIES + CORE.length + 50);
    }
    return res;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (fallback) {
      const page = await cache.match(fallback);
      if (page) return page;
    }
    throw new Error("offline");
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // API is same-origin (rewrites) but must NEVER be cached: auth, progress,
  // threads, and AI answers are per-user and time-sensitive. Network only.
  if (url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, OFFLINE_URL));
    return;
  }

  if (STATIC_RE.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  event.respondWith(networkFirst(request, null));
});
