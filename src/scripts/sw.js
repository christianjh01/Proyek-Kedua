const CACHE_NAME = 'dicoding-story-v1';
const API_CACHE_NAME = 'dicoding-story-api-v1';
const IMAGE_CACHE_NAME = 'dicoding-story-images-v1';

const STATIC_ASSETS = [
  './',
  './index.html',
  './app.bundle.js',
  './app.css',
  './favicon.png',
  './manifest.json',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/icon-maskable-512x512.png',
  './screenshots/screenshot-desktop.png',
  './screenshots/screenshot-mobile.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Some assets failed to cache on install:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME && name !== IMAGE_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Strategy 1: Story API Caching (Network First -> Fallback to Cache)
  if (url.origin === 'https://story-api.dicoding.dev') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200 && request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            return new Response(
              JSON.stringify({
                error: false,
                message: 'Offline mode: Showing cached data',
                listStory: [],
              }),
              { headers: { 'Content-Type': 'application/json' } }
            );
          });
        })
    );
    return;
  }

  // Strategy 2: Images & Map Tiles (Cache First -> Fallback to Network)
  if (
    request.destination === 'image' ||
    url.hostname.includes('tile.openstreetmap.org') ||
    url.hostname.includes('tile.opentopomap.org') ||
    url.hostname.includes('story-api.dicoding.dev')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(IMAGE_CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        }).catch(() => {
          // Fallback image if missing
          return caches.match('./favicon.png');
        });
      })
    );
    return;
  }

  // Strategy 3: App Shell Static Assets (Stale-While-Revalidate / Cache First)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse.status === 200 && request.method === 'GET') {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

/* PUSH NOTIFICATIONS (Kriteria 2) */
self.addEventListener('push', (event) => {
  let notificationData = {
    title: 'Dicoding Story',
    body: 'Ada cerita baru di Dicoding Story!',
    id: '',
  };

  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (e) {
      notificationData.body = event.data.text();
    }
  }

  const title = notificationData.title || 'Dicoding Story';
  const options = {
    body: notificationData.body || 'Cerita baru telah ditambahkan.',
    icon: './icons/icon-192x192.png',
    badge: './favicon.png',
    data: {
      url: notificationData.id ? `/#/detail/${notificationData.id}` : '/#/',
    },
    actions: [
      {
        action: 'open-story',
        title: 'Lihat Story',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : '/#/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

/* OFFLINE BACKGROUND SYNC (Kriteria 4) */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-new-stories') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        clientList.forEach((client) => {
          client.postMessage({ type: 'SYNC_OFFLINE_STORIES' });
        });
      })
    );
  }
});
