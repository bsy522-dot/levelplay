/* 강의·문제를 폰 화면(360×740)에서 실제로 띄워 장마다 찍는다 — 쉬운 설명 개편(2026-10-23) 눈 확인용.
 * 실행: node --import ./_tools/_localfs.mjs _tools/lecshots.mjs --lec s_number,m_linear_eq --q s_number_05 [--url http://localfs.test/] [--out 폴더] [--wait 6000]
 *  문제는 '처음 화면' + '틀렸을 때 오박사 설명'을 찍는다. */
import fs from 'fs';
import { chromium } from 'file:///C:/Users/User/AppData/Roaming/npm/node_modules/playwright/index.mjs';
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const LEC = (arg('--lec', '') || '').split(',').filter(Boolean);
const QS = (arg('--q', '') || '').split(',').filter(Boolean);
const URL = arg('--url', 'http://localfs.test/');
const OUT = arg('--out', 'C:/Users/User/.claude/jobs/734d08b0/tmp/shots_eli5');
const WAIT = Number(arg('--wait', '6000'));
fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
// --lecfile 원고.json : 게임 강의 위에 원고 강의를 덮어 보여 준다 (게임 파일은 안 바꿈)
const LECFILE = arg('--lecfile', '');
if (LECFILE) {
  const merged = { ...JSON.parse(fs.readFileSync(new globalThis.URL('../data/lectures.json', import.meta.url), 'utf8')), ...JSON.parse(fs.readFileSync(LECFILE, 'utf8')) };
  await page.route('**/data/lectures.json', (r) => r.fulfill({ contentType: 'application/json', body: JSON.stringify(merged) }));
}
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
await page.goto(URL);
await page.waitForSelector('.title .opts button', { timeout: 60000 });
await page.waitForTimeout(1500); // 글꼴
const shots = [];
for (const id of LEC) {
  const subj = id.startsWith('m_') ? 'math' : id.startsWith('h_') ? 'hum' : id.startsWith('a_') ? 'art' : id.startsWith('j_') ? 'job' : 'sci';
  await page.evaluate(([s, i]) => { window.__lecDone = false; import('./js/learn/lecture.js').then((m) => m.openLecture(s, i)); }, [subj, id]);
  await page.waitForSelector('.lecture', { timeout: 8000 });
  const n = await page.evaluate(() => window.__peLecture.pages);
  for (let p = 0; p < n; p++) {
    await page.waitForTimeout(WAIT);
    const f = `${OUT}/${id}_${String(p + 1).padStart(2, '0')}.png`;
    await page.screenshot({ path: f }); shots.push(f);
    if (p < n - 1) await page.keyboard.press('ArrowRight');
  }
  await page.evaluate(() => document.querySelector('.lecture')?.remove());
}
for (const qid of QS) {
  await page.setViewportSize({ width: 360, height: 740 });
  const ok = await page.evaluate(async (qid) => {
    const DB = window.__pe.DB;
    const item = [...(DB.science || []), ...(DB.concept || [])].find((x) => x.id === qid);
    if (!item) return false;
    const { __quizTest } = await import('./js/learn/quiz.js');
    const skill = item.topic || item.skill;
    window.__shotQ = { item, subj: skill.startsWith('m_') ? 'math' : 'sci', skill, title: skill };
    __quizTest.showQuestion(window.__shotQ, { lead: '꼬마돌의 몸통박치기! 맞히면 명중!' }).then((r) => { window.__shotR = r; });
    return true;
  }, qid);
  if (!ok) { console.log('없는 문제', qid); continue; }
  await page.waitForTimeout(WAIT);
  let f = `${OUT}/${qid}_1_문제.png`; await page.screenshot({ path: f }); shots.push(f);
  await page.evaluate(() => { const it = window.__shotQ.item; const wrong = it.a.findIndex((_, i) => i !== it.c); document.querySelectorAll('.quiz .ans button')[wrong].click(); });
  await page.waitForTimeout(300);
  await page.evaluate(async () => {
    const { __quizTest } = await import('./js/learn/quiz.js');
    const r = window.__shotR, q = window.__shotQ;
    r.result.className = 'result no'; r.result.textContent = '앗, 빗나갔어!';
    r.box.append(__quizTest.explainCard(q.item, r.pick, '오박사의 설명', q.skill));
  });
  await page.setViewportSize({ width: 360, height: 1500 });
  await page.waitForTimeout(WAIT);
  f = `${OUT}/${qid}_2_설명.png`; await page.screenshot({ path: f }); shots.push(f);
  await page.evaluate(() => document.querySelector('.quiz')?.remove());
}
console.log(shots.length, '장 →', OUT);
console.log('자바스크립트 오류', errs.length, errs.slice(0, 3).join(' | '));
await browser.close();
