const CACHE_NAME = "lucerito-v2";
const ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/vite.svg",
  "/images/img-login.jpg",
  "/images/img-login2.jpg"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => 
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  clients.claim();
});

self.addEventListener("fetch", (e) => {
  // Estrategia Cache First para assets locales, Network First para el resto
  const url = new URL(e.request.url);
  if (ASSETS.includes(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then((res) => res || fetch(e.request))
    );
  }
});
