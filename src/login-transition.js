(() => {
  if (window.shcNavigateToLogin) {
    window.dispatchEvent(new Event('shc:login-transition-ready'));
    return;
  }

  const transitionKey = 'shc.external-login-transition';
  let active = false;

  const ensureOverlay = () => {
    let overlay = document.getElementById('shc-login-transition');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'shc-login-transition';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483646;overflow:hidden;opacity:0;visibility:hidden;pointer-events:none';
    overlay.innerHTML = `
      <svg viewBox="0 0 1316 664" preserveAspectRatio="xMidYMid slice" style="position:absolute;top:50%;left:50%;width:115%;height:115%;overflow:visible;transform:translate(-50%,-50%) scale(1.35)">
        <path pathLength="1" d="M13.4746 291.27C13.4746 291.27 100.646 -18.6724 255.617 16.8418C410.588 52.356 61.0296 431.197 233.017 546.326C431.659 679.299 444.494 21.0125 652.73 100.784C860.967 180.556 468.663 430.709 617.216 546.326C765.769 661.944 819.097 48.2722 988.501 120.156C1174.21 198.957 809.424 543.841 988.501 636.726C1189.37 740.915 1301.67 149.213 1301.67 149.213" fill="none" stroke="#D8B568" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="stroke-dasharray:1;stroke-dashoffset:1"/>
      </svg>`;
    document.body.appendChild(overlay);
    return overlay;
  };

  window.shcNavigateToLogin = (target, { replace = false } = {}) => {
    if (active) return;
    if (!document.body) {
      window.addEventListener('DOMContentLoaded', () => window.shcNavigateToLogin(target, { replace }), { once: true });
      return;
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.location[replace ? 'replace' : 'assign'](target);
      return;
    }

    active = true;
    const overlay = ensureOverlay();
    const path = overlay.querySelector('path');
    overlay.style.visibility = 'visible';

    overlay.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: 500, easing: 'ease-in-out', fill: 'forwards' },
    );
    path.animate(
      [
        { strokeDashoffset: 1, strokeWidth: 2 },
        { strokeDashoffset: 0, strokeWidth: 300 },
      ],
      { duration: 1500, easing: 'cubic-bezier(.45,0,.55,1)', fill: 'forwards' },
    );

    window.setTimeout(() => {
      try { sessionStorage.setItem(transitionKey, 'forward'); } catch (_) {}
      window.location[replace ? 'replace' : 'assign'](target);
    }, 1500);
  };

  window.dispatchEvent(new Event('shc:login-transition-ready'));
})();
