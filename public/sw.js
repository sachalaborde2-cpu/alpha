// Cache-first + mise à jour en arrière-plan : l'app marche hors ligne (métro).
// ⚠️ À chaque nouvelle version : changer VERSION ici ET A.VERSION dans js/core.js.
// Un nouveau numéro force l'iPhone à retélécharger tous les fichiers.
const VERSION = '1.2.0';
const CACHE = 'alpha-' + VERSION;
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/app.css',
  'js/core.js', 'js/charts.js', 'js/teasers.js', 'js/social.js', 'js/app.js',
  'js/games/calc.js', 'js/games/optiver.js', 'js/games/g24.js', 'js/games/pnl.js',
  'js/games/seq.js', 'js/games/riddle.js', 'js/games/exit-bank.js', 'js/games/exit.js', 'js/games/code.js',
  'js/games/nback.js', 'js/games/span.js', 'js/games/book.js',
  'js/games/arb.js', 'js/games/switch.js', 'js/games/stroop.js',
  'js/games/proba.js', 'js/games/fair.js',
  'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png'
];

self.addEventListener('install', e => {
  // cache: 'reload' contourne le cache HTTP du navigateur pour être sûr d'avoir la nouvelle version
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
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
