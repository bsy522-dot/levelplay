/* 문제 창. 기술을 쓸 때마다 뜬다. 틀리면 오박사가 '어디서 헷갈렸는지' 그림과 함께 설명하고 비슷한 문제로 재도전. */
import { el, sleep } from '../util.js';
import { Input } from '../input.js';
import { root, portraitUrl, toast } from '../ui.js';
import { sfx } from '../audio.js';
import { drawViz } from './viz.js';
import { nextQuestion, record, expMult, skillTitle, skillNote, isNewSkill, MATH_ALL_BY } from './tutor.js';
import { G } from '../state.js';

const SUBJ = { math: ['수학', '#3b6cd4'], sci: ['과학', '#3fb950'] };

/** 한 문제를 보여주고 답을 받는다. 반환 {ok, pick} */
function showQuestion(q, opts) {
  return new Promise((resolve) => {
    const it = q.item;
    window.__peQ = { c: it.c, a: it.a, q: it.q, skill: q.skill }; // 자동 점검용
    const [sname, scol] = SUBJ[q.subj];
    const box = el('div', { class: 'win quiz' });
    const top = el('div', { class: 'top' },
      el('span', { class: 'tag', style: { background: scol } }, sname),
      el('span', { class: 'skill' }, q.title || skillTitle(q.skill)),
      opts.retry ? el('span', { class: 'tag', style: { background: '#f0a500' } }, '다시 도전') : null,
      opts.head ? el('span', { class: 'streak' }, opts.head) : null);
    const lead = opts.lead ? el('div', { class: 'jua', style: { color: '#b33', marginBottom: '.3em' } }, opts.lead) : null;
    const qq = el('div', { class: 'q' }, it.q);
    const pic = it.pic ? drawViz(it.pic) : null;
    const btns = it.a.map((a, i) => el('button', { onclick: () => choose(i) }, el('span', { class: 'k' }, String(i + 1)), el('span', {}, a)));
    const ans = el('div', { class: 'ans' }, ...btns);
    const result = el('div', { class: 'result' });
    box.append(...[top, lead, qq, pic ? el('div', { class: 'pic' }, pic) : null, ans, result].filter(Boolean));
    root().append(box);
    document.body.classList.add('in-quiz');
    let sel = -1, done = false;
    const paint = () => btns.forEach((b, i) => b.classList.toggle('sel', i === sel));
    const onNum = (e) => { const n = Number(e.key); if (n >= 1 && n <= 4 && !done) choose(n - 1); };
    window.addEventListener('keydown', onNum);
    const pop = Input.push((k) => {
      if (done) return;
      if (sel < 0 && ['up', 'down', 'left', 'right'].includes(k)) { sel = 0; paint(); return; }
      if (k === 'left' || k === 'right') sel = sel ^ 1;
      else if (k === 'up' || k === 'down') sel = sel ^ 2;
      else if (k === 'a' && sel >= 0) { choose(sel); return; }
      else return;
      sfx('select'); paint();
    });
    function choose(i) {
      if (done) return;
      done = true; pop(); window.removeEventListener('keydown', onNum);
      const ok = i === it.c;
      btns[i].classList.add(ok ? 'ok' : 'no');
      if (!ok) btns[it.c].classList.add('ok');
      btns.forEach((b) => { b.disabled = true; });
      sfx(ok ? 'ok' : 'no');
      resolve({ ok, pick: i, box, result });
    }
  });
}

function button(label, box) {
  return new Promise((resolve) => {
    const b = el('button', { class: 'go sel', onclick: () => fin() }, label);
    box.append(b);
    b.scrollIntoView({ block: 'nearest' });
    let gone = false;
    const fin = () => { if (gone) return; gone = true; pop(); resolve(); };
    const pop = Input.push((k) => { if (k === 'a' || k === 'b') fin(); });
  });
}

function explainCard(it, pick, title, skill) {
  const face = portraitUrl('oak');
  const body = el('div', { class: 'body2' });
  body.append(el('div', { class: 'lbl' }, title));
  if (pick != null && it.wrong[pick]) {
    const last = String(it.a[pick]).replace(/[^가-힣0-9A-Za-z]+$/, '').slice(-1);
    body.append(el('div', {}, `"${it.a[pick]}"${hasBatchim(last) ? '을' : '를'} 골랐구나. `, it.wrong[pick]));
  }
  body.append(el('div', { style: { marginTop: '.3em' } }, el('b', {}, '정답은 '), el('b', { style: { color: '#2fae5b' } }, it.a[it.c]), ' — ', it.why));
  if (it.steps && it.steps.length) body.append(el('div', { class: 'steps' }, el('div', { class: 'lbl' }, '📝 풀이 순서'), el('ol', {}, ...it.steps.map((t) => el('li', {}, t)))));
  const v = it.viz ? drawViz(it.viz) : null;
  if (v) body.append(v);
  const need = it.need || (skill && skillNote(skill).need);
  if (need) body.append(el('div', { class: 'need' }, el('b', {}, '💡 이게 왜 필요할까? '), need));
  return el('div', { class: 'explain' }, face ? el('div', { class: 'face', style: { backgroundImage: `url(${face})` } }) : null, body);
}

/** 전투에서 기술을 쓸 때: 문제 → 결과. 반환 {hit, mastered, stepDown} */
export async function moveQuiz({ monName, moveName, moveType, story }) {
  const q = nextQuestion({ moveType, story });
  if (q.subj === 'math' && isNewSkill(q.skill)) await lessonCard(q, false);
  const mult = expMult();
  const head = G.s.learn.streak > 0 ? `🔥 ${G.s.learn.streak}연속 · 경험치 ×${mult.toFixed(2).replace(/\.?0+$/, '')}` : '';
  const lead = `${monName}의 ${moveName}! 맞히면 명중!`;
  const r = await showQuestion(q, { head, lead });
  const rec = record(q, r.ok, true);
  if (r.ok) {
    r.result.className = 'result ok';
    r.result.textContent = '정답! ' + (q.item.why || '');
    const need = q.item.need || (q.subj === 'math' && skillNote(q.skill).need);
    if (need) r.box.append(el('div', { class: 'need' }, el('b', {}, '💡 어디에 쓰일까? '), need));
    if (rec.mastered) { toast(rec.leap ? `🦘 8연속 이상! 도약 — 두 단계 위로!` : rec.fast ? `🚀 5연속 이상! '${q.title}' 통과 — 바로 다음 단계로!` : `⭐ '${q.title}' 익힘! 다음 단계로!`, 2400); sfx('levelup'); }
    await sleep(350);
    await button('공격! ▶', r.box);
    close(r.box);
    return { hit: true, mastered: rec.mastered };
  }
  r.result.className = 'result no';
  r.result.textContent = '앗, 빗나갔어!';
  r.box.append(explainCard(q.item, r.pick, '오박사의 설명', q.skill));
  await button('비슷한 문제로 다시 해 볼래! ▶', r.box);
  close(r.box);
  // 재도전: 같은 주제, 새 문제
  const q2 = { ...q, item: null };
  const again = nextSameSkill(q);
  q2.item = again;
  const r2 = await showQuestion(q2, { retry: true, lead: '이번엔 할 수 있어!' });
  record(q2, r2.ok, false);
  if (r2.ok) {
    r2.result.className = 'result ok';
    r2.result.textContent = '이해했구나! 👍 ' + (again.why || '');
  } else {
    r2.result.className = 'result no';
    r2.result.textContent = '괜찮아, 다음에 또 나올 거야.';
    r2.box.append(explainCard(again, r2.pick, '다시 한 번 볼까?', q.skill));
  }
  await button('계속 ▶', r2.box);
  close(r2.box);
  if (!r2.ok && q.subj === 'math') await lessonCard(q, true);
  return { hit: false, stepDown: rec.stepDown };
}

/** 오박사의 1분 강의: 핵심 한 줄 + 왜 필요한지 + 예시 풀이(그림) */
async function lessonCard(q, again) {
  const n = skillNote(q.skill);
  const ex = (MATH_BY[q.skill] || {}).gen?.(false);
  const box = el('div', { class: 'win quiz lesson' });
  const face = portraitUrl('oak');
  box.append(
    el('div', { class: 'top' }, el('span', { class: 'tag', style: { background: '#f0a500' } }, again ? '다시 차근차근' : '새 주제!'), el('span', { class: 'skill' }, '오박사의 1분 강의')),
    el('div', { class: 'q' }, n.t),
    el('div', { class: 'explain' }, face ? el('div', { class: 'face', style: { backgroundImage: `url(${face})` } }) : null,
      el('div', { class: 'body2' },
        n.idea ? el('div', {}, el('b', {}, '🔑 핵심: '), n.idea) : null,
        n.need ? el('div', { class: 'need' }, el('b', {}, '💡 왜 필요할까? '), n.need) : null,
        ex ? el('div', { style: { marginTop: '.5em' } }, el('b', {}, '📌 예시: '), ex.q, el('br'), el('b', { style: { color: '#2fae5b' } }, '→ ' + ex.a[ex.c]), ' — ', ex.why) : null,
        ex && ex.steps ? el('ol', {}, ...ex.steps.map((t) => el('li', {}, t))) : null,
        ex && ex.viz ? drawViz(ex.viz) : null)));
  root().append(box);
  document.body.classList.add('in-quiz');
  await button(again ? '알겠어요! 다음엔 맞힐게요 ▶' : '알겠어요! 문제 풀기 ▶', box);
  close(box);
}

function nextSameSkill(q) {
  for (let i = 0; i < 6; i++) {
    const n = nextQuestion({ subject: q.subj });
    if (n.skill === q.skill && n.item.q !== q.item.q) return n.item;
  }
  // 같은 주제를 직접 만든다
  return nextQuestionFor(q);
}
import { hasBatchim } from './math.js';
const MATH_BY = MATH_ALL_BY;
import { DB } from '../data.js';
import { pick, shuffle } from '../util.js';
function nextQuestionFor(q) {
  if (q.subj === 'math') return MATH_BY[q.skill].gen(false);
  const pool = DB.science.filter((x) => x.topic === q.skill && x.q !== q.item.q);
  const it = pick(pool.length ? pool : DB.science.filter((x) => x.topic === q.skill));
  const order = shuffle([0, 1, 2, 3]);
  const wrong = {};
  order.forEach((o, i) => { if (o !== it.c) wrong[i] = it.wrong[o]; });
  return { q: it.q, a: order.map((o) => it.a[o]), c: order.indexOf(it.c), why: it.why, wrong, viz: it.viz };
}

/** 배치 고사 한 문제 (재도전 없이, 정답/설명만 짧게) */
export async function placementQuiz(q, idx, total) {
  const r = await showQuestion(q, { head: `자격 시험 ${idx}/${total}`, lead: '오박사: 편하게 풀어 보렴!' });
  if (r.ok) { r.result.className = 'result ok'; r.result.textContent = '정답!'; }
  else { r.result.className = 'result no'; r.result.textContent = '괜찮아! 모르는 건 모험하면서 배우면 돼.'; }
  await sleep(250);
  await button('다음 ▶', r.box);
  close(r.box);
  return r.ok;
}

function close(box) {
  box.remove();
  if (!document.querySelector('.quiz')) document.body.classList.remove('in-quiz');
}
