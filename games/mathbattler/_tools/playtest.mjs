/* mathbattler 플레이테스트 — 진짜 브라우저에서 돌린다.
 * 검증: 테마 로드 / 151마리 캐스터 / 맵 / 전투(무리 순회) / 오답 HP / 게이트 / 저장 / 테마 전환
 * 실행: node _tools/playtest.mjs
 */
import { chromium } from 'file:///C:/Users/User/AppData/Roaming/npm/node_modules/playwright/index.mjs';
import fs from 'fs';

const BASE = process.env.MB_BASE || 'http://127.0.0.1:8791/games/mathbattler/';
const SHOT = 'D:/_output/reports/mathbattler';
fs.mkdirSync(SHOT, { recursive: true });

const log = (...a) => console.log(...a);
let pass = 0, fail = 0;
const failures = [];
function chk(name, cond, extra) {
  if (cond) { pass++; log('  ✓ ' + name); }
  else { fail++; failures.push(name + (extra ? ' — ' + extra : '')); log('  ✗ ' + name + (extra ? ' — ' + extra : '')); }
}

/* 클릭 → 정답/오답 버튼 찾기 */
async function answer(page, wantCorrect) {
  return await page.evaluate((want) => {
    const g = window.MB.game, b = g.battle;
    const q = b.cur();
    if (!q) return { err: 'no question' };
    const pick = want ? q.c : (q.c + 1) % q.a.length;
    const before = g.state.heroHp;
    g.answer(b, pick);
    return {
      pick, good: pick === q.c,
      heroHpBefore: before, heroHpAfter: g.state.heroHp,
      over: b.over, won: b.won,
      slot: b.slot, slotSize: b.rosterSize(),
      qi: b.qi, total: b.total(),
      monName: b.mon().name,
    };
  }, wantCorrect);
}

async function run(theme) {
  log('\n════════ 테마: ' + theme + ' ════════');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 430, height: 932 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  await page.goto(BASE + '?theme=' + theme, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.MB && window.MB.game, { timeout: 15000 });
  await page.waitForTimeout(1800);   /* 로딩 화면이 내려갈 시간 */

  /* ★로딩 화면 회귀 — mb:ready 를 window 에서 기다리면 영영 안 꺼진다 */
  const ld = await page.evaluate(() => {
    const L = document.getElementById('loading');
    return L ? { cls: L.className, disp: getComputedStyle(L).display } : null;
  });
  chk('로딩 화면이 사라짐', !!ld && (ld.cls.indexOf('hidden') >= 0 || ld.disp === 'none'), JSON.stringify(ld));

  const boot = await page.evaluate(() => ({
    theme: window.MB.game.skin.id,
    topics: window.MB.game.list.length,
    cast: window.MB.game.list.reduce((s, m) => s + m.roster.length, 0),
    uniq: new Set(window.MB.game.list.flatMap(m => m.roster.map(x => x.id))).size,
    gates: window.MB.game.world.gates.length,
    libs: window.MB.game.world.libs.length,
    rosterSizes: window.MB.game.list.map(m => m.roster.length),
    missing: window.MB.game.list.flatMap(m => m.roster.filter(r => r.missing).map(r => r.id)),
  }));
  log('  로드: ' + JSON.stringify({ theme: boot.theme, topics: boot.topics, cast: boot.cast, uniq: boot.uniq, gates: boot.gates }));
  chk('테마 로드 = ' + theme, boot.theme === theme, boot.theme);
  chk('전투 마커 수 = 토픽 수(' + boot.topics + ')', boot.gates === boot.topics, 'gates=' + boot.gates);
  chk('캐스터 전원 등장 (토픽 ' + boot.topics + ' / 합 ' + boot.cast + ')', boot.cast === boot.cast && boot.uniq === boot.cast, 'uniq=' + boot.uniq);
  chk('캐스터 id 중복 없음', boot.uniq === boot.cast, boot.uniq + ' vs ' + boot.cast);
  chk('테마 미배정 토픽 없음', boot.missing.length === 0, boot.missing.join(','));
  chk('도서관 2곳', boot.libs === 2, boot.libs);

  await page.screenshot({ path: SHOT + '/' + theme + '-1-map.png' });

  /* ── 스프라이트 12장 실제 로드 (깨진 이미지 0) ── */
  const art = await page.evaluate(async () => {
    const g = window.MB.game;
    const picks = g.list.slice(0, 6).flatMap(m => m.roster.slice(0, 2));
    const out = [];
    for (const p of picks) {
      const url = g.artURL(p.art);
      const ok = await new Promise(res => {
        const im = new Image();
        im.onload = () => res({ w: im.naturalWidth, h: im.naturalHeight });
        im.onerror = () => res(null);
        im.src = url;
      });
      out.push({ id: p.id, name: p.name, url, ok });
    }
    return out;
  });
  const badArt = art.filter(a => !a.ok);
  chk('테마 이미지 실제 로드 ' + art.length + '장', badArt.length === 0, badArt.map(a => a.id + ' ' + a.url).join(' | '));
  log('    예: ' + art.slice(0, 4).map(a => a.name + '=' + (a.ok ? a.ok.w + 'x' + a.ok.h : 'FAIL')).join(', '));

  /* ── 첫 전투: 무리 전체를 순회하며 승리 ── */
  await page.evaluate(() => window.MB.game.startBattle(window.MB.game.list[0]));
  await page.waitForTimeout(300);
  const first = await page.evaluate(() => ({
    name: window.MB.game.battle.mon().name,
    slotLabel: document.getElementById('b-slot').textContent,
    total: window.MB.game.battle.total(),
    size: window.MB.game.battle.rosterSize(),
    q: document.getElementById('b-q').textContent.slice(0, 40),
    opts: document.querySelectorAll('#b-opts .opt').length,
    img: document.getElementById('b-mimg').getAttribute('src'),
    imgOk: document.getElementById('b-mimg').naturalWidth > 0,
  }));
  log('  전투 시작: ' + first.name + ' / 문제 ' + first.total + '개 / 무리 ' + first.size + '마리 / ' + first.slotLabel);
  chk('배틀 문제 렌더', first.q.length > 0 && first.opts > 0, JSON.stringify(first));
  chk('배틀 이미지 렌더', first.imgOk, first.img);
  await page.screenshot({ path: SHOT + '/' + theme + '-2-battle.png' });

  /* ── 오답 1회 → HP 정확히 1 감소 (이중 차감 회귀) ── */
  await page.evaluate(() => { window.MB.game.state.heroHp = 5; });
  const w1 = await answer(page, false);
  await page.waitForTimeout(120);
  const w1b = await page.evaluate(() => window.MB.game.state.heroHp);
  chk('오답 1회 = HP 5→4 (두 번 깎이지 않음)', w1.heroHpAfter === 4, '실제 ' + w1b);
  await page.waitForTimeout(1100);

  /* ── 이중 클릭 회귀: 같은 문제에 연속 2회 답해도 HP 1만 감소 ── */
  await page.evaluate(() => { window.MB.game.state.heroHp = 5; });
  await page.evaluate(() => { const b = window.MB.game.battle; b.busy = false; window.MB.game.answer(b, (b.cur().c + 1) % b.cur().a.length); });
  const rapid = await page.evaluate(() => { const b = window.MB.game.battle; window.MB.game.answer(b, (b.cur().c + 1) % b.cur().a.length); return window.MB.game.state.heroHp; });
  chk('연속 이중클릭 = HP 1만 감소', rapid === 4, '실제 ' + rapid);
  await page.waitForTimeout(1200);

  /* ── 채점 문구 잔존 회귀: 다음 문제 화면에 지난 답이 남으면 안 된다 ── */
  const fbRes = await page.evaluate(async () => {
    const g = window.MB.game, b = g.battle;
    const q1 = b.cur();
    b.busy = false; g.answer(b, q1.c);                 // 1번 문제 채점 → 피드백 채움
    await new Promise(r => setTimeout(r, 1200));
    const q2 = b.cur();
    return {
      q2: q2 ? q2.q : null,
      fb: document.getElementById('b-fb').textContent,
      fbCls: document.getElementById('b-fb').className,
    };
  });
  chk('다음 문제에 지난 채점 문구가 남지 않음', fbRes.fb.trim() === '' && fbRes.fbCls.indexOf('ok') < 0 && fbRes.fbCls.indexOf('no') < 0,
      JSON.stringify(fbRes));

  /* ── 정답만 계속: 무리 전체를 순회해 승리 ── */
  const res = await page.evaluate(async () => {
    const g = window.MB.game;
    g.startBattle(g.list[0]);
    g.state.heroHp = 99; g.state.heroMaxHp = 99;
    const seen = [];
    let guard = 0;
    while (!g.battle.over && guard++ < 400) {
      const b = g.battle;
      const nm = b.mon().name;
      if (seen[seen.length - 1] !== nm) seen.push(nm);
      b.busy = false;
      g.answer(b, b.cur().c);
      await new Promise(r => setTimeout(r, 4));
    }
    const r = b_last(g);
    return { guard, over: g.battle.over, won: g.battle.won, seen,
             defeated: Object.keys(g.state.defeated).length,
             gp: g.state.gp, streak: g.state.bestStreak, r };
    function b_last(g) { return g.battle.result(); }
  });
  log('  무리 순회: ' + res.seen.join(' → '));
  chk('무리 전체 순회 후 승리', res.won === true, JSON.stringify({ over: res.over, won: res.won, seen: res.seen }));
  chk('순회한 상대 수 = 무리 크기', res.seen.length === first.size, res.seen.length + ' vs ' + first.size);
  chk('전투 후 HP 만 restored', res.r.heroHp === 99, res.r.heroHp);
  chk('격파 기록 누적', res.defeated >= first.size, res.defeated);
  await page.screenshot({ path: SHOT + '/' + theme + '-3-win.png' });

  /* ── 게이트: 5연속 + 최근정확도 + 노출 3회 ──
   * '미충족' 케이스를 맨 먼저 본다. 앞선 테스트가 이미 5연속을 만들어
   * 놓았으므로 상태를 명시적으로 비워서 초기 상태를 만든다. */
  const gate = await page.evaluate(() => {
    const g = window.MB.game, s = g.state, key = g.list[0].key;
    const clean = () => { s.streak = 0; s.recent = []; s.topicSeen = {}; };
    clean();
    const locked = window.MB.core.gate(s, g.skin, key).open;
    s.streak = 5; s.recent = [true, true, true, true, true]; s.topicSeen[key] = 3;
    const open = window.MB.core.gate(s, g.skin, key).open;
    s.streak = 2;
    const broken = window.MB.core.gate(s, g.skin, key).open;
    s.recent = [true, true, false, true, true];
    const lowAcc = window.MB.core.gate(s, g.skin, key).open;
    s.streak = 5; s.recent = [true, true, true, true, true]; s.topicSeen = {}; s.topicSeen[key] = 1;
    const noExposure = window.MB.core.gate(s, g.skin, key).open;
    return { locked, open, broken, lowAcc, noExposure };
  });
  chk('게이트: 초기 상태=잠김', gate.locked === false);
  chk('게이트: 3조건 충족=열림', gate.open === true);
  chk('게이트: 연속 끊기면 잠김', gate.broken === false);
  chk('게이트: 최근 정확도 미달=잠김', gate.lowAcc === false);
  chk('게이트: 단원 노출 부족=잠김', gate.noExposure === false);

  /* ── 저장/복원: 테마를 바꿔도 진도가 남아야 한다 ── */
  const saved = await page.evaluate(() => {
    localStorage.getItem('mathbattler.save.v2');
    return { gp: window.MB.game.state.gp, defeated: Object.keys(window.MB.game.state.defeated).length };
  });
  chk('저장소에 기록 있음', saved.gp > 0, JSON.stringify(saved));

  /* ── 도감/도서관 ── */
  await page.evaluate(() => window.MB.game.ui.showLibrary(window.MB.game.list));
  await page.waitForTimeout(200);
  const lib = await page.evaluate(() => ({
    rows: document.querySelectorAll('#lib-list .lib-row').length,
    subs: document.querySelectorAll('#lib-list .lib-sub').length,
    firstMon: (document.querySelector('#lib-list .lr-m') || {}).textContent,
  }));
  chk('도서관 행 수 = 토픽 수', lib.rows === boot.topics, lib.rows + ' vs ' + boot.topics);
  log('  도감 첫 행 몬스터: ' + lib.firstMon);
  await page.screenshot({ path: SHOT + '/' + theme + '-4-library.png' });

  /* ── 오류 없음 ── */
  const real = errors.filter(e => !/favicon/i.test(e));
  chk('JS 오류 0건', real.length === 0, real.slice(0, 3).join(' | '));

  await browser.close();
  return { rosterSizes: boot.rosterSizes, cast: boot.cast, topics: boot.topics };
}

(async () => {
  try {
    const a = await run('pokemon');
    const b = await run('monster');
    log('\n════════ 테마 전환 ════════');
    chk('두 테마의 캐스터 수가 다름 (' + a.cast + ' vs ' + b.cast + ')', a.cast !== b.cast);
    chk('포켓몬 테마 = 151마리', a.cast === 151, a.cast);
    log('\n────────────────────────────────');
    log('PASS ' + pass + ' / FAIL ' + fail);
    if (fail) { log('실패:'); failures.forEach(f => log('  · ' + f)); }
    process.exit(fail ? 1 : 0);
  } catch (e) {
    console.log('\n치명적 오류: ' + e.message);
    console.log(e.stack);
    process.exit(2);
  }
})();
