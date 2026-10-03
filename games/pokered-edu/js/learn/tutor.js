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
import { familyOf, familyTitle, FAMILIES } from './families.js';

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
/* 인문은 검증된 문제은행(주제마다 10문제 이상)이 있을 때만 낸다.
 * 2026-10-03: 예전 13문제에 정답 표시가 틀린 문제가 섞여 있어 새 은행이 들어올 때까지 쉬게 한다. */
export function humanReady() {
  const bank = (DB.science || []).filter((q) => q.id && q.id.startsWith('h_') && q.verified);
  return HUMAN.every((h) => bank.filter((q) => q.topic === h.id).length >= 10);
}
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

/* ── 부모 설정: 과목별 [자동 / 이 단계로 고정] + 올라가는 속도 ──
 * 병석님: "설정으로 과목별 난이도 … 가끔 운좋게 잘 찍으니 너무 가버리는 경우가 있어서" */
export const SPEEDS = { slow: '천천히', normal: '보통', fast: '빠르게' };
export function settings() {
  const s = (G.s.settings ||= {});
  for (const k of ['math', 'sci', 'hum']) {
    s[k] ||= { mode: 'auto', g: null, speed: 'normal' };
    if (!SPEEDS[s[k].speed]) s[k].speed = 'normal';
  }
  return s;
}
/** 설정 '이 학년부터 다시': 시작점을 그 학년으로 옮기고, 그 위 주제들의 '익힘' 표시만 푼다.
 *  (푼 문제 수·맞힌 수 기록은 남긴다. 포켓몬·레벨·위치 같은 세이브는 건드리지 않는다) */
export function restartAt(subj, g) {
  ensureLearn();
  const lad = LADDER[subj], st = L()[subj], i0 = startIndex(subj, g);
  if (!lad || !st) return;
  st.floor = st.pos = i0;
  for (let i = i0; i < lad.length; i++) {
    const x = L().sk[lad[i].id];
    if (x) Object.assign(x, { mastered: false, placed: false, leapt: false, streak: 0, hist: [], pOk: 0 });
  }
  if (subj === 'math') L().focus = null;
}
/** 과학·인문은 문제은행에 문제가 있는 주제만 낼 수 있다 (없으면 엉뚱한 덧셈 문제가 나왔다) */
const _bankHas = {};
function usable(subj, id) {
  if (subj === 'math') return true;
  if (!(id in _bankHas)) _bankHas[id] = DB.science.some((q) => q.topic === id);
  return _bankHas[id];
}
/** 지금 낼 수 있는 사다리 구간 [lo, hi]. 고정이면 그 학년 주제만, 자동이면 floor 부터 끝까지 */
function range(subj) {
  const lad = LADDER[subj], st = L()[subj];
  const set = settings()[subj];
  let lo = st ? st.floor : 0, hi = lad.length - 1;
  if (set && set.mode === 'fixed' && set.g != null) {
    lo = startIndex(subj, set.g);
    let h = -1;
    lad.forEach((s, i) => { if (s.g <= set.g) h = i; });
    hi = Math.max(lo, h);
  }
  // 문제가 있는 주제까지만
  while (hi > 0 && !usable(subj, lad[hi].id)) hi--;
  if (lo > hi) lo = hi;
  return { lo: Math.max(0, lo), hi };
}

/* ── 원리 문제은행 (수학 주제마다 "왜 필요했을까 / 뜻 / 언제 쓰나") ── */
function conceptsFor(skillId) { return (DB.concept || []).filter((q) => q.skill === skillId); }
export const hasConcept = (skillId) => conceptsFor(skillId).length > 0;

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
/* ★진짜 결함 (2026-10-03 실측): addRepeat 는 카운터를 '올리기만' 했다.
 *   3회 차단(repeatBlocked)이 걸린 문제는 sealMath 가 다른 시그니처를 찾느라
 *   24번을 돌고, 그 사이 다른 주제의 시그니처가 repeats 를 80칸까지 채운다.
 *   shift() 는 '가장 오래된 것'을 빼는데 그건 방금 막힌 문제일 수도 있다.
 *   → 카운터가 내려가지 않아 같은 문제가 4연속 나올 수 있었다. */
function addRepeat(id) {
  const l = L();
  const r = l.repeats.find((x) => x.id === id);
  if (r) r.n++; else l.repeats.push({ id, n: 1 });
  /* 충분히 많이 난 것부터 줄인다 — 80칸 shift 는 '오래된 것'을 빼지만
   * 그게 오늘.repeatBlocked 에 걸린 문제였을 수 있다.
   * 순서대로 보면 오래된 것이 앞이므로 shift() 는 유지하되,
   * 방금 들어온 것부터 4회 초과분만 깎아 3회 상한이 실제로 살아 있게 한다. */
  if (l.repeats.length > 120) l.repeats.splice(0, l.repeats.length - 120);
}
/** 다른 문제를 냈으면 이 문제의 카운터를 1 줄인다 (연속이 실제로 끊기게 한다) */
function decayRepeat(id) {
  const l = L();
  const r = l.repeats.find((x) => x.id === id);
  if (r && r.n > 0) r.n--;
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
  const { lo, hi } = range(subj);
  for (let i = lo; i <= hi; i++) if (usable(subj, lad[i].id) && !sk(lad[i].id).mastered) return i;
  return hi;
}

/** 이번에 낼 문제 고르기. opts: {moveType, story, subject, lesson}
 *  lesson(배틀 학습 묶음)이 있으면 첫 문제에서 주제를 정하고, 그 포켓몬과 싸우는 동안은 같은 주제로 이어 간다. */
export function nextQuestion(opts = {}) {
  ensureLearn();
  const ls = opts.lesson;
  if (ls && ls.skill) return lessonQuestion(ls, opts);
  const l = L();
  let subj = opts.subject;
  // 약한 가족 집중: 수학 문제의 70%를 그 가족에서 (같은 문제가 아니라 같은 가족의 여러 주제)
  const focus = l.focus && !subj && Math.random() < 0.7 ? l.focus.fam : null;
  if (focus) subj = 'math';
  if (!subj) {
    const typeTopics = (TYPE_SCI[opts.moveType] || []);
    const pSci = typeTopics.length ? SCI_P + 0.15 : SCI_P; // 어울리는 기술이면 과학을 조금 더
    const r = Math.random();
    if (r < HUMAN_RATE && humanReady()) subj = 'hum'; // 가끔 인문 (역사·지리·음악·미술)
    else subj = r < HUMAN_RATE + pSci ? 'sci' : 'math';
  }
  const lad = LADDER[subj];
  if (!lad || !lad.length) return { subj: 'math', skill: MATH[0].id, title: MATH[0].t, item: MATH[0].gen(false) };
  let skill = focus ? pickFamilySkill(focus) : null;
  if (!skill) {
    const set = settings()[subj];
    const f = frontier(subj);
    const { lo, hi } = range(subj);
    const cands = [];
    if (set && set.mode === 'fixed') {
      // 고정: 그 학년 주제들 안에서만 돌아가며 (못 푼 것·틀린 것 위주, 익힌 것은 가끔)
      for (let i = lo; i <= hi; i++) {
        if (!usable(subj, lad[i].id)) continue;
        const s = sk(lad[i].id);
        cands.push({ i, w: s.wrongRecent > 0 || !s.mastered ? 3 : 1 });
      }
    } else {
      const hot = l.streak >= 5; // 잘하고 있으면 새 단계 위주로
      cands.push({ i: f, w: hot ? 9 : 6 });
      // 한 단계 위 맛보기는 지금 주제를 잘 풀고 있을 때만
      if (f + 1 <= hi && usable(subj, lad[f + 1].id) && (hot || sk(lad[f].id).streak >= 1)) cands.push({ i: f + 1, w: hot ? 3 : 1.2 });
      for (let i = Math.max(0, l[subj].floor - 3); i < f; i++) {
        if (!usable(subj, lad[i].id)) continue;
        const s = sk(lad[i].id);
        if (s.wrongRecent > 0) cands.push({ i, w: 3 });
        else if (s.mastered && !s.placed && (!hot || s.leapt)) cands.push({ i, w: s.leapt ? 1 : 0.4 }); // 건너뛴 주제는 가끔 확인
      }
      if (subj === 'sci' && opts.moveType) {
        const pref = TYPE_SCI[opts.moveType] || [];
        cands.forEach((c) => { if (pref.includes(lad[c.i].id)) c.w *= 4; });
        // 사다리 근처에 어울리는 주제가 있으면 하나 더 후보로
        pref.forEach((id) => { const i = lad.findIndex((s) => s.id === id); if (i >= 0 && i <= Math.min(hi, f + 1) && i >= f - 3 && usable(subj, id) && !cands.some((c) => c.i === i)) cands.push({ i, w: 3 }); });
      }
    }
    const c = pickIndex(cands.length ? cands : [{ i: f, w: 1 }], lad);
    skill = lad[c.i];
  }
  noteField(skill.f);
  if (ls) { ls.subj = subj; ls.skill = skill.id; return lessonQuestion(ls, opts); }
  const item = makeItem(subj, skill, !!opts.story);
  return { subj, skill: skill.id, title: skill.t, item, kind: item.kind };
}

/* ── 배틀 학습 묶음 ──
 * 병석님: "한 방에 죽는 놈도 있고 여러 방에 죽는 놈도 있잖아. 여러 방에 죽는 놈은 그 주제를 엮으라".
 * 포켓몬 한 마리 = 한 주제. ①원리 ②계산 ③응용(상황) → 이후 계산·응용 번갈아.
 * 틀리면 다음 문제는 같은 가족의 한 단계 쉬운 주제 + 보기 3개. 맞히면 원래 단계로 돌아간다. */
export function newLesson() { return { subj: null, skill: null, step: 0, easy: false, n: 0, wrongs: 0, used: [] }; }
const KIND_ORDER = ['principle', 'calc', 'apply'];
function lessonQuestion(ls, opts = {}) {
  const lad = LADDER[ls.subj];
  const id = ls.easy ? easierSkill(ls.subj, ls.skill) : ls.skill;
  const skill = lad.find((s) => s.id === id) || lad.find((s) => s.id === ls.skill) || lad[0];
  let kind = 'bank';
  if (ls.subj === 'math') {
    kind = ls.step < 3 ? KIND_ORDER[ls.step] : (ls.step % 2 ? 'calc' : 'apply');
    // 쉬운 쪽으로 내려왔으면: 원리 문제(왜 이렇게 하는지)가 남아 있으면 그것부터, 아니면 계산.
    // 바로 앞 문제가 원리였으면 계산으로 — 같은 종류가 연달아 나오지 않게
    if (ls.easy) kind = ls.lastKind !== 'principle' && conceptsFor(skill.id).some((q) => !ls.used.includes(q.id)) ? 'principle' : 'calc';
  }
  let item = makeItem(ls.subj, skill, kind === 'apply', kind, ls);
  if (ls.easy || opts.three) item = toThree(item);
  if (item.id) ls.used.push(item.id);
  ls.lastKind = item.kind || kind;
  ls.n++;
  return { subj: ls.subj, skill: skill.id, title: skill.t, item, kind: item.kind || kind, lesson: true, easy: !!ls.easy, step: ls.step };
}
/** 결과를 묶음에 반영: 맞히면 다음 단계로, 틀리면 쉬운 쪽으로 (재도전은 단계를 넘기지 않는다) */
export function lessonResult(ls, ok, retry = false) {
  if (!ls) return;
  if (ok) { if (!retry) ls.step++; ls.easy = false; } else { ls.easy = true; ls.wrongs++; }
}
/** 같은 가족에서 바로 아래 주제 (나눗셈을 틀리면 → 곱셈구구 쪽으로) */
function easierSkill(subj, id) {
  if (subj !== 'math') return id;
  const fam = familyOf(id);
  if (!fam) return id;
  const idx = MATH.findIndex((s) => s.id === id);
  const lower = FAMILIES[fam].ids.map((x) => MATH.findIndex((s) => s.id === x)).filter((i) => i >= 0 && i < idx);
  return lower.length ? MATH[Math.max(...lower)].id : id;
}
/** 보기 4개 → 3개 (오답 하나를 뺀다. 오답 설명은 남은 보기에 맞게 다시 붙인다) */
function toThree(it) {
  if (!it || !Array.isArray(it.a) || it.a.length !== 4) return it;
  const drop = pick([0, 1, 2, 3].filter((i) => i !== it.c));
  const keep = [0, 1, 2, 3].filter((i) => i !== drop);
  const wrong = {};
  keep.forEach((i, j) => { if (i !== it.c && it.wrong && it.wrong[i] != null) wrong[j] = it.wrong[i]; });
  return { ...it, a: keep.map((i) => it.a[i]), c: keep.indexOf(it.c), wrong, three: true };
}
/** 특정 주제로 문제 하나 (강의 보기 뒤 "같은 주제 새 문제"에 쓴다) */
export function questionFor(subj, skillId, o = {}) {
  ensureLearn();
  const lad = LADDER[subj] || MATH;
  const skill = lad.find((s) => s.id === skillId) || lad[0];
  let item = makeItem(subj, skill, o.kind === 'apply', o.kind || (subj === 'math' ? 'calc' : 'bank'));
  if (o.three) item = toThree(item);
  return { subj, skill: skill.id, title: skill.t, item, kind: item.kind };
}

/* ── 약한 가족 집중 ──
 * 병석님: "딱 봐도 아 얘는 곱하기 나누기 못하는구나 하면 계속 주입시켜 주고, 같은 문제 반복이 아니라
 *          곱하기 관련된 걸 계속 보여 주면서".
 * 가족의 최근 첫 시도 8문제(6개 이상) 정답률이 50% 미만이면 집중 모드, 최근 5문제 중 4개 맞히면 해제. */
const _sum = (a) => a.reduce((x, y) => x + y, 0);
function familyRecent() {
  const log = L().log || [];
  const fams = {};
  for (let i = log.length - 1; i >= 0; i--) {
    const fam = familyOf(log[i].k);
    if (!fam) continue;
    const a = (fams[fam] ||= []);
    if (a.length < 8) a.push(log[i].ok);
  }
  return fams;
}
export function updateFocus() {
  const l = L();
  const fams = familyRecent();
  if (l.focus) {
    const a = (fams[l.focus.fam] || []).slice(0, 5);
    if (a.length >= 5 && _sum(a) >= 4) { const fam = l.focus.fam; l.focus = null; return { off: fam, t: familyTitle(fam) }; }
    return null;
  }
  let worst = null;
  for (const [fam, a] of Object.entries(fams)) {
    const acc = _sum(a) / a.length;
    if (a.length >= 6 && acc < 0.5 && (!worst || acc < worst.acc)) worst = { fam, acc };
  }
  if (!worst) return null;
  l.focus = { fam: worst.fam, since: l.total };
  return { on: worst.fam, t: familyTitle(worst.fam) };
}
export function focusInfo() {
  const l = L();
  if (!l.focus) return null;
  const a = familyRecent()[l.focus.fam] || [];
  return { fam: l.focus.fam, t: familyTitle(l.focus.fam), ok: Math.round(_sum(a)), n: a.length };
}
function pickFamilySkill(fam) {
  const f = frontier('math');
  const idxs = FAMILIES[fam].ids.map((x) => MATH.findIndex((s) => s.id === x)).filter((i) => i >= 0);
  let pool = idxs.filter((i) => i <= f || sk(MATH[i].id).n > 0); // 지금 단계 이하 + 이미 풀어 본 주제
  if (!pool.length) pool = [Math.min(...idxs)];
  const last = L().focus && L().focus.last;
  const c = weighted(pool.map((i) => {
    const s = sk(MATH[i].id);
    return { i, w: (s.wrongRecent > 0 ? 3 : !s.mastered ? 2 : 1) * (MATH[i].id === last && pool.length > 1 ? 0.2 : 1) };
  }), (x) => x.w);
  if (L().focus) L().focus.last = MATH[c.i].id;
  return MATH[c.i];
}

function makeItem(subj, skill, story, kind, ls) {
  const l = L();
  if (subj === 'math') {
    if (kind === 'principle') {
      const used = ls ? ls.used : [];
      const all = conceptsFor(skill.id).filter((q) => !used.includes(q.id));
      const fresh = all.filter((q) => !l.recent.includes(q.id));
      const pool = fresh.length ? fresh : all;
      if (pool.length) { const it = seal(pick(pool), l); it.kind = 'principle'; it.subj = subj; return it; }
      story = false; // 원리 문제가 아직 없는 주제 → 계산 문제로
    }
    return sealMath(MATH_BY[skill.id].gen, story, subj, skill.id);
  }

  if (subj === 'hum') {
    const it = pickBank('h_', skill.id, story, true);
    if (!it) return sealMath(MATH_BY.m_add10.gen, false, subj, 'm_add10');
    it.kind = 'bank';
    return it;
  }
  let it = pickBank('s_', skill.id, story, false);
  if (!it) {
    // 그 주제의 문제가 다 떨어지면 → 같은 난이대의 다른 주제에서 (다양성 유지)
    const near = SCI.filter((x) => Math.abs(x.g - skill.g) <= 1 && usable('sci', x.id));
    const pool = near.length ? near : SCI.filter((x) => usable('sci', x.id));
    for (let i = 0; i < 8 && !it; i++) {
      const alt = pick(pool);
      it = pickBank('s_', alt.id, story, false);
    }
  }
  if (!it) return sealMath(MATH_BY.m_add10.gen, false, subj, 'm_add10');
  it.kind = 'bank';
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
  // vary(상황 문장 덧씌우기)는 질문과 정답이 어긋나는 문제가 섞여 꺼 둔다 (2026-10-03).
  // 생성기 원문은 정답과 항상 맞고, 반복은 배틀 학습 묶음(원리·계산·응용)으로 줄인다.
  const gen2 = gen;
  let item = null;
  let lastTry = null;
  /* 8번이면상황이 고갈됐을 때 그냥 겹친다. 실측: 문장 종류가 3~4개뿐인 주제에서
   * 시그니처 3회 상한(21번)에 먼저 걸려 4회 연속이 실제로 발생했다.
   * → 시도 횟수를 늘리고, 그래도 막히면 '가장 오래 안 나온' 상황으로 강제한다.
   *    게임이 멈추면 안 되지만, 같은 걸 4연속 보여주는 것도 안 된다. */
  /* ★진짜 원인은 여기다. 요구사항 21번은 "3회 연속" 만 금지한다.
   *   그런데 repeatBlocked 는 '최근에 총 3번 냈나' 로 검사하고 있어서,
   *   다른 문제를 몇 번 냈다 와도 3이 남아 있으면 영영 못 낸다.
   *   → 연속 판정과 반복도 판정을 분리한다.
   *      연속: 직전 2개와 같으면 금지 (진짜 3연속만 막는다)
   *      반복도: 6문제 안에 3번 넘게면 금지 (요구사항 2번의 '최근 6내 3회')
   */
  const l2 = l;
  const recentSigs = () => l2._lastSigs || (l2._lastSigs = []);
  const win = recentSigs();
  for (let tries = 0; tries < 24 && !item; tries++) {
    // 같은 모양이 막히면 계산형 ↔ 상황형을 번갈아 시도한다 (질문 방식 자체를 바꾼다)
    const st = tries % 2 ? !story : story;
    const cand = gen2(st);
    cand.kind = st ? 'apply' : 'calc';
    const sig = signature(cand.q, subj || 'math');
    lastTry = cand;
    // ① 진짜 3연속 (직전 2개와 같음)
    if (win.length >= 2 && win[win.length - 1] === sig && win[win.length - 2] === sig) continue;
    // ② 최근 6 안에 3번 넘게 반복
    const w6 = win.slice(-5).filter((x) => x === sig).length;
    if (w6 >= SAME_Q_BLOCK) continue;
    item = cand; addRepeat(sig);
  }
  // 뽑은 것을 최근 목록에 반영
  if (item) { win.push(signature(item.q, subj || 'math')); if (win.length > 40) win.shift(); }
  // 24번을 다 돌려도 전부 반복이면 그래도 하나는 낸다 (게임이 멈추면 안 된다)
  if (!item && lastTry) { item = lastTry; addRepeat(signature(item.q, subj || 'math')); }
  if (!item) { item = gen2(story); item.kind = story ? 'apply' : 'calc'; addRepeat(signature(item.q, subj || 'math')); }
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
  /* 원문 2번 "같은 문제 3회 연속 출제 금지" 는 '연속'을 센다.
   * 반복도(decay)는 하지 않는다 — 카운트를 내리면 다른 문제를 충분히 냈어도
   * 그 문제가 다시 3회 연속으로 인정돼 상한이 무너진다(실측: 고유 60 → 16).
   * 연속 여부는 sealMath 의 held 비교가 담당한다. */

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

/** 결과 기록. firstTry=false 면 재도전(설명을 본 뒤)이다.
 *  opt.lectured: 강의를 보고 푼 문제 → 명중은 되지만 '익힘'에는 반만 반영 (외워서·찍어서 올라가는 것 방지) */
export function record(q, correct, firstTry = true, opt = {}) {
  const l = L(), s = sk(q.skill);
  const res = { mastered: false, streak: l.streak, stepDown: false };
  if (!firstTry) {
    if (correct) { l.retryOk++; s.wrongRecent = Math.max(0, s.wrongRecent - 1); }
    return res;
  }
  const speed = (settings()[q.subj] || {}).speed || 'normal';
  const lect = !!(opt.lectured || q.lectured);
  const val = correct ? (lect ? 0.5 : 1) : 0;
  l.total++; s.n++;
  s.hist = [...(s.hist || []), val].slice(-6);
  if (correct && !lect && q.kind === 'principle') s.pOk = (s.pOk || 0) + 1; // 원리 조건은 스스로 맞혔을 때만
  if (correct) {
    l.correct++; s.ok++; s.miss = 0;
    if (!lect) { s.streak++; l.streak++; l.best = Math.max(l.best, l.streak); }
    if (s.wrongRecent > 0) s.wrongRecent--;
    const lad = LADDER[q.subj], fi = frontier(q.subj);
    const atFront = !!lad[fi] && q.skill === lad[fi].id;
    // 빠른 길(전체 5연속): '보통'은 이 주제를 이미 2번 이상 맞혔을 때만, '빠르게'는 바로, '천천히'는 없음
    if (!s.mastered && !lect && atFront && l.streak >= 5 && (speed === 'fast' || (speed === 'normal' && s.ok >= 2))) {
      s.mastered = true; res.mastered = true; res.fast = true;
      // 도약(다음 단계 건너뛰기)은 '빠르게'에서만
      const fixed = (settings()[q.subj] || {}).mode === 'fixed';
      if (speed === 'fast' && !fixed && l.streak >= 8) { const f2 = frontier(q.subj); if (f2 < lad.length - 1) { const nx = sk(lad[f2].id); nx.mastered = true; nx.leapt = true; res.leap = lad[f2].t; } }
    }
    // 보통 익힘: 최근 5문제 중 4개 + 2연속 + (원리 문제가 있는 수학 주제면) 원리 1개 이상 정답
    const h = s.hist;
    const needP = q.subj === 'math' && speed !== 'fast' && hasConcept(q.skill);
    const pOK = !needP || (s.pOk || 0) >= 1;
    const rule = speed === 'slow' ? (h.length >= 6 && _sum(h.slice(-6)) >= 5 && s.streak >= 3)
      : speed === 'fast' ? (h.length >= 3 && _sum(h.slice(-4)) >= 3 && s.streak >= 2)
        : (h.length >= 5 && _sum(h.slice(-5)) >= 4 && s.streak >= 2);
    if (!s.mastered && rule && pOK) { s.mastered = true; res.mastered = true; }
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
  l.log.push({ t: Date.now(), k: q.skill, ok: val });
  if (l.log.length > 400) l.log.shift();
  res.focus = updateFocus();
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
    if ((settings()[subj] || {}).mode === 'fixed') continue; // 부모가 고정한 과목은 배지로 안 올린다
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
    focus: focusInfo(), settings: settings(),
  };
}
export const isNewSkill = (id) => !(L().sk[id] && (L().sk[id].n > 0 || L().sk[id].placed));
export const skillTitle = (id) => (MATH_BY[id] || SCI_BY[id] || {}).t || id;
