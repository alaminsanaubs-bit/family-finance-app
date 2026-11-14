
const CACHE_NAME = "family-finance-pwa-v4";
const APP_ROOT = "/family-finance-app/";

const APP_FILES = [
  APP_ROOT,
  APP_ROOT + "index.html",
  APP_ROOT + "manifest.json",
  APP_ROOT + "icons/icon-192.png",
  APP_ROOT + "icons/icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names
          .filter(name =>
            name.startsWith("family-finance-") &&
            name !== CACHE_NAME
          )
          .map(name => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  const url = new URL(req.url);

  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).then(res => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache =>
            cache.put(APP_ROOT, copy)
          );
        }
        return res;
      }).catch(() => caches.match(APP_ROOT))
    );
    return;
  }

  if (url.pathname.startsWith(APP_ROOT)) {
    event.respondWith(
      caches.match(req).then(cached =>
        cached || fetch(req)
      )
    );
  }
});
