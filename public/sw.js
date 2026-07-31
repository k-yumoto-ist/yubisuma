const CACHE = "yubisuma-arena-v4";
const basePath = new URL(self.location.href).pathname.replace(/\/sw\.js$/, "");
const appRoot = `${basePath}/`;
const SHELL = [appRoot, `${basePath}/manifest.webmanifest`, `${basePath}/icon.svg`];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const isDocument = event.request.mode === "navigate" || event.request.destination === "document";
  if (isDocument) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          void caches.open(CACHE).then((cache) => cache.put(appRoot, copy));
          return response;
        })
        .catch(() => caches.match(appRoot))
    );
    return;
  }

  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
    const copy = response.clone();
    void caches.open(CACHE).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(appRoot))));
});
