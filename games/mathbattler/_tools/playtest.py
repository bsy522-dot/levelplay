"""mathbattler 플레이테스트 — 상태로 증명한다. '돌아간다'의 판정은 문자열이 아니라 수치.
python _tools/playtest.py"""
import os
import re
import subprocess
import sys
import time
from playwright.sync_api import sync_playwright

sys.stdout.reconfigure(encoding='utf-8')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8901
BASE = f'http://127.0.0.1:{PORT}/index.html'
SHOT = os.path.join(ROOT, '_tools', 'shot')
os.makedirs(SHOT, exist_ok=True)

srv = subprocess.Popen([sys.executable, '-m', 'http.server', str(PORT), '--bind', '127.0.0.1'],
                       cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.4)

fails = []


def ok(name, cond, extra=''):
    print(('  PASS ' if cond else '  FAIL ') + name + (('  ' + str(extra)) if extra else ''))
    if not cond:
        fails.append(name)


try:
    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
        errs = []
        pg.on('console', lambda m: errs.append(m.text) if m.type == 'error' else None)
        pg.on('pageerror', lambda e: errs.append('PAGEERROR ' + str(e)))
        pg.goto(BASE, wait_until='networkidle')
        pg.wait_for_timeout(1400)

        print('== 1. 부팅 ==')
        ok('로딩 화면 제거됨', pg.evaluate("!document.getElementById('loading')"))
        ok('맵 화면 보임', pg.evaluate("!document.getElementById('screen-map').classList.contains('hidden')"))
        hero0 = pg.evaluate("({x:MB.Game.hero.x,y:MB.Game.hero.y})")
        ok('히어로 좌표 존재', hero0['x'] > 0, hero0)
        gates = pg.evaluate("MB.Game.world.gates.length")
        ok('몬스터 배치 46개', gates == 46, 'gates=%d' % gates)
        ok('도서관 2곳', pg.evaluate("MB.Game.world.libs.length") == 2)

        print('== 2. 이동 (D-pad = hold, click 은 무효) ==')
        pg.keyboard.down('ArrowRight')
        pg.wait_for_timeout(420)
        pg.keyboard.up('ArrowRight')
        hero1 = pg.evaluate("({x:MB.Game.hero.x,y:MB.Game.hero.y})")
        moved = hero1['x'] - hero0['x']
        ok('우이동 실제로 반영', moved > 20, 'Δx=%.0f' % moved)
        pg.keyboard.down('ArrowDown')
        pg.wait_for_timeout(420)
        pg.keyboard.up('ArrowDown')
        hero2 = pg.evaluate("({x:MB.Game.hero.x,y:MB.Game.hero.y})")
        ok('하이동 실제로 반영', hero2['y'] - hero1['y'] > 20, 'Δy=%.0f' % (hero2['y'] - hero1['y']))

        print('== 3. 배틀 진입 ==')
        pg.click('#btn-fight')
        pg.wait_for_timeout(700)
        ok('배틀 화면 전환', pg.evaluate("!document.getElementById('screen-battle').classList.contains('hidden')"))
        ok('몬스터 이미지 로드됨', pg.evaluate(
            "(()=>{const i=document.getElementById('b-mimg');return i.naturalWidth>0;})()"))
        q0 = pg.evaluate("MB.Game.battle.qs.length")
        ok('몬스터 HP == 문제수', pg.evaluate("MB.Game.battle.hpMax()") == q0, 'hp=%d q=%d' % (pg.evaluate("MB.Game.battle.hpMax()"), q0))
        hp0 = pg.evaluate("MB.Game.battle.hp()")
        streak0 = pg.evaluate("MB.Game.state.streak")
        pg.screenshot(path=os.path.join(SHOT, '1_battle.png'))

        print('== 4. 정답 = 대미지 ==')
        cq = pg.evaluate("MB.Game.battle.current().c")
        pg.click(f'#b-opts .opt[data-i="{cq}"]')
        pg.wait_for_timeout(800)
        hp1 = pg.evaluate("MB.Game.battle.hp()")
        ok('정답 시 몬스터 HP 감소', hp1 == hp0 - 1, '%d→%d' % (hp0, hp1))
        ok('스트릭 증가', pg.evaluate("MB.Game.state.streak") == streak0 + 1)
        ok('GP 증가', pg.evaluate("MB.Game.state.gp") > 0, 'gp=%d' % pg.evaluate("MB.Game.state.gp"))
        ok('정답 표시됨(.right)', pg.evaluate("document.querySelectorAll('#b-opts .opt.right').length") == 1)

        print('== 5. 오답 = 피격 + 몬스터 회복 ==')
        cq2 = pg.evaluate("MB.Game.battle.current().c")
        wrong = (cq2 + 1) % len(pg.evaluate("MB.Game.battle.current().a"))
        herohp0 = pg.evaluate("MB.Game.state.heroHp")
        hp2 = pg.evaluate("MB.Game.battle.hp()")
        pg.click(f'#b-opts .opt[data-i="{wrong}"]')
        pg.wait_for_timeout(1200)
        ok('오답 시 몬스터 HP 회복', pg.evaluate("MB.Game.battle.hp()") == hp2 + 1,
           '%d→%d' % (hp2, pg.evaluate("MB.Game.battle.hp()")))
        ok('오답 시 내 HP 감소', pg.evaluate("MB.Game.state.heroHp") == herohp0 - 1)
        ok('스트릭 0 리셋', pg.evaluate("MB.Game.state.streak") == 0)
        ok('오답 표시됨(.wrong)', pg.evaluate("document.querySelectorAll('#b-opts .opt.wrong').length") == 1)
        pg.screenshot(path=os.path.join(SHOT, '2_wrong.png'))

        print('== 6. 전투 중 학습(힌트) ==')
        pg.click('#hint-btn')
        pg.wait_for_timeout(400)
        ok('힌트 박스 표시', pg.evaluate("!document.getElementById('hint-box').classList.contains('hidden')"))
        ok('힌트 버튼 비활성', pg.evaluate("document.getElementById('hint-btn').disabled"))
        ok('힌트 사용 기록', pg.evaluate("MB.Game.state.hintTotal") == 1)

        print('== 7. 승리 → 결과 화면 ==')
        for _ in range(12):
            if not pg.evaluate("MB.Game.battle.active"):
                break
            cq3 = pg.evaluate("MB.Game.battle.current().c")
            if cq3 is None:
                break
            pg.click(f'#b-opts .opt[data-i="{cq3}"]')
            pg.wait_for_timeout(750)
        pg.wait_for_timeout(600)
        ok('전투 종료 후 결과 화면', pg.evaluate(
            "!document.getElementById('screen-result').classList.contains('hidden')"))
        ok('승리로 기록됨', pg.evaluate("Object.keys(MB.Game.state.defeated).length") == 1,
           pg.evaluate("Object.keys(MB.Game.state.defeated)"))
        pg.screenshot(path=os.path.join(SHOT, '3_result.png'))

        print('== 8. 도서관 → 학습 ==')
        pg.click('#rs-back')
        pg.wait_for_timeout(400)
        pg.click('#btn-lib')
        pg.wait_for_timeout(500)
        ok('도서관 화면', pg.evaluate("!document.getElementById('screen-lib').classList.contains('hidden')"))
        rows = pg.evaluate("document.querySelectorAll('#lib-list .lib-row').length")
        ok('단원 46행', rows == 46, 'rows=%d' % rows)
        pg.screenshot(path=os.path.join(SHOT, '4_library.png'))
        pg.click('#lib-list .lib-row .lr-b')
        pg.wait_for_timeout(500)
        ok('학습 화면', pg.evaluate("!document.getElementById('screen-study').classList.contains('hidden')"))
        ok('본문 렌더', pg.evaluate("document.getElementById('st-content').innerHTML.length") > 50)
        ok('게이트 박스 표시', pg.evaluate("document.querySelectorAll('#st-gate .grow').length") == 3)
        pg.screenshot(path=os.path.join(SHOT, '5_study.png'))

        print('== 9. 새로고침 후 저장 유지 ==')
        gp = pg.evaluate("MB.Game.state.gp")
        pg.reload(wait_until='networkidle')
        pg.wait_for_timeout(1300)
        ok('GP 유지', pg.evaluate("MB.Game.state.gp") == gp, '%d→%d' % (gp, pg.evaluate("MB.Game.state.gp")))
        ok('격파 기록 유지', pg.evaluate("Object.keys(MB.Game.state.defeated).length") == 1)

        print('== 10. 콘솔 오류 ==')
        real = [e for e in errs if 'favicon' not in e.lower()]
        ok('JS 오류 0건', len(real) == 0, real[:3])

        # 가로(가로모드) 확인
        pg.set_viewport_size({'width': 844, 'height': 390})
        pg.wait_for_timeout(600)
        pg.screenshot(path=os.path.join(SHOT, '6_landscape.png'))
        ok('가로에서 배틀 여백 없음', pg.evaluate(
            "document.documentElement.scrollWidth <= innerWidth + 2"),
            'scrollW=%d vw=%d' % (pg.evaluate("document.documentElement.scrollWidth"), pg.evaluate("innerWidth")))
        b.close()
finally:
    srv.terminate()

print('\n' + ('전부 통과' if not fails else '실패 %d건: %s' % (len(fails), fails)))
sys.exit(1 if fails else 0)
