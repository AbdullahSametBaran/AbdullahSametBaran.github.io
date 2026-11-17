/* Sistem adası: an isometric pixel island with three jobs to do, things to find and badges to earn.
   Every visible string lives in window.T (one per language); this file is the same for both pages. */
(() => {
const T = window.T, $ = id => document.getElementById(id);
const Q = new URLSearchParams(location.search);
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TOUCH = matchMedia('(hover: none)').matches;
const CONTACT = { li: 'https://www.linkedin.com/in/abdullah-samet-baran-b7b565208/', mail: 'mailto:abdullahsametbaran@gmail.com' };
if (Q.has('embed')) document.body.classList.add('embed');
if (window.sub) sub.arrive();

/* ---------------- saved progress (this visitor's browser only) ---------------- */
const KEY = 'sistemAdasi.v1';
const blank = () => ({ badges: {}, packets: [], finished: [], talked: [], best: 0, shown: {}, run: null });
let save;
try { save = Object.assign(blank(), Q.has('reset') ? {} : JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { save = blank(); }
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* private mode: progress lives for this visit */ } };
const newRun = ch => ({ char: ch, z: [false, false, false], el: 0, found: { edge: false, short: false }, bridge: false, done: false, speed: false });
let run = save.run && !save.run.done ? save.run : null;
const ABIL = { gozcu: ['see'], kasif: ['ask', 'path'], mimar: ['build'], samet: ['see', 'ask', 'path', 'build'] };
const has = k => !!run && ABIL[run.char].includes(k);
const CHARS = ['gozcu', 'kasif', 'mimar', 'samet'];
const sametOpen = () => ['gozcu', 'kasif', 'mimar'].every(c => save.finished.includes(c));

/* ---------------- pixel helpers ---------------- */
const PAL = { sky: '#0b1430', sky2: '#142454', star: '#c9d6ff', g: '#5aa65a', gD: '#3f8a47', gL: '#7cc46f', dirt: '#7a4e2d', dirtD: '#5b3720', path: '#d8c49a', pathD: '#b9a476', wood: '#a8703f', woodD: '#7d5230', woodL: '#c48a52', metal: '#9aa7b8', metalD: '#6b7787', metalL: '#c3cdd9', white: '#eef1f5', whiteD: '#c9d0da', screen: '#0f1a33', cyan: '#5eead4', blue: '#3d7bff', amber: '#ffc65c', pink: '#ff8fa3', sky3: '#8fd3ff', leaf: '#a8dc6c', ink: '#0b1430', skin: '#e8b48a', hair: '#2a1d16', shirt: '#3d7bff', shirtD: '#2b5bd0', pants: '#1d2433', shoe: '#0b0f1a', water: '#2a5aa8', waterL: '#3f74c9', bush: '#2f7a3b', bushL: '#4a9a4f' };
// a crisp scanline polygon fill: no anti-aliasing, so every edge stays a pixel edge
function poly(c, pts, col) {
  c.fillStyle = col; let a = Infinity, b = -Infinity; for (const p of pts) { a = Math.min(a, p[1]); b = Math.max(b, p[1]); }
  for (let y = Math.floor(a); y < Math.ceil(b); y++) { const yc = y + .5, xs = [];
    for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; if ((p[1] <= yc && q[1] > yc) || (q[1] <= yc && p[1] > yc)) xs.push(p[0] + (yc - p[1]) / (q[1] - p[1]) * (q[0] - p[0])); }
    xs.sort((m, n) => m - n); for (let k = 0; k + 1 < xs.length; k += 2) { const x0 = Math.round(xs[k]), x1 = Math.round(xs[k + 1]); if (x1 > x0) c.fillRect(x0, y, x1 - x0, 1); } }
}
const P = (x, y, z = 0) => [(x - y) * 16, (x + y) * 8 - z];          // world (tiles) to screen (pixels)
function box(c, x0, y0, x1, y1, h, top, left, right, z0 = 0) {     // an isometric prism; returns its face helpers
  const Tt = (x, y) => P(x, y, z0 + h), G = (x, y) => P(x, y, z0);
  poly(c, [Tt(x0, y1), Tt(x1, y1), G(x1, y1), G(x0, y1)], left);
  poly(c, [Tt(x1, y1), Tt(x1, y0), G(x1, y0), G(x1, y1)], right);
  poly(c, [Tt(x0, y0), Tt(x1, y0), Tt(x1, y1), Tt(x0, y1)], top);
  return { L: (u, v) => P(x0 + (x1 - x0) * u, y1, z0 + h * v), R: (u, v) => P(x1, y1 - (y1 - y0) * u, z0 + h * v), Tp: (u, v) => P(x0 + (x1 - x0) * u, y0 + (y1 - y0) * v, z0 + h) };
}
const quad = (c, f, u0, v0, u1, v1, col) => poly(c, [f(u0, v1), f(u1, v1), f(u1, v0), f(u0, v0)], col);
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
function sprite(w, h, fn) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; fn(cv.getContext('2d')); return cv; }
const DIA = [[16, 0], [32, 8], [16, 16], [0, 8]];
const GRASS = [0, 1, 2].map(() => sprite(32, 16, c => { poly(c, DIA, PAL.g);
  for (let i = 0; i < 18; i++) { const y = 2 + Math.floor(rnd() * 12), half = (y < 8 ? y : 16 - y) * 2, x = 16 - half + Math.floor(rnd() * half * 2); c.fillStyle = rnd() < .5 ? PAL.gD : PAL.gL; c.fillRect(x, y, 1, 1); } }));
const PATH = sprite(32, 16, c => { poly(c, DIA, PAL.path); c.fillStyle = PAL.pathD; [[10, 6], [11, 6], [20, 9], [21, 9], [15, 11], [16, 3], [24, 7], [6, 8]].forEach(([x, y]) => c.fillRect(x, y, 1, 1)); });

/* ---------------- the map ---------------- */
const N = 18;
const LAND = (x, y) => x >= 0 && y >= 0 && x < N && y < N && !(x + y < 3) && !(x + y > 31) && !(x - y > 14) && !(y - x > 14) && !((x === 0 || y === 0) && (x + y) % 5 === 2);
const ISLET = new Set(['19,7', '19,8', '20,7', '20,8', '19,9']);           // the little island across the broken bridge
const BRIDGE = '18,8';
const isLand = (x, y) => LAND(x, y) || ISLET.has(x + ',' + y);
const PATHS = new Set();
const lineP = (x0, y0, x1, y1) => { for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) PATHS.add(x + ',' + y0); for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) PATHS.add(x1 + ',' + y); };
lineP(4, 6, 13, 6); lineP(9, 6, 9, 13); lineP(4, 6, 4, 10); lineP(13, 6, 13, 9); lineP(2, 9, 4, 9); lineP(9, 9, 14, 9); lineP(13, 8, 17, 8); lineP(9, 13, 12, 13); lineP(12, 13, 12, 15);
// the places you can talk to; r is the footprint that blocks walking
const ST = [
  { id: 'kontrol', at: [9.6, 12.6], r: [8, 13.3, 11.2, 14.7] },
  { id: 'ofis', at: [4.5, 5.3], r: [3.2, 3.4, 5.8, 4.4] },
  { id: 'kule', at: [13.2, 5.4], r: [14, 3.6, 15, 4.6] },
  { id: 'atolye', at: [13.3, 9.9], r: [14, 9.3, 15.8, 10.4] },
  { id: 'sandik', at: [4.5, 10.6], r: [3.2, 11.1, 4.1, 12] },
  { id: 'kapi', at: [2.6, 9.5], r: [1, 8.6, 1.6, 10.4] },
  { id: 'lab', at: [12.5, 15.4], r: [13, 15, 14.2, 16.2] },
  { id: 'kopru', at: [17.3, 8.5], r: null }
];
const BLOCK = new Set();
ST.forEach(s => { if (!s.r) return; for (let x = Math.floor(s.r[0]); x < Math.ceil(s.r[2]); x++) for (let y = Math.floor(s.r[1]); y < Math.ceil(s.r[3]); y++) BLOCK.add(x + ',' + y); });
[[16, 12], [16, 13], [6, 15], [10, 11], [11, 11], [12, 11], [13, 11], [8, 2], [9, 2], [10, 2], [8, 3], [9, 3], [10, 3]].forEach(([x, y]) => BLOCK.add(x + ',' + y));   // rack, lamp, conveyor, process board
const HEDGE = new Set(['11,2', '12,2', '13,2', '14,2', '15,2']);   // the hedge north of the tower; one bush only the Kâşif sees through
const GAP = '13,2';
function walk(x, y) {
  const tx = Math.floor(x), ty = Math.floor(y), k = tx + ',' + ty;
  if (k === BRIDGE) return !!(run && run.bridge);
  if (ISLET.has(k)) return true;
  if (!LAND(tx, ty) || BLOCK.has(k)) return false;
  if (HEDGE.has(k)) return k === GAP && has('path');
  return true;
}
const PK = [
  { id: 'p1', x: 6.5, y: 13.5 },              // in the open
  { id: 'p2', x: 14.5, y: 1.5 },              // behind the hedge: the long way round, or the Kâşif's shortcut
  { id: 'p3', x: 19.5, y: 7.6 },              // on the islet, across the bridge
  { id: 'p4', x: 16.5, y: 2.6 },              // the far east shore, as the robot tells you
  { id: 'p5', x: 15.5, y: 5.6, after: true }  // shows up behind the tower once the island is live
];
const TIP = [16.4, 14.4];                      // the island's far corner, marked by a flag
const STARS = Array.from({ length: 90 }, () => [rnd(), rnd(), rnd()]);
const me = { x: 9.5, y: 8.5, dir: 1, back: false, moving: false, path: null, goal: null };
const helper = { x: 9, y: 9 };
const bots = [0, .5].map(o => ({ o, x: 0, y: 0 }));
const LOOP = [[5, 6], [12.5, 6], [12.5, 9], [9.5, 9], [9.5, 12.5], [5, 12.5]];
function loopAt(u) { const seg = LOOP.map((p, i) => [p, LOOP[(i + 1) % LOOP.length]]); const lens = seg.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1])), tot = lens.reduce((a, b) => a + b);
  let d = (u % 1) * tot; for (let i = 0; i < seg.length; i++) { if (d <= lens[i]) { const [a, b] = seg[i], k = d / lens[i]; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k]; } d -= lens[i]; } return LOOP[0]; }
// people walking the island; they pace between two points and stop when you talk to them
const NPC = [
  { id: 'muhasebe', a: [5.6, 7.5], b: [8.3, 7.5], sp: .07, o: 0, st: { shirt: '#2f855a', hair: '#6b3e26' } },
  { id: 'stajyer', a: [10.4, 10.4], b: [12.7, 10.4], sp: .09, o: .3, st: { shirt: '#f0a33a', hair: '#1a1a1a' } },
  { id: 'yazilim', a: [11.6, 7.4], b: [11.6, 4.5], sp: .06, o: .6, st: { shirt: '#273248', hair: '#3b2a1a' } }
];
NPC.forEach(n => { n.x = n.a[0]; n.y = n.a[1]; n.ph = n.o; n.dir = 1; n.back = false; });
const STYLE = {
  gozcu: { shirt: '#2bb39e', glasses: true },
  kasif: { shirt: '#e0873a', lens: true },
  mimar: { shirt: '#5a6b8c', hat: true },
  samet: { shirt: '#3d7bff' },
  deniz: { shirt: '#8a5cf6', hair: '#4a3020' },
  ece: { shirt: '#c8664a', hair: '#7a3b1e' }
};
const HOUR = Q.has('saat') ? +Q.get('saat') : new Date().getHours();
const NIGHT = HOUR < 7 || HOUR >= 19;

/* ---------------- drawing the world ---------------- */
function drawChar(c, x, y, back, flip, frame, st = STYLE.samet) {
  const F = back ? ['...hhhh...', '..hhhhhh..', '..hhhhhh..', '..hhhhhh..', '..shhhhs..', '...ssss...', '..bbbbbb..', '.bbbbbbbb.', '.sbbbbbbs.', '.sbbbbbbs.', '..bbbbbb..', '..pppppp..']
    : ['...hhhh...', '..hhhhhh..', '..hssssh..', st.glasses ? '..gggggg..' : '..swswsw..', '..ssssss..', '...ssss...', '..bbbbbb..', '.bbbbbbbb.', '.sbbbbbbs.', '.sbbbbbbs.', '..bbbbbb..', '..pppppp..'];
  const rows = F.slice();
  if (st.hat) { rows[0] = '..yyyyyy..'; rows[1] = '.yyyyyyyy.'; }
  const legs = frame ? ['..pp..pp..', '.pp....pp.', '.kk....kk.'] : ['..pp..pp..', '..pp..pp..', '..kk..kk..'];
  const all = rows.concat(legs), C = { h: st.hair || PAL.hair, s: PAL.skin, w: PAL.ink, b: st.shirt, p: PAL.pants, k: PAL.shoe, g: PAL.ink, y: PAL.amber };
  c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(x - 5, y - 1, 10, 2); c.fillRect(x - 4, y, 8, 1);
  all.forEach((r, j) => [...r].forEach((ch, i) => { if (ch === '.') return; c.fillStyle = C[ch]; c.fillRect(x - 5 + (flip ? 9 - i : i), y - all.length + j, 1, 1); }));
  if (st.lens && !back) { const hx = x + (flip ? -6 : 5), hy = y - 9; c.fillStyle = PAL.ink; c.fillRect(hx, hy, 3, 1); c.fillRect(hx, hy + 2, 3, 1); c.fillRect(hx - 1 + (flip ? 4 : 0), hy + 1, 1, 1); c.fillStyle = PAL.sky3; c.fillRect(hx + (flip ? 0 : 0), hy + 1, 3, 1); c.fillStyle = PAL.woodD; c.fillRect(hx + (flip ? 3 : -1), hy + 3, 1, 2); }
}
function drawBot(c, x, y, t) {
  const b = Math.round(Math.sin(t * 6) * 1);
  c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x - 4, y - 1, 8, 2);
  c.fillStyle = PAL.cyan; c.fillRect(x - 4, y - 10 + b, 8, 7); c.fillStyle = '#2bb39e'; c.fillRect(x - 4, y - 4 + b, 8, 1);
  c.fillStyle = PAL.screen; c.fillRect(x - 3, y - 8 + b, 6, 3); c.fillStyle = PAL.cyan; c.fillRect(x - 2 + (Math.floor(t * 2) % 2) * 2, y - 7 + b, 2, 1);
  c.fillStyle = PAL.metalL; c.fillRect(x, y - 12 + b, 1, 2); c.fillStyle = PAL.amber; c.fillRect(x, y - 13 + b, 1, 1);
}
function glow(c, x, y, r, col, a) { c.globalAlpha = a; c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.globalAlpha = 1; }
function drawStation(c, s, t, Z) {
  if (s.id === 'ofis') {
    drawChar(c, ...P(4.4, 3.2), false, false, 0, STYLE.ece);
    const d = box(c, 3.3, 3.5, 5.7, 4.3, 9, PAL.woodL, PAL.woodD, PAL.wood);
    poly(c, [d.Tp(.1, .2), d.Tp(.35, .2), d.Tp(.35, .7), d.Tp(.1, .7)], PAL.white);
    poly(c, [d.Tp(.55, .3), d.Tp(.8, .3), d.Tp(.8, .8), d.Tp(.55, .8)], Z[1] ? PAL.cyan : PAL.sky3);
    box(c, 3.5, 4.5, 4.0, 4.9, 6, PAL.blue, PAL.shirtD, PAL.shirtD); box(c, 5.0, 4.5, 5.5, 4.9, 6, PAL.blue, PAL.shirtD, PAL.shirtD);
    // paper piles shrink once the robot takes over
    if (!Z[1]) { const p = d.Tp(.2, .45); c.fillStyle = PAL.white; for (let i = 0; i < 4; i++) c.fillRect(p[0] - 3, p[1] - 2 - i * 2, 7, 2); }
  } else if (s.id === 'kule') {
    const tw = box(c, 14, 3.6, 15, 4.6, 40, PAL.metalL, PAL.metal, PAL.metalD);
    for (let i = 0; i < 4; i++) quad(c, tw.L, .25, .15 + i * .2, .75, .25 + i * .2, Z[2] ? (i % 2 ? PAL.cyan : PAL.sky3) : PAL.screen);
    quad(c, tw.R, .3, .2, .7, .5, Z[2] ? PAL.amber : PAL.screen);
    const top = P(14.5, 4.1, 46); c.fillStyle = PAL.metalD; c.fillRect(top[0], top[1] - 4, 1, 6);
    c.fillStyle = Z[2] ? PAL.amber : '#5a5040'; c.fillRect(top[0] - 2, top[1] - 8, 5, 4);
    if (Z[2]) glow(c, top[0], top[1] - 6, 9 + Math.sin(t * 3) * 2, PAL.amber, .25);
  } else if (s.id === 'atolye') {
    const bn = box(c, 14, 9.3, 15.8, 10.4, 10, PAL.metalL, PAL.metal, PAL.metalD);
    const base = bn.Tp(.3, .4), arm = Z[1] ? Math.sin(t * 1.6) * 4 : 0;
    c.fillStyle = PAL.amber; c.fillRect(base[0] - 2, base[1] - 3, 5, 3); c.fillRect(base[0], base[1] - 12, 2, 10);
    c.fillRect(base[0], base[1] - 13, 9 + Math.round(arm), 2); c.fillStyle = PAL.ink; c.fillRect(base[0] + 8 + Math.round(arm), base[1] - 13, 2, 5);
    const sp = bn.Tp(.75, .5); if (Z[1] && Math.floor(t * 6) % 3 === 0) { c.fillStyle = PAL.amber; c.fillRect(sp[0] - 1, sp[1] - 2, 1, 1); c.fillRect(sp[0] + 2, sp[1] - 3, 1, 1); }
    drawBot(c, ...bn.Tp(.65, .5), Z[1] ? t * .3 : 0);
  } else if (s.id === 'kontrol') {
    drawChar(c, ...P(11.7, 12.9), false, true, 0, STYLE.deniz);
    box(c, 8.4, 13.3, 10.8, 13.9, 8, PAL.metalL, PAL.metal, PAL.metalD);
    const w = box(c, 8, 14.2, 11.2, 14.7, 24, PAL.metalD, PAL.screen, PAL.ink, 4);
    if (Z[0]) { for (let i = 0; i < 7; i++) { const hgt = .25 + .55 * (.5 + .5 * Math.sin(t * 2 + i * .9)); quad(c, w.L, .08 + i * .12, .15, .15 + i * .12, .15 + hgt * .7, i === 6 ? PAL.amber : (i % 2 ? PAL.cyan : PAL.blue)); } quad(c, w.L, .05, .86, .95, .89, PAL.cyan); }
    else if (Math.floor(t * 2) % 2) quad(c, w.L, .08, .2, .11, .3, PAL.cyan);      // an empty screen with a blinking cursor
  } else if (s.id === 'sandik') {
    const ch = box(c, 3.2, 11.1, 4.1, 12, 9, PAL.woodL, PAL.wood, PAL.woodD);
    quad(c, ch.L, .4, .35, .6, .7, PAL.amber); quad(c, ch.L, 0, .55, 1, .65, PAL.woodD);
  } else if (s.id === 'kapi') {
    box(c, 1, 8.6, 1.5, 9.0, 30, PAL.metalL, PAL.metal, PAL.metalD); box(c, 1, 10.0, 1.5, 10.4, 30, PAL.metalL, PAL.metal, PAL.metalD);
    box(c, 1, 8.6, 1.5, 10.4, 5, PAL.metalL, PAL.metal, PAL.metalD, 30);
    const open = Z.done, g = open ? .55 + .45 * Math.sin(t * 3) : .15;
    for (let k = 0; k < 3; k++) { c.globalAlpha = open ? .4 + g * .5 - k * .1 : .25; poly(c, [P(1.25, 9.05, 4 + k * 8), P(1.25, 9.95, 4 + k * 8), P(1.25, 9.95, 10 + k * 8), P(1.25, 9.05, 10 + k * 8)], open ? (k % 2 ? PAL.leaf : '#7cc46f') : PAL.metalD); }
    c.globalAlpha = 1;
  } else if (s.id === 'lab') {
    const open = save.packets.length >= 5;
    const bk = box(c, 13, 15, 14.2, 16.2, 14, '#3b4664', '#2b3452', '#1f2740');
    quad(c, bk.L, .3, 0, .7, .75, open ? '#05070f' : PAL.metalD);
    if (!open) { quad(c, bk.L, .45, .35, .55, .5, PAL.amber); }
    else glow(c, ...bk.L(.5, .35), 6 + Math.sin(t * 3), PAL.cyan, .35);
    const ant = bk.Tp(.7, .3); c.fillStyle = PAL.metalD; c.fillRect(ant[0], ant[1] - 6, 1, 6); c.fillStyle = Math.floor(t * 2) % 2 ? PAL.cyan : '#1f6b5f'; c.fillRect(ant[0] - 1, ant[1] - 7, 3, 2);
  }
}
function drawBoard(c) {
  box(c, 8.1, 2.9, 8.3, 3.1, 14, PAL.metal, PAL.metalD, PAL.metalD); box(c, 10.7, 2.9, 10.9, 3.1, 14, PAL.metal, PAL.metalD, PAL.metalD);
  const b = box(c, 8, 2.7, 11, 2.95, 22, PAL.whiteD, PAL.white, PAL.whiteD, 8);
  [[.08, .2, PAL.amber], [.24, .55, PAL.pink], [.42, .25, PAL.sky3], [.6, .6, PAL.amber], [.76, .3, PAL.leaf], [.3, .2, PAL.sky3]].forEach(([u, v, col], i) => quad(c, b.L, u, v, u + .11, v + .26 + (i % 2) * .04, col));
  quad(c, b.L, .2, .44, .45, .47, PAL.ink);
}
function drawBush(c, x, y, parted, t) {
  const b = box(c, x + .1, y + .1, x + .9, y + .9, parted ? 5 : 11, PAL.bushL, PAL.bush, '#24602e');
  if (parted) { const s = b.Tp(.5, .5); if (Math.floor(t * 3) % 2) { c.fillStyle = PAL.amber; c.fillRect(s[0] - 1, s[1] - 8, 1, 1); c.fillRect(s[0] + 3, s[1] - 5, 1, 1); } }
  else { c.fillStyle = PAL.leaf; const s = b.Tp(.4, .4); c.fillRect(s[0], s[1], 1, 1); c.fillRect(s[0] + 4, s[1] + 2, 1, 1); }
}
function drawBridge(c, fixed, t) {
  const [sx, sy] = P(18, 8);
  poly(c, [[sx, sy + 4], [sx + 16, sy + 12], [sx, sy + 20], [sx - 16, sy + 12]], PAL.water);
  if (fixed) { for (let i = 0; i < 5; i++) box(c, 18 + i * .2, 8.15, 18 + i * .2 + .16, 8.85, 2, i % 2 ? PAL.woodL : PAL.wood, PAL.woodD, PAL.woodD); }
  else { [0, 1, 4].forEach(i => box(c, 18 + i * .2, 8.15, 18 + i * .2 + .16, 8.85, 2, PAL.wood, PAL.woodD, PAL.woodD)); }
  box(c, 18, 8.1, 19, 8.15, 5, PAL.woodD, PAL.woodD, PAL.woodD); if (fixed) box(c, 18, 8.85, 19, 8.9, 5, PAL.woodD, PAL.woodD, PAL.woodD);
}
function drawPacket(c, p, t, beam) {
  const [x, y] = P(p.x, p.y, 6 + Math.round(Math.sin(t * 3 + p.x) * 2));
  if (beam) { c.globalAlpha = .25 + .15 * Math.sin(t * 4 + p.y); c.fillStyle = PAL.cyan; c.fillRect(x - 1, y - 40, 2, 34); c.globalAlpha = 1; }
  c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x - 3, y + 5, 6, 2);
  c.fillStyle = PAL.blue; c.fillRect(x - 4, y - 4, 8, 8); c.fillStyle = PAL.white; c.fillRect(x - 2, y - 4, 4, 3); c.fillStyle = PAL.ink; c.fillRect(x - 2, y + 1, 4, 3);
  c.fillStyle = PAL.amber; if (Math.floor(t * 3) % 2) c.fillRect(x + 4, y - 6, 1, 1);
}
function drawWorld(c, W, H, camX, camY, t, opts = {}) {
  const Z = opts.all ? Object.assign([true, true, true], { done: true }) : Object.assign(run ? run.z.slice() : [false, false, false], { done: !!(run && run.done) });
  if (NIGHT) { c.fillStyle = PAL.sky; c.fillRect(0, 0, W, H); c.fillStyle = PAL.sky2; for (let y = Math.floor(H * .55); y < H; y += 2) c.fillRect(0, y, W, 1);
    STARS.forEach(([a, b, k]) => { const tw = (Math.sin(t * 2 + k * 20) > .6); c.fillStyle = tw ? '#ffffff' : PAL.star; c.globalAlpha = .35 + k * .5; c.fillRect(Math.floor(a * W), Math.floor(b * H * .7), 1, 1); }); c.globalAlpha = 1; }
  else { c.fillStyle = '#7cc2ec'; c.fillRect(0, 0, W, H); c.fillStyle = '#93d0f2'; for (let y = Math.floor(H * .45); y < H; y += 2) c.fillRect(0, y, W, 1);
    c.fillStyle = '#ffe9a8'; c.fillRect(Math.floor(W * .82), Math.floor(H * .1), 10, 10); c.fillStyle = '#fff6d6'; c.fillRect(Math.floor(W * .82) + 2, Math.floor(H * .1) + 2, 6, 6);
    c.fillStyle = 'rgba(255,255,255,.85)'; [[.12, .14, 22], [.35, .08, 16], [.6, .18, 26]].forEach(([a, b, w]) => { const x = Math.floor(((a + t * .004) % 1.1) * W) - 20, y = Math.floor(b * H); c.fillRect(x, y, w, 3); c.fillRect(x + 4, y - 2, w - 8, 2); }); }
  c.save(); c.translate(Math.round(W / 2 - camX), Math.round(H / 2 - camY));
  for (let s = 0; s < N * 2 + 4; s++) for (let x = 0; x <= s; x++) { const y = s - x; const k = x + ',' + y;
    if (k === BRIDGE) continue; if (!isLand(x, y)) continue;
    const [sx, sy] = P(x, y);
    if (!isLand(x, y + 1)) { poly(c, [[sx - 16, sy + 8], [sx, sy + 16], [sx, sy + 30], [sx - 16, sy + 22]], PAL.dirt); c.fillStyle = PAL.dirtD; c.fillRect(sx - 9, sy + 20, 2, 1); c.fillRect(sx - 4, sy + 24, 2, 1); }
    if (!isLand(x + 1, y)) poly(c, [[sx, sy + 16], [sx + 16, sy + 8], [sx + 16, sy + 22], [sx, sy + 30]], PAL.dirtD);
    c.drawImage(PATHS.has(k) ? PATH : GRASS[(x * 7 + y * 13) % 3], sx - 16, sy);
  }
  drawBridge(c, opts.all || (run && run.bridge), t);
  // things, back to front
  const items = [];
  ST.forEach(s => { if (s.r) items.push({ k: s.r[2] + s.r[3], f: () => drawStation(c, s, t, Z) }); });
  items.push({ k: 11 + 3.1, f: () => drawBoard(c) });
  HEDGE.forEach(h => { const [x, y] = h.split(',').map(Number); items.push({ k: x + y + 1.4, f: () => drawBush(c, x, y, h === GAP && has('path') && !opts.all, t) }); });
  items.push({ k: 16 + 12.5, f: () => { const r = box(c, 16, 12, 16.8, 13.8, 26, PAL.metalD, PAL.ink, '#1b2440'); for (let i = 0; i < 5; i++) { const blink = Math.floor(t * 4 + i * 1.7) % 3 === 0; quad(c, r.L, .2, .1 + i * .18, .3, .16 + i * .18, blink ? PAL.cyan : '#1f6b5f'); quad(c, r.L, .5, .1 + i * .18, .8, .14 + i * .18, '#2b3658'); } } });
  items.push({ k: 6.5 + 15.5, f: () => { box(c, 6.4, 15.4, 6.6, 15.6, 22, PAL.metalD, PAL.ink, PAL.ink); const lp = P(6.5, 15.5, 24); c.fillStyle = NIGHT ? PAL.amber : '#c9b27a'; c.fillRect(lp[0] - 2, lp[1] - 2, 4, 3); if (NIGHT) glow(c, lp[0], lp[1], 10, PAL.amber, .18 + .06 * Math.sin(t * 3)); } });
  items.push({ k: 13.5 + 11.6, f: () => { const belt = box(c, 10, 11.2, 14, 11.8, 5, '#2b3658', PAL.ink, '#1b2440'), sp = Z[1] ? t * .12 : 0;
    for (let i = 0; i < 8; i++) { const u = ((sp + i / 8) % 1); quad(c, belt.Tp, u, .1, Math.min(1, u + .015), .9, '#3d4a73'); }
    if (Z[1]) for (let k = 0; k < 3; k++) { const u = (sp + k / 3) % 1; box(c, 10 + u * 3.7, 11.3, 10.3 + u * 3.7, 11.7, 3, PAL.white, PAL.whiteD, PAL.whiteD, 5); } } });
  items.push({ k: TIP[0] + TIP[1], f: () => { const [x, y] = P(...TIP); c.fillStyle = PAL.woodD; c.fillRect(x, y - 16, 1, 16); c.fillStyle = save.badges.uc ? PAL.amber : PAL.pink; const w = Math.floor(t * 4) % 2; c.fillRect(x + 1, y - 16, 6 + w, 2); c.fillRect(x + 1, y - 14, 5, 2); } });
  if (!opts.still) PK.forEach(p => { if (save.packets.includes(p.id) || (p.after && !(run && run.done))) return; const seeAll = has('see'), d = Math.hypot(p.x - me.x, p.y - me.y);
    if (!seeAll && d > 3.6 && !opts.all) return; items.push({ k: p.x + p.y, f: () => drawPacket(c, p, t, seeAll) }); });
  if (Z[1]) bots.forEach(b => items.push({ k: b.x + b.y, f: () => drawBot(c, ...P(b.x, b.y), t + b.o * 10) }));
  NPC.forEach(n => items.push({ k: n.x + n.y, f: () => drawChar(c, ...P(n.x, n.y), n.back, n.dir < 0, n.moving ? Math.floor(t * 6) % 2 : 0, n.st) }));
  if (opts.player !== false && run) {
    if (save.helperOn) items.push({ k: helper.x + helper.y, f: () => drawBot(c, ...P(helper.x, helper.y), t * 1.3) });
    items.push({ k: me.x + me.y, f: () => drawChar(c, ...P(me.x, me.y), me.back, me.dir < 0, me.moving ? Math.floor(t * 8) % 2 : 0, STYLE[run.char]) });
  }
  items.sort((a, b) => a.k - b.k).forEach(i => i.f());
  c.restore();
  if (NIGHT) { c.fillStyle = 'rgba(8,14,40,.12)'; c.fillRect(0, 0, W, H); }
}

/* ---------------- HUD, toasts, saving ---------------- */
const BADGES = [
  ['pano', '📊', 'main'], ['soru', '🔍', 'main'], ['canli', '🚀', 'main'],
  ['keskin', '👁️', 'char'], ['kisayol', '🧭', 'char'], ['kopru', '🌉', 'char'],
  ['arsiv', '🗂️', 'exp'], ['sohbet', '💬', 'exp'],
  ['robot', '🤖', 'secret'], ['gece', '🌙', 'secret'], ['uc', '🗺️', 'secret'], ['hizli', '⏱️', 'secret']
];
const badgeCount = () => BADGES.filter(b => save.badges[b[0]]).length;
const toastQ = []; let toastBusy = false;
function toast(msg) { toastQ.push(msg); if (!toastBusy) nextToast(); }
function nextToast() { const m = toastQ.shift(), el = $('toast'); if (!m) { toastBusy = false; return; } toastBusy = true; el.textContent = m; el.classList.add('on');
  setTimeout(() => { el.classList.remove('on'); setTimeout(nextToast, 380); }, 2400); }
function award(id) {
  if (save.badges[id]) return; save.badges[id] = true; const b = T.badges[id]; toast(T.badgeToast(b[0])); checkUnlocks(); persist(); hud();
}
function once(key, msg) { if (save.shown[key]) return; save.shown[key] = true; toast(msg); persist(); }
function checkUnlocks() {
  if (save.badges.pano && save.badges.soru && save.badges.canli && !save.helperOn) { save.helperOn = true; helper.x = me.x; helper.y = me.y; once('helper', T.unlock.helper); }
  if (save.packets.length >= 5) { if (!save.badges.arsiv) award('arsiv'); once('lab', T.unlock.lab); }
  if (sametOpen()) once('samet', T.unlock.samet);
}
const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function hud() {
  const z = run ? run.z : [false, false, false], stage = run ? (run.done ? 3 : z.filter(Boolean).length) : 0;
  $('qh').textContent = T.quest[stage];
  $('qv').textContent = T.stat(save.packets.length, badgeCount());
  $('qb').style.width = (stage / 3 * 100) + '%';
  $('who').textContent = run ? T.chars[run.char].n : '';
  $('bcount').textContent = `${badgeCount()}/12`;
  document.querySelectorAll('#list button').forEach(b => { const id = b.dataset.id, i = ['kontrol', 'ofis', 'kule'].indexOf(id);
    b.classList.toggle('done', i >= 0 && z[i]); if (id === 'lab') b.firstChild.textContent = save.packets.length >= 5 ? T.places.lab : '???'; });
  $('timer').classList.toggle('on', !!(run && run.speed));
}

/* ---------------- the game loop ---------------- */
const cv = $('world'), cx = cv.getContext('2d');
let S = 3, IW = 480, IH = 300;
function size() { S = Math.max(2, Math.round(Math.min(innerWidth / 500, innerHeight / 310))); IW = Math.ceil(cv.clientWidth / S); IH = Math.ceil(cv.clientHeight / S); cv.width = IW; cv.height = IH; cx.imageSmoothingEnabled = false; }
size(); addEventListener('resize', size);
const cam = { x: P(me.x, me.y)[0], y: P(me.x, me.y)[1] - 10 };
const keys = new Set(); let started = false, dialog = null, near = null, modal = null, saveT = 0;
const inView = () => scrollY < innerHeight * .6;
const busy = () => !started || dialog || modal || $('pick').classList.contains('on');
addEventListener('keydown', e => {
  const k = e.key.toLowerCase(), onButton = e.target.closest && e.target.closest('button,a,input,label');
  if (!started && !$('pick').classList.contains('on') && $('intro')) { if (inView()) { e.preventDefault(); showPick(); } return; }
  if (k === 'escape') { if (modal) closeModal(); else close(); return; }
  if (modal || $('pick').classList.contains('on')) return;
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k) && !dialog) { keys.add(k); me.path = null; if (inView()) e.preventDefault(); }
  if ((k === 'e' || ((k === 'enter' || k === ' ') && !onButton)) && inView()) { e.preventDefault(); if (dialog) { if (!dialog.locked) close(); } else if (near) talk(near); }
});
addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
function tick(now) {
  const t = now / 1000, dt = Math.min(.05, (now - (tick.l || now)) / 1000); tick.l = now;
  const playing = started && !busy();
  if (playing) {
    let vx = 0, vy = 0;
    if (keys.has('w') || keys.has('arrowup')) { vx -= 1; vy -= 1; } if (keys.has('s') || keys.has('arrowdown')) { vx += 1; vy += 1; }
    if (keys.has('a') || keys.has('arrowleft')) { vx -= 1; vy += 1; } if (keys.has('d') || keys.has('arrowright')) { vx += 1; vy -= 1; }
    if (!vx && !vy && me.path && me.path.length) { const [tx, ty] = me.path[0], dx = tx - me.x, dy = ty - me.y, d = Math.hypot(dx, dy); if (d < .12) { me.path.shift(); if (!me.path.length && me.goal) { const g = me.goal; me.goal = null; talk(g); } } else { vx = dx / d; vy = dy / d; } }
    const L = Math.hypot(vx, vy); me.moving = L > 0;
    if (L) { vx /= L; vy /= L; const sp = 3.4 * dt, nx = me.x + vx * sp, ny = me.y + vy * sp;
      if (walk(nx, me.y) && walk(nx + Math.sign(vx) * .2, me.y)) me.x = nx; if (walk(me.x, ny) && walk(me.x, ny + Math.sign(vy) * .2)) me.y = ny;
      const sxv = vx - vy, syv = vx + vy; if (Math.abs(sxv) > .1) me.dir = sxv > 0 ? 1 : -1; me.back = syv < -.1; }
    PK.forEach((p, i) => { if (save.packets.includes(p.id) || (p.after && !run.done)) return; if (Math.hypot(p.x - me.x, p.y - me.y) < .7) { save.packets.push(p.id); persist(); openPacket(i); } });
    if (has('path') && Math.floor(me.x) + ',' + Math.floor(me.y) === GAP) award('kisayol');
    if (Math.hypot(TIP[0] - me.x, TIP[1] - me.y) < 1) award('uc');
    if (!run.done) run.el += dt;
    if ((saveT += dt) > 2) { saveT = 0; save.run = run; persist(); }
    if (run.speed) $('timer').textContent = `${T.hud.time} ${fmt(run.el)}`;
  } else me.moving = false;
  // people pace unless someone is talking to them
  NPC.forEach(n => { if (dialog && dialog.npc === n) { n.moving = false; return; } if (!started) { n.moving = false; return; }
    n.ph += dt * n.sp; const u = 1 - Math.abs(1 - 2 * (n.ph % 1)), x = n.a[0] + (n.b[0] - n.a[0]) * u, y = n.a[1] + (n.b[1] - n.a[1]) * u;
    const dx = x - n.x, dy = y - n.y; n.moving = Math.hypot(dx, dy) > .0005; if (Math.abs(dx - dy) > .0005) n.dir = dx - dy > 0 ? 1 : -1; n.back = dx + dy < -.0005; n.x = x; n.y = y; });
  if (run && run.z[1]) bots.forEach((b, i) => { if (dialog && dialog.npc === b) return; const [x, y] = loopAt(t * .025 + b.o); b.x = x; b.y = y; });
  if (run && save.helperOn) { const tx = me.x - .7 * me.dir, ty = me.y + .7; helper.x += (tx - helper.x) * .05; helper.y += (ty - helper.y) * .05; }
  near = null;
  if (started && run) { let best = 1.7;
    ST.forEach(s => { if (s.id === 'kopru' && run.bridge) return; const d = Math.hypot(s.at[0] - me.x, s.at[1] - me.y); if (d < best) { best = d; near = s; } });
    const people = NPC.concat(run.z[1] ? [bots[0]] : []);
    people.forEach(n => { const d = Math.hypot(n.x - me.x, n.y - me.y); if (d < Math.min(best, 1.3)) { best = d; near = n === bots[0] ? { id: 'robot', npc: n } : { id: n.id, npc: n }; } }); }
  const [px, py] = P(me.x, me.y); cam.x += (px - cam.x) * .08; cam.y += (py - 14 - cam.y) * .08;
  if (!RM || started || !tick.drawn) { drawWorld(cx, IW, IH, cam.x, cam.y, t); tick.drawn = true; }
  const tag = $('tag');
  if (near && started && !busy()) { const n = near.npc, at = n ? [n.x, n.y] : near.at, [sx, sy] = P(at[0], at[1], n ? 22 : 34);
    tag.innerHTML = `${nameOf(near.id)}<b>[E]</b>`; tag.style.left = (sx + IW / 2 - cam.x) * S + 'px'; tag.style.top = (sy + IH / 2 - cam.y) * S + 'px'; tag.classList.add('on'); }
  else tag.classList.remove('on');
  requestAnimationFrame(tick);
}
const nameOf = id => (T.places[id] || (T.npc[id] && T.npc[id][0]) || id);

/* click or tap a tile: walk there (breadth-first over the grid); a place or a person walks you to them */
function toWorld(e) { const r = cv.getBoundingClientRect(), ix = (e.clientX - r.left) / S - IW / 2 + cam.x, iy = (e.clientY - r.top) / S - IH / 2 + cam.y; return [(ix / 16 + iy / 8) / 2, (iy / 8 - ix / 16) / 2]; }
function route(tx, ty) {
  const sx = Math.floor(me.x), sy = Math.floor(me.y), gx = Math.floor(tx), gy = Math.floor(ty), Qu = [[sx, sy]], prev = { [sx + ',' + sy]: null };
  while (Qu.length) { const [x, y] = Qu.shift(); if (x === gx && y === gy) break; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (k in prev || !walk(nx + .5, ny + .5)) continue; prev[k] = [x, y]; Qu.push([nx, ny]); } }
  if (!((gx + ',' + gy) in prev)) return null; const out = []; let c = [gx, gy]; while (c) { out.unshift([c[0] + .5, c[1] + .5]); c = prev[c[0] + ',' + c[1]]; } out.shift(); if (out.length) out[out.length - 1] = [tx, ty]; return out;
}
function goTo(s) { const p = route(s.at[0], s.at[1]); if (p) { me.path = p; me.goal = s; if (!p.length) talk(s); } else toast(T.noWay); }
cv.addEventListener('click', e => { if (!started || modal) return; if (dialog) { if (!dialog.locked) close(); return; } const [wx, wy] = toWorld(e);
  const person = NPC.concat(run && run.z[1] ? [bots[0]] : []).find(n => Math.hypot(n.x - wx, n.y - wy) < .9);
  if (person) { const id = person === bots[0] ? 'robot' : person.id; if (Math.hypot(person.x - me.x, person.y - me.y) < 1.3) talk({ id, npc: person }); else { const p = route(person.x, person.y); if (p) { me.path = p; me.goal = { id, npc: person, at: [person.x, person.y] }; } } return; }
  const hit = ST.find(s => s.r && wx >= s.r[0] - .5 && wx <= s.r[2] + .5 && wy >= s.r[1] - .5 && wy <= s.r[3] + .5); if (hit) { goTo(hit); return; }
  if (walk(wx, wy)) { me.path = route(wx, wy); me.goal = null; } });

/* ---------------- dialogs ---------------- */
const face = $('face').getContext('2d');
let typer = null;
function say(who, text, build, opts = {}) {
  dialog = { npc: opts.npc || null, locked: !!opts.locked }; keys.clear();
  const D = $('dlg'); D.classList.add('on');
  const w = T.who[who] || [nameOf(who), ''];
  $('dn').textContent = w[0]; $('dk').textContent = w[1];
  face.clearRect(0, 0, 16, 16); face.fillStyle = '#dfe6f5'; face.fillRect(0, 0, 16, 16);
  if (who === 'robot' || who === 'yardimci') drawBot(face, 8, 16, 0); else if (opts.place) { face.fillStyle = PAL.ink; face.fillRect(3, 4, 10, 8); face.fillStyle = PAL.amber; face.fillRect(5, 6, 6, 4); }
  else drawChar(face, 8, 17, false, false, 0, (opts.npc && opts.npc.st) || STYLE[who] || STYLE.samet);
  line(text);
  const X = $('dx'); X.innerHTML = ''; if (build) build(X);
  $('dpage').textContent = run ? T.chars[run.char].n.toUpperCase() : '';
  const first = X.querySelector('button'); if (first && !TOUCH) setTimeout(() => first.focus({ preventScroll: true }), 30);
}
function line(text) {
  const el = $('dt'); clearInterval(typer);
  if (RM || (run && run.speed)) { el.textContent = text; return; }
  el.textContent = ''; let i = 0; typer = setInterval(() => { el.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(typer); }, 14);
}
function close() { if (!dialog) return; dialog = null; clearInterval(typer); $('dlg').classList.remove('on'); hud(); }
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const btn = (label, cls, fn) => { const b = el('button', cls || 'btn', label); b.type = 'button'; b.addEventListener('click', fn); return b; };
const realCard = text => el('div', 'real', `<span>${T.real}</span><p>${text}</p>`);
const doneRow = (X, then) => { const a = el('div', 'acts'); a.appendChild(btn(T.hud.next, 'btn', () => { close(); if (then) then(); })); X.appendChild(a); a.querySelector('button').focus({ preventScroll: true }); };
function talk(s) {
  if (!run) return;
  const id = s.id;
  if (s.npc) return talkNpc(id, s.npc);
  ({ kontrol: zone1, ofis: zone2, kule: zone3, atolye: atolye, sandik: sandik, kapi: kapi, lab: lab, kopru: kopru })[id]();
}
function talkNpc(id, n) {
  if (!save.talked.includes(id)) { save.talked.push(id); persist(); checkTalked(); }
  if (id === 'robot') {
    if (NIGHT) { award('gece'); }
    n.i = (n.i || 0); const lines = T.npc.robot[1], txt = NIGHT && n.i === 0 ? T.npc.robotNight : lines[n.i % lines.length]; n.i++;
    if (n.i === 3) award('robot');
    say('robot', txt, null, { npc: n }); return;
  }
  n.i = n.i || 0; const lines = T.npc[id][1]; say(id, lines[n.i % lines.length], null, { npc: n }); n.i++;
}
function checkTalked() { if (['deniz', 'ece', 'muhasebe', 'stajyer', 'yazilim', 'robot'].every(k => save.talked.includes(k))) award('sohbet'); }
const met = k => { if (!save.talked.includes(k)) { save.talked.push(k); persist(); checkTalked(); } };

/* 1 · control room: pick the four metrics that show what the robots are worth */
function zone1() {
  met('deniz');
  if (run.z[0]) return say('deniz', T.z1.after, X => { X.appendChild(realCard(T.z1.real)); });
  let mistakes = 0, good = 0;
  say('deniz', T.z1.intro, X => {
    X.appendChild(el('span', 'task', T.z1.task));
    const g = el('div', 'opts'), note = el('p', 'note');
    T.z1.opts.forEach(([label, ok, why]) => { const b = btn(`${label}<i></i>`, 'opt', () => {
      if (b.disabled) return;
      if (ok) { b.classList.add('ok'); b.disabled = true; b.querySelector('i').textContent = '✓'; good++; note.className = 'note good'; note.textContent = T.z1.right;
        if (good === 4) win(); }
      else { mistakes++; b.classList.add('bad', 'shake'); b.disabled = true; b.querySelector('i').textContent = '✗'; note.className = 'note bad'; note.textContent = why; } });
      if (!ok && has('see')) b.classList.add('dim'); g.appendChild(b); });
    X.appendChild(g); X.appendChild(note);
    function win() {
      run.z[0] = true; save.run = run; persist(); award('pano'); if (run.char === 'gozcu' && mistakes === 0) award('keskin');
      line(T.z1.done); X.innerHTML = '';
      const bars = el('div', 'bars'); T.z1.opts.filter(o => o[1]).forEach(([l], i) => bars.appendChild(el('div', '', `${l}<i><b data-w="${[82, 94, 40, 62][i]}"></b></i>`))); X.appendChild(bars);
      setTimeout(() => bars.querySelectorAll('b').forEach(b => b.style.width = b.dataset.w + '%'), 60);
      X.appendChild(realCard(T.z1.real)); doneRow(X); hud();
    }
  }, { locked: false });
}
/* 2 · process office: ask the right questions, then put the process in order */
function zone2() {
  met('ece');
  if (!run.z[0]) return say('ece', T.z2.locked);
  if (run.z[1]) return say('ece', T.z2.after, X => X.appendChild(realCard(T.z2.real)));
  const limit = has('ask') ? 4 : 3;
  say('ece', T.z2.intro, X => ask(X));
  function ask(X) {
    let left = limit; run.found = { edge: false, short: false };
    X.innerHTML = ''; X.appendChild(el('span', 'task', T.z2.task(limit)));
    const chat = el('div', 'chat'), g = el('div', 'opts one'); X.appendChild(chat); X.appendChild(g);
    const qs = T.z2.qs.concat(has('ask') ? [T.z2.extra] : []);
    qs.forEach(([q, a, flag]) => { const b = btn(q, 'opt', () => {
      if (b.disabled || !left) return; b.disabled = true; b.classList.add('used'); left--;
      chat.appendChild(el('div', 'q', q)); chat.appendChild(el('div', 'a', a));
      if (flag === 'edge' || flag === 'short') { run.found[flag] = true; chat.appendChild(el('div', 'f', T.z2.found[flag])); }
      if (!left) after(X); }); g.appendChild(b); });
  }
  function after(X) {
    X.querySelectorAll('.opt').forEach(b => { b.disabled = true; b.classList.add('used'); });
    const a = el('div', 'acts');
    if (run.found.edge || run.found.short) { a.appendChild(btn(T.z2.toSteps, 'btn', () => steps(X))); }
    else { line(T.z2.retry); a.appendChild(btn(T.z2.retryBtn, 'btn', () => { line(T.z2.intro); ask(X); })); }
    X.appendChild(a); a.querySelector('button').focus({ preventScroll: true });
  }
  function steps(X) {
    line(T.z2.stepsTask); X.innerHTML = '';
    const order = T.z2.steps.map((s, i) => i === 2 && run.found.edge ? T.z2.edgeStep : s).filter((s, i) => !(i === 4 && run.found.short));
    const list = el('ol', 'seq'), g = el('div', 'opts'), note = el('p', 'note');
    if (run.found.short) { note.className = 'note good'; note.textContent = T.z2.shortNote; }
    X.appendChild(list); X.appendChild(g); X.appendChild(note);
    let at = 0; const shuffled = order.map((s, i) => [s, i]).sort((a, b) => ((a[1] * 7 + 3) % 5) - ((b[1] * 7 + 3) % 5));
    shuffled.forEach(([s, i]) => { const b = btn(s, 'opt', () => {
      if (b.disabled) return;
      if (i === at) { at++; b.disabled = true; b.style.display = 'none'; list.appendChild(el('li', '', s)); note.className = 'note'; note.textContent = '';
        if (at === order.length) win(X); }
      else { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); note.className = 'note bad'; note.textContent = T.z2.wrongOrder; } }); g.appendChild(b); });
  }
  function win(X) {
    run.z[1] = true; save.run = run; persist(); if (run.found.edge && run.found.short) award('soru');
    line(T.z2.done); X.querySelector('.opts').remove(); const n = X.querySelector('.note'); if (n) n.remove();
    X.appendChild(realCard(T.z2.real)); doneRow(X, () => toast(T.z2.robots)); hud();
  }
}
/* 3 · portal tower: wire the business unit, portal, robot and result screen, then go live */
function zone3() {
  if (!run.z[1]) return say('ece', run.z[0] ? T.z3.locked : T.z2.locked);
  if (run.z[2]) return say('ece', T.z3.after, X => X.appendChild(realCard(T.z3.real)));
  const want = ['is', 'portal', 'robot', 'sonuc', 'is'];
  say('ece', T.z3.intro, X => {
    X.appendChild(el('span', 'task', T.z3.task));
    const chain = el('div', 'chain'), g = el('div', 'opts'), note = el('p', 'note'); let at = 0, notified = false;
    X.appendChild(chain); X.appendChild(g); X.appendChild(note);
    const nodes = ['is', 'portal', 'robot', 'sonuc'];
    nodes.forEach(k => { const b = btn(T.z3.nodes[k], 'opt', () => pickNode(k, b)); b.dataset.k = k; g.appendChild(b); });
    function pickNode(k, b) {
      if (at >= want.length) return;
      if (k === want[at]) { if (at) chain.appendChild(el('em', '', '→')); chain.appendChild(el('span', '', T.z3.nodes[k])); at++; note.className = 'note'; note.textContent = '';
        if (at === want.length) ready(); }
      else { const prev = want[at - 1]; note.className = 'note bad'; note.textContent = prev === 'is' && k === 'robot' ? T.z3.noDoor : prev === 'robot' && k === 'is' ? T.z3.noScreen : T.z3.wrong; b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); }
    }
    function ready() {
      g.querySelectorAll('.opt').forEach(b => { b.disabled = true; b.classList.add('used'); });
      const a = el('div', 'acts');
      if (has('build')) a.appendChild(btn(T.z3.notify, 'btn ghost', e => { if (notified) return; notified = true; e.currentTarget.disabled = true; chain.appendChild(el('em', '', '+')); chain.appendChild(el('span', '', T.z3.nodes.bildirim)); }));
      a.appendChild(btn(T.z3.deploy, 'btn', e => { a.querySelectorAll('button').forEach(b => b.disabled = true); deploy(); }));
      X.appendChild(a); a.querySelector('button:last-child').focus({ preventScroll: true });
    }
    function deploy() {
      const steps = T.z3.deploySteps.slice(), fast = RM || run.speed; let i = 0;
      const tickD = () => { note.className = 'note good'; note.textContent = steps[i]; i++; if (i < steps.length) setTimeout(tickD, fast ? 200 : 650); else setTimeout(win, fast ? 150 : 500); }; tickD();
    }
    function win() {
      run.z[2] = true; run.done = true; run.bridge = true; const secs = run.el;
      if (!save.finished.includes(run.char)) save.finished.push(run.char);
      if (!save.best || secs < save.best) save.best = secs; save.run = run; persist();
      award('canli'); if (secs < 180) award('hizli');
      line(T.z3.done); X.innerHTML = ''; X.appendChild(realCard(T.z3.real));
      doneRow(X, () => { toast(T.unlock.bridge); toast(T.unlock.p5); once('speed', T.unlock.speed); checkUnlocks(); finishCard(secs); }); hud();
    }
  });
}
function atolye() { say('atolye', run.z[1] ? T.atolye[1] : T.atolye[0], null, { place: true }); }
function sandik() { say('sandik', T.sandik, X => { X.innerHTML = '<div class="inv">' + [['figma', 'Figma'], ['jira', 'Jira'], ['confluence', 'Confluence'], ['monday-icon', 'Monday'], ['python', 'Python'], ['microsoft-power-bi', 'Power BI'], ['postman', 'Postman'], ['supabase', 'Supabase']].map(([f, n]) => `<span><img src="${T.root}img/icons/${f}.svg" alt=""><small>${n}</small></span>`).join('') + '<span>SQL<small>SQL</small></span><span>dbt<small>dbt</small></span></div>'; }, { place: true }); }
function kapi() {
  if (!run.done) return say('kapi', T.kapi.locked, null, { place: true });
  say('kapi', T.kapi.open, X => { const a = el('div', 'acts'); a.innerHTML = `<a class="btn" href="${T.root}${T.psyHref}" data-leave="#062a31">${T.kapi.go}</a><a class="btn ghost" href="${T.root}${T.homeHref}" data-leave="#07080b">${T.kapi.home}</a>`; X.appendChild(a); }, { place: true });
}
function lab() {
  if (save.packets.length < 5) return say('lab', T.lab.locked(save.packets.length), null, { place: true });
  openModal('labm');
}
function kopru() {
  if (run.bridge) return say('kopru', T.kopru.fixed, null, { place: true });
  if (has('build')) return say('kopru', T.kopru.broken, X => { const a = el('div', 'acts'); a.appendChild(btn(T.kopru.fix, 'btn', () => { run.bridge = true; save.run = run; persist(); award('kopru'); close(); })); X.appendChild(a); }, { place: true });
  say('kopru', T.kopru.broken + ' ' + T.kopru.mimarNo, null, { place: true });
}
function openPacket(i) { const [h, p] = T.packets[i]; toast(T.packetToast(h)); say('paket', p, X => X.appendChild(el('div', 'real', `<span>${T.archive} · ${i + 1}/5</span><p>${h}</p>`)), { place: true }); checkUnlocks(); hud(); }

/* ---------------- modals: badge book, lab, finish card ---------------- */
function openModal(id) { modal = id; $(id).classList.add('on'); close(); if (id === 'bm') fillBadges(); const b = $(id).querySelector('button'); if (b) b.focus({ preventScroll: true }); }
function closeModal() { if (!modal) return; $(modal).classList.remove('on'); modal = null; }
document.querySelectorAll('.modal').forEach(m => { m.addEventListener('click', e => { if (e.target === m) closeModal(); }); m.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', closeModal)); });
function fillBadges() {
  const g = $('bgrid'); g.innerHTML = '';
  BADGES.forEach(([id, icon, type]) => { const got = !!save.badges[id], hidden = type === 'secret' && !got, [n, how] = T.badges[id];
    g.appendChild(el('div', 'badge' + (got ? '' : ' off'), `<i>${hidden ? '❔' : icon}</i><em>${T.badgeTypes[type]}</em><b>${hidden ? T.secret : n}</b><small>${hidden ? T.secretHint : how}</small>`)); });
  $('bsub').textContent = `${badgeCount()} / 12`;
}
$('bbtn').addEventListener('click', () => { if (started) openModal('bm'); });
// lab items each say one thing
(() => { const box = $('items'), out = $('itemsay');
  T.labUI.items.forEach(([icon, name, text]) => { const b = btn(icon, '', () => { box.querySelectorAll('button').forEach(x => x.classList.remove('on')); b.classList.add('on'); out.textContent = text; }); b.setAttribute('aria-label', name); b.title = name; box.appendChild(b); }); })();
function finishCard(secs) {
  $('fstats').innerHTML = [T.chars[run.char].n, `${T.hud.time} ${fmt(secs)}`, T.stat(save.packets.length, badgeCount())].map(s => `<span>${s}</span>`).join('');
  openModal('fm');
  if (sametOpen() && !save.shown.sametMsg) { save.shown.sametMsg = true; persist(); $('fsamet').hidden = false; }
}
$('fagain').addEventListener('click', () => { closeModal(); showPick(true); });
$('fli').href = CONTACT.li; $('fmail').href = CONTACT.mail;

/* ---------------- opening: intro card, then pick who you are ---------------- */
function drawPortrait(c, ch) { const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#dfe6f5'; g.fillRect(0, 0, 16, 16); drawChar(g, 8, 16, false, false, 0, STYLE[ch]); }
function showPick(again) {
  const intro = $('intro'); if (intro) intro.remove();
  const p = $('pick'), g = $('chars'); g.innerHTML = '';
  CHARS.forEach(ch => { const locked = ch === 'samet' && !sametOpen(), c = T.chars[ch];
    const b = el('button', 'char', `<canvas width="16" height="16"></canvas><b>${locked ? '???' : c.n}</b><em>${locked ? T.pick.locked : c.tag}</em><small>${locked ? T.pick.lockHint : c.ab}</small>`); b.type = 'button';
    if (locked) b.disabled = true; else b.addEventListener('click', () => begin(ch));
    drawPortrait(b.querySelector('canvas'), ch); g.appendChild(b); });
  const cont = $('pcont'); cont.hidden = !(run && !run.done) || !!again;
  if (run && !run.done) cont.textContent = `${T.pick.cont} · ${T.chars[run.char].n} · ${run.z.filter(Boolean).length}/3`;
  $('pspeed').hidden = !save.finished.length;
  p.classList.add('on'); setTimeout(() => (cont.hidden ? g.querySelector('button:not([disabled])') : cont).focus({ preventScroll: true }), 30);
}
function begin(ch, keep) {
  if (!keep) { run = newRun(ch); run.speed = $('pspeedc').checked; me.x = 9.5; me.y = 8.5; }
  save.run = run; persist(); $('pick').classList.remove('on'); started = true;
  const intro = $('intro'); if (intro) intro.remove();
  helper.x = me.x; helper.y = me.y;
  const [px, py] = P(me.x, me.y); cam.x = px; cam.y = py - 14; checkUnlocks(); hud();
  setTimeout(() => toast(TOUCH ? T.hint.touch : T.hint.desk), 400);
}
$('pcont').addEventListener('click', () => begin(run.char, true));
$('pquick').addEventListener('click', () => begin('kasif'));
$('intro').addEventListener('click', e => { if (e.target.closest('#skipgame')) return; showPick(); });
$('intro').querySelector('.blink').textContent = TOUCH ? T.intro.startTouch : T.intro.start;
$('skipgame').addEventListener('click', e => { e.preventDefault(); $('oku').scrollIntoView({ behavior: 'smooth' }); });
const list = $('list');
['kontrol', 'ofis', 'kule', 'atolye', 'sandik', 'kapi', 'lab'].forEach(id => { const s = ST.find(x => x.id === id), b = el('button', '', `<span>${T.places[id]}</span><i>✓</i>`); b.dataset.id = id; b.type = 'button';
  b.addEventListener('click', () => { if (!started) return; close(); goTo(s); }); list.appendChild(b); });
hud();
requestAnimationFrame(tick);

/* the isometric stills in the reading part: the same world, held still, framed on one place */
const FOCUS = { kontrol: [9.8, 13.4], ofis: [4.6, 4.4], kule: [14.2, 4.6] };
document.querySelectorAll('canvas[data-still]').forEach(c => { const g = c.getContext('2d'); g.imageSmoothingEnabled = false; const [fx, fy] = FOCUS[c.dataset.still], [sx, sy] = P(fx, fy);
  const draw = t => drawWorld(g, c.width, c.height, sx, sy - 12, t, { player: false, all: true, still: true });
  draw(1.3);
  let on = false; c.addEventListener('pointerenter', () => { if (RM) return; on = true; (function loop(n) { if (!on) return; draw(n / 1000); requestAnimationFrame(loop); })(performance.now()); });
  c.addEventListener('pointerleave', () => on = false); });

// review hooks: ?play=char starts at once (?at=x,y places you), ?z=n marks the first n jobs done, ?open=id talks to a place
if (Q.has('play')) {
  const ch = CHARS.includes(Q.get('play')) ? Q.get('play') : 'kasif'; run = newRun(ch);
  if (Q.has('z')) { const n = +Q.get('z'); for (let i = 0; i < n; i++) run.z[i] = true; if (n >= 3) { run.done = true; run.bridge = true; } }
  if (Q.has('at')) { const [a, b] = Q.get('at').split(',').map(Number); me.x = a; me.y = b; }
  begin(ch, true);
  if (Q.has('open')) setTimeout(() => talk(ST.find(s => s.id === Q.get('open'))), 300);
}
})();
