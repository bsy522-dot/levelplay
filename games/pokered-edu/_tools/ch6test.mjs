/* 6판 자동 플레이 테스트: 잠만보(피리) → 12~15번도로 안내 → 연분홍시티 독수 → 사파리존 비밀의 집(파도타기)·금니 → 관리인(괴력)
 *   + 괴력으로 바위 밀기, 파도타기로 물 건너기
 * 실행: node _tools/ch6test.mjs [url] */
import fs from 'fs';
import { chromium } from 'file:///C:/Users/User/AppData/Roaming/npm/node_modules/playwright/index.mjs';
const URL = process.argv[2] || 'http://127.0.0.1:8793/games/pokered-edu/';
const OUT = process.env.SHOT_DIR || 'C:/Users/User/.claude/jobs/734d08b0/tmp/shots_ch6';
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
async function walk(dir, t) { for (let i = 0; i < t; i++) { await page.keyboard.down(dir); await page.waitForTimeout(170); await page.keyboard.up(dir); await page.waitForTimeout(110); } await page.waitForTimeout(300); }
async function drive(until, max = 800) {
  for (let i = 0; i < max; i++) {
    if (await until()) return true;
    if (await page.evaluate(() => { const b = document.querySelector('.quiz .ans button'); return b && !b.disabled; })) { const c = await page.evaluate(() => window.__peQ.c); await page.keyboard.press(String(c + 1)); await page.waitForTimeout(220); continue; }
    if (await vis('.bbox .cmds:not(.hidden)')) { await page.click('.bbox .cmds button:nth-child(1)'); await page.waitForTimeout(200); continue; } // 야생: 싸운다
    if (await vis('.moves')) { await page.click('.moves button:nth-child(1)'); await page.waitForTimeout(200); continue; }
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
  const F = { oakEscort: true, placement: true, gotStarter: 25, rivalStarter: 133, rivalBattled: true, rivalLeft: true, pokedex: true, parcel: true, badge1: true, squirtleGift: true, gymIntro: true, badge2: true, rival2: true, gym2Intro: true, fossil: 140, nuggetRocket: true, billAsk: true, billSaved: true, billGift: true, gym3Intro: true, diglettGift: true, badge3: true, rival3: true, gotCut: true, rtIntro: true, gym4Intro: true, badge4: true, scope: true, rival4: true, marowak: true, fujiSaved: true, flute: true };
  localStorage.setItem('pokered_edu_save_v1', JSON.stringify({
    v: 1, name: '지우', rival: '오바람', grade: 2, map: 'LavenderTown', x: 10, y: 12, facing: 'down', started: 1, playMs: 0,
    party: [], box: [], bag: { 4: 10, 20: 5, 63: 1, 72: 1, 73: 1, 196: 1, 197: 1, 200: 1 }, money: 9000, flags: F, cut: { Route9: ['5,8'], CeladonCity: ['35,32'], CeladonGym: ['5,7'] },
    badges: ['boulder', 'cascade', 'thunder', 'rainbow'], dex: { seen: { 25: 1 }, caught: { 25: 1 } }, respawn: { map: 'LavenderPokecenter', x: 3, y: 4 }, lastOutdoor: 'LavenderTown', learn: null, stats: { battles: 0, wins: 0, caught: 0 }, visited: ['CeladonCity', 'LavenderTown', 'VermilionCity'],
  }));
});
await page.reload();
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await key('Space'); await page.waitForTimeout(1500);
await page.evaluate(() => { window.__pe.G.s.party = [
  { sp: 25, lv: 60, exp: 216000, iv: { atk: 15, def: 15, spe: 15, spc: 15, hp: 15 }, status: null, moves: [{ id: 'Thunderbolt', pp: 99 }, { id: 'QuickAttack', pp: 99 }], hp: 220 },
  { sp: 65, lv: 60, exp: 216000, iv: { atk: 15, def: 15, spe: 15, spc: 15, hp: 15 }, status: null, moves: [{ id: 'PsychicM', pp: 99 }], hp: 200 }]; });
let s, g;
g = await guide(); ok('① 5판 끝 세이브 → 6판 목표: 12번도로', /12번도로/.test(g.text) && g.nav, JSON.stringify(g));
// 잠만보: 피리 없이 → 안 깸
await page.evaluate(() => { delete window.__pe.G.s.bag[73]; });
await tp('Route12', 10, 61, 'down'); await key('Space'); await idle();
s = await st(); ok('② 피리가 없으면 잠만보가 안 깸', !s.flags.snorlax12, '');
await page.evaluate(() => { window.__pe.G.s.bag[73] = 1; });
await key('Space');
await drive(async () => (await st()).flags.snorlax12 && !(await vis('.dialog')) && !(await vis('.bbox')), 900);
s = await st(); ok('② 피리로 깨우고 싸운 뒤 길이 열림', !!s.flags.snorlax12, '');
await idle(); await walk('ArrowDown', 2); s = await st(); ok('② 잠만보 자리를 지나감', s.y >= 62, JSON.stringify([s.x, s.y]));
for (const [m, x, y, want] of [['Route12', 10, 70, '13번도로'], ['Route13', 50, 3, '14번도로'], ['Route14', 10, 20, '15번도로'], ['Route15', 40, 8, '연분홍시티'], ['FuchsiaCity', 20, 20, '체육관']]) {
  await tp(m, x, y); g = await guide(); ok(`③ 길 안내 ${m}(${x},${y}) → ${want}`, new RegExp(want).test(g.text) && !!g.nav, JSON.stringify(g));
}
// 독수
await tp('FuchsiaGym', 4, 12, 'up'); g = await guide(); ok('④ 체육관 안 독수 안내', !!g.nav, JSON.stringify(g));
await tp('FuchsiaGym', 4, 11, 'up'); await key('Space');
await drive(async () => (await st()).flags.badge5 && !(await vis('.dialog')) && !(await vis('.bbox')), 1500);
s = await st(); ok('④ 독수를 이기고 핑크배지', !!s.flags.badge5 && s.badges.includes('soul'), JSON.stringify(s.badges));
await idle();
// 사파리존
for (const [m, x, y] of [['FuchsiaCity', 18, 6], ['SafariZoneGate', 3, 3], ['SafariZoneCenter', 14, 22], ['SafariZoneWest', 26, 22]]) {
  await tp(m, x, y); g = await guide(); ok(`⑤ 사파리존 길 안내 ${m}`, !!g.nav, JSON.stringify(g));
}
await tp('SafariZoneSecretHouse', 3, 4, 'up'); await key('Space'); await idle();
s = await st(); ok('⑤ 비밀의 집 → 파도타기(198)', s.bag[198] === 1, JSON.stringify(s.bag[198]));
await tp('SafariZoneWest', 26, 22); g = await guide(); ok('⑤ 다음 목표: 금니', /금니/.test(g.text) && !!g.nav, JSON.stringify(g));
await tp('SafariZoneWest', 19, 8, 'up'); await walk('ArrowUp', 1); await idle(); // 공에 부딪히면 줍는다
s = await st(); ok('⑤ 부딪혀서 금니(64)를 주움', s.bag[64] === 1, JSON.stringify(s.bag[64]));
await tp('WardensHouse', 2, 4, 'up'); await key('Space'); await idle();
s = await st(); ok('⑥ 관리인에게 금니 → 괴력(199)', s.bag[199] === 1 && !s.bag[64], JSON.stringify([s.bag[199], s.bag[64]]));
await idle();
// 괴력: 관리인 집 바위 (8,4) 밀기
const b0 = await page.evaluate(() => { const o = window.__pe.W.scene.npcs.find((x) => x.kind === 'boulder'); return o && [o.x, o.y]; });
await tp('WardensHouse', 7, 4, 'right'); await key('Space'); await idle();
await walk('ArrowRight', 1); await idle();
const b1 = await page.evaluate(() => { const o = window.__pe.W.scene.npcs.find((x) => x.kind === 'boulder'); return o && [o.x, o.y]; });
const moved = await page.evaluate(() => (window.__pe.G.s.boulders || {}).WardensHouse);
ok('⑦ 괴력: 바위 앞 A → 바위가 밀리고 저장됨', b0 && b1 && (b1[0] !== b0[0] || b1[1] !== b0[1]) ? !!moved : false, JSON.stringify([b0, b1, moved]));
// 파도타기: 12번도로 물가 (6,11) → 아래 물 (6,12)
await tp('Route12', 6, 11, 'down'); await key('Space'); await idle();
s = await st(); const wc = await page.evaluate(([x, y]) => window.__pe.DB.maps.Route12.grid[y][x], [s.x, s.y]);
ok('⑧ 물 앞 A → 파도타기로 물 위에', s.surf && wc === '~', JSON.stringify([s.x, s.y, s.surf, wc]));
await shot('surf');
await walk('ArrowUp', 1); s = await st(); ok('⑧ 땅에 닿으면 내림', !s.surf, JSON.stringify([s.x, s.y, s.surf]));
g = await guide(); ok('⑨ 6판 끝 목표', /6판 완료|노랑시티|7판/.test(g.text), g.text);
ok('자바스크립트 오류 없음', errs.length === 0, errs.slice(0, 3).join(' | '));
console.log(`\n6판 결과: ${pass} 통과, ${fail} 실패`);
await browser.close();
process.exit(fail ? 1 : 0);
