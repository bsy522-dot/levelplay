"""원자료 내려받기 (게임에는 넣지 않는다 — 지도/데이터 변환용).

  python _tools/fetch_sources.py <받을 폴더> [지도이름,지도이름,...]

받는 것:
  opr/      open-pokered (MIT) — 1세대 포켓몬·기술·트레이너·지도 JSON, map.blk
  pret/     pret/pokered — 블록셋(.bst)·타일셋 그림·충돌표 (칸 종류 판정에만 사용, 그림은 게임에 안 들어감)
  pokeapi/  PokeAPI CSV — 한국어 이름·분류·도감 설명·기술 이름
그다음:
  python _tools/build_data.py <받을 폴더>
  python _tools/build_maps.py <받을 폴더>
"""
import os, sys, json, urllib.request, concurrent.futures as cf

OUT = sys.argv[1] if len(sys.argv) > 1 else 'pokered_src'
MAPS = (sys.argv[2].split(',') if len(sys.argv) > 2 else
        'PalletTown,Route1,ViridianCity,Route2,ViridianForest,ViridianForestSouthGate,ViridianForestNorthGate,PewterCity,PewterGym,'
        'RedsHouse1F,RedsHouse2F,BluesHouse,OaksLab,ViridianPokecenter,ViridianMart,PewterPokecenter,PewterMart,Route2Gate,ViridianSchoolHouse').split(',')
GH = 'https://raw.githubusercontent.com/'

def get(url, dst):
    if os.path.exists(dst):
        return
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    with urllib.request.urlopen(url, timeout=60) as r:
        open(dst, 'wb').write(r.read())

def main():
    # 1) open-pokered
    tree = json.loads(urllib.request.urlopen('https://api.github.com/repos/liuyanghejerry/open-pokered/git/trees/HEAD?recursive=1', timeout=60).read())
    jobs = []
    for x in tree['tree']:
        p = x['path']
        if x['type'] != 'blob' or not p.startswith('crates/pokered-data/'):
            continue
        rel = p[len('crates/pokered-data/'):]
        top = rel.split('/')[0]
        if top in ('pokemon', 'moves', 'trainers') or (top == 'maps' and rel.split('/')[1] in MAPS):
            jobs.append((GH + 'liuyanghejerry/open-pokered/HEAD/' + p, os.path.join(OUT, 'opr', rel)))
    # 2) pret/pokered
    for name in ['overworld', 'forest', 'reds_house', 'house', 'pokecenter', 'gym', 'gate']:
        for f in (f'gfx/blocksets/{name}.bst', f'gfx/tilesets/{name}.png'):
            jobs.append((GH + 'pret/pokered/master/' + f, os.path.join(OUT, 'pret', f)))
    # 3) PokeAPI CSV
    for f in ['move_names.csv', 'moves.csv', 'pokemon_species.csv', 'pokemon_species_names.csv', 'pokemon_species_flavor_text.csv']:
        jobs.append((GH + 'PokeAPI/pokeapi/master/data/v2/csv/' + f, os.path.join(OUT, 'pokeapi', f)))
    with cf.ThreadPoolExecutor(12) as ex:
        list(ex.map(lambda j: get(*j), jobs))
    print('받은 파일', len(jobs), '->', OUT)

if __name__ == '__main__':
    main()
