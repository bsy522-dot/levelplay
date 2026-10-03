/* 세이브 자동 백업 + 세이브 슬롯 관리 (최소 5개)
 *
 * ★왜 이게 필요한가 (2026-10-02 실측)
 *   병석님 태블릿 IM-H031 에서 재현된 진짜 원인:
 *     E rime.pokerededu: == MALI DEBUG === get_native_buffer NOT SUCCESS = 12300
 *     E rime.pokerededu: == MALI DEBUG ===BAD ALLOC from gles_texture_egl_image_get_2d_template
 *   = GPU 텍스처 메모리 할당 실패. Phaser 가 새 맵 캔버스를 GPU 에 올리다 실패하고,
 *     그 사이 검은 .fade 덮개가 켜진 채 남는다(=병석님이 본 '꺼먼 화면').
 *   태블릿 메모리가 8GB 총/남은 400MB 여유였고, 큰 맵 캔버스가 자꾸 새로 만들어진다.
 *
 * ★절대 규칙(병석님 지시)
 *   1) 기존 세이브(pokered_edu_save_v1)를 절대 지우지 않는다.
 *   2) '새로 시작'을 누르면 기존 기록이 사라진다 → 슬롯으로 격리한다.
 *   3) 최소 5개 슬롯. 어느 슬롯이든 로드 가능.
 *   4) 자동 백업: 저장할 때마다 이전 사본을 남긴다.
 *
 * 저장 위치 (기존과 다른 곳 = 기존 세이브를 절대 건드리지 않는다)
 *   v1 슬롯(정본)   : 'pokered_edu_save_v1'        ← 기존 키 그대로. 이 이름은 안 바꾼다.
 *   슬롯 2~5        : 'pokered_edu_slot_2' … '_slot_5'
 *   자동 백업 사본  : 'pokered_edu_backup_<n>'     (회전, 최대 5개)
 *
 * ★마이그레이션 규칙
 *   - 앱이 처음 실행되면 기존 'pokered_edu_save_v1' 을 절대 덮어쓰지 않고,
 *     그 내용을 슬롯 1 사본으로만 함께 등록한다(가상 슬롯 1).
 *   - 이후에도 v1 키는 '지금 플레이 중인 슬롯' 포인터로만 쓰지 않는다.
 *     v1 은 '슬롯1 = 처음 게임' 의미로 고정하고, 활성 슬롯은 새 키로 관리한다.
 */
import { G, newState } from './state.js';

const V1_KEY = 'pokered_edu_save_v1';   /* ★기존 키. 절대 삭제/덮어쓰기 금지 */
const SLOT_KEY = (n) => 'pokered_edu_slot_' + n;
const BK_KEY = (i) => 'pokered_edu_backup_' + i;
const META_KEY = 'pokered_edu_slots_v1';
const ACTIVE_KEY = 'pokered_edu_active_slot';
export const SLOT_COUNT = 5;
const MAX_BACKUPS = 5;

const read = (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
const drop = (k) => { try { localStorage.removeItem(k); return true; } catch (e) { return false; } };

/* ── 메타(슬롯 목록) ── */
function meta() {
  const m = read(META_KEY);
  if (m && Array.isArray(m.slots)) return m;
  /* 처음 실행: 기존 v1 이 있으면 '슬롯1(첫 모험)' 로 등록한다.
   * v1 자체는 건드리지 않는다. */
  const v1 = read(V1_KEY);
  const slots = [];
  if (v1) {
    slots.push({
      n: 1,
      name: (v1.name ? v1.name : '주인공') + ' · 처음 모험',
      map: v1.map, x: v1.x, y: v1.y,
      badges: (v1.badges || []).length,
      party: (v1.party || []).length,
      created: v1.started || Date.now(),
      saved: Date.now(),
      protected: true,   /* ★이 슬롯은 실수로 지워지지 않는다 */
    });
  }
  const fresh = { v: 1, slots, next: v1 ? 2 : 1 };
  write(META_KEY, fresh);
  return fresh;
}
const saveMeta = (m) => write(META_KEY, m);

/* ── 슬롯 목록(읽기) ──
 * ★2026-10-02 수정. 예전에는 meta.slots 에 등록된 것만 나열했다.
 *   그 결과 저장 데이터가 이미 있는 슬롯(예: slot_2)이 화면에 안 보였다.
 *   → meta 에 없어도 '데이터가 있으면' 전부 1~5칸을 보여 준다. */
export function listSlots() {
  const m = meta();
  const known = new Map(m.slots.map((s) => [s.n, s]));
  const out = [];
  for (let n = 1; n <= SLOT_COUNT; n++) {
    const cur = read(keyOf(n));
    const s = known.get(n) || {};
    /* 데이터가 있는데 meta 에 없으면(=예전 판에서 저장된 것) 지금 등록한다 */
    if (cur && !known.has(n)) {
      m.slots.push({
        n, name: (cur.name || '주인공'), map: cur.map, x: cur.x, y: cur.y,
        badges: (cur.badges || []).length, party: (cur.party || []).length,
        created: cur.started || Date.now(), saved: cur._savedAt || Date.now(),
      });
    }
    out.push({
      ...s,
      n,
      exists: !!cur,
      protected: !!s.protected,
      name: s.name || (cur ? (cur.name || '주인공') : ''),
      map: cur ? cur.map : s.map,
      x: cur ? cur.x : s.x, y: cur ? cur.y : s.y,
      party: cur ? (cur.party || []).length : 0,
      badges: cur ? (cur.badges || []).length : 0,
      money: cur ? cur.money : 0,
      saved: cur ? (cur._savedAt || s.saved) : s.saved,
      summary: cur ? summarize(cur) : '(빈 슬롯)',
    });
  }
  if (m.slots.length !== known.size) saveMeta(m);
  return out;
}

function summarize(s) {
  const bits = [];
  const city = { PalletTown: '태초마을', ViridianCity: '상록시티', PewterCity: '회색시티',
    CeruleanCity: '블루시티', VermilionCity: '갈색시티', MtMoon1F: '달맞이산' };
  bits.push(city[s.map] || s.map);
  if ((s.badges || []).length) bits.push('배지 ' + s.badges.length);
  if ((s.party || []).length) bits.push('포켓몬 ' + s.party.length);
  if (s.flags && s.flags.badge1) bits.push('웅 승리');
  return bits.join(' · ');
}

const keyOf = (n) => (n === 1 ? V1_KEY : SLOT_KEY(n));

/* ── 저장(현재 G.s 를 슬롯 n 에) ──
 * ★기존 동작을 그대로 유지: 슬롯 1 이 기본값이고 v1 키에 쓴다. */
export function saveToSlot(n, label) {
  if (!G.s) return { ok: false, msg: '저장할 진행이 없습니다.' };
  const s = JSON.parse(JSON.stringify(G.s));
  s._savedAt = Date.now();
  s._slot = n;

  /* 자동 백업: 지금 이 슬롯에 저장돼 있던 이전 판을 회전시킨다 */
  rotateBackup(n);

  const ok = write(keyOf(n), s);
  if (!ok) return { ok: false, msg: '저장 공간이 부족합니다. (기기의 저장 용량을 확인하세요)' };

  const m = meta();
  const found = m.slots.find((x) => x.n === n);
  const info = {
    n,
    name: s.name + (label ? ' · ' + label : ''),
    map: s.map, x: s.x, y: s.y,
    badges: (s.badges || []).length,
    party: (s.party || []).length,
    created: found ? found.created : Date.now(),
    saved: s._savedAt,
    protected: found ? !!found.protected : false,
  };
  if (found) Object.assign(found, info); else m.slots.push(info);
  m.next = Math.max(m.next, n + 1);
  saveMeta(m);
  write(ACTIVE_KEY, String(n));
  return { ok: true, slot: n, msg: '슬롯 ' + n + ' 저장 완료' };
}

/* ── 자동 백업 회전 ──
 * 지금 슬롯에 저장돼 있던 '이전 판' 을 백업 슬롯으로 옮긴다. */
function rotateBackup(n) {
  const prev = read(keyOf(n));
  if (!prev) return;
  /* 백업 번호 결정: 이 슬롯 전용으로 1~MAX_BACKUPS */
  for (let i = MAX_BACKUPS; i >= 2; i--) {
    const src = read(BK_KEY(i - 1));
    if (src) write(BK_KEY(i), src);
  }
  write(BK_KEY(1), prev);
}

/* ── 백업 목록 ── */
export function listBackups(n) {
  const out = [];
  for (let i = 1; i <= MAX_BACKUPS; i++) {
    const b = read(BK_KEY(i));
    if (b) out.push({ i, at: b._savedAt || 0, map: b.map, x: b.x, y: b.y,
      party: (b.party || []).length, badges: (b.badges || []).length, summary: summarize(b) });
  }
  return out;
}

/* ── 슬롯 복원(백업에서 되돌리기) ── */
export function restoreBackup(i, toSlot) {
  const b = read(BK_KEY(i));
  if (!b) return { ok: false, msg: '백업 ' + i + ' 이 없습니다.' };
  const n = toSlot || activeSlot();
  const ok = write(keyOf(n), b);
  if (!ok) return { ok: false, msg: '복원 실패(저장 공간 부족)' };
  const m = meta();
  const found = m.slots.find((x) => x.n === n);
  if (found) { found.map = b.map; found.x = b.x; found.y = b.y; found.saved = Date.now(); }
  saveMeta(m);
  return { ok: true, msg: '백업 ' + i + ' 을 슬롯 ' + n + ' 으로 복원했습니다.' };
}

/* ── 활성 슬롯 ── */
export function activeSlot() {
  const v = read(ACTIVE_KEY);
  const n = v ? parseInt(v, 10) : 1;
  return Number.isFinite(n) && n >= 1 && n <= SLOT_COUNT ? n : 1;
}
export function setActiveSlot(n) { write(ACTIVE_KEY, String(n)); return n; }

/* ── 슬롯으로 로드 ── */
export function loadSlot(n) {
  const s = read(keyOf(n));
  if (!s) return { ok: false, msg: '슬롯 ' + n + ' 은 비어 있습니다.' };
  return { ok: true, state: s, msg: '슬롯 ' + n + ' 을 불러옵니다.' };
}

/* ── 새 슬롯 만들기 ──
 * ★빈 슬롯. 기존 슬롯은 절대 건드리지 않는다. */
export function createSlot() {
  const m = meta();
  const used = new Set(m.slots.map((s) => s.n));
  for (let n = 1; n <= SLOT_COUNT; n++) {
    if (!used.has(n) && !read(keyOf(n))) {
      m.slots.push({ n, name: '빈 모험 ' + n, map: '', x: 0, y: 0, badges: 0, party: 0,
        created: Date.now(), saved: Date.now(), empty: true });
      saveMeta(m);
      return { ok: true, slot: n, msg: '슬롯 ' + n + ' 을 만들었습니다.' };
    }
  }
  return { ok: false, msg: '슬롯이 모두 찼습니다(' + SLOT_COUNT + '개). 빈 슬롯을 지우고 다시 쓰세요.' };
}

/* ── 슬롯 지우기 ──
 * ★절대 지워지지 않는 두 가지를 막는다.
 *   - 'protected' 슬롯(최초의 모험)
 *   - 가장 최근에 플레이한 슬롯이 1개뿐이면 마지막 보호막
 * 삭제 전 반드시 confirm 을 받는 것이 호출자 책임. */
export function canDeleteSlot(n) {
  const m = meta();
  const s = m.slots.find((x) => x.n === n);
  if (s && s.protected) return { ok: false, msg: '슬롯 1(처음 모험)은 보호되어 지울 수 없습니다.' };
  if (activeSlot() === n) return { ok: false, msg: '지금 플레이 중인 슬롯은 지울 수 없습니다. 다른 슬롯으로 먼저 옮기세요.' };
  return { ok: true };
}
export function deleteSlot(n) {
  const chk = canDeleteSlot(n);
  if (!chk.ok) return chk;
  drop(keyOf(n));
  const m = meta();
  m.slots = m.slots.filter((x) => x.n !== n);
  saveMeta(m);
  return { ok: true, msg: '슬롯 ' + n + ' 을 지웠습니다. (백업 사본은 남습니다)' };
}

/* ── 진단: 세이브 실물이 다 sane 한지 (읽기 전용) ── */
export function audit() {
  const out = [];
  const v1 = read(V1_KEY);
  out.push({
    key: V1_KEY, exists: !!v1,
    map: v1 && v1.map, x: v1 && v1.x, y: v1 && v1.y,
    party: v1 ? (v1.party || []).length : 0,
    badges: v1 ? (v1.badges || []).length : 0,
  });
  for (let n = 1; n <= SLOT_COUNT; n++) {
    const s = read(keyOf(n));
    if (!s) continue;
    const okShape = s && typeof s.map === 'string' && Array.isArray(s.party) && !!s.flags && !!s.dex;
    out.push({ key: keyOf(n), exists: true, sane: okShape, map: s.map, x: s.x, y: s.y,
      party: (s.party || []).length, badges: (s.badges || []).length });
  }
  const bk = [];
  for (let i = 1; i <= MAX_BACKUPS; i++) if (read(BK_KEY(i))) bk.push(i);
  return { slots: out, backups: bk, active: activeSlot(), v1Intact: !!v1 && Array.isArray(v1.party) };
}

/* ── 지우를 밖으로 보내기 (2026-10-02 병석님 지시) ──
 *
 * ★목적: 포켓몬센터 안에 갇혀서 밖으로 못 나가는 것을 해결.
 *   세이브 속 좌표(map/x/y) 세 개만 안전한 바깥 길로 바꾼다.
 *   ★포켓몬·배지·도감·금화·깃발은 절대 건드리지 않는다.
 *
 * ★왜 앱 대신 서버 코드로 하는가:
 *   태블릿에 설치된 APK 는 Cordova 껍데기라 run-as 가 막혀 있다(1.0.0 은 debuggable 아님).
 *   앱 데이터에 손대면 세이브가 위험하다. 서버 코드로 하면 앱 데이터는 그대로고
 *   localStorage 를 정상 경로로만 쓴다.
 *
 * ★먼저 자동 백업을 돌린다. 혹시 좌표가 또 어긋나도 이전 판으로 돌아갈 수 있다. */
/* ★2026-10-03 병석님 정정: "슬롯1에 아림을 밖으로 나오게 하라고, 다른 건 변경 말고"
 *   실제로 원하신 것:
 *     - 슬롯 1(아림, 포켓몬 6마리, 배지 1개) 은 원본이므로 절대 건드리지 않는다.
 *     - 그 세이브를 복사해 슬롯 2 에 다른 이름으로 저장한다.
 *     - 복사본만 위치를 밖으로 바꾼다.
 *   → 슬롯 지정 버전 (moveSlotOutside) 을 새로 만들고, 이 함수는 그대로 둔다. */
export function moveSlotOutside(n, mapId, x, y, newName, label) {
  const src = read(keyOf(n));
  if (!src) return { ok: false, msg: '슬롯 ' + n + ' 에 세이브가 없습니다.' };

  /* 대상 슬롯: 비어 있으면 그 칸, 아니면 다음 빈 칸 */
  let target = null;
  for (let i = 1; i <= SLOT_COUNT; i++) {
    if (i === n) continue;
    if (!read(keyOf(i))) { target = i; break; }
  }
  if (target === null) return { ok: false, msg: '빈 슬롯이 없습니다. 먼저 슬롯 하나를 지우세요.' };

  /* 복사 → 좌표만 바꾼다. 나머지(포켓몬·배지·금화·도감)는 100% 동일 */
  const copy = JSON.parse(JSON.stringify(src));
  copy.map = mapId; copy.x = x; copy.y = y; copy.facing = 'down';
  if (newName) copy.name = newName;
  copy.started = Date.now();
  copy._copiedFrom = n;

  rotateBackup(target);
  write(keyOf(target), copy);

  return {
    ok: true, slot: target, msg:
      `슬롯 ${n} 을 슬롯 ${target} 으로 복사하고, 복사본만 ${label || '길'} 로 보냈습니다. 원본 슬롯 ${n} 은 그대로입니다.`,
  };
}

/* ── 이미 설치된 기기의 세이브 지키기 (2026-10-03, 병석님: "잡은 포켓몬·레벨·마을 위치는 계속 보존") ──
 * 예전 버그: 슬롯 2~5를 골라 놀아도 저장은 항상 슬롯 1 자리(v1 키)에 들어갔다.
 *   → 그런 기기에서는 최신 진행이 v1 키에 있고, 슬롯 n 은 복사했을 때 그대로 멈춰 있다.
 * 이제 저장은 지금 노는 슬롯에 들어가므로, 켜질 때 한 번 최신 진행을 그 슬롯에 옮겨 담는다.
 *   조건: 지금 노는 슬롯이 2~5 이고, v1 과 그 슬롯이 같은 모험(started 같음)이며, v1 이 더 오래 놀았을 때.
 *   v1 은 건드리지 않고, 슬롯 n 의 이전 판은 백업 칸으로 돌린다 → 지워지는 것은 없다. */
export function repairMisSaved() {
  const n = activeSlot();
  if (n < 2) return { ok: true, changed: false };
  const v1 = read(V1_KEY), sn = read(keyOf(n));
  if (!v1 || !sn) return { ok: true, changed: false };
  if (!v1.started || v1.started !== sn.started) return { ok: true, changed: false };
  if ((v1.playMs || 0) <= (sn.playMs || 0)) return { ok: true, changed: false };
  rotateBackup(n);
  const fixed = JSON.parse(JSON.stringify(v1));
  fixed._slot = n;
  fixed._repairedAt = Date.now();
  write(keyOf(n), fixed);
  return { ok: true, changed: true, slot: n };
}

export function moveOutsideTo(mapId, x, y, label) {
  const changed = [];
  for (let n = 1; n <= SLOT_COUNT; n++) {
    const k = keyOf(n);
    const s = read(k);
    if (!s) continue;
    if (s.map === mapId && s.x === x && s.y === y) continue;   /* 이미 밖이면 손대지 않는다 */
    /* ① 먼저 백업 (회전). rotateBackup(n) 이 슬롯 n 의 백업 사본을 한 칸 물린다. */
    rotateBackup(n);
    /* ② 좌표만 교체. 나머지 필드는 그대로 복사한다. */
    s.map = mapId; s.x = x; s.y = y; s.facing = 'down';
    if (label && !s._movedLabel) s._movedLabel = label;
    write(k, s);
    changed.push({ slot: n, from: null, to: `${mapId}(${x},${y})` });
  }
  return { ok: changed.length > 0 || true, changed, msg: changed.length
    ? `지우를 ${label || '안전한 바깥 길'} 로 보냈습니다.`
    : '이미 바깥에 있습니다. (변경 없음)' };
}
