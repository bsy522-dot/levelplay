// ============================================================
// UNIFIED v4 - 이모션 왕국 성 내부 맵 (Act1 도입부)
// 하나의 통합 홀: 왕좌(위) + 도서관(왼쪽 상단) + 정원(아래) + 로미 침실(오른쪽 상단)
// ------------------------------------------------------------
// 타일 규약 (engine_v3map.js 렌더러 기준):
//   1 = 나무/카펫 바닥 (걸을 수 있음)
//   2 = 벽/기둥 (막힘)
//   5 = 정원 꽃 (걸을 수 있음, 꽃밭)
//   10 = 왕좌 (골드)
//   11 = 포털 (미사용, 한 맵 내부)
// ------------------------------------------------------------
// NPC / 대화 분기:
//   interact 플래그가 있는 NPC는 SceneEngine을 호출하는
//   story_router 쪽 onInteractNPC 라우터가 처리.
// ============================================================
(function(){
  'use strict';

  // 14 × 18 성 내부
  // 0 = 기본 카펫, 2 = 벽, 5 = 꽃밭, 10 = 왕좌
  // (engine_v3map WALK: {0,1,5,6,7,8,9,10,11,12})
  const W_ = 2, F_ = 0, G_ = 5, K_ = 10;

  const tiles = [
    // row 0 - 성 북쪽 벽
    [W_,W_,W_,W_,W_,W_,W_,W_,W_,W_,W_,W_,W_,W_],
    // row 1 - 상단 빈 공간 (자유 이동)
    [W_,F_,F_,F_,F_,F_,F_,F_,F_,F_,F_,F_,F_,W_],
    // row 2 - 도서관 책상(col 2) + 왕좌(col 6,7) + 침실(col 11)
    [W_,F_,F_,F_,F_,F_,K_,K_,F_,F_,F_,F_,F_,W_],
    // row 3 - 중간 이동 공간
    [W_,F_,F_,F_,F_,F_,F_,F_,F_,F_,F_,F_,F_,W_],
    // row 4 - 메인 홀 시작
    [W_,F_,F_,F_,F_,F_,F_,F_,F_,F_,F_,F_,F_,W_],
    // row 5
    [W_,F_,F_,F_,F_,F_,F_,F_,F_,F_,F_,F_,F_,W_],
    // row 6 - 메인 홀 중앙 (탐험 자유 공간)
    [W_,F_,F_,F_,F_,F_,F_,F_,F_,F_,F_,F_,F_,W_],
    // row 7
    [W_,F_,F_,F_,F_,F_,F_,F_,F_,F_,F_,F_,F_,W_],
    // row 8
    [W_,F_,F_,F_,F_,F_,F_,F_,F_,F_,F_,F_,F_,W_],
    // row 9 - 정원 경계
    [W_,F_,F_,F_,F_,F_,F_,F_,F_,F_,F_,F_,F_,W_],
    // row 10 - 정원 시작 (꽃밭)
    [W_,G_,G_,F_,G_,F_,F_,F_,F_,G_,F_,G_,G_,W_],
    // row 11
    [W_,G_,F_,F_,G_,F_,F_,F_,F_,G_,F_,F_,G_,W_],
    // row 12 - 정원 안쪽 (할머니/부끄핑/딱풀핑)
    [W_,G_,F_,F_,F_,F_,F_,F_,F_,F_,F_,F_,G_,W_],
    // row 13
    [W_,G_,G_,F_,G_,F_,F_,F_,F_,G_,F_,G_,G_,W_],
    // row 14 - 정원 남단
    [W_,G_,G_,G_,G_,F_,F_,F_,F_,G_,G_,G_,G_,W_],
    // row 15
    [W_,G_,G_,G_,G_,F_,F_,F_,F_,G_,G_,G_,G_,W_],
    // row 16
    [W_,G_,G_,G_,G_,G_,G_,G_,G_,G_,G_,G_,G_,W_],
    // row 17 - 성 남쪽 벽
    [W_,W_,W_,W_,W_,W_,W_,W_,W_,W_,W_,W_,W_,W_]
  ];

  const map = {
    id: 'castle_interior_v4',
    name: '이모션 왕국 성',
    w: 14,
    h: 18,
    startX: 11,     // 로미 침실에서 시작
    startY: 2,
    tiles: tiles,
    warps: [],      // 성 밖 워프 없음 (플랫포머 전환으로 처리)
    encounters: [], // 야생 조우 없음
    npcs: [
      // ---- 왕 가족 (위쪽 왕좌) ----
      {
        id:'king',  name:'왕',   x:6,  y:2,
        interact:'npc_king',
        dialog:true
      },
      {
        id:'queen', name:'왕비', x:7,  y:2,
        interact:'npc_queen',
        dialog:true
      },

      // ---- 할머니 (정원 중앙) ----
      {
        id:'grandma', name:'할머니', x:7, y:13,
        interact:'npc_grandma',
        dialog:true
      },

      // ---- 티니핑들 (탐험 루트 배치) ----
      {
        id:'bukku', name:'부끄핑', x:3, y:7,
        interact:'npc_bukku',
        dialog:true
      },
      {
        id:'ddalpul', name:'딱풀핑', x:11, y:8,
        sprite:'stk',   // 스프라이트 없어 스티키핑 재활용
        interact:'npc_ddalpul',
        dialog:true
      },
      {
        id:'kkong', name:'꽁꽁핑', x:7, y:6,
        interact:'npc_kkong',
        dialog:true
      },

      // ---- 하츄핑 전설서 (도서관 책상) ----
      {
        id:'book', name:'전설서', x:2, y:3,
        interact:'npc_book',
        dialog:true
      }
    ]
  };

  // V3Map에 등록
  if(window.V3Map && window.V3Map.registerMap){
    window.V3Map.registerMap(map.id, map);
  } else {
    // V3Map 아직 로드 안 된 경우 대비
    window.UNIFIED_MAPS = window.UNIFIED_MAPS || {};
    window.UNIFIED_MAPS[map.id] = map;
  }

  // 외부에서 참조 가능하게
  window.CASTLE_MAP_V4 = map;
  console.log('[UNIFIED] 성 내부 맵 (castle_interior_v4) 로드 — npcs:', map.npcs.length);
})();
