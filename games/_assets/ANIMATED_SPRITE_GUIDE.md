# 8방향 AnimatedSprite 통합 가이드

Blender 헤드리스 렌더로 생성된 8방향 스프라이트시트를 `animal-farm.html`에 통합하는 방법.

## 자산 사양

- 위치: `_assets/blender_sprites/{cow,pig,chicken}/sheet.png`
- 시트 크기: **2048 × 256 (RGBA, PNG)**
- 프레임: **8장 가로 배치**, 각 프레임 256 × 256
- 방향 매핑 (시계방향, 카메라 회전 기준):

| 인덱스 | 각도 | 방향 |
|--------|------|------|
| 0 | 0°   | 동(E) |
| 1 | 45°  | 북동(NE) |
| 2 | 90°  | 북(N) |
| 3 | 135° | 북서(NW) |
| 4 | 180° | 서(W) |
| 5 | 225° | 남서(SW) |
| 6 | 270° | 남(S) |
| 7 | 315° | 남동(SE) |

## 1. 스프라이트시트 로딩

```js
const SHEET_W = 2048, SHEET_H = 256, FRAME = 256, FRAMES = 8;
const sheets = {};
['cow', 'pig', 'chicken'].forEach(name => {
  const img = new Image();
  img.src = `_assets/blender_sprites/${name}/sheet.png`;
  sheets[name] = img;
});
```

## 2. 이동 벡터 → 방향 인덱스 변환

```js
// dx, dy: 동물 이동 속도 벡터 (캔버스 좌표: y는 아래로 증가)
function dirIndex(dx, dy) {
  if (dx === 0 && dy === 0) return 0; // 정지: 마지막 방향 유지 권장
  // atan2: 동(0°)부터 시계반대방향 — 캔버스 y 반전 보정
  const angle = Math.atan2(-dy, dx);            // -π ~ π (동=0, 북=+π/2)
  const deg = (angle * 180 / Math.PI + 360) % 360;
  return Math.round(deg / 45) % 8;              // 0~7
}
```

## 3. drawImage 패턴

```js
function drawAnimal(ctx, animal, x, y, size = 64) {
  const sheet = sheets[animal.type];
  if (!sheet || !sheet.complete) return;
  const dir = dirIndex(animal.vx, animal.vy);   // 0~7
  const sx = dir * FRAME;                       // 0, 256, 512, ..., 1792
  ctx.drawImage(
    sheet,
    sx, 0, FRAME, FRAME,                        // 소스 (sx, 0, 256, 256)
    x - size / 2, y - size / 2, size, size      // 캔버스 (중심 정렬)
  );
}
```

## 4. animal-farm.html 통합 옵션

현재 `animal-farm.html`은 정적 이모지/스프라이트로 동작합니다. 향후 확장 시:

1. 게임 루프 안 동물 렌더 분기에서 `drawAnimal()` 호출
2. 각 동물 객체에 `vx, vy` 추가 (이동 시 갱신)
3. 정지 동물은 마지막 방향 유지 (`animal.lastDir`) 또는 기본 0(동) 사용
4. 폴백: `sheet.complete === false`일 때 기존 이모지/스프라이트 표시

## 5. 디버그 팁

- 시트 미로딩 확인: `sheet.naturalWidth === 2048` 체크
- 방향 시각화: 캔버스에 `dir` 인덱스 텍스트 오버레이
- 알파 누락 시: 캔버스 컨텍스트 `ctx.imageSmoothingEnabled = false` (픽셀 아트 느낌)

## 6. 재생성

```bash
cd D:\AI\04_게임\동물농장\_assets
"D:\AI\06_도구\Blender\blender-4.5.9-windows-x64\blender.exe" -b -P blender_render.py
```

또는 `run_blender_render.bat` 더블클릭. `blender_render.py` 내 `ANIMALS` 딕셔너리에 항목 추가 시 새 동물 자동 렌더.
