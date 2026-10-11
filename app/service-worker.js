// Service Worker — estrategia cache-first sobre los activos estáticos de la aplicación.
// El flujo de verificación (captura -> canvas -> decodificación) no pasa por este SW:
// opera en el hilo principal sobre datos ya presentes en el dispositivo.
const CACHE_NAME = "gsmi-offline-v2";
const ASSETS_TO_CACHE = [
  "./index.html", "./results.html", "./app.js", "./idb.js", "./lib/jsQR.js",
  "./manifest.json", "./icons/icon-192.png", "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// cache-first: si el activo está en caché se sirve sin tocar la red; solo si falta se
// intenta la red (únicamente en la primera carga, con conectividad).
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => new Response("Recurso no disponible offline", { status: 503 }));
    })
  );
});
