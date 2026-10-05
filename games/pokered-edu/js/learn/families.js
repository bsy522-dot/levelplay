/* 수학 주제 가족 — "곱셈·나눗셈을 못하는구나"를 알아보고, 같은 가족 문제를 돌아가며 내기 위한 표.
 * 가족 안의 순서는 math.js / math_adv.js 사다리 순서를 따른다(쉬운 것 → 어려운 것). */
export const FAMILIES = {
  count: { t: '세기·수', ids: ['m_count', 'm_compare10'] },
  addsub: { t: '덧셈·뺄셈', ids: ['m_add10', 'm_sub10', 'm_make10', 'm_add_carry1', 'm_sub_borrow1', 'm_add2d1d', 'm_add2d2d', 'm_sub2d2d', 'm_add3d', 'm_sub3d'] },
  place: { t: '자릿값·큰 수', ids: ['m_place2', 'm_place3', 'm_bignum'] },
  muldiv: { t: '곱셈·나눗셈', ids: ['m_mul_concept', 'm_times_a', 'm_times_b', 'm_mul_2d1d', 'm_div_concept', 'm_div_facts', 'm_mul_2d2d', 'm_div_rem'] },
  time: { t: '시간', ids: ['m_clock_half', 'm_clock_min', 'm_time_calc'] },
  measure: { t: '길이·넓이·도형', ids: ['m_length', 'm_angle', 'm_area', 'm_pythag', 'm_trig'] },
  frac: { t: '분수·비율', ids: ['m_frac_concept', 'm_frac_compare', 'm_frac_add', 'm_frac_diff', 'm_frac_mul', 'm_frac_div', 'm_percent', 'm_ratio'] },
  decimal: { t: '소수', ids: ['m_decimal', 'm_dec_add'] },
  int: { t: '음수(정수)', ids: ['m_int_add', 'm_int_mul'] },
  algebra: { t: '식·방정식', ids: ['m_expr_value', 'm_linear_eq', 'm_power', 'm_expand', 'm_factor', 'm_quad_eq'] },
  func: { t: '함수·통계·확률', ids: ['m_average', 'm_stats', 'm_slope', 'm_prob', 'm_log'] },
  calc: { t: '미분·적분', ids: ['m_deriv', 'm_integral'] },
};
const OF = {};
for (const [fam, v] of Object.entries(FAMILIES)) for (const id of v.ids) OF[id] = fam;
/** 수학 주제 id → 가족 이름 (수학이 아니면 null) */
export const familyOf = (id) => OF[id] || null;
export const familyTitle = (fam) => (FAMILIES[fam] || {}).t || fam;
