"""2026-10-03 과목 확장(과학 빈 단원·위인 / 인문 확장 / 예체능 / 직업) 검증본을 게임 data/ 로 합친다.
  - 과학 : verified/science_c·d·e.json        → data/science_c.json (새 파일, data.js 가 읽는다)
  - 인문 : data/human.json + verified/human2·3 → data/human.json   (h_music·h_art 는 예체능 a_music·a_art 로 옮겨 갔으므로 뺀다)
  - 예체능: verified/arts·arts2.json           → data/arts.json
  - 직업 : verified/jobs·jobs2.json           → data/jobs.json
  - 강의 : data/lectures.json + verified/lectures_*.json (+ h_music·h_art 강의를 a_music·a_art 로 복사)
과학 외 과목은 verified:true 와 field(분야, tutor.js 사다리의 넷째 칸)를 붙인다.
기존 data 파일은 D:\\AI\\_deleted_files 아래로 복사해 둔 뒤 바꾼다(지우지 않음).
실행: python _tools/merge_content2.py <검증 폴더 (content\\verified)>"""
import json, os, re, shutil, sys, time

GAME = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(GAME, 'data')
KEEP = os.path.join(r'D:\AI\_deleted_files', 'pokered-edu_data_' + time.strftime('%Y%m%d_%H%M%S'))
SRC = sys.argv[1] if len(sys.argv) > 1 else '.'

tutor = open(os.path.join(GAME, 'js', 'learn', 'tutor.js'), encoding='utf-8').read()
LADDER = {m[0]: m[3] for m in re.findall(r"\['([shaj]_\w+)', (\d+), '([^']*)', '([^']*)'\]", tutor)}

def load(name, need=True):
    p = os.path.join(SRC, name)
    if not os.path.exists(p):
        if need: sys.exit(f'없음: {p}')
        return None
    return json.load(open(p, encoding='utf-8'))

def data(name, default):
    p = os.path.join(DATA, name)
    return json.load(open(p, encoding='utf-8')) if os.path.exists(p) else default

def write(name, obj):
    dst = os.path.join(DATA, name)
    if os.path.exists(dst):
        os.makedirs(KEEP, exist_ok=True)
        shutil.copy2(dst, os.path.join(KEEP, name))
    with open(dst, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, separators=(',', ':'))

def mark(items, default_field):
    for q in items:
        q['verified'] = True
        q.setdefault('field', LADDER.get(q.get('topic'), default_field))
    return items

def dedupe(items):
    seen, out = set(), []
    for q in items:
        if q['id'] in seen: continue
        seen.add(q['id']); out.append(q)
    return out

problems = []
# 과학
sci = []
for n in ('science_c.json', 'science_d.json', 'science_e.json'):
    sci += load(n)
old_sci_ids = {q['id'] for n in ('science_a.json', 'science_b.json') for q in data(n, [])}
sci = [q for q in dedupe(sci) if q['id'] not in old_sci_ids]
write('science_c.json', sci)
# 인문
hum_old = [q for q in data('human.json', []) if q.get('topic') not in ('h_music', 'h_art')]
hum = dedupe(hum_old + mark(load('human2.json'), '인문') + mark(load('human3.json'), '인문'))
write('human.json', hum)
# 예체능·직업
arts = dedupe(mark(load('arts.json') + load('arts2.json'), '예체능'))
write('arts.json', arts)
jobs = dedupe(mark(load('jobs.json') + load('jobs2.json'), '직업'))
write('jobs.json', jobs)
# 강의
lec = data('lectures.json', {})
for n in ('lectures_sciA.json', 'lectures_sciB.json', 'lectures_sciE.json', 'lectures_hum2.json', 'lectures_hum3.json',
          'lectures_art.json', 'lectures_art2.json', 'lectures_job.json', 'lectures_job2.json'):
    d = load(n, need=False)
    if d is None: problems.append('강의 없음: ' + n); continue
    lec.update(d)
for a, h in (('a_music', 'h_music'), ('a_art', 'h_art')):
    if a not in lec and h in lec: lec[a] = lec[h]
write('lectures.json', lec)

# 확인: 사다리 주제마다 문제 수 (과학 1+, 나머지 검증 10+)
bank = {}
for q in data('science_a.json', []) + data('science_b.json', []) + sci + hum + arts + jobs:
    if q.get('topic', '').startswith('s_') or q.get('verified'):
        bank[q['topic']] = bank.get(q['topic'], 0) + 1
short = [t for t in LADDER if bank.get(t, 0) < (1 if t.startswith('s_') else 10)]
nolec = [t for t in LADDER if t not in lec]
print(f'과학 새 {len(sci)} · 인문 {len(hum)} · 예체능 {len(arts)} · 직업 {len(jobs)} · 강의 {len(lec)}주제')
print('문제가 모자란 사다리 주제:', short or '없음')
print('강의 없는 사다리 주제:', len(nolec), nolec[:12])
for p in problems: print('⚠', p)
if os.path.isdir(KEEP): print('이전 data 파일 보관:', KEEP)
