
import { pathToFileURL } from 'url';
import path from 'path';
const R = (p) => pathToFileURL(path.join('..', p)).href;
const { signature } = await import(R('js/util.js'));
const M = await import(R('js/learn/math.js')); const A = await import(R('js/learn/math_adv.js'));
const V = await import(R('js/learn/variety.js'));
const all = [...M.MATH, ...(A.MATH_ADV||[])];

const rows=[];
for (const s of all) {
  if (typeof s.gen!=='function') continue;
  const vg = V.vary(s.gen, s.id);
  const sigs=new Set(), broken=[];
  for(let i=0;i<120;i++){
    const it = vg(false);
    sigs.add(signature(it.q,'math'));
    // 깨진 문장 검사: { }가 남았거나 빈 자리
    if (/\{\d+\}/.test(it.q) || /[가-힣]\s+을\s|이\s+을|를\s+을/.test(it.q)) broken.push(it.q);
  }
  rows.push({id:s.id,g:s.g,t:s.t,sigs:sigs.size,has:V.hasSituation(s.id),n:V.situationCount(s.id),broken:broken.length});
}
console.log(JSON.stringify(rows));
