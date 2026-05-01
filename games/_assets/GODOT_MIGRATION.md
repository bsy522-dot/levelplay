# Godot 4.6.2 마이그레이션 설계서 (animal-farm.html → Godot)

## 1. 씬 트리 구조

```
res://scenes/Main.tscn (Node)
├── GameState (Node, autoload singleton 후보)
├── World (Node2D)
│   ├── Camera2D (드래그 팬, 픽셀 스냅)
│   ├── Farm (Node2D)
│   │   ├── TileMapLayer (16x16, isometric)
│   │   ├── EntitiesRoot (Node2D, YSort)
│   │   │   ├── AnimalsRoot
│   │   │   ├── CropsRoot
│   │   │   └── BuildingsRoot
│   │   └── WeatherFX (CPUParticles2D × 4: rain/snow/cloud/night)
│   └── SkyBackground (ColorRect + Gradient)
├── UI (CanvasLayer)
│   ├── TopBar: season, day, weather, money, time, speed
│   ├── BottomBar: select/animal/crop/build/market/learn/save
│   ├── Toast (Label + Tween)
│   └── AchievementPopup
├── ModalLayer (CanvasLayer, layer=10)
└── MinigameLayer (CanvasLayer, layer=20)
```

## 2. GDScript 클래스 매핑

| JS 위치 | 책임 | Godot 매핑 |
|---|---|---|
| `G` 전역 state | money/day/season/inventory | `GameState.gd` (autoload) |
| `gameTick()` | 시간/생산/성장 | `GameClock.gd` (Timer 1Hz + speed) |
| `drawGrid` / `isoX/isoY` | 아이소메트릭 렌더 | `TileMapLayer` isometric mode |
| `drawPixelAnimal/drawCropVisual` | 픽셀 캐릭터 | `Animal.tscn`, `Crop.tscn` (Sprite2D + AnimatedSprite2D) |
| `ANIMALS/CROPS/BUILDINGS` | 데이터 | Resource(.tres) 클래스 |
| `placeItem/handleSelect` | 그리드 상호작용 | `PlacementController.gd` |
| `openShop/openMarket/openLearn` | UI 모달 | `ModalManager.gd` + PanelContainer |
| `startMini/miniTick` | 미니게임 | `MinigameBase.gd` 추상 + 서브클래스 |
| `AU` (WebAudio) | 효과음 | `AudioManager.gd` (사인파 또는 OGG) |
| `saveGame/loadGame` | 영속화 | `SaveSystem.gd` (`user://save.json`) |
| `ACHIEVEMENTS` | 업적 | `AchievementSystem.gd` + Resource 배열 |
| `ECO_LESSONS` | 학습 | `EcoLessonDef.gd` Resource |

## 3. 데이터 마이그레이션

**권장: Godot Resource (.tres)**

```
res://data/
├── animals/  (chicken.tres, cow.tres, ...)
├── crops/
├── buildings/
├── lessons/
└── achievements/
```

- `AnimalDef.tres` (12개): name, icon_emoji, sprite_path, cost, feed, product, prod_time, prod_val, lifespan, fact, feed_cost
- `CropDef.tres` (10개): season(enum), grow_time, sell_price, sprite_frames(stage 0-3), fact
- `BuildingDef.tres` (6개): size, effect_type, desc

자동화: 일회용 Python으로 HTML의 객체 리터럴 파싱 → .tres 일괄 생성.

## 4. 렌더 전략

현 규모: 16×16=256 타일, 동물 ~30 / 작물 ~50 / 건물 ~10. MultiMesh 불필요.

| 옵션 | 사용처 |
|---|---|
| `TileMapLayer` (isometric) | 지면 256셀, 시즌별 modulate |
| `Sprite2D` per entity | 동물/건물, YSort 정렬 |
| `AnimatedSprite2D` | 동물 idle, 작물 4단계 성장 |
| `CPUParticles2D` | 비/눈/구름/별 |
| `CanvasModulate` | 밤/낮 톤 |

픽셀 아트: `texture_filter=Nearest`, `stretch/mode=canvas_items`, `aspect=keep`.

## 5. 저장 시스템

```gdscript
# SaveSystem.gd
const SAVE_PATH = "user://save.json"
func save() -> void:
    var f = FileAccess.open(SAVE_PATH, FileAccess.WRITE)
    f.store_string(JSON.stringify(GameState.to_dict()))

func load_save() -> void:
    if not FileAccess.file_exists(SAVE_PATH): return
    var f = FileAccess.open(SAVE_PATH, FileAccess.READ)
    GameState.from_dict(JSON.parse_string(f.get_as_text()))
```

플랫폼별 user:// 자동 매핑 (Windows: %APPDATA%, Android: /data/data/..., HTML5: IndexedDB).

자동 저장: `NOTIFICATION_WM_GO_BACK_REQUEST`, `NOTIFICATION_APPLICATION_PAUSED`.

## 6. 모바일 빌드

### Web (HTML5)
- `html/canvas_resize_policy = 2 (Adaptive)`
- `html/focus_canvas_on_start = true`
- 결과: ~10–15MB gzip
- 호스팅: GitHub Pages, Cloudflare Pages

### Android APK
- `package/unique_name = com.bsy.animalfarm`
- `screen/orientation = 1 (portrait)`
- `permissions/internet = false`
- `architectures/arm64-v8a = true`
- `gradle_build/use_gradle_build = true`
- 사전 준비: Android SDK(D:/AI/06_도구/Android), JDK 17

## 7. 마이그레이션 단계

### 1주차 (15–20h): 골격 + 데이터
- 프로젝트 생성, 폴더 구조
- Resource 클래스 + 28개 .tres (Python 변환)
- Main.tscn 씬 트리
- GameState autoload, GameClock tick
- TileMapLayer 16×16 isometric, 시즌 modulate
- 카메라 드래그 팬
- SaveSystem JSON 스켈레톤

### 2주차 (20–25h): 게임플레이
- Animal/Crop/Building 인스턴싱 + 그리드 배치
- 모달 4종 (Shop/Market/Learn/Detail)
- 작물 4단계 성장, 동물 생산 타이머, 사료비
- 시즌/날씨 + CPUParticles2D
- 업적 8종, Toast/Popup
- 미니게임 3종
- AudioManager

### 3주차 (10–15h): 빌드/QA
- HTML5 export, 5브라우저 테스트
- Android APK, 실기기
- 픽셀 정렬, UI 스케일링
- 성능 60fps 모바일 / WASM 30fps 허용
- 키스토어, AAB, 출시

**총 공수: 45–60시간**

## 8. 리스크와 대안

| 리스크 | 가능성 | 영향 | 완화책 |
|---|---|---|---|
| 이모지 폰트 차이 | 높음 | 중 | NotoColorEmoji 번들 또는 PNG 사전 변환 |
| WASM 번들 ~30MB | 중 | 중 | PWA 캐시, lazy load. 39KB→30MB ROI 의문 |
| 모바일 픽셀 깨짐 | 중 | 낮 | texture_filter=Nearest |
| Web export iOS Safari | 낮 | 높 | 4.6.2 사전 검증 |
| 픽셀 캐릭터 재생성 | 높 | 중 | ComfyUI/Aseprite 외주 |
| 한글 폰트 라이선스 | 낮 | 낮 | Pretendard, Galmuri11 (OFL) |

## ROI 분석

**현재 가치**: 39KB 단일 파일, 즉시 실행, 1초 수정, 모바일 동작.

**Godot 비용**: 45–60시간.

**Godot 이익**:
- Play Store 노출: 제한적
- 60fps 보장: 현재도 충분
- 진짜 사운드: 마이너 개선
- 학습 가치: 높음 (개인 자산)

### 권고

**보류 권장.** 사유:
1. 현 게임은 교육용 사이드 프로젝트, 895줄로 완결성
2. 39KB → 30MB는 모바일 데이터/스토리지 **악화**
3. ROI 불분명 (Play Store 노출 ≈ 0)

### 대안 (추천)

- **PWA 변환 (1–2h)**: manifest.json + 서비스 워커. 홈 화면 설치, 오프라인. **ROI 최고**
- **TWA/Capacitor 래핑 (4–6h)**: HTML 그대로 APK. Play Store 가능, 코드 0수정
- **Godot 이식 조건**: 규모 3–5배 확장, 멀티플레이어, Steam 출시, Godot 학습이 목표일 때만
