"""걸어서 갈 수 있는지 점검: 집에서 출발해 걷기·턱(한 방향)·문·사다리·지도 연결만으로 목표 지점에 닿는지 찾는다.
실행: python _tools/reach.py [지도이름] [--hm cut,surf]
  --hm: 그 필드 기술이 있다고 치고 본다 (cut = 풀베기 나무 Y 통과, surf = 물 ~ 통과). 기본 = cut (4판부터 필요)
(NPC가 막는 칸, 이야기 조건은 무시 — 순수 지형 연결만 본다)"""
import json, os, collections
HERE = os.path.dirname(__file__)
MAPD = os.path.join(HERE, '..', 'data', 'maps')
DATA = open(os.path.join(HERE, '..', 'js', 'data.js'), encoding='utf-8').read()
import re
ids = re.findall(r"'([A-Za-z0-9]+)'", DATA[DATA.index('MAP_IDS'):DATA.index('];', DATA.index('MAP_IDS'))])
M = {i: json.load(open(os.path.join(MAPD, i + '.json'), encoding='utf-8')) for i in ids}
WALK = set('.,"*D_mU')
import sys as _s
_hm = _s.argv[_s.argv.index('--hm') + 1].split(',') if '--hm' in _s.argv else ['cut']
if 'cut' in _hm: WALK |= {'Y'}
if 'surf' in _hm: WALK |= {'~'}
DIRS = {'up': (0, -1), 'down': (0, 1), 'left': (-1, 0), 'right': (1, 0)}
LEDGE = {'v': 'down', '<': 'left', '>': 'right'}

def cell(m, x, y):
    if 0 <= x < m['w'] and 0 <= y < m['h']:
        return m['grid'][y][x]
    return None

def warp_target(mid, wx, wy, last_outdoor):
    m = M[mid]
    for w in m['warps']:
        if w['x'] == wx and w['y'] == wy:
            dest = w['to'] or last_outdoor
            if dest not in M:
                return None
            dm = M[dest]
            tw = dm['warps'][w['toWarp']] if w['toWarp'] < len(dm['warps']) else dm['warps'][0]
            tx, ty = tw['x'], tw['y']
            if dm['outdoor']:  # 게임과 같은 규칙 (overworld.js useWarp)
                below = cell(dm, tx, ty + 1)
                if tx == 0: tx = 1
                elif tx == dm['w'] - 1: tx = dm['w'] - 2
                else: ty = ty + 1 if below and below in WALK and below != 'D' else ty - 1
            return dest, tx, ty
    return None

start = ('RedsHouse2F', 5, 6, 'PalletTown')
seen = {start}
q = collections.deque([start])
while q:
    mid, x, y, lo = q.popleft()
    m = M[mid]
    lo2 = mid if m['tileset'] == 'Overworld' else lo
    c = cell(m, x, y)
    nexts = []
    if c in ('D', 'U'):
        t = warp_target(mid, x, y, lo2)
        if t:
            nexts.append((t[0], t[1], t[2], lo2))
    if mid == 'SilphCoElevator':  # 게임: 엘리베이터에 타면 층을 고른다 (events.js silphElevator)
        for fl, fx in (('SilphCo1F', 20), ('SilphCo5F', 20), ('SilphCo7F', 18), ('SilphCo11F', 13)):
            if fl in M: nexts.append((fl, fx, 1, lo2))
    for d, (dx, dy) in DIRS.items():
        nx, ny = x + dx, y + dy
        nc = cell(m, nx, ny)
        if nc is None:
            side = {'up': 'north', 'down': 'south', 'left': 'west', 'right': 'east'}[d]
            con = m['connections'].get(side)
            if con and con['to'] in M:
                tm = M[con['to']]
                if side == 'north': tx, ty = x - con['offset'], tm['h'] - 1
                elif side == 'south': tx, ty = x - con['offset'], 0
                elif side == 'west': tx, ty = tm['w'] - 1, y - con['offset']
                else: tx, ty = 0, y - con['offset']
                if cell(tm, tx, ty) in WALK:
                    nexts.append((con['to'], tx, ty, lo2))
            elif not m['outdoor'] and c == 'D' and d == 'down':
                t = warp_target(mid, x, y, lo2)
                if t: nexts.append((t[0], t[1], t[2], lo2))
            continue
        if nc in LEDGE and LEDGE[nc] == d:
            lx, ly = nx + dx, ny + dy
            if cell(m, lx, ly) in WALK:
                nexts.append((mid, lx, ly, lo2))
            continue
        if nc in WALK:
            nexts.append((mid, nx, ny, lo2))
    for n in nexts:
        if n not in seen:
            seen.add(n); q.append(n)

reached = collections.defaultdict(set)
for mid, x, y, lo in seen:
    reached[mid].add((x, y))
GOALS = [('OaksLab', 5, 3, '오박사 앞'), ('ViridianMart', 2, 5, '상록 상점 점원 앞(계산대 너머)'), ('ViridianForest', 1, 1, '상록숲 북쪽 출구'),
         ('PewterGym', 4, 2, '웅 앞'), ('Route3', 59, 10, '3번도로 끝'), ('MtMoonPokecenter', 3, 3, '달맞이산 센터 간호순 앞(카운터 너머)'),
         ('MtMoonB2F', 13, 8, '화석 과학자 옆'), ('Route4', 60, 10, '4번도로 동쪽'), ('CeruleanCity', 20, 20, '블루시티'),
         ('CeruleanGym', 4, 3, '이슬 앞'), ('CeruleanPokecenter', 3, 3, '블루시티 간호순 앞(카운터 너머)'),
         ('Route24', 10, 15, '너겟 브릿지 끝 아저씨 옆'), ('BillsHouse', 6, 6, '삐삐(이수재) 앞'), ('BillsHouse', 1, 5, '분리 PC 앞'),
         ('UndergroundPathNorthSouth', 2, 40, '지하통로 남쪽 끝'), ('VermilionGym', 5, 2, '마티스 앞'), ('VermilionPokecenter', 3, 3, '갈색시티 간호순 앞'),
         # 4판
         ('SSAnne2F', 37, 5, '상트앙느호 2층 선장실 앞 복도'), ('SSAnneCaptainsRoom', 4, 3, '선장 앞'), ('Route9', 59, 8, '9번도로 동쪽 끝'),
         ('RockTunnelPokecenter', 3, 3, '돌산터널 센터 간호순 앞'), ('LavenderTown', 10, 9, '보라타운'), ('LavenderPokecenter', 3, 3, '보라타운 간호순 앞'),
         ('UndergroundPathWestEast', 3, 5, '지하통로 서쪽 끝'), ('CeladonCity', 41, 10, '무지개시티 포켓몬센터 앞'), ('CeladonGym', 4, 4, '민화 앞'),
         ('CeladonPokecenter', 3, 3, '무지개시티 간호순 앞')]
bad = 0
for mid, x, y, label in GOALS:
    okk = (x, y) in reached[mid]
    bad += not okk
    print(('✓' if okk else '✗'), label, f'{mid}({x},{y})', '' if okk else f'— 이 지도에서 닿은 칸 {len(reached[mid])}개')
print('닿은 지도', len(reached), '/', len(M), ' 못 간 지도:', [i for i in M if i not in reached])
import sys
if len(sys.argv) > 1 and sys.argv[1] != '--hm':  # python _tools/reach.py 지도이름 → 닿은 칸을 @ 로 표시
    mm = M[sys.argv[1]]; RR = reached[sys.argv[1]]
    for yy, row in enumerate(mm['grid']):
        print(f'{yy:2} ' + ''.join('@' if (xx, yy) in RR else ch for xx, ch in enumerate(row)))
raise SystemExit(1 if bad else 0)
