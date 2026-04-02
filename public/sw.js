const CACHE_NAME = 'frozenpos-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch (can be enhanced with Workbox for robust asset caching)
  return;
});

// Background sync support
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-queue') {
    console.log('[Service Worker] Sync event fired for offline queue');
    // We let the EngineService handle the actual sync via window event listeners,
    // but in a more isolated setup, we'd import db and supabase here directly.
    event.waitUntil(Promise.resolve());
  }
});
