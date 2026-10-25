
import fs from 'fs'; import path from 'path'; import { pathToFileURL } from 'url';
const R = (p) => pathToFileURL(path.join('..', p)).href;
const { signature } = await import(R('js/util.js'));
const M = await import(R('js/learn/math.js')); const A = await import(R('js/learn/math_adv.js'));
const all = [...M.MATH, ...(A.MATH_ADV||[])];

const out = [];
for (const s of all) {
  if (typeof s.gen !== 'function') continue;
  const sigs = new Set(); const qs = new Set();
  for (let i=0;i<80;i++){ const it = s.gen(false); sigs.add(signature(it.q,'math')); qs.add(it.q); }
  // 왜(해설) 길이 = 6번 '왜 만들어졌는지' 서술 구조의 자리
  const why = s.gen(false).why || '';
  out.push({ id:s.id, g:s.g, t:s.t, sigs:sigs.size, qs:qs.size, whyLen:why.length,
             idea: (s.idea||'').slice(0,40) });
}
out.sort((a,b)=>a.g-b.g);
console.log(JSON.stringify(out));
