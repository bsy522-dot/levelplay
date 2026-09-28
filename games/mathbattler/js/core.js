/* core.js — 상태 · 저장 · 게이트 판정. 브라우저 의존 없는 순수 로직.
 * 테마를 모른다. skin 규약만 읽는다. */
(function (global) {
  'use strict';

  const SAVE_KEY = 'mathbattler.save.v2';

  function makeState(skin) {
    return {
      v: 2,
      gp: 0,
      heroHp: skin.battle.hero_hp,
      heroMaxHp: skin.battle.hero_hp,
      streak: 0,
      bestStreak: 0,
      recent: [],
      topicSeen: {},
      topicSolved: {},
      defeated: {},
      wrongTotal: 0,
      rightTotal: 0,
      hintTotal: 0,
      _lastKey: null,
      inBattle: null,
    };
  }

  function load(skin) {
    const fresh = makeState(skin);
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return fresh;
      const s = JSON.parse(raw);
      if (!s) return fresh;
      /* v1(구 몬스터 테마) 기록도 살린다 — 키가 같으므로 그대로 이어받는다 */
      if (s.v !== 1 && s.v !== 2) return fresh;
      return Object.assign(fresh, s, { v: 2 });
    } catch (e) { return fresh; }
  }

  function save(state) {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* 무시 */ }
  }

  function reset(skin) {
    const fresh = makeState(skin);
    save(fresh);
    return fresh;
  }

  /* ── 기록 누적: 정답/오답 어느 쪽이든 호출 ── */
  function record(state, topicKey, correct) {
    state.rightTotal += correct ? 1 : 0;
    state.wrongTotal += correct ? 0 : 1;
    if (correct) {
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
    } else {
      state.streak = 0;
    }
    state.recent.push(!!correct);
    if (state.recent.length > 40) state.recent.splice(0, state.recent.length - 40);
    state.topicSeen[topicKey] = (state.topicSeen[topicKey] || 0) + 1;
  }

  /* ── 게이트: 3조건 동시 충족 시 다음 난이도 열림 ── */
  function gate(state, skin, topicKey) {
    const g = skin.gate;
    const win = state.recent.slice(-g.recent_window);
    const acc = win.length ? win.filter(Boolean).length / win.length : 0;
    const seen = state.topicSeen[topicKey] || 0;
    const cond = {
      streak: { val: state.streak, need: g.streak_required, ok: state.streak >= g.streak_required },
      recent: {
        val: acc, need: g.recent_acc,
        ok: win.length >= Math.min(3, g.recent_window) && acc >= g.recent_acc,
      },
      seen: { val: seen, need: g.min_topic_exposure, ok: seen >= g.min_topic_exposure },
    };
    return { open: cond.streak.ok && cond.recent.ok && cond.seen.ok, cond, acc, seen };
  }

  /* 다음 상대: 지금 토픽의 무리를 안 잡았으면 재도전, 잡았으면 다음 난이도 */
  function nextMonster(list, state, currentKey) {
    const i = list.findIndex(m => m.key === currentKey);
    if (i < 0) return list[0] || null;
    const m = list[i];
    const allDone = m.roster.every(x => state.defeated[x.id]);
    if (!allDone) return m;
    return list[i + 1] || m;
  }

  global.MB = global.MB || {};
  global.MB.core = { SAVE_KEY, makeState, load, save, reset, record, gate, nextMonster };
})(typeof window !== 'undefined' ? window : globalThis);
