// ============================================================
// UNIFIED v4 - PLATFORMER ENGINE = 별빛 대모험 v2 전체 포팅
// v2(hatcuping-game-v2.html)의 플레이 시스템을 그대로 이식:
//  - 10레벨(3월드+보너스), 4캐릭터(로미 기본), 파워업 4종, 보스 3회
//  - 2단점프/월슬라이드/대시(월드별 해금), 파티클, 사운드
// 공개 API: window.PlatformerEngine.start({ startLevel, onClear, character? })
//            / update() / render(ctx,W,H) / handleInput(x,y,kind)
//            / onEnter(opts) / onExit() / stop()
// ============================================================
(function(){
  'use strict';

  const W = 420, H = 750;
  const PW = 38, PH = 88, GR = 0.5, MXF = 11;

  // ===== WEB AUDIO SOUND SYSTEM (v2 원본) =====
  let _actx, _mute = false;
  function _initAudio(){
    if(!_actx) try{ _actx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return; }
    if(_actx && _actx.state === 'suspended') _actx.resume();
  }
  function _osc(freq, type, dur, vol){
    vol = (vol==null?0.3:vol);
    if(_mute || !_actx) return null;
    try{
      const o = _actx.createOscillator(), g = _actx.createGain();
      o.type = type; o.frequency.value = freq; g.gain.value = vol;
      o.connect(g); g.connect(_actx.destination);
      o.start(); o.stop(_actx.currentTime + dur);
      return { o, g, t: _actx.currentTime };
    }catch(e){ return null; }
  }
  function sfxJump(freq){ _initAudio(); if(_mute||!_actx) return; const f = freq||300; const o=_osc(f,'sine',0.1,0.25); if(o) o.o.frequency.exponentialRampToValueAtTime(f*2,_actx.currentTime+0.08); }
  function sfxDoubleJump(){ _initAudio(); if(_mute||!_actx) return; const o=_osc(500,'sine',0.12,0.2); if(o) o.o.frequency.exponentialRampToValueAtTime(900,_actx.currentTime+0.1); _osc(1200,'triangle',0.06,0.1); }
  function sfxDash(){ _initAudio(); if(_mute||!_actx) return; _osc(200,'sawtooth',0.15,0.15); _osc(400,'sine',0.1,0.1); }
  function sfxWallSlide(){ _initAudio(); if(_mute||!_actx) return; _osc(150,'sine',0.05,0.08); }
  function sfxJumpCutoff(){ _initAudio(); if(_mute||!_actx) return; const o=_osc(700,'sine',0.05,0.1); if(o) o.o.frequency.exponentialRampToValueAtTime(300,_actx.currentTime+0.04); }
  function sfxHeart(){ _initAudio(); if(_mute||!_actx) return; [0,0.06,0.12].forEach((d,i)=>{ const f=[800,1200,1600][i]; setTimeout(()=>_osc(f,'sine',0.08,0.15), d*1000); }); }
  function sfxStar(){ _initAudio(); if(_mute||!_actx) return; [0,0.05,0.1].forEach((d,i)=>{ const f=[1000,1400,1800][i]; setTimeout(()=>_osc(f,'triangle',0.06,0.12), d*1000); }); }
  function sfxPowerup(){ _initAudio(); if(_mute||!_actx) return; [0,0.08,0.16,0.24].forEach((d,i)=>{ const f=[523,659,784,1047][i]; setTimeout(()=>_osc(f,'sine',0.15,0.2), d*1000); }); }
  function sfxEnemyHit(){ _initAudio(); if(_mute||!_actx) return; const o=_osc(400,'square',0.15,0.2); if(o) o.o.frequency.exponentialRampToValueAtTime(80,_actx.currentTime+0.12); }
  function sfxDamage(){ _initAudio(); if(_mute||!_actx) return; _osc(150,'sawtooth',0.2,0.25); _osc(80,'square',0.2,0.15); }
  function sfxLevelClear(){ _initAudio(); if(_mute||!_actx) return; [0,0.15,0.3,0.45,0.6].forEach((d,i)=>{ const f=[523,659,784,1047,1319][i]; setTimeout(()=>_osc(f,'sine',0.2,0.18), d*1000); }); }
  function sfxBossHit(){ _initAudio(); if(_mute||!_actx) return; _osc(200,'square',0.2,0.25); _osc(100,'sawtooth',0.15,0.2); }

  // ===== HELPERS =====
  function heart(c,x,y,s,col){ c.save(); c.translate(x,y); c.scale(s/16,s/16); c.fillStyle=col; c.beginPath(); c.moveTo(0,-4); c.bezierCurveTo(-8,-14,-18,-4,-8,4); c.lineTo(0,12); c.moveTo(0,-4); c.bezierCurveTo(8,-14,18,-4,8,4); c.lineTo(0,12); c.fill(); c.restore(); }
  function star(c,x,y,s,col){ c.save(); c.translate(x,y); c.fillStyle=col; c.beginPath(); for(let i=0;i<5;i++){ const a=Math.PI*2*i/5-Math.PI/2; const b=Math.PI*2*(i+0.5)/5-Math.PI/2; c.lineTo(Math.cos(a)*s,Math.sin(a)*s); c.lineTo(Math.cos(b)*s*0.4,Math.sin(b)*s*0.4); } c.closePath(); c.fill(); c.restore(); }
  function rr(c,x,y,w,h,r,f,s){ c.beginPath(); c.moveTo(x+r,y); c.lineTo(x+w-r,y); c.quadraticCurveTo(x+w,y,x+w,y+r); c.lineTo(x+w,y+h-r); c.quadraticCurveTo(x+w,y+h,x+w-r,y+h); c.lineTo(x+r,y+h); c.quadraticCurveTo(x,y+h,x,y+h-r); c.lineTo(x,y+r); c.quadraticCurveTo(x,y,x+r,y); c.closePath(); if(f){ c.fillStyle=f; c.fill(); } if(s){ c.strokeStyle=s; c.lineWidth=2; c.stroke(); } }
  function rng(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
  function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
  function sin(v){ return Math.sin(v); }
  function FN(s){ return s+'px "Jua",sans-serif'; }

  // ===== CHARACTERS (마리오감 강화: jmp 수치 +25%, 캐릭터별 점프음 톤) =====
  const CHARACTERS = [
    { id:'romi',   name:'로미',   desc:'균형잡힌 능력!',    spr:'rs', portrait:'rp', color:'#FF6B9D', spd:3.0, jmp:-11.5, jmpFreq:300, special:'하트 파워' },
    { id:'hatchu', name:'하츄핑', desc:'빠르고 높이 점프!', spr:'hs', portrait:'hp', color:'#FF69B4', spd:3.4, jmp:-12.5, jmpFreq:420, special:'사랑의 힘' },
    { id:'baro',   name:'바로핑', desc:'튼튼하고 강해!',    spr:'ba', portrait:'ba', color:'#FFD700', spd:2.8, jmp:-11.0, jmpFreq:220, special:'정의 펀치' },
    { id:'chacha', name:'차차핑', desc:'불꽃처럼 빨라!',    spr:'ch', portrait:'ch', color:'#FF6347', spd:3.6, jmp:-11.0, jmpFreq:360, special:'불꽃 대시' },
  ];

  // ===== HAPTIC (모바일 진동 — 데스크탑 무시) =====
  function hap(ms){ try{ if(navigator.vibrate) navigator.vibrate(ms); }catch(e){} }

  // ===== LEVELS (v2 원본 10레벨 — bg 키만 unified로 매핑) =====
  // v2: castle/forest/dark → unified drawPlayBG에서 unified 키로 변환
  const LEVELS = [];
  // World 1: Castle (3 levels)
  LEVELS.push({ name:'왕궁 1층', bg:'castle', sx:80, sy:430, endX:3200, world:1,
    plat:[[0,520,600,40,0],[620,520,500,40,0],[1140,520,500,40,0],[1660,520,500,40,0],[2180,520,500,40,0],[2700,520,600,40,0],
      [250,460,100,16,1],[450,420,100,16,1],[700,460,120,16,1],[950,400,120,16,1],[1200,460,100,16,1],[1450,420,100,16,1],[1700,460,120,16,1],[1950,400,100,16,1],[2250,460,100,16,1],[2500,420,120,16,1],[2800,460,100,16,1],[3050,420,100,16,1]],
    items:[[300,430,0],[500,390,0],[760,430,0],[1010,370,0],[1260,430,0],[1510,390,0],[1760,430,0],[2010,370,0],[2310,430,0],[2560,390,0],[2860,430,0],[3110,390,0]],
    stars:[[450,380,1],[950,360,1],[1700,420,1],[2500,380,1],[3050,380,1]],
    enemies:[[400,490,0],[900,490,0],[1400,490,0],[1900,490,0],[2400,490,0],[2900,490,0]],
    powerups:[[700,380,0]], npcs:[] });
  LEVELS.push({ name:'왕궁 2층', bg:'castle', sx:80, sy:430, endX:3600, world:1,
    plat:[[0,520,500,40,0],[520,520,500,40,0],[1040,520,500,40,0],[1560,520,500,40,0],[2080,520,500,40,0],[2600,520,500,40,0],[3120,520,600,40,0],
      [200,460,80,16,1],[380,410,90,16,1],[560,450,100,16,1],[750,400,80,16,1],[950,350,100,16,1],[1150,460,90,16,1],[1380,400,100,16,1],[1600,450,80,16,1],[1800,390,100,16,1],[2050,440,80,16,1],[2250,380,100,16,1],[2500,430,80,16,1],[2700,370,100,16,1],[2950,430,80,16,1],[3200,400,100,16,1],[3450,440,80,16,1]],
    items:[[250,420,0],[440,380,0],[620,420,0],[810,370,0],[1010,320,0],[1210,430,0],[1440,370,0],[1660,420,0],[1860,360,0],[2110,410,0],[2310,350,0],[2560,400,0],[2760,340,0],[3010,400,0],[3260,370,0],[3510,410,0]],
    stars:[[380,370,1],[950,310,1],[1600,410,1],[2250,340,1],[2950,390,1],[3450,400,1]],
    enemies:[[350,490,0],[750,490,0],[1100,490,0],[1500,490,0],[1900,490,0],[2400,490,0],[2800,490,0],[3300,490,0]],
    powerups:[[1200,380,1]], npcs:[] });
  LEVELS.push({ name:'왕궁 옥상', bg:'castle', sx:80, sy:430, endX:3000, world:1, boss:true,
    plat:[[0,520,600,40,0],[620,520,500,40,0],[1140,520,500,40,0],[1660,520,500,40,0],[2180,520,500,40,0],[2700,520,400,40,0],
      [300,460,100,16,1],[550,410,120,16,1],[800,460,80,16,1],[1050,400,100,16,1],[1350,450,80,16,1],[1600,400,100,16,1],[1900,450,100,16,1],[2200,400,80,16,1],[2500,450,100,16,1],[2750,400,80,16,1]],
    items:[[360,430,0],[610,380,0],[860,430,0],[1110,370,0],[1410,420,0],[1660,370,0],[1960,420,0],[2260,370,0],[2560,420,0],[2810,370,0]],
    stars:[[550,370,1],[1350,410,1],[2200,360,1]],
    enemies:[[500,490,0],[1000,490,0],[1500,490,0],[2000,490,0]],
    powerups:[[800,380,2]], npcs:[] });
  // World 2: Forest (3 levels)
  LEVELS.push({ name:'밝은 숲', bg:'forest', sx:80, sy:430, endX:3500, world:2,
    plat:[[0,520,500,40,2],[520,520,500,40,2],[1040,520,400,40,2],[1540,520,500,40,2],[2060,520,500,40,2],[2580,520,500,40,2],[3100,520,500,40,2],
      [250,450,100,16,3],[480,390,120,16,3],[720,440,80,16,3],[960,370,100,16,3],[1200,440,100,16,3],[1500,380,80,16,3],[1750,440,100,16,3],[2000,370,120,16,3],[2300,430,80,16,3],[2550,370,100,16,3],[2800,430,80,16,3],[3100,380,100,16,3],[3350,430,80,16,3]],
    items:[[310,420,0],[540,360,0],[780,410,0],[1020,340,0],[1260,410,0],[1560,350,0],[1810,410,0],[2060,340,0],[2360,400,0],[2610,340,0],[2860,400,0],[3160,350,0],[3410,400,0]],
    stars:[[480,350,1],[960,330,1],[1750,400,1],[2550,330,1],[3100,340,1]],
    enemies:[[400,490,1],[850,490,1],[1300,490,1],[1800,490,1],[2300,490,1],[2750,490,1],[3200,490,1]],
    powerups:[[1200,360,0],[2550,290,3]],
    npcs:[[600,460,'ba','나는 바로핑!\n용기를 내!']] });
  LEVELS.push({ name:'깊은 숲', bg:'forest', sx:80, sy:430, endX:3800, world:2,
    plat:[[0,520,400,40,2],[420,520,500,40,2],[940,520,400,40,2],[1400,520,500,40,2],[1920,520,400,40,2],[2380,520,500,40,2],[2900,520,500,40,2],[3420,520,500,40,2],
      [200,450,80,16,3],[400,380,100,16,3],[650,440,80,16,3],[880,360,100,16,3],[1100,440,80,16,3],[1350,370,100,16,3],[1600,430,80,16,3],[1850,360,100,16,3],[2100,440,80,16,3],[2350,370,100,16,3],[2600,430,80,16,3],[2850,360,100,16,3],[3100,430,80,16,3],[3350,370,100,16,3],[3600,430,80,16,3]],
    items:[[260,420,0],[460,350,0],[710,410,0],[940,330,0],[1160,410,0],[1410,340,0],[1660,400,0],[1910,330,0],[2160,410,0],[2410,340,0],[2660,400,0],[2910,330,0],[3160,400,0],[3410,340,0],[3660,400,0]],
    stars:[[400,340,1],[880,320,1],[1600,390,1],[2350,330,1],[2850,320,1],[3350,330,1]],
    enemies:[[350,490,1],[700,490,1],[1050,490,1],[1450,490,1],[1800,490,1],[2200,490,1],[2650,490,1],[3050,490,1],[3450,490,1]],
    powerups:[[940,280,1],[2100,360,2]],
    npcs:[[1500,460,'ch','차차핑이다!\n화이팅!']] });
  LEVELS.push({ name:'숲의 끝', bg:'forest', sx:80, sy:430, endX:3200, world:2, boss:true,
    plat:[[0,520,500,40,2],[520,520,500,40,2],[1040,520,500,40,2],[1560,520,500,40,2],[2080,520,500,40,2],[2600,520,700,40,2],
      [250,460,100,16,3],[500,400,100,16,3],[800,460,80,16,3],[1100,400,100,16,3],[1400,450,80,16,3],[1700,400,100,16,3],[2050,450,80,16,3],[2350,400,100,16,3],[2650,450,80,16,3],[2900,400,100,16,3]],
    items:[[310,430,0],[560,370,0],[860,430,0],[1160,370,0],[1460,420,0],[1760,370,0],[2110,420,0],[2410,370,0],[2710,420,0],[2960,370,0]],
    stars:[[500,360,1],[1400,410,1],[2350,360,1]],
    enemies:[[450,490,1],[950,490,1],[1500,490,1],[2000,490,1]],
    powerups:[[1100,320,3]], npcs:[] });
  // World 3: Dark (3 levels)
  LEVELS.push({ name:'어둠의 입구', bg:'dark', sx:80, sy:430, endX:3400, world:3,
    plat:[[0,520,500,40,4],[520,520,400,40,4],[980,520,500,40,4],[1500,520,500,40,4],[2020,520,400,40,4],[2480,520,500,40,4],[3000,520,500,40,4],
      [200,450,80,16,5],[420,380,100,16,5],[680,440,80,16,5],[920,360,100,16,5],[1180,440,80,16,5],[1450,370,100,16,5],[1700,440,80,16,5],[1950,360,100,16,5],[2200,440,80,16,5],[2450,370,100,16,5],[2700,430,80,16,5],[2950,370,100,16,5],[3200,430,80,16,5]],
    items:[[260,420,0],[480,350,0],[740,410,0],[980,330,0],[1240,410,0],[1510,340,0],[1760,410,0],[2010,330,0],[2260,410,0],[2510,340,0],[2760,400,0],[3010,340,0],[3260,400,0]],
    stars:[[420,340,1],[920,320,1],[1700,400,1],[2450,330,1],[2950,330,1]],
    enemies:[[350,490,2],[750,490,2],[1150,490,2],[1600,490,2],[2050,490,2],[2500,490,2],[2900,490,2],[3250,490,2]],
    powerups:[[680,360,0],[1950,280,2]], npcs:[] });
  LEVELS.push({ name:'어둠의 통로', bg:'dark', sx:80, sy:430, endX:3600, world:3,
    plat:[[0,520,400,40,4],[420,520,500,40,4],[940,520,400,40,4],[1400,520,500,40,4],[1920,520,400,40,4],[2380,520,500,40,4],[2900,520,400,40,4],[3320,520,400,40,4],
      [180,440,80,16,5],[400,370,100,16,5],[650,430,80,16,5],[880,350,100,16,5],[1100,430,80,16,5],[1350,360,100,16,5],[1580,430,80,16,5],[1830,350,100,16,5],[2080,430,80,16,5],[2350,360,100,16,5],[2580,420,80,16,5],[2830,350,100,16,5],[3080,420,80,16,5],[3330,360,100,16,5]],
    items:[[240,410,0],[460,340,0],[710,400,0],[940,320,0],[1160,400,0],[1410,330,0],[1640,400,0],[1890,320,0],[2140,400,0],[2410,330,0],[2640,390,0],[2890,320,0],[3140,390,0],[3390,330,0]],
    stars:[[400,330,1],[880,310,1],[1580,390,1],[2350,320,1],[2830,310,1],[3330,320,1]],
    enemies:[[300,490,2],[650,490,2],[1000,490,2],[1400,490,2],[1780,490,2],[2200,490,2],[2600,490,2],[3000,490,2],[3350,490,2]],
    powerups:[[880,270,1],[1830,270,3]], npcs:[] });
  LEVELS.push({ name:'라미엔느 성', bg:'dark', sx:80, sy:430, endX:3400, world:3, boss:true,
    plat:[[0,520,600,40,4],[620,520,500,40,4],[1140,520,500,40,4],[1660,520,500,40,4],[2180,520,500,40,4],[2700,520,800,40,4],
      [300,460,100,16,5],[550,400,120,16,5],[800,460,80,16,5],[1100,400,100,16,5],[1400,450,80,16,5],[1700,400,100,16,5],[2000,450,80,16,5],[2300,400,100,16,5],[2600,450,80,16,5],[2850,400,100,16,5],[3100,450,80,16,5]],
    items:[[360,430,0],[610,370,0],[860,430,0],[1160,370,0],[1460,420,0],[1760,370,0],[2060,420,0],[2360,370,0],[2660,420,0],[2910,370,0],[3160,420,0]],
    stars:[[550,360,1],[1400,410,1],[2300,360,1],[2850,360,1]],
    enemies:[[500,490,2],[1000,490,2],[1500,490,2],[2000,490,2],[2500,490,2]],
    powerups:[[1100,320,2],[2300,320,0]], npcs:[] });
  // Level 10: Bonus
  LEVELS.push({ name:'비밀 정원', bg:'forest', sx:80, sy:430, endX:4000, world:4,
    plat:[[0,520,600,40,2],[620,520,600,40,2],[1240,520,600,40,2],[1860,520,600,40,2],[2480,520,600,40,2],[3100,520,600,40,2],[3720,520,400,40,2],
      [300,460,120,16,3],[600,420,120,16,3],[900,460,120,16,3],[1200,420,120,16,3],[1500,460,120,16,3],[1800,420,120,16,3],[2100,460,120,16,3],[2400,420,120,16,3],[2700,460,120,16,3],[3000,420,120,16,3],[3300,460,120,16,3],[3600,420,120,16,3]],
    items:[[360,430,0],[660,390,0],[960,430,0],[1260,390,0],[1560,430,0],[1860,390,0],[2160,430,0],[2460,390,0],[2760,430,0],[3060,390,0],[3360,430,0],[3660,390,0],[150,490,0],[450,490,0],[750,490,0],[1050,490,0],[1350,490,0],[1650,490,0],[1950,490,0],[2250,490,0],[2550,490,0],[2850,490,0],[3150,490,0],[3450,490,0]],
    stars:[[600,380,1],[1200,380,1],[1800,380,1],[2400,380,1],[3000,380,1],[3600,380,1]],
    enemies:[], powerups:[[500,380,3],[1500,380,1],[2500,380,0],[3500,380,2]],
    npcs:[[500,460,'ba','축하해!\n전부 클리어했어!'],[1800,460,'ch','대단해!\n최고야!']] });

  // ===== POWERUP TYPES =====
  const PU_NAMES   = ['보호막','스피드 업','무적 별','자석'];
  const PU_COLORS  = ['#4FC3F7','#76FF03','#FFD700','#E040FB'];
  const PU_DUR     = [480,360,300,420];

  // ===== STORY CUTSCENES (v2 원본, 레벨 전환시) =====
  const ST_W2    = [ { bg:'bg_forest',      sp:'', tx:'숲 속의 모험!\n\n새로운 능력 해금!\n더블 점프를 사용할 수 있어!' } ];
  const ST_W3    = [ { bg:'bg_forest_deep', sp:'', tx:'벽 슬라이드 해금!\n벽에 붙어서 미끄러질 수 있어!' } ];
  const ST_BOSS1 = [ { bg:'bg_forest_dark', sp:'트러핑', tx:'크크크... 여기서 막아주지!' } ];
  const ST_W4    = [ { bg:'bg_forest_dark', sp:'', tx:'어둠의 성!\n대시 능력 해금!' } ];
  const ST_BOSS2 = [ { bg:'bg_forest_dark', sp:'트러핑', tx:'또 왔어?! 이번엔 더 강해졌다!' } ];
  const ST_BOSS3 = [ { bg:'bg_forest_dark', sp:'트러핑', tx:'이번엔 진짜야!\n최후의 힘을 보여주지!' } ];
  const ST_BONUS = [ { bg:'bg_forest',      sp:'하츄핑', tx:'로미! 한 곳만 더 가볼까?\n비밀 정원이 있대!' } ];

  // ===== STATE =====
  let scr = 'play';           // 'play' | 'story' | 'levelclear' | 'ending'
  let t = 0, ticks = 0;
  let lv = 0, lives = 7, hts = 0, starCount = 0;
  let chosenChar = null;
  let hasDoubleJump = false, hasWallSlide = false, hasDash = false;

  const P = { x:0, y:0, vx:0, vy:0, gr:false, face:1, dead:false,
    djump:false, canDJ:false, wallSlide:false,
    dashCD:0, dashing:false, dashT:0, dashDir:0,
    shieldT:0, speedT:0, magnetT:0, invincT:0, coyoteT:0,
    _squash:0, _stretch:1, _jumpHoldT:0 };

  let camX = 0;
  let _shakeT = 0, _shakeMag = 0;
  let parts = [], enemies_l = [], items_l = [], powerups_l = [], stars_l = [], npcs_l = [];
  let boss = { hp:0, mx:0, x:0, y:0, dir:1, active:false, atk:0, atkT:0, phase:0 };
  let hatchuShield = true;
  let npcMsg = '', npcT = 0, lvDone = false, lvDoneT = 0;

  // 스토리
  let stQ = [], stI = 0, stTx = '', stDn = false, stTm = null, stCb = null;
  // 트랜지션
  let trA = 0, trD = 0, trNx = null;

  // 입력
  const keys = {};
  let tL = false, tR = false, tJ = false, tDash = false;
  let _jumpPrev = false;

  // 활성/종료
  let _active = false;
  let _onClear = null;    // 전체 완주(보너스까지) 완료 콜백
  let _touchRects = null;
  let _LEVELS = LEVELS;   // 사용 중인 레벨 세트 (기본: v2 10레벨, ACT2 등 외부 opts.levels 있을 시 어댑터 통과 후 교체)
  let _extMode = false;   // true = ACT2처럼 외부 레벨 사용 (v2 월드 전환/보너스 스토리 생략)

  // 외부(ACT2) 레벨 포맷 → v2 포맷 어댑터
  //  ACT2: { id,title,bg,spawn:{x,y},worldW,platforms:[{x,y,w,h,type}], hazards:[], enemies:[{x,y,kind}], goal, boss:{x,y} }
  //  v2  : { name,bg('castle'|'forest'|'dark'),sx,sy,endX,world,boss:bool, plat:[[x,y,w,h,tp]], items/stars/enemies/powerups/npcs }
  function _adaptExtLevels(ext){
    const bgMap = {
      'bg_castle':'castle', 'bg_corridor':'castle', 'bg_roof':'castle', 'bg_plaza':'castle',
      'bg_forest':'forest', 'bg_forest_deep':'forest', 'bg_forest_dark':'dark'
    };
    const kindMap = { guard_s:0, guard_l:0, raven:1, bat:1, dark:2 };
    return ext.map((ex, i) => {
      const plat = (ex.platforms || []).map(p => [p.x, p.y, p.w, p.h, 0]);
      // 위험구역(spike)을 v2에서 적(type 2)로 치환 — 가시 밟으면 피해
      const hazardEnemies = (ex.hazards || []).map(h => [h.x + (h.w/2) - 15, h.y - 10, 2]);
      const enemies = (ex.enemies || []).map(e => [e.x, e.y, kindMap[e.kind] || 0])
                      .concat(hazardEnemies);
      // sy 자동 보정: ACT2는 PH=48 기준, v2는 PH=88 → 스폰 지점의 바닥 위로 밀어올림
      const sx = (ex.spawn && ex.spawn.x) || 40;
      let sy = (ex.spawn && ex.spawn.y) || 430;
      const ground = plat.find(p => p[0] <= sx && p[0] + p[2] > sx && p[1] > 300);
      if(ground) sy = ground[1] - PH - 6;   // 바닥 바로 위 (6px 갭)
      // 적/보스도 PH-델타만큼 위로 올려 바닥에 맞춤
      const dy = 88 - 48;
      const fixedEnemies = enemies.map(e => [e[0], e[1] - dy, e[2]]);
      return {
        name: ex.title || ex.id || ('Stage '+ (i+1)),
        bg: bgMap[ex.bg] || 'castle',
        sx: sx,
        sy: sy,
        endX: ex.worldW || 2400,
        world: 2,                 // 2단점프/월슬라이드 해금
        boss: !!ex.boss,
        plat: plat,
        items: [], stars: [], powerups: [], npcs: [],
        enemies: fixedEnemies
      };
    });
  }

  // ===== 전역 키보드 (한 번만 등록) =====
  if(!window._PF_KEYS_BOUND){
    window.addEventListener('keydown', e => {
      if(!_active) return;
      keys[e.key] = true;
      if(scr === 'story' && (e.key === ' ' || e.key === 'Enter')) advSt();
    });
    window.addEventListener('keyup', e => { keys[e.key] = false; });
    window._PF_KEYS_BOUND = true;
  }

  // ===== INIT LEVEL =====
  function initLv(i){
    const L = _LEVELS[i]; if(!L) return;
    P.x = L.sx; P.y = L.sy; P.vx = 0; P.vy = 0; P.gr = false; P.face = 1; P.dead = false;
    P.djump = false; P.canDJ = false; P.wallSlide = false; P.dashCD = 0; P.dashing = false; P.dashT = 0;
    P.shieldT = 0; P.speedT = 0; P.magnetT = 0; P.invincT = 0; P.coyoteT = 0;
    camX = 0; lvDone = false; lvDoneT = 0;
    hasDoubleJump = L.world >= 2;
    hasWallSlide  = L.world >= 2;
    hasDash       = L.world >= 3;
    enemies_l = L.enemies.map(e => [e[0], e[1], e[2], e[2] === 0 ? 1.0 : e[2] === 1 ? 1.3 : 1.6, e[0] - 50, e[0] + 90, true]);
    items_l    = L.items.map(it => [it[0], it[1], it[2], true]);
    powerups_l = (L.powerups || []).map(p => [p[0], p[1], p[2], true]);
    stars_l    = L.stars ? L.stars.map(st => [st[0], st[1], st[2], true]) : [];
    npcs_l     = L.npcs ? L.npcs.map(n => ({ x:n[0], y:n[1], spr:n[2], dlg:n[3], done:false })) : [];
    parts = []; npcMsg = ''; npcT = 0;
    if(L.boss){
      const bossHp = L.world === 1 ? 5 : L.world === 2 ? 7 : 8;
      boss = { hp:bossHp, mx:bossHp, x:L.endX - 200, y:440, dir:1, active:true, atk:0, atkT:0, phase:0 };
    } else {
      boss = { active:false };
    }
    hatchuShield = true;
  }

  // ===== SCENE FLOW =====
  function doTrans(s, cb){
    clearInterval(stTm); stTm = null;
    trD = 1; trNx = () => { scr = s; if(cb) cb(); trD = -1; };
  }
  function goStory(arr, cb){
    stQ = arr; stI = 0; stTx = ''; stDn = false; stCb = cb;
    doTrans('story', () => typeSt());
  }
  function typeSt(){
    const s = stQ[stI]; if(!s) return;
    stTx = ''; stDn = false;
    let i = 0; const tx = s.tx;
    if(stTm){ clearInterval(stTm); stTm = null; }
    stTm = setInterval(() => {
      if(i < tx.length) stTx = tx.slice(0, ++i);
      else { stDn = true; clearInterval(stTm); stTm = null; }
    }, 22);
  }
  function advSt(){
    if(!stDn){ if(stTm){ clearInterval(stTm); stTm = null; } stTx = stQ[stI].tx; stDn = true; return; }
    stI++;
    if(stI < stQ.length) typeSt();
    else { if(stTm){ clearInterval(stTm); stTm = null; } if(stCb) stCb(); }
  }

  // ===== LEVEL CLEAR FLOW =====
  function onLvClear(){
    // 외부 레벨(ACT2 등): 스토리 없이 순차 진행, 마지막 레벨 클리어 시 onClear 콜백
    if(_extMode){
      if(lv + 1 >= _LEVELS.length){
        _active = false;
        const cb = _onClear; _onClear = null;
        if(cb) try{ cb(); }catch(e){ console.error('[Platformer] onClear err:', e); }
      } else {
        lv++; initLv(lv); doTrans('play');
      }
      return;
    }
    // v2 원본 10레벨 + 월드 전환 스토리 로직
    if(lv === 2){                            // 월드1 끝 → 월드2 가기 전
      goStory(ST_W2.concat(ST_W3), () => { lv = 3; initLv(3); doTrans('play'); });
    } else if(lv === 5){                      // 월드2 끝 → 월드3
      goStory(ST_W4, () => { lv = 6; initLv(6); doTrans('play'); });
    } else if(lv === 8){                      // 월드3 끝 → 보너스
      goStory(ST_BONUS, () => { lv = 9; initLv(9); doTrans('play'); });
    } else if(lv === 9){                      // 보너스 끝 → 엔딩(= 전체 완주)
      _active = false;
      const cb = _onClear; _onClear = null;
      if(cb) try{ cb(); }catch(e){ console.error('[Platformer] onClear err:', e); }
    } else if(_LEVELS[lv + 1] && _LEVELS[lv + 1].boss){
      const stories = [null, null, ST_BOSS1, null, null, ST_BOSS2, null, ST_BOSS3, null, null];
      const st = stories[lv];
      if(st) goStory(st, () => { lv++; initLv(lv); doTrans('play'); });
      else { lv++; initLv(lv); doTrans('play'); }
    } else {
      lv++; initLv(lv); doTrans('play');
    }
  }

  function die(){
    if(P.dead) return;
    P.dead = true; lives--; sfxDamage();
    for(let i=0;i<12;i++) parts.push({ x:P.x + PW/2, y:P.y + PH/2, vx:(Math.random()-0.5)*6, vy:-Math.random()*5-2, l:1, s:rng(3,7), c:'#FF6B9D' });
    setTimeout(() => {
      if(!_active) return;
      if(lives <= 0){
        // 게임오버 → 초기화 + 동일 레벨 재시작 (무한 생존)
        lives = 7; hts = 0; starCount = 0;
        initLv(lv); doTrans('play');
      } else {
        initLv(lv); doTrans('play');
      }
    }, 1200);
  }

  // ===== PLAY UPDATE (v2 updatePlay 이식) =====
  function updatePlay(){
    if(P.dead) return;
    if(lvDone){
      if(lvDoneT > 0){ lvDoneT--; if(lvDoneT <= 0) onLvClear(); }
      return;
    }
    const L = _LEVELS[lv]; if(!L) return;
    const ch = chosenChar || CHARACTERS[0];
    const spd = ch.spd * (P.speedT > 0 ? 1.4 : 1);
    const jmp = ch.jmp;

    let mx = 0;
    if(keys.ArrowLeft || keys.a || keys.A || tL){ mx = -1; P.face = -1; }
    if(keys.ArrowRight || keys.d || keys.D || tR){ mx = 1; P.face = 1; }

    // Dash
    if(hasDash && (tDash || keys.Shift) && P.dashCD <= 0 && !P.dashing){
      P.dashing = true; P.dashT = 12; P.dashDir = P.face; P.dashCD = 60; sfxDash();
      hap([10, 5, 10]);
      _shakeT = Math.max(_shakeT, 4);
      _shakeMag = Math.max(_shakeMag, 3);
      for(let i=0;i<6;i++) parts.push({ x:P.x+PW/2, y:P.y+PH/2, vx:-P.face*(1+Math.random()), vy:(Math.random()-0.5)*2, l:0.6, s:rng(3,5), c:'#FF6B9D' });
    }
    if(P.dashCD > 0) P.dashCD--;
    if(P.dashing){ P.vx = P.dashDir * 7; P.dashT--; if(P.dashT <= 0) P.dashing = false; }
    else P.vx = mx * spd;

    // Wall slide
    P.wallSlide = false;
    if(hasWallSlide && !P.gr && P.vy > 0 && mx !== 0){
      for(const pl of L.plat){
        const px = pl[0], py = pl[1], pw = pl[2], ph = pl[3];
        if(mx > 0 && P.x + PW >= px && P.x + PW <= px + 5 && P.y + PH > py + 3 && P.y < py + ph - 3){ P.wallSlide = true; break; }
        if(mx < 0 && P.x <= px + pw && P.x >= px + pw - 5 && P.y + PH > py + 3 && P.y < py + ph - 3){ P.wallSlide = true; break; }
      }
    }
    if(P.wallSlide){ P.vy = Math.min(P.vy, 2); if(ticks % 15 === 0) sfxWallSlide(); }

    // Coyote time
    if(P.coyoteT > 0 && !P.gr) P.coyoteT--;

    // Jump (키보드 edge-trigger로 홀드시 2단 즉시 소비 방지, 터치는 1회성)
    const jumpKeyHeld = !!(keys.ArrowUp || keys.w || keys.W || keys[' ']);
    const jumpKeyPressed = jumpKeyHeld && !_jumpPrev;
    const jumpKeyReleased = !jumpKeyHeld && _jumpPrev;
    if(jumpKeyReleased && P.vy < -3 && !P.gr) sfxJumpCutoff();
    _jumpPrev = jumpKeyHeld;
    const wantJump = jumpKeyPressed || tJ;
    if(wantJump){
      if(P.gr || P.coyoteT > 0){
        P.vy = jmp; P.gr = false; P.coyoteT = 0; P.canDJ = hasDoubleJump; sfxJump(ch.jmpFreq);
        P._jumpHoldT = 0;       // 가변점프 카운터 리셋
        hap(20);
        tJ = false;
        // 발먼지 파티클 (좌우로 흩뿌림)
        for(let i=0;i<8;i++) parts.push({
          x: P.x + PW/2 + (Math.random()-0.5)*PW,
          y: P.y + PH - 4,
          vx: (Math.random()-0.5)*5,
          vy: -Math.random()*2,
          l: 0.7, s: rng(3,6), c: 'rgba(220,210,200,0.8)'
        });
        P._squash = 1;       // 스쿼시 트리거 (드로우에서 감쇠)
      } else if(P.wallSlide){
        P.vy = jmp * 0.95; P.vx = -mx * spd * 1.8; P.canDJ = false; sfxJump(ch.jmpFreq * 1.2);
        hap(15);
        tJ = false;
        // 벽 점프 파티클
        for(let i=0;i<6;i++) parts.push({
          x: P.x + (P.face>0 ? PW : 0),
          y: P.y + PH/2 + (Math.random()-0.5)*PH,
          vx: -P.face * (Math.random()*3 + 1),
          vy: (Math.random()-0.5)*3,
          l: 0.6, s: rng(2,5), c: 'rgba(255,255,255,0.7)'
        });
      } else if(P.canDJ && !P.djump){
        P.vy = jmp * 0.95; P.djump = true; P.canDJ = false; sfxDoubleJump();
        hap([15, 20, 25]);
        tJ = false;
        // 2단점프: 하트 파티클 링
        for(let i=0;i<10;i++){
          const a = (Math.PI*2*i)/10;
          parts.push({
            x: P.x+PW/2 + Math.cos(a)*8,
            y: P.y+PH/2 + Math.sin(a)*8,
            vx: Math.cos(a)*3,
            vy: Math.sin(a)*3 + 1,
            l: 0.8, s: rng(3,6), c: '#FF6B9D'
          });
        }
        P._squash = 0.8;
      }
    }

    // 가변 점프(홀드 시 중력 반감, 12프레임 캡): 마리오식 짧게/길게 점프
    if(!P.dashing){
      const ascending = P.vy < 0;
      const heldHold = jumpKeyHeld && (P._jumpHoldT < 12);
      if(ascending && heldHold) P._jumpHoldT++;
      const gravFactor = (ascending && heldHold) ? 0.45 : 1;
      P.vy = Math.min(P.vy + GR * gravFactor, MXF);
    }

    P.x += P.vx; P.y += P.vy;
    if(P.gr) P.coyoteT = 8;     // 5 → 8프레임 (관대함↑)
    P.gr = false;

    const _wasGr = P.gr;       // 착지 감지용
    const _vyBefore = P.vy;
    for(const pl of L.plat){
      const px = pl[0], py = pl[1], pw = pl[2], ph = pl[3];
      if(P.x + PW > px + 3 && P.x < px + pw - 3){
        if(P.vy >= 0 && P.y + PH >= py && P.y + PH - P.vy <= py + 5){
          P.y = py - PH; P.vy = 0; P.gr = true; P.djump = false; P.canDJ = hasDoubleJump;
        }
        if(P.vy < 0 && P.y <= py + ph && P.y - P.vy >= py + ph - 3){ P.y = py + ph; P.vy = 0; }
      }
      if(P.y + PH > py + 3 && P.y < py + ph - 3){
        if(P.vx > 0 && P.x + PW > px && P.x + PW - P.vx <= px + 2) P.x = px - PW;
        if(P.vx < 0 && P.x < px + pw && P.x - P.vx >= px + pw - 2) P.x = px + pw;
      }
    }
    // 착지 충격파 (gr=false → true 전환 + 충분한 낙하 속도)
    if(!_wasGr && P.gr && _vyBefore > 4){
      const impact = clamp(_vyBefore / MXF, 0.4, 1);
      hap(Math.floor(impact * 60));
      const n = Math.floor(8 * impact);
      for(let i=0;i<n;i++){
        const ang = (Math.PI * (0.05 + 0.9*Math.random()));
        parts.push({
          x: P.x + PW/2 + (Math.random()-0.5)*PW*0.6,
          y: P.y + PH - 2,
          vx: Math.cos(ang) * (3 + Math.random()*3) * (Math.random()<0.5?-1:1),
          vy: -Math.random() * 3 - 1,
          l: 0.6, s: rng(3,6), c: 'rgba(220,210,200,0.85)'
        });
      }
      // 작은 충격파 링
      parts.push({ x:P.x+PW/2, y:P.y+PH, vx:0, vy:0, l:0.5, s:14, c:'rgba(255,255,255,0.5)', ring:true });
      P._stretch = 1 + impact * 0.4;  // 가로 늘리기
      _shakeT = Math.max(_shakeT, Math.floor(impact * 6));
      _shakeMag = Math.max(_shakeMag, impact * 5);
    }

    if(P.y > 620){ die(); return; }
    P.x = Math.max(0, P.x);

    camX += (P.x - W/3 - camX) * 0.1;
    camX = clamp(camX, 0, Math.max(0, L.endX - W + 100));

    // Powerup timers
    if(P.shieldT > 0) P.shieldT--;
    if(P.speedT  > 0) P.speedT--;
    if(P.magnetT > 0) P.magnetT--;
    if(P.invincT > 0) P.invincT--;

    const magR = P.magnetT > 0 ? 150 : 0;

    // Items (hearts)
    items_l.forEach(it => {
      if(!it[3]) return;
      let dx = P.x + PW/2 - it[0], dy = P.y + PH/2 - it[1];
      if(magR > 0 && Math.sqrt(dx*dx + dy*dy) < magR){ it[0] += dx*0.08; it[1] += dy*0.08; }
      if(Math.abs(dx) < 28 && Math.abs(dy) < 28){
        it[3] = false; hts++; sfxHeart();
        for(let i=0;i<5;i++) parts.push({ x:it[0], y:it[1], vx:(Math.random()-0.5)*4, vy:-Math.random()*3, l:1, s:rng(3,5), c:'#FF6B9D' });
      }
    });

    // Stars
    stars_l.forEach(st => {
      if(!st[3]) return;
      let dx = P.x + PW/2 - st[0], dy = P.y + PH/2 - st[1];
      if(magR > 0 && Math.sqrt(dx*dx + dy*dy) < magR){ st[0] += dx*0.08; st[1] += dy*0.08; }
      if(Math.abs(dx) < 28 && Math.abs(dy) < 28){
        st[3] = false; starCount++; sfxStar();
        for(let i=0;i<8;i++) parts.push({ x:st[0], y:st[1], vx:(Math.random()-0.5)*5, vy:-Math.random()*4, l:1, s:rng(3,6), c:'#FFD700' });
      }
    });

    // Powerups
    powerups_l.forEach(pu => {
      if(!pu[3]) return;
      if(Math.abs(P.x + PW/2 - pu[0]) < 28 && Math.abs(P.y + PH/2 - pu[1]) < 28){
        pu[3] = false; sfxPowerup();
        const tp = pu[2];
        if(tp === 0) P.shieldT = PU_DUR[0];
        if(tp === 1) P.speedT  = PU_DUR[1];
        if(tp === 2) P.invincT = PU_DUR[2];
        if(tp === 3) P.magnetT = PU_DUR[3];
        npcMsg = PU_NAMES[tp] + ' 획득!'; npcT = 120;
        for(let i=0;i<10;i++) parts.push({ x:pu[0], y:pu[1], vx:(Math.random()-0.5)*5, vy:-Math.random()*4, l:1, s:rng(3,7), c:PU_COLORS[tp] });
      }
    });

    // Enemies
    enemies_l.forEach(e => {
      if(!e[6]) return;
      e[0] += e[3];
      if(e[0] <= e[4] || e[0] >= e[5]) e[3] = -e[3];
      if(Math.abs(P.x + PW/2 - e[0] - 15) < 28 && Math.abs(P.y + PH - e[1] - 15) < 28){
        if(P.vy > 0 && P.y + PH < e[1] + 10){
          e[6] = false; P.vy = jmp * 0.6; hts += 2; sfxEnemyHit();
          P.djump = false; P.canDJ = hasDoubleJump;
          for(let i=0;i<8;i++) parts.push({ x:e[0]+15, y:e[1], vx:(Math.random()-0.5)*5, vy:-Math.random()*4, l:1, s:rng(3,7), c:'#FFD700' });
        } else if(P.invincT > 0){
          e[6] = false; hts += 2; sfxEnemyHit();
        } else if(P.shieldT > 0){
          P.shieldT = 0; P.vy = jmp * 0.4; sfxDamage(); npcMsg = '보호막이 깨졌어!'; npcT = 120;
        } else {
          die();
        }
      }
    });

    // NPCs
    npcs_l.forEach(n => {
      if(n.done) return;
      if(Math.abs(P.x + PW/2 - n.x) < 50 && Math.abs(P.y + PH/2 - n.y) < 50){ n.done = true; npcMsg = n.dlg; npcT = 240; }
    });
    if(npcT > 0) npcT--; else npcMsg = '';

    // Boss
    if(boss.active && boss.hp > 0){
      const bspd = 1.5 + ((boss.mx - boss.hp) * 0.4) + (boss.phase * 0.3);
      boss.x += boss.dir * bspd;
      if(boss.x < _LEVELS[lv].endX - 300 || boss.x > _LEVELS[lv].endX - 80) boss.dir = -boss.dir;
      boss.atkT++;
      if(boss.atkT % 70 === 0){
        const bx = boss.x + 32, by = boss.y + 20;
        parts.push({ x:bx, y:by, vx:(P.x - boss.x) > 0 ? 3.5 : -3.5, vy:-0.5, l:2.5, s:10, c:'#7B1FA2', orb:true });
        if(boss.phase >= 1 && boss.atkT % 140 === 0){
          parts.push({ x:bx, y:by, vx:(P.x - boss.x) > 0 ? 2 : -2, vy:-2, l:2.5, s:8, c:'#9C27B0', orb:true });
          parts.push({ x:bx, y:by, vx:(P.x - boss.x) > 0 ? 4 : -4, vy:1, l:2.5, s:8, c:'#9C27B0', orb:true });
        }
      }
      if(Math.abs(P.x + PW/2 - boss.x - 32) < 45 && Math.abs(P.y + PH - boss.y - 40) < 45){
        if(P.vy > 0 && P.y + PH < boss.y + 15){
          boss.hp--; P.vy = jmp * 0.7; sfxBossHit();
          _shakeT = Math.max(_shakeT, 8);
          _shakeMag = Math.max(_shakeMag, 8);
          P.djump = false; P.canDJ = hasDoubleJump;
          if(boss.hp <= Math.floor(boss.mx / 2)) boss.phase = 1;
          for(let i=0;i<10;i++) parts.push({ x:boss.x+32, y:boss.y, vx:(Math.random()-0.5)*6, vy:-Math.random()*5, l:1, s:rng(4,8), c:'#9C27B0' });
          if(boss.hp <= 0){ boss.active = false; lvDone = true; lvDoneT = 90; sfxLevelClear(); }
        } else if(P.invincT > 0){
          boss.hp--; sfxBossHit();
          _shakeT = Math.max(_shakeT, 8);
          _shakeMag = Math.max(_shakeMag, 8);
          if(boss.hp <= 0){ boss.active = false; lvDone = true; lvDoneT = 90; sfxLevelClear(); }
        } else if(P.shieldT > 0){
          P.shieldT = 0; P.vy = jmp * 0.5; P.x -= 50; sfxDamage();
        } else if(hatchuShield){
          hatchuShield = false; P.vy = jmp * 0.5; P.x -= 50; sfxDamage();
          npcMsg = '하츄핑이 대신 맞았어!'; npcT = 240;
        } else {
          npcMsg = '다시 도전!'; npcT = 180;
          setTimeout(() => { if(_active){ initLv(lv); doTrans('play'); } }, 800);
        }
      }
      // Orb collision
      parts.forEach(p => {
        if(!p.orb) return;
        if(Math.abs(P.x + PW/2 - p.x) < 20 && Math.abs(P.y + PH/2 - p.y) < 25){
          p.l = 0;
          if(P.invincT > 0) return;
          if(P.shieldT > 0){ P.shieldT = 0; sfxDamage(); return; }
          if(hatchuShield){ hatchuShield = false; P.vy = jmp * 0.3; sfxDamage(); }
          else { npcMsg = '다시 도전!'; npcT = 180; setTimeout(() => { if(_active){ initLv(lv); doTrans('play'); } }, 800); }
        }
      });
    }

    // 엔드라인 도달 (보스 스테이지 아닌 경우)
    if(!L.boss && P.x >= L.endX - 50){ lvDone = true; lvDoneT = 90; sfxLevelClear(); }

    // Particles
    parts.forEach(p => {
      if(p.ring){ p.s += 1.2; p.l -= 0.05; return; }    // 충격파 링: 커지면서 사라짐
      p.x += p.vx; p.y += p.vy;
      if(!p.orb) p.vy += 0.1;
      p.l -= 0.025;
    });
    parts = parts.filter(p => p.l > 0);
    if(parts.length > 300) parts = parts.slice(-300);
    if(P.gr && Math.abs(P.vx) > 1 && Math.random() < 0.3)
      parts.push({ x:P.x+PW/2, y:P.y+PH, vx:(Math.random()-0.5), vy:-Math.random()*0.8, l:0.4, s:rng(2,3), c:'rgba(150,140,120,0.4)' });
  }

  // ===== RENDER =====
  const _bgGradsCache = { ctx:null };
  function _makeGrads(ctx){
    if(_bgGradsCache.ctx === ctx) return _bgGradsCache;
    const types = {
      castle: [['#E8D5F5',0],['#FFE4F0',0.5],['#D4C1EC',1]],
      forest: [['#87CEEB',0],['#B5EAD7',0.4],['#7EC850',1]],
      dark:   [['#0d0520',0],['#1a0a2e',0.5],['#2d1b4e',1]]
    };
    const out = { ctx };
    for(const k in types){
      const g = ctx.createLinearGradient(0, 0, 0, H);
      types[k].forEach(s => g.addColorStop(s[1], s[0]));
      out[k] = g;
    }
    _bgGradsCache.ctx = ctx;
    _bgGradsCache.castle = out.castle;
    _bgGradsCache.forest = out.forest;
    _bgGradsCache.dark   = out.dark;
    return _bgGradsCache;
  }

  function drawPlayBG(X, type){
    const IM = window.IM || {};
    const G = _makeGrads(X);
    if(type === 'castle'){
      const img = IM.bg_castle;
      if(img && img.naturalWidth){
        const sc = Math.max(W / img.width, H / img.height);
        X.drawImage(img, (W - img.width*sc) / 2, (H - img.height*sc) / 2, img.width*sc, img.height*sc);
      } else { X.fillStyle = G.castle; X.fillRect(0, 0, W, H); }
    } else if(type === 'forest'){
      const img = IM.bg_forest;
      if(img && img.naturalWidth){
        const sc = Math.max(W / img.width, H / img.height);
        X.drawImage(img, (W - img.width*sc) / 2, (H - img.height*sc) / 2, img.width*sc, img.height*sc);
      } else { X.fillStyle = G.forest; X.fillRect(0, 0, W, H); }
      X.fillStyle = 'rgba(255,255,255,0.3)';
      for(let i=0;i<5;i++){
        const cx = (-(camX)*0.04 + i*180 + 30) % (W + 100) - 50, cy = 30 + i*15;
        X.beginPath(); X.arc(cx, cy, 18, 0, Math.PI*2); X.fill();
        X.beginPath(); X.arc(cx + 20, cy - 5, 14, 0, Math.PI*2); X.fill();
      }
    } else if(type === 'dark'){
      const img = IM.bg_forest_dark;
      if(img && img.naturalWidth){
        const sc = Math.max(W / img.width, H / img.height);
        X.drawImage(img, (W - img.width*sc) / 2, (H - img.height*sc) / 2, img.width*sc, img.height*sc);
      } else { X.fillStyle = G.dark; X.fillRect(0, 0, W, H); }
      if(Math.random() < 0.004){ X.fillStyle = 'rgba(180,140,255,0.08)'; X.fillRect(0, 0, W, H); }
    }
  }

  function drawPlat(X, pl){
    const px = pl[0], py = pl[1], pw = pl[2], ph = pl[3], tp = pl[4]||0;
    const sx = px - camX;
    if(sx + pw < -10 || sx > W + 10) return;
    const cols = [
      ['#9988AA','#AA99BB'], ['#8899AA','#99AABB'],
      ['#5D8A30','#6EB844'], ['#8B6914','#A0792C'],
      ['#1a0a2e','#2a1540'], ['#3a2050','#4a2860']
    ];
    const c = cols[tp] || cols[0];
    X.fillStyle = c[0]; X.fillRect(sx, py, pw, ph);
    X.fillStyle = c[1]; X.fillRect(sx, py, pw, 4);
    if(tp === 2){
      X.fillStyle = '#7EC850';
      for(let i=0;i<pw;i+=7) X.fillRect(sx + i, py - 2, 2, 4);
    }
  }

  function drawPlayer(X){
    if(P.dead) X.globalAlpha = 0.3;
    const sx = P.x - camX, sy = P.y;
    const IM = window.IM || {};
    const ch = chosenChar || CHARACTERS[0];
    const img = IM[ch.spr];
    // 시각 스케일: 1.0× (로미 원본 비율 그대로 — 변형 없이 명확히 인식되도록)
    const VS = 1.0;
    const dw = PW * VS, dh = PH * VS;
    const ox = -dw/2, oy = PH/2 - dh;
    X.save();
    X.translate(sx + PW/2, sy + PH/2);
    if(P.face < 0) X.scale(-1, 1);
    // 스쿼시앤스트레치
    if(P._squash > 0){
      X.scale(1 - P._squash*0.15, 1 + P._squash*0.18);
      P._squash = Math.max(0, P._squash - 0.08);
    } else if(P._stretch > 1){
      X.scale(P._stretch, 2 - P._stretch);
      P._stretch = Math.max(1, P._stretch - 0.05);
    }
    if(P.gr && Math.abs(P.vx) > 1){
      // walk cycle: 상하 bob만 (scale 변형 제거 → 로미 모습 보존)
      const sp = Math.abs(P.vx) * 1.8;
      X.translate(sin(t*sp)*2, Math.abs(sin(t*sp*0.5))*1.5);
      X.rotate(sin(t*sp*0.5)*0.03);
    }
    else if(P.gr){
      // idle: 호흡 (scale 미적용)
      X.translate(0, sin(t*2.2)*1);
    }
    if(!P.gr) X.rotate(clamp(P.vy * 0.015, -0.2, 0.2) * P.face);
    if(P.shieldT > 0){ X.shadowColor = '#4FC3F7'; X.shadowBlur = 15; }
    if(P.invincT > 0){ X.shadowColor = '#FFD700'; X.shadowBlur = 20; X.globalAlpha = 0.8 + sin(t*8)*0.2; }
    if(P.speedT > 0){ X.shadowColor = '#76FF03'; X.shadowBlur = 10; }
    if(img && img.naturalWidth){
      X.drawImage(img, ox, oy, dw, dh);
    } else {
      // 폴백: 분홍 드레스 (1.4× 적용)
      X.fillStyle = '#ff6b9d'; X.fillRect(ox, oy + 28*VS, dw, dh - 28*VS);
      X.fillStyle = '#ffd7c2'; X.fillRect(-17*VS, oy, 34*VS, 34*VS);
      X.fillStyle = '#6a3a5a'; X.fillRect(-20*VS, oy - 3*VS, 40*VS, 14*VS);
    }
    X.restore();
    X.globalAlpha = 1;
    if(P.gr){ X.fillStyle = 'rgba(0,0,0,0.12)'; X.beginPath(); X.ellipse(sx + PW/2, P.y + PH + 2, PW/2 + 2, 4, 0, 0, Math.PI*2); X.fill(); }
    if(P.shieldT > 0){ X.strokeStyle = 'rgba(79,195,247,'+(0.3+sin(t*4)*0.2)+')'; X.lineWidth = 2; X.beginPath(); X.arc(sx + PW/2, sy + PH/2, 30, 0, Math.PI*2); X.stroke(); }
    if(P.wallSlide){ X.fillStyle = 'rgba(255,255,255,0.4)'; for(let i=0;i<3;i++) X.fillRect(sx + (P.face > 0 ? PW : 0) - 2, sy + 20 + i*20, 4, 8); }
  }

  function drawEnemy(X, e){
    if(!e[6]) return;
    const sx = e[0] - camX, sy = e[1];
    if(sx < -40 || sx > W + 40) return;
    const tp = e[2], bob = sin(t*2.8 + e[0]) * 3;
    if(tp === 0){
      X.fillStyle = '#776688'; X.fillRect(sx+2, sy, 26, 28);
      X.fillStyle = '#9988AA'; X.fillRect(sx+4, sy-5, 22, 8);
      X.fillStyle = '#fff'; X.beginPath(); X.arc(sx+10, sy+10, 3, 0, Math.PI*2); X.fill();
      X.beginPath(); X.arc(sx+20, sy+10, 3, 0, Math.PI*2); X.fill();
      X.fillStyle = '#222'; X.beginPath(); X.arc(sx+10, sy+10, 1.5, 0, Math.PI*2); X.fill();
      X.beginPath(); X.arc(sx+20, sy+10, 1.5, 0, Math.PI*2); X.fill();
    } else if(tp === 1){
      X.fillStyle = '#66BB6A'; X.beginPath(); X.ellipse(sx+15, sy+15+bob, 16, 14, 0, 0, Math.PI*2); X.fill();
      X.fillStyle = '#81C784'; X.beginPath(); X.ellipse(sx+15, sy+10+bob, 11, 9, 0, 0, Math.PI*2); X.fill();
      X.fillStyle = '#fff'; X.beginPath(); X.arc(sx+10, sy+10+bob, 3.5, 0, Math.PI*2); X.fill();
      X.beginPath(); X.arc(sx+20, sy+10+bob, 3.5, 0, Math.PI*2); X.fill();
    } else {
      X.fillStyle = '#4A148C'; X.beginPath(); X.ellipse(sx+15, sy+15+bob, 16, 14, 0, 0, Math.PI*2); X.fill();
      X.fillStyle = '#7B1FA2'; X.beginPath(); X.ellipse(sx+15, sy+10+bob, 11, 9, 0, 0, Math.PI*2); X.fill();
      X.fillStyle = '#FF0040'; X.beginPath(); X.arc(sx+10, sy+10+bob, 3, 0, Math.PI*2); X.fill();
      X.beginPath(); X.arc(sx+20, sy+10+bob, 3, 0, Math.PI*2); X.fill();
    }
  }

  function drawTouchControls(X){
    const btnR = 35;
    // Left
    X.fillStyle = 'rgba(255,255,255,'+(tL?0.55:0.35)+')';
    X.beginPath(); X.arc(55, H-60, btnR, 0, Math.PI*2); X.fill();
    X.strokeStyle = 'rgba(255,255,255,'+(tL?0.8:0.45)+')'; X.lineWidth = 2; X.stroke();
    X.fillStyle = '#fff'; X.font = FN(22); X.textAlign = 'center'; X.fillText('<', 55, H-52);
    // Right
    X.fillStyle = 'rgba(255,255,255,'+(tR?0.55:0.35)+')';
    X.beginPath(); X.arc(140, H-60, btnR, 0, Math.PI*2); X.fill();
    X.strokeStyle = 'rgba(255,255,255,'+(tR?0.8:0.45)+')'; X.lineWidth = 2; X.stroke();
    X.fillStyle = '#fff'; X.font = FN(22); X.fillText('>', 140, H-52);
    // Jump
    X.fillStyle = 'rgba(255,107,157,'+(tJ?0.6:0.35)+')';
    X.beginPath(); X.arc(W-60, H-60, 45, 0, Math.PI*2); X.fill();
    X.strokeStyle = 'rgba(255,107,157,'+(tJ?0.9:0.5)+')'; X.lineWidth = 2; X.stroke();
    X.fillStyle = '#fff'; X.font = 'bold '+FN(14); X.fillText('JUMP', W-60, H-54);
    // Dash (world 3+)
    if(hasDash){
      const dAlpha = P.dashCD > 0 ? 0.2 : 0.4;
      X.fillStyle = 'rgba(255,215,0,'+(tDash?0.6:dAlpha)+')';
      X.beginPath(); X.arc(W-60, H-130, 30, 0, Math.PI*2); X.fill();
      X.strokeStyle = 'rgba(255,215,0,'+(tDash?0.9:0.5)+')'; X.lineWidth = 2; X.stroke();
      X.fillStyle = '#fff'; X.font = 'bold '+FN(11); X.fillText('DASH', W-60, H-126);
      if(P.dashCD > 0){
        X.fillStyle = 'rgba(0,0,0,0.3)';
        X.beginPath(); X.moveTo(W-60, H-130);
        X.arc(W-60, H-130, 30, -Math.PI/2, -Math.PI/2 + Math.PI*2*(P.dashCD/60), false);
        X.fill();
      }
    }
    // Cache hit rects
    _touchRects = { L:{cx:55,cy:H-60,r:42}, R:{cx:140,cy:H-60,r:42}, J:{cx:W-60,cy:H-60,r:50}, D:{cx:W-60,cy:H-130,r:35} };
  }

  function renderPlay(X){
    const L = _LEVELS[lv]; if(!L) return;
    X.save();
    if(_shakeT > 0){
      const sm = _shakeMag * (_shakeT / 8);
      X.translate((Math.random()-0.5)*sm, (Math.random()-0.5)*sm);
      _shakeT--;
    }
    drawPlayBG(X, L.bg);
    L.plat.forEach(pl => drawPlat(X, pl));

    // Items
    items_l.forEach(it => {
      if(!it[3]) return;
      const sx = it[0] - camX, sy = it[1] + sin(t*2.4 + it[0])*4;
      if(sx < -15 || sx > W + 15) return;
      heart(X, sx, sy, 9, '#FF6B9D');
    });
    // Stars
    stars_l.forEach(st => {
      if(!st[3]) return;
      const sx = st[0] - camX, sy = st[1] + sin(t*3 + st[0])*3;
      if(sx < -15 || sx > W + 15) return;
      X.save(); X.translate(sx, sy); X.rotate(t); star(X, 0, 0, 8, '#FFD700'); X.restore();
      X.fillStyle = 'rgba(255,215,0,0.3)'; X.beginPath(); X.arc(sx, sy, 12, 0, Math.PI*2); X.fill();
    });
    // Powerups
    powerups_l.forEach(pu => {
      if(!pu[3]) return;
      const sx = pu[0] - camX, sy = pu[1] + sin(t*2 + pu[0])*5;
      if(sx < -15 || sx > W + 15) return;
      X.fillStyle = PU_COLORS[pu[2]]; X.beginPath(); X.arc(sx, sy, 12, 0, Math.PI*2); X.fill();
      X.fillStyle = 'rgba(255,255,255,0.6)'; X.beginPath(); X.arc(sx-3, sy-3, 4, 0, Math.PI*2); X.fill();
      X.strokeStyle = 'rgba(255,255,255,0.5)'; X.lineWidth = 2;
      X.beginPath(); X.arc(sx, sy, 14 + sin(t*3)*2, 0, Math.PI*2); X.stroke();
    });
    // NPCs
    const IM = window.IM || {};
    npcs_l.forEach(n => {
      const sx = n.x - camX; if(sx < -50 || sx > W + 50) return;
      const img = n.spr === 'ba' ? IM.ba : IM.ch;
      if(img && img.naturalWidth) X.drawImage(img, sx - 25, n.y - 25, 55, 55);
      if(!n.done){ X.fillStyle = '#FFD700'; X.font = 'bold '+FN(16); X.textAlign = 'center'; X.fillText('!', sx + 5, n.y - 35); }
    });
    // Enemies
    enemies_l.forEach(e => drawEnemy(X, e));

    // Boss
    if(boss.active && boss.hp > 0){
      const sx = boss.x - camX, bob = sin(t*3.3)*6;
      if(IM.ts && IM.ts.naturalWidth) X.drawImage(IM.ts, sx, boss.y + bob, 90, 80);
      else { X.fillStyle = '#4A148C'; X.fillRect(sx, boss.y + bob, 90, 80); }
      rr(X, sx, boss.y - 18, 90, 10, 4, 'rgba(0,0,0,0.6)');
      rr(X, sx+2, boss.y - 16, (boss.hp / boss.mx) * 86, 6, 3, '#FF0040');
      X.fillStyle = '#fff'; X.font = FN(12); X.textAlign = 'center'; X.fillText('트러핑', sx + 45, boss.y - 22);
    }

    drawPlayer(X);

    // Particles
    parts.forEach(p => {
      X.globalAlpha = p.l;
      if(p.ring){
        X.strokeStyle = p.c;
        X.lineWidth = 2;
        X.beginPath(); X.arc(p.x - camX, p.y, p.s, 0, Math.PI*2); X.stroke();
      } else {
        X.fillStyle = p.c;
        X.beginPath(); X.arc(p.x - camX, p.y, p.s * p.l, 0, Math.PI*2); X.fill();
      }
    });
    X.globalAlpha = 1;

    // HUD
    rr(X, 8, 8, W - 16, 36, 12, 'rgba(0,0,0,0.7)');
    X.fillStyle = '#fff'; X.font = FN(13); X.textAlign = 'left';
    X.fillText('x' + lives, 16, 30);
    heart(X, 70, 24, 6, '#FF6B9D'); X.fillText(hts+'', 82, 30);
    star(X, 120, 24, 5, '#FFD700'); X.fillText(starCount+'', 132, 30);
    X.fillStyle = 'rgba(255,255,255,0.7)'; X.font = FN(11); X.textAlign = 'right';
    X.fillText(L.name + ' W' + L.world, W - 16, 28);

    // Progress bar
    const prog = clamp(P.x / (L.endX - 50), 0, 1);
    rr(X, 60, 16, W - 120, 6, 3, 'rgba(255,255,255,0.15)');
    rr(X, 60, 16, (W - 120) * prog, 6, 3, '#FF6B9D');

    // Active powerups
    let puY = 50;
    if(P.shieldT > 0){ rr(X, 8, puY, 90, 20, 8, 'rgba(79,195,247,0.6)'); X.fillStyle='#fff'; X.font=FN(10); X.textAlign='left'; X.fillText('보호막 '+Math.ceil(P.shieldT/60)+'s', 14, puY+14); puY += 24; }
    if(P.speedT  > 0){ rr(X, 8, puY, 90, 20, 8, 'rgba(118,255,3,0.6)');  X.fillStyle='#fff'; X.font=FN(10); X.textAlign='left'; X.fillText('스피드 '+Math.ceil(P.speedT/60)+'s', 14, puY+14); puY += 24; }
    if(P.invincT > 0){ rr(X, 8, puY, 90, 20, 8, 'rgba(255,215,0,0.6)');  X.fillStyle='#fff'; X.font=FN(10); X.textAlign='left'; X.fillText('무적 '+Math.ceil(P.invincT/60)+'s', 14, puY+14); puY += 24; }
    if(P.magnetT > 0){ rr(X, 8, puY, 90, 20, 8, 'rgba(224,64,251,0.6)'); X.fillStyle='#fff'; X.font=FN(10); X.textAlign='left'; X.fillText('자석 '+Math.ceil(P.magnetT/60)+'s', 14, puY+14); }

    // Companion (하츄핑)
    if(L.boss && !P.dead){
      const hx = P.x - camX + PW/2 + 8, hy = P.y - 15 + sin(t*3)*5;
      if(IM.hs && IM.hs.naturalWidth){
        X.globalAlpha = hatchuShield ? 1 : 0.3;
        X.drawImage(IM.hs, hx - 20, hy - 18, 40, 35);
        X.globalAlpha = 1;
      }
    }

    // NPC 메시지
    if(npcMsg && npcT > 0){
      rr(X, 20, H-220, W-40, 60, 12, 'rgba(0,0,0,0.88)');
      X.fillStyle = '#fff'; X.font = FN(14); X.textAlign = 'center';
      npcMsg.split('\n').forEach((l, i) => X.fillText(l, W/2, H - 200 + i*22));
    }

    drawTouchControls(X);

    if(lvDone){
      X.fillStyle = 'rgba(255,255,255,'+(0.2+sin(t*5.6)*0.15)+')';
      X.fillRect(0, 0, W, H);
      X.fillStyle = '#C2185B'; X.font = 'bold '+FN(22); X.textAlign = 'center';
      X.fillText('스테이지 클리어!', W/2, H/2);
    }
    X.restore();
  }

  function renderStory(X){
    const IM = window.IM || {};
    const s = stQ[stI]; if(!s) return;
    // BG
    const img = IM[s.bg];
    if(img && img.naturalWidth){
      const sc = Math.max(W / img.width, H / img.height);
      X.drawImage(img, (W - img.width*sc)/2, (H - img.height*sc)/2, img.width*sc, img.height*sc);
    } else { X.fillStyle = '#1a0a2e'; X.fillRect(0, 0, W, H); }
    // 어둡게
    X.fillStyle = 'rgba(0,0,0,0.35)'; X.fillRect(0, 0, W, H);
    // 패널
    const panelY = H * 0.64;
    X.fillStyle = 'rgba(0,0,0,0.65)'; X.fillRect(0, panelY, W, H - panelY);
    X.fillStyle = 'rgba(255,255,255,0.08)'; X.fillRect(0, panelY, W, 2);
    if(s.sp){
      const bw = Math.max(80, s.sp.length*11 + 18);
      rr(X, 16, H*0.71, bw, 26, 10, 'rgba(255,107,157,0.75)');
      X.fillStyle = '#fff'; X.font = 'bold '+FN(15); X.textAlign = 'left';
      X.fillText(s.sp, 26, H*0.71 + 18);
    }
    X.fillStyle = '#fff'; X.font = FN(17); X.textAlign = 'left';
    const lines = stTx.split('\n'); const startY = H*0.71 + (s.sp ? 40 : 14);
    lines.forEach((l, i) => X.fillText(l, 20, startY + i*25));
    if(stDn){
      X.globalAlpha = 0.7 + sin(t*2.8)*0.2;
      X.fillStyle = '#fff'; X.font = FN(15); X.textAlign = 'right';
      X.fillText('터치하여 계속', W - 16, H - 14);
      X.globalAlpha = 1;
    }
  }

  // ===== 공개: render / update =====
  function update(){
    if(!_active) return;
    t += 0.02; ticks++;
    if(trD > 0){ trA = Math.min(1, trA + 0.05); if(trA >= 1 && trNx){ trNx(); trNx = null; } }
    if(trD < 0){ trA = Math.max(0, trA - 0.05); if(trA <= 0) trD = 0; }
    if(scr === 'play') updatePlay();
  }

  function render(ctx, WW, HH){
    if(!ctx && window.UCanvas){ ctx = window.UCanvas.ctx; }
    if(!ctx) return;
    // UCanvas 좌표는 이미 420x750 가상공간이어야 함. 안전용 — WW/HH 인자는 무시.
    ctx.clearRect(0, 0, W, H);
    if(scr === 'play') renderPlay(ctx);
    else if(scr === 'story') renderStory(ctx);
    // Transition overlay
    if(trA > 0){ ctx.fillStyle = 'rgba(0,0,0,'+trA+')'; ctx.fillRect(0, 0, W, H); }
  }

  function handleInput(x, y, kind){
    if(!_active) return;
    if(scr === 'story'){
      if(kind === 'tap' || kind === 'down') advSt();
      return;
    }
    if(scr !== 'play') return;
    if(trA > 0.3) return;

    const inC = (cx, cy, r) => (x - cx)*(x - cx) + (y - cy)*(y - cy) <= r*r;
    if(kind === 'down' || kind === 'tap'){
      if(inC(55,  H-60, 42)) tL = true;
      if(inC(140, H-60, 42)) tR = true;
      if(inC(W-60, H-60, 50)) tJ = true;
      if(hasDash && inC(W-60, H-130, 35)) tDash = true;
    } else if(kind === 'up'){
      tL = false; tR = false; tJ = false; tDash = false;
    } else if(kind === 'move'){
      // multi-touch 드래그 - 재평가
      tL = false; tR = false; tJ = false; tDash = false;
      if(inC(55,  H-60, 42)) tL = true;
      if(inC(140, H-60, 42)) tR = true;
      if(inC(W-60, H-60, 50)) tJ = true;
      if(hasDash && inC(W-60, H-130, 35)) tDash = true;
    }
  }

  function start(opts){
    opts = opts || {};
    chosenChar = CHARACTERS[0];  // 로미 고정 (unified 주인공)
    if(opts.character){
      const c = CHARACTERS.find(c => c.id === opts.character);
      if(c) chosenChar = c;
    }
    // 외부 레벨 주입 (ACT2 "복도/계단/지붕/중정보스")
    if(Array.isArray(opts.levels) && opts.levels.length){
      _LEVELS = _adaptExtLevels(opts.levels);
      _extMode = true;
    } else {
      _LEVELS = LEVELS;
      _extMode = false;
    }
    lv = opts.startLevel || 0;
    lives = 7; hts = 0; starCount = 0;
    _onClear = opts.onClear || null;
    _active = true;
    scr = 'play';
    trA = 0; trD = 0; trNx = null;
    initLv(lv);
  }

  function onEnter(opts){
    // opts.levels는 구 API — 무시하고 v2 기본 10레벨 사용
    start(opts);
  }
  function onExit(){ /* keep state */ }

  function stop(){
    _active = false;
    _onClear = null;
    if(stTm){ clearInterval(stTm); stTm = null; }
  }

  window.PlatformerEngine = {
    start, stop, update, render, handleInput, onEnter, onExit,
    // 디버그/테스트용
    _S: {
      get active(){ return _active; },
      get P(){ return P; },
      get lv(){ return lv; },
      get lives(){ return lives; },
      get hts(){ return hts; },
      get starCount(){ return starCount; },
      get boss(){ return boss; },
      get lvDone(){ return lvDone; },
      get scr(){ return scr; },
      get LEVELS(){ return _LEVELS; },
      get extMode(){ return _extMode; },
      set lv(v){ lv = v; initLv(v); }
    }
  };

  console.log('[UNIFIED] PlatformerEngine (별빛 대모험 v2) 준비 - 10레벨');
})();
