/*! hub-back.js v1.0.3 — 폰 뒤로가기(◁)가 앱 '안'에서 한 단계씩 되돌아가게 하는 공용 부품 (PRIME UI · 2026-09-14)
 *
 * 왜 필요한가
 *   안드로이드 뒤로가기 키는 브라우저 히스토리를 한 칸 되돌린다. 탭·바텀시트·상세 화면을 JS 로만
 *   바꾸는 앱은 히스토리에 아무것도 남기지 않아서, 키를 누르면 앱 창 자체가 닫혀 버린다(→ 원허브).
 *   이 부품은 화면을 열 때 가짜 칸을 하나 쌓아 두고, 뒤로가기가 오면 그 화면을 닫는 함수를 대신 불러 준다.
 *
 * 쓰는 법 (세 줄이면 끝)
 *   페이지에 script 태그로 넣는다: src="/static/vendor/hub-back.js"  (본문에 인라인으로 심어도 됨 — 이 주석에 닫는 script 태그 글자를 쓰지 말 것)
 *   열 때 :  var t = HubBack.push("pin", function(){ closePin(true); });   // 이름 + 닫는 함수 (반환값 = 이 칸의 토큰)
 *   닫을 때: HubBack.pop("pin");   // 앱이 스스로 닫는 경로(닫기 버튼·완료)에서. 비동기(await·타이머) 뒤에 닫는다면 이름 대신 토큰 t 를 넘길 것
 *   탭처럼 한 층만 둘 때:  HubBack.push("tab", goFirstTab, {replace:true});  // 같은 이름이 맨 위면 갈아끼움
 *
 * 규칙
 *   - 스택이 비어 있으면 아무것도 하지 않는다 → 브라우저/앱 창이 평소대로 닫힌다(= 원허브로 복귀).
 *   - 자체 해시 라우팅(location.hash 로 화면 전환)을 이미 쓰는 앱은 화면엔 쓰지 말고 모달에만 쓸 것.
 *   - popstate 로 닫히는 동안 닫기 함수가 pop 을 다시 불러도 무시한다(이중 back 방지). 이미 죽은 칸(토큰)의 pop 도 무시.
 *   - v1.0.1: pop 직후(같은 틱·마이크로태스크) 곧바로 push 가 오면 되돌리기 대신 그 칸을 재활용한다.
 *     크롬은 history.back() 의 목적지를 호출 시점에 고정하므로, 닫자마자 새 화면을 열면 새 칸이 고아가 되고
 *     페이지가 바닥까지 떨어지던 문제(서랍 교체·PIN 뒤 확인창)를 막는다.
 *   - v1.0.2: 새로고침(크롬 당겨서 새로고침) 뒤 남은 가짜 칸 N 개를 history.go(-N) 으로 한 번에 걷어낸다(죽은 ◁ 누름 방지).
 *   - v1.0.3: 맨 위가 아닌 '중간 칸'의 pop(예: React 가 정리 함수를 선언 순서대로 불러 아래 층이 먼저 닫힐 때)은
 *     죽은 표시만 해 두고, 그 위 칸이 닫힐 때(앱이 닫든 ◁로 닫든) 죽은 칸들을 함께 걷어낸다 → 헛눌림 없음.
 */
(function(){
  "use strict";
  if(window.HubBack && window.HubBack.version >= "1.0.3") return;
  var stack = [], inPop = false, silent = 0, pendingBack = 0, timer = null;

  function state(){ return {hubBack: stack.length}; }

  function flush(){
    timer = null;
    if(pendingBack > 0){
      var n = pendingBack; pendingBack = 0; silent = 1;
      try{ history.go(-n); }catch(e){ silent = 0; }
    }
  }
  function scheduleBack(n){
    if(n <= 0) return;
    pendingBack += n;
    if(!timer) timer = setTimeout(flush, 0);
  }

  function push(name, close, opts){
    opts = opts || {};
    var top = stack[stack.length - 1];
    if(opts.replace && top && top.name === name && !top.dead){ top.close = close; return top; }
    var entry = {name: name, close: close, pushed: false, dead: false};
    if(pendingBack > 0){
      /* 방금 닫힌 칸이 아직 되돌려지기 전 → 그 칸을 이 화면의 칸으로 재활용(이동 없음) */
      pendingBack--;
      entry.pushed = true;
      stack.push(entry);
      try{ history.replaceState(state(), "", location.href); }catch(e){}
      return entry;
    }
    stack.push(entry);
    try{ history.pushState(state(), "", location.href); entry.pushed = true; }catch(e){}
    return entry;
  }

  /* ref = 이름(문자열) 또는 push 가 돌려준 토큰(객체). 살아 있는 칸 중 맨 위에서 가까운 것을 닫는다 */
  function pop(ref){
    if(inPop) return;
    var idx = -1, i;
    if(ref && typeof ref === "object"){
      if(ref.dead) return;
      idx = stack.lastIndexOf(ref);
    } else {
      for(i = stack.length - 1; i >= 0; i--){ if(!stack[i].dead && (!ref || stack[i].name === ref)){ idx = i; break; } }
    }
    if(idx < 0) return;
    if(idx !== stack.length - 1){ stack[idx].dead = true; return; }   /* 중간 칸: 죽은 표시만 */
    var n = 0, e = stack.pop(); e.dead = true; if(e.pushed) n++;
    while(stack.length && stack[stack.length - 1].dead){ var d = stack.pop(); if(d.pushed) n++; }   /* 바로 아래 죽은 칸들도 함께 */
    scheduleBack(n);
  }

  function onPop(ev){
    var st = ev && ev.state;
    var depth = (st && typeof st.hubBack === "number") ? st.hubBack : 0;
    if(silent > 0){ silent = 0; if(stack.length <= depth) return; }
    inPop = true;
    try{
      while(stack.length > depth){
        var s = stack.pop();
        if(!s.dead){ s.dead = true; try{ s.close(); }catch(e){} }
      }
    } finally { inPop = false; }
    /* 새로 드러난 맨 위가 죽은 칸이면 그것들도 곧바로 걷어낸다(한 번 누름 = 산 층 하나) */
    var k = 0;
    while(stack.length && stack[stack.length - 1].dead){ var d = stack.pop(); if(d.pushed) k++; }
    if(k > 0){ silent = 1; try{ history.go(-k); }catch(e){ silent = 0; } }
  }
  window.addEventListener("popstate", onPop);

  /* 새로고침 뒤: 스택은 비었는데 현재 칸이 가짜 칸(깊이 N)이면 바닥(N칸 아래)으로 되돌린다 */
  try{
    var hs = history.state;
    if(hs && typeof hs.hubBack === "number" && hs.hubBack > 0 && hs.hubBack < 50){
      history.replaceState(null, "", location.href);
      silent = 1; history.go(-hs.hubBack);
    }
  }catch(e){}

  window.HubBack = {
    push: push,
    pop: pop,
    depth: function(){ return stack.length; },
    version: "1.0.3"
  };
})();
/* end hub-back.js */
