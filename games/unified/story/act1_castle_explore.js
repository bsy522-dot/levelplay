// ============================================================
// UNIFIED v4 - ACT1 성 내부 탐험 (영화 정사 반영)
// ------------------------------------------------------------
// 흐름:
//   1) 로미 방 기상 (짧은 대사)
//   2) v3_map 전환 → castle_interior_v4
//   3) NPC 말걸기로 각 이벤트 진행
//      - 왕(아빠): 생일 축하 + 짝꿍 정하라 (스토리 시작)
//      - 꽁꽁핑: 눈 폭설 → dodge 미니게임
//      - 부끄핑/딱풀핑: 인사 + 호감도 +1
//      - 전설서: 하츄핑 발견 + "처음 본 순간"
//      - (책 읽기 후) 왕에게 다시 말걸기 → 반대 이벤트
//      - 할머니: 비밀 응원 → 성 탈출 결의
// ------------------------------------------------------------
// STATE.storyFlags에 다음 플래그를 사용:
//   met_king, met_book, met_grandma, met_bukku, met_ddalpul, kkong_cleared
//   phase = 'explore' | 'after_book' | 'after_reject' | 'escape_ready'
// ============================================================
(function(){
  'use strict';

  const A_ROMI    = { id:'romi',    name:'로미',    side:'right' };
  const A_KING    = { id:'king',    name:'왕',      side:'left'  };
  const A_QUEEN   = { id:'queen',   name:'왕비',    side:'left'  };
  const A_GRANDMA = { id:'grandma', name:'할머니',  side:'left'  };
  const A_KKONG   = { id:'kkong',   name:'꽁꽁핑',  side:'left'  };
  const A_BUKKU   = { id:'bukku',   name:'부끄핑',  side:'left'  };
  const A_DDAL    = { id:'ddal',    name:'딱풀핑',  side:'left'  };

  // 전역 STATE 헬퍼
  function SF(){
    window.STATE = window.STATE || {};
    window.STATE.storyFlags = window.STATE.storyFlags || {};
    return window.STATE.storyFlags;
  }
  function setFlag(k, v){ SF()[k] = v; }
  function hasFlag(k){ return !!SF()[k]; }

  // ============================================================
  // 1. 로미 방 기상 (타이틀 → 새 모험 클릭 시 시작)
  // ============================================================
  const wakeScenes = [
    {
      id:'wake_s1',
      location:'romi_bedroom',
      bg:'bg_castle',
      actors:[ A_ROMI ],
      dialog:[
        { who:'narration', text:'이모션 왕국의 성.\n오늘은 로미 공주의 10살 생일이다.' },
        { who:'narration', text:'10살 — 자신의 짝꿍 티니핑을 정해야 하는 날.' },
        { who:'romi', text:'(눈 비비며)\n…드디어 10살이다.' },
        { who:'romi', text:'내 짝꿍은… 누구일까?\n빨리 만나보고 싶어.' },
        { who:'narration', text:'로미는 옷을 갈아입고 방을 나섰다.\n아빠부터 뵈러 가야지.' }
      ]
    }
  ];

  // ============================================================
  // 2. 왕(아빠) 첫 대면 — 생일 축하 + 짝꿍 선택 독려
  // ============================================================
  const kingFirstScenes = [
    {
      id:'king_first',
      location:'throne_room',
      bg:'bg_castle',
      actors:[ A_ROMI, A_KING, A_QUEEN ],
      dialog:[
        { who:'king',  text:'로미야! 우리 공주님,\n드디어 10살이 되었구나.' },
        { who:'queen', text:'축하해, 우리 아가.\n이제 네 짝꿍 티니핑을 만날 수 있겠네.' },
        { who:'king',  text:'성 안에 있는 착한 티니핑들 중에서\n마음 가는 아이를 골라 보려무나.' },
        { who:'romi',  text:'(눈 반짝이며)\n네! 둘러보고 올게요!' },
        { who:'king',  text:'다만… 성 밖으로는 절대 나가지 말거라.\n요즘 바깥이 영 심상치 않으니.' },
        { who:'queen', text:'(살짝 어두워지며)\n라미엔느 쪽 소식은… 그냥 무시하렴.' },
        { who:'romi',  text:'(갸웃)\n라미엔느…?' },
        { who:'king',  text:'신경 쓰지 말거라.\n자, 탐험 잘 하고 오렴!' }
      ]
    }
  ];

  // ============================================================
  // 3-A. 부끄핑
  // ============================================================
  const bukkuScenes = [
    {
      id:'bukku_meet',
      location:'castle_hall',
      bg:'bg_castle',
      actors:[ A_ROMI, A_BUKKU ],
      dialog:[
        { who:'bukku', text:'(기둥 뒤에서 살짝)\n…로, 로미 공주님…' },
        { who:'romi',  text:'어머, 부끄핑이야?\n왜 숨어 있어?' },
        { who:'bukku', text:'마, 말 걸어도… 돼요…?\n저 같은 애한테…' },
        { who:'romi',  text:'(웃으며)\n당연하지! 반가워, 부끄핑.' },
        { who:'bukku', text:'(얼굴 빨개지며)\n…감사해요…로미님은 착해요…' }
      ],
      choices:[
        { text:'🤗 꼭 안아주기',  affection:2, flag:'bukku_hug' },
        { text:'😊 머리 쓰다듬기', affection:1, flag:'bukku_pat' }
      ],
      affectionKey:'bukku_aff'
    }
  ];

  // ============================================================
  // 3-B. 딱풀핑
  // ============================================================
  const ddalScenes = [
    {
      id:'ddal_meet',
      location:'castle_hall',
      bg:'bg_castle',
      actors:[ A_ROMI, A_DDAL ],
      dialog:[
        { who:'ddal', text:'딱! 풀! 딱풀딱풀—!\n(끈적이는 풀칠 소리)' },
        { who:'romi', text:'어? 딱풀핑? 뭐 붙이는 거야?' },
        { who:'ddal', text:'로미 님! 제 풀은 세상에서 제일 끈끈해요!\n뭐든 붙여 드릴게요—' },
        { who:'romi', text:'(킥킥)\n그래, 나중에 하츄핑 마음도 붙여줘.' },
        { who:'ddal', text:'하츄핑? 그게 누구…?\n에잇 모르겠고 딱풀!' }
      ],
      choices:[
        { text:'🩹 딱풀 구경하기',  affection:2, flag:'ddal_watch' },
        { text:'👋 인사만 하기',    affection:1, flag:'ddal_wave'  }
      ],
      affectionKey:'ddal_aff'
    }
  ];

  // ============================================================
  // 3-C. 꽁꽁핑 — 눈 폭설 → dodge 트리거
  // ============================================================
  const kkongScenes = [
    {
      id:'kkong_meet',
      location:'castle_hall',
      bg:'bg_castle',
      actors:[ A_ROMI, A_KKONG ],
      dialog:[
        { who:'kkong', text:'로미니임—!\n오늘 기분 좋죠?!' },
        { who:'kkong', text:'기분 좋을 땐 역시 눈이죠!\n(후— 하고 입김)' },
        { who:'narration', text:'…펑!\n성 안에 갑자기 눈보라가 휘몰아쳤다.' },
        { who:'romi',  text:'꽁꽁핑?! 성 안에서 이러면 안 돼!\n피해야겠어—!' }
      ]
    }
  ];

  const kkongAfterDodgeScenes = [
    {
      id:'kkong_after',
      location:'castle_hall',
      bg:'bg_castle',
      actors:[ A_ROMI, A_KKONG ],
      dialog:[
        { who:'kkong', text:'헤헤… 미안해요 로미님.\n저도 모르게 너무 세게 불어버렸어요—' },
        { who:'romi',  text:'다행이다, 꽁꽁핑.\n다음엔 밖에서 해줘, 알았지?' },
        { who:'kkong', text:'네에! 꽁꽁핑 약속할게요!' }
      ]
    }
  ];

  // ============================================================
  // 3-D. 하츄핑 전설서 (도서관 책)
  // ============================================================
  const bookScenes = [
    {
      id:'book_s1',
      location:'library',
      bg:'bg_castle',
      actors:[ A_ROMI ],
      dialog:[
        { who:'narration', text:'로미는 도서관 한 구석에서\n낯선 책 한 권을 발견했다.' },
        { who:'narration', text:'표지에는 「하츄핑 전설서」라 적혀 있었다.' },
        { who:'romi', text:'(책을 조심스레 펼친다)' }
      ]
    },
    {
      id:'book_s2_pop',
      location:'library',
      bg:'bg_castle',
      actors:[ A_ROMI ],
      showHatchuPop:true,   // 씬 엔진이 인지하면 특수 연출
      dialog:[
        { who:'narration', text:'── 분홍빛이 파앗, 하고 책장에서 피어올랐다.' },
        { who:'narration', text:'한 아이가… 책 밖으로 튀어나왔다!' },
        { who:'romi', text:'…어?\n이 아이…' },
        { who:'narration', text:'분홍빛 심장, 따뜻한 눈빛.\n로미의 심장이 쿵, 하고 뛰었다.' },
        { who:'romi', text:'처음 본 순간이었어.\n이 아이… 내 짝꿍이야.' },
        { who:'narration', text:'책에 적힌 한 문장:\n「하츄핑은 라미엔느 마을에 잠들어 있다.」' },
        { who:'romi', text:'라미엔느… 아빠가 가지 말라던 그곳…' },
        { who:'romi', text:'(주먹을 꽉 쥐며)\n그래도… 가야겠어.' }
      ]
    }
  ];

  // ============================================================
  // 4. 왕에게 다시 말걸기 → 반대 (책 읽은 후)
  // ============================================================
  const kingRejectScenes = [
    {
      id:'king_reject',
      location:'throne_room',
      bg:'bg_castle',
      actors:[ A_ROMI, A_KING, A_QUEEN ],
      dialog:[
        { who:'romi',  text:'아빠, 저 — 제 짝꿍을 찾았어요.\n하츄핑이에요.' },
        { who:'king',  text:'…뭐라고? 하츄핑?' },
        { who:'queen', text:'(놀라며)\n그 아이는… 라미엔느 마을에…' },
        { who:'king',  text:'(일어서며)\n절대 안 된다, 로미!\n라미엔느는 괴물이 지배하는 곳이야!' },
        { who:'king',  text:'트러핑의 저주로 인간과 티니핑의 우정이\n완전히 끊긴 땅이란 말이다!' },
        { who:'romi',  text:'하지만 아빠—\n그 아이가 절 부르고 있는 걸요!' },
        { who:'king',  text:'안 된다!\n당장 방으로 들어가거라.\n다시는 그 이름 꺼내지 마라.' },
        { who:'romi',  text:'…' },
        { who:'narration', text:'로미는 고개를 푹 숙이고 방으로 돌아갔다.\n가슴이 저릿했다.' }
      ]
    }
  ];

  // ============================================================
  // 5. 할머니 비밀 응원 (정원에서)
  // ============================================================
  const grandmaScenes = [
    {
      id:'grandma_support',
      location:'garden',
      bg:'bg_castle',
      actors:[ A_ROMI, A_GRANDMA ],
      dialog:[
        { who:'grandma', text:'로미야— 할미 여기 있단다.\n이리 와 보렴.' },
        { who:'romi',    text:'할머니…\n아빠가 저한테 너무 화내셨어요.' },
        { who:'grandma', text:'알고 있단다.\n네 심장이 하츄핑을 부른 거지?' },
        { who:'romi',    text:'(눈물 그렁)\n…네. 근데 포기해야 할까요?' },
        { who:'grandma', text:'(로미 손을 꼭 잡으며)\n할미는 네 편이야, 로미야.' },
        { who:'grandma', text:'할미가 젊었을 적에도\n꼭 지키고 싶은 아이가 있었단다.' },
        { who:'grandma', text:'짝꿍은 운명이 정해주는 게 아니라,\n네 마음이 정하는 거란다.' },
        { who:'grandma', text:'(목걸이를 건네며)\n이건 우정의 하트링.\n이걸 가지고 가거라.' },
        { who:'romi',    text:'할머니…!' },
        { who:'grandma', text:'오늘 밤이 가장 어두울 때,\n경비병들이 교대하는 틈이 생긴단다.' },
        { who:'grandma', text:'그때 가거라, 로미야.\n할미는… 아무것도 못 본 거로 할게.' },
        { who:'romi',    text:'(할머니를 꼭 안으며)\n고마워요… 정말 고마워요, 할머니.' }
      ]
    }
  ];

  // ============================================================
  // 6. 성 탈출 돌입 컷신 (platformer로 넘어가기 직전)
  // ============================================================
  const escapeIntroScenes = [
    {
      id:'escape_intro',
      location:'romi_bedroom',
      bg:'bg_castle',
      actors:[ A_ROMI ],
      dialog:[
        { who:'narration', text:'— 밤. 교대 시간.' },
        { who:'narration', text:'로미는 할머니가 준 하트링을 꼭 쥐고\n침실 창문을 열었다.' },
        { who:'romi',      text:'기다려, 하츄핑.\n내가 꼭 갈게.' },
        { who:'narration', text:'로미가 창틀에 발을 올렸다 —' }
      ]
    }
  ];

  // ============================================================
  // 진행 라우터 (v3_map NPC 상호작용 → v2_scene 분기)
  // ============================================================
  // 대화 후 현재 위치 유지하기 위해 진입 직전 좌표 저장
  function enterMap(keepPos){
    const saved = keepPos && window.STATE && window.STATE.playerPos;
    const sx = saved && typeof saved.x === 'number' ? saved.x : 11;
    const sy = saved && typeof saved.y === 'number' ? saved.y : 2;
    window.Dispatcher.switchMode('v3_map', {
      mapId: 'castle_interior_v4',
      startX: sx, startY: sy,
      encounterRate: 0,
      onInteractNPC: onNpcTalk
    });
  }

  function playScenes(scenes, onComplete){
    // 씬 진입 직전 로미 위치 스냅샷
    const prev = window.STATE && window.STATE.playerPos
      ? { x: window.STATE.playerPos.x, y: window.STATE.playerPos.y } : null;
    if(prev) window.STATE._savedMapPos = prev;
    // SceneEngine을 쓰기 전 반드시 v2_scene 모드 진입
    if(window.Dispatcher){ window.Dispatcher.switchMode('v2_scene'); }
    window.SceneEngine.start(scenes, function(){
      // 씬 끝나면 다시 성 탐험(v3_map) 복귀 — 이전 위치 유지
      if(onComplete){ onComplete(); }
      else { enterMap(true); }
    });
  }

  // 단일 씬 객체를 바로 재생 (인라인용)
  function playInline(sceneObj){
    playScenes([sceneObj]);
  }

  function onNpcTalk(npc /*, map*/){
    const key = npc.interact;
    switch(key){
      case 'npc_king':
        if(!hasFlag('met_king')){
          setFlag('met_king', true);
          setFlag('phase', 'explore');
          playScenes(kingFirstScenes);
        } else if(hasFlag('read_book') && !hasFlag('king_rejected')){
          setFlag('king_rejected', true);
          setFlag('phase', 'after_reject');
          playScenes(kingRejectScenes);
        } else if(hasFlag('king_rejected')){
          playInline({
            id:'king_silent', location:'throne_room', bg:'bg_castle',
            actors:[A_KING],
            dialog:[{ who:'king', text:'…더 할 얘기 없다. 방으로 가거라.' }]
          });
        } else {
          playInline({
            id:'king_wait', location:'throne_room', bg:'bg_castle',
            actors:[A_KING],
            dialog:[{ who:'king', text:'성 안을 더 둘러보고 오렴, 로미야.' }]
          });
        }
        return;

      case 'npc_queen':
        playInline({
          id:'queen_chat', location:'throne_room', bg:'bg_castle',
          actors:[A_ROMI, A_QUEEN],
          dialog:[
            { who:'queen', text:'로미야, 뭐든 잘 둘러보고 오려무나.' },
            { who:'queen', text:'엄마는 네가 건강하기만 하면 돼.' }
          ]
        });
        return;

      case 'npc_bukku':
        if(!hasFlag('met_bukku')){ setFlag('met_bukku', true); }
        playScenes(bukkuScenes);
        return;

      case 'npc_ddalpul':
        if(!hasFlag('met_ddalpul')){ setFlag('met_ddalpul', true); }
        playScenes(ddalScenes);
        return;

      case 'npc_kkong':
        if(!hasFlag('kkong_cleared')){
          // 꽁꽁핑 대사 먼저 → 끝나면 dodge 모드 전환
          playScenes(kkongScenes, function(){
            const resume = function(){
              setFlag('kkong_cleared', true);
              playScenes(kkongAfterDodgeScenes);
            };
            window.Dispatcher.switchMode('dodge', {
              duration: 30,
              dodgeTarget: 10,
              maxHp: 3,
              onClear: resume,
              onFail:  resume
            });
          });
        } else {
          playScenes(kkongAfterDodgeScenes);
        }
        return;

      case 'npc_book':
        if(!hasFlag('read_book')){
          setFlag('read_book', true);
          setFlag('phase', 'after_book');
          playScenes(bookScenes);
        } else {
          playInline({
            id:'book_reread', location:'library', bg:'bg_castle',
            actors:[A_ROMI],
            dialog:[{ who:'romi', text:'…하츄핑. 기다려 줘.' }]
          });
        }
        return;

      case 'npc_grandma':
        if(hasFlag('king_rejected') && !hasFlag('grandma_supported')){
          setFlag('grandma_supported', true);
          setFlag('phase', 'escape_ready');
          // 할머니 응원 → 탈출 도입 → 플랫포머 (Act2.opts 재사용)
          playScenes(grandmaScenes, function(){
            playScenes(escapeIntroScenes, function(){
              const opts = (window.ACT2 && window.ACT2.opts) || { levels:[], returnTo:'act2_post' };
              window.Dispatcher.switchMode('platformer', opts);
            });
          });
        } else if(!hasFlag('met_king')){
          playInline({
            id:'grandma_hint1', location:'garden', bg:'bg_castle',
            actors:[A_ROMI, A_GRANDMA],
            dialog:[
              { who:'grandma', text:'로미야, 아빠한테 먼저 인사 드렸니?\n왕좌 방에 계실 거야.' },
              { who:'romi',    text:'아, 맞다. 아빠부터 뵈러 갈게요!' }
            ]
          });
        } else if(!hasFlag('read_book')){
          playInline({
            id:'grandma_hint2', location:'garden', bg:'bg_castle',
            actors:[A_ROMI, A_GRANDMA],
            dialog:[
              { who:'grandma', text:'도서관에서 오래된 책을 한 권 봤단다.\n「하츄핑 전설서」라고 적혀 있더구나.' },
              { who:'grandma', text:'네 마음을 이끄는 게 있다면\n그 책을 펼쳐 보렴, 로미야.' },
              { who:'romi',    text:'전설서… 가 볼게요!' }
            ]
          });
        } else if(!hasFlag('king_rejected')){
          playInline({
            id:'grandma_hint3', location:'garden', bg:'bg_castle',
            actors:[A_ROMI, A_GRANDMA],
            dialog:[
              { who:'grandma', text:'책은 펼쳐 봤니?\n그럼 아빠한테 마음을 전해보렴.' },
              { who:'grandma', text:'(넌지시)\n아빠가 반대하셔도… 할미는 네 편이야.' },
              { who:'romi',    text:'네, 아빠한테 얘기해 볼게요.' }
            ]
          });
        } else {
          playScenes(grandmaScenes);
        }
        return;

      default:
        console.log('[ACT1_CASTLE] 미지의 NPC:', key);
        enterMap();
    }
  }

  // dodge 클리어 후 재진입 훅 — dispatcher 쪽에서 returnTo 감시
  window.Act1Castle_afterDodge = function(){
    setFlag('kkong_cleared', true);
    window.SceneEngine.start(kkongAfterDodgeScenes, enterMap);
  };

  // ============================================================
  // Act 진입점
  // ============================================================
  window.ACT1_CASTLE = {
    id: 'act1_castle',
    title: '이모션 왕국의 아침',
    play: function(){
      setFlag('phase', 'wake');
      window.STATE.currentStory = 'act1_castle';
      playScenes(wakeScenes);  // 끝나면 자동으로 enterMap() 으로 복귀
    }
  };

  console.log('[UNIFIED] ACT1_CASTLE 탐험 라우터 로드');
})();
