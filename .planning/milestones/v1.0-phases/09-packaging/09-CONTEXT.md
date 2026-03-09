# Phase 9: Packaging - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Finalize the service worker, create app icons, build a branded splash screen, fix GitHub Pages path prefixes, and package the complete game suite as an APK via PWA Builder for sideloading onto Con's Samsung Galaxy Tab S6 Lite. All five games must work fully offline.

</domain>

<decisions>
## Implementation Decisions

### App Icon
- Playing card motif: four suits (♠♥♦♣) arranged in a fan/grid pattern
- "CSG" initials (Con se Games) included on the icon
- Gold/amber on dark brown (#1a1610) background — matches app theme
- Rounded square shape (standard Android adaptive icon)
- Two sizes needed: 192x192 and 512x512 (referenced in manifest.json)

### Update Behavior
- Fully silent service worker updates — no toast, no notification, no user action
- Cache-first strategy with background update (existing sw.js pattern, just needs polish)
- Manual "Dateer op" button in welcome screen settings — force SW unregister + cache clear + page reload
- Version number displayed as tiny footer text on the welcome screen (for remote debugging)
- No offline indicator — the app should feel identical whether online or offline

### Splash Screen
- Branded splash on cold start: dark brown background, app icon (four suits), "Con se Speletjies" text
- Gentle fade-in animation: icon fades in ~0.3s, text fades in ~0.5s, then splash fades out to welcome screen
- Shows until assets are loaded (typically 1-2s), no artificial delay
- Implemented with inline CSS (no external dependencies) to avoid white flash

### GitHub Pages & Path Fixes
- Live URL confirmed: https://trashcanman3284.github.io/ConGames/
- Deploy method: "deploy from branch" (main branch, / root) — no GitHub Actions workflow needed
- All root-relative paths need /ConGames/ prefix:
  - manifest.json `start_url` and icon paths
  - sw.js `CORE_ASSETS` array (all entries)
  - Any hardcoded paths in HTML files
- Remove or don't create `.github/workflows/deploy.yml` — not needed with deploy-from-branch

### Claude's Discretion
- Exact icon generation approach (CSS/SVG/canvas or external tool)
- SW cache versioning scheme and cache-busting strategy
- PWA Builder configuration details
- APK signing approach (debug key vs generated)
- Splash screen implementation details (inline HTML element vs separate splash page)

</decisions>

<specifics>
## Specific Ideas

- Manual update button labeled "Dateer op" (Afrikaans for "Update") in the welcome screen settings panel
- Version format: small "v1.0.0" in welcome screen footer corner
- Splash should feel warm and intentional — not a loading screen, but a brief branded moment
- "CSG" on the icon is a personal touch for Con

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `sw.js`: Complete cache-first service worker with CORE_ASSETS list — needs path prefix fix and polish
- `manifest.json`: Configured with fullscreen, landscape, Afrikaans lang — needs path prefix fix
- `css/shared.css`: Theme variables (--bg-base, --accent-gold, --font-display) for splash screen styling
- `js/settings.js`: Settings module — "Dateer op" button hooks into existing settings panel

### Established Patterns
- IIFE module pattern (no ESM imports) — all new code must follow this
- Toast system via `window.showToast()` — can reuse for update confirmation
- Settings panel already exists on welcome screen — add update button there

### Integration Points
- `sw.js` CORE_ASSETS must list every cacheable file across all 5 games
- `manifest.json` icons array points to `icons/icon-192.png` and `icons/icon-512.png` (files don't exist yet)
- Welcome screen (`index.html`) needs splash overlay + version footer + settings update button
- All game `index.html` files may have root-relative paths that need /ConGames/ prefix

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-packaging*
*Context gathered: 2026-03-09*
