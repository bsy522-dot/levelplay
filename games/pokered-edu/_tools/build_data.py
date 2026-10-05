"""원작 1세대 데이터(open-pokered JSON) + 한국어 이름·도감 설명(PokeAPI CSV) -> 게임용 JSON.

실행: python _tools/build_data.py <원자료 폴더>   (폴더 안에 opr/, pokeapi/ 가 있어야 함)
출력: data/species.json, data/moves.json, data/trainers.json
"""
import os, sys, json, csv, glob, re

SRC = sys.argv[1] if len(sys.argv) > 1 else os.environ.get('POKERED_SRC', '')
OUT = os.path.join(os.path.dirname(__file__), '..', 'data')
KO = 3

def norm(s):
    return re.sub(r'[^a-z0-9]', '', s.lower())

def rows(name):
    with open(os.path.join(SRC, 'pokeapi', name), encoding='utf-8') as f:
        return list(csv.DictReader(f))

species_csv = {norm(r['identifier']): int(r['id']) for r in rows('pokemon_species.csv') if int(r['id']) <= 151}
names = {int(r['pokemon_species_id']): (r['name'], r['genus']) for r in rows('pokemon_species_names.csv')
         if r['local_language_id'] == str(KO)}
flavor = {}
for r in rows('pokemon_species_flavor_text.csv'):
    if r['language_id'] == str(KO) and int(r['species_id']) <= 151:
        flavor[int(r['species_id'])] = ' '.join(r['flavor_text'].split())  # 마지막(최신) 판을 쓴다
move_ids = {norm(r['identifier']): int(r['id']) for r in rows('moves.csv')}
move_ko = {int(r['move_id']): r['name'] for r in rows('move_names.csv') if r['local_language_id'] == str(KO)}
MOVE_ALIAS = {'hijumpkick': 'highjumpkick', 'psychicm': 'psychic'}

def species_id(name):
    n = norm(name)
    fix = {'nidoranf': 'nidoranf', 'nidoranm': 'nidoranm', 'mrmime': 'mrmime', 'farfetchd': 'farfetchd'}
    return species_csv[fix.get(n, n)]

def main():
    mons = {}
    for f in glob.glob(os.path.join(SRC, 'opr', 'pokemon', '*.json')):
        p = json.load(open(f, encoding='utf-8'))
        sid = species_id(p['species'])
        ko, genus = names[sid]
        t1, t2 = p['type1'], p['type2']
        pd = p.get('pokedex', {})
        mons[sid] = {
            'id': sid, 'key': p['species'], 'name': ko, 'genus': genus,
            'types': [t1] if t1 == t2 else [t1, t2],
            'base': p['baseStats'], 'catchRate': p['catchRate'], 'baseExp': p['baseExp'], 'growth': p['growthRate'],
            'start': [m for m in p['initialMoves'] if m != 'None'],
            'learn': [[l['level'], l['moveId']] for l in p['learnset']],
            'evo': [{'to': e['species'], 'level': e.get('level'), 'method': e['method'], 'item': e.get('item')} for e in p['evolutions']],
            'height': round((pd.get('heightFeet', 0) * 12 + pd.get('heightInches', 0)) * 2.54 / 100, 1),
            'weight': round(pd.get('weightDecipounds', 0) * 0.0453592, 1),
            'flavor': flavor.get(sid, ''),
        }
    key2id = {m['key']: m['id'] for m in mons.values()}
    for m in mons.values():
        for e in m['evo']:
            e['to'] = key2id[e['to']]
    moves = {}
    miss = []
    for f in glob.glob(os.path.join(SRC, 'opr', 'moves', '*.json')):
        mv = json.load(open(f, encoding='utf-8'))
        n = norm(mv['id']); n = MOVE_ALIAS.get(n, n)
        mid = move_ids.get(n)
        if mid is None:
            miss.append(mv['id'])
        moves[mv['id']] = {'id': mv['id'], 'name': move_ko.get(mid, mv['id']), 'type': mv['type'], 'power': mv['power'],
                           'acc': mv['accuracy'], 'pp': mv['pp'], 'effect': mv['effect']}
    trainers = {}
    for f in glob.glob(os.path.join(SRC, 'opr', 'trainers', '*.json')):
        t = json.load(open(f, encoding='utf-8'))
        trainers[t['class']] = [[[key2id[p['species']], p['level']] for p in party['pokemon']] for party in t['parties']]
    os.makedirs(OUT, exist_ok=True)
    dump = lambda name, obj: json.dump(obj, open(os.path.join(OUT, name), 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    dump('species.json', [mons[i] for i in sorted(mons)])
    dump('moves.json', moves)
    dump('trainers.json', trainers)
    print('species', len(mons), 'moves', len(moves), 'trainers', len(trainers), 'move name misses', miss)
    print('no flavor', [i for i in mons if not mons[i]['flavor']])

if __name__ == '__main__':
    main()
