/* psychology page: the request form. Text comes from window.PT (one per language). */
(() => {
const PT = window.PT, $ = s => document.querySelector(s);

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
      [ENTRY.ad]: d.get('ad'), [ENTRY.email]: d.get('email') || '', [ENTRY.tel]: d.get('tel'), [ENTRY.dil]: d.get('dil'),
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
