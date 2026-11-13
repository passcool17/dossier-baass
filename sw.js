/* Service worker versionné — change CACHE pour invalider l’ancien cache. */
const CACHE = 'baass-v3';
const ASSETS = [
  './',
  './index.html',
  './style.css?v=baass-v3',
  './js/main.js?v=baass-v3',
  './js/ui.js',
  './js/engine.js',
  './js/data.js',
  './js/save.js',
  './js/audio.js',
  './js/quotes.js',
  './js/sim.js',
  './js/art.js',
  './js/fx.js',
  './js/board.js',
  './js/vendor-load.js',
  './vendor/phaser.min.js',
  './vendor/rexflipplugin.min.js',
  './vendor/rextexttypingplugin.min.js',
  './vendor/gsap.min.js',
  './vendor/howler.min.js',
  './vendor/lottie_light.min.js',
  './assets/textures/paper.webp',
  './assets/textures/desk.webp',
  './assets/textures/grain.webp',
  './assets/lottie/stamp-classifie.json',
  './assets/audio/room.mp3',
  './assets/audio/pad.mp3',
  './assets/art-incoming/present.json',
  './assets/art-incoming/paper.webp',
  './assets/art-incoming/desk.webp',
  './assets/art-incoming/card-frame.webp',
  './assets/art-incoming/loc-dia.webp',
  './assets/art-incoming/loc-labs.webp',
  './assets/art-incoming/loc-archives.webp',
  './assets/art-incoming/loc-roswell.webp',
  './assets/art-incoming/loc-campus.webp',
  './assets/art-incoming/loc-field.webp',
  './assets/art-incoming/loc-northern.webp',
  './assets/art-incoming/loc-colares.webp',
  './assets/art-incoming/inv-lea.webp',
  './assets/art-incoming/inv-marc-olivier.webp',
  './assets/art-incoming/inv-sofia.webp',
  './assets/art-incoming/inv-emile.webp',
  './assets/art-incoming/stamp-classified.webp',
  './assets/art-incoming/stamp-classifie.webp',
  './assets/art-incoming/stamp-redacted.webp',
  './assets/art-incoming/stamp-caviarde.webp',
  './assets/art-incoming/stamp-plan-not-proof.webp',
  './assets/art-incoming/stamp-plan.webp',
  './assets/art-incoming/stamp-pas-preuve.webp',
  './assets/art-incoming/icon-dice.svg',
  './assets/art-incoming/icon-evidence.svg',
  './assets/art-incoming/icon-move.svg',
  './assets/art-incoming/icon-rest.svg',
  './assets/art-incoming/icon-search.svg',
  './assets/art-incoming/icon-secrecy.svg',
  './assets/art-incoming/icon-suspicion.svg',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './manifest.webmanifest',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.all(ASSETS.map((url) => cache.add(url).catch(() => undefined)));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches
          .match(req, { ignoreSearch: req.mode === 'navigate' })
          .then((r) => r || caches.match('./index.html')),
      ),
  );
});
