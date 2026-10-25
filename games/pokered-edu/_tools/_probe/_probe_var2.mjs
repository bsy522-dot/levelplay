
import { pathToFileURL } from 'url';
import path from 'path';
const R = (p) => pathToFileURL(path.join('..', p)).href;
const { signature } = await import(R('js/util.js'));
const MATH = await import(R('js/learn/math.js'));
const A = await import(R('js/learn/math_adv.js'));
const V = await import(R('js/learn/variety.js'));
const all = [...MATH.MATH, ...(A.MATH_ADV||A.MATH||[])];

const rows=[];
for (const s of all) {
  if (typeof s.gen!=='function') continue;
  const raw=new Set(), varS=new Set();
  let qsample=[];
  for(let i=0;i<80;i++){
    const a=s.gen(false); raw.add(signature(a.q,'math')); if(i<2) qsample.push(a.q);
    const b=V.vary(s.gen,s.id)(false); varS.add(signature(b.q,'math'));
  }
  rows.push({id:s.id, raw:raw.size, var:varS.size, n:V.situationCount(s.id), q:qsample[0]});
}
rows.sort((a,b)=>(a.var-a.raw)-(b.var-b.raw));
console.log('원본 시그니처1종 → 변형 후 개선된 것 상위20:');
for(const r of rows.slice(0,20)) console.log(`  ${r.id.padEnd(18)} ${r.raw} → ${r.var}  (상황${r.n}종)  원본q="${r.q}"`);
const improved = rows.filter(r=>r.var>r.raw).length;
const noChange = rows.filter(r=>r.var===1).length;
console.log(`\n전체 ${rows.length}개 중 개선 ${improved}개 / 여전히 1종 ${noChange}개`);
console.log('상황변형 정의된 주제:', V.situationIds().length, '개');
console.log('\n정의 안 된 수학 주제 (앞 15):');
for(const r of rows.filter(r=>r.n===0).slice(0,15)) console.log(`  ${r.id.padEnd(18)} 시그니처 ${r.var}  q="${r.q}"`);
