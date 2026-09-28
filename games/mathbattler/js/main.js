/* main.js — 부트 · 루프 · 씬 전환. 테마 로드는 skin-loader 가 담당. */
(function (global) {
  'use strict';
  const MB = global.MB, core = MB.core, T = MB.T;
  const $ = s => document.querySelector(s);

  function Game() { }

  Game.prototype.boot = function () {
    const q = new URLSearchParams(location.search);
    return MB.Skins.load(q.get('theme') || undefined).then(res => {
      this.skin = res.skin;
      this.doc = res.curriculum;
      this.list = res.list;
      this.placeholderArt = res.placeholder;
      this.themeRoot = 'skins/' + res.id + '/';
      this.state = core.load(this.skin);
      this.world = new MB.World(this.skin, this.list, this.state);
      this.ui = new MB.UI(this);
      this.hero = {
        x: this.world.spawn.x, y: this.world.spawn.y,
        f: 1, moving: false, bob: 0,
      };
      this.keys = {};
      this.acc = 0;
      /* 드로우는 CSS 픽셀 단위로 한다. 캔버스 backing store 는 DPR 배로 잡는다. */
      this.view = { w: window.innerWidth, h: window.innerHeight };
      this.onResize = () => {
        const dpr = Math.min(2, window.devicePixelRatio || 1);
        const cv = $('#game');
        cv.width = Math.floor(this.view.w * dpr);
        cv.height = Math.floor(this.view.h * dpr);
        cv.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
        this.view.w = window.innerWidth;
        this.view.h = window.innerHeight;
      };
      this.onResize();
      window.addEventListener('resize', this.onResize);
      window.addEventListener('orientationchange', this.onResize);
      bindInput(this);
      this.loop = this.loop.bind(this);
      this.last = performance.now();
      requestAnimationFrame(this.loop);
      window.MB.game = this;   /* 콘솔/플레이테스트용 */
      document.dispatchEvent(new CustomEvent('mb:ready', { detail: { theme: res.id } }));
      console.log('[mathbattler] theme=' + res.id + ' monsters=' + this.list.length
        + ' unmapped=' + res.missing);
      return this;
    });
  };

  /* 테마 폴더 기준 art 경로 → 실제 URL */
  Game.prototype.artURL = function (rel) { return this.themeRoot + rel; };
  Game.prototype.curTopicKey = function () {
    return this.state.inBattle ? this.state.inBattle.key : null;
  };
  Game.prototype.lessonURL = function (subject, unit, topic) {
    return '../learn.html?subject=' + encodeURIComponent(subject)
      + '&unit=' + encodeURIComponent(unit) + '&topic=' + encodeURIComponent(topic);
  };

  /* ── 씬 ── */
  Game.prototype.goMap = function () {
    ['#screen-battle', '#screen-lib', '#screen-study', '#screen-result'].forEach(s => $(s).classList.add('hidden'));
    $('#screen-map').classList.remove('hidden');
    this.state.inBattle = null;
    core.save(this.state);
    this.ui.hud();
  };

  Game.prototype.startBattle = function (entry) {
    const b = new MB.Battle(this.skin, entry, this.state);
    this.battle = b;
    this.state.inBattle = { key: entry.key, id: b.mon().id };
    core.save(this.state);
    this.ui.showBattle(b);
    this.nextQuestion(b);
  };

  Game.prototype.nextQuestion = function (b) {
    const q = b.cur();
    if (!q) return this.finish(b);
    this.ui.renderMon(b);   /* 상대가 바뀌었을 수 있으니 매번 그린다 */
    this.ui.renderQuestion(b, q);
    this.ui.renderHp(b);
  };

  Game.prototype.answer = function (b, pick) {
    /* 채점 직후 1초 동안 다음 문제 버튼이 아직 살아 있다.
     * 그 틈에 두 번 클릭하면 다음 문제를 보기도 전에 답해 버린다.
     * = 한 번 눌렀는데 HP 가 두 번 깎이는 버그의 정체. */
    if (b.over || b.busy) return;
    b.busy = true;
    const q = b.cur();
    if (!q) return;
    const good = pick === q.c;
    core.record(this.state, b.entry.key, good);
    let gain = 0;
    if (good) {
      gain = b.gp(good ? 10 + b.qi * 2 : 0);
      this.state.gp += gain;
      this.state.topicSolved[b.entry.key] = true;
    }
    core.save(this.state);
    this.ui.feedback(b, pick, good, gain);
    b.hit(good);
    if (b.over) return this.finish(b);
    setTimeout(() => { b.busy = false; this.nextQuestion(b); }, 1000);
  };

  Game.prototype.finish = function (b) {
    const r = b.result();
    if (r.won) {
      /* 무리 전체를 '잡은 것' 으로 기록 — 다음 상대로 넘어갈 수 있어야 한다 */
      b.entry.roster.forEach(x => { this.state.defeated[x.id] = true; });
      /* 다음 상대를 고르고 즉석에서 다음 문제로 넘어간다 */
      const nxt = core.nextMonster(this.list, this.state, b.entry.key);
      const msg = this.skin.text.msg_gate_open;
      this.ui.toast(msg);
    } else {
      this.state.heroHp = this.state.heroMaxHp;
    }
    core.save(this.state);
    this.ui.battleEnd(r.won, b.entry);
    this.pendingNext = r.won;
  };

  Game.prototype.study = function (m) { this.ui.showStudy(m); };

  /* ── 입력 ── */
  function bindInput(g) {
    window.addEventListener('keydown', e => {
      g.keys[e.key.toLowerCase()] = true;
      if (e.key === 'Escape') g.goMap();
    });
    window.addEventListener('keyup', e => { g.keys[e.key.toLowerCase()] = false; });
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-act]');
      if (!t) return;
      const a = t.dataset.act;
      if (a === 'map') g.goMap();
      else if (a === 'library') g.ui.showLibrary(g.list);
      else if (a === 'hint') g.hint();
      else if (a === 'fight') g.faceNearest();
      else if (a === 'again') {
        if (g.battle && g.battle.entry) g.startBattle(g.battle.entry);
      }
    });
  }

  /* 가장 가까운 인카운터(⚔) 표식으로 가깝게 걸어간다 — 전투 버튼 */
  Game.prototype.faceNearest = function () {
    let best = null, bd = Infinity;
    for (const gt of this.world.gates) {
      const x = gt.x * this.world.tile + this.world.tile / 2;
      const y = gt.y * this.world.tile + this.world.tile / 2;
      const d = Math.hypot(x - this.hero.x, y - this.hero.y);
      if (d < bd) { bd = d; best = gt; }
    }
    if (!best) return;
    this.startBattle(best.monster);
  };

  Game.prototype.hint = function () {
    const b = this.battle;
    if (!b || b.over) return;
    b.useHint();
    core.save(this.state);
    this.ui.showHint(b);
  };

  /* ── 루프: 이동 + 애니메이션 ── */
  Game.prototype.loop = function (now) {
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.acc += dt;
    const sp = 130;
    const h = this.hero, k = this.keys;
    let dx = 0, dy = 0;
    if (!$('#screen-map').classList.contains('hidden')) {
      if (k['arrowleft'] || k['a']) dx = -1;
      if (k['arrowright'] || k['d']) dx = 1;
      if (k['arrowup'] || k['w']) dy = -1;
      if (k['arrowdown'] || k['s']) dy = 1;
    }
    if (dx || dy) {
      const n = Math.hypot(dx, dy) || 1;
      const nx = h.x + dx / n * sp * dt;
      const ny = h.y + dy / n * sp * dt;
      const T2 = this.world.tile;
      if (this.world.walkable(Math.floor(nx / T2), Math.floor(h.y / T2))) h.x = nx;
      if (this.world.walkable(Math.floor(h.x / T2), Math.floor(ny / T2))) h.y = ny;
      h.moving = true;
      h.bob += dt * 9;
      h.f = dx < 0 ? 2 : dx > 0 ? 0 : 1;
    } else { h.moving = false; h.bob += dt * 2; }
    draw(this);
    requestAnimationFrame(this.loop);
  };

  /* ── 렌더 ── */
  function draw(g) {
    const cv = $('#game'), ctx = cv.getContext('2d');
    const w = g.world, P = g.skin.palette, S = w.tile;
    const VW = g.view.w, VH = g.view.h;
    const camX = Math.max(0, Math.min(w.w * S - VW, g.hero.x - VW / 2));
    const camY = Math.max(0, Math.min(w.h * S - VH, g.hero.y - VH / 2));
    g.camX = camX; g.camY = camY;

    ctx.fillStyle = P.bg_grass;
    ctx.fillRect(0, 0, VW, VH);

    const x0 = Math.floor(camX / S) - 1, y0 = Math.floor(camY / S) - 1;
    const x1 = x0 + Math.ceil(VW / S) + 2, y1 = y0 + Math.ceil(VH / S) + 2;
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const t = w.at(tx, ty);
      const sx = tx * S - camX, sy = ty * S - camY;
      let c = P.bg_grass;
      if (t === T.PATH) c = P.bg_path;
      else if (t === T.WATER) c = P.bg_water;
      else if (t === T.TALL) c = P.bg_grass2;
      else if (t === T.TREE) c = P.bg_grass2;
      else if ((tx + ty) % 2 === 0) c = P.bg_grass;
      ctx.fillStyle = c;
      ctx.fillRect(sx, sy, S, S);
      if (t === T.TALL) { /* 갈대밭 = 인카운터 */
        ctx.fillStyle = g.skin.encounter.color;
        for (let i = 0; i < 4; i++) {
          ctx.fillRect(sx + 4 + i * 8, sy + 10, 3, S - 12);
        }
      } else if (t === T.TREE) {
        ctx.fillStyle = '#6b4a2a'; ctx.fillRect(sx + S / 2 - 3, sy + S - 12, 6, 12);
        ctx.fillStyle = g.skin.decor === 'tree' ? '#2f7d32' : '#4a7c2f';
        ctx.beginPath(); ctx.arc(sx + S / 2, sy + S - 16, 12, 0, 7); ctx.fill();
      }
    }
    /* 인카운터/도서관 마커 */
    w.gates.forEach(gt => {
      const sx = gt.x * S - camX, sy = gt.y * S - camY;
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 320 + gt.idx);
      ctx.save();
      ctx.globalAlpha = 0.35 + 0.4 * pulse;
      ctx.fillStyle = g.skin.encounter.glow;
      ctx.beginPath(); ctx.arc(sx + S / 2, sy + S / 2, 10 + 5 * pulse, 0, 7); ctx.fill();
      ctx.restore();
      drawBadge(ctx, sx + S / 2, sy + S / 2 - 2, g.skin.encounter.icon, g.skin.encounter.glow);
    });
    w.libs.forEach(l => {
      const sx = l.x * S - camX, sy = l.y * S - camY;
      drawBadge(ctx, sx + S / 2, sy + S / 2, g.skin.poi.icon, g.skin.poi.color);
    });
    /* 히어로 — 테마가 kind 를 준다('trainer' | 'blob' …). 이미지가 없으면 벡터. */
    drawHero(ctx, g, camX, camY, S);
  }

  function drawBadge(ctx, x, y, icon, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, 13, 0, 7); ctx.fill();
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(icon, x, y + 1);
    ctx.restore();
  }

  function drawHero(ctx, g, camX, camY, S) {
    const h = g.hero;
    const x = h.x - camX, y = h.y - camY;
    const bob = h.moving ? Math.sin(h.bob) * 2 : Math.sin(h.bob) * 0.6;
    const kind = (g.skin.hero && g.skin.hero.kind) || 'blob';
    const pal = (g.skin.hero && g.skin.hero.palette) || ['#3b82f6', '#1e40af', '#fbbf24'];
    ctx.save();
    ctx.translate(x, y - 6 + bob);
    /* 그림자 */
    ctx.globalAlpha = 0.25; ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.ellipse(0, 12, 11, 4, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
    if (kind === 'trainer') {
      /* 지우 — 모자, 상의, 배낭 */
      ctx.fillStyle = pal[1]; ctx.fillRect(-9, -6, 18, 20);
      ctx.fillStyle = pal[0]; ctx.fillRect(-9, -6, 18, 10);
      ctx.fillStyle = pal[2]; ctx.fillRect(-11, -10, 22, 5);
      ctx.fillStyle = pal[1]; ctx.fillRect(-7, -16, 14, 7);
      ctx.fillStyle = '#f6d7b0'; ctx.beginPath(); ctx.arc(0, -11, 5, 0, 7); ctx.fill();
      ctx.fillStyle = '#241a12';
      ctx.fillRect(-5, -12, 3, 2); ctx.fillRect(2, -12, 3, 2);
    } else {
      /* 블롭 — 눈 두 개 */
      ctx.fillStyle = pal[0];
      ctx.beginPath(); ctx.arc(0, 4, 13, 0, 7); ctx.fill();
      ctx.fillStyle = pal[1];
      ctx.beginPath(); ctx.arc(-5, 2, 3.4, 0, 7); ctx.arc(5, 2, 3.4, 0, 7); ctx.fill();
      ctx.fillStyle = pal[2];
      ctx.fillRect(-4, 10, 8, 2);
    }
    ctx.restore();
  }

  window.MB = window.MB || {};
  window.MB.Game = Game;
  document.addEventListener('DOMContentLoaded', () => {
    new Game().boot();
  });
})(window);
