/* dialogue_loader.js
 * 동물농장 NPC 대사 로더
 *  - dialogues.json (Ollama 생성본) 우선
 *  - 실패 시 dialogue_fallback.json 으로 폴백
 *  - window.NPC.say(animalKey, ctx) 로 랜덤 대사 1줄 반환
 */
(function () {
  const PATHS = ["_assets/dialogues.json", "_assets/dialogue_fallback.json"];
  const NPC = {
    data: null,
    source: null,
    ready: false,

    async load() {
      for (const p of PATHS) {
        try {
          const r = await fetch(p, { cache: "no-cache" });
          if (!r.ok) continue;
          this.data = await r.json();
          this.source = p;
          this.ready = true;
          console.log("[NPC] loaded:", p);
          return true;
        } catch (e) {
          // 다음 경로 시도
        }
      }
      console.warn("[NPC] 모든 대사 파일 로드 실패");
      return false;
    },

    /** 동물 클릭 시 컨텍스트(season/weather/mood) 기반 랜덤 대사 */
    say(animalKey, ctx = {}) {
      if (!this.ready || !this.data?.animals?.[animalKey]) {
        return null;
      }
      const lines = this.data.animals[animalKey];
      if (!Array.isArray(lines) || !lines.length) return null;

      // ctx 일치 우선 → 부분일치 → 전체 랜덤
      let pool = lines.filter(
        (d) =>
          (!ctx.season  || d.season  === ctx.season) &&
          (!ctx.weather || d.weather === ctx.weather) &&
          (!ctx.mood    || d.mood    === ctx.mood)
      );
      if (!pool.length) {
        pool = lines.filter(
          (d) => !ctx.season || d.season === ctx.season
        );
      }
      if (!pool.length) pool = lines;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      return typeof pick === "string" ? pick : pick.text;
    },

    /** 작물 도감 카드 반환 */
    cropCard(cropKey) {
      return this.data?.crops?.[cropKey] || null;
    },

    /** 채팅 버블 DOM 생성·자동소거 (선택 사용) */
    bubble(text, x, y, parent) {
      const el = document.createElement("div");
      el.textContent = text;
      el.style.cssText =
        "position:absolute;left:" + x + "px;top:" + y + "px;" +
        "background:#fff;color:#222;padding:6px 10px;border-radius:12px;" +
        "font-size:13px;border:2px solid #444;z-index:9999;" +
        "max-width:160px;box-shadow:2px 3px 0 #000;pointer-events:none;" +
        "transition:opacity .4s";
      (parent || document.body).appendChild(el);
      setTimeout(() => (el.style.opacity = "0"), 2200);
      setTimeout(() => el.remove(), 2700);
    },
  };

  window.NPC = NPC;
  document.addEventListener("DOMContentLoaded", () => NPC.load());
})();
