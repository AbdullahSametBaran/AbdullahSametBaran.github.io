// Shared by the twelve sub-page studies: arriving on the colour the home page left behind, and leaving the same way.
// Links with data-leave="#colour" fade the page into that colour and open their href on it.
window.sub = {
  arrive() {
    let g = null; try { g = sessionStorage.getItem('arrive'); sessionStorage.removeItem('arrive'); } catch (e) {}
    if (!g) return false;
    const o = document.createElement('div');
    o.style.cssText = `position:fixed;inset:0;z-index:9999;background:${g};pointer-events:none`;
    document.body.appendChild(o);
    gsap.to(o, { opacity: 0, duration: 1, delay: .15, ease: 'power2.inOut', onComplete: () => o.remove() });
    return true;
  },
  leave(url, col) {
    try { sessionStorage.setItem('arrive', col); } catch (e) {}
    if (window.lenis) lenis.stop();
    const o = document.createElement('div'); o.dataset.subFade = '';
    o.style.cssText = `position:fixed;inset:0;z-index:9999;background:${col};opacity:0;pointer-events:none`;
    document.body.appendChild(o);
    gsap.to(o, { opacity: 1, duration: .55, ease: 'power2.in', onComplete: () => location.href = url });
  }
};
// back to a page the browser kept in its cache: it would still be covered by the colour it left on, so lift it
addEventListener('pageshow', e => { if (!e.persisted) return; document.querySelectorAll('[data-sub-fade]').forEach(o => o.remove()); if (window.lenis) lenis.start(); });
document.addEventListener('click', e => {
  const a = e.target.closest('[data-leave]'); if (!a) return;
  // Ctrl/Cmd/Shift/Alt-click (new tab, new window, download) keeps the browser's own behaviour
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  e.preventDefault(); sub.leave(a.getAttribute('href'), a.dataset.leave);
});
// On touch screens, words written for a mouse ("hover", "click", "WASD") give way to their data-touch version.
if (matchMedia('(hover: none)').matches) document.querySelectorAll('[data-touch]').forEach(e => e.textContent = e.dataset.touch);
