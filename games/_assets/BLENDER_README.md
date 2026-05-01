# 동물농장 Blender 스프라이트 파이프라인

저폴리 3D 동물 모델을 8방향 스프라이트시트로 자동 변환하는 Blender 헤드리스 파이프라인.

## 환경

- **Blender**: 4.5.9 (`D:\AI\06_도구\Blender\blender-4.5.9-windows-x64\blender.exe`)
- **렌더 엔진**: Eevee Next (Cycles 폴백)
- **외부 의존성**: 없음 (Blender 내장 Python API만 사용)

## 파일 구조

```
_assets/
├── blender_render.py        # 메인 렌더 스크립트
├── run_blender_render.bat   # 헤드리스 실행 배치
├── BLENDER_README.md        # 이 문서
└── blender_sprites/         # 출력 폴더
    ├── cow/
    │   ├── frame_00.png ~ frame_07.png   # 8방향 개별 프레임
    │   └── sheet.png                      # 2048x256 스프라이트시트
    ├── pig/
    └── chicken/
```

## 실행 방법

### 1. 배치 파일 실행 (권장)
```cmd
D:\AI\04_게임\동물농장\_assets\run_blender_render.bat
```
- 더블클릭 또는 cmd에서 실행
- 로그: `blender_render.log`

### 2. 직접 명령
```cmd
"D:\AI\06_도구\Blender\blender-4.5.9-windows-x64\blender.exe" -b -P D:\AI\04_게임\동물농장\_assets\blender_render.py
```

## 렌더 사양

| 항목 | 값 |
|------|-----|
| 프레임 해상도 | 256 x 256 |
| 방향 수 | 8 (45도 간격) |
| 스프라이트시트 | 2048 x 256 (가로 8장) |
| 배경 | 투명 (RGBA) |
| 카메라 거리 | 6.0 / 높이 3.5 |
| 조명 | Sun + Area Fill |

## 동물 정의

`blender_render.py` 상단 `ANIMALS` 딕셔너리에서 수정:

| 동물 | 구성 | 색상 |
|------|------|------|
| cow | 큐브 몸체 + 구체 머리 + 4다리 + 무늬 | 흰색 + 검은 무늬 |
| pig | 큐브 몸체 + 구체 머리 + 4다리 | 핑크 |
| chicken | 큐브 몸체 + 구체 머리 + 2다리 + 부리 | 흰색 + 빨간 부리 |

## 동물 추가

`ANIMALS` 딕셔너리에 항목 추가:
```python
"sheep": {
    "body_color": (0.95, 0.95, 0.9, 1.0),
    "spot_color": (0.2, 0.2, 0.2, 1.0),
    "body_size": (1.4, 0.85, 0.95),
    "head_size": 0.45,
    "leg_count": 4,
},
```

## 게임 통합

생성된 `sheet.png`는 Phaser/Cocos2d/Unity 등에서 8프레임 sprite atlas로 임포트:
- 프레임 폭: 256px, 프레임 높이: 256px
- 인덱스 0 = 정면(+X), 시계 반대방향으로 45도씩

## 트러블슈팅

| 증상 | 해결 |
|------|------|
| `blender.exe not found` | 경로 확인: `D:\AI\06_도구\Blender\blender-4.5.9-windows-x64\` |
| 렌더 에러 | `blender_render.log` 확인 |
| Eevee Next 미지원 | 스크립트가 자동으로 Cycles 폴백 |
| 알파가 검정으로 | `film_transparent=True` 확인 (스크립트 기본값) |

## 다음 단계 (2단계 자산)

1. 실제 렌더 실행 → `sheet.png` 3장 생성
2. 게임 코드에서 스프라이트시트 로드
3. 동물 추가(양/오리/말 등) 시 `ANIMALS` 확장
4. 텍스처 베이킹/노멀맵으로 품질 향상 (선택)
