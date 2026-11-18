// "Üç mercek" on the psychology page: pick an everyday moment and a school (BDT, psychodynamic, ACT), answer three
// questions, and watch that school's own structure being built in 3D beside the story. The text lives in
// window.MERCEK (lib/mercek-tr.js); this file draws and runs it. A small hand-made 3D view: points, lines and rings
// on a canvas, with the words as HTML laid over it so they stay sharp. It only runs while it is on screen.
(() => {
const R = document.getElementById('mrc'); if (!R || !window.MERCEK) return;
const M = window.MERCEK, U = M.ui, L = M.lenses, LENSES = ['bdt', 'psd', 'act'];
const RM = window.reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches;
const D = RM ? 0 : 1;                                       // reduced motion: every change happens at once
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const val = (v, ...a) => (typeof v === 'function' ? v(...a) : v);
const pad = n => String(n).padStart(2, '0');

R.innerHTML = `<div class="mrc-stage"><canvas aria-hidden="true"></canvas><div class="mrc-labels" aria-hidden="true"></div>
  <span class="mrc-tag mono"></span><span class="mrc-hint mono">${U.drag}</span></div>
  <div class="mrc-panel"><div class="mrc-head"></div><div class="mrc-body" aria-live="polite"></div></div>`;
const stage = R.querySelector('.mrc-stage'), cv = stage.querySelector('canvas'), g = cv.getContext('2d');
const layer = stage.querySelector('.mrc-labels'), tagEl = stage.querySelector('.mrc-tag');
const head = R.querySelector('.mrc-head'), body = R.querySelector('.mrc-body');

/* ---------------- the 3D view ---------------- */
const FOAM = [230, 241, 239], DAWN = [243, 195, 163], STONE = [24, 66, 74];
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
const rgba = (c, a) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${Math.max(0, Math.min(1, a))})`;
const V = { nodes: new Map(), edges: new Map(), discs: new Map(), W: 1, H: 1, dpr: 1, F: 1, t: 0,
  yaw: .55, pitch: .3, tPitch: .3, uy: 0, up: 0 };

const label = () => { const e = document.createElement('div'); e.className = 'mrc-l'; layer.appendChild(e); return e; };
// bring the view to a new description: what is new grows in, what changed eases over, what is gone fades out
function sync(desc) {
  V.tPitch = desc.pitch; tagEl.textContent = desc.tag || '';
  const kinds = [['nodes', desc.nodes], ['edges', desc.edges], ['discs', desc.discs]];
  let order = 0;
  for (const [kind, list] of kinds) {
    const map = V[kind], seen = new Set();
    for (const d of list) {
      seen.add(d.id); let o = map.get(d.id);
      if (!o) {
        o = { id: d.id, k: 0, lit: d.lit || 0, a: d.a ?? 1 };
        if (d.p) [o.x, o.y, o.z] = d.p;
        if (kind !== 'edges') o.el = label();
        map.set(d.id, o);
        gsap.to(o, { k: 1, duration: .9 * D, delay: (order++) * .08 * D, ease: 'expo.out' });
      } else if (o.dying) { o.dying = false; gsap.killTweensOf(o, 'k'); gsap.to(o, { k: 1, duration: .4 * D }); }
      const to = { lit: d.lit || 0, a: d.a ?? 1, duration: .9 * D, ease: 'expo.inOut' };
      if (d.p) [to.x, to.y, to.z] = d.p;
      if (d.r != null) to.r = d.r; if (d.y != null) to.dy = d.y;
      if (o.r == null && d.r != null) o.r = d.r; if (o.dy == null && d.y != null) o.dy = d.y;
      gsap.to(o, to);
      Object.assign(o, { a0: d.a, ghost: !!d.ghost, stone: !!d.stone, side: d.side || 1, from: d.from, to: d.to, flow: !!d.flow, dash: !!d.dash, rad: d.rad });
      if (o.el) {
        const html = `${d.cat ? `<b>${esc(d.cat)}</b>` : ''}${d.text ? `<span>${esc(d.text)}</span>` : ''}${d.sub ? `<i>${esc(d.sub)}</i>` : ''}`;
        if (o.html !== html) { o.html = html; o.el.innerHTML = html; o.el._w = 0; }
        o.el.classList.toggle('ghost', !!d.ghost); o.el.classList.toggle('lit', !!d.lit);
        o.el.classList.toggle('disc', kind === 'discs');
      }
    }
    for (const [id, o] of map) if (!seen.has(id) && !o.dying) {
      o.dying = true;
      gsap.to(o, { k: 0, duration: .45 * D, onComplete: () => { if (!o.dying) return; if (o.el) o.el.remove(); map.delete(id); } });
    }
  }
}

function project(x, y, z) {
  const cy = Math.cos(V.yaw), sy = Math.sin(V.yaw), cp = Math.cos(V.pitch), sp = Math.sin(V.pitch);
  const X = x * cy + z * sy, Z0 = -x * sy + z * cy, Y = y * cp - Z0 * sp, Z = y * sp + Z0 * cp;
  const s = V.F / (5.2 - Z);
  return [V.W / 2 + X * s, V.H * .5 - Y * s, Z, s];
}
// the words sit beside their point; near an edge of the stage they move to the other side so they stay readable
const place = (el, x, y, z, rad, alpha, side) => {
  const w = el._w || (el._w = el.offsetWidth), gap = rad + 10;
  let s = side;
  if (s > 0 && x + gap + w > V.W - 8) s = -1; else if (s < 0 && x - gap - w < 8) s = 1;
  if (el._s !== s) { el._s = s; el.classList.toggle('left', s < 0); }
  const left = Math.max(6, Math.min(V.W - w - 6, s > 0 ? x + gap : x - gap - w));
  el.style.transform = `translate(${left.toFixed(1)}px,${y.toFixed(1)}px)`;
  el.style.opacity = alpha.toFixed(3); el.style.zIndex = 100 + Math.round(z * 40);
};

function draw() {
  const { W, H, dpr } = V; g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
  // the rings (psychodynamic layers), back to front
  for (const d of V.discs.values()) {
    const a = d.k * (d.a ?? 1), N = 56, pts = [];
    for (let i = 0; i < N; i++) { const t = i / N * Math.PI * 2; pts.push(project(Math.cos(t) * d.r, d.dy, Math.sin(t) * d.r)); }
    g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
    const c = mix(FOAM, DAWN, d.lit * .6);
    g.fillStyle = rgba(c, (.025 + .03 * d.lit) * a); g.fill();
    g.strokeStyle = rgba(c, (.14 + .2 * d.lit) * a); g.lineWidth = 1; g.stroke();
    // a few slow ripples on each ring, like water seen from the side
    if (!RM) for (let j = 1; j <= 2; j++) { const rr = d.r * ((V.t * .08 + j / 2) % 1);
      g.beginPath(); for (let i = 0; i <= N; i++) { const t = i / N * Math.PI * 2, p = project(Math.cos(t) * rr, d.dy, Math.sin(t) * rr); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }
      g.strokeStyle = rgba(c, .06 * a * (1 - rr / d.r)); g.stroke(); }
    const p = project(d.r * Math.cos(-.5), d.dy, d.r * Math.sin(-.5));
    place(d.el, p[0], p[1], p[2], 0, a * (d.ghost ? .5 : 1), 1);
  }
  // the lines between points; some carry a slow signal
  for (const e of V.edges.values()) {
    const A = V.nodes.get(e.from), B = V.nodes.get(e.to); if (!A || !B) continue;
    const p = project(A.x, A.y, A.z), q = project(B.x, B.y, B.z), k = e.k * Math.min(A.k, B.k);
    const a = k * (e.a ?? 1) * Math.min(A.ghost ? .45 : 1, B.ghost ? .45 : 1);
    const ex = p[0] + (q[0] - p[0]) * e.k, ey = p[1] + (q[1] - p[1]) * e.k, c = mix(FOAM, DAWN, e.lit);
    g.setLineDash(e.dash ? [4, 5] : []); g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(ex, ey);
    g.strokeStyle = rgba(c, (.22 + .45 * e.lit) * a); g.lineWidth = 1 + e.lit * .8; g.stroke(); g.setLineDash([]);
    if (e.flow && !RM) for (let i = 0; i < 3; i++) {
      const t = (V.t * .45 + i / 3) % 1, x = p[0] + (q[0] - p[0]) * t, y = p[1] + (q[1] - p[1]) * t;
      g.beginPath(); g.arc(x, y, 1.8 + e.lit, 0, Math.PI * 2); g.fillStyle = rgba(c, .9 * a * Math.sin(Math.PI * t)); g.fill();
    }
  }
  // the points, far ones first, each with its words beside it
  const list = [...V.nodes.values()].map(n => ({ n, p: project(n.x, n.y, n.z) })).sort((a, b) => a.p[2] - b.p[2]);
  for (const { n, p } of list) {
    const depth = Math.max(.55, Math.min(1, .78 + p[2] * .18)), a = n.k * (n.a ?? 1) * (n.ghost ? .45 : 1) * depth;
    const rad = Math.max(2, n.r * p[3] * (.4 + .6 * n.k)), c = mix(FOAM, DAWN, n.lit);
    const gl = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], rad * 3.2);
    gl.addColorStop(0, rgba(c, .35 * a)); gl.addColorStop(1, rgba(c, 0));
    g.fillStyle = gl; g.beginPath(); g.arc(p[0], p[1], rad * 3.2, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(p[0], p[1], rad, 0, Math.PI * 2);
    if (n.stone) { g.fillStyle = rgba(mix(STONE, DAWN, n.lit * .25), a); g.fill(); g.strokeStyle = rgba(DAWN, .7 * a); g.lineWidth = 1.5; g.stroke(); }
    else if (n.ghost) { g.strokeStyle = rgba(c, .7 * a); g.lineWidth = 1; g.stroke(); }
    else { g.fillStyle = rgba(c, a); g.fill(); }
    place(n.el, p[0], p[1], p[2], rad, n.k * (n.a ?? 1) * (n.ghost ? .55 : 1) * (.55 + .45 * depth), n.side);
  }
}

// a slow sway, a drag turns it; it runs only while the stage is on screen
let raf = 0, seen = false, last = 0, drag = null;
function frame(now) {
  raf = 0; if (!seen) return;
  const dt = Math.min(.05, (now - (last || now)) / 1000); last = now; V.t += dt;
  V.yaw = .55 + (RM ? 0 : Math.sin(V.t * .23) * .45) + V.uy;
  V.pitch += (V.tPitch + V.up - V.pitch) * (RM ? 1 : .06);
  draw(); raf = requestAnimationFrame(frame);
}
const run = () => { if (!raf && seen) { last = 0; raf = requestAnimationFrame(frame); } };
new IntersectionObserver(([e]) => { seen = e.isIntersecting; run(); }, { rootMargin: '80px' }).observe(stage);
function size() {
  const r = stage.getBoundingClientRect(); V.dpr = Math.min(devicePixelRatio || 1, 2); V.W = r.width; V.H = r.height;
  cv.width = Math.round(V.W * V.dpr); cv.height = Math.round(V.H * V.dpr);
  // narrow stages (phones) leave room for the words beside the points
  V.F = V.W < 600 ? Math.min(V.W * 1.45, V.H * 1.3) : Math.min(V.W * 1.3, V.H * 1.55);
  layer.querySelectorAll('.mrc-l').forEach(e => { e._w = 0; });
  if (!raf) draw();
}
new ResizeObserver(size).observe(stage);
stage.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, id: e.pointerId, uy: V.uy, up: V.up, touch: e.pointerType === 'touch' }; stage.classList.add('drag'); });
addEventListener('pointermove', e => { if (!drag || e.pointerId !== drag.id) return;
  V.uy = drag.uy + (e.clientX - drag.x) * .008; if (!drag.touch) V.up = Math.max(-.35, Math.min(.5, drag.up + (e.clientY - drag.y) * .005)); });
const stop = () => { drag = null; stage.classList.remove('drag'); };
addEventListener('pointerup', stop); addEventListener('pointercancel', stop);

/* ---------------- the three structures ---------------- */
const st = { mode: 'setup', m: 0, lens: 'bdt', picks: [] };
const momentOf = () => M.moments[st.m];
const ghost = () => st.mode === 'setup';

// BDT: the situation above, thought → feeling → behaviour turning in a loop below; a weighed thought breaks in
function sceneBDT() {
  const P = L.bdt.parts, m = momentOf(), X = M.bdt.m[m.id], pk = st.picks;
  const t = pk[0] != null ? X[0][pk[0]] : null, b = pk[1] != null ? X[1][pk[1]] : null, w = pk[2] != null ? X[2][pk[2]] : null;
  const y = t ? (w ? w[3] : t[4]) : 0;
  const nodes = [
    { id: 'durum', p: [0, 1.15, 0], r: .12, cat: P.durum, text: ghost() ? '' : m.t, ghost: ghost() },
    { id: 'dus', p: [-1.1, -.3, .55], r: .11, cat: P.dus, text: t ? `“${t[0]}”` : '', sub: t ? t[2] : '', ghost: !t, side: -1, a: w ? .4 : 1 },
    { id: 'duy', p: [1.1, -.3, .55], r: t ? .07 + y / 100 * .15 : .09, cat: P.duy, text: t ? `${t[3]} %${y}` : '', ghost: !t, lit: t && !w ? .5 : 0 },
    { id: 'dav', p: [0, -.3, -1.15], r: .1, cat: P.dav, text: b ? b[2] : '', ghost: !b }
  ];
  const loop = !!b && !w;
  const edges = [
    { id: 'b1', from: 'durum', to: 'dus', flow: !!t && !w, a: w ? .35 : 1 },
    { id: 'b2', from: 'dus', to: 'duy', flow: !!t && !w, a: w ? .3 : 1 },
    { id: 'b3', from: 'duy', to: 'dav', flow: loop },
    { id: 'b4', from: 'dav', to: 'dus', flow: loop, dash: true, a: w ? .3 : 1 }
  ];
  if (w) {
    nodes.push({ id: 'alt', p: [-1.45, .85, 1.05], r: .095, cat: P.alt, text: `“${w[0]}”`, sub: M.bdt.kinds[w[2]], lit: w[2] === 'pos' ? .3 : 1, side: -1 });
    edges.push({ id: 'b5', from: 'durum', to: 'alt', flow: true, lit: 1 }, { id: 'b6', from: 'alt', to: 'duy', flow: true, lit: 1 });
  }
  return { nodes, edges, discs: [], pitch: .26, tag: L.bdt.full };
}

// psychodynamic: three layers like the lake seen from the side, a thread from the surface down to a stone
function scenePSD() {
  const P = L.psd.parts, m = momentOf(), X = M.psd.m[m.id], pk = st.picks;
  const s = [0, 1, 2].map(i => (pk[i] != null ? X[i][pk[i]] : null));
  const discs = [
    { id: 'l0', y: .6, r: 1.35, cat: P.yuzey, lit: s[0] ? 1 : 0, ghost: !s[0] },
    { id: 'l1', y: -.35, r: 1.22, cat: P.savunma, lit: s[1] ? 1 : 0, ghost: !s[1] },
    { id: 'l2', y: -1.3, r: 1.08, cat: P.kok, lit: s[2] ? 1 : 0, ghost: !s[2] }
  ];
  const nodes = [
    { id: 'an', p: [0, 1.4, 0], r: .06, cat: ghost() ? '' : U.moment(st.m + 1), text: ghost() ? '' : m.t, ghost: ghost() },
    { id: 'q0', p: [.6, .6, .35], r: .1, text: s[0] ? s[0][2] : '', ghost: !s[0], lit: s[0] ? .3 : 0 },
    { id: 'q1', p: [-.5, -.35, .55], r: .1, text: s[1] ? s[1][2] : '', ghost: !s[1], lit: s[1] ? .5 : 0, side: -1 },
    { id: 'q2', p: [.25, -1.3, -.15], r: .17, text: s[2] ? s[2][2] : '', ghost: !s[2], stone: true, lit: s[2] ? 1 : 0 }
  ];
  const edges = [
    { id: 'p0', from: 'an', to: 'q0', flow: !!s[0], lit: s[0] ? .3 : 0 },
    { id: 'p1', from: 'q0', to: 'q1', flow: !!s[1], lit: s[1] ? .5 : 0, dash: !s[1] },
    { id: 'p2', from: 'q1', to: 'q2', flow: !!s[2], lit: s[2] ? 1 : 0, dash: !s[2] }
  ];
  return { nodes, edges, discs, pitch: .42, tag: L.psd.full };
}

// ACT: the hexaflex; what you choose lights its points, and the thought drifts off or clings to the middle
const HEX = { an: 90, deger: 30, eylem: -30, benlik: -90, ayrisma: -150, kabul: 150 };
function actLit() {
  const pk = st.picks, lit = new Set();
  if (pk[0] != null) M.act.thoughtLights.forEach(x => lit.add(x));
  if (pk[1] != null) M.act.rel[pk[1]][2].forEach(x => lit.add(x));
  if (pk[2] != null) ['deger', 'eylem'].forEach(x => lit.add(x));
  return lit;
}
function sceneACT() {
  const P = L.act.parts, m = momentOf(), X = M.act.m[m.id], pk = st.picks, lit = actLit();
  const thought = pk[0] != null ? X[0][pk[0]] : null, v = pk[2] != null ? X[1][pk[2]] : null;
  const nodes = Object.entries(HEX).map(([id, deg]) => {
    const a = deg * Math.PI / 180, c = Math.cos(a);
    return { id, p: [1.3 * c, 1.3 * Math.sin(a), 0], r: .1, text: P[id], sub: id === 'deger' && v ? v[0] : '', lit: lit.has(id) ? 1 : 0, ghost: !lit.has(id), side: c < -.1 ? -1 : 1 };
  });
  // a thought you wrestle with sits right on the middle and hides the flexibility under it
  nodes.push({ id: 'merkez', p: [0, 0, 0], r: .07 + lit.size * .025, text: lit.size && pk[1] !== 0 ? P.merkez : '', lit: lit.size / 6, ghost: !lit.size });
  if (thought) {
    const clings = pk[1] === 0, free = pk[1] === 1 || pk[1] === 2;
    nodes.push({ id: 'dus', p: clings ? [.25, .3, .95] : free ? [2.35, 1.7, -.7] : [1.75, 1.15, .6], r: clings ? .17 : free ? .07 : .11,
      cat: L.bdt.parts.dus, text: `“${thought}”`, a: free ? .45 : 1, side: clings ? 1 : -1 });
  }
  const ids = Object.keys(HEX), order = ['an', 'deger', 'eylem', 'benlik', 'ayrisma', 'kabul'];
  const edges = order.map((id, i) => { const nx = order[(i + 1) % 6], on = lit.has(id) && lit.has(nx); return { id: `h${i}`, from: id, to: nx, lit: on ? 1 : 0, a: on ? 1 : .55 }; })
    .concat(ids.map(id => ({ id: `s-${id}`, from: 'merkez', to: id, lit: lit.has(id) ? 1 : 0, flow: lit.has(id), a: lit.has(id) ? 1 : .35 })));
  if (thought) edges.push({ id: 'tether', from: 'dus', to: 'merkez', dash: true, a: pk[1] === 0 ? 1 : .35 });
  return { nodes, edges, discs: [], pitch: .14, tag: L.act.full };
}
const SCENE = { bdt: sceneBDT, psd: scenePSD, act: sceneACT };

/* ---------------- the story: questions, answers, endings ---------------- */
// for one school and moment: the question and the three answers at a step, and what each answer adds to the story
function stepOf(i) {
  const m = momentOf(), pk = st.picks;
  if (st.lens === 'bdt') { const X = M.bdt.m[m.id], prev = i ? X[0][pk[0]][0] : null;
    return { q: val(M.bdt.q[i], prev), opts: X[i].map(o => ({ t: o[0], s: o[1] })) }; }
  if (st.lens === 'psd') { const X = M.psd.m[m.id], prev = i ? X[0][pk[0]][2] : null;
    return { q: val(M.psd.q[i], prev), opts: X[i].map(o => ({ t: o[0], s: o[1] })) }; }
  const X = M.act.m[m.id], th = pk[0] != null ? X[0][pk[0]].replace(/[.!?…]+$/, '') : null;
  if (i === 0) return { q: M.act.q[0], opts: X[0].map(t => ({ t: `“${t}”`, s: M.act.thoughtSay })) };
  if (i === 1) return { q: val(M.act.q[1], th), opts: M.act.rel.map(r => ({ t: val(r[0], th), s: r[1] })) };
  return { q: M.act.q[2], opts: X[1].map(v => ({ t: `${v[0]}: ${v[1]}`, s: M.act.valueSay(v[0]) })) };
}
function ending() {
  const m = momentOf(), pk = st.picks;
  if (st.lens === 'bdt') {
    const X = M.bdt.m[m.id], t = X[0][pk[0]], w = X[2][pk[2]];
    return { text: M.bdt.end(m.t, { feel: t[3], y: t[4], y2: w[3] }), path: [t[2], M.bdt.kinds[w[2]]], note: M.bdt.note[w[2]], retry: w[2] === 'pos' ? [2, U.again] : null };
  }
  if (st.lens === 'psd') {
    const X = M.psd.m[m.id];
    return { text: M.psd.end(m.t), path: [0, 1, 2].map(i => X[i][pk[i]][2]), note: M.psd.note, retry: null };
  }
  const lit = actLit(), rest = Object.keys(HEX).filter(id => !lit.has(id)).map(id => L.act.parts[id]);
  const list = rest.length > 1 ? `${rest.slice(0, -1).join(', ')} ve ${rest[rest.length - 1]}` : rest[0] || '';
  return { text: M.act.end(lit.size, pk[1] === 0, list), path: [...lit].map(id => L.act.parts[id]), sep: "·", note: M.act.note, retry: pk[1] === 0 ? [1, M.act.retry] : null };
}

function renderHead() {
  if (st.mode === 'setup') { head.innerHTML = `<span class="mono">5 an · 3 mercek</span>`; return; }
  const n = 3, done = st.picks.length;
  head.innerHTML = `<span class="mono">${U.moment(st.m + 1)} · ${esc(momentOf().t)}</span><span class="mrc-lens">${esc(L[st.lens].n)}</span>
    <span class="mrc-dots" aria-label="${esc(U.step(Math.min(done + 1, n), n))}">${[0, 1, 2].map(i => `<i class="${i < done ? 'on' : ''}${i === done && st.mode === 'play' ? ' now' : ''}"></i>`).join('')}</span>`;
}
function story() {
  return st.picks.map((p, i) => { const o = stepOf(i).opts[p]; return `<li><b>${esc(o.t)}</b><span>${esc(o.s)}</span></li>`; }).join('');
}
function render(fresh) {
  renderHead();
  const m = momentOf();
  if (st.mode === 'setup') {
    body.innerHTML = `<p class="mrc-k mono">${U.pickMoment}</p>
      <div class="mrc-moments">${M.moments.map((x, i) => `<button type="button" data-m="${i}" class="${i === st.m ? 'on' : ''}" aria-pressed="${i === st.m}"><i>${pad(i + 1)}</i><b>${esc(x.t)}</b></button>`).join('')}</div>
      <p class="mrc-d">${esc(m.d)}</p>
      <p class="mrc-k mono">${U.pickLens}</p>
      <div class="mrc-lenses">${LENSES.map(k => `<button type="button" data-l="${k}" class="${k === st.lens ? 'on' : ''}" aria-pressed="${k === st.lens}"><b>${esc(L[k].n)}</b><small>${esc(L[k].full)}</small><span>${esc(L[k].d)}</span></button>`).join('')}</div>
      <button type="button" class="btn-d mrc-go">${U.start} →</button>`;
  } else if (st.mode === 'play') {
    const s = stepOf(st.picks.length);
    body.innerHTML = `<blockquote class="mrc-scene">${esc(m.d)}</blockquote><ol class="mrc-story">${story()}</ol>
      <p class="mrc-q">${esc(s.q)}</p>
      <div class="mrc-opts">${s.opts.map((o, i) => `<button type="button" data-o="${i}"><i>${'ABC'[i]}</i><span>${esc(o.t)}</span></button>`).join('')}</div>`;
  } else {
    const e = ending(), others = LENSES.filter(k => k !== st.lens);
    body.innerHTML = `<blockquote class="mrc-scene">${esc(m.d)}</blockquote><ol class="mrc-story">${story()}</ol>
      <div class="mrc-end"><p class="mrc-endt">${esc(e.text)}</p>
        <div class="mrc-path">${e.path.map(x => `<span>${esc(x)}</span>`).join(`<em>${e.sep || '→'}</em>`)}</div>
        <div class="mrc-note"><b class="mono">${U.noteTitle}</b><p>${esc(e.note)}</p></div>
        <div class="mrc-acts">${e.retry ? `<button type="button" class="btn-o" data-retry="${e.retry[0]}">↺ ${esc(e.retry[1])}</button>` : ''}
          <small>${U.otherLens}</small>${others.map(k => `<button type="button" class="btn-o" data-l="${k}">${esc(L[k].n)}</button>`).join('')}
          <button type="button" class="btn-o" data-setup>${U.otherMoment}</button></div>
        <button type="button" class="btn-d mrc-book">${U.book}</button></div>`;
  }
  sync(SCENE[st.lens]());
  if (D && fresh !== false) {
    const items = body.querySelectorAll(st.mode === 'play' ? '.mrc-story li:last-child, .mrc-q, .mrc-opts button' : st.mode === 'end' ? '.mrc-story li:last-child, .mrc-end > *' : '.mrc-moments, .mrc-lenses, .mrc-go');
    gsap.from(items, { opacity: 0, y: 12, duration: .6, stagger: .06, ease: 'expo.out', clearProps: 'all' });
  }
}

body.addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  if (b.dataset.m != null) { st.m = +b.dataset.m; render(false); return; }
  if (b.dataset.l != null) {
    st.lens = b.dataset.l;
    if (st.mode === 'setup') { render(false); return; }
    st.mode = 'play'; st.picks = []; render(); return;     // the same moment through another lens
  }
  if (b.classList.contains('mrc-go')) { st.mode = 'play'; st.picks = []; render(); body.querySelector('.mrc-opts button')?.focus({ preventScroll: true }); return; }
  if (b.dataset.o != null) { st.picks.push(+b.dataset.o); st.mode = st.picks.length === 3 ? 'end' : 'play'; render(); return; }
  if (b.dataset.retry != null) { st.picks = st.picks.slice(0, +b.dataset.retry); st.mode = 'play'; render(); return; }
  if (b.dataset.setup != null) { st.mode = 'setup'; st.picks = []; render(); return; }
  if (b.classList.contains('mrc-book')) document.querySelector('[data-book]')?.click();
});
// 1, 2, 3 (or A, B, C) answer while the game has focus
R.addEventListener('keydown', e => {
  if (st.mode !== 'play' || e.ctrlKey || e.metaKey || e.altKey) return;
  const i = '123'.indexOf(e.key) >= 0 ? '123'.indexOf(e.key) : 'abc'.indexOf(e.key.toLowerCase());
  const b = i >= 0 && body.querySelector(`[data-o="${i}"]`); if (b) { e.preventDefault(); b.click(); body.querySelector('.mrc-opts button')?.focus({ preventScroll: true }); }
});
render(false);
})();
