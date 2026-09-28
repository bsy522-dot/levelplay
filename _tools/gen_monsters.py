#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
몬스터 사다리 생성기 — levelplay 커리큘럼/퀴즈 → 게임용 몬스터 사다리.

원본(levelplay/data/*.json)은 절대 수정하지 않는다.
읽기 전용으로 소비하고 games/mathbattler/data/monsters.json 을 만든다.

출력 구조:
{
  "meta": {"subjects":["수학","과학"], "generated":"2026-09-28", "source":"levelplay/data"},
  "subjects": {
     "수학": {
        "units": [
           {"name":"수와 연산", "order":0,
            "topics":[
               {"name":"1~10 세기","level":1,"order":0,
                "monster":{"id":"m_math_00_01","name":"…","tier":1,
                           "art":"art/monsters/m_math_00_01.png"},
                "lessons":["…lesson keys…"],
                "quiz":[{"q":..,"a":[..],"c":0,"expl":..}],
                "videos":["…"]}
            ]}
        ]
     }
  }
}

규칙
----
* level 1,2,3,4 → tier 1,2,3,4 (몬스터 난이도 사다리)
* 같은 level 토픽은 curriculum 순서대로 tier 를 그대로 쓰고, 세부 정렬은 order 로
* 한 토픽에 퀴즈가 없으면 fallback 으로 quiz_expanded.json 의 cat/level 로 보충
* "5연속 3단 게이트" 가 배틀 길이와 맞도록 몬스터 HP = 퀴즈 개수 기준
"""
import json
import os
import re
import sys
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
OUT = os.path.join(ROOT, "games", "mathbattler", "data", "monsters.json")

SUBJECTS = ["수학", "과학"]

LEVEL_TIER = {1: 1, 2: 2, 3: 3, 4: 4}

# 도감 순서용 이름 (테마 무중립 — skin.json 이 화면 이름을 바꾼다)
GENERIC = {
    1: ["씨앗", "잎새", "물방울", "돌멩이", "바람결", "물방울결"],
    2: ["불씨", "이끼", "구름껍질", "자갈빛", "안개빛"],
    3: ["불티", "잎문", "천둥구름", "현무암", "번개", "서리"],
    4: ["용기", "번개핵", "심연구름", "별가루", "파도"],
}


def load(name):
    p = os.path.join(DATA, name)
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def strip_html(html):
    if not html:
        return ""
    t = re.sub(r"<[^>]+>", " ", str(html))
    t = t.replace("&nbsp;", " ")
    t = re.sub(r"\s+", " ", t)
    return t.strip()


def slugify(s, n=6):
    s = re.sub(r"[^0-9A-Za-z가-힣]+", "-", str(s)).strip("-")
    return s[:n] if s else "x"


def load_quiz_pool():
    """(cat, level) → 퀴즈 리스트. 새_qu�즈/확장퀴즈 통합."""
    pool = defaultdict(list)
    for fn in ("quiz_expanded.json", "new_quizzes.json"):
        p = os.path.join(DATA, fn)
        if not os.path.exists(p):
            continue
        with open(p, encoding="utf-8") as f:
            items = json.load(f)
        for x in items:
            q = x.get("q")
            a = x.get("a") or []
            c = x.get("c")
            if not q or len(a) < 2 or c is None:
                continue
            cat = x.get("cat", "")
            lvl = x.get("level") or 1
            pool[(cat, lvl)].append({
                "q": q,
                "a": [str(v) for v in a],
                "c": int(c),
                "expl": x.get("explanation", ""),
                "age": x.get("age", ""),
            })
    return pool


def cat_match(sub, unit_name, topic_name):
    """curriculum 토픽 문자열 → quiz_expanded 의 cat 키워드."""
    s = f"{unit_name} {topic_name} {sub}"
    keys = []
    if sub == "수학":
        for k, tags in {
            "덧뺄셈": ["덧셈", "뺄셈", "덧뺄"],
            "곱나눗": ["곱셈", "나눗셈", "곱나", "구구", "배수"],
            "분수소수": ["분수", "소수", "비율", "비례", "문해"],
        }.items():
            if any(t in s for t in tags):
                keys.append("수학-" + k)
    else:
        for k, tags in {
            "물리": ["에너지", "물리", "힘", "운동", "열", "빛", "소리", "전기", "우주", "천체", "행성", "별", "지구", "날씨", "대기"],
            "화학": ["물질", "화학", "원소", "혼합", "질량", "산소", "물질과에너지"],
            "생물": ["동물", "식물", "몸", "세포", "생명", "포도", "인체", "인체", "몸속", "동식물", "포유류", "파충류", "새", "곤충"],
            "상식": ["상식", "일반"],
        }.items():
            if any(t in s for t in tags):
                keys.append("과학-" + k)
    if not keys and sub == "수학":
        return ["수학-덧뺄셈", "수학-곱나눗", "수학-분수소수"]
    if not keys and sub == "과학":
        return ["과학-물리", "과학-화학", "과학-생물", "과학상식"]
    return keys


def tier_order():
    return [1, 2, 3, 4]


def build():
    sys.stdout.reconfigure(encoding="utf-8")
    cur = load("curriculum_master.json")
    kids = cur.get("kids", {})
    pool = load_quiz_pool()

    report = []
    subjects = {}
    claim = set()   # 이미 다른 몬스터에 배정된 문제 — 전역 중복 방지

    for sub in SUBJECTS:
        s = kids.get(sub)
        if not s:
            report.append(f"⚠ 과목 없음: {sub}")
            continue
        units = []
        for ui, unit in enumerate(s.get("units", [])):
            topics = []
            for ti, t in enumerate(unit.get("topics", [])):
                name = t.get("name", f"토픽{ti}")
                lvl = int(t.get("level") or 1)
                tier = LEVEL_TIER.get(lvl, min(4, lvl))

                # --- 퀴즈 수집 ---
                # ① 토픽 내장 문제(전역 선점) ② 카테고리 매칭 보충
                quiz = []
                for q in (t.get("quiz") or []):
                    a = q.get("a") or []
                    c = q.get("c")
                    if not q.get("q") or len(a) < 2 or c is None:
                        continue
                    if q["q"] in claim:
                        continue
                    claim.add(q["q"])
                    quiz.append({
                        "q": q["q"],
                        "a": [str(v) for v in a],
                        "c": int(c),
                        "expl": strip_html(t.get("content", ""))[:160],
                    })

                cats = cat_match(sub, unit.get("name", ""), name)
                # 같은 난이도 → 한 단계 쉬운 것 → 한 단계 어려운 것 순으로 보충.
                # pool 키는 (cat, level) 2튜플이다. 전역 claim 으로 중복을 막는다.
                for want in (tier, max(1, tier - 1), min(4, tier + 1), tier):
                    for cat in cats:
                        for item in pool.get((cat, want), []):
                            if item["q"] in claim:
                                continue
                            claim.add(item["q"])
                            quiz.append(item)
                            if len(quiz) >= 6:
                                break
                        if len(quiz) >= 6:
                            break
                    if len(quiz) >= 6:
                        break
                quiz = quiz[:6]

                # --- 몬스터 ---
                gname = GENERIC[tier][ti % len(GENERIC[tier])]
                # 파일명은 반드시 ASCII (한글 파일명은 배포·웹에서 위험).
                # 과목 2자를 pinyin-free 영문 약어로: 수학=MA 과학=SC
                sabbr = {"수학": "ma", "과학": "sc"}.get(sub, "xx")
                mid = f"m_{sabbr}_{ui:02d}_{ti:02d}"

                topics.append({
                    "name": name,
                    "level": lvl,
                    "tier": tier,
                    "order": ti,
                    "monster": {
                        "id": mid,
                        "name": gname,
                        "art": f"art/monsters/{mid}.png",
                        "hp": len(quiz) or 4,        # HP = 문제 수 (전투가 곧 시험)
                        "hpUnit": "문제",
                    },
                    "lessons": [f"{sub}|{unit.get('name','')}|{name}"],
                    "videoQuery": t.get("videoQuery", ""),
                    "content": t.get("content", ""),
                    "quiz": quiz,
                })
            units.append({
                "name": unit.get("name", f"단원{ui}"),
                "order": ui,
                "topics": topics,
            })
        subjects[sub] = {
            "icon": s.get("icon", ""),
            "ageRange": s.get("ageRange", ""),
            "units": units,
        }
        nq = sum(len(t["quiz"]) for u in units for t in u["topics"])
        nt = sum(len(u["topics"]) for u in units)
        short = [t["name"] for u in units for t in u["topics"] if len(t["quiz"]) < 4]
        report.append(f"{sub}: 단원 {len(units)} · 몬스터 {nt} · 문제 {nq}개"
                      + (f" · ⚠ 문제부족 토픽 {len(short)}: {short[:3]}" if short else " · 전원 4문제 이상"))

    doc = {
        "meta": {
            "subjects": SUBJECTS,
            "generated": "2026-09-28",
            "source": "levelplay/data (curriculum_master.json + quiz_expanded.json + new_quizzes.json)",
            "gate": {"streak": 5, "recentAcc": 0.7, "recentWindow": 10, "minSeen": 3},
        },
        "subjects": subjects,
        "subjectOrder": ["수학", "과학"],
    }

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=1)
    print("\n".join(report))
    print(f"\n→ {OUT}")
    print(f"   크기 {os.path.getsize(OUT)/1024:.1f} KB")
    return 0


if __name__ == "__main__":
    sys.exit(build())
