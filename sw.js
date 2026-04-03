// =========================================================
// Service Worker — Mohamed Yasser Portfolio PWA
// Strategy:
//   - Cache First  → static assets (CSS, JS, images, fonts)
//   - Network First → API calls (/api/contact, Formspree)
//   - Stale While Revalidate → HTML pages
// =========================================================

const CACHE_NAME = 'myg-portfolio-v1';

// Assets to pre-cache on install (app shell)
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/css/style.css',
    '/js/modules/main.js',
    '/js/modules/animations.js',
    '/js/modules/i18n.js',
    '/assets/images/hero.webp',
    '/assets/images/profile.webp',
    '/assets/images/og-preview.webp',
    '/manifest.json',
];

// ───────────── INSTALL ─────────────
// Pre-cache the app shell. Skip waiting so the new SW activates immediately.
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Pre-caching app shell');
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
    globalThis.skipWaiting();
});

// ───────────── ACTIVATE ─────────────
// Delete all old caches that don't match the current CACHE_NAME.
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => {
                        console.log('[SW] Deleting old cache:', name);
                        return caches.delete(name);
                    })
            )
        )
    );
    // Take control of all pages immediately without waiting for a reload
    globalThis.clients.claim();
});

// ───────────── FETCH ─────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // --- Strategy 1: Network First ---
    // Applied to: Our own API, Formspree, and any cross-origin POST requests.
    // Rationale: Contact form submissions must always hit the live server.
    const isApiCall =
        url.pathname.startsWith('/api/') ||
        url.hostname.includes('formspree.io') ||
        request.method === 'POST';

    if (isApiCall) {
        event.respondWith(networkFirst(request));
        return;
    }

    // --- Strategy 2: Cache First ---
    // Applied to: Static assets — images, fonts, CSS, JS.
    // Rationale: These assets are fingerprinted/versioned and rarely change mid-session.
    const isStaticAsset =
        /\.(png|jpg|jpeg|webp|gif|svg|ico|woff2?|ttf|eot|css|js)$/i.exec(url.pathname);

    if (isStaticAsset) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // --- Strategy 3: Stale While Revalidate ---
    // Applied to: HTML navigation requests (pages).
    // Rationale: Serve fast from cache, refresh in background for next visit.
    if (request.mode === 'navigate') {
        event.respondWith(staleWhileRevalidate(request));
        return;
    }

    // Fallback: Network First for everything else
    event.respondWith(networkFirst(request));
});

// ─────────────────────────────────────────────
//  Strategy Implementations
// ─────────────────────────────────────────────

/** Cache First: Serve from cache; fall back to network and update cache. */
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const networkResponse = await fetch(request);
        // Only cache valid, same-origin GET responses
        if (networkResponse?.status === 200 && request.method === 'GET') {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.warn('[SW] Cache first fetch failed:', error);
        // Return a fallback offline image if it was an image request
        return new Response('', { status: 408, statusText: 'Request Timeout' });
    }
}

/** Network First: Try network; fall back to cache if offline. */
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        // Cache successful GET responses for future offline use
        if (networkResponse?.status === 200 && request.method === 'GET') {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.warn('[SW] Network first offline, checking cache:', error);
        const cached = await caches.match(request);
        return cached || new Response(JSON.stringify({ success: false, message: 'You are offline.' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

/** Stale While Revalidate: Serve from cache, update cache in background. */
async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    // Kick off a background network fetch to update the cache
    const networkFetch = fetch(request).then((networkResponse) => {
        if (networkResponse?.status === 200) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(() => null);

    // Return cached immediately if available, otherwise wait for network
    return cached || networkFetch || new Response('Offline', { status: 503 });
}
