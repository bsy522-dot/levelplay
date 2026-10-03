/* 7판 자동 플레이 테스트: 관문 경비원(핑크배지) → 실프주식회사 엘리베이터(층 고르기) → 7층 라이벌·라프라스 → 발판 11층
 *   → 비주기 → 사장님 마스터볼 → 초련 체육관 발판 미로 길 안내 → 초련 → 골드배지
 * 실행: node _tools/ch7test.mjs [url] */
import fs from 'fs';
import { chromium } from 'file:///C:/Users/User/AppData/Roaming/npm/node_modules/playwright/index.mjs';
const URL = process.argv[2] || 'http://127.0.0.1:8793/games/pokered-edu/';
const OUT = process.env.SHOT_DIR || 'C:/Users/User/.claude/jobs/734d08b0/tmp/shots_ch7';
fs.mkdirSync(OUT, { recursive: true });
let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗', n, x); } };
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 760 } })).newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
let n = 0; const shot = async (name) => { n++; await page.screenshot({ path: `${OUT}/${String(n).padStart(2, '0')}_${name}.png` }); };
const st = () => page.evaluate(() => { const s = window.__pe.G.s; return { map: s.map, x: s.x, y: s.y, busy: window.__pe.W.busy, flags: s.flags, bag: s.bag, badges: s.badges, party: s.party.map((m) => m.sp), box: (s.box || []).map((m) => m.sp) }; });
const vis = (s) => page.evaluate((s) => !!document.querySelector(s), s);
const key = async (k, t = 1) => { for (let i = 0; i < t; i++) { await page.keyboard.press(k); await page.waitForTimeout(90); } };
async function walk(dir, t) { for (let i = 0; i < t; i++) { await page.keyboard.down(dir); await page.waitForTimeout(170); await page.keyboard.up(dir); await page.waitForTimeout(110); } await page.waitForTimeout(400); }
async function drive(until, max = 800) {
  for (let i = 0; i < max; i++) {
    if (await until()) return true;
    if (await page.evaluate(() => { const b = document.querySelector('.quiz .ans button'); return b && !b.disabled; })) { const c = await page.evaluate(() => window.__peQ.c); await page.keyboard.press(String(c + 1)); await page.waitForTimeout(220); continue; }
    if (await vis('.choices')) { await key('Space'); continue; }
    await page.keyboard.press('Space'); await page.waitForTimeout(110);
  }
  return false;
}
const idle = () => drive(async () => { const s = await st(); return !s.busy && !(await vis('.dialog')) && !(await vis('.bbox')) && !(await vis('.panel')) && !(await vis('.choices')); }, 400);
const tp = async (m, x, y, f = 'down') => { await page.evaluate(([m, x, y, f]) => window.__pe.W.scene.loadMap(m, x, y, f), [m, x, y, f]); await page.waitForTimeout(500); };
const guide = () => page.evaluate(() => { const o = window.__pe.W.objective(); const nv = window.__pe.W.scene.navTo(o.targets); return { text: o.text, nav: nv && { dir: nv.dir, dist: nv.dist } }; });

await page.goto(URL);
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await page.evaluate(() => {
  localStorage.clear();
  const F = { oakEscort: true, placement: true, gotStarter: 25, rivalStarter: 133, rivalBattled: true, rivalLeft: true, pokedex: true, parcel: true, badge1: true, squirtleGift: true, gymIntro: true, badge2: true, rival2: true, gym2Intro: true, fossil: 140, nuggetRocket: true, billAsk: true, billSaved: true, billGift: true, gym3Intro: true, diglettGift: true, badge3: true, rival3: true, gotCut: true, rtIntro: true, gym4Intro: true, badge4: true, scope: true, rival4: true, marowak: true, fujiSaved: true, flute: true, snorlax12: true, ch6End: true };
  localStorage.setItem('pokered_edu_save_v1', JSON.stringify({
    v: 1, name: '지우', rival: '오바람', grade: 2, map: 'Route7', x: 5, y: 9, facing: 'right', started: 1, playMs: 0,
    party: [], box: [], bag: { 4: 10, 20: 5, 63: 1, 72: 1, 73: 1, 196: 1, 197: 1, 198: 1, 199: 1, 200: 1 }, money: 9000, flags: F, cut: { Route9: ['5,8'], CeladonCity: ['35,32'], CeladonGym: ['5,7'] },
    badges: ['boulder', 'cascade', 'thunder', 'rainbow'], dex: { seen: { 25: 1 }, caught: { 25: 1 } }, respawn: { map: 'CeladonPokecenter', x: 3, y: 4 }, lastOutdoor: 'Route7', learn: null, stats: { battles: 0, wins: 0, caught: 0 }, visited: ['CeladonCity', 'LavenderTown', 'VermilionCity'],
  }));
});
await page.reload();
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await key('Space'); await page.waitForTimeout(1500);
await page.evaluate(() => { window.__pe.G.s.party = [
  { sp: 25, lv: 65, exp: 274625, iv: { atk: 15, def: 15, spe: 15, spc: 15, hp: 15 }, status: null, moves: [{ id: 'Thunderbolt', pp: 99 }, { id: 'QuickAttack', pp: 99 }], hp: 240 },
  { sp: 94, lv: 65, exp: 274625, iv: { atk: 15, def: 15, spe: 15, spc: 15, hp: 15 }, status: null, moves: [{ id: 'NightShade', pp: 99 }, { id: 'PsychicM', pp: 99 }], hp: 220 }]; });
let s, g;
// ① 관문: 핑크배지 없으면 막힘
await tp('Route7Gate', 1, 3, 'right'); await walk('ArrowRight', 1); await idle();
s = await st(); ok('① 핑크배지가 없으면 관문에서 뒤로 밀림', s.x <= 1 && s.map === 'Route7Gate', JSON.stringify([s.map, s.x, s.y]));
await page.evaluate(() => { const g = window.__pe.G.s; g.flags.badge5 = true; g.badges.push('soul'); });
await tp('Route7', 5, 9, 'right'); g = await guide(); ok('① 6판 끝 → 7판 목표: 노랑시티 관문', /관문|노랑시티/.test(g.text) && g.nav, JSON.stringify(g));
await tp('Route7Gate', 1, 3, 'right'); await walk('ArrowRight', 3); await idle();
s = await st(); ok('① 핑크배지가 있으면 관문을 지나감', s.x >= 3 || s.map === 'Route7', JSON.stringify([s.map, s.x, s.y]));
await tp('SaffronCity', 18, 26); g = await guide(); ok('② 노랑시티: 실프주식회사 안내', /실프/.test(g.text) && g.nav, JSON.stringify(g));
// ② 엘리베이터
await tp('SilphCo1F', 20, 2, 'up'); await walk('ArrowUp', 2);
for (let i = 0; i < 40 && !(await vis('.choices')); i++) { await key('Space'); await page.waitForTimeout(150); } // 안내 말 넘기기
const floors = await page.evaluate(() => [...document.querySelectorAll('.choices button')].map((b) => b.textContent));
ok('② 엘리베이터: 층 고르기(1·5·7·11층)', floors.length === 4 && floors.some((t) => t.includes('11층')), JSON.stringify(floors));
await page.locator('.choices button', { hasText: '7층' }).first().click(); await page.waitForTimeout(800); await idle();
s = await st(); ok('② 7층에 도착', s.map === 'SilphCo7F', JSON.stringify([s.map, s.x, s.y]));
g = await guide(); ok('③ 7층: 라이벌 쪽 안내', !!g.nav, JSON.stringify(g));
// ③ 라이벌
await tp('SilphCo7F', 7, 7, 'left'); await walk('ArrowLeft', 1);
await drive(async () => (await st()).flags.rival5 && !(await vis('.dialog')) && !(await vis('.bbox')), 1500);
s = await st(); ok('③ 7층 라이벌(샤미드) 승부', !!s.flags.rival5, '');
await idle();
await tp('SilphCo7F', 2, 5, 'left'); await key('Space'); await idle();
s = await st(); ok('③ 라프라스(131) 선물', s.party.includes(131) || s.box.includes(131), JSON.stringify([s.party, s.box]));
g = await guide(); ok('③ 다음: 11층 발판 안내', /11층/.test(g.text) && g.nav, JSON.stringify(g));
// ④ 발판 → 11층 → 비주기
await tp('SilphCo7F', 5, 8, 'up'); await walk('ArrowUp', 1); await idle();
s = await st(); ok('④ 발판을 밟으면 11층으로', s.map === 'SilphCo11F', JSON.stringify([s.map, s.x, s.y]));
await tp('SilphCo11F', 6, 10, 'up'); await key('Space');
await drive(async () => (await st()).flags.silphFreed && !(await vis('.dialog')) && !(await vis('.bbox')), 1500);
s = await st(); ok('④ 비주기를 이기고 실프 해방', !!s.flags.silphFreed, '');
await idle();
await tp('SilphCo11F', 7, 6, 'up'); await key('Space'); await idle();
s = await st(); ok('④ 사장님께 마스터볼(1)', s.bag[1] === 1, JSON.stringify(s.bag[1]));
// ⑤ 초련
await tp('SaffronCity', 34, 6); g = await guide(); ok('⑤ 노랑시티: 체육관 안내', /체육관|초련/.test(g.text) && g.nav, JSON.stringify(g));
await tp('SaffronGym', 8, 16, 'up'); g = await guide(); ok('⑤ 체육관 발판 미로 길 안내', !!g.nav, JSON.stringify(g));
await shot('saffron_gym');
await page.evaluate(async () => { const S = await import('./js/state.js'); S.healParty(); }); // 실제처럼 포켓몬센터에서 회복하고 도전
await tp('SaffronGym', 9, 9, 'up'); await key('Space');
await drive(async () => (await st()).flags.badge6 && !(await vis('.dialog')) && !(await vis('.bbox')) && !(await vis('.panel')), 1500);
s = await st(); ok('⑤ 초련을 이기고 골드배지', !!s.flags.badge6 && s.badges.includes('marsh'), JSON.stringify(s.badges));
await idle();
g = await guide(); ok('⑥ 7판 끝 목표', /7판 완료|홍련|8판/.test(g.text), g.text);
ok('자바스크립트 오류 없음', errs.length === 0, errs.slice(0, 3).join(' | '));
console.log(`\n7판 결과: ${pass} 통과, ${fail} 실패`);
await browser.close();
process.exit(fail ? 1 : 0);
