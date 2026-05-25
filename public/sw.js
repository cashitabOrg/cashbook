const CACHE_NAME = 'cashbook-cache-v3';

// Basic static shell pages cached initially
const PRECACHE_ASSETS = [
  '/',
  '/favicon.ico',
  '/Logo_cashitab.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // 1. Skip non-GET requests and external API queries (such as Supabase real-time or DB calls)
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // 2. Skip hot-reloads and dev server components when running locally
  if (url.pathname.startsWith('/_next/webpack-hmr') || url.pathname.includes('hot-update')) {
    return;
  }

  // 3. For pages/documents (HTML), try the network first so they always see live updates when online.
  // Fall back to local browser cache instantly if they are offline (prevents blank screen!).
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Open cache and save a clone of the fresh page
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => {
          // Offline: try to serve the specific cached page, otherwise fallback to standard entry root '/'
          return caches.match(request).then((cachedResponse) => {
            return cachedResponse || caches.match('/');
          });
        })
    );
    return;
  }

  // 4. For static assets (JS chunks, CSS files, images, icons, local fonts), use Stale-While-Revalidate.
  // Serves cached copies immediately for speed, while silently fetching updates in the background.
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          // Suppress offline fetch failures since we already served the cached file
          return null;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Background sync support
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-queue') {
    console.log('[Service Worker] Sync event fired for offline queue');
    event.waitUntil(Promise.resolve());
  }
});
