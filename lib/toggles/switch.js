// The side switch at the end of each page: only the toggle (from https://zerowing.in/toggles/) is the control,
// the line under it just points up at it. Turning it on plays the toggle's whole animation, then leaves through the colour fade.
(() => {
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
// when each toggle has finished: read from the element's own animation state
const settled = {
  'TG-TIDE': t => !t.anim && !t.leap,                                                   // the wave has rolled and the fish has landed
  'TG-ARCREACTOR': t => !t.run && t.q === 1 && performance.now() - (t.hudT0 || 0) > 900   // fully charged and the ring has drawn
};
document.querySelectorAll('[data-switch]').forEach(box => {
  const t = box.querySelector('tg-tide, tg-arcreactor'), href = box.dataset.href, col = box.dataset.fade;   // not data-leave: sub.js treats any [data-leave] click as a link
  if (!t || !href) return;
  const done = settled[t.tagName];
  let going = false;
  const leave = () => window.sub ? sub.leave(href, col) : (location.href = href);
  const go = () => {
    if (going) return; going = true;
    if (RM || !done) { setTimeout(leave, RM ? 250 : 2600); return; }
    const t0 = performance.now();
    (function wait() {
      const el = performance.now() - t0;
      // a short beat after it settles; never sooner than 0.8 s, never longer than 6 s
      if ((el > 800 && done(t)) || el > 6000) setTimeout(leave, 250); else setTimeout(wait, 50);
    })();
  };
  t.addEventListener('change', e => { if (e.detail.checked) go(); });
  // the toggle draws no focus or keys of its own: Tab reaches it, Enter or Space turns it on
  t.tabIndex = 0;
  t.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!t.checked) t.checked = true; } });
  // coming back with the browser's back button: the switch is off again
  addEventListener('pageshow', e => { if (e.persisted) { going = false; t.checked = false; } });
});
})();
