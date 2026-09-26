/* home_tidy.js — 홈 화면 정리 + 만화·영상 바로가기.

   문제(2026-07-29 실측): 홈 탭이 14,494px(폰 화면 16장)에 섹션 29개·버튼 80개.
   그중 v13 랭크매치 3,010px + v14 히트맵 3,781px = 절반. 만화·영상은 과목 안
   마지막 단원에 묻혀 입구가 없었다.

   방침 — 아무것도 지우지 않는다.
     ①만화·영상 바로가기 카드를 홈 최상단에 신설(신규 추가)
     ②본문 아래쪽 기능 블록들을 주제별 접이식 그룹으로 재배치(이동만)
   노드를 appendChild로 옮기므로 onclick·리스너는 그대로 보존된다(nav_unify.js와 같은 방식).
   되돌리기 = index.html 의 이 스크립트 태그 한 줄 제거.

   ★버전 하드코딩 금지: vN 패치가 늦게 붙이는 컨테이너도 MutationObserver로 계속 흡수한다. */
(function () {
  'use strict';

  var POLL_MS = 400, SETTLE_MS = 20000, started = Date.now(), pending = 0, styled = false;

  /* 홈에서 위쪽 고정 구역 — catContent(과목 선택)까지는 손대지 않는다 */
  var TOP_ANCHOR = 'catContent';

  var GROUPS = [
    { id: 'lpgChallenge', title: '도전과 대결', icon: 'i-sword',
      keys: ['마스터리 챌린지', '타임어택', '학습 스토리', '듣기 퀴즈', '레벨 테스트', '주간 리그', '랭크 매치'] },
    { id: 'lpgStats', title: '기록과 통계', icon: 'i-chart',
      keys: ['학습 달력', '실력 레이더', '학습 로드맵', '과목별 진도', '히트맵', '주간 학습', '플래시카드'] },
    { id: 'lpgReward', title: '보상과 공유', icon: 'i-gift',
      keys: ['스트릭 실드', '성적 공유', '상점', 'XP 부스트', '학부모', '증명서', '학습자'] },
    { id: 'lpgEtc', title: '그 밖의 기능', icon: 'i-gear', keys: [] }   // 위에 안 걸리는 것 전부
  ];

  /* 만화·영상 바로가기 — [과목ID(어른), 과목ID(아이), 커리큘럼키, 단원명 조각] */
  var HUB = [
    { ic: 'i-comic', t: '수학이 태어난 날', d: '만화 6화 · 수학이 왜 태어났는지',
      adult: '수학', kid: '수학', key: 'math', unit: '수학이 태어난 날',
      thumb: 'assets/comics_pages/math_history/s1e01/p1_c1.jpg' },
    { ic: 'i-scroll', t: '아침의 나라 임금님들', d: '고조선 만화 6편 · 단군부터 강화도까지',
      adult: '역사', kid: '한국사', key: 'history', unit: '아침의 나라',
      thumb: 'assets/comics/k_history/gojoseon_e01/p1.jpg' },
    { ic: 'i-music', t: '모차르트 명곡', d: '영상 23편 · 다섯 살의 첫 곡부터',
      adult: '음악', kid: '음악', key: 'music', unit: '모차르트', thumb: null }
  ];

  /* ---------- 만화 카드 썸네일 (2026-09-26)
     벤치마크 결론: 유아·학생 대상 앱은 첫 화면 카드에 실제 그림이 붙는다(핑크퐁·토도한글·엄마까투리).
     병석님도 "뭔가 캐릭터나 그림 이런게 많이 없는 느낌"이라 지적했다.
     music(모차르트)은 영상이라 썸네일 자원이 없으므로 아이콘 그대로 둔다 — 없는 그림을 지어내지 않는다. */
  function hubThumb(h) {
    if (!h || !h.thumb) return '<div class="lp-hubi">' + svgIco(h.ic) + '</div>';
    return '<div class="lp-hubi lp-hubimg"><img src="' + h.thumb + '" alt="" loading="lazy"'
         + ' onerror="this.parentNode.classList.add(\'lp-noimg\')"></div>';
  }

  /* ★U는 let 선언이라 window.U 가 아니다 — 맨이름으로 읽어야 아이/어른 모드를 안다 */
  /* 이모지 금지(DESIGN_SPEC §0-3) — index.html 스프라이트를 참조한다 */
  function svgIco(id) {
    return '<svg class="ico" aria-hidden="true" focusable="false"><use href="#' + (id || 'i-star') + '"/></svg>';
  }

  function isKid() { try { return typeof U !== 'undefined' && !!U.kidMode; } catch (e) { return false; } }

  /* ---------- 바로가기: 학습탭 → 과목 → 해당 단원으로 스크롤 ---------- */

  function openSubj(h, useKid) {
    var subj = useKid ? h.kid : h.adult;
    try {
      if (typeof openSubjectNew === 'function') { openSubjectNew(subj); return; }
    } catch (e) {}
    try { openSubject(h.key); } catch (e2) {}
  }

  function goUnit(i) {
    var h = HUB[i];
    if (!h) return;
    try { go(1); } catch (e) {}

    var kid = isKid();
    openSubj(h, kid);

    // 동적 과목은 커리큘럼 JSON을 기다리므로 나타날 때까지 훑는다.
    // 아이/어른 과목명이 다른 과목(역사↔한국사)은 1초 안에 못 찾으면 반대쪽으로 한 번 더 시도.
    var tries = 0, retried = false;
    (function seek() {
      var list = document.getElementById('unitList');
      if (list) {
        var secs = list.querySelectorAll('.sec');
        for (var k = 0; k < secs.length; k++) {
          if (secs[k].textContent.indexOf(h.unit) >= 0) {
            var el = secs[k];
            el.scrollIntoView({ block: 'start', behavior: 'smooth' });
            el.style.transition = 'background .3s';
            el.style.background = 'rgba(6,214,160,.18)';
            setTimeout(function () { el.style.background = ''; }, 1600);
            return;
          }
        }
      }
      tries++;
      if (!retried && tries === 9 && h.kid !== h.adult) { retried = true; openSubj(h, !kid); }
      if (tries < 40) setTimeout(seek, 120);
    })();
  }
  window.lpGoContent = goUnit;

  /* ================================================================
     첫 화면 정보 구조 개편 (2026-09-26)

     오너 지적: "필요없는건 다 밖에 나와서. 보이고 필요한건 찾기도 어렵고"
     실측 근거: 폰 높이 915px · 홈 전체 3155px = 3.4 화면 분량.
     첫 화면(폴드)에 보이는 건 과목탭 12개 + 오늘의 한 가지 + 만화카드 3개뿐이었고,
     게임·실험·퀴즈는 2스크롤 아래(1900~2700px)에 있었다. 즉 "보이는 건 필요 없는 것,
     필요한 건 숨겨진 것"이 실제로 성립했다.

    3개 문 — 위 3줄은 "무엇을 하느냐"로 들어가는 3개의 큰 타일.
      배운다(만화·영상·레슨) / 놀린다(게임·실험) / 확인한다(퀴즈)
    이 셋이 첫 화면에 바로 보여야 과목 탭으로 내려가지 않고도 목적이 닿는다.
    과목 탭은 그래도 남긴다 — '무엇을' 선택하는 정본이기 때문.
     ================================================================ */
  function buildDoors(p0) {
    if (document.getElementById('lpDoors')) return;
    var box = document.createElement('div');
    box.id = 'lpDoors';
    box.dataset.lpTidy = 'keep';
    var learn = 0, play = 0, quiz = 0;
    try {
      if (typeof window.lpKindCount === 'function') { var c = window.lpKindCount(); learn = c.learn; play = c.play; quiz = c.quiz; }
    } catch (e) {}
    var DOORS = [
      { ic: 'i-book',  t: '배운다', d: '만화 · 영상 · 레슨', k: 'learn', n: learn, sc: '#4F46E5' },
      { ic: 'i-play',  t: '놀린다', d: '게임 · 과학실험',  k: 'play',  n: play,  sc: '#0E9F6E' },
      { ic: 'i-note',  t: '확인한다', d: '퀴즈로 되짚기',  k: 'quiz',  n: quiz,  sc: '#C2410C' }
    ];
    var h = '<div class="sec lp-doorhead" style="font-size:13px">'
          + '<span class="lp-whois">천천히, 하나씩. 배우고 · 놀고 · 확인해요</span></div>'
          + '<div class="lp-doors">';
    for (var i = 0; i < DOORS.length; i++) {
      var d = DOORS[i];
      h += '<button class="lp-door" style="--dc:' + d.sc + '" onclick="lpDoor(\'' + d.k + '\')">'
        + '<span class="lp-doi">' + svgIco(d.ic) + '</span>'
        + '<span class="lp-dot">' + d.t + '</span>'
        + '<span class="lp-dod">' + d.d + '</span>'
        + (d.n ? '<span class="lp-don">' + d.n + '개</span>' : '')
        + '<span class="lp-doa">›</span></button>';
    }
    h += '</div>';
    box.innerHTML = h;
    var hero = document.getElementById('heroBanner');
    var hub  = document.getElementById('lpContentHub');
    if (hero && hero.parentNode === p0) p0.insertBefore(box, hero);
    else if (hub && hub.parentNode === p0) p0.insertBefore(box, hub);
    else p0.insertBefore(box, p0.firstChild);
  }

  /* 3개 문(배운다/놀린다/확인한다) — 누르면 해당 종류만 모아 보여준다.
     넷바 '놀이' 탭으로 튀지 않고 홈 안에서 끝난다(한 단계 줄이기). */
  window.lpDoor = function (kind) {
    var p0 = document.getElementById('p0');
    var want = { learn: ['learn'], play: ['play'], quiz: ['quiz'] }[kind] || null;
    if (typeof window.lpDoorKind === 'function') {
      window.lpDoorKind(want, kind);
    } else {
      try { window.lpHubChip(kind === 'learn' ? 'all' : kind); } catch (e) {}
    }
    if (p0) p0.scrollTo({ top: 0, behavior: 'smooth' });
  };

  function buildHub(p0) {
    if (document.getElementById('lpContentHub')) return;
    var hero = document.getElementById('heroBanner');
    var box = document.createElement('div');
    box.id = 'lpContentHub';
    box.dataset.lpTidy = 'keep';
    var html = '<div class="sec" style="font-size:13px">' + svgIco('i-comic') + ' 만화·영상으로 배우기</div>'
             + '<div class="lp-hub">';
    for (var i = 0; i < HUB.length; i++) {
      var h = HUB[i];
      html += '<div class="lp-hubc" onclick="lpGoContent(' + i + ')">'
            + hubThumb(h)
            + '<div class="lp-hubx"><div class="lp-hubt">' + h.t + '</div>'
            + '<div class="lp-hubd">' + h.d + '</div></div>'
            + '<div class="lp-huba">›</div></div>';
    }
    box.innerHTML = html + '</div>';
    if (hero && hero.parentNode === p0) p0.insertBefore(box, hero);
    else p0.insertBefore(box, p0.firstChild);
  }

  /* ---------- 접이식 그룹 ---------- */

  function groupFor(el) {
    var txt = (el.innerText || '').slice(0, 200);
    for (var g = 0; g < GROUPS.length - 1; g++) {
      var keys = GROUPS[g].keys;
      for (var k = 0; k < keys.length; k++) if (txt.indexOf(keys[k]) >= 0) return GROUPS[g];
    }
    return GROUPS[GROUPS.length - 1];
  }

  function ensureGroup(p0, g) {
    var d = document.getElementById(g.id);
    if (d && d.parentNode === p0) return d;
    d = document.createElement('details');
    d.id = g.id;
    d.className = 'lp-grp';
    d.dataset.lpTidy = 'group';
    d.innerHTML = '<summary><span class="lp-grpt">' + svgIco(g.icon) + ' ' + g.title + '</span>'
                + '<span class="lp-grpn"></span></summary><div class="lp-grpb"></div>';
    p0.appendChild(d);
    return d;
  }

  function isFooter(el) {
    var t = el.innerText || '';
    return t.indexOf('© 2026') >= 0 || t.indexOf('PhET') >= 0;
  }

  function tidy() {
    var p0 = document.getElementById('p0');
    if (!p0) return;
    injectStyle();
    buildHub(p0);
    buildDoors(p0);

    var kids = [].slice.call(p0.children);
    var anchorIdx = -1;
    for (var i = 0; i < kids.length; i++) if (kids[i].id === TOP_ANCHOR) { anchorIdx = i; break; }
    if (anchorIdx < 0) return;                       // 아직 홈이 다 안 그려짐

    var footer = null, moved = 0;
    for (var j = anchorIdx + 1; j < kids.length; j++) {
      var el = kids[j];
      if (!el || el.nodeType !== 1) continue;
      if (el.dataset && (el.dataset.lpTidy === 'group' || el.dataset.lpTidy === 'keep')) continue;
      if (isFooter(el)) { footer = el; continue; }
      if (!el.offsetHeight && !el.children.length) continue;   // 빈 자리표시자는 그대로

      var g = groupFor(el);
      ensureGroup(p0, g).querySelector('.lp-grpb').appendChild(el);
      moved++;
    }

    // 그룹은 항상 앵커 뒤·푸터 앞 순서로 유지
    for (var k = 0; k < GROUPS.length; k++) {
      var d = document.getElementById(GROUPS[k].id);
      if (!d) continue;
      var body = d.querySelector('.lp-grpb');
      var n = body ? body.children.length : 0;
      if (!n) { d.style.display = 'none'; continue; }
      d.style.display = '';
      d.querySelector('.lp-grpn').textContent = n + '개';
      p0.appendChild(d);
    }
    if (footer) p0.appendChild(footer);
    return moved;
  }

  function schedule() {
    if (pending) return;
    pending = setTimeout(function () { pending = 0; tidy(); }, 80);
  }

  /* ---------- 스타일 ---------- */

  function injectStyle() {
    if (styled || document.getElementById('lpHomeTidyStyle')) { styled = true; return; }
    styled = true;
    var st = document.createElement('style');
    st.id = 'lpHomeTidyStyle';
    st.textContent = [
      /* 만화·영상 바로가기 */
      '#lpContentHub{margin:0 0 10px}',
      /* 홈 만화 카드 썸네일 (2026-09-26) — 실제 그림을 카드 왼쪽에 붙인다. */
      '.lp-hubimg{width:52px;height:52px;border-radius:11px;overflow:hidden;flex:0 0 52px;background:rgba(255,255,255,.06);display:flex;align-items:center;justify-content:center}',
      '.lp-hubimg img{width:100%;height:100%;object-fit:cover;display:block}',
      '.lp-hubimg.lp-noimg img{display:none}',
      /* 만화 컷 뷰어 (2026-09-26) — 정사각 컷 가로 넘김 + 얇은 진행 바 */
      '.lp-cmpbar{display:flex;align-items:center;gap:8px;font-size:11px;font-weight:700;color:var(--t3);margin:10px 0 6px;padding:0 2px}',
      '.lp-cmpbtns{margin-left:auto;display:flex;gap:6px}',
      '.lp-cmpb{width:28px;height:28px;border-radius:9px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.06);color:var(--t2);font-size:15px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0}',
      '.lp-cmpb:active{background:rgba(255,255,255,.14)}',
      '.lp-cmp{margin:0}',

      /* 첫 화면 3개 문(배운다/놀린다/확인한다) — 2026-09-26 정보 구조 개편.
         "보이는 건 필요 없는 것, 필요한 건 찾기 어려운 것"을 고치기 위해
         첫 화면에 목적을 큰 3타일로 노출한다. 과목 탭(선택) 위에 목적(방법)이 먼저 온다. */
      '.lp-doorhead{display:flex;align-items:baseline;gap:8px;margin:2px 0 8px}',
      '.lp-whois{font-size:12px;font-weight:700;color:var(--t2,#c9c9dd);letter-spacing:-.2px}',
      '.lp-doors{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:0 0 12px}',
      '.lp-door{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:3px;',
      'padding:12px 11px 11px;border-radius:var(--r,14px);cursor:pointer;text-align:left;',
      'background:linear-gradient(160deg,color-mix(in srgb,var(--dc,#4F46E5) 14%,transparent),transparent 70%),',
      'var(--c1,rgba(255,255,255,.03));border:1px solid color-mix(in srgb,var(--dc,#4F46E5) 32%,transparent);',
      'transition:transform .14s ease,border-color .14s ease}',
      '.lp-door:active{transform:scale(.975)}',
      '.lp-door:hover{border-color:var(--dc,#4F46E5)}',
      '.lp-doi{font-size:21px;line-height:1;color:var(--dc,#4F46E5);display:block;margin-bottom:2px}',
      '.lp-doi .ico{width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}',
      '.lp-dot{font-size:13.5px;font-weight:800;color:var(--tx,#1A2140);letter-spacing:-.3px}',
      '.lp-dod{font-size:10px;color:var(--t3,#8b8ba7);line-height:1.3}',
      '.lp-don{font-size:10px;font-weight:700;color:var(--dc,#4F46E5);margin-top:3px;',
      'align-self:flex-start;padding:1px 7px;border-radius:999px;',
      'background:color-mix(in srgb,var(--dc,#4F46E5) 16%,transparent)}',
      '.lp-doa{position:absolute;right:9px;bottom:9px;font-size:15px;color:var(--t3,#8b8ba7);line-height:1}',
      '@media(max-width:380px){.lp-doors{gap:6px}.lp-door{padding:10px 9px}.lp-dot{font-size:12.5px}}',
      '.lp-hub{display:flex;flex-direction:column;gap:6px}',
      '.lp-hubc{display:flex;align-items:center;gap:10px;padding:11px 12px;border-radius:var(--r,12px);',
      'background:linear-gradient(135deg,rgba(139,92,246,.16),rgba(6,214,160,.10));',
      'border:1px solid rgba(139,92,246,.3);cursor:pointer;transition:.15s}',
      '.lp-hubc:active{transform:scale(.985)}',
      '.lp-hubc:hover{border-color:var(--cy,#06d6a0)}',
      '.lp-hubi{font-size:24px;flex:0 0 auto;width:38px;display:flex;align-items:center;justify-content:center;color:var(--p,#6641E8)}',
      '.lp-hubi .ico,.lp-grpt .ico{width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
      '.lp-grpt{display:inline-flex;align-items:center;gap:6px}',
      '.lp-hubx{flex:1 1 auto;min-width:0}',
      '.lp-hubt{font-size:13px;font-weight:700;color:var(--tx,#1A2140)}',
      '.lp-hubd{font-size:10px;color:var(--t3,#8b8ba7);margin-top:2px}',
      '.lp-huba{flex:0 0 auto;font-size:18px;color:var(--t3,#8b8ba7)}',
      /* 접이식 그룹 */
      '.lp-grp{margin:8px 0;border:1px solid rgba(139,92,246,.16);border-radius:var(--r,12px);',
      'background:var(--c1,rgba(255,255,255,.03));overflow:hidden}',
      '.lp-grp>summary{list-style:none;cursor:pointer;padding:12px 14px;display:flex;align-items:center;',
      'justify-content:space-between;gap:8px;font-size:13px;font-weight:700;color:var(--t2,#c9c9dd)}',
      '.lp-grp>summary::-webkit-details-marker{display:none}',
      '.lp-grp>summary::after{content:"▾";font-size:12px;color:var(--t3,#8b8ba7);transition:.2s}',
      '.lp-grp[open]>summary::after{transform:rotate(180deg)}',
      '.lp-grpn{margin-left:auto;font-size:10px;font-weight:600;color:var(--t3,#8b8ba7);',
      'padding:2px 8px;border-radius:999px;background:rgba(139,92,246,.14)}',
      '.lp-grpb{padding:0 10px 10px}',
      /* 떠다니는 보조 버튼 3종이 본문 글자를 덮어 어수선했다 — 평소엔 흐리게, 만지면 또렷하게 */
      '.v3-sound-toggle,.v4-progress-ring{opacity:.4;transform:scale(.82);transform-origin:left bottom;transition:opacity .15s,transform .15s}',
      '.v3-sound-toggle:hover,.v3-sound-toggle:active,.v4-progress-ring:hover,.v4-progress-ring:active{opacity:1;transform:scale(1)}',
      '.tutor-fab{opacity:.72;transition:opacity .15s}',
      '.tutor-fab:hover,.tutor-fab:active{opacity:1}',
      /* 접이식 그룹의 개수 배지가 우측 떠다니는 버튼에 가리지 않도록 여백 */
      '#p0 > details.lp-grp > summary{padding-right:20px}'
    ].join('');
    (document.head || document.documentElement).appendChild(st);
  }

  /* ---------- 기동 ---------- */

  function boot() {
    tidy();
    if (window.MutationObserver) {
      var p0 = document.getElementById('p0');
      if (p0) new MutationObserver(schedule).observe(p0, { childList: true });
    }
    (function poll() {
      tidy();
      if (Date.now() - started < SETTLE_MS) setTimeout(poll, POLL_MS);
    })();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
