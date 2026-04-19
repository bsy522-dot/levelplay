// 전체 풀플레이 테스트 - Act 0~5 연속 진행
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const url = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
const OUT = path.resolve(__dirname, '_shots');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

const errors = [], logs = [];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 420, height: 750 } });
  const page = await browser.newPage();
  page.on('console', m => {
    const s = m.text();
    if (m.type() === 'error') errors.push(s);
    else logs.push(s);
  });
  page.on('pageerror', e => errors.push('PAGE: ' + e.message));

  await page.goto(url, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2500));

  // Act 0 ~ 5 순차 진행
  for (let actN = 0; actN <= 5; actN++) {
    console.log(`\n===== ACT ${actN} =====`);
    await page.evaluate((n) => {
      window.STATE.scr = 'title';
      if (typeof startAct === 'function') startAct(n);
    }, actN);
    await new Promise(r => setTimeout(r, 500));

    const actInfo = await page.evaluate(() => {
      const A = window['ACT'+window.STATE.act];
      return { title: A?.title, scenes: A?.scenes?.length, season: A?.season };
    });
    console.log(`  제목: ${actInfo.title} | 씬: ${actInfo.scenes} | 시즌: ${actInfo.season}`);

    // 모든 씬 건너뛰기 (scene당 ~10번 탭)
    for (let i = 0; i < 120; i++) {
      const cur = await page.evaluate(() => window.STATE.scr);
      if (cur !== 'story') break;
      await page.evaluate(() => {
        if (window.KatokDialog?.advance) window.KatokDialog.advance();
      });
      await new Promise(r => setTimeout(r, 80));
    }

    // Act 완료 확인
    const final = await page.evaluate(() => ({
      scr: window.STATE.scr,
      act: window.STATE.act,
      party: window.STATE.party.map(p => p.name),
      flags: Object.keys(window.STATE.storyFlags),
      map: window.STATE.currentMap,
      badges: window.STATE.badges.length
    }));
    console.log(`  결과: scr=${final.scr} | 파티=[${final.party.join(',')}] | 플래그=${final.flags.length} | 맵=${final.map} | 배지=${final.badges}`);

    await page.screenshot({ path: path.join(OUT, `play_act${actN}.png`) });
  }

  // 전투 트리거
  console.log(`\n===== BATTLE TEST =====`);
  await page.evaluate(() => {
    window.STATE.scr = 'map';
    window.STATE.currentMap = 'route_1';
    const m = window.MAPS?.route_1;
    if (m && typeof triggerWildBattle === 'function') triggerWildBattle(m);
  });
  await new Promise(r => setTimeout(r, 800));
  const bs = await page.evaluate(() => ({
    scr: window.STATE.scr,
    enemy: window.Battle?.state?.enemy?.name,
    player: window.Battle?.state?.player?.name
  }));
  console.log(`  ${bs.player} vs ${bs.enemy}`);
  await page.screenshot({ path: path.join(OUT, `play_battle.png`) });

  // 체육관 테스트
  console.log(`\n===== GYM TEST =====`);
  await page.evaluate(() => {
    if (window.Gym?.LEADERS) {
      console.log('LEADERS:' + Object.keys(window.Gym.LEADERS).join(','));
    }
  });
  await new Promise(r => setTimeout(r, 300));

  // 세이브/로드
  console.log(`\n===== SAVE TEST =====`);
  const saveResult = await page.evaluate(() => {
    if (window.SaveGame?.save) {
      window.SaveGame.save();
      const has = !!localStorage.getItem('hatcuping_rpg3_save');
      return { saved: has };
    }
    return { saved: false };
  });
  console.log(`  저장: ${saveResult.saved}`);

  console.log(`\n===== TOTAL ERRORS: ${errors.length} =====`);
  errors.slice(0, 10).forEach(e => console.log('  ✗', e));
  console.log(`\n===== KEY LOGS =====`);
  logs.filter(l => l.includes('[V3]') || l.includes('LEADERS') || l.includes('ACT')).slice(0, 15).forEach(l => console.log('  ', l));

  await browser.close();
  process.exit(errors.length > 0 ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
