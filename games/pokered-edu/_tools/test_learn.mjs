/* 학습 문제 점검: 수학 생성기를 주제마다 수백 번 돌리고, 과학 문제은행 형식을 검사한다.
 * 실행: node _tools/test_learn.mjs */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const { MATH: BASE } = await import(pathToFileURL(path.join(here, '../js/learn/math.js')).href);
const { MATH_ADV } = await import(pathToFileURL(path.join(here, '../js/learn/math_adv.js')).href);
const MATH = [...BASE, ...MATH_ADV];

let bad = 0;
const samples = {};
function check(id, q, label) {
  const errs = [];
  if (!q.q) errs.push('문제 없음');
  if (!Array.isArray(q.a) || q.a.length !== 4) errs.push('보기 수 ' + (q.a && q.a.length));
  else if (new Set(q.a).size !== 4) errs.push('보기 중복 ' + q.a.join('|'));
  if (!(q.c >= 0 && q.c < 4)) errs.push('정답 번호');
  const wk = Object.keys(q.wrong || {}).map(Number).sort().join();
  if (wk !== [0, 1, 2, 3].filter((x) => x !== q.c).join()) errs.push('오답 설명 키 ' + wk);
  if ((q.a || []).some((x) => /NaN|undefined|null|Infinity/.test(x) || /^-\d/.test(x))) errs.push('이상한 값 ' + q.a.join('|'));
  if (!q.why) errs.push('정답 설명 없음');
  if (errs.length) { bad++; if (bad < 30) console.log('✗', id, label, errs.join('; '), '|', q.q); }
}
for (const s of MATH) {
  for (let i = 0; i < 300; i++) {
    for (const st of [false, true]) {
      let q;
      try { q = s.gen(st); } catch (e) { bad++; console.log('✗ 오류', s.id, e.message); break; }
      check(s.id, q, st ? '상황' : '');
      samples[s.id] ??= q;
    }
  }
}
console.log(`수학 주제 ${MATH.length}개 × 600문제 검사, 문제 ${bad}건`);

for (const f of ['science_a.json', 'science_b.json']) {
  const items = JSON.parse(fs.readFileSync(path.join(here, '../data', f), 'utf8'));
  const before = bad;
  items.forEach((it) => check(it.id, it, f));
  console.log(`${f}: ${items.length}문제, 문제 ${bad - before}건`);
}
if (process.argv.includes('--show')) {
  for (const id of Object.keys(samples)) { const q = samples[id]; console.log(`\n[${id}] ${q.q}\n  ${q.a.map((a, i) => (i === q.c ? '★' : ' ') + a).join('  ')}\n  왜: ${q.why}`); }
}
process.exit(bad ? 1 : 0);
