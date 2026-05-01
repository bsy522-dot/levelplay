# -*- coding: utf-8 -*-
"""
동물농장 NPC 대사·도감 자동 생성 시스템
Ollama 로컬 LLM (gemma4:e4b-it-q4_K_M 권장) 활용

사용법:
    1. ollama serve  (별도 터미널)
    2. python npc_system.py
    3. 결과 -> _assets/dialogues.json

요구사항: Python 3.8+, requests
"""
import json
import time
import sys
from pathlib import Path
from urllib import request as urlreq
from urllib.error import URLError

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL = "gemma4:e4b-it-q4_K_M"   # 빠르고 한국어 OK. 고품질 원하면 gemma4:26b
ASSETS_DIR = Path(__file__).parent
OUTPUT = ASSETS_DIR / "dialogues.json"

ANIMALS = {
    "chicken":    {"name": "닭",     "trait": "호기심 많고 수다스러운"},
    "cow":        {"name": "소",     "trait": "느긋하고 우직한"},
    "pig":        {"name": "돼지",   "trait": "장난기 많고 똑똑한"},
    "sheep":      {"name": "양",     "trait": "온순하고 푹신한"},
    "duck":       {"name": "오리",   "trait": "물놀이 좋아하는"},
    "goat":       {"name": "염소",   "trait": "고집세고 모험을 즐기는"},
    "dog":        {"name": "강아지", "trait": "충직하고 활발한"},
    "cat":        {"name": "고양이", "trait": "도도하고 우아한"},
    "bee":        {"name": "꿀벌",   "trait": "부지런하고 협동하는"},
    "rabbit":     {"name": "토끼",   "trait": "수줍고 깡총거리는"},
    "horse":      {"name": "말",     "trait": "당당하고 빠른"},
    "fish":       {"name": "물고기", "trait": "조용하고 신비로운"},
}

CROPS = {
    "potato":     {"name": "감자",   "season": "봄"},
    "strawberry": {"name": "딸기",   "season": "봄"},
    "lettuce":    {"name": "상추",   "season": "봄"},
    "watermelon": {"name": "수박",   "season": "여름"},
    "corn":       {"name": "옥수수", "season": "여름"},
    "tomato":     {"name": "토마토", "season": "여름"},
    "apple":      {"name": "사과",   "season": "가을"},
    "pear":       {"name": "배",     "season": "가을"},
    "sweetpotato":{"name": "고구마", "season": "가을"},
    "spinach":    {"name": "시금치", "season": "겨울"},
}

SEASONS = ["봄", "여름", "가을", "겨울"]
WEATHERS = ["맑음", "비", "눈", "흐림"]
MOODS    = ["행복", "배고픔", "졸림", "신남", "심심"]


def ollama_call(prompt: str, timeout: int = 300) -> str:
    """Ollama HTTP API 단일 generate 호출."""
    payload = json.dumps({
        "model": MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {"temperature": 0.9, "top_p": 0.95, "num_predict": 400},
    }).encode("utf-8")
    req = urlreq.Request(
        OLLAMA_URL, data=payload,
        headers={"Content-Type": "application/json"}
    )
    try:
        with urlreq.urlopen(req, timeout=timeout) as r:
            data = json.loads(r.read().decode("utf-8"))
            return data.get("response", "").strip()
    except URLError as e:
        print(f"[ERR] Ollama 연결 실패: {e}. 'ollama serve' 실행 확인.")
        sys.exit(1)


def parse_lines(raw: str, want: int) -> list:
    """LLM 출력에서 번호/불릿 제거 후 줄단위 리스트화. 30자 초과 자동 절단."""
    out = []
    for ln in raw.splitlines():
        s = ln.strip().lstrip("-•*").lstrip("0123456789.).")
        s = s.strip().strip('"').strip("'").strip("「」『』")
        if not s or len(s) < 2:
            continue
        if len(s) > 30:
            s = s[:30]
        out.append(s)
        if len(out) >= want:
            break
    return out


def gen_animal_dialogues(key: str, info: dict) -> list:
    """동물 1종에 대해 50개 대사 (계절×날씨×기분 조합)."""
    name, trait = info["name"], info["trait"]
    dialogues = []
    # 계절 4 × 기분 5 × ~2.5개 = 50개
    for season in SEASONS:
        for mood in MOODS:
            weather = WEATHERS[len(dialogues) % 4]
            need = 3 if len(dialogues) < 40 else 2
            prompt = (
                f"너는 한국 시골 농장의 {trait} {name}이야. "
                f"지금은 {season}, 날씨는 {weather}, 기분은 '{mood}'.\n"
                f"초등학생 어린이에게 들려주는 귀여운 대사 {need}개를 만들어줘.\n"
                f"규칙: 한 줄당 30자 이내, 한국어, 의성어/의태어 환영, "
                f"번호나 불릿 없이 줄바꿈으로만 구분. 따옴표 X."
            )
            raw = ollama_call(prompt)
            lines = parse_lines(raw, need)
            for ln in lines:
                dialogues.append({
                    "season": season, "weather": weather,
                    "mood": mood, "text": ln,
                })
            if len(dialogues) >= 50:
                break
        if len(dialogues) >= 50:
            break
        time.sleep(0.2)
    return dialogues[:50]


def gen_crop_card(key: str, info: dict) -> dict:
    """작물 1종 도감 카드 (재배팁/영양/한국농업사)."""
    name, season = info["name"], info["season"]
    prompt = (
        f"한국의 {season} 작물 '{name}'에 대해 초등학생용 도감 카드를 작성해줘.\n"
        f"형식 (각 항목 한 줄, 50자 이내):\n"
        f"재배팁: ...\n영양: ...\n역사: ...\n잡지식: ...\n"
        f"규칙: 한국어, 친근한 어투, 이모지 X."
    )
    raw = ollama_call(prompt)
    card = {"name": name, "season": season,
            "tip": "", "nutrition": "", "history": "", "trivia": ""}
    field_map = {"재배팁": "tip", "영양": "nutrition",
                 "역사": "history", "잡지식": "trivia"}
    for ln in raw.splitlines():
        ln = ln.strip().lstrip("-•*").strip()
        for k, v in field_map.items():
            if ln.startswith(k):
                txt = ln.split(":", 1)[-1].strip()
                if len(txt) > 60: txt = txt[:60]
                card[v] = txt
                break
    return card


def main():
    print(f"[NPC] 모델 {MODEL}로 생성 시작…")
    result = {
        "version": "1.0",
        "generated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
        "model": MODEL,
        "animals": {},
        "crops": {},
    }
    for key, info in ANIMALS.items():
        print(f"  - 동물 [{info['name']}] 대사 50개 생성중…")
        result["animals"][key] = gen_animal_dialogues(key, info)
    for key, info in CROPS.items():
        print(f"  - 작물 [{info['name']}] 도감 카드 생성중…")
        result["crops"][key] = gen_crop_card(key, info)
    OUTPUT.write_text(
        json.dumps(result, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    print(f"[NPC] 완료 → {OUTPUT}")


if __name__ == "__main__":
    main()
