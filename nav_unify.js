/* nav_unify.js — vN_patch가 각자 깔아놓는 하단 고정 스트립을 단일 스트립(#lpUnifiedNav)으로 통합.
   원본 버튼의 리스너/onclick을 보존한 채 appendChild로 이동한다(노드 이동은 이벤트 보존).

   ★버전 하드코딩 금지: v10~v14를 이름으로 나열하면 v15가 추가될 때 메인 5탭이 또 가려진다.
     ①이름 규칙(v\d+nav / v\d+-nav) ②구조 규칙(body 직계 + position:fixed + bottom≈0 + 버튼 3개↑)
     두 가지로 자동 판별하고, MutationObserver로 나중에 붙는 스트립도 계속 흡수한다.

   통합 후 하단 점유가 88px(메인 52 + 통합 36)로 줄므로 관련 요소 위치 오버라이드를 나중에 주입해 이긴다. */
(function(){
  'use strict';

  var POLL_MS = 300, SETTLE_MS = 15000;
  var uni = null, styled = false, started = Date.now();
  var absorbed = 0;          // 흡수한 스트립 수 (구분선 삽입 판단)
  var pending = 0;           // 디바운스 타이머 핸들

  /* ---------- 판별 ---------- */

  function isSelf(el){ return el === uni || (uni && uni.contains(el)); }

  // ①이름 규칙: id="v10Nav"/"v12nav" 또는 class="v13-nav"/"v14-nav"
  function matchesName(el){
    var id = el.id || '';
    var cls = (typeof el.className === 'string') ? el.className : '';
    return /^v\d+nav$/i.test(id) || /(^|\s)v\d+-nav(\s|$)/i.test(cls);
  }

  // ②구조 규칙: 이름이 달라도 화면 바닥을 가로지르는 고정 버튼 바면 흡수
  function matchesShape(el){
    if(el.tagName === 'NAV') return false;              // 메인 5탭은 건드리지 않는다
    var cs = window.getComputedStyle(el);
    if(cs.position !== 'fixed' || cs.display === 'none') return false;
    var bottom = parseFloat(cs.bottom);
    if(!(bottom >= 0 && bottom <= 8)) return false;      // 바닥에 붙은 것만
    var r = el.getBoundingClientRect();
    if(r.height > 72) return false;                      // 얇은 바
    if(r.width < window.innerWidth * 0.8) return false;  // 가로 전폭
    return el.querySelectorAll('button').length >= 3;
  }

  function isStrip(el){
    if(!el || el.nodeType !== 1 || isSelf(el)) return false;
    if(el.dataset && el.dataset.lpAbsorbed === '1') return false;
    return matchesName(el) || matchesShape(el);
  }

  /* ---------- 흡수 ---------- */

  function ensureUni(){
    if(uni && document.body.contains(uni)) return uni;
    uni = document.getElementById('lpUnifiedNav');
    if(!uni){
      uni = document.createElement('div');
      uni.id = 'lpUnifiedNav';
      document.body.appendChild(uni);
    }
    return uni;
  }

  function absorb(){
    if(!document.body) return;
    ensureUni();
    injectStyle();

    var kids = [].slice.call(document.body.children);
    for(var i = 0; i < kids.length; i++){
      var strip = kids[i];
      if(!isStrip(strip)) continue;

      strip.dataset.lpAbsorbed = '1';
      var btns = [].slice.call(strip.querySelectorAll('button'));
      if(btns.length){
        if(absorbed > 0){
          var sep = document.createElement('span');
          sep.className = 'lpuni-sep';
          uni.appendChild(sep);
        }
        absorbed++;
        for(var j = 0; j < btns.length; j++) uni.appendChild(btns[j]); // 노드 이동 → onclick/리스너 보존
      }
      strip.style.display = 'none';
      // 패치가 나중에 display를 되살려도 화면을 덮지 못하게 무력화
      strip.style.pointerEvents = 'none';
      strip.style.visibility = 'hidden';
    }

    // 통합 스트립은 항상 맨 마지막 형제여야 다른 스트립에 덮이지 않는다
    if(uni.nextElementSibling) document.body.appendChild(uni);
  }

  function schedule(){
    if(pending) return;
    pending = setTimeout(function(){ pending = 0; absorb(); }, 60);
  }

  /* ---------- 스타일 ---------- */

  function injectStyle(){
    if(styled || document.getElementById('lpUnifiedNavStyle')) { styled = true; return; }
    styled = true;
    var st = document.createElement('style');
    st.id = 'lpUnifiedNavStyle';
    st.textContent = [
      /* 통합 스트립 — 기존 v13-nav 톤 */
      '#lpUnifiedNav{position:fixed;bottom:var(--nv);left:0;right:0;height:36px;background:rgba(10,10,26,.95);',
      '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border-top:1px solid rgba(139,92,246,.06);',
      'display:flex;align-items:center;overflow-x:auto;overflow-y:hidden;z-index:998;scrollbar-width:none;gap:2px;padding:0 4px;box-sizing:border-box}',
      '#lpUnifiedNav::-webkit-scrollbar{display:none}',
      '#lpUnifiedNav button{flex:0 0 auto;padding:4px 10px;margin:0;height:26px;border:1px solid rgba(139,92,246,.12);border-radius:14px;',
      'background:var(--c2);color:var(--t3);font:10px/1.2 inherit;cursor:pointer;white-space:nowrap;transition:.15s;',
      'display:inline-flex;align-items:center;justify-content:center;flex-direction:row;gap:3px}',
      '#lpUnifiedNav button span{font-size:11px}',
      '#lpUnifiedNav button:hover,#lpUnifiedNav button.on{border-color:var(--cy);color:var(--cy);background:rgba(6,214,160,.08)}',
      '#lpUnifiedNav .lpuni-sep{flex:0 0 auto;width:1px;height:20px;align-self:center;background:rgba(139,92,246,.25);margin:0 4px}',
      /* 하단 점유 축소(88px)에 맞춘 위치 복원 오버라이드 — 나중에 주입되어 패치 CSS를 이김 */
      '.pg{padding-bottom:calc(var(--nv) + 50px)}',
      '.fab{bottom:calc(var(--nv) + 50px)}',
      '.tutor-fab{bottom:calc(var(--nv) + 106px)}',
      '.tutor-panel{bottom:calc(var(--nv) + 160px)}',
      '.v3-sound-toggle{bottom:calc(var(--nv,52px) + 50px)}',
      '.v4-progress-ring{bottom:calc(var(--nv,52px) + 100px)}',
      '.v3-timer{bottom:calc(var(--nv,52px) + 106px)}'
    ].join('');
    (document.head || document.documentElement).appendChild(st);
  }

  /* ---------- 기동 ---------- */

  function boot(){
    absorb();

    // defer 스크립트가 순차 실행되며 스트립을 늦게 만든다 → 붙는 즉시 흡수
    if(window.MutationObserver){
      new MutationObserver(schedule).observe(document.body, {childList:true});
    }

    // MutationObserver가 없거나 스타일만 나중에 바뀌는 경우 대비한 안전망
    (function poll(){
      absorb();
      if(Date.now() - started < SETTLE_MS) setTimeout(poll, POLL_MS);
    })();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
