/* 소리: 외부 파일 없이 WebAudio 로 합성한다. 효과음 + 지역별 짧은 배경음(자체 작곡 멜로디). */
let ctx = null, master = null, musicGain = null, sfxGain = null;
let muted = false;
try { muted = localStorage.getItem('pe_mute') === '1'; } catch (e) { /* 저장소 없음 */ }

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain(); master.gain.value = muted ? 0 : 0.8; master.connect(ctx.destination);
  musicGain = ctx.createGain(); musicGain.gain.value = 0.16; musicGain.connect(master);
  sfxGain = ctx.createGain(); sfxGain.gain.value = 0.45; sfxGain.connect(master);
  return ctx;
}
// 첫 터치/키 입력 때 소리를 깨운다 (브라우저 정책)
['pointerdown', 'keydown'].forEach((ev) => window.addEventListener(ev, () => { ensure(); if (ctx && ctx.state === 'suspended') ctx.resume(); }, { passive: true }));

function tone(freq, t0, dur, { type = 'square', vol = 0.3, to = null, dest = null, attack = 0.005 } = {}) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  o.connect(g); g.connect(dest || sfxGain);
  o.start(t0); o.stop(t0 + dur + 0.02);
}
function noise(t0, dur, vol = 0.3, hp = 800) {
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = ctx.createBufferSource(); s.buffer = buf;
  const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
  const g = ctx.createGain(); g.gain.value = vol;
  s.connect(f); f.connect(g); g.connect(sfxGain); s.start(t0);
}
const N = (n) => 440 * Math.pow(2, (n - 69) / 12); // MIDI -> Hz

const SFX = {
  select: (t) => tone(1320, t, 0.05, { vol: 0.18 }),
  cancel: (t) => tone(660, t, 0.07, { vol: 0.18, to: 440 }),
  bump: (t) => tone(110, t, 0.09, { type: 'triangle', vol: 0.35 }),
  door: (t) => { tone(300, t, 0.12, { type: 'triangle', to: 600 }); tone(450, t + 0.1, 0.15, { type: 'triangle', to: 900 }); },
  ok: (t) => [72, 76, 79, 84].forEach((n, i) => tone(N(n), t + i * 0.07, 0.18, { type: 'square', vol: 0.2 })),
  no: (t) => { tone(220, t, 0.18, { type: 'sawtooth', vol: 0.18 }); tone(180, t + 0.16, 0.26, { type: 'sawtooth', vol: 0.18 }); },
  hit: (t) => { noise(t, 0.18, 0.5, 400); tone(160, t, 0.12, { type: 'square', vol: 0.25, to: 60 }); },
  superhit: (t) => { noise(t, 0.28, 0.6, 300); tone(240, t, 0.2, { type: 'sawtooth', vol: 0.25, to: 50 }); },
  weakhit: (t) => { noise(t, 0.1, 0.3, 1200); },
  miss: (t) => tone(900, t, 0.25, { type: 'sine', vol: 0.18, to: 300 }),
  faint: (t) => tone(500, t, 0.7, { type: 'square', vol: 0.18, to: 60 }),
  heal: (t) => [76, 79, 83, 88].forEach((n, i) => tone(N(n), t + i * 0.09, 0.22, { type: 'triangle', vol: 0.25 })),
  levelup: (t) => [67, 71, 74, 79, 83].forEach((n, i) => tone(N(n), t + i * 0.08, 0.2, { vol: 0.2 })),
  item: (t) => [79, 83, 86].forEach((n, i) => tone(N(n), t + i * 0.1, 0.25, { vol: 0.2 })),
  throw: (t) => tone(400, t, 0.35, { type: 'sine', vol: 0.2, to: 1400 }),
  shake: (t) => { tone(200, t, 0.06, { type: 'square', vol: 0.2 }); tone(260, t + 0.06, 0.06, { type: 'square', vol: 0.2 }); },
  caught: (t) => [72, 76, 79, 84, 88].forEach((n, i) => tone(N(n), t + i * 0.1, 0.3, { vol: 0.22 })),
  encounter: (t) => { for (let i = 0; i < 10; i++) tone(N(60 + (i % 4) * 5), t + i * 0.05, 0.06, { vol: 0.16 }); },
  talk: (t) => tone(880, t, 0.025, { vol: 0.06 }),
  exclaim: (t) => { tone(1200, t, 0.08, { vol: 0.2 }); tone(1600, t + 0.08, 0.1, { vol: 0.2 }); },
  jump: (t) => tone(300, t, 0.2, { type: 'triangle', vol: 0.25, to: 700 }),
  badge: (t) => [72, 72, 72, 79, 76, 79, 84].forEach((n, i) => tone(N(n), t + i * 0.13, 0.25, { vol: 0.22 })),
  evolve: (t) => { for (let i = 0; i < 16; i++) tone(N(60 + i), t + i * 0.06, 0.1, { type: 'triangle', vol: 0.18 }); },
};
export function sfx(name) {
  if (!ensure() || muted) return;
  const f = SFX[name]; if (f) f(ctx.currentTime + 0.01);
}

/* ── 배경음: 간단한 루프 시퀀서 (멜로디 + 베이스) ── */
// [음높이(MIDI, 0=쉼), 길이(8분음표 단위)] 자체 작곡
const SONGS = {
  town: { bpm: 104, mel: [[72,2],[76,1],[79,1],[77,2],[76,2],[74,2],[72,1],[74,1],[76,4],[77,2],[79,1],[81,1],[79,2],[77,2],[76,2],[74,2],[72,4]], bass: [48, 55, 53, 55, 48, 55, 50, 55] },
  route: { bpm: 126, mel: [[67,1],[72,1],[74,1],[76,2],[74,1],[72,1],[74,1],[76,1],[79,2],[76,2],[0,1],[74,1],[72,1],[71,1],[72,2],[74,2],[76,1],[77,1],[79,2],[81,1],[79,1],[77,2],[76,2],[74,4]], bass: [48, 52, 55, 52, 53, 57, 55, 50] },
  forest: { bpm: 96, mel: [[69,2],[72,1],[76,1],[74,2],[72,1],[71,1],[69,3],[0,1],[71,2],[72,1],[74,1],[76,2],[74,1],[72,1],[71,4]], bass: [45, 52, 43, 50, 41, 48, 40, 47] },
  lab: { bpm: 100, mel: [[76,1],[79,1],[84,2],[83,1],[81,1],[79,2],[77,1],[76,1],[74,2],[76,4],[72,1],[74,1],[76,2],[77,1],[79,1],[76,2],[74,6]], bass: [48, 52, 53, 55, 48, 50, 55, 43] },
  center: { bpm: 110, mel: [[79,1],[76,1],[72,1],[76,1],[79,2],[84,2],[83,1],[81,1],[79,2],[77,2],[76,2],[77,1],[79,1],[81,2],[79,2],[76,4]], bass: [48, 55, 53, 55, 52, 55, 50, 43] },
  battle: { bpm: 168, mel: [[64,1],[67,1],[71,1],[72,1],[71,1],[67,1],[64,2],[62,1],[64,1],[67,1],[69,1],[67,1],[64,1],[62,2],[64,1],[67,1],[71,1],[74,1],[76,2],[74,1],[72,1],[71,2],[69,2],[71,4]], bass: [40, 40, 43, 43, 45, 45, 47, 47] },
  trainer: { bpm: 176, mel: [[69,1],[72,1],[76,1],[81,1],[79,1],[76,1],[72,2],[74,1],[77,1],[81,1],[84,1],[83,1],[79,1],[76,2],[77,1],[76,1],[74,1],[72,1],[74,2],[76,2],[71,2],[72,1],[74,1],[76,4]], bass: [45, 45, 50, 50, 43, 43, 52, 52] },
  gym: { bpm: 180, mel: [[76,1],[76,1],[79,1],[76,1],[81,2],[79,1],[76,1],[74,1],[74,1],[77,1],[74,1],[79,2],[77,1],[74,1],[72,2],[74,2],[76,2],[79,2],[81,2],[83,2],[84,4]], bass: [40, 40, 45, 45, 38, 38, 43, 43] },
  victory: { bpm: 140, mel: [[72,1],[76,1],[79,1],[84,3],[83,1],[84,1],[86,2],[84,2],[79,2],[81,1],[83,1],[84,6]], bass: [48, 55, 52, 55, 53, 55, 48, 48], once: true },
};
let cur = null, timer = null, stepAt = 0, mi = 0, bi = 0, song = null, bassClock = 0;

function schedule() {
  if (!song || !ctx) return;
  const e8 = 60 / song.bpm / 2; // 8분음표 길이(초)
  while (stepAt < ctx.currentTime + 0.25) {
    const [n, len] = song.mel[mi];
    if (n) tone(N(n), stepAt, len * e8 * 0.92, { type: 'square', vol: 0.22, dest: musicGain, attack: 0.01 });
    // 베이스는 4분음표마다
    const beats = len;
    for (let k = 0; k < beats; k++) {
      if (bassClock % 2 === 0) {
        const b = song.bass[bi % song.bass.length];
        tone(N(b), stepAt + k * e8, e8 * 1.8, { type: 'triangle', vol: 0.35, dest: musicGain, attack: 0.01 });
        bi++;
      }
      bassClock++;
    }
    stepAt += len * e8;
    mi++;
    if (mi >= song.mel.length) {
      if (song.once) { song = null; return; }
      mi = 0;
    }
  }
}
export function music(name) {
  if (name === cur) return;
  cur = name;
  if (!ensure()) return;
  song = SONGS[name] || null; mi = 0; bi = 0; bassClock = 0;
  stepAt = ctx.currentTime + 0.12;
  if (!timer) timer = setInterval(schedule, 90);
}
export function stopMusic() { cur = null; song = null; }
export function setMuted(v) {
  muted = v;
  try { localStorage.setItem('pe_mute', v ? '1' : '0'); } catch (e) { /* 저장소 없음 */ }
  if (master) master.gain.value = v ? 0 : 0.8;
}
export const isMuted = () => muted;
