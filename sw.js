// 서비스 워커 자체 해제 - 모든 캐시 삭제하고 등록 해제
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(names.map(n => caches.delete(n))))
      .then(() => self.clients.claim())
      .then(() => self.registration.unregister())
  );
});
