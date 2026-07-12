// LevelPlay Service Worker - 오프라인 캐시 지원
const CACHE_NAME = 'levelplay-v54-tempo';

// 즉시 새 SW로 전환 메시지
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './v3_patch.js',
  './v4_patch.js',
  './v5_patch.js',
  './v6_patch.js',
  './v7_patch.js',
  './v8_patch.js',
  './v9_patch.js',
  './v10_patch.js',
  './v11_patch.js',
  './v12_patch.js',
  './v13_patch.js',
  './v14_patch.js',
  './nav_unify.js',
  './games/hangul-game.html',
  './games/eng-word-game.html',
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
  './games/boxing-trainer-v5.html', // NEVER_CACHE_PATHS에도 존재 → 런타임은 항상 네트워크; 오프라인 HTML 셸만 프리캐시
  './games/three.r128.min.js',
  './games/golf-tracker-v3.html',
  './games/korean-rpg-v4.html',
  // 한국사 영웅전 v8b — 폴더형 (ES Module + JSON 데이터)
  './games/korean-rpg-v8b/index.html',
  './games/korean-rpg-v8b/assets/portraits/hwanoong.png',
  './games/korean-rpg-v8b/assets/models/manifest.json',
  './games/korean-rpg-v8b/js-v8/core/engine.js',
  './games/korean-rpg-v8b/js-v8/core/audio.js',
  './games/korean-rpg-v8b/js-v8/graphics/materials.js',
  './games/korean-rpg-v8b/js-v8/graphics/lighting.js',
  './games/korean-rpg-v8b/js-v8/graphics/effects.js',
  './games/korean-rpg-v8b/js-v8/graphics/gltf_loader.js',
  './games/korean-rpg-v8b/js-v8/graphics/terrain.js',
  './games/korean-rpg-v8b/js-v8/graphics/buildings.js',
  './games/korean-rpg-v8b/js-v8/graphics/unit_builder.js',
  './games/korean-rpg-v8b/js-v8/graphics/unit_async.js',
  './games/korean-rpg-v8b/js-v8/graphics/unit_hud.js',
  './games/korean-rpg-v8b/js-v8/graphics/postprocess.js',
  './games/korean-rpg-v8b/js-v8/battle/turn_manager.js',
  './games/korean-rpg-v8b/js-v8/battle/movement.js',
  './games/korean-rpg-v8b/js-v8/battle/attack.js',
  './games/korean-rpg-v8b/js-v8/battle/skills.js',
  './games/korean-rpg-v8b/js-v8/battle/xp_level.js',
  './games/korean-rpg-v8b/js-v8/battle/ai.js',
  './games/korean-rpg-v8b/js-v8/battle/weather.js',
  './games/korean-rpg-v8b/js-v8/battle/highlights.js',
  './games/korean-rpg-v8b/js-v8/camera/switcher.js',
  './games/korean-rpg-v8b/js-v8/camera/tactical_cam.js',
  './games/korean-rpg-v8b/js-v8/camera/character_cam.js',
  './games/korean-rpg-v8b/js-v8/camera/cutin_cam.js',
  './games/korean-rpg-v8b/js-v8/camera/squad_cam.js',
  './games/korean-rpg-v8b/js-v8/world/town.js',
  './games/korean-rpg-v8b/js-v8/world/npc.js',
  './games/korean-rpg-v8b/js-v8/world/squad.js',
  './games/korean-rpg-v8b/js-v8/ui/hud.js',
  './games/korean-rpg-v8b/js-v8/ui/action_queue.js',
  './games/korean-rpg-v8b/js-v8/ui/dialogue.js',
  './games/korean-rpg-v8b/js-v8/ui/settings.js',
  './games/korean-rpg-v8b/js-v8/ui/menus.js',
  './games/korean-rpg-v8b/js-v8/ui/cutin.js',
  './games/korean-rpg-v8b/js-v8/ui/portrait_art.js',
  './games/korean-rpg-v8b/js-v8/ui/cursor.js',
  './games/korean-rpg-v8b/js-v8/ui/dpad.js',
  './games/korean-rpg-v8b/js-v8/ui/styles.css',
  './games/korean-rpg-v8b/js-v8/ui/cutin.css',
  './games/korean-rpg-v8b/js-v8/data/units.json',
  './games/korean-rpg-v8b/js-v8/data/maps.json',
  './games/korean-rpg-v8b/js-v8/data/skills.json',
  './games/korean-rpg-v8b/js-v8/data/items.json',
  './games/korean-rpg-v8b/js-v8/data/story_ep1.json',
  './games/korean-rpg-v8b/js-v8/data/story_ep2.json',
  './games/korean-rpg-v8b/js-v8/data/portraits.json',
  './games/korean-rpg-v8b/js-v8/data/portraits_data.js',
  // 노래방 v4 — 폴더형 (PWA 별도 manifest + 아이콘)
  './games/noraebang-v4/index.html',
  './games/noraebang-v4/manifest.json',
  './games/noraebang-v4/icons/icon-192.png',
  './games/noraebang-v4/icons/icon-512.png',
  // 우주 탐험 3D — 폴더형 (Three.js + 텍스처 24장)
  './games/space-explorer-3d/index.html',
  './games/space-explorer-3d/assets/audio/audio.js',
  './games/space-explorer-3d/assets/tutorial/tutorial.js',
  './games/space-explorer-3d/assets/tutorial/tutorial.css',
  './games/space-explorer-3d/assets/models/spaceship.glb',
  './games/space-explorer-3d/assets/textures/sun.jpg',
  './games/space-explorer-3d/assets/textures/mercury.jpg',
  './games/space-explorer-3d/assets/textures/venus.jpg',
  './games/space-explorer-3d/assets/textures/earth.jpg',
  './games/space-explorer-3d/assets/textures/moon.jpg',
  './games/space-explorer-3d/assets/textures/mars.jpg',
  './games/space-explorer-3d/assets/textures/jupiter.jpg',
  './games/space-explorer-3d/assets/textures/saturn.jpg',
  './games/space-explorer-3d/assets/textures/uranus.jpg',
  './games/space-explorer-3d/assets/textures/neptune.jpg',
  './games/space-explorer-3d/assets/textures/saturn_ring.png',
  './games/space-explorer-3d/assets/textures/stars_milkyway.jpg',
  './games/space-explorer-3d/assets/textures/mercury_normal.jpg',
  './games/space-explorer-3d/assets/textures/venus_normal.jpg',
  './games/space-explorer-3d/assets/textures/earth_normal.jpg',
  './games/space-explorer-3d/assets/textures/moon_normal.jpg',
  './games/space-explorer-3d/assets/textures/mars_normal.jpg',
  './games/space-explorer-3d/assets/textures/jupiter_normal.jpg',
  './games/space-explorer-3d/assets/textures/saturn_normal.jpg',
  './games/space-explorer-3d/assets/textures/uranus_normal.jpg',
  './games/space-explorer-3d/assets/textures/neptune_normal.jpg',
  './games/space-explorer-3d/assets/textures/sun_normal.jpg',
  './games/space-explorer-3d/assets/textures/saturn_ring_normal.jpg',
  './games/simcity-v3.html',
  './games/house-builder-v4.html',
  // 문명진화 v3.0 (e52576d1) — 폴더 진입 + 93개 자산
  './games/civilization-evolution/index.html',
  './games/civilization-evolution/assets/videos/era_0_stoneAge.mp4',
  './games/civilization-evolution/assets/sprites/buildings/campfire.png',
  './games/civilization-evolution/assets/sprites/buildings/castle.png',
  './games/civilization-evolution/assets/sprites/buildings/factory.png',
  './games/civilization-evolution/assets/sprites/buildings/forge.png',
  './games/civilization-evolution/assets/sprites/buildings/glassWorkshop.png',
  './games/civilization-evolution/assets/sprites/buildings/granary.png',
  './games/civilization-evolution/assets/sprites/buildings/hut.png',
  './games/civilization-evolution/assets/sprites/buildings/kiln.png',
  './games/civilization-evolution/assets/sprites/buildings/pitDwelling.png',
  './games/civilization-evolution/assets/sprites/buildings/powerPlant.png',
  './games/civilization-evolution/assets/sprites/buildings/skyscraper.png',
  './games/civilization-evolution/assets/sprites/buildings/smelter.png',
  './games/civilization-evolution/assets/sprites/buildings/techCenter.png',
  './games/civilization-evolution/assets/sprites/buildings/thatchHouse.png',
  './games/civilization-evolution/assets/sprites/buildings/tileHouse.png',
  './games/civilization-evolution/assets/sprites/buildings/trainStation.png',
  './games/civilization-evolution/assets/sprites/buildings/waterMill.png',
  './games/civilization-evolution/assets/sprites/characters/bronzePerson.png',
  './games/civilization-evolution/assets/sprites/characters/industrialPerson.png',
  './games/civilization-evolution/assets/sprites/characters/ironPerson.png',
  './games/civilization-evolution/assets/sprites/characters/medievalPerson.png',
  './games/civilization-evolution/assets/sprites/characters/modernPerson.png',
  './games/civilization-evolution/assets/sprites/characters/neolithicPerson.png',
  './games/civilization-evolution/assets/sprites/characters/stoneAgePerson.png',
  './games/civilization-evolution/assets/sprites/characters/front/bronzePerson.png',
  './games/civilization-evolution/assets/sprites/characters/front/industrialPerson.png',
  './games/civilization-evolution/assets/sprites/characters/front/ironPerson.png',
  './games/civilization-evolution/assets/sprites/characters/front/medievalPerson.png',
  './games/civilization-evolution/assets/sprites/characters/front/modernPerson.png',
  './games/civilization-evolution/assets/sprites/characters/front/neolithicPerson.png',
  './games/civilization-evolution/assets/sprites/characters/front/stoneAgePerson.png',
  './games/civilization-evolution/assets/sprites/characters/back/bronzePerson.png',
  './games/civilization-evolution/assets/sprites/characters/back/industrialPerson.png',
  './games/civilization-evolution/assets/sprites/characters/back/ironPerson.png',
  './games/civilization-evolution/assets/sprites/characters/back/medievalPerson.png',
  './games/civilization-evolution/assets/sprites/characters/back/modernPerson.png',
  './games/civilization-evolution/assets/sprites/characters/back/neolithicPerson.png',
  './games/civilization-evolution/assets/sprites/characters/back/stoneAgePerson.png',
  './games/civilization-evolution/assets/sprites/resources/berry.png',
  './games/civilization-evolution/assets/sprites/resources/clay.png',
  './games/civilization-evolution/assets/sprites/resources/coal.png',
  './games/civilization-evolution/assets/sprites/resources/copperOre.png',
  './games/civilization-evolution/assets/sprites/resources/cotton.png',
  './games/civilization-evolution/assets/sprites/resources/fiber.png',
  './games/civilization-evolution/assets/sprites/resources/flint.png',
  './games/civilization-evolution/assets/sprites/resources/gold.png',
  './games/civilization-evolution/assets/sprites/resources/hide.png',
  './games/civilization-evolution/assets/sprites/resources/ironOre.png',
  './games/civilization-evolution/assets/sprites/resources/limestone.png',
  './games/civilization-evolution/assets/sprites/resources/meat.png',
  './games/civilization-evolution/assets/sprites/resources/oil.png',
  './games/civilization-evolution/assets/sprites/resources/rice.png',
  './games/civilization-evolution/assets/sprites/resources/rubber.png',
  './games/civilization-evolution/assets/sprites/resources/saltpeter.png',
  './games/civilization-evolution/assets/sprites/resources/sand.png',
  './games/civilization-evolution/assets/sprites/resources/seed.png',
  './games/civilization-evolution/assets/sprites/resources/silicon.png',
  './games/civilization-evolution/assets/sprites/resources/stick.png',
  './games/civilization-evolution/assets/sprites/resources/stone.png',
  './games/civilization-evolution/assets/sprites/resources/tinOre.png',
  './games/civilization-evolution/assets/sprites/resources/uranium.png',
  './games/civilization-evolution/assets/sprites/resources/wheat.png',
  './games/civilization-evolution/assets/sprites/resources/wood.png',
  './games/civilization-evolution/assets/sprites/tiles/era0/dirt.png',
  './games/civilization-evolution/assets/sprites/tiles/era0/grass.png',
  './games/civilization-evolution/assets/sprites/tiles/era0/stone.png',
  './games/civilization-evolution/assets/sprites/tiles/era1/dirt.png',
  './games/civilization-evolution/assets/sprites/tiles/era1/grass.png',
  './games/civilization-evolution/assets/sprites/tiles/era1/stone.png',
  './games/civilization-evolution/assets/sprites/tiles/era2/dirt.png',
  './games/civilization-evolution/assets/sprites/tiles/era2/grass.png',
  './games/civilization-evolution/assets/sprites/tiles/era2/stone.png',
  './games/civilization-evolution/assets/sprites/tiles/era3/dirt.png',
  './games/civilization-evolution/assets/sprites/tiles/era3/grass.png',
  './games/civilization-evolution/assets/sprites/tiles/era3/stone.png',
  './games/civilization-evolution/assets/sprites/tiles/era4/dirt.png',
  './games/civilization-evolution/assets/sprites/tiles/era4/grass.png',
  './games/civilization-evolution/assets/sprites/tiles/era4/stone.png',
  './games/civilization-evolution/assets/sprites/tiles/era5/dirt.png',
  './games/civilization-evolution/assets/sprites/tiles/era5/grass.png',
  './games/civilization-evolution/assets/sprites/tiles/era5/stone.png',
  './games/civilization-evolution/assets/sprites/tiles/era6/dirt.png',
  './games/civilization-evolution/assets/sprites/tiles/era6/grass.png',
  './games/civilization-evolution/assets/sprites/tiles/era6/stone.png',
  './games/civilization-evolution/assets/sprites/vfx/dust.png',
  './games/civilization-evolution/assets/sprites/vfx/electric.png',
  './games/civilization-evolution/assets/sprites/vfx/flame.png',
  './games/civilization-evolution/assets/sprites/vfx/leaf.png',
  './games/civilization-evolution/assets/sprites/vfx/rune.png',
  './games/civilization-evolution/assets/sprites/vfx/smoke.png',
  './games/civilization-evolution/assets/sprites/vfx/sparkle.png',
  './games/civilization-evolution/assets/sprites/vfx/water_splash.png',
  './games/space-explorer.html',
  './games/cooking-master.html',
  './games/animal-farm.html',
  // ── 공유 벤더 라이브러리 (오프라인 3D · P2P) ──
  './games/_vendor/three-0.160.0/build/three.module.min.js',
  './games/_vendor/three-0.160.0/build/three.module.js',
  './games/_vendor/three-0.160.0/LICENSE',
  './games/_vendor/three-0.160.0/examples/jsm/controls/OrbitControls.js',
  './games/_vendor/three-0.160.0/examples/jsm/environments/RoomEnvironment.js',
  './games/_vendor/three-0.160.0/examples/jsm/libs/ktx-parse.module.js',
  './games/_vendor/three-0.160.0/examples/jsm/libs/zstddec.module.js',
  './games/_vendor/three-0.160.0/examples/jsm/loaders/DRACOLoader.js',
  './games/_vendor/three-0.160.0/examples/jsm/loaders/GLTFLoader.js',
  './games/_vendor/three-0.160.0/examples/jsm/loaders/KTX2Loader.js',
  './games/_vendor/three-0.160.0/examples/jsm/postprocessing/EffectComposer.js',
  './games/_vendor/three-0.160.0/examples/jsm/postprocessing/MaskPass.js',
  './games/_vendor/three-0.160.0/examples/jsm/postprocessing/OutlinePass.js',
  './games/_vendor/three-0.160.0/examples/jsm/postprocessing/OutputPass.js',
  './games/_vendor/three-0.160.0/examples/jsm/postprocessing/Pass.js',
  './games/_vendor/three-0.160.0/examples/jsm/postprocessing/RenderPass.js',
  './games/_vendor/three-0.160.0/examples/jsm/postprocessing/ShaderPass.js',
  './games/_vendor/three-0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js',
  './games/_vendor/three-0.160.0/examples/jsm/shaders/CopyShader.js',
  './games/_vendor/three-0.160.0/examples/jsm/shaders/FXAAShader.js',
  './games/_vendor/three-0.160.0/examples/jsm/shaders/LuminosityHighPassShader.js',
  './games/_vendor/three-0.160.0/examples/jsm/shaders/OutputShader.js',
  './games/_vendor/three-0.160.0/examples/jsm/utils/BufferGeometryUtils.js',
  './games/_vendor/three-0.160.0/examples/jsm/utils/SkeletonUtils.js',
  './games/_vendor/three-0.160.0/examples/jsm/utils/WorkerPool.js',
  './games/_vendor/peerjs.min.js',
  // ── 바이올린 리얼 샘플 음원 (11음) ──
  './games/violin_samples/G3.mp3',
  './games/violin_samples/A3.mp3',
  './games/violin_samples/C4.mp3',
  './games/violin_samples/E4.mp3',
  './games/violin_samples/G4.mp3',
  './games/violin_samples/A4.mp3',
  './games/violin_samples/C5.mp3',
  './games/violin_samples/E5.mp3',
  './games/violin_samples/G5.mp3',
  './games/violin_samples/A5.mp3',
  './games/violin_samples/C6.mp3'
];

// v2_patch.js 주입 (메인 앱 HTML에 스크립트 태그 삽입)
async function injectV2Patch(response) {
  if (!response || !response.ok) return response;
  const ct = response.headers.get('content-type') || '';
  if (!ct.includes('text/html')) return response;
  let html = await response.text();
  // 최신 패치(v7)가 이미 포함된 정상 HTML이면 추가 주입하지 않는다 (중복 주입 버그 방지).
  // v7이 없는 옛 HTML일 때만 누락 패치(v3~v7)를 한 번만 주입한다.
  if (html.includes('</body>') && !html.includes('v7_patch.js')) {
    html = html.replace('</body>', '<script src="v3_patch.js" defer><\/script>\n<script src="v4_patch.js" defer><\/script>\n<script src="v5_patch.js" defer><\/script>\n<script src="v6_patch.js" defer><\/script>\n<script src="v7_patch.js" defer><\/script>\n</body>');
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
