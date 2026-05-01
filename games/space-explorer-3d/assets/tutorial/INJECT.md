# 우주탐험 튜토리얼 — 주입 가이드

PRISM Studio UX팀 산출물. 메인 HTML(`space-explorer-3d.html`)에 단 두 줄만 추가하면 됩니다.

## 추가할 위치

`space-explorer-3d.html` 파일의 **맨 마지막 `</body>` 태그 직전**에 아래 두 줄을 추가하세요.

## 추가할 코드

```html
<link rel="stylesheet" href="assets/tutorial/tutorial.css">
<script defer src="assets/tutorial/tutorial.js"></script>
```

## Before / After 예시

### Before

```html
    ...게임 마지막 스크립트...
  </script>
</body>
</html>
```

### After

```html
    ...게임 마지막 스크립트...
  </script>
  <link rel="stylesheet" href="assets/tutorial/tutorial.css">
  <script defer src="assets/tutorial/tutorial.js"></script>
</body>
</html>
```

> 메인 HTML 안의 다른 어떤 라인도 수정할 필요가 없습니다. (충돌 방지)

## 동작

- 첫 방문자: `localStorage` 키 `space-explorer-tutorial-done` 미존재 시 자동으로 5단계 튜토리얼 시작
- 우상단의 동그란 **`?`** 버튼으로 언제든 재실행 가능
- [건너뛰기] / [완료] 클릭 시 `done` 플래그 저장, 이후 재방문에서는 자동 표시 안 함

## 5단계 흐름

| 단계 | 화면 | 진행 트리거 |
|------|------|--------------|
| 1. 환영 카드 | 중앙 카드 + [시작하기]/[건너뛰기] | [시작하기] 버튼 클릭 |
| 2. 행성 클릭 | 하단 안내 + 위쪽 화살표(애니) | `#planet-info` 패널이 표시되면 자동 |
| 3. 출발하기 | 출발 버튼에 스포트라이트(원형 구멍) | `G.state === 'travel'` 또는 `'explore'` 감지 시 자동 |
| 4. 표면 탐사 | 하단 안내 (이동·채집·연료보급) | `G.samples` 값 증가 감지 시 자동 |
| 5. 퀴즈/배지 | 중앙 마무리 카드 + [완료] | [완료] 클릭 → `done` 저장 |

## 기술 메모

- 스크립트는 IIFE. 전역 노출은 `globalThis.SpaceTutorial = { init(), start(), end() }`만
- 컨테이너 `#tutorial-root`는 `pointer-events: none`, 자식 UI만 `auto` → 게임 캔버스 클릭 통과
- 게임 코드 무수정 (DOM 폴링 200ms로 `#planet-info` / `G.state` / `G.samples` 감지)
- `z-index: 9999` (모든 게임 패널보다 위)
- 다크 우주 테마 (배경 `#0a0a1a`, 카드 `rgba(20,30,60,0.95)`, 강조 `#ffd700`)

## 수동 제어 (선택)

브라우저 콘솔이나 디버그용:

```js
SpaceTutorial.start();   // 강제 재시작
SpaceTutorial.end();     // 즉시 종료 + done 저장
localStorage.removeItem('space-explorer-tutorial-done'); // 다음 새로고침에서 자동 표시
```

## 파일 목록

- `assets/tutorial/tutorial.css` — 스타일 (다크 우주 테마, 애니메이션, 모바일 반응형)
- `assets/tutorial/tutorial.js` — 로직 (IIFE, 폴링 기반 단계 진행)
- `assets/tutorial/INJECT.md` — 본 문서
