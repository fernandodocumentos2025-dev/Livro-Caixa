// Minimal Service Worker for PWA Installability
// Strategy: Network Only (No Caching of dynamic data as requested)

const CACHE_NAME = 'livro-caixa-v1-static';

// Install event - takes control immediately
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Activate event - claims clients immediately
self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

// Fetch event - pure pass-through (Network Only)
// Chrome requires a fetch handler for the app to be installable
self.addEventListener('fetch', (event) => {
    event.respondWith(fetch(event.request));
});
