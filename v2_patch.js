// LevelPlay v2.0 Patch - Modular plugin injected by Service Worker
// Features: weekly challenges, certificate, offline indicator, subject mastery,
// study reminder, skip-to-content, print styles, prefers-color-scheme, footer
(function(){
'use strict';

// ===== 1. Inject CSS =====
const css=document.createElement('style');
css.textContent=`
.skip-link{position:absolute;top:-100%;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#8b5cf6,#06d6a0);color:#fff;padding:8px 20px;border-radius:0 0 8px 8px;font-size:13px;font-weight:700;z-index:12000;transition:top .2s}.skip-link:focus{top:0}
.offline-bar{position:fixed;top:0;left:0;right:0;background:linear-gradient(135deg,#78350f,#92400e);color:#fbbf24;text-align:center;font-size:11px;font-weight:700;padding:6px;z-index:11500;transform:translateY(-100%);transition:transform .3s;display:flex;align-items:center;justify-content:center;gap:6px}.offline-bar.show{transform:translateY(0)}
.subj-mastery{margin-top:6px}.subj-mastery-bar{height:4px;background:rgba(139,92,246,.1);border-radius:2px;overflow:hidden}.subj-mastery-fill{height:100%;background:linear-gradient(135deg,#8b5cf6,#06d6a0);border-radius:2px;transition:width .6s}.subj-mastery-label{font-size:8px;color:var(--t3);margin-top:2px;text-align:right}
.cert-modal{position:fixed;inset:0;z-index:8500;background:rgba(0,0,0,.9);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:16px;animation:v2FadeIn .3s}
@keyframes v2FadeIn{from{opacity:0}to{opacity:1}}
.cert-modal canvas{border-radius:8px;max-width:100%;box-shadow:0 8px 32px rgba(139,92,246,.3)}
.cert-actions{display:flex;gap:8px;margin-top:12px}
.wc-card{background:linear-gradient(135deg,var(--c1,#111127),rgba(139,92,246,.08));border:1.5px solid rgba(139,92,246,.2);border-radius:12px;padding:14px;margin-bottom:10px}
.wc-item{display:flex;align-items:center;gap:8px;padding:5px 0;font-size:11px}
.wc-item .wc-check{width:18px;height:18px;border-radius:50%;border:2px solid var(--t3,#8892a4);display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0}
.wc-item.done .wc-check{background:#8b5cf6;border-color:#8b5cf6;color:#fff}
.wc-item.done{color:var(--t3,#8892a4);text-decoration:line-through}
.wc-progress{height:6px;background:var(--bg,#0a0a1a);border-radius:3px;margin-top:8px;overflow:hidden}
.wc-progress-bar{height:100%;background:linear-gradient(90deg,#8b5cf6,#06d6a0);border-radius:3px;transition:width .4s}
.wc-reward{font-size:10px;color:#fbbf24;font-weight:700;margin-top:6px;text-align:center}
.app-footer-v2{background:var(--c1,#111127);border-top:1px solid rgba(139,92,246,.08);padding:16px;margin:20px -10px 0;text-align:center;font-size:9px;color:var(--t3,#8892a4);line-height:1.8}
.app-footer-v2 .ft-ver{font-weight:700;color:#8b5cf6;font-size:10px}
.app-footer-v2 .ft-stats{display:flex;justify-content:center;gap:12px;margin:4px 0;flex-wrap:wrap}
.app-footer-v2 .ft-stats span{display:flex;align-items:center;gap:3px}
@media print{nav,.fab,.tutor-fab,.tutor-panel,.toast,.skip-link,.offline-bar,.notif-btn,.share-btn,#splash,.onboard-overlay,.nk,.mo,.go,.battle-overlay,button{display:none!important}.pg{position:static!important;opacity:1!important;pointer-events:auto!important;transform:none!important;padding:10px!important}body,html{overflow:auto!important;height:auto!important;background:#fff!important;color:#000!important}:root{--bg:#fff;--c1:#f9f9f9;--c2:#f0f0f0;--tx:#000;--t2:#333;--t3:#666}.profile-card{background:#f0f0f0!important;color:#000!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
@media(prefers-color-scheme:light){:root:not(.dark):not(.light){--bg:#f5f5f5;--c1:#fff;--c2:#f0f0f0;--tx:#1a1a2e;--t2:#555;--t3:#888}:root:not(.dark):not(.light) nav{background:rgba(245,245,245,.97);border-top:1px solid rgba(139,92,246,.15)}}
`;
document.head.appendChild(css);

// ===== 2. Inject HTML elements =====
function injectHTML(){
  // Skip-to-content
  if(!document.querySelector('.skip-link')){
    const skip=document.createElement('a');
    skip.href='#app';skip.className='skip-link';skip.tabIndex=0;
    skip.textContent='메인 콘텐츠로 건너뛰기';
    document.body.prepend(skip);
  }
  // Offline banner
  if(!document.getElementById('offlineBarV2')){
    const bar=document.createElement('div');
    bar.className='offline-bar';bar.id='offlineBarV2';
    bar.innerHTML='⚠️ 오프라인 모드 - 일부 기능이 제한됩니다';
    document.body.prepend(bar);
  }
  // Weekly challenge area in home page
  const missionArea=document.getElementById('dailyMissionArea');
  if(missionArea&&!document.getElementById('weeklyChallengeArea')){
    const wc=document.createElement('div');
    wc.id='weeklyChallengeArea';
    missionArea.parentNode.insertBefore(wc,missionArea.nextSibling);
  }
  // Certificate button in profile
  const shareBtn=document.querySelector('.share-btn[onclick*="shareProfile"]');
  if(shareBtn&&!document.getElementById('certBtnV2')){
    const certBtn=document.createElement('button');
    certBtn.id='certBtnV2';
    certBtn.className='share-btn';
    certBtn.setAttribute('aria-label','수료증 발급');
    certBtn.style.cssText='border-color:rgba(251,191,36,.25);color:#fbbf24;margin-left:6px';
    certBtn.innerHTML='🏅 수료증 발급';
    certBtn.onclick=generateCertificate;
    shareBtn.parentNode.appendChild(certBtn);
  }
  // Notification opt-in in settings (before shortcuts)
  const shortcutDiv=document.querySelector('[data-i18n="shortcuts"]');
  if(shortcutDiv&&!document.getElementById('notifOptArea')){
    const container=shortcutDiv.closest('div[style*="border-top"]');
    if(container){
      const area=document.createElement('div');
      area.id='notifOptArea';
      area.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:10px;border-top:1px solid rgba(139,92,246,.08)"><span style="font-size:12px;font-weight:600">학습 알림</span><button class="bt bp" id="notifOptBtn" style="font-size:10px;padding:4px 10px">알림 켜기</button></div><div style="font-size:9px;color:var(--t3);margin-top:4px">매일 학습 시간에 알림을 보내드려요</div>';
      container.parentNode.insertBefore(area,container);
      document.getElementById('notifOptBtn').onclick=toggleStudyReminder;
    }
  }
  // Enhanced footer in home page
  const homeFooter=document.querySelector('#p0 > div:last-child');
  if(homeFooter&&homeFooter.textContent.includes('v1.0.0')&&!document.getElementById('footerV2')){
    const footer=document.createElement('div');
    footer.id='footerV2';footer.className='app-footer-v2';
    footer.innerHTML='<div class="ft-ver">LevelPlay v2.0</div><div class="ft-stats" id="footerStatsV2"></div><div>PhET Interactive Simulations, University of Colorado Boulder (CC-BY 4.0)</div><div>YouTube 영상은 각 저작권자에게 귀속됩니다</div><div>© 2026 LevelPlay · Powered by AI</div>';
    homeFooter.replaceWith(footer);
  }
  // Profile page footer update
  const profFooter=document.querySelector('#p4 div[style*="border-top"][style*="text-align:center"]');
  if(profFooter&&profFooter.textContent.includes('v1.0.0')){
    profFooter.innerHTML='<div style="font-size:10px;font-weight:600;color:var(--t2)">LevelPlay v2.0</div><div style="font-size:8px;color:var(--t3);margin-top:2px">© 2026 · Powered by AI</div>';
  }
}

// ===== 3. Subject mastery bars =====
function getSubjectMastery(builtinKey){
  if(!builtinKey||typeof CURRICULUM==='undefined'||!CURRICULUM[builtinKey])return 0;
  var subj=CURRICULUM[builtinKey];
  var total=0;
  subj.units.forEach(function(u){u.lessons.forEach(function(){total++;});});
  if(typeof U!=='undefined'&&U.stats&&U.stats.lessonsBySubject){
    var ls=U.stats.lessonsBySubject[subj.nm]||0;
    if(total>0)return Math.min(Math.round(ls/total*100),100);
  }
  return 0;
}
function patchSubjectCards(){
  var grid=document.getElementById('subjectGrid');
  if(!grid)return;
  var cards=grid.querySelectorAll('.gc');
  if(typeof getSubjects==='undefined')return;
  var subjects=getSubjects();
  cards.forEach(function(card,i){
    if(i>=subjects.length)return;
    var s=subjects[i];
    if(!s.builtinKey||card.querySelector('.subj-mastery'))return;
    var mastery=getSubjectMastery(s.builtinKey);
    var div=document.createElement('div');
    div.className='subj-mastery';
    div.innerHTML='<div class="subj-mastery-bar"><div class="subj-mastery-fill" style="width:'+mastery+'%"></div></div><div class="subj-mastery-label">'+mastery+'%</div>';
    card.appendChild(div);
  });
}

// ===== 4. Weekly challenges =====
function getWeekNumber(){var d=new Date();var start=new Date(d.getFullYear(),0,1);return Math.ceil(((d-start)/86400000+start.getDay()+1)/7);}
function initWeeklyChallenge(){
  if(typeof U==='undefined')return;
  if(!U.weeklyChallenge)U.weeklyChallenge={week:0,tasks:[]};
  var cw=getWeekNumber();
  if(U.weeklyChallenge.week!==cw){
    var pool=[
      {type:'quiz_50',label:'이번 주 퀴즈 50문제 풀기',icon:'📝',goal:50,key:'quizTotal'},
      {type:'video_10',label:'이번 주 영상 10개 보기',icon:'📺',goal:10,key:'videoCount'},
      {type:'streak_5',label:'5일 연속 출석하기',icon:'🔥',goal:5,key:'streak'},
      {type:'lesson_10',label:'이번 주 레슨 10개 완료',icon:'📖',goal:10,key:'lessonCount'},
      {type:'game_5',label:'이번 주 게임 5회 플레이',icon:'🎮',goal:5,key:'gameCount'},
      {type:'battle_3',label:'이번 주 퀴즈 대결 3회',icon:'⚔️',goal:3,key:'battleCount'},
      {type:'xp_200',label:'이번 주 XP 200 획득',icon:'⭐',goal:200,key:'weekXP'}
    ];
    var seed=cw*31;var pick=[];var used={};
    for(var i=0;i<4&&i<pool.length;i++){var idx=(seed+i*7)%pool.length;if(!used[idx]){used[idx]=true;pick.push({type:pool[idx].type,label:pool[idx].label,icon:pool[idx].icon,goal:pool[idx].goal,key:pool[idx].key,progress:0,done:false});}else{for(var j=0;j<pool.length;j++){if(!used[j]){used[j]=true;pick.push({type:pool[j].type,label:pool[j].label,icon:pool[j].icon,goal:pool[j].goal,key:pool[j].key,progress:0,done:false});break;}}}}
    U.weeklyChallenge={week:cw,tasks:pick,startSnapshot:{quizTotal:U.quizTotal||0,videoCount:Object.keys(U.seen||{}).length,lessonCount:U.lessonCount||0,gameCount:U.gameCount||0,battleCount:U.battleLog?U.battleLog.length:0}};
    if(typeof sv==='function')sv();
  }
}
function updateWeeklyProgress(){
  if(typeof U==='undefined'||!U.weeklyChallenge||!U.weeklyChallenge.tasks)return;
  var snap=U.weeklyChallenge.startSnapshot||{};
  U.weeklyChallenge.tasks.forEach(function(t){
    if(t.key==='streak'){t.progress=Math.min(U.streak||0,t.goal);}
    else if(t.key==='quizTotal'){t.progress=Math.min((U.quizTotal||0)-(snap.quizTotal||0),t.goal);}
    else if(t.key==='videoCount'){t.progress=Math.min(Object.keys(U.seen||{}).length-(snap.videoCount||0),t.goal);}
    else if(t.key==='lessonCount'){t.progress=Math.min((U.lessonCount||0)-(snap.lessonCount||0),t.goal);}
    else if(t.key==='gameCount'){t.progress=Math.min((U.gameCount||0)-(snap.gameCount||0),t.goal);}
    else if(t.key==='battleCount'){t.progress=Math.min((U.battleLog?U.battleLog.length:0)-(snap.battleCount||0),t.goal);}
    else if(t.key==='weekXP'){var total=0;var now=new Date();var day=now.getDay();var diff=now.getDate()-day+(day===0?-6:1);for(var i=0;i<7;i++){var d=new Date(now.getFullYear(),now.getMonth(),diff+i);var k=d.toISOString().slice(0,10);total+=(U.dailyXP&&U.dailyXP[k])||0;}t.progress=Math.min(total,t.goal);}
    t.done=t.progress>=t.goal;
  });
}
function renderWeeklyChallenge(){
  var el=document.getElementById('weeklyChallengeArea');
  if(!el||typeof U==='undefined')return;
  if(!U.weeklyChallenge||!U.weeklyChallenge.tasks||U.weeklyChallenge.tasks.length===0){el.innerHTML='';return;}
  updateWeeklyProgress();
  var tasks=U.weeklyChallenge.tasks;
  var doneCount=tasks.filter(function(t){return t.done;}).length;
  var allDone=doneCount===tasks.length;
  var h='<div class="wc-card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div style="font-size:13px;font-weight:800;background:linear-gradient(135deg,#8b5cf6,#06d6a0);-webkit-background-clip:text;-webkit-text-fill-color:transparent">🎯 주간 챌린지</div><div style="font-size:9px;color:var(--t3)">'+doneCount+'/'+tasks.length+' 완료</div></div>';
  tasks.forEach(function(t){
    h+='<div class="wc-item'+(t.done?' done':'')+'">'+'<div class="wc-check">'+(t.done?'✓':'')+'</div>'+'<span>'+t.icon+' '+t.label+'</span>'+'<span style="margin-left:auto;font-size:9px;color:var(--t3)">'+t.progress+'/'+t.goal+'</span></div>';
  });
  var totalPct=tasks.length>0?Math.round(doneCount/tasks.length*100):0;
  h+='<div class="wc-progress"><div class="wc-progress-bar" style="width:'+totalPct+'%"></div></div>';
  if(allDone)h+='<div class="wc-reward">🎉 주간 챌린지 완료! +50 XP 보너스!</div>';
  h+='</div>';
  el.innerHTML=h;
  if(allDone&&!U.weeklyChallenge.rewarded&&typeof xp==='function'){U.weeklyChallenge.rewarded=true;xp(50,'주간 챌린지 완료 보너스');if(typeof sv==='function')sv();}
}

// ===== 5. Study reminder (Notification API) =====
function toggleStudyReminder(){
  if(typeof U==='undefined')return;
  if(!('Notification' in window)){if(typeof toast==='function')toast('이 브라우저는 알림을 지원하지 않습니다');return;}
  if(Notification.permission==='granted'){
    U.studyReminder=!U.studyReminder;if(typeof sv==='function')sv();
    updateReminderBtn();
    if(typeof toast==='function')toast(U.studyReminder?'학습 알림이 켜졌습니다':'학습 알림이 꺼졌습니다');
  }else if(Notification.permission==='denied'){
    if(typeof toast==='function')toast('브라우저에서 알림이 차단되어 있습니다');
  }else{
    Notification.requestPermission().then(function(p){
      if(p==='granted'){U.studyReminder=true;if(typeof sv==='function')sv();updateReminderBtn();if(typeof toast==='function')toast('학습 알림이 켜졌습니다');}
    });
  }
}
function updateReminderBtn(){
  var btn=document.getElementById('notifOptBtn');
  if(!btn||typeof U==='undefined')return;
  btn.textContent=U.studyReminder?'알림 끄기':'알림 켜기';
  btn.className=U.studyReminder?'bt bs':'bt bp';
  btn.style.fontSize='10px';btn.style.padding='4px 10px';
}
function checkStudyReminder(){
  if(typeof U==='undefined'||!U.studyReminder||!('Notification' in window)||Notification.permission!=='granted')return;
  var now=new Date();var h=now.getHours();
  var today=now.toISOString().slice(0,10);
  if(h>=18&&h<=20&&(!U.lastReminderDate||U.lastReminderDate!==today)){
    var dayXP=(U.dailyXP&&U.dailyXP[today])||0;
    if(dayXP===0){
      new Notification('LevelPlay 학습 알림',{body:'오늘 아직 학습을 시작하지 않았어요! 지금 시작해볼까요?'});
      U.lastReminderDate=today;if(typeof sv==='function')sv();
    }
  }
}

// ===== 6. Certificate generation =====
function generateCertificate(){
  if(typeof U==='undefined')return;
  var totalXP=U.lv>1?((U.lv-1)*(U.xm||500)+U.xp):U.xp;
  var canvas=document.createElement('canvas');
  canvas.width=800;canvas.height=500;
  var ctx=canvas.getContext('2d');
  var grd=ctx.createLinearGradient(0,0,800,500);
  grd.addColorStop(0,'#0a0a2e');grd.addColorStop(1,'#1a1a4a');
  ctx.fillStyle=grd;ctx.fillRect(0,0,800,500);
  ctx.strokeStyle='rgba(139,92,246,0.3)';ctx.lineWidth=3;ctx.strokeRect(20,20,760,460);
  ctx.strokeStyle='rgba(6,214,160,0.2)';ctx.lineWidth=1;ctx.strokeRect(30,30,740,440);
  ctx.fillStyle='#8b5cf6';ctx.font='bold 14px sans-serif';ctx.textAlign='center';
  ctx.fillText('CERTIFICATE OF ACHIEVEMENT',400,70);
  var tGrd=ctx.createLinearGradient(200,80,600,140);
  tGrd.addColorStop(0,'#8b5cf6');tGrd.addColorStop(1,'#06d6a0');
  ctx.fillStyle=tGrd;ctx.font='bold 36px sans-serif';
  ctx.fillText('LevelPlay 수료증',400,130);
  ctx.fillStyle='#e2e8f0';ctx.font='18px sans-serif';
  ctx.fillText('이 수료증은',400,190);
  ctx.fillStyle='#fbbf24';ctx.font='bold 28px sans-serif';
  ctx.fillText(U.nk||'학습자',400,230);
  ctx.fillStyle='#e2e8f0';ctx.font='16px sans-serif';
  ctx.fillText('님이 LevelPlay에서 탁월한 학습 성과를 달성하였음을 증명합니다.',400,270);
  ctx.fillStyle='#94a3b8';ctx.font='14px sans-serif';
  ctx.fillText('레벨 '+U.lv+' | 총 '+totalXP+' XP | 뱃지 '+(U.badges||[]).length+'개 | 연속 '+(U.streak||0)+'일 학습',400,310);
  ctx.fillText('퀴즈 '+(U.quizTotal||0)+'문제 | 레슨 '+(U.lessonCount||0)+'개 완료',400,335);
  ctx.fillStyle='#94a3b8';ctx.font='12px sans-serif';
  ctx.fillText('발급일: '+new Date().toLocaleDateString('ko-KR',{year:'numeric',month:'long',day:'numeric'}),400,400);
  ctx.fillText('LevelPlay - 배우고, 올리고, 증명하라',400,425);
  ctx.fillStyle='rgba(139,92,246,0.08)';ctx.font='bold 120px sans-serif';
  ctx.fillText('LP',400,350);
  // Show modal
  var existing=document.querySelector('.cert-modal');
  if(existing)existing.remove();
  var modal=document.createElement('div');
  modal.className='cert-modal';
  modal.onclick=function(e){if(e.target===modal)modal.remove();};
  modal.appendChild(canvas);
  var actions=document.createElement('div');actions.className='cert-actions';
  var dlBtn=document.createElement('button');dlBtn.className='bt bp';dlBtn.textContent='다운로드';
  dlBtn.onclick=function(){var a=document.createElement('a');a.download='LevelPlay_Certificate.png';a.href=canvas.toDataURL('image/png');a.click();};
  var closeBtn=document.createElement('button');closeBtn.className='bt bs';closeBtn.textContent='닫기';
  closeBtn.onclick=function(){modal.remove();};
  actions.appendChild(dlBtn);actions.appendChild(closeBtn);
  modal.appendChild(actions);
  document.body.appendChild(modal);
}
window.generateCertificate=generateCertificate;

// ===== 7. Offline indicator =====
function initOfflineIndicator(){
  var bar=document.getElementById('offlineBarV2');
  if(!bar)return;
  function update(){bar.classList.toggle('show',!navigator.onLine);}
  window.addEventListener('online',function(){update();if(typeof toast==='function')toast('온라인 복귀!');});
  window.addEventListener('offline',function(){update();});
  update();
}

// ===== 8. Footer stats =====
function renderFooterStats(){
  var el=document.getElementById('footerStatsV2');
  if(!el)return;
  try{
    var subjects=typeof getSubjects==='function'?getSubjects():[];
    var totalLessons=0;
    if(typeof CURRICULUM!=='undefined'){Object.values(CURRICULUM).forEach(function(c){c.units.forEach(function(u){totalLessons+=u.lessons.length;});});}
    var gameCount=typeof GMS!=='undefined'?GMS.length:0;
    var videoCount=typeof getV==='function'?getV().length:0;
    el.innerHTML='<span>📖 '+subjects.length+'과목</span><span>📝 '+totalLessons+'레슨</span><span>🎮 '+gameCount+'게임</span><span>📺 '+videoCount+'영상</span>';
  }catch(e){}
}

// ===== 9. Auto theme detection =====
function initAutoTheme(){
  if(typeof U!=='undefined'&&U.theme)return;
  try{
    if(window.matchMedia&&window.matchMedia('(prefers-color-scheme:light)').matches){
      if(typeof applyTheme==='function')applyTheme('light');
    }
  }catch(e){}
}

// ===== 10. Patch trackMission to update weekly challenges =====
function patchTrackMission(){
  if(typeof window.trackMission==='function'){
    var orig=window.trackMission;
    window.trackMission=function(type){
      orig(type);
      renderWeeklyChallenge();
    };
  }
}

// ===== Initialize v2.0 features =====
function initV2(){
  try{
    initAutoTheme();
    injectHTML();
    initWeeklyChallenge();
    renderWeeklyChallenge();
    patchSubjectCards();
    updateReminderBtn();
    renderFooterStats();
    initOfflineIndicator();
    checkStudyReminder();
    patchTrackMission();
  }catch(e){console.warn('[LevelPlay v2.0] init error:',e);}
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',function(){setTimeout(initV2,1200);});
}else{
  setTimeout(initV2,800);
}

// Re-patch after tab switches (subject cards re-render)
var _origGo=window.go;
if(typeof _origGo==='function'){
  window.go=function(i){
    _origGo(i);
    setTimeout(patchSubjectCards,100);
  };
}

// Re-patch after rAll (full re-render)
var _origRAll=window.rAll;
if(typeof _origRAll==='function'){
  window.rAll=function(){
    _origRAll();
    setTimeout(function(){patchSubjectCards();renderWeeklyChallenge();renderFooterStats();},100);
  };
}

})();
