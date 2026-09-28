"""구문 검사 + U+FFFD(깨진 한글) 스캔. 실패하면 종료코드 1."""
import os
import re
import subprocess
import sys
import tempfile

sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

JS = [os.path.join(ROOT, 'js', f) for f in
      ('core.js', 'map.js', 'battle.js', 'ui.js', 'main.js')]
HTML = os.path.join(ROOT, 'index.html')

bad = 0
for p in JS:
    r = subprocess.run(['node', '--check', p], capture_output=True, text=True)
    if r.returncode:
        bad += 1
        print('SYNTAX FAIL', os.path.basename(p))
        print('\n'.join(r.stderr.splitlines()[:5]))
    else:
        print('ok  ', os.path.basename(p))

html = open(HTML, encoding='utf-8').read()
# 인라인 script 블록도 검사
for i, code in enumerate(re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', html, re.S)):
    t = tempfile.NamedTemporaryFile('w', suffix='.js', delete=False, encoding='utf-8')
    t.write(code)
    t.close()
    r = subprocess.run(['node', '--check', t.name], capture_output=True, text=True)
    if r.returncode:
        bad += 1
        print('SYNTAX FAIL inline#%d' % i)
        print('\n'.join(r.stderr.splitlines()[:5]))
    os.unlink(t.name)

fffd = html.count('\ufffd')
for p in JS:
    fffd += open(p, encoding='utf-8').read().count('\ufffd')
for p in (os.path.join(ROOT, 'skin.json'),):
    fffd += open(p, encoding='utf-8').read().count('\ufffd')

# CJK 한자/가나 혼입 (한국어가 아닌 문자)
weird = re.findall(r'[\u4e00-\u9fff\u3040-\u30ff]', html + ''.join(
    open(p, encoding='utf-8').read() for p in JS))

print('\n깨진글자(U+FFFD): %d' % fffd)
print('CJK 한자/가나 혼입: %d %s' % (len(weird), ''.join(sorted(set(weird))[:20])))
if fffd or weird:
    bad += 1
print('구문 OK' if not bad else '문제 %d건' % bad)
sys.exit(1 if bad else 0)
