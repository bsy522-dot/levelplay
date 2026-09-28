/* 로컬 완성본 화면 확인 — 병석님이 직접 보실 수 있게 캡처한다.
 * 실행: node _tools/shot.mjs
 */
import { chromium } from 'file:///C:/Users/User/AppData/Roaming/npm/node_modules/playwright/index.mjs';
import fs from 'fs';

const BASE = 'http://127.0.0.1:8791/games/mathbattler/';
const OUT = 'D:/_output/reports/mathbattler-view';
fs.mkdirSync(OUT, { recursive: true });

const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 2 });
page.on('pageerror', e => console.log('  [JS오류] ' + e.message));
page.on('console', m => { if (m.type() === 'error') console.log('  [콘솔오류] ' + m.text()); });

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.MB && window.MB.game, { timeout: 15000 });
await page.waitForTimeout(900);

const info = await page.evaluate(() => {
  const g = window.MB.game;
  return {
    theme: g.skin.id,
    topics: g.list.length,
    cast: g.list.reduce((s, m) => s + m.roster.length, 0),
    gates: g.world.gates.length,
    roster: g.list.map(m => m.roster.map(r => r.name).join('·')),
  };
});
console.log(`테마=${info.theme}  토픽=${info.topics}  전투지점=${info.gates}  캐스터=${info.cast}마리`);
console.log('\n토픽별 무리 (앞 12개):');
info.roster.slice(0, 12).forEach((r, i) => console.log(`  ${String(i + 1).padStart(2)}. ${r}`));
console.log(`  ... 외 ${info.roster.length - 12}개`);

await page.screenshot({ path: OUT + '/1-지도.png' });
console.log('\n[1] 지도 저장');

// 여러 마리가 모인 지점(무리 3마리 이상)을 찾아 그 앞에 서서 전투
const target = await page.evaluate(() => {
  const g = window.MB.game;
  const big = g.list.findIndex(m => m.roster.length >= 3);
  const gt = g.world.gates[big >= 0 ? big : 0];
  g.hero.x = gt.x * g.world.tile - 60;
  g.hero.y = gt.y * g.world.tile + g.world.tile / 2;
  return { idx: gt.idx, names: g.list[gt.idx].roster.map(r => r.name) };
});
await page.waitForTimeout(500);
await page.screenshot({ path: OUT + '/2-갈대밭-조우전.png' });
console.log(`[2] 조우 지점 앞: ${target.names.join(' → ')} (무리 ${target.names.length}마리)`);

// 전투 시작 — 문제 풀어서 다음 포켓몬으로 넘어가는지까지 본다
await page.evaluate(i => window.MB.game.startBattle(window.MB.game.list[i]), target.idx);
await page.waitForTimeout(600);
await page.screenshot({ path: OUT + '/3-배틀-첫번째.png' });
const s1 = await page.evaluate(() => ({
  name: document.getElementById('b-mname').textContent,
  slot: document.getElementById('b-slot').textContent,
  imgOk: document.getElementById('b-mimg').naturalWidth > 0,
  q: document.getElementById('b-q').textContent.slice(0, 50),
  opts: document.querySelectorAll('#b-opts .opt').length,
}));
console.log(`[3] 전투 시작: ${s1.name} / ${s1.slot} / 이미지 ${s1.imgOk ? 'OK' : 'FAIL'} / 선택지 ${s1.opts}개`);
console.log(`     문제: ${s1.q}…`);

// 이겨서 무리 2번째로 넘어가는 순간을 캡처
// ★(1) 상대 HP = 문제 수(6개)라서 6개를 다 풀어야 다음 상대가 나온다.
//   (2) 문제 사이엔 1초 채점 애니메이션이 있다 → 전부 풀고 충분히 기다린 뒤 캡처.
//   (3) 정답을 6개 연속 주되 타이머가 겹치지 않게 1.1초씩 간격을 둔다.
await page.evaluate(async () => {
  const g = window.MB.game;
  g.state.heroHp = 99; g.state.heroMaxHp = 99;
  const b = g.battle;
  for (let k = 0; k < 6 && !b.over; k++) {
    while (b.qi === k && !b.over) { b.busy = false; g.answer(b, b.cur().c); await new Promise(r => setTimeout(r, 10)); }
    await new Promise(r => setTimeout(r, 1100));
  }
});
await page.waitForTimeout(600);
const s2 = await page.evaluate(() => ({
  name: document.getElementById('b-mname').textContent,
  slot: document.getElementById('b-slot').textContent,
  imgOk: document.getElementById('b-mimg').naturalWidth > 0,
  img: document.getElementById('b-mimg').getAttribute('src'),
}));
await page.screenshot({ path: OUT + '/4-배틀-두번째로.png' });
console.log(`[4] 다음 상대: ${s2.name} / ${s2.slot} / 이미지 ${s2.imgOk ? 'OK' : 'FAIL'}`);
console.log(`     이미지 경로: ${s2.img}`);
const advanced = s2.slot.indexOf('2/3') >= 0;
console.log(`     ${advanced ? 'OK — 앞 포켓몬을 잡으니 이름·그림이 다음 상대로 바뀌었다' : 'FAIL — 여전히 1/3'}`);

// 힌트
await page.evaluate(() => window.MB.game.hint());
await page.waitForTimeout(300);
await page.screenshot({ path: OUT + '/5-배틀-힌트.png' });
console.log('[5] 힌트 패널 저장');

// 도서관(도감) — 151마리 전부 등록돼 있는지
await page.evaluate(() => window.MB.game.ui.showLibrary(window.MB.game.list));
await page.waitForTimeout(500);
const lib = await page.evaluate(() => ({
  rows: document.querySelectorAll('#lib-list .lib-row').length,
  subs: document.querySelectorAll('#lib-list .lib-sub').length,
  first: (document.querySelector('#lib-list .lr-m') || {}).textContent,
  last: [...document.querySelectorAll('#lib-list .lr-m')].pop().textContent,
}));
await page.screenshot({ path: OUT + '/6-도서관-도감.png', fullPage: false });
console.log(`[6] 도서관: 토픽 ${lib.rows}행 / 과목 ${lib.subs}개`);
console.log(`     첫 토픽 상대: ${lib.first}`);
console.log(`     끝 토픽 상대: ${lib.last}`);

await b.close();
console.log(`\n캡처 완료 → ${OUT}`);
