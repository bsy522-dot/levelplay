/* ================================================================
   tree_home.js — 과목 트리 홈 (2026-10-24)

   병석님: "전체 과목 화면 → 수학·영어 등 → 만화·영상·퀴즈·방법·역사 등 → 세분화.
            첫 화면은 과목만, 쓸데없이 큰 아이콘·글자 가득한 화면은 안 끌린다. 태블릿을 많이 쓴다."
   시안: https://claude.ai/artifact/PqMwinNmKH2TR2WuLkqSVh

   옆에 짓기: 켜졌을 때만 홈(p0) 자리에 트리를 그리고, 옛 홈 내용은 숨기기만 한다(지우지 않음).
     1025 기본 켜짐(병석님 "똑같은데?" — 설치 앱에선 주소를 칠 수 없어 ?ui=tree 로는 못 켰다).
     끄기 = '나' 화면의 '예전 화면' 또는 ?ui=old (기기에 기억) · 다시 켜기 = 옛 화면 '나'의 '새 화면' 또는 ?ui=tree
   새 데이터·새 재생기를 만들지 않는다 — 색인은 ia_hub.js 의 lpIndex(), 항목 열기는 lpOpenItem(i),
   퀴즈는 renderQuiz(), 뒤로가기는 nav_route.js 의 lpHandleBack 앞에 트리 한 층만 끼운다.
   ================================================================ */
(function () {
  'use strict';
  var KEY = 'lp_ui';
  try {
    var m = /[?&]ui=(tree|old)\b/.exec(location.search);
    if (m) localStorage.setItem(KEY, m[1]);
  } catch (e) {}
  function enabled() { try { return localStorage.getItem(KEY) !== 'old'; } catch (e) { return true; } }
  if (!enabled()) {   /* 꺼 둔 기기: 옛 화면 그대로, '나' 맨 위에 '새 화면' 단추 하나만 */
    var addOn = function () {
      var p4 = document.getElementById('p4'); if (!p4 || document.getElementById('lpTreeOn')) return;
      var bt = document.createElement('button'); bt.id = 'lpTreeOn'; bt.type = 'button';
      bt.style.cssText = 'display:block;width:100%;min-height:52px;margin:0 0 12px;border:0;border-radius:14px;background:var(--p);color:#fff;font:inherit;font-size:16px;font-weight:700;cursor:pointer';
      bt.textContent = '새 화면으로 (과목부터 고르기)';
      bt.onclick = function () { try { localStorage.setItem(KEY, 'tree'); } catch (e) {} location.replace(location.pathname); };
      p4.insertBefore(bt, p4.firstChild);
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addOn); else addOn();
    return;
  }

  /* ---- 종류: 보여 주는 순서 = 아이가 끌리는 순서 ---- */
  var KINDS = [
    { k: 'comic',  nm: '만화',   sym: 'i-comic' },
    { k: 'video',  nm: '영상',   sym: 'i-video' },
    { k: 'quiz',   nm: '퀴즈',   sym: 'i-question' },
    { k: 'game',   nm: '게임',   sym: 'i-puzzle' },
    { k: 'sim',    nm: '실험',   sym: 'i-atom' },
    { k: 'lesson', nm: '배우기', sym: 'i-book' },
    { k: 'story',  nm: '이야기', sym: 'i-scroll' }
  ];
  var KB = {}; KINDS.forEach(function (k) { KB[k.k] = k; });
  var MAIN_ONLY = { game: 1, sim: 1 };   /* 게임·실험은 주 과목에만(복싱이 과학에 뜨던 것) */

  var T = { st: [{ lvl: 0 }], q: '' };     /* 트리 안 위치 스택 */
  var TH = null;                           /* 만화 표지 표(data/comic_thumbs.json) */

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function ico(id) { return '<svg class="ico" aria-hidden="true" focusable="false"><use href="#' + id + '"/></svg>'; }
  function el(id) { return document.getElementById(id); }
  function curPanel() { var on = document.querySelector('.pg.on'); var m2 = on && /^p(\d+)$/.exec(on.id); return m2 ? +m2[1] : 0; }

  /* ---- 단원 이름 다듬기: '수학-덧뺄셈' → '덧뺄셈', 이모지·괄호 꼬리 떼기 ---- */
  function cleanUnit(u) {
    u = String(u || '').replace(/[\u{1F000}-\u{1FFFF}☀-➿️]/gu, '').trim();
    u = u.replace(/\s*\((만화·소설|고조선[^)]*)\)?$/, '').trim();
    u = u.replace(/^(수학|과학|한국사|음악|상식|영어|국어|세계사|체육|미술|코딩|지리)-/, '');
    u = u.replace(/^[①-⑳]\s*/, '');   /* '① 수와 연산' → '수와 연산' (나이 거르기로 ③이 빠지면 번호가 듬성듬성) */
    return NICE[u] || u || '모음';
  }
  var NICE = { '덧뺄셈': '덧셈·뺄셈', '곱나눗': '곱셈·나눗셈', '분수소수': '분수·소수', '수학': '수학 상식', '과학': '과학 상식', '과학상식': '과학 상식', '역사': '역사 상식', '음악': '음악 상식' };
  /* 게임은 앱의 표시 이름으로('노래방 v4 ✨' → '노래방') */
  function title(it) { if (it.kind === 'game' && typeof window.gameVN === 'function') { try { return window.gameVN(it.g || it.t); } catch (e) {} } return it.t; }

  /* ---- 나이에 맞는가: 옛 학습·퀴즈 화면과 같은 규칙 ---- */
  function tierNow() { try { return typeof lpTier === 'function' ? lpTier() : 'elementary'; } catch (e) { return 'elementary'; } }
  function fitsTier(it) {
    var t = tierNow();
    if (it.kind === 'quiz' && it.q) {   /* T-01: 유아 전용 문항·어려운 주제(lpTierQuizPool 과 같은 규칙, 한 문제씩) */
      if (t !== 'toddler' && it.q.tier === 'toddler') return false;
      try { if (t === 'elementary' && typeof LP_HARD_TOPICS !== 'undefined' && LP_HARD_TOPICS.test((it.q.q || '') + ' ' + (it.q.cat || ''))) return false; } catch (e) {}
      return true;
    }
    if (it.ck && typeof it.ui === 'number' && typeof lpLessonFitsTier === 'function') {   /* T-04: 초등에 이차함수 등 */
      try { var L = CURRICULUM[it.ck].units[it.ui].lessons[it.li]; if (L && !lpLessonFitsTier(L)) return false; } catch (e) {}
    }
    /* T-05: 초등엔 제목 앞부분('|'·'(' 앞)에 한글이 없는 영상(영어 강의에 한글 꼬리표만 붙은 것) 빼기 */
    if (it.kind === 'video' && (t === 'elementary' || t === 'toddler') && !/[가-힣]/.test(String(it.t || '').split(/[|(]/)[0])) return false;
    return true;
  }

  /* ---- 색인 → 과목 › 종류 › 단원 › 항목 ---- */
  function tree() {
    var X = window.lpIndex ? window.lpIndex() : null, S = window.lpSubjects || [], order = window.lpHomeOrder || S.map(function (s) { return s.k; });
    if (!X) return [];
    var fits = (typeof window.lpTierFits === 'function') ? window.lpTierFits : null;
    var by = {};
    X.items.forEach(function (it) {
      if (it.dup || !KB[it.kind]) return;
      if (it.tile) return;   /* T-02: 커리큘럼 마스터 주제는 늦게 실리고 일부는 안 열린다 → 트리에선 뺀다 */
      if (!fitsTier(it)) return;
      /* 나이 거르개는 제목용(한글 없는 제목 숨김) — 퀴즈 문제('3 × 7 = ?')엔 쓰지 않는다 */
      if (fits && it.kind !== 'quiz') { try { if (!fits(String(it.t || ''), String(it.d || ''))) return; } catch (e) {} }
      var subs = [it.s].concat(MAIN_ONLY[it.kind] ? [] : (it.also || []));
      subs.forEach(function (s) {
        var a = by[s] = by[s] || {}, k = a[it.kind] = a[it.kind] || { n: 0, units: {}, uo: [] };
        var uname = MAIN_ONLY[it.kind] ? '모음' : cleanUnit(it.unit || it.d || '');   /* 게임·실험의 d 는 설명글 → 한 묶음 */
        if (!k.units[uname]) { k.units[uname] = []; k.uo.push(uname); }
        REF[it.i] = { kind: it.kind, t: it.t };
        k.units[uname].push(it); k.n++;
      });
    });
    var SB = {}; S.forEach(function (s) { SB[s.k] = s; });
    return order.filter(function (k) { return SB[k] && by[k]; }).map(function (k) {
      var s = SB[k], a = by[k], total = 0;
      var kinds = KINDS.filter(function (kd) { return a[kd.k]; }).map(function (kd) {
        var src = a[kd.k];
        var units = src.uo.map(function (u) { return { nm: u, items: src.units[u] }; });
        if (kd.k !== 'lesson') units.sort(function (x, y) { return y.items.length - x.items.length; });
        total += src.n;
        return { k: kd.k, nm: kd.nm, sym: kd.sym, n: src.n, units: units };
      });
      return { k: k, nm: s.nm, ac: s.ac, sym: s.sym, total: total, kinds: kinds };
    });
  }
  var DATA = [], DATA_STAMP = '', REF = {};   /* REF[i] = 그릴 때의 {kind,t} — 누를 때 같은 항목인지 확인 */
  function data() {
    var X = window.lpIndex ? window.lpIndex() : null, st = X ? String(X.items.length) + '|' + tierNow() : '';
    if (!DATA.length || st !== DATA_STAMP) { REF = {}; DATA = tree(); DATA_STAMP = st; }
    return DATA;
  }
  function S(k) { var d = data(); for (var i = 0; i < d.length; i++) if (d[i].k === k) return d[i]; return null; }

  /* ---- 그림 ---- */
  function thumbOf(it) {
    if (it.kind === 'video' && it.v && it.v.id) return 'https://img.youtube.com/vi/' + encodeURIComponent(it.v.id) + '/mqdefault.jpg';
    if ((it.kind === 'game') && it.g && it.g.th) return 'assets/thumbs/' + it.g.th + '.jpg';
    if (it.th) {
      if (TH) for (var key in TH) { if (it.th.indexOf(key) === 0 && TH[key] && TH[key].thumb) return TH[key].thumb; }
      return it.th;
    }
    return '';
  }
  function img(src, cls) { return src ? '<img class="' + (cls || '') + '" src="' + esc(src) + '" loading="lazy" alt="" onerror="lpTreeImgErr(this)">' : ''; }
  /* 그림을 못 읽으면(매스 배틀러 썸네일 없음) 같은 자리에 색 칸만 남긴다 */
  window.lpTreeImgErr = function (im) { var s = document.createElement('span'); s.className = 'lt-noimg'; try { im.replaceWith(s); } catch (e) { im.remove(); } };

  function preview(kd) {
    var all = [].concat.apply([], kd.units.map(function (u) { return u.items; }));
    if (kd.k === 'comic' || kd.k === 'story' || kd.k === 'game') {
      var th = all.map(thumbOf).filter(Boolean).slice(0, 3);
      if (th.length) return '<div class="lt-thumbs">' + th.map(function (s) { return img(s); }).join('') + '</div>';
    }
    if (kd.k === 'video' && all[0]) return '<div class="lt-vid">' + img(thumbOf(all[0])) + '<span class="lt-pl">' + ico('i-playarrow') + '</span></div>';
    if (kd.k === 'quiz') {
      var q = all.filter(function (i) { return String(i.t).length <= 16; })[0] || all[0];
      return '<div class="lt-flash">' + esc(q ? q.t : '') + '</div>';
    }
    if (kd.units.length > 1) return '<div class="lt-chips">' + kd.units.slice(0, 5).map(function (u) { return '<i>' + esc(u.nm) + '</i>'; }).join('') + '</div>';
    return '<div class="lt-chips">' + all.slice(0, 4).map(function (i) { return '<i>' + esc(title(i)) + '</i>'; }).join('') + '</div>';
  }

  /* ---- 위 막대: 처음엔 이름·찾기, 안쪽에선 ← + 지나온 길 ---- */
  function bar() {
    var cur = T.st[T.st.length - 1];
    if (cur.lvl === 0) {
      return '<span class="lt-brand">배움퀘스트</span><span class="lt-sp"></span>' +
        '<button class="lt-ib" onclick="lpTree.search()" aria-label="찾기">' + ico('i-search') + '</button>';
    }
    if (cur.lvl === 9) {
      return '<button class="lt-back" onclick="lpTree.back()" aria-label="뒤로">←</button>' +
        '<input id="ltQ" class="lt-q" type="search" placeholder="찾기" value="' + esc(T.q) + '" oninput="lpTree.find(this.value)" autocomplete="off">';
    }
    var s = S(cur.s), kd = cur.k ? kindOf(s, cur.k) : null;
    var at = function (l) { for (var i = 0; i < T.st.length; i++) if (T.st[i].lvl === l) return i; return -1; };
    var crumb = function (label, l) { return (l === cur.lvl || at(l) < 0) ? '<b>' + esc(label) + '</b>' : '<a onclick="lpTree.to(' + at(l) + ')">' + esc(label) + '</a>'; };
    var parts = ['<a onclick="lpTree.to(0)">전체</a>', crumb(s.nm, 1)];
    if (kd) parts.push(crumb(kd.nm, at(2) >= 0 ? 2 : cur.lvl));
    if (cur.lvl === 3 && kd && kd.units.length > 1) parts.push('<b>' + esc(kd.units[cur.u].nm) + '</b>');
    return '<button class="lt-back" onclick="lpTree.back()" aria-label="뒤로">←</button><div class="lt-crumb">' +
      parts.join('<span class="lt-sep">›</span>') + '</div>';
  }
  function kindOf(s, k) { for (var i = 0; i < s.kinds.length; i++) if (s.kinds[i].k === k) return s.kinds[i]; return null; }

  function tileStyle(s) { return ' style="--c:' + s.ac + '"'; }
  function render() {
    var root = el('lpTree'); if (!root) return;
    var cur = T.st[T.st.length - 1], h = '';
    if (cur.lvl === 0) {
      h = '<div class="lt-grid lt-g0">' + data().map(function (s) {
        return '<button class="lt-tile lt-subj"' + tileStyle(s) + ' onclick="lpTree.open(\'' + s.k + '\')">' +
          '<span class="lt-deco">' + ico(s.sym) + '</span>' +
          '<span class="lt-row"><span class="lt-chip">' + ico(s.sym) + '</span><span><span class="lt-nm">' + esc(s.nm) + '</span><span class="lt-n">' + s.total + '개</span></span></span>' +
          '<span class="lt-kinds">' + s.kinds.map(function (kd) { return '<span title="' + kd.nm + '">' + ico(kd.sym) + '</span>'; }).join('') + '</span></button>';
      }).join('') + '</div>';
    } else if (cur.lvl === 9) {
      h = findHtml();
    } else {
      var s = S(cur.s);
      if (!s) { T.st = [{ lvl: 0 }]; return render(); }
      if (cur.lvl === 1) {
        h = '<div class="lt-grid lt-g1">' + s.kinds.map(function (kd) {
          return '<button class="lt-tile lt-kind"' + tileStyle(s) + ' onclick="lpTree.kind(\'' + kd.k + '\')">' +
            '<span class="lt-row"><span class="lt-chip">' + ico(kd.sym) + '</span><span><span class="lt-nm">' + kd.nm + '</span><span class="lt-n">' + kd.n + '개</span></span></span>' +
            preview(kd) + '</button>';
        }).join('') + '</div>';
      } else {
        var kd = kindOf(s, cur.k);
        if (!kd) { T.st = T.st.slice(0, 2); return render(); }
        if (cur.lvl === 2) {
          var mix = kd.k === 'quiz' ? '<button class="lt-mix"' + tileStyle(s) + ' onclick="lpTree.quiz(-1)">' + ico('i-playarrow') + ' 섞어서 ' + QN + '문제</button>' : '';
          h = mix + '<div class="lt-grid lt-g2">' + kd.units.map(function (u, i) {
            var act = kd.k === 'quiz' ? 'lpTree.quiz(' + i + ')' : 'lpTree.unit(' + i + ')';
            return '<button class="lt-tile lt-unit"' + tileStyle(s) + ' onclick="' + act + '">' +
              '<span class="lt-row"><span class="lt-chip">' + ico(kd.sym) + '</span><span style="min-width:0"><span class="lt-nm">' + esc(u.nm) + '</span><span class="lt-n">' + u.items.length + '개</span></span></span>' +
              (kd.k === 'quiz' ? '' : '<span class="lt-prev">' + esc(u.items[0] ? u.items[0].t : '') + '</span>') + '</button>';
          }).join('') + '</div>';
        } else {
          var u = kd.units[cur.u] || kd.units[0];
          if (kd.k === 'quiz') {
            h = '<button class="lt-mix"' + tileStyle(s) + ' onclick="lpTree.quiz(' + (cur.u || 0) + ')">' + ico('i-playarrow') + ' 풀기 (' + Math.min(QN, u.items.length) + '문제)</button>';
          } else {
            var pic = { comic: 1, story: 1, video: 1, game: 1 }[kd.k];
            h = '<div class="lt-grid ' + (pic ? 'lt-g3p' : 'lt-g3') + '">' + u.items.map(function (it) {
              var th = pic ? thumbOf(it) : '';
              return pic
                ? '<button class="lt-tile lt-ep"' + tileStyle(s) + ' onclick="lpTree.item(' + it.i + ')">' + (th ? img(th) : '<span class="lt-noimg">' + ico(kd.sym) + '</span>') + '<span class="lt-nm">' + esc(title(it)) + '</span></button>'
                : '<button class="lt-tile lt-item"' + tileStyle(s) + ' onclick="lpTree.item(' + it.i + ')"><span class="lt-dot">' + ico(kd.sym) + '</span><span class="lt-nm">' + esc(title(it)) + '</span></button>';
            }).join('') + '</div>';
          }
        }
      }
    }
    el('lpTreeBar').innerHTML = bar();
    el('lpTreeBody').innerHTML = h;
  }

  /* ---- 찾기: 모든 과목 제목에서 ---- */
  function findHtml() {
    var q = T.q.trim();
    if (!q) return '<div class="lt-empty">' + ico('i-search') + '</div>';
    var out = [], seen = {};
    data().forEach(function (s) {
      s.kinds.forEach(function (kd) {
        kd.units.forEach(function (u) {
          u.items.forEach(function (it) {
            if (out.length >= 60 || seen[it.i] || String(it.t).indexOf(q) < 0) return;
            seen[it.i] = 1; out.push({ s: s, kd: kd, it: it });
          });
        });
      });
    });
    if (!out.length) return '<div class="lt-empty">없어요</div>';
    return '<div class="lt-grid lt-g3">' + out.map(function (o) {
      return '<button class="lt-tile lt-item" style="--c:' + o.s.ac + '" onclick="lpTree.item(' + o.it.i + ')"><span class="lt-dot">' + ico(o.kd.sym) + '</span><span class="lt-nm">' + esc(title(o.it)) + '</span><span class="lt-n">' + esc(o.s.nm) + '·' + o.kd.nm + '</span></button>';
    }).join('') + '</div>';
  }

  /* ---- 퀴즈: 기존 renderQuiz 로 한 판(최대 10문제) ---- */
  var QN = 5;   /* renderQuiz 가 한 판을 5문제로 자른다(index.html renderQuiz) — 라벨도 같게 */
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function runQuiz(ui) {
    var cur = T.st[T.st.length - 1], s = S(cur.s), kd = s && kindOf(s, 'quiz'); if (!kd) return;
    var pool = ui < 0 ? [].concat.apply([], kd.units.map(function (u) { return u.items; })) : (kd.units[ui] || kd.units[0]).items;
    var qs = shuffle(pool).slice(0, QN).map(function (it) { return it.q; }).filter(Boolean);
    var b = el('moB'); if (!b || !qs.length || typeof renderQuiz !== 'function') { try { toast('지금은 열 수 없어요'); } catch (e) {} return; }
    var title = s.nm + (ui < 0 ? ' 퀴즈' : ' · ' + kd.units[ui].nm);
    b.innerHTML = '<div style="font-size:15px;font-weight:700;margin-bottom:8px">' + esc(title) + '</div><div id="lpTreeQz"></div>';
    el('mo').classList.add('sh');
    setTimeout(function () { var a = el('lpTreeQz'); if (a) renderQuiz(a, qs); }, 40);
  }

  function push(o) { T.st.push(o); render(); var p0 = el('p0'); if (p0) p0.scrollTop = 0; }
  window.lpTree = {
    open: function (k) { push({ lvl: 1, s: k }); },
    kind: function (k) {
      var cur = T.st[T.st.length - 1], s = S(cur.s), kd = s && kindOf(s, k); if (!kd) return;
      if (kd.units.length === 1) push({ lvl: 3, s: s.k, k: k, u: 0 }); else push({ lvl: 2, s: s.k, k: k });
    },
    unit: function (i) { var cur = T.st[T.st.length - 1]; push({ lvl: 3, s: cur.s, k: cur.k, u: i }); },
    item: function (i) {
      var want = REF[i], X = window.lpIndex ? window.lpIndex() : null, it = X && X.items[i];
      if (want && (!it || it.kind !== want.kind || it.t !== want.t)) {   /* T-03: 지도 등에 다녀와 색인 번호가 밀린 경우 */
        i = -1; if (X) for (var j = 0; j < X.items.length; j++) { var o = X.items[j]; if (o.kind === want.kind && o.t === want.t && !o.dup) { i = j; break; } }
        if (i < 0) { render(); return; }
      }
      try { window.lpOpenItem(i); } catch (e) { try { toast('지금은 열 수 없어요'); } catch (e2) {} }
    },
    quiz: runQuiz,
    back: function () { if (T.st.length > 1) { T.st.pop(); render(); return true; } return false; },
    to: function (i) { T.st = T.st.slice(0, i + 1); render(); },
    search: function () { T.q = ''; push({ lvl: 9 }); setTimeout(function () { var q = el('ltQ'); if (q) q.focus(); }, 30); },
    find: function (v) { T.q = v; var b = el('lpTreeBody'); if (b) b.innerHTML = findHtml(); },
    off: function () { try { localStorage.setItem(KEY, 'old'); } catch (e) {} location.replace(location.pathname); },
    level: function () { return T.st[T.st.length - 1].lvl; }
  };

  /* ---- 뒤로가기(안드로이드): 창·게임이 떠 있으면 원래대로, 홈 트리 안쪽이면 한 층 위로 ---- */
  function overlayOpen() {
    var o = el('gO'); if (o && o.classList.contains('sh')) return true;
    o = el('mo'); if (o && o.classList.contains('sh')) return true;
    o = el('battleOverlay'); if (o && o.style.display === 'flex') return true;
    o = el('onboardOverlay'); if (o && o.style.display === 'flex') return true;
    return !!document.querySelector('.v7-vidquiz-overlay');
  }
  function hookBack() {
    var prev = window.lpHandleBack;
    window.lpHandleBack = function () {
      if (!overlayOpen() && curPanel() === 0 && T.st.length > 1) { T.st.pop(); render(); return true; }
      return typeof prev === 'function' ? prev() : false;
    };
  }

  /* ---- 나 화면: 지도·친구 자리 + 예전 화면으로 ---- */
  function mountMe() {
    var p4 = el('p4'); if (!p4 || el('lpTreeMe')) return;
    var d = document.createElement('div'); d.id = 'lpTreeMe'; d.className = 'lt-me';
    d.innerHTML = '<button class="lt-tile lt-meb" onclick="go(6)">' + ico('i-map') + '<span>지도</span></button>' +
      '<button class="lt-tile lt-meb" onclick="go(3)">' + ico('i-chat') + '<span>친구</span></button>' +
      '<button class="lt-tile lt-meb lt-old" onclick="lpTree.off()">' + ico('i-repeat') + '<span>예전 화면</span></button>';
    p4.insertBefore(d, p4.firstChild);
  }

  /* ---- 모양: 앱 색 변수(--bg --c1 --c2 --tx --t2 --p) 그대로 → 밝은·어두운 화면 둘 다 ---- */
  var CSS = [
    'html.lp-tree #p0>:not(#lpTree){display:none!important}',
    'html.lp-tree .v7-onboard{display:none!important}',   /* 옛 홈용 '관심 과목 3개' 창 — 트리 홈에선 모든 과목이 첫 화면 */
    'html.lp-tree nav button[role=tab]:nth-of-type(2),html.lp-tree nav button[role=tab]:nth-of-type(3){display:none!important}',
    '#lpTree{display:flex;flex-direction:column;gap:14px;word-break:keep-all;padding-bottom:96px}',
    '.lt-tile,.lt-mix{--cc:var(--c)}',
    ':root.dark .lt-tile,:root.dark .lt-mix{--cc:color-mix(in srgb,var(--c) 55%,#fff)}',
    ':where(#lpTree) .ico{width:20px;height:20px}',   /* id 무게를 빼야 아래 칸별 크기가 먹는다 */
    '.lt-bar{display:flex;align-items:center;gap:8px;min-height:44px;position:sticky;top:0;z-index:5;background:var(--bg);padding:4px 0}',
    '.lt-brand{font-size:20px;font-weight:900;background:var(--g1);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}',
    '.lt-sp{flex:1}',
    '.lt-ib,.lt-back{width:44px;height:44px;border-radius:12px;border:1px solid var(--c2);background:var(--c1);color:var(--tx);display:grid;place-items:center;font-size:20px;cursor:pointer;flex:none}',
    '.lt-crumb{display:flex;align-items:center;gap:6px;min-width:0;flex:1;font-size:16px;color:var(--t2);white-space:nowrap;overflow:hidden}',
    '.lt-crumb b{color:var(--tx);overflow:hidden;text-overflow:ellipsis}',
    '.lt-crumb a{color:var(--t2);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;min-height:44px;min-width:44px;padding:0 6px}',
    '.lt-sep{opacity:.5}',
    '.lt-q{flex:1;min-width:0;height:44px;border-radius:12px;border:1px solid var(--c2);background:var(--c1);color:var(--tx);padding:0 14px;font:inherit;font-size:16px}',
    '.lt-grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(var(--min,160px),1fr))}',
    '.lt-g0{--min:200px}.lt-g1{--min:230px}.lt-g2{--min:190px}.lt-g3{--min:260px}.lt-g3p{--min:160px}',
    '@media (max-width:420px){.lt-g0{--min:150px}.lt-g1{--min:150px}.lt-g2{--min:150px}.lt-g3p{--min:140px}.lt-g3{--min:100%}}',
    '.lt-tile{position:relative;overflow:hidden;background:var(--c1);border:1px solid var(--c2);border-radius:16px;padding:14px;display:flex;flex-direction:column;gap:10px;text-align:left;font:inherit;color:var(--tx);cursor:pointer;min-width:0}',
    '.lt-tile:active{transform:scale(.98)}',
    '.lt-tile:focus-visible{outline:3px solid var(--c,var(--p));outline-offset:2px}',
    '.lt-row{display:flex;align-items:center;gap:10px;min-width:0}',
    '.lt-row>span:last-child{display:flex;flex-direction:column;min-width:0}',
    '.lt-chip{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:color-mix(in srgb,var(--c) 13%,var(--c1));color:var(--cc);flex:none}',
    '.lt-chip .ico{width:22px;height:22px}',
    '.lt-nm{font-size:17px;font-weight:700;line-height:1.3;overflow:hidden;text-overflow:ellipsis}',
    '.lt-n{font-size:12px;color:var(--t2)}',
    '.lt-subj{background:color-mix(in srgb,var(--c) 11%,var(--c1));border-color:color-mix(in srgb,var(--c) 22%,var(--c1));min-height:124px;justify-content:space-between}',
    '.lt-subj .lt-chip{background:var(--c1)}',
    '.lt-deco{position:absolute;right:-14px;bottom:-18px;width:96px;height:96px;color:var(--cc);opacity:.1;pointer-events:none}',
    '.lt-deco .ico{width:96px;height:96px}',
    '.lt-kinds{display:flex;flex-wrap:wrap;gap:6px;position:relative}',
    '.lt-kinds span{width:26px;height:26px;border-radius:8px;background:var(--c1);color:var(--cc);display:grid;place-items:center}',
    '.lt-kinds .ico{width:15px;height:15px}',
    '.lt-kind{min-height:170px}',
    '.lt-thumbs{display:flex;gap:6px}',
    '.lt-thumbs img{width:32%;aspect-ratio:3/4;object-fit:cover;border-radius:8px;border:1px solid var(--c2)}',
    '.lt-vid{position:relative;border-radius:12px;overflow:hidden;background:color-mix(in srgb,var(--c) 10%,var(--c1));aspect-ratio:16/8}',
    '.lt-vid img{width:100%;height:100%;object-fit:cover;display:block}',
    '.lt-pl{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:44px;height:44px;border-radius:50%;background:var(--c);color:#fff;display:grid;place-items:center}',
    '.lt-flash{flex:1;min-height:80px;display:grid;place-items:center;border-radius:12px;background:color-mix(in srgb,var(--c) 9%,var(--c1));color:var(--cc);font-size:22px;font-weight:800;text-align:center;padding:10px;line-height:1.25}',
    '.lt-chips{display:flex;flex-wrap:wrap;gap:6px}',
    '.lt-chips i{font-style:normal;font-size:13px;padding:4px 10px;border-radius:999px;background:color-mix(in srgb,var(--c) 10%,var(--c1));max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '.lt-prev{font-size:13px;color:var(--t2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.lt-mix{margin-bottom:12px;display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:56px;border:0;border-radius:14px;background:var(--c);color:#fff;font:inherit;font-size:17px;font-weight:700;cursor:pointer}',
    '.lt-mix .ico{width:22px;height:22px}',
    '.lt-ep{padding:10px;gap:8px;min-height:56px}',
    '.lt-thumbs .lt-noimg{width:32%;aspect-ratio:3/4;border-radius:8px}',
    '.lt-ep img,.lt-noimg{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:10px;display:grid;place-items:center;background:color-mix(in srgb,var(--c) 10%,var(--c1));color:var(--cc)}',
    '.lt-ep .lt-nm{font-size:14px;font-weight:600;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;white-space:normal}',
    '.lt-item{flex-direction:row;align-items:center;gap:10px;padding:12px 14px;min-height:56px}',
    '.lt-item .lt-nm{font-size:15px;font-weight:600;flex:1;white-space:nowrap}',
    '.lt-dot{width:30px;height:30px;border-radius:9px;background:color-mix(in srgb,var(--c) 13%,var(--c1));color:var(--cc);display:grid;place-items:center;flex:none}',
    '.lt-dot .ico{width:16px;height:16px}',
    '.lt-empty{display:grid;place-items:center;min-height:160px;color:var(--t2);font-size:16px}',
    '.lt-empty .ico{width:40px;height:40px}',
    '.lt-me{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}',
    '.lt-meb{flex-direction:row;align-items:center;justify-content:center;gap:8px;min-height:56px;font-size:15px;font-weight:700}',
    '.lt-old{color:var(--t2);font-weight:600}'
  ].join('\n');

  function mount() {
    var p0 = el('p0'); if (!p0 || el('lpTree')) return;
    document.documentElement.classList.add('lp-tree');
    var st = document.createElement('style'); st.id = 'lpTreeCss'; st.textContent = CSS; document.head.appendChild(st);
    var t = document.createElement('div'); t.id = 'lpTree';
    t.innerHTML = '<div class="lt-bar" id="lpTreeBar"></div><div class="lt-body" id="lpTreeBody"></div>';
    p0.insertBefore(t, p0.firstChild);
    mountMe(); hookBack(); render();
    var prevOnGo = window.lpOnGo;   /* 홈으로 돌아올 때(나이를 바꾸고 온 경우 등) 다시 그린다 */
    window.lpOnGo = function (i) { if (typeof prevOnGo === 'function') { try { prevOnGo(i); } catch (e) {} } if (i === 0) render(); };
    try { fetch('data/comic_thumbs.json').then(function (r) { return r.json(); }).then(function (j) { TH = j || {}; render(); }).catch(function () {}); } catch (e) {}
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
