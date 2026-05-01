# 동물농장 PWA 아이콘 가이드

PWA 설치 시 홈 화면 / 런처 / 스플래시에 표시되는 아이콘.

## 필요한 파일

이 폴더 (`_assets/icons/`)에 아래 두 PNG를 넣으세요. 파일명은 정확히 일치해야 함 (manifest.json에서 참조).

| 파일명           | 사이즈      | 용도                                              |
| ---------------- | ----------- | ------------------------------------------------- |
| `icon-192.png`   | 192 x 192   | Android 홈 화면, Chrome 즐겨찾기, Apple touch icon|
| `icon-512.png`   | 512 x 512   | Android 스플래시 화면, 고해상도 런처, 앱 스토어   |

## 디자인 요구사항

- **Maskable safe zone**: 중앙 80% 안에 핵심 그래픽 배치 (원형/스쿼클 마스크 대비)
- **여백 (padding)**: 가장자리 ~10% 빈 공간 (잘려도 OK)
- **배경**: 단색 또는 단순 그라디언트 권장 (`#4a7c3f` 농장 그린 톤이 manifest theme_color와 매칭)
- **포맷**: PNG, 알파 투명 가능하나 maskable용은 풀 배경 권장
- **저용량**: 각 50KB 이하 목표 (`pngcrush` / `tinypng.com`로 압축)

## ComfyUI 프롬프트 예시

기존 `_assets/comfyui_pixel_workflow.json` 워크플로우 활용 가능. 프롬프트 예시:

### 192px (홈 화면 아이콘)
```
masterpiece, app icon, korean farm tycoon game logo, cute pixel art cow + chicken + rice paddy,
green meadow background (#4a7c3f), soft sun, rounded square frame, centered composition,
high contrast, flat shading, no text, vibrant, 192x192, mobile app icon style
Negative: text, letters, watermark, signature, low quality, blurry, busy background
```

### 512px (스플래시 / 고해상도)
```
high detail, korean farm tycoon icon, hanok roof + cow + rice + sun, traditional korean
color palette (deep green #2d5a1e, sage #4a7c3f, gold #e8a735), centered, generous safe-zone
padding (~12% margin), maskable PWA icon, professional game logo, no text, 512x512
Negative: text, letters, watermark, cluttered, photorealistic
```

## 빠른 생성 방법 (대체 옵션)

ComfyUI가 무거우면 아래 도구로 즉석 생성:

1. **DALL·E / Midjourney / SDXL Web**: 위 프롬프트 그대로 입력 → 1024x1024 생성 → Photoshop/GIMP/Squoosh로 192/512 리사이즈
2. **ImageMagick CLI** (소스 1개 → 두 사이즈):
   ```bash
   magick source.png -resize 512x512 icon-512.png
   magick source.png -resize 192x192 icon-192.png
   ```
3. **Online**: https://realfavicongenerator.net/ — PWA 아이콘 + maskable 변형 자동 생성
4. **Maskable.app Editor** (https://maskable.app/editor) — 안전영역 가이드라인 시각화

## 검증

- Chrome DevTools → Application → Manifest 탭에서 아이콘 미리보기
- "Identify icons that are likely to be problematic" 경고 0개 목표
- Lighthouse PWA 점수 90+ 가 목표

## 참고

- 미리 만들어둔 스프라이트 (`_assets/blender_sprites/`, `_assets/sprites/`)에서 대표 동물 1마리를 크롭해 배경에 합성하면 빠름.
- 게임 동작은 아이콘 없이도 정상이지만, "설치 가능" 프롬프트는 192/512 둘 다 있어야 활성화됨.
