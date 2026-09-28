/* battle.js — '조우 무리(roster)' 단위 턴제 전투.
 *
 * 테마를 모르고 skin 규약만 읽는다.
 * 한 무리에 여러 캐릭터가 들어올 수 있다(예: 포켓몬 1세대 151마리).
 * = list 한 칸 = 무리 하나. 그 안의 캐릭터가 순서대로 등장한다.
 *   → 배틀 = 무리의 앞 포켓몬을 잡고, 다음이 나오고, 끝까지 이긴다.
 */
(function (global) {
  'use strict';

  function Battle(skin, entry, state) {
    this.skin = skin;
    this.entry = entry;
    this.state = state;
    this.roster = entry.roster || [];      /* 이 무리의 캐릭터들 */
    this.slot = 0;                          /* 지금 상대 인덱스 */
    this.quiz = (entry.quiz || []).slice(); /* 무리 전체가 공유하는 문제 */
    this.qi = 0;
    this.hintUsed = false;
    this.over = false;
    this.won = false;
    this.started = false;
    this.busy = false;   /* 채점 직후 1초 잠금 — 이중 답 방지 */
  }

  Battle.prototype.mon = function () { return this.roster[this.slot] || this.entry.monster; };
  Battle.prototype.total = function () { return this.quiz.length; };
  Battle.prototype.hpLeft = function () { return Math.max(0, this.total() - this.qi); };
  Battle.prototype.dmg = function () { return this.skin.battle.wrong_damage; };
  Battle.prototype.rosterSize = function () { return Math.max(1, this.roster.length); };
  /* 무리에서 몇 번째 상대인지(화면 표기용) */
  Battle.prototype.slotLabel = function () {
    return this.rosterSize() > 1 ? (this.slot + 1) + '/' + this.rosterSize() : '';
  };

  Battle.prototype.cur = function () { return this.quiz[this.qi] || null; };

  Battle.prototype.gp = function (base) {
    return this.hintUsed ? Math.round(base * this.skin.battle.hint_reward_factor) : base;
  };

  Battle.prototype.useHint = function () {
    if (this.hintUsed || this.over) return 0;
    this.hintUsed = true;
    this.state.hintTotal += 1;
    return 1;
  };

  /* 정답/오답 반영.
   * - 정답: 몬스터 HP 1 감소. 0 이 되면 다음 캐릭터로 넘어간다.
   * - 오답: 히어로 HP 감소. 0 이 되면 패배.
   * - 무리 끝까지 잡았으면 승리.
   * 같은 무리에서 잡은 수는 entry.ord 로 기록해 다음 무리 진행도를 이어받는다. */
  Battle.prototype.hit = function (wasCorrect) {
    if (this.over) return this.result();
    if (wasCorrect) {
      this.qi += 1;
      if (this.qi >= this.total()) {
        /* 문제 소진 → 남은 상대가 있으면 다음 상대로, 없으면 승리 */
        if (this.slot + 1 < this.rosterSize()) {
          this.slot += 1;
          this.qi = 0;
          this.started = true;
        } else {
          this.over = true;
          this.won = true;
        }
      }
    } else {
      this.state.heroHp = Math.max(0, this.state.heroHp - this.dmg());
      if (this.state.heroHp <= 0) { this.over = true; this.won = false; }
    }
    return this.result();
  };

  Battle.prototype.result = function () {
    return {
      over: this.over, won: this.won,
      monster: this.mon(),
      heroHp: this.state.heroHp, heroMax: this.state.heroMaxHp,
      answered: this.qi, total: this.total(),
      slot: this.slot, slotSize: this.rosterSize(),
    };
  };

  global.MB.Battle = Battle;
})(window);
