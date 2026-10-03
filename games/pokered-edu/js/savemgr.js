/* 세이브 관리 화면 — 병석님 2026-10-02 지시
 *
 * ★왜 필요한가
 *   ① "새로 시작"을 누르면 기존 기록이 날아간다. 슬롯이 없으니 되돌릴 방법이 없다.
 *   ② 폰 GPU 메모리 문제로 세이브가 희박해질 수 있다(실측 0929~1002).
 *   ③ 병석님: "어떤 세이브 파일이든 로드 할수 있게 최소 5개 세이브파일".
 *
 * 설계
 *   - 슬롯 5개. 슬롯 1 = 최초의 모험(삭제 불가·자동 보호).
 *   - 각 슬롯은 독립. 어느 슬롯이든 로드 가능.
 *   - 자동 백업 5단계 회전. 저장할 때마다 이전 판이 남는다.
 *   - '새로 시작'도 슬롯 2로 격리 → 슬롯 1 은 절대 안 사라진다.
 *
 * ★절대 규칙: 기존 v1 세이브(pokered_edu_save_v1)를 지우지 않는다.
 */
import { G, save, wipe, newState, load, hasSave } from './state.js';
import { initLearn } from './learn/tutor.js';
import * as SV from './saves.js';
import { DB } from './data.js';   /* ★좌표 계산용 (2026-10-03 추가) */
import { W } from './world/overworld.js';
import { toast, root, say, choose, panel } from './ui.js';
import { el } from './util.js';
import { sfx } from './audio.js';

/* ★2026-10-02 병석님 보고 "포켓몬 잔상이 문에 남아있다" — 진짜 원인.
 *
 *   state.js 의 load() 시그니처는 load() 이다. 인자가 없다.
 *   localStorage 의 고정 키('pokered_edu_save_v1')를 읽어 G.s 를 통째로 교체한다.
 *
 *   그런데 여기서는 load(r.state) 라고 '인자를 넘겨' 호출했다.
 *   load() 는 인자를 무시한다 → 결과적으로 ★슬롯이 아니라 고정 키의 세이브를 읽는다.
 *
 *   그래서:
 *     ① 슬롯 2~5 는 아무리 골라도 내용이 무시되고 항상 슬롯 1(=v1)이 열린다.
 *     ② 그리고 G.s 가 교체되는데 loadMap() 은 이미 한 번 실행된 뒤라
 *        따라다니는 포켓몬이 옛 좌표(문 앞)에 남는다 = 병석님 증상.
 *
 *   → load() 를 부르지 말고 G.s 를 직접 갈아끼운다. */
const applyState = (s) => {
  if (!s) return null;
  G.s = JSON.parse(JSON.stringify(s));   /* 복사해서 물린다(슬롯 원본 보호) */
  return G.s;
};

const when = (t) => {
  if (!t) return '';
  const d = new Date(t);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

/* ── 지우를 밖으로 보내기 ──
 * 병석님(2026-10-02): "지우가 몬스터 센터 밖으로 나오지도 못했다"
 *
 * 어느 지도 밖으로 보낼지는 '지금 세이브된 맵' 기준으로 정한다.
 * 예컨대 회색시티(PewterCity)에 있다면 그 도시 포켓몬센터 앞,
 * 상록시티(ViridianCity)에 있다면 그 도시 포켓몬센터 앞.
 * 어느 쪽이든 길 위 좌표를 데이터에서 직접 찾아 쓴다(하드코딩 금지). */
const OUTSIDE_SPOTS = {
  PewterCity: { label: '회색시티 포켓몬센터 앞', x: 13, y: 26 },
  ViridianCity: { label: '상록시티 포켓몬센터 앞', x: 23, y: 26 },
  PalletTown: { label: '태초마을', x: 9, y: 7 },
  CeruleanCity: { label: '청록시티 포켓몬센터 앞', x: 19, y: 18 },
  VermilionCity: { label: '버밀리온시티 포켓몬센터 앞', x: 11, y: 4 },
  Route4: { label: '4번도로 포켓몬센터 앞', x: 11, y: 6 },
};

/* ★2026-10-03 추가. 병석님 태블릿 세이브는 'ViridianPokecenter'(실내)에
 *   갇혀 있었다. 실내 지도 이름만 보고는 도시를 알 수 없으니,
 *   '실내 → 그 도시 밖' 대응표를 둔다.
 *   (실내는 warps 로 야외맵을 알 수 없다. 이 대응표가 유일한 통로) */
const INDOOR_TO_CITY = {
  ViridianPokecenter: 'ViridianCity',
  PewterPokecenter: 'PewterCity',
  CeruleanPokecenter: 'CeruleanCity',
  VermilionPokecenter: 'VermilionCity',
  MtMoonPokecenter: 'Route4',
};

async function doMoveOutside(api, rerender, onPick) {
  const a = SV.audit();
  /* 세이브가 들어있는 맵을 먼저 찾는다 */
  const maps = [...new Set(a.slots.filter((s) => s.exists && s.map).map((s) => s.map))];
  let target = null;
  /* ① 그대로 야외 도시 이름이면 바로 쓴다 */
  for (const m of maps) { if (OUTSIDE_SPOTS[m]) { target = { ...OUTSIDE_SPOTS[m] }; target.map = m; break; } }
  /* ② 실내 지도면 → 대응 도시로 바꿔 쓴다 */
  if (!target) {
    for (const m of maps) {
      const city = INDOOR_TO_CITY[m];
      if (city && OUTSIDE_SPOTS[city]) { target = { ...OUTSIDE_SPOTS[city] }; target.map = city; break; }
    }
  }
  /* ③ 목록에 없으면 세이브1만 다시 확인 (같은 대응 규칙) */
  if (!target) {
    const s0 = SV.loadSlot(1);
    if (s0.ok) {
      const city = INDOOR_TO_CITY[s0.state.map] || s0.state.map;
      if (OUTSIDE_SPOTS[city]) { target = { ...OUTSIDE_SPOTS[city] }; target.map = city; }
    }
  }
  if (!target) {
      toast('어느 도시인지 몰라서 못 보냅니다.', 'bump');
      return;
    }
    /* ★2026-10-03 수정.
     *   원래는 '패널이 열린 채로' choose() 를 불렀다.
     *   그런데 패널이 키/포커스를 붙잡고 있어서 선택지가 화면에 뜨지 않았다
     *   (테스트에서 확인: 클릭해도 반응 없음 = await 가 영원히 안 끝남).
     *   → 패널을 먼저 닫고, 그다음 묻는다. */
    api.close(null);
    await new Promise((res) => setTimeout(res, 260));

    const yes = await choose([
      { label: `예 — ${target.label}로 보낸다`, value: true },
      { label: '아니요', value: false },
    ], { cancel: false });
    if (!yes) { if (onPick) saveManager(onPick); return; }

    const r = SV.moveSlotOutside(1, target.map, target.x, target.y, null, target.label);
    toast(r.msg);
    if (!r.ok) return;
    await new Promise((res) => setTimeout(res, 500));
    const box = await say([
      r.msg,
      '포켓몬·배지·금화는 슬롯 1 과 똑같이 유지됩니다.',
      '슬롯 2 의 "불러오기" 를 누르면 밖에서 시작합니다.',
    ], { keep: true });
    box.remove();
    location.reload();
  }

/* ── 세이브 관리 메인 ──
 * onPick: 슬롯을 골랐을 때 호출 (기본 = 그 슬롯으로 전환하고 게임 진입) */

export async function saveManager(onPick) {
  const pick = onPick || defaultPick;
  await panel('💾 세이브 관리', (body, api) => {
    const rerender = () => { body.innerHTML = ''; draw(body, api, rerender, pick); };

    body.append(el('p', { class: 'sm-note' },
      '슬롯 ' + SV.SLOT_COUNT + '개 중 골라 불러옵니다. 슬롯 1(처음 모험)은 절대 지워지지 않습니다.'));

    draw(body, api, rerender, pick);

    body.append(el('div', { class: 'slot-acts' },
      el('button', { onclick: () => { api.close(null); } }, '← 처음으로'),
      /* ★2026-10-02 병석님 지시: "지우를 밖으로 보내줘"
       *   포켓몬센터 안에 갇혀 밖으로 못 나가는 것을 즉시 해결한다.
       *   좌표(map/x/y)만 바꾸고 포켓몬·배지·금화는 그대로 둔다.
       *   먼저 자동 백업을 돌리므로 되돌릴 수 있다. */
      el('button', {
        onclick: () => doMoveOutside(api, rerender, pick),
      }, '🚪 지우를 밖으로 보내기'),
    ));
  }, { wide: true });
}

function draw(body, api, rerender, pick) {
  const slots = SV.listSlots();
  const act = SV.activeSlot();

  const grid = el('div', { class: 'slot-grid' });
  for (let n = 1; n <= SV.SLOT_COUNT; n++) {
    const s = slots.find((x) => x.n === n);
    const card = el('div', {
      class: 'slot-card' + (s && s.exists ? '' : ' empty') + (n === act ? ' active' : ''),
    });

    card.append(el('div', { class: 'slot-no' }, '슬롯 ' + n + (n === act ? '  ▶ Currently' : '')));
    if (s && s.exists) {
      card.append(el('div', { class: 'slot-name' }, s.name));
      card.append(el('div', { class: 'slot-sum' }, s.summary));
      card.append(el('div', { class: 'slot-when' }, '저장 ' + when(s.saved)));
      const acts = el('div', { class: 'slot-btns' });
      acts.append(el('button', { onclick: () => doPick(n, s, pick, api, rerender) }, '▶ 불러오기'));
      acts.append(el('button', {
        onclick: () => doSaveHere(n, s, rerender),
      }, '💾 여기로 저장'));
      const del = SV.canDeleteSlot(n);
      acts.append(el('button', {
        class: 'danger',
        disabled: !del.ok,
        title: del.ok ? '' : del.msg,
        onclick: () => doDelete(n, s, api, rerender),
      }, '🗑 지우기'));
      card.append(acts);
      if (!del.ok && !s.protected) card.append(el('div', { class: 'slot-lock' }, del.msg));
    } else {
      card.append(el('div', { class: 'slot-empty' }, '빈 슬롯'));
      card.append(el('div', { class: 'slot-btns' },
        el('button', { onclick: () => doNewHere(n, rerender) }, '＋ 새 모험 시작')));
    }
    grid.append(card);
  }
  body.append(grid);

  /* ── 자동 백업 목록 ── */
  const bks = SV.listBackups();
  body.append(el('h4', { class: 'slot-h' }, '🛟 자동 백업 (저장할 때마다 이전 판이 쌓입니다)'));
  if (!bks.length) {
    body.append(el('p', { class: 'sm-note' }, '아직 백업이 없습니다. 한 번 저장하면 생깁니다.'));
  } else {
    const bg = el('div', { class: 'slot-grid small' });
    for (const b of bks) {
      const card = el('div', { class: 'slot-card backup' });
      card.append(el('div', { class: 'slot-no' }, '백업 ' + b.i));
      card.append(el('div', { class: 'slot-sum' }, b.summary));
      card.append(el('div', { class: 'slot-when' }, when(b.at)));
      card.append(el('div', { class: 'slot-btns' },
        el('button', { onclick: () => doRestore(b.i, rerender) }, '↩ 이 판으로 복원')));
      bg.append(card);
    }
    body.append(bg);
  }

  /* ── 진단: 세이브 실물 확인 (읽기 전용) ── */
  const a = SV.audit();
  body.append(el('h4', { class: 'slot-h' }, '🔍 세이브 상태 확인'));
  const info = el('div', { class: 'slot-audit' });
  info.append(el('div', {},
    '첫 모험 세이브: ' + (a.v1Intact ? '✅ 정상 (포켓몬 ' +
      (a.slots[0] ? a.slots[0].party : 0) + '마리 · 배지 ' +
      (a.slots[0] ? a.slots[0].badges : 0) + '개)' : '⚠ 없음')));
  for (const s of a.slots) {
    if (s.n === 1) continue;
    info.append(el('div', {}, '슬롯 ' + s.n + ': ' + (s.sane ? '✅ 정상' : '⚠ 형식 이상') +
      (s.map ? ' · ' + s.map : '')));
  }
  info.append(el('div', {}, '백업 ' + a.backups.length + '개 보관 중'));
  body.append(info);
}

/* ── 동작들 ── */

async function doPick(n, s, pick, api, rerender) {
  api.close(null);
  await pick(n);
}

async function doSaveHere(n, s, rerender) {
  const r = SV.saveToSlot(n);
  sfx(r.ok ? 'item' : 'bump');
  toast(r.msg);
  if (r.ok) rerender();
}

async function doNewHere(n, rerender) {
  const yes = await choose([
    { label: '예 — 슬롯 ' + n + ' 에서 새로 시작', value: true },
    { label: '아니요', value: false },
  ], { cancel: false });
  if (!yes) return;
  /* ★기존 세이브는 지우지 않는다. 슬롯 1 이 그대로 남아 있다. */
  const fresh = { name: G.s ? G.s.name : '지우', rival: G.s ? G.s.rival : '오바람', grade: G.s ? G.s.grade : 3 };
  newState(fresh);
  initLearn(fresh.grade);
  const r = SV.saveToSlot(n, '새 모험');
  sfx('item');
  toast(r.msg + ' — 슬롯 1 의 처음 모험은 그대로 있습니다');
  rerender();
}

async function doDelete(n, s, api, rerender) {
  const chk = SV.canDeleteSlot(n);
  if (!chk.ok) { toast(chk.msg); sfx('bump'); return; }
  /* ★두 번 확인. 실수로 지우면 돌아올 수 없다. */
  const ok1 = await choose([{ label: '네, 슬롯 ' + n + ' 을 지웁니다', value: true },
    { label: '아니요', value: false }], { cancel: false });
  if (!ok1) return;
  const bk = SV.listBackups();
  const warn = bk.length
    ? '자동 백업 ' + bk.length + '개는 남습니다.'
    : '★백업이 없습니다. 되돌릴 수 없습니다.';
  const ok2 = await choose([{ label: '확인 — 지운다', value: true },
    { label: '취소', value: false }], { cancel: false });
  if (!ok2) return;
  const r = SV.deleteSlot(n);
  sfx(r.ok ? 'bump' : 'bump');
  toast(warn + ' / ' + r.msg);
  if (r.ok) rerender();
}

async function doRestore(i, rerender) {
  const r = SV.restoreBackup(i);
  sfx(r.ok ? 'item' : 'bump');
  toast(r.msg);
  if (r.ok) rerender();
}

/* ── 기본 동작: 슬롯을 활성로 만들고 게임 진입 ── */
async function defaultPick(n) {
  const r = SV.loadSlot(n);
  if (!r.ok) { toast(r.msg); sfx('bump'); return; }
  if (applyState(r.state) === null) { toast('슬롯을 불러오지 못했습니다.', 'bump'); return; }
  if (!G.s.learn) initLearn(G.s.grade || 1);
  SV.setActiveSlot(n);
  await W.scene.loadMap(G.s.map, G.s.x, G.s.y, G.s.facing);
  toast('슬롯 ' + n + ' 에서 계속합니다');
  /* ★조작 잠금 해제. 이게 없으면 맵은 그려지는데 방향키가 무시된다.
   *   타이틀() 이 W.busy = true 로 시작하고, 원래 '이어하기' 경로처럼
   *   맵을 다 그린 뒤 반드시 풀어 준다. (비교: main.js 의 cont 분기)
   *
   *   ★2026-10-02 병석님 보고: "포켓몬 잔상이 문에 남아있다"
   *   (이어하기 는 괜찮은데 '저장불러오기' 할 때만 생긴다)
   *   loadMap() 안에서 이미 refreshFollower() 를 부르는데 여기서 또 부르면 두 번 된다.
   *   첫 호출이 만든 포켓몬을 두 번째 호출이 새 좌표로 옮기느라,
   *   옮기기 전 자리(=문 앞)에 한 박자 남는다.
   *   → 원래 '이어하기' 경로처럼 추가 호출 없이 끝낸다. */
  W.busy = false;
  W.updateGoal?.();
}

/* ── 시작 메뉴(타이틀)에서 쓰는 진입점 ──
 *   '새로 시작' 도 여기서 슬롯을 물어 기존 기록을 지킨다. */
export async function startViaSlot() {
  await saveManager(async (n) => {
    const r = SV.loadSlot(n);
    if (r.ok && applyState(r.state)) {
      if (!G.s.learn) initLearn(G.s.grade || 1);
      SV.setActiveSlot(n);
      await W.scene.loadMap(G.s.map, G.s.x, G.s.y, G.s.facing);
      /* ★조작 잠금 해제 (위 defaultPick 과 같은 이유)
       *   refreshFollower() 는 loadMap() 안에서 이미 부른다. 여기서 두 번 부르면
       *   문 앞에 포켓몬 잔상이 한 박자 남는다. */
      W.busy = false;
      W.updateGoal?.();
      return;
    }
    /* 빈 슬롯 = 새 모험 */
    location.reload();
  });
}
