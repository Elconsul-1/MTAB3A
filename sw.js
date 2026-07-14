const CACHE_NAME = 'mtab3a-cache-v3';
const ASSETS = ['./', './index_17.html', './manifest.json', './icon.svg', './icon-maskable.svg'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(
        ASSETS.map(url => cache.add(url).catch(err => {
          console.warn('sw: failed to cache', url, err);
        }))
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request).then(res => res || caches.match('./index.html'))
    )
  );
});
