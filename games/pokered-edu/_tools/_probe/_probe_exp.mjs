/* applyExp 무한루프 검증 — battle.js:419 경로(경험치 대량 지급)를 그대로 재현한다.
 * ★main.js:boot() 와 동일 순서로 loadAll() 을 먼저 불러야 DB 가 채워진다. */
import { pathToFileURL } from 'url';
import path from 'path';

const R = (p) => pathToFileURL(path.join('..', p)).href;

/* Node 에서 상대경로 fetch 를 되게 하�� 값만 빌린다 (게임 로직은 손대지 않는다) */
import fs from 'fs';
const _f = globalThis.fetch;
globalThis.fetch = async (u, o) => {
  if (typeof u === 'string' && !/^https?:/.test(u)) {
    const p = path.resolve('..', u);
    return { ok: true, status: 200, json: async () => JSON.parse(fs.readFileSync(p, 'utf8')) };
  }
  return _f(u, o);
};

const ST = await import(R('js/state.js'));
const { loadAll } = await import(R('js/data.js'));

await loadAll();
ST.newState({ name: 'T', rival: 'R', grade: 3 });

const { sp } = await import(R('js/data.js'));
const M = await import(R('js/battle/mech.js'));
const { makeMon } = M;

const mon = makeMon(1);
console.log('species1 =', sp(1).name, 'growth', sp(1).growth);

mon.lv = 1; mon.exp = 0;
let t = Date.now();
M.applyExp(mon, 5000000);
console.log('applyExp(+500만):', Date.now() - t, 'ms -> lv', mon.lv, 'exp', mon.exp);

mon.lv = 98; mon.exp = 0;
t = Date.now();
M.applyExp(mon, 10000000);
console.log('applyExp lv98(+1000만):', Date.now() - t, 'ms -> lv', mon.lv);

const T = await import(R('js/learn/tutor.js'));
T.initLearn(3);
T.record({ id: 'm_add10', skill: 'm_add10' }, true, true);
console.log('expMult =', T.expMult());