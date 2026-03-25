"""
LevelPlay index.html 데이터 안전 재구축
- 기존 index.html에서 SUBJECTS/KIDS/ADULT/P 배열을 확장
- 모든 JSON 데이터를 따옴표 안전하게 삽입
- 삽입 후 JS 문법 검증
"""
import json, os, subprocess

def safe(s, mx=55):
    """JS 작은따옴표 문자열에 안전한 형태로 변환"""
    s = str(s)[:mx]
    # 모든 종류의 따옴표 제거
    for c in ["'", '"', '\\', '\n', '\r', '\u2018', '\u2019', '\u201C', '\u201D', '\u2032', '\u2033', '\u00B4', '`']:
        s = s.replace(c, '')
    return s

def mkitem(i, has_f=False):
    t = safe(i.get('title',''), 50)
    s = safe(i.get('source',''), 18)
    d = safe(i.get('description',''), 55)
    u = safe(i.get('url',''), 200)
    v = i.get('videoId','')
    if v and v.strip() and 'youtube' not in u:
        u = 'https://www.youtube.com/watch?v=%s' % v
    try:
        l = max(1, min(5, int(i.get('level', 2))))
    except:
        l = 2
    f_part = ''
    if has_f and i.get('f'):
        f_part = ",f:'%s'" % safe(i['f'], 15)
    return "{l:%d,t:'%s',s:'%s',u:'%s',d:'%s'%s}" % (l, t, s, u, d, f_part)

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        raw = json.load(f)
    if isinstance(raw, dict):
        return raw.get('contents', raw.get('data', raw.get('posts', [])))
    return raw

def insert_into_array(html, target_var, key, items_js, boundary):
    """html에서 target_var 객체의 key 배열 끝에 items를 삽입"""
    start = html.find('const %s={' % target_var)
    if start < 0:
        return html, 0
    bound = html.find(boundary, start)
    search = '%s:[' % key
    pos = html.find(search, start)
    if pos > 0 and pos < bound:
        end = html.find('],', pos + len(search))
        if end > 0 and end < pos + 50000:
            ins = ',\n' + ',\n'.join(items_js)
            return html[:end] + ins + html[end:], len(items_js)
    return html, 0

# ===== MAIN =====
with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

total = 0

# Step 1: SUBJECTS 배열에 경제/직업/코딩 추가 (아직 없으면)
if "'economy'" not in html:
    old = "{id:'special',ic:'\U0001f3a8',nm:'\ud2b9\ubcc4\ud65c\ub3d9',ds:'\ubbf8\uc220 \u00b7 \uacf5\uc608 \u00b7 \uc694\ub9ac \u00b7 \ucf54\ub529'},\n];"
    # 더 안전하게 찾기
    marker = "special',ds:"
    pos = html.find(marker)
    if pos > 0:
        end_bracket = html.find('];', pos)
        if end_bracket > 0:
            new_subjects = """,
{id:'economy',ic:'💰',nm:'경제금융',ds:'경제원리 투자 재무설계'},
{id:'career',ic:'💼',nm:'직업진로',ds:'직업탐색 면접 포트폴리오'},
{id:'coding',ic:'💻',nm:'IT코딩',ds:'프로그래밍 AI 데이터'},
"""
            html = html[:end_bracket] + new_subjects + html[end_bracket:]
            print('Added 3 new subjects to SUBJECTS array')

# Step 2: KIDS 객체에 economy/career/coding 키 추가
kids_end_marker = '};\n\n// ====='  # KIDS 닫는 부분
# KIDS 객체 끝 찾기
kids_start = html.find('const KIDS={')
adult_start = html.find('const ADULT={')
if kids_start > 0 and adult_start > 0:
    # KIDS 닫는 }; 찾기 (ADULT 시작 전)
    kids_close = html.rfind('};', kids_start, adult_start)
    if kids_close > 0 and 'economy:[' not in html[kids_start:adult_start]:
        new_kids = """economy:[
{l:1,t:'용돈 관리와 저축',s:'EBS',u:'https://www.ebs.co.kr/',d:'용돈 기입장 쓰기 저축의 중요성'},
{l:2,t:'화폐와 은행의 역할',s:'EBS',u:'https://www.ebs.co.kr/',d:'돈은 왜 필요할까 은행은 뭐하는 곳'},
{l:3,t:'어린이 경제 시뮬레이터',s:'YouTube',u:'https://www.youtube.com/',d:'가상 사업과 투자 경제 체험'},
],
career:[
{l:1,t:'다양한 직업 알아보기',s:'EBS',u:'https://www.ebs.co.kr/',d:'의사 선생님 소방관 프로그래머 등'},
{l:2,t:'내가 좋아하는 것 찾기',s:'YouTube',u:'https://www.youtube.com/',d:'적성검사와 꿈 찾기 활동'},
{l:3,t:'미래 직업 탐구',s:'YouTube',u:'https://www.youtube.com/',d:'AI 시대의 새로운 직업들'},
],
coding:[
{l:1,t:'Scratch 코딩 첫걸음',s:'Scratch',u:'https://scratch.mit.edu/',d:'블록 코딩으로 게임 만들기'},
{l:2,t:'엔트리 코딩',s:'엔트리',u:'https://playentry.org/',d:'한국형 블록 코딩 플랫폼'},
{l:3,t:'HTML/CSS 기초',s:'생활코딩',u:'https://opentutorials.org/course/3084',d:'나만의 웹페이지 만들기'},
{l:4,t:'Python 첫걸음',s:'칸아카데미',u:'https://ko.khanacademy.org/',d:'텍스트 코딩 입문'},
],
"""
        html = html[:kids_close] + new_kids + html[kids_close:]
        adult_start = html.find('const ADULT={')  # 위치 재계산
        print('Added economy/career/coding to KIDS')

# Step 3: ADULT 객체에도 추가
community_marker = '// ===== COMMUNITY'
adult_close_search = html.rfind('};', adult_start, html.find(community_marker, adult_start))
if adult_close_search > 0 and 'economy:[' not in html[adult_start:html.find(community_marker, adult_start)]:
    new_adult = """economy:[
{l:1,t:'경제학 입문 미시경제',s:'Khan Academy',u:'https://ko.khanacademy.org/economics-finance-domain',d:'수요 공급 시장균형 탄력성'},
{l:2,t:'거시경제학 기초',s:'Khan Academy',u:'https://ko.khanacademy.org/economics-finance-domain',d:'GDP 인플레이션 실업 통화정책'},
{l:3,t:'주식 투자 입문',s:'YouTube',u:'https://www.youtube.com/',d:'PER PBR ROE 재무제표 읽는법'},
{l:3,t:'재무설계 기초',s:'YouTube',u:'https://www.youtube.com/',d:'가계부 작성 지출통제 투자 입문'},
{l:4,t:'부동산 ETF 파생상품',s:'YouTube',u:'https://www.youtube.com/',d:'부동산 투자 ETF 옵션 선물'},
],
career:[
{l:1,t:'직업 탐색과 적성검사',s:'워크넷',u:'https://www.work.go.kr/',d:'직업심리검사 직업정보 탐색'},
{l:2,t:'이력서 자기소개서 작성법',s:'YouTube',u:'https://www.youtube.com/',d:'합격하는 이력서와 자소서 전략'},
{l:3,t:'면접 준비와 PT 스킬',s:'YouTube',u:'https://www.youtube.com/',d:'면접 유형별 대비법 프레젠테이션'},
{l:4,t:'AI시대 미래 직업 전망',s:'TED',u:'https://www.ted.com/',d:'AI가 바꿀 직업의 미래'},
],
coding:[
{l:1,t:'HTML CSS 기초 생활코딩',s:'생활코딩',u:'https://opentutorials.org/course/3084',d:'웹의 근간 HTML과 CSS 기초'},
{l:1,t:'JavaScript 입문',s:'생활코딩',u:'https://opentutorials.org/course/3085',d:'JavaScript 기초 문법과 웹 프로그래밍'},
{l:2,t:'Python 기초 나도코딩',s:'나도코딩',u:'https://www.youtube.com/@nadocoding',d:'파이썬 기초에서 실전 6시간 완성'},
{l:2,t:'freeCodeCamp 풀스택',s:'freeCodeCamp',u:'https://www.freecodecamp.org/',d:'HTML CSS JS React Node.js 풀 커리큘럼'},
{l:3,t:'Git GitHub 사용법',s:'YouTube',u:'https://www.youtube.com/',d:'버전관리와 협업 필수 도구'},
{l:4,t:'AI 머신러닝 입문',s:'3Blue1Brown',u:'https://www.youtube.com/@3blue1brown',d:'신경망 경사하강법 시각화 시리즈'},
],
"""
    html = html[:adult_close_search] + new_adult + html[adult_close_search:]
    print('Added economy/career/coding to ADULT')

# Step 4: JSON 데이터 삽입 (기존 과목에만)
# 위치 재계산
adult_start = html.find('const ADULT={')
community_pos = html.find(community_marker)

json_files = [
    ('data/kids_other_subjects.json', 'KIDS', {
        '음악':'music','스포츠':'sports','관찰탐구':'explore',
        '사회감성':'social','건강':'health','언어두뇌발달':'language','특별활동':'special'
    }),
]

for fpath, target, mapping in json_files:
    try:
        data = load_json(fpath)
        for kr, en in mapping.items():
            items = [mkitem(i) for i in data if i.get('subject') == kr]
            bound = 'const ADULT=' if target == 'KIDS' else community_marker
            html, n = insert_into_array(html, target, en, items, bound)
            if n:
                total += n
                print('%s.%s +%d' % (target, en, n))
    except Exception as e:
        print('Error %s: %s' % (fpath, e))

# adult_other_subjects
try:
    data = load_json('data/adult_other_subjects.json')
    if isinstance(data, list):
        am = {'music':'music','sports':'sports','nature_explore':'explore',
              'language_brain':'language','health':'health',
              'social_emotional':'social','special_activity':'special'}
        for rs in set(i.get('subject','') for i in data):
            en = am.get(rs, rs)
            items = [mkitem(i) for i in data if i.get('subject') == rs]
            html, n = insert_into_array(html, 'ADULT', en, items, community_marker)
            if n:
                total += n
                print('ADULT.%s +%d' % (en, n))
except Exception as e:
    print('Error adult_other: %s' % e)

# kids_history_math_science
try:
    data = load_json('data/kids_history_math_science.json')
    for s in ['history', 'math', 'science']:
        items = [mkitem(i) for i in data if i.get('subject') == s][:15]
        html, n = insert_into_array(html, 'KIDS', s, items, 'const ADULT=')
        if n:
            total += n
            print('KIDS.%s +%d' % (s, n))
except Exception as e:
    print('Error kids_hms: %s' % e)

# detail files
for fn, tgt, key in [
    ('adult_history_extra.json', 'ADULT', 'history'),
    ('kids_history_detail.json', 'KIDS', 'history'),
    ('adult_economy_detail.json', 'ADULT', 'economy'),
    ('adult_sports_detail.json', 'ADULT', 'sports'),
]:
    try:
        fp = 'data/' + fn
        if not os.path.exists(fp):
            continue
        data = load_json(fp)
        items = [mkitem(i) for i in data if isinstance(i, dict)]
        bound = 'const ADULT=' if tgt == 'KIDS' else community_marker
        html, n = insert_into_array(html, tgt, key, items, bound)
        if n:
            total += n
            print('%s.%s +%d' % (tgt, key, n))
    except Exception as e:
        print('Error %s: %s' % (fn, e))

# extra_contents (분류별)
try:
    data = load_json('data/extra_contents.json')
    kids_extra = {}
    adult_extra = {}
    for item in data:
        sub = item.get('subject', '')
        age = item.get('age', 'adult')
        k = None
        if any(x in sub for x in ['경제', '금융']): k = 'economy'
        elif any(x in sub for x in ['직업', '진로']): k = 'career'
        elif any(x in sub for x in ['물리', '역학', '화학', '생물', '지구', '천문']): k = 'science'
        elif any(x in sub for x in ['피아노', '바이올린', '기타', '드럼']): k = 'music'
        elif any(x in sub for x in ['골프', '복싱', '수영', '요가']): k = 'sports'
        else: k = 'special'
        d = kids_extra if age == 'kids' else adult_extra
        if k not in d: d[k] = []
        d[k].append(mkitem(item))
    for k, items in kids_extra.items():
        html, n = insert_into_array(html, 'KIDS', k, items, 'const ADULT=')
        if n: total += n; print('Kx.%s +%d' % (k, n))
    for k, items in adult_extra.items():
        html, n = insert_into_array(html, 'ADULT', k, items, community_marker)
        if n: total += n; print('Ax.%s +%d' % (k, n))
except Exception as e:
    print('Error extra: %s' % e)

# adult_education_7categories
try:
    data = load_json('data/adult_education_7categories.json')
    am = {'music':'music','sports':'sports','nature_exploration':'explore',
          'nature_explore':'explore','language_brain':'language','health':'health',
          'social_emotional':'social','special_activities':'special','special_activity':'special'}
    for rs in set(i.get('subject','') for i in data if isinstance(i, dict)):
        en = am.get(rs, rs)
        items = [mkitem(i) for i in data if isinstance(i, dict) and i.get('subject') == rs][:12]
        html, n = insert_into_array(html, 'ADULT', en, items, community_marker)
        if n: total += n; print('A7.%s +%d' % (en, n))
except Exception as e:
    print('Error 7cat: %s' % e)

# Save
with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)

print('\n=== Total inserted: %d ===' % total)

# JS 검증
result = subprocess.run(
    ['node', '-e',
     'const fs=require("fs");const h=fs.readFileSync("index.html","utf-8");'
     'const m=h.match(/<script>([\\s\\S]*)<\\/script>/);'
     'try{new Function(m[1]);console.log("JS_OK")}catch(e){console.log("JS_ERR:"+e.message.substring(0,200))}'],
    capture_output=True, text=True, encoding='utf-8', errors='replace'
)
print(result.stdout.strip() if result.stdout else 'No output')
