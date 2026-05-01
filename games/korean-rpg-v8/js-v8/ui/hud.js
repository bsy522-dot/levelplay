// js-v8/ui/hud.js
// 한국사 영웅전 v8 · 전투 HUD
// 상단바: 턴/아군|적/날씨/설정/카메라
// 하단 유닛 패널: 포트레이트 + 이름 + Lv + HP/MP/XP 바 + 액션 버튼
// 미니맵: 80x80 Canvas (아군 녹점, 적 적점, 지형 약식)
//
// export:
//   initHUD(container)
//   updateHUD(state)
//   showUnitPanel(unit, options)
//   hideUnitPanel()
//   setMinimap(unitsFn, mapFn)
//   onAction(cb)  // cb({action, unit})
//   onCameraChange(cb)
//   onSettings(cb)

import portraitsData from '../data/portraits_data.js';

const WEATHER_ICON = {
  clear: '☀️', rain: '🌧️', snow: '❄️', fog: '🌫️'
};

const CAMERA_LABEL = {
  tactical: '택티컬',
  character: '캐릭터',
  squad: '분대'
};

let _root = null;
let _actionCb = null;
let _cameraCb = null;
let _settingsCb = null;
let _minimapCanvas = null;
let _minimapUnitsFn = null;  // () => [{x,y,team}]
let _minimapMapFn = null;    // () => { w, h, tiles: [[type,...],...] }
let _currentUnit = null;
let _selectedAction = null;
let _camLock = false;  // EP.1 Tactical 잠금 표시용

// ─────────────────────────────────────────────
export function initHUD(container) {
  if (_root) return _root;
  const c = container || document.body;

  // 외부 CSS 자동 로드 (styles.css가 없으면)
  _ensureStyles();

  const root = document.createElement('div');
  root.id = 'v8-hud';
  root.innerHTML = `
    <div id="v8-hud-top">
      <div class="v8-slot">
        <span class="v8-turn">[턴] <span id="v8-turn-num">1</span> · <span id="v8-turn-side">아군</span></span>
        <span class="v8-turn" id="v8-ally-count">아군 0 / 적 0</span>
      </div>
      <div class="v8-slot">
        <span class="v8-weather" id="v8-weather" title="날씨">☀️</span>
        <button id="v8-btn-settings" type="button" aria-label="설정">⚙</button>
        <button id="v8-cam-toggle" type="button">카메라: 택티컬 ▼</button>
      </div>
    </div>
    <div id="v8-cam-dropdown">
      <div class="v8-cam-item" data-cam="tactical">택티컬 (전체 파악)</div>
      <div class="v8-cam-item" data-cam="character">캐릭터 (몰입)</div>
      <div class="v8-cam-item" data-cam="squad">분대 (진군)</div>
    </div>
    <canvas id="v8-minimap" width="80" height="80"></canvas>
    <div id="v8-unit-panel" role="region" aria-label="유닛 정보 패널">
      <div class="v8-unit-head">
        <div class="v8-unit-portrait" id="v8-up-portrait">🧍</div>
        <div>
          <div class="v8-unit-name" id="v8-up-name">—</div>
          <div class="v8-unit-lv" id="v8-up-lv">Lv.1</div>
        </div>
      </div>
      <div class="v8-bars">
        <div class="v8-bar"><span class="v8-bar-label">HP</span>
          <div class="v8-bar-track"><div class="v8-bar-fill hp-full" id="v8-up-hp-fill" style="width:100%"></div></div>
          <span class="v8-bar-val" id="v8-up-hp-val">0/0</span>
        </div>
        <div class="v8-bar"><span class="v8-bar-label">MP</span>
          <div class="v8-bar-track"><div class="v8-bar-fill mp" id="v8-up-mp-fill" style="width:100%"></div></div>
          <span class="v8-bar-val" id="v8-up-mp-val">0/0</span>
        </div>
        <div class="v8-bar"><span class="v8-bar-label">XP</span>
          <div class="v8-bar-track"><div class="v8-bar-fill xp" id="v8-up-xp-fill" style="width:0%"></div></div>
          <span class="v8-bar-val" id="v8-up-xp-val">0/100</span>
        </div>
      </div>
      <div class="v8-actions">
        <button class="v8-action-btn v8-atk" data-act="attack">공격</button>
        <button class="v8-action-btn v8-skl" data-act="skill">스킬 ▾</button>
        <button class="v8-action-btn v8-itm" data-act="item">아이템</button>
        <button class="v8-action-btn v8-wait" data-act="wait">대기</button>
      </div>
    </div>
  `;
  c.appendChild(root);
  _root = root;
  _minimapCanvas = root.querySelector('#v8-minimap');

  // 이벤트 바인딩
  root.querySelector('#v8-btn-settings').addEventListener('click', () => {
    if (_settingsCb) _settingsCb();
  });

  const camBtn = root.querySelector('#v8-cam-toggle');
  const camDd = root.querySelector('#v8-cam-dropdown');
  camBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (_camLock) return;
    camDd.classList.toggle('v8-open');
  });
  document.addEventListener('click', (e) => {
    if (!camDd.contains(e.target) && e.target !== camBtn) camDd.classList.remove('v8-open');
  });
  camDd.querySelectorAll('.v8-cam-item').forEach(item => {
    item.addEventListener('click', () => {
      const mode = item.dataset.cam;
      camDd.classList.remove('v8-open');
      camBtn.textContent = `카메라: ${CAMERA_LABEL[mode]} ▼`;
      [...camDd.children].forEach(c => c.classList.remove('v8-active'));
      item.classList.add('v8-active');
      if (_cameraCb) _cameraCb(mode);
    });
  });

  // 액션 버튼
  root.querySelectorAll('.v8-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const act = btn.dataset.act;
      _selectedAction = act;
      if (_actionCb) _actionCb({ action: act, unit: _currentUnit, btn });
    });
  });

  // 키보드 1/2/3 (카메라 토글도 camera/switcher에서 처리하지만, HUD 표시 동기화)
  window.addEventListener('keydown', (e) => {
    if (_camLock) return;
    const m = { '1': 'tactical', '2': 'character', '3': 'squad' }[e.key];
    if (m) {
      const item = camDd.querySelector(`[data-cam="${m}"]`);
      if (item) item.click();
    }
  });

  return root;
}

function _ensureStyles() {
  if (document.querySelector('link[data-v8-ui-styles]')) return;
  // 동일 디렉토리 styles.css 자동 로드 (import.meta.url 기반)
  try {
    const url = new URL('./styles.css', import.meta.url).href;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.setAttribute('data-v8-ui-styles', '1');
    document.head.appendChild(link);
  } catch (e) {
    console.warn('[hud] styles auto-load failed', e);
  }
}

// ─────────────────────────────────────────────
// HUD 상단 갱신 — state: { turn, side, weather, allyAlive, enemyAlive, camMode, camLocked }
export function updateHUD(state) {
  if (!_root) return;
  if (state.turn !== undefined) _root.querySelector('#v8-turn-num').textContent = state.turn;
  if (state.side !== undefined) _root.querySelector('#v8-turn-side').textContent = state.side === 'ally' ? '아군' : '적군';
  if (state.weather !== undefined) _root.querySelector('#v8-weather').textContent = WEATHER_ICON[state.weather] || '☀️';
  if (state.allyAlive !== undefined || state.enemyAlive !== undefined) {
    _root.querySelector('#v8-ally-count').textContent = `아군 ${state.allyAlive ?? 0} / 적 ${state.enemyAlive ?? 0}`;
  }
  if (state.camMode !== undefined) {
    const btn = _root.querySelector('#v8-cam-toggle');
    btn.textContent = `카메라: ${CAMERA_LABEL[state.camMode] || state.camMode} ${_camLock ? '🔒' : '▼'}`;
    _root.querySelectorAll('#v8-cam-dropdown .v8-cam-item').forEach(c => {
      c.classList.toggle('v8-active', c.dataset.cam === state.camMode);
    });
  }
  if (state.camLocked !== undefined) {
    _camLock = !!state.camLocked;
    const btn = _root.querySelector('#v8-cam-toggle');
    btn.style.opacity = _camLock ? '0.6' : '1';
    btn.style.cursor = _camLock ? 'not-allowed' : 'pointer';
  }
  _drawMinimap();
}

// ─────────────────────────────────────────────
// 유닛 패널
export function showUnitPanel(unit, opts = {}) {
  if (!_root || !unit) return;
  _currentUnit = unit;
  const panel = _root.querySelector('#v8-unit-panel');
  panel.classList.add('v8-visible');

  const portrait = portraitsData[unit.portraitId || unit.id] || { emoji: '🧍', color: '#888' };
  const pEl = _root.querySelector('#v8-up-portrait');
  pEl.textContent = portrait.emoji;
  pEl.style.borderColor = portrait.color;

  _root.querySelector('#v8-up-name').textContent = unit.name || unit.id || '—';
  _root.querySelector('#v8-up-lv').textContent = `Lv.${unit.level || 1} · ${unit.class || ''}`;

  const hp = unit.hp ?? 0, hpMax = unit.hpMax ?? unit.maxHp ?? 1;
  const mp = unit.mp ?? 0, mpMax = unit.mpMax ?? unit.maxMp ?? 1;
  const xp = unit.xp ?? 0, xpMax = unit.xpMax ?? 100;

  const hpPct = Math.max(0, Math.min(100, (hp / hpMax) * 100));
  const hpFill = _root.querySelector('#v8-up-hp-fill');
  hpFill.style.width = `${hpPct}%`;
  hpFill.classList.toggle('hp-full', hpPct > 30);
  hpFill.classList.toggle('hp-low', hpPct <= 30);
  _root.querySelector('#v8-up-hp-val').textContent = `${hp}/${hpMax}`;

  const mpPct = Math.max(0, Math.min(100, (mp / mpMax) * 100));
  _root.querySelector('#v8-up-mp-fill').style.width = `${mpPct}%`;
  _root.querySelector('#v8-up-mp-val').textContent = `${mp}/${mpMax}`;

  const xpPct = Math.max(0, Math.min(100, (xp / xpMax) * 100));
  _root.querySelector('#v8-up-xp-fill').style.width = `${xpPct}%`;
  _root.querySelector('#v8-up-xp-val').textContent = `${xp}/${xpMax}`;

  // 액션 버튼 활성/비활성
  const actions = opts.actions || ['attack', 'skill', 'item', 'wait'];
  _root.querySelectorAll('.v8-action-btn').forEach(btn => {
    const act = btn.dataset.act;
    const active = actions.includes(act);
    btn.disabled = !active || (unit.acted === true);
    btn.style.display = active ? '' : 'none';
  });
}

export function hideUnitPanel() {
  if (!_root) return;
  _root.querySelector('#v8-unit-panel').classList.remove('v8-visible');
  _currentUnit = null;
  _selectedAction = null;
}

// ─────────────────────────────────────────────
// 미니맵
export function setMinimap(unitsFn, mapFn) {
  _minimapUnitsFn = unitsFn;
  _minimapMapFn = mapFn;
  _drawMinimap();
}

function _drawMinimap() {
  if (!_minimapCanvas) return;
  const ctx = _minimapCanvas.getContext('2d');
  const W = _minimapCanvas.width, H = _minimapCanvas.height;
  ctx.clearRect(0, 0, W, H);

  const map = _minimapMapFn ? _minimapMapFn() : null;
  const units = _minimapUnitsFn ? _minimapUnitsFn() : [];

  const mw = (map && map.w) || 10;
  const mh = (map && map.h) || 10;
  const tw = W / mw, th = H / mh;

  // 지형
  if (map && map.tiles) {
    for (let y = 0; y < mh; y++) {
      for (let x = 0; x < mw; x++) {
        const t = map.tiles[y] && map.tiles[y][x];
        let color = '#2a2a3a';
        if (t === 'mountain' || t === 'wall') color = '#4a3a2a';
        else if (t === 'water') color = '#2a3a6a';
        else if (t === 'forest') color = '#2a4a2a';
        else if (t === 'road') color = '#5a5040';
        else if (t === 'sacred') color = '#8a7a2a';
        ctx.fillStyle = color;
        ctx.fillRect(x * tw, y * th, Math.ceil(tw), Math.ceil(th));
      }
    }
  } else {
    ctx.fillStyle = '#2a2a3a';
    ctx.fillRect(0, 0, W, H);
  }

  // 유닛 점
  units.forEach(u => {
    if (u.hp !== undefined && u.hp <= 0) return;
    ctx.fillStyle = u.team === 'ally' ? '#4a2' : '#a22';
    const cx = (u.x + 0.5) * tw;
    const cy = (u.y + 0.5) * th;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(2, Math.min(tw, th) / 2), 0, Math.PI * 2);
    ctx.fill();
    if (u.isLeader) {
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  });

  // 테두리
  ctx.strokeStyle = '#8B6B3D';
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, W - 1, H - 1);
}

// ─────────────────────────────────────────────
// 이벤트 등록
export function onAction(cb) { _actionCb = cb; }
export function onCameraChange(cb) { _cameraCb = cb; }
export function onSettings(cb) { _settingsCb = cb; }

// 디버그용
export function _getRoot() { return _root; }
