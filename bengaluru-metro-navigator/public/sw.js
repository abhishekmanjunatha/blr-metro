const CACHE_NAME = 'namma-metro-v1';
const BASE = self.location.pathname.replace(/\/sw\.js$/, '');
const STATIC_ASSETS = [
  BASE + '/',
  BASE + '/index.html',
  BASE + '/manifest.json',
  BASE + '/favicon.svg',
  BASE + '/data/stations.json',
  BASE + '/data/attractions.json',
  BASE + '/data/fares.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // For navigation requests (HTML pages), try network first
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the new response
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(request).then((response) => {
            return response || caches.match('/');
          });
        })
    );
    return;
  }

  // For static assets, try cache first
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/data/') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version but update in background
          fetch(request)
            .then((response) => {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, response);
              });
            })
            .catch(() => {});
          return cachedResponse;
        }

        // Not in cache, fetch from network
        return fetch(request).then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }

  // For other requests, try network first
  event.respondWith(
    fetch(request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});

// Handle background sync for offline searches
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-searches') {
    event.waitUntil(syncSearches());
  }
});

async function syncSearches() {
  // Sync any pending search data when back online
  console.log('Syncing offline searches...');
}

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Namma Metro update',
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      data: data.url || '/'
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Namma Metro Navigator', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data)
  );
});
