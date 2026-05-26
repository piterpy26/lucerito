const CACHE_NAME = "lucerito-v1";

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(clients.claim());
});

self.addEventListener("fetch", (e) => {
  // El listener de fetch es necesario para que sea instalable.
  // Por ahora dejamos que las peticiones pasen directas a la red.
});
