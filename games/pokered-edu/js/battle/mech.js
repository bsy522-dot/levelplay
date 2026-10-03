/* 1세대(레드) 전투 규칙: 능력치, 데미지, 타입 상성, 경험치, 포획 */
import { DB, sp } from '../data.js';
import { rand, chance } from '../util.js';

// 1세대 상성표 (공격 -> 방어 -> 배율). 적지 않은 조합은 1배.
const CHART = {
  Normal: { Rock: 0.5, Ghost: 0 },
  Fire: { Fire: 0.5, Water: 0.5, Grass: 2, Ice: 2, Bug: 2, Rock: 0.5, Dragon: 0.5 },
  Water: { Fire: 2, Water: 0.5, Grass: 0.5, Ground: 2, Rock: 2, Dragon: 0.5 },
  Electric: { Water: 2, Electric: 0.5, Grass: 0.5, Ground: 0, Flying: 2, Dragon: 0.5 },
  Grass: { Fire: 0.5, Water: 2, Grass: 0.5, Poison: 0.5, Ground: 2, Flying: 0.5, Bug: 0.5, Rock: 2, Dragon: 0.5 },
  Ice: { Water: 0.5, Grass: 2, Ice: 0.5, Ground: 2, Flying: 2, Dragon: 2 },
  Fighting: { Normal: 2, Ice: 2, Poison: 0.5, Flying: 0.5, Psychic: 0.5, Bug: 0.5, Rock: 2, Ghost: 0 },
  Poison: { Grass: 2, Poison: 0.5, Ground: 0.5, Bug: 2, Rock: 0.5, Ghost: 0.5 },
  Ground: { Fire: 2, Electric: 2, Grass: 0.5, Poison: 2, Flying: 0, Bug: 0.5, Rock: 2 },
  Flying: { Electric: 0.5, Grass: 2, Fighting: 2, Bug: 2, Rock: 0.5 },
  Psychic: { Fighting: 2, Poison: 2, Psychic: 0.5 },
  Bug: { Fire: 0.5, Grass: 2, Fighting: 0.5, Poison: 2, Flying: 0.5, Psychic: 2, Ghost: 0.5 },
  Rock: { Fire: 2, Ice: 2, Fighting: 0.5, Ground: 0.5, Flying: 2, Bug: 2 },
  Ghost: { Normal: 0, Psychic: 0, Ghost: 2 },
  Dragon: { Dragon: 2 },
};
export const SPECIAL_TYPES = new Set(['Fire', 'Water', 'Grass', 'Electric', 'Ice', 'Psychic', 'Dragon']);
const HIGH_CRIT = new Set(['Slash', 'KarateChop', 'RazorLeaf', 'Crabhammer']);

export function typeMult(atkType, defTypes) {
  return defTypes.reduce((m, t) => m * ((CHART[atkType] || {})[t] ?? 1), 1);
}

export function expAt(growth, lv) {
  const n = lv;
  switch (growth) {
    case 'Fast': return Math.floor(0.8 * n ** 3);
    case 'Slow': return Math.floor(1.25 * n ** 3);
    case 'MediumSlow': return Math.max(0, Math.floor(1.2 * n ** 3 - 15 * n ** 2 + 100 * n - 140));
    default: return n ** 3; // MediumFast
  }
}

function statOf(base, iv, lv) { return Math.floor(((base + iv) * 2 * lv) / 100) + 5; }
function hpOf(base, iv, lv) { return Math.floor(((base + iv) * 2 * lv) / 100) + lv + 10; }

export function stats(m) {
  const b = sp(m.sp).base;
  return {
    hp: hpOf(b.hp, m.iv.hp, m.lv) + (m.hpBonus || 0),
    atk: statOf(b.attack, m.iv.atk, m.lv), def: statOf(b.defense, m.iv.def, m.lv),
    spe: statOf(b.speed, m.iv.spe, m.lv), spc: statOf(b.special, m.iv.spc, m.lv),
  };
}

/** 레벨까지 배우는 기술 중 최근 4개 */
export function movesAt(id, lv) {
  const s = sp(id);
  const list = [...s.start];
  for (const [l, mv] of s.learn) if (l <= lv && !list.includes(mv)) list.push(mv);
  return list.slice(-4);
}

export function makeMon(id, lv, opts = {}) {
  const iv = opts.iv || { atk: rand(4, 15), def: rand(4, 15), spe: rand(4, 15), spc: rand(4, 15) };
  iv.hp = ((iv.atk & 1) << 3) | ((iv.def & 1) << 2) | ((iv.spe & 1) << 1) | (iv.spc & 1);
  const m = { sp: id, lv, exp: expAt(sp(id).growth, lv), iv, status: null, moves: [] };
  m.moves = (opts.moves || movesAt(id, lv)).map((mv) => ({ id: mv, pp: DB.moves[mv].pp }));
  m.hp = stats(m).hp;
  return m;
}

export function healMon(m) {
  m.hp = stats(m).hp; m.status = null;
  m.moves.forEach((mv) => { mv.pp = DB.moves[mv.id].pp; });
}

/* ── 전투 중 상태 (능력 단계, 혼란, 씨뿌리기 등) ── */
export function battler(m, side) {
  return {
    m, side, st: { atk: 0, def: 0, spe: 0, spc: 0, acc: 0, eva: 0 }, conf: 0, seeded: false, flinch: false, sleep: 0, lastDmg: 0, crit: false,
    charge: null, invuln: false, recharge: false, // 두 턴 기술 / 파괴광선 반동
    trap: 0, trapName: '', reflect: 0, lscreen: 0, // 조이기류 남은 턴 / 벽 남은 턴
  };
}
const stageMul = (n) => (n >= 0 ? (2 + n) / 2 : 2 / (2 - n));
const accMul = (n) => (n >= 0 ? (3 + n) / 3 : 3 / (3 - n));

export function effSpeed(b) {
  let s = stats(b.m).spe * stageMul(b.st.spe);
  if (b.m.status === 'PAR') s /= 4;
  return s;
}

/** 명중 판정 (문제를 맞힌 플레이어 기술은 무조건 명중 → force) */
export function hits(att, def, move, force) {
  if (force) return true;
  if (move.effect === 'SwiftEffect') return true;
  const p = (move.acc / 100) * accMul(att.st.acc) / accMul(def.st.eva);
  return Math.random() < Math.min(1, p);
}

/** 일격필살: 쓰는 쪽 스피드가 상대보다 느리면 실패 (1세대 규칙) */
export function ohkoBlocked(att, def) { return effSpeed(att) < effSpeed(def); }

/** 데미지 식 한 번 계산 (crit/roll 을 밖에서 정한다. 벽은 급소에 안 통한다) */
function calcDamage(att, def, move, crit, roll) {
  const A = stats(att.m), D = stats(def.m);
  const special = SPECIAL_TYPES.has(move.type);
  let a = special ? A.spc : A.atk, d = special ? D.spc : D.def;
  if (!crit) {
    a *= stageMul(special ? att.st.spc : att.st.atk);
    d *= stageMul(special ? def.st.spc : def.st.def);
    if (!special && att.m.status === 'BRN') a /= 2;
  }
  const lv = crit ? att.m.lv * 2 : att.m.lv;
  let dmg = Math.floor(Math.floor((Math.floor((2 * lv) / 5 + 2) * move.power * Math.max(1, a)) / Math.max(1, d)) / 50) + 2;
  if (sp(att.m.sp).types.includes(move.type)) dmg = Math.floor(dmg * 1.5);
  const mult = typeMult(move.type, sp(def.m.sp).types);
  dmg = Math.floor(dmg * mult);
  if (mult === 0) return { dmg: 0, mult };
  dmg = Math.max(1, Math.floor((dmg * roll) / 255));
  // 리플렉터(물리)·빛의장막(특수): 데미지 절반
  if (!crit && (special ? def.lscreen : def.reflect) > 0) dmg = Math.max(1, Math.floor(dmg / 2));
  return { dmg, mult };
}

export function damage(att, def, move) {
  if (move.effect === 'SpecialDamageEffect') {
    if (move.id === 'Sonicboom') return { dmg: 20, mult: 1 };
    if (move.id === 'DragonRage') return { dmg: 40, mult: 1 };
    if (move.id === 'Psywave') return { dmg: rand(1, Math.floor(att.m.lv * 1.5)), mult: 1 };
    return { dmg: att.m.lv, mult: 1 }; // 지구던지기, 나이트헤드
  }
  if (move.effect === 'SuperFangEffect') return { dmg: Math.max(1, Math.floor(def.m.hp / 2)), mult: 1 };
  if (move.effect === 'OhkoEffect') {
    const mult = typeMult(move.type, sp(def.m.sp).types);
    if (mult === 0) return { dmg: 0, mult, crit: false };
    if (ohkoBlocked(att, def)) return { dmg: 0, mult, crit: false, fail: true };
    return { dmg: def.m.hp, mult, crit: false, ko: true };
  }
  const critP = (sp(att.m.sp).base.speed / 512) * (HIGH_CRIT.has(move.id) ? 8 : 1);
  const crit = chance(Math.min(0.5, critP));
  const r = calcDamage(att, def, move, crit, rand(217, 255));
  if (r.mult === 0) return { dmg: 0, mult: 0, crit: false };
  return { dmg: r.dmg, mult: r.mult, crit };
}

/* ── 두 턴 기술 · 반동 · 조이기 · 벽 · 꿈먹기 ── */
export const CHARGE_TEXT = {
  Solarbeam: '햇빛을 모았다!', SkyAttack: '강한 빛에 휩싸였다!', SkullBash: '머리를 움츠렸다!', RazorWind: '칼바람을 일으키고 있다!',
  Fly: '하늘 높이 날아올랐다!', Dig: '땅속으로 숨었다!',
};
const INVULN = new Set(['Fly', 'Dig']);
export const isChargeMove = (mv) => !!mv && (mv.effect === 'ChargeEffect' || mv.effect === 'FlyEffect');
/** 두 턴 기술의 지금 단계: 'normal'(보통 기술) | 'charge'(모으는 턴) | 'attack'(공격하는 턴). 상태를 바꾼다 */
export function chargePhase(att, move) {
  if (!isChargeMove(move)) return 'normal';
  if (!att.charge) { att.charge = move.id; att.invuln = INVULN.has(move.id); return 'charge'; }
  att.charge = null; att.invuln = false;
  return 'attack';
}
export function cancelCharge(att) { att.charge = null; att.invuln = false; }
const SELF_EFFECT = new Set(['HealEffect', 'HazeEffect', 'SplashEffect', 'BideEffect', 'ReflectEffect', 'LightScreenEffect', 'FocusEnergyEffect',
  'MistEffect', 'SubstituteEffect', 'RageEffect', 'ConversionEffect', 'TransformEffect', 'MetronomeEffect', 'MirrorMoveEffect']);
export const isSelfMove = (mv) => STAT_FX[mv.effect]?.[0] === 'self' || SELF_EFFECT.has(mv.effect);
/** 공중날기·구멍파기로 숨은 상대에게는 나를 향하지 않는 기술이 닿지 않는다 */
export const canTarget = (def, move) => !(def.invuln && !isSelfMove(move));

/** 파괴광선: 맞혀서 상대가 아직 서 있으면 다음 턴 반동 (쓰러뜨렸으면 없음) */
export function hyperBeamAfter(att, def) { if (def.m.hp > 0) att.recharge = true; return att.recharge; }

/** 조이기류: 2~5턴, 매 턴 끝에 최대 HP 1/16 */
export const trapTurns = () => rand(2, 5);
export function startTrap(def, move) { if (def.trap > 0) return false; def.trap = trapTurns(); def.trapName = move.name; return true; }
export function trapTick(b) {
  if (b.trap <= 0) return null;
  const dmg = Math.max(1, Math.floor(stats(b.m).hp / 16));
  b.trap -= 1;
  return { dmg, ended: b.trap <= 0 };
}

/** 리플렉터·빛의장막: 5턴 (쓴 턴 포함) */
export function raiseScreen(b, kind) { if (b[kind] > 0) return false; b[kind] = 5; return true; }
export function screenTick(b) {
  const gone = [];
  for (const [k, name] of [['reflect', '리플렉터'], ['lscreen', '빛의장막']]) if (b[k] > 0 && --b[k] === 0) gone.push(name);
  return gone;
}

export const dreamEaterBlocked = (def) => def.m.status !== 'SLP';

/* 기술의 추가 효과 설명표: [대상('self'|'foe'), 능력, 단계] 또는 상태이상 [확률, 상태] */
export const STAT_FX = {
  AttackDown1Effect: ['foe', 'atk', -1], DefenseDown1Effect: ['foe', 'def', -1], DefenseDown2Effect: ['foe', 'def', -2],
  SpeedDown1Effect: ['foe', 'spe', -1], AccuracyDown1Effect: ['foe', 'acc', -1],
  AttackUp1Effect: ['self', 'atk', 1], AttackUp2Effect: ['self', 'atk', 2], DefenseUp1Effect: ['self', 'def', 1],
  DefenseUp2Effect: ['self', 'def', 2], SpeedUp2Effect: ['self', 'spe', 2], SpecialUp1Effect: ['self', 'spc', 1],
  SpecialUp2Effect: ['self', 'spc', 2], EvasionUp1Effect: ['self', 'eva', 1],
  MistEffect: ['self', 'def', 1], FocusEnergyEffect: ['self', 'atk', 1], // 리플렉터·빛의장막은 raiseScreen (진짜 데미지 절반)
};
export const SIDE_STAT = { SpeedDownSideEffect: ['spe', 0.33], AttackDownSideEffect: ['atk', 0.33], DefenseDownSideEffect: ['def', 0.33], SpecialDownSideEffect: ['spc', 0.33] };
export const SIDE_STATUS = {
  PoisonSideEffect1: [0.2, 'PSN'], PoisonSideEffect2: [0.4, 'PSN'], BurnSideEffect1: [0.1, 'BRN'], BurnSideEffect2: [0.3, 'BRN'],
  FreezeSideEffect1: [0.1, 'FRZ'], ParalyzeSideEffect1: [0.1, 'PAR'], ParalyzeSideEffect2: [0.3, 'PAR'], TwineedleEffect: [0.2, 'PSN'],
};
export const STATUS_MOVE = { PoisonEffect: 'PSN', ParalyzeEffect: 'PAR', SleepEffect: 'SLP' };
export const STAT_KO = { atk: '공격', def: '방어', spe: '스피드', spc: '특수', acc: '명중률', eva: '회피율' };
export const STATUS_KO = { PSN: '독', PAR: '마비', SLP: '잠듦', BRN: '화상', FRZ: '얼음' };
export const STATUS_COLOR = { PSN: '#9141cb', PAR: '#c9a100', SLP: '#6b7280', BRN: '#e62829', FRZ: '#3dcef3' };

export function catchRoll(target, ballRate = 1) {
  const S = stats(target.m);
  const rate = sp(target.m.sp).catchRate;
  const bonus = { SLP: 2, FRZ: 2, PAR: 1.5, BRN: 1.5, PSN: 1.5 }[target.m.status] || 1;
  const a = (((3 * S.hp - 2 * target.m.hp) * rate * ballRate) / (3 * S.hp)) * bonus;
  const p = Math.min(1, a / 255 + 0.03);
  if (Math.random() < p) return { caught: true, shakes: 3 };
  return { caught: false, shakes: Math.min(2, Math.floor(p * 4 + Math.random())) };
}

export function expGain(foe, trainer) {
  return Math.max(1, Math.floor((sp(foe.sp).baseExp * foe.lv) / 7 * (trainer ? 1.5 : 1)));
}

/** 레벨업 처리. 새로 배운 기술 목록과 진화 대상 반환 */
export function applyExp(m, gain) {
  const s = sp(m.sp);
  m.exp += gain;
  const ups = [];
  while (m.lv < 100 && m.exp >= expAt(s.growth, m.lv + 1)) {
    const before = stats(m);
    m.lv += 1;
    const after = stats(m);
    m.hp += after.hp - before.hp;
    const learned = sp(m.sp).learn.filter(([l]) => l === m.lv).map(([, mv]) => mv);
    ups.push({ lv: m.lv, learned });
  }
  return ups;
}
export function evoTarget(m) {
  const e = sp(m.sp).evo.find((x) => x.method === 'level' && m.lv >= x.level);
  return e ? e.to : null;
}
/** 진화의 돌: 이 포켓몬이 이 돌로 진화하면 그 번호 (이브이는 돌마다 다름) */
export function stoneTarget(m, stone) {
  const e = sp(m.sp).evo.find((x) => x.method === 'item' && x.item === stone);
  return e ? e.to : null;
}
export function expProgress(m) {
  const s = sp(m.sp);
  const a = expAt(s.growth, m.lv), b = expAt(s.growth, m.lv + 1);
  return Math.max(0, Math.min(1, (m.exp - a) / Math.max(1, b - a)));
}

/* ── 트레이너 AI (관장·사천왕·챔피언만) ── */
export const BOSS_CLASSES = new Set(['Brock', 'Misty', 'LtSurge', 'Erika', 'Koga', 'Sabrina', 'Blaine', 'Giovanni',
  'Lorelei', 'Bruno', 'Agatha', 'Lance', 'Rival3']);
export const isBossTrainer = (o) => !!o && (BOSS_CLASSES.has(o.cls) || o.boss === true);
export const HYPER_POTION = 200;
/** 회복약을 쓰는 보스: 원작처럼 앞의 세 관장(웅·이슬·마티스)은 약을 안 쓴다 — 첫 관장이 너무 길어지지 않게 (2026-10-03) */
export const HEAL_CLASSES = new Set(['Erika', 'Koga', 'Sabrina', 'Blaine', 'Giovanni', 'Lorelei', 'Bruno', 'Agatha', 'Lance', 'Rival3']);
export const bossHeals = (o) => !!o && (HEAL_CLASSES.has(o.cls) || o.heal === true);

/** 보스가 고급상처약을 쓸 때인가: 아직 안 썼고, 서 있고, HP 25% 미만, 두 턴 기술 중이 아닐 때 */
export function aiShouldHeal(foe, used) {
  if (used || foe.charge || foe.recharge || foe.m.hp <= 0) return false;
  return foe.m.hp < stats(foe.m).hp * 0.25;
}

/** 평균 데미지 (무작위·급소 없이). 고정 데미지·일격필살 포함. 효과 없으면 0 */
export function expectedDamage(att, def, move) {
  const e = move.effect;
  if (e === 'SpecialDamageEffect') return move.id === 'Sonicboom' ? 20 : move.id === 'DragonRage' ? 40 : move.id === 'Psywave' ? Math.floor(att.m.lv * 0.75) : att.m.lv;
  if (e === 'SuperFangEffect') return Math.max(1, Math.floor(def.m.hp / 2));
  if (e === 'OhkoEffect') return typeMult(move.type, sp(def.m.sp).types) === 0 || ohkoBlocked(att, def) ? 0 : def.m.hp;
  if (!(move.power > 0)) return 0;
  const hits = e === 'TwoToFiveAttacksEffect' ? 3 : (e === 'AttackTwiceEffect' || e === 'TwineedleEffect') ? 2 : 1;
  return calcDamage(att, def, move, false, 236).dmg * hits;
}

/** 기술 하나의 점수. 쓸모없으면(효과 없음·이미 걸림·이미 한계) -1 */
export function aiScore(att, def, move) {
  const e = move.effect, dTypes = sp(def.m.sp).types;
  const dmgMove = move.power > 0 || e === 'SpecialDamageEffect' || e === 'SuperFangEffect' || e === 'OhkoEffect';
  if (dmgMove) {
    const mult = e === 'SpecialDamageEffect' || e === 'SuperFangEffect' ? 1 : typeMult(move.type, dTypes);
    if (mult === 0) return -1;
    if (e === 'OhkoEffect' && ohkoBlocked(att, def)) return -1;
    if (e === 'DreamEaterEffect' && dreamEaterBlocked(def)) return -1;
    if (!canTarget(def, move)) return -1;
    const dmg = expectedDamage(att, def, move);
    const ko = dmg >= def.m.hp;
    let v = (dmg + (ko ? 100 : 0)) * ((move.acc || 100) / 100);
    if (mult > 1) v *= 1.25; // 상성이 좋은 공격을 우선
    if (isChargeMove(move) && !ko) v *= 0.6;
    if (e === 'HyperBeamEffect' && !ko) v *= 0.65;
    if (e === 'ExplodeEffect' && !ko) v *= 0.3;
    if (e === 'TrappingEffect' && !def.trap) v += 8;
    if (e === 'DrainHpEffect') v *= 1.15;
    return v;
  }
  const fx = STAT_FX[e];
  if (fx) { const t = fx[0] === 'self' ? att : def; const lim = fx[2] > 0 ? t.st[fx[1]] >= 6 : t.st[fx[1]] <= -6; return lim ? -1 : fx[0] === 'self' ? 22 : 18; }
  const stt = STATUS_MOVE[e];
  if (stt) {
    if (def.m.status) return -1;
    if (stt === 'PAR' && move.type === 'Electric' && dTypes.includes('Ground')) return -1;
    if (stt === 'PSN' && dTypes.includes('Poison')) return -1;
    return stt === 'SLP' ? 55 : 45;
  }
  switch (e) {
    case 'ConfusionEffect': return def.conf ? -1 : 30;
    case 'LeechSeedEffect': return def.seeded || dTypes.includes('Grass') ? -1 : 30;
    case 'HealEffect': return att.m.hp >= stats(att.m).hp * 0.6 ? -1 : 50;
    case 'ReflectEffect': return att.reflect > 0 ? -1 : 24;
    case 'LightScreenEffect': return att.lscreen > 0 ? -1 : 24;
    case 'HazeEffect': return Object.values(def.st).some((v) => v > 1) || Object.values(att.st).some((v) => v < -1) ? 25 : -1;
    case 'SplashEffect': case 'SwitchAndTeleportEffect': return -1;
    case 'BideEffect': return 10;
    default: return 5;
  }
}

/** 보스가 쓸 기술 칸 고르기. 가끔(10%) 아무거나 쓴다. 기술이 없으면 null */
export function aiPickSlot(foe, me, rng = Math.random) {
  const usable = foe.m.moves.filter((m) => m.pp > 0);
  if (!usable.length) return null;
  const scored = usable.map((slot) => ({ slot, v: aiScore(foe, me, DB.moves[slot.id]) })).filter((x) => x.v >= 0);
  if (!scored.length) return usable[Math.floor(rng() * usable.length)];
  if (rng() < 0.1) return scored[Math.floor(rng() * scored.length)].slot;
  const top = Math.max(...scored.map((x) => x.v));
  const best = scored.filter((x) => x.v >= top - 1e-9);
  return best[Math.floor(rng() * best.length)].slot;
}
