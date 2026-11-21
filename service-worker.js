
"use strict";

/* =====================================
   পারিবারিক হিসাব PWA
   Service Worker Version 6
===================================== */

const CACHE_NAME = "family-finance-pwa-v6";

const APP_ROOT = "/family-finance-app/";

const APP_FILES = [
  APP_ROOT,
  APP_ROOT + "index.html",
  APP_ROOT + "manifest.json",
  APP_ROOT + "icons/icon-192.png",
  APP_ROOT + "icons/icon-512.png"
];


/* =====================================
   ১. Install
===================================== */

self.addEventListener("install", event => {

  event.waitUntil(

    caches.open(CACHE_NAME)
      .then(cache => {

        return Promise.all(
          APP_FILES.map(file => {

            return cache.add(file).catch(error => {

              console.warn(
                "Cache করা যায়নি:",
                file,
                error
              );

            });

          })
        );

      })
      .then(() => self.skipWaiting())

  );

});


/* =====================================
   ২. Activate
===================================== */

self.addEventListener("activate", event => {

  event.waitUntil(

    caches.keys()
      .then(cacheNames => {

        return Promise.all(

          cacheNames.map(cacheName => {

            if (
              cacheName.startsWith("family-finance-pwa-") &&
              cacheName !== CACHE_NAME
            ) {

              return caches.delete(cacheName);

            }

          })

        );

      })
      .then(() => self.clients.claim())

  );

});


/* =====================================
   ৩. Fetch
===================================== */

self.addEventListener("fetch", event => {

  const request = event.request;

  const url = new URL(request.url);

  // শুধু GET Request পরিচালনা করবে
  if (request.method !== "GET") {
    return;
  }

  // অন্য ডোমেইনের অনুরোধে হস্তক্ষেপ করবে না
  if (url.origin !== self.location.origin) {
    return;
  }

  // Navigation: Network First, তারপর Cache
  if (request.mode === "navigate") {

    event.respondWith(

      fetch(request)
        .then(response => {

          if (response && response.ok) {

            const copy = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => cache.put(request, copy));

          }

          return response;

        })
        .catch(async () => {

          const cachedPage = await caches.match(request);

          if (cachedPage) {
            return cachedPage;
          }

          const appPage = await caches.match(
            APP_ROOT + "index.html"
          );

          if (appPage) {
            return appPage;
          }

          return new Response(
            "ইন্টারনেট সংযোগ নেই। আগে অ্যাপটি অনলাইনে খুলে নিন।",
            {
              status: 503,
              headers: {
                "Content-Type": "text/plain; charset=utf-8"
              }
            }
          );

        })

    );

    return;
  }


  // অন্যান্য একই-origin ফাইল: Cache First
  event.respondWith(

    caches.match(request)
      .then(cachedResponse => {

        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then(response => {

            if (
              response &&
              response.ok &&
              response.type === "basic"
            ) {

              const copy = response.clone();

              caches.open(CACHE_NAME)
                .then(cache => cache.put(request, copy));

            }

            return response;

          });

      })

  );

});


/* =====================================
   ৪. নতুন সংস্করণ নিয়ন্ত্রণ
===================================== */

self.addEventListener("message", event => {

  if (!event.data) {
    return;
  }

  if (event.data.type === "SKIP_WAITING") {

    self.skipWaiting();

  }

});
