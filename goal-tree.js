/* LevelPlay 목표 기반 학습 트리 (goal-tree.js)
   진로 목표를 고르거나 검색하면 무엇을 어떤 순서로 배울지 단계별 트리로 안내한다.
   index.html 이후 로드되어 go()/goSubject()/toast()/U 를 재사용한다. */
(function(){
'use strict';

var GOALS=null;
var LV=['','입문','초급','중급','고급','심화'];

/* ---------- CSS 주입 (v2_patch.js 패턴) ---------- */
function injectCSS(){
  if(document.getElementById('goalTreeCSS'))return;
  var s=document.createElement('style');
  s.id='goalTreeCSS';
  s.textContent=[
    '.goal-panel{margin:14px 0;animation:goalFade .25s ease}',
    '@keyframes goalFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}',
    '.goal-head{font-size:15px;font-weight:800;margin-bottom:4px}',
    '.goal-sub{font-size:11px;color:var(--t3);margin-bottom:10px;line-height:1.5}',
    '.goal-search{display:flex;gap:6px;margin-bottom:12px}',
    '.goal-search input{flex:1;padding:10px 12px;border-radius:10px;border:1.5px solid rgba(139,92,246,.22);background:var(--c1);color:inherit;font-size:13px;font-family:inherit}',
    '.goal-search button{padding:10px 14px;border:none;border-radius:10px;background:linear-gradient(135deg,#8b5cf6,#06d6a0);color:#fff;font-weight:700;font-size:12px;cursor:pointer;white-space:nowrap}',
    '.goal-cards{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}',
    '.goal-card{display:flex;flex-direction:column;gap:4px;padding:14px;border:1px solid rgba(139,92,246,.14);border-radius:14px;background:var(--c1);cursor:pointer;transition:transform .12s,box-shadow .15s;text-align:left}',
    '.goal-card:active{transform:scale(.96)}',
    '.goal-card:hover{box-shadow:0 4px 14px rgba(139,92,246,.12)}',
    '.goal-card .gc-ic{font-size:30px;line-height:1}',
    '.goal-card .gc-t{font-size:13px;font-weight:800}',
    '.goal-card .gc-d{font-size:10px;color:var(--t3);line-height:1.45}',
    '.goal-back{font-size:11px;padding:6px 11px;border:1px solid rgba(139,92,246,.14);border-radius:8px;background:var(--c1);color:inherit;cursor:pointer;margin-bottom:10px;font-family:inherit}',
    '.gtree{position:relative}',
    '.gtn{position:relative;padding:0 0 14px 32px}',
    '.gtn::before{content:"";position:absolute;left:11px;top:6px;width:2px;height:100%;background:linear-gradient(180deg,#8b5cf6,#06d6a0)}',
    '.gtn:last-child::before{display:none}',
    '.gtn-badge{position:absolute;left:0;top:0;width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#8b5cf6,#06d6a0);color:#fff;font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center}',
    '.gtn-badge.done{background:#06d6a0}',
    '.gtn-card{background:var(--c1);border:1px solid rgba(139,92,246,.12);border-radius:12px;padding:11px 12px}',
    '.gtn-t{font-size:13px;font-weight:800;display:flex;align-items:center;gap:6px;flex-wrap:wrap}',
    '.gtn-lv{font-size:9px;font-weight:700;padding:2px 7px;border-radius:6px;background:rgba(139,92,246,.12);color:#8b5cf6}',
    '.gtn-why{font-size:11px;color:var(--t2);margin:5px 0;line-height:1.5}',
    '.gtn-topics{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:7px}',
    '.gtn-topic{font-size:9px;padding:2px 7px;border-radius:6px;background:rgba(6,214,160,.1);color:var(--t2)}',
    '.gtn-go{font-size:11px;font-weight:700;padding:6px 12px;border:none;border-radius:8px;background:linear-gradient(135deg,#8b5cf6,#06d6a0);color:#fff;cursor:pointer;font-family:inherit}',
    '.gtn-vid{font-size:10px;color:#8b5cf6;margin-top:6px}'
  ].join('');
  document.head.appendChild(s);
}

/* ---------- 데이터 로드 ---------- */
function loadGoals(){
  if(GOALS)return Promise.resolve(GOALS);
  return fetch('data/goals.json').then(function(r){return r.json();}).then(function(d){
    GOALS=d;
    if(d&&d.meta&&Array.isArray(d.meta.levelLabels))LV=d.meta.levelLabels;
    return d;
  }).catch(function(e){console.warn('[goal-tree] goals.json 로드 실패:',e);return null;});
}

/* ---------- 유틸 ---------- */
function norm(s){return String(s==null?'':s).toLowerCase().replace(/\s+/g,'');}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

function isSubjectStarted(subj){
  try{
    if(typeof U==='undefined'||!U||!U.stats||!U.stats.lessonsBySubject)return false;
    return (U.stats.lessonsBySubject[subj]||0)>0;
  }catch(e){return false;}
}

/* ---------- 목표 매칭: ①정확 ②키워드 ③규칙조립 ---------- */
function matchGoal(query){
  if(!GOALS||!GOALS.goals)return null;
  var q=norm(query);
  if(!q)return null;
  var goals=GOALS.goals,i,j,k;
  // ① 제목 정확 매칭
  for(i=0;i<goals.length;i++){
    if(norm(goals[i].title)===q)return {goal:goals[i],exact:true};
  }
  // ② 제목 부분 + 키워드 점수 매칭
  var best=null,bestScore=0;
  for(j=0;j<goals.length;j++){
    var g=goals[j],score=0,nt=norm(g.title);
    if(nt.indexOf(q)>=0||q.indexOf(nt)>=0)score+=5;
    var kws=g.keywords||[];
    for(k=0;k<kws.length;k++){
      var kw=norm(kws[k]);
      if(!kw)continue;
      if(kw===q)score+=4;
      else if(kw.indexOf(q)>=0||q.indexOf(kw)>=0)score+=2;
    }
    if(score>bestScore){bestScore=score;best=g;}
  }
  if(best&&bestScore>=2)return {goal:best,exact:false};
  // ③ 규칙 조립 — 어떤 입력이든 트리를 만들어 반환
  return {goal:buildGoalFromKeywords(query),exact:false,generated:true};
}

function buildGoalFromKeywords(query){
  var sk=(GOALS&&GOALS.subjectKeywords)||{};
  var q=norm(query),hits=[];
  Object.keys(sk).forEach(function(subj){
    var kws=sk[subj]||[];
    for(var i=0;i<kws.length;i++){
      if(q.indexOf(norm(kws[i]))>=0){hits.push(subj);break;}
    }
  });
  if(hits.length===0)hits=['한글국어','수학','과학','사회'];
  hits=hits.slice(0,5);
  var tree=hits.map(function(subj,idx){
    return {stage:idx+1,label:subj+' 다지기',subject:subj,level:Math.min(idx+1,3),
      why:'"'+query+'"(으)로 가는 길에 '+subj+'이(가) 든든한 바탕이 돼요.',topics:[]};
  });
  return {id:'custom',title:query,icon:'🧭',
    description:'"'+query+'"에 대해 배우려면 이런 과목들이 도움이 돼요. 기초부터 차근차근 시작해봐요!',
    tree:tree,generated:true};
}

/* ---------- 렌더: 목표 선택 화면 ---------- */
function renderGoalPicker(){
  injectCSS();
  var area=document.getElementById('goalTreeArea');
  if(!area)return;
  loadGoals().then(function(){
    if(!GOALS||!GOALS.goals){
      area.innerHTML='<div class="goal-panel" style="color:var(--t3);font-size:12px">목표 데이터를 불러오지 못했어요. 잠시 후 다시 시도해주세요.</div>';
      return;
    }
    var featured=GOALS.goals.filter(function(g){return g.featured;});
    var h='<div class="goal-panel">';
    h+='<div class="goal-head">🎯 무엇이 되고 싶나요?</div>';
    h+='<div class="goal-sub">목표를 정하면 무엇을 어떤 순서로 배워야 하는지 트리로 알려드려요. 아래에서 고르거나, 직접 입력해보세요.</div>';
    h+='<div class="goal-search"><input id="goalQ" placeholder="예: 유튜버, 의사, 건축가, 무엇이든..." onkeydown="if(event.key===\'Enter\')window.goalSearch()"><button onclick="window.goalSearch()">트리 보기</button></div>';
    h+='<div class="goal-cards">';
    featured.forEach(function(g){
      h+='<button class="goal-card" onclick="window.showGoalTree(\''+g.id+'\')">'+
        '<span class="gc-ic">'+g.icon+'</span>'+
        '<span class="gc-t">'+esc(g.title)+'</span>'+
        '<span class="gc-d">'+esc(g.description)+'</span></button>';
    });
    h+='</div></div>';
    area.innerHTML=h;
    if(area.scrollIntoView)area.scrollIntoView({behavior:'smooth',block:'nearest'});
  });
}

/* ---------- 렌더: 학습 트리 ---------- */
function renderGoalTree(goal,meta){
  injectCSS();
  var area=document.getElementById('goalTreeArea');
  if(!area||!goal)return;
  meta=meta||{};
  var h='<div class="goal-panel">';
  h+='<button class="goal-back" onclick="window.renderGoalPicker()">← 다른 목표 보기</button>';
  h+='<div class="goal-head">'+(goal.icon||'🎯')+' '+esc(goal.title)+(meta.generated?'(으)로 가는 길':'')+'</div>';
  if(goal.description)h+='<div class="goal-sub">'+esc(goal.description)+'</div>';
  if(meta.generated)h+='<div class="goal-sub" style="color:#8b5cf6">💡 입력하신 목표에 맞춰 학습 경로를 구성했어요.</div>';
  h+='<div class="gtree">';
  var tree=goal.tree||[];
  tree.forEach(function(n){
    var done=isSubjectStarted(n.subject);
    var lvName=LV[n.level]||'';
    h+='<div class="gtn">';
    h+='<div class="gtn-badge'+(done?' done':'')+'">'+(done?'✓':esc(n.stage))+'</div>';
    h+='<div class="gtn-card">';
    h+='<div class="gtn-t">'+esc(n.label);
    if(n.subject&&lvName)h+='<span class="gtn-lv">'+esc(n.subject)+' · '+esc(lvName)+'</span>';
    h+='</div>';
    if(n.why)h+='<div class="gtn-why">'+esc(n.why)+'</div>';
    if(n.topics&&n.topics.length){
      h+='<div class="gtn-topics">'+n.topics.map(function(t){return '<span class="gtn-topic">'+esc(t)+'</span>';}).join('')+'</div>';
    }
    h+='<button class="gtn-go" onclick="window.goalGoStudy(\''+esc(n.subject)+'\')">이 단계 학습하기 ›</button>';
    if(n.video)h+='<div class="gtn-vid">📺 '+esc(n.video)+' 영상으로 보기</div>';
    h+='</div></div>';
  });
  h+='</div></div>';
  area.innerHTML=h;
  if(area.scrollIntoView)area.scrollIntoView({behavior:'smooth',block:'start'});
}

/* ---------- 전역 노출 (index.html onclick에서 호출) ---------- */
window.renderGoalPicker=renderGoalPicker;
window.openGoalTree=function(){renderGoalPicker();};
window.showGoalTree=function(id){
  if(!GOALS||!GOALS.goals)return;
  var g=GOALS.goals.filter(function(x){return x.id===id;})[0];
  if(g)renderGoalTree(g,{exact:true});
};
window.goalSearch=function(){
  var inp=document.getElementById('goalQ');
  if(!inp)return;
  var q=(inp.value||'').trim();
  if(!q){if(typeof toast==='function')toast('어떤 사람이 되고 싶은지 입력해보세요');return;}
  var m=matchGoal(q);
  if(m&&m.goal)renderGoalTree(m.goal,m);
};
window.goalGoStudy=function(subject){
  if(typeof goSubject==='function')goSubject(subject);
  else if(typeof go==='function')go(1);
};

/* ---------- 초기화: goals.json 미리 로드 ---------- */
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',function(){loadGoals();});
}else{
  loadGoals();
}

})();
