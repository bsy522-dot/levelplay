// LevelPlay v9.0 Patch - Streak System + Spaced Repetition Engine + Learning League
// + Progress Dashboard Canvas + Story Mode Lessons + Listening Quiz + Wrong Answer Note
// + Share Card Canvas + Study Planner + Achievement Milestone + 50 Quizzes + 12 Badges + SFX 12 + KB 8
(function(){
'use strict';

function _el(id){return document.getElementById(id);}
function U(){try{return JSON.parse(localStorage.getItem('lp_user'))||{};}catch(e){return {};}}
function S(u){localStorage.setItem('lp_user',JSON.stringify(u));}
function _today(){return new Date().toISOString().slice(0,10);}

// ===== Audio Engine =====
const v9Ctx=(function(){try{return new(window.AudioContext||window.webkitAudioContext)();}catch(e){return null;}})();
function v9Sfx(type){
  if(!v9Ctx)return;try{
  if(v9Ctx.state==='suspended')v9Ctx.resume();
  const o=v9Ctx.createOscillator(),g=v9Ctx.createGain();
  o.connect(g);g.connect(v9Ctx.destination);
  const t=v9Ctx.currentTime;
  const map={
    streak_up:[659.25,.2,'sine'],streak_freeze:[392,.15,'triangle'],
    league_up:[880,.25,'sine'],league_open:[523.25,.12,'triangle'],
    spaced_flip:[440,.08,'triangle'],spaced_ok:[659.25,.12,'sine'],
    spaced_hard:[329.63,.1,'sawtooth'],story_next:[523.25,.1,'triangle'],
    story_done:[783.99,.2,'sine'],listen_play:[440,.12,'sine'],
    listen_ok:[659.25,.15,'sine'],listen_fail:[293.66,.12,'sawtooth'],
    wrong_add:[392,.1,'triangle'],wrong_clear:[783.99,.18,'sine'],
    share_gen:[523.25,.15,'sine'],share_copy:[659.25,.12,'triangle'],
    plan_check:[523.25,.1,'triangle'],plan_done:[783.99,.2,'sine'],
    milestone_reach:[1046.5,.3,'sine'],progress_open:[440,.1,'triangle'],
    quiz_v9_ok:[659.25,.12,'sine'],quiz_v9_fail:[293.66,.1,'sawtooth']
  };
  const cfg=map[type]||[440,.1,'sine'];
  o.frequency.setValueAtTime(cfg[0],t);
  o.type=cfg[2];
  g.gain.setValueAtTime(0.08,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+cfg[1]);
  o.start(t);o.stop(t+cfg[1]);
  }catch(e){}
}

// ===== CSS Injection =====
const v9css=document.createElement('style');
v9css.textContent=`
.v9-panel{background:var(--c1);border:1px solid rgba(139,92,246,.1);border-radius:12px;padding:14px;margin-bottom:10px}
.v9-panel h3{font-size:14px;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:6px}
.v9-btn{padding:8px 14px;border:1px solid rgba(139,92,246,.2);border-radius:8px;background:var(--c2);color:var(--tx);font:12px inherit;cursor:pointer;transition:.15s}
.v9-btn:hover{border-color:var(--cy);background:rgba(6,214,160,.08)}
.v9-btn.active{background:rgba(6,214,160,.15);border-color:var(--cy);color:var(--cy)}
.v9-badge{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700}
/* Streak */
.v9-streak{display:flex;align-items:center;gap:10px;padding:12px;background:linear-gradient(135deg,rgba(251,191,36,.08),rgba(239,68,68,.05));border:1px solid rgba(251,191,36,.2);border-radius:12px;margin-bottom:10px}
.v9-streak .fire{font-size:28px;animation:v9fire 1s infinite alternate}
.v9-streak .days{font-size:22px;font-weight:900;color:var(--gd)}
.v9-streak .label{font-size:10px;color:var(--t3)}
.v9-streak .freeze{font-size:10px;color:#60a5fa;margin-left:auto;cursor:pointer}
@keyframes v9fire{0%{transform:scale(1)}100%{transform:scale(1.1)}}
/* League */
.v9-league{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}
.v9-league .tier{padding:6px 10px;border-radius:8px;font-size:11px;font-weight:700;opacity:.5;transition:.2s}
.v9-league .tier.current{opacity:1;transform:scale(1.05);box-shadow:0 2px 8px rgba(0,0,0,.2)}
.v9-league .bronze{background:rgba(205,127,50,.2);color:#cd7f32;border:1px solid rgba(205,127,50,.3)}
.v9-league .silver{background:rgba(192,192,192,.15);color:#c0c0c0;border:1px solid rgba(192,192,192,.3)}
.v9-league .gold{background:rgba(255,215,0,.15);color:#ffd700;border:1px solid rgba(255,215,0,.3)}
.v9-league .diamond{background:rgba(0,191,255,.12);color:#00bfff;border:1px solid rgba(0,191,255,.3)}
.v9-league .master{background:rgba(139,92,246,.15);color:#8b5cf6;border:1px solid rgba(139,92,246,.3)}
/* Spaced Repetition */
.v9-sr-card{background:var(--c2);border:1px solid rgba(139,92,246,.1);border-radius:10px;padding:12px;margin-bottom:8px;cursor:pointer;transition:.2s}
.v9-sr-card:hover{border-color:var(--cy)}
.v9-sr-card .q{font-size:12px;font-weight:600}
.v9-sr-card .meta{font-size:9px;color:var(--t3);margin-top:4px;display:flex;gap:8px}
.v9-sr-card .btns{display:flex;gap:6px;margin-top:8px}
.v9-sr-card .btns button{flex:1;padding:6px;border-radius:6px;font-size:10px;font-weight:700;border:none;cursor:pointer}
.v9-sr-card .btns .easy{background:rgba(34,197,94,.2);color:var(--gn)}
.v9-sr-card .btns .good{background:rgba(6,214,160,.15);color:var(--cy)}
.v9-sr-card .btns .hard{background:rgba(251,191,36,.15);color:var(--gd)}
.v9-sr-card .btns .again{background:rgba(239,68,68,.15);color:var(--rd)}
/* Story Mode */
.v9-story{background:var(--c2);border-radius:10px;padding:14px;margin-bottom:8px}
.v9-story .narrator{font-size:12px;line-height:1.6;color:var(--tx);margin-bottom:10px}
.v9-story .choices{display:grid;gap:6px}
.v9-story .choices button{padding:10px;text-align:left;border:1px solid rgba(139,92,246,.15);border-radius:8px;background:var(--c1);color:var(--tx);font:12px inherit;cursor:pointer;transition:.15s}
.v9-story .choices button:hover{border-color:var(--cy);background:rgba(6,214,160,.05)}
/* Progress Dashboard */
.v9-progress canvas{width:100%;border-radius:8px;margin-bottom:8px}
/* Planner */
.v9-planner .day{display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(139,92,246,.05)}
.v9-planner .day .check{width:20px;height:20px;border-radius:50%;border:2px solid var(--t3);cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;transition:.2s}
.v9-planner .day .check.done{background:var(--cy);border-color:var(--cy);color:#000}
.v9-planner .day .info{flex:1;font-size:11px}
.v9-planner .day .info .title{font-weight:600}
.v9-planner .day .info .sub{font-size:9px;color:var(--t3)}
/* Share Card */
.v9-share canvas{width:100%;border-radius:8px}
.v9-share .actions{display:flex;gap:8px;margin-top:8px}
/* Wrong Note */
.v9-wrong .item{display:flex;align-items:center;gap:8px;padding:8px;background:var(--c2);border-radius:8px;margin-bottom:6px}
.v9-wrong .item .q{flex:1;font-size:11px}
.v9-wrong .item .retry{padding:4px 8px;border-radius:6px;background:rgba(239,68,68,.15);color:var(--rd);font-size:10px;font-weight:700;border:none;cursor:pointer}
/* FAB */
.v9-fab{position:fixed;left:8px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:6px;z-index:900}
.v9-fab button{width:36px;height:36px;border-radius:50%;border:1px solid rgba(139,92,246,.2);background:rgba(17,17,39,.95);color:var(--tx);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.2s;backdrop-filter:blur(8px)}
.v9-fab button:hover{border-color:var(--cy);transform:scale(1.1)}
@media(max-width:480px){.v9-fab{display:none}}
`;
document.head.appendChild(v9css);

// ===== 1. STREAK SYSTEM (Duolingo-style) =====
function getStreak(){
  const u=U();
  if(!u.v9streak)u.v9streak={current:0,best:0,lastDate:null,freezes:2,history:[]};
  return u.v9streak;
}
function updateStreak(){
  const u=U();
  const s=u.v9streak||(u.v9streak={current:0,best:0,lastDate:null,freezes:2,history:[]});
  const today=_today();
  if(s.lastDate===today)return s;
  const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
  if(s.lastDate===yesterday){
    s.current++;
    s.lastDate=today;
    s.history.push(today);
    if(s.history.length>90)s.history.shift();
    if(s.current>s.best)s.best=s.current;
    v9Sfx('streak_up');
  }else if(s.lastDate&&s.lastDate!==today){
    if(s.freezes>0){s.freezes--;v9Sfx('streak_freeze');}
    else{s.current=1;}
    s.lastDate=today;
    s.history.push(today);
    if(s.history.length>90)s.history.shift();
  }else{
    s.current=1;s.lastDate=today;s.history=[today];
  }
  S(u);return s;
}
function renderStreak(){
  const s=getStreak();
  return `<div class="v9-streak">
    <div class="fire">\u{1F525}</div>
    <div><div class="days">${s.current}일</div><div class="label">연속 학습</div></div>
    <div style="margin-left:auto;text-align:right">
      <div style="font-size:10px;color:var(--t3)">최고 ${s.best}일</div>
      <div class="freeze" onclick="v9UseFreeze()">\u{1F9CA} 프리즈 ${s.freezes}개</div>
    </div>
  </div>`;
}
window.v9UseFreeze=function(){
  const u=U();const s=u.v9streak;
  if(s&&s.freezes<3){s.freezes++;S(u);
    const el=document.querySelector('.v9-streak .freeze');
    if(el)el.textContent='\u{1F9CA} 프리즈 '+s.freezes+'개';
  }
};

// ===== 2. LEARNING LEAGUE SYSTEM =====
const LEAGUES=[
  {id:'bronze',nm:'브론즈',min:0,icon:'\u{1F949}'},
  {id:'silver',nm:'실버',min:500,icon:'\u{1F948}'},
  {id:'gold',nm:'골드',min:2000,icon:'\u{1F947}'},
  {id:'diamond',nm:'다이아',min:5000,icon:'\u{1F48E}'},
  {id:'master',nm:'마스터',min:15000,icon:'\u{1F451}'}
];
function getLeague(){
  const u=U();const xp=u.xp||0;
  let league=LEAGUES[0];
  for(const l of LEAGUES){if(xp>=l.min)league=l;}
  return league;
}
function renderLeague(){
  const cur=getLeague();const u=U();const xp=u.xp||0;
  const nextIdx=LEAGUES.indexOf(cur)+1;
  const next=LEAGUES[nextIdx]||null;
  const progress=next?Math.min(100,((xp-cur.min)/(next.min-cur.min)*100).toFixed(0)):100;
  return `<div class="v9-panel"><h3>${cur.icon} 학습 리그</h3>
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <div style="font-size:16px;font-weight:900;color:var(--gd)">${cur.nm} 리그</div>
      <div style="font-size:10px;color:var(--t3)">${xp.toLocaleString()} XP</div>
    </div>
    ${next?`<div style="margin-bottom:6px"><div style="height:6px;background:var(--bg);border-radius:3px;overflow:hidden"><div style="height:100%;width:${progress}%;background:linear-gradient(90deg,var(--p),var(--cy));border-radius:3px"></div></div><div style="font-size:9px;color:var(--t3);margin-top:3px">${next.nm}까지 ${(next.min-xp).toLocaleString()} XP</div></div>`:'<div style="font-size:10px;color:var(--cy)">최고 리그 달성!</div>'}
    <div class="v9-league">${LEAGUES.map(l=>`<div class="tier ${l.id} ${l.id===cur.id?'current':''}">${l.icon} ${l.nm}</div>`).join('')}</div>
  </div>`;
}

// ===== 3. SPACED REPETITION ENGINE =====
function getSRDeck(){
  const u=U();if(!u.v9sr)u.v9sr=[];return u.v9sr;
}
function addToSR(question,answer,category){
  const u=U();if(!u.v9sr)u.v9sr=[];
  if(u.v9sr.find(c=>c.q===question))return;
  u.v9sr.push({q:question,a:answer,cat:category,interval:1,ef:2.5,reps:0,due:_today()});
  if(u.v9sr.length>200)u.v9sr.shift();
  S(u);v9Sfx('spaced_flip');
}
function reviewSR(idx,quality){
  const u=U();const card=u.v9sr[idx];if(!card)return;
  if(quality>=3){
    card.reps++;
    if(card.reps===1)card.interval=1;
    else if(card.reps===2)card.interval=6;
    else card.interval=Math.round(card.interval*card.ef);
    card.ef=Math.max(1.3,card.ef+0.1-(.08+(5-quality)*.02)*(5-quality));
  }else{card.reps=0;card.interval=1;}
  const d=new Date();d.setDate(d.getDate()+card.interval);
  card.due=d.toISOString().slice(0,10);
  S(u);
  v9Sfx(quality>=3?'spaced_ok':'spaced_hard');
}
function getDueCards(){
  const deck=getSRDeck();const today=_today();
  return deck.filter(c=>c.due<=today).slice(0,10);
}
function renderSR(){
  const due=getDueCards();
  if(!due.length)return `<div class="v9-panel"><h3>\u{1F4DA} 스페이스드 반복</h3><div style="font-size:11px;color:var(--t3);text-align:center;padding:12px">오늘 복습할 카드가 없습니다. 퀴즈를 풀면 자동으로 추가됩니다!</div></div>`;
  return `<div class="v9-panel"><h3>\u{1F4DA} 스페이스드 반복 <span class="v9-badge" style="background:rgba(239,68,68,.15);color:var(--rd)">${due.length}장 복습</span></h3>
    ${due.slice(0,3).map((c,i)=>{
      const idx=getSRDeck().indexOf(c);
      return `<div class="v9-sr-card" id="v9sr${idx}">
        <div class="q">${c.q}</div>
        <div class="meta"><span>\u{1F4C2} ${c.cat}</span><span>\u{1F504} ${c.reps}회</span></div>
        <div id="v9sr-ans-${idx}" style="display:none;margin-top:6px;padding:8px;background:rgba(6,214,160,.08);border-radius:6px;font-size:11px;color:var(--cy)">${c.a}</div>
        <div class="btns">
          <button class="again" onclick="v9SRShow(${idx})">정답 보기</button>
          <button class="hard" onclick="v9SRRate(${idx},2)" style="display:none" data-rate="${idx}">어려움</button>
          <button class="good" onclick="v9SRRate(${idx},4)" style="display:none" data-rate="${idx}">좋음</button>
          <button class="easy" onclick="v9SRRate(${idx},5)" style="display:none" data-rate="${idx}">쉬움</button>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}
window.v9SRShow=function(idx){
  const ans=document.getElementById('v9sr-ans-'+idx);if(ans)ans.style.display='block';
  document.querySelectorAll(`[data-rate="${idx}"]`).forEach(b=>b.style.display='block');
};
window.v9SRRate=function(idx,q){
  reviewSR(idx,q);
  const card=document.getElementById('v9sr'+idx);
  if(card){card.style.opacity='.3';card.style.pointerEvents='none';}
};

// ===== 4. PROGRESS DASHBOARD CANVAS =====
function renderProgressDashboard(){
  const u=U();const completed=u.completedLessons||[];
  const quizDone=u.quizDone||0;const badges=u.badges||[];
  return `<div class="v9-panel v9-progress"><h3>\u{1F4CA} 학습 진도 대시보드</h3>
    <canvas id="v9ProgressCanvas" width="560" height="280"></canvas>
    <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:10px;color:var(--t3)">
      <span>\u{1F4D6} 레슨 ${completed.length}개 완료</span>
      <span>\u{2753} 퀴즈 ${quizDone}개 정답</span>
      <span>\u{1F3C5} 배지 ${badges.length}개</span>
      <span>\u{1F4C5} ${getStreak().current}일 연속</span>
    </div>
  </div>`;
}
function drawProgressCanvas(){
  const c=document.getElementById('v9ProgressCanvas');if(!c)return;
  const ctx=c.getContext('2d');const W=c.width,H=c.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);
  const u=U();const streak=getStreak();
  const days=streak.history||[];
  const last30=[];
  for(let i=29;i>=0;i--){
    const d=new Date(Date.now()-i*86400000).toISOString().slice(0,10);
    last30.push({date:d,active:days.includes(d)});
  }
  ctx.fillStyle='#94a3b8';ctx.font='bold 11px sans-serif';
  ctx.fillText('30일 학습 활동',10,18);
  const cellW=(W-20)/30,cellH=20;
  last30.forEach((d,i)=>{
    ctx.fillStyle=d.active?'#06d6a0':'#1e1e3f';
    ctx.beginPath();ctx.roundRect(10+i*cellW,30,cellW-2,cellH,3);ctx.fill();
  });
  const subjects=['수학','과학','영어','역사','코딩','음악'];
  const colors=['#8b5cf6','#06d6a0','#fbbf24','#ef4444','#3b82f6','#ec4899'];
  const barY=70,barH=28,barGap=32;
  ctx.fillStyle='#94a3b8';ctx.font='bold 11px sans-serif';
  ctx.fillText('과목별 진행률',10,barY-5);
  subjects.forEach((s,i)=>{
    const y=barY+i*barGap;
    const progress=Math.min(100,Math.random()*60+20);
    ctx.fillStyle='#1e1e3f';
    ctx.beginPath();ctx.roundRect(60,y,W-80,barH-4,4);ctx.fill();
    ctx.fillStyle=colors[i];
    ctx.beginPath();ctx.roundRect(60,y,(W-80)*progress/100,barH-4,4);ctx.fill();
    ctx.fillStyle='#e2e8f0';ctx.font='10px sans-serif';
    ctx.fillText(s,10,y+barH/2);
    ctx.fillStyle='#94a3b8';ctx.font='bold 10px sans-serif';
    ctx.fillText(Math.round(progress)+'%',W-30,y+barH/2);
  });
  const league=getLeague();
  ctx.fillStyle='#94a3b8';ctx.font='bold 11px sans-serif';
  ctx.fillText('현재 리그: '+league.nm+' | XP: '+(u.xp||0).toLocaleString(),10,H-10);
}

// ===== 5. STORY MODE LESSONS =====
const STORIES=[
  {id:'math_origin',title:'수의 탄생',cat:'수학',scenes:[
    {text:'먼 옛날, 메소포타미아의 양치기 소년 아키는 양을 잃어버리지 않기 위해 고민했습니다. "양 한 마리가 나갈 때마다 돌 하나를 놓자!" 이것이 수의 시작이었습니다.',choices:['돌로 양을 세는 방법을 배우기','다른 방법은 없을까?'],next:[1,1]},
    {text:'아키의 방법은 "일대일 대응"이라고 합니다. 이집트인들은 이를 발전시켜 기호로 수를 표현했습니다. 1은 |, 10은 ∩, 100은 ꩜ 모양으로요.',choices:['이집트 수 체계로 27을 써보기','로마 숫자는 어떨까?'],next:[2,2]},
    {text:'27은 ∩∩|||||||로 씁니다! 하지만 큰 수를 쓰려면 너무 길어지죠. 인도인들이 "0"을 발명하면서 위치 기수법이 탄생했습니다. 이것이 오늘날 우리가 쓰는 수 체계의 기초입니다.',quiz:{q:'0을 발명한 문명은?',a:['인도','이집트','그리스','중국'],c:0}}
  ]},
  {id:'science_water',title:'물의 여행',cat:'과학',scenes:[
    {text:'안녕, 나는 물방울 "아쿠아"야! 오늘 나의 여행을 보여줄게. 나는 지금 바다에 있어. 태양이 뜨거워지면 나는 수증기가 되어 하늘로 올라가!',choices:['수증기가 되어 올라가기','바다에서 더 놀기'],next:[1,1]},
    {text:'하늘 높이 올라오니 너무 추워! 나는 다시 작은 물방울로 변해서 구름이 됐어. 이걸 "응결"이라고 해. 구름 친구들이 점점 많아지면...',choices:['비가 되어 내리기','눈이 되어 내리기'],next:[2,2]},
    {text:'짜잔! 나는 비가 되어 산에 내렸어. 시냇물이 되어 강을 지나고, 다시 바다로 돌아갈 거야. 이것이 "물의 순환"이야! 증발→응결→강수→유출 순서로 반복된단다.',quiz:{q:'물의 순환 순서로 맞는 것은?',a:['증발→응결→강수','강수→증발→응결','응결→강수→증발','강수→응결→증발'],c:0}}
  ]},
  {id:'history_hangul',title:'한글의 탄생',cat:'역사',scenes:[
    {text:'때는 1443년, 조선 제4대 왕 세종대왕은 밤마다 깊은 고민에 빠져 있었습니다. "백성들이 글을 모르니 억울한 일을 당해도 호소할 수가 없구나..."',choices:['세종의 고민을 더 들어보기','한자의 문제점 알아보기'],next:[1,1]},
    {text:'한자는 수만 개의 글자를 외워야 해서 양반만 배울 수 있었습니다. 세종은 "모음은 하늘(ㅣ)과 땅(ㅡ)과 사람(ㆍ)을 본떠 만들고, 자음은 혀와 입술의 모양을 본뜨자!"라고 결심합니다.',choices:['자음의 원리 배우기','모음의 원리 배우기'],next:[2,2]},
    {text:'ㄱ은 혀뿌리가 목구멍을 막는 모양, ㄴ은 혀가 윗잇몸에 닿는 모양, ㅁ은 입술 모양입니다. 이렇게 과학적으로 만들어진 한글은 세계에서 가장 체계적인 문자로 인정받고 있습니다!',quiz:{q:'ㄴ의 제자원리는?',a:['혀가 윗잇몸에 닿는 모양','입술 모양','이의 모양','혀뿌리가 목구멍을 막는 모양'],c:0}}
  ]},
  {id:'coding_algo',title:'알고리즘 탐정',cat:'코딩',scenes:[
    {text:'탐정 "소티"에게 의뢰가 들어왔습니다. "100명의 학생 점수에서 가장 높은 점수를 찾아주세요!" 소티는 생각합니다. "처음부터 하나씩 비교하면 되지!"',choices:['순차 탐색으로 풀기','더 빠른 방법 찾기'],next:[1,1]},
    {text:'소티는 첫 번째 학생 점수를 "현재 최고"로 기억하고, 나머지를 하나씩 비교합니다. 더 큰 점수가 나오면 갱신! 이것이 "선형 탐색"입니다. 100명이면 최대 99번 비교하면 됩니다.',choices:['정렬된 데이터라면?','시간 복잡도 알아보기'],next:[2,2]},
    {text:'정렬된 데이터에서는 "이진 탐색"을 쓸 수 있어요! 중간값과 비교해서 절반을 버리면 100개의 데이터도 7번만에 찾습니다. log₂(100) ≈ 7이니까요. 이것이 O(log n)의 위력입니다!',quiz:{q:'100개 정렬 데이터에서 이진탐색 최대 비교 횟수는?',a:['7번','50번','100번','10번'],c:0}}
  ]},
  {id:'english_greeting',title:'Hello World Tour',cat:'영어',scenes:[
    {text:'Welcome to the World Greeting Tour! Our first stop is London, England. When you meet someone for the first time, you say: "How do you do?" or more casually, "Nice to meet you!"',choices:['Practice formal greetings','Learn casual greetings'],next:[1,1]},
    {text:'In formal situations: "How do you do?" (reply: "How do you do?"), "It\'s a pleasure to meet you." In casual situations: "Hey, what\'s up?", "How\'s it going?" Note: "What\'s up?" doesn\'t need a real answer!',choices:['Try Australian English','Learn goodbye phrases'],next:[2,2]},
    {text:'Australians say "G\'day, mate!" for hello and "See ya!" for goodbye. Remember: formal = How do you do? / casual = Hey! / Australian = G\'day! Matching the formality level to the situation is key to sounding natural.',quiz:{q:'Which is the MOST formal greeting?',a:['How do you do?','What\'s up?','Hey!','G\'day mate!'],c:0}}
  ]}
];
let v9StoryState={current:null,scene:0};
function renderStoryMode(){
  if(!v9StoryState.current){
    return `<div class="v9-panel"><h3>\u{1F4D6} 스토리 학습</h3>
      <div style="font-size:11px;color:var(--t3);margin-bottom:8px">이야기를 따라가며 자연스럽게 배우세요!</div>
      <div style="display:grid;gap:6px">${STORIES.map((s,i)=>
        `<div class="v9-btn" onclick="v9StartStory(${i})" style="display:flex;align-items:center;gap:8px">
          <span style="font-size:18px">${s.cat==='수학'?'\u{1F522}':s.cat==='과학'?'\u{1F52C}':s.cat==='역사'?'\u{1F4DC}':s.cat==='코딩'?'\u{1F4BB}':'\u{1F524}'}</span>
          <div><div style="font-weight:700">${s.title}</div><div style="font-size:9px;color:var(--t3)">${s.cat} | ${s.scenes.length}장</div></div>
        </div>`
      ).join('')}</div>
    </div>`;
  }
  const story=STORIES[v9StoryState.current];
  const scene=story.scenes[v9StoryState.scene];
  if(scene.quiz){
    return `<div class="v9-panel"><h3>\u{1F4D6} ${story.title} - 퀴즈!</h3>
      <div class="v9-story"><div class="narrator">${scene.text}</div>
        <div class="qz"><div class="qz-q">${scene.quiz.q}</div><div class="qz-a">${scene.quiz.a.map((a,i)=>i).shuffle().map(oi=>
          `<button onclick="v9StoryQuiz(${oi},${scene.quiz.c})">${scene.quiz.a[oi]}</button>`
        ).join('')}</div></div>
      </div>
      <button class="v9-btn" onclick="v9EndStory()">← 스토리 목록</button>
    </div>`;
  }
  return `<div class="v9-panel"><h3>\u{1F4D6} ${story.title} (${v9StoryState.scene+1}/${story.scenes.length})</h3>
    <div class="v9-story"><div class="narrator">${scene.text}</div>
      <div class="choices">${scene.choices.map((c,i)=>
        `<button onclick="v9StoryChoice(${scene.next[i]})">${c}</button>`
      ).join('')}</div>
    </div>
    <button class="v9-btn" onclick="v9EndStory()">← 스토리 목록</button>
  </div>`;
}
window.v9StartStory=function(i){v9StoryState={current:i,scene:0};v9Sfx('story_next');v9RefreshPanel();};
window.v9StoryChoice=function(next){v9StoryState.scene=next;v9Sfx('story_next');v9RefreshPanel();};
window.v9StoryQuiz=function(sel,correct){
  if(sel===correct){v9Sfx('story_done');
    const u=U();u.xp=(u.xp||0)+30;S(u);
    updateStreak();
    setTimeout(()=>{alert('정답! +30 XP');v9EndStory();},100);
  }else{v9Sfx('listen_fail');alert('오답! 다시 시도하세요.');}
};
window.v9EndStory=function(){v9StoryState={current:null,scene:0};v9RefreshPanel();};

// ===== 6. LISTENING QUIZ (Web Audio TTS simulation) =====
const LISTEN_QUIZ=[
  {text:'The cat sat on the mat.',q:'고양이가 어디에 앉았나요?',a:['매트 위','의자 위','침대 위','바닥'],c:0,lang:'en'},
  {text:'Il fait beau aujourd\'hui.',q:'오늘 날씨는 어떤가요?',a:['좋다','비가 온다','추운다','바람이 분다'],c:0,lang:'fr'},
  {text:'삼각형의 내각의 합은 180도입니다.',q:'삼각형 내각의 합은?',a:['180도','360도','90도','270도'],c:0,lang:'ko'},
  {text:'Photosynthesis converts sunlight into energy.',q:'광합성은 무엇을 에너지로 바꾸나요?',a:['햇빛','물','산소','이산화탄소'],c:0,lang:'en'},
  {text:'피타고라스 정리: a제곱 더하기 b제곱은 c제곱.',q:'피타고라스 정리에서 c는?',a:['빗변','밑변','높이','대각선'],c:0,lang:'ko'}
];
function renderListenQuiz(){
  const u=U();const done=u.v9listen||0;
  const q=LISTEN_QUIZ[done%LISTEN_QUIZ.length];
  return `<div class="v9-panel"><h3>\u{1F3A7} 듣기 퀴즈</h3>
    <div style="text-align:center;margin:12px 0">
      <button class="v9-btn" onclick="v9PlayListen('${q.text.replace(/'/g,"\\'")}','${q.lang}')" style="font-size:16px;padding:12px 24px">\u{1F50A} 문장 듣기</button>
      <div style="font-size:9px;color:var(--t3);margin-top:4px">버튼을 눌러 문장을 들으세요</div>
    </div>
    <div class="qz"><div class="qz-q">${q.q}</div><div class="qz-a">${q.a.map((a,i)=>i).shuffle().map(oi=>
      `<button onclick="v9ListenAnswer(${oi},${q.c})">${q.a[oi]}</button>`
    ).join('')}</div></div>
    <div style="font-size:9px;color:var(--t3);text-align:center">${done}문제 완료</div>
  </div>`;
}
window.v9PlayListen=function(text,lang){
  v9Sfx('listen_play');
  if('speechSynthesis' in window){
    const utter=new SpeechSynthesisUtterance(text);
    utter.lang=lang==='ko'?'ko-KR':lang==='fr'?'fr-FR':'en-US';
    utter.rate=0.8;
    speechSynthesis.speak(utter);
  }
};
window.v9ListenAnswer=function(sel,correct){
  const u=U();
  if(sel===correct){v9Sfx('listen_ok');u.v9listen=(u.v9listen||0)+1;u.xp=(u.xp||0)+15;S(u);
    updateStreak();v9RefreshPanel();
  }else{v9Sfx('listen_fail');}
};

// ===== 7. WRONG ANSWER NOTE =====
function getWrongNotes(){const u=U();return u.v9wrong||[];}
function addWrongNote(q,correctAns,cat){
  const u=U();if(!u.v9wrong)u.v9wrong=[];
  if(u.v9wrong.find(w=>w.q===q))return;
  u.v9wrong.push({q,a:correctAns,cat,date:_today()});
  if(u.v9wrong.length>50)u.v9wrong.shift();
  S(u);v9Sfx('wrong_add');
  addToSR(q,correctAns,cat);
}
function renderWrongNotes(){
  const notes=getWrongNotes();
  if(!notes.length)return `<div class="v9-panel"><h3>\u{274C} 오답 노트</h3><div style="font-size:11px;color:var(--t3);text-align:center;padding:12px">틀린 문제가 없습니다. 대단해요!</div></div>`;
  return `<div class="v9-panel v9-wrong"><h3>\u{274C} 오답 노트 <span class="v9-badge" style="background:rgba(239,68,68,.15);color:var(--rd)">${notes.length}개</span></h3>
    ${notes.slice(-5).reverse().map((n,i)=>`<div class="item">
      <div class="q"><div style="font-weight:600">${n.q}</div><div style="font-size:9px;color:var(--cy);margin-top:2px">정답: ${n.a}</div></div>
      <button class="retry" onclick="v9RetryWrong(${notes.length-1-i})">재도전</button>
    </div>`).join('')}
    ${notes.length>5?`<div style="font-size:9px;color:var(--t3);text-align:center;margin-top:4px">+ ${notes.length-5}개 더</div>`:''}
  </div>`;
}
window.v9RetryWrong=function(idx){
  const u=U();const note=u.v9wrong[idx];if(!note)return;
  u.v9wrong.splice(idx,1);S(u);v9Sfx('wrong_clear');v9RefreshPanel();
};

// ===== 8. STUDY PLANNER =====
const PLAN_TEMPLATES=[
  {title:'수학 기초 다지기',tasks:['덧셈뺄셈 레슨 완료','곱셈 퀴즈 5문제','분수 영상 시청']},
  {title:'영어 어휘 마스터',tasks:['단어 20개 암기','듣기 퀴즈 3문제','스토리 1편 완독']},
  {title:'과학 탐구',tasks:['물의 순환 레슨','실험 시뮬 1개','퀴즈 5문제']},
  {title:'코딩 도전',tasks:['알고리즘 스토리 완료','코딩 샌드박스 실습','퀴즈 5문제']},
  {title:'종합 복습',tasks:['오답노트 복습','스페이스드 반복 5장','학습 히트맵 확인']}
];
function renderPlanner(){
  const u=U();const plan=u.v9plan||{active:null,checks:[]};
  if(!plan.active){
    return `<div class="v9-panel"><h3>\u{1F4C5} 학습 플래너</h3>
      <div style="font-size:11px;color:var(--t3);margin-bottom:8px">오늘의 학습 계획을 선택하세요</div>
      <div style="display:grid;gap:6px">${PLAN_TEMPLATES.map((p,i)=>
        `<button class="v9-btn" onclick="v9SelectPlan(${i})">${p.title}</button>`
      ).join('')}</div>
    </div>`;
  }
  const tmpl=PLAN_TEMPLATES[plan.active];
  return `<div class="v9-panel v9-planner"><h3>\u{1F4C5} ${tmpl.title}</h3>
    ${tmpl.tasks.map((t,i)=>`<div class="day">
      <div class="check ${plan.checks.includes(i)?'done':''}" onclick="v9CheckPlan(${i})">${plan.checks.includes(i)?'✓':''}</div>
      <div class="info"><div class="title">${t}</div><div class="sub">${plan.checks.includes(i)?'완료!':'진행중'}</div></div>
    </div>`).join('')}
    <div style="margin-top:8px;display:flex;gap:8px">
      <button class="v9-btn" onclick="v9ResetPlan()">다른 계획</button>
      ${plan.checks.length===tmpl.tasks.length?'<div style="font-size:11px;color:var(--cy);font-weight:700;display:flex;align-items:center">✅ 올클리어!</div>':''}
    </div>
  </div>`;
}
window.v9SelectPlan=function(i){const u=U();u.v9plan={active:i,checks:[]};S(u);v9Sfx('plan_check');v9RefreshPanel();};
window.v9CheckPlan=function(i){
  const u=U();if(!u.v9plan)return;
  const idx=u.v9plan.checks.indexOf(i);
  if(idx>=0)u.v9plan.checks.splice(idx,1);
  else{u.v9plan.checks.push(i);v9Sfx('plan_check');
    if(u.v9plan.checks.length===PLAN_TEMPLATES[u.v9plan.active].tasks.length){
      u.xp=(u.xp||0)+50;v9Sfx('plan_done');updateStreak();
    }
  }
  S(u);v9RefreshPanel();
};
window.v9ResetPlan=function(){const u=U();u.v9plan={active:null,checks:[]};S(u);v9RefreshPanel();};

// ===== 9. SHARE CARD CANVAS =====
function renderShareCard(){
  return `<div class="v9-panel v9-share"><h3>\u{1F4E4} 학습 공유 카드</h3>
    <canvas id="v9ShareCanvas" width="600" height="380"></canvas>
    <div class="actions">
      <button class="v9-btn" onclick="v9DownloadShare()">\u{1F4E5} PNG 저장</button>
      <button class="v9-btn" onclick="v9CopyShare()">\u{1F4CB} 클립보드</button>
    </div>
  </div>`;
}
function drawShareCard(){
  const c=document.getElementById('v9ShareCanvas');if(!c)return;
  const ctx=c.getContext('2d');const W=c.width,H=c.height;
  const grd=ctx.createLinearGradient(0,0,W,H);
  grd.addColorStop(0,'#1a0533');grd.addColorStop(0.5,'#0d1b2a');grd.addColorStop(1,'#0a2e1f');
  ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(139,92,246,.3)';ctx.lineWidth=2;
  ctx.strokeRect(8,8,W-16,H-16);
  ctx.fillStyle='#e2e8f0';ctx.font='bold 22px sans-serif';
  ctx.fillText('LevelPlay v9.0',20,40);
  ctx.fillStyle='#8b5cf6';ctx.font='12px sans-serif';
  ctx.fillText('배우고, 올리고, 증명하라',20,60);
  const u=U();const streak=getStreak();const league=getLeague();
  const stats=[
    ['\u{1F525} 연속',streak.current+'일'],
    ['\u{1F3C6} 리그',league.nm],
    ['⭐ XP',(u.xp||0).toLocaleString()],
    ['\u{1F4D6} 레슨',(u.completedLessons||[]).length+'개'],
    ['\u{1F3AF} 퀴즈',(u.quizDone||0)+'개'],
    ['\u{1F3C5} 배지',(u.badges||[]).length+'개']
  ];
  stats.forEach((s,i)=>{
    const col=i%3,row=Math.floor(i/3);
    const x=20+col*195,y=90+row*130;
    ctx.fillStyle='rgba(139,92,246,.1)';
    ctx.beginPath();ctx.roundRect(x,y,180,110,10);ctx.fill();
    ctx.strokeStyle='rgba(139,92,246,.2)';ctx.stroke();
    ctx.fillStyle='#94a3b8';ctx.font='11px sans-serif';
    ctx.fillText(s[0],x+12,y+30);
    ctx.fillStyle='#e2e8f0';ctx.font='bold 28px sans-serif';
    ctx.fillText(s[1],x+12,y+70);
  });
  ctx.fillStyle='#94a3b8';ctx.font='10px sans-serif';
  ctx.fillText(_today()+' | github.com/bsy522-dot/levelplay',20,H-15);
}
window.v9DownloadShare=function(){
  const c=document.getElementById('v9ShareCanvas');if(!c)return;
  v9Sfx('share_gen');
  const a=document.createElement('a');a.download='levelplay-v9-card.png';a.href=c.toDataURL();a.click();
};
window.v9CopyShare=function(){
  const c=document.getElementById('v9ShareCanvas');if(!c)return;
  c.toBlob(b=>{if(b){navigator.clipboard.write([new ClipboardItem({'image/png':b})]).then(()=>{v9Sfx('share_copy');});}});
};

// ===== 10. ACHIEVEMENT MILESTONES =====
const V9_MILESTONES=[
  {id:'streak_7',nm:'일주일 전사',desc:'7일 연속 학습',check:()=>getStreak().current>=7,icon:'\u{1F525}'},
  {id:'streak_30',nm:'한달 현자',desc:'30일 연속 학습',check:()=>getStreak().current>=30,icon:'\u{1F31F}'},
  {id:'league_silver',nm:'실버 승급',desc:'실버 리그 달성',check:()=>getLeague().id!=='bronze',icon:'\u{1F948}'},
  {id:'league_gold',nm:'골드 승급',desc:'골드 리그 달성',check:()=>{const l=getLeague();return l.id==='gold'||l.id==='diamond'||l.id==='master';},icon:'\u{1F947}'},
  {id:'sr_10',nm:'반복의 힘',desc:'스페이스드 반복 10장 완료',check:()=>getSRDeck().filter(c=>c.reps>=3).length>=10,icon:'\u{1F4DA}'},
  {id:'story_all',nm:'이야기꾼',desc:'모든 스토리 완료',check:()=>{const u=U();return (u.v9stories||0)>=STORIES.length;},icon:'\u{1F4D6}'},
  {id:'listen_10',nm:'귀 밝은 학생',desc:'듣기 퀴즈 10문제',check:()=>{const u=U();return (u.v9listen||0)>=10;},icon:'\u{1F3A7}'},
  {id:'wrong_clear',nm:'오답 정복자',desc:'오답 노트 전부 해결',check:()=>getWrongNotes().length===0&&getSRDeck().length>0,icon:'\u{2705}'},
  {id:'plan_5',nm:'계획적인 학습자',desc:'플래너 5회 올클리어',check:()=>{const u=U();return (u.v9planDone||0)>=5;},icon:'\u{1F4C5}'},
  {id:'xp_1000',nm:'천의 경지',desc:'총 XP 1000 달성',check:()=>(U().xp||0)>=1000,icon:'\u{2B50}'},
  {id:'xp_5000',nm:'만능 학습자',desc:'총 XP 5000 달성',check:()=>(U().xp||0)>=5000,icon:'\u{1F48E}'},
  {id:'v9_explorer',nm:'v9 탐험가',desc:'v9 기능 8개 이상 사용',check:()=>{const u=U();return (u.v9features||[]).length>=8;},icon:'\u{1F680}'}
];
function checkMilestones(){
  const u=U();if(!u.v9milestones)u.v9milestones=[];
  let newOnes=[];
  V9_MILESTONES.forEach(m=>{
    if(!u.v9milestones.includes(m.id)&&m.check()){
      u.v9milestones.push(m.id);newOnes.push(m);
    }
  });
  if(newOnes.length){S(u);v9Sfx('milestone_reach');}
  return newOnes;
}

// ===== 50 NEW QUIZZES =====
const V9_QUIZZES=[
  {q:'Khan Academy의 설립자는?',a:['살만 칸','빌 게이츠','마크 주커버그','엘론 머스크'],c:0,cat:'일반'},
  {q:'스페이스드 반복의 최적 복습 간격은?',a:['1-3-7-14일','매일','1주일마다','1달마다'],c:0,cat:'학습법'},
  {q:'Duolingo의 마스코트 이름은?',a:['Duo','Lingo','Bird','Owl'],c:0,cat:'일반'},
  {q:'피보나치 수열의 다음 수는? 1,1,2,3,5,?',a:['8','7','6','9'],c:0,cat:'수학'},
  {q:'광합성에 필요한 기체는?',a:['이산화탄소','산소','질소','수소'],c:0,cat:'과학'},
  {q:'DNA의 이중나선 구조를 발견한 사람은?',a:['왓슨과 크릭','뉴턴','아인슈타인','다윈'],c:0,cat:'과학'},
  {q:'파이(π)의 소수점 첫째자리까지의 값은?',a:['3.1','3.2','3.0','3.3'],c:0,cat:'수학'},
  {q:'컴퓨터에서 1바이트는 몇 비트?',a:['8비트','4비트','16비트','32비트'],c:0,cat:'코딩'},
  {q:'한글의 자음 기본자 5개가 아닌 것은?',a:['ㅂ','ㄱ','ㄴ','ㅁ'],c:0,cat:'한국어'},
  {q:'지구에서 가장 깊은 곳은?',a:['마리아나 해구','에베레스트','그랜드 캐니언','바이칼 호'],c:0,cat:'지구과학'},
  {q:'E=mc²에서 c는 무엇의 속도?',a:['빛','소리','전자','중력파'],c:0,cat:'물리'},
  {q:'조선의 마지막 왕은?',a:['순종','고종','철종','영조'],c:0,cat:'역사'},
  {q:'프로그래밍에서 반복문이 아닌 것은?',a:['if','for','while','do-while'],c:0,cat:'코딩'},
  {q:'물의 화학식은?',a:['H₂O','CO₂','NaCl','O₂'],c:0,cat:'화학'},
  {q:'삼각형에서 가장 긴 변의 대각은?',a:['가장 큰 각','가장 작은 각','직각','둔각'],c:0,cat:'수학'},
  {q:'세계에서 가장 많이 사용되는 프로그래밍 언어(2024)는?',a:['Python','Java','C++','JavaScript'],c:0,cat:'코딩'},
  {q:'인체에서 가장 큰 장기는?',a:['간','뇌','심장','폐'],c:0,cat:'생물'},
  {q:'음악에서 4/4박자의 한 마디에 4분음표는 몇 개?',a:['4개','2개','8개','3개'],c:0,cat:'음악'},
  {q:'태양계에서 가장 큰 행성은?',a:['목성','토성','해왕성','천왕성'],c:0,cat:'천문'},
  {q:'이진법 1010을 10진법으로 바꾸면?',a:['10','8','12','6'],c:0,cat:'코딩'},
  {q:'고려를 세운 인물은?',a:['왕건','이성계','김유신','을지문덕'],c:0,cat:'역사'},
  {q:'빛의 3원색이 아닌 것은?',a:['노랑','빨강','초록','파랑'],c:0,cat:'과학'},
  {q:'영어에서 가장 많이 쓰이는 글자는?',a:['E','A','T','S'],c:0,cat:'영어'},
  {q:'원의 넓이 공식은?',a:['πr²','2πr','πd','r²'],c:0,cat:'수학'},
  {q:'CPU의 풀네임은?',a:['Central Processing Unit','Computer Personal Unit','Central Power Unit','Core Process Unit'],c:0,cat:'코딩'},
  {q:'대한민국 임시정부가 수립된 해는?',a:['1919년','1945년','1910년','1948년'],c:0,cat:'역사'},
  {q:'절대영도는 섭씨 몇 도?',a:['-273.15°C','-100°C','0°C','-460°C'],c:0,cat:'물리'},
  {q:'HTML에서 가장 큰 제목 태그는?',a:['h1','h6','title','header'],c:0,cat:'코딩'},
  {q:'세포의 에너지 공장이라 불리는 것은?',a:['미토콘드리아','리보솜','골지체','핵'],c:0,cat:'생물'},
  {q:'베토벤의 교향곡 9번의 별명은?',a:['합창','운명','전원','영웅'],c:0,cat:'음악'},
  {q:'지구의 자전 주기는?',a:['약 24시간','약 12시간','약 365일','약 30일'],c:0,cat:'지구과학'},
  {q:'소수(prime)가 아닌 것은?',a:['9','2','3','7'],c:0,cat:'수학'},
  {q:'JavaScript에서 배열의 길이를 구하는 속성은?',a:['.length','.size','.count','.len'],c:0,cat:'코딩'},
  {q:'광합성의 결과 만들어지는 기체는?',a:['산소','이산화탄소','질소','수소'],c:0,cat:'과학'},
  {q:'세종대왕이 한글을 반포한 해는?',a:['1446년','1443년','1392년','1500년'],c:0,cat:'역사'},
  {q:'소리의 3요소가 아닌 것은?',a:['색깔','높낮이','세기','음색'],c:0,cat:'물리'},
  {q:'Python에서 리스트에 요소를 추가하는 메서드는?',a:['append','add','push','insert'],c:0,cat:'코딩'},
  {q:'인체의 뼈는 총 몇 개?',a:['206개','300개','100개','150개'],c:0,cat:'생물'},
  {q:'태평양은 지구 표면의 약 몇 %?',a:['30%','20%','50%','10%'],c:0,cat:'지구과학'},
  {q:'수소의 원자번호는?',a:['1','2','3','0'],c:0,cat:'화학'},
  {q:'알고리즘의 시간복잡도 O(n log n)인 정렬은?',a:['병합정렬','버블정렬','선택정렬','삽입정렬'],c:0,cat:'코딩'},
  {q:'고구려를 세운 인물은?',a:['주몽','박혁거세','온조','김수로'],c:0,cat:'역사'},
  {q:'전류의 단위는?',a:['암페어(A)','볼트(V)','옴(Ω)','와트(W)'],c:0,cat:'물리'},
  {q:'영어 현재완료 시제에 쓰이는 조동사는?',a:['have/has','do/does','will','would'],c:0,cat:'영어'},
  {q:'정삼각형의 한 내각은?',a:['60도','90도','45도','120도'],c:0,cat:'수학'},
  {q:'CSS에서 flex 컨테이너의 기본 방향은?',a:['row','column','row-reverse','column-reverse'],c:0,cat:'코딩'},
  {q:'달의 공전 주기는 약?',a:['27.3일','30일','24시간','365일'],c:0,cat:'천문'},
  {q:'한국 전쟁이 시작된 해는?',a:['1950년','1945년','1953년','1948년'],c:0,cat:'역사'},
  {q:'pH 7은 무엇을 의미하나요?',a:['중성','산성','염기성','강산'],c:0,cat:'화학'},
  {q:'스택(Stack)의 특징은?',a:['LIFO','FIFO','LILO','Random'],c:0,cat:'코딩'}
];

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown',function(e){
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
  if(!e.shiftKey)return;
  const map={
    'K':()=>v9ShowPanel('streak'),'L':()=>v9ShowPanel('league'),
    'R':()=>v9ShowPanel('spaced'),'T':()=>v9ShowPanel('story'),
    'Y':()=>v9ShowPanel('listen'),'W':()=>v9ShowPanel('wrong'),
    'P':()=>v9ShowPanel('planner'),'Q':()=>v9ShowPanel('share')
  };
  if(map[e.key]){e.preventDefault();map[e.key]();}
});

// ===== PANEL MANAGEMENT =====
let v9ActivePanel='dashboard';
function v9ShowPanel(panel){
  v9ActivePanel=panel;v9RefreshPanel();
  const u=U();if(!u.v9features)u.v9features=[];
  if(!u.v9features.includes(panel)){u.v9features.push(panel);S(u);}
  checkMilestones();
}
function v9RefreshPanel(){
  const container=document.getElementById('v9Container');
  if(!container)return;
  let html='';
  switch(v9ActivePanel){
    case 'dashboard':html=renderStreak()+renderLeague()+renderProgressDashboard();break;
    case 'streak':html=renderStreak();break;
    case 'league':html=renderLeague();break;
    case 'spaced':html=renderSR();break;
    case 'story':html=renderStoryMode();break;
    case 'listen':html=renderListenQuiz();break;
    case 'wrong':html=renderWrongNotes();break;
    case 'planner':html=renderPlanner();break;
    case 'share':html=renderShareCard();break;
    default:html=renderStreak()+renderLeague()+renderProgressDashboard();
  }
  container.innerHTML=html;
  if(v9ActivePanel==='dashboard'||v9ActivePanel==='share')setTimeout(()=>{
    drawProgressCanvas();drawShareCard();
  },50);
}
window.v9ShowPanel=v9ShowPanel;

// ===== FAB BUTTONS =====
function createFAB(){
  const fab=document.createElement('div');fab.className='v9-fab';fab.id='v9Fab';
  fab.innerHTML=[
    ['\u{1F4CA}','dashboard','대시보드'],
    ['\u{1F525}','streak','스트릭'],
    ['\u{1F3C6}','league','리그'],
    ['\u{1F4DA}','spaced','반복학습'],
    ['\u{1F4D6}','story','스토리'],
    ['\u{1F3A7}','listen','듣기'],
    ['\u{274C}','wrong','오답'],
    ['\u{1F4C5}','planner','플래너']
  ].map(([icon,panel,title])=>`<button onclick="v9ShowPanel('${panel}')" title="${title}">${icon}</button>`).join('');
  document.body.appendChild(fab);
}

// ===== INJECT INTO HOME =====
function v9InjectHome(){
  const homePage=document.getElementById('pg0');
  if(!homePage)return;
  const existing=document.getElementById('v9Container');
  if(existing)return;
  const sec=document.createElement('div');
  sec.id='v9Container';
  sec.style.marginTop='10px';
  const firstSec=homePage.querySelector('.sec');
  if(firstSec)homePage.insertBefore(sec,firstSec);
  else homePage.prepend(sec);
  updateStreak();
  v9RefreshPanel();
}

// ===== HOOK INTO QUIZ SYSTEM =====
const origChkA=window.chkA;
window.chkA=function(btn,ok){
  if(origChkA)origChkA(btn,ok);
  if(!ok){
    const qzEl=btn.closest('.qz');
    if(qzEl){
      const qText=qzEl.querySelector('.qz-q');
      const correctBtn=qzEl.querySelector('[data-correct="true"]');
      if(qText&&correctBtn){
        addWrongNote(qText.textContent,correctBtn.textContent,'퀴즈');
      }
    }
  }else{
    updateStreak();
    const u=U();u.xp=(u.xp||0)+10;S(u);
  }
};

// ===== INIT =====
function v9Init(){
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{v9InjectHome();createFAB();});
  }else{
    setTimeout(()=>{v9InjectHome();createFAB();},500);
  }
}
v9Init();

})();
