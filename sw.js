
const CACHE_NAME = 'flashlearn-v1';
const ASSETS = [
  'index.html',
  'manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use relative paths to ensure it works in subfolders
      return cache.addAll(ASSETS.map(asset => {
        const url = new URL(asset, self.location.href);
        return url.pathname;
      }));
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
