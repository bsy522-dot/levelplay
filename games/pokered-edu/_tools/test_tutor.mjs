/* 학습 튜터 동작 검증: 3연속 중복 방지 / 분야 분산 / 인문 비율 / 새 필드 정합.
 * 실행: node _tools/test_tutor.mjs   (--show 로 실제 낸 문제 출력)
 *
 * 규칙(사용자 요구사항 → 검사):
 *  ① 같은 문제가 4회 연속 이상 나오면 실패 (SAME_Q_BLOCK=3)
 *  ② 최근 6문제 안에 동일 문제가 3번 넘게 있으면 실패
 *  ③，科学 문제은행의 새 필드(free/links/chain/need)는 형식만 통과 (내용은 검안)
 *  ④ 인문 비율은 HUMAN_RATE 근처인지
 *  ⑤ 구 세이브(learn 필드 없음)를 물려도 예외 없이 동작
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const R = (p) => pathToFileURL(path.join(here, '..', p)).href;

/* ★이 테스트가 게임을 안 고친 이유 (2026-10-03 발견)
 * loadAll() 을 한 번도 불러지 않았다. 그래서 DB.science 가 빈 배열이었다.
 * pickBank() 는 DB.science 에서 문제를 찾는데, 비어 있으면 null 을 돌려주고
 * sealMath() 폴백으로 '항상 수학'만 났다.
 *   → 인문 0건, 과학 0건, 수학만 반복. 테스트 9건 실패의 진짜 원인.
 * 브라우저에서 하는 것처럼 상대경로 fetch 와 localStorage 를 채운 뒤 loadAll 을 부른다. */
const _f = globalThis.fetch;
globalThis.fetch = async (u, o) => {
  if (typeof u === 'string' && !/^https?:/.test(u)) {
    const fp = path.resolve(here, '..', u);
    return { ok: true, status: 200, json: async () => JSON.parse(fs.readFileSync(fp, 'utf8')) };
  }
  return _f(u, o);
};
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, v),
  removeItem: (k) => mem.delete(k),
};

const { loadAll, DB } = await import(R('js/data.js'));
await loadAll();
console.log(`DB.science ${DB.science.length}건 (h_ ${DB.science.filter((q) => q.id.startsWith('h_')).length} / s_ ${DB.science.filter((q) => q.id.startsWith('s_')).length})`);
console.log(`DB.species ${DB.species.length} / DB.moves ${Object.keys(DB.moves).length} / DB.maps ${Object.keys(DB.maps).length}\n`);

// 실제 게임 상태(state.js)를 그대로 쓴다 — 흉내내지 않는다.
const { G, newState } = await import(R('js/state.js'));
const T = await import(R('js/learn/tutor.js'));
newState({ name: '테스트', rival: '라이벌', grade: 3 });
const { initLearn, nextQuestion, ensureLearn, report, SCI, HUMAN, SCI_P, SAME_Q_BLOCK, HUMAN_RATE, EXP_GAIN_BOOST, PRACTICE_REWARD } = T;

let bad = 0;
const fail = (msg) => { bad++; if (bad <= 40) console.log('✗', msg); };

/* ── 상수 자체가 요구사항과 맞는가 ── */
if (PRACTICE_REWARD !== 1000) fail(`보상 ${PRACTICE_REWARD} — 1000 이어야 함`);
if (!(EXP_GAIN_BOOST > 1 && EXP_GAIN_BOOST <= 1.6)) fail(`경험치 가속 ${EXP_GAIN_BOOST} — "조금"=1.0~1.6 범위`);

/* ── 사다리가 실제로 성인 단계까지 닿는가 ── */
const maxG = Math.max(...SCI.map((s) => s.g));
if (maxG < 11) fail(`과학 최고 난이도 ${maxG} — 양자역학/심화(11+) 필요`);
for (const need of ['s_quantum', 's_thermo', 's_relativity', 's_genetics', 's_em', 's_string']) {
  if (!SCI.find((s) => s.id === need)) fail(`과학 주제 ${need} 없음`);
}
const fields = new Set(SCI.map((s) => s.f));
for (const f of ['물리', '화학', '생명', '지구', '우주']) if (!fields.has(f)) fail(`분야 ${f} 없음`);

/* ── ① ② 중복 검사 ── */
function runDraws(n, seedGrade) {
  initLearn(seedGrade);
  const ids = [];
  for (let i = 0; i < n; i++) {
    const r = nextQuestion({});
    if (!r || !r.item || !r.item.q) { fail(`${i}번째 문제 없음`); break; }
    ids.push(r.item._sig || r.item.id);
    // 서술형 문제의 정답 필드가 맞는지 (삼지선다가 아닐 수 있음)
    const it = r.item;
    if (it.free) {
      if (it.a && it.a.length && it.c == null) fail(`free 문제인데 보기/정답 형식 불일치: ${it.id}`);
    } else {
      if (!Array.isArray(it.a) || it.a.length !== 4) fail(`${it.id} 보기 ${it.a && it.a.length}개`);
      else if (new Set(it.a).size !== 4) fail(`${it.id} 보기 중복`);
      if (!(it.c >= 0 && it.c < 4)) fail(`${it.id} 정답 ${it.c}`);
      const wk = Object.keys(it.wrong || {}).map(Number).sort().join();
      if (wk !== [0, 1, 2, 3].filter((x) => x !== it.c).join()) fail(`${it.id} 오답설명 키 ${wk}`);
    }
    if (!it.why && !it.depth) fail(`${it.id} 해설 없음`);
  }
  return ids;
}

// 연속 3회 같은 id 금지
for (const grade of [0, 3, 6, 10]) {
  const ids = runDraws(600, grade);
  for (let i = 3; i < ids.length; i++) {
    if (ids[i] === ids[i - 1] && ids[i] === ids[i - 2] && ids[i] === ids[i - 3]) {
      fail(`학위${grade}: ${ids[i]} 가 4회 연속 (${i - 3}~${i})`);
      break;
    }
  }
  // 최근 6 window 안에 3번 초과
  let worst = 0;
  for (let i = 0; i < ids.length; i++) {
    const w = ids.slice(Math.max(0, i - 5), i + 1);
    const c = w.filter((x) => x === ids[i]).length;
    if (c > worst) worst = c;
  }
  if (worst > SAME_Q_BLOCK) fail(`학위${grade}: 최근 6내 ${worst}회 반복 — 한계 ${SAME_Q_BLOCK}`);
  const uniq = new Set(ids).size;
  console.log(`· 학위 ${grade}단계: 600회 중 고유 문제 ${uniq}개 (반복도 ${(uniq / ids.length * 100).toFixed(0)}%), 최근6내 최대 ${worst}회`);
}

/* ── ④ 인문 비율 ── */
initLearn(5);
let hum = 0, sci = 0, math = 0;
for (let i = 0; i < 3000; i++) {
  const r = nextQuestion({});
  if (r.subj === 'hum') hum++; else if (r.subj === 'sci') sci++; else math++;
}
const hr = hum / 3000, sr = sci / 3000;
if (hr < HUMAN_RATE * 0.5 || hr > HUMAN_RATE * 1.8) fail(`인문 비율 ${(hr * 100).toFixed(1)}% — 목표 ${(HUMAN_RATE * 100).toFixed(0)}% 부근`);
if (sr < SCI_P * 0.5 || sr > SCI_P * 1.6) fail(`과학 비율 ${(sr * 100).toFixed(1)}% — 목표 ${(SCI_P * 100).toFixed(0)}% 부근`);
console.log(`· 3000회抽取: 수학 ${(math / 30).toFixed(1)}% / 과학 ${(sr * 100).toFixed(1)}% / 인문 ${(hr * 100).toFixed(1)}%`);

/* ── 인문에도 문제가 실제 있는가 (fallback 로 수학 문제만 나오는 숨은 실패) ── */
initLearn(8);
let humReal = 0;
for (let i = 0; i < 400; i++) {
  const r = nextQuestion({});
  if (r.subj === 'hum' && r.item.id && r.item.id.startsWith('h_')) humReal++;
}
if (humReal === 0) fail('인문 문제은행(h_)이 하나도 안 나옴 — 문제은행 작성 필요');

/* ── ⑤ 구 세이브 호환 ── */
G.s.learn = { grade: 3, math: { floor: 0, pos: 0 }, sci: { floor: 0, pos: 0 }, sk: {}, streak: 0, best: 0, total: 0, correct: 0, retryOk: 0 };
try {
  ensureLearn();
  for (let i = 0; i < 50; i++) nextQuestion({});
  console.log('· 옛 세이브(learn에 hum/repeats 없음) 50회 출제 OK');
} catch (e) { fail('옛 세이브에서 예외: ' + e.message); }

/* ── report() 가 3계열을 다 내는가 ── */
initLearn(6);
for (let i = 0; i < 80; i++) nextQuestion({});
const rp = report();
if (!rp.hum) fail('report() 에 hum 없음');
if (!rp.sci.length || !rp.math.length) fail('report() 사다리 비어 있음');

console.log(bad ? `\n문제 ${bad}건` : '\n모든 검사 통과');
process.exit(bad ? 1 : 0);