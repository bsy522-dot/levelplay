/* 8판 자동 플레이 테스트: 태초마을 물가 → 파도타기 → 21번 바닷길 안내 → 홍련마을(잠긴 체육관) → 저택 지하 비밀열쇠 → 강연 → 진홍배지
 * 실행: node _tools/ch8test.mjs [url] */
import fs from 'fs';
import { chromium } from 'file:///C:/Users/User/AppData/Roaming/npm/node_modules/playwright/index.mjs';
const URL = process.argv[2] || 'http://127.0.0.1:8793/games/pokered-edu/';
const OUT = process.env.SHOT_DIR || 'C:/Users/User/.claude/jobs/734d08b0/tmp/shots_ch8';
fs.mkdirSync(OUT, { recursive: true });
let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗', n, x); } };
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 760 } })).newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
let n = 0; const shot = async (name) => { n++; await page.screenshot({ path: `${OUT}/${String(n).padStart(2, '0')}_${name}.png` }); };
const st = () => page.evaluate(() => { const s = window.__pe.G.s; return { map: s.map, x: s.x, y: s.y, busy: window.__pe.W.busy, flags: s.flags, bag: s.bag, badges: s.badges, surf: !!s.surf }; });
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
const guide = () => page.evaluate(() => { const o = window.__pe.W.objective(); const nv = window.__pe.W.scene.navTo(o.targets); return { text: o.text, nav: nv && { dir: nv.dir, dist: nv.dist, label: nv.label } }; });

await page.goto(URL);
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await page.evaluate(() => {
  localStorage.clear();
  const F = { oakEscort: true, placement: true, gotStarter: 25, rivalStarter: 133, rivalBattled: true, rivalLeft: true, pokedex: true, parcel: true, badge1: true, badge2: true, rival2: true, billAsk: true, billSaved: true, billGift: true, badge3: true, rival3: true, gotCut: true, badge4: true, scope: true, rival4: true, marowak: true, fujiSaved: true, flute: true, snorlax12: true, badge5: true, ch6End: true, rival5: true, silphFreed: true, badge6: true };
  localStorage.setItem('pokered_edu_save_v1', JSON.stringify({
    v: 1, name: '지우', rival: '오바람', grade: 2, map: 'PalletTown', x: 10, y: 10, facing: 'down', started: 1, playMs: 0,
    party: [], box: [], bag: { 4: 10, 20: 5, 196: 1, 197: 1, 198: 1, 199: 1, 200: 1 }, money: 9000, flags: F,
    badges: ['boulder', 'cascade', 'thunder', 'rainbow', 'soul', 'marsh'], dex: { seen: { 25: 1 }, caught: { 25: 1 } }, respawn: { map: 'PalletTown', x: 5, y: 6 }, lastOutdoor: 'PalletTown', learn: null, stats: { battles: 0, wins: 0, caught: 0 }, visited: ['CeladonCity', 'SaffronCity'],
  }));
});
await page.reload();
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await key('Space'); await page.waitForTimeout(1500);
await page.evaluate(() => { window.__pe.G.s.party = [
  { sp: 25, lv: 68, exp: 314432, iv: { atk: 15, def: 15, spe: 15, spc: 15, hp: 15 }, status: null, moves: [{ id: 'Thunderbolt', pp: 99 }], hp: 250 },
  { sp: 131, lv: 68, exp: 314432, iv: { atk: 15, def: 15, spe: 15, spc: 15, hp: 15 }, status: null, moves: [{ id: 'Surf', pp: 99 }, { id: 'IceBeam', pp: 99 }], hp: 300 }]; });
let s, g;
g = await guide(); ok('① 7판 끝 → 8판 목표: 태초마을 물가', /파도타기/.test(g.text) && g.nav, JSON.stringify(g));
// 물가까지 안내를 따라 걷고 A
for (let i = 0; i < 30; i++) {
  g = await guide(); if (!g.nav || g.nav.dist <= 1) break;
  const K = { '↑': 'ArrowUp', '↓': 'ArrowDown', '←': 'ArrowLeft', '→': 'ArrowRight' }; await walk(K[g.nav.dir], 1);
}
const face = await page.evaluate(() => { const o = window.__pe.W.objective(); const nv = window.__pe.W.scene.navTo(o.targets); return nv && nv.dir; });
const K = { '↑': 'ArrowUp', '↓': 'ArrowDown', '←': 'ArrowLeft', '→': 'ArrowRight' };
if (face) { await page.keyboard.down(K[face]); await page.waitForTimeout(60); await page.keyboard.up(K[face]); await page.waitForTimeout(300); }
await key('Space'); await idle();
s = await st(); ok('① 안내를 따라 물가에서 파도타기 시작', s.surf, JSON.stringify([s.map, s.x, s.y, s.surf]));
g = await guide(); ok('② 파도타기 중 남쪽 바닷길 안내', !!g.nav, JSON.stringify(g));
await tp('Route21', 10, 40); await page.evaluate(() => { window.__pe.G.s.surf = true; window.__pe.W.scene.updateSurfFx(); });
g = await guide(); ok('② 21번 바닷길: 홍련마을 안내', /홍련마을/.test(g.text) && !!g.nav, JSON.stringify(g));
await page.evaluate(() => { window.__pe.G.s.surf = false; });
// ③ 잠긴 체육관
await tp('CinnabarIsland', 18, 4, 'up'); await walk('ArrowUp', 1); await idle();
s = await st(); ok('③ 열쇠 없이는 체육관 문이 잠김', s.map === 'CinnabarIsland', JSON.stringify([s.map, s.x, s.y]));
g = await guide(); ok('③ 안내: 저택에서 열쇠 찾기', /저택/.test(g.text) && !!g.nav, JSON.stringify(g));
// ④ 저택
await tp('PokemonMansion1F', 5, 26); g = await guide(); ok('④ 저택 1층: 지하 계단 안내', !!g.nav, JSON.stringify(g));
await tp('PokemonMansionB1F', 23, 21); g = await guide(); ok('④ 저택 지하: 비밀열쇠 안내', /열쇠/.test(g.text) && !!g.nav, JSON.stringify(g));
await tp('PokemonMansionB1F', 5, 14, 'up'); await walk('ArrowUp', 1); await idle();
s = await st(); ok('④ 비밀열쇠(43)를 주움', s.bag[43] === 1, JSON.stringify(s.bag[43]));
await shot('mansion_key');
// ⑤ 강연
await tp('CinnabarIsland', 18, 4, 'up'); await walk('ArrowUp', 1); await idle();
s = await st(); ok('⑤ 열쇠로 체육관 문이 열림', s.map === 'CinnabarGym', JSON.stringify([s.map, s.x, s.y]));
g = await guide(); ok('⑤ 체육관 안 강연 안내', !!g.nav, JSON.stringify(g));
await page.evaluate(async () => { const S = await import('./js/state.js'); S.healParty(); });
await tp('CinnabarGym', 3, 4, 'up'); await key('Space');
await drive(async () => (await st()).flags.badge7 && !(await vis('.dialog')) && !(await vis('.bbox')) && !(await vis('.panel')), 1500);
s = await st(); ok('⑤ 강연을 이기고 진홍배지', !!s.flags.badge7 && s.badges.includes('volcano'), JSON.stringify(s.badges));
await idle();
g = await guide(); ok('⑥ 8판 끝 목표', /8판 완료|상록|9판/.test(g.text), g.text);
ok('자바스크립트 오류 없음', errs.length === 0, errs.slice(0, 3).join(' | '));
console.log(`\n8판 결과: ${pass} 통과, ${fail} 실패`);
await browser.close();
process.exit(fail ? 1 : 0);
