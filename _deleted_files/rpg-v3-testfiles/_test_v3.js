// v3 브라우저 검증 — 타이틀 → 새 게임 → Act0 씬 진행 → 맵 → 대화
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const url = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
const OUT = path.resolve(__dirname, '_shots');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT);

const errors = [], warns = [], logs = [];

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', defaultViewport: { width: 420, height: 750 } });
  const page = await browser.newPage();

  page.on('console', m => {
    const t = m.type(), s = m.text();
    if (t === 'error') errors.push(s);
    else if (t === 'warning') warns.push(s);
    else logs.push(`[${t}] ${s}`);
  });
  page.on('pageerror', e => errors.push('PAGE: ' + e.message));

  await page.goto(url, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2500));

  // 1) 모듈 로드 확인
  const moduleCheck = await page.evaluate(() => ({
    dex: window.TINIPING_DEX?.length || 0,
    maps: Object.keys(window.MAPS || {}).length,
    acts: [0,1,2,3,4,5].filter(i => window['ACT'+i]).length,
    title: !!window.TitleScreen,
    dialog: !!window.KatokDialog,
    battle: !!window.Battle,
    state: window.STATE?.scr,
    maplist: Object.keys(window.MAPS || {}).slice(0, 8)
  }));
  console.log('MODULE:', JSON.stringify(moduleCheck));
  await page.screenshot({ path: path.join(OUT, '01_title.png') });

  // 2) 새 게임 시작 (타이틀 버튼 클릭 혹은 onTitleSelect 직접)
  await page.evaluate(() => { if (typeof onTitleSelect === 'function') onTitleSelect('new'); });
  await new Promise(r => setTimeout(r, 600));
  const afterNew = await page.evaluate(() => ({
    scr: window.STATE.scr,
    act: window.STATE.act,
    scenes: window['ACT0']?.scenes?.length,
    curScene: window['ACT0']?.scenes?.[0]?.id
  }));
  console.log('NEW_GAME:', JSON.stringify(afterNew));
  await page.screenshot({ path: path.join(OUT, '02_story_scene1.png') });

  // 3) 대사 진행 (6씬 × 반복 탭) — KatokDialog 내부를 advance로 빠르게
  for (let i = 0; i < 30; i++) {
    await page.evaluate(() => {
      if (window.KatokDialog?.skip) window.KatokDialog.skip();
      if (window.KatokDialog?.advance) window.KatokDialog.advance();
    });
    await new Promise(r => setTimeout(r, 250));
    const s = await page.evaluate(() => window.STATE.scr);
    if (s === 'map') break;
  }
  await page.screenshot({ path: path.join(OUT, '03_story_mid.png') });

  const afterStory = await page.evaluate(() => ({
    scr: window.STATE.scr,
    partyLen: window.STATE.party.length,
    partyNames: window.STATE.party.map(p => p.name),
    currentMap: window.STATE.currentMap,
    flags: Object.keys(window.STATE.storyFlags),
  }));
  console.log('AFTER_STORY:', JSON.stringify(afterStory));

  // 4) 맵 상태로 강제 전환 확인 (Act0 onComplete 후)
  if (afterStory.scr !== 'map') {
    await page.evaluate(() => {
      if (typeof finishAct === 'function') finishAct();
    });
    await new Promise(r => setTimeout(r, 400));
  }
  await page.screenshot({ path: path.join(OUT, '04_map.png') });

  // 5) 맵 이동 (위로 4칸)
  for (let i = 0; i < 4; i++) {
    await page.evaluate(() => { tU = true; });
    await new Promise(r => setTimeout(r, 200));
    await page.evaluate(() => { tU = false; });
    await new Promise(r => setTimeout(r, 100));
  }
  await page.screenshot({ path: path.join(OUT, '05_moved.png') });

  const mapState = await page.evaluate(() => ({
    scr: window.STATE.scr,
    pos: window.STATE.playerPos,
    mapId: window.STATE.currentMap,
    mapData: window.MAPS?.[window.STATE.currentMap] ? {
      name: window.MAPS[window.STATE.currentMap].name,
      w: window.MAPS[window.STATE.currentMap].w,
      h: window.MAPS[window.STATE.currentMap].h,
      npcs: (window.MAPS[window.STATE.currentMap].npcs || []).length,
      encounters: window.MAPS[window.STATE.currentMap].encounters
    } : null
  }));
  console.log('MAP:', JSON.stringify(mapState));

  // 6) 메뉴 / 도감 오픈 (실사용자 경로: 메뉴 버튼 클릭 시뮬레이트)
  await page.evaluate(() => {
    window.STATE.scr = 'menu';
    if (window.Menu){
      window.Menu.setData({party: window.STATE.party, bag: []});
      window.Menu.open('pokedex');
    }
  });
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(OUT, '06_menu.png') });

  // 7) 전투 강제 트리거
  await page.evaluate(() => {
    window.STATE.scr = 'map';
    const m = window.MAPS[window.STATE.currentMap];
    if (typeof triggerWildBattle === 'function' && m) triggerWildBattle(m);
  });
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(OUT, '07_battle.png') });
  const battleState = await page.evaluate(() => ({
    scr: window.STATE.scr,
    battle: window.Battle?.state ? {
      player: window.Battle.state.player?.name,
      enemy: window.Battle.state.enemy?.name,
      playerHp: window.Battle.state.player?.hp,
      enemyHp: window.Battle.state.enemy?.hp
    } : null
  }));
  console.log('BATTLE:', JSON.stringify(battleState));

  // 결과
  console.log('--- ERRORS:', errors.length);
  errors.slice(0, 20).forEach(e => console.log('  ✗', e));
  console.log('--- WARNS:', warns.length);
  warns.slice(0, 5).forEach(w => console.log('  ⚠', w));

  await browser.close();
  process.exit(errors.length > 0 ? 1 : 0);
})().catch(e => { console.error('FATAL', e); process.exit(2); });
