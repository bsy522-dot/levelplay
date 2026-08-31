// LevelPlay v8.0 Patch - Learning Path Map Canvas + Subject Mastery Tree Canvas
// + Coding Sandbox + Focus Timer + Achievement Gallery Canvas + Daily Mission Board
// + Smart Review Queue + Study Leaderboard Canvas + Difficulty Tier System
// + Study Heatmap Canvas + 50 Quizzes + 12 Badges + SFX 10 + KB 8
(function(){
'use strict';

function _el(id){return document.getElementById(id);}
function U(){try{return JSON.parse(localStorage.getItem('lp_user'))||{};}catch(e){return {};}}
function S(u){localStorage.setItem('lp_user',JSON.stringify(u));}

// ===== Audio Engine =====
const v8Ctx=(function(){try{return new(window.AudioContext||window.webkitAudioContext)();}catch(e){return null;}})();
function v8Sfx(type){
  if(!v8Ctx)return;try{
  const o=v8Ctx.createOscillator(),g=v8Ctx.createGain();
  o.connect(g);g.connect(v8Ctx.destination);
  const t=v8Ctx.currentTime;
  const map={
    path_open:[523.25,.15,'sine'],path_node:[659.25,.12,'triangle'],
    mastery_up:[783.99,.18,'sine'],mastery_done:[1046.5,.25,'sine'],
    code_run:[440,.12,'square'],code_pass:[880,.2,'sine'],
    focus_start:[329.63,.15,'triangle'],focus_end:[659.25,.2,'sine'],
    gallery_open:[523.25,.1,'triangle'],mission_done:[783.99,.18,'sine'],
    review_flip:[440,.08,'triangle'],review_ok:[659.25,.12,'sine'],
    leader_open:[523.25,.12,'sine'],tier_up:[880,.2,'sine'],
    heatmap_open:[392,.1,'triangle'],quiz_v8:[659.25,.15,'sine']
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
const v8css=document.createElement('style');
v8css.textContent=`
/* v8 Learning Path Map */
.v8-pathmap{background:var(--c1);border:1px solid rgba(139,92,246,.1);border-radius:12px;padding:14px;margin-bottom:10px}
.v8-pathmap canvas{width:100%;border-radius:8px;cursor:pointer}
.v8-pathmap-legend{display:flex;gap:12px;margin-top:8px;font-size:10px;color:var(--t3);flex-wrap:wrap}
.v8-pathmap-legend span{display:flex;align-items:center;gap:4px}
.v8-pathmap-legend .dot{width:10px;height:10px;border-radius:50%}
/* v8 Mastery Tree */
.v8-mastery{background:var(--c1);border:1px solid rgba(6,214,160,.1);border-radius:12px;padding:14px;margin-bottom:10px}
.v8-mastery canvas{width:100%;border-radius:8px}
.v8-mastery-info{display:flex;gap:8px;margin-top:8px;flex-wrap:wrap}
.v8-mastery-info .mi{background:var(--c2);border-radius:8px;padding:8px 12px;font-size:11px;flex:1;min-width:80px;text-align:center}
.v8-mastery-info .mi b{display:block;font-size:16px;margin-bottom:2px}
/* v8 Coding Sandbox */
.v8-sandbox{background:var(--c1);border:1px solid rgba(139,92,246,.1);border-radius:12px;padding:14px;margin-bottom:10px}
.v8-sandbox select{background:var(--c2);color:var(--tx);border:1px solid rgba(139,92,246,.15);border-radius:6px;padding:6px 10px;font:12px inherit;margin-bottom:8px;width:100%}
.v8-sandbox textarea{width:100%;min-height:100px;background:var(--bg);color:var(--cy);border:1px solid rgba(139,92,246,.15);border-radius:8px;padding:10px;font:13px 'Courier New',monospace;resize:vertical}
.v8-sandbox .v8-run{margin-top:8px;padding:8px 16px;border-radius:8px;border:1px solid rgba(6,214,160,.2);background:rgba(6,214,160,.08);color:var(--cy);font:12px inherit;font-weight:700;cursor:pointer}
.v8-sandbox .v8-run:hover{border-color:var(--cy)}
.v8-sandbox .v8-output{margin-top:8px;background:var(--bg);border:1px solid rgba(139,92,246,.08);border-radius:8px;padding:10px;font:12px 'Courier New',monospace;color:var(--tx);min-height:40px;max-height:120px;overflow-y:auto}
.v8-sandbox .v8-result{margin-top:6px;font-size:11px;padding:6px 10px;border-radius:6px}
.v8-sandbox .v8-result.pass{background:rgba(34,197,94,.1);color:var(--gn);border:1px solid rgba(34,197,94,.2)}
.v8-sandbox .v8-result.fail{background:rgba(239,68,68,.1);color:var(--rd);border:1px solid rgba(239,68,68,.2)}
/* v8 Focus Timer */
.v8-focus{background:linear-gradient(135deg,var(--c1),rgba(139,92,246,.04));border:1.5px solid rgba(139,92,246,.12);border-radius:12px;padding:14px;margin-bottom:10px;text-align:center}
.v8-focus-time{font-size:42px;font-weight:900;font-variant-numeric:tabular-nums;background:var(--g1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:8px 0}
.v8-focus-btns{display:flex;gap:8px;justify-content:center;margin-top:10px;flex-wrap:wrap}
.v8-focus-btns button{padding:8px 16px;border-radius:8px;border:1px solid rgba(139,92,246,.2);background:rgba(139,92,246,.06);color:var(--p);font:12px inherit;font-weight:600;cursor:pointer}
.v8-focus-btns button.active{border-color:var(--cy);background:rgba(6,214,160,.1);color:var(--cy)}
.v8-focus-stat{display:flex;gap:12px;justify-content:center;margin-top:10px;font-size:11px;color:var(--t3)}
/* v8 Achievement Gallery */
.v8-gallery{background:var(--c1);border:1px solid rgba(251,191,36,.1);border-radius:12px;padding:14px;margin-bottom:10px}
.v8-gallery canvas{width:100%;border-radius:8px}
.v8-gallery-stats{display:flex;gap:10px;margin-top:8px;flex-wrap:wrap}
.v8-gallery-stats .gs{flex:1;min-width:60px;text-align:center;font-size:10px;color:var(--t3)}
.v8-gallery-stats .gs b{display:block;font-size:14px;color:var(--gd)}
/* v8 Daily Mission Board */
.v8-missions{background:linear-gradient(135deg,var(--c1),rgba(251,191,36,.03));border:1.5px solid rgba(251,191,36,.1);border-radius:12px;padding:14px;margin-bottom:10px}
.v8-mission-item{display:flex;align-items:center;gap:10px;padding:10px;background:var(--c2);border:1px solid rgba(139,92,246,.08);border-radius:8px;margin-bottom:6px}
.v8-mission-item.done{opacity:.7;border-color:rgba(34,197,94,.2)}
.v8-mission-item .mi-icon{font-size:20px;flex-shrink:0}
.v8-mission-item .mi-info{flex:1}
.v8-mission-item .mi-name{font-size:12px;font-weight:600}
.v8-mission-item .mi-desc{font-size:10px;color:var(--t3)}
.v8-mission-item .mi-prog{height:4px;background:var(--bg);border-radius:2px;margin-top:4px;overflow:hidden}
.v8-mission-item .mi-prog-fill{height:100%;background:var(--g1);border-radius:2px;transition:width .3s}
.v8-mission-item .mi-reward{font-size:10px;font-weight:700;color:var(--gd);flex-shrink:0}
/* v8 Smart Review */
.v8-review{background:var(--c1);border:1px solid rgba(139,92,246,.1);border-radius:12px;padding:14px;margin-bottom:10px}
.v8-review-card{background:var(--c2);border:1.5px solid rgba(139,92,246,.12);border-radius:12px;padding:20px;text-align:center;min-height:120px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;transition:transform .2s}
.v8-review-card:active{transform:scale(.98)}
.v8-review-q{font-size:14px;font-weight:600;margin-bottom:12px}
.v8-review-a{font-size:13px;color:var(--cy);display:none}
.v8-review-card.flipped .v8-review-q{display:none}
.v8-review-card.flipped .v8-review-a{display:block}
.v8-review-btns{display:flex;gap:8px;margin-top:10px;justify-content:center}
.v8-review-btns button{padding:8px 16px;border-radius:8px;border:1px solid;font:11px inherit;font-weight:600;cursor:pointer}
.v8-review-btns .v8-again{border-color:rgba(239,68,68,.3);background:rgba(239,68,68,.08);color:var(--rd)}
.v8-review-btns .v8-good{border-color:rgba(6,214,160,.3);background:rgba(6,214,160,.08);color:var(--cy)}
.v8-review-btns .v8-easy{border-color:rgba(139,92,246,.3);background:rgba(139,92,246,.08);color:var(--p)}
/* v8 Leaderboard */
.v8-leader{background:var(--c1);border:1px solid rgba(139,92,246,.1);border-radius:12px;padding:14px;margin-bottom:10px}
.v8-leader canvas{width:100%;border-radius:8px}
/* v8 Tier System */
.v8-tier{display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px}
.v8-tier.bronze{background:rgba(205,127,50,.15);color:#cd7f32}
.v8-tier.silver{background:rgba(192,192,192,.15);color:#c0c0c0}
.v8-tier.gold{background:rgba(255,215,0,.15);color:#ffd700}
.v8-tier.platinum{background:rgba(139,92,246,.15);color:#8b5cf6}
.v8-tier.diamond{background:rgba(6,214,160,.15);color:#06d6a0}
/* v8 Heatmap */
.v8-heatmap{background:var(--c1);border:1px solid rgba(6,214,160,.1);border-radius:12px;padding:14px;margin-bottom:10px}
.v8-heatmap canvas{width:100%;border-radius:8px}
.v8-heatmap-info{display:flex;justify-content:space-between;margin-top:8px;font-size:10px;color:var(--t3)}
/* v8 Quick Actions */
.v8-qa{position:fixed;left:6px;top:50%;transform:translateY(-50%);z-index:990;display:flex;flex-direction:column;gap:4px}
.v8-qa button{width:36px;height:36px;border-radius:10px;border:1px solid rgba(139,92,246,.15);background:rgba(10,10,26,.92);color:var(--tx);font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);transition:.15s}
.v8-qa button:hover{border-color:var(--cy);transform:scale(1.08)}
@media(max-width:480px){.v8-qa{display:none}}
`;
document.head.appendChild(v8css);

// ===== 1. Learning Path Map Canvas =====
function v8RenderPathMap(container){
  const wrap=document.createElement('div');
  wrap.className='v8-pathmap';
  wrap.innerHTML='<div class="sec"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-map"/></svg> 학습 경로 맵</div><canvas id="v8PathCanvas" width="640" height="360"></canvas><div class="v8-pathmap-legend"><span><span class="dot" style="background:#22c55e"></span> 완료</span><span><span class="dot" style="background:#8b5cf6"></span> 진행중</span><span><span class="dot" style="background:#334155"></span> 미시작</span><span><span class="dot" style="background:#fbbf24"></span> 추천</span></div>';
  container.appendChild(wrap);
  setTimeout(()=>{
    const c=_el('v8PathCanvas');if(!c)return;
    const ctx=c.getContext('2d');
    const u=U();
    const subjs=u.kidMode?
      [{n:'수학',ic:'🔢'},{n:'과학',ic:'🔬'},{n:'한국사',ic:'🇰🇷'},{n:'영어',ic:'🔤'},{n:'코딩',ic:'💻'},{n:'음악',ic:'🎵'},{n:'미술',ic:'🎨'},{n:'체육',ic:'⚽'},{n:'사회',ic:'🏘️'},{n:'안전건강',ic:'🛡️'},{n:'인성감성',ic:'💛'}]:
      [{n:'수학',ic:'🔢'},{n:'물리학',ic:'⚛️'},{n:'화학',ic:'🧪'},{n:'역사',ic:'📜'},{n:'경제학',ic:'📈'},{n:'컴퓨터과학',ic:'🖥️'},{n:'법학',ic:'⚖️'},{n:'심리학',ic:'🧠'},{n:'음악',ic:'🎶'},{n:'미술디자인',ic:'🎨'},{n:'경영',ic:'💼'}];
    const stats=u.stats||{};
    const lessonsBySubj=stats.lessonsBySubject||{};
    const quizByCat=stats.quizByCategory||{};
    ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,640,360);
    const cols=4,rows=Math.ceil(subjs.length/cols);
    const cellW=640/cols,cellH=360/rows;
    subjs.forEach((s,i)=>{
      const col=i%cols,row=Math.floor(i/cols);
      const cx=col*cellW+cellW/2,cy=row*cellH+cellH/2;
      const lessons=lessonsBySubj[s.n]||0;
      const quiz=quizByCat[s.n]||{total:0,correct:0};
      const progress=Math.min(lessons*5+(quiz.correct||0)*2,100);
      const status=progress>=80?'done':progress>0?'active':'locked';
      const rec=progress>0&&progress<80;
      if(i>0&&i%cols!==0){
        const px=(col-1)*cellW+cellW/2;
        ctx.strokeStyle='rgba(139,92,246,.15)';ctx.lineWidth=1.5;
        ctx.setLineDash([4,4]);
        ctx.beginPath();ctx.moveTo(px+28,cy);ctx.lineTo(cx-28,cy);ctx.stroke();
        ctx.setLineDash([]);
      }
      if(row>0){
        const py=(row-1)*cellH+cellH/2;
        ctx.strokeStyle='rgba(139,92,246,.1)';ctx.lineWidth=1;
        ctx.setLineDash([3,5]);
        ctx.beginPath();ctx.moveTo(cx,py+28);ctx.lineTo(cx,cy-28);ctx.stroke();
        ctx.setLineDash([]);
      }
      const nodeR=24;
      const grd=ctx.createRadialGradient(cx,cy,0,cx,cy,nodeR);
      if(status==='done'){grd.addColorStop(0,'#22c55e');grd.addColorStop(1,'#15803d');}
      else if(status==='active'){grd.addColorStop(0,'#8b5cf6');grd.addColorStop(1,'#6d28d9');}
      else{grd.addColorStop(0,'#334155');grd.addColorStop(1,'#1e293b');}
      ctx.beginPath();ctx.arc(cx,cy,nodeR,0,Math.PI*2);ctx.fillStyle=grd;ctx.fill();
      if(rec){
        ctx.strokeStyle='#fbbf24';ctx.lineWidth=2;
        ctx.beginPath();ctx.arc(cx,cy,nodeR+4,0,Math.PI*2);ctx.stroke();
      }
      if(status==='done'){
        ctx.fillStyle='#fff';ctx.font='bold 14px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText('✓',cx,cy);
      }else{
        ctx.fillStyle='#fff';ctx.font='16px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(s.ic,cx,cy);
      }
      ctx.fillStyle=status==='done'?'#22c55e':status==='active'?'#e2e8f0':'#64748b';
      ctx.font='bold 10px sans-serif';ctx.textAlign='center';
      ctx.fillText(s.n,cx,cy+nodeR+14);
      ctx.fillStyle='#64748b';ctx.font='9px sans-serif';
      ctx.fillText(progress+'%',cx,cy+nodeR+26);
    });
  },100);
  v8Sfx('path_open');
  v8Track('path_map');
}

// ===== 2. Subject Mastery Tree Canvas =====
function v8RenderMasteryTree(container){
  const wrap=document.createElement('div');
  wrap.className='v8-mastery';
  wrap.innerHTML='<div class="sec"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-tree"/></svg> 과목 마스터리 트리</div><canvas id="v8MasteryCanvas" width="640" height="320"></canvas><div class="v8-mastery-info" id="v8MasteryInfo"></div>';
  container.appendChild(wrap);
  setTimeout(()=>{
    const c=_el('v8MasteryCanvas');if(!c)return;
    const ctx=c.getContext('2d');
    const u=U();
    const tiers=['Bronze','Silver','Gold','Platinum','Diamond'];
    const tierColors=['#cd7f32','#c0c0c0','#ffd700','#8b5cf6','#06d6a0'];
    const tierThresh=[0,20,40,70,90];
    const stats=u.stats||{};
    const lessonsBySubj=stats.lessonsBySubject||{};
    const subjNames=Object.keys(lessonsBySubj);
    const allSubjs=u.kidMode?['수학','과학','한국사','영어','코딩','음악','미술','체육','사회','안전건강','인성감성']:['수학','물리학','화학','역사','경제학','컴퓨터과학','법학','심리학','음악','미술디자인','경영'];
    ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,640,320);
    ctx.fillStyle='rgba(139,92,246,.06)';
    for(let y=0;y<5;y++){
      ctx.fillRect(0,y*64,640,1);
      ctx.fillStyle='#475569';ctx.font='9px sans-serif';ctx.textAlign='left';
      ctx.fillText(tiers[4-y],4,y*64+14);
      ctx.fillStyle='rgba(139,92,246,.06)';
    }
    const barW=Math.min(40,600/allSubjs.length-8);
    const startX=(640-allSubjs.length*(barW+8))/2;
    let totalMastery=0;
    allSubjs.forEach((subj,i)=>{
      const lessons=lessonsBySubj[subj]||0;
      const progress=Math.min(lessons*8,100);
      totalMastery+=progress;
      const tierIdx=tierThresh.filter(t=>progress>=t).length-1;
      const barH=Math.max(progress/100*280,4);
      const x=startX+i*(barW+8);
      const y=300-barH;
      const grd=ctx.createLinearGradient(x,y+barH,x,y);
      grd.addColorStop(0,tierColors[tierIdx]+'44');
      grd.addColorStop(1,tierColors[tierIdx]);
      ctx.fillStyle=grd;
      ctx.beginPath();
      const r=3;
      ctx.moveTo(x+r,y);ctx.lineTo(x+barW-r,y);ctx.quadraticCurveTo(x+barW,y,x+barW,y+r);
      ctx.lineTo(x+barW,y+barH);ctx.lineTo(x,y+barH);ctx.lineTo(x,y+r);
      ctx.quadraticCurveTo(x,y,x+r,y);ctx.fill();
      ctx.fillStyle='#e2e8f0';ctx.font='bold 9px sans-serif';ctx.textAlign='center';
      ctx.save();ctx.translate(x+barW/2,310);ctx.rotate(-Math.PI/6);ctx.fillText(subj,0,0);ctx.restore();
      ctx.fillStyle=tierColors[tierIdx];ctx.font='bold 8px sans-serif';
      ctx.fillText(tiers[tierIdx].charAt(0),x+barW/2,y-6);
    });
    const avg=allSubjs.length>0?Math.round(totalMastery/allSubjs.length):0;
    const info=_el('v8MasteryInfo');
    if(info){
      const tierIdx=tierThresh.filter(t=>avg>=t).length-1;
      info.innerHTML='<div class="mi"><b>'+avg+'%</b>평균 마스터리</div><div class="mi"><b>'+tiers[tierIdx]+'</b>전체 등급</div><div class="mi"><b>'+subjNames.length+'/'+allSubjs.length+'</b>시작한 과목</div>';
    }
  },150);
  v8Sfx('mastery_up');
  v8Track('mastery_tree');
}

// ===== 3. Coding Sandbox =====
const V8_CODE_CHALLENGES=[
  {id:'hello',title:'Hello World 출력',desc:'console.log를 사용해 &quot;Hello World&quot;를 출력하세요',starter:'// 여기에 코드를 작성하세요\n',test:function(out){return out.trim()==='Hello World';},hint:'console.log("Hello World")'},
  {id:'add',title:'두 수 더하기',desc:'a와 b를 더한 결과를 return하는 함수 add를 완성하세요',starter:'function add(a, b) {\n  // 여기에 코드를 작성하세요\n}\nconsole.log(add(3, 5));',test:function(out){return out.trim()==='8';},hint:'return a + b;'},
  {id:'even',title:'짝수 판별',desc:'숫자가 짝수이면 true, 홀수이면 false를 return하세요',starter:'function isEven(n) {\n  // 여기에 코드를 작성하세요\n}\nconsole.log(isEven(4));',test:function(out){return out.trim()==='true';},hint:'return n % 2 === 0;'},
  {id:'max',title:'최대값 찾기',desc:'배열에서 가장 큰 수를 return하세요',starter:'function findMax(arr) {\n  // 여기에 코드를 작성하세요\n}\nconsole.log(findMax([3,7,2,9,1]));',test:function(out){return out.trim()==='9';},hint:'return Math.max(...arr);'},
  {id:'reverse',title:'문자열 뒤집기',desc:'문자열을 뒤집어서 return하세요',starter:'function reverse(str) {\n  // 여기에 코드를 작성하세요\n}\nconsole.log(reverse("hello"));',test:function(out){return out.trim()==='olleh';},hint:'return str.split("").reverse().join("");'},
  {id:'fizzbuzz',title:'FizzBuzz',desc:'1~15까지 FizzBuzz를 출력하세요 (3의배수:Fizz, 5의배수:Buzz, 둘다:FizzBuzz)',starter:'for (let i = 1; i <= 15; i++) {\n  // 여기에 코드를 작성하세요\n}',test:function(out){return out.includes('FizzBuzz')&&out.includes('Fizz')&&out.includes('Buzz');},hint:'if(i%15===0) ... else if(i%3===0) ...'},
  {id:'sum',title:'배열 합계',desc:'배열의 모든 수를 합한 결과를 return하세요',starter:'function sum(arr) {\n  // 여기에 코드를 작성하세요\n}\nconsole.log(sum([1,2,3,4,5]));',test:function(out){return out.trim()==='15';},hint:'return arr.reduce((a,b) => a+b, 0);'},
  {id:'count',title:'글자 수 세기',desc:'문자열에서 특정 글자가 몇 번 나오는지 세세요',starter:'function countChar(str, ch) {\n  // 여기에 코드를 작성하세요\n}\nconsole.log(countChar("banana", "a"));',test:function(out){return out.trim()==='3';},hint:'return str.split(ch).length - 1;'}
];

function v8RenderSandbox(container){
  const wrap=document.createElement('div');
  wrap.className='v8-sandbox';
  let opts='';
  V8_CODE_CHALLENGES.forEach((ch,i)=>{opts+='<option value="'+i+'">'+ch.title+'</option>';});
  wrap.innerHTML='<div class="sec"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-code"/></svg> 코딩 샌드박스</div><select id="v8CodeSelect">'+opts+'</select><div id="v8CodeDesc" style="font-size:11px;color:var(--t3);margin-bottom:8px"></div><textarea id="v8CodeEditor" spellcheck="false"></textarea><div style="display:flex;gap:8px;align-items:center"><button class="v8-run" onclick="v8RunCode()">▶ 실행</button><button class="v8-run" style="border-color:rgba(251,191,36,.2);color:var(--gd);background:rgba(251,191,36,.06)" onclick="v8ShowHint()"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-bulb"/></svg> 힌트</button></div><div id="v8CodeOutput" class="v8-output"></div><div id="v8CodeResult"></div>';
  container.appendChild(wrap);
  const sel=_el('v8CodeSelect');
  if(sel){
    sel.addEventListener('change',v8LoadChallenge);
    v8LoadChallenge();
  }
  v8Track('sandbox');
}

function v8LoadChallenge(){
  const sel=_el('v8CodeSelect');if(!sel)return;
  const ch=V8_CODE_CHALLENGES[sel.value];
  const desc=_el('v8CodeDesc');if(desc)desc.textContent=ch.desc;
  const editor=_el('v8CodeEditor');if(editor)editor.value=ch.starter;
  const output=_el('v8CodeOutput');if(output)output.textContent='';
  const result=_el('v8CodeResult');if(result)result.innerHTML='';
}

window.v8RunCode=function(){
  const sel=_el('v8CodeSelect');if(!sel)return;
  const ch=V8_CODE_CHALLENGES[sel.value];
  const editor=_el('v8CodeEditor');if(!editor)return;
  const output=_el('v8CodeOutput');
  const result=_el('v8CodeResult');
  let captured='';
  const origLog=console.log;
  console.log=function(){
    captured+=Array.from(arguments).join(' ')+'\n';
    origLog.apply(console,arguments);
  };
  try{
    const fn=new Function(editor.value);
    fn();
    if(output)output.textContent=captured.trim()||'(출력 없음)';
    const passed=ch.test(captured);
    if(result){
      result.className='v8-result '+(passed?'pass':'fail');
      result.textContent=passed?'✅ 통과! +15 XP':'❌ 오답 — 다시 시도해보세요';
    }
    if(passed){
      v8Sfx('code_pass');
      const u=U();u.xp=(u.xp||0)+15;
      if(!u.v8codeCompleted)u.v8codeCompleted=[];
      if(!u.v8codeCompleted.includes(ch.id))u.v8codeCompleted.push(ch.id);
      S(u);
    }else{v8Sfx('code_run');}
  }catch(e){
    if(output)output.textContent='오류: '+e.message;
    if(result){result.className='v8-result fail';result.textContent='⚠️ 실행 오류';}
    v8Sfx('code_run');
  }
  console.log=origLog;
};

window.v8ShowHint=function(){
  const sel=_el('v8CodeSelect');if(!sel)return;
  const ch=V8_CODE_CHALLENGES[sel.value];
  const output=_el('v8CodeOutput');
  if(output)output.textContent='💡 힌트: '+ch.hint;
};

// ===== 4. Focus Timer =====
let v8FocusInterval=null,v8FocusRemaining=0,v8FocusRunning=false,v8FocusSessions=0;

function v8RenderFocusTimer(container){
  const wrap=document.createElement('div');
  wrap.className='v8-focus';
  wrap.innerHTML='<div class="sec" style="justify-content:center"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-timer"/></svg> 집중 학습 타이머</div><div class="v8-focus-time" id="v8FocusTime">25:00</div><div class="v8-focus-btns"><button onclick="v8SetFocus(15)">15분</button><button onclick="v8SetFocus(25)" class="active">25분</button><button onclick="v8SetFocus(45)">45분</button><button onclick="v8StartFocus()" id="v8FocusStartBtn">▶ 시작</button></div><div class="v8-focus-stat"><span>오늘 세션: <b id="v8FocusSessions">0</b></span><span>총 집중: <b id="v8FocusTotal">0</b>분</span></div>';
  container.appendChild(wrap);
  const u=U();
  v8FocusSessions=u.v8focusSessions||0;
  const se=_el('v8FocusSessions');if(se)se.textContent=v8FocusSessions;
  const tot=_el('v8FocusTotal');if(tot)tot.textContent=u.v8focusMinutes||0;
  v8FocusRemaining=25*60;
  v8Track('focus_timer');
}

window.v8SetFocus=function(mins){
  if(v8FocusRunning)return;
  v8FocusRemaining=mins*60;
  v8UpdateFocusDisplay();
  document.querySelectorAll('.v8-focus-btns button').forEach(b=>{
    b.classList.toggle('active',b.textContent.includes(mins+'분'));
  });
};

window.v8StartFocus=function(){
  const btn=_el('v8FocusStartBtn');if(!btn)return;
  if(v8FocusRunning){
    clearInterval(v8FocusInterval);
    v8FocusRunning=false;
    btn.textContent='▶ 시작';
    return;
  }
  v8FocusRunning=true;
  btn.textContent='⏸ 일시정지';
  v8Sfx('focus_start');
  v8FocusInterval=setInterval(()=>{
    v8FocusRemaining--;
    v8UpdateFocusDisplay();
    if(v8FocusRemaining<=0){
      clearInterval(v8FocusInterval);
      v8FocusRunning=false;
      btn.textContent='▶ 시작';
      v8FocusSessions++;
      const u=U();
      u.v8focusSessions=(u.v8focusSessions||0)+1;
      u.v8focusMinutes=(u.v8focusMinutes||0)+Math.round((25*60-v8FocusRemaining)/60);
      u.xp=(u.xp||0)+20;
      S(u);
      const se=_el('v8FocusSessions');if(se)se.textContent=v8FocusSessions;
      const tot=_el('v8FocusTotal');if(tot)tot.textContent=u.v8focusMinutes;
      v8Sfx('focus_end');
      v8FocusRemaining=25*60;
      v8UpdateFocusDisplay();
      checkV8Badges();
    }
  },1000);
};

function v8UpdateFocusDisplay(){
  const el=_el('v8FocusTime');if(!el)return;
  const m=Math.floor(v8FocusRemaining/60);
  const s=v8FocusRemaining%60;
  el.textContent=(m<10?'0':'')+m+':'+(s<10?'0':'')+s;
}

// ===== 5. Achievement Gallery Canvas =====
function v8RenderGallery(container){
  const wrap=document.createElement('div');
  wrap.className='v8-gallery';
  wrap.innerHTML='<div class="sec"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-trophy"/></svg> 업적 갤러리</div><canvas id="v8GalleryCanvas" width="640" height="280"></canvas><div class="v8-gallery-stats" id="v8GalleryStats"></div>';
  container.appendChild(wrap);
  setTimeout(()=>{
    const c=_el('v8GalleryCanvas');if(!c)return;
    const ctx=c.getContext('2d');
    const u=U();
    const badges=u.badges||[];
    const v4b=u.v4badges||[];
    const v5b=u.v5badges||[];
    const v6b=u.v6badges||[];
    const v7b=u.v7badges||[];
    const v8b=u.v8badges||[];
    const all=[...badges,...v4b,...v5b,...v6b,...v7b,...v8b];
    const total=76;
    const earned=all.length;
    ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,640,280);
    ctx.fillStyle='#e2e8f0';ctx.font='bold 14px sans-serif';ctx.textAlign='center';
    ctx.fillText('업적 갤러리 — '+earned+'/'+total+' 획득',320,24);
    const cols=10,rows=Math.ceil(total/cols);
    const cellSize=Math.min(50,(640-40)/cols);
    const startX=(640-cols*cellSize)/2;
    const icons=['🎯','📚','🔥','⭐','💎','🏅','🎓','🛡️','💪','🎮','📊','🎵','🔬','💡','🌟','❤️','✨','🏆','🎨','📝','🧠','⚡','🌈','🎪','🔔','🗝️','🏰','🎁','🦊','🐉','🌺','🍀','👑','🎭','🎯','📚','🔥','⭐','💎','🏅','🎓','🛡️','💪','🎮','📊','🎵','🔬','💡','🌟','❤️','✨','🏆','🎨','📝','🧠','⚡','🌈','🎪','🔔','🗝️','🏰','🎁','🦊','🐉','🌺','🍀','👑','🎭','🎯','📚','🔥','⭐','💎','🏅','🎓','🛡️'];
    for(let i=0;i<total;i++){
      const col=i%cols,row=Math.floor(i/cols);
      const x=startX+col*cellSize,y=44+row*cellSize;
      const isEarned=i<earned;
      if(isEarned){
        const grd=ctx.createRadialGradient(x+cellSize/2,y+cellSize/2,0,x+cellSize/2,y+cellSize/2,cellSize/2);
        grd.addColorStop(0,'rgba(251,191,36,.15)');grd.addColorStop(1,'rgba(251,191,36,.03)');
        ctx.fillStyle=grd;
      }else{
        ctx.fillStyle='rgba(30,41,59,.4)';
      }
      ctx.beginPath();
      const r=6;
      ctx.moveTo(x+r+2,y+2);ctx.lineTo(x+cellSize-r-2,y+2);
      ctx.quadraticCurveTo(x+cellSize-2,y+2,x+cellSize-2,y+r+2);
      ctx.lineTo(x+cellSize-2,y+cellSize-r-2);
      ctx.quadraticCurveTo(x+cellSize-2,y+cellSize-2,x+cellSize-r-2,y+cellSize-2);
      ctx.lineTo(x+r+2,y+cellSize-2);
      ctx.quadraticCurveTo(x+2,y+cellSize-2,x+2,y+cellSize-r-2);
      ctx.lineTo(x+2,y+r+2);
      ctx.quadraticCurveTo(x+2,y+2,x+r+2,y+2);
      ctx.fill();
      ctx.font=(isEarned?'':'bold ')+'18px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillStyle=isEarned?'#fff':'#334155';
      ctx.fillText(isEarned?icons[i%icons.length]:'🔒',x+cellSize/2,y+cellSize/2);
    }
    const pct=Math.round(earned/total*100);
    const barY=260,barW=400,barH=8;
    ctx.fillStyle='#1e293b';
    ctx.beginPath();ctx.roundRect(120,barY,barW,barH,4);ctx.fill();
    const grd=ctx.createLinearGradient(120,0,120+barW*pct/100,0);
    grd.addColorStop(0,'#8b5cf6');grd.addColorStop(1,'#06d6a0');
    ctx.fillStyle=grd;
    ctx.beginPath();ctx.roundRect(120,barY,barW*pct/100,barH,4);ctx.fill();
    ctx.fillStyle='#94a3b8';ctx.font='10px sans-serif';ctx.textAlign='center';
    ctx.fillText(pct+'% 완료',320,barY+barH+14);
    const st=_el('v8GalleryStats');
    if(st)st.innerHTML='<div class="gs"><b>'+earned+'</b>획득</div><div class="gs"><b>'+(total-earned)+'</b>남은 배지</div><div class="gs"><b>'+pct+'%</b>완성도</div>';
  },200);
  v8Sfx('gallery_open');
  v8Track('gallery');
}

// ===== 6. Daily Mission Board =====
function v8GetDailyMissions(){
  const today=new Date().toISOString().slice(0,10);
  const seed=today.split('-').reduce((a,b)=>a+parseInt(b),0);
  const allMissions=[
    {id:'quiz3',icon:'📝',name:'퀴즈 3문제 풀기',desc:'아무 과목 퀴즈 3문제',target:3,reward:10,check:function(u){return(u.v8dailyQuiz||0);}},
    {id:'lesson2',icon:'📖',name:'레슨 2개 완료',desc:'아무 과목 레슨 2개 학습',target:2,reward:15,check:function(u){return(u.v8dailyLesson||0);}},
    {id:'streak',icon:'🔥',name:'출석 체크',desc:'오늘 앱 접속 완료',target:1,reward:5,check:function(){return 1;}},
    {id:'focus15',icon:'⏱️',name:'집중 15분',desc:'집중 타이머 15분 이상',target:1,reward:20,check:function(u){return(u.v8focusSessions||0)>0?1:0;}},
    {id:'code1',icon:'💻',name:'코딩 1문제',desc:'코딩 샌드박스에서 1문제 통과',target:1,reward:15,check:function(u){return(u.v8codeCompleted||[]).length>0?1:0;}},
    {id:'review5',icon:'🔄',name:'복습 5장',desc:'스마트 복습 카드 5장',target:5,reward:10,check:function(u){return(u.v8dailyReview||0);}},
    {id:'wrong1',icon:'❌',name:'오답 재도전',desc:'오답노트에서 1문제 재시도',target:1,reward:10,check:function(u){return(u.v8dailyRetry||0);}},
    {id:'explore',icon:'🗺️',name:'3과목 탐험',desc:'3개 이상 과목 방문',target:3,reward:10,check:function(u){return(u.v8dailySubjects||[]).length;}}
  ];
  const shuffled=allMissions.slice();
  let m=shuffled.length,t,i;
  let s=seed;
  while(m){
    s=(s*16807)%2147483647;
    i=s%m--;
    t=shuffled[m];shuffled[m]=shuffled[i];shuffled[i]=t;
  }
  return shuffled.slice(0,5);
}

function v8RenderMissions(container){
  const wrap=document.createElement('div');
  wrap.className='v8-missions';
  const missions=v8GetDailyMissions();
  const u=U();
  let h='<div class="sec"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-clipboard"/></svg> 오늘의 미션</div>';
  let completed=0;
  missions.forEach(m=>{
    const prog=m.check(u);
    const done=prog>=m.target;
    if(done)completed++;
    const pct=Math.min(prog/m.target*100,100);
    h+='<div class="v8-mission-item'+(done?' done':'')+'"><div class="mi-icon">'+m.icon+'</div><div class="mi-info"><div class="mi-name">'+(done?'✅ ':'')+m.name+'</div><div class="mi-desc">'+m.desc+'</div><div class="mi-prog"><div class="mi-prog-fill" style="width:'+pct+'%"></div></div></div><div class="mi-reward">'+(done?'완료':'+')+m.reward+' XP</div></div>';
  });
  h+='<div style="text-align:center;font-size:11px;color:var(--t3);margin-top:8px">완료 '+completed+'/'+missions.length+' — 전부 클리어 시 보너스 +30 XP</div>';
  wrap.innerHTML=h;
  container.appendChild(wrap);
  if(completed>=missions.length){
    const u2=U();
    const today=new Date().toISOString().slice(0,10);
    if(u2.v8missionAllClear!==today){
      u2.v8missionAllClear=today;
      u2.xp=(u2.xp||0)+30;
      S(u2);
      v8Sfx('mission_done');
    }
  }
  v8Track('missions');
}

// ===== 7. Smart Review Queue (SM-2 inspired) =====
function v8GetReviewItems(){
  const u=U();
  const wrongNotes=(u.wrongNotes||[]).slice(-20);
  const items=wrongNotes.map(w=>({
    q:w.q||w.question||'복습 문제',
    a:w.correct||w.answer||'정답 확인',
    subject:w.subject||'기타',
    interval:w.interval||1,
    easeFactor:w.ef||2.5,
    due:w.due||0
  }));
  const now=Date.now();
  return items.filter(i=>!i.due||i.due<=now).slice(0,10);
}

let v8ReviewIdx=0,v8ReviewItems=[];

function v8RenderReview(container){
  const wrap=document.createElement('div');
  wrap.className='v8-review';
  wrap.innerHTML='<div class="sec"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-repeat"/></svg> 스마트 복습</div><div id="v8ReviewArea"></div>';
  container.appendChild(wrap);
  v8ReviewItems=v8GetReviewItems();
  v8ReviewIdx=0;
  v8ShowReviewCard();
  v8Track('review');
}

function v8ShowReviewCard(){
  const area=_el('v8ReviewArea');if(!area)return;
  if(v8ReviewItems.length===0){
    area.innerHTML='<div style="text-align:center;padding:20px;color:var(--t3)"><div style="font-size:28px;margin-bottom:8px">✨</div><div style="font-size:13px">복습할 카드가 없습니다</div><div style="font-size:11px;margin-top:4px">퀴즈를 풀면 오답이 자동으로 복습 카드에 추가됩니다</div></div>';
    return;
  }
  if(v8ReviewIdx>=v8ReviewItems.length){
    area.innerHTML='<div style="text-align:center;padding:20px;color:var(--cy)"><div style="font-size:28px;margin-bottom:8px">🎉</div><div style="font-size:13px;font-weight:600">오늘 복습 완료! +10 XP</div></div>';
    const u=U();u.xp=(u.xp||0)+10;u.v8dailyReview=(u.v8dailyReview||0)+v8ReviewItems.length;S(u);
    return;
  }
  const item=v8ReviewItems[v8ReviewIdx];
  area.innerHTML='<div style="font-size:10px;color:var(--t3);margin-bottom:8px">'+item.subject+' — '+(v8ReviewIdx+1)+'/'+v8ReviewItems.length+'</div><div class="v8-review-card" id="v8ReviewCard" onclick="v8FlipCard()"><div class="v8-review-q">'+item.q+'</div><div class="v8-review-a">'+item.a+'</div></div><div class="v8-review-btns" id="v8ReviewBtns" style="display:none"><button class="v8-again" onclick="v8ReviewRate(0)">다시</button><button class="v8-good" onclick="v8ReviewRate(1)">알겠음</button><button class="v8-easy" onclick="v8ReviewRate(2)">쉬움</button></div>';
  v8Sfx('review_flip');
}

window.v8FlipCard=function(){
  const card=_el('v8ReviewCard');if(!card)return;
  card.classList.toggle('flipped');
  const btns=_el('v8ReviewBtns');if(btns)btns.style.display='flex';
};

window.v8ReviewRate=function(rating){
  v8ReviewIdx++;
  const u=U();u.v8dailyReview=(u.v8dailyReview||0)+1;S(u);
  if(rating>0)v8Sfx('review_ok');
  v8ShowReviewCard();
};

// ===== 8. Study Leaderboard Canvas =====
function v8RenderLeaderboard(container){
  const wrap=document.createElement('div');
  wrap.className='v8-leader';
  wrap.innerHTML='<div class="sec"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-medal"/></svg> 학습 리더보드</div><canvas id="v8LeaderCanvas" width="640" height="300"></canvas>';
  container.appendChild(wrap);
  setTimeout(()=>{
    const c=_el('v8LeaderCanvas');if(!c)return;
    const ctx=c.getContext('2d');
    const u=U();
    const myXP=u.xp||0;
    const myName=u.name||'나';
    /* ★2026-08-31 감사 B-3: '학습왕 민지 620XP' 같은 실재하지 않는 학생 9명을
       내 점수 기준으로 만들어 리더보드에 세우고 있었다. 실이용자가 있는 것처럼 보이게
       하는 조작이라 내렸다. 지금은 내 기록만 정직하게 보여 준다. */
    const ai=[{name:myName+' (나)',xp:myXP,isMe:true}];
    ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,640,300);
    ctx.fillStyle='#e2e8f0';ctx.font='bold 13px sans-serif';ctx.textAlign='center';
    ctx.fillText('이번 주 내 기록',320,22);
    const maxXP=ai[0].xp||1;
    ai.forEach((p,i)=>{
      const y=38+i*26;
      const barW=Math.max(p.xp/maxXP*400,4);
      if(p.isMe){
        ctx.fillStyle='rgba(6,214,160,.08)';
        ctx.fillRect(0,y-4,640,24);
      }
      const medals=['🥇','🥈','🥉'];
      ctx.fillStyle=p.isMe?'#06d6a0':'#94a3b8';ctx.font=(p.isMe?'bold ':'')+'11px sans-serif';ctx.textAlign='left';
      ctx.fillText((i<3?medals[i]:(i+1)+'.')+' '+p.name,10,y+10);
      const grd=ctx.createLinearGradient(200,0,200+barW,0);
      if(p.isMe){grd.addColorStop(0,'#06d6a0');grd.addColorStop(1,'#22d3ee');}
      else{grd.addColorStop(0,'#8b5cf6');grd.addColorStop(1,'#6d28d9');}
      ctx.fillStyle=grd;
      ctx.beginPath();ctx.roundRect(200,y,barW,16,4);ctx.fill();
      ctx.fillStyle=p.isMe?'#06d6a0':'#e2e8f0';ctx.font='bold 10px sans-serif';ctx.textAlign='right';
      ctx.fillText(p.xp+' XP',630,y+12);
    });
  },250);
  v8Sfx('leader_open');
  v8Track('leaderboard');
}

// ===== 9. Study Heatmap Canvas =====
function v8RenderHeatmap(container){
  const wrap=document.createElement('div');
  wrap.className='v8-heatmap';
  wrap.innerHTML='<div class="sec"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-calendar"/></svg> 학습 히트맵</div><canvas id="v8HeatmapCanvas" width="640" height="160"></canvas><div class="v8-heatmap-info"><span id="v8HeatmapTotal"></span><span id="v8HeatmapStreak"></span></div>';
  container.appendChild(wrap);
  setTimeout(()=>{
    const c=_el('v8HeatmapCanvas');if(!c)return;
    const ctx=c.getContext('2d');
    const u=U();
    const dailyXP=u.dailyXP||{};
    ctx.fillStyle='#0a0a1a';ctx.fillRect(0,0,640,160);
    const weeks=13,cellSize=10,gap=2;
    const dayLabels=['일','월','화','수','목','금','토'];
    const startX=30,startY=24;
    ctx.fillStyle='#475569';ctx.font='9px sans-serif';ctx.textAlign='right';
    [1,3,5].forEach(d=>{ctx.fillText(dayLabels[d],startX-4,startY+d*(cellSize+gap)+cellSize-1);});
    const today=new Date();
    let totalDays=0,maxStreak=0,curStreak=0;
    for(let w=weeks-1;w>=0;w--){
      for(let d=0;d<7;d++){
        const daysAgo=(weeks-1-w)*7+(6-d);
        const date=new Date(today);date.setDate(date.getDate()-daysAgo);
        const key=date.toISOString().slice(0,10);
        const xp=dailyXP[key]||0;
        const x=startX+w*(cellSize+gap);
        const y=startY+d*(cellSize+gap);
        let color='#1e293b';
        if(xp>0){
          totalDays++;curStreak++;
          if(curStreak>maxStreak)maxStreak=curStreak;
          if(xp<20)color='#064e3b';
          else if(xp<50)color='#059669';
          else if(xp<100)color='#10b981';
          else color='#34d399';
        }else{curStreak=0;}
        ctx.fillStyle=color;
        ctx.beginPath();ctx.roundRect(x,y,cellSize,cellSize,2);ctx.fill();
      }
    }
    ctx.fillStyle='#64748b';ctx.font='9px sans-serif';ctx.textAlign='left';
    const legendX=startX+weeks*(cellSize+gap)+10;
    ctx.fillText('적음',legendX,startY+10);
    ['#1e293b','#064e3b','#059669','#10b981','#34d399'].forEach((c2,i)=>{
      ctx.fillStyle=c2;ctx.fillRect(legendX+24+i*14,startY,cellSize,cellSize);
    });
    ctx.fillStyle='#64748b';ctx.fillText('많음',legendX+24+5*14+4,startY+10);
    const totalEl=_el('v8HeatmapTotal');if(totalEl)totalEl.textContent='최근 13주 활동일: '+totalDays+'일';
    const streakEl=_el('v8HeatmapStreak');if(streakEl)streakEl.textContent='최장 연속: '+maxStreak+'일';
  },300);
  v8Sfx('heatmap_open');
  v8Track('heatmap');
}

// ===== 10. Difficulty Tier System =====
function v8GetTier(xp){
  if(xp>=2000)return{name:'Diamond',color:'#06d6a0',cls:'diamond',next:Infinity};
  if(xp>=1200)return{name:'Platinum',color:'#8b5cf6',cls:'platinum',next:2000};
  if(xp>=600)return{name:'Gold',color:'#ffd700',cls:'gold',next:1200};
  if(xp>=200)return{name:'Silver',color:'#c0c0c0',cls:'silver',next:600};
  return{name:'Bronze',color:'#cd7f32',cls:'bronze',next:200};
}

function v8InjectTier(){
  const u=U();
  const tier=v8GetTier(u.xp||0);
  const profileArea=document.querySelector('#profilePage .sec');
  if(!profileArea)return;
  const existing=document.querySelector('.v8-tier-badge');
  if(existing)existing.remove();
  const el=document.createElement('span');
  el.className='v8-tier v8-tier-badge '+tier.cls;
  el.textContent=tier.name;
  el.title='다음 티어까지 '+(tier.next-(u.xp||0))+' XP 필요';
  profileArea.appendChild(el);
}

// ===== Quizzes (+50) =====
const V8_QUIZZES=[
  {q:'컴퓨터에서 0과 1로 이루어진 수 체계를 무엇이라 하나요?',a:['이진법','십진법','팔진법','로마숫자'],c:0,s:'코딩'},
  {q:'HTML에서 가장 큰 제목 태그는?',a:['<h1>','<h6>','<title>','<header>'],c:0,s:'코딩'},
  {q:'CSS에서 글자 색을 바꾸는 속성은?',a:['color','font-color','text-color','fg-color'],c:0,s:'코딩'},
  {q:'JavaScript에서 배열의 길이를 구하는 속성은?',a:['.length','.size','.count','.total'],c:0,s:'코딩'},
  {q:'프로그래밍에서 반복문이 아닌 것은?',a:['if','for','while','do-while'],c:0,s:'코딩'},
  {q:'피타고라스 정리에서 빗변의 제곱은?',a:['두 변의 제곱의 합','두 변의 곱','두 변의 합','두 변의 차'],c:0,s:'수학'},
  {q:'원주율 파이(π)의 소수점 두 자리까지 값은?',a:['3.14','3.41','2.71','3.16'],c:0,s:'수학'},
  {q:'1+2+3+...+100의 합은?',a:['5050','5000','5500','4950'],c:0,s:'수학'},
  {q:'직각삼각형에서 90도인 각의 대변을 무엇이라 하나요?',a:['빗변','밑변','높이','대각선'],c:0,s:'수학'},
  {q:'소수(Prime Number)가 아닌 것은?',a:['9','7','11','13'],c:0,s:'수학'},
  {q:'물의 화학식은?',a:['H₂O','CO₂','NaCl','O₂'],c:0,s:'과학'},
  {q:'지구에서 달까지의 평균 거리는 약?',a:['38만 km','150만 km','1만 km','100만 km'],c:0,s:'과학'},
  {q:'광합성에 필요하지 않은 것은?',a:['질소','빛','물','이산화탄소'],c:0,s:'과학'},
  {q:'인체에서 가장 큰 장기는?',a:['피부','간','폐','심장'],c:0,s:'과학'},
  {q:'소리의 속도가 가장 빠른 매질은?',a:['고체','액체','기체','진공'],c:0,s:'과학'},
  {q:'고조선을 건국한 인물은?',a:['단군왕검','주몽','혁거세','온조'],c:0,s:'한국사'},
  {q:'세종대왕이 만든 문자는?',a:['훈민정음','이두','향찰','구결'],c:0,s:'한국사'},
  {q:'임진왜란이 일어난 해는?',a:['1592년','1636년','1866년','1446년'],c:0,s:'한국사'},
  {q:'3.1운동이 일어난 해는?',a:['1919년','1910년','1945년','1920년'],c:0,s:'한국사'},
  {q:'조선의 마지막 왕은?',a:['순종','고종','영조','정조'],c:0,s:'한국사'},
  {q:'영어에서 be동사의 과거형이 아닌 것은?',a:['been','was','were','am→was'],c:0,s:'영어'},
  {q:'"Thank you"의 반대 상황에서 쓰는 표현은?',a:['You are welcome','Thank me','No thanks','Goodbye'],c:0,s:'영어'},
  {q:'영어 알파벳은 총 몇 개?',a:['26','24','28','30'],c:0,s:'영어'},
  {q:'past tense of "go"는?',a:['went','goed','gone','going'],c:0,s:'영어'},
  {q:'"apple"의 복수형은?',a:['apples','apple','applez','applies'],c:0,s:'영어'},
  {q:'피아노의 흰 건반은 몇 개?',a:['52','36','88','48'],c:0,s:'음악'},
  {q:'4/4 박자에서 한 마디에 들어가는 4분 음표 수는?',a:['4개','2개','8개','3개'],c:0,s:'음악'},
  {q:'바이올린의 현 수는?',a:['4줄','6줄','3줄','5줄'],c:0,s:'음악'},
  {q:'도레미파솔라시도에서 "라"의 음이름은?',a:['A','B','C','D'],c:0,s:'음악'},
  {q:'오케스트라를 지휘하는 사람을 무엇이라 하나요?',a:['지휘자(Conductor)','연주자','작곡가','편곡가'],c:0,s:'음악'},
  {q:'올림픽에서 금메달 다음 메달은?',a:['은메달','동메달','백금메달','없음'],c:0,s:'체육'},
  {q:'축구에서 한 팀의 선수 수는?',a:['11명','9명','10명','12명'],c:0,s:'체육'},
  {q:'농구 코트에서 3점 라인 안쪽 슛은 몇 점?',a:['2점','1점','3점','4점'],c:0,s:'체육'},
  {q:'색의 3원색이 아닌 것은?',a:['녹색','빨강','파랑','노랑'],c:0,s:'미술'},
  {q:'모나리자를 그린 화가는?',a:['레오나르도 다빈치','미켈란젤로','피카소','고흐'],c:0,s:'미술'},
  {q:'빈센트 반 고흐의 대표작은?',a:['별이 빛나는 밤','모나리자','진주 귀걸이 소녀','게르니카'],c:0,s:'미술'},
  {q:'대한민국의 국회는 몇 원제?',a:['단원제','양원제','삼원제','사원제'],c:0,s:'사회'},
  {q:'유엔(UN)의 본부는 어디에 있나요?',a:['뉴욕','파리','런던','제네바'],c:0,s:'사회'},
  {q:'대한민국 헌법에서 보장하는 기본권이 아닌 것은?',a:['영업비밀권','평등권','자유권','참정권'],c:0,s:'사회'},
  {q:'지진 규모를 측정하는 척도는?',a:['리히터 규모','섭씨','데시벨','루멘'],c:0,s:'사회'},
  {q:'GDP는 무엇의 약자인가요?',a:['국내총생산','국민총소득','국제무역량','국가발전지표'],c:0,s:'경제'},
  {q:'수요와 공급 법칙에서 가격이 오르면 수요는?',a:['감소','증가','불변','예측불가'],c:0,s:'경제'},
  {q:'심폐소생술(CPR)에서 가슴 압박 속도는?',a:['분당 100~120회','분당 60회','분당 200회','분당 30회'],c:0,s:'안전건강'},
  {q:'하루 권장 수면 시간(성인 기준)은?',a:['7~9시간','4~5시간','10~12시간','5~6시간'],c:0,s:'안전건강'},
  {q:'화재 시 대피할 때 올바른 자세는?',a:['낮은 자세로 이동','뛰어서 이동','엘리베이터 이용','창문으로 뛰어내림'],c:0,s:'안전건강'},
  {q:'비타민 C가 가장 풍부한 과일은?',a:['키위','바나나','사과','포도'],c:0,s:'안전건강'},
  {q:'인터넷에서 다른 사람을 괴롭히는 행위를 무엇이라 하나요?',a:['사이버불링','해킹','피싱','스팸'],c:0,s:'인성감성'},
  {q:'갈등 해결의 첫 번째 단계는?',a:['상대방 이야기 듣기','소리치기','무시하기','도망가기'],c:0,s:'인성감성'},
  {q:'공감 능력이란 무엇인가요?',a:['다른 사람의 감정을 이해하는 능력','암기 능력','운동 능력','계산 능력'],c:0,s:'인성감성'},
  {q:'자기 조절 능력에 해당하지 않는 것은?',a:['충동적으로 행동하기','감정 조절하기','계획 세우기','참을성 갖기'],c:0,s:'인성감성'}
];

function v8PushQuizzes(){
  if(!window._quizBank)return;
  V8_QUIZZES.forEach(q=>{
    const exists=window._quizBank.some(e=>e.q===q.q);
    if(!exists)window._quizBank.push(q);
  });
}

// ===== Badges (+12, total 76) =====
const V8_BADGES=[
  {id:'path_explorer',ic:'🗺️',nm:'경로 탐험가',desc:'학습 경로 맵 열기',check:function(u){return(u.v8features||[]).includes('path_map');}},
  {id:'mastery_viewer',ic:'🌳',nm:'마스터리 확인',desc:'마스터리 트리 보기',check:function(u){return(u.v8features||[]).includes('mastery_tree');}},
  {id:'first_code',ic:'💻',nm:'첫 코드 통과',desc:'코딩 샌드박스 1문제 통과',check:function(u){return(u.v8codeCompleted||[]).length>=1;}},
  {id:'code_master',ic:'🧑‍💻',nm:'코딩 마스터',desc:'코딩 샌드박스 5문제 통과',check:function(u){return(u.v8codeCompleted||[]).length>=5;}},
  {id:'focus_first',ic:'⏱️',nm:'첫 집중 세션',desc:'집중 타이머 1회 완료',check:function(u){return(u.v8focusSessions||0)>=1;}},
  {id:'focus_5',ic:'🧘',nm:'집중 마스터',desc:'집중 타이머 5회 완료',check:function(u){return(u.v8focusSessions||0)>=5;}},
  {id:'gallery_visit',ic:'🏆',nm:'갤러리 방문',desc:'업적 갤러리 보기',check:function(u){return(u.v8features||[]).includes('gallery');}},
  {id:'mission_clear',ic:'📋',nm:'미션 올클리어',desc:'일일 미션 전부 완료',check:function(u){return!!u.v8missionAllClear;}},
  {id:'review_10',ic:'🔄',nm:'복습 10장',desc:'스마트 복습 10장 완료',check:function(u){return(u.v8dailyReview||0)>=10;}},
  {id:'heatmap_view',ic:'📅',nm:'히트맵 확인',desc:'학습 히트맵 보기',check:function(u){return(u.v8features||[]).includes('heatmap');}},
  {id:'tier_silver',ic:'🥈',nm:'Silver 달성',desc:'Silver 티어 도달 (200 XP)',check:function(u){return(u.xp||0)>=200;}},
  {id:'v8_explorer',ic:'🌟',nm:'v8 탐험가',desc:'v8 기능 6개 이상 사용',check:function(u){return(u.v8features||[]).length>=6;}}
];

function checkV8Badges(){
  const u=U();
  if(!u.v8badges)u.v8badges=[];
  let newBadge=false;
  V8_BADGES.forEach(b=>{
    if(!u.v8badges.includes(b.id)&&b.check(u)){
      u.v8badges.push(b.id);
      newBadge=true;
    }
  });
  if(newBadge)S(u);
}

// ===== Feature Tracking =====
function v8Track(feat){
  const u=U();
  if(!u.v8features)u.v8features=[];
  if(!u.v8features.includes(feat)){
    u.v8features.push(feat);S(u);
  }
  checkV8Badges();
}

// ===== Inject into Home =====
function v8InjectHome(){
  const homePage=document.getElementById('homePage');
  if(!homePage)return;
  const existing=homePage.querySelector('.v8-missions');
  if(existing)return;
  const anchor=homePage.querySelector('.sec');
  if(!anchor)return;
  const frag=document.createDocumentFragment();
  const mWrap=document.createElement('div');
  v8RenderMissions(mWrap);
  frag.appendChild(mWrap.firstChild);
  const fWrap=document.createElement('div');
  v8RenderFocusTimer(fWrap);
  frag.appendChild(fWrap.firstChild);
  anchor.parentNode.insertBefore(frag,anchor);
}

// ===== Inject into Profile =====
function v8InjectProfile(){
  const profilePage=document.getElementById('profilePage');
  if(!profilePage)return;
  const existing=profilePage.querySelector('.v8-heatmap');
  if(existing)return;
  const frag=document.createDocumentFragment();
  const sections=[
    function(f){v8RenderHeatmap(f);},
    function(f){v8RenderLeaderboard(f);},
    function(f){v8RenderGallery(f);},
    function(f){v8RenderPathMap(f);},
    function(f){v8RenderMasteryTree(f);}
  ];
  sections.forEach(fn=>{const w=document.createElement('div');fn(w);if(w.firstChild)frag.appendChild(w.firstChild);});
  const target=profilePage.querySelector('.sec')||profilePage.firstChild;
  if(target)profilePage.insertBefore(frag,target.nextSibling);
  v8InjectTier();
  const badgeDiv=document.createElement('div');
  badgeDiv.innerHTML='<div style="margin-bottom:10px"><div class="sec"><svg class="ico" aria-hidden="true" focusable="false"><use href="#i-star"/></svg> v8 배지 ('+((U().v8badges||[]).length)+'/'+V8_BADGES.length+')</div><div class="v4-badge-grid">'+V8_BADGES.map(function(b){var u=U();var earned=(u.v8badges||[]).includes(b.id);return '<div class="v4-badge-item'+(earned?'':' locked')+'" title="'+b.desc+'"><span class="v4-badge-icon">'+(earned?b.ic:'🔒')+'</span><span class="v4-badge-name">'+b.nm+'</span></div>';}).join('')+'</div></div>';
  frag.appendChild(badgeDiv);
  profilePage.appendChild(badgeDiv);
}

// ===== Inject Coding Sandbox into Settings/Learn =====
function v8InjectSandbox(){
  const learnPage=document.getElementById('explorePage')||document.getElementById('learnPage');
  if(!learnPage)return;
  const existing=learnPage.querySelector('.v8-sandbox');
  if(existing)return;
  const wrap=document.createElement('div');
  v8RenderSandbox(wrap);
  if(wrap.firstChild)learnPage.appendChild(wrap.firstChild);
  const reviewWrap=document.createElement('div');
  v8RenderReview(reviewWrap);
  if(reviewWrap.firstChild)learnPage.appendChild(reviewWrap.firstChild);
}

// ===== Quick Actions =====
function v8InjectQuickActions(){
  if(document.querySelector('.v8-qa'))return;
  const div=document.createElement('div');
  div.className='v8-qa';
  const actions=[
    {icon:'🗺️',title:'학습 경로맵',fn:'document.querySelector(".v8-pathmap")&&document.querySelector(".v8-pathmap").scrollIntoView({behavior:"smooth"})'},
    {icon:'🌳',title:'마스터리 트리',fn:'document.querySelector(".v8-mastery")&&document.querySelector(".v8-mastery").scrollIntoView({behavior:"smooth"})'},
    {icon:'💻',title:'코딩 샌드박스',fn:'document.querySelector(".v8-sandbox")&&document.querySelector(".v8-sandbox").scrollIntoView({behavior:"smooth"})'},
    {icon:'⏱️',title:'집중 타이머',fn:'document.querySelector(".v8-focus")&&document.querySelector(".v8-focus").scrollIntoView({behavior:"smooth"})'},
    {icon:'🏆',title:'업적 갤러리',fn:'document.querySelector(".v8-gallery")&&document.querySelector(".v8-gallery").scrollIntoView({behavior:"smooth"})'},
    {icon:'📋',title:'일일 미션',fn:'document.querySelector(".v8-missions")&&document.querySelector(".v8-missions").scrollIntoView({behavior:"smooth"})'},
    {icon:'🔄',title:'스마트 복습',fn:'document.querySelector(".v8-review")&&document.querySelector(".v8-review").scrollIntoView({behavior:"smooth"})'},
    {icon:'📅',title:'학습 히트맵',fn:'document.querySelector(".v8-heatmap")&&document.querySelector(".v8-heatmap").scrollIntoView({behavior:"smooth"})'}
  ];
  actions.forEach(a=>{
    div.innerHTML+='<button title="'+a.title+'" onclick="'+a.fn+'">'+a.icon+'</button>';
  });
  document.body.appendChild(div);
}

// ===== Keyboard Shortcuts =====
document.addEventListener('keydown',function(e){
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')return;
  if(!e.shiftKey)return;
  const map={
    'L':'.v8-pathmap','J':'.v8-mastery','C':'.v8-sandbox',
    'F':'.v8-focus','G':'.v8-gallery','D':'.v8-missions',
    'Q':'.v8-review','X':'.v8-heatmap'
  };
  if(map[e.key]){
    e.preventDefault();
    const el=document.querySelector(map[e.key]);
    if(el)el.scrollIntoView({behavior:'smooth'});
  }
});

// ===== Init =====
function v8Init(){
  v8PushQuizzes();
  v8InjectHome();
  v8InjectProfile();
  v8InjectSandbox();
  v8InjectQuickActions();
  checkV8Badges();

  setInterval(checkV8Badges,30000);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',v8Init);
else setTimeout(v8Init,400);

})();
