/* 인문 비율의 진짜 구성 — 7.2% 중 h_ 문제와 '인문 칸에 수학 문제'가 각각 몇 개인가.
 * 실행: node _tools/probe_hum_mix.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const R = (p) => pathToFileURL(path.join(here, '..', p)).href;

const _f = globalThis.fetch;
globalThis.fetch = async (u, o) => {
  if (typeof u === 'string' && !/^https?:/.test(u)) {
    const p = path.resolve(here, '..', u);
    return { ok: true, status: 200, json: async () => JSON.parse(fs.readFileSync(p, 'utf8')) };
  }
  return _f(u, o);
};
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, v),
  removeItem: (k) => mem.delete(k),
};

const ST = await import(R('js/state.js'));
const { loadAll } = await import(R('js/data.js'));
await loadAll();
ST.newState({ name: 'T', rival: 'R', grade: 5 });

const T = await import(R('js/learn/tutor.js'));
T.initLearn(5);

let humSlot = 0, realHuman = 0, mathInHum = 0, sciInHum = 0;
const skillInHum = new Map();
const byPrefix = {};

for (let i = 0; i < 3000; i++) {
  const r = T.nextQuestion({});
  if (r.subj !== 'hum') continue;
  humSlot++;
  const id = r.item.id;
  const p = id.slice(0, 2);
  byPrefix[p] = (byPrefix[p] || 0) + 1;
  if (p === 'h_') realHuman++;
  else if (p === 'm_') mathInHum++;
  else sciInHum++;
  skillInHum.set(r.skill, (skillInHum.get(r.skill) || 0) + 1);
}

console.log('인문 칸 출제:', humSlot, '회');
console.log('  진짜 인문(h_):', realHuman, `(${((realHuman / humSlot) * 100).toFixed(1)}%)`);
console.log('  수학 세입(m_):', mathInHum, `(${((mathInHum / humSlot) * 100).toFixed(1)}%)`);
console.log('  과학 세입(s_):', sciInHum, `(${((sciInHum / humSlot) * 100).toFixed(1)}%)`);
console.log('\n인문 칸에서 나온 skill 분포:');
[...skillInHum.entries()].sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));