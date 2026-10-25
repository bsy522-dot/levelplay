/* 5판 자동 플레이 테스트: 게임코너 → 로켓단 아지트(층별 안내) → 비주기 → 실프스코프 → 포켓몬타워(라이벌·유령) → 후지 노인 → 포켓몬피리
 * 실행: node _tools/ch5test.mjs [url] */
import fs from 'fs';
import { chromium } from 'file:///C:/Users/User/AppData/Roaming/npm/node_modules/playwright/index.mjs';
const URL = process.argv[2] || 'http://127.0.0.1:8793/games/pokered-edu/';
const OUT = process.env.SHOT_DIR || 'C:/Users/User/.claude/jobs/734d08b0/tmp/shots_ch5';
fs.mkdirSync(OUT, { recursive: true });
let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗', n, x); } };
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 760 } })).newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
let n = 0; const shot = async (name) => { n++; await page.screenshot({ path: `${OUT}/${String(n).padStart(2, '0')}_${name}.png` }); };
const st = () => page.evaluate(() => { const s = window.__pe.G.s; return { map: s.map, x: s.x, y: s.y, busy: window.__pe.W.busy, flags: s.flags, bag: s.bag }; });
const vis = (s) => page.evaluate((s) => !!document.querySelector(s), s);
const key = async (k, t = 1) => { for (let i = 0; i < t; i++) { await page.keyboard.press(k); await page.waitForTimeout(90); } };
async function walk(dir, t) { for (let i = 0; i < t; i++) { await page.keyboard.down(dir); await page.waitForTimeout(170); await page.keyboard.up(dir); await page.waitForTimeout(90); } await page.waitForTimeout(300); }
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
  const F = { oakEscort: true, placement: true, gotStarter: 25, rivalStarter: 133, rivalBattled: true, rivalLeft: true, pokedex: true, parcel: true, badge1: true, squirtleGift: true, gymIntro: true, badge2: true, rival2: true, gym2Intro: true, fossil: 140, nuggetRocket: true, billAsk: true, billSaved: true, billGift: true, gym3Intro: true, diglettGift: true, badge3: true, rival3: true, gotCut: true, rtIntro: true, gym4Intro: true, badge4: true };
  localStorage.setItem('pokered_edu_save_v1', JSON.stringify({
    v: 1, name: '지우', rival: '오바람', grade: 2, map: 'CeladonCity', x: 41, y: 10, facing: 'down', started: 1, playMs: 0,
    party: [], box: [], bag: { 4: 10, 20: 5, 63: 1, 196: 1, 197: 1, 200: 1 }, money: 9000, flags: F, cut: { Route9: ['5,8'], CeladonCity: ['35,32'], CeladonGym: ['5,7'] },
    badges: ['boulder', 'cascade', 'thunder', 'rainbow'], dex: { seen: { 25: 1 }, caught: { 25: 1 } }, respawn: { map: 'CeladonPokecenter', x: 3, y: 4 }, lastOutdoor: 'CeladonCity', learn: null, stats: { battles: 0, wins: 0, caught: 0 }, visited: ['CeladonCity', 'LavenderTown', 'VermilionCity'],
  }));
});
await page.reload();
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await key('Space'); await page.waitForTimeout(1500);
await page.evaluate(() => { window.__pe.G.s.party = [
  { sp: 25, lv: 55, exp: 166375, iv: { atk: 15, def: 15, spe: 15, spc: 15, hp: 15 }, status: null, moves: [{ id: 'Thunderbolt', pp: 99 }, { id: 'QuickAttack', pp: 99 }], hp: 200 },
  { sp: 6, lv: 55, exp: 166375, iv: { atk: 15, def: 15, spe: 15, spc: 15, hp: 15 }, status: null, moves: [{ id: 'Flamethrower', pp: 99 }, { id: 'Slash', pp: 99 }], hp: 200 }]; });
let s, g;
g = await guide(); ok('① 4판 끝 세이브 → 5판 목표: 게임코너', /게임코너/.test(g.text) && g.nav, JSON.stringify(g));
await tp('GameCorner', 15, 15); g = await guide(); ok('① 게임코너: 비밀 계단 안내', /계단/.test(g.text) && g.nav, JSON.stringify(g));
for (const [m, x, y] of [['RocketHideoutB1F', 21, 3], ['RocketHideoutB2F', 27, 9], ['RocketHideoutB3F', 25, 7], ['RocketHideoutB4F', 19, 11]]) {
  await tp(m, x, y); g = await guide(); ok(`② 아지트 ${m}: 길 안내`, !!g.nav, JSON.stringify(g));
}
await shot('hideout_b4f');
// 비주기
await tp('RocketHideoutB4F', 24, 3, 'right'); await key('Space');
await drive(async () => (await st()).flags.scope && !(await vis('.dialog')) && !(await vis('.bbox')), 1500);
s = await st(); ok('③ 비주기를 이기고 실프스코프(72)', !!s.flags.scope && s.bag[72] === 1, JSON.stringify([s.flags.scope, s.bag[72]]));
await idle();
// 타워
await tp('LavenderTown', 14, 7, 'up'); g = await guide(); ok('④ 보라타운: 포켓몬타워 안내', /타워/.test(g.text) && g.nav, JSON.stringify(g));
await tp('PokemonTower2F', 16, 5, 'left'); await walk('ArrowLeft', 1);
await drive(async () => (await st()).flags.rival4 && !(await vis('.dialog')) && !(await vis('.bbox')), 1200);
s = await st(); ok('④ 타워 2층 라이벌 승부', !!s.flags.rival4, '');
await idle();
for (const [m, x, y] of [['PokemonTower3F', 4, 10], ['PokemonTower4F', 17, 10], ['PokemonTower5F', 4, 10], ['PokemonTower6F', 17, 10]]) {
  await tp(m, x, y); g = await guide(); ok(`④ 타워 ${m}: 계단 안내`, !!g.nav, JSON.stringify(g));
}
// 유령: 스코프 없이 → 못 지나감, 있으면 → 싸움
await page.evaluate(() => { delete window.__pe.G.s.bag[72]; });
await tp('PokemonTower6F', 10, 13, 'down'); await walk('ArrowDown', 1); await idle();
s = await st(); ok('⑤ 스코프 없으면 유령이 막고 뒤로 밀림', !s.flags.marowak && s.y <= 14, JSON.stringify([s.x, s.y]));
await page.evaluate(() => { window.__pe.G.s.bag[72] = 1; });
await tp('PokemonTower6F', 10, 13, 'down'); await walk('ArrowDown', 1);
await drive(async () => (await st()).flags.marowak && !(await vis('.dialog')) && !(await vis('.bbox')), 900);
s = await st(); ok('⑤ 스코프로 정체를 밝히고 텅구리 영혼을 달램', !!s.flags.marowak, '');
await idle(); await shot('tower_ghost');
// 7층 → 후지 노인 → 피리
await tp('PokemonTower7F', 10, 4, 'up'); await key('Space');
await drive(async () => (await st()).flags.flute && !(await vis('.dialog')) && !(await vis('.panel')), 600);
s = await st(); ok('⑥ 후지 노인을 구하고 집에서 포켓몬피리(73)', !!s.flags.fujiSaved && !!s.flags.flute && s.bag[73] === 1 && s.map === 'MrFujisHouse', JSON.stringify([s.map, s.flags.fujiSaved, s.bag[73]]));
await idle(); await shot('fuji_flute');
g = await guide(); ok('⑦ 5판 끝 목표 문구', /5판 완료|6판|잠만보|12번도로/.test(g.text), g.text);
ok('자바스크립트 오류 없음', errs.length === 0, errs.slice(0, 3).join(' | '));
console.log(`\n5판 결과: ${pass} 통과, ${fail} 실패`);
await browser.close();
process.exit(fail ? 1 : 0);
