/* nav_unify.js — v10/v11/v12/v13 하단 기능 스트립을 단일 스트립(#lpUnifiedNav)으로 통합.
   원본 버튼의 리스너/onclick을 보존한 채 appendChild로 이동한다(노드 이동은 이벤트 보존).
   통합 후 하단 점유가 88px(메인 52 + 통합 36)로 줄므로 관련 요소 위치 오버라이드를 나중에 주입해 이긴다. */
(function(){
  'use strict';
  var STRIPS=[
    {sel:'#v10Nav'},
    {sel:'#v11Nav'},
    {sel:'#v12nav'},
    {sel:'.v13-nav'}
  ];
  var POLL_MS=300, MAX_MS=8000;
  var built=false, start=Date.now();

  function q(sel){return document.querySelector(sel);}
  function allPresent(){
    for(var i=0;i<STRIPS.length;i++){if(!q(STRIPS[i].sel))return false;}
    return true;
  }

  function tick(){
    if(built)return;
    if(allPresent()||(Date.now()-start)>=MAX_MS){build();return;}
    setTimeout(tick,POLL_MS);
  }

  function build(){
    if(built)return;built=true;
    injectStyle();
    var uni=document.getElementById('lpUnifiedNav');
    if(!uni){
      uni=document.createElement('div');
      uni.id='lpUnifiedNav';
      document.body.appendChild(uni);
    }
    var contributed=false;
    for(var i=0;i<STRIPS.length;i++){
      var strip=q(STRIPS[i].sel);
      if(!strip)continue;
      var btns=[].slice.call(strip.querySelectorAll('button'));
      if(!btns.length){strip.style.display='none';continue;}
      if(contributed){
        var sep=document.createElement('span');
        sep.className='lpuni-sep';
        uni.appendChild(sep);
      }
      contributed=true;
      for(var j=0;j<btns.length;j++){uni.appendChild(btns[j]);} // 노드 이동 → onclick/리스너 보존
      strip.style.display='none';
    }
  }

  function injectStyle(){
    if(document.getElementById('lpUnifiedNavStyle'))return;
    var st=document.createElement('style');
    st.id='lpUnifiedNavStyle';
    st.textContent=[
      /* 통합 스트립 — 기존 v13-nav 톤 */
      '#lpUnifiedNav{position:fixed;bottom:var(--nv);left:0;right:0;height:36px;background:rgba(10,10,26,.95);',
      '-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border-top:1px solid rgba(139,92,246,.06);',
      'display:flex;align-items:center;overflow-x:auto;overflow-y:hidden;z-index:998;scrollbar-width:none;gap:2px;padding:0 4px;box-sizing:border-box}',
      '#lpUnifiedNav::-webkit-scrollbar{display:none}',
      '#lpUnifiedNav button{flex:0 0 auto;padding:4px 10px;margin:0;height:26px;border:1px solid rgba(139,92,246,.12);border-radius:14px;',
      'background:var(--c2);color:var(--t3);font:10px/1.2 inherit;cursor:pointer;white-space:nowrap;transition:.15s;',
      'display:inline-flex;align-items:center;justify-content:center}',
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
    document.head.appendChild(st);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',tick);
  else tick();
})();
