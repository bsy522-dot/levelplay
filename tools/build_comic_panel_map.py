# -*- coding: utf-8 -*-
r"""content_library.json 의 <img src="assets/comics/..."> 를 잘라낸 컷 경로로 교체.
   content_library.json 은 build_content_library.py 가 만든 파일이라 '직접 수정하지 말 것'이라
   적혀 있지만, 여기서는 '원본 경로를 그대로 두고' 표시할 때 대체 경로를 쓰도록
   ia_hub.js 쪽에서 경로를 바꾸는 방법을 택한다. 그래야 재생성해도 사라지지 않는다.

   원칙: 원본 JSON·원본 이미지는 한 건도 지우지/바꾸지 않는다.
"""
import json
import os
import re

LIB = r"D:\AI\03_신사업\levelplay\data\content_library.json"
REPORT = r"D:\_output\data\comic_panel_map.json"

def build_map():
    """원본 rel경로 -> 컷 경로 리스트 (분할 리포트가 있으면 사용)"""
    split = r"D:\AI\03_신사업\levelplay\assets\comics_pages\_split_report.json"
    m = {}
    if not os.path.exists(split):
        return m
    for r in json.load(open(split, encoding="utf-8")):
        if "skipped" in r or not r.get("out"):
            continue
        src = r["src"]                                # math_history/s1e01/p1.jpg
        m[src] = ["assets/comics_pages/" + o["file"].replace("p1_c", "p1_c") for o in r["out"]]
    return m

if __name__ == "__main__":
    m = build_map()
    os.makedirs(os.path.dirname(REPORT), exist_ok=True)
    json.dump(m, open(REPORT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("매핑 생성:", len(m), "개 원본 → 컷")
    for k in list(m)[:3]:
        print(f"  {k} → {len(m[k])}컷  {m[k][0]}")
