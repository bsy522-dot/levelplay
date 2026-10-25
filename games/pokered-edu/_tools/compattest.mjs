/* 예전 판이 만든 세이브를 새 판이 그대로 이어받는지 (이미 설치된 폰·태블릿 보호).
 *  ① 예전 판 코드(OLD 폴더)로 학년 정하기 → 400문제 풀기 → 세이브 만들기
 *  ② 새 판 코드로 그 세이브를 불러와 400문제 더 풀기 (배틀 묶음·강의 표시·공부 기록 화면 포함)
 *  확인: 오류 없음 / 잡은 포켓몬·레벨·위치·돈·배지 그대로 / 이미 익힌 주제는 계속 익힘 / 학년 그대로
 * 실행: node _tools/compattest.mjs <예전 판 폴더(예: git archive HEAD 를 푼 곳)> */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const NEW = path.resolve(here, '..');
const OLD = path.resolve(process.argv[2] || '');
if (!process.argv[2] || !fs.existsSync(path.join(OLD, 'js', 'learn', 'tutor.js'))) { console.log('예전 판 폴더를 주세요'); process.exit(2); }

let base = NEW;
const _f = globalThis.fetch;
globalThis.fetch = async (u, o) => {
  if (typeof u === 'string' && !/^https?:/.test(u)) {
    const fp = path.resolve(base, u);
    if (!fs.existsSync(fp)) return { ok: false, status: 404, json: async () => { throw new Error('404'); } };
    return { ok: true, status: 200, json: async () => JSON.parse(fs.readFileSync(fp, 'utf8')) };
  }
  return _f(u, o);
};
const mem = new Map();
globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
const imp = (root, p) => import(pathToFileURL(path.join(root, p)).href);

let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗', n, x); } };

/* ── ① 예전 판으로 놀기 ── */
base = OLD;
const oD = await imp(OLD, 'js/data.js'); await oD.loadAll();
const oS = await imp(OLD, 'js/state.js');
const oT = await imp(OLD, 'js/learn/tutor.js');
oS.newState({ name: '아림', rival: '오바람', grade: 3 });
oT.initLearn(3);
// 학년 정하기(배치 고사)도 예전 방식대로
for (const subj of oT.placementPlan()) { const q = oT.placementQuestion(subj); oT.placementAnswer(q, Math.random() < 0.7); }
oT.placementDone();
for (let i = 0; i < 400; i++) {
  const q = oT.nextQuestion({});
  const right = Math.random() < 0.72;
  oT.record(q, right, true);
  if (!right) oT.record(q, Math.random() < 0.6, false);
}
const s = oS.G.s;
s.party = [{ sp: 25, lv: 23, exp: 12167, iv: { atk: 9, def: 9, spe: 9, spc: 9, hp: 9 }, status: null, moves: [{ id: 'Thundershock', pp: 30 }], hp: 50 }, { sp: 74, lv: 15, exp: 3375, iv: { atk: 9, def: 9, spe: 9, spc: 9, hp: 9 }, status: null, moves: [{ id: 'Tackle', pp: 35 }], hp: 40 }];
s.box = [{ sp: 16, lv: 8, exp: 512, iv: { atk: 9, def: 9, spe: 9, spc: 9, hp: 9 }, status: null, moves: [{ id: 'Gust', pp: 35 }], hp: 25 }];
Object.assign(s, { map: 'CeruleanCity', x: 18, y: 20, money: 5230, badges: ['boulder', 'cascade'] });
oS.save();
const savedRaw = localStorage.getItem('pokered_edu_save_v1');
const old = JSON.parse(savedRaw);
const oldMastered = Object.entries(old.learn.sk).filter(([, v]) => v.mastered).map(([k]) => k);
console.log(`예전 판 세이브: 문제 기록 ${Object.keys(old.learn.sk).length}주제, 익힌 주제 ${oldMastered.length}개, 학년 ${old.learn.grade}`);

/* ── ② 새 판으로 이어서 ── */
base = NEW;
const nD = await imp(NEW, 'js/data.js'); await nD.loadAll();
const nS = await imp(NEW, 'js/state.js');
const nT = await imp(NEW, 'js/learn/tutor.js');
let err = null;
try {
  ok('새 판이 예전 세이브를 찾음', nS.hasSave());
  nS.load();
  nT.ensureLearn();
  let lesson = nT.newLesson();
  for (let i = 0; i < 400; i++) {
    if (i % 6 === 0) lesson = nT.newLesson();          // 포켓몬 한 마리마다 새 묶음
    const q = nT.nextQuestion({ lesson });
    if (!q || !q.item || !q.item.q) throw new Error(`${i}번째 문제 없음`);
    const right = Math.random() < 0.72;
    nT.record(q, right, true, { lectured: i % 37 === 0 });
    nT.lessonResult(lesson, right);
    if (!right) { const r2 = nT.nextQuestion({ lesson }); nT.record(r2, true, false); nT.lessonResult(lesson, true, true); }
  }
  const rep = nT.report();
  ok('공부 기록 화면 자료가 만들어짐', rep && Array.isArray(rep.math) && rep.math.length > 0);
  nS.save();
} catch (e) { err = e; }
ok('새 판에서 오류 없음 (400문제)', !err, err && (err.stack || err.message).split('\n').slice(0, 3).join(' | '));

const now = JSON.parse(localStorage.getItem('pokered_edu_save_v1'));
ok('잡은 포켓몬·레벨 그대로 (피카츄 23, 꼬마돌 15, 상자 구구 8)',
  JSON.stringify(now.party.map((m) => [m.sp, m.lv])) === JSON.stringify([[25, 23], [74, 15]]) && JSON.stringify(now.box.map((m) => [m.sp, m.lv])) === JSON.stringify([[16, 8]]),
  JSON.stringify([now.party.map((m) => [m.sp, m.lv]), now.box.map((m) => [m.sp, m.lv])]));
ok('마을 위치 그대로 (블루시티 18,20)', now.map === 'CeruleanCity' && now.x === 18 && now.y === 20, JSON.stringify([now.map, now.x, now.y]));
ok('돈·배지 그대로', now.money === 5230 && now.badges.join() === 'boulder,cascade', JSON.stringify([now.money, now.badges]));
ok('학년 그대로', now.learn.grade === old.learn.grade, JSON.stringify([old.learn.grade, now.learn.grade]));
// 익힌 주제가 다시 내려가는 건 '틀려서 한 단계 내려감' 규칙일 때뿐 — 그래도 대부분은 남아 있어야 한다
const kept = oldMastered.filter((id) => now.learn.sk[id] && now.learn.sk[id].mastered).length;
ok(`예전에 익힌 주제 대부분 유지 (${kept}/${oldMastered.length})`, kept >= oldMastered.length * 0.8, '');
ok('세이브 키는 슬롯 1 자리 그대로, 다른 슬롯을 만들지 않음', ![...mem.keys()].some((k) => k.startsWith('pokered_edu_slot_')), JSON.stringify([...mem.keys()]));
console.log(`\n호환 결과: ${pass} 통과, ${fail} 실패`);
process.exit(fail ? 1 : 0);
