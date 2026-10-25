export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * 문제 내용 시그니처 — 요구사항 21.
 * "2+3" 을 "4+5" 로 바꾼 건 새로운 문제가 아니다. 숫자를 지운 '구조(골격)'만 남겨
 * 비교하면, 같은 콘셉트의 복제임을 알 수 있다. 같은 주제라도 문장 구조가 다르면
 * 다른 문제로 인정한다 (요구사항 2: "같은 정답이라도 다른 상황에서 출제").
 */
export function signature(text, subject = '') {
  const coarse = String(text || '')
    .replace(/\d+(?:\.\d+)?/g, '#')              // 숫자는 지운다 (2+3 과 4+5 는 같은 문제다)
    .replace(/[\s\u3000.?!,~·:;()"'\-—…]+/g, '') // 공백·구두점 제거
    .replace(/#+/g, '#')
    // 문장 끝 조사: 같은 질문인데 조사만 다른 경우를 묶는다
    .replace(/(?:에서|으로|까지|부터|에게|한테|과|와|은|는|이|가|을|를|의|도|로)$/, '')
    // 어미: '까' vs '일까' 같은 흔들림을 없앤다 (최대 2자)
    .replace(/(?:까(?:라|요|지)?|구나|겠다|네|자|어|지|다|라|함)$/u, '')
    // 남은 조사는 한 번 더 제거 (어미 제거 후 드러나는 것)
    .replace(/(?:은|는|이|가|을|를|의|와|과|로)$/, '')
    .trim();
  return subject + '|' + (coarse.length > 90 ? coarse.slice(0, 90) : coarse);
}
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const chance = (p) => Math.random() < p;
export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export function weighted(items, wfn) {
  const ws = items.map(wfn);
  let t = ws.reduce((s, w) => s + w, 0);
  if (t <= 0) return items[0];
  let r = Math.random() * t;
  for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; }
  return items[items.length - 1];
}
export function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'html') e.innerHTML = v;
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(String(k)));
  return e;
}
/** 한국어 조사 붙이기: josa('피카츄', '이/가') -> '피카츄가' */
export function josa(word, pair) {
  const [a, b] = pair.split('/');
  const ch = String(word).trim().slice(-1);
  const code = ch.charCodeAt(0);
  let has = false;
  if (code >= 0xac00 && code <= 0xd7a3) has = (code - 0xac00) % 28 !== 0;
  else if (/[0-9]/.test(ch)) has = '013678'.includes(ch);
  else if (/[a-zA-Z]/.test(ch)) has = /[lmnr]/i.test(ch);
  if (pair === '으로/로' && code >= 0xac00 && (code - 0xac00) % 28 === 8) return word + b; // ㄹ 받침
  return word + (has ? a : b);
}
export const TYPE_KO = {
  Normal: '노말', Fire: '불꽃', Water: '물', Grass: '풀', Electric: '전기', Ice: '얼음', Fighting: '격투', Poison: '독',
  Ground: '땅', Flying: '비행', Psychic: '에스퍼', Bug: '벌레', Rock: '바위', Ghost: '고스트', Dragon: '드래곤',
};
export const TYPE_COLOR = {
  Normal: '#9fa19f', Fire: '#e62829', Water: '#2980ef', Grass: '#3fa129', Electric: '#e8b800', Ice: '#3dcef3',
  Fighting: '#ff8000', Poison: '#9141cb', Ground: '#915121', Flying: '#81b9ef', Psychic: '#ef4179', Bug: '#91a119',
  Rock: '#afa981', Ghost: '#704170', Dragon: '#5060e1',
};
export function typeTag(t) {
  const s = document.createElement('span');
  s.className = 'tag';
  s.style.background = TYPE_COLOR[t] || '#888';
  s.textContent = TYPE_KO[t] || t;
  return s;
}
