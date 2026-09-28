/* map.js — 타일맵 자유 이동. 테마 규약만 읽는다.
 * skin.map.palette / skin.encounter / skin.poi / skin.decor 로 그린다. */
(function (global) {
  'use strict';

  const T = { GRASS: 0, PATH: 1, TALL: 2, WATER: 3, GATE: 4, LIB: 5, TREE: 6 };

  function World(skin, list, state) {
    this.skin = skin; this.list = list; this.state = state;
    this.w = skin.map.w; this.h = skin.map.h;
    this.tile = skin.map.tile;
    this.encTile = T[skin.encounter.tile] || T.TALL;
    this.poiTile = T[skin.poi.tile] || T.LIB;
    this.build();
  }

  /* 몬스터 티어 순서대로 성문을 배치 → 앞을 깨야 다음이 열린다.
   * 시작점에서 가까운 순으로 = 약한 포켓몬부터 자연스럽게 마주친다. */
  World.prototype.build = function () {
    const rnd = mulberry(20260928);
    const g = [];
    for (let y = 0; y < this.h; y++) {
      g[y] = [];
      for (let x = 0; x < this.w; x++) g[y][x] = (rnd() < 0.14) ? T.PATH : T.GRASS;
    }
    const sx = 3, sy = Math.floor(this.h / 2);
    g[sy][sx] = T.PATH;
    this.spawn = { x: sx * this.tile + this.tile / 2, y: sy * this.tile + this.tile / 2 };

    this.gates = [];
    const placed = [];
    for (let i = 0; i < this.list.length; i++) {
      const p = this.findOpen(g, rnd, placed);
      g[p.y][p.x] = this.encTile;
      this.gates.push({ x: p.x, y: p.y, idx: i, monster: this.list[i] });
      placed.push(p);
    }
    this.libs = [];
    for (let k = 0; k < 2; k++) {
      const p = this.findOpen(g, rnd, this.libs);
      g[p.y][p.x] = this.poiTile;
      this.libs.push(p);
    }
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      if (g[y][x] === T.GRASS && rnd() < 0.05) g[y][x] = T.TREE;
    }
    this.grid = g;
  };

  World.prototype.findOpen = function (g, rnd, avoid) {
    for (let tries = 0; tries < 1200; tries++) {
      const x = 1 + Math.floor(rnd() * (this.w - 2));
      const y = 1 + Math.floor(rnd() * (this.h - 2));
      if (g[y][x] !== T.GRASS) continue;
      if (avoid) {
        const pts = Array.isArray(avoid) ? avoid : [avoid];
        if (pts.some(p => p && Math.hypot(p.x - x, p.y - y) < 4)) continue;
      }
      return { x, y };
    }
    return { x: 2, y: 2 };
  };

  World.prototype.at = function (tx, ty) {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return T.WATER;
    return this.grid[ty][tx];
  };
  World.prototype.walkable = function (tx, ty) {
    const t = this.at(tx, ty);
    return t === T.GRASS || t === T.PATH || t === T.TALL;
  };
  World.prototype.gateAt = function (tx, ty) {
    return this.gates.find(g => g.x === tx && g.y === ty) || null;
  };
  World.prototype.libAt = function (tx, ty) {
    return this.libs.find(l => l.x === tx && l.y === ty) || null;
  };

  function mulberry(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  global.MB.T = T;
  global.MB.World = World;
})(window);
