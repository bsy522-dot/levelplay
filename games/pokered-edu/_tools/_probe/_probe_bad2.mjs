
import { pathToFileURL } from 'url';
import path from 'path';
const R = (p) => pathToFileURL(path.join('..', p)).href;
const M = await import(R('js/learn/math.js')); const A = await import(R('js/learn/math_adv.js'));
const V = await import(R('js/learn/variety.js'));
const byId = Object.fromEntries([...M.MATH, ...(A.MATH_ADV||[])].map(s=>[s.id,s]));
for (const id of ['m_sub2d2d','m_pythag']) {
  const vg = V.vary(byId[id].gen, id);
  const bad=[];
  for(let i=0;i<90;i++){ const it=vg(false); const q=String(it.q);
    if(/\{\d+\}/.test(q)) bad.push(['자리남음',q]);
    else if(/[가-힣]\s+(을|를|이|가|은|는|와|과)\s*$/.test(q.trim())) bad.push(['빈조사',q]);
    else if(/\s{2,}|\s[,.、]/.test(q)) bad.push(['공백',q]);
  }
  console.log(`\n== ${id}  ${bad.length}건`);
  const seen=new Set();
  for(const [k,q] of bad){ if(seen.has(k+q))continue; seen.add(k+q); console.log(`  [${k}] ${q}`); }
}
