"""포켓몬 스프라이트 46장 수집.
PokeAPI 공식 스프라이트 저장소에서 받아 art/ 에 ASCII 파일명으로 저장한다.
오프라인/일시 실패에 대비해 캐시 폴더에 원본을 남겨 둔다.

주의: 파일명은 반드시 ASCII. 한글 파일명은 웹 배포·캐시에서 위험하다.
"""
import json
import os
import sys
import time
import urllib.request

sys.stdout.reconfigure(encoding='utf-8')

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon'
CACHE = os.path.join(ROOT, '_tools', 'sprite_cache')

# 유아~초등 타깃이라 성별/진화 형태 구분 없이 1세대 기본형 위주.
# 번호 = 도감번호(Pokédex). 난이도(tier) 오름차순으로 난이도별 인상.
POKEMON = [
    # tier 1 — 갓 태어난 느낌, 동글동글
    1, 10, 13, 16, 25, 39, 50, 60, 63, 70, 95, 116, 129, 133, 152,
    # tier 2 — 조금 자람
    4, 7, 14, 19, 27, 35, 37, 41, 43, 74, 77, 84, 95, 96, 111, 120,
    # tier 3 — 꽤 성장, 실루엣 복잡
    3, 5, 6, 8, 9, 30, 34, 45, 49, 55, 62, 68, 76, 80, 94, 123,
    # tier 4 — 최종진화형, 위압적
    65, 130, 149, 150, 131, 143, 59, 108,
]


def key_for(dex):
    return 'pk%03d' % dex


def cached(dex):
    return os.path.join(CACHE, key_for(dex) + '.png')


def target(dex):
    return os.path.join(ROOT, 'art', key_for(dex) + '.png')


def download(dex):
    """공식아트 우선 → 없으면 픽셀스프라이트(프론트) → 없으면 실물 사진 스프라이트."""
    urls = [
        '%s/other/official-artwork/%d.png' % (BASE, dex),
        '%s/other/dream-world/%d.svg' % (BASE, dex),
        '%s/%d.png' % (BASE, dex),
        '%s/other/showdown/%d.gif' % (BASE, dex),
    ]
    for u in urls:
        try:
            req = urllib.request.Request(u, headers={'User-Agent': 'mathbattler-art/1.0'})
            with urllib.request.urlopen(req, timeout=25) as r:
                data = r.read()
            if len(data) > 300 and not data.lstrip()[:5].startswith(b'<?xml') and b'<svg' not in data[:400]:
                return data, u
        except Exception:
            continue
    return None, None


def main():
    os.makedirs(CACHE, exist_ok=True)
    os.makedirs(os.path.join(ROOT, 'art'), exist_ok=True)
    want = sorted(set(POKEMON))
    got = 0
    failed = []
    for i, dex in enumerate(want, 1):
        cp, tp = cached(dex), target(dex)
        if os.path.exists(tp) and os.path.getsize(tp) > 300:
            got += 1
            continue
        if os.path.exists(cp) and os.path.getsize(cp) > 300:
            with open(cp, 'rb') as f:
                data = f.read()
            src = '(캐시)'
        else:
            data, src = download(dex)
            if data is None:
                failed.append(dex)
                continue
            with open(cp, 'wb') as f:
                f.write(data)
        with open(tp, 'wb') as f:
            f.write(data)
        got += 1
        if i % 8 == 0 or i == len(want):
            print('  %d/%d 처리 (실패 %d)' % (i, len(want), len(failed)))
    print('완료: %d장 / 실패 %d장 %s' % (got, len(failed), failed if failed else ''))
    return 1 if failed else 0


if __name__ == '__main__':
    sys.exit(main())
