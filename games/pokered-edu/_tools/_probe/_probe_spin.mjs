
import { pathToFileURL } from 'url';
import path from 'path';
const R = (p) => pathToFileURL(path.join('..', p)).href;
const { G, newState } = await import(R('js/state.js'));
const T = await import(R('js/learn/tutor.js'));
newState({ name: 'T', rival: 'R', grade: 3 });
T.initLearn(3);
const l = G.s.learn;
console.log('repeats after init:', l.repeats.length);

const t0 = Date.now();
let n = 0;
try { for (let i = 0; i < 200; i++) { T.nextQuestion({}); n++; } }
catch (e) { console.log('EXC at', n, ':', e.message); }
console.log('200 draws:', Date.now() - t0, 'ms');
console.log('repeats:', l.repeats.length, 'recent:', l.recent.length, 'log:', l.log.length, 'sk keys:', Object.keys(l.sk).length);

// ★ 폴백 경로 강제: bank 문제 전부 blocked → 316행 near 루프가 도는지
const ldb = await import(R('js/bank.js')).catch(() => null);
