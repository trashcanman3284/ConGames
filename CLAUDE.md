# CLAUDE.md — Con se Speletjies

> This file is read by Claude Code at the start of every session.
> Keep it updated as the project evolves.

---

## PROJECT STATUS

```
╔══════════════════════════════════════════════════════════════╗
║  PROJECT STATUS                                              ║
╠══════════════════════════════════════════════════════════════╣
║  Building: Five-game offline PWA for Con's tablet            ║
║                                                              ║
║  Phase: 8 of 9 — FreeCell (NEXT)                             ║
║  Progress: [███████░░░] 70% (7 of 9 phases done)            ║
║                                                              ║
║  Last activity: 2026-03-09 — Sudoku verified                 ║
╚══════════════════════════════════════════════════════════════╝

Completed: Scaffold, Welcome Screen, Woord Soek, Card Renderer, Solitaire, Spider, Sudoku
Remaining: FreeCell, APK Packaging
Next up:   Phase 8 — FreeCell
```

---

## What This Is

A personal Android game suite for Dewald's dad. Five classic games in a single offline-first PWA, packaged as an APK via PWA Builder and sideloaded onto a Samsung Galaxy Tab S6 Lite (10.4", landscape, Android 10+).

**Developer is in Canada. Dad is in South Africa.**
Updates are pushed remotely via GitHub Pages — dad's tablet auto-updates on next launch when on WiFi. The APK only needs to be sideloaded once.

**The Five Games:**
1. **Woord Soek** — Afrikaans word search (7,732 words in `words.json`) ✅
2. **Solitaire** — Klondike ✅
3. **Spider Solitaire** — 1/2/4 suit modes
4. **Sudoku** — Easy / Medium / Hard / Expert
5. **FreeCell** — Almost every deal winnable

**This is NOT for the Play Store.** It's a personal family project. Sideloaded only.

---

## Target User & Device

| | |
|---|---|
| User | Older adult, non-technical, plays on tablet |
| Device | Samsung Galaxy Tab S6 Lite |
| Screen | 10.4 inch, landscape |
| Android | 10+ |
| Priority | Readability + large tap targets (min 56px) |
| Language | Afrikaans UI preferred where possible |

**Design rule:** If a button feels small to you, it's too small for Dad.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| UI | HTML + CSS + Vanilla JS | No build step, works offline |
| Styling | Tailwind CSS via CDN | No npm needed |
| Fonts | Google Fonts (Playfair Display + Nunito) | Cached by SW |
| Card rendering | Pure CSS | No image assets needed |
| Sudoku generator | JS backtracking | Self-contained |
| Word data | `words.json` (7,732 Afrikaans words) | Pre-extracted from APK |
| Audio | HTML5 Web Audio API | `word_found.mp3`, `board_finished.mp3` |
| Hosting | GitHub Pages (public repo) | Free, auto-deploys on push |
| Packaging | PWA Builder (pwabuilder.com) | No Android toolchain |
| Distribution | Sideload APK (one time only) | No Play Store |

**No build pipeline. No npm. No bundler.** Raw HTML/CSS/JS that runs from `python3 -m http.server 8080`.

---

## Hosting & Updates (IMPORTANT)

### How Updates Reach Dad's Tablet

```
Dewald (Canada) → git push → GitHub Pages → Dad's tablet (SA) auto-updates on next launch
```

- The APK is a thin shell pointing to the **GitHub Pages URL**
- All game logic lives on GitHub Pages — not bundled in the APK
- Dad installs the APK **once** — never needs to resideload for game/content updates
- The PWA service worker (`sw.js`) handles silent background updates
- Dad's tablet must be on WiFi for updates to download

### GitHub Pages Setup

- **Repo:** public (required for free GitHub Pages)
- **Pages source:** `main` branch → `/ (root)`
- **Pages URL:** `https://trashcanman3284.github.io/ConGames/` ← UPDATE THIS when confirmed
- **Auto-deploy:** push to `main` triggers GitHub Pages rebuild automatically

### Everyday Update Workflow

```bash
cd /home/trashdev/projects/congames
# make changes...
git add .
git commit -m "describe what changed"
git push origin main
# GitHub Pages deploys in ~1 min — tablet picks up on next launch
```

### GitHub Actions Deploy Workflow

File: `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

### When a Resideload IS Needed
Only required if changing APK-shell-level properties:
- App icon
- App name
- Orientation lock
- Android target SDK bump

Everything else updates via `git push`.

---

## Project Structure

```
/home/trashdev/projects/congames/
├── CLAUDE.md               ← You are here
├── index.html              ← Welcome screen (entry point)
├── manifest.json           ← PWA manifest
├── sw.js                   ← Service worker (offline + auto-update)
├── words.json              ← 7,732 Afrikaans words ✅
├── word_found.mp3          ← Sound effect ✅
├── board_finished.mp3      ← Sound effect ✅
├── .github/
│   └── workflows/
│       └── deploy.yml      ← Auto-deploy to GitHub Pages on push
├── css/
│   └── shared.css          ← Design system (colours, tokens, components)
├── js/
│   ├── router.js           ← Screen navigation
│   ├── settings.js         ← localStorage wrapper + stats
│   └── audio.js            ← Web Audio API module
└── games/
    ├── woordsoek/          ✅ Complete
    │   ├── index.html
    │   ├── engine.js
    │   └── ui.js
    ├── solitaire/          ✅ Complete
    │   ├── index.html
    │   ├── engine.js
    │   └── ui.js
    ├── spider/             🔲 Next
    │   ├── index.html
    │   ├── engine.js
    │   └── ui.js
    ├── sudoku/             🔲
    │   ├── index.html
    │   ├── engine.js
    │   └── ui.js
    └── freecell/           🔲
        ├── index.html
        ├── engine.js
        └── ui.js
```

---

## Design System

**Theme:** Warm dark — cosy evening gaming feel
**Palette:** Deep brown-black background, amber/gold accents
**Fonts:** Playfair Display (headings) + Nunito (body)

Key CSS variables (all defined in `css/shared.css`):
```css
--bg-base:       #1a1610   /* Darkest background */
--bg-surface:    #252018   /* Cards, panels */
--accent-gold:   #d4a23a   /* Primary accent */
--text-primary:  #f0e6d0   /* Main text */
--tap-min:       56px      /* Minimum tap target */
--font-display:  'Playfair Display', serif
--font-body:     'Nunito', sans-serif
```

---

## Shared Modules

These are built once and used everywhere. Do NOT reinvent them per game.

| Module | File | Purpose |
|---|---|---|
| Router | `js/router.js` | `Router.go('sudoku')`, `Router.back()` |
| Settings | `js/settings.js` | `Settings.get/set()`, `Settings.recordWin()` |
| Audio | `js/audio.js` | `Audio.play('word_found')` |
| Toast | `window.showToast()` | Defined in `index.html` |
| Time format | `window.formatTime(seconds)` | Defined in `index.html` |

---

## Build Phases

| Phase | Status | Description |
|---|---|---|
| 1 | ✅ Done | Scaffold: shared CSS, router, settings, audio, PWA shell |
| 2 | ✅ Done | Welcome screen with 5 game buttons |
| 3 | ✅ Done | Woord Soek — engine + UI |
| 4 | ✅ Done | Card renderer (shared by Solitaire, Spider, FreeCell) |
| 5 | ✅ Done | Solitaire (Klondike) — verified & pushed 2026-03-09 |
| 6 | 🔲 Next | Spider Solitaire (1/2/4 suit modes) |
| 7 | 🔲 | Sudoku |
| 8 | 🔲 | FreeCell |
| 9 | 🔲 | Android packaging via PWA Builder → sideload |
| 10 | 🔲 | Nice-to-haves (stats, best times, categories) |

---

## Spider — Spec (Phase 6)

- 10 tableau columns, 8 decks (104 cards total), 5 deal piles
- Difficulty: 1 suit (easy), 2 suits (medium), 4 suits (hard)
- Can move any descending sequence regardless of suit
- Complete sequence (K→A same suit) auto-removes to foundation
- Unlimited undo
- Difficulty selector on game start
- Uses shared card renderer — do NOT rebuild cards from scratch

---

## Sudoku — Spec (Phase 7)

- 9×9 grid with standard Sudoku rules
- Generator: backtracking (fill complete grid → remove cells by difficulty)
- Difficulty by revealed cell count:
  - Easy: ~45 cells revealed
  - Medium: ~35
  - Hard: ~27
  - Expert: ~22
- Unique solution guaranteed
- Number pad (1–9 + erase)
- Notes/pencil mode (small numbers per cell)
- Highlight: tap a number → highlight same number across grid
- Hint: reveal one correct cell
- Check: flash incorrect cells red
- Timer + pause

---

## FreeCell — Spec (Phase 8)

- 8 tableau columns, 4 free cells (top left), 4 foundations (top right)
- Standard FreeCell rules: any single card to free cell, ordered sequences to tableau
- Multi-card move: can move N cards if enough free cells/columns (formula: (freeCells+1) × 2^emptyCols)
- Auto-move to foundation when safe
- Unlimited undo
- Deal number display (seed-based so Dad can retry same deal)
- Uses shared card renderer — do NOT rebuild cards from scratch

---

## Woord Soek — Spec (for reference, complete)

**Engine:**
- Load words from `words.json` (array of Afrikaans strings)
- Place N words in a W×H grid in all 8 directions (N/S/E/W/NE/NW/SE/SW)
- Fill remaining cells with random Afrikaans-friendly letters (no Q, X)
- Configurable grid size (default 12×12) and word count (default 10–15)
- Collision allowed only if letters match

**UI:**
- Landscape: grid left (~65%), word list right (~35%)
- Tap first letter → tap last letter selection
- Found words: highlighted on grid (unique colour) + struck through in list
- Timer (counts up), word counter (X of Y found)
- "Nuwe Raaisel" button, Hint button
- Sound: `Audio.play('word_found')` on find, `Audio.play('board_finished')` on complete

---

## Solitaire — Spec (for reference, complete)

- 52-card deck, 7 tableau columns, 4 foundations (♠♥♦♣), stock + waste
- Alternating colour, descending rank for tableau
- Ascending same-suit for foundation (A→K)
- Auto-complete when all cards visible
- Unlimited undo (stack-based)
- Tap card → auto-move to best target
- Win animation + stats

---

## Card Rendering (shared by Solitaire, Spider, FreeCell) ✅

Already built. Do NOT rebuild. Use existing CSS classes:

```html
<div class="card rank-A suit-hearts face-up">
  <span class="card-corner top">A♥</span>
  <span class="card-center">♥</span>
  <span class="card-corner bottom">A♥</span>
</div>
<div class="card face-down"></div>
```

---

## Dev Environment

```bash
# Start local server (run from project root)
cd /home/trashdev/projects/congames
python3 -m http.server 8080

# Test in Chrome DevTools:
# Device: Custom, 2000x1200, landscape, touch enabled
```

Files served from `/home/trashdev/projects/congames/`.
VS Code Remote SSH → devbox → port-forwarded → `localhost:8080` on laptop Chrome.

---

## Common Gotchas

1. **No build step** — Never use `import`/`export` ESM syntax. Use IIFE modules (`const X = (() => { ... })()`)
2. **Offline first** — Every file listed in `sw.js` CORE_ASSETS must exist before PWA Builder
3. **Touch events** — Use both `touchstart` + `click` for tablet compatibility
4. **AudioContext** — Must be created/resumed on user gesture (iOS/Android policy)
5. **Service worker** — Won't register on `file://`. Always test via `http.server`
6. **Tailwind CDN** — Uses Play CDN (`https://cdn.tailwindcss.com`) — no build needed
7. **Font loading** — Google Fonts may not load offline; SW caches the font CSS but not always the font files. Use system font fallbacks.
8. **GitHub Pages** — Changes take ~1 min to deploy after `git push`. Clear browser cache if changes don't appear.
9. **SW cache busting** — Bump the cache version in `sw.js` when deploying significant updates so the service worker invalidates stale cache on dad's tablet.

---

## Definition of Done — Each Game

- [ ] Fully playable, no JS errors in console
- [ ] Works in Chrome DevTools tablet emulation (2000×1200, touch)
- [ ] Back button returns to welcome screen
- [ ] Win condition detected + animation shown
- [ ] Stats recorded via `Settings.recordWin(gameId, timeSeconds)`
- [ ] Sound effects play (if sound enabled)
- [ ] No hardcoded font sizes — uses CSS variables
- [ ] Minimum 56px tap targets throughout
- [ ] Committed and pushed to `main` (triggers GitHub Pages deploy)

---

## APK Packaging (Phase 9)

**The APK points to GitHub Pages — not localhost.**

1. Confirm GitHub Pages URL is live and app loads correctly in mobile Chrome
2. Ensure all files in `sw.js` CORE_ASSETS exist and are cached
3. Verify app works fully offline after first load (disable network in DevTools)
4. Go to **pwabuilder.com** on laptop browser
5. Enter the **GitHub Pages URL** (not localhost)
6. Download Android package → sign with debug key
7. Transfer APK to tablet → sideload once
8. All future updates via `git push` — no resideload needed

---

## Nice-to-Haves (Phase 10 — only if time permits)

- Best times / win streaks per game (already tracked in Settings)
- FreeCell deal number entry (retry specific deals)
- Woord Soek word categories (if `words.json` supports grouping)
- Sudoku daily puzzle (date-seeded RNG)
- Colour theme options (dark/sepia/high-contrast)
- Font size setting (already wired in Settings + welcome screen)