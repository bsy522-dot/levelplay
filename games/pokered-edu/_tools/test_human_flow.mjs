/* 인문 문제가 실제 게임 경로에서 나오는지 검증.
 * ★quiz.js:17 의 SUBJ hum 크래시를 재현하지 않고, 문제은행 → tutor → quiz 태그까지 본다.
 * 실행: node _tools/test_human_flow.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const R = (p) => pathToFileURL(path.join(here, '..', p)).href;

/* Node 에서 상대경로 fetch 를 되게 한다 (게임 로직은 건드리지 않는다) */
const _f = globalThis.fetch;
globalThis.fetch = async (u, o) => {
  if (typeof u === 'string' && !/^https?:/.test(u)) {
    const p = path.resolve(here, '..', u);
    return { ok: true, status: 200, json: async () => JSON.parse(fs.readFileSync(p, 'utf8')) };
  }
  return _f(u, o);
};
/* localStorage 는 브라우저 전용 — 최소한의 껍데기 */
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, v),
  removeItem: (k) => mem.delete(k),
};

const ST = await import(R('js/state.js'));
const { loadAll, DB } = await import(R('js/data.js'));
await loadAll();
ST.newState({ name: '테스트', rival: '라이벌', grade: 5 });

const T = await import(R('js/learn/tutor.js'));
T.initLearn(5);

console.log('DB.science 총 문제:', DB.science.length);
console.log('h_ 문제:', DB.science.filter((q) => q.id.startsWith('h_')).length);

let bad = 0;
const fail = (m) => { bad++; console.log('✗', m); };

/* ── 인문 문제가 실제로 3000회 중 몇 번 나오나 ── */
let hum = 0, sci = 0, math = 0;
const humIds = new Set();
for (let i = 0; i < 3000; i++) {
  const r = T.nextQuestion({});
  if (r.subj === 'hum') { hum++; humIds.add(r.item.id); }
  else if (r.subj === 'sci') sci++;
  else math++;
}
console.log(`3000회: 수학 ${(math / 30).toFixed(1)}% / 과학 ${(sci / 30).toFixed(1)}% / 인문 ${(hum / 30).toFixed(1)}%`);
console.log('등장한 인문 문제 종류:', [...humIds].join(', ') || '(없음)');

if (hum === 0) fail('인문 문제가 3000회 중 0회 — 사다리만 있고 문제가 안 나온다');
if (hum < 3000 * 0.03) fail(`인문 비율 ${(hum / 30).toFixed(1)}% — 너무 낮음`);
if (humIds.size < 5) fail(`인문 고유 문제 ${humIds.size}종 — 다양성 부족`);

/* ── quiz.js:17 크래시 재현 검사 (SUBJ 태그 조회) ── */
const quizSrc = fs.readFileSync(path.join(here, '..', 'js', 'learn', 'quiz.js'), 'utf8');
if (/const \[sname, scol\] = SUBJ\[q\.subj\]/.test(quizSrc)) {
  fail('quiz.js:17 이 여전히 SUBJ[q.subj] 직접 해제 — hum 이면 undefined');
}
if (!/hum:\s*\['인문'/.test(quizSrc)) fail('SUBJ 에 hum 항목 없음');

/* ── 인문 문제도 보기 4개/오답설명 3개 형식이 성립하는가 ── */
for (const q of DB.science.filter((x) => x.id.startsWith('h_'))) {
  if (q.a.length !== 4) fail(`${q.id}: 보기 ${q.a.length}개`);
  const wk = Object.keys(q.wrong).map(Number).sort().join();
  if (wk !== [0, 1, 2, 3].filter((x) => x !== q.c).join()) fail(`${q.id}: 오답설명 키 ${wk}`);
}

console.log(bad ? `\n문제 ${bad}건` : '\n인문 실제 출제 경로 통과');
process.exit(bad ? 1 : 0);