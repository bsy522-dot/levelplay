/* 진단용: 콘솔·네트워크 오류와 장면 상태를 출력한다.  node _tools/dbg.mjs [대기ms] */
import { chromium } from 'file:///C:/Users/User/AppData/Roaming/npm/node_modules/playwright/index.mjs';
const wait = Number(process.argv[2] || 6000);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 760 } });
page.on('console', (m) => { const t = m.text(); if (!t.includes('GL Driver')) console.log('[' + m.type() + ']', t.slice(0, 400)); });
page.on('pageerror', (e) => console.log('[pageerror]', e.message, (e.stack || '').slice(0, 600)));
page.on('response', (r) => { if (r.status() >= 400) console.log('[http ' + r.status() + ']', r.url()); });
await page.goto('http://127.0.0.1:8793/games/pokered-edu/');
await page.waitForTimeout(wait);
console.log(await page.evaluate(() => JSON.stringify({
  pe: !!window.__pe, game: !!window.__game,
  scenes: window.__game ? window.__game.scene.scenes.map((s) => s.sys.settings.key + ':' + s.sys.settings.status) : null,
  boot: !!document.getElementById('boot'),
})));
await browser.close();
