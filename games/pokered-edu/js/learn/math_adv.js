/* 심화 수학 문제 생성기 (6학년 ~ 고3 미적분).
 * math.js 의 mc() 를 그대로 쓴다. 틀린 보기 = 아이들이 실제로 하는 실수를 계산한 값, 보기마다 '왜 틀렸는지' 설명.
 * 모든 보기는 글자(문자열)로 만든다: 음수는 진짜 빼기 기호 '−'(U+2212)로 쓰고, 분수는 약분해서 쓴다.
 * 반환: { q, a[4], c, why, wrong{i: 설명}, viz, pic, steps[], need, help }
 * 2026-10-24 쉬운 설명 개편 (ELI5_GUIDE.md): 사칙연산만 아는 사람도 풀 수 있게 문제 글(q)·낱말 풀이(help)·문제 그림(pic)·
 * 풀이(why·steps)·보기별 설명·풀이 그림(viz)·왜 필요한지(need)를 다시 썼다. 계산값·정답·틀린 보기 값·난수 순서는 그대로. */
import { mc, fixJosa } from './math.js';
import { rand, pick, shuffle } from '../util.js';

/* ── 글자 만들기 도우미 ── */
const MI = '−';
const N = (x) => (x < 0 ? MI + Math.abs(x) : String(x));
const P = (x) => (x < 0 ? `(${N(x)})` : N(x));
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
/** 약분한 분수 글자: fr(6, 8) -> '3/4', fr(4, 2) -> '2', fr(-1, 2) -> '−1/2' */
function fr(n, d) {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d) || 1; n /= g; d /= g;
  return d === 1 ? N(n) : `${n < 0 ? MI : ''}${Math.abs(n)}/${d}`;
}
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹', SUB = '₀₁₂₃₄₅₆₇₈₉';
const sup = (n) => String(n).split('').map((c) => SUP[c]).join('');
const sub = (n) => String(n).split('').map((c) => SUB[c]).join('');
/** √n 을 간단히: sq(8) -> '2√2', sq(9) -> '3', sq(13) -> '√13' */
function sq(n) {
  let k = 1, m = n;
  for (let f = 2; f * f <= m; f++) while (m % (f * f) === 0) { m /= f * f; k *= f; }
  if (m === 1) return String(k);
  return k === 1 ? `√${m}` : `${k}√${m}`;
}
/** 단항식: mono(3, 2) -> '3x²', mono(-1, 1) -> '−x', mono(5, 0) -> '5' */
function mono(c, p, v = 'x') {
  if (p === 0) return N(c);
  const k = Math.abs(c) === 1 ? '' : String(Math.abs(c));
  return (c < 0 ? MI : '') + k + v + (p === 1 ? '' : sup(p));
}
/** 다항식: poly([[1,2],[5,1],[6,0]]) -> 'x² + 5x + 6' */
function poly(terms, v = 'x') {
  const t = terms.filter(([c]) => c !== 0);
  if (!t.length) return '0';
  return t.map(([c, p], i) => (i === 0 ? mono(c, p, v) : (c < 0 ? ` ${MI} ` : ' + ') + mono(Math.abs(c), p, v))).join('');
}
const quad = (a, b, c) => poly([[a, 2], [b, 1], [c, 0]]);
/** 괄호로 끝나는 수 뒤 조사: J('(−3)', '을', '를') -> '(−3)을' (마지막 숫자로 받침 판단) */
const J = (s, a, b) => { const d = String(s).match(/(\d)\D*$/); return s + (d && '013678'.includes(d[1]) ? a : b); };
const ya = (s) => s + (/[⁰¹²³⁴⁵⁶⁷⁸⁹]$/.test(s) ? '이야' : '야');
const xs = (a) => `x ${a < 0 ? MI : '+'} ${Math.abs(a)}`;
/** (x+p)(x+q) — 작은 수부터 써서 같은 식이 두 가지로 보이지 않게 */
const fac = (p, q) => { const [a, b] = [p, q].sort((m, n) => m - n); return `(${xs(a)})(${xs(b)})`; };
const nz = (a, b) => { let v; do { v = rand(a, b); } while (v === 0); return v; };
const sgn = () => (Math.random() < 0.5 ? -1 : 1);

/* ── 그림 도우미 (난수를 쓰지 않는다: 같은 씨앗이면 옛 생성기와 같은 문제가 나와야 한다) ── */
const fj = (s) => fixJosa(String(s)); // 그림 속 글은 mc() 가 조사를 고쳐 주지 않는다
const rd = (v) => Math.round(v * 100) / 100;
const chain = (a, n) => Array(n).fill(a).join(' × ');
/** 거듭 곱하기를 한 줄씩: run(3, 4) -> ['3 × 3 = 9', '9 × 3 = 27', '27 × 3 = 81'] */
const run = (a, n) => { const out = []; let v = a; for (let i = 1; i < n; i++) { out.push(`${v} × ${a} = ${v * a}`); v *= a; } return out; };
/** 그래프 칸이 정사각형으로 보이게: 그림 판(304 × 214) 비율에 맞춘 범위 [가로 끝, 세로 끝] */
const sqBox = (w, h) => { const X = rd(Math.max(w, (h * 304) / 214)); return [X, rd((X * 214) / 304)]; };
/** 그래프 식 글자 (ASCII 빼기): sgnT(-3, 'x') -> '-3*x', sgnT(5) -> '+5' */
const sgnT = (c, t = '') => `${c < 0 ? '-' : '+'}${Math.abs(c)}${t ? `*${t}` : ''}`;
/** 직각삼각형 그림 (직각은 오른쪽 아래, 가로 w · 세로 h). 눈금·숫자는 숨기고(step 100) 변 이름표만 단다 */
function triPic(w, h, { base = '', side = '', hyp = '', ang = '' } = {}, still = false) {
  const [X, Y] = sqBox(w * 1.7, h * 1.4);
  const ox = rd((X - w) * 0.35), oy = rd((Y - h) * 0.45), m = rd(Math.min(w, h) * 0.13);
  const ex = rd(ox + w), ey = rd(oy + h);
  const off = (s) => 8 + [...String(s)].length * 6;
  const spec = { type: 'plot', x: [0, X], y: [0, Y], step: 100, segs: [
    { x1: ox, y1: oy, x2: ex, y2: oy, c: 'ink', ...(base ? { label: base, ly: 16 } : {}) },
    { x1: ex, y1: oy, x2: ex, y2: ey, c: 'ink', ...(side ? { label: side, lx: off(side) } : {}) },
    { x1: ox, y1: oy, x2: ex, y2: ey, c: 'a', ...(hyp ? { label: hyp, lx: -off(hyp), ly: -10 } : {}) },
    { x1: rd(ex - m), y1: oy, x2: rd(ex - m), y2: rd(oy + m), c: 'grey' },
    { x1: rd(ex - m), y1: rd(oy + m), x2: ex, y2: rd(oy + m), c: 'grey' },
  ] };
  if (ang) spec.pts = [{ x: ox, y: oy, label: ang, lx: 30, ly: -10, c: 'b' }];
  if (still) spec.anim = false;
  return spec;
}
/** 곱셈 칸 표: 위에 뒤 괄호의 두 항, 왼쪽에 앞 괄호의 두 항 (전개·인수분해) */
const boxT = (top, left, cells) => ({ type: 'table', head: ['×', ...top], rows: left.map((l, i) => [l, ...cells[i]]) });

/* ── 2026-10-24 2차 점검: '규칙은 이유부터' (ELI5_GUIDE 5-1) 에 쓰는 도우미 ── */
/** 음수 × 음수 = + 의 이유 (곱하는 수를 1씩 줄이면 답이 k씩 커진다) */
/* 2, 1, 0을 곱한 답(−2k, −k, 0)이 k씩 커지는 것을 먼저 보이고, 그다음 −1을 곱한 답을 끌어낸다 (−1의 답을 미리 적어 두면 이유가 되지 않는다 — 검증 2026-10-24) */
const negNeg = (k) => `(${MI}${k})에 2, 1, 0을 곱하면 ${MI}${2 * k}, ${MI}${k}, 0으로 ${k}씩 커지니 ${MI}1을 곱하면 ${k}야`;
/** 수직선 뛰기 그림 (뛰는 횟수가 많거나 범위가 너무 넓으면 null) */
const hopsV = (start, hop, times) => {
  const end = start + hop * times, lo = Math.min(0, start, end), hi = Math.max(0, start, end);
  if (times > 6 || hi - lo > 60) return null;
  return { type: 'hops', from: lo - 2, to: hi + 2, start, hops: Array(times).fill(hop) };
};
/** 소수 글자: dec(7803, 100) -> '78.03' */
const dec = (num, den) => String(Math.round(num) / den);
/** 분수 곱하기 넓이 그림: 네모 한 판을 세로 b칸 × 가로 d칸으로 자르고, a/b 와 c/d 가 겹친 곳을 칠한다 */
function fracGrid(a, b, c, d, label) {
  const Y0 = -0.14, Y1 = 1.14, span = (Y1 - Y0) * 304 / 214, X0 = -0.12;
  const segs = [];
  for (let i = 1; i < b; i++) segs.push({ x1: rd(i / b), y1: 0, x2: rd(i / b), y2: 1, c: 'grey' });
  for (let j = 1; j < d; j++) segs.push({ x1: 0, y1: rd(j / d), x2: 1, y2: rd(j / d), c: 'grey' });
  segs.push({ x1: 0, y1: 1, x2: 1, y2: 1, c: 'ink' }, { x1: 1, y1: 0, x2: 1, y2: 1, c: 'ink' });
  segs.push({ x1: 0, y1: -0.07, x2: rd(a / b), y2: -0.07, c: 'a', label: `가로 ${a}/${b}`, ly: 13 });
  segs.push({ x1: 1.07, y1: 0, x2: 1.07, y2: rd(c / d), c: 'b', label: `세로 ${c}/${d}`, lx: 40 });
  return { type: 'plot', x: [X0, rd(X0 + span)], y: [Y0, Y1], step: 100, segs,
    shade: { f: `${c}/${d}`, a: 0, b: rd(a / b), ...(label ? { label } : {}) } };
}
/** 전개 넓이 그림: 가로 x + a, 세로 x + b 직사각형을 네 칸으로 (x 는 그림에서 5칸 길이로 그린다).
 *  cells = [[왼쪽 위, 오른쪽 위], [왼쪽 아래, 오른쪽 아래]] 칸 글 */
function areaPic(a, b, cells, still = false, sides = null) { // sides = [가로 덧붙은 길이 글, 세로 덧붙은 길이 글] (모를 때 '?')
  const X = 5, m = 1.4, ox = m, oy = 0.6;
  const P2 = (x, y) => [rd(x + ox), rd(y + oy)];
  const L = (p, q, c) => ({ x1: p[0], y1: p[1], x2: q[0], y2: q[1], c });
  const tag = (p, t, c) => ({ x1: p[0], y1: p[1], x2: p[0], y2: p[1], label: t, c });
  const W = X + a, H = X + b; // 세로: 위 칸 높이 x, 아래 칸 높이 b
  const segs = [
    L(P2(0, 0), P2(W, 0), 'ink'), L(P2(W, 0), P2(W, H), 'ink'), L(P2(W, H), P2(0, H), 'ink'), L(P2(0, H), P2(0, 0), 'ink'),
    L(P2(X, 0), P2(X, H), 'grey'), L(P2(0, b), P2(W, b), 'grey'),
    tag(P2(X / 2, H + 0.55), 'x', 'b'), tag(P2(X + a / 2, H + 0.55), sides ? sides[0] : String(a), 'b'),
    tag(P2(-0.6, b + X / 2), 'x', 'b'), tag(P2(-0.6, b / 2), sides ? sides[1] : String(b), 'b'),
    tag(P2(X / 2, b + X / 2), cells[0][0], 'a'), tag(P2(X + a / 2, b + X / 2), cells[0][1], 'a'),
    tag(P2(X / 2, b / 2), cells[1][0], 'a'), tag(P2(X + a / 2, b / 2), cells[1][1], 'a'),
  ];
  const w = W + m + 0.5, h = H + oy + 1.2;
  let XX = w, YY = h;
  if (XX / YY < 304 / 214) XX = (YY * 304) / 214; else YY = (XX * 214) / 304;
  const spec = { type: 'plot', x: [0, rd(XX)], y: [0, rd(YY)], step: 100, segs };
  if (still) spec.anim = false;
  return spec;
}
/** 피타고라스 그림: 직각삼각형 세 변 위에 정사각형을 그리고, 정사각형 안에 칸 수를 적는다.
 *  가로 변 a(아래), 세로 변 b(왼쪽), 빗변 위 정사각형은 바깥쪽(오른쪽 위). lab = [가로 정사각형 글, 세로 정사각형 글, 빗변 정사각형 글] */
function sqPic(a, b, lab, still = false) {
  const m = 0.6, ox = b + m, oy = a + m; // 왼쪽(세로 변 정사각형)·아래(가로 변 정사각형) 몫만큼 옮긴다
  const P2 = (x, y) => [rd(x + ox), rd(y + oy)];
  const L = (p, q, c) => ({ x1: p[0], y1: p[1], x2: q[0], y2: q[1], c });
  const O = P2(0, 0), A = P2(a, 0), B = P2(0, b);
  const segs = [
    L(P2(0, 0), P2(0, -a), 'c'), L(P2(0, -a), P2(a, -a), 'c'), L(P2(a, -a), A, 'c'), // 가로 변 정사각형
    L(P2(0, 0), P2(-b, 0), 'b'), L(P2(-b, 0), P2(-b, b), 'b'), L(P2(-b, b), B, 'b'), // 세로 변 정사각형
    L(A, P2(a + b, a), 'a'), L(P2(a + b, a), P2(b, a + b), 'a'), L(P2(b, a + b), B, 'a'), // 빗변 정사각형
    L(O, A, 'ink'), L(O, B, 'ink'), L(A, B, 'a'), // 삼각형
  ];
  if (a + b <= 7) { // 작은 삼각형이면 칸을 그어 '칸 수'가 눈에 보이게 한다
    for (let i = 1; i < a; i++) segs.push(L(P2(i, 0), P2(i, -a), 'grey'), L(P2(0, -i), P2(a, -i), 'grey'));
    for (let i = 1; i < b; i++) segs.push(L(P2(-i, 0), P2(-i, b), 'grey'), L(P2(0, i), P2(-b, i), 'grey'));
  }
  const tag = (x, y, t, c) => ({ x1: x, y1: y, x2: x, y2: y, label: t, c });
  segs.push(tag(...P2(a / 2, -a / 2), lab[0], 'c'), tag(...P2(-b / 2, b / 2), lab[1], 'b'), tag(...P2((a + b) / 2, (a + b) / 2), lab[2], 'a'));
  const w = a + 2 * b + 2 * m, h = 2 * a + b + 2 * m; // 전체 가로·세로
  let X = w, Yh = h;
  if (X / Yh < 304 / 214) X = (Yh * 304) / 214; else Yh = (X * 214) / 304; // 칸이 정사각형으로 보이게
  const spec = { type: 'plot', x: [rd(-(X - w) / 2), rd(w + (X - w) / 2)], y: [rd(-(Yh - h) / 2), rd(h + (Yh - h) / 2)], step: 100, segs };
  if (still) spec.anim = false;
  return spec;
}
/** √ 풀이 예: 보기·정답에 없는 수로 고른다 (예가 정답이나 보기를 가리키지 않게) */
const rootEx = (vals) => {
  const used = new Set(vals.map(String));
  const k = [11, 9, 7, 6, 12].find((n) => !used.has(String(n)) && !used.has(`√${n * n}`)) || 11;
  return `√${k * k} = ${k}`;
};
/** 보기에 나오는 √ 글자 풀이: √ 뜻 + '3√2 = 3 × √2' 꼴이 있으면 그것도 */
const rootHelp = (vals) => {
  const k2 = vals.map(String).map((v) => v.match(/(\d+)√(\d+)/)).find(Boolean);
  return k2 ? `√□(루트) = 두 번 곱하면 □인 수. ${k2[0]} = ${k2[1]} × √${k2[2]}` : `√□(루트) = 두 번 곱하면 □인 수(예: ${rootEx(vals)})`;
};

/** mc 를 감싼다: 값은 모두 글자로, 모자라면 more -> gen -> 가까운 수 순서로 채운다 */
function Q(correct, wrongs, why, o = {}) {
  const S = (v) => (typeof v === 'number' ? N(v) : v);
  const ok = (w) => w && w.v != null && (typeof w.v !== 'number' || Number.isFinite(w.v));
  const ws = wrongs.filter(ok).map((w) => ({ v: S(w.v), why: w.why }));
  const more = (o.more || []).filter(ok).map((w) => ({ v: S(w.v), why: w.why }));
  let k = 0;
  const fill = () => {
    if (k < more.length) return more[k++];
    if (o.gen) { const w = o.gen(); return { v: S(w.v), why: w.why }; }
    if (typeof correct === 'number') {
      const d = pick([1, -1, 2, -2, 3, -3]), v = correct + d;
      return { v: N(v), why: `${N(v)}는 정답 ${N(correct)}보다 ${Math.abs(d)} ${d > 0 ? '커' : '작아'}. 계산하다 한 칸 밀렸을 수 있어. 풀이를 한 줄씩 따라 하면 ${N(correct)}이(가) 나와.` };
    }
    return { v: S(correct), why: '' };
  };
  const { more: _m, gen: _g, ...rest } = o;
  return mc(S(correct), ws, why, { ...rest, fmt: (s) => s, fill });
}
/** 분수 정답용 예비 보기 (값이 겹치지 않게 무작위) */
const fracGen = () => {
  let a, b; do { a = rand(1, 9); b = rand(2, 12); } while (gcd(a, b) !== 1);
  const s = fr(a, b);
  return { v: s, why: `${s}는 풀이 중에 나오지 않는 값이야. 처음부터 한 줄씩 다시 따라가 보자.` };
};

/* ── 심화 기술 목록: 쉬운 것 -> 어려운 것 ── */
function skill(id, g, t, idea, need, fn) {
  return { id, g, t, idea, need, gen: (st) => { const r = fn(!!st, need); if (!r.need) r.need = need; return r; } };
}

export const MATH_ADV = [
  /* ───────── 6학년 ───────── */
  skill('m_int_add', 6, '정수의 덧셈', '−3은 빚 3원처럼 0보다 작은 수(음수)야. 음수를 더하면 수직선에서 왼쪽으로, 양수를 더하면 오른쪽으로 가.',
    '옛날 사람들은 빚처럼 0보다 작은 양도 계산해야 했어. 그래서 음수를 쓰기 시작했고, 지금은 영하의 기온에도 써.', (st, need) => {
      const kind = pick(['nn', 'np', 'pn']);
      const a = rand(2, 9); let b = rand(2, 9); while (b === a) b = rand(2, 9);
      const x = kind === 'pn' ? a : -a, y = kind === 'np' ? b : -b, s = x + y;
      const R = a + b + 1, neg = x < 0 ? x : y;
      const dir = y > 0 ? `오른쪽으로 ${y}칸` : `왼쪽으로 ${-y}칸`;
      let wrongs, why, steps, q, help = '', unit = '';
      if (kind === 'nn') {
        wrongs = [
          { v: a + b, why: st ? `−를 빼고 ${a} + ${b}만 했구나. 둘 다 물 위보다 아래라 답도 0보다 아래야. 그래서 −가 붙어.` : `−를 빼고 ${a} + ${b}만 했구나. 빚에 빚이 더해지면 빚이 늘어. 그래서 답에도 −가 붙어.` },
          { v: b - a, why: st ? `더 내려간 ${b}m를 올라간 것처럼 셌구나. 더 내려가면 물 위(0m)에서 ${b}칸 더 멀어져.`
            : `${N(-b)}를 +${b}로 바꿔 읽었구나. ${J(P(y), '은', '는')} 왼쪽으로 ${b}칸 더 가는 수야.` },
          { v: a - b, why: st ? `출발점을 물 위 ${a}m로 생각했구나. 물속 ${a}m는 0보다 아래인 ${N(-a)}m야. 거기서 ${b}m 더 내려가.`
            : `앞의 ${N(x)}를 +${a}로 읽었구나. 출발점은 0의 왼쪽 ${a}칸이고, 거기서 왼쪽으로 ${b}칸 더 가야 해.` },
        ];
        why = st ? `물 위가 0m야. 물속 ${a}m에서 ${b}m 더 내려가면 물 위에서 ${a} + ${b} = ${a + b}m 아래, 그래서 ${N(s)}m야.`
          : `−는 빚이라고 생각해 봐. ${N(x)}는 빚 ${a}원, ${J(P(y), '을', '를')} 더하면 빚이 ${b}원 더 생겨. 빚이 모두 ${a} + ${b} = ${a + b}원이라 ${N(s)}! 수직선에서도 0에서 왼쪽으로 ${a}칸, 또 ${b}칸 가.`;
        steps = st ? [`출발: ${N(x)}m (물 위보다 ${a}m 아래)`, `${b}m 더 내려가기 = 수직선 왼쪽으로 ${b}칸`, `0에서 모두 ${a} + ${b} = ${a + b}칸`, `도착: ${N(s)}m`]
          : [`${N(x)} = 빚 ${a}원 (0에서 왼쪽 ${a}칸)`, `${J(P(y), '을', '를')} 더하기 = 빚 ${b}원 더 (왼쪽 ${b}칸)`, `빚 모두: ${a} + ${b} = ${a + b}원`, `빚이니까 −: ${N(s)}`];
        if (st) { q = `잉어킹이 물속 ${a}m(${N(-a)}m)에 있다가 ${b}m 더 내려갔어. 지금 높이는 몇 m일까?`; unit = 'm'; help = '📖 물 위(수면)를 0m로 보면, 물속은 0보다 낮아서 −를 붙여 써.'; }
      } else {
        const big = Math.abs(x) > Math.abs(y) ? x : y, Rp = kind === 'np' ? b : a, Lm = kind === 'np' ? a : b;
        wrongs = [
          { v: -(a + b), why: st ? `+와 −가 섞였는데 두 수를 더하고 −를 붙였어. 오른쪽(따뜻한 쪽)과 왼쪽(추운 쪽)으로 간 칸은 서로 지워지니까 큰 수에서 작은 수를 빼야 해: ${Math.max(a, b)} − ${Math.min(a, b)}.`
            : `+와 −가 섞였는데 두 수를 더하고 −를 붙였어. 돈과 빚은 서로 갚아서 지워지니까 큰 수에서 작은 수를 빼야 해: ${Math.max(a, b)} − ${Math.min(a, b)}.` },
          { v: a + b, why: `−를 무시하고 그냥 더했구나. ${N(neg)}는 왼쪽으로 ${Math.abs(neg)}칸 가는 수라서 오른쪽 칸을 지워.` },
          { v: -s, why: st ? `${Math.abs(s)}칸은 맞았어! 그런데 ${s > 0 ? '따뜻한 쪽(오른쪽)으로 더 많이 가서 0도보다 위야. −를 붙이면 안 돼.' : '추운 쪽(왼쪽)으로 더 많이 가서 0도보다 아래야. 그래서 −가 붙어.'}`
            : `크기 ${Math.abs(s)}는 맞았어! 그런데 ${Rp > Lm ? `돈 ${Rp}원이 빚 ${Lm}원보다 많아서 돈이 남아 +` : `빚 ${Lm}원이 돈 ${Rp}원보다 많아서 빚이 남아 −`}야.` },
        ];
        if (st) {
          why = kind === 'np' ? `수직선에서 ${N(-a)}도부터 따뜻한 쪽(오른쪽)으로 ${b}칸 가면 ${N(s)}도야. ${b > a ? `0도를 지나 ${b - a}칸 더 갔어.` : `아직 0도까지 ${a - b}칸 모자라.`}`
            : `수직선에서 ${a}도부터 추운 쪽(왼쪽)으로 ${b}칸 가면 ${N(s)}도야. ${b > a ? `0도를 지나 ${b - a}칸 더 갔어.` : `아직 0도보다 ${a - b}칸 오른쪽이야.`}`;
        } else {
          // 빚 이야기: 가진 돈(+)과 빚(−)은 서로 갚아서 지워진다
          const left = Rp > Lm ? `돈이 ${Rp - Lm}원 남아` : `빚이 ${Lm - Rp}원 남아`;
          why = `+는 가진 돈, −는 빚이라고 생각해 봐. 돈 ${Rp}원으로 빚 ${Lm}원을 갚으면 ${left}. 그래서 ${N(s)}! 수직선에서도 ${N(x)}에서 ${dir} 가면 ${N(s)}야.`;
        }
        steps = st ? [`출발: ${N(x)}`, `${J(P(y), '을', '를')} 더하기 = ${dir}`, `큰 수 − 작은 수: ${Math.max(a, b)} − ${Math.min(a, b)} = ${Math.abs(s)}`, `${Rp > Lm ? '오른쪽(+)' : '왼쪽(−)'}이 더 커서 ${N(s)}`]
          : [`돈 ${Rp}원, 빚 ${Lm}원`, `서로 갚기: ${Math.max(a, b)} − ${Math.min(a, b)} = ${Math.abs(s)}`, Rp > Lm ? `돈이 남아서 +` : `빚이 남아서 −`, `답: ${N(s)}`];
        if (st) {
          q = kind === 'np' ? `기온이 ${N(-a)}도(영하 ${a}도)였는데 낮에 ${b}도 올랐어. 지금 기온은 몇 도일까?` : `기온이 ${a}도였는데 밤에 ${b}도 내려갔어. 지금 기온은 몇 도일까?`;
          help = kind === 'np' ? '📖 영하 □도 = 0도보다 □도 더 추운 온도. −□도라고 써.' : '📖 0도보다 더 추운 온도(영하)는 앞에 −를 붙여 써.';
          unit = '도';
        }
      }
      if (!q) { q = `${P(x)} + ${P(y)} = ?`; help = '📖 −가 붙은 수(음수) = 0보다 작은 수. 빚처럼 생각해 (−□ = 빚 □원). 괄호 ( )는 한 덩어리라는 뜻'; }
      const line = { type: 'hops', from: -R, to: R, start: x };
      return Q(s, wrongs, why, { q, help, unit, steps, need, pic: { ...line, hops: [], show: false }, viz: { ...line, hops: [y] } });
    }),

  skill('m_int_mul', 6, '정수의 곱셈·나눗셈', '빚 3원이 2번이면 빚 6원: (−3) × 2 = −6. 음수끼리 곱하면 +야 (곱하는 수를 1씩 줄이면 답이 3씩 커지거든). 그래서 음수가 짝수 개면 +, 홀수 개면 −.',
    '빚이 매달 똑같이 쌓이거나 온도가 매시간 똑같이 내려갈 때, 되풀이된 변화를 한 번에 계산하려고 음수 곱셈 규칙이 필요했어.', (st, need) => {
      const kind = st ? 'story' : pick(['mul', 'div', 'mul3']);
      if (kind === 'story') {
        const a = rand(2, 9), b = rand(2, 6), p = -a * b;
        const rows = Array.from({ length: b }, (_, i) => [`${i + 1}턴`, N(-a)]);
        return Q(p, [
          { v: a * b, why: `줄어든 크기 ${a * b}는 맞아! 그런데 HP가 '줄었으니' 변화량에는 −를 붙여야 해.` },
          { v: -(a + b), why: `${a}와 ${b}를 더했구나. 매 턴 ${a}씩 ${b}번 줄었으니 ${a}를 ${b}번 더하는 곱셈이야.` },
          { v: -a * (b + 1), why: `${b + 1}턴으로 한 턴 더 셌어. 표를 보면 ${b}턴뿐이니 (${N(-a)}) × ${b}만 하면 돼.` },
        ], `한 턴에 ${N(-a)}씩 ${b}턴이면 ${N(-a)}를 ${b}번 더한 것 = (${N(-a)}) × ${b}. 크기는 ${a} × ${b} = ${a * b}, 줄었으니 −를 붙여 ${N(p)}.`, {
          q: `독에 걸린 이상해씨의 HP가 매 턴 ${a}씩 줄어. ${b}턴 동안의 HP 변화량은?`, need,
          help: '📖 변화량 = 얼마나 바뀌었는지. 늘면 +, 줄면 −를 붙여 써.',
          pic: { type: 'table', head: ['턴', 'HP 변화'], rows: [...rows, ['모두', '?']], hi: b },
          viz: hopsV(0, -a, b), // 풀이 그림: 0에서 왼쪽으로 a칸씩 b번 (a ≤ 9, b ≤ 6 이라 늘 그려진다)
          steps: [`한 턴 변화: ${N(-a)}`, `${b}턴: (${N(-a)}) × ${b}`, `크기: ${a} × ${b} = ${a * b}`, `줄었으니 −: ${N(p)}`] });
      }
      if (kind === 'mul3') {
        let fs; do { fs = [0, 0, 0].map(() => rand(2, 3) * sgn()); } while (!fs.some((f) => f < 0));
        const [x, y, z] = fs, p = x * y * z, neg = fs.filter((f) => f < 0).length;
        /* 한 줄에 곱셈 하나 + 왜 그 부호인지 (빚 / 음수 × 음수) */
        const why2 = (u, v) => (u < 0 && v < 0 ? ' (음수 × 음수 = +)' : u < 0 || v < 0 ? ' (빚이 여러 번 → −)' : '');
        /* 부호 규칙은 이유부터 (2026-10-24 점검): 음수 × 음수가 나오면 '곱하는 수를 1씩 줄이기' 표 이야기, 음수 × 양수면 빚 이야기 */
        const stepWhy = (u, v) => (u < 0 && v < 0 ? `음수 × 음수가 +인 까닭: ${negNeg(Math.abs(u))}.` : (u < 0) !== (v < 0) ? '음수(빚)에 양수를 곱하면 빚이 여러 번 생겨서 −야.' : '');
        /* 까닭은 하나만 (글이 150자를 넘지 않게): 음수 × 음수가 나오면 그 까닭, 아니면 빚 이야기. 다른 쪽은 steps 의 괄호 글이 보여 준다 */
        const rs = [stepWhy(x, y), stepWhy(x * y, z)].filter(Boolean);
        const reason = rs.find((t) => t.startsWith('음수 × 음수')) || rs[0] || '';
        return Q(p, [
          { v: -p, why: `+와 −를 거꾸로 썼어. 음수를 곱할 때마다 + ↔ −가 바뀌어. −가 붙은 수가 ${neg}개라서 ${neg % 2 ? '−' : '+'}야.` },
          { v: x + y + z, why: `세 수를 더했구나. ×는 곱하기야. 크기 ${Math.abs(x)} × ${Math.abs(y)} × ${Math.abs(z)}부터 해 보자.` },
          { v: x * y, why: `앞의 두 수만 곱했어. 마지막 ${J(P(z), '까지', '까지')} 곱해야 끝나.` },
        ], `앞에서부터 둘씩 차례로 곱해. ${P(x)} × ${P(y)} = ${N(x * y)}, 여기에 ${J(P(z), '을', '를')} 곱하면 ${N(p)}. ${reason}`, {
          q: `${P(x)} × ${P(y)} × ${P(z)} = ?`, need,
          help: '📖 −가 붙은 수(음수) = 0보다 작은 수(빚처럼). 괄호는 한 덩어리. 앞에서부터 둘씩 차례로 곱해',
          steps: [`${P(x)} × ${P(y)} = ${N(x * y)}${why2(x, y)}`, `${P(x * y)} × ${P(z)} = ${N(p)}${why2(x * y, z)}`, `확인: 음수 ${neg}개 → ${neg % 2 ? '홀수라 −' : '짝수라 +'}`],
          viz: { type: 'table', head: ['차례로 곱하기', '답'], rows: [[`${P(x)} × ${P(y)}`, N(x * y)], [`위의 답 × ${P(z)}`, N(p)]], hi: 1 } });
      }
      let x, y; do { x = rand(2, 9) * sgn(); y = rand(2, 9) * sgn(); } while (x > 0 && y > 0);
      if (kind === 'mul') {
        const p = x * y, neg = (x < 0) + (y < 0);
        const A = Math.abs(x), B = Math.abs(y), ab = A * B;
        const ks = [2, 1, 0, -1, -2]; if (!ks.includes(y)) ks.push(y);
        const table = { type: 'table', head: [`${P(x)}에 곱하는 수`, '답'], rows: ks.map((k) => [`× ${P(k)}`, N(x * k)]), hi: ks.indexOf(y) };
        let why, steps, viz;
        if (neg === 1) {
          /* 음수 하나: 빚을 여러 번 더하기. 뒤의 수가 음수면 앞뒤를 바꿔(곱하기는 순서를 바꿔도 같아) 빚 × 횟수로 읽는다 */
          const debt = x < 0 ? A : B, times = x < 0 ? B : A, swap = y < 0;
          why = `${swap ? `곱하기는 앞뒤를 바꿔도 같아서 ${x} × ${P(y)} = ${P(y)} × ${x}야. ` : ''}${N(-debt)}는 빚 ${debt}원이야. 빚 ${debt}원이 ${times}번 생기면 빚이 ${debt} × ${times} = ${ab}원, 그래서 ${N(p)}!`;
          steps = [...(swap ? [`앞뒤 바꾸기: ${P(y)} × ${x}`] : []), `빚 ${debt}원이 ${times}번`, `${debt} × ${times} = ${ab}`, `빚이니까 −: ${N(p)}`];
          viz = hopsV(0, -debt, times) || table;
        } else {
          /* 음수 둘: 곱하는 수를 1씩 줄이면 답이 A씩 커진다 → 0을 지나면 + (표로 보여 준다) */
          why = `${negNeg(A)}. 그래서 ${J(`${P(x)} × ${P(y)}`, '은', '는')} 크기 ${A} × ${B} = ${ab}에 +를 붙여 답은 ${p}!`;
          steps = [`${P(x)} × 1 = ${N(x)}`, `${P(x)} × 0 = 0 (${A}만큼 커짐)`, `${P(x)} × (${MI}1) = ${A} (또 ${A}만큼 커짐)`, `크기: ${A} × ${B} = ${ab}`, `음수 × 음수 = + → ${p}`];
          viz = table;
        }
        return Q(p, [
          { v: -p, why: neg === 2 ? `+와 −를 거꾸로 썼어. 표처럼 곱하는 수를 1씩 줄이면 0을 지나 계속 커져서 음수 × 음수는 +야.` : `+와 −를 거꾸로 썼어. 빚(음수)을 여러 번 더하면 빚이 늘어서 −야.` },
          { v: x + y, why: `곱하기를 더하기로 했구나. 크기 ${A} × ${B}부터 계산한 뒤 + 또는 −를 붙여.` },
          { v: Math.sign(p) * A * (B + 1), why: `${A} × ${B + 1}를 했어. 구구단 ${A}단에서 한 칸 더 갔어. ${A} × ${B} = ${ab}야.` },
        ], why, {
          q: `${P(x)} × ${P(y)} = ?`, need,
          help: '📖 −가 붙은 수(음수) = 0보다 작은 수. 빚처럼 생각해. 괄호는 한 덩어리라는 뜻',
          steps, viz });
      }
      const d = x * y, qv = x; // d ÷ y = x
      const D = Math.abs(d), Yy = Math.abs(y), Qa = Math.abs(qv);
      /* 세 가지 경우를 빚 이야기로: ① 빚을 빚씩 묶기(몇 묶음 → +) ② 빚을 여럿이 나눠 지기(한 명 몫도 빚 → −) ③ 곱셈 거꾸로 */
      const c = d < 0 && y < 0 ? 'group' : d < 0 ? 'share' : 'back';
      const kt = [1, 0, -1, qv];
      const W = {
        group: {
          why: `${N(d)}는 빚 ${D}원, ${N(y)}는 빚 ${Yy}원이야. 빚 ${D}원을 빚 ${Yy}원씩 묶으면 몇 묶음일까? ${Yy} × ${Qa} = ${D}라서 ${Qa}묶음! 묶음 수는 +라서 답은 ${qv}. 확인: ${P(y)} × ${qv} = ${N(d)}.`,
          steps: [`${N(d)} = 빚 ${D}원, ${N(y)} = 빚 ${Yy}원`, `빚 ${Yy}원씩 몇 묶음이면 ${D}원?`, `${Yy} × ${Qa} = ${D} → ${Qa}묶음`, `묶음 수는 + → 답 ${qv}`, `확인: ${P(y)} × ${qv} = ${N(d)}`],
          viz: hopsV(0, y, Qa), flip: `묶음 수를 −로 썼어. 빚 ${Yy}원씩 ${Qa}묶음이면 묶음 수는 그냥 ${Qa}(+)야.` },
        share: {
          why: `${N(d)}는 빚 ${D}원이야. 빚 ${D}원을 ${Yy}명이 똑같이 나눠 지면 한 명에 빚 ${D} ÷ ${Yy} = ${Qa}원, 그래서 ${N(qv)}! 확인: ${P(qv)} × ${Yy} = ${N(d)}.`,
          steps: [`${N(d)} = 빚 ${D}원`, `${Yy}명이 똑같이 나눠 지기`, `${D} ÷ ${Yy} = ${Qa}`, `한 명 몫도 빚 → ${N(qv)}`, `확인: ${P(qv)} × ${Yy} = ${N(d)}`],
          viz: hopsV(0, qv, Yy), flip: `한 명이 나눠 진 것도 빚이라 −가 붙어. 빚 ${Qa}원 = ${N(qv)}.` },
        back: {
          why: `나눗셈은 곱셈을 거꾸로 한 거야: ${P(y)} × □ = ${d}인 □를 찾자. 크기는 ${D} ÷ ${Yy} = ${Qa}. 그런데 ${P(y)} × ${Qa}는 빚 ${Yy}원이 ${Qa}번이라 ${N(-D)}. +${d}가 되려면 □도 음수여야 해(음수 × 음수 = +). 그래서 ${N(qv)}.`,
          steps: [`${P(y)} × □ = ${d}인 □ 찾기`, `크기: ${D} ÷ ${Yy} = ${Qa}`, `${P(y)} × ${Qa} = ${N(-D)} (빚이라 −)`, `+${d}가 되려면 □ = ${N(qv)}`, `확인: ${P(y)} × ${P(qv)} = ${d}`],
          viz: null, flip: `${P(y)} × ${Qa} = ${N(-D)}라서 ${d}가 안 돼. 음수 × 음수가 +니까 □에도 −를 붙여야 해.` },
      }[c];
      return Q(qv, [
        { v: -qv, why: W.flip },
        { v: d * y, why: `나눗셈인데 곱했구나. ÷는 '몇 번 들어가나'를 묻는 거라 ${D} ÷ ${Yy}부터 해.` },
        { v: fr(y, d), why: `나누는 순서를 바꿨어. 앞의 수 ${N(d)}를 뒤의 수 ${N(y)}로 나눠야 해.` },
      ], W.why, {
        q: `${P(d)} ÷ ${P(y)} = ?`, need,
        help: '📖 −가 붙은 수(음수) = 0보다 작은 수. 빚처럼 생각해. ÷ = 몇 묶음인지, 또는 똑같이 나누면 얼마씩인지',
        steps: W.steps,
        viz: W.viz || { type: 'table', head: [`${P(y)}에 곱하는 수`, '답'], rows: kt.map((k) => [`× ${P(k)}`, N(y * k)]), hi: 3 } });
    }),

  skill('m_frac_mul', 6, '분수의 곱셈', '1/2 × 1/3 = "1/2의 1/3". 네모를 세로 2칸, 가로 3칸으로 자르면 겹친 곳은 6조각 중 1조각이야. 그래서 위(분자)끼리, 아래(분모)끼리 곱해.',
    '"남은 피자의 절반", "물의 3분의 2"처럼 어떤 양의 몇 분의 몇을 구할 일이 많아서 분수 곱셈이 필요했어.', (st, need) => {
      let a, b, c, d;
      do { b = rand(2, 9); a = rand(1, b - 1); d = rand(2, 9); c = rand(1, d - 1); } while (gcd(a, b) !== 1 || gcd(c, d) !== 1);
      const ans = fr(a * c, b * d), raw = `${a * c}/${b * d}`, g = gcd(a * c, b * d), bd = b * d, ac = a * c;
      /* 이유부터: '× c/d' = '~의 c/d' (6 × 1/2 = 6의 반). 네모 한 판을 가로 b칸 × 세로 d칸으로 자르면 겹친 곳이 a × c 조각 (넓이 그림).
       * 약분도 이유부터: bd조각을 g조각씩 묶으면 bd/g묶음, 겹친 ac조각은 ac/g묶음 (2026-10-24 2차 점검 G9, 글 130자 안팎) */
      const why = `6 × 1/2이 '6의 반'이듯 ${a}/${b} × ${c}/${d}는 '${a}/${b}의 ${c}/${d}'${'013678'.includes(String(c).slice(-1)) ? '이야' : '야'}. 네모를 가로 ${b}칸, 세로 ${d}칸으로 자르면 ${bd}조각 중 겹친 곳은 ${ac}조각 → ${raw}.`
        + (g > 1 ? ` ${g}조각씩 묶으면 ${bd / g}묶음 중 ${ac / g}묶음이라 ${ans}.` : '');
      return Q(ans, [
        { v: fr(a * d, b * c), why: `뒤의 분수를 뒤집어 곱했어. 뒤집기는 '몇 번 들어가나'를 묻는 나눗셈 방법이야. '~의 몇 분의 몇'은 그대로 곱해.` },
        { v: fr(a + c, b + d), why: (b === d && a > c && fr(a - c, b) === fr(a + c, b + d) ? `${a}/${b} − ${c}/${d}처럼 뺐거나, 위끼리·아래끼리 더했구나. ` : `위끼리, 아래끼리 더했구나: ${a + c}/${b + d}${fr(a + c, b + d) !== `${a + c}/${b + d}` ? ` = ${fr(a + c, b + d)}` : ''}. `) + `'~의 몇 분의 몇'은 곱하기야: ${b}칸 × ${d}칸 = ${b * d}조각 중 ${a * c}조각.` },
        { v: fr(a * d + b * c, b * d), why: `두 분수를 더했어. '~의 몇 분의 몇'은 곱하기야. 1보다 작은 분수를 곱하면 처음보다 작아져.` },
      ], why, {
        q: st ? `나무열매 파이가 ${a}/${b}판 남았어. 피카츄가 그중 ${c}/${d}를 먹었어. 먹은 양은 파이 한 판의 얼마?` : `${a}/${b} × ${c}/${d} = ?`,
        help: st ? `📖 ${a}/${b}판 = 한 판을 ${b}조각 낸 것 중 ${a}조각. 그중 ${c}/${d} = 그 양을 ${d}조각 낸 것 중 ${c}조각`
          : `📖 ${a}/${b} = 전체를 ${b}조각 낸 것 중 ${a}조각. 분수를 곱하기(×) = '~의 몇 분의 몇'을 구하기`,
        pic: { type: 'fraccmp', a: [a, b], b: [c, d] },
        need, more: [{ v: fr(a * c, b + d), why: `위는 곱했는데 아래는 더했어. 넓이 그림처럼 조각 수도 곱해야 맞아: ${b} × ${d} = ${b * d}.` }], gen: fracGen,
        steps: [`${a}/${b} × ${c}/${d} = '${a}/${b}의 ${c}/${d}'`, `전체 조각: ${b} × ${d} = ${bd}`, `겹친 조각: ${a} × ${c} = ${ac}`, `분수로: ${raw}`, ...(g > 1 ? [`${g}조각씩 묶기: ${bd / g}묶음 중 ${ac / g} → ${ans}`] : [])],
        viz: fracGrid(a, b, c, d, `${a * c}조각`) });
    }),

  skill('m_frac_div', 6, '분수의 나눗셈', '÷ 분수 = "몇 번 들어가나". 두 분수를 같은 크기 조각으로 바꿔 조각 수끼리 나누면 돼. 그 결과가 \'나누는 분수를 뒤집어 곱하기\'와 같아.',
    '주스를 1/4L 컵에 나눠 담으면 몇 컵인지처럼, "작은 양이 몇 번 들어가나"를 알려고 분수 나눗셈을 써.', (st, need) => {
      let a, b, c, d, q;
      if (st) {
        b = rand(2, 4); do { a = rand(1, b - 1); } while (gcd(a, b) !== 1);
        d = b * rand(2, 3); c = 1;
        q = `나무열매 주스 ${a}/${b}L를 1/${d}L짜리 컵에 가득 따르면 몇 컵이 될까?`;
      } else {
        do { b = rand(2, 9); a = rand(1, b - 1); d = rand(2, 9); c = rand(1, d - 1); } while (gcd(a, b) !== 1 || gcd(c, d) !== 1 || a * d === b * c);
        q = `${a}/${b} ÷ ${c}/${d} = ?`;
      }
      const ans = fr(a * d, b * c), raw = `${a * d}/${b * c}`, k = d / b, bd = b * d;
      /* 이유부터: 두 분수를 같은 크기 조각(bd조각짜리)으로 바꾸면 '몇 번 들어가나' = 조각 수 ÷ 조각 수. 그 결과가 '뒤집어 곱하기'와 같다 */
      /* '위아래에 k를 곱하기'도 이유부터: 1/b 조각을 다시 k조각씩 자르면 1/d 조각이 k개 (2026-10-24 2차 점검) */
      const why = st ? `1/${d}L 컵이 ${a}/${b}L 안에 몇 번 들어가나야. 1/${b}L를 ${k}조각씩 자르면 1/${d}L가 돼서 ${a}/${b}L = 1/${d}L가 ${a} × ${k} = ${a * k}개. 그래서 ${a * k}컵!`
        : `"${c}/${d}가 ${a}/${b} 안에 몇 번 들어가나?"야. 둘 다 ${bd}조각짜리로 바꾸면 ${a}/${b} = ${a * d}/${bd}, ${c}/${d} = ${b * c}/${bd}. ${a * d}조각 안에 ${b * c}조각이 ${a * d} ÷ ${b * c} = ${ans}번 들어가. 뒤집어 곱한 ${a}/${b} × ${d}/${c}와 같아!`;
      return Q(ans, [
        { v: fr(a * c, b * d), why: st ? `${a}/${b} × 1/${d}처럼 곱했어. 컵이 몇 번 들어가는지는 나누기라서 1/${d}를 ${d}/1로 뒤집어 곱해.`
          : `그냥 곱했어. 곱하기는 '~의 몇 분의 몇'이라 작아져. 묻는 건 ${c}/${d}가 몇 번 들어가나야.` },
        { v: fr(b * c, a * d), why: st ? `주스 양 ${a}/${b}를 뒤집어 계산했어. 뒤집는 건 컵 크기 1/${d} 쪽뿐이야.` : `거꾸로 '${a}/${b}가 ${c}/${d} 안에 몇 번'을 구했어. 같은 조각으로 세면 ${a * d}조각 안에 ${b * c}조각이 몇 번인지야.` },
        { v: fr(b * d, a * c), why: st ? `두 분수를 다 뒤집었어. 주스 ${a}/${b}는 그대로 두고 컵 1/${d}만 뒤집어: ${a}/${b} × ${d}.` : `두 분수를 다 뒤집었어. 같은 조각으로 바꿔 세면 ${a * d} ÷ ${b * c}, 뒤집는 건 뒤의 ${c}/${d}뿐이야.` },
      ], why, {
        q, need, gen: fracGen,
        help: st ? `📖 L(리터) = 물의 양 단위. 1/${d}L = 1L를 똑같이 ${d}칸 낸 것 중 1칸` : '📖 ÷ 분수 = \'그 분수가 몇 번 들어가나\'. □/△ = △조각 중 □조각',
        pic: { type: 'fraccmp', a: [a, b], b: [c, d] },
        steps: st ? [`1/${b}L를 ${k}조각씩 → 1/${d}L 조각`, `${a}/${b}L = 1/${d}L가 ${a} × ${k} = ${a * k}개`, `1/${d}L 컵이 ${a * k}번 들어가`, `뒤집어 곱해도: ${a}/${b} × ${d}/1 = ${ans}`]
          : [`같은 크기 조각으로: ${b} × ${d} = ${bd}조각짜리`, `${a}/${b} = ${a * d}/${bd} (한 조각을 ${d}조각씩)`, `${c}/${d} = ${b * c}/${bd} (한 조각을 ${b}조각씩)`, ...((a * d) % (b * c) === 0 ? [`몇 번 들어가나: ${a * d} ÷ ${b * c} = ${ans}`] // 딱 나누어떨어지면 '24 ÷ 12 = 24/12' 같은 줄 없이 바로
            : [`몇 번 들어가나: ${a * d} ÷ ${b * c} = ${raw}`, ...(raw !== ans ? [`같은 수씩 묶어 줄이기(약분): ${ans}`] : [])])],
        viz: st ? { type: 'icons', rows: [{ e: '🥤', n: a * k, t: `1/${d}L 컵` }], total: `모두 ${a * k}컵` }
          : { type: 'table', head: ['', `${bd}조각짜리로`, '조각 수'], rows: [[`${a}/${b}`, `${a * d}/${bd}`, `${a * d}개`], [`${c}/${d}`, `${b * c}/${bd}`, `${b * c}개`], ['몇 번?', `${a * d} ÷ ${b * c}`, ans]], hi: 2 } });
    }),

  skill('m_percent', 6, '비율과 백분율', '%(퍼센트)는 "100개 중 몇 개"라는 뜻이야. 300의 20%는 300 × 20 ÷ 100 = 60.',
    '전체 크기가 달라도 쉽게 비교하려고, 무엇이든 "100개 중 몇 개"로 바꿔 말하는 %를 만들었어.', (st, need) => {
      const kind = st ? pick(['hp', 'sale']) : pick(['of', 'what']);
      if (kind === 'sale') {
        const price = pick([1000, 2000, 3000, 4000, 5000]), p = pick([10, 20, 25, 30, 50]);
        const off = price * p / 100, ans = price - off, one = price / 100;
        return Q(ans, [
          { v: off, why: `깎아 주는 돈 ${off}원까지는 맞아! 물어본 건 내야 할 돈이라 ${price}원에서 빼야 해.` },
          { v: price - p, why: `${p}%를 ${p}원으로 생각했구나. %는 100칸 중 몇 칸이라서 ${price}원의 ${p}칸 = ${off}원이야.` },
          { v: price + off, why: `할인인데 더했어. 할인은 값을 깎아 주는 거라 빼야 해.` },
        ], `${price}원을 100칸으로 나누면 한 칸이 ${one}원. ${p}칸이면 ${one} × ${p} = ${off}원을 깎아 줘. 그래서 ${price} − ${off} = ${ans}원!`, {
          q: `${price}원짜리 몬스터볼을 ${p}% 할인해서 팔아. 얼마에 살 수 있을까?`, unit: '원', need,
          help: `📖 ${p}% 할인 = 값을 100칸으로 나눠 그중 ${p}칸만큼 깎아 주기`,
          pic: { type: 'scene', items: [{ e: '🔴', t: `몬스터볼 ${price}원` }, { e: '🏷️', t: `${p}% 할인` }, { e: '💰', t: '낼 돈 = ?' }] },
          steps: [`한 칸(1%): ${price} ÷ 100 = ${one}원`, `깎는 돈: ${one} × ${p} = ${off}원`, `낼 돈: ${price} − ${off} = ${ans}원`],
          viz: { type: 'chart', bars: [{ l: '원래 값', v: price }, { l: '깎는 돈', v: off }, { l: '낼 돈', v: ans }], unit: '원' } });
      }
      if (kind === 'what') {
        const b = pick([4, 5, 10, 20, 25, 50]), a = rand(1, b - 1), ans = 100 * a / b;
        const rev = 100 * b / a, mul = 100 / b, dec = Math.round(a / b * 1000) / 1000;
        const pic = b <= 25 ? { type: 'icons', rows: [{ e: '🔴', n: a, t: `빨간 공 ${a}개` }, { e: '⚪', n: b - a, t: '다른 색 공' }] }
          : { type: 'chart', bars: [{ l: '빨간 공', v: a, c: '#f7a58f' }, { l: '다른 공', v: b - a, c: '#9db8f0' }], unit: '개' };
        return Q(ans, [
          { v: a, why: `개수 ${a}를 그대로 썼어. %는 전체를 100개로 늘렸을 때의 개수라 ${a} × ${mul}을(를) 해야 해.` },
          { v: 100 - ans, why: `빨갛지 않은 공의 %를 구했어. 물어본 건 빨간 공 ${a}개 쪽이야.` },
          Number.isInteger(rev) ? { v: rev, why: `거꾸로 나눴어. 비율은 (빨간 공) ÷ (전체) = ${a} ÷ ${b} 순서야.` }
            : { v: dec, why: `${a} ÷ ${b} = ${dec}까지는 맞아! %로 바꾸려면 100을 곱해야 해.` },
        ], `전체 ${b}개를 100개로 늘리려면 × ${mul}. 빨간 공도 똑같이 늘리면 ${a} × ${mul} = ${ans}개. 100개 중 ${ans}개니까 ${ans}%!`, {
          q: `공 ${b}개 중 ${a}개가 빨간 공이야. 빨간 공은 전체의 몇 %일까?`, unit: '%', need,
          help: '📖 %(퍼센트) = 100개 중 몇 개인지. 전체를 100개로 늘려 생각해',
          pic,
          more: [{ v: dec, why: `${a} ÷ ${b} = ${dec}까지는 맞아! %로 바꾸려면 100을 곱해야 해.` }],
          steps: [`100 ÷ ${b} = ${mul} (몇 배로 늘릴지)`, `빨간 공: ${a} × ${mul} = ${ans}`, `100개 중 ${ans}개 → ${ans}%`],
          viz: { type: 'table', head: ['', '빨간 공', '전체'], rows: [['처음', `${a}개`, `${b}개`], [`× ${mul}`, `${ans}개`, '100개']], hi: 1 } });
      }
      // 답이 100이면 낱말 풀이의 '100개 중'과 겹쳐 보이므로 뺀다 (2026-10-24)
      let base, p; do { base = pick([20, 40, 50, 60, 80, 120, 200, 300, 400]); p = pick([10, 20, 25, 30, 40, 50, 75]); } while (base * p % 100 !== 0 || base * p === 10000);
      const ans = base * p / 100, hp = kind === 'hp';
      return Q(ans, [
        { v: base * p / 10, why: `100이 아니라 10으로 나눴어. '퍼센트'는 '100개 중에'라는 뜻이라 100으로 나눠야 해.` },
        { v: p, why: `${p}%의 ${p}를 그대로 답했어. ${base}의 ${p}%는 ${base} × ${p} ÷ 100으로 구해.` },
        { v: base - ans, why: `${p}%를 빼고 남은 양을 구했어. 물어본 건 ${hp ? '줄어든 HP 쪽' : `${p}%만큼의 양`}이야.` },
      ], `${base}의 ${p}%는 ${base}를 100칸으로 나눈 것 중 ${p}칸이야. ${base} × ${p} = ${base * p}, 100으로 나누면 ${base * p} ÷ 100 = ${ans}.`, {
        q: hp ? `HP가 ${base}인 꼬부기가 공격을 받아 HP의 ${p}%가 줄었어. 줄어든 HP는 얼마일까?` : `${base}의 ${p}%는 얼마일까?`, need,
        help: `📖 ${p}% = 100개 중 ${p}개. ${base}의 ${p}% = ${base}를 100칸으로 나눈 것 중 ${p}칸`,
        ...(hp ? { pic: { type: 'scene', items: [{ e: '🐢', t: `꼬부기 HP ${base}` }, { e: '💥', t: `${p}% 줄어듦` }, { e: '❓', t: '줄어든 HP = ?' }] } } : {}),
        steps: [`${p}% = 100칸 중 ${p}칸`, `${base} × ${p} = ${base * p}`, `${base * p} ÷ 100 = ${ans}`],
        viz: { type: 'chart', bars: [{ l: '전체 (100%)', v: base }, { l: `${p}%`, v: ans }] } });
    }),

  skill('m_ratio', 6, '비례식', '비 3 : 4는 "3개마다 4개씩"이라는 짝이야. 한쪽을 몇 배 하면 다른 쪽도 똑같이 몇 배 해야 비율이 지켜져.',
    '요리 재료를 두 배로 늘리거나 지도에서 실제 거리를 잴 때, 비율을 똑같이 지켜야 맛과 길이가 맞아.', (st, need) => {
      let a, b; do { a = rand(1, 6); b = rand(1, 6); } while (a === b || gcd(a, b) !== 1);
      const k = rand(2, 5), c = a * k, x = b * k;
      const [hA, hB] = st ? ['오렌열매', '물'] : ['앞 수', '뒤 수'], [uA, uB] = st ? ['개', '컵'] : ['', ''];
      return Q(x, [
        { v: b + c - a, why: `${a}에서 ${c}로 ${c - a}만큼 늘었다고 ${b}에도 ${c - a}를 더했구나. 비율은 더하기가 아니라 '몇 배'로 늘어.` },
        { v: b * c, why: `${b} × ${c} = ${b * c}까지는 맞아! 이건 □의 ${a}배라서 ${a}로 한 번 더 나눠야 해.` },
        { v: k, why: `몇 배인지(${k}배)만 구하고 멈췄어. ${b}에도 ${k}를 곱해야 □가 나와.` },
      ], st ? `오렌열매가 ${a}개에서 ${c}개로, ${c} ÷ ${a} = ${k}배가 됐어. 맛을 똑같이 하려면 물도 ${k}배 → ${b} × ${k} = ${x}컵!`
        : `${a}에서 ${c}가 되려면 ${c} ÷ ${a} = ${k}배야. 비율을 지키려면 ${b}도 똑같이 ${k}배 → ${b} × ${k} = ${x}.`, {
        q: st ? `오렌열매 ${a}개에 물 ${b}컵 비율로 주스를 만들어. 오렌열매 ${c}개면 물은 몇 컵이 필요할까?` : `${a} : ${b} = ${c} : □에서 □에 알맞은 수는?`,
        unit: st ? '컵' : '', need,
        help: st ? '📖 비율 = 몇 개에 몇 개씩 섞는지 정한 짝. 맛이 같으려면 짝이 같아야 해' : '📖 비(:) = \'몇 대 몇\', 앞 수만큼마다 뒤 수만큼씩인 짝. □ = 찾을 수',
        pic: { type: 'table', head: [hA, hB], rows: [[`${a}${uA}`, `${b}${uB}`], [`${c}${uA}`, '?']] },
        more: [{ v: fr(a * c, b), why: `${a} × ${c} ÷ ${b}로 짝을 바꿔 계산했어. 바깥 두 수(${a}, □)의 곱 = 안쪽 두 수(${b}, ${c})의 곱이야.` }],
        steps: [`몇 배?: ${c} ÷ ${a} = ${k}배`, `${hB}도 ${k}배: ${b} × ${k} = ${x}`, `확인: ${a} × ${x} = ${b} × ${c} = ${a * x}`],
        viz: { type: 'table', head: ['', hA, hB], rows: [['처음', `${a}${uA}`, `${b}${uB}`], [`× ${k}`, `${c}${uA}`, `${x}${uB}`]], hi: 1 } });
    }),

  /* ───────── 중1 ───────── */
  skill('m_expr_value', 7, '문자와 식, 식의 값', '문자 x는 "아직 정하지 않은 수"의 자리야. 3x + 5는 "3개씩 x봉지와 낱개 5개"라서 봉지 속(곱셈)부터 세. 음수를 넣을 땐 괄호로 감싸.',
    '택시 요금처럼 규칙은 같고 숫자만 바뀌는 계산이 많아. 규칙을 문자식으로 적어 두면 숫자만 넣어 바로 계산할 수 있어.', (st, need) => {
      const kind = st ? 'A' : pick(['A', 'B', 'C']);
      if (kind === 'A') {
        const a = rand(2, 9), x = rand(2, 9), b = rand(1, 9), v = a * x + b;
        const X1 = x + 1, Y1 = rd((a * X1 + b) * 1.1);
        return Q(v, [
          { v: Number(`${a}${x}`) + b, why: `${a}x에 ${x}를 넣어 ${a}${x}(두 자리 수)로 읽었구나. ${a}x는 ${a} × x라서 ${a} × ${x} = ${a * x}야.` },
          { v: a + x + b, why: `${a}x를 ${a} + x로 봤구나. 문자 앞의 수는 곱하기가 숨어 있는 거야: ${a} × ${x}.` },
          { v: a * (x + b), why: `${x} + ${b}를 먼저 더했어. ${a}x는 '${a}씩 ${x}번'인 한 덩어리라 ${a} × ${x}부터 계산해.` },
        ], st ? `${a}x는 '레벨마다 ${a}씩'이라 ${a} × x야. 레벨 ${J(x, '이면', '면')} ${a}가 ${x}번: ${a} × ${x} = ${a * x}. 여기에 기본 ${b}를 더해 ${a * x} + ${b} = ${v}. ${a} × ${x}가 한 덩어리라 먼저 계산해!`
          /* '곱셈 먼저'도 이유부터 (강의 5장: 사탕 a개씩 x봉지 + 낱개 b개 — 봉지 속부터 센다) (2026-10-24 2차 점검 G10) */
          : `${a}x + ${b}는 '사탕 ${a}개씩 x봉지와 낱개 ${b}개'야. x = ${J(x, '이면', '면')} 봉지 속부터 세: ${a} × ${x} = ${a * x}. 낱개를 더해 ${a * x} + ${b} = ${v}. 그래서 곱셈이 먼저야!`, {
          q: st ? `피카츄 10만볼트의 위력은 레벨이 x일 때 ${a}x + ${b}야. 레벨 ${x}일 때 위력은?` : `x = ${x}일 때 ${a}x + ${b}의 값은?`, need,
          help: `📖 x = 아직 정하지 않은 수의 자리. ${a}x = ${a} × x (곱하기 기호를 빼고 써)`,
          pic: { type: 'flow', items: [{ e: '📥', t: `x 자리에 ${x}` }, { e: '⚙️', t: `${a}x + ${b}` }, { e: '❓', t: '나오는 값은?' }] },
          steps: [`x 자리에 ${x}: ${a} × ${x} + ${b}`, st ? `레벨마다 ${a}씩 ${x}번: ${a} × ${x} = ${a * x}` : `봉지 속부터(곱셈): ${a} × ${x} = ${a * x}`, `${st ? '기본' : '낱개'} 더하기: ${a * x} + ${b} = ${v}`],
          viz: { type: 'plot', x: [0, X1], y: [0, Y1], fns: [{ f: `${a}*x+${b}` }],
            pts: [{ x, y: v, label: fj(`x = ${x}일 때 ${v}`), lx: -34 }],
            segs: [{ x1: x, y1: 0, x2: x, y2: v, dash: true }, { x1: 0, y1: v, x2: x, y2: v, dash: true }], xl: st ? '레벨 x' : 'x', yl: `${st ? '위력' : 'y'} = ${a}x + ${b}` } });
      }
      if (kind === 'B') {
        const a = rand(2, 6), x = -rand(2, 6), b = rand(1, 9), v = a * x + b;
        const lo = a * (x - 1) + b, hi = a * 2 + b, D = -a * x; // D = 빚 크기 (a × |x|)
        /* 음수 곱하기·더하기도 빚 이야기로 (2026-10-24 2차 점검: 규칙은 이유부터) */
        const pay = v < 0 ? `빚 ${D}에서 ${b}를 갚으면 빚 ${-v}이 남아 ${N(v)}` : v === 0 ? `빚 ${D}를 ${b}로 다 갚아 0` : `빚 ${D}를 ${b}로 갚고 ${v}이 남아`;
        return Q(v, [
          { v: a * -x + b, why: `${N(x)}의 −를 빠뜨려 ${-x}를 넣었어. 음수는 (${N(x)})처럼 괄호째 넣어야 −가 안 사라져.` },
          { v: a + x + b, why: `괄호 없이 ${a}${N(x)}처럼 붙여 써서 빼기가 돼 버렸어. ${a}x는 ${J(`${a} × (${N(x)})`, '이야', '야')}.` },
          { v: a * x, why: `${a} × (${N(x)}) = ${N(a * x)}까지 맞아! 뒤에 있는 + ${b}를 빠뜨렸어.` },
        ], `x 자리에 ${J(`(${N(x)})`, '을', '를')} 괄호째 넣으면 ${a} × (${N(x)}) + ${b}. ${a}x가 한 덩어리라 곱셈부터: 빚 ${-x}이 ${a}번이면 빚 ${D}, ${N(a * x)}. 그다음 ${pay}.`, {
          q: `x = ${N(x)}일 때 ${a}x + ${b}의 값은?`, need,
          help: '📖 □x = □ × x (곱하기 기호를 빼고 써). −가 붙은 수(음수)를 넣을 땐 (−□)처럼 괄호로 감싸',
          steps: [`괄호로 넣기: ${a} × (${N(x)}) + ${b}`, `곱셈부터: 빚 ${-x}이 ${a}번 = ${N(a * x)}`, `더하기: ${N(a * x)} + ${b} = ${N(v)}`],
          viz: { type: 'plot', x: [x - 1, 2], y: [Math.min(lo, 0) - 1, Math.max(hi, 0) + 1], fns: [{ f: `${a}*x+${b}` }], yl: `y = ${a}x + ${b}`,
            pts: [{ x, y: v, label: fj(`x = ${N(x)}일 때 ${N(v)}`), lx: 62, ly: 18 }], segs: [{ x1: x, y1: 0, x2: x, y2: v, dash: true }] } });
      }
      const x = -rand(2, 5), b = rand(1, 9), v = x * x - b;
      return Q(v, [
        { v: -(x * x) - b, why: `(${N(x)})²을 −(${-x} × ${-x})처럼 계산했어. (${N(x)}) × (${N(x)}) = ${x * x}, 음수끼리 곱하면 양수야.` },
        { v: 2 * x - b, why: `x²을 x × 2로 착각했어. x²은 x를 두 번 곱하는 x × x야.` },
        { v: x * x + b, why: `− ${b}를 + ${b}로 바꿔 계산했어. 식에 적힌 대로 ${x * x}에서 ${b}를 빼야 해.` },
      ], `x²은 x × x야. x 자리에 ${J(`(${N(x)})`, '을', '를')} 넣으면 (${N(x)}) × (${N(x)}) = ${x * x}. 음수 × 음수가 +인 까닭: ${negNeg(-x)}. 그래서 ${x * x} − ${b} = ${N(v)}.`, {
        q: `x = ${N(x)}일 때 x² − ${b}의 값은?`, need,
        help: '📖 x² = x × x (위의 작은 수 = 곱하는 횟수). −가 붙은 수(음수)는 괄호로 감싸서 넣어',
        steps: [`괄호로 넣기: (${N(x)})² − ${b}`, `(${N(x)}) × (${N(x)}) = ${x * x} (음수 × 음수 = +)`, `${x * x} − ${b} = ${N(v)}`],
        viz: { type: 'plot', x: [x - 1, -x + 1], y: [-b - 1, (x - 1) ** 2 - b + 1], fns: [{ f: `x^2-${b}` }], yl: `y = x² − ${b}`,
          pts: [{ x, y: v, label: fj(`x = ${N(x)}일 때 ${N(v)}`), lx: 58, ly: -14 }] } });
    }),

  skill('m_linear_eq', 7, '일차방정식', '저울처럼 양쪽에 똑같은 일(같은 수 빼기·나누기)을 하면 같다(=)가 그대로야. 그렇게 x만 남겨.',
    '옛날 사람들은 물건값처럼 모르는 수가 섞인 계산을 말로 풀다 자주 헷갈렸어. 그래서 모르는 수를 x로 쓰고 저울처럼 푸는 방정식을 만들었어.', (st, need) => {
      let a, x, b;
      if (st) { a = rand(2, 6); x = rand(2, 9); b = rand(1, 9); } else { a = rand(2, 6); x = nz(-6, 9); b = nz(-9, 9); }
      const c = a * x + b, C = N(c);
      const X = (s) => `x = ${s}`;
      const lhs = poly([[a, 1], [b, 0]]);
      const s1 = b > 0 ? `양쪽에서 ${b} 빼기: ${C} − ${b} = ${N(c - b)}` : `양쪽에 ${-b} 더하기: ${C} + ${-b} = ${N(c - b)}`;
      return Q(X(N(x)), [
        { v: X(fr(c + b, a)), why: b > 0 ? `오른쪽에 ${b}를 더해 버렸어. 왼쪽의 + ${b}를 없애려면 저울 양쪽에서 똑같이 ${b}를 빼야 해.`
          : `오른쪽에서 ${-b}를 빼 버렸어. 왼쪽의 − ${-b}를 없애려면 저울 양쪽에 똑같이 ${-b}를 더해야 해.` },
        { v: X(N(c - b)), why: `${a}x = ${N(c - b)}까지 맞아! ${a}x는 x가 ${a}개라는 뜻이라 양쪽을 ${a}로 나눠야 해.` },
        { v: X(N((c - b) * a)), why: `${a}x = ${N(c - b)}에서 ${a}로 나눠야 하는데 곱했구나. ×${a}를 없애는 건 ÷${a}야.` },
      ], `저울처럼 양쪽에 똑같이 해. ${b > 0 ? `양쪽에서 ${b}를 빼면` : `양쪽에 ${-b}를 더하면`} ${a}x = ${N(c - b)}. 양쪽을 ${a}로 나누면 x = ${N(x)}. 확인: ${a} × ${P(x)} ${b < 0 ? MI : '+'} ${Math.abs(b)} = ${C} ✓`, {
        q: st ? `상자 x개에 몬스터볼이 ${a}개씩 들었고, 낱개가 ${b}개 더 있어. 모두 ${C}개일 때 x는?` : `방정식 ${lhs} = ${C}에서 x는 얼마일까?`,
        /* 'x = 4x' 처럼 정답 글(x = 4)이 help 속에 생기지 않게 쓴다 (2026-10-24 표본 검사) */
        help: st ? `📖 상자 x개에 ${a}개씩 = ${a}x (${a} × x). 저울 그림처럼 식으로 쓰면 ${lhs} = ${C}`
          : `📖 방정식 = 모르는 수 x가 든 '같다(=)' 식. □x = □ × x${b < 0 || c < 0 || x < 0 ? '. −□ = 0보다 □ 작은 수' : ''}`,
        pic: { type: 'balance', L: lhs, R: C },
        need, more: [{ v: X(fr(c - a * b, a)), why: `양쪽을 ${a}로 나눌 땐 ${N(b)}도 함께 나눠야 하는데 빠뜨렸어. 빼기를 먼저 하면 쉬워.` }],
        gen: () => { const v = nz(-9, 9); return { v: X(N(v)), why: `x = ${N(v)}를 넣어 보면 ${a} × ${P(v)} + ${P(b)} = ${N(a * v + b)}라서 ${C}가 안 돼.` }; },
        steps: [s1, `양쪽 ÷ ${a}: ${N(c - b)} ÷ ${a} = ${N(x)}`, `x = ${N(x)}`, `확인: ${a} × ${P(x)} ${b < 0 ? MI : '+'} ${Math.abs(b)} = ${C}`],
        viz: { type: 'balance', L: lhs, R: C, steps: [{ L: `${a}x`, R: N(c - b), say: b > 0 ? `양쪽에서 ${b}씩 빼요` : `양쪽에 ${-b}씩 더해요` }, { L: 'x', R: N(x), say: fj(`양쪽을 ${a}로 나눠요`) }] } });
    }),

  skill('m_stats', 7, '평균·중앙값·최빈값', '평균 = 모두 더해 개수로 나눈 값, 중앙값 = 작은 순서로 줄 세운 가운데 값, 최빈값 = 가장 많이 나온 값.',
    '반 친구 30명의 키를 하나하나 말하긴 힘들어. 그래서 여러 수를 대표하는 수 하나로 줄여 말하는 방법을 만들었어.', (st, need) => {
      const kind = pick(['median', 'mean', 'mode']);
      let vals;
      if (kind === 'median') {
        do { vals = shuffle(Array.from({ length: 20 }, (_, i) => i + 1)).slice(0, 5); } while (vals[2] === [...vals].sort((p, q) => p - q)[2]);
      } else if (kind === 'mean') {
        const m = rand(5, 12); let ds;
        do { ds = [0, 0, 0, 0].map(() => rand(-4, 4)); ds.push(-ds.reduce((s, v) => s + v, 0)); } while (Math.abs(ds[4]) > 6 || new Set(ds).size < 4 || ds.some((d) => m + d < 1));
        vals = ds.map((d) => m + d);
      } else {
        const v = rand(2, 9), cnt = rand(2, 3), others = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].filter((u) => u !== v)).slice(0, 5 - cnt);
        vals = shuffle([...Array(cnt).fill(v), ...others]);
      }
      const sorted = [...vals].sort((p, q) => p - q), sum = vals.reduce((s, v) => s + v, 0);
      const med = sorted[2], mean = sum / 5, list = vals.join(', ');
      const what = { median: '중앙값', mean: '평균', mode: '최빈값' }[kind];
      const q = st ? `피카츄 5마리의 레벨이 ${list}야. 레벨의 ${what}은 얼마일까?` : `다섯 수 ${list}의 ${what}은 얼마일까?`;
      const help = { median: '📖 중앙값 = 작은 수부터 줄 세웠을 때 한가운데 있는 수', mean: '📖 평균 = 모두 더한 뒤 개수로 똑같이 나눈 값', mode: '📖 최빈값 = 가장 여러 번 나온 수' }[kind];
      const ORD = ['첫째', '둘째', '셋째', '넷째', '다섯째']; // 막대 이름에 숫자를 쓰지 않는다 (답과 헷갈리지 않게)
      const pic = { type: 'chart', bars: vals.map((v, i) => ({ l: st ? `${ORD[i]} 피카츄` : ORD[i], v })) };
      if (kind === 'median') {
        return Q(med, [
          { v: vals[2], why: `적힌 순서 그대로 가운데 수 ${vals[2]}를 골랐어. 먼저 작은 수부터 줄 세운 뒤 가운데를 골라야 해.` },
          Number.isInteger(mean) ? { v: mean, why: `그건 평균이야. 중앙값은 계산 없이 줄 세운 가운데 수란다.` } : null,
          (sorted[0] + sorted[4]) % 2 === 0 ? { v: (sorted[0] + sorted[4]) / 2, why: `가장 작은 수와 가장 큰 수의 가운데 값을 계산했어. 중앙값은 5개를 줄 세운 3번째 수야.` } : null,
        ], `먼저 작은 수부터 줄 세우면 ${sorted.join(', ')}. 5개 중 한가운데(3번째)는 ${med}! 양쪽에 2개씩 남는 자리야.`, {
          q, help, need, pic,
          more: [{ v: sorted[1], why: `줄 세우기는 잘했는데 2번째 수를 골랐어. 5개면 양쪽에 2개씩 남는 3번째가 가운데야.` }, { v: sorted[3], why: `줄 세우기는 잘했는데 4번째 수를 골랐어. 5개면 앞에서 3번째가 가운데야.` },
            { v: sorted[4], why: `가장 큰 수를 골랐어. 중앙값은 줄 세웠을 때 한가운데 있는 수야.` },
            { v: sorted[0], why: `가장 작은 수를 골랐어. 중앙값은 양쪽에 같은 개수가 남는 가운데 수야.` }],
          steps: ['작은 수부터 줄 세우기', sorted.join(', '), '5개의 가운데 = 3번째', `중앙값: ${med}`],
          viz: { type: 'chart', bars: sorted.map((v, i) => ({ l: i === 2 ? '가운데' : `${i + 1}번째`, v, ...(i === 2 ? { c: 'a' } : {}) })) } });
      }
      if (kind === 'mean') {
        return Q(mean, [
          { v: sum, why: `합 ${sum}까지는 맞아! 평균은 그 합을 개수 5로 똑같이 나눠야 해.` },
          med !== mean ? { v: med, why: `그건 중앙값(줄 세운 가운데 수)이야. 평균은 모두 더해 5로 나눈 값이란다.` } : null,
          sum % 4 === 0 ? { v: sum / 4, why: `수는 5개인데 4로 나눴어. 개수를 손가락으로 다시 세어 보자.` } : { v: sum % 6 === 0 ? sum / 6 : null, why: `수는 5개인데 6으로 나눴어. 개수를 다시 세어 보자.` },
        ], `모두 더하면 ${vals.join(' + ')} = ${sum}. 5개로 똑같이 나누면 ${sum} ÷ 5 = ${mean}. 높은 막대를 깎아 낮은 막대를 채운 높이야.`, {
          q, help, need, pic,
          more: [{ v: sorted[4], why: `가장 큰 수를 골랐어. 평균은 모두를 똑같이 나눈 값이라 가장 큰 수보다 작아.` },
            { v: vals[2], why: `적힌 순서의 가운데 수를 골랐어. 평균은 다섯 수를 모두 더해 5로 나눠야 해.` },
            (sorted[0] + sorted[4]) % 2 === 0 ? { v: (sorted[0] + sorted[4]) / 2, why: `가장 작은 수와 가장 큰 수만 더해 2로 나눴어. 가운데 세 수도 모두 더해야 해.` } : null],
          steps: [`모두 더하기: ${vals.join(' + ')} = ${sum}`, '개수: 5개', `${sum} ÷ 5 = ${mean}`],
          viz: { ...pic, line: mean, lineLabel: `평균 ${mean}` } });
      }
      const counts = {}; vals.forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
      const mode = Number(Object.keys(counts).find((k) => counts[k] > 1)), cnt = counts[mode];
      const keys = Object.keys(counts).map(Number).sort((p, q) => p - q);
      return Q(mode, [
        { v: cnt, why: `${mode}가 나온 횟수 ${cnt}번을 답했어. 최빈값은 횟수가 아니라 가장 많이 나온 수 자체야.` },
        { v: sorted[4], why: `가장 큰 수를 골랐어. 최빈값은 크기가 아니라 몇 번 나왔는지로 정해.` },
        { v: med, why: `그건 중앙값(줄 세운 가운데 수)이야. 최빈값은 같은 수가 가장 많이 나온 것을 찾아.` },
      ], `수마다 몇 번 나왔는지 세면 ${keys.map((k) => `${k}: ${counts[k]}번`).join(', ')}. ${mode}가 ${cnt}번으로 가장 많아서 최빈값은 ${mode}!`, {
        q, help, need, pic, more: [{ v: sorted[0], why: `가장 작은 수를 골랐어. 최빈값은 가장 자주 나온 수야.` },
          { v: mode * cnt, why: `${mode}에 횟수 ${cnt}를 곱했어. 최빈값은 계산하지 않고 가장 많이 나온 수를 그대로 써.` },
          Number.isInteger(mean) ? { v: mean, why: `그건 평균이야. 최빈값은 가장 여러 번 나온 수를 찾는 거란다.` } : null],
        steps: ['수마다 나온 횟수 세기', `${mode}: ${cnt}번 (가장 많음)`, `최빈값: ${mode}`],
        viz: { type: 'table', head: ['수', '나온 횟수'], rows: keys.map((k) => [String(k), `${counts[k]}번`]), hi: keys.indexOf(mode) } });
    }),

  /* ───────── 중2 ───────── */
  skill('m_power', 8, '지수법칙', '2⁵는 2를 5번 곱한 것(위 작은 수 = 지수 = 곱한 횟수). 2³ × 2² = (2 × 2 × 2) × (2 × 2)라서 2가 5개 → 2⁵. 그래서 곱하면 지수끼리 더하고, 나누면 지워져서 빼.',
    '세포가 2배씩 늘거나 소문이 퍼지는 것처럼 같은 수를 여러 번 곱할 일이 많아. 그래서 짧게 쓰는 거듭제곱을 만들었어.', (st, need) => {
      const kind = st ? 'val' : pick(['val', 'mul', 'pow', 'div']);
      if (kind === 'val') {
        let a, n; do { a = rand(2, 5); n = rand(2, 4); } while (a ** n > 256 || (a === 2 && n === 2));
        const v = a ** n;
        const later = Array.from({ length: n - 1 }, (_, i) => [`${i + 2}초 뒤`, '?']);
        return Q(v, [
          { v: a * n, why: st ? `${a} × ${n}을(를) 했구나. ${a}배가 ${n}번 겹치니까 ${a}를 ${n}번 곱해야 해: ${chain(a, n)}.`
            : `${a} × ${n}을(를) 했구나. ${a}${sup(n)}은 ${a}를 ${n}번 곱하는 거야: ${chain(a, n)}.` },
          { v: n ** a, why: st ? `${n}을(를) ${a}번 곱했구나. 거꾸로야. ${a}배가 ${n}번이라 ${chain(a, n)}이야.`
            : `${n}${sup(a)}처럼 두 수 자리를 바꿨어. ${a}를 ${n}번 곱해야 해서 ${chain(a, n)}이야.` },
          { v: a ** (n - 1), why: `${a}를 ${n - 1}번만 곱했어. ${chain(a, n)}처럼 ${a}가 ${n}개 있어야 해.` },
        ], st ? `1초마다 ${a}배씩, ${n}초면 ${a}를 ${n}번 곱해: ${chain(a, n)} = ${v}배. 곱할 때마다 ${a}배씩 커져.`
          : `${a}${sup(n)}은 ${a}를 ${n}번 곱하라는 뜻이야. ${chain(a, n)} = ${v}. 곱할 때마다 ${a}배씩 커져.`, {
          q: st ? `피카츄의 전기가 1초마다 ${a}배가 돼. ${n}초 뒤엔 처음의 몇 배일까?` : `${a}${sup(n)}의 값은 얼마일까?`,
          unit: st ? '배' : '', need,
          help: st ? `📖 1초 뒤 ${a}배, 2초 뒤엔 그것의 또 ${a}배가 돼.` : '📖 위에 작게 쓴 수(지수) = 곱하는 횟수. 예: 10² = 10 × 10 = 100',
          ...(st ? { pic: { type: 'table', head: ['시간', '처음의 몇 배'], rows: [['처음', '1배'], ['1초 뒤', `${a}배`], ...later] } } : {}),
          more: [{ v: a + n, why: st ? `두 수를 더했어. ${a}배가 ${n}번 겹치면 ${a}를 ${n}번 곱해야 해.` : `두 수를 더했어. ${a}${sup(n)}은 ${a}를 ${n}번 곱하는 거야.` },
            { v: a ** (n + 1), why: st ? `${a}를 한 번 더 곱했어. ${n}초면 딱 ${n}번만 곱해.` : `${a}를 한 번 더 곱했어. 곱하는 횟수는 위의 작은 수 ${n}과 같아.` }],
          steps: [...run(a, n), `답: ${v}`],
          viz: { type: 'table', head: ['곱한 횟수', '값'], rows: Array.from({ length: n }, (_, i) => [`${i + 1}번`, String(a ** (i + 1))]), hi: n - 1 } });
      }
      const a = rand(2, 5);
      const pw = (b, e) => `${b}${sup(e)}`;
      const cntH = fj(`곱한 ${a}의 개수`);
      if (kind === 'mul') {
        const m = rand(2, 6), n = rand(2, 5);
        return Q(pw(a, m + n), [
          { v: pw(a, m * n), why: `위 작은 수끼리 곱했어. ${a}가 ${m}개, 또 ${n}개 있으면 모두 ${m} + ${n}개라 더해야 해.` },
          { v: pw(a * a, m + n), why: `아래 수 ${a}끼리도 곱했어. ${a}는 그대로 두고 위 작은 수(곱한 횟수)만 더해.` },
          { v: pw(a * a, m * n), why: `아래 수도 곱하고 위 작은 수도 곱했어. 같은 수의 곱셈은 아래 수 그대로, 위 작은 수는 더하기야.` },
        ], `${pw(a, m)}은 ${a}를 ${m}번(${chain(a, m)}), ${pw(a, n)}은 ${a}를 ${n}번(${chain(a, n)}) 곱한 거야. 이어서 곱하면 ${a}가 모두 ${m} + ${n} = ${m + n}개 → ${pw(a, m + n)}!`, {
          q: `${pw(a, m)} × ${pw(a, n)}을 ${a}의 거듭제곱 하나로 나타내면?`, need,
          help: `📖 ${pw(a, m)} = ${a}를 ${m}번 곱한 것. 위 작은 수(지수) = 곱한 횟수. 이렇게 쓴 꼴이 거듭제곱`,
          gen: () => { const e = rand(2, 30); return { v: pw(a, e), why: `${pw(a, e)}이 되려면 ${a}를 ${e}번 곱해야 해. ${a}가 모두 몇 개인지 다시 세어 보자.` }; },
          steps: [`${pw(a, m)} = ${chain(a, m)} → ${a}가 ${m}개`, `${pw(a, n)} = ${chain(a, n)} → ${a}가 ${n}개`, `모두 ${m} + ${n} = ${m + n}개`, `답: ${pw(a, m + n)}`],
          viz: { type: 'table', head: ['', '풀어 쓰면', cntH], rows: [[pw(a, m), chain(a, m), `${m}개`], [pw(a, n), chain(a, n), `${n}개`], ['합치면', '', `${m + n}개`]], hi: 2 } });
      }
      if (kind === 'pow') {
        let m, n; do { m = rand(2, 4); n = rand(2, 4); } while ((a * n) ** m === a ** (m * n));
        return Q(pw(a, m * n), [
          { v: pw(a, m + n), why: `위 작은 수끼리 더했어. ${pw(a, m)}을 ${n}번 곱하면 ${a}가 ${m}개씩 ${n}묶음, ${m} × ${n}개야.` },
          { v: pw(a * n, m), why: `아래 수에 ${n}을(를) 곱했어. 바깥 작은 수 ${n}은 '${pw(a, m)}을 ${n}번 곱해'라는 뜻이야.` },
          { v: pw(a, m ** n), why: `위 작은 수를 또 거듭제곱(${m}${sup(n)})했어. ${m}개씩 ${n}묶음이라 ${m} × ${n}만 하면 돼.` },
        ], `(${pw(a, m)})${sup(n)} = ${Array(n).fill(pw(a, m)).join(' × ')}. ${a}가 ${m}개씩 ${n}묶음이니 모두 ${m} × ${n} = ${m * n}개 → ${pw(a, m * n)}!`, {
          q: `(${pw(a, m)})${sup(n)}을 ${a}의 거듭제곱 하나로 나타내면?`, need,
          help: `📖 ${pw(a, m)} = ${a}를 ${m}번 곱한 것. 위 작은 수(지수) = 곱한 횟수. (${pw(a, m)})${sup(n)} = 괄호 속 ${pw(a, m)}을 ${n}번 곱한 것`,
          gen: () => { const e = rand(2, 20); return { v: pw(a, e), why: `${pw(a, e)}이 되려면 ${a}가 ${e}개여야 해. ${m}개씩 ${n}묶음을 다시 세어 보자.` }; },
          steps: [`${pw(a, m)}을 ${n}번 곱하기`, `${a}가 ${m}개씩 ${n}묶음`, `${m} × ${n} = ${m * n}개`, `답: ${pw(a, m * n)}`],
          viz: { type: 'table', head: ['', cntH], rows: [...Array.from({ length: n }, (_, i) => [`${i + 1}번째 ${pw(a, m)}`, `${m}개`]), ['모두', `${m} × ${n} = ${m * n}개`]], hi: n } });
      }
      const n = rand(2, 4), m = n * rand(2, 3);
      return Q(pw(a, m - n), [
        { v: pw(a, m / n), why: `위 작은 수끼리 나눴어. ${a}가 ${m}개 중 ${n}개가 지워지니 ${m} − ${n}, 빼기야.` },
        { v: pw(a, m + n), why: `나눗셈인데 위 작은 수를 더했어. 나누면 개수가 줄어서 빼야 해.` },
        { v: pw(1, m - n), why: `${a} ÷ ${a} = 1로 아래 수를 1로 만들었어. ${a}는 그대로 두고 위 작은 수만 빼.` },
      ], `${pw(a, m)} ÷ ${pw(a, n)}을 분수로 쓰면 위에 ${a}가 ${m}개, 아래에 ${n}개야. ${a} ÷ ${a} = 1이라 위아래 ${a} 한 쌍씩 지워져. ${n}쌍을 지우면 위에 ${m} − ${n} = ${m - n}개가 남아 → ${pw(a, m - n)}!`, {
        q: `${pw(a, m)} ÷ ${pw(a, n)}을 ${a}의 거듭제곱 하나로 나타내면?`, need,
        help: `📖 ${pw(a, m)} = ${a}를 ${m}번 곱한 것. 위 작은 수(지수) = 곱한 횟수. 이렇게 쓴 꼴이 거듭제곱`,
        gen: () => { const e = rand(1, 12); return { v: pw(a, e), why: `${pw(a, e)}이 되려면 ${a}가 ${e}개 남아야 해. 지운 개수를 다시 세어 보자.` }; },
        steps: [`위: ${a}가 ${m}개, 아래: ${a}가 ${n}개`, `${a} ÷ ${a} = 1 → 위아래 한 쌍씩 지워져`, `${n}쌍 지우기: ${m} − ${n} = ${m - n}`, `답: ${pw(a, m - n)}`],
        viz: { type: 'table', head: ['', cntH], rows: [[`위 ${pw(a, m)}`, `${m}개`], [`아래 ${pw(a, n)}`, `${n}개`], ['남은 것', `${m} − ${n} = ${m - n}개`]], hi: 2 } });
    }),

  skill('m_expand', 8, '다항식의 곱셈(전개)', '(x + 2)(x + 3)은 가로 x + 3, 세로 x + 2인 네모 넓이야. 네 조각 x × x, x × 3, 2 × x, 2 × 3을 더하면 x² + 5x + 6. 그래서 괄호 속을 하나씩 모두 곱해 더해.',
    '괄호끼리 곱하는 계산을 빠짐없이 하려고 전개 규칙을 정리했어. 넓이 계산과 방정식 풀이의 밑바탕이 돼.', (st, need) => {
      const kind = st ? 'prod' : pick(['sq', 'prod']);
      if (kind === 'sq') {
        const a = nz(-6, 6), ans = quad(1, 2 * a, a * a);
        return Q(ans, [
          { v: quad(1, 0, a * a), why: `가운데 칸 ${mono(a, 1)} 두 개를 빠뜨렸어. (${xs(a)})²은 ${J(`(${xs(a)}) × (${xs(a)})`, '이라', '라')} 엇갈린 곱도 있어.` },
          { v: quad(1, a, a * a), why: `가운데 칸을 한 번만 셌어. x × ${J(P(a), '과', '와')} ${P(a)} × x, 두 칸이라 ${ya(mono(2 * a, 1))}.` },
          { v: quad(1, 2 * a, 2 * a), why: `마지막 칸을 ${P(a)} × 2로 계산했어. ${P(a)}²은 ${P(a)} × ${P(a)} = ${a * a}야.` },
        ], a > 0
          /* 넓이 이유부터 (강의 3·9장): (x + a)² = 한 변이 x + a인 정사각형 넓이 = 네 조각 (2026-10-24 2차 점검 G11) */
          ? `(${xs(a)})²은 한 변이 x + ${a}인 정사각형 넓이야. 네 조각: x × x = x², x × ${a} = ${mono(a, 1)}, ${a} × x = ${mono(a, 1)}, ${a} × ${a} = ${a * a}. ${mono(a, 1)} + ${mono(a, 1)} = ${mono(2 * a, 1)}로 모아 ${ans}.`
          /* 글 130자 안쪽으로: (x − a)² = (x − a) × (x − a) 는 help(□² = □ × □)와 문제 그림(네 칸 표)이 보여 준다 (검증 2026-10-24) */
          : `(${xs(a)})²의 네 칸: x², ${mono(a, 1)}, ${mono(a, 1)}, ${a * a}. ${J(`(${N(a)}) × (${N(a)})`, '이', '가')} +인 까닭: ${negNeg(-a)}. 모으면 ${ans}.`, {
          q: `(${xs(a)})²을 괄호 없이 풀어 쓰면(전개하면)?`, need,
          help: `📖 x = 아직 모르는 수. □² = □ × □, □x = □ × x. 전개 = 괄호 없이 풀어 쓰기${a < 0 ? '. −□ = 0보다 작은 수' : ''}`,
          pic: a > 0 ? areaPic(a, a, [['?', '?'], ['?', '?']], true) : boxT(['x', N(a)], ['x', N(a)], [['?', '?'], ['?', '?']]),
          /* a = 2 이면 '마지막 칸을 a × 2로' 실수가 정답(2 × 2 = 4)과 같아 무작위 보기가 들어갔다 → '마지막 칸을 곱하지 않고 a 그대로' 실수로 (검증 2026-10-24) */
          more: a < 0 ? [{ v: quad(1, 2 * a, -a * a), why: `(${N(a)})²을 ${N(-a * a)}로 계산했어. 음수 × 음수 = 양수라서 +${a * a}야.` }]
            : [{ v: quad(1, 2 * a, a), why: `마지막 칸 ${a} × ${a}를 곱하지 않고 ${a}만 썼어. 정사각형 넓이 조각이라 ${a} × ${a} = ${a * a}야.` }],
          gen: () => { const b = rand(1, 12) * sgn(), c = rand(1, 36); return { v: quad(1, b, c), why: `${J(`네 칸 (x², ${mono(a, 1)}, ${mono(a, 1)}, ${a * a})`, '을', '를')} 하나씩 다시 곱해 보면 이 식이 나오지 않아.` }; },
          /* 한 줄 = 계산 하나 (5-1 규칙 7) */
          steps: ['x × x = x²', `x × ${P(a)} = ${mono(a, 1)}`, `${P(a)} × x = ${mono(a, 1)}`, `${P(a)} × ${P(a)} = ${a * a}${a < 0 ? ' (음수 × 음수 = +)' : ''}`,
            `모으기: ${mono(a, 1)} ${a < 0 ? MI : '+'} ${mono(Math.abs(a), 1)} = ${mono(2 * a, 1)} → ${ans}`],
          viz: a > 0 ? areaPic(a, a, [['x²', mono(a, 1)], [mono(a, 1), String(a * a)]]) : boxT(['x', N(a)], ['x', N(a)], [['x²', mono(a, 1)], [mono(a, 1), String(a * a)]]) });
      }
      let a, b;
      if (st) { a = rand(1, 6); do { b = rand(1, 6); } while (b === a); }
      else { do { a = nz(-6, 6); b = nz(-6, 6); } while (a === b || a + b === 0); }
      const ans = quad(1, a + b, a * b), ex = `(${xs(a)})(${xs(b)})`;
      const sign2 = a < 0 && b < 0 ? ' (음수 × 음수 = +)' : a < 0 || b < 0 ? ' (빚이 여러 번 → −)' : '';
      const gather = `모으기: ${mono(b, 1)} ${a < 0 ? MI : '+'} ${mono(Math.abs(a), 1)} = ${mono(a + b, 1)} → ${ans}`;
      /* 이야기판(포스터)은 넓이 그림: 가로 x + a, 세로 x + b 를 네 칸으로 나눈다 (전개 = 네 칸 넓이의 합).
       * 계산판도 두 수가 다 +면 넓이 그림(가로 x + b, 세로 x + a). −가 섞이면 길이로 못 그려서 표 + 음수 곱하기 이유 (2026-10-24 2차 점검 G11) */
      const pos = a > 0 && b > 0, ab = a * b;
      const cellsQ = [['?', '?'], ['?', '?']], cellsA = [['x²', mono(a, 1)], [mono(b, 1), String(ab)]], cellsB = [['x²', mono(b, 1)], [mono(a, 1), String(ab)]];
      const negV = a < 0 ? a : b, posV = a < 0 ? b : a;
      const whyCalc = pos
        ? `${J(ex, '은', '는')} 가로 x + ${b}, 세로 x + ${a}인 네모 넓이야. 네 조각: x × x = x², x × ${b} = ${mono(b, 1)}, ${a} × x = ${mono(a, 1)}, ${a} × ${b} = ${ab}. ${mono(b, 1)} + ${mono(a, 1)} = ${mono(a + b, 1)}로 모아 ${ans}.`
        : `넓이 네 조각처럼 표의 네 칸을 곱해: x², ${mono(b, 1)}, ${mono(a, 1)}, ${N(ab)}.${a < 0 && b < 0 ? ` 음수 × 음수가 +인 까닭: ${negNeg(-a)}.` : ` ${P(negV)} × ${posV}는 빚 ${-negV}이 ${posV}번이라 ${N(ab)}.`} x끼리 모아 ${ans}.`;
      return Q(ans, [
        { v: quad(1, 0, a * b), why: `x끼리, 수끼리만 곱했어. 엇갈린 칸 x × ${J(P(b), '과', '와')} ${P(a)} × x도 곱해서 가운데 ${mono(a + b, 1)}까지 써야 해.` },
        { v: quad(1, a * b, a + b), why: `x 앞의 수와 마지막 수 자리를 바꿨어. x 앞에는 모은 값 ${N(a + b)}, 마지막엔 곱한 값 ${N(a * b)}가 와.` },
        { v: quad(1, a + b, -a * b), why: a < 0 && b < 0 ? `마지막 수의 +, −를 틀렸어. ${J(`${P(a)} × ${P(b)}`, '은', '는')} 음수 × 음수라 +${a * b}야.` : `마지막 수의 +, −를 틀렸어. ${P(a)} × ${P(b)} = ${N(a * b)}야.` },
      ], st ? `넓이 = 가로 × 세로야. 포스터를 가로 x와 ${a}, 세로 x와 ${b}로 나누면 네 칸: x × x = x², x × ${a} = ${mono(a, 1)}, ${b} × x = ${mono(b, 1)}, ${a} × ${b} = ${ab}. x끼리 모으면 ${ans}.`
        : whyCalc, {
        q: st ? `가로가 x + ${a}, 세로가 x + ${b}인 피카츄 포스터가 있어. 넓이를 괄호 없이 풀어 쓰면(전개하면)?` : `${J(ex, '을', '를')} 괄호 없이 풀어 쓰면(전개하면)?`, need,
        /* 보기마다 있는 x²·□x 를 푼다. 정답의 x 앞 수(예: 7x)를 쓰면 답이 새므로 □ 로 (2026-10-24 2차 점검 G11) */
        help: st ? '📖 x = 아직 모르는 길이. 넓이 = 가로 × 세로. x² = x × x, □x = □ × x. 전개 = 괄호 없이 풀어 쓰기'
          : `📖 x = 아직 모르는 수. x² = x × x, □x = □ × x. 전개 = 괄호 없이 풀어 쓰기${a < 0 || b < 0 ? '. −□ = 0보다 작은 수' : ''}`,
        pic: st ? areaPic(a, b, cellsQ, true) : pos ? areaPic(b, a, cellsQ, true) : boxT(['x', N(b)], ['x', N(a)], [['?', '?'], ['?', '?']]),
        more: [{ v: quad(1, a + b, a + b), why: `마지막 수에도 더한 값을 썼어. 마지막 칸은 ${P(a)} × ${P(b)}, 곱한 값 ${N(a * b)}야.` }],
        gen: () => { const u = rand(1, 12) * sgn(), w = rand(1, 36) * sgn(); return { v: quad(1, u, w), why: `네 칸을 하나씩 다시 곱해 보자. x × x, x × ${P(b)}, ${P(a)} × x, ${P(a)} × ${P(b)} 차례로!` }; },
        /* 한 줄 = 계산 하나 (5-1 규칙 7) */
        steps: st ? ['x × x = x²', `x × ${a} = ${mono(a, 1)}`, `${b} × x = ${mono(b, 1)}`, `${a} × ${b} = ${ab}`, `모으기: ${mono(a, 1)} + ${mono(b, 1)} = ${mono(a + b, 1)} → ${ans}`]
          : ['x × x = x²', `x × ${P(b)} = ${mono(b, 1)}`, `${P(a)} × x = ${mono(a, 1)}`, `${P(a)} × ${P(b)} = ${N(ab)}${sign2}`, gather],
        viz: st ? areaPic(a, b, cellsA) : pos ? areaPic(b, a, cellsB) : boxT(['x', N(b)], ['x', N(a)], [['x²', mono(b, 1)], [mono(a, 1), N(ab)]]) });
    }),

  skill('m_slope', 8, '일차함수의 기울기', '기울기 = 옆으로 1칸 갈 때 위로 몇 칸 가는지. (위로 간 칸 수) ÷ (옆으로 간 칸 수)로 구해.',
    '"1초에 몇 m", "1시간에 몇 km"처럼 얼마나 빨리 변하는지 비교하려고 기울기를 써. 비탈길이 가파른 정도도 기울기야.', (st, need) => {
      if (st) {
        const v = rand(2, 6), c = rand(1, 5), t1 = rand(1, 3), t2 = t1 + rand(2, 4), s1 = v * t1 + c, s2 = v * t2 + c;
        const base = { type: 'plot', x: [0, t2 + 1], y: [0, s2 + 3], xl: '시간(초)', yl: '위치(m)' };
        const pts = [{ x: t1, y: s1, label: `${t1}초: ${s1}m`, lx: -10 }, { x: t2, y: s2, label: `${t2}초: ${s2}m`, lx: -10 }];
        return Q(v, [
          { v: fr(t2 - t1, s2 - s1), why: `시간 ÷ 거리로 거꾸로 나눴어. 1초에 가는 거리는 (간 거리) ÷ (걸린 시간)이야.` },
          { v: fr(s2, t2), why: `${s2} ÷ ${t2}를 했구나. 출발한 자리가 0m가 아니라서 '늘어난 거리'끼리 나눠야 해.` },
          { v: s2 - s1, why: `간 거리 ${s2 - s1}m까지는 맞아! 그건 ${t2 - t1}초 동안 간 거리라 ${t2 - t1}로 나눠야 해.` },
        ], `${t1}초에서 ${t2}초까지 ${t2 - t1}초 동안 ${s1}m에서 ${s2}m로 ${s2 - s1}m 갔어. 1초에는 ${s2 - s1} ÷ ${t2 - t1} = ${v}m씩! 이 값이 그래프의 기울기야.`, {
          q: `피카츄가 ${t1}초에 ${s1}m, ${t2}초에 ${s2}m 지점에 있었어. 1초에 몇 m씩 달렸을까?`, unit: 'm', need, gen: fracGen,
          help: '📖 똑같은 빠르기로 달렸다면, 1초에 간 거리 = 간 거리 ÷ 걸린 시간',
          pic: { ...base, pts, anim: false },
          steps: [`걸린 시간: ${t2} − ${t1} = ${t2 - t1}초`, `간 거리: ${s2} − ${s1} = ${s2 - s1}m`, `1초에: ${s2 - s1} ÷ ${t2 - t1} = ${v}m`],
          viz: { ...base, fns: [{ f: `${v}*x+${c}`, label: `기울기 ${v}`, lx: rd(t1 / 2 + 0.3) }], pts,
            segs: [{ x1: t1, y1: s1, x2: t2, y2: s1, dash: true, c: 'b', label: `${t2 - t1}초`, ly: 14 }, { x1: t2, y1: s1, x2: t2, y2: s2, dash: true, c: 'b', label: `${s2 - s1}m`, lx: 28 }] } });
      }
      let x1, x2, y1, y2, dx, dy;
      do { x1 = rand(-3, 3); dx = rand(1, 4); x2 = x1 + dx; y1 = rand(-5, 5); dy = nz(-8, 8); y2 = y1 + dy; } while (x2 === 0 || Math.abs(dx) === Math.abs(dy));
      const ans = fr(dy, dx);
      const p1 = `(${N(x1)}, ${N(y1)})`, p2 = `(${N(x2)}, ${N(y2)})`;
      const base = { type: 'plot', x: [Math.min(x1, 0) - 1, Math.max(x2, 0) + 1], y: [Math.min(y1, y2, 0) - 1, Math.max(y1, y2, 0) + 1] };
      const pts = [{ x: x1, y: y1, label: p1 }, { x: x2, y: y2, label: p2 }];
      return Q(ans, [
        { v: fr(dx, dy), why: `옆으로 ÷ 위로, 거꾸로 나눴어. 기울기는 (위로 간 칸) ÷ (옆으로 간 칸)이야.` },
        { v: fr(-dy, dx), why: `오르는지 내려가는지 헷갈렸어. 왼쪽 점에서 오른쪽 점으로 가면 ${dy < 0 ? `${-dy}칸 내려가니까 −` : `${dy}칸 올라가니까 +`}야.` },
        { v: fr(y2, x2), why: `점 하나의 세로 ÷ 가로를 했어. 두 점 사이에서 '늘어난 만큼'끼리 나눠야 해.` },
      ], `왼쪽 점에서 오른쪽 점까지 칸을 세어 봐. 옆으로 ${N(x1)} → ${N(x2)}, ${dx}칸 가는 동안 세로는 ${N(y1)} → ${N(y2)}, ${Math.abs(dy)}칸 ${dy < 0 ? '내려갔어(내려가면 −)' : '올라갔어'}. 기울기 = ${N(dy)} ÷ ${dx} = ${ans}.`, {
        q: `직선이 두 점 ${J(p1, '과', '와')} ${J(p2, '을', '를')} 지나. 이 직선의 기울기는?`, need,
        help: `📖 (가로, 세로) = 점의 자리. 기울기 = 옆으로 1칸 갈 때 위로 가는 칸 수(내려가면 −)${[x1, y1, x2, y2].some((v) => v < 0) ? '. −□ = 0보다 왼쪽·아래' : ''}`,
        pic: { ...base, pts, anim: false },
        more: [{ v: N(dy), why: dy < 0 ? `${-dy}칸 내려간 것(${N(dy)})까지는 맞아! 옆으로 ${dx}칸 동안이라 ${dx}로 나눠야 해.` : `위로 간 ${dy}칸까지는 맞아! 옆으로 ${dx}칸 동안이라 ${dx}로 나눠야 해.` }], gen: fracGen,
        /* 음수 빼기(3 − (−2)) 대신 칸 세기로 (2026-10-24 점검: 음수 빼기를 풀이 없이 쓰지 않는다) */
        steps: [`옆으로 칸 세기: ${N(x1)} → ${N(x2)}, ${dx}칸`, `세로 칸 세기: ${N(y1)} → ${N(y2)}, ${Math.abs(dy)}칸 ${dy < 0 ? '내려감 → −' : '올라감 → +'}${Math.abs(dy)}`, `기울기: ${N(dy)} ÷ ${dx} = ${ans}`],
        viz: { ...base, fns: [{ f: `(${dy})*(x-(${x1}))/${dx}+(${y1})`, label: `기울기 ${ans}`, lx: rd(x1 + dx / 2) }], pts,
          segs: [{ x1, y1, x2, y2: y1, dash: true, c: 'b', label: `옆으로 ${dx}`, ly: dy > 0 ? 14 : -12 }, { x1: x2, y1, x2, y2, dash: true, c: 'b', label: dy < 0 ? `아래로 ${-dy}` : `위로 ${dy}`, lx: 40 }] } }); // '위로 −3' 대신 '아래로 3' (2026-10-24 검증)
    }),

  skill('m_prob', 8, '확률', '확률 = (원하는 경우의 수) ÷ (모든 경우의 수). 모든 경우가 똑같이 잘 일어날 때 쓸 수 있어.',
    '약 370년 전 파스칼과 페르마는 \'놀이를 중간에 멈추면 상을 어떻게 나눌까?\'를 편지로 풀다 확률을 만들었어.', (st, need) => {
      const kind = st ? 'bag' : pick(['bag', 'dice', 'coins', 'dice2']);
      /* 약분은 이유부터: d개를 g개씩 묶으면 d/g묶음, 그중 n/g묶음 (2026-10-24 3차 검토: 6/8 = 3/4 를 건너뛰던 것) */
      const grp = (n, d, unit) => { const g = gcd(n, d); return g > 1 ? { why: ` ${d}${unit}를 ${g}${unit}씩 묶으면 ${d / g}묶음, 그중 ${n / g}묶음이라 ${n}/${d} = ${fr(n, d)}.`, step: `${g}${unit}씩 묶기: ${d / g}묶음 중 ${n / g}묶음 → ${fr(n, d)}` } : { why: '', step: null }; };
      if (kind === 'bag') {
        const r = rand(2, 6); let s; do { s = rand(1, 6); } while (s === r);
        const ans = fr(s, r + s), raw = `${s}/${r + s}`;
        const [what, other, eW, eO] = st ? ['하이퍼볼', '몬스터볼', '🟡', '🔴'] : ['파란 공', '빨간 공', '🔵', '🔴'];
        const rows = [{ e: eO, n: r, t: `${other} ${r}개` }, { e: eW, n: s, t: `${what} ${s}개` }];
        return Q(ans, [
          { v: fr(s, r), why: `${what} 수를 ${other} 수로 나눴어. 아래(분모)는 '전체' ${r + s}개여야 해.` },
          { v: '1/2', why: `나오거나 안 나오거나 둘 중 하나라서 반반이라고 생각했구나. 개수가 다르면 확률도 달라.` },
          { v: fr(r, r + s), why: `${other}이(가) 나올 확률을 구했어. 물어본 건 ${what} ${s}개 쪽이야.` },
        ], `모두 ${r} + ${s} = ${r + s}개 중에서 ${what} ${s}개 중 하나가 나오면 돼. 그래서 확률은 ${raw}.${grp(s, r + s, '개').why} 많이 들어 있을수록 잘 나와!`, {
          q: st ? `가방에 몬스터볼 ${r}개, 하이퍼볼 ${s}개가 있어. 안 보고 하나 꺼낼 때 하이퍼볼일 확률은?` : `빨간 공 ${r}개, 파란 공 ${s}개 중 안 보고 하나를 꺼낼 때, 파란 공일 확률은?`,
          help: '📖 확률 = 일어날 가능성을 수로 나타낸 것. (원하는 것의 수) ÷ (전체 수)',
          pic: { type: 'icons', rows },
          need, more: [{ v: fr(1, r + s), why: `공 딱 한 개가 나올 확률을 구했어. ${what} ${s}개 중 아무거나 나와도 되니 위(분자)는 ${s}야.` }], gen: fracGen,
          steps: [`전체: ${r} + ${s} = ${r + s}개`, `원하는 것: ${what} ${s}개`, `확률: ${raw}`, grp(s, r + s, '개').step].filter(Boolean),
          viz: { type: 'icons', rows, total: `${r + s}개 중 ${s}개 → ${raw}${raw !== ans ? ` = ${ans}` : ''}` } });
      }
      if (kind === 'dice') {
        const E = pick([
          { n: '짝수', f: [2, 4, 6], h: '📖 짝수 = 2로 똑같이 나누어떨어지는 수 (둘씩 짝이 딱 맞는 수)', t: { v: '1/3', why: '2와 4만 셌구나. 6도 2로 나누어떨어지는 짝수야. 짝수는 2, 4, 6 세 개란다.' } },
          { n: '3의 배수', f: [3, 6], h: '📖 3의 배수 = 3에 1, 2, 3…을 곱한 수 (3씩 뛰어 센 수)', t: { v: '1/2', why: '3, 6, 9로 셌구나. 주사위 눈은 6까지라 9는 없어. 3의 배수는 3, 6 두 개야.' } },
          { n: '4보다 큰 수', f: [5, 6], h: '📖 4보다 큰 수 = 4는 빼고, 4 다음부터의 수', t: { v: '1/2', why: '4도 넣었구나. "4보다 큰"에 4는 들어가지 않아. 5, 6 두 개야.' } },
          { n: '소수', f: [2, 3, 5], h: '📖 소수 = 1과 자기로만 나누어떨어지는 수(1은 빼, 0.1 같은 소수와 다른 말)', t: { v: '2/3', why: '1도 소수로 셌구나. 1은 소수가 아니야. 1~6에서 소수는 2, 3, 5 세 개란다.' } },
          { n: '6의 약수', f: [1, 2, 3, 6], h: '📖 6의 약수 = 6을 나눴을 때 나머지 없이 딱 떨어지게 하는 수', t: { v: '1/2', why: '1을 빠뜨렸어. 6 ÷ 1 = 6, 나누어떨어지니 1도 6의 약수야: 1, 2, 3, 6.' } },
        ]);
        const k = E.f.length, ans = fr(k, 6), raw = `${k}/6`;
        const faces = ['1', '2', '3', '4', '5', '6'];
        /* 실제 착각(E.t)을 먼저 넣는다: 값이 겹치면 앞의 것이 남는다. 모자라면 '반대쪽 눈을 센' 착각으로 채운다 (2026-10-24 검증: 3의 배수·4보다 큰 수에서 아무 값이나 들어가던 것) */
        return Q(ans, [
          E.t,
          { v: fr(k, 6 - k), why: `원하는 수 ÷ '원하지 않는 수'로 나눴어. 아래(분모)는 모든 경우 6이어야 해.` },
          { v: '1/6', why: `눈 하나가 나올 확률만 구했어. ${E.n}는 ${E.f.join(', ')}로 ${k}가지라 ${k}/6이야.` },
          { v: fr(6 - k, 6), why: `반대로 ${E.n}가 아닌 눈을 셌어. 물어본 건 ${E.n}인 ${E.f.join(', ')}로 ${k}가지야.` },
        ], `주사위 눈은 1~6, 모두 6가지. ${E.n}는 ${E.f.join(', ')}로 ${k}가지. 그래서 확률은 ${raw}.${grp(k, 6, '가지').why}`, {
          q: `주사위 한 개를 던질 때 ${E.n}의 눈이 나올 확률은?`, need, gen: fracGen, help: `📖 확률 = 원하는 경우 수 ÷ 모든 경우 수. ${E.h.replace(/^📖\s*/u, '')}`,
          pic: { type: 'table', rows: [faces] },
          steps: ['모든 경우: 1~6, 6가지', `${E.n}: ${E.f.join(', ')} → ${k}가지`, `확률: ${raw}`, grp(k, 6, '가지').step].filter(Boolean),
          viz: { type: 'table', rows: [faces, faces.map((v) => (E.f.includes(Number(v)) ? '✔' : ''))], hi: 1 } });
      }
      if (kind === 'coins') {
        const both = Math.random() < 0.5;
        const help = '📖 확률 = 원하는 경우 수 ÷ 모든 경우 수. 동전 하나는 앞면 또는 뒷면이 나와. 두 동전은 서로 다른 동전이야';
        const pic = { type: 'scene', items: [{ e: '🪙', t: '동전 1' }, { e: '🪙', t: '동전 2' }] };
        return both ? Q('1/4', [
          { v: '1/3', why: `(앞,앞), (앞,뒤), (뒤,뒤) 3가지로 셌구나. (앞,뒤)와 (뒤,앞)은 다른 경우라 모두 4가지야.` },
          { v: '1/2', why: `동전 하나만 봤어. 두 동전이 '모두' 앞면이어야 하니 4가지 중 1가지야.` },
          { v: '3/4', why: `'적어도 하나가 앞면'과 헷갈렸어. 둘 다 앞면은 (앞,앞) 하나뿐이야.` },
        ], `나올 수 있는 건 (앞,앞), (앞,뒤), (뒤,앞), (뒤,뒤) 4가지. 둘 다 앞면은 (앞,앞) 1가지라서 1/4!`, {
          q: '동전 두 개를 던질 때 둘 다 앞면이 나올 확률은?', need, gen: fracGen, help, pic,
          steps: ['동전마다 앞·뒤 2가지', '모든 경우: 2 × 2 = 4가지', '둘 다 앞면: (앞,앞) 1가지', '확률: 1/4'],
          viz: { type: 'table', head: ['동전 1', '동전 2'], rows: [['앞', '앞'], ['앞', '뒤'], ['뒤', '앞'], ['뒤', '뒤']], hi: 0 } })
          : Q('1/2', [
            { v: '1/3', why: `(앞,뒤)와 (뒤,앞)을 같은 걸로 셌어. 동전 두 개는 서로 달라서 경우는 4가지야.` },
            { v: '1/4', why: `(앞,뒤) 하나만 셌어. (뒤,앞)도 '하나는 앞, 하나는 뒤'라 2가지야.` },
            { v: '3/4', why: `'적어도 하나가 앞면'을 구했어. (앞,앞)은 둘 다 앞이라 빼야 해.` },
          ], `모든 경우 4가지 중 (앞,뒤), (뒤,앞) 2가지가 맞아. 4가지를 2가지씩 묶으면 2묶음, 그중 1묶음이라 2/4 = 1/2!`, {
            q: '동전 두 개를 던질 때 앞면 하나, 뒷면 하나가 나올 확률은?', need, gen: fracGen, help, pic,
            steps: ['모든 경우: 2 × 2 = 4가지', '앞 하나·뒤 하나: (앞,뒤), (뒤,앞)', '2가지 → 2/4', '2가지씩 묶기: 2묶음 중 1묶음 → 1/2'],
            viz: { type: 'table', head: ['동전 1', '동전 2', '맞나?'], rows: [['앞', '앞', ''], ['앞', '뒤', '✔'], ['뒤', '앞', '✔'], ['뒤', '뒤', '']] } });
      }
      const S = rand(4, 8);
      const pairs = []; for (let i = 1; i <= 6; i++) for (let j = 1; j <= 6; j++) if (i + j === S) pairs.push([i, j]);
      const w = pairs.length, uw = pairs.filter(([i, j]) => i <= j).length, ans = fr(w, 36), raw = `${w}/36`;
      const [p1, p2] = pairs.find(([i, j]) => i < j); // 순서만 다른 짝의 예 (합 8이면 (2, 6) — 주사위에 7은 없다)
      const grid = [1, 2, 3, 4, 5, 6].map((i) => [String(i), ...[1, 2, 3, 4, 5, 6].map((j) => (i + j === S ? `★${i + j}` : String(i + j)))]);
      return Q(ans, [
        { v: '1/11', why: `합 2~12의 11가지가 똑같이 잘 나온다고 생각했구나. 7은 6가지 방법, 2는 1가지뿐이라 달라.` },
        { v: fr(uw, 36), why: `${J(`(${p1}, ${p2})`, '과', '와')} ${J(`(${p2}, ${p1})`, '을', '를')} 같은 걸로 셌어. 두 주사위는 서로 달라서 따로 세야 해.` },
        { v: fr(w, 6), why: `주사위가 두 개면 모든 경우는 6 × 6 = 36가지야. 아래(분모)를 6으로 하면 안 돼.` },
      ], `두 주사위의 모든 경우는 6 × 6 = 36가지. 더해서 ${S}가 되는 건 ${pairs.map((p) => `(${p.join(',')})`).join(' ')} ${w}가지라 ${raw}.${grp(w, 36, '가지').why}`, {
        q: `주사위 두 개를 던질 때 두 눈을 더한 값이 ${S}일 확률은?`, need, gen: fracGen,
        help: '📖 확률 = 원하는 경우 수 ÷ 모든 경우 수. 두 주사위는 서로 달라서 (1, 2)와 (2, 1)은 다른 경우야',
        pic: { type: 'scene', items: [{ e: '🎲', t: '첫째 주사위' }, { e: '🎲', t: '둘째 주사위' }, { e: '➕', t: `더해서 ${S}?` }] },
        steps: ['모든 경우: 6 × 6 = 36가지', `더해서 ${S}: ${w}가지`, `확률: ${raw}`, grp(w, 36, '가지').step].filter(Boolean),
        viz: { type: 'table', head: ['+', '1', '2', '3', '4', '5', '6'], rows: grid } });
    }),

  /* ───────── 중3 ───────── */
  skill('m_factor', 9, '인수분해 x²+bx+c', '곱해서 c, 더해서 b가 되는 두 수 p, q를 찾으면 x² + bx + c = (x + p)(x + q)야. 전개를 거꾸로 하는 거야.',
    '복잡한 식을 괄호 두 개의 곱으로 쪼개 두면, 어떤 수를 넣어야 0이 되는지 바로 보여서 방정식을 쉽게 풀 수 있어.', (st, need) => {
      let p, q;
      if (st) { do { p = rand(1, 6); q = rand(1, 7); } while (p === q); }
      else { do { p = nz(-7, 7); q = nz(-7, 7); } while (p === q || p + q === 0); }
      const b = p + q, c = p * q, expr = quad(1, b, c), ans = fac(p, q);
      const exp = (r, s) => quad(1, r + s, r * s);
      const alt = [];
      for (let r = -12; r <= 12; r++) if (r && c % r === 0) { const s = c / r; if (r < s && r + s !== b) alt.push([r, s]); }
      const al = alt.length ? pick(alt) : null;
      const [lo, hi] = [p, q].sort((m, n) => m - n);
      return Q(ans, [
        { v: fac(-p, -q), why: `괄호 속 +, −를 반대로 넣었어. 전개하면 ${exp(-p, -q)}이 돼. 두 수를 더하면 ${N(b)}가 되어야 해.` },
        al ? { v: fac(al[0], al[1]), why: `곱하면 ${N(c)}는 맞지만 더하면 ${N(al[0] + al[1])}라서 x 앞의 수 ${N(b)}가 안 돼.` } : null,
        { v: fac(p, -q), why: `한쪽 괄호의 +, −를 틀렸어. 전개하면 ${exp(p, -q)}이 돼서 마지막 수가 ${N(-c)}가 돼.` },
      ], `(x + □)(x + △)를 전개하면 x² + (□ + △)x + □ × △야. 그러니 곱해서 ${N(c)}, 더해서 ${N(b)}인 두 수를 찾자. ${N(lo)}와 ${N(hi)}! 답은 ${ans}.`, {
        q: st ? `넓이가 ${expr}인 직사각형 배틀 필드가 있어. 가로·세로를 (x + □)(x + △) 꼴로 나타내면?` : `${expr}를 (x + □)(x + △)처럼 괄호끼리 곱한 꼴로 나타내면?`, need,
        help: `📖 인수분해 = 괄호끼리 곱한 꼴로 바꾸기(전개의 거꾸로). x² = x × x${p < 0 || q < 0 ? '. −□ = 0보다 □ 작은 수' : ''}`,
        /* 이야기판(넓이 배틀 필드)은 실제 넓이 그림: 모르는 두 길이는 '?' 로, 길이도 같게 그려 답이 그림에 안 보이게 (2026-10-24 2차 점검) */
        pic: st ? areaPic(2.5, 2.5, [['x²', '?'], ['?', N(c)]], true, ['?', '?']) : { type: 'table', head: ['×', 'x', '?'], rows: [['x', 'x²', '?'], ['?', '?', N(c)]] },
        more: [{ v: fac(b, c), why: `x 앞의 수 ${N(b)}와 마지막 수 ${N(c)}를 그대로 넣었어. 전개하면 ${exp(b, c)}이 돼서 달라.` }, { v: fac(-p, q), why: `한쪽 괄호의 +, −를 틀렸어. 전개하면 ${exp(-p, q)}이 돼.` }],
        gen: () => { const r = nz(-9, 9); let s; do { s = nz(-9, 9); } while (s === r); return { v: fac(r, s), why: `전개하면 ${exp(r, s)}이 돼서 원래 식과 달라. 곱해서 ${N(c)}, 더해서 ${N(b)}인 수를 찾자.` }; },
        steps: [`곱해서 ${N(c)}, 더해서 ${N(b)}인 두 수 찾기`, `${N(lo)} × ${P(hi)} = ${N(c)}`, `${N(lo)} + ${P(hi)} = ${N(b)}`, `답: ${ans}`],
        viz: st ? areaPic(hi, lo, [['x²', mono(hi, 1)], [mono(lo, 1), N(c)]]) : boxT(['x', N(hi)], ['x', N(lo)], [['x²', mono(hi, 1)], [mono(lo, 1), N(c)]]) });
    }),

  skill('m_quad_eq', 9, '이차방정식의 해', '두 수를 곱해서 0이면 둘 중 하나는 꼭 0이야. 그래서 (x − 2)(x − 3) = 0이면 x = 2 또는 x = 3.',
    '아주 옛날 바빌로니아 사람들도 넓이가 정해진 밭의 한 변처럼 제곱이 든 문제를 점토판에 풀어 두었어.', (st, need) => {
      if (st) {
        const k = rand(3, 9), A = k * k;
        const [X, Y] = sqBox(k + 1, k + 1);
        /* 문제 그림 = 실제 정사각형 (이모지 대신, 한 변은 '?', 칸 눈금 없음 — 칸을 세면 답이 보이므로) (2026-10-24 2차 점검 G12) */
        const [PX, PY] = sqBox(4.6, 4);
        const sqQ = { type: 'plot', x: [0, PX], y: [0, PY], step: 100, anim: false, segs: [
          { x1: 0.6, y1: 0.5, x2: 3.6, y2: 0.5, c: 'a', label: '한 변 = ?', ly: 14 }, { x1: 3.6, y1: 0.5, x2: 3.6, y2: 3.5, c: 'a' },
          { x1: 3.6, y1: 3.5, x2: 0.6, y2: 3.5, c: 'a' }, { x1: 0.6, y1: 3.5, x2: 0.6, y2: 0.5, c: 'a' },
          { x1: 2.1, y1: 2, x2: 2.1, y2: 2, label: `넓이 ${A}m²`, c: 'b' }] };
        return Q(String(k), [
          /* 음수와 음수 × 음수 = + 도 이유와 함께 (2026-10-24 2차 점검 G12) */
          { v: `${N(-k)} 또는 ${k}`, why: `${N(-k)}는 0보다 ${k} 작은 수야. 음수끼리 곱하면 +라서 (${N(-k)}) × (${N(-k)})도 ${A}이긴 해. 그래도 길이는 0보다 작을 수 없으니 ${N(-k)}m는 버려.` },
          { v: fr(A, 4), why: `넓이를 4로 나눴어. 그건 '둘레'에서 한 변을 구하는 방법이야. 넓이는 한 변 × 한 변이란다.` },
          { v: fr(A, 2), why: `x²을 x × 2로 생각했구나. x²은 같은 수를 두 번 곱하는 x × x야.` },
        ], `한 변을 x라 하면 넓이는 x × x = ${A}. 두 번 곱해 ${A}가 되는 길이를 찾자. ${k - 1} × ${k - 1} = ${(k - 1) * (k - 1)}은 모자라고, ${k} × ${k} = ${A}로 딱 맞아! 길이는 0보다 커야 하니 답은 ${k}m.`, {
          q: `넓이가 ${A}m²인 정사각형 풀숲이 있어. 한 변의 길이는 몇 m일까?`, need,
          help: '📖 정사각형 넓이 = 한 변 × 한 변. m² = 1m × 1m 네모 칸. −□ = 0보다 □ 작은 수',
          pic: sqQ,
          more: [{ v: String(A), why: `넓이를 그대로 답했어. 한 변 × 한 변이 ${A}야. 두 번 곱해 ${A}가 되는 수를 찾아.` }],
          steps: [`한 변을 x: x × x = ${A}`, `${k - 1} × ${k - 1} = ${(k - 1) * (k - 1)} (모자라)`, `${k} × ${k} = ${A} (딱 맞아!)`, `길이는 0보다 커 → ${k}m`],
          viz: { type: 'plot', x: [0, X], y: [0, Y], step: 1, shade: { f: String(k), a: 0, b: k, label: `넓이 ${A}m²` },
            segs: [{ x1: 0, y1: k, x2: k, y2: k, c: 'a', label: `한 변 ${k}m`, ly: -12 }, { x1: k, y1: 0, x2: k, y2: k, c: 'a', label: `${k}m`, lx: 22 }] } });
      }
      const X = (r1, r2) => { const [u, w] = [r1, r2].sort((m, n) => m - n); return `x = ${N(u)} 또는 ${N(w)}`; };
      if (Math.random() < 0.3) {
        const k = rand(2, 9), A = k * k;
        return Q(X(-k, k), [
          { v: `x = ${k}`, why: `음수 쪽을 빠뜨렸어. (${N(-k)}) × (${N(-k)})도 ${A}라서 답이 두 개야.` },
          /* 정답만 '또는'이 붙어 혼자 길어 보이지 않게, 2로 나눈 실수도 두 해 꼴로 쓴다 (2026-10-24 검증) */
          { v: `x = ${MI}${fr(A, 2)} 또는 ${fr(A, 2)}`, why: `x²을 x × 2로 보고 ${A}를 2로 나눴구나. x²은 x × x라서 두 번 곱해 ${A}가 되는 수를 찾아야 해.` },
          { v: `x = ${A * A}`, why: `${A}를 한 번 더 제곱했어. 거꾸로 '두 번 곱해서 ${A}가 되는 수'를 찾아야 해.` },
        ], `두 번 곱해 ${A}가 되는 수를 찾자. ${k} × ${k} = ${A}, 그리고 (${N(-k)}) × (${N(-k)}) = ${A}도 돼(음수 × 음수 = +: ${N(-k)}에 1, 0, ${MI}1을 차례로 곱하면 답이 ${k}씩 커지거든). 그래서 x = ${N(-k)} 또는 ${k}.`, {
          q: `이차방정식 x² = ${A}의 해(식을 맞게 하는 x)를 모두 고르면?`, need,
          help: '📖 x² = x × x. 해 = 식에 넣었을 때 양쪽이 같아지는 x 값. −가 붙은 수 = 0보다 작은 수',
          more: [{ v: `x = ${N(-k)}`, why: `양수 쪽을 빠뜨렸어. ${k} × ${k}도 ${A}라서 답은 ${N(-k)}와 ${k} 두 개야.` }, { v: `x = ${2 * k}`, why: `${k}를 찾고 2를 곱했구나. x²은 x × 2가 아니라 x × x야.` }],
          steps: [`두 번 곱해 ${A}가 되는 수 찾기`, `${k} × ${k} = ${A}`, `(${N(-k)}) × (${N(-k)}) = ${A}`, `x = ${N(-k)} 또는 ${k}`],
          viz: { type: 'plot', x: [-k - 2, k + 2], y: [-1, rd(A * 1.3) + 1], fns: [{ f: 'x^2', label: 'y = x²', lx: rd(k * 0.55) }, { f: String(A), label: `y = ${A}`, c: 'b', lx: rd(-k - 1) }],
            pts: [{ x: -k, y: A, label: `x = ${N(-k)}`, ly: 18 }, { x: k, y: A, label: `x = ${k}`, ly: 18 }] } });
      }
      let r1, r2; do { r1 = nz(-6, 6); r2 = nz(-6, 6); } while (r1 === r2 || r1 + r2 === 0);
      const b = -(r1 + r2), c = r1 * r2, eq = `${quad(1, b, c)} = 0`;
      const alt = [];
      for (let r = -12; r <= 12; r++) if (r && c % r === 0) { const s = c / r; if (r < s && r + s !== -b) alt.push([r, s]); }
      const al = alt.length ? pick(alt) : null;
      const f = (x) => x * x + b * x + c, xa = Math.min(r1, r2) - 2, xb = Math.max(r1, r2) + 2;
      const ylo = Math.floor(c - (b * b) / 4) - 1, yhi = Math.max(f(xa), f(xb)) + 1;
      return Q(X(r1, r2), [
        { v: X(-r1, -r2), why: `괄호 속 수를 그대로 답했어. ${xs(-r1)} = 0이 되려면 x = ${N(r1)}, +와 −가 반대야!` },
        { v: `x = ${N(Math.max(r1, r2))}`, why: `해를 하나만 찾았어. 곱해서 0이 되려면 두 괄호 중 어느 쪽이 0이어도 돼서 해가 두 개야.` },
        /* 두 해의 합(근과 계수) 대신 '직접 넣어 보기'로 틀린 까닭을 보여 준다 — al 의 두 수는 둘 다 해가 아니다 (2026-10-24 검증) */
        al ? { v: X(al[0], al[1]), why: `x = ${N(al[1])}를 넣어 보면 ${N(f(al[1]))}이 돼서 0이 아니야. 곱해서 ${N(c)}만 맞추지 말고, 넣어서 0이 되는지 꼭 확인해.` } : null,
      /* 규칙마다 이유: '더해 b·곱해 c' = 전개의 가운데·끝, '곱이 0이면 한쪽이 0' = 0 아닌 수끼리는 0이 안 나옴 (2026-10-24 2차 점검) */
      ], `(x + □)(x + △)를 펼치면 가운데는 □ + △, 끝은 □ × △야. 더해 ${N(b)}, 곱해 ${N(c)}인 두 수는 ${N(-r1)}, ${N(-r2)}라서 (${xs(-r1)})(${xs(-r2)}) = 0. 0 아닌 수끼리 곱하면 0이 안 나오니 한쪽이 0: x = ${N(r1)} 또는 ${N(r2)}.`, {
        q: `이차방정식 ${eq}의 해를 모두 고르면?`, need,
        help: '📖 해 = x 자리에 넣으면 왼쪽이 0이 되는 수. x² = x × x. −가 붙은 수 = 0보다 작은 수',
        more: [{ v: X(-r1, r2), why: `한 해의 +, −를 틀렸어. 두 해를 식에 넣어 0이 되는지 확인해 보자.` }],
        gen: () => { const u = nz(-9, 9); let w; do { w = nz(-9, 9); } while (w === u); return { v: X(u, w), why: `x = ${N(u)}를 넣으면 ${N(u * u + b * u + c)}이 돼서 0이 아니야. 인수분해를 다시 해 보자.` }; },
        steps: [`곱해서 ${N(c)}, 더해서 ${N(b)}: ${N(-r1)}, ${N(-r2)}`, `인수분해: (${xs(-r1)})(${xs(-r2)}) = 0`, `${xs(-r1)} = 0 → x = ${N(r1)}`, `${xs(-r2)} = 0 → x = ${N(r2)}`, X(r1, r2)],
        viz: { type: 'plot', x: [xa, xb], y: [ylo, yhi], fns: [{ f: `x^2${sgnT(b, 'x')}${sgnT(c)}`, label: `y = ${quad(1, b, c)}`, lx: rd(xb - 1.2) }],
          pts: [{ x: r1, y: 0, label: `x = ${N(r1)}`, ly: -16 }, { x: r2, y: 0, label: `x = ${N(r2)}`, ly: -34 }] } });
    }),

  skill('m_pythag', 9, '피타고라스 정리', '직각삼각형 세 변 위에 정사각형을 그리면, 짧은 두 정사각형의 칸 수를 더한 것이 빗변 정사각형의 칸 수와 같아. 그래서 (빗변 × 빗변) = (한 변 × 한 변) + (다른 변 × 다른 변).',
    '땅을 반듯하게 나누고, 곧장 가는 거리나 사다리 높이를 재려고 아주 옛날부터 이 규칙을 썼어.', (st, need) => {
      const kind = pick(st ? ['hyp', 'leg'] : ['hyp', 'leg', 'surd']);
      const helpT = '📖 빗변 = 직각 맞은편의 가장 긴 변';
      /* 2026-10-24 점검: 규칙을 쓰기 전에 '세 변 위 정사각형의 칸 수'로 이유를 보여 주고(sqPic), 보기에 √가 있으면 help 에서 √를 푼다 */
      const cell = (s, n) => (s >= 3 ? `${s} × ${s} = ${n}칸` : `${n}칸`);
      const rule = '세 변 위에 정사각형을 그리면, 짧은 두 정사각형의 칸 수를 더한 게 빗변 정사각형의 칸 수야.';
      if (kind === 'surd') {
        const [a, b] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [2, 5], [3, 5]]), s = a * a + b * b;
        const vals = [sq(s), String(a + b), String(s), sq(a + b)];
        return Q(sq(s), [
          { v: String(a + b), why: `두 변을 그냥 더했어. 곧장 가는 빗변은 꺾어 가는 길(${a} + ${b})보다 짧아. 먼저 각각 두 번 곱해 더해.` },
          { v: String(s), why: `${a} × ${a} + ${b} × ${b} = ${s}까지는 맞아! 그건 빗변 정사각형의 칸 수라 √를 씌워 ${sq(s)}로 써야 해.` },
          { v: sq(a + b), why: `두 번 곱하지 않고 ${a} + ${b} = ${a + b}에 √를 씌웠어${sq(a + b) !== `√${a + b}` ? `(√${a + b} = ${sq(a + b)})` : ''}. ${a} × ${a}, ${b} × ${b}를 먼저 구해야 해.` },
        ], `${rule} ${a} × ${a} + ${b} × ${b} = ${a * a} + ${b * b} = ${s}칸. 두 번 곱해 ${s}가 되는 수는 딱 떨어지지 않아서 ${sq(s)}(루트 ${s})로 써.`, {
          q: `직각을 낀 두 변이 ${a}, ${b}인 직각삼각형이 있어. 가장 긴 변(빗변)의 길이는?`, need,
          help: `📖 빗변 = 직각 맞은편 가장 긴 변. ${rootHelp(vals)}`,
          pic: triPic(a, b, { base: String(a), side: String(b), hyp: '?' }, true),
          steps: [`${a} × ${a} = ${a * a}칸`, `${b} × ${b} = ${b * b}칸`, `빗변 정사각형: ${a * a} + ${b * b} = ${s}칸`, `두 번 곱해 ${s}가 되는 수 → ${sq(s)}`],
          viz: sqPic(a, b, [cell(a, a * a), cell(b, b * b), `□ × □ = ${s}칸`]) });
      }
      const [a, b, c] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]]);
      const sqv = [cell(a, a * a), cell(b, b * b), cell(c, c * c)];
      if (kind === 'hyp') {
        const lab = st ? { base: `동쪽 ${a}km`, side: `북쪽 ${b}km` } : { base: String(a), side: String(b) };
        const vals = [String(c), String(a + b), String(a * a + b * b), sq(a + b)];
        return Q(String(c), [
          { v: String(a + b), why: `두 변을 그냥 더했어. 곧장 가는 길(빗변)은 꺾어 가는 길 ${a} + ${b}보다 짧아야 해.` },
          { v: String(a * a + b * b), why: `${a * a} + ${b * b} = ${a * a + b * b}까지 맞아! 그건 빗변 정사각형의 칸 수라, 두 번 곱해 ${c * c}가 되는 수를 찾아야 해.` },
          { v: sq(a + b), why: `두 번 곱하지 않고 ${a + b}에 √(두 번 곱해 그 수가 되는 수)를 씌웠어. ${a} × ${a}와 ${b} × ${b}를 먼저 구해 더해야 해.` },
        ], `${rule} ${a} × ${a} + ${b} × ${b} = ${a * a} + ${b * b} = ${c * c}칸. 두 번 곱해 ${c * c}가 되는 수는 ${c}! 꺾어 가는 ${a + b}보다 짧지.`, {
          q: st ? `피죤투가 동쪽으로 ${a}km, 이어서 북쪽으로 ${b}km 날았어. 출발점까지 곧장 날아가면 몇 km?` : `직각을 낀 두 변이 ${a}, ${b}인 직각삼각형이 있어. 가장 긴 변(빗변)의 길이는?`,
          unit: st ? 'km' : '', need,
          help: `${st ? '📖 동쪽과 북쪽은 직각(ㄴ자)으로 만나. 곧장 가는 길 = 빗변' : helpT}. ${rootHelp(vals)}`,
          pic: triPic(a, b, { ...lab, hyp: st ? '곧장 ?' : '?' }, true),
          steps: [`짧은 변 정사각형: ${a} × ${a} = ${a * a}칸`, `다른 변 정사각형: ${b} × ${b} = ${b * b}칸`, `빗변 정사각형: ${a * a} + ${b * b} = ${c * c}칸`, `두 번 곱해 ${c * c}: ${c} × ${c} = ${c * c}`, `빗변 = ${c}${st ? 'km' : ''}`],
          viz: sqPic(a, b, sqv) });
      }
      const lab = st ? { base: `벽까지 ${a}m`, hyp: `사다리 ${c}m` } : { base: String(a), hyp: String(c) };
      const vals = [String(b), String(c - a), String(c * c - a * a), sq(c * c + a * a)];
      return Q(String(b), [
        { v: String(c - a), why: `빗변에서 한 변을 그냥 뺐어. 길이가 아니라 정사각형 칸 수끼리 빼야 해: ${c * c} − ${a * a}.` },
        { v: String(c * c - a * a), why: `${c * c} − ${a * a} = ${c * c - a * a}까지 맞아! 그건 남은 정사각형의 칸 수라서, 두 번 곱해 ${c * c - a * a}가 되는 수를 찾아야 해.` },
        { v: sq(c * c + a * a), why: `${c * c} + ${a * a}처럼 빗변까지 더하고 √(두 번 곱해 그 수가 되는 수)를 씌웠어. 빗변 정사각형이 가장 커서 ${c * c} − ${a * a}로 빼야 해.` },
      /* 문제의 수(빗변·한 변)가 풀이에 보이게 (2026-10-24 표본 검사) */
      ], `${rule} 그러니 빗변 ${c} × ${c} = ${c * c}칸에서 ${a} × ${a} = ${a * a}칸을 빼면 ${c * c} − ${a * a} = ${b * b}칸. ${b} × ${b} = ${b * b}라서 답은 ${b}!`, {
        q: st ? `길이 ${c}m 사다리를 벽에서 ${a}m 떨어진 땅에 기대 세웠어. 사다리 끝은 땅에서 몇 m 높이일까?` : `빗변이 ${c}, 한 변이 ${a}인 직각삼각형이 있어. 나머지 한 변의 길이는?`,
        unit: st ? 'm' : '', need,
        help: `${st ? '📖 벽과 땅은 직각(ㄴ자)으로 만나. 기댄 사다리가 빗변' : helpT}. ${rootHelp(vals)}`,
        pic: triPic(a, b, { ...lab, side: st ? '높이 ?' : '?' }, true),
        steps: [`빗변 정사각형: ${c} × ${c} = ${c * c}칸`, `아는 변 정사각형: ${a} × ${a} = ${a * a}칸`, `남은 정사각형: ${c * c} − ${a * a} = ${b * b}칸`, `두 번 곱해 ${b * b}: ${b} × ${b} = ${b * b}`, `나머지 변 = ${b}${st ? 'm' : ''}`],
        viz: sqPic(a, b, sqv) });
    }),

  skill('m_trig', 9, '삼각비 (특수각)', 'sin = 높이 ÷ 빗변, cos = 밑변 ÷ 빗변, tan = 높이 ÷ 밑변. 정삼각형을 반 자른 30°·60° 삼각형은 변이 1 : √3 : 2, 정사각형을 반 자른 45° 삼각형은 1 : 1 : √2야.',
    '높은 나무나 산을 직접 올라가지 않고 높이를 재고 싶었어. 그래서 각도마다 변의 길이 비율을 표로 만들어 썼어.', (st, need) => {
      if (st) {
        const th = pick([30, 60]), L = rand(2, 10) * 2, h = L / 2;
        const S3 = (k) => `${k}√3`;
        const val = th === 30 ? '1/2' : '√3/2';
        const ws = th === 30 ? [
          { v: S3(h), why: `cos 30°(√3/2)를 곱했어. 그건 땅 위 가로 거리야. 높이는 비탈길 × sin 30°(1/2)란다.` },
          { v: String(L), why: `비탈길 길이를 그대로 썼어. 높이는 비탈길보다 짧아서 ${L} × 1/2를 해야 해.` },
          { v: String(2 * L), why: `sin 30°로 곱하지 않고 나눴어. 높이 = 비탈길 × sin 30°야.` },
        ] : [
          { v: String(h), why: `cos 60°(1/2)를 곱했어. 그건 땅 위 가로 거리야. 높이는 비탈길 × sin 60°(√3/2)란다.` },
          { v: S3(L), why: `2로 나누는 걸 빠뜨렸어. sin 60° = √3/2라서 ${L} × √3/2 = ${S3(h)}야.` },
          { v: String(L), why: `비탈길 길이를 그대로 썼어. 높이는 비탈길 × sin 60°로 구해.` },
        ];
        const ans = th === 30 ? String(h) : S3(h);
        const rad = (th * Math.PI) / 180, w = rd(L * Math.cos(rad)), hh = rd(L * Math.sin(rad));
        return Q(ans, ws, `높이 = 비탈길 × sin ${th}°야. sin ${th}° = ${val}이니까 ${L} × ${val} = ${ans}m. 올라가지 않고 각도만으로 높이를 알 수 있어!`, {
          q: `길이 ${L}m 비탈길이 땅과 ${th}°를 이뤄. 비탈 꼭대기는 땅에서 몇 m 높이일까?`, unit: 'm', need,
          help: `📖 sin ${th}° = 높이 ÷ 빗변 = ${val}. ° = 각도. √□ = 두 번 곱하면 □인 수. △√□ = △ × √□`,
          pic: triPic(w, hh, { side: '높이 ?', hyp: `비탈길 ${L}m`, ang: `${th}°` }, true),
          steps: ['높이 = 빗변 × sin ' + th + '°', `sin ${th}° = ${val}`, ...(th === 30 ? [`${L} × 1/2 = ${L} ÷ 2 = ${h}`] : [`${L} × √3/2 = ${L} ÷ 2 × √3`, `${L} ÷ 2 = ${h} → ${ans}`])],
          viz: triPic(w, hh, { side: `높이 ${ans}m`, hyp: `비탈길 ${L}m`, ang: `${th}°` }) });
      }
      const T = {
        sin30: ['1/2', [['√3/2', '그건 cos 30°(밑변 √3 ÷ 빗변 2)야. sin은 높이 ÷ 빗변이라 1 ÷ 2 = 1/2란다.'], ['2', '빗변 ÷ 높이로 거꾸로 나눴어. sin은 높이(1) ÷ 빗변(2)이야.'], ['√3/3', '그건 tan 30°(높이 ÷ 밑변)야. sin은 빗변으로 나눠.']]],
        sin45: ['√2/2', [['1', '그건 tan 45°(높이 1 ÷ 밑변 1)야. sin은 높이 1을 빗변 √2로 나눠서 √2/2란다.'], ['√2', '빗변 ÷ 높이로 거꾸로 나눴어. sin은 높이(1) ÷ 빗변(√2)이야.'], ['1/2', '그건 sin 30°의 값이야. 45° 삼각형은 1 : 1 : √2 모양이란다.']]],
        sin60: ['√3/2', [['1/2', 'sin 60°와 sin 30°를 바꿨어. 60° 맞은편 높이는 긴 변 √3이라 √3 ÷ 2야.'], ['√3', '그건 tan 60°(높이 ÷ 밑변)야. sin은 빗변 2로 나눠야 해.'], ['2√3/3', '빗변 ÷ 높이로 거꾸로 나눴어. sin은 높이(√3) ÷ 빗변(2)이야.']]],
        cos30: ['√3/2', [['1/2', 'cos과 sin을 바꿨어. cos은 밑변 ÷ 빗변이고, 30° 옆 밑변은 √3이야.'], ['√3', '밑변 √3을 빗변 2로 나누지 않았어. √3은 tan 60°의 값이야.'], ['2√3/3', '빗변 ÷ 밑변으로 거꾸로 나눴어. cos은 밑변(√3) ÷ 빗변(2)이야.']]],
        cos45: ['√2/2', [['1', '그건 tan 45°야. cos은 밑변 1을 빗변 √2로 나눠서 √2/2란다.'], ['√2', '빗변 ÷ 밑변으로 거꾸로 나눴어. 밑변(1) ÷ 빗변(√2) = √2/2야.'], ['√3/2', '그건 cos 30°의 값이야. 45° 삼각형은 1 : 1 : √2 모양이야.']]],
        cos60: ['1/2', [['√3/2', 'cos 60°와 sin 60°를 바꿨어. 60° 옆 밑변은 짧은 변 1이라 1 ÷ 2야.'], ['2', '빗변 ÷ 밑변으로 거꾸로 나눴어. cos은 밑변(1) ÷ 빗변(2)으로 계산해.'], ['√3', '그건 tan 60°야. cos은 밑변을 빗변으로 나눠.']]],
        tan30: ['√3/3', [['√3', '밑변 ÷ 높이로 거꾸로 나눴어. 그건 tan 60°야. tan 30° = 1 ÷ √3 = √3/3이란다.'], ['1/2', '그건 sin 30°야. tan은 빗변이 아니라 밑변(√3)으로 나눠.'], ['√3/2', '그건 cos 30°야. tan은 높이 ÷ 밑변이란다.']]],
        tan45: ['1', [['√2/2', '그건 sin 45°(= cos 45°)야. tan 45° = 높이 1 ÷ 밑변 1 = 1이란다.'], ['√2', '빗변 √2를 썼어. tan에는 빗변이 들어가지 않아.'], ['1/2', '45°가 90°의 절반이라 1/2이라고 생각했구나. 높이와 밑변이 똑같이 1이라 1 ÷ 1 = 1이야.']]],
        tan60: ['√3', [['√3/3', '밑변 ÷ 높이로 거꾸로 나눴어. tan 60° = 높이 √3 ÷ 밑변 1 = √3이란다.'], ['√3/2', '그건 sin 60°야. tan은 빗변이 아닌 밑변으로 나눠.'], ['1/2', '그건 cos 60°야. tan은 높이 ÷ 밑변이란다.']]],
      };
      const f = pick(['sin', 'cos', 'tan']), th = pick([30, 45, 60]), [ans, ws] = T[f + th];
      const tri = th === 45 ? '1 : 1 : √2(두 변 : 빗변)' : '1 : √3 : 2(짧은 변 : 긴 변 : 빗변)';
      const side = { 30: { opp: '1', adj: '√3', hyp: '2', w: Math.sqrt(3), h: 1 }, 45: { opp: '1', adj: '1', hyp: '√2', w: 1, h: 1 }, 60: { opp: '√3', adj: '1', hyp: '2', w: 1, h: Math.sqrt(3) } }[th];
      const rule = { sin: '높이 ÷ 빗변', cos: '밑변 ÷ 빗변', tan: '높이 ÷ 밑변' }[f];
      const [top, bot] = { sin: [side.opp, side.hyp], cos: [side.adj, side.hyp], tan: [side.opp, side.adj] }[f];
      const fix = bot.includes('√') && top !== bot ? fj(` (위아래에 같은 ${bot}을(를) 곱해도 값은 그대로라 정리)`) : '';
      const name = { sin: 'sin(사인)', cos: 'cos(코사인)', tan: 'tan(탄젠트)' }[f];
      /* 변 비율도 이유부터 (2026-10-24 점검): 45° = 정사각형을 반으로, 30°·60° = 정삼각형을 반으로 자른 모양 + 피타고라스 칸 수 */
      const whyTri = th === 45 ? '한 변 1인 정사각형을 대각선으로 반 자른 모양이라 두 변이 1, 1. 빗변 정사각형은 1 × 1 + 1 × 1 = 2칸이라 빗변 √2'
        : '세 변 2인 정삼각형을 반으로 자른 모양이라 빗변 2, 짧은 변 1. 긴 변 정사각형은 2 × 2 − 1 × 1 = 3칸이라 긴 변 √3';
      return Q(ans, ws.map(([v, why]) => ({ v, why })), `${th}° 직각삼각형은 ${whyTri}. ${f} = ${rule}이니까 ${top} ÷ ${bot} = ${ans}${fix}.`, {
        q: `그림의 직각삼각형으로 ${f} ${th}°의 값을 구하면?`, need,
        /* 보기에 √ 가 있으면 √ 뜻을 푼다. 정답 글(√3 등)을 그대로 쓰지 않게 □ 로 말한다 */
        help: (() => {
          const all = [ans, ...ws.map(([v]) => v)].join(' ');
          /* √로 나누는 문제(1 ÷ √2 등)는 보기가 '정리한 꼴'(√2/2)이라 정리하는 방법을 알려 준다. 예는 답에 안 나오는 √5 (2026-10-24 검증) */
          /* 70자 안쪽으로: 정리 방법(위아래에 √ 곱하기)은 풀이(why)가 보여 주고, help 는 보기 꼴만 알려 준다 */
          return `📖 ${name} = ${rule}. ° = 각도${all.includes('√') ? '. √□ = 두 번 곱하면 □인 수' : ''}${/\d√/.test(all) ? '. △√□ = △ × √□' : ''}${fix ? '. 1 ÷ √5는 √5/5로 써' : ''}`;
        })(),
        pic: triPic(rd(side.w), rd(side.h), { base: `밑변 ${side.adj}`, side: `높이 ${side.opp}`, hyp: `빗변 ${side.hyp}`, ang: `${th}°` }, true),
        steps: [th === 45 ? '45° 삼각형: 두 변 1, 1, 빗변 √2' : `${th}° 삼각형: 짧은 변 1, 긴 변 √3, 빗변 2`, `${f} = ${rule}`, `${top} ÷ ${bot} = ${ans}`],
        viz: { type: 'table', head: ['', 'sin', 'cos', 'tan'], rows: [['30°', '1/2', '√3/2', '√3/3'], ['45°', '√2/2', '√2/2', '1'], ['60°', '√3/2', '1/2', '√3']], hi: { 30: 0, 45: 1, 60: 2 }[th] } });
    }),

  /* ───────── 고2 ───────── */
  skill('m_log', 11, '로그의 값', 'logₐ b는 "a를 몇 번 곱해야 b가 될까?"의 답이야. 예: log₂ 8 = 3 (2 × 2 × 2 = 8).',
    '약 400년 전 네이피어는 별 위치 계산처럼 엄청 큰 수를 곱하는 일을 쉽게 하려고 로그를 만들었어. 곱셈이 덧셈으로 바뀌거든.', (st, need) => {
      if (st) {
        const n = rand(2, 4), X = 10 ** n, ch = chain(10, n);
        if (Math.random() < 0.5) {
          return Q(n, [
            { v: X, why: `세기 ${X}배를 그대로 답했어. 규모는 10배마다 1씩만 커지니까 '10을 몇 번 곱했나'를 세야 해.` },
            { v: n + 1, why: `${X}의 자릿수를 셌어. 10을 곱한 횟수는 0의 개수와 같아서 ${n}번이야.` },
            { v: X / 10, why: `${X}를 10으로 나눴구나. 규모는 나누기가 아니라 '10을 몇 번 곱했나'를 세는 거야.` },
          ], `${X} = ${ch}, 10배가 ${n}번 겹친 거야. 한 번에 1씩 커지니까 규모는 ${n}만큼 커져. 이걸 log₁₀ ${X} = ${n}이라고 써.`, {
            q: `지진 규모는 흔들림 세기가 10배가 될 때마다 1씩 커져. 세기가 ${X}배가 되면 규모는 얼마나 커질까?`, need,
            help: '📖 규모 = 지진의 세기를 나타내는 수. 흔들림이 10배 커질 때마다 1씩 올라가',
            pic: { type: 'table', head: ['흔들림 세기', '규모'], rows: [['처음', '+0'], ['10배', '+1'], [`${X}배`, '?']], hi: 2 },
            steps: [`${X} = ${ch}`, `10배가 ${n}번 겹침`, `규모 +${n} (log₁₀ ${X} = ${n})`],
            viz: { type: 'table', head: ['흔들림 세기', '규모'], rows: Array.from({ length: n }, (_, i) => [`${10 ** (i + 1)}배`, `+${i + 1}`]), hi: n - 1 } });
        }
        return Q(10 * n, [
          { v: X, why: `세기 ${X}배를 그대로 답했어. dB는 10배마다 10씩만 커져서 '10을 몇 번 곱했나'부터 세야 해.` },
          { v: n, why: `10배가 ${n}번 겹친 것까지 맞아! 한 번에 10dB씩이라 10 × ${n}을 해야 해.` },
          { v: 10 * (n + 1), why: `${X}의 자릿수로 셌어. 10을 곱한 횟수는 0의 개수와 같아서 ${n}번이야.` },
        ], `${X} = ${ch}, 10배가 ${n}번 겹쳤어. 10배마다 10dB씩이니 10 × ${n} = ${10 * n}dB 커져. 귀는 '몇 배'를 '더하기'처럼 느낀단다.`, {
          q: `소리 세기가 10배가 될 때마다 10dB씩 커져. 세기가 ${X}배가 되면 몇 dB 커질까?`, unit: 'dB', need,
          help: '📖 dB(데시벨) = 소리 크기를 나타내는 단위',
          pic: { type: 'table', head: ['소리 세기', '커진 크기'], rows: [['처음', '+0dB'], ['10배', '+10dB'], [`${X}배`, '?']], hi: 2 },
          steps: [`${X} = ${ch}`, `10배가 ${n}번 겹침`, `10dB × ${n} = ${10 * n}dB`],
          viz: { type: 'table', head: ['소리 세기', '커진 크기'], rows: Array.from({ length: n }, (_, i) => [`${10 ** (i + 1)}배`, `+${10 * (i + 1)}dB`]), hi: n - 1 } });
      }
      const kind = pick(['basic', 'sum', 'diff']);
      const powTable = (b, k) => ({ type: 'table', head: [fj(`${b}를 곱한 횟수`), '값'], rows: Array.from({ length: k }, (_, i) => [`${i + 1}번`, String(b ** (i + 1))]), hi: k - 1 });
      if (kind === 'basic') {
        const a = pick([2, 3, 5, 10]), n = rand(2, { 2: 5, 3: 4, 5: 3, 10: 4 }[a]), X = a ** n;
        return Q(n, [
          { v: X / a, why: `${X} ÷ ${a}를 했어. log는 나누기가 아니라 '${a}를 몇 번 곱해야 ${X}'인지 세는 거야.` },
          { v: n - 1, why: `× 기호 개수를 셌어. 곱한 ${a}의 개수를 세야 해서 ${n}개야.` },
          { v: fr(1, n), why: `두 수 자리를 바꿔 생각했어. ${X}를 몇 번 곱해 ${a}가 되는지가 아니라, ${a}를 몇 번 곱해 ${X}가 되는지 세야 해.` },
        ], `${a}를 몇 번 곱해야 ${X}가 될까? ${chain(a, n)} = ${X}, ${a}를 ${n}번 곱했어. 그래서 log${sub(a)} ${X} = ${n}.`, {
          q: `log${sub(a)} ${X}의 값은 얼마일까?`, need,
          help: '📖 logₐ b(로그) = "a를 몇 번 곱해야 b가 될까?"의 답', // 푸는 방법을 통째로 넘겨주는 예는 뺐다 (2026-10-24 2차 점검)
          more: a === 10 ? [{ v: n + 1, why: `${X}의 자릿수를 셌어. 10을 곱한 횟수는 0의 개수와 같아서 ${n}번이야.` }] : [{ v: X - a, why: `${X} − ${a}를 했어. log는 빼기가 아니라 '곱한 횟수'를 세는 거야.` }],
          steps: [...run(a, n), `${a}를 ${n}번 곱해 ${X} → ${n}`],
          viz: powTable(a, n) });
      }
      if (kind === 'sum') {
        const [b, M, Nn, k] = pick([[2, 4, 8, 5], [2, 2, 16, 5], [6, 4, 9, 2], [10, 4, 25, 2], [10, 2, 50, 2], [10, 20, 50, 3], [3, 3, 27, 4], [2, 8, 8, 6], [5, 5, 25, 3]]);
        const L = (x) => `log${sub(b)} ${x}`;
        const cnt = (x) => { let c = 0; while (x > 1 && x % b === 0) { x /= b; c++; } return x === 1 ? c : null; }; // b를 몇 번 곱해 x인지 (딱 안 되면 null)
        const i = cnt(M), j = cnt(Nn);
        const easy = i != null && j != null; // 둘 다 b를 곱해 만든 수면: 하나씩 세어 더하는 쉬운 길 (2026-10-24 3차 검토)
        const whySum = easy
          ? `${L(M)}은 '${b}를 몇 번 곱해야 ${M}?'이야. ${i === 1 ? `${b} 하나` : chain(b, i)} = ${M}, ${i}번. ${M === Nn ? '같은 걸 한 번 더 더하니' : `${L(Nn)}은 ${j === 1 ? `${b} 하나` : chain(b, j)} = ${Nn}, ${j}번. 더하면`} ${i} + ${j} = ${k}. 답은 ${k}!`
          : `log는 '${b}를 곱한 횟수'야. ${b}를 2번 곱한 수와 3번 곱한 수를 곱하면 ${b}를 2 + 3 = 5번 곱한 수가 되지? 그래서 log끼리 더하기 = 안의 수끼리 곱하기. ${M} × ${Nn} = ${M * Nn}, ${b}를 ${k}번 곱하면 ${M * Nn}. 답은 ${k}!`;
        return Q(k, [
          { v: L(M + Nn), why: `안의 수끼리 더했어. log끼리 더할 때는 안의 수끼리 '곱해야' 해: ${M} × ${Nn}.` },
          { v: M * Nn, why: `${M} × ${Nn} = ${M * Nn}까지 맞아! 이제 ${b}를 몇 번 곱해야 ${M * Nn}가 되는지 세야 해.` },
          { v: fr(M * Nn, b), why: `${M * Nn} ÷ ${b}를 했어. log는 나누기가 아니라 '${b}를 몇 번 곱했나'를 세는 거야.` },
        ], whySum, {
          q: `${L(M)} + ${L(Nn)}의 값은 얼마일까?`, need,
          help: '📖 logₐ □ = a를 몇 번 곱해야 □인지(곱한 횟수). log끼리 더하기 = 곱한 횟수 합치기',
          steps: easy ? [`${L(M)}: ${b}를 ${i}번 곱하면 ${M} → ${i}`, `${L(Nn)}: ${b}를 ${j}번 곱하면 ${Nn} → ${j}`, `${i} + ${j} = ${k}`, `확인: ${M} × ${Nn} = ${M * Nn} = ${b}를 ${k}번 곱한 수`]
            : [`안의 수끼리 곱하기: ${M} × ${Nn} = ${M * Nn}`, `${b}를 몇 번 곱하면 ${M * Nn}?`, `${chain(b, k)} = ${M * Nn} → ${k}번`],
          viz: powTable(b, k) });
      }
      const [b, M, Nn, k] = pick([[2, 24, 3, 3], [2, 40, 5, 3], [3, 54, 2, 3], [10, 500, 5, 2], [5, 50, 2, 2], [2, 48, 3, 4], [3, 36, 4, 2]]);
      const L = (x) => `log${sub(b)} ${x}`;
      return Q(k, [
        { v: L(M - Nn), why: `안의 수끼리 뺐어. log끼리 뺄 때는 안의 수끼리 '나눠야' 해: ${M} ÷ ${Nn}.` },
        { v: M / Nn, why: `${M} ÷ ${Nn} = ${M / Nn}까지 맞아! 이제 ${b}를 몇 번 곱해야 ${M / Nn}가 되는지 세야 해.` },
        { v: L(M * Nn), why: `빼기인데 안의 수끼리 곱했어. 곱하기는 log끼리 '더할' 때야.` },
      ], `log는 '${b}를 곱한 횟수'야. 나누면 같은 ${b}끼리 지워져서 곱한 횟수가 빠지지? 그래서 log끼리 빼기 = 안의 수끼리 나누기야. ${M} ÷ ${Nn} = ${M / Nn}, ${b}를 ${k}번 곱하면 ${M / Nn}. 답은 ${k}!`, {
        q: `${L(M)} − ${L(Nn)}의 값은 얼마일까?`, need,
        help: '📖 logₐ □ = a를 몇 번 곱해야 □인지(곱한 횟수). log끼리 빼기 = 곱한 횟수 덜어 내기',
        steps: [`안의 수끼리 나누기: ${M} ÷ ${Nn} = ${M / Nn}`, `${b}를 몇 번 곱하면 ${M / Nn}?`, `${chain(b, k)} = ${M / Nn} → ${k}번`],
        viz: powTable(b, k) });
    }),

  skill('m_deriv', 11, '미분과 접선의 기울기', '미분 = 곡선을 아주 잘게 자른 한 조각의 기울기("바로 이 순간" 얼마나 빨리 변하는지). 재 보면 xⁿ은 n × xⁿ⁻¹이 나와 (위 작은 수를 앞으로 내려 곱하고 1 줄여).',
    '움직이는 물체의 "바로 이 순간" 빠르기를 알고 싶어서, 약 350년 전 뉴턴과 라이프니츠가 미분을 만들었어.', (st, need) => {
      /* 2026-10-24 점검: 규칙 전에 '아주 작은 조각의 기울기'를 사칙연산으로 보여 준다 (0.1초·0.01초 동안 간 거리 ÷ 시간) */
      if (st) {
        const a = rand(1, 3), t = rand(2, 5), v = 2 * a * t;
        const base = { type: 'plot', x: [0, t + 1], y: [0, a * (t + 1) ** 2 + 1], xl: '시간 t(초)', yl: '간 거리(m)' };
        const pts = [{ x: t, y: a * t * t, label: `${t}초: ${a * t * t}m`, lx: -40 }], picPts = [{ x: t, y: a * t * t, label: `${t}초`, lx: -24 }];
        const aPre = a === 1 ? '' : `${a} × `;
        const d1 = dec(a * (10 * t + 1) ** 2, 100), gone = dec(a * (20 * t + 1), 100), s1 = dec(a * (20 * t + 1), 10), s2 = dec(a * (200 * t + 1), 100);
        return Q(v, [
          { v: a * t * t, why: `그건 ${t}초까지 간 거리야. 속력은 '아주 짧은 시간 동안 간 거리 ÷ 그 시간'으로 재.` },
          { v: a * t, why: `간 거리 ÷ 시간, 처음부터의 평균 빠르기를 구했어. 점점 빨라지는 중이라 ${t}초 그 순간은 더 빨라.` },
          { v: 2 * a, why: `속력 식 ${mono(2 * a, 1, 't')}는 맞았어! 그런데 t = ${t}를 넣는 걸 빠뜨렸어: ${2 * a} × ${t}.` },
        ], `순간 속력 = 아주 짧은 시간에 간 거리 ÷ 그 시간. ${t}초부터 0.1초 동안 재면 초속 ${s1}m, 0.01초면 ${s2}m, 시간을 줄일수록 ${v}m에 다가가. 지름길(미분): ${mono(a, 2, 't')}의 위 수 2를 앞으로 내려 곱하면 ${mono(2 * a, 1, 't')}, t = ${t}이면 ${2 * a} × ${t} = ${v}!`, {
          q: `피카츄가 출발하고 t초 동안 ${mono(a, 2, 't')} m를 달려. 딱 ${t}초가 된 순간의 속력은 초속 몇 m?`, unit: 'm', need,
          help: '📖 t² = t × t. 순간 속력 = 바로 그 순간의 빠르기. 아주 짧은 시간 동안 간 거리 ÷ 그 시간으로 재',
          pic: { ...base, fns: [{ f: `${a}*x^2`, label: '간 거리', lx: rd(t * 0.55) }], pts: picPts, anim: false },
          more: [{ v: 2 * a * t * t, why: `2를 앞으로 내려 곱했는데 위 작은 수를 1 줄이지 않았어. ${mono(a, 2, 't')}의 미분은 ${ya(mono(2 * a, 1, 't'))}.` }],
          steps: [`${t}초: ${aPre}${t} × ${t} = ${a * t * t}m`, `${t}.1초: ${aPre}${t}.1 × ${t}.1 = ${d1}m`, `0.1초 동안: ${d1} − ${a * t * t} = ${gone}m`,
            `${gone} ÷ 0.1 = 초속 ${s1}m`, `0.01초로 재면 ${s2} → ${v}에 다가가 (= ${2 * a} × ${t})`],
          viz: { ...base, fns: [{ f: `${a}*x^2`, label: '간 거리', lx: rd(t * 0.55) }, { f: `${v}*(x-${t})+${a * t * t}`, label: `기울기 = 속력 ${v}`, c: 'b', lx: rd(t + 0.6) }], pts } });
      }
      const kind = pick(['mono', 'poly', 'tan']);
      /* 2026-10-24 2차 점검 G13: 규칙의 이유는 강의 6장 그림 그대로 — 정사각형 x²의 변을 살짝 늘리면 길이 x인 띠 2장,
       * 주사위 x³이면 x × x 판 3장이 붙는다. (x² 를 재 보고 x³ 으로 건너뛰던 '늘 이렇게 나와'를 없앴다) */
      const grow = (n) => (n === 2 ? '한 변 x인 정사각형(넓이 x²)을 살짝 키우면 길이 x인 띠 2장이 붙어서 x²이 느는 빠르기는 2x'
        : n === 3 ? '한 변 x인 주사위(부피 x³)를 살짝 키우면 x × x 판 3장이 붙어서 x³이 느는 빠르기는 3x²'
          : `정사각형 x²엔 띠 2장, 주사위 x³엔 판 3장이 붙듯 x${sup(n)}엔 ${n}장이 붙어서 x${sup(n)}이 느는 빠르기는 ${n}x${sup(n - 1)}`);
      const growStep = (n) => (n === 2 ? '정사각형 x²: 띠 2장 → 2x' : n === 3 ? '주사위 x³: 판 3장 → 3x²' : `x${sup(n)}: ${n}장 → ${n}x${sup(n - 1)}`);
      /* 강의 6장 그림: 정사각형(넓이 x × x)에 띠 2장 */
      const strips = { type: 'plot', x: [0, 4.8], y: [0, 4.6], h: 347, step: 100, segs: [
        { x1: 0.5, y1: 0.5, x2: 3.5, y2: 0.5, c: 'a' }, { x1: 3.5, y1: 0.5, x2: 3.5, y2: 3.5, c: 'a' }, { x1: 3.5, y1: 3.5, x2: 0.5, y2: 3.5, c: 'a' }, { x1: 0.5, y1: 3.5, x2: 0.5, y2: 0.5, c: 'a' },
        { x1: 3.5, y1: 0.5, x2: 4, y2: 0.5, c: 'b' }, { x1: 4, y1: 0.5, x2: 4, y2: 3.5, c: 'b' }, { x1: 4, y1: 3.5, x2: 3.5, y2: 3.5, c: 'b' },
        { x1: 0.5, y1: 3.5, x2: 0.5, y2: 4, c: 'b' }, { x1: 0.5, y1: 4, x2: 3.5, y2: 4, c: 'b' }, { x1: 3.5, y1: 4, x2: 3.5, y2: 3.5, c: 'b' },
        { x1: 2, y1: 2, x2: 2, y2: 2, label: '넓이 x × x', c: 'a' }, { x1: 2, y1: 0.5, x2: 2, y2: 0.5, label: 'x', ly: 14, c: 'a' }, { x1: 0.5, y1: 2, x2: 0.5, y2: 2, label: 'x', lx: -12, c: 'a' },
        { x1: 3.75, y1: 2, x2: 3.75, y2: 2, label: '띠 1', c: 'b' }, { x1: 2, y1: 3.75, x2: 2, y2: 3.75, label: '띠 2 (길이 x)', c: 'b' }] };
      if (kind === 'mono') {
        const a = rand(1, 5) * sgn(), n = rand(2, 5), f = mono(a, n), ans = mono(n * a, n - 1);
        return Q(ans, [
          { v: mono(a, n - 1), why: `위 작은 수만 1 줄이고, ${n}을(를) 앞으로 내려 곱하는 걸 빠뜨렸어. ${N(a)} × ${n}도 해야 해.` },
          { v: mono(n * a, n), why: `${n}을(를) 앞에 곱한 건 좋아! 그런데 위 작은 수를 1 줄이지 않았어: ${n} → ${n - 1}.` },
          { v: mono(n * a, n + 1), why: `위 작은 수를 1 올렸어. 미분은 위 수를 1 '줄여': ${n} − 1 = ${n - 1}. 그래서 ${ya(ans)}.` },
        ], `${grow(n)}. 앞의 수도 곱해: ${N(a)} × ${n} = ${N(n * a)}, 위 수는 ${n} − 1 = ${n - 1} → f'(x) = ${ans}.`, {
          q: `f(x) = ${f}일 때 f'(x)는?`, need,
          /* 푸는 방법을 넘겨주는 예(x⁶ → 6x⁵)는 뺐다. 기호 뜻만 푼다 */
          /* 문제의 거듭제곱(x², x⁴ …)을 푼다 — x³ 으로 고정하면 x² 문제에 없는 기호를 풀게 된다 (검증 2026-10-24) */
          help: `📖 f(x) = x를 넣어 나온 값. f'(x) = 그 값이 느는 빠르기. x${sup(n)} = x를 ${n}번 곱한 것${a < 0 ? '. −□ = 0보다 작은 수' : ''}`,
          more: [{ v: `(${fr(a, n + 1)})x${sup(n + 1)}`, why: `위 작은 수를 1 올리고 그 수로 나눴어(넓이를 구하는 적분 방법이야). 미분은 위 수를 앞으로 내려 곱하고 1 줄여.` }],
          gen: () => { const c = rand(1, 25) * sgn(), e = rand(1, 5); return { v: mono(c, e), why: `규칙대로라면 이 답이 나오지 않아. 앞의 수 × 위 작은 수, 위 작은 수 − 1을 차례로 해 보자.` }; },
          steps: [growStep(n), `앞의 수 곱하기: ${N(a)} × ${n} = ${N(n * a)}`, `위 작은 수 1 줄이기: ${n} − 1 = ${n - 1}`, `f'(x) = ${ans}`],
          viz: n === 2 ? strips : { type: 'table', head: ['', '앞의 수', '위 작은 수'], rows: [['f(x)', N(a), String(n)], ["f'(x)", `${N(a)} × ${n} = ${N(n * a)}`, `${n} − 1 = ${n - 1}`]], hi: 1 } });
      }
      if (kind === 'poly') {
        const b = nz(-5, 5), c = nz(-9, 9), d = rand(1, 9);
        const f = poly([[1, 3], [b, 2], [c, 1], [d, 0]]), ans = poly([[3, 2], [2 * b, 1], [c, 0]]);
        return Q(ans, [
          { v: poly([[1, 2], [b, 1], [c, 0]]), why: `위 작은 수만 1씩 줄이고 앞으로 내려 곱하지 않았어. x³ → 3x², ${mono(b, 2)} → ${ya(mono(2 * b, 1))}.` },
          { v: poly([[3, 2], [b, 1], [c, 0]]), why: `${mono(b, 2)}에서 2를 앞으로 내려 곱하지 않았어. ${mono(b, 2)} → ${ya(mono(2 * b, 1))}.` },
          { v: poly([[3, 2], [2 * b, 1], [c + d, 0]]), why: `맨 끝의 수 ${d}도 남겼어. 혼자 있는 수는 x가 변해도 그대로라 느는 빠르기가 0이야.` },
        ], `덩어리마다 따로 해. 살짝 키우면 주사위 x³엔 판 3장, 정사각형 x²엔 띠 2장이 붙어 x³ → 3x², x² → 2x. ${mono(b, 2)} → ${mono(2 * b, 1)}, ${mono(c, 1)} → ${N(c)}, 혼자 있는 수 ${d}는 안 변해 0. 모으면 ${ans}.`, {
          q: `f(x) = ${f}일 때 f'(x)는?`, need,
          help: `📖 f(x) = x를 넣어 나온 값. f'(x) = 그 값이 느는 빠르기. x³ = x × x × x${b < 0 || c < 0 ? '. −□ = 0보다 작은 수' : ''}`,
          gen: () => { const u = rand(1, 10) * sgn(), w = rand(1, 9) * sgn(); return { v: poly([[3, 2], [u, 1], [w, 0]]), why: `항을 하나씩 다시 미분해 보자. x³ → 3x²부터 차례로!` }; },
          steps: ['x³ → 3x² (판 3장)', `${mono(b, 2)} → ${mono(2 * b, 1)} (띠 2장: 2 × ${P(b)} = ${N(2 * b)})`, `${mono(c, 1)} → ${N(c)} (x가 1 늘 때 ${N(c)}씩)`, `${d} → 0 (안 변해)`, `f'(x) = ${ans}`],
          viz: { type: 'table', head: ['항', '미분하면'], rows: [['x³', '3x²'], [mono(b, 2), mono(2 * b, 1)], [mono(c, 1), N(c)], [String(d), '0']] } });
      }
      const b = nz(-5, 5), k = nz(-4, 4), f = poly([[1, 2], [b, 1]]), ans = 2 * k + b;
      const fx = (x) => x * x + b * x, xa = Math.min(k, 0) - 2, xb = Math.max(k, 0) + 2;
      const vx = Math.max(xa, Math.min(xb, -b / 2));
      const ylo = Math.floor(Math.min(fx(xa), fx(xb), fx(vx))) - 1, yhi = Math.ceil(Math.max(fx(xa), fx(xb))) + 1;
      const fS = `x^2${sgnT(b, 'x')}`, pt = [{ x: k, y: k * k + b * k, label: `x = ${N(k)}`, ly: -16 }];
      const base = { type: 'plot', x: [xa, xb], y: [ylo, yhi] };
      const dS = `2x ${b < 0 ? MI : '+'} ${Math.abs(b)}`;
      return Q(ans, [
        { v: k * k + b * k, why: `${N(k * k + b * k)}은 그 점의 높이(y 값)야. 기울기는 미분한 식에 ${N(k)}를 넣어 구해.` },
        { v: k + b, why: `x²을 x로 만들었어. 정사각형을 살짝 키우면 띠가 2장 붙어서 x²은 2x가 돼야 해.` },
        { v: 2 * k, why: `${mono(b, 1)}의 몫 ${N(b)}를 빠뜨렸어. x가 1 늘 때 ${mono(b, 1)}은(는) ${N(b)}씩 변해서 미분한 식은 ${ya(dS)}.` },
      ], `접선 기울기 = 그 점에서 곡선이 오르는 빠르기야. x²은 정사각형을 살짝 키울 때 띠 2장이 붙어 2x, ${mono(b, 1)}은(는) x가 1 늘 때 ${N(b)}씩이라 ${N(b)}. 미분한 식 ${dS}에 x = ${N(k)}를 넣으면 2 × ${P(k)} ${b < 0 ? MI : '+'} ${Math.abs(b)} = ${N(ans)}.`, {
        q: `곡선 y = ${f} 위의 x = ${N(k)}인 점에서, 곡선에 살짝 닿는 직선(접선)의 기울기는?`, need,
        /* '미분한 식에 x를 넣은 값'은 푸는 방법이라 뺐다 (2026-10-24 2차 점검) */
        help: '📖 접선 = 곡선에 한 점에서만 살짝 닿는 직선. 기울기 = 옆으로 한 칸 갈 때 위로 가는 칸 수',
        pic: { ...base, fns: [{ f: fS, label: `y = ${f}`, lx: rd(xb - 1) }], pts: pt, anim: false },
        more: [{ v: b, why: `미분한 식 ${dS}에 ${N(k)}를 넣지 않고 끝의 수 ${N(b)}만 답했어.` },
          { v: 2 * k * k + b * k, why: `x²을 2x²으로 바꾸고 멈췄어. 2를 앞으로 내린 뒤 위 작은 수를 1 줄여야 해: x² → 2x.` }],
        steps: ['x² → 2x (띠 2장)', `${mono(b, 1)} → ${N(b)} (x가 1 늘 때 ${N(b)}씩)`, `미분한 식: ${dS}`, `x = ${N(k)}: 2 × ${P(k)} = ${N(2 * k)}`, `${N(2 * k)} ${b < 0 ? MI : '+'} ${Math.abs(b)} = ${N(ans)}`],
        viz: { ...base, fns: [{ f: fS, label: `y = ${f}`, lx: rd(xb - 1) }, { f: `(${ans})*(x-(${k}))+(${k * k + b * k})`, label: `접선 기울기 ${N(ans)}`, c: 'b', lx: rd(k + 1) }], pts: pt } });
    }),

  /* ───────── 고3 ───────── */
  skill('m_integral', 12, '정적분과 넓이', '정적분 = 그래프 아래를 아주 얇은 막대로 쪼개 모두 더한 넓이. 지름길: xⁿ을 xⁿ⁺¹ ÷ (n+1)로 바꾸고 (끝 값) − (시작 값).',
    '구불구불한 땅의 넓이나 달린 거리를 알고 싶어서, 잘게 쪼개 더하는 적분을 만들었어. 미분과 짝꿍이야.', (st, need) => {
      /* 2026-10-24 점검: 규칙 전에 '얇은 막대를 더하면 넓이'를 보여 준다 (plot rects). 삼각형 넓이로 규칙을 확인한다 */
      const strips = (f, a, b, n) => { const w = (b - a) / n; let s = 0; for (let i = 0; i < n; i++) s += f(a + (i + 0.5) * w) * w; return s; };
      const about = (v) => (Math.abs(v - rd(v)) < 1e-9 ? String(rd(v)) : `약 ${rd(v)}`);
      if (st) {
        const c = pick([2, 4]), k = rand(2, 5), ans = c * k * k / 2;
        const hs = Array.from({ length: k }, (_, i) => c * (2 * i + 1) / 2); // 1초마다 그 1초 가운데의 빠르기
        const base = { type: 'plot', x: [0, k + 1], y: [0, c * (k + 1)], xl: '시간 t(초)', yl: '초속(m)', fns: [{ f: `${c}*x`, label: `속력 ${mono(c, 1, 't')}`, lx: rd((k + 1) * 0.3) }] };
        const seg = [{ x1: k, y1: 0, x2: k, y2: c * k, dash: true, label: `${c * k}`, lx: 16 }];
        return Q(ans, [
          { v: c * k, why: `${k}초일 때의 속력 ${c * k}를 답했어. 달린 거리는 1초씩 막대 넓이를 모두 더한 값이야.` },
          { v: c * k * k, why: `삼각형 넓이에서 ÷ 2를 빠뜨렸어. 밑변 × 높이는 네모 넓이라 반으로 나눠야 해.` },
          { v: c, why: `1초마다 빨라지는 양 ${c}를 답했어. 거리는 속력 그래프 아래 넓이로 구해.` },
        ], `달린 거리 = 빠르기 × 시간이야. 빠르기가 변하니까 1초씩 잘라 막대로 생각해. 1초마다 가운데 빠르기(${hs.join(', ')})로 달린 셈, 더하면 ${ans}m. 그래프 아래 삼각형 넓이 ${k} × ${c * k} ÷ 2 = ${ans}와 똑같아! 이렇게 잘게 쪼개 더하는 게 적분이야.`, {
          q: `피카츄가 t초일 때 초속 ${mono(c, 1, 't')} m로 점점 빨라지며 달려. 0초부터 ${k}초까지 달린 거리는?`, unit: 'm', need,
          help: '📖 달린 거리 = 속력 그래프 아래 넓이. 삼각형 = 네모(밑변 × 높이)를 반으로 자른 모양',
          pic: { ...base, shade: { f: `${c}*x`, a: 0, b: k, label: '거리 = ?' }, segs: [{ x1: k, y1: 0, x2: k, y2: c * k, dash: true }], anim: false },
          more: [{ v: c * k * (k + 1) / 2, why: `1초마다 그 1초가 끝날 때의 속력으로 막대를 세워 더했어. 그러면 막대가 그래프 위로 삐져나와. 1초의 가운데 빠르기로 세워야 해.` }],
          steps: [`1초씩 막대 ${k}개로 쪼개기`, `막대 높이(1초의 가운데 빠르기): ${hs.join(', ')}`, `막대 넓이 더하기: ${hs.join(' + ')} = ${ans}`, `삼각형으로 확인: ${k} × ${c * k} ÷ 2 = ${ans}m`],
          viz: { ...base, shade: { f: `${c}*x`, a: 0, b: k, label: `거리 ${ans}m` }, rects: { f: `${c}*x`, a: 0, b: k, n: k }, segs: seg } });
      }
      if (Math.random() < 0.5) {
        const n = rand(1, 2), m = rand(1, 2), cc = (n + 1) * m, k = rand(2, 3), ans = m * k ** (n + 1);
        const F = mono(m, n + 1), fn = (x) => cc * x ** n;
        const base = { type: 'plot', x: [0, k + 0.5], y: [0, rd(cc * (k + 0.5) ** n)], fns: [{ f: `${cc}*x^${n}`, label: `y = ${mono(cc, n)}`, lx: rd(k * 0.8) }] };
        const S1 = about(strips(fn, 0, k, k)), S2 = about(strips(fn, 0, k, 2 * k));
        const mPre = m === 1 ? '' : `${m} × `;
        const why = n === 1
          ? `정적분 = 그래프 아래를 아주 얇은 막대로 쪼개 모두 더한 넓이야. y = ${mono(cc, 1)} 아래는 삼각형이라 ${k} × ${cc * k} ÷ 2 = ${ans}. 지름길 규칙(위 작은 수를 1 올리고 그 수로 나누기)도 같아: ${mono(cc, 1)} → ${F}, x = ${k}을 넣으면 ${ans}, 0을 넣으면 0.`
          : `정적분 = 그래프 아래를 아주 얇은 막대로 쪼개 모두 더한 넓이야. 막대 ${k}개면 ${S1}, ${2 * k}개면 ${S2}, 잘게 할수록 ${ans}에 다가가. 지름길: 위 작은 수를 1 올리고 그 수로 나눠 ${mono(cc, n)} → ${F}. x = ${k}을 넣으면 ${ans}, 0을 넣으면 0.`;
        return Q(ans, [
          { v: cc * k ** (n + 1), why: `위 작은 수는 1 올렸는데 ${n + 1}로 나누는 걸 빠뜨렸어. ${mono(cc, n)}의 적분은 ${ya(F)}.` },
          { v: cc * k ** n, why: `x = ${k}일 때의 그래프 높이 ${cc * k ** n}를 답했어. 정적분은 높이가 아니라 그래프 아래 넓이야.` },
          { v: cc * n * k ** (n - 1), why: `미분을 했어. 적분은 거꾸로 위 작은 수를 1 올리고 그 수로 나눠.` },
        ], why, {
          q: `∫₀${sup(k)} ${mono(cc, n)} dx의 값은?`, need,
          /* 푸는 방법(규칙 xⁿ → xⁿ⁺¹ ÷ (n+1))은 넘겨주지 않는다: 기호 뜻만 (2026-10-24 2차 점검) */
          help: `📖 ∫₀${sup(k)} … dx = 0부터 ${k}까지 그래프 아래 넓이 (∫ = 얇은 막대를 모두 더하기, dx = 막대의 아주 얇은 폭)`,
          pic: { ...base, shade: { f: `${cc}*x^${n}`, a: 0, b: k, label: '넓이 = ?' }, anim: false },
          more: [{ v: m * k ** n, why: `${n + 1}로 나누긴 했는데 위 작은 수를 1 올리지 않았어. ${mono(cc, n)}의 적분은 ${ya(F)}.` },
            { v: fr(cc * k ** (n + 1), n), why: `위 작은 수를 올린 뒤 원래 수 ${n}로 나눴어. 올린 수 ${n + 1}로 나눠야 해.` }],
          steps: n === 1
            ? [`그래프 아래는 삼각형 (밑변 ${k}, 높이 ${cc * k})`, `${k} × ${cc * k} ÷ 2 = ${ans}`, `지름길: ${mono(cc, 1)} → ${F} (${cc} ÷ 2 = ${m})`, `x = ${k} 넣기: ${mPre}${k} × ${k} = ${ans}`, `x = 0이면 0 → ${ans} − 0 = ${ans}`]
            : [`막대 ${k}개: ${S1}, 막대 ${2 * k}개: ${S2}`, `지름길: ${mono(cc, n)} → ${F} (${cc} ÷ 3 = ${m})`, `${k}³ = ${chain(k, 3)} = ${k ** 3}`, ...(m > 1 ? [`${m} × ${k ** 3} = ${ans}`] : []), `x = 0이면 0 → ${ans} − 0 = ${ans}`],
          viz: { ...base, shade: { f: `${cc}*x^${n}`, a: 0, b: k, label: `넓이 ${ans}` }, rects: { f: `${cc}*x^${n}`, a: 0, b: k, n: 2 * k } } });
      }
      const a = rand(1, 4), b = rand(a + 1, 5), ans = b * b - a * a;
      const base = { type: 'plot', x: [0, b + 1], y: [0, 2 * (b + 1)], fns: [{ f: '2*x', label: 'y = 2x', lx: rd(a / 2 + 0.3) }] };
      return Q(ans, [
        { v: b * b + a * a, why: `두 삼각형 넓이를 더했어. ${a}~${b} 넓이는 큰 삼각형에서 작은 삼각형을 '빼야' 남아.` },
        { v: a * a - b * b, why: `작은 삼각형에서 큰 삼각형을 뺐어. 큰 삼각형(0~${b}) − 작은 삼각형(0~${a}) 순서야.` },
        { v: 2 * b - 2 * a, why: `넓이가 아니라 그래프 높이(${2 * b}와 ${2 * a})의 차이를 구했어. 막대 넓이를 모두 더한 넓이를 구해야 해.` },
      ], `y = 2x 아래 0부터 ${b}까지는 삼각형: ${b} × ${2 * b} ÷ 2 = ${b * b}. 0부터 ${a}까지 삼각형은 ${a} × ${2 * a} ÷ 2 = ${a * a}. 큰 것에서 작은 것을 빼면 ${a}~${b} 넓이 ${b * b} − ${a * a} = ${ans}. 그래서 적분은 '(끝 값) − (시작 값)'이고, 2x의 넓이 식은 x²이야.`, {
        q: `∫${sub(a)}${sup(b)} 2x dx의 값은?`, need,
        help: `📖 ∫${sub(a)}${sup(b)} 2x dx = x가 ${a}~${b}일 때 y = 2x 아래 넓이 (∫ = 얇은 막대 모두 더하기, dx = 막대의 얇은 폭)`,
        pic: { ...base, shade: { f: '2*x', a, b, label: '넓이 = ?' }, anim: false },
        steps: [`0~${b} 삼각형: ${b} × ${2 * b} ÷ 2 = ${b * b}`, `0~${a} 삼각형: ${a} × ${2 * a} ÷ 2 = ${a * a}`, `큰 것 − 작은 것: ${b * b} − ${a * a} = ${ans}`, `지름길: 2x → x², ${b}² − ${a}² = ${ans}`],
        viz: { ...base, shade: { f: '2*x', a, b, label: `넓이 ${ans}` }, rects: { f: '2*x', a, b, n: 2 * (b - a) } } });
    }),
];

export const MATH_ADV_BY = Object.fromEntries(MATH_ADV.map((s) => [s.id, s]));

/* ── 기존 36개 기술의 1분 개념 카드 (math.js MATH 와 id 가 같다) ── */
export const NOTES = {
  m_count: { idea: '하나씩 짚으며 세면 마지막에 센 수가 전체 개수야.', need: '포켓몬이 몇 마리인지, 몬스터볼이 몇 개 남았는지 알려면 세야 해.' },
  m_compare10: { idea: '수직선에서 오른쪽에 있을수록 큰 수야.', need: '누구 레벨이 더 높은지, 어느 쪽이 더 많은지 비교할 때 써.' },
  m_add10: { idea: '더하기는 두 묶음을 합치는 거야. 큰 수에서 이어 세면 쉬워.', need: '나무열매를 또 받았을 때 모두 몇 개인지 알 수 있어.' },
  m_sub10: { idea: '빼기는 덜어 내고 남은 걸 세는 거야.', need: '몬스터볼을 던지고 몇 개 남았는지 알 때 필요해.' },
  m_make10: { idea: '두 수를 모아 10을 만드는 짝(1과 9, 2와 8…)을 기억해.', need: '10을 만드는 짝을 알면 큰 수 덧셈·뺄셈이 빨라져.' },
  m_add_carry1: { idea: '10을 먼저 만들고 남은 수를 더해(10 만들기 작전).', need: '10이 넘는 개수를 빠르게 합칠 수 있어.' },
  m_sub_borrow1: { idea: '모자라면 10에서 빌려 와서 빼.', need: '가진 돈에서 값을 치르고 남은 돈을 셀 때 써.' },
  m_place2: { idea: '십의 자리는 10묶음, 일의 자리는 낱개를 나타내.', need: '큰 수를 읽고 쓰려면 자리마다 뜻을 알아야 해.' },
  m_add2d1d: { idea: '일의 자리부터 더하고 10이 넘으면 십의 자리로 1을 올려.', need: '레벨이 오를 때, 점수를 더할 때 써.' },
  m_clock_half: { idea: '짧은바늘은 시, 긴바늘은 분. 긴바늘이 6이면 30분이야.', need: '약속 시간, 만화 시작 시간을 알 수 있어.' },
  m_add2d2d: { idea: '같은 자리끼리 더하고, 10이 넘으면 윗자리로 올려.', need: '두 무리의 포켓몬 수처럼 큰 수를 합칠 때 써.' },
  m_sub2d2d: { idea: '일의 자리가 모자라면 십의 자리에서 10을 빌려 와.', need: '돈을 쓰고 남은 돈을 계산할 때 꼭 필요해.' },
  m_place3: { idea: '백·십·일의 자리. 빈자리는 0으로 자리를 지켜.', need: '가격, 인구처럼 세 자리 이상인 수를 읽을 수 있어.' },
  m_mul_concept: { idea: '곱셈은 같은 수를 여러 번 더하는 것을 짧게 쓴 거야.', need: '상자 여러 개에 든 몬스터볼을 한 번에 셀 수 있어.' },
  m_times_a: { idea: '2·5·3·4단은 같은 수씩 뛰어 세기야.', need: '곱셈구구를 외우면 물건 값·개수 계산이 순식간이야.' },
  m_times_b: { idea: '6·7·8·9단은 아는 단에서 한 번 더 더하면 나와.', need: '큰 곱셈과 나눗셈의 밑바탕이 돼.' },
  m_length: { idea: '1m = 100cm. 단위를 맞춘 뒤 계산해.', need: '키, 포켓몬 몸길이, 방 크기를 잴 때 써.' },
  m_clock_min: { idea: '긴바늘의 숫자 하나는 5분이야.', need: '몇 시 몇 분까지 정확히 알아야 늦지 않아.' },
  m_add3d: { idea: '일→십→백의 자리 순서로 더하고 넘치면 올려.', need: '방문자 수, 점수처럼 큰 수를 합칠 때 써.' },
  m_sub3d: { idea: '모자란 자리는 바로 윗자리에서 10을 빌려 와.', need: '가게에서 거스름돈을 계산할 수 있어.' },
  m_mul_2d1d: { idea: '두 자리 수를 십과 일로 나눠 각각 곱한 뒤 더해.', need: '물건 여러 개의 값을 한 번에 구할 때 써.' },
  m_div_concept: { idea: '나눗셈은 똑같이 나눠 한 사람 몫을 구하는 거야.', need: '간식을 친구들과 공평하게 나눌 때 써.' },
  m_div_facts: { idea: '나눗셈은 곱셈을 거꾸로 생각하면 돼.', need: '팀을 몇 개 만들 수 있는지 금방 알 수 있어.' },
  m_frac_concept: { idea: '분모는 전체 조각 수, 분자는 그중 고른 조각 수야.', need: '피자·케이크를 나눈 양을 정확히 말할 수 있어.' },
  m_frac_compare: { idea: '분자가 1로 같으면 분모가 작을수록 한 조각이 커.', need: '나눠 먹을 때 누가 더 많이 먹는지 알 수 있어.' },
  m_decimal: { idea: '0.1은 1을 10조각 낸 한 조각이야.', need: '키, 몸무게, 달리기 기록처럼 딱 떨어지지 않는 양을 쓸 때 써.' },
  m_time_calc: { idea: '60분이 모이면 1시간으로 올라가.', need: '언제 끝나는지, 얼마나 걸리는지 계산할 때 써.' },
  m_bignum: { idea: '10000이 10개면 10만. 네 자리씩 끊어 읽어.', need: '인구, 돈처럼 아주 큰 수를 읽고 비교할 수 있어.' },
  m_mul_2d2d: { idea: '한 수를 십과 일로 쪼개 부분곱을 구해 더해.', need: '버스 여러 대의 승객 수처럼 큰 곱을 구할 때 써.' },
  m_div_rem: { idea: '나머지는 항상 나누는 수보다 작아야 해.', need: '가방에 담고 남는 물건 수를 알 때 써.' },
  m_frac_add: { idea: '분모가 같으면 분자끼리만 더해. 조각 크기는 그대로야.', need: '나눠 먹은 양을 합칠 때 써.' },
  m_dec_add: { idea: '소수점 자리를 맞춰 더해. 0.1이 10개면 1이야.', need: '마신 물의 양, 기록의 합처럼 소수를 합칠 때 써.' },
  m_angle: { idea: '직각은 90°, 일직선은 180°, 삼각형 세 각의 합은 180°야.', need: '물건을 만들거나 길을 꺾을 때 각도를 알아야 해.' },
  m_frac_diff: { idea: '분모가 다르면 먼저 통분해서 조각 크기를 맞춰.', need: '서로 다르게 나눈 양을 합칠 때 꼭 필요해.' },
  m_area: { idea: '넓이 = 가로 × 세로. 1칸짜리 정사각형이 몇 개 들어가나야.', need: '방에 깔 매트, 목장 크기를 계산할 때 써.' },
  m_average: { idea: '평균은 모두 더해 개수로 나눈, 고르게 나눈 값이야.', need: '여러 번의 기록을 한 수로 대표할 때 써.' },
};
