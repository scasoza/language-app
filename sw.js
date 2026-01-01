/**
 * LinguaFlow Service Worker
 * Enables offline functionality and caching
 */

const CACHE_NAME = 'linguaflow-v1';
const STATIC_CACHE = 'linguaflow-static-v1';
const DYNAMIC_CACHE = 'linguaflow-dynamic-v1';

// Files to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/js/app.js',
  '/js/data.js',
  '/js/gemini-service.js',
  '/js/screens/onboarding.js',
  '/js/screens/home.js',
  '/js/screens/collections.js',
  '/js/screens/add-word.js',
  '/js/screens/study.js',
  '/js/screens/dialogue-settings.js',
  '/js/screens/dialogue-practice.js',
  '/js/screens/settings.js',
  '/manifest.json'
];

// External resources to cache
const EXTERNAL_ASSETS = [
  'https://cdn.tailwindcss.com?plugins=forms,container-queries',
  'https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700&family=Noto+Sans:wght@400;500;700&display=swap',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');

  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Cache external assets separately (may fail due to CORS)
        return caches.open(DYNAMIC_CACHE)
          .then((cache) => {
            return Promise.allSettled(
              EXTERNAL_ASSETS.map(url =>
                cache.add(url).catch(err => console.log('[SW] Failed to cache:', url))
              )
            );
          });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Gemini API requests (always need fresh data)
  if (url.hostname.includes('generativelanguage.googleapis.com')) {
    return;
  }

  // For navigation requests, try network first then cache
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the new version
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then((response) => response || caches.match('/index.html'));
        })
    );
    return;
  }

  // For other requests, try cache first then network
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version and update cache in background
          fetch(request)
            .then((response) => {
              if (response.ok) {
                caches.open(DYNAMIC_CACHE)
                  .then((cache) => cache.put(request, response));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            // Cache successful responses
            if (response.ok && response.type === 'basic') {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE)
                .then((cache) => cache.put(request, responseClone));
            }
            return response;
          })
          .catch((error) => {
            console.log('[SW] Fetch failed:', error);
            // Return offline fallback for images
            if (request.destination === 'image') {
              return new Response(
                '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="#1a3528" width="100" height="100"/><text fill="#0df280" x="50%" y="50%" text-anchor="middle" dy=".3em" font-size="12">Offline</text></svg>',
                { headers: { 'Content-Type': 'image/svg+xml' } }
              );
            }
            throw error;
          });
      })
  );
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames.map((name) => caches.delete(name)));
    });
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Placeholder for syncing offline data when back online
  console.log('[SW] Syncing data...');
}
