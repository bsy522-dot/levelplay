
import { pathToFileURL } from 'url';
import path from 'path';
const R = (p) => pathToFileURL(path.join('..', p)).href;
const M = await import(R('js/learn/math.js')); const A = await import(R('js/learn/math_adv.js'));
const V = await import(R('js/learn/variety.js'));
const byId = Object.fromEntries([...M.MATH, ...(A.MATH_ADV||[])].map(s=>[s.id,s]));
for (const id of ['m_add2d2d','m_dec_add','m_ratio']) {
  const s = byId[id]; const vg = V.vary(s.gen, id);
  const raw=[], varq=[];
  for(let i=0;i<4;i++){ raw.push(s.gen(false).q); varq.push(vg(false).q); }
  console.log(`\n== ${id}  (NUM ${V.numTemplateCount(id)} / FRAME ${V.frameTemplateCount(id)})`);
  console.log('  원본:', JSON.stringify(raw));
  console.log('  변형:', JSON.stringify(varq, null, 0).slice(0,300));
}
