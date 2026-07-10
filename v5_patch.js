// LevelPlay v5.0 Patch - Weekly League + Mastery Radar + Confetti + Roadmap
// + Streak Shield + Share Card + 3 Stories + 40 Quizzes + 10 Badges + SFX 6
(function(){
'use strict';

const css=document.createElement('style');
css.textContent=`
.v5-league{background:linear-gradient(135deg,var(--c1,#111127),rgba(139,92,246,.08));border:1.5px solid rgba(139,92,246,.2);border-radius:12px;padding:14px;margin-bottom:10px;position:relative;overflow:hidden}
.v5-league::before{content:'';position:absolute;top:-50%;right:-30%;width:120px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(139,92,246,.08),transparent);pointer-events:none}
.v5-league-header{display:flex;align-items:center;gap:10px;margin-bottom:10px}
.v5-league-icon{font-size:36px;filter:drop-shadow(0 2px 4px rgba(0,0,0,.3))}
.v5-league-info{flex:1}
.v5-league-tier{font-size:14px;font-weight:800}
.v5-league-sub{font-size:10px;color:var(--t3)}
.v5-league-xp{font-size:11px;font-weight:700;color:var(--cy);text-align:right}
.v5-league-bar{height:8px;background:var(--bg);border-radius:4px;overflow:hidden;margin:8px 0 4px}
.v5-league-fill{height:100%;border-radius:4px;transition:width .6s}
.v5-league-ranks{margin-top:10px}
.v5-league-rank{display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:8px;font-size:11px;margin-bottom:3px;transition:.15s}
.v5-league-rank:nth-child(1){background:rgba(251,191,36,.08);border:1px solid rgba(251,191,36,.15)}
.v5-league-rank:nth-child(2){background:rgba(192,192,192,.06);border:1px solid rgba(192,192,192,.1)}
.v5-league-rank:nth-child(3){background:rgba(205,127,50,.06);border:1px solid rgba(205,127,50,.1)}
.v5-league-rank .lr-pos{font-weight:800;min-width:18px}
.v5-league-rank .lr-name{flex:1;font-weight:600}
.v5-league-rank .lr-xp{color:var(--cy);font-weight:700}
.v5-radar-wrap{background:var(--c1);border:1px solid rgba(139,92,246,.08);border-radius:12px;padding:14px;margin-bottom:10px;text-align:center}
.v5-radar-wrap canvas{max-width:100%;border-radius:8px}
.v5-radar-legend{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:8px}
.v5-radar-legend span{font-size:8px;padding:2px 6px;border-radius:4px;background:var(--c2);color:var(--t2)}
.v5-roadmap{background:var(--c1);border:1px solid rgba(139,92,246,.08);border-radius:12px;padding:14px;margin-bottom:10px}
.v5-road-path{position:relative;padding-left:28px}
.v5-road-node{position:relative;padding:8px 0;display:flex;align-items:center;gap:10px}
.v5-road-node::before{content:'';position:absolute;left:-20px;top:0;bottom:0;width:2px;background:rgba(139,92,246,.12)}
.v5-road-node:last-child::before{display:none}
.v5-road-dot{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;position:absolute;left:-31px;z-index:1;border:2px solid rgba(139,92,246,.2);background:var(--bg)}
.v5-road-dot.done{background:rgba(34,197,94,.15);border-color:var(--gn,#22c55e)}
.v5-road-dot.current{background:rgba(251,191,36,.15);border-color:var(--gd,#fbbf24);animation:v4pulse 1s infinite}
.v5-road-dot.locked{opacity:.4}
.v5-road-info .v5r-name{font-size:12px;font-weight:700}
.v5-road-info .v5r-desc{font-size:9px;color:var(--t3)}
.v5-shield{background:linear-gradient(135deg,var(--c1),rgba(6,214,160,.06));border:1.5px solid rgba(6,214,160,.15);border-radius:12px;padding:14px;margin-bottom:10px}
.v5-shield-row{display:flex;align-items:center;gap:10px}
.v5-shield-icon{font-size:28px}
.v5-shield-info{flex:1}
.v5-shield-title{font-size:13px;font-weight:700}
.v5-shield-desc{font-size:10px;color:var(--t3)}
.v5-shield-count{font-size:20px;font-weight:900;color:var(--cy)}
.v5-shield-earn{display:inline-flex;align-items:center;gap:4px;margin-top:6px;padding:6px 12px;border-radius:6px;background:var(--c2);font-size:10px;color:var(--t2);border:1px solid rgba(139,92,246,.08)}
.v5-share-btn{display:flex;align-items:center;gap:6px;padding:10px 16px;border:1.5px solid rgba(139,92,246,.2);border-radius:8px;background:linear-gradient(135deg,rgba(139,92,246,.08),rgba(6,214,160,.06));color:var(--cy);font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;transition:.15s;margin:8px 0;width:100%;justify-content:center}
.v5-share-btn:hover{border-color:var(--cy);transform:translateY(-1px)}
.v5-share-overlay{position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,.9);display:flex;align-items:center;justify-content:center;padding:16px;animation:v4FadeIn .3s}
.v5-share-card{text-align:center}
.v5-share-card canvas{border-radius:12px;max-width:100%;box-shadow:0 4px 24px rgba(139,92,246,.2)}
.v5-share-actions{display:flex;gap:8px;justify-content:center;margin-top:12px}
.v5-confetti-canvas{position:fixed;inset:0;pointer-events:none;z-index:20000}
`;
document.head.appendChild(css);

const U=()=>{try{return JSON.parse(localStorage.getItem('lp_user'))||{}}catch(e){return{}}};
const S=d=>{const u=U();Object.assign(u,d);localStorage.setItem('lp_user',JSON.stringify(u))};
const _el=id=>document.getElementById(id);

// ===== Web Audio SFX (6 new) =====
let v5Ctx=null;
function v5sfx(type){
  try{
    if(!v5Ctx)v5Ctx=new(window.AudioContext||window.webkitAudioContext)();
    if(v5Ctx.state==='suspended')v5Ctx.resume();
    const u=U();if(u.soundMuted)return;
    const o=v5Ctx.createOscillator(),g=v5Ctx.createGain(),t=v5Ctx.currentTime;
    o.connect(g);g.connect(v5Ctx.destination);
    switch(type){
      case'league_up':
        o.type='sine';
        o.frequency.setValueAtTime(523,t);o.frequency.setValueAtTime(659,t+.1);
        o.frequency.setValueAtTime(784,t+.2);o.frequency.setValueAtTime(1047,t+.3);
        o.frequency.setValueAtTime(1318,t+.4);
        g.gain.setValueAtTime(.15,t);g.gain.linearRampToValueAtTime(.001,t+.6);
        o.start(t);o.stop(t+.6);break;
      case'confetti':
        o.type='triangle';
        o.frequency.setValueAtTime(880,t);o.frequency.setValueAtTime(1109,t+.06);
        o.frequency.setValueAtTime(1318,t+.12);o.frequency.setValueAtTime(1568,t+.18);
        g.gain.setValueAtTime(.1,t);g.gain.linearRampToValueAtTime(.001,t+.3);
        o.start(t);o.stop(t+.3);break;
      case'roadmap':
        o.type='sine';
        o.frequency.setValueAtTime(440,t);o.frequency.setValueAtTime(554,t+.1);
        g.gain.setValueAtTime(.1,t);g.gain.linearRampToValueAtTime(.001,t+.25);
        o.start(t);o.stop(t+.25);break;
      case'share':
        o.type='sine';
        o.frequency.setValueAtTime(659,t);o.frequency.setValueAtTime(880,t+.1);
        g.gain.setValueAtTime(.12,t);g.gain.linearRampToValueAtTime(.001,t+.3);
        o.start(t);o.stop(t+.3);break;
      case'shield':
        o.type='triangle';
        o.frequency.setValueAtTime(330,t);o.frequency.setValueAtTime(440,t+.15);
        g.gain.setValueAtTime(.1,t);g.gain.linearRampToValueAtTime(.001,t+.35);
        o.start(t);o.stop(t+.35);break;
      case'radar':
        o.type='sine';
        o.frequency.setValueAtTime(523,t);o.frequency.setValueAtTime(698,t+.08);
        o.frequency.setValueAtTime(880,t+.16);
        g.gain.setValueAtTime(.08,t);g.gain.linearRampToValueAtTime(.001,t+.3);
        o.start(t);o.stop(t+.3);break;
    }
  }catch(e){}
}

// ===== 1. Weekly League System =====
const LEAGUE_TIERS=[
  {name:'브론즈',icon:'\u{1F949}',color:'#cd7f32',min:0,next:100},
  {name:'실버',icon:'\u{1F948}',color:'#c0c0c0',min:100,next:250},
  {name:'골드',icon:'\u{1F947}',color:'#fbbf24',min:250,next:500},
  {name:'플래티넘',icon:'\u{1F48E}',color:'#8b5cf6',min:500,next:1000},
  {name:'다이아몬드',icon:'\u{1F4A0}',color:'#06d6a0',min:1000,next:2000},
  {name:'마스터',icon:'\u{1F451}',color:'#ef4444',min:2000,next:5000},
  {name:'챔피언',icon:'\u{1F3C6}',color:'#ff6b6b',min:5000,next:99999}
];

const AI_PLAYERS=[
  {name:'수학천재',base:40},{name:'과학소녀',base:35},{name:'역사박사',base:50},
  {name:'코딩마스터',base:45},{name:'음악요정',base:30},{name:'퀴즈왕',base:55},
  {name:'열공학생',base:25},{name:'독서왕',base:38},{name:'영어달인',base:42}
];

function getWeekKey(){const d=new Date();const jan1=new Date(d.getFullYear(),0,1);const wk=Math.ceil(((d-jan1)/86400000+jan1.getDay()+1)/7);return d.getFullYear()+'-W'+String(wk).padStart(2,'0');}

function getLeagueData(){
  const u=U();
  const wk=getWeekKey();
  if(!u.league)u.league={};
  if(u.league.week!==wk){
    const prevTier=u.league.tier||0;
    const prevXP=u.league.weekXP||0;
    const prevNext=LEAGUE_TIERS[prevTier]?LEAGUE_TIERS[prevTier].next:100;
    let newTier=prevTier;
    if(prevXP>=prevNext&&newTier<LEAGUE_TIERS.length-1)newTier++;
    else if(prevXP<(LEAGUE_TIERS[prevTier]?LEAGUE_TIERS[prevTier].min:0)*0.3&&prevTier>0)newTier--;
    u.league={week:wk,weekXP:0,tier:newTier,promoted:newTier>prevTier,demoted:newTier<prevTier};
    const seed=hashStr(wk);
    u.league.aiPlayers=AI_PLAYERS.map((p,i)=>{
      const variation=((seed*(i+1))%40)-20;
      return{name:p.name,xp:Math.max(0,Math.round(p.base*3+variation+Math.random()*30))};
    });
    S(u);
  }
  return u.league;
}

function hashStr(s){let h=0;for(let i=0;i<s.length;i++){h=((h<<5)-h)+s.charCodeAt(i);h|=0;}return Math.abs(h);}

function updateLeagueXP(){
  const u=U();
  if(!u.league)getLeagueData();
  const wk=getWeekKey();
  if(u.league.week===wk){
    const dailyXP=u.dailyXP||0;
    const studyDays=u.studyDays||{};
    const today=new Date();
    const tKey=today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0');
    let weekTotal=0;
    for(let i=0;i<7;i++){
      const d=new Date(today);d.setDate(d.getDate()-d.getDay()+i+1);
      const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
      weekTotal+=(studyDays[k]||0);
    }
    u.league.weekXP=Math.max(weekTotal,u.xp?Math.min(u.xp,u.league.weekXP||0):0);
    if(u.league.weekXP<(u.xp||0)*0.1)u.league.weekXP=Math.round((u.xp||0)*0.1);
    S(u);
  }
}

function renderLeague(){
  const league=getLeagueData();
  updateLeagueXP();
  const u=U();
  const tier=LEAGUE_TIERS[league.tier]||LEAGUE_TIERS[0];
  const nextTier=LEAGUE_TIERS[league.tier+1];
  const pct=nextTier?Math.min((league.weekXP||0)/tier.next,1):1;
  const allPlayers=[{name:u.nickname||'나',xp:league.weekXP||0,isMe:true},...(league.aiPlayers||[])];
  allPlayers.sort((a,b)=>b.xp-a.xp);
  let h='<div class="v5-league"><div class="v5-league-header">';
  h+='<div class="v5-league-icon">'+tier.icon+'</div>';
  h+='<div class="v5-league-info"><div class="v5-league-tier" style="color:'+tier.color+'">'+tier.name+' 리그</div>';
  h+='<div class="v5-league-sub">이번 주 순위</div></div>';
  h+='<div class="v5-league-xp">'+(league.weekXP||0)+' XP</div></div>';
  h+='<div class="v5-league-bar"><div class="v5-league-fill" style="width:'+Math.round(pct*100)+'%;background:'+tier.color+'"></div></div>';
  h+='<div style="display:flex;justify-content:space-between;font-size:9px;color:var(--t3)"><span>'+tier.name+'</span>'+(nextTier?'<span>'+nextTier.name+' ('+tier.next+' XP)</span>':'<span>MAX</span>')+'</div>';
  h+='<div class="v5-league-ranks" style="margin-top:10px">';
  const medals=['\u{1F947}','\u{1F948}','\u{1F949}'];
  allPlayers.slice(0,5).forEach((p,i)=>{
    const me=p.isMe?' style="background:rgba(139,92,246,.1);border:1px solid rgba(139,92,246,.2)"':'';
    h+='<div class="v5-league-rank"'+me+'><span class="lr-pos">'+(medals[i]||(i+1))+'</span><span class="lr-name">'+(p.isMe?'\u{1F464} ':'')+p.name+'</span><span class="lr-xp">'+p.xp+' XP</span></div>';
  });
  h+='</div></div>';
  return h;
}

// ===== 2. Subject Mastery Radar Chart =====
const RADAR_SUBJECTS=['수학','과학','한국사','코딩','영어','음악','체육','미술','사회','경제','건강'];

function getSubjectScores(){
  const u=U();
  const stats=u.stats||{};const byCategory=stats.quizByCategory||{};
  const masteryBy=u.masteryByCategory||{};
  return RADAR_SUBJECTS.map(s=>{
    const catStat=byCategory[s]||{total:0,correct:0};
    const accuracy=catStat.total>0?(catStat.correct/catStat.total):0;
    const mastery=(masteryBy[s]||0)/5;
    const volume=Math.min(catStat.total/20,1);
    return Math.round(Math.min((accuracy*0.5+mastery*0.3+volume*0.2)*100,100));
  });
}

function renderRadarChart(){
  const scores=getSubjectScores();
  const canvas=document.createElement('canvas');
  canvas.width=300;canvas.height=300;
  const ctx=canvas.getContext('2d');
  const cx=150,cy=155,r=110,n=RADAR_SUBJECTS.length;
  ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,300,300);
  for(let ring=5;ring>=1;ring--){
    ctx.beginPath();
    const rr=r*ring/5;
    for(let i=0;i<=n;i++){
      const angle=(Math.PI*2*i/n)-(Math.PI/2);
      const x=cx+rr*Math.cos(angle);const y=cy+rr*Math.sin(angle);
      i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.strokeStyle='rgba(139,92,246,'+(0.06+ring*0.03)+')';ctx.lineWidth=1;ctx.stroke();
  }
  for(let i=0;i<n;i++){
    const angle=(Math.PI*2*i/n)-(Math.PI/2);
    ctx.beginPath();ctx.moveTo(cx,cy);
    ctx.lineTo(cx+r*Math.cos(angle),cy+r*Math.sin(angle));
    ctx.strokeStyle='rgba(139,92,246,.08)';ctx.stroke();
    const lx=cx+(r+18)*Math.cos(angle);const ly=cy+(r+18)*Math.sin(angle);
    ctx.font='bold 9px sans-serif';ctx.fillStyle='#94a3b8';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(RADAR_SUBJECTS[i],lx,ly);
  }
  ctx.beginPath();
  scores.forEach((s,i)=>{
    const angle=(Math.PI*2*i/n)-(Math.PI/2);
    const val=r*s/100;
    const x=cx+val*Math.cos(angle);const y=cy+val*Math.sin(angle);
    i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  });
  ctx.closePath();
  ctx.fillStyle='rgba(139,92,246,.15)';ctx.fill();
  ctx.strokeStyle='#8b5cf6';ctx.lineWidth=2;ctx.stroke();
  scores.forEach((s,i)=>{
    const angle=(Math.PI*2*i/n)-(Math.PI/2);
    const val=r*s/100;
    const x=cx+val*Math.cos(angle);const y=cy+val*Math.sin(angle);
    ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fillStyle='#06d6a0';ctx.fill();
  });
  ctx.font='bold 11px sans-serif';ctx.fillStyle='#8b5cf6';ctx.textAlign='center';
  ctx.fillText('과목별 마스터리',cx,16);
  return canvas;
}

function renderRadarSection(){
  const canvas=renderRadarChart();
  let h='<div class="v5-radar-wrap"><div class="sec" style="justify-content:center">\u{1F4CA} 과목별 실력 레이더</div>';
  h+='<div id="v5radarArea"></div>';
  h+='<div class="v5-radar-legend">';
  const scores=getSubjectScores();
  RADAR_SUBJECTS.forEach((s,i)=>{
    h+='<span>'+s+': '+scores[i]+'%</span>';
  });
  h+='</div></div>';
  return h;
}

// ===== 3. Confetti Celebration =====
function v5Confetti(duration){
  duration=duration||2500;
  v5sfx('confetti');
  const canvas=document.createElement('canvas');
  canvas.className='v5-confetti-canvas';
  canvas.width=window.innerWidth;canvas.height=window.innerHeight;
  document.body.appendChild(canvas);
  const ctx=canvas.getContext('2d');
  const colors=['#8b5cf6','#06d6a0','#fbbf24','#ef4444','#3b82f6','#ec4899','#f97316'];
  const particles=[];
  for(let i=0;i<80;i++){
    particles.push({
      x:Math.random()*canvas.width,y:Math.random()*canvas.height*0.3-canvas.height*0.3,
      w:Math.random()*8+4,h:Math.random()*4+2,
      color:colors[Math.floor(Math.random()*colors.length)],
      vx:(Math.random()-0.5)*4,vy:Math.random()*3+2,
      rot:Math.random()*Math.PI*2,vr:(Math.random()-0.5)*0.2
    });
  }
  const start=Date.now();
  function frame(){
    const elapsed=Date.now()-start;
    if(elapsed>duration){canvas.remove();return;}
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const alpha=Math.max(0,1-(elapsed-duration*0.7)/(duration*0.3));
    particles.forEach(p=>{
      p.x+=p.vx;p.y+=p.vy;p.vy+=0.08;p.rot+=p.vr;
      ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);
      ctx.globalAlpha=alpha;ctx.fillStyle=p.color;
      ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
      ctx.restore();
    });
    requestAnimationFrame(frame);
  }
  frame();
}
window.v5Confetti=v5Confetti;

// ===== 4. Learning Roadmap =====
const ROADMAP=[
  {id:'start',name:'\u{1F331} 학습 시작',desc:'첫 레슨 완료',check:u=>(u.lessonsCompleted||0)>=1},
  {id:'quiz10',name:'\u{1F4DD} 퀴즈 탐험가',desc:'퀴즈 10문제 풀기',check:u=>(u.quizTotal||0)>=10},
  {id:'video5',name:'\u{1F4FA} 영상 학습자',desc:'영상 5개 시청',check:u=>(u.videosWatched||0)>=5},
  {id:'streak3',name:'\u{1F525} 3일 연속 학습',desc:'3일 스트릭 달성',check:u=>(u.streakDays||0)>=3},
  {id:'mastery1',name:'\u{1F3AF} 첫 마스터리',desc:'마스터리 챌린지 통과',check:u=>(u.masteryCount||0)>=1},
  {id:'lv5',name:'\u{1F396} 레벨 5 달성',desc:'열심히 학습하자!',check:u=>(u.level||1)>=5},
  {id:'quiz50',name:'\u{1F333} 퀴즈 50문제',desc:'꾸준히 풀자!',check:u=>(u.quizTotal||0)>=50},
  {id:'story1',name:'\u{1F4D6} 스토리 탐험',desc:'학습 스토리 1개 완료',check:u=>(u.storiesCompleted||[]).length>=1},
  {id:'game10',name:'\u{1F3AE} 게임 마니아',desc:'게임 10회 플레이',check:u=>(u.gameCount||0)>=10},
  {id:'lv10',name:'\u{1F3C5} 레벨 10 달성',desc:'중급 학습자!',check:u=>(u.level||1)>=10},
  {id:'mastery5',name:'\u{1F451} 마스터 5회',desc:'실력이 쑥쑥!',check:u=>(u.masteryCount||0)>=5},
  {id:'streak7',name:'\u{1F308} 7일 연속 학습',desc:'습관이 되었어!',check:u=>(u.streakDays||0)>=7},
  {id:'xp1000',name:'\u{1F48E} 1000 XP',desc:'경험치 달인!',check:u=>(u.xp||0)>=1000},
  {id:'lv20',name:'\u{1F3C6} 레벨 20 마스터',desc:'최고 수준!',check:u=>(u.level||1)>=20}
];

function renderRoadmap(){
  const u=U();
  let currentIdx=-1;
  ROADMAP.forEach((node,i)=>{if(node.check(u))currentIdx=i;});
  let h='<div class="v5-roadmap"><div class="sec">\u{1F5FA} 학습 로드맵</div>';
  h+='<div style="font-size:10px;color:var(--t3);margin-bottom:10px">진행: '+(currentIdx+1)+'/'+ROADMAP.length+'</div>';
  h+='<div class="v5-road-path">';
  ROADMAP.forEach((node,i)=>{
    const done=i<=currentIdx;
    const isCurrent=i===currentIdx+1;
    const locked=i>currentIdx+1;
    h+='<div class="v5-road-node">';
    h+='<div class="v5-road-dot'+(done?' done':(isCurrent?' current':' locked'))+'">'+
      (done?'✓':(isCurrent?'→':'\u{1F512}'))+'</div>';
    h+='<div class="v5-road-info"><div class="v5r-name"'+(locked?' style="opacity:.4"':'')+'>'+node.name+'</div>';
    h+='<div class="v5r-desc"'+(locked?' style="opacity:.3"':'')+'>'+node.desc+'</div></div></div>';
  });
  h+='</div></div>';
  return h;
}

// ===== 5. Streak Shield System =====
function getShieldCount(){
  const u=U();return u.streakShields||0;
}

function useShield(){
  const u=U();
  if((u.streakShields||0)>0){
    u.streakShields--;S(u);v5sfx('shield');return true;
  }
  return false;
}

function earnShield(){
  const u=U();
  const studyDays=u.studyDays||{};
  const today=new Date();
  let weekDays=0;
  for(let i=0;i<7;i++){
    const d=new Date(today);d.setDate(d.getDate()-d.getDay()+i+1);
    const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    if(studyDays[k])weekDays++;
  }
  if(weekDays>=5&&!u.shieldEarnedThisWeek){
    u.streakShields=(u.streakShields||0)+1;
    u.shieldEarnedThisWeek=getWeekKey();
    S(u);v5sfx('shield');
    const t=_el('tst');
    if(t){t.textContent='\u{1F6E1} 스트릭 실드 획득!';t.classList.add('sh');setTimeout(()=>t.classList.remove('sh'),2500);}
  }
}

function renderShield(){
  const count=getShieldCount();
  const u=U();
  const earned=u.shieldEarnedThisWeek===getWeekKey();
  let h='<div class="v5-shield"><div class="v5-shield-row">';
  h+='<div class="v5-shield-icon">\u{1F6E1}</div>';
  h+='<div class="v5-shield-info"><div class="v5-shield-title">스트릭 실드</div>';
  h+='<div class="v5-shield-desc">학습을 못 한 날에도 스트릭을 지켜줘요</div></div>';
  h+='<div class="v5-shield-count">'+count+'</div></div>';
  h+='<div class="v5-shield-earn">'+(earned?'✅ 이번 주 실드 획득 완료':'\u{1F4AA} 주 5일 학습하면 실드 1개 획득!')+'</div></div>';
  return h;
}

// ===== 6. Share Progress Card =====
function v5ShowShareCard(){
  v5sfx('share');
  const u=U();
  const canvas=document.createElement('canvas');
  canvas.width=600;canvas.height=380;
  const ctx=canvas.getContext('2d');
  const grad=ctx.createLinearGradient(0,0,600,380);
  grad.addColorStop(0,'#0a0a2e');grad.addColorStop(0.5,'#111140');grad.addColorStop(1,'#0a1a2e');
  ctx.fillStyle=grad;ctx.beginPath();
  ctx.roundRect?ctx.roundRect(0,0,600,380,16):ctx.rect(0,0,600,380);ctx.fill();
  const accGrad=ctx.createLinearGradient(0,0,600,0);
  accGrad.addColorStop(0,'#8b5cf6');accGrad.addColorStop(1,'#06d6a0');
  ctx.fillStyle=accGrad;ctx.fillRect(0,0,600,4);
  ctx.font='bold 28px sans-serif';ctx.fillStyle='#8b5cf6';ctx.fillText('LevelPlay',30,50);
  ctx.font='12px sans-serif';ctx.fillStyle='#94a3b8';ctx.fillText('\u{1F393} 배우고, 올리고, 증명하라',30,72);
  const name=u.nickname||'학습자';
  ctx.font='bold 18px sans-serif';ctx.fillStyle='#e2e8f0';ctx.fillText(name+'님의 학습 성적표',30,110);
  const league=getLeagueData();
  const tier=LEAGUE_TIERS[league.tier]||LEAGUE_TIERS[0];
  ctx.font='bold 14px sans-serif';ctx.fillStyle=tier.color;ctx.fillText(tier.icon+' '+tier.name+' 리그',400,50);
  const stats=[
    {label:'Level',value:'Lv.'+(u.level||1),icon:'\u{1F3C5}'},
    {label:'XP',value:(u.xp||0)+' XP',icon:'⭐'},
    {label:'퀸즈',value:(u.quizTotal||0)+'문제',icon:'\u{1F4DD}'},
    {label:'정답률',value:u.quizTotal?Math.round((u.quizCorrect||0)/(u.quizTotal||1)*100)+'%':'0%',icon:'\u{1F3AF}'},
    {label:'스트릭',value:(u.streakDays||0)+'일',icon:'\u{1F525}'},
    {label:'배지',value:((u.v4badges||[]).length+(u.v5badges||[]).length)+'개',icon:'\u{1F3C6}'}
  ];
  stats.forEach((s,i)=>{
    const col=i%3;const row=Math.floor(i/3);
    const x=30+col*190;const y=140+row*80;
    ctx.fillStyle='rgba(139,92,246,.06)';
    if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,170,60,8);ctx.fill();}
    else{ctx.fillRect(x,y,170,60);}
    ctx.strokeStyle='rgba(139,92,246,.12)';ctx.lineWidth=1;
    if(ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,170,60,8);ctx.stroke();}
    ctx.font='10px sans-serif';ctx.fillStyle='#94a3b8';ctx.fillText(s.icon+' '+s.label,x+12,y+22);
    ctx.font='bold 18px sans-serif';ctx.fillStyle='#e2e8f0';ctx.fillText(s.value,x+12,y+46);
  });
  ctx.font='10px sans-serif';ctx.fillStyle='#64748b';
  ctx.fillText('levelplay.vercel.app | '+new Date().toLocaleDateString('ko-KR'),30,360);
  const overlay=document.createElement('div');
  overlay.className='v5-share-overlay';overlay.id='v5shareOverlay';
  overlay.innerHTML='<div class="v5-share-card"></div>';
  overlay.querySelector('.v5-share-card').appendChild(canvas);
  const actions=document.createElement('div');actions.className='v5-share-actions';
  actions.innerHTML='<button class="bt bp" onclick="v5DownloadCard()">PNG 다운로드</button><button class="bt bs" onclick="v5CopyCard()">클립보드 복사</button><button class="bt bs" onclick="document.getElementById(\'v5shareOverlay\').remove()">닫기</button>';
  overlay.querySelector('.v5-share-card').appendChild(actions);
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove();});
  document.body.appendChild(overlay);
}

window.v5ShowShareCard=v5ShowShareCard;

window.v5DownloadCard=function(){
  const canvas=document.querySelector('#v5shareOverlay canvas');
  if(!canvas)return;
  const a=document.createElement('a');a.download='levelplay-progress.png';
  a.href=canvas.toDataURL('image/png');a.click();
};

window.v5CopyCard=function(){
  const canvas=document.querySelector('#v5shareOverlay canvas');
  if(!canvas)return;
  canvas.toBlob(blob=>{
    if(navigator.clipboard&&navigator.clipboard.write){
      navigator.clipboard.write([new ClipboardItem({'image/png':blob})]).then(()=>{
        const t=_el('tst');if(t){t.textContent='\u{1F4CB} 클립보드에 복사됨!';t.classList.add('sh');setTimeout(()=>t.classList.remove('sh'),2000);}
      });
    }
  },'image/png');
};

// ===== 7. New Learning Stories (3 more) =====
const V5_STORIES=[
  {id:'coding_robot',title:'\u{1F916} 로봇을 만들어보자',cat:'코딩',scenes:[
    {speaker:'박사님',text:'오늘은 간단한 로봇을 프로그래밍해볼 거야. 먼저, 변수란 뭐일까?',choices:[{text:'값을 저장하는 상자요!',correct:true,reply:'맞아! 변수는 데이터를 담는 상자란다.'},{text:'컴퓨터의 부품이요?',correct:false,reply:'부품은 하드웨어야. 변수는 데이터를 저장하는 이름이란다.'}]},
    {speaker:'박사님',text:'좋아! 로봇이 앞으로 3걸음 이동하게 하려면 어떤 개념을 쓸까?',choices:[{text:'반복문(루프)이요!',correct:true,reply:'정확해! for문으로 3번 반복하면 돼.'},{text:'조건문(if)이요?',correct:false,reply:'if는 조건 판단이야. 같은 동작 반복은 for/while 루프를 써.'}]},
    {speaker:'박사님',text:'로봇이 벽을 만나면 멈추게 하고 싶어. 어떻게 할까?',choices:[{text:'if문으로 조건을 검사해요!',correct:true,reply:'맞아! if(wall) stop(); 같은 조건문으로 판단하는 거야.'},{text:'그냥 멈추라고 말해요?',correct:false,reply:'컴퓨터는 명확한 조건이 필요해. if문으로 판단해야 해.'}]}
  ]},
  {id:'earth_journey',title:'\u{1F30D} 지구 탐험대',cat:'과학',scenes:[
    {speaker:'탐험대장',text:'우리 지구의 나이는 약 몇 살일까?',choices:[{text:'약 46억 년이요!',correct:true,reply:'정확해! 46억 년 전 태양계와 함께 탄생했어.'},{text:'약 1만 년이요?',correct:false,reply:'훨씬 오래됐어! 지구는 약 46억 년이나 됐란다.'}]},
    {speaker:'탐험대장',text:'지구의 가장 내부 층의 이름은?',choices:[{text:'내핵이요!',correct:true,reply:'맞아! 지각-맨틀-외핵-내핵 순서야.'},{text:'맨틀이요?',correct:false,reply:'맨틀은 지각 바로 아래야. 가장 안쪽은 내핵이란다.'}]},
    {speaker:'탐험대장',text:'대기권에서 산소의 비율은 약 몇 %?',choices:[{text:'약 21%요!',correct:true,reply:'정확해! 질소 78% + 산소 21% + 기타 1%란다.'},{text:'약 50%요?',correct:false,reply:'그건 너무 많아! 산소는 약 21%, 질소가 78%란다.'}]}
  ]},
  {id:'economy_allowance',title:'\u{1F4B0} 용돈 경제학',cat:'경제',scenes:[
    {speaker:'선생님',text:'용돈 5,000원을 받았어. 저축의 기본 원칙은 뭐일까?',choices:[{text:'수입 - 지출 = 저축이요!',correct:true,reply:'정확해! 번 것보다 적게 써야 저축이 돼.'},{text:'많이 쓰면 돼요?',correct:false,reply:'많이 쓰면 저축이 0이 돼! 버는 것보다 적게 썰야 해.'}]},
    {speaker:'선생님',text:'은행에 돈을 맡기면 이자가 붙어. 이자율 2%로 10,000원을 1년 예금하면?',choices:[{text:'10,200원이요! (10000 x 1.02)',correct:true,reply:'맞아! 복리의 마법이 시작되는 거야.'},{text:'12,000원이요?',correct:false,reply:'2%는 200원이야. 10,000 + 200 = 10,200원이란다.'}]},
    {speaker:'선생님',text:'물건의 가격이 오르는 현상을 뭐라고 하지?',choices:[{text:'인플레이션이요!',correct:true,reply:'정확해! 물가가 올라가면 돈의 가치가 떨어져.'},{text:'디플레이션이요?',correct:false,reply:'디플레이션은 물가가 내리는 거야. 올라가는 건 인플레이션!'}]}
  ]}
];

function injectV5Stories(){
  if(window.STORIES&&Array.isArray(window.STORIES)){
    V5_STORIES.forEach(s=>{if(!window.STORIES.find(x=>x.id===s.id))window.STORIES.push(s);});
  }
}

// ===== 8. New Quiz Content (40 questions) =====
const V5_QUIZZES=[
  {q:'무한소수의 예는?',a:['π','½','0.5','2'],c:0,cat:'수학'},
  {q:'이진법에서 1010은 십진법으로?',a:['10','8','12','6'],c:0,cat:'수학'},
  {q:'삼각형의 내각의 합은?',a:['180도','360도','90도','270도'],c:0,cat:'수학'},
  {q:'소수(Prime Number)가 아닌 것은?',a:['9','7','11','13'],c:0,cat:'수학'},
  {q:'빛의 속도는 초속 약?',a:['30만 km','15만 km','1만 km','100만 km'],c:0,cat:'과학'},
  {q:'산성비의 pH는?',a:['2','7','10','14'],c:0,cat:'과학'},
  {q:'생태계에서 생산자는?',a:['식물','초식동물','육식동물','분해자'],c:0,cat:'과학'},
  {q:'전류의 단위는?',a:['암페어(A)','볼트(V)','와트(W)','오멄(Ω)'],c:0,cat:'과학'},
  {q:'임진왜란이 일어난 해는?',a:['1592년','1446년','1636년','1910년'],c:0,cat:'한국사'},
  {q:'훈민정음을 반포한 왕은?',a:['세종대왕','태종','정조','영조'],c:0,cat:'한국사'},
  {q:'독립협회를 설립한 사람은?',a:['서재필','김구','이봉창','윤봉길'],c:0,cat:'한국사'},
  {q:'4.19 혁명이 일어난 해는?',a:['1960년','1950년','1980년','1970년'],c:0,cat:'한국사'},
  {q:'CSS에서 flexbox의 기본 방향은?',a:['row','column','grid','block'],c:0,cat:'코딩'},
  {q:'함수에서 return의 역할은?',a:['값을 반환','변수 선언','반복 실행','조건 검사'],c:0,cat:'코딩'},
  {q:'API의 약자는?',a:['Application Programming Interface','Auto Program Input','Active Page Index','Applied Protocol Input'],c:0,cat:'코딩'},
  {q:'배열의 마지막 요소를 제거하는 메서드는?',a:['pop','push','shift','slice'],c:0,cat:'코딩'},
  {q:'happiness의 형용사형은?',a:['happy','happily','happier','happiest'],c:0,cat:'영어'},
  {q:'Which is correct?',a:['She has been studying','She have been studying','She has been study','She been studying'],c:0,cat:'영어'},
  {q:'before의 반의어는?',a:['after','above','below','behind'],c:0,cat:'영어'},
  {q:'영어 문장의 기본 어순은?',a:['주어+동사+목적어','동사+주어+목적어','목적어+주어+동사','주어+목적어+동사'],c:0,cat:'영어'},
  {q:'비발디의 사계 중 “봄”은?',a:['La Primavera','Winter','Autumn','Summer'],c:0,cat:'음악'},
  {q:'오카리나는 어느 나라 악기?',a:['하와이','이탈리아','프랑스','중국'],c:1,cat:'음악'},
  {q:'음악에서 “piano”의 뜻은?',a:['여리게','세게','빠르게','느리게'],c:0,cat:'음악'},
  {q:'피겨 스케이팅에서 트리플 액셀은 몇 바퀴 반?',a:['3바퀴 반','2바퀴 반','4바퀴 반','1바퀴 반'],c:0,cat:'체육'},
  {q:'올림픽 양궁 개인전의 국가별 최대 참가 선수는?',a:['3명','5명','1명','10명'],c:0,cat:'체육'},
  {q:'수영에서 버터플라이 영법의 특징은?',a:['양팔을 동시에 앞으로 돌려 저음','다리만 사용','배영','평영'],c:0,cat:'체육'},
  {q:'미켈란젤로의 대표작은?',a:['천지창조','모나리자','별이 빛나는 밤','생각하는 사람'],c:0,cat:'미술'},
  {q:'한국의 전통 민화는?',a:['민화','수묵화','유화','판화'],c:0,cat:'미술'},
  {q:'조각의 종류가 아닌 것은?',a:['자수','부조','환조','팔조'],c:0,cat:'미술'},
  {q:'세계에서 가장 넓은 나라는?',a:['러시아','캐나다','미국','중국'],c:0,cat:'사회'},
  {q:'유네스코 세계문화유산이 아닌 것은?',a:['남산타워','석굴암','해인사','종묘'],c:0,cat:'사회'},
  {q:'민주주의의 3대 원칙이 아닌 것은?',a:['세습제','국민주권','권력분립','기본권 보장'],c:0,cat:'사회'},
  {q:'주식의 가격이 오르면 이를 뭐라 하나?',a:['시세차익','배당금','이자','환차익'],c:0,cat:'경제'},
  {q:'기회비용이란?',a:['포기한 대안의 가치','생산 비용','광고 비용','세금'],c:0,cat:'경제'},
  {q:'경제 성장률이 마이너스인 상황을?',a:['경기 침체','경기 호황','인플레이션','디플레이션'],c:0,cat:'경제'},
  {q:'비타민 D가 부족하면 어떤 병이 생길 수 있나?',a:['구루병','괜혈병','빈혈','감기'],c:0,cat:'건강'},
  {q:'운동 후 근육통을 줄이는 방법은?',a:['스트레칭','고강도 운동','카페인 섭취','차가운 물 샤워'],c:0,cat:'건강'},
  {q:'하루 권장 물 섭취량은?',a:['약 2리터','500ml','5리터','100ml'],c:0,cat:'건강'},
  {q:'승강기 안에서 불이 나면 어떻게 해야 하나?',a:['비상버튼을 누르고 계단 이용','엘리베이터를 타고 내림','문을 열고 기다림','창문을 깨고 점프'],c:0,cat:'안전'},
  {q:'지진 발생 시 실내에서의 행동은?',a:['책상 아래로 대피','실외로 뛰어나감','창문 옆에 서기','엘리베이터 타기'],c:0,cat:'안전'}
];

// ===== 9. New Badges (10 more, 30→40) =====
const V5_BADGES=[
  {id:'league_silver',nm:'실버 리그',ic:'\u{1F948}',desc:'실버 승격',check:u=>{const l=u.league||{};return(l.tier||0)>=1;}},
  {id:'league_gold',nm:'골드 리그',ic:'\u{1F947}',desc:'골드 승격',check:u=>{const l=u.league||{};return(l.tier||0)>=2;}},
  {id:'league_diamond',nm:'다이아몬드',ic:'\u{1F4A0}',desc:'다이아 승격',check:u=>{const l=u.league||{};return(l.tier||0)>=4;}},
  {id:'radar_balanced',nm:'균형 학습자',ic:'\u{1F4CA}',desc:'3과목 20%+',check:u=>{const scores=getSubjectScores();return scores.filter(s=>s>=20).length>=3;}},
  {id:'radar_expert',nm:'과목 전문가',ic:'\u{1F9D1}‍\u{1F393}',desc:'1과목 80%+',check:u=>{const scores=getSubjectScores();return scores.some(s=>s>=80);}},
  {id:'roadmap_half',nm:'반의 여정',ic:'\u{1F5FA}',desc:'로드맵 50%',check:u=>{let done=0;ROADMAP.forEach(n=>{if(n.check(u))done++;});return done>=ROADMAP.length/2;}},
  {id:'shield_first',nm:'첫 실드',ic:'\u{1F6E1}',desc:'실드 1개',check:u=>(u.streakShields||0)>=1||(u.shieldEarnedThisWeek&&true)},
  {id:'share_first',nm:'첫 공유',ic:'\u{1F4F1}',desc:'성적 공유',check:u=>u.sharedOnce===true},
  {id:'quiz_200',nm:'퀸즈 200',ic:'\u{1F3C6}',desc:'200문제 풀기',check:u=>(u.quizTotal||0)>=200},
  {id:'xp_3000',nm:'XP 3천',ic:'\u{1F4AB}',desc:'3000 XP 달성',check:u=>(u.xp||0)>=3000}
];

function v5CheckBadges(){
  const u=U();if(!u.v5badges)u.v5badges=[];
  let newBadge=null;
  V5_BADGES.forEach(b=>{
    if(!u.v5badges.includes(b.id)&&b.check(u)){u.v5badges.push(b.id);newBadge=b;}
  });
  if(newBadge){
    S(u);
    v5sfx('confetti');
    v5Confetti(2000);
    const t=_el('tst');
    if(t){t.innerHTML=newBadge.ic+' 배지 획득: '+newBadge.nm;t.classList.add('sh');setTimeout(()=>t.classList.remove('sh'),2500);}
  }else{S(u);}
}

function renderV5Badges(){
  const u=U();const earned=u.v5badges||[];
  let h='';
  V5_BADGES.forEach(b=>{
    const has=earned.includes(b.id);
    h+='<div class="v4-badge'+(has?' earned':'')+'" title="'+b.desc+'"><div class="badge-icon">'+b.ic+'</div><div class="badge-name">'+b.nm+'</div></div>';
  });
  return h;
}

// ===== Inject into Home Page =====
function v5InjectHome(){
  const p0=_el('p0');if(!p0)return;
  const footer=p0.querySelector('[style*="margin-top:24px"]');if(!footer)return;

  const leagueDiv=document.createElement('div');
  leagueDiv.innerHTML='<div class="sec">\u{1F3C6} 주간 리그</div>'+renderLeague();
  footer.parentNode.insertBefore(leagueDiv,footer);

  const radarDiv=document.createElement('div');
  radarDiv.innerHTML=renderRadarSection();
  footer.parentNode.insertBefore(radarDiv,footer);
  setTimeout(()=>{
    const area=_el('v5radarArea');
    if(area){area.appendChild(renderRadarChart());v5sfx('radar');}
  },200);

  const roadDiv=document.createElement('div');
  roadDiv.innerHTML=renderRoadmap();
  footer.parentNode.insertBefore(roadDiv,footer);

  const shieldDiv=document.createElement('div');
  shieldDiv.innerHTML=renderShield();
  footer.parentNode.insertBefore(shieldDiv,footer);

  const shareDiv=document.createElement('div');
  shareDiv.innerHTML='<button class="v5-share-btn" onclick="v5ShowShareCard();var u=JSON.parse(localStorage.getItem(\'lp_user\')||\'{}\');u.sharedOnce=true;localStorage.setItem(\'lp_user\',JSON.stringify(u));">\u{1F4F1} 내 성적 공유 카드 만들기</button>';
  footer.parentNode.insertBefore(shareDiv,footer);

  earnShield();
}

// ===== Inject v5 badges into Profile Page =====
function v5InjectProfile(){
  const p4=_el('p4');if(!p4)return;
  const existing=p4.querySelector('.v5-badge-section');if(existing)return;
  const target=p4.querySelector('.v4-badge-section')||p4.querySelector('[style*="background:var(--c1)"]');
  if(target){
    const badgeDiv=document.createElement('div');badgeDiv.className='v5-badge-section';
    badgeDiv.innerHTML='<div style="margin-bottom:10px"><div class="sec">\u{1F31F} v5 배지 ('+((U().v5badges||[]).length)+'/'+V5_BADGES.length+')</div><div class="v4-badge-grid">'+renderV5Badges()+'</div></div>';
    target.parentNode.insertBefore(badgeDiv,target.nextSibling);
  }
}

// ===== Push new quizzes =====
function pushV5Quizzes(){
  if(window.QUIZ&&Array.isArray(window.QUIZ)){
    V5_QUIZZES.forEach(q=>{if(!window.QUIZ.find(x=>x.q===q.q))window.QUIZ.push(q);});
  }
}

// ===== Hook into existing chkA for league tracking =====
const origChkAv5=window.chkA;
if(typeof origChkAv5==='function'){
  window.chkA=function(btn,ok){
    origChkAv5.call(this,btn,ok);
    updateLeagueXP();
    v5CheckBadges();
  };
}

// ===== Keyboard Shortcuts =====
document.addEventListener('keydown',function(e){
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
  if(e.key==='r'&&!e.ctrlKey&&!e.metaKey){e.preventDefault();v5sfx('roadmap');}
  if(e.key==='s'&&!e.ctrlKey&&!e.metaKey&&e.shiftKey){e.preventDefault();v5ShowShareCard();}
  if(e.key==='c'&&!e.ctrlKey&&!e.metaKey&&e.shiftKey){e.preventDefault();v5Confetti(2000);}
});

// ===== Init =====
function v5Init(){
  injectV5Stories();
  pushV5Quizzes();
  v5InjectHome();
  v5InjectProfile();
  updateLeagueXP();
  v5CheckBadges();

  const league=getLeagueData();
  if(league.promoted){
    setTimeout(()=>{
      v5Confetti(3000);
      v5sfx('league_up');
      const t=_el('tst');
      if(t){
        const tier=LEAGUE_TIERS[league.tier]||LEAGUE_TIERS[0];
        t.innerHTML=tier.icon+' '+tier.name+' 리그 승격!';
        t.classList.add('sh');setTimeout(()=>t.classList.remove('sh'),3000);
      }
    },1000);
  }
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',v5Init);
else setTimeout(v5Init,150);
})();
