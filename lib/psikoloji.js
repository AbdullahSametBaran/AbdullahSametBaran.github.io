/* psychology page: the Stroop experiment and the request form. Text comes from window.PT (one per language). */
(() => {
const PT = window.PT, $ = s => document.querySelector(s);

/* ---- Stroop: name the ink, not the word. Round one the two agree, round two they don't. ---- */
const S = $('#stroop'); if (S) {
  const C = PT.colors;                    // [[word, css colour], ...]
  const word = S.querySelector('.word'), picks = S.querySelector('.picks'), res = S.querySelector('.res'), cnt = S.querySelector('.cnt'), go = S.querySelector('.go');
  const N = 6; let trials = [], i = 0, t0 = 0, times = [[], []], errs = 0, live = false;
  C.forEach(([w, col], k) => { const b = document.createElement('button'); b.type = 'button'; b.innerHTML = `<i style="background:${col}"></i>${w}<kbd>${k + 1}</kbd>`; b.disabled = true; b.addEventListener('click', () => answer(k)); picks.appendChild(b); });
  const pick = n => Math.floor(Math.random() * n);
  function build() {
    trials = []; let last = -1;
    for (let r = 0; r < 2; r++) for (let j = 0; j < N; j++) { let ink; do ink = pick(C.length); while (ink === last); last = ink;
      let w = ink; if (r === 1) do w = pick(C.length); while (w === ink); trials.push({ r, ink, w }); }
  }
  function start() { build(); i = 0; times = [[], []]; errs = 0; live = true; res.innerHTML = ''; go.hidden = true; picks.querySelectorAll('button').forEach(b => b.disabled = false); show(); }
  function show() {
    const t = trials[i]; word.classList.remove('idle'); word.textContent = C[t.w][0]; word.style.color = C[t.ink][1];
    cnt.textContent = `${t.r ? PT.round2 : PT.round1} · ${i % N + 1}/${N}`; t0 = performance.now();
  }
  function answer(k) {
    if (!live) return; const t = trials[i];
    if (k !== t.ink) { errs++; picks.classList.remove('flash-bad'); void picks.offsetWidth; picks.classList.add('flash-bad'); return; }
    times[t.r].push(performance.now() - t0); i++;
    if (i === N) { word.classList.add('idle'); word.style.color = ''; word.textContent = PT.between; live = false; setTimeout(() => { live = true; show(); }, 1400); return; }
    if (i < trials.length) show(); else done();
  }
  function done() {
    live = false; picks.querySelectorAll('button').forEach(b => b.disabled = true);
    const avg = a => a.reduce((x, y) => x + y, 0) / a.length, a1 = avg(times[0]), a2 = avg(times[1]), d = Math.round(a2 - a1);
    word.classList.add('idle'); word.style.color = ''; word.textContent = PT.doneWord;
    res.innerHTML = `<p>${PT.result(Math.round(a1), Math.round(a2), errs)}</p>${d > 0 ? PT.slower(d) : PT.faster}<p style="margin-top:10px">${PT.explain}</p>`;
    go.textContent = PT.again; go.hidden = false; cnt.textContent = PT.finished;
  }
  go.addEventListener('click', start);
  addEventListener('keydown', e => { if (!live) return; const n = +e.key; if (n >= 1 && n <= C.length) { const r = S.getBoundingClientRect(); if (r.top < innerHeight && r.bottom > 0) { e.preventDefault(); answer(n - 1); } } });
}

/* ---- the pop-up: every [data-book] button opens the dialog that holds the form ---- */
const D = $("#bookd"); if (D) {
  const open = () => { if (D.open) return; if (window.lenis) lenis.stop(); D.showModal(); const first = D.querySelector("input[name=ad]"); if (first && !matchMedia("(hover: none)").matches) first.focus(); };
  const shut = () => { if (D.open) D.close(); };
  document.querySelectorAll("[data-book]").forEach(b => b.addEventListener("click", open));
  D.querySelector("[data-close-book]").addEventListener("click", shut);
  D.addEventListener("click", e => { if (e.target === D) shut(); });          // a click on the dimmed backdrop closes it
  D.addEventListener("close", () => { if (window.lenis) lenis.start(); });
  if (location.hash === "#randevu") setTimeout(open, 400);                     // links to #randevu open the form directly
}

/* ---- the request form: posted to the owner's Google Form, whose responses land in a Google Sheet ----
   Google answers cross-site posts opaquely, so a sent request can't be confirmed; a network failure still throws. */
const GFORM = 'https://docs.google.com/forms/d/e/1FAIpQLSeh8qnWiH7TgHaWWfJOZQIYxkYUKvoqBkjpkEKK4_FOMtnmyw/formResponse';
const ENTRY = { ad: 'entry.1949224928', email: 'entry.1279398488', tel: 'entry.425408508', dil: 'entry.355999713', zaman: 'entry.1877002178', onay: 'entry.324250308', sayfa: 'entry.1218683542', not: 'entry.1270289735' };
const F = $('#bookf'); if (F) {
  const msg = F.querySelector('.fmsg'), btn = F.querySelector('button[type=submit]');
  F.addEventListener('submit', async e => {
    e.preventDefault(); msg.className = 'fmsg'; msg.textContent = '';
    if (!F.reportValidity()) return;
    const d = new FormData(F);
    if (d.get('botcheck')) return;                                                // the hidden box only bots tick
    const body = new URLSearchParams({
      [ENTRY.ad]: d.get('ad'), [ENTRY.email]: d.get('email'), [ENTRY.tel]: d.get('tel') || '', [ENTRY.dil]: d.get('dil'),
      [ENTRY.zaman]: d.getAll('zaman').join(', '), [ENTRY.not]: d.get('not') || '', [ENTRY.onay]: PT.consent, [ENTRY.sayfa]: location.pathname });
    btn.disabled = true; btn.textContent = PT.sending;
    try {
      await fetch(GFORM, { method: 'POST', mode: 'no-cors', body });
      F.reset(); msg.className = 'fmsg ok'; msg.textContent = PT.thanks;
    } catch (err) { msg.className = 'fmsg err'; msg.textContent = PT.failed; }
    btn.disabled = false; btn.textContent = PT.send;
  });
}
})();
