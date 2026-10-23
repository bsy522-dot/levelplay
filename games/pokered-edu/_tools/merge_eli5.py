"""2026-10-23 쉬운 설명 개편본을 게임 data/ 에 합친다 (기준: ELI5_GUIDE.md).
  - lectures_*.json : {주제 id: 강의} → data/lectures.json 의 같은 주제를 통째로 바꾼다
  - q_*.json        : [문제] → 같은 id 의 문제를 찾아 글(q·help·pic·a·why·steps·wrong·viz·need)만 바꾼다
                       정답 번호 c 와 보기 개수가 원본과 다르면 넣지 않는다 (정답이 바뀌는 사고 방지)
  - videos.json     : {주제 id: [{id, t, ...}]} → 강의의 video 칸 (앞의 2개)
기존 data 파일은 D:\\AI\\_deleted_files 아래로 복사해 둔 뒤 바꾼다(지우지 않음).
실행: python _tools/merge_eli5.py <폴더> [--dry]"""
import glob, json, os, shutil, sys, time

GAME = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(GAME, 'data')
KEEP = os.path.join(r'D:\AI\_deleted_files', 'pokered-edu_data_eli5_' + time.strftime('%Y%m%d_%H%M%S'))
BANKS = ['science_a.json', 'science_b.json', 'science_c.json', 'human.json', 'arts.json', 'jobs.json', 'concept_math.json']
TEXT = ['q', 'a', 'why', 'wrong']            # 반드시 있어야 하는 글
OPT = ['help', 'pic', 'steps', 'viz', 'need']  # 있으면 바꾸고, null 이면 지운다

def load(p):
    with open(p, encoding='utf-8') as f:
        return json.load(f)

def main():
    sys.stdout.reconfigure(encoding='utf-8')
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    dry = '--dry' in sys.argv
    src = args[0] if args else '.'
    banks = {n: load(os.path.join(DATA, n)) for n in BANKS}
    where = {q['id']: (n, i) for n, items in banks.items() for i, q in enumerate(items)}
    lectures = load(os.path.join(DATA, 'lectures.json'))
    probs, nq, nl, nv = [], 0, 0, 0
    touched = set()

    for p in sorted(glob.glob(os.path.join(src, 'q_*.json'))):
        for d in load(p):
            qid = d.get('id')
            if qid not in where:
                probs.append(f'{os.path.basename(p)}: 없는 문제 id {qid}'); continue
            n, i = where[qid]
            o = banks[n][i]
            if d.get('c') != o['c'] or len(d.get('a') or []) != len(o['a']):
                probs.append(f'{qid}: 정답 번호/보기 수가 원본과 다름 (원본 c={o["c"]}, {len(o["a"])}개)'); continue
            if any(not d.get(k) for k in TEXT):
                probs.append(f'{qid}: 빠진 글 {[k for k in TEXT if not d.get(k)]}'); continue
            need_wrong = {str(k) for k in range(len(o['a'])) if k != o['c']}
            if set(map(str, d['wrong'].keys())) != need_wrong:
                probs.append(f'{qid}: 오답 설명 칸이 {sorted(d["wrong"])} (필요 {sorted(need_wrong)})'); continue
            for k in TEXT:
                o[k] = d[k]
            for k in OPT:
                if k in d:
                    if d[k] in (None, '', []): o.pop(k, None)
                    else: o[k] = d[k]
            touched.add(n); nq += 1

    for p in sorted(glob.glob(os.path.join(src, 'lectures_*.json'))):
        for lid, lec in load(p).items():
            if lid not in lectures:
                probs.append(f'{os.path.basename(p)}: 없는 강의 주제 {lid}'); continue
            if not lec.get('slides'):
                probs.append(f'{lid}: 슬라이드 없음'); continue
            old_vid = lectures[lid].get('video')
            lectures[lid] = {**lec, 'verified': True}
            if old_vid and 'video' not in lec: lectures[lid]['video'] = old_vid
            nl += 1

    vp = os.path.join(src, 'videos.json')
    if os.path.exists(vp):
        for lid, vids in load(vp).items():
            if lid in lectures and vids:
                lectures[lid]['video'] = [{'id': v['id'], 't': v['t']} for v in vids[:2]]
                nv += 1

    print(f'문제 {nq}개, 강의 {nl}개, 영상 {nv}주제 반영' + (' (시험 — 저장 안 함)' if dry else ''))
    for x in probs: print('  ✗', x)
    if dry: return 1 if probs else 0
    os.makedirs(KEEP, exist_ok=True)
    def write(name, obj):
        dst = os.path.join(DATA, name)
        shutil.copy2(dst, os.path.join(KEEP, name))
        with open(dst, 'w', encoding='utf-8') as f:
            json.dump(obj, f, ensure_ascii=False, separators=(',', ':'))
    for n in sorted(touched): write(n, banks[n])
    if nl or nv: write('lectures.json', lectures)
    print('원본 보관:', KEEP)
    return 1 if probs else 0

if __name__ == '__main__':
    sys.exit(main())
