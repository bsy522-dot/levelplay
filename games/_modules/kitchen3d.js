/* ============================================================
 * kitchen3d.js — 시네마틱 3D 부엌 배경 (Three.js 0.170+)
 *  요리왕(cooking-master.html)의 2D 캔버스 뒤(z-index:-1)에 깔리는 3D 레이어.
 *  API:  window.Kitchen3D = { init, resize, setMode, setRecipeFood, render, dispose }
 *  의존: window.THREE  (CDN으로 로드되어 있어야 함)
 * ============================================================ */
(function(){
  'use strict';

  // -- THREE 미정의 → graceful stub (게임은 정상 동작)
  if (typeof THREE === 'undefined' || !window.THREE) {
    console.warn('[Kitchen3D] THREE.js not found — running stub.');
    window.Kitchen3D = {
      init:        function(){ /* no-op */ },
      resize:      function(){ /* no-op */ },
      setMode:     function(){ /* no-op */ },
      setRecipeFood:function(){ /* no-op */ },
      render:      function(){ /* no-op */ },
      dispose:     function(){ /* no-op */ },
      _stub: true
    };
    return;
  }

  // -- 음식 이모지 → 색상 매핑 테이블
  var FOOD_COLORS = {
    '🍳':0xFFE5B4, // 계란후라이
    '🍜':0xFFD700, // 라면
    '🍙':0xF5F5DC, // 주먹밥
    '🍞':0xDEB887, // 토스트
    '🥗':0x90EE90, // 샐러드
    '🍛':0xD2691E, // 카레
    '🌶️':0xFF4500, // 매운요리
    '🥚':0xFFFACD, // 계란
    '🥘':0x8B4513, // 찌개
    '🍚':0xFFFAF0, // 밥
    '🥩':0x8B0000, // 스테이크
    '🍝':0xDAA520, // 파스타
    '🍱':0x228B22, // 도시락
    '🍗':0xCD853F, // 치킨
    '🥞':0xF4A460  // 팬케이크
  };
  function colorOf(emoji){
    if (emoji && FOOD_COLORS[emoji] !== undefined) return FOOD_COLORS[emoji];
    return 0xFFE5B4; // 기본
  }

  // -- 모듈 상태
  var S = {
    ready:false, supported:true,
    canvas:null, renderer:null, scene:null, camera:null, clock:null,
    mode:'menu', dpr:1, W:0, H:0,
    // 라이트
    dirLight:null, ambLight:null, stoveLight:null,
    // 오브젝트
    counter:null, stove:null, burners:[], pot:null, pan:null,
    wall:null, food:null, foodGroup:null,
    // 음식
    currentEmoji:null, foodColor:0xFFE5B4,
    // 카메라 보조
    orbitAngle:0,
    // 공유 리소스 (재사용)
    _geo:{}, _mat:{}
  };

  // -- 타일 벽 텍스처 (procedural CanvasTexture)
  function makeTileTexture(){
    var c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    var g = c.getContext('2d');
    // 베이스 베이지
    g.fillStyle = '#F5E6C8';
    g.fillRect(0,0,512,512);
    // 체크 타일
    var tile = 64;
    for (var y=0; y<512; y+=tile){
      for (var x=0; x<512; x+=tile){
        var alt = ((x/tile + y/tile) % 2) === 0;
        g.fillStyle = alt ? '#FFF4D6' : '#EAD9B0';
        g.fillRect(x+2, y+2, tile-4, tile-4);
      }
    }
    // 그라우트 라인
    g.strokeStyle = '#C9B07A';
    g.lineWidth = 2;
    for (var i=0; i<=512; i+=tile){
      g.beginPath(); g.moveTo(i,0); g.lineTo(i,512); g.stroke();
      g.beginPath(); g.moveTo(0,i); g.lineTo(512,i); g.stroke();
    }
    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2,2);
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // -- 우드 텍스처 (카운터)
  function makeWoodTexture(){
    var c = document.createElement('canvas');
    c.width = 256; c.height = 256;
    var g = c.getContext('2d');
    g.fillStyle = '#8B6F47';
    g.fillRect(0,0,256,256);
    // 결무늬
    for (var i=0; i<40; i++){
      g.strokeStyle = 'rgba(70,45,25,'+(0.1+Math.random()*0.2)+')';
      g.lineWidth = 1 + Math.random()*2;
      g.beginPath();
      var y = Math.random()*256;
      g.moveTo(0, y);
      g.bezierCurveTo(80, y+Math.random()*8-4, 180, y+Math.random()*8-4, 256, y+Math.random()*8-4);
      g.stroke();
    }
    var tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2,1);
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  // -- 씬 빌드
  function buildScene(){
    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFFF8E7);
    if (THREE.Fog) scene.fog = new THREE.Fog(0xFFF8E7, 8, 20);

    // ----- 라이팅
    S.dirLight = new THREE.DirectionalLight(0xFFE4B5, 0.8);
    S.dirLight.position.set(3, 5, 4);
    scene.add(S.dirLight);

    S.ambLight = new THREE.AmbientLight(0xFFFFFF, 0.4);
    scene.add(S.ambLight);

    // 스토브 위 PointLight (요리 모드에서 강해짐)
    S.stoveLight = new THREE.PointLight(0xFF6347, 0.0, 5);
    S.stoveLight.position.set(0, 1.2, 0.2);
    scene.add(S.stoveLight);

    // ----- 카운터 (BoxGeometry)
    var woodTex = makeWoodTexture();
    var counterMat = new THREE.MeshStandardMaterial({
      color:0x8B6F47, map:woodTex, roughness:0.65, metalness:0.05
    });
    var counterGeo = new THREE.BoxGeometry(6, 0.3, 2.2);
    var counter = new THREE.Mesh(counterGeo, counterMat);
    counter.position.set(0, 0, 0);
    scene.add(counter);
    S.counter = counter;

    // ----- 벽 배경 (PlaneGeometry, 타일 패턴)
    var tileTex = makeTileTexture();
    var wallMat = new THREE.MeshStandardMaterial({
      color:0xFFFFFF, map:tileTex, roughness:0.85, metalness:0.0
    });
    var wallGeo = new THREE.PlaneGeometry(12, 6);
    var wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.set(0, 2.0, -1.4);
    scene.add(wall);
    S.wall = wall;

    // ----- 스토브 (BoxGeometry, 검은 메탈)
    var stoveBaseMat = new THREE.MeshStandardMaterial({
      color:0x1A1A1A, roughness:0.35, metalness:0.85
    });
    var stoveGeo = new THREE.BoxGeometry(1.6, 0.2, 1.2);
    var stove = new THREE.Mesh(stoveGeo, stoveBaseMat);
    stove.position.set(0, 0.25, 0.0);
    scene.add(stove);
    S.stove = stove;

    // 화구 4개 (CylinderGeometry, 검은 원반)
    var burnerGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.04, 24);
    var burnerMat = new THREE.MeshStandardMaterial({
      color:0x0D0D0D, roughness:0.3, metalness:0.9
    });
    var burnerPos = [
      [-0.5, 0.36,-0.25],[ 0.5, 0.36,-0.25],
      [-0.5, 0.36, 0.25],[ 0.5, 0.36, 0.25]
    ];
    for (var i=0; i<4; i++){
      var b = new THREE.Mesh(burnerGeo, burnerMat);
      b.position.set(burnerPos[i][0],burnerPos[i][1],burnerPos[i][2]);
      scene.add(b);
      S.burners.push(b);
    }
    // 공유 리소스 보관
    S._geo.burner = burnerGeo;
    S._mat.burner = burnerMat;

    // ----- 냄비 (CylinderGeometry + TorusGeometry 손잡이) 좌측 화구 위
    var potBodyMat = new THREE.MeshStandardMaterial({
      color:0xB8B8B8, roughness:0.25, metalness:0.95
    });
    var potBodyGeo = new THREE.CylinderGeometry(0.28, 0.26, 0.32, 24, 1, true);
    var potBottomGeo = new THREE.CircleGeometry(0.26, 24);
    var pot = new THREE.Group();
    var potBody = new THREE.Mesh(potBodyGeo, potBodyMat);
    potBody.position.y = 0.16;
    pot.add(potBody);
    var potBottom = new THREE.Mesh(potBottomGeo, potBodyMat);
    potBottom.rotation.x = -Math.PI/2;
    potBottom.position.y = 0.0;
    pot.add(potBottom);
    // 손잡이(좌우) - 토러스 일부
    var handleGeo = new THREE.TorusGeometry(0.08, 0.025, 8, 16, Math.PI);
    var handleMat = new THREE.MeshStandardMaterial({
      color:0x2A2A2A, roughness:0.5, metalness:0.4
    });
    var hL = new THREE.Mesh(handleGeo, handleMat);
    hL.rotation.set(0, 0, Math.PI/2);
    hL.position.set(-0.30, 0.18, 0);
    pot.add(hL);
    var hR = new THREE.Mesh(handleGeo, handleMat);
    hR.rotation.set(0, 0, -Math.PI/2);
    hR.position.set(0.30, 0.18, 0);
    pot.add(hR);
    pot.position.set(-0.5, 0.40,-0.25);
    scene.add(pot);
    S.pot = pot;

    // ----- 팬 (얕은 실린더 + 긴 손잡이) 우측 화구 위
    var panGeo = new THREE.CylinderGeometry(0.27, 0.27, 0.08, 24);
    var pan = new THREE.Group();
    var panBody = new THREE.Mesh(panGeo, potBodyMat);
    panBody.position.y = 0.04;
    pan.add(panBody);
    var panHandleGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.45, 12);
    var panHandle = new THREE.Mesh(panHandleGeo, handleMat);
    panHandle.rotation.z = Math.PI/2;
    panHandle.position.set(0.43, 0.04, 0);
    pan.add(panHandle);
    pan.position.set(0.5, 0.40, 0.25);
    scene.add(pan);
    S.pan = pan;

    // ----- 음식 모형 그룹 (setRecipeFood로 색 변경)
    var foodGroup = new THREE.Group();
    foodGroup.position.set(-0.5, 0.62,-0.25); // 냄비 위
    scene.add(foodGroup);
    S.foodGroup = foodGroup;

    // 기본 음식 메쉬 (구체)
    var foodGeo = new THREE.IcosahedronGeometry(0.18, 1);
    var foodMat = new THREE.MeshStandardMaterial({
      color:S.foodColor, roughness:0.4, metalness:0.1, emissive:0x000000
    });
    var food = new THREE.Mesh(foodGeo, foodMat);
    foodGroup.add(food);
    S.food = food;
    S._geo.food = foodGeo;
    S._mat.food = foodMat;

    // 장식: 작은 큐브 옆에 (도마 느낌)
    var boardGeo = new THREE.BoxGeometry(0.7, 0.04, 0.45);
    var boardMat = new THREE.MeshStandardMaterial({
      color:0xC9A877, roughness:0.7, metalness:0.0
    });
    var board = new THREE.Mesh(boardGeo, boardMat);
    board.position.set(2.0, 0.17, 0.0);
    scene.add(board);

    return scene;
  }

  // -- 카메라 모드별 업데이트
  function updateCamera(dt, t){
    if (!S.camera) return;
    if (S.mode === 'menu'){
      // 카운터 주변 천천히 회전 (반지름 5, 각속도 0.15rad/s, 높이 2)
      S.orbitAngle += 0.15 * dt;
      var r = 5;
      S.camera.position.set(
        Math.sin(S.orbitAngle) * r,
        2.0 + Math.sin(t*0.5)*0.05,
        Math.cos(S.orbitAngle) * r * 0.6
      );
      S.camera.lookAt(0, 0.4, 0);
    } else if (S.mode === 'cooking' || S.mode === 'cooking_dim'){
      // 스토브 정면 약간 위 (0,1.5,3) — 약간의 흔들림
      var sx = Math.sin(t*1.7) * 0.03;
      var sy = Math.sin(t*2.3) * 0.02;
      S.camera.position.set(0 + sx, 1.5 + sy, 3.0);
      S.camera.lookAt(0, 0.4, 0);
    } else if (S.mode === 'result'){
      // 음식 정면 (0,0.5,2) — 음식 회전
      S.camera.position.set(0, 0.5, 2.0);
      // 음식을 카운터 중앙으로 이동시키고 회전
      if (S.foodGroup){
        S.foodGroup.position.x += (0 - S.foodGroup.position.x) * Math.min(1, dt*4);
        S.foodGroup.position.z += (0 - S.foodGroup.position.z) * Math.min(1, dt*4);
        S.foodGroup.position.y += (0.5 - S.foodGroup.position.y) * Math.min(1, dt*4);
        S.foodGroup.rotation.y += 0.5 * dt;
      }
      S.camera.lookAt(0, 0.5, 0);
    }
  }

  // -- 라이팅 모드별 업데이트
  function updateLights(dt){
    if (!S.stoveLight) return;
    var isCook = (S.mode === 'cooking' || S.mode === 'cooking_dim');
    var target = isCook ? 1.0 : 0.0;
    S.stoveLight.intensity += (target - S.stoveLight.intensity) * Math.min(1, dt*3);
    // 약간의 깜빡임
    if (isCook){
      S.stoveLight.intensity *= 0.96 + Math.random()*0.08;
    }
  }

  // -- 음식 모형 부드럽게 이동(카운터 위)
  function updateFoodPosition(dt){
    if (!S.foodGroup) return;
    if (S.mode === 'menu'){
      // 카운터 위 약간 떠 있는 형태
      S.foodGroup.position.x += (-0.5 - S.foodGroup.position.x) * Math.min(1, dt*2);
      S.foodGroup.position.z += (-0.25 - S.foodGroup.position.z) * Math.min(1, dt*2);
      S.foodGroup.position.y += (0.62 - S.foodGroup.position.y) * Math.min(1, dt*2);
      S.foodGroup.rotation.y += 0.2 * dt;
    } else if (S.mode === 'cooking' || S.mode === 'cooking_dim'){
      S.foodGroup.position.x += (-0.5 - S.foodGroup.position.x) * Math.min(1, dt*2);
      S.foodGroup.position.z += (-0.25 - S.foodGroup.position.z) * Math.min(1, dt*2);
      S.foodGroup.position.y += (0.62 - S.foodGroup.position.y) * Math.min(1, dt*2);
      // 끓는 효과 (작은 진동)
      S.foodGroup.position.y += Math.sin(performance.now()*0.005)*0.01;
      S.foodGroup.rotation.y += 0.3 * dt;
    }
  }

  // ============================================================
  //   API
  // ============================================================

  function init(opts){
    opts = opts || {};
    var sel = opts.canvasSelector || '#gl3d';
    var canvas = document.querySelector(sel);
    if (!canvas){
      console.warn('[Kitchen3D] canvas '+sel+' not found.');
      S.supported = false;
      return;
    }
    S.canvas = canvas;

    // WebGL 미지원 검사
    var ok = false;
    try {
      var test = document.createElement('canvas');
      ok = !!(window.WebGLRenderingContext &&
        (test.getContext('webgl') || test.getContext('experimental-webgl')));
    } catch(e){ ok = false; }
    if (!ok){
      console.warn('[Kitchen3D] WebGL not supported — disabling 3D background.');
      S.supported = false;
      return;
    }

    try {
      var renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance'
      });
      // 모바일 dpr cap 1.5
      var isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      var capDpr = isMobile ? 1.5 : 2.0;
      var dpr = Math.min(window.devicePixelRatio || 1, capDpr);
      S.dpr = dpr;
      renderer.setPixelRatio(dpr);
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      if (THREE.SRGBColorSpace) renderer.outputColorSpace = THREE.SRGBColorSpace;
      if (THREE.ACESFilmicToneMapping !== undefined){
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
      }
      S.renderer = renderer;

      S.scene = buildScene();
      S.camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / Math.max(1, window.innerHeight),
        0.1, 100
      );
      S.camera.position.set(0, 2, 5);
      S.camera.lookAt(0, 0.4, 0);

      S.clock = new THREE.Clock();
      S.W = window.innerWidth;
      S.H = window.innerHeight;
      S.ready = true;
    } catch(err){
      console.warn('[Kitchen3D] init failed:', err);
      S.supported = false;
      S.ready = false;
    }
  }

  function resize(W, H, dpr){
    if (!S.ready || !S.supported) return;
    var w = W || window.innerWidth;
    var h = H || window.innerHeight;
    S.W = w; S.H = h;
    if (dpr){
      var isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      var capDpr = isMobile ? 1.5 : 2.0;
      S.dpr = Math.min(dpr, capDpr);
      S.renderer.setPixelRatio(S.dpr);
    }
    S.renderer.setSize(w, h, false);
    S.camera.aspect = w / Math.max(1, h);
    S.camera.updateProjectionMatrix();
  }

  function setMode(mode){
    if (!S.ready || !S.supported) return;
    if (mode === 'menu' || mode === 'cooking' || mode === 'cooking_dim' || mode === 'result' || mode === 'hidden'){
      S.mode = mode;
      if (S.canvas){
        S.canvas.style.visibility = (mode === 'hidden') ? 'hidden' : 'visible';
      }
      // 요리(dim) 중에는 조리도구/음식 3D 메쉬를 숨겨 2D 팬과 겹치는 '유령 냄비' 제거
      var hideCookware = (mode === 'cooking_dim');
      if (S.pot)       S.pot.visible       = !hideCookware;
      if (S.pan)       S.pan.visible       = !hideCookware;
      if (S.foodGroup) S.foodGroup.visible = !hideCookware;
    }
  }

  function setRecipeFood(emoji){
    if (!S.ready || !S.supported) return;
    S.currentEmoji = emoji;
    var col = colorOf(emoji);
    S.foodColor = col;
    if (S._mat.food && S._mat.food.color){
      S._mat.food.color.setHex(col);
    }
    // 모양 가벼운 변형: 라면=납작, 떡볶이=큐브, 계란=타원, 그 외 기본
    if (S.food && S.foodGroup){
      // 기존 음식 메쉬 제거 후 재생성 (지오메트리 교체)
      S.foodGroup.remove(S.food);
      if (S.food.geometry && S.food.geometry !== S._geo.food){
        S.food.geometry.dispose();
      }
      var newGeo;
      if (emoji === '🍜' || emoji === '🍝'){
        newGeo = new THREE.CylinderGeometry(0.2, 0.18, 0.08, 18); // 납작 면
      } else if (emoji === '🌶️' || emoji === '🥩'){
        newGeo = new THREE.BoxGeometry(0.28, 0.18, 0.28); // 큐브 (떡볶이/스테이크)
      } else if (emoji === '🍳' || emoji === '🥚'){
        newGeo = new THREE.SphereGeometry(0.18, 18, 14);
        // 계란은 살짝 납작하게
        newGeo.scale(1.2, 0.7, 1.2);
      } else if (emoji === '🍙' || emoji === '🍚'){
        newGeo = new THREE.SphereGeometry(0.18, 16, 12);
      } else {
        newGeo = new THREE.IcosahedronGeometry(0.18, 1);
      }
      var newMesh = new THREE.Mesh(newGeo, S._mat.food);
      S.foodGroup.add(newMesh);
      S.food = newMesh;
    }
  }

  function render(time){
    if (!S.ready || !S.supported) return;
    if (S.mode === 'hidden') return;
    var dt = S.clock ? Math.min(0.05, S.clock.getDelta()) : 0.016;
    var t  = (typeof time === 'number') ? time*0.001 : performance.now()*0.001;
    updateCamera(dt, t);
    updateLights(dt);
    updateFoodPosition(dt);
    S.renderer.render(S.scene, S.camera);
  }

  function dispose(){
    try {
      if (S.scene){
        S.scene.traverse(function(obj){
          if (obj.geometry && obj.geometry.dispose) obj.geometry.dispose();
          if (obj.material){
            var mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach(function(m){
              if (m.map && m.map.dispose) m.map.dispose();
              if (m.dispose) m.dispose();
            });
          }
        });
      }
      if (S.renderer && S.renderer.dispose) S.renderer.dispose();
    } catch(e){ /* swallow */ }
    S.ready = false;
    S.scene = null;
    S.renderer = null;
    S.camera = null;
  }

  // -- 노출 (shaders.js 등 외부 모듈이 renderer/scene을 공유받을 수 있도록 getter 제공)
  window.Kitchen3D = {
    init: init,
    resize: resize,
    setMode: setMode,
    setRecipeFood: setRecipeFood,
    render: render,
    dispose: dispose,
    get _renderer(){ return S.renderer; },
    get _scene(){ return S.scene; },
    get _ready(){ return S.ready && S.supported; }
  };

})();
