"""브라우저 테스트 전체를 차례로 돌린다 (배포 전 확인용).
실행: python _tools/run_all.py [url]
각 테스트의 실패 줄과 결과 줄만 모아서 보여 준다. 하나라도 실패하면 종료 코드 1."""
import os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.dirname(HERE)
URL = sys.argv[1] if len(sys.argv) > 1 else ''
SUITES = [
    ('slottest', {}), ('lessontest', {}), ('lecturetest', {}), ('settingstest', {}),
    ('playtest', {}), ('playtest(폰)', {'VIEW': 'phone'}), ('touchtest', {}),
    ('ch2test', {}), ('ch3test', {}),
]
bad = 0
for name, extra in SUITES:
    script = name.split('(')[0]
    env = dict(os.environ, **extra)
    if 'VIEW' in extra:
        env['SHOT_DIR'] = env.get('SHOT_DIR', '') or os.path.join(os.environ.get('TEMP', '.'), 'shots_phone')
    cmd = ['node', os.path.join(HERE, script + '.mjs')] + ([URL] if URL else [])
    try:
        r = subprocess.run(cmd, cwd=GAME, env=env, capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=1200)
        out, code = r.stdout + r.stderr, r.returncode
    except subprocess.TimeoutExpired:
        out, code = '시간 초과(20분)', 1
    lines = [l for l in out.splitlines() if '✗' in l or '결과' in l or '시간 초과' in l]
    print(f'== {name}: {"통과" if code == 0 else "실패"}')
    for l in lines:
        print('   ' + l.strip())
    bad += code != 0
    sys.stdout.flush()
print('전체:', '모두 통과' if not bad else f'{bad}개 묶음 실패')
sys.exit(1 if bad else 0)
