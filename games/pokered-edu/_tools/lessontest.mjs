/* 배틀 학습 묶음 점검: 오래 버티는 야생 포켓몬과 싸우는 동안
 *  - 모든 문제가 같은 과목·같은 주제(수학은 같은 가족)
 *  - 수학이고 원리 문제가 있으면 첫 문제는 원리
 *  - 틀린 다음 재도전은 보기 3개(쉬운 문제)
 * 실행: node _tools/lessontest.mjs [url] */
import { chromium } from 'file:///C:/Users/User/AppData/Roaming/npm/node_modules/playwright/index.mjs';
const URL = process.argv[2] || 'http://127.0.0.1:8793/games/pokered-edu/';
const BATTLES = Number(process.env.BATTLES || 4);
let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗', n, x); } };
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1280, height: 760 } })).newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message + ' ' + (e.stack || '').split('\n').slice(0, 2).join(' | ')));
const vis = (s) => page.evaluate((s) => { const e = document.querySelector(s); return !!e && e.offsetParent !== null; }, s);

await page.goto(URL);
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('pokered_edu_save_v1', JSON.stringify({
    v: 1, name: '테스트', rival: '오바람', grade: 2, map: 'PewterCity', x: 18, y: 30, facing: 'up',
    party: [{ sp: 25, lv: 50, exp: 125000, iv: { atk: 9, def: 15, spe: 15, spc: 9, hp: 15 }, status: null, moves: [{ id: 'Growl', pp: 99 }], hp: 999 }],
    box: [], bag: {}, money: 3000, flags: { oakEscort: true, placement: true, gotStarter: 25, pokedex: true }, badges: [],
    dex: { seen: {}, caught: {} }, respawn: { map: 'PewterPokecenter', x: 3, y: 4 }, lastOutdoor: 'PewterCity', learn: null, playMs: 0, stats: { battles: 0, wins: 0, caught: 0 },
  }));
});
await page.reload();
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await page.keyboard.press('Space');
await page.waitForTimeout(1500);
const conceptN = await page.evaluate(() => (window.__pe.DB.concept || []).length);
console.log('원리 문제 수:', conceptN);

// 맞힘/틀림 순서 (첫 시도 기준). 틀린 경우 재도전은 RETRY 순서대로
const PLAN = [1, 1, 0, 1, 1, 0, 1];
const RETRY = [0, 1];
for (let b = 0; b < BATTLES; b++) {
  await page.evaluate(() => { window.__peLog = []; window.__pe.W.wildBattle({ encounterRate: 25, mons: [{ level: 40, species: 'Onix' }] }); });
  const seq = []; let first = 0, retryN = 0, lastWasWrongFirst = false, ran = false;
  for (let i = 0; i < 900 && !ran; i++) {
    if (await page.evaluate(() => { const x = document.querySelector('.quiz .ans button'); return !!x && !x.disabled; })) {
      const q = await page.evaluate(() => window.__peQ);
      const isRetry = await page.evaluate(() => [...document.querySelectorAll('.quiz .tag')].some((t) => t.textContent.includes('다시 도전')));
      q.retry = isRetry;
      let right;
      if (isRetry) right = RETRY[retryN++ % RETRY.length];
      else right = PLAN[first++ % PLAN.length];
      q.right = right;
      seq.push(q);
      const pickI = right ? q.c : (q.c + 1) % q.a.length;
      await page.keyboard.press(String(pickI + 1));
      await page.waitForTimeout(200);
      continue;
    }
    if (first >= PLAN.length && await vis('.bbox .cmds:not(.hidden)')) {
      await page.click('.bbox .cmds button:nth-child(4)'); // 도망
      await page.waitForTimeout(300); ran = true; continue;
    }
    await page.keyboard.press('Space'); await page.waitForTimeout(90);
  }
  for (let i = 0; i < 80 && (await vis('.bbox')); i++) { await page.keyboard.press('Space'); await page.waitForTimeout(100); }
  const fam = await page.evaluate(async (ids) => { const F = await import('./js/learn/families.js'); return ids.map((id) => F.familyOf(id)); }, seq.map((q) => q.skill));
  const subjSame = seq.every((q) => q.subj === seq[0].subj);
  const topicSame = seq[0].subj === 'math' ? fam.every((f) => f === fam[0]) : seq.every((q) => q.skill === seq[0].skill);
  console.log(`  [배틀 ${b + 1}] ${seq[0] && seq[0].subj} · ${seq.map((q) => `${q.skill}/${q.kind}${q.three ? '/3지' : ''}${q.retry ? '/재' : ''}`).join(' → ')}`);
  ok(`배틀 ${b + 1}: 문제 ${seq.length}개 모두 같은 과목`, subjSame && seq.length >= PLAN.length);
  ok(`배틀 ${b + 1}: 모두 같은 주제(수학은 같은 가족)`, topicSame, JSON.stringify(fam));
  const retries = seq.filter((q) => q.retry);
  ok(`배틀 ${b + 1}: 틀린 뒤 재도전은 보기 3개 쉬운 문제`, retries.length > 0 && retries.every((q) => q.three && q.a.length === 3), JSON.stringify(retries.map((q) => q.a.length)));
  if (seq[0].subj === 'math') {
    const twice = seq.findIndex((q, i) => i && q.kind === 'principle' && seq[i - 1].kind === 'principle');
    ok(`배틀 ${b + 1}: 원리 문제가 연달아 나오지 않음`, twice < 0, String(twice));
    const hasP = await page.evaluate((id) => (window.__pe.DB.concept || []).some((q) => q.skill === id), seq[0].skill);
    ok(`배틀 ${b + 1}: 첫 문제 종류 = ${hasP ? '원리' : '계산(원리 문제 준비 전)'}`, seq[0].kind === (hasP ? 'principle' : 'calc') || (!hasP && seq[0].kind === 'apply'), seq[0].kind);
  }
}
ok('자바스크립트 오류 없음', errs.length === 0, errs.slice(0, 3).join(' || '));
console.log(`\n묶음 결과: ${pass} 통과, ${fail} 실패`);
await browser.close();
process.exit(fail ? 1 : 0);
