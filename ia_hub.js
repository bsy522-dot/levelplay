/* ia_hub.js — 주제(과목) 우선 정보구조 + 콘텐츠 상호연결 (DESIGN_SPEC §3)

   기존 구조: 형식이 먼저였다. [학습] 탭에 레슨, [놀이] 탭에 게임·영상·퀴즈.
             음악을 배우려면 두 탭을 오가야 했다.
   새 구조:  과목이 먼저다. 과목 하나를 열면 배우기/해보기/확인/이어서 4구역이 한 화면에 있고,
             형식(영상·만화·레슨·게임·퀴즈)은 그 안의 칩 필터로 내려간다.

   ★아무것도 지우지 않는다. 학습(p1)·놀이(p2) 패널과 렌더 함수는 그대로 살아 있고,
     과목 탭의 "예전 화면으로" 버튼과 해보기 구역의 "게임 전체" 버튼으로 계속 닿는다.
     go(1)/go(2) 를 부르는 기존 호출부 12곳도 그대로 동작한다(하단 탭은 '과목'이 켜진다).
*/
(function () {
  'use strict';

  /* ================================================================
     1. 단일 과목 분류 — 모든 콘텐츠가 여기 있는 11개 중 하나로 간다
     DESIGN_SPEC §2 의 8과목 + 세계사 + 마음·건강 + 코딩.
     (세계사 100편·코딩 37편·마음건강 60여편이 실제로 있어서 버릴 수 없다)
     ================================================================ */
  var SUBJ = [
    { k: 'math',     nm: '수학',        ac: '#1D4ED8', ti: '#E8EFFF', sym: 'i-math' },
    { k: 'science',  nm: '과학',        ac: '#0E7490', ti: '#E2F5F8', sym: 'i-science' },
    { k: 'history',  nm: '한국사',      ac: '#C2410C', ti: '#FFF1E9', sym: 'i-korea' },
    { k: 'world',    nm: '세계사',      ac: '#0369A1', ti: '#E6F2FA', sym: 'i-globe' },
    { k: 'language', nm: '언어',        ac: '#B91C1C', ti: '#FEECEC', sym: 'i-hangul' },
    { k: 'music',    nm: '음악',        ac: '#7C3AED', ti: '#F1EAFE', sym: 'i-music' },
    { k: 'sports',   nm: '체육',        ac: '#15803D', ti: '#E7F7EC', sym: 'i-sports' },
    { k: 'art',      nm: '예술·만들기', ac: '#BE185D', ti: '#FDEBF3', sym: 'i-art' },
    { k: 'society',  nm: '경제·사회',   ac: '#A16207', ti: '#FCF3E0', sym: 'i-society' },
    { k: 'mind',     nm: '마음·건강',   ac: '#BE123C', ti: '#FDECEF', sym: 'i-heart' },
    { k: 'coding',   nm: '코딩',        ac: '#0F766E', ti: '#E3F4F1', sym: 'i-code' }
  ];
  var SB = {}; SUBJ.forEach(function (s) { SB[s.k] = s; });

  /* ================================================================
     1-b. 홈 상단 과목 탭 순서 — 가나다순도, SUBJ 선언순도 아니다.
     실측(lpIaCoverage, 아이 뱅크 1,082개) 기준으로 점수를 매겨 정렬했다.
       점수 = 전체 항목수 + 3 × (영상+만화+게임+실험)
       레슨·퀴즈가 전체의 74%라 총량만 보면 "탭할 것"이 적은 과목이 앞에 온다.
       아이가 실제로 누르는 것은 보고/노는 것이므로 그쪽에 3배 가중.
       과학 387 · 음악 321 · 수학 229 · 언어 224 · 마음건강 167 · 세계사 161
       한국사 148 · 코딩 139 · 체육 135 · 예술 96 · 경제사회 79
     편집 판단 1건: 한국사를 7위→5위로 올렸다. 이 앱의 두 만화 시리즈 중 하나
     (아침의 나라 임금님들 7편)와 가장 큰 게임(한국사 영웅전 v8)이 여기 있고,
     한국 사용자에게는 표제 과목이다. 그 외에는 점수 순서 그대로다.
     ================================================================ */
  var HOME_ORDER = ['science', 'music', 'math', 'language', 'history', 'mind', 'world', 'coding', 'sports', 'art', 'society'];
  /* '추천' 탭 = 지금까지의 홈 전체. 액센트는 고정 인디고 —
     var(--p)는 다크에서 #8b5cf6 이라 흰 글씨가 4.28:1 로 AA 미달이다. #4F46E5 는 6.3:1. */
  var REC_KEY = '__rec';
  var REC_TAB = { k: REC_KEY, nm: '추천', ac: '#4F46E5', sym: 'i-star' };

  /* 과목 → 학습탭 과목 타일 id (아이/어른 모드에서 이름이 다르다) */
  var S2TILE = {
    math:     { kid: '수학',     adult: '수학' },
    science:  { kid: '과학',     adult: '물리학' },
    history:  { kid: '한국사',   adult: '역사' },
    world:    { kid: '세계사',   adult: '역사' },
    language: { kid: '한글국어', adult: '언어' },
    music:    { kid: '음악',     adult: '음악' },
    sports:   { kid: '체육',     adult: '의학건강' },
    art:      { kid: '미술',     adult: '미술디자인' },
    society:  { kid: '사회',     adult: '경제학' },
    mind:     { kid: '인성감성', adult: '심리학' },
    coding:   { kid: '코딩',     adult: '컴퓨터과학' }
  };
  /* 과목 타일 id → 과목 (배우기 구역에서 curriculum_master 주제를 접을 때 쓴다) */
  var TILE2S = {
    '수학': 'math', '과학': 'science', '한국사': 'history', '세계사': 'world',
    '한글국어': 'language', '영어': 'language', '음악': 'music', '미술': 'art',
    '체육': 'sports', '코딩': 'coding', '사회': 'society', '안전건강': 'mind', '인성감성': 'mind',
    '물리학': 'science', '화학': 'science', '생물학': 'science', '지구과학': 'science',
    '천문학': 'science', '역사': 'history', '철학': 'society', '심리학': 'mind',
    '경제학': 'society', '컴퓨터과학': 'coding', '공학_기계': 'science',
    '공학_전기전자': 'science', '의학건강': 'mind', '법학': 'society', '언어': 'language',
    '미술디자인': 'art', '경영': 'society', '요리생활': 'mind'
  };

  /* ---- 게임 28종 → 과목. [주 과목, 부 과목...] ---- */
  var G2S = {
    '한글 배우기':        ['language'],
    '영어 단어 Lv.1~10':  ['language'],
    '타이핑 게임':        ['language', 'coding'],
    '색깔 맞히기':        ['art', 'language'],       /* GAME_CATS=kids. 색 이름 학습 → 예술(색) 주, 언어 부 */
    '세계지도 퀴즈':      ['world', 'society'],
    '시간여행':           ['world', 'history'],       /* 역사 사건 연표 — 두 역사 과목이 함께 쓴다 */
    '수학 퍼즐':          ['math'],
    '과학 실험실':        ['science'],
    '리듬 게임':          ['music'],
    '단어 연결':          ['language'],
    '기억력 카드':        ['mind'],                   /* GAME_CATS=kids. 기억·집중 훈련 → 마음·건강 */
    '스도쿠':             ['math', 'mind'],
    '문장 만들기':        ['language'],
    '주기율표':           ['science'],
    '피아노 마스터':      ['music'],
    '바이올린 리듬':      ['music'],
    '노래방 v4 ✨':       ['music'],
    '색소폰 마스터':      ['music'],
    '복싱 트레이너':      ['sports', 'science'],
    '골프 트래커':        ['sports', 'science'],
    '한국사 영웅전 v8':   ['history'],
    '심시티 빌더':        ['society', 'art'],
    '집짓기':             ['art', 'science'],
    '문명 진화 ✨':       ['world', 'society'],
    '우주 탐험 3D ✨':    ['science'],
    '우주 탐험':          ['science'],
    '요리왕':             ['mind', 'art'],            /* 한식 조리 + 영양학습 → 건강 주, 만들기 부 */
    '동물농장 타이쿤':    ['society', 'science']
  };
  /* 게임 세부 태그 — 같은 과목 안에서 무엇이 먼저 이어지는지 결정한다 */
  var G_TAG = {
    '한국사 영웅전 v8': ['고조선', '단군', '고대'],
    '시간여행':         ['연표', '고대'],
    '문명 진화 ✨':     ['문명', '고대'],
    '세계지도 퀴즈':    ['지리'],
    '피아노 마스터':    ['연주', '악기', '작곡가'],
    '바이올린 리듬':    ['연주', '악기'],
    '노래방 v4 ✨':     ['연주', '노래'],
    '색소폰 마스터':    ['연주', '악기'],
    '리듬 게임':        ['연주', '박자'],
    '복싱 트레이너':    ['운동', '신체'],
    '골프 트래커':      ['운동', '신체'],
    '스도쿠':           ['논리'],
    '수학 퍼즐':        ['연산'],
    '주기율표':         ['화학', '원소'],
    '우주 탐험':        ['우주', '천체'],
    '우주 탐험 3D ✨':  ['우주', '천체'],
    '과학 실험실':      ['운동', '힘'],
    '요리왕':           ['영양', '음식'],
    '집짓기':           ['건축', '만들기'],
    '심시티 빌더':      ['도시', '경제'],
    '동물농장 타이쿤':  ['경영', '동물']
  };

  /* ---- PhET 실험 12종 → 과학. 힘/운동 계열은 체육과도 잇는다(오너 예시 3) ---- */
  var SIM2S = {
    '에너지 스케이트파크': { s: ['science', 'sports'], t: ['운동', '힘', '에너지'] },
    '중력과 궤도':         { s: ['science'],           t: ['우주', '천체', '힘'] },
    '회로 만들기':         { s: ['science'],           t: ['전기'] },
    '빛의 굴절':           { s: ['science'],           t: ['빛'] },
    '파동':                { s: ['science', 'music'],  t: ['파동', '소리'] },
    '원자 만들기':         { s: ['science'],           t: ['화학', '원소'] },
    '자연선택':            { s: ['science'],           t: ['생물', '진화'] },
    '포물선 운동':         { s: ['science', 'sports'], t: ['운동', '힘'] },
    '물질의 상태':         { s: ['science'],           t: ['화학'] },
    'pH 측정':             { s: ['science'],           t: ['화학'] },
    '힘과 운동':           { s: ['science', 'sports'], t: ['운동', '힘', '신체'] },
    '밀도':                { s: ['science'],           t: ['화학'] }
  };

  /* ---- 영상 카테고리 → 과목. 접두어 규칙을 먼저 보고, 없으면 정확 일치 ---- */
  var VC_PREFIX = [
    ['수학-', ['math'], []], ['과학-사회과학', ['society'], []], ['과학-수학응용', ['math'], ['science']],
    ['과학-', ['science'], []], ['한국사', ['history'], []], ['역사-', ['world'], []],
    ['성인-수학', ['math'], []], ['성인-세계사', ['world'], []], ['성인-과학/역사', ['science'], ['world']],
    ['성인-과학/사회', ['science'], ['society']], ['성인-경제', ['society'], []], ['성인-사고력', ['mind'], []]
  ];
  var VC2S = {
    '수학': ['math'],                            /* round9 수학 10편 — '수학-' 접두어가 아니라 정확일치 */
    '음악': ['music'], '음악교육': ['music'], '핑크퐁 동요': ['music'],
    '뽀로로': ['music', 'language'],           /* 9편 중 5편이 동요·컬러송. 나머지는 생활 이야기 → 언어 부과목 */
    '체육': ['sports'], '체육건강': ['sports', 'mind'],
    '과학': ['science'], '과학교육': ['science'], '과학다큐': ['science'],
    '역사': ['world'],                          /* Crash Course World History 15편 */
    '언어': ['language'], '영어학습': ['language'], '동화': ['language'],
    '미술': ['art'], '미술창작': ['art'],
    '감성': ['mind'], '건강': ['mind'], '안전': ['mind'], '두뇌': ['mind'],
    '코딩교육': ['coding']
  };
  /* 영상 제목 키워드 → 세부 태그 */
  var V_TAGWORDS = [
    ['모차르트', ['작곡가', '연주']], ['베토벤', ['작곡가']], ['바흐', ['작곡가']],
    ['쇼팽', ['작곡가']], ['비발디', ['작곡가']], ['차이코프스키', ['작곡가']],
    ['체조', ['운동', '신체']], ['율동', ['운동', '신체']], ['축구', ['운동']],
    ['줄넘기', ['운동']], ['수영', ['운동']], ['단군', ['고조선', '고대']],
    ['고조선', ['고조선', '고대']], ['삼국', ['고대']], ['조선', ['조선']]
  ];

  /* ---- 퀴즈 카테고리 → 과목 ---- */
  var QC_PREFIX = [
    ['수학-', ['math'], ['연산']], ['과학-물리', ['science'], ['운동', '힘']],
    ['과학-화학', ['science'], ['화학']], ['과학-생물', ['science'], ['생물']],
    ['과학-', ['science'], []], ['한국사-고대', ['history'], ['고조선', '고대']],
    ['한국사-', ['history'], []], ['세계사-고대', ['world'], ['고대']],
    ['세계사-', ['world'], []], ['영어-', ['language'], []], ['국어-', ['language'], []],
    ['음악-악기', ['music'], ['악기', '연주']], ['음악-작곡가', ['music'], ['작곡가']],
    ['음악-', ['music'], []], ['코딩-', ['coding'], []], ['지리-', ['world'], ['지리']],
    ['상식-자연', ['science'], ['생물']], ['상식-과학기술', ['science'], []],
    ['상식-문화', ['society'], []], ['건강안전', ['mind', 'sports'], ['신체', '운동']]
  ];
  var QC2S = {
    '수학': ['math'], '구구단': ['math'], '숫자': ['math'],
    '과학': ['science'], '과학상식': ['science'], '동식물': ['science'], '동물': ['science'], '과일': ['science'],
    '한국사': ['history'], '한국지리': ['history'],
    '세계사': ['world'], '역사': ['history', 'world'],
    '영어': ['language'], '영어단어': ['language'], '국어': ['language'],
    '음악': ['music'], '체육': ['sports'], '색깔': ['art'],
    '건강': ['mind'], '인성감성': ['mind'], '사회': ['society'], '코딩': ['coding']
  };

  /* ---- 빌트인 CURRICULUM 키 → 과목.
     기본 8개 외에 v-패치·데이터가 런타임에 붙이는 6개(special/sports/english/coding/korean/art)와
     v3_patch 의 personality 까지 모두 적는다. 하나라도 빠지면 그 단원이 미분류로 샌다. ---- */
  var CK2S = {
    math: ['math'], science: ['science'], history: ['history'], music: ['music'],
    health: ['mind', 'sports'], explore: ['science'], economy: ['society'], social: ['society', 'mind'],
    sports: ['sports'], english: ['language'], korean: ['language'], coding: ['coding'],
    art: ['art'], personality: ['mind'], special: ['art']   /* special = 미술/코딩/요리 → 아래 단원 규칙이 다시 가른다 */
  };
  /* 단원 이름으로 갈라지는 예외 (CURRICULUM.history 는 한국사/세계사 단원을 함께 갖는다) */
  var UNIT_RULES = [
    { m: '세계사',            s: ['world'],   kind: 'lesson', t: [] },
    { m: '한국사',            s: ['history'], kind: 'lesson', t: [] },
    { m: '수학이 태어난 날',  s: ['math'],    kind: 'comic',  t: ['수의 탄생', '기원'] },
    { m: '아침의 나라',       s: ['history'], kind: 'comic',  t: ['고조선', '단군', '고대'] },
    { m: '어린 모차르트',     s: ['music'],   kind: 'video',  t: ['작곡가', '연주'] },
    { m: '피아노 소나타',     s: ['music'],   kind: 'video',  t: ['작곡가', '연주', '악기'] },
    { m: '협주곡',            s: ['music'],   kind: 'video',  t: ['작곡가', '연주', '악기'] },
    { m: '모차르트',          s: ['music'],   kind: 'video',  t: ['작곡가', '연주'] },
    { m: '바로크',            s: ['music'],   kind: 'lesson', t: ['작곡가'] },
    { m: '스포츠',            s: ['sports'],  kind: 'lesson', t: ['운동', '신체'] },
    { m: '운동',              s: ['sports'],  kind: 'lesson', t: ['운동', '신체'] },
    { m: '요리',              s: ['mind'],    kind: 'lesson', t: ['영양', '음식'] },
    { m: '코딩',              s: ['coding'],  kind: 'lesson', t: [] },
    { m: '미술',              s: ['art'],     kind: 'lesson', t: [] }
  ];

  var KIND_LABEL = { video: '영상', comic: '만화', lesson: '레슨', game: '게임', quiz: '퀴즈', sim: '실험' };
  var KIND_SYM   = { video: 'i-video', comic: 'i-comic', lesson: 'i-book', game: 'i-play', quiz: 'i-note', sim: 'i-science' };
  var CHIPS = [['all', '전체', 'i-grid'], ['video', '영상', 'i-video'], ['comic', '만화', 'i-comic'],
               ['lesson', '레슨', 'i-book'], ['game', '게임', 'i-play'], ['quiz', '퀴즈', 'i-note']];

  /* ================================================================
     2. 색인 만들기
     ================================================================ */
  var IDX = null, IDX_STAMP = '', UNMAPPED = [];

  function u() { try { return (typeof U !== 'undefined') ? U : {}; } catch (e) { return {}; } }
  /* 연령 프로필(DESIGN_SPEC §5)이 단일 소유자. 유아·초등 = 아이 뱅크, 중고등·성인 = 성인 뱅크.
     ageTier 가 아직 없는 저장분은 예전 kidMode 로 되돌아간다. */
  function tier() { var t = u().ageTier; return (t === 'toddler' || t === 'elementary' || t === 'teen' || t === 'adult') ? t : ''; }
  function isKid() { var t = tier(); if (t) return t === 'toddler' || t === 'elementary'; return !!u().kidMode; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  /* 원본 단원명에 이모지가 섞여 있다(예: "📗 아침의 나라 임금님들").
     아이콘 자리에는 전용 SVG만 쓰기로 했으므로 표시용 문자열에서는 걷어낸다. */
  var EMOJI_RE = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu;
  function deco(s) { return String(s == null ? '' : s).replace(EMOJI_RE, '').replace(/\s{2,}/g, ' ').trim(); }
  function svg(id, cls) { return '<svg class="ico' + (cls ? ' ' + cls : '') + '" aria-hidden="true" focusable="false"><use href="#' + (id || 'i-star') + '"/></svg>'; }
  /* 과목 액센트를 저알파 틴트로. 고정 밝은색(ti)을 배경에 깔면 다크 모드에서 흰 글씨가 죽는다.
     알파 틴트는 --bg 위에 얹히므로 라이트/다크 어느 쪽이든 글자색(--tx)이 그대로 산다. */
  function tint(hex, a) {
    var h = String(hex).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  /* 다크에서 과목 액센트를 흰쪽으로 섞는다. 알파 틴트와 달리 어두운 배경 위에서도
     아이콘 선이 살아난다(#1D4ED8 같은 진한 남색이 검정 위에서 안 보이던 문제). */
  function lighten(hex, a) {
    var h = String(hex).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16), r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return 'rgb(' + Math.round(r + (255 - r) * a) + ',' + Math.round(g + (255 - g) * a) + ',' + Math.round(b + (255 - b) * a) + ')';
  }
  /* 검정쪽으로 섞는다. 형식 배지(.lp-kd)는 밝은 고정 틴트(ti) 위에 액센트 글씨를 얹는데
     경제·사회(#A16207 on #FCF3E0)만 4.46:1 로 AA(4.5) 미달이었다(개편 전부터).
     ti 가 항상 밝으므로 글씨를 어둡게 하면 11과목 전부 단조 증가한다. */
  function shade(hex, a) {
    var h = String(hex).replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    return 'rgb(' + Math.round(((n >> 16) & 255) * (1 - a)) + ',' + Math.round(((n >> 8) & 255) * (1 - a)) + ',' + Math.round((n & 255) * (1 - a)) + ')';
  }

  function vTags(title) {
    var out = [];
    for (var i = 0; i < V_TAGWORDS.length; i++) if (String(title).indexOf(V_TAGWORDS[i][0]) >= 0) out = out.concat(V_TAGWORDS[i][1]);
    return out;
  }
  function resolveVideo(v) {
    var c = v.c || '';
    for (var i = 0; i < VC_PREFIX.length; i++) if (c.indexOf(VC_PREFIX[i][0]) === 0) return { s: VC_PREFIX[i][1], t: VC_PREFIX[i][2] };
    if (VC2S[c]) return { s: VC2S[c], t: [] };
    return null;
  }
  function resolveQuiz(q) {
    var c = q.cat || '';
    for (var i = 0; i < QC_PREFIX.length; i++) if (c.indexOf(QC_PREFIX[i][0]) === 0) return { s: QC_PREFIX[i][1], t: QC_PREFIX[i][2] };
    if (QC2S[c]) return { s: QC2S[c], t: [] };
    return null;
  }
  function resolveUnit(ck, unitNm) {
    var nm = String(unitNm || '');
    for (var i = 0; i < UNIT_RULES.length; i++) if (nm.indexOf(UNIT_RULES[i].m) >= 0) return UNIT_RULES[i];
    var s = CK2S[ck];
    return s ? { s: s, kind: 'lesson', t: [] } : null;
  }

  function push(items, o) { o.i = items.length; items.push(o); return o; }

  function build() {
    var items = [], unmapped = [];
    var x = u(), played = x.gamesPlayed || {}, seen = x.seen || {};

    /* --- 게임 --- */
    if (typeof GMS !== 'undefined') GMS.forEach(function (g) {
      var m = G2S[g.nm];
      if (!m) { unmapped.push('game:' + g.nm); m = ['art']; }
      push(items, { kind: 'game', t: g.nm, d: g.d, s: m[0], also: m.slice(1),
        tag: G_TAG[g.nm] || [], g: g, done: !!played[g.nm] });
    });

    /* --- PhET 실험 (해보기 구역에서 게임과 함께 선다) --- */
    if (typeof SIMS !== 'undefined') SIMS.forEach(function (sm) {
      var m = SIM2S[sm.nm];
      if (!m) { unmapped.push('sim:' + sm.nm); m = { s: ['science'], t: [] }; }
      push(items, { kind: 'sim', t: sm.nm, d: sm.d, s: m.s[0], also: m.s.slice(1), tag: m.t, sim: sm, done: false });
    });

    /* --- 영상 --- */
    var vs = [];
    try { vs = (typeof getV === 'function') ? getV() : (typeof V !== 'undefined' ? V : []); } catch (e) { vs = []; }
    vs.forEach(function (v) {
      var r = resolveVideo(v);
      if (!r) { unmapped.push('video[' + v.c + ']:' + v.t); r = { s: ['science'], t: [] }; }
      push(items, { kind: 'video', t: v.t, d: v.c, s: r.s[0], also: r.s.slice(1),
        tag: r.t.concat(vTags(v.t)), v: v, done: !!seen[v.id] });
    });

    /* --- 레슨·만화 (빌트인 CURRICULUM + content_library 병합분) --- */
    if (typeof CURRICULUM !== 'undefined') Object.keys(CURRICULUM).forEach(function (ck) {
      var c = CURRICULUM[ck]; if (!c || !c.units) return;
      c.units.forEach(function (unit, ui) {
        var r = resolveUnit(ck, unit.nm);
        if (!r) { unmapped.push('unit[' + ck + ']:' + unit.nm); r = { s: ['society'], kind: 'lesson', t: [] }; }
        (unit.lessons || []).forEach(function (l, li) {
          /* 만화는 첫 컷을 썸네일로 쓴다 — 콘텐츠 HTML의 첫 <img src> 추출 */
          var mi = (l && l.content) ? String(l.content).match(/<img[^>]+src="([^"]+)"/i) : null;
          /* ★ui/li = CURRICULUM 안의 단원·레슨 번호. 이게 있으면 화면을 훑지 않고 바로 연다. */
          push(items, { kind: r.kind, t: l.t, d: unit.nm, s: r.s[0], also: r.s.slice(1), tag: r.t,
            ck: ck, ui: ui, li: li, unit: unit.nm, th: mi ? mi[1] : '', done: false });
        });
      });
    });

    /* --- 커리큘럼 마스터(과목별 주제) — 로드된 뒤에만 --- */
    if (window._lpCM) {
      var age = isKid() ? 'kids' : 'adult', bank = window._lpCM[age] || {};
      Object.keys(bank).forEach(function (tile) {
        var sk = TILE2S[tile];
        if (!sk) { unmapped.push('tile:' + tile); return; }
        (bank[tile].units || []).forEach(function (unit) {
          var r = resolveUnit(null, unit.name) || { s: [sk], kind: 'lesson', t: [] };
          var sub = (r.s && SB[r.s[0]]) ? r.s[0] : sk;
          (unit.topics || []).forEach(function (t) {
            push(items, { kind: r.kind === 'comic' ? 'comic' : 'lesson', t: t.name, d: unit.name,
              s: sub, also: (sub === sk ? [] : [sk]), tag: r.t || [], tile: tile, unit: unit.name, done: false });
          });
        });
      });
    }

    /* --- 퀴즈 --- */
    var qs = [];
    try { qs = (typeof getQuiz === 'function') ? getQuiz() : (typeof QUIZ !== 'undefined' ? QUIZ : []); } catch (e) { qs = []; }
    qs.forEach(function (q) {
      var r = resolveQuiz(q);
      if (!r) { unmapped.push('quiz[' + q.cat + ']:' + String(q.q).slice(0, 20)); r = { s: ['science'], t: [] }; }
      push(items, { kind: 'quiz', t: q.q, d: q.cat, s: r.s[0], also: r.s.slice(1), tag: r.t, q: q, done: false });
    });

    /* 같은 과목 안에서 제목이 똑같은 레슨이 원본 커리큘럼에 두 벌 들어 있다
       (쉬운 판 + 자세한 판). 목록에는 한 번만 보이게 하고, 내용이 긴 쪽을 남긴다. */
    (function dedupeLessons() {
      var seen = {};
      items.forEach(function (it) {
        if (it.kind !== 'lesson' && it.kind !== 'comic') return;
        var key = it.kind + '|' + it.s + '|' + it.t;
        var prev = seen[key];
        if (!prev) { seen[key] = it; return; }
        var a = (prev.th ? 1 : 0), b = (it.th ? 1 : 0);
        if (b > a) { prev.dup = true; seen[key] = it; }
        else { it.dup = true; }
      });
    })();

    /* 과목별 버킷 */
    var by = {}; SUBJ.forEach(function (s) { by[s.k] = []; });
    items.forEach(function (it) {
      if (it.dup) return;
      if (by[it.s]) by[it.s].push(it);
      (it.also || []).forEach(function (a) { if (by[a] && by[a].indexOf(it) < 0) by[a].push(it); });
    });

    UNMAPPED = unmapped;
    return { items: items, by: by };
  }

  function stamp() { return (isKid() ? 'k' : 'a') + '|' + (tier() || '-') + '|' + (window._lpCM ? 1 : 0) + '|' +
      ((typeof V !== 'undefined' ? V.length : 0)) + '|' + ((typeof QUIZ !== 'undefined' ? QUIZ.length : 0)) + '|' +
      ((typeof CURRICULUM !== 'undefined') ? Object.keys(CURRICULUM).reduce(function (n, k) { return n + CURRICULUM[k].units.length; }, 0) : 0); }
  function idx() { var s = stamp(); if (!IDX || s !== IDX_STAMP) { IDX = build(); IDX_STAMP = s; } return IDX; }

  /* ================================================================
     3. 이어서 — 같은 과목 먼저, 그다음 태그가 겹치는 다른 과목
     ================================================================ */
  var KIND_ORDER = { comic: 0, video: 1, lesson: 2, game: 3, sim: 4, quiz: 5 };

  function related(it, opt) {
    opt = opt || {};
    var all = idx().items, want = opt.kinds || null, max = opt.max || 6;
    var tag = it.tag || [], out = [];
    all.forEach(function (o) {
      if (o === it) return;
      if (want && want.indexOf(o.kind) < 0) return;
      var share = 0;
      for (var i = 0; i < tag.length; i++) if ((o.tag || []).indexOf(tag[i]) >= 0) share++;
      var same = (o.s === it.s) || (o.also || []).indexOf(it.s) >= 0 || (it.also || []).indexOf(o.s) >= 0;
      if (!share && !same) return;
      /* 점수 없는 결정적 정렬: ①태그 겹침 ②같은 과목 ③형식 우선순위 */
      out.push({ o: o, r: [share > 0 ? 0 : 1, same ? 0 : 1, KIND_ORDER[o.kind] == null ? 9 : KIND_ORDER[o.kind]] });
    });
    out.sort(function (a, b) {
      for (var i = 0; i < 3; i++) if (a.r[i] !== b.r[i]) return a.r[i] - b.r[i];
      return a.o.i - b.o.i;
    });
    return out.slice(0, max).map(function (e) { return e.o; });
  }

  /* ================================================================
     4. 열기 — 기존 함수를 그대로 태운다(새 재생기를 만들지 않는다)
     ================================================================ */
  function openItem(i) {
    var it = idx().items[i]; if (!it) return;
    try {
      if (it.kind === 'game' && it.g) { oG(it.g.u, it.g.nm); return; }
      if (it.kind === 'sim' && it.sim) { playSim(it.sim.u, it.sim.nm); return; }
      if (it.kind === 'video' && it.v) { playVid(it.v.id, it.v.t); return; }
      if (it.kind === 'quiz' && it.q) { openQuizOne(it); return; }
      openLessonItem(it);
    } catch (e) { try { toast('지금은 열 수 없어요'); } catch (e2) {} }
  }
  window.lpOpenItem = openItem;

  function openQuizOne(it) {
    var b = document.getElementById('moB'); if (!b) return;
    var pool = idx().items.filter(function (o) { return o.kind === 'quiz' && (o.s === it.s || (o.also || []).indexOf(it.s) >= 0); });
    var pick = [it.q].concat(pool.filter(function (o) { return o !== it; }).slice(0, 4).map(function (o) { return o.q; }));
    b.innerHTML = '<div style="font-size:14px;font-weight:700;margin-bottom:8px">' + esc(SB[it.s].nm) + ' 확인 퀴즈</div><div id="lpQzArea"></div>';
    document.getElementById('mo').classList.add('sh');
    setTimeout(function () { var a = document.getElementById('lpQzArea'); if (a && typeof renderQuiz === 'function') renderQuiz(a, pick); }, 40);
  }

  /* 레슨·만화 — 학습(p1) 화면의 실제 흐름을 그대로 재생한다.
     과목을 열고, 단원 목록이 그려질 때까지 훑다가, 제목이 맞는 카드를 눌러 준다. */
  function openLessonItem(it) {
    var kid = isKid();

    /* ★빠른 길 — CURRICULUM 안에 있는 항목(만화 전부 포함)은 단원·레슨 번호를 알고 있다.
       화면을 훑어 제목 맞는 카드를 찾는 방식은 만화가 다른 타일에 있으면 실패해서
       "자연수와 덧셈뺄셈" 같은 엉뚱한 목록만 남았다. 번호가 있으면 바로 연다. */
    if (it.ck && typeof it.ui === 'number' && typeof it.li === 'number'
        && typeof openSubject === 'function' && typeof openLesson === 'function') {
      try {
        go(1);
        openSubject(it.ck);
        setTimeout(function () {
          try {
            openLesson(it.ui, it.li);
            var ttl = document.getElementById('learnLesson');
            if (ttl) ttl.scrollIntoView({ block: 'start' });
          } catch (e) {}
        }, 60);
        return;
      } catch (e) { /* 실패하면 아래 기존 경로로 내려간다 */ }
    }

    var tile = it.tile || (S2TILE[it.s] ? (kid ? S2TILE[it.s].kid : S2TILE[it.s].adult) : null);
    try { go(1); } catch (e) {}
    var tried = {};
    function open(t) { if (!t || tried[t]) return; tried[t] = 1; try { if (typeof openSubjectNew === 'function') openSubjectNew(t); else if (it.ck) openSubject(it.ck); } catch (e) { try { openSubject(it.ck); } catch (e2) {} } }
    open(tile);
    var n = 0, alt = false;
    (function seek() {
      var list = document.getElementById('unitList');
      if (list) {
        var cards = list.querySelectorAll('.gc');
        for (var i = 0; i < cards.length; i++) {
          if (cards[i].textContent.indexOf(it.t) >= 0) {
            cards[i].click();
            var ttl = document.getElementById('learnLesson');
            if (ttl) ttl.scrollIntoView({ block: 'start' });
            return;
          }
        }
      }
      n++;
      if (!alt && n === 10) { alt = true; open(kid ? (S2TILE[it.s] || {}).adult : (S2TILE[it.s] || {}).kid); if (it.ck) open(null); }
      if (!alt && n === 14 && it.ck) { try { openSubject(it.ck); } catch (e) {} }
      if (n < 45) setTimeout(seek, 120);
      else try { toast('레슨을 찾지 못했어요 — 과목 목록에서 열어 주세요'); } catch (e) {}
    })();
  }

  /* ================================================================
     5. 과목 허브 (p5)
     ================================================================ */
  var curHub = null, curChip = 'all', HUB_MORE = {}, curHubOpt = null;

  function counts(k) {
    var b = idx().by[k] || {}, c = { video: 0, comic: 0, lesson: 0, game: 0, quiz: 0, sim: 0 };
    (idx().by[k] || []).forEach(function (it) { c[it.kind] = (c[it.kind] || 0) + 1; });
    return c;
  }

  function renderSubjectList() {
    var host = document.getElementById('subjHome'); if (!host) return;
    var x = u(), lbs = (x.stats && x.stats.lessonsBySubject) || {};
    var h = '<div class="sec">' + svg('i-grid') + ' 과목 고르기</div>'
          + '<div style="font-size:11px;color:var(--t3);margin:-4px 0 8px">영상·만화·레슨·게임·퀴즈가 과목 안에 함께 있어요</div>'
          + '<div class="g2" id="lpSubjGrid">';
    SUBJ.forEach(function (s) {
      var c = counts(s.k), tot = c.video + c.comic + c.lesson + c.game + c.quiz + c.sim;
      var done = (idx().by[s.k] || []).filter(function (o) { return o.done; }).length;
      var pct = tot ? Math.round(done / tot * 100) : 0;
      h += '<div class="subjc" style="--sc:' + s.ac + '" onclick="lpOpenSubject(\'' + s.k + '\')" role="button" tabindex="0">'
        + '<div class="si">' + svg(s.sym) + '</div>'
        + '<div class="sn">' + esc(s.nm) + '</div>'
        + '<div class="sd">영상 ' + (c.video) + ' · 게임 ' + (c.game + c.sim) + ' · 레슨 ' + (c.lesson + c.comic) + '</div>'
        + '<div class="sp"><div class="sp-f" style="width:' + pct + '%"></div></div>'
        + '<div class="spx">전체 <b>' + tot + '</b>개 · 퀴즈 ' + c.quiz + '</div>'
        + '</div>';
    });
    h += '</div>'
      + '<div class="sec" style="margin-top:14px">' + svg('i-gear') + ' 형식으로 모아보기</div>'
      + '<div class="lp-oldrow">'
      + '<button class="bt bs" onclick="lpGoLegacy(2,\'allGm\')">' + svg('i-play') + ' 게임만 모아보기</button>'
      + '<button class="bt bs" onclick="lpGoLegacy(2,\'allVids\')">' + svg('i-video') + ' 영상만 모아보기</button>'
      + '<button class="bt bs" onclick="lpGoLegacy(2,\'allS\')">' + svg('i-science') + ' 실험</button>'
      + '<button class="bt bs" onclick="lpGoLegacy(2,\'allQ\')">' + svg('i-note') + ' 퀴즈</button>'
      + '<button class="bt bs" onclick="lpGoLegacy(1,\'subjectGrid\')">' + svg('i-book') + ' 예전 학습 화면</button>'
      + '</div>';
    host.innerHTML = h;
  }

  window.lpGoLegacy = function (panel, id) {
    /* 학습 화면이 레슨 상태로 남아 있으면 과목 목록부터 되돌린다 */
    if (panel === 1) { try { if (typeof backToUnits === 'function') backToUnits(); if (typeof backToSubjects === 'function') backToSubjects(); } catch (e) {} }
    try { go(panel); } catch (e) {}
    setTimeout(function () { var el = document.getElementById(id); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 260);
  };

  /* 형식이 섞이도록 돌려 담는다.
     그냥 순서대로 자르면 음악 배우기 88개의 앞 8개가 전부 영상이라 레슨이 화면에서 사라진다
     (DESIGN_SPEC §7-3: 한 화면에 영상·게임·레슨·퀴즈가 다 잡혀야 한다). */
  function interleave(list) {
    var g = {}, order = [];
    list.forEach(function (it) { if (!g[it.kind]) { g[it.kind] = []; order.push(it.kind); } g[it.kind].push(it); });
    order.sort(function (a, b) { return (KIND_ORDER[a] == null ? 9 : KIND_ORDER[a]) - (KIND_ORDER[b] == null ? 9 : KIND_ORDER[b]); });
    var out = [], n = 0;
    while (out.length < list.length) {
      var moved = false;
      for (var i = 0; i < order.length; i++) { var a = g[order[i]]; if (a[n]) { out.push(a[n]); moved = true; } }
      if (!moved) break;
      n++;
    }
    return out;
  }

  function zone(title, sym, list, subj, opts) {
    if (!list.length) return '';                     /* 빈 구역은 감춘다 */
    opts = opts || {};
    var key = subj + ':' + title, lim = HUB_MORE[key] ? list.length : (opts.lim || 8);
    var shown = (opts.mix ? interleave(list) : list).slice(0, lim);
    var h = '<div class="sec lp-zh">' + svg(sym) + ' ' + title + '<span class="lp-zn">' + list.length + '</span></div>';
    if (opts.poster) {
      h += '<div class="g2">' + shown.map(function (it) { return gameCard(it); }).join('') + '</div>';
    } else {
      h += '<div class="lp-list">' + shown.map(function (it) { return rowCard(it); }).join('') + '</div>';
    }
    if (list.length > lim) h += '<button class="bt bs lp-more" onclick="lpHubMore(\'' + esc(key) + '\')">+ ' + (list.length - lim) + '개 더 보기</button>';
    return h;
  }
  window.lpHubMore = function (key) { HUB_MORE[key] = 1; renderHub(curHub, curHubOpt); };

  function gameCard(it) {
    var g = it.g, s = SB[it.s];
    if (it.kind === 'sim') {
      return '<div class="gcard lp-simcard" onclick="lpOpenItem(' + it.i + ')">'
        + '<div class="gth gthp" style="--pc:' + s.ac + '">' + svg('i-science', 'gthp-i') + '</div>'
        + '<div class="band" style="background:' + s.ac + '"></div>'
        + '<div class="gn">' + esc(it.t) + '</div><div class="gd">' + esc(deco(it.d)) + '</div>'
        + '<div class="play">▶ 실험하기</div></div>';
    }
    var m = (typeof GAME_META !== 'undefined' && GAME_META[g.nm]) || { d: 2, xp: 15, min: 5, hook: g.d };
    return '<div class="gcard" onclick="lpOpenItem(' + it.i + ')">'
      + (typeof gameThumb === 'function' ? gameThumb(g) : '')
      + '<div class="band" style="background:' + s.ac + '"></div>'
      + '<div class="gn">' + esc(g.nm) + '</div><div class="gd">' + esc(m.hook || g.d) + '</div>'
      + '<div class="gmeta"><span class="gtime">' + (m.min > 0 ? m.min + '분' : '∞') + '</span><span class="gxp">+' + m.xp + 'XP</span></div>'
      + '<div class="play">▶ 플레이</div>'
      + '<button class="lp-linkb" title="이어서 볼 것" onclick="event.stopPropagation();lpShowNext(' + it.i + ')">' + svg('i-repeat') + ' 이어서</button>'
      + '</div>';
  }

  function rowCard(it) {
    var s = SB[it.s];
    var fb = '<span class=\'lp-rth lp-rths\' style=\'background:' + s.ti + ';color:' + s.ac + '\'>' + svg(KIND_SYM[it.kind]) + '</span>';
    var thumb = (it.kind === 'video' && it.v)
      ? '<img class="lp-rth" src="https://img.youtube.com/vi/' + esc(it.v.id) + '/mqdefault.jpg" loading="lazy" alt="">'
      : (it.th
        ? '<img class="lp-rth lp-rthc" src="' + esc(it.th) + '" loading="lazy" alt=""'
          + ' onerror="this.outerHTML=this.getAttribute(\'data-fb\')" data-fb="' + esc(fb) + '">'
        : fb);
    return '<div class="lp-row" onclick="lpOpenItem(' + it.i + ')" role="button" tabindex="0">'
      + thumb
      + '<div class="lp-rx"><div class="lp-rt">' + esc(it.t) + '</div>'
      + '<div class="lp-rd"><span class="lp-kd" style="background:' + s.ti + ';color:' + shade(s.ac, .14) + '">' + KIND_LABEL[it.kind] + '</span>' + esc(deco(it.d)) + '</div></div>'
      + (it.done ? '<span class="lp-done">완료</span>' : '<span class="lp-arr">›</span>')
      + '</div>';
  }

  /* 과목 화면의 주 액션 — 화면당 딱 하나 (벤치마크: 첫 화면은 "지금 뭘 하지?"에 답해야 한다).
     이미 한 게 있으면 '이어서 하기', 없으면 '시작하기'. 대상은 아직 안 한 첫 배우기 항목.
     칩 필터와 무관하게 과목 전체에서 고른다 — 필터를 바꿨다고 주 액션이 사라지면 안 된다. */
  function primaryCard(k) {
    var s = SB[k], bucket = idx().by[k] || [];
    if (!bucket.length) return '';
    var doneN = 0;
    for (var d = 0; d < bucket.length; d++) if (bucket[d].done) doneN++;
    function of(kinds) { return bucket.filter(function (it) { return kinds.indexOf(it.kind) >= 0; }); }
    var pool = of(['video', 'comic', 'lesson']);
    if (!pool.length) pool = of(['game', 'sim']);
    if (!pool.length) pool = bucket.slice();
    pool = interleave(pool);
    var pick = null;
    for (var i = 0; i < pool.length; i++) if (!pool[i].done) { pick = pool[i]; break; }
    if (!pick) pick = pool[0];
    if (!pick) return '';
    var sub = KIND_LABEL[pick.kind] || '';
    if (pick.d) sub += ' · ' + deco(pick.d);
    return '<button class="lp-pact" style="--sc:' + s.ac + ';--scs:' + tint(s.ac, .34) + '"'
      + ' onclick="lpOpenItem(' + pick.i + ')">'
      + '<span class="lp-pai">' + svg(KIND_SYM[pick.kind]) + '</span>'
      + '<span class="lp-pax">'
      + '<span class="lp-pak">' + esc(s.nm) + (doneN ? ' 이어서 하기' : ' 시작하기') + '</span>'
      + '<span class="lp-pat">' + esc(pick.t) + '</span>'
      + '<span class="lp-pad">' + esc(sub) + '</span>'
      + '</span>'
      + '<span class="lp-paa">' + svg('i-play') + '</span></button>'
      + '<div class="lp-pacm">' + esc(s.nm) + ' 전체 ' + bucket.length + '개'
      + (doneN ? ' · 이미 한 것 ' + doneN + '개' : '') + '</div>';
  }

  /* host 를 갈아끼울 수 있게 했다. 홈 상단 탭('lpHomeSubj')과 과목 허브 패널('subjHub')이
     같은 렌더러를 쓴다 — 두 번째 렌더러를 만들지 않는다. 내부 id 는 host 별로 접두어를 붙여
     같은 id 가 문서에 두 번 생기지 않게 한다. */
  function renderHub(k, opt) {
    opt = opt || curHubOpt || {};
    var hostId = opt.host || 'subjHub';
    var host = document.getElementById(hostId); if (!host || !SB[k]) return;
    var home = !!opt.home;
    curHub = k; curHubOpt = opt;
    var s = SB[k], bucket = idx().by[k] || [];
    var f = curChip;
    function pick(kinds) {
      return bucket.filter(function (it) {
        if (kinds.indexOf(it.kind) < 0) return false;
        if (f !== 'all' && it.kind !== f) return false;
        return true;
      });
    }
    var learn = pick(['video', 'comic', 'lesson']);
    var play = pick(['game', 'sim']);
    var check = pick(['quiz']);

    /* 이어서 — 이 과목 밖에 있으면서 태그가 겹치는 것 */
    var seenT = {}, next = [];
    bucket.forEach(function (it) {
      related(it, { max: 4 }).forEach(function (o) {
        if (o.s === k || (o.also || []).indexOf(k) >= 0) return;
        if (seenT[o.i]) return; seenT[o.i] = 1; next.push(o);
      });
    });
    next.sort(function (a, b) { return (KIND_ORDER[a.kind] - KIND_ORDER[b.kind]) || (a.i - b.i); });
    next = next.slice(0, 6);

    /* 홈에서는 과목 이름이 이미 상단 탭에 켜져 있다. 머리말 대신 주 액션 카드를 놓는다. */
    var h = home
      ? primaryCard(k)
      : ('<div class="lp-hubhead" style="--sc:' + s.ac + ';background:' + tint(s.ac, .13) + '">'
      + '<button class="bt bs lp-back" onclick="lpBackToSubjects()">←</button>'
      /* ★클래스 이름은 lp-sh* — home_tidy.js 가 이미 .lp-hubi/.lp-hubt/.lp-hubc 를
         '만화·영상으로 배우기' 카드에 쓰고 있어서 같은 이름을 쓰면 홈 카드가 망가진다. */
      + '<span class="lp-shi" style="color:' + s.ac + '">' + svg(s.sym) + '</span>'
      + '<span class="lp-sht">' + esc(s.nm) + '</span>'
      + '<span class="lp-shc">' + bucket.length + '개</span></div>');
    h += '<div class="lp-chips" id="' + hostId + '-chips">'
      + CHIPS.map(function (c) {
          var n = c[0] === 'all' ? bucket.length : bucket.filter(function (it) { return it.kind === c[0] || (c[0] === 'game' && it.kind === 'sim'); }).length;
          if (!n && c[0] !== 'all') return '';
          return '<button class="bt ' + (f === c[0] ? 'bp' : 'bs') + '" onclick="lpHubChip(\'' + c[0] + '\')">' + svg(c[2]) + '<span>' + c[1] + ' ' + n + '</span></button>';
        }).join('')
      + '</div>'
      + '<div id="' + hostId + '-body">';

    h += zone('배우기', 'i-book', learn, k, { lim: 9, mix: true });
    h += zone('해보기', 'i-play', play, k, { poster: true, lim: 8 });
    if (check.length) {
      h += '<div class="sec lp-zh">' + svg('i-note') + ' 확인<span class="lp-zn">' + check.length + '</span></div>'
        + '<div id="' + hostId + '-qz"></div>'
        + '<button class="bt bp lp-more" onclick="lpFullQuiz(\'' + k + '\')">' + esc(s.nm) + ' 퀴즈 ' + check.length + '문항 전체 도전</button>';
    }
    if (next.length) {
      h += '<div class="sec lp-zh">' + svg('i-repeat') + ' 이어서<span class="lp-zn">다른 과목</span></div>'
        + '<div style="font-size:11px;color:var(--t3);margin:-4px 0 6px">' + esc(s.nm) + '과 이어지는 다른 과목 내용이에요</div>'
        + '<div class="lp-list">' + next.map(rowCard).join('') + '</div>';
    }
    if (!learn.length && !play.length && !check.length && !next.length)
      h += '<div style="padding:24px;text-align:center;color:var(--t3);font-size:12px">이 형식의 내용이 아직 없어요</div>';
    /* 홈에서도 과목 허브 패널(p5)로 가는 문을 남긴다 — 하단 '과목' 탭이 사라졌으므로. */
    if (home) h += '<button class="bt bs lp-more" onclick="lpOpenSubject(\'' + k + '\')">'
      + svg('i-grid') + ' ' + esc(s.nm) + ' 과목 화면으로 · 다른 과목 전체 보기</button>';
    h += '</div>';
    host.innerHTML = h;
    host.style.display = '';
    if (!home) { var sh = document.getElementById('subjHome'); if (sh) sh.style.display = 'none'; }

    if (check.length) {
      var qa = document.getElementById(hostId + '-qz');
      if (qa && typeof renderQuiz === 'function') { try { renderQuiz(qa, check.slice(0, 3).map(function (o) { return o.q; })); } catch (e) {} }
    }
    if (!home) { var p5 = document.getElementById('p5'); if (p5) p5.scrollTop = 0; }
  }

  window.lpOpenSubject = function (k) { curChip = 'all'; HUB_MORE = {}; try { go(5); } catch (e) {} renderHub(k, { host: 'subjHub' }); ensureCM(); };
  window.lpHubChip = function (f) { curChip = f; renderHub(curHub, curHubOpt); };
  window.lpBackToSubjects = function () {
    var hub = document.getElementById('subjHub'), home = document.getElementById('subjHome');
    if (hub) hub.style.display = 'none';
    if (home) { home.style.display = ''; renderSubjectList(); }
    curHub = null; curHubOpt = null;
  };
  window.lpFullQuiz = function (k) {
    var pool = (idx().by[k] || []).filter(function (o) { return o.kind === 'quiz'; }).map(function (o) { return o.q; });
    if (!pool.length) return;
    var sel = pool.slice().sort(function () { return Math.random() - .5; }).slice(0, 10);
    var b = document.getElementById('moB'); if (!b) return;
    b.innerHTML = '<div style="font-size:14px;font-weight:700;margin-bottom:8px">' + esc(SB[k].nm) + ' 퀴즈</div><div id="lpQzArea"></div>';
    document.getElementById('mo').classList.add('sh');
    setTimeout(function () { var a = document.getElementById('lpQzArea'); if (a && typeof renderQuiz === 'function') renderQuiz(a, sel); }, 40);
  };

  /* ================================================================
     5-b. 홈 상단 과목 탭 스트립 (IPTV 장르바)
     오너 지적: "메인이 뒤로 밀려있고 서브아이템이 메인에 나오는 느낌".
     과목이 이 앱의 메인이다. 홈 첫 줄에 과목을 놓고, 지금까지의 홈 전체는
     '추천' 탭 하나로 접어 넣는다. 지운 것은 없다.
     ================================================================ */
  var homeTab = REC_KEY;

  function homeTabDefs() {
    var out = [REC_TAB], seen = {};
    HOME_ORDER.forEach(function (k) { if (SB[k] && !seen[k]) { seen[k] = 1; out.push(SB[k]); } });
    SUBJ.forEach(function (s) { if (!seen[s.k]) { seen[s.k] = 1; out.push(s); } });   /* 새 과목이 늘어도 빠지지 않게 */
    return out;
  }

  function renderHomeTabs() {
    var host = document.getElementById('lpSubjTabs'); if (!host) return;
    if (host.getAttribute('data-lp-built') !== '1') {
      host.innerHTML = homeTabDefs().map(function (s) {
        return '<button class="st" role="tab" data-k="' + s.k + '" aria-selected="false" tabindex="-1"'
          + ' style="--sc:' + s.ac + ';--scl:' + lighten(s.ac, .5) + ';--stb:' + tint(s.ac, .34)
          + ';--scs:' + tint(s.ac, .32) + '"'
          + ' onclick="lpHomeTab(\'' + s.k + '\')">' + svg(s.sym) + '<span>' + esc(s.nm) + '</span></button>';
      }).join('');
      host.setAttribute('data-lp-built', '1');
    }
    syncHomeTabs(false);
    measureStrip();
  }

  /* 스트립 실측 높이를 #p0 에 심는다. 연령대(유아 46px 알약)마다 높이가 달라서 상수로 못 박으면
     카테고리 줄이 겹치거나 뜬다. */
  function measureStrip() {
    var host = document.getElementById('lpSubjTabs'), p0 = document.getElementById('p0');
    if (!host || !p0) return;
    var apply = function () {
      var h = host.offsetHeight;
      if (h > 0) p0.style.setProperty('--lp-stabh', h + 'px');
    };
    apply();
    setTimeout(apply, 120);
  }

  function syncHomeTabs(scroll) {
    var host = document.getElementById('lpSubjTabs'); if (!host) return;
    var act = null;
    [].slice.call(host.children).forEach(function (b) {
      var on = b.getAttribute('data-k') === homeTab;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
      b.setAttribute('tabindex', on ? '0' : '-1');
      if (on) act = b;
    });
    if (!act || scroll === false) return;
    /* 켜진 탭을 가운데로. scrollIntoView 는 세로 스크롤까지 건드려서 쓰지 않는다. */
    var left = Math.max(0, act.offsetLeft - (host.clientWidth - act.offsetWidth) / 2);
    try { host.scrollTo({ left: left, behavior: 'smooth' }); } catch (e) { host.scrollLeft = left; }
  }

  window.lpHomeTab = function (k) {
    var p0 = document.getElementById('p0'), body = document.getElementById('lpHomeSubj');
    if (k !== REC_KEY && !SB[k]) k = REC_KEY;
    homeTab = k;
    if (k === REC_KEY) {
      if (p0) p0.classList.remove('lp-subjmode');
      if (body) { body.style.display = 'none'; body.innerHTML = ''; }
      curHub = null; curHubOpt = null;
    } else {
      if (p0) p0.classList.add('lp-subjmode');
      if (body) body.style.display = '';
      curChip = 'all'; HUB_MORE = {};
      renderHub(k, { host: 'lpHomeSubj', home: true });
      ensureCM();
    }
    syncHomeTabs(true);
    if (p0) p0.scrollTop = 0;
  };
  window.lpHomeTabState = function () { return homeTab; };

  /* ================================================================
     6. 이어서 시트 — 게임 끝 / 레슨 끝
     ================================================================ */
  function nextSheet(title, sub, list) {
    var b = document.getElementById('moB'); if (!b || !list.length) return false;
    list = interleave(list);           /* 만화만 6장 뜨지 않도록 형식을 섞는다 (1순위는 그대로 유지) */
    b.innerHTML = '<div class="lp-nsh">' + svg('i-repeat') + ' ' + esc(title) + '</div>'
      + '<div class="lp-nsd">' + esc(sub) + '</div>'
      + '<div class="lp-list">' + list.map(rowCard).join('') + '</div>'
      + '<button class="bt bs" style="width:100%;margin-top:8px" onclick="cMo()">닫기</button>';
    document.getElementById('mo').classList.add('sh');
    return true;
  }
  window.lpShowNext = function (i) {
    var it = idx().items[i]; if (!it) return;
    var rel = related(it, { kinds: ['comic', 'video', 'lesson', 'quiz'], max: 6 });
    if (!nextSheet('이어서', esc(it.t) + ' 와(과) 이어지는 내용', rel)) try { toast('이어질 내용이 아직 없어요'); } catch (e) {}
  };
  function itemByGameName(nm) {
    var a = idx().items;
    for (var i = 0; i < a.length; i++) if (a[i].kind === 'game' && a[i].t === nm) return a[i];
    return null;
  }

  /* ================================================================
     7. 지도 (p6) — 태그 그래프.
     폰에서 1,700개 노드를 한 번에 그리면 느려서, 2단으로 나눈다.
       0단계: 과목 11개 + 과목끼리 겹치는 내용이 있으면 선
       1단계: 과목 하나를 누르면 그 과목 대표 12개가 위성으로 뜬다
     ================================================================ */
  var MAP = { level: 0, focus: null, nodes: [], cv: null, dpr: 1 };

  function mapEdges() {
    var e = [], seen = {};
    idx().items.forEach(function (it) {
      (it.also || []).forEach(function (a) {
        if (!SB[a] || a === it.s) return;
        var key = [it.s, a].sort().join('|');
        if (seen[key]) { seen[key].n++; return; }
        seen[key] = { a: it.s, b: a, n: 1 }; e.push(seen[key]);
      });
    });
    return e;
  }

  function layoutSubjects(w, h) {
    var cx = w / 2, cy = h / 2 - 4, R = Math.min(w, h) / 2 - 48, n = SUBJ.length;
    return SUBJ.map(function (s, i) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / n;
      var bucket = idx().by[s.k] || [];
      var done = bucket.filter(function (o) { return o.done; }).length;
      return { type: 'subj', k: s.k, nm: s.nm, ac: s.ac, r: 21,
        x: cx + R * Math.cos(a), y: cy + R * Math.sin(a),
        tot: bucket.length, done: done };
    });
  }

  function layoutFocus(k, w, h) {
    var s = SB[k], cx = w / 2, cy = h / 2, R = Math.min(w, h) / 2 - 46;
    var bucket = (idx().by[k] || []).slice();
    /* 대표 12개 — 형식을 돌려 담아 만화만 12개 뜨는 일이 없게 한다. 완료한 것을 앞에 둔다. */
    bucket.sort(function (a, b) {
      if (a.done !== b.done) return a.done ? -1 : 1;
      return (KIND_ORDER[a.kind] - KIND_ORDER[b.kind]) || (a.i - b.i);
    });
    var pick = interleave(bucket).slice(0, 12);
    var nodes = [{ type: 'subj', k: k, nm: s.nm, ac: s.ac, r: 26, x: cx, y: cy,
      tot: bucket.length, done: bucket.filter(function (o) { return o.done; }).length, center: 1 }];
    pick.forEach(function (it, i) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / pick.length;
      nodes.push({ type: 'item', it: it, nm: it.t, ac: (SB[it.s] || s).ac, r: 13,
        x: cx + R * Math.cos(a), y: cy + R * Math.sin(a), done: it.done });
    });
    return nodes;
  }

  function drawMap() {
    var cv = document.getElementById('lpMapCv'); if (!cv) return;
    var wrap = cv.parentNode, w = Math.max(280, wrap.clientWidth), h = 380;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = w * dpr; cv.height = h * dpr; cv.style.width = w + 'px'; cv.style.height = h + 'px';
    var g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    MAP.dpr = dpr; MAP.cv = cv;
    var css = getComputedStyle(document.documentElement);
    var txc = (css.getPropertyValue('--tx') || '#1A2140').trim();
    var t3c = (css.getPropertyValue('--t3') || '#6E7897').trim();
    g.clearRect(0, 0, w, h);

    var nodes = MAP.level === 0 ? layoutSubjects(w, h) : layoutFocus(MAP.focus, w, h);
    MAP.nodes = nodes;

    /* 선 */
    g.lineWidth = 1.2;
    if (MAP.level === 0) {
      var pos = {}; nodes.forEach(function (n) { pos[n.k] = n; });
      mapEdges().forEach(function (e) {
        var a = pos[e.a], b = pos[e.b]; if (!a || !b) return;
        g.strokeStyle = 'rgba(107,69,240,' + Math.min(.42, .12 + e.n * .03) + ')';
        g.lineWidth = Math.min(3, 1 + e.n * .25);
        g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
      });
    } else {
      var c = nodes[0];
      nodes.slice(1).forEach(function (n) {
        g.strokeStyle = n.done ? 'rgba(18,135,74,.55)' : 'rgba(107,69,240,.22)';
        g.lineWidth = n.done ? 2 : 1.2;
        g.beginPath(); g.moveTo(c.x, c.y); g.lineTo(n.x, n.y); g.stroke();
      });
    }

    /* 점 */
    nodes.forEach(function (n) {
      g.beginPath(); g.arc(n.x, n.y, n.r, 0, Math.PI * 2);
      g.fillStyle = (n.type === 'subj') ? '#fff' : (n.done ? n.ac : '#fff');
      g.fill();
      g.lineWidth = n.type === 'subj' ? 2.5 : 2;
      g.strokeStyle = n.ac; g.stroke();
      if (n.type === 'subj' && n.tot) {   /* 진도 링 */
        g.beginPath();
        g.arc(n.x, n.y, n.r + 4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (n.done / n.tot));
        g.strokeStyle = '#12874A'; g.lineWidth = 3; g.stroke();
      }
      g.textAlign = 'center'; g.textBaseline = 'middle';
      if (n.type === 'subj') {
        /* 이름은 원 밖 아래로 — '마음·건강' 같은 긴 이름이 원을 삐져나오지 않게 */
        g.fillStyle = n.ac; g.font = '700 10px system-ui,sans-serif';
        g.fillText(n.done + '/' + n.tot, n.x, n.y);
        g.fillStyle = txc; g.font = '700 11px system-ui,sans-serif';
        g.fillText(n.nm, n.x, n.y + n.r + 13);
      } else {
        g.fillStyle = n.done ? '#fff' : n.ac;
        g.font = '9px system-ui,sans-serif';
        g.fillText(n.done ? '✓' : '', n.x, n.y);
        g.fillStyle = txc; g.font = '9px system-ui,sans-serif';
        var t = n.nm.length > 8 ? n.nm.slice(0, 7) + '…' : n.nm;
        g.fillText(t, n.x, n.y + n.r + 9);
      }
    });
  }

  function mapHit(ev) {
    var cv = MAP.cv; if (!cv) return null;
    var r = cv.getBoundingClientRect();
    var px = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
    var py = (ev.touches ? ev.touches[0].clientY : ev.clientY) - r.top;
    for (var i = MAP.nodes.length - 1; i >= 0; i--) {
      var n = MAP.nodes[i], dx = px - n.x, dy = py - n.y;
      if (dx * dx + dy * dy <= (n.r + 8) * (n.r + 8)) return n;
    }
    return null;
  }

  function renderMap() {
    var host = document.getElementById('mapWrap'); if (!host) return;
    ensureCM();
    var sub = MAP.level === 0
      ? '과목 11개와, 내용이 서로 겹치는 곳을 선으로 이었어요. 동그라미를 눌러 보세요.'
      : (SB[MAP.focus] ? SB[MAP.focus].nm + ' — 대표 12개. 초록은 이미 한 것, 누르면 열려요.' : '');
    host.innerHTML = '<div class="sec">' + svg('i-map') + ' 배움 지도</div>'
      /* 하단 '과목' 탭을 뺐으므로 과목 허브(p5)로 가는 상시 입구를 여기 둔다 */
      + '<button class="bt bs lp-allsubj" onclick="go(5)">' + svg('i-grid') + ' 전체 과목 목록 열기 (11과목)</button>'
      + '<div class="lp-mapsub" id="lpMapSub">' + esc(sub) + '</div>'
      + '<div class="lp-mapbox"><canvas id="lpMapCv"></canvas></div>'
      + (MAP.level ? '<button class="bt bs" style="width:100%;margin-top:8px" onclick="lpMapBack()">← 전체 과목 지도</button>' : '')
      + '<div class="lp-maplg">'
      + '<span><i style="background:#12874A"></i>이미 한 것</span>'
      + '<span><i style="background:#6B45F0"></i>이어지는 선</span>'
      + '<span><i style="border:2px solid #C2410C;background:#fff"></i>아직 안 한 것</span></div>';
    var cv = document.getElementById('lpMapCv');
    if (cv) {
      cv.addEventListener('click', function (e) {
        var n = mapHit(e); if (!n) return;
        if (n.type === 'subj' && !n.center) { MAP.level = 1; MAP.focus = n.k; renderMap(); }
        else if (n.type === 'subj' && n.center) { window.lpOpenSubject(n.k); }
        else if (n.type === 'item') { openItem(n.it.i); }
      });
    }
    drawMap();
  }
  window.lpMapBack = function () { MAP.level = 0; MAP.focus = null; renderMap(); };

  /* ================================================================
     8. 홈 — 주 액션 하나로 접기
     '오늘의 도전'의 대형 히어로를 없애고 보조 추천 2장만 남긴다.
     주 액션은 '오늘의 한 가지'(#mhCta) 하나.
     ================================================================ */
  function foldHero() {
    if (typeof window.renderHeroBanner !== 'function' || window.renderHeroBanner._lpFolded) return;
    var orig = window.renderHeroBanner;
    function folded() {
      var el = document.getElementById('heroBanner'); if (!el) return;
      try { orig(); } catch (e) {}
      var big = el.querySelector('.hero-feat');
      if (big) big.remove();                       /* 큰 CTA 제거 — 주 액션과 경쟁 금지 */
      var ttl = el.querySelector('.hero-title');
      if (ttl) ttl.innerHTML = svg('i-star') + ' 오늘 더 볼 만한 것';
      var b = el.querySelector('.hero-banner');
      if (b) b.classList.add('lp-herosm');
      /* 연령에 안 맞는 항목 제거 — 유아에게 마그나카르타 퀴즈가 뜨던 결함 */
      if (typeof window.lpTierFits === 'function') {
        el.querySelectorAll('.hs-card').forEach(function (c) {
          var tx = c.querySelector('.hs-tx');
          var t = (tx ? tx.textContent : c.textContent || '').trim();
          if (t && !window.lpTierFits(t, '')) c.remove();
        });
        var sec = el.querySelector('.hero-sec');
        if (sec && !sec.querySelector('.hs-card')) el.innerHTML = '';   /* 남은 게 없으면 섹션째 숨김 */
      }
    }
    folded._lpFolded = true;
    window.renderHeroBanner = folded;
    try { folded(); } catch (e) {}
  }

  /* ================================================================
     9. 하단 두 줄 → 한 줄. 통합 칩 스트립을 '나' 탭으로 옮긴다
     ================================================================ */
  function relocateChips() {
    var uni = document.getElementById('lpUnifiedNav');
    var p4 = document.getElementById('p4'); if (!p4) return;
    var host = document.getElementById('lpQuickJump');
    if (!host) {
      host = document.createElement('div');
      host.id = 'lpQuickJump';
      host.innerHTML = '<div class="sec">' + svg('i-grid') + ' 빠른 이동</div>'
        + '<div style="font-size:10px;color:var(--t3);margin:-4px 0 6px">홈 아래쪽 기능들로 바로 갑니다</div>'
        + '<div id="lpQuickJumpRow" class="lp-qjr">'
        /* 하단 '과목' 탭이 사라진 뒤의 상시 입구 — 과목 허브(p5)·예전 학습/놀이 화면 */
        + '<button onclick="go(5)">' + svg('i-book') + ' 과목 전체</button>'
        + '<button onclick="lpGoLegacy(1,\'subjectGrid\')">' + svg('i-grid') + ' 예전 학습 화면</button>'
        + '<button onclick="lpGoLegacy(2,\'allGm\')">' + svg('i-play') + ' 게임 전체</button>'
        + '</div>';
      var pc = document.getElementById('profileCard');
      if (pc && pc.nextSibling) p4.insertBefore(host, pc.nextSibling); else p4.insertBefore(host, p4.firstChild);
    }
    if (!uni) return;
    var row = document.getElementById('lpQuickJumpRow');
    var btns = [].slice.call(uni.children);
    for (var i = 0; i < btns.length; i++) if (row) row.appendChild(btns[i]);   /* 노드 이동 = onclick 보존 */
    uni.style.display = 'none';
  }

  /* ================================================================
     10. 알려진 버그 — 랭크/시험/인사이트 칩이 아무 데도 못 간다
     대상 섹션이 home_tidy 의 접힌 <details> 안에 있어서 scrollIntoView가 먹지 않았다.
     ①대상이 든 탭으로 이동 ②조상 <details> 를 모두 펼침 ③그 다음 스크롤
     ================================================================ */
  function lpScrollToId(id) {
    var el = document.getElementById(id);
    if (!el) { try { toast('아직 준비되지 않았어요'); } catch (e) {} return false; }
    var pg = el.closest ? el.closest('.pg') : null;
    if (pg) { var pi = ['p0', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6'].indexOf(pg.id); if (pi >= 0) { try { go(pi); } catch (e) {} } }
    var p = el.parentNode;
    while (p && p.nodeType === 1) { if (p.tagName === 'DETAILS') p.open = true; p = p.parentNode; }
    setTimeout(function () {
      try { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { el.scrollIntoView(); }
      el.style.transition = 'background .3s';
      var old = el.style.background;
      el.style.background = 'rgba(6,214,160,.20)';
      setTimeout(function () { el.style.background = old || ''; }, 1400);
    }, 120);
    return true;
  }
  window.lpScrollToId = lpScrollToId;

  /* 연령을 바꾸면 홈의 추천·'오늘 더 볼 만한 것'을 다시 그린다.
     안 그러면 유아로 바꿔도 직전 연령 기준으로 뽑힌 항목이 그대로 남는다. */
  function patchTierRerender() {
    if (typeof window.lpApplyAgeTier !== 'function' || window.lpApplyAgeTier._lpRerender) return;
    var orig = window.lpApplyAgeTier;
    var w = function () {
      var r = orig.apply(this, arguments);
      ['renderRecommendations', 'renderHeroBanner', 'renderTodayOne'].forEach(function (fn) {
        try { if (typeof window[fn] === 'function') window[fn](); } catch (e) {}
      });
      /* 연령을 바꾸면 색인(아이/성인 뱅크)이 통째로 갈린다 — 켜져 있는 과목 탭도 다시 그린다 */
      try {
        renderHomeTabs();
        if (homeTab !== REC_KEY) renderHub(homeTab, { host: 'lpHomeSubj', home: true });
      } catch (e) {}
      return r;
    };
    w._lpRerender = 1; window.lpApplyAgeTier = w;
  }

  function patchScrollers() {
    patchTierRerender();
    ['v13ScrollTo', 'v14ScrollTo'].forEach(function (fn) {
      if (typeof window[fn] === 'function' && !window[fn]._lpFix) {
        var sfx = window[fn];
        var w = function (id) { lpScrollToId(id); try { /* 원함수의 효과음만 살린다 */ } catch (e) {} };
        w._lpFix = 1; window[fn] = w;
      }
    });
    if (typeof window.v12ShowPanel === 'function' && !window.v12ShowPanel._lpFix) {
      var w2 = function (panel) { lpScrollToId('v12' + panel + 'Panel'); };
      w2._lpFix = 1; window.v12ShowPanel = w2;
    }
  }

  /* ================================================================
     11. 기존 함수 감싸기 — 게임 끝 / 레슨 끝의 이어서
     ================================================================ */
  var lastGame = null, pendingExternal = false;

  function wrapGame() {
    if (typeof window.oG === 'function' && !window.oG._lpWrap) {
      var o = window.oG;
      var w = function (uu, nn) {
        lastGame = nn;
        var ext = false;
        try { ext = (typeof _3D_GAMES !== 'undefined') && _3D_GAMES.has(uu); } catch (e) {}
        o.call(this, uu, nn);
        if (ext) { pendingExternal = true; }
      };
      w._lpWrap = 1; window.oG = w;
    }
    if (typeof window.cG === 'function' && !window.cG._lpWrap) {
      var c = window.cG;
      var wc = function () {
        c.call(this);
        var it = lastGame ? itemByGameName(lastGame) : null;
        lastGame = null;
        if (!it) return;
        var rel = related(it, { kinds: ['comic', 'video', 'lesson', 'quiz'], max: 6 });
        if (rel.length) setTimeout(function () { nextSheet('이어서', it.t + ' 다음엔 이런 것', rel); }, 320);
      };
      wc._lpWrap = 1; window.cG = wc;
    }
    /* 새 탭으로 나가는 3D 게임은 닫기 이벤트가 없다 → 돌아왔을 때 한 번만 */
    window.addEventListener('focus', function () {
      if (!pendingExternal) return;
      pendingExternal = false;
      var it = lastGame ? itemByGameName(lastGame) : null; lastGame = null;
      if (!it) return;
      var rel = related(it, { kinds: ['comic', 'video', 'lesson', 'quiz'], max: 6 });
      if (rel.length) setTimeout(function () { nextSheet('이어서', it.t + ' 다음엔 이런 것', rel); }, 600);
    });
  }

  function wrapLesson() {
    if (typeof window.openLesson !== 'function' || window.openLesson._lpWrap) return;
    var o = window.openLesson;
    var w = function (ui, li) {
      o.call(this, ui, li);
      try { appendPlayNext(); } catch (e) {}
    };
    w._lpWrap = 1; window.openLesson = w;
  }

  function appendPlayNext() {
    var host = document.getElementById('lessonContent'); if (!host) return;
    var title = (document.getElementById('lessonTitle') || {}).textContent || '';
    if (!title) return;
    var a = idx().items, it = null;
    for (var i = 0; i < a.length; i++) if ((a[i].kind === 'lesson' || a[i].kind === 'comic' || a[i].kind === 'video') && a[i].t === title) { it = a[i]; break; }
    if (!it) {   /* 커리큘럼 마스터가 아직 안 왔거나 이름이 조금 다르면 과목만이라도 잡는다 */
      var sn = ((document.getElementById('unitTitle') || {}).textContent || '').trim();
      for (var j = 0; j < a.length; j++) if (a[j].kind === 'game' && sn && sn.indexOf(SB[a[j].s].nm) >= 0) { it = a[j]; break; }
    }
    if (!it) return;
    var rel = related(it, { kinds: ['game', 'sim'], max: 4 });
    if (!rel.length) return;
    var box = document.createElement('div');
    box.id = 'lpPlayNext';
    box.innerHTML = '<div class="sec lp-zh">' + svg('i-play') + ' 이걸로 놀아보기</div>'
      + '<div style="font-size:11px;color:var(--t3);margin:-4px 0 6px">방금 배운 것과 이어지는 게임이에요</div>'
      + '<div class="g2">' + rel.map(gameCard).join('') + '</div>';
    host.appendChild(box);
  }

  /* ================================================================
     12. 커버리지 보고 (검증용)
     ================================================================ */
  window.lpIaCoverage = function () {
    var I = idx(), rows = [];
    SUBJ.forEach(function (s) {
      var c = { video: 0, comic: 0, lesson: 0, game: 0, sim: 0, quiz: 0 };
      (I.by[s.k] || []).forEach(function (it) { c[it.kind]++; });
      rows.push({ key: s.k, nm: s.nm, video: c.video, comic: c.comic, lesson: c.lesson,
        game: c.game, sim: c.sim, quiz: c.quiz, total: (I.by[s.k] || []).length });
    });
    var byKind = {};
    I.items.forEach(function (it) { byKind[it.kind] = (byKind[it.kind] || 0) + 1; });
    return { rows: rows, totalItems: I.items.length, byKind: byKind,
      unmapped: UNMAPPED.slice(0, 40), unmappedCount: UNMAPPED.length, cmLoaded: !!window._lpCM };
  };
  window.lpIa = { subjects: SUBJ, index: idx, related: related, openItem: openItem, build: function () { IDX = null; return idx(); } };

  /* ================================================================
     13. 스타일
     ================================================================ */
  function style() {
    if (document.getElementById('lpIaStyle')) return;
    var st = document.createElement('style');
    st.id = 'lpIaStyle';
    st.textContent = [
      /* 하단은 한 줄(nav)만 — 통합 칩 스트립을 '나' 탭으로 옮겼으므로 여백을 되돌린다 */
      '#lpUnifiedNav{display:none!important}',
      '.pg{padding-bottom:calc(var(--nv) + 18px)}',
      '.fab{bottom:calc(var(--nv) + 14px)}',
      '.tutor-fab{bottom:calc(var(--nv) + 70px)}',
      '.tutor-panel{bottom:calc(var(--nv) + 124px)}',
      '.v3-sound-toggle{bottom:calc(var(--nv,52px) + 14px)}',
      '.v4-progress-ring{bottom:calc(var(--nv,52px) + 64px)}',
      '.v3-timer{bottom:calc(var(--nv,52px) + 70px)}',
      /* ===== 홈 상단 과목 탭 스트립 (IPTV 장르바) =====
         .pg 가 스크롤 컨테이너라 sticky top:0 이 패널 최상단에 고정된다.
         헤더(제목·검색·알림)는 스트립보다 위에 있어 함께 스크롤되므로 겹치지 않는다. */
      /* z-index 는 .cat-tabs-wrap(추천 학습 카테고리 줄, sticky top:0 z-index:100)보다 위여야 한다.
         그대로 두면 홈을 내렸을 때 카테고리 줄이 과목 스트립을 덮는다.
         카테고리 줄은 --lp-stabh(스트립 실측 높이)만큼 아래로 내려 두 줄로 쌓는다. */
      '#p0 .cat-tabs-wrap{top:var(--lp-stabh,58px)}',
      '.lp-stab{position:sticky;top:0;z-index:120;display:flex;gap:6px;overflow-x:auto;overflow-y:hidden;'
        + 'background:var(--bg);padding:8px 0 9px;margin:0 0 10px;scrollbar-width:none;'
        + '-webkit-overflow-scrolling:touch;border-bottom:1px solid rgba(139,92,246,.16)}',
      '.lp-stab::-webkit-scrollbar{display:none}',
      '.lp-stab .st{flex:0 0 auto;display:inline-flex;align-items:center;gap:5px;white-space:nowrap;'
        + 'padding:8px 13px;min-height:38px;border-radius:999px;cursor:pointer;font:700 12px/1.1 inherit;'
        + 'border:1.5px solid var(--stb);background:var(--c1);color:var(--tx);'
        + 'transition:background .15s,color .15s,border-color .15s}',
      '.lp-stab .st .ico{width:1em;height:1em;font-size:15px;flex:0 0 auto;color:var(--sc);'
        + 'fill:none;stroke:currentColor;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}',
      '.lp-stab .st.on{background:var(--sc);border-color:var(--sc);color:#fff;box-shadow:0 2px 9px var(--scs)}',
      '.lp-stab .st.on .ico{color:#fff}',
      /* 다크: 진한 액센트는 검정 위에서 선이 안 보인다 → 흰쪽으로 섞은 값 사용 */
      ':root.dark .lp-stab .st .ico{color:var(--scl)}',
      ':root.dark .lp-stab .st.on .ico{color:#fff}',
      /* 유아: 글자·터치 타깃을 키운다. nowrap + flex:0 0 auto 라 줄바꿈·잘림이 없다 */
      ':root[data-age="toddler"] .lp-stab .st{font-size:13.5px;padding:10px 15px;min-height:46px;gap:6px}',
      ':root[data-age="toddler"] .lp-stab .st .ico{font-size:18px}',
      /* 과목 탭이 켜지면 홈의 "추천" 내용(마스코트·오늘의 한 가지·만화선반·일일과제·추천학습·
         home_tidy 접이식 그룹·vN 패치 블록·푸터)을 통째로 접는다. 지우지 않고 감추기만 한다.
         :not() 목록만 남기므로 나중에 붙는 블록도 자동으로 접힌다. */
      '#p0.lp-subjmode > *:not(#lpHomeHdr):not(#lpSubjTabs):not(#lpHomeSubj):not(#srchWrap):not(#srchRes){display:none!important}',
      /* 주 액션 카드 — 화면당 하나. 글자는 전부 #fff(11개 액센트 모두 흰 글씨 4.9:1 이상) */
      '.lp-pact{display:flex;align-items:center;gap:11px;width:100%;text-align:left;padding:13px 14px;'
        + 'margin-bottom:6px;border:none;border-radius:var(--r);background:var(--sc);color:#fff;'
        + 'cursor:pointer;box-shadow:0 3px 12px var(--scs);font-family:inherit}',
      '.lp-pact:active{transform:scale(.99)}',
      '.lp-pai{flex:0 0 auto;width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.22);display:flex;align-items:center;justify-content:center}',
      '.lp-pai .ico{width:1em;height:1em;font-size:20px;fill:none;stroke:#fff;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}',
      '.lp-pax{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:2px}',
      '.lp-pak{font-size:10px;font-weight:700;color:#fff}',
      '.lp-pat{font-size:15px;font-weight:900;color:#fff;line-height:1.25;overflow:hidden;'
        + 'text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}',
      '.lp-pad{font-size:10px;color:#fff;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}',
      '.lp-paa{flex:0 0 auto;display:flex}',
      '.lp-paa .ico{width:1em;height:1em;font-size:22px;fill:none;stroke:#fff;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
      '.lp-pacm{font-size:10px;color:var(--t2);margin:0 2px 10px}',
      ':root[data-age="toddler"] .lp-pat{font-size:17px}',
      ':root[data-age="toddler"] .lp-pak,:root[data-age="toddler"] .lp-pad{font-size:11px}',
      '.lp-allsubj{width:100%;margin-bottom:10px;font-size:12px;padding:9px;display:inline-flex;align-items:center;justify-content:center;gap:6px}',
      '.lp-allsubj .ico{width:1em;height:1em;font-size:15px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
      /* 과목 허브 */
      '.lp-hubhead{display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:var(--r);margin-bottom:8px;border-left:4px solid var(--sc)}',
      '.lp-hubhead .lp-back{font-size:14px;padding:2px 9px;line-height:1.1}',
      '.lp-shi{font-size:22px;display:flex}',
      '.lp-shi .ico{width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
      '.lp-sht{font-size:16px;font-weight:900;color:var(--tx);flex:1;min-width:0}',
      '.lp-shc{font-size:10px;color:var(--t2);background:var(--c1);padding:2px 8px;border-radius:999px}',
      /* home_tidy 의 홈 만화·영상 카드 — 보조 글씨가 라벤더 그라디언트 위에서 4.25:1 로 AA 미달이었다.
         (개편 전부터 있던 위반. 같은 --t2 로 한 단계 어둡게 해 5.1:1 로 올린다) */
      '.lp-hubd,.lp-huba{color:var(--t2)}',
      '.lp-chips{display:flex;gap:5px;overflow-x:auto;padding-bottom:8px;scrollbar-width:none}',
      '.lp-chips::-webkit-scrollbar{display:none}',
      '.lp-chips button{flex:0 0 auto;font-size:10px;padding:5px 10px;display:inline-flex;align-items:center;gap:4px;min-height:30px}',
      '.lp-chips .ico{width:1em;height:1em;font-size:13px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
      '.lp-zh{display:flex;align-items:center;gap:6px}',
      '.lp-zn{margin-left:auto;font-size:10px;font-weight:600;color:var(--t3);background:var(--c2);padding:2px 8px;border-radius:999px}',
      '.lp-list{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}',
      '.lp-row{display:flex;align-items:center;gap:9px;padding:8px 10px;background:var(--c1);border:1px solid rgba(139,92,246,.12);border-radius:var(--r);cursor:pointer;transition:.15s;min-height:52px}',
      '.lp-row:active{transform:scale(.99)}',
      '.lp-row:hover{border-color:var(--p)}',
      '.lp-rth{flex:0 0 auto;width:58px;height:38px;border-radius:8px;object-fit:cover;background:var(--c2)}',
      /* 만화 컷은 세로로 긴 페이지라 위쪽(첫 컷)을 보여준다 */
      '.lp-rthc{object-position:top center}',
      /* 화면 위에 떠서 본문을 가리던 잔여 위젯 정리.
         진도 링은 홈의 '일일 목표' 막대와 같은 정보라 숨기고, 소리 버튼은 하단 바 바로 위로 붙인다. */
      '.v4-progress-ring{display:none!important}',
      '.v3-sound-toggle{bottom:calc(var(--nv) + 10px)!important;left:10px!important;width:34px!important;height:34px!important;opacity:.9}',
      '.lp-rths{display:flex;align-items:center;justify-content:center;font-size:19px}',
      '.lp-rths .ico{width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
      '.lp-rx{flex:1 1 auto;min-width:0}',
      '.lp-rt{font-size:12px;font-weight:700;color:var(--tx);overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:1.35}',
      '.lp-rd{font-size:9px;color:var(--t3);margin-top:3px;display:flex;align-items:center;gap:5px;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}',
      '.lp-kd{font-size:9px;font-weight:700;padding:1px 6px;border-radius:999px;flex:0 0 auto}',
      '.lp-arr{flex:0 0 auto;color:var(--t3);font-size:17px}',
      '.lp-done{flex:0 0 auto;font-size:9px;font-weight:700;color:#fff;background:var(--gn);padding:2px 7px;border-radius:999px}',
      '.lp-more{width:100%;margin-bottom:10px;font-size:11px;padding:8px}',
      '.lp-linkb{position:absolute;top:6px;right:6px;z-index:3;font-size:9px;padding:3px 7px;border-radius:999px;border:1px solid rgba(139,92,246,.3);background:rgba(255,255,255,.92);color:var(--p);cursor:pointer;display:inline-flex;align-items:center;gap:3px;line-height:1}',
      '.lp-linkb .ico{width:1em;height:1em;font-size:11px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}',
      /* 다크에서 --p(#8b5cf6)는 이 칩 배경 위에서 4.28:1 로 AA 미달 → 한 단계 밝은 보라(6.7:1) */
      ':root.dark .lp-linkb{background:rgba(20,20,40,.9);color:#A78BFA;border-color:rgba(167,139,250,.45)}',
      '.lp-simcard .gth{width:100%}',
      '.lp-oldrow{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}',
      '.lp-oldrow button{font-size:11px;padding:8px 11px;display:inline-flex;align-items:center;gap:5px;min-height:38px}',
      '.lp-oldrow .ico{width:1em;height:1em;font-size:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
      '.lp-nsh{font-size:15px;font-weight:900;color:var(--tx);display:flex;align-items:center;gap:6px;margin-bottom:2px}',
      '.lp-nsh .ico{width:1em;height:1em;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
      '.lp-nsd{font-size:11px;color:var(--t3);margin-bottom:10px}',
      /* 지도 */
      '.lp-mapsub{font-size:11px;color:var(--t2);margin:-4px 0 8px;line-height:1.5}',
      '.lp-mapbox{background:var(--c1);border:1px solid rgba(139,92,246,.14);border-radius:var(--r);padding:4px;overflow:hidden}',
      '#lpMapCv{display:block;max-width:100%;touch-action:manipulation}',
      '.lp-maplg{display:flex;flex-wrap:wrap;gap:10px;margin-top:8px;font-size:10px;color:var(--t2)}',
      '.lp-maplg span{display:inline-flex;align-items:center;gap:4px}',
      '.lp-maplg i{width:10px;height:10px;border-radius:50%;display:inline-block}',
      /* 나 탭 빠른 이동 */
      '.lp-qjr{display:flex;flex-wrap:wrap;gap:5px;background:var(--c1);border-radius:var(--r);padding:9px;margin-bottom:8px}',
      '.lp-qjr button{flex:0 0 auto;padding:5px 10px;margin:0;min-height:30px;border:1px solid rgba(139,92,246,.14);border-radius:14px;background:var(--c2);color:var(--t2);font:10px/1.2 inherit;cursor:pointer;display:inline-flex;align-items:center;gap:4px;white-space:nowrap}',
      '.lp-qjr button:hover{border-color:var(--p);color:var(--p)}',
      '.lp-qjr button .ico{width:1em;height:1em;font-size:13px;flex:0 0 auto;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}',
      /* 홈 히어로 축소 */
      '.lp-herosm .hero-title{font-size:12px;margin-bottom:6px}',
      /* 기존 대비 위반 1건 — .hs-card.vid .hs-t 가 #ef4444(3.09:1). 히어로를 접으면서 이 칩이
         첫 화면 상단으로 올라오므로 AA(4.5:1) 를 넘기게 어둡게 잡는다(5.3:1). 다크는 반대로 밝게. */
      '.hs-card.vid .hs-t{color:#B91C1C}',
      ':root.dark .hs-card.vid .hs-t{color:#FCA5A5}'
    ].join('');
    (document.head || document.documentElement).appendChild(st);
  }

  /* ================================================================
     14. 기동
     ================================================================ */
  var cmStarted = false;
  function ensureCM() {
    if (cmStarted || window._lpCM) return;
    cmStarted = true;
    var p = null;
    try { if (typeof loadCurriculumMaster === 'function') p = loadCurriculumMaster(); } catch (e) {}
    if (!p) { try { p = fetch('data/curriculum_master.json').then(function (r) { return r.json(); }); } catch (e) { return; } }
    p.then(function (cm) {
      if (!cm) return;
      window._lpCM = cm; IDX = null;
      if (curHub) renderHub(curHub); else renderSubjectList();
      if (document.getElementById('p6') && document.getElementById('p6').classList.contains('on')) renderMap();
    }).catch(function () {});
  }

  window.lpOnGo = function (i) {
    if (i === 0) {
      renderHomeTabs();
      if (homeTab !== REC_KEY) { renderHub(homeTab, { host: 'lpHomeSubj', home: true }); ensureCM(); }
    }
    if (i === 5) {
      /* 홈 상단 탭이 켜 둔 curHub 는 p5 와 무관하다 — p5 는 자기 host 로 열렸을 때만 복원한다. */
      if (curHub && curHubOpt && curHubOpt.host === 'subjHub') renderHub(curHub, { host: 'subjHub' });
      else {
        var hb = document.getElementById('subjHub'); if (hb) hb.style.display = 'none';
        var sh2 = document.getElementById('subjHome'); if (sh2) sh2.style.display = '';
        renderSubjectList();
      }
      ensureCM();
    }
    if (i === 6) { renderMap(); }
  };

  function boot() {
    style();
    renderHomeTabs();
    renderSubjectList();
    foldHero();
    wrapGame();
    wrapLesson();
    relocateChips();
    patchScrollers();
    /* vN 패치는 defer 로 늦게 붙는다 — 잠깐 지켜보며 계속 흡수/치환 */
    var t0 = Date.now();
    (function poll() {
      relocateChips(); patchScrollers(); foldHero(); wrapGame(); wrapLesson();
      if (Date.now() - t0 < 20000) setTimeout(poll, 500);
    })();
    window.addEventListener('resize', function () {
      var p6 = document.getElementById('p6');
      if (p6 && p6.classList.contains('on')) drawMap();
      measureStrip();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

