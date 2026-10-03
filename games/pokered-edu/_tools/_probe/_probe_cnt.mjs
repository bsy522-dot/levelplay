
import { pathToFileURL } from 'url';
import path from 'path';
const R = (p) => pathToFileURL(path.join('..', p)).href;
const M = await import(R('js/learn/math.js')); const A = await import(R('js/learn/math_adv.js'));
const byId = Object.fromEntries([...M.MATH, ...(A.MATH_ADV||[])].map(s=>[s.id,s]));
for (const id of ['m_make10','m_add_carry1','m_add2d1d']) {
  const counts = {};
  for(let i=0;i<60;i++){ const q=String(byId[id].gen(false).q);
    const n=(q.match(/\d+(?:[.]\d+)?/g)||[]).length; counts[n]=(counts[n]||0)+1; }
  console.log(id, '원본 숫자 개수 분포:', JSON.stringify(counts), '| 예:', JSON.stringify(byId[id].gen(false).q));
}
