/* 2판 자동 플레이 테스트: 회색시티 동쪽 → 3번도로 → 달맞이산(화석) → 4번도로 → 블루시티(라이벌) → 이슬
 * 실행: node _tools/ch2test.mjs [url] */
import { chromium } from 'file:///C:/Users/User/AppData/Roaming/npm/node_modules/playwright/index.mjs';
import fs from 'fs';
const URL = process.argv[2] || 'http://127.0.0.1:8793/games/pokered-edu/';
const OUT = process.env.SHOT_DIR || 'C:/Users/User/.claude/jobs/734d08b0/tmp/shots_ch2';
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

// 1판을 끝낸 상태의 세이브를 만든다
await page.goto(URL);
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await page.evaluate(() => {
  const pe = window.__pe;
  localStorage.setItem('pokered_edu_save_v1', JSON.stringify({
    v: 1, name: '지우', rival: '오바람', grade: 2, map: 'PewterCity', x: 33, y: 17, facing: 'right',
    party: [], box: [], bag: { 4: 10, 20: 5 }, money: 5000,
    flags: { oakEscort: true, placement: true, gotStarter: 25, rivalStarter: 133, rivalBattled: true, rivalLeft: true, pokedex: true, parcel: true, badge1: true, squirtleGift: true, gymIntro: true },
    badges: ['boulder'], dex: { seen: { 25: 1 }, caught: { 25: 1 } }, respawn: { map: 'PewterPokecenter', x: 3, y: 4 }, lastOutdoor: 'PewterCity', learn: null, playMs: 0, stats: { battles: 0, wins: 0, caught: 0 },
  }));
});
await page.reload();
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await key('Space');
await page.waitForTimeout(1500);
// 강한 피카츄·꼬부기 (연결·이야기 점검용)
await page.evaluate(() => { const s = window.__pe.G.s; s.party = [{ sp: 25, lv: 40, exp: 64000, iv: { atk: 12, def: 12, spe: 12, spc: 12, hp: 15 }, status: null, moves: [{ id: 'Thundershock', pp: 30 }, { id: 'QuickAttack', pp: 30 }, { id: 'Thunderbolt', pp: 15 }], hp: 150 }, { sp: 7, lv: 40, exp: 64000, iv: { atk: 12, def: 12, spe: 12, spc: 12, hp: 15 }, status: null, moves: [{ id: 'WaterGun', pp: 25 }, { id: 'Tackle', pp: 35 }], hp: 150 }]; });
await tp('PewterCity', 38, 17, 'right');
await walk('ArrowRight', 3);
await idle();
let s = await st();
ok('회색시티 → 3번도로 (배지 후 동쪽 길)', s.map === 'Route3', JSON.stringify([s.map, s.x, s.y]));
await shot('route3');
await tp('Route3', 60, 1, 'up');
await walk('ArrowUp', 2);
await idle();
s = await st();
ok('3번도로 → 4번도로', s.map === 'Route4', JSON.stringify([s.map, s.x, s.y]));
await shot('route4_mtmoon_entrance');
await tp('Route4', 18, 6, 'up');
await walk('ArrowUp', 1);
await idle();
s = await st();
ok('4번도로 동굴 입구 → 달맞이산 1층', s.map === 'MtMoon1F', JSON.stringify([s.map, s.x, s.y]));
await shot('mtmoon1f');
await tp('MtMoon1F', 5, 6, 'up');
await walk('ArrowUp', 1);
await idle();
s = await st();
ok('사다리 → 지하 1층', s.map === 'MtMoonB1F', JSON.stringify([s.map, s.x, s.y]));
await shot('mtmoonb1f');
await tp('MtMoonB2F', 13, 8, 'left');
await key('Space');
await drive(async () => (await st()).flags.fossil && !(await vis('.dialog')) && !(await vis('.bbox')), 600);
s = await st();
ok('과학자를 이기고 화석 포켓몬 받기', !!s.flags.fossil && s.party.some((m) => m[0] === 140 || m[0] === 138), JSON.stringify(s.party));
await shot('fossil');
await tp('MtMoonB1F', 26, 3, 'right');
await walk('ArrowRight', 1);
await idle();
s = await st();
ok('지하 1층 사다리 → 4번도로 동쪽 출구', s.map === 'Route4' && s.x > 20, JSON.stringify([s.map, s.x, s.y]));
await tp('Route4', 88, 4, 'right');
await walk('ArrowRight', 2);
await drive(async () => (await st()).flags.rival2 && !(await st()).busy && !(await vis('.dialog')), 800);
s = await st();
ok('4번도로 → 블루시티, 라이벌 재대결', s.map === 'CeruleanCity' && !!s.flags.rival2, JSON.stringify([s.map, s.flags.rival2]));
await shot('cerulean');
await tp('CeruleanGym', 4, 3, 'up');
await shot('cerulean_gym');
await key('Space');
let gymQ = false;
await drive(async () => { if (!gymQ && await vis('.quiz .ans')) { gymQ = true; await shot('misty_quiz'); } return (await st()).flags.badge2 && await vis('.panel'); }, 1500);
await shot('chapter2_end');
s = await st();
ok('이슬을 이기고 블루배지 → 2판 완료', !!s.flags.badge2, JSON.stringify(s.flags));
ok('자바스크립트 오류 없음', errs.length === 0, errs.slice(0, 4).join(' || '));
console.log(`\n2판 결과: ${pass} 통과, ${fail} 실패`);
if (fails.length) console.log(' - ' + fails.join('\n - '));
await browser.close();
process.exit(fail ? 1 : 0);
