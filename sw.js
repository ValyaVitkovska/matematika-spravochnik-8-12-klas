/* Service worker — кешира ресурсите за офлайн работа и прави сайта инсталируем.
   Смени номера на версията, за да принудиш обновяване след промени. */
const CACHE = 'spravochnik-v7';
const CORE = [
  './',
  './index.html',
  './style.css',
  './data.js',
  './app.js',
  './manifest.json',
  './home-hero.jpg',
  './logo-full.png',
  './logo-mark.png',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon-64.png',
  'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/katex.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/KaTeX/0.16.9/contrib/auto-render.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      // добавяме поединично, за да не пропадне цялото кеширане при един недостъпен CDN файл
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
  // навигациите (HTML): мрежа с резервен кеш → работи офлайн
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }
  // останалите: кеш най-напред, после мрежа (и допълва кеша)
  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => hit))
  );
});
