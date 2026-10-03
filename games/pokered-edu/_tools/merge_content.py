"""검증을 마친 내용 파일을 게임 data/ 로 옮겨 담는다.
  - 원리 문제  : concept_math_verified.json → data/concept_math.json
  - 강의       : lectures_verified.json      → data/lectures.json
  - 인문 문제  : human_verified.json         → data/human.json (검증 표시 verified:true 를 붙인다)
없는 파일은 건너뛴다. 기존 data 파일은 _deleted_files 아래로 옮겨 둔 뒤 바꾼다(지우지 않음).
실행: python _tools/merge_content.py <검증 파일이 있는 폴더>"""
import json, os, shutil, sys, time

GAME = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(GAME, 'data')
KEEP = os.path.join(r'D:\AI\_deleted_files', 'pokered-edu_data_' + time.strftime('%Y%m%d_%H%M%S'))
SRC = sys.argv[1] if len(sys.argv) > 1 else '.'

def put(src_name, dst_name, fix=None):
    src = os.path.join(SRC, src_name)
    if not os.path.exists(src):
        print('건너뜀(아직 없음):', src_name)
        return
    data = json.load(open(src, encoding='utf-8'))
    if fix:
        data = fix(data)
    dst = os.path.join(DATA, dst_name)
    if os.path.exists(dst):
        os.makedirs(KEEP, exist_ok=True)
        shutil.copy2(dst, os.path.join(KEEP, dst_name))
    with open(dst, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    n = len(data)
    print(f'{dst_name}: {n}개 넣음')

# 인문 주제 → 분야 이름 (tutor.js HUMAN 사다리의 f 와 같다. 문제 정보 형식(요구사항 25번)의 field)
FIELD = {'h_history': '역사', 'h_geo': '지리', 'h_music': '음악', 'h_art': '미술', 'h_civ': '역사', 'h_philo': '철학'}

def mark_verified(items):
    for q in items:
        q['verified'] = True
        q.setdefault('field', FIELD.get(q.get('topic'), '인문'))
    return items

put('concept_math_verified.json', 'concept_math.json')
put('lectures_verified.json', 'lectures.json')
put('human_verified.json', 'human.json', mark_verified)
if os.path.isdir(KEEP):
    print('이전 data 파일 보관:', KEEP)
