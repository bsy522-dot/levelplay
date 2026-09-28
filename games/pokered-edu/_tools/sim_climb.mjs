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
