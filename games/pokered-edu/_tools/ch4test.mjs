/* 4판 자동 플레이 테스트: 배표 → 상트앙느호(라이벌·선장 풀베기) → 9번도로 나무 베기 → 플래시 → 돌산터널 길 안내
 *   → 보라타운·지하통로 길 안내 → 무지개시티·체육관 나무 베기 → 민화 → 무지개배지 → 날아가기
 * 실행: node _tools/ch4test.mjs [url] */
import { chromium } from 'file:///C:/Users/User/AppData/Roaming/npm/node_modules/playwright/index.mjs';
const URL = process.argv[2] || 'http://127.0.0.1:8793/games/pokered-edu/';
const OUT = process.env.SHOT_DIR || 'C:/Users/User/.claude/jobs/734d08b0/tmp/shots_ch4';
import fs from 'fs'; fs.mkdirSync(OUT, { recursive: true });
let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗', n, x); } };
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 760 } })).newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message + ' ' + (e.stack || '').split('\n')[1]));
let n = 0; const shot = async (name) => { n++; await page.screenshot({ path: `${OUT}/${String(n).padStart(2, '0')}_${name}.png` }); };
const st = () => page.evaluate(() => { const s = window.__pe.G.s; return { map: s.map, x: s.x, y: s.y, busy: window.__pe.W.busy, flags: s.flags, bag: s.bag, badges: s.badges }; });
const vis = (s) => page.evaluate((s) => !!document.querySelector(s), s);
const key = async (k, t = 1) => { for (let i = 0; i < t; i++) { await page.keyboard.press(k); await page.waitForTimeout(90); } };
async function walk(dir, t) { for (let i = 0; i < t; i++) { await page.keyboard.down(dir); await page.waitForTimeout(170); await page.keyboard.up(dir); await page.waitForTimeout(90); } await page.waitForTimeout(300); }
async function drive(until, max = 800) {
  for (let i = 0; i < max; i++) {
    if (await until()) return true;
    if (await page.evaluate(() => { const b = document.querySelector('.quiz .ans button'); return b && !b.disabled; })) { const c = await page.evaluate(() => window.__peQ.c); await page.keyboard.press(String(c + 1)); await page.waitForTimeout(220); continue; }
    if (await vis('.choices')) { await key('Space'); continue; } // 첫 선택지(예)
    await page.keyboard.press('Space'); await page.waitForTimeout(110);
  }
  return false;
}
const idle = () => drive(async () => { const s = await st(); return !s.busy && !(await vis('.dialog')) && !(await vis('.bbox')) && !(await vis('.panel')) && !(await vis('.choices')); }, 300);
const tp = async (m, x, y, f = 'down') => { await page.evaluate(([m, x, y, f]) => window.__pe.W.scene.loadMap(m, x, y, f), [m, x, y, f]); await page.waitForTimeout(500); };
const guide = () => page.evaluate(() => { const o = window.__pe.W.objective(); const nv = window.__pe.W.scene.navTo(o.targets); return { text: o.text, nav: nv && { dir: nv.dir, dist: nv.dist } }; });

await page.goto(URL);
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('pokered_edu_save_v1', JSON.stringify({
    v: 1, name: '지우', rival: '오바람', grade: 2, map: 'VermilionCity', x: 18, y: 25, facing: 'down', started: 1, playMs: 0,
    party: [], box: [], bag: { 4: 10, 20: 5, 40: 3 }, money: 9000,
    flags: { oakEscort: true, placement: true, gotStarter: 25, rivalStarter: 133, rivalBattled: true, rivalLeft: true, pokedex: true, parcel: true, badge1: true, squirtleGift: true, gymIntro: true, badge2: true, rival2: true, gym2Intro: true, fossil: 140, nuggetRocket: true, billAsk: true, billSaved: true, billGift: true, gym3Intro: true, diglettGift: true, badge3: true },
    badges: ['boulder', 'cascade', 'thunder'], dex: { seen: { 25: 1 }, caught: { 25: 1 } }, respawn: { map: 'VermilionPokecenter', x: 3, y: 4 }, lastOutdoor: 'VermilionCity', learn: null, stats: { battles: 0, wins: 0, caught: 0 },
  }));
});
await page.reload();
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await key('Space');
await page.waitForTimeout(1500);
await page.evaluate(() => { window.__pe.G.s.party = [
  { sp: 25, lv: 50, exp: 125000, iv: { atk: 15, def: 15, spe: 15, spc: 15, hp: 15 }, status: null, moves: [{ id: 'Thunderbolt', pp: 99 }, { id: 'QuickAttack', pp: 99 }], hp: 180 },
  { sp: 6, lv: 50, exp: 125000, iv: { atk: 15, def: 15, spe: 15, spc: 15, hp: 15 }, status: null, moves: [{ id: 'Flamethrower', pp: 99 }, { id: 'Slash', pp: 99 }], hp: 180 }]; });
let s, g;

// ① 항구 → 배표
g = await guide();
ok('① 3판 끝 세이브 → 4판 목표: 항구', /항구/.test(g.text) && g.nav, JSON.stringify(g));
await tp('VermilionCity', 18, 30, 'down'); await walk('ArrowDown', 1); await idle();
s = await st();
ok('① 항구에 들어가면 배표(63)를 받음', s.map === 'VermilionDock' && s.bag[63] === 1, JSON.stringify([s.map, s.bag[63]]));
g = await guide(); ok('① 항구 → 배 입구 안내', g.nav, JSON.stringify(g));

// ② 배 2층 라이벌
await tp('SSAnne2F', 35, 10, 'right'); await walk('ArrowRight', 1); // 복도에서 오른쪽 끝으로 (33,5 는 벽)
await drive(async () => (await st()).flags.rival3 && !(await vis('.dialog')) && !(await vis('.bbox')), 900);
s = await st(); ok('② 상트앙느호 2층 라이벌 승부', !!s.flags.rival3, JSON.stringify(s.flags.rival3));
await shot('ssanne_rival');

// ③ 선장 → 풀베기
await tp('SSAnneCaptainsRoom', 4, 3, 'up'); await key('Space');
await drive(async () => (await st()).flags.gotCut && !(await vis('.dialog')) && !(await vis('.choices')), 200);
s = await st(); ok('③ 선장 등 쓸어 주기 → 비전머신01 풀베기', !!s.flags.gotCut && s.bag[196] === 1, JSON.stringify([s.flags.gotCut, s.bag[196]]));

// ④ 블루시티 → 9번도로 나무
await tp('CeruleanCity', 33, 16, 'right'); g = await guide();
ok('④ 블루시티: 동쪽 9번도로 안내', /9번도로/.test(g.text) && g.nav, JSON.stringify(g));
await tp('Route9', 4, 8, 'right'); g = await guide();
ok('④ 9번도로: 작은 나무를 가리킴', /나무/.test(g.text) && g.nav && g.nav.dist <= 1, JSON.stringify(g));
await key('Space'); await idle();
s = await st(); const cutDone = await page.evaluate(() => (window.__pe.G.s.cut || {}).Route9 || []);
ok('④ A → “예” → 나무를 벰', cutDone.includes('5,8'), JSON.stringify(cutDone));
await walk('ArrowRight', 2); s = await st();
ok('④ 벤 자리로 지나감', s.x >= 6, JSON.stringify([s.x, s.y]));
await shot('route9_cut');

// ⑤ 플래시
await tp('Route10', 11, 22, 'up'); g = await guide();
ok('⑤ 10번도로: 포켓몬센터(오박사 조수) 안내', /조수/.test(g.text) && g.nav, JSON.stringify(g));
const darkBefore = await page.evaluate(async () => (await import('./js/world/field.js')).isDark('RockTunnel1F'));
await tp('RockTunnelPokecenter', 7, 4, 'up'); await key('Space'); await idle();
s = await st(); const darkAfter = await page.evaluate(async () => (await import('./js/world/field.js')).isDark('RockTunnel1F'));
ok('⑤ 조수에게 플래시(200) → 돌산터널이 밝아짐', s.bag[200] === 1 && darkBefore && !darkAfter, JSON.stringify([s.bag[200], darkBefore, darkAfter]));

// ⑥ 돌산터널 층별 길 안내
for (const [m, x, y, want] of [['RockTunnel1F', 15, 4, '사다리'], ['RockTunnelB1F', 33, 25, '사다리'], ['RockTunnel1F', 37, 17, '출구'], ['Route10', 8, 56, '보라타운'], ['LavenderTown', 10, 9, '8번도로'], ['Route8', 50, 8, '지하통로'], ['UndergroundPathWestEast', 47, 2, '서쪽'], ['Route7', 10, 9, '무지개시티']]) {
  await tp(m, x, y); g = await guide();
  ok(`⑥ 길 안내 ${m}(${x},${y}) → ${want}`, new RegExp(want).test(g.text) && !!g.nav, JSON.stringify(g));
}
await tp('RockTunnel1F', 15, 4); await shot('rocktunnel_flash');

// ⑦ 무지개시티 나무 → 체육관 나무 → 민화
await tp('CeladonCity', 35, 31, 'down'); await key('Space'); await idle();
await tp('CeladonGym', 5, 8, 'up'); await key('Space'); await idle();
const cuts = await page.evaluate(() => window.__pe.G.s.cut);
ok('⑦ 무지개시티·체육관 나무 베기', (cuts.CeladonCity || []).includes('35,32') && (cuts.CeladonGym || []).includes('5,7'), JSON.stringify(cuts));
await tp('CeladonGym', 4, 4, 'up'); await key('Space');
await drive(async () => (await st()).flags.badge4 && !(await vis('.dialog')) && !(await vis('.bbox')) && !(await vis('.panel')), 1500);
s = await st(); ok('⑦ 관장 민화를 이기고 무지개배지', !!s.flags.badge4 && s.badges.includes('rainbow'), JSON.stringify(s.badges));
await idle();
await shot('erika_badge');

// ⑧ 날아가기 선물 + 날기
await tp('CeladonPokecenter', 7, 4, 'up'); await key('Space'); await idle();
s = await st(); ok('⑧ 무지개시티 신사에게 날아가기(197)', s.bag[197] === 1, JSON.stringify(s.bag[197]));
await tp('CeladonCity', 41, 10, 'down');
const flyList = await page.evaluate(async () => (await import('./js/world/field.js')).flyTargets().map((t) => t.id));
ok('⑧ 날아갈 수 있는 도시에 갈색시티·무지개시티', flyList.includes('VermilionCity') && flyList.includes('CeladonCity'), JSON.stringify(flyList));
await page.evaluate(async () => { const F = await import('./js/world/field.js'); const p = F.flySpot('VermilionCity'); await window.__pe.W.scene.loadMap('VermilionCity', p.x, p.y, 'down'); });
s = await st(); ok('⑧ 갈색시티 포켓몬센터 앞으로 날아감', s.map === 'VermilionCity', JSON.stringify([s.map, s.x, s.y]));
// 돌 진화
const raichu = await page.evaluate(async () => { const M = await import('./js/battle/mech.js'); return M.stoneTarget({ sp: 25 }, 'ThunderStone'); });
ok('⑨ 천둥의돌: 피카츄 → 라이츄(26)', raichu === 26, String(raichu));
g = await guide(); ok('⑩ 4판 끝 목표 문구', /4판 완료|로켓단|5판/.test(g.text), g.text);
ok('자바스크립트 오류 없음', errs.length === 0, errs.slice(0, 3).join(' | '));
console.log(`\n4판 결과: ${pass} 통과, ${fail} 실패`);
await browser.close();
process.exit(fail ? 1 : 0);
