// POZIMIND Service Worker for Offline Support
const CACHE_NAME = 'pozimind-v1.0.0';
const STATIC_CACHE = 'pozimind-static-v1.0.0';
const DYNAMIC_CACHE = 'pozimind-dynamic-v1.0.0';

// Critical assets to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add other critical assets as needed
];

// API endpoints that can be cached for offline
const CACHABLE_ROUTES = [
  '/api/health',
  '/api/settings'
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

// Fetch event - handle requests with offline support
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and external resources
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Handle static assets
  if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.startsWith(asset))) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          
          // Network first for static assets, then cache
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(STATIC_CACHE)
                  .then((cache) => cache.put(request, responseClone));
              }
              return response;
            })
            .catch(() => {
              // Return cached version if network fails
              return caches.match(request);
            });
        })
    );
    return;
  }

  // Handle API routes (stale-while-revalidate strategy)
  if (CACHABLE_ROUTES.some(route => url.pathname.startsWith(route))) {
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          const networkFetch = fetch(request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(DYNAMIC_CACHE)
                  .then((cache) => cache.put(request, responseClone));
              }
              return response;
            });
          
          // Return cached version immediately, update in background
          if (cached) {
            return cached;
          }
          
          return networkFetch;
        })
        .catch(() => {
          // Return cached version if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // For all other requests, use network first
  event.respondWith(
    fetch(request)
      .catch(() => {
        // Fallback to cached version if available
        return caches.match(request);
      })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'journal-entries') {
    event.waitUntil(syncJournalEntries());
  } else if (event.tag === 'ai-settings') {
    event.waitUntil(syncAISettings());
  }
});

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event.data);
  
  const options = {
    body: event.data?.body || 'New notification from POZIMIND',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: 'pozimind-notification',
    renotify: true
  };
  
  event.waitUntil(
    self.registration.showNotification(event.data?.title || 'POZIMIND', options)
  );
});

// Sync journal entries when online
async function syncJournalEntries() {
  try {
    // Get queued entries from IndexedDB
    const queuedEntries = await getQueuedEntries();
    
    for (const entry of queuedEntries) {
      try {
        // Try to sync with server (when implemented)
        await fetch('/api/journal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry)
        });
        
        // Remove from queue if successful
        await removeQueuedEntry(entry.id);
      } catch (error) {
        console.error('[SW] Failed to sync entry:', error);
        break; // Stop on first error to preserve queue
      }
    }
  } catch (error) {
    console.error('[SW] Sync error:', error);
  }
}

// Sync AI settings when online
async function syncAISettings() {
  try {
    const queuedSettings = await getQueuedSettings();
    
    for (const setting of queuedSettings) {
      try {
        await fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(setting)
        });
        
        await removeQueuedSetting(setting.id);
      } catch (error) {
        console.error('[SW] Failed to sync setting:', error);
        break;
      }
    }
  } catch (error) {
    console.error('[SW] Settings sync error:', error);
  }
}

// IndexedDB helpers for offline queue
async function getQueuedEntries() {
  return new Promise((resolve) => {
    const request = indexedDB.open('pozimind-offline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['journal-queue'], 'readonly');
      const store = transaction.objectStore('journal-queue');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
    };
  });
}

async function removeQueuedEntry(id) {
  return new Promise((resolve) => {
    const request = indexedDB.open('pozimind-offline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['journal-queue'], 'readwrite');
      const store = transaction.objectStore('journal-queue');
      store.delete(id);
      
      transaction.oncomplete = () => resolve();
    };
  });
}

// Similar functions for settings queue would go here
async function getQueuedSettings() { return []; }
async function removeQueuedSetting(id) { return Promise.resolve(); }
