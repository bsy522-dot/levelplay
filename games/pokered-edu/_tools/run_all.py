"""브라우저 테스트 전체를 차례로 돌린다 (배포 전 확인용).
실행: python _tools/run_all.py [url | --localfs]
각 테스트의 실패 줄과 결과 줄만 모아서 보여 준다. 하나라도 실패하면 종료 코드 1."""
import os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.dirname(HERE)
LOCALFS = '--localfs' in sys.argv  # 서버·네트워크 없이 디스크에서 직접 (_localfs.mjs)
args = [a for a in sys.argv[1:] if not a.startswith('--')]
URL = 'http://localfs.test/' if LOCALFS else (args[0] if args else '')
SUITES = [
    ('slottest', {}), ('lessontest', {}), ('lecturetest', {}), ('settingstest', {}),
    ('boxtest', {}), ('playtest', {}), ('playtest(폰)', {'VIEW': 'phone'}), ('touchtest', {}),
    ('compattest', {}), ('ch2test', {}), ('ch3test', {}),
    ('ch4test', {}), ('ch5test', {}), ('ch6test', {}), ('ch7test', {}), ('ch8test', {}), ('ch9test', {}),
]
bad = 0
# compattest 는 예전 판(지금 기기에 깔린 판 = 마지막 커밋) 코드가 필요하다.
# 준비: git -C <저장소> archive -o head.tar HEAD games/pokered-edu → tar -xf → 그 games/pokered-edu 폴더를 COMPAT_OLD 로
OLD = os.environ.get('COMPAT_OLD', '')
def prepare_old():
    return OLD
for name, extra in SUITES:
    if name == 'compattest' and not OLD:
        print('== compattest: 건너뜀 (COMPAT_OLD 없음)'); continue
    script = name.split('(')[0]
    env = dict(os.environ, **extra)
    if 'VIEW' in extra:
        env['SHOT_DIR'] = env.get('SHOT_DIR', '') or os.path.join(os.environ.get('TEMP', '.'), 'shots_phone')
    cmd = ['node'] + (['--import', __import__('pathlib').Path(HERE, '_localfs.mjs').as_uri()] if LOCALFS else []) + [os.path.join(HERE, script + '.mjs')] + ([prepare_old()] if script == 'compattest' and OLD else [URL] if URL else [])
    try:
        r = subprocess.run(cmd, cwd=GAME, env=env, capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=2400)
        out, code = r.stdout + r.stderr, r.returncode
    except subprocess.TimeoutExpired:
        out, code = '시간 초과(40분)', 1
    lines = [l for l in out.splitlines() if '✗' in l or '결과' in l or '시간 초과' in l]
    print(f'== {name}: {"통과" if code == 0 else "실패"}')
    for l in lines:
        print('   ' + l.strip())
    bad += code != 0
    sys.stdout.flush()
print('전체:', '모두 통과' if not bad else f'{bad}개 묶음 실패')
sys.exit(1 if bad else 0)
