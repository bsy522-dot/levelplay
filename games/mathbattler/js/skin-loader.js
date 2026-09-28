/* skin-loader.js — 테마 교체 전담.
 *
 * 규약: 게임 코드는 테마 이름을 절대 모른다.
 *   themes/active.json   → { "active": "pokemon" }
 *   themes/index.json    → 목록(런타임 스위치용)
 *   skins/<id>/theme.json → 캐릭터·팔레트·텍스트
 *   skins/<id>/art/...    → 그 테마의 이미지
 *   data/curriculum.json  → 과목/단원/본문/퀴즈 (테마 무관)
 *
 * 테마를 바꾸려면 themes/active.json 의 "active" 값 하나만 고치면 된다.
 * 진행 기록 키는 '과목|단원|토픽' 이라 테마가 바뀌어도 살아남는다.
 */
(function (global) {
  'use strict';

  const ACTIVE_URL = 'themes/active.json';
  const INDEX_URL = 'themes/index.json';
  const CURRICULUM_URL = 'data/curriculum.json';
  const FALLBACK_THEME = 'pokemon';

  function getJSON(url) {
    return fetch(url, { cache: 'no-store' }).then(r => {
      if (!r.ok) throw new Error(url + ' → HTTP ' + r.status);
      return r.json();
    });
  }

  /* active.json 을 못 읽으면 저장소 기록을 대신 쓴다(오프라인·첫 실행 대비). */
  function pickTheme(forced) {
    if (forced) return Promise.resolve(forced);
    return getJSON(ACTIVE_URL)
      .then(a => a && a.active)
      .catch(() => null)
      .then(id => id || storedTheme() || FALLBACK_THEME);
  }

  function storedTheme() {
    try { return localStorage.getItem('mathbattler.theme') || null; } catch (e) { return null; }
  }

  /* ── 캐스터 매핑 ──
   * curriculum 토픽 하나마다 테마의 캐스터를 '무리(roster)' 로 묶는다.
   * 테마가 캐릭터 N 마리를 주면, 그 수가 아니라 '토픽별 무리' 만 중요하다.
   * entries 는 토픽키 순서대로 나열되어 있고, 같은 key 가 연속으로 나온다. */
  function joinCast(curriculum, cast) {
    const byKey = {};
    (cast.entries || []).forEach(e => { (byKey[e.key] = byKey[e.key] || []).push(e); });

    const out = [];
    for (const sub of curriculum.meta.subjects) {
      const S = curriculum.subjects[sub];
      if (!S) continue;
      S.units.forEach((u, ui) => {
        u.topics.forEach((t, ti) => {
          const key = sub + '|' + u.name + '|' + t.name;
          const roster = byKey[key] || [];
          if (!roster.length) {
            /* 테마에 없는 토픽은 자리표시자로 채운다 — 게임은 절대 멈추지 않는다 */
            roster.push({
              id: 'x_' + key.replace(/[^a-zA-Z0-9]+/g, '_'),
              name: t.name, art: null,
              hp: Math.max(2, Math.min(8, (t.quiz && t.quiz.length) || 2)),
              hpUnit: '문제', line: '', missing: true,
            });
          }
          out.push({
            key, subject: sub, unitName: u.name, unitIdx: ui, topicIdx: ti,
            name: t.name, level: t.level, tier: t.tier,
            roster, monster: roster[0],
            quiz: t.quiz || [], content: t.content || '',
            videoQuery: t.videoQuery || '',
          });
        });
      });
    }
    /* 정렬하지 않는다. curriculum 순서 = 학습 순서 = 약한 상대부터 강한 상대 순서다. */
    return out;
  }

  /* ── 테마 로드 ──
   * 반환: { theme, curriculum, cast(list), skin, list }
   *   skin = 런타임 결합본. map/gate/battle/palette/text 를 한 곳에 모은다. */
  function load(forcedId) {
    return pickTheme(forcedId).then(id => {
      return Promise.all([
        getJSON('skins/' + id + '/theme.json'),
        getJSON(CURRICULUM_URL),
      ]).then(([theme, curriculum]) => {
        try { localStorage.setItem('mathbattler.theme', id); } catch (e) { /* 무시 */ }
        const list = joinCast(curriculum, theme.cast || { entries: [] });
        const missing = list.filter(x => x.monster.missing).length;
        if (missing) console.warn('[skin] ' + id + ' : ' + missing + '개 토픽에 매핑 없음(placeholder 사용)');
        return {
          id, theme, curriculum, list,
          skin: buildSkin(theme, list),
          heroArt: theme.hero.art,
          placeholder: (theme.art && theme.art.placeholder) || null,
          missing,
        };
      });
    });
  }

  /* 코드가 실제로 읽는 skin 형태. theme.json 을 평탄화해 한 번만 결합한다. */
  function buildSkin(theme, list) {
    return {
      id: theme.id,
      title: theme.title,
      subtitle: theme.subtitle,
      hero: theme.hero,
      palette: Object.assign({}, theme.map.palette, theme.palette),
      map: theme.map,
      text: theme.text,
      gate: theme.gate,
      battle: theme.battle,
      encounter: theme.map.encounter,
      poi: theme.map.poi,
      decor: theme.map.decor,
      list,
    };
  }

  /* ── 런타임 테마 전환 (화면 열지 않고 즉시 갈아끼우기) ── */
  function use(id) {
    try { localStorage.setItem('mathbattler.theme', id); } catch (e) { /* 무시 */ }
    return load(id);
  }

  function available() {
    return getJSON(INDEX_URL).catch(() => ({ available: [] }));
  }

  global.MB = global.MB || {};
  global.MB.Skins = { load, use, available, joinCast, FALLBACK_THEME };
})(typeof window !== 'undefined' ? window : globalThis);
