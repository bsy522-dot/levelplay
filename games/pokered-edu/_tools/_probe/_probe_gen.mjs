
import { pathToFileURL } from 'url';
import path from 'path';
const R = (p) => pathToFileURL(path.join('..', p)).href;
const { G, newState } = await import(R('js/state.js'));
const MATH = await import(R('js/learn/math.js'));
const MATHA = await import(R('js/learn/math_adv.js'));

const all = [...(MATH.MATH || []), ...(MATHA.MATH_ADV || MATHA.MATH || [])];
console.log('generator count:', all.length);
const bad = [];
for (const s of all) {
  if (typeof s.gen !== 'function') continue;
  const t0 = Date.now();
  let ok = 0;
  try {
    for (let i = 0; i < 40; i++) { s.gen(false); ok++; }
  } catch (e) { bad.push(`${s.id}: EXC ${e.message}`); continue; }
  const dt = Date.now() - t0;
  if (dt > 800) bad.push(`${s.id}: 40회 ${dt}ms (느림)`);
}
console.log(bad.length ? 'SLOW/ERR:\n' + bad.join('\n') : '모든 생성자 정상 (40회 < 800ms)');

// applyExp 무한루프 (level 100 cap)
const M = await import(R('js/battle/mech.js'));
const { makeMon } = M;
const mon = makeMon(1);
mon.exp = 999999; mon.lv = 1;
const t1 = Date.now();
M.applyExp(mon, 500000);
console.log('applyExp(lv99만):', Date.now() - t1, 'ms -> lv', mon.lv);
