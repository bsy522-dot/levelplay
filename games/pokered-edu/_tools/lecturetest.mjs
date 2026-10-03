/* 강의 보기 점검 (가짜 시계로 빨리 감기)
 *  - 강의 중 119초까지는 닫기 불가, 120초 뒤 닫힘
 *  - 앱이 화면에 없으면(숨김) 시계가 멈춤
 *  - 닫으면 같은 주제의 쉬운 새 문제(보기 3개)로 돌아오고, 맞히면 익힘 기록에 반(0.5)만 반영
 * 실행: node _tools/lecturetest.mjs [url] */
import { chromium } from 'file:///C:/Users/User/AppData/Roaming/npm/node_modules/playwright/index.mjs';
const URL = process.argv[2] || 'http://127.0.0.1:8793/games/pokered-edu/';
let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗', n, x); } };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 412, height: 860 }, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.clock.install();
// 화면에 고정된 창(position:fixed)은 offsetParent 가 null 이라 크기로 판정한다
const vis = (s) => page.evaluate((s) => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 0; }, s);
const L = () => page.evaluate(() => window.__peLecture);

await page.goto(URL);
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('pokered_edu_save_v1', JSON.stringify({
    v: 1, name: '테스트', rival: '오바람', grade: 2, map: 'PewterCity', x: 18, y: 30, facing: 'up',
    party: [{ sp: 25, lv: 50, exp: 125000, iv: { atk: 9, def: 15, spe: 15, spc: 9, hp: 15 }, status: null, moves: [{ id: 'Growl', pp: 99 }], hp: 999 }],
    box: [], bag: {}, money: 3000, flags: { oakEscort: true, placement: true, gotStarter: 25, pokedex: true }, badges: [],
    dex: { seen: {}, caught: {} }, respawn: { map: 'PewterPokecenter', x: 3, y: 4 }, lastOutdoor: 'PewterCity', learn: null, playMs: 0, stats: { battles: 0, wins: 0, caught: 0 },
  }));
});
await page.reload();
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await page.click('.title .opts button');
await page.waitForTimeout(1500);
await page.evaluate(() => { window.__pe.W.wildBattle({ encounterRate: 25, mons: [{ level: 40, species: 'Onix' }] }); }); // 배틀 끝을 기다리지 않는다
// 문제 창이 뜰 때까지 진행 (처음 보는 주제면 1분 카드도 넘긴다)
for (let i = 0; i < 200; i++) {
  if (await page.evaluate(() => { const x = document.querySelector('.quiz .ans button'); return !!x && !x.disabled; })) break;
  if (await vis('.bbox .cmds:not(.hidden)')) { await page.click('.bbox .cmds button:nth-child(1)'); await page.waitForTimeout(200); continue; }
  if (await vis('.moves')) { await page.click('.moves button:nth-child(1)'); await page.waitForTimeout(250); continue; }
  if (await vis('.quiz .go')) { await page.click('.quiz .go'); await page.waitForTimeout(200); continue; }
  if (await vis('.bbox .msg')) { await page.click('.bbox .msg'); await page.waitForTimeout(150); continue; }
  await page.waitForTimeout(150);
}
const before = await page.evaluate(() => window.__peQ);
ok('문제 창에 📺 강의 보기 버튼', await vis('.quiz .lec-btn'));
await page.tap('.quiz .lec-btn');
await page.waitForTimeout(300);
ok('강의 화면이 열림', await vis('.lecture'));
await page.screenshot({ path: 'C:/Users/User/.claude/jobs/734d08b0/tmp/shots_lecture_open.png' });
let st = await L();
ok('처음엔 닫기 버튼이 잠김 (2분)', await page.evaluate(() => document.querySelector('.lec-done').disabled) && st.remain > 115000, JSON.stringify(st));
await page.clock.fastForward(100000);
await page.waitForTimeout(100);
st = await L();
ok('100초 뒤: 아직 잠김, 남은 시간 약 20초', !st.over && st.remain > 15000 && st.remain < 25000, JSON.stringify(st));
await page.keyboard.press('Escape'); await page.keyboard.press('Space'); await page.waitForTimeout(150);
ok('잠긴 동안 Esc·스페이스로 못 나감', await vis('.lecture'));
// 앱을 내린 것처럼 숨김 → 60초 → 시계가 멈춰 있어야 한다
await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
await page.clock.fastForward(60000);
await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
await page.clock.fastForward(500);
await page.waitForTimeout(100);
const st2 = await L();
ok('앱이 숨겨진 60초 동안은 시간이 안 줄어듦', !st2.over && st2.remain > 14000, JSON.stringify(st2));
await page.clock.fastForward(25000);
await page.waitForTimeout(150);
const st3 = await L();
ok('합쳐 2분 뒤 열림', st3 && st3.over && !(await page.evaluate(() => document.querySelector('.lec-done').disabled)), JSON.stringify(st3));
await page.screenshot({ path: 'C:/Users/User/.claude/jobs/734d08b0/tmp/shots_lecture_done.png' });
await page.tap('.lec-done');
await page.waitForTimeout(300);
ok('강의 화면 닫힘', !(await vis('.lecture')));
const after = await page.evaluate(() => window.__peQ);
ok('같은 주제의 새 문제로 돌아옴', after && after.skill === before.skill, JSON.stringify([before.skill, after && after.skill]));
ok('쉬운 문제(보기 3개)', after && after.three && after.a.length === 3, JSON.stringify(after && after.a));
const lead = await page.evaluate(() => (document.querySelector('.quiz .jua') || {}).textContent || '');
ok('"강의를 봤으니" 안내 문구', lead.includes('강의를 봤으니'), lead);
await page.screenshot({ path: 'C:/Users/User/.claude/jobs/734d08b0/tmp/shots_lecture_back.png' });
await page.keyboard.press(String(after.c + 1));
await page.waitForTimeout(300);
const hist = await page.evaluate((id) => (window.__pe.G.s.learn.sk[id] || {}).hist, after.skill);
ok('강의 보고 맞힌 건 익힘 기록에 0.5로', hist && hist[hist.length - 1] === 0.5, JSON.stringify(hist));
ok('자바스크립트 오류 없음', errs.length === 0, errs.slice(0, 3).join(' | '));
console.log(`\n강의 결과: ${pass} 통과, ${fail} 실패`);
await browser.close();
process.exit(fail ? 1 : 0);
