
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
const here = import.meta.dirname;
const R = (p) => pathToFileURL(path.join(here, '..', p)).href;
const _f = globalThis.fetch;
globalThis.fetch = async (u,o) => typeof u==='string' && !/^https?:/.test(u)
  ? { ok:true, status:200, json: async()=>JSON.parse(fs.readFileSync(path.resolve(here,'..',u),'utf8')) }
  : _f(u,o);
const mem=new Map();
globalThis.localStorage={getItem:k=>mem.has(k)?mem.get(k):null,setItem:(k,v)=>mem.set(k,v),removeItem:k=>mem.delete(k)};
const ST=await import(R('js/state.js')); const {loadAll}=await import(R('js/data.js'));
await loadAll(); ST.newState({name:'T',rival:'R',grade:0});
const T=await import(R('js/learn/tutor.js'));
T.initLearn(0);
const seen=new Map();
for(let i=0;i<2000;i++){ const r=T.nextQuestion({}); if(r.subj==='hum') seen.set(r.skill,(seen.get(r.skill)||0)+1); }
console.log('학위0 → 인문 단계:', [...seen.entries()].map(([k,v])=>k+':'+v).join(', ')||'0회');

// ★게임과 동일하게 q 를 통째로 넘겨 record 호출 (인문 정답 기록 = 실제 경로)
T.initLearn(0);
let err=0;
for(let i=0;i<500;i++){
  const r=T.nextQuestion({});
  try { T.record(r, true, true); } catch(e){ err++; if(err===1) console.log('record EXC:', e.message); }
}
console.log('인문 포함 500회 record → 예외', err, '건');
const seen2=new Map();
for(let i=0;i<1500;i++){ const r=T.nextQuestion({}); if(r.subj==='hum') seen2.set(r.skill,(seen2.get(r.skill)||0)+1); }
console.log('정답 500회 후 → 인문 단계:', [...seen2.entries()].map(([k,v])=>k+':'+v).join(', ')||'0회');
const sci=new Map();
for(let i=0;i<1500;i++){ const r=T.nextQuestion({}); if(r.subj==='sci') sci.set(r.skill,(sci.get(r.skill)||0)+1); }
console.log('과학 상위5:', [...sci.entries()].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([k,v])=>k+':'+v).join(', '));
