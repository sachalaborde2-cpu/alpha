// Cache-first + mise à jour en arrière-plan : l'app marche hors ligne (métro)
// et récupère la nouvelle version au lancement suivant.
const CACHE = 'alpha-v1';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/core.js', 'js/charts.js', 'js/teasers.js', 'js/app.js',
  'js/games/calc.js', 'js/games/optiver.js', 'js/games/g24.js', 'js/games/seq.js',
  'js/games/riddle.js', 'js/games/exit-bank.js', 'js/games/exit.js', 'js/games/nback.js', 'js/games/span.js',
  'js/games/arb.js', 'js/games/switch.js', 'js/games/proba.js',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.open(CACHE).then(async cache => {
    const hit = await cache.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request).then(res => {
      if (res.ok && new URL(e.request.url).origin === location.origin) cache.put(e.request, res.clone());
      return res;
    }).catch(() => hit);
    return hit || net;
  }));
});
