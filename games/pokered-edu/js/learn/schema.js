/* 문제은행 스키마 — 요구사항 20.
 * 모든 문제는 아래 16개 필드를 갖는다. 기존 258문제(science_a/b.json)도
 * build_bank.py가 이 스키마로 자동 보강하므로 예전 문제는 그대로 쓸 수 있다.
 *
 * 필수: id, topic, q, a, c, why, wrong
 * 보강: subject, category, difficulty, age_level, concept_level,
 *       prerequisites, question_type, why_it_matters, real_world_example,
 *       related_concepts, next_concepts, video_links, image_required, story, viz
 */

/** concept_level = '이해 수준' 사다리. 연령이 아니라 단계다. (요구사항 1) */
export const LEVELS = [
  { lv: 0, label: '유아·초급', short: '유아' },
  { lv: 1, label: '초등 저학년', short: '초저' },
  { lv: 2, label: '초등 고학년', short: '초고' },
  { lv: 3, label: '중학교', short: '중' },
  { lv: 4, label: '고등학교', short: '고' },
  { lv: 5, label: '대학 기초', short: '대기' },
  { lv: 6, label: '대학 심화', short: '대심' },
  { lv: 7, label: '성인 교양', short: '교양' },
  { lv: 8, label: '고급 물리·수학', short: '고급' },
  { lv: 9, label: '양자역학·상대성이론', short: '양자' },
  { lv: 10, label: '초끈이론 등 최전선', short: '최전선' },
];

/** 분야 (요구사항 3) — 과목은 수학/과학/인문, 분야는 그 아래 세부. */
export const FIELDS = {
  physics: '물리', chemistry: '화학', biology: '생명과학', earth: '지구과학',
  space: '우주과학', advanced: '고급과학', math: '수학',
  history: '역사', geography: '지리', music: '음악', art: '미술', philosophy: '철학',
};

/** 문제 유형 (요구사항 20) */
export const QTYPES = {
  mc4: '4지선다', mc3: '3지선다', ox: 'O/X', blank: '빈칸',
  free: '주관식', story: '상황형', infer: '추론형', cause: '원인·결과',
  link: '개념 연결', history: '역사적 배경', derive: '공식 유도 이해',
  apply: '응용 문제', compare: '비교 문제', why: '왜 필요한가',
};

/** 필수 필드 목록 (검증용) */
export const REQUIRED = ['id', 'topic', 'q', 'a', 'c', 'why', 'wrong'];
export const METADATA = [
  'subject', 'category', 'topic', 'difficulty', 'age_level', 'concept_level',
  'prerequisites', 'question_type', 'question', 'choices', 'answer', 'explanation',
  'why_it_matters', 'real_world_example', 'related_concepts', 'next_concepts',
  'video_links', 'image_required',
];

/** 한 문제가 스키마를 만족하는가 (기존 문제는 why/wrong 이 필수) */
export function valid(q) {
  if (!q || !q.id || !q.topic) return false;
  if (!q.q || !Array.isArray(q.a) || q.a.length < 2) return false;
  if (!(q.c >= 0 && q.c < q.a.length)) return false;
  if (!q.why) return false;
  const wk = Object.keys(q.wrong || {}).map(Number).sort().join();
  return wk === q.a.map((_, i) => i).filter((i) => i !== q.c).join();
}

/**
 * 지식 그래프 (요구사항 23) — id → {need:[선행], use:[적용], field}
 * 수학 사다리는 math.js 의 실제 id 를 쓴다. 여기서는 '개념 사슬'만 선언하고
 * tutor.js 가 이 표를 통해 "이것을 먼저 알아두면 좋아요" 를 만든다.
 */
export const GRAPH = {
  // 수학: 덧셈 → 곱셈 → 분수 → 비율 → 방정식 → 함수 → 좌표 → 변화율 → 극한 → 미분 → 적분
  m_add10: { need: [], use: ['m_mul_concept', 'm_fraction'], field: 'math' },
  m_mul_concept: { need: ['m_add10'], use: ['m_fraction', 'm_ratio', 'm_power'], field: 'math' },
  m_fraction: { need: ['m_mul_concept'], use: ['m_ratio', 'm_equation'], field: 'math' },
  m_ratio: { need: ['m_fraction'], use: ['m_equation', 'm_percent'], field: 'math' },
  m_equation: { need: ['m_ratio'], use: ['m_function'], field: 'math' },
  m_function: { need: ['m_equation', 'm_coord'], use: ['m_slope', 'm_limit'], field: 'math' },
  m_coord: { need: [], use: ['m_function', 'm_slope'], field: 'math' },
  m_slope: { need: ['m_coord', 'm_function'], use: ['m_limit'], field: 'math' },
  m_limit: { need: ['m_slope'], use: ['m_deriv_basic'], field: 'math' },
  m_deriv_basic: { need: ['m_limit', 'm_function'], use: ['m_deriv_phys', 'm_integral'], field: 'math' },
  m_integral: { need: ['m_deriv_basic'], use: [], field: 'math' },

  // 물리: 힘 → 운동 → 에너지 → 운동량 → 파동 → 전자기학 → 상대론 → 양자역학
  s_force: { need: [], use: ['s_newton', 's_energy'], field: 'physics' },
  s_newton: { need: ['s_force'], use: ['s_velocity', 's_energy'], field: 'physics' },
  s_velocity: { need: ['s_newton'], use: ['s_energy', 's_deriv_phys'], field: 'physics' },
  s_energy: { need: ['s_force', 's_velocity'], use: ['s_thermo', 's_wave'], field: 'physics' },
  s_momentum: { need: ['s_velocity', 's_energy'], use: ['s_quantum'], field: 'physics' },
  s_wave: { need: ['s_energy'], use: ['s_light', 's_quantum'], field: 'physics' },
  s_electricity2: { need: ['s_electric'], use: ['s_em', 's_atommodel'], field: 'physics' },
  s_em: { need: ['s_electricity2'], use: ['s_quantum'], field: 'physics' },
  s_thermo: { need: ['s_energy', 's_heat'], use: ['s_entropy'], field: 'physics' },
  s_heat: { need: ['s_energy'], use: ['s_thermo'], field: 'physics' },
  s_relativity: { need: ['s_velocity', 's_energy'], use: ['s_quantum', 's_string'], field: 'physics' },
  s_quantum: { need: ['s_wave', 's_em', 's_atommodel'], use: ['s_fields', 's_loop'], field: 'physics' },
  s_fields: { need: ['s_quantum', 's_em'], use: ['s_loop', 's_renorm'], field: 'physics' },
  s_loop: { need: ['s_quantum', 's_fields'], use: ['s_renorm', 's_string'], field: 'physics' },
  s_renorm: { need: ['s_loop'], use: ['s_string'], field: 'physics' },
  s_string: { need: ['s_relativity', 's_quantum', 's_loop'], use: [], field: 'physics' },

  // 화학
  s_matter: { need: [], use: ['s_atom', 's_mixture'], field: 'chemistry' },
  s_atom: { need: ['s_matter'], use: ['s_atommodel', 's_chem_bond', 's_periodictable'], field: 'chemistry' },
  s_atommodel: { need: ['s_atom'], use: ['s_quantum'], field: 'physics' },
  s_chem_bond: { need: ['s_atom'], use: ['s_synth', 's_periodictable'], field: 'chemistry' },
  s_acid: { need: ['s_water_states'], use: ['s_reaction'], field: 'chemistry' },
  s_reaction: { need: ['s_acid', 's_chem_bond'], use: [], field: 'chemistry' },
  s_periodictable: { need: ['s_atom'], use: ['s_chem_bond'], field: 'chemistry' },
  s_synth: { need: ['s_chem_bond'], use: [], field: 'chemistry' },
  s_combustion: { need: ['s_reaction', 's_energy'], use: [], field: 'chemistry' },

  // 생명
  s_plants_need: { need: [], use: ['s_plant_life', 's_ecology'], field: 'biology' },
  s_plant_life: { need: ['s_plants_need'], use: ['s_ecology'], field: 'biology' },
  s_animal_homes: { need: [], use: ['s_animal_life'], field: 'biology' },
  s_animal_life: { need: ['s_animal_homes'], use: ['s_evolution', 's_ecology'], field: 'biology' },
  s_genetics: { need: ['s_animal_life'], use: ['s_evolution'], field: 'biology' },
  s_evolution: { need: ['s_genetics'], use: ['s_ecology'], field: 'biology' },
  s_ecology: { need: ['s_evolution', 's_plant_life'], use: [], field: 'biology' },

  // 지구
  s_soil: { need: [], use: ['s_rocks'], field: 'earth' },
  s_rocks: { need: ['s_soil'], use: ['s_volcano', 's_earth'], field: 'earth' },
  s_volcano: { need: ['s_rocks'], use: ['s_earth'], field: 'earth' },
  s_earth: { need: ['s_rocks'], use: ['s_seasons', 's_water_cycle'], field: 'earth' },
  s_water_cycle: { need: ['s_earth'], use: ['s_seasons'], field: 'earth' },
  s_seasons: { need: ['s_earth', 's_water_cycle'], use: [], field: 'earth' },
  s_weather: { need: ['s_water_cycle'], use: [], field: 'earth' },
  s_day_night: { need: ['s_solar'], use: [], field: 'earth' },

  // 우주
  s_solar: { need: [], use: ['s_astro', 's_cosmos', 's_day_night'], field: 'space' },
  s_astro: { need: ['s_solar'], use: ['s_cosmos'], field: 'space' },
  s_cosmos: { need: ['s_astro', 's_relativity'], use: [], field: 'space' },
};

/** "이것을 먼저 알아두면 좋아요" — 선행개념 (요구사항 5) */
export function prereqs(id) { return GRAPH[id]?.need || []; }
/** "이걸 쓰면 무엇이 쉬워져요" — 다음 단계 (요구사항 5·23) */
export function nexts(id) { return GRAPH[id]?.use || []; }
/** 다른 분야 연결 (요구사항 23: 미분 → 물리/경제/공학/AI) */
export const CROSS = {
  m_deriv_basic: { 물리: '속도와 가속도', 경제: '변화율과 성장률', 공학: '최적화 설계', AI: '경사하강법' },
  m_integral: { 물리: '일과 에너지', 경제: '누적 합계', 전자: '전하의 전체량', 의학: '약물 농도 변화' },
  m_function: { 물리: '위치-시간 관계', 공학: '입출력 설계', 경제: '수요 함수' },
  m_limit: { 물리: '순간 속도', 공학: '극한설계', 컴퓨터: '알고리즘 수렴' },
  s_quantum: { 화학: '화학 결합', 재료: '반도체', 정보: '양자컴퓨팅', 우주: '별의 발광' },
  s_relativity: { 물리: '광속 불변', 천문: '별의 운동', GPS: '위치 보정' },
  s_thermo: { 화학: '발열 반응', 생물: '생체 대사', 지질: '지각 운동' },
  s_genetics: { 생물: '질병 유전', 농업: '품종 개량', 역사: '선택육종' },
};