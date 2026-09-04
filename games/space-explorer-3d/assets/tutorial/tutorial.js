/* === 우주탐험 인터랙티브 튜토리얼 (PRISM Studio UX) ===
 * 첫 방문자를 위한 5단계 가이드. 메인 HTML 무수정.
 * 사용: <link rel="stylesheet" href="assets/tutorial/tutorial.css">
 *      <script defer src="assets/tutorial/tutorial.js"></script>
 * API: globalThis.SpaceTutorial.{init(), start(), end()}
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'space-explorer-tutorial-done';
  var ROOT_ID = 'tutorial-root';
  var HELP_BTN_ID = 'tut-help-btn';
  var POLL_MS = 200;

  var state = {
    started: false,
    step: 0,                 // 0=환영, 1=행성클릭, 2=출발, 3=탐사, 4=배지/완료
    pollTimer: null,
    initialSamples: 0,
    arrowEl: null,
    coachEl: null,
    cardEl: null,
    backdropEl: null,
    spotlightEl: null,
    spotTimer: null
  };

  // ---------- 유틸 ----------
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  function root() {
    return document.getElementById(ROOT_ID);
  }

  function clearOverlay() {
    var r = root();
    if (!r) return;
    // 도움말 버튼은 보존
    var children = Array.prototype.slice.call(r.children);
    children.forEach(function (c) {
      if (c.id !== HELP_BTN_ID) r.removeChild(c);
    });
    state.arrowEl = null;
    state.coachEl = null;
    state.cardEl = null;
    state.backdropEl = null;
    state.spotlightEl = null;
    if (state.spotTimer) {
      clearInterval(state.spotTimer);
      state.spotTimer = null;
    }
  }

  function arrowSVG() {
    // 위쪽을 가리키는 황금색 화살표
    return '' +
      '<svg viewBox="0 0 56 80" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
        '<defs>' +
          '<linearGradient id="tut-arrow-grad" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0" stop-color="#fff3a8"/>' +
            '<stop offset="1" stop-color="#ffb700"/>' +
          '</linearGradient>' +
        '</defs>' +
        '<path d="M28 4 L52 36 L38 36 L38 76 L18 76 L18 36 L4 36 Z" ' +
        'fill="url(#tut-arrow-grad)" stroke="#1a1530" stroke-width="2" stroke-linejoin="round"/>' +
      '</svg>';
  }

  // ---------- 단계별 렌더 ----------
  function renderStep0_Welcome() {
    clearOverlay();
    var card = el('div', 'tut-card');
    card.innerHTML =
      '<h2>🚀 우주 탐험가가 된 걸 환영해요!</h2>' +
      '<div class="tut-body">' +
        '<ul>' +
          '<li>🪐 <strong>행성 8개</strong>와 태양·달까지 <strong>10곳</strong>을 탐험합니다</li>' +
          '<li>❓ <strong>퀴즈</strong>를 맞히면 🏅 배지를 받아요</li>' +
          '<li>🔧 샘플을 모아 <strong>로켓을 강화</strong>해 더 멀리!</li>' +
        '</ul>' +
      '</div>' +
      '<div class="tut-actions">' +
        '<button class="tut-btn tut-btn-secondary" data-tut-act="skip">건너뛰기</button>' +
        '<button class="tut-btn tut-btn-primary" data-tut-act="next">시작하기</button>' +
      '</div>';
    root().appendChild(card);
    state.cardEl = card;

    card.addEventListener('click', function (ev) {
      var t = ev.target;
      if (!t || !t.getAttribute) return;
      var a = t.getAttribute('data-tut-act');
      if (a === 'skip') endTutorial(true);
      else if (a === 'next') gotoStep(1);
    });
  }

  function renderStep1_ClickPlanet() {
    clearOverlay();
    var arrow = el('div', 'tut-arrow');
    arrow.innerHTML = arrowSVG();
    root().appendChild(arrow);
    state.arrowEl = arrow;

    var coach = el('div', 'tut-coach');
    coach.innerHTML =
      '<div class="tut-step-label">STEP 2 / 5</div>' +
      '<div class="tut-msg">💎 화면 중앙에 보이는 <strong>행성을 클릭(또는 터치)</strong>하세요</div>' +
      '<div class="tut-mini-actions">' +
        '<button class="tut-skip-link" data-tut-act="skip">건너뛰기</button>' +
      '</div>';
    root().appendChild(coach);
    state.coachEl = coach;

    coach.addEventListener('click', function (ev) {
      if (ev.target && ev.target.getAttribute('data-tut-act') === 'skip') endTutorial(true);
    });
    // 다음 단계로의 진행은 폴링이 감지 (planet-info 표시)
  }

  function renderStep2_Depart() {
    clearOverlay();

    // 출발 버튼 위치 계산 (planet-info 패널 안의 첫 .btn)
    var spot = computeDepartSpotlight();

    var coach = el('div', 'tut-coach tut-coach-top');
    coach.innerHTML =
      '<div class="tut-step-label">STEP 3 / 5</div>' +
      '<div class="tut-msg">🚀 <strong>출발 버튼</strong>을 눌러 이 행성으로 가보세요</div>' +
      '<div class="tut-mini-actions">' +
        '<button class="tut-skip-link" data-tut-act="skip">건너뛰기</button>' +
      '</div>';
    root().appendChild(coach);
    state.coachEl = coach;
    coach.addEventListener('click', function (ev) {
      if (ev.target && ev.target.getAttribute('data-tut-act') === 'skip') endTutorial(true);
    });

    if (spot) {
      var sp = el('div', 'tut-spotlight');
      sp.style.left = spot.x + 'px';
      sp.style.top = spot.y + 'px';
      sp.style.width = spot.w + 'px';
      sp.style.height = spot.h + 'px';
      root().appendChild(sp);
      state.spotlightEl = sp;

      // 패널이 스크롤되거나 리사이즈되면 위치 갱신
      state.spotTimer = setInterval(function () {
        var s = computeDepartSpotlight();
        if (!s || !state.spotlightEl) return;
        state.spotlightEl.style.left = s.x + 'px';
        state.spotlightEl.style.top = s.y + 'px';
        state.spotlightEl.style.width = s.w + 'px';
        state.spotlightEl.style.height = s.h + 'px';
      }, 250);
    } else {
      // 출발 버튼을 못 찾으면 일반 백드롭만
      var bd = el('div', 'tut-backdrop tut-light');
      root().insertBefore(bd, coach);
      state.backdropEl = bd;
    }
    // 진행은 폴링이 G.state==='travel' 또는 'explore' 감지
  }

  function renderStep3_Explore() {
    clearOverlay();
    var coach = el('div', 'tut-coach');
    coach.innerHTML =
      '<div class="tut-step-label">STEP 4 / 5</div>' +
      '<div class="tut-msg">' +
        '<strong>⬅ ➡ 버튼</strong>으로 이동하고 <strong>💎 채집 버튼</strong>으로 샘플을 모으세요.<br>' +
        '5개 모으면 <strong>⛽ 연료 보급</strong> 가능!' +
      '</div>' +
      '<div class="tut-mini-actions">' +
        '<button class="tut-skip-link" data-tut-act="skip">건너뛰기</button>' +
      '</div>';
    root().appendChild(coach);
    state.coachEl = coach;
    coach.addEventListener('click', function (ev) {
      if (ev.target && ev.target.getAttribute('data-tut-act') === 'skip') endTutorial(true);
    });
    // 진행은 폴링이 G.samples 증가 감지
  }

  function renderStep4_Quiz() {
    clearOverlay();
    var card = el('div', 'tut-card');
    card.innerHTML =
      '<h2>🏅 마지막 팁!</h2>' +
      '<div class="tut-body">' +
        '❓ <strong>퀴즈를 모두 맞히면</strong> 🏅 배지를 받습니다.<br>' +
        '🔧 강화로 로켓을 업그레이드해서 <strong>더 멀리</strong> 갈 수 있어요!<br><br>' +
        '준비됐다면 본격 탐험을 시작해볼까요?' +
      '</div>' +
      '<div class="tut-actions">' +
        '<button class="tut-btn tut-btn-primary" data-tut-act="done">완료</button>' +
      '</div>';
    root().appendChild(card);
    state.cardEl = card;

    card.addEventListener('click', function (ev) {
      var t = ev.target;
      if (!t || !t.getAttribute) return;
      if (t.getAttribute('data-tut-act') === 'done') endTutorial(true);
    });
  }

  // ---------- 출발 버튼 위치 계산 ----------
  function computeDepartSpotlight() {
    var info = document.getElementById('planet-info');
    if (!info || info.style.display === 'none') return null;
    // planet-info 안에서 "출발"이 들어간 .btn 찾기
    var btns = info.querySelectorAll('button.btn, .btn');
    var target = null;
    for (var i = 0; i < btns.length; i++) {
      var txt = (btns[i].textContent || '').trim();
      if (txt.indexOf('출발') !== -1) {
        target = btns[i];
        break;
      }
    }
    if (!target) target = btns[0]; // fallback
    if (!target) return null;
    var r = target.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return null;
    var pad = 14;
    var size = Math.max(r.width, r.height) + pad * 2;
    var cx = r.left + r.width / 2;
    var cy = r.top + r.height / 2;
    return {
      x: cx - size / 2,
      y: cy - size / 2,
      w: size,
      h: size
    };
  }

  // ---------- 단계 진행 ----------
  function gotoStep(n) {
    state.step = n;
    if (n === 0) renderStep0_Welcome();
    else if (n === 1) renderStep1_ClickPlanet();
    else if (n === 2) renderStep2_Depart();
    else if (n === 3) {
      // step 3 진입 시 채집 기준점 저장
      state.initialSamples = (window.G && typeof window.G.samples === 'number') ? window.G.samples : 0;
      renderStep3_Explore();
    }
    else if (n === 4) renderStep4_Quiz();
  }

  // ---------- 폴링 (DOM/상태 감지) ----------
  function tick() {
    if (!state.started) return;
    var G = window.G;

    // step 1 -> 2: planet-info 패널이 표시되면
    if (state.step === 1) {
      var pi = document.getElementById('planet-info');
      if (pi && pi.style.display !== 'none' && pi.offsetParent !== null) {
        gotoStep(2);
      }
      return;
    }

    // step 2 -> 3: G.state === 'travel' 또는 'explore'
    if (state.step === 2) {
      if (G && (G.state === 'travel' || G.state === 'explore')) {
        gotoStep(3);
      }
      // planet-info가 닫혔는데 travel도 아니면 step 1로 회귀
      var pi2 = document.getElementById('planet-info');
      if ((!pi2 || pi2.style.display === 'none') && G && G.state === 'map') {
        gotoStep(1);
      }
      return;
    }

    // step 3 -> 4: 샘플 1개 이상 채집 성공
    if (state.step === 3) {
      if (G && typeof G.samples === 'number' && G.samples > state.initialSamples) {
        gotoStep(4);
      }
      return;
    }
  }

  function startPolling() {
    stopPolling();
    state.pollTimer = setInterval(tick, POLL_MS);
  }

  function stopPolling() {
    if (state.pollTimer) {
      clearInterval(state.pollTimer);
      state.pollTimer = null;
    }
  }

  // ---------- 시작/종료 ----------
  function startTutorial() {
    ensureRoot();
    state.started = true;
    gotoStep(0);
    startPolling();
  }

  function endTutorial(markDone) {
    state.started = false;
    state.step = 0;
    stopPolling();
    clearOverlay();
    if (markDone) {
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) { /* noop */ }
    }
  }

  // ---------- 도움말 버튼 ----------
  function ensureHelpBtn() {
    if (document.getElementById(HELP_BTN_ID)) return;
    var btn = el('button', null, '?');
    btn.id = HELP_BTN_ID;
    btn.type = 'button';
    btn.setAttribute('aria-label', '튜토리얼 다시 보기');
    btn.title = '튜토리얼 다시 보기';
    btn.addEventListener('click', function () {
      // 진행 중이면 무시 — 토글 X (요구사항: 언제든 재실행)
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* noop */ }
      startTutorial();
    });
    root().appendChild(btn);
  }

  function ensureRoot() {
    var r = document.getElementById(ROOT_ID);
    if (!r) {
      r = document.createElement('div');
      r.id = ROOT_ID;
      document.body.appendChild(r);
    }
    ensureHelpBtn();
  }

  // ---------- 초기화 ----------
  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
      return;
    }
    ensureRoot();
    var done = false;
    try { done = localStorage.getItem(STORAGE_KEY) === '1'; } catch (e) { done = false; }
    if (!done) {
      // 첫 방문자 — 자동 시작
      startTutorial();
    }
  }

  // ---------- 공개 API ----------
  globalThis.SpaceTutorial = {
    init: init,
    start: startTutorial,
    end: function () { endTutorial(true); }
  };

  // 자동 부트 (스크립트 로드 시점)
  init();
})();
