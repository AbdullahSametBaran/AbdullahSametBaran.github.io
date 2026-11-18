// "Oyuna gir": the island game opens out of the element that was clicked, fills the screen, and closes back into it.
window.arcade = {
  open(from, src = '../oyun/index.html?embed=1') {
    if (document.getElementById('arcade')) return;
    if (window.lenis) lenis.stop();
    const en = document.documentElement.lang === 'en', T = en ? ['System Island game', 'Exit the game'] : ['Sistem adası oyunu', 'Oyundan çık'];
    const r = from.getBoundingClientRect();
    const o = document.createElement('div'); o.id = 'arcade';
    o.style.cssText = `position:fixed;z-index:9000;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;background:#0b1430;overflow:hidden;border-radius:14px`;
    o.innerHTML = `<iframe src="${src}" title="${T[0]}" style="position:absolute;inset:0;width:100%;height:100%;border:0;opacity:0" allow="fullscreen"></iframe>
      <button type="button" aria-label="${T[1]}" style="position:absolute;z-index:2;left:50%;bottom:18px;transform:translateX(-50%);padding:9px 16px;background:#f1ead8;color:#0b1430;border:3px solid #0b1430;box-shadow:4px 4px 0 #0b1430;font:16px 'Pixelify Sans',monospace;cursor:pointer;opacity:0">✕ ${T[1]}</button>`;
    document.body.appendChild(o);
    const fr = o.querySelector('iframe'), bt = o.querySelector('button');
    // reduced motion: the window is simply there (the same steps, run at once)
    const fast = window.reduceMotion || matchMedia('(prefers-reduced-motion: reduce)').matches ? 100 : 1;
    gsap.timeline().timeScale(fast)
      .to(o, { left: 0, top: 0, width: innerWidth, height: innerHeight, borderRadius: 0, duration: .8, ease: 'expo.inOut' })
      .to(fr, { opacity: 1, duration: .4 }, .55).to(bt, { opacity: 1, duration: .3 }, .8)
      .add(() => fr.focus(), .8);
    const close = () => { const q = from.getBoundingClientRect();
      gsap.timeline({ onComplete: () => { o.remove(); if (window.lenis) lenis.start(); } }).timeScale(fast)
        .to([fr, bt], { opacity: 0, duration: .25 })
        .to(o, { left: q.left, top: q.top, width: q.width, height: q.height, borderRadius: 14, duration: .7, ease: 'expo.inOut' }, .1)
        .to(o, { opacity: 0, duration: .2 }); removeEventListener('keydown', esc); };
    const esc = e => { if (e.key === 'Escape') close(); };
    bt.addEventListener('click', close); addEventListener('keydown', esc);
  },
  // a door inside the game (the psychology door, "home") leads this page away, not the game's frame: the exit button
  // goes at once and the whole page fades into the next one, so the game never ends up showing another page inside it
  leave(url, col) {
    const o = document.getElementById('arcade'), bt = o && o.querySelector('button');
    if (bt) bt.style.visibility = 'hidden';
    if (window.sub) sub.leave(url, col); else location.href = url;
  }
};
// back from that page (browser cache): the game is closed again
addEventListener('pageshow', e => { if (!e.persisted) return; const o = document.getElementById('arcade'); if (o) { o.remove(); if (window.lenis) lenis.start(); } });
