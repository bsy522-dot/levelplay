// LevelPlay v3.0 Patch - Spaced Repetition + Hint System + Daily XP Goal
// + Combo System + Study Timer + Flashcard Mode + Sound Effects + New Content
(function(){
'use strict';

const css=document.createElement('style');
css.textContent=`
.v3-xp-goal{background:linear-gradient(135deg,var(--c1,#111127),rgba(6,214,160,.06));border:1.5px solid rgba(6,214,160,.2);border-radius:12px;padding:12px;margin-bottom:10px}
.v3-xp-bar{height:8px;background:var(--bg,#0a0a1a);border-radius:4px;overflow:hidden;margin:6px 0}
.v3-xp-fill{height:100%;background:linear-gradient(90deg,#06d6a0,#8b5cf6);border-radius:4px;transition:width .5s}
.v3-xp-text{display:flex;justify-content:space-between;font-size:10px;color:var(--t3,#8892a4)}
.v3-xp-text b{color:var(--cy,#06d6a0)}
.v3-combo{position:fixed;top:60px;right:12px;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;border-radius:20px;padding:4px 12px;font-size:12px;font-weight:900;z-index:9000;transform:scale(0);transition:transform .2s;pointer-events:none}
.v3-combo.show{transform:scale(1);animation:v3comboPop .3s}
@keyframes v3comboPop{0%{transform:scale(0)}50%{transform:scale(1.3)}100%{transform:scale(1)}}
.v3-hint-btn{background:linear-gradient(135deg,#fbbf24,#f59e0b);color:#000;border:none;border-radius:6px;padding:4px 10px;font-size:10px;font-weight:700;cursor:pointer;margin-top:6px}
.v3-hint-btn:disabled{opacity:.4;cursor:not-allowed}
.v3-hint-text{background:rgba(251,191,36,.1);border:1px solid rgba(251,191,36,.2);border-radius:6px;padding:8px;margin-top:6px;font-size:11px;color:#fbbf24;animation:v3FadeIn .3s}
@keyframes v3FadeIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}
.v3-timer{position:fixed;bottom:calc(var(--nv,52px) + 230px);right:12px;background:var(--c1,#111127);border:1.5px solid rgba(139,92,246,.2);border-radius:12px;padding:10px 14px;z-index:800;font-size:11px;min-width:100px;text-align:center;box-shadow:0 4px 16px rgba(0,0,0,.3)}
.v3-timer .time{font-size:22px;font-weight:900;background:var(--g1,linear-gradient(135deg,#8b5cf6,#06d6a0));-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:4px 0}
.v3-timer .label{font-size:9px;color:var(--t3,#8892a4)}
.v3-timer button{margin-top:6px;padding:4px 10px;border:none;border-radius:4px;font-size:9px;font-weight:700;cursor:pointer}
.v3-timer .start-btn{background:var(--g1);color:#fff}
.v3-timer .stop-btn{background:rgba(239,68,68,.2);color:#ef4444;border:1px solid rgba(239,68,68,.3)}
.v3-flash{position:fixed;inset:0;z-index:8000;background:rgba(0,0,0,.92);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px;animation:v3FadeIn .3s}
.v3-flash-card{background:var(--c1,#111127);border:2px solid rgba(139,92,246,.2);border-radius:16px;width:100%;max-width:360px;min-height:200px;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;font-size:16px;font-weight:700;cursor:pointer;transition:transform .4s;transform-style:preserve-3d;position:relative}
.v3-flash-card.flipped{transform:rotateY(180deg)}
.v3-flash-front,.v3-flash-back{backface-visibility:hidden;position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;border-radius:16px}
.v3-flash-back{transform:rotateY(180deg);background:linear-gradient(135deg,rgba(139,92,246,.1),rgba(6,214,160,.1));border:2px solid rgba(6,214,160,.3)}
.v3-flash-nav{display:flex;gap:12px;margin-top:16px}
.v3-flash-nav button{padding:10px 20px;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer}
.v3-flash-close{position:absolute;top:16px;right:16px;width:32px;height:32px;border-radius:50%;background:rgba(255,255,255,.1);border:none;color:#fff;font-size:16px;cursor:pointer}
.v3-flash-progress{font-size:10px;color:var(--t3);margin-top:10px}
.v3-sr-badge{display:inline-block;background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);border-radius:4px;padding:1px 5px;font-size:8px;color:#ef4444;margin-left:4px}
.v3-sound-toggle{position:fixed;bottom:calc(var(--nv,52px) + 130px);left:12px;width:36px;height:36px;border-radius:50%;background:var(--c1,#111127);border:1px solid rgba(139,92,246,.15);color:var(--tx);font-size:16px;cursor:pointer;z-index:500;display:flex;align-items:center;justify-content:center}
.v3-daily-complete{background:linear-gradient(135deg,rgba(6,214,160,.15),rgba(139,92,246,.1));border:2px solid rgba(6,214,160,.3);border-radius:12px;padding:16px;text-align:center;margin:10px 0;animation:v3FadeIn .5s}
.v3-daily-complete h3{font-size:14px;color:var(--cy,#06d6a0);margin-bottom:4px}
.v3-quiz-type{display:flex;gap:4px;margin-bottom:8px;flex-wrap:wrap}
.v3-quiz-type button{padding:3px 8px;border-radius:4px;font-size:9px;font-weight:600;cursor:pointer;border:1px solid rgba(139,92,246,.2);background:var(--c2,#181838);color:var(--t2,#94a3b8)}
.v3-quiz-type button.active{background:rgba(139,92,246,.2);border-color:var(--p,#8b5cf6);color:var(--p,#8b5cf6)}
.v3-fill-input{width:100%;padding:10px;background:var(--bg,#0a0a1a);border:2px solid rgba(139,92,246,.2);border-radius:8px;color:var(--tx);font-size:14px;font-family:inherit;text-align:center}
.v3-fill-input:focus{outline:none;border-color:var(--cy,#06d6a0)}
.v3-tf-btns{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.v3-tf-btns button{padding:14px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;border:2px solid rgba(139,92,246,.15);background:var(--c2,#181838);color:var(--tx);transition:.15s}
.v3-tf-btns button:hover{border-color:var(--cy)}
.v3-tf-btns button.correct{background:rgba(34,197,94,.2);border-color:var(--gn,#22c55e)}
.v3-tf-btns button.wrong{background:rgba(239,68,68,.2);border-color:var(--rd,#ef4444)}
`;
document.head.appendChild(css);

// ===== Storage =====
const V3_KEY='lp_v3_data';
function loadV3(){try{return JSON.parse(localStorage.getItem(V3_KEY))||{};}catch(e){return {};}}
function saveV3(d){localStorage.setItem(V3_KEY,JSON.stringify(d));}
function getV3(){
  const d=loadV3();
  if(!d.dailyXP)d.dailyXP={date:'',earned:0,goal:50};
  if(!d.combo)d.combo=0;
  if(!d.maxCombo)d.maxCombo=0;
  if(!d.sr)d.sr={};
  if(!d.timerTotal)d.timerTotal=0;
  if(!d.soundOn)d.soundOn=true;
  if(!d.totalXP)d.totalXP=0;
  if(!d.flashcardIdx)d.flashcardIdx=0;
  return d;
}

// ===== Sound Engine (Web Audio API) =====
let audioCtx=null;
function getAudio(){
  if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();
  return audioCtx;
}
function playSound(type){
  const d=getV3();
  if(!d.soundOn)return;
  try{
    const ctx=getAudio();
    const osc=ctx.createOscillator();
    const gain=ctx.createGain();
    osc.connect(gain);gain.connect(ctx.destination);
    gain.gain.value=0.15;
    if(type==='correct'){
      osc.frequency.setValueAtTime(523.25,ctx.currentTime);
      osc.frequency.setValueAtTime(659.25,ctx.currentTime+0.08);
      osc.frequency.setValueAtTime(783.99,ctx.currentTime+0.16);
      gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.35);
      osc.start(ctx.currentTime);osc.stop(ctx.currentTime+0.35);
    }else if(type==='wrong'){
      osc.type='sawtooth';
      osc.frequency.setValueAtTime(200,ctx.currentTime);
      osc.frequency.setValueAtTime(150,ctx.currentTime+0.1);
      gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.25);
      osc.start(ctx.currentTime);osc.stop(ctx.currentTime+0.25);
    }else if(type==='combo'){
      osc.type='sine';
      osc.frequency.setValueAtTime(880,ctx.currentTime);
      osc.frequency.setValueAtTime(1108.73,ctx.currentTime+0.05);
      osc.frequency.setValueAtTime(1318.51,ctx.currentTime+0.1);
      osc.frequency.setValueAtTime(1760,ctx.currentTime+0.15);
      gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.4);
      osc.start(ctx.currentTime);osc.stop(ctx.currentTime+0.4);
    }else if(type==='levelup'){
      osc.type='sine';
      const notes=[523.25,659.25,783.99,1046.50];
      notes.forEach((f,i)=>{osc.frequency.setValueAtTime(f,ctx.currentTime+i*0.12);});
      gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.6);
      osc.start(ctx.currentTime);osc.stop(ctx.currentTime+0.6);
    }else if(type==='hint'){
      osc.type='triangle';
      osc.frequency.setValueAtTime(440,ctx.currentTime);
      gain.gain.value=0.08;
      gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.15);
      osc.start(ctx.currentTime);osc.stop(ctx.currentTime+0.15);
    }else if(type==='tick'){
      osc.type='sine';
      osc.frequency.setValueAtTime(1000,ctx.currentTime);
      gain.gain.value=0.05;
      gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+0.03);
      osc.start(ctx.currentTime);osc.stop(ctx.currentTime+0.03);
    }
  }catch(e){}
}

// ===== Daily XP Goal System =====
function getTodayStr(){return new Date().toISOString().slice(0,10);}
function addXP(amount){
  const d=getV3();
  const today=getTodayStr();
  if(d.dailyXP.date!==today){d.dailyXP={date:today,earned:0,goal:d.dailyXP.goal||50};}
  const wasBelowGoal=d.dailyXP.earned<d.dailyXP.goal;
  d.dailyXP.earned+=amount;
  d.totalXP=(d.totalXP||0)+amount;
  saveV3(d);
  updateXPDisplay();
  if(wasBelowGoal&&d.dailyXP.earned>=d.dailyXP.goal){
    playSound('levelup');
    showDailyComplete();
  }
}
function updateXPDisplay(){
  const el=document.getElementById('v3XPGoal');
  if(!el)return;
  const d=getV3();
  const today=getTodayStr();
  if(d.dailyXP.date!==today){d.dailyXP.earned=0;d.dailyXP.date=today;}
  const pct=Math.min(100,Math.round(d.dailyXP.earned/d.dailyXP.goal*100));
  el.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:12px;font-weight:700">🎯 일일 목표</span>
    <span style="font-size:9px;color:var(--t3);cursor:pointer" onclick="v3ChangeGoal()">목표변경</span>
  </div>
  <div class="v3-xp-bar"><div class="v3-xp-fill" style="width:${pct}%"></div></div>
  <div class="v3-xp-text"><span>${d.dailyXP.earned} / ${d.dailyXP.goal} XP</span><b>${pct>=100?'✅ 달성!':pct+'%'}</b></div>`;
}
function showDailyComplete(){
  const el=document.createElement('div');
  el.className='v3-daily-complete';
  el.innerHTML='<h3>🎉 일일 목표 달성!</h3><p style="font-size:11px;color:var(--t2)">오늘의 학습 목표를 달성했습니다. 내일도 힘내세요!</p>';
  const target=document.getElementById('v3XPGoal');
  if(target&&target.parentNode)target.parentNode.insertBefore(el,target.nextSibling);
  setTimeout(()=>{if(el.parentNode)el.parentNode.removeChild(el);},5000);
}
window.v3ChangeGoal=function(){
  const d=getV3();
  const goals=[30,50,80,100,150,200];
  const cur=d.dailyXP.goal;
  const idx=(goals.indexOf(cur)+1)%goals.length;
  d.dailyXP.goal=goals[idx];
  saveV3(d);
  updateXPDisplay();
  if(window.toast)window.toast('목표 변경: '+goals[idx]+' XP');
};

// ===== Combo System =====
let comboTimer=null;
function addCombo(){
  const d=getV3();
  d.combo=(d.combo||0)+1;
  if(d.combo>d.maxCombo)d.maxCombo=d.combo;
  saveV3(d);
  showCombo(d.combo);
  if(d.combo>=3&&d.combo%3===0)playSound('combo');
  if(d.combo>=3)addXP(d.combo);
  clearTimeout(comboTimer);
  comboTimer=setTimeout(()=>{
    const dd=getV3();dd.combo=0;saveV3(dd);hideCombo();
  },8000);
}
function resetCombo(){
  const d=getV3();d.combo=0;saveV3(d);hideCombo();
  clearTimeout(comboTimer);
}
function showCombo(n){
  let el=document.getElementById('v3Combo');
  if(!el){
    el=document.createElement('div');
    el.id='v3Combo';el.className='v3-combo';
    document.body.appendChild(el);
  }
  el.textContent='🔥 '+n+' COMBO';
  el.classList.add('show');
}
function hideCombo(){
  const el=document.getElementById('v3Combo');
  if(el)el.classList.remove('show');
}

// ===== Spaced Repetition =====
function recordSR(quizId,correct){
  const d=getV3();
  if(!d.sr[quizId])d.sr[quizId]={interval:1,nextReview:0,ease:2.5,reps:0};
  const card=d.sr[quizId];
  const now=Date.now();
  if(correct){
    card.reps++;
    if(card.reps===1)card.interval=1;
    else if(card.reps===2)card.interval=3;
    else card.interval=Math.round(card.interval*card.ease);
    card.ease=Math.max(1.3,card.ease+0.1);
  }else{
    card.reps=0;
    card.interval=1;
    card.ease=Math.max(1.3,card.ease-0.2);
  }
  card.nextReview=now+card.interval*86400000;
  d.sr[quizId]=card;
  saveV3(d);
}
function getDueCards(){
  const d=getV3();
  const now=Date.now();
  return Object.entries(d.sr).filter(([k,v])=>v.nextReview<=now).map(([k])=>k);
}

// ===== Hint System =====
const HINTS={};
function generateHint(quiz){
  if(!quiz||!quiz.a||quiz.c===undefined||quiz.c<0||quiz.c>=quiz.a.length)return null;
  const correct=quiz.a[quiz.c];
  if(!correct)return null;
  const hints=[];
  hints.push('정답은 '+correct.length+'글자입니다.');
  if(correct.length>1)hints.push('첫 글자는 "'+correct[0]+'" 입니다.');
  if(quiz.a.length>2){
    const wrong1=quiz.a.find((a,i)=>i!==quiz.c);
    hints.push('"'+wrong1+'"은(는) 정답이 아닙니다.');
  }
  return hints;
}

// ===== Study Timer (Pomodoro) =====
let timerInterval=null;
let timerSeconds=0;
let timerRunning=false;
let timerMode='focus';
const FOCUS_TIME=25*60;
const BREAK_TIME=5*60;

function createTimer(){
  if(document.getElementById('v3Timer'))return;
  const el=document.createElement('div');
  el.id='v3Timer';el.className='v3-timer';el.style.display='none';
  el.innerHTML=`<div class="label">🍅 집중 타이머</div>
    <div class="time" id="v3TimerDisplay">25:00</div>
    <div class="label" id="v3TimerMode">집중 모드</div>
    <div style="display:flex;gap:4px;justify-content:center">
      <button class="start-btn" id="v3TimerBtn" onclick="v3ToggleTimer()">시작</button>
      <button class="stop-btn" onclick="v3ResetTimer()">리셋</button>
    </div>`;
  document.body.appendChild(el);
}
window.v3ShowTimer=function(){
  const el=document.getElementById('v3Timer');
  if(el)el.style.display=el.style.display==='none'?'block':'none';
};
window.v3ToggleTimer=function(){
  if(timerRunning){
    clearInterval(timerInterval);timerRunning=false;
    document.getElementById('v3TimerBtn').textContent='계속';
  }else{
    timerRunning=true;
    document.getElementById('v3TimerBtn').textContent='일시정지';
    timerInterval=setInterval(()=>{
      timerSeconds--;
      if(timerSeconds<=0){
        clearInterval(timerInterval);timerRunning=false;
        playSound('levelup');
        const d=getV3();
        if(timerMode==='focus'){
          d.timerTotal=(d.timerTotal||0)+FOCUS_TIME;
          saveV3(d);
          addXP(15);
          timerMode='break';timerSeconds=BREAK_TIME;
          document.getElementById('v3TimerMode').textContent='☕ 휴식 모드';
          if(window.toast)window.toast('🍅 집중 완료! 5분 휴식하세요');
        }else{
          timerMode='focus';timerSeconds=FOCUS_TIME;
          document.getElementById('v3TimerMode').textContent='집중 모드';
          if(window.toast)window.toast('휴식 끝! 다시 집중!');
        }
        document.getElementById('v3TimerBtn').textContent='시작';
      }
      updateTimerDisplay();
    },1000);
  }
};
window.v3ResetTimer=function(){
  clearInterval(timerInterval);timerRunning=false;
  timerMode='focus';timerSeconds=FOCUS_TIME;
  document.getElementById('v3TimerBtn').textContent='시작';
  document.getElementById('v3TimerMode').textContent='집중 모드';
  updateTimerDisplay();
};
function updateTimerDisplay(){
  const m=Math.floor(timerSeconds/60);
  const s=timerSeconds%60;
  const el=document.getElementById('v3TimerDisplay');
  if(el)el.textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');
}

// ===== Flashcard Mode =====
let flashCards=[];
let flashIdx=0;
let flashFlipped=false;

function buildFlashcards(){
  const cards=[];
  if(window.QUIZ&&Array.isArray(window.QUIZ)){
    window.QUIZ.forEach((q,i)=>{
      cards.push({id:'q_'+i,front:q.q,back:q.a[q.c],cat:q.cat||'일반'});
    });
  }
  if(window.CURRICULUM){
    Object.values(window.CURRICULUM).forEach(subj=>{
      subj.units.forEach(u=>{
        u.lessons.forEach(l=>{
          if(l.quiz){
            l.quiz.forEach((q,qi)=>{
              cards.push({id:'c_'+subj.nm+'_'+qi,front:q.q,back:q.a[q.c],cat:subj.nm});
            });
          }
        });
      });
    });
  }
  return cards;
}
window.v3OpenFlashcard=function(){
  flashCards=buildFlashcards();
  if(!flashCards.length){if(window.toast)window.toast('플래시카드가 없습니다');return;}
  const due=getDueCards();
  if(due.length>0){
    flashCards.sort((a,b)=>{
      const aD=due.includes(a.id)?0:1;
      const bD=due.includes(b.id)?0:1;
      return aD-bD;
    });
  }
  flashIdx=0;flashFlipped=false;
  renderFlashcard();
};
function renderFlashcard(){
  let el=document.getElementById('v3Flash');
  if(!el){
    el=document.createElement('div');
    el.id='v3Flash';el.className='v3-flash';
    document.body.appendChild(el);
  }
  const card=flashCards[flashIdx];
  const due=getDueCards();
  const isDue=due.includes(card.id);
  el.style.display='flex';
  el.innerHTML=`<button class="v3-flash-close" onclick="v3CloseFlash()">✕</button>
    <div style="font-size:10px;color:var(--t3);margin-bottom:8px">${card.cat}${isDue?' <span class="v3-sr-badge">복습</span>':''}</div>
    <div class="v3-flash-card" id="v3FlashCard" onclick="v3FlipCard()">
      <div class="v3-flash-front"><div>${card.front}</div></div>
      <div class="v3-flash-back"><div style="color:var(--cy)">${card.back}</div></div>
    </div>
    <div class="v3-flash-nav">
      <button onclick="v3FlashAnswer(false)" style="background:rgba(239,68,68,.2);color:#ef4444">❌ 모르겠다</button>
      <button onclick="v3FlashAnswer(true)" style="background:rgba(34,197,94,.2);color:#22c55e">✅ 알고있다</button>
    </div>
    <div class="v3-flash-progress">${flashIdx+1} / ${flashCards.length}</div>`;
}
window.v3FlipCard=function(){
  flashFlipped=!flashFlipped;
  const card=document.getElementById('v3FlashCard');
  if(card)card.classList.toggle('flipped',flashFlipped);
};
window.v3FlashAnswer=function(correct){
  const card=flashCards[flashIdx];
  recordSR(card.id,correct);
  if(correct){addXP(2);addCombo();}
  else{resetCombo();}
  playSound(correct?'correct':'wrong');
  flashIdx++;flashFlipped=false;
  if(flashIdx>=flashCards.length){
    v3CloseFlash();
    if(window.toast)window.toast('🎉 플래시카드 완료! +'+flashCards.length*2+' XP');
    return;
  }
  renderFlashcard();
};
window.v3CloseFlash=function(){
  const el=document.getElementById('v3Flash');
  if(el)el.style.display='none';
};

// ===== Enhanced Quiz System (Hook into existing chkA) =====
const origChkA=window.chkA;
window.chkA=function(btn,ok){
  if(origChkA)origChkA(btn,ok);
  if(ok){
    addXP(5);addCombo();playSound('correct');
  }else{
    resetCombo();playSound('wrong');
  }
  const qzEl=btn.closest('.qz');
  if(qzEl){
    const qIdx=qzEl.getAttribute('data-quiz-idx');
    if(qIdx!==null)recordSR('quiz_'+qIdx,ok);
  }
};

// ===== New Quiz Types: Fill-in-the-blank & True/False =====
const FILL_QUIZZES=[
  {q:'지구에서 가장 가까운 별은?',a:'태양',cat:'과학',hint:'낮에 볼 수 있어요'},
  {q:'물의 화학식은?',a:'H2O',cat:'과학',hint:'수소2개 + 산소1개'},
  {q:'대한민국의 수도는?',a:'서울',cat:'사회',hint:'한강이 흐르는 도시'},
  {q:'1+1은?',a:'2',cat:'수학',hint:'하나 더하기 하나'},
  {q:'무지개 색 중 가장 바깥쪽 색은?',a:'빨강',cat:'과학',hint:'가장 따뜻한 색'},
  {q:'삼각형의 내각의 합은 ___도',a:'180',cat:'수학',hint:'직각 2개를 합친 것'},
  {q:'조선을 건국한 왕은?',a:'이성계',cat:'한국사',hint:'위화도 회군의 주인공'},
  {q:'빛의 삼원색은? (빨강/초록/___)',a:'파랑',cat:'과학',hint:'하늘의 색'},
  {q:'우리나라 최초의 한글 소설은?',a:'홍길동전',cat:'한글국어',hint:'허균이 지은 소설'},
  {q:'원주율 파이(π)의 소수점 두 자리는?',a:'3.14',cat:'수학',hint:'3.1 다음에 4'},
  {q:'세계에서 가장 큰 대양은?',a:'태평양',cat:'사회',hint:'아시아와 아메리카 사이'},
  {q:'식물이 광합성에 필요한 기체는?',a:'이산화탄소',cat:'과학',hint:'CO2'},
  {q:'한글을 창제한 왕은?',a:'세종대왕',cat:'한국사',hint:'훈민정음'},
  {q:'1km는 ___m',a:'1000',cat:'수학',hint:'킬로는 천을 뜻해요'},
  {q:'태양계에서 가장 큰 행성은?',a:'목성',cat:'과학',hint:'Jupiter, 줄무늬가 있어요'}
];
const TF_QUIZZES=[
  {q:'지구는 태양 주위를 돈다',a:true,cat:'과학'},
  {q:'물은 100도에서 얼어요',a:false,cat:'과학'},
  {q:'한글은 세종대왕이 만들었다',a:true,cat:'한국사'},
  {q:'삼각형의 내각의 합은 360도이다',a:false,cat:'수학'},
  {q:'대한민국의 국화는 무궁화이다',a:true,cat:'사회'},
  {q:'달은 스스로 빛을 낸다',a:false,cat:'과학'},
  {q:'식물은 밤에 광합성을 한다',a:false,cat:'과학'},
  {q:'이순신 장군은 임진왜란 때 활약했다',a:true,cat:'한국사'},
  {q:'1년은 365일이다',a:true,cat:'과학'},
  {q:'곰팡이는 동물이다',a:false,cat:'과학'},
  {q:'서울은 경기도에 속한다',a:false,cat:'사회'},
  {q:'피타고라스 정리는 직각삼각형에 적용된다',a:true,cat:'수학'},
  {q:'독도는 대한민국 영토이다',a:true,cat:'사회'},
  {q:'소리는 진공에서도 전달된다',a:false,cat:'과학'},
  {q:'고구려의 수도는 평양이었다',a:true,cat:'한국사'}
];

function renderFillQuiz(container){
  const q=FILL_QUIZZES[Math.floor(Math.random()*FILL_QUIZZES.length)];
  container.innerHTML=`<div class="qz" style="margin-bottom:8px">
    <div class="qz-q">${q.cat} | ${q.q}</div>
    <input class="v3-fill-input" id="v3FillAns" placeholder="정답을 입력하세요" onkeydown="if(event.key==='Enter')v3CheckFill()">
    <div style="display:flex;gap:6px;margin-top:8px;justify-content:center">
      <button class="bt bp" onclick="v3CheckFill()">확인</button>
      <button class="v3-hint-btn" onclick="v3ShowFillHint()">💡 힌트</button>
    </div>
    <div id="v3FillHint" style="display:none"></div>
    <div id="v3FillResult"></div>
  </div>`;
  container._currentFill=q;
}
window.v3CheckFill=function(){
  const container=document.querySelector('[data-v3-fill]');
  if(!container)return;
  const q=container._currentFill;
  if(!q)return;
  const input=document.getElementById('v3FillAns');
  if(!input)return;
  const ans=input.value.trim();
  const resEl=document.getElementById('v3FillResult');
  if(!ans){if(resEl)resEl.innerHTML='<div style="font-size:11px;color:var(--rd);margin-top:6px">답을 입력해주세요</div>';return;}
  const correct=ans===q.a||ans.toLowerCase()===q.a.toLowerCase();
  if(correct){
    if(resEl)resEl.innerHTML='<div style="font-size:12px;color:var(--gn);margin-top:6px;font-weight:700">✅ 정답! +5 XP</div>';
    addXP(5);addCombo();playSound('correct');
    input.disabled=true;
    setTimeout(()=>{renderFillQuiz(container);},1500);
  }else{
    if(resEl)resEl.innerHTML='<div style="font-size:12px;color:var(--rd);margin-top:6px">❌ 오답! 정답: <b>'+q.a+'</b></div>';
    resetCombo();playSound('wrong');
    input.disabled=true;
    setTimeout(()=>{renderFillQuiz(container);},2500);
  }
};
window.v3ShowFillHint=function(){
  const container=document.querySelector('[data-v3-fill]');
  if(!container)return;
  const q=container._currentFill;
  if(!q||!q.hint)return;
  const hintEl=document.getElementById('v3FillHint');
  if(hintEl){hintEl.style.display='block';hintEl.innerHTML='<div class="v3-hint-text">💡 '+q.hint+'</div>';}
  playSound('hint');
};

function renderTFQuiz(container){
  const q=TF_QUIZZES[Math.floor(Math.random()*TF_QUIZZES.length)];
  container.innerHTML=`<div class="qz" style="margin-bottom:8px">
    <div class="qz-q">${q.cat} | ${q.q}</div>
    <div class="v3-tf-btns">
      <button onclick="v3CheckTF(this,true,${q.a})">⭕ 맞다</button>
      <button onclick="v3CheckTF(this,false,${q.a})">❌ 틀리다</button>
    </div>
  </div>`;
  container._currentTF=q;
}
window.v3CheckTF=function(btn,answer,correct){
  const isCorrect=(answer===correct);
  btn.classList.add(isCorrect?'correct':'wrong');
  const sibling=btn.parentNode.querySelector('button:not(.correct):not(.wrong)');
  if(sibling){sibling.disabled=true;if(!isCorrect)sibling.classList.add('correct');}
  if(isCorrect){addXP(3);addCombo();playSound('correct');}
  else{resetCombo();playSound('wrong');}
  const container=btn.closest('[data-v3-tf]');
  if(container)setTimeout(()=>{renderTFQuiz(container);},1500);
};

// ===== Sound Toggle Button =====
function createSoundToggle(){
  if(document.getElementById('v3SoundToggle'))return;
  const btn=document.createElement('button');
  btn.id='v3SoundToggle';btn.className='v3-sound-toggle';
  const d=getV3();
  btn.textContent=d.soundOn?'🔊':'🔇';
  btn.onclick=function(){
    const dd=getV3();dd.soundOn=!dd.soundOn;saveV3(dd);
    btn.textContent=dd.soundOn?'🔊':'🔇';
  };
  document.body.appendChild(btn);
}

// ===== Inject UI into Home Page =====
function injectHomeUI(){
  const pages=document.querySelectorAll('.pg');
  if(!pages.length)return;
  const homePage=pages[0];
  if(!homePage)return;
  const catContent=document.getElementById('catContent');
  if(!catContent)return;

  const observer=new MutationObserver(()=>{
    setTimeout(injectV3Widgets,100);
  });
  observer.observe(catContent,{childList:true});
  setTimeout(injectV3Widgets,500);
}

function injectV3Widgets(){
  if(document.getElementById('v3XPGoal'))return;
  const catContent=document.getElementById('catContent');
  if(!catContent)return;
  const firstChild=catContent.firstChild;
  if(!firstChild)return;

  // XP Goal Widget
  const xpDiv=document.createElement('div');
  xpDiv.id='v3XPGoal';xpDiv.className='v3-xp-goal';
  catContent.insertBefore(xpDiv,firstChild);
  updateXPDisplay();

  // New Quiz Types Section
  const quizSection=document.createElement('div');
  quizSection.innerHTML=`<div class="cat-subsec" style="margin-top:12px">✍️ 빈칸 채우기 퀴즈</div>`;
  const fillContainer=document.createElement('div');
  fillContainer.setAttribute('data-v3-fill','1');
  quizSection.appendChild(fillContainer);
  renderFillQuiz(fillContainer);

  const tfSection=document.createElement('div');
  tfSection.innerHTML=`<div class="cat-subsec" style="margin-top:12px">⭕❌ O/X 퀴즈</div>`;
  const tfContainer=document.createElement('div');
  tfContainer.setAttribute('data-v3-tf','1');
  tfSection.appendChild(tfContainer);
  renderTFQuiz(tfContainer);

  // Insert after games section
  const gameSec=catContent.querySelector('.g4');
  if(gameSec&&gameSec.parentNode===catContent){
    const nextEl=gameSec.nextElementSibling;
    catContent.insertBefore(quizSection,nextEl);
    catContent.insertBefore(tfSection,nextEl);
  }else{
    catContent.appendChild(quizSection);
    catContent.appendChild(tfSection);
  }

  // Flashcard & Timer buttons
  const toolsGrid=document.getElementById('hU')||document.getElementById('catTools');
  if(toolsGrid){
    const flashBtn=document.createElement('div');
    flashBtn.className='gc';
    flashBtn.onclick=window.v3OpenFlashcard;
    flashBtn.innerHTML='<div class="gi">🃏</div><div class="gn">플래시카드</div><div class="gd">간격반복 학습</div>';
    toolsGrid.appendChild(flashBtn);

    const timerBtn=document.createElement('div');
    timerBtn.className='gc';
    timerBtn.onclick=window.v3ShowTimer;
    timerBtn.innerHTML='<div class="gi">🍅</div><div class="gn">집중 타이머</div><div class="gd">뽀모도로 25분</div>';
    toolsGrid.appendChild(timerBtn);

    const dueCards=getDueCards();
    if(dueCards.length>0){
      const reviewBtn=document.createElement('div');
      reviewBtn.className='gc';
      reviewBtn.style.border='1.5px solid rgba(239,68,68,.3)';
      reviewBtn.onclick=window.v3OpenFlashcard;
      reviewBtn.innerHTML='<div class="gi">📖</div><div class="gn">복습 필요</div><div class="gd">'+dueCards.length+'개 카드</div>';
      toolsGrid.insertBefore(reviewBtn,toolsGrid.firstChild);
    }
  }
}

// ===== New Educational Content (Kids: 인성감성 builtin lessons) =====
if(window.CURRICULUM&&!window.CURRICULUM.personality){
  window.CURRICULUM.personality={nm:'인성감성',ic:'💛',units:[
    {nm:'감정 이해하기',lessons:[
      {t:'감정의 종류',lv:1,content:'<h3>우리의 감정을 알아볼까요? 💛</h3><p>사람은 매일 다양한 감정을 느껴요. 감정은 좋고 나쁜 게 아니라, 모두 자연스러운 거예요!</p><h3>기본 감정 6가지</h3><p>😊 <b>기쁨</b>: 좋은 일이 있을 때, 칭찬받을 때</p><p>😢 <b>슬픔</b>: 소중한 것을 잃었을 때, 외로울 때</p><p>😡 <b>화남</b>: 불공평하다고 느낄 때, 방해받을 때</p><p>😨 <b>두려움</b>: 위험할 때, 새로운 것을 마주할 때</p><p>🤢 <b>역겨움</b>: 싫은 것을 볼 때</p><p>😮 <b>놀람</b>: 예상하지 못한 일이 생길 때</p><h3>감정을 느끼면 어떻게 해요?</h3><p>1. 내 감정에 이름을 붙여요 ("나는 지금 화가 났어")</p><p>2. 왜 그런 감정이 드는지 생각해요</p><p>3. 건강한 방법으로 표현해요 (말로 표현, 그림 그리기, 운동)</p><p style="color:var(--cy)">💡 감정일기를 쓰면 내 마음을 더 잘 이해할 수 있어요!</p>',quiz:[{q:'감정을 건강하게 표현하는 방법이 아닌 것은?',a:['물건을 던진다','말로 표현한다','그림을 그린다','일기를 쓴다'],c:0},{q:'기본 감정이 아닌 것은?',a:['졸림','기쁨','슬픔','화남'],c:0}]},
      {t:'공감하는 마음',lv:1,content:'<h3>공감이란? 🤝</h3><p><b>공감</b>은 다른 사람의 마음을 이해하고 함께 느끼는 것이에요.</p><h3>공감하는 방법</h3><p>1. <b>잘 들어주기</b>: 상대방이 말할 때 끝까지 들어요</p><p>2. <b>표정 읽기</b>: 얼굴 표정으로 기분을 알아차려요</p><p>3. <b>입장 바꿔 생각하기</b>: "내가 저 사람이라면 어떤 기분일까?"</p><p>4. <b>따뜻한 말 건네기</b>: "그랬구나, 많이 힘들었겠다"</p><h3>공감 vs 동정</h3><p>• <b>공감</b>: "네 기분 이해해. 나도 비슷한 경험이 있어." (함께 느끼기)</p><p>• <b>동정</b>: "불쌍하다." (위에서 내려다보기)</p><p>공감은 상대방과 같은 눈높이에서 함께하는 것이에요. 동정과는 달라요!</p><h3>공감 연습</h3><p>친구가 시험을 못 봐서 울고 있어요. 어떻게 할까요?</p><p>❌ "나는 잘 봤는데~" (자랑)</p><p>❌ "왜 공부 안 했어?" (비난)</p><p>✅ "많이 속상하지? 다음엔 같이 공부하자" (공감+격려)</p>',quiz:[{q:'공감하는 말은?',a:['그랬구나, 힘들었겠다','왜 그렇게 못해?','나는 잘 했는데','그건 네 잘못이야'],c:0},{q:'공감할 때 가장 먼저 해야 할 것은?',a:['잘 들어주기','조언하기','해결해주기','무시하기'],c:0}]}
    ]},
    {nm:'좋은 습관 만들기',lessons:[
      {t:'시간 관리',lv:2,content:'<h3>시간을 잘 쓰는 방법 ⏰</h3><p>하루는 24시간으로 모두에게 똑같아요. 하지만 시간을 어떻게 쓰느냐에 따라 결과가 달라져요!</p><h3>시간 관리 비법</h3><p>1. <b>우선순위 정하기</b>: 중요한 것과 급한 것을 구분해요</p><p>• 🔴 중요+급함: 지금 바로 해야 해요 (숙제 마감)</p><p>• 🟡 중요+안급함: 계획을 세워서 해요 (운동, 독서)</p><p>• 🔵 덜중요+급함: 빨리 처리해요 (정리정돈)</p><p>2. <b>타이머 사용</b>: 25분 집중 + 5분 휴식 (뽀모도로 기법)</p><p>3. <b>할 일 목록</b>: 아침에 오늘 할 일을 적어요</p><p>4. <b>미루지 않기</b>: "5분만 먼저 시작하자"</p><h3>나쁜 시간 도둑들 🦹</h3><p>• 스마트폰 무한 스크롤</p><p>• "나중에 할게" 미루기</p><p>• 계획 없이 멍하니 보내기</p><p style="color:var(--gd)">⭐ 작은 습관부터 시작하세요. 매일 10분 일찍 일어나기부터!</p>',quiz:[{q:'뽀모도로 기법의 집중 시간은?',a:['25분','10분','45분','60분'],c:0},{q:'시간 도둑이 아닌 것은?',a:['독서','무한 스크롤','미루기','계획 없이 보내기'],c:0}]},
      {t:'건강한 생활 습관',lv:1,content:'<h3>건강한 하루 만들기 🌅</h3><p>좋은 습관을 하나씩 만들면, 어느새 건강하고 행복한 사람이 돼요!</p><h3>아침 루틴</h3><p>☀️ 일정한 시간에 일어나기</p><p>🚰 일어나면 물 한 잔 마시기</p><p>🧘 5분 스트레칭하기</p><p>🍎 아침밥 꼭 먹기</p><h3>공부 습관</h3><p>📚 매일 같은 시간에 공부하기</p><p>📝 예습보다 복습이 더 중요!</p><p>🧠 어려운 것은 아침에, 쉬운 것은 저녁에</p><h3>저녁 루틴</h3><p>🚫 잠자기 1시간 전 스마트폰 끄기</p><p>📖 10분 독서하기</p><p>🛁 따뜻한 물로 씻기</p><p>😴 충분히 자기 (초등학생 9~11시간)</p><h3>21일 법칙</h3><p>새로운 습관은 21일 동안 매일 하면 자연스러워져요. 달력에 ✓ 표시하면서 도전해보세요! 📅</p>',quiz:[{q:'새 습관이 자연스러워지는 데 걸리는 기간은?',a:['약 21일','3일','100일','1년'],c:0},{q:'잠자기 전에 하면 좋지 않은 것은?',a:['스마트폰 보기','독서','스트레칭','따뜻한 물 마시기'],c:0}]}
    ]},
    {nm:'관계와 소통',lessons:[
      {t:'친구 사이 갈등 해결',lv:2,content:'<h3>친구와 다투었을 때 🤜🤛</h3><p>아무리 좋은 친구도 가끔 다툴 수 있어요. 중요한 건 어떻게 해결하느냐예요!</p><h3>갈등 해결 5단계</h3><p>1. <b>진정하기</b>: 화가 날 때 바로 말하면 더 싸워요. 심호흡 10번!</p><p>2. <b>내 마음 말하기</b>: "네가 ___할 때 나는 ___한 기분이 들어" (나-전달법)</p><p>3. <b>상대방 말 듣기</b>: 끝까지 듣고, 되물어보기</p><p>4. <b>함께 해결책 찾기</b>: 둘 다 만족할 수 있는 방법</p><p>5. <b>약속하기</b>: 앞으로 어떻게 하자고 약속</p><h3>나-전달법 연습</h3><p>❌ "너 왜 맨날 약속 어겨!" (너-전달법, 공격적)</p><p>✅ "네가 약속을 안 지키면 나는 속상해" (나-전달법, 부드러움)</p><h3>화해하는 말</h3><p>• "미안해, 내가 생각이 짧았어"</p><p>• "네 마음을 이해 못했어, 다시 얘기하자"</p><p>• "우리 다시 잘 지내자, 네가 소중해"</p>',quiz:[{q:'갈등 해결 첫 번째 단계는?',a:['진정하기','소리지르기','무시하기','선생님께 말하기'],c:0},{q:'나-전달법의 예시는?',a:['네가 그러면 나는 슬퍼','너 왜 그래','넌 항상 그래','말 시키지 마'],c:0}]},
      {t:'디지털 예절 (네티켓)',lv:2,content:'<h3>인터넷에서도 예의를 지켜요 💻</h3><p>온라인에서도 화면 저편에는 실제 사람이 있어요. 말과 행동에 책임을 져야 해요!</p><h3>네티켓 기본 규칙</h3><p>1. <b>실명처럼 행동하기</b>: 익명이라도 현실에서 못할 말은 하지 않기</p><p>2. <b>남의 글 존중하기</b>: 비난 대신 건설적인 의견을 달기</p><p>3. <b>개인정보 보호</b>: 주소, 전화번호, 학교 이름 올리지 않기</p><p>4. <b>허락 없이 사진 올리지 않기</b>: 친구 사진도 동의를 받아요</p><p>5. <b>출처 밝히기</b>: 다른 사람의 글/그림을 가져올 때</p><h3>사이버 불링(온라인 괴롭힘) 대처</h3><p>🛑 <b>당하고 있다면</b>: 캡처 저장 → 부모님/선생님께 알리기 → 차단하기</p><p>🛑 <b>목격했다면</b>: 동조하지 않기 → 피해자 편들기 → 어른에게 알리기</p><p style="color:var(--rd)">⚠️ 온라인에서 한 번 올린 글/사진은 영원히 사라지지 않을 수 있어요!</p>',quiz:[{q:'네티켓으로 맞는 것은?',a:['출처를 밝힌다','익명으로 욕한다','남의 사진을 마음대로 올린다','개인정보를 공유한다'],c:0},{q:'사이버 불링을 목격하면?',a:['어른에게 알린다','함께 놀린다','모른 척한다','구경한다'],c:0}]}
    ]}
  ]};
}

// ===== Additional Quiz Content for Thin Subjects =====
if(window.QUIZ&&Array.isArray(window.QUIZ)){
  const newQuizzes=[
    {q:'원의 넓이를 구하는 공식은?',a:['π×r²','2πr','πd','r²'],c:0,cat:'수학'},
    {q:'DNA의 이중나선 구조를 발견한 사람은?',a:['왓슨과 크릭','멘델','다윈','파스퇴르'],c:0,cat:'과학'},
    {q:'한반도에서 가장 긴 강은?',a:['압록강','한강','낙동강','금강'],c:0,cat:'사회'},
    {q:'세계에서 가장 높은 산은?',a:['에베레스트','K2','칸첸중가','로체'],c:0,cat:'사회'},
    {q:'광합성에서 나오는 기체는?',a:['산소','이산화탄소','질소','수소'],c:0,cat:'과학'},
    {q:'고려를 건국한 사람은?',a:['왕건','이성계','궁예','견훤'],c:0,cat:'한국사'},
    {q:'지구의 자전 주기는?',a:['약 24시간','약 12시간','약 365일','약 30일'],c:0,cat:'과학'},
    {q:'삼국 중 가장 먼저 멸망한 나라는?',a:['백제','고구려','신라','가야'],c:0,cat:'한국사'},
    {q:'물이 끓는 온도는?',a:['100°C','0°C','50°C','200°C'],c:0,cat:'과학'},
    {q:'세종대왕이 훈민정음을 반포한 해는?',a:['1446년','1392년','1592년','1910년'],c:0,cat:'한국사'},
    {q:'8의 제곱근은?',a:['2√2','4','2','8'],c:0,cat:'수학'},
    {q:'인체에서 가장 큰 장기는?',a:['간','심장','폐','위'],c:0,cat:'과학'},
    {q:'임진왜란이 일어난 해는?',a:['1592년','1446년','1636년','1894년'],c:0,cat:'한국사'},
    {q:'태양계에서 가장 뜨거운 행성은?',a:['금성','수성','화성','목성'],c:0,cat:'과학'},
    {q:'도레미파솔라시 중 다(C) 다음 음은?',a:['레(D)','미(E)','파(F)','솔(G)'],c:0,cat:'음악'},
    {q:'축구에서 한 팀의 인원은?',a:['11명','9명','13명','15명'],c:0,cat:'체육'},
    {q:'CSS에서 글씨 색을 바꾸는 속성은?',a:['color','font-color','text-color','background'],c:0,cat:'코딩'},
    {q:'HTML에서 링크를 만드는 태그는?',a:['a','link','href','url'],c:0,cat:'코딩'},
    {q:'for 반복문에서 i++의 의미는?',a:['i를 1 증가','i를 2배','i를 출력','i를 삭제'],c:0,cat:'코딩'},
    {q:'베토벤의 대표곡이 아닌 것은?',a:['사계','운명','월광','엘리제를 위하여'],c:0,cat:'음악'}
  ];
  newQuizzes.forEach(q=>{if(!window.QUIZ.find(x=>x.q===q.q))window.QUIZ.push(q);});
}

// ===== Init =====
function init(){
  timerSeconds=FOCUS_TIME;
  createTimer();
  createSoundToggle();
  injectHomeUI();

  // Keyboard shortcuts
  document.addEventListener('keydown',function(e){
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
    if(e.key==='f'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();v3OpenFlashcard();}
    if(e.key==='t'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();v3ShowTimer();}
  });
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();
})();
