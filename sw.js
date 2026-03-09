/**
 * sw.js — Service Worker for Con se Speletjies
 * Caches all app assets for full offline support
 */

const CACHE_NAME = 'congames-v2';

// All files to cache on install
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/shared.css',
  '/css/cards.css',
  '/js/cards.js',
  '/js/router.js',
  '/js/settings.js',
  '/js/audio.js',
  '/words.json',
  '/word_found.mp3',
  '/board_finished.mp3',
  '/games/woordsoek/index.html',
  '/games/woordsoek/engine.js',
  '/games/woordsoek/ui.js',
  '/games/solitaire/index.html',
  '/games/solitaire/engine.js',
  '/games/solitaire/ui.js',
  '/games/spider/index.html',
  '/games/spider/engine.js',
  '/games/spider/ui.js',
  '/games/sudoku/index.html',
  '/games/sudoku/engine.js',
  '/games/sudoku/ui.js',
  '/games/freecell/index.html',
  '/games/freecell/engine.js',
  '/games/freecell/ui.js',
];

// Google Fonts (cache separately — external)
const FONT_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Nunito:wght@400;600;700&display=swap',
];

// ── Install — cache everything ────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Cache core assets (fail fast on missing)
        return cache.addAll(CORE_ASSETS).catch(err => {
          console.warn('SW: some core assets failed to cache', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// ── Activate — clean old caches ───────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch — cache-first strategy ─────────────────────────────
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) return cached;

        // Not in cache — fetch from network and cache it
        return fetch(event.request)
          .then(response => {
            // Don't cache bad responses
            if (!response || response.status !== 200 || response.type === 'error') {
              return response;
            }

            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, clone);
            });

            return response;
          })
          .catch(() => {
            // Offline fallback — return cached index.html for navigation requests
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            // Otherwise just fail gracefully
            return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
          });
      })
  );
});
