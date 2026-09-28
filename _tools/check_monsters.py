import json, sys, collections
sys.stdout.reconfigure(encoding='utf-8')
d = json.load(open('games/mathbattler/data/monsters.json', encoding='utf-8'))

allq, tiers = [], []
for s in d['subjectOrder']:
    for u in d['subjects'][s]['units']:
        for t in u['topics']:
            allq += t['quiz']
            tiers.append(t['tier'])

uniq = len({q['q'] for q in allq})
print('총 문제 %d  고유 %d  중복 %d' % (len(allq), uniq, len(allq) - uniq))
print('몸풀 분포', dict(collections.Counter(len(t['quiz']) for s in d['subjectOrder']
      for u in d['subjects'][s]['units'] for t in u['topics'])))
print('tier 분포', dict(sorted(collections.Counter(tiers).items())))
bad = [q for q in allq if not q['a'] or q['c'] is None or q['c'] >= len(q['a'])]
print('손상된 문제(선택지/정답인덱스 이상) %d' % len(bad))
noexpl = sum(1 for q in allq if not q.get('expl'))
print('해설 없는 문제 %d' % noexpl)

print('\n--- 샘플 ---')
for s in d['subjectOrder']:
    for u in d['subjects'][s]['units'][:1]:
        for t in u['topics'][:2]:
            print('%s/%s L%d tier%d %s HP%d 문제%d' % (
                s, t['name'], t['level'], t['tier'],
                t['monster']['name'], t['monster']['hp'], len(t['quiz'])))
            for q in t['quiz'][:3]:
                print('   -', q['q'][:56], '=>', q['a'][q['c']])

print('\n--- 몬스터 사다리(티어별 앞 6) ---')
for tr in (1, 2, 3, 4):
    row = []
    for s in d['subjectOrder']:
        for u in d['subjects'][s]['units']:
            for t in u['topics']:
                if t['tier'] == tr:
                    row.append('%s/%s' % (s[:2], t['name'][:10]))
    print(' tier%d %d마리: %s' % (tr, len(row), ' · '.join(row[:6])))
