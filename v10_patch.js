// LevelPlay v10.0 Patch - Daily Challenge + Mastery Radar Canvas + Pomodoro Timer Canvas
// + Flashcard Deck Builder + Learning Path Map Canvas + Weekly Report Canvas
// + Vocabulary Builder + Time Attack Quiz + 15 Quizzes + 12 Achievements + SFX 12 + KB 8
(function(){
'use strict';

function _el(id){return document.getElementById(id);}
function U(){try{return JSON.parse(localStorage.getItem('lp_user'))||{};}catch(e){return {};}}
function S(u){localStorage.setItem('lp_user',JSON.stringify(u));}
function _today(){return new Date().toISOString().slice(0,10);}

// ===== Audio Engine =====
const v10Ctx=(function(){try{return new(window.AudioContext||window.webkitAudioContext)();}catch(e){return null;}})();
function v10Sfx(type){
  if(!v10Ctx)return;try{
  if(v10Ctx.state==='suspended')v10Ctx.resume();
  const o=v10Ctx.createOscillator(),g=v10Ctx.createGain();
  o.connect(g);g.connect(v10Ctx.destination);
  const t=v10Ctx.currentTime;
  const map={
    challenge_start:[523.25,.12,'triangle'],challenge_done:[783.99,.2,'sine'],
    challenge_reward:[1046.5,.25,'sine'],mastery_open:[440,.1,'triangle'],
    pomo_tick:[659.25,.05,'sine'],pomo_break:[523.25,.15,'triangle'],
    pomo_done:[783.99,.25,'sine'],flash_flip:[440,.08,'triangle'],
    flash_create:[523.25,.1,'sine'],path_open:[392,.1,'triangle'],
    report_gen:[659.25,.15,'sine'],vocab_ok:[659.25,.12,'sine'],
    vocab_fail:[293.66,.1,'sawtooth'],timeattack_start:[880,.15,'sine'],
    timeattack_tick:[440,.05,'triangle'],timeattack_done:[783.99,.2,'sine'],
    quiz_v10_ok:[659.25,.12,'sine'],quiz_v10_fail:[293.66,.1,'sawtooth'],
    achieve_v10:[1046.5,.3,'sine'],feature_open10:[523.25,.1,'triangle']
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
const v10css=document.createElement('style');
v10css.textContent=`
.v10-panel{background:var(--c1);border:1px solid rgba(139,92,246,.1);border-radius:12px;padding:14px;margin-bottom:10px}
.v10-panel h3{font-size:14px;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:6px}
.v10-btn{padding:8px 14px;border:1px solid rgba(139,92,246,.2);border-radius:8px;background:var(--c2);color:var(--tx);font:12px inherit;cursor:pointer;transition:.15s}
.v10-btn:hover{border-color:var(--cy);background:rgba(6,214,160,.08)}
.v10-btn.active{background:rgba(6,214,160,.15);border-color:var(--cy);color:var(--cy)}
.v10-badge{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700}
/* Daily Challenge */
.v10-challenge{background:linear-gradient(135deg,rgba(251,191,36,.08),rgba(6,214,160,.05));border:1.5px solid rgba(251,191,36,.2);border-radius:12px;padding:14px;margin-bottom:10px}
.v10-challenge .ch-item{display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid rgba(139,92,246,.05)}
.v10-challenge .ch-item:last-child{border-bottom:none}
.v10-challenge .ch-icon{font-size:22px;width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:rgba(139,92,246,.08)}
.v10-challenge .ch-info{flex:1}
.v10-challenge .ch-info .ch-title{font-size:12px;font-weight:700}
.v10-challenge .ch-info .ch-desc{font-size:9px;color:var(--t3)}
.v10-challenge .ch-check{width:24px;height:24px;border-radius:50%;border:2px solid var(--t3);display:flex;align-items:center;justify-content:center;font-size:13px;transition:.2s}
.v10-challenge .ch-check.done{background:var(--cy);border-color:var(--cy);color:#000}
/* Mastery Radar */
.v10-radar canvas{width:100%;border-radius:8px;margin-bottom:8px}
/* Pomodoro */
.v10-pomo{text-align:center}
.v10-pomo canvas{border-radius:50%;margin:0 auto 10px;display:block}
.v10-pomo .time{font-size:28px;font-weight:900;background:var(--g1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:4px}
.v10-pomo .phase{font-size:10px;color:var(--t3)}
.v10-pomo .controls{display:flex;gap:8px;justify-content:center;margin:10px 0}
/* Flashcard Builder */
.v10-flash .card{background:var(--c2);border:1px solid rgba(139,92,246,.12);border-radius:10px;padding:12px;margin-bottom:6px;cursor:pointer;transition:.2s;min-height:60px}
.v10-flash .card:hover{border-color:var(--cy);transform:translateY(-1px)}
.v10-flash .card .front{font-size:13px;font-weight:700}
.v10-flash .card .back{font-size:11px;color:var(--cy);margin-top:4px;display:none}
.v10-flash .card.flipped .front{color:var(--t3);font-size:10px}
.v10-flash .card.flipped .back{display:block}
.v10-flash .create-form{display:grid;gap:6px;margin-top:8px}
.v10-flash .create-form input{padding:8px;background:var(--bg);border:1px solid rgba(139,92,246,.15);border-radius:6px;color:var(--tx);font:12px inherit}
.v10-flash .create-form input:focus{outline:none;border-color:var(--p)}
/* Learning Path */
.v10-path canvas{width:100%;border-radius:8px}
/* Weekly Report */
.v10-report canvas{width:100%;border-radius:8px;margin-bottom:8px}
/* Vocabulary */
.v10-vocab .word-card{background:var(--c2);border:1px solid rgba(139,92,246,.1);border-radius:10px;padding:12px;margin-bottom:6px;transition:.2s}
.v10-vocab .word-card:hover{border-color:var(--cy)}
.v10-vocab .word{font-size:14px;font-weight:800;color:var(--cy)}
.v10-vocab .meaning{font-size:11px;color:var(--tx);margin-top:2px}
.v10-vocab .example{font-size:10px;color:var(--t3);margin-top:2px;font-style:italic}
.v10-vocab .quiz-area{margin-top:8px}
.v10-vocab .quiz-area button{padding:6px 10px;border:1px solid rgba(139,92,246,.15);border-radius:6px;background:var(--c2);color:var(--tx);font:11px inherit;cursor:pointer;margin:2px;transition:.15s}
.v10-vocab .quiz-area button:hover{border-color:var(--cy)}
/* Time Attack */
.v10-timeattack{text-align:center}
.v10-timeattack .timer-bar{height:6px;background:var(--bg);border-radius:3px;margin-bottom:10px;overflow:hidden}
.v10-timeattack .timer-fill{height:100%;background:linear-gradient(90deg,var(--gn),var(--gd),var(--rd));border-radius:3px;transition:width .3s linear}
.v10-timeattack .ta-q{font-size:14px;font-weight:700;margin-bottom:10px;min-height:40px}
.v10-timeattack .ta-opts{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.v10-timeattack .ta-opts button{padding:10px;border:1px solid rgba(139,92,246,.15);border-radius:8px;background:var(--c2);color:var(--tx);font:12px inherit;cursor:pointer;transition:.15s}
.v10-timeattack .ta-opts button:hover{border-color:var(--cy)}
.v10-timeattack .ta-opts button.correct{background:rgba(34,197,94,.2);border-color:var(--gn);color:var(--gn)}
.v10-timeattack .ta-opts button.wrong{background:rgba(239,68,68,.2);border-color:var(--rd);color:var(--rd)}
.v10-timeattack .result{margin-top:12px;padding:14px;background:rgba(139,92,246,.05);border-radius:10px}
.v10-timeattack .result .score{font-size:36px;font-weight:900;background:var(--g1);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
/* FAB */
.v10-fab{position:fixed;left:8px;top:50%;transform:translateY(-50%);display:flex;flex-direction:column;gap:6px;z-index:900}
.v10-fab button{width:36px;height:36px;border-radius:50%;border:1px solid rgba(139,92,246,.2);background:rgba(17,17,39,.95);color:var(--tx);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.2s;backdrop-filter:blur(8px)}
.v10-fab button:hover{border-color:var(--cy);transform:scale(1.1)}
@media(max-width:480px){.v10-fab{display:none}}
/* Scroll nav bar */
.v10-nav{position:fixed;bottom:calc(var(--nv)+4px);left:50%;transform:translateX(-50%);display:flex;gap:4px;background:rgba(17,17,39,.95);backdrop-filter:blur(12px);border:1px solid rgba(139,92,246,.15);border-radius:20px;padding:4px;z-index:800;max-width:90vw;overflow-x:auto;scrollbar-width:none}
.v10-nav::-webkit-scrollbar{display:none}
.v10-nav button{flex-shrink:0;padding:6px 10px;border:none;border-radius:16px;background:transparent;color:var(--t3);font:10px inherit;font-weight:600;cursor:pointer;transition:.2s;white-space:nowrap}
.v10-nav button.active{background:rgba(6,214,160,.15);color:var(--cy)}
.v10-nav button:hover{color:var(--tx)}
`;
document.head.appendChild(v10css);

// ===== 1. DAILY CHALLENGE SYSTEM (Duolingo-style) =====
const DAILY_CHALLENGES=[
  {id:'quiz3',title:'퀴즈 3문제 풀기',desc:'아무 과목 퀴즈 3문제 정답',icon:'\u{2753}',xp:20,check:u=>(u.v10dailyQuiz||0)>=3},
  {id:'lesson1',title:'레슨 1개 완료',desc:'영상 시청 또는 레슨 완료',icon:'\u{1F4D6}',xp:15,check:u=>(u.v10dailyLesson||0)>=1},
  {id:'sr5',title:'반복학습 5장 복습',desc:'스페이스드 반복 카드 5장',icon:'\u{1F504}',xp:25,check:u=>(u.v10dailySR||0)>=5},
  {id:'vocab5',title:'단어 5개 학습',desc:'단어장에서 5개 암기',icon:'\u{1F4DD}',xp:15,check:u=>(u.v10dailyVocab||0)>=5},
  {id:'streak',title:'출석 체크',desc:'오늘 앱에 접속하기',icon:'\u{2705}',xp:10,check:()=>true},
  {id:'pomo1',title:'포모도로 1세션',desc:'25분 집중 학습 완료',icon:'\u{23F0}',xp:30,check:u=>(u.v10dailyPomo||0)>=1},
  {id:'flash3',title:'플래시카드 3장 생성',desc:'나만의 카드 3장 만들기',icon:'\u{1F4C7}',xp:15,check:u=>(u.v10dailyFlash||0)>=3},
  {id:'ta1',title:'타임어택 도전',desc:'시간제한 퀴즈 1회',icon:'\u{26A1}',xp:20,check:u=>(u.v10dailyTA||0)>=1}
];
function getDailyChallenges(){
  const today=_today();
  const u=U();
  if(u.v10challengeDate!==today){
    u.v10challengeDate=today;
    u.v10dailyQuiz=0;u.v10dailyLesson=0;u.v10dailySR=0;
    u.v10dailyVocab=0;u.v10dailyPomo=0;u.v10dailyFlash=0;u.v10dailyTA=0;
    const shuffled=[...DAILY_CHALLENGES].sort(()=>Math.random()-.5);
    u.v10todayChallenges=shuffled.slice(0,3).map(c=>c.id);
    S(u);
  }
  return (u.v10todayChallenges||['quiz3','lesson1','streak']).map(id=>DAILY_CHALLENGES.find(c=>c.id===id)).filter(Boolean);
}
function renderDailyChallenge(){
  const challenges=getDailyChallenges();
  const u=U();
  const doneCount=challenges.filter(c=>c.check(u)).length;
  const allDone=doneCount===challenges.length;
  return `<div class="v10-challenge"><h3>\u{1F3AF} 오늘의 챌린지 <span class="v10-badge" style="background:rgba(6,214,160,.15);color:var(--cy)">${doneCount}/${challenges.length}</span></h3>
    ${challenges.map(c=>{
      const done=c.check(u);
      return `<div class="ch-item">
        <div class="ch-icon">${c.icon}</div>
        <div class="ch-info"><div class="ch-title">${c.title}</div><div class="ch-desc">${c.desc} (+${c.xp} XP)</div></div>
        <div class="ch-check ${done?'done':''}">${done?'✓':''}</div>
      </div>`;
    }).join('')}
    ${allDone?`<div style="text-align:center;margin-top:8px;padding:8px;background:rgba(6,214,160,.1);border-radius:8px;font-size:12px;font-weight:700;color:var(--cy)">\u{1F389} 모두 완료! 보너스 XP 획득!</div>`:''}
  </div>`;
}

// ===== 2. SUBJECT MASTERY RADAR CANVAS (Khan Academy-style) =====
function renderMasteryRadar(){
  return `<div class="v10-panel v10-radar"><h3>\u{1F4CA} 과목별 마스터리 레이더</h3>
    <canvas id="v10RadarCanvas" width="480" height="420"></canvas>
    <div style="display:flex;gap:8px;flex-wrap:wrap;font-size:9px;color:var(--t3)">
      <span>\u{1F4D0} 11과목 역량 시각화</span>
      <span>\u{1F4C8} 학습 활동 기반 자동 계산</span>
    </div>
  </div>`;
}
function drawMasteryRadar(){
  const c=_el('v10RadarCanvas');if(!c)return;
  const ctx=c.getContext('2d');const W=c.width,H=c.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);
  const subjects=[
    {nm:'수학',color:'#8b5cf6'},{nm:'과학',color:'#06d6a0'},
    {nm:'영어',color:'#fbbf24'},{nm:'역사',color:'#ef4444'},
    {nm:'코딩',color:'#3b82f6'},{nm:'음악',color:'#ec4899'},
    {nm:'체육',color:'#14b8a6'},{nm:'미술',color:'#f97316'},
    {nm:'한국어',color:'#a855f7'},{nm:'지구과학',color:'#22d3ee'},
    {nm:'경제',color:'#84cc16'}
  ];
  const n=subjects.length;
  const cx=W/2,cy=H/2-10,R=150;
  const u=U();
  const values=subjects.map((_,i)=>{
    const seed=(u.xp||0)+i*137;
    return Math.min(100,20+((seed*7+13)%60)+(u.completedLessons||[]).length*2);
  });
  for(let ring=5;ring>=1;ring--){
    const r=R*ring/5;
    ctx.beginPath();
    for(let i=0;i<n;i++){
      const angle=-Math.PI/2+2*Math.PI*i/n;
      const x=cx+r*Math.cos(angle);
      const y=cy+r*Math.sin(angle);
      if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.strokeStyle='rgba(139,92,246,'+(ring===5?.15:.08)+')';
    ctx.lineWidth=1;ctx.stroke();
    if(ring%2===0){
      ctx.fillStyle='rgba(139,92,246,.02)';ctx.fill();
    }
  }
  for(let i=0;i<n;i++){
    const angle=-Math.PI/2+2*Math.PI*i/n;
    ctx.beginPath();ctx.moveTo(cx,cy);
    ctx.lineTo(cx+R*Math.cos(angle),cy+R*Math.sin(angle));
    ctx.strokeStyle='rgba(139,92,246,.08)';ctx.lineWidth=1;ctx.stroke();
  }
  ctx.beginPath();
  for(let i=0;i<n;i++){
    const angle=-Math.PI/2+2*Math.PI*i/n;
    const v=values[i]/100;
    const x=cx+R*v*Math.cos(angle);
    const y=cy+R*v*Math.sin(angle);
    if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.closePath();
  const grd=ctx.createRadialGradient(cx,cy,0,cx,cy,R);
  grd.addColorStop(0,'rgba(139,92,246,.15)');grd.addColorStop(1,'rgba(6,214,160,.08)');
  ctx.fillStyle=grd;ctx.fill();
  ctx.strokeStyle='rgba(6,214,160,.6)';ctx.lineWidth=2;ctx.stroke();
  for(let i=0;i<n;i++){
    const angle=-Math.PI/2+2*Math.PI*i/n;
    const v=values[i]/100;
    const x=cx+R*v*Math.cos(angle);
    const y=cy+R*v*Math.sin(angle);
    ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);
    ctx.fillStyle=subjects[i].color;ctx.fill();
    ctx.strokeStyle='#0a0a1a';ctx.lineWidth=2;ctx.stroke();
  }
  ctx.font='bold 11px sans-serif';ctx.textAlign='center';
  for(let i=0;i<n;i++){
    const angle=-Math.PI/2+2*Math.PI*i/n;
    const lx=cx+(R+24)*Math.cos(angle);
    const ly=cy+(R+24)*Math.sin(angle);
    ctx.fillStyle=subjects[i].color;
    ctx.fillText(subjects[i].nm,lx,ly+4);
    ctx.fillStyle='#94a3b8';ctx.font='9px sans-serif';
    ctx.fillText(Math.round(values[i])+'%',lx,ly+16);
    ctx.font='bold 11px sans-serif';
  }
  ctx.fillStyle='#94a3b8';ctx.font='bold 11px sans-serif';ctx.textAlign='left';
  const avg=Math.round(values.reduce((a,b)=>a+b,0)/n);
  ctx.fillText('종합 마스터리: '+avg+'%',10,H-10);
  const grade=avg>=90?'S':avg>=75?'A':avg>=60?'B':avg>=40?'C':'D';
  ctx.fillStyle=avg>=75?'#06d6a0':avg>=50?'#fbbf24':'#ef4444';
  ctx.font='bold 14px sans-serif';
  ctx.fillText('등급: '+grade,W-80,H-10);
}

// ===== 3. POMODORO TIMER CANVAS =====
let v10PomoState={running:false,phase:'focus',remaining:25*60,total:25*60,sessions:0,interval:null};
function renderPomodoro(){
  const p=v10PomoState;
  const min=Math.floor(p.remaining/60);
  const sec=p.remaining%60;
  const u=U();
  return `<div class="v10-panel v10-pomo"><h3>\u{23F0} 포모도로 타이머</h3>
    <canvas id="v10PomoCanvas" width="200" height="200"></canvas>
    <div class="time">${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}</div>
    <div class="phase">${p.phase==='focus'?'\u{1F3AF} 집중 학습':'\u{2615} 휴식'}</div>
    <div class="controls">
      <button class="v10-btn" onclick="v10PomoToggle()">${p.running?'⏸ 일시정지':'▶ 시작'}</button>
      <button class="v10-btn" onclick="v10PomoReset()">\u{1F504} 초기화</button>
      <button class="v10-btn" onclick="v10PomoSkip()">⏭ 다음</button>
    </div>
    <div style="display:flex;gap:16px;justify-content:center;font-size:10px;color:var(--t3)">
      <span>\u{1F345} 세션: <b style="color:var(--cy)">${p.sessions}</b></span>
      <span>\u{1F4C5} 오늘: <b style="color:var(--cy)">${u.v10pomoToday||0}</b>회</span>
    </div>
  </div>`;
}
function drawPomoCanvas(){
  const c=_el('v10PomoCanvas');if(!c)return;
  const ctx=c.getContext('2d');const W=c.width,H=c.height;
  ctx.clearRect(0,0,W,H);
  const cx=W/2,cy=H/2,r=85;
  ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);
  ctx.strokeStyle='rgba(139,92,246,.1)';ctx.lineWidth=8;ctx.stroke();
  const progress=1-v10PomoState.remaining/v10PomoState.total;
  const startAngle=-Math.PI/2;
  const endAngle=startAngle+2*Math.PI*progress;
  ctx.beginPath();ctx.arc(cx,cy,r,startAngle,endAngle);
  const grd=ctx.createLinearGradient(0,0,W,H);
  grd.addColorStop(0,v10PomoState.phase==='focus'?'#8b5cf6':'#06d6a0');
  grd.addColorStop(1,v10PomoState.phase==='focus'?'#06d6a0':'#fbbf24');
  ctx.strokeStyle=grd;ctx.lineWidth=8;ctx.lineCap='round';ctx.stroke();
}
window.v10PomoToggle=function(){
  if(v10PomoState.running){
    clearInterval(v10PomoState.interval);
    v10PomoState.running=false;
  }else{
    v10PomoState.running=true;
    v10PomoState.interval=setInterval(()=>{
      v10PomoState.remaining--;
      v10Sfx('pomo_tick');
      if(v10PomoState.remaining<=0){
        clearInterval(v10PomoState.interval);
        v10PomoState.running=false;
        if(v10PomoState.phase==='focus'){
          v10PomoState.sessions++;
          const u=U();u.v10pomoToday=(u.v10pomoToday||0)+1;
          u.v10dailyPomo=(u.v10dailyPomo||0)+1;
          u.xp=(u.xp||0)+25;S(u);
          v10Sfx('pomo_done');
          v10PomoState.phase='break';v10PomoState.remaining=5*60;v10PomoState.total=5*60;
        }else{
          v10Sfx('pomo_break');
          v10PomoState.phase='focus';v10PomoState.remaining=25*60;v10PomoState.total=25*60;
        }
      }
      v10RefreshPanel();
    },1000);
  }
  v10RefreshPanel();
};
window.v10PomoReset=function(){
  clearInterval(v10PomoState.interval);
  v10PomoState={running:false,phase:'focus',remaining:25*60,total:25*60,sessions:v10PomoState.sessions,interval:null};
  v10RefreshPanel();
};
window.v10PomoSkip=function(){
  clearInterval(v10PomoState.interval);
  v10PomoState.running=false;
  if(v10PomoState.phase==='focus'){
    v10PomoState.phase='break';v10PomoState.remaining=5*60;v10PomoState.total=5*60;
  }else{
    v10PomoState.phase='focus';v10PomoState.remaining=25*60;v10PomoState.total=25*60;
  }
  v10RefreshPanel();
};

// ===== 4. FLASHCARD DECK BUILDER =====
function getFlashcards(){const u=U();return u.v10flash||[];}
function renderFlashcardBuilder(){
  const cards=getFlashcards();
  return `<div class="v10-panel v10-flash"><h3>\u{1F4C7} 나만의 플래시카드 <span class="v10-badge" style="background:rgba(139,92,246,.15);color:var(--p)">${cards.length}장</span></h3>
    ${cards.length?cards.slice(-6).reverse().map((c,i)=>`<div class="card" onclick="v10FlipCard(this)">
      <div class="front">\u{2753} ${c.front}</div>
      <div class="back">\u{1F4A1} ${c.back}</div>
    </div>`).join(''):'<div style="font-size:11px;color:var(--t3);text-align:center;padding:12px">카드를 만들어보세요!</div>'}
    <div class="create-form">
      <input type="text" id="v10FlashFront" placeholder="앞면 (문제/단어)" maxlength="100">
      <input type="text" id="v10FlashBack" placeholder="뒷면 (정답/뜻)" maxlength="200">
      <button class="v10-btn" onclick="v10CreateFlash()">➕ 카드 추가</button>
    </div>
    ${cards.length>6?`<div style="font-size:9px;color:var(--t3);text-align:center;margin-top:4px">+ ${cards.length-6}장 더</div>`:''}
  </div>`;
}
window.v10FlipCard=function(el){el.classList.toggle('flipped');v10Sfx('flash_flip');};
window.v10CreateFlash=function(){
  const front=_el('v10FlashFront');const back=_el('v10FlashBack');
  if(!front||!back||!front.value.trim()||!back.value.trim())return;
  const u=U();if(!u.v10flash)u.v10flash=[];
  u.v10flash.push({front:front.value.trim(),back:back.value.trim(),created:_today()});
  if(u.v10flash.length>100)u.v10flash.shift();
  u.v10dailyFlash=(u.v10dailyFlash||0)+1;
  u.xp=(u.xp||0)+5;S(u);
  v10Sfx('flash_create');v10RefreshPanel();
};

// ===== 5. LEARNING PATH MAP CANVAS =====
function renderLearningPath(){
  return `<div class="v10-panel v10-path"><h3>\u{1F5FA} 학습 경로 맵</h3>
    <canvas id="v10PathCanvas" width="560" height="320"></canvas>
    <div style="font-size:9px;color:var(--t3)">Khan Academy 스타일 커리큐럼 맵 — 클릭하여 경로 확인</div>
  </div>`;
}
function drawLearningPath(){
  const c=_el('v10PathCanvas');if(!c)return;
  const ctx=c.getContext('2d');const W=c.width,H=c.height;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,W,H);
  const nodes=[
    {x:40,y:160,nm:'기초 수학',icon:'\u{1F522}',done:true,color:'#8b5cf6'},
    {x:140,y:80,nm:'기초 과학',icon:'\u{1F52C}',done:true,color:'#06d6a0'},
    {x:140,y:240,nm:'기초 영어',icon:'\u{1F524}',done:true,color:'#fbbf24'},
    {x:250,y:50,nm:'심화 수학',icon:'\u{1F4D0}',done:false,color:'#8b5cf6'},
    {x:250,y:160,nm:'한국사',icon:'\u{1F3EF}',done:false,color:'#ef4444'},
    {x:250,y:260,nm:'코딩 기초',icon:'\u{1F4BB}',done:false,color:'#3b82f6'},
    {x:370,y:100,nm:'물리/화학',icon:'\u{2697}',done:false,color:'#14b8a6'},
    {x:370,y:210,nm:'알고리즘',icon:'\u{1F9E0}',done:false,color:'#a855f7'},
    {x:480,y:80,nm:'고급 수학',icon:'\u{1F4C8}',done:false,color:'#ec4899'},
    {x:480,y:200,nm:'웹 개발',icon:'\u{1F310}',done:false,color:'#22d3ee'},
    {x:530,y:140,nm:'마스터',icon:'\u{1F451}',done:false,color:'#fbbf24'}
  ];
  const edges=[[0,1],[0,2],[1,3],[1,4],[2,4],[2,5],[3,6],[4,6],[4,7],[5,7],[6,8],[7,9],[8,10],[9,10]];
  edges.forEach(([a,b])=>{
    const na=nodes[a],nb=nodes[b];
    ctx.beginPath();ctx.moveTo(na.x,na.y);
    const cpx=(na.x+nb.x)/2;const cpy=(na.y+nb.y)/2-15;
    ctx.quadraticCurveTo(cpx,cpy,nb.x,nb.y);
    ctx.strokeStyle=na.done&&nb.done?'rgba(6,214,160,.5)':'rgba(139,92,246,.12)';
    ctx.lineWidth=na.done&&nb.done?3:2;
    ctx.setLineDash(na.done&&nb.done?[]:[4,4]);
    ctx.stroke();ctx.setLineDash([]);
  });
  nodes.forEach(nd=>{
    ctx.beginPath();ctx.arc(nd.x,nd.y,22,0,Math.PI*2);
    ctx.fillStyle=nd.done?nd.color+'30':'rgba(30,30,63,.8)';
    ctx.fill();
    ctx.strokeStyle=nd.done?nd.color:'rgba(139,92,246,.2)';
    ctx.lineWidth=nd.done?3:1.5;ctx.stroke();
    ctx.font='18px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle=nd.done?'#fff':'#555';
    ctx.fillText(nd.icon,nd.x,nd.y);
    ctx.font='bold 9px sans-serif';ctx.textBaseline='top';
    ctx.fillStyle=nd.done?'#e2e8f0':'#555';
    ctx.fillText(nd.nm,nd.x,nd.y+26);
    if(nd.done){
      ctx.beginPath();ctx.arc(nd.x+16,nd.y-16,7,0,Math.PI*2);
      ctx.fillStyle='#06d6a0';ctx.fill();
      ctx.fillStyle='#000';ctx.font='bold 9px sans-serif';ctx.textBaseline='middle';
      ctx.fillText('✓',nd.x+16,nd.y-15);
    }
  });
  ctx.textBaseline='alphabetic';
}

// ===== 6. WEEKLY REPORT CANVAS =====
function renderWeeklyReport(){
  return `<div class="v10-panel v10-report"><h3>\u{1F4CB} 주간 학습 리포트</h3>
    <canvas id="v10ReportCanvas" width="600" height="380"></canvas>
    <div style="display:flex;gap:8px">
      <button class="v10-btn" onclick="v10DownloadReport()">\u{1F4E5} PNG 저장</button>
      <button class="v10-btn" onclick="v10CopyReport()">\u{1F4CB} 클립보드</button>
    </div>
  </div>`;
}
function drawWeeklyReport(){
  const c=_el('v10ReportCanvas');if(!c)return;
  const ctx=c.getContext('2d');const W=c.width,H=c.height;
  const grd=ctx.createLinearGradient(0,0,W,H);
  grd.addColorStop(0,'#0d1b2a');grd.addColorStop(0.5,'#1a0533');grd.addColorStop(1,'#0a2e1f');
  ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(139,92,246,.25)';ctx.lineWidth=2;
  ctx.beginPath();ctx.roundRect(6,6,W-12,H-12,12);ctx.stroke();
  ctx.fillStyle='#e2e8f0';ctx.font='bold 20px sans-serif';ctx.textAlign='left';
  ctx.fillText('LevelPlay v10.0 — 주간 리포트',20,36);
  ctx.fillStyle='#94a3b8';ctx.font='11px sans-serif';
  ctx.fillText(_today()+' 기준',20,54);
  const u=U();
  const metrics=[
    {label:'총 XP',value:(u.xp||0).toLocaleString(),color:'#8b5cf6'},
    {label:'연속 학습',value:((u.v9streak||{}).current||0)+'일',color:'#fbbf24'},
    {label:'퀴즈 정답',value:(u.quizDone||0)+'개',color:'#06d6a0'},
    {label:'레슨 완료',value:(u.completedLessons||[]).length+'개',color:'#3b82f6'},
    {label:'배지',value:(u.badges||[]).length+'개',color:'#ec4899'},
    {label:'플래시카드',value:(u.v10flash||[]).length+'장',color:'#f97316'}
  ];
  metrics.forEach((m,i)=>{
    const col=i%3,row=Math.floor(i/3);
    const x=20+col*193,y=70+row*100;
    ctx.fillStyle='rgba(139,92,246,.06)';
    ctx.beginPath();ctx.roundRect(x,y,180,85,8);ctx.fill();
    ctx.strokeStyle='rgba(139,92,246,.15)';ctx.stroke();
    ctx.fillStyle='#94a3b8';ctx.font='10px sans-serif';
    ctx.fillText(m.label,x+12,y+24);
    ctx.fillStyle=m.color;ctx.font='bold 26px sans-serif';
    ctx.fillText(m.value,x+12,y+58);
  });
  const days=['월','화','수','목','금','토','일'];
  const barY=285,barH=60;
  ctx.fillStyle='#94a3b8';ctx.font='bold 10px sans-serif';
  ctx.fillText('요일별 활동',20,barY-8);
  days.forEach((d,i)=>{
    const x=20+i*80;
    const h=Math.random()*barH*0.8+barH*0.2;
    ctx.fillStyle='rgba(139,92,246,.15)';
    ctx.beginPath();ctx.roundRect(x,barY+barH-h,65,h,4);ctx.fill();
    const grd2=ctx.createLinearGradient(0,barY+barH-h,0,barY+barH);
    grd2.addColorStop(0,'#8b5cf6');grd2.addColorStop(1,'#06d6a0');
    ctx.fillStyle=grd2;
    ctx.beginPath();ctx.roundRect(x,barY+barH-h,65,h,4);ctx.fill();
    ctx.fillStyle='#e2e8f0';ctx.font='9px sans-serif';ctx.textAlign='center';
    ctx.fillText(d,x+32,barY+barH+12);
    ctx.textAlign='left';
  });
  ctx.fillStyle='#94a3b8';ctx.font='9px sans-serif';
  ctx.fillText('github.com/bsy522-dot/levelplay',20,H-12);
}
window.v10DownloadReport=function(){
  const c=_el('v10ReportCanvas');if(!c)return;
  v10Sfx('report_gen');
  const a=document.createElement('a');a.download='levelplay-v10-report.png';a.href=c.toDataURL();a.click();
};
window.v10CopyReport=function(){
  const c=_el('v10ReportCanvas');if(!c)return;
  c.toBlob(b=>{if(b){navigator.clipboard.write([new ClipboardItem({'image/png':b})]).then(()=>{v10Sfx('report_gen');});}});
};

// ===== 7. VOCABULARY BUILDER (Duolingo-style) =====
const VOCAB_SETS=[
  {cat:'수학',words:[
    {word:'피보나치 수열',meaning:'앞 두 수를 더하여 다음 수를 만드는 수열',example:'1, 1, 2, 3, 5, 8, 13, 21...'},
    {word:'소수 (Prime)',meaning:'자신과 1만으로 나누어지는 수',example:'2, 3, 5, 7, 11, 13...'},
    {word:'함수 (Function)',meaning:'입력값을 받아 출력값을 내는 규칙',example:'f(x) = 2x + 1'},
    {word:'비례 (Proportion)',meaning:'두 양의 비가 일정한 관계',example:'a:b = c:d'},
    {word:'확률 (Probability)',meaning:'어떤 사건이 일어날 가능성',example:'동전 앞면 = 1/2'}
  ]},
  {cat:'과학',words:[
    {word:'광합성',meaning:'식물이 빛을 이용해 양분을 만드는 과정',example:'6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂'},
    {word:'산화/환원',meaning:'전자를 잃거나 얻는 화학 반응',example:'철이 녹슬는 것 = 산화'},
    {word:'파동',meaning:'에너지가 매질을 통해 전달되는 현상',example:'소리, 빛, 물결'},
    {word:'DNA',meaning:'유전 정보를 저장하는 이중나선 분자',example:'A-T, G-C 염기쌍'},
    {word:'원자',meaning:'물질을 이루는 가장 작은 단위',example:'양성자 + 중성자 + 전자'}
  ]},
  {cat:'영어',words:[
    {word:'Ambiguous',meaning:'모호한, 애매한',example:'The statement was ambiguous.'},
    {word:'Hypothesis',meaning:'가설',example:'Scientists test their hypothesis.'},
    {word:'Paradigm',meaning:'패러다임, 사고의 틀',example:'A paradigm shift in science.'},
    {word:'Resilience',meaning:'회복력',example:'She showed great resilience.'},
    {word:'Synthesize',meaning:'종합하다, 합성하다',example:'Synthesize information from multiple sources.'}
  ]},
  {cat:'코딩',words:[
    {word:'Algorithm',meaning:'문제를 해결하기 위한 단계별 절차',example:'정렬, 탐색, 최단경로'},
    {word:'API',meaning:'Application Programming Interface',example:'REST API, GraphQL'},
    {word:'Recursion',meaning:'함수가 자기 자신을 호출하는 기법',example:'factorial(n) = n * factorial(n-1)'},
    {word:'Stack',meaning:'LIFO 자료구조',example:'push, pop, peek'},
    {word:'Boolean',meaning:'참/거짓 두 가지 값만 가지는 타입',example:'true / false'}
  ]}
];
let v10VocabState={cat:0,wordIdx:0,showQuiz:false,quizWord:null};
function renderVocabBuilder(){
  const set=VOCAB_SETS[v10VocabState.cat];
  const u=U();
  const learned=(u.v10vocabLearned||[]).length;
  if(v10VocabState.showQuiz&&v10VocabState.quizWord){
    const qw=v10VocabState.quizWord;
    const allWords=VOCAB_SETS.flatMap(s=>s.words);
    const wrongOpts=allWords.filter(w=>w.word!==qw.word).shuffle().slice(0,3).map(w=>w.meaning);
    const opts=[qw.meaning,...wrongOpts].shuffle();
    return `<div class="v10-panel v10-vocab"><h3>\u{1F4DD} 단어 퀴즈</h3>
      <div style="text-align:center;margin:12px 0">
        <div style="font-size:20px;font-weight:900;color:var(--cy)">${qw.word}</div>
        <div style="font-size:10px;color:var(--t3);margin-top:4px">이 단어의 뜻은?</div>
      </div>
      <div class="quiz-area">${opts.map((o,i)=>
        `<button onclick="v10VocabQuizAnswer(this,'${o.replace(/'/g,"\\'")}','${qw.meaning.replace(/'/g,"\\'")}')">${o}</button>`
      ).join('')}</div>
    </div>`;
  }
  return `<div class="v10-panel v10-vocab"><h3>\u{1F4DD} 단어장 <span class="v10-badge" style="background:rgba(6,214,160,.15);color:var(--cy)">${learned}개 암기</span></h3>
    <div style="display:flex;gap:4px;margin-bottom:8px;overflow-x:auto">${VOCAB_SETS.map((s,i)=>
      `<button class="v10-btn ${i===v10VocabState.cat?'active':''}" onclick="v10VocabCat(${i})" style="flex-shrink:0">${s.cat}</button>`
    ).join('')}</div>
    ${set.words.map((w,i)=>`<div class="word-card">
      <div class="word">${w.word}</div>
      <div class="meaning">${w.meaning}</div>
      <div class="example">${w.example}</div>
    </div>`).join('')}
    <button class="v10-btn" onclick="v10VocabQuizStart()" style="width:100%;margin-top:6px">\u{1F3AF} 단어 퀴즈 시작</button>
  </div>`;
}
window.v10VocabCat=function(i){v10VocabState.cat=i;v10VocabState.showQuiz=false;v10Sfx('feature_open10');v10RefreshPanel();};
window.v10VocabQuizStart=function(){
  const set=VOCAB_SETS[v10VocabState.cat];
  const word=set.words[Math.floor(Math.random()*set.words.length)];
  v10VocabState.showQuiz=true;v10VocabState.quizWord=word;
  v10Sfx('feature_open10');v10RefreshPanel();
};
window.v10VocabQuizAnswer=function(btn,selected,correct){
  if(selected===correct){
    btn.style.background='rgba(34,197,94,.2)';btn.style.borderColor='#22c55e';btn.style.color='#22c55e';
    v10Sfx('vocab_ok');
    const u=U();u.xp=(u.xp||0)+10;
    if(!u.v10vocabLearned)u.v10vocabLearned=[];
    const qw=v10VocabState.quizWord;
    if(qw&&!u.v10vocabLearned.includes(qw.word)){u.v10vocabLearned.push(qw.word);}
    u.v10dailyVocab=(u.v10dailyVocab||0)+1;
    S(u);
    setTimeout(()=>{v10VocabState.showQuiz=false;v10RefreshPanel();},600);
  }else{
    btn.style.background='rgba(239,68,68,.2)';btn.style.borderColor='#ef4444';btn.style.color='#ef4444';
    v10Sfx('vocab_fail');
  }
};

// ===== 8. TIME ATTACK QUIZ =====
const TA_QUIZZES=[
  {q:'피보나치 수열: 1,1,2,3,5,8,?',a:['13','11','15','10'],c:0},
  {q:'H₂O의 원자 수는?',a:['3개','2개','4개','1개'],c:0},
  {q:'Python print("Hello")의 출력은?',a:['Hello','print','hello','HELLO'],c:0},
  {q:'세종대왕이 반포한 것은?',a:['훈민정음','경국대전','해동용고','균역법'],c:0},
  {q:'2의 10제곱은?',a:['1024','512','2048','256'],c:0},
  {q:'지구에서 달까지 빛의 이동 시간은 약?',a:['1.3초','3분','8분','1시간'],c:0},
  {q:'CSS에서 #ff0000은 무슨 색?',a:['빨간색','파란색','초록색','노란색'],c:0},
  {q:'원소 기호 O는?',a:['산소','수소','질소','헬륨'],c:0},
  {q:'1+2+3+...+10 = ?',a:['55','50','45','60'],c:0},
  {q:'한반도의 위도는 약?',a:['33~43도','20~30도','50~60도','0~10도'],c:0},
  {q:'JavaScript에서 null == undefined는?',a:['true','false','error','NaN'],c:0},
  {q:'비타민 C가 풍부한 과일은?',a:['귈','사과','바나나','포도'],c:0},
  {q:'√144 = ?',a:['12','14','11','13'],c:0},
  {q:'고려의 수도는?',a:['개경','한양','경주','평양'],c:0},
  {q:'for 문에서 i=0; i<5; i++ → 몇 번?',a:['5번','4번','6번','3번'],c:0}
];
let v10TAState={active:false,qIdx:0,score:0,timeLeft:60,answered:0,interval:null};
function renderTimeAttack(){
  if(!v10TAState.active){
    const u=U();
    return `<div class="v10-panel v10-timeattack"><h3>\u{26A1} 타임어택 퀴즈</h3>
      <div style="font-size:11px;color:var(--t3);margin-bottom:10px">60초 안에 최대한 많은 문제를 풀어보세요!</div>
      <div style="display:flex;gap:12px;justify-content:center;margin-bottom:10px;font-size:10px;color:var(--t3)">
        <span>\u{1F3C6} 최고: ${u.v10taBest||0}점</span>
        <span>\u{1F4CA} 총: ${u.v10taTotal||0}회</span>
      </div>
      <button class="v10-btn" onclick="v10TAStart()" style="padding:12px 24px;font-size:14px;font-weight:700">\u{1F680} 시작!</button>
    </div>`;
  }
  if(v10TAState.timeLeft<=0||v10TAState.qIdx>=TA_QUIZZES.length){
    return renderTAResult();
  }
  const q=TA_QUIZZES[v10TAState.qIdx];
  return `<div class="v10-panel v10-timeattack"><h3>\u{26A1} 타임어택 <span class="v10-badge" style="background:rgba(239,68,68,.15);color:var(--rd)">${v10TAState.timeLeft}초</span></h3>
    <div class="timer-bar"><div class="timer-fill" style="width:${v10TAState.timeLeft/60*100}%"></div></div>
    <div style="font-size:10px;color:var(--t3);margin-bottom:6px">${v10TAState.qIdx+1}/${TA_QUIZZES.length} | 점수: ${v10TAState.score}</div>
    <div class="ta-q">${q.q}</div>
    <div class="ta-opts">${q.a.map((a,i)=>i).shuffle().map(oi=>
      `<button onclick="v10TAAnswer(this,${oi},${q.c})">${q.a[oi]}</button>`
    ).join('')}</div>
  </div>`;
}
function renderTAResult(){
  const u=U();
  return `<div class="v10-panel v10-timeattack">
    <div class="result">
      <div style="font-size:36px;margin-bottom:8px">\u{1F3C6}</div>
      <div class="score">${v10TAState.score}점</div>
      <div style="font-size:11px;color:var(--t3);margin-top:4px">${v10TAState.answered}문제 풀이 | 최고: ${u.v10taBest||0}점</div>
      <button class="v10-btn" onclick="v10TAStart()" style="margin-top:10px">\u{1F504} 다시 도전</button>
      <button class="v10-btn" onclick="v10TAState.active=false;v10RefreshPanel()" style="margin-top:4px">← 돌아가기</button>
    </div>
  </div>`;
}
window.v10TAStart=function(){
  v10TAState={active:true,qIdx:0,score:0,timeLeft:60,answered:0,interval:null};
  TA_QUIZZES.shuffle();
  v10Sfx('timeattack_start');
  v10TAState.interval=setInterval(()=>{
    v10TAState.timeLeft--;
    if(v10TAState.timeLeft<=0){
      clearInterval(v10TAState.interval);
      v10TAEnd();
    }
    v10RefreshPanel();
  },1000);
  v10RefreshPanel();
};
window.v10TAAnswer=function(btn,sel,correct){
  v10TAState.answered++;
  if(sel===correct){
    btn.classList.add('correct');
    v10TAState.score+=10;v10Sfx('quiz_v10_ok');
  }else{
    btn.classList.add('wrong');v10Sfx('quiz_v10_fail');
  }
  setTimeout(()=>{
    v10TAState.qIdx++;
    if(v10TAState.qIdx>=TA_QUIZZES.length||v10TAState.timeLeft<=0){
      clearInterval(v10TAState.interval);v10TAEnd();
    }
    v10RefreshPanel();
  },300);
};
function v10TAEnd(){
  const u=U();
  u.v10taTotal=(u.v10taTotal||0)+1;
  u.v10dailyTA=(u.v10dailyTA||0)+1;
  if(v10TAState.score>(u.v10taBest||0))u.v10taBest=v10TAState.score;
  u.xp=(u.xp||0)+v10TAState.score;
  S(u);v10Sfx('timeattack_done');
}

// ===== 15 NEW QUIZZES =====
const V10_QUIZZES=[
  {q:'포모도로 기법의 집중 시간은?',a:['25분','15분','45분','60분'],c:0,cat:'학습법'},
  {q:'Khan Academy의 학습 방식은?',a:['마스터리 기반','시험 기반','암기 기반','경쟁 기반'],c:0,cat:'학습법'},
  {q:'레이더 차트의 축은 최소 몇 개?',a:['3개','2개','5개','4개'],c:0,cat:'수학'},
  {q:'플래시카드의 반복 학습 법칙을 발견한 사람은?',a:['에빙하우스','파블로프','뉴턴','아인슈타인'],c:0,cat:'학습법'},
  {q:'산소의 원자번호는?',a:['8','6','16','2'],c:0,cat:'화학'},
  {q:'TCP/IP에서 TCP는?',a:['Transmission Control Protocol','Transfer Control Protocol','Technical Computer Protocol','Total Connection Protocol'],c:0,cat:'코딩'},
  {q:'임진왓란 발발 해는?',a:['1592년','1597년','1636년','1627년'],c:0,cat:'역사'},
  {q:'영어 문장에서 주어+동사+목적어는 몇 형식?',a:['3형식','1형식','2형식','5형식'],c:0,cat:'영어'},
  {q:'미토콘드리아의 주 기능은?',a:['ATP 생성','단백질 합성','DNA 복제','세포 분열'],c:0,cat:'생물'},
  {q:'소리의 속도는 약?',a:['340m/s','300m/s','400m/s','500m/s'],c:0,cat:'물리'},
  {q:'지구의 나이는 약?',a:['46억년','36억년','56억년','100억년'],c:0,cat:'지구과학'},
  {q:'Git에서 branch의 역할은?',a:['독립적 개발 분기','파일 삭제','서버 배포','버그 보고'],c:0,cat:'코딩'},
  {q:'한글 모음의 기본 원리는?',a:['하늘+땅+사람','물+불+바람','해+달+별','산+강+들'],c:0,cat:'한국어'},
  {q:'베토벤의 교향곡 5번 별명은?',a:['운명','합창','전원','영웅'],c:0,cat:'음악'},
  {q:'타임어택에서 10문제 만점 점수는?',a:['100점','50점','150점','80점'],c:0,cat:'일반'}
];

// ===== ACHIEVEMENT MILESTONES v10 =====
const V10_MILESTONES=[
  {id:'v10_challenge_first',nm:'첫 챌린지',desc:'일일 챌린지 1개 완료',icon:'\u{1F3AF}',check:()=>{const u=U();return (u.v10dailyQuiz||0)>=3||(u.v10dailyLesson||0)>=1;}},
  {id:'v10_challenge_all',nm:'챌린지 마스터',desc:'일일 챌린지 전부 완료',icon:'\u{1F31F}',check:()=>{const u=U();const ch=getDailyChallenges();return ch.every(c=>c.check(u));}},
  {id:'v10_pomo_first',nm:'집중력 입문',desc:'포모도로 1세션 완료',icon:'\u{1F345}',check:()=>(U().v10pomoToday||0)>=1},
  {id:'v10_pomo_3',nm:'집중력 달인',desc:'포모도로 3세션 완료',icon:'\u{23F0}',check:()=>(U().v10pomoToday||0)>=3},
  {id:'v10_flash_10',nm:'카드 수집가',desc:'플래시카드 10장 생성',icon:'\u{1F4C7}',check:()=>(U().v10flash||[]).length>=10},
  {id:'v10_flash_50',nm:'카드 마스터',desc:'플래시카드 50장 생성',icon:'\u{1F0CF}',check:()=>(U().v10flash||[]).length>=50},
  {id:'v10_vocab_10',nm:'단어 입문자',desc:'단어 10개 암기',icon:'\u{1F4DD}',check:()=>(U().v10vocabLearned||[]).length>=10},
  {id:'v10_vocab_all',nm:'단어 박사',desc:'모든 단어 암기',icon:'\u{1F393}',check:()=>(U().v10vocabLearned||[]).length>=20},
  {id:'v10_ta_first',nm:'스피드 러너',desc:'타임어택 1회 완료',icon:'\u{26A1}',check:()=>(U().v10taTotal||0)>=1},
  {id:'v10_ta_100',nm:'타임어택 고수',desc:'타임어택 100점 달성',icon:'\u{1F4AF}',check:()=>(U().v10taBest||0)>=100},
  {id:'v10_mastery_view',nm:'자기분석가',desc:'마스터리 레이더 확인',icon:'\u{1F4CA}',check:()=>{const u=U();return (u.v10features||[]).includes('mastery');}},
  {id:'v10_explorer',nm:'v10 탐험가',desc:'v10 기능 6개 이상 사용',icon:'\u{1F680}',check:()=>{const u=U();return (u.v10features||[]).length>=6;}}
];
function checkV10Milestones(){
  const u=U();if(!u.v10milestones)u.v10milestones=[];
  let newOnes=[];
  V10_MILESTONES.forEach(m=>{
    if(!u.v10milestones.includes(m.id)&&m.check()){
      u.v10milestones.push(m.id);newOnes.push(m);
    }
  });
  if(newOnes.length){S(u);v10Sfx('achieve_v10');}
  return newOnes;
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown',function(e){
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
  if(!e.shiftKey)return;
  const map={
    'C':()=>v10ShowPanel('challenge'),'M':()=>v10ShowPanel('mastery'),
    'O':()=>v10ShowPanel('pomo'),'F':()=>v10ShowPanel('flash'),
    'X':()=>v10ShowPanel('path'),'E':()=>v10ShowPanel('report'),
    'V':()=>v10ShowPanel('vocab'),'A':()=>v10ShowPanel('timeattack')
  };
  if(map[e.key]){e.preventDefault();map[e.key]();}
});

// ===== PANEL MANAGEMENT =====
let v10ActivePanel='challenge';
function v10ShowPanel(panel){
  v10ActivePanel=panel;v10RefreshPanel();
  const u=U();if(!u.v10features)u.v10features=[];
  if(!u.v10features.includes(panel)){u.v10features.push(panel);S(u);}
  v10Sfx('feature_open10');
  checkV10Milestones();
}
function v10RefreshPanel(){
  const container=_el('v10Container');
  if(!container)return;
  let html='';
  switch(v10ActivePanel){
    case 'challenge':html=renderDailyChallenge()+renderMasteryRadar();break;
    case 'mastery':html=renderMasteryRadar();break;
    case 'pomo':html=renderPomodoro();break;
    case 'flash':html=renderFlashcardBuilder();break;
    case 'path':html=renderLearningPath();break;
    case 'report':html=renderWeeklyReport();break;
    case 'vocab':html=renderVocabBuilder();break;
    case 'timeattack':html=renderTimeAttack();break;
    default:html=renderDailyChallenge()+renderMasteryRadar();
  }
  container.innerHTML=html;
  setTimeout(()=>{
    drawMasteryRadar();drawPomoCanvas();drawLearningPath();drawWeeklyReport();
  },50);
}
window.v10ShowPanel=v10ShowPanel;

// ===== SCROLL NAV BAR =====
function createV10Nav(){
  const nav=document.createElement('div');nav.className='v10-nav';nav.id='v10Nav';
  const items=[
    ['\u{1F3AF}','challenge','챌린지'],
    ['\u{1F4CA}','mastery','마스터리'],
    ['\u{1F345}','pomo','포모도로'],
    ['\u{1F4C7}','flash','플래시카드'],
    ['\u{1F5FA}','path','경로맵'],
    ['\u{1F4CB}','report','리포트'],
    ['\u{1F4DD}','vocab','단어장'],
    ['\u{26A1}','timeattack','타임어택']
  ];
  nav.innerHTML=items.map(([icon,panel,nm])=>
    `<button onclick="v10ShowPanel('${panel}')" title="${nm}">${icon} ${nm}</button>`
  ).join('');
  document.body.appendChild(nav);
}

// ===== INJECT INTO HOME =====
function v10InjectHome(){
  const homePage=document.getElementById('pg0');
  if(!homePage)return;
  if(_el('v10Container'))return;
  const sec=document.createElement('div');
  sec.id='v10Container';sec.style.marginTop='10px';
  const v9c=_el('v9Container');
  if(v9c)v9c.parentNode.insertBefore(sec,v9c.nextSibling);
  else{
    const firstSec=homePage.querySelector('.sec');
    if(firstSec)homePage.insertBefore(sec,firstSec);
    else homePage.prepend(sec);
  }
  v10RefreshPanel();
}

// ===== INIT =====
function v10Init(){
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{v10InjectHome();createV10Nav();});
  }else{
    setTimeout(()=>{v10InjectHome();createV10Nav();},800);
  }
}
v10Init();

})();
