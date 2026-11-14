const CACHE_NAME = "family-finance-pwa-v3";
const APP_ROOT = "/family-finance-app/";
const APP_FILES = [
 APP_ROOT, APP_ROOT+"index.html", APP_ROOT+"manifest.json",
 APP_ROOT+"icons/icon-192.png", APP_ROOT+"icons/icon-512.png"
];
self.addEventListener("install",event=>{
 event.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(APP_FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
 event.waitUntil(caches.keys().then(names=>Promise.all(
  names.filter(n=>n.startsWith("family-finance-")&&n!==CACHE_NAME).map(n=>caches.delete(n))
 )).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
 const req=event.request, url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 if(req.mode==="navigate"){
  event.respondWith(fetch(req).then(res=>{
   if(res&&res.ok){const copy=res.clone();caches.open(CACHE_NAME).then(c=>c.put(APP_ROOT,copy));}
   return res;
  }).catch(()=>caches.match(APP_ROOT)));
  return;
 }
 if(url.pathname.startsWith(APP_ROOT))
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req)));
});
