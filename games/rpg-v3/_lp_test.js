// LevelPlay 배포 브라우저 검증
const puppeteer = require('puppeteer');
const path = require('path');

const url = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
const errors = [];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 420, height: 750 } });
  const page = await browser.newPage();
  page.on('console', m => { if (m.type()==='error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGE: ' + e.message));

  await page.goto(url, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2500));

  const chk = await page.evaluate(() => ({
    dex: window.TINIPING_DEX?.length || 0,
    maps: Object.keys(window.MAPS || {}).length,
    acts: [0,1,2,3,4,5].filter(i => window['ACT'+i]).length,
    sprites: typeof ROMI_S !== 'undefined' && typeof HATCHU_S !== 'undefined' && typeof MONJU_S !== 'undefined',
    state: window.STATE?.scr
  }));
  console.log('LEVELPLAY_CHK:', JSON.stringify(chk));
  console.log('ERRORS:', errors.length);
  errors.slice(0,5).forEach(e => console.log('  ✗', e));

  await browser.close();
  process.exit(errors.length > 0 || !chk.sprites || chk.dex !== 41 ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
