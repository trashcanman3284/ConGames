/**
 * sw.js — Service Worker for Con se Speletjies
 * Caches all app assets for full offline support
 */

const CACHE_NAME = 'congames-v6';

// All files to cache on install
// Note: sw.js itself is NOT included (browser manages SW updates separately)
// Note: woordsoek has no index.html (embedded in main index.html)
const CORE_ASSETS = [
  '/ConGames/',
  '/ConGames/index.html',
  '/ConGames/manifest.json',
  '/ConGames/css/shared.css',
  '/ConGames/css/cards.css',
  '/ConGames/js/cards.js',
  '/ConGames/js/router.js',
  '/ConGames/js/settings.js',
  '/ConGames/js/audio.js',
  '/ConGames/words.json',
  '/ConGames/word_found.mp3',
  '/ConGames/board_finished.mp3',
  '/ConGames/icons/icon-192.png',
  '/ConGames/icons/icon-512.png',
  '/ConGames/games/woordsoek/engine.js',
  '/ConGames/games/woordsoek/ui.js',
  '/ConGames/games/solitaire/index.html',
  '/ConGames/games/solitaire/engine.js',
  '/ConGames/games/solitaire/ui.js',
  '/ConGames/games/spider/index.html',
  '/ConGames/games/spider/engine.js',
  '/ConGames/games/spider/ui.js',
  '/ConGames/games/sudoku/index.html',
  '/ConGames/games/sudoku/engine.js',
  '/ConGames/games/sudoku/ui.js',
  '/ConGames/games/freecell/index.html',
  '/ConGames/games/freecell/engine.js',
  '/ConGames/games/freecell/ui.js',
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
              return caches.match('/ConGames/index.html');
            }
            // Otherwise just fail gracefully
            return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
          });
      })
  );
});
