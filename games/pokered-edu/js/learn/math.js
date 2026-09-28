/* 수학 문제 생성기. 문제를 외워두지 않고 매번 새로 만든다.
 * 틀린 보기 = 아이들이 실제로 하는 실수를 그대로 계산한 값. 보기마다 '어디서 헷갈렸는지' 설명이 붙는다.
 * 반환: { q, a[4], c, why, wrong{i: 설명}, viz(설명 그림), pic(문제 그림) } */
import { rand, pick, shuffle } from '../util.js';

const POKE = ['피카츄', '꼬렛', '구구', '캐터피', '뿔충이', '파이리', '꼬부기', '이상해씨', '꼬마돌', '롱스톤'];
const THINGS = [['몬스터볼', '개'], ['상처약', '개'], ['나무열매', '개'], ['배지', '개']];

/* 숫자 뒤 조사 바로잡기: '7와' -> '7과', '10야' -> '10이야', '3를' -> '3을' */
const PAIRS = [['이라서', '라서', '이라서'], ['라서', '라서', '이라서'], ['이야', '야', '이야'], ['이라고', '라고', '이라고'], ['으로', '로', '으로'], ['와', '와', '과'], ['과', '와', '과'],
  ['를', '를', '을'], ['을', '를', '을'], ['는', '는', '은'], ['은', '는', '은'], ['가', '가', '이'], ['이', '가', '이'], ['야', '야', '이야'], ['라고', '라고', '이라고'], ['로', '로', '으로']];
const RE_J = new RegExp(`(\\d)(${PAIRS.map((p) => p[0]).join('|')})(?![가-힣(])`, 'g');
const RE_W = /([가-힣A-Za-z0-9²³]+)(이\(가\)|을\(를\)|은\(는\)|와\(과\)|\(으\)로)/g;
export function hasBatchim(ch) {
  if (ch === '²' || ch === '³') return true; // 제곱·세제곱
  if (/\d/.test(ch)) return '013678'.includes(ch);
  const c = ch.charCodeAt(0);
  return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0;
}
export function fixJosa(s) {
  if (!s) return s;
  s = s.replace(RE_J, (m, d, p, off, str) => {
    const [, noB, withB] = PAIRS.find((x) => x[0] === p);
    const pre = str.slice(0, off + 1).match(/(\d+)\/\d+$/);
    const last = pre ? pre[1].slice(-1) : d; // 분수는 분자를 마지막에 읽는다
    if (p === '으로' || p === '로') return d + ('036'.includes(last) ? '으로' : '로');
    return d + ('013678'.includes(last) ? withB : noB);
  });
  return s.replace(RE_W, (m, w, p) => {
    const last = w.slice(-1);
    const b = hasBatchim(last);
    if (p === '(으)로') {
      const rieul = /\d/.test(last) ? '178'.includes(last) : (last.charCodeAt(0) - 0xac00) % 28 === 8;
      return w + (b && !rieul ? '으로' : '로');
    }
    const map = { '이(가)': ['가', '이'], '을(를)': ['를', '을'], '은(는)': ['는', '은'], '와(과)': ['와', '과'] }[p];
    return w + (b ? map[1] : map[0]);
  });
}

/** 정답 + 오개념 보기들로 4지선다를 만든다. fmt 는 값을 글자로 */
export function mc(correct, wrongs, why, extra = {}) {
  const r = mcRaw(correct, wrongs, why, extra);
  r.q = fixJosa(r.q); r.why = fixJosa(r.why);
  if (extra.steps) r.steps = extra.steps.map(fixJosa);
  if (extra.need) r.need = fixJosa(extra.need);
  for (const k of Object.keys(r.wrong)) r.wrong[k] = fixJosa(r.wrong[k]);
  return r;
}
function mcRaw(correct, wrongs, why, extra = {}) {
  const fmt = extra.fmt || String;
  const seen = new Set([fmt(correct)]);
  const list = [];
  const fv = (x) => { const m2 = String(x).match(/^(\d+)\/(\d+)$/); return m2 ? Number(m2[1]) / Number(m2[2]) : null; };
  const cv = fv(fmt(correct));
  const same = (s2) => cv != null && fv(s2) != null && Math.abs(fv(s2) - cv) < 1e-9; // 1/6 과 2/12 처럼 같은 값
  for (const w of wrongs) {
    if (w == null || w.v == null) continue;
    if (typeof w.v === 'number' && (w.v < 0 || !Number.isFinite(w.v))) continue;
    const s = fmt(w.v);
    if (seen.has(s) || same(s)) continue;
    seen.add(s); list.push({ s, why: w.why });
    if (list.length === 3) break;
  }
  // 글자 보기(시각·분수 등)가 모자라면 만들어 둔 후보로 채운다
  for (let tries = 0; list.length < 3 && extra.fill && tries < 40; tries++) {
    const w = extra.fill();
    const s = fmt(w.v);
    if (!seen.has(s) && !same(s)) { seen.add(s); list.push({ s, why: w.why }); }
  }
  // 모자라면 가까운 값으로 채운다 (단순 계산 실수)
  let d = 1;
  while (list.length < 3 && typeof correct === 'number') {
    for (const v of [correct + d, correct - d]) {
      if (list.length >= 3 || v < 0) continue;
      const s = fmt(v);
      if (seen.has(s)) continue;
      seen.add(s); list.push({ s, why: `${s}${extra.unit || ''}은(는) 정답과 ${d}만큼 차이 나. 마지막에 한 번 더 세어 보거나 검산하는 습관을 들이자.` });
    }
    d++;
  }
  const opts = shuffle([{ s: fmt(correct), ok: true }, ...list]);
  const out = { q: extra.q, a: opts.map((o) => o.s + (extra.unit || '')), c: opts.findIndex((o) => o.ok), why, wrong: {}, viz: extra.viz || null, pic: extra.pic || null };
  opts.forEach((o, i) => { if (!o.ok) out.wrong[i] = o.why; });
  return out;
}

export { POKE };
const tens = (n) => Math.floor(n / 10) % 10, ones = (n) => n % 10, hund = (n) => Math.floor(n / 100) % 10;

/* ── 기술(주제) 목록: 쉬운 것 -> 어려운 것 ── */
export const MATH = [
  { id: 'm_count', g: 0, t: '10까지 세기', gen: (st) => {
    const n = rand(3, 10);
    const [thing, unit] = pick(THINGS);
    return mc(n, [
      { v: n - 1, why: `하나를 빼먹고 셌구나. 셀 때는 하나씩 손가락으로 짚으면서 "하나, 둘…" 하면 빠뜨리지 않아.` },
      { v: n + 1, why: `하나를 두 번 셌을 수 있어. 센 것은 마음속으로 표시해 두면 두 번 세지 않아.` },
      { v: n + 2, why: `조금 많이 셌어. 줄을 맞춰 왼쪽부터 차례로 세어 보자.` },
    ], `하나씩 짚으면서 세면 ${n}${unit}야. 마지막에 센 수가 전체 개수란다.`, {
      q: st ? `${pick(POKE)}이(가) ${thing}을(를) 모았어. 모두 몇 ${unit}일까?` : `${thing}이(가) 모두 몇 ${unit}일까?`,
      pic: { type: 'count', n }, viz: { type: 'count', n, label: true } });
  } },
  { id: 'm_compare10', g: 0, t: '수의 크기 비교', gen: () => {
    const ns = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, 4);
    const mx = Math.max(...ns), mn = Math.min(...ns);
    const second = ns.filter((x) => x !== mx).sort((a, b) => b - a)[0];
    return mc(mx, [
      { v: mn, why: `${mn}은(는) 가장 작은 수야. '큰 수'는 수직선에서 오른쪽에 있는 수란다.` },
      { v: second, why: `${second}도 크지만 ${mx}가 더 커. ${second} 다음에 ${second + 1}, … 이렇게 세어 가면 ${mx}가 더 뒤에 나와.` },
      ...ns.filter((x) => x !== mx && x !== mn && x !== second).map((v) => ({ v, why: `${v}보다 ${mx}가 더 커. 셀 때 더 나중에 나오는 수가 더 큰 수야.` })),
    ], `수직선에서 오른쪽으로 갈수록 커져. 네 수 중 가장 오른쪽은 ${mx}야.`, { q: `가장 큰 수는 무엇일까?`, viz: { type: 'numline', from: 0, to: 10, marks: ns, hi: mx } });
  } },
  { id: 'm_add10', g: 0, t: '10까지 더하기', gen: (st) => {
    const a = rand(1, 6), b = rand(1, 10 - a), s = a + b;
    return mc(s, [
      { v: s - 1, why: `이어 세기를 할 때 ${a}부터 셌구나. ${a} 다음 수인 ${a + 1}부터 ${b}번 세어야 해.` },
      { v: Math.abs(a - b) || null, why: `빼기를 했구나! '더하기(+)'는 합치는 거야. 합치면 원래보다 많아져.` },
      { v: s + 1, why: `하나를 더 셌어. ${a}에서 ${b}칸 앞으로 가면 ${s}에 도착해.` },
    ], `${a}개와 ${b}개를 합치면 ${s}개야. ${a}에서 ${b}칸 이어 세면 ${s}!`, {
      q: st ? `${pick(POKE)}이(가) 나무열매 ${a}개를 먹고, 또 ${b}개를 먹었어. 모두 몇 개 먹었을까?` : `${a} + ${b} = ?`,
      viz: { type: 'dots', a, b, op: '+' } });
  } },
  { id: 'm_sub10', g: 0, t: '10까지 빼기', gen: (st) => {
    const a = rand(4, 10), b = rand(1, a - 1), d = a - b;
    return mc(d, [
      { v: a + b, why: `더하기를 했구나. '빼기(−)'는 덜어 내는 거라 처음보다 적어져야 해.` },
      { v: d + 1, why: `거꾸로 셀 때 ${a}부터 셌구나. ${a - 1}부터 ${b}번 거꾸로 세어야 해.` },
      { v: d - 1 || null, why: `하나를 더 덜어 냈어. ${b}개만 지우고 남은 것을 세어 보자.` },
    ], `${a}개에서 ${b}개를 덜어 내면 ${d}개가 남아.`, {
      q: st ? `몬스터볼이 ${a}개 있었는데 ${b}개를 던졌어. 몇 개 남았을까?` : `${a} − ${b} = ?`,
      viz: { type: 'dots', a, b, op: '-' } });
  } },
  { id: 'm_make10', g: 0, t: '10 만들기(모으기)', gen: () => {
    const a = rand(1, 9), b = 10 - a;
    return mc(b, [
      { v: 10 + a, why: `10과 ${a}를 더했구나. 문제는 "${a}에 얼마를 더해야 10이 되는지"야.` },
      { v: a, why: `${a}를 그대로 골랐어. ${a} + ${a} = ${a * 2}라서 10이 아니야.` },
      { v: b + 1, why: `하나 더 많아. ${a} + ${b + 1} = ${a + b + 1}이 돼.` },
    ], `10칸 상자에 ${a}칸이 차 있으면 빈칸이 ${b}칸이야. 그래서 ${a}와 ${b}를 모으면 10!`, {
      q: `${a}와 몇을 모으면 10이 될까?`, viz: { type: 'tenframe', a, b } });
  } },
  { id: 'm_add_carry1', g: 1, t: '받아올림 있는 덧셈 (한 자리)', gen: (st) => {
    const a = rand(5, 9), b = rand(11 - a, 9), s = a + b;
    return mc(s, [
      { v: s % 10, why: `10을 만들고 남은 ${s % 10}만 적었구나. 10묶음 하나가 생겼으니 앞에 1을 써서 ${s}이야.` },
      { v: s - 1, why: `이어 세기를 ${a}부터 시작했어. ${a + 1}부터 세어야 해.` },
      { v: s + 1, why: `하나 더 셌어. ${a}에 ${10 - a}를 더해 10, 남은 ${b - (10 - a)}를 더하면 ${s}.` },
    ], `${a}에 ${10 - a}를 먼저 더해 10을 만들고, 남은 ${b - (10 - a)}를 더하면 ${s}야. (10 만들기 작전!)`, {
      q: st ? `${pick(POKE)} ${a}마리와 ${pick(POKE)} ${b}마리가 풀숲에 있어. 모두 몇 마리일까?` : `${a} + ${b} = ?`,
      viz: { type: 'tenframe2', a, b } });
  } },
  { id: 'm_sub_borrow1', g: 1, t: '받아내림 있는 뺄셈 (십몇 − 몇)', gen: (st) => {
    const b = rand(3, 9), a = 10 + rand(0, b - 1), d = a - b;
    const wrongSmall = 10 + Math.abs(ones(a) - b);
    return mc(d, [
      { v: wrongSmall, why: `일의 자리에서 ${ones(a)}에서 ${b}를 못 빼니까 거꾸로 ${b} − ${ones(a)}를 했구나. 모자라면 10을 빌려 와야 해!` },
      { v: a + b, why: `더하기를 했어. 빼기는 덜어 내는 거라 ${a}보다 작아져야 해.` },
      { v: d + 1, why: `거의 맞았어! 거꾸로 셀 때 ${a}부터 세면 하나가 틀려.` },
    ], `${a}를 10과 ${ones(a)}로 나눠 봐. 10에서 ${b}를 빼면 ${10 - b}, 거기에 ${ones(a)}를 더하면 ${d}!`, {
      q: st ? `상처약이 ${a}개 있었는데 ${b}개를 썼어. 몇 개 남았을까?` : `${a} − ${b} = ?`,
      viz: { type: 'borrow', a, b } });
  } },
  { id: 'm_place2', g: 1, t: '두 자리 수 (자릿값)', gen: () => {
    const t = rand(1, 9), o = rand(0, 9); const n = t * 10 + o;
    if (o === t) return MATH_BY.m_place2.gen();
    return mc(n, [
      { v: o * 10 + t, why: `자리를 바꿔 썼어. 10이 ${t}개면 십의 자리에 ${t}, 1이 ${o}개면 일의 자리에 ${o}를 써.` },
      { v: t + o, why: `${t}와 ${o}를 더했구나. 10이 ${t}개는 ${t * 10}이라서 ${t}가 아니야.` },
      { v: t * 100 + o, why: `10이 ${t}개는 ${t * 10}이야. ${t * 100}이면 100이 ${t}개라는 뜻이 돼.` },
    ], `10묶음 ${t}개는 ${t * 10}, 낱개 ${o}개를 더하면 ${n}이야. 십의 자리 ${t}, 일의 자리 ${o}.`, {
      q: `10묶음이 ${t}개, 낱개가 ${o}개 있어. 모두 얼마일까?`, viz: { type: 'blocks', n } });
  } },
  { id: 'm_add2d1d', g: 1, t: '(두 자리)+(한 자리)', gen: (st) => {
    let a; do { a = rand(12, 88); } while (ones(a) < 2);
    const b = rand(10 - ones(a), 9);
    const s = a + b;
    return mc(s, [
      { v: tens(a) * 100 + ones(a) + b, why: `일의 자리 합 ${ones(a) + b}를 그대로 이어 썼어. 10이 넘으면 1을 십의 자리로 올려 보내야 해.` },
      { v: s - 10, why: `받아올림한 1을 잊었어. 일의 자리에서 10이 생기면 십의 자리가 1 커져.` },
      { v: a + b * 10, why: `${b}를 십의 자리에 더했구나. ${b}는 낱개라서 일의 자리끼리 더해야 해.` },
    ], `일의 자리: ${ones(a)} + ${b} = ${ones(a) + b} → 10은 십의 자리로 올리고 ${(ones(a) + b) % 10}를 적어. 십의 자리: ${tens(a)} + 1 = ${tens(s)}. 답은 ${s}!`, {
      q: st ? `${pick(POKE)}의 레벨은 ${a}야. ${b}레벨 더 오르면 몇 레벨일까?` : `${a} + ${b} = ?`,
      viz: { type: 'col', a, b, op: '+' } });
  } },
  { id: 'm_clock_half', g: 1, t: '시계 보기 (몇 시, 몇 시 30분)', gen: () => {
    const h = rand(1, 12), half = Math.random() < 0.5;
    const f = (hh, mm) => `${hh}시${mm ? ' 30분' : ''}`;
    const next = h % 12 + 1;
    const ws = half
      ? [{ v: f(next, true), why: `짧은바늘이 ${h}와 ${next} 사이에 있으면 아직 ${next}시가 안 된 거야. 지나온 숫자 ${h}를 읽어.` },
        { v: `6시${h === 6 ? ' 30분' : ''}`, why: `긴바늘이 6을 가리키면 '30분'이란 뜻이야. 6시가 아니란다.` },
        { v: f(h, false), why: `긴바늘이 12가 아니라 6에 있어. 그래서 '정각'이 아니라 30분이야.` }]
      : [{ v: `12시${h === 12 ? ' 30분' : ''}`, why: `긴바늘이 12를 가리키는 건 '정각'이라는 뜻이야. 시는 짧은바늘로 읽어.` },
        { v: f(h, true), why: `긴바늘이 12에 있으면 '정각', 6에 있어야 30분이야.` },
        { v: f(next, false), why: `짧은바늘은 ${h}를 딱 가리켜. ${next}가 아니야.` }];
    return mc(f(h, half), ws, `짧은바늘로 '시'를, 긴바늘로 '분'을 읽어. 짧은바늘 ${h}${half ? `과 ${next} 사이` : ''}, 긴바늘 ${half ? 6 : 12} → ${f(h, half)}!`, {
      fill: () => ({ v: f(rand(1, 12), Math.random() < 0.5), why: '짧은바늘은 시, 긴바늘은 분을 가리켜. 두 바늘을 하나씩 따로 읽어 보자.' }),
      q: '시계가 가리키는 시각은?', pic: { type: 'clock', h, m: half ? 30 : 0 }, viz: { type: 'clock', h, m: half ? 30 : 0, explain: true } });
  } },
  { id: 'm_add2d2d', g: 2, t: '받아올림 있는 두 자리 덧셈', gen: (st) => {
    let a, b; do { a = rand(15, 69); b = rand(15, 89 - a + 10); } while (ones(a) + ones(b) < 10 || a + b > 99);
    const s = a + b;
    return mc(s, [
      { v: Number(`${tens(a) + tens(b)}${ones(a) + ones(b)}`), why: `일의 자리 합 ${ones(a) + ones(b)}를 그대로 붙여 썼구나. 10은 십의 자리로 올려야 해!` },
      { v: s - 10, why: `받아올림한 1을 십의 자리에 더하는 걸 잊었어.` },
      { v: s + 10, why: `받아올림을 두 번 했어. 올라간 1은 한 번만 더해.` },
    ], `일의 자리 ${ones(a)} + ${ones(b)} = ${ones(a) + ones(b)} → ${(ones(a) + ones(b)) % 10}를 쓰고 1을 올려. 십의 자리 ${tens(a)} + ${tens(b)} + 1 = ${tens(s)}. 답 ${s}!`, {
      q: st ? `구구 ${a}마리와 꼬렛 ${b}마리를 만났어. 모두 몇 마리일까?` : `${a} + ${b} = ?`, viz: { type: 'col', a, b, op: '+' } });
  } },
  { id: 'm_sub2d2d', g: 2, t: '받아내림 있는 두 자리 뺄셈', gen: (st) => {
    let a, b; do { a = rand(31, 98); b = rand(12, a - 10); } while (ones(a) >= ones(b) || a - b < 5);
    const d = a - b;
    const small = (tens(a) - tens(b)) * 10 + Math.abs(ones(a) - ones(b));
    return mc(d, [
      { v: small, why: `일의 자리에서 ${ones(a)} − ${ones(b)}가 안 되니까 거꾸로 ${ones(b)} − ${ones(a)}를 했구나. 십의 자리에서 10을 빌려 와야 해!` },
      { v: d + 10, why: `10을 빌려 왔으면 십의 자리를 1 줄여야 해. 그걸 잊었구나.` },
      { v: a + b, why: `더하기를 했어. 빼면 처음 수 ${a}보다 작아져야 해.` },
    ], `일의 자리 ${ones(a)}에서 ${ones(b)}를 못 빼니 십의 자리에서 10을 빌려 ${10 + ones(a)} − ${ones(b)} = ${10 + ones(a) - ones(b)}. 십의 자리는 ${tens(a)} − 1 − ${tens(b)} = ${tens(d)}. 답 ${d}!`, {
      q: st ? `돈이 ${a}원 있었는데 ${b}원을 썼어. 얼마 남았을까?` : `${a} − ${b} = ?`, viz: { type: 'col', a, b, op: '-' } });
  } },
  { id: 'm_place3', g: 2, t: '세 자리 수 (자릿값)', gen: () => {
    const h = rand(1, 9), o = rand(1, 9), n = h * 100 + o; // 십의 자리 0
    return mc(n, [
      { v: h * 10 + o, why: `십의 자리가 비어 있으면 0을 꼭 써야 해. 0이 자리를 지켜 줘서 ${n}이 된단다.` },
      { v: h * 1000 + o, why: `100이 ${h}개면 ${h * 100}이야. 0을 너무 많이 붙였어.` },
      { v: h * 100 + o * 10, why: `${o}는 낱개(1)라서 일의 자리에 써야 해. 십의 자리에 쓰면 ${o * 10}이 돼.` },
    ], `100이 ${h}개 → ${h * 100}, 10은 없음 → 십의 자리 0, 1이 ${o}개 → ${o}. 합쳐서 ${n}!`, {
      q: `100이 ${h}개, 10이 0개, 1이 ${o}개인 수는?`, viz: { type: 'blocks', n } });
  } },
  { id: 'm_mul_concept', g: 2, t: '곱셈의 뜻 (묶어 세기)', gen: (st) => {
    const a = rand(2, 5), b = rand(2, 5), p = a * b;
    return mc(p, [
      { v: a + b, why: `${a}와 ${b}를 더했구나. "${a}개씩 ${b}묶음"은 ${a}를 ${b}번 더하는 거야.` },
      { v: Number(`${a}${b}`), why: `두 수를 이어 붙였어. ${a} × ${b}는 ${a}를 ${b}번 더한 값이야.` },
      { v: a * (b - 1), why: `한 묶음을 빼먹었어. 묶음이 ${b}개니까 ${a}를 ${b}번 더해야 해.` },
    ], `${a}개씩 ${b}묶음 = ${Array(b).fill(a).join(' + ')} = ${p}. 이걸 짧게 ${a} × ${b} = ${p}라고 써.`, {
      q: st ? `몬스터볼이 ${a}개씩 든 상자가 ${b}개 있어. 몬스터볼은 모두 몇 개?` : `${a}개씩 ${b}묶음은 모두 몇 개일까?`,
      pic: { type: 'groups', a, b }, viz: { type: 'groups', a, b } });
  } },
  { id: 'm_times_a', g: 2, t: '곱셈구구 (2, 5, 3, 4단)', gen: (st) => timesGen(pick([2, 5, 3, 4]), st) },
  { id: 'm_times_b', g: 2, t: '곱셈구구 (6, 7, 8, 9단)', gen: (st) => timesGen(pick([6, 7, 8, 9]), st) },
  { id: 'm_length', g: 2, t: '길이 (m와 cm)', gen: (st) => {
    const m = rand(1, 5), cm = rand(5, 95), t = m * 100 + cm;
    return mc(t, [
      { v: m * 10 + cm, why: `1m는 10cm가 아니라 100cm야. ${m}m는 ${m * 100}cm!` },
      cm < 10 ? { v: Number(`${m}${cm}`), why: `${m}과 ${cm}을 그냥 붙였구나. ${cm}cm는 한 자리라서 십의 자리에 0을 채워 ${m}0${cm}cm가 돼.` } : { v: m * 1000 + cm, why: `1m는 1000cm가 아니라 100cm야.` },
      { v: m + cm, why: `m와 cm는 단위가 달라서 그냥 더하면 안 돼. 먼저 cm로 바꾸자.` },
    ], `1m = 100cm이니까 ${m}m는 ${m * 100}cm. 여기에 ${cm}cm를 더하면 ${t}cm!`, {
      q: st ? `롱스톤의 몸길이가 ${m}m ${cm}cm라면 몇 cm일까?` : `${m}m ${cm}cm는 몇 cm일까?`, unit: 'cm', viz: { type: 'ruler', m, cm } });
  } },
  { id: 'm_clock_min', g: 2, t: '시계 보기 (몇 시 몇 분)', gen: () => {
    const h = rand(1, 12), k = rand(1, 11), mm = k * 5;
    const f = (hh, m2) => `${hh}시 ${m2}분`;
    const next = h % 12 + 1;
    return mc(f(h, mm), [
      { v: f(h, k), why: `긴바늘이 ${k}를 가리키면 ${k}분이 아니라 ${mm}분이야. 숫자 하나에 5분씩!` },
      { v: mm >= 30 ? f(next, mm) : f(h === 1 ? 12 : h - 1, mm), why: `짧은바늘은 지나온 숫자를 읽어. 짧은바늘이 ${h}와 ${next} 사이니까 ${h}시야.` },
      { v: f(k === 0 ? 12 : k, h * 5 % 60), why: `짧은바늘과 긴바늘을 바꿔 읽었어. 짧은바늘이 '시', 긴바늘이 '분'이야.` },
    ], `짧은바늘 → ${h}시, 긴바늘이 ${k}를 가리키면 5 × ${k} = ${mm}분. 그래서 ${f(h, mm)}!`, {
      fill: () => ({ v: f(rand(1, 12), rand(1, 11) * 5), why: '긴바늘의 숫자에 5를 곱하면 분이 돼. 짧은바늘은 지나온 숫자를 읽어.' }),
      q: '시계가 가리키는 시각은?', pic: { type: 'clock', h, m: mm }, viz: { type: 'clock', h, m: mm, explain: true } });
  } },
  { id: 'm_add3d', g: 3, t: '세 자리 덧셈', gen: (st) => {
    let a, b; do { a = rand(120, 680); b = rand(110, 999 - a); } while (ones(a) + ones(b) < 10 || a + b > 999);
    const s = a + b;
    return mc(s, [
      { v: s - 10, why: `일의 자리에서 받아올린 1을 십의 자리에 더하지 않았어.` },
      { v: Number(`${hund(a) + hund(b)}${tens(a) + tens(b)}${ones(a) + ones(b)}`), why: `각 자리 합을 그대로 이어 썼어. 10이 넘는 자리는 윗자리로 올려 줘야 해.` },
      { v: s + 100, why: `백의 자리에 1을 더 올렸어. 십의 자리 합이 10을 넘는지 확인해 보자.` },
    ], `일의 자리부터 차례로 더하고, 10이 넘으면 윗자리로 1을 올려. ${a} + ${b} = ${s}.`, {
      q: st ? `포켓몬센터에 오늘 ${a}명, 어제 ${b}명이 왔어. 모두 몇 명일까?` : `${a} + ${b} = ?`, viz: { type: 'col', a, b, op: '+' } });
  } },
  { id: 'm_sub3d', g: 3, t: '세 자리 뺄셈', gen: (st) => {
    let a, b; do { a = rand(300, 950); b = rand(110, a - 50); } while (ones(a) >= ones(b));
    const d = a - b;
    return mc(d, [
      { v: d + 10, why: `십의 자리에서 10을 빌려 왔으면 그 자리를 1 줄여야 해.` },
      { v: Number(`${Math.abs(hund(a) - hund(b))}${Math.abs(tens(a) - tens(b))}${Math.abs(ones(a) - ones(b))}`), why: `자리마다 큰 수에서 작은 수를 뺐구나. 위의 수가 작으면 윗자리에서 빌려 와야 해.` },
      { v: a + b, why: `더하기를 했어. 빼기는 처음 수 ${a}보다 작아져야 해.` },
    ], `일의 자리 ${ones(a)} − ${ones(b)}가 안 되니 십의 자리에서 10을 빌려 와. 차례로 계산하면 ${d}!`, {
      q: st ? `돈이 ${a}원 있었는데 몬스터볼 값으로 ${b}원을 냈어. 얼마 남았을까?` : `${a} − ${b} = ?`, viz: { type: 'col', a, b, op: '-' } });
  } },
  { id: 'm_mul_2d1d', g: 3, t: '(두 자리) × (한 자리)', gen: (st) => {
    const a = rand(12, 49), b = rand(3, 9), p = a * b;
    return mc(p, [
      { v: Number(`${tens(a) * b}${ones(a) * b}`), why: `십의 자리 곱 ${tens(a) * b}와 일의 자리 곱 ${ones(a) * b}를 이어 썼구나. ${tens(a) * 10} × ${b} = ${tens(a) * 10 * b}에 ${ones(a) * b}를 더해야 해.` },
      { v: tens(a) * b * 10 + (ones(a) * b) % 10, why: `일의 자리 곱에서 올라가는 수를 잊었어.` },
      { v: a + b, why: `곱하기가 아니라 더하기를 했어. ${a} × ${b}는 ${a}를 ${b}번 더하는 거야.` },
    ], `${a}를 ${tens(a) * 10}과 ${ones(a)}로 나눠. ${tens(a) * 10} × ${b} = ${tens(a) * 10 * b}, ${ones(a)} × ${b} = ${ones(a) * b}. 더하면 ${p}!`, {
      q: st ? `상처약 한 개에 ${a}원이야. ${b}개를 사면 얼마일까?` : `${a} × ${b} = ?`, viz: { type: 'area', a, b } });
  } },
  { id: 'm_div_concept', g: 3, t: '나눗셈의 뜻 (똑같이 나누기)', gen: (st) => {
    const g = rand(2, 5), each = rand(2, 6), n = g * each;
    return mc(each, [
      { v: n - g, why: `빼기를 했구나. 똑같이 나누는 건 ${n}개를 ${g}묶음으로 고르게 나누는 거야.` },
      { v: n * g, why: `곱하기를 했어. 나누면 한 사람 몫은 전체보다 적어져.` },
      { v: n + g, why: `더하기를 했어. 나누면 한 명 몫은 처음보다 작아야 해.` },
    ], `${n}개를 ${g}명에게 하나씩 돌아가며 나눠 주면 한 명에 ${each}개! 확인: ${each} × ${g} = ${n}.`, {
      q: st ? `나무열매 ${n}개를 ${pick(POKE)} ${g}마리가 똑같이 나눠 먹으면 한 마리에 몇 개?` : `${n}개를 ${g}명이 똑같이 나누면 한 명에 몇 개?`,
      viz: { type: 'share', n, g } });
  } },
  { id: 'm_div_facts', g: 3, t: '나눗셈 구구', gen: (st) => {
    const b = rand(2, 9), q = rand(2, 9), a = b * q;
    return mc(q, [
      { v: q + 1, why: `${b} × ${q + 1} = ${b * (q + 1)}이라서 ${a}보다 커. 곱셈구구로 확인해 보자.` },
      { v: q - 1, why: `${b} × ${q - 1} = ${b * (q - 1)}이라서 ${a}가 안 돼.` },
      { v: a - b, why: `빼기를 했어. 나눗셈은 "${b}씩 몇 번 들어가나?"를 찾는 거야.` },
    ], `${a} ÷ ${b}는 "${b} × ? = ${a}"를 찾는 거야. ${b} × ${q} = ${a}이니까 답은 ${q}!`, {
      q: st ? `${a}명의 트레이너가 ${b}명씩 팀을 만들면 몇 팀일까?` : `${a} ÷ ${b} = ?`, viz: { type: 'array', r: q, c: b } });
  } },
  { id: 'm_frac_concept', g: 3, t: '분수의 뜻', gen: () => {
    const d = rand(3, 8), n = rand(1, d - 1);
    const fmt = (x) => x;
    return mc(`${n}/${d}`, [
      { v: `${d}/${n}`, why: `분자와 분모를 바꿨어. 아래(분모)는 '전체를 몇 조각 냈는지', 위(분자)는 '그중 몇 조각인지'야.` },
      { v: `${d - n}/${d}`, why: `색칠 안 된 부분을 셌구나. 문제는 색칠된 부분이야.` },
      { v: `${n}/${d - n}`, why: `분모에는 '전체 조각 수'를 써야 해. 색칠 안 된 조각 수가 아니야.` },
    ], `전체를 똑같이 ${d}조각 → 분모 ${d}. 그중 ${n}조각 색칠 → 분자 ${n}. 그래서 ${n}/${d}!`, {
      fmt, fill: () => { let a2, b2; do { a2 = rand(1, 8); b2 = rand(2, 9); } while (a2 >= b2 || a2 * d === n * b2); return { v: `${a2}/${b2}`, why: '분모는 전체 조각 수, 분자는 색칠한 조각 수야. 하나씩 세어 보자.' }; }, q: '색칠한 부분을 분수로 나타내면?', pic: { type: 'frac', n, d }, viz: { type: 'frac', n, d } });
  } },
  { id: 'm_frac_compare', g: 3, t: '단위분수 크기 비교', gen: (st) => {
    let a = rand(2, 9), b = rand(2, 9); while (b === a) b = rand(2, 9);
    const big = Math.min(a, b), small = Math.max(a, b);
    return mc(`1/${big}`, [
      { v: `1/${small}`, why: `${small}이 ${big}보다 크니까 1/${small}이 크다고 생각했구나. 조각을 많이 낼수록 한 조각은 작아져!` },
      { v: '둘이 같아요', why: `둘 다 '1조각'이지만 조각 크기가 달라. 몇 조각으로 나눴는지가 중요해.` },
      { v: '비교할 수 없어요', why: `분자가 같으면 분모만 비교하면 돼. 분모가 작을수록 한 조각이 커.` },
    ], `피자를 ${big}조각 낸 한 조각이 ${small}조각 낸 한 조각보다 커. 그래서 1/${big}이 더 커!`, {
      fmt: (x) => x, q: st ? `나무열매 파이를 ${big}명이 나눠 먹을 때와 ${small}명이 나눠 먹을 때, 한 명 몫이 더 큰 쪽은?` : `1/${a}과 1/${b} 중 더 큰 수는?`,
      viz: { type: 'fraccmp', a: [1, big], b: [1, small] } });
  } },
  { id: 'm_decimal', g: 3, t: '소수 (0.1)', gen: () => {
    const k = rand(2, 9), o = rand(0, 3);
    const val = o + k / 10;
    const fmt = (x) => (typeof x === 'number' ? String(Math.round(x * 100) / 100) : x);
    return mc(val, [
      { v: o + k / 100, why: `0.1이 ${k}개면 0.${k}야. 0.0${k}는 0.01이 ${k}개일 때야.` },
      { v: o * 10 + k, why: `소수점을 빼먹었어. 0.1이 10개 모여야 1이 돼.` },
      { v: o + 1 + k / 10, why: `1이 ${o}개인데 하나 더 셌어.` },
    ], `1이 ${o}개, 0.1이 ${k}개 → ${fmt(val)}. 0.1이 10개면 1이 된단다.`, {
      fmt, q: `1이 ${o}개, 0.1이 ${k}개인 수는?`, viz: { type: 'decimal', o, k } });
  } },
  { id: 'm_time_calc', g: 3, t: '시간 계산', gen: (st) => {
    const h = rand(1, 10), m = pick([30, 40, 45, 50]), add = pick([20, 25, 30, 40].filter((x) => m + x > 60));
    const tot = m + add, H = h + Math.floor(tot / 60), M = tot % 60;
    const f = (a, b) => `${a}시 ${b}분`;
    return mc(f(H, M), [
      { v: f(h, tot), why: `분이 60을 넘었어. 60분 = 1시간이니까 ${tot}분은 1시간 ${tot - 60}분이야.` },
      { v: f(H, tot), why: `시를 올렸다면 분에서는 60을 빼야 해.` },
      { v: f(h, M), why: `60분이 1시간으로 바뀌었으니 시가 1 커져야 해.` },
    ], `${m}분 + ${add}분 = ${tot}분 = 1시간 ${M}분. 그래서 ${h}시 → ${H}시 ${M}분!`, {
      fmt: (x) => x, fill: () => ({ v: f(H + rand(-1, 1), rand(0, 11) * 5), why: '60분이 모이면 1시간이야. 분끼리 먼저 더해 보자.' }), q: st ? `${h}시 ${m}분에 상록숲에 들어가서 ${add}분 뒤에 나왔어. 나온 시각은?` : `${h}시 ${m}분에서 ${add}분 뒤는 몇 시 몇 분?`,
      viz: { type: 'clock', h: H, m: M, explain: true } });
  } },
  { id: 'm_bignum', g: 4, t: '큰 수 (만)', gen: () => {
    const a = rand(1, 9), b = rand(1, 9), n = a * 10000 + b * 1000;
    return mc(n, [
      { v: a * 1000 + b * 100, why: `10000이 ${a}개는 ${a}만(${a * 10000})이야. 0을 하나 빠뜨렸어.` },
      { v: a * 100000 + b * 10000, why: `0을 하나 더 붙였어. 10000은 0이 4개야.` },
      { v: (a + b) * 1000, why: `10000과 1000은 다른 자리야. 더하기 전에 자리를 맞춰야 해.` },
    ], `10000이 ${a}개 → ${a}0000, 1000이 ${b}개 → ${b}000. 합치면 ${n}!`, { q: `10000이 ${a}개, 1000이 ${b}개인 수는?` });
  } },
  { id: 'm_mul_2d2d', g: 4, t: '(두 자리) × (두 자리)', gen: (st) => {
    const a = rand(12, 39), b = rand(12, 29), p = a * b;
    return mc(p, [
      { v: a * ones(b) + a * tens(b), why: `십의 자리 ${tens(b)}는 사실 ${tens(b) * 10}이야. 그래서 ${a} × ${tens(b) * 10} = ${a * tens(b) * 10}을 더해야 해.` },
      { v: tens(a) * tens(b) * 100 + ones(a) * ones(b), why: `십의 자리끼리, 일의 자리끼리만 곱했어. 엇갈린 곱(${tens(a) * 10}×${ones(b)}, ${ones(a)}×${tens(b) * 10})도 더해야 해.` },
      { v: p + 10, why: `받아올림을 한 번 더 했어. 부분곱을 다시 확인해 보자.` },
    ], `${a} × ${b} = ${a} × ${tens(b) * 10} + ${a} × ${ones(b)} = ${a * tens(b) * 10} + ${a * ones(b)} = ${p}.`, {
      q: st ? `버스에 ${a}명씩, ${b}대가 회색시티로 갔어. 모두 몇 명?` : `${a} × ${b} = ?`, viz: { type: 'area', a, b } });
  } },
  { id: 'm_div_rem', g: 4, t: '나머지가 있는 나눗셈', gen: (st) => {
    const b = rand(3, 8), q = rand(3, 9), r = rand(1, b - 1), a = b * q + r;
    const f = (x) => x;
    return mc(`${q} 나머지 ${r}`, [
      { v: `${q - 1} 나머지 ${r + b}`, why: `나머지 ${r + b}는 나누는 수 ${b}보다 커. 한 번 더 나눌 수 있어! 나머지는 항상 ${b}보다 작아야 해.` },
      { v: `${q + 1} 나머지 ${r}`, why: `${b} × ${q + 1} = ${b * (q + 1)}은 ${a}보다 커서 안 돼.` },
      { v: `${q} 나머지 ${b - r}`, why: `나머지는 ${a} − ${b * q} = ${r}이야. 모자란 수가 아니라 남은 수를 써.` },
    ], `${b} × ${q} = ${b * q}, ${a} − ${b * q} = ${r}. 몫 ${q}, 나머지 ${r} (나머지 ${r} < ${b} ✓)`, {
      fmt: f, fill: () => ({ v: `${q + rand(-2, 2)} 나머지 ${rand(0, b - 1)}`, why: '몫 × 나누는 수 + 나머지 = 나누어지는 수가 되는지 확인해 보자.' }), q: st ? `몬스터볼 ${a}개를 ${b}개씩 가방에 넣으면 몇 가방이 차고 몇 개 남을까?` : `${a} ÷ ${b}의 몫과 나머지는?`, viz: { type: 'share', n: a, g: b, rem: true } });
  } },
  { id: 'm_frac_add', g: 4, t: '분모가 같은 분수의 덧셈', gen: (st) => {
    const d = rand(5, 12), a = rand(1, d - 3), b = rand(1, d - a - 1);
    const f = (x) => x;
    return mc(`${a + b}/${d}`, [
      { v: `${a + b}/${d * 2}`, why: `분모끼리도 더했구나. 조각 크기(분모)는 그대로고, 조각 수(분자)만 더해져!` },
      { v: `${a * b}/${d}`, why: `분자를 곱했어. 더하기니까 조각 수를 더해야 해.` },
      { v: `${a + b}/${d * d}`, why: `분모는 조각의 크기라서 바뀌지 않아.` },
    ], `1/${d} 조각이 ${a}개 + ${b}개 = ${a + b}개. 그래서 ${a}/${d} + ${b}/${d} = ${a + b}/${d}!`, {
      fmt: f, fill: () => ({ v: `${a + b + rand(1, 2)}/${d}`, why: `1/${d} 조각을 하나씩 세어 보자. ${a}개와 ${b}개를 합치면 ${a + b}개야.` }), q: st ? `피자를 ${d}조각으로 나눠서 피카츄가 ${a}조각, 꼬부기가 ${b}조각 먹었어. 먹은 양은 전체의 얼마?` : `${a}/${d} + ${b}/${d} = ?`,
      viz: { type: 'fracadd', a, b, d } });
  } },
  { id: 'm_dec_add', g: 4, t: '소수의 덧셈', gen: (st) => {
    const a = rand(2, 9), b = rand(11 - a, 9); // 받아올림
    const fmt = (x) => (typeof x === 'number' ? String(Math.round(x * 100) / 100) : x);
    return mc((a + b) / 10, [
      { v: `0.${a + b}`, why: `0.1이 ${a + b}개면 1과 0.${a + b - 10}이야. 10개가 모이면 1로 올라가!` },
      { v: (a + b) / 100, why: `소수점 자리를 잘못 옮겼어. 0.${a}는 0.1이 ${a}개야.` },
      { v: a + b, why: `소수점을 빼먹었어. 0.${a} + 0.${b}는 1보다 조금 큰 수야.` },
    ], `0.1이 ${a}개 + ${b}개 = ${a + b}개 = ${fmt((a + b) / 10)}.`, {
      fmt, q: st ? `물을 ${fmt(a / 10)}L 마시고 또 ${fmt(b / 10)}L 마셨어. 모두 몇 L?` : `${fmt(a / 10)} + ${fmt(b / 10)} = ?`, viz: { type: 'decimal', o: Math.floor((a + b) / 10), k: (a + b) % 10 } });
  } },
  { id: 'm_angle', g: 4, t: '각도', gen: () => {
    const kind = pick(['right', 'tri', 'straight']);
    if (kind === 'right') return mc(90, [{ v: 180, why: '180도는 일직선이야. 직각은 그 반!' }, { v: 360, why: '360도는 한 바퀴야.' }, { v: 45, why: '45도는 직각의 반이야.' }], '직각은 90도. 책 모서리처럼 반듯한 각이야.', { q: '직각은 몇 도일까?', unit: '도', viz: { type: 'angle', deg: 90 } });
    if (kind === 'straight') return mc(180, [{ v: 90, why: '90도는 직각이야. 일직선은 직각 두 개!' }, { v: 360, why: '360도는 한 바퀴를 다 돈 거야.' }, { v: 100, why: '100도는 딱 떨어지는 일직선이 아니야.' }], '일직선은 직각(90도)이 두 개 → 180도.', { q: '일직선(평각)은 몇 도일까?', unit: '도', viz: { type: 'angle', deg: 180 } });
    const a = rand(30, 80), b = rand(30, 150 - a), c = 180 - a - b;
    return mc(c, [{ v: 360 - a - b, why: '삼각형 세 각의 합은 360도가 아니라 180도야. (360도는 사각형!)' }, { v: 90 - Math.min(a, b) > 0 ? 90 : 100, why: '직각이라고 짐작했구나. 계산으로 확인해 보자: 180 − 두 각.' }, { v: a + b, why: '두 각을 더하기만 했어. 180에서 빼야 나머지 각이 나와.' }],
      `삼각형 세 각의 합은 180도. 180 − ${a} − ${b} = ${c}도!`, { q: `삼각형의 두 각이 ${a}도, ${b}도야. 나머지 한 각은?`, unit: '도', viz: { type: 'tri', a, b, c } });
  } },
  { id: 'm_frac_diff', g: 5, t: '분모가 다른 분수의 덧셈', gen: () => {
    const [a, b] = pick([[2, 3], [2, 5], [3, 4], [2, 7], [3, 5], [4, 5]]);
    const f = (x) => x;
    return mc(`${a + b}/${a * b}`, [
      { v: `2/${a + b}`, why: `분자끼리, 분모끼리 더했구나. 분모가 다르면 조각 크기가 달라서 먼저 통분해야 해!` },
      { v: `2/${a * b}`, why: `통분은 잘 했는데 분자도 바꿔야 해. 1/${a} = ${b}/${a * b}, 1/${b} = ${a}/${a * b}.` },
      { v: `1/${a + b}`, why: `분모를 더하면 조각이 더 작아져 버려. 더했는데 작아지면 이상하지?` },
    ], `통분: 1/${a} = ${b}/${a * b}, 1/${b} = ${a}/${a * b}. 더하면 ${a + b}/${a * b}!`, { fmt: f, q: `1/${a} + 1/${b} = ?`, viz: { type: 'fracadd2', a, b } });
  } },
  { id: 'm_area', g: 5, t: '직사각형의 넓이', gen: (st) => {
    const w = rand(3, 12), h = rand(2, 9);
    return mc(w * h, [
      { v: 2 * (w + h), why: `둘레를 구했구나. 넓이는 안쪽을 채우는 1cm² 칸의 개수야.` },
      { v: w + h, why: `가로와 세로를 더했어. 넓이는 가로 × 세로!` },
      { v: w * h * 2, why: `두 배를 할 필요는 없어. 칸을 세면 가로 × 세로 개야.` },
    ], `한 줄에 ${w}칸씩 ${h}줄 → ${w} × ${h} = ${w * h}${st ? 'm²' : 'cm²'}.`, {
      q: st ? `포켓몬 목장이 가로 ${w}m, 세로 ${h}m인 직사각형이야. 넓이는 몇 m²?` : `가로 ${w}cm, 세로 ${h}cm인 직사각형의 넓이는?`, unit: st ? 'm²' : 'cm²', viz: { type: 'array', r: h, c: w } });
  } },
  { id: 'm_average', g: 5, t: '평균', gen: (st) => {
    const avg = rand(4, 12); const a = avg - rand(1, 3), b = avg + rand(1, 3), c = 3 * avg - a - b;
    return mc(avg, [
      { v: a + b + c, why: `합계까지는 맞아! 평균은 합계를 개수(3)로 나눠야 해.` },
      { v: Math.max(a, b, c), why: `가장 큰 값이 아니라 고르게 나눴을 때의 값이 평균이야.` },
      { v: Math.round((a + b + c) / 2), why: `3개니까 3으로 나눠야 해.` },
    ], `(${a} + ${b} + ${c}) ÷ 3 = ${a + b + c} ÷ 3 = ${avg}. 높은 걸 깎아 낮은 곳을 채운 높이!`, {
      q: st ? `피카츄가 ${a}번, ${b}번, ${c}번 번개를 쐈어. 평균 몇 번 쐈을까?` : `${a}, ${b}, ${c}의 평균은?`, viz: { type: 'bars', vals: [a, b, c], avg } });
  } },
];

function timesGen(a, st) {
  const b = rand(2, 9), p = a * b;
  return mc(p, [
    { v: a * (b - 1), why: `${a}단을 하나 덜 셌어. ${a} × ${b - 1} = ${a * (b - 1)}이고, ${a}를 한 번 더 더하면 ${p}!` },
    { v: a * (b + 1), why: `${a}를 한 번 더 더했어. ${a} × ${b}는 ${a}를 ${b}번만 더해.` },
    { v: a + b, why: `곱하기(×)를 더하기(+)로 했구나. ${a} × ${b}는 ${a}를 ${b}번 더하는 거야.` },
    { v: (a + 1) * b, why: `${a + 1}단과 헷갈렸어.` },
  ], `${a} × ${b}는 ${a}씩 ${b}번 → ${Array.from({ length: b }, (_, i) => a * (i + 1)).join(', ')}. 답 ${p}!`, {
    q: st ? `${pick(POKE)} ${b}마리가 각각 몬스터볼을 ${a}개씩 가졌어. 모두 몇 개?` : `${a} × ${b} = ?`, viz: { type: 'array', r: b, c: a } });
}

export const MATH_BY = Object.fromEntries(MATH.map((s) => [s.id, s]));
