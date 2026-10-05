/* 강의 전부를 폰 화면에서 실제로 열어 본다 (가짜 시계로 2분 건너뛰기)
 *  - 페이지마다 글이 상자 밖으로 넘치지 않는지, 그림(viz)이 실제로 그려지는지
 *  - 강의가 끝나면 정상으로 닫히는지
 * 실행: node _tools/lecture_render.mjs [lectures.json 경로(기본: data/lectures.json)] [url]
 *  다른 파일을 주면 게임의 data/lectures.json 요청을 그 파일로 바꿔 보여 준다(게임 파일은 안 바꿈). */
import fs from 'fs';
import { chromium } from 'file:///C:/Users/User/AppData/Roaming/npm/node_modules/playwright/index.mjs';
const FILE = process.argv[2] || '';
const URL = process.argv[3] || 'http://127.0.0.1:8793/games/pokered-edu/';
const SHOTS = 'C:/Users/User/.claude/jobs/734d08b0/tmp/shots_lec';
fs.mkdirSync(SHOTS, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
if (FILE) await page.route('**/data/lectures.json', (r) => r.fulfill({ contentType: 'application/json', body: fs.readFileSync(FILE, 'utf8') }));
await page.clock.install();
await page.goto(URL);
await page.waitForSelector('.title .opts button', { timeout: 30000 });
const ids = await page.evaluate(() => Object.keys(window.__pe.DB.lectures || {}));
console.log('강의', ids.length, '개');
const probs = [];
let shot = 0;
for (const id of ids) {
  const subj = id.startsWith('m_') ? 'math' : id.startsWith('h_') ? 'hum' : 'sci';
  await page.evaluate(([s, i]) => { window.__lecDone = false; import('./js/learn/lecture.js').then((m) => m.openLecture(s, i)).then(() => { window.__lecDone = true; }); }, [subj, id]);
  await page.waitForSelector('.lecture', { timeout: 5000 });
  await page.waitForTimeout(80);
  const n = await page.evaluate(() => window.__peLecture.pages);
  for (let p = 0; p < n; p++) {
    const r = await page.evaluate(() => {
      const over = (e) => e && e.scrollHeight > e.clientHeight + 2;
      const stage = document.querySelector('.lecture .lec-stage');   // 슬라이드가 들어가는 칸 — 넘치면 아이가 스크롤해야 한다
      const cv = document.querySelector('.lecture .lec-stage canvas');
      const panel = document.querySelector('.lecture .lec-win');
      const pr = panel ? panel.getBoundingClientRect() : null;
      const isComic = !!document.querySelector('.lecture .lec-comic'); // 만화는 원래 길게 내려 보는 칸
      let painted = null;
      if (cv) { try { const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let k = 0; for (let i = 3; i < d.length; i += 40) if (d[i]) k++; painted = k; } catch (e) { painted = -1; } }
      return { overflowCard: !isComic && over(stage), offscreen: pr ? pr.bottom > innerHeight + 1 || pr.right > innerWidth + 1 : false, hasViz: !!cv, painted, page: window.__peLecture.page };
    });
    if (r.overflowCard || r.offscreen) probs.push(`${id} p${p + 1}: ${r.overflowCard ? '글 넘침' : ''}${r.offscreen ? ' 화면 밖' : ''}`);
    if (r.hasViz && r.painted === 0) probs.push(`${id} p${p + 1}: 그림이 비어 있음`);
    if (shot < 40 && (p === 2 || r.overflowCard)) { shot++; await page.screenshot({ path: `${SHOTS}/${id}_p${p + 1}.png` }); }
    if (p < n - 1) { await page.keyboard.press('ArrowRight'); await page.waitForTimeout(60); }
  }
  await page.clock.fastForward(121000);
  await page.waitForTimeout(60);
  await page.click('.lec-done');
  await page.waitForFunction(() => window.__lecDone, null, { timeout: 5000 }).catch(() => probs.push(`${id}: 닫히지 않음`));
}
console.log(probs.length ? probs.join('\n') : '문제 없음');
console.log('자바스크립트 오류', errs.length, errs.slice(0, 3).join(' | '));
console.log(`\n강의 화면 결과: ${ids.length}개 중 문제 ${probs.length}건`);
await browser.close();
process.exit(probs.length || errs.length ? 1 : 0);
