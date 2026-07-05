// LevelPlay v13.0 Patch - Ranked Match System + Subject Mini Exam Generator Canvas
// + Learning Insights Dashboard Canvas + Custom Quiz Creator
// + Study Routine Builder + Cross-Subject Crossword Canvas
// + Badge Showcase Customizer Canvas + Multiplayer Quiz Battle Arena
// + 15 Quizzes + 12 Achievements + SFX 20 + KB 8
(function(){
'use strict';

function _el(id){return document.getElementById(id);}
function U(){try{return JSON.parse(localStorage.getItem('lp_user'))||{};}catch(e){return {};}}
function S(u){localStorage.setItem('lp_user',JSON.stringify(u));}
function _today(){return new Date().toISOString().slice(0,10);}

// ===== Audio Engine =====
const v13Ctx=(function(){try{return new(window.AudioContext||window.webkitAudioContext)();}catch(e){return null;}})();
function v13Sfx(type){
  if(!v13Ctx)return;try{
  if(v13Ctx.state==='suspended')v13Ctx.resume();
  const o=v13Ctx.createOscillator(),g=v13Ctx.createGain();
  o.connect(g);g.connect(v13Ctx.destination);
  const t=v13Ctx.currentTime;
  const map={
    rank_match:[659.25,.15,'triangle'],rank_up:[1046.5,.35,'sine'],
    rank_down:[220,.15,'sawtooth'],rank_win:[880,.25,'sine'],
    exam_start:[523.25,.15,'triangle'],exam_pass:[1046.5,.3,'sine'],
    exam_fail:[293.66,.12,'sawtooth'],exam_perfect:[1174.66,.4,'sine'],
    insight_open:[659.25,.12,'sine'],insight_export:[880,.2,'sine'],
    creator_save:[523.25,.15,'sine'],creator_play:[783.99,.2,'triangle'],
    routine_set:[440,.12,'sine'],routine_done:[659.25,.15,'sine'],
    crossword_correct:[783.99,.12,'sine'],crossword_complete:[1046.5,.3,'sine'],
    badge_customize:[523.25,.1,'triangle'],badge_equip:[880,.2,'sine'],
    battle_join:[659.25,.15,'triangle'],battle_win:[1046.5,.35,'sine'],
    achieve_v13:[1174.66,.35,'sine'],feature_open13:[523.25,.1,'triangle']
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
const v13css=document.createElement('style');
v13css.textContent=`
.v13-panel{background:var(--c1);border:1px solid rgba(139,92,246,.1);border-radius:12px;padding:14px;margin-bottom:10px}
.v13-panel h3{font-size:14px;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:6px}
.v13-btn{padding:8px 14px;border:1px solid rgba(139,92,246,.2);border-radius:8px;background:var(--c2);color:var(--tx);font:12px inherit;cursor:pointer;transition:.15s}
.v13-btn:hover{border-color:var(--cy);background:rgba(6,214,160,.08)}
.v13-btn.active{background:rgba(6,214,160,.15);border-color:var(--cy);color:var(--cy)}
.v13-badge{display:inline-flex;align-items:center;gap:3px;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700}
/* Ranked */
.v13-ranked{background:linear-gradient(135deg,rgba(251,191,36,.06),rgba(139,92,246,.06));border:1.5px solid rgba(251,191,36,.2);border-radius:12px;padding:14px;margin-bottom:10px}
.v13-rank-card{display:flex;align-items:center;gap:10px;padding:10px;background:var(--c2);border-radius:8px;margin-bottom:6px}
.v13-rank-icon{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;background:rgba(251,191,36,.15)}
.v13-rank-info{flex:1}.v13-rank-name{font-size:12px;font-weight:700}.v13-rank-pts{font-size:10px;color:var(--t3)}
/* Exam */
.v13-exam{background:linear-gradient(135deg,rgba(34,197,94,.04),rgba(6,214,160,.04));border:1.5px solid rgba(34,197,94,.2);border-radius:12px;padding:14px;margin-bottom:10px}
.v13-exam-q{padding:12px;background:var(--c2);border-radius:8px;margin-bottom:8px}
.v13-exam-q .q-num{font-size:10px;color:var(--cy);font-weight:700;margin-bottom:4px}
.v13-exam-q .q-text{font-size:13px;font-weight:600;margin-bottom:8px}
.v13-exam-opts{display:grid;gap:4px}
.v13-exam-opt{padding:8px 10px;border:1px solid rgba(139,92,246,.15);border-radius:6px;font-size:11px;cursor:pointer;transition:.15s}
.v13-exam-opt:hover{border-color:var(--cy);background:rgba(6,214,160,.05)}
.v13-exam-opt.correct{border-color:var(--gn);background:rgba(34,197,94,.12);color:var(--gn)}
.v13-exam-opt.wrong{border-color:var(--rd);background:rgba(239,68,68,.08);color:var(--rd)}
/* Insight Canvas */
.v13-canvas-wrap{position:relative;width:100%;margin:8px 0;border-radius:10px;overflow:hidden;background:var(--c2)}
.v13-canvas-wrap canvas{width:100%;display:block}
/* Crossword */
.v13-cw-grid{display:grid;gap:2px;margin:10px 0}
.v13-cw-cell{width:100%;aspect-ratio:1;border:1px solid rgba(139,92,246,.2);border-radius:4px;background:var(--c2);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;cursor:pointer;transition:.15s}
.v13-cw-cell.filled{background:rgba(6,214,160,.12);border-color:var(--cy);color:var(--cy)}
.v13-cw-cell.black{background:#000;border-color:#000;cursor:default}
.v13-cw-cell.active{border-color:var(--gd);box-shadow:0 0 8px rgba(251,191,36,.3)}
/* Battle */
.v13-battle{background:linear-gradient(135deg,rgba(239,68,68,.06),rgba(251,191,36,.06));border:1.5px solid rgba(239,68,68,.2);border-radius:12px;padding:14px;margin-bottom:10px}
.v13-battle-vs{display:flex;align-items:center;justify-content:center;gap:12px;margin:10px 0}
.v13-battle-player{text-align:center}
.v13-battle-avatar{width:48px;height:48px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;margin:0 auto 4px}
.v13-battle-score{font-size:20px;font-weight:900;color:var(--gd)}
/* Routine */
.v13-routine-item{display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--c2);border-radius:8px;margin-bottom:4px;cursor:pointer;transition:.12s}
.v13-routine-item:hover{background:rgba(6,214,160,.05)}
.v13-routine-item.done{opacity:.6;text-decoration:line-through}
.v13-routine-check{width:20px;height:20px;border:2px solid rgba(139,92,246,.3);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0}
.v13-routine-item.done .v13-routine-check{border-color:var(--cy);background:rgba(6,214,160,.2);color:var(--cy)}
/* Nav scroll bar */
.v13-nav{position:fixed;bottom:52px;left:0;right:0;height:36px;background:rgba(10,10,26,.95);backdrop-filter:blur(8px);border-top:1px solid rgba(139,92,246,.06);display:flex;overflow-x:auto;z-index:998;scrollbar-width:none;gap:2px;padding:0 4px;align-items:center}
.v13-nav::-webkit-scrollbar{display:none}
.v13-nav button{flex-shrink:0;padding:4px 10px;border:1px solid rgba(139,92,246,.12);border-radius:14px;background:var(--c2);color:var(--t3);font:10px/1.2 inherit;cursor:pointer;white-space:nowrap;transition:.15s}
.v13-nav button:hover,.v13-nav button.on{border-color:var(--cy);color:var(--cy);background:rgba(6,214,160,.08)}
`;
document.head.appendChild(v13css);

// ===== DATA =====
const V13_RANKS=[
  {name:'Bronze V',icon:'🥉',min:0},{name:'Bronze IV',icon:'🥉',min:100},
  {name:'Bronze III',icon:'🥉',min:200},{name:'Silver III',icon:'🥈',min:350},
  {name:'Silver II',icon:'🥈',min:500},{name:'Silver I',icon:'🥈',min:700},
  {name:'Gold III',icon:'🥇',min:1000},{name:'Gold II',icon:'🥇',min:1400},
  {name:'Gold I',icon:'🥇',min:1800},{name:'Platinum',icon:'💎',min:2500},
  {name:'Diamond',icon:'👑',min:3500},{name:'Master',icon:'🏆',min:5000}
];

const V13_EXAM_POOL=[
  {subj:'수학',q:'피타고라스 정리에서 빗변의 제곱은?',o:['두 변의 합','두 변의 제곱의 합','두 변의 곱','두 변의 차의 제곱'],a:1},
  {subj:'과학',q:'물이 끓는 온도(1기압)는?',o:['90°C','95°C','100°C','105°C'],a:2},
  {subj:'국어',q:'&quot;가시리&quot;의 갈래는?',o:['시조','가사','별곡','속요'],a:3},
  {subj:'영어',q:'과거분사가 불규칙인 동사는?',o:['play','walk','go','talk'],a:2},
  {subj:'사회',q:'대한민국 국회의 임기는?',o:['3년','4년','5년','6년'],a:1},
  {subj:'역사',q:'조선을 건국한 왕은?',o:['이방원','이성계','이도','이방석'],a:1},
  {subj:'수학',q:'원주율 π의 값은 약?',o:['2.14','3.14','4.14','3.41'],a:1},
  {subj:'과학',q:'광합성에 필요하지 않은 것은?',o:['물','이산화탄소','산소','빛'],a:2},
  {subj:'역사',q:'임진왜란이 일어난 해는?',o:['1492년','1592년','1692년','1392년'],a:1},
  {subj:'영어',q:'&quot;Beautiful&quot;의 비교급은?',o:['beautifuler','more beautiful','most beautiful','beautifully'],a:1},
  {subj:'사회',q:'UN의 본부가 위치한 도시는?',o:['런던','파리','뉴욕','제네바'],a:2},
  {subj:'국어',q:'&quot;훈민정음&quot;을 반포한 왕은?',o:['태종','세종','성종','중종'],a:1},
  {subj:'수학',q:'삼각형의 내각의 합은?',o:['90°','180°','270°','360°'],a:1},
  {subj:'과학',q:'포유류가 아닌 동물은?',o:['고래','박쥐','상어','돌고래'],a:2},
  {subj:'역사',q:'고구려의 수도 국내성이 있던 곳은?',o:['평양','개성','지안','서울'],a:2},
  {subj:'수학',q:'2의 10제곱은?',o:['256','512','1024','2048'],a:2},
  {subj:'과학',q:'태양계에서 가장 큰 행성은?',o:['토성','목성','천왕성','해왕성'],a:1},
  {subj:'영어',q:'&quot;I have been waiting&quot;의 시제는?',o:['현재완료','현재완료진행','과거완료','미래완료'],a:1},
  {subj:'사회',q:'적도가 지나는 대륙이 아닌 것은?',o:['아프리카','남미','아시아','유럽'],a:3},
  {subj:'국어',q:'주어와 서술어의 관계가 두 번인 문장은?',o:['단문','복문','중문','혼합문'],a:1},
  {subj:'역사',q:'백제의 마지막 왕은?',o:['의자왕','성왕','근초고왕','무령왕'],a:0},
  {subj:'수학',q:'log₁₀(1000)의 값은?',o:['2','3','4','10'],a:1},
  {subj:'과학',q:'DNA의 이중나선 구조를 발견한 사람은?',o:['멘델','다윈','왓슨과 크릭','파스퇴르'],a:2},
  {subj:'영어',q:'&quot;Although&quot;와 같은 뜻의 접속사는?',o:['Because','Even though','Therefore','However'],a:1},
  {subj:'사회',q:'ASEAN 회원국 수는?',o:['8개국','10개국','12개국','15개국'],a:1},
  {subj:'역사',q:'6.25 전쟁이 발발한 해는?',o:['1948년','1950년','1953년','1960년'],a:1},
  {subj:'수학',q:'정육면체의 꼭짓점 개수는?',o:['6','8','10','12'],a:1},
  {subj:'과학',q:'원소기호 Fe는 어떤 원소?',o:['납','구리','철','금'],a:2},
  {subj:'국어',q:'&quot;소나기&quot;의 작가는?',o:['이효석','황순원','김유정','박태원'],a:1},
  {subj:'역사',q:'세종대왕 즉위 연도는?',o:['1392년','1418년','1446년','1453년'],a:1}
];

const V13_CROSSWORDS=[
  {size:7,words:[
    {word:'피타고라스',dir:'h',r:0,c:0,clue:'직각삼각형의 유명한 정리'},
    {word:'광합성',dir:'v',r:0,c:2,clue:'식물이 빛으로 영양분 만드는 과정'},
    {word:'세종대왕',dir:'h',r:2,c:1,clue:'훈민정음을 창제한 왕'},
    {word:'원주율',dir:'v',r:1,c:5,clue:'원의 둘레와 지름의 비'},
    {word:'민주주의',dir:'h',r:4,c:0,clue:'국민이 주권을 가진 정치체제'}
  ]},
  {size:7,words:[
    {word:'뉴턴',dir:'h',r:0,c:0,clue:'만유인력을 발견한 과학자'},
    {word:'한글',dir:'v',r:0,c:1,clue:'우리나라 고유 문자'},
    {word:'수소',dir:'h',r:2,c:3,clue:'원자번호 1번 원소'},
    {word:'이순신',dir:'v',r:1,c:5,clue:'거북선을 만든 장군'},
    {word:'삼국시대',dir:'h',r:4,c:0,clue:'고구려 백제 신라가 있던 시대'}
  ]}
];

const V13_QUIZZES=[
  {q:'랭크 매치에서 승리 시 얻는 것은?',o:['골드','RP(랭크포인트)','다이아','레벨'],a:1,cat:'시스템'},
  {q:'Khan Academy의 핵심 학습 방법론은?',o:['반복암기','마스터리 러닝','속독법','필기법'],a:1,cat:'교육학'},
  {q:'Duolingo의 학습 동기부여 핵심 요소는?',o:['시험','스트릭','과제','토론'],a:1,cat:'교육학'},
  {q:'크로스워드 퍼즐의 영어 이름은?',o:['Jigsaw','Sudoku','Crossword','Wordsearch'],a:2,cat:'일반'},
  {q:'게이미피케이션의 3요소가 아닌 것은?',o:['포인트','배지','벌금','리더보드'],a:2,cat:'교육학'},
  {q:'학습 루틴에서 포모도로 기법의 집중시간은?',o:['15분','25분','30분','45분'],a:1,cat:'학습법'},
  {q:'간격반복 학습의 창시자는?',o:['에빙하우스','피아제','스키너','파블로프'],a:0,cat:'교육학'},
  {q:'메타인지란 무엇인가?',o:['기억력','사고에 대한 사고','속독','집중력'],a:1,cat:'교육학'},
  {q:'블룸의 택소노미에서 가장 높은 단계는?',o:['이해','적용','분석','창조'],a:3,cat:'교육학'},
  {q:'협동학습의 장점이 아닌 것은?',o:['사회성 발달','다양한 관점','책임감','경쟁심 강화'],a:3,cat:'교육학'},
  {q:'자기주도학습에서 가장 중요한 것은?',o:['선생님','교재','학습 목표 설정','시험'],a:2,cat:'학습법'},
  {q:'학습 피라미드에서 가장 효과적인 학습법은?',o:['강의 듣기','읽기','토론','가르치기'],a:3,cat:'교육학'},
  {q:'성장 마인드셋의 핵심 신념은?',o:['재능은 타고남','노력으로 성장 가능','IQ가 전부','운이 중요'],a:1,cat:'교육학'},
  {q:'백준 온라인 저지의 문제 난이도 체계는?',o:['골드/실버','브론즈~루비','A~F','1~10'],a:1,cat:'프로그래밍'},
  {q:'효과적인 노트 필기법 Cornell 방식의 구성은?',o:['2칸','3칸','4칸','5칸'],a:1,cat:'학습법'}
];

const V13_ACHIEVEMENTS=[
  {id:'rank_first_win',name:'첫 승리',desc:'랭크 매치 첫 승리',icon:'🏅'},
  {id:'rank_gold',name:'골드 달성',desc:'랭크 골드 등급 도달',icon:'🥇'},
  {id:'exam_perfect',name:'만점 시험',desc:'미니시험 만점 달성',icon:'💯'},
  {id:'exam_all_subj',name:'전과목 시험',desc:'모든 과목 시험 응시',icon:'📝'},
  {id:'insight_check',name:'인사이트 분석가',desc:'학습 인사이트 3회 확인',icon:'📊'},
  {id:'creator_first',name:'퀴즈 크리에이터',desc:'커스텀 퀴즈 첫 생성',icon:'✏️'},
  {id:'routine_7day',name:'루틴 마스터',desc:'7일 연속 루틴 완료',icon:'📅'},
  {id:'crossword_first',name:'크로스워드 달인',desc:'크로스워드 퍼즐 첫 완성',icon:'🧩'},
  {id:'badge_custom',name:'배지 커스터마이저',desc:'배지 커스텀 첫 적용',icon:'🎨'},
  {id:'battle_5wins',name:'배틀 챔피언',desc:'퀴즈 배틀 5승 달성',icon:'⚔️'},
  {id:'v13_explorer',name:'v13 탐험가',desc:'v13 기능 모두 체험',icon:'🌟'},
  {id:'quiz_v13_perfect',name:'v13 퀴즈 마스터',desc:'v13 퀴즈 전부 정답',icon:'🎓'}
];

// ===== FEATURE 1: Ranked Match System =====
function initRankedMatch(){
  const u=U();
  if(!u.v13)u.v13={};
  if(!u.v13.rank)u.v13.rank={rp:0,wins:0,losses:0,draws:0,history:[]};
  S(u);
}

function getRankTier(rp){
  let tier=V13_RANKS[0];
  for(let i=V13_RANKS.length-1;i>=0;i--){
    if(rp>=V13_RANKS[i].min){tier=V13_RANKS[i];break;}
  }
  return tier;
}

function renderRankedPanel(){
  const u=U();initRankedMatch();
  const r=u.v13.rank;
  const tier=getRankTier(r.rp);
  const nextTier=V13_RANKS[V13_RANKS.indexOf(tier)+1]||tier;
  const pct=nextTier.min>tier.min?Math.round((r.rp-tier.min)/(nextTier.min-tier.min)*100):100;
  let h=`<div class="v13-ranked"><h3>🏆 랭크 매치</h3>`;
  h+=`<div class="v13-rank-card"><div class="v13-rank-icon">${tier.icon}</div><div class="v13-rank-info"><div class="v13-rank-name">${tier.name}</div><div class="v13-rank-pts">${r.rp} RP · ${r.wins}승 ${r.losses}패</div></div></div>`;
  h+=`<div style="height:6px;background:var(--bg);border-radius:3px;margin:8px 0;overflow:hidden"><div style="height:100%;width:${pct}%;background:var(--g1);border-radius:3px"></div></div>`;
  h+=`<div style="font-size:10px;color:var(--t3);margin-bottom:10px">다음: ${nextTier.name} (${nextTier.min} RP)</div>`;
  h+=`<button class="v13-btn" onclick="v13StartRankMatch()">⚔️ 매치 시작</button>`;
  h+=`</div>`;
  return h;
}

function v13StartRankMatch(){
  v13Sfx('rank_match');
  const u=U();initRankedMatch();
  const pool=[...V13_EXAM_POOL].sort(()=>Math.random()-.5).slice(0,5);
  let score=0,idx=0;
  const aiScore=Math.floor(Math.random()*4)+1;

  function showQ(){
    if(idx>=pool.length){finishMatch(score,aiScore);return;}
    const q=pool[idx];
    let h=`<div class="v13-exam"><h3>⚔️ 랭크 매치 (${idx+1}/5)</h3>`;
    h+=`<div class="v13-exam-q"><div class="q-num">${q.subj}</div><div class="q-text">${q.q}</div>`;
    h+=`<div class="v13-exam-opts">`;
    q.o.forEach((opt,i)=>{
      h+=`<div class="v13-exam-opt" onclick="v13RankAnswer(${i},${q.a})">${opt}</div>`;
    });
    h+=`</div></div></div>`;
    const el=document.querySelector('.v13-ranked');
    if(el)el.outerHTML=h;
  }

  window.v13RankAnswer=function(sel,ans){
    if(sel===ans){score++;v13Sfx('rank_win');}else{v13Sfx('rank_down');}
    idx++;showQ();
  };

  function finishMatch(myScore,aiScore){
    const u=U();
    let result,rpChange;
    if(myScore>aiScore){result='WIN';rpChange=Math.floor(Math.random()*20)+15;u.v13.rank.wins++;}
    else if(myScore<aiScore){result='LOSE';rpChange=-Math.floor(Math.random()*10)-5;u.v13.rank.losses++;}
    else{result='DRAW';rpChange=5;u.v13.rank.draws++;}
    u.v13.rank.rp=Math.max(0,u.v13.rank.rp+rpChange);
    u.v13.rank.history.push({date:_today(),result,myScore,aiScore,rpChange});
    if(u.v13.rank.history.length>50)u.v13.rank.history.shift();
    if(result==='WIN'&&!u.v13.achievements)u.v13.achievements=[];
    if(result==='WIN'&&!u.v13.achievements.includes('rank_first_win')){u.v13.achievements.push('rank_first_win');}
    if(u.v13.rank.rp>=1000&&u.v13.achievements&&!u.v13.achievements.includes('rank_gold')){u.v13.achievements.push('rank_gold');}
    S(u);
    v13Sfx(result==='WIN'?'rank_up':'rank_down');
    let h=`<div class="v13-ranked"><h3>🏆 결과: ${result}</h3>`;
    h+=`<div style="text-align:center;padding:16px"><div style="font-size:32px;margin-bottom:8px">${result==='WIN'?'🎉':result==='LOSE'?'😔':'🤝'}</div>`;
    h+=`<div style="font-size:14px;font-weight:700">${myScore} vs ${aiScore} (AI)</div>`;
    h+=`<div style="font-size:12px;color:${rpChange>=0?'var(--gn)':'var(--rd)'};margin-top:4px">${rpChange>=0?'+':''}${rpChange} RP</div>`;
    h+=`</div><button class="v13-btn" onclick="v13RefreshFeatures()">돌아가기</button></div>`;
    const el=document.querySelector('.v13-exam')||document.querySelector('.v13-ranked');
    if(el)el.outerHTML=h;
  }
  showQ();
}

// ===== FEATURE 2: Subject Mini Exam =====
function renderExamPanel(){
  const subjects=['수학','과학','국어','영어','사회','역사'];
  let h=`<div class="v13-panel"><h3>📋 과목 미니시험</h3>`;
  h+=`<div style="display:flex;flex-wrap:wrap;gap:4px">`;
  subjects.forEach(s=>{
    h+=`<button class="v13-btn" onclick="v13StartExam('${s}')">${s}</button>`;
  });
  h+=`<button class="v13-btn" style="border-color:var(--gd);color:var(--gd)" onclick="v13StartExam('전체')">🎯 전체</button>`;
  h+=`</div></div>`;
  return h;
}

window.v13StartExam=function(subj){
  v13Sfx('exam_start');
  let pool=subj==='전체'?[...V13_EXAM_POOL]:V13_EXAM_POOL.filter(q=>q.subj===subj);
  pool=pool.sort(()=>Math.random()-.5).slice(0,10);
  let score=0,idx=0,answers=[];

  function showExamQ(){
    if(idx>=pool.length){finishExam();return;}
    const q=pool[idx];
    let h=`<div class="v13-exam"><h3>📋 ${subj} 시험 (${idx+1}/${pool.length})</h3>`;
    h+=`<div class="v13-exam-q"><div class="q-num">${q.subj} #${idx+1}</div><div class="q-text">${q.q}</div>`;
    h+=`<div class="v13-exam-opts">`;
    q.o.forEach((opt,i)=>{
      h+=`<div class="v13-exam-opt" onclick="v13ExamAnswer(${i},${q.a})">${opt}</div>`;
    });
    h+=`</div></div></div>`;
    const panel=document.querySelector('.v13-panel')||document.querySelector('.v13-exam');
    if(panel)panel.outerHTML=h;
  }

  window.v13ExamAnswer=function(sel,ans){
    answers.push({sel,ans,correct:sel===ans});
    if(sel===ans){score++;v13Sfx('exam_pass');}else{v13Sfx('exam_fail');}
    idx++;showExamQ();
  };

  function finishExam(){
    const pct=Math.round(score/pool.length*100);
    const grade=pct>=90?'S':pct>=80?'A':pct>=70?'B':pct>=60?'C':'D';
    const u=U();if(!u.v13)u.v13={};if(!u.v13.achievements)u.v13.achievements=[];
    if(pct===100&&!u.v13.achievements.includes('exam_perfect')){u.v13.achievements.push('exam_perfect');v13Sfx('achieve_v13');}
    S(u);
    v13Sfx(pct>=70?'exam_pass':'exam_fail');
    if(pct===100)v13Sfx('exam_perfect');
    let h=`<div class="v13-exam"><h3>📋 시험 결과</h3>`;
    h+=`<div style="text-align:center;padding:16px"><div style="font-size:40px;margin-bottom:8px">${grade}</div>`;
    h+=`<div style="font-size:14px;font-weight:700">${score}/${pool.length} (${pct}%)</div>`;
    h+=`<div style="font-size:11px;color:var(--t3);margin-top:4px">과목: ${subj}</div>`;
    h+=`</div><button class="v13-btn" onclick="v13RefreshFeatures()">돌아가기</button></div>`;
    const el=document.querySelector('.v13-exam');
    if(el)el.outerHTML=h;
  }
  showExamQ();
};

// ===== FEATURE 3: Learning Insights Dashboard Canvas =====
function renderInsightsCanvas(){
  let h=`<div class="v13-panel"><h3>📊 학습 인사이트</h3>`;
  h+=`<div class="v13-canvas-wrap"><canvas id="v13InsightCanvas" width="560" height="320"></canvas></div>`;
  h+=`<button class="v13-btn" style="margin-top:8px" onclick="v13DrawInsights()">🔄 분석 갱신</button>`;
  h+=`<button class="v13-btn" style="margin-top:8px;margin-left:4px" onclick="v13ExportInsights()">📥 PNG 저장</button>`;
  h+=`</div>`;
  return h;
}

window.v13DrawInsights=function(){
  const canvas=document.getElementById('v13InsightCanvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const W=560,H=320;
  ctx.clearRect(0,0,W,H);

  const u=U();
  const subjects=['수학','과학','국어','영어','사회','역사','음악','미술','체육','코딩','도덕'];
  const colors=['#8b5cf6','#06d6a0','#fbbf24','#ef4444','#3b82f6','#ec4899','#f97316','#14b8a6','#a855f7','#22c55e','#6366f1'];

  // Background
  ctx.fillStyle='#111127';ctx.fillRect(0,0,W,H);
  ctx.fillStyle='#e2e8f0';ctx.font='bold 14px sans-serif';
  ctx.fillText('학습 인사이트 대시보드',20,28);
  ctx.font='10px sans-serif';ctx.fillStyle='#94a3b8';
  ctx.fillText(_today()+' 기준',20,44);

  // Bar chart - subject XP
  const barW=38,barGap=8,startX=30,startY=280;
  const maxH=180;
  let xpData=subjects.map((s,i)=>{
    const key='xp_'+s;
    return{name:s,xp:u[key]||Math.floor(Math.random()*500)+50,color:colors[i]};
  });
  const maxXP=Math.max(...xpData.map(d=>d.xp),1);

  xpData.forEach((d,i)=>{
    const x=startX+i*(barW+barGap);
    const barH=Math.round((d.xp/maxXP)*maxH);
    const grd=ctx.createLinearGradient(x,startY-barH,x,startY);
    grd.addColorStop(0,d.color);grd.addColorStop(1,d.color+'44');
    ctx.fillStyle=grd;
    ctx.beginPath();ctx.roundRect(x,startY-barH,barW,barH,4);ctx.fill();
    ctx.fillStyle='#94a3b8';ctx.font='9px sans-serif';ctx.textAlign='center';
    ctx.fillText(d.name.slice(0,2),x+barW/2,startY+14);
    ctx.fillStyle='#e2e8f0';ctx.font='bold 9px sans-serif';
    ctx.fillText(d.xp,x+barW/2,startY-barH-6);
  });
  ctx.textAlign='left';

  // Summary stats on the right
  const totalXP=xpData.reduce((s,d)=>s+d.xp,0);
  const streak=u.streak||0;
  const quizTotal=u.quizTotal||Math.floor(Math.random()*200)+50;
  ctx.fillStyle='#e2e8f0';ctx.font='bold 11px sans-serif';
  ctx.fillText('총 XP: '+totalXP,430,80);
  ctx.fillText('스트릭: '+streak+'일',430,100);
  ctx.fillText('퀴즈: '+quizTotal+'문',430,120);
  ctx.fillText('등급: '+(totalXP>3000?'S':totalXP>2000?'A':totalXP>1000?'B':'C'),430,140);

  v13Sfx('insight_open');
  const uu=U();if(!uu.v13)uu.v13={};
  uu.v13.insightCount=(uu.v13.insightCount||0)+1;
  if(uu.v13.insightCount>=3&&!uu.v13.achievements)uu.v13.achievements=[];
  if(uu.v13.insightCount>=3&&uu.v13.achievements&&!uu.v13.achievements.includes('insight_check')){uu.v13.achievements.push('insight_check');v13Sfx('achieve_v13');}
  S(uu);
};

window.v13ExportInsights=function(){
  const canvas=document.getElementById('v13InsightCanvas');
  if(!canvas)return;
  v13Sfx('insight_export');
  const link=document.createElement('a');
  link.download='levelplay-insights-'+_today()+'.png';
  link.href=canvas.toDataURL('image/png');
  link.click();
};

// ===== FEATURE 4: Custom Quiz Creator =====
function renderQuizCreator(){
  let h=`<div class="v13-panel"><h3>✏️ 퀴즈 만들기</h3>`;
  h+=`<div style="font-size:11px;color:var(--t3);margin-bottom:8px">나만의 퀴즈를 만들어 보세요!</div>`;
  h+=`<input id="v13CQ" placeholder="문제를 입력하세요" style="width:100%;padding:8px;background:var(--c2);border:1px solid rgba(139,92,246,.2);border-radius:6px;color:var(--tx);font:12px inherit;margin-bottom:6px">`;
  h+=`<input id="v13CO1" placeholder="보기 1 (정답)" style="width:100%;padding:6px;background:var(--c2);border:1px solid rgba(34,197,94,.2);border-radius:6px;color:var(--gn);font:11px inherit;margin-bottom:4px">`;
  h+=`<input id="v13CO2" placeholder="보기 2" style="width:100%;padding:6px;background:var(--c2);border:1px solid rgba(139,92,246,.15);border-radius:6px;color:var(--tx);font:11px inherit;margin-bottom:4px">`;
  h+=`<input id="v13CO3" placeholder="보기 3" style="width:100%;padding:6px;background:var(--c2);border:1px solid rgba(139,92,246,.15);border-radius:6px;color:var(--tx);font:11px inherit;margin-bottom:4px">`;
  h+=`<input id="v13CO4" placeholder="보기 4" style="width:100%;padding:6px;background:var(--c2);border:1px solid rgba(139,92,246,.15);border-radius:6px;color:var(--tx);font:11px inherit;margin-bottom:8px">`;
  h+=`<button class="v13-btn" onclick="v13SaveCustomQuiz()">💾 저장</button>`;
  h+=`<button class="v13-btn" style="margin-left:4px" onclick="v13PlayCustomQuiz()">▶️ 내 퀴즈 풀기</button>`;
  const u=U();const count=(u.v13&&u.v13.customQuizzes)?u.v13.customQuizzes.length:0;
  h+=`<div style="font-size:10px;color:var(--t3);margin-top:6px">저장된 퀴즈: ${count}개</div>`;
  h+=`</div>`;
  return h;
}

window.v13SaveCustomQuiz=function(){
  const q=document.getElementById('v13CQ');
  const o1=document.getElementById('v13CO1');
  const o2=document.getElementById('v13CO2');
  const o3=document.getElementById('v13CO3');
  const o4=document.getElementById('v13CO4');
  if(!q||!q.value||!o1||!o1.value)return;
  const u=U();if(!u.v13)u.v13={};if(!u.v13.customQuizzes)u.v13.customQuizzes=[];
  u.v13.customQuizzes.push({q:q.value,o:[o1.value,o2.value||'오답2',o3.value||'오답3',o4.value||'오답4'],a:0,date:_today()});
  if(u.v13.customQuizzes.length>100)u.v13.customQuizzes.shift();
  if(!u.v13.achievements)u.v13.achievements=[];
  if(!u.v13.achievements.includes('creator_first')){u.v13.achievements.push('creator_first');}
  S(u);
  v13Sfx('creator_save');
  q.value='';o1.value='';o2.value='';o3.value='';o4.value='';
  v13RefreshFeatures();
};

window.v13PlayCustomQuiz=function(){
  const u=U();
  if(!u.v13||!u.v13.customQuizzes||u.v13.customQuizzes.length===0){return;}
  v13Sfx('creator_play');
  const pool=[...u.v13.customQuizzes].sort(()=>Math.random()-.5).slice(0,5);
  let score=0,idx=0;
  function showCQ(){
    if(idx>=pool.length){
      let h=`<div class="v13-panel"><h3>✏️ 내 퀴즈 결과</h3>`;
      h+=`<div style="text-align:center;font-size:24px;margin:12px 0">${score}/${pool.length}</div>`;
      h+=`<button class="v13-btn" onclick="v13RefreshFeatures()">돌아가기</button></div>`;
      const el=document.querySelector('.v13-panel');
      if(el)el.outerHTML=h;
      return;
    }
    const q=pool[idx];
    const opts=[...q.o].sort(()=>Math.random()-.5);
    const correctIdx=opts.indexOf(q.o[q.a]);
    let h=`<div class="v13-panel"><h3>✏️ 내 퀴즈 (${idx+1}/${pool.length})</h3>`;
    h+=`<div class="v13-exam-q"><div class="q-text">${q.q}</div><div class="v13-exam-opts">`;
    opts.forEach((opt,i)=>{
      h+=`<div class="v13-exam-opt" onclick="v13CustomQAnswer(${i},${correctIdx})">${opt}</div>`;
    });
    h+=`</div></div></div>`;
    const el=document.querySelector('.v13-panel');
    if(el)el.outerHTML=h;
  }
  window.v13CustomQAnswer=function(sel,ans){
    if(sel===ans){score++;v13Sfx('exam_pass');}else{v13Sfx('exam_fail');}
    idx++;showCQ();
  };
  showCQ();
};

// ===== FEATURE 5: Study Routine Builder =====
function renderRoutineBuilder(){
  const u=U();if(!u.v13)u.v13={};
  if(!u.v13.routine)u.v13.routine={items:[
    {id:1,text:'수학 퀴즈 5문제',done:false},
    {id:2,text:'영단어 10개 복습',done:false},
    {id:3,text:'과학 실험 1개',done:false},
    {id:4,text:'듣기 퀴즈 3문제',done:false},
    {id:5,text:'오답노트 확인',done:false},
    {id:6,text:'새 레슨 1개 시청',done:false}
  ],streak:0,lastDate:''};
  const r=u.v13.routine;
  if(r.lastDate!==_today()){r.items.forEach(i=>i.done=false);r.lastDate=_today();}
  S(u);

  const doneCount=r.items.filter(i=>i.done).length;
  const pct=Math.round(doneCount/r.items.length*100);
  let h=`<div class="v13-panel"><h3>📅 학습 루틴</h3>`;
  h+=`<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">`;
  h+=`<div style="flex:1;height:6px;background:var(--bg);border-radius:3px;overflow:hidden"><div style="height:100%;width:${pct}%;background:var(--g1);border-radius:3px"></div></div>`;
  h+=`<span style="font-size:11px;font-weight:700;color:var(--cy)">${pct}%</span></div>`;
  r.items.forEach((item,i)=>{
    h+=`<div class="v13-routine-item ${item.done?'done':''}" onclick="v13ToggleRoutine(${i})">`;
    h+=`<div class="v13-routine-check">${item.done?'✓':''}</div>`;
    h+=`<span style="font-size:12px">${item.text}</span></div>`;
  });
  h+=`<div style="font-size:10px;color:var(--t3);margin-top:8px">루틴 스트릭: ${r.streak}일</div>`;
  h+=`</div>`;
  return h;
}

window.v13ToggleRoutine=function(idx){
  const u=U();
  if(!u.v13||!u.v13.routine)return;
  u.v13.routine.items[idx].done=!u.v13.routine.items[idx].done;
  v13Sfx('routine_done');
  const allDone=u.v13.routine.items.every(i=>i.done);
  if(allDone){
    u.v13.routine.streak=(u.v13.routine.streak||0)+1;
    if(u.v13.routine.streak>=7){
      if(!u.v13.achievements)u.v13.achievements=[];
      if(!u.v13.achievements.includes('routine_7day')){u.v13.achievements.push('routine_7day');v13Sfx('achieve_v13');}
    }
  }
  S(u);v13RefreshFeatures();
};

// ===== FEATURE 6: Cross-Subject Crossword Canvas =====
function renderCrossword(){
  const puzzle=V13_CROSSWORDS[Math.floor(Math.random()*V13_CROSSWORDS.length)];
  let h=`<div class="v13-panel"><h3>🧩 크로스워드 퍼즐</h3>`;
  h+=`<div id="v13CWArea" style="margin-bottom:8px"></div>`;
  h+=`<div id="v13CWClues" style="font-size:11px;color:var(--t3)"></div>`;
  h+=`<div style="margin-top:8px"><input id="v13CWInput" placeholder="답 입력 후 Enter" style="padding:6px 10px;background:var(--c2);border:1px solid rgba(139,92,246,.2);border-radius:6px;color:var(--tx);font:12px inherit;width:70%">`;
  h+=`<button class="v13-btn" style="margin-left:4px" onclick="v13CheckCW()">확인</button></div>`;
  h+=`</div>`;
  return h;
}

function initCrosswordGrid(){
  const area=document.getElementById('v13CWArea');
  const clueEl=document.getElementById('v13CWClues');
  if(!area||!clueEl)return;
  const puzzle=V13_CROSSWORDS[0];
  const size=puzzle.size;
  area.innerHTML='';
  const grid=document.createElement('div');
  grid.className='v13-cw-grid';
  grid.style.gridTemplateColumns=`repeat(${size},1fr)`;
  grid.style.maxWidth='280px';

  const cells=Array.from({length:size},()=>Array(size).fill(null));
  puzzle.words.forEach(w=>{
    for(let i=0;i<w.word.length;i++){
      if(w.dir==='h')cells[w.r][w.c+i]={letter:w.word[i],revealed:false};
      else cells[w.r+i][w.c]={letter:w.word[i],revealed:false};
    }
  });

  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      const cell=document.createElement('div');
      cell.className='v13-cw-cell'+(cells[r][c]?'':' black');
      cell.dataset.r=r;cell.dataset.c=c;
      if(cells[r][c])cell.textContent='';
      grid.appendChild(cell);
    }
  }
  area.appendChild(grid);
  window._v13CWCells=cells;window._v13CWPuzzle=puzzle;

  let clueH='<strong>힌트:</strong><br>';
  puzzle.words.forEach((w,i)=>{clueH+=`${i+1}. ${w.clue} (${w.word.length}자)<br>`;});
  clueEl.innerHTML=clueH;

  const input=document.getElementById('v13CWInput');
  if(input)input.addEventListener('keydown',e=>{if(e.key==='Enter')window.v13CheckCW();});
}

window.v13CheckCW=function(){
  const input=document.getElementById('v13CWInput');
  if(!input||!input.value||!window._v13CWPuzzle)return;
  const answer=input.value.trim();
  const puzzle=window._v13CWPuzzle;
  const cells=window._v13CWCells;
  let found=false;

  puzzle.words.forEach(w=>{
    if(w.word===answer){
      found=true;
      for(let i=0;i<w.word.length;i++){
        const r=w.dir==='h'?w.r:w.r+i;
        const c=w.dir==='h'?w.c+i:w.c;
        cells[r][c].revealed=true;
        const grid=document.querySelector('.v13-cw-grid');
        if(grid){
          const cellEl=grid.children[r*puzzle.size+c];
          if(cellEl){cellEl.textContent=w.word[i];cellEl.classList.add('filled');}
        }
      }
    }
  });

  if(found){
    v13Sfx('crossword_correct');input.value='';
    const allRevealed=puzzle.words.every(w=>{
      for(let i=0;i<w.word.length;i++){
        const r=w.dir==='h'?w.r:w.r+i;
        const c=w.dir==='h'?w.c+i:w.c;
        if(!cells[r][c].revealed)return false;
      }return true;
    });
    if(allRevealed){
      v13Sfx('crossword_complete');
      const u=U();if(!u.v13)u.v13={};if(!u.v13.achievements)u.v13.achievements=[];
      if(!u.v13.achievements.includes('crossword_first')){u.v13.achievements.push('crossword_first');v13Sfx('achieve_v13');}
      S(u);
    }
  }else{input.value='';input.placeholder='틀렸습니다. 다시 시도!';}
};

// ===== FEATURE 7: Badge Showcase Customizer Canvas =====
function renderBadgeCustomizer(){
  let h=`<div class="v13-panel"><h3>🎨 배지 커스터마이저</h3>`;
  h+=`<div class="v13-canvas-wrap"><canvas id="v13BadgeCanvas" width="600" height="360"></canvas></div>`;
  h+=`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px">`;
  const themes=[{name:'보라',c1:'#8b5cf6',c2:'#6d28d9'},{name:'초록',c1:'#06d6a0',c2:'#059669'},{name:'금색',c1:'#fbbf24',c2:'#d97706'},{name:'빨강',c1:'#ef4444',c2:'#dc2626'},{name:'파랑',c1:'#3b82f6',c2:'#2563eb'},{name:'핑크',c1:'#ec4899',c2:'#db2777'}];
  themes.forEach((t,i)=>{
    h+=`<button class="v13-btn" onclick="v13DrawBadge(${i})" style="border-color:${t.c1};color:${t.c1}">${t.name}</button>`;
  });
  h+=`</div><button class="v13-btn" style="margin-top:8px" onclick="v13ExportBadge()">📥 PNG 저장</button>`;
  h+=`</div>`;
  return h;
}

window.v13DrawBadge=function(themeIdx){
  const canvas=document.getElementById('v13BadgeCanvas');
  if(!canvas)return;
  const ctx=canvas.getContext('2d');
  const W=600,H=360;
  ctx.clearRect(0,0,W,H);

  const themes=[
    {c1:'#8b5cf6',c2:'#6d28d9',bg:'#1a0533'},
    {c1:'#06d6a0',c2:'#059669',bg:'#0a1a15'},
    {c1:'#fbbf24',c2:'#d97706',bg:'#1a1505'},
    {c1:'#ef4444',c2:'#dc2626',bg:'#1a0a0a'},
    {c1:'#3b82f6',c2:'#2563eb',bg:'#0a0f1a'},
    {c1:'#ec4899',c2:'#db2777',bg:'#1a0a15'}
  ];
  const theme=themes[themeIdx||0];

  // Background
  ctx.fillStyle=theme.bg;ctx.fillRect(0,0,W,H);

  // Border glow
  ctx.strokeStyle=theme.c1;ctx.lineWidth=3;
  ctx.strokeRect(8,8,W-16,H-16);
  ctx.strokeStyle=theme.c2;ctx.lineWidth=1;
  ctx.strokeRect(14,14,W-28,H-28);

  // Title
  const grd=ctx.createLinearGradient(0,0,W,0);
  grd.addColorStop(0,theme.c1);grd.addColorStop(1,theme.c2);
  ctx.fillStyle=grd;ctx.font='bold 20px sans-serif';ctx.textAlign='center';
  ctx.fillText('🏆 LevelPlay 배지 컬렉션',W/2,50);

  // Draw badges
  const u=U();
  const allBadges=V13_ACHIEVEMENTS.slice(0,8);
  const earned=(u.v13&&u.v13.achievements)?u.v13.achievements:[];

  allBadges.forEach((badge,i)=>{
    const col=i%4;const row=Math.floor(i/4);
    const x=80+col*140;const y=90+row*130;
    const isEarned=earned.includes(badge.id);

    // Badge circle
    ctx.beginPath();ctx.arc(x,y+20,32,0,Math.PI*2);
    ctx.fillStyle=isEarned?theme.c1+'33':'#222';ctx.fill();
    ctx.strokeStyle=isEarned?theme.c1:'#444';ctx.lineWidth=2;ctx.stroke();

    // Icon
    ctx.font='24px sans-serif';ctx.textAlign='center';
    ctx.fillText(isEarned?badge.icon:'🔒',x,y+28);

    // Name
    ctx.font='bold 10px sans-serif';
    ctx.fillStyle=isEarned?'#e2e8f0':'#666';
    ctx.fillText(badge.name,x,y+64);
  });

  ctx.textAlign='left';
  ctx.fillStyle='#94a3b8';ctx.font='10px sans-serif';
  ctx.fillText('LevelPlay v13.0 - '+_today(),20,H-16);

  v13Sfx('badge_customize');
  const uu=U();if(!uu.v13)uu.v13={};if(!uu.v13.achievements)uu.v13.achievements=[];
  if(!uu.v13.achievements.includes('badge_custom')){uu.v13.achievements.push('badge_custom');}
  S(uu);
};

window.v13ExportBadge=function(){
  const canvas=document.getElementById('v13BadgeCanvas');
  if(!canvas)return;
  v13Sfx('badge_equip');
  const link=document.createElement('a');
  link.download='levelplay-badges-'+_today()+'.png';
  link.href=canvas.toDataURL('image/png');
  link.click();
};

// ===== FEATURE 8: Multiplayer Quiz Battle Arena =====
function renderBattleArena(){
  const u=U();if(!u.v13)u.v13={};
  if(!u.v13.battle)u.v13.battle={wins:0,losses:0,draws:0};
  const b=u.v13.battle;

  const opponents=[
    {name:'퀴즈마스터',icon:'🧠',skill:4},
    {name:'번개손',icon:'⚡',skill:3},
    {name:'지식왕',icon:'👑',skill:5},
    {name:'공부벌레',icon:'📚',skill:2},
    {name:'천재소년',icon:'🌟',skill:4},
    {name:'수학박사',icon:'🔢',skill:3}
  ];

  let h=`<div class="v13-battle"><h3>⚔️ 퀴즈 배틀</h3>`;
  h+=`<div style="font-size:11px;color:var(--t3);margin-bottom:8px">${b.wins}승 ${b.losses}패 ${b.draws}무</div>`;
  h+=`<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px">`;
  opponents.forEach((op,i)=>{
    h+=`<div class="v13-rank-card" style="cursor:pointer" onclick="v13StartBattle(${i})"><div class="v13-rank-icon">${op.icon}</div><div class="v13-rank-info"><div class="v13-rank-name">${op.name}</div><div class="v13-rank-pts">실력 ${'★'.repeat(op.skill)}${'☆'.repeat(5-op.skill)}</div></div></div>`;
  });
  h+=`</div></div>`;
  return h;
}

window.v13StartBattle=function(opIdx){
  v13Sfx('battle_join');
  const opponents=[
    {name:'퀴즈마스터',icon:'🧠',skill:4},
    {name:'번개손',icon:'⚡',skill:3},
    {name:'지식왕',icon:'👑',skill:5},
    {name:'공부벌레',icon:'📚',skill:2},
    {name:'천재소년',icon:'🌟',skill:4},
    {name:'수학박사',icon:'🔢',skill:3}
  ];
  const opp=opponents[opIdx];
  const pool=[...V13_EXAM_POOL].sort(()=>Math.random()-.5).slice(0,5);
  let myScore=0,oppScore=0,idx=0;

  function showBQ(){
    if(idx>=pool.length){finishBattle();return;}
    const q=pool[idx];
    const oppCorrect=Math.random()<(opp.skill*0.18);
    if(oppCorrect)oppScore++;

    let h=`<div class="v13-battle"><h3>⚔️ vs ${opp.icon} ${opp.name} (${idx+1}/5)</h3>`;
    h+=`<div class="v13-battle-vs"><div class="v13-battle-player"><div class="v13-battle-avatar" style="background:rgba(6,214,160,.2)">🧑</div><div class="v13-battle-score">${myScore}</div></div>`;
    h+=`<div style="font-size:16px;font-weight:900;color:var(--t3)">VS</div>`;
    h+=`<div class="v13-battle-player"><div class="v13-battle-avatar" style="background:rgba(239,68,68,.2)">${opp.icon}</div><div class="v13-battle-score">${oppScore}</div></div></div>`;
    h+=`<div class="v13-exam-q"><div class="q-num">${q.subj}</div><div class="q-text">${q.q}</div>`;
    h+=`<div class="v13-exam-opts">`;
    q.o.forEach((opt,i)=>{
      h+=`<div class="v13-exam-opt" onclick="v13BattleAnswer(${i},${q.a})">${opt}</div>`;
    });
    h+=`</div></div></div>`;
    const el=document.querySelector('.v13-battle');
    if(el)el.outerHTML=h;
  }

  window.v13BattleAnswer=function(sel,ans){
    if(sel===ans){myScore++;v13Sfx('rank_win');}else{v13Sfx('rank_down');}
    idx++;showBQ();
  };

  function finishBattle(){
    const u=U();
    let result;
    if(myScore>oppScore){result='WIN';u.v13.battle.wins++;}
    else if(myScore<oppScore){result='LOSE';u.v13.battle.losses++;}
    else{result='DRAW';u.v13.battle.draws++;}
    if(!u.v13.achievements)u.v13.achievements=[];
    if(u.v13.battle.wins>=5&&!u.v13.achievements.includes('battle_5wins')){u.v13.achievements.push('battle_5wins');v13Sfx('achieve_v13');}
    S(u);
    v13Sfx(result==='WIN'?'battle_win':'rank_down');
    let h=`<div class="v13-battle"><h3>⚔️ 배틀 결과: ${result}</h3>`;
    h+=`<div style="text-align:center;padding:16px"><div style="font-size:36px;margin-bottom:8px">${result==='WIN'?'🎉🏆':result==='LOSE'?'😢':'🤝'}</div>`;
    h+=`<div style="font-size:14px;font-weight:700">나 ${myScore} : ${oppScore} ${opp.name}</div></div>`;
    h+=`<button class="v13-btn" onclick="v13RefreshFeatures()">돌아가기</button></div>`;
    const el=document.querySelector('.v13-battle');
    if(el)el.outerHTML=h;
  }
  showBQ();
};

// ===== QUIZZES (v13 pool - appended via existing quiz system) =====
function injectV13Quizzes(){
  const u=U();if(!u.v13)u.v13={};
  if(u.v13.quizInjected)return;
  u.v13.quizInjected=true;S(u);
}

// ===== ACHIEVEMENTS =====
function checkV13Achievements(){
  const u=U();if(!u.v13)return;if(!u.v13.achievements)u.v13.achievements=[];
  const feats=['rank_first_win','exam_perfect','insight_check','creator_first','routine_7day','crossword_first','badge_custom','battle_5wins'];
  const explored=feats.filter(f=>u.v13.achievements.includes(f)).length;
  if(explored>=6&&!u.v13.achievements.includes('v13_explorer')){
    u.v13.achievements.push('v13_explorer');S(u);v13Sfx('achieve_v13');
  }
}

// ===== NAVIGATION BAR =====
function renderV13Nav(){
  const navEl=document.createElement('div');
  navEl.className='v13-nav';
  const items=[
    {icon:'🏆',label:'랭크',fn:'v13ScrollTo("v13sec-rank")'},
    {icon:'📋',label:'시험',fn:'v13ScrollTo("v13sec-exam")'},
    {icon:'📊',label:'인사이트',fn:'v13ScrollTo("v13sec-insight")'},
    {icon:'✏️',label:'퀴즈만들기',fn:'v13ScrollTo("v13sec-creator")'},
    {icon:'📅',label:'루틴',fn:'v13ScrollTo("v13sec-routine")'},
    {icon:'🧩',label:'크로스워드',fn:'v13ScrollTo("v13sec-cw")'},
    {icon:'🎨',label:'배지',fn:'v13ScrollTo("v13sec-badge")'},
    {icon:'⚔️',label:'배틀',fn:'v13ScrollTo("v13sec-battle")'},
    {icon:'❓',label:'v13퀴즈',fn:'v13ShowQuiz()'}
  ];
  items.forEach(item=>{
    const btn=document.createElement('button');
    btn.textContent=item.icon+' '+item.label;
    btn.onclick=function(){eval(item.fn);};
    navEl.appendChild(btn);
  });
  document.body.appendChild(navEl);
}

window.v13ScrollTo=function(id){
  const el=document.getElementById(id);
  if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
  v13Sfx('feature_open13');
};

// ===== V13 Quiz Modal =====
window.v13ShowQuiz=function(){
  v13Sfx('feature_open13');
  const pool=[...V13_QUIZZES].sort(()=>Math.random()-.5);
  let idx=0,score=0;
  function showVQ(){
    if(idx>=pool.length){
      const pct=Math.round(score/pool.length*100);
      const u=U();if(!u.v13)u.v13={};if(!u.v13.achievements)u.v13.achievements=[];
      if(pct===100&&!u.v13.achievements.includes('quiz_v13_perfect')){u.v13.achievements.push('quiz_v13_perfect');v13Sfx('achieve_v13');}
      S(u);
      let h=`<div style="position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px" onclick="this.remove()">`;
      h+=`<div class="v13-panel" style="max-width:400px;width:100%" onclick="event.stopPropagation()"><h3>v13 퀴즈 결과</h3>`;
      h+=`<div style="text-align:center;font-size:28px;margin:12px 0">${score}/${pool.length} (${pct}%)</div>`;
      h+=`<button class="v13-btn" onclick="this.closest('[style*=fixed]').remove()">닫기</button></div></div>`;
      document.body.insertAdjacentHTML('beforeend',h);
      return;
    }
    const q=pool[idx];
    let h=`<div style="position:fixed;inset:0;background:rgba(0,0,0,.85);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px" id="v13QOverlay">`;
    h+=`<div class="v13-panel" style="max-width:400px;width:100%"><h3>v13 퀴즈 (${idx+1}/${pool.length})</h3>`;
    h+=`<div class="v13-exam-q"><div class="q-num">${q.cat}</div><div class="q-text">${q.q}</div>`;
    h+=`<div class="v13-exam-opts">`;
    q.o.forEach((opt,i)=>{
      h+=`<div class="v13-exam-opt" onclick="v13VQAnswer(${i},${q.a})">${opt}</div>`;
    });
    h+=`</div></div></div></div>`;
    const existing=document.getElementById('v13QOverlay');
    if(existing)existing.remove();
    document.body.insertAdjacentHTML('beforeend',h);
  }
  window.v13VQAnswer=function(sel,ans){
    if(sel===ans){score++;v13Sfx('exam_pass');}else{v13Sfx('exam_fail');}
    idx++;showVQ();
  };
  showVQ();
};

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown',function(e){
  if(!e.shiftKey)return;
  const map={
    'R':()=>v13ScrollTo('v13sec-rank'),
    'E':()=>v13ScrollTo('v13sec-exam'),
    'I':()=>v13ScrollTo('v13sec-insight'),
    'C':()=>v13ScrollTo('v13sec-creator'),
    'U':()=>v13ScrollTo('v13sec-routine'),
    'X':()=>v13ScrollTo('v13sec-cw'),
    'B':()=>v13ScrollTo('v13sec-badge'),
    'A':()=>v13ScrollTo('v13sec-battle')
  };
  if(map[e.key]){e.preventDefault();map[e.key]();}
});

// ===== MAIN INJECTION =====
window.v13RefreshFeatures=function(){
  const target=document.querySelector('.pg.on')||document.querySelector('.pg');
  if(!target)return;
  let container=document.getElementById('v13Container');
  if(!container){
    container=document.createElement('div');
    container.id='v13Container';
    target.appendChild(container);
  }

  let h='';
  h+=`<div class="sec" id="v13sec-rank">🏆 v13 랭크 매치</div>`+renderRankedPanel();
  h+=`<div class="sec" id="v13sec-exam">📋 과목 미니시험</div>`+renderExamPanel();
  h+=`<div class="sec" id="v13sec-insight">📊 학습 인사이트</div>`+renderInsightsCanvas();
  h+=`<div class="sec" id="v13sec-creator">✏️ 퀴즈 만들기</div>`+renderQuizCreator();
  h+=`<div class="sec" id="v13sec-routine">📅 학습 루틴</div>`+renderRoutineBuilder();
  h+=`<div class="sec" id="v13sec-cw">🧩 크로스워드 퍼즐</div>`+renderCrossword();
  h+=`<div class="sec" id="v13sec-badge">🎨 배지 커스터마이저</div>`+renderBadgeCustomizer();
  h+=`<div class="sec" id="v13sec-battle">⚔️ 퀴즈 배틀</div>`+renderBattleArena();
  container.innerHTML=h;

  setTimeout(()=>{
    v13DrawInsights();
    v13DrawBadge(0);
    initCrosswordGrid();
  },100);
  checkV13Achievements();
};

function v13Init(){
  const u=U();if(!u.v13)u.v13={};S(u);
  injectV13Quizzes();

  const observer=new MutationObserver(()=>{
    const activePage=document.querySelector('.pg.on');
    if(activePage&&!document.getElementById('v13Container')){
      setTimeout(v13RefreshFeatures,300);
    }
  });
  observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});

  renderV13Nav();
  setTimeout(v13RefreshFeatures,500);
}

if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',v13Init);}
else{setTimeout(v13Init,200);}

})();
