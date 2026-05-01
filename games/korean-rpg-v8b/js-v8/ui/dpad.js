// js-v8/ui/dpad.js
// 한국사 영웅전 v8 · 영걸전식 D-pad + A/B/L/R 버튼 (모바일 + 키보드 동시)
// ────────────────────────────────────────────────────────
// 사용:
//   import { initDPad, onDPadInput } from './ui/dpad.js';
//   initDPad();
//   onDPadInput((cmd) => {
//     // cmd: 'up' | 'down' | 'left' | 'right' | 'a' | 'b' | 'l' | 'r' | 'menu'
//   });
//
// 키보드 매핑:
//   ↑↓←→ : up/down/left/right
//   Z / Enter : a (결정)
//   X / Escape: b (취소)
//   Q : l (이전 유닛)
//   E : r (다음 유닛)
//   Space : menu (대기/턴종료)

const STYLE = `
#v8-dpad-root {
  position: fixed; inset: 0;
  pointer-events: none;
  z-index: 250;
  font-family: 'Noto Serif KR', serif;
  user-select: none; -webkit-user-select: none; -webkit-tap-highlight-color: transparent;
  display: none;
}
#v8-dpad-root.v8-dpad-on { display: block; }

#v8-dpad-pad {
  position: absolute;
  left: 14px; bottom: 22px;
  width: 156px; height: 156px;
  pointer-events: auto;
}
#v8-dpad-pad .v8-dpad-btn {
  position: absolute;
  width: 50px; height: 50px;
  background: radial-gradient(circle at 30% 30%, rgba(60,40,18,.95), rgba(20,12,4,.85));
  border: 2px solid #c4956a;
  color: #ffd700;
  font-size: 22px; font-weight: 900;
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px;
  box-shadow: 0 4px 10px rgba(0,0,0,.5), inset 0 -2px 4px rgba(0,0,0,.4);
  cursor: pointer;
  transition: transform .08s, background .1s;
}
#v8-dpad-pad .v8-dpad-btn:active,
#v8-dpad-pad .v8-dpad-btn.v8-press {
  transform: scale(0.93);
  background: radial-gradient(circle at 30% 30%, #ffd700, #c4956a);
  color: #20100a;
}
#v8-dpad-pad .v8-dpad-up    { left: 53px; top: 0; }
#v8-dpad-pad .v8-dpad-down  { left: 53px; top: 106px; }
#v8-dpad-pad .v8-dpad-left  { left: 0;   top: 53px; }
#v8-dpad-pad .v8-dpad-right { left: 106px; top: 53px; }
#v8-dpad-pad .v8-dpad-center {
  position: absolute; left: 53px; top: 53px;
  width: 50px; height: 50px;
  background: radial-gradient(circle at center, #5a3a18, #2a1808);
  border: 2px solid #6b4226;
  border-radius: 10px;
  pointer-events: none;
}

#v8-dpad-ab {
  position: absolute;
  right: 14px; bottom: 22px;
  width: 156px; height: 130px;
  pointer-events: auto;
}
#v8-dpad-ab .v8-dpad-ab-btn {
  position: absolute;
  width: 64px; height: 64px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; font-weight: 900;
  font-family: 'Noto Serif KR', serif;
  cursor: pointer;
  border: 3px solid;
  box-shadow: 0 4px 10px rgba(0,0,0,.5), inset 0 -3px 6px rgba(0,0,0,.4);
  transition: transform .08s;
}
#v8-dpad-ab .v8-dpad-ab-btn:active,
#v8-dpad-ab .v8-dpad-ab-btn.v8-press {
  transform: scale(0.92);
}
#v8-dpad-ab .v8-dpad-a {
  right: 0; bottom: 0;
  background: radial-gradient(circle at 30% 30%, #6adc8a, #2a8a3a);
  border-color: #d8ffd8; color: #fff;
  text-shadow: 0 2px 4px rgba(0,0,0,.6);
}
#v8-dpad-ab .v8-dpad-b {
  left: 0; top: 0;
  background: radial-gradient(circle at 30% 30%, #ff7a7a, #aa2828);
  border-color: #ffd8d8; color: #fff;
  text-shadow: 0 2px 4px rgba(0,0,0,.6);
}
#v8-dpad-ab .v8-dpad-ab-label {
  position: absolute;
  font-size: 9px; color: #c4956a; letter-spacing: 1px;
  text-shadow: 0 1px 2px #000;
  pointer-events: none;
}

#v8-dpad-shoulder {
  position: absolute;
  left: 14px; right: 14px; top: 8px;
  display: flex; justify-content: space-between;
  pointer-events: none;
}
#v8-dpad-shoulder .v8-dpad-sb {
  pointer-events: auto;
  width: 56px; height: 28px;
  background: linear-gradient(180deg, rgba(60,40,18,.92), rgba(20,12,4,.92));
  border: 2px solid #c4956a;
  border-radius: 14px;
  color: #ffd700;
  font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  letter-spacing: 1px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,.5);
  transition: transform .08s, background .1s;
}
#v8-dpad-shoulder .v8-dpad-sb:active,
#v8-dpad-shoulder .v8-dpad-sb.v8-press {
  transform: scale(0.93);
  background: linear-gradient(180deg, #ffd700, #c4956a);
  color: #20100a;
}

#v8-dpad-menu {
  position: absolute;
  left: 50%; bottom: 20px; transform: translateX(-50%);
  pointer-events: auto;
  padding: 8px 22px;
  background: linear-gradient(180deg, rgba(60,40,18,.92), rgba(20,12,4,.92));
  border: 2px solid #c4956a;
  border-radius: 18px;
  color: #ffd700;
  font-size: 12px; font-weight: 700;
  letter-spacing: 3px;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0,0,0,.5);
  transition: transform .08s, background .1s;
}
#v8-dpad-menu:active,
#v8-dpad-menu.v8-press {
  transform: translateX(-50%) scale(0.93);
  background: linear-gradient(180deg, #ffd700, #c4956a);
  color: #20100a;
}

@media (min-width: 900px) and (hover: hover) and (pointer: fine) {
  /* PC 데스크톱은 키보드만 — D-pad 자동 숨김. URL ?dpad=1 강제 토글 */
  #v8-dpad-root.v8-dpad-mobile-only { display: none; }
}
`;

let _root  = null;
let _cb    = null;
let _isOn  = false;
let _keyHandler = null;

function _press(el) {
  if (!el) return;
  el.classList.add('v8-press');
  setTimeout(() => el.classList.remove('v8-press'), 90);
}

function _emit(cmd) {
  if (typeof _cb === 'function') _cb(cmd);
}

function _bindButton(el, cmd, repeatable = false) {
  if (!el) return;
  let interval = null;
  const trigger = (e) => {
    e.preventDefault();
    _press(el);
    _emit(cmd);
    if (repeatable) {
      // 길게 누르면 반복 (200ms 후 80ms 간격)
      clearTimeout(el._repeatTimer);
      el._repeatTimer = setTimeout(() => {
        interval = setInterval(() => _emit(cmd), 80);
      }, 220);
    }
  };
  const release = () => {
    clearTimeout(el._repeatTimer);
    if (interval) { clearInterval(interval); interval = null; }
  };
  el.addEventListener('touchstart', trigger, { passive: false });
  el.addEventListener('touchend',   release);
  el.addEventListener('touchcancel',release);
  el.addEventListener('mousedown',  trigger);
  el.addEventListener('mouseup',    release);
  el.addEventListener('mouseleave', release);
}

function _buildUI() {
  const css = document.createElement('style');
  css.id = 'v8-dpad-style';
  css.textContent = STYLE;
  document.head.appendChild(css);

  const root = document.createElement('div');
  root.id = 'v8-dpad-root';
  // 데스크톱은 자동 숨김 (?dpad=1 로 강제 표시)
  const params = new URLSearchParams(location.search);
  if (params.get('dpad') !== '1') root.classList.add('v8-dpad-mobile-only');
  root.innerHTML = `
    <div id="v8-dpad-shoulder">
      <div class="v8-dpad-sb v8-dpad-l" title="이전 유닛 (Q)">‹ L</div>
      <div class="v8-dpad-sb v8-dpad-r" title="다음 유닛 (E)">R ›</div>
    </div>
    <div id="v8-dpad-pad">
      <div class="v8-dpad-btn v8-dpad-up">▲</div>
      <div class="v8-dpad-btn v8-dpad-left">◀</div>
      <div class="v8-dpad-center"></div>
      <div class="v8-dpad-btn v8-dpad-right">▶</div>
      <div class="v8-dpad-btn v8-dpad-down">▼</div>
    </div>
    <div id="v8-dpad-ab">
      <div class="v8-dpad-ab-btn v8-dpad-b">B</div>
      <div class="v8-dpad-ab-btn v8-dpad-a">A</div>
    </div>
    <div id="v8-dpad-menu" title="대기/턴종료 (Space)">대기</div>
  `;
  document.body.appendChild(root);

  _bindButton(root.querySelector('.v8-dpad-up'),    'up',    true);
  _bindButton(root.querySelector('.v8-dpad-down'),  'down',  true);
  _bindButton(root.querySelector('.v8-dpad-left'),  'left',  true);
  _bindButton(root.querySelector('.v8-dpad-right'), 'right', true);
  _bindButton(root.querySelector('.v8-dpad-a'),     'a',     false);
  _bindButton(root.querySelector('.v8-dpad-b'),     'b',     false);
  _bindButton(root.querySelector('.v8-dpad-l'),     'l',     false);
  _bindButton(root.querySelector('.v8-dpad-r'),     'r',     false);
  _bindButton(root.querySelector('#v8-dpad-menu'),  'menu',  false);

  return root;
}

function _bindKeyboard() {
  _keyHandler = (e) => {
    if (!_isOn) return;
    // 입력 폼이 활성이면 무시
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    let cmd = null;
    switch (e.key) {
      case 'ArrowUp':    cmd = 'up'; break;
      case 'ArrowDown':  cmd = 'down'; break;
      case 'ArrowLeft':  cmd = 'left'; break;
      case 'ArrowRight': cmd = 'right'; break;
      case 'Enter':
      case 'z': case 'Z': cmd = 'a'; break;
      case 'Escape':
      case 'x': case 'X': cmd = 'b'; break;
      case 'q': case 'Q': cmd = 'l'; break;
      case 'e': case 'E': cmd = 'r'; break;
      case ' ':           cmd = 'menu'; break;
      default: return;
    }
    e.preventDefault();
    e.stopPropagation();
    _emit(cmd);
    // 시각 피드백 (해당 버튼 깜박)
    const map = {
      up: '.v8-dpad-up', down: '.v8-dpad-down', left: '.v8-dpad-left', right: '.v8-dpad-right',
      a: '.v8-dpad-a', b: '.v8-dpad-b', l: '.v8-dpad-l', r: '.v8-dpad-r',
      menu: '#v8-dpad-menu',
    };
    const sel = map[cmd];
    if (sel && _root) _press(_root.querySelector(sel));
  };
  // capture 단계에서 잡아 다른 핸들러보다 먼저 (다이얼로그 _onKey 보다 우선)
  window.addEventListener('keydown', _keyHandler, true);
}

export function initDPad() {
  if (_root) return;
  _root = _buildUI();
  _bindKeyboard();
}

export function onDPadInput(cb) { _cb = cb; }

export function showDPad() {
  if (!_root) return;
  _root.classList.add('v8-dpad-on');
  _isOn = true;
}

export function hideDPad() {
  if (!_root) return;
  _root.classList.remove('v8-dpad-on');
  _isOn = false;
}

export function isDPadOn() { return _isOn; }
