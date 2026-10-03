/* 9판·엔딩 자동 플레이 테스트: 상록시티 체육관(비주기·그린배지) → 22번도로 라이벌 → 리그 관문 → 23번도로(파도타기 안내)
 *   → 챔피언로드(바위를 밀며 안내 따라 걷기) → 석영고원 → 사천왕 4명(문 잠김) → 챔피언 → 명예의 전당 → 집
 * 실행: node _tools/ch9test.mjs [url] */
import fs from 'fs';
import { chromium } from 'file:///C:/Users/User/AppData/Roaming/npm/node_modules/playwright/index.mjs';
const URL = process.argv[2] || 'http://127.0.0.1:8793/games/pokered-edu/';
const OUT = process.env.SHOT_DIR || 'C:/Users/User/.claude/jobs/734d08b0/tmp/shots_ch9';
fs.mkdirSync(OUT, { recursive: true });
let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗', n, x); } };
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 760 } })).newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
let n = 0; const shot = async (name) => { n++; await page.screenshot({ path: `${OUT}/${String(n).padStart(2, '0')}_${name}.png` }); };
const st = () => page.evaluate(() => { const s = window.__pe.G.s; return { map: s.map, x: s.x, y: s.y, busy: window.__pe.W.busy, flags: s.flags, badges: s.badges, surf: !!s.surf, hof: s.hof }; });
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
const calm = async () => { const s = await st(); return !s.busy && !(await vis('.dialog')) && !(await vis('.bbox')) && !(await vis('.panel')) && !(await vis('.choices')); };
const idle = () => drive(calm, 400);
const tp = async (m, x, y, f = 'down') => { await page.evaluate(([m, x, y, f]) => window.__pe.W.scene.loadMap(m, x, y, f), [m, x, y, f]); await page.waitForTimeout(500); };
const guide = () => page.evaluate(() => { const o = window.__pe.W.objective(); const nv = window.__pe.W.scene.navTo(o.targets); return { text: o.text, dir: o.dir, nav: nv && { dir: nv.dir, dist: nv.dist, label: nv.label } }; });
const heal = () => page.evaluate(async () => { const S = await import('./js/state.js'); S.healParty(); });
const K = { '↑': 'ArrowUp', '↓': 'ArrowDown', '←': 'ArrowLeft', '→': 'ArrowRight' };
/** 안내 화살표만 보고 걷기: 지도가 바뀌거나 max 걸음까지 */
async function follow(max = 80) {
  const start = (await st()).map;
  for (let i = 0; i < max; i++) {
    const g = await guide(); if (!g.nav) return 'nonav';
    await walk(K[g.nav.dir] || K[(g.dir || '')[0]] || 'ArrowUp', 1); await idle(); // 목표 칸 위(가장자리)면 판 방향으로 한 걸음
    if ((await st()).map !== start) return 'moved';
  }
  return 'max';
}

await page.goto(URL);
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await page.evaluate(() => {
  localStorage.clear();
  const F = { oakEscort: true, placement: true, gotStarter: 25, rivalStarter: 133, rivalBattled: true, rivalLeft: true, pokedex: true, parcel: true, badge1: true, badge2: true, rival2: true, billAsk: true, billSaved: true, billGift: true, badge3: true, rival3: true, gotCut: true, badge4: true, scope: true, rival4: true, marowak: true, fujiSaved: true, flute: true, snorlax12: true, badge5: true, ch6End: true, rival5: true, silphFreed: true, badge6: true, badge7: true };
  localStorage.setItem('pokered_edu_save_v1', JSON.stringify({
    v: 1, name: '지우', rival: '오바람', grade: 2, map: 'ViridianCity', x: 32, y: 10, facing: 'up', started: 1, playMs: 3723000,
    party: [], box: [], bag: { 4: 10, 20: 5, 43: 1, 196: 1, 197: 1, 198: 1, 199: 1, 200: 1 }, money: 9000, flags: F,
    badges: ['boulder', 'cascade', 'thunder', 'rainbow', 'soul', 'marsh', 'volcano'], dex: { seen: { 25: 1 }, caught: { 25: 1 } }, respawn: { map: 'ViridianPokecenter', x: 3, y: 4 }, lastOutdoor: 'ViridianCity', learn: null, stats: { battles: 0, wins: 0, caught: 0 }, visited: ['ViridianCity', 'CinnabarIsland'],
  }));
});
await page.reload();
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await key('Space'); await page.waitForTimeout(1500);
await page.evaluate(() => { window.__pe.G.s.party = [
  { sp: 25, lv: 85, exp: 614125, iv: { atk: 15, def: 15, spe: 15, spc: 15, hp: 15 }, status: null, moves: [{ id: 'Thunderbolt', pp: 99 }, { id: 'Surf', pp: 99 }], hp: 300 },
  { sp: 131, lv: 85, exp: 614125, iv: { atk: 15, def: 15, spe: 15, spc: 15, hp: 15 }, status: null, moves: [{ id: 'Surf', pp: 99 }, { id: 'IceBeam', pp: 99 }, { id: 'PsychicM', pp: 99 }], hp: 380 }]; });
await heal();
let s, g;
// ① 상록시티 체육관
g = await guide(); ok('① 8판 끝 → 9판 목표: 상록시티 체육관', /상록시티 체육관/.test(g.text) && !!g.nav, JSON.stringify(g));
await tp('ViridianCity', 32, 8, 'up'); await walk('ArrowUp', 1); await idle();
s = await st(); ok('① 배지 7개면 체육관 문이 열림', s.map === 'ViridianGym', JSON.stringify([s.map, s.x, s.y]));
g = await guide(); ok('① 체육관 안 관장 안내', !!g.nav, JSON.stringify(g));
await tp('ViridianGym', 2, 2, 'up'); await key('Space');
await drive(async () => (await st()).flags.badge8 && (await calm()), 1500);
s = await st(); ok('① 비주기를 이기고 그린배지', !!s.flags.badge8 && s.badges.includes('earth'), JSON.stringify(s.badges));
// ② 22번도로 라이벌
await tp('ViridianCity', 2, 17, 'left'); g = await guide(); ok('② 상록시티: 서쪽 22번도로 안내', /22번도로/.test(g.text) && !!g.nav, JSON.stringify(g));
await heal(); await tp('Route22', 30, 5, 'left'); await walk('ArrowLeft', 2);
await drive(async () => (await st()).flags.rival6 && (await calm()), 1500);
s = await st(); ok('② 22번도로 라이벌 승부', !!s.flags.rival6, '');
g = await guide(); ok('② 관문 안내', /관문/.test(g.text) && !!g.nav, JSON.stringify(g));
// ③ 관문 → 23번도로
await tp('Route22Gate', 4, 1, 'up'); await walk('ArrowUp', 1); await idle();
s = await st(); ok('③ 배지 8개로 관문 통과', s.map === 'Route23', JSON.stringify([s.map, s.x, s.y]));
await tp('Route23', 8, 120); g = await guide(); ok('③ 23번도로 남쪽: 물가 파도타기 안내', /파도타기/.test(g.text) && !!g.nav, JSON.stringify(g));
const r1 = await follow(40); await key('Space'); await idle();
s = await st(); ok('③ 안내를 따라가 파도타기 시작', s.surf, JSON.stringify([r1, s.map, s.x, s.y]));
g = await guide(); ok('③ 물 위에서 챔피언로드 안내', /챔피언로드/.test(g.text) && !!g.nav, JSON.stringify(g));
// ④ 챔피언로드: 안내만 따라 걷기 (바위는 괴력으로)
await tp('VictoryRoad1F', 8, 16, 'up');
let r = await follow(90); s = await st(); ok('④ 1층 → 2층 (안내만 따라)', s.map === 'VictoryRoad2F', JSON.stringify([r, s.map, s.x, s.y]));
r = await follow(90); s = await st(); ok('④ 2층 → 3층 (바위를 밀며)', s.map === 'VictoryRoad3F', JSON.stringify([r, s.map, s.x, s.y]));
r = await follow(120); s = await st(); ok('④ 3층 → 2층 동쪽', s.map === 'VictoryRoad2F', JSON.stringify([r, s.map, s.x, s.y]));
r = await follow(60); s = await st(); ok('④ 2층 출구 → 23번도로', s.map === 'Route23', JSON.stringify([r, s.map, s.x, s.y]));
await shot('route23_after_vr');
g = await guide(); ok('⑤ 23번도로 북쪽: 석영고원 안내', /석영고원/.test(g.text) && !!g.nav, JSON.stringify(g));
r = await follow(60); s = await st(); ok('⑤ 안내를 따라 석영고원 도착', s.map === 'IndigoPlateau', JSON.stringify([r, s.map, s.x, s.y]));
r = await follow(20); s = await st(); ok('⑤ 포켓몬 리그 로비', s.map === 'IndigoPlateauLobby', JSON.stringify([r, s.map, s.x, s.y]));
r = await follow(30); s = await st(); ok('⑤ 로비 → 칸나의 방', s.map === 'LoreleisRoom', JSON.stringify([r, s.map, s.x, s.y]));
// ⑥ 사천왕
const ROOMS = [['LoreleisRoom', 'e4_1', 5, 4, 4], ['BrunosRoom', 'e4_2', 5, 4, 4], ['AgathasRoom', 'e4_3', 5, 4, 4], ['LancesRoom', 'e4_4', 6, 3, 5]];
for (const [m, f, x, y, ex] of ROOMS) {
  await tp(m, ex, 1, 'up'); await walk('ArrowUp', 1); await idle();
  s = await st(); ok(`⑥ ${m}: 이기기 전엔 문이 잠김`, s.map === m, JSON.stringify([s.map, s.x, s.y]));
  await heal(); await tp(m, x, y, 'up'); await walk('ArrowUp', 1);
  await drive(async () => (await st()).flags[f] && (await calm()), 1500);
  s = await st(); ok(`⑥ ${m}: 사천왕을 이김`, !!s.flags[f], '');
  if (m === 'LoreleisRoom') await shot('lorelei_after');
  r = await follow(40); s = await st(); ok(`⑥ ${m}: 안내를 따라 다음 방`, s.map !== m, JSON.stringify([r, s.map, s.x, s.y]));
}
// ⑦ 챔피언 → 명예의 전당 → 집
s = await st(); ok('⑦ 챔피언의 방 도착', s.map === 'ChampionsRoom', JSON.stringify([s.map, s.x, s.y]));
await heal(); await tp('ChampionsRoom', 4, 6, 'up'); await walk('ArrowUp', 2);
let sawPanel = false;
await drive(async () => { if (await page.evaluate(() => /명예의 전당/.test(document.querySelector('.panel')?.textContent || ''))) { if (!sawPanel) { sawPanel = true; await shot('hall_of_fame'); } } const s = await st(); return s.flags.champion && s.map === 'RedsHouse1F' && (await calm()); }, 3000);
s = await st();
ok('⑦ 챔피언을 이기고 명예의 전당 화면', sawPanel, '');
ok('⑦ 명예의 전당 기록 + 집으로', !!s.flags.champion && s.map === 'RedsHouse1F' && (s.hof || []).length === 1, JSON.stringify([s.map, s.hof]));
ok('⑦ 사천왕 다시 도전 가능 (방 깃발 초기화)', !s.flags.e4_1 && !s.flags.e4_4 && !s.flags.champWin, '');
g = await guide(); ok('⑧ 엔딩 뒤 목표', /챔피언 달성/.test(g.text), g.text);
ok('자바스크립트 오류 없음', errs.length === 0, errs.slice(0, 3).join(' | '));
console.log(`\n9판 결과: ${pass} 통과, ${fail} 실패`);
await browser.close();
process.exit(fail ? 1 : 0);
