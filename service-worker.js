// Import and Initialize Firebase Messaging
// Use the same Firebase SDK version as in your HTML
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js'); // ADDED FCM SDK

// Your Firebase project configuration (same as in index.html) - NOW WITH YOUR ACTUAL VALUES
const firebaseConfig = {
    apiKey: "AIzaSyD4M_ZOMqR9MtSkbgH2SQQvj2QSAFKLOhU",
    authDomain: "beehive-d31e3.firebaseapp.com",
    databaseURL: "https://beehive-d31e3-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "beehive-d31e3",
    storageBucket: "beehive-d31e3.firebasestorage.app",
    messagingSenderId: "412298384436",
    appId: "1:412298384436:web:469569b024f27482456661",
    measurementId: "G-P6FF4EJC3K"
};

// Initialize Firebase App in the Service Worker
firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging(); // Initialize messaging service

// --- Handle background messages ---
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.notification.title || 'Beehive Alert';
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icons/icon-192.png', // Path to your app icon (MUST be PNG if manifest says so, or update here)
        // Add more options as needed, e.g., image, actions, vibrate
        // vibrate: [200, 100, 200],
        // badge: '/icons/badge.png', // Optional: for Android badges
        data: {
            url: payload.notification.click_action || 'https://YOUR_FIREBASE_HOSTING_DOMAIN/index.html' // Fallback URL
        }
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Optional: Handle notification clicks (e.g., open a specific page)
self.addEventListener('notificationclick', (event) => {
    event.notification.close(); // Close the notification

    const click_action = event.notification.data.url;
    if (click_action) {
        event.waitUntil(
            clients.openWindow(click_action)
        );
    }
});


// --- Your existing caching strategy ---
const CACHE_NAME = "beehive-monitor-v2"; // Increment version if you change cached content
const urlsToCache = [
  "/",
  "/index.html",
  "/history.html",
  "/manifest.json",
  "/favicon.jpg", // Assuming this is correct
  "/icons/icon-192.png", // Assuming these are now .png
  "/icons/icon-512.png", // Assuming these are now .png
  "/alert.mp3", // Add your audio file to cache
  "https://cdn.jsdelivr.net/npm/chart.js@3",
  "https://cdn.jsdelivr.net/npm/chartjs-plugin-zoom@1.2.1",
  "https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js",
  "https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js",
  "https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js" // ADDED messaging SDK to cache
];

// Install the service worker and cache the app shell
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Caching app shell");
      return cache.addAll(urlsToCache).catch(error => {
        console.error("Service Worker: Failed to cache some URLs:", error);
      });
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
      return response || fetch(event.request);
    })
  );
});
