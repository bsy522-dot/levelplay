/* 메뉴 화면: 시작 메뉴, 포켓몬, 도감, 가방, 상점, 보관함, 공부 기록, 연습 문제, 1차 완료 */
import { DB, ITEMS, sp, monArt, MAP_NAME } from './data.js';
import { G, save, addItem, maxHp, healParty } from './state.js';
import { el, josa, typeTag, TYPE_KO } from './util.js';
import { choose, panel, listNav, say, ask, toast, root } from './ui.js';
import { sfx, setMuted, isMuted } from './audio.js';
import * as M from './battle/mech.js';
import { report } from './learn/tutor.js';
import { nextQuestion, record } from './learn/tutor.js';
import { W } from './world/overworld.js';
import { fixJosa } from './learn/math.js';

const caughtN = () => Object.keys(G.s.dex.caught).length;
const seenN = () => Object.keys(G.s.dex.seen).length;

export async function openMenu() {
  if (W.busy) return;
  W.busy = true;
  try {
    let last = 0;
    for (;;) {
      const items = [
        G.s.party.length ? { label: '🔴 포켓몬', value: 'party' } : null,
        G.s.flags.pokedex ? { label: '📕 도감', value: 'dex' } : null,
        { label: '🎒 가방', value: 'bag' },
        { label: '💡 힌트 (다음에 할 일)', value: 'hint' },
        { label: '📒 공부 기록', value: 'report' },
        { label: `👤 ${G.s.name}`, value: 'card' },
        { label: '💾 저장', value: 'save' },
        { label: isMuted() ? '🔇 소리 켜기' : '🔊 소리 끄기', value: 'sound' },
        { label: '✖ 닫기', value: null },
      ].filter(Boolean);
      const box = el('div', { class: 'win menu' });
      const v = await menuPick(box, items, last);
      last = Math.max(0, items.findIndex((i) => i.value === v));
      if (v === null) break;
      if (v === 'party') await partyScreen();
      else if (v === 'dex') await dexScreen();
      else if (v === 'bag') await bagScreen();
      else if (v === 'report') await reportScreen();
      else if (v === 'hint') { W.busy = false; await W.showGoalDetail?.(); W.busy = true; }
      else if (v === 'card') await cardScreen();
      else if (v === 'save') { save(); sfx('item'); toast('저장했어요! 💾'); }
      else if (v === 'sound') { setMuted(!isMuted()); }
    }
  } finally { W.busy = false; W.scene?.refreshFollower?.(); W.updateGoal?.(); }
}

function menuPick(box, items, start) {
  return new Promise((resolve) => {
    let sel = Math.min(start, items.length - 1);
    const btns = items.map((it, i) => el('button', { onclick: () => fin(it.value) }, it.label));
    box.append(...btns); root().append(box);
    const paint = () => btns.forEach((b, i) => b.classList.toggle('sel', i === sel));
    paint();
    const fin = (v) => { pop(); box.remove(); sfx(v === null ? 'cancel' : 'select'); resolve(v); };
    const pop = pushKeys((k) => {
      if (k === 'up') sel = (sel + items.length - 1) % items.length;
      else if (k === 'down') sel = (sel + 1) % items.length;
      else if (k === 'a') { fin(items[sel].value); return; }
      else if (k === 'b' || k === 'menu') { fin(null); return; } else return;
      sfx('select'); paint();
    });
  });
}
import { Input } from './input.js';
const pushKeys = (fn) => Input.push(fn);

/* ── 포켓몬 ── */
function monRow(m, extra) {
  const mx = maxHp(m), r = m.hp / mx;
  return el('div', { class: 'row' }, el('img', { src: monArt(m.sp), alt: '' }),
    el('div', { class: 'grow' },
      el('div', { class: 'jua' }, `${sp(m.sp).name}  Lv${m.lv} `, ...sp(m.sp).types.map(typeTag), m.status ? ` [${M.STATUS_KO[m.status]}]` : '', m.hp <= 0 ? ' (기절)' : ''),
      el('div', { class: 'hp ' + (r > 0.5 ? '' : r > 0.2 ? 'mid' : 'low') }, el('i', { style: { width: Math.max(0, r) * 100 + '%' } })),
      el('div', { class: 'sub' }, `HP ${m.hp}/${mx}`, extra || '')));
}
export async function partyScreen() {
  await panel('내 포켓몬', (body, api) => {
    let swapFrom = null;
    const draw = (start = 0) => {
      body.innerHTML = '';
      const list = el('div', { class: 'list' }); body.append(list);
      if (swapFrom != null) body.prepend(el('div', { class: 'jua', style: { marginBottom: '.5em', color: '#b33' } }, '바꿀 자리를 고르세요'));
      const rows = G.s.party.map((m, i) => ({ node: monRow(m), value: i }));
      api.onKey(listNav(list, rows, async (i) => {
        if (swapFrom != null) {
          const p = G.s.party;[p[swapFrom], p[i]] = [p[i], p[swapFrom]]; swapFrom = null; sfx('select'); draw(i); return;
        }
        const m = G.s.party[i];
        const v = await choose([{ label: '능력 보기', value: 'info' }, { label: '순서 바꾸기', value: 'swap' }, { label: '닫기', value: null }]);
        if (v === 'info') await monInfo(m);
        if (v === 'swap') { swapFrom = i; }
        draw(i);
      }, { start }));
    };
    draw();
  });
}
async function monInfo(m) {
  await panel(`${sp(m.sp).name}  Lv${m.lv}`, (body) => {
    const s = M.stats(m), d = sp(m.sp);
    const next = M.expAt(d.growth, m.lv + 1) - m.exp;
    body.append(el('div', { style: { display: 'flex', gap: '1em', flexWrap: 'wrap', alignItems: 'center' } },
      el('img', { src: monArt(m.sp), style: { width: '9em', height: '9em', objectFit: 'contain' } }),
      el('div', {}, el('div', { class: 'jua' }, `No.${String(d.id).padStart(3, '0')} ${d.name}  `, ...d.types.map(typeTag)),
        el('div', { class: 'sub' }, d.genus),
        el('div', {}, `HP ${m.hp}/${s.hp} · 공격 ${s.atk} · 방어 ${s.def} · 스피드 ${s.spe} · 특수 ${s.spc}`),
        el('div', {}, `다음 레벨까지 경험치 ${Math.max(0, next)}`))),
      el('h3', {}, '기술'),
      el('div', { class: 'list' }, ...m.moves.map((mv) => { const md = DB.moves[mv.id]; return el('div', { class: 'row' }, typeTag(md.type), el('div', { class: 'grow jua' }, md.name), el('div', { class: 'sub' }, `위력 ${md.power || '-'} · PP ${mv.pp}/${md.pp}`)); })));
  });
}

/* ── 도감 ── */
export async function dexScreen() {
  await panel(`포켓몬 도감  ${caughtN()} / 151`, (body, api) => {
    const pct = (caughtN() / 151) * 100;
    body.append(el('div', { class: 'jua' }, `잡은 포켓몬 ${caughtN()}마리 · 만난 포켓몬 ${seenN()}마리`),
      el('div', { class: 'dexbar' }, el('i', { style: { width: pct + '%' } })));
    const grid = el('div', { class: 'dexgrid' }); body.append(grid);
    const rows = DB.species.map((s) => {
      const c = G.s.dex.caught[s.id], v = G.s.dex.seen[s.id];
      return { value: s.id, node: el('div', { class: 'cell ' + (c ? '' : v ? 'seen' : 'unseen') }, el('span', { class: 'no' }, String(s.id).padStart(3, '0')), el('img', { src: monArt(s.id), loading: 'lazy', alt: '' }), el('div', {}, v ? s.name : '???')) };
    });
    let sel = 0;
    rows.forEach((r, i) => { r.node.onclick = () => { sel = i; paint(); dexEntry(r.value); }; grid.append(r.node); });
    const paint = () => rows.forEach((r, i) => { r.node.classList.toggle('sel', i === sel); if (i === sel) r.node.scrollIntoView({ block: 'nearest' }); });
    paint();
    api.onKey((k) => {
      const cols = Math.max(1, Math.round(grid.clientWidth / (rows[0].node.offsetWidth + 6)));
      if (k === 'left') sel = Math.max(0, sel - 1);
      else if (k === 'right') sel = Math.min(rows.length - 1, sel + 1);
      else if (k === 'up') sel = Math.max(0, sel - cols);
      else if (k === 'down') sel = Math.min(rows.length - 1, sel + cols);
      else if (k === 'a') { dexEntry(rows[sel].value); return true; }
      else return false;
      sfx('select'); paint(); return true;
    });
  });
}
async function dexEntry(id) {
  const s = sp(id), c = G.s.dex.caught[id], v = G.s.dex.seen[id];
  await panel(`No.${String(id).padStart(3, '0')} ${v ? s.name : '???'}`, (body) => {
    body.append(el('div', { style: { display: 'flex', gap: '1em', flexWrap: 'wrap', alignItems: 'center' } },
      el('img', { src: monArt(id), style: { width: '10em', height: '10em', objectFit: 'contain', filter: c ? 'none' : v ? 'brightness(0) opacity(.5)' : 'brightness(0) opacity(.15)' } }),
      el('div', { style: { flex: 1, minWidth: '12em' } },
        v ? el('div', { class: 'jua' }, s.genus, ' ', ...s.types.map(typeTag)) : el('div', {}, '아직 만나지 못한 포켓몬이다.'),
        c ? el('div', {}, `키 ${s.height}m · 몸무게 ${s.weight}kg`) : null,
        c ? el('p', { style: { lineHeight: 1.6 } }, s.flavor) : v ? el('p', {}, '잡으면 자세한 정보가 기록된다.') : null)));
  });
}

/* ── 가방 ── */
export async function bagScreen() {
  await panel('가방', (body, api) => {
    const draw = () => {
      body.innerHTML = '';
      body.append(el('div', { class: 'jua', style: { marginBottom: '.5em' } }, `💰 ${G.s.money}원`));
      const ids = Object.keys(G.s.bag).map(Number).filter((id) => G.s.bag[id] > 0 && ITEMS[id]);
      if (!ids.length) { body.append(el('div', {}, '가방이 비어 있다.')); api.onKey(null); return; }
      const list = el('div', { class: 'list' }); body.append(list);
      api.onKey(listNav(list, ids.map((id) => ({ value: id, node: el('div', { class: 'row' }, el('div', { class: 'grow' }, el('div', { class: 'jua' }, `${ITEMS[id].name} ×${G.s.bag[id]}`), el('div', { class: 'sub' }, ITEMS[id].desc))) })), async (id) => {
        const it = ITEMS[id];
        if (it.kind === 'candy') {
          const m = await pickPartyPanel(fixJosa(`${it.name}을(를) 누구에게 먹일까?`));
          if (!m) return;
          addItem(id, -1); sfx('levelup');
          M.applyExp(m, Math.max(1, M.expAt(sp(m.sp).growth, m.lv + 1) - m.exp));
          const learned = sp(m.sp).learn.filter(([l]) => l === m.lv).map(([, mv]) => mv).filter((mv) => DB.moves[mv] && !m.moves.some((x) => x.id === mv));
          for (const mv of learned) if (m.moves.length < 4) m.moves.push({ id: mv, pp: DB.moves[mv].pp });
          await say([fixJosa(`${sp(m.sp).name}의 레벨이 ${m.lv}(으)로 올랐다!`)]);
          draw(); return;
        }
        if (it.kind !== 'heal' && it.kind !== 'cure') { await say([it.desc]); return; }
        const m = await pickPartyPanel(fixJosa(`${it.name}을(를) 누구에게 쓸까?`));
        if (!m) return;
        if (it.kind === 'heal') {
          const mx = maxHp(m);
          if (m.hp <= 0 || m.hp >= mx) { await say(['효과가 없을 것 같다.']); return; }
          const f = m.hp; m.hp = Math.min(mx, m.hp + it.heal); addItem(id, -1); sfx('heal');
          await say([`${sp(m.sp).name}의 HP가 ${m.hp - f} 회복되었다!`]);
        } else {
          if (m.status !== it.cure) { await say(['효과가 없을 것 같다.']); return; }
          m.status = null; addItem(id, -1); sfx('heal'); await say([fixJosa(`${sp(m.sp).name}은(는) 건강해졌다!`)]);
        }
        draw();
      }));
    };
    draw();
  });
}
function pickPartyPanel(title) {
  return panel(title, (body, api) => {
    const list = el('div', { class: 'list' }); body.append(list);
    api.onKey(listNav(list, G.s.party.map((m) => ({ value: m, node: monRow(m) })), (m) => api.close(m)));
  });
}

/* ── 상점 ── */
export async function openShop() {
  const stock = [4, 20, 11, 15, 14, 12];
  await say(['어서 오세요! 필요한 게 있으신가요?'], { who: '점원', face: 'clerk' });
  await panel('프렌들리숍', (body, api) => {
    const draw = () => {
      body.innerHTML = '';
      body.append(el('div', { class: 'jua', style: { marginBottom: '.5em' } }, `💰 가진 돈 ${G.s.money}원`));
      const list = el('div', { class: 'list' }); body.append(list);
      api.onKey(listNav(list, stock.map((id) => ({ value: id, node: el('div', { class: 'row' }, el('div', { class: 'grow' }, el('div', { class: 'jua' }, ITEMS[id].name), el('div', { class: 'sub' }, `${ITEMS[id].desc} (가진 개수 ${G.s.bag[id] || 0})`)), el('div', { class: 'jua' }, `${ITEMS[id].price}원`)) })), async (id) => {
        const it = ITEMS[id];
        const maxN = Math.floor(G.s.money / it.price);
        if (maxN < 1) { await say(['돈이 모자라요!'], { who: '점원', face: 'clerk' }); return; }
        const opts = [1, 3, 5, 10].filter((n) => n <= maxN).map((n) => ({ label: `${n}개 (${n * it.price}원)`, value: n }));
        const n = await choose([...opts, { label: '취소', value: 0 }]);
        if (!n) return;
        G.s.money -= n * it.price; addItem(id, n); sfx('item');
        toast(`${it.name} ${n}개를 샀다!`);
        draw();
      }));
    };
    draw();
  });
  await say(['감사합니다! 또 오세요!'], { who: '점원', face: 'clerk' });
  save();
}

/* ── 보관함 (포켓몬센터 PC) ── */
export async function openBox() {
  await say([`${G.s.name}의 PC에 접속했다.`, '포켓몬 보관함을 열었다.']);
  await panel('포켓몬 보관함', (body, api) => {
    const draw = () => {
      body.innerHTML = '';
      body.append(el('div', { class: 'sub' }, '파티 포켓몬을 누르면 보관함으로, 보관함 포켓몬을 누르면 파티로 옮겨요. (파티는 1~6마리)'));
      body.append(el('h3', {}, `파티 (${G.s.party.length}/6)`));
      const l1 = el('div', { class: 'list' }); body.append(l1);
      body.append(el('h3', {}, `보관함 (${G.s.box.length})`));
      const l2 = el('div', { class: 'list' }); body.append(l2);
      const rows = [
        ...G.s.party.map((m, i) => ({ value: ['p', i], node: monRow(m) })),
        ...G.s.box.map((m, i) => ({ value: ['b', i], node: monRow(m) })),
      ];
      rows.forEach((r, i) => (i < G.s.party.length ? l1 : l2).append(r.node));
      api.onKey(listNav(el('div'), rows, (v) => {
        if (v[0] === 'p') { if (G.s.party.length <= 1) { toast('파티에 한 마리는 있어야 해요!'); return; } G.s.box.push(...G.s.party.splice(v[1], 1)); }
        else { if (G.s.party.length >= 6) { toast('파티가 꽉 찼어요!'); return; } G.s.party.push(...G.s.box.splice(v[1], 1)); }
        sfx('select'); draw();
      }));
      // listNav 가 임시 div 에 붙였으니 다시 원래 목록에 붙인다
      rows.forEach((r, i) => (i < G.s.party.length ? l1 : l2).append(r.node));
    };
    draw();
  });
  save();
}

/* ── 공부 기록 ── */
export async function reportScreen() {
  const r = report();
  await panel('📒 공부 기록', (body) => {
    body.append(el('div', { class: 'report' },
      el('div', { class: 'kpi' },
        el('div', {}, el('b', {}, r.total), '푼 문제'), el('div', {}, el('b', {}, r.acc + '%'), '처음에 맞힌 비율'),
        el('div', {}, el('b', {}, r.best), '최고 연속 정답'), el('div', {}, el('b', {}, r.retryOk), '다시 풀어서 맞힘'),
        el('div', {}, el('b', {}, caughtN()), '잡은 포켓몬')),
      el('p', { class: 'sub', style: { display: 'flex', gap: '1em', flexWrap: 'wrap', alignItems: 'center' } },
        el('span', {}, el('span', { class: 'dot m', style: { display: 'inline-block', width: '.8em', height: '.8em', borderRadius: '50%', background: '#2fae5b', marginRight: '.3em' } }), '익힘'),
        el('span', {}, el('span', { style: { display: 'inline-block', width: '.8em', height: '.8em', borderRadius: '50%', background: '#f2b705', marginRight: '.3em' } }), '복습이 필요해요'),
        el('span', {}, el('span', { style: { display: 'inline-block', width: '.8em', height: '.8em', borderRadius: '50%', background: '#cfd6e6', marginRight: '.3em' } }), '아직')),
      el('h3', {}, `수학 — 지금 배우는 곳: ${r.math[r.fMath].t}`), ...skillRows(r.math, r.fMath),
      el('h3', {}, `과학 — 지금 배우는 곳: ${r.sci[r.fSci].t}`), ...skillRows(r.sci, r.fSci)));
  });
}
function skillRows(rows, f) {
  const placed = rows.filter((x) => x.placed && !x.n).length;
  const head = placed ? [el('div', { class: 'skillrow' }, el('span', { class: 'dot m' }), el('span', { class: 'grow' }, `자격 시험으로 이미 아는 주제 ${placed}개`))] : [];
  return head.concat(rows.filter((x, i) => !(x.placed && !x.n) && (i <= f + 2 || x.n > 0)).map((x) => el('div', { class: 'skillrow', style: x.i === f ? { outline: '2px solid #3b6cd4' } : {} },
    el('span', { class: 'dot ' + (x.weak ? 'w' : x.mastered ? 'm' : '') }),
    el('span', { class: 'grow' }, x.t, x.placed ? ' (시험으로 확인)' : ''),
    el('span', { class: 'sub' }, x.n ? `${x.ok}/${x.n}` : ''))));
}
async function cardScreen() {
  const h = Math.floor((G.s.playMs || 0) / 3600000), mi = Math.floor(((G.s.playMs || 0) % 3600000) / 60000);
  await panel('트레이너 카드', (body) => {
    body.append(el('div', { class: 'report' }, el('div', { class: 'kpi' },
      el('div', {}, el('b', {}, G.s.name), '이름'), el('div', {}, el('b', {}, `${G.s.money}원`), '돈'),
      el('div', {}, el('b', {}, caughtN()), '도감'), el('div', {}, el('b', {}, `${h}시간 ${mi}분`), '플레이 시간'),
      el('div', {}, el('b', {}, G.s.badges.length ? '🪨 회색배지' : '없음'), '배지'))));
  });
}

/* ── 학교 연습 문제 ── */
import { moveQuiz } from './learn/quiz.js';
import { PRACTICE_REWARD, newLesson } from './learn/tutor.js';
export async function practice(n) {
  let ok = 0;
  const lesson = newLesson(); // 연습 문제도 한 주제로: 원리 → 계산 → 응용
  for (let i = 0; i < n; i++) {
    const r = await moveQuiz({ monName: '연습', moveName: `${i + 1}번 문제`, moveType: null, lesson });
    if (r.hit) ok++;
  }
  const prize = ok * PRACTICE_REWARD;
  G.s.money += prize;
  if (ok) sfx('item');
  await say([
    `${n}문제 중 ${ok}문제를 처음에 맞혔어!`,
    ok ? `상금 ${prize}원을 받았다!` : '괜찮아, 틀린 문제에서 배운 게 제일 커!',
  ], { who: '선생님', face: 'coolf' });
  save();
}

/* ── 1차 완료 ── */
export async function chapterEnd(n = 1) {
  const r = report();
  const msg = n === 1 ? ['축하해! 🎉 회색배지를 땄구나!', '다음 모험은 회색시티 동쪽 3번도로에서 시작이야. 달맞이산을 지나 블루시티로 가 보자!']
    : ['축하해! 🎉 블루배지까지 땄구나!', `${n}판 모험을 모두 마쳤어! 다음 판은 곧 열린단다.`, '그동안 도감을 채우고, 문제를 더 풀어서 포켓몬을 키워 보자!'];
  await say(msg, { who: '오박사', face: 'oak' });
  await panel(`🏅 ${n}판 모험 완료!`, (body) => {
    body.append(el('div', { class: 'report' },
      el('div', { class: 'kpi' },
        el('div', {}, el('b', {}, r.total), '푼 문제'), el('div', {}, el('b', {}, r.acc + '%'), '처음에 맞힌 비율'),
        el('div', {}, el('b', {}, r.best), '최고 연속 정답'), el('div', {}, el('b', {}, caughtN() + '/151'), '도감'),
        el('div', {}, el('b', {}, r.math.filter((x) => x.mastered && !x.placed).length + r.sci.filter((x) => x.mastered && !x.placed).length), '새로 익힌 주제')),
      el('p', {}, '계속 여기저기 돌아다니며 포켓몬을 잡고 문제를 풀 수 있어요. 기록은 자동으로 저장돼요.')));
  });
}
