#!/usr/bin/env python3
"""Rebuild LevelPlay index.html with category tabs, AI learning, quiz gating"""
import os

BACKUP = "D:/AI/_deleted_files/levelplay_backup_20260403/index.html"
OUTPUT = "D:/AI/03_신사업/levelplay/index.html"

with open(BACKUP, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Extract sections by line numbers (1-indexed in the file)
css_lines = lines[0:396]  # Lines 1-396 (before </style>)
js_data = lines[560:1288]  # Lines 561-1288 (JS data: V, SIMS, GMS, QUIZ, etc.)
curriculum = lines[1288:1540]  # Lines 1289-1540 (CURRICULUM)
render_before_rall = lines[1540:1652]  # Lines 1541-1652 (renderSubjects to doSearch)
rest_functions = lines[1699:2967]  # Lines 1700-2967 (remaining functions)

# ===== BUILD NEW FILE =====
out = []

# 1. CSS (original + new category tab CSS)
out.extend(css_lines)
out.append("""/* ===== Category Tabs ===== */
.cat-tabs-wrap{position:sticky;top:0;z-index:100;background:var(--bg);padding:8px 0 6px;margin:0 -10px;padding-left:10px;padding-right:10px}
.cat-tabs{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;padding:2px 0}
.cat-tabs::-webkit-scrollbar{display:none}
.cat-tab{flex-shrink:0;display:flex;align-items:center;gap:4px;padding:8px 14px;border:1.5px solid rgba(139,92,246,.12);border-radius:20px;background:var(--c2);color:var(--t2);font:11px 'Noto Sans KR';font-weight:600;cursor:pointer;transition:.15s;white-space:nowrap}
.cat-tab:hover{border-color:rgba(139,92,246,.3)}
.cat-tab.active{background:var(--g1);color:#fff;border-color:transparent;box-shadow:0 2px 8px rgba(139,92,246,.25)}
.cat-tab .cat-ic{font-size:14px}
.cat-content{min-height:200px}
.cat-subsec{margin:14px 0 8px;font-size:13px;font-weight:700;display:flex;align-items:center;gap:5px;color:var(--cy);border-bottom:1px solid rgba(6,214,160,.1);padding-bottom:6px}
.g4{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
@media(min-width:480px){.g4{grid-template-columns:repeat(3,1fr)}}
@media(min-width:768px){.g4{grid-template-columns:repeat(4,1fr)}}
.quiz-locked{position:relative;opacity:.5;pointer-events:none}
.quiz-locked::after{content:'Lv.' attr(data-req-lv) ' 필요';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,.85);color:var(--gd);font-size:11px;font-weight:700;padding:4px 12px;border-radius:8px;border:1px solid rgba(251,191,36,.3);z-index:2;white-space:nowrap}
.cat-progress-bar{display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--c1);border-radius:8px;margin-bottom:10px;font-size:10px}
.cat-progress-bar .cpb-fill{flex:1;height:6px;background:var(--bg);border-radius:3px;overflow:hidden}
.cat-progress-bar .cpb-fill div{height:100%;background:var(--g1);border-radius:3px;transition:width .4s}
.cat-progress-bar .cpb-text{color:var(--t3);min-width:40px;text-align:right}
.ai-lesson-card{background:var(--c1);border:1px solid rgba(139,92,246,.12);border-radius:var(--r);padding:16px;margin-bottom:8px;cursor:pointer;transition:.15s}
.ai-lesson-card:hover{border-color:var(--cy);transform:translateY(-2px);box-shadow:0 4px 12px rgba(6,214,160,.1)}
.ai-lesson-card .alc-title{font-size:13px;font-weight:700;margin-bottom:4px}
.ai-lesson-card .alc-desc{font-size:11px;color:var(--t2);margin-bottom:8px;line-height:1.5}
.ai-lesson-card .alc-tips{font-size:10px;color:var(--t3);line-height:1.6}
.ai-lesson-card .alc-cmd{display:inline-block;font-family:monospace;font-size:10px;background:rgba(139,92,246,.1);color:var(--p);padding:2px 6px;border-radius:4px;margin:2px 0}
@keyframes catFadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
""")
out.append("</style>\n</head>\n")

# 2. HTML body - restructured home page with category tabs
out.append("""<body>
<div id="splash"><h1>LevelPlay</h1><p style="color:var(--t3);font-size:11px;margin-top:4px">배우고, 올리고, 증명하라</p><div class="splash-progress"><div class="splash-progress-bar"></div></div><p class="splash-tip" id="splashTip"></p></div>
<div class="toast" id="tst"></div>
<div class="nk" id="nkM" style="display:none"><div class="nk-c"><div style="font-size:36px">&#x1F9D1;&#x200D;&#x1F680;</div><div style="font-size:18px;font-weight:900;background:var(--g1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin:6px 0">LevelPlay</div><input class="nk-i" id="nkI" placeholder="닉네임" maxlength="12"><button class="bt bp" style="width:100%" onclick="setNk()">시작</button></div></div>
<div class="mo" id="mo" role="dialog" aria-modal="true" aria-label="콘텐츠 모달" onclick="if(event.target===this)cMo()"><div class="mc" id="moC"><button class="x" onclick="cMo()" aria-label="닫기">&#x2715;</button><div id="moB"></div></div></div>
<div class="go" id="gO"><div class="go-b"><span id="gT"></span><button class="bt bs" onclick="cG()" style="font-size:10px;padding:4px 10px">닫기</button></div><iframe id="gF" allow="autoplay" sandbox="allow-scripts allow-same-origin"></iframe></div>

<div class="onboard-overlay" id="onboardOverlay" style="display:none"><div class="onboard-card"><div class="ob-icon" id="obIcon"></div><div class="ob-title" id="obTitle"></div><div class="ob-desc" id="obDesc"></div><div class="ob-dots" id="obDots"></div><button class="ob-btn" id="obBtn" onclick="nextOnboard()">다음</button></div></div>
<div id="app">
<div class="notif-backdrop" id="notifBackdrop" onclick="closeNotifPanel()"></div>
<div class="notif-panel" id="notifPanel"><div class="np-header"><h3>알림</h3><button class="np-close" onclick="closeNotifPanel()">&#x2715;</button></div><div class="np-body" id="notifList"></div></div>

<div class="pg on" id="p0" role="tabpanel" aria-label="홈">
<div style="display:flex;align-items:center;margin-bottom:8px"><div style="font-size:18px;font-weight:900;background:var(--g1);-webkit-background-clip:text;-webkit-text-fill-color:transparent;flex:1">LevelPlay</div><button class="notif-btn" onclick="toggleNotifPanel()" aria-label="알림 센터"><span>&#x1F514;</span><span class="notif-count" id="notifCount">0</span></button><div style="font-size:10px;color:var(--t3);margin-left:8px" id="hLv">Lv.1</div></div>

<div style="position:relative;margin-bottom:10px"><input class="fi" id="srchIn" placeholder="무엇을 배워볼까? 영상, 퀴즈, 실험, 게임 검색..." oninput="doSearch(this.value)" style="padding-left:32px;padding-top:10px;padding-bottom:10px;font-size:13px;border-radius:10px;border:1.5px solid rgba(139,92,246,.2);background:linear-gradient(135deg,var(--bg),rgba(139,92,246,.03))"><span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:15px;pointer-events:none">&#x1F50D;</span></div>
<div id="srchRes" style="display:none;margin-bottom:10px"></div>

<div id="heroBanner"></div>
<div id="streakHome" style="margin-bottom:8px"></div>
<div id="dailyMissionArea"></div>
<div id="reviewArea"></div>
<div id="recArea"></div>

<div class="cat-tabs-wrap"><div class="cat-tabs" id="catTabs"></div></div>
<div class="cat-content" id="catContent"></div>

<div style="margin-top:24px;padding:16px 10px;border-top:1px solid rgba(139,92,246,.08);text-align:center">
<div style="font-size:10px;font-weight:600;color:var(--t2);margin-bottom:4px">LevelPlay &copy; 2026</div>
<div style="font-size:8px;color:var(--t3);line-height:1.8">PhET Interactive Simulations, University of Colorado Boulder (CC-BY 4.0)<br>YouTube 영상은 각 저작권자에게 귀속됩니다<br>Powered by AI</div>
</div>
</div>
""")

# Pages p1-p4 and nav (lines 486-560 from original, 0-indexed: 485-559)
out.extend(lines[485:560])

# 3. JS data (V, SIMS, GMS, QUIZ, P, UTS, etc.)
out.extend(js_data)

# 4. CURRICULUM
out.extend(curriculum)

# 5. Render functions before rAll (renderSubjects, doSearch, etc.)
out.extend(render_before_rall)

# 6. NEW: Category system + AI Learning + Quiz Gating + new rAll()
out.append("""
// ===== CATEGORY SYSTEM =====
var CATEGORIES=[
  {id:'all',nm:'전체보기',ic:'\\u{1F4CB}'},
  {id:'korean',nm:'국어',ic:'\\u{1F4DD}'},
  {id:'english',nm:'영어',ic:'\\u{1F524}'},
  {id:'math',nm:'수학',ic:'\\u{1F522}'},
  {id:'science',nm:'과학',ic:'\\u{1F52C}'},
  {id:'history',nm:'역사',ic:'\\u{1F4DC}'},
  {id:'music',nm:'음악',ic:'\\u{1F3B5}'},
  {id:'sports',nm:'스포츠',ic:'\\u26BD'},
  {id:'creative',nm:'창작/건설',ic:'\\u{1F3D7}\\uFE0F'},
  {id:'kids',nm:'키즈',ic:'\\u{1F9F8}'},
  {id:'ai',nm:'AI 학습',ic:'\\u{1F916}'}
];

var GAME_CATS={};
GAME_CATS['한글 배우기']='korean';GAME_CATS['타이핑 게임']='korean';GAME_CATS['단어 연결']='korean';
GAME_CATS['문장 만들기']='english';GAME_CATS['세계지도 퀴즈']='history';
GAME_CATS['수학 퍼즐']='math';GAME_CATS['스도쿠']='math';
GAME_CATS['과학 실험실']='science';GAME_CATS['주기율표']='science';GAME_CATS['우주 탐험']='science';
GAME_CATS['시간여행']='history';GAME_CATS['한국사 영웅전']='history';GAME_CATS['문명 진화']='history';
GAME_CATS['피아노 마스터']='music';GAME_CATS['바이올린 리듬']='music';GAME_CATS['노래방']='music';GAME_CATS['리듬 게임']='music';
GAME_CATS['복싱 트레이너']='sports';GAME_CATS['골프 트래커']='sports';
GAME_CATS['심시티 빌더']='creative';GAME_CATS['집짓기']='creative';GAME_CATS['요리왕']='creative';GAME_CATS['동물농장']='creative';
GAME_CATS['별빛 대모험']='kids';GAME_CATS['별빛 RPG']='kids';GAME_CATS['색깔 맞히기']='kids';GAME_CATS['기억력 카드']='kids';
GAME_CATS['별빛 대모험 v2']='kids';GAME_CATS['별빛 RPG v2']='kids';

function getVideoCat(v){
  var c=v.c.toLowerCase();
  if(c.includes('한글')||c==='언어')return 'korean';
  if(c.includes('영어'))return 'english';
  if(c.includes('수학'))return 'math';
  if(c.includes('과학')||c.includes('면역')||c.includes('생물')||c.includes('바이러스')||c.includes('자연')||c==='과학교육')return 'science';
  if(c.includes('역사')||c.includes('한국사'))return 'history';
  if(c.includes('음악'))return 'music';
  if(c.includes('체육'))return 'sports';
  if(c.includes('미술'))return 'creative';
  if(c.includes('핑크퐁')||c.includes('뽀로로')||c.includes('동화')||c.includes('안전')||c.includes('건강')||c.includes('감성')||c.includes('두뇌'))return 'kids';
  return 'all';
}

function getQuizCat(q){
  var c=(q.cat||'').toLowerCase();
  if(c.includes('영어')||c.includes('영어단어'))return 'english';
  if(c.includes('수학')||c.includes('구구단'))return 'math';
  if(c.includes('과학'))return 'science';
  if(c.includes('역사')||c.includes('한국사')||c.includes('세계사'))return 'history';
  if(c.includes('음악'))return 'music';
  if(c.includes('건강'))return 'kids';
  return 'all';
}

var _currentCat='all';

// ===== AI LEARNING DATA =====
var AI_LESSONS=[
  {id:'ai_start',title:'Claude Code 시작하기',desc:'설치부터 첫 명령어 실행까지',tips:['npm install -g @anthropic-ai/claude-code 로 설치','터미널에서 claude 입력하면 시작','프로젝트 루트에 CLAUDE.md 파일로 컨텍스트 제공'],commands:['claude','claude --help'],content:'<h3>Claude Code 시작하기</h3><p>Claude Code는 터미널에서 AI와 대화하며 코딩할 수 있는 도구입니다.</p><h4>설치</h4><p><code>npm install -g @anthropic-ai/claude-code</code></p><h4>사용법</h4><p>프로젝트 폴더에서 <code>claude</code> 입력. 자연어로 "이 파일 읽어줘", "버그 찾아줘" 등 요청하세요.</p><p style="color:var(--cy)">팁: CLAUDE.md를 만들면 프로젝트를 자동으로 이해합니다.</p>'},
  {id:'ai_prompt',title:'효과적인 프롬프트 작성법',desc:'AI에게 정확하게 지시하는 핵심 기술',tips:['구체적으로 요청: "버튼" 보다 "파란 로그인 버튼"','에러 메시지 전체를 포함','큰 작업은 단계별로 나눠서'],commands:['claude "index.html에서 버그 찾아줘"'],content:'<h3>효과적인 프롬프트</h3><h4>3가지 핵심</h4><ol><li><b>구체성</b>: 무엇을, 어디에, 어떻게</li><li><b>컨텍스트</b>: 관련 파일, 에러, 상황</li><li><b>제약조건</b>: 언어, 프레임워크, 스타일</li></ol><p>X: "버튼 만들어줘" / O: "index.html에 파란 로그인 버튼, 클릭하면 /login 이동"</p>'},
  {id:'ai_game',title:'게임 만들기 실습',desc:'HTML+JS로 간단한 게임을 직접 만들어보기',tips:['단일 HTML 파일로 시작 - 서버 불필요','Canvas 또는 DOM으로 렌더링','requestAnimationFrame으로 게임 루프'],commands:['claude "뱀 게임을 HTML 파일 하나로 만들어줘"'],content:'<h3>게임 만들기</h3><p>서버 없이 HTML 하나로 게임을 만들 수 있습니다.</p><h4>게임 구조</h4><p>1. 초기화 2. 입력처리 3. 업데이트 4. 렌더링 5. 반복</p><p>Claude에게 "뱀 게임, 모바일 터치, localStorage 점수 저장" 요청해보세요!</p>'},
  {id:'ai_webapp',title:'웹앱 만들기',desc:'서버 없이 단일 HTML로 완성하는 웹앱',tips:['모든 CSS/JS를 HTML 안에 포함','localStorage로 데이터 저장','PWA로 앱처럼 설치 가능'],commands:['claude "할일 관리 앱을 PWA로 만들어줘"'],content:'<h3>서버 없는 웹앱</h3><p>LevelPlay 자체가 단일 HTML입니다!</p><h4>핵심 기술</h4><ul><li>localStorage: 데이터 저장</li><li>Service Worker: 오프라인 지원</li><li>manifest.json: 홈화면 설치</li></ul>'},
  {id:'ai_mistakes',title:'자주 하는 실수와 해결법',desc:'AI 사용 시 흔한 실수 5가지와 대처법',tips:['수정 전 반드시 git commit으로 백업','한 번에 너무 많은 변경 요청 주의','결과는 반드시 직접 실행해서 확인'],commands:['git add -A && git commit -m "백업"'],content:'<h3>흔한 실수 TOP 5</h3><ol><li><b>백업 없이 작업</b>: 항상 git commit</li><li><b>애매한 지시</b>: 구체적으로 말하기</li><li><b>한번에 대량 변경</b>: 단계별로</li><li><b>확인 안 함</b>: 반드시 실행 테스트</li><li><b>에러 무시</b>: 전체 메시지를 전달</li></ol>'},
  {id:'ai_telegram',title:'텔레그램 봇 연동하기',desc:'Claude로 텔레그램 봇을 처음부터 만들기',tips:['BotFather로 봇 토큰 발급','node-telegram-bot-api 사용','토큰은 .env 파일로 관리'],commands:['npm install node-telegram-bot-api'],content:'<h3>텔레그램 봇</h3><ol><li>@BotFather에게 /newbot</li><li>이름/username 설정</li><li>토큰 저장 (.env)</li></ol><p style="color:var(--rd)">주의: 토큰을 코드에 직접 넣지 마세요!</p>'},
  {id:'ai_files',title:'사진/파일 정리 자동화',desc:'Python으로 수천 개 파일을 자동 분류',tips:['os.walk로 폴더 순회','hashlib으로 중복 감지','삭제 대신 별도 폴더로 이동'],commands:['claude "사진을 날짜별로 정리하는 스크립트"'],content:'<h3>파일 정리 자동화</h3><p>EXIF 날짜로 사진 자동 분류, SHA-256 해시로 중복 파일 찾기</p><p style="color:var(--gd)">팁: 삭제 대신 _duplicate 폴더로 이동이 안전합니다.</p>'},
  {id:'ai_deploy',title:'GitHub Pages 배포하기',desc:'무료로 웹사이트를 전 세계에 공개',tips:['GitHub 저장소 생성 후 Push','Settings > Pages > Branch 설정','username.github.io/repo-name 으로 접속'],commands:['gh repo create my-app --public --push'],content:'<h3>GitHub Pages 배포</h3><ol><li>GitHub에 저장소 만들기</li><li>코드 push</li><li>Settings > Pages 설정</li><li>https://username.github.io/repo-name</li></ol>'}
];

function renderCategoryTabs(){
  var tabsEl=document.getElementById('catTabs');
  if(!tabsEl)return;
  tabsEl.innerHTML=CATEGORIES.map(function(c){
    return '<button class="cat-tab'+(c.id===_currentCat?' active':'')+'" onclick="switchCategory(\\''+c.id+'\\')">'
    +'<span class="cat-ic">'+c.ic+'</span>'
    +'<span>'+c.nm+'</span>'
    +'</button>';
  }).join('');
}

function switchCategory(catId){
  _currentCat=catId;
  document.querySelectorAll('.cat-tab').forEach(function(t){
    t.classList.toggle('active',t.onclick.toString().includes("'"+catId+"'"));
  });
  renderCategoryTabs();
  renderCategoryContent();
}

function getCategoryProgress(catId){
  var total=0,done=0;
  GMS.forEach(function(g){
    var gc=GAME_CATS[g.nm]||'all';
    if(gc===catId){total++;if(U.gamesPlayed&&U.gamesPlayed[g.nm])done++;}
  });
  getV().forEach(function(v){
    var vc2=getVideoCat(v);
    if(vc2===catId){total++;if(U.seen&&U.seen[v.id])done++;}
  });
  return{total:total,done:done,pct:total>0?Math.round(done/total*100):0};
}

function renderCategoryContent(){
  var el=document.getElementById('catContent');
  if(!el)return;
  var cat=_currentCat;
  var h='';

  if(cat!=='all'&&cat!=='ai'){
    var prog=getCategoryProgress(cat);
    var catInfo=CATEGORIES.find(function(c){return c.id===cat;});
    h+='<div class="cat-progress-bar"><span style="font-weight:700">'+(catInfo?catInfo.ic:'')+'</span><div class="cpb-fill"><div style="width:'+prog.pct+'%"></div></div><span class="cpb-text">'+prog.done+'/'+prog.total+' ('+prog.pct+'%)</span></div>';
  }

  if(cat==='ai'){
    h+=renderAILearningSection();
    el.innerHTML=h;
    el.style.animation='catFadeIn .25s ease';
    return;
  }

  if(cat==='all'){
    h+='<div class="cat-subsec">\\u{1F4D6} 과목 선택</div><div class="g2" id="homeSubjects"></div>';
    h+='<div class="cat-subsec">\\u{1F4DD} 바로 학습하기</div><div id="homeLesson"></div>';
    h+='<div class="cat-subsec">\\u{1F4DD} 퀴즈 도전</div><div id="qR"></div>';
    h+='<div class="cat-subsec">\\u{1F52C} 과학 실험</div><div class="g2" id="sR"></div>';
    h+='<div class="cat-subsec">\\u{1F3AE} 게임</div><div class="g4" id="gR"></div>';
    h+='<div class="cat-subsec">\\u{1F522} 구구단 챌린지</div>';
    h+='<div class="qz" id="ggGame"><div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="font-size:12px;font-weight:700">\\u{1F522} 구구단 맞히기!</span><span style="font-size:11px;color:var(--cy)" id="ggScore">0점</span></div><div style="font-size:24px;font-weight:900;text-align:center;margin:12px 0;background:var(--g1);-webkit-background-clip:text;-webkit-text-fill-color:transparent" id="ggQ">시작을 누르세요</div><input type="number" class="fi" id="ggA" placeholder="정답 입력" style="text-align:center;font-size:18px;margin-bottom:8px" onkeydown="if(event.key===\\'Enter\\')checkGG()"><div style="display:flex;gap:6px;justify-content:center"><button class="bt bp" onclick="startGG()">시작</button><button class="bt bp" onclick="checkGG()">확인</button></div></div>';
    h+='<div class="cat-subsec">\\u{1F524} 영어 단어 맞히기</div>';
    h+='<div class="qz" id="engGame"><div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="font-size:12px;font-weight:700">\\u{1F524} 영어 단어!</span><span style="font-size:11px;color:var(--cy)" id="engScore">0점</span></div><div style="font-size:28px;text-align:center;margin:12px 0" id="engQ">\\u{1F34E}</div><div style="font-size:13px;text-align:center;color:var(--t2);margin-bottom:8px" id="engHint">이것의 영어 이름은?</div><div class="qz-a" id="engOpts"></div></div>';
    h+='<div class="cat-subsec">\\u{1F52C} 더 많은 실험</div><div class="g2" id="sR2"></div>';
    h+='<div class="cat-subsec">\\u{1F6E0}\\uFE0F 도구</div><div class="g2" id="hU"></div>';
    h+='<div class="cat-subsec">\\u{1F4AC} 커뮤니티</div><div id="calcR"></div>';
    el.innerHTML=h;
    renderAllCategoryContent();
    return;
  }

  // Specific category
  var catGames=GMS.filter(function(g){return (GAME_CATS[g.nm]||'all')===cat;});
  if(catGames.length){
    h+='<div class="cat-subsec">\\u{1F3AE} 게임</div>';
    h+='<div class="g4">'+catGames.map(function(g){
      return '<div class="gc" onclick="oG(\\''+g.u+'\\',\\''+g.nm+'\\')"><div class="gi">'+g.em+'</div><div class="gn">'+g.nm+'</div><div class="gd">'+g.d+'</div></div>';
    }).join('')+'</div>';
  }

  var catVids=getV().filter(function(v){return getVideoCat(v)===cat;});
  if(catVids.length){
    h+='<div class="cat-subsec">\\u{1F4FA} 영상 ('+catVids.length+')</div>';
    h+='<div class="row">'+catVids.map(vc).join('')+'</div>';
  }

  var catQuizzes=getQuiz().filter(function(q){return getQuizCat(q)===cat;});
  if(catQuizzes.length){
    h+='<div class="cat-subsec">\\u{1F4DD} 퀴즈 ('+catQuizzes.length+')</div>';
    h+='<div id="catQuizArea"></div>';
  }

  if(cat==='science'){
    h+='<div class="cat-subsec">\\u{1F52C} 과학 실험</div>';
    h+='<div class="g2">'+SIMS.map(sc).join('')+'</div>';
  }

  if(cat==='math'){
    h+='<div class="cat-subsec">\\u{1F522} 구구단 챌린지</div>';
    h+='<div class="qz" id="ggGame"><div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="font-size:12px;font-weight:700">\\u{1F522} 구구단 맞히기!</span><span style="font-size:11px;color:var(--cy)" id="ggScore">0점</span></div><div style="font-size:24px;font-weight:900;text-align:center;margin:12px 0;background:var(--g1);-webkit-background-clip:text;-webkit-text-fill-color:transparent" id="ggQ">시작을 누르세요</div><input type="number" class="fi" id="ggA" placeholder="정답 입력" style="text-align:center;font-size:18px;margin-bottom:8px" onkeydown="if(event.key===\\'Enter\\')checkGG()"><div style="display:flex;gap:6px;justify-content:center"><button class="bt bp" onclick="startGG()">시작</button><button class="bt bp" onclick="checkGG()">확인</button></div></div>';
  }

  if(cat==='english'){
    h+='<div class="cat-subsec">\\u{1F524} 영어 단어 맞히기</div>';
    h+='<div class="qz" id="engGame"><div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="font-size:12px;font-weight:700">\\u{1F524} 영어 단어!</span><span style="font-size:11px;color:var(--cy)" id="engScore">0점</span></div><div style="font-size:28px;text-align:center;margin:12px 0" id="engQ">\\u{1F34E}</div><div style="font-size:13px;text-align:center;color:var(--t2);margin-bottom:8px" id="engHint">이것의 영어 이름은?</div><div class="qz-a" id="engOpts"></div></div>';
  }

  h+='<div class="cat-subsec">\\u{1F6E0}\\uFE0F 도구</div><div class="g2" id="catTools"></div>';

  if(!catGames.length&&!catVids.length&&!catQuizzes.length){
    h+='<div style="text-align:center;padding:30px;color:var(--t3);font-size:12px">이 카테고리에 콘텐츠가 준비 중입니다.</div>';
  }

  el.innerHTML=h;
  el.style.animation='catFadeIn .25s ease';

  var catQuizEl=document.getElementById('catQuizArea');
  if(catQuizEl&&catQuizzes.length){renderQuizWithGating(catQuizEl,catQuizzes,cat);}
  var catToolsEl=document.getElementById('catTools');
  if(catToolsEl)catToolsEl.innerHTML=UTS.map(function(u){return '<div class="gc" onclick="openU(\\''+u.id+'\\')"><div class="gi">'+u.ic+'</div><div class="gn">'+u.nm+'</div></div>';}).join('');
  if(cat==='english')nextEng();
}

function renderAllCategoryContent(){
  var homeSubjects=getSubjects();
  var _hs=_el('homeSubjects');if(_hs)_hs.innerHTML=homeSubjects.slice(0,8).map(function(s){
    var bk=s.builtinKey&&CURRICULUM[s.builtinKey];
    var total=bk?bk.units.reduce(function(sum,u){return sum+u.lessons.length;},0):s.topicCount;
    return '<div class="gc" onclick="go(1);setTimeout(function(){openSubjectNew(\\''+s.id+'\\')},50)"><div class="gi">'+s.ic+'</div><div class="gn">'+s.nm+'</div><div class="gd">'+total+'개 레슨</div></div>';
  }).join('');
  var firstSubjKey=Object.keys(CURRICULUM)[0];
  var firstLesson=CURRICULUM[firstSubjKey].units[0].lessons[0];
  var _hl=_el('homeLesson');if(_hl)_hl.innerHTML='<div class="gc" style="text-align:left;padding:12px" onclick="go(1);setTimeout(function(){openSubject(\\''+firstSubjKey+'\\');setTimeout(function(){openLesson(0,0)},50)},50)"><div style="display:flex;gap:8px;align-items:center"><span style="font-size:24px">'+CURRICULUM[firstSubjKey].ic+'</span><div><div style="font-size:13px;font-weight:600">'+firstLesson.t+'</div><div style="font-size:10px;color:var(--t3)">'+CURRICULUM[firstSubjKey].nm+' > '+CURRICULUM[firstSubjKey].units[0].nm+' > Lv.'+firstLesson.lv+'</div></div><span style="margin-left:auto;color:var(--cy)">시작 \\u203A</span></div></div>';
  var _sR=_el('sR');if(_sR)_sR.innerHTML=SIMS.slice(0,4).map(sc).join('');
  var _sR2=_el('sR2');if(_sR2)_sR2.innerHTML=SIMS.slice(4,8).map(sc).join('');
  var _gR=_el('gR');if(_gR)_gR.innerHTML=GMS.map(function(g){return '<div class="gc" onclick="oG(\\''+g.u+'\\',\\''+g.nm+'\\')"><div class="gi">'+g.em+'</div><div class="gn">'+g.nm+'</div><div class="gd">'+g.d+'</div></div>';}).join('');
  nextEng();
  renderReviewArea();renderRecommendations();
  var _qR=_el('qR');if(_qR)renderQuiz(_qR,QUIZ);
  var _hU=_el('hU');if(_hU)_hU.innerHTML=UTS.map(function(u){return '<div class="gc" onclick="openU(\\''+u.id+'\\')"><div class="gi">'+u.ic+'</div><div class="gn">'+u.nm+'</div></div>';}).join('');
  var _cR=_el('calcR');if(_cR)_cR.innerHTML=[].concat(P,U.mp).sort(function(a,b){return b.l-a.l;}).slice(0,5).map(pHNew).join('')+'<div style="text-align:right;margin-top:6px"><a href="javascript:void(0)" onclick="go(3)" style="font-size:11px;color:var(--p);text-decoration:none;font-weight:600">더보기 \\u2192</a></div>';
}

function renderQuizWithGating(el,quizzes,cat){
  var userLv=U.lv;
  var basic=quizzes.slice(0,5);
  var advanced=quizzes.slice(5);
  var h='';
  if(basic.length){
    h+='<div style="font-size:11px;font-weight:600;color:var(--gn);margin-bottom:6px">\\u{1F7E2} 기본 (Lv.1+)</div>';
    basic.forEach(function(q){
      var qIdx=QUIZ.indexOf(q);
      var opts=q.a.map(function(a,i){return{t:a,ok:i===q.c};}).sort(function(){return Math.random()-.5;});
      h+='<div class="qz" data-quiz-idx="'+qIdx+'" data-quiz-type="default"><div class="qz-q">'+(q.cat||'')+' | '+q.q+'</div><div class="qz-a">'+opts.map(function(o){return '<button data-correct="'+o.ok+'" onclick="chkA(this,'+o.ok+')">'+o.t+'</button>';}).join('')+'</div></div>';
    });
  }
  if(advanced.length){
    var reqLv=Math.max(3,Math.floor(basic.length/2)+2);
    var locked=userLv<reqLv;
    h+='<div style="font-size:11px;font-weight:600;color:'+(locked?'var(--rd)':'var(--gd)')+';margin:10px 0 6px">'+(locked?'\\u{1F512}':'\\u{1F513}')+' 심화 (Lv.'+reqLv+'+ 권장)</div>';
    if(locked){
      h+='<div style="font-size:10px;color:var(--t3);margin-bottom:8px;padding:8px;background:rgba(251,191,36,.05);border:1px solid rgba(251,191,36,.15);border-radius:8px">Lv.'+reqLv+' 이상이면 심화 퀴즈를 풀 수 있습니다. 기본 퀴즈를 먼저 풀어보세요!</div>';
    }
    advanced.slice(0,5).forEach(function(q){
      var qIdx=QUIZ.indexOf(q);
      var opts=q.a.map(function(a,i){return{t:a,ok:i===q.c};}).sort(function(){return Math.random()-.5;});
      h+='<div class="qz'+(locked?' quiz-locked':'')+'" data-quiz-idx="'+qIdx+'" data-quiz-type="default"'+(locked?' data-req-lv="'+reqLv+'"':'')+'><div class="qz-q">'+(q.cat||'')+' | '+q.q+'</div><div class="qz-a">'+opts.map(function(o){return '<button data-correct="'+o.ok+'" onclick="chkA(this,'+o.ok+')">'+o.t+'</button>';}).join('')+'</div></div>';
    });
  }
  el.innerHTML=h;
}

function renderAILearningSection(){
  var h='';
  h+='<div style="background:linear-gradient(135deg,rgba(139,92,246,.08),rgba(6,214,160,.05));border:1.5px solid rgba(139,92,246,.15);border-radius:14px;padding:18px;margin-bottom:12px">';
  h+='<div style="font-size:16px;font-weight:800;margin-bottom:4px">\\u{1F916} AI 학습 - Claude Code</div>';
  h+='<div style="font-size:11px;color:var(--t2);margin-bottom:8px">AI 도구를 활용한 개발과 자동화를 배워보세요</div>';
  h+='<div style="display:flex;gap:8px;flex-wrap:wrap">';
  h+='<span style="font-size:9px;background:rgba(6,214,160,.15);color:var(--cy);padding:2px 8px;border-radius:10px">총 '+AI_LESSONS.length+'개 레슨</span>';
  h+='<span style="font-size:9px;background:rgba(139,92,246,.15);color:var(--p);padding:2px 8px;border-radius:10px">실습 중심</span>';
  h+='</div></div>';
  AI_LESSONS.forEach(function(lesson){
    h+='<div class="ai-lesson-card" onclick="openAILesson(\\''+lesson.id+'\\')">';
    h+='<div class="alc-title">'+lesson.title+'</div>';
    h+='<div class="alc-desc">'+lesson.desc+'</div>';
    h+='<div class="alc-tips">';
    lesson.tips.forEach(function(tip){h+='<div style="margin-bottom:2px">\\u2022 '+tip+'</div>';});
    if(lesson.commands&&lesson.commands.length){
      h+='<div style="margin-top:4px">';
      lesson.commands.slice(0,2).forEach(function(cmd){h+='<span class="alc-cmd">'+cmd+'</span> ';});
      h+='</div>';
    }
    h+='</div></div>';
  });
  return h;
}

function openAILesson(lessonId){
  var lesson=AI_LESSONS.find(function(l){return l.id===lessonId;});
  if(!lesson)return;
  var h='<div style="font-size:16px;font-weight:800;margin-bottom:8px">\\u{1F916} '+lesson.title+'</div>';
  h+='<div style="background:var(--c1);border-radius:var(--r);padding:14px;margin-bottom:8px;font-size:13px;line-height:1.8;color:var(--t2)">'+lesson.content+'</div>';
  if(lesson.commands&&lesson.commands.length){
    h+='<div style="margin-bottom:8px"><div style="font-size:12px;font-weight:700;margin-bottom:6px">주요 명령어</div>';
    lesson.commands.forEach(function(cmd){
      h+='<div style="background:var(--bg);padding:6px 10px;border-radius:6px;margin-bottom:4px;font-family:monospace;font-size:11px;color:var(--cy)">$ '+cmd+'</div>';
    });
    h+='</div>';
  }
  h+='<button class="bt bp" style="width:100%;margin-top:8px" onclick="completeAILesson(\\''+lessonId+'\\',\\''+lesson.title.replace(/'/g,'')+'\\')">레슨 완료 (+20XP)</button>';
  document.getElementById('moB').innerHTML=h;document.getElementById('mo').classList.add('sh');
}

function completeAILesson(id,title){
  if(!U.stats.lessonsBySubject['AI학습'])U.stats.lessonsBySubject['AI학습']=0;
  U.stats.lessonsBySubject['AI학습']++;U.lessonCount++;
  xp(20,'AI레슨: '+title);toast('+20XP AI 레슨 완료!');sv();checkBadges();cMo();
}

function rAll(){
  renderCategoryTabs();
  renderCategoryContent();
  renderSubjects();
  var _aGm=_el('allGm');if(_aGm)_aGm.innerHTML=GMS.map(function(g){return '<div class="gc" onclick="oG(\\''+g.u+'\\',\\''+g.nm+'\\')"><div class="gi">'+g.em+'</div><div class="gn">'+g.nm+'</div><div class="gd">'+g.d+'</div></div>';}).join('');
  var fV=getV();var cats2=[...new Set(fV.map(function(v){return v.c;}))];
  var _aVr=_el('allVr');if(_aVr)_aVr.innerHTML='<button class="bt bp" onclick="filterVids(null)" style="font-size:9px;padding:3px 8px;flex-shrink:0">전체</button>'+cats2.map(function(c){return '<button class="bt bs" onclick="filterVids(\\''+c+'\\')" style="font-size:9px;padding:3px 8px;flex-shrink:0">'+c+'</button>';}).join('');
  var _aVids=_el('allVids');if(_aVids)_aVids.innerHTML=cats2.map(function(c){return '<div class="sec" style="font-size:12px" data-vcat="'+c+'">'+c+'</div><div class="row" data-vcat="'+c+'">'+fV.filter(function(v){return v.c===c;}).map(vc).join('')+'</div>';}).join('');
  var _aS=_el('allS');if(_aS)_aS.innerHTML=SIMS.map(sc).join('');
  var _aQ=_el('allQ');if(_aQ)renderQuiz(_aQ,QUIZ);
  var _aU=_el('allU');if(_aU)renderUtils(_aU);
  renderCommCats();renderComm();renderLeaderboard();renderBattleLog();
  rProf();uN();
}

""")

# 7. Rest of the functions (lines 1700-2967)
out.extend(rest_functions)

# Write the output
with open(OUTPUT, 'w', encoding='utf-8') as f:
    f.writelines(out)

print(f"Written {len(out)} lines to {OUTPUT}")
# Check file size
sz = os.path.getsize(OUTPUT)
print(f"File size: {sz:,} bytes ({sz/1024:.1f} KB)")
