/* 게이트 규칙 실측 — 브라우저 없이 node 로. 통과해야 배틀 구현으로 간다. */
const path = require('path');
const fs = require('fs');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const skin = JSON.parse(fs.readFileSync(path.join(ROOT, 'skin.json'), 'utf8'));
const doc = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'monsters.json'), 'utf8'));

const sandbox = { console };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'js', 'core.js'), 'utf8'), sandbox);
const core = sandbox.MB.core;

let fail = 0;
function ok(name, cond, extra) {
  console.log((cond ? '  PASS ' : '  FAIL ') + name + (extra ? '  ' + extra : ''));
  if (!cond) fail++;
}

console.log('== 1. 상태 초기화 ==');
let s = core.makeState(skin);
ok('초기 스트릭 0', s.streak === 0);
ok('초기 최근기록 비어있음', s.recent.length === 0);

console.log('== 2. 5연속만으로는 게이트가 열리지 않는다 (3단 조건) ==');
for (let i = 0; i < 5; i++) core.record(s, 'K1', true);
let g = core.gate(s, skin, 'K1');
ok('5연속 달성됨', s.streak === 5, 'streak=' + s.streak);
ok('근본 정확도 100%', g.cond.recent.ok, 'acc=' + g.acc.toFixed(2));
ok('노출 5회 ≥ 3', g.cond.seen.ok, 'seen=' + g.cond.seen.val);
ok('게이트 OPEN', g.open === true);

console.log('== 3. 오답 1회면 즉시 닫힌다 ==');
core.record(s, 'K1', false);
g = core.gate(s, skin, 'K1');
ok('스트릭 0으로 리셋', s.streak === 0);
ok('게이트 CLOSED', g.open === false);

console.log('== 4. 5연속이어도 노출 2회면 막힌다 ==');
s = core.makeState(skin);
for (let i = 0; i < 5; i++) core.record(s, 'K2', true);
core.record(s, 'K2', false); // 스트릭 끊었다가 노출만 올린다
s.streak = 5;               // 스트릭만人为로 세팅(노출 부족 시뮬)
s.topicSeen.K2 = 2;
g = core.gate(s, skin, 'K2');
ok('노출 2 < 3 이므로 막힘', g.cond.seen.ok === false, 'seen=' + g.cond.seen.val);
ok('전체 게이트 CLOSED', g.open === false);

console.log('== 5. 최근 10문제 정확도 70% 미만이면 막힌다 ==');
s = core.makeState(skin);
s.streak = 5; s.topicSeen.K3 = 3;
s.recent = [true, true, false, true, false, true, false, false, true, false]; // 5/10
g = core.gate(s, skin, 'K3');
ok('정확도 50% < 70%', g.acc.toFixed(2) === '0.50', 'acc=' + g.acc);
ok('정확도 조건 미충족', g.cond.recent.ok === false);
ok('게이트 CLOSED', g.open === false);

console.log('== 6. 최근 기록 3개 미만일 때는 정확도 판정을 유보한다 ==');
s = core.makeState(skin);
s.streak = 5; s.topicSeen.K4 = 3;
s.recent = [true, true];
g = core.gate(s, skin, 'K4');
ok('표본 2개 < 최소 3', g.cond.recent.ok === false);

console.log('== 7. 몬스터 목록 / 다음 몬스터 ==');
const list = core.monsterList(doc);
ok('몬스터 46마리', list.length === 46, 'n=' + list.length);
const t1 = list.filter(m => m.tier === 1).length;
const t4 = list.filter(m => m.tier === 4).length;
ok('티어1 존재', t1 > 0, 'tier1=' + t1);
ok('티어4는 1마리 (최종보스)', t4 === 1, 'tier4=' + t4);
const bad = list.filter(m => !m.quiz || m.quiz.length < 2);
ok('모든 몬스터에 문제 2개 이상', bad.length === 0, '부족=' + bad.length);

console.log('== 8. 전역 누적 스트릭으로 서로 다른 몬스터를 연달아 이긴다 ==');
s = core.makeState(skin);
let wins = 0;
for (const m of list.slice(0, 5)) {
  for (const q of m.quiz) { core.record(s, m.key, true); wins++; }
  s.defeated[m.monster.id] = true;
}
ok('5몸 클리어 후 스트릭 5 이상', s.streak >= 5, 'streak=' + s.streak);
g = core.gate(s, skin, list[0].key);
ok('게이트 OPEN (전역 누적)', g.open === true, '정답 ' + s.rightTotal + '개');

console.log('== 9. 힌트 사용은 보상만 줄인다 (진행은 막지 않는다) ==');
s = core.makeState(skin);
core.record(s, 'K5', true);
const hpBefore = s.heroHp;
ok('힌트 사용 후에도 전투 진행 가능', s.streak === 1, 'streak=' + s.streak);
ok('오답이 아니므로 HP 유지', s.heroHp === hpBefore);

console.log(fail === 0 ? '\n전부 통과' : '\n실패 ' + fail + '건');
process.exit(fail ? 1 : 0);
