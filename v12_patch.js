// LevelPlay v12.0 Patch - Learning Rival AI System + Achievement Showcase Gallery Canvas
// + XP Double Event System + Subject Report Card Generator Canvas PNG
// + Quiz Difficulty Tier Visualizer Canvas + Learning Heart/Lives System
// + Subject Contest Mode + Streak Milestone Rewards
// + 15 Quizzes + 12 Achievements + SFX 20 + KB 8
(function(){
'use strict';

function _el(id){return document.getElementById(id);}
function U(){try{return JSON.parse(localStorage.getItem('lp_user'))||{};}catch(e){return {};}}
function S(u){localStorage.setItem('lp_user',JSON.stringify(u));}
function _today(){return new Date().toISOString().slice(0,10);}

// ===== Audio Engine =====
const v12Ctx=(function(){try{return new(window.AudioContext||window.webkitAudioContext)();}catch(e){return null;}})();
function v12Sfx(type){
  if(!v12Ctx)return;try{
  if(v12Ctx.state==='suspended')v12Ctx.resume();
  const o=v12Ctx.createOscillator(),g=v12Ctx.createGain();
  o.connect(g);g.connect(v12Ctx.destination);
  const t=v12Ctx.currentTime;
  const map={
    rival_challenge:[659.25,.15,'triangle'],rival_win:[1046.5,.3,'sine'],
    rival_lose:[220,.15,'sawtooth'],rival_draw:[440,.12,'triangle'],
    showcase_open:[523.25,.12,'sine'],showcase_export:[880,.25,'sine'],
    xp_double:[783.99,.2,'sine'],xp_event_end:[440,.1,'triangle'],
    report_gen:[659.25,.18,'sine'],report_download:[880,.2,'sine'],
    tier_view:[523.25,.1,'triangle'],tier_up:[783.99,.15,'sine'],
    heart_lose:[293.66,.12,'sawtooth'],heart_gain:[659.25,.1,'sine'],
    contest_start:[523.25,.15,'triangle'],contest_win:[1046.5,.3,'sine'],
    milestone_reach:[880,.3,'sine'],milestone_claim:[1046.5,.25,'sine'],
    quiz_v12_ok:[659.25,.12,'sine'],quiz_v12_fail:[293.66,.1,'sawtooth'],
    achieve_v12:[1046.5,.3,'sine'],feature_open12:[523.25,.1,'triangle']
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
const v12css=document.createElement('style');
v12css.textContent=`
.v12-panel{background:var(--c1);border:1px solid rgba(139,92,246,.1);border-radius:12px;padding:14px;margin-bottom:10px}
.v12-panel h3{font-size:14px;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:6px}
.v12-btn{padding:8px 14px;border:1px solid rgba(139,92,246,.2);border-radius:8px;background:var(--c2);color:var(--tx);font:12px inherit;cursor:pointer;transition:.15s}
.v12-btn:hover{border-color:var(--cy);background:rgba(6,214,160,.08)}
.v12-btn.active{background:rgba(6,214,160,.15);border-color:var(--cy);color:var(--cy)}
.v12-badge{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700}
/* Rival */
.v12-rival{background:linear-gradient(135deg,rgba(239,68,68,.06),rgba(139,92,246,.06));border:1.5px solid rgba(239,68,68,.2);border-radius:12px;padding:14px;margin-bottom:10px}
.v12-rival .rival-card{display:flex;align-items:center;gap:10px;padding:8px;background:var(--c2);border-radius:8px;margin-bottom:6px;cursor:pointer;transition:.15s}
.v12-rival .rival-card:hover{border-color:var(--cy);transform:translateX(2px)}
.v12-rival .rival-avatar{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;background:rgba(139,92,246,.15)}
.v12-rival .rival-info{flex:1}
.v12-rival .rival-name{font-size:12px;font-weight:700}
.v12-rival .rival-stat{font-size:10px;color:var(--t3)}
.v12-rival .rival-xp{font-size:12px;font-weight:800;background:var(--g1);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
/* Showcase */
.v12-showcase canvas{width:100%;border-radius:8px;margin-bottom:8px}
.v12-showcase .showcase-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px}
.v12-showcase .showcase-item{text-align:center;padding:6px;background:var(--c2);border-radius:8px;font-size:9px;cursor:pointer;transition:.15s}
.v12-showcase .showcase-item:hover{background:rgba(6,214,160,.1)}
.v12-showcase .showcase-item .si-icon{font-size:20px;margin-bottom:2px}
.v12-showcase .showcase-item.locked{opacity:.3;filter:grayscale(1)}
/* XP Event */
.v12-xpevent{background:linear-gradient(135deg,rgba(251,191,36,.1),rgba(6,214,160,.05));border:1.5px solid rgba(251,191,36,.25);border-radius:12px;padding:14px;margin-bottom:10px;text-align:center}
.v12-xpevent .xp-multi{font-size:36px;font-weight:900;background:linear-gradient(135deg,#fbbf24,#f59e0b);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.v12-xpevent .xp-timer{font-size:14px;font-weight:700;margin-top:6px}
/* Report Card */
.v12-report canvas{width:100%;border-radius:8px;margin-bottom:8px}
.v12-report .report-actions{display:flex;gap:6px;justify-content:center}
/* Tier */
.v12-tier canvas{width:100%;border-radius:8px;margin-bottom:8px}
.v12-tier .tier-list{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px}
.v12-tier .tier-tag{padding:3px 8px;border-radius:6px;font-size:10px;font-weight:700}
/* Hearts */
.v12-hearts{background:linear-gradient(135deg,rgba(239,68,68,.08),rgba(251,191,36,.05));border:1.5px solid rgba(239,68,68,.2);border-radius:12px;padding:14px;margin-bottom:10px}
.v12-hearts .heart-row{display:flex;gap:4px;justify-content:center;margin-bottom:8px}
.v12-hearts .heart{font-size:24px;transition:.2s}
.v12-hearts .heart.empty{filter:grayscale(1);opacity:.3}
.v12-hearts .heart-info{text-align:center;font-size:11px;color:var(--t3)}
.v12-hearts .heart-timer{font-size:13px;font-weight:700;text-align:center;margin-top:6px}
/* Contest */
.v12-contest{background:linear-gradient(135deg,rgba(99,102,241,.08),rgba(6,214,160,.05));border:1.5px solid rgba(99,102,241,.2);border-radius:12px;padding:14px;margin-bottom:10px}
.v12-contest .contest-q{font-size:13px;font-weight:600;margin-bottom:10px;min-height:40px}
.v12-contest .contest-opts{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.v12-contest .contest-opt{padding:10px;border:1px solid rgba(139,92,246,.2);border-radius:8px;font-size:12px;cursor:pointer;text-align:center;transition:.15s}
.v12-contest .contest-opt:hover{border-color:var(--cy);background:rgba(6,214,160,.05)}
.v12-contest .contest-opt.correct{background:rgba(6,214,160,.15);border-color:var(--cy)}
.v12-contest .contest-opt.wrong{background:rgba(239,68,68,.15);border-color:var(--rd)}
/* Milestone */
.v12-milestone{background:linear-gradient(135deg,rgba(251,191,36,.08),rgba(139,92,246,.05));border:1.5px solid rgba(251,191,36,.2);border-radius:12px;padding:14px;margin-bottom:10px}
.v12-milestone .ms-list{display:flex;flex-direction:column;gap:6px}
.v12-milestone .ms-item{display:flex;align-items:center;gap:10px;padding:8px;background:var(--c2);border-radius:8px}
.v12-milestone .ms-item.claimed{opacity:.5}
.v12-milestone .ms-icon{font-size:22px}
.v12-milestone .ms-info{flex:1}
.v12-milestone .ms-name{font-size:12px;font-weight:700}
.v12-milestone .ms-desc{font-size:10px;color:var(--t3)}
.v12-milestone .ms-claim{padding:4px 10px;border-radius:6px;font-size:10px;font-weight:700;cursor:pointer;border:none;background:var(--g1);color:#fff}
/* Nav */
.v12-nav{position:fixed;bottom:calc(var(--nv) + 80px);left:0;right:0;display:flex;overflow-x:auto;background:var(--c1);border-top:1px solid rgba(139,92,246,.1);z-index:999;padding:6px 4px;gap:2px;scrollbar-width:none}
.v12-nav::-webkit-scrollbar{display:none}
.v12-nav button{flex:0 0 auto;padding:6px 10px;border:none;background:transparent;color:var(--t3);font:10px inherit;cursor:pointer;border-radius:6px;white-space:nowrap;transition:.15s}
.v12-nav button:hover,.v12-nav button:active{background:rgba(6,214,160,.1);color:var(--cy)}
/* 하단 고정 스트립 스택(메인nav 52 + v13 36 + v11 38 + v12 38 = ~164px) 아래로 콘텐츠·FAB가 깔리지 않도록 보정 */
.pg{padding-bottom:calc(var(--nv) + 140px)}
.fab{bottom:calc(var(--nv) + 130px)}
.tutor-fab{bottom:calc(var(--nv) + 176px)}
.tutor-panel{bottom:calc(var(--nv) + 230px)}
`;
document.head.appendChild(v12css);

// ===== 1. LEARNING RIVAL AI SYSTEM =====
const RIVALS=[
  {id:'r1',name:'Kim Soo-A',emoji:'\u{1F9D1}‍\u{1F393}',style:'steady',xpRate:35,streak:12,subj:'math'},
  {id:'r2',name:'Park Ji-Min',emoji:'\u{1F468}‍\u{1F4BB}',style:'burst',xpRate:55,streak:5,subj:'coding'},
  {id:'r3',name:'Lee Ha-Na',emoji:'\u{1F469}‍\u{1F52C}',style:'balanced',xpRate:42,streak:18,subj:'science'},
  {id:'r4',name:'Choi Yun-Seo',emoji:'\u{1F9D1}‍\u{1F3A8}',style:'creative',xpRate:38,streak:9,subj:'art'},
  {id:'r5',name:'Jung Min-Ho',emoji:'\u{1F468}‍\u{1F3EB}',style:'studious',xpRate:48,streak:22,subj:'history'},
  {id:'r6',name:'Kang Seo-Yeon',emoji:'\u{1F469}‍\u{1F3A4}',style:'fast',xpRate:60,streak:7,subj:'music'},
  {id:'r7',name:'Song Tae-Yang',emoji:'\u{1F9D1}‍\u{1F680}',style:'explorer',xpRate:45,streak:15,subj:'english'},
  {id:'r8',name:'Yoon Da-In',emoji:'\u{1F469}‍\u{2696}️',style:'perfectionist',xpRate:30,streak:30,subj:'korean'}
];

function getRivalState(){const u=U();return u.v12rivals||{selected:null,battles:[],wins:0,losses:0,draws:0};}
function saveRivalState(rs){const u=U();u.v12rivals=rs;S(u);}

function simulateRivalXP(rival){
  const base=rival.xpRate;
  const variance=Math.floor(Math.random()*20)-10;
  return Math.max(5,base+variance);
}

function challengeRival(rivalId){
  v12Sfx('rival_challenge');
  const rs=getRivalState();
  const rival=RIVALS.find(r=>r.id===rivalId);
  if(!rival)return;
  const u=U();
  const myXP=u.stats?(u.stats.totalXP||0):0;
  const myToday=u.dailyXP?u.dailyXP[_today()]||0:0;
  const rivalToday=simulateRivalXP(rival);
  let result='draw';
  if(myToday>rivalToday){result='win';rs.wins++;v12Sfx('rival_win');}
  else if(myToday<rivalToday){result='lose';rs.losses++;v12Sfx('rival_lose');}
  else{rs.draws++;v12Sfx('rival_draw');}
  rs.battles.push({rivalId,date:_today(),myXP:myToday,rivalXP:rivalToday,result});
  if(rs.battles.length>50)rs.battles=rs.battles.slice(-50);
  rs.selected=rivalId;
  saveRivalState(rs);
  checkV12Achieve('rival_first');
  if(rs.wins>=5)checkV12Achieve('rival_5wins');
  if(rs.wins>=10)checkV12Achieve('rival_master');
  v12RefreshPanel();
}

function renderRivalPanel(){
  const rs=getRivalState();
  let h='<div class="v12-rival" id="v12rivalPanel"><h3>\u{1F3AF} 학습 라이벌 AI</h3>';
  h+='<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap">';
  h+='<span class="v12-badge" style="background:rgba(6,214,160,.15);color:var(--cy)">\u{1F3C6} '+rs.wins+'승</span>';
  h+='<span class="v12-badge" style="background:rgba(239,68,68,.15);color:var(--rd)">❌ '+rs.losses+'패</span>';
  h+='<span class="v12-badge" style="background:rgba(251,191,36,.15);color:var(--gd)">\u{1F91D} '+rs.draws+'무</span>';
  h+='</div>';
  RIVALS.forEach(r=>{
    const lastBattle=rs.battles.filter(b=>b.rivalId===r.id).slice(-1)[0];
    const resultBadge=lastBattle?(lastBattle.result==='win'?'✅':lastBattle.result==='lose'?'❌':'\u{1F91D}'):'';
    h+='<div class="rival-card" onclick="challengeRival(&#39;'+r.id+'&#39;)">';
    h+='<div class="rival-avatar">'+r.emoji+'</div>';
    h+='<div class="rival-info"><div class="rival-name">'+r.name+' '+resultBadge+'</div>';
    h+='<div class="rival-stat">\u{1F525} '+r.streak+'일 연속 · '+r.subj+'</div></div>';
    h+='<div class="rival-xp">~'+r.xpRate+' XP/일</div>';
    h+='</div>';
  });
  h+='</div>';
  return h;
}

// ===== 2. ACHIEVEMENT SHOWCASE GALLERY CANVAS =====
function getUnlockedAchievements(){
  const u=U();
  return u.achievements?Object.keys(u.achievements).filter(k=>u.achievements[k]):[];
}

function renderShowcaseCanvas(){
  const canvas=_el('v12showcaseCanvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const W=600,H=400;
  canvas.width=W;canvas.height=H;

  const unlocked=getUnlockedAchievements();
  const total=Math.max(unlocked.length,1);

  const gBg=ctx.createLinearGradient(0,0,W,H);
  gBg.addColorStop(0,'#0a0a1a');gBg.addColorStop(1,'#111127');
  ctx.fillStyle=gBg;ctx.fillRect(0,0,W,H);

  ctx.strokeStyle='rgba(139,92,246,.3)';ctx.lineWidth=3;
  ctx.strokeRect(8,8,W-16,H-16);
  ctx.strokeStyle='rgba(6,214,160,.2)';ctx.lineWidth=1;
  ctx.strokeRect(14,14,W-28,H-28);

  const gTitle=ctx.createLinearGradient(0,0,W,0);
  gTitle.addColorStop(0,'#8b5cf6');gTitle.addColorStop(1,'#06d6a0');
  ctx.fillStyle=gTitle;ctx.font='bold 20px -apple-system,sans-serif';
  ctx.textAlign='center';
  ctx.fillText('\u{1F3C6} 업적 쇼케이스 갤러리',W/2,50);

  ctx.fillStyle='#e2e8f0';ctx.font='bold 14px -apple-system,sans-serif';
  ctx.fillText('해금: '+unlocked.length+'개',W/2,75);

  const cols=6,rows=4;
  const cellW=80,cellH=60;
  const startX=(W-cols*cellW)/2;
  const startY=95;

  for(let i=0;i<cols*rows;i++){
    const col=i%cols,row=Math.floor(i/cols);
    const x=startX+col*cellW;
    const y=startY+row*cellH;
    const isUnlocked=i<unlocked.length;

    ctx.fillStyle=isUnlocked?'rgba(6,214,160,.12)':'rgba(139,92,246,.05)';
    ctx.strokeStyle=isUnlocked?'rgba(6,214,160,.4)':'rgba(139,92,246,.1)';
    ctx.lineWidth=1;
    ctx.beginPath();ctx.roundRect(x+2,y+2,cellW-4,cellH-4,6);ctx.fill();ctx.stroke();

    ctx.fillStyle=isUnlocked?'#06d6a0':'#444';
    ctx.font='20px -apple-system,sans-serif';
    ctx.textAlign='center';
    ctx.fillText(isUnlocked?'⭐':'\u{1F512}',x+cellW/2,y+cellH/2+2);

    if(isUnlocked){
      ctx.fillStyle='rgba(6,214,160,.7)';ctx.font='8px -apple-system,sans-serif';
      const achName=unlocked[i].replace(/_/g,' ').slice(0,10);
      ctx.fillText(achName,x+cellW/2,y+cellH-8);
    }
  }

  const pct=Math.round((unlocked.length/124)*100);
  const barY=startY+rows*cellH+15;
  ctx.fillStyle='rgba(139,92,246,.15)';
  ctx.beginPath();ctx.roundRect(40,barY,W-80,16,8);ctx.fill();
  ctx.fillStyle='rgba(6,214,160,.6)';
  ctx.beginPath();ctx.roundRect(40,barY,Math.max(1,(W-80)*pct/100),16,8);ctx.fill();
  ctx.fillStyle='#e2e8f0';ctx.font='bold 10px -apple-system,sans-serif';
  ctx.textAlign='center';
  ctx.fillText(pct+'% 달성',W/2,barY+12);

  const grade=pct>=90?'S':pct>=75?'A':pct>=50?'B':pct>=25?'C':'D';
  const gradeColor={S:'#fbbf24',A:'#06d6a0',B:'#3b82f6',C:'#8b5cf6',D:'#94a3b8'}[grade];
  ctx.fillStyle=gradeColor;ctx.font='bold 40px -apple-system,sans-serif';
  ctx.fillText(grade,W/2,barY+60);
  ctx.fillStyle='#94a3b8';ctx.font='10px -apple-system,sans-serif';
  ctx.fillText('업적 등급',W/2,barY+75);

  ctx.fillStyle='rgba(139,92,246,.3)';ctx.font='9px -apple-system,sans-serif';
  ctx.fillText('LevelPlay v12.0 · '+_today(),W/2,H-15);
}

function exportShowcase(){
  v12Sfx('showcase_export');
  const canvas=_el('v12showcaseCanvas');
  if(!canvas)return;
  canvas.toBlob(function(blob){
    if(!blob)return;
    if(navigator.clipboard&&window.ClipboardItem){
      navigator.clipboard.write([new ClipboardItem({'image/png':blob})]).catch(function(){});
    }
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);
    a.download='levelplay-showcase-'+_today()+'.png';a.click();
    URL.revokeObjectURL(a.href);
  },'image/png');
}

function renderShowcasePanel(){
  let h='<div class="v12-showcase v12-panel" id="v12showcasePanel"><h3>\u{1F3C6} 업적 쇼케이스</h3>';
  h+='<canvas id="v12showcaseCanvas" style="width:100%;border-radius:8px"></canvas>';
  h+='<div style="display:flex;gap:6px;justify-content:center">';
  h+='<button class="v12-btn" onclick="renderShowcaseCanvas()">🔄 새로고침</button>';
  h+='<button class="v12-btn" onclick="exportShowcase()">\u{1F4E5} PNG 다운로드</button>';
  h+='</div></div>';
  return h;
}

// ===== 3. XP DOUBLE EVENT SYSTEM =====
function getXPEvent(){const u=U();return u.v12xpEvent||{active:false,multiplier:1,endTime:null,history:[]};}
function saveXPEvent(ev){const u=U();u.v12xpEvent=ev;S(u);}

function checkXPEvent(){
  const ev=getXPEvent();
  if(ev.active&&ev.endTime){
    if(Date.now()>ev.endTime){
      ev.active=false;ev.multiplier=1;ev.endTime=null;
      saveXPEvent(ev);v12Sfx('xp_event_end');
    }
  }
  return ev;
}

function startXPEvent(){
  const ev=getXPEvent();
  if(ev.active)return;
  const multipliers=[1.5,2,2,2.5,3];
  const durations=[30,20,15,10,5];
  const idx=Math.floor(Math.random()*multipliers.length);
  ev.active=true;
  ev.multiplier=multipliers[idx];
  ev.endTime=Date.now()+durations[idx]*60*1000;
  ev.history.push({date:_today(),multi:ev.multiplier,mins:durations[idx]});
  if(ev.history.length>20)ev.history=ev.history.slice(-20);
  saveXPEvent(ev);
  v12Sfx('xp_double');
  checkV12Achieve('xp_event_first');
  if(ev.history.length>=5)checkV12Achieve('xp_event_5');
  v12RefreshPanel();
}

function renderXPEventPanel(){
  const ev=checkXPEvent();
  let h='<div class="v12-xpevent" id="v12xpEventPanel"><h3>⚡ XP 더블 이벤트</h3>';
  if(ev.active){
    const remain=Math.max(0,Math.ceil((ev.endTime-Date.now())/60000));
    h+='<div class="xp-multi">x'+ev.multiplier+'</div>';
    h+='<div class="xp-timer">⏰ '+remain+'분 남음</div>';
    h+='<div style="font-size:11px;color:var(--t3);margin-top:6px">학습 활동 XP가 '+ev.multiplier+'배!</div>';
  }else{
    h+='<div class="xp-multi" style="font-size:24px">\u{1F381}</div>';
    h+='<div style="font-size:12px;margin:8px 0">러키 드로우로 XP 부스터를 받으세요!</div>';
    h+='<button class="v12-btn" onclick="startXPEvent()" style="background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000;border:none;font-weight:700;padding:10px 24px">\u{1F3B0} 럭키 드로우!</button>';
  }
  h+='<div style="font-size:10px;color:var(--t3);margin-top:8px">총 '+ev.history.length+'회 이벤트 참여</div>';
  h+='</div>';
  return h;
}

// ===== 4. SUBJECT REPORT CARD GENERATOR CANVAS =====
function getSubjectData(){
  const u=U();
  const subjects=[
    {name:'수학',key:'math',emoji:'\u{1F4D0}'},
    {name:'과학',key:'science',emoji:'\u{1F52C}'},
    {name:'영어',key:'english',emoji:'\u{1F1EC}\u{1F1E7}'},
    {name:'코딩',key:'coding',emoji:'\u{1F4BB}'},
    {name:'한국사',key:'history',emoji:'\u{1F3EF}'},
    {name:'음악',key:'music',emoji:'\u{1F3B5}'},
    {name:'미술',key:'art',emoji:'\u{1F3A8}'},
    {name:'체육',key:'sports',emoji:'⚽'},
    {name:'한국어',key:'korean',emoji:'\u{1F1F0}\u{1F1F7}'},
    {name:'사회',key:'social',emoji:'\u{1F30D}'},
    {name:'안전',key:'safety',emoji:'\u{1F6E1}️'}
  ];
  return subjects.map(s=>{
    const cat=u.stats&&u.stats.quizByCategory?u.stats.quizByCategory[s.name]:null;
    const total=cat?cat.total:0;
    const correct=cat?cat.correct:0;
    const pct=total>0?Math.round(correct/total*100):0;
    const grade=pct>=90?'S':pct>=75?'A':pct>=50?'B':pct>=25?'C':'D';
    return{...s,total,correct,pct,grade};
  });
}

function renderReportCanvas(){
  const canvas=_el('v12reportCanvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const W=600,H=440;
  canvas.width=W;canvas.height=H;

  const gBg=ctx.createLinearGradient(0,0,W,H);
  gBg.addColorStop(0,'#0a0a1a');gBg.addColorStop(1,'#111127');
  ctx.fillStyle=gBg;ctx.fillRect(0,0,W,H);

  ctx.strokeStyle='rgba(251,191,36,.4)';ctx.lineWidth=3;
  ctx.strokeRect(8,8,W-16,H-16);
  ctx.strokeStyle='rgba(251,191,36,.15)';ctx.lineWidth=1;
  ctx.strokeRect(14,14,W-28,H-28);

  const gTitle=ctx.createLinearGradient(0,0,W,0);
  gTitle.addColorStop(0,'#fbbf24');gTitle.addColorStop(1,'#f59e0b');
  ctx.fillStyle=gTitle;ctx.font='bold 20px -apple-system,sans-serif';
  ctx.textAlign='center';
  ctx.fillText('\u{1F4DC} 과목별 성적표',W/2,48);

  ctx.fillStyle='#94a3b8';ctx.font='12px -apple-system,sans-serif';
  ctx.fillText(_today()+' 발행',W/2,68);

  const data=getSubjectData();
  const barH=24,gap=4,startX=100,startY=90,barMaxW=340;

  data.forEach((s,i)=>{
    const y=startY+i*(barH+gap);
    ctx.fillStyle='#e2e8f0';ctx.font='12px -apple-system,sans-serif';
    ctx.textAlign='right';
    ctx.fillText(s.emoji+' '+s.name,startX-8,y+barH/2+4);

    ctx.fillStyle='rgba(139,92,246,.1)';
    ctx.beginPath();ctx.roundRect(startX,y,barMaxW,barH,4);ctx.fill();

    const gradeColors={S:'#fbbf24',A:'#06d6a0',B:'#3b82f6',C:'#8b5cf6',D:'#64748b'};
    const gc=ctx.createLinearGradient(startX,0,startX+barMaxW*s.pct/100,0);
    gc.addColorStop(0,gradeColors[s.grade]);gc.addColorStop(1,gradeColors[s.grade]+'88');
    ctx.fillStyle=gc;
    ctx.beginPath();ctx.roundRect(startX,y,Math.max(2,barMaxW*s.pct/100),barH,4);ctx.fill();

    ctx.fillStyle='#e2e8f0';ctx.font='bold 10px -apple-system,sans-serif';
    ctx.textAlign='left';
    ctx.fillText(s.pct+'% ('+s.grade+')',startX+barMaxW+8,y+barH/2+4);
  });

  const avgPct=data.length>0?Math.round(data.reduce((s,d)=>s+d.pct,0)/data.length):0;
  const avgGrade=avgPct>=90?'S':avgPct>=75?'A':avgPct>=50?'B':avgPct>=25?'C':'D';
  const gradeColor={S:'#fbbf24',A:'#06d6a0',B:'#3b82f6',C:'#8b5cf6',D:'#64748b'}[avgGrade];

  ctx.fillStyle=gradeColor;ctx.font='bold 48px -apple-system,sans-serif';
  ctx.textAlign='center';
  ctx.fillText(avgGrade,W/2,H-50);
  ctx.fillStyle='#94a3b8';ctx.font='12px -apple-system,sans-serif';
  ctx.fillText('종합 등급 · 평균 '+avgPct+'%',W/2,H-30);

  ctx.fillStyle='rgba(139,92,246,.3)';ctx.font='9px -apple-system,sans-serif';
  ctx.fillText('LevelPlay v12.0',W/2,H-12);
}

function exportReport(){
  v12Sfx('report_download');
  const canvas=_el('v12reportCanvas');
  if(!canvas)return;
  canvas.toBlob(function(blob){
    if(!blob)return;
    if(navigator.clipboard&&window.ClipboardItem){
      navigator.clipboard.write([new ClipboardItem({'image/png':blob})]).catch(function(){});
    }
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);
    a.download='levelplay-report-'+_today()+'.png';a.click();
    URL.revokeObjectURL(a.href);
  },'image/png');
}

function renderReportPanel(){
  let h='<div class="v12-report v12-panel" id="v12reportPanel"><h3>\u{1F4DC} 과목 성적표</h3>';
  h+='<canvas id="v12reportCanvas" style="width:100%;border-radius:8px"></canvas>';
  h+='<div class="report-actions">';
  h+='<button class="v12-btn" onclick="renderReportCanvas()">\u{1F504} 새로고침</button>';
  h+='<button class="v12-btn" onclick="exportReport()">\u{1F4E5} PNG 다운로드</button>';
  h+='</div></div>';
  return h;
}

// ===== 5. QUIZ DIFFICULTY TIER VISUALIZER CANVAS =====
const TIERS=[
  {name:'Bronze',color:'#cd7f32',min:0,max:20},
  {name:'Silver',color:'#c0c0c0',min:20,max:40},
  {name:'Gold',color:'#ffd700',min:40,max:60},
  {name:'Platinum',color:'#06d6a0',min:60,max:80},
  {name:'Diamond',color:'#60a5fa',min:80,max:90},
  {name:'Master',color:'#8b5cf6',min:90,max:95},
  {name:'Grandmaster',color:'#ef4444',min:95,max:100}
];

function getQuizAccuracy(){
  const u=U();
  if(!u.stats||!u.stats.quizByCategory)return 0;
  const cats=Object.values(u.stats.quizByCategory);
  const total=cats.reduce((s,c)=>s+c.total,0);
  const correct=cats.reduce((s,c)=>s+c.correct,0);
  return total>0?Math.round(correct/total*100):0;
}

function renderTierCanvas(){
  const canvas=_el('v12tierCanvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const W=560,H=320;
  canvas.width=W;canvas.height=H;

  ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);

  const gTitle=ctx.createLinearGradient(0,0,W,0);
  gTitle.addColorStop(0,'#8b5cf6');gTitle.addColorStop(1,'#06d6a0');
  ctx.fillStyle=gTitle;ctx.font='bold 18px -apple-system,sans-serif';
  ctx.textAlign='center';
  ctx.fillText('\u{1F396}️ 퀸즈 난이도 티어',W/2,30);

  const accuracy=getQuizAccuracy();
  const currentTier=TIERS.slice().reverse().find(t=>accuracy>=t.min)||TIERS[0];

  const barX=40,barY=50,barW=W-80,barH=30;

  TIERS.forEach(t=>{
    const x=barX+(t.min/100)*barW;
    const w=((t.max-t.min)/100)*barW;
    ctx.fillStyle=t.name===currentTier.name?t.color:t.color+'44';
    ctx.beginPath();ctx.roundRect(x,barY,w,barH,4);ctx.fill();
    ctx.fillStyle=t.name===currentTier.name?'#fff':'#888';
    ctx.font='bold 8px -apple-system,sans-serif';
    ctx.textAlign='center';
    ctx.fillText(t.name,x+w/2,barY+barH/2+3);
  });

  const markerX=barX+(accuracy/100)*barW;
  ctx.fillStyle='#fff';
  ctx.beginPath();ctx.moveTo(markerX,barY-6);ctx.lineTo(markerX-5,barY-14);ctx.lineTo(markerX+5,barY-14);ctx.fill();
  ctx.font='bold 9px -apple-system,sans-serif';
  ctx.textAlign='center';
  ctx.fillText(accuracy+'%',markerX,barY-17);

  ctx.fillStyle=currentTier.color;ctx.font='bold 36px -apple-system,sans-serif';
  ctx.textAlign='center';
  ctx.fillText(currentTier.name,W/2,barY+barH+50);

  ctx.fillStyle='#e2e8f0';ctx.font='14px -apple-system,sans-serif';
  ctx.fillText('정답률: '+accuracy+'%',W/2,barY+barH+75);

  const nextTier=TIERS.find(t=>t.min>accuracy);
  if(nextTier){
    ctx.fillStyle='#94a3b8';ctx.font='11px -apple-system,sans-serif';
    ctx.fillText('다음 티어: '+nextTier.name+' ('+nextTier.min+'% 필요)',W/2,barY+barH+95);
  }else{
    ctx.fillStyle='#fbbf24';ctx.font='11px -apple-system,sans-serif';
    ctx.fillText('\u{1F451} 최고 등급 도달!',W/2,barY+barH+95);
  }

  const tierY=barY+barH+120;
  TIERS.forEach((t,i)=>{
    const x=30+i*(barW/7+2);
    const isActive=t.name===currentTier.name;
    ctx.fillStyle=isActive?t.color:t.color+'44';
    ctx.beginPath();ctx.arc(x+25,tierY,18,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=isActive?'#fff':'#666';
    ctx.font='bold 9px -apple-system,sans-serif';
    ctx.textAlign='center';
    ctx.fillText(t.min+'%+',x+25,tierY+4);
    ctx.fillText(t.name.slice(0,3),x+25,tierY+30);
  });
}

function renderTierPanel(){
  let h='<div class="v12-tier v12-panel" id="v12tierPanel"><h3>\u{1F396}️ 난이도 티어</h3>';
  h+='<canvas id="v12tierCanvas" style="width:100%;border-radius:8px"></canvas>';
  h+='<button class="v12-btn" onclick="renderTierCanvas()">\u{1F504} 새로고침</button>';
  h+='</div>';
  return h;
}

// ===== 6. LEARNING HEART/LIVES SYSTEM =====
function getHearts(){const u=U();return u.v12hearts||{current:5,max:5,lastLoss:null,refillTime:null};}
function saveHearts(h){const u=U();u.v12hearts=h;S(u);}

function checkHeartRefill(){
  const hearts=getHearts();
  if(hearts.current<hearts.max&&hearts.refillTime){
    const elapsed=Date.now()-hearts.refillTime;
    const refillIntervalMs=30*60*1000;
    const refills=Math.floor(elapsed/refillIntervalMs);
    if(refills>0){
      hearts.current=Math.min(hearts.max,hearts.current+refills);
      hearts.refillTime=hearts.current>=hearts.max?null:Date.now();
      saveHearts(hearts);
      if(refills>0)v12Sfx('heart_gain');
    }
  }
  return hearts;
}

function loseHeart(){
  const hearts=getHearts();
  if(hearts.current>0){
    hearts.current--;
    hearts.lastLoss=Date.now();
    if(!hearts.refillTime)hearts.refillTime=Date.now();
    saveHearts(hearts);
    v12Sfx('heart_lose');
    checkV12Achieve('heart_survivor');
  }
  return hearts;
}

function renderHeartsPanel(){
  const hearts=checkHeartRefill();
  let h='<div class="v12-hearts" id="v12heartsPanel"><h3>❤️ 학습 하트</h3>';
  h+='<div class="heart-row">';
  for(let i=0;i<hearts.max;i++){
    h+='<span class="heart'+(i<hearts.current?'':' empty')+'">❤️</span>';
  }
  h+='</div>';
  h+='<div class="heart-info">'+hearts.current+'/'+hearts.max+' 하트 남음</div>';
  if(hearts.current<hearts.max){
    const remain=hearts.refillTime?Math.max(0,Math.ceil((hearts.refillTime+30*60*1000-Date.now())/60000)):0;
    h+='<div class="heart-timer">⏰ 다음 하트: '+remain+'분</div>';
  }else{
    h+='<div class="heart-timer" style="color:var(--cy)">✅ 하트 완충!</div>';
  }
  h+='<div style="font-size:10px;color:var(--t3);margin-top:6px">퀸즈 오답 시 하트 -1. 30분마다 자동 회복</div>';
  h+='</div>';
  return h;
}

// ===== 7. SUBJECT CONTEST MODE =====
const CONTEST_QUESTIONS=[
  {q:'피타고라스 정리: a²+b²=?',opts:['c²','c³','2c','c'],ans:0,subj:'수학'},
  {q:'물의 화학식은?',opts:['H₂O','CO₂','NaCl','O₂'],ans:0,subj:'과학'},
  {q:'DNA의 이중 나선 구조를 발견한 사람?',opts:['왓슨과 크릭','니턴','멘델','다윈'],ans:0,subj:'과학'},
  {q:'\u{1F1EC}\u{1F1E7} &#39;apple&#39;의 복수형은?',opts:['apples','applees','applis','apple'],ans:0,subj:'영어'},
  {q:'for 반복문의 3요소는?',opts:['초기화/조건/증감','시작/중간/끝','입력/처리/출력','선언/할당/반환'],ans:0,subj:'코딩'},
  {q:'세종대왕이 반포한 것은?',opts:['훈민정음','경국대전','대동법전','직지전'],ans:0,subj:'한국사'},
  {q:'옥타브(오타브) 음계의 음 수는?',opts:['8음','7음','12음','5음'],ans:0,subj:'음악'},
  {q:'빨강노 혼합 시 색상은?',opts:['주황색','보라색','녹색','갈색'],ans:0,subj:'미술'},
  {q:'올림픽 마라톤 거리는?',opts:['42.195km','40km','50km','36.5km'],ans:0,subj:'체육'},
  {q:'한글 자음 개수는?',opts:['14개','10개','21개','16개'],ans:0,subj:'한국어'},
  {q:'대한민국 3부 중 하나가 아닌 것은?',opts:['검찰','입법부','행정부','사법부'],ans:0,subj:'사회'},
  {q:'지진 발생 시 가장 먼저 해야 할 것은?',opts:['테이블 아래 대피','전화하기','밖으로 뛰기','엘리베이터 타기'],ans:0,subj:'안전'}
];

function getContestState(){const u=U();return u.v12contest||{current:null,history:[],totalWins:0};}
function saveContestState(cs){const u=U();u.v12contest=cs;S(u);}

function startContest(){
  v12Sfx('contest_start');
  const cs=getContestState();
  const questions=CONTEST_QUESTIONS.slice().sort(()=>Math.random()-.5).slice(0,5);
  cs.current={questions,idx:0,myScore:0,aiScore:0,startTime:Date.now()};
  saveContestState(cs);
  v12RefreshPanel();
}

function answerContest(optIdx){
  const cs=getContestState();
  if(!cs.current)return;
  const q=cs.current.questions[cs.current.idx];
  const isCorrect=optIdx===q.ans;
  const aiCorrect=Math.random()<0.6;

  if(isCorrect){cs.current.myScore++;v12Sfx('quiz_v12_ok');}
  else{loseHeart();v12Sfx('quiz_v12_fail');}
  if(aiCorrect)cs.current.aiScore++;

  cs.current.idx++;
  if(cs.current.idx>=cs.current.questions.length){
    const result=cs.current.myScore>cs.current.aiScore?'win':cs.current.myScore<cs.current.aiScore?'lose':'draw';
    if(result==='win'){cs.totalWins++;v12Sfx('contest_win');}
    cs.history.push({date:_today(),myScore:cs.current.myScore,aiScore:cs.current.aiScore,result});
    if(cs.history.length>30)cs.history=cs.history.slice(-30);
    checkV12Achieve('contest_first');
    if(cs.totalWins>=3)checkV12Achieve('contest_champ');
    cs.current=null;
  }
  saveContestState(cs);
  v12RefreshPanel();
}

function renderContestPanel(){
  const cs=getContestState();
  let h='<div class="v12-contest" id="v12contestPanel"><h3>\u{1F3C5} 과목 대회 모드</h3>';

  if(cs.current){
    const q=cs.current.questions[cs.current.idx];
    if(q){
      h+='<div style="display:flex;justify-content:space-between;margin-bottom:8px;font-size:11px">';
      h+='<span>\u{1F9D1} 나: '+cs.current.myScore+'점</span>';
      h+='<span>'+Math.round((cs.current.idx)/cs.current.questions.length*100)+'%</span>';
      h+='<span>\u{1F916} AI: '+cs.current.aiScore+'점</span>';
      h+='</div>';
      h+='<div style="height:4px;background:var(--c2);border-radius:2px;margin-bottom:10px"><div style="width:'+Math.round((cs.current.idx)/cs.current.questions.length*100)+'%;height:100%;background:var(--g1);border-radius:2px"></div></div>';
      h+='<div class="contest-q">Q'+(cs.current.idx+1)+'. '+q.q+'</div>';
      h+='<div class="contest-opts">';
      q.opts.forEach((opt,i)=>{
        h+='<div class="contest-opt" onclick="answerContest('+i+')">'+opt+'</div>';
      });
      h+='</div>';
    }
  }else{
    const lastResult=cs.history.slice(-1)[0];
    if(lastResult){
      const emoji=lastResult.result==='win'?'\u{1F3C6}':lastResult.result==='lose'?'\u{1F614}':'\u{1F91D}';
      h+='<div style="text-align:center;margin-bottom:10px">';
      h+='<div style="font-size:32px">'+emoji+'</div>';
      h+='<div style="font-size:13px;font-weight:700">결과: '+lastResult.myScore+' vs '+lastResult.aiScore+'</div>';
      h+='</div>';
    }
    h+='<div style="text-align:center">';
    h+='<div style="font-size:11px;color:var(--t3);margin-bottom:8px">총 '+cs.totalWins+'승 · '+cs.history.length+'회 참가</div>';
    h+='<button class="v12-btn" onclick="startContest()" style="font-weight:700">⚔️ 대회 시작!</button>';
    h+='</div>';
  }
  h+='</div>';
  return h;
}

// ===== 8. STREAK MILESTONE REWARDS =====
const MILESTONES=[
  {days:3,name:'3일 연속',reward:'+50 XP',emoji:'\u{1F31F}',xp:50},
  {days:7,name:'1주 연속',reward:'+150 XP',emoji:'\u{1F525}',xp:150},
  {days:14,name:'2주 연속',reward:'+300 XP',emoji:'\u{1F4AB}',xp:300},
  {days:21,name:'3주 연속',reward:'+500 XP',emoji:'⚡',xp:500},
  {days:30,name:'1개월 연속',reward:'+1000 XP',emoji:'\u{1F451}',xp:1000},
  {days:50,name:'50일 연속',reward:'+2000 XP',emoji:'\u{1F48E}',xp:2000},
  {days:100,name:'100일 연속',reward:'+5000 XP',emoji:'\u{1F3C6}',xp:5000},
  {days:365,name:'1년 연속',reward:'+10000 XP',emoji:'\u{1F30D}',xp:10000}
];

function getMilestoneState(){const u=U();return u.v12milestones||{claimed:[]};}
function saveMilestoneState(ms){const u=U();u.v12milestones=ms;S(u);}

function getCurrentStreak(){
  const u=U();
  return u.streak||0;
}

function claimMilestone(days){
  const ms=getMilestoneState();
  if(ms.claimed.includes(days))return;
  const milestone=MILESTONES.find(m=>m.days===days);
  if(!milestone)return;
  const streak=getCurrentStreak();
  if(streak<days)return;
  ms.claimed.push(days);
  saveMilestoneState(ms);
  v12Sfx('milestone_claim');
  checkV12Achieve('milestone_first');
  if(ms.claimed.length>=3)checkV12Achieve('milestone_collector');
  v12RefreshPanel();
}

function renderMilestonePanel(){
  const ms=getMilestoneState();
  const streak=getCurrentStreak();
  let h='<div class="v12-milestone" id="v12milestonePanel"><h3>\u{1F3AF} 스트릭 마일스톤</h3>';
  h+='<div style="text-align:center;margin-bottom:10px">';
  h+='<div style="font-size:28px;font-weight:900;background:var(--g1);-webkit-background-clip:text;-webkit-text-fill-color:transparent">\u{1F525} '+streak+'일</div>';
  h+='<div style="font-size:11px;color:var(--t3)">현재 연속 스트릭</div>';
  h+='</div>';
  h+='<div class="ms-list">';
  MILESTONES.forEach(m=>{
    const isClaimed=ms.claimed.includes(m.days);
    const canClaim=streak>=m.days&&!isClaimed;
    const isLocked=streak<m.days;
    h+='<div class="ms-item'+(isClaimed?' claimed':'')+'">';
    h+='<div class="ms-icon">'+(isClaimed?'✅':isLocked?'\u{1F512}':m.emoji)+'</div>';
    h+='<div class="ms-info"><div class="ms-name">'+m.name+'</div>';
    h+='<div class="ms-desc">'+m.reward+'</div></div>';
    if(canClaim){
      h+='<button class="ms-claim" onclick="claimMilestone('+m.days+')">\u{1F381} 받기</button>';
    }else if(isClaimed){
      h+='<span style="font-size:10px;color:var(--cy)">완료</span>';
    }else{
      h+='<span style="font-size:10px;color:var(--t3)">'+(m.days-streak)+'일 남음</span>';
    }
    h+='</div>';
  });
  h+='</div></div>';
  return h;
}

// ===== v12 QUIZ (15 questions) =====
function injectV12Quiz(){
  if(typeof window.addQuizQuestions!=='function')return;
  window.addQuizQuestions([
    {q:'간격반복 SM-2 알고리즘의 이지니스 팩터(EF) 최소값은?',o:['1.3','1.0','2.0','0.5'],a:0,cat:'학습법'},
    {q:'LevelPlay의 XP 더블 이벤트 최대 배율은?',o:['3배','2배','5배','10배'],a:0,cat:'학습법'},
    {q:'퀸즈 난이도 티어 중 최고 등급은?',o:['Grandmaster','Master','Diamond','Champion'],a:0,cat:'학습법'},
    {q:'학습 하트의 자동 회복 시간은?',o:['30분','15분','1시간','10분'],a:0,cat:'학습법'},
    {q:'스트릭 30일 마일스톤 보상은?',o:['+1000 XP','+500 XP','+2000 XP','+100 XP'],a:0,cat:'학습법'},
    {q:'원소의 주기율표를 만든 과학자는?',o:['멘델레예프','아인슈타인','니턴','다윈'],a:0,cat:'과학'},
    {q:'JavaScript에서 변수를 상수로 선언하는 키워드는?',o:['const','let','var','static'],a:0,cat:'코딩'},
    {q:'고조선의 건국 연도는?',o:['BC 2333년','BC 1000년','BC 500년','AD 1년'],a:0,cat:'한국사'},
    {q:'♭(플랫) 기호의 역할은?',o:['반음 내림','반음 올림','원래 음으로','한 옥타브 올림'],a:0,cat:'음악'},
    {q:'RGB 색 모델에서 R+G+B 최대값 혼합색은?',o:['흰색','검정','회색','노란색'],a:0,cat:'미술'},
    {q:'배드민턴 코트의 길이는?',o:['13.4m','10m','15m','20m'],a:0,cat:'체육'},
    {q:'한글 모음 중 이중모음의 개수는?',o:['11개','7개','14개','5개'],a:0,cat:'한국어'},
    {q:'국제연합(UN) 본부 소재지는?',o:['뉴욕','워싱턴','제네바','런던'],a:0,cat:'사회'},
    {q:'심폐소생술(CPR)의 압박 속도는?',o:['분당 100~120회','분당 60회','분당 200회','분당 30회'],a:0,cat:'안전'},
    {q:'LevelPlay v12.0에서 추가된 시스템 수는?',o:['8개','5개','10개','3개'],a:0,cat:'학습법'}
  ]);
}

// ===== v12 ACHIEVEMENTS =====
const V12_ACHIEVEMENTS={
  rival_first:{name:'첫 라이벌 도전',desc:'라이벌 AI에게 첫 도전',emoji:'\u{1F3AF}'},
  rival_5wins:{name:'5승 달성',desc:'라이벌 AI 5승',emoji:'\u{1F4AA}'},
  rival_master:{name:'라이벌 마스터',desc:'라이벌 AI 10승',emoji:'\u{1F451}'},
  showcase_view:{name:'쇼케이스 관람',desc:'업적 쇼케이스 확인',emoji:'\u{1F3C6}'},
  xp_event_first:{name:'첫 럭키 드로우',desc:'XP 이벤트 첫 참여',emoji:'\u{1F381}'},
  xp_event_5:{name:'이벤트 매니아',desc:'XP 이벤트 5회 참여',emoji:'⚡'},
  contest_first:{name:'첫 대회 참가',desc:'과목 대회 첫 참가',emoji:'⚔️'},
  contest_champ:{name:'대회 챔피언',desc:'과목 대회 3승',emoji:'\u{1F3C5}'},
  heart_survivor:{name:'하트 사용',desc:'하트를 잃고 도 포기하지 않기',emoji:'❤️'},
  milestone_first:{name:'첫 마일스톤',desc:'첫 스트릭 마일스톤 달성',emoji:'\u{1F31F}'},
  milestone_collector:{name:'마일스톤 수집가',desc:'마일스톤 3개 달성',emoji:'\u{1F48E}'},
  v12_explorer:{name:'v12 탐험가',desc:'v12 모든 기능 확인',emoji:'\u{1F680}'}
};

function checkV12Achieve(key){
  const u=U();
  if(!u.achievements)u.achievements={};
  if(u.achievements[key])return;
  u.achievements[key]=true;
  S(u);
  v12Sfx('achieve_v12');
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown',function(e){
  if(!e.shiftKey)return;
  const map={
    'R':'rival','G':'showcase','E':'xpevent','D':'report',
    'I':'tier','H':'hearts','K':'contest','N':'milestone'
  };
  const panel=map[e.key.toUpperCase()];
  if(panel){e.preventDefault();v12ShowPanel(panel);}
});

// ===== PANEL SWITCHING =====
window.v12ShowPanel=function(panel){
  v12Sfx('feature_open12');
  const container=_el('v12Container');
  if(!container)return;
  const target=document.getElementById('v12'+panel+'Panel');
  if(target){target.scrollIntoView({behavior:'smooth',block:'start'});}
};

// ===== REFRESH =====
function v12RefreshPanel(){
  const container=_el('v12Container');
  if(!container)return;
  let h='<div class="sec" style="font-size:16px;font-weight:700;margin:10px 0">\u{1F680} v12 — 라이벌·쇼케이스·티어·대회</div>';
  h+=renderRivalPanel();
  h+=renderShowcasePanel();
  h+=renderXPEventPanel();
  h+=renderReportPanel();
  h+=renderTierPanel();
  h+=renderHeartsPanel();
  h+=renderContestPanel();
  h+=renderMilestonePanel();
  container.innerHTML=h;

  setTimeout(function(){
    renderShowcaseCanvas();
    renderReportCanvas();
    renderTierCanvas();
  },100);

  checkV12Achieve('showcase_view');
}

// ===== BOTTOM NAV =====
function createV12Nav(){
  if(_el('v12nav'))return;
  const nav=document.createElement('div');
  nav.id='v12nav';nav.className='v12-nav';
  const items=[
    ['\u{1F3AF}','rival','라이벌'],
    ['\u{1F3C6}','showcase','쇼케이스'],
    ['⚡','xpevent','XP이벤트'],
    ['\u{1F4DC}','report','성적표'],
    ['\u{1F396}️','tier','티어'],
    ['❤️','hearts','하트'],
    ['\u{1F3C5}','contest','대회'],
    ['\u{1F3AF}','milestone','마일스톤']
  ];
  nav.innerHTML=items.map(([icon,panel,nm])=>
    `<button onclick="v12ShowPanel('${panel}')" title="${nm}">${icon} ${nm}</button>`
  ).join('');
  document.body.appendChild(nav);
}

// ===== EXPOSE GLOBALS =====
window.challengeRival=challengeRival;
window.renderShowcaseCanvas=renderShowcaseCanvas;
window.exportShowcase=exportShowcase;
window.startXPEvent=startXPEvent;
window.renderReportCanvas=renderReportCanvas;
window.exportReport=exportReport;
window.renderTierCanvas=renderTierCanvas;
window.loseHeart=loseHeart;
window.startContest=startContest;
window.answerContest=answerContest;
window.claimMilestone=claimMilestone;
window.v12ShowPanel=v12ShowPanel;

// ===== INJECT INTO HOME =====
function v12InjectHome(){
  const homePage=document.getElementById('pg0');
  if(!homePage)return;
  if(_el('v12Container'))return;
  const sec=document.createElement('div');
  sec.id='v12Container';sec.style.marginTop='10px';
  const v11c=_el('v11Container');
  if(v11c)v11c.parentNode.insertBefore(sec,v11c.nextSibling);
  else{
    const firstSec=homePage.querySelector('.sec');
    if(firstSec)homePage.insertBefore(sec,firstSec);
    else homePage.prepend(sec);
  }
  v12RefreshPanel();
}

// ===== INIT =====
function v12Init(){
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',function(){v12InjectHome();createV12Nav();injectV12Quiz();});
  }else{
    setTimeout(function(){v12InjectHome();createV12Nav();injectV12Quiz();},1000);
  }
}
v12Init();

})();
