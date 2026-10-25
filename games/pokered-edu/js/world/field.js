/* 필드 기술 (4판~): 풀베기·플래시·날아가기·괴력·파도타기
 * 병석님(2026-10-03): "배지 + 아이템으로 자동" — 포켓몬 기술 칸을 차지하지 않는다.
 *   비전머신을 가지고 있고, 원작과 같은 배지가 있으면 그 자리에서 A 버튼으로 쓴다.
 * 저장(G.s): cut{지도:[\"x,y\"]} 벤 나무(계속 베인 채) · surf 파도타기 중 · boulders{지도:{번호:{x,y}}} 민 바위 · visited[] 날아갈 수 있는 도시 */
import { G } from '../state.js';
import { DB, MAP_NAME } from '../data.js';

export const HM = { cut: 196, fly: 197, surf: 198, strength: 199, flash: 200 };
const NEED_BADGE = { cut: 'cascade', flash: 'boulder', fly: 'thunder', strength: 'rainbow', surf: 'soul' };
export const HM_KO = { cut: '풀베기', fly: '날아가기', surf: '파도타기', strength: '괴력', flash: '플래시' };
const BADGE_KO = { boulder: '회색배지', cascade: '블루배지', thunder: '오렌지배지', rainbow: '무지개배지', soul: '핑크배지', marsh: '골드배지', volcano: '진홍배지', earth: '그린배지' };

export const hasHM = (k) => !!(G.s.bag && G.s.bag[HM[k]]);
export const hasBadge = (k) => (G.s.badges || []).includes(NEED_BADGE[k]);
/** 쓸 수 있으면 null, 아니면 이유 */
export function whyNot(k) {
  if (!hasHM(k)) return `${HM_KO[k]} 비전머신이 없어요.`;
  if (!hasBadge(k)) return `${BADGE_KO[NEED_BADGE[k]]}가 있어야 ${HM_KO[k]}를 쓸 수 있어요.`;
  return null;
}

/* ── 풀베기: 'Y' 칸. 한 번 베면 계속 베인 채 (아이가 같은 일을 반복하지 않게) ── */
export function isCut(mapId, x, y) { return ((G.s.cut || {})[mapId] || []).includes(`${x},${y}`); }
export function doCut(mapId, x, y) { const c = (G.s.cut ||= {}); (c[mapId] ||= []).push(`${x},${y}`); }
/** 그림·걷기에 쓸 지도: 벤 나무 자리를 풀밭('.')으로 바꾼 사본 */
export function effectiveMap(map) {
  const cut = (G.s.cut || {})[map.id];
  if (!cut || !cut.length) return map;
  const grid = map.grid.map((r) => r.split(''));
  for (const k of cut) { const [x, y] = k.split(',').map(Number); if (grid[y] && grid[y][x] === 'Y') grid[y][x] = map.outdoor ? '.' : '_'; }
  return { ...map, grid: grid.map((r) => r.join('')) };
}

/* ── 괴력: 바위(NPC spriteName 'Boulder') 위치 저장 ── */
export const isBoulder = (n) => n && n.spriteName === 'Boulder';
export function boulderPos(mapId, idx) { return ((G.s.boulders || {})[mapId] || {})[idx] || null; }
export function setBoulderPos(mapId, idx, x, y) { const b = (G.s.boulders ||= {}); (b[mapId] ||= {})[idx] = { x, y }; }

/* ── 플래시: 어두운 동굴 (못 지나가지는 않고, 시야만 좁다) ── */
const DARK = new Set(['RockTunnel1F', 'RockTunnelB1F']);
export const isDark = (mapId) => DARK.has(mapId) && !(hasHM('flash') && hasBadge('flash'));

/* ── 날아가기: 가 본 도시 (포켓몬센터가 있는 바깥 지도) ── */
export function markVisited(map) {
  if (!map.outdoor || !(map.buildings || []).some((b) => b.kind === 'center')) return;
  const v = (G.s.visited ||= []);
  if (!v.includes(map.id)) v.push(map.id);
}
export function flyTargets() {
  return (G.s.visited || []).filter((id) => DB.maps[id]).map((id) => ({ id, name: MAP_NAME[id] || id }));
}
/** 도시의 포켓몬센터 문 앞 칸 */
export function flySpot(id) {
  const m = DB.maps[id];
  const b = (m.buildings || []).find((x) => x.kind === 'center');
  const d = b && b.doors[0];
  return d ? { x: d.x, y: d.y + 1 } : { x: Math.floor(m.w / 2), y: Math.floor(m.h / 2) };
}
