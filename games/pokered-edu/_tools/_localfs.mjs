/* 서버 없이 시험하기: 모든 시험의 브라우저에 "http://localfs.test/" 를 디스크의 게임 폴더로 이어 준다.
 * 사용: node --import ./_tools/_localfs.mjs _tools/ch9test.mjs http://localfs.test/
 *       (python _tools/run_all.py --localfs 가 알아서 한다)
 * 서버 프로세스도 네트워크도 없어서 메모리가 모자라 서버가 꺼지는 때에도, 느린 네트워크 때문에 시험이 흔들리는 때에도 같은 결과가 나온다. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from 'file:///C:/Users/User/AppData/Roaming/npm/node_modules/playwright/index.mjs';

const GAME = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };
const handler = (route) => {
  let p = decodeURIComponent(new URL(route.request().url()).pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = path.join(GAME, p);
  if (!f.startsWith(GAME) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return route.fulfill({ status: 404, body: '' });
  return route.fulfill({ status: 200, contentType: MIME[path.extname(f).toLowerCase()] || 'application/octet-stream', body: fs.readFileSync(f), headers: { 'cache-control': 'no-store' } });
};
const PATTERN = 'http://localfs.test/**';
const origLaunch = chromium.launch.bind(chromium);
chromium.launch = async (...a) => {
  const b = await origLaunch(...a);
  const newContext = b.newContext.bind(b);
  b.newContext = async (...x) => { const c = await newContext(...x); await c.route(PATTERN, handler); return c; };
  const newPage = b.newPage.bind(b);
  b.newPage = async (...x) => { const p = await newPage(...x); await p.context().route(PATTERN, handler); return p; };
  return b;
};
