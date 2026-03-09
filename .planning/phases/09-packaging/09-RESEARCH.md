# Phase 9: Packaging - Research

**Researched:** 2026-03-09
**Domain:** PWA packaging, service worker caching, GitHub Pages deployment, Android APK sideloading
**Confidence:** MEDIUM

## Summary

Phase 9 packages the complete five-game suite as a sideloadable Android APK. The work breaks into four distinct areas: (1) fixing all paths for the GitHub Pages `/ConGames/` subdirectory, (2) finalizing the service worker for robust offline caching with silent updates, (3) generating app icons and a branded splash screen, and (4) building the APK via PWABuilder with proper Digital Asset Links so the address bar stays hidden.

The project already has a functional `sw.js` with cache-first strategy and a valid `manifest.json` -- both need path prefix fixes but no architectural changes. The main risk area is Digital Asset Links: without a valid `/.well-known/assetlinks.json` on the GitHub Pages site, the TWA will show a browser address bar. Since this is a sideloaded personal app (not Play Store), the signing key is under our control, making asset link setup straightforward.

**Primary recommendation:** Fix all paths first (`/ConGames/` prefix), then finalize SW + manifest, generate icons, add splash screen, deploy to GitHub Pages, verify offline behavior, then use PWABuilder to generate the APK with proper asset links.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **App Icon:** Playing card motif with four suits (spades, hearts, diamonds, clubs) arranged in a fan/grid pattern. "CSG" initials included. Gold/amber on dark brown (#1a1610) background. Rounded square shape. Two sizes: 192x192 and 512x512.
- **Update Behavior:** Fully silent SW updates -- no toast, no notification, no user action. Cache-first with background update. Manual "Dateer op" button in welcome screen settings. Version number as tiny footer text. No offline indicator.
- **Splash Screen:** Branded splash on cold start: dark brown background, app icon (four suits), "Con se Speletjies" text. Gentle fade-in animation (~0.3s icon, ~0.5s text), then fade out. Shows until assets loaded. Inline CSS to avoid white flash.
- **GitHub Pages & Path Fixes:** Live URL: `https://trashcanman3284.github.io/ConGames/`. Deploy method: deploy from branch (main, / root). All root-relative paths need `/ConGames/` prefix. No GitHub Actions workflow needed.

### Claude's Discretion
- Exact icon generation approach (CSS/SVG/canvas or external tool)
- SW cache versioning scheme and cache-busting strategy
- PWA Builder configuration details
- APK signing approach (debug key vs generated)
- Splash screen implementation details (inline HTML element vs separate splash page)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PLT-01 | All game assets cached by service worker for full offline play | SW path prefix fix, complete CORE_ASSETS inventory, cache-first + background update strategy |
| PLT-02 | APK packaged via PWA Builder, signed, and sideloadable on Samsung Galaxy Tab S6 Lite | PWABuilder TWA generation, Digital Asset Links setup, APK signing, manifest validation |
</phase_requirements>

## Standard Stack

### Core
| Tool | Version | Purpose | Why Standard |
|------|---------|---------|--------------|
| PWABuilder | Web tool (pwabuilder.com) | Generate Android APK/AAB from PWA URL | Microsoft-maintained, uses Bubblewrap under the hood, produces signed APK |
| Bubblewrap | Latest (via PWABuilder) | TWA wrapper generation | Google's official tool for wrapping PWAs as Android TWAs |
| Service Worker API | Browser native | Offline caching | Already implemented in sw.js, needs path fixes only |

### Supporting
| Tool | Purpose | When to Use |
|------|---------|-------------|
| PWABuilder Image Generator (pwabuilder.com/imageGenerator) | Generate icon sizes from source image | If creating icon as SVG/PNG first, then generating required sizes |
| Lighthouse (Chrome DevTools) | PWA audit | Validate manifest, SW, offline capability before PWABuilder |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PWABuilder | Manual Bubblewrap CLI | More control but requires Android SDK setup, unnecessary complexity for sideload |
| PWABuilder | pwa2apk.com | Third-party service, less trustworthy than Microsoft's tool |
| External icon tool | Canvas/SVG in-browser generation | Can create icon programmatically but quality may vary; a hand-crafted SVG exported to PNG is more reliable |

**No installation needed.** This phase uses web tools (PWABuilder, Lighthouse) and edits existing project files. No npm, no build pipeline.

## Architecture Patterns

### Current File Inventory (What Must Be Cached)

All files that `sw.js` CORE_ASSETS must list (with `/ConGames/` prefix):

```
/ConGames/
/ConGames/index.html
/ConGames/manifest.json
/ConGames/sw.js
/ConGames/css/shared.css
/ConGames/css/cards.css
/ConGames/js/cards.js
/ConGames/js/router.js
/ConGames/js/settings.js
/ConGames/js/audio.js
/ConGames/words.json
/ConGames/word_found.mp3
/ConGames/board_finished.mp3
/ConGames/games/woordsoek/engine.js
/ConGames/games/woordsoek/ui.js
/ConGames/games/solitaire/index.html
/ConGames/games/solitaire/engine.js
/ConGames/games/solitaire/ui.js
/ConGames/games/spider/index.html
/ConGames/games/spider/engine.js
/ConGames/games/spider/ui.js
/ConGames/games/sudoku/index.html
/ConGames/games/sudoku/engine.js
/ConGames/games/sudoku/ui.js
/ConGames/games/freecell/index.html
/ConGames/games/freecell/engine.js
/ConGames/games/freecell/ui.js
/ConGames/icons/icon-192.png
/ConGames/icons/icon-512.png
```

Note: `games/woordsoek/index.html` is NOT listed because it doesn't exist -- Woord Soek is embedded directly in the main `index.html`. The other game `index.html` files are simple redirect stubs (`location.href = '/'`).

### Pattern 1: Path Prefix Strategy

**What:** All paths in the project currently use root-relative (`/sw.js`, `/index.html`) or bare-relative (`words.json`, `word_found.mp3`) paths. GitHub Pages serves from `/ConGames/` subdirectory, so root-relative paths break.

**Files requiring path changes:**

1. **`sw.js`** -- CORE_ASSETS array: all entries need `/ConGames/` prefix. Offline fallback `caches.match('/index.html')` needs prefix.
2. **`manifest.json`** -- `start_url` and `icons[].src` need prefix.
3. **`index.html`** -- SW registration `register('/sw.js')` needs prefix. The `<link rel="manifest" href="manifest.json">` is relative (OK). Script `src` attributes are relative (OK).
4. **`games/woordsoek/ui.js`** -- `fetch('words.json')` is relative to page URL. Since the page is `/ConGames/index.html`, this resolves to `/ConGames/words.json` which is correct. No change needed.
5. **`js/audio.js`** -- Sound paths `word_found.mp3` and `board_finished.mp3` are relative. Same logic -- resolves correctly. No change needed.
6. **Game redirect stubs** (`games/*/index.html`) -- `location.href = '/'` needs to become `/ConGames/` or use relative `../../`.

**Key insight:** Only absolute paths (starting with `/`) need fixing. Relative paths resolve correctly from the page URL.

### Pattern 2: Silent SW Update Strategy

**What:** Cache-first for all requests, with background update on SW activation.

**Current sw.js behavior (mostly correct):**
- Install: cache all CORE_ASSETS, then `skipWaiting()`
- Activate: delete old caches, then `clients.claim()`
- Fetch: cache-first, network fallback, cache new responses

**What needs adding:**
- No toast/notification on update (already the case -- no messaging code exists)
- The existing pattern already does silent updates via `skipWaiting()` + `clients.claim()`
- Version bump strategy: increment `CACHE_NAME` version string on each deploy (e.g., `congames-v6`, `congames-v7`)

**Manual "Dateer op" button logic:**
```javascript
// In welcome screen settings panel
function forceUpdate() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(reg => reg.unregister());
    });
    caches.keys().then(keys => {
      return Promise.all(keys.map(key => caches.delete(key)));
    }).then(() => {
      window.location.reload();
    });
  }
}
```

### Pattern 3: Splash Screen (Inline CSS)

**What:** A full-viewport overlay in `index.html` that shows immediately on load and fades out once the app is ready.

**Implementation approach:**
```html
<!-- At very top of <body>, before any other content -->
<div id="splash" style="
  position: fixed; inset: 0; z-index: 9999;
  background: #1a1610;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  transition: opacity 0.5s ease;
">
  <!-- Icon and text here with fade-in animations -->
</div>
```

The splash uses inline styles to render before any external CSS loads (preventing white flash). It's removed via JS after a brief delay or when the app signals readiness.

### Pattern 4: Digital Asset Links

**What:** A JSON file at `/.well-known/assetlinks.json` on the GitHub Pages site that ties the APK's signing key to the domain.

**Problem:** GitHub Pages serves from `trashcanman3284.github.io/ConGames/`. The `.well-known` directory must be at the domain root (`trashcanman3284.github.io/.well-known/`), NOT at `/ConGames/.well-known/`. Since the user may have other repos on the same GitHub Pages domain, this could be tricky.

**Solution options:**
1. Create a repo-level `.well-known/assetlinks.json` -- GitHub Pages for project sites serve from `/ConGames/`, so `/.well-known/` would need to be in the user's `trashcanman3284.github.io` repo (the user pages repo), not in ConGames.
2. Accept the address bar will show -- for a sideloaded family app, this is cosmetically annoying but functionally fine.
3. Use a custom domain -- would put asset links at the domain root. Overkill for this project.

**Recommendation:** Try option 1 first. If the user doesn't have a `trashcanman3284.github.io` repo, create one with just the `.well-known/assetlinks.json` file. If that's too complex, accept option 2 -- the address bar is a minor cosmetic issue for a personal sideloaded app.

### Anti-Patterns to Avoid
- **Hard-coding `/ConGames/` everywhere:** Use a single constant or keep it in the files that need it (sw.js, manifest.json, index.html SW registration). Don't scatter it across game files.
- **Caching the SW itself:** Never add `sw.js` to its own CORE_ASSETS list. The browser manages SW updates separately.
- **Using `cache.addAll` without error handling:** Already handled in current sw.js with `.catch()`.
- **Forgetting to bump cache version:** Every deploy with changed files must bump `CACHE_NAME` or users get stale content.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| APK generation | Android Studio project | PWABuilder (pwabuilder.com) | Handles Bubblewrap, signing, manifest conversion automatically |
| Icon size variants | Manual resize script | PWABuilder Image Generator or export from SVG at 192px and 512px | Only two sizes needed, not worth automation |
| PWA validation | Manual checklist | Chrome Lighthouse PWA audit | Catches manifest issues, SW problems, offline failures automatically |

**Key insight:** The project needs exactly two icon PNGs and one APK. Hand-rolling tooling for this is pure overhead.

## Common Pitfalls

### Pitfall 1: Root-Relative Paths on GitHub Pages Subdirectory
**What goes wrong:** Paths like `/sw.js` resolve to `trashcanman3284.github.io/sw.js` instead of `trashcanman3284.github.io/ConGames/sw.js`. App fails to load SW, assets, everything.
**Why it happens:** GitHub Pages project sites serve from `/<repo-name>/`, not from `/`.
**How to avoid:** Audit every absolute path in sw.js, manifest.json, index.html. Use relative paths where possible; prefix `/ConGames/` where absolute paths are required.
**Warning signs:** 404 errors in browser console, SW fails to register, manifest not detected.

### Pitfall 2: SW Caching sw.js Itself
**What goes wrong:** If sw.js is in CORE_ASSETS, the browser may serve a stale SW from cache, preventing updates.
**Why it happens:** The SW controls its own fetch requests. If cached, it serves its old version.
**How to avoid:** Never list sw.js in CORE_ASSETS. The browser checks for SW updates by byte-comparing the registered URL.
**Warning signs:** Changes to sw.js never take effect on dad's tablet.

### Pitfall 3: Digital Asset Links Location for GitHub Pages Project Sites
**What goes wrong:** The TWA shows a browser address bar because `/.well-known/assetlinks.json` can't be found.
**Why it happens:** Project sites serve from `/<repo>/`, but Chrome looks for asset links at the domain root `/.well-known/`.
**How to avoid:** Host `assetlinks.json` in the user pages repo (`trashcanman3284.github.io`), or accept the address bar for sideload use.
**Warning signs:** Address bar visible at top of app after install.

### Pitfall 4: Cache Not Invalidated After Deploy
**What goes wrong:** Dad sees old version of the app even after git push.
**Why it happens:** SW serves from cache-first. If CACHE_NAME wasn't bumped, the old cache persists.
**How to avoid:** Bump CACHE_NAME on every deploy that changes files. The "Dateer op" button provides a manual escape hatch.
**Warning signs:** Dad reports old behavior after confirmed deploy.

### Pitfall 5: `fetch('words.json')` Path Resolution
**What goes wrong:** Woord Soek fails to load words because `words.json` resolves to wrong path.
**Why it happens:** Relative fetch paths resolve against the page URL. If the page is at `/ConGames/index.html`, `fetch('words.json')` resolves to `/ConGames/words.json` which is correct. But if somehow navigated to `/ConGames/` (trailing slash, no `index.html`), it still works.
**How to avoid:** Test fetch paths on the actual GitHub Pages URL before building APK.
**Warning signs:** Woord Soek shows empty grid or errors on GitHub Pages.

### Pitfall 6: Game Redirect Stubs Using Root Path
**What goes wrong:** `games/solitaire/index.html` has `location.href = '/'` which redirects to `trashcanman3284.github.io/` (the user's GitHub root), not the app.
**Why it happens:** Absolute `/` path doesn't account for subdirectory.
**How to avoid:** Change to relative `../../` or absolute `/ConGames/`.
**Warning signs:** Clicking a game link or direct-navigating to a game URL sends user away from the app.

## Code Examples

### SW Registration with Path Prefix
```javascript
// In index.html
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/ConGames/sw.js', {
    scope: '/ConGames/'
  }).catch(err => {
    console.log('SW registration failed:', err);
  });
}
```

### Manifest with Correct Paths
```json
{
  "start_url": "/ConGames/index.html",
  "scope": "/ConGames/",
  "icons": [
    {
      "src": "/ConGames/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/ConGames/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### Digital Asset Links File
```json
// /.well-known/assetlinks.json (on domain root)
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.congames.speletjies",
    "sha256_cert_fingerprints": ["<SHA256 from signing key>"]
  }
}]
```

### Force Update Button
```javascript
function forceUpdate() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(r => r.unregister());
    });
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => location.reload());
  }
}
```

### Splash Screen Inline Implementation
```html
<div id="splash" style="position:fixed;inset:0;z-index:9999;background:#1a1610;display:flex;flex-direction:column;align-items:center;justify-content:center;">
  <div id="splash-icon" style="opacity:0;transition:opacity 0.3s ease;font-size:4rem;">
    <!-- Four suit symbols in gold -->
    <span style="color:#d4a23a;">&#9824; &#9829;<br>&#9830; &#9827;</span>
  </div>
  <div id="splash-text" style="opacity:0;transition:opacity 0.5s ease;font-family:'Playfair Display',Georgia,serif;color:#d4a23a;font-size:1.8rem;margin-top:1rem;">
    Con se Speletjies
  </div>
</div>
<script>
  // Fade in icon, then text, then fade out splash
  requestAnimationFrame(() => {
    document.getElementById('splash-icon').style.opacity = '1';
    setTimeout(() => {
      document.getElementById('splash-text').style.opacity = '1';
    }, 300);
  });
  window.addEventListener('load', () => {
    setTimeout(() => {
      const splash = document.getElementById('splash');
      splash.style.transition = 'opacity 0.5s ease';
      splash.style.opacity = '0';
      setTimeout(() => splash.remove(), 500);
    }, 800); // minimum display time
  });
</script>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| WebView-based APK wrappers | TWA (Trusted Web Activity) | 2019+ | Full Chrome engine, no browser UI (with asset links), better performance |
| Manual Bubblewrap CLI | PWABuilder web UI | 2020+ | No Android SDK needed, generates signed APK in browser |
| Cache-then-network SW | Cache-first with skipWaiting | Stable pattern | Instant loads, background updates on next visit |

**Deprecated/outdated:**
- `manifest.json` `purpose: "any maskable"` combined: some validators warn about splitting into separate icon entries (one `"any"`, one `"maskable"`). PWABuilder may flag this. Consider splitting.

## Open Questions

1. **Digital Asset Links hosting**
   - What we know: GitHub Pages project sites can't serve `/.well-known/` at domain root from the project repo
   - What's unclear: Whether the user has a `trashcanman3284.github.io` user pages repo
   - Recommendation: Attempt to set up asset links. If blocked, accept address bar (cosmetic only for sideloaded app). Document for user.

2. **Icon generation method**
   - What we know: Need 192x192 and 512x512 PNGs with card suit motif + "CSG" text
   - What's unclear: Whether to hand-craft SVG, use canvas, or use an external tool
   - Recommendation: Create an SVG with the four suits and "CSG" text using code (the suits are Unicode characters, text is simple). Export to PNG at both sizes using canvas or a conversion tool. Alternatively, create a simple HTML page that renders the icon and screenshot it.

3. **PWABuilder package name**
   - What we know: PWABuilder asks for an Android package name
   - What's unclear: Exact name to use
   - Recommendation: Use `com.congames.speletjies` or `za.co.congames.speletjies`

4. **Manifest `purpose` field**
   - What we know: Current manifest uses `"purpose": "any maskable"` (combined)
   - What's unclear: Whether PWABuilder accepts this or requires separate entries
   - Recommendation: Split into two icon entries per size if PWABuilder warns, or test as-is first

## Sources

### Primary (HIGH confidence)
- MDN Web Docs: [scope](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/scope), [start_url](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/start_url) -- manifest path configuration
- Chrome Developers: [Workbox caching strategies](https://developer.chrome.com/docs/workbox/caching-strategies-overview) -- SW caching patterns
- PWABuilder Blog: [Generating your Android package](https://blog.pwabuilder.com/docs/generating-your-android-package/) -- APK generation workflow
- PWABuilder GitHub: [Asset-links.md](https://github.com/pwa-builder/pwabuilder-google-play/blob/main/Asset-links.md) -- Digital Asset Links setup

### Secondary (MEDIUM confidence)
- Christian Heilmann: [Turning a GitHub page into a PWA](https://christianheilmann.com/2022/01/13/turning-a-github-page-into-a-progressive-web-app/) -- GitHub Pages PWA setup verified with MDN docs
- web.dev: [PWA Update](https://web.dev/learn/pwa/update) -- SW update lifecycle

### Tertiary (LOW confidence)
- PWABuilder behavior with combined `"any maskable"` purpose -- needs validation during APK build step

## Metadata

**Confidence breakdown:**
- Path prefix fixes: HIGH -- well-documented GitHub Pages behavior, verified with MDN
- SW caching strategy: HIGH -- existing sw.js pattern is sound, only needs path fixes
- Splash screen: HIGH -- standard inline CSS/JS pattern, no external dependencies
- Icon generation: MEDIUM -- multiple valid approaches, exact method is discretionary
- PWABuilder APK generation: MEDIUM -- tool is well-documented but exact UI flow may vary
- Digital Asset Links: LOW -- GitHub Pages subdirectory hosting adds complexity, may need user pages repo

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable domain, tools unlikely to change)
