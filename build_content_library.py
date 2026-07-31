# -*- coding: utf-8 -*-
"""LevelPlay 콘텐츠 라이브러리 빌더 (재실행 안전)

08_컨텐츠에서 만든 산출물을 LevelPlay 학습 콘텐츠로 편입한다.

  1) 수학만화 《수학이 태어난 날》  : Output 페이지 PNG → 웹용 JPEG + 소설 원고 → 레슨
  2) 한국사만화 《아침의 나라》      : Output 페이지 PNG → 웹용 JPEG + 해설 → 레슨
  3) 모차르트 MV                    : 유튜브 업로드 장부(검증 통과·일부공개분만) → 임베드 레슨

산출:
  assets/comics/math_history/<slug>/pN.jpg
  assets/comics/k_history/<slug>/pN.jpg
  data/content_library.json      ← index.html 로더가 읽어 CURRICULUM에 병합

실행:  python build_content_library.py
"""
import io
import json
import os
import re
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
MATH_SRC = r"D:\AI\08_컨텐츠\Math_comics"
KHIST_SRC = r"D:\AI\08_컨텐츠\K_history_comics"
MOZART_SRC = r"D:\AI\08_컨텐츠\Mozart_MV_Project"

IMG_WIDTH = 1240      # 원본 A4 2480px의 절반 — 모바일 레티나에서 충분
IMG_QUALITY = 80

warnings = []


# ────────────────────────────── 이미지 ──────────────────────────────
def convert_page(src_path, out_path):
    """A4 PNG → 웹용 프로그레시브 JPEG. 이미 최신이면 건너뛴다."""
    if not os.path.isfile(src_path):
        warnings.append("원본 없음: %s" % src_path)
        return None
    if os.path.isfile(out_path) and os.path.getmtime(out_path) >= os.path.getmtime(src_path):
        return os.path.getsize(out_path)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    im = Image.open(src_path).convert("RGB")
    h = int(im.height * IMG_WIDTH / im.width)
    im.resize((IMG_WIDTH, h), Image.LANCZOS).save(
        out_path, "JPEG", quality=IMG_QUALITY, optimize=True, progressive=True)
    return os.path.getsize(out_path)


def build_pages(src_dir, filenames, rel_dir):
    """페이지 파일 목록을 변환하고 앱에서 쓸 상대경로 리스트를 돌려준다."""
    rels = []
    for i, fn in enumerate(filenames, 1):
        rel = "%s/p%d.jpg" % (rel_dir, i)
        if convert_page(os.path.join(src_dir, fn), os.path.join(HERE, rel)) is not None:
            rels.append(rel)
    return rels


def img_tags(rels, alt):
    return "".join(
        '<img loading="lazy" src="%s" alt="%s %d쪽" '
        'style="width:100%%;border-radius:8px;display:block;margin:8px 0;'
        'background:rgba(255,255,255,.04)">' % (rel, alt, i)
        for i, rel in enumerate(rels, 1))


# ────────────────────────────── 원고 파싱 ──────────────────────────────
def parse_novel(path):
    """정본 3부 구성(역사적 오프닝 / 이야기 / 역사노트)을 분해한다."""
    if not os.path.isfile(path):
        warnings.append("원고 없음: %s" % path)
        return None
    raw = io.open(path, encoding="utf-8").read().strip()
    note = ""
    m = re.search(r"〈역사노트〉\s*(.+)$", raw, re.S)
    if m:
        note = m.group(1).strip()
        raw = raw[:m.start()].strip()
    parts = [p.strip() for p in re.split(r"\n\s*\*\s*\n", raw) if p.strip()]
    head = parts[0] if parts else ""
    body = "\n\n".join(parts[1:]) if len(parts) > 1 else ""

    era = ""
    m = re.search(r"〈([^〉]+)〉", head)
    if m:
        era = m.group(1).strip()
        head = head[m.end():].strip()
    head = re.sub(r"^《[^》]*》\s*", "", head)
    head = re.sub(r"^제\s*\d+\s*화[^\n]*\n", "", head).strip()
    return {"era": era, "opening": head, "body": body, "note": note}


def paras(text, style="margin:0 0 10px"):
    out = []
    for line in [l.strip() for l in text.split("\n")]:
        if not line:
            continue
        out.append('<p style="%s">%s</p>' % (style, esc(line)))
    return "".join(out)


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def note_block(note):
    """역사노트의 ✅/🤔 줄을 색으로 구분해 보여 준다."""
    if not note:
        return ""
    out = ['<div style="margin-top:10px;padding:10px;border-radius:8px;'
           'background:rgba(96,165,250,.10);border:1px solid rgba(96,165,250,.25)">'
           '<div style="font-weight:700;margin-bottom:6px">🏛 역사노트</div>']
    for line in [l.strip() for l in note.split("\n") if l.strip()]:
        col = "#93c5fd" if line.startswith("✅") else ("#fcd34d" if line.startswith("🤔") else "inherit")
        out.append('<p style="margin:0 0 6px;color:%s">%s</p>' % (col, esc(line)))
    out.append("</div>")
    return "".join(out)


def badge(text, color="#a78bfa"):
    return ('<span style="display:inline-block;padding:3px 9px;border-radius:999px;'
            'font-size:11px;font-weight:700;color:%s;background:rgba(167,139,250,.14);'
            'border:1px solid rgba(167,139,250,.3);margin-bottom:8px">%s</span>' % (color, text))


def section(title):
    return ('<div style="font-weight:700;margin:14px 0 6px;padding-top:10px;'
            'border-top:1px solid rgba(255,255,255,.08)">%s</div>' % title)


# ────────────────────────────── 1. 수학만화 ──────────────────────────────
MATH_EPISODES = [
    dict(slug="s1e01", no=1, title="하나에 하나씩", theme="1대1 대응 — 수의 탄생", lv=1,
         novel="01_하나에하나씩_1대1대응.txt",
         pages=["S1E01_하나에하나씩_9컷_%d쪽.png" % i for i in range(1, 6)],
         quiz=[
             {"q": "에나가 사슴 한 마리를 볼 때마다 눈밭에 한 줄씩 그은 방법을 뭐라고 하나요?",
              "a": ["1대1 대응", "곱셈", "나눗셈", "어림하기"], "c": 0},
             {"q": "눈금이 새겨진 실제 유물로, 약 4만 년 전 남아프리카에서 발견된 뼈는?",
              "a": ["레봄보 뼈", "이샹고 뼈", "린드 파피루스", "함무라비 비석"], "c": 0},
         ]),
    dict(slug="s1e02", no=2, title="뼈에 새긴 재산", theme="덧셈의 탄생", lv=1,
         novel="02_이어새긴재산_덧셈.txt",
         pages=["S1E02_뼈에새긴재산_9컷_%d쪽.png" % i for i in range(1, 6)],
         quiz=[
             {"q": "이미 새긴 눈금 뒤에 눈금을 '이어서' 새기는 일은 어떤 계산이 될까요?",
              "a": ["덧셈", "뺄셈", "나눗셈", "제곱"], "c": 0},
             {"q": "덧셈이 필요해진 까닭으로 가장 알맞은 것은?",
              "a": ["가진 것에 새로 얻은 것을 합쳐 세야 해서", "물건을 똑같이 나눠야 해서",
                    "사라진 것을 알아야 해서", "글자를 만들어야 해서"], "c": 0},
         ]),
    dict(slug="s1e03", no=3, title="사라진 고기", theme="뺄셈의 탄생", lv=1,
         novel="03_사라진고기_뺄셈.txt",
         pages=["S1E03_사라진고기_9컷_%d쪽.png" % i for i in range(1, 6)],
         quiz=[
             {"q": "처음 세어 둔 눈금과 지금 남은 것을 짝지어 '없어진 만큼'을 알아내는 계산은?",
              "a": ["뺄셈", "덧셈", "곱셈", "나눗셈"], "c": 0},
             {"q": "뺄셈이 있으면 무엇을 알 수 있나요?",
              "a": ["얼마나 줄었는지", "얼마나 무거운지", "며칠이 지났는지", "누가 힘센지"], "c": 0},
         ]),
    dict(slug="s1e04", no=4, title="바구니 하나에 큰 표시 하나", theme="곱셈의 탄생", lv=2,
         novel="04_바구니하나에큰표시하나_곱셈.txt",
         pages=["S1E04_바구니에큰표시_9컷_%d쪽.png" % i for i in range(1, 6)],
         quiz=[
             {"q": "'같은 수가 여러 번 되풀이되는 것'을 한 번에 세는 계산은?",
              "a": ["곱셈", "덧셈", "뺄셈", "비교"], "c": 0},
             {"q": "한 바구니에 5개씩 담은 바구니가 4개면 모두 몇 개일까요?",
              "a": ["20개", "9개", "15개", "24개"], "c": 0},
         ]),
    dict(slug="s1e05", no=5, title="공평한 바구니", theme="나눗셈의 탄생", lv=2,
         novel="05_공평한바구니_나눗셈.txt",
         pages=[],   # 만화 페이지 미제작 — 소설만 제공
         quiz=[
             {"q": "여럿이 똑같이 나눠 가지려 할 때 쓰는 계산은?",
              "a": ["나눗셈", "곱셈", "덧셈", "뺄셈"], "c": 0},
             {"q": "고기 12덩이를 4명이 똑같이 나누면 한 사람 몫은?",
              "a": ["3덩이", "4덩이", "6덩이", "8덩이"], "c": 0},
         ]),
    dict(slug="s2e01", no=6, title="최초의 영수증", theme="수메르 — 기록의 탄생", lv=2,
         novel="06_최초의영수증_수메르.txt",
         pages=["S2E01_최초의영수증_%d쪽.png" % i for i in range(1, 6)],
         quiz=[
             {"q": "메소포타미아에서 물건의 수를 점토판에 남긴 까닭은?",
              "a": ["주고받은 것을 나중에도 확인하려고", "그림을 예쁘게 그리려고",
                    "점토가 남아돌아서", "왕이 심심해서"], "c": 0},
             {"q": "수메르 사람들이 수를 적을 때 쓴 재료는?",
              "a": ["점토판", "비단", "종이", "유리"], "c": 0},
         ]),
]


def build_math():
    novels_dir = os.path.join(MATH_SRC, "novels")
    out_dir = os.path.join(MATH_SRC, "Output")
    lessons, n_pages = [], 0

    for ep in MATH_EPISODES:
        nv = parse_novel(os.path.join(novels_dir, ep["novel"]))
        if nv is None:
            continue
        rels = build_pages(out_dir, ep["pages"], "assets/comics/math_history/%s" % ep["slug"])
        n_pages += len(rels)

        html = [badge("📜 " + (nv["era"] or "수학의 첫걸음"))]
        html.append("<h3>제%d화 〈%s〉</h3>" % (ep["no"], esc(ep["title"])))
        html.append('<p style="color:var(--t3);margin:0 0 10px;font-size:12px">%s</p>' % esc(ep["theme"]))
        if nv["opening"]:
            html.append(paras(nv["opening"]))

        # 소설이 정본(2026-07-07 확정 3부 템플릿) — 본문으로 펼쳐 둔다.
        if nv["body"]:
            html.append(section("📜 이야기"))
            html.append(paras(nv["body"]))
        html.append(note_block(nv["note"]))

        # 만화판은 2026-07-03~04 제작본으로 등장인물·사건이 소설과 다르다.
        # 정본과 섞이지 않도록 접어서 별도 표기해 싣는다. (재제작 시 이 블록을 본문으로 올릴 것)
        if rels:
            html.append(section("🖼 만화판도 보기 (%d쪽)" % len(rels)))
            html.append('<p style="font-size:11px;color:var(--t3);margin:0 0 6px">'
                        '먼저 그린 만화판입니다. 등장인물과 사건이 위 이야기와 조금 다릅니다.</p>')
            html.append("<details><summary style=\"cursor:pointer;color:var(--t3);font-size:12px\">"
                        "만화 %d쪽 펼치기</summary><div style=\"margin-top:8px\">%s</div></details>"
                        % (len(rels), img_tags(rels, "제%d화 %s" % (ep["no"], ep["title"]))))

        lessons.append({
            "t": "%d화. %s" % (ep["no"], ep["title"]),
            "lv": ep["lv"],
            "content": "".join(html),
            "quiz": ep["quiz"],
            "vq": "수학의 역사 %s" % ep["theme"].split("—")[0].strip(),
        })

    return {
        "nm": "🎬 수학이 태어난 날 (만화·소설)",
        "lessons": lessons,
    }, n_pages


# ────────────────────────────── 2. 한국사만화 ──────────────────────────────
KHIST_EPISODES = [
    dict(slug="gojoseon_e01", title="1화. 곰님, 100일만 참으세요!", lv=1,
         subtitle="고조선의 시작 — 단군신화",
         pages=["고조선1화_곰님100일만참으세요_9컷_%d쪽.png" % i for i in range(1, 6)],
         intro="아주 오랜 옛날, 하늘의 아들 환웅이 사람들을 널리 이롭게 하려고 땅으로 내려왔습니다. "
               "곰과 호랑이가 찾아와 사람이 되게 해 달라고 빌었고, 환웅은 쑥과 마늘을 주며 "
               "굴에서 햇빛을 보지 말고 견디라고 했습니다.",
         notes=[("전승", "단군 이야기는 고려 시대에 일연이 쓴 《삼국유사》(1281년)와 이승휴의 《제왕운기》에 실려 전해집니다."),
                ("전승", "《삼국유사》에는 환웅이 쑥 한 줌과 마늘 스무 개를 주며 '백 일 동안 햇빛을 보지 말라'고 했지만, 곰은 삼칠일(21일) 만에 여자의 몸이 되었다고 적혀 있습니다."),
                ("전승", "같은 책 안에서도 도읍이 다르게 나옵니다. 《위서》를 인용한 대목은 '아사달에 도읍했다'고 하고, 《고기》를 인용한 대목은 '요임금 즉위 50년에 평양성에 도읍했다'고 합니다. 옛 기록끼리도 이렇게 다를 수 있습니다."),
                ("전승", "《제왕운기》는 아예 다른 이야기를 전합니다. 웅녀 대신 환웅의 손녀가 약을 마시고 사람이 되어 박달나무 신과 혼인해 단군을 낳았다고 합니다."),
                ("상상", "곰과 호랑이가 나눈 대화, 굴 안에서의 하루하루는 기록에 없습니다. 이야기를 위해 그려 본 장면입니다.")],
         quiz=[{"q": "단군 이야기가 실려 전해지는 고려 시대 책은?",
                "a": ["삼국유사", "동의보감", "목민심서", "훈민정음"], "c": 0},
               {"q": "《삼국유사》에서 곰이 사람의 몸이 되기까지 걸린 기간은?",
                "a": ["삼칠일(21일)", "백 일", "일 년", "하루"], "c": 0}]),
    dict(slug="sp_jeondeungsa", title="특별편. 꺼지지 않는 등불 — 전등사", lv=2,
         subtitle="강화 정족산의 오래된 절",
         pages=["전등사특별편_꺼지지않는등불_%d쪽.png" % i for i in range(1, 3)],
         intro="인천 강화도 정족산 자락에는 전등사라는 오래된 절이 있습니다. "
               "이름의 뜻은 '등불을 전하는 절'입니다.",
         notes=[("전승", "삼국시대에 창건되었다고 전하며, 고구려 소수림왕 때 아도 화상이 세우고 처음 이름은 진종사였다는 이야기가 함께 전합니다."),
                ("전승", "고려 충렬왕의 왕비 정화궁주가 옥으로 만든 등을 바친 뒤로 '전등사'라 불렸다고 전해집니다."),
                ("전승", "절을 둘러싼 정족산성의 본래 이름은 삼랑성(三郞城)입니다. 《고려사》와 《세종실록지리지》에 '단군이 세 아들을 시켜 쌓았다'고 기록되어 전합니다."),
                ("기록", "조선 시대에는 이곳 정족산사고에 《조선왕조실록》을 보관했습니다.")],
         quiz=[{"q": "전등사가 있는 섬은?",
                "a": ["강화도", "제주도", "울릉도", "거제도"], "c": 0},
               {"q": "조선 시대에 전등사 곁 정족산사고에 보관한 것은?",
                "a": ["조선왕조실록", "팔만대장경", "직지심체요절", "훈민정음 해례본"], "c": 0}]),
    dict(slug="sp_chamseongdan", title="특별편. 하늘에 닿은 제단 — 참성단", lv=2,
         subtitle="마니산 꼭대기의 돌 제단",
         pages=["참성단특별편_하늘에닿은제단_%d쪽.png" % i for i in range(1, 3)],
         intro="강화도 마니산 꼭대기에는 돌을 쌓아 만든 네모난 제단이 있습니다. "
               "아래는 둥글고 위는 네모난 모양으로, 하늘과 땅을 함께 담았다고 이야기합니다.",
         notes=[("전승", "《고려사》와 《세종실록지리지》에 '단군이 하늘에 제사 지내던 제단'으로 기록되어 전합니다."),
                ("기록", "아래는 둥근 기단, 위는 네모난 단으로 쌓았습니다. 하늘은 둥글고 땅은 네모나다는 천원지방(天圓地方) 생각을 담은 것으로 봅니다."),
                ("기록", "고려 원종 11년(1270년)에 고쳐 쌓은 기록이 있고, 조선 시대에도 나라에서 제사를 지냈습니다. 사적 제136호입니다."),
                ("기록", "지금도 개천절과 전국체육대회의 성화를 이곳에서 채화합니다.")],
         quiz=[{"q": "참성단이 있는 산은?",
                "a": ["마니산", "한라산", "설악산", "지리산"], "c": 0},
               {"q": "참성단에서 지금도 하는 일은?",
                "a": ["전국체전 성화 채화", "국회 개회식", "수학능력시험", "임금 즉위식"], "c": 0}]),
    dict(slug="sp_bugeunri", title="특별편. 거인의 돌 탁자 — 부근리 고인돌", lv=2,
         subtitle="청동기 시대의 무덤",
         pages=["부근리고인돌특별편_거인의돌탁자_%d쪽.png" % i for i in range(1, 3)],
         intro="강화 부근리에는 커다란 돌 두 개가 기둥처럼 서고 그 위에 넓적한 돌이 얹힌 "
               "탁자 모양의 고인돌이 있습니다. 청동기 시대 사람들이 만든 무덤입니다.",
         notes=[("기록", "전체 높이는 2.6미터로 모든 자료가 같습니다. 남한에서 가장 큰 탁자식 고인돌로 꼽힙니다."),
                ("기록", "덮개돌 크기는 자료마다 달라 함께 적습니다 — 길이 6.5m×너비 5.2m×두께 1.2m(국가유산포털 계열) 또는 길이 7.1m×너비 5.5m(한국민족문화대백과). 무게는 약 50~80톤으로 추정되며 가장 많이 쓰이는 값은 약 53톤입니다."),
                ("기록", "이런 모양을 탁자식(북방식) 고인돌이라고 부릅니다."),
                ("기록", "2000년 11월 29일 제24차 유네스코 세계유산위원회에서 '고창·화순·강화 고인돌 유적'으로 등재되었습니다."),
                ("상상", "돌을 어떻게 옮기고 올렸는지는 확정된 정설이 없습니다. 통나무를 굴림목으로 깔고 끌었다는 설, 흙 언덕을 쌓아 끌어올렸다는 설, 통나무를 우물 정(井)자로 쌓아 들어 올렸다는 설이 있습니다.")],
         quiz=[{"q": "고인돌은 무엇으로 쓰인 것으로 보나요?",
                "a": ["무덤", "집", "다리", "우물"], "c": 0},
               {"q": "강화 고인돌 유적이 유네스코 세계유산이 된 해는?",
                "a": ["2000년", "1950년", "1980년", "2015년"], "c": 0}]),
    dict(slug="sp_osangri", title="특별편. 열두 기의 돌 가족 — 오상리 고인돌", lv=2,
         subtitle="한자리에 모인 고인돌 무리",
         pages=["오상리고인돌특별편_열두기의돌가족_%d쪽.png" % i for i in range(1, 3)],
         intro="강화 내가면 오상리에는 고인돌 여러 기가 한자리에 모여 있습니다. "
               "크기가 저마다 달라, 마치 한 가족이 나란히 선 것처럼 보입니다.",
         notes=[("기록", "1999년에 '오상리 고인돌군' 12기로 지정되었습니다. 모두 탁자식(북방식)입니다."),
                ("기록", "가장 큰 것이 덮개돌 길이 335센티미터, 나머지는 130~260센티미터로 부근리 것보다 훨씬 작습니다."),
                ("기록", "2000년 선문대학교 발굴에서 구석기의 뗀석기, 신석기의 빗살무늬토기, 청동기의 민무늬토기와 간돌검·돌화살촉이 함께 나왔습니다."),
                ("상상", "무리 지은 고인돌의 주인들이 실제로 한 가족이었는지는 알 수 없습니다.")],
         quiz=[{"q": "오상리 고인돌의 특징으로 알맞은 것은?",
                "a": ["여러 기가 한자리에 모여 있다", "하나만 외따로 있다",
                      "흙으로 쌓았다", "쇠로 만들었다"], "c": 0},
               {"q": "고인돌을 만든 시대는?",
                "a": ["청동기 시대", "조선 시대", "고려 시대", "삼국 시대"], "c": 0}]),
    dict(slug="sp_ganghwa_church", title="특별편. 배를 닮은 한옥 교회 — 강화성당", lv=3,
         subtitle="한옥으로 지은 성당",
         pages=["강화성당특별편_배를닮은한옥교회_%d쪽.png" % i for i in range(1, 3)],
         intro="강화읍 언덕 위에는 기와지붕을 얹은 한옥 성당이 있습니다. "
               "밖에서 보면 우리 옛집인데, 문을 열고 들어가면 서양 성당의 모습입니다.",
         notes=[("기록", "대한성공회 강화성당은 1900년 11월 15일에 축성된, 현존하는 가장 오래된 한옥 성당입니다. 사적 제424호이며 지금도 매주 미사를 드립니다."),
                ("기록", "밖은 한옥의 팔작지붕, 안은 서양 교회의 바실리카 구조입니다. 한 건물 안에 유교식 배치, 절 같은 겉모습, 태극 문양, 그리고 십자가가 함께 있습니다."),
                ("기록", "축성을 주관한 이는 대한성공회 초대 주교 찰스 존 코프(한국 이름 고요한)이고, 건축 실무는 트롤로프 신부가 맡아 백두산 목재를 신의주에서 뗏목으로 실어 왔습니다."),
                ("전승", "언덕을 배 모양으로 축대 쌓아 그 위에 건물들을 앞뒤로 놓았습니다. 그래서 '노아의 방주'에 빗대어 이야기합니다.")],
         quiz=[{"q": "강화성당이 지어진 해는?",
                "a": ["1900년", "1392년", "1945년", "2000년"], "c": 0},
               {"q": "강화성당의 특징은?",
                "a": ["밖은 한옥, 안은 서양 성당 구조", "전체가 벽돌로 된 고딕 양식",
                      "돌로 쌓은 석굴", "나무로 만든 탑"], "c": 0}]),
]

BADGE_COLOR = {"기록": "#93c5fd", "전승": "#fcd34d", "야사": "#fca5a5", "상상": "#c4b5fd"}


def build_khistory():
    out_dir = os.path.join(KHIST_SRC, "Output")
    lessons, n_pages = [], 0

    for ep in KHIST_EPISODES:
        rels = build_pages(out_dir, ep["pages"], "assets/comics/k_history/%s" % ep["slug"])
        n_pages += len(rels)

        html = [badge("📜 " + ep["subtitle"])]
        html.append("<h3>%s</h3>" % esc(ep["title"]))
        html.append(paras(ep["intro"]))

        if rels:
            html.append(section("📖 만화로 보기 (%d쪽)" % len(rels)))
            html.append(img_tags(rels, ep["title"]))

        html.append(section("🏛 역사노트 — 어디까지가 기록일까?"))
        html.append('<p style="font-size:11px;color:var(--t3);margin:0 0 8px">'
                    '[기록]=사서에 직접 적힌 것 · [전승]=옛 책이 전하는 이야기 · [상상]=만화를 위해 그려 본 장면</p>')
        for kind, text in ep["notes"]:
            html.append('<p style="margin:0 0 6px;color:%s"><b>[%s]</b> %s</p>'
                        % (BADGE_COLOR.get(kind, "inherit"), kind, esc(text)))

        lessons.append({
            "t": ep["title"],
            "lv": ep["lv"],
            "content": "".join(html),
            "quiz": ep["quiz"],
            "vq": ep["subtitle"],
        })

    return {
        "nm": "📜 아침의 나라 임금님들 (고조선 만화)",
        "lessons": lessons,
    }, n_pages


# ────────────────────────────── 3. 모차르트 MV ──────────────────────────────
MOZART_UNITS = [
    ("🎹 어린 모차르트의 첫 작품", ["K1a", "K1b", "K1c", "K1d", "K1e", "K1ab", "K2"], 1),
    ("🎹 피아노 소나타", ["K280", "K281", "K283", "K309", "K310", "K311", "K331", "K332", "K333", "K545"], 2),
    ("🎻 협주곡", ["K175_long", "K219", "K466"], 3),
]

# ── 오디오 진위 등급 (2026-07-31 전수 재감정) ──────────────────────────────
# upload_metadata 의 verified 플래그만 믿지 않고 verify_song 을 직접 재실행해 분류했다.
#   A = 4중검증 기록 보유 + 재검증 통과
#   B = 검증 기록은 없으나, 신뢰 MIDI 출처장부 확인 + 곡 일치 재대조 통과(발췌 위치까지 확인)
# 어느 등급도 아닌 것은 아예 싣지 않는다(아래 EXCLUDED).
VERIFY_A = {"K1a", "K1b", "K1c", "K1d", "K1e", "K2", "K331", "K175_long"}
VERIFY_B = {"K1ab", "K280", "K281", "K283", "K309", "K310", "K311", "K332", "K333",
            "K545", "K219", "K466"}
# 재감정에서 원본 MIDI 어느 구간과도 일치하지 않아 보류 — 재빌드·재검증 전까지 게재 금지
EXCLUDED = {
    "K467": "영상 오디오가 K.467 MIDI 어느 구간과도 불일치(최고 0.394) + wav↔MIDI 0.088",
    "K488": "영상 오디오가 K.488 MIDI 어느 구간과도 불일치(최고 0.399) + wav↔MIDI 0.031",
    "K175": "쇼츠 오디오가 검증 통과분 롱폼 오디오와 불일치(0.297) — 롱폼으로 대체 게재",
    "K3": "출처 미상 MIDI로 회수(private)",
    "K4": "출처 미상 MIDI로 회수(private)",
}


def clean_title(t):
    """유튜브용 제목에서 해시태그·영문 병기를 덜어 낸 학습용 제목."""
    t = t.split("|")[0].strip()
    t = re.sub(r"#\S+", "", t).strip()
    return t


def clean_desc(d):
    """설명에서 해시태그 줄을 뺀 본문만."""
    lines = []
    for line in d.split("\n"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        lines.append(line)
    return lines


def build_mozart():
    up = json.load(io.open(os.path.join(MOZART_SRC, "scripts", "uploaded.json"), encoding="utf-8"))
    meta = json.load(io.open(os.path.join(MOZART_SRC, "scripts", "upload_metadata.json"), encoding="utf-8"))

    units, n_vid = [], 0
    skipped = ["%s — %s" % (k, why) for k, why in sorted(EXCLUDED.items())]

    for unit_nm, keys, lv in MOZART_UNITS:
        lessons = []
        for k in keys:
            v = up.get(k)
            if not v:
                warnings.append("업로드 장부에 없음: %s" % k)
                continue
            if v.get("privacy") != "unlisted":
                warnings.append("일부공개 아님 → 제외: %s (%s)" % (k, v.get("privacy")))
                continue
            if k not in VERIFY_A and k not in VERIFY_B:
                warnings.append("진위 등급 미부여 → 제외: %s" % k)
                continue
            md = meta.get(k, {})
            vid = v["videoId"]

            html = [badge("🎼 쾨헬번호 " + k.replace("_long", "").replace("K", "K."), "#f0abfc")]
            html.append("<h3>%s</h3>" % esc(clean_title(v["title"])))
            html.append(
                '<div style="position:relative;width:100%%;padding-bottom:56.25%%;border-radius:10px;'
                'overflow:hidden;margin:10px 0;background:#000">'
                '<iframe src="https://www.youtube.com/embed/%s" title="%s" loading="lazy" '
                'style="position:absolute;inset:0;width:100%%;height:100%%;border:0" '
                'allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" '
                'allowfullscreen></iframe></div>' % (vid, esc(clean_title(v["title"]))))
            for line in clean_desc(md.get("description", "")):
                html.append('<p style="margin:0 0 6px">%s</p>' % esc(line))
            if k in VERIFY_A:
                vtxt = ("✅ 실제 악보 MIDI와 대조하는 4중 검증(곡·조성·실곡·템포) 기록이 남아 있고, "
                        "2026-07-31 재검증에서도 통과했습니다.")
            else:
                vtxt = ("✅ 악보 MIDI 출처(신뢰 장부)가 확인됐고, 2026-07-31 재대조에서 "
                        "영상 소리가 그 악보의 실제 대목과 일치함을 확인했습니다.")
            html.append('<p style="margin-top:10px;font-size:11px;color:var(--t3)">%s</p>' % vtxt)

            lessons.append({
                "t": clean_title(v["title"]),
                "lv": lv,
                "content": "".join(html),
                "quiz": [{
                    "q": "이 곡의 쾨헬번호(작품 번호)는?",
                    "a": [k.replace("_long", "").replace("K", "K."), "Op.1", "BWV.1", "Hob.1"],
                    "c": 0,
                }],
                "vq": "모차르트 " + k.replace("_long", "").replace("K", "K."),
            })
            n_vid += 1
        if lessons:
            units.append({"nm": unit_nm, "lessons": lessons})

    return units, n_vid, skipped


# ────────────────────────────── 조립 ──────────────────────────────
def main():
    math_unit, math_pages = build_math()
    khist_unit, khist_pages = build_khistory()
    music_units, n_vid, skipped = build_mozart()

    doc = {
        "_doc": "LevelPlay 콘텐츠 라이브러리 — build_content_library.py 가 생성. 직접 수정하지 말 것.",
        "sets": [
            {"curriculum": "math", "dynamic": [], "units": [math_unit]},
            {"curriculum": "history", "dynamic": ["한국사"], "units": [khist_unit]},
            {"curriculum": "music", "dynamic": [], "units": music_units},
        ],
    }

    out = os.path.join(HERE, "data", "content_library.json")
    with io.open(out, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=1)

    total_lessons = sum(len(u["lessons"]) for s in doc["sets"] for u in s["units"])
    print("=" * 64)
    print("수학만화  : 레슨 %d개 / 만화 %d쪽" % (len(math_unit["lessons"]), math_pages))
    print("한국사만화: 레슨 %d개 / 만화 %d쪽" % (len(khist_unit["lessons"]), khist_pages))
    print("모차르트  : 단원 %d개 / 영상 %d편" % (len(music_units), n_vid))
    print("제외(검증 미통과·회수분): %s" % (", ".join(skipped) or "없음"))
    print("-" * 64)
    print("총 레슨 %d개 → %s (%.1f KB)" % (total_lessons, out, os.path.getsize(out) / 1024))
    if warnings:
        print("\n[경고 %d건]" % len(warnings))
        for w in warnings:
            print("  -", w)
    return 0


if __name__ == "__main__":
    sys.exit(main())
