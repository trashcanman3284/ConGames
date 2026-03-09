# Dad se Speletjies

## What This Is

A personal Android game suite for Dewald's dad — five classic games (Woord Soek, Solitaire, Spider Solitaire, Sudoku, FreeCell) in a single offline-first PWA, packaged as an APK via PWA Builder and sideloaded onto a Samsung Galaxy Tab S6 Lite. Not for the Play Store — a personal family project.

## Core Value

Dad can pick up his tablet, tap a game, play it to completion, and return to the menu — for all five games — without needing any help.

## Requirements

### Validated

- ✓ Scaffold: shared CSS design system, router, settings, audio module, PWA shell — Phase 1
- ✓ Welcome screen with 5 game buttons, settings panel, stats display — Phase 2

### Active

- [ ] Woord Soek — Afrikaans word search with 7,732-word dictionary, 8-direction placement, tap selection, sound effects
- [ ] Solitaire — Full Klondike with drag/tap-to-move, undo, auto-complete, win detection
- [ ] Spider Solitaire — 1/2/4 suit modes, 10 columns, 104 cards, complete sequence removal
- [ ] Sudoku — 4 difficulty levels, backtracking generator, number pad, notes mode, hints
- [ ] FreeCell — 4 free cells, multi-card move calculation, auto-move to foundation, deal numbers
- [ ] Shared card renderer — Pure CSS cards used by Solitaire, Spider, and FreeCell
- [ ] APK packaging — PWA Builder packaging, signed APK, sideloadable on tablet
- [ ] Full offline support — All assets cached by service worker, no internet after install

### Out of Scope

- Play Store listing — sideload only, no store compliance needed
- Best times / leaderboard — nice-to-have, Phase 9 only if time
- FreeCell deal number entry — nice-to-have
- Daily Sudoku (date-seeded) — nice-to-have
- Word categories for Woord Soek — nice-to-have
- Multiple colour themes — nice-to-have
- npm / build pipeline / TypeScript — vanilla only

## Context

- Dad plays on a Samsung Galaxy Tab S6 Lite (10.4", landscape, Android 10+)
- Older adult, non-technical — readability and large tap targets (min 56px) are critical
- Afrikaans UI preferred where possible
- Word data already extracted from an existing APK (`words.json`, 7,732 Afrikaans words)
- Sound effects already available (`word_found.mp3`, `board_finished.mp3`)
- Phases 1-2 complete: shared CSS design system (`css/shared.css`), router (`js/router.js`), settings (`js/settings.js`), audio (`js/audio.js`), service worker (`sw.js`), welcome screen (`index.html`)
- Design system uses warm dark theme: deep brown-black background, amber/gold accents, Playfair Display + Nunito fonts

## Constraints

- **Tech stack**: HTML + CSS + Vanilla JS only — no build step, no npm, no bundler, no ESM imports
- **Offline**: Must work 100% offline after install — no external API calls at runtime
- **Device**: Samsung Galaxy Tab S6 Lite, 10.4" landscape, Android 10+
- **Tap targets**: Minimum 56px — if a button feels small, it's too small for Dad
- **Distribution**: Sideloaded APK via PWA Builder — no Play Store
- **Fonts**: Google Fonts cached by service worker, system font fallbacks required
- **Audio**: Web Audio API, must resume AudioContext on user gesture (Android policy)
- **Touch**: Must handle both `touchstart` and `click` for tablet compatibility
- **Module pattern**: IIFE modules only (`const X = (() => { ... })()`), no ES module import/export

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PWA + PWA Builder for APK | No Android toolchain needed, offline-first by design | — Pending |
| Vanilla JS, no framework | No build step, simple to debug, works offline trivially | ✓ Good |
| Pure CSS card rendering | No image assets needed, responsive, smaller APK | — Pending |
| Tailwind via CDN | Utility CSS without npm, cached by service worker | ✓ Good |
| IIFE module pattern | No ESM support needed, works in all browsers | ✓ Good |
| Build card renderer before card games | Shared dependency for 3 games, avoids duplication | — Pending |

---
*Last updated: 2026-03-08 after initialization*
