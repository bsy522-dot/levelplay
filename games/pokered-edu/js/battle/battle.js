/* 전투: 그림은 Phaser(BattleScene), 글자·메뉴는 화면 위 창. 기술을 쓸 때마다 문제가 나온다. */
import { DB, ITEMS, sp, monArt } from '../data.js';
import { G, save, addItem, itemCount, seen, receive, alive, healParty, maxHp } from '../state.js';
import { el, sleep, josa, pick, chance, rand, typeTag, TYPE_COLOR, weighted } from '../util.js';
import { Input } from '../input.js';
import { root, portraitUrl, choose, fade, say, toast } from '../ui.js';
import { sfx, music } from '../audio.js';
import * as M from './mech.js';
import { moveQuiz } from '../learn/quiz.js';
import { newLesson } from '../learn/tutor.js';
import { expMult, PRACTICE_REWARD, EXP_GAIN_BOOST } from '../learn/tutor.js';
import { fixJosa } from '../learn/math.js';
import { W } from '../world/overworld.js';
import { wildPick } from '../world/events.js';

const BG = { ViridianForest: 'bg_forest', PewterGym: 'bg_gym_rock', OaksLab: 'bg_lab', MtMoon1F: 'bg_cave', MtMoonB1F: 'bg_cave', MtMoonB2F: 'bg_cave', CeruleanGym: 'bg_gym_water', VermilionGym: 'bg_gym_electric', VermilionCity: 'bg_harbor',
  // 4~9판 (2026-10-03 그림)
  CeladonGym: 'bg_gym_grass', FuchsiaGym: 'bg_gym_poison', SaffronGym: 'bg_gym_psychic', CinnabarGym: 'bg_gym_fire', ViridianGym: 'bg_gym_ground',
  LoreleisRoom: 'bg_elite', BrunosRoom: 'bg_elite', AgathasRoom: 'bg_elite', LancesRoom: 'bg_elite', ChampionsRoom: 'bg_elite',
  PokemonTower1F: 'bg_tower', PokemonTower2F: 'bg_tower', PokemonTower6F: 'bg_tower', PokemonTower7F: 'bg_tower',
  SilphCo1F: 'bg_silph', SilphCo5F: 'bg_silph', SilphCo7F: 'bg_silph', SilphCo11F: 'bg_silph',
  RockTunnel1F: 'bg_cave', RockTunnelB1F: 'bg_cave', VictoryRoad1F: 'bg_cave', VictoryRoad2F: 'bg_cave', VictoryRoad3F: 'bg_cave', SSAnne2F: 'bg_harbor' };

export class BattleScene extends Phaser.Scene {
  constructor() { super({ key: 'battle', active: true }); }
  create() {
    B.scene = this;
    this.g = this.add.graphics();
    this.scale.on('resize', () => this.layout());
    B.onSceneReady?.();
  }
  async tex(key, url) {
    if (this.textures.exists(key)) return key;
    await new Promise((res) => {
      this.load.image(key, url);
      this.load.once('complete', res);
      this.load.once('loaderror', res);
      this.load.start();
    });
    return this.textures.exists(key) ? key : null;
  }
  layout() {
    const w = this.scale.width, h = this.scale.height;
    const portrait = h > w;
    this.L = portrait
      ? { foe: [w * 0.68, h * 0.30], me: [w * 0.3, h * 0.52], fs: Math.min(w * 0.42, h * 0.24), ms: Math.min(w * 0.5, h * 0.28) }
      : { foe: [w * 0.7, h * 0.40], me: [w * 0.27, h * 0.66], fs: Math.min(h * 0.36, w * 0.22), ms: Math.min(h * 0.44, w * 0.28) };
    if (this.bg) { const s = Math.max(w / this.bg.width, h / this.bg.height); this.bg.setScale(s).setPosition(w / 2, h / 2); }
    this.drawPlatforms();
    if (this.foe) { this.foe.setPosition(...this.L.foe); this.fit(this.foe, this.L.fs); }
    if (this.me) { this.me.setPosition(...this.L.me); this.fit(this.me, this.L.ms); }
  }
  drawPlatforms() {
    const g = this.g; g.clear();
    if (!this.L) return;
    const [fx, fy] = this.L.foe, [mx, my] = this.L.me;
    g.fillStyle(0x000000, 0.18); g.fillEllipse(fx, fy + 4, this.L.fs * 1.2, this.L.fs * 0.28);
    g.fillStyle(0xd9f2c4, 0.85); g.fillEllipse(fx, fy, this.L.fs * 1.15, this.L.fs * 0.26);
    g.fillStyle(0x000000, 0.18); g.fillEllipse(mx, my + 4, this.L.ms * 1.2, this.L.ms * 0.26);
    g.fillStyle(0xe8f0d0, 0.85); g.fillEllipse(mx, my, this.L.ms * 1.15, this.L.ms * 0.24);
    g.setDepth(1);
  }
  fit(img, size) { const s = size / Math.max(img.width, img.height); img.setScale(s); img.baseScale = s; }
  async setup(bgKey) {
    this.children.removeAll(true);
    this.g = this.add.graphics();
    const w = this.scale.width, h = this.scale.height;
    const key = bgKey && await this.tex(bgKey, `art/ai/${bgKey}.webp`);
    if (key) this.bg = this.add.image(w / 2, h / 2, key).setDepth(0);
    else {
      const gr = this.add.graphics().setDepth(0);
      gr.fillGradientStyle(0x9fd8ff, 0x9fd8ff, 0xd8f5c0, 0xd8f5c0, 1); gr.fillRect(0, 0, w * 2, h * 2);
      this.bg = null;
    }
    this.foe = null; this.me = null; this.pback = null; this.trainer = null;
    this.layout();
  }
  async showMon(side, id, { from = 'slide' } = {}) {
    const key = await this.tex('mon_' + id, monArt(id));
    const [x, y] = this.L[side === 'foe' ? 'foe' : 'me'];
    const img = this.add.image(x, y + 6, key).setOrigin(0.5, 1).setDepth(side === 'foe' ? 5 : 6);
    this.fit(img, this.L[side === 'foe' ? 'fs' : 'ms']);
    if (side === 'me') img.setFlipX(true);
    const target = img.baseScale;
    if (from === 'slide') {
      img.x = side === 'foe' ? this.scale.width + 200 : -200;
      await this.tw({ targets: img, x, duration: 420, ease: 'Cubic.out' });
    } else {
      img.setScale(0.01); this.flash(x, y - 60, 0xffffff);
      await this.tw({ targets: img, scale: target, duration: 300, ease: 'Back.out' });
    }
    if (side === 'foe') this.foe = img; else this.me = img;
    return img;
  }
  async showTrainer(face) {
    const url = portraitUrl(face);
    if (!url) return null;
    const key = await this.tex('tr_' + face, url);
    if (!key) return null;
    const [x, y] = this.L.foe;
    const img = this.add.image(this.scale.width + 200, y + 6, key).setOrigin(0.5, 1).setDepth(4);
    this.fit(img, this.L.fs * 1.25);
    await this.tw({ targets: img, x, duration: 450, ease: 'Cubic.out' });
    this.trainer = img;
    return img;
  }
  /** 주인공 뒷모습 (원작처럼 배틀 시작 때 왼쪽에 서 있다가 포켓몬을 내보내며 들어감) */
  async showPlayerBack() {
    const key = await this.tex('tr_player_back', 'art/ai/player_back.png');
    if (!key) return;
    const [x, y] = this.L.me;
    const img = this.add.image(-200, y + 10, key).setOrigin(0.5, 1).setDepth(7);
    this.fit(img, this.L.ms * 1.15);
    await this.tw({ targets: img, x, duration: 420, ease: 'Cubic.out' });
    this.pback = img;
  }
  async hidePlayerBack() {
    if (!this.pback) return;
    await this.tw({ targets: this.pback, x: -220, duration: 300 });
    this.pback.destroy(); this.pback = null;
  }
  async hideTrainer() {
    if (!this.trainer) return;
    await this.tw({ targets: this.trainer, x: this.scale.width + 220, duration: 350 });
    this.trainer.destroy(); this.trainer = null;
  }
  tw(cfg) { return new Promise((res) => this.tweens.add({ ...cfg, onComplete: res })); }
  flash(x, y, col) {
    const c = this.add.circle(x, y, 10, col, 0.9).setDepth(20);
    this.tweens.add({ targets: c, radius: 90, alpha: 0, duration: 380, onComplete: () => c.destroy() });
  }
  async attackAnim(side, type, special) {
    const a = side === 'me' ? this.me : this.foe, t = side === 'me' ? this.foe : this.me;
    if (!a || !t) return;
    const dx = side === 'me' ? 40 : -40;
    await this.tw({ targets: a, x: a.x + dx, y: a.y - (special ? 10 : 0), duration: 120, yoyo: true });
    await this.effect(t, type);
  }
  async effect(t, type) {
    const col = Phaser.Display.Color.HexStringToColor(TYPE_COLOR[type] || '#ffffff').color;
    const cx = t.x, cy = t.y - t.displayHeight * 0.45;
    const parts = [];
    for (let i = 0; i < 12; i++) {
      let p;
      if (type === 'Electric') { p = this.add.rectangle(cx, cy, 6, 26, 0xffe14d).setAngle(rand(-40, 40)); }
      else if (type === 'Water') p = this.add.circle(cx, cy, rand(5, 11), 0x7cc4f2, 0.9).setStrokeStyle(2, 0xffffff);
      else if (type === 'Grass') p = this.add.ellipse(cx, cy, 16, 8, 0x5fcf4f);
      else if (type === 'Fire') p = this.add.circle(cx, cy, rand(6, 12), pick([0xff7a1a, 0xffcc33, 0xe62829]));
      else if (type === 'Rock' || type === 'Ground') p = this.add.rectangle(cx, cy, rand(8, 14), rand(8, 14), 0x9e8f78).setAngle(rand(0, 90));
      else p = this.add.star(cx, cy, 5, 4, 10, col);
      p.setDepth(30);
      parts.push(p);
      const ang = Math.random() * Math.PI * 2, dist = 30 + Math.random() * 70;
      this.tweens.add({ targets: p, x: cx + Math.cos(ang) * dist, y: cy + Math.sin(ang) * dist, alpha: 0, angle: '+=90', duration: 420 + Math.random() * 200, onComplete: () => p.destroy() });
    }
    await sleep(160);
  }
  async hit(side, big) {
    const t = side === 'me' ? this.me : this.foe;
    if (!t) return;
    sfx(big ? 'superhit' : 'hit');
    this.cameras.main.shake(big ? 260 : 150, big ? 0.012 : 0.006);
    for (let i = 0; i < 3; i++) { t.setAlpha(0.2); await sleep(70); t.setAlpha(1); await sleep(70); }
  }
  missText(side) {
    const t = side === 'me' ? this.me : this.foe;
    if (!t) return;
    const tx = this.add.text(t.x, t.y - t.displayHeight, '빗나감!', { fontFamily: 'Jua', fontSize: '28px', color: '#ffffff', stroke: '#e5484d', strokeThickness: 6 }).setOrigin(0.5).setDepth(40);
    this.tweens.add({ targets: tx, y: tx.y - 40, alpha: 0, duration: 900, onComplete: () => tx.destroy() });
  }
  async faint(side) {
    const t = side === 'me' ? this.me : this.foe;
    if (!t) return;
    sfx('faint');
    await this.tw({ targets: t, y: t.y + t.displayHeight, alpha: 0, duration: 450 });
    t.destroy();
    if (side === 'me') this.me = null; else this.foe = null;
  }
  async recall() { if (this.me) { await this.tw({ targets: this.me, scale: 0.01, alpha: 0, duration: 250 }); this.me.destroy(); this.me = null; } }
  async throwBall(shakes, caught) {
    const [sx, sy] = this.L.me, [fx, fy] = this.L.foe;
    const r = 13;
    const ball = this.add.container(sx, sy - 80).setDepth(50);
    const top = this.add.graphics(); top.fillStyle(0xe3350d); top.slice(0, 0, r, Math.PI, 0); top.fillPath();
    top.fillStyle(0xffffff); top.slice(0, 0, r, 0, Math.PI); top.fillPath();
    top.lineStyle(3, 0x222222); top.strokeCircle(0, 0, r); top.lineBetween(-r, 0, r, 0); top.fillStyle(0xffffff); top.fillCircle(0, 0, 4); top.strokeCircle(0, 0, 4);
    ball.add(top);
    sfx('throw');
    const ty = fy - this.foe.displayHeight * 0.4;
    await new Promise((res) => this.tweens.addCounter({ from: 0, to: 1, duration: 520, onUpdate: (tw) => { const t = tw.getValue(); ball.x = sx + (fx - sx) * t; ball.y = (sy - 80) + (ty - (sy - 80)) * t - Math.sin(t * Math.PI) * 140; ball.angle = t * 720; }, onComplete: res }));
    this.flash(fx, ty, 0xffffff);
    await this.tw({ targets: this.foe, scale: 0.01, alpha: 0, duration: 250 });
    await this.tw({ targets: ball, y: fy - 12, duration: 300, ease: 'Bounce.out' });
    for (let i = 0; i < shakes; i++) { await sleep(300); sfx('shake'); await this.tw({ targets: ball, angle: 22, duration: 110, yoyo: true }); await this.tw({ targets: ball, angle: -22, duration: 110, yoyo: true }); }
    await sleep(400);
    if (caught) {
      sfx('caught');
      for (let i = 0; i < 5; i++) { const s = this.add.star(ball.x, ball.y - 10, 5, 4, 9, 0xffd23f).setDepth(51); this.tweens.add({ targets: s, x: ball.x + rand(-60, 60), y: ball.y - rand(30, 80), alpha: 0, duration: 700, onComplete: () => s.destroy() }); }
      await sleep(600);
      this.caughtBall = ball;
    } else {
      this.flash(ball.x, ball.y, 0xffffff); ball.destroy();
      this.foe.setAlpha(1); await this.tw({ targets: this.foe, scale: this.foe.baseScale, duration: 250, ease: 'Back.out' });
    }
  }
  async glow(side) {
    const t = side === 'me' ? this.me : this.foe;
    if (!t) return;
    await this.tw({ targets: t, alpha: 0.4, duration: 120, yoyo: true, repeat: 2 });
  }
  clear() { this.children.removeAll(true); this.foe = this.me = this.trainer = this.bg = this.pback = null; }
}

/* ────────────────── 전투 진행 ────────────────── */
export const B = { scene: null };

class Hud {
  constructor() {
    this.foeEl = el('div', { class: 'win bhud foe' });
    this.meEl = el('div', { class: 'win bhud me' });
    this.msgEl = el('div', { class: 'win msg' });
    this.side = el('div', { class: 'win cmds hidden' });
    this.box = el('div', { class: 'bbox' }, this.msgEl, this.side);
    root().append(this.foeEl, this.meEl, this.box);
    this.hideHud();
  }
  hideHud() { this.foeEl.classList.add('hidden'); this.meEl.classList.add('hidden'); }
  destroy() { this.foeEl.remove(); this.meEl.remove(); this.box.remove(); }
  hpClass(r) { return r > 0.5 ? '' : r > 0.2 ? 'mid' : 'low'; }
  drawFoe(b, balls) {
    const m = b.m, s = sp(m.sp), mx = maxHp(m), r = m.hp / mx;
    this.foeEl.innerHTML = '';
    this.foeEl.append(...[
      el('div', { class: 'nm' }, el('span', {}, s.name, m.status ? el('span', { class: 'st', style: { background: M.STATUS_COLOR[m.status] } }, M.STATUS_KO[m.status]) : null, G.s.dex.caught[m.sp] ? ' ◓' : null), el('span', {}, 'Lv' + m.lv)),
      el('div', { class: 'hpl' }, el('b', {}, 'HP'), el('div', { class: 'hp ' + this.hpClass(r) }, el('i', { style: { width: r * 100 + '%' } }))),
      balls ? el('div', { class: 'balls' }, ...balls.map((a) => el('i', { class: a ? '' : 'out' }))) : null].filter(Boolean));
    this.foeEl.classList.remove('hidden');
  }
  drawMe(b) {
    const m = b.m, s = sp(m.sp), mx = maxHp(m), r = m.hp / mx;
    this.meEl.style.bottom = (this.box.offsetHeight + 22) + 'px';
    this.meEl.innerHTML = '';
    this.meEl.append(
      el('div', { class: 'nm' }, el('span', {}, s.name, m.status ? el('span', { class: 'st', style: { background: M.STATUS_COLOR[m.status] } }, M.STATUS_KO[m.status]) : null), el('span', {}, 'Lv' + m.lv)),
      el('div', { class: 'hpl' }, el('b', {}, 'HP'), el('div', { class: 'hp ' + this.hpClass(r) }, el('i', { style: { width: r * 100 + '%' } }))),
      el('div', { class: 'num' }, `${Math.max(0, m.hp)} / ${mx}`),
      el('div', { class: 'exp' }, el('i', { style: { width: M.expProgress(m) * 100 + '%' } })));
    this.meEl.classList.remove('hidden');
  }
  async animHp(which, b, from) {
    const m = b.m, mx = maxHp(m);
    const steps = 14;
    for (let i = 1; i <= steps; i++) {
      const hp = Math.round(from + ((m.hp - from) * i) / steps);
      const saved = m.hp; m.hp = hp;
      which === 'me' ? this.drawMe(b) : this.drawFoe(b, this.balls);
      m.hp = saved;
      await sleep(28);
    }
    which === 'me' ? this.drawMe(b) : this.drawFoe(b, this.balls);
  }
  /** 메시지 한 줄. wait=true 면 A 를 기다린다(아니면 잠깐 보여주고 넘어감) */
  msg(text, wait = false) {
    text = fixJosa(text);
    return new Promise((resolve) => {
      this.msgEl.textContent = '';
      let i = 0, done = false;
      const fin = () => {
        clearInterval(tm); this.msgEl.textContent = text; done = true;
        if (!wait) setTimeout(resolve, 520);
      };
      const tm = setInterval(() => { i += 1; this.msgEl.textContent = text.slice(0, i); if (i >= text.length) fin(); }, 20);
      if (wait) {
        const pop = Input.push((k) => { if (k !== 'a' && k !== 'b') return; if (!done) { fin(); return; } pop(); this.msgEl.onclick = null; sfx('select'); resolve(); });
        this.msgEl.onclick = () => { if (!done) { fin(); return; } pop(); this.msgEl.onclick = null; sfx('select'); resolve(); };
      }
    });
  }
  /** 명령 고르기 (그리드). items: [{label, value, disabled, sub}] */
  pick(items, { cols = 2, cancel = null, moves = false, title = null } = {}) {
    return new Promise((resolve) => {
      const wrap = moves ? el('div', { class: 'win moves' }) : this.side;
      wrap.innerHTML = '';
      wrap.classList.remove('hidden');
      if (moves) { this.msgEl.classList.add('hidden'); this.box.prepend(wrap); }
      let sel = Math.max(0, items.findIndex((it) => !it.disabled)); // 처음부터 쓸 수 있는 것에 커서
      const btns = items.map((it, i) => {
        const b = el('button', { disabled: it.disabled, onclick: () => { if (!it.disabled) done(it.value); } }, it.label, it.sub || null);
        return b;
      });
      if (title) wrap.append(el('div', { class: 'jua', style: { gridColumn: '1 / -1', padding: '.1em .3em' } }, fixJosa(title)));
      wrap.append(...btns);
      const paint = () => btns.forEach((b, i) => b.classList.toggle('sel', i === sel));
      paint();
      const done = (v) => {
        pop(); sfx(v === cancel ? 'cancel' : 'select');
        if (moves) { wrap.remove(); this.msgEl.classList.remove('hidden'); } else wrap.classList.add('hidden');
        resolve(v);
      };
      const pop = Input.push((k) => {
        const n = items.length;
        if (k === 'left') sel = sel % cols ? sel - 1 : sel;
        else if (k === 'right') sel = sel % cols < cols - 1 && sel + 1 < n ? sel + 1 : sel;
        else if (k === 'up') sel = sel - cols >= 0 ? sel - cols : sel;
        else if (k === 'down') sel = sel + cols < n ? sel + cols : sel;
        else if (k === 'a') { if (!items[sel].disabled) done(items[sel].value); else { sfx('bump'); toast(moves ? 'PP가 없어서 쓸 수 없어요! 다른 기술을 골라요.' : '지금은 고를 수 없어요.'); } return; }
        else if (k === 'b') { if (cancel !== false) done(cancel); return; }
        else return;
        sfx('select'); paint();
      });
    });
  }
}

/** 전투 실행. 반환: 'win' | 'lose' | 'run' | 'caught' */
export async function runBattle(opts) {
  const S = B.scene;
  W.busy = true;
  const world = W.scene;
  G.s.stats.battles++;
  // 전환 연출
  sfx('encounter');
  music(opts.music || (opts.kind === 'trainer' ? 'trainer' : 'battle'));
  await fade(true, 260);
  world.scene.sleep();
  S.scene.setVisible(true);
  await S.setup(BG[G.s.map] || (G.s.map === 'PewterGym' ? 'bg_gym_rock' : 'bg_grass'));
  const hud = new Hud();
  document.body.classList.add('in-battle');
  await fade(false, 260);
  const foes = opts.foes;
  const trainer = opts.kind === 'trainer';
  hud.balls = trainer ? foes.map(() => true) : null;
  let fi = 0;
  let foe = M.battler(foes[0], 'foe');
  // 배틀 학습 묶음: 상대 포켓몬 한 마리 = 한 주제 (여러 방 맞아야 쓰러지면 같은 주제로 원리→계산→응용)
  let lesson = newLesson();
  B.lesson = lesson;
  seen(foe.m.sp);
  const party = G.s.party;
  let me = M.battler(party.find((m) => m.hp > 0), 'me');
  const participants = new Set([me.m]);
  const leveled = new Set();
  let result = null;
  const nameOf = (b) => (b.side === 'foe' ? (trainer ? '상대 ' : '야생 ') : '') + sp(b.m.sp).name;
  const boss = trainer && M.isBossTrainer(opts); // 관장·사천왕·챔피언은 똑똑하게 고른다
  let foeHealUsed = false; // 고급상처약은 배틀당 한 번
  const askQuiz = async (d) => (await moveQuiz({ monName: sp(me.m.sp).name, moveName: d.name, moveType: d.type, story: !!opts.story, lesson })).hit;

  try {
    const backP = S.showPlayerBack();
    if (trainer) {
      await S.showTrainer(opts.face);
      await hud.msg(opts.intro || `${opts.name}이(가) 승부를 걸어 왔다!`, true);
      await S.hideTrainer();
      await S.showMon('foe', foe.m.sp, { from: 'ball' });
      hud.drawFoe(foe, hud.balls);
      await hud.msg(`${josa(opts.name, '은/는')} ${josa(sp(foe.m.sp).name, '을/를')} 내보냈다!`);
    } else {
      await S.showMon('foe', foe.m.sp);
      hud.drawFoe(foe);
      await hud.msg(`앗! 야생 ${josa(sp(foe.m.sp).name, '이/가')} 튀어나왔다!`, true);
    }
    await backP;
    await hud.msg(`가라! ${sp(me.m.sp).name}!`);
    await S.hidePlayerBack();
    await S.showMon('me', me.m.sp, { from: 'ball' });
    hud.drawMe(me);

    // ── 턴 반복 ──
    while (!result) {
      // 반동 중이거나 두 턴 기술을 모으는 중이면 고를 수 없다 (자동으로 이어진다)
      const chargeMv = me.charge ? DB.moves[me.charge] : null; // 공격 턴에 문제를 낼 땐 charge 가 이미 비워져 있다 → 미리 잡아 둔다
      let myAct = me.recharge ? { kind: 'recharge' }
        : chargeMv ? { kind: 'move', slot: null, move: chargeMv, hit: null, ask: () => askQuiz(chargeMv) } : null;
      let cmd = null;
      if (!myAct) {
        hud.msgEl.textContent = `${josa(sp(me.m.sp).name, '은/는')} 무엇을 할까?`;
        cmd = await hud.pick([
          { label: '⚔ 싸운다', value: 'fight' }, { label: '🎒 가방', value: 'bag' },
          { label: '🔴 포켓몬', value: 'mon' }, { label: '🏃 도망', value: 'run' },
        ], { cancel: false });
      }
      if (cmd === 'fight') {
        const usable = me.m.moves.filter((mv) => mv.pp > 0);
        if (!usable.length) myAct = { kind: 'move', move: { id: 'Struggle', name: '발버둥', type: 'Normal', power: 50, acc: 100, effect: 'RecoilEffect' }, hit: true };
        else {
          const mvIdx = await hud.pick(me.m.moves.map((mv, i) => {
            const d = DB.moves[mv.id];
            return { label: d.name, value: i, disabled: mv.pp <= 0, sub: el('small', {}, typeTag(d.type), `PP ${mv.pp}/${d.pp}`, d.power ? ` · 위력 ${d.power}` : ' · 변화') };
          }), { moves: true, cancel: -1 });
          if (mvIdx === -1) continue;
          const slot = me.m.moves[mvIdx], d = DB.moves[slot.id];
          // 두 턴 기술은 모으는 턴엔 문제를 내지 않고, 공격하는 턴에 한 번 낸다
          if (M.isChargeMove(d)) myAct = { kind: 'move', slot, move: d, hit: null, ask: () => askQuiz(d) };
          else {
            const q = await moveQuiz({ monName: sp(me.m.sp).name, moveName: d.name, moveType: d.type, story: !!opts.story, lesson });
            myAct = { kind: 'move', slot, move: d, hit: q.hit };
          }
        }
      } else if (cmd === 'bag') {
        const used = await useBagInBattle(hud, S, me, foe, trainer);
        if (!used) continue;
        if (used.caught) { result = 'caught'; break; }
        if (used.ran) { result = 'run'; break; }
        myAct = { kind: 'item' };
      } else if (cmd === 'mon') {
        if (me.trap > 0) { await hud.msg(`${me.trapName}에 걸려서 교체할 수 없다!`, true); continue; }
        const pick2 = await choosePartyMon(me.m, false);
        if (pick2 == null) continue;
        await hud.msg(`돌아와, ${sp(me.m.sp).name}!`);
        await S.recall();
        me = M.battler(pick2, 'me'); participants.add(pick2);
        await S.showMon('me', me.m.sp, { from: 'ball' }); hud.drawMe(me);
        await hud.msg(`가라! ${sp(me.m.sp).name}!`);
        myAct = { kind: 'switch' };
      } else if (cmd === 'run') {
        if (trainer) { await hud.msg('트레이너와의 승부에서는 도망칠 수 없어!', true); continue; }
        if (me.trap > 0) { await hud.msg(`${me.trapName}에 걸려서 도망칠 수 없다!`, true); continue; }
        sfx('select'); await hud.msg('무사히 도망쳤다!', true); result = 'run'; break;
      }

      if (!myAct) { console.warn('battle: no action for command', cmd); continue; }
      // 상대 행동
      // 반동 중이면 움직이지 않고(foeMove 없음), 모으는 중이면 이어서 공격, 보스는 약이 필요하면 약을 쓴다
      const foeItem = !foe.recharge && !foe.charge && boss && M.bossHeals(opts) && M.aiShouldHeal(foe, foeHealUsed);
      const foeMove = foe.recharge || foeItem ? null : foe.charge ? DB.moves[foe.charge] : pickFoeMove(foe, me, boss);
      const myFirst = myAct.kind !== 'move' || priority(myAct.move) > priority(foeMove) ||
        (priority(myAct.move) === priority(foeMove) && (M.effSpeed(me) > M.effSpeed(foe) || (M.effSpeed(me) === M.effSpeed(foe) && chance(0.5))));
      const order = foeItem ? (myAct.kind === 'item' || myAct.kind === 'switch' ? ['me', 'foe'] : ['foe', 'me']) : myFirst ? ['me', 'foe'] : ['foe', 'me'];
      for (const who of order) {
        if (result) break;
        if (me.m.hp <= 0 || foe.m.hp <= 0) break;
        if (who === 'me') {
          if (myAct.kind === 'move') await doMove(hud, S, me, foe, myAct.move, myAct.slot, myAct.hit, nameOf, myAct.ask);
          else if (myAct.kind === 'recharge') await doMove(hud, S, me, foe, null, null, null, nameOf);
        } else if (foeItem) { foeHealUsed = true; await foeHyperPotion(hud, foe, opts.name); }
        else await doMove(hud, S, foe, me, foeMove, null, null, nameOf);
      }
      // 턴 끝 (독·화상·씨뿌리기)
      for (const b of [me, foe]) if (b.m.hp > 0) await endTurn(hud, S, b, b === me ? foe : me, nameOf);

      // 쓰러짐 처리
      if (foe.m.hp <= 0) {
        me.recharge = false; // 상대를 쓰러뜨렸으면 파괴광선 반동 없음
        await S.faint('foe');
        await hud.msg(`${josa(nameOf(foe), '은/는')} 쓰러졌다!`, true);
        if (trainer) hud.balls[fi] = false;
        // 경험치 (참가한 포켓몬 중 살아 있는 쪽에 나눠 준다)
        const mult = expMult();
        const gainers = [...participants].filter((m) => m.hp > 0);
        for (const m of gainers) {
          const gain = Math.max(1, Math.floor((M.expGain(foe.m, trainer) * mult * EXP_GAIN_BOOST) / gainers.length));
          await hud.msg(`${josa(sp(m.sp).name, '은/는')} 경험치 ${gain}을(를) 얻었다!${mult > 1 ? ` (연속 정답 보너스 ×${+mult.toFixed(2)})` : ''}`, true);
          const ups = M.applyExp(m, gain);
          if (m === me.m) hud.drawMe(me);
          for (const u of ups) {
            leveled.add(m);
            sfx('levelup'); if (m === me.m) { await S.glow('me'); hud.drawMe(me); }
            await hud.msg(`${josa(sp(m.sp).name, '은/는')} 레벨 ${u.lv}(으)로 올랐다!`, true);
            for (const mv of u.learned) await learnMove(hud, m, mv);
          }
        }
        participants.clear(); participants.add(me.m);
        if (trainer && fi + 1 < foes.length) {
          fi++; foe = M.battler(foes[fi], 'foe'); seen(foe.m.sp);
          lesson = newLesson(); B.lesson = lesson; // 다음 포켓몬 = 새 주제
          await hud.msg(`${josa(opts.name, '은/는')} ${josa(sp(foe.m.sp).name, '을/를')} 내보냈다!`);
          await S.showMon('foe', foe.m.sp, { from: 'ball' }); hud.drawFoe(foe, hud.balls);
          continue;
        }
        result = 'win';
        break;
      }
      if (me.m.hp <= 0) {
        await S.faint('me');
        await hud.msg(`${josa(sp(me.m.sp).name, '은/는')} 쓰러졌다!`, true);
        if (!alive().length) { result = 'lose'; break; }
        const nx = await choosePartyMon(null, true);
        me = M.battler(nx, 'me'); participants.add(nx);
        await S.showMon('me', me.m.sp, { from: 'ball' }); hud.drawMe(me);
        await hud.msg(`가라! ${sp(me.m.sp).name}!`);
      }
    }

    // ── 결과 ──
    if (result === 'win') {
      G.s.stats.wins++;
      if (trainer) {
        music('victory');
        await S.showTrainer(opts.face);
        await hud.msg(`${opts.name}에게 이겼다!`, true);
        if (opts.lose) await hud.msg(`“${opts.lose}”`, true);
        const money = opts.money != null ? opts.money : PRACTICE_REWARD;
                G.s.money += money;
        await hud.msg(`${josa(G.s.name, '은/는')} 상금 ${money}원을 받았다!`, true);
      }
    } else if (result === 'lose') {
      if (trainer && opts.win) await hud.msg(`${opts.name}: “${opts.win}”`, true);
      if (!opts.noBlackout) {
        const lost = Math.floor(G.s.money / 2);
        G.s.money -= lost;
        await hud.msg(`${josa(G.s.name, '은/는')} 싸울 수 있는 포켓몬이 없다!`, true);
        await hud.msg(`${G.s.name}의 눈앞이 캄캄해졌다… (${lost}원을 잃었다)`, true);
      }
    }
  } finally {
    hud.destroy();
    document.body.classList.remove('in-battle');
    await fade(true, 250);
    S.clear();
    S.scene.setVisible(false);
    world.scene.wake();
  }
  // 진화
  for (const m of leveled) await maybeEvolve(m);
  if (result === 'lose' && !opts.noBlackout) {
    healParty();
    const r = G.s.respawn;
    await world.loadMap(r.map, r.x, r.y, 'down');
    save();
    await fade(false, 250);
    W.busy = true;
    await say(['포켓몬센터로 돌아와 포켓몬을 회복시켰다.', '괜찮아! 틀린 문제에서 배운 게 있으니 다시 도전하자!']);
  } else {
    music(W.mapMusicNow?.() || 'town');
    save();
    await fade(false, 250);
  }
  W.busy = false;
  world.refreshFollower?.(); W.updateGoal?.();
  return result;
}

function priority(mv) { return mv && mv.id === 'QuickAttack' ? 1 : 0; }

function pickFoeMove(foe, me, boss) {
  const ms = foe.m.moves.filter((m) => m.pp > 0);
  if (!ms.length) return { id: 'Struggle', name: '발버둥', type: 'Normal', power: 50, acc: 100, effect: 'RecoilEffect' };
  if (boss) { const slot = M.aiPickSlot(foe, me); slot.pp--; return DB.moves[slot.id]; }
  // 가끔 상성이 좋은 공격을 고른다
  const good = ms.filter((m) => DB.moves[m.id].power > 0 && M.typeMult(DB.moves[m.id].type, sp(me.m.sp).types) > 1);
  const slot = good.length && chance(0.5) ? pick(good) : pick(ms);
  slot.pp--;
  return DB.moves[slot.id];
}

/** 행동할 수 있는지 (잠듦·얼음·풀죽음·마비·혼란). 못 하면 false (모으던 기술도 취소) */
async function canMove(hud, S, att, an) {
  if (att.m.status === 'SLP') {
    att.sleep = (att.sleep || rand(1, 4)) - 1;
    if (att.sleep <= 0) { att.m.status = null; await hud.msg(`${josa(an, '은/는')} 잠에서 깨어났다!`); redraw(hud, att); }
    else { await hud.msg(`${josa(an, '은/는')} 쿨쿨 자고 있다.`); return false; }
  }
  if (att.m.status === 'FRZ') {
    if (chance(0.2)) { att.m.status = null; await hud.msg(`${an}의 얼음이 녹았다!`); redraw(hud, att); }
    else { await hud.msg(`${josa(an, '은/는')} 얼어서 움직일 수 없다!`); return false; }
  }
  if (att.flinch) { att.flinch = false; await hud.msg(`${josa(an, '은/는')} 풀이 죽어 움직이지 못했다!`); return false; }
  if (att.m.status === 'PAR' && chance(0.25)) { await hud.msg(`${josa(an, '은/는')} 몸이 저려서 움직일 수 없다!`); return false; }
  if (att.conf > 0) {
    att.conf--;
    await hud.msg(`${josa(an, '은/는')} 혼란에 빠져 있다!`);
    if (chance(0.5)) {
      const dmg = Math.max(1, Math.floor(M.stats(att.m).hp / 12));
      const from = att.m.hp; att.m.hp = Math.max(0, att.m.hp - dmg);
      await S.hit(att.side); await hud.animHp(att.side, att, from);
      await hud.msg('영문도 모른 채 자신을 공격했다!'); return false;
    }
  }
  return true;
}

/** askQuiz: 두 턴 기술의 공격하는 턴에 문제를 내는 함수 (플레이어만) */
async function doMove(hud, S, att, def, move, slot, quizHit, nameOf, askQuiz) {
  const an = nameOf(att), dn = nameOf(def);
  // 파괴광선 반동: 이번 턴은 쉰다
  if (att.recharge) { att.recharge = false; await hud.msg(`${josa(an, '은/는')} 반동으로 움직일 수 없다!`); return; }
  // 행동 불가 상태
  if (!(await canMove(hud, S, att, an))) { M.cancelCharge(att); return; }
  // 두 턴 기술: 첫 턴은 모으기만 하고(PP 소모), 다음 턴에 공격한다
  const phase = M.chargePhase(att, move);
  if (phase === 'charge') {
    if (slot) slot.pp--;
    await hud.msg(`${josa(an, '은/는')} ${M.CHARGE_TEXT[move.id] || '힘을 모으고 있다!'}`);
    await S.glow(att.side);
    return;
  }
  if (slot && phase === 'normal') slot.pp--;
  await hud.msg(`${an}의 ${move.name}!`);
  // 명중: 플레이어는 문제 결과로, 상대는 명중률로. 숨어 있는 상대(공중날기·구멍파기)에겐 닿지 않는다
  const isPlayer = att.side === 'me';
  if (isPlayer && quizHit == null && askQuiz) quizHit = await askQuiz();
  const hitNow = M.canTarget(def, move) && (isPlayer ? quizHit : M.hits(att, def, move, false));
  if (!hitNow) { sfx('miss'); S.missText(def.side); await hud.msg(isPlayer ? `하지만 ${move.name}은(는) 빗나갔다!` : `${an}의 공격은 빗나갔다!`); return; }

  const eff = move.effect;
  if (eff === 'DreamEaterEffect' && M.dreamEaterBlocked(def)) { await hud.msg(`${josa(dn, '은/는')} 잠들어 있지 않아서 효과가 없다!`); return; }
  if (eff === 'OhkoEffect' && M.ohkoBlocked(att, def) && M.typeMult(move.type, sp(def.m.sp).types) > 0) { await hud.msg('하지만 실패했다!'); return; }
  if (move.power > 0 || eff === 'SpecialDamageEffect' || eff === 'SuperFangEffect') {
    let times = 1;
    if (eff === 'TwoToFiveAttacksEffect') times = pick([2, 2, 2, 3, 3, 3, 4, 5]);
    if (eff === 'AttackTwiceEffect' || eff === 'TwineedleEffect') times = 2;
    let total = 0, lastMult = 1, crit = false, n = 0, ko = false;
    await S.attackAnim(att.side, move.type, M.SPECIAL_TYPES.has(move.type));
    for (let i = 0; i < times && def.m.hp > 0; i++) {
      const r = M.damage(att, def, move);
      lastMult = r.mult; crit = crit || r.crit; ko = ko || !!r.ko;
      if (r.mult === 0) break;
      const from = def.m.hp;
      def.m.hp = Math.max(0, def.m.hp - r.dmg);
      total += r.dmg; n++;
      await S.hit(def.side, r.mult > 1);
      await hud.animHp(def.side, def, from);
    }
    def.lastDmg = total;
    if (lastMult === 0) { await hud.msg(`${dn}에게는 효과가 없는 것 같다…`); return; }
    if (ko) await hud.msg('일격필살!');
    if (crit) await hud.msg('급소에 맞았다!');
    if (lastMult > 1) await hud.msg('효과가 굉장했다!');
    else if (lastMult < 1) await hud.msg('효과가 별로인 듯하다…');
    if (times > 1) await hud.msg(`${n}번 맞았다!`);
    if (eff === 'DrainHpEffect' || eff === 'DreamEaterEffect') { const h = Math.max(1, Math.floor(total / 2)); const f = att.m.hp; att.m.hp = Math.min(M.stats(att.m).hp, att.m.hp + h); await hud.animHp(att.side, att, f); await hud.msg(`${dn}의 체력을 흡수했다!`); }
    if (eff === 'RecoilEffect') { const r2 = Math.max(1, Math.floor(total / 4)); const f = att.m.hp; att.m.hp = Math.max(0, att.m.hp - r2); await hud.animHp(att.side, att, f); await hud.msg(`${josa(an, '은/는')} 반동으로 데미지를 입었다!`); }
    if (eff === 'ExplodeEffect') { const f = att.m.hp; att.m.hp = 0; await hud.animHp(att.side, att, f); }
    if (eff === 'HyperBeamEffect' && M.hyperBeamAfter(att, def)) await hud.msg(`${josa(an, '은/는')} 반동으로 다음 턴엔 움직일 수 없다!`);
    if (eff === 'TrappingEffect' && def.m.hp > 0 && M.startTrap(def, move)) await hud.msg(`${josa(dn, '은/는')} ${move.name}에 걸려 꼼짝할 수 없다!`);
    // 추가 효과
    if (def.m.hp > 0) {
      const ss = M.SIDE_STATUS[eff];
      if (ss && !def.m.status && chance(ss[0]) && !sp(def.m.sp).types.includes(move.type)) await inflict(hud, def, ss[1], dn);
      const st = M.SIDE_STAT[eff];
      if (st && chance(st[1])) await stage(hud, def, st[0], -1, dn);
      if ((eff === 'FlinchSideEffect1' && chance(0.1)) || (eff === 'FlinchSideEffect2' && chance(0.3))) def.flinch = true;
      if (eff === 'ConfusionSideEffect' && chance(0.1) && !def.conf) { def.conf = rand(2, 4); await hud.msg(`${josa(dn, '은/는')} 혼란에 빠졌다!`); }
    }
    return;
  }
  // 변화 기술
  await S.effect(eff.includes('Up') || eff === 'HealEffect' ? (att.side === 'me' ? S.me : S.foe) : (att.side === 'me' ? S.foe : S.me), move.type);
  if (eff === 'ReflectEffect' || eff === 'LightScreenEffect') {
    const refl = eff === 'ReflectEffect';
    if (!M.raiseScreen(att, refl ? 'reflect' : 'lscreen')) { await hud.msg('하지만 실패했다!'); return; }
    await hud.msg(`${josa(an, '은/는')} ${refl ? '물리' : '특수'} 공격에 강해졌다!`); return;
  }
  const fx = M.STAT_FX[eff];
  if (fx) { const tgt = fx[0] === 'self' ? att : def; await stage(hud, tgt, fx[1], fx[2], fx[0] === 'self' ? an : dn); return; }
  const stt = M.STATUS_MOVE[eff];
  if (stt) {
    if (def.m.status) { await hud.msg('하지만 실패했다!'); return; }
    if (stt === 'PAR' && move.type === 'Electric' && sp(def.m.sp).types.includes('Ground')) { await hud.msg(`${dn}에게는 효과가 없는 것 같다…`); return; }
    await inflict(hud, def, stt, dn); return;
  }
  if (eff === 'ConfusionEffect') { if (def.conf) { await hud.msg('하지만 실패했다!'); return; } def.conf = rand(2, 5); await hud.msg(`${josa(dn, '은/는')} 혼란에 빠졌다!`); return; }
  if (eff === 'LeechSeedEffect') { if (def.seeded || sp(def.m.sp).types.includes('Grass')) { await hud.msg('하지만 실패했다!'); return; } def.seeded = true; await hud.msg(`${dn}에게 씨앗을 심었다!`); return; }
  if (eff === 'HealEffect') { const f = att.m.hp; att.m.hp = Math.min(M.stats(att.m).hp, att.m.hp + Math.floor(M.stats(att.m).hp / 2)); await hud.animHp(att.side, att, f); await hud.msg(`${josa(an, '은/는')} 체력을 회복했다!`); return; }
  if (eff === 'HazeEffect') { for (const b of [att, def]) Object.keys(b.st).forEach((k) => { b.st[k] = 0; }); await hud.msg('모든 능력 변화가 원래대로 돌아왔다!'); return; }
  if (eff === 'SplashEffect') { await hud.msg('하지만 아무 일도 일어나지 않았다!'); return; }
  if (eff === 'BideEffect') {
    const dmg = (att.lastDmg || 0) * 2;
    if (!dmg) { await hud.msg('참고 있었지만 아무 일도 없었다!'); return; }
    const f = def.m.hp; def.m.hp = Math.max(0, def.m.hp - dmg); await S.hit(def.side); await hud.animHp(def.side, def, f); await hud.msg('참았던 힘을 한꺼번에 풀었다!'); return;
  }
  if (eff === 'SwitchAndTeleportEffect') { await hud.msg('하지만 실패했다!'); return; }
  await hud.msg('하지만 실패했다!');
}

async function inflict(hud, b, st, name) {
  if (b.m.status) return;
  b.m.status = st;
  if (st === 'SLP') b.sleep = rand(1, 4);
  const txt = { PSN: '독에 걸렸다!', PAR: '마비되어 기술이 잘 안 나올지도 모른다!', SLP: '잠들어 버렸다!', BRN: '화상을 입었다!', FRZ: '꽁꽁 얼어 버렸다!' }[st];
  redraw(hud, b);
  await hud.msg(`${josa(name, '은/는')} ${txt}`);
}
async function stage(hud, b, stat, n, name) {
  const before = b.st[stat];
  b.st[stat] = Math.max(-6, Math.min(6, b.st[stat] + n));
  if (b.st[stat] === before) { await hud.msg(`${name}의 ${M.STAT_KO[stat]}은(는) 더 이상 변하지 않는다!`); return; }
  const word = n > 0 ? (n > 1 ? '크게 올라갔다!' : '올라갔다!') : (n < -1 ? '크게 떨어졌다!' : '떨어졌다!');
  await hud.msg(`${name}의 ${josa(M.STAT_KO[stat], '이/가')} ${word}`);
}
function redraw(hud, b) { if (b.side === 'me') hud.drawMe(b); else hud.drawFoe(b, hud.balls); }

async function endTurn(hud, S, b, other, nameOf) {
  const n = nameOf(b);
  const mx = M.stats(b.m).hp;
  if (b.m.status === 'PSN' || b.m.status === 'BRN') {
    const d = Math.max(1, Math.floor(mx / 16)); const f = b.m.hp; b.m.hp = Math.max(0, b.m.hp - d);
    await hud.animHp(b.side, b, f); await hud.msg(`${josa(n, '은/는')} ${b.m.status === 'PSN' ? '독' : '화상'} 때문에 데미지를 입었다!`);
  }
  if (b.seeded && b.m.hp > 0 && other.m.hp > 0) {
    const d = Math.max(1, Math.floor(mx / 16)); const f = b.m.hp; b.m.hp = Math.max(0, b.m.hp - d); await hud.animHp(b.side, b, f);
    const f2 = other.m.hp; other.m.hp = Math.min(M.stats(other.m).hp, other.m.hp + d); await hud.animHp(other.side, other, f2);
    await hud.msg(`씨뿌리기가 ${n}의 체력을 빼앗았다!`);
  }
  // 조이기류: 거는 쪽이 쓰러졌으면 풀린다
  if (b.trap > 0 && b.m.hp > 0) {
    if (other.m.hp <= 0) b.trap = 0;
    else {
      const t = M.trapTick(b); const f = b.m.hp; b.m.hp = Math.max(0, b.m.hp - t.dmg);
      await hud.animHp(b.side, b, f); await hud.msg(`${josa(n, '은/는')} ${b.trapName}에 조여 데미지를 입었다!`);
      if (t.ended && b.m.hp > 0) await hud.msg(`${josa(n, '은/는')} ${b.trapName}에서 풀려났다!`);
    }
  }
  for (const name of M.screenTick(b)) await hud.msg(`${n}의 ${name} 효과가 사라졌다!`);
}

/** 관장·사천왕·챔피언의 고급상처약 (HP 25% 미만일 때 배틀당 한 번) */
async function foeHyperPotion(hud, foe, trainerName) {
  await hud.msg(`${josa(trainerName, '은/는')} 고급상처약을 썼다!`);
  const f = foe.m.hp; foe.m.hp = Math.min(M.stats(foe.m).hp, foe.m.hp + M.HYPER_POTION);
  sfx('heal'); await hud.animHp('foe', foe, f);
  await hud.msg(`${sp(foe.m.sp).name}의 HP가 회복되었다!`);
}

async function learnMove(hud, m, mvId) {
  const d = DB.moves[mvId], nm = sp(m.sp).name;
  if (m.moves.some((x) => x.id === mvId)) return;
  if (m.moves.length < 4) { m.moves.push({ id: mvId, pp: d.pp }); sfx('item'); await hud.msg(`${josa(nm, '은/는')} 새로 ${josa(d.name, '을/를')} 배웠다!`, true); return; }
  await hud.msg(`${josa(nm, '은/는')} ${josa(d.name, '을/를')} 배우고 싶어 한다!`, true);
  await hud.msg('하지만 기술은 4개까지만 기억할 수 있어. 하나를 잊게 할까?', true);
  const idx = await hud.pick([...m.moves.map((x, i) => ({ label: DB.moves[x.id].name, value: i, sub: el('small', {}, typeTag(DB.moves[x.id].type)) })), { label: `${d.name} 안 배우기`, value: -1 }], { moves: true, cancel: -1, title: `${d.name}을(를) 배우려면 잊을 기술을 고르세요` });
  if (idx === -1) { await hud.msg(`${josa(nm, '은/는')} ${josa(d.name, '을/를')} 배우지 않았다.`, true); return; }
  const old = DB.moves[m.moves[idx].id].name;
  m.moves[idx] = { id: mvId, pp: d.pp };
  await hud.msg(`하나, 둘, 짠! ${josa(nm, '은/는')} ${josa(old, '을/를')} 잊고 ${josa(d.name, '을/를')} 배웠다!`, true);
}

/* 가방 (전투 중) */
async function useBagInBattle(hud, S, me, foe, trainer) {
  const ids = Object.keys(G.s.bag).map(Number).filter((id) => ITEMS[id] && ['ball', 'heal', 'cure', 'revive', 'full'].includes(ITEMS[id].kind) && G.s.bag[id] > 0);
  if (!ids.length) { await hud.msg('가방에 쓸 수 있는 도구가 없다!', true); return null; }
  const id = await hud.pick([...ids.map((i) => ({ label: `${ITEMS[i].name} ×${G.s.bag[i]}`, value: i })), { label: '돌아가기', value: -1 }], { moves: true, cancel: -1 });
  if (id === -1) return null;
  const it = ITEMS[id];
  if (it.kind === 'ball') {
    if (trainer) { await hud.msg('남의 포켓몬은 잡을 수 없어!', true); return null; }
    addItem(id, -1);
    await hud.msg(`${josa(G.s.name, '은/는')} ${josa(it.name, '을/를')} 던졌다!`);
    const r = M.catchRoll(foe, it.rate);
    await S.throwBall(r.shakes, r.caught);
    if (r.caught) {
      const nm = sp(foe.m.sp).name;
      await hud.msg(`신난다! ${josa(nm, '을/를')} 잡았다!`, true);
      const fresh = !G.s.dex.caught[foe.m.sp];
      foe.m.status = null;
      const where = receive(foe.m);
      G.s.stats.caught++;
      if (fresh) await hud.msg(`${nm}의 정보가 도감에 새로 기록되었다!`, true);
      if (where === 'box') await hud.msg(`${josa(nm, '은/는')} 보관함으로 보내졌다.`, true);
      return { caught: true };
    }
    await hud.msg(['앗! 포켓몬이 볼에서 나와 버렸다!', '아깝다! 거의 잡을 뻔했는데!', '으으, 조금만 더!'][Math.min(2, r.shakes)], true);
    return { used: true };
  }
  const target = await choosePartyMon(null, false, it);
  if (!target) return null;
  const mx = maxHp(target);
  if (it.kind === 'heal') {
    if (target.hp >= mx || target.hp <= 0) { await hud.msg('효과가 없을 것 같다.', true); return null; }
    addItem(id, -1);
    const f = target.hp; target.hp = Math.min(mx, target.hp + it.heal);
    if (target === me.m) await hud.animHp('me', me, f);
    sfx('heal'); await hud.msg(`${sp(target.sp).name}의 HP가 ${target.hp - f} 회복되었다!`, true);
    return { used: true };
  }
  if (it.kind === 'revive') {
    if (target.hp > 0) { await hud.msg('기절한 포켓몬에게만 쓸 수 있어.', true); return null; }
    addItem(id, -1); target.hp = Math.floor(mx / 2); sfx('heal');
    await hud.msg(`${josa(sp(target.sp).name, '이/가')} 기운을 되찾았다!`, true);
    return { used: true };
  }
  if (it.kind === 'full') {
    if (target.hp <= 0 || (target.hp >= mx && !target.status)) { await hud.msg('효과가 없을 것 같다.', true); return null; }
    addItem(id, -1);
    const f = target.hp; target.hp = mx; target.status = null;
    if (target === me.m) { await hud.animHp('me', me, f); hud.drawMe(me); }
    sfx('heal'); await hud.msg(`${sp(target.sp).name}의 HP와 상태가 모두 회복되었다!`, true);
    return { used: true };
  }
  if (it.kind === 'cure') {
    if (!target.status || (it.cure !== 'ALL' && target.status !== it.cure)) { await hud.msg('효과가 없을 것 같다.', true); return null; }
    addItem(id, -1); target.status = null; if (target === me.m) hud.drawMe(me); sfx('heal');
    await hud.msg(`${josa(sp(target.sp).name, '은/는')} 건강해졌다!`, true);
    return { used: true };
  }
  return null;
}

/** 파티에서 한 마리 고르기 (전투/가방용 간단 목록) */
export function choosePartyMon(current, forced, item) {
  return new Promise((resolve) => {
    const rows = G.s.party.map((m) => {
      const mx = maxHp(m), r = m.hp / mx;
      const dis = !item && (m.hp <= 0 || m === current);
      return { m, dis, node: el('div', { class: 'row' + (dis ? ' dim' : '') }, el('img', { src: monArt(m.sp), alt: '' }),
        el('div', { class: 'grow' }, el('div', { class: 'jua' }, `${sp(m.sp).name}  Lv${m.lv}`, m.status ? ` [${M.STATUS_KO[m.status]}]` : '', m === current ? ' (싸우는 중)' : ''),
          el('div', { class: 'hp ' + (r > 0.5 ? '' : r > 0.2 ? 'mid' : 'low') }, el('i', { style: { width: Math.max(0, r) * 100 + '%' } })),
          el('div', { class: 'sub' }, `HP ${m.hp}/${mx}`))) };
    });
    const body = el('div', { class: 'body' });
    const p = el('div', { class: 'win panel' }, el('header', {}, el('span', {}, forced ? '다음 포켓몬을 고르세요' : item ? fixJosa(`${item.name}을(를) 누구에게?`) : '교체할 포켓몬'), forced ? el('span') : el('button', { class: 'x', onclick: () => fin(null) }, '닫기 ✕')), body);
    const list = el('div', { class: 'list' }); body.append(list);
    root().append(p);
    let sel = rows.findIndex((r) => !r.dis); if (sel < 0) sel = 0;
    rows.forEach((r, i) => { r.node.onclick = () => { if (!r.dis) fin(r.m); }; if (r.dis) r.node.style.opacity = 0.5; list.append(r.node); });
    const paint = () => rows.forEach((r, i) => r.node.classList.toggle('sel', i === sel));
    paint();
    const fin = (v) => { pop(); p.remove(); resolve(v); };
    const pop = Input.push((k) => {
      if (k === 'up') sel = Math.max(0, sel - 1); else if (k === 'down') sel = Math.min(rows.length - 1, sel + 1);
      else if (k === 'a') { if (!rows[sel].dis) { sfx('select'); fin(rows[sel].m); } return; }
      else if (k === 'b' && !forced) { sfx('cancel'); fin(null); return; } else return;
      sfx('select'); paint();
    });
  });
}

/** 진화 연출 (전투 후) */
async function maybeEvolve(m) {
  const to = M.evoTarget(m);
  if (!to) return;
  await playEvolution(m, to);
}
/** 진화 연출 + 진화 (레벨 진화·돌 진화 공용) */
export async function playEvolution(m, to) {
  const from = m.sp;
  await fade(false, 1);
  const box = el('div', { class: 'win panel', style: { alignItems: 'center', justifyContent: 'center', background: '#10204a', color: '#fff' } });
  const img = el('img', { src: monArt(from), style: { width: 'min(50vmin, 280px)', transition: 'filter .25s, transform .25s' } });
  const txt = el('div', { class: 'jua', style: { fontSize: '1.3em', marginTop: '1em', textAlign: 'center' } }, `어라…? ${sp(from).name}의 모습이…!`);
  box.append(img, txt); root().append(box);
  sfx('evolve');
  for (let i = 0; i < 10; i++) {
    img.style.filter = 'brightness(3) saturate(0)'; img.src = monArt(i % 2 ? to : from);
    img.style.transform = `scale(${i % 2 ? 1.05 : 0.95})`;
    await sleep(220 - i * 12);
  }
  img.src = monArt(to); img.style.filter = 'none'; img.style.transform = 'scale(1)';
  const before = M.stats(m).hp;
  m.sp = to;
  m.hp += M.stats(m).hp - before;
  G.s.dex.seen[to] = 1; G.s.dex.caught[to] = 1;
  const newMoves = [...sp(to).start, ...sp(to).learn.filter(([l]) => l <= m.lv).map(([, mv]) => mv)].filter((mv) => DB.moves[mv] && !m.moves.some((x) => x.id === mv));
  const taught = [];
  for (const mv of newMoves) if (m.moves.length < 4) { m.moves.push({ id: mv, pp: DB.moves[mv].pp }); taught.push(DB.moves[mv].name); }
  sfx('levelup');
  txt.textContent = fixJosa(`축하해! ${josa(sp(from).name, '은/는')} ${sp(to).name}(으)로 진화했다!`);
  if (taught.length) txt.textContent += fixJosa(` 새로 ${taught.join(', ')}을(를) 배웠다!`);
  await new Promise((res) => { const pop = Input.push((k) => { if (k === 'a' || k === 'b') { pop(); res(); } }); box.onclick = () => { pop(); res(); }; });
  box.remove();
  save();
}

/* ── 공개 도우미 ── */
export async function wildBattle(wild) {
  const W8 = [51, 51, 39, 25, 25, 25, 13, 13, 11, 3];
  const e = wildPick(G.s.map) || weighted(wild.mons.map((m, i) => ({ m, w: W8[i] ?? 1 })), (x) => x.w).m;
  const m = M.makeMon(e.species ? DB.byKey[e.species].id : e[0], e.level || e[1]);
  return runBattle({ kind: 'wild', foes: [m] });
}
export async function trainerBattle(o) {
  const party = o.party || (DB.trainers[o.cls] || [])[o.set] || (DB.trainers[o.cls] || [])[0] || [];
  let foes = party.map(([id, lv]) => M.makeMon(id, lv, { iv: { atk: 9, def: 8, spe: 8, spc: 8 } }));
  if (o.cls === 'Brock') { // 원작처럼 롱스톤은 참기(Bide)를 쓴다
    const onix = foes.find((m) => m.sp === 95); if (onix) onix.moves = ['Tackle', 'Screech', 'Bide', 'RockThrow'].map((id) => ({ id, pp: DB.moves[id].pp }));
  }
  return runBattle({ kind: 'trainer', foes, ...o });
}
