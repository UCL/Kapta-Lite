import { precacheAndRoute } from 'workbox-precaching/precacheAndRoute';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { clientsClaim } from 'workbox-core';

clientsClaim();

// Precache app shell and static assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache API responses with network-first strategy for dynamic content
registerRoute(
    ({ url }) => url.pathname.startsWith('/api/') && !url.hostname.includes('mapbox'),
    new NetworkFirst({
        cacheName: 'api-cache',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
            new ExpirationPlugin({
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 1 day
            }),
        ],
    })
);

// Cache JavaScript and CSS files
registerRoute(
    ({ request }) => request.destination === 'script' || request.destination === 'style',
    new StaleWhileRevalidate({
        cacheName: 'static-resources',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
        ],
    })
);

// Cache images with cache-first strategy
registerRoute(
    ({ request }) => request.destination === 'image',
    new CacheFirst({
        cacheName: 'images',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
            new ExpirationPlugin({
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            }),
        ],
    })
);

// Handle Mapbox tiles with special consideration for offline use
registerRoute(
    ({ url }) => url.hostname === 'api.mapbox.com',
    new CacheFirst({
        cacheName: 'mapbox-tiles',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
            new ExpirationPlugin({
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
            }),
        ],
    })
);

// Cache fonts
registerRoute(
    ({ request }) => request.destination === 'font',
    new CacheFirst({
        cacheName: 'fonts',
        plugins: [
            new CacheableResponsePlugin({
                statuses: [0, 200],
            }),
            new ExpirationPlugin({
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
            }),
        ],
    })
);

self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    // Take control of all clients immediately
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Clean up old caches if needed
                        if (cacheName.includes('old-') || cacheName.includes('temp-')) {
                            console.log('Service Worker: Clearing old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
        ])
    );
});

// Listen for skip waiting messages
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('fetch', (event) => {
    // Handle share-target requests
    if (event.request.url.endsWith('/share-target') && event.request.method === "POST") {
        const formDataPromise = event.request.formData();

        event.respondWith(Response.redirect('./index.html?share-target', 303));

        event.waitUntil(
            (async function () {
                // The page sends this message to tell the service worker it's ready to receive the file.
                await nextMessage('share-ready');
                const client = await self.clients.get(event.resultingClientId);
                const data = await formDataPromise;
                
                // Check for files to handle
                const file = data.get('file');
                
                // Get all image files
                const imageFiles = [];
                // Check for any images in the files array
                for (const [key, value] of data.entries()) {
                    if (value instanceof File && value.type.startsWith('image/')) {
                        imageFiles.push(value);
                    }
                }
                
                if (imageFiles.length > 0) {
                    // If we have images, send them to the client
                    client.postMessage({ files: imageFiles, action: 'load-images' });
                } else if (file) {
                    // Otherwise, handle as before (ZIP file)
                    client.postMessage({ file, action: 'load-map' });
                }
            })(),
        );
        return;
    }

    // Handle navigation requests (HTML pages) with offline fallback
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                // If network fails, serve the cached app shell
                return caches.match('/index.html');
            })
        );
        return;
    }

    // Handle API requests with offline fallback
    if (event.request.url.includes('/api/') && !event.request.url.includes('mapbox')) {
        event.respondWith(
            fetch(event.request).catch(() => {
                // Try to serve from cache if network fails
                return caches.match(event.request).then(response => {
                    if (response) {
                        return response;
                    }
                    // Return a meaningful offline response for API calls
                    return new Response(
                        JSON.stringify({ 
                            error: 'Offline', 
                            message: 'This feature requires an internet connection.' 
                        }),
                        {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                });
            })
        );
        return;
    }
});

const nextMessageResolveMap = new Map();

/**
 * Wait on a message with a particular event.data value.
 *
 * @param dataVal The event.data value.
 */
function nextMessage(dataVal) {
    return new Promise((resolve) => {
        if (!nextMessageResolveMap.has(dataVal)) {
            nextMessageResolveMap.set(dataVal, []);
        }
        nextMessageResolveMap.get(dataVal).push(resolve);
    });
}

self.addEventListener('message', (event) => {
    const resolvers = nextMessageResolveMap.get(event.data);
    if (!resolvers) return;
    nextMessageResolveMap.delete(event.data);
    for (const resolve of resolvers) resolve();
});

// Handle background sync for queued actions
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

async function doBackgroundSync() {
    // Handle any queued uploads or API calls when back online
    console.log('Service Worker: Performing background sync');
    
    try {
        // Get queued items from IndexedDB or localStorage
        const queuedItems = await getQueuedItems();
        
        for (const item of queuedItems) {
            try {
                await processQueuedItem(item);
                await removeQueuedItem(item.id);
            } catch (error) {
                console.error('Service Worker: Failed to process queued item', error);
            }
        }
    } catch (error) {
        console.error('Service Worker: Background sync failed', error);
    }
}

async function getQueuedItems() {
    // Placeholder for getting queued items from storage
    // This would typically use IndexedDB
    return [];
}

async function processQueuedItem(item) {
    // Placeholder for processing queued uploads or API calls
    console.log('Service Worker: Processing queued item', item);
}

async function removeQueuedItem(id) {
    // Placeholder for removing processed items from queue
    console.log('Service Worker: Removing queued item', id);
}

// Listen for network status changes
self.addEventListener('online', () => {
    console.log('Service Worker: Network is back online');
    // Trigger background sync when network is restored
    self.registration.sync.register('background-sync');
});

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'New update available',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        vibrate: [200, 100, 200],
        actions: [
            {
                action: 'open',
                title: 'Open App',
                icon: '/icon-192x192.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/icon-192x192.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Kapta Lite', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked');
    
    event.notification.close();
    
    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});