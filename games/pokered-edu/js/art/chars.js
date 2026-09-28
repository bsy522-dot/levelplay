/* 사람 캐릭터: 도트가 아닌 둥글둥글한 현대풍 2D. 4방향 × 3동작(서기, 왼발, 오른발) = 12프레임 가로 띠 */
export const CW = 48, CH = 64;

const SKIN = '#f8d5b5', SKIN_D = '#8d5a3b';
export const KINDS = {
  player: { hair: '#1e1e28', hairStyle: 'spiky', hat: 'cap', hatCol: '#e3350d', hatCol2: '#fff', top: '#2d5bd1', top2: '#1b1b24', bottom: '#3b5b8f', shoe: '#e3350d' },
  rival: { hair: '#8b5a2b', hairStyle: 'spiky', top: '#6c3fb5', bottom: '#2c2c3a', shoe: '#444' },
  oak: { hair: '#c9c9c9', hairStyle: 'short', top: '#f4f4f4', top2: '#c0392b', bottom: '#7a5a3a', shoe: '#5a3d2b', coat: true },
  mom: { hair: '#8b4a2b', hairStyle: 'pony', top: '#f7a8b8', bottom: '#f7a8b8', shoe: '#b55', skirt: true, apron: '#fff' },
  girl: { hair: '#6b3a1f', hairStyle: 'long', top: '#f06292', bottom: '#f06292', shoe: '#a33', skirt: true },
  youngster: { hair: '#222', hairStyle: 'short', hat: 'cap', hatCol: '#3b6cd4', hatCol2: '#fff', top: '#f5c542', bottom: '#2f4a8a', shoe: '#333', shorts: true },
  bugcatcher: { hair: '#222', hairStyle: 'short', hat: 'straw', top: '#7cc36b', bottom: '#d8c07a', shoe: '#6b4', shorts: true, net: true },
  fisher: { hair: '#444', hairStyle: 'short', hat: 'bucket', hatCol: '#557', top: '#4d7ab0', top2: '#e6d7a3', bottom: '#555', shoe: '#333' },
  gambler: { hair: '#aaa', hairStyle: 'bald', top: '#8e6a4f', bottom: '#555', shoe: '#333', beard: true },
  oldman: { hair: '#ddd', hairStyle: 'bald', top: '#9c7b5b', bottom: '#555', shoe: '#333', beard: true, cane: true },
  nurse: { hair: '#f48fb1', hairStyle: 'loops', hat: 'nurse', top: '#f8bbd0', bottom: '#f8bbd0', shoe: '#fff', skirt: true, apron: '#fff' },
  clerk: { hair: '#333', hairStyle: 'short', hat: 'cap', hatCol: '#2f6fd0', hatCol2: '#2f6fd0', top: '#2f6fd0', top2: '#fff', bottom: '#333', shoe: '#222' },
  scientist: { hair: '#555', hairStyle: 'short', top: '#f4f4f4', top2: '#5577aa', bottom: '#444', shoe: '#222', coat: true, glasses: true },
  brock: { skin: '#c68a5a', hair: '#4a2e18', hairStyle: 'spiky', top: '#e67e22', top2: '#2e8b57', bottom: '#6b4f2a', shoe: '#333', squint: true },
  camper: { hair: '#333', hairStyle: 'short', hat: 'cap', hatCol: '#2e7d32', hatCol2: '#2e7d32', top: '#66bb6a', bottom: '#8d6e63', shoe: '#5d4037', shorts: true },
  coolf: { hair: '#c62828', hairStyle: 'long', top: '#fdd835', bottom: '#1565c0', shoe: '#333', skirt: true },
  nerd: { hair: '#5d4037', hairStyle: 'short', top: '#90caf9', bottom: '#455a64', shoe: '#222', glasses: true },
  rocket: { hair: '#2b2b2b', hairStyle: 'short', hat: 'cap', hatCol: '#222', hatCol2: '#222', top: '#222', top2: '#e3350d', bottom: '#222', shoe: '#555' },
  hiker: { hair: '#5d4037', hairStyle: 'short', hat: 'bucket', hatCol: '#8d6e63', top: '#a1887f', bottom: '#6d4c41', shoe: '#3e2723', beard: true },
  misty: { hair: '#f57c00', hairStyle: 'pony', top: '#fdd835', bottom: '#e53935', shoe: '#e53935', shorts: true },
  swimmer: { hair: '#222', hairStyle: 'short', top: '#4fc3f7', bottom: '#1565c0', shoe: '#f8d5b5', shorts: true },
  guide: { hair: '#333', hairStyle: 'short', top: '#ef5350', bottom: '#37474f', shoe: '#222', glasses: true, shades: true },
};
export const SPRITE_KIND = {
  Oak: 'oak', Blue: 'rival', Girl: 'girl', Fisher: 'fisher', Youngster: 'youngster', Gambler: 'gambler', GamblerAsleep: 'oldman',
  CooltrainerF: 'coolf', CooltrainerM: 'camper', SuperNerd: 'nerd', GymGuide: 'guide', Scientist: 'scientist', Mom: 'mom',
  Nurse: 'nurse', Clerk: 'clerk', BugCatcher: 'bugcatcher', Brock: 'brock', OldMan: 'oldman',
  Rocket: 'rocket', Hiker: 'hiker', Swimmer: 'swimmer', MiddleAgedMan: 'gambler', Guard: 'clerk',
};

function rr(g, x, y, w, h, r, fill) { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); g.fillStyle = fill; g.fill(); }
function circle(g, x, y, r, fill) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = fill; g.fill(); }
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join('');
}

/** 한 프레임 그리기. dir: 0=아래 1=위 2=왼 3=오른, step: 0 서기, 1/2 걷기 */
function drawFrame(g, k, dir, step) {
  const skin = k.skin || SKIN;
  const cx = CW / 2;
  const bob = step ? -1.5 : 0;
  const lift = step === 1 ? -3 : step === 2 ? 3 : 0;
  // 그림자
  g.fillStyle = 'rgba(0,0,0,.22)'; g.beginPath(); g.ellipse(cx, CH - 5, 13, 4.5, 0, 0, Math.PI * 2); g.fill();
  const outline = 'rgba(30,30,50,.9)';
  // 다리
  const legY = 46 + bob;
  const legC = k.shorts ? skin : k.bottom;
  if (dir === 0 || dir === 1) {
    rr(g, cx - 8, legY + Math.min(0, lift), 6, 11 - Math.abs(Math.min(0, lift)) + (lift > 0 ? 0 : 0), 3, legC);
    rr(g, cx + 2, legY + Math.min(0, -lift), 6, 11, 3, legC);
    rr(g, cx - 9, legY + 9 + (lift < 0 ? lift : 0), 8, 5, 2.5, k.shoe);
    rr(g, cx + 1, legY + 9 + (lift > 0 ? -lift : 0), 8, 5, 2.5, k.shoe);
  } else {
    const s = dir === 2 ? -1 : 1;
    rr(g, cx - 4 + lift * s * 0.8, legY, 7, 11, 3, legC);
    rr(g, cx - 3 - lift * s * 0.8, legY, 7, 11, 3, shade(legC, 0.85));
    rr(g, cx - 5 + lift * s * 0.8 + s * 2, legY + 9, 9, 5, 2.5, k.shoe);
  }
  // 몸통
  const bodyY = 30 + bob;
  const top = k.top;
  if (k.skirt) {
    g.fillStyle = top; g.beginPath(); g.moveTo(cx - 9, bodyY); g.lineTo(cx + 9, bodyY); g.lineTo(cx + 13, bodyY + 20); g.lineTo(cx - 13, bodyY + 20); g.closePath(); g.fill();
  } else rr(g, cx - 10, bodyY, 20, 18, 7, top);
  if (k.top2 && !k.coat) rr(g, cx - 4, bodyY + 1, 8, 14, 3, k.top2);
  if (k.coat) { rr(g, cx - 11, bodyY, 22, 20, 7, '#fbfbfb'); if (dir === 0) rr(g, cx - 3, bodyY + 1, 6, 13, 2, k.top2); }
  if (k.apron && dir !== 1) rr(g, cx - 7, bodyY + 5, 14, 14, 4, k.apron);
  if (k === KINDS.rocket && dir === 0) { g.fillStyle = '#e3350d'; g.font = 'bold 12px sans-serif'; g.textAlign = 'center'; g.fillText('R', cx, bodyY + 13); }
  if (!k.skirt && !k.coat) rr(g, cx - 10, bodyY + 13, 20, 5, 2, k.shorts ? k.bottom : shade(k.bottom, 0.9));
  // 팔
  const armSwing = step === 1 ? 3 : step === 2 ? -3 : 0;
  const armC = k.coat ? '#f1f1f1' : top;
  if (dir === 0 || dir === 1) {
    rr(g, cx - 14, bodyY + 2 + armSwing, 5, 13, 2.5, armC); rr(g, cx + 9, bodyY + 2 - armSwing, 5, 13, 2.5, armC);
    circle(g, cx - 11.5, bodyY + 16 + armSwing, 2.8, skin); circle(g, cx + 11.5, bodyY + 16 - armSwing, 2.8, skin);
  } else {
    const s = dir === 2 ? -1 : 1;
    rr(g, cx - 2.5 + armSwing * s, bodyY + 2, 5, 13, 2.5, shade(armC, 0.9));
    circle(g, cx + armSwing * s, bodyY + 16, 2.8, skin);
  }
  if (k.net && dir !== 1) { g.strokeStyle = '#8d6e63'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx + 12, bodyY + 14); g.lineTo(cx + 18, bodyY - 8); g.stroke(); g.strokeStyle = '#fff'; g.beginPath(); g.arc(cx + 19, bodyY - 12, 5, 0, Math.PI * 2); g.stroke(); }
  if (k.cane && dir !== 1) { g.strokeStyle = '#6d4c41'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(cx + 13, bodyY + 12); g.lineTo(cx + 15, CH - 6); g.stroke(); }
  // 머리
  const hy = 18 + bob;
  circle(g, cx, hy, 14, skin);
  // 머리카락
  const hc = k.hair;
  if (k.hairStyle !== 'bald') {
    if (dir === 1) { circle(g, cx, hy - 1, 14.5, hc); }
    else {
      g.fillStyle = hc; g.beginPath(); g.arc(cx, hy - 2, 14.8, Math.PI * 1.02, Math.PI * 1.98); g.fill();
      if (dir === 2) rr(g, cx + 2, hy - 10, 11, 14, 5, hc);
      if (dir === 3) rr(g, cx - 13, hy - 10, 11, 14, 5, hc);
    }
    if (k.hairStyle === 'spiky') {
      g.fillStyle = hc;
      for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(cx + i * 6 - 4, hy - 9); g.lineTo(cx + i * 7, hy - 20 - (i === 0 ? 3 : 0)); g.lineTo(cx + i * 6 + 4, hy - 9); g.fill(); }
      if (dir !== 1) { g.beginPath(); g.moveTo(cx - 12, hy - 4); g.lineTo(cx - 17, hy + 2); g.lineTo(cx - 10, hy); g.fill(); g.beginPath(); g.moveTo(cx + 12, hy - 4); g.lineTo(cx + 17, hy + 2); g.lineTo(cx + 10, hy); g.fill(); }
    }
    if (k.hairStyle === 'long' || k.hairStyle === 'pony') {
      if (dir === 1) rr(g, cx - 13, hy - 2, 26, 22, 8, hc);
      else if (k.hairStyle === 'long') { rr(g, cx - 15, hy - 4, 6, 20, 3, hc); rr(g, cx + 9, hy - 4, 6, 20, 3, hc); }
      if (k.hairStyle === 'pony' && dir !== 0) circle(g, dir === 2 ? cx + 14 : dir === 3 ? cx - 14 : cx, hy + 2, 6, hc);
    }
    if (k.hairStyle === 'loops' && dir !== 1) { circle(g, cx - 14, hy + 6, 6, hc); circle(g, cx + 14, hy + 6, 6, hc); }
  }
  // 모자
  if (k.hat === 'cap') {
    g.fillStyle = k.hatCol; g.beginPath(); g.arc(cx, hy - 3, 14.6, Math.PI, 0); g.fill();
    if (dir === 0) { rr(g, cx - 5, hy - 13, 10, 7, 3, k.hatCol2); rr(g, cx - 13, hy - 5, 26, 5, 2.5, shade(k.hatCol, 0.8)); }
    if (dir === 2) rr(g, cx - 19, hy - 5, 14, 4.5, 2, shade(k.hatCol, 0.8));
    if (dir === 3) rr(g, cx + 5, hy - 5, 14, 4.5, 2, shade(k.hatCol, 0.8));
  } else if (k.hat === 'straw') {
    g.fillStyle = '#e8c96a'; g.beginPath(); g.ellipse(cx, hy - 6, 20, 6, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(cx, hy - 7, 11, Math.PI, 0); g.fill(); rr(g, cx - 11, hy - 9, 22, 3, 1, '#c0392b');
  } else if (k.hat === 'bucket') {
    g.fillStyle = k.hatCol; g.beginPath(); g.ellipse(cx, hy - 6, 17, 5, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(cx, hy - 7, 12, Math.PI, 0); g.fill();
  } else if (k.hat === 'nurse') {
    rr(g, cx - 9, hy - 20, 18, 9, 3, '#fff'); rr(g, cx - 1.5, hy - 19, 3, 7, 1, '#e3350d'); rr(g, cx - 3.5, hy - 17, 7, 3, 1, '#e3350d');
  }
  // 얼굴
  if (dir === 0) {
    const ey = hy + 2;
    if (k.squint) { g.strokeStyle = '#2b2b2b'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 8, ey); g.lineTo(cx - 3, ey); g.moveTo(cx + 3, ey); g.lineTo(cx + 8, ey); g.stroke(); }
    else if (k.shades) { rr(g, cx - 10, ey - 3, 20, 6, 3, '#222'); }
    else {
      g.fillStyle = '#2b2b3b'; g.beginPath(); g.ellipse(cx - 5, ey, 2.4, 3.4, 0, 0, Math.PI * 2); g.ellipse(cx + 5, ey, 2.4, 3.4, 0, 0, Math.PI * 2); g.fill();
      circle(g, cx - 4.3, ey - 1.3, 0.9, '#fff'); circle(g, cx + 5.7, ey - 1.3, 0.9, '#fff');
    }
    if (k.glasses && !k.shades) { g.strokeStyle = '#333'; g.lineWidth = 1.3; g.beginPath(); g.arc(cx - 5, hy + 2, 4, 0, Math.PI * 2); g.arc(cx + 5, hy + 2, 4, 0, Math.PI * 2); g.stroke(); }
    g.fillStyle = 'rgba(255,120,120,.35)'; g.beginPath(); g.ellipse(cx - 9, hy + 6, 2.5, 1.5, 0, 0, Math.PI * 2); g.ellipse(cx + 9, hy + 6, 2.5, 1.5, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = shade(skin, 0.55); g.lineWidth = 1.4; g.beginPath(); g.arc(cx, hy + 7, 2.5, 0.2, Math.PI - 0.2); g.stroke();
    if (k.beard) { g.fillStyle = '#eee'; g.beginPath(); g.arc(cx, hy + 9, 8, 0, Math.PI); g.fill(); }
  } else if (dir === 2 || dir === 3) {
    const s = dir === 2 ? -1 : 1;
    g.fillStyle = '#2b2b3b'; g.beginPath(); g.ellipse(cx + s * 7, hy + 2, 2.2, 3.2, 0, 0, Math.PI * 2); g.fill();
    if (k.glasses || k.shades) { g.strokeStyle = '#333'; g.lineWidth = 1.3; g.beginPath(); g.arc(cx + s * 7, hy + 2, 4, 0, Math.PI * 2); g.stroke(); }
    circle(g, cx + s * 13.5, hy + 4, 2, skin);
    if (k.beard) { g.fillStyle = '#eee'; g.beginPath(); g.arc(cx + s * 7, hy + 9, 6, 0, Math.PI); g.fill(); }
  }
}

/** 캐릭터 한 종류의 12프레임 가로 띠 캔버스 */
export function charSheet(kindKey) {
  const k = KINDS[kindKey] || KINDS.youngster;
  const cv = document.createElement('canvas');
  cv.width = CW * 12; cv.height = CH;
  const g = cv.getContext('2d');
  g.lineJoin = 'round'; g.lineCap = 'round';
  for (let d = 0; d < 4; d++) for (let s = 0; s < 3; s++) { g.save(); g.translate((d * 3 + s) * CW, 0); drawFrame(g, k, d, s); g.restore(); }
  return cv;
}

/** 땅에 놓인 몬스터볼(아이템) */
export function itemBallSheet() {
  const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH;
  const g = cv.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(24, 58, 11, 4, 0, 0, Math.PI * 2); g.fill();
  const x = 24, y = 48, r = 10;
  g.fillStyle = '#e3350d'; g.beginPath(); g.arc(x, y, r, Math.PI, 0); g.fill();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, r, 0, Math.PI); g.fill();
  g.strokeStyle = '#222'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.moveTo(x - r, y); g.lineTo(x + r, y); g.stroke();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 3.5, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(x - 4, y - 5, 2.2, 0, Math.PI * 2); g.fill();
  return cv;
}
/** 잠든 할아버지 (누워 있음) */
export function sleeperSheet() {
  const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH;
  const g = cv.getContext('2d');
  g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(24, 56, 20, 5, 0, 0, Math.PI * 2); g.fill();
  rr(g, 6, 44, 30, 12, 6, '#9c7b5b'); rr(g, 30, 46, 14, 9, 4, '#555');
  circle(g, 10, 44, 9, SKIN); g.fillStyle = '#eee'; g.beginPath(); g.arc(10, 49, 6, 0, Math.PI); g.fill();
  g.fillStyle = '#3b6cd4'; g.font = 'bold 13px sans-serif'; g.fillText('z', 20, 30); g.font = 'bold 10px sans-serif'; g.fillText('z', 28, 22);
  return cv;
}
