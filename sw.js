/* Service worker — мрежа-първо за приложните файлове (за да се виждат обновленията веднага),
   кеш-първо за изображения и KaTeX (офлайн работа). Смени версията при промяна на CORE. */
const CACHE = 'spravochnik-v10';
const CORE = [
  './', './index.html', './style.css', './data.js', './app.js', './manifest.json',
  './home-hero.jpg', './logo-full.png', './logo-mark.png',
  './icon-192.png', './icon-512.png', './apple-touch-icon.png', './favicon-64.png',
  'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.allSettled(CORE.map(u => c.add(new Request(u, { mode: 'no-cors' }))))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  // Приложни файлове (HTML/JS/CSS от нашия сайт): МРЕЖА най-напред → обновленията се виждат веднага онлайн
  const isAppAsset = req.mode === 'navigate' || (sameOrigin && /\.(html|js|css)$/.test(url.pathname));
  if (isAppAsset) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then(hit => hit || caches.match('./index.html')))
    );
    return;
  }
  // Изображения и KaTeX CDN: кеш най-напред (пестят трафик и работят офлайн)
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => hit))
  );
});
