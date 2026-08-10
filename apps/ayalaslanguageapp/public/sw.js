// public/sw.js
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Install');
});

self.addEventListener('fetch', (e) => {
  // A fetch handler is required for the PWA to be considered "installable"
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});