/* 1차 모험 자동 플레이 테스트 (진짜 브라우저, 키보드로 조작).
 * 새 게임 → 자격 시험 → 첫 포켓몬 → 라이벌 배틀 → 1번도로 → 상록시티(소포) → 도감 → 상록숲 → 회색시티 체육관 → 1차 완료
 * 실행: node _tools/playtest.mjs [url]     화면: SHOT_DIR (기본 job tmp/shots) */
import { chromium } from 'file:///C:/Users/User/AppData/Roaming/npm/node_modules/playwright/index.mjs';
import fs from 'fs';

const URL = process.argv[2] || 'http://127.0.0.1:8793/games/pokered-edu/';
const OUT = process.env.SHOT_DIR || 'C:/Users/User/.claude/jobs/734d08b0/tmp/shots';
const VIEW = process.env.VIEW === 'phone' ? { width: 412, height: 860 } : { width: 1280, height: 760 };
fs.mkdirSync(OUT, { recursive: true });
let pass = 0, fail = 0; const fails = [];
const ok = (name, cond, extra = '') => { if (cond) { pass++; console.log('  ✓', name); } else { fail++; fails.push(name + ' ' + extra); console.log('  ✗', name, extra); } };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: VIEW, hasTouch: process.env.VIEW === 'phone' });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')));
page.on('console', (m) => { if ((m.type() === 'error' && !m.text().includes('404')) || m.text().startsWith('battle:')) errs.push(m.text()); });
let shotN = 0;
const shot = async (name) => { shotN++; await page.screenshot({ path: `${OUT}/${String(shotN).padStart(2, '0')}_${name}.png` }); };
const st = () => page.evaluate(() => { const s = window.__pe.G.s; return s ? { map: s.map, x: s.x, y: s.y, busy: window.__pe.W.busy, party: s.party.map((m) => [m.sp, m.lv, m.hp]), flags: s.flags, money: s.money, learn: s.learn && { total: s.learn.total, correct: s.learn.correct, streak: s.learn.streak } } : null; });
const key = async (k, n = 1, gap = 90) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await page.waitForTimeout(gap); } };
const vis = (sel) => page.evaluate((s) => !!document.querySelector(s), sel);

/** 대화·전투 메시지를 넘기고, 문제가 나오면 답한다. until() 이 참이 되면 멈춤 */
let wrongEvery = 3, qCount = 0;
async function drive(until, maxSteps = 400, opts = {}) {
  for (let i = 0; i < maxSteps; i++) {
    if (await until()) return true;
    const quizOpen = await page.evaluate(() => { const b = document.querySelector('.quiz .ans button'); return b && !b.disabled; });
    if (quizOpen) {
      const q = await page.evaluate(() => window.__peQ);
      qCount++;
      const wantWrong = opts.allCorrect ? false : qCount % wrongEvery === 0;
      const pick = wantWrong ? (q.c + 1) % 4 : q.c;
      await page.keyboard.press(String(pick + 1));
      await page.waitForTimeout(250);
      if (opts.onQuiz) await opts.onQuiz(q, wantWrong);
      continue;
    }
    if (await vis('.namebox')) { await page.keyboard.press('Enter'); await page.waitForTimeout(200); continue; }
    if (opts.onStep && await opts.onStep()) continue;
    await page.keyboard.press('Space');
    await page.waitForTimeout(opts.gap || 110);
  }
  return false;
}
async function walk(dir, n) { for (let i = 0; i < n; i++) { await page.keyboard.down(dir); await page.waitForTimeout(170); await page.keyboard.up(dir); await page.waitForTimeout(90); } await page.waitForTimeout(150); }
async function waitIdle(ms = 8000) { const t = Date.now(); while (Date.now() - t < ms) { const s = await st(); if (s && !s.busy && !(await vis('.dialog')) && !(await vis('.choices'))) return true; await page.waitForTimeout(100); } return false; }
async function teleport(map, x, y, face = 'down') { await page.evaluate(([m, x, y, f]) => window.__pe.W.scene.loadMap(m, x, y, f), [map, x, y, face]); await page.waitForTimeout(500); }

console.log('▶ 타이틀');
await page.goto(URL);
await page.waitForFunction(() => document.querySelector('.title'), null, { timeout: 30000 });
await page.waitForTimeout(800);
await shot('title');
ok('타이틀 화면 표시', await vis('.title .opts button'));

console.log('▶ 새 게임');
await key('Space');
await drive(() => vis('.choices'), 200);
await shot('grade_select');
await key('ArrowDown', 2); await key('Space');
await drive(async () => { const s = await st(); return s && s.map === 'RedsHouse2F' && !s.busy; }, 100);
await page.waitForTimeout(600);
await shot('house_2f');
let s = await st();
ok('집 2층에서 시작', s.map === 'RedsHouse2F', JSON.stringify(s));

console.log('▶ 계단 → 1층 → 밖');
await walk('ArrowUp', 5); await walk('ArrowRight', 2);
await page.waitForTimeout(800);
s = await st();
ok('계단으로 1층 이동', s.map === 'RedsHouse1F', JSON.stringify(s));
await shot('house_1f');
await walk('ArrowDown', 6); await walk('ArrowLeft', 5); await walk('ArrowDown', 3);
await page.waitForTimeout(900);
s = await st();
ok('집 밖으로 (태초마을)', s.map === 'PalletTown', JSON.stringify(s));
await shot('pallet');

console.log('▶ 오박사 등장 → 연구소 → 자격 시험');
await teleport('PalletTown', 10, 3, 'up');
await walk('ArrowUp', 2);
await drive(async () => (await st()).map === 'OaksLab' && (await vis('.quiz')), 150);
await shot('placement_quiz');
ok('자격 시험 문제 표시', await vis('.quiz'));
await drive(async () => { const s = await st(); return s.flags.placement && !s.busy && !(await vis('.dialog')); }, 300);
s = await st();
ok('자격 시험 완료', !!s.flags.placement, JSON.stringify(s.learn));

console.log('▶ 첫 포켓몬 (파이리)');
await walk('ArrowDown', 1); await walk('ArrowRight', 1); await walk('ArrowUp', 1);
await key('Space'); await page.waitForTimeout(300);
await shot('starter_ask');
await drive(async () => (await st()).flags.gotStarter && !(await vis('.dialog')), 60);
s = await st();
ok('파이리를 받음', s.party.length === 1 && s.party[0][0] === 4, JSON.stringify(s.party));

console.log('▶ 라이벌 배틀');
await walk('ArrowLeft', 1); await walk('ArrowDown', 3);
let sawQuiz = false, sawExplain = false, sawBattle = false;
await drive(async () => { const s = await st(); return s.flags.rivalLeft && !s.busy; }, 600, {
  onQuiz: async (q, wrong) => { if (!sawQuiz) { sawQuiz = true; await shot('battle_quiz'); } if (wrong && !sawExplain) { await page.waitForTimeout(400); if (await vis('.explain')) { sawExplain = true; await shot('battle_explain'); } } },
  onStep: async () => { if (!sawBattle && await vis('.bbox .cmds:not(.hidden)')) { sawBattle = true; await shot('battle_cmd'); } return false; },
});
s = await st();
ok('라이벌 배틀 진행 후 라이벌 퇴장', !!s.flags.rivalLeft, JSON.stringify(s.flags));
ok('배틀 중 문제가 나옴', sawQuiz);
ok('오답 설명이 나옴', sawExplain);

console.log('▶ 1번도로 · 상록시티 (지도 이어짐)');
await teleport('Route1', 11, 30, 'up');
await shot('route1');
await teleport('ViridianCity', 20, 30, 'up');
await shot('viridian');
await page.evaluate(() => window.__pe.W.scene.loadMap('ViridianMart', 3, 6, 'up'));
await page.waitForTimeout(500);
await walk('ArrowUp', 1); await walk('ArrowLeft', 1); await walk('ArrowLeft', 1);
await key('Space');
await drive(async () => (await st()).flags.parcel && !(await vis('.dialog')), 40);
s = await st();
ok('상점에서 소포 받음', !!s.flags.parcel, JSON.stringify(s.flags));

console.log('▶ 도감 받기');
await teleport('OaksLab', 5, 3, 'up');
await key('Space');
await drive(async () => (await st()).flags.pokedex && !(await vis('.dialog')), 80);
s = await st();
ok('도감과 몬스터볼 받음', !!s.flags.pokedex, JSON.stringify(s.flags));

console.log('▶ 지도 끝 넘어가기 · 숲 관문 연결');
await teleport('Route1', 10, 1, 'up');
await walk('ArrowUp', 2);
await waitIdle(4000);
s = await st();
ok('1번도로 → 상록시티 (걸어서 지도 이동)', s.map === 'ViridianCity', JSON.stringify([s.map, s.x, s.y]));
await teleport('Route2', 3, 44, 'up');
await walk('ArrowUp', 1); await waitIdle(4000);
s = await st();
ok('2번도로 → 상록숲 입구 건물', s.map === 'ViridianForestSouthGate', JSON.stringify([s.map, s.x, s.y]));
await walk('ArrowUp', 8); await waitIdle(4000);
s = await st();
ok('숲 입구 → 상록숲', s.map === 'ViridianForest', JSON.stringify([s.map, s.x, s.y]));
await teleport('ViridianForest', 1, 1, 'up');
await walk('ArrowUp', 1); await waitIdle(4000);
s = await st();
ok('상록숲 → 숲 출구 건물', s.map === 'ViridianForestNorthGate', JSON.stringify([s.map, s.x, s.y]));
await walk('ArrowUp', 8); await waitIdle(4000);
s = await st();
ok('숲 출구 → 2번도로 북쪽', s.map === 'Route2' && s.y < 11, JSON.stringify([s.map, s.x, s.y]));
await teleport('Route2', 8, 1, 'up');
await walk('ArrowUp', 2); await waitIdle(4000);
s = await st();
ok('2번도로 → 회색시티', s.map === 'PewterCity', JSON.stringify([s.map, s.x, s.y]));

console.log('▶ 야생 배틀 + 포획');
await page.evaluate(() => { window.__pe.G.s.bag[4] = 20; });
await teleport('Route1', 11, 20, 'up');
const wildP = page.evaluate(() => window.__pe.W.wildBattle({ encounterRate: 25, mons: [{ level: 2, species: 'Pidgey' }] }));
await page.waitForTimeout(1500);
await shot('wild_battle');
// 가방 → 몬스터볼 던지기 반복
for (let tries = 0; tries < 12; tries++) {
  await drive(() => vis('.bbox .cmds:not(.hidden)'), 60);
  if ((await st()).map && !(await vis('.bbox'))) break;
  await key('ArrowRight'); await key('Space'); // 가방
  await page.waitForTimeout(300);
  await key('Space'); // 첫 도구(몬스터볼)
  const done = await drive(async () => !(await vis('.bbox')) || await vis('.bbox .cmds:not(.hidden)'), 80);
  if (!(await vis('.bbox'))) break;
}
await drive(async () => !(await st()).busy, 100);
s = await st();
ok('야생 구구 포획', s.party.some((m) => m[0] === 16) || (await page.evaluate(() => window.__pe.G.s.box.length)) > 0, JSON.stringify(s.party));

console.log('▶ 지도 화면들');
for (const [m, x, y] of [['Route2', 4, 60], ['ViridianForest', 17, 45], ['PewterCity', 18, 30], ['ViridianPokecenter', 4, 6], ['PewterGym', 4, 12]]) {
  await teleport(m, x, y, 'up');
  await shot('map_' + m);
}

console.log('▶ 상록숲 트레이너 시선');
await drive(async () => !(await st()).busy && !(await vis('.dialog')), 60);
await teleport('ViridianForest', 29, 34, 'up');
await walk('ArrowUp', 1);
const trainerStarted = await drive(async () => vis('.bbox'), 30);
ok('곤충채집소년이 발견하고 승부 시작', trainerStarted);
await page.evaluate(() => window.__pe.G.s.party.forEach((m) => { m.lv = Math.max(m.lv, 14); }));
await drive(async () => { const s = await st(); return !s.busy && !(await vis('.bbox')); }, 500, { allCorrect: true });

console.log('▶ 웅 체육관');
await page.evaluate(() => { const p = window.__pe.G.s.party; p.forEach((m) => { m.lv = 30; m.hp = 999; }); });
await drive(async () => !(await st()).busy && !(await vis('.dialog')), 60);
await teleport('PewterGym', 4, 2, 'up');
await key('Space');
let gymQuiz = null;
await drive(async () => { const s = await st(); return s.flags.badge1 && !(await vis('.bbox')); }, 2500, { allCorrect: true, onQuiz: async (q) => { if (!gymQuiz) { gymQuiz = q; await shot('gym_story_quiz'); } } });
await drive(async () => await vis('.panel'), 80);
await shot('chapter_end');
s = await st();
ok('웅을 이기고 회색배지', !!s.flags.badge1, JSON.stringify(s.flags));
await key('Escape');
await page.waitForTimeout(300);

console.log('▶ 메뉴 화면');
await drive(async () => !(await st()).busy && !(await vis('.panel')) && !(await vis('.dialog')), 30);
await key('Escape'); await page.waitForTimeout(300);
await shot('menu');
ok('시작 메뉴 열림', await vis('.menu'));
await key('Space'); await page.waitForTimeout(400); await shot('party'); await key('KeyX'); await page.waitForTimeout(200);
await key('ArrowDown'); await key('Space'); await page.waitForTimeout(500); await shot('pokedex'); ok('도감 열림', await vis('.dexgrid')); await key('KeyX');
await key('ArrowDown', 2); await key('Space'); await page.waitForTimeout(400); await shot('report'); ok('공부 기록 열림', await vis('.report')); await key('KeyX');
await key('KeyX');

console.log('▶ 저장/이어하기');
await page.evaluate(() => window.__pe.save());
await page.reload();
await page.waitForFunction(() => document.querySelector('.title'), null, { timeout: 30000 });
const hasCont = await page.evaluate(() => [...document.querySelectorAll('.title button')].some((b) => b.textContent.includes('이어하기')));
ok('이어하기 버튼', hasCont);
await key('Space');
await page.waitForTimeout(1500);
s = await st();
ok('이어하기로 복귀', s && s.flags.badge1, s ? s.map : 'no state');
await shot('continue');

ok('자바스크립트 오류 없음', errs.length === 0, errs.slice(0, 5).join(' || '));
console.log(`\n결과: ${pass} 통과, ${fail} 실패  (문제 ${qCount}개 풀이)`);
if (fails.length) console.log('실패:\n - ' + fails.join('\n - '));
await browser.close();
process.exit(fail ? 1 : 0);
