// LevelPlay Service Worker - 오프라인 캐시 지원
const CACHE_NAME = 'levelplay-v17';

// 즉시 새 SW로 전환 메시지
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './games/hatcuping-game.html',
  './games/hatcuping-rpg.html',
  './games/hatcuping-game-v2.html',
  './games/hatcuping-rpg-v2.html',
  './games/hatcuping-unified.html',
  './games/rpg-v3/index.html',
  './games/hangul-game.html',
  './games/typing-game.html',
  './games/color-game.html',
  './games/world-map-quiz.html',
  './games/timeline-game.html',
  './games/math-puzzle.html',
  './games/science-lab.html',
  './games/sudoku.html',
  './games/sentence-builder.html',
  './games/periodic-table.html',
  './games/rhythm-game.html',
  './games/word-connect.html',
  './games/memory-game.html',
  './games/piano-v3.html',
  './games/ViolinReal-v3.html',
  './games/noraebang-v3.html',
  './games/boxing-trainer-v5.html',
  './games/three.r128.min.js',
  './games/golf-tracker-v3.html',
  './games/korean-rpg-v4.html',
  './games/simcity-v3.html',
  './games/house-builder-v3.html',
  './games/civilization-evolution.html',
  './games/space-explorer.html',
  './games/cooking-master.html',
  './games/animal-farm.html'
];

// 설치: 정적 자산 캐시
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('일부 정적 자산 캐시 실패:', err);
        // 개별 파일 캐시 시도 (일부 게임 파일이 없을 수 있음)
        return Promise.allSettled(STATIC_ASSETS.map(url => cache.add(url)));
      });
    })
  );
  self.skipWaiting();
});

// 활성화: 이전 캐시 삭제
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

// 가져오기: Network First (data/*.json), Cache First (나머지)
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // data/*.json - Network First, fallback to cache
  if (url.pathname.includes('/data/') && url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // 같은 오리진의 요청만 캐시 (외부 CDN, YouTube 등 제외)
  if (url.origin !== location.origin) {
    return;
  }

  // 나머지 - Cache First, fallback to network
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok && event.request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => {
      // 오프라인 fallback: HTML 요청이면 index.html 반환
      if (event.request.headers.get('accept')?.includes('text/html')) {
        return caches.match('./index.html');
      }
    })
  );
});
