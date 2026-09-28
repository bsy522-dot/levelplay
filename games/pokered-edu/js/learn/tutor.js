/* 아이 속도 맞춤 엔진.
 * - 수학·과학 각각 '주제 사다리'(쉬운 것 -> 어려운 것)가 있고, 아이의 현재 위치(frontier)를 기억한다.
 * - 한 주제를 처음 시도에 3번 연속 맞히면 '익힘' -> 다음 주제로. 이미 아는 건 다시 안 낸다.
 * - 틀린 주제는 한동안 더 자주 나온다(복습). 첫 주제에서 3번 연속 틀리면 한 단계 내려간다.
 * - 체육관 배지를 딸 때마다 바닥(floor)이 한 칸 오른다 = 한 단계 어려워진다.
 * - 연속 정답이면 경험치가 최대 2배 -> 빨리 배우면 게임도 빨리 끝난다. */
import { G } from '../state.js';
import { DB } from '../data.js';
import { MATH as MATH_BASE } from './math.js';
import { MATH_ADV, NOTES } from './math_adv.js';
// 수학 사다리: 미취학 ~ 미적분 (기초 36 + 심화 20)
export const MATH_ALL = [...MATH_BASE, ...MATH_ADV];
export const MATH_ALL_BY = Object.fromEntries(MATH_ALL.map((s) => [s.id, s]));
const MATH = MATH_ALL, MATH_BY = MATH_ALL_BY;
/** 주제 설명 카드용: {t, idea, need} */
export function skillNote(id) { const s = MATH_BY[id] || SCI_BY[id] || {}; const n = NOTES[id] || {}; return { t: s.t || id, idea: s.idea || n.idea || '', need: s.need || n.need || '' }; }
import { weighted, pick, shuffle } from '../util.js';

export const SCI = [
  ['s_senses', 1, '우리 몸의 감각'], ['s_seasons', 1, '계절의 변화'], ['s_plants_need', 1, '식물이 자라려면'],
  ['s_animal_homes', 2, '동물이 사는 곳'], ['s_day_night', 2, '낮과 밤'], ['s_weather', 2, '날씨와 생활'],
  ['s_matter', 3, '물체와 물질'], ['s_animal_life', 3, '동물의 한살이'], ['s_magnet', 3, '자석의 성질'],
  ['s_earth', 3, '지구의 모습'], ['s_sound', 3, '소리의 성질'], ['s_soil', 3, '흙의 생성과 보존'],
  ['s_rocks', 4, '지층과 화석'], ['s_plant_life', 4, '식물의 한살이'], ['s_weight', 4, '물체의 무게'],
  ['s_mixture', 4, '혼합물의 분리'], ['s_water_states', 4, '물의 상태 변화'], ['s_shadow', 4, '그림자와 거울'],
  ['s_volcano', 4, '화산과 지진'], ['s_water_cycle', 4, '물의 여행'], ['s_heat', 5, '온도와 열'], ['s_solar', 5, '태양계와 별'],
  ['s_electric', 6, '전기의 이용'], ['s_light', 6, '빛과 렌즈'], ['s_combustion', 6, '연소와 소화'],
].map(([id, g, t]) => ({ id, g, t }));
const SCI_BY = Object.fromEntries(SCI.map((s) => [s.id, s]));

// 기술 타입 -> 어울리는 과학 주제 (전기 기술을 쓰면 전기 문제가 나오도록)
const TYPE_SCI = {
  Electric: ['s_electric', 's_magnet'], Water: ['s_water_states', 's_water_cycle', 's_weather'], Fire: ['s_heat', 's_combustion'],
  Grass: ['s_plants_need', 's_plant_life', 's_soil'], Bug: ['s_animal_life', 's_animal_homes'], Rock: ['s_rocks', 's_volcano', 's_soil'],
  Ground: ['s_rocks', 's_soil', 's_volcano', 's_earth'], Flying: ['s_weather', 's_animal_homes', 's_sound'], Ice: ['s_water_states', 's_seasons'],
  Psychic: ['s_solar', 's_light', 's_senses'], Poison: ['s_mixture', 's_matter'], Normal: [],
};

const LADDER = { math: MATH, sci: SCI };
const MASTER_STREAK = 3;

export const GRADES = [
  { g: 0, label: '아직 학교 안 다녀요 (6~7살)' }, { g: 1, label: '초등 1학년' }, { g: 2, label: '초등 2학년' },
  { g: 3, label: '초등 3학년' }, { g: 4, label: '초등 4학년' }, { g: 5, label: '초등 5~6학년' },
];

const L = () => G.s.learn;
function startIndex(subj, grade) {
  const lad = LADDER[subj];
  const g = subj === 'sci' ? Math.max(1, grade) : grade;
  const i = lad.findIndex((s) => s.g >= g);
  return i < 0 ? lad.length - 1 : i;
}

export function initLearn(grade) {
  G.s.learn = {
    grade,
    math: { floor: startIndex('math', grade), pos: startIndex('math', grade) },
    sci: { floor: startIndex('sci', grade), pos: startIndex('sci', grade) },
    sk: {}, // 주제별 {n, ok, streak, miss, mastered, placed, wrongRecent}
    streak: 0, best: 0, total: 0, correct: 0, retryOk: 0,
    recent: [], log: [],
  };
}

const sk = (id) => (L().sk[id] ||= { n: 0, ok: 0, streak: 0, miss: 0, mastered: false, placed: false, wrongRecent: 0, hist: [] });

export function frontier(subj) {
  const lad = LADDER[subj], st = L()[subj];
  for (let i = st.floor; i < lad.length; i++) if (!sk(lad[i].id).mastered) return i;
  return lad.length - 1;
}

/** 이번에 낼 문제 고르기. opts: {moveType, story, subject} */
export function nextQuestion(opts = {}) {
  const l = L();
  let subj = opts.subject;
  if (!subj) {
    const typeTopics = (TYPE_SCI[opts.moveType] || []);
    const pSci = typeTopics.length ? 0.4 : 0.25; // 수학 위주 (병석님: 수학 논술)
    subj = Math.random() < pSci ? 'sci' : 'math';
  }
  const lad = LADDER[subj];
  const f = frontier(subj);
  const cands = [];
  const hot = l.streak >= 5; // 잘하고 있으면 새 단계 위주로
  cands.push({ i: f, w: hot ? 9 : 6 });
  // 한 단계 위 맛보기는 지금 주제를 잘 풀고 있을 때만
  if (f + 1 < lad.length && (hot || sk(lad[f].id).streak >= 1)) cands.push({ i: f + 1, w: hot ? 3 : 1.2 });
  for (let i = Math.max(0, l[subj].floor - 3); i < f; i++) {
    const s = sk(lad[i].id);
    if (s.wrongRecent > 0) cands.push({ i, w: 3 });
    else if (s.mastered && !s.placed && (!hot || s.leapt)) cands.push({ i, w: s.leapt ? 1 : 0.4 }); // 건너뛴 주제는 가끔 확인
  }
  if (subj === 'sci' && opts.moveType) {
    const pref = TYPE_SCI[opts.moveType] || [];
    cands.forEach((c) => { if (pref.includes(lad[c.i].id)) c.w *= 4; });
    // 사다리 근처에 어울리는 주제가 있으면 하나 더 후보로
    pref.forEach((id) => { const i = lad.findIndex((s) => s.id === id); if (i >= 0 && i <= f + 1 && i >= f - 3 && !cands.some((c) => c.i === i)) cands.push({ i, w: 3 }); });
  }
  const c = weighted(cands, (x) => x.w);
  const skill = lad[c.i];
  const item = makeItem(subj, skill, !!opts.story);
  return { subj, skill: skill.id, title: skill.t, item };
}

function makeItem(subj, skill, story) {
  const l = L();
  if (subj === 'math') return MATH_BY[skill.id].gen(story);
  let pool = DB.science.filter((q) => q.topic === skill.id);
  if (story) { const sp = pool.filter((q) => q.story); if (sp.length) pool = sp; }
  const fresh = pool.filter((q) => !l.recent.includes(q.id));
  const it = pick(fresh.length ? fresh : pool);
  if (!it) return MATH_BY.m_add10.gen(false);
  l.recent.push(it.id); if (l.recent.length > 60) l.recent.shift();
  // 보기 순서를 섞되 설명이 따라가게
  const order = shuffle([0, 1, 2, 3]);
  const wrong = {};
  order.forEach((orig, i) => { if (orig !== it.c) wrong[i] = it.wrong[orig]; });
  return { q: it.q, a: order.map((o) => it.a[o]), c: order.indexOf(it.c), why: it.why, wrong, viz: it.viz, id: it.id };
}

/** 결과 기록. firstTry=false 면 재도전(설명을 본 뒤)이다. */
export function record(q, correct, firstTry = true) {
  const l = L(), s = sk(q.skill);
  const res = { mastered: false, streak: l.streak, stepDown: false };
  if (!firstTry) {
    if (correct) { l.retryOk++; s.wrongRecent = Math.max(0, s.wrongRecent - 1); }
    return res;
  }
  l.total++; s.n++;
  s.hist = [...(s.hist || []), correct ? 1 : 0].slice(-6);
  if (correct) {
    l.correct++; s.ok++; s.streak++; s.miss = 0;
    l.streak++; l.best = Math.max(l.best, l.streak);
    if (s.wrongRecent > 0) s.wrongRecent--;
    // 익힘: 최근 5문제 중 4개 이상 + 이번에도 정답 (요행 3연속 방지)
    const fast = l.streak >= 5 && q.skill === LADDER[q.subj][frontier(q.subj)].id; // 5연속 이상 = 빠른 길
    if (!s.mastered && fast) {
      s.mastered = true; res.mastered = true; res.fast = true;
      // 8연속 이상 = 도약: 다음 단계 하나는 건너뛴다 (나중에 틀리면 다시 내려올 수 있음)
      if (l.streak >= 8) { const lad = LADDER[q.subj], f2 = frontier(q.subj); if (f2 < lad.length - 1) { const nx = sk(lad[f2].id); nx.mastered = true; nx.leapt = true; res.leap = lad[f2].t; } }
    }
    const last5 = s.hist.slice(-5);
    const last4 = s.hist.slice(-4);
    if (!s.mastered && last4.length >= 3 && last4.reduce((a, b) => a + b, 0) >= 3 && s.streak >= 2) { s.mastered = true; res.mastered = true; }
  } else {
    s.streak = 0; s.miss++; s.wrongRecent = 2; l.streak = 0;
    // 지금 배우는 주제가 너무 어려우면 한 단계 쉽게:
    // 3번 연속 틀리거나, 최근 5~6문제 정답률이 40% 미만이면 (아래 주제가 어떻게 익힘 처리됐든) 되돌린다
    const st = l[q.subj], lad = LADDER[q.subj];
    const f = frontier(q.subj);
    const acc = s.hist.length >= 5 ? s.hist.reduce((a, b) => a + b, 0) / s.hist.length : 1;
    if (lad[f].id === q.skill && f > 0 && (s.miss >= 3 || acc < 0.4)) {
      const prev = sk(lad[f - 1].id);
      prev.mastered = false; prev.placed = false; prev.streak = 0; prev.hist = [];
      st.floor = Math.min(st.floor, f - 1); res.stepDown = true; s.miss = 0; s.hist = [];
    }
  }
  res.streak = l.streak;
  l.log.push({ t: Date.now(), k: q.skill, ok: correct ? 1 : 0 });
  if (l.log.length > 400) l.log.shift();
  return res;
}

/** 연속 정답 배율: 1 → 최대 2배 */
export const expMult = () => 1 + 0.25 * Math.min(L().streak, 4);

/* ── 오박사 자격 시험 (배치 고사) ── */
export function placementPlan() { return ['math', 'math', 'sci', 'math', 'math', 'sci', 'math']; }
export function placementQuestion(subj) {
  const l = L(), lad = LADDER[subj];
  const i = Math.min(l[subj].pos, lad.length - 1);
  return { subj, skill: lad[i].id, title: lad[i].t, item: makeItem(subj, lad[i], false), placement: true };
}
export function placementAnswer(q, correct) {
  const l = L(), lad = LADDER[q.subj], st = l[q.subj];
  l.total++; if (correct) l.correct++;
  st.pos = correct ? Math.min(lad.length - 1, st.pos + (q.subj === 'math' ? 2 : 1)) : Math.max(0, st.pos - 2);
}
export function placementDone() {
  const l = L();
  for (const subj of ['math', 'sci']) {
    const lad = LADDER[subj], st = l[subj];
    // 시험으로 확인한 곳 아래는 '이미 앎'으로
    st.floor = st.pos;
    for (let i = 0; i < st.pos; i++) { const s = sk(lad[i].id); if (!s.mastered) { s.mastered = true; s.placed = true; } }
  }
  return { math: LADDER.math[frontier('math')].t, sci: LADDER.sci[frontier('sci')].t };
}

export function onBadge() {
  const l = L();
  for (const subj of ['math', 'sci']) {
    const lad = LADDER[subj];
    l[subj].floor = Math.min(lad.length - 1, Math.max(l[subj].floor, frontier(subj)) + 1);
  }
}

export function report() {
  const l = L();
  const rows = (subj) => LADDER[subj].map((s, i) => {
    const x = l.sk[s.id];
    return { id: s.id, t: s.t, g: s.g, i, n: x?.n || 0, ok: x?.ok || 0, mastered: !!x?.mastered, placed: !!x?.placed, weak: (x?.wrongRecent || 0) > 0 };
  });
  return {
    total: l.total, correct: l.correct, best: l.best, streak: l.streak, retryOk: l.retryOk,
    acc: l.total ? Math.round((l.correct / l.total) * 100) : 0,
    math: rows('math'), sci: rows('sci'), fMath: frontier('math'), fSci: frontier('sci'),
  };
}
export const isNewSkill = (id) => !(L().sk[id] && (L().sk[id].n > 0 || L().sk[id].placed));
export const skillTitle = (id) => (MATH_BY[id] || SCI_BY[id] || {}).t || id;
