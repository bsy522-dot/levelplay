"""원허브용 배포: 게임 파일만 모아서 Cloudflare Pages(pokered-edu-bsy)에 올린다.
실행: python _tools/deploy.py            → https://pokered-edu-bsy.pages.dev/
(원허브 칸은 이 주소를 가리키므로, 게임만 고쳤다면 원허브는 다시 배포할 필요 없음)
필요: npx(wrangler 4.121.0), Cloudflare 로그인(`npx wrangler whoami` 로 확인)"""
import os, shutil, subprocess, tempfile, sys

GAME = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
KEEP = ['index.html', 'css', 'js', 'vendor', 'data', 'art']
PROJECT = 'pokered-edu-bsy'

def main():
    dist = os.path.join(tempfile.gettempdir(), 'pokered_edu_dist')
    if os.path.exists(dist):
        shutil.rmtree(dist)  # 임시 폴더(매번 새로 만드는 배포 복사본)
    os.makedirs(dist)
    for k in KEEP:
        src = os.path.join(GAME, k)
        (shutil.copytree if os.path.isdir(src) else shutil.copy2)(src, os.path.join(dist, k))
    cmd = f'npx -y wrangler@4.121.0 pages deploy "{dist}" --project-name={PROJECT} --branch=main --commit-dirty=true'
    print('>', cmd)
    r = subprocess.run(cmd, shell=True)
    sys.exit(r.returncode)

if __name__ == '__main__':
    main()
