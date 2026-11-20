
const CACHE_NAME = "family-finance-pwa-v5";
const APP_ROOT = "/family-finance-app/";

const APP_FILES = [
  APP_ROOT,
  APP_ROOT + "index.html",
  APP_ROOT + "manifest.json",
  APP_ROOT + "icons/icon-192.png",
  APP_ROOT + "icons/icon-512.png"
];

// অ্যাপের প্রয়োজনীয় ফাইল Cache-এ রাখা
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// পুরোনো Cache মুছে নতুন Cache চালু
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names
          .filter(name =>
            name.startsWith("family-finance-pwa-") &&
            name !== CACHE_NAME
          )
          .map(name => caches.delete(name))
      )
    ).then(() => self.clients.claim())
  );
});

// অনলাইনে নতুন ফাইল নেওয়া, অফলাইনে Cache থেকে অ্যাপ খোলা
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  // বাইরের ওয়েবসাইট বা Google Apps Script-এ হস্তক্ষেপ করবে না
  if (url.origin !== self.location.origin) return;

  // অ্যাপের মূল পেজ
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache =>
              cache.put(APP_ROOT, copy)
            );
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(APP_ROOT);
          if (cached) return cached;

          return new Response(
            "ইন্টারনেট সংযোগ নেই। আগে অ্যাপটি অনলাইনে খুলুন।",
            {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" }
            }
          );
        })
    );
    return;
  }

  // অন্যান্য PWA ফাইল
  if (url.pathname.startsWith(APP_ROOT)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;

        return fetch(request).then(response => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache =>
              cache.put(request, copy)
            );
          }
          return response;
        });
      })
    );
  }
});
