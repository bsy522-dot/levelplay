
import { pathToFileURL } from 'url';
import path from 'path';
const R = (p) => pathToFileURL(path.join('..', p)).href;
const M = await import(R('js/learn/math.js')); const A = await import(R('js/learn/math_adv.js'));
const V = await import(R('js/learn/variety.js'));
const byId = Object.fromEntries([...M.MATH, ...(A.MATH_ADV||[])].map(s=>[s.id,s]));
for (const id of ['m_add10','m_clock_half','m_stats','m_factor','m_expand','m_dec_add','m_make10','m_add_carry1']) {
  const vg = V.vary(byId[id].gen, id);
  const bad=[];
  for(let i=0;i<90;i++){ const it=vg(false); if(/\{\d+\}/.test(it.q) || !/[?？]$/.test(String(it.q).trim())) bad.push(it.q); }
  console.log(`\n== ${id}  깨진 ${bad.length}건`);
  console.log('  ', JSON.stringify([...new Set(bad)].slice(0,4)));
}
