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
import { weighted, pick, shuffle, signature } from '../util.js';
import { prereqs, nexts, GRAPH, CROSS, QTYPES, LEVELS } from './schema.js';
import { vary } from './variety.js';

/* ── 튜닝 상수 (한 곳에서만 바꾼다) ──
 * PRACTICE_REWARD : 학교 연습 1문제 정답 보상(원)
 * EXP_GAIN_BOOST  : 원작 대비 경험치 가속 배수 ("조금만" — 1.35배)
 * SCI_P           : 기술 쓸 때 과학 문제 뽑을 확률 (수학 논술 위주 유지)
 * SAME_Q_BLOCK    : 같은 문제를 연속으로 몇 번까지 허용하는지 (병석님: 3)
 * HUMAN_RATE      : 인문(역사·지리·음악·미술) 문제가 섞일 확률 */
export const PRACTICE_REWARD = 1000;
export const EXP_GAIN_BOOST = 1.35;
export const SCI_P = 0.25;
export const SAME_Q_BLOCK = 3;
export const HUMAN_RATE = 0.07;

/* ── 과학 사다리: [id, 단계, 제목, 분야]
 * 단계 g: 1=초등저 2=초등고 3=중1 4=중2 5=중3 6=고1 7=고2 8=고3 9=대학 기초
 *           10=학부(양자역학·상대론·열역학) 11=입문+ 12=심화+
 * `g` 는 학위가 아니라 '이 주제를 어디까지 따라갈 수 있는가'의 난이도 사다리다.
 * 원작 대비 쉽다는 요청을 반영해 앞 6단계는 아주 쉽게 두고, 뒤로 갈수록 깊어진다. */
export const SCI = [
  /* ── 1단계: 몸·감각·자연 (초등저) ── */
  ['s_senses', 1, '우리 몸의 감각', '생명'], ['s_seasons', 1, '계절의 변화', '지구'],
  ['s_plants_need', 1, '식물이 자라려면', '생명'], ['s_animal_homes', 2, '동물이 사는 곳', '생명'],
  ['s_day_night', 2, '낮과 밤', '지구'], ['s_weather', 2, '날씨와 생활', '지구'],
  /* ── 2단계: 물질·힘·에너지 (초등고~중1) ── */
  ['s_matter', 3, '물체와 물질', '화학'], ['s_animal_life', 3, '동물의 한살이', '생명'],
  ['s_magnet', 3, '자석의 성질', '물리'], ['s_earth', 3, '지구의 모습', '지구'],
  ['s_sound', 3, '소리의 성질', '물리'], ['s_soil', 3, '흙의 생성과 보존', '생명'],
  ['s_rocks', 4, '지층과 화석', '지구'], ['s_plant_life', 4, '식물의 한살이', '생명'],
  ['s_weight', 4, '물체의 무게', '물리'], ['s_mixture', 4, '혼합물의 분리', '화학'],
  ['s_water_states', 4, '물의 상태 변화', '화학'], ['s_shadow', 4, '그림자와 거울', '물리'],
  ['s_volcano', 4, '화산과 지진', '지구'],
  /* ── 3단계: 에너지·파동·전기 (중~고1) ── */
  ['s_water_cycle', 4, '물의 여행', '지구'], ['s_heat', 5, '온도와 열', '물리'],
  ['s_solar', 5, '태양계와 별', '우주'], ['s_electric', 6, '전기의 이용', '물리'],
  ['s_light', 6, '빛과 렌즈', '물리'], ['s_combustion', 6, '연소와 소화', '화학'],
  /* ── 4단계: 역학·전기자기·원자 (고1~고2) ── */
  ['s_force', 6, '힘과 운동', '물리'],
  ['s_velocity', 7, '속도와 가속도', '물리'],
  ['s_newton', 7, '뉴턴의 운동 법칙', '물리'],
  ['s_atom', 7, '원자의 구조와 원소', '화학'],
  ['s_acid', 7, '산과 염기·pH', '화학'],
  ['s_energy', 7, '에너지 보존', '물리'],
  ['s_wave', 7, '파동·주파수·공진', '물리'],
  ['s_electricity2', 7, '회로·저항·옴의 법칙', '물리'],
  /* ── 5단계: 열역학·전기자기·천체 (고2~고3) ── */
  ['s_thermo', 8, '열역학의 두 법칙', '물리'],
  ['s_em', 8, '전기장과 자기장', '물리'],
  ['s_relativity', 8, '상대성이론', '물리'],
  ['s_astro', 8, '별의 진화과 우주', '우주'],
  ['s_chem_bond', 8, '화학 결합과 분자', '화학'],
  ['s_reaction', 8, '화학 반응의 규칙', '화학'],
  ['s_genetics', 8, '유전과 DNA', '생명'],
  ['s_evolution', 8, '진화와 생명의 분류', '생명'],
  ['s_ecology', 8, '생태계와 탄소순환', '생명'],
  /* ── 6단계: 대학 기초 (이 공부가 왜 필요한지부터) ── */
  ['s_vector', 9, '벡터와 내적·외적', '물리'],
  ['s_trig2', 9, '삼각함수의 미분과 법칙', '물리'],
  ['s_matrix', 9, '행렬과 선형변환', '물리'],
  ['s_prob2', 9, '확률분포와 기댓값', '물리'],
  ['s_calculus_intro', 9, '미적분의 아이디어', '수학'],
  ['s_number', 9, '복소수와 오일러 공식', '수학'],
  /* ── 7단계: 학부 양자·입자 (병석님 요청: "나중엔 양자역학") ── */
  ['s_quantum', 10, '양자역학의 출발점', '물리'],
  ['s_particle', 10, '입자와 파동의 이중성', '물리'],
  ['s_uncertainty', 10, '불확률성과 측정', '물리'],
  ['s_atommodel', 10, '보어 모형과 양자수', '물리'],
  ['s_periodictable', 10, '주기율표와 결합', '화학'],
  ['s_cosmos', 10, '팽창 우주와 빅뱅', '우주'],
  /* ── 8단계: 심화 (입문+, 화학 지능에도 도달) ── */
  ['s_entropy', 11, '엔트로피와 시간의 방향', '물리'],
  ['s_fields', 11, '장(場)의 개념과 기본', '물리'],
  ['s_super', 11, '초전도·초전류·초자성', '물리'],
  ['s_synth', 11, '유기화학과 탄소 화합물', '화학'],
  /* ── 9단계: 초 string 이론 (입문 큐레이션) ── */
  ['s_string', 12, '초끈이론과 중력의 비밀', '물리'],
  ['s_loop', 12, '양자역학의 경로 적분', '물리'],
  ['s_renorm', 12, '양자장론과 재정규화', '물리'],
].map(([id, g, t, f]) => ({ id, g, t, f }));

/* 인문 큐레이션 — 아주 조금씩 섞인다 (병석님: "가끔") */
export const HUMAN = [
  ['h_history', 3, '세계사 한 장면', '역사'],
  ['h_geo', 3, '지리와 일상생활', '지리'],
  ['h_music', 4, '음악의 구조', '음악'],
  ['h_art', 4, '미술의 감각', '미술'],
  ['h_civ', 6, '문명과 발명', '역사'],
  ['h_philo', 8, '가치와 생각', '철학'],
].map(([id, g, t, f]) => ({ id, g, t, f }));
const HUMAN_BY = Object.fromEntries(HUMAN.map((s) => [s.id, s]));
const SCI_BY = Object.fromEntries([...SCI, ...HUMAN].map((s) => [s.id, s]));

// 기술 타입 -> 어울리는 과학 주제 (전기 기술을 쓰면 전기 문제가 나오도록)
const TYPE_SCI = {
  Electric: ['s_electric', 's_magnet'], Water: ['s_water_states', 's_water_cycle', 's_weather'], Fire: ['s_heat', 's_combustion'],
  Grass: ['s_plants_need', 's_plant_life', 's_soil'], Bug: ['s_animal_life', 's_animal_homes'], Rock: ['s_rocks', 's_volcano', 's_soil'],
  Ground: ['s_rocks', 's_soil', 's_volcano', 's_earth'], Flying: ['s_weather', 's_animal_homes', 's_sound'], Ice: ['s_water_states', 's_seasons'],
  Psychic: ['s_solar', 's_light', 's_senses'], Poison: ['s_mixture', 's_matter'], Normal: [],
};

const LADDER = { math: MATH, sci: SCI, hum: HUMAN };
const MASTER_STREAK = 3;

export const GRADES = [
  { g: 0, label: '아직 학교 안 다녀요 (6~7살)' }, { g: 1, label: '초등 1학년' }, { g: 2, label: '초등 2학년' },
  { g: 3, label: '초등 3학년' }, { g: 4, label: '초등 4학년' }, { g: 5, label: '초등 5~6학년' },
  { g: 6, label: '중~고등 (진입)' }, { g: 7, label: '고등·진입 과목' }, { g: 8, label: '고등 심화' },
  { g: 9, label: '대학 기초' }, { g: 10, label: '대학 학부' }, { g: 11, label: '입문+ 심화' }, { g: 12, label: '전문가 입문' },
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
    hum: { floor: startIndex('hum', grade), pos: startIndex('hum', grade) },
    sk: {}, // 주제별 {n, ok, streak, miss, mastered, placed, wrongRecent}
    streak: 0, best: 0, total: 0, correct: 0, retryOk: 0,
    recent: [], log: [],
    // 같은 문제 반복 방지: [{id, n}] — 연속 3번까지만 허용한 뒤 강제로 다른 문제
    repeats: [], lastField: '', fieldRun: 0,
  };
}

const sk = (id) => (L().sk[id] ||= { n: 0, ok: 0, streak: 0, miss: 0, mastered: false, placed: false, wrongRecent: 0, hist: [] });

/* ── 구 세이브 보정 (learn 필드가 없는 옛 기록도 즉시 동작해야 한다) ── */
export function ensureLearn() {
  const l = L();
  if (!l) return null;
  if (!l.hum) l.hum = { floor: startIndex('hum', l.grade || 1), pos: startIndex('hum', l.grade || 1) };
  if (!l.repeats) l.repeats = [];
  if (l.lastField == null) l.lastField = '';
  if (l.fieldRun == null) l.fieldRun = 0;
  if (!l.recent) l.recent = [];
  if (!l.log) l.log = [];
  if (!l.sk) l.sk = {};
  return l;
}

/* ── 3연속 중복 방지 ──
 * 병석님: "같은 문제 3번 연속 맞추면 다른 문제".
 * 물리적으로 보면: 그 주제의 문제를 3번 연속 출제하고, 그 3번을 모두 맞히면
 * 그 주제는 '익힘'이 되므로 사다리가 자동으로 다음 단계로 올라간다.
 * 문제는 (1) 같은 문제가 계속 반복돼 보이고 (2) 익힘 판정이 요행에 막히는 것이다.
 * → 사다리 전이와 무관하게, 같은 문제 id 는 연속 3회를 넘기지 못하게 한다. */
function countRepeat(id) { return (L().repeats.find((r) => r.id === id) || { n: 0 }).n; }
function addRepeat(id) {
  const l = L();
  const r = l.repeats.find((x) => x.id === id);
  if (r) r.n++; else l.repeats.push({ id, n: 1 });
  if (l.repeats.length > 80) l.repeats.shift();
}
/** 이 id 를 지금 꺼내도 되는가? (3회 초과면 금지) */
function repeatBlocked(id) { return countRepeat(id) >= SAME_Q_BLOCK; }

/* ── 분야 번갈아 뽑기 ──
 * 병석님: "물리 화학 자연과학 우주 등 다양한데 ... 너무 같은 문제만 나와".
 * 같은 분야가 2번 연속 나오면 다음엔 다른 분야를 우선한다. */
function fieldOk(f) {
  const l = L();
  if (!f || l.fieldRun < 2) return true;
  return f !== l.lastField;
}
function noteField(f) {
  const l = L();
  if (!f) return;
  if (f === l.lastField) l.fieldRun++; else { l.lastField = f; l.fieldRun = 1; }
}
/** 사다리에서 조건을 만족하는 인덱스 하나를 고른다 (분야 번갈아 우선) */
function pickIndex(cands, lad) {
  const okF = cands.filter((c) => fieldOk(lad[c.i].f));
  const use = okF.length ? okF : cands;
  return weighted(use, (x) => x.w || 0.5) || use[0] || cands[0];
}

export function frontier(subj) {
  const lad = LADDER[subj], st = L()[subj];
  /* ★구 세이브가 hum 항목을 아직 못 받았거나 잘못된 값이 들어오면 여기서 죽는다.
   *   인문 정답을 기록할 때 record() → frontier('hum') 로 오는데 st 가 없으면
   *   "Cannot read properties of undefined" 가 났다. 게임이 통째로 멈췄으므로
   *   안전하게 0단계로 되돌린다. */
  if (!lad || !st) return 0;
  for (let i = st.floor; i < lad.length; i++) if (!sk(lad[i].id).mastered) return i;
  return lad.length - 1;
}

/** 이번에 낼 문제 고르기. opts: {moveType, story, subject} */
export function nextQuestion(opts = {}) {
  ensureLearn();
  const l = L();
  let subj = opts.subject;
  if (!subj) {
    const typeTopics = (TYPE_SCI[opts.moveType] || []);
    const pSci = typeTopics.length ? SCI_P + 0.15 : SCI_P; // 어울리는 기술이면 과학을 조금 더
    const r = Math.random();
    if (r < HUMAN_RATE) subj = 'hum';               // 가끔 인문 (역사·지리·음악·미술)
    else subj = r < HUMAN_RATE + pSci ? 'sci' : 'math';
  }
  const lad = LADDER[subj];
  if (!lad || !lad.length) return { subj: 'math', skill: MATH[0].id, title: MATH[0].t, item: MATH[0].gen(false) };
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
    // 사다리 근처에 어울하는 주제가 있으면 하나 더 후보로
    pref.forEach((id) => { const i = lad.findIndex((s) => s.id === id); if (i >= 0 && i <= f + 1 && i >= f - 3 && !cands.some((c) => c.i === i)) cands.push({ i, w: 3 }); });
  }
  // ★ 사다리를 넘어 볼 단계가 꽤 있으면 한 단계 위를 늘려서 천천히 올라간다
  //   (병석님: "초등학교 6학년까지만 있는게 아니라 성인도 할수 있는거야")
  const c = pickIndex(cands, lad);
  const skill = lad[c.i];
  const item = makeItem(subj, skill, !!opts.story);
  noteField(skill.f);
  return { subj, skill: skill.id, title: skill.t, item };
}
function makeItem(subj, skill, story) {
  const l = L();
  if (subj === 'math') return sealMath(MATH_BY[skill.id].gen, story, subj, skill.id);

  if (subj === 'hum') {
    const it = pickBank('h_', skill.id, story, true);
    if (!it) return sealMath(MATH_BY.m_add10.gen, false, subj, 'm_add10');
    return it;
  }
  let it = pickBank('s_', skill.id, story, false);
  if (!it) {
    // 그 주제의 문제가 다 떨어지면 → 같은 난이대의 다른 주제에서 (다양성 유지)
    const near = SCI.filter((x) => Math.abs(x.g - skill.g) <= 1);
    const pool = near.length ? near : SCI;
    for (let i = 0; i < 8 && !it; i++) {
      const alt = pick(pool);
      it = pickBank('s_', alt.id, story, false);
    }
  }
  if (!it) return sealMath(MATH_BY.m_add10.gen, false, subj, 'm_add10');
  return it;
}

/* ── 수학 문제도 '같은 문제' 판정을 받아야 한다 ──
 * 요건 21: "2+3" 을 "4+5" 로 바꾼 건 새 문제가 아니다.
 * 수학 생성기는 매번 다른 숫자를 뽑으므로 id 로는 구분이 안 된다.
 * → 내용 시그니처(숫자 제거한 골격)로 3연속 중복을 막는다. */
function sealMath(gen, story, subj, skillId) {
  const l = L();
  /* ★요구사항 21번 — 숫자만 바꾸면 새 문제가 아니다.
   *   실측: 생성자 56개 중 36개가 '문제문 30종·시그니처 1종' 이었다.
   *   그래서 아래 signature() 로는 3연속 중복을 못 막았다(8회 시도 후 강제 배출).
   *   → 생성기를 상황 문장으로 감싼다. 계산값은 원본 그대로, 질문 방식만 달라진다. */
  const gen2 = vary(gen, skillId);
  let item = null;
  for (let tries = 0; tries < 8 && !item; tries++) {
    const cand = gen2(story);
    const sig = signature(cand.q, subj || 'math');
    if (!repeatBlocked(sig)) { item = cand; addRepeat(sig); }
  }
  // 8번을 다 돌려도 전부 반복이면 그래도 하나는 낸다 (게임이 멈추면 안 된다)
  if (!item) { item = gen2(story); addRepeat(signature(item.q, subj || 'math')); }
  // ★ 실제 id 를 시그니처로 덮어쓰지 않는다. 덮어쓰면 "2+3" 과 "45+12" 가 같은 id 를
    // 갖게 되어 서로 다른 문제가 반복으로 오인된다(테스트가 이걸 잡았다).
    // 판정용 키는 `_sig` 로 별도 보관하고, id 는 문제은행/생성기의 고유값 그대로 둔다.
    item._sig = signature(item.q, subj || 'math');
    item.subj = subj;
  // 요구사항 5·23: 선행 개념 / 다음 단계 / 다른 분야 연결
  const need = prereqs(skillId), nx = nexts(skillId);
  if (need.length) item.prereq = need.map((id) => ({ id, t: (MATH_BY[id] || SCI_BY[id] || {}).t || id }));
  if (nx.length) item.nextConcept = nx.map((id) => ({ id, t: (MATH_BY[id] || SCI_BY[id] || {}).t || id }));
  if (CROSS[skillId]) item.cross = CROSS[skillId];
  return item;
}

/* ── 문제은행에서 하나 고르기 (3연속 중복 방지 포함) ──
 * 순서: ① 방금 것(연속 1회) 제외 ② 연속 3회 초과 금지 ③ 최근 60개 제외 */
function pickBank(prefix, topic, story, human) {
  const l = L();
  const all = DB.science.filter((q) => q.topic === topic && (!prefix || q.id.startsWith(prefix)));
  if (!all.length) return null;
  let pool = story ? all.filter((q) => q.story) : all;
  if (!pool.length) pool = all;
  // ① 방금 내 것 연속 중복 제거 (단, 전체가 1문제면 어쩔 수 없다)
  const last = l.recent[l.recent.length - 1];
  let cand = pool.filter((q) => q.id !== last);
  if (!cand.length) cand = pool;
  // ② 3회 연속 이미 냈던 문제는 빼고 — 그래도 없으면 같은 계열 위쪽 주제까지 건너뛴다
  const fresh = cand.filter((q) => !repeatBlocked(q.id));
  if (fresh.length) cand = fresh;
  else {
    // 같은 주제가 소진됐으면 '필요하면 다른 문제로 넘어간다' 를 그대로 지키기 위해
    // 사다리 위쪽 주제까지 물어서라도 새 문제를 찾는다.
    //
    // ★ 여기를 SCI 로 고정해 둔 것이 '인문 칸에 과학 문제가 199회나 세입된' 원인이다.
    //   인문(h_) 주제를 찾다가 h_civ 가 소진되면 SCI 목록을 돌아 다녀서 s_animal_homes
    //   같은 과학 문제를 인문 칸으로 끌고 왔다. → 사다리는 지금 뽑는 계열로 고른다.
    const LAD_BY_SUBJ = { hum: HUMAN, sci: SCI, math: MATH };
    const lad = LAD_BY_SUBJ[human ? 'hum' : prefix === 's_' ? 'sci' : 'math'] || SCI;
    const hereStep = lad.find((y) => y.id === topic) || { g: 4 };
    const near = lad.filter((x) => Math.abs(x.g - hereStep.g) <= 2);
    for (const alt of near) {
      const p2 = DB.science.filter((q) => q.topic === alt.id && (!prefix || q.id.startsWith(prefix)) && !repeatBlocked(q.id) && q.id !== last);
      if (p2.length) { const it = pick(p2); return seal(it, l); }
    }
    cand = cand.length ? cand : pool;
  }
  // ③ 최근에 많이 낸 것 우선 배제
  const r = cand.filter((q) => !l.recent.includes(q.id));
  const it = pick(r.length >= Math.min(3, cand.length) ? r : cand);
  return seal(it, l);
}

/** 뽑은 문제를 보기 순서 섞어서 돌려주고, 반복 횟수를 센다 */
function seal(it, l) {
  if (!it) return null;
  const order = shuffle([0, 1, 2, 3]);
  const wrong = {};
  order.forEach((orig, i) => { if (orig !== it.c) wrong[i] = it.wrong[orig]; });
  l.recent.push(it.id);
  if (l.recent.length > 60) l.recent.shift();
  addRepeat(it.id);
  return {
    q: it.q, a: order.map((o) => it.a[o]), c: order.indexOf(it.c),
    why: it.why, wrong, viz: it.viz, id: it.id,
    // ── 새 필드: 서술형 문제·링크·필드·선수 개념 ──
    free: !!it.free,           // 자유 서술형 (삼지선다 반복 방지 → 병석님 요청)
    need: it.need,            // 왜 이 문제가 필요한지 (연출용)
    links: it.links,          // 영상·유튜브·그림 링크
    field: it.field,          // 분야 표기
    chain: it.chain,          // 선수 개념 ["m_add10","m_mul_concept"]
    origin: it.origin,        // 이 문제가 왜 생겼는지 (미분 같은 발명사)
    big: it.big,              // 큰 글씨로 보여줄 핵심 문장
    depth: it.depth,          // 심화용 확장 설명
  };
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
  ensureLearn();
  const l = L();
  for (const subj of ['math', 'sci', 'hum']) {
    const lad = LADDER[subj];
    if (!lad || !lad.length) continue;
    l[subj].floor = Math.min(lad.length - 1, Math.max(l[subj].floor, frontier(subj)) + 1);
  }
}

export function report() {
  const l = L();
  const rows = (subj) => (LADDER[subj] || []).map((s, i) => {
    const x = l.sk[s.id];
    return { id: s.id, t: s.t, g: s.g, f: s.f, i, n: x?.n || 0, ok: x?.ok || 0, mastered: !!x?.mastered, placed: !!x?.placed, weak: (x?.wrongRecent || 0) > 0 };
  });
  return {
    total: l.total, correct: l.correct, best: l.best, streak: l.streak, retryOk: l.retryOk,
    acc: l.total ? Math.round((l.correct / l.total) * 100) : 0,
    math: rows('math'), sci: rows('sci'), hum: rows('hum'),
    fMath: frontier('math'), fSci: frontier('sci'), fHum: frontier('hum'),
  };
}
export const isNewSkill = (id) => !(L().sk[id] && (L().sk[id].n > 0 || L().sk[id].placed));
export const skillTitle = (id) => (MATH_BY[id] || SCI_BY[id] || {}).t || id;
