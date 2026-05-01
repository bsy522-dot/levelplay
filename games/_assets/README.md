# 동물농장 픽셀 스프라이트 생성 (ComfyUI)

64×64 픽셀아트 PNG **32종** (동물 12 + 작물 10 + 건물 10) 일괄 생성.

## 모델

`z_image_turbo_bf16.safetensors` (`D:/AI/06_도구/ComfyUI/ComfyUI/models/diffusion_models/`) — SD-Turbo 계열, 8 step / cfg 1.0 으로 빠르게 뽑고, 워크플로우 안에서 `nearest-exact 0.125x` 다운스케일 → 픽셀 룩 확보.

> `models/checkpoints` 가 비어 있으므로, 처음 실행 시 ComfyUI Manager에서 **CheckpointLoaderSimple → ckpt_name** 드롭다운에 `z_image_turbo_bf16.safetensors` 가 보이는지 확인. 안 보이면 `diffusion_models` 의 파일을 `checkpoints` 로 심볼릭/복사.

## 실행 순서

1. ComfyUI 기동
   ```
   D:\AI\06_도구\ComfyUI\run_nvidia_gpu.bat
   ```
   (CPU만 있으면 `run_cpu.bat`. 32장 기준 GPU 1~3분, CPU 30분+)

2. 의존성 (1회만)
   ```
   python -m pip install requests websocket-client
   ```

3. 일괄 생성
   ```
   cd D:\AI\04_게임\동물농장\_assets
   python generate_sprites.py
   ```
   - 카테고리만: `python generate_sprites.py --only animals`
   - 다른 서버: `python generate_sprites.py --server 127.0.0.1:8188`
   - 이미 있는 PNG는 자동 skip → 재실행으로 실패분만 재시도.

## 결과물

```
_assets/sprites/
  animals/    chicken.png cow.png pig.png ...    (12개)
  crops/      potato.png strawberry.png ...      (10개)
  buildings/  barn.png windmill.png ...          (10개)
```

ComfyUI `output/farm/` 에도 원본 512×512 png가 남음 (디버깅용). 원본 불필요시 삭제 가능.

## 파일 구성

| 파일 | 역할 |
|------|------|
| `comfyui_pixel_workflow.json` | ComfyUI API 워크플로우 템플릿. `{POSITIVE} {NEGATIVE} {SEED} {FILENAME_PREFIX}` 4개 placeholder. |
| `generate_sprites.py` | 32종 프롬프트 사전 + ComfyUI `/prompt` POST + `/ws` 대기 + `/view` 다운로드. |

## 프롬프트 수정

`generate_sprites.py` 의 `ANIMALS / CROPS / BUILDINGS` dict 만 손보면 됨. `COMMON_STYLE` 은 모든 항목에 공통 부착되는 픽셀아트 스타일 토큰.

## 트러블슈팅

- **WebSocket timeout**: 모델 첫 로딩 시 60초 이상 걸릴 수 있음. 한 번 워밍업 후 다시 실행.
- **체크포인트 없음 에러**: 위 "모델" 섹션 참고 — `diffusion_models` ↔ `checkpoints` 위치 문제.
- **결과가 흐릿함**: 워크플로우의 `ImageScaleBy.upscale_method` 가 `nearest-exact` 인지 확인 (bilinear 면 픽셀 뭉개짐).
