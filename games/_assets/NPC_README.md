# 동물농장 NPC 대사 시스템 통합 가이드

## 구성

| 파일 | 역할 |
|---|---|
| `npc_system.py` | Ollama로 dialogues.json 생성 (오프라인 1회 실행) |
| `dialogues.json` | 12동물×50대사 + 10작물 도감 (LLM 생성본) |
| `dialogue_fallback.json` | 정적 폴백 (12동물×5 = 60개 + 10작물) |
| `dialogue_loader.js` | 클라이언트 로더, `window.NPC` 노출 |

## 1. 대사 사전 생성 (개발자, 1회)

```bash
# 별도 터미널
ollama serve

# 본 터미널
cd D:/AI/04_게임/동물농장/_assets
python npc_system.py
```

권장 모델: `gemma4:e4b-it-q4_K_M` (10GB, 한국어 자연스러움). 고품질은 `gemma4:26b`.
완료 시 `dialogues.json` 생성 (~1~5분).

## 2. animal-farm.html 에 로더 추가

`<head>` 내 끝부분에 한 줄 추가 (단 한 곳):

```html
<script defer src="_assets/dialogue_loader.js"></script>
```

`defer`로 두면 DOMContentLoaded 시 자동 fetch → `dialogues.json` 실패 시 `dialogue_fallback.json`으로 폴백.

## 3. 동물 클릭 시 대사 표시 통합

대상: `handleSelect(gx, gy)` 내부, 동물 분기 (line 605~619 부근).

기존:
```js
if(cell.type==='animal'){
  const ad=ANIMALS[cell.key];
  let html=`<h2>${ad.icon} ${ad.name}</h2>`;
  html+=`<div class="fact-box">💡 ${ad.fact}</div>`;
  ...
}
```

수정 (NPC 대사 추가):
```js
if(cell.type==='animal'){
  const ad=ANIMALS[cell.key];
  // NPC 동적 대사 (없으면 정적 fact)
  const ctx = { season: G.season, weather: G.weather };
  const line = window.NPC && NPC.ready ? NPC.say(cell.key, ctx) : null;
  let html=`<h2>${ad.icon} ${ad.name}</h2>`;
  if(line){
    html+=`<div class="fact-box" style="background:#fff8dc">💬 "${line}"</div>`;
  }
  html+=`<div class="fact-box">💡 ${ad.fact}</div>`;
  ...
}
```

스프라이트 옆 말풍선이 필요하면 `drawPixelAnimal` 호출부(line 248~283 직후)에서:
```js
// 캔버스 좌표 → DOM 좌표로 변환 후
NPC.bubble(NPC.say('chicken', {season:G.season}), pageX, pageY, document.body);
```

## 4. 작물 도감 강화 (선택)

`handleSelect`의 crop 분기(line 620~)에서:
```js
}else if(cell.type==='crop'){
  const cd=CROPS[cell.key];
  const card = window.NPC ? NPC.cropCard(cell.key) : null;
  ...
  if(card){
    html+=`<div class="fact-box">🌱 재배: ${card.tip}</div>`;
    html+=`<div class="fact-box">🥕 영양: ${card.nutrition}</div>`;
    html+=`<div class="fact-box">📜 역사: ${card.history}</div>`;
  }
}
```

## 5. 오프라인 동작 보장

- `dialogues.json` 부재 시 `dialogue_loader.js`가 자동으로 `dialogue_fallback.json` 로드.
- 둘 다 실패 시 `NPC.say()`가 `null` 반환 → 기존 정적 `ad.fact`만 표시 (게임 정상 동작).
- 즉, **Ollama 없이도 게임은 100% 동작**, 대사 다양성만 줄어듦.

## 6. 갱신 주기

LLM 결과물이 마음에 들지 않으면 `npc_system.py`의 `temperature` (0.9) 또는 모델을 바꿔 재생성. 결과는 항상 `dialogues.json`을 덮어씀.
