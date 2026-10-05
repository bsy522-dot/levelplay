/* 난이도 상승 모의실험: 몇 문제 만에 어디까지 올라가나.  node _tools/sim_climb.mjs */
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const u = (p) => pathToFileURL(path.join(here, '..', p)).href;
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const { DB } = await import(u('js/data.js'));
DB.science = [...JSON.parse(fs.readFileSync(path.join(here, '../data/science_a.json'), 'utf8')), ...JSON.parse(fs.readFileSync(path.join(here, '../data/science_b.json'), 'utf8'))];
const { G } = await import(u('js/state.js'));
const T = await import(u('js/learn/tutor.js'));
const L = T.MATH_ALL;
function run(label, grade, pRight, N = 200) {
  G.s = { learn: null, flags: {} }; T.initLearn(grade);
  for (const s of T.placementPlan()) { const q = T.placementQuestion(s); T.placementAnswer(q, Math.random() < pRight); }
  T.placementDone();
  const marks = [];
  for (let i = 1; i <= N; i++) {
    const q = T.nextQuestion({ subject: 'math' });
    const ok = Math.random() < pRight;
    T.record(q, ok, true);
    if (!ok) T.record(q, Math.random() < pRight, false);
    if ([20, 50, 100, 200].includes(i)) marks.push(`${i}문제→${L[T.frontier('math')].t}(g${L[T.frontier('math')].g})`);
  }
  console.log(label.padEnd(26), marks.join(' | '));
}
run('미취학, 다 맞힘', 0, 1);
run('미취학, 90% 맞힘', 0, 0.9);
run('미취학, 70% 맞힘', 0, 0.7);
run('1학년, 40% 맞힘', 1, 0.4);
console.log('수학 사다리', L.length, '단계: ', L[0].t, '→', L[L.length - 1].t);

/* ── 행운 방지 점검 (2026-10-03 병석님: "운 좋게 잘 찍으니 너무 가버린다") ──
 * 보기 4개를 아무거나 누르는 아이(맞힐 확률 25%, 다시 풀기는 보기 3개라 33%)는
 * 200문제를 풀어도 시작 단계 근처에 있어야 한다. 실제 배틀처럼 포켓몬 한 마리마다 학습 묶음으로 푼다. */
const FIX = process.argv.includes('--check');
let bad = 0;
const fail = (m) => { bad++; console.log('  ✗', m); };
function climb(grade, pFirst, pRetry, N = 200, runs = 30) {
  const ends = [];
  for (let r = 0; r < runs; r++) {
    G.s = { learn: null, flags: {} }; T.initLearn(grade);
    T.placementDone();
    const start = T.frontier('math');
    let lesson = T.newLesson();
    for (let i = 0; i < N; i++) {
      if (i % 5 === 0) lesson = T.newLesson();
      const q = T.nextQuestion({ subject: 'math', lesson });
      const ok = Math.random() < (q.item.a.length === 3 ? pRetry : pFirst);
      T.record(q, ok, true);
      T.lessonResult(lesson, ok);
      if (!ok) { const q2 = T.nextQuestion({ lesson }); const ok2 = Math.random() < pRetry; T.record(q2, ok2, false); T.lessonResult(lesson, ok2, true); }
    }
    ends.push(T.frontier('math') - start);
  }
  ends.sort((a, b) => a - b);
  return { med: ends[ends.length >> 1], max: ends[ends.length - 1] };
}
const guess = climb(2, 0.25, 0.33);
console.log(`\n찍기만 하는 아이(25%) 200문제: 단계 상승 중앙값 ${guess.med}, 최대 ${guess.max}`);
if (guess.max > 2) fail(`찍기만 해도 ${guess.max}단계까지 올라감 — 2단계 이하여야 함`);
const good = climb(2, 0.9, 0.95);
console.log(`잘 푸는 아이(90%) 200문제: 단계 상승 중앙값 ${good.med}, 최대 ${good.max}`);
if (good.med < 6) fail(`잘 푸는 아이가 ${good.med}단계밖에 못 올라감 — 6단계 이상 올라가야 함`);
if (FIX) { console.log(bad ? `\n행운 방지: 문제 ${bad}건` : '\n행운 방지: 모든 검사 통과'); process.exit(bad ? 1 : 0); }
