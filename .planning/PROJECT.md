# Con se Speletjies

## What This Is

A personal Android game suite for Dewald's dad (Con) — five classic games (Woord Soek, Solitaire, Spider Solitaire, Sudoku, FreeCell) in a single offline-first PWA, packaged as an APK via PWA Builder and sideloaded onto a Samsung Galaxy Tab S6 Lite. Shipped v1.0 with all five games playable, MS-style visual themes, and GitHub Pages auto-deployment.

## Current Milestone: v1.1 Kruiswoordraaisel

**Goal:** Add the 6th and final game — an Afrikaans crossword puzzle — to complete the game suite.

**Target features:**
- Afrikaans crossword puzzle with generated grids
- Three difficulty levels (Easy 9×9 / Medium 13×13 / Hard 17×17)
- Cell tap + hidden input for S Pen handwriting support
- Clue navigation (tap clue → jump to word)
- Word completion feedback + congratulations modal

## Core Value

Con can pick up his tablet, tap a game, play it to completion, and return to the menu — for all six games — without needing any help.

## Requirements

### Validated

- ✓ Scaffold: shared CSS design system, router, settings, audio module, PWA shell — v1.0
- ✓ Welcome screen with 5 game buttons, settings panel, stats display — v1.0
- ✓ Woord Soek — Afrikaans word search with 7,732-word dictionary, 8-direction placement, tap-tap and drag selection, sound effects — v1.0
- ✓ Solitaire — Full Klondike with tap-to-move, drag, undo, auto-complete, win animation — v1.0
- ✓ Spider Solitaire — 1-suit mode, 10 columns, 104 cards, K→A sequence removal — v1.0
- ✓ Sudoku — 4 difficulty levels, backtracking generator, number pad, notes mode, hints, error checking — v1.0
- ✓ FreeCell — 4 free cells, multi-card move formula, auto-foundation, seeded deals — v1.0
- ✓ Shared card renderer — Pure CSS cards used by Solitaire, Spider, and FreeCell — v1.0
- ✓ APK packaging — PWA paths for /ConGames/, splash screen, branded icons — v1.0
- ✓ Full offline support — Service worker caches all 29 assets, works offline after first load — v1.0
- ✓ MS-style green felt theme for card games, parchment theme for puzzle games — v1.0
- ✓ Standardized settings modals with game-specific toggles and font size scaling — v1.0

### Active

- [ ] Kruiswoordraaisel clue dataset (~300 word+clue pairs from kaikki.org + words.json)
- [ ] Crossword grid generation engine (place words with letter intersections)
- [ ] Three difficulty levels (Easy/Medium/Hard)
- [ ] Full game UI with cell selection, clue highlighting, hidden input for S Pen
- [ ] Word completion detection with sound + visual feedback
- [ ] Congratulations modal + stats recording
- [ ] Integration into index.html (game card, screen section, script tags, stats)
- [ ] Service worker cache update for new game files

### Out of Scope

- Play Store listing — sideload only, no store compliance needed
- Spider 2-suit and 4-suit modes — deferred to v2
- Best times / win streaks display — nice-to-have
- FreeCell deal number entry (manual input) — nice-to-have
- Daily Sudoku (date-seeded RNG) — nice-to-have
- Word categories for Woord Soek — nice-to-have
- Theme toggle (MS vs warm-dark) — MS is now default
- npm / build pipeline / TypeScript — vanilla only

## Context

Shipped v1.0 with 15,603 LOC (HTML/CSS/JS) across 105 files.
Tech stack: HTML + CSS + Vanilla JS, Tailwind via CDN, Google Fonts, pure CSS card rendering.
Device: Samsung Galaxy Tab S6 Lite (10.4", landscape, Android 10+).
Distribution: GitHub Pages (`/ConGames/`) with PWA auto-update, APK sideloaded once.
All 56 v1 requirements validated. Five games fully playable offline.

## Constraints

- **Tech stack**: HTML + CSS + Vanilla JS only — no build step, no npm, no bundler, no ESM imports
- **Offline**: Must work 100% offline after install — no external API calls at runtime
- **Device**: Samsung Galaxy Tab S6 Lite, 10.4" landscape, Android 10+
- **Tap targets**: Minimum 56px — if a button feels small, it's too small for Con
- **Distribution**: Sideloaded APK via PWA Builder — no Play Store
- **Fonts**: Google Fonts cached by service worker, system font fallbacks required
- **Audio**: Web Audio API, must resume AudioContext on user gesture (Android policy)
- **Touch**: Must handle both `touchstart` and `click` for tablet compatibility
- **Module pattern**: IIFE modules only (`const X = (() => { ... })()`), no ES module import/export

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| PWA + PWA Builder for APK | No Android toolchain needed, offline-first by design | ✓ Good — packaging works with /ConGames/ paths |
| Vanilla JS, no framework | No build step, simple to debug, works offline trivially | ✓ Good — 15K LOC, no build issues |
| Pure CSS card rendering | No image assets needed, responsive, smaller APK | ✓ Good — shared across 3 card games |
| Tailwind via CDN | Utility CSS without npm, cached by service worker | ✓ Good |
| IIFE module pattern | No ESM support needed, works in all browsers | ✓ Good — consistent across all 5 games |
| Build card renderer before card games | Shared dependency for 3 games, avoids duplication | ✓ Good — reused perfectly |
| MS-style green felt theme | Familiar card game feel for older user | ✓ Good — approved during verification |
| Parchment theme for puzzle games | Readable light theme for Woord Soek and Sudoku | ✓ Good — better contrast for text |
| Zone-based move addressing (Solitaire) | Uniform from/to objects for all move types | ✓ Good — clean undo implementation |
| Seeded PRNG for FreeCell deals | Reproducible deals, replay same game | ✓ Good |
| /ConGames/ path prefix | GitHub Pages subdirectory hosting requirement | ✓ Good — all paths work |
| Split icon purpose entries | PWABuilder compatibility (any + maskable separately) | ✓ Good |

---
*Last updated: 2026-03-19 after v1.1 milestone start*
