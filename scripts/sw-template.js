// Service worker атласа. Файл собирается при сборке (vite.config.ts → pwa()): подставляются версия и список файлов.
// Стратегия: страница — сначала сеть (чтобы обновления приходили сразу), без сети — из кэша;
// файлы с хешем в имени (/assets/…), шрифты, планы, иконки — из кэша (они не меняются).
const VERSION = '__VERSION__';
const CACHE = `rose-atlas-${VERSION}`;
const PRECACHE = __PRECACHE__;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith('rose-atlas-') && k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

// Страница сообщает «обновить сейчас» — новая версия начинает работать без закрытия вкладок.
self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
  // «эта страница уже из новой версии?» — тогда обновление применяется молча, без плашки
  if (event.data && event.data.type === 'has' && event.ports[0])
    event.ports[0].postMessage(PRECACHE.includes(event.data.url));
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    // Разделы атласа адресуются через #, поэтому любая страница — это «/».
    // Ошибка сервера (например, во время деплоя) или нет сети — показываем сохранённую страницу.
    const fromCache = (fallback) => caches.match('/').then((hit) => hit || fallback || Response.error());
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (!res.ok || res.type === 'opaqueredirect') return fromCache(res);
          if (!res.redirected) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put('/', copy));
          }
          return res;
        })
        .catch(() => fromCache()),
    );
    return;
  }

  event.respondWith(
    caches.match(req, { ignoreSearch: true }).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok && url.pathname.startsWith('/assets/')) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
