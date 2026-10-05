/* 슬롯 덮어쓰기 점검: 슬롯 1을 슬롯 2로 복사(밖에서 시작) → 슬롯 2로 놀고 저장 → 슬롯 1은 그대로여야 한다.
 * 실행: node _tools/slottest.mjs [url] */
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
// 슬롯 1 = 원본(아림, 돈 3000, 포켓몬센터 안)
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('pokered_edu_save_v1', JSON.stringify({
    v: 1, name: '아림', rival: '오바람', grade: 2, map: 'PewterPokecenter', x: 3, y: 4, facing: 'up', party: [{ sp: 25, lv: 12, exp: 1728, iv: { atk: 9, def: 9, spe: 9, spc: 9, hp: 9 }, status: null, moves: [{ id: 'Thundershock', pp: 30 }], hp: 33 }],
    box: [], bag: { 4: 3 }, money: 3000, flags: { oakEscort: true, placement: true, gotStarter: 25, pokedex: true, badge1: true }, badges: ['boulder'],
    dex: { seen: { 25: 1 }, caught: { 25: 1 } }, respawn: { map: 'PewterPokecenter', x: 3, y: 4 }, lastOutdoor: 'PewterCity', learn: null, playMs: 0, stats: { battles: 0, wins: 0, caught: 0 },
  }));
});
await page.reload();
await page.waitForSelector('.title .opts button', { timeout: 30000 });
const r = await page.evaluate(async () => {
  const SV = await import('./js/saves.js');
  const cp = SV.moveSlotOutside(1, 'PewterCity', 16, 18, '아림');
  // 앱이 슬롯을 불러오는 방식 그대로: loadSlot → G.s 교체 → 활성 슬롯 지정
  const ld = SV.loadSlot(cp.slot);
  window.__pe.G.s = ld.state;
  SV.setActiveSlot(cp.slot);
  window.__pe.G.s.money = 777;            // 슬롯 2에서 놀다가
  window.__pe.save();                      // 자동 저장
  const v1 = JSON.parse(localStorage.getItem('pokered_edu_save_v1'));
  const s2 = JSON.parse(localStorage.getItem('pokered_edu_slot_' + cp.slot));
  return { slot: cp.slot, v1money: v1.money, v1map: v1.map, s2money: s2.money, s2map: s2.map, s2name: s2.name };
});
ok('슬롯 1을 복사해 새 슬롯 생성', r.slot === 2, JSON.stringify(r));
ok('복사본은 밖(회색시티)에서 시작, 이름 그대로 아림', r.s2map === 'PewterCity' && r.s2name === '아림', JSON.stringify(r));
ok('슬롯 2에서 놀고 저장해도 슬롯 1 원본은 그대로 (돈 3000, 포켓몬센터)', r.v1money === 3000 && r.v1map === 'PewterPokecenter', JSON.stringify(r));
ok('저장은 지금 노는 슬롯 2에 들어감 (돈 777)', r.s2money === 777, JSON.stringify(r));
// 이어하기는 마지막으로 놀던 슬롯을 연다
await page.reload();
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await page.keyboard.press('Space');
await page.waitForTimeout(1500);
const cont = await page.evaluate(() => window.__pe.G.s && { money: window.__pe.G.s.money, map: window.__pe.G.s.map });
ok('이어하기 = 마지막으로 놀던 슬롯 2', cont && cont.money === 777, JSON.stringify(cont));
/* ── 이미 설치된 기기 세 가지: 잡은 포켓몬·레벨·마을 위치가 그대로여야 한다 ── */
const mon = (sp, lv) => ({ sp, lv, exp: lv ** 3, iv: { atk: 9, def: 9, spe: 9, spc: 9, hp: 9 }, status: null, moves: [{ id: 'Tackle', pp: 35 }], hp: 30 });
const base = (o) => ({ v: 1, name: '아림', rival: '오바람', grade: 2, facing: 'down', box: [], bag: {}, money: 3000, flags: { pokedex: true, badge1: true }, badges: ['boulder'],
  dex: { seen: {}, caught: {} }, respawn: { map: 'PewterPokecenter', x: 3, y: 4 }, lastOutdoor: 'PewterCity', learn: null, stats: { battles: 0, wins: 0, caught: 0 }, ...o });
async function boot(setup) {
  await page.evaluate((s) => { localStorage.clear(); for (const [k, v] of Object.entries(s)) localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); }, setup);
  await page.reload();
  await page.waitForSelector('.title .opts button', { timeout: 30000 });
  await page.keyboard.press('Space');
  await page.waitForTimeout(1500);
  return page.evaluate(() => { const s = window.__pe.G.s; return s && { party: s.party.map((m) => [m.sp, m.lv]), map: s.map, x: s.x, y: s.y, name: s.name }; });
}
// ① 세이브 관리를 한 번도 안 쓴 폰: 슬롯 1(v1)만 있음
const phone = base({ map: 'ViridianCity', x: 20, y: 25, started: 111, playMs: 50000, party: [mon(25, 14), mon(16, 9), mon(10, 7)] });
let g = await boot({ pokered_edu_save_v1: phone });
ok('① 폰: 이어하기로 포켓몬 3마리·레벨 그대로', JSON.stringify(g.party) === JSON.stringify([[25, 14], [16, 9], [10, 7]]), JSON.stringify(g));
ok('① 폰: 마을 위치 그대로 (상록시티 20,25)', g.map === 'ViridianCity' && g.x === 20 && g.y === 25, JSON.stringify(g));
await page.evaluate(() => { window.__pe.G.s.money = 4321; window.__pe.save(); });
const keys1 = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('pokered_edu_slot_')));
const v1a = await page.evaluate(() => JSON.parse(localStorage.getItem('pokered_edu_save_v1')).money);
ok('① 폰: 저장은 그대로 슬롯 1 자리에, 다른 슬롯은 안 생김', v1a === 4321 && keys1.length === 0, JSON.stringify([v1a, keys1]));
// ② 태블릿: 슬롯 2(밖에서 시작)를 골라 놀았는데, 예전 버그로 진행이 슬롯 1 자리에 들어가 있음
const stale = base({ map: 'PewterCity', x: 16, y: 18, started: 222, playMs: 9000, party: [mon(25, 12)], _copiedFrom: 1 });
const progressed = base({ map: 'CeruleanCity', x: 18, y: 20, started: 222, playMs: 64000, party: [mon(25, 19), mon(74, 13), mon(140, 12)], _copiedFrom: 1 });
g = await boot({ pokered_edu_save_v1: progressed, pokered_edu_slot_2: stale, pokered_edu_active_slot: '"2"' });
ok('② 태블릿: 이어하기로 최신 진행(포켓몬 3마리·레벨)이 열림', JSON.stringify(g.party) === JSON.stringify([[25, 19], [74, 13], [140, 12]]), JSON.stringify(g));
ok('② 태블릿: 마을 위치도 최신 (블루시티 18,20)', g.map === 'CeruleanCity' && g.x === 18 && g.y === 20, JSON.stringify(g));
const t2 = await page.evaluate(() => ({ v1: JSON.parse(localStorage.getItem('pokered_edu_save_v1')).party.length, s2: JSON.parse(localStorage.getItem('pokered_edu_slot_2')).party.length, bk: !!localStorage.getItem('pokered_edu_backup_1') }));
ok('② 태블릿: 슬롯 1 자리는 그대로, 슬롯 2에 최신 진행, 이전 판은 백업에', t2.v1 === 3 && t2.s2 === 3 && t2.bk, JSON.stringify(t2));
// ③ 슬롯 2가 동생의 전혀 다른 모험: 서로 섞이면 안 됨
const child = base({ map: 'VermilionCity', x: 12, y: 20, started: 333, playMs: 99000, party: [mon(25, 30), mon(7, 25)] });
const sib = base({ name: '동생', map: 'PalletTown', x: 10, y: 5, started: 444, playMs: 1000, party: [mon(25, 5)] });
g = await boot({ pokered_edu_save_v1: child, pokered_edu_slot_2: sib, pokered_edu_active_slot: '"2"' });
ok('③ 동생 슬롯: 동생 모험 그대로 열림', g.name === '동생' && JSON.stringify(g.party) === JSON.stringify([[25, 5]]) && g.map === 'PalletTown', JSON.stringify(g));
const t3 = await page.evaluate(() => JSON.parse(localStorage.getItem('pokered_edu_save_v1')));
ok('③ 아이 슬롯 1은 손대지 않음 (포켓몬 2마리, 갈색시티)', t3.party.length === 2 && t3.map === 'VermilionCity', JSON.stringify([t3.party.length, t3.map]));

ok('자바스크립트 오류 없음', errs.length === 0, errs.join(' | '));
console.log(`\n슬롯 결과: ${pass} 통과, ${fail} 실패`);
await browser.close();
process.exit(fail ? 1 : 0);
