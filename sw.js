/* ============================================================
   I'd Tap That – Service Worker
   Caches all app assets for offline-first PWA support.
   ============================================================ */

const CACHE_NAME = 'idtapthat-v1';
const PRECACHE   = ['/', '/index.html', '/manifest.json', '/sw.js'];

/* Install: precache core assets */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

/* Activate: remove old caches */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

/* Fetch: cache-first for same-origin; network-first for Scryfall API */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Let Scryfall API calls go straight to network (card art, card data)
  if (url.hostname === 'api.scryfall.com' || url.hostname === 'cards.scryfall.io') {
    event.respondWith(fetch(event.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  // Cache-first for everything else
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request)
        .then(response => {
          // Only cache successful same-origin responses
          if (response.ok && url.origin === self.location.origin) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match('/index.html'));
    })
  );
});
