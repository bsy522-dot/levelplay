/* 강의 보기 — 병석님: "못 맞출 것 같으면 강의 보기 버튼을 누르면 최소 2분간 프리즈 돼서 강의를 보게.
 * 설명이든 유튜브든 만화든 최대한 쉽게 ELI5 같은 설명으로 점차 이해시켜 가게".
 * 순서: 이야기 슬라이드(상황 → 왜 필요 → 그림 → 예시 → 핵심) → 그 주제 만화 → 유튜브(검증된 것만).
 * 2분은 '앱이 화면에 보일 때만' 줄어든다 (다른 앱 갔다 와서 건너뛰기 방지). */
import { el } from '../util.js';
import { Input } from '../input.js';
import { root, portraitUrl } from '../ui.js';
import { sfx } from '../audio.js';
import { drawViz } from './viz.js';
import { DB } from '../data.js';
import { skillNote, skillTitle, MATH_ALL_BY } from './tutor.js';

export const LECTURE_MS = 120000;

/* 《수학이 태어난 날》 만화 (levelplay/assets/comics_pages/math_history → art/comic/<회>/NN.webp) */
const COMIC = {
  m_count: 's1e01', m_compare10: 's1e01', m_add10: 's1e02', m_make10: 's1e02', m_sub10: 's1e03',
  m_mul_concept: 's1e04', m_times_a: 's1e04', m_times_b: 's1e04', m_div_concept: 's1e05', m_div_facts: 's1e05',
  m_place2: 's2e02', m_place3: 's2e02', m_bignum: 's2e03', m_clock_min: 's2e04', m_time_calc: 's2e04', m_frac_concept: 's2e05',
};
const EP_NO = { s1e01: 1, s1e02: 2, s1e03: 3, s1e04: 4, s1e05: 5, s2e01: 6, s2e02: 7, s2e03: 8, s2e04: 9, s2e05: 10 };

/* 유튜브: 실제로 열리는지 확인한 것만 (oembed 확인, 2026-10-03). 지어낸 링크 금지. */
const YT = {
  m_times_a: [{ id: 'FlVMzH7pwAM', t: '구구단 노래' }], m_times_b: [{ id: 'FlVMzH7pwAM', t: '구구단 노래' }],
  m_deriv: [{ id: 'WUvTyaaNkzM', t: '미분의 핵심 (3Blue1Brown, 영어)' }],
  m_integral: [{ id: 'rfG8ce4nNh0', t: '적분의 핵심 (3Blue1Brown, 영어)' }],
  m_prob: [{ id: 'HZGCoVF3YvM', t: '확률 이야기 (3Blue1Brown, 영어)' }],
  m_stats: [{ id: 'zeJD6dqJ5lo', t: '통계 이야기 (3Blue1Brown, 영어)' }],
  m_log: [{ id: 'm2MIpDrF7Es', t: '로그 이야기 (3Blue1Brown, 영어)' }],
};

let comicIndex = null;
async function comicCount(ep) {
  if (!comicIndex) { try { comicIndex = await (await fetch('art/comic/index.json')).json(); } catch (e) { comicIndex = {}; } }
  return comicIndex[ep] || 0;
}

/** 강의 내용이 아직 없는 주제도 비지 않게: 핵심·쓰임새 + 예시 풀이(그림)로 만든다 */
function fallbackLecture(subj, skillId) {
  const n = skillNote(skillId);
  const slides = [];
  if (n.idea) slides.push({ h: '🔑 핵심 생각', text: n.idea });
  if (n.need) slides.push({ h: '💡 어디에 쓰일까?', text: n.need });
  const gen = (MATH_ALL_BY[skillId] || {}).gen;
  if (gen) {
    const ex = gen(false);
    slides.push({ h: '📌 같이 풀어 보자', text: `${ex.q}\n→ ${ex.a[ex.c]}\n${ex.why}`, viz: ex.viz || null, steps: ex.steps });
  } else {
    const qs = (DB.science || []).filter((q) => q.topic === skillId).slice(0, 3);
    qs.forEach((q, i) => slides.push({ h: i ? '🔎 하나 더' : '🔎 알아볼까?', text: `${q.q}\n→ ${q.a[q.c]}\n${q.why}`, viz: q.viz || null }));
  }
  if (!slides.length) slides.push({ h: '🔎 알아볼까?', text: skillTitle(skillId) });
  return { title: n.t || skillTitle(skillId), slides, key: n.idea || '' };
}

/** 강의를 띄우고, 최소 2분 뒤 닫히면 끝난다 */
export async function openLecture(subj, skillId) {
  const lec = (DB.lectures || {})[skillId] || fallbackLecture(subj, skillId);
  const pages = lec.slides.map((s) => ({ type: 'slide', ...s }));
  if (lec.key) pages.push({ type: 'slide', h: '⭐ 한 줄 핵심', text: lec.key, big: true });
  const ep = subj === 'math' ? COMIC[skillId] : null;
  const nComic = ep ? await comicCount(ep) : 0;
  if (nComic) pages.push({ type: 'comic', ep, n: nComic });
  for (const v of YT[skillId] || []) pages.push({ type: 'video', ...v });

  return new Promise((resolve) => {
    const face = portraitUrl('oak');
    const timeEl = el('span', { class: 'lec-time' });
    const dots = el('div', { class: 'lec-dots' });
    const stage = el('div', { class: 'lec-stage' });
    const prev = el('button', { class: 'lec-nav', onclick: () => go(-1) }, '◀');
    const next = el('button', { class: 'lec-nav', onclick: () => go(1) }, '▶');
    const done = el('button', { class: 'go lec-done', disabled: true, onclick: () => finish() }, '');
    const box = el('div', { class: 'lecture' },
      el('div', { class: 'win lec-win' },
        el('div', { class: 'lec-head' }, face ? el('div', { class: 'face', style: { backgroundImage: `url(${face})` } }) : null,
          el('div', { class: 'grow' }, el('div', { class: 'lbl' }, '📺 오박사의 강의'), el('div', { class: 'jua lec-title' }, lec.title)), timeEl),
        stage, el('div', { class: 'lec-bar' }, prev, dots, next), done));
    root().append(box);
    document.body.classList.add('in-quiz', 'in-lecture');
    let page = 0;
    const render = () => {
      stage.innerHTML = '';
      const p = pages[page];
      if (p.type === 'slide') {
        const card = el('div', { class: 'lec-slide' + (p.big ? ' big' : '') }, el('div', { class: 'jua lec-h' }, p.h || ''), el('div', { class: 'lec-text' }, p.text || ''));
        if (p.steps && p.steps.length) card.append(el('ol', {}, ...p.steps.map((t) => el('li', {}, t))));
        const v = p.viz ? drawViz(p.viz) : null;
        if (v) card.append(v);
        stage.append(card);
      } else if (p.type === 'comic') {
        const strip = el('div', { class: 'lec-comic' }, el('div', { class: 'jua lec-h' }, `📖 만화 《수학이 태어난 날》 ${EP_NO[p.ep] || ''}화`));
        for (let i = 1; i <= p.n; i++) strip.append(el('img', { src: `art/comic/${p.ep}/${String(i).padStart(2, '0')}.webp`, loading: 'lazy', alt: '' }));
        stage.append(strip);
      } else if (p.type === 'video') {
        stage.append(el('div', { class: 'lec-slide' }, el('div', { class: 'jua lec-h' }, '🎬 ' + p.t),
          el('div', { class: 'lec-video' }, el('iframe', { src: `https://www.youtube-nocookie.com/embed/${p.id}?rel=0`, allow: 'encrypted-media; picture-in-picture', allowfullscreen: true, title: p.t }))));
      }
      dots.innerHTML = '';
      pages.forEach((_, i) => dots.append(el('i', { class: i === page ? 'on' : '' })));
      prev.disabled = page === 0; next.disabled = page === pages.length - 1;
      stage.scrollTop = 0;
    };
    const go = (d) => { const np = Math.max(0, Math.min(pages.length - 1, page + d)); if (np !== page) { page = np; sfx('select'); render(); } };
    render();

    // ── 2분 시계: 화면에 보일 때만 줄어든다 ──
    let remain = LECTURE_MS, last = performance.now(), over = false;
    const fmt = (ms) => { const s = Math.ceil(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
    const tick = () => {
      const now = performance.now();
      if (!document.hidden) remain -= now - last;
      last = now;
      if (remain <= 0 && !over) { over = true; remain = 0; done.disabled = false; done.classList.add('sel'); done.textContent = '알겠어요! 문제 풀러 가기 ▶'; sfx('ok'); }
      timeEl.textContent = over ? '✅ 다 봤어요' : `⏳ ${fmt(remain)}`;
      if (!over) done.textContent = `⏳ ${fmt(remain)} 뒤에 문제로 돌아갈 수 있어요`;
      window.__peLecture = { remain, over, page, pages: pages.length };
    };
    const onVis = () => { if (document.hidden) tick(); else last = performance.now(); };
    document.addEventListener('visibilitychange', onVis);
    const iv = setInterval(tick, 250);
    tick();

    // 강의 중에는 다른 입력을 모두 막고, 좌우로 넘기기만 된다
    const pop = Input.push((k) => {
      if (k === 'left' || k === 'up') go(-1);
      else if (k === 'right' || k === 'down') go(1);
      else if (k === 'a') { if (over) finish(); else go(1); }
    });
    function finish() {
      if (!over) return;
      clearInterval(iv); document.removeEventListener('visibilitychange', onVis);
      pop(); box.remove();
      document.body.classList.remove('in-lecture');
      if (!document.querySelector('.quiz')) document.body.classList.remove('in-quiz');
      window.__peLecture = null;
      sfx('select');
      resolve();
    }
  });
}
