// Service Worker for Tobagin Apps PWA
// Version: 1.0.0

const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE_NAME = `tobagin-apps-static-${CACHE_VERSION}`;
const RUNTIME_CACHE_NAME = `tobagin-apps-runtime-${CACHE_VERSION}`;
const OFFLINE_PAGE = '/offline.html';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/assets/css/style.css',
  '/assets/js/filter-manager.js',
  '/assets/js/lazy-loading.js',
  '/assets/js/web-vitals.js',
  '/site.webmanifest'
];

// Dynamic content patterns for runtime caching
const RUNTIME_CACHE_PATTERNS = [
  /^\/apps\/.+/,
  /^\/assets\/images\/.+/
];

// Network-first patterns (always try network first)
const NETWORK_FIRST_PATTERNS = [
  /^\/api\/.+/,
  /^\/search.+/
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached successfully');
        // Force activation of new service worker
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Service Worker: Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Delete old cache versions
            if (cacheName.startsWith('tobagin-apps-') && 
                cacheName !== STATIC_CACHE_NAME && 
                cacheName !== RUNTIME_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Old caches cleaned up');
        // Claim all clients immediately
        return self.clients.claim();
      })
      .catch(error => {
        console.error('Service Worker: Error during activation:', error);
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests except for known CDNs
  if (url.origin !== location.origin && 
      !url.hostname.includes('flathub.org') &&
      !url.hostname.includes('unpkg.com')) {
    return;
  }
  
  event.respondWith(handleFetch(request));
});

async function handleFetch(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  try {
    // Network-first strategy for dynamic content
    if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(pathname))) {
      return await networkFirst(request);
    }
    
    // Cache-first strategy for static assets
    if (isStaticAsset(pathname)) {
      return await cacheFirst(request);
    }
    
    // Stale-while-revalidate for app pages and images
    if (RUNTIME_CACHE_PATTERNS.some(pattern => pattern.test(pathname))) {
      return await staleWhileRevalidate(request);
    }
    
    // Default: try cache first, fallback to network
    return await cacheFirst(request);
    
  } catch (error) {
    console.error('Service Worker: Fetch error:', error);
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      return getOfflinePage();
    }
    
    // Return empty response for other failed requests
    return new Response('', {
      status: 408,
      statusText: 'Request timeout'
    });
  }
}

// Cache-first strategy: try cache, fallback to network
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  
  if (networkResponse.ok) {
    // Cache successful responses
    const cache = await caches.open(
      isStaticAsset(new URL(request.url).pathname) ? STATIC_CACHE_NAME : RUNTIME_CACHE_NAME
    );
    cache.put(request, networkResponse.clone());
  }
  
  return networkResponse;
}

// Network-first strategy: try network, fallback to cache
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(RUNTIME_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache for:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Stale-while-revalidate: return cache immediately, update in background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Fetch fresh version in background
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(error => {
    console.log('Service Worker: Background fetch failed:', error);
  });
  
  // Return cached version immediately, or wait for network if no cache
  return cachedResponse || fetchPromise;
}

// Get offline page from cache
async function getOfflinePage() {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const offlinePage = await cache.match(OFFLINE_PAGE);
  
  if (offlinePage) {
    return offlinePage;
  }
  
  // Fallback offline response if offline page not cached
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <title>Offline - Tobagin Apps</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { 
          font-family: "Cantarell", "Inter", system-ui, sans-serif;
          text-align: center; 
          padding: 4rem 2rem; 
          background: #f6f5f4;
          color: #241f31;
        }
        h1 { color: #3584e4; }
        .offline-icon { font-size: 4rem; margin-bottom: 1rem; }
      </style>
    </head>
    <body>
      <div class="offline-icon">📱</div>
      <h1>You're Offline</h1>
      <p>This page isn't available offline. Please check your connection and try again.</p>
      <button onclick="window.location.reload()">Try Again</button>
    </body>
    </html>
  `, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache'
    }
  });
}

// Utility function to check if request is for static asset
function isStaticAsset(pathname) {
  return pathname.endsWith('.css') ||
         pathname.endsWith('.js') ||
         pathname.endsWith('.png') ||
         pathname.endsWith('.jpg') ||
         pathname.endsWith('.jpeg') ||
         pathname.endsWith('.webp') ||
         pathname.endsWith('.svg') ||
         pathname.endsWith('.woff2') ||
         pathname.endsWith('.woff') ||
         pathname === '/' ||
         pathname === '/site.webmanifest';
}

// Handle skip waiting message from page
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Received skip waiting message');
    self.skipWaiting();
  }
});

// Background sync for offline actions (if supported)
if ('sync' in self.registration) {
  self.addEventListener('sync', event => {
    if (event.tag === 'background-sync') {
      console.log('Service Worker: Background sync triggered');
      event.waitUntil(doBackgroundSync());
    }
  });
}

async function doBackgroundSync() {
  // Placeholder for background sync operations
  // Could be used for queuing offline form submissions, etc.
  console.log('Service Worker: Performing background sync operations');
}