# -*- coding: utf-8 -*-
r"""수학 만화 세로컷 = 1024 x ~9800 (1:9.6) — 모바일에서 첫 컷이 안 보인다.

   병석님 지적("만화를 누르면 만화 들어가지는것도 아니고, 뭔가 캐릭터나 그림
   이런게 많이 없는 느낌, 열면 보고싶어져")의 실체.

   실측: assets/comics 에서 50장이 세로 1:9.5, 21장만 정상 비율.
   한국사 만화(gojoseon_e01 등)는 1240x1754 로 정상이었고,
   수학 만화(math_history/s1e01 등)만 1024x9842 = 1:9.6 이었다.
   폭 1024 를 412px 화면에 넣으면 높이가 9,960px 가 되어
   첫 컷을 보려면 화면을 5번 넘게 스크롤해야 한다. 그래서 '열면 보고싶어진다'.

   컷 경계: 왼쪽 4px 테두리(패널 프레임)가 끊기는 지점이 정확한 컷 경계다.
   이미지마다 세로 판(panel)이 정확히 1024px 정사각으로 정확히 나뉘어 있다.

   원본은 건드리지 않는다. 잘라낸 결과는 assets/comics_pages/ 로 따로 만든다.
"""
import json
import os
import sys

import numpy as np
from PIL import Image

ROOT = r"D:\AI\03_신사업\levelplay\assets\comics"
OUTROOT = r"D:\AI\03_신사업\levelplay\assets\comics_pages"

RATIO_MIN = 2.5      # 이 이상 세로면 잘라야 한다
MIN_PANEL = 400       # 컷 하나 최소 높이(짧은 것은 나레이션이라 패널로 치지 않는다)
BORDER_W = 4         # 테두리 두께
BORDER_MAX = 100     # 테두리가 '어두운' 판정 기준
MIN_ASPECT = 0.75    # 패널 폭 대비 높이 최소 (정사각 이상)


def detect_panels(path):
    """패널 세로 구간을 [(y0, y1), ...] 로 돌려준다. 없으면 None."""
    with Image.open(path) as im:
        W, H = im.size
        if H / W < RATIO_MIN:
            return None, (W, H)
        g = np.asarray(im.convert("L"), dtype=np.float32)
    left = g[:, :BORDER_W].mean(axis=1)
    has_border = left < BORDER_MAX
    runs, s = [], None
    for i, b in enumerate(has_border):
        if b and s is None:
            s = i
        elif not b and s is not None:
            runs.append((s, i))
            s = None
    if s is not None:
        runs.append((s, H))
    panels = [(a, b) for a, b in runs
              if (b - a) >= MIN_PANEL and (b - a) >= MIN_ASPECT * W]
    return panels, (W, H)


def split_one(path, outdir, quality=84):
    panels, size = detect_panels(path)
    W, H = size
    rel = os.path.relpath(path, ROOT).replace("\\", "/")
    if not panels:
        return {"src": rel, "size": [W, H], "ratio": round(H / W, 1),
                "skipped": "normal_ratio"}
    base = os.path.splitext(os.path.basename(path))[0]
    out = []
    with Image.open(path) as im:
        for i, (y0, y1) in enumerate(panels, 1):
            crop = im.crop((0, y0, W, y1))
            fp = os.path.join(outdir, f"{base}_c{i}.jpg")
            crop.save(fp, "JPEG", quality=quality, optimize=True)
            out.append({"file": os.path.basename(fp), "y": [y0, y1],
                        "h": y1 - y0, "kb": os.path.getsize(fp) // 1024})
    return {"src": rel, "size": [W, H], "ratio": round(H / W, 1),
            "panels": len(out), "out": out}


def main(dry=False):
    targets = []
    for dp, dn, fn in os.walk(ROOT):
        for f in fn:
            if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                targets.append(os.path.join(dp, f))
    targets.sort()
    rep, nsplit, nskip = [], 0, 0
    for p in targets:
        rel = os.path.relpath(p, ROOT)
        outdir = os.path.join(OUTROOT, os.path.dirname(rel))
        if dry:
            panels, size = detect_panels(p)
            W, H = size
            r = H / W
            rec = {"src": rel.replace("\\", "/"), "size": [W, H], "ratio": round(r, 1),
                   "panels": 0 if not panels else len(panels)}
            (rep.append(rec))
            if panels: nsplit += 1
            else: nskip += 1
            continue
        os.makedirs(outdir, exist_ok=True)
        rec = split_one(p, outdir)
        rep.append(rec)
        if "skipped" in rec: nskip += 1
        else: nsplit += 1
    os.makedirs(OUTROOT, exist_ok=True)
    json.dump(rep, open(os.path.join(OUTROOT, "_split_report.json"), "w",
                        encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"{'DRY ' if dry else ''}분할 대상 {nsplit}장 / 정상(건너뜀) {nskip}장")
    for r in rep:
        if "skipped" in r:
            continue
        if dry:
            print(f"  {r['src']:40s} {r['size'][0]}x{r['size'][1]} (1:{r['ratio']}) → 컷 {r['panels']}개")
        else:
            print(f"  {r['src']:40s} (1:{r['ratio']}) → 컷 {r['panels']}개 "
                  f"({sum(o['kb'] for o in r['out'])}KB)")
    return rep


if __name__ == "__main__":
    main(dry="--dry" in sys.argv)
