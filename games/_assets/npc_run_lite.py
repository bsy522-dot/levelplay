# -*- coding: utf-8 -*-
"""npc_run_lite.py — 축소판 (5동물×20 + 작물 10종).
e4b 모델이 느려 600개 풀세트는 비현실. 100개 축소로 마감.
"""
import json, time, sys
from pathlib import Path
from urllib import request as urlreq
from urllib.error import URLError

sys.path.insert(0, str(Path(__file__).parent))
from npc_system import ANIMALS, CROPS, SEASONS, WEATHERS, MOODS, parse_lines

OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
MODEL = "gemma4:e4b-it-q4_K_M"
OUT = Path(__file__).parent / "dialogues.json"

LITE_KEYS = ["chicken", "cow", "pig", "sheep", "duck"]  # 5종
TARGET_PER_ANIMAL = 20


def call(prompt: str, n_predict: int = 250, timeout: int = 240) -> str:
    payload = json.dumps({
        "model": MODEL, "prompt": prompt, "stream": False,
        "options": {"temperature": 0.9, "top_p": 0.95,
                    "num_predict": n_predict, "keep_alive": "15m"},
    }).encode("utf-8")
    req = urlreq.Request(OLLAMA_URL, data=payload,
                         headers={"Content-Type": "application/json"})
    try:
        with urlreq.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode("utf-8")).get("response", "").strip()
    except URLError as e:
        print(f"[ERR] {e}"); return ""
    except TimeoutError:
        print("[ERR] timeout"); return ""


def gen_animal_lite(key, info):
    """5번 호출, 각 4개씩 = 20대사. 계절/기분 변형."""
    name, trait = info["name"], info["trait"]
    out = []
    combos = [
        ("봄", "맑음", "행복"), ("여름", "비", "신남"),
        ("가을", "흐림", "심심"), ("겨울", "눈", "졸림"),
        ("봄", "맑음", "배고픔"),
    ]
    for season, weather, mood in combos:
        if len(out) >= TARGET_PER_ANIMAL: break
        prompt = (
            f"너는 한국 시골 농장의 {trait} {name}이야. "
            f"지금은 {season}, 날씨는 {weather}, 기분은 '{mood}'.\n"
            f"초등학생에게 들려주는 귀여운 대사 4개를 만들어줘.\n"
            f"규칙: 한 줄당 30자 이내, 한국어, 의성어/의태어 환영, "
            f"번호나 불릿 없이 줄바꿈으로만 구분. 따옴표 X."
        )
        t0 = time.time()
        raw = call(prompt, n_predict=300)
        print(f"    [{name}/{season}/{mood}] {round(time.time()-t0,1)}s")
        for ln in parse_lines(raw, 4):
            out.append({"season": season, "weather": weather,
                        "mood": mood, "text": ln})
            if len(out) >= TARGET_PER_ANIMAL: break
    return out[:TARGET_PER_ANIMAL]


def gen_crop_card(key, info):
    name, season = info["name"], info["season"]
    prompt = (
        f"한국의 {season} 작물 '{name}'에 대해 초등학생용 도감 카드를 작성해줘.\n"
        f"형식 (각 항목 한 줄, 50자 이내):\n"
        f"재배팁: ...\n영양: ...\n역사: ...\n잡지식: ...\n"
        f"규칙: 한국어, 친근한 어투, 이모지 X."
    )
    t0 = time.time()
    raw = call(prompt, n_predict=300)
    print(f"    [{name}] {round(time.time()-t0,1)}s")
    card = {"name": name, "season": season,
            "tip": "", "nutrition": "", "history": "", "trivia": ""}
    fmap = {"재배팁": "tip", "영양": "nutrition",
            "역사": "history", "잡지식": "trivia"}
    for ln in raw.splitlines():
        ln = ln.strip().lstrip("-•*").strip()
        for k, v in fmap.items():
            if ln.startswith(k):
                txt = ln.split(":", 1)[-1].strip()
                if len(txt) > 60: txt = txt[:60]
                card[v] = txt; break
    return card


def main():
    print(f"[NPC-LITE] 모델 {MODEL}, 5동물×20대사 + 10작물 도감")
    t_start = time.time()
    res = {
        "version": "1.0-lite", "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "model": MODEL, "mode": "lite",
        "animals": {}, "crops": {},
    }
    for key in LITE_KEYS:
        print(f"  - 동물 [{ANIMALS[key]['name']}]")
        res["animals"][key] = gen_animal_lite(key, ANIMALS[key])
    # 나머지 7동물은 폴백 데이터로 채움 (있으면)
    fb_path = Path(__file__).parent / "dialogue_fallback.json"
    if fb_path.exists():
        fb = json.loads(fb_path.read_text(encoding="utf-8"))
        for k in ANIMALS:
            if k not in res["animals"] and k in fb.get("animals", {}):
                res["animals"][k] = fb["animals"][k]
                print(f"  - 동물 [{ANIMALS[k]['name']}] 폴백 사용")
    for key, info in CROPS.items():
        print(f"  - 작물 [{info['name']}]")
        res["crops"][key] = gen_crop_card(key, info)
    OUT.write_text(json.dumps(res, ensure_ascii=False, indent=2),
                   encoding="utf-8")
    print(f"[NPC-LITE] 완료 → {OUT} ({round(time.time()-t_start,1)}s)")


if __name__ == "__main__":
    main()
