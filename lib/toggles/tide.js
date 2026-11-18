// Tide toggle: A wave rolls through the track, the bubble surfs it and a fish leaps out.
// One file, no dependencies. From https://zerowing.in/toggles/
//
// Use it:
//   <script type="module" src="tide.js"></script>
//
//   <tg-tide style="display:block; width:360px; height:220px"></tg-tide>
//
//   <script type="module">
//     const t = document.querySelector("tg-tide");
//     t.addEventListener("change", (e) => console.log("on?", e.detail.checked));
//     // t.checked = true;  t.toggle();
//   </script>
//
// API: the `checked` attribute / .checked property, .toggle(), a "change" event ({detail: {checked}}).
// The switch scales to fit its box (designed at 360x220); fill="0.9" sets how much of the box it fills (default 0.82).
// The element paints its own scene background, so give it a rounded container if you want one.

// ---- shared base ----
// Shared base for every toggle in the library.
//
// Contract (every components/<id>.js follows it):
//   - `export default class extends ToggleBase` and `customElements.define('tg-<id>', …)` at the bottom.
//   - Override `template()` → HTML string for the shadow root (include its own <style>).
//     Everything is drawn inside a fixed design stage of W×H px (static W/H, default 360×220);
//     the base scales that stage to fit the host. The host itself is the full scene (paint
//     :host's background yourself if the style swaps day/night etc.).
//   - Override `render(on, instant)` → apply the on/off state. `instant` is true on first paint.
//   - Optional `tick(t, dt)` → called every animation frame while connected (t in ms, from
//     performance.now(), so a virtual clock can drive it). Return nothing.
//   - Any element with [data-hit] is the clickable switch; clicking it calls this.toggle().
//   - Time sources: only performance.now() / rAF / CSS transitions & animations. No setTimeout
//     chains for visible motion (capture seeks a virtual clock).
//
// Public API on every element: .checked (bool, reflects the `checked` attribute), .toggle(),
// 'change' event with detail {checked}. this.scale = current stage scale, this.dpr = devicePixelRatio.

class ToggleBase extends HTMLElement {
  static W = 360;
  static H = 220;
  static observedAttributes = ['checked'];

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    this.scale = 1;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this._raf = 0;
    this._last = 0;
  }

  template() { return ''; }
  render(_on, _instant) {}
  tick(_t, _dt) {}
  onResize() {}

  connectedCallback() {
    if (!this._built) {
      const { W, H } = this.constructor;
      this.root.innerHTML = `
        <style>
          :host { display: block; position: relative; overflow: hidden; contain: content; -webkit-tap-highlight-color: transparent; }
          .tg-stage { position: absolute; left: 50%; top: 50%; width: ${W}px; height: ${H}px;
            transform: translate(-50%, -50%) scale(var(--s, 1)); transform-origin: 50% 50%; }
          [data-hit] { cursor: pointer; }
        </style>
        <div class="tg-stage">${this.template()}</div>`;
      this.stage = this.root.querySelector('.tg-stage');
      this.root.addEventListener('click', (e) => {
        if (e.composedPath().some((n) => n instanceof Element && n.hasAttribute('data-hit'))) this.toggle();
      });
      this._built = true;
      this.setup?.();
      this.render(this.checked, true);
    }
    this._ro = new ResizeObserver(() => this._fit());
    this._ro.observe(this);
    this._fit();
    // it animates only while it is on screen (or about to be): off screen it would redraw every frame for nothing
    const loop = (t) => {
      this._raf = 0;
      if (!this._seen) return;
      const dt = this._last ? Math.min(t - this._last, 64) : 16;
      this._last = t;
      this.tick(t, dt);
      this._raf = requestAnimationFrame(loop);
    };
    this._io = new IntersectionObserver(([e]) => {
      this._seen = e.isIntersecting;
      if (this._seen && !this._raf) { this._last = 0; this._raf = requestAnimationFrame(loop); }
    }, { rootMargin: '120px' });
    this._io.observe(this);
  }

  disconnectedCallback() {
    cancelAnimationFrame(this._raf);
    this._raf = 0;
    this._io?.disconnect();
    this._ro?.disconnect();
    this._last = 0;
  }

  _fit() {
    const { W, H } = this.constructor;
    const r = this.getBoundingClientRect();
    if (!r.width || !r.height) return;
    // Toggle fills ~78% of the shorter fit so every tile has breathing room.
    this.scale = Math.min(r.width / W, r.height / H) * (parseFloat(this.getAttribute('fill')) || 0.82);
    this.style.setProperty('--s', this.scale);
    this.onResize();
  }

  get checked() { return this.hasAttribute('checked'); }
  set checked(v) { this.toggleAttribute('checked', !!v); }

  attributeChangedCallback(name, oldV, newV) {
    if (name === 'checked' && this._built && (oldV === null) !== (newV === null)) {
      this.render(this.checked, false);
      this.dispatchEvent(new CustomEvent('change', { detail: { checked: this.checked }, bubbles: true }));
    }
  }

  toggle() { this.checked = !this.checked; }

  $(sel) { return this.root.querySelector(sel); }
  $$(sel) { return [...this.root.querySelectorAll(sel)]; }

  // Size a <canvas> to cover `w×h` design px at full device resolution.
  sizeCanvas(cv, w, h) {
    const k = this.scale * this.dpr;
    cv.width = Math.max(1, Math.round(w * k));
    cv.height = Math.max(1, Math.round(h * k));
    cv.style.width = w + 'px';
    cv.style.height = h + 'px';
    const ctx = cv.getContext('2d');
    ctx.setTransform(k, 0, 0, k, 0, 0);
    return ctx;
  }
}

// Easing helpers shared by components.
const ease = {
  outCubic: (x) => 1 - Math.pow(1 - x, 3),
  inOutCubic: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  outBack: (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
  // Critically-damped-ish spring step: returns new [pos, vel].
  spring: (pos, vel, target, dt, k = 170, d = 18) => {
    const s = dt / 1000;
    const a = -k * (pos - target) - d * vel;
    vel += a * s;
    pos += vel * s;
    return [pos, vel];
  },
};

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;

// ---- Tide ----
// 09 · Tide — a glass pill half full of water. Switching raises THE BIG WAVE: the water surges,
// a curling crest rises mid-track and the bubble knob surfs it across while the fish leaps clean
// out (splash on re-entry); the wave breaks on the far wall and hands its energy to a 1D
// spring-mass heightfield that sloshes and settles. Teal day ↔ deep-ocean night with caustics.

const N = 64;                                  // water columns
// Standard geometry (matches Snow Globe): bezel 330×160 at (15,30), window 300×130 inset 15, knob Ø112.
const BZ = { x: 15, y: 30, w: 330, h: 160 };
const TR = { x: 30, y: 45, w: 300, h: 130 };   // window / track rect (design px)
const RAD = TR.h / 2;
// Knob travel through the three acts (p → 0…1 of the way): a small push back, a slow surf across
// the middle, a fast finish with a little overshoot. [p, value, slope]
const TRAVEL_KEYS = [[0, 0, 0], [0.16, -0.03, 0], [0.62, 0.8, 1.6], [0.82, 1.03, 0.25], [1, 1, 0]];
function herm(keys, p) {
  let i = 0;
  while (i < keys.length - 2 && p > keys[i + 1][0]) i++;
  const [p0, v0, m0] = keys[i], [p1, v1, m1] = keys[i + 1];
  const h = p1 - p0, x = clamp((p - p0) / h);
  const x2 = x * x, x3 = x2 * x;
  return (2 * x3 - 3 * x2 + 1) * v0 + (x3 - 2 * x2 + x) * h * m0 + (-2 * x3 + 3 * x2) * v1 + (x3 - x2) * h * m1;
}
const KR = 56;                                 // knob radius
const GAP = (TR.h - KR * 2) / 2;               // 9px
const XL = TR.x + GAP + KR, XR = TR.x + TR.w - GAP - KR; // knob rest centres
const KCY = TR.y + TR.h / 2;
const REST = TR.y + TR.h * 0.52;               // still-water line

const FISH = [
  '..####...',
  '.######.#',
  '#o#######',
  '.######.#',
  '..####...',
];

const C = {
  glassTop: [[236, 250, 248], [22, 52, 92]],
  glassBot: [[205, 236, 234], [8, 24, 46]],
  waterTop: [[96, 205, 194], [38, 112, 196]],
  waterBot: [[34, 150, 150], [8, 34, 92]],
  rim:      [[255, 255, 255], [150, 200, 255]],
  shadow:   [[40, 110, 110], [0, 6, 18]],
};
const mix = (pair, m, a = 1) => {
  const [p, q] = pair;
  return `rgba(${Math.round(lerp(p[0], q[0], m))},${Math.round(lerp(p[1], q[1], m))},${Math.round(lerp(p[2], q[2], m))},${a})`;
};

function pill(ctx, x, y, w, h) {
  const r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
  ctx.lineTo(x + r, y + h);
  ctx.arc(x + r, y + r, r, Math.PI / 2, Math.PI * 1.5);
  ctx.closePath();
}

class TideToggle extends ToggleBase {
  template() {
    const lip = 'inset 0 6px 9px rgba(0,0,0,.30), inset 0 -2px 3px rgba(255,255,255,.18), inset 0 0 0 1.5px rgba(0,0,0,.18)';
    return `
      <style>
        :host { background: #dff3f1; }
        .bg { position: absolute; inset: -2000px; transition: opacity .9s ease .35s; }
        .bg.off { background: radial-gradient(closest-side at 50% 50%, #f3fbfa 0, #d9f0ee 55%, #bfe3e1 100%); }
        .bg.on  { background: radial-gradient(closest-side at 50% 50%, #12385f 0, #082140 55%, #030d1c 100%); opacity: 0; }
        :host([checked]) .bg.on { opacity: 1; }
        .sg { position: absolute; left: ${BZ.x}px; top: ${BZ.y}px; width: ${BZ.w}px; height: ${BZ.h}px; border-radius: 80px; }
        .bezel { position: absolute; inset: 0; border-radius: 80px; transition: opacity .9s ease .35s; }
        .bezel.d { background: linear-gradient(180deg, #fbfefe, #e3f3f2 55%, #cfe7e6);
          box-shadow: 0 26px 44px -20px rgba(20,70,70,.45), 0 8px 16px -8px rgba(20,70,70,.3),
            inset 0 2px 1px rgba(255,255,255,.95), inset 0 -4px 8px rgba(0,60,60,.14); }
        .bezel.n { background: linear-gradient(180deg, #1d3a60, #10233f 55%, #0a1830); opacity: 0;
          box-shadow: 0 26px 44px -20px rgba(0,0,0,.7), 0 8px 16px -8px rgba(0,0,0,.5),
            inset 0 2px 1px rgba(150,200,255,.35), inset 0 -4px 8px rgba(0,0,0,.35); }
        :host([checked]) .bezel.n { opacity: 1; }
        canvas { position: absolute; left: 0; top: 0; }
        .lip { position: absolute; left: ${TR.x}px; top: ${TR.y}px; width: ${TR.w}px; height: ${TR.h}px; border-radius: 65px; pointer-events: none; box-shadow: ${lip}; }
        .hit { position: absolute; left: ${BZ.x}px; top: ${BZ.y}px; width: ${BZ.w}px; height: ${BZ.h}px; border-radius: 80px; }
      </style>
      <div class="bg off"></div><div class="bg on"></div>
      <div class="sg"><div class="bezel d"></div><div class="bezel n"></div></div>
      <canvas></canvas>
      <div class="lip"></div>
      <div class="hit" data-hit></div>`;
  }

  setup() {
    this.cv = this.$('canvas');
    this.h = new Float32Array(N);
    this.v = new Float32Array(N);
    this.kx = XL; this.kv = 0; this.ka = 0;
    this.m = 0;                      // theme mix 0 = day teal, 1 = night ocean
    this.fish = { x: TR.x + TR.w * 0.62, vx: -14, face: -1, flip: -1 };
    this.bubbles = [];
    this.drops = [];                 // spray: droplets + foam flecks (ballistic)
    this.ambient = 0;
    this.acc = 0;
    this.anim = null;                // scripted big-wave transition
    this.wv = { xc: 0, A: 0, dir: 1, curl: 0 };
    this.ghost = null;               // previous wave fading out after a mid-transition reversal
    this.lvl = 0;                    // whole-surface surge
    this.leap = null;
    this.ks = 1; this.ky = KCY; this.tilt = 0;
    this.now = 0;
  }

  onResize() { this.ctx = this.sizeCanvas(this.cv, ToggleBase.W, ToggleBase.H); }

  render(on, instant) {
    const to = on ? XR : XL;
    if (instant) { this.kx = to; this.m = on ? 1 : 0; this.anim = null; return; }
    if (this.anim) this.ghost = { ...this.wv, fade: 1 };
    const dir = on ? 1 : -1;
    const D = 2100 * Math.max(0.6, Math.abs(to - this.kx) / (XR - XL));
    this.anim = { from: this.kx, to, dir, t0: this.now, D, m0: this.m, m1: on ? 1 : 0, broke: false, leapt: false };
    // A handful of bubbles shake loose from the knob as it pushes off.
    for (let i = 0; i < 7; i++) {
      this.bubbles.push({ x: this.kx + (Math.random() - 0.5) * 40, y: REST + 20 + Math.random() * 18,
        r: 1.4 + Math.random() * 2.6, vy: -(26 + Math.random() * 36), ph: Math.random() * 6, life: 1 });
    }
  }

  colX(i) { return TR.x + 6 + (i / (N - 1)) * (TR.w - 12); }

  // Big-wave profile: steep curling front, long back slope, a trough dragged out behind it.
  waveAt(x, w) {
    if (!w || w.A < 0.01) return 0;
    const d = (x - w.xc) * w.dir;
    const q = (v) => v * v;
    const sh = d > 0 ? Math.exp(-q(d / 15)) : Math.exp(-q(d / 58)) - 0.2 * Math.exp(-q((d + 104) / 34));
    return w.A * sh * (w.fade ?? 1);
  }
  restAt(x) {
    const f = clamp((x - TR.x - 6) / (TR.w - 12), 0, 1) * (N - 1);
    const i = Math.min(N - 2, Math.floor(f));
    return REST + lerp(this.h[i], this.h[i + 1], f - i);
  }
  surfaceAt(x) { return this.restAt(x) + this.lvl - this.waveAt(x, this.wv) - this.waveAt(x, this.ghost); }

  step(s) {
    const { h, v } = this;
    // The water body lags the moving bubble a little; the scripted wave rides on top.
    const T = 2600, K = 4, D = 2.2, G = 0.012, V = 0.16;
    let mean = 0;
    for (let i = 0; i < N; i++) {
      const l = h[i > 0 ? i - 1 : 0], r = h[i < N - 1 ? i + 1 : N - 1];
      const xn = (i / (N - 1)) * 2 - 1;
      const a = T * (l + r - 2 * h[i]) - K * h[i] - D * v[i] - this.ka * xn * G + this.kv * xn * V;
      v[i] += a * s;
    }
    for (let i = 0; i < N; i++) { h[i] = clamp(h[i] + v[i] * s, -30, 30); mean += h[i]; }
    mean /= N;
    for (let i = 0; i < N; i++) h[i] -= mean; // volume stays constant
  }

  spray(x, y, n, dir, up, spread, foam = 0) {
    for (let i = 0; i < n; i++) {
      const isFoam = Math.random() < foam;
      this.drops.push({ x: x + (Math.random() - 0.5) * 10, y, vx: dir * (Math.random() * spread) + (Math.random() - 0.5) * 30,
        vy: -(up * (0.5 + Math.random() * 0.6)), r: isFoam ? 2.4 + Math.random() * 2.6 : 1 + Math.random() * 1.6,
        foam: isFoam, life: 1 });
    }
  }

  tick(t, dt) {
    this.now = t;
    if (!this.ctx) return;
    const s = dt / 1000;
    const pv = this.kv, px = this.kx;
    const a = this.anim;
    let bell = 0;
    if (a) {
      // Three acts: push off (0–.2) · THE BIG WAVE, the bubble surfs its crest (.2–.66) · break + settle.
      const p = clamp((t - a.t0) / a.D);
      const sm = (e0, e1) => { const x = clamp((p - e0) / (e1 - e0)); return x * x * (3 - 2 * x); };
      const u = herm(TRAVEL_KEYS, p);
      this.kx = lerp(a.from, a.to, u);
      const A = 54 * sm(0.08, 0.34) * (1 - sm(0.6, 0.8));
      const xc = clamp(this.kx + a.dir * 50, TR.x + 18, TR.x + TR.w - 18);
      this.wv = { xc, A, dir: a.dir, curl: sm(0.28, 0.46) * (1 - sm(0.6, 0.7)) };
      this.lvl = -7 * sm(0.06, 0.3) * (1 - sm(0.62, 0.95));
      this.m = lerp(a.m0, a.m1, sm(0.22, 0.7));
      bell = sm(0.14, 0.32) * (1 - sm(0.62, 0.84));
      if (!a.leapt && p >= 0.24) { a.leapt = true; this.startLeap(t, a.dir); }
      if (!a.broke && p >= 0.62) {
        // The wave slams into the far wall: spray, foam, and the energy hands over to the water sim.
        a.broke = true;
        const wall = a.dir > 0 ? TR.x + TR.w - 14 : TR.x + 14;
        this.spray(wall, REST - 36, 26, -a.dir, 190, 90, 0.35);
        for (let i = 0; i < N; i++) {
          const dist = Math.abs(this.colX(i) - wall);
          if (dist < 70) this.v[i] -= 240 * (1 - dist / 70);
        }
      }
      if (p >= 1) { this.anim = null; this.wv = { xc: 0, A: 0, dir: 1, curl: 0 }; }
      this.kv = (this.kx - px) / Math.max(s, 1e-3);
    } else {
      [this.kx, this.kv] = ease.spring(this.kx, this.kv, this.checked ? XR : XL, dt, 120, 15);
      this.m += ((this.checked ? 1 : 0) - this.m) * Math.min(1, dt / 260);
      this.lvl *= Math.max(0, 1 - dt / 200);
    }
    this.ka = (this.kv - pv) / Math.max(s, 1e-3);
    if (this.ghost) { this.ghost.fade -= dt / 380; if (this.ghost.fade <= 0) this.ghost = null; }

    // Fixed-step water.
    this.acc += s;
    let n = 0;
    while (this.acc > 1 / 240 && n++ < 24) { this.step(1 / 240); this.acc -= 1 / 240; }

    // Bubble knob: shrinks a little and rides up onto the crest during the middle act.
    this.ks = 1 - 0.2 * bell;
    const r = KR * this.ks;
    const yRest = KCY + clamp((this.restAt(this.kx) - REST) * 0.35, -3.5, 3.5);
    const ySurf = Math.max(this.surfaceAt(this.kx) - r * 0.35, TR.y + 3 + r);
    this.ky = Math.min(lerp(yRest, ySurf, bell), TR.y + TR.h - 3 - r);
    const slope = (this.surfaceAt(this.kx + 10) - this.surfaceAt(this.kx - 10)) / 20;
    this.tilt = slope + (a ? a.dir : 0) * 0.35 * bell;

    // Fish: cruises, turns at the walls, gets carried by the slosh — or leaps clean out.
    const f = this.fish;
    const lo = TR.x + 34, hi = TR.x + TR.w - 34;
    if (this.leap) {
      const L = this.leap, k = (t - L.t0) / L.dur;
      if (!L.out && k > 0.06) { L.out = true; this.spray(L.x0, this.surfaceAt(L.x0), 7, L.dir, 110, 40); }
      if (k >= 1) {
        this.spray(L.x1, this.surfaceAt(L.x1), 14, L.dir, 150, 50, 0.2);
        f.x = L.x1; f.vx = L.dir * 34; this.leap = null;
      }
    } else {
      const cruise = 16 * Math.sign(f.vx || 1);
      f.vx += (cruise - f.vx) * Math.min(1, dt / 900);
      f.x += f.vx * s;
      if (f.x < lo) { f.x = lo; f.vx = Math.abs(f.vx); }
      if (f.x > hi) { f.x = hi; f.vx = -Math.abs(f.vx); }
    }
    f.face = (this.leap ? this.leap.dir : f.vx) >= 0 ? 1 : -1;
    f.flip += (f.face - f.flip) * Math.min(1, dt / 90);

    // Bubbles.
    this.ambient += dt;
    if (this.ambient > 1300) {
      this.ambient = 0;
      this.bubbles.push({ x: TR.x + 50 + Math.random() * (TR.w - 100), y: TR.y + TR.h - 10, r: 1.2 + Math.random() * 1.6,
        vy: -(18 + Math.random() * 14), ph: Math.random() * 6, life: 1 });
    }
    for (const b of this.bubbles) {
      b.y += b.vy * s;
      b.x += Math.sin(t * 0.006 + b.ph) * 0.25;
      if (b.y < this.surfaceAt(b.x) + b.r) b.life -= dt / 120;
    }
    this.bubbles = this.bubbles.filter((b) => b.life > 0);

    // Spray: ballistic, dies back into the water.
    for (const d of this.drops) {
      d.vy += (d.foam ? 260 : 520) * s;
      d.x += d.vx * s; d.y += d.vy * s;
      d.life -= dt / (d.foam ? 900 : 1400);
      if (d.vy > 0 && d.y > this.surfaceAt(d.x)) d.life = 0;
    }
    this.drops = this.drops.filter((d) => d.life > 0 && d.x > TR.x - 10 && d.x < TR.x + TR.w + 10);

    this.draw(t);
  }

  startLeap(t, dir) {
    const lo = TR.x + 30, hi = TR.x + TR.w - 30;
    let x0 = clamp(this.fish.x, lo, hi);
    let x1 = clamp(x0 + dir * 108, lo, hi);
    if (Math.abs(x1 - x0) < 70) { x0 = clamp(x1 - dir * 108, lo, hi); }
    this.leap = { t0: t, dur: 760, x0, x1, dir, out: false };
  }

  drawFish(ctx, x, y, flip, rot = 0, px = 2.1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(-flip, 1); // sprite faces left; flip toward heading
    for (let r = 0; r < FISH.length; r++) {
      for (let c = 0; c < FISH[r].length; c++) {
        const ch = FISH[r][c];
        if (ch === '.') continue;
        ctx.fillStyle = ch === 'o' ? '#1a1410' : (r < 2 ? '#ffb15c' : '#ff7a2f');
        ctx.fillRect((c - 4.5) * px, (r - 2.5) * px, px + 0.05, px + 0.05);
      }
    }
    ctx.restore();
  }

  draw(t) {
    const ctx = this.ctx, m = this.m;
    const k = this.scale * this.dpr;
    ctx.clearRect(0, 0, ToggleBase.W, ToggleBase.H);

    ctx.save();
    pill(ctx, TR.x, TR.y, TR.w, TR.h);
    ctx.clip();
    let g = ctx.createLinearGradient(0, TR.y, 0, TR.y + TR.h);
    g.addColorStop(0, mix(C.glassTop, m)); g.addColorStop(1, mix(C.glassBot, m));
    ctx.fillStyle = g; ctx.fillRect(TR.x, TR.y, TR.w, TR.h);

    // Water body.
    const pts = [];
    for (let i = 0; i < N; i++) {
      const x = this.colX(i);
      pts.push([x, this.surfaceAt(x) + Math.sin(t * 0.0026 + i * 0.47) * 0.9 + Math.sin(t * 0.0017 - i * 0.21) * 0.6]);
    }
    const water = new Path2D();
    water.moveTo(TR.x - 2, TR.y + TR.h + 2);
    water.lineTo(TR.x - 2, pts[0][1]);
    for (let i = 0; i < N - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      water.quadraticCurveTo(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
    }
    water.lineTo(TR.x + TR.w + 2, pts[N - 1][1]);
    water.lineTo(TR.x + TR.w + 2, TR.y + TR.h + 2);
    water.closePath();
    g = ctx.createLinearGradient(0, REST - 26, 0, TR.y + TR.h);
    g.addColorStop(0, mix(C.waterTop, m, 0.92)); g.addColorStop(1, mix(C.waterBot, m, 0.98));
    ctx.fillStyle = g; ctx.fill(water);

    ctx.save();
    ctx.clip(water);
    // Caustics: wandering light threads on the floor, strongest at night.
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = 1.4;
    for (let j = 0; j < 5; j++) {
      ctx.beginPath();
      for (let x = TR.x; x <= TR.x + TR.w; x += 5) {
        const y = TR.y + TR.h - 7 - j * 4 + Math.sin(x * 0.09 + t * 0.0019 * (1 + j * 0.17) + j * 1.7) * 3 + Math.sin(x * 0.037 - t * 0.0013 + j * 2.3) * 2.5;
        x === TR.x ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = `rgba(150,220,255,${(0.02 + m * 0.2) * (1 - j / 6)})`;
      ctx.stroke();
    }
    // Light shafts from the surface.
    for (let j = 0; j < 4; j++) {
      const sx = TR.x + 40 + j * 70 + Math.sin(t * 0.0007 + j * 2) * 16;
      const sg = ctx.createLinearGradient(0, REST, 0, TR.y + TR.h);
      sg.addColorStop(0, `rgba(190,235,255,${0.06 + m * 0.07})`); sg.addColorStop(1, 'rgba(190,235,255,0)');
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.moveTo(sx, REST - 10); ctx.lineTo(sx + 14, REST - 10); ctx.lineTo(sx + 34, TR.y + TR.h); ctx.lineTo(sx + 4, TR.y + TR.h); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';

    // Fish (pixel sprite, crisp) — underwater unless it's mid-leap.
    if (!this.leap) this.drawFish(ctx, this.fish.x, this.restAt(this.fish.x) + this.lvl + 19 + Math.sin(t * 0.004) * 1.2, this.fish.flip);

    // Bubbles.
    for (const b of this.bubbles) {
      ctx.globalAlpha = clamp(b.life);
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,255,255,.75)'; ctx.lineWidth = 0.8; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore(); // water clip

    // Surface line: bright meniscus.
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < N - 1; i++) ctx.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
    ctx.strokeStyle = `rgba(235,255,255,${0.75 - m * 0.25})`;
    ctx.lineWidth = 1.6; ctx.stroke();

    // THE BIG WAVE: foam riding the crest + a curling lip thrown ahead of it.
    const W = this.wv;
    if (W.A > 4) {
      const fa = clamp(W.A / 54);
      ctx.save();
      pill(ctx, TR.x, TR.y, TR.w, TR.h); ctx.clip();
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (let k = 0; k <= 26; k++) {
        const x = W.xc - W.dir * 46 + W.dir * k * 2.2;
        const y = this.surfaceAt(x) + 1;
        k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.strokeStyle = `rgba(255,255,255,${0.85 * fa})`; ctx.lineWidth = 4; ctx.stroke();
      // foam flecks on the back slope
      for (let k = 0; k < 14; k++) {
        const x = W.xc - W.dir * (6 + ((k * 37) % 60));
        const y = this.surfaceAt(x) + 3 + ((k * 13) % 9) + Math.sin(t * 0.01 + k) * 1.2;
        ctx.fillStyle = `rgba(255,255,255,${0.55 * fa})`;
        ctx.beginPath(); ctx.arc(x, y, 1 + (k % 3) * 0.6, 0, Math.PI * 2); ctx.fill();
      }
      const c = W.curl;
      if (c > 0.04) {
        const xc = W.xc, yc = this.surfaceAt(xc), d = W.dir;
        const lip = new Path2D();
        lip.moveTo(xc - d * 8, yc + 3);
        lip.quadraticCurveTo(xc + d * 14, yc - 15 * c, xc + d * 28 * c, yc - 6 * c);
        lip.quadraticCurveTo(xc + d * 40 * c, yc + 2, xc + d * 33 * c, yc + 20 * c);
        lip.quadraticCurveTo(xc + d * 20 * c, yc + 10 * c, xc + d * 10, yc + 18);
        lip.closePath();
        // the barrel's shadow under the lip
        ctx.fillStyle = `rgba(0,30,60,${0.22 * c})`;
        ctx.beginPath(); ctx.ellipse(xc + d * 18 * c, yc + 18 * c, 14 * c, 8 * c, 0, 0, Math.PI * 2); ctx.fill();
        const lg = ctx.createLinearGradient(0, yc - 16, 0, yc + 22);
        lg.addColorStop(0, mix(C.waterTop, m, 0.98)); lg.addColorStop(1, mix(C.waterBot, m, 0.98));
        ctx.fillStyle = lg; ctx.fill(lip);
        ctx.beginPath();
        ctx.moveTo(xc - d * 8, yc + 1);
        ctx.quadraticCurveTo(xc + d * 14, yc - 15 * c, xc + d * 28 * c, yc - 6 * c);
        ctx.quadraticCurveTo(xc + d * 40 * c, yc + 2, xc + d * 33 * c, yc + 20 * c);
        ctx.strokeStyle = `rgba(255,255,255,${0.9 * c})`; ctx.lineWidth = 3.2; ctx.stroke();
      }
      ctx.restore();
    }

    // Leaping fish + spray, above the water.
    ctx.save();
    pill(ctx, TR.x, TR.y, TR.w, TR.h); ctx.clip();
    if (this.leap) {
      const L = this.leap, k = clamp((t - L.t0) / L.dur);
      const x = lerp(L.x0, L.x1, k);
      const y0 = lerp(this.surfaceAt(L.x0), this.surfaceAt(L.x1), k) + 14;
      const y = y0 - 78 * 4 * k * (1 - k);
      const vy = -78 * 4 * (1 - 2 * k), vx = (L.x1 - L.x0);
      const rot = Math.atan2(vy, Math.abs(vx)) * (L.dir > 0 ? 1 : -1);
      this.drawFish(ctx, x, y, this.fish.flip, rot, 2.5);
    }
    for (const d of this.drops) {
      ctx.globalAlpha = clamp(d.life * 1.4);
      ctx.fillStyle = d.foam ? 'rgba(255,255,255,.9)' : `rgba(${m > 0.5 ? '200,230,255' : '235,255,255'},.95)`;
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();

    // Knob: a floating glass bubble that bobs on the surface and refracts what's behind it.
    const kx = this.kx, ky = this.ky, tilt = this.tilt, KR = 56 * this.ks;
    ctx.save();
    ctx.beginPath(); ctx.arc(kx, ky, KR, 0, Math.PI * 2); ctx.clip();
    const mag = 0.72, sr = KR * mag;
    ctx.drawImage(this.cv, (kx - sr) * k, (ky - sr) * k, sr * 2 * k, sr * 2 * k, kx - KR, ky - KR, KR * 2, KR * 2);
    let rg = ctx.createRadialGradient(kx, ky, KR * 0.2, kx, ky, KR);
    rg.addColorStop(0, 'rgba(255,255,255,0.04)');
    rg.addColorStop(0.72, 'rgba(255,255,255,0.10)');
    rg.addColorStop(1, `rgba(${m > 0.5 ? '170,215,255' : '255,255,255'},0.55)`);
    ctx.fillStyle = rg; ctx.fillRect(kx - KR, ky - KR, KR * 2, KR * 2);
    // Iridescent film near the rim.
    ctx.lineWidth = 3;
    const ig = ctx.createLinearGradient(kx - KR, ky - KR, kx + KR, ky + KR);
    ig.addColorStop(0, 'rgba(255,170,220,.35)'); ig.addColorStop(0.5, 'rgba(160,255,230,.30)'); ig.addColorStop(1, 'rgba(150,170,255,.35)');
    ctx.strokeStyle = ig; ctx.beginPath(); ctx.arc(kx, ky, KR - 2.5, 0, Math.PI * 2); ctx.stroke();
    // Specular highlights.
    ctx.translate(kx, ky); ctx.rotate(tilt * 0.6);
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    ctx.beginPath(); ctx.ellipse(-KR * 0.38, -KR * 0.48, KR * 0.30, KR * 0.13, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.6)';
    ctx.beginPath(); ctx.arc(-KR * 0.02, -KR * 0.68, KR * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.45)'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.arc(0, 0, KR * 0.8, Math.PI * 0.15, Math.PI * 0.55); ctx.stroke();
    ctx.restore();
    ctx.beginPath(); ctx.arc(kx, ky, KR, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${0.7 - m * 0.2})`; ctx.lineWidth = 1.2; ctx.stroke();

    // Glass: top reflection strip + inner rim.
    ctx.save();
    pill(ctx, TR.x, TR.y, TR.w, TR.h); ctx.clip();
    g = ctx.createLinearGradient(0, TR.y, 0, TR.y + 34);
    g.addColorStop(0, `rgba(255,255,255,${0.5 - m * 0.3})`); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    pill(ctx, TR.x + 16, TR.y + 6, TR.w - 32, 26); ctx.fill();
    ctx.lineWidth = 8; ctx.strokeStyle = `rgba(0,30,40,${0.06 + m * 0.18})`;
    pill(ctx, TR.x, TR.y, TR.w, TR.h); ctx.stroke();
    ctx.restore();
    pill(ctx, TR.x + 0.5, TR.y + 0.5, TR.w - 1, TR.h - 1);
    ctx.strokeStyle = mix(C.rim, m, 0.75); ctx.lineWidth = 1.2; ctx.stroke();
  }
}

customElements.define('tg-tide', TideToggle);
export default TideToggle;
