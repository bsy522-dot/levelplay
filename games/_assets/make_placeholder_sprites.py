"""
Placeholder Sprite Generator for 동물농장
=========================================
Pillow로 64x64 RGBA PNG 스프라이트 32종을 생성한다.
ComfyUI 실제 실행 전 임시 자산. 미적 완성도보다 '동작' 우선.

출력:
- _assets/sprites/animals/{name}.png         (12종, 64x64)
- _assets/sprites/crops/{name}.png           (10종, 256x64 시트, 4단계)
- _assets/sprites/buildings/{name}.png       (6종, 64x64)
"""

from PIL import Image, ImageDraw
from pathlib import Path

BASE = Path(__file__).parent / "sprites"
ANIMALS_DIR = BASE / "animals"
CROPS_DIR = BASE / "crops"
BUILDINGS_DIR = BASE / "buildings"

for d in (ANIMALS_DIR, CROPS_DIR, BUILDINGS_DIR):
    d.mkdir(parents=True, exist_ok=True)

# ============================================================
# 동물 12종: 색감별 둥근 몸체 + 눈 + 다리
# ============================================================
ANIMALS = {
    "chicken":  {"body": (255, 245, 200), "accent": (220, 50, 50),  "leg": (240, 180, 60)},
    "cow":      {"body": (245, 245, 245), "accent": (40, 40, 40),   "leg": (200, 160, 120)},
    "pig":      {"body": (255, 180, 200), "accent": (240, 150, 175), "leg": (220, 140, 165)},
    "sheep":    {"body": (250, 250, 245), "accent": (190, 190, 190), "leg": (60, 50, 40)},
    "duck":     {"body": (255, 240, 180), "accent": (255, 165, 0),  "leg": (255, 140, 0)},
    "goat":     {"body": (220, 215, 200), "accent": (140, 110, 80), "leg": (90, 70, 50)},
    "dog":      {"body": (200, 145, 90),  "accent": (140, 90, 50),  "leg": (100, 70, 40)},
    "cat":      {"body": (190, 190, 200), "accent": (90, 90, 100),  "leg": (70, 70, 80)},
    "bee":      {"body": (255, 215, 0),   "accent": (40, 40, 40),   "leg": (40, 40, 40)},
    "rabbit":   {"body": (245, 240, 235), "accent": (255, 192, 203), "leg": (220, 215, 210)},
    "horse":    {"body": (139, 90, 43),   "accent": (60, 35, 20),   "leg": (40, 25, 15)},
    "fish":     {"body": (100, 180, 230), "accent": (50, 130, 200), "leg": (255, 140, 90)},
}


def draw_animal(name, colors):
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    body = colors["body"]
    accent = colors["accent"]
    leg = colors["leg"]

    # 다리 4개
    d.rectangle([18, 46, 24, 58], fill=leg)
    d.rectangle([28, 46, 34, 58], fill=leg)
    d.rectangle([38, 46, 44, 58], fill=leg)
    d.rectangle([46, 46, 52, 58], fill=leg)

    # 몸통 (둥근 타원)
    d.ellipse([10, 20, 56, 50], fill=body, outline=(0, 0, 0, 200), width=1)

    # 머리
    d.ellipse([4, 14, 28, 38], fill=body, outline=(0, 0, 0, 200), width=1)

    # 액센트(귀/뿔/줄무늬 등) — 동물별 단순 구분
    if name in ("chicken", "duck"):
        # 부리
        d.polygon([(2, 24), (10, 22), (10, 28)], fill=accent)
        # 볏
        d.ellipse([10, 8, 22, 18], fill=accent)
    elif name in ("cow",):
        d.ellipse([14, 26, 22, 34], fill=accent)
        d.ellipse([40, 30, 50, 40], fill=accent)
        # 뿔
        d.polygon([(8, 14), (12, 8), (14, 14)], fill=(180, 150, 100))
        d.polygon([(20, 14), (22, 8), (26, 14)], fill=(180, 150, 100))
    elif name == "pig":
        d.ellipse([6, 22, 14, 30], fill=accent)  # 코
        d.ellipse([4, 12, 12, 20], fill=accent)  # 귀
    elif name == "sheep":
        # 양털 점박이
        for cx, cy in [(20, 22), (32, 24), (44, 22), (28, 32), (40, 32)]:
            d.ellipse([cx-4, cy-4, cx+4, cy+4], fill=accent)
    elif name == "goat":
        # 뿔
        d.polygon([(8, 12), (10, 4), (14, 14)], fill=accent)
        d.polygon([(18, 12), (22, 4), (24, 14)], fill=accent)
    elif name == "dog":
        # 귀
        d.polygon([(4, 14), (6, 4), (14, 16)], fill=accent)
        d.polygon([(24, 14), (22, 4), (16, 16)], fill=accent)
    elif name == "cat":
        # 삼각 귀
        d.polygon([(6, 16), (10, 6), (14, 18)], fill=accent)
        d.polygon([(18, 16), (22, 6), (26, 18)], fill=accent)
    elif name == "bee":
        # 줄무늬
        d.rectangle([16, 28, 50, 32], fill=accent)
        d.rectangle([16, 38, 50, 42], fill=accent)
        # 날개
        d.ellipse([20, 12, 36, 24], fill=(255, 255, 255, 180))
        d.ellipse([30, 12, 46, 24], fill=(255, 255, 255, 180))
    elif name == "rabbit":
        # 긴 귀
        d.ellipse([6, 0, 12, 18], fill=body, outline=(0, 0, 0, 200))
        d.ellipse([18, 0, 24, 18], fill=body, outline=(0, 0, 0, 200))
        d.ellipse([7, 2, 11, 14], fill=accent)
        d.ellipse([19, 2, 23, 14], fill=accent)
    elif name == "horse":
        # 갈기
        d.rectangle([8, 14, 12, 32], fill=accent)
        # 꼬리
        d.rectangle([54, 24, 60, 44], fill=accent)
    elif name == "fish":
        # 어류는 다리 없음 — 다리 영역을 배경으로 덮기
        d.rectangle([16, 46, 54, 58], fill=(0, 0, 0, 0))
        # 꼬리지느러미
        d.polygon([(54, 28), (62, 18), (62, 42)], fill=leg)
        # 몸통 줄무늬
        d.line([(20, 36), (50, 36)], fill=accent, width=2)

    # 눈 (공통)
    d.ellipse([10, 22, 16, 28], fill=(255, 255, 255))
    d.ellipse([12, 24, 15, 27], fill=(0, 0, 0))

    return img


# ============================================================
# 작물 10종: 4단계 성장(씨앗/새싹/성장/수확) → 256x64 시트
# ============================================================
CROPS = {
    "potato":     {"fruit": (180, 140, 90),  "leaf": (90, 140, 70)},
    "strawberry": {"fruit": (220, 50, 70),   "leaf": (70, 150, 70)},
    "lettuce":    {"fruit": (130, 200, 100), "leaf": (90, 170, 80)},
    "watermelon": {"fruit": (50, 150, 60),   "leaf": (90, 170, 80)},
    "corn":       {"fruit": (255, 220, 60),  "leaf": (110, 180, 80)},
    "tomato":     {"fruit": (230, 60, 50),   "leaf": (80, 160, 70)},
    "apple":      {"fruit": (220, 40, 50),   "leaf": (90, 160, 80)},
    "pear":       {"fruit": (200, 220, 100), "leaf": (90, 160, 80)},
    "sweetpotato":{"fruit": (180, 100, 140), "leaf": (90, 150, 80)},
    "spinach":    {"fruit": (60, 130, 60),   "leaf": (80, 160, 70)},
}


def draw_crop_stage(stage, colors):
    """stage 0~3: 씨앗 / 새싹 / 성장 / 수확"""
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    fruit = colors["fruit"]
    leaf = colors["leaf"]

    # 흙 (모든 단계 공통)
    d.ellipse([8, 50, 56, 62], fill=(110, 75, 50))

    if stage == 0:
        # 씨앗 — 작은 점
        d.ellipse([28, 48, 36, 56], fill=(80, 50, 30))
    elif stage == 1:
        # 새싹 — 작은 잎 2장
        d.rectangle([31, 40, 33, 52], fill=(90, 140, 60))
        d.ellipse([24, 36, 34, 46], fill=leaf)
        d.ellipse([30, 36, 40, 46], fill=leaf)
    elif stage == 2:
        # 성장 — 잎 무성
        d.rectangle([31, 30, 33, 52], fill=(80, 130, 60))
        d.ellipse([18, 26, 34, 42], fill=leaf)
        d.ellipse([30, 26, 46, 42], fill=leaf)
        d.ellipse([22, 18, 42, 36], fill=leaf)
    elif stage == 3:
        # 수확 — 열매 표시
        d.rectangle([31, 30, 33, 52], fill=(80, 130, 60))
        d.ellipse([18, 26, 34, 42], fill=leaf)
        d.ellipse([30, 26, 46, 42], fill=leaf)
        # 열매
        d.ellipse([24, 14, 40, 32], fill=fruit, outline=(0, 0, 0, 200))
        # 하이라이트
        d.ellipse([27, 17, 32, 22], fill=(255, 255, 255, 120))

    return img


def draw_crop_sheet(name, colors):
    """가로 256x64 스프라이트시트: 4단계 (64x64 each)"""
    sheet = Image.new("RGBA", (256, 64), (0, 0, 0, 0))
    for i in range(4):
        sheet.paste(draw_crop_stage(i, colors), (i * 64, 0))
    return sheet


# ============================================================
# 건물 6종: 64x64 단순 픽셀 도형
# ============================================================
def draw_barn():
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # 지붕
    d.polygon([(6, 28), (32, 8), (58, 28)], fill=(160, 50, 50), outline=(0, 0, 0))
    # 본체
    d.rectangle([10, 28, 54, 60], fill=(200, 80, 60), outline=(0, 0, 0))
    # 문
    d.rectangle([26, 40, 38, 60], fill=(110, 60, 30), outline=(0, 0, 0))
    # 십자무늬
    d.line([(32, 40), (32, 60)], fill=(255, 230, 200), width=1)
    d.line([(26, 50), (38, 50)], fill=(255, 230, 200), width=1)
    return img


def draw_silo():
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # 본체 원통
    d.rectangle([22, 18, 42, 60], fill=(190, 190, 200), outline=(0, 0, 0))
    # 지붕(돔)
    d.ellipse([20, 8, 44, 28], fill=(120, 130, 150), outline=(0, 0, 0))
    # 띠
    d.line([(22, 30), (42, 30)], fill=(100, 100, 110), width=1)
    d.line([(22, 44), (42, 44)], fill=(100, 100, 110), width=1)
    return img


def draw_greenhouse():
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # 지붕(반투명 유리 느낌)
    d.polygon([(4, 26), (32, 8), (60, 26)], fill=(170, 220, 230), outline=(0, 0, 0))
    # 본체
    d.rectangle([8, 26, 56, 58], fill=(220, 240, 245), outline=(0, 0, 0))
    # 격자
    d.line([(32, 8), (32, 58)], fill=(100, 130, 140), width=1)
    d.line([(8, 36), (56, 36)], fill=(100, 130, 140), width=1)
    d.line([(8, 46), (56, 46)], fill=(100, 130, 140), width=1)
    # 식물
    d.ellipse([14, 38, 24, 50], fill=(80, 170, 80))
    d.ellipse([40, 38, 50, 50], fill=(80, 170, 80))
    return img


def draw_pond():
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # 물
    d.ellipse([6, 18, 58, 56], fill=(80, 160, 220), outline=(40, 90, 160))
    # 잔물결
    d.arc([14, 28, 30, 38], 200, 340, fill=(180, 220, 240), width=1)
    d.arc([34, 30, 50, 40], 200, 340, fill=(180, 220, 240), width=1)
    d.arc([22, 38, 40, 48], 200, 340, fill=(180, 220, 240), width=1)
    # 수련 잎
    d.ellipse([20, 22, 32, 30], fill=(90, 160, 80))
    return img


def draw_market():
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # 차양
    d.polygon([(4, 22), (32, 8), (60, 22)], fill=(240, 180, 60), outline=(0, 0, 0))
    # 차양 줄무늬
    for x in range(8, 60, 8):
        d.line([(x, 22), (x + 4, 14)], fill=(200, 100, 50), width=2)
    # 카운터
    d.rectangle([8, 22, 56, 60], fill=(200, 160, 100), outline=(0, 0, 0))
    # 진열 상품
    d.ellipse([14, 30, 22, 38], fill=(220, 60, 60))
    d.ellipse([28, 30, 36, 38], fill=(255, 220, 60))
    d.ellipse([42, 30, 50, 38], fill=(80, 170, 80))
    return img


def draw_windmill():
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # 기둥
    d.polygon([(24, 60), (40, 60), (36, 24), (28, 24)], fill=(220, 210, 180), outline=(0, 0, 0))
    # 지붕
    d.polygon([(26, 24), (32, 14), (38, 24)], fill=(150, 60, 50), outline=(0, 0, 0))
    # 날개 (4개 십자)
    d.polygon([(32, 24), (10, 22), (10, 28), (32, 26)], fill=(240, 240, 220), outline=(0, 0, 0))
    d.polygon([(32, 24), (54, 22), (54, 28), (32, 26)], fill=(240, 240, 220), outline=(0, 0, 0))
    d.polygon([(32, 24), (30, 4), (34, 4), (32, 24)], fill=(240, 240, 220), outline=(0, 0, 0))
    d.polygon([(32, 24), (30, 44), (34, 44), (32, 24)], fill=(240, 240, 220), outline=(0, 0, 0))
    # 중심
    d.ellipse([30, 22, 36, 28], fill=(80, 80, 80))
    return img


BUILDINGS = {
    "barn": draw_barn,
    "silo": draw_silo,
    "greenhouse": draw_greenhouse,
    "pond": draw_pond,
    "market_b": draw_market,
    "windmill": draw_windmill,
}


# ============================================================
# 메인
# ============================================================
def main():
    count = 0

    # 동물
    for name, colors in ANIMALS.items():
        img = draw_animal(name, colors)
        path = ANIMALS_DIR / f"{name}.png"
        img.save(path)
        count += 1
        print(f"[OK] {path}")

    # 작물
    for name, colors in CROPS.items():
        sheet = draw_crop_sheet(name, colors)
        path = CROPS_DIR / f"{name}.png"
        sheet.save(path)
        count += 1
        print(f"[OK] {path} (256x64 sheet)")

    # 건물
    for name, fn in BUILDINGS.items():
        img = fn()
        path = BUILDINGS_DIR / f"{name}.png"
        img.save(path)
        count += 1
        print(f"[OK] {path}")

    print(f"\n[DONE] {count}/32 sprites generated.")


if __name__ == "__main__":
    main()
