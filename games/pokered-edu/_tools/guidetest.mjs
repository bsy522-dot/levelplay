/* 안내판만 보고 걷기 테스트: 순간이동 없이 '다음 목표' 길 안내(방향·걸음 수)만 따라간다.
 * 달맞이산 입구 → (야생·트레이너 배틀) → 지하 2층 과학자·화석 → 출구 → 4번도로 → 블루시티(라이벌) → 체육관 → 이슬
 * 안내가 길을 못 찾거나 누가 길을 막으면 실패.   node _tools/guidetest.mjs [url] */
import { chromium } from 'file:///C:/Users/User/AppData/Roaming/npm/node_modules/playwright/index.mjs';
import fs from 'fs';
const URL = process.argv[2] || 'http://127.0.0.1:8793/games/pokered-edu/';
const OUT = process.env.SHOT_DIR || 'C:/Users/User/.claude/jobs/734d08b0/tmp/shots_guide';
fs.mkdirSync(OUT, { recursive: true });
let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗', n, x); } };
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 760 } })).newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
const st = () => page.evaluate(() => { const s = window.__pe.G.s; return { map: s.map, x: s.x, y: s.y, busy: window.__pe.W.busy, flags: s.flags }; });
const vis = (s) => page.evaluate((s) => !!document.querySelector(s), s);
async function settle(max = 900) { // 대화·배틀·문제를 끝낸다
  for (let i = 0; i < max; i++) {
    const s = await st();
    if (!s.busy && !(await vis('.dialog')) && !(await vis('.bbox')) && !(await vis('.panel')) && !(await vis('.quiz')) && !(await vis('.choices'))) return;
    if (await page.evaluate(() => { const b = document.querySelector('.quiz .ans button'); return b && !b.disabled; })) { const c = await page.evaluate(() => window.__peQ.c); await page.keyboard.press(String(c + 1)); await page.waitForTimeout(200); continue; }
    await page.keyboard.press('Space'); await page.waitForTimeout(100);
  }
}
const KEY = { '↑': 'ArrowUp', '↓': 'ArrowDown', '←': 'ArrowLeft', '→': 'ArrowRight' };
async function arrive(s) {
  const d = await page.evaluate(() => { const m = window.__pe.W.scene.map, g = window.__pe.G.s; return g.y === 0 ? 'ArrowUp' : g.y === m.h - 1 ? 'ArrowDown' : g.x === 0 ? 'ArrowLeft' : g.x === m.w - 1 ? 'ArrowRight' : m.id === 'MtMoonB2F' ? 'ArrowLeft' : 'ArrowUp'; });
  await page.keyboard.down(d); await page.waitForTimeout(160); await page.keyboard.up(d); await page.waitForTimeout(250);
  await page.keyboard.press('Space'); await settle(1500);
}
let shots = 0;
/** 안내만 따라 걷기. stop(s) 가 참이면 끝. onArrive(s, nav) 로 목표 도착 시 행동 */
async function follow(label, stop, onArrive, maxSteps = 900) {
  let stuck = 0, lastPos = '', lastMap = '';
  const trail = []; // 실패하면 지나온 지도를 보여 준다 (어디서 길이 틀어졌는지)
  for (let i = 0; i < maxSteps; i++) {
    await settle();
    const s = await st();
    if (s.map !== lastMap) { trail.push(`${s.map}(${s.x},${s.y})`); lastMap = s.map; }
    if (await stop(s)) return true;
    const nav = await page.evaluate(() => { const o = window.__pe.W.objective(); return { text: o.text, nav: window.__pe.W.scene.navTo(o.targets) }; });
    if (!nav.nav) { ok(`${label}: 안내가 길을 찾음 (${s.map} ${s.x},${s.y} — ${nav.text})`, false); console.log('    지나온 길:', trail.slice(-8).join(' → ')); await page.screenshot({ path: `${OUT}/stuck_${++shots}.png` }); return false; }
    if (nav.nav.dist === 0) { await onArrive(s, nav.nav); await page.waitForTimeout(300); continue; }
    const pos = `${s.map},${s.x},${s.y}`;
    stuck = pos === lastPos ? stuck + 1 : 0; lastPos = pos;
    if (stuck > 12) { ok(`${label}: 막히지 않음 (${pos} 에서 ${nav.nav.dir} 로 못 감 — ${nav.text})`, false); await page.screenshot({ path: `${OUT}/blocked_${++shots}.png` }); return false; }
    await page.keyboard.down(KEY[nav.nav.dir]); await page.waitForTimeout(160); await page.keyboard.up(KEY[nav.nav.dir]); await page.waitForTimeout(80);
  }
  ok(`${label}: 걸음 수 안에 도착`, false); return false;
}

await page.goto(URL);
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await page.evaluate(() => {
  localStorage.setItem('pokered_edu_save_v1', JSON.stringify({
    v: 1, name: '지우', rival: '오바람', grade: 3, map: 'Route4', x: 18, y: 6, facing: 'up', party: [], box: [], bag: { 4: 10, 20: 9 }, money: 9000,
    flags: { oakEscort: true, placement: true, gotStarter: 25, rivalStarter: 133, rivalBattled: true, rivalLeft: true, pokedex: true, parcel: true, badge1: true, squirtleGift: true, gymIntro: true },
    badges: ['boulder'], dex: { seen: {}, caught: {} }, respawn: { map: 'MtMoonPokecenter', x: 3, y: 4 }, lastOutdoor: 'Route4', learn: null, playMs: 0, stats: { battles: 0, wins: 0, caught: 0 },
  }));
});
await page.reload();
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await page.keyboard.press('Space');
await page.waitForTimeout(1500);
await page.evaluate(() => { window.__pe.G.s.party = [{ sp: 25, lv: 50, exp: 125000, iv: { atk: 15, def: 15, spe: 15, spc: 15, hp: 15 }, status: null, moves: [{ id: 'Thunderbolt', pp: 99 }, { id: 'QuickAttack', pp: 99 }, { id: 'Slam', pp: 99 }], hp: 180 }]; });
await page.keyboard.down('ArrowUp'); await page.waitForTimeout(160); await page.keyboard.up('ArrowUp');
// 지도 넘어가는 화면 전환이 끝날 때까지 기다린다 (키를 뗀 직후엔 아직 4번도로 — 예전엔 여기서 거짓 실패)
await page.waitForFunction(() => window.__pe.G.s.map === 'MtMoon1F', null, { timeout: 3000 }).catch(() => {});
await settle();
ok('달맞이산 입구로 들어감', (await st()).map === 'MtMoon1F');

const r1 = await follow('달맞이산 → 화석', (s) => !!s.flags.fossil, arrive);
ok('안내만 따라 과학자에게 가서 화석 받음', r1);
const r2 = await follow('화석 → 출구', (s) => s.map === 'Route4', arrive);
ok('안내만 따라 달맞이산 출구로 나감', r2);
const goal4 = await page.evaluate(() => window.__pe.W.objective().text);
ok('출구로 나온 뒤 안내가 동쪽(블루시티)을 가리킴', /동쪽|블루시티/.test(goal4), goal4);
ok('안내만 따라 블루시티 + 라이벌', await follow('4번도로 → 블루시티', (s) => s.map === 'CeruleanCity' && !!s.flags.rival2, arrive));
ok('안내만 따라 체육관 트레이너를 지나 이슬 → 블루배지 (갇힘 없음)', await follow('블루시티 → 이슬', (s) => !!s.flags.badge2, arrive, 1500));
await page.screenshot({ path: `${OUT}/badge2.png` });
ok('안내만 따라 너겟 브릿지 → 이수재 구하기', await follow('블루시티 → 이수재', (s) => !!s.flags.billSaved, async (s) => { await arrive(s); if ((await st()).map === 'BillsHouse' && (await st()).flags.billAsk) { /* PC 질문 */ } }, 2000));
// 이수재는 목표 칸(4,5)의 바로 위(4,4)에 서 있다 → 아이처럼 위를 보고 말을 건다 (예전엔 PC 쪽을 본 채 A만 눌러 거짓 실패)
ok('이수재의 선물 받기', await follow('이수재 선물', (s) => !!s.flags.billGift, arrive, 200));
ok('안내만 따라 지하통로 → 갈색시티 → 마티스 → 오렌지배지', await follow('이수재 → 마티스', (s) => !!s.flags.badge3, arrive, 3000));
await page.screenshot({ path: `${OUT}/badge3.png` });
ok('자바스크립트 오류 없음', errs.length === 0, errs.slice(0, 3).join(' | '));
console.log(`\n안내 따라 걷기: ${pass} 통과, ${fail} 실패`);
await browser.close();
process.exit(fail ? 1 : 0);
