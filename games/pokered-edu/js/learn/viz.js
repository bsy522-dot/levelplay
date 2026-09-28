/* 설명 그림: 문제/설명에 붙는 작은 그림을 캔버스로 그린다. 반환값은 <canvas>. */
import { fixJosa } from './math.js';
const C = { ink: '#1d2433', a: '#e3350d', b: '#3b6cd4', c: '#3fb950', soft: '#e8eefb', y: '#ffcb05', grey: '#b9c2d6', box: '#fff' };

function canvas(w, h) {
  const r = Math.min(2, window.devicePixelRatio || 1);
  const cv = document.createElement('canvas');
  cv.width = w * r; cv.height = h * r; cv.style.width = w + 'px';
  const g = cv.getContext('2d');
  g.scale(r, r);
  g.lineJoin = 'round'; g.lineCap = 'round';
  g.font = '600 18px "Jua", "Gowun Dodum", sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  return [cv, g];
}
function ball(g, x, y, r, col = C.a) {
  g.fillStyle = col; g.beginPath(); g.arc(x, y, r, Math.PI, 0); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, r, 0, Math.PI); g.fill();
  g.strokeStyle = C.ink; g.lineWidth = Math.max(1.5, r / 6);
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(x - r, y); g.lineTo(x + r, y); g.stroke();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, r / 3, 0, Math.PI * 2); g.fill(); g.stroke();
}
function dot(g, x, y, r, col) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
function rbox(g, x, y, w, h, r, fill, stroke) {
  g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h);
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.strokeStyle = stroke; g.lineWidth = 2; g.stroke(); }
}
function text(g, s, x, y, col = C.ink, size = 18) { g.fillStyle = col; g.font = `600 ${size}px "Jua", "Gowun Dodum", sans-serif`; g.fillText(s, x, y); }

function tenFrame(g, x, y, filled, col, extra = 0, col2 = C.b, cell = 34) {
  for (let i = 0; i < 10; i++) {
    const cx = x + (i % 5) * cell, cy = y + Math.floor(i / 5) * cell;
    rbox(g, cx, cy, cell - 4, cell - 4, 6, C.soft, C.grey);
    if (i < filled) dot(g, cx + cell / 2 - 2, cy + cell / 2 - 2, cell / 3, col);
    else if (i < filled + extra) dot(g, cx + cell / 2 - 2, cy + cell / 2 - 2, cell / 3, col2);
  }
}

function clock(g, cx, cy, R, h, m, explain) {
  g.fillStyle = '#fff'; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
  g.strokeStyle = C.ink; g.lineWidth = 4; g.stroke();
  for (let i = 1; i <= 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    text(g, String(i), cx + Math.cos(a) * R * 0.78, cy + Math.sin(a) * R * 0.78, C.ink, Math.round(R * 0.2));
  }
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2; const l = i % 5 ? 0.95 : 0.9;
    g.lineWidth = i % 5 ? 1 : 2; g.beginPath();
    g.moveTo(cx + Math.cos(a) * R * l, cy + Math.sin(a) * R * l); g.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); g.stroke();
  }
  const ha = (((h % 12) + m / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  const ma = (m / 60) * Math.PI * 2 - Math.PI / 2;
  g.strokeStyle = C.a; g.lineWidth = 7; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ha) * R * 0.5, cy + Math.sin(ha) * R * 0.5); g.stroke();
  g.strokeStyle = C.b; g.lineWidth = 4; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(ma) * R * 0.82, cy + Math.sin(ma) * R * 0.82); g.stroke();
  dot(g, cx, cy, 5, C.ink);
  if (explain) {
    text(g, '짧은바늘 = 시', cx + R + 70, cy - 14, C.a, 16);
    text(g, '긴바늘 = 분', cx + R + 70, cy + 14, C.b, 16);
  }
}

function pie(g, cx, cy, R, n, d, col = C.a) {
  for (let i = 0; i < d; i++) {
    const a0 = (i / d) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / d) * Math.PI * 2 - Math.PI / 2;
    g.beginPath(); g.moveTo(cx, cy); g.arc(cx, cy, R, a0, a1); g.closePath();
    g.fillStyle = i < n ? col : '#fff'; g.fill(); g.strokeStyle = C.ink; g.lineWidth = 2; g.stroke();
  }
}
function barFrac(g, x, y, w, h, n, d, col = C.a) {
  for (let i = 0; i < d; i++) {
    g.fillStyle = i < n ? col : '#fff';
    g.fillRect(x + (w / d) * i, y, w / d, h);
    g.strokeStyle = C.ink; g.lineWidth = 2; g.strokeRect(x + (w / d) * i, y, w / d, h);
  }
}

const DRAW = {
  count({ n, label }) {
    const [cv, g] = canvas(460, 70 + (n > 5 ? 50 : 0));
    for (let i = 0; i < n; i++) {
      const x = 60 + (i % 5) * 82, y = 38 + Math.floor(i / 5) * 54;
      ball(g, x, y, 20);
      if (label) text(g, String(i + 1), x + 26, y - 18, C.b, 15);
    }
    return cv;
  },
  numline({ from, to, marks = [], hi }) {
    const [cv, g] = canvas(500, 90);
    const x0 = 30, x1 = 470, y = 50, step = (x1 - x0) / (to - from);
    g.strokeStyle = C.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
    for (let v = from; v <= to; v++) {
      const x = x0 + (v - from) * step;
      g.lineWidth = 2; g.beginPath(); g.moveTo(x, y - 8); g.lineTo(x, y + 8); g.stroke();
      text(g, String(v), x, y + 24, C.ink, 15);
      if (marks.includes(v)) dot(g, x, y - 20, 9, v === hi ? C.a : C.b);
    }
    text(g, '작다', x0 + 10, 14, C.grey, 14); text(g, '크다 →', x1 - 20, 14, C.a, 14);
    return cv;
  },
  dots({ a, b, op }) {
    const [cv, g] = canvas(500, 110);
    if (op === '+') {
      for (let i = 0; i < a; i++) dot(g, 30 + i * 40, 40, 14, C.a);
      text(g, '+', 30 + a * 40, 40, C.ink, 24);
      for (let i = 0; i < b; i++) dot(g, 30 + (a + 1) * 40 + i * 40, 40, 14, C.b);
      text(g, `모두 ${a + b}개`, 250, 92, C.ink, 18);
    } else {
      for (let i = 0; i < a; i++) {
        const x = 30 + i * 44; dot(g, x, 40, 14, i >= a - b ? C.grey : C.a);
        if (i >= a - b) { g.strokeStyle = C.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 12, 28); g.lineTo(x + 12, 52); g.stroke(); }
      }
      text(g, `${b}개 지우면 ${a - b}개 남아`, 250, 92, C.ink, 18);
    }
    return cv;
  },
  tenframe({ a, b }) {
    const [cv, g] = canvas(420, 110);
    tenFrame(g, 30, 20, a, C.a, b, C.b);
    text(g, `${a} + ${b} = 10`, 330, 55, C.ink, 22);
    return cv;
  },
  tenframe2({ a, b }) {
    const [cv, g] = canvas(520, 130);
    const fill = 10 - a;
    tenFrame(g, 20, 20, a, C.a, fill, C.b);
    tenFrame(g, 220, 20, 0, C.a, b - fill, C.b);
    text(g, `10 + ${b - fill} = ${a + b}`, 450, 55, C.ink, 20);
    text(g, fixJosa(`${b}를 ${fill}와 ${b - fill}로 가르기`), 190, 112, '#8a6d00', 15);
    return cv;
  },
  borrow({ a, b }) {
    const [cv, g] = canvas(520, 130);
    tenFrame(g, 20, 20, 10, C.a);
    for (let i = 0; i < b; i++) {
      const cx = 20 + (i % 5) * 34, cy = 20 + Math.floor(i / 5) * 34;
      g.strokeStyle = C.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(cx + 5, cy + 5); g.lineTo(cx + 25, cy + 25); g.stroke();
    }
    for (let i = 0; i < a - 10; i++) dot(g, 240 + i * 36, 45, 13, C.a);
    text(g, `(10 − ${b}) + ${a - 10} = ${a - b}`, 300, 105, C.ink, 20);
    return cv;
  },
  blocks({ n }) {
    const h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, o = n % 10;
    const [cv, g] = canvas(520, 140);
    let x = 16;
    for (let i = 0; i < h; i++) { rbox(g, x, 14, 60, 60, 4, '#ffd9cf', C.a); text(g, '100', x + 30, 44, C.a, 15); x += 66; }
    for (let i = 0; i < t; i++) { rbox(g, x, 14, 14, 60, 3, '#dbe6ff', C.b); x += 18; }
    x += 8;
    for (let i = 0; i < o; i++) { rbox(g, x, 60, 14, 14, 3, '#dcf7e5', C.c); x += 18; }
    text(g, `${h ? `백 ${h}개, ` : ''}십 ${t}개, 일 ${o}개 → ${n}`, 260, 110, C.ink, 20);
    return cv;
  },
  col({ a, b, op }) {
    const res = op === '+' ? a + b : a - b;
    const w = Math.max(String(a).length, String(b).length, String(res).length);
    const [cv, g] = canvas(300, 190);
    const cw = 44, right = 230;
    const put = (num, row, col = C.ink) => String(num).split('').reverse().forEach((ch, i) => text(g, ch, right - i * cw, 50 + row * 46, col, 30));
    put(a, 0); put(b, 1); text(g, op === '+' ? '+' : '−', right - w * cw - 10, 96, C.ink, 30);
    g.strokeStyle = C.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(right - w * cw - 30, 122); g.lineTo(right + 24, 122); g.stroke();
    put(res, 2, C.a);
    // 받아올림/받아내림 표시
    const as = String(a).split('').reverse().map(Number), bs = String(b).split('').reverse().map(Number);
    let carry = 0;
    for (let i = 0; i < w; i++) {
      const x = as[i] || 0, y = bs[i] || 0;
      if (op === '+') { if (x + y + carry >= 10 && i + 1 < w + 1) { text(g, '1', right - (i + 1) * cw, 16, C.b, 16); carry = 1; } else carry = 0; }
      else if (x - carry < y) { text(g, '10', right - i * cw + 14, 22, C.b, 13); carry = 1; } else carry = 0;
    }
    return cv;
  },
  clock({ h, m, explain }) {
    const [cv, g] = canvas(explain ? 360 : 220, 200);
    clock(g, 100, 100, 88, h, m, explain);
    return cv;
  },
  groups({ a, b }) {
    const [cv, g] = canvas(520, 110);
    const gw = Math.min(110, 480 / b);
    for (let j = 0; j < b; j++) {
      rbox(g, 14 + j * gw, 14, gw - 10, 64, 14, '#eef3ff', C.b);
      for (let i = 0; i < a; i++) ball(g, 14 + j * gw + 16 + (i % 3) * ((gw - 30) / 3), 34 + Math.floor(i / 3) * 26, 9);
    }
    text(g, `${a}개씩 ${b}묶음`, 260, 96, C.ink, 17);
    return cv;
  },
  array({ r, c }) {
    const cell = Math.min(34, 420 / c, 200 / r);
    const [cv, g] = canvas(Math.max(260, c * cell + 120), r * cell + 40);
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) dot(g, 30 + j * cell, 22 + i * cell, cell / 3, i % 2 ? C.b : C.a);
    text(g, `${c} × ${r} = ${c * r}`, c * cell + 70, (r * cell) / 2 + 12, C.ink, 20);
    return cv;
  },
  ruler({ m, cm }) {
    const [cv, g] = canvas(520, 100);
    const tot = m * 100 + cm, sc = 480 / Math.max(tot, 100);
    for (let i = 0; i < m; i++) { rbox(g, 20 + i * 100 * sc, 20, 100 * sc - 2, 30, 6, i % 2 ? '#ffd9cf' : '#ffe9a8', C.ink); text(g, '1m=100cm', 20 + (i + 0.5) * 100 * sc, 35, C.ink, 12); }
    rbox(g, 20 + m * 100 * sc, 20, cm * sc, 30, 6, '#dbe6ff', C.b);
    text(g, `${m * 100}cm + ${cm}cm = ${tot}cm`, 260, 80, C.ink, 18);
    return cv;
  },
  area({ a, b }) {
    const [cv, g] = canvas(520, 150);
    const t = Math.floor(a / 10) * 10, o = a % 10;
    const W = 380, sc = W / a;
    rbox(g, 20, 20, t * sc, 70, 4, '#ffd9cf', C.a); rbox(g, 20 + t * sc, 20, o * sc, 70, 4, '#dbe6ff', C.b);
    text(g, `${t} × ${b} = ${t * b}`, 20 + (t * sc) / 2, 55, C.ink, 16);
    if (o) text(g, `${o}×${b}=${o * b}`, 20 + t * sc + (o * sc) / 2, 55, C.ink, 12);
    text(g, `${t * b} + ${o * b} = ${a * b}`, 260, 120, C.ink, 20);
    return cv;
  },
  share({ n, g: groups, rem }) {
    const q = Math.floor(n / groups), r = n % groups;
    const [cv, g] = canvas(520, 60 + groups * 34 + (rem && r ? 34 : 0));
    for (let i = 0; i < groups; i++) {
      text(g, `${i + 1}`, 24, 30 + i * 34, C.b, 16);
      for (let k = 0; k < q; k++) ball(g, 60 + k * 30, 30 + i * 34, 11);
    }
    if (rem && r) { text(g, '남음', 30, 30 + groups * 34, C.a, 15); for (let k = 0; k < r; k++) ball(g, 70 + k * 30, 30 + groups * 34, 11, '#999'); }
    return cv;
  },
  frac({ n, d }) {
    const [cv, g] = canvas(260, 170);
    pie(g, 90, 85, 70, n, d);
    text(g, `${n}`, 205, 60, C.a, 30); g.fillStyle = C.ink; g.fillRect(185, 84, 40, 3); text(g, `${d}`, 205, 110, C.ink, 30);
    return cv;
  },
  fraccmp({ a, b }) {
    const [cv, g] = canvas(500, 130);
    barFrac(g, 20, 20, 300, 36, a[0], a[1]); text(g, `${a[0]}/${a[1]}`, 380, 38, C.a, 22);
    barFrac(g, 20, 72, 300, 36, b[0], b[1], C.b); text(g, `${b[0]}/${b[1]}`, 380, 90, C.b, 22);
    return cv;
  },
  fracadd({ a, b, d }) {
    const [cv, g] = canvas(500, 90);
    for (let i = 0; i < d; i++) {
      g.fillStyle = i < a ? C.a : i < a + b ? C.b : '#fff';
      g.fillRect(20 + (380 / d) * i, 20, 380 / d, 40);
      g.strokeStyle = C.ink; g.lineWidth = 2; g.strokeRect(20 + (380 / d) * i, 20, 380 / d, 40);
    }
    text(g, `${a + b}/${d}`, 450, 40, C.ink, 22);
    text(g, '조각 크기(분모)는 그대로!', 210, 78, '#8a6d00', 14);
    return cv;
  },
  fracadd2({ a, b }) {
    const [cv, g] = canvas(500, 150);
    const d = a * b;
    barFrac(g, 20, 14, 300, 30, 1, a); text(g, `1/${a} = ${b}/${d}`, 410, 29, C.a, 18);
    barFrac(g, 20, 56, 300, 30, 1, b, C.b); text(g, `1/${b} = ${a}/${d}`, 410, 71, C.b, 18);
    for (let i = 0; i < d; i++) { g.fillStyle = i < b ? C.a : i < a + b ? C.b : '#fff'; g.fillRect(20 + (300 / d) * i, 100, 300 / d, 30); g.strokeStyle = C.ink; g.strokeRect(20 + (300 / d) * i, 100, 300 / d, 30); }
    text(g, `= ${a + b}/${d}`, 410, 115, C.ink, 20);
    return cv;
  },
  decimal({ o, k }) {
    const [cv, g] = canvas(520, 110);
    let x = 20;
    for (let i = 0; i < o; i++) { barFrac(g, x, 20, 100, 36, 10, 10); x += 110; }
    barFrac(g, x, 20, 100, 36, k, 10, C.b);
    text(g, `1이 ${o}개, 0.1이 ${k}개 → ${o}.${k}`, 260, 86, C.ink, 18);
    return cv;
  },
  angle({ deg }) {
    const [cv, g] = canvas(300, 170);
    const cx = 150, cy = 140;
    g.strokeStyle = C.ink; g.lineWidth = 4;
    g.beginPath(); g.moveTo(cx + 120, cy); g.lineTo(cx, cy); g.lineTo(cx + Math.cos(-deg * Math.PI / 180) * 120, cy + Math.sin(-deg * Math.PI / 180) * 120); g.stroke();
    g.strokeStyle = C.a; g.beginPath(); g.arc(cx, cy, 30, -deg * Math.PI / 180, 0); g.stroke();
    text(g, `${deg}°`, cx + 50, cy - 30, C.a, 22);
    return cv;
  },
  tri({ a, b, c }) {
    const [cv, g] = canvas(360, 170);
    g.strokeStyle = C.ink; g.lineWidth = 4; g.beginPath(); g.moveTo(30, 150); g.lineTo(330, 150); g.lineTo(150, 20); g.closePath(); g.stroke();
    text(g, `${a}°`, 70, 135, C.a, 18); text(g, `${b}°`, 290, 135, C.b, 18); text(g, `?`, 150, 50, C.c, 22);
    text(g, `합 180°`, 180, 105, C.ink, 16);
    return cv;
  },
  bars({ vals, avg }) {
    const [cv, g] = canvas(360, 170);
    const mx = Math.max(...vals) + 2, sc = 120 / mx;
    vals.forEach((v, i) => { rbox(g, 40 + i * 90, 150 - v * sc, 60, v * sc, 6, i % 2 ? '#dbe6ff' : '#ffd9cf', C.ink); text(g, String(v), 70 + i * 90, 140 - v * sc, C.ink, 16); });
    g.strokeStyle = C.a; g.setLineDash([8, 6]); g.lineWidth = 3; g.beginPath(); g.moveTo(20, 150 - avg * sc); g.lineTo(320, 150 - avg * sc); g.stroke(); g.setLineDash([]);
    text(g, `평균 ${avg}`, 330, 150 - avg * sc - 14, C.a, 15);
    return cv;
  },
  seq({ items }) {
    const n = items.length, w = Math.min(560, n * 130);
    const [cv, g] = canvas(w, 90);
    const bw = w / n;
    items.forEach((s, i) => {
      rbox(g, i * bw + 6, 16, bw - 30, 52, 12, i % 2 ? '#eef3ff' : '#fff4d6', C.grey);
      text(g, s, i * bw + 6 + (bw - 30) / 2, 42, C.ink, s.length > 5 ? 13 : 16);
      if (i < n - 1) text(g, '→', i * bw + bw - 12, 42, C.a, 20);
    });
    return cv;
  },
  compare({ items }) {
    const [cv, g] = canvas(520, 30 + items.length * 44);
    items.forEach((s, i) => { rbox(g, 20, 14 + i * 44, 480, 36, 10, i % 2 ? '#eef3ff' : '#fff4d6', C.grey); text(g, s, 260, 32 + i * 44, C.ink, 16); });
    return cv;
  },
};

export function drawViz(spec) {
  if (!spec || !DRAW[spec.type]) return null;
  try { return DRAW[spec.type](spec); } catch (e) { console.warn('viz', spec, e); return null; }
}
