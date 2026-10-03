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
  return { m, side, st: { atk: 0, def: 0, spe: 0, spc: 0, acc: 0, eva: 0 }, conf: 0, seeded: false, flinch: false, sleep: 0, lastDmg: 0, crit: false };
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

export function damage(att, def, move) {
  if (move.effect === 'SpecialDamageEffect') {
    if (move.id === 'Sonicboom') return { dmg: 20, mult: 1 };
    if (move.id === 'DragonRage') return { dmg: 40, mult: 1 };
    if (move.id === 'Psywave') return { dmg: rand(1, Math.floor(att.m.lv * 1.5)), mult: 1 };
    return { dmg: att.m.lv, mult: 1 }; // 지구던지기, 나이트헤드
  }
  if (move.effect === 'SuperFangEffect') return { dmg: Math.max(1, Math.floor(def.m.hp / 2)), mult: 1 };
  const A = stats(att.m), D = stats(def.m);
  const special = SPECIAL_TYPES.has(move.type);
  const critP = (sp(att.m.sp).base.speed / 512) * (HIGH_CRIT.has(move.id) ? 8 : 1);
  const crit = chance(Math.min(0.5, critP));
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
  if (mult === 0) return { dmg: 0, mult, crit: false };
  dmg = Math.max(1, Math.floor((dmg * rand(217, 255)) / 255));
  return { dmg, mult, crit };
}

/* 기술의 추가 효과 설명표: [대상('self'|'foe'), 능력, 단계] 또는 상태이상 [확률, 상태] */
export const STAT_FX = {
  AttackDown1Effect: ['foe', 'atk', -1], DefenseDown1Effect: ['foe', 'def', -1], DefenseDown2Effect: ['foe', 'def', -2],
  SpeedDown1Effect: ['foe', 'spe', -1], AccuracyDown1Effect: ['foe', 'acc', -1],
  AttackUp1Effect: ['self', 'atk', 1], AttackUp2Effect: ['self', 'atk', 2], DefenseUp1Effect: ['self', 'def', 1],
  DefenseUp2Effect: ['self', 'def', 2], SpeedUp2Effect: ['self', 'spe', 2], SpecialUp1Effect: ['self', 'spc', 1],
  SpecialUp2Effect: ['self', 'spc', 2], EvasionUp1Effect: ['self', 'eva', 1],
  LightScreenEffect: ['self', 'spc', 1], ReflectEffect: ['self', 'def', 1], MistEffect: ['self', 'def', 1], FocusEnergyEffect: ['self', 'atk', 1],
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
export function expProgress(m) {
  const s = sp(m.sp);
  const a = expAt(s.growth, m.lv), b = expAt(s.growth, m.lv + 1);
  return Math.max(0, Math.min(1, (m.exp - a) / Math.max(1, b - a)));
}
