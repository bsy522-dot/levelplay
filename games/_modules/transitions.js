/* GameFX — GSAP transitions + 5s cinematic intro for 요리왕
 * API: init / playIntro / transitionState / bounceButton / starBurst /
 *      panShake / introIsPlaying / renderOverlay
 * Depends on window.gsap (3.12 CDN). Falls back to setTimeout/no-op if missing.
 */
(function () {
  'use strict';

  var hasGSAP = function () { return !!(window && window.gsap); };

  // Active star particles drawn by renderOverlay() via game's gameLoop tail
  var stars = []; // {x,y,vx,vy,life,maxLife,rot,vrot,glyph,size,alpha}

  var introPlaying = false;
  var introRoot = null;
  var transitionOverlay = null;
  var introSkipHandler = null;

  function safeSound(name) {
    try { if (typeof window.playSound === 'function') window.playSound(name); } catch (e) { /* noop */ }
  }

  /* -------- DOM helpers -------- */
  function ensureIntroDom() {
    introRoot = document.getElementById('intro');
    if (!introRoot) {
      introRoot = document.createElement('div');
      introRoot.id = 'intro';
      document.body.appendChild(introRoot);
    }
    Object.assign(introRoot.style, {
      position: 'fixed', inset: '0', left: '0', top: '0',
      width: '100vw', height: '100vh',
      background: '#000',
      zIndex: '1000',
      display: 'none',
      overflow: 'hidden',
      fontFamily: "'Segoe UI','Malgun Gothic',sans-serif",
      color: '#fff',
      userSelect: 'none',
      cursor: 'pointer'
    });
    return introRoot;
  }

  function ensureTransitionOverlay() {
    transitionOverlay = document.getElementById('transition-overlay');
    if (!transitionOverlay) {
      transitionOverlay = document.createElement('div');
      transitionOverlay.id = 'transition-overlay';
      document.body.appendChild(transitionOverlay);
    }
    Object.assign(transitionOverlay.style, {
      position: 'fixed', inset: '0', left: '0', top: '0',
      width: '100vw', height: '100vh',
      background: '#000',
      opacity: '0',
      zIndex: '999',
      pointerEvents: 'none'
    });
    return transitionOverlay;
  }

  /* -------- init -------- */
  function init() {
    ensureIntroDom();
    ensureTransitionOverlay();
    if (!hasGSAP()) {
      console.warn('[GameFX] GSAP not loaded — using fallback (no animations)');
    }
  }

  /* -------- introIsPlaying -------- */
  function introIsPlaying() { return introPlaying; }

  /* -------- playIntro(onDone) -------- */
  function playIntro(onDone) {
    if (introPlaying) return;
    introPlaying = true;
    var root = ensureIntroDom();
    root.innerHTML = '';
    root.style.display = 'block';
    root.style.background = '#000';

    // Gradient background overlay (faded in 1.5s -> 3.0s)
    var grad = document.createElement('div');
    Object.assign(grad.style, {
      position: 'absolute', inset: '0',
      background: 'radial-gradient(ellipse at center, #ff8c42 0%, #c2410c 45%, #1a0a00 100%)',
      opacity: '0',
      pointerEvents: 'none'
    });
    root.appendChild(grad);

    // Swirl emoji layer
    var swirlLayer = document.createElement('div');
    Object.assign(swirlLayer.style, {
      position: 'absolute', inset: '0', pointerEvents: 'none'
    });
    root.appendChild(swirlLayer);

    var emojis = ['🍳','🍜','🍙','🥘','🍱','🥩','🍝','🌶️','🍞','🥗'];
    var cx = window.innerWidth / 2;
    var cy = window.innerHeight / 2;
    var emojiNodes = emojis.map(function (e, i) {
      var span = document.createElement('span');
      span.textContent = e;
      var startAngle = (Math.PI * 2 * i) / emojis.length;
      var startR = Math.max(window.innerWidth, window.innerHeight) * 0.7;
      var sx = cx + Math.cos(startAngle) * startR;
      var sy = cy + Math.sin(startAngle) * startR;
      Object.assign(span.style, {
        position: 'absolute',
        left: '0', top: '0',
        fontSize: '64px',
        transform: 'translate(' + sx + 'px,' + sy + 'px) rotate(0deg) scale(1)',
        willChange: 'transform, opacity',
        opacity: '1'
      });
      span._startAngle = startAngle;
      span._startR = startR;
      swirlLayer.appendChild(span);
      return span;
    });

    // Title "🍳 요리왕 🍜" — letter by letter
    var titleWrap = document.createElement('div');
    Object.assign(titleWrap.style, {
      position: 'absolute', left: '0', right: '0', top: '38%',
      textAlign: 'center',
      fontSize: 'clamp(48px, 9vw, 88px)',
      fontWeight: '900',
      letterSpacing: '6px',
      textShadow: '0 4px 18px rgba(255,140,66,.85), 0 0 40px rgba(255,200,0,.6)',
      pointerEvents: 'none'
    });
    var titleText = '🍳 요리왕 🍜';
    var titleLetters = Array.from(titleText).map(function (ch) {
      var s = document.createElement('span');
      s.textContent = ch === ' ' ? ' ' : ch;
      Object.assign(s.style, {
        display: 'inline-block',
        opacity: '0',
        transform: 'scale(0) rotate(-180deg)',
        margin: '0 4px',
        willChange: 'transform, opacity'
      });
      titleWrap.appendChild(s);
      return s;
    });
    root.appendChild(titleWrap);

    // Subtitle
    var subtitle = document.createElement('div');
    subtitle.textContent = '어린이 요리 교육 게임';
    Object.assign(subtitle.style, {
      position: 'absolute', left: '0', right: '0', top: '58%',
      textAlign: 'center',
      fontSize: 'clamp(20px, 3.2vw, 32px)',
      fontWeight: '600',
      color: '#fff5dc',
      opacity: '0',
      pointerEvents: 'none',
      letterSpacing: '2px'
    });
    root.appendChild(subtitle);

    // Edition badge
    var edition = document.createElement('div');
    edition.textContent = '✨ 새로운 시네마틱 에디션 ✨';
    Object.assign(edition.style, {
      position: 'absolute', left: '0', right: '0', top: '66%',
      textAlign: 'center',
      fontSize: 'clamp(16px, 2.4vw, 24px)',
      fontWeight: '700',
      color: '#ffe082',
      opacity: '0',
      pointerEvents: 'none',
      textShadow: '0 0 12px rgba(255,224,130,.9)'
    });
    root.appendChild(edition);

    // Tap to start
    var tapHint = document.createElement('div');
    tapHint.textContent = '탭하여 시작';
    Object.assign(tapHint.style, {
      position: 'absolute', left: '0', right: '0', bottom: '12%',
      textAlign: 'center',
      fontSize: 'clamp(18px, 2.8vw, 26px)',
      fontWeight: '700',
      color: '#fff',
      opacity: '0',
      pointerEvents: 'none',
      textShadow: '0 2px 8px rgba(0,0,0,.7)'
    });
    root.appendChild(tapHint);

    var done = false;
    function finish() {
      if (done) return;
      done = true;
      if (introSkipHandler) {
        root.removeEventListener('click', introSkipHandler);
        root.removeEventListener('touchstart', introSkipHandler);
        introSkipHandler = null;
      }
      var hide = function () {
        root.style.display = 'none';
        root.innerHTML = '';
        introPlaying = false;
        if (typeof onDone === 'function') {
          try { onDone(); } catch (e) { console.error(e); }
        }
      };
      if (hasGSAP()) {
        window.gsap.to(root, {
          opacity: 0, duration: 0.4, ease: 'power2.in',
          onComplete: function () { root.style.opacity = '1'; hide(); }
        });
      } else {
        setTimeout(hide, 50);
      }
    }

    introSkipHandler = function () { finish(); };
    root.addEventListener('click', introSkipHandler);
    root.addEventListener('touchstart', introSkipHandler, { passive: true });

    if (!hasGSAP()) {
      // Fallback: just wait 5s
      setTimeout(finish, 5000);
      return;
    }

    var gsap = window.gsap;
    var tl = gsap.timeline({ onComplete: finish });

    // 0 -> 1.5s: emoji swirl
    emojiNodes.forEach(function (node, i) {
      var spin = 720 + Math.random() * 360;
      tl.to(node, {
        duration: 1.5,
        x: cx - 32, // half emoji width
        y: cy - 32,
        rotation: spin,
        scale: 0.2,
        ease: 'power2.in',
        modifiers: {
          x: function (val) {
            // value passed is end-target — gsap handles tween, this is identity
            return val;
          }
        },
        onStart: function () { if (i === 0) safeSound('star'); }
      }, 0);
      // because direct x/y won't apply since transform is set inline, use tween from current
      gsap.set(node, {
        x: cx + Math.cos(node._startAngle) * node._startR,
        y: cy + Math.sin(node._startAngle) * node._startR,
        rotation: 0,
        scale: 1
      });
    });
    // Re-apply emoji tween after gsap.set normalises transform
    emojiNodes.forEach(function (node, i) {
      gsap.to(node, {
        duration: 1.5,
        x: cx - 32,
        y: cy - 32,
        rotation: 720 + i * 36,
        scale: 0.2,
        opacity: 0,
        ease: 'power2.in'
      });
    });

    // Background gradient fade-in (1.0 -> 3.0)
    tl.to(grad, { opacity: 1, duration: 1.4, ease: 'power1.inOut' }, 1.0);

    // 1.5 -> 3.0s: Title letters in
    titleLetters.forEach(function (s, i) {
      tl.to(s, {
        opacity: 1,
        scale: 1,
        rotation: 0,
        duration: 0.55,
        ease: 'back.out(2.0)',
        onStart: function () { if (i % 2 === 0) safeSound('click'); }
      }, 1.5 + i * 0.12);
    });

    // 3.0 -> 4.5s: subtitle + edition
    tl.to(subtitle, { opacity: 1, duration: 0.8, ease: 'power2.out' }, 3.0);
    tl.fromTo(edition,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.6)' }, 3.4);
    // Edition blink
    tl.to(edition, {
      opacity: 0.35, duration: 0.35, repeat: 3, yoyo: true, ease: 'sine.inOut'
    }, 3.7);

    // 4.5 -> 5.0s: tap hint blink
    tl.fromTo(tapHint,
      { opacity: 0 },
      { opacity: 1, duration: 0.25, ease: 'power1.out' }, 4.5);
    tl.to(tapHint, {
      opacity: 0.2, duration: 0.25, repeat: 1, yoyo: true, ease: 'sine.inOut'
    }, 4.75);
  }

  /* -------- transitionState(from, to, doneCb) -------- */
  function transitionState(fromState, toState, doneCb) {
    var ov = ensureTransitionOverlay();
    function applyDone() {
      if (typeof doneCb === 'function') {
        try { doneCb(); } catch (e) { console.error(e); }
      }
    }
    if (!hasGSAP()) {
      applyDone();
      return;
    }
    var gsap = window.gsap;
    ov.style.pointerEvents = 'auto';
    gsap.killTweensOf(ov);
    gsap.set(ov, { opacity: 0 });
    gsap.to(ov, {
      opacity: 1, duration: 0.2, ease: 'power2.in',
      onComplete: function () {
        applyDone();
        gsap.to(ov, {
          opacity: 0, duration: 0.3, ease: 'power2.out',
          onComplete: function () { ov.style.pointerEvents = 'none'; }
        });
      }
    });
  }

  /* -------- bounceButton(rectOrEl) -------- */
  function bounceButton(target) {
    if (!target) return;
    if (!hasGSAP()) return;
    var gsap = window.gsap;
    // DOM element path
    if (target.nodeType === 1) {
      gsap.fromTo(target,
        { scale: 1 },
        { scale: 0.92, duration: 0.08, ease: 'power2.in', yoyo: true, repeat: 1,
          transformOrigin: '50% 50%' });
      return;
    }
    // Canvas-rect path: spawn temporary overlay div on canvas
    if (typeof target.x === 'number' && typeof target.y === 'number') {
      var canvas = document.getElementById('gc');
      var rect = canvas ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
      var canvasW = canvas ? (canvas.width || canvas.clientWidth) : window.innerWidth;
      var canvasH = canvas ? (canvas.height || canvas.clientHeight) : window.innerHeight;
      var sx = rect.width / canvasW;
      var sy = rect.height / canvasH;
      var div = document.createElement('div');
      Object.assign(div.style, {
        position: 'fixed',
        left: (rect.left + target.x * sx) + 'px',
        top: (rect.top + target.y * sy) + 'px',
        width: ((target.w || 60) * sx) + 'px',
        height: ((target.h || 40) * sy) + 'px',
        border: '3px solid rgba(255,224,130,.95)',
        borderRadius: '12px',
        boxShadow: '0 0 18px rgba(255,200,0,.7)',
        pointerEvents: 'none',
        zIndex: '500',
        opacity: '1',
        transformOrigin: '50% 50%'
      });
      document.body.appendChild(div);
      gsap.fromTo(div,
        { scale: 1, opacity: 1 },
        { scale: 1.18, opacity: 0, duration: 0.22, ease: 'power2.out',
          onComplete: function () { if (div.parentNode) div.parentNode.removeChild(div); } });
    }
  }

  /* -------- starBurst(ctx, x, y, count) -------- */
  function starBurst(ctx, x, y, count) {
    count = count || 12;
    var glyphs = ['⭐','✨','🌟'];
    for (var i = 0; i < count; i++) {
      var ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      var spd = 120 + Math.random() * 160;
      stars.push({
        x: x, y: y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 40,
        life: 1.2,
        maxLife: 1.2,
        rot: 0,
        vrot: (Math.random() - 0.5) * 8,
        glyph: glyphs[i % glyphs.length],
        size: 22 + Math.random() * 14,
        alpha: 1
      });
    }
    safeSound('star');
  }

  // Update star particles independently of GSAP using rAF dt tracking
  var lastT = 0;
  function tickStars(t) {
    if (!lastT) lastT = t;
    var dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    for (var i = stars.length - 1; i >= 0; i--) {
      var s = stars[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 220 * dt; // gravity
      s.rot += s.vrot * dt;
      s.life -= dt;
      s.alpha = Math.max(0, s.life / s.maxLife);
      if (s.life <= 0) stars.splice(i, 1);
    }
    requestAnimationFrame(tickStars);
  }
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(tickStars);

  // Called from game gameLoop tail to render overlay particles after clearRect
  function renderOverlay(ctx) {
    if (!ctx || !stars.length) return;
    ctx.save();
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      ctx.globalAlpha = s.alpha;
      ctx.translate(s.x, s.y);
      ctx.rotate(s.rot);
      ctx.font = s.size + "px 'Segoe UI Emoji','Apple Color Emoji',sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'gold';
      ctx.fillText(s.glyph, 0, 0);
      ctx.rotate(-s.rot);
      ctx.translate(-s.x, -s.y);
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  /* -------- panShake(target, durSec) -------- */
  function panShake(target, dur) {
    if (!target) return;
    dur = dur || 0.4;
    if (!hasGSAP()) {
      target.offsetX = 0; target.offsetY = 0;
      return;
    }
    var gsap = window.gsap;
    var amp = 3;
    var steps = Math.max(6, Math.floor(dur / 0.04));
    var tl = gsap.timeline({
      onComplete: function () { target.offsetX = 0; target.offsetY = 0; }
    });
    for (var i = 0; i < steps; i++) {
      var decay = 1 - i / steps;
      tl.to(target, {
        offsetX: (Math.random() * 2 - 1) * amp * decay,
        offsetY: (Math.random() * 2 - 1) * amp * decay,
        duration: dur / steps,
        ease: 'sine.inOut'
      });
    }
    tl.to(target, { offsetX: 0, offsetY: 0, duration: 0.05 });
  }

  /* -------- expose -------- */
  window.GameFX = {
    init: init,
    playIntro: playIntro,
    transitionState: transitionState,
    bounceButton: bounceButton,
    starBurst: starBurst,
    panShake: panShake,
    introIsPlaying: introIsPlaying,
    renderOverlay: renderOverlay
  };
})();
