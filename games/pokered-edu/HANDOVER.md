# 포켓몬 공부 모험 (레드 버전) — 인수인계

> 작성: 2026-09-28 · 목적: 이 문서만 읽고 바로 이어서 개발할 수 있게.
> 개인용(비상업). 포켓몬 소재는 개인 학습용으로만 쓴다.

## 0. 병석님이 정한 것 (다시 묻지 말 것)

| 항목 | 결정 |
|---|---|
| 뼈대 | **포켓몬 레드를 거의 그대로** — 지도·이야기·트레이너·출현표·1세대 전투 규칙 |
| 교육 | **전투 화면에서만.** 기술을 쓸 때마다 4지선다. 맞히면 명중, 틀리면 빗나감 |
| 핵심 | 식만 푸는 게 아니라 **"왜 그런지" 이해**. 틀린 보기 = 실제 오개념 → 오박사가 그 보기를 고른 이유와 정답 이유를 그림과 함께 설명 → 비슷한 문제로 재도전 |
| 관장전 | **상황 문제**(포켓몬 세계 이야기 속 문제) |
| 속도 | 아이마다 다름. 학년 선택 + 오박사 자격 시험으로 시작점 → 3연속 정답이면 주제 익힘·건너뜀 → 연속 정답이면 경험치 최대 2배(빨리 배우면 빨리 끝남) |
| 체육관 | 난이도 순서. 배지 하나마다 한 단계 어려워짐 |
| 과목 | 수학 · 과학 |
| 화면 | 도트 아님. **약간 현대화된 2D**. 무료 재료 + 로컬 그림 AI(Z-Image) |
| 기기 | 폰·태블릿 터치 + PC 키보드 둘 다 |
| 범위 | 최종 목표는 체육관 8개 전부. 1판 = 태초마을~웅 체육관, **2판 = 3번도로·달맞이산·4번도로·블루시티 이슬 체육관 (완료)** |
| 이야기 | **만화처럼 피카츄로 시작**(따라다님), 라이벌은 이브이. 막히지 않게 화면 위 '다음 목표' + 💡힌트 |
| 난이도 | 미취학~미적분 **56단계**. 5연속 정답부터 한 번 맞히면 다음 단계(빠른 상승). 새 주제는 오박사 1분 강의, 오답엔 풀이 순서·'왜 필요할까' (수학 논술식) |
| 배포 | **원허브에 중간중간** — `python _tools/deploy.py` → https://pokered-edu-bsy.pages.dev/ (원허브 칸 id `pokerededu`) |

## 1. 지금 상태 (2026-09-28, 실측)

- 자동 플레이 테스트 `node _tools/playtest.mjs` — **27/27 통과** (PC 1280×760, 폰 412×860 둘 다) + 터치 전용 `touchtest.mjs` 13/13
  - 새 게임 → 자격 시험 → 파이리 → 라이벌 배틀(문제·오답 설명) → 소포 → 도감 → 지도 넘어가기·숲 관문 → 야생 포획 → 숲 트레이너 → 웅 → 회색배지 → 메뉴 → 이어하기
- 문제 점검 `node _tools/test_learn.mjs` — 수학 36주제 × 600문제 + 과학 258문제 **오류 0**
- 지도 18개(바깥 6 + 실내 12), 포켓몬 151마리(도감·그림), 기술 165개, 트레이너 47종 데이터

## 2. 파일 지도

```
games/pokered-edu/
├── index.html            진입점 (Phaser + 화면 위 글자 창 + 터치 패드)
├── css/style.css         모든 글자 창 디자인 (대화·메뉴·문제·전투 HUD·패드)
├── vendor/phaser.min.js  Phaser 4.2.1
├── js/
│   ├── main.js           부팅·타이틀·새 게임(이름/라이벌/학년)
│   ├── data.js           데이터 로드, 지도 목록 MAP_IDS, 지도 이름, 도구 ITEMS
│   ├── state.js          저장 상태 G.s + localStorage 저장
│   ├── input.js          키보드·터치 → up/down/left/right/a/b/menu (스택 방식)
│   ├── ui.js             대화창·선택지·패널·토스트·페이드 (await 가능)
│   ├── audio.js          WebAudio 효과음 + 자체 작곡 배경음 (파일 없음)
│   ├── menus.js          시작 메뉴, 포켓몬, 도감, 가방, 상점, PC 보관함, 공부 기록, 학교 연습, 1차 완료
│   ├── art/world.js      칸 지도 → 현대풍 2D 그림 (잔디·길·풀숲·나무·건물·실내 가구)
│   ├── art/chars.js      사람 캐릭터 17종 (4방향 걷기)
│   ├── world/overworld.js 걷기·문·지도 넘어가기·NPC·트레이너 시선·풀숲 출현
│   ├── world/events.js   ★이야기·대사·표지판·트레이너 대사 (1차 전부 여기)
│   ├── battle/mech.js    1세대 규칙 (능력치·데미지·상성·상태이상·경험치·포획)
│   ├── battle/battle.js  전투 진행 + 연출 (기술 선택 → 문제 → 명중/빗나감)
│   └── learn/
│       ├── math.js       수학 문제 생성기 36주제 (오개념 보기 + 보기별 설명 + 그림)
│       ├── tutor.js      속도 맞춤 엔진 (사다리·익힘·복습·자격 시험·배지)
│       ├── quiz.js       문제 창 (정답/오답 설명/재도전)
│       └── viz.js        설명 그림 24종
├── data/
│   ├── species.json moves.json trainers.json   (build_data.py 로 생성)
│   ├── maps/*.json                              (build_maps.py 로 생성)
│   └── science_a.json science_b.json            과학 258문제 (사람 손으로 다듬는 원본)
├── art/mon/1~151.webp    포켓몬 그림 (256px)
├── art/ai/               Z-Image로 만든 초상화·전투 배경·타이틀
└── _tools/               playtest.mjs, test_learn.mjs, smoke.mjs, dbg.mjs, fetch_sources.py, build_data.py, build_maps.py
```

## 3. 지도는 이렇게 만든다 (원작 그림은 안 씀)

원작 분석 자료(pret/pokered 블록셋 + open-pokered 지도)를 읽어 **칸 종류만** 뽑는다:
`.` 잔디 `,` 흙길 `"` 풀숲 `*` 꽃 `T` 나무 `~` 물 `v<>` 턱 `#` 울타리 `R` 바위절벽 `S` 표지판 `B` 건물 `D` 문/출구 `U` 계단
실내: `_` 바닥 `W` 벽 `K` 책장 `P` 화분 `O` 바위 `Q` 석상 `t` 탁자 `C` 카운터 `M` 기계 `V` TV `b` 침대 `N` 칠판 `m` 매트
그림은 `art/world.js` 가 새로 그린다.

**새 지도 추가 순서**
1. `python _tools/fetch_sources.py <폴더> <지도이름들>` → `python _tools/build_maps.py <폴더>`
2. `js/data.js` 의 `MAP_IDS`, `MAP_NAME` 에 추가
3. 새 실내 타일셋이면 `build_maps.py` 의 `TS`, `INDOOR` 에 칸 이름표 추가 (원작 타일 그림을 띄워 눈으로 확인)
4. 대사·표지판·트레이너는 `js/world/events.js` 의 `LINES` / `SIGNS` / `TRAINER`

## 4. 문제 추가/수정

- 수학: `js/learn/math.js` 의 `MATH` 배열에 `{id, g(학년), t(제목), gen(story)}` 추가. `mc(정답, [{v, why}...], 정답설명, {q, viz, pic, fill})`
  - 틀린 보기는 **실제 오개념을 계산한 값**으로. 숫자 뒤 조사는 `fixJosa` 가 자동으로 고친다.
- 과학: `data/science_*.json` — `{id, topic, q, a[4], c, why, wrong{보기번호: 설명}, story, viz}`
  - 정답 보기가 제일 길지 않게 (지금 16%·12%)
- 고친 뒤 반드시 `node _tools/test_learn.mjs`

## 5. 검증 (고치기 전·후 반드시)

```
python -m http.server 8793 --bind 127.0.0.1      # levelplay 폴더에서
node _tools/playtest.mjs                          # PC
VIEW=phone node _tools/playtest.mjs               # 폰
node _tools/touchtest.mjs                         # 폰 터치만으로 (키보드 없이)
node _tools/test_learn.mjs                        # 문제
node _tools/test_josa.mjs                         # 숫자·이름 뒤 조사
node _tools/ch2test.mjs                           # 2판 (달맞이산·화석·라이벌·이슬)
python _tools/reach.py                            # 집에서 걸어서 모든 목표에 닿는지
node _tools/sim_climb.mjs                         # 난이도가 몇 문제 만에 어디까지 오르나
python _tools/deploy.py                           # 원허브(Cloudflare) 배포
```

> 2026-09-28 독립 검증에서 잡은 것: 투명 전환막이 터치를 막던 문제(키보드 테스트만으론 안 보임 → touchtest 추가), 시간·길이 설명 오류, 너무 어려운 단계에 갇히던 난이도(최근 정답률 40% 미만이면 한 단계 내려감), 새로 시작 시 저장 덮어쓰기 확인.
스크린샷은 `SHOT_DIR` (기본 job tmp) 에 저장된다. **실측 없이 "완료"라고 말하지 말 것.**

## 6. 다음 할 일 (3판~)

1. 블루시티 북쪽 너겟 브릿지(24·25번도로, 이수재) → 5·6번도로 → 갈색시티·상트앙느호 → 마티스 체육관(전기)
2. 새 지도 추가 순서는 3장 참고. 걸어서 닿는지 `python _tools/reach.py`, 판 테스트는 `ch2test.mjs` 를 본떠 `ch3test.mjs`
3. 전투 연출: 기술별 전용 애니메이션, 포켓몬 울음소리
4. 문제: 2차 지역 과학 주제(물의 상태 변화·물의 여행 — 이슬 체육관과 연결)
5. PWA(오프라인), 지도 그림 캐시

## 7. 절대 규칙

1. **교육은 전투에서만.** 걷는 화면에 문제 창을 띄우지 않는다 (학교·칠판처럼 스스로 찾아간 곳은 예외).
2. 틀린 보기는 반드시 **오개념 + 그 보기 전용 설명**. "모르겠어요" 같은 보기 금지.
3. 데이터(`data/`)는 스크립트로 다시 만들 수 있게 — 손으로 고친 건 `science_*.json` 과 `events.js` 뿐.
4. 무거운 그림 AI 작업은 `D:\AI\06_도구\gpu_gate.py` 를 거친다 (원비서 우선).
5. 수정 후 병석님께 켜볼 수 있는 주소를 넘긴다.
