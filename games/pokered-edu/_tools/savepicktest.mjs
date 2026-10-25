/* 슬롯 고르기 점검 (2026-10-17 병석님: "밖으로 보내기가 슬롯1만 / 저장할 때도 슬롯을 고르게")
 *  ① 세이브 관리에서 슬롯 3 의 [밖으로 보내기] → 슬롯 3 만 바뀌고 슬롯 1 은 그대로
 *  ② 슬롯 1 의 [밖으로 보내기] 도 그 슬롯만 바뀐다
 *  ③ 게임 중 메뉴 [저장] → 슬롯 4 를 고르면 슬롯 4 에 저장·그 슬롯이 '지금 슬롯'이 된다
 *  ④ 다른 모험이 든 슬롯은 확인을 묻고, 아니요면 그대로 / 덮어쓰면 이전 판이 백업에
 *  ⑤ 갈라진 슬롯은 부팅 보정(repairMisSaved)이 덮어쓰지 않는다
 * 실행: node _tools/savepicktest.mjs [url] */
import { chromium } from 'file:///C:/Users/User/AppData/Roaming/npm/node_modules/playwright/index.mjs';
const URL = process.argv[2] || 'http://127.0.0.1:8793/games/pokered-edu/';
let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗', n, x); } };
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 760 } })).newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(URL);
await page.waitForSelector('.title .opts button', { timeout: 30000 });

const mon = (sp, lv) => ({ sp, lv, exp: lv ** 3, iv: { atk: 9, def: 9, spe: 9, spc: 9, hp: 9 }, status: null, moves: [{ id: 'Tackle', pp: 35 }], hp: 30 });
const base = (o) => ({ v: 1, name: '아림', rival: '오바람', grade: 2, facing: 'up', box: [], bag: {}, money: 3000, flags: { pokedex: true, badge1: true }, badges: ['boulder'],
  dex: { seen: {}, caught: {} }, respawn: { map: 'PewterPokecenter', x: 3, y: 4 }, lastOutdoor: 'PewterCity', learn: null, stats: { battles: 0, wins: 0, caught: 0 }, ...o });
async function boot(setup) {
  await page.evaluate((s) => { localStorage.clear(); for (const [k, v] of Object.entries(s)) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); }, setup);
  await page.reload();
  await page.waitForSelector('.title .opts button', { timeout: 30000 });
}
const ls = (k) => page.evaluate((key) => { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }, k);

const s1 = base({ map: 'PewterPokecenter', x: 3, y: 4, started: 100, playMs: 5000, party: [mon(25, 12)] });
const s3 = base({ name: '동생', map: 'ViridianPokecenter', x: 3, y: 4, started: 300, playMs: 800, party: [mon(7, 5)], lastOutdoor: 'ViridianCity' });

/* ① 슬롯 3 만 밖으로 */
await boot({ pokered_edu_save_v1: s1, pokered_edu_slot_3: s3 });
await page.click('.title .opts button:has-text("세이브 관리")');
await page.waitForSelector('.slot-card');
await page.click('.slot-card:has-text("슬롯 3") button:has-text("밖으로")');
await page.waitForSelector('.choices button:has-text("예")', { timeout: 5000 });
const q = await page.textContent('.choices');
ok('① 확인창에 슬롯 3 과 상록시티가 보인다', q.includes('슬롯 3') && q.includes('상록시티'), q);
await page.click('.choices button:has-text("예")');
await page.waitForSelector('.slot-card', { timeout: 5000 });   // 관리 화면이 다시 열린다
let a = await ls('pokered_edu_slot_3'), b = await ls('pokered_edu_save_v1');
ok('① 슬롯 3 은 상록시티 밖으로 (23,26)', a.map === 'ViridianCity' && a.x === 23 && a.y === 26, JSON.stringify([a.map, a.x, a.y]));
ok('① 슬롯 3 의 포켓몬·이름은 그대로', a.party.length === 1 && a.party[0].sp === 7 && a.name === '동생');
ok('① 슬롯 1 은 전혀 안 바뀜 (포켓몬센터 안)', b.map === 'PewterPokecenter' && b.x === 3 && b.y === 4 && b.party[0].sp === 25);
ok('① 빈 슬롯에 복사본이 생기지 않음', (await ls('pokered_edu_slot_2')) === null && (await ls('pokered_edu_slot_4')) === null);
const bk = await ls('pokered_edu_backup_1');
ok('① 이전 판은 백업에 남음 (복원 가능)', bk && bk.map === 'ViridianPokecenter', JSON.stringify(bk && bk.map));

/* ② 슬롯 1 도 그 슬롯만 */
await page.click('.slot-card:has-text("슬롯 1") button:has-text("밖으로")');
await page.waitForSelector('.choices button:has-text("예")', { timeout: 5000 });
const q1 = await page.textContent('.choices');
ok('② 슬롯 1 확인창은 회색시티', q1.includes('슬롯 1') && q1.includes('회색시티'), q1);
await page.click('.choices button:has-text("예")');
await page.waitForSelector('.slot-card', { timeout: 5000 });
b = await ls('pokered_edu_save_v1'); a = await ls('pokered_edu_slot_3');
ok('② 슬롯 1 은 회색시티 밖으로 (13,26)', b.map === 'PewterCity' && b.x === 13 && b.y === 26, JSON.stringify([b.map, b.x, b.y]));
ok('② 슬롯 1 의 포켓몬은 그대로', b.party.length === 1 && b.party[0].sp === 25 && b.money === 3000);
ok('② 슬롯 3 은 방금 보낸 그대로', a.map === 'ViridianCity');
/* ②-b 복원: 슬롯 3 의 백업은 '슬롯 3 으로 복원'이고, 지금 슬롯(1)은 건드리지 않는다 */
await page.click('.slot-card.backup:has-text("슬롯 3 으로 복원") button');
await page.waitForTimeout(500);
a = await ls('pokered_edu_slot_3'); b = await ls('pokered_edu_save_v1');
ok('②-b 슬롯 3 백업 복원 → 슬롯 3 이 포켓몬센터 안으로 돌아감', a.map === 'ViridianPokecenter', a.map);
ok('②-b 지금 슬롯(1)은 복원에 덮어써지지 않음 (회색시티 밖 그대로)', b.map === 'PewterCity' && b.name === '아림', JSON.stringify([b.map, b.name]));
/* ②-c 이미 밖에 있으면 다시 보내도 백업을 소모하지 않는다 */
await page.click('.slot-card:has-text("슬롯 1") button:has-text("밖으로")');
await page.waitForSelector('.choices button:has-text("예")', { timeout: 5000 });
const bkBefore = JSON.stringify(await Promise.all([1, 2, 3, 4, 5].map((i) => ls('pokered_edu_backup_' + i))));
await page.click('.choices button:has-text("예")');
await page.waitForSelector('.slot-card', { timeout: 5000 });
const bkAfter2 = JSON.stringify(await Promise.all([1, 2, 3, 4, 5].map((i) => ls('pokered_edu_backup_' + i))));
ok('②-c 이미 밖이면 백업 칸이 그대로', bkBefore === bkAfter2);

/* ③ 게임 중 저장: 슬롯 4 */
const g1 = base({ map: 'PewterCity', x: 13, y: 26, started: 100, playMs: 5000, party: [mon(25, 12)] });
await boot({ pokered_edu_save_v1: g1 });
await page.keyboard.press('Space');                 // 이어하기
await page.waitForFunction(() => window.__pe && window.__pe.G.s && window.__pe.W.scene && window.__pe.W.scene.map, null, { timeout: 15000 });
await page.waitForTimeout(800);
await page.evaluate(() => { window.__pe.G.s.money = 999; });
await page.keyboard.press('Escape');
await page.waitForSelector('.menu button:has-text("저장")', { timeout: 5000 });
await page.click('.menu button:has-text("저장")');
await page.waitForSelector('.choices button:has-text("슬롯 4")', { timeout: 5000 });
const lst = await page.textContent('.choices');
ok('③ 저장 화면에 슬롯 1~5 와 지금 슬롯이 보인다', ['슬롯 1', '슬롯 2', '슬롯 3', '슬롯 4', '슬롯 5', '지금'].every((t) => lst.includes(t)), lst);
await page.click('.choices button:has-text("슬롯 4")');
await page.waitForTimeout(600);
let s4 = await ls('pokered_edu_slot_4'); b = await ls('pokered_edu_save_v1');
ok('③ 슬롯 4 에 저장됨 (돈 999)', s4 && s4.money === 999, JSON.stringify(s4 && s4.money));
ok('③ 슬롯 1 은 저장 전 그대로 (돈 3000)', b.money === 3000);
ok('③ 지금 슬롯이 4 가 됨', (await page.evaluate(() => localStorage.getItem('pokered_edu_active_slot'))) === '"4"');
await page.evaluate(() => { window.__pe.G.s.money = 1234; window.__pe.save(); });   // 자동 저장
s4 = await ls('pokered_edu_slot_4'); b = await ls('pokered_edu_save_v1');
ok('③ 이후 자동 저장은 슬롯 4 로 (슬롯 1 은 그대로)', s4.money === 1234 && b.money === 3000, JSON.stringify([s4.money, b.money]));

/* ④ 다른 모험이 든 슬롯 → 확인 (저장 뒤에도 메뉴는 열려 있다) */
await page.click('.menu button:has-text("저장")');
await page.click('.choices button:has-text("슬롯 1")');
await page.waitForSelector('.choices button:has-text("덮어쓴다")', { timeout: 5000 });
const warn = await page.textContent('.dialog');
ok('④ 슬롯 1 은 처음 모험이라는 경고', warn.includes('처음 모험'), warn);
await page.click('.choices button:has-text("아니요")');
await page.waitForTimeout(400);
b = await ls('pokered_edu_save_v1');
ok('④ 아니요 → 슬롯 1 변화 없음', b.money === 3000);
await page.click('.menu button:has-text("저장")');
await page.click('.choices button:has-text("슬롯 1")');
await page.waitForSelector('.choices button:has-text("덮어쓴다")', { timeout: 5000 });
await page.click('.choices button:has-text("덮어쓴다")');
await page.waitForTimeout(600);
b = await ls('pokered_edu_save_v1');
const bkAfter = [1, 2, 3, 4, 5];
let found = false;
for (const i of bkAfter) { const x = await ls('pokered_edu_backup_' + i); if (x && x.money === 3000) found = true; }
ok('④ 덮어쓰면 슬롯 1 에 새 기록 (돈 1234)', b.money === 1234, JSON.stringify(b.money));
ok('④ 덮어쓴 이전 슬롯 1(돈 3000)이 백업에 남음', found);

/* ⑤ 갈라진 슬롯은 부팅 보정이 덮어쓰지 않는다 */
await page.evaluate(() => { window.__pe.G.s.money = 777; window.__pe.save(); });     // 지금 슬롯(=1)에 저장
// 슬롯 4 를 지금 슬롯으로 하고, 슬롯 1 만 더 오래 놀았다고 가정
await page.evaluate(() => {
  const v1 = JSON.parse(localStorage.getItem('pokered_edu_save_v1')); v1.playMs = 999999; localStorage.setItem('pokered_edu_save_v1', JSON.stringify(v1));
  localStorage.setItem('pokered_edu_active_slot', JSON.stringify('4'));
});
const s4before = await ls('pokered_edu_slot_4');
await page.reload();
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await page.keyboard.press('Space');
await page.waitForTimeout(1500);
const s4after = await ls('pokered_edu_slot_4');
ok('⑤ 슬롯 4(체크포인트)가 슬롯 1 로 덮어써지지 않음', s4after.money === s4before.money && s4after.money === 1234, JSON.stringify([s4before.money, s4after.money]));
ok('⑤ 슬롯 4 의 모험 번호는 슬롯 1 과 다름(갈라짐)', s4after.started !== (await ls('pokered_edu_save_v1')).started);

ok('자바스크립트 오류 없음', errs.length === 0, errs.join(' | '));
console.log(`\n슬롯고르기 결과: ${pass} 통과, ${fail} 실패`);
await browser.close();
process.exit(fail ? 1 : 0);
