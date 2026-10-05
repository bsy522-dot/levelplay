/* ⚙ 설정(어른용) 점검 — 폰 화면에서 터치로 (병석님: "설정으로 과목별 난이도, 운 좋게 찍어서 너무 가 버리는 것")
 *  ① 어른 확인: 틀리면 못 들어감, 맞히면 들어감
 *  ② 운으로 너무 올라간 아이 → 수학 '이 학년부터 다시(초등 1학년)' → 지금 배우는 곳이 1학년으로
 *  ③ 수학 '이 학년에서 멈추기(초등 2학년)' → 문제 200개가 모두 2학년 이하
 *  ④ 과학만 '천천히' — 수학 속도는 그대로
 *  ⑤ 껐다 켜도 설정이 남고, 포켓몬·레벨·위치는 그대로 / 공부 기록에 설정이 보임
 * 실행: node _tools/settingstest.mjs [url] */
import { chromium } from 'file:///C:/Users/User/AppData/Roaming/npm/node_modules/playwright/index.mjs';
const URL = process.argv[2] || 'http://127.0.0.1:8793/games/pokered-edu/';
const SHOT = 'C:/Users/User/.claude/jobs/734d08b0/tmp';
let pass = 0, fail = 0;
const ok = (n, c, x = '') => { if (c) { pass++; console.log('  ✓', n); } else { fail++; console.log('  ✗', n, x); } };
const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 412, height: 860 }, hasTouch: true, isMobile: true })).newPage();
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
const tapText = async (sel, text) => { const b = page.locator(sel, { hasText: text }).first(); await b.waitFor({ timeout: 8000 }); await b.tap(); await page.waitForTimeout(250); };
const dialog = async (has) => { for (let i = 0; i < 60; i++) { const t = await page.evaluate(() => (document.querySelector('.dialog .txt') || {}).textContent || ''); if (!has || t.includes(has)) return t; await page.waitForTimeout(100); } return ''; };

await page.goto(URL);
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await page.evaluate(() => {
  localStorage.clear();
  localStorage.setItem('pokered_edu_save_v1', JSON.stringify({
    v: 1, name: '아림', rival: '오바람', grade: 2, map: 'PewterCity', x: 18, y: 30, facing: 'up', started: 555, playMs: 1000,
    party: [{ sp: 25, lv: 21, exp: 9261, iv: { atk: 9, def: 9, spe: 9, spc: 9, hp: 9 }, status: null, moves: [{ id: 'Thundershock', pp: 30 }], hp: 50 }, { sp: 74, lv: 14, exp: 2744, iv: { atk: 9, def: 9, spe: 9, spc: 9, hp: 9 }, status: null, moves: [{ id: 'Tackle', pp: 35 }], hp: 40 }],
    box: [], bag: {}, money: 3000, flags: { oakEscort: true, placement: true, gotStarter: 25, pokedex: true, badge1: true }, badges: ['boulder'],
    dex: { seen: {}, caught: {} }, respawn: { map: 'PewterPokecenter', x: 3, y: 4 }, lastOutdoor: 'PewterCity', learn: null, stats: { battles: 0, wins: 0, caught: 0 },
  }));
});
await page.reload();
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await page.tap('.title .opts button');
await page.waitForTimeout(1500);
// 운으로 너무 올라간 아이: 수학 30단계까지 '익힘'
const before = await page.evaluate(async () => {
  const T = await import('./js/learn/tutor.js');
  T.ensureLearn();
  const r = T.report();
  r.math.slice(0, 30).forEach((x) => { window.__pe.G.s.learn.sk[x.id] = { n: 3, ok: 3, streak: 3, miss: 0, mastered: true, placed: false, wrongRecent: 0, hist: [1, 1, 1] }; });
  const r2 = T.report();
  return { t: r2.math[r2.fMath].t, g: r2.math[r2.fMath].g };
});
console.log('시작: 수학 지금 배우는 곳 =', before.t, `(g${before.g})`);

// ① 어른 확인
await page.evaluate(() => { window.__pe.MENU.openMenu(); });
await tapText('.menu button', '설정');
let q = await dialog('= ?');
let m = q.match(/(\d+) × (\d+)/);
const right = m && Number(m[1]) * Number(m[2]);
const wrongBtn = page.locator('.choices button').filter({ hasNotText: String(right) }).first();
await wrongBtn.tap(); await page.waitForTimeout(300);
ok('① 어른 확인을 틀리면 "어른에게 부탁해 보세요"', (await dialog('어른에게')).includes('어른에게'));
// 첫 탭은 글자를 끝까지 보여 주고, 다음 탭에 닫힌다 — 대화가 닫힐 때까지
for (let i = 0; i < 6 && (await page.evaluate(() => !!document.querySelector('.dialog'))); i++) { await page.locator('.dialog').tap().catch(() => {}); await page.waitForTimeout(300); }
ok('① 틀리면 설정 화면에 못 들어가고 메뉴로', await page.evaluate(() => !!document.querySelector('.menu')) && !(await page.evaluate(() => [...document.querySelectorAll('.choices button')].some((b) => b.textContent.startsWith('수학:')))));
await tapText('.menu button', '설정');
q = await dialog('= ?'); m = q.match(/(\d+) × (\d+)/);
await tapText('.choices button', String(Number(m[1]) * Number(m[2])));
await page.locator('.choices button', { hasText: '수학:' }).first().waitFor({ timeout: 8000 }); // 오박사 말이 다 찍힌 뒤에 목록이 뜬다
ok('① 맞히면 과목 목록(수학·과학·인문)', await page.evaluate(() => ['수학:', '과학:', '인문:'].every((s) => [...document.querySelectorAll('.choices button')].some((b) => b.textContent.startsWith(s)))));
await page.screenshot({ path: `${SHOT}/shots_settings_list.png` });

// ② 이 학년부터 다시
await tapText('.choices button', '수학:');
await tapText('.choices button', '이 학년부터 다시');
await page.locator('.choices button', { hasText: '초등 1학년' }).first().waitFor({ timeout: 8000 });
const gl = await page.evaluate(() => { const b = document.querySelector('.choices').getBoundingClientRect(); return { top: b.top, bottom: b.bottom, h: innerHeight, scroll: document.querySelector('.choices').scrollHeight > document.querySelector('.choices').clientHeight }; });
ok('학년 목록이 폰 화면 안에 들어감 (넘치면 스크롤)', gl.top >= 0 && gl.bottom <= gl.h, JSON.stringify(gl));
await page.screenshot({ path: `${SHOT}/shots_settings_grades.png` });
await tapText('.choices button', '초등 1학년');
const after2 = await page.evaluate(async () => { const T = await import('./js/learn/tutor.js'); const r = T.report(); return { t: r.math[r.fMath].t, g: r.math[r.fMath].g, s: T.settings().math }; });
ok(`② '초등 1학년부터 다시' → 지금 배우는 곳 ${after2.t}(g${after2.g})`, after2.g <= 1 && after2.s.mode === 'auto', JSON.stringify(after2));

// ③ 이 학년에서 멈추기
await tapText('.choices button', '수학:');
await tapText('.choices button', '이 학년에서 멈추기');
await tapText('.choices button', '초등 2학년');
const gs = await page.evaluate(async () => {
  const T = await import('./js/learn/tutor.js');
  const by = Object.fromEntries(T.report().math.map((x) => [x.id, x.g]));
  const out = [];
  for (let i = 0; i < 100; i++) out.push(by[T.nextQuestion({ subject: 'math' }).skill]);
  for (let b = 0; b < 25; b++) { const ls = T.newLesson(); for (let k = 0; k < 4; k++) { const q = T.nextQuestion({ subject: 'math', lesson: ls }); out.push(by[q.skill]); T.lessonResult(ls, k % 2 === 0); } }
  return { max: Math.max(...out), n: out.length, at2: out.filter((g) => g === 2).length, s: T.settings().math };
});
ok(`③ '초등 2학년에서 멈추기' → 문제 ${gs.n}개 모두 2학년 이하 (2학년 ${gs.at2}개)`, gs.max <= 2 && gs.at2 > gs.n * 0.5 && gs.s.mode === 'fixed' && gs.s.g === 2, JSON.stringify(gs));

// ④ 과학만 천천히
await tapText('.choices button', '과학:');
await tapText('.choices button', '올라가는 속도');
await tapText('.choices button', '천천히');
const sp = await page.evaluate(async () => { const T = await import('./js/learn/tutor.js'); const s = T.settings(); return [s.math.speed, s.sci.speed, s.hum.speed]; });
ok('④ 과학만 천천히, 수학·인문은 보통 그대로', JSON.stringify(sp) === '["normal","slow","normal"]', JSON.stringify(sp));
await page.locator('.choices button', { hasText: '수학:' }).first().waitFor({ timeout: 8000 }); // 오박사 말이 다 찍힌 뒤에 목록이 뜬다
const listTxt = await page.evaluate(() => [...document.querySelectorAll('.choices button')].map((b) => b.textContent).join(' | '));
ok('④ 과목 목록에 바뀐 설정이 보임', listTxt.includes('초등 2학년에서 멈춤') && listTxt.includes('과학:') && listTxt.includes('천천히'), listTxt);
await tapText('.choices button', '닫기');
// 공부 기록
await tapText('.menu button', '공부 기록');
const rep = await page.evaluate(() => (document.querySelector('.report .setline') || {}).textContent || '');
ok('⑤ 공부 기록에 설정이 보임', rep.includes('초등 2학년에서 멈춤') && rep.includes('천천히'), rep);
ok('공부 기록 화면에서 A·B 버튼이 목록을 가리지 않음', await page.evaluate(() => { const p = document.querySelector('.pad'); return !p || getComputedStyle(p).display === 'none'; }));
await page.screenshot({ path: `${SHOT}/shots_settings_report.png` });

// ⑤ 껐다 켜기
await page.evaluate(() => window.__pe.save());
await page.reload();
await page.waitForSelector('.title .opts button', { timeout: 30000 });
await page.tap('.title .opts button');
await page.waitForTimeout(1500);
const after5 = await page.evaluate(async () => { const T = await import('./js/learn/tutor.js'); const s = window.__pe.G.s; return { set: T.settings(), party: s.party.map((m) => [m.sp, m.lv]), map: s.map, x: s.x, y: s.y }; });
ok('⑤ 껐다 켜도 설정이 남음 (수학 2학년 고정, 과학 천천히)', after5.set.math.mode === 'fixed' && after5.set.math.g === 2 && after5.set.sci.speed === 'slow', JSON.stringify(after5.set));
ok('⑤ 포켓몬·레벨·위치 그대로 (피카츄 21, 꼬마돌 14, 회색시티 18,30)', JSON.stringify(after5.party) === '[[25,21],[74,14]]' && after5.map === 'PewterCity' && after5.x === 18 && after5.y === 30, JSON.stringify(after5));

// 멈춤 풀기
await page.evaluate(() => { window.__pe.MENU.openMenu(); });
await tapText('.menu button', '설정');
q = await dialog('= ?'); m = q.match(/(\d+) × (\d+)/);
await tapText('.choices button', String(Number(m[1]) * Number(m[2])));
await tapText('.choices button', '수학:');
await tapText('.choices button', '멈춤 풀기');
const s6 = await page.evaluate(async () => (await import('./js/learn/tutor.js')).settings().math);
ok('멈춤 풀기 → 다시 자동', s6.mode === 'auto' && s6.g == null, JSON.stringify(s6));
ok('자바스크립트 오류 없음', errs.length === 0, errs.slice(0, 3).join(' | '));
console.log(`\n설정 결과: ${pass} 통과, ${fail} 실패`);
await browser.close();
process.exit(fail ? 1 : 0);
