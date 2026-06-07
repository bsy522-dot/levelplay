// LevelPlay v7.0 Patch - Streak Milestones + Wrong Notes Retry + Post-Video Quiz
// + Onboarding Goals + Accessibility + Mobile UX + Skill Gating + Parent Card
// + Adaptive SM-2 Re-queue + Community League + 50 Quizzes + 12 Badges + SFX 10 + KB 8
(function(){
'use strict';

// ===== Helpers =====
function _el(id){return document.getElementById(id);}
function U(){try{return JSON.parse(localStorage.getItem('lp_user'))||{};}catch(e){return {};}}
function S(u){localStorage.setItem('lp_user',JSON.stringify(u));}

// ===== CSS Injection =====
const css=document.createElement('style');
css.textContent=`
/* v7 Streak Milestone */
.v7-confetti-wrap{position:fixed;inset:0;z-index:9999;pointer-events:none;overflow:hidden}
.v7-confetti{position:absolute;width:10px;height:10px;border-radius:2px;animation:v7fall linear forwards}
@keyframes v7fall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(100vh) rotate(720deg);opacity:0}}
.v7-milestone-toast{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10000;background:linear-gradient(135deg,#0a0a2e,#1a1a4a);border:2px solid var(--gd,#fbbf24);border-radius:20px;padding:30px 40px;text-align:center;animation:v7pop .4s ease;box-shadow:0 0 60px rgba(251,191,36,.3)}
@keyframes v7pop{0%{transform:translate(-50%,-50%) scale(0);opacity:0}50%{transform:translate(-50%,-50%) scale(1.1)}100%{transform:translate(-50%,-50%) scale(1);opacity:1}}
.v7-milestone-days{font-size:48px;font-weight:900;background:var(--g1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:8px 0}
.v7-milestone-label{font-size:14px;color:var(--t2);margin-bottom:12px}
.v7-milestone-close{padding:8px 20px;border-radius:8px;border:1px solid rgba(251,191,36,.3);background:rgba(251,191,36,.1);color:var(--gd);font:12px inherit;font-weight:700;cursor:pointer}
/* v7 Streak Repair */
.v7-repair{background:linear-gradient(135deg,rgba(239,68,68,.08),rgba(251,191,36,.06));border:1.5px solid rgba(239,68,68,.2);border-radius:12px;padding:12px;margin:8px 0;display:flex;align-items:center;gap:10px}
.v7-repair-btn{padding:6px 14px;border-radius:8px;border:1px solid rgba(251,191,36,.3);background:rgba(251,191,36,.08);color:var(--gd);font:11px inherit;font-weight:700;cursor:pointer;white-space:nowrap}
.v7-repair-btn:hover{border-color:var(--gd);background:rgba(251,191,36,.15)}
/* v7 Wrong Notes Enhanced */
.v7-wrong-wrap{background:var(--c1);border:1px solid rgba(239,68,68,.12);border-radius:12px;padding:14px;margin-bottom:10px}
.v7-wrong-group{margin-bottom:10px}
.v7-wrong-subj{font-size:12px;font-weight:700;margin-bottom:6px;display:flex;align-items:center;gap:5px}
.v7-wrong-subj .badge{font-size:9px;background:rgba(239,68,68,.15);color:var(--rd);padding:2px 6px;border-radius:4px}
.v7-wrong-item{background:var(--c2);border:1px solid rgba(139,92,246,.08);border-radius:8px;padding:10px;margin-bottom:6px;font-size:12px}
.v7-wrong-q{font-weight:600;margin-bottom:4px}
.v7-wrong-ans{font-size:11px;color:var(--t3)}
.v7-wrong-ans .correct{color:var(--gn)}
.v7-wrong-ans .wrong{color:var(--rd);text-decoration:line-through}
.v7-wrong-explain{font-size:10px;color:var(--cy);margin-top:4px;font-style:italic}
.v7-retry-btn{margin-top:6px;padding:4px 10px;border-radius:6px;border:1px solid rgba(6,214,160,.2);background:rgba(6,214,160,.06);color:var(--cy);font:10px inherit;font-weight:600;cursor:pointer}
.v7-retry-btn:hover{border-color:var(--cy)}
/* v7 Post-Video Quiz */
.v7-vidquiz-overlay{position:fixed;inset:0;z-index:9400;background:rgba(0,0,0,.88);display:flex;align-items:center;justify-content:center;padding:16px;animation:v6FadeIn .3s}
.v7-vidquiz{background:var(--c1);border:1.5px solid rgba(139,92,246,.2);border-radius:16px;padding:24px;max-width:420px;width:100%}
.v7-vidquiz h3{font-size:15px;margin-bottom:14px;text-align:center}
.v7-vidquiz .vq-q{font-size:13px;font-weight:600;margin-bottom:10px}
.v7-vidquiz .vq-opts button{display:block;width:100%;padding:10px 12px;margin-bottom:6px;border-radius:8px;border:1px solid rgba(139,92,246,.12);background:var(--c2);color:var(--tx);font:12px inherit;cursor:pointer;text-align:left;min-height:44px}
.v7-vidquiz .vq-opts button:hover{border-color:var(--cy)}
.v7-vidquiz .vq-opts button.v7-correct{border-color:var(--gn);background:rgba(34,197,94,.1);color:var(--gn)}
.v7-vidquiz .vq-opts button.v7-wrong{border-color:var(--rd);background:rgba(239,68,68,.1);color:var(--rd)}
/* v7 Onboarding Enhanced */
.v7-onboard{position:fixed;inset:0;z-index:9800;background:rgba(0,0,0,.95);display:flex;align-items:center;justify-content:center;padding:16px}
.v7-onboard-card{background:var(--c1);border:1.5px solid rgba(139,92,246,.2);border-radius:20px;padding:28px;max-width:400px;width:100%;text-align:center}
.v7-onboard-step{font-size:10px;color:var(--t3);margin-bottom:6px}
.v7-onboard-title{font-size:18px;font-weight:800;margin-bottom:14px}
.v7-subj-pick{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}
.v7-subj-pick button{padding:10px 6px;border-radius:10px;border:1.5px solid rgba(139,92,246,.12);background:var(--c2);color:var(--tx);font:11px inherit;font-weight:600;cursor:pointer;transition:.15s}
.v7-subj-pick button.selected{border-color:var(--cy);background:rgba(6,214,160,.1);color:var(--cy)}
.v7-subj-pick button .sp-icon{font-size:22px;display:block;margin-bottom:4px}
.v7-onboard-next{margin-top:14px;padding:10px 24px;border-radius:10px;border:none;background:var(--g1);color:#fff;font:13px inherit;font-weight:700;cursor:pointer}
.v7-onboard-next:disabled{opacity:.4;cursor:default}
/* v7 Accessibility */
html.v7-hc{--bg:#000;--c1:#0a0a0a;--c2:#141414;--p:#a78bfa;--cy:#34d399;--gd:#fcd34d;--rd:#f87171;--gn:#4ade80;--tx:#f1f5f9;--t2:#cbd5e1;--t3:#94a3b8}
html.v7-hc *{border-color:rgba(255,255,255,.2)!important}
html.v7-hc nav{background:rgba(0,0,0,.98)!important;border-top:2px solid #a78bfa!important}
html.v7-fs-125{font-size:17.5px!important}
html.v7-fs-150{font-size:21px!important}
/* v7 Mobile Fix */
@media(max-width:768px){
  .v7-vidquiz .vq-opts button{min-height:52px;font-size:13px;padding:12px 14px}
  .gc .gd,.gcard .gmeta,.subjc .spx{font-size:11px!important}
  .gc .gd{font-size:11px!important}
}
/* v7 Skill Gate */
.v7-lock{position:relative;opacity:.6;pointer-events:none}
.v7-lock::after{content:'🔒';position:absolute;top:8px;right:8px;font-size:16px}
.v7-lock-msg{font-size:9px;color:var(--rd);margin-top:4px;text-align:center}
/* v7 Parent Share Card */
.v7-share-wrap{background:linear-gradient(135deg,var(--c1),rgba(6,214,160,.04));border:1.5px solid rgba(6,214,160,.15);border-radius:12px;padding:14px;margin-bottom:10px}
.v7-share-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;border:1px solid rgba(6,214,160,.2);border-radius:8px;background:rgba(6,214,160,.06);color:var(--cy);font:11px inherit;font-weight:600;cursor:pointer;margin-top:8px}
.v7-share-btn:hover{border-color:var(--cy);transform:translateY(-1px)}
/* v7 League Humanized */
.v7-league-persona{font-size:9px;color:var(--t3);font-style:italic;margin-top:2px}
/* v7 Adaptive Badge */
.v7-weak-card{background:linear-gradient(135deg,rgba(239,68,68,.06),var(--c1));border:1px solid rgba(239,68,68,.12);border-radius:12px;padding:12px;margin-bottom:10px}
.v7-weak-title{font-size:12px;font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:5px}
.v7-weak-item{display:flex;align-items:center;gap:8px;padding:6px 0;font-size:11px;border-bottom:1px solid rgba(139,92,246,.06)}
.v7-weak-bar{flex:1;height:6px;background:var(--bg);border-radius:3px;overflow:hidden}
.v7-weak-fill{height:100%;border-radius:3px}
/* v7 Notes Section */
.v7-notes{background:var(--c1);border:1px solid rgba(139,92,246,.1);border-radius:12px;padding:14px;margin-bottom:10px}
.v7-notes textarea{width:100%;min-height:80px;background:var(--c2);border:1px solid rgba(139,92,246,.1);border-radius:8px;padding:10px;color:var(--tx);font:12px inherit;resize:vertical}
.v7-notes-save{margin-top:6px;padding:6px 14px;border-radius:6px;border:1px solid rgba(6,214,160,.2);background:rgba(6,214,160,.06);color:var(--cy);font:11px inherit;font-weight:600;cursor:pointer}
/* v7 Quick Actions */
.v7-qa{position:fixed;left:6px;top:50%;transform:translateY(-50%);z-index:900;display:flex;flex-direction:column;gap:5px}
.v7-qa button{width:36px;height:36px;border-radius:10px;border:1px solid rgba(139,92,246,.15);background:rgba(17,17,39,.95);color:var(--tx);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);transition:.15s}
.v7-qa button:hover{border-color:var(--cy);transform:scale(1.1)}
@media(max-width:480px){.v7-qa{display:none}}
`;
document.head.appendChild(css);

// ===== SFX Engine =====
let v7Ctx=null;
function v7sfx(type){
  try{
    if(!v7Ctx)v7Ctx=new(window.AudioContext||window.webkitAudioContext)();
    const o=v7Ctx.createOscillator(),g=v7Ctx.createGain(),t=v7Ctx.currentTime;
    o.connect(g);g.connect(v7Ctx.destination);
    switch(type){
      case'milestone':
        o.type='sine';
        o.frequency.setValueAtTime(523,t);o.frequency.setValueAtTime(659,t+.1);
        o.frequency.setValueAtTime(784,t+.2);o.frequency.setValueAtTime(1047,t+.3);
        o.frequency.setValueAtTime(1318,t+.4);o.frequency.setValueAtTime(1568,t+.5);
        g.gain.setValueAtTime(.15,t);g.gain.linearRampToValueAtTime(.001,t+.8);
        o.start(t);o.stop(t+.8);break;
      case'repair':
        o.type='triangle';
        o.frequency.setValueAtTime(440,t);o.frequency.setValueAtTime(554,t+.1);
        o.frequency.setValueAtTime(660,t+.2);
        g.gain.setValueAtTime(.08,t);g.gain.linearRampToValueAtTime(.001,t+.35);
        o.start(t);o.stop(t+.35);break;
      case'retry':
        o.type='square';
        o.frequency.setValueAtTime(330,t);o.frequency.setValueAtTime(440,t+.08);
        g.gain.setValueAtTime(.05,t);g.gain.linearRampToValueAtTime(.001,t+.2);
        o.start(t);o.stop(t+.2);break;
      case'vidquiz':
        o.type='sine';
        o.frequency.setValueAtTime(660,t);o.frequency.setValueAtTime(880,t+.1);
        o.frequency.setValueAtTime(1100,t+.2);
        g.gain.setValueAtTime(.1,t);g.gain.linearRampToValueAtTime(.001,t+.35);
        o.start(t);o.stop(t+.35);break;
      case'onboard':
        o.type='sine';
        o.frequency.setValueAtTime(523,t);o.frequency.setValueAtTime(784,t+.15);
        g.gain.setValueAtTime(.08,t);g.gain.linearRampToValueAtTime(.001,t+.3);
        o.start(t);o.stop(t+.3);break;
      case'access':
        o.type='triangle';
        o.frequency.setValueAtTime(660,t);o.frequency.setValueAtTime(880,t+.08);
        g.gain.setValueAtTime(.06,t);g.gain.linearRampToValueAtTime(.001,t+.2);
        o.start(t);o.stop(t+.2);break;
      case'share':
        o.type='sine';
        o.frequency.setValueAtTime(784,t);o.frequency.setValueAtTime(988,t+.08);
        o.frequency.setValueAtTime(1175,t+.16);
        g.gain.setValueAtTime(.1,t);g.gain.linearRampToValueAtTime(.001,t+.3);
        o.start(t);o.stop(t+.3);break;
      case'gate':
        o.type='sawtooth';
        o.frequency.setValueAtTime(220,t);o.frequency.setValueAtTime(165,t+.15);
        g.gain.setValueAtTime(.05,t);g.gain.linearRampToValueAtTime(.001,t+.3);
        o.start(t);o.stop(t+.3);break;
      case'weak':
        o.type='triangle';
        o.frequency.setValueAtTime(440,t);o.frequency.setValueAtTime(523,t+.1);
        g.gain.setValueAtTime(.06,t);g.gain.linearRampToValueAtTime(.001,t+.25);
        o.start(t);o.stop(t+.25);break;
      case'note_save':
        o.type='sine';
        o.frequency.setValueAtTime(880,t);o.frequency.setValueAtTime(1047,t+.06);
        g.gain.setValueAtTime(.06,t);g.gain.linearRampToValueAtTime(.001,t+.15);
        o.start(t);o.stop(t+.15);break;
    }
  }catch(e){}
}

// ===== 1. Streak Milestone Celebrations =====
const MILESTONES=[7,14,30,50,100,200,365];
const MILESTONE_MSGS={
  7:'1주일 연속 학습!',14:'2주 연속 달성!',30:'한 달의 기적!',
  50:'50일 학습 마라톤!',100:'100일 레전드!',200:'200일 마스터!',365:'1년 학습왕!'
};

function launchConfetti(){
  const wrap=document.createElement('div');
  wrap.className='v7-confetti-wrap';
  const colors=['#8b5cf6','#06d6a0','#fbbf24','#ef4444','#3b82f6','#ec4899','#f97316'];
  for(let i=0;i<60;i++){
    const c=document.createElement('div');
    c.className='v7-confetti';
    c.style.cssText='left:'+Math.random()*100+'%;top:-10px;background:'+colors[i%colors.length]+';width:'+(6+Math.random()*8)+'px;height:'+(6+Math.random()*8)+'px;animation-duration:'+(1.5+Math.random()*2)+'s;animation-delay:'+(Math.random()*.5)+'s;border-radius:'+(Math.random()>.5?'50%':'2px');
    wrap.appendChild(c);
  }
  document.body.appendChild(wrap);
  setTimeout(()=>wrap.remove(),4000);
}

function showMilestoneToast(days){
  v7sfx('milestone');
  launchConfetti();
  const div=document.createElement('div');
  div.innerHTML='<div class="v7-milestone-toast"><div style="font-size:40px;margin-bottom:6px">🏆</div><div class="v7-milestone-days">'+days+'일</div><div class="v7-milestone-label">'+(MILESTONE_MSGS[days]||days+'일 연속 학습 달성!')+'</div><button class="v7-milestone-close" onclick="this.closest(\'.v7-milestone-toast\').remove()">닫기</button></div>';
  document.body.appendChild(div.firstChild);
  const u=U();if(!u.v7milestones)u.v7milestones=[];
  if(!u.v7milestones.includes(days)){u.v7milestones.push(days);S(u);}
}

function checkStreakMilestone(){
  const u=U();
  const streak=u.streak||0;
  if(!u.v7milestones)u.v7milestones=[];
  for(const m of MILESTONES){
    if(streak>=m&&!u.v7milestones.includes(m)){
      setTimeout(()=>showMilestoneToast(m),1500);
      break;
    }
  }
}

// Streak Repair with Gems
function renderStreakRepair(){
  const u=U();
  const streak=u.streak||0;
  const gems=u.v6gems||u.gems||0;
  const lastStudy=u.lastStudyDate||'';
  const today=new Date().toISOString().slice(0,10);
  const yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
  if(lastStudy===today||lastStudy===yesterday||streak<3)return '';
  if(lastStudy&&streak>=3){
    return '<div class="v7-repair"><div style="flex:1"><div style="font-size:12px;font-weight:700;color:var(--rd)">🔥 스트릭이 끊겼어요!</div><div style="font-size:10px;color:var(--t3);margin-top:2px">'+streak+'일 연속 기록을 복구하세요 (50💎)</div></div>'+(gems>=50?'<button class="v7-repair-btn" onclick="v7RepairStreak()">💎50 복구</button>':'<div style="font-size:9px;color:var(--t3)">보석 부족</div>')+'</div>';
  }
  return '';
}

window.v7RepairStreak=function(){
  const u=U();
  const gems=u.v6gems||u.gems||0;
  if(gems<50)return;
  if(u.v6gems!==undefined)u.v6gems-=50;else u.gems=(u.gems||0)-50;
  u.lastStudyDate=new Date(Date.now()-86400000).toISOString().slice(0,10);
  S(u);
  v7sfx('repair');
  const t=_el('tst');
  if(t){t.textContent='🔧 스트릭 복구 완료! -50💎';t.classList.add('sh');setTimeout(()=>t.classList.remove('sh'),3000);}
  v7InjectHome();
};

// ===== 2. Wrong Notes Enhanced (Retry + Grouping + Explanations) =====
const QUIZ_EXPLANATIONS={
  '대한민국의 수도는?':'서울은 1394년 조선 태조 이래 한국의 수도입니다.',
  '태양계에서 가장 큰 행성은?':'목성은 태양계 최대 행성으로, 지름이 지구의 약 11배입니다.',
  '물의 화학식은?':'물(H₂O)은 수소 2개와 산소 1개로 구성됩니다.',
  '1+1=?':'기본 덧셈: 1과 1을 더하면 2가 됩니다.',
  'DNA는 무엇의 약자인가?':'Deoxyribonucleic Acid(디옥시리보핵산)의 약자입니다.',
  '빛의 속도는?':'빛은 진공에서 약 300,000km/s로 이동합니다.',
  '피타고라스 정리에서 빗변의 제곱은?':'직각삼각형에서 c²=a²+b² (두 직각변의 제곱의 합)입니다.'
};

function getWrongNotesBySubject(){
  const u=U();
  const notes=u.wrongNotes||[];
  const grouped={};
  const SUBJ_MAP={'수학':'📐','과학':'🔬','한국사':'📜','코딩':'💻','영어':'🔤','음악':'🎵','체육':'⚽','미술':'🎨','사회':'🌍','경제':'💰','건강':'🏥'};
  notes.forEach(n=>{
    const subj=n.subject||n.category||'기타';
    if(!grouped[subj])grouped[subj]=[];
    grouped[subj].push(n);
  });
  return {grouped,SUBJ_MAP};
}

function renderWrongNotesEnhanced(){
  const u=U();
  const notes=u.wrongNotes||[];
  if(!notes.length)return '';
  const {grouped,SUBJ_MAP}=getWrongNotesBySubject();
  let h='<div class="v7-wrong-wrap"><div class="sec">📝 오답노트 분석</div>';
  h+='<div style="font-size:10px;color:var(--t3);margin-bottom:10px">총 '+notes.length+'개 오답 | 과목별 분류 + 재시도</div>';
  const subjects=Object.keys(grouped).sort((a,b)=>grouped[b].length-grouped[a].length);
  subjects.forEach(subj=>{
    const items=grouped[subj];
    h+='<div class="v7-wrong-group"><div class="v7-wrong-subj">'+(SUBJ_MAP[subj]||'📋')+' '+subj+' <span class="badge">'+items.length+'개</span></div>';
    items.slice(0,3).forEach((item,idx)=>{
      const explain=QUIZ_EXPLANATIONS[item.question||item.q]||'';
      h+='<div class="v7-wrong-item"><div class="v7-wrong-q">'+(item.question||item.q||'문제')+'</div>';
      h+='<div class="v7-wrong-ans">내 답: <span class="wrong">'+(item.myAnswer||item.selected||'?')+'</span> → 정답: <span class="correct">'+(item.correctAnswer||item.correct||'?')+'</span></div>';
      if(explain)h+='<div class="v7-wrong-explain">💡 '+explain+'</div>';
      h+='<button class="v7-retry-btn" onclick="v7RetryQuestion('+notes.indexOf(item)+')">🔄 다시 풀기</button></div>';
    });
    if(items.length>3)h+='<div style="font-size:9px;color:var(--t3);padding:4px">... 외 '+(items.length-3)+'개</div>';
    h+='</div>';
  });
  h+='</div>';
  return h;
}

window.v7RetryQuestion=function(idx){
  const u=U();
  const notes=u.wrongNotes||[];
  const item=notes[idx];
  if(!item)return;
  v7sfx('retry');
  const allQ=window.QUIZ||[];
  const match=allQ.find(q=>q.q===(item.question||item.q));
  if(match){
    const overlay=document.createElement('div');
    overlay.className='v7-vidquiz-overlay';
    overlay.onclick=function(e){if(e.target===overlay)overlay.remove();};
    let h='<div class="v7-vidquiz"><h3>🔄 오답 재시도</h3>';
    h+='<div class="vq-q">'+match.q+'</div><div class="vq-opts">';
    match.a.forEach((opt,i)=>{
      h+='<button data-idx="'+i+'" data-correct="'+match.c+'">'+opt+'</button>';
    });
    h+='</div></div>';
    overlay.innerHTML=h;
    overlay.querySelectorAll('.vq-opts button').forEach(btn=>{
      btn.addEventListener('click',function(){
        const si=parseInt(this.dataset.idx);
        const ci=parseInt(this.dataset.correct);
        if(si===ci){
          this.classList.add('v7-correct');
          notes.splice(idx,1);u.wrongNotes=notes;S(u);
          setTimeout(()=>{overlay.remove();v7InjectHome();},800);
          const t=_el('tst');
          if(t){t.textContent='✅ 정답! 오답노트에서 제거됨';t.classList.add('sh');setTimeout(()=>t.classList.remove('sh'),3000);}
        }else{
          this.classList.add('v7-wrong');
          overlay.querySelectorAll('.vq-opts button')[ci].classList.add('v7-correct');
        }
        overlay.querySelectorAll('.vq-opts button').forEach(b=>b.style.pointerEvents='none');
      });
    });
    document.body.appendChild(overlay);
  }
};

// ===== 3. Post-Video Comprehension Quiz =====
function triggerPostVideoQuiz(lessonId){
  const allQ=window.QUIZ||[];
  if(allQ.length<2)return;
  const seed=lessonId?lessonId.split('').reduce((a,c)=>a+c.charCodeAt(0),0):Date.now();
  const q1=allQ[(seed*7)%allQ.length];
  const q2=allQ[(seed*13+3)%allQ.length];
  if(!q1||!q2||q1===q2)return;
  v7sfx('vidquiz');
  const overlay=document.createElement('div');
  overlay.className='v7-vidquiz-overlay';
  overlay.onclick=function(e){if(e.target===overlay)overlay.remove();};
  let score=0;let current=0;
  const qs=[q1,q2];
  function renderQ(idx){
    const q=qs[idx];
    let h='<div class="v7-vidquiz"><h3>📺 영상 이해도 체크 ('+(idx+1)+'/2)</h3>';
    h+='<div class="vq-q">'+q.q+'</div><div class="vq-opts">';
    q.a.forEach((opt,i)=>{
      h+='<button data-idx="'+i+'" data-correct="'+q.c+'">'+opt+'</button>';
    });
    h+='</div></div>';
    overlay.innerHTML=h;
    overlay.querySelectorAll('.vq-opts button').forEach(btn=>{
      btn.addEventListener('click',function(){
        const si=parseInt(this.dataset.idx);
        const ci=parseInt(this.dataset.correct);
        if(si===ci){this.classList.add('v7-correct');score++;}
        else{this.classList.add('v7-wrong');overlay.querySelectorAll('.vq-opts button')[ci].classList.add('v7-correct');}
        overlay.querySelectorAll('.vq-opts button').forEach(b=>b.style.pointerEvents='none');
        setTimeout(()=>{
          if(idx<1)renderQ(idx+1);
          else{
            overlay.innerHTML='<div class="v7-vidquiz" style="text-align:center"><h3>📺 이해도 결과</h3><div style="font-size:32px;font-weight:900;margin:14px 0">'+score+'/2</div><div style="font-size:12px;color:var(--t3);margin-bottom:14px">'+(score===2?'완벽한 이해! +30 XP':score===1?'좋아요! +15 XP':'다시 영상을 봐보세요')+'</div><button class="v7-milestone-close" onclick="this.closest(\'.v7-vidquiz-overlay\').remove()">닫기</button></div>';
            const u=U();u.xp=(u.xp||0)+score*15;S(u);
          }
        },1200);
      });
    });
  }
  renderQ(0);
  document.body.appendChild(overlay);
}

// Hook into video close
const origCloseVideo=window.cV;
if(typeof origCloseVideo==='function'){
  window.cV=function(){
    const u=U();
    const todayKey='v7vq-'+new Date().toISOString().slice(0,10);
    if(!u[todayKey]){
      u[todayKey]=true;S(u);
      setTimeout(()=>triggerPostVideoQuiz(u._lastLessonId||'default'),500);
    }
    origCloseVideo.apply(this,arguments);
  };
}

// ===== 4. Enhanced Onboarding with Goal Setting =====
function showV7Onboarding(){
  const u=U();
  if(u.v7onboarded)return;
  if(!u.nickname&&!u.onboarded)return;
  const SUBJECTS=[
    {id:'math',icon:'📐',name:'수학'},{id:'science',icon:'🔬',name:'과학'},
    {id:'history',icon:'📜',name:'한국사'},{id:'coding',icon:'💻',name:'코딩'},
    {id:'english',icon:'🔤',name:'영어'},{id:'music',icon:'🎵',name:'음악'},
    {id:'sports',icon:'⚽',name:'체육'},{id:'art',icon:'🎨',name:'미술'},
    {id:'social',icon:'🌍',name:'사회'},{id:'economy',icon:'💰',name:'경제'},
    {id:'health',icon:'🏥',name:'건강'}
  ];
  const overlay=document.createElement('div');
  overlay.className='v7-onboard';
  overlay.id='v7onboard';
  let selected=[];
  function render(){
    let h='<div class="v7-onboard-card"><div class="v7-onboard-step">2/3 단계</div>';
    h+='<div class="v7-onboard-title">관심 과목 TOP 3을 골라주세요!</div>';
    h+='<div style="font-size:11px;color:var(--t3);margin-bottom:8px">선택한 과목이 홈 상단에 표시됩니다</div>';
    h+='<div class="v7-subj-pick">';
    SUBJECTS.forEach(s=>{
      h+='<button onclick="v7ToggleSubj(\''+s.id+'\')" class="'+(selected.includes(s.id)?'selected':'')+'"><span class="sp-icon">'+s.icon+'</span>'+s.name+'</button>';
    });
    h+='</div><div style="font-size:10px;color:var(--cy);margin-bottom:8px">'+selected.length+'/3 선택</div>';
    h+='<button class="v7-onboard-next" onclick="v7FinishOnboard()" '+(selected.length<1?'disabled':'')+'>시작하기 →</button>';
    h+='<div style="font-size:9px;color:var(--t3);margin-top:8px;cursor:pointer" onclick="v7SkipOnboard()">건너뛰기</div>';
    h+='</div>';
    overlay.innerHTML=h;
  }
  window.v7ToggleSubj=function(id){
    if(selected.includes(id))selected=selected.filter(s=>s!==id);
    else if(selected.length<3)selected.push(id);
    render();
  };
  window.v7FinishOnboard=function(){
    v7sfx('onboard');
    const u=U();
    u.v7onboarded=true;
    u.v7topSubjects=selected;
    S(u);
    overlay.remove();
    v7InjectHome();
    const t=_el('tst');
    if(t){t.textContent='🎯 관심 과목이 설정되었습니다!';t.classList.add('sh');setTimeout(()=>t.classList.remove('sh'),3000);}
  };
  window.v7SkipOnboard=function(){
    const u=U();u.v7onboarded=true;S(u);
    overlay.remove();
  };
  render();
  document.body.appendChild(overlay);
}

// ===== 5. Accessibility: High Contrast + Font Scale =====
function renderAccessibilityPanel(){
  const u=U();
  const hc=u.v7highContrast||false;
  const fs=u.v7fontScale||'100';
  let h='<div style="margin-bottom:10px"><div class="sec">♿ 접근성 설정</div>';
  h+='<div style="display:flex;gap:8px;flex-wrap:wrap">';
  h+='<button onclick="v7ToggleHC()" style="padding:8px 14px;border-radius:8px;border:1px solid rgba(139,92,246,.15);background:'+(hc?'rgba(6,214,160,.15)':'var(--c2)')+';color:var(--tx);font:11px inherit;font-weight:600;cursor:pointer">'+(hc?'✅':'⬜')+' 고대비 모드</button>';
  h+='<button onclick="v7SetFontScale(\'100\')" style="padding:8px 14px;border-radius:8px;border:1px solid '+(fs==='100'?'var(--cy)':'rgba(139,92,246,.15)')+';background:var(--c2);color:var(--tx);font:11px inherit;cursor:pointer">가 1x</button>';
  h+='<button onclick="v7SetFontScale(\'125\')" style="padding:8px 14px;border-radius:8px;border:1px solid '+(fs==='125'?'var(--cy)':'rgba(139,92,246,.15)')+';background:var(--c2);color:var(--tx);font:11px inherit;cursor:pointer">가 1.25x</button>';
  h+='<button onclick="v7SetFontScale(\'150\')" style="padding:8px 14px;border-radius:8px;border:1px solid '+(fs==='150'?'var(--cy)':'rgba(139,92,246,.15)')+';background:var(--c2);color:var(--tx);font:11px inherit;cursor:pointer">가 1.5x</button>';
  h+='</div></div>';
  return h;
}

window.v7ToggleHC=function(){
  v7sfx('access');
  const u=U();u.v7highContrast=!u.v7highContrast;S(u);
  document.documentElement.classList.toggle('v7-hc',u.v7highContrast);
  v7InjectSettings();
};
window.v7SetFontScale=function(scale){
  v7sfx('access');
  const u=U();u.v7fontScale=scale;S(u);
  document.documentElement.classList.remove('v7-fs-125','v7-fs-150');
  if(scale==='125')document.documentElement.classList.add('v7-fs-125');
  if(scale==='150')document.documentElement.classList.add('v7-fs-150');
  v7InjectSettings();
};

// ===== 6. Skill Tree Gating =====
function checkSubjectMastery(subjectId){
  const u=U();
  const masteryScores=u.masteryScores||{};
  return (masteryScores[subjectId]||0)>=80;
}

// ===== 7. Parent Share Card =====
function generateParentCard(){
  v7sfx('share');
  const u=U();
  const canvas=document.createElement('canvas');
  canvas.width=600;canvas.height=380;
  const ctx=canvas.getContext('2d');
  const grad=ctx.createLinearGradient(0,0,600,380);
  grad.addColorStop(0,'#0a0a2e');grad.addColorStop(1,'#111140');
  ctx.fillStyle=grad;
  if(ctx.roundRect){ctx.beginPath();ctx.roundRect(0,0,600,380,16);ctx.fill();}
  else ctx.fillRect(0,0,600,380);
  ctx.strokeStyle='rgba(6,214,160,.3)';ctx.lineWidth=2;
  if(ctx.roundRect){ctx.beginPath();ctx.roundRect(8,8,584,364,12);ctx.stroke();}
  ctx.font='bold 22px sans-serif';ctx.fillStyle='#06d6a0';ctx.textAlign='center';
  ctx.fillText('📊 주간 학습 리포트',300,45);
  ctx.font='bold 14px sans-serif';ctx.fillStyle='#e2e8f0';
  ctx.fillText((u.nickname||'학생')+'님의 학습 현황',300,72);
  const date=new Date();ctx.font='11px sans-serif';ctx.fillStyle='#94a3b8';
  ctx.fillText(date.getFullYear()+'년 '+(date.getMonth()+1)+'월 '+date.getDate()+'일 기준',300,92);
  const stats=[
    {label:'총 XP',value:(u.xp||0).toLocaleString(),icon:'⚡'},
    {label:'레벨',value:'Lv.'+(u.level||1),icon:'📈'},
    {label:'연속 학습',value:(u.streak||0)+'일',icon:'🔥'},
    {label:'퀴즈 정답',value:Math.round(((u.quizCorrect||0)/Math.max(u.quizTotal||1,1))*100)+'%',icon:'✅'},
    {label:'배지',value:((u.badges||[]).length+(u.v4badges||[]).length+(u.v5badges||[]).length+(u.v6badges||[]).length+(u.v7badges||[]).length)+'개',icon:'🏅'},
    {label:'보석',value:(u.v6gems||u.gems||0)+'개',icon:'💎'}
  ];
  stats.forEach((s,i)=>{
    const x=40+(i%3)*185;const y=115+Math.floor(i/3)*110;
    ctx.fillStyle='rgba(139,92,246,.08)';
    if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,170,90,10);ctx.fill();}
    else{ctx.fillRect(x,y,170,90);}
    ctx.font='24px sans-serif';ctx.fillStyle='#e2e8f0';ctx.textAlign='center';
    ctx.fillText(s.icon,x+85,y+30);
    ctx.font='bold 20px sans-serif';ctx.fillStyle='#06d6a0';
    ctx.fillText(s.value,x+85,y+58);
    ctx.font='11px sans-serif';ctx.fillStyle='#94a3b8';
    ctx.fillText(s.label,x+85,y+78);
  });
  ctx.font='9px sans-serif';ctx.fillStyle='#64748b';ctx.textAlign='center';
  ctx.fillText('LevelPlay v7.0 | levelplay.vercel.app',300,370);
  const overlay=document.createElement('div');
  overlay.className='v7-vidquiz-overlay';
  overlay.onclick=function(e){if(e.target===overlay)overlay.remove();};
  overlay.innerHTML='<div style="text-align:center"><canvas id="v7shareCanvas"></canvas><div style="display:flex;gap:8px;justify-content:center;margin-top:12px"><button class="v7-milestone-close" onclick="v7DownloadCard()">📥 다운로드</button><button class="v7-milestone-close" onclick="v7CopyCard()">📋 복사</button><button class="v7-milestone-close" onclick="this.closest(\'.v7-vidquiz-overlay\').remove()">닫기</button></div></div>';
  document.body.appendChild(overlay);
  const target=overlay.querySelector('#v7shareCanvas');
  target.width=600;target.height=380;
  target.getContext('2d').drawImage(canvas,0,0);
  target.style.maxWidth='100%';target.style.borderRadius='12px';
  window._v7ShareCanvas=canvas;
}

window.v7DownloadCard=function(){
  if(!window._v7ShareCanvas)return;
  const a=document.createElement('a');
  a.download='LevelPlay_Report_'+new Date().toISOString().slice(0,10)+'.png';
  a.href=window._v7ShareCanvas.toDataURL('image/png');
  a.click();
};
window.v7CopyCard=function(){
  if(!window._v7ShareCanvas)return;
  window._v7ShareCanvas.toBlob(blob=>{
    if(blob&&navigator.clipboard&&window.ClipboardItem){
      navigator.clipboard.write([new ClipboardItem({'image/png':blob})]).then(()=>{
        const t=_el('tst');
        if(t){t.textContent='📋 클립보드에 복사됨!';t.classList.add('sh');setTimeout(()=>t.classList.remove('sh'),3000);}
      });
    }
  });
};

function renderShareSection(){
  return '<div class="v7-share-wrap"><div class="sec">👨‍👩‍👧 학부모 공유 카드</div><div style="font-size:11px;color:var(--t3)">주간 학습 현황을 이미지로 만들어 부모님께 보여드리세요!</div><button class="v7-share-btn" onclick="generateParentCard()">📊 학습 리포트 생성</button></div>';
}

// ===== 8. Adaptive SM-2 Re-queue (Weak Spots) =====
function getWeakSpots(){
  const u=U();
  const notes=u.wrongNotes||[];
  const subjectCount={};
  notes.forEach(n=>{
    const s=n.subject||n.category||'기타';
    subjectCount[s]=(subjectCount[s]||0)+1;
  });
  return Object.entries(subjectCount).sort((a,b)=>b[1]-a[1]).slice(0,5);
}

function renderWeakSpots(){
  const spots=getWeakSpots();
  if(!spots.length)return '';
  const maxCount=spots[0][1];
  const colors=['#ef4444','#f97316','#fbbf24','#06d6a0','#3b82f6'];
  let h='<div class="v7-weak-card"><div class="v7-weak-title">🎯 이번 주 약점 분석</div>';
  spots.forEach(([subj,count],i)=>{
    const pct=Math.round((count/maxCount)*100);
    h+='<div class="v7-weak-item"><span style="min-width:50px">'+subj+'</span><div class="v7-weak-bar"><div class="v7-weak-fill" style="width:'+pct+'%;background:'+colors[i%colors.length]+'"></div></div><span style="min-width:30px;text-align:right;color:'+colors[i%colors.length]+'">'+count+'개</span></div>';
  });
  h+='<div style="font-size:9px;color:var(--t3);margin-top:8px">💡 오답이 많은 과목을 집중 학습하세요!</div></div>';
  return h;
}

// ===== 9. Lesson Notes =====
function renderNotesSection(){
  const u=U();
  const lastLesson=u._lastLessonId||'';
  const notes=u.v7notes||{};
  const noteText=notes[lastLesson]||'';
  if(!lastLesson)return '';
  return '<div class="v7-notes"><div class="sec">📒 학습 노트</div><div style="font-size:10px;color:var(--t3);margin-bottom:6px">마지막 학습: '+lastLesson+'</div><textarea id="v7noteArea" placeholder="배운 내용을 메모하세요...">'+noteText.replace(/</g,'&lt;')+'</textarea><button class="v7-notes-save" onclick="v7SaveNote()">💾 저장</button></div>';
}

window.v7SaveNote=function(){
  const area=_el('v7noteArea');
  if(!area)return;
  v7sfx('note_save');
  const u=U();
  if(!u.v7notes)u.v7notes={};
  u.v7notes[u._lastLessonId||'default']=area.value;
  S(u);
  const t=_el('tst');
  if(t){t.textContent='📒 노트가 저장되었습니다!';t.classList.add('sh');setTimeout(()=>t.classList.remove('sh'),3000);}
};

// ===== 10. Community League Humanization =====
const LEAGUE_PERSONAS=[
  {name:'MinJi_Kim',habit:'매일 아침 7시에 학습하는 조기학습러',style:'꾸준한 노력형'},
  {name:'JunHo_Park',habit:'주말 집중형! 토일에 XP 폭발',style:'주말 전사'},
  {name:'SeoYeon_Lee',habit:'과학 전문가, 실험 게임을 사랑하는',style:'탐구형 학습자'},
  {name:'DongHyun_Choi',habit:'한국사 마니아, 연표를 꿰뚫는',style:'역사 전문가'},
  {name:'YuNa_Han',habit:'영어 스피킹 연습을 게을리하지 않는',style:'글로벌 학습자'},
  {name:'TaeMin_Shin',habit:'코딩 문제를 매일 3개씩 푸는',style:'개발자 지망생'},
  {name:'HaEun_Jung',habit:'음악과 미술을 균형있게 공부하는',style:'예술 감각파'},
  {name:'WonJun_Kang',habit:'체육 이론까지 완벽하게 공부하는',style:'스포츠 학자'},
  {name:'SuBin_Yoo',habit:'경제 퀴즈 연속 정답 기록 보유자',style:'경제 박사'},
  {name:'JiYeon_Song',habit:'건강과 안전 과목 마스터',style:'안전 지킴이'}
];

// ===== 11. New Quizzes (50 questions) =====
const V7_QUIZZES=[
  {q:'삼각형의 내각의 합은 몇 도인가?',a:['360도','180도','270도','90도'],c:1,subject:'수학'},
  {q:'원주율(π)의 근사값은?',a:['3.14','2.72','1.41','1.73'],c:0,subject:'수학'},
  {q:'이차방정식 x²-5x+6=0의 해는?',a:['x=2, x=3','x=1, x=6','x=-2, x=-3','x=0, x=5'],c:0,subject:'수학'},
  {q:'1km는 몇 m인가?',a:['100m','1000m','10000m','10m'],c:1,subject:'수학'},
  {q:'분수 3/4를 소수로 나타내면?',a:['0.34','0.75','0.43','0.25'],c:1,subject:'수학'},
  {q:'광합성에서 필요한 기체는?',a:['산소','질소','이산화탄소','수소'],c:2,subject:'과학'},
  {q:'지구의 자전 주기는?',a:['12시간','24시간','365일','30일'],c:1,subject:'과학'},
  {q:'원소기호 Fe는 무엇인가?',a:['구리','철','금','은'],c:1,subject:'과학'},
  {q:'소리의 속도가 가장 빠른 매질은?',a:['공기','물','철','진공'],c:2,subject:'과학'},
  {q:'세포의 에너지 공장이라 불리는 것은?',a:['핵','리보솜','미토콘드리아','골지체'],c:2,subject:'과학'},
  {q:'임진왜란이 일어난 해는?',a:['1392년','1592년','1636년','1910년'],c:1,subject:'한국사'},
  {q:'훈민정음을 창제한 왕은?',a:['태종','세종','성종','영조'],c:1,subject:'한국사'},
  {q:'고려를 건국한 인물은?',a:['왕건','견훤','궁예','이성계'],c:0,subject:'한국사'},
  {q:'삼국 중 가장 먼저 불교를 수용한 나라는?',a:['백제','신라','고구려','가야'],c:2,subject:'한국사'},
  {q:'독립운동가 안중근 의사가 저격한 인물은?',a:['이토 히로부미','데라우치 마사타케','사이토 마코토','하세가와'],c:0,subject:'한국사'},
  {q:'HTML에서 제목 태그는?',a:['&lt;p&gt;','&lt;h1&gt;','&lt;div&gt;','&lt;span&gt;'],c:1,subject:'코딩'},
  {q:'프로그래밍에서 반복문이 아닌 것은?',a:['for','while','if','do-while'],c:2,subject:'코딩'},
  {q:'변수의 값이 변하지 않는 것을 무엇이라 하는가?',a:['변수','상수','함수','배열'],c:1,subject:'코딩'},
  {q:'CSS에서 글자 색을 바꾸는 속성은?',a:['background-color','font-size','color','text-align'],c:2,subject:'코딩'},
  {q:'알고리즘의 시간 복잡도 O(1)의 의미는?',a:['선형 시간','상수 시간','로그 시간','지수 시간'],c:1,subject:'코딩'},
  {q:'영어 알파벳은 총 몇 글자인가?',a:['24개','26개','28개','30개'],c:1,subject:'영어'},
  {q:'"Thank you"의 반대말은?',a:['Sorry','Welcome','You are welcome','Goodbye'],c:0,subject:'영어'},
  {q:'과거형으로 바꾸면: I go → I ___',a:['goed','went','gone','going'],c:1,subject:'영어'},
  {q:'"apple"의 복수형은?',a:['apples','applees','applis','apple'],c:0,subject:'영어'},
  {q:'영어로 "학교"는?',a:['Hospital','Library','School','Museum'],c:2,subject:'영어'},
  {q:'피아노의 흰 건반은 몇 개의 음으로 구성되는가?',a:['5개','7개','8개','12개'],c:1,subject:'음악'},
  {q:'4/4 박자에서 한 마디는 몇 박인가?',a:['2박','3박','4박','6박'],c:2,subject:'음악'},
  {q:'바이올린의 현은 몇 개인가?',a:['3개','4개','5개','6개'],c:1,subject:'음악'},
  {q:'음악에서 "ff"는 무엇을 뜻하는가?',a:['매우 여리게','매우 세게','보통 크기로','점점 세게'],c:1,subject:'음악'},
  {q:'도레미파솔라시도에서 "라"는 영어로?',a:['C','D','A','G'],c:2,subject:'음악'},
  {q:'올림픽에서 마라톤의 거리는?',a:['21.095km','42.195km','50km','30km'],c:1,subject:'체육'},
  {q:'축구에서 한 팀의 선수는 몇 명인가?',a:['9명','10명','11명','12명'],c:2,subject:'체육'},
  {q:'농구 코트에서 3점 슛 라인은 어디에?',a:['골대 아래','자유투 라인','3점 라인 밖','하프라인'],c:2,subject:'체육'},
  {q:'수채화에 주로 사용하는 붓은?',a:['유화붓','수채붓','먹붓','에어브러쉬'],c:1,subject:'미술'},
  {q:'빨간색과 파란색을 섞으면?',a:['초록색','보라색','주황색','갈색'],c:1,subject:'미술'},
  {q:'원근법에서 먼 물체는 어떻게 보이는가?',a:['크게','작게','같게','넓게'],c:1,subject:'미술'},
  {q:'대한민국의 3부는?',a:['입법부, 사법부, 행정부','국회, 정부, 시청','대통령, 국무총리, 국회의장','헌법, 법률, 조례'],c:0,subject:'사회'},
  {q:'유엔(UN)의 본부는 어디에 있는가?',a:['런던','파리','뉴욕','제네바'],c:2,subject:'사회'},
  {q:'민주주의의 기본 원리가 아닌 것은?',a:['국민주권','권력분립','세습통치','법치주의'],c:2,subject:'사회'},
  {q:'GDP는 무엇의 약자인가?',a:['Gross Domestic Product','General Data Protection','Global Development Plan','Great Digital Platform'],c:0,subject:'경제'},
  {q:'인플레이션이란?',a:['물가가 오르는 현상','물가가 내리는 현상','환율이 오르는 현상','금리가 내리는 현상'],c:0,subject:'경제'},
  {q:'수요와 공급의 법칙에서, 가격이 오르면 수요는?',a:['증가한다','감소한다','변하지 않는다','두 배가 된다'],c:1,subject:'경제'},
  {q:'손을 씻어야 하는 최소 시간은?',a:['5초','10초','20초','60초'],c:2,subject:'건강'},
  {q:'하루 권장 수면 시간(초등학생)은?',a:['5~6시간','7~8시간','9~11시간','12~14시간'],c:2,subject:'건강'},
  {q:'화재 시 올바른 대피 자세는?',a:['서서 뛰어간다','낮은 자세로 이동한다','엘리베이터를 탄다','창문으로 뛰어내린다'],c:1,subject:'건강'},
  {q:'식중독을 예방하는 방법이 아닌 것은?',a:['손 씻기','음식 익혀 먹기','유통기한 확인','상온에 오래 보관'],c:3,subject:'건강'},
  {q:'지진 발생 시 올바른 행동은?',a:['밖으로 뛰어나간다','책상 아래로 대피한다','엘리베이터를 탄다','창문을 연다'],c:1,subject:'건강'},
  {q:'최소공배수(LCM)란?',a:['가장 작은 공통 배수','가장 큰 공통 약수','가장 작은 소수','가장 큰 배수'],c:0,subject:'수학'},
  {q:'뉴턴의 운동 제3법칙은?',a:['관성의 법칙','가속도의 법칙','작용 반작용의 법칙','만유인력의 법칙'],c:2,subject:'과학'},
  {q:'한글날은 몇 월 며칠인가?',a:['3월 1일','10월 9일','8월 15일','6월 6일'],c:1,subject:'한국사'}
];

function pushV7Quizzes(){
  if(!window.QUIZ)window.QUIZ=[];
  const existing=window.QUIZ.map(q=>q.q);
  V7_QUIZZES.forEach(q=>{
    if(!existing.includes(q.q))window.QUIZ.push(q);
  });
}

// ===== 12. New Badges (12 new, 52→64) =====
const V7_BADGES=[
  {id:'streak_7',icon:'🔥',name:'1주 연속',desc:'7일 연속 학습 달성'},
  {id:'streak_30',icon:'💪',name:'한달 연속',desc:'30일 연속 학습 달성'},
  {id:'streak_100',icon:'🏆',name:'100일 레전드',desc:'100일 연속 학습 달성'},
  {id:'wrong_retry',icon:'🔄',name:'오답 정복자',desc:'오답노트에서 5문제 재시도 성공'},
  {id:'video_quiz',icon:'📺',name:'영상 학습왕',desc:'영상 후 이해도 퀴즈 3회 완료'},
  {id:'parent_share',icon:'👨‍👩‍👧',name:'효도 학습러',desc:'학부모 공유 카드 3회 생성'},
  {id:'accessibility',icon:'♿',name:'접근성 챔피언',desc:'고대비 또는 글꼴 크기 변경 사용'},
  {id:'goal_setter',icon:'🎯',name:'목표 설정자',desc:'관심 과목 TOP 3 설정 완료'},
  {id:'note_taker',icon:'📒',name:'메모 습관',desc:'학습 노트 5개 이상 작성'},
  {id:'weak_improver',icon:'📈',name:'약점 개선가',desc:'약점 과목 오답률 50% 감소'},
  {id:'quiz_350',icon:'🧠',name:'퀴즈 마스터 v7',desc:'총 퀴즈 350문제 이상 풀기'},
  {id:'v7_explorer',icon:'🌟',name:'v7 탐험가',desc:'v7.0 신기능 5개 이상 사용'}
];

function checkV7Badges(){
  const u=U();
  if(!u.v7badges)u.v7badges=[];
  const streak=u.streak||0;
  const checks=[
    {id:'streak_7',cond:streak>=7},
    {id:'streak_30',cond:streak>=30},
    {id:'streak_100',cond:streak>=100},
    {id:'wrong_retry',cond:(u.v7retrySuccess||0)>=5},
    {id:'video_quiz',cond:(u.v7videoQuizCount||0)>=3},
    {id:'parent_share',cond:(u.v7shareCount||0)>=3},
    {id:'accessibility',cond:u.v7highContrast||u.v7fontScale!=='100'},
    {id:'goal_setter',cond:!!(u.v7topSubjects&&u.v7topSubjects.length>=1)},
    {id:'note_taker',cond:Object.keys(u.v7notes||{}).length>=5},
    {id:'weak_improver',cond:(u.v7weakImproved||0)>=1},
    {id:'quiz_350',cond:(u.quizTotal||0)>=350},
    {id:'v7_explorer',cond:(u.v7featuresUsed||[]).length>=5}
  ];
  let newBadge=false;
  checks.forEach(ch=>{
    if(ch.cond&&!u.v7badges.includes(ch.id)){
      u.v7badges.push(ch.id);newBadge=true;
    }
  });
  if(newBadge)S(u);
}

function renderV7Badges(){
  const u=U();
  const earned=u.v7badges||[];
  return V7_BADGES.map(b=>{
    const has=earned.includes(b.id);
    return '<div class="v4-badge '+(has?'':'locked')+'" title="'+b.desc+'"><span class="v4-badge-icon" style="'+(has?'':'filter:grayscale(1);opacity:.4')+'">'+b.icon+'</span><span class="v4-badge-name">'+b.name+'</span></div>';
  }).join('');
}

// ===== 13. Learning Stories (3 new) =====
const V7_STORIES=[
  {id:'space_adventure',title:'🚀 우주 탐험대',subject:'과학',
   chapters:[
     {title:'지구를 떠나며',content:'우리 탐험대는 화성으로 향하는 우주선에 탑승했습니다. 창밖으로 보이는 지구는 점점 작아지고, 별들이 더욱 선명해집니다. "대기권을 벗어났습니다!" 선장이 외쳤습니다. 우주에서는 중력이 없어 모든 것이 둥둥 떠다닙니다. 물도 공 모양으로 떠다니고, 사람도 가만히 있으면 떠오르죠.'},
     {title:'화성 도착',content:'6개월간의 긴 여행 끝에 화성에 도착했습니다. 화성의 하늘은 주황빛이고, 기온은 영하 60도입니다. 화성의 하루는 지구보다 40분 길고, 중력은 지구의 38%밖에 되지 않습니다. 지구에서 50kg인 사람이 여기서는 19kg으로 느껴집니다!'},
     {title:'새로운 발견',content:'탐사 로봇이 화성 지하에서 얼음을 발견했습니다! 물이 있다는 것은 생명체가 존재할 가능성이 있다는 뜻입니다. 우리는 샘플을 채취하고, 화성 기지 건설을 위한 첫 발을 내딛었습니다. 언젠가 인류는 화성에서도 살 수 있을 것입니다.'}
   ]},
  {id:'math_detective',title:'🔍 수학 탐정단',subject:'수학',
   chapters:[
     {title:'수상한 암호',content:'학교 도서관에서 수상한 쪽지를 발견했습니다. "다음 숫자는? 2, 4, 8, 16, ?" 이것은 등비수열! 각 항에 2를 곱하면 다음 수가 됩니다. 답은 32. 쪽지 뒷면에는 도서관 32번 서가를 가리키는 화살표가 있었습니다.'},
     {title:'도형의 비밀',content:'32번 서가에서 또 다른 단서를 찾았습니다. "넓이가 48cm²인 삼각형, 밑변이 12cm일 때 높이는?" 삼각형 넓이 = 밑변 × 높이 ÷ 2이므로, 48 = 12 × 높이 ÷ 2, 높이 = 8cm! 8cm 높이의 선반에 보물 상자가 숨겨져 있었습니다.'},
     {title:'최후의 문제',content:'보물 상자의 자물쇠에는 "세 자리 비밀번호: 각 자릿수의 합이 15, 백의 자리는 천의 자리의 2배, 일의 자리는 3" 이라고 적혀 있었습니다. 일의 자리=3, 백의 자리를 x라 하면 x+2x+3=15, 3x=12, x=4. 비밀번호는 843! 상자 안에는 수학올림피아드 금메달이!'}
   ]},
  {id:'history_time',title:'⏳ 시간 여행자의 일기',subject:'한국사',
   chapters:[
     {title:'고조선에서',content:'타임머신이 BC 2333년으로 보내주었습니다. 단군왕검이 아사달에 나라를 세우는 모습을 직접 보았습니다! 사람들은 빗살무늬토기에 음식을 담아 먹고, 반달돌칼로 곡식을 수확했습니다. 고인돌은 상상 이상으로 거대했고, 수백 명이 함께 돌을 운반하는 모습은 장관이었습니다.'},
     {title:'삼국시대 전장',content:'시간을 뛰어 612년, 을지문덕 장군의 살수대첩 현장입니다! 수나라 30만 대군이 고구려를 침략했지만, 을지문덕 장군의 지혜로운 전략에 거의 전멸했습니다. 살수(청천강)에서 물을 막았다가 한꺼번에 풀어 적을 쓸어버린 것입니다. 전략의 힘이 무력보다 강하다는 것을 배웠습니다.'},
     {title:'세종대왕을 만나다',content:'1443년 경복궁, 세종대왕이 한글을 만들고 계십니다! "백성이 글을 몰라 억울한 일을 당하니, 누구나 쉽게 배울 수 있는 글자를 만들겠노라." 28자(현재 24자)로 모든 소리를 적을 수 있는 한글, 세계에서 가장 과학적인 문자입니다. 세종대왕의 백성 사랑에 감동받았습니다.'}
   ]}
];

function injectV7Stories(){
  if(!window.STORIES)window.STORIES=[];
  const existing=window.STORIES.map(s=>s.id);
  V7_STORIES.forEach(s=>{
    if(!existing.includes(s.id))window.STORIES.push(s);
  });
}

// ===== Home Page Injection =====
function v7InjectHome(){
  const p0=_el('p0');if(!p0)return;
  const existing=p0.querySelector('.v7-home-section');
  if(existing)existing.remove();
  const insertPoint=p0.querySelector('.v6-daily')||p0.querySelector('[class*="v6"]')||p0.querySelector('.sec');
  if(!insertPoint)return;
  const div=document.createElement('div');
  div.className='v7-home-section';
  let h='';
  h+=renderStreakRepair();
  h+=renderWeakSpots();
  h+=renderWrongNotesEnhanced();
  h+=renderNotesSection();
  h+=renderShareSection();
  div.innerHTML=h;
  insertPoint.parentNode.insertBefore(div,insertPoint);
}

// ===== Settings Page Injection =====
function v7InjectSettings(){
  const p4=_el('p4');if(!p4)return;
  const existing=p4.querySelector('.v7-settings-section');
  if(existing)existing.remove();
  const target=p4.querySelector('.v6-badge-section')||p4.querySelector('[style*="background:var(--c1)"]');
  if(!target)return;
  const div=document.createElement('div');
  div.className='v7-settings-section';
  div.innerHTML=renderAccessibilityPanel();
  target.parentNode.insertBefore(div,target);
}

// ===== Profile Badge Injection =====
function v7InjectProfile(){
  const p4=_el('p4');if(!p4)return;
  const existing=p4.querySelector('.v7-badge-section');if(existing)return;
  const target=p4.querySelector('.v6-badge-section')||p4.querySelector('.v5-badge-section')||p4.querySelector('.v4-badge-section');
  if(target){
    const badgeDiv=document.createElement('div');badgeDiv.className='v7-badge-section';
    badgeDiv.innerHTML='<div style="margin-bottom:10px"><div class="sec">🌟 v7 배지 ('+((U().v7badges||[]).length)+'/'+V7_BADGES.length+')</div><div class="v4-badge-grid">'+renderV7Badges()+'</div></div>';
    target.parentNode.insertBefore(badgeDiv,target.nextSibling);
  }
}

// ===== Quick Action Buttons =====
function v7InjectQuickActions(){
  if(document.querySelector('.v7-qa'))return;
  const div=document.createElement('div');
  div.className='v7-qa';
  const actions=[
    {icon:'📝',title:'오답노트',fn:'document.querySelector(".v7-wrong-wrap")&&document.querySelector(".v7-wrong-wrap").scrollIntoView({behavior:"smooth"})'},
    {icon:'📊',title:'학부모 공유',fn:'generateParentCard()'},
    {icon:'🎯',title:'약점 분석',fn:'document.querySelector(".v7-weak-card")&&document.querySelector(".v7-weak-card").scrollIntoView({behavior:"smooth"})'},
    {icon:'📒',title:'학습 노트',fn:'document.querySelector(".v7-notes")&&document.querySelector(".v7-notes").scrollIntoView({behavior:"smooth"})'},
    {icon:'♿',title:'접근성',fn:'v7ToggleHC()'},
    {icon:'📺',title:'이해도 체크',fn:'triggerPostVideoQuiz("manual")'},
    {icon:'🔧',title:'스트릭 복구',fn:'v7RepairStreak()'},
    {icon:'🏆',title:'마일스톤',fn:'showMilestoneToast(U().streak||1)'}
  ];
  actions.forEach(a=>{
    div.innerHTML+='<button title="'+a.title+'" onclick="'+a.fn+'">'+a.icon+'</button>';
  });
  document.body.appendChild(div);
}

// ===== Keyboard Shortcuts =====
document.addEventListener('keydown',function(e){
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
  if(e.shiftKey&&e.key==='W'){e.preventDefault();const w=document.querySelector('.v7-wrong-wrap');if(w)w.scrollIntoView({behavior:'smooth'});}
  if(e.shiftKey&&e.key==='P'){e.preventDefault();generateParentCard();}
  if(e.shiftKey&&e.key==='T'){e.preventDefault();const w=document.querySelector('.v7-weak-card');if(w)w.scrollIntoView({behavior:'smooth'});}
  if(e.shiftKey&&e.key==='N'){e.preventDefault();const n=document.querySelector('.v7-notes');if(n)n.scrollIntoView({behavior:'smooth'});}
  if(e.shiftKey&&e.key==='H'){e.preventDefault();v7ToggleHC();}
  if(e.shiftKey&&e.key==='V'){e.preventDefault();triggerPostVideoQuiz('manual');}
  if(e.shiftKey&&e.key==='R'){e.preventDefault();v7RepairStreak();}
  if(e.shiftKey&&e.key==='M'){e.preventDefault();showMilestoneToast(U().streak||1);}
});

// ===== Track Feature Usage =====
function v7TrackFeature(feat){
  const u=U();
  if(!u.v7featuresUsed)u.v7featuresUsed=[];
  if(!u.v7featuresUsed.includes(feat)){
    u.v7featuresUsed.push(feat);S(u);
  }
}

// Hook existing quiz check for adaptive re-queue
const origChkAv7=window.chkA;
if(typeof origChkAv7==='function'){
  window.chkA=function(btn,ok){
    origChkAv7.call(this,btn,ok);
    checkV7Badges();
  };
}

// ===== Restore Accessibility State =====
function v7RestoreAccessibility(){
  const u=U();
  if(u.v7highContrast)document.documentElement.classList.add('v7-hc');
  const fs=u.v7fontScale||'100';
  if(fs==='125')document.documentElement.classList.add('v7-fs-125');
  if(fs==='150')document.documentElement.classList.add('v7-fs-150');
}

// ===== Init =====
function v7Init(){
  v7RestoreAccessibility();
  pushV7Quizzes();
  injectV7Stories();
  v7InjectHome();
  v7InjectProfile();
  v7InjectSettings();
  v7InjectQuickActions();
  checkV7Badges();
  checkStreakMilestone();

  const u=U();
  if(u.onboarded&&!u.v7onboarded){
    setTimeout(showV7Onboarding,2000);
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',v7Init);
else setTimeout(v7Init,300);
})();
