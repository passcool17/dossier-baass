import { loadGsap, loadLottie } from './vendor-load.js';

export function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

async function gsapOrNull() {
  if (prefersReducedMotion()) return null;
  try {
    return await loadGsap();
  } catch {
    return null;
  }
}

export async function slideIn(el, opts = {}) {
  if (!el) return;
  const g = await gsapOrNull();
  if (!g) return;
  g.fromTo(
    el,
    { y: opts.fromY ?? 28, opacity: 0 },
    { y: 0, opacity: 1, duration: opts.duration ?? 0.38, ease: 'power3.out' },
  );
}

export async function pulse(el) {
  if (!el) return;
  const g = await gsapOrNull();
  if (!g) return;
  g.fromTo(
    el,
    { filter: 'brightness(1)' },
    { filter: 'brightness(1.45)', duration: 0.18, yoyo: true, repeat: 3, ease: 'sine.inOut' },
  );
}

export async function shake(el) {
  if (!el) return;
  const g = await gsapOrNull();
  if (!g) return;
  g.fromTo(el, { x: 0 }, { x: 5, duration: 0.05, yoyo: true, repeat: 7, ease: 'power1.inOut', clearProps: 'x' });
}

export async function slamStamp(el) {
  if (!el) return;
  const g = await gsapOrNull();
  if (!g) {
    el.style.opacity = '1';
    el.style.transform = 'rotate(-8deg) scale(1)';
    return;
  }
  g.fromTo(
    el,
    { scale: 2.1, opacity: 0, rotate: -22 },
    { scale: 1, opacity: 1, rotate: -8, duration: 0.38, ease: 'back.out(2.2)' },
  );
}

export async function rollDice(els) {
  const list = Array.from(els || []);
  const g = await gsapOrNull();
  if (!g) return;
  list.forEach((el, i) => {
    g.fromTo(
      el,
      { rotate: -18, y: -12 },
      { rotate: 0, y: 0, duration: 0.45, ease: 'bounce.out', delay: i * 0.08 },
    );
  });
}

/** Petite animation Lottie (tampon), originale, ou rien si réduit / échec. */
export async function playLottieStamp(container, jsonUrl = './assets/lottie/stamp-classifie.json') {
  if (!container || prefersReducedMotion()) return null;
  try {
    const lottie = await loadLottie();
    const anim = lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop: false,
      autoplay: true,
      path: jsonUrl,
    });
    return anim;
  } catch {
    return null;
  }
}
