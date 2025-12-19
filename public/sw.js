const CACHE_NAME = 'word-union-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/vite.svg'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => response || fetch(event.request))
    );
});
