/* 지도 사진: 지도마다 불러와 화면을 찍는다 (새 판 지도가 제대로 그려지는지 눈으로 확인)
 * 실행: node _tools/mapshots.mjs 지도1,지도2,... [저장 폴더] */
import fs from 'fs';
import { chromium } from 'file:///C:/Users/User/AppData/Roaming/npm/node_modules/playwright/index.mjs';
const URL = process.env.URL || 'http://127.0.0.1:8793/games/pokered-edu/';
const ids = (process.argv[2] || '').split(',').filter(Boolean);
const OUT = process.argv[3] || 'C:/Users/User/.claude/jobs/734d08b0/tmp/mapshots';
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 760 } })).newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(URL);
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('pokered_edu_save_v1', JSON.stringify({ v: 1, name: '테스트', rival: '오바람', grade: 2, map: 'PalletTown', x: 5, y: 6, facing: 'down',
    party: [{ sp: 25, lv: 50, exp: 125000, iv: { atk: 15, def: 15, spe: 15, spc: 15, hp: 15 }, status: null, moves: [{ id: 'Thunderbolt', pp: 99 }], hp: 180 }], box: [], bag: {}, money: 3000,
    flags: { oakEscort: true, placement: true, gotStarter: 25, pokedex: true }, badges: [], dex: { seen: {}, caught: {} }, respawn: { map: 'PalletTown', x: 5, y: 6 }, lastOutdoor: 'PalletTown', learn: null, playMs: 0, stats: { battles: 0, wins: 0, caught: 0 } }));
});
await page.reload();
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await page.keyboard.press('Space');
await page.waitForTimeout(1500);
for (const id of ids) {
  const at = await page.evaluate((id) => {
    const m = window.__pe.DB.maps[id]; if (!m) return null;
    // 걸을 수 있는 칸 중 가운데에 가까운 곳
    let best = null, bd = 1e9;
    for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if ('.,"*_'.includes(m.grid[y][x])) { const d = Math.abs(x - m.w / 2) + Math.abs(y - m.h / 2); if (d < bd) { bd = d; best = { x, y }; } }
    return best;
  }, id);
  if (!at) { console.log('없음', id); continue; }
  await page.evaluate(([id, x, y]) => window.__pe.W.scene.loadMap(id, x, y, 'down', { quiet: true }), [id, at.x, at.y]);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${id}.png` });
}
console.log('찍음', ids.length, '오류', errs.length, errs.slice(0, 3).join(' | '));
await browser.close();
