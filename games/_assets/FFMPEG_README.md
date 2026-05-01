# 동물농장 FFmpeg 영상 파이프라인

게임용 영상/애니메이션 자산을 ffmpeg로 자동 생성하는 스크립트 모음.

## 사전 준비

- **ffmpeg**: `winget install Gyan.FFmpeg` (PATH 자동 등록)
- **Python 3.8+**: 스프라이트/계절 스크립트용
- **Pillow**: `pip install Pillow` (스프라이트 슬라이싱용)

설치 확인:
```bash
ffmpeg -version
python --version
```

## 출력 위치

모든 결과물은 다음 폴더에 저장된다.
```
D:/AI/04_게임/동물농장/_assets/videos/
```

## 1. 스프라이트시트 → 애니메이션 WebP

**파일**: `sprite_to_webp.py`
**용도**: 가로 N프레임 PNG 스프라이트를 게임용 가벼운 애니메이션 WebP로 변환.

### 입력 가이드
- 형식: PNG (투명 배경 권장)
- 배치: 가로 1행, N프레임이 균등 폭으로 나열
- 시트폭이 프레임수로 정확히 나눠지는 것 권장 (예: 8프레임이면 폭 = 8의 배수)

### 사용법
```bash
# 기본 (10fps, 품질 80, 무한루프)
python sprite_to_webp.py sprites/cow_walk.png 8

# 옵션
python sprite_to_webp.py sprites/pig_idle.png 4 --fps 12 --quality 75 --loop 0
python sprite_to_webp.py sprites/dog.png 6 --output videos/dog_anim.webp
```

### 옵션
| 옵션 | 기본값 | 설명 |
|------|-------|------|
| `--fps` | 10 | 프레임레이트 |
| `--quality` | 80 | 0-100 (높을수록 큼/선명) |
| `--loop` | 0 | 0=무한, N=N회 |
| `--output` | `videos/<input>.webp` | 출력 경로 |

## 2. 인트로 영상 (5초 1080p MP4)

**파일**: `make_intro.bat`
**용도**: 정지 배경 + 한국어/영문 타이틀 페이드 인/아웃 + BGM → MP4.

### 입력 가이드
- **`intro_bg.png`** (필수): 1920×1080 PNG. `_assets/` 폴더에 둔다.
  비율이 다르면 자동 leterboxed (검은 패딩).
- **`intro_bgm.mp3`** (선택): MP3 또는 WAV. 5초 이상 권장. 없으면 무음.

기본 텍스트는 배치 파일 내부 `TITLE_TEXT="동물농장"`, `SUBTITLE_TEXT="Animal Farm"` 변수로 수정.
폰트는 `C:/Windows/Fonts/malgun.ttf` (맑은 고딕) 사용.

### 사용법
```bat
REM 기본 입력 (intro_bg.png + intro_bgm.mp3)
make_intro.bat

REM 커스텀 입력 경로
make_intro.bat my_background.png my_track.mp3
```

출력: `videos/intro.mp4` (5초, H.264, AAC, faststart)

## 3. 계절 전환 컷씬 4종

**파일**: `make_season_transitions.py`
**용도**: 봄/여름/가을/겨울 각 3초 컷씬. 베이스 → 계절 이미지 페이드 + 색감 그레이딩.

### 입력 가이드
`_assets/seasons/` 폴더에 다음 파일을 둔다 (PNG/JPG/WEBP 모두 가능):
```
seasons/farm_base.png   (필수, 페이드 시작 프레임 — 농장 기본 모습)
seasons/spring.png      (봄)
seasons/summer.png      (여름)
seasons/autumn.png      (가을)
seasons/winter.png      (겨울)
```
권장 해상도: 1920×1080. 비율이 다르면 자동 letterbox.

### 색감 그레이딩 사양
| 계절 | 톤 | 채도 | 핵심 효과 |
|------|----|------|----------|
| 봄 | 따뜻함, 약간 밝음 | +20% | 그린 시프트 (콜로어 +g) |
| 여름 | 강렬, 뜨거움 | +30% | 블루 빠지고 옐로 강조 |
| 가을 | 노을, 따뜻함 | +10% | 레드/오렌지 강조, 블루 -20% |
| 겨울 | 차가움, 데사추레이션 | -25% | 블루 +18%, 레드 빠짐 |

### 사용법
```bash
# 4계절 모두
python make_season_transitions.py

# 특정 계절만
python make_season_transitions.py spring autumn

# 길이/페이드 조정 (기본 3초, 페이드 1초)
python make_season_transitions.py --duration 5 --fade 1.5

# 베이스 이미지 변경
python make_season_transitions.py --base custom_base.png
```

출력: `videos/season_spring.mp4`, `season_summer.mp4`, `season_autumn.mp4`, `season_winter.mp4`

## 폴더 구조

```
_assets/
├── FFMPEG_README.md            (이 파일)
├── sprite_to_webp.py           (1번 스크립트)
├── make_intro.bat              (2번 스크립트)
├── make_season_transitions.py  (3번 스크립트)
├── intro_bg.png                (입력: 인트로 배경)
├── intro_bgm.mp3               (입력: 인트로 BGM)
├── sprites/                    (입력: 스프라이트시트들)
│   └── cow_walk.png
├── seasons/                    (입력: 계절 이미지들)
│   ├── farm_base.png
│   ├── spring.png
│   ├── summer.png
│   ├── autumn.png
│   └── winter.png
└── videos/                     (출력)
    ├── cow_walk.webp
    ├── intro.mp4
    └── season_*.mp4
```

## 트러블슈팅

- **`ffmpeg not found`**: PATH 미등록. `winget install Gyan.FFmpeg` 후 새 터미널.
- **한글 폰트 깨짐 (인트로)**: `make_intro.bat` 의 `FONT` 경로 확인.
  Windows 11 기본 경로는 `C:/Windows/Fonts/malgun.ttf`.
- **WebP 색이 어두움**: `--quality 90` 으로 올리거나 `-lossless 1` 로 변경.
- **시트폭 경고**: 프레임수가 시트폭의 약수가 아닐 때. 시트를 정확히 자르거나 프레임수 조정.
- **계절 페이드가 너무 빠름**: `--fade 2.0 --duration 5.0` 등으로 길게.

## 게임 통합 메모

- WebP는 모던 브라우저(Chrome/Edge/Safari 16+)에서 `<img>`로 바로 재생 가능.
- MP4는 `<video autoplay muted playsinline>` 권장 (자동재생 정책 회피).
- 컷씬 후 게임 복귀 시 마지막 프레임을 정지 이미지로 캐싱하면 깜빡임 방지.
