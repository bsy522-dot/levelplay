/* 화면 위 글자 창들 (대화창, 선택지, 알림, 전환). 모두 await 로 끝날 때까지 기다릴 수 있다. */
import { el, sleep } from './util.js';
import { Input } from './input.js';
import { sfx } from './audio.js';
import { fixJosa } from './learn/math.js';

export const root = () => document.getElementById('ui');
export const PORTRAIT = {};
export function portraitUrl(key) { return PORTRAIT[key] || null; }

let fastText = false;

/** 대화창: lines 는 문자열 배열. '{p}' 같은 치환은 부르는 쪽에서 한다. */
export async function say(lines, opts = {}) {
  if (typeof lines === 'string') lines = [lines];
  lines = lines.map(fixJosa);
  const box = el('div', { class: 'win dialog' });
  if (opts.who) box.append(el('div', { class: 'who' }, opts.who));
  const face = opts.face && portraitUrl(opts.face);
  if (face) box.append(el('div', { class: 'face', style: { backgroundImage: `url(${face})` } }));
  const txt = el('div', { class: 'txt' });
  const more = el('div', { class: 'more' }, '▼');
  box.append(txt, more);
  root().append(box);
  try {
    for (let i = 0; i < lines.length; i++) {
      await typeLine(txt, lines[i], more, box, opts.keep && i === lines.length - 1);
    }
  } finally {
    if (!opts.keep) box.remove();
  }
  return box;
}

function typeLine(txt, line, more, box, keep) {
  return new Promise((resolve) => {
    let i = 0, done = false, timer;
    more.style.visibility = 'hidden';
    txt.textContent = '';
    const finish = () => { clearInterval(timer); txt.textContent = line; done = true; more.style.visibility = keep ? 'hidden' : 'visible'; if (keep) { pop(); resolve(); } };
    const advance = () => {
      if (!done) { finish(); return; }
      pop(); sfx('select'); resolve();
    };
    const pop = Input.push((k) => { if (k === 'a' || k === 'b') advance(); });
    box.onclick = advance;
    const speed = fastText ? 8 : 26;
    timer = setInterval(() => {
      i += 1;
      txt.textContent = line.slice(0, i);
      if (i % 3 === 0) sfx('talk');
      if (i >= line.length) finish();
    }, speed);
  });
}

/** 선택지: items = [문자열 | {label, value, disabled}]. B 는 cancel 값(기본 null) */
export function choose(items, opts = {}) {
  return new Promise((resolve) => {
    items = items.map((it) => (typeof it === 'string' ? { label: it, value: it } : it));
    let sel = opts.start || 0;
    const box = el('div', { class: 'win choices' });
    if (opts.style) Object.assign(box.style, opts.style);
    const btns = items.map((it, i) => el('button', { onclick: (e) => { e.stopPropagation(); sel = i; done(it.value); }, disabled: it.disabled }, it.label));
    box.append(...btns);
    root().append(box);
    // 목록이 길면(설정의 학년 고르기) 화면 안에서 스크롤 — 고른 줄이 보이게 따라간다
    const paint = () => { btns.forEach((b, i) => b.classList.toggle('sel', i === sel)); if (opts.style && opts.style.overflowY) btns[sel]?.scrollIntoView?.({ block: 'nearest' }); };
    paint();
    const done = (v) => { pop(); box.remove(); sfx(v === (opts.cancel ?? null) ? 'cancel' : 'select'); resolve(v); };
    const pop = Input.push((k) => {
      if (k === 'up') { sel = (sel + items.length - 1) % items.length; paint(); sfx('select'); }
      else if (k === 'down') { sel = (sel + 1) % items.length; paint(); sfx('select'); }
      else if (k === 'a') { if (!items[sel].disabled) done(items[sel].value); }
      else if (k === 'b' || k === 'menu') { if (opts.cancel !== false) done(opts.cancel ?? null); }
    });
  });
}

/** 대화 + 예/아니오 */
export async function ask(line, opts = {}) {
  const box = await say([line], { ...opts, keep: true });
  const v = await choose([{ label: '예', value: true }, { label: '아니오', value: false }], { cancel: false, ...opts });
  box.remove();
  return v;
}

export function toast(msg, ms = 1600) {
  const t = el('div', { class: 'win toast' }, msg);
  root().append(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, ms);
}

let bannerEl = null, bannerTimer = null;
export function banner(name) {
  if (!bannerEl) { bannerEl = el('div', { class: 'win banner' }); root().append(bannerEl); }
  bannerEl.textContent = name;
  bannerEl.classList.add('show');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(() => bannerEl.classList.remove('show'), 2200);
}

let fadeEl = null;
export async function fade(on, ms = 220) {
  if (!fadeEl) { fadeEl = el('div', { class: 'fade' }); root().append(fadeEl); }
  fadeEl.style.transitionDuration = ms + 'ms';
  fadeEl.classList.toggle('on', on);
  await sleep(ms + 20);
}

/** 전체 화면 패널. build(body, api) 로 내용을 그린다. api.close(v) 로 닫힘. onKey 로 키 처리 */
export function panel(title, build, opts = {}) {
  return new Promise((resolve) => {
    const body = el('div', { class: 'body' });
    const x = el('button', { class: 'x', onclick: () => close(null) }, '닫기 ✕');
    const p = el('div', { class: 'win panel' }, el('header', {}, el('span', {}, title), x), body);
    root().append(p);
    document.body.classList.add('in-panel');
    let keyFn = null;
    const close = (v) => { pop(); p.remove(); if (!document.querySelector('.panel')) document.body.classList.remove('in-panel'); resolve(v); };
    const api = { close, body, onKey: (fn) => { keyFn = fn; }, setTitle: (t) => { p.querySelector('header span').textContent = t; } };
    const pop = Input.push((k) => {
      if (keyFn && keyFn(k) === true) return;
      if (k === 'b' || k === 'menu' || (k === 'a' && !keyFn)) { sfx('cancel'); close(null); }
    });
    build(body, api);
  });
}

/** 목록 선택 도우미: rows = [{node, value, disabled}] 를 panel 본문에 붙이고 위/아래/A 로 고른다 */
export function listNav(container, rows, onPick, opts = {}) {
  let sel = Math.min(opts.start || 0, Math.max(0, rows.length - 1));
  const paint = () => rows.forEach((r, i) => { r.node.classList.toggle('sel', i === sel); if (i === sel) r.node.scrollIntoView({ block: 'nearest' }); });
  rows.forEach((r, i) => { r.node.onclick = () => { sel = i; paint(); onPick(r.value, i); }; container.append(r.node); });
  paint();
  return (k) => {
    if (!rows.length) return false;
    const cols = opts.cols || 1;
    if (k === 'up') sel = Math.max(0, sel - cols);
    else if (k === 'down') sel = Math.min(rows.length - 1, sel + cols);
    else if (k === 'left' && cols > 1) sel = Math.max(0, sel - 1);
    else if (k === 'right' && cols > 1) sel = Math.min(rows.length - 1, sel + 1);
    else if (k === 'a') { onPick(rows[sel].value, sel); return true; }
    else return false;
    sfx('select'); paint(); return true;
  };
}

/** 이름 입력 */
export function askName(title, def) {
  return new Promise((resolve) => {
    const inp = el('input', { maxlength: 8, value: def });
    const ok = () => { const v = inp.value.trim() || def; box.remove(); pop(); resolve(v); };
    const box = el('div', { class: 'win namebox' }, el('div', { class: 'jua' }, title), inp,
      el('div', { class: 'row2' }, el('button', { onclick: ok }, '좋아요!')));
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); ok(); } });
    root().append(box);
    const pop = Input.push((k) => { if (k === 'a') ok(); });
    setTimeout(() => inp.focus(), 50);
  });
}

export function setFastText(v) { fastText = v; }
