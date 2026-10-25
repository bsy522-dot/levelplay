/* 태블릿 앱 안의 세이브 좌표를 '포켓몬센터 밖'으로 옮긴다.
 * run-as 로 앱 데이터에 들어가 localStorage 를 직접 고친다.
 * ★포켓몬·배지·도감 등 진행은 절대 건드리지 않는다. map/x/y 세 값만 바꾼다.
 *
 * 대상: 회색시티(병석님 원래 위치) 포켓몬센터 앞 (13,26)
 */
import { chromium } from 'file:///C:/Users/User/AppData/Roaming/npm/node_modules/playwright/index.mjs';
import { execSync } from 'child_process';
import fs from 'fs';

const ADB = 'D:/AI/06_도구/Android/platform-tools/adb.exe';
const S = '100.101.220.99:40075';
const OUT = 'D:/_output/data/pokered-save-backup';
const sh = (c) => execSync(`"${ADB}" -s ${S} shell ${c}`, { encoding: 'utf-8', maxBuffer: 64e6 });

/* 레벨디브 값을 앱 안에서 읽어 JSON 으로 뽑는 방법:
   앱을 띄워 localStorage 를 JS 로 읽어 base64 로 뽑아낸 뒤, 좌표만 고쳐 다시 심는다. */
console.log('=== 1) 앱 기동 ===');
sh('am force-stop com.prime.pokerededu');
execSync(`"${ADB}" -s ${S} shell logcat -c`, { encoding: 'utf-8' });
execSync(`"${ADB}" -s ${S} shell monkey -p com.prime.pokerededu -c android.intent.category.LAUNCHER 1`, { encoding: 'utf-8' });
await new Promise(r => setTimeout(r, 30000));

console.log('=== 2) 앱이 실제로 서버에 붙었나 ===');
const log = execSync(`"${ADB}" -s ${S} shell logcat -d`, { encoding: 'utf-8', maxBuffer: 32e6 });
const timeoutErr = (log.match(/Cordova.*TIMEOUT/g) || []).length;
console.log('  Cordova TIMEOUT 횟수:', timeoutErr, timeoutErr === 0 ? '(서버 붙음)' : '(★서버 못 붙음)');

console.log('\n=== 3) 실행 가능한 한법 찾기 ===');
/* Cordova 는 debuggable 로 빌드했으므로 chrome_devtools_remote 이 붙는다. */
sh('forward --remove-all');
let devtools = false;
try {
  sh('forward tcp:9333 localabstract:chrome_devtools_remote');
  const r = execSync('curl -s --max-time 8 http://127.0.0.1:9333/json', { encoding: 'utf-8' });
  const tabs = JSON.parse(r);
  console.log('  탭:', tabs.length, '개');
  tabs.forEach(t => console.log('   -', (t.url || '').slice(0, 70)));
  devtools = tabs.some(t => (t.url || '').includes('pokered'));
} catch (e) {
  console.log('  devtools 소켓 없음:', String(e.message).slice(0, 80));
}
console.log('  게임 탭 붙음?', devtools);
