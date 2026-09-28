"""몬스터 이미지 생성 — 46마리 전부. tier별 다른 실루엣/색/크기.
폴백용 _placeholder.png 도 함께 만든다. pillow 필요."""
import json
import math
import os
import sys

from PIL import Image, ImageDraw

sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'art', 'monsters')
os.makedirs(OUT, exist_ok=True)
doc = json.load(open(os.path.join(ROOT, 'data', 'monsters.json'), encoding='utf-8'))

S = 256  # 256x256

# tier 별 (몸통색, 강조색, 실루엣 종류)
TIER = {
    1: {'body': '#7bc96f', 'dark': '#4e9e4a', 'accent': '#ffe066', 'shape': 'blob', 'eye': 1},
    2: {'body': '#5aa9e6', 'dark': '#2f6fa8', 'accent': '#ff9f68', 'shape': 'leaf', 'eye': 1},
    3: {'body': '#a06cd5', 'dark': '#5f3d99', 'accent': '#ff6b9d', 'shape': 'spike', 'eye': 1},
    4: {'body': '#e0503a', 'dark': '#8c1d14', 'accent': '#ffd60a', 'shape': 'spike', 'eye': 2},
}


def draw_monster(c, kind):
    b, d, acc, eye = c['body'], c['dark'], c['accent'], c['eye']
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    dr = ImageDraw.Draw(img)
    cx = S // 2
    # 몸통
    if kind == 'blob':
        dr.ellipse([cx - 70, 110, cx + 70, 250], fill=b, outline=d, width=6)
        dr.ellipse([cx - 45, 70, cx + 45, 150], fill=b, outline=d, width=6)   # 머리
        # 귀/뾰족 2
        dr.polygon([(cx - 40, 80), (cx - 30, 40), (cx - 15, 85)], fill=d)
        dr.polygon([(cx + 40, 80), (cx + 30, 40), (cx + 15, 85)], fill=d)
    elif kind == 'leaf':
        dr.ellipse([cx - 72, 120, cx + 72, 250], fill=b, outline=d, width=6)
        dr.ellipse([cx - 48, 60, cx + 48, 150], fill=b, outline=d, width=6)
        dr.polygon([(cx, 10), (cx - 22, 70), (cx + 22, 70)], fill=acc, outline=d)  # 잎
    else:  # spike
        pts = []
        for k in range(10):
            a = math.pi * 2 * k / 10 - math.pi / 2
            r = 78 if k % 2 == 0 else 58
            pts.append((cx + math.cos(a) * r, 175 + math.sin(a) * r * 0.9))
        dr.polygon(pts, fill=b, outline=d)
        dr.ellipse([cx - 50, 40, cx + 50, 140], fill=b, outline=d, width=6)
        # 위 뿔들
        for dx in (-30, 0, 30):
            dr.polygon([(cx + dx, 60), (cx + dx - 8, 20), (cx + dx + 8, 20)], fill=acc)
    # 눈
    ey = 100 if kind != 'spike' else 95
    for k in (0, 1):
        ex = cx + (1 if k else -1) * 18
        dr.ellipse([ex - 11, ey - 13, ex + 11, ey + 11], fill='white', outline=d, width=4)
        dr.ellipse([ex - 5, ey - 5 + 3, ex + 5, ey + 5 + 3], fill='#222')
    if eye == 2:  # 티어4 추가 눈
        dr.ellipse([cx - 4, ey + 18, cx + 4, ey + 26], fill=d)
    # 입
    dr.arc([cx - 18, ey + 8, cx + 18, ey + 30], 0, 180, fill=d, width=4)
    # 손/발
    dr.ellipse([cx - 90, 190, cx - 50, 240], fill=d)
    dr.ellipse([cx + 50, 190, cx + 90, 240], fill=d)
    return img


def placeholder(c):
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    dr = ImageDraw.Draw(img)
    dr.ellipse([40, 90, 216, 240], fill=(c['dark'] + '88'), outline=c['dark'], width=6)
    dr.ellipse([76, 46, 180, 140], fill=(c['dark'] + '88'), outline=c['dark'], width=6)
    dr.text((96, 150), '?', fill='white')
    return img


made = 0
for sub in doc['subjectOrder']:
    for u in doc['subjects'][sub]['units']:
        for t in u['topics']:
            mid = t['monster']['id']
            c = TIER[t['tier']]
            img = draw_monster(c, c['shape'])
            img.save(os.path.join(OUT, mid + '.png'))
            made += 1
# 폴백
placeholder(TIER[1]).save(os.path.join(OUT, '_placeholder.png'))
print('몬스터 %d장 생성 → %s' % (made, OUT))
print('placeholder 1장 생성')
