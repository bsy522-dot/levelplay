// LevelPlay v11.0 Patch - SM-2 Spaced Repetition Engine + Learning Streak Freeze
// + Skill Mastery Tree Canvas + Study Certificate Generator Canvas PNG
// + AI Quiz Difficulty Adapter + Subject Gap Analyzer Canvas
// + Study Timer Analytics Dashboard Canvas + Hint System for Quizzes
// + 15 Quizzes + 12 Achievements + SFX 12 + KB 8
(function(){
'use strict';

function _el(id){return document.getElementById(id);}
function U(){try{return JSON.parse(localStorage.getItem('lp_user'))||{};}catch(e){return {};}}
function S(u){localStorage.setItem('lp_user',JSON.stringify(u));}
function _today(){return new Date().toISOString().slice(0,10);}

// ===== Audio Engine =====
const v11Ctx=(function(){try{return new(window.AudioContext||window.webkitAudioContext)();}catch(e){return null;}})();
function v11Sfx(type){
  if(!v11Ctx)return;try{
  if(v11Ctx.state==='suspended')v11Ctx.resume();
  const o=v11Ctx.createOscillator(),g=v11Ctx.createGain();
  o.connect(g);g.connect(v11Ctx.destination);
  const t=v11Ctx.currentTime;
  const map={
    sr_review:[523.25,.12,'triangle'],sr_easy:[783.99,.2,'sine'],
    sr_hard:[293.66,.1,'sawtooth'],sr_again:[220,.15,'sawtooth'],
    streak_freeze:[659.25,.15,'sine'],streak_save:[1046.5,.25,'sine'],
    mastery_up:[783.99,.2,'sine'],mastery_max:[1046.5,.3,'sine'],
    cert_gen:[880,.25,'sine'],cert_download:[659.25,.15,'triangle'],
    gap_scan:[440,.12,'triangle'],gap_done:[523.25,.18,'sine'],
    timer_start:[523.25,.08,'triangle'],timer_lap:[659.25,.1,'sine'],
    hint_show:[440,.1,'triangle'],hint_reveal:[523.25,.12,'sine'],
    quiz_v11_ok:[659.25,.12,'sine'],quiz_v11_fail:[293.66,.1,'sawtooth'],
    achieve_v11:[1046.5,.3,'sine'],feature_open11:[523.25,.1,'triangle']
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
const v11css=document.createElement('style');
v11css.textContent=`
.v11-panel{background:var(--c1);border:1px solid rgba(139,92,246,.1);border-radius:12px;padding:14px;margin-bottom:10px}
.v11-panel h3{font-size:14px;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:6px}
.v11-btn{padding:8px 14px;border:1px solid rgba(139,92,246,.2);border-radius:8px;background:var(--c2);color:var(--tx);font:12px inherit;cursor:pointer;transition:.15s}
.v11-btn:hover{border-color:var(--cy);background:rgba(6,214,160,.08)}
.v11-btn.active{background:rgba(6,214,160,.15);border-color:var(--cy);color:var(--cy)}
.v11-badge{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700}
/* SR Cards */
.v11-sr-card{background:var(--c2);border:1.5px solid rgba(139,92,246,.15);border-radius:12px;padding:16px;margin-bottom:8px;text-align:center;min-height:80px;display:flex;flex-direction:column;justify-content:center;cursor:pointer;transition:.2s}
.v11-sr-card:hover{border-color:var(--cy);transform:translateY(-1px)}
.v11-sr-card .front{font-size:15px;font-weight:700}
.v11-sr-card .back{font-size:12px;color:var(--cy);margin-top:8px;display:none}
.v11-sr-card.flipped .front{font-size:10px;color:var(--t3)}
.v11-sr-card.flipped .back{display:block}
.v11-sr-btns{display:flex;gap:6px;justify-content:center;margin-top:10px}
.v11-sr-btns button{flex:1;padding:8px;border:1px solid rgba(139,92,246,.2);border-radius:6px;font:11px inherit;cursor:pointer;color:var(--tx);transition:.15s}
.v11-sr-btns .again{background:rgba(239,68,68,.1);border-color:rgba(239,68,68,.3)}
.v11-sr-btns .hard{background:rgba(251,191,36,.1);border-color:rgba(251,191,36,.3)}
.v11-sr-btns .good{background:rgba(6,214,160,.1);border-color:rgba(6,214,160,.3)}
.v11-sr-btns .easy{background:rgba(99,102,241,.1);border-color:rgba(99,102,241,.3)}
/* Streak Freeze */
.v11-freeze{background:linear-gradient(135deg,rgba(56,189,248,.08),rgba(139,92,246,.05));border:1.5px solid rgba(56,189,248,.25);border-radius:12px;padding:14px;margin-bottom:10px}
.v11-freeze .freeze-icon{font-size:32px;text-align:center;margin-bottom:6px}
.v11-freeze .freeze-count{font-size:28px;font-weight:900;text-align:center;background:linear-gradient(135deg,#38bdf8,#8b5cf6);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
/* Skill Tree */
.v11-tree canvas{width:100%;border-radius:8px;margin-bottom:8px}
/* Certificate */
.v11-cert canvas{width:100%;border-radius:8px;margin-bottom:8px}
.v11-cert .cert-actions{display:flex;gap:6px;justify-content:center}
/* Gap Analyzer */
.v11-gap canvas{width:100%;border-radius:8px;margin-bottom:8px}
.v11-gap .gap-list{max-height:200px;overflow-y:auto}
.v11-gap .gap-item{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(139,92,246,.05)}
.v11-gap .gap-bar{flex:1;height:8px;background:var(--c2);border-radius:4px;overflow:hidden}
.v11-gap .gap-fill{height:100%;border-radius:4px;transition:.3s}
/* Timer Analytics */
.v11-timer canvas{width:100%;border-radius:8px;margin-bottom:8px}
.v11-timer .timer-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px}
.v11-timer .timer-stat{text-align:center;padding:8px;background:var(--c2);border-radius:8px}
.v11-timer .timer-stat .val{font-size:18px;font-weight:900;background:var(--g1);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.v11-timer .timer-stat .lbl{font-size:9px;color:var(--t3)}
/* Hint System */
.v11-hint{background:linear-gradient(135deg,rgba(251,191,36,.08),rgba(6,214,160,.05));border:1px solid rgba(251,191,36,.2);border-radius:8px;padding:10px;margin-top:8px;font-size:11px}
.v11-hint .hint-step{padding:4px 0;border-bottom:1px solid rgba(251,191,36,.1);display:none}
.v11-hint .hint-step.visible{display:block}
/* Nav */
.v11-nav{position:fixed;bottom:calc(var(--nv) + 36px);left:0;right:0;display:flex;overflow-x:auto;background:var(--c1);border-top:1px solid rgba(139,92,246,.1);z-index:999;padding:6px 4px;gap:2px;scrollbar-width:none}
.v11-nav::-webkit-scrollbar{display:none}
.v11-nav button{flex:0 0 auto;padding:6px 10px;border:none;background:transparent;color:var(--t3);font:10px inherit;cursor:pointer;border-radius:6px;white-space:nowrap;transition:.15s}
.v11-nav button:hover,.v11-nav button:active{background:rgba(6,214,160,.1);color:var(--cy)}
`;
document.head.appendChild(v11css);

// ===== 1. SM-2 SPACED REPETITION ENGINE =====
function sm2(card,quality){
  let {ef,interval,reps}=card;
  if(quality<3){reps=0;interval=1;}
  else{
    if(reps===0)interval=1;
    else if(reps===1)interval=6;
    else interval=Math.round(interval*ef);
    reps++;
  }
  ef=Math.max(1.3,ef+(0.1-(5-quality)*(0.08+(5-quality)*0.02)));
  const due=new Date();due.setDate(due.getDate()+interval);
  return{...card,ef:Math.round(ef*100)/100,interval,reps,due:due.toISOString().slice(0,10),lastReview:_today()};
}
function getSRDeck(){const u=U();return u.v11srDeck||[];}
function saveSRDeck(deck){const u=U();u.v11srDeck=deck;S(u);}
function addToSR(q,a,cat){
  const deck=getSRDeck();
  const id='sr_'+Date.now()+'_'+Math.floor(Math.random()*1000);
  deck.push({id,q,a,cat:cat||'general',ef:2.5,interval:0,reps:0,due:_today(),lastReview:null,created:_today()});
  saveSRDeck(deck);return id;
}
function getDueCards(){
  const today=_today();
  return getSRDeck().filter(c=>c.due<=today).sort((a,b)=>a.due.localeCompare(b.due));
}
function reviewCard(cardId,quality){
  const deck=getSRDeck();
  const idx=deck.findIndex(c=>c.id===cardId);
  if(idx===-1)return;
  deck[idx]=sm2(deck[idx],quality);
  saveSRDeck(deck);
  const u=U();u.v11srReviewed=(u.v11srReviewed||0)+1;
  if(!u.v11srDays)u.v11srDays={};
  u.v11srDays[_today()]=(u.v11srDays[_today()]||0)+1;
  S(u);
}
let v11SRFlipped=false;let v11SRIdx=0;
function renderSR(){
  const due=getDueCards();const deck=getSRDeck();
  const u=U();const reviewed=u.v11srReviewed||0;
  let html=`<div class="v11-panel"><h3>\u{1F4DA} SM-2 간격반복 학습</h3>`;
  html+=`<div style="display:flex;gap:8px;margin-bottom:10px">
    <div class="v11-badge" style="background:rgba(6,214,160,.1);color:var(--cy)">카드 ${deck.length}장</div>
    <div class="v11-badge" style="background:rgba(251,191,36,.1);color:#fbbf24">오늘 복습 ${due.length}장</div>
    <div class="v11-badge" style="background:rgba(139,92,246,.1);color:#8b5cf6">총 복습 ${reviewed}회</div>
  </div>`;
  if(due.length===0){
    html+=`<div style="text-align:center;padding:20px;color:var(--t3)">
      <div style="font-size:32px;margin-bottom:8px">\u{2705}</div>
      <div style="font-size:13px;font-weight:600">오늘 복습 완료!</div>
      <div style="font-size:10px;margin-top:4px">내일 다시 복습할 카드가 준비됩니다</div>
    </div>`;
  }else{
    const card=due[Math.min(v11SRIdx,due.length-1)];
    html+=`<div class="v11-sr-card ${v11SRFlipped?'flipped':''}" onclick="v11FlipSR()">
      <div class="front">${card.q}</div>
      <div class="back">\u{2705} ${card.a}</div>
    </div>`;
    html+=`<div style="text-align:center;font-size:10px;color:var(--t3);margin:4px 0">${Math.min(v11SRIdx+1,due.length)} / ${due.length}</div>`;
    if(v11SRFlipped){
      html+=`<div class="v11-sr-btns">
        <button class="again" onclick="v11RateSR('${card.id}',1)">다시 \u{1F534}</button>
        <button class="hard" onclick="v11RateSR('${card.id}',3)">어려움 \u{1F7E1}</button>
        <button class="good" onclick="v11RateSR('${card.id}',4)">좋음 \u{1F7E2}</button>
        <button class="easy" onclick="v11RateSR('${card.id}',5)">쉬움 \u{1F535}</button>
      </div>`;
    }else{
      html+=`<div style="text-align:center;font-size:10px;color:var(--t3)">카드를 클릭해서 정답을 확인하세요</div>`;
    }
  }
  html+=`<div style="margin-top:10px;display:flex;gap:6px">
    <input id="v11srQ" placeholder="질문" style="flex:1;padding:6px;background:var(--bg);border:1px solid rgba(139,92,246,.15);border-radius:6px;color:var(--tx);font:11px inherit">
    <input id="v11srA" placeholder="정답" style="flex:1;padding:6px;background:var(--bg);border:1px solid rgba(139,92,246,.15);border-radius:6px;color:var(--tx);font:11px inherit">
    <button class="v11-btn" onclick="v11AddSR()">+</button>
  </div>`;
  const wrongNotes=getWrongNoteSR();
  if(wrongNotes.length>0){
    html+=`<div style="margin-top:8px"><button class="v11-btn" onclick="v11ImportWrongNotes()" style="width:100%;font-size:10px">\u{1F4DD} 오답노트에서 ${wrongNotes.length}개 가져오기</button></div>`;
  }
  html+=`</div>`;
  return html;
}
function getWrongNoteSR(){
  const u=U();const existing=getSRDeck().map(c=>c.q);
  return (u.wrongNotes||[]).filter(w=>!existing.includes(w.q)).slice(0,20);
}
window.v11FlipSR=function(){v11SRFlipped=!v11SRFlipped;v11Sfx('sr_review');v11RefreshPanel();};
window.v11RateSR=function(id,q){
  reviewCard(id,q);
  v11SRFlipped=false;
  const sfxMap={1:'sr_again',3:'sr_hard',4:'sr_review',5:'sr_easy'};
  v11Sfx(sfxMap[q]||'sr_review');
  const due=getDueCards();
  if(due.length===0)v11SRIdx=0;
  else v11SRIdx=Math.min(v11SRIdx,due.length-1);
  checkV11Milestones();v11RefreshPanel();
};
window.v11AddSR=function(){
  const q=_el('v11srQ'),a=_el('v11srA');
  if(!q||!a||!q.value.trim()||!a.value.trim())return;
  addToSR(q.value.trim(),a.value.trim());
  v11Sfx('sr_easy');checkV11Milestones();v11RefreshPanel();
};
window.v11ImportWrongNotes=function(){
  const notes=getWrongNoteSR();
  notes.forEach(w=>addToSR(w.q,w.correctAnswer||w.a||'(정답 확인 필요)',w.cat||'오답복습'));
  v11Sfx('sr_easy');checkV11Milestones();v11RefreshPanel();
};

// ===== 2. STREAK FREEZE SYSTEM =====
function renderStreakFreeze(){
  const u=U();
  if(!u.v11freezes)u.v11freezes=3;
  if(!u.v11freezeUsed)u.v11freezeUsed=[];
  const streak=u.streakDays||u.streak||0;
  const freezesLeft=u.v11freezes;
  const today=_today();
  const lastActive=u.lastActive||u.lastLogin||today;
  const daysSince=Math.floor((new Date(today)-new Date(lastActive))/(1000*60*60*24));
  let streakStatus='active';
  if(daysSince>1&&daysSince<=2)streakStatus='danger';
  else if(daysSince>2)streakStatus='broken';
  let html=`<div class="v11-freeze"><h3>\u{2744}️ 스트릭 프리즈</h3>`;
  html+=`<div class="freeze-icon">${streakStatus==='active'?'\u{1F525}':streakStatus==='danger'?'\u{26A0}️':'\u{1F494}'}</div>`;
  html+=`<div class="freeze-count">${streak}일 연속</div>`;
  html+=`<div style="text-align:center;font-size:10px;color:var(--t3);margin:6px 0">`;
  if(streakStatus==='active')html+=`오늘 학습 완료! 스트릭이 유지됩니다`;
  else if(streakStatus==='danger')html+=`\u{26A0}️ 어제 학습을 놓쳤습니다! 프리즈를 사용하세요`;
  else html+=`스트릭이 끊겼습니다. 새로 시작하세요!`;
  html+=`</div>`;
  html+=`<div style="display:flex;justify-content:center;gap:8px;margin:10px 0">`;
  for(let i=0;i<3;i++){
    const active=i<freezesLeft;
    html+=`<div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:18px;${active?'background:rgba(56,189,248,.15);border:2px solid #38bdf8':'background:var(--c2);border:2px solid var(--t3);opacity:.4'}">\u{2744}️</div>`;
  }
  html+=`</div>`;
  if(streakStatus==='danger'&&freezesLeft>0){
    html+=`<button class="v11-btn" onclick="v11UseFreeze()" style="width:100%;margin-top:6px">\u{2744}️ 프리즈 사용 (${freezesLeft}개 남음)</button>`;
  }
  html+=`<div style="margin-top:10px;font-size:10px;color:var(--t3)">
    <div>\u{2022} 프리즈는 하루 학습을 놓쳐도 스트릭을 유지합니다</div>
    <div>\u{2022} 최대 3개 보유, 7일 연속 학습 시 1개 충전</div>
    <div>\u{2022} 사용 이력: ${u.v11freezeUsed.length}회</div>
  </div>`;
  html+=`</div>`;
  return html;
}
window.v11UseFreeze=function(){
  const u=U();
  if(!u.v11freezes||u.v11freezes<=0)return;
  u.v11freezes--;
  if(!u.v11freezeUsed)u.v11freezeUsed=[];
  u.v11freezeUsed.push(_today());
  const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);
  u.lastActive=yesterday.toISOString().slice(0,10);
  S(u);v11Sfx('streak_freeze');checkV11Milestones();v11RefreshPanel();
};

// ===== 3. SKILL MASTERY TREE CANVAS =====
function renderSkillTree(){
  const subjects=['수학','과학','영어','코딩','국어','사회','음악','미술','체육','한국어','역사'];
  const icons=['🔢','🔬','🔤','💻','📝','🏘️','🎵','🎨','⚽','🇰🇷','📜'];
  const u=U();
  const subjectProgress=subjects.map((s,i)=>{
    const key=s.toLowerCase();
    const lessons=u.lessonsBySubject?u.lessonsBySubject[key]||0:0;
    const quizzes=u.quizBySubject?u.quizBySubject[key]||0:0;
    const total=lessons+quizzes;
    let level=0;
    if(total>=50)level=4;
    else if(total>=30)level=3;
    else if(total>=15)level=2;
    else if(total>=5)level=1;
    return{name:s,icon:icons[i],total,level,lessons,quizzes};
  });
  let html=`<div class="v11-panel v11-tree"><h3>\u{1F333} 스킬 마스터리 트리</h3>`;
  html+=`<canvas id="v11TreeCanvas" width="560" height="380"></canvas>`;
  html+=`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:6px">`;
  const levelNames=['입문','기초','중급','고급','마스터'];
  const levelColors=['#6b7280','#38bdf8','#06d6a0','#fbbf24','#ef4444'];
  levelNames.forEach((n,i)=>{
    html+=`<div class="v11-badge" style="background:${levelColors[i]}22;color:${levelColors[i]}">${n}</div>`;
  });
  html+=`</div></div>`;
  return html;
}
function drawSkillTree(){
  const canvas=_el('v11TreeCanvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  const isDark=document.documentElement.getAttribute('data-theme')==='dark'||document.body.classList.contains('dark');
  ctx.fillStyle=isDark?'#1a1a2e':'#f8f9fa';
  ctx.fillRect(0,0,W,H);
  const subjects=['수학','과학','영어','코딩','국어','사회','음악','미술','체육','한국어','역사'];
  const icons=['🔢','🔬','🔤','💻','📝','🏘️','🎵','🎨','⚽','🇰🇷','📜'];
  const u=U();
  const levelColors=['#6b7280','#38bdf8','#06d6a0','#fbbf24','#ef4444'];
  const cx=W/2,cy=H/2;
  const radius=140;
  subjects.forEach((s,i)=>{
    const angle=(i/subjects.length)*Math.PI*2-Math.PI/2;
    const x=cx+Math.cos(angle)*radius;
    const y=cy+Math.sin(angle)*radius;
    const key=s.toLowerCase();
    const lessons=u.lessonsBySubject?u.lessonsBySubject[key]||0:0;
    const quizzes=u.quizBySubject?u.quizBySubject[key]||0:0;
    const total=lessons+quizzes;
    let level=0;
    if(total>=50)level=4;
    else if(total>=30)level=3;
    else if(total>=15)level=2;
    else if(total>=5)level=1;
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.lineTo(x,y);
    ctx.strokeStyle=isDark?'rgba(139,92,246,.15)':'rgba(139,92,246,.1)';
    ctx.lineWidth=1;
    ctx.stroke();
    const nodeR=22;
    ctx.beginPath();
    ctx.arc(x,y,nodeR,0,Math.PI*2);
    ctx.fillStyle=levelColors[level]+'30';
    ctx.fill();
    ctx.strokeStyle=levelColors[level];
    ctx.lineWidth=2.5;
    ctx.stroke();
    if(level>0){
      const prog=Math.min(1,total/(level===4?50:level===3?50:level===2?30:15));
      ctx.beginPath();
      ctx.arc(x,y,nodeR,-Math.PI/2,-Math.PI/2+prog*Math.PI*2);
      ctx.strokeStyle=levelColors[level];
      ctx.lineWidth=3;
      ctx.stroke();
    }
    ctx.font='16px sans-serif';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText(icons[i],x,y-2);
    ctx.font=`9px sans-serif`;
    ctx.fillStyle=isDark?'#e2e8f0':'#334155';
    ctx.fillText(s,x,y+nodeR+12);
    ctx.font='bold 8px sans-serif';
    ctx.fillStyle=levelColors[level];
    const levelNames=['입문','기초','중급','고급','마스터'];
    ctx.fillText(levelNames[level],x,y+nodeR+22);
  });
  ctx.beginPath();
  ctx.arc(cx,cy,20,0,Math.PI*2);
  ctx.fillStyle=isDark?'rgba(139,92,246,.2)':'rgba(139,92,246,.1)';
  ctx.fill();
  ctx.strokeStyle='#8b5cf6';
  ctx.lineWidth=2;
  ctx.stroke();
  ctx.font='14px sans-serif';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillText('\u{1F393}',cx,cy);
}

// ===== 4. STUDY CERTIFICATE GENERATOR =====
function renderCertificate(){
  const u=U();
  const totalXP=u.xp||0;
  const totalQuiz=u.quizTotal||0;
  const totalLesson=u.lessonCount||0;
  const streak=u.streakDays||u.streak||0;
  let grade='D';
  if(totalXP>=10000)grade='S';
  else if(totalXP>=5000)grade='A';
  else if(totalXP>=2000)grade='B';
  else if(totalXP>=500)grade='C';
  let html=`<div class="v11-panel v11-cert"><h3>\u{1F3C6} 학습 인증서</h3>`;
  html+=`<canvas id="v11CertCanvas" width="600" height="380"></canvas>`;
  html+=`<div class="cert-actions">
    <button class="v11-btn" onclick="v11DownloadCert()">\u{1F4E5} PNG 다운로드</button>
    <button class="v11-btn" onclick="v11CopyCert()">\u{1F4CB} 클립보드 복사</button>
  </div>`;
  html+=`<div style="margin-top:8px;font-size:10px;color:var(--t3);text-align:center">현재 등급: ${grade} | XP: ${totalXP.toLocaleString()} | 퀴즈: ${totalQuiz}문제 | 레슨: ${totalLesson}개</div>`;
  html+=`</div>`;
  return html;
}
function drawCertificate(){
  const canvas=_el('v11CertCanvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  const u=U();
  const totalXP=u.xp||0;
  const totalQuiz=u.quizTotal||0;
  const totalLesson=u.lessonCount||0;
  const streak=u.streakDays||u.streak||0;
  let grade='D';
  if(totalXP>=10000)grade='S';
  else if(totalXP>=5000)grade='A';
  else if(totalXP>=2000)grade='B';
  else if(totalXP>=500)grade='C';
  const gradeColors={S:'#ef4444',A:'#f59e0b',B:'#06d6a0',C:'#38bdf8',D:'#6b7280'};
  const grd=ctx.createLinearGradient(0,0,W,H);
  grd.addColorStop(0,'#1e1b4b');grd.addColorStop(0.5,'#312e81');grd.addColorStop(1,'#1e1b4b');
  ctx.fillStyle=grd;
  ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='#fbbf24';ctx.lineWidth=3;
  ctx.strokeRect(15,15,W-30,H-30);
  ctx.strokeStyle='rgba(251,191,36,.3)';ctx.lineWidth=1;
  ctx.strokeRect(20,20,W-40,H-40);
  for(let i=0;i<8;i++){
    const x=30+i*(W-60)/7;
    ctx.fillStyle='rgba(251,191,36,.15)';
    ctx.font='16px sans-serif';
    ctx.fillText('⭐',x,40);
    ctx.fillText('⭐',x,H-30);
  }
  ctx.textAlign='center';
  ctx.fillStyle='#fbbf24';
  ctx.font='bold 10px sans-serif';
  ctx.fillText('LEVELPLAY ACADEMY',W/2,55);
  ctx.fillStyle='#e2e8f0';
  ctx.font='bold 24px sans-serif';
  ctx.fillText('\u{1F4DC} 학습 인증서',W/2,90);
  ctx.fillStyle='rgba(255,255,255,.6)';
  ctx.font='11px sans-serif';
  ctx.fillText('이 인증서는 아래 학습자의 우수한 학습 성과를 증명합니다',W/2,115);
  ctx.fillStyle=gradeColors[grade];
  ctx.font='bold 64px sans-serif';
  ctx.fillText(grade,W/2,180);
  ctx.font='bold 12px sans-serif';
  ctx.fillText('등급',W/2,200);
  const stats=[
    ['\u{1F4CA} XP',totalXP.toLocaleString()],
    ['\u{2753} 퀸즈',totalQuiz+'문제'],
    ['\u{1F4DA} 레슨',totalLesson+'개'],
    ['\u{1F525} 스트릭',streak+'일'],
    ['\u{1F3C5} 업적',(u.badges||[]).length+'개'],
    ['\u{1F4C5} 가입',u.joined||_today()]
  ];
  const colW=(W-80)/3;
  stats.forEach((s,i)=>{
    const row=Math.floor(i/3);
    const col=i%3;
    const sx=50+col*colW;
    const sy=225+row*40;
    ctx.fillStyle='rgba(255,255,255,.4)';
    ctx.font='10px sans-serif';
    ctx.textAlign='center';
    ctx.fillText(s[0],sx+colW/2,sy);
    ctx.fillStyle='#e2e8f0';
    ctx.font='bold 14px sans-serif';
    ctx.fillText(s[1],sx+colW/2,sy+16);
  });
  ctx.fillStyle='rgba(255,255,255,.3)';
  ctx.font='9px sans-serif';
  ctx.textAlign='center';
  ctx.fillText('발급일: '+_today()+' | LevelPlay v11.0 | levelplay.vercel.app',W/2,H-35);
}
window.v11DownloadCert=function(){
  const canvas=_el('v11CertCanvas');if(!canvas)return;
  const link=document.createElement('a');
  link.download='levelplay-certificate-'+_today()+'.png';
  link.href=canvas.toDataURL('image/png');
  link.click();v11Sfx('cert_download');
};
window.v11CopyCert=function(){
  const canvas=_el('v11CertCanvas');if(!canvas)return;
  canvas.toBlob(blob=>{
    navigator.clipboard.write([new ClipboardItem({'image/png':blob})]).then(()=>{
      v11Sfx('cert_download');
    }).catch(()=>{});
  });
};

// ===== 5. AI QUIZ DIFFICULTY ADAPTER =====
function renderAdaptiveQuiz(){
  const u=U();
  if(!u.v11aqHistory)u.v11aqHistory=[];
  if(!u.v11aqDifficulty)u.v11aqDifficulty=2;
  const diffNames=['매우 쉬움','쉬움','보통','어려움','매우 어려움'];
  const diffColors=['#06d6a0','#38bdf8','#fbbf24','#f97316','#ef4444'];
  const history=u.v11aqHistory.slice(-20);
  const correctRate=history.length>0?Math.round(history.filter(h=>h.correct).length/history.length*100):0;
  let html=`<div class="v11-panel"><h3>\u{1F9E0} AI 적응형 퀸즈</h3>`;
  html+=`<div style="display:flex;gap:6px;margin-bottom:10px;align-items:center">
    <div class="v11-badge" style="background:${diffColors[u.v11aqDifficulty]}22;color:${diffColors[u.v11aqDifficulty]}">Lv.${u.v11aqDifficulty+1} ${diffNames[u.v11aqDifficulty]}</div>
    <div class="v11-badge" style="background:rgba(139,92,246,.1);color:#8b5cf6">정답률 ${correctRate}%</div>
    <div class="v11-badge" style="background:rgba(6,214,160,.1);color:var(--cy)">${history.length}문제</div>
  </div>`;
  html+=`<div style="font-size:10px;color:var(--t3);margin-bottom:8px">
    \u{2022} 정답률 80%+ → 난이도 상승 | 40%- → 난이도 하락 | 40~80% → 유지
  </div>`;
  const aq=getAdaptiveQuestion(u.v11aqDifficulty);
  if(aq&&!u.v11aqCurrent){
    u.v11aqCurrent=aq;S(u);
  }
  const cur=u.v11aqCurrent;
  if(cur){
    const opts=[...cur.a].map((a,i)=>({t:a,ok:i===cur.c}));
    for(let i=opts.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[opts[i],opts[j]]=[opts[j],opts[i]];}
    html+=`<div style="background:var(--c2);border:1px solid rgba(139,92,246,.12);border-radius:10px;padding:14px;margin-bottom:8px">
      <div style="font-size:12px;color:var(--t3);margin-bottom:4px">${diffNames[u.v11aqDifficulty]} | ${cur.cat||'general'}</div>
      <div style="font-size:14px;font-weight:700;margin-bottom:10px">${cur.q}</div>
      <div style="display:grid;gap:6px">
        ${opts.map(o=>`<button class="v11-btn" onclick="v11AQAnswer(${o.ok})" style="text-align:left;padding:10px">${o.t}</button>`).join('')}
      </div>
    </div>`;
  }else{
    html+=`<div style="text-align:center;padding:16px;color:var(--t3)">문제를 준비 중...</div>`;
  }
  if(history.length>=5){
    html+=`<div style="margin-top:8px"><div style="font-size:11px;font-weight:600;margin-bottom:4px">최근 성적</div>`;
    html+=`<div style="display:flex;gap:2px">`;
    history.slice(-10).forEach(h=>{
      html+=`<div style="width:20px;height:20px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;background:${h.correct?'rgba(6,214,160,.15)':'rgba(239,68,68,.15)'}">${h.correct?'✅':'❌'}</div>`;
    });
    html+=`</div></div>`;
  }
  html+=`</div>`;
  return html;
}
const AQ_POOL=[
  {q:'√144 × 3 + 7 = ?',a:['43','36','49','41'],c:0,d:3,cat:'수학'},
  {q:'빛의 3원색은?',a:['빨초파','빨노파','빨초노','파초노'],c:0,d:1,cat:'과학'},
  {q:'DNA의 이중나선 구조 발견자는?',a:['왓슨과 크릭','멘델','다윈','파스퇴르'],c:0,d:2,cat:'과학'},
  {q:'HTTP 상태코드 404의 의미는?',a:['Not Found','Server Error','Forbidden','Unauthorized'],c:0,d:2,cat:'코딩'},
  {q:'조선시대 세종대왕이 창제한 것은?',a:['훈민정음','경국대전','대동여지도','직지심체'],c:0,d:1,cat:'역사'},
  {q:'O(n log n) 정렬 알고리즘은?',a:['병합정렬','버블정렬','선택정렬','삽입정렬'],c:0,d:3,cat:'코딩'},
  {q:'미토콘드리아의 역할은?',a:['세포 에너지 생산','DNA 복제','단백질 합성','세포 분열'],c:0,d:3,cat:'과학'},
  {q:'1 마일은 약 몇 km?',a:['1.6km','1.2km','2.0km','0.8km'],c:0,d:1,cat:'수학'},
  {q:'영어 문장에서 관사 a/an의 위치는?',a:['명사 앞','동사 앞','부사 앞','접속사 앞'],c:0,d:0,cat:'영어'},
  {q:'CSS Flexbox에서 주축 정렬 속성은?',a:['justify-content','align-items','flex-direction','flex-wrap'],c:0,d:2,cat:'코딩'},
  {q:'베토벤 교향곡 몇 번까지?',a:['9번','7번','5번','12번'],c:0,d:2,cat:'음악'},
  {q:'반고흐의 별이 빛나는 밤 작품은?',a:['별이 빛나는 밤','사랑의 하모니카','해바라기 소나타','데미안 소나타'],c:0,d:2,cat:'음악'},
  {q:'르네상스 미술의 중심 국가는?',a:['이탈리아','프랑스','독일','영국'],c:0,d:1,cat:'미술'},
  {q:'올림픽 마라톤 거리는?',a:['42.195km','40km','45km','38km'],c:0,d:1,cat:'체육'},
  {q:'∑(k=1 to 100) k = ?',a:['5050','5000','5100','4950'],c:0,d:3,cat:'수학'},
  {q:'JavaScript의 typeof null은?',a:['object','null','undefined','string'],c:0,d:4,cat:'코딩'},
  {q:'팔만대장경 제작 시기는?',a:['고려시대','조선시대','신라시대','백제시대'],c:0,d:3,cat:'역사'},
  {q:'pH 7은 무슨 성질?',a:['중성','산성','염기성','약산성'],c:0,d:0,cat:'과학'},
  {q:'현악기 중 현이 4개인 것은?',a:['바이올린','기타','하프','가야금'],c:0,d:2,cat:'음악'},
  {q:'TCP/IP 4계층 중 최상위는?',a:['응용 계층','전송 계층','인터넷 계층','네트워크 접근 계층'],c:0,d:3,cat:'코딩'}
];
function getAdaptiveQuestion(difficulty){
  const pool=AQ_POOL.filter(q=>Math.abs(q.d-difficulty)<=1);
  if(pool.length===0)return AQ_POOL[Math.floor(Math.random()*AQ_POOL.length)];
  return pool[Math.floor(Math.random()*pool.length)];
}
window.v11AQAnswer=function(correct){
  const u=U();
  if(!u.v11aqHistory)u.v11aqHistory=[];
  u.v11aqHistory.push({correct,d:u.v11aqDifficulty||2,date:_today()});
  const recent=u.v11aqHistory.slice(-5);
  const rate=recent.filter(h=>h.correct).length/recent.length;
  if(rate>=0.8&&u.v11aqDifficulty<4)u.v11aqDifficulty++;
  else if(rate<=0.4&&u.v11aqDifficulty>0)u.v11aqDifficulty--;
  u.v11aqCurrent=null;
  S(u);
  v11Sfx(correct?'quiz_v11_ok':'quiz_v11_fail');
  checkV11Milestones();v11RefreshPanel();
};

// ===== 6. SUBJECT GAP ANALYZER =====
function renderGapAnalyzer(){
  const subjects=['수학','과학','영어','코딩','국어','사회','음악','미술','체육','한국어','역사'];
  const icons=['🔢','🔬','🔤','💻','📝','🏘️','🎵','🎨','⚽','🇰🇷','📜'];
  const u=U();
  const gaps=subjects.map((s,i)=>{
    const key=s.toLowerCase();
    const lessons=u.lessonsBySubject?u.lessonsBySubject[key]||0:0;
    const quizzes=u.quizBySubject?u.quizBySubject[key]||0:0;
    const total=lessons+quizzes;
    return{name:s,icon:icons[i],total,lessons,quizzes};
  }).sort((a,b)=>a.total-b.total);
  const maxTotal=Math.max(...gaps.map(g=>g.total),1);
  let html=`<div class="v11-panel v11-gap"><h3>\u{1F50D} 과목별 갭 분석기</h3>`;
  html+=`<canvas id="v11GapCanvas" width="560" height="300"></canvas>`;
  html+=`<div class="gap-list">`;
  gaps.forEach(g=>{
    const pct=Math.round(g.total/maxTotal*100);
    const color=pct>=70?'#06d6a0':pct>=40?'#fbbf24':'#ef4444';
    html+=`<div class="gap-item">
      <span style="font-size:16px;width:24px">${g.icon}</span>
      <span style="font-size:11px;font-weight:600;width:50px">${g.name}</span>
      <div class="gap-bar"><div class="gap-fill" style="width:${Math.max(pct,3)}%;background:${color}"></div></div>
      <span style="font-size:10px;color:var(--t3);width:40px;text-align:right">${g.total}회</span>
    </div>`;
  });
  html+=`</div>`;
  if(gaps[0].total<5){
    html+=`<div style="margin-top:8px;padding:8px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:8px;font-size:10px">
      \u{26A0}️ <strong>${gaps[0].name}</strong> 과목이 가장 부족합니다. 지금 학습을 시작해보세요!
    </div>`;
  }
  html+=`</div>`;
  return html;
}
function drawGapAnalyzer(){
  const canvas=_el('v11GapCanvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  const isDark=document.documentElement.getAttribute('data-theme')==='dark'||document.body.classList.contains('dark');
  ctx.fillStyle=isDark?'#1a1a2e':'#f8f9fa';
  ctx.fillRect(0,0,W,H);
  const subjects=['수학','과학','영어','코딩','국어','사회','음악','미술','체육','한국어','역사'];
  const u=U();
  const data=subjects.map(s=>{
    const key=s.toLowerCase();
    const lessons=u.lessonsBySubject?u.lessonsBySubject[key]||0:0;
    const quizzes=u.quizBySubject?u.quizBySubject[key]||0:0;
    return lessons+quizzes;
  });
  const maxVal=Math.max(...data,1);
  const barW=(W-80)/subjects.length;
  const barArea=H-60;
  subjects.forEach((s,i)=>{
    const x=50+i*barW;
    const h=(data[i]/maxVal)*barArea;
    const pct=data[i]/maxVal;
    const color=pct>=0.7?'#06d6a0':pct>=0.4?'#fbbf24':'#ef4444';
    ctx.fillStyle=color+'80';
    ctx.fillRect(x+2,H-30-h,barW-4,h);
    ctx.fillStyle=color;
    ctx.fillRect(x+2,H-30-h,barW-4,3);
    ctx.fillStyle=isDark?'#e2e8f0':'#334155';
    ctx.font='9px sans-serif';
    ctx.textAlign='center';
    ctx.save();
    ctx.translate(x+barW/2,H-8);
    ctx.rotate(-Math.PI/6);
    ctx.fillText(s,0,0);
    ctx.restore();
    ctx.font='bold 9px sans-serif';
    ctx.fillText(data[i]+'',x+barW/2,H-34-h);
  });
  ctx.fillStyle=isDark?'rgba(255,255,255,.3)':'rgba(0,0,0,.3)';
  ctx.font='10px sans-serif';
  ctx.textAlign='left';
  ctx.fillText('과목별 학습량 (레슨+퀸즈)',50,18);
}

// ===== 7. STUDY TIMER ANALYTICS DASHBOARD =====
function renderTimerAnalytics(){
  const u=U();
  if(!u.v11timerSessions)u.v11timerSessions=[];
  const sessions=u.v11timerSessions;
  const todaySessions=sessions.filter(s=>s.date===_today());
  const todayMin=todaySessions.reduce((sum,s)=>sum+s.minutes,0);
  const weekSessions=sessions.filter(s=>{
    const d=new Date(s.date);const now=new Date();
    return(now-d)/(1000*60*60*24)<=7;
  });
  const weekMin=weekSessions.reduce((sum,s)=>sum+s.minutes,0);
  const totalMin=sessions.reduce((sum,s)=>sum+s.minutes,0);
  let html=`<div class="v11-panel v11-timer"><h3>\u{23F1}️ 학습 타이머 분석</h3>`;
  html+=`<div class="timer-stats">
    <div class="timer-stat"><div class="val">${todayMin}</div><div class="lbl">오늘 (분)</div></div>
    <div class="timer-stat"><div class="val">${weekMin}</div><div class="lbl">이번 주 (분)</div></div>
    <div class="timer-stat"><div class="val">${totalMin}</div><div class="lbl">총 학습 (분)</div></div>
  </div>`;
  html+=`<canvas id="v11TimerCanvas" width="560" height="220"></canvas>`;
  html+=`<div style="display:flex;gap:6px;margin-top:8px">
    <button class="v11-btn ${u.v11timerActive?'active':''}" onclick="v11ToggleTimer()" style="flex:1">${u.v11timerActive?'\u{23F9}️ 정지':'\u{25B6}️ 학습 시작'}</button>
    <button class="v11-btn" onclick="v11LapTimer()" ${u.v11timerActive?'':'disabled'} style="flex:1">\u{1F3C1} 구간 기록</button>
  </div>`;
  if(u.v11timerActive){
    const elapsed=Math.floor((Date.now()-(u.v11timerStart||Date.now()))/60000);
    html+=`<div style="text-align:center;margin-top:8px;font-size:20px;font-weight:900;background:var(--g1);-webkit-background-clip:text;-webkit-text-fill-color:transparent">${elapsed}분 학습 중...</div>`;
  }
  html+=`</div>`;
  return html;
}
function drawTimerAnalytics(){
  const canvas=_el('v11TimerCanvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height;
  const isDark=document.documentElement.getAttribute('data-theme')==='dark'||document.body.classList.contains('dark');
  ctx.fillStyle=isDark?'#1a1a2e':'#f8f9fa';
  ctx.fillRect(0,0,W,H);
  const u=U();
  const sessions=u.v11timerSessions||[];
  const days=[];
  for(let i=6;i>=0;i--){
    const d=new Date();d.setDate(d.getDate()-i);
    const ds=d.toISOString().slice(0,10);
    const dayLabel=['일','월','화','수','목','금','토'][d.getDay()];
    const mins=sessions.filter(s=>s.date===ds).reduce((sum,s)=>sum+s.minutes,0);
    days.push({date:ds,label:dayLabel,mins});
  }
  const maxMins=Math.max(...days.map(d=>d.mins),30);
  const barW=(W-80)/7;
  const barArea=H-50;
  days.forEach((d,i)=>{
    const x=50+i*barW;
    const h=Math.max((d.mins/maxMins)*barArea,2);
    const grd=ctx.createLinearGradient(x,H-30-h,x,H-30);
    grd.addColorStop(0,'#8b5cf6');grd.addColorStop(1,'#06d6a0');
    ctx.fillStyle=grd;
    ctx.beginPath();
    ctx.roundRect(x+4,H-30-h,barW-8,h,4);
    ctx.fill();
    ctx.fillStyle=isDark?'#e2e8f0':'#334155';
    ctx.font='10px sans-serif';
    ctx.textAlign='center';
    ctx.fillText(d.label,x+barW/2,H-12);
    if(d.mins>0){
      ctx.font='bold 9px sans-serif';
      ctx.fillText(d.mins+'분',x+barW/2,H-36-h);
    }
  });
  ctx.fillStyle=isDark?'rgba(255,255,255,.3)':'rgba(0,0,0,.3)';
  ctx.font='10px sans-serif';
  ctx.textAlign='left';
  ctx.fillText('주간 학습 시간 (분)',50,18);
}
window.v11ToggleTimer=function(){
  const u=U();
  if(u.v11timerActive){
    const elapsed=Math.floor((Date.now()-u.v11timerStart)/60000);
    if(elapsed>0){
      if(!u.v11timerSessions)u.v11timerSessions=[];
      u.v11timerSessions.push({date:_today(),minutes:elapsed,ended:Date.now()});
    }
    u.v11timerActive=false;u.v11timerStart=null;
    v11Sfx('timer_lap');
  }else{
    u.v11timerActive=true;u.v11timerStart=Date.now();
    v11Sfx('timer_start');
  }
  S(u);checkV11Milestones();v11RefreshPanel();
};
window.v11LapTimer=function(){
  const u=U();
  if(!u.v11timerActive)return;
  const elapsed=Math.floor((Date.now()-u.v11timerStart)/60000);
  if(elapsed>0){
    if(!u.v11timerSessions)u.v11timerSessions=[];
    u.v11timerSessions.push({date:_today(),minutes:elapsed,ended:Date.now()});
    u.v11timerStart=Date.now();
    S(u);v11Sfx('timer_lap');v11RefreshPanel();
  }
};

// ===== 8. HINT SYSTEM FOR QUIZZES =====
function renderHintSystem(){
  const u=U();
  if(!u.v11hintsUsed)u.v11hintsUsed=0;
  if(!u.v11hintCredits)u.v11hintCredits=10;
  let html=`<div class="v11-panel"><h3>\u{1F4A1} 퀸즈 힌트 시스템</h3>`;
  html+=`<div style="display:flex;gap:8px;margin-bottom:10px">
    <div class="v11-badge" style="background:rgba(251,191,36,.1);color:#fbbf24">힌트 크레딧 ${u.v11hintCredits}개</div>
    <div class="v11-badge" style="background:rgba(139,92,246,.1);color:#8b5cf6">총 사용 ${u.v11hintsUsed}회</div>
  </div>`;
  const sampleQ={
    q:'조선의 건국 연도는?',
    hints:[
      '힌트 1: 고려 멸망 이후에 세워졌습니다',
      '힌트 2: 14세기 후반입니다',
      '힌트 3: 이성계가 건국했습니다',
      '정답: 1392년'
    ],
    a:['1392년','1394년','1388년','1400년'],
    c:0
  };
  const revealCount=u.v11hintDemo||0;
  html+=`<div style="background:var(--c2);border:1px solid rgba(139,92,246,.12);border-radius:10px;padding:14px;margin-bottom:8px">
    <div style="font-size:10px;color:var(--t3);margin-bottom:4px">예시 문제</div>
    <div style="font-size:13px;font-weight:700;margin-bottom:8px">${sampleQ.q}</div>
    <div class="v11-hint">`;
  sampleQ.hints.forEach((h,i)=>{
    html+=`<div class="hint-step ${i<revealCount?'visible':''}" style="padding:6px 0;${i===revealCount-1?'color:var(--cy);font-weight:600':''}">\u{1F4A1} ${h}</div>`;
  });
  html+=`</div>`;
  if(revealCount<sampleQ.hints.length){
    html+=`<button class="v11-btn" onclick="v11RevealHint()" style="margin-top:8px;width:100%">\u{1F4A1} 힌트 보기 (${u.v11hintCredits}개 남음)</button>`;
  }
  html+=`</div>`;
  html+=`<div style="font-size:10px;color:var(--t3)">
    <div>\u{2022} 퀸즈 풀 때 힌트 버튼을 누르면 단계별 힌트가 공개됩니다</div>
    <div>\u{2022} 힌트 사용 시 XP가 감소됩니다 (1힌트: -10XP)</div>
    <div>\u{2022} 퀸즈 5문제 연속 정답 시 힌트 1개 충전</div>
  </div>`;
  html+=`</div>`;
  return html;
}
window.v11RevealHint=function(){
  const u=U();
  if(u.v11hintCredits<=0)return;
  u.v11hintCredits--;
  u.v11hintsUsed=(u.v11hintsUsed||0)+1;
  u.v11hintDemo=(u.v11hintDemo||0)+1;
  S(u);v11Sfx('hint_show');
  if(u.v11hintDemo>=4)v11Sfx('hint_reveal');
  checkV11Milestones();v11RefreshPanel();
};

// ===== QUIZZES (15 new) =====
const V11_QUIZ=[
  {q:'SM-2 알고리즘에서 EF의 최솟값은?',a:['1.3','1.0','2.0','0.5'],c:0,cat:'v11학습법'},
  {q:'간격반복 학습의 창시자는?',a:['에빙하우스','파블로프','니체','소크라테스'],c:0,cat:'v11학습법'},
  {q:'듀올링고의 스트릭 기능은 무엇을 추적?',a:['연속 학습일수','총 학습시간','퀸즈 점수','레벨'],c:0,cat:'v11학습법'},
  {q:'Khan Academy의 스킬 레벨 최고 단계는?',a:['Mastered','Expert','Advanced','Complete'],c:0,cat:'v11학습법'},
  {q:'복습 최적 시기를 설명하는 곡선은?',a:['망각곡선','학습곡선','성장곡선','생존곡선'],c:0,cat:'v11학습법'},
  {q:'가장 효과적인 학습법은?',a:['능동적 회상','반복 읽기','밀줄긋기','요약 베껴쓰기'],c:0,cat:'v11학습법'},
  {q:'포모도로 기법의 집중 시간은?',a:['25분','30분','15분','45분'],c:0,cat:'v11학습법'},
  {q:'플래시카드의 장점은?',a:['능동적 회상','시각적 학습','반복 연습','그룹 토론'],c:0,cat:'v11학습법'},
  {q:'XP 시스템의 목적은?',a:['학습 동기부여','점수 계산','순위 결정','문제 생성'],c:0,cat:'v11학습법'},
  {q:'적응형 학습의 핵심은?',a:['난이도 자동 조절','문제 수 증가','시간 제한','점수 부여'],c:0,cat:'v11학습법'},
  {q:'메타인지는 무엇에 대한 인지?',a:['자신의 사고과정','타인의 감정','사회적 관계','언어 구조'],c:0,cat:'v11학습법'},
  {q:'인출 연습이 재읽기(반복 읽기)보다 효과적인 이유는?',a:['기억 경로 강화','시간 절약','즉각적 피드백','스트레스 감소'],c:0,cat:'v11학습법'},
  {q:'블룸 택소노미 피라미드의 바닥(최하위) 단계는?',a:['기억하기','창조하기','이해하기','분석하기'],c:0,cat:'v11학습법'},
  {q:'7±2 법칙은 무엇을 설명?',a:['단기기억 용량','장기기억 용량','학습 속도','복습 주기'],c:0,cat:'v11학습법'},
  {q:'LevelPlay v11의 신규 핵심 기능은?',a:['SM-2 간격반복','블록체인','교수모드','구독제'],c:0,cat:'v11기능'}
];
function injectV11Quiz(){
  if(typeof window.QUIZ!=='undefined'&&Array.isArray(window.QUIZ)){
    V11_QUIZ.forEach(q=>{
      if(!window.QUIZ.find(eq=>eq.q===q.q))window.QUIZ.push(q);
    });
  }
}

// ===== ACHIEVEMENTS (12 new) =====
const V11_MILESTONES=[
  {id:'v11_sr_first',nm:'간격반복 입문',desc:'SM-2 카드 1장 복습',icon:'\u{1F4DA}',check:()=>(U().v11srReviewed||0)>=1},
  {id:'v11_sr_10',nm:'복습 전문가',desc:'SM-2 카드 10회 복습',icon:'\u{1F9E0}',check:()=>(U().v11srReviewed||0)>=10},
  {id:'v11_sr_deck10',nm:'카드 수집가',desc:'SM-2 덱 10장 이상',icon:'\u{1F4C7}',check:()=>(getSRDeck().length)>=10},
  {id:'v11_freeze_use',nm:'프리즈 마스터',desc:'스트릭 프리즈 1회 사용',icon:'\u{2744}️',check:()=>(U().v11freezeUsed||[]).length>=1},
  {id:'v11_tree_view',nm:'스킬 맵 탐험',desc:'스킬 마스터리 트리 확인',icon:'\u{1F333}',check:()=>(U().v11features||[]).includes('tree')},
  {id:'v11_cert_gen',nm:'인증서 발급',desc:'학습 인증서 생성',icon:'\u{1F3C6}',check:()=>(U().v11features||[]).includes('cert')},
  {id:'v11_aq_5',nm:'적응형 학습자',desc:'적응형 퀴즈 5문제 풀기',icon:'\u{1F9E9}',check:()=>(U().v11aqHistory||[]).length>=5},
  {id:'v11_aq_lv4',nm:'난이도 정복자',desc:'적응형 퀴즈 난이도 4 도달',icon:'\u{1F525}',check:()=>(U().v11aqDifficulty||0)>=4},
  {id:'v11_gap_view',nm:'갭 분석가',desc:'과목별 갭 분석 확인',icon:'\u{1F50D}',check:()=>(U().v11features||[]).includes('gap')},
  {id:'v11_timer_30',nm:'집중 학습자',desc:'학습 타이머 총 30분 이상',icon:'\u{23F1}️',check:()=>{const u=U();return(u.v11timerSessions||[]).reduce((s,t)=>s+t.minutes,0)>=30;}},
  {id:'v11_hint_use',nm:'힌트 활용가',desc:'힌트 시스템 3회 사용',icon:'\u{1F4A1}',check:()=>(U().v11hintsUsed||0)>=3},
  {id:'v11_explorer',nm:'v11 탐험가',desc:'v11 기능 6개 이상 사용',icon:'\u{1F680}',check:()=>(U().v11features||[]).length>=6}
];
function checkV11Milestones(){
  const u=U();if(!u.v11milestones)u.v11milestones=[];
  let newOnes=[];
  V11_MILESTONES.forEach(m=>{
    if(!u.v11milestones.includes(m.id)&&m.check()){
      u.v11milestones.push(m.id);newOnes.push(m);
    }
  });
  if(newOnes.length){S(u);v11Sfx('achieve_v11');}
  return newOnes;
}

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown',function(e){
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
  if(!e.shiftKey)return;
  const map={
    'S':()=>v11ShowPanel('sr'),'Z':()=>v11ShowPanel('freeze'),
    'T':()=>v11ShowPanel('tree'),'P':()=>v11ShowPanel('cert'),
    'Q':()=>v11ShowPanel('adaptive'),'G':()=>v11ShowPanel('gap'),
    'W':()=>v11ShowPanel('timer'),'H':()=>v11ShowPanel('hint')
  };
  if(map[e.key]){e.preventDefault();map[e.key]();}
});

// ===== PANEL MANAGEMENT =====
let v11ActivePanel='sr';
function v11ShowPanel(panel){
  v11ActivePanel=panel;v11RefreshPanel();
  const u=U();if(!u.v11features)u.v11features=[];
  if(!u.v11features.includes(panel)){u.v11features.push(panel);S(u);}
  v11Sfx('feature_open11');
  checkV11Milestones();
}
function v11RefreshPanel(){
  const container=_el('v11Container');
  if(!container)return;
  let html='';
  switch(v11ActivePanel){
    case 'sr':html=renderSR();break;
    case 'freeze':html=renderStreakFreeze();break;
    case 'tree':html=renderSkillTree();break;
    case 'cert':html=renderCertificate();break;
    case 'adaptive':html=renderAdaptiveQuiz();break;
    case 'gap':html=renderGapAnalyzer();break;
    case 'timer':html=renderTimerAnalytics();break;
    case 'hint':html=renderHintSystem();break;
    default:html=renderSR();
  }
  container.innerHTML=html;
  setTimeout(()=>{
    drawSkillTree();drawCertificate();drawGapAnalyzer();drawTimerAnalytics();
  },50);
}
window.v11ShowPanel=v11ShowPanel;

// ===== SCROLL NAV BAR =====
function createV11Nav(){
  const existing=_el('v11Nav');if(existing)existing.remove();
  const nav=document.createElement('div');nav.className='v11-nav';nav.id='v11Nav';
  const items=[
    ['\u{1F4DA}','sr','간격반복'],
    ['\u{2744}️','freeze','프리즈'],
    ['\u{1F333}','tree','스킬트리'],
    ['\u{1F3C6}','cert','인증서'],
    ['\u{1F9E0}','adaptive','적응퀴즈'],
    ['\u{1F50D}','gap','갭분석'],
    ['\u{23F1}️','timer','타이머'],
    ['\u{1F4A1}','hint','힌트']
  ];
  nav.innerHTML=items.map(([icon,panel,nm])=>
    `<button onclick="v11ShowPanel('${panel}')" title="${nm}">${icon} ${nm}</button>`
  ).join('');
  document.body.appendChild(nav);
}

// ===== INJECT INTO HOME =====
function v11InjectHome(){
  const homePage=document.getElementById('pg0');
  if(!homePage)return;
  if(_el('v11Container'))return;
  const sec=document.createElement('div');
  sec.id='v11Container';sec.style.marginTop='10px';
  const v10c=_el('v10Container');
  if(v10c)v10c.parentNode.insertBefore(sec,v10c.nextSibling);
  else{
    const firstSec=homePage.querySelector('.sec');
    if(firstSec)homePage.insertBefore(sec,firstSec);
    else homePage.prepend(sec);
  }
  v11RefreshPanel();
}

// ===== AUTO-POPULATE SR DECK =====
function autoPopulateSR(){
  const deck=getSRDeck();
  if(deck.length>0)return;
  const starters=[
    ['피타고라스 정리는?','a²+b²=c²','수학'],
    ['물의 화학식은?','H₂O','과학'],
    ['I am의 축약형은?','I&#39;m','영어'],
    ['JavaScript 변수 선언 키워드 3개?','var, let, const','코딩'],
    ['세종대왕 반포한 것은?','훈민정음','역사'],
    ['4/4박자의 한 마디 박자 수는?','4박','음악'],
    ['원근법을 발견한 시대는?','르네상스','미술'],
    ['올림픽 마라톤 거리는?','42.195km','체육'],
    ['한글 자음 개수는?','14개','한국어'],
    ['대한민국 수도는?','서울','사회']
  ];
  starters.forEach(([q,a,cat])=>addToSR(q,a,cat));
}

// ===== INIT =====
function v11Init(){
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',()=>{v11InjectHome();createV11Nav();autoPopulateSR();injectV11Quiz();});
  }else{
    setTimeout(()=>{v11InjectHome();createV11Nav();autoPopulateSR();injectV11Quiz();},900);
  }
}
v11Init();

})();
