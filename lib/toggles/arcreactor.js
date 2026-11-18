// Arc Reactor toggle: Armour plates open and the core charges through amber to full power.
// One file, no dependencies. From https://zerowing.in/toggles/
//
// Use it:
//   <script type="module" src="arcreactor.js"></script>
//
//   <tg-arcreactor style="display:block; width:360px; height:220px"></tg-arcreactor>
//
//   <script type="module">
//     const t = document.querySelector("tg-arcreactor");
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

// ---- Arc Reactor ----
// Arc Reactor: armoured red-and-gold pill. Switching on deploys the plates in a stagger,
// the reactor knob spins up, its coils light one by one and the core ignites with a HUD sweep.
// Switching off powers it down with a flicker and the plates clunk shut.

// Snow Globe standard: bezel 330×160 at (15,30), window 300×130, knob Ø112 with a 9px gap.
const TX = 30, TY = 45, TW = 300, TH = 130, CY = TY + TH / 2;
const KR = 47;                     // knob design radius (internals are drawn at this size)
const KS = 56 / 47;                // …then scaled up to the standard Ø112 knob
const K0 = TX + TH / 2, K1 = TX + TW - TH / 2;
const N = 6;                       // plate columns
const COILS = 10;
const PAD = 60;                    // canvas overscan for glow / HUD
const PW = TW / N;

const ch = (from, to, el, delay, dur, fn) =>
  el <= delay ? from : lerp(from, to, fn(clamp((el - delay) / dur)));

function pill(c, x, y, w, h) {
  const r = h / 2;
  c.beginPath();
  c.moveTo(x + r, y);
  c.lineTo(x + w - r, y);
  c.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
  c.lineTo(x + r, y + h);
  c.arc(x + r, y + r, r, Math.PI / 2, Math.PI * 1.5);
  c.closePath();
}
function circle(c, r) { c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); }

// Seeded widths for the HUD "readout" dashes.
const DASH = Array.from({ length: 30 }, (_, i) => 2 + ((i * 7919) % 11) / 2.2);

const CYAN = [120, 232, 255], AMBER = [255, 168, 60], RED = [255, 58, 46];
const h1 = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const smooth = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };

// Three-act timeline: leave (p 0→.25), middle act (.25→.75, slow and linear), arrive (.75→1).
// Hermite joins keep the speed continuous; inv() lets a reversal resume from the current spot.
function profile(d1, dm, d3, endSlope = 0) {
  const T = d1 + dm + d3, vm = 0.5 / dm;
  const herm = (u, p0, p1, m0, m1) => {
    const u2 = u * u, u3 = u2 * u;
    return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * m1;
  };
  const at = (tau) => {
    tau = clamp(tau, 0, T);
    if (tau < d1) return herm(tau / d1, 0, 0.25, 0, vm * d1);
    if (tau < d1 + dm) return 0.25 + (tau - d1) * vm;
    return herm((tau - d1 - dm) / d3, 0.75, 1, vm * d3, endSlope * 0.25);
  };
  const inv = (p) => { let a = 0, b = T; for (let i = 0; i < 32; i++) { const m = (a + b) / 2; if (at(m) < p) a = m; else b = m; } return (a + b) / 2; };
  return { T, at, inv };
}
const PON = profile(360, 900, 380, 1);    // ≈1.64 s: glide in, CHARGE, slam
const POFF = profile(340, 820, 420, 0);   // ≈1.58 s: sputter, DRAIN, close

export default class ArcReactor extends ToggleBase {
  template() {
    return `<style>
      :host { background: radial-gradient(120% 95% at 50% 45%, #2b1c1e 0%, #130c0d 55%, #060405 100%); }
      canvas { position: absolute; left: ${-PAD}px; top: ${-PAD}px; pointer-events: none; }
      .hit { position: absolute; left: ${TX - 15}px; top: ${TY - 15}px; width: ${TW + 30}px; height: ${TH + 30}px; border-radius: 80px; }
    </style><canvas></canvas><div class="hit" data-hit></div>`;
  }

  setup() {
    this.cv = this.$('canvas');
    this.v = { knob: 0, plates: new Array(N).fill(0), coils: new Array(COILS).fill(0), core: 0, charge: 0, arcs: 0, ring: 0, flash: 0 };
    this.angle = 0; this.omega = 0;
    this.q = 0; this.tau = 0; this.run = false;
    this.col = [...RED];
    this.sparks = [];
    this.hudT0 = -1e9; this.shakeT0 = -1e9; this.shakeA = 0;
    this.on = false;
    this.onResize();
  }

  onResize() {
    if (!this.cv) return;
    this.ctx = this.sizeCanvas(this.cv, 360 + PAD * 2, 220 + PAD * 2);
    this.k = this.scale * this.dpr;
  }

  render(on, instant) {
    this.on = on;
    const prof = on ? PON : POFF;
    if (instant) {
      this.q = on ? 1 : 0; this.tau = prof.T; this.run = false;
      this.col = on ? [...CYAN] : [...RED];
      this.apply(performance.now(), 16);
      this.omega = on ? 2.6 : 0;
      return;
    }
    // Resume from wherever we are, on the other direction's timeline.
    this.tau = prof.inv(on ? this.q : 1 - this.q);
    this.run = true;
  }

  // Everything visible is derived from q (0 = off … 1 = on) plus the direction.
  apply(t, dt) {
    const v = this.v, q = this.q, on = this.on;
    const L = (a, b) => clamp((q - a) / (b - a));
    const leave = L(0, 0.25), mid = L(0.25, 0.75), arr = L(0.75, 1);
    const hz = (n) => h1(Math.floor(t / n) + n);

    // Knob: glides to the centre, holds there while charging, then slams across.
    v.knob = q < 0.25 ? 0.5 * ease.inOutCubic(leave)
      : q < 0.75 ? 0.5
      : 0.5 + 0.5 * (on ? arr * arr * (1.6 - 0.6 * arr) : ease.inOutCubic(arr));
    // Plates: crack half open (left first), then blast fully open. Closing runs right → left.
    for (let i = 0; i < N; i++) {
      const si = i / (N - 1);
      const lv = clamp(leave * 1.35 - si * 0.35), av = clamp(arr * 1.35 - si * 0.35);
      v.plates[i] = q < 0.25 ? 0.5 * ease.outCubic(lv)
        : q < 0.75 ? 0.5
        : 0.5 + 0.5 * (on ? ease.outBack(av, 2.2) : av);
    }
    v.charge = mid;
    for (let j = 0; j < COILS; j++) v.coils[j] = clamp(v.charge * COILS - j);

    // Unstable core while charging / sputtering while powering down.
    const unstable = 0.35 + 0.65 * (hz(45) > 0.3 ? 1 : 0.25) * (0.75 + 0.25 * Math.sin(t * 0.09));
    const sputter = hz(38) > 0.42 ? 0.55 + 0.45 * hz(23) : 0.08;
    if (on) v.core = q < 0.25 ? 0.12 * leave * unstable : q < 0.75 ? (0.22 + 0.6 * v.charge) * unstable : 1;
    else v.core = q > 0.75 ? (0.5 + 0.5 * arr) * sputter : q > 0.25 ? (0.15 + 0.55 * v.charge) * sputter : 0.15 * leave * sputter;

    // Arcs crackle only during the middle act.
    const env = smooth(0.2, 0.3, q) * (1 - smooth(0.74, 0.8, q));
    v.arcs = env * (on ? 0.4 + 0.6 * v.charge : 0.9 * v.charge * (hz(70) > 0.35 ? 1 : 0.12));
    v.ring = smooth(0.16, 0.28, q) * (1 - smooth(0.76, 0.88, q));

    // Colour: amber while charging, cyan once ignited, red on the way down.
    const target = on ? (q < 0.75 ? AMBER : CYAN) : RED;
    const k = Math.min(1, dt / 80);
    for (let c = 0; c < 3; c++) this.col[c] += (target[c] - this.col[c]) * k;
  }

  tick(t, dt) {
    const v = this.v;
    const prevQ = this.q;
    if (this.run) {
      const prof = this.on ? PON : POFF;
      this.tau += dt;
      const p = prof.at(this.tau);
      this.q = this.on ? p : 1 - p;
      if (this.tau >= prof.T) {
        this.run = false; this.q = this.on ? 1 : 0;
        this.shakeT0 = t; this.shakeA = this.on ? 1.6 : 2.6;   // slam / clunk
        if (!this.on) this.burst(K0, 10, RED);
      }
    }
    // Ignition: the instant the charge completes on the way up.
    if (this.on && prevQ < 0.75 && this.q >= 0.75) {
      this.col = [...CYAN];
      v.flash = 1; this.hudT0 = t;
      this.burst(lerp(K0, K1, 0.5), 34, [200, 250, 255]);
    }
    this.apply(t, dt);
    v.flash = Math.max(0, v.flash - dt / 280);

    // Sparks.
    if (v.arcs > 0.05 && Math.random() < v.arcs * dt * 0.025) this.burst(lerp(K0, K1, v.knob), 1, this.col);
    for (const sp of this.sparks) { sp.vy += 0.0009 * dt; sp.x += sp.vx * dt; sp.y += sp.vy * dt; sp.life -= dt; }
    this.sparks = this.sparks.filter((sp) => sp.life > 0);

    // Spin follows charge; a nervous wobble while unstable.
    const target = this.on ? (this.q < 0.75 ? v.charge * 1.5 : 2.6) : v.charge * 0.9;
    this.omega += (target - this.omega) * Math.min(1, dt / (this.on ? 300 : 600));
    this.angle += (this.omega * dt) / 1000 + Math.sin(t * 0.031) * 0.012 * v.arcs;

    let sx = 0, sy = 0;
    const se = t - this.shakeT0;
    if (se > 0 && se < 300) {
      const d = Math.exp(-se / 70);
      sx = Math.sin(se * 0.11) * 0.8 * this.shakeA * d;
      sy = Math.cos(se * 0.17) * 1.1 * this.shakeA * d;
    }
    if (this.ctx) this.draw(t, sx, sy);
  }

  burst(x, n, col) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 0.05 + Math.random() * 0.16;
      this.sparks.push({ x: x + Math.cos(a) * 54, y: CY + Math.sin(a) * 54, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.05,
        life: 260 + Math.random() * 380, max: 640, col: [...col] });
    }
  }

  rgba(a, w = 0) {
    const c = this.col;
    return `rgba(${Math.round(lerp(c[0], 255, w))},${Math.round(lerp(c[1], 255, w))},${Math.round(lerp(c[2], 255, w))},${a})`;
  }

  hud(t) {
    const steadyR = KR * KS + 24;
    if (!this.on) return { r: steadyR, a: 0.3 * this.v.core * (1 - this.v.ring) };
    if (this.q < 0.75) return { r: steadyR, a: 0 };
    const he = t - this.hudT0;
    if (he < 0) return { r: KR * KS, a: 0 };
    if (he > 900) return { r: steadyR, a: 0.3 };
    const p = he / 900;
    return { r: lerp(KR * KS - 4, steadyR, ease.outCubic(p)), a: p < 0.12 ? p / 0.12 : lerp(1, 0.3, (p - 0.12) / 0.88) };
  }

  draw(t, shx, shy) {
    const c = this.ctx, k = this.k, v = this.v;
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, this.cv.width, this.cv.height);
    c.setTransform(k, 0, 0, k, (PAD + shx) * k, (PAD + shy) * k);

    const open = v.plates.reduce((p, q) => p + clamp(q), 0) / N;
    const lit = v.coils.reduce((p, q) => p + q, 0) / COILS;
    const power = Math.max(v.core, lit * 0.55);
    const jit = v.arcs * (h1(Math.floor(t / 34)) - 0.5) * 2.4;
    const kx = lerp(K0, K1, v.knob) + jit;

    // Ambient cyan wash on the backdrop.
    if (power > 0.01) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      const g = c.createRadialGradient(kx, CY, 10, kx, CY, 200);
      g.addColorStop(0, this.rgba(0.2 * power, 0));
      g.addColorStop(0.5, this.rgba(0.07 * power, 0));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.fillRect(-PAD, -PAD, 360 + PAD * 2, 220 + PAD * 2);
      c.restore();
    }

    // Bezel: drop shadow, gunmetal ring, gold hairline, screws.
    c.save();
    c.shadowColor = 'rgba(0,0,0,.75)'; c.shadowBlur = 30; c.shadowOffsetY = 14;
    pill(c, TX - 15, TY - 15, TW + 30, TH + 30); c.fillStyle = '#111214'; c.fill();
    c.restore();
    let g = c.createLinearGradient(0, TY - 15, 0, TY + TH + 15);
    g.addColorStop(0, '#6c7078'); g.addColorStop(0.1, '#33363c'); g.addColorStop(0.5, '#17191c');
    g.addColorStop(0.9, '#2c2e33'); g.addColorStop(1, '#5d6168');
    pill(c, TX - 15, TY - 15, TW + 30, TH + 30); c.fillStyle = g; c.fill();
    pill(c, TX - 14.5, TY - 14.5, TW + 29, TH + 29); c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1; c.stroke();
    g = c.createLinearGradient(0, TY - 4, 0, TY + TH + 4);
    g.addColorStop(0, '#f7dd8f'); g.addColorStop(0.3, '#a8781f'); g.addColorStop(0.55, '#5e400f'); g.addColorStop(0.8, '#c99a3e'); g.addColorStop(1, '#f0cf7a');
    pill(c, TX - 3.5, TY - 3.5, TW + 7, TH + 7); c.strokeStyle = g; c.lineWidth = 2.2; c.stroke();
    for (const x of [TX + 80, TX + 150, TX + 220]) for (const y of [TY - 9.5, TY + TH + 9.5]) this.screw(c, x, y, 2.4);

    // Track interior.
    c.save();
    pill(c, TX, TY, TW, TH); c.clip();
    c.fillStyle = '#06080b'; c.fillRect(TX, TY, TW, TH);
    c.strokeStyle = 'rgba(110,160,180,.09)'; c.lineWidth = 0.6;
    for (let x = TX + 6; x < TX + TW; x += 10) { c.beginPath(); c.moveTo(x, TY); c.lineTo(x, TY + TH); c.stroke(); }
    for (const y of [CY - 22, CY + 22]) { c.beginPath(); c.moveTo(TX, y); c.lineTo(TX + TW, y); c.stroke(); }
    const e = open * power;
    if (e > 0.005) {
      c.save();
      c.globalCompositeOperation = 'lighter';
      g = c.createLinearGradient(0, CY - 52, 0, CY + 52);
      g.addColorStop(0, this.rgba(0, 0)); g.addColorStop(0.5, this.rgba(0.75 * e, 0.1)); g.addColorStop(1, this.rgba(0, 0));
      c.fillStyle = g; c.fillRect(TX, CY - 52, TW, 104);
      c.fillStyle = this.rgba(0.9 * e, 0.85); c.fillRect(TX, CY - 1, TW, 2);
      // Energy pulses running along the conduit.
      for (let n = 0; n < 7; n++) {
        const x = TX + ((t * 0.22 + n * 47) % (TW + 40)) - 20;
        const pg = c.createRadialGradient(x, CY, 0, x, CY, 14);
        pg.addColorStop(0, this.rgba(0.8 * e, 0.75)); pg.addColorStop(1, this.rgba(0, 0));
        c.fillStyle = pg; c.fillRect(x - 14, CY - 14, 28, 28);
      }
      c.restore();
    }
    // Armour plates.
    for (let i = 0; i < N; i++) {
      const o = v.plates[i];
      const x = TX + i * PW;
      const tilt = 0;
      // Rattle while the reactor strains.
      const rt = v.arcs * (h1(Math.floor(t / 40) * 7 + i) - 0.5) * 2.2;
      this.plate(c, x, TY - 2, PW, TH / 2 + 2, 'top', o, power, -o * 37 + rt, tilt);
      this.plate(c, x, CY, PW, TH / 2 + 2, 'bottom', o, power, o * 37 - rt, -tilt);
    }
    // Inner rim shadow.
    c.shadowColor = 'rgba(0,0,0,.85)'; c.shadowBlur = 12;
    pill(c, TX - 6, TY - 6, TW + 12, TH + 12); c.lineWidth = 12; c.strokeStyle = '#000'; c.stroke();
    // Snow Globe lip: top inner shade + faint bottom highlight.
    g = c.createLinearGradient(0, TY, 0, TY + 14);
    g.addColorStop(0, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(TX, TY, TW, 14);
    c.fillStyle = 'rgba(255,255,255,.08)'; c.fillRect(TX, TY + TH - 2, TW, 2);
    if (v.arcs > 0.02) this.drawArcs(c, kx, t, open);
    if (v.flash > 0.01) {
      c.save(); c.globalCompositeOperation = 'lighter';
      c.fillStyle = this.rgba(0.6 * v.flash * v.flash, 0.7); c.fillRect(TX, TY, TW, TH);
      c.restore();
    }
    c.restore();

    this.knob(c, kx, t, power);
    this.drawRing(c, kx, t);
    this.drawHud(c, kx, t);
    this.drawSparks(c);
  }

  // Lightning between the knob and the seams of the half-open plates.
  drawArcs(c, kx, t, open) {
    const v = this.v, seed = Math.floor(t / 55);
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineJoin = 'round'; c.lineCap = 'round';
    for (let b = 0; b < 5; b++) {
      if (h1(seed * 11 + b * 3.7) > 0.3 + 0.7 * v.arcs) continue;
      const top = b % 2 === 0;
      const r = h1(seed * 5 + b * 1.3), left = h1(seed * 2 + b * 9.1) < 0.5;
      const ex = left ? lerp(TX + 14, kx - 64, r) : lerp(kx + 64, TX + TW - 14, r);
      const ey = top ? CY - open * 37 + 1 : CY + open * 37 - 1;
      const ang = Math.atan2(ey - CY, ex - kx);
      const sx = kx + Math.cos(ang) * 50, sy = CY + Math.sin(ang) * 50;
      const pts = [[sx, sy]];
      const n = 7, dx = ex - sx, dy = ey - sy, len = Math.hypot(dx, dy) || 1;
      for (let i = 1; i < n; i++) {
        const f = i / n, off = (h1(seed * 31 + b * 17 + i * 3.3) - 0.5) * Math.min(18, len * 0.35);
        pts.push([sx + dx * f - (dy / len) * off, sy + dy * f + (dx / len) * off]);
      }
      pts.push([ex, ey]);
      const path = () => { c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); };
      const a = v.arcs;
      path(); c.strokeStyle = this.rgba(0.22 * a, 0); c.lineWidth = 5; c.stroke();
      path(); c.strokeStyle = this.rgba(0.75 * a, 0.25); c.lineWidth = 1.6; c.stroke();
      path(); c.strokeStyle = `rgba(255,255,255,${0.9 * a})`; c.lineWidth = 0.6; c.stroke();
      // Hot spot where it strikes the plate.
      const hg = c.createRadialGradient(ex, ey, 0, ex, ey, 9);
      hg.addColorStop(0, this.rgba(0.8 * a, 0.6)); hg.addColorStop(1, this.rgba(0, 0));
      c.fillStyle = hg; c.fillRect(ex - 9, ey - 9, 18, 18);
    }
    c.restore();
  }

  // Charge ring in the 9px gap around the knob, plus a tiny readout above the bezel.
  drawRing(c, kx, t) {
    const v = this.v, a = v.ring;
    if (a < 0.01) return;
    const R = 60.5, ch = v.charge;
    c.save(); c.translate(kx, CY);
    c.lineCap = 'round';
    c.beginPath(); c.arc(0, 0, R, 0, Math.PI * 2); c.strokeStyle = `rgba(0,0,0,${0.55 * a})`; c.lineWidth = 4; c.stroke();
    c.save(); c.globalCompositeOperation = 'lighter';
    if (ch > 0.002) {
      c.shadowColor = this.rgba(1, 0); c.shadowBlur = 8;
      c.beginPath(); c.arc(0, 0, R, -Math.PI / 2, -Math.PI / 2 + ch * Math.PI * 2);
      c.strokeStyle = this.rgba(0.95 * a, 0.25); c.lineWidth = 2.6; c.stroke();
      c.shadowBlur = 0;
      // Leading spark on the ring.
      const ea = -Math.PI / 2 + ch * Math.PI * 2;
      const lg = c.createRadialGradient(Math.cos(ea) * R, Math.sin(ea) * R, 0, Math.cos(ea) * R, Math.sin(ea) * R, 7);
      lg.addColorStop(0, `rgba(255,255,255,${a})`); lg.addColorStop(1, this.rgba(0, 0));
      c.fillStyle = lg; c.fillRect(Math.cos(ea) * R - 7, Math.sin(ea) * R - 7, 14, 14);
    }
    for (let i = 0; i < 40; i++) {
      const an = -Math.PI / 2 + (i / 40) * Math.PI * 2, lit = i / 40 < ch;
      const L = i % 5 === 0 ? 3.2 : 1.8;
      c.beginPath(); c.moveTo(Math.cos(an) * (R + 2.6), Math.sin(an) * (R + 2.6));
      c.lineTo(Math.cos(an) * (R + 2.6 + L), Math.sin(an) * (R + 2.6 + L));
      c.strokeStyle = lit ? this.rgba(0.9 * a, 0.3) : `rgba(255,255,255,${0.12 * a})`; c.lineWidth = 0.8; c.stroke();
    }
    c.restore();
    c.restore();
    // Readout.
    c.save();
    c.font = '700 8.5px ui-monospace, Menlo, monospace';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    if ('letterSpacing' in c) c.letterSpacing = '2px';
    const label = (this.on ? 'CHARGING ' : 'POWER DOWN ') + String(Math.round(ch * 100)).padStart(3, ' ') + '%';
    c.shadowColor = this.rgba(0.9, 0); c.shadowBlur = 6;
    c.fillStyle = this.rgba(a * (0.75 + 0.25 * Math.sin(t * 0.02)), 0.35);
    c.fillText(label, 180, TY - 27);
    c.restore();
  }

  drawSparks(c) {
    if (!this.sparks.length) return;
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    for (const sp of this.sparks) {
      const f = clamp(sp.life / 400), [r, g, b] = sp.col;
      c.strokeStyle = `rgba(${Math.round(lerp(r, 255, 0.5))},${Math.round(lerp(g, 255, 0.5))},${Math.round(lerp(b, 255, 0.5))},${f})`;
      c.lineWidth = 1.1;
      c.beginPath(); c.moveTo(sp.x, sp.y); c.lineTo(sp.x - sp.vx * 22, sp.y - sp.vy * 22); c.stroke();
    }
    c.restore();
  }

  screw(c, x, y, r) {
    const g = c.createRadialGradient(x - r * 0.4, y - r * 0.4, 0, x, y, r);
    g.addColorStop(0, '#d9dce0'); g.addColorStop(0.6, '#6d7177'); g.addColorStop(1, '#2a2c30');
    c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 0.6;
    c.beginPath(); c.moveTo(x - r * 0.6, y); c.lineTo(x + r * 0.6, y); c.stroke();
  }

  plate(c, x, y, w, h, side, o, power, dy, tilt) {
    c.save();
    const px = x + w / 2, py = side === 'top' ? y : y + h;
    c.translate(px, py + dy);
    c.rotate(tilt);
    c.translate(-px, -py);
    const x0 = x + 1, w0 = w - 2;
    // Red metal body.
    let g = c.createLinearGradient(0, y, 0, y + h);
    if (side === 'top') {
      g.addColorStop(0, '#d23034'); g.addColorStop(0.3, '#981519'); g.addColorStop(0.75, '#5c0b0e'); g.addColorStop(1, '#3b0709');
    } else {
      g.addColorStop(0, '#4a080b'); g.addColorStop(0.35, '#7d1115'); g.addColorStop(0.8, '#b01d21'); g.addColorStop(1, '#7a1013');
    }
    c.fillStyle = g; c.fillRect(x0, y, w0, h);
    // Diagonal sheen.
    g = c.createLinearGradient(x0, y, x0 + w0, y + h);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.45, 'rgba(255,220,210,.16)');
    g.addColorStop(0.55, 'rgba(255,220,210,.03)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(x0, y, w0, h);
    // Panel lines.
    c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 0.8;
    c.strokeRect(x0 + 5, y + (side === 'top' ? 8 : 6), w0 - 10, h - 14);
    c.strokeStyle = 'rgba(255,190,180,.12)';
    c.strokeRect(x0 + 5.8, y + (side === 'top' ? 8.8 : 6.8), w0 - 10, h - 14);
    // Gold trim on the inner (centre-facing) edge.
    const ey = side === 'top' ? y + h - 3.5 : y;
    g = c.createLinearGradient(0, ey, 0, ey + 3.5);
    g.addColorStop(0, '#f6d888'); g.addColorStop(0.5, '#b08024'); g.addColorStop(1, '#6e4c12');
    c.fillStyle = g; c.fillRect(x0, ey, w0, 3.5);
    // Rivets on the outer corners.
    const ry = side === 'top' ? y + 5 : y + h - 5;
    this.screw(c, x0 + 4, ry, 1.4); this.screw(c, x0 + w0 - 4, ry, 1.4);
    // Cyan light catching the inner edge once open.
    const rim = clamp(o) * power;
    if (rim > 0.01) {
      c.globalCompositeOperation = 'lighter';
      c.fillStyle = this.rgba(0.85 * rim, 0.3);
      c.fillRect(x0, side === 'top' ? y + h - 1.2 : y, w0, 1.2);
      g = c.createLinearGradient(0, side === 'top' ? y + h : y, 0, side === 'top' ? y + h - 16 : y + 16);
      g.addColorStop(0, this.rgba(0.35 * rim, 0)); g.addColorStop(1, this.rgba(0, 0));
      c.fillStyle = g; c.fillRect(x0, side === 'top' ? y + h - 16 : y, w0, 16);
    }
    c.restore();
  }

  knob(c, kx, t, power) {
    const v = this.v;
    c.save();
    c.translate(kx, CY);
    c.scale(KS, KS);
    // Shadow + gold housing.
    c.save(); c.shadowColor = 'rgba(0,0,0,.8)'; c.shadowBlur = 18; c.shadowOffsetY = 8;
    circle(c, KR); c.fillStyle = '#000'; c.fill(); c.restore();
    let g = c.createLinearGradient(-KR, -KR, KR, KR);
    g.addColorStop(0, '#fbe39a'); g.addColorStop(0.3, '#c18d31'); g.addColorStop(0.55, '#6a4912');
    g.addColorStop(0.8, '#d6a94f'); g.addColorStop(1, '#7c5718');
    circle(c, KR); c.fillStyle = g; c.fill();
    circle(c, KR - 0.6); c.strokeStyle = 'rgba(255,245,210,.45)'; c.lineWidth = 1; c.stroke();
    // Gunmetal inner ring with bolts.
    g = c.createLinearGradient(0, -KR, 0, KR);
    g.addColorStop(0, '#4b4f56'); g.addColorStop(0.5, '#1a1c20'); g.addColorStop(1, '#3a3d43');
    circle(c, KR - 6); c.fillStyle = g; c.fill();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      this.screw(c, Math.cos(a) * (KR - 3), Math.sin(a) * (KR - 3), 1.5);
    }
    // Dark glass well.
    g = c.createRadialGradient(0, 0, 4, 0, 0, KR - 9);
    g.addColorStop(0, '#111a1f'); g.addColorStop(1, '#040607');
    circle(c, KR - 9); c.fillStyle = g; c.fill();
    if (power > 0.01) {
      c.save(); c.globalCompositeOperation = 'lighter';
      g = c.createRadialGradient(0, 0, 6, 0, 0, KR - 9);
      g.addColorStop(0, this.rgba(0.35 * power, 0)); g.addColorStop(1, this.rgba(0.12 * power, 0));
      circle(c, KR - 9); c.fillStyle = g; c.fill(); c.restore();
    }
    // Coils.
    for (let j = 0; j < COILS; j++) {
      const a = (j / COILS) * Math.PI * 2 - Math.PI / 2;
      c.beginPath();
      c.arc(0, 0, 35, a - 0.25, a + 0.25);
      c.arc(0, 0, 24, a + 0.19, a - 0.19, true);
      c.closePath();
      g = c.createRadialGradient(0, 0, 24, 0, 0, 35);
      g.addColorStop(0, '#3a2414'); g.addColorStop(0.5, '#8a5a2c'); g.addColorStop(1, '#4b2e16');
      c.fillStyle = g; c.fill();
      c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 0.5;
      for (let w = -2; w <= 2; w++) {
        const b = a + w * 0.085;
        c.beginPath(); c.moveTo(Math.cos(b) * 25, Math.sin(b) * 25); c.lineTo(Math.cos(b) * 34, Math.sin(b) * 34); c.stroke();
      }
      const l = v.coils[j];
      if (l > 0.01) {
        c.save(); c.globalCompositeOperation = 'lighter';
        c.shadowColor = this.rgba(1, 0); c.shadowBlur = 10 * l;
        c.beginPath(); c.arc(0, 0, 35, a - 0.25, a + 0.25); c.arc(0, 0, 24, a + 0.19, a - 0.19, true); c.closePath();
        c.fillStyle = this.rgba(0.8 * l, 0.3); c.fill();
        c.restore();
      }
    }
    // Rotating segmented ring.
    c.save();
    c.rotate(this.angle);
    for (let s = 0; s < 3; s++) {
      const a0 = (s / 3) * Math.PI * 2 + 0.16, a1 = ((s + 1) / 3) * Math.PI * 2 - 0.16;
      c.beginPath(); c.arc(0, 0, 21.5, a0, a1); c.arc(0, 0, 16, a1, a0, true); c.closePath();
      g = c.createLinearGradient(-21, -21, 21, 21);
      g.addColorStop(0, '#e8c46d'); g.addColorStop(0.5, '#6d4c16'); g.addColorStop(1, '#b88a36');
      c.fillStyle = g; c.fill();
      if (power > 0.01) {
        c.save(); c.globalCompositeOperation = 'lighter';
        c.strokeStyle = this.rgba(0.7 * power, 0.3); c.lineWidth = 0.9; c.stroke(); c.restore();
      }
    }
    c.fillStyle = power > 0.1 ? this.rgba(0.4 + 0.5 * power, 0.4) : `rgba(120,120,120,${0.4 + 0.5 * power})`;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      c.fillRect(Math.cos(a) * 22.6 - 0.5, Math.sin(a) * 22.6 - 0.5, 1, 1);
    }
    c.restore();
    // Counter-rotating triangle.
    c.save();
    c.rotate(-this.angle * 0.5 - Math.PI / 2);
    c.beginPath();
    for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; c[i ? 'lineTo' : 'moveTo'](Math.cos(a) * 14, Math.sin(a) * 14); }
    c.closePath();
    c.lineWidth = 2; c.lineJoin = 'round';
    c.strokeStyle = power > 0.02 ? this.rgba(0.35 + 0.65 * power, 0.35) : '#3c4246';
    if (power > 0.02) { c.shadowColor = this.rgba(1, 0); c.shadowBlur = 8 * power; }
    c.stroke();
    c.restore();
    // Core.
    g = c.createRadialGradient(-2, -2, 0, 0, 0, 9);
    g.addColorStop(0, '#4a5258'); g.addColorStop(1, '#101315');
    circle(c, 9); c.fillStyle = g; c.fill();
    const cr = v.core;
    if (cr > 0.01) {
      c.save(); c.globalCompositeOperation = 'lighter';
      g = c.createRadialGradient(0, 0, 0, 0, 0, 9);
      g.addColorStop(0, `rgba(255,255,255,${cr})`); g.addColorStop(0.5, this.rgba(cr, 0.6)); g.addColorStop(1, this.rgba(0.8 * cr, 0));
      circle(c, 9); c.fillStyle = g; c.fill();
      g = c.createRadialGradient(0, 0, 4, 0, 0, 80);
      g.addColorStop(0, this.rgba(0.65 * cr, 0.6)); g.addColorStop(0.25, this.rgba(0.28 * cr, 0)); g.addColorStop(1, this.rgba(0, 0));
      c.fillStyle = g; c.fillRect(-80, -80, 160, 160);
      c.restore();
    }
    // Glass specular.
    c.save();
    circle(c, KR - 9); c.clip();
    g = c.createLinearGradient(-30, -34, 10, 4);
    g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.beginPath(); c.ellipse(-8, -14, 30, 18, -0.5, 0, Math.PI * 2); c.fillStyle = g; c.fill();
    c.beginPath(); c.ellipse(-20, -22, 5, 2, -0.7, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,.55)'; c.fill();
    c.restore();
    c.restore();
  }

  drawHud(c, kx, t) {
    const { r, a } = this.hud(t);
    if (a < 0.01) return;
    c.save();
    c.translate(kx, CY);
    c.globalCompositeOperation = 'lighter';
    const col = (al) => this.rgba(al, 0.3);
    c.lineWidth = 1.1; c.strokeStyle = col(a);
    const r0 = t * 0.0006;
    c.beginPath(); c.arc(0, 0, r, r0, r0 + 1.7); c.stroke();
    c.beginPath(); c.arc(0, 0, r, r0 + Math.PI, r0 + Math.PI + 1.0); c.stroke();
    c.setLineDash([1.5, 3.5]); c.strokeStyle = col(a * 0.8);
    c.beginPath(); c.arc(0, 0, r - 6, 0, Math.PI * 2); c.stroke();
    c.setLineDash([]);
    c.save(); c.rotate(-t * 0.0003);
    for (let i = 0; i < 48; i++) {
      const an = (i / 48) * Math.PI * 2, L = i % 4 === 0 ? 4 : 2;
      c.beginPath(); c.moveTo(Math.cos(an) * (r + 3), Math.sin(an) * (r + 3));
      c.lineTo(Math.cos(an) * (r + 3 + L), Math.sin(an) * (r + 3 + L)); c.strokeStyle = col(a * 0.7); c.stroke();
    }
    c.restore();
    // Readout dashes in three clusters.
    c.fillStyle = col(a);
    for (let k = 0; k < 3; k++) {
      const base = -t * 0.0004 + (k / 3) * Math.PI * 2 + 0.6;
      let an = base;
      for (let i = 0; i < 6; i++) {
        const w = DASH[k * 10 + i];
        c.save(); c.rotate(an);
        c.fillRect(r + 11, -0.6, w, 1.2);
        c.restore();
        an += 0.09;
      }
    }
    c.restore();
  }
}

customElements.define('tg-arcreactor', ArcReactor);
