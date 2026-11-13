
const CACHE_NAME = "family-finance-v1";

const APP_FILES = [
  "/family-finance-app/",
  "/family-finance-app/index.html",
  "/family-finance-app/manifest.json"
];

// অ্যাপের প্রয়োজনীয় ফাইল ক্যাশ করা
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// পুরোনো ক্যাশ পরিষ্কার করা
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// পেজ খোলার সময় আগে ইন্টারনেট থেকে নতুন পেজ আনা
self.addEventListener("fetch", event => {
  const request = event.request;
  const url = new URL(request.url);

  // অন্য ওয়েবসাইটের অনুরোধে হস্তক্ষেপ করবে না
  if (url.origin !== self.location.origin) {
    return;
  }

  // HTML পেজ: Network first
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put("/family-finance-app/", copy);
          });
          return response;
        })
        .catch(() => {
          return caches.match("/family-finance-app/");
        })
    );
    return;
  }

  // অন্য একই-সাইটের ফাইল: Cache first
  event.respondWith(
    caches.match(request).then(cached => {
      return cached || fetch(request);
    })
  );
});
