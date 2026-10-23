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

/* ── 2026-10-23 새 그림 (병석님: "그래프면 그래프를 보여주고, 사칙연산만 알면 누구든 다 이해하고 풀 수 있게") ──
 * 폭 360 기준으로 크게 그려 폰에서도 글씨가 읽힌다. 움직이는 그림은 처음에 한 번 움직이고 '▶ 다시 보기'로 또 본다. */
const EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"';
const col = (k) => C[k] || k || C.ink;
function tx(g, s, x, y, { c = C.ink, size = 16, align = 'center', base = 'middle', w = 600, halo = false } = {}) {
  g.fillStyle = col(c); g.font = `${w} ${size}px "Jua", "Gowun Dodum", ${EMOJI}, sans-serif`;
  g.textAlign = align; g.textBaseline = base;
  if (halo) { g.save(); g.strokeStyle = '#fff'; g.lineWidth = Math.max(3, size / 3.5); g.lineJoin = 'round'; g.strokeText(String(s), x, y); g.restore(); } // 흰 테두리: 선 위에서도 읽히게
  g.fillText(String(s), x, y);
}
/** 글을 폭에 맞춰 줄로 나눈다 (띄어쓰기 단위, 한 낱말이 너무 길면 글자 단위) */
function wrap(g, s, maxW, size) {
  g.font = `600 ${size}px "Jua", "Gowun Dodum", ${EMOJI}, sans-serif`;
  const out = [];
  for (const para of String(s ?? '').split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const t = line ? line + ' ' + word : word;
      if (g.measureText(t).width <= maxW) { line = t; continue; }
      if (line) out.push(line);
      line = '';
      for (const ch of word) {
        if (g.measureText(line + ch).width > maxW && line) { out.push(line); line = ''; }
        line += ch;
      }
    }
    out.push(line);
  }
  return out;
}
function canvas2(w, h) {
  const [cv, g] = canvas(w, h);
  cv.style.width = '100%'; cv.style.maxWidth = Math.round(w * 1.45) + 'px';
  return [cv, g];
}
function arrow(g, x1, y1, x2, y2, c = C.ink, lw = 3, head = 10) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  g.strokeStyle = col(c); g.fillStyle = col(c); g.lineWidth = lw;
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2 - Math.cos(a) * head * 0.6, y2 - Math.sin(a) * head * 0.6); g.stroke();
  g.beginPath(); g.moveTo(x2, y2);
  g.lineTo(x2 - Math.cos(a - 0.45) * head, y2 - Math.sin(a - 0.45) * head);
  g.lineTo(x2 - Math.cos(a + 0.45) * head, y2 - Math.sin(a + 0.45) * head); g.closePath(); g.fill();
}
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const clamp01 = (t) => Math.max(0, Math.min(1, t));
/** 움직이는 그림: draw(t) 를 t=0→1 로 dur 동안 부른다. loop 면 계속 돈다. 화면에서 빠지면 멈춘다. */
function animate(cv, dur, draw, loop = false) {
  const box = document.createElement('div');
  box.className = 'viz-anim';
  box.append(cv);
  let t0 = null, raf = 0, seen = false, born = performance.now();
  const step = (now) => {
    if (box.isConnected) seen = true;
    else if (seen || now - born > 15000) return; // 화면에서 빠졌으면 그만
    if (t0 == null) t0 = now;
    const p = (now - t0) / dur;
    draw(loop ? p % 1 : clamp01(p));
    if (loop || p < 1) raf = requestAnimationFrame(step);
  };
  draw(0);
  raf = requestAnimationFrame(step);
  if (!loop) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'viz-replay'; b.textContent = '▶ 다시 보기';
    b.onclick = (e) => { e.stopPropagation(); cancelAnimationFrame(raf); t0 = null; born = performance.now(); raf = requestAnimationFrame(step); };
    box.append(b);
  }
  return box;
}
/* 식 글자 → 함수 (그래프용). 허용: 숫자, x, + − × ÷ ^ ( ), sin cos tan sqrt abs ln log log2 exp pi e */
const MW = { sin: 'M.sin', cos: 'M.cos', tan: 'M.tan', sqrt: 'M.sqrt', abs: 'M.abs', ln: 'M.log', log: 'M.log10', log2: 'M.log2', exp: 'M.exp', pi: 'M.PI', e: 'M.E', x: 'x' };
export function mathFn(src) {
  if (typeof src !== 'string' || src.length > 80) return null;
  let s = src.replace(/\s+/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/[−–]/g, '-').replace(/π/g, 'pi').replace(/²/g, '^2').replace(/³/g, '^3');
  s = s.replace(/log2/g, 'LOGTWO').replace(/[a-z]+/g, (w) => (w === 'x' ? 'x' : MW[w] ? `{${w}}` : '#'));
  s = s.replace(/LOGTWO/g, '{log2}');
  if (s.includes('#')) return null;
  s = s.replace(/(\d|\)|x|\})(?=\(|x|\{)/g, '$1*')
    .replace(/\{(sin|cos|tan|sqrt|abs|ln|log|log2|exp)\}\*\(/g, '{$1}(') // 함수 이름 뒤 괄호는 곱하기가 아니다 (sin(x))
    .replace(/\^/g, '**').replace(/\{([a-z0-9]+)\}/g, (m, w) => MW[w])
    // −x² 처럼 거듭제곱 앞의 빼기: 자바스크립트는 -x**2 를 못 읽는다 → 0−x**2, a*−b → a*(0−1)*b (**− 는 그대로)
    .replace(/(^|\()-/g, '$10-').replace(/(?<!\*)([*/])-/g, '$1(0-1)$1');
  if (/[^0-9x+\-*/().,M.a-zA-Z]/.test(s) || /[a-zA-Z]/.test(s.replace(/M\.[a-zA-Z0-9]+/g, '').replace(/x/g, ''))) return null;
  try {
    const f = new Function('x', 'M', `return (${s});`);
    const fx = (x) => f(x, Math);
    fx(0.5);
    return fx;
  } catch (e) { return null; }
}
/** 눈금 간격: 아이가 읽기 쉽게 정수 우선 (범위가 아주 좁을 때만 0.5) */
function niceStep(span) {
  if (span <= 3.5) return 0.5;
  if (span <= 12) return 1;
  const raw = span / 7, p = 10 ** Math.floor(Math.log10(raw)), m = raw / p;
  return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
}

Object.assign(DRAW, {
  /** 좌표 그래프: 함수 곡선·점·화살표(벡터)·선분·넓이 칠하기·단위원 */
  plot(s) {
    const W = 360, H = s.h || 270, pad = 28;
    const [cv, g] = canvas2(W, H);
    const [x0, x1] = s.x || [-5, 5], [y0, y1] = s.y || [-5, 5];
    const X = (x) => pad + ((x - x0) / (x1 - x0)) * (W - pad * 2);
    const Y = (y) => H - pad - ((y - y0) / (y1 - y0)) * (H - pad * 2);
    const fns = (s.fns || []).map((f) => ({ ...f, fn: mathFn(f.f) })).filter((f) => f.fn);
    const sh = s.shade ? { ...s.shade, fn: mathFn(s.shade.f) } : null;
    const draw = (t) => {
      g.clearRect(0, 0, W, H);
      g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      const sx = s.step || niceStep(x1 - x0), sy = s.stepY || s.step || niceStep(y1 - y0);
      g.lineWidth = 1; g.strokeStyle = '#e3e8f3';
      for (let v = Math.ceil(x0 / sx) * sx; v <= x1 + 1e-9; v += sx) { g.beginPath(); g.moveTo(X(v), Y(y0)); g.lineTo(X(v), Y(y1)); g.stroke(); }
      for (let v = Math.ceil(y0 / sy) * sy; v <= y1 + 1e-9; v += sy) { g.beginPath(); g.moveTo(X(x0), Y(v)); g.lineTo(X(x1), Y(v)); g.stroke(); }
      const ax = Math.max(x0, Math.min(x1, 0)), ay = Math.max(y0, Math.min(y1, 0));
      arrow(g, X(x0), Y(ay), X(x1) + 8, Y(ay), C.ink, 2, 9);
      arrow(g, X(ax), Y(y0), X(ax), Y(y1) - 8, C.ink, 2, 9);
      const lab = (v) => String(Math.round(v * 100) / 100).replace('-', '−');
      for (let v = Math.ceil(x0 / sx) * sx; v <= x1 + 1e-9; v += sx) if (Math.abs(v) > 1e-9) tx(g, lab(v), X(v), Y(ay) + 13, { size: 12, c: '#5a6478' });
      for (let v = Math.ceil(y0 / sy) * sy; v <= y1 + 1e-9; v += sy) if (Math.abs(v) > 1e-9) tx(g, lab(v), X(ax) - 6, Y(v), { size: 12, c: '#5a6478', align: 'right' });
      if (s.xl) tx(g, s.xl, X(x1), Y(ay) - 12, { size: 13, c: '#5a6478', align: 'right', halo: true });
      if (s.yl) tx(g, s.yl, X(ax) + 8, Y(y1) + 4, { size: 13, c: '#5a6478', align: 'left', halo: true });
      if (sh && sh.fn) { // 넓이 칠하기 (적분)
        const a = sh.a, b = a + (sh.b - a) * ease(clamp01(t * 1.4));
        g.fillStyle = 'rgba(59,108,212,.25)'; g.beginPath(); g.moveTo(X(a), Y(0));
        for (let i = 0; i <= 60; i++) { const x = a + ((b - a) * i) / 60; g.lineTo(X(x), Y(sh.fn(x))); }
        g.lineTo(X(b), Y(0)); g.closePath(); g.fill();
        if (sh.label && t > 0.7) tx(g, sh.label, X((sh.a + sh.b) / 2), Y(sh.fn((sh.a + sh.b) / 2) / 2), { c: C.b, size: 15, halo: true });
      }
      if (s.rects) { // 넓이를 막대 n개로 쪼개 더하기 (적분의 생각)
        const rf = mathFn(s.rects.f), rn = s.rects.n || 5, ra = s.rects.a, rw = (s.rects.b - s.rects.a) / rn;
        if (rf) for (let k = 0; k < rn && k < Math.ceil(t * rn * 1.3); k++) {
          const x = ra + k * rw, h = rf(x + rw / 2);
          rbox(g, X(x), Math.min(Y(h), Y(0)), X(x + rw) - X(x), Math.abs(Y(0) - Y(h)), 0, k % 2 ? 'rgba(255,203,5,.45)' : 'rgba(240,165,0,.4)', '#b7791f');
        }
      }
      if (s.circle) { g.strokeStyle = C.grey; g.lineWidth = 2; g.setLineDash([6, 5]); g.beginPath(); g.ellipse(X(0), Y(0), Math.abs(X(s.circle) - X(0)), Math.abs(Y(s.circle) - Y(0)), 0, 0, Math.PI * 2); g.stroke(); g.setLineDash([]); }
      g.save(); g.beginPath(); g.rect(pad - 4, pad - 14, W - pad * 2 + 8, H - pad * 2 + 18); g.clip();
      fns.forEach((f, k) => {
        const end = x0 + (x1 - x0) * ease(clamp01(t * 1.3 - k * 0.15));
        g.strokeStyle = col(f.c || ['a', 'b', 'c'][k % 3]); g.lineWidth = 3.5; g.beginPath();
        let pen = false;
        for (let i = 0; i <= 240; i++) {
          const x = x0 + ((x1 - x0) * i) / 240;
          if (x > end) break;
          const y = f.fn(x);
          if (!Number.isFinite(y) || y > y1 + (y1 - y0) || y < y0 - (y1 - y0)) { pen = false; continue; }
          if (pen) g.lineTo(X(x), Y(y)); else { g.moveTo(X(x), Y(y)); pen = true; }
        }
        g.stroke();
      });
      g.restore();
      fns.forEach((f, k) => { // 곡선 이름표: 그래프 오른쪽 끝 근처
        if (!f.label || t < 0.75) return;
        const lx = f.lx ?? x0 + (x1 - x0) * 0.82, ly = f.fn(lx);
        if (Number.isFinite(ly)) tx(g, f.label, X(lx), Math.max(14, Math.min(H - 14, Y(ly) - 14)), { c: f.c || ['a', 'b', 'c'][k % 3], size: 14, halo: true });
      });
      (s.segs || []).forEach((q) => {
        g.strokeStyle = col(q.c || C.grey); g.lineWidth = 2.5; if (q.dash) g.setLineDash([6, 5]);
        g.beginPath(); g.moveTo(X(q.x1), Y(q.y1)); g.lineTo(X(q.x1 + (q.x2 - q.x1) * clamp01(t * 1.5)), Y(q.y1 + (q.y2 - q.y1) * clamp01(t * 1.5))); g.stroke(); g.setLineDash([]);
        if (q.label && t > 0.6) tx(g, q.label, X((q.x1 + q.x2) / 2) + (q.lx || 0), Y((q.y1 + q.y2) / 2) + (q.ly || 0), { c: q.c || '#5a6478', size: 14, halo: true });
      });
      (s.vecs || []).forEach((v, k) => {
        const p = ease(clamp01(t * 1.4 - k * 0.2)); if (p <= 0) return;
        const [fx, fy] = v.from || [0, 0];
        arrow(g, X(fx), Y(fy), X(fx + (v.x - fx) * p), Y(fy + (v.y - fy) * p), v.c || ['a', 'b', 'c'][k % 3], 4, 13);
        if (v.label && p > 0.95) tx(g, v.label, X(v.x) + (v.lx ?? 0), Y(v.y) + (v.ly ?? -16), { c: v.c || ['a', 'b', 'c'][k % 3], size: 15, halo: true });
      });
      (s.pts || []).forEach((q, k) => {
        if (t < 0.35 + k * 0.08) return;
        dot(g, X(q.x), Y(q.y), 6, col(q.c || C.a));
        if (q.label) tx(g, q.label, X(q.x) + (q.lx ?? 0), Y(q.y) + (q.ly ?? -16), { c: q.c || C.a, size: 14, halo: true });
      });
    };
    return s.anim === false ? (draw(1), cv) : animate(cv, 1800, draw);
  },

  /** 빙글 도는 화살표: 원 위의 자리(stops)를 step 도씩 times 번 돌린다 (i 곱하기, 각도, 회전) */
  turn({ stops = ['1', 'i', '−1', '−i'], step = 90, times = 4, start = 0, cnt = '돌린 횟수', note }) {
    const W = 360, H = 286, cx = 180, cy = 132, R = 84;
    const [cv, g] = canvas2(W, H);
    const rad = (d) => (-d * Math.PI) / 180; // 시계 반대 방향(위쪽이 +)
    const draw = (t) => {
      g.clearRect(0, 0, W, H); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      g.strokeStyle = '#e3e8f3'; g.lineWidth = 2;
      g.beginPath(); g.moveTo(cx - R - 30, cy); g.lineTo(cx + R + 30, cy); g.moveTo(cx, cy - R - 30); g.lineTo(cx, cy + R + 30); g.stroke();
      g.strokeStyle = C.grey; g.setLineDash([6, 5]); g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
      const f = t * times, idx = Math.min(times, Math.floor(f)), fr = idx >= times ? 1 : ease(f - idx);
      const ang = start + step * (Math.min(idx, times) + (idx >= times ? 0 : fr));
      for (let k = 0; k < Math.min(idx + (fr > 0 ? 1 : 0), times); k++) { // 지나온 길(호)
        const a0 = start + step * k, a1 = start + step * (k + (k < idx ? 1 : fr));
        g.strokeStyle = 'rgba(227,53,13,.35)'; g.lineWidth = 6;
        g.beginPath(); g.arc(cx, cy, R * 0.45 + k * 7, rad(a0), rad(a1), true); g.stroke();
      }
      const n = stops.length;
      stops.forEach((sname, k) => {
        const a = (360 / n) * k, x = cx + Math.cos(rad(a)) * (R + 30), y = cy + Math.sin(rad(a)) * (R + 24);
        const here = Math.abs((((ang - a) % 360) + 360) % 360) < 1;
        dot(g, cx + Math.cos(rad(a)) * R, cy + Math.sin(rad(a)) * R, here ? 8 : 5, here ? C.a : C.grey);
        tx(g, sname, x, y, { c: here ? C.a : C.ink, size: here ? 20 : 16 });
      });
      arrow(g, cx, cy, cx + Math.cos(rad(ang)) * (R - 6), cy + Math.sin(rad(ang)) * (R - 6), C.a, 5, 16);
      dot(g, cx, cy, 5, C.ink);
      if (cnt) tx(g, `${cnt}: ${Math.min(idx, times)}번`, cx, H - 24, { size: 17, c: C.b });
      if (note) tx(g, note, cx, H - 10, { size: 13, c: '#5a6478' });
    };
    return animate(cv, 1000 * times + 400, draw);
  },

  /** 저울: 양쪽에 같은 일을 하면 계속 평평하다 (방정식) */
  balance({ L, R, steps = [] }) {
    const W = 360, H = 250;
    const [cv, g] = canvas2(W, H);
    const states = [{ L, R, say: '양쪽 무게가 같아요 ⚖️' }, ...steps];
    const pan = (x, y, s, a) => {
      g.globalAlpha = a;
      g.strokeStyle = C.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 50, y - 70); g.lineTo(x - 60, y); g.moveTo(x + 50, y - 70); g.lineTo(x + 60, y); g.stroke();
      g.fillStyle = '#ffe9a8'; g.beginPath(); g.ellipse(x, y + 4, 70, 16, 0, 0, Math.PI); g.fill(); g.stroke();
      let size = 24; g.font = `600 ${size}px "Jua", sans-serif`;
      while (size > 13 && g.measureText(String(s)).width > 128) { size -= 1; g.font = `600 ${size}px "Jua", sans-serif`; }
      tx(g, s, x, y - 14, { size, c: C.ink });
      g.globalAlpha = 1;
    };
    const draw = (t) => {
      g.clearRect(0, 0, W, H); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      const n = states.length, f = t * n, i = Math.min(n - 1, Math.floor(f)), fr = clamp01((f - i) * 3);
      const cur = states[i], prev = states[Math.max(0, i - 1)];
      g.fillStyle = '#8d6e63'; g.beginPath(); g.moveTo(180, 120); g.lineTo(150, 205); g.lineTo(210, 205); g.closePath(); g.fill();
      g.fillRect(110, 205, 140, 10);
      g.strokeStyle = C.ink; g.lineWidth = 5; g.beginPath(); g.moveTo(70, 120); g.lineTo(290, 120); g.stroke(); dot(g, 180, 120, 7, C.ink);
      if (i > 0 && fr < 1) { pan(85, 190, prev.L, 1 - fr); pan(275, 190, prev.R, 1 - fr); }
      pan(85, 190, cur.L, i > 0 ? fr : 1); pan(275, 190, cur.R, i > 0 ? fr : 1);
      rbox(g, 20, 14, 320, 44, 12, i ? '#e9f7ee' : '#eef3ff', null);
      tx(g, (i ? `${i}단계: ` : '') + (cur.say || ''), 180, 36, { size: 16, c: i ? '#1f7a44' : C.b });
    };
    return animate(cv, 2200 * states.length, draw);
  },

  /** 지레(시소): 받침점에서 몇 칸 떨어졌는지 × 무게 = 돌리는 힘. 양쪽이 같으면 수평, 다르면 무거운 쪽이 내려간다 */
  lever({ L = [], R = [], n = 4, say }) {
    const W = 360, H = 250, cx = 180, cy = 150, half = 150;
    const [cv, g] = canvas2(W, H);
    const tq = (side) => side.reduce((a, o) => a + (o.w || 1) * (o.at || 1), 0);
    const tl = tq(L), tr = tq(R);
    const final = Math.max(-0.2, Math.min(0.2, (tr - tl) * 0.05)); // 오른쪽이 더 크면 시계 방향(오른쪽 내려감)
    const pos = (at) => (half * at) / n;
    const draw = (t) => {
      g.clearRect(0, 0, W, H); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#8d6e63'; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx - 22, cy + 40); g.lineTo(cx + 22, cy + 40); g.closePath(); g.fill();
      g.save(); g.translate(cx, cy); g.rotate(final * ease(clamp01(t * 1.3)));
      g.strokeStyle = C.ink; g.lineWidth = 6; g.beginPath(); g.moveTo(-half - 6, 0); g.lineTo(half + 6, 0); g.stroke();
      for (let k = 1; k <= n; k++) for (const sg of [-1, 1]) {
        g.strokeStyle = C.grey; g.lineWidth = 2; g.beginPath(); g.moveTo(sg * pos(k), -4); g.lineTo(sg * pos(k), 8); g.stroke();
        tx(g, String(k), sg * pos(k), 20, { size: 12, c: '#5a6478' });
      }
      const put = (side, sg) => side.forEach((o) => {
        const x = sg * pos(o.at || 1), w = o.w || 1;
        for (let i = 0; i < Math.min(w, 6); i++) { rbox(g, x - 13, -16 - i * 22, 26, 20, 5, sg < 0 ? '#ffd9cf' : '#dbe6ff', C.ink); if (o.e && i === Math.min(w, 6) - 1) tx(g, o.e, x, -27 - i * 22 - 12, { size: 22 }); }
        if (!o.e) tx(g, String(w), x, -6 - Math.min(w, 6) * 22 - 6, { size: 14, c: sg < 0 ? C.a : C.b });
        if (o.t) tx(g, o.t, x, -6 - Math.min(w, 6) * 22 - (o.e ? 40 : 22), { size: 13, c: '#5a6478', halo: true });
      });
      put(L, -1); put(R, 1);
      g.restore();
      const sum = (side) => side.map((o) => `${o.w || 1} × ${o.at || 1}`).join(' + ');
      if (t > 0.6) {
        tx(g, `${sum(L)} = ${tl}`, 90, H - 20, { size: 15, c: C.a });
        tx(g, `${sum(R)} = ${tr}`, 270, H - 20, { size: 15, c: C.b });
        rbox(g, 30, 8, 300, 34, 12, tl === tr ? '#e9f7ee' : '#fff4d6', null);
        tx(g, say || (tl === tr ? '양쪽이 같아서 수평!' : tl > tr ? '왼쪽이 더 커서 왼쪽이 내려가요' : '오른쪽이 더 커서 오른쪽이 내려가요'), 180, 25, { size: 15, c: tl === tr ? '#1f7a44' : '#8a5a00' });
      }
    };
    return animate(cv, 2000, draw);
  },

  /** 수직선 위에서 뛰기: 더하면 오른쪽, 빼면(음수를 더하면) 왼쪽 */
  hops({ from = 0, to = 10, start = 0, hops = [], show = true }) {
    const W = 360, H = 160, x0 = 22, x1 = 338, y = 110;
    const [cv, g] = canvas2(W, H);
    const X = (v) => x0 + ((v - from) / (to - from)) * (x1 - x0);
    const every = to - from > 24 ? 5 : to - from > 12 ? 2 : 1;
    const draw = (t) => {
      g.clearRect(0, 0, W, H); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      arrow(g, x0 - 8, y, x1 + 14, y, C.ink, 3, 10);
      for (let v = from; v <= to; v++) {
        g.strokeStyle = C.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(X(v), y - (v % every ? 4 : 8)); g.lineTo(X(v), y + (v % every ? 4 : 8)); g.stroke();
        if (v % every === 0) tx(g, String(v).replace('-', '−'), X(v), y + 22, { size: 13, c: v === 0 ? C.ink : '#5a6478' });
      }
      let pos = start;
      dot(g, X(start), y, 7, C.b);
      const n = hops.length;
      hops.forEach((h, k) => {
        const p = ease(clamp01(t * n - k)); if (p <= 0) return;
        const a = X(pos), b = X(pos + h), mid = (a + b) / 2, hgt = Math.min(60, 18 + Math.abs(b - a) * 0.5);
        const c = h >= 0 ? C.b : C.a;
        g.strokeStyle = c; g.lineWidth = 3; g.beginPath();
        for (let i = 0; i <= 30 * p; i++) { const u = i / 30, x = a + (b - a) * u, yy = y - Math.sin(Math.PI * u) * hgt; i ? g.lineTo(x, yy) : g.moveTo(x, yy); }
        g.stroke();
        if (p > 0.6) tx(g, (h >= 0 ? '+' : '−') + Math.abs(h), mid, y - hgt - 12, { c, size: 16 });
        pos += h;
        if (p >= 1) dot(g, X(pos), y, 7, k === n - 1 ? C.a : c);
      });
      if (show && t >= 1) tx(g, `도착: ${String(pos).replace('-', '−')}`, 180, 18, { size: 18, c: C.a });
    };
    return animate(cv, 1300 * Math.max(1, hops.length) + 300, draw);
  },

  /** 그림 글자 묶음: 🍎×8 + 🍎×5 처럼 진짜 물건을 세어 보게 (x = 지울 개수, per = 몇 개씩 묶을지) */
  icons({ rows = [], op, total }) {
    const W = 360;
    // 줄마다: 한 줄에 몇 개(wide), 칸 크기(cell). per(묶음)이 있으면 묶음이 줄을 넘지 않게 묶음 단위로 채운다
    const lay = rows.map((r) => {
      const per = r.per || 0, wide = per ? Math.max(per, Math.floor(10 / per) * per) : 10;
      const gaps = per ? Math.ceil(wide / per) - 1 : 0, cell = Math.min(31, (W - 40 - gaps * 8) / wide);
      return { per, wide, cell, lines: Math.max(1, Math.ceil((r.n || 0) / wide)) };
    });
    const H = 16 + rows.reduce((a, r, i) => a + (r.t ? 22 : 0) + lay[i].lines * lay[i].cell + 14 + (op && i < rows.length - 1 ? 24 : 0), 0) + (total ? 36 : 0);
    const [cv, g] = canvas2(W, H);
    const all = rows.reduce((a, r) => a + (r.n || 0), 0) || 1;
    const draw = (t) => {
      g.clearRect(0, 0, W, H); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      let y = 12, cnt = 0;
      const shown = Math.ceil(t * all * 1.15);
      rows.forEach((r, i) => {
        const { per, wide, cell, lines } = lay[i];
        if (r.t) { tx(g, r.t, 14, y + 10, { size: 15, c: r.c || C.b, align: 'left' }); y += 22; }
        for (let k = 0; k < (r.n || 0); k++) {
          const li = Math.floor(k / wide), ci = k % wide;
          const x = 20 + cell / 2 + ci * cell + (per ? Math.floor(ci / per) * 8 : 0), yy = y + li * cell + cell / 2;
          if (per && k % per === 0) rbox(g, x - cell / 2, yy - cell / 2, Math.min(per, r.n - k) * cell, cell, 8, '#eef3ff', C.b);
          if (cnt++ < shown) {
            tx(g, r.e || '●', x, yy + 1, { size: Math.round(cell * 0.82) });
            if (r.x && k >= r.n - r.x) { g.strokeStyle = C.a; g.lineWidth = 3; g.beginPath(); g.moveTo(x - cell * 0.4, yy - cell * 0.4); g.lineTo(x + cell * 0.4, yy + cell * 0.4); g.stroke(); }
          }
        }
        y += lines * cell + 14;
        if (op && i < rows.length - 1) { tx(g, op, 180, y + 4, { size: 24, c: C.ink }); y += 24; }
      });
      if (total && t > 0.85) tx(g, total, 180, H - 20, { size: 19, c: C.a });
    };
    return animate(cv, Math.min(3000, 400 + all * 90), draw);
  },

  /** 흐름도: 차례대로 일어나는 일 (3개 이하면 가로, 넘으면 세로). loop 면 동그랗게 돌아온다 (물의 여행 같은 순환) */
  flow({ items = [], loop = false }) {
    const W = 360, n = items.length;
    if (loop && n >= 3) {
      const H = 330, cx = 180, cy = 165, R = 112;
      const [cv, g] = canvas2(W, H);
      const pos = items.map((_, k) => { const a = -Math.PI / 2 + (k / n) * Math.PI * 2; return [cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.92]; });
      const draw = (t) => {
        g.clearRect(0, 0, W, H); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
        const show = t * (n + 0.5);
        const at = (a) => [cx + Math.cos(a) * R, cy + Math.sin(a) * R * 0.92];
        for (let k = 0; k < n && k + 1 <= show; k++) { // k번째 칸 → 다음 칸 화살표 (마지막은 처음으로 돌아온다)
          const a0 = -Math.PI / 2 + ((k + 0.3) / n) * Math.PI * 2, a1 = -Math.PI / 2 + ((k + 0.7) / n) * Math.PI * 2;
          g.strokeStyle = C.a; g.lineWidth = 3; g.beginPath(); g.ellipse(cx, cy, R, R * 0.92, 0, a0, a1); g.stroke();
          const [px, py] = at(a1 - 0.06), [ex, ey] = at(a1);
          arrow(g, px, py, ex, ey, C.a, 3, 11);
        }
        items.forEach((it, k) => {
          if (k > show) return;
          const [x, y] = pos[k];
          rbox(g, x - 50, y - 34, 100, 68, 14, k % 2 ? '#eef3ff' : '#fff4d6', C.grey);
          tx(g, it.e || '', x, y - 12, { size: 24 });
          wrap(g, it.t, 92, 13).slice(0, 2).forEach((ln, i) => tx(g, ln, x, y + 12 + i * 15, { size: 13 }));
        });
      };
      return animate(cv, 900 * n, draw);
    }
    if (n <= 3) {
      const bw = 96, gap = (W - n * bw) / (n + 1);
      const H = 150;
      const [cv, g] = canvas2(W, H);
      const draw = (t) => {
        g.clearRect(0, 0, W, H); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
        items.forEach((it, k) => {
          if (k > t * n) return;
          const x = gap + k * (bw + gap);
          rbox(g, x, 14, bw, 120, 14, k % 2 ? '#eef3ff' : '#fff4d6', C.grey);
          tx(g, it.e || '', x + bw / 2, 46, { size: 30 });
          wrap(g, it.t, bw - 10, 14).slice(0, 3).forEach((ln, i) => tx(g, ln, x + bw / 2, 84 + i * 17, { size: 14 }));
          if (k < n - 1 && k + 1 <= t * n) arrow(g, x + bw + 4, 74, x + bw + gap - 4, 74, C.a, 3, 10);
        });
      };
      return animate(cv, 800 * n, draw);
    }
    const rowsH = items.map((it) => Math.max(1, wrap(document.createElement('canvas').getContext('2d'), it.t, 250, 15).length));
    const H = 16 + rowsH.reduce((a, r) => a + Math.max(52, 20 + r * 19) + 22, 0) - 22 + 16;
    const [cv, g] = canvas2(W, H);
    const draw = (t) => {
      g.clearRect(0, 0, W, H); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      let y = 16;
      items.forEach((it, k) => {
        const h = Math.max(52, 20 + rowsH[k] * 19);
        if (k <= t * n) {
          rbox(g, 14, y, 332, h, 14, k % 2 ? '#eef3ff' : '#fff4d6', C.grey);
          tx(g, it.e || `${k + 1}`, 44, y + h / 2, { size: 26 });
          wrap(g, it.t, 250, 15).forEach((ln, i) => tx(g, ln, 76, y + h / 2 - ((rowsH[k] - 1) * 19) / 2 + i * 19, { size: 15, align: 'left' }));
          if (k < n - 1 && k + 1 <= t * n) arrow(g, 180, y + h + 2, 180, y + h + 20, C.a, 3, 9);
        }
        y += h + 22;
      });
    };
    return animate(cv, 700 * n, draw);
  },

  /** 표: 규칙을 한눈에 (hi = 강조할 줄 번호) */
  table({ head = [], rows = [], hi }) {
    const W = 360, nc = Math.max(head.length, ...rows.map((r) => r.length)), cw = (W - 20) / nc;
    const meas = document.createElement('canvas').getContext('2d');
    const hh = (r, size) => Math.max(...r.map((c) => wrap(meas, c, cw - 10, size).length)) * (size + 4) + 14;
    const heads = head.length ? hh(head, 14) : 0, rh = rows.map((r) => hh(r, 15));
    const H = 20 + heads + rh.reduce((a, b) => a + b, 0);
    const [cv, g] = canvas2(W, H);
    let y = 10;
    const row = (r, h, bg, size, c) => {
      r.forEach((cell, j) => {
        rbox(g, 10 + j * cw, y, cw, h, 0, bg, C.grey);
        const ls = wrap(g, cell, cw - 10, size);
        ls.forEach((ln, i) => tx(g, ln, 10 + j * cw + cw / 2, y + h / 2 - ((ls.length - 1) * (size + 4)) / 2 + i * (size + 4), { size, c }));
      });
      y += h;
    };
    if (head.length) row(head, heads, '#ffe9a8', 14, C.ink);
    rows.forEach((r, i) => row(r, rh[i], i === hi ? '#ffd9cf' : i % 2 ? '#f5f8ff' : '#fff', 15, i === hi ? C.a : C.ink));
    return cv;
  },

  /** 막대그래프 (line = 평균 같은 기준선) */
  chart({ bars = [], unit = '', line, lineLabel }) {
    const W = 360, H = 230, base = 180, top = 34;
    const [cv, g] = canvas2(W, H);
    const mx = Math.max(...bars.map((b) => b.v), line || 0) || 1;
    const bw = Math.min(56, (W - 40) / bars.length - 14);
    const draw = (t) => {
      g.clearRect(0, 0, W, H); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      g.strokeStyle = C.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(16, base); g.lineTo(W - 10, base); g.stroke();
      bars.forEach((b, i) => {
        const x = 20 + i * ((W - 40) / bars.length) + ((W - 40) / bars.length - bw) / 2;
        const h = ((base - top) * b.v / mx) * ease(clamp01(t * 1.3 - i * 0.08));
        rbox(g, x, base - h, bw, h, 6, b.c ? col(b.c) : i % 2 ? '#9db8f0' : '#f7a58f', null);
        if (t > 0.6) tx(g, `${b.v}${unit}`, x + bw / 2, base - h - 12, { size: 14 });
        wrap(g, b.l, bw + 12, 13).slice(0, 2).forEach((ln, k) => tx(g, ln, x + bw / 2, base + 16 + k * 15, { size: 13, c: '#5a6478' }));
      });
      if (line != null && t > 0.8) {
        const yy = base - ((base - top) * line) / mx;
        g.strokeStyle = C.a; g.setLineDash([8, 6]); g.lineWidth = 3; g.beginPath(); g.moveTo(16, yy); g.lineTo(W - 10, yy); g.stroke(); g.setLineDash([]);
        tx(g, lineLabel || String(line), 18, yy - 12, { c: C.a, size: 14, align: 'left' });
      }
    };
    return animate(cv, 1600, draw);
  },

  /** 원을 도는 점의 높이를 적으면 물결이 된다 (진동·파동·사인) */
  wave({ say = '도는 점의 높이를 적으면 물결이 돼요' }) {
    const W = 360, H = 220, cx = 70, cy = 105, R = 52, gx = 140, gw = 205;
    const [cv, g] = canvas2(W, H);
    const draw = (t) => {
      g.clearRect(0, 0, W, H); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      g.strokeStyle = C.grey; g.lineWidth = 2; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
      g.strokeStyle = '#e3e8f3'; g.beginPath(); g.moveTo(gx, cy); g.lineTo(gx + gw, cy); g.stroke();
      const a = t * Math.PI * 2, px = cx + Math.cos(a) * R, py = cy - Math.sin(a) * R;
      g.strokeStyle = C.b; g.lineWidth = 3; g.beginPath();
      for (let i = 0; i <= 100; i++) { const u = i / 100, aa = a - u * Math.PI * 2, x = gx + u * gw, y = cy - Math.sin(aa) * R; i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.stroke();
      g.strokeStyle = C.a; g.setLineDash([5, 4]); g.lineWidth = 2; g.beginPath(); g.moveTo(px, py); g.lineTo(gx, py); g.stroke(); g.setLineDash([]);
      arrow(g, cx, cy, px, py, C.a, 3, 10); dot(g, px, py, 6, C.a); dot(g, gx, py, 6, C.b);
      tx(g, say, 180, H - 18, { size: 14, c: '#5a6478' });
    };
    return animate(cv, 4000, draw, true);
  },

  /** 원자: 가운데 핵(양성자·중성자) + 껍질을 도는 전자 */
  atom({ p = 1, n = 0, shells = [1], label = '' }) {
    const W = 360, H = 300, cx = 180, cy = 135;
    const [cv, g] = canvas2(W, H);
    // 핵: 양성자와 중성자를 번갈아 해바라기 씨처럼 촘촘히 (너무 많으면 24개까지만 그리고 숫자로 알려 준다)
    const kinds = [];
    for (let i = 0, a = Math.min(p, 12), b = Math.min(n, 12); a + b > 0; i++) { if (a && (i % 2 === 0 || !b)) { kinds.push(true); a--; } else { kinds.push(false); b--; } }
    const nuc = kinds.map((isP, i) => [cx + Math.cos(i * 2.4) * 5 * Math.sqrt(i), cy + Math.sin(i * 2.4) * 5 * Math.sqrt(i), isP]);
    const draw = (t) => {
      g.clearRect(0, 0, W, H); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      shells.forEach((k, si) => {
        const R = 42 + si * 30;
        g.strokeStyle = C.grey; g.lineWidth = 1.5; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke();
        for (let e = 0; e < k; e++) { const a = t * Math.PI * 2 * (1 - si * 0.25) + (e / k) * Math.PI * 2; dot(g, cx + Math.cos(a) * R, cy + Math.sin(a) * R, 6, C.b); }
      });
      nuc.forEach(([x, y, isP]) => { dot(g, x, y, 6, isP ? C.a : '#9aa3b5'); });
      tx(g, `🔴 양성자 ${p}  ⚪ 중성자 ${n}  🔵 전자 ${shells.reduce((a, b) => a + b, 0)}`, cx, H - 36, { size: 14 });
      if (label) tx(g, label, cx, H - 14, { size: 16, c: C.a });
    };
    return animate(cv, 6000, draw, true);
  },

  /** 힘 화살표: 물체에 여러 힘이 걸릴 때 (화살표 길이 = 힘의 크기) */
  forces({ obj = '📦', arrows = [], result }) {
    // 가로 화살표는 최대 140px, 세로 화살표는 최대 90px. 위·아래 화살표 길이만큼 그림 높이를 늘려 이름표까지 안에 들어오게 한다
    const W = 360, cx = 180;
    const mx = Math.max(1, ...arrows.map((a) => a.v || 1));
    const dir = { r: [1, 0], l: [-1, 0], u: [0, -1], d: [0, 1] };
    const lenOf = (a) => ((a.d === 'u' || a.d === 'd') ? 20 + (70 * (a.v || 1)) / mx : 30 + (110 * (a.v || 1)) / mx);
    const ext = (d) => Math.max(0, ...arrows.filter((a) => a.d === d).map((a) => lenOf(a) + 14));
    const up = Math.max(ext('u'), 40), down = Math.max(ext('d'), 40);
    const cy = 12 + up + 34, H = cy + 34 + down + 12 + (result ? 50 : 0);
    const [cv, g] = canvas2(W, H);
    const draw = (t) => {
      g.clearRect(0, 0, W, H); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      arrows.forEach((a, k) => {
        const [dx, dy] = dir[a.d] || dir.r, len = lenOf(a), p = ease(clamp01(t * 1.4 - k * 0.15));
        const sx = cx + dx * 34, sy = cy + dy * 34, ex = sx + dx * len * p, ey = sy + dy * len * p;
        if (p > 0.02) arrow(g, sx, sy, ex, ey, a.c || ['a', 'b', 'c', 'y'][k % 4], 6, 16);
        // 이름표: 가로 화살표는 화살표 가운데 위, 세로 화살표는 화살표 가운데 오른쪽
        if (a.t && p > 0.9) tx(g, a.t, dx ? (sx + ex) / 2 : cx + 16, dx ? ey - 20 : (sy + ey) / 2, { size: 14, c: a.c || ['a', 'b', 'c', '#8a6d00'][k % 4], align: dx ? 'center' : 'left' });
      });
      tx(g, obj, cx, cy + 2, { size: 50 });
      if (result && t > 0.85) { rbox(g, 30, H - 50, 300, 38, 12, '#e9f7ee', null); tx(g, result, cx, H - 31, { size: 16, c: '#1f7a44' }); }
    };
    return animate(cv, 1800, draw);
  },

  /** 연표: 언제 누가 무엇을 (세로로 — 폰에서 읽기 좋게) */
  timeline({ ev = [] }) {
    const W = 360;
    const meas = document.createElement('canvas').getContext('2d');
    const hs = ev.map((e) => Math.max(1, wrap(meas, e.t, 228, 15).length) * 19 + 22);
    const H = 20 + hs.reduce((a, b) => a + b, 0);
    const [cv, g] = canvas2(W, H);
    const draw = (t) => {
      g.clearRect(0, 0, W, H); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      g.strokeStyle = C.grey; g.lineWidth = 3; g.beginPath(); g.moveTo(96, 14); g.lineTo(96, H - 14); g.stroke();
      let y = 12;
      ev.forEach((e, k) => {
        if (k <= t * ev.length) {
          tx(g, e.y || '', 84, y + 12, { size: 14, c: C.b, align: 'right' });
          dot(g, 96, y + 12, 8, k === ev.length - 1 ? C.a : C.b);
          tx(g, e.e || '', 116, y + 12, { size: 18 });
          wrap(g, e.t, 214, 15).forEach((ln, i) => tx(g, ln, 132, y + 12 + i * 19, { size: 15, align: 'left' }));
        }
        y += hs[k];
      });
    };
    return animate(cv, 900 * ev.length, draw);
  },

  /** 헷갈린 생각 vs 맞는 생각 (또는 예전 vs 지금) */
  vs({ L = {}, R = {} }) {
    const W = 360, cw = 166;
    const meas = document.createElement('canvas').getContext('2d');
    const lines = (side) => (side.items || []).map((s) => wrap(meas, s, cw - 22, 15));
    const LL = lines(L), RL = lines(R);
    const hgt = (ls) => ls.reduce((a, l) => a + l.length * 20 + 10, 0);
    const H = 64 + Math.max(hgt(LL), hgt(RL)) + 10;
    const [cv, g] = canvas2(W, H);
    const side = (x, s, ls, bg, c) => {
      rbox(g, x, 8, cw, H - 16, 14, bg, null);
      tx(g, s.t || '', x + cw / 2, 32, { size: 16, c });
      let y = 60;
      ls.forEach((l) => { l.forEach((ln, i) => tx(g, (i ? '  ' : '• ') + ln, x + 8, y + i * 20, { size: 15, align: 'left' })); y += l.length * 20 + 10; });
    };
    side(10, L, LL, '#ffe6e0', C.a);
    side(184, R, RL, '#e2f5e8', '#1f7a44');
    return cv;
  },

  /** 큰 그림 장면: 이모지 몇 개 + 이름표 (비유·상황 그림) */
  scene({ items = [], cap }) {
    const W = 360, n = Math.max(1, items.length);
    const size = n === 1 ? 84 : n === 2 ? 64 : n === 3 ? 54 : n === 4 ? 44 : 36;
    const meas = document.createElement('canvas').getContext('2d');
    const capL = cap ? wrap(meas, cap, 320, 15) : [];
    const H = size + 70 + capL.length * 20;
    const [cv, g] = canvas2(W, H);
    const draw = (t) => {
      g.clearRect(0, 0, W, H); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
      items.forEach((it, k) => {
        if (k > t * n * 1.1) return;
        const x = (W / n) * (k + 0.5);
        tx(g, it.e || '', x, 14 + size / 2, { size: it.s ? size * it.s : size });
        if (it.t) wrap(g, it.t, W / n - 6, 13).slice(0, 2).forEach((ln, i) => tx(g, ln, x, size + 32 + i * 15, { size: 13, c: '#5a6478' }));
      });
      if (t > 0.8) capL.forEach((ln, i) => tx(g, ln, 180, size + 66 + i * 20, { size: 15, c: C.ink }));
    };
    return animate(cv, 400 + 350 * n, draw);
  },
});

/* 그림 글(JSON)이 맞는 모양인지 — 브라우저 없이 검사할 때 쓴다 (_tools/vizcheck.mjs). [필수 칸들] */
export const VIZ_NEED = {
  count: ['n'], numline: ['from', 'to'], dots: ['a', 'b', 'op'], tenframe: ['a', 'b'], tenframe2: ['a', 'b'], borrow: ['a', 'b'], blocks: ['n'],
  col: ['a', 'b', 'op'], clock: ['h', 'm'], groups: ['a', 'b'], array: ['r', 'c'], ruler: ['m', 'cm'], area: ['a', 'b'], share: ['n', 'g'],
  frac: ['n', 'd'], fraccmp: ['a', 'b'], fracadd: ['a', 'b', 'd'], fracadd2: ['a', 'b'], decimal: ['o', 'k'], angle: ['deg'], tri: ['a', 'b'],
  bars: ['vals', 'avg'], seq: ['items'], compare: ['items'],
  plot: [], turn: [], balance: ['L', 'R'], hops: ['from', 'to', 'start', 'hops'], icons: ['rows'], flow: ['items'], table: ['rows'],
  chart: ['bars'], wave: [], lever: ['L', 'R'], atom: ['p', 'shells'], forces: ['arrows'], timeline: ['ev'], vs: ['L', 'R'], scene: ['items'],
};
export function vizProblems(spec) {
  if (!spec) return [];
  const need = VIZ_NEED[spec.type];
  if (!need) return [`그림 종류 없음: ${spec.type}`];
  const out = need.filter((k) => spec[k] == null).map((k) => `${spec.type}: '${k}' 빠짐`);
  if (spec.type === 'plot') {
    const [a, b] = Array.isArray(spec.x) ? spec.x : [-5, 5];
    const live = (fn) => { let k = 0; for (let i = 0; i <= 20; i++) if (Number.isFinite(fn(a + ((b - a) * i) / 20))) k++; return k >= 5; };
    for (const f of spec.fns || []) {
      const fn = mathFn(f.f);
      if (!fn) out.push(`plot: 식을 못 읽음 '${f.f}'`);
      else if (!live(fn)) out.push(`plot: 식 '${f.f}'이 보이는 범위에서 숫자가 안 나옴 (곡선이 안 그려짐)`);
    }
    if (spec.shade && !mathFn(spec.shade.f)) out.push(`plot: 칠하기 식을 못 읽음 '${spec.shade.f}'`);
    if (spec.rects && !mathFn(spec.rects.f)) out.push(`plot: 막대 식을 못 읽음 '${spec.rects.f}'`);
    for (const k of ['x', 'y']) if (spec[k] && !(Array.isArray(spec[k]) && spec[k].length === 2 && spec[k][0] < spec[k][1])) out.push(`plot: ${k} 범위가 이상함`);
  }
  if (spec.type === 'hops' && !(spec.from < spec.to)) out.push('hops: from < to 이어야 함');
  if (spec.type === 'icons' && (spec.rows || []).some((r) => !(r.n >= 0 && r.n <= 40))) out.push('icons: 줄마다 n 은 0~40');
  if (spec.type === 'flow' && !((spec.items || []).length >= 2 && spec.items.length <= 7)) out.push('flow: 2~7칸');
  if (spec.type === 'timeline' && !((spec.ev || []).length >= 2 && spec.ev.length <= 7)) out.push('timeline: 2~7개');
  return out;
}

export function drawViz(spec) {
  if (!spec || !DRAW[spec.type]) return null;
  try { return DRAW[spec.type](spec); } catch (e) { console.warn('viz', spec, e); return null; }
}
