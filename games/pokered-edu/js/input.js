/* 입력: 키보드 + 터치 패드 -> 'up/down/left/right/a/b/menu' 한 가지 말로 통일한다.
 * 화면(UI)이 떠 있으면 맨 위 화면만 입력을 받는다(스택). 아무 화면도 없으면 지도가 받는다. */
const KEYS = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
  KeyZ: 'a', Space: 'a', Enter: 'a', NumpadEnter: 'a', KeyX: 'b', Backspace: 'b', Escape: 'menu', KeyM: 'menu', Tab: 'menu',
};
const DIRS = ['up', 'down', 'left', 'right'];

class InputHub {
  constructor() {
    this.held = new Set();
    this.order = []; // 가장 최근에 누른 방향이 우선
    this.stack = [];
    this.world = null;
    this.locked = 0;
    window.addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      const k = KEYS[e.code];
      if (!k) return;
      e.preventDefault();
      if (e.repeat && !DIRS.includes(k)) return;
      this.down(k, e.repeat);
    });
    window.addEventListener('keyup', (e) => { const k = KEYS[e.code]; if (k) this.up(k); });
    window.addEventListener('blur', () => { this.held.clear(); this.order = []; });
    this.bindPad();
  }
  bindPad() {
    const pad = document.getElementById('pad');
    if (!pad) return;
    const touchy = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    if (touchy) { pad.classList.remove('hidden'); document.body.classList.add('has-pad'); }
    const active = new Map();
    const press = (btn, id) => { const k = btn.dataset.k; active.set(id, btn); btn.classList.add('on'); this.down(k, false); };
    const release = (id) => { const b = active.get(id); if (!b) return; active.delete(id); b.classList.remove('on'); this.up(b.dataset.k); };
    pad.addEventListener('pointerdown', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      e.preventDefault(); b.setPointerCapture?.(e.pointerId); press(b, e.pointerId);
    });
    pad.addEventListener('pointerup', (e) => release(e.pointerId));
    pad.addEventListener('pointercancel', (e) => release(e.pointerId));
    // 방향키 위에서 손가락을 미끄러뜨리면 방향 전환
    pad.addEventListener('pointermove', (e) => {
      const cur = active.get(e.pointerId); if (!cur || !DIRS.includes(cur.dataset.k)) return;
      const t = document.elementFromPoint(e.clientX, e.clientY)?.closest('.dpad button');
      if (t && t !== cur) { release(e.pointerId); press(t, e.pointerId); }
    });
  }
  down(k, repeat) {
    if (DIRS.includes(k)) {
      this.held.add(k);
      this.order = this.order.filter((d) => d !== k); this.order.push(k);
    }
    if (this.locked) return;
    const top = this.stack[this.stack.length - 1];
    if (top) { top(k, repeat); return; }
    if (!repeat && this.world) this.world(k);
  }
  up(k) {
    this.held.delete(k);
    this.order = this.order.filter((d) => d !== k);
  }
  /** 지금 누르고 있는 방향 (UI가 떠 있으면 없음) */
  dir() {
    if (this.stack.length || this.locked) return null;
    for (let i = this.order.length - 1; i >= 0; i--) if (this.held.has(this.order[i])) return this.order[i];
    return null;
  }
  push(fn) { this.stack.push(fn); return () => { const i = this.stack.lastIndexOf(fn); if (i >= 0) this.stack.splice(i, 1); }; }
  busy() { return this.stack.length > 0 || this.locked > 0; }
}
export const Input = new InputHub();
