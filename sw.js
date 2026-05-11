// LevelPlay Service Worker - 오프라인 캐시 지원
const CACHE_NAME = 'levelplay-v31-auto';

// 즉시 새 SW로 전환 메시지
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './v2_patch.js',
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
  // boxing-trainer-v5.html: 절대 캐시 안 함 (NEVER_CACHE_PATHS 참조)
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

// v2_patch.js 주입 (메인 앱 HTML에 스크립트 태그 삽입)
async function injectV2Patch(response) {
  if (!response || !response.ok) return response;
  const ct = response.headers.get('content-type') || '';
  if (!ct.includes('text/html')) return response;
  let html = await response.text();
  if (html.includes('</body>') && !html.includes('v2_patch.js')) {
    html = html.replace('</body>', '<script src="v2_patch.js" defer><\/script>\n</body>');
  }
  return new Response(html, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers
  });
}

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

// 가져오기: Network First (data/*.json, RPG 게임 HTML), Cache First (나머지)
const NETWORK_FIRST_PATHS = ['/data/', 'korean-rpg-', 'index.html', '/sw.js'];
const NEVER_CACHE_PATHS = ['boxing-trainer-', 'opponent_lore.json', 'manifest.boxing.json'];
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 절대 캐시 금지 — 항상 네트워크에서, 캐시도 저장 안 함
  if (NEVER_CACHE_PATHS.some(p => url.pathname.includes(p))) {
    event.respondWith(fetch(event.request, { cache: 'no-store' }).catch(() => new Response('Network error', { status: 504 })));
    return;
  }

  // 메인 앱 Navigation (게임 페이지 제외): v2_patch.js 자동 주입
  if (event.request.mode === 'navigate' && !url.pathname.includes('/games/')) {
    event.respondWith(
      fetch(event.request).then(response => {
        if (response.ok) {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
        }
        return injectV2Patch(response);
      }).catch(() =>
        caches.match(event.request).then(cached =>
          cached ? injectV2Patch(cached) : caches.match('./index.html').then(fb => fb ? injectV2Patch(fb) : undefined)
        )
      )
    );
    return;
  }

  const isNetworkFirst = NETWORK_FIRST_PATHS.some(p => url.pathname.includes(p));

  // Network First 대상 - 항상 네트워크 우선, fallback to cache
  if (isNetworkFirst) {
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
