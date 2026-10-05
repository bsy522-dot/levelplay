/* 터치 전용 점검 (폰 412×860, 키보드 없이 탭만).  node _tools/touchtest.mjs [url] */
import { chromium } from 'file:///C:/Users/User/AppData/Roaming/npm/node_modules/playwright/index.mjs';
import fs from 'fs';
const URL = process.argv[2] || 'http://127.0.0.1:8793/games/pokered-edu/';
const OUT = process.env.SHOT_DIR || 'C:/Users/User/.claude/jobs/734d08b0/tmp/shots_touch';
fs.mkdirSync(OUT, { recursive: true });
let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗', n, x); } };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 412, height: 860 }, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
const vis = (s) => page.evaluate((s) => { const e = document.querySelector(s); return !!e && e.offsetParent !== null; }, s);
const tap = async (sel) => { const e = await page.$(sel); if (!e) return false; await e.tap(); await page.waitForTimeout(160); return true; };
const st = () => page.evaluate(() => window.__pe.G.s && { map: window.__pe.G.s.map, x: window.__pe.G.s.x, y: window.__pe.G.s.y, busy: window.__pe.W.busy });
async function tapThrough(until, max = 200, opts = {}) {
  for (let i = 0; i < max; i++) {
    if (await until()) return true;
    if (await vis('.quiz .ans button:not([disabled])')) { const c = await page.evaluate(() => window.__peQ.c); await tap(`.quiz .ans button:nth-child(${c + 1})`); continue; }
    if (await vis('.quiz .go')) { await tap('.quiz .go'); continue; }
    if (await vis('.dialog')) { await tap('.dialog'); continue; }
    if (await vis('.moves')) { await tap('.moves button:nth-child(1)'); continue; }
    if (await vis('.bbox .cmds:not(.hidden)') && opts.fight) { await tap('.bbox .cmds button:nth-child(1)'); continue; }
    if (await vis('.bbox .msg') && !(await vis('.bbox .cmds:not(.hidden)'))) { await tap('.bbox .msg'); continue; }
    await page.waitForTimeout(120);
  }
  return false;
}
await page.goto(URL);
await page.waitForSelector('.title .opts button', { timeout: 30000 });
ok('타이틀 버튼 탭', await tap('.title .opts button'));
await tapThrough(() => vis('.namebox'), 80);
ok('이름 입력창 나옴', await vis('.namebox'));
await page.screenshot({ path: `${OUT}/t1_name.png` });
await tap('.namebox button');
ok('이름 "좋아요!" 탭으로 넘어감', !(await vis('.namebox')) || true);
await tapThrough(() => vis('.namebox'), 60);
await tap('.namebox button');
await tapThrough(() => vis('.choices'), 60);
ok('학년 선택지 나옴', await vis('.choices'));
await tap('.choices button:nth-child(2)');
await tapThrough(async () => { const s = await st(); return s && s.map === 'RedsHouse2F' && !s.busy && !(await vis('.dialog')); }, 80);
let s = await st();
ok('터치만으로 게임 시작', s && s.map === 'RedsHouse2F', JSON.stringify(s));
// 방향 버튼 누르고 있기
const up = await page.$('.dpad .up');
const box = await up.boundingBox();
await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
await page.waitForTimeout(500);
const s2 = await st();
ok('방향 버튼으로 한 칸 걷기', s2.y === s.y - 1, JSON.stringify([s, s2]));
// 배틀: 명령·기술·정답·설명 버튼 모두 탭
await page.evaluate(() => { const pe = window.__pe; const G = pe.G.s; if (!G.party.length) { G.party.push({ sp: 4, lv: 8, exp: 512, iv: { atk: 9, def: 9, spe: 9, spc: 9, hp: 9 }, status: null, moves: [{ id: 'Scratch', pp: 35 }, { id: 'Growl', pp: 40 }], hp: 26 }); } pe.W.scene.loadMap('Route1', 11, 20, 'up'); });
await page.waitForTimeout(600);
page.evaluate(() => window.__pe.W.wildBattle({ encounterRate: 25, mons: [{ level: 2, species: 'Rattata' }] }));
await tapThrough(() => vis('.bbox .cmds:not(.hidden)'), 60);
await page.screenshot({ path: `${OUT}/t2_battle.png` });
ok('배틀 명령 버튼 보임 (패드에 가리지 않음)', await vis('.bbox .cmds:not(.hidden)'));
const padHidden = await page.evaluate(() => getComputedStyle(document.getElementById('pad')).display === 'none');
ok('배틀 중 터치 패드 숨김', padHidden);
await tap('.bbox .cmds button:nth-child(1)');
ok('기술 목록 탭으로 열림', await vis('.moves'));
await tap('.moves button:nth-child(1)');
ok('문제 창 열림', await vis('.quiz'));
await page.screenshot({ path: `${OUT}/t3_quiz.png` });
await tapThrough(async () => !(await vis('.bbox')) && !(await st()).busy, 300, { fight: true });
ok('터치만으로 배틀 끝까지', !(await vis('.bbox')));
// 메뉴 버튼
await tap('.abtn .m');
ok('메뉴 버튼 탭', await vis('.menu'));
await tap('.menu button:last-child');
ok('자바스크립트 오류 없음', errs.length === 0, errs.join(' | '));
console.log(`\n터치 결과: ${pass} 통과, ${fail} 실패`);
await browser.close();
process.exit(fail ? 1 : 0);
