/* 시작: 데이터 불러오기 → Phaser 켜기 → 타이틀 → 새 게임/이어하기 */
import { loadAll, DB } from './data.js';
import { G, newState, load, hasSave, save, wipe } from './state.js';
import { say, choose, askName, fade, PORTRAIT, root, setFastText } from './ui.js';
import { el } from './util.js';
import { Input } from './input.js';
import { sfx, music } from './audio.js';
import { WorldScene, W } from './world/overworld.js';
import { BattleScene, B, wildBattle, trainerBattle } from './battle/battle.js';
import { mapMusic, objective } from './world/events.js';
import { initLearn, GRADES } from './learn/tutor.js';
import * as MENU from './menus.js';
/* ★세이브 슬롯 관리(5개) — 병석님 요청으로 되살린 기능 */
import { startViaSlot } from './savemgr.js';
import { charSheet, KINDS, CW, CH } from './art/chars.js';

const AI_FACES = ['oak', 'rival', 'brock', 'mom', 'nurse', 'clerk', 'bugcatcher', 'youngster', 'oldman', 'camper', 'player', 'misty', 'rocket', 'hiker', 'surge', 'bill'];

function spriteFace(kind) {
  const sheet = charSheet(kind);
  const c = document.createElement('canvas'); c.width = 160; c.height = 160;
  const g = c.getContext('2d');
  g.fillStyle = '#e8eefb'; g.fillRect(0, 0, 160, 160);
  g.imageSmoothingQuality = 'high';
  g.drawImage(sheet, 0, 0, CW, CH * 0.62, 8, 4, 144, 144 * (CH * 0.62) / CW);
  return c.toDataURL();
}
function probe(url) { return new Promise((res) => { const i = new Image(); i.onload = () => res(true); i.onerror = () => res(false); i.src = url; }); }

async function loadFaces() {
  for (const k of Object.keys(KINDS)) PORTRAIT[k] = spriteFace(k);
  await Promise.all(AI_FACES.map(async (k) => { const u = `art/ai/${k}.png`; if (await probe(u)) PORTRAIT[k] = u; }));
}

async function boot() {
  await loadAll();
  await loadFaces();
  let worldReady, battleReady;
  const pw = new Promise((r) => { worldReady = r; }), pb = new Promise((r) => { battleReady = r; });
  W.ready = worldReady; B.onSceneReady = battleReady;
  window.__game = new Phaser.Game({
    type: Phaser.AUTO, parent: 'game', backgroundColor: '#0f1830',
    scale: { mode: Phaser.Scale.RESIZE, width: window.innerWidth, height: window.innerHeight },
    render: { antialias: true, roundPixels: false },
    scene: [WorldScene, BattleScene],
  });
  await Promise.all([pw, pb]);
  B.scene.scene.setVisible(false);
  Object.assign(W, {
    wildBattle, trainerBattle, openMenu: MENU.openMenu, openShop: MENU.openShop, openBox: MENU.openBox,
    openReport: MENU.reportScreen, practice: MENU.practice, chapterEnd: MENU.chapterEnd,
    mapMusicNow: () => (W.scene.map ? mapMusic(W.scene.map) : 'town'),
    updateGoal, showGoalDetail, objective,
  });
  document.getElementById('boot').remove();
  await title();
}

async function title() {
  W.busy = true;
  const bg = (await probe('art/ai/title.webp')) ? 'url(art/ai/title.webp)' : null;
  const scr = el('div', { class: 'title', style: bg ? { backgroundImage: bg } : {} },
    el('h1', {}, '포켓몬 공부 모험', el('small', {}, '레드 버전 · 문제를 맞히면 기술이 명중!')));
  const opts = el('div', { class: 'win opts' });
  const items = [];
  if (hasSave()) items.push(['이어하기', 'cont']);
  items.push(['새로 시작', 'new']);
  /* ★세이브 관리(슬롯 5개). 병석님 요청으로 되살린 기능. */
  if (hasSave()) items.push(['🗂 세이브 관리 (5개 슬롯)', 'slots']);
  let sel = 0;
  const btns = items.map(([l, v], i) => el('button', { onclick: () => go(v) }, l));
  opts.append(...btns);
  scr.append(opts, el('div', { class: 'hint' }, '방향키 · 스페이스(결정) · X(취소) · Esc(메뉴)  |  폰: 화면 버튼'));
  root().append(scr);
  const paint = () => btns.forEach((b, i) => b.classList.toggle('sel', i === sel));
  paint();
  const choice = await new Promise((resolve) => {
    window.__go = (v) => resolve(v);
    const pop = Input.push((k) => {
      if (k === 'up' || k === 'down') { sel = (sel + 1) % items.length; paint(); sfx('select'); }
      if (k === 'a') { pop(); resolve(items[sel][1]); }
    });
    btns.forEach((b, i) => { b.onclick = () => { pop(); resolve(items[i][1]); }; });
  });
  sfx('select');
  await fade(true, 250);
  scr.remove();
  /* ★세이브 관리로 진입. 어느 슬롯이든 골라 불러온다. */
  if (choice === 'slots') {
    await fade(false, 250);
    await startViaSlot();
    return;
  }
  if (choice === 'cont' && load()) {
    if (!G.s.learn) initLearn(G.s.grade || 1);
    await W.scene.loadMap(G.s.map, G.s.x, G.s.y, G.s.facing);
    await fade(false, 250);
    W.busy = false;
    return;
  }
  if (hasSave()) {
    await fade(false, 200);
    const box = await say(['이미 저장된 모험이 있어요. 새로 시작하면 지금까지의 기록이 모두 지워져요!'], { keep: true });
    const yes = await choose([{ label: '그래도 새로 시작', value: true }, { label: '아니요, 돌아갈래요', value: false }], { cancel: false });
    box.remove();
    if (!yes) { location.reload(); return; }
    wipe();
  }
  await newGame();
}
function go() {}

async function newGame() {
  await fade(false, 200);
  music('lab');
  await say(['포켓몬 세계에 온 걸 환영한다!', '나는 오박사. 사람들은 나를 포켓몬 박사라고 부르지.', '이 세계에는 “포켓몬”이라는 신비한 생물들이 살고 있단다.', '그리고 이 세계에서는… 공부한 만큼 포켓몬이 강해진단다!', '먼저 네 이름을 알려 주겠니?'], { who: '오박사', face: 'oak' });
  const name = await askName('너의 이름은?', '지우');
  await say([`${name}! 좋은 이름이구나.`, '이 아이는 내 손자란다. 어릴 때부터 너의 라이벌이었지.', '어라… 이름이 뭐였더라?'], { who: '오박사', face: 'oak' });
  const rival = await askName('라이벌의 이름은?', '오바람');
  await say(['맞다, 그 이름이었지!', '마지막으로 하나만 더. 지금 몇 학년이니?'], { who: '오박사', face: 'oak' });
  const box = await say(['학년을 고르렴. (문제 난이도의 출발점이 된단다)'], { who: '오박사', face: 'oak', keep: true });
  const grade = await choose(GRADES.map((g) => ({ label: g.label, value: g.g })), { cancel: false });
  box.remove();
  newState({ name, rival, grade });
  initLearn(grade);
  await say([`좋아, ${name}!`, '너만의 포켓몬 이야기가 지금 시작된다!', '꿈과 모험과 공부가 가득한 포켓몬 세계로! 가자!'], { who: '오박사', face: 'oak' });
  await fade(true, 300);
  await W.scene.loadMap('RedsHouse2F', 5, 6, 'up');
  save();
  await fade(false, 400);
  W.busy = false;
}

/* 화면 위 '다음 목표' 안내판 */
let goalEl = null;
function updateGoal() {
  if (!G.s) return;
  const o = objective();
  if (!goalEl) {
    goalEl = el('div', { class: 'win goal', onclick: () => showGoalDetail() });
    root().append(goalEl);
  }
  goalEl.innerHTML = '';
  const nav = o.targets && W.scene?.navTo(o.targets);
  const navTxt = nav ? (nav.dist === 0 ? ' 📍 도착!' : ` ${nav.dir} ${nav.dist}걸음${nav.label ? ' (' + nav.label + ')' : ''}`) : (o.dir ? ' ' + o.dir : '');
  goalEl.append(el('span', {}, '🎯 ' + o.text), navTxt ? el('b', {}, navTxt) : '', el('small', {}, '  💡'));
}
async function showGoalDetail() {
  if (W.busy || !G.s) return;
  const o = objective();
  W.busy = true;
  try { await say(['🎯 ' + o.text + (o.dir ? `  (${o.dir})` : ''), ...o.detail], { who: '힌트', face: 'oak' }); } finally { W.busy = false; }
}

// 디버그/검증용 (자동 점검 스크립트가 쓴다)
window.__pe = { G, W, B, DB, save, wipe, MENU };

boot().catch((e) => {
  console.error(e);
  const b = document.getElementById('boot');
  if (b) b.innerHTML = `<p>불러오기에 실패했어요 😢<br><small>${String(e.message || e)}</small></p>`;
});
