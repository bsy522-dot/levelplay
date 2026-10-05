/* 인문 문제은행 검증 — schema.js 의 스키마(요구사항 20)를 그대로 쓴다.
 * 실행: node _tools/test_human.mjs
 *
 * 검사: ① 필수 필드 ② 보기 4개·중복 없음 ③ 정답 인덱스 범위
 *      ④ 오답설명 키가 정답만 뺀 3개 ⑤ 한국어 문장에 라틴 오염 문자 없음
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const R = (p) => pathToFileURL(path.join(here, '..', p)).href;

const { valid, REQUIRED } = await import(R('js/learn/schema.js'));
const { HUMAN } = await import(R('js/learn/tutor.js'));

const bank = JSON.parse(fs.readFileSync(path.join(here, '..', 'data', 'human.json'), 'utf8'));

let bad = 0;
const fail = (m) => { bad++; console.log('✗', m); };

/* ── 사다리 6단계 전부가 문제은행에 존재하는가 ── */
const topics = new Set(bank.map((q) => q.topic));
for (const h of HUMAN) {
  const n = bank.filter((q) => q.topic === h.id).length;
  if (n === 0) fail(`사다리 ${h.id}("${h.t}") — 문제 0건`);
  else console.log(`· ${h.t.padEnd(14)} ${n}문제`);
}

/* ── 스키마 통과 ── */
for (const q of bank) {
  for (const f of REQUIRED) {
    if (q[f] == null || q[f] === '') fail(`${q.id}: 필수 '${f}' 없음`);
  }
  if (!valid(q)) fail(`${q.id}: schema.valid() 통과 실패`);
  if (!Array.isArray(q.a) || q.a.length !== 4) fail(`${q.id}: 보기 ${q.a?.length}개 (4 이어야)`);
  else if (new Set(q.a).size !== 4) fail(`${q.id}: 보기 중복`);
  if (!(q.c >= 0 && q.c < 4)) fail(`${q.id}: 정답 ${q.c} 범위 밖`);
  const wk = Object.keys(q.wrong || {}).map(Number).sort().join();
  if (wk !== [0, 1, 2, 3].filter((x) => x !== q.c).join()) fail(`${q.id}: 오답설명 키 ${wk}`);
  if (!q.field) fail(`${q.id}: field 없음`);
}

/* ── 한국어 문장 속 라틴 오염 문자 (작성 사고를 잡는다) ── */
const ALLOW = new Set(['CPU', 'O', 'X', 'AI', 'SNS', 'TV', 'cm', 'km']); // 교과서에도 그대로 쓰는 단위·약어 (2026-10-03 인문 확장)
const scan = (id, f, s) => {
  const re = /[A-Za-z]{2,}/g;
  let m;
  while ((m = re.exec(String(s || '')))) {
    if (!ALLOW.has(m[0])) fail(`${id} [${f}] 라틴 오염 '${m[0]}' — "${String(s).slice(Math.max(0, m.index - 18), m.index + 18)}"`);
  }
};
for (const q of bank) {
  for (const f of ['q', 'why', 'big', 'need', 'depth']) scan(q.id, f, q[f]);
  for (const v of Object.values(q.wrong || {})) scan(q.id, 'wrong', v);
}

/* ── 요구사항 18번 문체 — 딱딱한 교과서 설명이 섞였나 ── */
for (const q of bank) {
  if (/이다\.|를 구하는|연산이다/.test(q.why)) fail(`${q.id}: 해설이 교과서체 — 18번 위반 (${q.why.slice(0, 40)}…)`);
}

console.log(bad ? `\n문제 ${bad}건` : `\n인문 ${bank.length}문제 — 모든 검사 통과`);
process.exit(bad ? 1 : 0);