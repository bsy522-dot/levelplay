/**
 * AudioEngine - 우주탐험 3D 게임 사운드 시스템
 * PRISM Studio Audio팀 - 절차적 생성 (Web Audio API only, no downloads)
 *
 * 사용법:
 *   AudioEngine.init();          // 사용자 첫 인터랙션 후
 *   AudioEngine.playBGM();       // 우주 BGM 시작
 *   AudioEngine.stopBGM();       // BGM 정지
 *   AudioEngine.sfx('travel_start'); // SFX 재생
 *
 * 노출: globalThis.AudioEngine + ESM export
 */
(function (root) {
  'use strict';

  const AudioEngine = {
    ctx: null,
    masterGain: null,
    bgmGain: null,
    sfxGain: null,
    bgmNodes: [],          // 활성 BGM 노드들 (정지 시 disconnect)
    bgmTimers: [],         // setTimeout id 보관
    bgmPlaying: false,
    bgmLoopSec: 120,       // 2분 루프
    isInit: false,

    /** AudioContext 생성 + master/bgm/sfx 게인 분리. 사용자 첫 인터랙션 후 호출 */
    init() {
      if (this.isInit) return true;
      try {
        const Ctx = root.AudioContext || root.webkitAudioContext;
        if (!Ctx) return false;
        this.ctx = new Ctx();

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.7;
        this.masterGain.connect(this.ctx.destination);

        this.bgmGain = this.ctx.createGain();
        this.bgmGain.gain.value = 0.35;
        this.bgmGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = 0.6;
        this.sfxGain.connect(this.masterGain);

        // 모바일: suspended 상태 처리
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }

        this.isInit = true;
        return true;
      } catch (e) {
        return false;
      }
    },

    /** 모바일 재개용 (visibilitychange 등에서 호출) */
    resume() {
      if (this.ctx && this.ctx.state === 'suspended') {
        return this.ctx.resume().catch(() => {});
      }
    },

    /** 마스터 볼륨 조절 (0~1) */
    setMasterVolume(v) { if (this.masterGain) this.masterGain.gain.value = Math.max(0, Math.min(1, v)); },
    setBgmVolume(v)    { if (this.bgmGain)    this.bgmGain.gain.value    = Math.max(0, Math.min(1, v)); },
    setSfxVolume(v)    { if (this.sfxGain)    this.sfxGain.gain.value    = Math.max(0, Math.min(1, v)); },

    /** ───── BGM: 깊은 패드 + 셀레스타 별빛 코드 진행 (2분 루프) ───── */
    playBGM() {
      if (!this.isInit) this.init();
      if (!this.ctx || this.bgmPlaying) return;
      this.bgmPlaying = true;
      this._scheduleBGMCycle();
    },

    stopBGM() {
      this.bgmPlaying = false;
      // 활성 노드 페이드아웃
      const now = this.ctx ? this.ctx.currentTime : 0;
      this.bgmNodes.forEach(n => {
        try {
          if (n.gain) n.gain.gain.cancelScheduledValues(now);
          if (n.gain) n.gain.gain.setValueAtTime(n.gain.gain.value, now);
          if (n.gain) n.gain.gain.linearRampToValueAtTime(0, now + 0.4);
          setTimeout(() => { try { n.osc && n.osc.stop(); } catch(_){} try { n.osc && n.osc.disconnect(); } catch(_){} try { n.gain && n.gain.disconnect(); } catch(_){} }, 500);
        } catch (_) {}
      });
      this.bgmNodes = [];
      this.bgmTimers.forEach(t => clearTimeout(t));
      this.bgmTimers = [];
    },

    /** 한 사이클(2분) 예약 후 다음 사이클 재귀 예약 */
    _scheduleBGMCycle() {
      if (!this.bgmPlaying || !this.ctx) return;
      const startAt = this.ctx.currentTime + 0.05;

      // 코드 진행: i - VI - III - VII (Am - F - C - G 분위기, 우주 느낌)
      // 각 코드 30초 × 4 = 120초
      const chords = [
        { root: 110.00, third: 130.81, fifth: 164.81, seventh: 196.00 }, // Am7
        { root: 87.31,  third: 110.00, fifth: 130.81, seventh: 164.81 }, // Fmaj7
        { root: 130.81, third: 164.81, fifth: 196.00, seventh: 246.94 }, // Cmaj7
        { root: 98.00,  third: 123.47, fifth: 146.83, seventh: 185.00 }  // G
      ];
      const chordDur = 30;

      chords.forEach((c, i) => {
        const t = startAt + i * chordDur;
        // 패드: 4 sine + 1 triangle, 페이드 인/아웃
        [c.root, c.third, c.fifth, c.seventh].forEach((freq, idx) => {
          this._spawnPadVoice(freq, t, chordDur, 0.18 / (1 + idx * 0.2));
        });
        // 옥타브 깊은 베이스
        this._spawnPadVoice(c.root / 2, t, chordDur, 0.12, 'triangle');

        // 셀레스타 별빛: 코드 톤 위에서 랜덤 아르페지오 (코드당 ~6회)
        for (let s = 0; s < 6; s++) {
          const offset = 2 + s * (chordDur - 4) / 6 + (Math.random() * 1.5);
          const noteFreq = [c.root * 4, c.third * 4, c.fifth * 4, c.seventh * 4][Math.floor(Math.random() * 4)];
          this._spawnCelesta(noteFreq, t + offset, 0.07);
        }
      });

      // 다음 사이클 예약
      const tid = setTimeout(() => {
        this.bgmTimers = this.bgmTimers.filter(x => x !== tid);
        if (this.bgmPlaying) this._scheduleBGMCycle();
      }, this.bgmLoopSec * 1000);
      this.bgmTimers.push(tid);
    },

    /** 패드 보이스 (긴 페이드, sine/triangle) */
    _spawnPadVoice(freq, startTime, duration, peakGain, type) {
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      // detune for chorus warmth
      osc.detune.value = (Math.random() - 0.5) * 8;

      gain.gain.value = 0;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(peakGain, startTime + 4);          // 4s fade-in
      gain.gain.linearRampToValueAtTime(peakGain * 0.85, startTime + duration - 6);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);          // fade-out

      osc.connect(gain);
      gain.connect(this.bgmGain);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.1);

      this.bgmNodes.push({ osc, gain });
    },

    /** 셀레스타 별빛 톤: 짧은 sine + 빠른 decay */
    _spawnCelesta(freq, startTime, peakGain) {
      const ctx = this.ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.8);

      osc.connect(gain);
      gain.connect(this.bgmGain);
      osc.start(startTime);
      osc.stop(startTime + 2);

      this.bgmNodes.push({ osc, gain });
    },

    /** ───── SFX: 8종 절차적 생성 ───── */
    sfx(name) {
      if (!this.isInit) this.init();
      if (!this.ctx) return;
      const fn = this._sfx[name];
      if (fn) fn.call(this);
    },

    _sfx: {
      /** 로켓 발사: 저주파 sawtooth 럼블 + 화이트노이즈 폭발음 (2.5s) */
      travel_start() {
        const ctx = this.ctx, now = ctx.currentTime;
        // Rumble
        const osc = ctx.createOscillator();
        const og = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(40, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 2.5);
        og.gain.setValueAtTime(0, now);
        og.gain.linearRampToValueAtTime(0.4, now + 0.15);
        og.gain.linearRampToValueAtTime(0.3, now + 1.5);
        og.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
        osc.connect(og); og.connect(this.sfxGain);
        osc.start(now); osc.stop(now + 2.6);

        // Noise
        const noise = this._makeNoise(2.5);
        const ng = ctx.createGain();
        const nf = ctx.createBiquadFilter();
        nf.type = 'lowpass'; nf.frequency.value = 800;
        ng.gain.setValueAtTime(0, now);
        ng.gain.linearRampToValueAtTime(0.25, now + 0.1);
        ng.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
        noise.connect(nf); nf.connect(ng); ng.connect(this.sfxGain);
        noise.start(now); noise.stop(now + 2.6);
      },

      /** 도착 차임: 3음 상승 (C5 → E5 → G5) */
      travel_arrive() {
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((f, i) => this._tone(f, 0.5, 0.35, i * 0.18, 'sine', { attack: 0.01, decay: 0.45 }));
      },

      /** 수집: 반짝 차임 800→1200Hz 슬라이드 */
      sample_collect() {
        const ctx = this.ctx, now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.18);
        g.gain.setValueAtTime(0, now);
        g.gain.linearRampToValueAtTime(0.3, now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.connect(g); g.connect(this.sfxGain);
        osc.start(now); osc.stop(now + 0.5);

        // 위에 sparkle 한 톤 추가 (2배 옥타브 짧게)
        this._tone(2400, 0.15, 0.15, 0.05, 'sine', { attack: 0.005, decay: 0.13 });
      },

      /** 정답: 밝은 메이저 3화음 (C5-E5-G5 동시) */
      quiz_correct() {
        [523.25, 659.25, 783.99].forEach(f => this._tone(f, 0.6, 0.22, 0, 'triangle', { attack: 0.01, decay: 0.55 }));
        this._tone(1046.5, 0.4, 0.12, 0.1, 'sine', { attack: 0.01, decay: 0.35 });
      },

      /** 오답: 디센딩 마이너 (A4 → F4 → D4) */
      quiz_wrong() {
        const notes = [440.00, 349.23, 293.66];
        notes.forEach((f, i) => this._tone(f, 0.45, 0.28, i * 0.16, 'sawtooth', { attack: 0.01, decay: 0.4, lpf: 1200 }));
      },

      /** 배지: 팡파레 5음 (C5-E5-G5-C6-G5) */
      badge() {
        const notes = [523.25, 659.25, 783.99, 1046.5, 783.99];
        notes.forEach((f, i) => {
          this._tone(f, 0.35, 0.3, i * 0.13, 'square', { attack: 0.01, decay: 0.32, lpf: 3000 });
          this._tone(f * 2, 0.2, 0.1, i * 0.13, 'sine', { attack: 0.005, decay: 0.18 });
        });
      },

      /** 업그레이드: 4음 어센딩 (C5-E5-G5-C6) */
      upgrade() {
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((f, i) => this._tone(f, 0.3, 0.28, i * 0.1, 'sine', { attack: 0.01, decay: 0.28 }));
      },

      /** UI 클릭: 짧은 톡 (1500Hz, 50ms) */
      ui_click() {
        this._tone(1500, 0.05, 0.18, 0, 'square', { attack: 0.002, decay: 0.045, lpf: 4000 });
      }
    },

    /** 단발 톤 헬퍼 (oscillator + ADSR-ish gain envelope + optional LPF) */
    _tone(freq, dur, peak, delay, type, opts) {
      const ctx = this.ctx, t0 = ctx.currentTime + (delay || 0);
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;

      const o = opts || {};
      const attack = o.attack || 0.01;
      const decay  = o.decay  || (dur - attack);

      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(peak, t0 + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);

      let last = g;
      if (o.lpf) {
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass'; f.frequency.value = o.lpf;
        g.connect(f); last = f;
      }

      osc.connect(g);
      last.connect(this.sfxGain);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    },

    /** 화이트노이즈 BufferSource 생성 */
    _makeNoise(durationSec) {
      const ctx = this.ctx;
      const sr = ctx.sampleRate;
      const buf = ctx.createBuffer(1, Math.ceil(sr * durationSec), sr);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource();
      src.buffer = buf;
      return src;
    }
  };

  // 노출: 글로벌 + ESM 호환
  root.AudioEngine = AudioEngine;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioEngine;
  }
})(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : this));
