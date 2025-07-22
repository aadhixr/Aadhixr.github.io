// A more robust service worker
const CACHE_NAME = "beehive-monitor-v1";
const urlsToCache = [
  "/",
  "/index.html",
  "/history.html",
  "/manifest.json",
  "/favicon.jpg",
  "/icons/icon-192.jpg",
  "/icons/icon-512.jpg",
  "https://cdn.jsdelivr.net/npm/chart.js@3",
  "https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@1.2.1",
  "https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js",
  "https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js"
];

// Install the service worker and cache the app shell
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Caching app shell");
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate the service worker and clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log("Service Worker: Deleting old cache", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Intercept fetch requests and serve from cache first
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // If the request is in the cache, return it
      if (response) {
        return response;
      }
      // Otherwise, fetch from the network
      return fetch(event.request);
    })
  );
});
