/* "숫자가 하나도 없는데 답은 숫자를 구하라는 문제" 검사 (2026-10-03 병석님 지적)
 * 게임이 실제로 문제를 만드는 길(questionFor → makeItem, 배틀 묶음 lessonQuestion 과 같은 함수)로
 * 수학 56주제 × 종류(계산·상황·원리) × 보기 4개/3개 를 대량으로 만들어 본다.
 *   잘못된 문제 = 정답이 숫자인데, 문장에 숫자가 하나도 없고, 문제 그림(pic)도 없는 것
 * 과학·인문 은행도 같은 기준으로 훑는다.
 * 실행: node _tools/numcheck.mjs [주제당 개수=300] */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const R = (p) => pathToFileURL(path.join(here, '..', p)).href;
const N = Number(process.argv[2] || 300);
globalThis.fetch = async (u) => ({ ok: true, status: 200, json: async () => JSON.parse(fs.readFileSync(path.resolve(here, '..', u), 'utf8')) });
const mem = new Map();
globalThis.localStorage = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) };

const { loadAll, DB } = await import(R('js/data.js'));
await loadAll();
const { newState } = await import(R('js/state.js'));
const T = await import(R('js/learn/tutor.js'));
newState({ name: '테스트', rival: '라이벌', grade: 3 });
T.initLearn(3);

const hasDigit = (s) => /[0-9０-９⁰¹²³⁴⁵⁶⁷⁸⁹]/.test(String(s || ''));
// 숫자를 한글로 쓴 경우(동전 두 개, 주사위 한 개)도 숫자가 있는 문제다
const hasNumWord = (s) => /(한|두|세|네|다섯|여섯|일곱|여덟|아홉|열)\s?(개|명|번|자리|마리|장)/.test(String(s || ''));
/* 사람이 읽고 정상으로 판정한 모양 (숫자 없이 묻는 게 맞는 문제) */
const OK_SHAPE = [
  [/^m_compare10\b/, /보기 중에서 가장 큰 수/],   // 보기 4개 중에서 고르는 문제
  [/^m_angle\b/, /^(직각|일직선\(평각\))은 몇 도일까\?$/], // 외우는 지식
];
const bad = [], exprBad = [];
let made = 0, noDigitWithPic = 0, exprChecked = 0;
/* 식과 정답이 맞는지: "26 + 45 = ?" 처럼 문장이 식 하나면 직접 계산해 비교한다 */
function checkExpr(where, it) {
  const m = String(it.q).replace(/−/g, '-').match(/^\s*\(?(-?\d+)\)?\s*([+\-×÷])\s*\(?(-?\d+)\)?\s*=\s*\?\s*$/);
  if (!m) return;
  const a = Number(m[1]), b = Number(m[3]);
  const v = m[2] === '+' ? a + b : m[2] === '-' ? a - b : m[2] === '×' ? a * b : (b && a % b === 0 ? a / b : null);
  if (v == null) return;
  exprChecked++;
  const ans = Number(String(it.a[it.c]).replace(/−/g, '-').replace(/[^\d\-.]/g, ''));
  if (ans !== v) exprBad.push(`${where}: "${it.q}" → 표시된 정답 ${it.a[it.c]}, 실제 ${v}`);
}
function check(where, it) {
  made++;
  if (!it || !Array.isArray(it.a) || !(it.c >= 0 && it.c < it.a.length)) { bad.push(`${where}: 보기/정답 형식 깨짐`); return; }
  checkExpr(where, it);
  const ans = it.a[it.c];
  if (hasNumWord(it.q)) return;
  if (where.startsWith('은행 ')) return;  // 손으로 쓴 지식 문제(낮 12시 무렵, 3박자 …) — 독립 검증을 거침
  if (OK_SHAPE.some(([w, q]) => w.test(where.replace(/^묶음 /, '')) && q.test(it.q))) return;
  if (!hasDigit(ans)) return;            // 정답이 숫자가 아니면 해당 없음 (원리 문제 등)
  if (hasDigit(it.q)) return;            // 문장에 숫자가 있으면 OK
  if (it.pic) { noDigitWithPic++; return; } // 그림을 보고 세는 문제 (예: 사과가 몇 개일까?)
  bad.push(`${where}: "${it.q}" → 정답 ${ans}`);
}

for (const s of T.MATH_ALL) {
  for (const kind of ['calc', 'apply', 'principle']) {
    for (const three of [false, true]) {
      for (let i = 0; i < N / 6; i++) {
        let q;
        try { q = T.questionFor('math', s.id, { kind, three }); } catch (e) { bad.push(`${s.id}/${kind}: 만들다가 오류 ${e.message}`); break; }
        check(`${s.id}/${q.item.kind || kind}${three ? '/3지' : ''}`, q.item);
      }
    }
  }
}
// 배틀 묶음 경로(틀린 뒤 쉬운 주제 + 보기 3개 포함)
for (let b = 0; b < 400; b++) {
  const ls = T.newLesson();
  for (let k = 0; k < 6; k++) {
    const q = T.nextQuestion({ lesson: ls, subject: 'math' });
    check(`묶음 ${q.skill}/${q.kind}${q.item.three ? '/3지' : ''}`, q.item);
    T.lessonResult(ls, Math.random() < 0.6);
  }
}
// 과학·인문 은행 (손으로 쓴 문제)
for (const it of DB.science) check(`은행 ${it.id}`, it);

// 같은 모양(주제 + 숫자를 지운 문장)끼리 묶어 한 줄씩 — 사람이 읽고 판정한다
const groups = new Map();
for (const b of bad) {
  const m = b.match(/^(?:묶음 )?([a-z0-9_]+)[^:]*: "(.*)" → 정답 (.*)$/);
  const key = m ? `${m[1]} | ${m[2]}` : b;
  if (!groups.has(key)) groups.set(key, { n: 0, ans: new Set() });
  const g = groups.get(key); g.n++; if (m) g.ans.add(m[3]);
}
const uniq = [...groups.keys()];
console.log(`만든 문제 ${made}개 (그림을 보고 세는 숫자 없는 문제 ${noDigitWithPic}개는 정상)`);
console.log(uniq.length ? uniq.map((k) => `${k}  (${groups.get(k).n}회, 정답 예: ${[...groups.get(k).ans].slice(0, 4).join(', ')})`).join('\n') : '숫자 없이 숫자를 구하라는 문제: 0건');
const ex = [...new Set(exprBad)];
console.log(`식을 직접 계산해 정답과 비교: ${exprChecked}개 중 틀린 정답 ${ex.length}건`);
if (ex.length) console.log(ex.slice(0, 20).join('\n'));
console.log(`\n숫자 검사 결과: 숫자 없는 문제 ${uniq.length}종, 식-정답 불일치 ${ex.length}건`);
process.exit(uniq.length || ex.length ? 1 : 0);
