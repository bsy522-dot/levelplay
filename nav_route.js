/* ================================================================
   nav_route.js — 내비게이션 경로 통일 (2026-08-22)

   병석님 지적: "클릭하면 원하는 위치가 항상 나오질 않고,
                뒤로가기가 온 길로 안 돌아간다."

   실측으로 확인된 원인:
     뒤로가기가 '실제로 지나온 화면'이 아니라 '고정된 계층'
     (레슨→단원목록→과목목록→홈)으로 움직였다. 홈이나 과목허브에서
     레슨을 바로 열면, 뒤로가기가 한 번도 안 가본 단원목록을 보여줬다.

   원칙 두 가지만 지킨다:
     ① 뒤로가기(안드로이드/화면의 ←)는 실제로 지나온 화면을 되돌아간다.
     ② 카드 클릭은 목적지가 한 번에 나온다 — 중간 목록을 비추지 않는다.

   구현: 화면이 바뀌기 직전의 상태(패널·학습단계·과목·스크롤)를 스택에
   쌓고, 뒤로가기는 스택에서 꺼내 복원한다. 기존 함수는 감싸기만 하고
   본체는 건드리지 않는다.
   ================================================================ */
(function () {
  'use strict';
  var ST = [], MAX = 30, restoring = false, compound = 0;
  var LAST = { ui: null, li: null }, HUB = { k: null };

  function el(id) { return document.getElementById(id); }
  function visible(id) { var e = el(id); return !!(e && e.style.display !== 'none'); }
  /* index.html의 cur·curSubj는 let 선언이라 window에 안 붙는다 → 패널은 DOM에서,
     과목은 openSubject 래퍼가 직접 기억한다. */
  function curIdx() {
    var on = document.querySelector('.pg.on');
    if (!on) return 0;
    var m = /^p(\d+)$/.exec(on.id);
    return m ? +m[1] : 0;
  }
  var SUBJ = { k: null };

  /* ── 지금 화면의 스냅샷 ── */
  function snap() {
    var s = { p: curIdx() };
    if (s.p === 1) {
      s.lv = visible('learnLesson') ? 'lesson' : (visible('learnUnit') ? 'unit' : 'main');
      s.subj = SUBJ.k;
      if (s.lv === 'lesson') { s.ui = LAST.ui; s.li = LAST.li; }
      var p1 = el('p1'); s.sc = p1 ? p1.scrollTop : 0;
    } else if (s.p === 0) {
      try { s.tab = window.lpHomeTabState ? window.lpHomeTabState() : null; } catch (e) {}
      var p0 = el('p0'); s.sc = p0 ? p0.scrollTop : 0;
    } else if (s.p === 5) {
      s.hub = HUB.k;
      var p5 = el('p5'); s.sc = p5 ? p5.scrollTop : 0;
    } else {
      var pp = el('p' + s.p); s.sc = pp ? pp.scrollTop : 0;
    }
    return s;
  }
  function same(a, b) {
    return !!(a && b && a.p === b.p && a.lv === b.lv && a.subj === b.subj
              && a.ui === b.ui && a.li === b.li && a.hub === b.hub && a.tab === b.tab);
  }
  function push() {
    if (restoring || compound > 0) return;
    var s = snap();
    if (ST.length && same(ST[ST.length - 1], s)) return;
    ST.push(s); if (ST.length > MAX) ST.shift();
  }

  /* ── 원본 함수 붙잡기 (이 파일은 ia_hub.js 뒤에 로드된다) ── */
  var _go = window.go, _openSubject = window.openSubject, _openLesson = window.openLesson;
  var _btU = window.backToUnits, _btS = window.backToSubjects;
  var _hubOpen = window.lpOpenSubject, _hubBack = window.lpBackToSubjects;
  var _oi = window.lpOpenItem, _ot = window.lpOpenTitled;

  function setScroll(id, v) {
    var e = el(id); if (!e) return;
    e.scrollTop = v || 0;
    try { requestAnimationFrame(function () { e.scrollTop = v || 0; }); } catch (x) {}
    setTimeout(function () { e.scrollTop = v || 0; }, 80);
  }

  /* ── 스냅샷 복원 ── */
  function restore(s) {
    restoring = true;
    try {
      if (s.p === 1) {
        _go(1);
        if (s.lv === 'lesson' && s.subj && s.ui != null) {
          _openSubject(s.subj); SUBJ.k = s.subj; _openLesson(s.ui, s.li);
        } else if (s.lv === 'unit' && s.subj) {
          _btU(); _openSubject(s.subj); SUBJ.k = s.subj;
        } else {
          _btS();
        }
        setScroll('p1', s.sc);
      } else if (s.p === 0) {
        _go(0);
        try {
          if (s.tab && window.lpHomeTab && window.lpHomeTabState() !== s.tab) window.lpHomeTab(s.tab);
        } catch (e) {}
        setScroll('p0', s.sc);
      } else if (s.p === 5) {
        _go(5);
        if (s.hub) { HUB.k = s.hub; _hubOpen(s.hub); }
        else { HUB.k = null; _hubBack(); }
        setScroll('p5', s.sc);
      } else {
        _go(s.p);
        setScroll('p' + s.p, s.sc);
      }
    } finally {
      setTimeout(function () { restoring = false; }, 60);
    }
  }

  function navBack() {
    var s = ST.pop(); if (!s) return false;
    restore(s); return true;
  }
  window.lpNavBack = navBack;
  window.lpNavStack = function () { return ST.slice(); };   /* 검증용 */

  /* ── 감싸기: 화면을 바꾸는 사용자 행동마다 직전 상태를 쌓는다 ── */
  window.go = function (i) {
    if (typeof i === 'number' && i !== curIdx()) push();
    return _go.apply(this, arguments);
  };
  window.openSubject = function (k) {
    if (!restoring) push();
    var r = _openSubject.apply(this, arguments);
    SUBJ.k = k;
    /* _renderSubjectUnits는 learnMain↔learnUnit만 바꾸고 learnLesson은 안 건드린다.
       깊이 열기 뒤 남은 낡은 레슨이 단원목록 위를 덮는 것을 여기서 막는다. */
    if (visible('learnUnit')) { var ll = el('learnLesson'); if (ll) ll.style.display = 'none'; }
    return r;
  };
  window.openLesson = function (ui, li) {
    if (!restoring) push();
    var r = _openLesson.apply(this, arguments);
    LAST.ui = ui; LAST.li = li;
    return r;
  };
  window.lpOpenSubject = function (k) {
    if (!restoring) push();
    HUB.k = k;
    return _hubOpen.apply(this, arguments);
  };

  /* 화면의 ← 버튼: 지나온 길이 있으면 그리로, 없으면 원래 계층 */
  window.backToUnits = function () {
    if (!restoring && ST.length) return navBack();
    return _btU.apply(this, arguments);
  };
  window.backToSubjects = function () {
    if (!restoring && ST.length) return navBack();
    return _btS.apply(this, arguments);
  };
  window.lpBackToSubjects = function () {
    HUB.k = null;
    if (!restoring && ST.length) return navBack();
    return _hubBack.apply(this, arguments);
  };

  /* 카드 열기 = 복합 이동(go→openSubject→openLesson) 한 덩어리.
     출발지 한 번만 쌓고, 중간 화면은 스택에 넣지 않는다. */
  function wrapCompound(fn) {
    return function () {
      if (!restoring) push();
      compound++;
      try { return fn.apply(this, arguments); }
      finally { setTimeout(function () { compound--; }, 500); }
    };
  }
  if (_oi) window.lpOpenItem = wrapCompound(_oi);
  if (_ot) window.lpOpenTitled = wrapCompound(_ot);

  /* ── 안드로이드/브라우저 뒤로가기 ── */
  window.lpHandleBack = function () {
    var o;
    o = el('gO'); if (o && o.classList.contains('sh')) { try { cG(); } catch (e) {} return true; }
    o = el('mo'); if (o && o.classList.contains('sh')) { try { cMo(); } catch (e) {} return true; }
    o = el('battleOverlay'); if (o && o.style.display === 'flex') { try { closeBattle(); } catch (e) {} return true; }
    o = el('onboardOverlay'); if (o && o.style.display === 'flex') { o.style.display = 'none'; try { U.onboarded = true; sv(); } catch (e) {} return true; }
    o = document.querySelector('.v7-vidquiz-overlay'); if (o) { o.remove(); return true; }
    if (navBack()) return true;
    if (curIdx() !== 0) { try { _go(0); } catch (e) {} return true; }
    return false;   /* 홈 + 스택 없음 → 한 번 더 누르면 종료 */
  };
})();
