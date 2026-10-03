/* 학년별 공부 지도(HTML 한 장) — 게임 코드의 실제 사다리(수학·과학·인문)에서 뽑는다. 손으로 쓰지 않는다.
 * 단원마다: 📺 강의 · 📖 만화 · 🎬 영상 · 🧠 원리 문제 수 · 문제 수(과학·인문 은행)
 * 실행: node _tools/curriculum_html.mjs <저장할 html 경로> */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const GAME = path.join(here, '..');
const OUT = process.argv[2] || path.join(GAME, '공부지도.html');
globalThis.fetch = async (u) => ({ ok: true, status: 200, json: async () => JSON.parse(fs.readFileSync(path.resolve(GAME, u), 'utf8')) });
const mem = new Map();
globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) };
const R = (p) => pathToFileURL(path.join(GAME, p)).href;

const { loadAll, DB } = await import(R('js/data.js'));
await loadAll();
const { newState } = await import(R('js/state.js'));
const T = await import(R('js/learn/tutor.js'));
const { familyOf, familyTitle } = await import(R('js/learn/families.js'));
newState({ name: '지도', rival: '-', grade: 0 });
T.initLearn(0);
const rep = T.report(); // 게임이 쓰는 사다리 순서 그대로 (수학·과학·인문)

// lecture.js 의 만화·영상 표 (화면 코드라 node 에서 불러오지 않고 글자로 읽는다)
const lecSrc = fs.readFileSync(path.join(GAME, 'js/learn/lecture.js'), 'utf8');
const COMIC = Object.fromEntries([...lecSrc.matchAll(/(m_\w+): '(s\de\d\d)'/g)].map((m) => [m[1], m[2]]));
const YT = new Set([...lecSrc.matchAll(/(m_\w+): \[\{ id:/g)].map((m) => m[1]));
const EP_NO = { s1e01: 1, s1e02: 2, s1e03: 3, s1e04: 4, s1e05: 5, s2e01: 6, s2e02: 7, s2e03: 8, s2e04: 9, s2e05: 10 };
const bank = (id) => DB.science.filter((q) => q.topic === id).length;
const concept = (id) => (DB.concept || []).filter((q) => q.skill === id).length;
const hasLec = (id) => !!(DB.lectures || {})[id];

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function chip(subj, x) {
  const marks = [];
  if (hasLec(x.id)) marks.push('📺');
  if (COMIC[x.id]) marks.push(`📖${EP_NO[COMIC[x.id]]}화`);
  if (YT.has(x.id)) marks.push('🎬');
  if (subj === 'math' && concept(x.id)) marks.push(`🧠${concept(x.id)}`);
  // 과학·인문은 문제은행에 문제가 있어야 실제로 나온다 (없으면 게임이 건너뛴다 — tutor.js usable)
  const off = subj !== 'math' && !bank(x.id);
  const n = subj === 'math' ? '' : off ? '<span class="n">준비 중 — 아직 안 나와요</span>' : `<span class="n">${bank(x.id)}문제</span>`;
  const tag = subj === 'math' ? (familyOf(x.id) ? familyTitle(familyOf(x.id)) : '') : (x.f || '');
  return `<li${off ? ' class="off"' : ''}><span class="no">${x.i + 1}</span><span class="t">${esc(x.t)}</span>${tag ? `<span class="tag">${esc(tag)}</span>` : ''}${n}<span class="mk">${marks.join(' ')}</span></li>`;
}
const live = (k) => rep[k].filter((x) => k === 'math' || bank(x.id) > 0).length;
const SUBJ = [['math', '수학', '#3b6cd4'], ['sci', '과학', '#2e9e57'], ['hum', '인문', '#b5651d']];
const total = { math: rep.math.length, sci: rep.sci.length, hum: rep.hum.length };
const sections = T.GRADES.map(({ g, label }) => {
  const cols = SUBJ.map(([k, name, col]) => {
    const rows = rep[k].filter((x) => x.g === g);
    if (!rows.length) return '';
    const on = rows.filter((x) => k === 'math' || bank(x.id) > 0).length;
    return `<div class="col" style="--c:${col}"><h3>${name} <small>${rows.length}단원${on < rows.length ? ` · 지금 나오는 것 ${on}` : ''}</small></h3><ol>${rows.map((x) => chip(k, x)).join('')}</ol></div>`;
  }).join('');
  if (!cols) return '';
  return `<section><h2><span class="g">${g}</span>${esc(label)}</h2><div class="cols">${cols}</div></section>`;
}).join('\n');

const today = new Date().toISOString().slice(0, 10);
const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>공부 지도</title>
<style>
:root { --bg:#f6f8fc; --card:#fff; --ink:#1d2433; --sub:#5b6478; --line:#dde3ef; }
@media (prefers-color-scheme: dark) { :root { --bg:#12151c; --card:#1c212b; --ink:#e8ecf4; --sub:#a3acbf; --line:#2c3341; } }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 15px/1.5 -apple-system, 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; }
main { max-width: 1100px; margin: 0 auto; padding: 16px; }
h1 { font-size: 1.5em; margin: .2em 0; }
.lead { color: var(--sub); margin: 0 0 1em; }
.box { background: var(--card); border: 1px solid var(--line); border-radius: 14px; padding: 12px 14px; margin-bottom: 14px; }
.legend span { display: inline-block; margin: 2px 10px 2px 0; }
section { background: var(--card); border: 1px solid var(--line); border-radius: 16px; padding: 12px 14px; margin-bottom: 14px; }
h2 { font-size: 1.15em; margin: 0 0 8px; display: flex; align-items: center; gap: 8px; }
h2 .g { display: inline-grid; place-items: center; width: 1.8em; height: 1.8em; border-radius: 50%; background: #ffcb05; color: #1d2433; font-size: .85em; }
.cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 10px; }
.col { border-left: 5px solid var(--c); padding-left: 10px; }
h3 { margin: 0 0 4px; color: var(--c); font-size: 1em; } h3 small { color: var(--sub); font-weight: 400; }
ol { list-style: none; margin: 0; padding: 0; }
li { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px; padding: 4px 0; border-bottom: 1px dashed var(--line); }
li:last-child { border-bottom: 0; }
li.off { opacity: .45; } li.off .t { font-weight: 400; text-decoration: line-through dotted; }
.no { color: var(--sub); font-size: .8em; min-width: 1.8em; }
.t { font-weight: 600; }
.tag { font-size: .75em; background: color-mix(in srgb, var(--c) 15%, transparent); color: var(--c); border-radius: 8px; padding: 0 6px; }
.n { font-size: .75em; color: var(--sub); }
.mk { margin-left: auto; font-size: .85em; white-space: nowrap; }
footer { color: var(--sub); font-size: .8em; margin: 8px 0 24px; }
</style></head><body><main>
<h1>📚 포켓몬 공부 모험 — 학년별 공부 지도</h1>
<p class="lead">배틀에서 기술을 쓸 때 나오는 문제가 어느 학년, 어느 단원인지 한눈에. (게임 코드에서 그대로 뽑음 · ${today})</p>
<div class="box">
<b>한 줄 요약</b> — 수학 ${total.math}단원(6살 수 세기 → 대학 적분), 과학 ${total.sci}단원(몸·계절 → 양자역학), 인문 ${total.hum}단원(역사·지리·음악·미술·발명·철학)이 학년 순서대로 이어진 사다리예요.
아이는 고른 학년에서 시작해 잘 맞히면 위로, 자주 틀리면 아래로 움직여요. 문제는 수학 약 70% · 과학 약 25% · 인문 약 7%로 섞여 나와요.
${live('sci') < total.sci ? `<br><b>⚠ 솔직한 현황</b> — 과학은 ${total.sci}단원 중 <b>${live('sci')}단원만</b> 문제가 있어서 실제로 나와요. 회색 "준비 중" ${total.sci - live('sci')}단원(중학교 이상)은 문제를 아직 안 써서 게임이 건너뛰어요. 과학을 잘하는 아이는 지금 단계 끝에서 복습만 하게 돼요.` : ''}
</div>
<div class="box legend"><b>표시</b><br>
<span>📺 2분 강의</span><span>📖 만화 《수학이 태어난 날》</span><span>🎬 영상</span><span>🧠 원리 문제("왜 생겼을까") 수</span><span>과학·인문 = 문제은행 문제 수</span><span>수학 = 문제가 매번 새로 만들어짐</span>
<br><span>⚙ 설정(어른용)에서 과목별로 "이 학년에서 멈추기 / 이 학년부터 다시 / 속도"를 바꿀 수 있어요.</span></div>
${sections}
<footer>만든 곳: games/pokered-edu/_tools/curriculum_html.mjs — 단원이 바뀌면 다시 실행하면 같은 모양으로 새로 만들어져요.</footer>
</main></body></html>`;
fs.writeFileSync(OUT, html, 'utf8');
const shown = SUBJ.map(([k]) => rep[k].filter((x) => T.GRADES.some((G) => G.g === x.g)).length);
console.log(`저장: ${OUT}  (${Math.round(html.length / 1024)}KB) — 수학 ${total.math}·과학 ${total.sci}·인문 ${total.hum}단원, 지도에 실린 수 ${shown.join('·')}`);
