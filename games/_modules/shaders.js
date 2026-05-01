/**
 * GameShaders - Cinematic WebGL shader effects for 요리왕 (Cooking Master)
 *
 * Three.js-based overlay shader plane on a separate canvas (#gl3d).
 * Procedural fire, steam, and boiling water effects with no textures.
 *
 * Noise functions (snoise) adapted from ashima/webgl-noise
 *   https://github.com/ashima/webgl-noise
 *   Copyright (C) 2011 Ashima Arts. MIT License.
 *
 * API:
 *   GameShaders.init(renderer, scene)
 *   GameShaders.triggerFire(screenX, screenY, intensity)
 *   GameShaders.triggerSteam(screenX, screenY, intensity)
 *   GameShaders.triggerBoil(active, screenX, screenY, w, h)
 *   GameShaders.clearAll()
 *   GameShaders.update(deltaTime)
 *   GameShaders.dispose()
 */
(function () {
    'use strict';

    // ----- WebGL / THREE availability stub -----
    if (typeof window === 'undefined') return;

    var THREE = window.THREE;
    if (!THREE) {
        // No-op stub when THREE is missing or WebGL is unsupported.
        window.GameShaders = {
            init: function () { return false; },
            triggerFire: function () {},
            triggerSteam: function () {},
            triggerBoil: function () {},
            clearAll: function () {},
            update: function () {},
            dispose: function () {}
        };
        return;
    }

    // ----- Shared GLSL helpers (Ashima simplex noise + smoothNoise) -----
    var GLSL_NOISE = [
        '// Ashima webgl-noise (MIT) - Simplex 2D',
        'vec3 mod289(vec3 x){ return x - floor(x * (1.0/289.0)) * 289.0; }',
        'vec2 mod289(vec2 x){ return x - floor(x * (1.0/289.0)) * 289.0; }',
        'vec3 permute(vec3 x){ return mod289(((x*34.0)+1.0)*x); }',
        'float snoise(vec2 v){',
        '  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);',
        '  vec2 i  = floor(v + dot(v, C.yy));',
        '  vec2 x0 = v - i + dot(i, C.xx);',
        '  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);',
        '  vec4 x12 = x0.xyxy + C.xxzz;',
        '  x12.xy -= i1;',
        '  i = mod289(i);',
        '  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));',
        '  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);',
        '  m = m*m; m = m*m;',
        '  vec3 x = 2.0 * fract(p * C.www) - 1.0;',
        '  vec3 h = abs(x) - 0.5;',
        '  vec3 ox = floor(x + 0.5);',
        '  vec3 a0 = x - ox;',
        '  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);',
        '  vec3 g;',
        '  g.x  = a0.x  * x0.x  + h.x  * x0.y;',
        '  g.yz = a0.yz * x12.xz + h.yz * x12.yw;',
        '  return 130.0 * dot(m, g);',
        '}',
        'float smoothNoise(vec2 p){',
        '  return 0.5 + 0.5 * snoise(p);',
        '}',
        'float fbm(vec2 p){',
        '  float v = 0.0;',
        '  float a = 0.5;',
        '  for(int i = 0; i < 4; i++){',
        '    v += a * snoise(p);',
        '    p *= 2.0;',
        '    a *= 0.5;',
        '  }',
        '  return v;',
        '}'
    ].join('\n');

    var VERT_SIMPLE = [
        'varying vec2 vUv;',
        'void main(){',
        '  vUv = uv;',
        '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
        '}'
    ].join('\n');

    // ----- Fire fragment shader -----
    var FRAG_FIRE = [
        'precision highp float;',
        'varying vec2 vUv;',
        'uniform float uTime;',
        'uniform float uIntensity;',
        'uniform float uLife;',
        GLSL_NOISE,
        'void main(){',
        '  vec2 uv = vUv;',
        '  // Center horizontally, base at bottom',
        '  vec2 p = vec2((uv.x - 0.5) * 2.0, uv.y);',
        '  // Vertical rise: noise field scrolls downward over time',
        '  vec2 q = vec2(p.x * 2.5, p.y * 2.0 - uTime * 1.6);',
        '  float n = fbm(q);',
        '  // Flame body: stronger near base, narrows upward',
        '  float widthFalloff = 1.0 - uv.y * 0.85;',
        '  float radial = 1.0 - abs(p.x) / max(widthFalloff, 0.05);',
        '  radial = clamp(radial, 0.0, 1.0);',
        '  float flame = radial * (0.6 + 0.6 * n);',
        '  // Vertical mask - fade out toward top',
        '  float vmask = smoothstep(1.0, 0.15, uv.y);',
        '  flame *= vmask;',
        '  // Flicker',
        '  float flicker = 0.85 + 0.25 * snoise(vec2(uTime * 5.0, 0.0));',
        '  flame *= flicker * uIntensity;',
        '  // Color ramp: yellow (hot core) -> orange -> red -> transparent',
        '  vec3 colYellow = vec3(1.0, 1.0, 0.0);',
        '  vec3 colOrange = vec3(1.0, 0.647, 0.0);',
        '  vec3 colRed    = vec3(1.0, 0.27, 0.0);',
        '  float t = clamp(flame, 0.0, 1.0);',
        '  vec3 col = mix(colRed, colOrange, smoothstep(0.2, 0.55, t));',
        '  col = mix(col, colYellow, smoothstep(0.6, 0.95, t));',
        '  // Alpha',
        '  float alpha = smoothstep(0.05, 0.45, flame) * uLife;',
        '  if (alpha < 0.01) discard;',
        '  gl_FragColor = vec4(col, alpha);',
        '}'
    ].join('\n');

    // ----- Steam fragment shader -----
    var FRAG_STEAM = [
        'precision highp float;',
        'varying vec2 vUv;',
        'uniform float uTime;',
        'uniform float uIntensity;',
        'uniform float uLife;',
        GLSL_NOISE,
        'void main(){',
        '  vec2 uv = vUv;',
        '  // Gentle horizontal sway',
        '  float sway = sin(uTime * 1.3 + uv.y * 4.0) * 0.08;',
        '  vec2 p = vec2(uv.x - 0.5 + sway, uv.y);',
        '  // Smoke plume scrolls upward',
        '  vec2 q = vec2(p.x * 2.0, p.y * 1.5 - uTime * 0.6);',
        '  float n = 0.0;',
        '  float a = 0.55;',
        '  vec2 qq = q;',
        '  for(int i = 0; i < 4; i++){',
        '    n += a * smoothNoise(qq);',
        '    qq *= 2.05;',
        '    a *= 0.55;',
        '  }',
        '  // Radial mask widening with height',
        '  float spread = 0.25 + uv.y * 0.5;',
        '  float radial = 1.0 - clamp(abs(p.x) / spread, 0.0, 1.0);',
        '  radial = smoothstep(0.0, 1.0, radial);',
        '  // Vertical mask - rise & fade out at top',
        '  float vmask = smoothstep(0.0, 0.25, uv.y) * smoothstep(1.0, 0.55, uv.y);',
        '  float density = n * radial * vmask;',
        '  density *= uIntensity;',
        '  // White -> gray gradient (older = grayer)',
        '  vec3 colHot  = vec3(1.0, 1.0, 1.0);',
        '  vec3 colCool = vec3(0.65, 0.68, 0.72);',
        '  vec3 col = mix(colHot, colCool, uv.y);',
        '  float alpha = clamp(density, 0.0, 0.6) * uLife;',
        '  if (alpha < 0.01) discard;',
        '  gl_FragColor = vec4(col, alpha);',
        '}'
    ].join('\n');

    // ----- Boiling water fragment shader -----
    var FRAG_BOIL = [
        'precision highp float;',
        'varying vec2 vUv;',
        'uniform float uTime;',
        'uniform float uActive;',
        GLSL_NOISE,
        'void main(){',
        '  vec2 uv = vUv;',
        '  // Surface displacement noise',
        '  vec2 q = vec2(uv.x * 6.0 + uTime * 0.4, uv.y * 6.0 + uTime * 0.5);',
        '  float surf = fbm(q);',
        '  // Bubble cells - voronoi-ish via repeated snoise lookups',
        '  vec2 br = vec2(uv.x * 12.0, uv.y * 12.0);',
        '  float b1 = smoothNoise(br + vec2(uTime * 0.9, uTime * 1.1));',
        '  float b2 = smoothNoise(br * 1.7 + vec2(-uTime * 0.7, uTime * 0.8));',
        '  float bubble = smoothstep(0.78, 0.92, b1) + smoothstep(0.80, 0.94, b2);',
        '  bubble = clamp(bubble, 0.0, 1.0);',
        '  // Base teal water color',
        '  vec3 deep   = vec3(0.118, 0.353, 0.310);',
        '  vec3 shallow= vec3(0.20, 0.55, 0.48);',
        '  vec3 base = mix(deep, shallow, 0.5 + 0.5 * surf);',
        '  // Foam highlight',
        '  vec3 foam = vec3(1.0, 1.0, 1.0);',
        '  vec3 col = mix(base, foam, bubble * 0.85);',
        '  float alpha = 0.75 * uActive;',
        '  if (alpha < 0.01) discard;',
        '  gl_FragColor = vec4(col, alpha);',
        '}'
    ].join('\n');

    // ----- Pool config -----
    var POOL_FIRE = 5;
    var POOL_STEAM = 5;
    var FIRE_LIFE = 2.0;     // seconds
    var STEAM_LIFE = 1.5;    // seconds
    var FIRE_PLANE_W = 120;  // px
    var FIRE_PLANE_H = 200;
    var STEAM_PLANE_W = 140;
    var STEAM_PLANE_H = 220;

    var state = {
        ready: false,
        renderer: null,
        scene: null,
        camera: null,
        viewportW: 0,
        viewportH: 0,
        time: 0,
        firePool: [],
        steamPool: [],
        boil: null
    };

    // Convert screen pixel to world position used by ortho camera (px-mapped).
    // Ortho camera is set up so that 1 world unit == 1 px, with origin at top-left.
    function screenToWorld(x, y) {
        return { x: x - state.viewportW / 2, y: state.viewportH / 2 - y };
    }

    function makePlane(width, height, fragShader, extraUniforms) {
        var uniforms = {
            uTime: { value: 0 },
            uIntensity: { value: 1.0 },
            uLife: { value: 0.0 }
        };
        if (extraUniforms) {
            for (var k in extraUniforms) {
                if (Object.prototype.hasOwnProperty.call(extraUniforms, k)) {
                    uniforms[k] = extraUniforms[k];
                }
            }
        }
        var geom = new THREE.PlaneGeometry(width, height, 1, 1);
        var mat = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: VERT_SIMPLE,
            fragmentShader: fragShader,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            blending: THREE.NormalBlending
        });
        var mesh = new THREE.Mesh(geom, mat);
        mesh.visible = false;
        mesh.frustumCulled = false;
        return { mesh: mesh, mat: mat, uniforms: uniforms };
    }

    function init(renderer, scene) {
        if (state.ready) return true;
        if (!renderer || !scene) return false;

        // Detect WebGL support via Three's renderer (already created if passed).
        try {
            state.renderer = renderer;
            state.scene = scene;
            var size = new THREE.Vector2();
            renderer.getSize(size);
            state.viewportW = size.x || window.innerWidth;
            state.viewportH = size.y || window.innerHeight;

            // Ortho camera in pixel space (origin center, +y up).
            var w = state.viewportW;
            var h = state.viewportH;
            state.camera = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, -1000, 1000);
            state.camera.position.z = 10;

            // Allocate pools
            for (var i = 0; i < POOL_FIRE; i++) {
                var f = makePlane(FIRE_PLANE_W, FIRE_PLANE_H, FRAG_FIRE);
                f.mesh.renderOrder = 100;
                f.life = 0;
                f.maxLife = FIRE_LIFE;
                f.active = false;
                scene.add(f.mesh);
                state.firePool.push(f);
            }
            for (var j = 0; j < POOL_STEAM; j++) {
                var s = makePlane(STEAM_PLANE_W, STEAM_PLANE_H, FRAG_STEAM);
                s.mesh.renderOrder = 101;
                s.life = 0;
                s.maxLife = STEAM_LIFE;
                s.active = false;
                scene.add(s.mesh);
                state.steamPool.push(s);
            }

            // Boil plane (sized at trigger)
            var b = makePlane(1, 1, FRAG_BOIL, { uActive: { value: 0.0 } });
            b.mesh.renderOrder = 99;
            b.active = false;
            scene.add(b.mesh);
            state.boil = b;

            state.ready = true;
            return true;
        } catch (err) {
            // WebGL init failure -> fall back to no-op
            state.ready = false;
            return false;
        }
    }

    function pickFreeSlot(pool) {
        // Prefer inactive slot; otherwise oldest (lowest life remaining).
        var oldest = null;
        for (var i = 0; i < pool.length; i++) {
            if (!pool[i].active) return pool[i];
            if (!oldest || pool[i].life < oldest.life) oldest = pool[i];
        }
        return oldest;
    }

    function triggerFire(screenX, screenY, intensity) {
        if (!state.ready) return;
        var slot = pickFreeSlot(state.firePool);
        if (!slot) return;
        var w = screenToWorld(screenX, screenY);
        // Anchor base of flame at (x, y); plane center sits above by H/2.
        slot.mesh.position.set(w.x, w.y + FIRE_PLANE_H / 2, 0);
        slot.mesh.visible = true;
        slot.active = true;
        slot.life = FIRE_LIFE;
        slot.maxLife = FIRE_LIFE;
        slot.uniforms.uIntensity.value = (intensity != null ? intensity : 1.0);
        slot.uniforms.uLife.value = 1.0;
    }

    function triggerSteam(screenX, screenY, intensity) {
        if (!state.ready) return;
        var slot = pickFreeSlot(state.steamPool);
        if (!slot) return;
        var w = screenToWorld(screenX, screenY);
        slot.mesh.position.set(w.x, w.y + STEAM_PLANE_H / 2, 0);
        slot.mesh.visible = true;
        slot.active = true;
        slot.life = STEAM_LIFE;
        slot.maxLife = STEAM_LIFE;
        slot.uniforms.uIntensity.value = (intensity != null ? intensity : 0.8);
        slot.uniforms.uLife.value = 1.0;
    }

    function triggerBoil(active, screenX, screenY, width, height) {
        if (!state.ready) return;
        var b = state.boil;
        if (!active) {
            b.uniforms.uActive.value = 0.0;
            b.mesh.visible = false;
            b.active = false;
            return;
        }
        var w = screenToWorld(screenX || 0, screenY || 0);
        var pw = Math.max(1, width || 200);
        var ph = Math.max(1, height || 120);
        // Rebuild geometry to requested size.
        if (b.mesh.geometry) b.mesh.geometry.dispose();
        b.mesh.geometry = new THREE.PlaneGeometry(pw, ph, 1, 1);
        b.mesh.position.set(w.x + pw / 2, w.y - ph / 2, 0);
        b.uniforms.uActive.value = 1.0;
        b.mesh.visible = true;
        b.active = true;
    }

    function clearAll() {
        if (!state.ready) return;
        for (var i = 0; i < state.firePool.length; i++) {
            var f = state.firePool[i];
            f.active = false;
            f.life = 0;
            f.mesh.visible = false;
            f.uniforms.uLife.value = 0.0;
        }
        for (var j = 0; j < state.steamPool.length; j++) {
            var s = state.steamPool[j];
            s.active = false;
            s.life = 0;
            s.mesh.visible = false;
            s.uniforms.uLife.value = 0.0;
        }
        if (state.boil) {
            state.boil.uniforms.uActive.value = 0.0;
            state.boil.mesh.visible = false;
            state.boil.active = false;
        }
    }

    function update(deltaTime) {
        if (!state.ready) return;
        var dt = (typeof deltaTime === 'number' && deltaTime > 0) ? deltaTime : 1 / 60;
        state.time += dt;

        // Refresh viewport if renderer size changed (handle resize).
        var size = new THREE.Vector2();
        state.renderer.getSize(size);
        if (size.x !== state.viewportW || size.y !== state.viewportH) {
            state.viewportW = size.x;
            state.viewportH = size.y;
            state.camera.left = -size.x / 2;
            state.camera.right = size.x / 2;
            state.camera.top = size.y / 2;
            state.camera.bottom = -size.y / 2;
            state.camera.updateProjectionMatrix();
        }

        // Tick fire
        for (var i = 0; i < state.firePool.length; i++) {
            var f = state.firePool[i];
            f.uniforms.uTime.value = state.time;
            if (f.active) {
                f.life -= dt;
                var fadeStart = 0.4; // last 40% fades out
                var lifeRatio = Math.max(0, f.life / f.maxLife);
                f.uniforms.uLife.value = (lifeRatio < fadeStart)
                    ? (lifeRatio / fadeStart)
                    : 1.0;
                if (f.life <= 0) {
                    f.active = false;
                    f.mesh.visible = false;
                    f.uniforms.uLife.value = 0.0;
                }
            }
        }

        // Tick steam
        for (var k = 0; k < state.steamPool.length; k++) {
            var s = state.steamPool[k];
            s.uniforms.uTime.value = state.time;
            if (s.active) {
                s.life -= dt;
                var fStart = 0.5;
                var lr = Math.max(0, s.life / s.maxLife);
                s.uniforms.uLife.value = (lr < fStart) ? (lr / fStart) : 1.0;
                if (s.life <= 0) {
                    s.active = false;
                    s.mesh.visible = false;
                    s.uniforms.uLife.value = 0.0;
                }
            }
        }

        // Tick boil (continuous time only)
        if (state.boil) {
            state.boil.uniforms.uTime.value = state.time;
        }
    }

    function disposeSlot(slot) {
        if (!slot) return;
        if (slot.mesh) {
            if (state.scene) state.scene.remove(slot.mesh);
            if (slot.mesh.geometry) slot.mesh.geometry.dispose();
        }
        if (slot.mat) slot.mat.dispose();
    }

    function dispose() {
        if (!state.ready) return;
        for (var i = 0; i < state.firePool.length; i++) disposeSlot(state.firePool[i]);
        for (var j = 0; j < state.steamPool.length; j++) disposeSlot(state.steamPool[j]);
        disposeSlot(state.boil);
        state.firePool.length = 0;
        state.steamPool.length = 0;
        state.boil = null;
        state.scene = null;
        state.renderer = null;
        state.camera = null;
        state.ready = false;
    }

    window.GameShaders = {
        init: init,
        triggerFire: triggerFire,
        triggerSteam: triggerSteam,
        triggerBoil: triggerBoil,
        clearAll: clearAll,
        update: update,
        dispose: dispose,
        // Exposed for host that wants to render with our ortho camera explicitly.
        getCamera: function () { return state.camera; }
    };
})();
