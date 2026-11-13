/** Chargement paresseux des scripts vendus (UMD, pas de CDN). */

const loaded = new Map();

function script(src) {
  if (loaded.has(src)) return loaded.get(src);
  const p = new Promise((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`Impossible de charger ${src}`));
    document.head.appendChild(el);
  });
  loaded.set(src, p);
  return p;
}

export async function loadGsap() {
  if (window.gsap) return window.gsap;
  await script('./vendor/gsap.min.js');
  return window.gsap;
}

export async function loadHowler() {
  if (window.Howl) return { Howl: window.Howl, Howler: window.Howler };
  await script('./vendor/howler.min.js');
  return { Howl: window.Howl, Howler: window.Howler };
}

export async function loadLottie() {
  if (window.lottie) return window.lottie;
  await script('./vendor/lottie_light.min.js');
  return window.lottie;
}

export async function loadPhaser() {
  if (window.Phaser && window.rexflipplugin && window.rextexttypingplugin) {
    return window.Phaser;
  }
  await script('./vendor/phaser.min.js');
  await Promise.all([
    script('./vendor/rexflipplugin.min.js'),
    script('./vendor/rextexttypingplugin.min.js'),
  ]);
  return window.Phaser;
}

export function prefetchPhaser() {
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 600));
  idle(() => {
    loadPhaser().catch(() => undefined);
  });
}
