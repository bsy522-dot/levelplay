# Sprite Inventory — 동물농장 Placeholders

생성: 2026-05-01 / Pillow 64×64 RGBA PNG / 임시 자산 (ComfyUI 본 자산 교체 예정)

## animals/ (12종, 64×64)

| 파일 | 설명 | 주색 |
|------|------|------|
| chicken.png  | 닭     | 크림(255,245,200) + 빨강 볏 |
| cow.png      | 소     | 흰바탕(245,245,245) + 검정 점 |
| pig.png      | 돼지   | 분홍(255,180,200) |
| sheep.png    | 양     | 흰털(250,250,245) + 회색 점 |
| duck.png     | 오리   | 노랑(255,240,180) + 주황 부리 |
| goat.png     | 염소   | 베이지(220,215,200) + 갈색 뿔 |
| dog.png      | 개     | 갈색(200,145,90) |
| cat.png      | 고양이 | 회색(190,190,200) |
| bee.png      | 벌     | 노랑(255,215,0) + 검정 줄무늬 |
| rabbit.png   | 토끼   | 흰색(245,240,235) + 분홍 귀 |
| horse.png    | 말     | 갈색(139,90,43) + 검정 갈기 |
| fish.png     | 물고기 | 파랑(100,180,230) + 주황 지느러미 |

## crops/ (10종 × 4단계 = 256×64 시트)

각 PNG는 가로 256×64 스프라이트시트.
프레임: [0]씨앗 → [1]새싹 → [2]성장 → [3]수확.

| 파일 | 작물 | 열매 색 |
|------|------|---------|
| potato.png      | 감자       | (180,140,90) |
| strawberry.png  | 딸기       | (220,50,70)  |
| lettuce.png     | 상추       | (130,200,100)|
| watermelon.png  | 수박       | (50,150,60)  |
| corn.png        | 옥수수     | (255,220,60) |
| tomato.png      | 토마토     | (230,60,50)  |
| apple.png       | 사과       | (220,40,50)  |
| pear.png        | 배         | (200,220,100)|
| sweetpotato.png | 고구마     | (180,100,140)|
| spinach.png     | 시금치     | (60,130,60)  |

### 사용 예 (Canvas/HTML5)

```js
ctx.drawImage(img, stage * 64, 0, 64, 64, dx, dy, 64, 64);
// stage: 0~3
```

## buildings/ (6종, 64×64)

| 파일 | 건물 | 비고 |
|------|------|------|
| barn.png       | 헛간       | 빨간 지붕 + 갈색 문 |
| silo.png       | 사일로     | 회색 원통 + 돔 지붕 |
| greenhouse.png | 온실       | 유리 격자 + 식물 표시 |
| pond.png       | 연못       | 파란 물 + 수련 |
| market_b.png   | 시장(매장) | 주황 차양 + 진열 상품 |
| windmill.png   | 풍차       | 베이지 기둥 + 4날개 |

## 카운트 요약

- animals: 12 PNG
- crops:   10 PNG (각 4프레임 시트)
- buildings: 6 PNG
- **합계: 28 PNG (작물 프레임 풀어서 58 이미지)**

## 재생성

```bash
cd D:/AI/04_게임/동물농장/_assets
python make_placeholder_sprites.py
```

## 본 자산 교체 시

ComfyUI 워크플로(`comfyui_pixel_workflow.json`)로 픽셀아트 생성 후 동일 경로/파일명으로 덮어쓰기. 게임 코드 수정 불요.
