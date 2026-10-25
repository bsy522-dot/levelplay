/* 쉬운 설명 기준(ELI5_GUIDE.md) 자동 검사 — 그림 글이 맞는 모양인지, 글이 폰 한 화면에 들어가는지, 빠진 칸은 없는지.
 * 실행: node _tools/eli5check.mjs            → 게임 data/ 전부
 *       node _tools/eli5check.mjs <폴더>     → 그 폴더의 lectures_*.json · q_*.json (쓰는 중인 원고)
 *       --strict  → 경고도 실패로 셈 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url));
const { vizProblems } = await import(pathToFileURL(path.join(here, '../js/learn/viz.js')).href);
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const STRICT = process.argv.includes('--strict');
const DATA = path.join(here, '../data');
const read = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
let lectures = {}, questions = [];
if (args[0]) {
  for (const f of fs.readdirSync(args[0])) {
    if (/^lectures_.*\.json$/.test(f)) Object.assign(lectures, read(path.join(args[0], f)));
    if (/^q_.*\.json$/.test(f)) questions.push(...read(path.join(args[0], f)));
  }
} else {
  lectures = read(path.join(DATA, 'lectures.json'));
  for (const f of ['science_a', 'science_b', 'science_c', 'human', 'arts', 'jobs', 'concept_math']) questions.push(...read(path.join(DATA, f + '.json')));
}
const errs = [], warns = [];
const len = (s) => [...String(s || '')].length;
const viz = (where, v) => { for (const p of vizProblems(v)) errs.push(`${where}: ${p}`); };

let newFmt = 0;
for (const [id, L] of Object.entries(lectures)) {
  const S = L.slides || [];
  const isNew = !!L.why && S.some((s) => s.kind === 'story');
  if (isNew) newFmt++;
  else { if (args[0]) errs.push(`${id}: why 또는 kind:"story" 장이 없음 (새 기준 아님)`); continue; }
  if (S.length < 7 || S.length > 12) warns.push(`${id}: 장 수 ${S.length} (8~11 권장)`);
  if (S[0]?.kind !== 'story') warns.push(`${id}: 첫 장이 story 가 아님`);
  for (const k of ['oops', 'now']) if (!S.some((s) => s.kind === k)) warns.push(`${id}: kind:"${k}" 장 없음`);
  const nViz = S.filter((s) => s.viz).length;
  if (nViz < 5) warns.push(`${id}: 그림 있는 장 ${nViz}개 (5개 이상)`);
  if (len(L.why) > 160) warns.push(`${id}: why ${len(L.why)}자 (160 이하)`);
  if (!L.key) warns.push(`${id}: key 없음`);
  S.forEach((s, i) => {
    const w = `${id} ${i + 1}장`;
    if (!s.h) errs.push(`${w}: 제목(h) 없음`);
    if (!s.text && !s.viz) errs.push(`${w}: 글도 그림도 없음`);
    if (len(s.text) > 135) warns.push(`${w}: 글 ${len(s.text)}자 (120 이하)`);
    if ((s.steps || []).length > 5) warns.push(`${w}: 단계 ${s.steps.length}개 (5 이하)`);
    (s.steps || []).forEach((t, k) => { if (len(t) > 40) warns.push(`${w} 단계${k + 1}: ${len(t)}자 (35 이하)`); });
    if (len(s.tip) > 60) warns.push(`${w}: tip ${len(s.tip)}자 (50 이하)`);
    if (s.kind && !['story', 'idea', 'oops', 'now'].includes(s.kind)) errs.push(`${w}: 모르는 kind '${s.kind}'`);
    if (s.viz) viz(w, s.viz);
  });
}

let withHelp = 0, withPic = 0, longest = 0;
const leaks = [];
for (const q of questions) {
  const w = q.id;
  if (!q.q || !Array.isArray(q.a) || !(q.c >= 0 && q.c < q.a.length)) { errs.push(`${w}: q/a/c 모양이 이상함`); continue; }
  const need = q.a.map((_, i) => i).filter((i) => i !== q.c).map(String).sort().join();
  if (Object.keys(q.wrong || {}).sort().join() !== need) errs.push(`${w}: 오답 설명 칸 ${Object.keys(q.wrong || {}).join()} (필요 ${need})`);
  if (!q.why) errs.push(`${w}: why 없음`);
  if (q.help) withHelp++;
  // 정답 흘림 의심: 📖 낱말 풀이가 '정답 보기에만 있는 낱말'을 풀어 준다 (문제 글과 틀린 보기에는 없는 낱말)
  if (q.help) {
    const strip = (w) => w.replace(/(으로|에서|이야|이에요|예요|이라|라서|하고|에게|처럼|까지|부터|이랑|랑|이|가|을|를|은|는|의|에|로|와|과|도|만|야|해|돼)$/u, '');
    const words = (s) => (String(s).match(/[가-힣A-Za-z]{2,}/gu) || []).map(strip).filter((w) => w.length >= 2);
    const others = q.a.filter((_, i) => i !== q.c).join(' ');
    const leak = words(q.a[q.c]).find((w) => q.help.includes(w) && !String(q.q).includes(w) && !others.includes(w));
    if (leak) leaks.push(`${q.id}: 낱말 풀이가 정답에만 있는 '${leak}'을(를) 풀어 줌`);
  }
  if (q.pic) { withPic++; viz(`${w} pic`, q.pic); }
  if (q.viz) viz(`${w} viz`, q.viz);
  if (!args[0]) continue; // 게임 전체 검사에서는 형식만 (글 길이 경고는 원고 검사 때)
  if (len(q.q) > 90) warns.push(`${w}: 문제 ${len(q.q)}자 (70 권장)`);
  if (len(q.help) > 70) warns.push(`${w}: help ${len(q.help)}자 (60 이하)`);
  if (len(q.why) > 150) warns.push(`${w}: why ${len(q.why)}자 (130 이하)`);
  for (const [k, t] of Object.entries(q.wrong || {})) if (len(t) > 100) warns.push(`${w}: 오답${k} 설명 ${len(t)}자 (90 이하)`);
  q.a.forEach((t, i) => { if (len(t) > 24) warns.push(`${w}: 보기${i + 1} ${len(t)}자 (20 이하)`); });
  const L = q.a.map(len), mx = Math.max(...L);
  if (L[q.c] === mx && L.filter((x) => x === mx).length === 1 && mx - Math.max(...L.filter((_, i) => i !== q.c)) >= 3) { longest++; warns.push(`${w}: 정답 보기가 혼자 가장 김`); }
  for (const s of q.steps || []) if (len(s) > 40) warns.push(`${w}: 단계 ${len(s)}자 (35 이하)`);
}

console.log(`강의 ${Object.keys(lectures).length}개 (새 기준 ${newFmt}개) · 문제 ${questions.length}개 (낱말 풀이 ${withHelp}, 문제 그림 ${withPic})`);
for (const e of errs.slice(0, 80)) console.log('✗', e);
for (const e of warns.slice(0, 120)) console.log('△', e);
for (const e of leaks.slice(0, process.argv.includes('--leaks') ? 9999 : 20)) console.log('◇ 정답 흘림 의심', e);
if (leaks.length) console.log(`정답 흘림 의심 ${leaks.length}건 (--leaks 로 전부 보기)`);
console.log(`\n오류 ${errs.length}건 · 경고 ${warns.length}건${longest ? ` (정답이 혼자 가장 긴 문제 ${longest}개)` : ''}`);
process.exit(errs.length || (STRICT && warns.length) ? 1 : 0);
