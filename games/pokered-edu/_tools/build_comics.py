"""강의용 만화 만들기: 《수학이 태어난 날》 컷(levelplay/assets/comics_pages/math_history)을
웹용 720px webp 로 줄여 art/comic/<회>/NN.webp 와 art/comic/index.json 을 만든다. 원본은 읽기만 한다.
실행: python _tools/build_comics.py"""
import json, os, re
from PIL import Image

SRC_ROOT = r'D:\AI\03_신사업\levelplay'
PANELS = os.path.join(SRC_ROOT, 'data', 'comic_panels.json')
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'art', 'comic')
EPS = ['s1e01', 's1e02', 's1e03', 's1e04', 's1e05', 's2e02', 's2e03', 's2e04', 's2e05']
W = 720

def main():
    panels = json.load(open(PANELS, encoding='utf-8'))
    index, total = {}, 0
    for ep in EPS:
        # 페이지 순서대로 컷 목록을 이어 붙인다 (p1, p2, … 순)
        pages = sorted([k for k in panels if f'/{ep}/' in k], key=lambda k: int(re.search(r'/p(\d+)\.', k).group(1)))
        cuts = [c for k in pages for c in panels[k]]
        os.makedirs(os.path.join(OUT, ep), exist_ok=True)
        n = 0
        for c in cuts:
            src = os.path.join(SRC_ROOT, c.replace('/', os.sep))
            if not os.path.exists(src):
                continue
            n += 1
            im = Image.open(src).convert('RGB')
            if im.width > W:
                im = im.resize((W, round(im.height * W / im.width)), Image.LANCZOS)
            dst = os.path.join(OUT, ep, f'{n:02d}.webp')
            im.save(dst, 'WEBP', quality=72, method=6)
            total += os.path.getsize(dst)
        index[ep] = n
        print(ep, n, '컷')
    json.dump(index, open(os.path.join(OUT, 'index.json'), 'w', encoding='utf-8'))
    print('합계', sum(index.values()), '컷,', round(total / 2**20, 1), 'MB')

if __name__ == '__main__':
    main()
