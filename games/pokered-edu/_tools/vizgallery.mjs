/* 그림(viz) 견본을 폰 화면 폭으로 한 장에 그려 찍는다 — 새 그림 종류를 눈으로 확인할 때.
 * 실행: node --import ./_tools/_localfs.mjs _tools/vizgallery.mjs [specs.json] [저장 폴더]
 *  specs.json = [{ "name": "...", "viz": {...} }] (없으면 아래 견본) */
import fs from 'fs';
import { chromium } from 'file:///C:/Users/User/AppData/Roaming/npm/node_modules/playwright/index.mjs';
const FILE = process.argv[2] && process.argv[2] !== '-' ? process.argv[2] : '';
const OUT = process.argv[3] || 'C:/Users/User/.claude/jobs/734d08b0/tmp/shots_viz';
fs.mkdirSync(OUT, { recursive: true });
const SAMPLES = [
  { name: 'plot 일차함수·점', viz: { type: 'plot', x: [-1, 5], y: [-1, 9], fns: [{ f: '2x+1', label: 'y = 2x + 1' }], pts: [{ x: 1, y: 3, label: '(1, 3)' }, { x: 3, y: 7, label: '(3, 7)' }], segs: [{ x1: 1, y1: 3, x2: 3, y2: 3, dash: true, label: '옆으로 2' , ly: 14}, { x1: 3, y1: 3, x2: 3, y2: 7, dash: true, label: '위로 4', lx: 26 }] } },
  { name: 'plot 복소평면', viz: { type: 'plot', x: [-4, 4], y: [-4, 4], vecs: [{ x: 3, y: 2, label: '3 + 2i' }], xl: '보통 수', yl: 'i 붙은 수', circle: 0 } },
  { name: 'plot 적분 넓이', viz: { type: 'plot', x: [0, 5], y: [0, 10], fns: [{ f: '2x', label: 'y = 2x' }], shade: { f: '2x', a: 3, b: 4, label: '넓이 7' } } },
  { name: 'turn i 네 번', viz: { type: 'turn', stops: ['→ 1', '↑ i', '← −1', '↓ −i'], step: 90, times: 4, cnt: 'i를 곱한 횟수' } },
  { name: 'balance 방정식', viz: { type: 'balance', L: '3x + 2', R: '17', steps: [{ L: '3x', R: '15', say: '양쪽에서 2씩 빼요' }, { L: 'x', R: '5', say: '양쪽을 3으로 나눠요' }] } },
  { name: 'hops 정수', viz: { type: 'hops', from: -10, to: 2, start: -5, hops: [-3] } },
  { name: 'icons 8+5', viz: { type: 'icons', rows: [{ e: '🐛', n: 8, t: '처음 8마리' }, { e: '🐛', n: 5, t: '더 온 5마리', c: 'a' }], op: '+', total: '모두 13마리' } },
  { name: 'icons 묶음', viz: { type: 'icons', rows: [{ e: '⚪', n: 12, per: 4, t: '4개씩 3묶음' }], total: '4 × 3 = 12' } },
  { name: 'flow 가로', viz: { type: 'flow', items: [{ e: '🧮', t: '손가락으로 세기' }, { e: '🔟', t: '10을 한 묶음' }, { e: '✏️', t: '자리를 정해 쓰기' }] } },
  { name: 'flow 순환', viz: { type: 'flow', loop: true, items: [{ e: '☀️', t: '해가 물을 데워요' }, { e: '💨', t: '수증기로 올라가요' }, { e: '☁️', t: '구름이 돼요' }, { e: '🌧️', t: '비로 내려요' }] } },
  { name: 'flow 세로', viz: { type: 'flow', items: [{ e: '1️⃣', t: '7을 오른쪽으로 옮기면 빼기로 바뀌어요' }, { e: '2️⃣', t: '47 − 7 = 40' }, { e: '3️⃣', t: '5x = 40 이니까 40 ÷ 5 = 8' }, { e: '✅', t: '5 × 8 + 7 = 47 맞아요!' }] } },
  { name: 'table 로그', viz: { type: 'table', head: ['2를 곱한 횟수', '결과'], rows: [['1번', '2'], ['2번', '4'], ['3번', '8'], ['5번', '32']], hi: 3 } },
  { name: 'chart 평균', viz: { type: 'chart', bars: [{ l: '피카츄', v: 5 }, { l: '꼬부기', v: 8 }, { l: '파이리', v: 8 }], unit: '번', line: 7, lineLabel: '평균 7' } },
  { name: 'wave', viz: { type: 'wave' } },
  { name: 'atom 탄소', viz: { type: 'atom', p: 6, n: 6, shells: [2, 4], label: '탄소 원자' } },
  { name: 'forces', viz: { type: 'forces', obj: '📦', arrows: [{ d: 'r', v: 10, t: '미는 힘 10' }, { d: 'l', v: 4, t: '마찰 4' }], result: '오른쪽으로 6만큼 밀려요' } },
  { name: 'timeline', viz: { type: 'timeline', ev: [{ y: '1545년', e: '📜', t: '카르다노: "제곱해서 −1이 되는 수가 필요해!"' }, { y: '1777년', e: '✍️', t: '오일러가 그 수에 i라는 이름을 붙여요' }, { y: '1800년대', e: '🧭', t: '가우스: i는 화살표를 90도 돌리는 수!' }, { y: '지금', e: '📱', t: '전기·전파·스마트폰 계산에 매일 써요' }] } },
  { name: 'vs', viz: { type: 'vs', L: { t: '❌ 헷갈린 생각', items: ['i를 4번 곱하면 4i', '곱하면 무조건 커진다'] }, R: { t: '⭕ 맞는 생각', items: ['i를 4번 곱하면 한 바퀴 → 1', 'i는 크기는 그대로, 방향만 돌려요'] } } },
  { name: 'scene', viz: { type: 'scene', items: [{ e: '🧑‍🔬', t: '수학자' }, { e: '❓', t: 'x × x = −1 ?' }, { e: '💡', t: '새 수 i' }], cap: '없던 수를 새로 만들어서 문제를 풀었어요' } },
];
const specs = FILE ? JSON.parse(fs.readFileSync(FILE, 'utf8')) : SAMPLES;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 360, height: 740 }, deviceScaleFactor: 2 });
const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
page.on('console', (m) => { if (m.type() === 'warning' || m.type() === 'error') errs.push(m.text()); });
await page.goto('http://localfs.test/js/learn/viz.js');
const res = await page.evaluate(async (specs) => {
  document.head.innerHTML = '<meta charset="utf-8"><link rel="stylesheet" href="/css/style.css">';
  await new Promise((r) => setTimeout(r, 300));
  document.body.innerHTML = '';
  document.body.style.cssText = 'margin:0;background:#dfe6f5;font-family:Jua,sans-serif;overflow:auto;height:auto';
  const { drawViz, vizProblems } = await import('/js/learn/viz.js');
  const out = [];
  for (const s of specs) {
    const card = document.createElement('div');
    card.className = 'lec-slide';
    card.style.cssText = 'margin:10px;font-size:16px';
    card.innerHTML = `<div class="jua lec-h">${s.name}</div>`;
    const v = drawViz(s.viz);
    if (v) card.append(v); else card.append('❌ 그림 없음');
    document.body.append(card);
    out.push({ name: s.name, ok: !!v, probs: vizProblems(s.viz) });
  }
  return out;
}, specs);
await page.waitForTimeout(9000); // 움직임이 끝날 때까지
const h = await page.evaluate(() => document.body.scrollHeight);
const per = 2200;
for (let i = 0, y = 0; y < h; i++, y += per) {
  await page.setViewportSize({ width: 360, height: Math.min(per, h - y) });
  await page.evaluate((yy) => window.scrollTo(0, yy), y);
  await page.screenshot({ path: `${OUT}/gallery_${i + 1}.png` });
}
for (const r of res) console.log(r.ok ? '✓' : '✗', r.name, r.probs.join('; '));
console.log('오류', errs.length, errs.slice(0, 5).join(' | '));
await browser.close();
