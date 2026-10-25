
import { pathToFileURL } from 'url';
import path from 'path';
const R = (p) => pathToFileURL(path.join('..', p)).href;
const { signature } = await import(R('js/util.js'));
const MATH = await import(R('js/learn/math.js'));
const A = await import(R('js/learn/math_adv.js'));
const V = await import(R('js/learn/variety.js'));
const all = [...MATH.MATH, ...(A.MATH_ADV||A.MATH||[])];

// ✗ 로 남은 것의 실제 원본 질문문
const byId = Object.fromEntries(all.map(s=>[s.id,s]));
for (const id of ['m_add10','m_sub10','m_add_carry1','m_add2d1d','m_compare10','m_mul_concept','m_times_a']) {
  const s = byId[id]; if (!s) { console.log(id, '없음'); continue; }
  const raw = [s.gen(false), s.gen(false), s.gen(false)].map(x=>x.q);
  const sigRaw = new Set(raw.map(q=>signature(q,'math')));
  const vg = V.vary(s.gen, id);
  const va = [vg(false), vg(false), vg(false), vg(false)].map(x=>x.q);
  const sigVar = new Set(va.map(q=>signature(q,'math')));
  console.log(`\n== ${id}  상황변형 ${V.situationCount(id)}종`);
  console.log('  원본 3종:', JSON.stringify(raw));
  console.log('  → 시그니처', sigRaw.size, '종');
  console.log('  변형 4종:', JSON.stringify(va, null, 0).slice(0,260));
  console.log('  → 시그니처', sigVar.size, '종');
}
