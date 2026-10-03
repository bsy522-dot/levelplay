/* 후반 전투 규칙 검사 (브라우저 없이 mech.js 만 불러서 숫자로 확인한다)
 * 두 턴 기술 · 파괴광선 반동 · 일격필살 · 조이기 · 고정 데미지 · 리플렉터/빛의장막 · 꿈먹기 · 보스 AI
 * 실행: node _tools/battletest.mjs */
import fs from 'fs';
import { DB, ITEMS } from '../js/data.js';
import * as M from '../js/battle/mech.js';

const root = new URL('../', import.meta.url);
const J = (f) => JSON.parse(fs.readFileSync(new URL(f, root), 'utf-8'));
DB.species = J('data/species.json');
DB.moves = J('data/moves.json');
DB.trainers = J('data/trainers.json');

let pass = 0, fail = 0;
const ok = (name, cond, extra = '') => { if (cond) { pass++; console.log('  ✓', name); } else { fail++; console.log('  ✗', name, extra); } };
const eq = (name, got, want) => ok(name, JSON.stringify(got) === JSON.stringify(want), `got ${JSON.stringify(got)} want ${JSON.stringify(want)}`);

const byKey = (k) => DB.species.find((s) => s.key === k)?.id;
const mon = (id, lv, extra = {}) => {
  const m = M.makeMon(id, lv, { iv: { atk: 8, def: 8, spe: 8, spc: 8 } });
  return Object.assign(m, extra);
};
const bat = (id, lv, side = 'me', extra = {}) => M.battler(mon(id, lv, extra), side);
const withRandom = (v, fn) => { const o = Math.random; Math.random = () => v; try { return fn(); } finally { Math.random = o; } };
const mv = (id) => DB.moves[id];
const find = (name) => DB.species.find((s) => s.name === name)?.id;

// 종족 번호 (이름은 한국어): 꼬부기·이상해씨·피카츄·고라파덕 등. 못 찾으면 번호로
const SQUIRTLE = 7, CHARIZARD = 6, ONIX = 95, GENGAR = 94, SNORLAX = 143, GEODUDE = 74, PIDGEOT = 18, ALAKAZAM = 65, GYARADOS = 130, RHYDON = 112, PIKACHU = 25;
void find; void byKey;

console.log('[1] 두 턴 기술');
{
  const a = bat(CHARIZARD, 50), d = bat(SQUIRTLE, 50, 'foe');
  for (const id of ['Solarbeam', 'SkyAttack', 'SkullBash', 'RazorWind', 'Fly', 'Dig']) ok(`${id} 는 두 턴 기술`, M.isChargeMove(mv(id)));
  ok('보통 기술은 두 턴 기술 아님', !M.isChargeMove(mv('Tackle')) && !M.isChargeMove(mv('HyperBeam')));
  eq('솔라빔 1턴째=charge', M.chargePhase(a, mv('Solarbeam')), 'charge');
  ok('모으는 중 상태가 남는다', a.charge === 'Solarbeam' && a.invuln === false);
  eq('솔라빔 2턴째=attack', M.chargePhase(a, mv('Solarbeam')), 'attack');
  ok('공격 뒤 상태가 지워진다', a.charge === null && a.invuln === false);
  eq('다시 쓰면 또 charge', M.chargePhase(a, mv('Solarbeam')), 'charge');
  M.cancelCharge(a);
  ok('취소하면 지워진다 (잠듦·마비로 못 움직일 때)', a.charge === null);
  eq('보통 기술=normal', M.chargePhase(a, mv('Tackle')), 'normal');
  ok('솔라빔 모으는 문구', M.CHARGE_TEXT.Solarbeam === '햇빛을 모았다!');

  // 공중날기·구멍파기: 모으는 턴에 숨는다 → 상대 공격이 닿지 않는다
  for (const id of ['Fly', 'Dig']) {
    const x = bat(PIDGEOT, 50);
    M.chargePhase(x, mv(id));
    ok(`${id} 모으는 턴: 숨음`, x.invuln === true);
    ok(`${id} 숨은 상대에게 공격이 닿지 않음`, !M.canTarget(x, mv('Tackle')) && !M.canTarget(x, mv('Thunderbolt')) && !M.canTarget(x, mv('Growl')));
    ok(`${id} 숨은 쪽의 자기 강화 기술은 가능`, M.canTarget(x, mv('SwordsDance')) && M.canTarget(x, mv('Recover')));
    M.chargePhase(x, mv(id));
    ok(`${id} 공격하는 턴: 다시 나타남`, x.invuln === false && M.canTarget(x, mv('Tackle')));
  }
  // 솔라빔·불새 등은 모으는 동안 숨지 않는다
  const y = bat(PIDGEOT, 50); M.chargePhase(y, mv('SkyAttack'));
  ok('불새는 모으는 중에도 맞는다', y.invuln === false && M.canTarget(y, mv('Tackle')));
  void d;
}

console.log('[2] 파괴광선 반동');
{
  const a = bat(SNORLAX, 50), d = bat(SQUIRTLE, 50, 'foe');
  d.m.hp = 30; // 살아 있게
  ok('상대가 서 있으면 반동 예약', M.hyperBeamAfter(a, d) === true && a.recharge === true);
  a.recharge = false; d.m.hp = 0;
  ok('상대를 쓰러뜨리면 반동 없음 (1세대)', M.hyperBeamAfter(a, d) === false && a.recharge === false);
  ok('파괴광선은 효과 HyperBeamEffect', mv('HyperBeam').effect === 'HyperBeamEffect');
}

console.log('[3] 일격필살');
{
  // 땅가르기: 라이츄처럼 빠른 쪽이 느린 상대에게 / 느린 쪽은 실패
  const fast = bat(RHYDON, 50), slow = bat(SNORLAX, 50, 'foe');
  const sf = M.effSpeed(fast), ss = M.effSpeed(slow);
  const fastMon = ss >= sf ? slow : fast, slowMon = ss >= sf ? fast : slow; // 더 빠른 쪽을 찾는다
  const f = mv('Fissure'), h = mv('HornDrill'), g = mv('Guillotine');
  ok('스피드 비교 준비', M.effSpeed(fastMon) > M.effSpeed(slowMon), `${sf} vs ${ss}`);
  const w = withRandom(0.5, () => M.damage(fastMon, slowMon, mv('Guillotine')));
  ok('가위자르기: 빠른 쪽이 맞히면 상대 HP 전부', w.ko === true && w.dmg === slowMon.m.hp, JSON.stringify(w));
  const l = withRandom(0.5, () => M.damage(slowMon, fastMon, mv('Guillotine')));
  ok('가위자르기: 느린 쪽은 실패', l.fail === true && l.dmg === 0, JSON.stringify(l));
  ok('ohkoBlocked 가 같은 판정', M.ohkoBlocked(slowMon, fastMon) && !M.ohkoBlocked(fastMon, slowMon));
  // 같은 스피드는 통한다 (≥)
  const e1 = bat(PIKACHU, 30), e2 = bat(PIKACHU, 30, 'foe');
  ok('스피드가 같으면 통한다', M.effSpeed(e1) === M.effSpeed(e2) && !M.ohkoBlocked(e1, e2));
  // 마비로 느려지면 실패
  e1.m.status = 'PAR';
  ok('마비로 느려진 쪽은 실패', M.ohkoBlocked(e1, e2));
  // 상성 무효
  const flyer = bat(PIDGEOT, 70, 'foe'), ground = bat(RHYDON, 70);
  const imm = M.damage(ground, flyer, f);
  ok('땅가르기는 비행에 효과 없음', imm.mult === 0 && imm.dmg === 0 && !imm.ko, JSON.stringify(imm));
  const gh = M.damage(bat(RHYDON, 70), bat(GENGAR, 20, 'foe'), h);
  ok('뿔드릴은 고스트에 효과 없음', gh.mult === 0 && !gh.ko, JSON.stringify(gh));
  ok('일격필살 3종 효과 OhkoEffect', [f, h, g].every((x) => x.effect === 'OhkoEffect'));
}

console.log('[4] 조이기류');
{
  const t = bat(SQUIRTLE, 50, 'foe');
  for (const id of ['Wrap', 'Bind', 'FireSpin', 'Clamp']) ok(`${id} 는 TrappingEffect`, mv(id).effect === 'TrappingEffect');
  ok('처음 걸리면 true', M.startTrap(t, mv('Wrap')) === true);
  ok('2~5턴', t.trap >= 2 && t.trap <= 5 && t.trapName === '김밥말이');
  const first = t.trap;
  ok('걸려 있는 동안 다시 걸리지 않는다', M.startTrap(t, mv('Bind')) === false && t.trap === first && t.trapName === '김밥말이');
  // 모든 값 2~5 가 나오는지, 범위를 벗어나지 않는지
  const seen = new Set();
  for (let i = 0; i < 400; i++) { const x = bat(SQUIRTLE, 5, 'foe'); M.startTrap(x, mv('Wrap')); seen.add(x.trap); }
  eq('조이는 턴 수 분포', [...seen].sort(), [2, 3, 4, 5]);
  // 턴 끝 데미지: 최대 HP 1/16
  const hp = M.stats(t.m).hp, want = Math.max(1, Math.floor(hp / 16));
  let turns = 0, total = 0, last;
  while (t.trap > 0) { last = M.trapTick(t); turns++; total += last.dmg; if (turns > 10) break; }
  ok('틱 횟수가 걸린 턴과 같다', turns === first, `${turns} vs ${first}`);
  ok('틱 데미지=최대HP/16', total === want * first, `${total} vs ${want * first}`);
  ok('마지막 틱에 풀림 표시', last.ended === true);
  ok('풀린 뒤엔 틱 없음', M.trapTick(t) === null);
  ok('HP 1/16 은 낮다(작은 데미지)', want <= hp / 15);
}

console.log('[5] 고정 데미지');
{
  const a = bat(ALAKAZAM, 37), d = bat(RHYDON, 60, 'foe');
  const st = (id) => withRandom(0.5, () => M.damage(a, d, mv(id)));
  eq('지구던지기=내 레벨', st('SeismicToss').dmg, 37);
  eq('나이트헤드=내 레벨', st('NightShade').dmg, 37);
  eq('용의분노=40', st('DragonRage').dmg, 40);
  eq('소닉붐=20', st('Sonicboom').dmg, 20);
  d.m.hp = 101; eq('분노의앞니=현재 HP 절반(내림)', st('SuperFang').dmg, 50);
  d.m.hp = 1; eq('분노의앞니는 최소 1', st('SuperFang').dmg, 1);
  const a2 = bat(ALAKAZAM, 80); eq('레벨이 오르면 같이 오른다', withRandom(0.5, () => M.damage(a2, d, mv('SeismicToss')).dmg), 80);
  // 능력치·벽의 영향을 받지 않는다
  d.m.hp = 200; d.reflect = 5; d.lscreen = 5; d.st.def = 6; d.st.spc = 6;
  eq('벽·방어 상승과 무관', st('SeismicToss').dmg, 37);
}

console.log('[6] 리플렉터 / 빛의장막');
{
  const a = bat(RHYDON, 60), d = bat(SNORLAX, 60, 'foe');
  const dmgOf = (move, def) => withRandom(0.99, () => M.damage(a, def, mv(move)));
  const phys0 = dmgOf('Strength', d), spec0 = dmgOf('Surf', d);
  ok('벽 없을 때 기준값이 있다', phys0.dmg > 4 && spec0.dmg > 4, JSON.stringify([phys0, spec0]));
  ok('급소는 아님 (기준 조건)', !phys0.crit && !spec0.crit);
  d.reflect = 5;
  const phys1 = dmgOf('Strength', d), spec1 = dmgOf('Surf', d);
  eq('리플렉터: 물리 데미지 절반', phys1.dmg, Math.max(1, Math.floor(phys0.dmg / 2)));
  eq('리플렉터: 특수는 그대로', spec1.dmg, spec0.dmg);
  d.reflect = 0; d.lscreen = 5;
  const phys2 = dmgOf('Strength', d), spec2 = dmgOf('Surf', d);
  eq('빛의장막: 특수 데미지 절반', spec2.dmg, Math.max(1, Math.floor(spec0.dmg / 2)));
  eq('빛의장막: 물리는 그대로', phys2.dmg, phys0.dmg);
  // 급소는 벽을 무시
  d.reflect = 5; d.lscreen = 0;
  const cr = withRandom(0.0, () => M.damage(a, d, mv('Strength'))); // random=0 → 급소 + 최저 롤
  ok('급소(random=0)는 벽을 무시', cr.crit === true);
  d.reflect = 0;
  const cr0 = withRandom(0.0, () => M.damage(a, d, mv('Strength')));
  eq('급소 데미지는 벽 유무와 같다', cr.dmg, cr0.dmg);
  // 5턴 지속
  const u = bat(ALAKAZAM, 50);
  ok('처음 치면 성공', M.raiseScreen(u, 'reflect') === true && u.reflect === 5);
  ok('이미 있으면 실패', M.raiseScreen(u, 'reflect') === false);
  let gone = [], turns = 0;
  while (u.reflect > 0 && turns < 10) { turns++; gone = M.screenTick(u); }
  eq('5턴 지속 뒤 사라진다', [turns, gone], [5, ['리플렉터']]);
  M.raiseScreen(u, 'lscreen'); M.raiseScreen(u, 'reflect');
  for (let i = 0; i < 4; i++) M.screenTick(u);
  eq('4턴째엔 둘 다 남아 있다', [u.reflect, u.lscreen], [1, 1]);
  eq('5턴째 둘 다 사라짐', M.screenTick(u).sort(), ['리플렉터', '빛의장막']);
  ok('가짜 능력 단계 효과는 제거됨', !('ReflectEffect' in M.STAT_FX) && !('LightScreenEffect' in M.STAT_FX));
}

console.log('[7] 꿈먹기');
{
  const a = bat(GENGAR, 40), d = bat(SNORLAX, 40, 'foe');
  ok('깨어 있으면 막힘', M.dreamEaterBlocked(d));
  d.m.status = 'PAR'; ok('마비여도 막힘', M.dreamEaterBlocked(d));
  d.m.status = 'SLP'; ok('잠들어 있으면 통함', !M.dreamEaterBlocked(d));
  d.m.status = null;
  ok('보스 AI 도 깨어 있는 상대엔 꿈먹기를 점수 -1', M.aiScore(a, d, mv('DreamEater')) === -1);
  d.m.status = 'SLP'; ok('잠든 상대엔 점수가 있다', M.aiScore(a, d, mv('DreamEater')) > 0);
}

console.log('[8] 보스 AI');
{
  for (const c of ['Brock', 'Misty', 'LtSurge', 'Erika', 'Koga', 'Sabrina', 'Blaine', 'Giovanni', 'Lorelei', 'Bruno', 'Agatha', 'Lance', 'Rival3']) {
    ok(`${c} 는 트레이너 데이터에 있고 보스`, !!DB.trainers[c] && M.isBossTrainer({ cls: c }));
  }
  ok('일반 트레이너는 보스가 아님', !M.isBossTrainer({ cls: 'Youngster' }) && !M.isBossTrainer({ cls: 'BugCatcher' }) && !M.isBossTrainer({}));
  const slotsOf = (ids) => ids.map((id) => ({ id, pp: mv(id).pp }));
  const rng0 = () => 0.5; // 항상 최선 선택

  // 상성 좋은 공격 우선: 불꽃(파이리 계열)이 풀 상대에게 불꽃 vs 몸통박치기
  const fire = bat(CHARIZARD, 50, 'foe'); fire.m.moves = slotsOf(['Tackle', 'Flamethrower', 'Growl']);
  const grass = bat(3, 50); // 이상해꽃
  eq('풀 상대엔 불꽃', M.aiPickSlot(fire, grass, rng0).id, 'Flamethrower');

  // 효과 없는 기술 회피: 고스트에 노말·격투
  const norm = bat(SNORLAX, 50, 'foe'); norm.m.moves = slotsOf(['BodySlam', 'Earthquake', 'SeismicToss']);
  const ghost = bat(GENGAR, 50);
  ok('고스트에게 노말기술 점수 -1', M.aiScore(norm, ghost, mv('BodySlam')) === -1);
  const pk = M.aiPickSlot(norm, ghost, rng0).id;
  ok('고스트 상대로 노말기술을 고르지 않는다', pk !== 'BodySlam', pk);
  ok('비행에게 땅 기술 -1', M.aiScore(norm, bat(PIDGEOT, 50), mv('Earthquake')) === -1);
  ok('땅가르기도 비행에게 -1', M.aiScore(norm, bat(PIDGEOT, 50), mv('Fissure')) === -1);

  // 이미 상태이상이면 상태 기술을 다시 쓰지 않는다
  const st = bat(ALAKAZAM, 50, 'foe'); st.m.moves = slotsOf(['Hypnosis', 'ThunderWave', 'Toxic', 'Confusion']);
  const tgt = bat(SNORLAX, 50);
  ok('깨끗한 상대엔 수면기 점수가 있다', M.aiScore(st, tgt, mv('Hypnosis')) > 0);
  tgt.m.status = 'PAR';
  for (const id of ['Hypnosis', 'ThunderWave', 'Toxic']) ok(`이미 마비된 상대에 ${id} 점수 -1`, M.aiScore(st, tgt, mv(id)) === -1);
  const picks = new Set(); for (let i = 0; i < 60; i++) picks.add(M.aiPickSlot(st, tgt, Math.random).id);
  ok('상태 걸린 상대에게 상태 기술을 하나도 안 쓴다 (AI 60회, 10% 무작위 포함해도 점수 있는 것만)', ![...picks].some((x) => ['Hypnosis', 'ThunderWave', 'Toxic'].includes(x)), [...picks].join());
  ok('전기 마비기를 땅 상대에 -1', M.aiScore(st, bat(RHYDON, 50), mv('ThunderWave')) === -1);
  ok('독 타입에 독 기술 -1', M.aiScore(st, bat(GENGAR, 50), mv('Toxic')) === -1);

  // 모든 기술이 쓸모없으면 그냥 아무거나라도 낸다 (null 이 아님)
  const lone = bat(SNORLAX, 50, 'foe'); lone.m.moves = slotsOf(['BodySlam']);
  ok('쓸 수 있는 게 이것뿐이면 그걸 낸다', M.aiPickSlot(lone, ghost, rng0)?.id === 'BodySlam');
  const empty = bat(SNORLAX, 50, 'foe'); empty.m.moves.forEach((x) => { x.pp = 0; });
  ok('PP 가 없으면 null', M.aiPickSlot(empty, ghost) === null);

  // 일격필살은 빠를 때만
  const oh = bat(RHYDON, 50, 'foe'), slowT = bat(SNORLAX, 50), fastT = bat(PIKACHU, 50);
  void oh; void fastT;
  const faster = M.effSpeed(bat(PIKACHU, 50)) > M.effSpeed(bat(SNORLAX, 50));
  ok('테스트 전제: 피카츄가 잠만보보다 빠르다', faster);
  const pika = bat(PIKACHU, 50, 'foe');
  ok('빠른 쪽 AI 는 일격필살 점수가 있다', M.aiScore(pika, slowT, mv('Guillotine')) > 0);
  ok('느린 쪽 AI 는 일격필살 -1', M.aiScore(slowT, pika, mv('Guillotine')) === -1);

  // 벽·강화 중복 금지
  const wall = bat(ALAKAZAM, 50, 'foe'); wall.reflect = 3;
  ok('이미 리플렉터가 있으면 다시 안 침', M.aiScore(wall, tgt, mv('Reflect')) === -1);
  ok('빛의장막은 아직 안 쳤으니 점수 있음', M.aiScore(wall, tgt, mv('LightScreen')) > 0);
  const up = bat(ALAKAZAM, 50, 'foe'); up.st.atk = 6;
  ok('공격 +6 이면 칼춤 안 춤', M.aiScore(up, tgt, mv('SwordsDance')) === -1);
  const down = bat(ALAKAZAM, 50); down.st.def = -6;
  ok('방어 -6 인 상대에게 방어 낮추기 안 씀', M.aiScore(wall, down, mv('Leer')) === -1);

  // 고급상처약
  const f = bat(SNORLAX, 50, 'foe'); const mx = M.stats(f.m).hp;
  f.m.hp = Math.floor(mx * 0.25) - 1; ok('HP 25% 미만이면 약', M.aiShouldHeal(f, false));
  f.m.hp = Math.ceil(mx * 0.25); ok('HP 25% 이상이면 약 안 씀', !M.aiShouldHeal(f, false));
  f.m.hp = 1; ok('이미 썼으면 다시 안 씀 (배틀당 한 번)', !M.aiShouldHeal(f, true));
  f.charge = 'Solarbeam'; ok('두 턴 기술 중엔 약 안 씀', !M.aiShouldHeal(f, false));
  f.charge = null; f.recharge = true; ok('반동 중엔 약 안 씀', !M.aiShouldHeal(f, false));
  eq('고급상처약은 200', M.HYPER_POTION, 200);
  eq('게임 속 고급상처약(18)의 회복량과 같다', ITEMS[18].heal, M.HYPER_POTION);

  // 점수: 잡기 쉬운 비교 (KO 가능 기술 우선)
  const big = bat(RHYDON, 60, 'foe'); big.m.moves = slotsOf(['Tackle', 'Earthquake', 'Growl']);
  const weakT = bat(SQUIRTLE, 5); weakT.m.hp = 3;
  ok('쓰러뜨릴 수 있는 공격이 변화기보다 높다', M.aiScore(big, weakT, mv('Earthquake')) > M.aiScore(big, weakT, mv('Growl')));
}

console.log('[9] 기존 규칙이 그대로인지');
{
  const a = bat(CHARIZARD, 50), d = bat(SQUIRTLE, 50, 'foe');
  const r = withRandom(0.99, () => M.damage(a, d, mv('Flamethrower')));
  ok('불꽃은 물에 별로 (0.5배)', r.mult === 0.5);
  const r2 = withRandom(0.99, () => M.damage(d, a, mv('Surf')));
  ok('물은 불에 굉장 (2배)', r2.mult === 2 && r2.dmg > r.dmg);
  ok('battler 기본 상태', a.charge === null && a.recharge === false && a.trap === 0 && a.reflect === 0 && a.lscreen === 0 && !a.invuln);
  eq('능력 단계 효과표 유지', M.STAT_FX.AttackUp2Effect, ['self', 'atk', 2]);
  ok('makeMon/movesAt 동작', M.makeMon(PIKACHU, 20).moves.length > 0);
}

console.log(`\n결과: 통과 ${pass} / 실패 ${fail}`);
process.exit(fail ? 1 : 0);
