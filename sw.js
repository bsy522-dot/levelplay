const CACHE_NAME = 'levelplay-v4';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './games/hatcuping-game.html',
  './games/hatcuping-rpg.html'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.map(n => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

// Network-first: 항상 최신 버전 먼저 시도
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).then(response => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      return response;
    }).catch(() => caches.match(event.request))
  );
});
