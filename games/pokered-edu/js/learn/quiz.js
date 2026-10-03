/* 문제 창. 기술을 쓸 때마다 뜬다. 틀리면 오박사가 '어디서 헷갈렸는지' 그림과 함께 설명하고 비슷한 문제로 재도전.
 * 배틀 학습 묶음(lesson)이 있으면 그 포켓몬과 싸우는 동안 같은 주제로 원리 → 계산 → 응용.
 * 📺 강의 보기: 최소 2분 강의를 보고 같은 주제의 쉬운 새 문제로 돌아온다. */
import { el, sleep } from '../util.js';
import { Input } from '../input.js';
import { root, portraitUrl, toast } from '../ui.js';
import { sfx } from '../audio.js';
import { drawViz } from './viz.js';
import { nextQuestion, record, expMult, skillTitle, skillNote, isNewSkill, MATH_ALL_BY, lessonResult, questionFor } from './tutor.js';
import { openLecture } from './lecture.js';
import { hasBatchim } from './math.js';
import { G } from '../state.js';

const MATH_BY = MATH_ALL_BY;
/* 인문(역사·지리·음악·미술·철학)까지 태그가 떠야 한다 (요구사항 17번). */
const SUBJ = {
  math: ['수학', '#3b6cd4'],
  sci: ['과학', '#3fb950'],
  hum: ['인문', '#b5651d'],
};
const subjTag = (s) => SUBJ[s] || SUBJ.math;
const KIND = { principle: ['🧠 원리', '#7c4dff'], calc: ['✏️ 계산', '#0288d1'], apply: ['🌍 상황', '#00897b'] };

/** 한 문제를 보여주고 답을 받는다. 반환 {ok, pick, box, result} 또는 {lecture:true} */
function showQuestion(q, opts) {
  return new Promise((resolve) => {
    const it = q.item;
    window.__peQ = { c: it.c, a: it.a, q: it.q, skill: q.skill, kind: q.kind, subj: q.subj, three: !!it.three }; // 자동 점검용
    const [sname, scol] = subjTag(q.subj);
    const kind = KIND[q.kind];
    const box = el('div', { class: 'win quiz' });
    const top = el('div', { class: 'top' },
      el('span', { class: 'tag', style: { background: scol } }, sname),
      kind ? el('span', { class: 'tag', style: { background: kind[1] } }, kind[0]) : null,
      el('span', { class: 'skill' }, q.title || skillTitle(q.skill)),
      opts.retry ? el('span', { class: 'tag', style: { background: '#f0a500' } }, '다시 도전') : null,
      it.three ? el('span', { class: 'tag', style: { background: '#8d6e63' } }, '쉬운 문제') : null,
      opts.head ? el('span', { class: 'streak' }, opts.head) : null);
    const lead = opts.lead ? el('div', { class: 'jua', style: { color: '#b33', marginBottom: '.3em' } }, opts.lead) : null;
    const qq = el('div', { class: 'q' }, it.q);
    const pic = it.pic ? drawViz(it.pic) : null;
    const btns = it.a.map((a, i) => el('button', { onclick: () => choose(i) }, el('span', { class: 'k' }, String(i + 1)), el('span', {}, a)));
    const ans = el('div', { class: 'ans' + (it.a.length === 3 ? ' three' : '') }, ...btns);
    const result = el('div', { class: 'result' });
    const lec = opts.noLecture ? null
      : el('button', { class: 'lec-btn' + (opts.pulse ? ' pulse' : ''), onclick: () => toLecture() }, '📺 모르겠으면 강의 보기 (2분)');
    box.append(...[top, lead, qq, pic ? el('div', { class: 'pic' }, pic) : null, ans, lec, result].filter(Boolean));
    root().append(box);
    document.body.classList.add('in-quiz');
    let sel = -1, done = false;
    const n = it.a.length;
    const paint = () => btns.forEach((b, i) => b.classList.toggle('sel', i === sel));
    const onNum = (e) => {
      if (done) return;
      const k = Number(e.key);
      if (k >= 1 && k <= n) choose(k - 1);
      else if ((e.key === 'l' || e.key === 'L') && lec) toLecture();
    };
    window.addEventListener('keydown', onNum);
    const pop = Input.push((k) => {
      if (done) return;
      if (sel < 0 && ['up', 'down', 'left', 'right'].includes(k)) { sel = 0; paint(); return; }
      if (k === 'left') sel = Math.max(0, sel - 1);
      else if (k === 'right') sel = Math.min(n - 1, sel + 1);
      else if (k === 'up') sel = sel - 2 >= 0 ? sel - 2 : sel;
      else if (k === 'down') sel = sel + 2 < n ? sel + 2 : sel;
      else if (k === 'a' && sel >= 0) { choose(sel); return; }
      else return;
      sfx('select'); paint();
    });
    function stop() { done = true; pop(); window.removeEventListener('keydown', onNum); }
    function toLecture() {
      if (done) return;
      stop(); close(box);
      resolve({ lecture: true });
    }
    function choose(i) {
      if (done) return;
      stop();
      const ok = i === it.c;
      btns[i].classList.add(ok ? 'ok' : 'no');
      if (!ok) btns[it.c].classList.add('ok');
      btns.forEach((b) => { b.disabled = true; });
      if (lec) lec.remove();
      sfx(ok ? 'ok' : 'no');
      resolve({ ok, pick: i, box, result });
    }
  });
}

/** 문제를 내고, 강의 보기를 누르면 강의(2분) → 같은 주제 쉬운 새 문제로 다시 묻는다 */
async function ask(q, opts) {
  let lectured = false;
  for (;;) {
    const r = await showQuestion(q, opts);
    if (!r.lecture) return { r, q, lectured };
    await openLecture(q.subj, q.skill);
    lectured = true;
    const nq = questionFor(q.subj, q.skill, { three: true, kind: q.subj === 'math' ? 'calc' : 'bank' });
    nq.lectured = true;
    q = nq;
    opts = { ...opts, lead: '강의를 봤으니 이번엔 할 수 있어! 💪', pulse: false };
  }
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
    const txt = String(it.a[pick]); const frac = txt.match(/(\d+)\/\d+[^\d]*$/);
    const last = frac ? frac[1].slice(-1) : txt.replace(/[^가-힣0-9A-Za-z²³]+$/, '').slice(-1);
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

function notifyFocus(f) {
  if (!f) return;
  if (f.on) toast(`🎯 '${f.t}' 집중 모드! 이 가족 문제를 차근차근 더 풀어 볼게`, 2600);
  if (f.off) { toast(`🎉 '${f.t}' 집중 모드 끝! 이제 잘 알게 됐구나`, 2600); sfx('levelup'); }
}

/** 전투에서 기술을 쓸 때: 문제 → 결과. 반환 {hit, mastered, stepDown}
 *  lesson: 배틀 학습 묶음 (battle.js 가 상대 포켓몬마다 하나 만든다) */
export async function moveQuiz({ monName, moveName, moveType, story, lesson }) {
  const q0 = nextQuestion({ moveType, story, lesson });
  if (q0.subj === 'math' && isNewSkill(q0.skill)) await lessonCard(q0, false);
  const mult = expMult();
  const head = G.s.learn.streak > 0 ? `🔥 ${G.s.learn.streak}연속 · 경험치 ×${mult.toFixed(2).replace(/\.?0+$/, '')}` : '';
  const lead = `${monName}의 ${moveName}! 맞히면 명중!`;
  const { r, q, lectured } = await ask(q0, { head, lead, pulse: !!(lesson && lesson.wrongs >= 2) || !!G.s.learn.focus });
  const rec = record(q, r.ok, true, { lectured });
  lessonResult(lesson, r.ok);
  notifyFocus(rec.focus);
  if (r.ok) {
    r.result.className = 'result ok';
    r.result.textContent = '정답! ' + (q.item.why || '');
    const need = q.item.need || (q.subj === 'math' && skillNote(q.skill).need);
    if (need) r.box.append(el('div', { class: 'need' }, el('b', {}, '💡 어디에 쓰일까? '), need));
    if (rec.mastered) { toast(rec.leap ? `🦘 도약! '${q.title}' 통과, '${rec.leap}'도 건너뛰기 — 나중에 확인 문제가 나와!` : rec.fast ? `🚀 5연속 이상! '${q.title}' 통과 — 바로 다음 단계로!` : `⭐ '${q.title}' 익힘! 다음 단계로!`, 2400); sfx('levelup'); }
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
  // 재도전: 묶음이 있으면 같은 가족의 더 쉬운 문제(보기 3개), 없으면 같은 주제 쉬운 문제
  const q2 = lesson ? nextQuestion({ lesson }) : questionFor(q.subj, q.skill, { three: true });
  const { r: r2, q: q2b } = await ask(q2, { retry: true, lead: '이번엔 할 수 있어!', pulse: true });
  record(q2b, r2.ok, false);
  lessonResult(lesson, r2.ok, true);
  if (r2.ok) {
    r2.result.className = 'result ok';
    r2.result.textContent = '이해했구나! 👍 ' + (q2b.item.why || '');
  } else {
    r2.result.className = 'result no';
    r2.result.textContent = '괜찮아, 다음에 또 나올 거야. 모르겠으면 다음엔 📺 강의를 봐 봐!';
    r2.box.append(explainCard(q2b.item, r2.pick, '다시 한 번 볼까?', q2b.skill));
  }
  await button('계속 ▶', r2.box);
  close(r2.box);
  return { hit: false, stepDown: rec.stepDown };
}

/** 오박사의 1분 강의: 처음 보는 주제의 핵심 한 줄 + 왜 필요한지 + 예시 풀이(그림) */
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

/** 배치 고사 한 문제 (재도전 없이, 정답/설명만 짧게) */
export async function placementQuiz(q, idx, total) {
  const r = await showQuestion(q, { head: `자격 시험 ${idx}/${total}`, lead: '오박사: 편하게 풀어 보렴!', noLecture: true });
  if (r.ok) { r.result.className = 'result ok'; r.result.textContent = '정답!'; }
  else { r.result.className = 'result no'; r.result.textContent = '괜찮아! 모르는 건 모험하면서 배우면 돼.'; }
  await sleep(250);
  await button('다음 ▶', r.box);
  close(r.box);
  return r.ok;
}

function close(box) {
  box.remove();
  if (!document.querySelector('.quiz') && !document.querySelector('.lecture')) document.body.classList.remove('in-quiz');
}
