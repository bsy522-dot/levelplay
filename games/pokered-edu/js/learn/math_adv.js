/* 심화 수학 문제 생성기 (6학년 ~ 고3 미적분).
 * math.js 의 mc() 를 그대로 쓴다. 틀린 보기 = 아이들이 실제로 하는 실수를 계산한 값, 보기마다 '왜 틀렸는지' 설명.
 * 모든 보기는 글자(문자열)로 만든다: 음수는 진짜 빼기 기호 '−'(U+2212)로 쓰고, 분수는 약분해서 쓴다.
 * 반환: { q, a[4], c, why, wrong{i: 설명}, viz, pic, steps[], need } */
import { mc } from './math.js';
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
      return { v: N(v), why: `${N(v)}는 정답보다 ${Math.abs(d)}만큼 ${d > 0 ? '커' : '작아'}. 마지막 계산을 한 줄씩 다시 확인해 보자.` };
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
  return { v: s, why: `${s}는 계산 과정에서 나오지 않는 값이야. 풀이를 처음부터 한 줄씩 다시 따라가 보자.` };
};

/* ── 심화 기술 목록: 쉬운 것 -> 어려운 것 ── */
function skill(id, g, t, idea, need, fn) {
  return { id, g, t, idea, need, gen: (st) => { const r = fn(!!st, need); if (!r.need) r.need = need; return r; } };
}

export const MATH_ADV = [
  /* ───────── 6학년 ───────── */
  skill('m_int_add', 6, '정수의 덧셈', '부호가 같으면 절댓값을 더하고 그 부호를, 부호가 다르면 절댓값끼리 빼고 큰 쪽 부호를 붙여.',
    '영하의 기온, 지하 층수, 빚처럼 0보다 작은 양을 계산할 때 꼭 필요해.', (st, need) => {
      const kind = pick(['nn', 'np', 'pn']);
      const a = rand(2, 9); let b = rand(2, 9); while (b === a) b = rand(2, 9);
      const x = kind === 'pn' ? a : -a, y = kind === 'np' ? b : -b, s = x + y;
      let wrongs, why, steps, q, unit = '';
      if (kind === 'nn') {
        wrongs = [
          { v: a + b, why: `음수 부호를 빼먹었어. 빚에 빚을 더하면 빚이 더 커지듯, 음수끼리 더하면 더 작은 음수가 된단다.` },
          { v: b - a, why: `앞의 ${N(-a)}는 지키고 뒤의 ${N(-b)}를 +${b}로 바꿔 버렸어. 괄호 속 부호는 그대로 가져가야 해.` },
          { v: a - b, why: `앞의 ${N(-a)}를 +${a}로 읽었구나. 두 수 모두 음수라서 둘 다 왼쪽으로 가야 해.` },
        ];
        why = `수직선에서 ${N(x)}에서 왼쪽으로 ${b}칸 더 가면 ${N(s)}에 도착해. 음수를 더하면 작은 쪽으로 간단다.`;
        steps = [`부호가 같다 → 절댓값끼리 더해: ${a} + ${b} = ${a + b}`, `같은 부호 −를 붙여: ${N(s)}`];
        if (st) { q = `잉어킹이 수면 아래 ${a}m(${N(-a)}m)에 있다가 ${b}m 더 잠수했어. 지금 높이는?`; unit = 'm'; }
      } else {
        const big = Math.abs(x) > Math.abs(y) ? x : y;
        wrongs = [
          { v: -(a + b), why: `부호가 다른데 절댓값을 더했어. 부호가 다르면 서로 상쇄되니까 절댓값끼리 빼야 해.` },
          { v: a + b, why: `음수의 부호를 무시하고 그냥 더했구나. −${kind === 'np' ? a : b}는 ${kind === 'np' ? a : b}만큼 '내려가는' 거야.` },
          { v: -s, why: `크기는 맞았는데 부호가 반대야. 절댓값이 더 큰 ${P(big)}의 부호를 따라야 한단다.` },
        ];
        why = `${N(x)}에서 ${y > 0 ? `오른쪽으로 ${y}칸` : `왼쪽으로 ${-y}칸`} 가면 ${N(s)}야. 부호가 다르면 두 힘이 서로 줄다리기를 해서 큰 쪽이 이긴단다.`;
        steps = [`부호가 다르다 → 절댓값끼리 빼: ${Math.max(a, b)} − ${Math.min(a, b)} = ${Math.abs(s)}`, `절댓값이 큰 ${P(big)}의 부호를 붙여: ${N(s)}`];
        if (st) {
          q = kind === 'np' ? `기온이 ${N(-a)}도였는데 낮에 ${b}도 올랐어. 지금 기온은 몇 도일까?` : `기온이 ${a}도였는데 밤에 ${b}도 내려갔어. 지금 기온은 몇 도일까?`;
          unit = '도';
        }
      }
      if (!q) q = `${P(x)} + ${P(y)} = ?`;
      const lo = Math.min(x, s, 0) - 1, hi = Math.max(x, s, 0) + 1;
      return Q(s, wrongs, why, { q, unit, steps, need, viz: { type: 'numline', from: lo, to: hi, marks: [x, s], hi: s } });
    }),

  skill('m_int_mul', 6, '정수의 곱셈·나눗셈', '곱하거나 나눌 때 음수가 짝수 개면 +, 홀수 개면 −야.',
    '독 데미지가 매 턴 쌓이는 양, 거꾸로 돌린 시간처럼 "줄어드는 것의 반복"을 계산할 때 쓰여.', (st, need) => {
      const kind = st ? 'story' : pick(['mul', 'div', 'mul3']);
      if (kind === 'story') {
        const a = rand(2, 9), b = rand(2, 6), p = -a * b;
        return Q(p, [
          { v: a * b, why: `HP가 '줄어드는' 거라 변화량은 음수야. (${N(-a)}) × ${b}처럼 음수 × 양수는 − 란다.` },
          { v: -(a + b), why: `곱해야 하는데 더했어. 매 턴 ${a}씩 ${b}번 줄어드니까 ${N(-a)}를 ${b}번 더한 것 = 곱셈이야.` },
          { v: -a * (b + 1), why: `턴 수를 하나 더 셌어. ${b}턴이면 ${N(-a)}를 ${b}번만 더해.` },
        ], `매 턴 ${N(-a)}씩 ${b}턴이면 (${N(-a)}) × ${b} = ${N(p)}. 줄어드는 양이 반복되면 음수 × 양수 = 음수가 된단다.`, {
          q: `독에 걸린 이상해씨의 HP가 매 턴 ${a}씩 줄어. ${b}턴 동안 HP 변화량은?`, need,
          steps: [`한 턴 변화량: ${N(-a)}`, `${b}턴: (${N(-a)}) × ${b}`, `음수 1개 → 부호 −, 크기 ${a * b} → ${N(p)}`] });
      }
      if (kind === 'mul3') {
        let fs; do { fs = [0, 0, 0].map(() => rand(2, 3) * sgn()); } while (!fs.some((f) => f < 0));
        const [x, y, z] = fs, p = x * y * z, neg = fs.filter((f) => f < 0).length;
        return Q(p, [
          { v: -p, why: `음수 개수를 잘못 셌어. 음수가 ${neg}개(${neg % 2 ? '홀수' : '짝수'})니까 답의 부호는 ${neg % 2 ? '−' : '+'}야.` },
          { v: x + y + z, why: `곱셈인데 세 수를 더했구나. × 기호를 잘 보자.` },
          { v: x * y, why: `앞의 두 수만 곱하고 마지막 수 ${N(z)}를 빠뜨렸어.` },
        ], `크기는 ${Math.abs(x)} × ${Math.abs(y)} × ${Math.abs(z)} = ${Math.abs(p)}. 음수가 ${neg}개라서 부호는 ${p < 0 ? '−' : '+'}, 답 ${N(p)}!`, {
          q: `${P(x)} × ${P(y)} × ${P(z)} = ?`, need,
          steps: [`크기끼리 곱해: ${Math.abs(x)} × ${Math.abs(y)} × ${Math.abs(z)} = ${Math.abs(p)}`, `음수 개수: ${neg}개 → ${neg % 2 ? '홀수라 −' : '짝수라 +'}`, `답: ${N(p)}`] });
      }
      let x, y; do { x = rand(2, 9) * sgn(); y = rand(2, 9) * sgn(); } while (x > 0 && y > 0);
      if (kind === 'mul') {
        const p = x * y;
        return Q(p, [
          { v: -p, why: `부호 규칙을 거꾸로 썼어. 같은 부호끼리 곱하면 +, 다른 부호끼리 곱하면 −란다.` },
          { v: x + y, why: `곱셈인데 더했구나. ${J(`${P(x)} × ${P(y)}`, '은', '는')} 크기 ${Math.abs(x)} × ${Math.abs(y)}부터 계산해.` },
          { v: Math.sign(p) * Math.abs(x) * (Math.abs(y) + 1), why: `${Math.abs(x)} × ${Math.abs(y) + 1}를 계산했어. 곱셈구구 ${Math.abs(x)}단을 한 칸 더 갔어.` },
        ], `크기는 ${Math.abs(x)} × ${Math.abs(y)} = ${Math.abs(p)}. 부호가 ${(x < 0) === (y < 0) ? '같으니 +' : '다르니 −'}, 답 ${N(p)}!`, {
          q: `${P(x)} × ${P(y)} = ?`, need,
          steps: [`크기끼리 곱해: ${Math.abs(x)} × ${Math.abs(y)} = ${Math.abs(p)}`, `부호: ${(x < 0) === (y < 0) ? '같은 부호 → +' : '다른 부호 → −'}`, `답: ${N(p)}`] });
      }
      const d = x * y, qv = x; // d ÷ y = x
      return Q(qv, [
        { v: -qv, why: `부호 규칙을 거꾸로 썼어. 나눗셈도 곱셈처럼 같은 부호면 +, 다른 부호면 −야.` },
        { v: d * y, why: `나눗셈인데 곱했구나. ÷ 기호를 잘 보자.` },
        { v: fr(y, d), why: `나누는 순서를 바꿨어. ${N(d)}를 ${N(y)}로 나눠야 해.` },
      ], `크기는 ${Math.abs(d)} ÷ ${Math.abs(y)} = ${Math.abs(qv)}. 부호가 ${(d < 0) === (y < 0) ? '같으니 +' : '다르니 −'}, 답 ${N(qv)}!`, {
        q: `${P(d)} ÷ ${P(y)} = ?`, need,
        steps: [`크기끼리 나눠: ${Math.abs(d)} ÷ ${Math.abs(y)} = ${Math.abs(qv)}`, `부호: ${(d < 0) === (y < 0) ? '같은 부호 → +' : '다른 부호 → −'}`, `답: ${N(qv)}`] });
    }),

  skill('m_frac_mul', 6, '분수의 곱셈', '분수끼리 곱할 때는 분자끼리, 분모끼리 곱하고 약분해.',
    '"남은 피자의 절반", "HP의 3/4"처럼 어떤 양의 몇 분의 몇을 구할 때 써.', (st, need) => {
      let a, b, c, d;
      do { b = rand(2, 9); a = rand(1, b - 1); d = rand(2, 9); c = rand(1, d - 1); } while (gcd(a, b) !== 1 || gcd(c, d) !== 1);
      const ans = fr(a * c, b * d);
      return Q(ans, [
        { v: fr(a * d, b * c), why: `뒤의 분수를 뒤집어서 곱했구나. 그건 나눗셈 방법이야. 곱셈은 그대로 곱해.` },
        { v: fr(a + c, b + d), why: `분자끼리, 분모끼리 더했어. 곱셈은 분자끼리, 분모끼리 '곱해야' 해.` },
        { v: fr(a * d + b * c, b * d), why: `두 분수를 더한 값이야. "~의 몇 분의 몇"은 곱하기란다.` },
      ], `${a}/${b} × ${c}/${d}는 "${a}/${b}를 ${d}조각 낸 것 중 ${c}조각"이야. 분자끼리 ${a * c}, 분모끼리 ${b * d}, 약분하면 ${ans}!`, {
        q: st ? `나무열매 파이가 ${a}/${b} 남았어. 피카츄가 그중 ${c}/${d}를 먹었어. 먹은 양은 전체의 얼마?` : `${a}/${b} × ${c}/${d} = ?`,
        need, more: [{ v: fr(a * c, b + d), why: `분자는 곱했는데 분모는 더했어. 분모도 곱해야 조각 크기가 맞아.` }], gen: fracGen,
        steps: [`분자끼리 곱해: ${a} × ${c} = ${a * c}`, `분모끼리 곱해: ${b} × ${d} = ${b * d}`, gcd(a * c, b * d) > 1 ? `약분: ${a * c}/${b * d} = ${ans}` : `더 약분할 수 없어: ${ans}`] });
    }),

  skill('m_frac_div', 6, '분수의 나눗셈', '분수로 나눌 때는 나누는 수를 뒤집어서 곱해.',
    '주스를 1/4L씩 컵에 나누면 몇 컵인지처럼 "몇 번 들어가나"를 셀 때 써.', (st, need) => {
      let a, b, c, d, q;
      if (st) {
        b = rand(2, 4); do { a = rand(1, b - 1); } while (gcd(a, b) !== 1);
        d = b * rand(2, 3); c = 1;
        q = `나무열매 주스 ${a}/${b}L를 1/${d}L씩 컵에 따르면 몇 컵이 될까?`;
      } else {
        do { b = rand(2, 9); a = rand(1, b - 1); d = rand(2, 9); c = rand(1, d - 1); } while (gcd(a, b) !== 1 || gcd(c, d) !== 1 || a * d === b * c);
        q = `${a}/${b} ÷ ${c}/${d} = ?`;
      }
      const ans = fr(a * d, b * c);
      return Q(ans, [
        { v: fr(a * c, b * d), why: `나누는 수를 뒤집지 않고 그냥 곱했어. ÷ ${c}/${d}는 × ${d}/${c}로 바꿔야 해.` },
        { v: fr(b * c, a * d), why: `앞의 수를 뒤집었어. 뒤집는 건 '나누는 수'(${c}/${d}) 쪽이야.` },
        { v: fr(b * d, a * c), why: `두 분수를 모두 뒤집었어. 앞의 ${a}/${b}는 그대로 두고 뒤만 뒤집어.` },
      ], `"${c}/${d}가 ${a}/${b} 안에 몇 번 들어가나?"를 묻는 거야. 뒤집어 곱하면 ${a}/${b} × ${d}/${c} = ${ans}!`, {
        q, need, gen: fracGen,
        steps: [`나누는 수를 뒤집어: ${c}/${d} → ${d}/${c}`, `곱해: ${a}/${b} × ${d}/${c} = ${a * d}/${b * c}`, `약분: ${ans}`] });
    }),

  skill('m_percent', 6, '비율과 백분율', '백분율(%)은 전체를 100으로 봤을 때의 양이야. p%는 × p/100.',
    '할인 가격, 배터리 잔량, 몬스터볼 포획률처럼 생활 곳곳의 %를 이해하게 해 줘.', (st, need) => {
      const kind = st ? pick(['hp', 'sale']) : pick(['of', 'what']);
      if (kind === 'sale') {
        const price = pick([1000, 2000, 3000, 4000, 5000]), p = pick([10, 20, 25, 30, 50]);
        const off = price * p / 100, ans = price - off;
        return Q(ans, [
          { v: off, why: `깎아 주는 금액(${off}원)만 구했어. 내야 할 돈은 원래 값에서 그만큼 뺀 거야.` },
          { v: price - p, why: `${p}%를 ${p}원으로 착각했어. ${p}%는 ${price}원의 ${p}/100이야.` },
          { v: price + off, why: `할인인데 더했어. 할인은 값이 '내려가는' 거란다.` },
        ], `${price}원의 ${p}%는 ${price} × ${p}/100 = ${off}원. 그만큼 깎으면 ${price} − ${off} = ${ans}원!`, {
          q: `${price}원짜리 몬스터볼을 ${p}% 할인해서 팔아. 얼마에 살 수 있을까?`, unit: '원', need,
          steps: [`할인액: ${price} × ${p}/100 = ${off}원`, `낼 돈: ${price} − ${off} = ${ans}원`] });
      }
      if (kind === 'what') {
        const b = pick([4, 5, 10, 20, 25, 50]), a = rand(1, b - 1), ans = 100 * a / b;
        const rev = 100 * b / a;
        return Q(ans, [
          { v: a, why: `개수를 그대로 썼어. %는 전체를 100으로 바꿨을 때의 양이라 ${a}/${b} × 100을 해야 해.` },
          { v: 100 - ans, why: `나머지 부분의 비율을 구했어. 묻는 건 ${b}개 중 ${a}개 쪽이야.` },
          Number.isInteger(rev) ? { v: rev, why: `거꾸로 나눴어. 비율은 (비교하는 양) ÷ (기준량) = ${a} ÷ ${b}야.` }
            : { v: Math.round(a / b * 1000) / 1000, why: `${a} ÷ ${b}까지는 맞아! 백분율로 바꾸려면 100을 곱해야 해.` },
        ], `${b}개 중 ${a}개 = ${a}/${b}. 100을 곱하면 ${ans}%야. 전체를 100칸으로 늘려 본 거란다.`, {
          q: `${b}개 중 ${a}개는 전체의 몇 %일까?`, unit: '%', need,
          more: [{ v: Math.round(a / b * 1000) / 1000, why: `${a} ÷ ${b}까지는 맞아! 백분율로 바꾸려면 100을 곱해야 해.` }],
          steps: [`비율: ${a} ÷ ${b} = ${a}/${b}`, `× 100: ${a}/${b} × 100 = ${ans}%`] });
      }
      let base, p; do { base = pick([20, 40, 50, 60, 80, 120, 200, 300, 400]); p = pick([10, 20, 25, 30, 40, 50, 75]); } while (base * p % 100 !== 0);
      const ans = base * p / 100;
      return Q(ans, [
        { v: base * p / 10, why: `100이 아니라 10으로 나눴어. '퍼센트'는 '100개 중에'라는 뜻이야.` },
        { v: p, why: `${p}%의 숫자 ${p}를 그대로 답했어. ${base}의 ${p}%는 ${base} × ${p}/100이야.` },
        { v: base - ans, why: `${p}%를 빼고 남은 양을 구했어. 묻는 건 ${p}%에 해당하는 양이야.` },
      ], `${base}의 ${p}%는 ${base}를 100칸으로 나눈 한 칸(${base / 100})이 ${p}칸 → ${base} × ${p}/100 = ${ans}!`, {
        q: kind === 'hp' ? `HP가 ${base}인 꼬부기가 공격을 받아 HP의 ${p}%가 줄었어. 줄어든 HP는?` : `${base}의 ${p}%는 얼마일까?`, need,
        steps: [`${p}% = ${p}/100`, `${base} × ${p}/100 = ${ans}`] });
    }),

  skill('m_ratio', 6, '비례식', '비례식에서 바깥쪽 두 수의 곱(외항)과 안쪽 두 수의 곱(내항)은 같아.',
    '요리 레시피 양 늘리기, 지도 축척, 물약 섞는 비율을 맞출 때 써.', (st, need) => {
      let a, b; do { a = rand(1, 6); b = rand(1, 6); } while (a === b || gcd(a, b) !== 1);
      const k = rand(2, 5), c = a * k, x = b * k;
      return Q(x, [
        { v: b + c - a, why: `${a}에서 ${c}로 ${c - a}만큼 '늘었다'고 보고 더했구나. 비는 더하기가 아니라 곱하기(${k}배) 관계야.` },
        { v: b * c, why: `내항의 곱 ${b} × ${c} = ${b * c}까지는 맞아! 여기서 외항 ${a}로 나눠야 □가 나와.` },
        { v: k, why: `몇 배인지(${k}배)만 구하고 멈췄어. ${b}에도 ${k}를 곱해야 해.` },
      ], `${a} → ${c}는 ${k}배야. 비의 뜻은 '같은 배율'이니까 ${b}도 ${k}배 → ${x}. 확인: ${a} × ${x} = ${b} × ${c} = ${a * x}.`, {
        q: st ? `오렌열매 ${a}개에 물 ${b}컵 비율로 주스를 만들어. 오렌열매 ${c}개면 물은 몇 컵?` : `${a} : ${b} = ${c} : □에서 □에 알맞은 수는?`,
        unit: st ? '컵' : '', need,
        more: [{ v: fr(a * c, b), why: `외항과 내항을 헷갈렸어. 바깥 두 수(${a}, □)의 곱 = 안쪽 두 수(${b}, ${c})의 곱이야.` }],
        steps: [`외항의 곱 = 내항의 곱: ${a} × □ = ${b} × ${c}`, `${a} × □ = ${b * c}`, `□ = ${b * c} ÷ ${a} = ${x}`] });
    }),

  /* ───────── 중1 ───────── */
  skill('m_expr_value', 7, '문자와 식, 식의 값', '문자 자리에 수를 넣을 때는 괄호로 감싸고, 곱셈부터 계산해.',
    '게임 속 공격력 공식, 택시 요금 공식처럼 "규칙"을 식으로 만들어 두고 값만 바꿔 넣을 수 있어.', (st, need) => {
      const kind = st ? 'A' : pick(['A', 'B', 'C']);
      if (kind === 'A') {
        const a = rand(2, 9), x = rand(2, 9), b = rand(1, 9), v = a * x + b;
        return Q(v, [
          { v: Number(`${a}${x}`) + b, why: `${a}x에 ${x}를 넣어 ${a}${x}(두 자리 수)로 읽었어. ${a}x는 ${a} × x라서 ${a} × ${x} = ${a * x}야.` },
          { v: a + x + b, why: `${a}x를 ${a} + x로 봤구나. 문자 앞의 수는 '곱하기'가 숨어 있는 거야.` },
          { v: a * (x + b), why: `${x} + ${b}를 먼저 더하고 곱했어. 곱셈을 덧셈보다 먼저 계산해야 해.` },
        ], `${a}x + ${b}에서 x 자리에 ${x}를 넣으면 ${a} × ${x} + ${b}. 곱셈 먼저: ${a * x} + ${b} = ${v}!`, {
          q: st ? `레벨이 x인 피카츄의 10만볼트 위력은 ${a}x + ${b}야. 레벨 ${x}일 때 위력은?` : `x = ${x}일 때 ${a}x + ${b}의 값은?`, need,
          steps: [`x 자리에 ${x}를 넣어: ${a} × ${x} + ${b}`, `곱셈 먼저: ${a * x} + ${b}`, `답: ${v}`] });
      }
      if (kind === 'B') {
        const a = rand(2, 6), x = -rand(2, 6), b = rand(1, 9), v = a * x + b;
        return Q(v, [
          { v: a * -x + b, why: `${N(x)}의 부호를 빠뜨렸어. 음수를 넣을 땐 ${a} × (${N(x)})처럼 괄호로 감싸자.` },
          { v: a + x + b, why: `괄호 없이 넣어서 ${a} − ${-x}, 즉 빼기가 돼 버렸어. ${a}x는 ${J(`${a} × (${N(x)})`, '이야', '야')}.` },
          { v: a * x, why: `${a}x는 잘 계산했는데 뒤의 + ${b}를 빠뜨렸어.` },
        ], `x 자리에 ${J(`(${N(x)})`, '을', '를')} 넣으면 ${a} × (${N(x)}) + ${b} = ${N(a * x)} + ${b} = ${N(v)}. 음수는 꼭 괄호에 넣어서 대입해!`, {
          q: `x = ${N(x)}일 때 ${a}x + ${b}의 값은?`, need,
          steps: [`괄호로 넣어: ${a} × (${N(x)}) + ${b}`, `곱셈 먼저: ${N(a * x)} + ${b}`, `답: ${N(v)}`] });
      }
      const x = -rand(2, 5), b = rand(1, 9), v = x * x - b;
      return Q(v, [
        { v: -(x * x) - b, why: `괄호 없이 ${N(x)}²처럼 계산했어. (${N(x)})² = (${N(x)}) × (${N(x)}) = ${x * x}야.` },
        { v: 2 * x - b, why: `제곱을 2배로 착각했어. x²은 x × 2가 아니라 x × x야.` },
        { v: x * x + b, why: `− ${b}를 + ${b}로 바꿔 계산했어. 식의 부호를 그대로 옮겨 적자.` },
      ], `x 자리에 ${J(`(${N(x)})`, '을', '를')} 넣으면 (${N(x)})² − ${b} = ${x * x} − ${b} = ${N(v)}. 음수를 제곱하면 양수가 된단다.`, {
        q: `x = ${N(x)}일 때 x² − ${b}의 값은?`, need,
        steps: [`괄호로 넣어: (${N(x)})² − ${b}`, `(${N(x)}) × (${N(x)}) = ${x * x}`, `${x * x} − ${b} = ${N(v)}`] });
    }),

  skill('m_linear_eq', 7, '일차방정식', '등식의 양변에 같은 일을 하면 등식이 유지돼. 이항하면 부호가 바뀌어.',
    '"몇 개를 더 사야 할까?"처럼 모르는 수를 거꾸로 찾아낼 때 쓰는 가장 기본 도구야.', (st, need) => {
      let a, x, b;
      if (st) { a = rand(2, 6); x = rand(2, 9); b = rand(1, 9); } else { a = rand(2, 6); x = nz(-6, 9); b = nz(-9, 9); }
      const c = a * x + b, C = N(c);
      const X = (s) => `x = ${s}`;
      const lhs = poly([[a, 1], [b, 0]]);
      return Q(X(N(x)), [
        { v: X(fr(c + b, a)), why: `${N(b)}를 오른쪽으로 옮길 때 부호를 안 바꿨어. 이항하면 +는 −로, −는 +로 바뀐단다.` },
        { v: X(N(c - b)), why: `${a}x = ${N(c - b)}까지 맞아! 마지막에 양변을 ${a}로 나누는 걸 빠뜨렸어.` },
        { v: X(N((c - b) * a)), why: `${a}x = ${N(c - b)}에서 ${a}로 나눠야 하는데 곱했구나.` },
      ], `${lhs} = ${C}에서 먼저 ${N(b)}를 이항해 ${a}x = ${N(c - b)}, 양변을 ${a}로 나누면 x = ${N(x)}. 검산: ${a} × ${P(x)} + ${P(b)} = ${C} ✓`, {
        q: st ? `상자 x개에 몬스터볼이 ${a}개씩, 낱개 ${b}개를 합쳐 모두 ${C}개야. ${lhs} = ${C}의 해는?` : `방정식 ${lhs} = ${C}의 해는?`,
        need, more: [{ v: X(fr(c - a * b, a)), why: `양변을 ${a}로 먼저 나눴다면 ${N(b)}도 함께 ${a}로 나눠야 해. 한쪽만 나눴구나.` }],
        gen: () => { const v = nz(-9, 9); return { v: X(N(v)), why: `x = ${N(v)}를 넣으면 ${a} × ${P(v)} + ${P(b)} = ${N(a * v + b)}라서 ${C}가 안 돼.` }; },
        steps: [`${N(b)}를 이항: ${a}x = ${C} ${b > 0 ? '−' : '+'} ${Math.abs(b)} = ${N(c - b)}`, `양변 ÷ ${a}: x = ${N(x)}`, `검산: ${a} × ${P(x)} + ${P(b)} = ${C}`] });
    }),

  skill('m_stats', 7, '평균·중앙값·최빈값', '평균은 고르게 나눈 값, 중앙값은 크기순 가운데 값, 최빈값은 가장 많이 나온 값이야.',
    '반 친구들 키, 포켓몬 레벨처럼 여러 자료를 "대표하는 한 수"로 요약할 때 써.', (st, need) => {
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
      const q = st ? `피카츄 5마리의 레벨이 ${list}야. 레벨의 ${what}은?` : `자료 ${list}의 ${what}은?`;
      const viz = { type: 'seq', items: sorted.map(String) };
      if (kind === 'median') {
        return Q(med, [
          { v: vals[2], why: `크기순으로 줄 세우지 않고 적힌 순서의 가운데(${vals[2]})를 골랐어. 먼저 작은 수부터 늘어놓자.` },
          Number.isInteger(mean) ? { v: mean, why: `그건 평균이야. 중앙값은 계산하지 않고 크기순 한가운데 값을 고르는 거란다.` } : null,
          (sorted[0] + sorted[4]) % 2 === 0 ? { v: (sorted[0] + sorted[4]) / 2, why: `가장 작은 수와 가장 큰 수의 가운데를 구했어. 중앙값은 자료를 줄 세운 뒤 가운데 자리 값이야.` } : null,
        ], `크기순: ${sorted.join(', ')}. 5개 중 한가운데(3번째)는 ${med}! 아주 큰 값이 하나 끼어도 흔들리지 않는 게 중앙값의 장점이야.`, {
          q, need, viz,
          more: [{ v: sorted[1], why: `줄 세우기는 잘했는데 2번째를 골랐어. 5개면 앞에서 3번째가 가운데야.` }, { v: sorted[3], why: `줄 세우기는 잘했는데 4번째를 골랐어. 5개면 양쪽에 2개씩 남는 3번째가 가운데야.` },
            { v: sorted[4], why: `가장 큰 값을 골랐어. 중앙값은 크기순으로 줄 세웠을 때 한가운데 값이야.` },
            { v: sorted[0], why: `가장 작은 값을 골랐어. 중앙값은 양쪽에 같은 개수가 남는 가운데 값이야.` }],
          steps: [`크기순으로 줄 세우기: ${sorted.join(', ')}`, `5개의 가운데 = 3번째`, `중앙값: ${med}`] });
      }
      if (kind === 'mean') {
        return Q(mean, [
          { v: sum, why: `합계 ${sum}까지는 맞아! 평균은 합계를 자료 개수 5로 나눠야 해.` },
          med !== mean ? { v: med, why: `그건 중앙값(크기순 가운데)이야. 평균은 모두 더해 개수로 나눈 값이란다.` } : null,
          sum % 4 === 0 ? { v: sum / 4, why: `자료는 5개인데 4로 나눴어. 개수를 손가락으로 다시 세어 보자.` } : { v: sum % 6 === 0 ? sum / 6 : null, why: `자료는 5개인데 6으로 나눴어. 개수를 다시 세어 보자.` },
        ], `모두 더하면 ${sum}, 자료가 5개니까 ${sum} ÷ 5 = ${mean}. 높은 값을 깎아 낮은 곳을 채우면 모두 ${mean}이 된단다.`, {
          q, need, viz,
          more: [{ v: sorted[4], why: `가장 큰 값을 골랐어. 평균은 모두를 고르게 나눴을 때의 값이야.` },
            { v: vals[2], why: `적힌 순서의 가운데 값을 골랐어. 평균은 다섯 수를 모두 더해 5로 나눠야 해.` },
            (sorted[0] + sorted[4]) % 2 === 0 ? { v: (sorted[0] + sorted[4]) / 2, why: `가장 작은 수와 가장 큰 수만 평균 냈어. 가운데 세 수도 모두 더해야 해.` } : null],
          steps: [`모두 더해: ${vals.join(' + ')} = ${sum}`, `개수로 나눠: ${sum} ÷ 5 = ${mean}`] });
      }
      const counts = {}; vals.forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
      const mode = Number(Object.keys(counts).find((k) => counts[k] > 1)), cnt = counts[mode];
      return Q(mode, [
        { v: cnt, why: `${mode}가 나온 '횟수'(${cnt}번)를 답했어. 최빈값은 가장 많이 나온 '값' 자체야.` },
        { v: sorted[4], why: `가장 큰 값을 골랐어. 최빈값은 크기가 아니라 '몇 번 나왔나'로 정해.` },
        { v: med, why: `그건 중앙값이야. 최빈값은 같은 값이 가장 많이 겹친 것을 찾는 거란다.` },
      ], `값마다 몇 번 나왔는지 세어 보면 ${mode}가 ${cnt}번으로 가장 많아. 그래서 최빈값은 ${mode}! 가게에서 가장 많이 팔린 사이즈를 고를 때 딱이야.`, {
        q, need, viz, more: [{ v: sorted[0], why: `가장 작은 값을 골랐어. 최빈값은 가장 '자주' 나온 값이야.` },
          { v: mode * cnt, why: `${mode}를 나온 횟수 ${cnt}만큼 곱했어. 최빈값은 계산하지 않고 가장 많이 나온 값을 그대로 써.` },
          Number.isInteger(mean) ? { v: mean, why: `그건 평균이야. 최빈값은 가장 여러 번 나온 값을 찾는 거란다.` } : null],
        steps: [`값마다 횟수 세기`, `${mode}가 ${cnt}번으로 가장 많음`, `최빈값: ${mode}`] });
    }),

  /* ───────── 중2 ───────── */
  skill('m_power', 8, '지수법칙', 'aⁿ은 a를 n번 곱한 것. 곱하면 지수끼리 더하고, 거듭제곱의 거듭제곱은 지수끼리 곱해.',
    '세포 분열, 소문 퍼지기, 컴퓨터 저장 용량(2의 거듭제곱)처럼 "배로 불어나는 것"을 셀 때 써.', (st, need) => {
      const kind = st ? 'val' : pick(['val', 'mul', 'pow', 'div']);
      if (kind === 'val') {
        let a, n; do { a = rand(2, 5); n = rand(2, 4); } while (a ** n > 256 || (a === 2 && n === 2));
        const v = a ** n;
        return Q(v, [
          { v: a * n, why: `${a}${sup(n)}을 ${a} × ${n}로 착각했어. 지수 ${n}은 '${a}를 ${n}번 곱하라'는 뜻이야.` },
          { v: n ** a, why: `밑과 지수를 바꿨어. ${n}${sup(a)}이 아니라 ${a}를 ${n}번 곱하는 ${a}${sup(n)}이야.` },
          { v: a ** (n - 1), why: `${a}를 ${n - 1}번만 곱했어. ${Array(n).fill(a).join(' × ')}처럼 ${n}번 곱해야 해.` },
        ], `${a}${sup(n)} = ${Array(n).fill(a).join(' × ')} = ${v}. 곱할 때마다 ${a}배씩 불어나는 게 거듭제곱이야.`, {
          q: st ? `피카츄의 전기가 1초마다 ${a}배가 돼. ${n}초 뒤엔 처음의 몇 배일까?` : `${a}${sup(n)}의 값은?`,
          unit: st ? '배' : '', need, more: [{ v: a + n, why: `밑과 지수를 더했어. ${a}${sup(n)}은 ${a}를 ${n}번 곱하는 거야.` }, { v: a ** (n + 1), why: `${a}를 한 번 더 곱했어. 곱하는 횟수는 지수 ${n}과 같아.` }],
          steps: [`${a}를 ${n}번 곱해: ${Array(n).fill(a).join(' × ')}`, `= ${v}`] });
      }
      const a = rand(2, 5);
      const pw = (b, e) => `${b}${sup(e)}`;
      if (kind === 'mul') {
        const m = rand(2, 6), n = rand(2, 5);
        return Q(pw(a, m + n), [
          { v: pw(a, m * n), why: `지수끼리 곱했어. ${a}를 ${m}번 곱하고 또 ${n}번 곱하면 모두 ${m + n}번 곱한 거야.` },
          { v: pw(a * a, m + n), why: `밑끼리도 곱했어. 밑 ${a}는 그대로 두고 지수만 더해.` },
          { v: pw(a * a, m * n), why: `밑도 곱하고 지수도 곱했어. 같은 밑의 곱셈은 밑은 그대로, 지수는 더하기야.` },
        ], `${pw(a, m)} × ${pw(a, n)}은 ${a}를 ${m}번 곱한 뒤 ${n}번 더 곱한 것 → 모두 ${m + n}번 → ${pw(a, m + n)}!`, {
          q: `${pw(a, m)} × ${pw(a, n)}을 간단히 하면?`, need,
          gen: () => { const e = rand(2, 30); return { v: pw(a, e), why: `${pw(a, e)}이 되려면 ${a}를 ${e}번 곱해야 해. 곱한 횟수를 다시 세어 보자.` }; },
          steps: [`${a}를 ${m}번 곱하고, 또 ${n}번 곱해`, `지수끼리 더해: ${m} + ${n} = ${m + n}`, `답: ${pw(a, m + n)}`] });
      }
      if (kind === 'pow') {
        let m, n; do { m = rand(2, 4); n = rand(2, 4); } while ((a * n) ** m === a ** (m * n));
        return Q(pw(a, m * n), [
          { v: pw(a, m + n), why: `지수끼리 더했어. (${pw(a, m)})${sup(n)}은 ${pw(a, m)}을 ${n}번 곱하는 거라 ${m}이(가) ${n}번 → ${m} × ${n}이야.` },
          { v: pw(a * n, m), why: `밑에 ${n}을(를) 곱했어. 바깥 지수 ${n}은 '${pw(a, m)}을 ${n}번 곱하라'는 뜻이야.` },
          { v: pw(a, m ** n), why: `지수를 거듭제곱(${m}${sup(n)})했어. 지수끼리는 곱하기만 하면 돼.` },
        ], `(${pw(a, m)})${sup(n)} = ${Array(n).fill(pw(a, m)).join(' × ')} → 지수 ${m}을(를) ${n}번 더하면 ${m * n}. 답 ${pw(a, m * n)}!`, {
          q: `(${pw(a, m)})${sup(n)}을 간단히 하면?`, need,
          gen: () => { const e = rand(2, 20); return { v: pw(a, e), why: `${pw(a, e)}이 되려면 지수의 합이 ${e}이어야 해. ${pw(a, m)}을 ${n}번 곱한 걸 다시 세어 보자.` }; },
          steps: [`${pw(a, m)}을 ${n}번 곱한 것`, `지수끼리 곱해: ${m} × ${n} = ${m * n}`, `답: ${pw(a, m * n)}`] });
      }
      const n = rand(2, 4), m = n * rand(2, 3);
      return Q(pw(a, m - n), [
        { v: pw(a, m / n), why: `지수끼리 나눴어. ${pw(a, m)} ÷ ${pw(a, n)}은 ${a}를 ${n}번 약분하는 거라 지수를 빼야 해.` },
        { v: pw(a, m + n), why: `나눗셈인데 지수를 더했어. 나눌 때는 지수끼리 빼기야.` },
        { v: pw(1, m - n), why: `밑끼리 나눠 1을 만들었어. 밑 ${a}는 그대로 두고 지수만 빼.` },
      ], `${pw(a, m)} ÷ ${pw(a, n)}은 위의 ${a} ${m}개 중 ${n}개가 아래와 약분돼서 ${m - n}개가 남아 → ${pw(a, m - n)}!`, {
        q: `${pw(a, m)} ÷ ${pw(a, n)}을 간단히 하면?`, need,
        gen: () => { const e = rand(1, 12); return { v: pw(a, e), why: `${pw(a, e)}이 되려면 ${a}가 ${e}개 남아야 해. 약분한 개수를 다시 세어 보자.` }; },
        steps: [`위에 ${a}가 ${m}개, 아래에 ${n}개`, `약분하면 ${m} − ${n} = ${m - n}개 남아`, `답: ${pw(a, m - n)}`] });
    }),

  skill('m_expand', 8, '다항식의 곱셈(전개)', '(x+a)(x+b)는 모든 항을 서로 한 번씩 곱해서 더해: x² + (a+b)x + ab.',
    '넓이 계산을 식으로 빠르게 하고, 나중에 인수분해·이차방정식을 푸는 밑바탕이 돼.', (st, need) => {
      const kind = st ? 'prod' : pick(['sq', 'prod']);
      if (kind === 'sq') {
        const a = nz(-6, 6), ans = quad(1, 2 * a, a * a);
        return Q(ans, [
          { v: quad(1, 0, a * a), why: `가운데 항 ${mono(2 * a, 1)}을(를) 빠뜨렸어. (${xs(a)})²에는 ${J(`x·${P(a)}`, '이', '가')} 두 번 나와.` },
          { v: quad(1, a, a * a), why: `가운데 항을 한 번만 셌어. ${J(`x × ${P(a)}`, '과', '와')} ${P(a)} × x, 두 번이라 2배야.` },
          { v: quad(1, 2 * a, 2 * a), why: `마지막 항을 ${P(a)} × 2로 했어. ${P(a)}²은 ${P(a)} × ${P(a)} = ${a * a}야.` },
        ], `(${xs(a)})² = (${xs(a)})(${xs(a)}). 모두 곱하면 x² + ${P(a)}x + ${P(a)}x + ${a * a} = ${ans}. 가운데 항이 두 번 생기는 게 핵심이야!`, {
          q: `다음 식을 전개하면? (${xs(a)})²`, need,
          more: a < 0 ? [{ v: quad(1, 2 * a, -a * a), why: `(${N(a)})²을 ${N(-a * a)}로 계산했어. 음수 × 음수 = 양수라서 +${a * a}야.` }] : [],
          gen: () => { const b = rand(1, 12) * sgn(), c = rand(1, 36); return { v: quad(1, b, c), why: `${quad(1, b, c)}는 곱셈 공식과 맞지 않아. (x + a)² = x² + 2ax + a²에 a = ${N(a)}를 넣어 보자.` }; },
          steps: [`(${xs(a)})(${xs(a)})로 풀어 써`, `x·x = x², 가운데 항 2 × ${P(a)}x = ${mono(2 * a, 1)}`, `${P(a)}² = ${a * a} → ${ans}`] });
      }
      let a, b;
      if (st) { a = rand(1, 6); do { b = rand(1, 6); } while (b === a); }
      else { do { a = nz(-6, 6); b = nz(-6, 6); } while (a === b || a + b === 0); }
      const ans = quad(1, a + b, a * b);
      return Q(ans, [
        { v: quad(1, 0, a * b), why: `x끼리, 수끼리만 곱하고 엇갈린 곱(x·${P(b)}, ${P(a)}·x)을 빠뜨렸어. 가운데 항 ${mono(a + b, 1)}까지 써야 해.` },
        { v: quad(1, a * b, a + b), why: `합과 곱의 자리를 바꿨어. x의 계수는 합 ${N(a + b)}, 상수항은 곱 ${N(a * b)}야.` },
        { v: quad(1, a + b, -a * b), why: `상수항 부호를 틀렸어. ${P(a)} × ${P(b)} = ${N(a * b)}야.` },
      ], `분배법칙으로 한 항씩 곱해: x·x + x·${P(b)} + ${P(a)}·x + ${P(a)}·${P(b)} = ${ans}. 네 번의 곱셈을 빠짐없이!`, {
        q: st ? `가로가 x + ${a}, 세로가 x + ${b}인 피카츄 포스터의 넓이를 전개하면?` : `다음 식을 전개하면? (${xs(a)})(${xs(b)})`, need,
        more: [{ v: quad(1, a + b, a + b), why: `상수항에도 합을 썼어. 상수항은 두 수의 곱 ${N(a * b)}야.` }],
        gen: () => { const u = rand(1, 12) * sgn(), w = rand(1, 36) * sgn(); return { v: quad(1, u, w), why: `${quad(1, u, w)}는 (x + a)(x + b) = x² + (a + b)x + ab와 맞지 않아. a, b를 넣어 보자.` }; },
        steps: [`네 번 곱해: x·x, x·${P(b)}, ${P(a)}·x, ${P(a)}·${P(b)}`, `가운데 항: (${N(a)} + ${P(b)})x = ${mono(a + b, 1)}`, `정리: ${ans}`] });
    }),

  skill('m_slope', 8, '일차함수의 기울기', '기울기 = (y의 증가량) ÷ (x의 증가량). x가 1 늘 때 y가 얼마나 느는지야.',
    '속력(1초에 몇 m), 요금(1분에 얼마)처럼 "얼마나 빨리 변하나"를 나타내는 값이야.', (st, need) => {
      if (st) {
        const v = rand(2, 6), c = rand(1, 5), t1 = rand(1, 3), t2 = t1 + rand(2, 4), s1 = v * t1 + c, s2 = v * t2 + c;
        return Q(v, [
          { v: fr(t2 - t1, s2 - s1), why: `시간 ÷ 거리로 뒤집었어. 1초에 가는 거리는 거리 증가량 ÷ 시간 증가량이야.` },
          { v: fr(s2, t2), why: `${s2} ÷ ${t2}를 했구나. 출발 지점이 0이 아니라서 '늘어난 만큼'끼리 나눠야 해.` },
          { v: s2 - s1, why: `거리 증가량 ${s2 - s1}m까지 맞아! ${t2 - t1}초 동안 간 거리라서 ${t2 - t1}로 나눠야 해.` },
        ], `${t1}초 → ${t2}초 (${t2 - t1}초 동안) 위치가 ${s1}m → ${s2}m (${s2 - s1}m). 기울기 = ${s2 - s1} ÷ ${t2 - t1} = ${v}. 기울기가 곧 속력이야!`, {
          q: `피카츄가 ${t1}초에 ${s1}m, ${t2}초에 ${s2}m 지점에 있었어. 1초에 몇 m씩 달렸을까?`, unit: 'm', need, gen: fracGen,
          steps: [`시간 증가량: ${t2} − ${t1} = ${t2 - t1}`, `거리 증가량: ${s2} − ${s1} = ${s2 - s1}`, `기울기: ${s2 - s1} ÷ ${t2 - t1} = ${v}`] });
      }
      let x1, x2, y1, y2, dx, dy;
      do { x1 = rand(-3, 3); dx = rand(1, 4); x2 = x1 + dx; y1 = rand(-5, 5); dy = nz(-8, 8); y2 = y1 + dy; } while (x2 === 0 || Math.abs(dx) === Math.abs(dy));
      const ans = fr(dy, dx);
      return Q(ans, [
        { v: fr(dx, dy), why: `x 증가량 ÷ y 증가량으로 뒤집었어. 기울기는 (y의 증가량) ÷ (x의 증가량)이야.` },
        { v: fr(-dy, dx), why: `빼는 순서가 섞였어. y를 (${N(y2)}) − (${N(y1)})로 뺐다면 x도 ${N(x2)} − ${P(x1)}로 같은 순서로 빼야 해.` },
        { v: fr(y2, x2), why: `원점을 지나는 직선처럼 y ÷ x를 했어. 두 점 사이의 '증가량'끼리 나눠야 해.` },
      ], `x는 ${N(x1)} → ${N(x2)}로 ${dx} 늘고, y는 ${N(y1)} → ${N(y2)}로 ${N(dy)} 변해. 기울기 = ${N(dy)} ÷ ${dx} = ${ans}.`, {
        q: `직선이 지나는 두 점: (${N(x1)}, ${N(y1)}), (${N(x2)}, ${N(y2)}). 기울기는?`, need,
        more: [{ v: N(dy), why: `y 증가량 ${N(dy)}까지 맞아! x 증가량 ${dx}로 나눠야 기울기가 돼.` }], gen: fracGen,
        steps: [`x 증가량: ${N(x2)} − ${P(x1)} = ${dx}`, `y 증가량: ${N(y2)} − ${P(y1)} = ${N(dy)}`, `기울기: ${N(dy)} ÷ ${dx} = ${ans}`] });
    }),

  skill('m_prob', 8, '확률', '확률 = (원하는 경우의 수) ÷ (모든 경우의 수). 모든 경우가 똑같이 일어날 때 쓸 수 있어.',
    '몬스터볼이 잡힐 확률, 일기예보의 비 올 확률처럼 불확실한 일을 숫자로 판단하게 해 줘.', (st, need) => {
      const kind = st ? 'bag' : pick(['bag', 'dice', 'coins', 'dice2']);
      if (kind === 'bag') {
        const r = rand(2, 6); let s; do { s = rand(1, 6); } while (s === r);
        const ans = fr(s, r + s);
        return Q(ans, [
          { v: fr(s, r), why: `나머지 공 수(${r})로 나눴어. 분모는 '모든 경우' = 전체 ${r + s}개야.` },
          { v: '1/2', why: `"나오거나 안 나오거나 둘 중 하나"라서 반반이라고 생각했구나. 개수가 다르면 확률도 달라.` },
          { v: fr(r, r + s), why: `반대쪽 공이 나올 확률을 구했어. 묻는 건 ${st ? '하이퍼볼' : '파란 공'} ${s}개 쪽이야.` },
        ], `모든 경우는 ${r + s}가지, 그중 원하는 경우는 ${s}가지. 확률 = ${s}/${r + s}${fr(s, r + s) !== `${s}/${r + s}` ? ` = ${ans}` : ''}. 많이 들어 있을수록 잘 나와!`, {
          q: st ? `가방에 몬스터볼 ${r}개, 하이퍼볼 ${s}개가 있어. 하나 꺼낼 때 하이퍼볼일 확률은?` : `빨간 공 ${r}개, 파란 공 ${s}개 중 하나를 꺼낼 때 파란 공일 확률은?`,
          need, more: [{ v: fr(1, r + s), why: `공 '한 개'가 뽑힐 확률을 구했어. ${s}개 중 아무거나 나와도 되니까 분자는 ${s}야.` }], gen: fracGen,
          steps: [`모든 경우의 수: ${r} + ${s} = ${r + s}`, `원하는 경우의 수: ${s}`, `확률: ${s}/${r + s}${ans !== `${s}/${r + s}` ? ` = ${ans}` : ''}`] });
      }
      if (kind === 'dice') {
        const E = pick([
          { n: '짝수', f: [2, 4, 6], t: { v: '1/3', why: '6도 짝수야. 짝수는 2, 4, 6 세 개란다.' } },
          { n: '3의 배수', f: [3, 6], t: { v: '1/2', why: '3의 배수를 3, 6, 9로 셌구나. 주사위에 9는 없어.' } },
          { n: '4보다 큰 수', f: [5, 6], t: { v: '1/2', why: '4를 포함했어. "4보다 큰"에 4는 들어가지 않아.' } },
          { n: '소수', f: [2, 3, 5], t: { v: '2/3', why: '1을 소수로 셌구나. 1은 소수가 아니야. 소수는 2, 3, 5야.' } },
          { n: '6의 약수', f: [1, 2, 3, 6], t: { v: '1/2', why: '1을 빠뜨렸어. 1은 모든 수의 약수라서 1, 2, 3, 6 네 개야.' } },
        ]);
        const k = E.f.length, ans = fr(k, 6);
        return Q(ans, [
          { v: fr(k, 6 - k), why: `원하는 경우 ÷ '원하지 않는 경우'로 나눴어. 분모는 모든 경우 6이야.` },
          { v: '1/6', why: `눈 하나가 나올 확률만 구했어. ${E.n}는 ${E.f.join(', ')}로 ${k}가지야.` },
          E.t,
        ], `주사위 눈은 1~6의 6가지. ${E.n}는 ${E.f.join(', ')}로 ${k}가지라서 확률 ${k}/6 = ${ans}.`, {
          q: `주사위 한 개를 던질 때 ${E.n}의 눈이 나올 확률은?`, need, gen: fracGen,
          steps: [`모든 경우: 1~6의 6가지`, `${E.n}: ${E.f.join(', ')} → ${k}가지`, `확률: ${k}/6 = ${ans}`] });
      }
      if (kind === 'coins') {
        const both = Math.random() < 0.5;
        return both ? Q('1/4', [
          { v: '1/3', why: `(앞,앞), (앞,뒤), (뒤,뒤) 3가지로 셌구나. (앞,뒤)와 (뒤,앞)은 다른 경우라서 모두 4가지야.` },
          { v: '1/2', why: `동전 하나의 확률만 봤어. 두 동전이 '모두' 앞면이어야 해.` },
          { v: '3/4', why: `'적어도 하나가 앞면'인 확률과 헷갈렸어. 둘 다 앞면은 (앞,앞) 하나뿐이야.` },
        ], `모든 경우: (앞,앞), (앞,뒤), (뒤,앞), (뒤,뒤) 4가지. 둘 다 앞면은 1가지라서 1/4!`, {
          q: '동전 두 개를 던질 때 둘 다 앞면이 나올 확률은?', need, gen: fracGen,
          steps: ['모든 경우: 2 × 2 = 4가지', '둘 다 앞면: (앞,앞) 1가지', '확률: 1/4'] })
          : Q('1/2', [
            { v: '1/3', why: `(앞,뒤)와 (뒤,앞)을 같은 걸로 셌어. 동전 두 개는 서로 다르니까 경우는 4가지야.` },
            { v: '1/4', why: `(앞,뒤) 한 가지만 셌어. (뒤,앞)도 '하나는 앞, 하나는 뒤'야.` },
            { v: '3/4', why: `'적어도 하나가 앞면'인 확률을 구했어. (앞,앞)은 둘 다 앞이라 빼야 해.` },
          ], `모든 경우 4가지 중 (앞,뒤), (뒤,앞) 2가지. 2/4 = 1/2!`, {
            q: '동전 두 개를 던질 때 앞면 하나, 뒷면 하나가 나올 확률은?', need, gen: fracGen,
            steps: ['모든 경우: 2 × 2 = 4가지', '앞 하나·뒤 하나: (앞,뒤), (뒤,앞) 2가지', '확률: 2/4 = 1/2'] });
      }
      const S = rand(4, 8);
      const pairs = []; for (let i = 1; i <= 6; i++) for (let j = 1; j <= 6; j++) if (i + j === S) pairs.push([i, j]);
      const w = pairs.length, uw = pairs.filter(([i, j]) => i <= j).length, ans = fr(w, 36);
      return Q(ans, [
        { v: '1/11', why: `합 2~12의 11가지가 똑같이 나온다고 생각했어. 합마다 나오는 방법의 수가 달라.` },
        { v: fr(uw, 36), why: `${J(`(1, ${S - 1})`, '과', '와')} (${S - 1}, 1)을 같은 걸로 셌어. 두 주사위는 서로 달라서 따로 세야 해.` },
        { v: fr(w, 6), why: `주사위가 두 개면 모든 경우는 6 × 6 = 36가지야. 6이 아니란다.` },
      ], `두 주사위의 모든 경우는 6 × 6 = 36가지. 합이 ${S}인 경우는 ${pairs.map((p) => `(${p.join(',')})`).join(' ')} ${w}가지 → ${w}/36 = ${ans}.`, {
        q: `주사위 두 개를 던질 때 눈의 합이 ${S}일 확률은?`, need, gen: fracGen,
        steps: [`모든 경우: 6 × 6 = 36가지`, `합이 ${S}: ${w}가지`, `확률: ${w}/36 = ${ans}`] });
    }),

  /* ───────── 중3 ───────── */
  skill('m_factor', 9, '인수분해 x²+bx+c', '곱해서 c, 더해서 b가 되는 두 수 p, q를 찾으면 x²+bx+c = (x+p)(x+q).',
    '복잡한 식을 곱셈으로 쪼개 두면 방정식의 해나 넓이의 가로·세로를 한눈에 찾을 수 있어.', (st, need) => {
      let p, q;
      if (st) { do { p = rand(1, 6); q = rand(1, 7); } while (p === q); }
      else { do { p = nz(-7, 7); q = nz(-7, 7); } while (p === q || p + q === 0); }
      const b = p + q, c = p * q, expr = quad(1, b, c), ans = fac(p, q);
      const exp = (r, s) => quad(1, r + s, r * s);
      const alt = [];
      for (let r = -12; r <= 12; r++) if (r && c % r === 0) { const s = c / r; if (r < s && r + s !== b) alt.push([r, s]); }
      const al = alt.length ? pick(alt) : null;
      return Q(ans, [
        { v: fac(-p, -q), why: `부호를 반대로 넣었어. 전개하면 ${exp(-p, -q)}이 돼. 괄호 속 두 수를 더하면 ${N(b)}가 되어야 해.` },
        al ? { v: fac(al[0], al[1]), why: `곱하면 ${N(c)}는 맞지만 더하면 ${N(al[0] + al[1])}라서 x의 계수 ${N(b)}가 안 돼.` } : null,
        { v: fac(p, -q), why: `한쪽 부호를 틀렸어. 전개하면 ${exp(p, -q)}이 돼서 상수항이 ${N(-c)}가 돼.` },
      ], `곱해서 ${N(c)}, 더해서 ${N(b)}인 두 수를 찾자. ${N(p)}와 ${N(q)}! 그래서 ${expr} = ${ans}. 전개해서 확인하면 딱 맞아.`, {
        q: st ? `넓이가 ${expr}인 직사각형 배틀 필드의 가로·세로를 식으로 나타내면?` : `${expr}를 인수분해하면?`, need,
        more: [{ v: fac(b, c), why: `계수 ${N(b)}와 상수 ${N(c)}를 그대로 괄호에 넣었어. 전개하면 ${exp(b, c)}이 돼서 원래 식과 달라.` }, { v: fac(-p, q), why: `한쪽 부호를 틀렸어. 전개하면 ${exp(-p, q)}이 돼.` }],
        gen: () => { const r = nz(-9, 9); let s; do { s = nz(-9, 9); } while (s === r); return { v: fac(r, s), why: `전개하면 ${exp(r, s)}이 돼서 원래 식과 달라. 곱해서 ${N(c)}, 더해서 ${N(b)}인 수를 찾자.` }; },
        steps: [`곱해서 ${N(c)}, 더해서 ${N(b)}인 두 수 찾기`, `${N(p)} × ${P(q)} = ${N(c)}, ${N(p)} + ${P(q)} = ${N(b)}`, `답: ${ans}`] });
    }),

  skill('m_quad_eq', 9, '이차방정식의 해', '(x−α)(x−β) = 0이면 x = α 또는 x = β. 곱이 0이면 둘 중 하나는 0이야.',
    '던진 공이 땅에 닿는 시간, 넓이가 정해진 땅의 길이처럼 제곱이 들어간 문제의 답을 찾게 해 줘.', (st, need) => {
      if (st) {
        const k = rand(3, 9), A = k * k;
        return Q(String(k), [
          { v: `${N(-k)} 또는 ${k}`, why: `x² = ${A}의 해는 ±${k}가 맞지만, 길이는 음수가 될 수 없어. 문제 상황에 맞는 답만 골라야 해.` },
          { v: fr(A, 4), why: `넓이를 4로 나눴어. 그건 둘레에서 한 변을 구하는 방법이야. 넓이는 한 변 × 한 변이란다.` },
          { v: fr(A, 2), why: `x²을 x × 2로 착각했어. 제곱은 같은 수를 두 번 곱하는 거야.` },
        ], `한 변을 x라 하면 x² = ${A}. 제곱해서 ${A}가 되는 수는 ${k}와 ${J(N(-k), '이지만', '지만')}, 길이는 양수라서 ${k}m!`, {
          q: `넓이가 ${A}m²인 정사각형 풀숲이 있어. 한 변의 길이는 몇 m일까?`, need,
          more: [{ v: String(A), why: `넓이를 그대로 답했어. 한 변을 두 번 곱한 게 ${A}야.` }],
          steps: [`한 변을 x라 하면 x² = ${A}`, `x = ${k} 또는 x = ${N(-k)}`, `길이는 양수 → ${k}m`] });
      }
      const X = (r1, r2) => { const [u, w] = [r1, r2].sort((m, n) => m - n); return `x = ${N(u)} 또는 ${N(w)}`; };
      if (Math.random() < 0.3) {
        const k = rand(2, 9), A = k * k;
        return Q(X(-k, k), [
          { v: `x = ${k}`, why: `음수 해를 빠뜨렸어. (${N(-k)})² = ${A}도 성립하니까 해가 두 개야.` },
          { v: `x = ${fr(A, 2)}`, why: `x²을 2x로 착각해서 2로 나눴어. 제곱은 x × x야.` },
          { v: `x = ${A * A}`, why: `거꾸로 제곱을 했어. x²이 ${A}이면 x는 제곱해서 ${A}가 되는 수, 즉 제곱근이야.` },
        ], `제곱해서 ${A}가 되는 수는 ${k}와 ${N(-k)} 두 개야. 음수 × 음수도 양수가 되니까! 그래서 x = ±${k}.`, {
          q: `이차방정식 x² = ${A}의 해는?`, need,
          more: [{ v: `x = ${N(-k)}`, why: `양수 해를 빠뜨렸어. ${k}² = ${A}도 성립하니까 해는 ${N(-k)}와 ${k} 두 개야.` }, { v: `x = ${2 * k}`, why: `${k}를 찾고 2를 곱했구나. x²은 x × 2가 아니라 x × x야.` }],
          steps: [`제곱해서 ${A}가 되는 수 찾기`, `${k}² = ${A}, (${N(-k)})² = ${A}`, `x = ${N(-k)} 또는 ${k}`] });
      }
      let r1, r2; do { r1 = nz(-6, 6); r2 = nz(-6, 6); } while (r1 === r2 || r1 + r2 === 0);
      const b = -(r1 + r2), c = r1 * r2, eq = `${quad(1, b, c)} = 0`;
      const alt = [];
      for (let r = -12; r <= 12; r++) if (r && c % r === 0) { const s = c / r; if (r < s && r + s !== -b) alt.push([r, s]); }
      const al = alt.length ? pick(alt) : null;
      return Q(X(r1, r2), [
        { v: X(-r1, -r2), why: `인수분해한 괄호 속 수를 그대로 해로 썼어. (${xs(-r1)}) = 0이면 x = ${N(r1)}야. 부호가 바뀌어!` },
        { v: `x = ${N(Math.max(r1, r2))}`, why: `해를 하나만 찾았어. 곱이 0이 되려면 두 괄호 중 어느 쪽이 0이어도 돼서 해가 두 개야.` },
        al ? { v: X(al[0], al[1]), why: `두 해의 곱 ${N(c)}는 맞지만 합이 ${N(al[0] + al[1])}라서 x의 계수와 안 맞아.` } : null,
      ], `인수분해하면 (${xs(-r1)})(${xs(-r2)}) = 0. 곱이 0이니 x ${r1 > 0 ? '−' : '+'} ${Math.abs(r1)} = 0 또는 x ${r2 > 0 ? '−' : '+'} ${Math.abs(r2)} = 0 → ${X(r1, r2)}.`, {
        q: `이차방정식 ${eq}의 해는?`, need,
        more: [{ v: X(-r1, r2), why: `한 해의 부호를 틀렸어. 두 해를 원래 식에 넣어 0이 되는지 확인해 보자.` }],
        gen: () => { const u = nz(-9, 9); let w; do { w = nz(-9, 9); } while (w === u); return { v: X(u, w), why: `x = ${N(u)}를 넣으면 ${N(u * u + b * u + c)}이 돼서 0이 아니야. 인수분해를 다시 해 보자.` }; },
        steps: [`인수분해: (${xs(-r1)})(${xs(-r2)}) = 0`, `x ${r1 > 0 ? '−' : '+'} ${Math.abs(r1)} = 0 또는 x ${r2 > 0 ? '−' : '+'} ${Math.abs(r2)} = 0`, `${X(r1, r2)}`] });
    }),

  skill('m_pythag', 9, '피타고라스 정리', '직각삼각형에서 (빗변)² = (한 변)² + (다른 변)². 빗변은 직각 맞은편 가장 긴 변이야.',
    '두 지점 사이 직선거리, 사다리 높이, TV 화면 대각선 크기를 잴 때 써.', (st, need) => {
      const kind = pick(st ? ['hyp', 'leg'] : ['hyp', 'leg', 'surd']);
      if (kind === 'surd') {
        const [a, b] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [2, 5], [3, 5]]), s = a * a + b * b;
        return Q(sq(s), [
          { v: String(a + b), why: `두 변을 그냥 더했어. 빗변은 두 변을 '제곱해서' 더한 뒤 제곱근을 씌워.` },
          { v: String(s), why: `${a}² + ${b}² = ${s}까지 맞아! 그건 빗변의 '제곱'이라서 √를 씌워야 해.` },
          { v: sq(a + b), why: `제곱하지 않고 더한 뒤 √를 씌웠어. ${a}²과 ${b}²을 먼저 구하자.` },
        ], `빗변을 c라 하면 c² = ${a}² + ${b}² = ${a * a} + ${b * b} = ${s}. 그래서 c = ${sq(s)}. 딱 떨어지지 않으면 √로 쓴단다.`, {
          q: `직각을 낀 두 변이 ${a}, ${b}인 직각삼각형의 빗변의 길이는?`, need,
          steps: [`c² = ${a}² + ${b}²`, `c² = ${a * a} + ${b * b} = ${s}`, `c = ${sq(s)}`] });
      }
      const [a, b, c] = pick([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15]]);
      if (kind === 'hyp') {
        return Q(String(c), [
          { v: String(a + b), why: `두 변을 그냥 더했어. 곧장 가는 길(빗변)은 돌아가는 길(${a} + ${b})보다 짧아야 해.` },
          { v: String(a * a + b * b), why: `${a}² + ${b}² = ${a * a + b * b}까지 맞아! 그건 빗변의 제곱이라 √${a * a + b * b} = ${c}야.` },
          { v: sq(a + b), why: `제곱하지 않고 더한 뒤 √를 씌웠어. ${a}²과 ${b}²을 먼저 구해야 해.` },
        ], `c² = ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}. 제곱해서 ${c * c}가 되는 수는 ${c}! 돌아가는 ${a + b}보다 곧장 가는 ${c}가 짧지.`, {
          q: st ? `피죤투가 동쪽으로 ${a}km, 북쪽으로 ${b}km 날았어. 출발점까지 곧장 가면 몇 km?` : `직각을 낀 두 변이 ${a}, ${b}인 직각삼각형의 빗변의 길이는?`,
          unit: st ? 'km' : '', need,
          steps: [`c² = ${a}² + ${b}² = ${a * a} + ${b * b}`, `c² = ${c * c}`, `c = ${c}`] });
      }
      return Q(String(b), [
        { v: String(c - a), why: `빗변에서 한 변을 그냥 뺐어. 길이 말고 '제곱'끼리 빼야 해.` },
        { v: String(c * c - a * a), why: `${c}² − ${a}² = ${c * c - a * a}까지 맞아! 그건 제곱이라 √${c * c - a * a} = ${b}야.` },
        { v: sq(c * c + a * a), why: `빗변 ${c}도 다른 변처럼 더했어. 빗변은 가장 긴 변이라 (빗변)² − (한 변)²을 해야 해.` },
      ], `(빗변)² = (한 변)² + (다른 변)²이니까 ${c}² = ${a}² + □². □² = ${c * c} − ${a * a} = ${b * b}, 그래서 □ = ${b}.`, {
        q: st ? `길이 ${c}m 사다리를 벽에서 ${a}m 떨어진 곳에 세웠어. 사다리 끝의 높이는 몇 m?` : `빗변이 ${c}, 한 변이 ${a}인 직각삼각형의 나머지 한 변의 길이는?`,
        unit: st ? 'm' : '', need,
        steps: [`${c}² = ${a}² + □²`, `□² = ${c * c} − ${a * a} = ${b * b}`, `□ = ${b}`] });
    }),

  skill('m_trig', 9, '삼각비 (특수각)', 'sin = 높이/빗변, cos = 밑변/빗변, tan = 높이/밑변. 30°·60° 삼각형은 1 : √3 : 2, 45°는 1 : 1 : √2.',
    '비탈길 높이, 건물 그림자로 높이 재기, 게임 속 캐릭터가 비스듬히 날아가는 거리 계산에 써.', (st, need) => {
      if (st) {
        const th = pick([30, 60]), L = rand(2, 10) * 2, h = L / 2;
        const S3 = (k) => `${k}√3`;
        const ws = th === 30 ? [
          { v: S3(h), why: `cos 30°(√3/2)를 곱했어. 그건 밑변(가로 거리)이야. 높이는 빗변 × sin 30°란다.` },
          { v: String(L), why: `비탈길 길이를 그대로 썼어. 높이는 비탈길보다 짧아서 빗변 × sin 30° = ${L} × 1/2이야.` },
          { v: String(2 * L), why: `sin 30°로 곱하지 않고 나눴어. 높이 = 빗변 × sin 30°야.` },
        ] : [
          { v: String(h), why: `cos 60°(1/2)를 곱했어. 그건 밑변(가로 거리)이야. 높이는 빗변 × sin 60°란다.` },
          { v: S3(L), why: `2로 나누는 걸 빠뜨렸어. sin 60° = √3/2라서 ${L} × √3/2 = ${S3(h)}야.` },
          { v: String(L), why: `비탈길 길이를 그대로 썼어. 높이는 빗변 × sin 60°야.` },
        ];
        const ans = th === 30 ? String(h) : S3(h);
        return Q(ans, ws, `높이는 빗변 × sin ${th}°. sin ${th}° = ${th === 30 ? '1/2' : '√3/2'}이니까 ${L} × ${th === 30 ? '1/2' : '√3/2'} = ${ans}m. 각도만 알면 올라가지 않고도 높이를 알 수 있어!`, {
          q: `길이 ${L}m 비탈길이 땅과 ${th}°를 이뤄. 비탈 꼭대기의 높이는 몇 m일까?`, unit: 'm', need, viz: { type: 'angle', deg: th },
          steps: [`높이 = 빗변 × sin ${th}°`, `sin ${th}° = ${th === 30 ? '1/2' : '√3/2'}`, `${L} × ${th === 30 ? '1/2' : '√3/2'} = ${ans}m`] });
      }
      const T = {
        sin30: ['1/2', [['√3/2', '그건 cos 30°(= sin 60°)의 값이야. 30° 맞은편 변은 가장 짧은 변 1이라서 1/2이란다.'], ['2', '빗변 ÷ 높이로 뒤집었어. sin은 높이(1) ÷ 빗변(2)이야.'], ['√3/3', '그건 tan 30°야. sin은 빗변으로, tan에서는 밑변으로 나눠.']]],
        sin45: ['√2/2', [['1', '그건 tan 45°야. sin은 높이 1을 빗변 √2로 나눠서 √2/2란다.'], ['√2', '빗변 ÷ 높이로 뒤집었어. sin은 높이(1) ÷ 빗변(√2)이야.'], ['1/2', '그건 sin 30°의 값이야. 45°는 1 : 1 : √2 삼각형을 떠올려.']]],
        sin60: ['√3/2', [['1/2', 'sin 60°와 sin 30°를 바꿨어. 60° 맞은편은 긴 변 √3이란다.'], ['√3', '그건 tan 60°야. sin은 빗변(2)으로 나눠야 해.'], ['2√3/3', '빗변 ÷ 높이로 뒤집었어. sin은 높이(√3) ÷ 빗변(2)이야.']]],
        cos30: ['√3/2', [['1/2', 'cos 30°와 sin 30°를 바꿨어. cos은 밑변/빗변이고, 30° 옆 밑변은 √3이야.'], ['√3', '밑변 √3을 빗변 2로 나누지 않았어. √3은 tan 60°의 값이야.'], ['2√3/3', '빗변 ÷ 밑변으로 뒤집었어. cos은 밑변(√3) ÷ 빗변(2)이야.']]],
        cos45: ['√2/2', [['1', '그건 tan 45°야. cos은 밑변 1을 빗변 √2로 나눈 거란다.'], ['√2', '빗변 ÷ 밑변으로 뒤집었어. 1 ÷ √2 = √2/2가 맞아.'], ['√3/2', '그건 cos 30°의 값이야. 45°는 1 : 1 : √2 삼각형이야.']]],
        cos60: ['1/2', [['√3/2', 'cos 60°를 sin 60°와 바꿨어. 60° 옆의 밑변은 짧은 변 1이란다.'], ['2', '빗변 ÷ 밑변으로 뒤집었어. 밑변(1) ÷ 빗변(2)이 맞아.'], ['√3', '그건 tan 60°야. cos은 밑변을 빗변으로 나눠.']]],
        tan30: ['√3/3', [['√3', '밑변 ÷ 높이로 뒤집었어. 그건 tan 60°야. tan 30° = 1 ÷ √3 = √3/3이란다.'], ['1/2', '그건 sin 30°야. tan에서는 빗변이 아니라 밑변(√3)으로 나눠.'], ['√3/2', '그건 cos 30°야. tan = 높이 ÷ 밑변이란다.']]],
        tan45: ['1', [['√2/2', '그건 sin 45°(= cos 45°)야. tan 45° = 높이 1 ÷ 밑변 1 = 1이란다.'], ['√2', '빗변 √2를 썼어. tan에는 빗변이 들어가지 않아.'], ['1/2', '45°가 90°의 반이라 1/2라고 생각했구나. 각이 반이라고 값이 반이 되지 않아. 높이 = 밑변이라 1이야.']]],
        tan60: ['√3', [['√3/3', '밑변 ÷ 높이로 뒤집었어. tan 60° = 높이 √3 ÷ 밑변 1 = √3이란다.'], ['√3/2', '그건 sin 60°야. tan에서는 빗변이 아닌 밑변으로 나눠.'], ['1/2', '그건 cos 60°야. tan = 높이 ÷ 밑변이란다.']]],
      };
      const f = pick(['sin', 'cos', 'tan']), th = pick([30, 45, 60]), [ans, ws] = T[f + th];
      const tri = th === 45 ? '1 : 1 : √2(두 변 : 빗변)' : '1 : √3 : 2(짧은 변 : 긴 변 : 빗변)';
      const rule = { sin: '높이 ÷ 빗변', cos: '밑변 ÷ 빗변', tan: '높이 ÷ 밑변' }[f];
      return Q(ans, ws.map(([v, why]) => ({ v, why })), `${th}° 직각삼각형의 세 변은 ${tri}. ${f} = ${rule}이니까 ${f} ${th}° = ${ans}.`, {
        q: `${f} ${th}°의 값은?`, need, viz: { type: 'angle', deg: th },
        steps: [`${th}° 삼각형: ${tri}`, `${f} = ${rule}`, `${f} ${th}° = ${ans}`] });
    }),

  /* ───────── 고2 ───────── */
  skill('m_log', 11, '로그의 값', 'logₐ b는 "a를 몇 번 곱해야 b가 되나?"야. logₐ M + logₐ N = logₐ (M × N).',
    '지진 규모, 소리 크기(dB), 산성도(pH)처럼 엄청 큰 수의 차이를 작은 수로 나타낼 때 써.', (st, need) => {
      if (st) {
        const n = rand(2, 4), X = 10 ** n;
        if (Math.random() < 0.5) {
          return Q(n, [
            { v: X, why: `배수를 그대로 답했어. 규모는 10배마다 1씩 커지니까 '10을 몇 번 곱했나'를 세야 해.` },
            { v: n + 1, why: `${X}의 자릿수(${n + 1}자리)를 셌어. 10을 곱한 횟수는 0의 개수 ${n}개야.` },
            { v: X / 10, why: `${X}를 10으로 나눴구나. log는 나눗셈이 아니라 '10을 몇 번 곱했나'야.` },
          ], `${X} = 10${sup(n)}. 10배가 ${n}번 겹친 거라 규모는 log₁₀ ${X} = ${n}만큼 커져. 그래서 규모 1 차이도 엄청난 차이야!`, {
            q: `지진 규모는 흔들림이 10배가 될 때마다 1씩 커져. 흔들림이 ${X}배면 규모는 얼마나 커질까?`, need,
            steps: [`${X} = 10${sup(n)}`, `10배가 ${n}번 → log₁₀ ${X} = ${n}`, `규모 ${n} 증가`] });
        }
        return Q(10 * n, [
          { v: X, why: `배수를 그대로 답했어. dB는 10배마다 10씩 커지니까 '10을 몇 번 곱했나'를 세야 해.` },
          { v: n, why: `log₁₀ ${X} = ${n}까지 맞아! 소리 크기는 10 × log라서 10을 곱해야 해.` },
          { v: 10 * (n + 1), why: `${X}의 자릿수(${n + 1})를 셌어. 10을 곱한 횟수는 0의 개수 ${n}개야.` },
        ], `${X} = 10${sup(n)}. 10배마다 +10dB이니까 10 × ${n} = ${10 * n}dB. 귀는 이렇게 '몇 배'를 '더하기'로 느낀단다.`, {
          q: `소리 세기가 10배가 될 때마다 10dB 커져. 소리 세기가 ${X}배면 몇 dB 커질까?`, unit: 'dB', need,
          steps: [`${X} = 10${sup(n)} → log₁₀ ${X} = ${n}`, `dB 증가 = 10 × ${n} = ${10 * n}`] });
      }
      const kind = pick(['basic', 'sum', 'diff']);
      if (kind === 'basic') {
        const a = pick([2, 3, 5, 10]), n = rand(2, { 2: 5, 3: 4, 5: 3, 10: 4 }[a]), X = a ** n;
        return Q(n, [
          { v: X / a, why: `${X} ÷ ${a}를 했어. log는 나눗셈이 아니라 '${a}를 몇 번 곱하면 ${X}가 되나'야.` },
          { v: n - 1, why: `${Array(n).fill(a).join(' × ')}에서 × 기호 개수를 셌어. 곱한 ${a}의 개수는 ${n}개야.` },
          { v: fr(1, n), why: `밑과 진수를 바꿨어. log${sub(X)} ${a}가 아니라 log${sub(a)} ${X}를 구해야 해.` },
        ], `${a}를 ${n}번 곱하면 ${X}(${Array(n).fill(a).join(' × ')}). 그래서 log${sub(a)} ${X} = ${n}. 로그는 '곱한 횟수'를 알려 주는 계산이야.`, {
          q: `log${sub(a)} ${X}의 값은?`, need,
          more: a === 10 ? [{ v: n + 1, why: `${X}의 자릿수(${n + 1}자리)를 셌어. 10을 곱한 횟수는 0의 개수 ${n}개야.` }] : [{ v: X - a, why: `${X} − ${a}를 했어. 로그는 빼기가 아니라 곱한 횟수야.` }],
          steps: [`${a}를 몇 번 곱해야 ${X}?`, `${Array(n).fill(a).join(' × ')} = ${X}`, `log${sub(a)} ${X} = ${n}`] });
      }
      if (kind === 'sum') {
        const [b, M, Nn, k] = pick([[2, 4, 8, 5], [2, 2, 16, 5], [6, 4, 9, 2], [10, 4, 25, 2], [10, 2, 50, 2], [10, 20, 50, 3], [3, 3, 27, 4], [2, 8, 8, 6], [5, 5, 25, 3]]);
        const L = (x) => `log${sub(b)} ${x}`;
        return Q(k, [
          { v: L(M + Nn), why: `로그끼리 더할 때 진수를 더했어. log끼리의 덧셈은 진수끼리 '곱하기'야.` },
          { v: M * Nn, why: `진수를 곱해 ${M * Nn}까지 맞아! 거기에 log를 씌워야 해: ${b}를 몇 번 곱하면 ${M * Nn}?` },
          { v: fr(M * Nn, b), why: `${M * Nn} ÷ ${b}를 했어. log는 나눗셈이 아니라 '${b}를 몇 번 곱했나'야.` },
        ], `${L(M)} + ${L(Nn)} = ${L(M * Nn)}. ${M * Nn} = ${b}${sup(k)}이니까 답은 ${k}. 곱셈이 로그에서는 덧셈으로 바뀌는 게 로그의 마법이야.`, {
          q: `${L(M)} + ${L(Nn)}의 값은?`, need,
          steps: [`덧셈 → 진수끼리 곱해: ${L(M * Nn)}`, `${M * Nn} = ${b}${sup(k)}`, `답: ${k}`] });
      }
      const [b, M, Nn, k] = pick([[2, 24, 3, 3], [2, 40, 5, 3], [3, 54, 2, 3], [10, 500, 5, 2], [5, 50, 2, 2], [2, 48, 3, 4], [3, 36, 4, 2]]);
      const L = (x) => `log${sub(b)} ${x}`;
      return Q(k, [
        { v: L(M - Nn), why: `로그끼리 뺄 때 진수를 뺐어. log끼리의 뺄셈은 진수끼리 '나누기'야.` },
        { v: M / Nn, why: `진수를 나눠 ${M / Nn}까지 맞아! 거기에 log를 씌워야 해.` },
        { v: L(M * Nn), why: `뺄셈인데 진수를 곱했어. 곱하기는 log의 덧셈일 때야.` },
      ], `${L(M)} − ${L(Nn)} = ${L(M / Nn)}. ${M / Nn} = ${b}${sup(k)}이니까 답은 ${k}. 나눗셈이 로그에서는 뺄셈이 된단다.`, {
        q: `${L(M)} − ${L(Nn)}의 값은?`, need,
        steps: [`뺄셈 → 진수끼리 나눠: ${L(M / Nn)}`, `${M / Nn} = ${b}${sup(k)}`, `답: ${k}`] });
    }),

  skill('m_deriv', 11, '미분과 접선의 기울기', 'xⁿ을 미분하면 nxⁿ⁻¹. 지수를 앞으로 내려 곱하고, 지수는 1 줄여.',
    '속도는 위치가 변하는 빠르기야. 미분하면 "지금 이 순간" 얼마나 빨리 변하는지 알 수 있어.', (st, need) => {
      if (st) {
        const a = rand(1, 3), t = rand(2, 5), v = 2 * a * t;
        return Q(v, [
          { v: a * t * t, why: `그건 ${t}초까지 간 거리(위치)야. 속력은 위치를 미분한 값이란다.` },
          { v: a * t, why: `간 거리 ÷ 시간 = 평균 속력을 구했어. 점점 빨라지고 있어서 '그 순간'의 속력은 미분으로 구해야 해.` },
          { v: 2 * a, why: `미분은 맞게 했는데 t = ${t}를 넣지 않았어. 속력 식 ${mono(2 * a, 1, 't')}에 ${t}를 대입해.` },
        ], `위치 s = ${mono(a, 2, 't')}을 미분하면 속력 v = ${mono(2 * a, 1, 't')}. t = ${t}를 넣으면 ${2 * a} × ${t} = ${v}m/s. 미분은 '순간의 빠르기'를 알려 줘!`, {
          q: `피카츄가 출발 후 t초 동안 ${mono(a, 2, 't')} m를 달려. ${t}초일 때 순간 속력은 초속 몇 m?`, unit: 'm', need,
          more: [{ v: 2 * a * t * t, why: `지수를 내려 곱한 뒤 지수를 1 줄이지 않았어. ${mono(a, 2, 't')}의 미분은 ${mono(2 * a, 1, 't')}야.` }],
          steps: [`s = ${mono(a, 2, 't')}을 미분: v = ${mono(2 * a, 1, 't')}`, `t = ${t} 대입: ${2 * a} × ${t}`, `순간 속력 = ${v}m/s`] });
      }
      const kind = pick(['mono', 'poly', 'tan']);
      if (kind === 'mono') {
        const a = rand(1, 5) * sgn(), n = rand(2, 5), f = mono(a, n), ans = mono(n * a, n - 1);
        return Q(ans, [
          { v: mono(a, n - 1), why: `지수만 1 줄이고 ${n}을(를) 앞으로 내려 곱하는 걸 빠뜨렸어. x${sup(n)}의 미분은 ${ya(mono(n, n - 1))}.` },
          { v: mono(n * a, n), why: `지수 ${n}을(를) 앞에 곱했는데 지수를 1 줄이지 않았어.` },
          { v: mono(n * a, n + 1), why: `지수를 1 올렸어. 미분은 지수를 1 '내리고', 적분이 1 올리는 거야.` },
        ], `xⁿ → nxⁿ⁻¹ 규칙으로 지수 ${n}을(를) 앞으로 내려 ${N(a)} × ${n} = ${N(n * a)}, 지수는 ${n - 1}. 그래서 f'(x) = ${ans}.`, {
          q: `f(x) = ${f}일 때 f'(x)는?`, need,
          more: [{ v: `(${fr(a, n + 1)})x${sup(n + 1)}`, why: `그건 적분(부정적분)이야. 미분은 지수를 내려 곱하고 1 줄이는 거란다.` }],
          gen: () => { const c = rand(1, 25) * sgn(), e = rand(1, 5); return { v: mono(c, e), why: `${mono(c, e)}는 xⁿ → nxⁿ⁻¹ 규칙과 맞지 않아. 계수 × 지수, 지수 − 1을 차례로 해 보자.` }; },
          steps: [`지수 ${n}을(를) 앞으로: ${N(a)} × ${n} = ${N(n * a)}`, `지수 1 줄이기: ${n} → ${n - 1}`, `f'(x) = ${ans}`] });
      }
      if (kind === 'poly') {
        const b = nz(-5, 5), c = nz(-9, 9), d = rand(1, 9);
        const f = poly([[1, 3], [b, 2], [c, 1], [d, 0]]), ans = poly([[3, 2], [2 * b, 1], [c, 0]]);
        return Q(ans, [
          { v: poly([[1, 2], [b, 1], [c, 0]]), why: `지수만 1씩 줄이고 지수를 앞에 곱하지 않았어. x³ → 3x², ${mono(b, 2)} → ${mono(2 * b, 1)}야.` },
          { v: poly([[3, 2], [b, 1], [c, 0]]), why: `${mono(b, 2)}을 미분할 때 지수 2를 곱하지 않았어. ${mono(b, 2)} → ${mono(2 * b, 1)}야.` },
          { v: poly([[3, 2], [2 * b, 1], [c + d, 0]]), why: `상수 ${d}도 남겼어. 상수는 변하지 않아서 미분하면 0이야.` },
        ], `항마다 따로 미분해: x³ → 3x², ${mono(b, 2)} → ${mono(2 * b, 1)}, ${mono(c, 1)} → ${N(c)}, 상수 ${d} → 0. 모으면 ${ans}.`, {
          q: `f(x) = ${f}일 때 f'(x)는?`, need,
          gen: () => { const u = rand(1, 10) * sgn(), w = rand(1, 9) * sgn(); return { v: poly([[3, 2], [u, 1], [w, 0]]), why: `${poly([[3, 2], [u, 1], [w, 0]])}는 항별 미분 결과와 달라. 항을 하나씩 다시 미분해 보자.` }; },
          steps: [`x³ → 3x², ${mono(b, 2)} → ${mono(2 * b, 1)}`, `${mono(c, 1)} → ${N(c)}, 상수 ${d} → 0`, `f'(x) = ${ans}`] });
      }
      const b = nz(-5, 5), k = nz(-4, 4), f = poly([[1, 2], [b, 1]]), ans = 2 * k + b;
      return Q(ans, [
        { v: k * k + b * k, why: `f(${N(k)}) = ${N(k * k + b * k)}은 그 점의 높이(함숫값)야. 기울기는 f'(${N(k)})로 구해.` },
        { v: k + b, why: `x²을 미분해 x로 했어. 지수 2를 앞으로 내려서 2x가 돼야 해.` },
        { v: 2 * k, why: `${mono(b, 1)}의 미분 ${N(b)}를 빠뜨렸어. f'(x) = 2x ${b < 0 ? '−' : '+'} ${Math.abs(b)}야.` },
      ], `접선의 기울기는 미분계수야. f'(x) = 2x ${b < 0 ? '−' : '+'} ${Math.abs(b)}에 x = ${N(k)}를 넣으면 2 × ${P(k)} + ${P(b)} = ${N(ans)}.`, {
        q: `곡선 y = ${f} 위의 x = ${N(k)}인 점에서 접선의 기울기는?`, need,
        more: [{ v: b, why: `f'(x) = 2x ${b < 0 ? '−' : '+'} ${Math.abs(b)}에서 x에 ${N(k)}를 넣지 않고 상수 ${N(b)}만 답했어.` },
          { v: 2 * k * k + b * k, why: `x²을 2x²으로 바꾸고 멈췄어. 지수를 내려 곱한 뒤 지수를 1 줄여야 해: x² → 2x.` }],
        steps: [`f'(x) = 2x ${b < 0 ? '−' : '+'} ${Math.abs(b)}`, `x = ${N(k)} 대입: 2 × ${P(k)} + ${P(b)}`, `기울기 = ${N(ans)}`] });
    }),

  /* ───────── 고3 ───────── */
  skill('m_integral', 12, '정적분과 넓이', 'xⁿ의 부정적분은 xⁿ⁺¹/(n+1). 정적분 = F(위끝) − F(아래끝) = 그래프 아래 넓이.',
    '속도 그래프 아래 넓이가 이동 거리야. 넓이·부피·총량을 "잘게 쪼개 더하는" 방법이란다.', (st, need) => {
      if (st) {
        const c = pick([2, 4]), k = rand(2, 5), ans = c * k * k / 2;
        return Q(ans, [
          { v: c * k, why: `${k}초일 때의 속력(${c * k}m/s)을 답했어. 간 거리는 속력 그래프 아래 넓이야.` },
          { v: c * k * k, why: `적분할 때 2로 나누는 걸 빠뜨렸어. ${mono(c, 1, 't')}의 적분은 ${ya(mono(c / 2, 2, 't'))}.` },
          { v: c, why: `속력 식을 미분(가속도)했어. 거리는 적분으로 구해.` },
        ], `속력 v = ${mono(c, 1, 't')}의 그래프 아래 넓이는 밑변 ${k}, 높이 ${c * k}인 삼각형 = ${ans}. 적분으로도 [${mono(c / 2, 2, 't')}]₀${sup(k)} = ${ans}m야.`, {
          q: `피카츄가 t초일 때 초속 ${mono(c, 1, 't')} m로 달려. 0초부터 ${k}초까지 달린 거리는?`, unit: 'm', need,
          more: [{ v: c * k * (k + 1) / 2, why: `1초, 2초, …의 속력을 계단처럼 더했어. 속력은 매 순간 변하니까 그래프 아래 삼각형 넓이로 구해야 해.` }],
          steps: [`거리 = ∫₀${sup(k)} ${mono(c, 1, 't')} dt`, `적분: ${mono(c / 2, 2, 't')}`, `${c / 2 === 1 ? '' : `${c / 2} × `}${k}² − 0 = ${ans}m`] });
      }
      if (Math.random() < 0.5) {
        const n = rand(1, 2), m = rand(1, 2), cc = (n + 1) * m, k = rand(2, 3), ans = m * k ** (n + 1);
        const F = mono(m, n + 1);
        return Q(ans, [
          { v: cc * k ** (n + 1), why: `지수는 올렸는데 ${n + 1}로 나누는 걸 빠뜨렸어. ${mono(cc, n)}의 적분은 ${ya(F)}.` },
          { v: cc * k ** n, why: `f(${k}) = ${cc * k ** n}, 함숫값을 답했어. 정적분은 그래프 아래 넓이야.` },
          { v: cc * n * k ** (n - 1), why: `미분을 했어. 적분은 반대로 지수를 1 올리고 그 수로 나눠.` },
        ], `${mono(cc, n)}의 부정적분은 ${F}. 위끝 ${k}를 넣은 값에서 아래끝 0을 넣은 값을 빼면 ${ans} − 0 = ${ans}.`, {
          q: `∫₀${sup(k)} ${mono(cc, n)} dx의 값은?`, need,
          more: [{ v: m * k ** n, why: `${n + 1}로 나누기는 했는데 지수를 1 올리지 않았어. ${mono(cc, n)}의 적분은 ${ya(F)}.` },
            { v: fr(cc * k ** (n + 1), n), why: `지수를 올린 뒤 원래 지수 ${n}로 나눴어. 올린 지수 ${n + 1}로 나눠야 해.` }],
          steps: [`부정적분: ${mono(cc, n)} → ${F}`, `위끝 ${k} 대입: ${ans}`, `아래끝 0 대입: 0 → ${ans} − 0 = ${ans}`] });
      }
      const a = rand(1, 4), b = rand(a + 1, 5), ans = b * b - a * a;
      return Q(ans, [
        { v: b * b + a * a, why: `위끝 값과 아래끝 값을 더했어. 정적분은 F(위끝) − F(아래끝)이야.` },
        { v: a * a - b * b, why: `아래끝 − 위끝으로 순서를 뒤집었어. 위끝 ${b}의 값에서 아래끝 ${a}의 값을 빼.` },
        { v: 2 * b - 2 * a, why: `적분하지 않고 2x에 바로 ${b}와 ${a}를 넣었어. 먼저 2x → x²으로 적분해야 해.` },
      ], `2x의 부정적분은 x². 위끝 ${b}를 넣은 ${b * b}에서 아래끝 ${a}를 넣은 ${a * a}를 빼면 ${ans}. x = ${a}부터 ${b}까지 그래프 아래 넓이야.`, {
        q: `∫${sub(a)}${sup(b)} 2x dx의 값은?`, need,
        steps: [`부정적분: 2x → x²`, `F(${b}) − F(${a}) = ${b * b} − ${a * a}`, `= ${ans}`] });
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
