/* 3판 자동 플레이 테스트: 너겟 브릿지(로켓단) → 이수재 구하기 → 5번도로 → 지하통로 → 6번도로 → 갈색시티 → 마티스
 * 실행: node _tools/ch3test.mjs [url] */
import { chromium } from 'file:///C:/Users/User/AppData/Roaming/npm/node_modules/playwright/index.mjs';
import fs from 'fs';
const URL = process.argv[2] || 'http://127.0.0.1:8793/games/pokered-edu/';
const OUT = process.env.SHOT_DIR || 'C:/Users/User/.claude/jobs/734d08b0/tmp/shots_ch3';
fs.mkdirSync(OUT, { recursive: true });
let pass = 0, fail = 0; const fails = [];
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ✓', n); } else { fail++; fails.push(n + ' ' + x); console.log('  ✗', n, x); } };
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 760 } })).newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(0, 2).join(' | ')));
page.on('console', (m) => { if ((m.type() === 'error' && !m.text().includes('404')) || m.text().startsWith('battle:')) errs.push(m.text()); });
let n = 0; const shot = async (name) => { n++; await page.screenshot({ path: `${OUT}/${String(n).padStart(2, '0')}_${name}.png` }); };
const st = () => page.evaluate(() => { const s = window.__pe.G.s; return { map: s.map, x: s.x, y: s.y, busy: window.__pe.W.busy, flags: s.flags, party: s.party.map((m) => [m.sp, m.lv]) }; });
const vis = (s) => page.evaluate((s) => !!document.querySelector(s), s);
const key = async (k, t = 1) => { for (let i = 0; i < t; i++) { await page.keyboard.press(k); await page.waitForTimeout(90); } };
async function walk(dir, t) { for (let i = 0; i < t; i++) { await page.keyboard.down(dir); await page.waitForTimeout(170); await page.keyboard.up(dir); await page.waitForTimeout(90); } await page.waitForTimeout(200); }
async function drive(until, max = 800) {
  for (let i = 0; i < max; i++) {
    if (await until()) return true;
    if (await page.evaluate(() => { const b = document.querySelector('.quiz .ans button'); return b && !b.disabled; })) { const c = await page.evaluate(() => window.__peQ.c); await page.keyboard.press(String(c + 1)); await page.waitForTimeout(220); continue; }
    if (await vis('.choices')) { await key('Space'); continue; }
    await page.keyboard.press('Space'); await page.waitForTimeout(110);
  }
  return false;
}
const idle = () => drive(async () => { const s = await st(); return !s.busy && !(await vis('.dialog')) && !(await vis('.bbox')) && !(await vis('.panel')); }, 200);
const tp = async (m, x, y, f = 'down') => { await page.evaluate(([m, x, y, f]) => window.__pe.W.scene.loadMap(m, x, y, f), [m, x, y, f]); await page.waitForTimeout(600); };

// 2판을 끝낸 상태의 세이브
await page.goto(URL);
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await page.evaluate(() => {
  localStorage.setItem('pokered_edu_save_v1', JSON.stringify({
    v: 1, name: '지우', rival: '오바람', grade: 2, map: 'CeruleanCity', x: 20, y: 12, facing: 'up',
    party: [], box: [], bag: { 4: 10, 20: 5 }, money: 5000,
    flags: { oakEscort: true, placement: true, gotStarter: 25, rivalStarter: 133, rivalBattled: true, rivalLeft: true, pokedex: true, parcel: true, badge1: true, squirtleGift: true, gymIntro: true, badge2: true, rival2: true, gym2Intro: true, fossil: 140 },
    badges: ['boulder', 'cascade'], dex: { seen: { 25: 1 }, caught: { 25: 1 } }, respawn: { map: 'CeruleanPokecenter', x: 3, y: 4 }, lastOutdoor: 'CeruleanCity', learn: null, playMs: 0, stats: { battles: 0, wins: 0, caught: 0 },
  }));
});
await page.reload();
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await key('Space');
await page.waitForTimeout(1500);
await page.evaluate(() => { const s = window.__pe.G.s; s.party = [{ sp: 50, lv: 45, exp: 91000, iv: { atk: 12, def: 12, spe: 12, spc: 12, hp: 15 }, status: null, moves: [{ id: 'Dig', pp: 10 }, { id: 'Scratch', pp: 35 }], hp: 160 }, { sp: 25, lv: 45, exp: 91000, iv: { atk: 12, def: 12, spe: 12, spc: 12, hp: 15 }, status: null, moves: [{ id: 'Thunderbolt', pp: 15 }, { id: 'QuickAttack', pp: 30 }], hp: 160 }]; });
let s;
await tp('CeruleanCity', 20, 1, 'up');
await walk('ArrowUp', 2); await idle();
s = await st();
ok('블루시티 북쪽 → 24번도로(너겟 브릿지)', s.map === 'Route24', JSON.stringify([s.map, s.x, s.y]));
await shot('route24');
await tp('Route24', 10, 15, 'right');
await key('Space');
await drive(async () => (await st()).flags.nuggetRocket && !(await vis('.dialog')) && !(await vis('.bbox')), 1500); // 구멍파기는 원작처럼 두 턴 (2026-10-03 전투 보강) → 더 길게
s = await st();
ok('너겟 브릿지 끝 로켓단 격파 + 금덩이', !!s.flags.nuggetRocket, JSON.stringify(s.flags));
await tp('BillsHouse', 6, 6, 'up');
await shot('bill_clefairy');
await key('Space');
await drive(async () => (await st()).flags.billAsk && !(await vis('.dialog')), 60);
ok('삐삐(이수재)의 부탁', !!(await st()).flags.billAsk);
await tp('BillsHouse', 1, 5, 'up');
await key('Space');
await drive(async () => (await st()).flags.billSaved && !(await vis('.dialog')) && !(await st()).busy, 60);
ok('PC 분리 → 이수재 구함', !!(await st()).flags.billSaved);
await tp('BillsHouse', 4, 5, 'up');
await key('Space');
await drive(async () => (await st()).flags.billGift && !(await vis('.dialog')), 60);
ok('이수재의 선물(이상한사탕)', !!(await st()).flags.billGift && (await page.evaluate(() => window.__pe.G.s.bag[40])) === 3);
await shot('bill_human');
await tp('CeruleanCity', 12, 34, 'down');
await walk('ArrowDown', 2); await idle();
s = await st();
ok('블루시티 남쪽 → 5번도로', s.map === 'Route5', JSON.stringify([s.map, s.x, s.y]));
await tp('Route5', 17, 28, 'up');
await walk('ArrowUp', 1); await idle();
s = await st();
ok('5번도로 → 지하통로 입구 건물', s.map === 'UndergroundPathRoute5', JSON.stringify([s.map, s.x, s.y]));
await walk('ArrowUp', 3); await walk('ArrowRight', 1); await idle();
s = await st();
ok('계단 → 지하통로', s.map === 'UndergroundPathNorthSouth', JSON.stringify([s.map, s.x, s.y]));
await shot('underground');
await tp('UndergroundPathNorthSouth', 2, 40, 'down');
await walk('ArrowDown', 1); await idle();
s = await st();
ok('지하통로 남쪽 계단 → 6번도로 쪽 건물', s.map === 'UndergroundPathRoute6', JSON.stringify([s.map, s.x, s.y]));
await walk('ArrowDown', 4); await idle();
s = await st();
ok('건물 밖 → 6번도로', s.map === 'Route6', JSON.stringify([s.map, s.x, s.y]));
await tp('Route6', 8, 35, 'down');
await walk('ArrowDown', 2); await idle();
s = await st();
ok('6번도로 → 갈색시티', s.map === 'VermilionCity', JSON.stringify([s.map, s.x, s.y]));
await shot('vermilion');
await tp('VermilionCity', 12, 20, 'up');
await walk('ArrowUp', 1);
await drive(async () => (await st()).map === 'VermilionGym' && (await st()).flags.diglettGift && !(await vis('.dialog')) && !(await st()).busy, 80);
ok('체육관 입장 → 가이드가 디그다 대여', !!(await st()).flags.diglettGift);
await shot('vermilion_gym');
await tp('VermilionGym', 5, 2, 'up');
await key('Space');
let q3 = false;
await drive(async () => { if (!q3 && await vis('.quiz .ans')) { q3 = true; await shot('surge_quiz'); } return (await st()).flags.badge3 && await vis('.panel'); }, 1500);
await shot('chapter3_end');
s = await st();
ok('마티스를 이기고 오렌지배지 → 3판 완료', !!s.flags.badge3, JSON.stringify(s.flags));
ok('자바스크립트 오류 없음', errs.length === 0, errs.slice(0, 4).join(' || '));
console.log(`\n3판 결과: ${pass} 통과, ${fail} 실패`);
if (fails.length) console.log(' - ' + fails.join('\n - '));
await browser.close();
process.exit(fail ? 1 : 0);
