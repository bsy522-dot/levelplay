// LevelPlay v4.0 Patch - Mastery Challenge + Learning Calendar + Time Attack
// + Learning Stories + Level Test + Listening Quiz + 30 Badges + Quiz Content
(function(){
'use strict';

const css=document.createElement('style');
css.textContent=`
.v4-mastery{background:linear-gradient(135deg,var(--c1,#111127),rgba(251,191,36,.06));border:1.5px solid rgba(251,191,36,.2);border-radius:12px;padding:14px;margin-bottom:10px}
.v4-mastery-title{font-size:13px;font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:6px}
.v4-mastery-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:4px}
.v4-mastery-dot{width:100%;aspect-ratio:1;border-radius:50%;border:2px solid rgba(251,191,36,.2);display:flex;align-items:center;justify-content:center;font-size:14px;transition:.3s}
.v4-mastery-dot.done{border-color:var(--gn,#22c55e);background:rgba(34,197,94,.15)}
.v4-mastery-dot.fail{border-color:var(--rd,#ef4444);background:rgba(239,68,68,.15)}
.v4-mastery-dot.current{border-color:var(--gd,#fbbf24);background:rgba(251,191,36,.15);animation:v4pulse 1s infinite}
@keyframes v4pulse{0%,100%{box-shadow:0 0 0 0 rgba(251,191,36,.3)}50%{box-shadow:0 0 0 6px rgba(251,191,36,0)}}
.v4-mastery-q{background:var(--c2,#181838);border-radius:10px;padding:14px;margin-top:10px}
.v4-mastery-q .mq-cat{font-size:9px;color:var(--p,#8b5cf6);font-weight:700;margin-bottom:6px}
.v4-mastery-q .mq-text{font-size:13px;font-weight:600;margin-bottom:10px;line-height:1.5}
.v4-mastery-q .mq-opts{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.v4-mastery-q .mq-opt{padding:10px;border:1.5px solid rgba(139,92,246,.15);border-radius:8px;background:var(--bg,#0a0a1a);color:var(--tx);font:12px inherit;cursor:pointer;transition:.15s;text-align:left}
.v4-mastery-q .mq-opt:hover{border-color:var(--cy,#06d6a0)}
.v4-mastery-q .mq-opt.correct{background:rgba(34,197,94,.15);border-color:var(--gn)}
.v4-mastery-q .mq-opt.wrong{background:rgba(239,68,68,.15);border-color:var(--rd)}
.v4-mastery-result{text-align:center;padding:20px;animation:v4FadeIn .4s}
.v4-mastery-result h3{font-size:16px;font-weight:900;margin-bottom:8px}
.v4-mastery-result p{font-size:12px;color:var(--t2)}
@keyframes v4FadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
.v4-calendar{background:var(--c1,#111127);border:1px solid rgba(139,92,246,.08);border-radius:12px;padding:14px;margin-bottom:10px}
.v4-cal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}
.v4-cal-header h4{font-size:13px;font-weight:700}
.v4-cal-header button{background:none;border:none;color:var(--tx);font-size:16px;cursor:pointer;padding:4px 8px}
.v4-cal-days{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;text-align:center}
.v4-cal-day-name{font-size:9px;color:var(--t3);font-weight:600;padding:4px 0}
.v4-cal-cell{aspect-ratio:1;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--t3);position:relative;cursor:default}
.v4-cal-cell.today{border:1.5px solid var(--cy);color:var(--cy);font-weight:700}
.v4-cal-cell.active{background:rgba(139,92,246,.15);color:var(--tx);font-weight:600}
.v4-cal-cell.active::after{content:'';position:absolute;bottom:3px;width:4px;height:4px;border-radius:50%;background:var(--cy)}
.v4-cal-cell.other{opacity:.3}
.v4-cal-stats{display:flex;gap:10px;margin-top:10px;font-size:10px;color:var(--t2)}
.v4-cal-stats b{color:var(--cy)}
.v4-time-attack{position:fixed;inset:0;z-index:8500;background:rgba(0,0,0,.95);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;animation:v4FadeIn .3s}
.v4-ta-timer{font-size:48px;font-weight:900;background:var(--g1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:16px}
.v4-ta-score{font-size:14px;color:var(--t2);margin-bottom:20px}
.v4-ta-q{background:var(--c1);border-radius:12px;padding:16px;width:100%;max-width:400px}
.v4-ta-close{position:absolute;top:16px;right:16px;width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.1);border:none;color:#fff;font-size:18px;cursor:pointer}
.v4-story{position:fixed;inset:0;z-index:8600;background:linear-gradient(180deg,#0a0a1a,#111127);display:flex;flex-direction:column;padding:16px;animation:v4FadeIn .3s}
.v4-story-header{display:flex;align-items:center;gap:8px;margin-bottom:16px}
.v4-story-header h3{font-size:14px;font-weight:700;flex:1}
.v4-story-close{background:none;border:none;color:var(--tx);font-size:18px;cursor:pointer}
.v4-story-body{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding-bottom:80px}
.v4-story-msg{max-width:80%;padding:10px 14px;border-radius:14px;font-size:13px;line-height:1.6;animation:v4MsgIn .3s}
@keyframes v4MsgIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
.v4-story-msg.npc{align-self:flex-start;background:rgba(139,92,246,.12);border:1px solid rgba(139,92,246,.1);border-bottom-left-radius:4px}
.v4-story-msg.user{align-self:flex-end;background:rgba(6,214,160,.12);border:1px solid rgba(6,214,160,.1);border-bottom-right-radius:4px}
.v4-story-msg .speaker{font-size:10px;font-weight:700;color:var(--cy);margin-bottom:3px}
.v4-story-choices{position:fixed;bottom:0;left:0;right:0;padding:16px;background:linear-gradient(transparent,rgba(10,10,26,.95) 30%);display:flex;flex-direction:column;gap:6px}
.v4-story-choice{padding:12px 16px;border:1.5px solid rgba(139,92,246,.2);border-radius:10px;background:var(--c1);color:var(--tx);font:13px inherit;cursor:pointer;text-align:left;transition:.15s}
.v4-story-choice:hover{border-color:var(--cy);transform:translateX(4px)}
.v4-badge-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
.v4-badge{background:var(--c2);border:1px solid rgba(139,92,246,.08);border-radius:10px;padding:8px;text-align:center;transition:.2s}
.v4-badge.earned{border-color:rgba(251,191,36,.3);background:linear-gradient(135deg,rgba(251,191,36,.08),rgba(139,92,246,.05))}
.v4-badge .badge-icon{font-size:24px;margin-bottom:4px;filter:grayscale(1) opacity(.3)}
.v4-badge.earned .badge-icon{filter:none}
.v4-badge .badge-name{font-size:8px;color:var(--t3);line-height:1.3}
.v4-badge.earned .badge-name{color:var(--tx);font-weight:600}
.v4-lvtest{background:linear-gradient(135deg,rgba(139,92,246,.08),rgba(6,214,160,.05));border:1.5px solid rgba(139,92,246,.15);border-radius:12px;padding:14px;margin-bottom:10px;cursor:pointer;transition:.2s}
.v4-lvtest:hover{border-color:var(--cy);transform:translateY(-2px)}
.v4-listen-btn{display:inline-flex;align-items:center;gap:4px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);color:#fff;border:none;border-radius:6px;padding:6px 12px;font-size:11px;font-weight:700;cursor:pointer;margin-bottom:8px}
.v4-listen-btn:hover{transform:scale(1.05)}
.v4-progress-ring{position:fixed;bottom:calc(var(--nv,52px) + 170px);left:12px;z-index:500}
.v4-progress-ring svg{transform:rotate(-90deg)}
.v4-progress-ring text{font-size:9px;font-weight:900;fill:var(--cy)}
`;
document.head.appendChild(css);

const U=()=>{try{return JSON.parse(localStorage.getItem('lp_user'))||{}}catch(e){return{}}};
const S=d=>{const u=U();Object.assign(u,d);localStorage.setItem('lp_user',JSON.stringify(u))};
const _el=id=>document.getElementById(id);

// ===== Web Audio SFX =====
let v4Ctx=null;
function v4sfx(type){
  try{
    if(!v4Ctx)v4Ctx=new(window.AudioContext||window.webkitAudioContext)();
    if(v4Ctx.state==='suspended')v4Ctx.resume();
    const u=U();if(u.soundMuted)return;
    const o=v4Ctx.createOscillator(),g=v4Ctx.createGain(),t=v4Ctx.currentTime;
    o.connect(g);g.connect(v4Ctx.destination);
    switch(type){
      case'mastery':o.type='sine';o.frequency.setValueAtTime(523,t);o.frequency.setValueAtTime(659,t+.1);o.frequency.setValueAtTime(784,t+.2);o.frequency.setValueAtTime(1047,t+.3);g.gain.setValueAtTime(.15,t);g.gain.exponentialValueTo?g.gain.exponentialValueTo(.001,t+.5):g.gain.linearRampToValueAtTime(.001,t+.5);o.start(t);o.stop(t+.5);break;
      case'correct_chain':o.type='triangle';o.frequency.setValueAtTime(880,t);o.frequency.setValueAtTime(1109,t+.08);g.gain.setValueAtTime(.12,t);g.gain.linearRampToValueAtTime(.001,t+.2);o.start(t);o.stop(t+.2);break;
      case'time_tick':o.type='sine';o.frequency.setValueAtTime(1000,t);g.gain.setValueAtTime(.08,t);g.gain.linearRampToValueAtTime(.001,t+.05);o.start(t);o.stop(t+.05);break;
      case'time_up':o.type='square';o.frequency.setValueAtTime(440,t);o.frequency.setValueAtTime(330,t+.15);o.frequency.setValueAtTime(220,t+.3);g.gain.setValueAtTime(.1,t);g.gain.linearRampToValueAtTime(.001,t+.5);o.start(t);o.stop(t+.5);break;
      case'badge':o.type='sine';o.frequency.setValueAtTime(659,t);o.frequency.setValueAtTime(784,t+.1);o.frequency.setValueAtTime(1047,t+.2);g.gain.setValueAtTime(.12,t);g.gain.linearRampToValueAtTime(.001,t+.4);o.start(t);o.stop(t+.4);break;
      case'story':o.type='sine';o.frequency.setValueAtTime(440,t);o.frequency.setValueAtTime(523,t+.15);g.gain.setValueAtTime(.08,t);g.gain.linearRampToValueAtTime(.001,t+.3);o.start(t);o.stop(t+.3);break;
    }
  }catch(e){}
}

// ===== 1. Mastery Challenge =====
const MASTERY_POOL=[
  {q:'피타고라스 정리에서 빗변의 제곱은?',a:['다른 두 변의 제곱의 합','세 변의 합','넓이의 2배','둘레의 절반'],c:0,cat:'수학',lv:3},
  {q:'연립방정식 2x+y=7, x-y=2의 x값은?',a:['3','2','4','5'],c:0,cat:'수학',lv:4},
  {q:'log10(1000)의 값은?',a:['3','10','100','1000'],c:0,cat:'수학',lv:5},
  {q:'미토콘드리아의 역할은?',a:['에너지 생산','단백질 합성','유전정보 저장','세포 분열'],c:0,cat:'과학',lv:3},
  {q:'빛의 3원색이 아닌 것은?',a:['노랑','빨강','초록','파랑'],c:0,cat:'과학',lv:2},
  {q:'원소기호 Fe는 무엇?',a:['철','금','은','구리'],c:0,cat:'과학',lv:2},
  {q:'고구려를 건국한 사람은?',a:['주몽','온조','혁거세','왕건'],c:0,cat:'한국사',lv:2},
  {q:'조선의 마지막 왕은?',a:['순종','고종','철종','헌종'],c:0,cat:'한국사',lv:3},
  {q:'6.25 전쟁이 일어난 해는?',a:['1950년','1945년','1960년','1953년'],c:0,cat:'한국사',lv:2},
  {q:'바흐의 별명은?',a:['음악의 아버지','음악의 어머니','피아노의 시인','교향곡의 아버지'],c:0,cat:'음악',lv:2},
  {q:'4/4 박자에서 한 마디의 박 수는?',a:['4박','3박','6박','2박'],c:0,cat:'음악',lv:1},
  {q:'비타민 C가 많은 과일은?',a:['키위','바나나','포도','수박'],c:0,cat:'건강',lv:1},
  {q:'GDP의 뜻은?',a:['국내총생산','국민총소득','국제통화기금','국가예산'],c:0,cat:'경제',lv:2},
  {q:'수요와 공급의 법칙에서 가격이 오르면?',a:['수요 감소','수요 증가','공급 감소','변화 없음'],c:0,cat:'경제',lv:2},
  {q:'Python에서 리스트를 만드는 괄호는?',a:['[]','()','{}','<>'],c:0,cat:'코딩',lv:1},
  {q:'HTML에서 제목을 만드는 태그는?',a:['h1','p','div','span'],c:0,cat:'코딩',lv:1},
  {q:'JavaScript에서 변수를 선언하는 키워드가 아닌 것은?',a:['int','let','const','var'],c:0,cat:'코딩',lv:2},
  {q:'CSS에서 요소를 가운데 정렬하는 속성은?',a:['margin: 0 auto','padding: center','align: middle','float: center'],c:0,cat:'코딩',lv:2},
  {q:'올림픽 5대 링 색이 아닌 것은?',a:['보라','파랑','빨강','초록'],c:0,cat:'체육',lv:1},
  {q:'마라톤의 거리는?',a:['42.195km','40km','50km','35km'],c:0,cat:'체육',lv:2},
  {q:'태권도의 품새가 아닌 것은?',a:['백두','태극 1장','고려','금강'],c:0,cat:'체육',lv:3},
  {q:'색의 3원색이 아닌 것은?',a:['초록','빨강','파랑','노랑'],c:0,cat:'미술',lv:1},
  {q:'모나리자를 그린 화가는?',a:['레오나르도 다 빈치','미켈란젤로','피카소','반 고흐'],c:0,cat:'미술',lv:1},
  {q:'인상파 화가가 아닌 사람은?',a:['피카소','모네','르누아르','드가'],c:0,cat:'미술',lv:3},
  {q:'우리나라 국기의 이름은?',a:['태극기','일장기','성조기','유니언잭'],c:0,cat:'사회',lv:1},
  {q:'대한민국의 수도는?',a:['서울','부산','대전','인천'],c:0,cat:'사회',lv:1},
  {q:'UN 본부가 있는 도시는?',a:['뉴욕','런던','파리','도쿄'],c:0,cat:'사회',lv:2},
  {q:'영어에서 be동사의 과거형은?',a:['was','am','is','are'],c:0,cat:'영어',lv:2},
  {q:'apple의 복수형은?',a:['apples','apple','appls','applees'],c:0,cat:'영어',lv:1},
  {q:'119에 전화하면 어디에 연결되나요?',a:['소방서','경찰서','병원','학교'],c:0,cat:'안전',lv:1}
];

let masteryState=null;

function startMastery(category){
  const pool=category?MASTERY_POOL.filter(q=>q.cat===category):MASTERY_POOL;
  if(pool.length<5)return;
  const qs=[];const used=new Set();
  while(qs.length<5&&qs.length<pool.length){
    const idx=Math.floor(Math.random()*pool.length);
    if(!used.has(idx)){used.add(idx);qs.push({...pool[idx]});}
  }
  masteryState={questions:qs,current:0,results:[],category:category||'전체'};
  showMasteryUI();
}

function showMasteryUI(){
  const s=masteryState;if(!s)return;
  let h='<div class="v4-mastery"><div class="v4-mastery-title">&#x1F3AF; 마스터리 챌린지 — '+s.category+'</div>';
  h+='<div class="v4-mastery-grid">';
  for(let i=0;i<5;i++){
    const cls=i<s.current?(s.results[i]?'done':'fail'):(i===s.current?'current':'');
    const icon=i<s.current?(s.results[i]?'&#x2713;':'&#x2717;'):(i===s.current?'&#x2753;':'');
    h+='<div class="v4-mastery-dot '+cls+'">'+icon+'</div>';
  }
  h+='</div>';
  if(s.current<5){
    const q=s.questions[s.current];
    const opts=[...q.a].map((a,i)=>({t:a,ok:i===q.c}));
    for(let i=opts.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[opts[i],opts[j]]=[opts[j],opts[i]];}
    h+='<div class="v4-mastery-q"><div class="mq-cat">'+q.cat+' Lv.'+q.lv+'</div><div class="mq-text">'+(s.current+1)+'/5. '+q.q+'</div><div class="mq-opts">';
    opts.forEach((o,i)=>{h+='<button class="mq-opt" onclick="v4MasteryAnswer(this,'+o.ok+')">'+o.t+'</button>';});
    h+='</div></div>';
  }else{
    const correct=s.results.filter(Boolean).length;
    const passed=correct>=4;
    h+='<div class="v4-mastery-result"><h3>'+(passed?'&#x1F3C6; 마스터리 달성!':'&#x1F4AA; 아쉽지만 다시 도전!')+'</h3>';
    h+='<p>'+correct+'/5 정답'+(passed?' — +30 XP 획득!':' — 4개 이상 맞히면 마스터!')+'</p>';
    h+='<button class="bt bp" onclick="startMastery(\''+s.category+'\')" style="margin-top:10px">다시 도전</button></div>';
    if(passed){
      const u=U();if(!u.masteryCount)u.masteryCount=0;u.masteryCount++;
      if(!u.masteryByCategory)u.masteryByCategory={};
      u.masteryByCategory[s.category]=(u.masteryByCategory[s.category]||0)+1;
      u.xp=(u.xp||0)+30;S(u);
      v4sfx('mastery');
      v4CheckBadges();
    }
  }
  h+='</div>';
  const mo=_el('moB');if(mo){mo.innerHTML=h;const modal=_el('mo');if(modal&&!modal.classList.contains('sh'))modal.classList.add('sh');}
}

window.v4MasteryAnswer=function(btn,ok){
  if(btn.classList.contains('correct')||btn.classList.contains('wrong'))return;
  const s=masteryState;if(!s)return;
  btn.classList.add(ok?'correct':'wrong');
  if(!ok){const corr=btn.parentElement.querySelector('[onclick*="true"]');if(corr)corr.classList.add('correct');}
  s.results.push(ok);
  if(ok){v4sfx('correct_chain');const u=U();u.xp=(u.xp||0)+5;S(u);}
  setTimeout(()=>{s.current++;showMasteryUI();},800);
};

// ===== 2. Learning Calendar =====
function renderCalendar(year,month){
  const u=U();const studyDays=u.studyDays||{};
  const today=new Date();const tKey=today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');
  const first=new Date(year,month,1);const last=new Date(year,month+1,0);
  const startDay=first.getDay();const daysInMonth=last.getDate();
  const prevLast=new Date(year,month,0).getDate();
  const months=['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  let h='<div class="v4-calendar"><div class="v4-cal-header"><button onclick="v4NavCal(-1)">&#x25C0;</button><h4>'+year+'년 '+months[month]+'</h4><button onclick="v4NavCal(1)">&#x25B6;</button></div>';
  h+='<div class="v4-cal-days">';
  ['일','월','화','수','목','금','토'].forEach(d=>{h+='<div class="v4-cal-day-name">'+d+'</div>';});
  for(let i=startDay-1;i>=0;i--){h+='<div class="v4-cal-cell other">'+(prevLast-i)+'</div>';}
  let activeDays=0;
  for(let d=1;d<=daysInMonth;d++){
    const key=year+'-'+String(month+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    const isToday=key===tKey;const isActive=studyDays[key]>0;
    if(isActive)activeDays++;
    h+='<div class="v4-cal-cell'+(isToday?' today':'')+(isActive?' active':'')+'" title="'+(isActive?studyDays[key]+' XP':'')+'">'+d+'</div>';
  }
  const remaining=42-(startDay+daysInMonth);
  for(let i=1;i<=remaining;i++){h+='<div class="v4-cal-cell other">'+i+'</div>';}
  h+='</div>';
  h+='<div class="v4-cal-stats">&#x1F4C5; 이번 달 학습일: <b>'+activeDays+'</b>일 &nbsp;|&nbsp; &#x1F525; 총 XP: <b>'+(u.xp||0)+'</b></div>';
  h+='</div>';
  return h;
}

let v4CalYear,v4CalMonth;
window.v4NavCal=function(dir){
  v4CalMonth+=dir;
  if(v4CalMonth<0){v4CalMonth=11;v4CalYear--;}
  if(v4CalMonth>11){v4CalMonth=0;v4CalYear++;}
  const area=document.getElementById('v4CalArea');
  if(area)area.innerHTML=renderCalendar(v4CalYear,v4CalMonth);
};

function recordStudyDay(){
  const u=U();if(!u.studyDays)u.studyDays={};
  const t=new Date();const key=t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
  u.studyDays[key]=(u.studyDays[key]||0)+1;S(u);
}

// ===== 3. Time Attack Mode =====
let taState=null,taTimer=null;

function startTimeAttack(){
  const pool=[...MASTERY_POOL];
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
  taState={questions:pool,current:0,score:0,timeLeft:60,answered:0};
  const el=document.createElement('div');el.className='v4-time-attack';el.id='v4ta';
  document.body.appendChild(el);
  taTimer=setInterval(()=>{
    taState.timeLeft--;
    if(taState.timeLeft<=10)v4sfx('time_tick');
    if(taState.timeLeft<=0){clearInterval(taTimer);endTimeAttack();}
    else renderTA();
  },1000);
  renderTA();
}

function renderTA(){
  const s=taState;if(!s)return;
  const el=_el('v4ta');if(!el)return;
  const q=s.questions[s.current%s.questions.length];
  const opts=[...q.a].map((a,i)=>({t:a,ok:i===q.c}));
  for(let i=opts.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[opts[i],opts[j]]=[opts[j],opts[i]];}
  el.innerHTML='<button class="v4-ta-close" onclick="endTimeAttack()">&#x2715;</button>'+
    '<div class="v4-ta-timer">'+s.timeLeft+'</div>'+
    '<div class="v4-ta-score">&#x2B50; '+s.score+'점 &nbsp;|&nbsp; '+s.answered+'문제 완료</div>'+
    '<div class="v4-ta-q"><div class="mq-cat">'+q.cat+'</div><div class="mq-text" style="font-size:14px;font-weight:600;margin:8px 0 12px">'+q.q+'</div>'+
    '<div class="mq-opts">'+opts.map(o=>'<button class="mq-opt" onclick="v4TAAnswer(this,'+o.ok+')">'+o.t+'</button>').join('')+'</div></div>';
}

window.v4TAAnswer=function(btn,ok){
  if(btn.dataset.done)return;btn.dataset.done='1';
  btn.classList.add(ok?'correct':'wrong');
  taState.answered++;
  if(ok){taState.score+=10;v4sfx('correct_chain');}
  setTimeout(()=>{taState.current++;renderTA();},400);
};

function endTimeAttack(){
  if(taTimer){clearInterval(taTimer);taTimer=null;}
  const s=taState;if(!s)return;
  const el=_el('v4ta');
  if(el){
    v4sfx('time_up');
    el.innerHTML='<div style="text-align:center;animation:v4FadeIn .4s"><div style="font-size:48px;margin-bottom:16px">&#x23F1;</div>'+
      '<h2 style="font-size:20px;font-weight:900;margin-bottom:8px">타임 업!</h2>'+
      '<p style="font-size:14px;color:var(--t2);margin-bottom:4px">'+s.answered+'문제 도전, '+s.score+'점 획득</p>'+
      '<p style="font-size:12px;color:var(--cy);margin-bottom:20px">정답률: '+(s.answered?Math.round(s.score/s.answered/10*100):0)+'%</p>'+
      '<button class="bt bp" onclick="document.getElementById(\'v4ta\').remove();startTimeAttack()">다시 도전</button>&nbsp;'+
      '<button class="bt bs" onclick="document.getElementById(\'v4ta\').remove()">닫기</button></div>';
    const u=U();u.xp=(u.xp||0)+s.score;if(!u.taHighScore||s.score>u.taHighScore)u.taHighScore=s.score;
    if(!u.taCount)u.taCount=0;u.taCount++;S(u);
    v4CheckBadges();
  }
}
window.startTimeAttack=startTimeAttack;
window.endTimeAttack=endTimeAttack;

// ===== 4. Learning Stories =====
const STORIES=[
  {id:'math_shop',title:'&#x1F6D2; 마트에서 수학 쓰기',cat:'수학',scenes:[
    {speaker:'엄마',text:'오늘 마트에 왔어! 사과 한 봉지에 3,500원이고, 3봉지 사야 해. 얼마가 필요할까?',choices:[{text:'3,500 x 3 = 10,500원이요!',correct:true,reply:'맞아! 곱셈을 잘 활용했네.'},{text:'3,500 + 3 = 3,503원이요?',correct:false,reply:'곱셈이 필요해. 3,500을 3번 더하는 거야.'}]},
    {speaker:'엄마',text:'좋아! 그런데 2만원을 내면 거스름돈은 얼마일까?',choices:[{text:'20,000 - 10,500 = 9,500원이요!',correct:true,reply:'정확해! 뺄셈도 완벽하네.'},{text:'20,000 - 3,500 = 16,500원?',correct:false,reply:'총 금액 10,500원을 빼야 해.'}]},
    {speaker:'엄마',text:'우유가 30% 할인 중이야. 원래 2,000원이면 할인 후 가격은?',choices:[{text:'1,400원이요! (2000 x 0.7)',correct:true,reply:'백분율 계산을 잘했어! 수학 천재구나.'},{text:'600원이요?',correct:false,reply:'600원은 할인 금액이야. 원래 가격에서 빼야지!'}]}
  ]},
  {id:'science_plant',title:'&#x1F331; 식물의 비밀 탐험',cat:'과학',scenes:[
    {speaker:'박사님',text:'이 식물의 잎이 초록색인 이유를 알고 있니?',choices:[{text:'엽록소 때문이에요!',correct:true,reply:'맞아! 엽록소가 빛을 흡수해서 광합성을 해.'},{text:'물감을 칠해서요?',correct:false,reply:'자연에는 물감이 없어. 엽록소라는 색소 때문이야.'}]},
    {speaker:'박사님',text:'광합성에 필요한 3가지는 무엇일까?',choices:[{text:'빛, 물, 이산화탄소요!',correct:true,reply:'정확해! 이 세 가지로 포도당과 산소를 만들어.'},{text:'흙, 비, 바람이요?',correct:false,reply:'흙은 영양분을 주지만 광합성 재료는 빛, 물, CO2야.'}]},
    {speaker:'박사님',text:'광합성으로 나오는 기체는?',choices:[{text:'산소(O2)요!',correct:true,reply:'맞아! 우리가 숨 쉬는 산소는 식물 덕분이야.'},{text:'이산화탄소(CO2)요?',correct:false,reply:'CO2는 재료야. 결과물은 산소(O2)란다.'}]}
  ]},
  {id:'history_joseon',title:'&#x1F3EF; 조선 시대 여행',cat:'한국사',scenes:[
    {speaker:'세종대왕',text:'나는 백성들이 글을 못 읽어 안타까워서 새 문자를 만들었노라. 이것의 이름은?',choices:[{text:'훈민정음이옵니다!',correct:true,reply:'그렇도다! 백성을 가르치는 바른 소리라는 뜻이니라.'},{text:'한문이옵니다?',correct:false,reply:'한문은 중국 글자이니라. 내가 만든 것은 훈민정음이로다.'}]},
    {speaker:'세종대왕',text:'훈민정음은 몇 년에 반포되었느냐?',choices:[{text:'1446년이옵니다!',correct:true,reply:'맞도다! 잘 알고 있구나.'},{text:'1392년이옵니다?',correct:false,reply:'1392년은 조선 건국 년도이니라. 훈민정음은 1446년이로다.'}]},
    {speaker:'장영실',text:'소인은 세종대왕님을 모시는 과학자입니다. 소인이 만든 물시계의 이름은?',choices:[{text:'자격루입니다!',correct:true,reply:'맞습니다! 스스로 때를 알려주는 물시계입니다.'},{text:'해시계입니다?',correct:false,reply:'해시계는 앙부일구입니다. 물시계는 자격루이지요.'}]}
  ]}
];

let storyState=null;

function startStory(storyId){
  const story=STORIES.find(s=>s.id===storyId);if(!story)return;
  storyState={story,sceneIdx:0,score:0,messages:[]};
  v4sfx('story');
  renderStory();
}

function renderStory(){
  const s=storyState;if(!s)return;
  let existing=_el('v4story');
  if(!existing){existing=document.createElement('div');existing.className='v4-story';existing.id='v4story';document.body.appendChild(existing);}
  const scene=s.story.scenes[s.sceneIdx];
  let h='<div class="v4-story-header"><h3>'+s.story.title+'</h3><span style="font-size:10px;color:var(--t3)">'+(s.sceneIdx+1)+'/'+s.story.scenes.length+'</span><button class="v4-story-close" onclick="v4CloseStory()">&#x2715;</button></div>';
  h+='<div class="v4-story-body" id="v4storyBody">';
  s.messages.forEach(m=>{h+='<div class="v4-story-msg '+(m.isUser?'user':'npc')+'"><div class="speaker">'+(m.speaker||'')+'</div>'+m.text+'</div>';});
  if(scene&&!s.waitingReply){
    s.messages.push({speaker:scene.speaker,text:scene.text,isUser:false});
    h+='<div class="v4-story-msg npc"><div class="speaker">'+scene.speaker+'</div>'+scene.text+'</div>';
  }
  h+='</div>';
  if(scene&&!s.waitingReply){
    h+='<div class="v4-story-choices">';
    scene.choices.forEach((c,i)=>{h+='<button class="v4-story-choice" onclick="v4StoryChoice('+i+')">'+c.text+'</button>';});
    h+='</div>';
  }
  existing.innerHTML=h;
  setTimeout(()=>{const body=_el('v4storyBody');if(body)body.scrollTop=body.scrollHeight;},50);
}

window.v4StoryChoice=function(idx){
  const s=storyState;if(!s)return;
  const scene=s.story.scenes[s.sceneIdx];
  const choice=scene.choices[idx];
  s.messages.push({speaker:'나',text:choice.text,isUser:true});
  s.messages.push({speaker:scene.speaker,text:choice.reply,isUser:false});
  if(choice.correct){s.score++;v4sfx('correct_chain');}
  s.sceneIdx++;
  if(s.sceneIdx>=s.story.scenes.length){
    const u=U();const xpGain=s.score*10;u.xp=(u.xp||0)+xpGain;
    if(!u.storiesCompleted)u.storiesCompleted=[];
    if(!u.storiesCompleted.includes(s.story.id))u.storiesCompleted.push(s.story.id);
    S(u);
    s.messages.push({speaker:'',text:'&#x1F389; 스토리 완료! '+s.score+'/'+s.story.scenes.length+' 정답 (+'+xpGain+' XP)',isUser:false});
    const el=_el('v4story');
    if(el){
      let h='<div class="v4-story-header"><h3>'+s.story.title+'</h3><button class="v4-story-close" onclick="v4CloseStory()">&#x2715;</button></div>';
      h+='<div class="v4-story-body">';
      s.messages.forEach(m=>{h+='<div class="v4-story-msg '+(m.isUser?'user':'npc')+'"><div class="speaker">'+(m.speaker||'')+'</div>'+m.text+'</div>';});
      h+='</div><div class="v4-story-choices"><button class="v4-story-choice" onclick="v4CloseStory()">완료</button></div>';
      el.innerHTML=h;
    }
    v4CheckBadges();
    return;
  }
  renderStory();
};

window.v4CloseStory=function(){const el=_el('v4story');if(el)el.remove();storyState=null;};
window.startStory=startStory;

// ===== 5. Badge System (30 badges) =====
const BADGES=[
  {id:'first_login',nm:'첫 발걸음',ic:'&#x1F463;',desc:'첫 방문',check:u=>true},
  {id:'quiz_10',nm:'퀴즈 새싹',ic:'&#x1F331;',desc:'퀴즈 10개',check:u=>(u.quizTotal||0)>=10},
  {id:'quiz_50',nm:'퀴즈 나무',ic:'&#x1F333;',desc:'퀴즈 50개',check:u=>(u.quizTotal||0)>=50},
  {id:'quiz_100',nm:'퀴즈 숲',ic:'&#x1F332;',desc:'퀴즈 100개',check:u=>(u.quizTotal||0)>=100},
  {id:'quiz_500',nm:'퀴즈 거목',ic:'&#x1F334;',desc:'퀴즈 500개',check:u=>(u.quizTotal||0)>=500},
  {id:'perfect_5',nm:'연속 5정답',ic:'&#x2B50;',desc:'연속 5문제',check:u=>(u.maxConsecutiveCorrect||0)>=5},
  {id:'perfect_10',nm:'연속 10정답',ic:'&#x1F31F;',desc:'연속 10문제',check:u=>(u.maxConsecutiveCorrect||0)>=10},
  {id:'perfect_20',nm:'퀴즈 신',ic:'&#x1F4AB;',desc:'연속 20문제',check:u=>(u.maxConsecutiveCorrect||0)>=20},
  {id:'lv5',nm:'레벨 5',ic:'&#x1F396;',desc:'Lv.5 달성',check:u=>(u.level||1)>=5},
  {id:'lv10',nm:'레벨 10',ic:'&#x1F3C5;',desc:'Lv.10 달성',check:u=>(u.level||1)>=10},
  {id:'lv20',nm:'레벨 마스터',ic:'&#x1F3C6;',desc:'Lv.20 달성',check:u=>(u.level||1)>=20},
  {id:'streak_3',nm:'3일 연속',ic:'&#x1F525;',desc:'3일 스트릭',check:u=>(u.streakDays||0)>=3},
  {id:'streak_7',nm:'7일 연속',ic:'&#x1F525;',desc:'7일 스트릭',check:u=>(u.streakDays||0)>=7},
  {id:'streak_30',nm:'30일 열정',ic:'&#x1F308;',desc:'30일 스트릭',check:u=>(u.streakDays||0)>=30},
  {id:'mastery_1',nm:'첫 마스터',ic:'&#x1F3AF;',desc:'마스터리 1회',check:u=>(u.masteryCount||0)>=1},
  {id:'mastery_5',nm:'마스터 5회',ic:'&#x1F3AF;',desc:'마스터리 5회',check:u=>(u.masteryCount||0)>=5},
  {id:'mastery_10',nm:'마스터 장인',ic:'&#x1F451;',desc:'마스터리 10회',check:u=>(u.masteryCount||0)>=10},
  {id:'ta_first',nm:'첫 타임어택',ic:'&#x23F1;',desc:'타임어택 1회',check:u=>(u.taCount||0)>=1},
  {id:'ta_50',nm:'스피드 달인',ic:'&#x26A1;',desc:'50점 이상',check:u=>(u.taHighScore||0)>=50},
  {id:'ta_100',nm:'번개 천재',ic:'&#x1F4A5;',desc:'100점 이상',check:u=>(u.taHighScore||0)>=100},
  {id:'story_1',nm:'첫 스토리',ic:'&#x1F4D6;',desc:'스토리 1개',check:u=>(u.storiesCompleted||[]).length>=1},
  {id:'story_all',nm:'스토리 마스터',ic:'&#x1F4DA;',desc:'스토리 전체',check:u=>(u.storiesCompleted||[]).length>=STORIES.length},
  {id:'video_10',nm:'영상 탐험가',ic:'&#x1F4FA;',desc:'영상 10개',check:u=>(u.videosWatched||0)>=10},
  {id:'video_50',nm:'영상 수집가',ic:'&#x1F3AC;',desc:'영상 50개',check:u=>(u.videosWatched||0)>=50},
  {id:'game_5',nm:'게이머',ic:'&#x1F3AE;',desc:'게임 5회',check:u=>(u.gameCount||0)>=5},
  {id:'game_20',nm:'프로 게이머',ic:'&#x1F579;',desc:'게임 20회',check:u=>(u.gameCount||0)>=20},
  {id:'xp_1000',nm:'XP 천',ic:'&#x1F48E;',desc:'1000 XP',check:u=>(u.xp||0)>=1000},
  {id:'xp_5000',nm:'XP 오천',ic:'&#x1F48E;',desc:'5000 XP',check:u=>(u.xp||0)>=5000},
  {id:'pomo_5',nm:'집중러',ic:'&#x1F9D8;',desc:'뽀모도로 5회',check:u=>(u.pomoSessions||0)>=5},
  {id:'allround',nm:'올라운더',ic:'&#x1F30D;',desc:'5과목 학습',check:u=>{const s=u.masteryByCategory||{};return Object.keys(s).length>=5;}}
];

function v4CheckBadges(){
  const u=U();if(!u.v4badges)u.v4badges=[];
  let newBadge=null;
  BADGES.forEach(b=>{
    if(!u.v4badges.includes(b.id)&&b.check(u)){u.v4badges.push(b.id);newBadge=b;}
  });
  if(newBadge){
    S(u);v4sfx('badge');
    const t=document.getElementById('tst');
    if(t){t.innerHTML=newBadge.ic+' 배지 획득: '+newBadge.nm;t.classList.add('sh');setTimeout(()=>t.classList.remove('sh'),2500);}
  }else{S(u);}
}

function renderBadgeSection(){
  const u=U();const earned=u.v4badges||[];
  let h='<div style="margin-bottom:10px"><div class="sec">&#x1F3C5; 배지 컬렉션 ('+earned.length+'/'+BADGES.length+')</div>';
  h+='<div class="v4-badge-grid">';
  BADGES.forEach(b=>{
    const has=earned.includes(b.id);
    h+='<div class="v4-badge'+(has?' earned':'')+'" title="'+b.desc+'"><div class="badge-icon">'+b.ic+'</div><div class="badge-name">'+b.nm+'</div></div>';
  });
  h+='</div></div>';
  return h;
}

// ===== 6. Level Test =====
function startLevelTest(category){
  const pool=MASTERY_POOL.filter(q=>q.cat===category);
  if(pool.length<3)return;
  const sorted=[...pool].sort((a,b)=>a.lv-b.lv);
  const qs=sorted.slice(0,Math.min(5,sorted.length));
  masteryState={questions:qs,current:0,results:[],category:category,isLevelTest:true};
  const mo=_el('moB');
  if(mo){
    mo.innerHTML='<div style="text-align:center;padding:20px"><div style="font-size:48px;margin-bottom:8px">&#x1F4CA;</div><h3 style="font-size:16px;font-weight:800;margin-bottom:6px">'+category+' 레벨 테스트</h3><p style="font-size:12px;color:var(--t2);margin-bottom:16px">현재 실력을 진단합니다. '+qs.length+'문제</p><button class="bt bp" onclick="showMasteryUI()">시작</button></div>';
    const modal=_el('mo');if(modal)modal.classList.add('sh');
  }
}
window.startLevelTest=startLevelTest;
window.startMastery=startMastery;

// ===== 7. Listening Quiz (Web Speech API TTS) =====
function v4ListenQuiz(){
  if(!('speechSynthesis' in window)){
    const t=document.getElementById('tst');
    if(t){t.textContent='이 브라우저에서는 듣기 퀴즈를 지원하지 않습니다.';t.classList.add('sh');setTimeout(()=>t.classList.remove('sh'),2000);}
    return;
  }
  const listenPool=[
    {text:'사과 세 개와 바나나 두 개를 사면 총 몇 개일까요?',q:'답은?',a:['5개','3개','6개','2개'],c:0,cat:'수학'},
    {text:'지구에서 태양까지의 거리를 빛의 속도로 가면 약 8분이 걸립니다.',q:'빛의 속도로 태양까지 약 몇 분?',a:['8분','1분','30분','60분'],c:0,cat:'과학'},
    {text:'대한민국의 국화는 무궁화입니다.',q:'대한민국의 국화는?',a:['무궁화','장미','국화','진달래'],c:0,cat:'사회'},
    {text:'베토벤은 청력을 잃었지만 위대한 교향곡을 작곡했습니다.',q:'청력을 잃은 작곡가는?',a:['베토벤','모차르트','바흐','쇼팽'],c:0,cat:'음악'},
    {text:'물은 섭씨 100도에서 끓고, 섭씨 0도에서 얼음이 됩니다.',q:'물이 끓는 온도는?',a:['100도','0도','50도','200도'],c:0,cat:'과학'}
  ];
  const q=listenPool[Math.floor(Math.random()*listenPool.length)];
  const utter=new SpeechSynthesisUtterance(q.text);
  utter.lang='ko-KR';utter.rate=0.9;
  speechSynthesis.speak(utter);
  const opts=[...q.a].map((a,i)=>({t:a,ok:i===q.c}));
  for(let i=opts.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[opts[i],opts[j]]=[opts[j],opts[i]];}
  const mo=_el('moB');
  if(mo){
    mo.innerHTML='<div style="text-align:center;padding:10px"><div style="font-size:36px;margin-bottom:8px">&#x1F3A7;</div><h3 style="font-size:15px;font-weight:700;margin-bottom:4px">듣기 퀴즈</h3><p style="font-size:11px;color:var(--t2);margin-bottom:12px">잘 들어보세요!</p>'+
      '<button class="v4-listen-btn" onclick="speechSynthesis.speak(new SpeechSynthesisUtterance(\''+q.text.replace(/'/g,'\\&#39;')+'\'));document.querySelector(\'.v4-listen-btn\').lastChild.textContent=\' 다시 듣기\'">&#x1F50A; 듣기</button>'+
      '<div style="font-size:13px;font-weight:600;margin:12px 0">'+q.q+'</div>'+
      '<div class="mq-opts">'+opts.map(o=>'<button class="mq-opt" onclick="v4ListenAnswer(this,'+o.ok+')">'+o.t+'</button>').join('')+'</div></div>';
    const modal=_el('mo');if(modal)modal.classList.add('sh');
  }
}
window.v4ListenQuiz=v4ListenQuiz;

window.v4ListenAnswer=function(btn,ok){
  if(btn.dataset.done)return;btn.dataset.done='1';
  btn.classList.add(ok?'correct':'wrong');
  if(ok){v4sfx('correct_chain');const u=U();u.xp=(u.xp||0)+8;u.quizTotal=(u.quizTotal||0)+1;u.quizCorrect=(u.quizCorrect||0)+1;S(u);}
  else{const u=U();u.quizTotal=(u.quizTotal||0)+1;S(u);}
  if(!ok){const corr=btn.parentElement.querySelector('[onclick*="true"]');if(corr)corr.classList.add('correct');}
};

// ===== 8. Daily Progress Ring =====
function renderProgressRing(){
  const u=U();const dailyXP=u.dailyXP||0;const goal=u.xpGoal||100;
  const pct=Math.min(dailyXP/goal,1);const r=22;const c=2*Math.PI*r;const offset=c*(1-pct);
  const el=document.createElement('div');el.className='v4-progress-ring';el.id='v4ring';
  el.innerHTML='<svg width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="'+r+'" fill="none" stroke="rgba(139,92,246,.1)" stroke-width="4"/>'+
    '<circle cx="28" cy="28" r="'+r+'" fill="none" stroke="url(#v4rg)" stroke-width="4" stroke-dasharray="'+c+'" stroke-dashoffset="'+offset+'" stroke-linecap="round"/>'+
    '<defs><linearGradient id="v4rg"><stop offset="0%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#06d6a0"/></linearGradient></defs>'+
    '<text x="28" y="28" text-anchor="middle" dominant-baseline="central" transform="rotate(90 28 28)">'+Math.round(pct*100)+'%</text></svg>';
  el.title='오늘 XP: '+dailyXP+'/'+goal;
  const existing=_el('v4ring');if(existing)existing.remove();
  document.body.appendChild(el);
}

// ===== 9. New Quiz Content (40 questions for thin subjects) =====
const NEW_QUIZZES=[
  {q:'삼권분립에서 3권이 아닌 것은?',a:['언론권','입법권','사법권','행정권'],c:0,cat:'사회'},
  {q:'지구의 위성은?',a:['달','화성','금성','태양'],c:0,cat:'과학'},
  {q:'광개토대왕릉비가 있는 나라는?',a:['중국','한국','일본','몽골'],c:0,cat:'한국사'},
  {q:'조선의 신분 제도에서 가장 높은 신분은?',a:['양반','중인','상민','천민'],c:0,cat:'한국사'},
  {q:'3.1 운동이 일어난 해는?',a:['1919년','1910년','1945년','1920년'],c:0,cat:'한국사'},
  {q:'볼링 핀의 개수는?',a:['10개','8개','12개','9개'],c:0,cat:'체육'},
  {q:'농구 한 팀의 코트 위 선수 수는?',a:['5명','6명','7명','4명'],c:0,cat:'체육'},
  {q:'배구 한 팀의 선수 수는?',a:['6명','5명','7명','8명'],c:0,cat:'체육'},
  {q:'100m 세계 기록 보유자는?',a:['우사인 볼트','칼 루이스','타이슨 게이','저스틴 개틀린'],c:0,cat:'체육'},
  {q:'반 고흐의 유명한 작품은?',a:['별이 빛나는 밤','모나리자','천지창조','게르니카'],c:0,cat:'미술'},
  {q:'원근법을 최초로 사용한 시대는?',a:['르네상스','고대 이집트','중세','현대'],c:0,cat:'미술'},
  {q:'수채화의 특징이 아닌 것은?',a:['불투명함','투명함','물로 희석','종이 사용'],c:0,cat:'미술'},
  {q:'do, re, mi, fa, sol, la, si 중 5번째 음은?',a:['솔(G)','파(F)','라(A)','미(E)'],c:0,cat:'음악'},
  {q:'피아노의 흑건은 한 옥타브에 몇 개?',a:['5개','7개','4개','6개'],c:0,cat:'음악'},
  {q:'오케스트라의 지휘자가 사용하는 막대 이름은?',a:['바톤','스틱','로드','완드'],c:0,cat:'음악'},
  {q:'if문은 어떤 프로그래밍 개념?',a:['조건문','반복문','변수','함수'],c:0,cat:'코딩'},
  {q:'배열의 첫 번째 인덱스는?',a:['0','1','-1','없음'],c:0,cat:'코딩'},
  {q:'Git에서 변경사항을 저장하는 명령어는?',a:['commit','push','pull','fetch'],c:0,cat:'코딩'},
  {q:'횡단보도를 건널 때 올바른 행동은?',a:['좌우를 살핀다','뛰어간다','핸드폰을 본다','신호 무시'],c:0,cat:'안전'},
  {q:'소화기 사용 순서의 첫 단계는?',a:['안전핀 뽑기','손잡이 누르기','노즐 조준','흔들기'],c:0,cat:'안전'},
  {q:'I am a student에서 be동사는?',a:['am','a','student','I'],c:0,cat:'영어'},
  {q:'stop의 과거분사형은?',a:['stopped','stoped','stops','stoping'],c:0,cat:'영어'},
  {q:'Thank you 의 대답으로 적절한 것은?',a:['You are welcome','I am sorry','Hello','Goodbye'],c:0,cat:'영어'},
  {q:'받침이 있는 한글 글자는?',a:['감','가','나','다'],c:0,cat:'한글국어'},
  {q:'높임말이 아닌 것은?',a:['밥 먹어','진지 드세요','주무세요','계세요'],c:0,cat:'한글국어'},
  {q:'인플레이션의 뜻은?',a:['물가 상승','경제 성장','금리 하락','환율 변동'],c:0,cat:'경제'},
  {q:'은행의 가장 기본적인 기능은?',a:['예금과 대출','보험','주식 매매','환전'],c:0,cat:'경제'},
  {q:'뉴턴의 운동 제1법칙은?',a:['관성의 법칙','가속도의 법칙','작용반작용','만유인력'],c:0,cat:'과학'},
  {q:'화학식 H2O에서 H의 개수는?',a:['2개','1개','3개','0개'],c:0,cat:'과학'},
  {q:'공감의 반대되는 태도는?',a:['무관심','동정','이해','경청'],c:0,cat:'인성감성'},
  {q:'갈등 해결의 첫 단계는?',a:['진정하기','소리지르기','무시하기','도망가기'],c:0,cat:'인성감성'},
  {q:'좋은 습관을 만드는 데 보통 걸리는 기간은?',a:['21일','3일','1년','100일'],c:0,cat:'인성감성'},
  {q:'팀워크에서 중요한 것이 아닌 것은?',a:['혼자 다 하기','역할 분담','의사소통','서로 존중'],c:0,cat:'인성감성'},
  {q:'우리 몸에서 가장 큰 뼈는?',a:['넓적다리뼈','갈비뼈','두개골','척추'],c:0,cat:'건강'},
  {q:'하루 권장 수면 시간(어린이)은?',a:['9~11시간','6시간','12시간 이상','5시간'],c:0,cat:'건강'},
  {q:'올바른 양치 시간은?',a:['3분 이상','30초','10초','1분'],c:0,cat:'건강'},
  {q:'태양계에서 가장 큰 행성은?',a:['목성','토성','지구','해왕성'],c:0,cat:'과학'},
  {q:'식물에서 물을 흡수하는 부분은?',a:['뿌리','잎','줄기','꽃'],c:0,cat:'과학'},
  {q:'삼국시대 가야를 정복한 나라는?',a:['신라','백제','고구려','당나라'],c:0,cat:'한국사'},
  {q:'병인양요가 일어난 원인은?',a:['천주교 박해','무역 분쟁','영토 분쟁','조공 문제'],c:0,cat:'한국사'}
];

// ===== Inject into Home Page =====
function v4InjectHome(){
  const p0=_el('p0');if(!p0)return;
  const today=new Date();v4CalYear=today.getFullYear();v4CalMonth=today.getMonth();

  // Record study activity
  recordStudyDay();

  // Find insertion point (before footer)
  const footer=p0.querySelector('[style*="margin-top:24px"]');if(!footer)return;

  // Mastery Challenge Card
  const masteryCard=document.createElement('div');
  masteryCard.innerHTML='<div class="sec">&#x1F3AF; 마스터리 챌린지</div>'+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px">'+
    '<div class="gc" onclick="startMastery(\'수학\')"><div class="gi">&#x1F522;</div><div class="gn">수학</div></div>'+
    '<div class="gc" onclick="startMastery(\'과학\')"><div class="gi">&#x1F52C;</div><div class="gn">과학</div></div>'+
    '<div class="gc" onclick="startMastery(\'한국사\')"><div class="gi">&#x1F1F0;&#x1F1F7;</div><div class="gn">한국사</div></div>'+
    '<div class="gc" onclick="startMastery(\'코딩\')"><div class="gi">&#x1F4BB;</div><div class="gn">코딩</div></div>'+
    '<div class="gc" onclick="startMastery(\'음악\')"><div class="gi">&#x1F3B5;</div><div class="gn">음악</div></div>'+
    '<div class="gc" onclick="startMastery(\'\')" style="background:linear-gradient(135deg,rgba(251,191,36,.08),rgba(139,92,246,.05));border-color:rgba(251,191,36,.15)"><div class="gi">&#x1F30D;</div><div class="gn">전체 랜덤</div></div></div>';
  footer.parentNode.insertBefore(masteryCard,footer);

  // Time Attack
  const taCard=document.createElement('div');
  taCard.innerHTML='<div class="sec">&#x23F1; 타임어택</div>'+
    '<div class="gc" onclick="startTimeAttack()" style="background:linear-gradient(135deg,rgba(239,68,68,.08),rgba(251,191,36,.05));border-color:rgba(239,68,68,.12);text-align:left;display:flex;align-items:center;gap:12px;padding:14px">'+
    '<div style="font-size:32px">&#x26A1;</div><div><div style="font-size:14px;font-weight:700">60초 스피드 퀴즈!</div>'+
    '<div style="font-size:10px;color:var(--t3)">제한시간 안에 최대한 많이 풀기 | 최고기록: '+(U().taHighScore||0)+'점</div></div></div>';
  footer.parentNode.insertBefore(taCard,footer);

  // Learning Stories
  const storyCard=document.createElement('div');
  storyCard.innerHTML='<div class="sec">&#x1F4D6; 학습 스토리</div>'+
    '<div style="display:grid;grid-template-columns:1fr;gap:6px">'+
    STORIES.map(s=>{
      const done=(U().storiesCompleted||[]).includes(s.id);
      return '<div class="gc" onclick="startStory(\''+s.id+'\')" style="text-align:left;display:flex;align-items:center;gap:10px;padding:12px">'+
        '<div style="font-size:24px">'+s.title.split(' ')[0]+'</div><div style="flex:1"><div style="font-size:12px;font-weight:600">'+s.title+'</div>'+
        '<div style="font-size:9px;color:var(--t3)">'+s.cat+(done?' &#x2705; 완료':'')+'</div></div></div>';
    }).join('')+'</div>';
  footer.parentNode.insertBefore(storyCard,footer);

  // Listening Quiz
  const listenCard=document.createElement('div');
  listenCard.innerHTML='<div class="sec">&#x1F3A7; 듣기 퀴즈</div>'+
    '<div class="gc" onclick="v4ListenQuiz()" style="text-align:left;display:flex;align-items:center;gap:12px;padding:14px">'+
    '<div style="font-size:28px">&#x1F50A;</div><div><div style="font-size:13px;font-weight:700">듣고 맞히기</div>'+
    '<div style="font-size:10px;color:var(--t3)">음성을 듣고 문제를 풀어보세요</div></div></div>';
  footer.parentNode.insertBefore(listenCard,footer);

  // Calendar
  const calDiv=document.createElement('div');calDiv.id='v4CalArea';
  const calSec=document.createElement('div');
  calSec.innerHTML='<div class="sec">&#x1F4C5; 학습 달력</div>';
  footer.parentNode.insertBefore(calSec,footer);
  calDiv.innerHTML=renderCalendar(v4CalYear,v4CalMonth);
  footer.parentNode.insertBefore(calDiv,footer);

  // Level Test
  const lvCard=document.createElement('div');
  lvCard.innerHTML='<div class="sec">&#x1F4CA; 레벨 테스트</div>'+
    '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">'+
    ['수학','과학','한국사','코딩','영어','음악'].map(c=>
      '<div class="gc" onclick="startLevelTest(\''+c+'\')" style="padding:10px"><div class="gi" style="font-size:20px">&#x1F4CA;</div><div class="gn" style="font-size:10px">'+c+'</div></div>'
    ).join('')+'</div>';
  footer.parentNode.insertBefore(lvCard,footer);

  // Progress Ring
  renderProgressRing();
}

// ===== Inject into Profile Page =====
function v4InjectProfile(){
  const p4=_el('p4');if(!p4)return;
  const existing=p4.querySelector('.v4-badge-section');if(existing)return;
  const target=p4.querySelector('[style*="background:var(--c1)"]');
  if(target){
    const badgeDiv=document.createElement('div');badgeDiv.className='v4-badge-section';
    badgeDiv.innerHTML=renderBadgeSection();
    target.parentNode.insertBefore(badgeDiv,target.nextSibling);
  }
}

// ===== Hook into existing chkA for tracking =====
const origChkA=window.chkA;
if(typeof origChkA==='function'){
  window.chkA=function(btn,ok){
    origChkA.call(this,btn,ok);
    recordStudyDay();
    v4CheckBadges();
  };
}

// ===== Keyboard Shortcuts =====
document.addEventListener('keydown',function(e){
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
  if(e.key==='m'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();startMastery('');}
  if(e.key==='a'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();startTimeAttack();}
  if(e.key==='l'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();v4ListenQuiz();}
});

// ===== Push new quizzes =====
if(window.QUIZ&&Array.isArray(window.QUIZ)){
  NEW_QUIZZES.forEach(q=>window.QUIZ.push(q));
}
MASTERY_POOL.forEach(q=>{
  if(window.QUIZ&&Array.isArray(window.QUIZ)){
    if(!window.QUIZ.find(x=>x.q===q.q))window.QUIZ.push(q);
  }
});

// ===== Init =====
function v4Init(){
  v4InjectHome();
  v4InjectProfile();
  v4CheckBadges();
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',v4Init);
else setTimeout(v4Init,100);
})();
