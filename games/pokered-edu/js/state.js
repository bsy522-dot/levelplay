/* 진행 상태 + 저장. 저장은 이 기기 브라우저(localStorage)에 한다. */
import { stats, healMon } from './battle/mech.js';

const KEY = 'pokered_edu_save_v1';

export const G = {
  s: null, // 저장되는 전부
};

export function newState({ name, rival, grade }) {
  G.s = {
    v: 1, name, rival, grade,
    map: 'RedsHouse2F', x: 5, y: 6, facing: 'up',
    party: [], box: [], bag: {}, money: 3000,
    flags: {}, badges: [],
    dex: { seen: {}, caught: {} },
    respawn: { map: 'RedsHouse1F', x: 3, y: 5 },
    lastOutdoor: 'PalletTown',
    learn: null, // tutor.js 가 채운다
    playMs: 0, started: Date.now(),
    stats: { battles: 0, wins: 0, caught: 0 },
  };
  return G.s;
}

export function save() {
  if (!G.s) return false;
  try { localStorage.setItem(KEY, JSON.stringify(G.s)); return true; } catch (e) { return false; }
}
export function hasSave() {
  try { return !!localStorage.getItem(KEY); } catch (e) { return false; }
}
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    G.s = JSON.parse(raw);
    return G.s;
  } catch (e) { return null; }
}
export function wipe() { try { localStorage.removeItem(KEY); } catch (e) { /* 없음 */ } }

export const flag = (k) => !!G.s.flags[k];
export const setFlag = (k, v = true) => { G.s.flags[k] = v; };

export function addItem(id, n = 1) { G.s.bag[id] = (G.s.bag[id] || 0) + n; if (G.s.bag[id] <= 0) delete G.s.bag[id]; }
export const itemCount = (id) => G.s.bag[id] || 0;

export function seen(id) { G.s.dex.seen[id] = 1; }
export function caught(id) { G.s.dex.seen[id] = 1; G.s.dex.caught[id] = 1; }

/** 새 포켓몬 받기: 파티 6마리가 꽉 차면 보관함으로 */
export function receive(m) {
  caught(m.sp);
  if (G.s.party.length < 6) { G.s.party.push(m); return 'party'; }
  G.s.box.push(m); return 'box';
}
export const alive = () => G.s.party.filter((m) => m.hp > 0);
export function healParty() { G.s.party.forEach(healMon); }
export const maxHp = (m) => stats(m).hp;
