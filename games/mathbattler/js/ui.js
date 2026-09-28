/* ui.js — 화면 구성. map/battle/library/codex/result.
 * 테마 이름을 절대 모른다. skin.text / skin.palette 만 따른다. */
(function (global) {
  'use strict';
  const core = global.MB.core;
  const $ = s => document.querySelector(s);
  const el = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };

  function UI(game) {
    this.g = game;
    this.skin = game.skin;
    this.state = game.state;
    this.build();
  }

  UI.prototype.build = function () {
    const s = this.skin, P = s.palette;
    const set = (k, v) => document.body.style.setProperty(k, v);
    set('--sky', P.bg_sky); set('--grass', P.bg_grass); set('--grass2', P.bg_grass2);
    set('--path', P.bg_path); set('--water', P.bg_water);
    set('--panel', P.ui_panel); set('--text', P.ui_text); set('--accent', P.ui_accent);
    set('--hp-mine', P.hp_mine); set('--hp-enemy', P.hp_enemy);
    set('--correct', P.correct); set('--wrong', P.wrong);
    $('#skin-title').textContent = s.title;
    $('#skin-sub').textContent = s.subtitle;
  };

  /* ── 상단 HUD ── */
  UI.prototype.hud = function () {
    const s = this.state, g = this.g;
    $('#gp-val').textContent = s.gp;
    $('#hero-hp-val').textContent = s.heroHp + '/' + s.heroMaxHp;
    $('#streak-val').textContent = s.streak;
    $('#best-val').textContent = s.bestStreak;
    const cur = g.curTopicKey();
    if (cur) {
      const gt = core.gate(s, this.skin, cur);
      $('#gate-acc').textContent = Math.round(gt.acc * 100) + '%';
      $('#gate-seen').textContent = gt.cond.seen.val + '/' + this.skin.gate.min_topic_exposure;
      $('#gate-lock').className = 'gate-lock ' + (gt.open ? 'open' : 'shut');
      $('#gate-lock').textContent = gt.open ? this.skin.text.msg_gate_open : this.skin.text.msg_gate_locked;
    }
  };

  /* ── 배틀 ── */
  UI.prototype.showBattle = function (b) {
    $('#screen-map').classList.add('hidden');
    $('#screen-battle').classList.remove('hidden');
    $('#b-fb').textContent = '';
    $('#hint-box').classList.add('hidden');
    $('#hint-btn').textContent = this.skin.text.label_hint;
    $('#hint-btn').disabled = false;
    this.hud();
  };

  /* 상대 패널(이름·이미지·체력·토픽)을 그린다.
   * ★매 문제마다 불러야 한다. 한 무리에 여러 캐릭터가 있으므로
   *   앞 포켓몬을 잡으면 이름과 그림이 다음 포켓몬으로 바뀌어야 한다.
   *   이게 showBattle 에만 묶여 있으면 2번째 상대에서도 1번째 그림이 멈춰 있었다. */
  UI.prototype.renderMon = function (b) {
    const m = b.entry;
    const mon = b.mon();
    $('#b-mname').textContent = mon.name;
    const sl = b.slotLabel();
    $('#b-slot').textContent = sl ? (this.skin.text.label_roster + ' ' + sl) : '';
    $('#b-topic').textContent = m.subject + ' · ' + m.unitName + ' · ' + m.name;
    $('#b-tier').textContent = 'TIER ' + m.tier;
    const img = $('#b-mimg');
    const ph = this.g.placeholderArt;
    img.onerror = function () { img.onerror = null; if (ph) img.src = ph; };
    if (mon.art) img.src = this.g.artURL(mon.art); else img.src = ph || '';
    $('#b-mline').textContent = mon.line || '';
    this.renderHp(b);
    this.hud();
  };

  UI.prototype.renderHp = function (b) {
    const mine = this.state.heroHp, mh = this.state.heroMaxHp;
    $('#hero-hp-bar').style.width = Math.max(0, mine / mh * 100) + '%';
    const left = b.hpLeft(), total = b.total() || 1;
    $('#b-hp-bar').style.width = (left / total * 100) + '%';
    $('#b-hp-text').textContent = left + '/' + b.total() + ' ' + this.skin.text.label_monster_hp;
    $('#b-prog').textContent = b.total() ? (b.qi + 1) + ' / ' + b.total() : '0 / 0';
  };

  UI.prototype.renderQuestion = function (b, q) {
    $('#b-q').textContent = q.q;
    const box = $('#b-opts');
    box.innerHTML = '';
    (q.a || []).forEach((a, i) => {
      const btn = el('button', 'opt', a);
      btn.onclick = () => { if (btn.disabled) return; this.g.answer(b, i); };
      box.appendChild(btn);
    });
  };

  UI.prototype.feedback = function (b, pick, good, gain) {
    const q = b.cur();
    const btns = [...document.querySelectorAll('#b-opts .opt')];
    btns.forEach(x => x.disabled = true);
    btns.forEach((x, i) => {
      if (i === q.c) x.classList.add('right');
      else if (i === pick) x.classList.add('wrong');
    });
    const fb = $('#b-fb');
    fb.className = 'b-fb ' + (good ? 'ok' : 'no');
    fb.textContent = (good ? '정답! ' : '틀렸습니다. ')
      + (q.a ? q.a[q.c] : '')
      + (gain > 0 ? '  +' + gain + 'GP' : '')
      + (q.expl ? '  · ' + q.expl : '');
    this.renderHp(b);
    this.hud();
  };

  UI.prototype.showHint = function (b) {
    const box = $('#hint-box');
    const q = b.cur();
    const m = b.entry;
    const vq = m.videoQuery || '';
    const lessonLink = this.g.lessonURL ? this.g.lessonURL(m.subject, m.unitName, m.name) : '';
    box.innerHTML = '';
    box.appendChild(el('div', 'hint-title', '📚 ' + this.skin.text.msg_hint_used));
    if (q && q.expl) box.appendChild(el('div', 'hint-body', q.expl));
    if (vq) {
      const a = el('a', 'hint-link', '📹 관련 영상 찾기: ' + vq);
      a.href = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(vq);
      a.target = '_blank';
      box.appendChild(a);
    }
    if (lessonLink) {
      const a = el('a', 'hint-link', '📖 배움퀘스트에서 이 단원 전체 학습하기');
      a.href = lessonLink; a.target = '_blank';
      box.appendChild(a);
    }
    box.classList.remove('hidden');
    $('#hint-btn').disabled = true;
    $('#hint-btn').textContent = '사용함';
  };

  /* ── 도서관(도감) ── */
  UI.prototype.showLibrary = function (list) {
    $('#screen-battle').classList.add('hidden');
    $('#screen-study').classList.add('hidden');
    $('#screen-lib').classList.remove('hidden');
    const wrap = $('#lib-list');
    wrap.innerHTML = '';
    const doc = this.g.doc;
    let curSub = null, curUnit = null;
    list.forEach(m => {
      if (m.subject !== curSub) {
        curSub = m.subject; curUnit = null;
        wrap.appendChild(el('div', 'lib-sub', ((doc.subjects[curSub] || {}).icon || '') + ' ' + curSub));
      }
      if (m.unitName !== curUnit) { curUnit = m.unitName; wrap.appendChild(el('div', 'lib-unit', curUnit)); }
      const seen = this.state.topicSeen[m.key] || 0;
      const solved = this.state.topicSolved[m.key] ? '✔ ' : '';
      const row = el('div', 'lib-row');
      row.appendChild(el('span', 'lr-t', solved + m.name));
      row.appendChild(el('span', 'lr-m', m.roster.map(x => x.name).join('·')));
      row.appendChild(el('span', 'lr-s', this.skin.text.label_seen + ' ' + seen));
      const btn = el('button', 'lr-b', this.skin.text.label_study);
      btn.onclick = () => this.g.study(m);
      row.appendChild(btn);
      wrap.appendChild(row);
    });
    this.hud();
  };

  UI.prototype.showStudy = function (m) {
    $('#screen-lib').classList.add('hidden');
    $('#screen-study').classList.remove('hidden');
    $('#st-title').textContent = m.subject + ' · ' + m.name;
    $('#st-tier').textContent = 'TIER ' + m.tier + ' · ' + this.skin.text.label_monster_hp + ' ' + (m.quiz.length) + '개';
    $('#st-content').innerHTML = m.content || '<p>(본문 없음)</p>';
    const ql = $('#st-questions');
    ql.innerHTML = '';
    m.quiz.forEach(q => {
      const w = el('div', 'st-q');
      w.appendChild(el('b', null, 'Q. ' + q.q));
      w.appendChild(el('div', 'st-a', '정답: ' + q.a[q.c]));
      if (q.expl) w.appendChild(el('div', 'st-e', q.expl));
      ql.appendChild(w);
    });
    $('#st-gate').innerHTML = this.gateHTML(m.key);
  };

  UI.prototype.gateHTML = function (key) {
    const gt = core.gate(this.state, this.skin, key);
    const g = this.skin.gate, s = this.state;
    const row = (name, c, valTxt) => '<div class="grow ' + (c.ok ? 'ok' : 'no') + '">'
      + '<span class="gn">' + name + '</span><span class="gv">' + valTxt + '</span></div>';
    return '<div class="gate-box ' + (gt.open ? 'open' : 'shut') + '">'
      + '<div class="gate-h">' + this.skin.text.label_gate
      + ' <b>' + (gt.open ? '열림' : '잠김') + '</b></div>'
      + row(this.skin.text.label_streak, gt.cond.streak, s.streak + ' / ' + g.streak_required)
      + row(this.skin.text.label_recent, gt.cond.recent, Math.round(gt.acc * 100) + '% / ' + Math.round(g.recent_acc * 100) + '%')
      + row(this.skin.text.label_seen, gt.cond.seen, gt.cond.seen.val + ' / ' + g.min_topic_exposure)
      + '</div>';
  };

  UI.prototype.battleEnd = function (win, entry) {
    $('#screen-battle').classList.add('hidden');
    $('#screen-result').classList.remove('hidden');
    const t = this.skin.text;
    $('#rs-title').textContent = (win ? '🎉 ' : '💔 ') + (win ? t.msg_win : t.msg_lose);
    $('#rs-body').innerHTML = (win
      ? '<p>' + entry.roster.map(x => x.name).join(', ') + ' 격파! 보상을 받았습니다.</p>'
      : '<p>체력이 바닥났습니다. 회복 후 다시 도전하세요.</p>') + this.gateHTML(entry.key);
    this.hud();
  };

  UI.prototype.toast = function (msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(this._tt);
    this._tt = setTimeout(() => t.classList.remove('show'), 2200);
  };

  global.MB.UI = UI;
})(window);
