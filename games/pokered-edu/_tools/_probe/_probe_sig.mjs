
import { pathToFileURL } from 'url';
import path from 'path';
const R = (p) => pathToFileURL(path.join('..', p)).href;
const { signature } = await import(R('js/util.js'));
const MATH = await import(R('js/learn/math.js'));
const A = await import(R('js/learn/math_adv.js'));
const all = [...MATH.MATH, ...(A.MATH_ADV||A.MATH||[])];

// 요구사항 21번: "2+3" → "4+5" 는 새 문제 아니다.
// 각 생성자가 실제로 몇 개의 서로 다른 시그니처를 낼 수 있는가?
const rows = [];
for (const s of all) {
  if (typeof s.gen !== 'function') continue;
  const sigs = new Set();
  const qs = new Set();
  for (let i = 0; i < 60; i++) { const it = s.gen(false); sigs.add(signature(it.q,'math')); qs.add(it.q); }
  rows.push({ id: s.id, sigs: sigs.size, qs: qs.size });
}
rows.sort((a,b)=>a.sigs-b.sigs);
const one = rows.filter(r=>r.sigs<=1).length;
console.log('생성기 총', rows.length);
console.log('시그니처가 1종뿐(항상 같은 문제) :', one, '개');
console.log('\n가장 나쁜 15개:');
for (const r of rows.slice(0,15)) console.log(`  ${r.id}: 시그니처 ${r.sigs}종 / 서로다른 문제문 ${r.qs}종`);
const good = rows.filter(r=>r.sigs>=3).length;
console.log('\n시그니처 3종 이상:', good, '/', rows.length);
