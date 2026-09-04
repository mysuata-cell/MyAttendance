const CACHE_NAME = 'school-app-v1';

// ដំឡើង Service Worker
self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  return self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // បញ្ជូន Request ទៅ Network ធម្មតា
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});