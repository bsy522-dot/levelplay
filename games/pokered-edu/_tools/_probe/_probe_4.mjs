
import { pathToFileURL } from 'url';
import path from 'path';
const R = (p) => pathToFileURL(path.join('..', p)).href;
const M = await import(R('js/learn/math.js')); const A = await import(R('js/learn/math_adv.js'));
const V = await import(R('js/learn/variety.js'));
const byId = Object.fromEntries([...M.MATH, ...(A.MATH_ADV||[])].map(s=>[s.id,s]));
for (const id of ['m_mul_2d1d','m_mul_2d2d','m_frac_add','m_pythag']) {
  const s = byId[id];
  const counts={}; const samples=[];
  for(let i=0;i<50;i++){ const q=String(s.gen(false).q);
    const m=(q.match(/\d+(?:[.]\d+)?/g)||[]);
    const maxIdx = m.length? Math.max(...q.matchAll(/\{(\d+)\}/g).map(x=>Number(x[1]))):0;
    const need = q.includes('{')? 0 : m.length;
    counts[need]=(counts[need]||0)+1;
    if(samples.length<2) samples.push(q);
  }
  console.log(`\n== ${id}  NUM ${V.numTemplateCount(id)} FRAME ${V.frameTemplateCount(id)}`);
  console.log('  원본 숫자개수 분포:', JSON.stringify(counts));
  console.log('  원본 예:', JSON.stringify(samples));
  const vg = V.vary(s.gen, id);
  const vs=[vg(false).q, vg(false).q, vg(false).q];
  console.log('  변형 예:', JSON.stringify(vs).slice(0,240));
}
