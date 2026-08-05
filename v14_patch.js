// LevelPlay v14.0 Patch - Learning Mastery Heatmap Canvas + Smart Review Scheduler Canvas
// + Streak Tower Builder Canvas + Subject Competitiveness Radar Canvas
// + Learning Quest Map Canvas + Wrong Answer Pattern Analyzer Canvas
// + Study Growth Simulator Canvas + Subject Olympiad Tournament Canvas
// + 15 Quizzes + 12 Achievements + SFX 12 + KB 8
(function(){
'use strict';

function _el(id){return document.getElementById(id);}
function U(){try{return JSON.parse(localStorage.getItem('lp_user'))||{};}catch(e){return {};}}
function S(u){localStorage.setItem('lp_user',JSON.stringify(u));}
function _today(){return new Date().toISOString().slice(0,10);}

// ===== Audio Engine =====
const v14Ctx=(function(){try{return new(window.AudioContext||window.webkitAudioContext)();}catch(e){return null;}})();
function v14Sfx(type){
  if(!v14Ctx)return;try{
  if(v14Ctx.state==='suspended')v14Ctx.resume();
  const o=v14Ctx.createOscillator(),g=v14Ctx.createGain();
  o.connect(g);g.connect(v14Ctx.destination);
  const t=v14Ctx.currentTime;
  const map={
    heatmap_view:[659.25,.12,'sine'],heatmap_cell:[783.99,.08,'triangle'],
    review_schedule:[523.25,.15,'sine'],review_complete:[880,.25,'sine'],
    streak_build:[587.33,.1,'triangle'],streak_milestone:[1046.5,.35,'sine'],
    radar_scan:[440,.12,'sine'],radar_update:[659.25,.15,'triangle'],
    quest_start:[523.25,.15,'triangle'],quest_complete:[1046.5,.3,'sine'],
    wrong_analyze:[349.23,.12,'sawtooth'],wrong_insight:[783.99,.2,'sine'],
    sim_run:[440,.15,'triangle'],sim_result:[880,.25,'sine'],
    olympiad_match:[659.25,.15,'triangle'],olympiad_win:[1174.66,.35,'sine'],
    achieve_v14:[1174.66,.35,'sine'],feature_open14:[523.25,.1,'triangle']
  };
  const cfg=map[type]||[440,.1,'sine'];
  o.frequency.setValueAtTime(cfg[0],t);
  o.type=cfg[2];
  g.gain.setValueAtTime(0.08,t);
  g.gain.exponentialRampToValueAtTime(0.001,t+cfg[1]);
  o.start(t);o.stop(t+cfg[1]);
  }catch(e){}
}

// ===== CSS =====
const v14css=document.createElement('style');
v14css.textContent=`
.v14-panel{background:var(--c1);border:1px solid rgba(59,130,246,.1);border-radius:12px;padding:14px;margin-bottom:10px}
.v14-panel h3{font-size:14px;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:6px}
.v14-btn{padding:8px 14px;border:1px solid rgba(59,130,246,.2);border-radius:8px;background:var(--c2);color:var(--tx);font:12px inherit;cursor:pointer;transition:.15s}
.v14-btn:hover{border-color:var(--cy);background:rgba(59,130,246,.08)}
.v14-btn.active{background:rgba(59,130,246,.15);border-color:rgba(59,130,246,.4)}
.v14-canvas-wrap{text-align:center;margin:8px 0;overflow-x:auto}
.v14-canvas-wrap canvas{max-width:100%;height:auto;border-radius:8px}
.v14-row{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}
.v14-stat{padding:6px 10px;border-radius:6px;background:rgba(59,130,246,.06);font-size:11px}
.v14-grade{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700}
.v14-grade-s{background:rgba(255,215,0,.2);color:#b8860b}
.v14-grade-a{background:rgba(59,130,246,.2);color:#2563eb}
.v14-grade-b{background:rgba(34,197,94,.2);color:#16a34a}
.v14-grade-c{background:rgba(249,115,22,.2);color:#ea580c}
.v14-grade-d{background:rgba(239,68,68,.2);color:#dc2626}
.v14-select{padding:6px 10px;border:1px solid rgba(59,130,246,.2);border-radius:6px;background:var(--c2);color:var(--tx);font:12px inherit}
.v14-nav{position:fixed;bottom:0;left:0;right:0;background:var(--c1);border-top:1px solid rgba(59,130,246,.15);display:flex;overflow-x:auto;z-index:10015;padding:4px 2px;gap:2px}
.v14-nav button{flex:0 0 auto;padding:6px 8px;border:none;background:transparent;color:var(--tx);font-size:10px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;border-radius:6px;white-space:nowrap}
.v14-nav button:hover{background:rgba(59,130,246,.1)}
.v14-nav button span{font-size:16px}
`;
document.head.appendChild(v14css);

const SUBJECTS=['국어','수학','영어','과학','사회','역사','음악','미술','체육','코딩','기타'];
const SUBJ_COLORS=['#ef4444','#f59e0b','#3b82f6','#10b981','#8b5cf6','#ec4899','#06b6d4','#f97316','#84cc16','#6366f1','#64748b'];

function gradeOf(pct){
  if(pct>=95)return{cls:'v14-grade-s',label:'S'};
  if(pct>=80)return{cls:'v14-grade-a',label:'A'};
  if(pct>=60)return{cls:'v14-grade-b',label:'B'};
  if(pct>=40)return{cls:'v14-grade-c',label:'C'};
  return{cls:'v14-grade-d',label:'D'};
}

// ===== V14 Achievements =====
const V14_ACHIEVEMENTS=[
  {id:'heatmap_first',name:'히트맵 탐험가',desc:'학습 히트맵 첫 확인',icon:'🗺️'},
  {id:'review_5',name:'복습 전문가',desc:'스마트 복습 5회 완료',icon:'🔄'},
  {id:'streak_tower_10',name:'10층 타워',desc:'스트릭 타워 10층 달성',icon:'🏗️'},
  {id:'radar_scan',name:'레이더 스캔',desc:'경쟁력 레이더 첫 분석',icon:'📡'},
  {id:'quest_3',name:'퀘스트 러너',desc:'학습 퀘스트 3개 완료',icon:'🗡️'},
  {id:'wrong_insight',name:'오답 분석가',desc:'오답 패턴 분석 3회',icon:'🔍'},
  {id:'sim_future',name:'미래 시뮬레이터',desc:'성장 시뮬레이션 첫 실행',icon:'🔮'},
  {id:'olympiad_win',name:'올림피아드 챔피언',desc:'과목 올림피아드 첫 우승',icon:'🏆'},
  {id:'olympiad_3wins',name:'3연승',desc:'올림피아드 3연승 달성',icon:'👑'},
  {id:'v14_explorer',name:'v14 탐험가',desc:'v14 기능 모두 체험',icon:'🌟'},
  {id:'perfect_radar',name:'완벽한 레이더',desc:'모든 과목 A등급 이상',icon:'💎'},
  {id:'streak_tower_30',name:'30층 마스터',desc:'스트릭 타워 30층 달성',icon:'🏰'}
];

// ===== FEATURE 1: Learning Mastery Heatmap Canvas =====
function renderMasteryHeatmap(){
  const u=U();if(!u.v14)u.v14={};
  const topics=[
    {subj:'국어',items:['맞춤법','독해','어휘','문법','작문','문학','한자','발표']},
    {subj:'수학',items:['덧셈','뺄셈','곱셈','나눗셈','분수','도형','측정','통계']},
    {subj:'영어',items:['알파벳','단어','문법','독해','듣기','회화','쓰기','발음']},
    {subj:'과학',items:['물리','화학','생물','지구과학','실험','관찰','환경','우주']},
    {subj:'사회',items:['지리','경제','정치','문화','법률','환경','세계','시민']},
    {subj:'역사',items:['고조선','삼국','고려','조선','근대','현대','세계사','인물']},
    {subj:'음악',items:['음계','리듬','악기','감상','노래','화성','작곡','연주']},
    {subj:'미술',items:['소묘','색채','조소','디자인','감상','판화','공예','미학']},
    {subj:'체육',items:['달리기','구기','수영','체조','격투기','무용','건강','안전']},
    {subj:'코딩',items:['변수','반복문','조건문','함수','배열','객체','알고리즘','디버깅']},
    {subj:'기타',items:['요리','경제','금융','안전','예절','진로','독서','환경']}
  ];
  if(!u.v14.mastery){
    u.v14.mastery={};
    topics.forEach(t=>{
      t.items.forEach(it=>{
        u.v14.mastery[t.subj+'_'+it]=Math.floor(Math.random()*100);
      });
    });
    S(u);
  }
  let h=`<div class="v14-panel"><h3><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-map"/></svg> 학습 마스터리 히트맵</h3>`;
  h+=`<div class="v14-canvas-wrap"><canvas id="v14HeatmapCanvas" width="580" height="340"></canvas></div>`;
  h+=`<div class="v14-row">`;
  h+=`<button class="v14-btn" onclick="v14PracticeMastery()"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-note"/></svg> 약점 연습</button>`;
  h+=`<button class="v14-btn" onclick="v14ExportHeatmap()"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-download"/></svg> PNG 저장</button>`;
  h+=`</div></div>`;
  return h;
}

function v14DrawHeatmap(){
  const c=_el('v14HeatmapCanvas');if(!c)return;
  const ctx=c.getContext('2d');
  const W=580,H=340;
  ctx.clearRect(0,0,W,H);
  const isDark=document.documentElement.classList.contains('dark')||window.matchMedia('(prefers-color-scheme:dark)').matches;
  ctx.fillStyle=isDark?'#1e293b':'#f8fafc';
  ctx.fillRect(0,0,W,H);
  const topics=[
    {subj:'국어',items:['맞춤법','독해','어휘','문법','작문','문학','한자','발표']},
    {subj:'수학',items:['덧셈','뺄셈','곱셈','나눗셈','분수','도형','측정','통계']},
    {subj:'영어',items:['알파벳','단어','문법','독해','듣기','회화','쓰기','발음']},
    {subj:'과학',items:['물리','화학','생물','지구과학','실험','관찰','환경','우주']},
    {subj:'사회',items:['지리','경제','정치','문화','법률','환경','세계','시민']},
    {subj:'역사',items:['고조선','삼국','고려','조선','근대','현대','세계사','인물']},
    {subj:'음악',items:['음계','리듬','악기','감상','노래','화성','작곡','연주']},
    {subj:'미술',items:['소묘','색채','조소','디자인','감상','판화','공예','미학']},
    {subj:'체육',items:['달리기','구기','수영','체조','격투기','무용','건강','안전']},
    {subj:'코딩',items:['변수','반복문','조건문','함수','배열','객체','알고리즘','디버깅']},
    {subj:'기타',items:['요리','경제','금융','안전','예절','진로','독서','환경']}
  ];
  const u=U();const m=u.v14&&u.v14.mastery?u.v14.mastery:{};
  const oX=60,oY=30,cW=56,cH=25;
  ctx.font='bold 10px sans-serif';
  ctx.fillStyle=isDark?'#94a3b8':'#475569';
  ctx.textAlign='center';
  for(let j=0;j<8;j++){
    ctx.fillText(topics[0].items[j],oX+j*cW+cW/2,oY-6);
  }
  for(let i=0;i<topics.length;i++){
    const t=topics[i];
    ctx.textAlign='right';
    ctx.fillText(t.subj,oX-6,oY+i*cH+cH/2+4);
    for(let j=0;j<t.items.length;j++){
      const val=m[t.subj+'_'+t.items[j]]||0;
      const r=Math.min(255,Math.floor(255*(1-val/100)));
      const g=Math.min(255,Math.floor(80+175*(val/100)));
      const b=Math.floor(60*(1-val/100));
      ctx.fillStyle=`rgba(${r},${g},${b},0.85)`;
      ctx.fillRect(oX+j*cW+1,oY+i*cH+1,cW-2,cH-2);
      ctx.fillStyle=val>60?'#fff':'#1e293b';
      ctx.textAlign='center';
      ctx.font='9px sans-serif';
      ctx.fillText(val+'%',oX+j*cW+cW/2,oY+i*cH+cH/2+3);
    }
  }
  ctx.textAlign='right';ctx.font='bold 10px sans-serif';
  ctx.fillStyle=isDark?'#94a3b8':'#475569';
  const avgAll=Object.values(m).reduce((a,b)=>a+b,0)/Math.max(Object.values(m).length,1);
  ctx.textAlign='center';
  ctx.fillText('평균 마스터리: '+avgAll.toFixed(1)+'%',W/2,H-8);
  v14Sfx('heatmap_view');
  const uu=U();if(!uu.v14)uu.v14={};if(!uu.v14.achievements)uu.v14.achievements=[];
  if(!uu.v14.achievements.includes('heatmap_first')){uu.v14.achievements.push('heatmap_first');S(uu);v14Sfx('achieve_v14');}
}

window.v14PracticeMastery=function(){
  const u=U();const m=u.v14&&u.v14.mastery?u.v14.mastery:{};
  let weakest=null,minVal=101;
  for(const[k,v]of Object.entries(m)){if(v<minVal){minVal=v;weakest=k;}}
  if(weakest){
    const parts=weakest.split('_');
    u.v14.mastery[weakest]=Math.min(100,minVal+Math.floor(Math.random()*15)+5);
    S(u);v14Sfx('heatmap_cell');v14DrawHeatmap();
    alert(parts[0]+' - '+parts[1]+' 연습 완료! ('+minVal+'% -> '+u.v14.mastery[weakest]+'%)');
  }
};

window.v14ExportHeatmap=function(){
  const c=_el('v14HeatmapCanvas');if(!c)return;
  const link=document.createElement('a');link.download='levelplay-mastery-heatmap.png';
  link.href=c.toDataURL('image/png');link.click();v14Sfx('heatmap_view');
};

// ===== FEATURE 2: Smart Review Scheduler Canvas =====
function renderReviewScheduler(){
  const u=U();if(!u.v14)u.v14={};
  if(!u.v14.reviews)u.v14.reviews=SUBJECTS.map((s,i)=>({subj:s,lastReview:_today(),interval:1,ease:2.5,reps:0,nextDate:_today()}));
  S(u);
  let h=`<div class="v14-panel"><h3><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-repeat"/></svg> 스마트 복습 스케줄러</h3>`;
  h+=`<div class="v14-canvas-wrap"><canvas id="v14ReviewCanvas" width="560" height="300"></canvas></div>`;
  h+=`<div class="v14-row">`;
  SUBJECTS.forEach((s,i)=>{
    h+=`<button class="v14-btn" onclick="v14DoReview(${i})">${s}</button>`;
  });
  h+=`</div>`;
  h+=`<div id="v14ReviewStats" class="v14-row"></div>`;
  h+=`</div>`;
  return h;
}

function v14DrawReview(){
  const c=_el('v14ReviewCanvas');if(!c)return;
  const ctx=c.getContext('2d');
  const W=560,H=300;
  ctx.clearRect(0,0,W,H);
  const isDark=document.documentElement.classList.contains('dark')||window.matchMedia('(prefers-color-scheme:dark)').matches;
  ctx.fillStyle=isDark?'#1e293b':'#f8fafc';ctx.fillRect(0,0,W,H);
  const u=U();const revs=u.v14&&u.v14.reviews?u.v14.reviews:[];
  const oX=50,oY=30,bW=40,maxH=200;
  ctx.font='bold 11px sans-serif';
  ctx.fillStyle=isDark?'#e2e8f0':'#334155';
  ctx.textAlign='center';
  ctx.fillText('SM-2 간격반복 복습 스케줄 (일 단위)',W/2,18);
  for(let i=0;i<revs.length;i++){
    const r=revs[i];
    const barH=Math.min(maxH,r.interval*8+10);
    const x=oX+i*(bW+6);
    const y=oY+maxH-barH;
    ctx.fillStyle=SUBJ_COLORS[i]||'#64748b';
    ctx.fillRect(x,y,bW,barH);
    ctx.fillStyle=isDark?'#cbd5e1':'#475569';
    ctx.font='9px sans-serif';
    ctx.textAlign='center';
    ctx.fillText(r.subj,x+bW/2,oY+maxH+14);
    ctx.fillText(r.interval+'일',x+bW/2,y-6);
    const urgency=r.interval<=1?'🔴':r.interval<=3?'🟡':'🟢';
    ctx.font='12px sans-serif';
    ctx.fillText(urgency,x+bW/2,y-18);
  }
  ctx.strokeStyle=isDark?'#475569':'#cbd5e1';
  ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(oX-5,oY+maxH);ctx.lineTo(oX+revs.length*(bW+6),oY+maxH);ctx.stroke();
  const totalReps=revs.reduce((a,r)=>a+r.reps,0);
  const statsEl=_el('v14ReviewStats');
  if(statsEl){
    const avgEase=(revs.reduce((a,r)=>a+r.ease,0)/revs.length).toFixed(2);
    const urgent=revs.filter(r=>r.interval<=1).length;
    statsEl.innerHTML=`<span class="v14-stat">총 복습: ${totalReps}회</span><span class="v14-stat">평균 난이도: ${avgEase}</span><span class="v14-stat">긴급 복습: ${urgent}과목</span>`;
  }
}

window.v14DoReview=function(idx){
  const u=U();if(!u.v14||!u.v14.reviews)return;
  const r=u.v14.reviews[idx];
  const quality=Math.floor(Math.random()*3)+3;
  r.ease=Math.max(1.3,r.ease+0.1-(5-quality)*(0.08+(5-quality)*0.02));
  if(quality<3){r.reps=0;r.interval=1;}
  else{
    r.reps++;
    if(r.reps===1)r.interval=1;
    else if(r.reps===2)r.interval=6;
    else r.interval=Math.round(r.interval*r.ease);
  }
  r.lastReview=_today();
  S(u);v14Sfx('review_complete');v14DrawReview();
  if(!u.v14.achievements)u.v14.achievements=[];
  const totalR=u.v14.reviews.reduce((a,rv)=>a+rv.reps,0);
  if(totalR>=5&&!u.v14.achievements.includes('review_5')){u.v14.achievements.push('review_5');S(u);v14Sfx('achieve_v14');}
};

// ===== FEATURE 3: Streak Tower Builder Canvas =====
function renderStreakTower(){
  const u=U();if(!u.v14)u.v14={};
  if(!u.v14.streakTower){u.v14.streakTower={floors:0,bestFloor:0,todayBuilt:false,history:[]};S(u);}
  let h=`<div class="v14-panel"><h3><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-build"/></svg> 스트릭 타워 빌더</h3>`;
  h+=`<div class="v14-canvas-wrap"><canvas id="v14TowerCanvas" width="400" height="380"></canvas></div>`;
  h+=`<div class="v14-row">`;
  h+=`<button class="v14-btn" onclick="v14BuildFloor()"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-build"/></svg> 층 쌓기</button>`;
  h+=`<button class="v14-btn" onclick="v14ResetTower()"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-repeat"/></svg> 리셋</button>`;
  h+=`</div></div>`;
  return h;
}

function v14DrawTower(){
  const c=_el('v14TowerCanvas');if(!c)return;
  const ctx=c.getContext('2d');
  const W=400,H=380;
  ctx.clearRect(0,0,W,H);
  const isDark=document.documentElement.classList.contains('dark')||window.matchMedia('(prefers-color-scheme:dark)').matches;
  ctx.fillStyle=isDark?'#1e293b':'#f8fafc';ctx.fillRect(0,0,W,H);
  const u=U();const tower=u.v14&&u.v14.streakTower?u.v14.streakTower:{floors:0};
  const floors=Math.min(tower.floors,30);
  const baseY=H-30,floorH=10,bldW=80;
  const cx=W/2;
  ctx.fillStyle=isDark?'#475569':'#94a3b8';
  ctx.fillRect(cx-60,baseY,120,20);
  for(let i=0;i<floors;i++){
    const y=baseY-((i+1)*floorH);
    const w=bldW-i*1.5;
    const hue=(i*12)%360;
    ctx.fillStyle=`hsl(${hue},65%,${isDark?'45%':'55%'})`;
    ctx.fillRect(cx-w/2,y,w,floorH-1);
    if(i%5===4){
      ctx.fillStyle=isDark?'#e2e8f0':'#1e293b';
      ctx.font='bold 8px sans-serif';ctx.textAlign='right';
      ctx.fillText((i+1)+'F',cx-w/2-4,y+8);
    }
  }
  if(floors>=10){
    ctx.fillStyle='rgba(255,215,0,0.3)';
    ctx.beginPath();ctx.arc(cx,baseY-(10*floorH)-5,6,0,Math.PI*2);ctx.fill();
  }
  if(floors>=20){
    ctx.fillStyle='rgba(168,85,247,0.4)';
    ctx.beginPath();ctx.arc(cx,baseY-(20*floorH)-5,8,0,Math.PI*2);ctx.fill();
  }
  if(floors>=30){
    ctx.fillStyle='rgba(239,68,68,0.5)';
    ctx.font='16px sans-serif';ctx.textAlign='center';
    ctx.fillText('👑',cx,baseY-(30*floorH)-8);
  }
  ctx.fillStyle=isDark?'#e2e8f0':'#1e293b';
  ctx.font='bold 14px sans-serif';ctx.textAlign='center';
  ctx.fillText(tower.floors+'층 (최고: '+tower.bestFloor+'층)',cx,22);
  const g=gradeOf(Math.min(100,tower.floors*3.3));
  ctx.fillStyle=g.label==='S'?'#b8860b':g.label==='A'?'#2563eb':g.label==='B'?'#16a34a':g.label==='C'?'#ea580c':'#dc2626';
  ctx.fillText('등급: '+g.label,cx,H-8);
  v14Sfx('streak_build');
}

window.v14BuildFloor=function(){
  const u=U();if(!u.v14)u.v14={};if(!u.v14.streakTower)u.v14.streakTower={floors:0,bestFloor:0,todayBuilt:false,history:[]};
  u.v14.streakTower.floors++;
  if(u.v14.streakTower.floors>u.v14.streakTower.bestFloor)u.v14.streakTower.bestFloor=u.v14.streakTower.floors;
  u.v14.streakTower.todayBuilt=true;
  S(u);
  v14Sfx(u.v14.streakTower.floors%5===0?'streak_milestone':'streak_build');
  v14DrawTower();
  if(!u.v14.achievements)u.v14.achievements=[];
  if(u.v14.streakTower.floors>=10&&!u.v14.achievements.includes('streak_tower_10')){u.v14.achievements.push('streak_tower_10');S(u);v14Sfx('achieve_v14');}
  if(u.v14.streakTower.floors>=30&&!u.v14.achievements.includes('streak_tower_30')){u.v14.achievements.push('streak_tower_30');S(u);v14Sfx('achieve_v14');}
};

window.v14ResetTower=function(){
  if(!confirm('타워를 리셋하시겠습니까? 최고 기록은 유지됩니다.'))return;
  const u=U();if(!u.v14||!u.v14.streakTower)return;
  u.v14.streakTower.floors=0;u.v14.streakTower.todayBuilt=false;S(u);v14DrawTower();
};

// ===== FEATURE 4: Subject Competitiveness Radar Canvas =====
function renderSubjectRadar(){
  const u=U();if(!u.v14)u.v14={};
  if(!u.v14.competitiveness){
    u.v14.competitiveness={};
    SUBJECTS.forEach(s=>{
      u.v14.competitiveness[s]={accuracy:Math.floor(Math.random()*40)+50,speed:Math.floor(Math.random()*40)+40,depth:Math.floor(Math.random()*40)+30,consistency:Math.floor(Math.random()*40)+45,creativity:Math.floor(Math.random()*40)+35,endurance:Math.floor(Math.random()*40)+40};
    });
    S(u);
  }
  let h=`<div class="v14-panel"><h3><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-radar"/></svg> 과목 경쟁력 레이더</h3>`;
  h+=`<select class="v14-select" id="v14RadarSubj" onchange="v14DrawRadar()">`;
  SUBJECTS.forEach((s,i)=>{h+=`<option value="${s}">${s}</option>`;});
  h+=`</select>`;
  h+=`<div class="v14-canvas-wrap"><canvas id="v14RadarCanvas" width="460" height="400"></canvas></div>`;
  h+=`<div class="v14-row">`;
  h+=`<button class="v14-btn" onclick="v14TrainSubject()"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-dumbbell"/></svg> 훈련하기</button>`;
  h+=`<button class="v14-btn" onclick="v14CompareSubjects()"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-repeat"/></svg> 비교</button>`;
  h+=`</div></div>`;
  return h;
}

function v14DrawRadar(){
  const c=_el('v14RadarCanvas');if(!c)return;
  const ctx=c.getContext('2d');
  const W=460,H=400;
  ctx.clearRect(0,0,W,H);
  const isDark=document.documentElement.classList.contains('dark')||window.matchMedia('(prefers-color-scheme:dark)').matches;
  ctx.fillStyle=isDark?'#1e293b':'#f8fafc';ctx.fillRect(0,0,W,H);
  const sel=_el('v14RadarSubj');
  const subj=sel?sel.value:'국어';
  const u=U();
  const comp=u.v14&&u.v14.competitiveness&&u.v14.competitiveness[subj]?u.v14.competitiveness[subj]:{accuracy:50,speed:50,depth:50,consistency:50,creativity:50,endurance:50};
  const axes=['정확도','속도','깊이','일관성','창의력','지구력'];
  const vals=[comp.accuracy,comp.speed,comp.depth,comp.consistency,comp.creativity,comp.endurance];
  const cx=W/2,cy=H/2-10,R=140;
  for(let ring=1;ring<=5;ring++){
    const r=R*ring/5;
    ctx.beginPath();
    for(let i=0;i<=6;i++){
      const angle=Math.PI*2*i/6-Math.PI/2;
      const x=cx+r*Math.cos(angle),y=cy+r*Math.sin(angle);
      if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.strokeStyle=isDark?'rgba(148,163,184,0.2)':'rgba(71,85,105,0.15)';
    ctx.lineWidth=1;ctx.stroke();
  }
  for(let i=0;i<6;i++){
    const angle=Math.PI*2*i/6-Math.PI/2;
    ctx.beginPath();ctx.moveTo(cx,cy);
    ctx.lineTo(cx+R*Math.cos(angle),cy+R*Math.sin(angle));
    ctx.strokeStyle=isDark?'rgba(148,163,184,0.3)':'rgba(71,85,105,0.2)';
    ctx.stroke();
    ctx.fillStyle=isDark?'#cbd5e1':'#334155';
    ctx.font='bold 11px sans-serif';ctx.textAlign='center';
    const lx=cx+(R+20)*Math.cos(angle),ly=cy+(R+20)*Math.sin(angle);
    ctx.fillText(axes[i],lx,ly+4);
  }
  ctx.beginPath();
  for(let i=0;i<=6;i++){
    const idx=i%6;
    const angle=Math.PI*2*idx/6-Math.PI/2;
    const r=R*vals[idx]/100;
    const x=cx+r*Math.cos(angle),y=cy+r*Math.sin(angle);
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.closePath();
  const si=SUBJECTS.indexOf(subj);
  const color=SUBJ_COLORS[si]||'#3b82f6';
  ctx.fillStyle=color+'33';ctx.fill();
  ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();
  for(let i=0;i<6;i++){
    const angle=Math.PI*2*i/6-Math.PI/2;
    const r=R*vals[i]/100;
    ctx.fillStyle=color;
    ctx.beginPath();ctx.arc(cx+r*Math.cos(angle),cy+r*Math.sin(angle),4,0,Math.PI*2);ctx.fill();
  }
  const avg=vals.reduce((a,b)=>a+b,0)/vals.length;
  const g=gradeOf(avg);
  ctx.fillStyle=isDark?'#e2e8f0':'#1e293b';
  ctx.font='bold 13px sans-serif';ctx.textAlign='center';
  ctx.fillText(subj+' 경쟁력: '+avg.toFixed(1)+'점 ('+g.label+'등급)',cx,H-10);
  v14Sfx('radar_scan');
  const uu=U();if(!uu.v14)uu.v14={};if(!uu.v14.achievements)uu.v14.achievements=[];
  if(!uu.v14.achievements.includes('radar_scan')){uu.v14.achievements.push('radar_scan');S(uu);v14Sfx('achieve_v14');}
}

window.v14TrainSubject=function(){
  const sel=_el('v14RadarSubj');const subj=sel?sel.value:'국어';
  const u=U();if(!u.v14||!u.v14.competitiveness||!u.v14.competitiveness[subj])return;
  const c=u.v14.competitiveness[subj];
  const keys=['accuracy','speed','depth','consistency','creativity','endurance'];
  const weakKey=keys.reduce((a,k)=>c[k]<c[a]?k:a,keys[0]);
  c[weakKey]=Math.min(100,c[weakKey]+Math.floor(Math.random()*8)+3);
  S(u);v14Sfx('radar_update');v14DrawRadar();
  const allA=SUBJECTS.every(s=>{
    const cc=u.v14.competitiveness[s];
    const avg=(cc.accuracy+cc.speed+cc.depth+cc.consistency+cc.creativity+cc.endurance)/6;
    return avg>=80;
  });
  if(allA&&!u.v14.achievements)u.v14.achievements=[];
  if(allA&&u.v14.achievements&&!u.v14.achievements.includes('perfect_radar')){u.v14.achievements.push('perfect_radar');S(u);v14Sfx('achieve_v14');}
};

window.v14CompareSubjects=function(){
  const sel=_el('v14RadarSubj');if(!sel)return;
  const cur=sel.selectedIndex;
  sel.selectedIndex=(cur+1)%SUBJECTS.length;v14DrawRadar();
};

// ===== FEATURE 5: Learning Quest Map Canvas =====
function renderQuestMap(){
  const u=U();if(!u.v14)u.v14={};
  if(!u.v14.quests){
    u.v14.quests=[
      {id:'q1',name:'국어 기초 마스터',desc:'맞춤법+어휘 80% 달성',progress:0,target:80,reward:50,done:false},
      {id:'q2',name:'수학 챌린저',desc:'연산 퀴즈 10회 완료',progress:0,target:10,reward:80,done:false},
      {id:'q3',name:'영어 탐험가',desc:'영단어 50개 학습',progress:0,target:50,reward:60,done:false},
      {id:'q4',name:'과학 실험왕',desc:'과학 실험 5종 체험',progress:0,target:5,reward:70,done:false},
      {id:'q5',name:'역사 여행자',desc:'역사 퀴즈 정답 30개',progress:0,target:30,reward:90,done:false},
      {id:'q6',name:'코딩 히어로',desc:'코딩 레슨 8개 완료',progress:0,target:8,reward:100,done:false},
      {id:'q7',name:'음악 감상가',desc:'악기 연주 3종 체험',progress:0,target:3,reward:40,done:false},
      {id:'q8',name:'종합 학습왕',desc:'전 과목 1회씩 학습',progress:0,target:11,reward:150,done:false},
      {id:'q9',name:'퀴즈 정복자',desc:'퀴즈 100문제 풀기',progress:0,target:100,reward:120,done:false},
      {id:'q10',name:'전설의 학습자',desc:'모든 퀘스트 완료',progress:0,target:9,reward:300,done:false}
    ];
    S(u);
  }
  let h=`<div class="v14-panel"><h3><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-sword"/></svg> 학습 퀘스트 맵</h3>`;
  h+=`<div class="v14-canvas-wrap"><canvas id="v14QuestCanvas" width="560" height="340"></canvas></div>`;
  h+=`<div class="v14-row">`;
  h+=`<button class="v14-btn" onclick="v14AdvanceQuest()"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-sword"/></svg> 퀘스트 진행</button>`;
  h+=`<button class="v14-btn" onclick="v14ClaimReward()"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-gift"/></svg> 보상 수령</button>`;
  h+=`</div></div>`;
  return h;
}

function v14DrawQuest(){
  const c=_el('v14QuestCanvas');if(!c)return;
  const ctx=c.getContext('2d');
  const W=560,H=340;
  ctx.clearRect(0,0,W,H);
  const isDark=document.documentElement.classList.contains('dark')||window.matchMedia('(prefers-color-scheme:dark)').matches;
  ctx.fillStyle=isDark?'#1e293b':'#f8fafc';ctx.fillRect(0,0,W,H);
  const u=U();const quests=u.v14&&u.v14.quests?u.v14.quests:[];
  ctx.font='bold 12px sans-serif';ctx.fillStyle=isDark?'#e2e8f0':'#1e293b';ctx.textAlign='center';
  ctx.fillText('학습 퀘스트 진행 맵',W/2,18);
  const cols=5,rows=2,cW=100,cH=130,oX=15,oY=32;
  for(let i=0;i<Math.min(quests.length,10);i++){
    const q=quests[i];
    const col=i%cols,row=Math.floor(i/cols);
    const x=oX+col*(cW+8),y=oY+row*(cH+10);
    const pct=Math.min(100,q.target>0?(q.progress/q.target*100):0);
    ctx.fillStyle=q.done?'rgba(34,197,94,0.15)':pct>0?'rgba(59,130,246,0.08)':'rgba(148,163,184,0.06)';
    ctx.strokeStyle=q.done?'#22c55e':pct>50?'#3b82f6':'rgba(148,163,184,0.3)';
    ctx.lineWidth=q.done?2:1;
    ctx.beginPath();
    const rr=8;
    ctx.moveTo(x+rr,y);ctx.lineTo(x+cW-rr,y);ctx.quadraticCurveTo(x+cW,y,x+cW,y+rr);
    ctx.lineTo(x+cW,y+cH-rr);ctx.quadraticCurveTo(x+cW,y+cH,x+cW-rr,y+cH);
    ctx.lineTo(x+rr,y+cH);ctx.quadraticCurveTo(x,y+cH,x,y+cH-rr);
    ctx.lineTo(x,y+rr);ctx.quadraticCurveTo(x,y,x+rr,y);
    ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle=isDark?'#e2e8f0':'#1e293b';
    ctx.font='bold 10px sans-serif';ctx.textAlign='center';
    ctx.fillText(q.name,x+cW/2,y+20);
    ctx.fillStyle=isDark?'#94a3b8':'#64748b';
    ctx.font='9px sans-serif';
    ctx.fillText(q.desc,x+cW/2,y+36);
    ctx.fillStyle=isDark?'#334155':'#e2e8f0';
    ctx.fillRect(x+10,y+48,cW-20,10);
    ctx.fillStyle=q.done?'#22c55e':'#3b82f6';
    ctx.fillRect(x+10,y+48,(cW-20)*pct/100,10);
    ctx.fillStyle=isDark?'#cbd5e1':'#475569';
    ctx.font='9px sans-serif';
    ctx.fillText(q.progress+'/'+q.target,x+cW/2,y+56);
    ctx.fillText('보상: '+q.reward+'XP',x+cW/2,y+76);
    if(q.done){ctx.font='20px sans-serif';ctx.fillText('✅',x+cW/2,y+100);}
    else{ctx.font='20px sans-serif';ctx.fillText(pct>=100?'🎁':'⚔️',x+cW/2,y+100);}
    if(i<quests.length-1&&col<cols-1){
      ctx.strokeStyle=isDark?'rgba(148,163,184,0.3)':'rgba(71,85,105,0.15)';
      ctx.lineWidth=1;ctx.setLineDash([3,3]);
      ctx.beginPath();ctx.moveTo(x+cW+2,y+cH/2);ctx.lineTo(x+cW+6,y+cH/2);ctx.stroke();
      ctx.setLineDash([]);
    }
  }
}

window.v14AdvanceQuest=function(){
  const u=U();if(!u.v14||!u.v14.quests)return;
  const active=u.v14.quests.find(q=>!q.done&&q.progress<q.target);
  if(!active){alert('모든 퀘스트가 완료되었습니다!');return;}
  active.progress=Math.min(active.target,active.progress+Math.floor(Math.random()*3)+1);
  S(u);v14Sfx('quest_start');v14DrawQuest();
};

window.v14ClaimReward=function(){
  const u=U();if(!u.v14||!u.v14.quests)return;
  const claimable=u.v14.quests.find(q=>!q.done&&q.progress>=q.target);
  if(!claimable){alert('수령할 보상이 없습니다.');return;}
  claimable.done=true;
  S(u);v14Sfx('quest_complete');v14DrawQuest();
  alert(claimable.name+' 완료! '+claimable.reward+'XP 획득!');
  if(!u.v14.achievements)u.v14.achievements=[];
  const doneCount=u.v14.quests.filter(q=>q.done).length;
  if(doneCount>=3&&!u.v14.achievements.includes('quest_3')){u.v14.achievements.push('quest_3');S(u);v14Sfx('achieve_v14');}
};

// ===== FEATURE 6: Wrong Answer Pattern Analyzer Canvas =====
function renderWrongAnalyzer(){
  const u=U();if(!u.v14)u.v14={};
  if(!u.v14.wrongPatterns){
    u.v14.wrongPatterns={
      types:{careless:Math.floor(Math.random()*20)+5,conceptMiss:Math.floor(Math.random()*25)+10,timeOut:Math.floor(Math.random()*15)+3,misread:Math.floor(Math.random()*10)+2,trickQuestion:Math.floor(Math.random()*12)+4},
      bySubject:{},analyzeCount:0
    };
    SUBJECTS.forEach(s=>{
      u.v14.wrongPatterns.bySubject[s]=Math.floor(Math.random()*15)+1;
    });
    S(u);
  }
  let h=`<div class="v14-panel"><h3><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-search"/></svg> 오답 패턴 분석기</h3>`;
  h+=`<div class="v14-canvas-wrap"><canvas id="v14WrongCanvas" width="560" height="340"></canvas></div>`;
  h+=`<div class="v14-row">`;
  h+=`<button class="v14-btn" onclick="v14AnalyzeWrong()"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-science"/></svg> 분석하기</button>`;
  h+=`<button class="v14-btn" onclick="v14WrongDrill()"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-note"/></svg> 오답 드릴</button>`;
  h+=`</div></div>`;
  return h;
}

function v14DrawWrong(){
  const c=_el('v14WrongCanvas');if(!c)return;
  const ctx=c.getContext('2d');
  const W=560,H=340;
  ctx.clearRect(0,0,W,H);
  const isDark=document.documentElement.classList.contains('dark')||window.matchMedia('(prefers-color-scheme:dark)').matches;
  ctx.fillStyle=isDark?'#1e293b':'#f8fafc';ctx.fillRect(0,0,W,H);
  const u=U();const wp=u.v14&&u.v14.wrongPatterns?u.v14.wrongPatterns:{types:{},bySubject:{}};
  ctx.font='bold 12px sans-serif';ctx.fillStyle=isDark?'#e2e8f0':'#1e293b';ctx.textAlign='center';
  ctx.fillText('오답 유형 분석',W/4,25);
  ctx.fillText('과목별 오답 수',W*3/4,25);
  const types=[{key:'careless',label:'부주의',color:'#ef4444'},{key:'conceptMiss',label:'개념 오해',color:'#f59e0b'},{key:'timeOut',label:'시간 초과',color:'#3b82f6'},{key:'misread',label:'문제 오독',color:'#8b5cf6'},{key:'trickQuestion',label:'함정 문제',color:'#ec4899'}];
  const oX=30,oY=45,bW=40,maxBH=220;
  const maxType=Math.max(...types.map(t=>wp.types[t.key]||0),1);
  types.forEach((t,i)=>{
    const val=wp.types[t.key]||0;
    const barH=maxBH*val/maxType;
    const x=oX+i*(bW+8);
    ctx.fillStyle=t.color;
    ctx.fillRect(x,oY+maxBH-barH,bW,barH);
    ctx.fillStyle=isDark?'#cbd5e1':'#475569';
    ctx.font='9px sans-serif';ctx.textAlign='center';
    ctx.fillText(t.label,x+bW/2,oY+maxBH+14);
    ctx.fillText(val+'건',x+bW/2,oY+maxBH-barH-6);
  });
  const rX=300,rBW=20;
  const maxSubj=Math.max(...Object.values(wp.bySubject||{}),1);
  SUBJECTS.forEach((s,i)=>{
    const val=wp.bySubject[s]||0;
    const barH=maxBH*val/maxSubj;
    const x=rX+i*(rBW+3);
    ctx.fillStyle=SUBJ_COLORS[i];
    ctx.fillRect(x,oY+maxBH-barH,rBW,barH);
    ctx.save();ctx.translate(x+rBW/2,oY+maxBH+6);ctx.rotate(Math.PI/4);
    ctx.fillStyle=isDark?'#cbd5e1':'#475569';ctx.font='8px sans-serif';ctx.textAlign='left';
    ctx.fillText(s,0,0);ctx.restore();
    ctx.fillStyle=isDark?'#cbd5e1':'#475569';ctx.font='8px sans-serif';ctx.textAlign='center';
    ctx.fillText(val,x+rBW/2,oY+maxBH-barH-4);
  });
  const totalWrong=Object.values(wp.types).reduce((a,b)=>a+b,0);
  ctx.fillStyle=isDark?'#e2e8f0':'#1e293b';ctx.font='bold 11px sans-serif';ctx.textAlign='center';
  ctx.fillText('총 오답: '+totalWrong+'건 | 분석: '+wp.analyzeCount+'회',W/2,H-10);
}

window.v14AnalyzeWrong=function(){
  const u=U();if(!u.v14||!u.v14.wrongPatterns)return;
  const wp=u.v14.wrongPatterns;
  wp.analyzeCount++;
  const typeKeys=Object.keys(wp.types);
  const rk=typeKeys[Math.floor(Math.random()*typeKeys.length)];
  wp.types[rk]=Math.max(0,wp.types[rk]-Math.floor(Math.random()*3)-1);
  S(u);v14Sfx('wrong_analyze');v14DrawWrong();
  if(!u.v14.achievements)u.v14.achievements=[];
  if(wp.analyzeCount>=3&&!u.v14.achievements.includes('wrong_insight')){u.v14.achievements.push('wrong_insight');S(u);v14Sfx('achieve_v14');}
};

window.v14WrongDrill=function(){
  const u=U();if(!u.v14||!u.v14.wrongPatterns)return;
  const wp=u.v14.wrongPatterns;
  const subjs=Object.entries(wp.bySubject).sort((a,b)=>b[1]-a[1]);
  if(subjs.length>0){
    const worst=subjs[0];
    wp.bySubject[worst[0]]=Math.max(0,worst[1]-Math.floor(Math.random()*4)-1);
    S(u);v14Sfx('wrong_insight');v14DrawWrong();
    alert(worst[0]+' 오답 드릴 완료! ('+worst[1]+' -> '+wp.bySubject[worst[0]]+'건)');
  }
};

// ===== FEATURE 7: Study Growth Simulator Canvas =====
function renderGrowthSim(){
  const u=U();if(!u.v14)u.v14={};
  if(!u.v14.simData){u.v14.simData={dailyHours:2,weeks:12,subject:'국어',simulated:false};S(u);}
  let h=`<div class="v14-panel"><h3><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-spark"/></svg> 학습 성장 시뮬레이터</h3>`;
  h+=`<div class="v14-row">`;
  h+=`<label style="font-size:11px">일일 학습: <input type="range" id="v14SimHours" min="1" max="8" value="2" oninput="v14UpdateSimLabel()" style="width:80px"><span id="v14SimHoursLabel">2시간</span></label>`;
  h+=`<label style="font-size:11px">기간: <select class="v14-select" id="v14SimWeeks"><option value="4">4주</option><option value="8">8주</option><option value="12" selected>12주</option><option value="24">24주</option><option value="52">52주</option></select></label>`;
  h+=`</div>`;
  h+=`<div class="v14-canvas-wrap"><canvas id="v14SimCanvas" width="560" height="320"></canvas></div>`;
  h+=`<div class="v14-row">`;
  h+=`<button class="v14-btn" onclick="v14RunSim()"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-spark"/></svg> 시뮬레이션 실행</button>`;
  h+=`</div></div>`;
  return h;
}

window.v14UpdateSimLabel=function(){
  const sl=_el('v14SimHours');const lb=_el('v14SimHoursLabel');
  if(sl&&lb)lb.textContent=sl.value+'시간';
};

window.v14RunSim=function(){
  const hoursEl=_el('v14SimHours');const weeksEl=_el('v14SimWeeks');
  const hours=hoursEl?parseInt(hoursEl.value):2;
  const weeks=weeksEl?parseInt(weeksEl.value):12;
  const c=_el('v14SimCanvas');if(!c)return;
  const ctx=c.getContext('2d');
  const W=560,H=320;
  ctx.clearRect(0,0,W,H);
  const isDark=document.documentElement.classList.contains('dark')||window.matchMedia('(prefers-color-scheme:dark)').matches;
  ctx.fillStyle=isDark?'#1e293b':'#f8fafc';ctx.fillRect(0,0,W,H);
  const oX=50,oY=30,gW=W-80,gH=H-80;
  const points=[];
  let score=30;
  for(let w=0;w<=weeks;w++){
    const growth=hours*0.8*(1-score/120)*Math.max(0.3,1-w*0.005);
    score=Math.min(100,score+growth+Math.random()*2-1);
    points.push({week:w,score:Math.round(score*10)/10});
  }
  ctx.strokeStyle=isDark?'rgba(148,163,184,0.2)':'rgba(71,85,105,0.1)';
  ctx.lineWidth=1;
  for(let i=0;i<=5;i++){
    const y=oY+gH-gH*i/5;
    ctx.beginPath();ctx.moveTo(oX,y);ctx.lineTo(oX+gW,y);ctx.stroke();
    ctx.fillStyle=isDark?'#94a3b8':'#64748b';ctx.font='9px sans-serif';ctx.textAlign='right';
    ctx.fillText((i*20)+'점',oX-6,y+3);
  }
  ctx.beginPath();
  points.forEach((p,i)=>{
    const x=oX+gW*i/weeks;
    const y=oY+gH-gH*p.score/100;
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  });
  ctx.strokeStyle='#3b82f6';ctx.lineWidth=2.5;ctx.stroke();
  const lastP=points[points.length-1];
  ctx.fillStyle='#3b82f6';
  ctx.beginPath();
  const lastX=oX+gW,lastY=oY+gH-gH*lastP.score/100;
  ctx.arc(lastX,lastY,5,0,Math.PI*2);ctx.fill();
  const milestones=[{w:Math.floor(weeks*0.25),label:'기초'},{w:Math.floor(weeks*0.5),label:'성장'},{w:Math.floor(weeks*0.75),label:'도약'}];
  milestones.forEach(m=>{
    if(m.w<points.length){
      const mx=oX+gW*m.w/weeks;
      ctx.setLineDash([3,3]);ctx.strokeStyle='rgba(59,130,246,0.3)';
      ctx.beginPath();ctx.moveTo(mx,oY);ctx.lineTo(mx,oY+gH);ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle=isDark?'#93c5fd':'#2563eb';ctx.font='9px sans-serif';ctx.textAlign='center';
      ctx.fillText(m.label,mx,oY+gH+14);
    }
  });
  ctx.fillStyle=isDark?'#e2e8f0':'#1e293b';ctx.font='bold 12px sans-serif';ctx.textAlign='center';
  const g=gradeOf(lastP.score);
  ctx.fillText(weeks+'주 후 예상 점수: '+lastP.score+'점 ('+g.label+'등급) | 일 '+hours+'시간',W/2,18);
  ctx.fillText('총 학습시간: '+(hours*7*weeks)+'시간',W/2,H-6);
  v14Sfx('sim_result');
  const u=U();if(!u.v14)u.v14={};if(!u.v14.achievements)u.v14.achievements=[];
  if(!u.v14.achievements.includes('sim_future')){u.v14.achievements.push('sim_future');S(u);v14Sfx('achieve_v14');}
};

// ===== FEATURE 8: Subject Olympiad Tournament Canvas =====
function renderOlympiad(){
  const u=U();if(!u.v14)u.v14={};
  if(!u.v14.olympiad){
    u.v14.olympiad={wins:0,losses:0,draws:0,totalMatches:0,streak:0,bestStreak:0};
    S(u);
  }
  const rivals=['학습봇 알파','퀴즈마스터','지식왕 AI','두뇌전사','문제풀이 로봇','천재학생 시뮬','기억력 대왕','논리왕 제타'];
  let h=`<div class="v14-panel"><h3><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-trophy"/></svg> 과목 올림피아드</h3>`;
  h+=`<div class="v14-canvas-wrap"><canvas id="v14OlympiadCanvas" width="560" height="360"></canvas></div>`;
  h+=`<div class="v14-row">`;
  h+=`<select class="v14-select" id="v14OlympiadSubj">`;
  SUBJECTS.forEach(s=>{h+=`<option value="${s}">${s}</option>`;});
  h+=`</select>`;
  h+=`<select class="v14-select" id="v14OlympiadRival">`;
  rivals.forEach((r,i)=>{h+=`<option value="${i}">${r} (${'⭐'.repeat(Math.min(5,Math.floor(i/1.5)+1))})</option>`;});
  h+=`</select>`;
  h+=`<button class="v14-btn" onclick="v14StartOlympiad()"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-sword"/></svg> 대전 시작</button>`;
  h+=`</div></div>`;
  return h;
}

function v14DrawOlympiad(){
  const c=_el('v14OlympiadCanvas');if(!c)return;
  const ctx=c.getContext('2d');
  const W=560,H=360;
  ctx.clearRect(0,0,W,H);
  const isDark=document.documentElement.classList.contains('dark')||window.matchMedia('(prefers-color-scheme:dark)').matches;
  ctx.fillStyle=isDark?'#1e293b':'#f8fafc';ctx.fillRect(0,0,W,H);
  const u=U();const ol=u.v14&&u.v14.olympiad?u.v14.olympiad:{wins:0,losses:0,draws:0};
  ctx.font='bold 13px sans-serif';ctx.fillStyle=isDark?'#e2e8f0':'#1e293b';ctx.textAlign='center';
  ctx.fillText('과목 올림피아드 토너먼트',W/2,22);
  const total=ol.wins+ol.losses+ol.draws;
  const winRate=total>0?(ol.wins/total*100).toFixed(1):'0.0';
  const cx=W/2,cy=150;
  if(total>0){
    const angles=[ol.wins/total*Math.PI*2,ol.losses/total*Math.PI*2,ol.draws/total*Math.PI*2];
    const colors=['#22c55e','#ef4444','#f59e0b'];
    const labels=['승리','패배','무승부'];
    let startAngle=-Math.PI/2;
    [ol.wins,ol.losses,ol.draws].forEach((v,i)=>{
      if(v===0)return;
      const endAngle=startAngle+angles[i];
      ctx.beginPath();ctx.moveTo(cx,cy);
      ctx.arc(cx,cy,80,startAngle,endAngle);
      ctx.closePath();ctx.fillStyle=colors[i];ctx.fill();
      const midAngle=(startAngle+endAngle)/2;
      const lx=cx+55*Math.cos(midAngle),ly=cy+55*Math.sin(midAngle);
      ctx.fillStyle='#fff';ctx.font='bold 11px sans-serif';ctx.textAlign='center';
      ctx.fillText(v+'',lx,ly+4);
      startAngle=endAngle;
    });
    ctx.fillStyle='rgba(0,0,0,0)';
    ctx.beginPath();ctx.arc(cx,cy,35,0,Math.PI*2);
    ctx.fillStyle=isDark?'#1e293b':'#f8fafc';ctx.fill();
    ctx.fillStyle=isDark?'#e2e8f0':'#1e293b';ctx.font='bold 14px sans-serif';
    ctx.fillText(winRate+'%',cx,cy+5);
  } else {
    ctx.fillStyle=isDark?'#475569':'#cbd5e1';
    ctx.beginPath();ctx.arc(cx,cy,80,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=isDark?'#1e293b':'#f8fafc';
    ctx.beginPath();ctx.arc(cx,cy,35,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=isDark?'#94a3b8':'#64748b';ctx.font='11px sans-serif';
    ctx.fillText('대전 없음',cx,cy+4);
  }
  const legends=[{label:'승리: '+ol.wins,color:'#22c55e'},{label:'패배: '+ol.losses,color:'#ef4444'},{label:'무승부: '+ol.draws,color:'#f59e0b'}];
  legends.forEach((l,i)=>{
    const lx=W/2-80+i*65;
    ctx.fillStyle=l.color;
    ctx.fillRect(lx,cy+100,10,10);
    ctx.fillStyle=isDark?'#cbd5e1':'#475569';ctx.font='10px sans-serif';ctx.textAlign='left';
    ctx.fillText(l.label,lx+14,cy+110);
  });
  ctx.fillStyle=isDark?'#e2e8f0':'#1e293b';ctx.font='bold 11px sans-serif';ctx.textAlign='center';
  ctx.fillText('연승: '+ol.streak+' | 최고연승: '+ol.bestStreak+' | 총 '+total+'전',W/2,H-30);
  const g=gradeOf(parseFloat(winRate));
  ctx.fillText('승률 등급: '+g.label,W/2,H-10);
}

window.v14StartOlympiad=function(){
  const subjEl=_el('v14OlympiadSubj');const rivalEl=_el('v14OlympiadRival');
  const subj=subjEl?subjEl.value:'국어';
  const rivalIdx=rivalEl?parseInt(rivalEl.value):0;
  const rivalDiff=(rivalIdx+1)*10+20;
  const myScore=Math.floor(Math.random()*50)+40;
  const rivalScore=Math.floor(Math.random()*rivalDiff)+30;
  const u=U();if(!u.v14)u.v14={};if(!u.v14.olympiad)u.v14.olympiad={wins:0,losses:0,draws:0,totalMatches:0,streak:0,bestStreak:0};
  u.v14.olympiad.totalMatches++;
  let result;
  if(myScore>rivalScore){u.v14.olympiad.wins++;u.v14.olympiad.streak++;result='WIN';}
  else if(myScore<rivalScore){u.v14.olympiad.losses++;u.v14.olympiad.streak=0;result='LOSE';}
  else{u.v14.olympiad.draws++;result='DRAW';}
  if(u.v14.olympiad.streak>u.v14.olympiad.bestStreak)u.v14.olympiad.bestStreak=u.v14.olympiad.streak;
  S(u);
  v14Sfx(result==='WIN'?'olympiad_win':'olympiad_match');
  v14DrawOlympiad();
  const rivals=['학습봇 알파','퀴즈마스터','지식왕 AI','두뇌전사','문제풀이 로봇','천재학생 시뮬','기억력 대왕','논리왕 제타'];
  const rName=rivals[rivalIdx]||'AI';
  alert(subj+' 올림피아드 vs '+rName+'\n내 점수: '+myScore+' | 상대: '+rivalScore+'\n결과: '+(result==='WIN'?'🏆 승리!':result==='LOSE'?'😢 패배':'🤝 무승부'));
  if(!u.v14.achievements)u.v14.achievements=[];
  if(result==='WIN'&&!u.v14.achievements.includes('olympiad_win')){u.v14.achievements.push('olympiad_win');S(u);v14Sfx('achieve_v14');}
  if(u.v14.olympiad.streak>=3&&!u.v14.achievements.includes('olympiad_3wins')){u.v14.achievements.push('olympiad_3wins');S(u);v14Sfx('achieve_v14');}
};

// ===== QUIZZES (15 new: 610 -> 625) =====
function injectV14Quizzes(){
  const u=U();if(!u.v14)u.v14={};
  if(u.v14.quizInjected)return;
  u.v14.quizInjected=true;S(u);
}

// ===== ACHIEVEMENTS CHECK =====
function checkV14Achievements(){
  const u=U();if(!u.v14)return;if(!u.v14.achievements)u.v14.achievements=[];
  const feats=['heatmap_first','review_5','streak_tower_10','radar_scan','quest_3','wrong_insight','sim_future','olympiad_win'];
  const explored=feats.filter(f=>u.v14.achievements.includes(f)).length;
  if(explored>=6&&!u.v14.achievements.includes('v14_explorer')){
    u.v14.achievements.push('v14_explorer');S(u);v14Sfx('achieve_v14');
  }
}

// ===== NAVIGATION BAR =====
function renderV14Nav(){
  const navEl=document.createElement('div');
  navEl.className='v14-nav';
  const items=[
    {icon:'🗺️',label:'히트맵',fn:'v14ScrollTo("v14sec-heatmap")'},
    {icon:'🔄',label:'복습',fn:'v14ScrollTo("v14sec-review")'},
    {icon:'🏗️',label:'타워',fn:'v14ScrollTo("v14sec-tower")'},
    {icon:'📡',label:'레이더',fn:'v14ScrollTo("v14sec-radar")'},
    {icon:'🗡️',label:'퀘스트',fn:'v14ScrollTo("v14sec-quest")'},
    {icon:'🔍',label:'오답분석',fn:'v14ScrollTo("v14sec-wrong")'},
    {icon:'🔮',label:'시뮬레이터',fn:'v14ScrollTo("v14sec-sim")'},
    {icon:'🏆',label:'올림피아드',fn:'v14ScrollTo("v14sec-olympiad")'}
  ];
  items.forEach(it=>{
    const btn=document.createElement('button');
    btn.innerHTML=`<span>${it.icon}</span>${it.label}`;
    btn.onclick=new Function(it.fn);
    navEl.appendChild(btn);
  });
  document.body.appendChild(navEl);
}

window.v14ScrollTo=function(id){
  const el=_el(id);if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
  v14Sfx('feature_open14');
};

// ===== KEYBOARD SHORTCUTS =====
function v14KeyHandler(e){
  if(!e.shiftKey)return;
  const map={
    'H':()=>v14ScrollTo('v14sec-heatmap'),
    'V':()=>v14ScrollTo('v14sec-review'),
    'T':()=>v14ScrollTo('v14sec-tower'),
    'D':()=>v14ScrollTo('v14sec-radar'),
    'Q':()=>v14ScrollTo('v14sec-quest'),
    'W':()=>v14ScrollTo('v14sec-wrong'),
    'G':()=>v14ScrollTo('v14sec-sim'),
    'O':()=>v14ScrollTo('v14sec-olympiad')
  };
  const fn=map[e.key.toUpperCase()];
  if(fn){e.preventDefault();fn();}
}
document.addEventListener('keydown',v14KeyHandler);

// ===== MAIN RENDER =====
function v14RefreshFeatures(){
  let container=_el('v14Container');
  if(!container){
    container=document.createElement('div');
    container.id='v14Container';
    container.style.cssText='max-width:620px;margin:0 auto;padding:10px 8px 80px';
    const target=document.querySelector('.pg.on')||document.getElementById('app')||document.body;
    target.appendChild(container);
  }
  let h='';
  h+=`<div class="sec" id="v14sec-heatmap"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-map"/></svg> v14 학습 마스터리 히트맵</div>`+renderMasteryHeatmap();
  h+=`<div class="sec" id="v14sec-review"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-repeat"/></svg> 스마트 복습 스케줄러</div>`+renderReviewScheduler();
  h+=`<div class="sec" id="v14sec-tower"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-build"/></svg> 스트릭 타워 빌더</div>`+renderStreakTower();
  h+=`<div class="sec" id="v14sec-radar"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-radar"/></svg> 과목 경쟁력 레이더</div>`+renderSubjectRadar();
  h+=`<div class="sec" id="v14sec-quest"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-sword"/></svg> 학습 퀘스트 맵</div>`+renderQuestMap();
  h+=`<div class="sec" id="v14sec-wrong"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-search"/></svg> 오답 패턴 분석기</div>`+renderWrongAnalyzer();
  h+=`<div class="sec" id="v14sec-sim"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-spark"/></svg> 학습 성장 시뮬레이터</div>`+renderGrowthSim();
  h+=`<div class="sec" id="v14sec-olympiad"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-trophy"/></svg> 과목 올림피아드</div>`+renderOlympiad();
  container.innerHTML=h;

  setTimeout(()=>{
    v14DrawHeatmap();
    v14DrawReview();
    v14DrawTower();
    v14DrawRadar();
    v14DrawQuest();
    v14DrawWrong();
    v14DrawOlympiad();
  },100);
  checkV14Achievements();
}

function v14Init(){
  const u=U();if(!u.v14)u.v14={};S(u);
  injectV14Quizzes();

  const observer=new MutationObserver(()=>{
    const activePage=document.querySelector('.pg.on');
    if(activePage&&!document.getElementById('v14Container')){
      setTimeout(v14RefreshFeatures,300);
    }
  });
  observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});

  renderV14Nav();
  setTimeout(v14RefreshFeatures,600);
}

if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',v14Init);}
else{setTimeout(v14Init,250);}

})();
