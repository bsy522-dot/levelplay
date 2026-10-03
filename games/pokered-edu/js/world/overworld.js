/* 걸어 다니는 화면 (Phaser Scene) */
import { DB, MAP_NAME } from '../data.js';
import { G, save } from '../state.js';
import { Input } from '../input.js';
import { paintMap, T, isWalkable } from '../art/world.js';
import { charSheet, itemBallSheet, sleeperSheet, boulderSheet, CW, CH, KINDS, SPRITE_KIND } from '../art/chars.js';
import { banner, fade, say, ask, toast } from '../ui.js';
import * as F from './field.js';
import { sfx, music } from '../audio.js';
import * as EV from './events.js';

const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const DIRI = { down: 0, up: 1, left: 2, right: 3 };
const WALK_MS = 185, RUN_MS = 110;

export class WorldScene extends Phaser.Scene {
  constructor() { super('world'); }

  create() {
    W.scene = this;
    for (const k of Object.keys(KINDS)) this.addSheet('ch_' + k, charSheet(k), 12);
    this.addSheet('ch_item', itemBallSheet(), 1);
    this.addSheet('ch_sleeper', sleeperSheet(), 1);
    this.addSheet('ch_boulder', boulderSheet(), 1);
    this.mapObjs = [];
    this.npcs = [];
    this.moving = false;
    this.cameras.main.setBackgroundColor('#0f1830');
    this.scale.on('resize', () => this.fitCamera());
    Input.world = (k) => this.onKey(k);
    W.ready?.();
  }

  addSheet(key, canvas, frames) {
    if (this.textures.exists(key)) return;
    const tex = this.textures.addCanvas(key, canvas);
    for (let i = 0; i < frames; i++) tex.add(i, 0, i * CW, 0, CW, CH);
  }

  /* ── 지도 불러오기 ── */
  async loadMap(id, x, y, facing, opts = {}) {
    const map = F.effectiveMap(DB.maps[id]); // 벤 나무는 풀밭으로
    this.clearMap();
    this.strengthOn = false; // 괴력은 지도마다 다시 쓴다(원작과 같음)
    const art = paintMap(map);
    this.M = art.M;
    this.map = map;
    G.s.map = id; G.s.x = x; G.s.y = y; G.s.facing = facing || G.s.facing || 'down';
    if (map.tileset === 'Overworld') G.s.lastOutdoor = id;
    F.markVisited(map);
    if (G.s.surf && map.grid[y]?.[x] !== '~') G.s.surf = false;
    const kg = 'map_g', ko = 'map_o';
    if (this.textures.exists(kg)) this.textures.remove(kg);
    if (this.textures.exists(ko)) this.textures.remove(ko);
    this.textures.addCanvas(kg, art.ground);
    this.textures.addCanvas(ko, art.over);
    this.mapObjs.push(this.add.image(0, 0, kg).setOrigin(0).setDepth(0));
    this.mapObjs.push(this.add.image(0, 0, ko).setOrigin(0).setDepth(100000));
    this.worldW = art.W * T; this.worldH = art.H * T;
    // 주인공
    this.player = this.add.sprite(0, 0, 'ch_player', DIRI[G.s.facing] * 3).setOrigin(0.5, 1);
    this.mapObjs.push(this.player);
    this.placeSprite(this.player, x, y);
    // NPC
    this.npcs = [];
    for (let idx = 0; idx < map.npcs.length; idx++) {
      const n = map.npcs[idx];
      const vis = EV.npcVisible(map.id, n, idx);
      if (!vis) continue;
      const pos = (F.isBoulder(n) && F.boulderPos(map.id, idx)) || EV.npcPos(map.id, n, idx) || { x: n.x, y: n.y };
      const kind = F.isBoulder(n) ? 'boulder' : EV.npcKind(map.id, n, idx) || (n.spriteName === 'PokeBall' ? 'item' : n.spriteName === 'GamblerAsleep' ? 'sleeper' : SPRITE_KIND[n.spriteName] || 'youngster');
      if (n.spriteName === 'Pokedex') continue; // 도감은 탁자 위 물건 (말 걸기만)
      let sp;
      if (kind.startsWith('mon:')) { // 사람이 아닌 포켓몬 NPC (예: 삐삐가 된 이수재)
        const key = 'fol_' + kind.slice(4);
        if (!this.textures.exists(key)) await new Promise((res) => { this.load.image(key, `art/mon/${kind.slice(4)}.webp`); this.load.once('complete', res); this.load.start(); });
        if (this.map !== map) return; // 불러오는 사이 지도가 바뀜
        sp = this.add.image(0, 0, key).setOrigin(0.5, 1);
        sp.setScale(54 / Math.max(sp.width, sp.height));
        sp.setFrame = () => sp;
      } else sp = this.add.sprite(0, 0, 'ch_' + kind, kind === 'item' || kind === 'sleeper' || kind === 'boulder' ? 0 : DIRI[(n.facing || 'Down').toLowerCase()] * 3).setOrigin(0.5, 1);
      const o = { n, idx, sp, x: pos.x, y: pos.y, home: { ...pos }, kind, facing: (n.facing || 'Down').toLowerCase(), moving: false, wait: 1000 + Math.random() * 2500 };
      this.placeSprite(sp, o.x, o.y);
      this.npcs.push(o); this.mapObjs.push(sp);
    }
    this.fol = null;
    this.refreshFollower();
    this.addFieldFx();
    W.updateGoal?.();
    this.fitCamera();
    this.cameras.main.startFollow(this.player, true, 0.2, 0.2, 0, 24);
    this.cameras.main.centerOn(this.player.x, this.player.y - 24);
    music(EV.mapMusic(map));
    if (!opts.quiet) banner(MAP_NAME[id] || id);
  }

  clearMap() {
    this.mapObjs.forEach((o) => o.destroy());
    this.mapObjs = []; this.npcs = [];
  }

  fitCamera() {
    if (!this.map) return;
    const cam = this.cameras.main;
    const vw = this.scale.width, vh = this.scale.height;
    const z = Math.max(0.55, Math.min(1.5, Math.min(vw / (10 * T), vh / (8.5 * T))));
    cam.setZoom(z);
    const w = this.worldW, h = this.worldH;
    const vwz = vw / z, vhz = vh / z;
    const bx = w < vwz ? -(vwz - w) / 2 : 0, by = h < vhz ? -(vhz - h) / 2 : 0;
    cam.setBounds(bx, by, Math.max(w, vwz), Math.max(h, vhz));
  }

  placeSprite(sp, x, y) {
    sp.x = (x + this.M) * T + T / 2;
    sp.y = (y + this.M) * T + T - 2;
    sp.setDepth(10 + sp.y);
  }

  /* ── 칸 정보 ── */
  cell(x, y) {
    const m = this.map;
    if (x < 0 || y < 0 || x >= m.w || y >= m.h) return null;
    return m.grid[y][x];
  }
  npcAt(x, y) { return this.npcs.find((o) => o.x === x && o.y === y && !o.gone); }
  blocked(x, y, forNpc) {
    const c = this.cell(x, y);
    if (c == null) return !forNpc && !this.edgeExit(x, y) ? true : forNpc;
    if (c === '~') { if (forNpc || !G.s.surf || this.npcAt(x, y)) return true; return false; } // 파도타기 중이면 물 위로
    if (!isWalkable(c)) return true;
    if (this.npcAt(x, y)) return true;
    if (forNpc && (c === 'D' || c === 'U')) return true;
    if (forNpc && G.s.x === x && G.s.y === y) return true;
    return EV.extraBlock(this.map.id, x, y);
  }
  edgeExit(x, y) {
    const m = this.map;
    const dir = y < 0 ? 'north' : y >= m.h ? 'south' : x < 0 ? 'west' : x >= m.w ? 'east' : null;
    if (!dir) return null;
    const c = m.connections[dir];
    if (!c || !DB.maps[c.to]) return null;
    return { dir, ...c };
  }

  /* ── 입력 ── */
  onKey(k) {
    if (this.moving || W.busy) return;
    if (k === 'a') this.interact();
    else if (k === 'menu') W.openMenu?.();
  }

  update(time, dt) {
    if (!this.map || !this.player) return;
    G.s.playMs = (G.s.playMs || 0) + dt;
    this.updateSurfFx();
    this.updateNpcs(dt);
    if (this.moving || W.busy || Input.busy()) { Input.pending = null; this.animPlayer(); return; }
    const d = Input.dir();
    if (d) this.tryStep(d);
    else this.player.setFrame(DIRI[G.s.facing] * 3);
  }

  animPlayer() {}

  async tryStep(d) {
    const [dx, dy] = DIRV[d];
    const turned = G.s.facing !== d;
    G.s.facing = d;
    const nx = G.s.x + dx, ny = G.s.y + dy;
    const c = this.cell(nx, ny);
    // 턱 뛰어내리기
    if ((c === 'v' && d === 'down') || (c === '<' && d === 'left') || (c === '>' && d === 'right')) {
      const lx = nx + dx, ly = ny + dy;
      if (!this.blocked(lx, ly)) { await this.jump(lx, ly); return; }
    }
    // 실내 출구 매트에서 아래로 = 밖으로
    const here = this.cell(G.s.x, G.s.y);
    if (here === 'D' && !this.map.outdoor && d === 'down' && ny >= this.map.h) { await this.useWarp(G.s.x, G.s.y); return; }
    if (this.blocked(nx, ny)) {
      const bo = this.npcAt(nx, ny);
      if (bo && bo.kind === 'boulder' && !F.whyNot('strength')) { // 배지+비전머신이 있으면 A 없이 바로 민다 (계획: 비전기술은 자동)
        if (!this.strengthOn) { this.strengthOn = true; sfx('select'); W.busy = true; try { await say(['괴력! 바위 쪽으로 걸으면 바위가 밀려나.']); } finally { W.busy = false; } }
        if (await this.pushBoulder(bo, d)) return;
      }
      // 길에 놓인 아이템 공은 부딪히면 바로 줍는다 (길목을 막아 길 안내가 끊기던 문제 — 포켓몬타워 6층)
      if (bo && bo.kind === 'item') { W.busy = true; try { await EV.talk(this.map.id, bo); } finally { W.busy = false; } return; }
      this.player.setFrame(DIRI[d] * 3);
      if (!turned && (!this.lastBump || this.time.now - this.lastBump > 350)) { sfx('bump'); this.lastBump = this.time.now; }
      if (EV.bumpTrigger) await EV.bumpTrigger(this.map.id, nx, ny, d);
      return;
    }
    await this.step(d, nx, ny);
  }

  step(d, nx, ny) {
    return new Promise((resolve) => {
      this.moving = true;
      const run = Input.held.has('b');
      const ms = run ? RUN_MS : WALK_MS;
      const base = DIRI[d] * 3;
      this.stepParity = !this.stepParity;
      this.player.setFrame(base + (this.stepParity ? 1 : 2));
      const tx = (nx + this.M) * T + T / 2, ty = (ny + this.M) * T + T - 2;
      this.followTo(G.s.x, G.s.y, ms);
      this.tweens.add({
        targets: this.player, x: tx, y: ty, duration: ms,
        onUpdate: () => this.player.setDepth(10 + this.player.y),
        onComplete: async () => {
          this.player.setFrame(base);
          G.s.x = nx; G.s.y = ny;
          await this.afterStep(d);
          this.moving = false;
          resolve();
        },
      });
    });
  }

  jump(lx, ly) {
    return new Promise((resolve) => {
      this.moving = true; sfx('jump');
      const sx = this.player.x, sy = this.player.y;
      const tx = (lx + this.M) * T + T / 2, ty = (ly + this.M) * T + T - 2;
      const shadow = this.add.ellipse(sx, sy - 4, 26, 8, 0x000000, 0.25).setDepth(5);
      this.tweens.addCounter({
        from: 0, to: 1, duration: 360,
        onUpdate: (tw) => {
          const t = tw.getValue();
          this.player.x = sx + (tx - sx) * t; shadow.x = this.player.x;
          const gy = sy + (ty - sy) * t; shadow.y = gy - 4;
          this.player.y = gy - Math.sin(t * Math.PI) * 26;
          this.player.setDepth(10 + gy);
        },
        onComplete: async () => {
          shadow.destroy();
          G.s.x = lx; G.s.y = ly;
          this.followTo(lx - DIRV[G.s.facing][0], ly - DIRV[G.s.facing][1], 120);
          await this.afterStep(G.s.facing);
          this.moving = false; resolve();
        },
      });
    });
  }

  async afterStep(d) {
    const m = this.map, x = G.s.x, y = G.s.y;
    if (G.s.surf && this.cell(x, y) !== '~') { G.s.surf = false; this.updateSurfFx(); } // 땅에 닿으면 내린다
    // 지도 끝 -> 이웃 지도
    const ex = this.edgeExit(x, y);
    if (ex) { await this.crossEdge(ex, x, y); return; }
    // 문/계단
    const c = this.cell(x, y);
    if (c === 'D' || c === 'U') {
      const isExitMat = !m.outdoor && c === 'D' && y === m.h - 1;
      if (!isExitMat || d === 'down') { await this.useWarp(x, y); return; }
    }
    W.updateGoal?.();
    if (await EV.stepTrigger(m.id, x, y, d)) return;
    if (await this.checkTrainers()) return;
    if (G.s.repel > 0) { G.s.repel--; if (!G.s.repel) toast('스프레이 효과가 끝났다!'); return; } // 벌레회피스프레이
    // 야생 출현: 풀숲, 또는 실내 지도에 출현표가 있으면(동굴·포켓몬타워·저택·챔피언로드) 바닥에서
    if ((c === '"' || (!m.outdoor && c === '_')) && m.wild && Math.random() < EV.encounterChance(m.wild.encounterRate)) {
      await W.wildBattle(m.wild);
    }
  }

  async crossEdge(ex, x, y) {
    const to = DB.maps[ex.to];
    let nx = x, ny = y;
    if (ex.dir === 'north') { ny = to.h - 1; nx = x - ex.offset; }
    else if (ex.dir === 'south') { ny = 0; nx = x - ex.offset; }
    else if (ex.dir === 'west') { nx = to.w - 1; ny = y - ex.offset; }
    else { nx = 0; ny = y - ex.offset; }
    W.busy = true;
    await fade(true, 140);
    await this.loadMap(ex.to, nx, ny, G.s.facing);
    save();
    await fade(false, 140);
    W.busy = false;
    await EV.enterMap(ex.to);
  }

  async useWarp(x, y) {
    const m = this.map;
    const wi = m.warps.findIndex((w) => w.x === x && w.y === y);
    if (wi < 0) return;
    const w = m.warps[wi];
    let dest = w.to || G.s.lastOutdoor;
    if (!DB.maps[dest]) { W.busy = true; await EV.lockedDoor(dest); W.busy = false; this.bounceBack(); return; }
    const tw = DB.maps[dest].warps[w.toWarp] || DB.maps[dest].warps[0];
    W.busy = true; sfx('door');
    await fade(true, 180);
    let tx = tw.x, ty = tw.y, face = G.s.facing;
    const dm = DB.maps[dest];
    if (dm.outdoor) {
      // 밖으로 나오면 문 앞 한 칸 (문이 건물 아래쪽이면 아래로, 위쪽이면 위로)
      // 지도 왼쪽·오른쪽 끝의 출입구(사파리존 구역 사이)는 안쪽 옆 칸으로 — 위아래로 서면 나무 속에 갇혔다
      const below = dm.grid[ty + 1]?.[tx];
      if (tx === 0) { tx = 1; face = 'right'; }
      else if (tx === dm.w - 1) { tx = dm.w - 2; face = 'left'; }
      else if (below && isWalkable(below) && below !== 'D') { ty += 1; face = 'down'; } else { ty -= 1; face = 'up'; }
    } else face = dm.grid[ty]?.[tx] === 'D' ? 'up' : face;
    await this.loadMap(dest, tx, ty, face, { quiet: !dm.outdoor && !EV.announceIndoor(dest) });
    save();
    await fade(false, 180);
    W.busy = false;
    await EV.enterMap(dest);
  }

  bounceBack() {
    const [dx, dy] = DIRV[G.s.facing];
    const bx = G.s.x - dx, by = G.s.y - dy;
    if (!this.blocked(bx, by)) { G.s.x = bx; G.s.y = by; this.placeSprite(this.player, bx, by); }
  }

  /* ── 필드 기술 (field.js): 풀베기 나무 'Y' · 물 '~' · 바위 앞에서 A ── */
  async fieldAction(tx, ty, npc) {
    const c = this.cell(tx, ty);
    const k = npc && npc.kind === 'boulder' ? 'strength' : c === 'Y' ? 'cut' : c === '~' && !G.s.surf ? 'surf' : null;
    if (!k) return false;
    const what = { cut: '작은 나무가 길을 막고 있다.', surf: '물이 넓게 펼쳐져 있다.', strength: '커다란 바위다. 아주 무거워 보인다.' }[k];
    const why = F.whyNot(k);
    if (why) { await say([what, why]); return true; }
    if (k === 'strength' && this.strengthOn) { await say(['괴력을 쓰는 중이야! 바위 쪽으로 걸으면 밀려.']); return true; }
    if (!(await ask(`${what} ${F.HM_KO[k]}${k === 'strength' ? '을' : '를'} 쓸까?`))) return true;
    if (k === 'cut') {
      F.doCut(this.map.id, tx, ty); save(); sfx('select');
      await this.loadMap(this.map.id, G.s.x, G.s.y, G.s.facing, { quiet: true }); // 벤 자리를 다시 그린다
      await say(['싹둑! 나무를 베었다. 이제 지나갈 수 있어!']);
    } else if (k === 'surf') {
      G.s.surf = true; this.updateSurfFx(); sfx('select');
      await say(['파도타기! 포켓몬 등에 타고 물 위로 나아간다.']);
      await this.step(G.s.facing, tx, ty);
      save();
    } else {
      this.strengthOn = true; sfx('select');
      await say(['괴력을 썼다! 바위 쪽으로 걸으면 바위가 밀려나.']);
    }
    return true;
  }
  /** 괴력: 바위를 한 칸 민다 (그 뒤가 비어 있을 때만). 민 자리는 세이브에 남는다 */
  async pushBoulder(o, d) {
    // 아이가 막히지 않게: 민 방향이 막혀 있으면 옆으로 굴려 비키고, 옆도 막혀 있으면 길 밖으로 치운다 (챔피언로드)
    const side = d === 'up' || d === 'down' ? ['left', 'right'] : ['up', 'down'];
    const free = (dir) => { const [dx, dy] = DIRV[dir], bx = o.x + dx, by = o.y + dy, c = this.cell(bx, by); return c != null && isWalkable(c) && c !== 'D' && c !== 'U' && !this.npcAt(bx, by) && !(bx === G.s.x && by === G.s.y); };
    const dir = [d, ...side].find(free);
    sfx('bump');
    if (dir) await this.walkNpc(o, dir, 1, 260);
    else {
      W.busy = true;
      try { await say(['끄응…! 괴력으로 바위를 길 밖으로 굴려 치웠다!']); } finally { W.busy = false; }
      o.sp.setVisible(false); o.x = -99; o.y = -99;
    }
    F.setBoulderPos(this.map.id, o.idx, o.x, o.y);
    save();
    return true;
  }
  /** 파도타기 물결 + 어두운 동굴(플래시 전) 시야 */
  addFieldFx() {
    this.surfFx = this.add.ellipse(0, 0, 56, 20, 0x7cc4f2, 0.95).setStrokeStyle(3, 0xffffff, 0.9).setVisible(false);
    this.mapObjs.push(this.surfFx);
    this.dark = null;
    if (F.isDark(this.map.id)) {
      const S = 1600, cv = document.createElement('canvas'); cv.width = cv.height = S;
      const g = cv.getContext('2d');
      g.fillStyle = 'rgba(6,6,16,.92)'; g.fillRect(0, 0, S, S);
      g.globalCompositeOperation = 'destination-out';
      const gr = g.createRadialGradient(S / 2, S / 2, 50, S / 2, S / 2, 165);
      gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(S / 2, S / 2, 165, 0, Math.PI * 2); g.fill();
      if (this.textures.exists('dark')) this.textures.remove('dark');
      this.textures.addCanvas('dark', cv);
      this.dark = this.add.image(0, 0, 'dark').setDepth(200000);
      this.mapObjs.push(this.dark);
    }
    this.updateSurfFx();
  }
  updateSurfFx() {
    if (this.surfFx && this.player) this.surfFx.setVisible(!!G.s.surf).setPosition(this.player.x, this.player.y - 8).setDepth(this.player.depth - 1);
    if (this.dark && this.player) this.dark.setPosition(this.player.x, this.player.y - 24);
  }

  /* ── 말 걸기 ── */
  async interact() {
    const [dx, dy] = DIRV[G.s.facing];
    let tx = G.s.x + dx, ty = G.s.y + dy;
    let npc = this.npcAt(tx, ty);
    // 카운터 너머
    if (!npc && ['C', 'M'].includes(this.cell(tx, ty))) { npc = this.npcAt(tx + dx, ty + dy); if (npc) { tx += dx; ty += dy; } }
    W.busy = true;
    try {
      if (!npc && this.fol && this.fol.x === tx && this.fol.y === ty) { await EV.talkFollower(); return; }
      if (npc && npc.kind === 'boulder') await this.fieldAction(tx, ty, npc);
      else if (npc) {
        this.faceNpcToPlayer(npc);
        await EV.talk(this.map.id, npc);
      } else {
        const sg = this.map.signs.find((s) => s.x === tx && s.y === ty);
        if (sg) await EV.readSign(this.map.id, sg);
        else if (!(await this.fieldAction(tx, ty))) await EV.inspect(this.map.id, tx, ty, this.cell(tx, ty));
      }
    } finally { W.busy = false; W.updateGoal?.(); }
  }

  faceNpcToPlayer(o) {
    if (o.kind === 'item' || o.kind === 'boulder' || o.kind === 'sleeper' || o.kind.startsWith('mon:')) return;
    const dx = G.s.x - o.x, dy = G.s.y - o.y;
    o.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    o.sp.setFrame(DIRI[o.facing] * 3);
  }

  /* ── NPC 걷기 ── */
  updateNpcs(dt) {
    if (W.busy || Input.busy()) return;
    for (const o of this.npcs) {
      if (o.n.movement !== 'Wander' || o.moving || o.gone || o.kind === 'item') continue;
      o.wait -= dt;
      if (o.wait > 0) continue;
      o.wait = 1200 + Math.random() * 2800;
      const d = ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];
      const [dx, dy] = DIRV[d];
      const nx = o.x + dx, ny = o.y + dy;
      o.facing = d; o.sp.setFrame(DIRI[d] * 3);
      const range = Math.max(1, o.n.range || 2);
      if (Math.abs(nx - o.home.x) > range || Math.abs(ny - o.home.y) > range) continue;
      if (this.blocked(nx, ny, true)) continue;
      this.walkNpc(o, d, 1);
    }
  }

  /** NPC 를 d 방향으로 n 칸 걷게 (await 가능) */
  walkNpc(o, d, n = 1, ms = 220) {
    return new Promise((resolve) => {
      const [dx, dy] = DIRV[d];
      let left = n;
      const next = () => {
        const still = o.kind === 'item' || o.kind === 'boulder'; // 그림이 한 장뿐인 것
        if (left-- <= 0) { o.moving = false; if (!still) o.sp.setFrame(DIRI[d] * 3); resolve(); return; }
        o.moving = true;
        o.x += dx; o.y += dy; o.facing = d;
        o.par = !o.par;
        if (!still) o.sp.setFrame(DIRI[d] * 3 + (o.par ? 1 : 2));
        this.tweens.add({
          targets: o.sp, x: (o.x + this.M) * T + T / 2, y: (o.y + this.M) * T + T - 2, duration: ms,
          onUpdate: () => o.sp.setDepth(10 + o.sp.y), onComplete: next,
        });
      };
      next();
    });
  }
  /** 주인공 자동 걷기 (연출용) */
  async walkPlayer(d, n = 1) {
    for (let i = 0; i < n; i++) {
      const [dx, dy] = DIRV[d];
      G.s.facing = d;
      await new Promise((resolve) => {
        const base = DIRI[d] * 3; this.stepParity = !this.stepParity;
        this.player.setFrame(base + (this.stepParity ? 1 : 2));
        this.followTo(G.s.x, G.s.y, WALK_MS);
        G.s.x += dx; G.s.y += dy;
        this.tweens.add({ targets: this.player, x: (G.s.x + this.M) * T + T / 2, y: (G.s.y + this.M) * T + T - 2, duration: WALK_MS,
          onUpdate: () => this.player.setDepth(10 + this.player.y), onComplete: () => { this.player.setFrame(base); resolve(); } });
      });
    }
  }
  facePlayer(d) { G.s.facing = d; this.player.setFrame(DIRI[d] * 3); }
  npcBy(pred) { return this.npcs.find(pred); }
  removeNpc(o) { o.gone = true; o.sp.destroy(); }
  exclaim(o) {
    return new Promise((resolve) => {
      sfx('exclaim');
      const t = this.add.text(o.sp.x, o.sp.y - CH - 4, '!', { fontFamily: 'Jua', fontSize: '30px', color: '#e3350d', stroke: '#fff', strokeThickness: 6 }).setOrigin(0.5, 1).setDepth(200000);
      this.tweens.add({ targets: t, y: t.y - 8, yoyo: true, duration: 160, repeat: 1, onComplete: () => { setTimeout(() => { t.destroy(); resolve(); }, 250); } });
    });
  }

  /* ── 따라오는 포켓몬 (파티 맨 앞) ── */
  async refreshFollower() {
    const lead = G.s.party[0];
    if (this.fol) { this.fol.img.destroy(); this.fol = null; }
    if (!lead) return;
    const key = 'fol_' + lead.sp;
    if (!this.textures.exists(key)) {
      await new Promise((res) => { this.load.image(key, `art/mon/${lead.sp}.webp`); this.load.once('complete', res); this.load.start(); });
    }
    if (!this.player || !this.player.active) return;
    const [dx, dy] = DIRV[G.s.facing] || [0, 1];
    let fx = G.s.x - dx, fy = G.s.y - dy;
    const c = this.cell(fx, fy);
    if (c == null || !isWalkable(c) || this.npcAt(fx, fy)) { fx = G.s.x; fy = G.s.y; }
    const img = this.add.image(0, 0, key).setOrigin(0.5, 1);
    img.setScale(44 / Math.max(img.width, img.height));
    this.fol = { img, x: fx, y: fy };
    this.placeFollower();
    this.mapObjs.push(img);
  }
  placeFollower() {
    const f = this.fol; if (!f) return;
    f.img.x = (f.x + this.M) * T + T / 2; f.img.y = (f.y + this.M) * T + T - 6;
    f.img.setDepth(9 + f.img.y);
  }
  followTo(x, y, ms) {
    const f = this.fol; if (!f) return;
    f.x = x; f.y = y;
    this.tweens.add({ targets: f.img, x: (x + this.M) * T + T / 2, y: (y + this.M) * T + T - 6, duration: ms, onUpdate: () => f.img.setDepth(9 + f.img.y) });
    this.tweens.add({ targets: f.img, scaleY: f.img.scaleX * 0.9, duration: ms / 2, yoyo: true });
  }

  /** 길 안내: targets=[[x,y,이름],...] 중 걸어서 닿는 첫 목표까지의 첫 방향과 걸음 수 */
  navTo(targets) {
    if (!this.map || !targets || !targets.length) return null;
    const W2 = this.map.w, H2 = this.map.h, sx = G.s.x, sy = G.s.y;
    const key = (x, y) => y * W2 + x;
    const prev = new Map([[key(sx, sy), -1]]);
    const q = [[sx, sy]];
    const want = new Map(targets.map((t, i) => [key(t[0], t[1]), i]));
    let found = null;
    // 같은 지도 안 순간이동 발판(노랑시티 체육관): 발판 칸 → 도착 칸으로 이어진 길로 본다
    const selfWarp = new Map();
    for (const w of this.map.warps || []) {
      if (w.to !== this.map.id) continue;
      const d = this.map.warps[w.toWarp];
      if (d) selfWarp.set(key(w.x, w.y), [d.x, d.y]);
    }
    for (let qi = 0; qi < q.length && !found; qi++) {
      const [cx, cy] = q[qi];
      if (want.has(key(cx, cy))) { found = [cx, cy]; break; }
      const jump = selfWarp.get(key(cx, cy));
      if (jump && (cx !== sx || cy !== sy) && !prev.has(key(jump[0], jump[1]))) { prev.set(key(jump[0], jump[1]), key(cx, cy)); q.push(jump); }
      for (const [d, [dx, dy]] of Object.entries(DIRV)) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W2 || ny >= H2 || prev.has(key(nx, ny))) continue;
        const c = this.cell(nx, ny);
        // 턱은 그 방향으로만 뛰어내린다 (한 칸 건너 착지)
        if ((c === 'v' && d === 'down') || (c === '<' && d === 'left') || (c === '>' && d === 'right')) {
          const lx = nx + dx, ly = ny + dy;
          if (lx < 0 || ly < 0 || lx >= W2 || ly >= H2 || prev.has(key(lx, ly))) continue;
          if (!isWalkable(this.cell(lx, ly)) || this.npcAt(lx, ly)) continue;
          prev.set(key(lx, ly), key(cx, cy)); q.push([lx, ly]);
          continue;
        }
        const np = this.npcAt(nx, ny);
        const pass = isWalkable(c) || (c === '~' && G.s.surf); // 파도타기 중이면 물도 길
        const through = np && (np.kind === 'item' || (np.kind === 'boulder' && !F.whyNot('strength'))); // 아이템 공은 줍고, 바위는 괴력으로 민다
        if (!want.has(key(nx, ny)) && (!pass || (np && !through))) continue;
        prev.set(key(nx, ny), key(cx, cy)); q.push([nx, ny]);
      }
    }
    if (!found) return null;
    let k = key(found[0], found[1]), dist = 0, first = k;
    while (prev.get(k) !== -1) { first = k; k = prev.get(k); dist++; }
    const fx = first % W2, fy = Math.floor(first / W2);
    const dir = fx > sx ? '→' : fx < sx ? '←' : fy > sy ? '↓' : fy < sy ? '↑' : '';
    return { dir, dist, label: targets[want.get(key(found[0], found[1]))][2] || '' };
  }

  /* ── 트레이너 시선 ── */
  async checkTrainers() {
    for (const o of this.npcs) {
      if (!o.n.isTrainer || o.gone || EV.trainerBeaten(this.map.id, o)) continue;
      const [dx, dy] = DIRV[o.facing];
      const sight = 4;
      for (let i = 1; i <= sight; i++) {
        const cx = o.x + dx * i, cy = o.y + dy * i;
        if (cx === G.s.x && cy === G.s.y) {
          W.busy = true;
          try {
            await this.exclaim(o);
            const face0 = o.facing, mapNow = this.map;
            if (i > 1) await this.walkNpc(o, o.facing, i - 1);
            const back = { up: 'down', down: 'up', left: 'right', right: 'left' }[face0];
            this.facePlayer(back);
            await EV.trainerEncounter(this.map.id, o);
            // 배틀이 끝나면 원래 자리로 돌아간다 (길을 막아 갇히지 않게)
            if (this.map === mapNow && !o.gone && i > 1) { await this.walkNpc(o, back, i - 1, 160); o.facing = face0; o.sp.setFrame(DIRI[face0] * 3); }
          } finally { W.busy = false; }
          return true;
        }
        const c = this.cell(cx, cy);
        if (c == null || !isWalkable(c) || this.npcAt(cx, cy)) break;
      }
    }
    return false;
  }
}

/** 전역 연결점 (이벤트/전투/메뉴가 서로 부른다) */
export const W = { scene: null, busy: false };
