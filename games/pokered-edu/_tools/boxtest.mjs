/* 보관함 시험: 파티↔보관함 옮기기 + 자연으로 풀어주기 (취소·아니오·예) + 도감 기록 보존 + 파티 포켓몬 보호
 * 서버 없이 디스크에서 직접 읽어 준다(page.route) → 메모리가 모자라 서버를 못 켤 때도 돈다.
 * 실행: node _tools/boxtest.mjs */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'file:///C:/Users/User/AppData/Roaming/npm/node_modules/playwright/index.mjs';
const GAME = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = process.env.SHOT_DIR || 'C:/Users/User/.claude/jobs/734d08b0/tmp/shots_box';
fs.mkdirSync(OUT, { recursive: true });
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };
let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗', n, x); } };
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 412, height: 860 }, hasTouch: true });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.route('http://box.test/**', async (route) => {
  let p = decodeURIComponent(new URL(route.request().url()).pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(GAME, p);
  if (!f.startsWith(GAME) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return route.fulfill({ status: 404, body: '' });
  route.fulfill({ status: 200, contentType: MIME[path.extname(f)] || 'application/octet-stream', body: fs.readFileSync(f) });
});
const vis = (s) => page.evaluate((s) => !!document.querySelector(s), s);
const G = () => page.evaluate(() => { const s = window.__pe.G.s; return { party: s.party.map((m) => m.sp), box: s.box.map((m) => m.sp), dex: JSON.stringify(s.dex) }; });
const mon = (sp, lv) => ({ sp, lv, exp: lv * lv * lv, iv: { atk: 9, def: 9, spe: 9, spc: 9, hp: 9 }, status: null, moves: [{ id: 'Tackle', pp: 35 }], hp: 60 });
async function advance() { for (let i = 0; i < 40 && (await vis('.dialog') || await vis('.bbox')); i++) { await page.keyboard.press('Space'); await page.waitForTimeout(120); } }
const clickBoxRow = (i) => page.locator('.panel .list').nth(1).locator('.row').nth(i).click();
const clickChoice = (t) => page.locator('.choices button', { hasText: t }).first().click();

await page.goto('http://box.test/index.html');
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('pokered_edu_save_v1', JSON.stringify({
    v: 1, name: '지우', rival: '오바람', grade: 2, map: 'ViridianPokecenter', x: 3, y: 4, facing: 'up', started: 1, playMs: 0,
    party: [], box: [], bag: {}, money: 0, flags: { oakEscort: true, placement: true, gotStarter: 25, pokedex: true },
    badges: [], dex: { seen: { 25: 1, 19: 1, 16: 1 }, caught: { 25: 1, 19: 1, 16: 1 } }, respawn: { map: 'ViridianPokecenter', x: 3, y: 4 }, lastOutdoor: 'ViridianCity', learn: null, stats: { battles: 0, wins: 0, caught: 0 },
  }));
});
await page.reload();
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await page.keyboard.press('Space'); await page.waitForTimeout(1500);
await page.evaluate(([a, b]) => { const s = window.__pe.G.s; s.party = [a, b]; s.box = [{ ...a, sp: 19, lv: 5 }, { ...a, sp: 19, lv: 7 }, { ...a, sp: 16, lv: 4 }]; }, [mon(25, 30), mon(4, 28)]);
const dex0 = (await G()).dex;

page.evaluate(() => window.__pe.W.openBox()).catch(() => {});
await page.waitForSelector('.panel', { timeout: 10000 }).catch(() => {});
await advance(); // "PC에 접속했다" 말 넘기기
await page.waitForSelector('.panel .list', { timeout: 10000 });
ok('보관함 화면에 풀어주기 안내 문구', await page.evaluate(() => /풀어줄 수 있어요/.test(document.querySelector('.panel')?.textContent || '')));

// 취소
await clickBoxRow(0); await page.waitForSelector('.choices');
const labels = await page.evaluate(() => [...document.querySelectorAll('.choices button')].map((b) => b.textContent));
ok('보관함 포켓몬을 누르면 선택지 3개', labels.join('|') === '파티로 데려가기|자연으로 풀어주기|취소', labels.join('|'));
await page.screenshot({ path: `${OUT}/01_choices.png` });
const z = await page.evaluate(() => { const c = document.querySelector('.choices').getBoundingClientRect(), el = document.elementFromPoint(c.x + c.width / 2, c.y + c.height / 2); return !!el.closest('.choices'); });
ok('선택지가 보관함 화면 위에 보임(가려지지 않음)', z);
await clickChoice('취소'); await page.waitForTimeout(300);
let g = await G(); ok('취소하면 그대로 (보관함 3)', g.box.length === 3 && g.party.length === 2, JSON.stringify(g));

// 풀어주기 → 아니오
await clickBoxRow(0); await page.waitForSelector('.choices'); await clickChoice('자연으로 풀어주기');
await page.waitForSelector('.choices button:has-text("아니오")');
await page.screenshot({ path: `${OUT}/02_confirm.png` });
const q = await page.evaluate(() => document.querySelector('.dialog')?.textContent || '');
ok('확인 문장에 레벨·이름·되돌릴 수 없음', /Lv5/.test(q) && /꼬렛을/.test(q) && /다시 만날 수 없어요/.test(q), q);
await clickChoice('아니오'); await page.waitForTimeout(300);
g = await G(); ok('"아니오"면 그대로 (보관함 3)', g.box.length === 3, JSON.stringify(g));

// 풀어주기 → 예
await clickBoxRow(0); await page.waitForSelector('.choices'); await clickChoice('자연으로 풀어주기');
await page.waitForSelector('.choices button:has-text("예")'); await clickChoice('예');
await page.waitForFunction(() => /잘 가/.test(document.querySelector('.dialog')?.textContent || ''), null, { timeout: 8000 }).catch(() => {}); await page.screenshot({ path: `${OUT}/03_bye.png` });
const bye = await page.evaluate(() => document.querySelector('.dialog')?.textContent || '');
ok('작별 문장', /꼬렛은/.test(bye) && /잘 가/.test(bye), bye);
await advance(); await page.waitForTimeout(300);
g = await G();
ok('풀어주면 보관함에서 1마리 줄고 맞는 것이 사라짐 (꼬렛 Lv5)', g.box.length === 2 && g.box.join() === '19,16', JSON.stringify(g));
ok('파티는 그대로', g.party.join() === '25,4', JSON.stringify(g));
ok('도감 기록은 그대로', g.dex === dex0);
ok('목록이 다시 그려져 보관함 (2)', await page.evaluate(() => /보관함 \(2\)/.test(document.querySelector('.panel')?.textContent || '')));
const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('pokered_edu_save_v1') || localStorage.getItem(Object.keys(localStorage).find((k) => /save/.test(k)))).box.length);
ok('저장됨 (새로 켜도 2마리)', saved === 2, String(saved));

// 파티로 데려가기
await clickBoxRow(0); await page.waitForSelector('.choices'); await clickChoice('파티로 데려가기'); await page.waitForTimeout(300);
g = await G(); ok('"파티로 데려가기" 동작 (파티 3, 보관함 1)', g.party.length === 3 && g.box.length === 1, JSON.stringify(g));

// 파티 포켓몬은 풀어줄 수 없고 보관함으로만
await page.locator('.panel .list').nth(0).locator('.row').nth(2).click(); await page.waitForTimeout(300);
g = await G(); ok('파티 포켓몬을 누르면 보관함으로 (풀어주기 선택지 없음)', g.party.length === 2 && g.box.length === 2 && !(await vis('.choices')), JSON.stringify(g));

ok('자바스크립트 오류 없음', errs.length === 0, errs.slice(0, 3).join(' | '));
console.log(`\n보관함 결과: ${pass} 통과, ${fail} 실패`);
await browser.close();
process.exit(fail ? 1 : 0);
