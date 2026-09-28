/* 지도 그림: 칸 지도(grid)를 현대풍 2D 그림 두 장으로 그린다.
 *  ground = 땅·건물·나무 전부,  over = 캐릭터보다 위에 와야 하는 것(나무 윗부분, 풀숲 앞쪽 잎)
 * 원작 그림은 쓰지 않는다. 칸 종류만 보고 새로 그린다. */
export const T = 48;
export const MARGIN = 5; // 바깥 지도 둘레에 채우는 여백(칸)

// 칸 기호
const WALK = new Set(['.', ',', '"', '*', 'D', '_', 'm', 'U']);
export const isWalkable = (c) => WALK.has(c);
export const isLedge = (c) => c === 'v' || c === '<' || c === '>';

function mulberry(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function rr(g, x, y, w, h, r, fill, stroke, lw = 2) {
  g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); }
}
function circle(g, x, y, r, fill) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = fill; g.fill(); }

const PAL = {
  grass: '#8fd46b', grass2: '#7fc85d', grassDark: '#5ea844', path: '#ecd9a3', pathEdge: '#d8bf7f',
  tall: '#3f9b3a', tall2: '#2f7f2c', water: '#4fa9e8', water2: '#7cc4f2', tree: '#3d9a4a', tree2: '#2e7d3b', treeHi: '#62bd62', trunk: '#8b5a2b',
  rock: '#a89a86', rock2: '#8a7c69', rockHi: '#c9bda9', forest: '#6cae52',
};

/** 지도 그리기. map: {grid,w,h,outdoor,buildings,tileset,connections} */
export function paintMap(map) {
  const out = map.outdoor;
  const M = out ? MARGIN : 0;
  const W = map.w + M * 2, H = map.h + M * 2;
  // 여백까지 포함한 칸 배열
  const cell = (x, y) => {
    const mx = x - M, my = y - M;
    if (mx >= 0 && my >= 0 && mx < map.w && my < map.h) return map.grid[my][mx];
    if (!out) return ' ';
    // 여백: 가장 가까운 가장자리 칸을 보고 길이면 이어 그리고, 아니면 숲
    const cx = Math.max(0, Math.min(map.w - 1, mx)), cy = Math.max(0, Math.min(map.h - 1, my));
    const e = map.grid[cy][cx];
    const dir = my < 0 ? 'north' : my >= map.h ? 'south' : mx < 0 ? 'west' : 'east';
    const open = map.connections && map.connections[dir];
    if (open && (e === ',' || e === '.' || e === '"')) return e;
    if (e === '~') return '~';
    if (e === 'R') return 'R';
    return 'T';
  };
  const cv = document.createElement('canvas'); cv.width = W * T; cv.height = H * T;
  const ov = document.createElement('canvas'); ov.width = W * T; ov.height = H * T;
  const g = cv.getContext('2d'), o = ov.getContext('2d');
  const rnd = mulberry(map.w * 131 + map.h * 7 + map.grid[0].length);
  const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? (out ? 'T' : ' ') : cell(x, y));

  if (!out) { paintIndoor(g, map, rnd); return { ground: cv, over: ov, M, W, H }; }

  const forest = map.tileset === 'Forest';
  // 1) 잔디 바탕
  g.fillStyle = forest ? PAL.forest : PAL.grass; g.fillRect(0, 0, W * T, H * T);
  for (let i = 0; i < W * H * 3; i++) {
    const x = rnd() * W * T, y = rnd() * H * T;
    g.fillStyle = rnd() < 0.5 ? (forest ? '#5f9e47' : PAL.grass2) : (forest ? '#78ba5d' : '#a2de80');
    g.fillRect(x, y, 2, 5);
  }
  // 2) 흙길 (모서리 둥글게)
  const isPath = (c) => c === ',' || c === 'D';
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!isPath(at(x, y))) continue;
    const px = x * T, py = y * T;
    g.fillStyle = PAL.path; g.fillRect(px, py, T, T);
    const n = isPath(at(x, y - 1)), s = isPath(at(x, y + 1)), w = isPath(at(x - 1, y)), e = isPath(at(x + 1, y));
    const R = 16;
    g.fillStyle = forest ? PAL.forest : PAL.grass;
    const corner = (cx, cy, sx, sy) => { g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + sx * R, cy); g.arc(cx + sx * R, cy + sy * R, R, sx > 0 ? (sy > 0 ? Math.PI * 1.5 : Math.PI * 0.5) : (sy > 0 ? Math.PI * 1.5 : Math.PI * 0.5), sx > 0 ? Math.PI : 0, sx * sy > 0); g.lineTo(cx, cy); g.fill(); };
    if (!n && !w) corner(px, py, 1, 1);
    if (!n && !e) corner(px + T, py, -1, 1);
    if (!s && !w) corner(px, py + T, 1, -1);
    if (!s && !e) corner(px + T, py + T, -1, -1);
    // 작은 자갈
    for (let i = 0; i < 3; i++) { g.fillStyle = rnd() < 0.5 ? PAL.pathEdge : '#f6e8bf'; g.beginPath(); g.ellipse(px + 8 + rnd() * 32, py + 8 + rnd() * 32, 2 + rnd() * 2, 1.5, 0, 0, Math.PI * 2); g.fill(); }
  }
  // 3) 물
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (at(x, y) !== '~') continue;
    const px = x * T, py = y * T;
    g.fillStyle = PAL.water; g.fillRect(px, py, T, T);
    if (at(x, y - 1) !== '~') { g.fillStyle = '#e9f6ff'; g.fillRect(px, py, T, 5); g.fillStyle = '#3b8fd0'; g.fillRect(px, py + 5, T, 3); }
    g.strokeStyle = PAL.water2; g.lineWidth = 2;
    for (let i = 0; i < 2; i++) { const yy = py + 14 + i * 18 + rnd() * 4; g.beginPath(); g.moveTo(px + 6 + rnd() * 6, yy); g.quadraticCurveTo(px + 24, yy - 5, px + 40, yy); g.stroke(); }
  }
  // 4) 칸 하나씩 (풀숲, 꽃, 턱, 울타리, 절벽, 표지판)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const c = at(x, y), px = x * T, py = y * T;
    if (c === '"') tallGrass(g, o, px, py, rnd);
    else if (c === '*') flowers(g, px, py, rnd);
    else if (c === 'v') { g.fillStyle = '#5b9a40'; rr(g, px - 1, py + T - 16, T + 2, 12, 6, '#6aa84b'); g.fillStyle = '#4a7f33'; g.fillRect(px, py + T - 8, T, 6); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(px + 2, py + T - 16, T - 4, 2); }
    else if (c === '<' || c === '>') { const s = c === '<' ? 0 : T - 10; rr(g, px + s, py - 1, 10, T + 2, 5, '#6aa84b'); g.fillStyle = '#4a7f33'; g.fillRect(px + s + (c === '<' ? 0 : 6), py, 4, T); }
    else if (c === '#') fence(g, px, py, at(x - 1, y) === '#', at(x + 1, y) === '#', at(x, y - 1) === '#' || at(x, y + 1) === '#');
    else if (c === 'R') rock(g, px, py, at(x, y - 1) === 'R', at(x, y + 1) === 'R', at(x - 1, y) === 'R', at(x + 1, y) === 'R', rnd);
    else if (c === 'S') sign(g, px, py);
  }
  // 5) 건물
  for (const b of map.buildings || []) building(g, o, b, M);
  // 6) 나무 (위에서 아래 순서로 그려 아래 나무가 앞에 오도록)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (at(x, y) === 'T') tree(g, o, x * T, y * T, rnd, forest);
  return { ground: cv, over: ov, M, W, H };
}

function tallGrass(g, o, px, py, rnd) {
  g.fillStyle = PAL.tall2; rr(g, px + 1, py + 3, T - 2, T - 4, 10, PAL.tall2);
  const blades = (ctx, y0, y1, n, col) => {
    for (let i = 0; i < n; i++) {
      const bx = px + 4 + (i / n) * (T - 8) + rnd() * 4, h = 14 + rnd() * 10;
      const by = y0 + rnd() * (y1 - y0);
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(bx - 4, by); ctx.quadraticCurveTo(bx - 1, by - h * 0.6, bx + 1 + rnd() * 3, by - h); ctx.quadraticCurveTo(bx + 1, by - h * 0.5, bx + 4, by); ctx.fill();
    }
  };
  blades(g, py + 18, py + 30, 7, PAL.tall);
  blades(g, py + 30, py + 44, 7, '#4fb046');
  // 앞쪽 잎은 캐릭터 위에 (다리가 풀에 잠겨 보이게)
  blades(o, py + 40, py + 47, 8, '#53b84a');
}
function flowers(g, px, py, rnd) {
  const cols = ['#ff6b8b', '#ffd23f', '#ffffff', '#ff9f43'];
  for (let i = 0; i < 4; i++) {
    const x = px + 8 + rnd() * 32, y = py + 8 + rnd() * 32, c = cols[Math.floor(rnd() * cols.length)];
    for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; circle(g, x + Math.cos(a) * 3.5, y + Math.sin(a) * 3.5, 3, c); }
    circle(g, x, y, 2.4, '#f5a623');
  }
}
function fence(g, px, py, l, r, vert) {
  g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(px + 4, py + T - 10, T - 8, 5);
  if (!vert || l || r) { rr(g, l ? px : px + 8, py + 18, (l ? 0 : -8) + (r ? T : T - 8), 7, 3, '#c89060'); rr(g, l ? px : px + 8, py + 30, (l ? 0 : -8) + (r ? T : T - 8), 7, 3, '#b07a4c'); }
  if (vert && !l && !r) { rr(g, px + 19, py, 10, T, 4, '#c89060'); }
  rr(g, px + 18, py + 8, 12, 34, 4, '#d9a46c', '#8d5a2b', 2);
}
function rock(g, px, py, up, down, left, right, rnd) {
  rr(g, px - (left ? 1 : 0), py - (up ? 1 : 0), T + (left ? 1 : 0) + (right ? 1 : 0), T + (up ? 1 : 0) + (down ? 1 : 0), up || down || left || right ? 4 : 14, PAL.rock);
  if (!up) { g.fillStyle = PAL.rockHi; g.fillRect(px, py, T, 8); g.fillStyle = '#7fbf5e'; g.fillRect(px, py, T, 4); }
  if (!down) { g.fillStyle = PAL.rock2; g.fillRect(px, py + T - 14, T, 14); g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(px, py + T - 4, T, 4); }
  for (let i = 0; i < 3; i++) { g.strokeStyle = PAL.rock2; g.lineWidth = 2; const x = px + 6 + rnd() * 30, y = py + 12 + rnd() * 20; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 8, y + 4); g.stroke(); }
}
function sign(g, px, py) {
  g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(px + 24, py + 44, 14, 4, 0, 0, Math.PI * 2); g.fill();
  rr(g, px + 21, py + 22, 6, 22, 2, '#8b5a2b');
  rr(g, px + 6, py + 8, 36, 20, 5, '#d9a46c', '#8d5a2b', 2.5);
  g.fillStyle = '#8d5a2b'; g.fillRect(px + 12, py + 14, 24, 2.5); g.fillRect(px + 12, py + 20, 18, 2.5);
}
function tree(g, o, px, py, rnd, forest) {
  const cx = px + T / 2, cy = py + T / 2 - 6;
  const R = T * 0.56 + rnd() * 3;
  const col = forest ? '#2f8a3f' : PAL.tree, col2 = forest ? '#236e31' : PAL.tree2, hi = forest ? '#4ea85a' : PAL.treeHi;
  const draw = (ctx) => {
    ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.beginPath(); ctx.ellipse(cx, py + T - 5, R * 0.8, 6, 0, 0, Math.PI * 2); ctx.fill();
    rr(ctx, cx - 5, py + T - 18, 10, 14, 3, PAL.trunk);
    circle(ctx, cx, cy, R, col2);
    circle(ctx, cx - 3, cy - 3, R * 0.88, col);
    circle(ctx, cx - R * 0.35, cy - R * 0.35, R * 0.38, hi);
    circle(ctx, cx + R * 0.3, cy + R * 0.2, R * 0.25, col2);
  };
  draw(g);
  // 칸 위로 삐져나온 윗부분은 캐릭터 위에 한 번 더 (나무 뒤로 지나가는 느낌)
  o.save(); o.beginPath(); o.rect(px - T, py - T, T * 3, T); o.clip(); draw(o); o.restore();
}

const BSTYLE = {
  house: { wall: '#fff3dc', roof: '#d9534f', roof2: '#b33c38', label: null },
  lab: { wall: '#f3f6fb', roof: '#6b7fa3', roof2: '#51628a', label: '오박사 연구소' },
  center: { wall: '#ffffff', roof: '#ef5350', roof2: '#c62828', label: '포켓몬센터', emblem: 'ball' },
  mart: { wall: '#ffffff', roof: '#42a5f5', roof2: '#1e88e5', label: '프렌들리숍', emblem: 'shop' },
  gym: { wall: '#eceff1', roof: '#7e57c2', roof2: '#5e35b1', label: '체육관' },
  museum: { wall: '#f5eee0', roof: '#8d6e63', roof2: '#6d4c41', label: '박물관', columns: true },
  school: { wall: '#fff8d6', roof: '#f9a825', roof2: '#f57f17', label: '트레이너 학교' },
  gate: { wall: '#eeeeee', roof: '#78909c', roof2: '#546e7a', label: null },
  cave: { cave: true },
};
function building(g, o, b, M) {
  const st = BSTYLE[b.kind] || BSTYLE.house;
  const x = (b.x + M) * T, y = (b.y + M) * T, w = b.w * T, h = b.h * T;
  if (st.cave) {
    rr(g, x, y, w, h, 20, PAL.rock); g.fillStyle = PAL.rockHi; g.fillRect(x, y, w, 10);
    for (const d of b.doors) { const dx = (d.x + M) * T, dy = (d.y + M) * T; g.fillStyle = '#1a1410'; g.beginPath(); g.ellipse(dx + T / 2, dy + T * 0.6, T * 0.55, T * 0.5, 0, Math.PI, 0); g.fill(); g.fillRect(dx + 2, dy + T * 0.6, T - 4, T * 0.4); }
    return;
  }
  const doorTop = b.doors.some((d) => d.y === b.y);
  const roofH = Math.max(T * 0.9, h * (b.kind === 'gate' ? 0.5 : 0.5));
  // 그림자
  g.fillStyle = 'rgba(0,0,0,.18)'; rr(g, x + 6, y + 10, w, h, 10, 'rgba(0,0,0,.16)');
  // 벽
  rr(g, x + 3, y + roofH - 10, w - 6, h - roofH + 8, 6, st.wall, '#9aa3b5', 2);
  // 지붕
  g.fillStyle = st.roof; g.beginPath(); g.moveTo(x - 4, y + roofH); g.lineTo(x + 10, y + 4); g.lineTo(x + w - 10, y + 4); g.lineTo(x + w + 4, y + roofH); g.closePath(); g.fill();
  g.strokeStyle = st.roof2; g.lineWidth = 3; g.stroke();
  g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 2;
  for (let i = 1; i < 4; i++) { const yy = y + 4 + (roofH - 4) * (i / 4); g.beginPath(); g.moveTo(x + 6 - i, yy); g.lineTo(x + w - 6 + i, yy); g.stroke(); }
  rr(g, x - 6, y + roofH - 6, w + 12, 8, 4, st.roof2);
  // 창문
  const winY = y + roofH + 8, winH = Math.min(26, h - roofH - 30);
  if (winH > 10) {
    for (let wx = x + 16; wx < x + w - 36; wx += 44) {
      const nearDoor = b.doors.some((d) => Math.abs((d.x + M) * T - wx) < T * 0.9);
      if (nearDoor) continue;
      rr(g, wx, winY, 26, winH, 4, '#bfe3ff', '#7a8aa6', 2);
      g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(wx + 4, winY + 3, 6, winH - 6);
    }
  }
  if (st.columns) for (let cx2 = x + 14; cx2 < x + w - 10; cx2 += 34) rr(g, cx2, y + roofH, 10, h - roofH - 6, 3, '#e6dccb', '#b8a88f', 1.5);
  // 간판
  if (st.label) {
    g.font = `600 ${Math.min(18, Math.max(12, w / (st.label.length + 3)))}px "Jua", sans-serif`;
    const tw = g.measureText(st.label).width + 16;
    rr(g, x + w / 2 - tw / 2, y + roofH * 0.35 - 12, tw, 24, 8, '#fff', st.roof2, 2);
    g.fillStyle = st.roof2; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(st.label, x + w / 2, y + roofH * 0.35);
  }
  if (st.emblem === 'ball') {
    const ex = x + w / 2, ey = y + roofH * 0.75; const r = 12;
    g.fillStyle = '#e3350d'; g.beginPath(); g.arc(ex, ey, r, Math.PI, 0); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(ex, ey, r, 0, Math.PI); g.fill();
    g.strokeStyle = '#222'; g.lineWidth = 2; g.beginPath(); g.arc(ex, ey, r, 0, Math.PI * 2); g.moveTo(ex - r, ey); g.lineTo(ex + r, ey); g.stroke(); circle(g, ex, ey, 4, '#fff');
  }
  // 문
  for (const d of b.doors) {
    const dx = (d.x + M) * T, dy = (d.y + M) * T;
    if (doorTop && d.y === b.y) { rr(g, dx + 8, dy + 2, T - 16, T * 0.6, 6, '#6d4c41'); continue; }
    rr(g, dx + 8, dy + 4, T - 16, T - 6, 6, b.kind === 'center' || b.kind === 'mart' ? '#9ad3ff' : '#8d5a3b', '#4e342e', 2);
    if (b.kind === 'center' || b.kind === 'mart') { g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(dx + T / 2 - 1, dy + 6, 2, T - 10); }
    else circle(g, dx + T - 14, dy + T / 2 + 2, 2.5, '#ffd54f');
    rr(g, dx + 4, dy + T - 6, T - 8, 6, 3, '#bfa27a');
  }
}

/* ── 실내 ── */
const FLOOR = {
  RedsHouse1: ['#e2c28f', '#d4b07a', 'wood'], RedsHouse2: ['#e2c28f', '#d4b07a', 'wood'], House: ['#e2c28f', '#d4b07a', 'wood'],
  Dojo: ['#eef1f6', '#dfe4ee', 'tile'], Pokecenter: ['#fdf1f4', '#f3dde4', 'tile'], Mart: ['#eef6ff', '#dde9f7', 'tile'],
  Gym: ['#cfc4b0', '#bcb09a', 'stone'], ForestGate: ['#e8eadf', '#d6d9ca', 'tile'], Gate: ['#e8eadf', '#d6d9ca', 'tile'],
};
const WALLC = { RedsHouse1: '#f6e7c8', RedsHouse2: '#dfeefe', House: '#f6e7c8', Dojo: '#e3ecf7', Pokecenter: '#ffe3ea', Mart: '#e0efff', Gym: '#9e9582', ForestGate: '#e2ead7', Gate: '#e2ead7' };

function comps(map, ch) {
  const seen = new Set(), out = [];
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
    if (map.grid[y][x] !== ch || seen.has(x + ',' + y)) continue;
    let x1 = x; while (x1 + 1 < map.w && map.grid[y][x1 + 1] === ch) x1++;
    let y1 = y; while (y1 + 1 < map.h && [...Array(x1 - x + 1).keys()].every((i) => map.grid[y1 + 1][x + i] === ch)) y1++;
    for (let yy = y; yy <= y1; yy++) for (let xx = x; xx <= x1; xx++) seen.add(xx + ',' + yy);
    out.push({ x, y, w: x1 - x + 1, h: y1 - y + 1 });
  }
  return out;
}

function paintIndoor(g, map, rnd) {
  const [f1, f2, kind] = FLOOR[map.tileset] || FLOOR.House;
  const wall = WALLC[map.tileset] || '#eee';
  g.fillStyle = '#1a2238'; g.fillRect(0, 0, map.w * T, map.h * T);
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
    const px = x * T, py = y * T;
    if (kind === 'wood') { g.fillStyle = y % 2 ? f1 : f2; g.fillRect(px, py, T, T); g.fillStyle = 'rgba(0,0,0,.06)'; g.fillRect(px + ((y * 17) % T), py, 2, T); g.fillRect(px, py + T - 2, T, 2); }
    else if (kind === 'tile') { g.fillStyle = (x + y) % 2 ? f1 : f2; g.fillRect(px, py, T, T); }
    else { g.fillStyle = f1; g.fillRect(px, py, T, T); g.strokeStyle = f2; g.lineWidth = 2; g.strokeRect(px + 2, py + 2, T - 4, T - 4); }
  }
  // 벽: 'W' 칸 (보통 윗줄)
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
    if (map.grid[y][x] !== 'W') continue;
    const px = x * T, py = y * T;
    g.fillStyle = wall; g.fillRect(px, py, T, T);
    g.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 4; i++) g.fillRect(px + i * 12 + 4, py, 2, T - 10);
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(px, py + T - 10, T, 10);
  }
  const draw = {
    K: (b) => { rr(g, b.x * T + 2, b.y * T + 2, b.w * T - 4, b.h * T - 4, 6, '#8d5a3b', '#5d3a22', 2); for (let yy = 0; yy < b.h * 2; yy++) for (let i = 0; i < b.w * 5; i++) { g.fillStyle = ['#e57373', '#64b5f6', '#81c784', '#ffd54f', '#ba68c8'][(i + yy) % 5]; g.fillRect(b.x * T + 8 + i * 8.5, b.y * T + 8 + yy * (T / 2), 6, T / 2 - 12); } },
    P: (b) => { for (let yy = 0; yy < b.h; yy++) for (let xx = 0; xx < b.w; xx++) { const px = (b.x + xx) * T, py = (b.y + yy) * T; rr(g, px + 14, py + 28, 20, 16, 4, '#c0703f'); circle(g, px + 24, py + 20, 13, '#3d9a4a'); circle(g, px + 18, py + 16, 7, '#62bd62'); } },
    O: (b) => { for (let yy = 0; yy < b.h; yy++) for (let xx = 0; xx < b.w; xx++) { const px = (b.x + xx) * T, py = (b.y + yy) * T; g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(px + 24, py + 42, 20, 5, 0, 0, Math.PI * 2); g.fill(); circle(g, px + 24, py + 24, 20, '#9e8f78'); circle(g, px + 18, py + 17, 8, '#c2b49c'); g.strokeStyle = '#6f624f'; g.lineWidth = 2; g.beginPath(); g.moveTo(px + 20, py + 30); g.lineTo(px + 30, py + 36); g.stroke(); } },
    Q: (b) => { const px = b.x * T, py = b.y * T; rr(g, px + 8, py + 30, 32, 14, 4, '#9e9e9e'); circle(g, px + 24, py + 20, 12, '#bdbdbd'); circle(g, px + 20, py + 15, 4, '#e0e0e0'); },
    t: (b) => { rr(g, b.x * T + 4, b.y * T + 6, b.w * T - 8, b.h * T - 10, 8, '#b7835a', '#7a5334', 2.5); g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(b.x * T + 10, b.y * T + 10, b.w * T - 20, 4); },
    C: (b) => { rr(g, b.x * T, b.y * T + 8, b.w * T, b.h * T - 8, 6, '#f6f6f6', '#c9a0a8', 2.5); g.fillStyle = '#ef9a9a'; g.fillRect(b.x * T, b.y * T + T - 12, b.w * T, 6); },
    M: (b) => { for (let yy = 0; yy < b.h; yy++) for (let xx = 0; xx < b.w; xx++) { const px = (b.x + xx) * T, py = (b.y + yy) * T; rr(g, px + 6, py + 6, 36, 28, 5, '#cfd8dc', '#607d8b', 2); rr(g, px + 10, py + 10, 28, 18, 3, '#4fc3f7'); rr(g, px + 14, py + 36, 20, 8, 2, '#90a4ae'); } },
    V: (b) => { const px = b.x * T, py = b.y * T; rr(g, px + 4, py + 26, 40, 18, 4, '#8d6e63'); rr(g, px + 8, py + 4, 32, 24, 4, '#263238'); rr(g, px + 11, py + 7, 26, 18, 2, '#4dd0e1'); },
    b: (b) => { rr(g, b.x * T + 3, b.y * T + 3, b.w * T - 6, b.h * T - 6, 8, '#fff', '#90a4ae', 2); rr(g, b.x * T + 3, b.y * T + T * 0.6, b.w * T - 6, b.h * T - T * 0.6 - 3, 8, '#64b5f6'); rr(g, b.x * T + 8, b.y * T + 8, b.w * T - 16, 14, 6, '#e3f2fd'); },
    N: (b) => { rr(g, b.x * T + 3, b.y * T + 4, b.w * T - 6, b.h * T - 12, 5, '#2e5d3a', '#8d6e63', 4); g.fillStyle = '#fff'; g.font = '600 13px Jua, sans-serif'; g.textAlign = 'left'; g.fillText('1+1=2', b.x * T + 10, b.y * T + 22); },
    f: (b) => { rr(g, b.x * T + 3, b.y * T + 4, b.w * T - 6, b.h * T - 8, 6, '#a1887f', '#6d4c41', 2); },
    S: (b) => { for (let xx = 0; xx < b.w; xx++) { const px = (b.x + xx) * T, py = b.y * T; rr(g, px + 8, py + 6, 32, 28, 5, '#cfd8dc', '#607d8b', 2); rr(g, px + 12, py + 10, 24, 18, 3, '#81d4fa'); } },
  };
  for (const ch of Object.keys(draw)) for (const b of comps(map, ch)) draw[ch](b);
  // 계단, 매트, 출구
  for (let y = 0; y < map.h; y++) for (let x = 0; x < map.w; x++) {
    const c = map.grid[y][x], px = x * T, py = y * T;
    if (c === 'U') { for (let i = 0; i < 4; i++) rr(g, px + 4, py + 4 + i * 10, T - 8, 8, 2, i % 2 ? '#bca27f' : '#d7bf99', '#8d6e63', 1); }
    else if (c === 'm') rr(g, px + 4, py + 8, T - 8, T - 16, 6, '#c96b6b', '#8d3c3c', 2);
    else if (c === 'D') { rr(g, px + 2, py + 10, T - 4, T - 14, 6, '#7e9ed9', '#3b5c9a', 2); g.fillStyle = '#fff'; g.font = '600 12px Jua, sans-serif'; g.textAlign = 'center'; g.fillText('▼', px + T / 2, py + 30); }
  }
}
