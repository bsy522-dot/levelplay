
import { pathToFileURL } from 'url';
import path from 'path';
const R = (p) => pathToFileURL(path.join('..', p)).href;
const MATH = await import(R('js/learn/math.js'));
const A = await import(R('js/learn/math_adv.js'));
const V = await import(R('js/learn/variety.js'));
const all = [...MATH.MATH, ...(A.MATH_ADV||A.MATH||[])];
const need=[];
for (const s of all) {
  if (typeof s.gen!=='function') continue;
  if (V.hasSituation(s.id)) continue;
  const samples=[];
  for(let i=0;i<6;i++){ const it=s.gen(false); samples.push(it.q); }
  need.push({id:s.id, t:s.t, q:samples[0], all:samples});
}
console.log(JSON.stringify(need, null, 1));
