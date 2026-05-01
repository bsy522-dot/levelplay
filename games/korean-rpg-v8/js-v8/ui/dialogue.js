// js-v8/ui/dialogue.js
// 한국사 영웅전 v8 · 대사 시스템
// 하단 20~22% 높이 대사 박스 · 금색 테두리 · 타이핑 효과 30ms/글자
// 화자 이름 금색 + 포트레이트 이모지 (portraits.json).
//
// export:
//   showDialogue(lines, onComplete)  → Promise<void>
//   hideDialogue()
//   class DialogueRunner

import portraitsData from '../data/portraits.json' with { type: 'json' };

const TYPE_SPEED_MS = 30;
let _el = null;
let _current = null;

function _ensureBigPortraitStyles() {
  if (document.getElementById('v8-dlg-bp-style')) return;
  const s = document.createElement('style');
  s.id = 'v8-dlg-bp-style';
  s.textContent = `
    #v8-dlg-bigportrait {
      position: fixed;
      left: 4vw;
      top: 12vh;
      width: clamp(120px, 22vw, 260px);
      height: clamp(150px, 28vw, 320px);
      z-index: 95;
      pointer-events: none;
      display: none;
      align-items: center;
      justify-content: center;
      font-size: clamp(80px, 16vw, 200px);
      border-radius: 18px;
      border: 3px solid #c4956a;
      background: radial-gradient(circle at 30% 30%, rgba(255,210,140,0.25), rgba(40,20,10,0.85));
      box-shadow: 0 0 30px rgba(255,170,60,.45), 0 10px 30px rgba(0,0,0,.6);
      transition: transform .35s ease, opacity .35s ease;
      transform: translateX(-30px) scale(0.95);
      opacity: 0;
      filter: drop-shadow(0 6px 12px #000);
    }
    #v8-dlg-bigportrait.v8-show {
      display: flex;
      transform: translateX(0) scale(1);
      opacity: 1;
    }
    #v8-dlg-bigportrait::after {
      content: attr(data-name);
      position: absolute;
      bottom: -34px;
      left: 50%;
      transform: translateX(-50%);
      font-family: 'Noto Serif KR', serif;
      font-size: clamp(14px, 2.4vw, 22px);
      font-weight: 900;
      color: var(--bp-color, #ffd700);
      letter-spacing: 4px;
      text-shadow: 0 2px 8px #000, 0 0 14px rgba(255,180,40,.6);
      white-space: nowrap;
    }
    @media (max-width: 720px) {
      #v8-dlg-bigportrait { left: 4vw; top: 8vh; }
    }
  `;
  document.head.appendChild(s);
}

function _ensureElement() {
  if (_el) return _el;
  _ensureBigPortraitStyles();

  // 큰 화자 portrait (배경 일러스트 역할)
  const bp = document.createElement('div');
  bp.id = 'v8-dlg-bigportrait';
  document.body.appendChild(bp);

  const el = document.createElement('div');
  el.id = 'v8-dialogue';
  el.innerHTML = `
    <div class="v8-dlg-head">
      <div class="v8-dlg-portrait" id="v8-dlg-portrait">📜</div>
      <div class="v8-dlg-speaker" id="v8-dlg-speaker">—</div>
    </div>
    <div class="v8-dlg-text" id="v8-dlg-text"></div>
    <div class="v8-dlg-next" id="v8-dlg-next">▼ 터치하여 계속</div>
  `;
  document.body.appendChild(el);
  _el = el;
  return el;
}

export class DialogueRunner {
  constructor(lines, onComplete) {
    this.lines = Array.isArray(lines) ? lines : [];
    this.onComplete = onComplete;
    this.index = -1;
    this.charIdx = 0;
    this.typing = false;
    this.el = _ensureElement();
    this.portraitEl = this.el.querySelector('#v8-dlg-portrait');
    this.speakerEl = this.el.querySelector('#v8-dlg-speaker');
    this.textEl = this.el.querySelector('#v8-dlg-text');
    this.nextEl = this.el.querySelector('#v8-dlg-next');
    this.typingTimer = null;
    this._onClick = this._onClick.bind(this);
    this._onKey = this._onKey.bind(this);
    this.disposed = false;
  }

  start() {
    if (this.lines.length === 0) {
      this._finish();
      return;
    }
    _current = this;
    this.el.classList.add('v8-visible');
    this.el.addEventListener('click', this._onClick);
    window.addEventListener('keydown', this._onKey);
    this._advance();
  }

  _onKey(e) {
    // Space/Enter/화살표로 진행
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowRight') {
      e.preventDefault();
      this._onClick();
    } else if (e.key === 'Escape') {
      this._finish();
    }
  }

  _onClick() {
    if (this.disposed) return;
    if (this.typing) {
      // 타이핑 중이면 스킵 → 즉시 전체 표시
      this._skipTyping();
    } else {
      this._advance();
    }
  }

  _advance() {
    this.index++;
    if (this.index >= this.lines.length) {
      this._finish();
      return;
    }
    const line = this.lines[this.index];
    const pid = line.speakerId || line.portrait;
    const p = (pid && portraitsData[pid]) || { emoji: '📜', color: '#888' };
    this.portraitEl.textContent = p.emoji;
    this.portraitEl.style.borderColor = p.color;
    this.speakerEl.textContent = line.speaker || (pid ? pid : '');
    this.speakerEl.style.color = p.color && p.color !== '#888' ? p.color : '#FFD700';

    // 큰 화자 portrait 갱신 (영걸전 스타일 일러스트 영역)
    const bp = document.getElementById('v8-dlg-bigportrait');
    if (bp) {
      if (line.text && pid) {
        bp.textContent = p.emoji;
        bp.dataset.name = line.speaker || pid;
        bp.style.setProperty('--bp-color', p.color || '#ffd700');
        bp.style.borderColor = p.color || '#c4956a';
        bp.classList.add('v8-show');
      } else {
        bp.classList.remove('v8-show');
      }
    }

    this.textEl.textContent = '';
    this.nextEl.classList.remove('v8-ready');
    this._startTyping(line.text || '');
  }

  _startTyping(fullText) {
    this.typing = true;
    this.charIdx = 0;
    const step = () => {
      if (!this.typing || this.disposed) return;
      this.charIdx++;
      this.textEl.textContent = fullText.slice(0, this.charIdx);
      if (this.charIdx >= fullText.length) {
        this.typing = false;
        this.nextEl.classList.add('v8-ready');
        return;
      }
      this.typingTimer = setTimeout(step, TYPE_SPEED_MS);
    };
    // 첫 글자 즉시
    step();
  }

  _skipTyping() {
    if (this.typingTimer) { clearTimeout(this.typingTimer); this.typingTimer = null; }
    this.typing = false;
    const line = this.lines[this.index];
    this.textEl.textContent = line ? (line.text || '') : '';
    this.nextEl.classList.add('v8-ready');
  }

  _finish() {
    if (this.disposed) return;
    this.disposed = true;
    if (this.typingTimer) { clearTimeout(this.typingTimer); this.typingTimer = null; }
    this.el.classList.remove('v8-visible');
    const bp = document.getElementById('v8-dlg-bigportrait');
    if (bp) bp.classList.remove('v8-show');
    this.el.removeEventListener('click', this._onClick);
    window.removeEventListener('keydown', this._onKey);
    if (_current === this) _current = null;
    if (this.onComplete) {
      try { this.onComplete(); } catch (e) { console.error('[dialogue] onComplete err', e); }
    }
  }

  /** 외부에서 강제 종료 */
  abort() { this._finish(); }
}

// ─────────────────────────────────────────────
// 편의 함수 — Promise 반환
export function showDialogue(lines, onComplete) {
  if (_current) _current.abort();
  return new Promise(resolve => {
    const r = new DialogueRunner(lines, () => {
      if (onComplete) onComplete();
      resolve();
    });
    r.start();
  });
}

export function hideDialogue() {
  if (_current) _current.abort();
}

export function isDialogueActive() {
  return !!_current;
}
