"""원작(pret/pokered 블록셋 + open-pokered 맵 JSON)에서 '칸 종류'만 뽑아 게임용 지도 JSON을 만든다.
원작 그림은 쓰지 않는다 — 각 칸이 길/풀숲/나무/물/건물 중 무엇인지만 남기고, 그림은 게임이 새로 그린다.

실행: python _tools/build_maps.py <원자료 폴더>   (폴더 안에 opr/maps, pret/gfx/blocksets 가 있어야 함)
출력: data/maps/<지도>.json
"""
import os, sys, json

SRC = sys.argv[1] if len(sys.argv) > 1 else os.environ.get('POKERED_SRC', '')
OUT = os.path.join(os.path.dirname(__file__), '..', 'data', 'maps')

TS = {  # 원작 타일셋 -> (블록셋 파일, 걸을 수 있는 타일)
    'Overworld': ('overworld', {0x00,0x10,0x1b,0x20,0x21,0x23,0x2c,0x2d,0x2e,0x30,0x31,0x33,0x39,0x3c,0x3e,0x52,0x54,0x58,0x5b}),
    'Forest': ('forest', {0x1e,0x20,0x2e,0x30,0x34,0x37,0x39,0x3a,0x40,0x51,0x52,0x5a,0x5c,0x5e,0x5f}),
    'RedsHouse1': ('reds_house', {0x01,0x02,0x03,0x11,0x12,0x13,0x14,0x1c,0x1a}),
    'RedsHouse2': ('reds_house', {0x01,0x02,0x03,0x11,0x12,0x13,0x14,0x1c,0x1a}),
    'Mart': ('pokecenter', {0x11,0x1a,0x1c,0x3c,0x5e}),
    'Pokecenter': ('pokecenter', {0x11,0x1a,0x1c,0x3c,0x5e}),
    'Dojo': ('gym', {0x11,0x16,0x19,0x2b,0x3c,0x3d,0x3f,0x4a,0x4c,0x4d,0x03}),
    'Gym': ('gym', {0x11,0x16,0x19,0x2b,0x3c,0x3d,0x3f,0x4a,0x4c,0x4d,0x03}),
    'House': ('house', {0x01,0x12,0x14,0x28,0x32,0x37,0x44,0x54,0x5c}),
    'ForestGate': ('gate', {0x01,0x12,0x14,0x1a,0x1c,0x37,0x38,0x3b,0x3c,0x5e}),
    'Gate': ('gate', {0x01,0x12,0x14,0x1a,0x1c,0x37,0x38,0x3b,0x3c,0x5e}),
    'Cavern': ('cavern', {0x05,0x15,0x18,0x1a,0x20,0x21,0x22,0x2a,0x2d,0x30}),
    'Interior': ('interior', {0x04,0x0f,0x15,0x1f,0x3b,0x45,0x47,0x55,0x56}),
    'Underground': ('underground', {0x0b,0x0c,0x13,0x15,0x18}),
}

# 실내 막힌 칸의 가구 종류 (2x2 타일 서명 -> 기호). 눈으로 확인해 붙인 이름.
# W 벽  K 책장·진열장  P 화분  O 바위  Q 석상  t 탁자  C 카운터  M 기계·컴퓨터  V TV  b 침대  N 칠판·포스터
INDOOR = {
    'gym': {'14141414': 'w', '04041414': 'w', '090a191a': 'W', '02381213': 'Q', '05051010': 'W', '07081718': 'O', '0d0e1d1e': 'K', '22233233': 'M', '292a0d0e': 'K',
            '293b4e39': 't', '34435253': 'N', '3b2a394f': 't', '3b3b3939': 't', '5b5c3637': 'M', '5d5e555f': 'M'},
    'pokecenter': {'03281328': 'W', '04051415': 'W', '08081819': 'C', '080a1819': 'C', '0e0f1e1f': 'M', '10291029': 'W',
                   '10291918': 'W', '20213031': 'P', '22233233': 'M', '24253435': 'N', '26272a2b': 'M', '28022812': 'C',
                   '28282828': 'W', '28284e4f': 'W', '283a284a': 'C', '28591029': 'W', '2e2f3e3f': 'N', '38081819': 'C',
                   '38081918': 'C', '3b284b28': 'C', '40415051': 'K', '41435153': 'K', '42465256': 'M', '44455455': 'K',
                   '45475557': 'K', '484c4806': 't', '4c4d171d': 't', '4d07160d': 't', '4d491649': 't', '5a5b1918': 'C',
                   '5a5b2c2d': 'C'},
    'reds_house': {'00000000': 'W', '00002627': 'W', '00002729': 'W', '06071617': 'V', '0e0f1e1f': 'M', '22233233': 'K',
                   '24253435': 'K', '26273637': 't', '26293031': 't', '28293839': 't', '2a2b3a3b': 't', '2c2a3c3a': 't',
                   '2d2e3d3e': 'b', '3d3e3f2f': 'b', '40412021': 'V', '42433233': 'K', '44450809': 'P', '46471819': 'P'},
    'house': {'00000000': 'W', '0a0b0809': 'P', '0e0f1e1f': 'K', '1a1b1819': 'P', '24243434': 'K', '2627362f': 't',
              '26274647': 't', '26290e0f': 'K', '26293031': 't', '27292f39': 't', '2d2e3d3e': 'N', '2f393a3b': 't',
              '30311e1f': 'K', '362f3c3a': 't', '48495859': 'N', '494b5a5b': 'N', '56573c3a': 't'},
    'interior': {'10100809': 'W', '10100a10': 'W', '10101007': 'W', '10101010': 'W', '26263636': 'W', '18192829': 'M', '1a252a35': 'M',
                 '20173027': 'M', '38390102': 'M', '0b0c1b1c': 'M', '0d0e1d1e': 'M'},
    'gate': {'05061516': 'P', '07081718': 'W', '17183233': 'W', '25263536': 'P', '48484a4a': 'W'},
}
# 실내 걸을 수 있는 칸 중 특수: 계단(U), 발판(m)
INDOOR_WALK = {'0a0b1a1b': 'U', '0c0d1c1d': 'U', '04041414': 'm', '06061616': 'm', '0c0c1c1c': 'm', '5c5d5e5f': 'm'}

OW_TREE = {0x2a, 0x2b, 0x3a, 0x3b, 0x40, 0x41, 0x50, 0x51, 0x2d, 0x2e, 0x3d, 0x3e}
OW_PATH = {0x23, 0x39}
LEDGE_DOWN, LEDGE_LEFT, LEDGE_RIGHT = {0x36, 0x37}, {0x27}, {0x0d, 0x1d}

KIND = {  # 문이 이어지는 곳 -> 건물 종류
    'Pokecenter': 'center', 'Mart': 'mart', 'Gym': 'gym', 'OaksLab': 'lab', 'Museum': 'museum',
    'Gate': 'gate', 'SchoolHouse': 'school', 'Cave': 'cave', 'MtMoon': 'cave',
}

def kind_of(dest):
    for k, v in KIND.items():
        if dest and k in dest:
            return v
    return 'house'

def load(name):
    m = json.load(open(os.path.join(SRC, 'opr/maps', name, 'map.json'), encoding='utf-8'))
    asset, walk = TS[m['header']['tileset']]
    bst = open(os.path.join(SRC, 'pret/gfx/blocksets', asset + '.bst'), 'rb').read()
    w, h = m['header']['width'], m['header']['height']
    blk = open(os.path.join(SRC, 'opr/maps', name, 'map.blk'), 'rb').read()
    if len(blk) < w * h: blk += bytes([blk[-1]]) * (w * h - len(blk))  # 원작 파일이 짧은 지도(지하통로): 마지막 벽 블록으로 채움
    sig = [[tuple(bst[blk[(cy // 2) * w + cx // 2] * 16 + ((cy % 2) * 2 + j) * 4 + (cx % 2) * 2 + i]
                  for j in range(2) for i in range(2)) for cx in range(w * 2)] for cy in range(h * 2)]
    return m, asset, walk, sig

def hexs(s):
    return ''.join('%02x' % t for t in s)

ROCK = set()  # 1차 변환에서 배운 '바위산' 칸 모양
BLDG_KNOWN = set()  # 1차 변환에서 배운 '진짜 건물' 칸 모양

def classify(name):
    m, asset, walk, sig = load(name)
    H, W = len(sig), len(sig[0])
    warps = {(wp['x'], wp['y']) for wp in m['warps']}
    signs = {(s['x'], s['y']) for s in m['signs']}
    g = [['.'] * W for _ in range(H)]
    outdoor = asset in ('overworld', 'forest')
    for y in range(H):
        for x in range(W):
            s = sig[y][x]; bl = s[2]; ok = bl in walk
            if (x, y) in signs:
                g[y][x] = 'S'; continue
            if asset == 'overworld':
                if not ok:
                    if bl in LEDGE_DOWN: c = 'v'
                    elif bl in LEDGE_LEFT: c = '<'
                    elif bl in LEDGE_RIGHT: c = '>'
                    elif 0x14 in s or bl == 0x32: c = '~'
                    elif OW_TREE & set(s): c = 'T'
                    elif {0x0e, 0x55} & set(s): c = '#'
                    elif hexs(s) in ROCK: c = 'R'
                    else: c = 'B'
                elif (x, y) in warps: c = 'D'
                elif 0x52 in s: c = '"'
                elif 0x03 in s: c = '*'
                elif sum(t in OW_PATH for t in s) >= 2: c = ','
                else: c = '.'
            elif asset == 'forest':
                if not ok: c = 'T'
                elif (x, y) in warps: c = 'D'
                elif 0x20 in s: c = '"'
                else: c = '.'
            else:
                hx = hexs(s)
                if ok:
                    c = 'D' if (x, y) in warps and y == H - 1 else INDOOR_WALK.get(hx, '_')
                    if (x, y) in warps and y < H - 1 and c == '_': c = 'U'
                else:
                    c = INDOOR.get(asset, {}).get(hx, 'R' if asset == 'cavern' else 'W' if asset == 'underground' else 'f')
            g[y][x] = c
    # 실내 출입구 칸은 원작에서 밟고 지나가는 곳이니 막히지 않게
    if not outdoor:
        for (wx, wy) in warps:
            if g[wy][wx] not in 'DUm_':
                g[wy][wx] = 'D' if wy == H - 1 else 'U'
    # 바깥: 건물 칸을 묶어 한 채씩 (문 칸 포함)
    buildings = []
    if asset == 'overworld':
        def group():
            seen, comps = set(), []
            for y in range(H):
                for x in range(W):
                    if g[y][x] != 'B' or (x, y) in seen: continue
                    stack, comp = [(x, y)], []
                    seen.add((x, y))
                    while stack:
                        cx, cy = stack.pop(); comp.append((cx, cy))
                        for nx, ny in ((cx+1, cy), (cx-1, cy), (cx, cy+1), (cx, cy-1)):
                            if 0 <= nx < W and 0 <= ny < H and (nx, ny) not in seen and g[ny][nx] in 'BD':
                                seen.add((nx, ny)); stack.append((nx, ny))
                    comps.append(comp)
            return comps
        def box(comp):
            xs = [c[0] for c in comp]; ys = [c[1] for c in comp]
            return {'x': min(xs), 'y': min(ys), 'w': max(xs) - min(xs) + 1, 'h': max(ys) - min(ys) + 1, 'doors': []}
        # 산 전체가 건물과 한 덩어리로 묶였으면: 아는 건물 모양만 남기고 나머지는 바위산
        for comp in group():
            b = box(comp)
            if b['w'] > 16 or b['h'] > 10:
                cs = set(comp)
                for cx, cy in comp:
                    if g[cy][cx] == 'B': g[cy][cx] = 'R'
                # 원작 포켓몬센터·가게·집은 문 기준 가로 4 × 세로 4칸 (문은 왼쪽에서 두 번째 칸)
                for wp in m['warps']:
                    dx, dy = wp['x'], wp['y']
                    if (dx, dy) in cs and kind_of(wp.get('destMap')) in ('center', 'mart', 'house', 'gym', 'school', 'museum', 'gate'):
                        for yy in range(dy - 3, dy + 1):
                            for xx in range(dx - 1, dx + 3):
                                if 0 <= xx < W and 0 <= yy < H and g[yy][xx] == 'R': g[yy][xx] = 'B'
        for comp in group():
            b = box(comp)
            for wp in m['warps']:
                if (wp['x'], wp['y']) in comp:
                    b['doors'].append({'x': wp['x'], 'y': wp['y'], 'to': wp.get('destMap')})
            if not b['doors']:  # 문 없는 덩어리 = 바위 절벽(산)
                for cx, cy in comp: g[cy][cx] = 'R'; LEARN_ROCK.add(hexs(sig[cy][cx]))
                continue
            if b['w'] <= 16 and b['h'] <= 10:  # 진짜 건물 크기만 배운다
                for cx, cy in comp: LEARN_BLDG.add(hexs(sig[cy][cx]))
            b['kind'] = kind_of(b['doors'][0]['to'])
            buildings.append(b)
    return m, [''.join(r) for r in g], buildings, outdoor

LEARN_ROCK, LEARN_BLDG = set(), set()

# 아이가 막히지 않게 고친 칸 (지도, x, y, 새 칸). 원작에서 지나가기 어려운 곳만 최소로.
OVERRIDES = {
    # 블루시티 남쪽: 원작은 도둑맞은 집을 통과해야 5번도로로 갈 수 있음 → 나무줄 틈 아래 울타리 기둥 하나를 치움
    'CeruleanCity': [(16, 29, ',')],
    # 갈색시티 체육관 앞: 원작은 풀베기(HM01)로 베는 작은 나무 → 치움
    'VermilionCity': [(14, 19, ',')],
}
# '마지막 바깥 지도로' 나가는 출구 중, 지하통로처럼 반대편으로 나가야 하는 곳은 목적지를 못박는다
WARP_FIX = {'UndergroundPathRoute5': 'Route5', 'UndergroundPathRoute6': 'Route6'}

def main():
    os.makedirs(OUT, exist_ok=True)
    names = sorted(os.listdir(os.path.join(SRC, 'opr/maps')))
    # 1차: 문 없는 덩어리에서 바위산 칸 모양을 배운다 (건물에도 쓰이는 모양은 뺀다)
    for name in names: classify(name)
    ROCK.update(LEARN_ROCK - LEARN_BLDG)
    BLDG_KNOWN.update(LEARN_BLDG)
    for name in names:
        m, grid, buildings, outdoor = classify(name)
        for (ox, oy, oc) in OVERRIDES.get(name, []):
            row = list(grid[oy]); row[ox] = oc; grid[oy] = ''.join(row)
        out = {
            'id': name, 'outdoor': outdoor, 'tileset': m['header']['tileset'],
            'w': len(grid[0]), 'h': len(grid), 'grid': grid, 'buildings': buildings,
            'connections': {k: {'to': v['targetMap'], 'offset': v['offset'] * 2} for k, v in (m.get('connections') or {}).items()},
            'warps': [{'x': wp['x'], 'y': wp['y'], 'to': wp.get('destMap') or WARP_FIX.get(name), 'toWarp': wp['destWarpId']} for wp in m['warps']],
            'npcs': [{k: n[k] for k in ('spriteName', 'x', 'y', 'movement', 'facing', 'range', 'textId', 'isTrainer',
                                        'trainerClass', 'trainerSet', 'itemId') if k in n} for n in m['npcs']],
            'signs': m['signs'],
            'wild': (m.get('wild') or {}).get('red', {}).get('grass') if (m.get('wild') or {}).get('red', {}).get('grass', {}).get('encounterRate') else None,
        }
        json.dump(out, open(os.path.join(OUT, name + '.json'), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
        print(name, out['w'], 'x', out['h'], 'buildings', [(b['kind'], b['w'], b['h']) for b in buildings])

if __name__ == '__main__':
    main()
