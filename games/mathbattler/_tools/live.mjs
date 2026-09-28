/* 실전(GitHub Pages) 확인 — 푸시한 결과물이 진짜 살아 있는지 본다.
 * 실행: node _tools/live.mjs
 */
import { chromium } from 'file:///C:/Users/User/AppData/Roaming/npm/node_modules/playwright/index.mjs';
import fs from 'fs';

const URL = process.env.MB_LIVE || 'https://bsy522-dot.github.io/levelplay/games/mathbattler/';
const OUT = 'D:/_output/reports/mathbattler-live';
fs.mkdirSync(OUT, { recursive: true });
console.log('확인 대상: ' + URL);

const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
const errs = [];
page.on('pageerror', e => errs.push(String(e)));

const resp = await page.goto(URL, { waitUntil: 'networkidle', timeout: 45000 });
console.log('HTTP ' + (resp ? resp.status() : 'no response'));
await page.waitForFunction(() => window.MB && window.MB.game, { timeout: 25000 });
await page.waitForTimeout(2500);

/* 서비스워커가 옛 판을 들고 있을 수 있어 하드 리로드 */
await page.reload({ waitUntil: 'networkidle' });
await page.waitForFunction(() => window.MB && window.MB.game, { timeout: 25000 });
await page.waitForTimeout(2500);

const r = await page.evaluate(async () => {
  const g = window.MB.game;
  const L = document.getElementById('loading');
  const art = [];
  for (const p of g.list.slice(0, 4).flatMap(m => m.roster.slice(0, 2))) {
    const ok = await new Promise(res => {
      const im = new Image();
      im.onload = () => res(im.naturalWidth);
      im.onerror = () => res(0);
      im.src = g.artURL(p.art);
    });
    art.push(p.name + (ok ? ' OK' : ' FAIL'));
  }
  return {
    theme: g.skin.id,
    topics: g.list.length,
    cast: g.list.reduce((s, m) => s + m.roster.length, 0),
    uniq: new Set(g.list.flatMap(m => m.roster.map(x => x.id))).size,
    gates: g.world.gates.length,
    loadingGone: !L || L.className.indexOf('hidden') >= 0 || getComputedStyle(L).display === 'none',
    art,
  };
});
console.log(JSON.stringify(r, null, 1));
await page.screenshot({ path: OUT + '/live-1-지도.png' });

/* 전투 한 판 */
await page.evaluate(async () => {
  const g = window.MB.game;
  g.state.heroHp = 99; g.state.heroMaxHp = 99;
  g.startBattle(g.list[0]);
  const b = g.battle;
  for (let k = 0; k < 6 && !b.over; k++) {
    while (b.qi === k && !b.over) { b.busy = false; g.answer(b, b.cur().c); await new Promise(r => setTimeout(r, 10)); }
    await new Promise(r => setTimeout(r, 1100));
  }
});
await page.waitForTimeout(500);
const bt = await page.evaluate(() => ({
  name: document.getElementById('b-mname').textContent,
  slot: document.getElementById('b-slot').textContent,
  imgOk: document.getElementById('b-mimg').naturalWidth > 0,
}));
await page.screenshot({ path: OUT + '/live-2-배틀.png' });
console.log('배틀: ' + JSON.stringify(bt));

console.log('JS 오류: ' + (errs.length ? errs.join(' | ') : '없음'));
await b.close();
