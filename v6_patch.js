// LevelPlay v6.0 Patch - Certificate + Flashcards + Gems + XP Boost + Daily Challenge
// + Subject Progress + Avatar + 3 Stories + 50 Quizzes + 12 Badges + SFX 8
(function(){
'use strict';

const css=document.createElement('style');
css.textContent=`
.v6-cert-wrap{background:linear-gradient(135deg,var(--c1,#111127),rgba(251,191,36,.06));border:1.5px solid rgba(251,191,36,.2);border-radius:12px;padding:14px;margin-bottom:10px}
.v6-cert-wrap canvas{max-width:100%;border-radius:8px;box-shadow:0 2px 12px rgba(0,0,0,.3)}
.v6-cert-btn{display:flex;align-items:center;gap:6px;padding:8px 14px;border:1px solid rgba(251,191,36,.25);border-radius:8px;background:linear-gradient(135deg,rgba(251,191,36,.08),rgba(6,214,160,.04));color:var(--gd,#fbbf24);font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;transition:.15s;margin-top:8px}
.v6-cert-btn:hover{border-color:var(--gd);transform:translateY(-1px)}
.v6-cert-overlay{position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:12px;padding:16px;animation:v6FadeIn .3s}
@keyframes v6FadeIn{from{opacity:0}to{opacity:1}}
.v6-cert-actions{display:flex;gap:8px}
.v6-flash-wrap{background:var(--c1,#111127);border:1px solid rgba(139,92,246,.1);border-radius:12px;padding:14px;margin-bottom:10px}
.v6-flash-card{position:relative;min-height:140px;background:linear-gradient(135deg,rgba(139,92,246,.06),rgba(6,214,160,.04));border:1px solid rgba(139,92,246,.15);border-radius:12px;padding:20px;text-align:center;cursor:pointer;transition:transform .3s;perspective:600px;display:flex;align-items:center;justify-content:center;flex-direction:column}
.v6-flash-card:hover{transform:scale(1.01)}
.v6-flash-front{font-size:16px;font-weight:700}
.v6-flash-back{font-size:13px;color:var(--cy,#06d6a0);display:none}
.v6-flash-card.flipped .v6-flash-front{display:none}
.v6-flash-card.flipped .v6-flash-back{display:block}
.v6-flash-hint{font-size:9px;color:var(--t3);margin-top:8px}
.v6-flash-controls{display:flex;gap:8px;margin-top:10px;justify-content:center}
.v6-flash-controls button{padding:6px 14px;border-radius:6px;border:1px solid rgba(139,92,246,.15);background:var(--c2,#181838);color:var(--tx,#e2e8f0);font:11px inherit;cursor:pointer;font-weight:600;transition:.15s}
.v6-flash-controls button:hover{border-color:var(--cy)}
.v6-flash-controls button.v6-easy{border-color:rgba(34,197,94,.3);color:var(--gn,#22c55e)}
.v6-flash-controls button.v6-hard{border-color:rgba(239,68,68,.3);color:var(--rd,#ef4444)}
.v6-flash-progress{display:flex;gap:3px;justify-content:center;margin-top:8px}
.v6-flash-dot{width:8px;height:8px;border-radius:50%;background:rgba(139,92,246,.15)}
.v6-flash-dot.done{background:var(--cy,#06d6a0)}
.v6-flash-dot.current{background:var(--p,#8b5cf6);animation:v6pulse 1s infinite}
@keyframes v6pulse{0%,100%{opacity:1}50%{opacity:.5}}
.v6-gem{display:inline-flex;align-items:center;gap:4px;font-size:12px;font-weight:800;color:var(--p,#8b5cf6)}
.v6-gem-bar{display:flex;align-items:center;gap:6px;background:linear-gradient(135deg,var(--c1),rgba(139,92,246,.06));border:1px solid rgba(139,92,246,.12);border-radius:20px;padding:5px 12px;font-size:11px;margin-bottom:10px}
.v6-gem-icon{font-size:16px}
.v6-gem-count{font-weight:800;color:var(--p);flex:1}
.v6-gem-shop-btn{font-size:9px;padding:3px 8px;border-radius:4px;background:rgba(139,92,246,.15);color:var(--p);border:none;cursor:pointer;font-weight:600;font-family:inherit}
.v6-boost{background:linear-gradient(135deg,rgba(251,191,36,.1),rgba(239,68,68,.06));border:1.5px solid rgba(251,191,36,.25);border-radius:12px;padding:12px;margin-bottom:10px;text-align:center}
.v6-boost-title{font-size:13px;font-weight:800;color:var(--gd)}
.v6-boost-timer{font-size:20px;font-weight:900;color:var(--rd,#ef4444);margin:6px 0}
.v6-boost-desc{font-size:10px;color:var(--t3)}
.v6-daily{background:linear-gradient(135deg,var(--c1),rgba(6,214,160,.06));border:1.5px solid rgba(6,214,160,.18);border-radius:12px;padding:14px;margin-bottom:10px}
.v6-daily-header{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.v6-daily-header .v6d-icon{font-size:24px}
.v6-daily-header .v6d-info{flex:1}
.v6-daily-header .v6d-title{font-size:13px;font-weight:700}
.v6-daily-header .v6d-sub{font-size:10px;color:var(--t3)}
.v6-daily-timer{font-size:11px;font-weight:700;color:var(--rd)}
.v6-daily-q{background:var(--c2,#181838);border-radius:8px;padding:12px;margin-bottom:8px}
.v6-daily-q .v6dq-num{font-size:9px;color:var(--p);font-weight:700;margin-bottom:4px}
.v6-daily-q .v6dq-text{font-size:12px;font-weight:600;margin-bottom:8px}
.v6-daily-q .v6dq-opts{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.v6-daily-q .v6dq-opts button{padding:8px;border:1px solid rgba(139,92,246,.15);border-radius:6px;background:var(--c1);color:var(--tx);font:11px inherit;cursor:pointer;transition:.15s}
.v6-daily-q .v6dq-opts button:hover{border-color:var(--cy)}
.v6-daily-q .v6dq-opts button.correct{background:rgba(34,197,94,.15);border-color:var(--gn);color:var(--gn)}
.v6-daily-q .v6dq-opts button.wrong{background:rgba(239,68,68,.15);border-color:var(--rd);color:var(--rd)}
.v6-daily-result{text-align:center;padding:16px;background:var(--c2);border-radius:8px}
.v6-daily-result .v6dr-score{font-size:28px;font-weight:900;background:var(--g1,linear-gradient(135deg,#8b5cf6,#06d6a0));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.v6-daily-result .v6dr-label{font-size:10px;color:var(--t3);margin-top:4px}
.v6-subj-progress{background:var(--c1);border:1px solid rgba(139,92,246,.08);border-radius:12px;padding:14px;margin-bottom:10px}
.v6-subj-row{display:flex;align-items:center;gap:8px;padding:5px 0;font-size:11px}
.v6-subj-icon{font-size:16px;min-width:22px;text-align:center}
.v6-subj-name{min-width:45px;font-weight:600}
.v6-subj-bar{flex:1;height:8px;background:var(--bg,#0a0a1a);border-radius:4px;overflow:hidden}
.v6-subj-fill{height:100%;border-radius:4px;transition:width .6s}
.v6-subj-pct{min-width:32px;text-align:right;font-weight:700;color:var(--cy)}
.v6-avatar-wrap{display:flex;align-items:center;gap:12px;background:var(--c1);border:1px solid rgba(139,92,246,.1);border-radius:12px;padding:12px;margin-bottom:10px;cursor:pointer;transition:.15s}
.v6-avatar-wrap:hover{border-color:var(--p)}
.v6-avatar-circle{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;border:2px solid rgba(139,92,246,.2);flex-shrink:0}
.v6-avatar-info{flex:1}
.v6-avatar-name{font-size:14px;font-weight:800}
.v6-avatar-title{font-size:10px;color:var(--t3)}
.v6-avatar-level{font-size:10px;font-weight:700;color:var(--cy)}
.v6-avatar-picker{position:fixed;inset:0;z-index:9200;background:rgba(0,0,0,.85);display:flex;align-items:center;justify-content:center;padding:16px}
.v6-avatar-modal{background:var(--c1);border:1.5px solid rgba(139,92,246,.2);border-radius:16px;padding:20px;max-width:340px;width:100%;max-height:80vh;overflow-y:auto}
.v6-avatar-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:12px}
.v6-avatar-opt{width:100%;aspect-ratio:1;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;border:2px solid rgba(139,92,246,.1);background:var(--c2);cursor:pointer;transition:.15s}
.v6-avatar-opt:hover{border-color:var(--cy);transform:scale(1.1)}
.v6-avatar-opt.selected{border-color:var(--p);background:rgba(139,92,246,.1);box-shadow:0 0 12px rgba(139,92,246,.3)}
.v6-title-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-top:8px}
.v6-title-opt{padding:6px 10px;border-radius:6px;border:1px solid rgba(139,92,246,.1);background:var(--c2);color:var(--tx);font:10px inherit;cursor:pointer;text-align:center;transition:.15s}
.v6-title-opt:hover{border-color:var(--cy)}
.v6-title-opt.selected{border-color:var(--p);background:rgba(139,92,246,.1)}
.v6-title-opt.locked{opacity:.4;cursor:not-allowed}
`;
document.head.appendChild(css);

const U=()=>{try{return JSON.parse(localStorage.getItem('lp_user'))||{}}catch(e){return{}}};
const S=d=>{const u=U();Object.assign(u,d);localStorage.setItem('lp_user',JSON.stringify(u))};
const _el=id=>document.getElementById(id);

// ===== Web Audio SFX (8 new) =====
let v6Ctx=null;
function v6sfx(type){
  try{
    if(!v6Ctx)v6Ctx=new(window.AudioContext||window.webkitAudioContext)();
    if(v6Ctx.state==='suspended')v6Ctx.resume();
    const u=U();if(u.soundMuted)return;
    const o=v6Ctx.createOscillator(),g=v6Ctx.createGain(),t=v6Ctx.currentTime;
    o.connect(g);g.connect(v6Ctx.destination);
    switch(type){
      case'cert':
        o.type='sine';
        o.frequency.setValueAtTime(523,t);o.frequency.setValueAtTime(659,t+.12);
        o.frequency.setValueAtTime(784,t+.24);o.frequency.setValueAtTime(1047,t+.36);
        o.frequency.setValueAtTime(1318,t+.48);
        g.gain.setValueAtTime(.12,t);g.gain.linearRampToValueAtTime(.001,t+.7);
        o.start(t);o.stop(t+.7);break;
      case'flash_flip':
        o.type='triangle';
        o.frequency.setValueAtTime(880,t);o.frequency.setValueAtTime(1109,t+.06);
        g.gain.setValueAtTime(.08,t);g.gain.linearRampToValueAtTime(.001,t+.15);
        o.start(t);o.stop(t+.15);break;
      case'flash_correct':
        o.type='sine';
        o.frequency.setValueAtTime(523,t);o.frequency.setValueAtTime(659,t+.08);
        o.frequency.setValueAtTime(784,t+.16);
        g.gain.setValueAtTime(.1,t);g.gain.linearRampToValueAtTime(.001,t+.3);
        o.start(t);o.stop(t+.3);break;
      case'gem_earn':
        o.type='sine';
        o.frequency.setValueAtTime(1047,t);o.frequency.setValueAtTime(1318,t+.05);
        o.frequency.setValueAtTime(1568,t+.1);
        g.gain.setValueAtTime(.1,t);g.gain.linearRampToValueAtTime(.001,t+.2);
        o.start(t);o.stop(t+.2);break;
      case'boost':
        o.type='sawtooth';
        o.frequency.setValueAtTime(440,t);o.frequency.linearRampToValueAtTime(880,t+.2);
        g.gain.setValueAtTime(.06,t);g.gain.linearRampToValueAtTime(.001,t+.35);
        o.start(t);o.stop(t+.35);break;
      case'daily_start':
        o.type='square';
        o.frequency.setValueAtTime(660,t);o.frequency.setValueAtTime(880,t+.1);
        o.frequency.setValueAtTime(1100,t+.2);
        g.gain.setValueAtTime(.06,t);g.gain.linearRampToValueAtTime(.001,t+.35);
        o.start(t);o.stop(t+.35);break;
      case'daily_done':
        o.type='sine';
        o.frequency.setValueAtTime(523,t);o.frequency.setValueAtTime(784,t+.1);
        o.frequency.setValueAtTime(1047,t+.2);o.frequency.setValueAtTime(1568,t+.3);
        g.gain.setValueAtTime(.12,t);g.gain.linearRampToValueAtTime(.001,t+.5);
        o.start(t);o.stop(t+.5);break;
      case'avatar':
        o.type='triangle';
        o.frequency.setValueAtTime(440,t);o.frequency.setValueAtTime(554,t+.08);
        o.frequency.setValueAtTime(660,t+.16);
        g.gain.setValueAtTime(.08,t);g.gain.linearRampToValueAtTime(.001,t+.28);
        o.start(t);o.stop(t+.28);break;
    }
  }catch(e){}
}

// ===== 1. Achievement Certificate System =====
const CERT_THEMES=[
  {name:'Classic',bg1:'#0a0a2e',bg2:'#111140',accent:'#8b5cf6',border:'#fbbf24'},
  {name:'Ocean',bg1:'#0a1a2e',bg2:'#0a2540',accent:'#06d6a0',border:'#3b82f6'},
  {name:'Sunset',bg1:'#1a0a0a',bg2:'#2a1515',accent:'#f97316',border:'#ef4444'}
];

function generateCertificate(subjectName,level,score){
  v6sfx('cert');
  const u=U();
  const theme=CERT_THEMES[0];
  const canvas=document.createElement('canvas');
  canvas.width=700;canvas.height=500;
  const ctx=canvas.getContext('2d');
  const grad=ctx.createLinearGradient(0,0,700,500);
  grad.addColorStop(0,theme.bg1);grad.addColorStop(1,theme.bg2);
  ctx.fillStyle=grad;
  if(ctx.roundRect){ctx.beginPath();ctx.roundRect(0,0,700,500,16);ctx.fill();}
  else ctx.fillRect(0,0,700,500);

  ctx.strokeStyle=theme.border;ctx.lineWidth=3;
  if(ctx.roundRect){ctx.beginPath();ctx.roundRect(12,12,676,476,12);ctx.stroke();}
  ctx.strokeStyle='rgba(251,191,36,.15)';ctx.lineWidth=1;
  if(ctx.roundRect){ctx.beginPath();ctx.roundRect(20,20,660,460,10);ctx.stroke();}

  for(let i=0;i<4;i++){
    const x=[30,640,30,640][i],y=[30,30,440,440][i];
    ctx.fillStyle='rgba(251,191,36,.6)';ctx.font='18px serif';
    ctx.fillText('✦',x,y);
  }

  ctx.font='bold 14px sans-serif';ctx.fillStyle=theme.accent;ctx.textAlign='center';
  ctx.fillText('CERTIFICATE OF ACHIEVEMENT',350,60);

  ctx.font='bold 32px sans-serif';ctx.fillStyle='#e2e8f0';
  ctx.fillText('🎓 학습 성취 증명서',350,110);

  ctx.font='16px sans-serif';ctx.fillStyle='#94a3b8';
  ctx.fillText('본 증명서는 아래의 학습자가',350,160);

  const name=u.nickname||'학습자';
  ctx.font='bold 28px sans-serif';ctx.fillStyle=theme.border;
  ctx.fillText(name,350,200);

  ctx.font='14px sans-serif';ctx.fillStyle='#94a3b8';
  ctx.fillText('님이 LevelPlay 플랫폼에서',350,235);

  ctx.font='bold 22px sans-serif';ctx.fillStyle='#e2e8f0';
  ctx.fillText('「'+subjectName+'」 과목을',350,275);

  const lvText=['','입문','초급','중급','고급','심화'][level]||'마스터';
  ctx.fillText('Lv.'+level+' ('+lvText+') 레벨로 완료하였음을 증명합니다.',350,310);

  if(score>0){
    ctx.font='bold 16px sans-serif';ctx.fillStyle=theme.accent;
    ctx.fillText('최종 점수: '+score+'점',350,350);
  }

  ctx.font='12px sans-serif';ctx.fillStyle='#64748b';
  const dateStr=new Date().toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric'});
  ctx.fillText('발급일: '+dateStr,350,400);
  ctx.fillText('LevelPlay Education Platform',350,425);

  const accGrad=ctx.createLinearGradient(100,0,600,0);
  accGrad.addColorStop(0,'#8b5cf6');accGrad.addColorStop(1,'#06d6a0');
  ctx.fillStyle=accGrad;ctx.fillRect(100,450,500,3);

  ctx.font='10px sans-serif';ctx.fillStyle='#475569';
  ctx.fillText('levelplay.vercel.app | ID: CERT-'+Date.now().toString(36).toUpperCase(),350,475);

  if(!u.certsEarned)u.certsEarned=[];
  u.certsEarned.push({subject:subjectName,level:level,date:dateStr});
  S(u);

  return canvas;
}

function v6ShowCertificate(subjectName,level,score){
  const canvas=generateCertificate(subjectName||'수학',level||1,score||0);
  const overlay=document.createElement('div');
  overlay.className='v6-cert-overlay';overlay.id='v6certOverlay';
  overlay.appendChild(canvas);
  const actions=document.createElement('div');actions.className='v6-cert-actions';
  actions.innerHTML='<button class="bt bp" onclick="v6DownloadCert()">PNG 다운로드</button><button class="bt bs" onclick="document.getElementById(\'v6certOverlay\').remove()">닫기</button>';
  overlay.appendChild(actions);
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
  if(typeof v5Confetti==='function')v5Confetti(3000);
}
window.v6ShowCertificate=v6ShowCertificate;

window.v6DownloadCert=function(){
  const canvas=document.querySelector('#v6certOverlay canvas');
  if(!canvas)return;
  const a=document.createElement('a');a.download='levelplay-certificate.png';
  a.href=canvas.toDataURL('image/png');a.click();
};

function renderCertSection(){
  const u=U();
  const certs=u.certsEarned||[];
  let h='<div class="v6-cert-wrap"><div class="sec"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-trophy"/></svg> 학습 성취 증명서</div>';
  if(certs.length>0){
    h+='<div style="font-size:10px;color:var(--t3);margin-bottom:8px">획득한 증명서: '+certs.length+'개</div>';
    certs.slice(-3).forEach(c=>{
      h+='<div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:11px">';
      h+='🏅 <b>'+c.subject+'</b> Lv.'+c.level+' <span style="color:var(--t3);font-size:9px">'+c.date+'</span></div>';
    });
  }else{
    h+='<div style="font-size:10px;color:var(--t3)">과목 학습을 완료하면 증명서를 받을 수 있어요!</div>';
  }
  h+='<button class="v6-cert-btn" onclick="v6ShowCertificate(\'나의 학습 여정\',' +(u.level||1)+','+(u.xp||0)+')"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-scroll"/></svg> 증명서 발급받기</button>';
  h+='</div>';
  return h;
}

// ===== 2. Flashcard System (Spaced Repetition) =====
const FLASHCARDS=[
  {front:'물의 화학식은?',back:'H₂O (수소 2개 + 산소 1개)',cat:'과학'},
  {front:'빛의 속도는?',back:'초속 약 30만 km (299,792 km/s)',cat:'과학'},
  {front:'피타고라스 정리는?',back:'a² + b² = c² (직각삼각형)',cat:'수학'},
  {front:'원주율(π)의 값은?',back:'3.14159265... (원의 둘레/지름)',cat:'수학'},
  {front:'조선을 건국한 왕은?',back:'이성계 (1392년, 조선 태조)',cat:'한국사'},
  {front:'훈민정음 반포 연도는?',back:'1446년 (세종대왕)',cat:'한국사'},
  {front:'임진왔란 발발 연도는?',back:'1592년 (선조 25년)',cat:'한국사'},
  {front:'Photosynthesis 뜻은?',back:'광합성 (Light + Synthesis)',cat:'영어'},
  {front:'What is the past tense of "go"?',back:'went',cat:'영어'},
  {front:'비발디의 사계 중 "봉"은?',back:'La Primavera (이탈리어어)',cat:'음악'},
  {front:'음악에서 forte(f)의 뜻은?',back:'세게 (큰 소리로)',cat:'음악'},
  {front:'GDP의 약자는?',back:'Gross Domestic Product (국내총생산)',cat:'경제'},
  {front:'인플레이션이란?',back:'물가가 지속적으로 오르는 현상',cat:'경제'},
  {front:'인체의 피 순환 순서는?',back:'심장→동맥→모세혈관→정맥→심장',cat:'과학'},
  {front:'삼국통일을 이룬 나라는?',back:'신라 (676년, 문무왕)',cat:'한국사'},
  {front:'지구의 나이는?',back:'약 46억 년',cat:'과학'},
  {front:'프로그래밍에서 변수란?',back:'데이터를 저장하는 이름이 붙은 공간',cat:'코딩'},
  {front:'HTML의 약자는?',back:'HyperText Markup Language',cat:'코딩'},
  {front:'올림픽 5대 기는?',back:'파랑/빨강/초록/노랑/검정',cat:'체육'},
  {front:'모나리자를 그린 화가는?',back:'레오나르도 다빈치',cat:'미술'}
];

let v6FlashIdx=0;
let v6FlashFlipped=false;

function renderFlashcards(){
  const u=U();
  const flashStats=u.flashStats||{reviewed:0,mastered:0};
  const total=FLASHCARDS.length;
  const card=FLASHCARDS[v6FlashIdx%total];

  let h='<div class="v6-flash-wrap"><div class="sec"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-book"/></svg> 플래시카드 학습</div>';
  h+='<div style="font-size:10px;color:var(--t3);margin-bottom:8px">복습: '+flashStats.reviewed+'회 | 숙달: '+flashStats.mastered+'개</div>';
  h+='<div class="v6-flash-card" id="v6flashCard" onclick="v6FlipCard()">';
  h+='<div class="v6-flash-front">'+card.front+'</div>';
  h+='<div class="v6-flash-back">'+card.back+'</div>';
  h+='<div class="v6-flash-hint">탭하여 뒤집기 • <span style="color:var(--p)">'+card.cat+'</span></div>';
  h+='</div>';
  h+='<div class="v6-flash-controls">';
  h+='<button class="v6-hard" onclick="v6FlashAnswer(false)"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-cross"/></svg> 모르겠어요</button>';
  h+='<button class="v6-easy" onclick="v6FlashAnswer(true)"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-check"/></svg> 알고 있어요!</button>';
  h+='</div>';
  h+='<div class="v6-flash-progress">';
  for(let i=0;i<Math.min(total,10);i++){
    const state=i<v6FlashIdx%total?'done':(i===v6FlashIdx%total?'current':'');
    h+='<div class="v6-flash-dot '+state+'"></div>';
  }
  h+='</div></div>';
  return h;
}

window.v6FlipCard=function(){
  const card=_el('v6flashCard');
  if(!card)return;
  v6FlashFlipped=!v6FlashFlipped;
  if(v6FlashFlipped){card.classList.add('flipped');v6sfx('flash_flip');}
  else card.classList.remove('flipped');
};

window.v6FlashAnswer=function(known){
  const u=U();
  if(!u.flashStats)u.flashStats={reviewed:0,mastered:0};
  u.flashStats.reviewed++;
  if(known){u.flashStats.mastered++;v6sfx('flash_correct');v6EarnGems(2);}
  S(u);
  v6FlashIdx++;v6FlashFlipped=false;
  const wrap=document.querySelector('.v6-flash-wrap');
  if(wrap){wrap.outerHTML=renderFlashcards();}
};

// ===== 3. Gem Currency System =====
function getGems(){return U().gems||0;}

function v6EarnGems(amount){
  const u=U();
  u.gems=(u.gems||0)+amount;
  S(u);
  v6sfx('gem_earn');
  const gemCount=document.querySelector('.v6-gem-count');
  if(gemCount)gemCount.textContent=u.gems+' 💎';
}
window.v6EarnGems=v6EarnGems;

function renderGemBar(){
  const gems=getGems();
  let h='<div class="v6-gem-bar">';
  h+='<span class="v6-gem-icon" style="color:var(--p)"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-gem"/></svg></span>';
  h+='<span class="v6-gem-count">'+gems+' 💎</span>';
  h+='<button class="v6-gem-shop-btn" onclick="v6ShowGemInfo()">상점</button>';
  h+='</div>';
  return h;
}

window.v6ShowGemInfo=function(){
  const t=_el('tst');
  if(t){t.textContent='💎 보석을 모아 프로필 커스터마이즈하세요!';t.classList.add('sh');setTimeout(()=>t.classList.remove('sh'),2500);}
};

// ===== 4. XP Boost Events =====
function isXPBoostActive(){
  const now=new Date();
  const day=now.getDay();
  return day===0||day===6;
}

function getBoostTimeLeft(){
  const now=new Date();
  const day=now.getDay();
  if(day===6){
    const end=new Date(now);end.setDate(end.getDate()+(7-day));end.setHours(0,0,0,0);
    return end-now;
  }else if(day===0){
    const end=new Date(now);end.setDate(end.getDate()+1);end.setHours(0,0,0,0);
    return end-now;
  }
  const nextSat=new Date(now);nextSat.setDate(nextSat.getDate()+(6-day));nextSat.setHours(0,0,0,0);
  return nextSat-now;
}

function formatMs(ms){
  const h=Math.floor(ms/3600000);
  const m=Math.floor((ms%3600000)/60000);
  return h+'h '+m+'m';
}

function renderXPBoost(){
  const active=isXPBoostActive();
  const timeLeft=getBoostTimeLeft();
  let h='<div class="v6-boost">';
  if(active){
    h+='<div class="v6-boost-title">\u{1F525} 주말 XP 2배 부스트 활성화!</div>';
    h+='<div class="v6-boost-timer">⌛ '+formatMs(timeLeft)+' 남음</div>';
    h+='<div class="v6-boost-desc">모든 학습 활동에서 XP를 2배 획득하세요!</div>';
  }else{
    h+='<div class="v6-boost-title">\u{1F4C5} 다음 XP 부스트</div>';
    h+='<div class="v6-boost-timer">'+formatMs(timeLeft)+' 후</div>';
    h+='<div class="v6-boost-desc">주말(토/일)에 XP 2배 부스트가 활성화됩니다!</div>';
  }
  h+='</div>';
  return h;
}

// ===== 5. Daily Quiz Challenge =====
function getDailyKey(){
  const d=new Date();
  return 'daily-'+d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}

function getDailySeed(){
  const key=getDailyKey();
  let h=0;for(let i=0;i<key.length;i++){h=((h<<5)-h)+key.charCodeAt(i);h|=0;}
  return Math.abs(h);
}

function getDailyQuizzes(){
  const seed=getDailySeed();
  const allQ=window.QUIZ||[];
  if(allQ.length<5)return allQ.slice(0,5);
  const selected=[];const used=new Set();
  for(let i=0;i<5;i++){
    let idx=(seed*(i+7)+i*31)%allQ.length;
    let attempts=0;
    while(used.has(idx)&&attempts<50){idx=(idx+1)%allQ.length;attempts++;}
    used.add(idx);selected.push(allQ[idx]);
  }
  return selected;
}

let v6DailyState=null;

function getDailyState(){
  if(v6DailyState)return v6DailyState;
  const u=U();
  const key=getDailyKey();
  if(u.dailyChallenge&&u.dailyChallenge.key===key){
    v6DailyState=u.dailyChallenge;
  }else{
    v6DailyState={key:key,answers:[],score:0,done:false,startTime:0};
  }
  return v6DailyState;
}

function saveDailyState(){
  const u=U();u.dailyChallenge=v6DailyState;S(u);
}

function renderDailyChallenge(){
  const state=getDailyState();
  const quizzes=getDailyQuizzes();

  let h='<div class="v6-daily" id="v6dailyWrap"><div class="v6-daily-header">';
  h+='<span class="v6d-icon" style="color:var(--gd)"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-bolt"/></svg></span>';
  h+='<div class="v6d-info"><div class="v6d-title">오늘의 퀵즈 도전</div>';
  h+='<div class="v6d-sub">5문제 실력 테스트</div></div>';

  if(state.done){
    h+='</div>';
    h+='<div class="v6-daily-result">';
    h+='<div class="v6dr-score">'+state.score+'/5</div>';
    h+='<div class="v6dr-label">오늘의 도전 완료! +'+(state.score*20)+' XP, +'+(state.score*3)+' 💎</div>';
    h+='</div></div>';
    return h;
  }

  const currentIdx=state.answers.length;
  h+='<span class="v6-daily-timer">'+currentIdx+'/5</span></div>';

  if(currentIdx<5){
    const q=quizzes[currentIdx];
    if(q){
      h+='<div class="v6-daily-q"><div class="v6dq-num">Q'+(currentIdx+1)+'</div>';
      h+='<div class="v6dq-text">'+q.q+'</div>';
      h+='<div class="v6dq-opts">';
      var _ord=q.a.map(function(_,i){return i;});for(var _k=_ord.length-1;_k>0;_k--){var _j=Math.random()*(_k+1)|0,_t=_ord[_k];_ord[_k]=_ord[_j];_ord[_j]=_t;}
      _ord.forEach(function(oi){
        h+='<button onclick="v6DailyAnswer('+oi+','+q.c+')">'+q.a[oi]+'</button>';
      });
      h+='</div></div>';
    }
  }
  h+='</div>';
  return h;
}

window.v6DailyAnswer=function(selected,correct){
  const state=getDailyState();
  if(state.done)return;
  const isCorrect=selected===correct;
  if(isCorrect)state.score++;
  state.answers.push({selected,correct,isCorrect});

  const btns=document.querySelectorAll('#v6dailyWrap .v6dq-opts button');
  btns.forEach((b,i)=>{
    b.disabled=true;
    if(i===correct)b.classList.add('correct');
    if(i===selected&&!isCorrect)b.classList.add('wrong');
  });

  if(state.answers.length>=5){
    state.done=true;
    saveDailyState();
    const xpEarned=state.score*20;
    const gemsEarned=state.score*3;
    v6EarnGems(gemsEarned);
    v6sfx('daily_done');
    if(state.score>=4&&typeof v5Confetti==='function')v5Confetti(2000);
    setTimeout(()=>{
      const wrap=_el('v6dailyWrap');
      if(wrap)wrap.outerHTML=renderDailyChallenge();
    },1200);
  }else{
    saveDailyState();
    v6sfx(isCorrect?'flash_correct':'daily_start');
    setTimeout(()=>{
      const wrap=_el('v6dailyWrap');
      if(wrap)wrap.outerHTML=renderDailyChallenge();
    },800);
  }
};

// ===== 6. Subject Progress Dashboard =====
const SUBJ_COLORS={
  '수학':'#3b82f6','과학':'#22c55e','한국사':'#ef4444',
  '코딩':'#8b5cf6','영어':'#06d6a0','음악':'#f97316',
  '체육':'#eab308','미술':'#ec4899','사회':'#14b8a6',
  '경제':'#a855f7','건강':'#10b981','안전':'#f43f5e',
  '역사':'#f59e0b','세계사':'#6366f1'
};

function renderSubjectProgress(){
  const u=U();
  const stats=u.stats||{};
  const byCategory=stats.quizByCategory||{};
  const subjects=['수학','과학','한국사','코딩','영어','음악','체육','미술','사회','경제','건강'];
  const icons={'수학':'🔢','과학':'🔬','한국사':'🇰🇷','코딩':'💻','영어':'🔤','음악':'🎵','체육':'⚽','미술':'🎨','사회':'🏘','경제':'📈','건강':'💚'};

  let h='<div class="v6-subj-progress"><div class="sec"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-chart"/></svg> 과목별 진도</div>';
  subjects.forEach(s=>{
    const cat=byCategory[s]||{total:0,correct:0};
    const pct=cat.total>0?Math.round(cat.correct/cat.total*100):0;
    const color=SUBJ_COLORS[s]||'#8b5cf6';
    h+='<div class="v6-subj-row">';
    h+='<span class="v6-subj-icon" style="color:'+color+'">'+window.ico(s,icons[s]||'📖')+'</span>';
    h+='<span class="v6-subj-name">'+s+'</span>';
    h+='<div class="v6-subj-bar"><div class="v6-subj-fill" style="width:'+pct+'%;background:'+color+'"></div></div>';
    h+='<span class="v6-subj-pct" style="color:'+color+'">'+pct+'%</span>';
    h+='</div>';
  });
  h+='</div>';
  return h;
}

// ===== 7. Avatar System =====
const AVATARS=['🧑‍🎓','👨‍💻','👩‍🔬','🧑‍🎨','👨‍🏫','👩‍🚀','🦸','🦹','🧙','🧚','🤖','👻','🐼','🦁','🦊','🐧','🦉','🦄','🐉','🌟'];

const TITLES=[
  {id:'beginner',name:'초보 학습자',req:0},
  {id:'explorer',name:'탐험가',req:5},
  {id:'scholar',name:'학자',req:10},
  {id:'expert',name:'전문가',req:15},
  {id:'master',name:'마스터',req:20},
  {id:'legend',name:'전설',req:30},
  {id:'champion',name:'챔피언',req:50}
];

function getAvatar(){return U().avatar||AVATARS[0];}
function getTitle(){
  const u=U();const lv=u.level||1;
  let title=TITLES[0];
  TITLES.forEach(t=>{if(lv>=t.req)title=t;});
  return u.customTitle||title.name;
}

function renderAvatarCard(){
  const u=U();
  const avatar=getAvatar();
  const title=getTitle();
  const name=u.nickname||'학습자';
  const lv=u.level||1;
  const bg=SUBJ_COLORS['코딩']||'#8b5cf6';

  let h='<div class="v6-avatar-wrap" onclick="v6ShowAvatarPicker()">';
  h+='<div class="v6-avatar-circle" style="background:linear-gradient(135deg,'+bg+'22,'+bg+'11)">'+avatar+'</div>';
  h+='<div class="v6-avatar-info">';
  h+='<div class="v6-avatar-name">'+name+'</div>';
  h+='<div class="v6-avatar-title"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-medal"/></svg> '+title+'</div>';
  h+='<div class="v6-avatar-level">Lv.'+lv+' • '+(u.xp||0)+' XP • '+(u.gems||0)+' 💎</div>';
  h+='</div></div>';
  return h;
}

window.v6ShowAvatarPicker=function(){
  v6sfx('avatar');
  const u=U();const currentAvatar=u.avatar||AVATARS[0];
  const lv=u.level||1;
  let h='<div class="v6-avatar-picker" id="v6avatarPicker" onclick="if(event.target===this)this.remove()">';
  h+='<div class="v6-avatar-modal">';
  h+='<div style="font-size:14px;font-weight:800;margin-bottom:4px">🎨 프로필 커스터마이즈</div>';
  h+='<div style="font-size:10px;color:var(--t3);margin-bottom:8px">아바타를 선택하세요</div>';
  h+='<div class="v6-avatar-grid">';
  AVATARS.forEach(a=>{
    const sel=a===currentAvatar?' selected':'';
    h+='<div class="v6-avatar-opt'+sel+'" onclick="v6SelectAvatar(\''+a+'\')">'+a+'</div>';
  });
  h+='</div>';
  h+='<div style="font-size:12px;font-weight:700;margin-top:14px">🏅 칭호 선택</div>';
  h+='<div class="v6-title-grid">';
  TITLES.forEach(t=>{
    const unlocked=lv>=t.req;
    const sel=(u.customTitle||getTitle())===t.name?' selected':'';
    const cls=unlocked?(sel):' locked';
    h+='<div class="v6-title-opt'+cls+'" '+(unlocked?'onclick="v6SelectTitle(\''+t.name+'\')"':'title="Lv.'+t.req+' 필요"')+'>'+t.name+(unlocked?'':' 🔒')+'</div>';
  });
  h+='</div>';
  h+='<button class="bt bs" style="width:100%;margin-top:12px" onclick="document.getElementById(\'v6avatarPicker\').remove()">닫기</button>';
  h+='</div></div>';
  document.body.insertAdjacentHTML('beforeend',h);
};

window.v6SelectAvatar=function(avatar){
  const u=U();u.avatar=avatar;S(u);v6sfx('avatar');
  document.querySelectorAll('.v6-avatar-opt').forEach(el=>{
    el.classList.toggle('selected',el.textContent===avatar);
  });
  const circle=document.querySelector('.v6-avatar-circle');
  if(circle)circle.textContent=avatar;
};

window.v6SelectTitle=function(title){
  const u=U();u.customTitle=title;S(u);v6sfx('avatar');
  document.querySelectorAll('.v6-title-opt').forEach(el=>{
    el.classList.toggle('selected',el.textContent.replace(' 🔒','')===title);
  });
  const titleEl=document.querySelector('.v6-avatar-title');
  if(titleEl)titleEl.textContent='🏅 '+title;
  const t=_el('tst');
  if(t){t.textContent='🏅 칭호: '+title;t.classList.add('sh');setTimeout(()=>t.classList.remove('sh'),2000);}
};

// ===== 8. New Learning Stories (3 more) =====
const V6_STORIES=[
  {id:'music_adventure',title:'🎵 음악의 모험',cat:'음악',scenes:[
    {speaker:'음악선생님',text:'음악에서 가장 기본적인 음표는 뭐일까?',choices:[{text:'온음표요!',correct:true,reply:'맞아! 온음표는 4박자 길이의 기본 음표란다.'},{text:'쉬표요?',correct:false,reply:'쉬표는 소리를 멈추는 거야. 기본 음표는 온음표란다.'}]},
    {speaker:'음악선생님',text:'피아노의 흰 건반과 검은 건반을 합치면 몇 개일까?',choices:[{text:'88개요!',correct:true,reply:'정확해! 52개 흰 건반 + 36개 검은 건반 = 88개란다.'},{text:'64개요?',correct:false,reply:'64개는 아니야! 표준 피아노는 88개 건반이란다.'}]},
    {speaker:'음악선생님',text:'베토벤의 “운명 교향곡”은 몇 번 교향곡일까?',choices:[{text:'5번이요!',correct:true,reply:'맞아! 교향곡 5번은 베토벤의 걸작이란다.'},{text:'9번이요?',correct:false,reply:'9번은 “합창” 교향곡이야. 운명은 5번이란다.'}]}
  ]},
  {id:'sports_world',title:'⚽ 스포츠 세계 탐험',cat:'체육',scenes:[
    {speaker:'코치님',text:'올림픽의 모토는 뭔지 알고 있니?',choices:[{text:'더 빠르게, 더 높이, 더 힘차게요!',correct:true,reply:'정확해! Citius, Altius, Fortius – 라틴어로 된 모토란다.'},{text:'승리와 명예요?',correct:false,reply:'그것도 중요하지만, 공식 모토는 "더 빠르게, 더 높이, 더 힘차게"란다.'}]},
    {speaker:'코치님',text:'축구 경기에서 한 팀의 선수는 몇 명이지?',choices:[{text:'11명이요!',correct:true,reply:'맞아! 골키포 함 11명이란다.'},{text:'9명이요?',correct:false,reply:'9명은 야구야! 축구는 11명이란다.'}]},
    {speaker:'코치님',text:'농구 코트의 링 높이는 몇 m일까?',choices:[{text:'3.05m요!',correct:true,reply:'정확해! NBA 기준 10피트 = 3.05m란다.'},{text:'2.5m요?',correct:false,reply:'좀 더 높아! 농구 링 높이는 3.05m란다.'}]}
  ]},
  {id:'art_history',title:'🎨 미술 시간 여행',cat:'미술',scenes:[
    {speaker:'큐레이터',text:'모나리자가 전시된 미술관은 어디일까?',choices:[{text:'루브르 미술관이요!',correct:true,reply:'맞아! 프랑스 파리의 루브르에 있어.'},{text:'메트로폴리탄 미술관이요?',correct:false,reply:'메트로폴리탄은 무적의 신전이 유명해. 모나리자는 루브르야!'}]},
    {speaker:'큐레이터',text:'한국의 전통 민화의 대표적인 소재는?',choices:[{text:'호랑이와 까치요!',correct:true,reply:'정확해! 호랑이는 장수, 까치는 행운을 상징해.'},{text:'용과 봉황이요?',correct:false,reply:'용과 봉황도 있지만 가장 대표적인 건 호랑이와 까치란다.'}]},
    {speaker:'큐레이터',text:'인상파 화가의 대표작 "인상, 해돋이"의 화가는?',choices:[{text:'클로드 모네요!',correct:true,reply:'맞아! 모네는 인상파 운동을 시작한 위대한 화가야.'},{text:'반 고흐요?',correct:false,reply:'반 고흐는 후기인상파야. 인상파의 시작은 모네란다.'}]}
  ]}
];

function injectV6Stories(){
  if(window.STORIES&&Array.isArray(window.STORIES)){
    V6_STORIES.forEach(s=>{if(!window.STORIES.find(x=>x.id===s.id))window.STORIES.push(s);});
  }
}

// ===== 9. New Quiz Content (50 questions) =====
const V6_QUIZZES=[
  {q:'소수(Prime)의 정의는?',a:['1보다 큰 자연수 중 1과 자기 자신만으로 나누어지는 수','짝수가 아닌 수','10보다 큰 수','음수가 아닌 수'],c:0,cat:'수학'},
  {q:'원의 넓이 공식은?',a:['πr²','2πr','πd','r²/2'],c:0,cat:'수학'},
  {q:'직각삼각형의 빗변을 구하는 정리는?',a:['피타고라스 정리','유클리드 정리','뉴턴 법칙','베르누이 법칙'],c:0,cat:'수학'},
  {q:'로그₂ 8 = ?',a:['3','4','2','8'],c:0,cat:'수학'},
  {q:'100의 제곱근은?',a:['10','50','100','25'],c:0,cat:'수학'},
  {q:'원자의 구성 요소가 아닌 것은?',a:['분자','양성자','중성자','전자'],c:0,cat:'과학'},
  {q:'지구의 대기에서 가장 많은 기체는?',a:['질소(78%)','산소(21%)','이산화탄소','아르곤'],c:0,cat:'과학'},
  {q:'DNA의 전체 이름은?',a:['Deoxyribonucleic Acid','Dynamic Nuclear Atom','Digital Network Array','Data Nucleotide Assembly'],c:0,cat:'과학'},
  {q:'광합성에서 만들어지는 기체는?',a:['산소','이산화탄소','질소','수소'],c:0,cat:'과학'},
  {q:'이산화탄소의 화학식은?',a:['CO₂','H₂O','O₂','NaCl'],c:0,cat:'과학'},
  {q:'경복궁을 건축한 왕은?',a:['태조 이성계','세종대왕','영조','정조'],c:0,cat:'한국사'},
  {q:'병자호란 이 발생한 년도는?',a:['1636년','1592년','1446년','1910년'],c:0,cat:'한국사'},
  {q:'기미독립선언서를 작성한 사람은?',a:['최남선','이봉창','안창호','윤봉길'],c:0,cat:'한국사'},
  {q:'6.25 전쟁이 시작된 년도는?',a:['1950년','1945년','1960년','1953년'],c:0,cat:'한국사'},
  {q:'고려를 건국한 사람은?',a:['왕건','uC774성계','박혁거세','군초고왕'],c:0,cat:'한국사'},
  {q:'for 문의 3요소는?',a:['초기화, 조건, 증감','입력, 처리, 출력','시작, 반복, 끝','변수, 함수, 반환'],c:0,cat:'코딩'},
  {q:'JavaScript에서 null과 undefined의 차이는?',a:['의도적 빈값 vs 할당되지 않음','문자열 vs 숫자','객체 vs 배열','차이 없음'],c:0,cat:'코딩'},
  {q:'배열의 인덱스는 몇부터 시작하나?',a:['0','1','2','-1'],c:0,cat:'코딩'},
  {q:'CSS에서 수직 중앙 정렬 방법은?',a:['flexbox align-items: center','text-align: center','float: center','margin: auto'],c:0,cat:'코딩'},
  {q:'Git에서 변경사항을 커밋하는 명령어는?',a:['git commit','git push','git add','git save'],c:0,cat:'코딩'},
  {q:'Present Perfect의 형태는?',a:['have/has + 과거분사','will + 동사원형','be + ~ing','did + 동사원형'],c:0,cat:'영어'},
  {q:'Synonym의 뜻은?',a:['유의어','반의어','동음이의어','존칭어'],c:0,cat:'영어'},
  {q:'I ____ to school every day.의 빈칸에 알맞은 것은?',a:['go','goes','going','went'],c:0,cat:'영어'},
  {q:'Onomatopoeia의 뜻은?',a:['의성어/의태어','비유','역설','수사'],c:0,cat:'영어'},
  {q:'"She speaks fluently"에서 fluently의 품사는?',a:['부사','형용사','명사','동사'],c:0,cat:'영어'},
  {q:'하나의 옥타브는 몇 음으로 구성되나?',a:['8음','7음','12음','5음'],c:0,cat:'음악'},
  {q:'알레그로(allegro)의 뜻은?',a:['빠르게','느리게','여리게','세게'],c:0,cat:'음악'},
  {q:'바이올린의 현은 몇 개인가?',a:['4개','6개','3개','5개'],c:0,cat:'음악'},
  {q:'포르테(forte)의 기호는?',a:['f','p','m','s'],c:0,cat:'음악'},
  {q:'칼 오르프의 대표곡은?',a:['카르미나 부라나','볼레로','백조의 호수','교향곡 5번'],c:0,cat:'음악'},
  {q:'농구의 쿼터 경기 시간은?',a:['10분 (NBA 12분)','15분','20분','8분'],c:0,cat:'체육'},
  {q:'배드민턴 더블스 한 팀의 인원은?',a:['2명','3명','1명','4명'],c:0,cat:'체육'},
  {q:'수영에서 가장 빠른 영법은?',a:['자유형','배영','평영','버터플라이'],c:0,cat:'체육'},
  {q:'마라톤 경기의 거리는?',a:['42.195km','21km','50km','100km'],c:0,cat:'체육'},
  {q:'물감을 물에 풀어 그리는 대표적인 미술 기법은?',a:['수채화','유화','판화','프레스코화'],c:0,cat:'미술'},
  {q:'색의 3원색은?',a:['빨강/파랑/노랑','빨강/초록/파랑','빨강/보라/노랑','파랑/초록/보라'],c:0,cat:'미술'},
  {q:'로댕의 “생각하는 사람”은 어느 장르의 작품인가?',a:['조각','회화','판화','부조'],c:0,cat:'미술'},
  {q:'민주주의의 3대 원칙에 해당하지 않는 것은?',a:['세습제','국민주권','권력분립','기본권 보장'],c:0,cat:'사회'},
  {q:'유네스코의 본부가 있는 도시는?',a:['파리','뉴욕','제네바','런던'],c:0,cat:'사회'},
  {q:'인구가 가장 많은 나라는?',a:['인도','중국','미국','인도네시아'],c:0,cat:'사회'},
  {q:'수요와 공급의 법칙에서 가격이 오르면?',a:['수요 감소, 공급 증가','수요 증가, 공급 감소','수요/공급 모두 증가','변화 없음'],c:0,cat:'경제'},
  {q:'복리의 특징은?',a:['이자에 이자가 붙음','원금에만 이자','0% 이자','세금 면제'],c:0,cat:'경제'},
  {q:'환율이 오르면 수입품 가격은?',a:['상승','하락','변동 없음','무관'],c:0,cat:'경제'},
  {q:'하루 권장 수면 시간은 (성인)?',a:['7~9시간','4~5시간','10~12시간','3~4시간'],c:0,cat:'건강'},
  {q:'비타민 C가 풍부한 과일은?',a:['딸기/키위','바나나','사과','포도'],c:0,cat:'건강'},
  {q:'운동 전 반드시 해야 하는 것은?',a:['스트레칭/워밍업','고강도 운동','물 많이 먹기','밥 먹기'],c:0,cat:'건강'},
  {q:'화재 시 대피 순서로 올바른 것은?',a:['경보 → 대피 → 신고','신고 → 대피 → 경보','대피 → 경보 → 신고','신고만 하면 됨'],c:0,cat:'안전'},
  {q:'지진 발생 시 실외에서의 행동은?',a:['넓은 곳으로 대피','건물 안으로 대피','차를 타고 이동','다리 위에 서기'],c:0,cat:'안전'},
  {q:'정조대왕이 세운 성곽은?',a:['수원화성','경복궁','불국사','해인사'],c:0,cat:'한국사'}
];

// ===== 10. New Badges (12 more, 40→52) =====
const V6_BADGES=[
  {id:'cert_first',nm:'첫 증명서',ic:'🎓',desc:'증명서 1개 발급',check:u=>((u.certsEarned||[]).length>=1)},
  {id:'flash_10',nm:'플래시 학습자',ic:'📚',desc:'플래시카드 10회',check:u=>((u.flashStats||{}).reviewed||0)>=10},
  {id:'flash_master',nm:'플래시 마스터',ic:'🧠',desc:'플래시카드 10개 숙달',check:u=>((u.flashStats||{}).mastered||0)>=10},
  {id:'gem_100',nm:'보석 수집가',ic:'💎',desc:'보석 100개',check:u=>(u.gems||0)>=100},
  {id:'gem_500',nm:'보석 부자',ic:'💰',desc:'보석 500개',check:u=>(u.gems||0)>=500},
  {id:'daily_1',nm:'첫 도전',ic:'⚡',desc:'일일 도전 1회',check:u=>!!(u.dailyChallenge&&u.dailyChallenge.done)},
  {id:'daily_perfect',nm:'퍼펙트 도전',ic:'🏆',desc:'일일 5/5 달성',check:u=>{const d=u.dailyChallenge;return d&&d.done&&d.score===5;}},
  {id:'avatar_set',nm:'패션니스타',ic:'🎨',desc:'아바타 변경',check:u=>!!u.avatar},
  {id:'quiz_300',nm:'퀵즈 300',ic:'📝',desc:'300문제 풀기',check:u=>(u.quizTotal||0)>=300},
  {id:'xp_5000',nm:'XP 5천',ic:'⭐',desc:'5000 XP 달성',check:u=>(u.xp||0)>=5000},
  {id:'streak_14',nm:'2주 연속',ic:'🔥',desc:'14일 연속 학습',check:u=>(u.streakDays||0)>=14},
  {id:'v6_all',nm:'올라운더',ic:'🌟',desc:'v6 기능 전부 사용',check:u=>{return(u.certsEarned||[]).length>0&&((u.flashStats||{}).reviewed||0)>0&&!!u.avatar&&!!(u.dailyChallenge&&u.dailyChallenge.done);}}
];

function v6CheckBadges(){
  const u=U();if(!u.v6badges)u.v6badges=[];
  let newBadge=null;
  V6_BADGES.forEach(b=>{
    if(!u.v6badges.includes(b.id)&&b.check(u)){u.v6badges.push(b.id);newBadge=b;}
  });
  if(newBadge){
    S(u);
    v6sfx('daily_done');
    if(typeof v5Confetti==='function')v5Confetti(2000);
    const t=_el('tst');
    if(t){t.innerHTML=newBadge.ic+' 배지 획득: '+newBadge.nm;t.classList.add('sh');setTimeout(()=>t.classList.remove('sh'),2500);}
  }else{S(u);}
}

function renderV6Badges(){
  const u=U();const earned=u.v6badges||[];
  let h='';
  V6_BADGES.forEach(b=>{
    const has=earned.includes(b.id);
    h+='<div class="v4-badge'+(has?' earned':'')+'" title="'+b.desc+'"><div class="badge-icon">'+b.ic+'</div><div class="badge-name">'+b.nm+'</div></div>';
  });
  return h;
}

// ===== Push new quizzes =====
function pushV6Quizzes(){
  if(window.QUIZ&&Array.isArray(window.QUIZ)){
    V6_QUIZZES.forEach(q=>{if(!window.QUIZ.find(x=>x.q===q.q))window.QUIZ.push(q);});
  }
}

// ===== Inject into Home Page =====
function v6InjectHome(){
  const p0=_el('p0');if(!p0)return;
  const footer=p0.querySelector('[style*="margin-top:24px"]');
  if(!footer)return;
  const insertPoint=footer;

  const avatarDiv=document.createElement('div');
  avatarDiv.innerHTML=renderAvatarCard();
  insertPoint.parentNode.insertBefore(avatarDiv,insertPoint);

  const gemDiv=document.createElement('div');
  gemDiv.innerHTML=renderGemBar();
  insertPoint.parentNode.insertBefore(gemDiv,insertPoint);

  const boostDiv=document.createElement('div');
  boostDiv.innerHTML=renderXPBoost();
  insertPoint.parentNode.insertBefore(boostDiv,insertPoint);

  const dailyDiv=document.createElement('div');
  dailyDiv.innerHTML=renderDailyChallenge();
  insertPoint.parentNode.insertBefore(dailyDiv,insertPoint);

  const flashDiv=document.createElement('div');
  flashDiv.innerHTML=renderFlashcards();
  insertPoint.parentNode.insertBefore(flashDiv,insertPoint);

  const subjDiv=document.createElement('div');
  subjDiv.innerHTML=renderSubjectProgress();
  insertPoint.parentNode.insertBefore(subjDiv,insertPoint);

  const certDiv=document.createElement('div');
  certDiv.innerHTML=renderCertSection();
  insertPoint.parentNode.insertBefore(certDiv,insertPoint);
}

// ===== Inject v6 badges into Profile Page =====
function v6InjectProfile(){
  const p4=_el('p4');if(!p4)return;
  const existing=p4.querySelector('.v6-badge-section');if(existing)return;
  const target=p4.querySelector('.v5-badge-section')||p4.querySelector('.v4-badge-section')||p4.querySelector('[style*="background:var(--c1)"]');
  if(target){
    const badgeDiv=document.createElement('div');badgeDiv.className='v6-badge-section';
    badgeDiv.innerHTML='<div style="margin-bottom:10px"><div class="sec"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-star"/></svg> 도전과 수집 배지 ('+((U().v6badges||[]).length)+'/'+V6_BADGES.length+')</div><div class="v4-badge-grid">'+renderV6Badges()+'</div></div>';
    target.parentNode.insertBefore(badgeDiv,target.nextSibling);
  }
}

// ===== Gem rewards for existing actions =====
const origChkAv6=window.chkA;
if(typeof origChkAv6==='function'){
  window.chkA=function(btn,ok){
    origChkAv6.call(this,btn,ok);
    if(ok===0){
      v6EarnGems(isXPBoostActive()?4:2);
    }
    v6CheckBadges();
  };
}

// ===== Keyboard Shortcuts =====
document.addEventListener('keydown',function(e){
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
  if(e.shiftKey&&e.key==='F'){e.preventDefault();const c=document.querySelector('.v6-flash-card');if(c)c.click();}
  if(e.shiftKey&&e.key==='D'){e.preventDefault();const w=_el('v6dailyWrap');if(w)w.scrollIntoView({behavior:'smooth'});}
  if(e.shiftKey&&e.key==='G'){e.preventDefault();v6ShowGemInfo();}
  if(e.shiftKey&&e.key==='A'){e.preventDefault();v6ShowAvatarPicker();}
  if(e.shiftKey&&e.key==='E'){e.preventDefault();v6ShowCertificate('나의 학습',(U().level||1),(U().xp||0));}
});

// ===== Init =====
function v6Init(){
  injectV6Stories();
  pushV6Quizzes();
  v6InjectHome();
  v6InjectProfile();
  v6CheckBadges();

  const u=U();
  if(isXPBoostActive()&&!u._v6BoostNotified){
    setTimeout(()=>{
      v6sfx('boost');
      const t=_el('tst');
      if(t){t.textContent='🔥 주말 XP 2배 부스트 활성화!';t.classList.add('sh');setTimeout(()=>t.classList.remove('sh'),3000);}
      u._v6BoostNotified=getDailyKey();S(u);
    },2000);
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',v6Init);
else setTimeout(v6Init,200);
})();
