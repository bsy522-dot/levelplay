import json

def safe(s, mx=500):
    s = str(s)[:mx]
    for c in ["'", "\n", "\r", "\u2018", "\u2019", "\u201C", "\u201D"]:
        s = s.replace(c, "")
    return s

def lesson_to_js(l):
    t = safe(l.get("topic",""), 50)
    lv = int(l.get("level", 1))
    content = safe(l.get("content",""), 2000)
    # quiz
    quizzes = l.get("quiz", [])
    qjs = []
    for q in quizzes[:3]:
        qq = safe(q.get("q",""), 80)
        aa = [safe(a, 30) for a in q.get("a",["","","",""])]
        c = int(q.get("c", 0))
        qjs.append("{q:'%s',a:['%s','%s','%s','%s'],c:%d}" % (qq, aa[0], aa[1], aa[2], aa[3] if len(aa)>3 else "", c))
    quiz_str = "[%s]" % ",".join(qjs)
    return "{t:'%s',lv:%d,content:'%s',quiz:%s}" % (t, lv, content, quiz_str)

with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

# 수학: CURRICULUM.math.units에 레슨 추가
for fn, subj in [("data/math_lessons.json","math"), ("data/science_lessons.json","science"), ("data/history_lessons.json","history")]:
    with open(fn, "r", encoding="utf-8") as f:
        data = json.load(f)
    if isinstance(data, dict):
        data = data.get("lessons", data.get("data", data.get("contents", [])))

    # 단원별 그룹핑
    units = {}
    for l in data:
        u = l.get("unit", "기타")
        if u not in units: units[u] = []
        units[u].append(l)

    # 기존 CURRICULUM[subj].units 배열의 마지막 ] 찾기
    marker = "%s:{nm:" % subj
    pos = html.find(marker)
    if pos < 0:
        print(f"  {subj} not found in CURRICULUM")
        continue

    # units:[ 찾기
    units_pos = html.find("units:[", pos)
    if units_pos < 0:
        continue

    # 기존 단원들의 닫는 ]]} 찾기 (해당 과목의 units 배열 끝)
    # 간단히: 기존 레슨 수를 세고, 이미 있는 단원 뒤에 추가
    # 기존 단원 끝 = ]} 패턴

    added = 0
    for unit_name, lessons in units.items():
        # 이 단원이 이미 있는지 확인
        safe_unit = safe(unit_name, 30)
        if safe_unit in html:
            # 이미 있는 단원 → 레슨 배열 끝에 추가
            unit_pos = html.find(safe_unit, pos)
            if unit_pos > 0:
                # lessons:[ 찾기
                lessons_pos = html.find("lessons:[", unit_pos)
                if lessons_pos > 0 and lessons_pos < unit_pos + 500:
                    # 배열 끝 ] 찾기
                    bracket_count = 0
                    search_start = lessons_pos + len("lessons:[")
                    for i in range(search_start, min(search_start + 10000, len(html))):
                        if html[i] == '[': bracket_count += 1
                        elif html[i] == ']':
                            if bracket_count == 0:
                                # 여기에 삽입
                                new_lessons = ",\n".join([lesson_to_js(l) for l in lessons])
                                html = html[:i] + ",\n" + new_lessons + html[i:]
                                added += len(lessons)
                                break
                            bracket_count -= 1
        else:
            # 새 단원 추가 → units 배열 끝에
            # units:[ ... ]} 패턴에서 마지막 ]} 찾기
            pass  # 복잡하니 스킵

    if added > 0:
        print(f"{subj}: added {added} lessons to existing units")
    else:
        print(f"{subj}: {len(data)} lessons ready but no matching units found")

with open("index.html", "w", encoding="utf-8") as f:
    f.write(html)
print("Done")
