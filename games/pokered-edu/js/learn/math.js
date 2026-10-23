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
  if (extra.help) r.help = fixJosa(String(extra.help).replace(/^\s*📖\s*/u, '')); // 📖 낱말 풀이 (화면이 📖를 붙이므로 글에서는 뗀다)
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
      seen.add(s); list.push({ s, why: `${s}${extra.unit || ''}은(는) 정답 ${fmt(correct)}${extra.unit || ''}보다 ${d}만큼 ${v > correct ? '커' : '작아'}. 세다가 하나를 빠뜨리거나 더 셌을 수 있어. 풀이처럼 한 단계씩 다시 세어 보자.` });
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
/* 쉬운 설명 개편 (2026-10-23, ELI5_GUIDE.md): 문제 그림(pic)에 쓸 그림 글자. 정답은 그림에 넣지 않는다 */
const POKE_E = { 피카츄: '⚡', 꼬렛: '🐭', 구구: '🐦', 캐터피: '🐛', 뿔충이: '🐛', 파이리: '🔥', 꼬부기: '🐢', 이상해씨: '🌱', 꼬마돌: '🪨', 롱스톤: '🐍' };
const THING_E = { 몬스터볼: '🔴', 상처약: '🧴', 나무열매: '🍒', 배지: '🏅' };
const upTo = (from, to) => { const o = []; for (let v = from; v <= to; v++) o.push(v); return o; };
/** 시계 문제의 포켓몬 상황 한 문장 (2026-10-24: 이야기판도 시계 그림을 읽는다) */
const clockStory = (pk) => pick([
  `${pk}이(가) 낮잠에서 깨어 포켓몬센터 시계를 봤어.`,
  `${pk}이(가) 체육관 배틀을 시작할 때 시계를 봤어.`,
  `${pk}이(가) 상록숲에 들어갈 때 시계를 봤어.`,
]);
/** 분수 막대 (문제 그림, 2026-10-24 2차 점검 '모양 문제는 도형 그림'): 한 판을 d칸으로 똑같이 나눈 막대.
 *  fill = 앞에서부터 칠할 칸 수, tags = [[첫 칸, 칸 수, 글]] 칸 안에 쓸 글. 눈금·숫자는 숨긴다.
 *  막대 높이는 늘 같게(칸이 12개여도 칸 안 글이 보이게) — 칸은 세로로 긴 네모가 될 수 있다 */
function barPic(d, fill = 0, tags = []) {
  const X0 = 0.4, X1 = d + 1.6, H = 150, Y = 1.75;
  const segs = [{ x1: 1, y1: 1, x2: d + 1, y2: 1, c: 'ink' }, { x1: 1, y1: 0, x2: d + 1, y2: 0, c: 'ink' }];
  for (let i = 0; i <= d; i++) segs.push({ x1: 1 + i, y1: 0, x2: 1 + i, y2: 1, c: 'ink' });
  for (const [from, n, t] of tags) for (let i = from; i < from + n; i++) segs.push({ x1: 1.5 + i, y1: 0.5, x2: 1.5 + i, y2: 0.5, label: t });
  return { type: 'plot', x: [X0, X1], y: [-0.15, Y - 0.15], h: H, step: 100, anim: false, segs, ...(fill ? { shade: { f: '1', a: 1, b: 1 + fill } } : {}) };
}
/** 각 그림 (문제 그림): 직각 = ㄴ자 모서리 + 직각 표시, 일직선 = 쭉 편 선 + 반원 호. 각도 숫자는 쓰지 않는다 */
function cornerPic(kind, name) {
  const base = { type: 'plot', x: [0, 4.26], y: [0, 3], step: 100, anim: false };
  if (kind === 'right') return { ...base, segs: [
    { x1: 1, y1: 0.6, x2: 3.6, y2: 0.6, c: 'ink', ...(name ? { label: name, ly: 16 } : {}) }, { x1: 1, y1: 0.6, x2: 1, y2: 2.7, c: 'ink' },
    { x1: 1.3, y1: 0.6, x2: 1.3, y2: 0.9, c: 'grey' }, { x1: 1, y1: 0.9, x2: 1.3, y2: 0.9, c: 'grey' },
    { x1: 2, y1: 1.6, x2: 2, y2: 1.6, label: '몇 도?', c: 'a' }] };
  return { ...base, fns: [{ f: 'sqrt(0.64-(x-2.13)^2)+1', c: 'a' }], pts: [{ x: 2.13, y: 1, c: 'ink' }],
    segs: [{ x1: 0.4, y1: 1, x2: 3.86, y2: 1, c: 'ink', ...(name ? { label: name, ly: 16 } : {}) }, { x1: 2.13, y1: 2.15, x2: 2.13, y2: 2.15, label: '몇 도?', c: 'a' }] };
}
/** 자리 나누기 표 (문제 그림): 수를 100묶음·10묶음·낱개로 쪼개 보여 준다 */
const placeTable = (rows, three) => ({ type: 'table', head: three ? ['수', '100묶음', '10묶음', '낱개'] : ['수', '10묶음', '낱개'],
  rows: rows.map(([label, n]) => (three ? [label, `${hund(n)}개`, `${tens(n)}개`, `${ones(n)}개`] : [label, `${tens(n)}개`, `${ones(n)}개`])) });

/* ── 기술(주제) 목록: 쉬운 것 -> 어려운 것 ──
 * 2026-10-23 쉬운 설명 개편: 문제 글(q)·낱말 풀이(help)·문제 그림(pic)·풀이(why·steps)·보기별 설명·왜 필요한지(need).
 * 계산값·정답·틀린 보기 값은 그대로 두고 글만 고쳤다. */
export const MATH = [
  { id: 'm_count', g: 0, t: '10까지 세기', gen: (st) => {
    const n = rand(3, 10);
    const [thing, unit] = pick(THINGS);
    const ball = thing === '몬스터볼';
    return mc(n, [
      { v: n - 1, why: `하나를 빼먹고 셌구나. 세다 보면 건너뛰기 쉬워. 손가락으로 하나씩 짚으며 "하나, 둘…" 하면 빠뜨리지 않아.` },
      { v: n + 1, why: `하나를 두 번 셌을 수 있어. 센 것은 마음속으로 표시해 두면 두 번 세지 않아.` },
      { v: n + 2, why: `실제보다 많이 셌어. 왼쪽 위부터 줄을 따라 차례로 하나씩 세어 보자.` },
    ], `하나씩 짚으며 "하나, 둘, 셋…" 하고 세면 ${n}에서 끝나. 마지막에 말한 수가 모두의 개수야. 그래서 ${n}${unit}!`, {
      q: st ? `${pick(POKE)}이(가) ${thing}을(를) 모았어. 모두 몇 ${unit}일까?` : `그림 속 ${thing}은(는) 모두 몇 ${unit}일까?`,
      pic: ball ? { type: 'count', n } : { type: 'icons', rows: [{ e: THING_E[thing], n }] },
      steps: ['왼쪽 위부터 하나씩 손가락으로 짚어', '짚을 때마다 "하나, 둘, 셋…" 말해', `마지막에 말한 수: ${n}`, `그래서 모두 ${n}${unit}`],
      need: '옛날 양치기는 저녁마다 양이 모두 돌아왔는지 알아야 했대. 그래서 하나씩 짚으며 세었다고 전해져.',
      viz: ball ? { type: 'count', n, label: true } : { type: 'icons', rows: [{ e: THING_E[thing], n, per: 5, t: '5개씩 묶어 세면 쉬워' }], total: `모두 ${n}${unit}` } });
  } },
  { id: 'm_compare10', g: 0, t: '수의 크기 비교', gen: (st) => {
    const ns = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, 4);
    const mx = Math.max(...ns), mn = Math.min(...ns);
    const second = ns.filter((x) => x !== mx).sort((a, b) => b - a)[0];
    const asc = [...ns].sort((a, b) => a - b);
    // 상황판: 포켓몬 4마리가 모은 나무열매 개수를 비교한다 (난수는 st 일 때만 더 뽑는다)
    const who = st ? shuffle([...POKE]).slice(0, 4) : [];
    const top = st ? who[ns.indexOf(mx)] : '';
    return mc(mx, [
      { v: mn, why: `${mn}은(는) 넷 중에서 가장 작은 수야. 크다는 건 더 많다는 뜻이야. 셀 때 가장 나중에 나오는 ${mx}가 가장 커.` },
      { v: second, why: `${second}도 크지만 ${mx}가 더 커. ${second}부터 하나씩 세어 가면 ${mx}가 더 뒤에 나와.` },
      ...ns.filter((x) => x !== mx && x !== mn && x !== second).map((v) => ({ v, why: `${v}보다 ${mx}가 더 커. 열매 ${v}개보다 열매 ${mx}개가 많은 것처럼, 셀 때 뒤에 나오는 수가 커.` })),
    ], st ? `포켓몬 4마리가 모은 개수를 작은 것부터 놓으면 ${asc.join(', ')}. 셀 때 맨 뒤에 나오는 ${mx}가 가장 커. 그래서 ${top}이(가) ${mx}개로 가장 많이 모았어!`
      : `수는 셀 때 뒤에 나올수록 커. 네 수를 작은 것부터 놓으면 ${asc.join(', ')}. 맨 뒤에 있는 ${mx}가 가장 커!`, {
      q: st ? '포켓몬 4마리가 나무열매를 모았어. 가장 많이 모은 포켓몬은 몇 개를 모았을까?' : '아래 보기 중에서 가장 큰 수는 무엇일까?',
      help: st ? '📖 가장 많다 = 하나씩 셀 때 가장 나중까지 세게 되는 것' : '📖 큰 수 = 1, 2, 3 … 하고 셀 때 더 나중에 나오는 수',
      pic: st ? { type: 'icons', rows: ns.map((n, i) => ({ e: '🍒', n, t: `${who[i]} ${POKE_E[who[i]]}`, c: ['b', 'a', 'b', 'a'][i] })) } : { type: 'numline', from: 0, to: 10 },
      steps: [`작은 수부터 줄 세우기: ${asc.join(' → ')}`, `수직선에서 가장 오른쪽: ${mx}`, st ? `가장 많이 모은 포켓몬: ${top} (${mx}개)` : `가장 큰 수: ${mx}`],
      need: '옛날 사람들도 누구 바구니에 열매가 더 많은지 비교해야 공평하게 나눌 수 있었어.',
      viz: { type: 'numline', from: 0, to: 10, marks: ns, hi: mx } });
  } },
  { id: 'm_add10', g: 0, t: '10까지 더하기', gen: (st) => {
    const a = rand(1, 6), b = rand(1, 10 - a), s = a + b;
    const seq = upTo(a + 1, s).join(', ');
    const e = st ? '🍒' : '🍎';
    return mc(s, [
      { v: s - 1, why: `이어 세기를 ${a}부터 시작했구나. ${a}는 이미 있는 수라서 다음 수 ${a + 1}부터 ${b}번 세어야 해.` },
      { v: Math.abs(a - b) || null, why: `빼기를 했구나! +는 '합치기'야. 합치면 처음보다 많아지니까 ${a}보다 커져야 해.` },
      { v: s + 1, why: `하나를 더 셌어. ${a}에서 ${b}칸만 앞으로 가면 ${s}에 도착해. 칸 수를 손가락으로 세어 봐.` },
    ], `${a}개와 ${b}개를 합쳐 하나씩 세면 ${s}개야. ${a}에서 시작해 ${b}번 이어 세도 돼: ${seq}. 답은 ${s}!`, {
      q: st ? `${pick(POKE)}이(가) 나무열매 ${a}개를 먹고, 또 ${b}개를 먹었어. 모두 몇 개 먹었을까?` : `${a} + ${b} = ?`,
      help: st ? '' : '📖 + (더하기) = 두 묶음을 합치기. ? = 우리가 찾을 수',
      pic: { type: 'icons', rows: [{ e, n: a, t: st ? `처음 먹은 ${a}개` : `${a}개` }, { e, n: b, t: st ? `또 먹은 ${b}개` : `${b}개`, c: 'a' }], op: '+', total: '모두 몇 개?' },
      steps: [`${a}에서 시작해`, `${b}번 이어 세기: ${seq}`, `마지막에 센 수 ${s}가 답`, `${a} + ${b} = ${s}`],
      need: '가진 것과 새로 받은 것을 합치면 모두 몇 개인지, 사람들은 아주 옛날부터 매일 계산해야 했어.',
      viz: { type: 'dots', a, b, op: '+' } });
  } },
  { id: 'm_sub10', g: 0, t: '10까지 빼기', gen: (st) => {
    const a = rand(4, 10), b = rand(1, a - 1), d = a - b;
    const down = upTo(d, a - 1).reverse().join(', ');
    return mc(d, [
      { v: a + b, why: `더하기를 했구나. −는 '덜어 내기'라서 처음 ${a}개보다 적어져야 해. ${a}에서 ${b}번 거꾸로 세어 봐.` },
      { v: d + 1, why: `거꾸로 셀 때 ${a}부터 셌구나. ${a}는 처음 개수라서, 하나 작은 ${a - 1}부터 ${b}번 세어야 해.` },
      { v: d - 1 || null, why: `하나를 더 지웠어. ${b}개만 지우고 남은 것을 하나씩 세어 보자.` },
    ], `${a}개에서 ${b}개를 지우고 남은 것을 세면 ${d}개야. ${a}에서 거꾸로 ${b}번 세도 돼: ${down}. 답은 ${d}!`, {
      q: st ? `몬스터볼이 ${a}개 있었는데 ${b}개를 던졌어. 몇 개 남았을까?` : `${a} − ${b} = ?`,
      help: st ? '' : '📖 − (빼기) = 덜어 내기. 덜어 내고 남은 개수를 찾아.',
      pic: { type: 'icons', rows: [{ e: st ? '🔴' : '🍎', n: a, x: b, t: st ? `몬스터볼 ${a}개 (✗ = 던진 공)` : `${a}개에서 ${b}개를 지워요 (✗)` }] },
      steps: [`${a}개 중에서 ${b}개를 지워`, `거꾸로 ${b}번 세기: ${down}`, `남은 것: ${d}개`, `확인: ${d} + ${b} = ${a}`],
      need: '먹거나 쓰고 나서 얼마나 남았는지 알아야 다음 날을 준비할 수 있어. 그래서 사람들은 빼기를 썼어.',
      viz: { type: 'dots', a, b, op: '-' } });
  } },
  { id: 'm_make10', g: 0, t: '10 만들기(모으기)', gen: (st) => {
    const a = rand(1, 9), b = 10 - a;
    const pk = st ? pick(POKE) : '';
    return mc(b, [
      { v: 10 + a, why: `10과 ${a}를 더했구나. 묻는 건 "${a}에 몇을 더해야 10이 될까?"야. 10에서 ${a}를 빼 보자.` },
      { v: a, why: `${a}를 한 번 더 골랐구나. ${a} + ${a} = ${a * 2}라서 10이 아니야.` },
      { v: b + 1, why: `하나가 많아. ${a} + ${b + 1} = ${a + b + 1}이 돼서 10을 넘어.` },
    ], st ? `열매 상자 10칸 중 ${a}칸이 찼으면 빈칸은 10 − ${a} = ${b}칸이야. ${b}개를 더 모으면 딱 10개!`
      : `10칸 상자에 ${a}칸이 차 있으면 빈칸은 10 − ${a} = ${b}칸이야. 빈칸을 채울 ${b}개를 모으면 딱 10!`, {
      q: st ? `${pk}이(가) 나무열매 ${a}개를 모았어. 10개를 채우려면 몇 개 더 모아야 할까?` : `${a}와 몇을 모으면 10이 될까?`,
      help: st ? '📖 채우다 = 모자란 만큼 더 넣어 꽉 맞추기' : '📖 모으기 = 두 묶음을 합쳐 하나로 만들기 (더하기와 같아)',
      pic: st ? { type: 'icons', rows: [{ e: '🍒', n: a, t: fixJosa(`${pk}이(가) 모은 나무열매 ${a}개`) }], total: '10개가 되려면 몇 개 더?' } // 그림 글은 mc() 가 조사를 고쳐 주지 않는다
        : { type: 'icons', rows: [{ e: '🔴', n: a, t: `공 ${a}개` }], total: '10개가 되려면 몇 개 더?' },
      steps: [`10칸 중 ${a}칸이 차 있어`, `빈칸: 10 − ${a} = ${b}칸`, `확인: ${a} + ${b} = 10`],
      need: '손가락이 10개라서 사람들은 옛날부터 10씩 묶어 셌어. 10을 만드는 짝을 알면 큰 수 계산이 빨라져.',
      viz: { type: 'tenframe', a, b } });
  } },
  { id: 'm_add_carry1', g: 1, t: '받아올림 있는 덧셈 (한 자리)', gen: (st) => {
    const a = rand(5, 9), b = rand(11 - a, 9), s = a + b;
    const fill = 10 - a, rest = b - fill;
    const p1 = st ? pick(POKE) : '', p2 = st ? pick(POKE) : ''; // 상황 문제일 때만 뽑는다 (옛 생성기와 난수 순서 같게)
    return mc(s, [
      { v: s % 10, why: `10을 만들고 남은 ${s % 10}만 적었구나. 10 한 묶음이 생겼으니 그것도 세야 해. 10 + ${s % 10} = ${s}.` },
      { v: s - 1, why: `이어 세기를 ${a}부터 시작했구나. ${a}는 이미 센 수라서 ${a + 1}부터 ${b}번 세어야 해.` },
      { v: s + 1, why: `하나를 더 셌어. ${a} + ${fill} = 10을 먼저 만들고, 남은 ${rest}를 더하면 ${s}야.` },
    ], `${a}에 ${fill}를 더하면 10이 돼. 그래서 ${b}를 ${fill}와 ${rest}로 갈라. ${a} + ${fill} = 10, 10 + ${rest} = ${s}. 답은 ${s}!`, {
      q: st ? `${p1} ${a}마리와 ${p2} ${b}마리가 풀숲에 있어. 모두 몇 마리일까?` : `${a} + ${b} = ?`,
      pic: st ? { type: 'icons', rows: [{ e: POKE_E[p1], n: a, t: `${p1} ${a}마리` }, { e: POKE_E[p2], n: b, t: `${p2} ${b}마리`, c: 'a' }], op: '+', total: '모두 몇 마리?' }
        : { type: 'icons', rows: [{ e: '🔴', n: a, t: `${a}개` }, { e: '🔵', n: b, t: `${b}개`, c: 'b' }], op: '+', total: '모두 몇 개?' },
      steps: [`${a}가 10이 되려면 ${fill}가 더 필요해`, `${b}를 ${fill}와 ${rest}로 갈라`, `${a} + ${fill} = 10 (10 한 묶음!)`, `10 + ${rest} = ${s}`],
      need: '옛날 양치기는 손가락 10개로는 양을 다 셀 수 없었어. 그래서 10개를 한 묶음으로 묶어 세게 됐다고 해.',
      viz: { type: 'tenframe2', a, b } });
  } },
  { id: 'm_sub_borrow1', g: 1, t: '받아내림 있는 뺄셈 (십몇 − 몇)', gen: (st) => {
    const b = rand(3, 9), a = 10 + rand(0, b - 1), d = a - b;
    const wrongSmall = 10 + Math.abs(ones(a) - b);
    const o = ones(a);
    const down10 = upTo(d, 9).reverse().join(', '); // 10에서 거꾸로 b번: 9, 8, … d
    /* a = 10 이면 '거꾸로 b − o' 실수 값이 a + b 와 같아져 보기가 모자랐다 → 하나 더 지운 실수(d − 1)로 (2026-10-24 2차 점검 G1) */
    return mc(d, [
      o ? { v: wrongSmall, why: `일의 자리 ${o}에서 ${b}를 못 빼니까 거꾸로 ${b} − ${o}를 했구나. 빼는 순서는 못 바꿔. 모자라면 10에서 빼야 해!` }
        : { v: d - 1, why: `${d - 1}은(는) 하나를 더 지운 거야(10 − ${b + 1}). ${b}칸만 지우면 ${d}칸이 남아. 지운 칸을 다시 세어 봐.` },
      { v: a + b, why: `더하기를 했어. 빼기는 덜어 내는 거라 처음 ${a}개보다 적어져야 해.` },
      { v: d + 1, why: `거꾸로 셀 때 ${a}부터 셌구나. ${a}는 처음 개수라서 ${a - 1}부터 ${b}번 거꾸로 세어야 해.` },
    ], o ? `${a}를 10과 ${o}로 나눠 생각해. 10에서 ${b}를 빼면 ${10 - b}, 남은 ${o}를 더하면 ${d}. 답은 ${d}!` : `10에서 거꾸로 ${b}번 세면 ${down10}. 10칸 중 ${b}칸을 지우고 남은 칸을 세도 ${d}칸이야. 답은 ${d}!`, {
      q: st ? `상처약이 ${a}개 있었는데 ${b}개를 썼어. 몇 개 남았을까?` : `${a} − ${b} = ?`,
      pic: { type: 'icons', rows: [{ e: st ? '🧴' : '🔴', n: 10, per: 10, t: '10개 한 묶음' }, ...(o ? [{ e: st ? '🧴' : '🔴', n: o, t: `낱개 ${o}개` }] : [])], total: `여기서 ${b}개를 빼면?` },
      steps: o ? [`${a}를 10과 ${o}로 가르기`, `10 − ${b} = ${10 - b}`, `${10 - b} + ${o} = ${d}`, `확인: ${d} + ${b} = ${a}`]
        : [`10칸 중 ${b}칸을 지워`, `거꾸로 ${b}번 세기: ${down10}`, `남은 칸: ${d}`, `확인: ${d} + ${b} = 10`],
      need: '가진 낱개보다 많이 써야 할 때가 있지? 사람들은 10개 묶음을 풀어 낱개로 바꾸는 방법으로 해결했어.',
      viz: { type: 'borrow', a, b } });
  } },
  { id: 'm_place2', g: 1, t: '두 자리 수 (자릿값)', gen: (st) => {
    const t = rand(1, 9), o = rand(0, 9); const n = t * 10 + o;
    if (o === t) return MATH_BY.m_place2.gen(st);
    const box = st ? '상자' : '봉지', pk = st ? pick(POKE) : '';
    return mc(n, [
      { v: o * 10 + t, why: `자리를 바꿔 썼어. 10묶음 수 ${t}는 왼쪽 칸(십의 자리), 낱개 수 ${o}는 오른쪽 칸(일의 자리)에 써.` },
      { v: t + o, why: `${t}와 ${o}를 그냥 더했구나. ${box} 하나에 10개씩이라 ${box} ${t}개는 ${t * 10}개야.` },
      { v: t * 100 + o, why: `${box} 하나를 100개로 셌어. ${box} 하나는 10개라서 ${box} ${t}개는 ${t * 10}개야.` },
    ], `${box} ${t}개는 10씩 ${t}번 세어 ${t * 10}개. 낱개 ${o}개를 더하면 ${n}개야. 왼쪽 칸에 묶음 수 ${t}, 오른쪽 칸에 낱개 수 ${o}를 써.`, {
      q: st ? `${pk}이(가) 몬스터볼이 10개씩 든 상자 ${t}개${o ? `와 낱개 몬스터볼 ${o}개를 가졌어` : '를 가졌어. 낱개는 없어'}. 몬스터볼은 모두 몇 개일까?`
        : `사탕이 10개씩 든 봉지가 ${t}개${o ? `, 낱개 사탕이 ${o}개 있어` : ' 있고 낱개 사탕은 없어'}. 사탕은 모두 몇 개일까?`,
      help: '📖 두 자리 수: 왼쪽 칸(십의 자리)에 열 개 묶음의 수, 오른쪽 칸(일의 자리)에 낱개 수',
      pic: st ? { type: 'icons', rows: [{ e: '📦', n: t, t: '몬스터볼 10개씩 든 상자' }, ...(o ? [{ e: '🔴', n: o, t: '낱개 몬스터볼', c: 'a' }] : [])], op: o ? '+' : undefined }
        : { type: 'icons', rows: [{ e: '🛍️', n: t, t: '10개씩 든 봉지' }, ...(o ? [{ e: '🍬', n: o, t: '낱개 사탕', c: 'a' }] : [])], op: o ? '+' : undefined },
      steps: [`${box} ${t}개 = 10씩 ${t}번 = ${t * 10}`, `낱개 ${o}개 = ${o}`, `${t * 10} + ${o} = ${n}`],
      need: '옛날 사람들은 큰 수를 셀 때 10개씩 묶었어. 그래서 묶음 수와 낱개 수만 차례로 쓰는 지금의 수 쓰기가 생겼어.',
      viz: { type: 'blocks', n } });
  } },
  { id: 'm_add2d1d', g: 1, t: '(두 자리)+(한 자리)', gen: (st) => {
    let a; do { a = rand(12, 88); } while (ones(a) < 2);
    const b = rand(10 - ones(a), 9);
    const s = a + b;
    const oo = ones(a) + b;
    return mc(s, [
      { v: tens(a) * 100 + ones(a) + b, why: `일의 자리 합 ${oo}를 그대로 붙여 썼구나. 한 칸에는 숫자 하나만! 10은 십의 자리로 올려 보내야 해.` },
      { v: s - 10, why: `받아올린 1을 잊었어. 일의 자리에서 10이 생기면 십의 자리가 1 커져서 ${tens(s)}가 돼.` },
      { v: a + b * 10, why: `${b}를 십의 자리에 더했구나. ${b}는 낱개라서 일의 자리끼리 더해야 해.` },
    ], `낱개(일의 자리)부터 더해: ${ones(a)} + ${b} = ${oo}. 10묶음 하나가 생겼으니 그 1을 십의 자리로 올리고 ${oo % 10}만 남겨. 십의 자리는 ${tens(a)} + 1 = ${tens(s)}. 답은 ${s}!`, {
      q: st ? `${pick(POKE)}의 레벨은 ${a}야. ${b}레벨 더 오르면 몇 레벨일까?` : `${a} + ${b} = ?`,
      pic: { type: 'icons', rows: [{ e: '📦', n: tens(a), t: `${a} = 10개 묶음 ${tens(a)}개` }, { e: '🔴', n: ones(a), t: `낱개 ${ones(a)}개` }, { e: '🔵', n: b, t: `더하는 ${b}개`, c: 'b' }], op: '+', total: '모두 몇 개?' },
      steps: [`일의 자리: ${ones(a)} + ${b} = ${oo}`, `10은 십의 자리로 올려 (받아올림 1)`, `일의 자리에 ${oo % 10}를 써`, `십의 자리: ${tens(a)} + 1 = ${tens(s)}`, `답: ${s}`],
      need: '점수나 물건 수처럼 두 자리 수를 더할 일은 매일 생겨. 낱개가 10이 차면 묶음으로 바꾸면 쉽게 계산돼.',
      viz: { type: 'col', a, b, op: '+' } });
  } },
  { id: 'm_clock_half', g: 1, t: '시계 보기 (몇 시, 몇 시 30분)', gen: (st) => {
    const h = rand(1, 12), half = Math.random() < 0.5;
    const sq = st ? clockStory(pick(POKE)) : '';
    const f = (hh, mm) => `${hh}시${mm ? ' 30분' : ''}`;
    const next = h % 12 + 1;
    const ws = half
      ? [{ v: f(next, true), why: `짧은바늘이 ${h}와 ${next} 사이에 있으면 아직 ${next}시가 안 된 거야. 지나온 숫자 ${h}를 읽어.` },
        { v: `6시${h === 6 ? ' 30분' : ''}`, why: `긴바늘이 6을 가리키는 건 '30분'이라는 뜻이야. 몇 시인지는 짧은바늘로 읽어.` },
        { v: f(h, false), why: `긴바늘이 12가 아니라 6에 있어. 긴바늘이 6이면 반 바퀴 돈 30분이야.` }]
      : [{ v: `12시${h === 12 ? ' 30분' : ''}`, why: `긴바늘이 12에 있는 건 '딱 그 시각(정각)'이라는 뜻이야. 몇 시인지는 짧은바늘로 읽어.` },
        { v: f(h, true), why: `긴바늘이 6에 있어야 30분이야. 지금 긴바늘은 12에 있으니 정각이야.` },
        { v: f(next, false), why: `짧은바늘은 ${h}를 딱 가리켜. ${next}가 아니야.` }];
    return mc(f(h, half), ws, half
      ? `짧은바늘이 ${h}와 ${next} 사이면 아직 ${h}시야. 긴바늘이 6을 가리키면 반 바퀴, 30분이야. 그래서 ${h}시 30분!`
      : `짧은바늘이 ${h}를 가리키니까 ${h}시. 긴바늘이 12에 있으면 딱 그 시각(정각)이야. 그래서 ${h}시!`, {
      fill: () => ({ v: f(rand(1, 12), Math.random() < 0.5), why: '짧은바늘은 시, 긴바늘은 분을 알려 줘. 두 바늘을 하나씩 따로 읽어 보자.' }),
      q: st ? `${sq} 그림 속 시계를 읽으면 몇 시일까?` : '그림 속 시계를 읽어 봐. 지금 몇 시일까?',
      help: "📖 짧은바늘은 '시', 긴바늘은 '분'을 알려 줘.",
      steps: half ? [`짧은바늘: ${h}와 ${next} 사이 → ${h}시`, '긴바늘: 6 → 30분', `${h}시 30분`] : [`짧은바늘: ${h} → ${h}시`, '긴바늘: 12 → 정각(0분)', `${h}시`],
      need: '옛날 사람들은 해 그림자로 시간을 짐작했어. 시계가 생기자 모두가 같은 시각에 만나고 일할 수 있게 됐어.',
      pic: { type: 'clock', h, m: half ? 30 : 0 }, viz: { type: 'clock', h, m: half ? 30 : 0, explain: true } });
  } },
  { id: 'm_add2d2d', g: 2, t: '받아올림 있는 두 자리 덧셈', gen: (st) => {
    let a, b; do { a = rand(15, 69); b = rand(15, 89 - a + 10); } while (ones(a) + ones(b) < 10 || a + b > 99);
    const s = a + b;
    const oo = ones(a) + ones(b);
    return mc(s, [
      { v: Number(`${tens(a) + tens(b)}${ones(a) + ones(b)}`), why: `일의 자리 합 ${oo}를 그대로 붙여 썼구나. 한 칸에는 숫자 하나만 들어가. 10은 십의 자리로 올려야 해!` },
      { v: s - 10, why: `받아올린 1을 십의 자리에 더하는 걸 잊었어. ${tens(a)} + ${tens(b)} + 1 = ${tens(s)}야.` },
      { v: s + 10, why: `받아올림을 두 번 했어. 일의 자리에서 올라간 1은 한 번만 더해.` },
    ], `같은 자리끼리 더해. 일의 자리 ${ones(a)} + ${ones(b)} = ${oo}, 10묶음이 생기니 ${oo % 10}를 쓰고 1을 십의 자리로 올려. 십의 자리 ${tens(a)} + ${tens(b)} + 1 = ${tens(s)}. 답은 ${s}!`, {
      q: st ? `구구 ${a}마리와 꼬렛 ${b}마리를 만났어. 모두 몇 마리일까?` : `${a} + ${b} = ?`,
      pic: placeTable([[`${a}`, a], [`+ ${b}`, b]]),
      steps: [`일의 자리: ${ones(a)} + ${ones(b)} = ${oo}`, `${oo % 10}를 쓰고 1을 올려`, `십의 자리: ${tens(a)} + ${tens(b)} + 1 = ${tens(s)}`, `답: ${s}`],
      need: '가게 주인은 하루 동안 팔린 물건 수를 더해야 했어. 자리마다 나눠 더하는 방법 덕분에 큰 수도 틀리지 않게 됐어.',
      viz: { type: 'col', a, b, op: '+' } });
  } },
  { id: 'm_sub2d2d', g: 2, t: '받아내림 있는 두 자리 뺄셈', gen: (st) => {
    let a, b; do { a = rand(31, 98); b = rand(12, a - 10); } while (ones(a) >= ones(b) || a - b < 5);
    const d = a - b;
    const small = (tens(a) - tens(b)) * 10 + Math.abs(ones(a) - ones(b));
    const x = 10 + ones(a) - ones(b);
    return mc(d, [
      { v: small, why: `일의 자리 ${ones(a)} − ${ones(b)}가 안 되니까 거꾸로 ${ones(b)} − ${ones(a)}를 했구나. 빼는 순서는 못 바꿔! 십의 자리에서 10을 빌려 와야 해.` },
      { v: d + 10, why: `10을 빌려 왔으면 십의 자리를 1 줄여야 해. 그걸 잊어서 10만큼 커졌어.` },
      { v: a + b, why: `더하기를 했어. 빼고 남은 수는 처음 수 ${a}보다 작아야 해.` },
    ], `일의 자리 ${ones(a)}에서 ${ones(b)}를 못 빼. 그래서 십의 자리에서 10을 빌려 와 ${10 + ones(a)} − ${ones(b)} = ${x}. 십의 자리는 하나 줄어 ${tens(a) - 1} − ${tens(b)} = ${tens(d)}. 답은 ${d}!`, {
      q: st ? `돈이 ${a}원 있었는데 ${b}원을 썼어. 얼마 남았을까?` : `${a} − ${b} = ?`,
      pic: placeTable([[`${a}`, a], [`− ${b}`, b]]),
      steps: [`일의 자리 ${ones(a)} − ${ones(b)}: 모자라!`, `10을 빌려 와: ${10 + ones(a)} − ${ones(b)} = ${x}`, `빌려준 십의 자리: ${tens(a)} − 1 = ${tens(a) - 1}`, `십의 자리: ${tens(a) - 1} − ${tens(b)} = ${tens(d)}`, `답: ${d}`],
      need: '돈을 쓰고 남은 돈을 셀 때처럼, 낱개가 모자랄 때가 많아. 그래서 10 묶음 하나를 풀어 쓰는 방법이 생겼어.',
      viz: { type: 'col', a, b, op: '-' } });
  } },
  { id: 'm_place3', g: 2, t: '세 자리 수 (자릿값)', gen: (st) => {
    const h = rand(1, 9), o = rand(1, 9), n = h * 100 + o; // 십의 자리 0
    return mc(n, [
      { v: h * 10 + o, why: `0을 빼먹었어. 10묶음이 없어도 가운데 칸에 0을 써야 해. 안 쓰면 ${h * 10 + o}처럼 100묶음이 10묶음으로 줄어 버려.` },
      { v: h * 1000 + o, why: `0을 너무 많이 썼어. 100묶음 ${h}개는 ${h * 100}이야. ${h * 1000}은(는) 1000묶음 ${h}개야.` },
      { v: h * 100 + o * 10, why: `낱개 ${o}개는 맨 오른쪽 칸(일의 자리)에 써야 해. 가운데 칸에 쓰면 ${o * 10}이 돼.` },
    ], `상자 ${h}개는 ${h * 100}개, 10개 묶음은 없으니 0, 낱개는 ${o}개. 칸에 차례로 쓰면 ${h}, 0, ${o} → ${n}. 빈 칸에 0을 써야 자리가 안 밀려!`, {
      q: st ? `포켓몬센터 창고에 상처약 100개가 든 상자 ${h}개와 낱개 상처약 ${o}개가 있어. 10개 묶음은 없어. 상처약은 모두 몇 개일까?`
        : `사탕 100개가 든 상자 ${h}개와 낱개 사탕 ${o}개가 있어. 10개짜리 봉지는 없어. 사탕은 모두 몇 개일까?`,
      help: '📖 세 자리 수: 왼쪽부터 100묶음 수, 10묶음 수, 낱개 수를 차례로 써.',
      pic: st ? { type: 'icons', rows: [{ e: '📦', n: h, t: '상처약 100개짜리 상자' }, { e: '🧴', n: o, t: '낱개 상처약', c: 'a' }], op: '+' }
        : { type: 'icons', rows: [{ e: '📦', n: h, t: '100개짜리 상자' }, { e: '🍬', n: o, t: '낱개 사탕', c: 'a' }], op: '+' },
      steps: [`100묶음 ${h}개 → 백의 자리 ${h}`, '10묶음 0개 → 십의 자리 0', `낱개 ${o}개 → 일의 자리 ${o}`, `차례로 쓰면 ${n}`],
      need: '옛날 사람들은 빈자리를 나타낼 기호가 없어서 수를 헷갈리기도 했어. 그래서 비어 있음을 뜻하는 0을 쓰게 됐어.',
      viz: { type: 'blocks', n } });
  } },
  { id: 'm_mul_concept', g: 2, t: '곱셈의 뜻 (묶어 세기)', gen: (st) => {
    const a = rand(2, 5), b = rand(2, 5), p = a * b;
    const jumps = Array.from({ length: b }, (_, i) => a * (i + 1)).join(', ');
    return mc(p, [
      { v: a + b, why: `${a}와 ${b}를 더했구나. "${a}개씩 ${b}묶음"은 묶음마다 ${a}개가 있으니 ${a}를 ${b}번 더해야 해.` },
      { v: Number(`${a}${b}`), why: `두 수를 나란히 붙여 썼어. ${a} × ${b}는 ${a}를 ${b}번 더한 값이야.` },
      { v: a * (b - 1), why: `한 묶음을 빼먹었어. 묶음이 ${b}개니까 ${a}를 ${b}번 더해야 해.` },
    ], `${a}개씩 ${b}묶음은 ${a}를 ${b}번 더한 거야: ${Array(b).fill(a).join(' + ')} = ${p}. 같은 수를 여러 번 더하는 걸 짧게 ${a} × ${b}라고 써.`, {
      q: st ? `몬스터볼이 ${a}개씩 든 상자가 ${b}개 있어. 몬스터볼은 모두 몇 개?` : `${a}개씩 ${b}묶음은 모두 몇 개일까?`,
      steps: [`한 묶음에 ${a}개, 묶음은 ${b}개`, `${a}씩 뛰어 세기: ${jumps}`, `짧게 쓰면 ${a} × ${b} = ${p}`],
      need: '옛날 상인들은 같은 개수씩 든 자루를 하나하나 세기 힘들었어. 그래서 몇 개씩 몇 묶음을 한 번에 세는 곱셈을 썼어.',
      pic: { type: 'groups', a, b }, viz: { type: 'groups', a, b } });
  } },
  { id: 'm_times_a', g: 2, t: '곱셈구구 (2, 5, 3, 4단)', gen: (st) => timesGen(pick([2, 5, 3, 4]), st) },
  { id: 'm_times_b', g: 2, t: '곱셈구구 (6, 7, 8, 9단)', gen: (st) => timesGen(pick([6, 7, 8, 9]), st) },
  { id: 'm_length', g: 2, t: '길이 (m와 cm)', gen: (st) => {
    const m = rand(1, 5), cm = rand(5, 95), t = m * 100 + cm;
    const mm = m > 1 ? ` 그래서 ${m}m는 ${m * 100}cm야.` : '';
    return mc(t, [
      { v: m * 10 + cm, why: `1m를 10cm로 생각했구나. 1m는 100cm야.${mm}` },
      cm < 10 ? { v: Number(`${m}${cm}`), why: `${m}과 ${cm}을 그냥 붙여 썼구나. ${m}m는 ${m * 100}cm라서, ${cm}cm를 더하면 ${t}cm가 돼.` } : { v: m * 1000 + cm, why: `1m를 1000cm로 생각했어. 1m는 100cm야.${mm}` },
      { v: m + cm, why: `m와 cm를 그냥 더했구나. 단위가 다르면 바로 더할 수 없어. 먼저 m를 cm로 바꾸자.` },
    ], m > 1 ? `1m는 100cm야. 그러니까 ${m}m는 100을 ${m}번 더한 ${m * 100}cm. 여기에 ${cm}cm를 더하면 ${t}cm!` : `1m는 100cm야. 여기에 ${cm}cm를 더하면 100 + ${cm} = ${t}cm!`, {
      q: st ? `롱스톤의 몸길이가 ${m}m ${cm}cm라면 몇 cm일까?` : `${m}m ${cm}cm는 몇 cm일까?`, unit: 'cm',
      help: '📖 m(미터)와 cm(센티미터)는 길이를 재는 단위. 1m = 100cm',
      steps: m > 1 ? ['1m = 100cm', `${m}m = 100cm × ${m} = ${m * 100}cm`, `${m * 100}cm + ${cm}cm = ${t}cm`] : ['1m = 100cm', `100cm + ${cm}cm = ${t}cm`],
      need: '옛날에는 손 뼘이나 발 길이로 쟀더니 사람마다 길이가 달랐어. 그래서 모두 똑같이 쓰는 m와 cm를 정했어.',
      viz: { type: 'ruler', m, cm } });
  } },
  { id: 'm_clock_min', g: 2, t: '시계 보기 (몇 시 몇 분)', gen: (st) => {
    const h = rand(1, 12), k = rand(1, 11), mm = k * 5;
    const sq = st ? clockStory(pick(POKE)) : '';
    const f = (hh, m2) => `${hh}시 ${m2}분`;
    const next = h % 12 + 1;
    return mc(f(h, mm), [
      { v: f(h, k), why: `긴바늘 숫자 ${k}를 그대로 ${k}분으로 읽었구나. 긴바늘은 숫자 하나에 5분이라 5 × ${k} = ${mm}분이야.` },
      { v: mm >= 30 ? f(next, mm) : f(h === 1 ? 12 : h - 1, mm), why: `짧은바늘은 지나온 숫자를 읽어. 짧은바늘이 ${h}와 ${next} 사이니까 ${h}시야.` },
      { v: f(k === 0 ? 12 : k, h * 5 % 60), why: `짧은바늘과 긴바늘을 바꿔 읽었어. 짧은(굵은)바늘이 '시', 긴바늘이 '분'이야.` },
    ], `짧은바늘은 지나온 숫자 ${h}를 읽어서 ${h}시. 긴바늘은 숫자 하나에 5분이라 ${k}를 가리키면 5 × ${k} = ${mm}분. 그래서 ${h}시 ${mm}분!`, {
      fill: () => ({ v: f(rand(1, 12), rand(1, 11) * 5), why: '긴바늘이 가리키는 숫자에 5를 곱하면 분이 돼. 짧은바늘은 지나온 숫자를 읽어.' }),
      q: st ? `${sq} 그림 속 시계를 읽으면 몇 시 몇 분일까?` : '그림 속 시계를 읽어 봐. 지금 몇 시 몇 분일까?',
      help: "📖 짧은바늘은 '시', 긴바늘은 '분'을 알려 줘.",
      steps: [`짧은바늘: ${h}와 ${next} 사이 → ${h}시`, `긴바늘: ${k}를 가리켜`, `숫자 하나 = 5분 → 5 × ${k} = ${mm}분`, `${h}시 ${mm}분`],
      need: '기차나 학교처럼 많은 사람이 같은 시각에 움직이려면 몇 분까지 정확히 읽어야 했어.',
      pic: { type: 'clock', h, m: mm }, viz: { type: 'clock', h, m: mm, explain: true } });
  } },
  { id: 'm_add3d', g: 3, t: '세 자리 덧셈', gen: (st) => {
    let a, b; do { a = rand(120, 680); b = rand(110, 999 - a); } while (ones(a) + ones(b) < 10 || a + b > 999);
    const s = a + b;
    const o1 = ones(a) + ones(b), t1 = tens(a) + tens(b) + 1, c2 = t1 >= 10 ? 1 : 0, h1 = hund(a) + hund(b) + c2;
    /* 풀이는 이 문제의 숫자로, 올리는 까닭(낱개 10개 = 10묶음 1개)부터 (2026-10-24 2차 점검 G4) */
    /* '4만 쓰고'는 '사만(40000)'으로 읽힐 수 있어 '1을 올리고 4를 써'로 쓴다 (검증 2026-10-24) */
    const why = `일의 자리 ${ones(a)} + ${ones(b)} = ${o1}. 낱개 10개는 10묶음 1개라서 1을 십의 자리로 올리고 ${o1 % 10}을 써. 십의 자리 ${tens(a)} + ${tens(b)} + 1 = ${t1}${c2 ? `, 여기서도 1을 올리고 ${t1 % 10}을 써` : ''}. 백의 자리 ${hund(a)} + ${hund(b)}${c2 ? ' + 1' : ''} = ${h1}. 답은 ${s}!`;
    return mc(s, [
      { v: s - 10, why: `일의 자리에서 받아올린 1을 십의 자리에 더하지 않았어. 십의 자리는 ${tens(a)} + ${tens(b)} + 1로 계산해.` },
      { v: Number(`${hund(a) + hund(b)}${tens(a) + tens(b)}${ones(a) + ones(b)}`), why: `자리마다 합을 그대로 이어 썼어. 한 자리에는 숫자 하나만! 합이 10이 되거나 넘으면 윗자리로 1을 올려야 해.` },
      { v: s + 100, why: `백의 자리에 1을 한 번 더 더했어. 올림은 바로 아랫자리 합이 10이 되거나 넘을 때만 해.` },
    ], why, {
      q: st ? `포켓몬센터에 오늘 ${a}명, 어제 ${b}명이 왔어. 모두 몇 명일까?` : `${a} + ${b} = ?`,
      pic: placeTable([[`${a}`, a], [`+ ${b}`, b]], true),
      steps: [`일의 자리: ${ones(a)} + ${ones(b)} = ${o1} → ${o1 % 10} 쓰고 1 올림`, `십의 자리: ${tens(a)} + ${tens(b)} + 1 = ${t1}${c2 ? ` → ${t1 % 10} 쓰고 1 올림` : ''}`, `백의 자리: ${hund(a)} + ${hund(b)}${c2 ? ' + 1' : ''} = ${h1}`, `답: ${s}`],
      need: '방문자 수, 물건 개수처럼 세 자리 수를 더할 일이 많아. 자리를 맞춰 쓰고 올림하면 누구나 정확히 더할 수 있어.',
      viz: { type: 'col', a, b, op: '+' } });
  } },
  { id: 'm_sub3d', g: 3, t: '세 자리 뺄셈', gen: (st) => {
    let a, b; do { a = rand(300, 950); b = rand(110, a - 50); } while (ones(a) >= ones(b));
    const d = a - b;
    const ta = tens(a), tb = tens(b), b2 = ta - 1 < tb; // b2: 십의 자리도 모자라 백에서 빌린다
    const oa = ones(a), ob = ones(b), ha = hund(a), hb = hund(b);
    /* 풀이 한 줄 = 계산 하나. 빌려 오기(100 = 10 × 10, 10 = 1 × 10)도 한 줄로 따로 쓴다 (2026-10-24 점검).
     * 이야기판(돈)은 '100원 동전 1개 → 10원 동전 10개'처럼 동전 바꾸기로 말한다 */
    const borO = st ? '10원 1개 → 1원 10개,' : '십에서 10 빌려';
    const borT = st ? '100원 1개 → 10원 10개,' : '백에서 10 빌려';
    const subSteps = ta === 0 ? [
      st ? `100원 동전 1개 → 10원 동전 10개: 100원 ${ha} − 1 = ${ha - 1}개` : `백 1개 → 십 10개: 백 ${ha} − 1 = ${ha - 1}`,
      st ? `10원 동전 1개 → 1원 동전 10개: 10원 10 − 1 = 9개` : `십 1개 → 일 10개: 십 10 − 1 = 9`,
      `일: ${oa + 10} − ${ob} = ${oa + 10 - ob}`,
      `십: 9 − ${tb} = ${9 - tb}`,
      `백: ${ha - 1} − ${hb} = ${ha - 1 - hb} → 답 ${d}`,
    ] : b2 ? [
      `일: ${borO} ${oa + 10} − ${ob} = ${oa + 10 - ob}`,
      `십: 빌려줘서 ${ta} − 1 = ${ta - 1}, ${tb}보다 작아!`,
      `십: ${borT} ${ta + 9} − ${tb} = ${ta + 9 - tb}`,
      `백: 빌려줘서 ${ha} − 1 = ${ha - 1}`,
      `백: ${ha - 1} − ${hb} = ${ha - 1 - hb} → 답 ${d}`,
    ] : [
      `일: ${borO} ${oa + 10} − ${ob} = ${oa + 10 - ob}`,
      `십: 빌려줘서 ${ta} − 1 = ${ta - 1}`,
      `십: ${ta - 1} − ${tb} = ${ta - 1 - tb}`,
      `백: ${ha} − ${hb} = ${ha - hb}`,
      `답: ${d}`,
    ];
    const why = ta === 0
      ? `일의 자리(맨 오른쪽) ${oa}에서 ${ob}를 못 빼는데, 십의 자리가 0이라 바로 못 빌려. 그래서 ${st ? '100원 동전 1개를 10원 10개로, 그중 10원 1개를 1원 10개로 바꿔' : '백 1개를 십 10개로(100 = 10 × 10), 그중 십 1개를 일 10개로 바꿔'}. 그다음 ${oa + 10} − ${ob}, 9 − ${tb}, ${ha - 1} − ${hb}를 차례로 빼면 ${d}!`
      : b2 ? `일의 자리(맨 오른쪽) ${oa}에서 ${ob}를 못 빼서 ${st ? '10원 동전 1개를 1원 10개로 바꿔' : '십에서 10을 빌려 와'} ${oa + 10} − ${ob}. 십의 자리도 모자라서 ${st ? '100원 동전 1개를 10원 10개로 바꿔' : '백에서 10을 빌려 와(100 = 10 × 10)'} ${ta + 9} − ${tb}. 빌려준 자리는 1씩 줄어. 차례로 빼면 ${d}!`
        : `일의 자리(맨 오른쪽) ${oa}에서 ${ob}를 못 빼서 ${st ? '10원 동전 1개를 1원 10개로 바꿔' : '십의 자리에서 10을 빌려 와'} ${oa + 10} − ${ob} = ${oa + 10 - ob}. 빌려준 십의 자리는 1 줄어 ${ta - 1} − ${tb} = ${ta - 1 - tb}, 백의 자리는 ${ha} − ${hb} = ${ha - hb}. 그래서 ${d}!`;
    return mc(d, [
      { v: d + 10, why: `십의 자리에서 10을 빌려 왔으면 그 자리를 1 줄여야 해. 그걸 잊어서 10만큼 커졌어.` },
      { v: Number(`${Math.abs(hund(a) - hund(b))}${Math.abs(tens(a) - tens(b))}${Math.abs(ones(a) - ones(b))}`), why: `자리마다 큰 수에서 작은 수를 뺐구나. 위의 수가 작으면 순서를 바꾸지 말고 윗자리에서 10을 빌려 와야 해.` },
      { v: a + b, why: `더하기를 했어. 빼고 남은 수는 처음 수 ${a}보다 작아야 해.` },
    ], why, {
      q: st ? `돈이 ${a}원 있었는데 몬스터볼 값으로 ${b}원을 냈어. 얼마 남았을까?` : `${a} − ${b} = ?`,
      pic: placeTable([[`${a}`, a], [`− ${b}`, b]], true),
      steps: subSteps,
      need: '가게에서 거스름돈을 줄 때처럼 큰 수에서 빼야 할 일이 많아. 윗자리에서 빌려 오는 방법이 모자란 자리를 해결해.',
      viz: { type: 'col', a, b, op: '-' } });
  } },
  { id: 'm_mul_2d1d', g: 3, t: '(두 자리) × (한 자리)', gen: (st) => {
    const a = rand(12, 49), b = rand(3, 9), p = a * b;
    const ta = tens(a), oa = ones(a), t10 = ta * 10;
    return mc(p, [
      { v: Number(`${tens(a) * b}${ones(a) * b}`), why: `십의 자리 곱 ${tens(a) * b}와 일의 자리 곱 ${ones(a) * b}를 나란히 붙여 썼구나. ${t10} × ${b} = ${t10 * b}에 ${oa * b}를 더해야 해.` },
      { v: tens(a) * b * 10 + (ones(a) * b) % 10, why: `일의 자리 곱 ${oa * b}에서 10묶음을 십의 자리로 올리는 걸 잊었어. ${oa * b}는 10이 ${Math.floor((oa * b) / 10)}개와 ${(oa * b) % 10}이야.` },
      { v: a + b, why: `곱하기가 아니라 더하기를 했어. ${a} × ${b}는 ${a}를 ${b}번 더하는 거야.` },
    ], oa ? `${a}를 ${t10}과 ${oa}로 나눠 각각 ${b}를 곱해. ${t10} × ${b} = ${t10 * b}, ${oa} × ${b} = ${oa * b}. 둘을 더하면 ${p}!`
      : `${a}는 10이 ${ta}개야. ${ta} × ${b} = ${ta * b}, 10이 ${ta * b}개니까 ${p}!`, {
      q: st ? `상처약 한 개에 ${a}원이야. ${b}개를 사면 얼마일까?` : `${a} × ${b} = ?`,
      pic: st ? { type: 'icons', rows: [{ e: '🧴', n: b, t: `한 개에 ${a}원` }], total: `${b}개면 얼마?` } : null,
      steps: oa ? [`${a} = ${t10} + ${oa}`, `${t10} × ${b} = ${t10 * b}`, `${oa} × ${b} = ${oa * b}`, `${t10 * b} + ${oa * b} = ${p}`] : [`${a} = 10이 ${ta}개`, `${ta} × ${b} = ${ta * b}`, `10이 ${ta * b}개 = ${p}`],
      need: '같은 값의 물건을 여러 개 살 때 하나씩 더하면 오래 걸려. 수를 십과 일로 나눠 곱하면 구구단으로 금방 풀려.',
      viz: { type: 'area', a, b } });
  } },
  { id: 'm_div_concept', g: 3, t: '나눗셈의 뜻 (똑같이 나누기)', gen: (st) => {
    const g = rand(2, 5), each = rand(2, 6), n = g * each;
    const pk = st ? pick(POKE) : ''; // 상황 문제일 때만 뽑는다 (옛 생성기와 난수 순서 같게)
    return mc(each, [
      { v: n - g, why: `빼기를 했구나. 똑같이 나누기는 ${n}개를 ${g}명이 같은 개수씩 갖게 하는 거야. 하나씩 돌아가며 나눠 봐.` },
      { v: n * g, why: `곱하기를 했어. 나누면 한 명 몫은 전체 ${n}개보다 적어져.` },
      { v: n + g, why: `더하기를 했어. 나누면 한 명 몫은 처음보다 작아야 해.` },
    ], `${n}개를 ${g}명에게 하나씩 돌아가며 나눠 주면 한 명에 ${each}개씩 돌아가. 식으로는 ${n} ÷ ${g} = ${each}. 확인: ${each} × ${g} = ${n}.`, {
      q: st ? `나무열매 ${n}개를 ${pk} ${g}마리가 똑같이 나눠 먹으면 한 마리에 몇 개?` : `${n}개를 ${g}명이 똑같이 나누면 한 명에 몇 개?`,
      pic: { type: 'icons', rows: [{ e: st ? '🍒' : '🍪', n, t: st ? `나무열매 ${n}개` : `${n}개` }, { e: st ? POKE_E[pk] : '🧒', n: g, t: st ? `${pk} ${g}마리` : `${g}명`, c: 'b' }] },
      steps: [`한 명에 하나씩 나눠 주면 한 바퀴에 ${g}개`, `${n}개가 다 없어질 때까지 돌려`, `${each}바퀴 → 한 명에 ${each}개`, `확인: ${each} × ${g} = ${n}`],
      need: '옛날 사람들은 거둔 곡식이나 사냥한 것을 다툼 없이 똑같이 나눠야 했어. 그때 쓰는 계산이 나눗셈이야.',
      viz: { type: 'share', n, g } });
  } },
  { id: 'm_div_facts', g: 3, t: '나눗셈 구구', gen: (st) => {
    const b = rand(2, 9), q = rand(2, 9), a = b * q;
    const row = Array.from({ length: q }, (_, i) => b * (i + 1)).join(', ');
    return mc(q, [
      { v: q + 1, why: `${b} × ${q + 1} = ${b * (q + 1)}이라서 ${a}보다 커. 하나 작은 수로 확인해 봐.` },
      { v: q - 1, why: `${b} × ${q - 1} = ${b * (q - 1)}이라서 ${a}가 안 돼. 하나 큰 수로 확인해 봐.` },
      { v: a - b, why: `빼기를 했어. 나눗셈은 "${b}씩 몇 번 덜어 낼 수 있나?"를 찾는 거야. ${b}씩 덜어 내며 세어 봐.` },
    ], `${a} ÷ ${b}는 "${b} × □ = ${a}"에서 □를 찾는 거야. ${b}단을 외워 보면 ${b} × ${q} = ${a}. 그래서 답은 ${q}!`, {
      q: st ? `트레이너 ${a}명이 ${b}명씩 팀을 만들면 몇 팀이 될까?` : `${a} ÷ ${b} = ?`,
      help: st ? '' : '📖 ÷ (나누기) = 앞의 수에서 뒤의 수만큼씩 몇 번 덜어 낼 수 있는지',
      pic: st && a <= 40 ? { type: 'icons', rows: [{ e: '🧢', n: a, t: `트레이너 ${a}명` }], total: `${b}명씩 팀을 만들면?` } : null,
      steps: [`${b} × □ = ${a}인 □ 찾기 (${b}단)`, row, `${b} × ${q} = ${a}`, `답: ${q}`],
      need: '사람이나 물건을 같은 수씩 모둠으로 나눌 일이 많아. 곱셈을 거꾸로 생각하면 몇 모둠이 되는지 금방 알 수 있어.',
      viz: { type: 'array', r: q, c: b } });
  } },
  { id: 'm_frac_concept', g: 3, t: '분수의 뜻', gen: (st) => {
    const d = rand(3, 8), n = rand(1, d - 1);
    const fmt = (x) => x;
    const pk = st ? pick(POKE) : '';
    /* 문제 그림이 네모 막대라 네모난 것(초콜릿·종이 띠)으로 묻는다 (2026-10-24 2차 점검: 그림은 실제 모양 그대로) */
    const [did, rest, whole] = st ? ['먹은', '남은', '초콜릿 한 판'] : ['색칠한', '색칠 안 한', '전체'];
    /* 빗금(/)을 낱말처럼 혼자 쓰지 않는다: '선 위의 수(분자)', '선 아래의 수(분모)'로 말한다 (2026-10-24 점검) */
    return mc(`${n}/${d}`, [
      { v: `${d}/${n}`, why: `분자와 분모를 바꿨어. 선 위의 수(분자)는 ${did} 조각 수, 선 아래의 수(분모)는 전체 조각 수야.` },
      { v: `${d - n}/${d}`, why: `${rest} 조각을 셌구나. 묻는 건 ${did} 부분이야. ${did} 조각은 ${n}개야.` },
      { v: `${n}/${d - n}`, why: `선 아래의 수(분모)에는 전체 조각 수를 써야 해. ${rest} ${d - n}조각이 아니라 모두 ${d}조각이야.` },
    ], `${whole}을(를) 똑같이 ${d}조각 냈으니 선 아래의 수(분모)는 ${d}. 그중 ${n}조각${st ? '을 먹었으니' : '에 색칠했으니'} 선 위의 수(분자)는 ${n}. 그래서 ${n}/${d}라고 쓰고 ${d}분의 ${n}이라고 읽어.`, {
      fmt, fill: () => { let a2, b2; do { a2 = rand(1, 8); b2 = rand(2, 9); } while (a2 >= b2 || a2 * d === n * b2); return { v: `${a2}/${b2}`, why: `선 아래의 수(분모)는 전체 조각 수, 선 위의 수(분자)는 ${did} 조각 수야. 하나씩 세어 보자.` }; },
      q: st ? `${pk}이(가) 초콜릿 한 판을 똑같은 크기로 잘라 몇 조각을 먹었어(칠한 칸). 먹은 양은 한 판의 얼마인지 분수로 쓰면?`
        : '종이 띠 한 장을 똑같은 크기로 잘라 몇 조각에 색칠했어. 색칠한 부분은 전체의 얼마인지 분수로 쓰면?',
      help: '📖 분수 □/△ = 똑같이 △조각 낸 것 중 □조각. 공책에는 선을 긋고 선 위에 □(분자), 선 아래에 △(분모)를 써',
      pic: barPic(d, n), // 한 판을 d칸으로 나눈 막대, 앞의 n칸을 칠한다 (모양 문제는 도형 그림 — 2026-10-24 2차 점검)
      steps: [`전체 조각 수: ${d}조각 → 선 아래(분모) ${d}`, `${did} 조각 수: ${n}조각 → 선 위(분자) ${n}`, `분수로 쓰면 ${n}/${d}`],
      need: '옛날 사람들은 빵이나 땅을 나눌 때 하나보다 작은 양을 나타낼 방법이 필요했어. 그래서 분수를 만들었어.',
      viz: { type: 'frac', n, d } });
  } },
  { id: 'm_frac_compare', g: 3, t: '단위분수 크기 비교', gen: (st) => {
    let a = rand(2, 9), b = rand(2, 9); while (b === a) b = rand(2, 9);
    const big = Math.min(a, b), small = Math.max(a, b);
    return mc(`1/${big}`, [
      { v: `1/${small}`, why: `${small}이 ${big}보다 커서 1/${small}이 크다고 생각했구나. 선 아래의 수(분모)가 클수록 더 잘게 자른 거라 한 조각은 작아져!` },
      { v: '둘이 같아요', why: `둘 다 '1조각'이지만 조각 크기가 달라. 몇 조각으로 잘랐는지가 크기를 정해.` },
      { v: '비교할 수 없어요', why: `비교할 수 있어! 선 위의 수(분자)가 1로 같으면, 선 아래의 수(분모)가 작을수록 한 조각이 커.` },
    ], `한 판을 ${big}조각 낸 1조각과 ${small}조각 낸 1조각을 떠올려 봐. 많이 자를수록 한 조각은 작아져. ${big}조각이 덜 잘랐으니 1/${big}이 더 커!`, {
      fmt: (x) => x,
      q: st ? `파이 한 판을 ${big}명이 똑같이 나눠 먹을 때와 ${small}명이 나눠 먹을 때, 한 명 몫이 더 큰 것은?` : `1/${a}과 1/${b} 중 더 큰 수는?`,
      help: '📖 1/□ = 전체를 똑같이 □조각 낸 것 중 1조각',
      pic: st ? { type: 'icons', rows: [{ e: '🧒', n: big, t: `${big}명이 나눠 먹기` }, { e: '🧒', n: small, t: `${small}명이 나눠 먹기`, c: 'b' }] } : null,
      steps: [`1/${big} = 한 판을 ${big}조각 낸 1조각`, `1/${small} = 한 판을 ${small}조각 낸 1조각`, `${small}조각이 ${big}조각보다 많아 → 더 잘게 잘림`, `잘게 자를수록 한 조각이 작아`, `그래서 1/${big}이 더 커`],
      need: '나눠 먹을 때 내 몫이 얼마인지 알려면 분수 크기를 비교할 줄 알아야 해. 나눠 먹는 사람이 많을수록 한 명 몫은 줄어.',
      viz: { type: 'fraccmp', a: [1, big], b: [1, small] } });
  } },
  { id: 'm_decimal', g: 3, t: '소수 (0.1)', gen: (st) => {
    const k = rand(2, 9), o = rand(0, 3);
    const val = o + k / 10;
    const fmt = (x) => (typeof x === 'number' ? String(Math.round(x * 100) / 100) : x);
    const pk = st ? pick(POKE) : '';
    return mc(val, [
      { v: o + k / 100, why: `0.1이 ${k}개면 0.${k}야. 0.0${k}는 0.01이 ${k}개일 때야. 소수점 바로 뒤 칸이 0.1의 자리야.` },
      { v: o * 10 + k, why: `소수점을 빼먹었어. 0.1이 ${k}개는 0.${k}야. 점(.)이 없으면 ${o * 10 + k}처럼 훨씬 큰 수가 돼.` },
      { v: o + 1 + k / 10, why: `1이 ${o}개인데 하나 더 셌어. 1의 개수는 소수점 왼쪽에 그대로 ${o}를 써.` },
    ], o ? `1이 ${o}개면 ${o}, 0.1이 ${k}개면 0.${k}. 합치면 ${fmt(val)}이야. 소수점(.) 왼쪽에는 1이 몇 개, 오른쪽에는 0.1이 몇 개인지 써.`
      : `1이 하나도 없으니 소수점(.) 왼쪽에는 0을 써. 0.1이 ${k}개면 소수점 오른쪽에 ${k}를 써서 0.${k}야.`, {
      fmt, unit: st ? 'L' : '',
      q: st ? (o ? `${pk}이(가) 물을 1L 병으로 ${o}병, 0.1L 컵으로 ${k}컵 마셨어. 모두 몇 L 마셨을까?` : `${pk}이(가) 물을 0.1L 컵으로 ${k}컵 마셨어. 모두 몇 L 마셨을까?`)
        : `1이 ${o}개, 0.1이 ${k}개 모이면 어떤 수가 될까?`,
      help: st ? '📖 L(리터) = 물의 양을 재는 단위. 0.1L(영 점 일 리터) = 1L를 똑같이 10칸 낸 것 중 1칸' : '📖 0.1(영 점 일) = 1을 똑같이 10조각 낸 것 중 1조각',
      pic: st ? { type: 'icons', rows: [...(o ? [{ e: '🍶', n: o, t: '1L 병 = 1' }] : []), { e: '🥛', n: k, t: '0.1L 컵 = 0.1', c: 'a' }], op: o ? '+' : undefined }
        : { type: 'icons', rows: [...(o ? [{ e: '🍫', n: o, t: '초콜릿 한 판 = 1' }] : []), { e: '🟫', n: k, t: '한 판을 10칸 낸 1칸 = 0.1', c: 'a' }], op: o ? '+' : undefined },
      steps: [`1이 ${o}개 → ${o}`, `0.1이 ${k}개 → 0.${k}`, `${o} + 0.${k} = ${fmt(val)}`],
      need: '키나 몸무게처럼 딱 떨어지지 않는 양을 재려고, 사람들은 1을 10조각 낸 0.1 같은 소수를 쓰기 시작했어.',
      viz: { type: 'decimal', o, k } });
  } },
  { id: 'm_time_calc', g: 3, t: '시간 계산', gen: (st) => {
    const h = rand(1, 10), m = pick([30, 40, 45, 50]), add = pick([20, 25, 30, 40].filter((x) => m + x > 60));
    const tot = m + add, H = h + Math.floor(tot / 60), M = tot % 60;
    const f = (a, b) => `${a}시 ${b}분`;
    return mc(f(H, M), [
      { v: f(h, tot), why: `분이 60을 넘었어. 시계에는 ${tot}분이 없어! 60분은 1시간이니까 ${tot}분은 1시간 ${M}분이야.` },
      { v: f(H, tot), why: `시를 1 올렸다면 분에서는 60을 빼야 해. ${tot} − 60 = ${M}분이야.` },
      { v: f(h, M), why: `60분을 1시간으로 바꿨으니 시도 1 커져야 해. ${h}시가 아니라 ${H}시야.` },
    ], `분끼리 먼저 더해: ${m} + ${add} = ${tot}분. 60분은 1시간이니까 ${tot}분 = 1시간 ${M}분. ${h}시에 1시간을 더하면 ${H}시, 남은 ${M}분. 답은 ${H}시 ${M}분!`, {
      fmt: (x) => x, fill: () => ({ v: f(H + rand(-1, 1), rand(0, 11) * 5), why: '60분이 모이면 1시간이야. 분끼리 먼저 더하고, 60이 넘으면 1시간으로 바꿔 보자.' }),
      q: st ? `${h}시 ${m}분에 상록숲에 들어가서 ${add}분 뒤에 나왔어. 나온 시각은 몇 시 몇 분일까?` : `${h}시 ${m}분에서 ${add}분이 지나면 몇 시 몇 분일까?`,
      help: '📖 60분 = 1시간. 시계의 긴바늘이 한 바퀴 돌면 1시간이야.',
      pic: { type: 'clock', h, m },
      steps: [`분끼리 더하기: ${m} + ${add} = ${tot}분`, `${tot}분 = 60분 + ${M}분 = 1시간 ${M}분`, `${h}시 + 1시간 = ${H}시`, `답: ${H}시 ${M}분`],
      need: '기차가 도착하는 시각이나 만화가 끝나는 시각을 알려면 시간을 더할 줄 알아야 해. 1시간이 60분이라 60을 넘을 때가 중요해.',
      viz: { type: 'clock', h: H, m: M, explain: true } });
  } },
  { id: 'm_bignum', g: 4, t: '큰 수 (만)', gen: (st) => {
    const a = rand(1, 9), b = rand(1, 9), n = a * 10000 + b * 1000;
    const pk = st ? pick(POKE) : '';
    return mc(n, [
      { v: a * 1000 + b * 100, why: `0을 하나씩 빠뜨렸어. 10000은 0이 4개야. 10000이 ${a}개면 ${a * 10000}이야.` },
      { v: a * 100000 + b * 10000, why: `0을 하나씩 더 붙였어. 10000은 0이 4개, 1000은 0이 3개야.` },
      { v: (a + b) * 1000, why: `10000과 1000을 같은 것처럼 셌구나. 10000은 1000이 10개라서 자리가 달라.` },
    ], `10000원 ${a}장은 ${a * 10000}원, 1000원 ${b}장은 ${b * 1000}원. 더하면 ${n}원이야. 만의 자리에 ${a}, 천의 자리에 ${b}, 나머지 자리는 0을 써.`, {
      q: st ? `${pk}이(가) 체육관 배틀에서 이겨 상금으로 만 원짜리 지폐 ${a}장과 천 원짜리 지폐 ${b}장을 받았어. 상금은 모두 몇 원일까?`
        : `만 원짜리 지폐 ${a}장과 천 원짜리 지폐 ${b}장이 있어. 모두 얼마인지 수로 쓰면?`, unit: st ? '원' : '',
      help: '📖 만(10000) = 1000이 10개. 1 뒤에 0이 4개 붙어.',
      pic: { type: 'icons', rows: [{ e: '💵', n: a, t: '10000원짜리' }, { e: '💴', n: b, t: '1000원짜리', c: 'a' }], op: '+' },
      steps: [`10000 × ${a} = ${a * 10000}`, `1000 × ${b} = ${b * 1000}`, `${a * 10000} + ${b * 1000} = ${n}`],
      need: '나라의 인구나 큰돈처럼 아주 큰 수를 셀 일이 생기자, 사람들은 네 자리씩 끊어 만이라는 이름을 붙여 쉽게 읽었어.',
      viz: { type: 'table', head: ['만', '천', '백', '십', '일'], rows: [[`${a}`, `${b}`, '0', '0', '0']], hi: 0 } });
  } },
  { id: 'm_mul_2d2d', g: 4, t: '(두 자리) × (두 자리)', gen: (st) => {
    const a = rand(12, 39), b = rand(12, 29), p = a * b;
    const ta = tens(a), oa = ones(a), t10 = ta * 10;
    return mc(p, [
      { v: a * ones(b) + a * tens(b), why: `${b}의 십의 자리 ${tens(b)}는 사실 ${tens(b) * 10}이야. ${a} × ${tens(b)}가 아니라 ${a} × ${tens(b) * 10} = ${a * tens(b) * 10}을 더해야 해.` },
      { v: tens(a) * tens(b) * 100 + ones(a) * ones(b), why: `십의 자리끼리, 일의 자리끼리만 곱했어. 엇갈린 곱(${tens(a) * 10} × ${ones(b)}, ${ones(a)} × ${tens(b) * 10})도 꼭 더해야 해.` },
      { v: p + 10, why: `받아올림을 한 번 더 해서 10이 커졌어. 나눠서 곱한 두 수를 천천히 다시 더해 보자.` },
    ], oa ? `${a}를 ${t10}과 ${oa}로 나눠서 각각 ${b}를 곱해. ${t10} × ${b} = ${t10 * b}, ${oa} × ${b} = ${oa * b}. 둘을 더하면 ${p}!`
      : `${a}는 10이 ${ta}개야. ${ta} × ${b} = ${ta * b}. 여기에 10을 곱하면 ${p}!`, {
      q: st ? `버스 한 대에 ${a}명씩 타고, ${b}대가 회색시티로 갔어. 모두 몇 명일까?` : `${a} × ${b} = ?`,
      pic: st ? { type: 'icons', rows: [{ e: '🚌', n: b, t: `한 대에 ${a}명씩` }], total: `${b}대면 모두 몇 명?` } : null,
      steps: oa ? [`${a} = ${t10} + ${oa}`, `${t10} × ${b} = ${t10 * b}`, `${oa} × ${b} = ${oa * b}`, `${t10 * b} + ${oa * b} = ${p}`] : [`${ta} × ${b} = ${ta * b}`, `${ta * b} × 10 = ${p}`],
      need: '학교 전체 학생 수나 버스 여러 대의 승객처럼 큰 수끼리 곱할 일이 생겨. 수를 쪼개 곱하면 구구단으로 풀 수 있어.',
      viz: { type: 'area', a, b } });
  } },
  { id: 'm_div_rem', g: 4, t: '나머지가 있는 나눗셈', gen: (st) => {
    const b = rand(3, 8), q = rand(3, 9), r = rand(1, b - 1), a = b * q + r;
    const f = (x) => x;
    return mc(`${q} 나머지 ${r}`, [
      { v: `${q - 1} 나머지 ${r + b}`, why: `나머지 ${r + b}는 나누는 수 ${b}보다 커서 한 번 더 덜어 낼 수 있어! 나머지는 언제나 ${b}보다 작아야 해.` },
      { v: `${q + 1} 나머지 ${r}`, why: `${b} × ${q + 1} = ${b * (q + 1)}은 ${a}보다 커서 그만큼 덜어 낼 수 없어.` },
      { v: `${q} 나머지 ${b - r}`, why: `나머지는 ${a} − ${b * q} = ${r}이야. 한 묶음을 채우는 데 모자란 수가 아니라 남은 수를 써.` },
    ], st ? `가방 하나에 ${b}개씩이야. ${b} × ${q} = ${b * q}, 한 가방 더면 ${b * (q + 1)}이라서 ${a}개보다 많아. 그래서 가방 ${q}개가 꽉 차고, ${a} − ${b * q} = ${r}개가 남아.`
      : `${b}씩 몇 번 덜어 낼 수 있는지 봐. ${b} × ${q} = ${b * q}, 한 번 더 하면 ${b * (q + 1)}이라서 ${a}보다 커. 그래서 몫은 ${q}, 남은 ${a} − ${b * q} = ${r}가 나머지야.`, {
      fmt: f, fill: () => ({ v: `${q + rand(-2, 2)} 나머지 ${rand(0, b - 1)}`, why: '몫 × 나누는 수 + 나머지 = 처음 수가 되는지 확인해 보자.' }),
      q: st ? `몬스터볼 ${a}개를 가방 하나에 ${b}개씩 넣으면 몇 가방이 꽉 차고 몇 개가 남을까?` : `${a} ÷ ${b}의 몫과 나머지는?`,
      help: st ? "📖 보기 '□ 나머지 △' = 가방 □개가 꽉 차고 공 △개가 남는다는 뜻" : `📖 몫 = ${b}씩 몇 번 덜어 낼 수 있는지, 나머지 = 덜어 내고 남은 수`,
      pic: st && a <= 40 ? { type: 'icons', rows: [{ e: '🔴', n: a, t: `몬스터볼 ${a}개` }], total: `가방 하나에 ${b}개씩` } : null,
      steps: [`${b}단에서 ${a}를 넘지 않는 수 찾기`, `${b} × ${q} = ${b * q} (${b} × ${q + 1} = ${b * (q + 1)}은 너무 커)`, `남은 수: ${a} − ${b * q} = ${r}`, `몫 ${q}, 나머지 ${r} (${r} < ${b} ✓)`],
      need: '물건을 똑같이 담다 보면 몇 개가 남을 때가 많아. 몇 묶음이 되고 몇 개가 남는지 알아야 상자를 알맞게 준비할 수 있어.',
      viz: { type: 'share', n: a, g: b, rem: true } });
  } },
  { id: 'm_frac_add', g: 4, t: '분모가 같은 분수의 덧셈', gen: (st) => {
    const d = rand(5, 12), a = rand(1, d - 3), b = rand(1, d - a - 1);
    const f = (x) => x;
    return mc(`${a + b}/${d}`, [
      { v: `${a + b}/${d * 2}`, why: `선 아래의 수(분모)끼리도 더했구나. 분모는 조각 크기라서 더해도 그대로 ${d}야. 조각 수(선 위의 수)만 더해져!` },
      { v: `${a * b}/${d}`, why: `선 위의 수(분자)를 곱했어. 더하기니까 조각 수 ${a}개와 ${b}개를 더해야 해.` },
      { v: `${a + b}/${d * d}`, why: `선 아래의 수(분모)를 곱했구나. 분모는 조각의 크기라서 더할 때 바뀌지 않아.` },
    ], `선 아래의 수(분모) ${d}는 조각 크기야(1/${d} 조각). 더해도 조각 크기는 그대로고, 조각 수만 ${a} + ${b} = ${a + b}개가 돼. 그래서 ${a + b}/${d}!`, {
      fmt: f, fill: () => ({ v: `${a + b + rand(1, 2)}/${d}`, why: `1/${d} 조각을 하나씩 세어 보자. ${a}개와 ${b}개를 합치면 ${a + b}개야.` }),
      q: st ? `초콜릿 한 판을 똑같이 ${d}조각으로 나눠서 피카츄(⚡)가 ${a}조각, 꼬부기(🐢)가 ${b}조각 먹었어. 먹은 양은 한 판의 얼마?` : `${a}/${d} + ${b}/${d} = ?`,
      help: st ? '📖 분수 □/△ = 똑같이 △조각 낸 것 중 □조각 (선 위에 □, 선 아래에 △)' : '📖 분수 □/△ = 전체를 똑같이 △조각 낸 것 중 □조각',
      pic: st ? barPic(d, 0, [[0, a, '⚡'], [a, b, '🐢']]) : null, // 초콜릿 한 판 = d칸 막대, 피카츄(⚡)·꼬부기(🐢)가 먹은 칸
      steps: [`선 아래의 수(분모)가 ${d}로 같아 → 조각 크기가 같아`, `선 위의 수(조각 수)끼리: ${a} + ${b} = ${a + b}`, `선 아래의 수는 그대로 ${d}`, `답: ${a + b}/${d}`],
      need: '나눠 먹은 양, 여러 번 마신 물의 양처럼 하나보다 작은 양을 합칠 일이 많아서 분수 덧셈이 필요해.',
      viz: { type: 'fracadd', a, b, d } });
  } },
  { id: 'm_dec_add', g: 4, t: '소수의 덧셈', gen: (st) => {
    const a = rand(2, 9), b = rand(11 - a, 9); // 받아올림
    const fmt = (x) => (typeof x === 'number' ? String(Math.round(x * 100) / 100) : x);
    const e = st ? '💧' : '🟦';
    return mc((a + b) / 10, [
      { v: `0.${a + b}`, why: `0.1이 ${a + b}개면 0.${a + b}가 아니야. 10개가 모이면 1이 되니까 1과 0.${a + b - 10}, 즉 ${fmt((a + b) / 10)}이야.` },
      { v: (a + b) / 100, why: `소수점 자리를 잘못 옮겼어. 0.${a}는 0.1이 ${a}개야. 0.01이 ${a}개가 아니야.` },
      { v: a + b, why: `소수점을 빼먹었어. 0.${a} + 0.${b}는 1보다 조금 큰 수야. ${a + b}처럼 크지 않아.` },
    ], `0.${a}는 0.1이 ${a}개, 0.${b}는 0.1이 ${b}개. 합치면 0.1이 ${a + b}개야. 0.1이 10개면 1이니까 ${a + b}개는 1과 0.${a + b - 10}, 즉 ${fmt((a + b) / 10)}!`, {
      fmt, unit: st ? 'L' : '', q: st ? `물을 ${fmt(a / 10)}L 마시고 또 ${fmt(b / 10)}L 마셨어. 모두 몇 L 마셨을까?` : `${fmt(a / 10)} + ${fmt(b / 10)} = ?`,
      help: st ? '📖 L(리터) = 물의 양을 재는 단위. 0.1L = 1L를 10으로 똑같이 나눈 1칸' : '📖 0.1 = 1을 똑같이 10조각 낸 것 중 1조각',
      pic: { type: 'icons', rows: [{ e, n: a, t: `${fmt(a / 10)} = 0.1이 ${a}개` }, { e, n: b, t: `${fmt(b / 10)} = 0.1이 ${b}개`, c: 'a' }], op: '+', total: '0.1이 10개 모이면 1' },
      steps: [`0.${a} = 0.1이 ${a}개`, `0.${b} = 0.1이 ${b}개`, `0.1이 ${a} + ${b} = ${a + b}개`, `0.1 10개 = 1 → ${fmt((a + b) / 10)}`],
      need: '달리기 기록, 물의 양, 몸무게처럼 소수로 된 양을 합칠 일이 많아. 0.1이 10개면 1이라는 규칙만 알면 쉽게 더해.',
      viz: { type: 'decimal', o: Math.floor((a + b) / 10), k: (a + b) % 10 } });
  } },
  { id: 'm_angle', g: 4, t: '각도', gen: (st) => {
    const kind = pick(['right', 'tri', 'straight']);
    const need = '옛날 사람들은 집이나 탑을 반듯하게 세우고, 갈 수 없는 곳의 거리를 재려고 각도를 정확히 알아야 했어.';
    const pk = st ? pick(POKE) : '';
    if (kind === 'right') return mc(90, [{ v: 180, why: '180도는 일직선(반 바퀴)이야. 직각은 그 반이라 180 ÷ 2 = 90도.' }, { v: 360, why: '360도는 한 바퀴를 다 돈 거야. 직각은 그 4분의 1이야.' }, { v: 45, why: '45도는 직각을 반으로 나눈 각이야. 직각은 그 두 배인 90도.' }],
      '한 바퀴는 360도야. 직각은 한 바퀴를 똑같이 4개로 나눈 하나라서 360 ÷ 4 = 90도. 책 모서리처럼 반듯한 각이야.', {
        q: st ? `${pk}이(가) 도감 책 모서리의 각을 재 보려고 해. 책 모서리처럼 반듯한 각(직각)은 몇 도일까?` : '직각은 몇 도일까?', unit: '도',
        help: '📖 직각 = 책 모서리처럼 반듯하게 꺾인 각. 도(°) = 각의 크기를 재는 단위. 한 바퀴를 360칸으로 나눈 1칸이 1도',
        pic: cornerPic('right', st ? '책 모서리' : '반듯한 모서리'), // 이모지 대신 실제 ㄴ자 모서리 그림 (2026-10-24 2차 점검)
        steps: ['한 바퀴 = 360도', '직각 = 한 바퀴를 4개로 나눈 하나', '360 ÷ 4 = 90도'], need, viz: { type: 'angle', deg: 90 } });
    if (kind === 'straight') return mc(180, [{ v: 90, why: '90도는 직각이야. 일직선은 직각 두 개라서 90 + 90 = 180도.' }, { v: 360, why: '360도는 한 바퀴를 다 돈 거야. 일직선은 반 바퀴야.' }, { v: 100, why: '100도는 직각보다 조금 더 벌어진 각이야. 일직선이 되려면 180도까지 벌려야 해.' }],
      '일직선은 반 바퀴야. 한 바퀴가 360도니까 360 ÷ 2 = 180도. 직각(90도) 두 개를 붙인 것과 같아.', {
        q: st ? `${pk}이(가) 막대를 꺾었다가 쭉 펴서 일직선을 만들었어. 쭉 편 일직선의 각(평각)은 몇 도일까?` : '일직선(평각)은 몇 도일까?', unit: '도',
        help: '📖 평각 = 쭉 편 일직선 모양의 각. 도(°) = 각의 크기를 재는 단위. 한 바퀴를 360칸으로 나눈 1칸이 1도',
        pic: cornerPic('straight', st ? '쭉 편 막대' : '쭉 편 일직선'),
        steps: ['한 바퀴 = 360도', '일직선 = 반 바퀴', '360 ÷ 2 = 180도'], need, viz: { type: 'angle', deg: 180 } });
    const a = rand(30, 80), b = rand(30, 150 - a), c = 180 - a - b;
    const guess = 90 - Math.min(a, b) > 0 ? 90 : 100;
    return mc(c, [{ v: 360 - a - b, why: '세 각의 합을 360도로 했구나. 360도는 사각형 네 각의 합이야. 삼각형은 180도!' }, { v: guess, why: `${guess}도쯤이라고 눈으로 짐작했구나. 각은 짐작하지 말고 180 − ${a} − ${b}로 계산해 보자.` }, { v: a + b, why: `두 각을 더하기만 했어. 그건 두 각의 합이야. 180에서 그 합 ${a + b}를 빼야 나머지 각이 나와.` }],
      `삼각형 세 귀퉁이를 잘라 꼭짓점끼리 붙이면 쭉 편 일직선이 돼. 그래서 세 각을 더하면 언제나 180도야. 180에서 아는 두 각을 빼면: 180 − ${a} − ${b} = ${c}도.`, {
        q: st ? `${pk}이(가) 삼각형 깃발을 만들었어. 두 모서리의 각이 ${a}도, ${b}도야. 나머지 한 모서리의 각은 몇 도일까?` : `삼각형의 세 각 중 두 각이 ${a}도, ${b}도야. 나머지 한 각은 몇 도일까?`, unit: '도',
        help: '📖 삼각형 세 귀퉁이를 잘라 붙이면 일직선(180도)이 돼. 그래서 세 각을 모두 더하면 언제나 180도야.',
        pic: { type: 'tri', a, b, c },
        steps: ['세 귀퉁이를 붙이면 일직선 = 180도', `180 − ${a} = ${180 - a}`, `${180 - a} − ${b} = ${c}`, `나머지 각: ${c}도`], need, viz: { type: 'tri', a, b, c } });
  } },
  { id: 'm_frac_diff', g: 5, t: '분모가 다른 분수의 덧셈', gen: (st) => {
    const [a, b] = pick([[2, 3], [2, 5], [3, 4], [2, 7], [3, 5], [4, 5]]);
    const f = (x) => x;
    const [p1, p2] = st ? shuffle([...POKE]).slice(0, 2) : ['', ''];
    return mc(`${a + b}/${a * b}`, [
      { v: `2/${a + b}`, why: `선 위의 수끼리, 선 아래의 수끼리 더했구나. 조각 크기가 다르면 먼저 같은 크기 조각으로 바꿔야(통분) 해.` },
      { v: `2/${a * b}`, why: `${a * b}조각짜리로 맞춘 건 좋아! 그런데 조각 수도 바꿔야 해. 1/${a} = ${b}/${a * b}, 1/${b} = ${a}/${a * b}.` },
      { v: `1/${a + b}`, why: `선 아래의 수를 더하면 조각이 더 작아져 버려. 더했는데 처음보다 작아지면 이상하지?` },
    ], `1/${a}과 1/${b}는 조각 크기가 달라서 바로 못 더해. 둘 다 ${a * b}조각짜리로 더 잘게 자르면 1/${a} = ${b}/${a * b}, 1/${b} = ${a}/${a * b}. 같은 크기 조각이 ${b} + ${a} = ${a + b}개라서 ${a + b}/${a * b}!`, {
      fmt: f, q: st ? `${p1}이(가) 파이 1/${a}판을, ${p2}이(가) 같은 파이 1/${b}판을 먹었어. 둘이 먹은 양을 더하면 파이 한 판의 얼마일까?` : `1/${a} + 1/${b} = ?`,
      help: '📖 1/□ = 전체를 똑같이 □조각 낸 것 중 1조각. 조각 크기가 다르면 바로 못 더해.',
      pic: { type: 'fraccmp', a: [1, a], b: [1, b] },
      steps: [`${a}조각으로도 ${b}조각으로도 맞는 수: ${a} × ${b} = ${a * b}`, `1/${a} = ${b}/${a * b} (1조각을 ${b}조각으로 자름)`, `1/${b} = ${a}/${a * b} (1조각을 ${a}조각으로 자름)`, `조각 수 더하기: ${b} + ${a} = ${a + b}`, `답: ${a + b}/${a * b}`],
      need: '반 컵과 3분의 1컵처럼 서로 다르게 나눈 양을 합치려면, 먼저 조각 크기를 똑같이 맞춰야 해.',
      viz: { type: 'fracadd2', a, b } });
  } },
  { id: 'm_area', g: 5, t: '직사각형의 넓이', gen: (st) => {
    const w = rand(3, 12), h = rand(2, 9);
    const u = st ? 'm' : 'cm';
    // 그래프 칸이 진짜 정사각형으로 보이게: 그림 판(폭 304 × 높이 214)의 가로·세로 비율에 맞춰 범위를 정한다
    const X = Math.round(Math.max(w + 1, ((h + 1) * 304) / 214) * 100) / 100, Y = Math.round(((X * 214) / 304) * 100) / 100;
    return mc(w * h, [
      { v: 2 * (w + h), why: `둘레(테두리 길이)를 구했구나. ${w} + ${h} + ${w} + ${h}는 울타리 길이야. 넓이는 안쪽 칸 수, 가로 × 세로!` },
      { v: w + h, why: `가로와 세로를 더했어. 넓이는 칸 수라서 가로 × 세로로 구해.` },
      { v: w * h * 2, why: `두 배를 할 필요는 없어. 칸을 세면 딱 가로 × 세로 개야.` },
    ], `넓이는 한 칸(1${u}²)짜리 네모가 몇 개 들어가는지야. 한 줄에 ${w}칸씩 ${h}줄이니까 ${w} × ${h} = ${w * h}칸, 즉 ${w * h}${u}²!`, {
      q: st ? `포켓몬 목장이 가로 ${w}m, 세로 ${h}m인 직사각형이야. 넓이는 몇 m²일까?` : `가로 ${w}cm, 세로 ${h}cm인 직사각형의 넓이는?`, unit: st ? 'm²' : 'cm²',
      help: `📖 넓이 = 한 변이 1${u}인 네모 칸이 몇 개 들어가는지. 1${u}² = 그 한 칸`,
      pic: { type: 'plot', x: [0, X], y: [0, Y], step: 1, anim: false, shade: { f: String(h), a: 0, b: w },
        segs: [{ x1: 0, y1: h, x2: w, y2: h, c: 'a', label: `가로 ${w}${u}`, ly: -12, lx: w <= 4 ? 16 : 0 }, { x1: w, y1: 0, x2: w, y2: h, c: 'a', label: `세로 ${h}${u}`, lx: X - w >= 3 ? 38 : -38 }] },
      steps: [`한 줄에 1${u}² 칸이 ${w}개`, `그런 줄이 ${h}줄`, `${w} × ${h} = ${w * h}`, `넓이: ${w * h}${u}²`],
      need: '땅을 나누거나 사고팔 때 얼마나 넓은지 똑같은 방법으로 재야 했어. 그래서 한 칸이 몇 개인지로 넓이를 정했어.',
      viz: { type: 'array', r: h, c: w } });
  } },
  { id: 'm_average', g: 5, t: '평균', gen: (st) => {
    const avg = rand(4, 12); const a = avg - rand(1, 3), b = avg + rand(1, 3), c = 3 * avg - a - b;
    const sum = a + b + c;
    return mc(avg, [
      { v: a + b + c, why: `모두 더한 것까지는 맞아! 평균은 그 합 ${sum}을(를) 개수 3으로 똑같이 나눠야 해.` },
      { v: Math.max(a, b, c), why: `가장 큰 값을 골랐구나. 평균은 가장 큰 값이 아니라 모두 고르게 나눴을 때의 값이야.` },
      /* 합이 홀수면 2로 나눈 값이 딱 떨어지지 않아 '2로 나눴다'는 설명이 틀린다 → 가장 작은 값 보기로 (2026-10-24) */
      sum % 2 === 0 ? { v: sum / 2, why: `수가 3개니까 3으로 나눠야 해. 2로 나누면 ${sum} ÷ 2 = ${sum / 2}처럼 실제보다 커져.` }
        : { v: Math.min(a, b, c), why: `가장 작은 값을 골랐구나. 평균은 가장 작은 값과 가장 큰 값 사이, 모두 고르게 나눴을 때의 값이야.` },
    ], `평균은 높은 막대를 깎아 낮은 막대를 채워서 똑같이 만든 높이야. 모두 더하면 ${a} + ${b} + ${c} = ${sum}, 3개로 똑같이 나누면 ${sum} ÷ 3 = ${avg}.`, {
      q: st ? `피카츄가 3일 동안 번개를 ${a}번, ${b}번, ${c}번 쐈어. 하루에 평균 몇 번 쐈을까?` : `${a}, ${b}, ${c}의 평균은?`,
      help: '📖 평균 = 모두를 똑같이 고르게 나눴을 때 하나에 돌아가는 양',
      pic: { type: 'chart', bars: st ? [{ l: '1일', v: a }, { l: '2일', v: b }, { l: '3일', v: c }] : [{ l: '첫째', v: a }, { l: '둘째', v: b }, { l: '셋째', v: c }], unit: st ? '번' : '' },
      steps: [`모두 더하기: ${a} + ${b} + ${c} = ${sum}`, '개수: 3개', `${sum} ÷ 3 = ${avg}`, `평균: ${avg}`],
      need: '한 번 기록만 보면 운이 좋았는지 알 수 없어. 그래서 사람들은 여러 번 기록을 고르게 나눈 평균으로 실력을 비교했어.',
      viz: { type: 'bars', vals: [a, b, c], avg } });
  } },
];

function timesGen(a, st) {
  const b = rand(2, 9), p = a * b;
  const jumps = Array.from({ length: b }, (_, i) => a * (i + 1)).join(', ');
  const pk = st ? pick(POKE) : '';
  if (st) {
    /* 이야기판: '한 마리에 a개씩, b마리' → 'a를 b번 더하기' → 'a × b' 다리를 한 줄씩 놓는다 (2026-10-24 점검) */
    return mc(p, [
      { v: a * (b - 1), why: `${b - 1}마리 것만 셌어. ${a} × ${b - 1} = ${a * (b - 1)}. 남은 한 마리의 ${a}개를 더해야 ${p}개야.` },
      { v: a * (b + 1), why: `한 마리를 더 셌어. ${b}마리니까 ${a}를 딱 ${b}번만 더해.` },
      { v: a + b, why: `마리 수와 개수를 더했구나(${b} + ${a} = ${a + b}). 한 마리에 ${a}개씩이니 ${a}를 ${b}번 더해야 해.` },
      { v: (a + 1) * b, why: `한 마리에 ${a + 1}개씩으로 셌어. 한 마리가 가진 건 ${a}개라서 ${a}씩 ${b}번이야.` },
    ], `${pk} 한 마리에 ${a}개씩, ${b}마리야. ${a}를 ${b}번 더하면 돼: ${a}씩 뛰어 세면 ${jumps}. 같은 수를 여러 번 더하는 걸 곱하기로 ${a} × ${b}라고 써. 그래서 ${p}개!`, {
      q: `${pk} ${b}마리가 각각 몬스터볼을 ${a}개씩 가졌어. 몬스터볼은 모두 몇 개일까?`,
      help: '📖 각각 = 한 마리마다 똑같이',
      pic: { type: 'icons', rows: [{ e: POKE_E[pk], n: b, t: `${pk} ${b}마리` }, { e: '🔴', n: a, t: `한 마리가 가진 몬스터볼 ${a}개`, c: 'a' }], total: '모두 몇 개?' },
      steps: [`한 마리에 ${a}개씩, ${b}마리`, `${a}를 ${b}번 더하기 = ${a} × ${b}`, `뛰어 세기: ${jumps}`, `${a} × ${b} = ${p}`, `몬스터볼 ${p}개`],
      need: '옛날 사람들은 같은 덧셈을 여러 번 하기 힘들어서 곱셈 결과를 표로 만들어 외웠어. 그게 지금의 구구단이야.',
      viz: { type: 'array', r: b, c: a } });
  }
  return mc(p, [
    { v: a * (b - 1), why: `${a}단을 하나 덜 셌어. ${a} × ${b - 1} = ${a * (b - 1)}. 여기에 ${a}를 한 번 더 더해야 ${p}가 돼.` },
    { v: a * (b + 1), why: `${a}를 한 번 더 더했어. ${a} × ${b}는 ${a}를 딱 ${b}번만 더해.` },
    { v: a + b, why: `곱하기(×)를 더하기(+)로 했구나. ${a} × ${b}는 ${a}를 ${b}번 더하는 거야.` },
    { v: (a + 1) * b, why: `${a + 1}단과 헷갈렸어. ${a + 1} × ${b} = ${(a + 1) * b}야. 지금은 ${a}단이야.` },
  ], `${a} × ${b}는 ${a}를 ${b}번 더한 거야. ${a}씩 뛰어 세면 ${jumps}. ${b}번째 수 ${p}가 답!`, {
    q: `${a} × ${b} = ?`,
    help: `📖 × (곱하기) = 같은 수를 여러 번 더하기. ${a} × ${b} = ${a}를 ${b}번 더하기. ${a}단 = ${a}에 1, 2, 3…을 곱한 줄`,
    steps: a >= 6 ? [`하나 전 칸: ${a} × ${b - 1} = ${a * (b - 1)}`, `${a}를 한 번 더: ${a * (b - 1)} + ${a} = ${p}`, `${a} × ${b} = ${p}`] : [`${a}씩 ${b}번 뛰어 세기`, jumps, `${b}번째 수: ${p}`, `${a} × ${b} = ${p}`],
    need: '옛날 사람들은 같은 덧셈을 여러 번 하기 힘들어서 곱셈 결과를 표로 만들어 외웠어. 그게 지금의 구구단이야.',
    viz: { type: 'array', r: b, c: a } });
}

export const MATH_BY = Object.fromEntries(MATH.map((s) => [s.id, s]));
