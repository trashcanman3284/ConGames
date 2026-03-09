# CLAUDE.md — Dad se Speletjies

> This file is read by Claude Code at the start of every session.
> Keep it updated as the project evolves.

---

## What This Is

A personal Android game suite for Dewald's dad. Five classic games in a single offline-first PWA, packaged as an APK via PWA Builder and sideloaded onto a Samsung Galaxy Tab S6 Lite (10.4", landscape, Android 10+).

**The Five Games:**
1. **Woord Soek** — Afrikaans word search (7,732 words in `words.json`)
2. **Solitaire** — Klondike
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
| Packaging | PWA Builder (pwabuilder.com) | No Android toolchain |
| Distribution | Sideload APK | No Play Store |

**No build pipeline. No npm. No bundler.** Raw HTML/CSS/JS that runs from `python3 -m http.server 8080`.

---

## Project Structure

```
/home/trashdev/projects/congames/
├── CLAUDE.md               ← You are here
├── index.html              ← Welcome screen (entry point)
├── manifest.json           ← PWA manifest
├── sw.js                   ← Service worker (offline)
├── words.json              ← 7,732 Afrikaans words ✅
├── word_found.mp3          ← Sound effect ✅
├── board_finished.mp3      ← Sound effect ✅
├── css/
│   └── shared.css          ← Design system (colours, tokens, components)
├── js/
│   ├── router.js           ← Screen navigation
│   ├── settings.js         ← localStorage wrapper + stats
│   └── audio.js            ← Web Audio API module
└── games/
    ├── woordsoek/
    │   ├── index.html
    │   ├── engine.js       ← Puzzle generator, word placement (8 directions)
    │   └── ui.js           ← Grid render, touch drag/tap selection
    ├── solitaire/
    │   ├── index.html
    │   ├── engine.js       ← 52-card deck, Klondike rules
    │   └── ui.js
    ├── spider/
    │   ├── index.html
    │   ├── engine.js       ← 10 columns, 8 decks, 1/2/4 suit modes
    │   └── ui.js
    ├── sudoku/
    │   ├── index.html
    │   ├── engine.js       ← Backtracking generator, 4 difficulty levels
    │   └── ui.js
    └── freecell/
        ├── index.html
        ├── engine.js       ← FreeCell rules, multi-card move calc
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
| 3 | 🔲 Next | Woord Soek — engine + UI |
| 4 | 🔲 | Solitaire (Klondike) |
| 5 | 🔲 | Spider Solitaire |
| 6 | 🔲 | Sudoku |
| 7 | 🔲 | FreeCell |
| 8 | 🔲 | Android packaging via PWA Builder |
| 9 | 🔲 | Nice-to-haves (stats, best times, categories) |

---

## Woord Soek — Spec (Phase 3)

**Engine requirements:**
- Load words from `words.json` (array of Afrikaans strings)
- Place N words in a W×H grid in all 8 directions (N/S/E/W/NE/NW/SE/SW)
- Fill remaining cells with random Afrikaans-friendly letters (no Q, X — use common letters)
- Configurable grid size (default 12×12) and word count (default 10–15)
- Collision allowed only if letters match

**UI requirements:**
- Landscape: grid left (~65%), word list right (~35%)
- Selection: tap first letter → tap last letter (no drag required, but drag is nice-to-have)
- Found words: highlighted on grid (each word gets unique colour) + struck through in list
- Timer (counts up), word counter (X of Y found)
- "Nuwe Raaisel" button (new puzzle)
- Hint button (flash first letter of a random unfound word)
- Sound: `Audio.play('word_found')` on find, `Audio.play('board_finished')` on complete

**Original APK directions (match exactly):**
NORTH, SOUTH, EAST, WEST, NORTH_EAST, NORTH_WEST, SOUTH_EAST, SOUTH_WEST

---

## Solitaire — Spec (Phase 4)

- 52-card deck, 7 tableau columns, 4 foundations (♠♥♦♣), stock + waste
- Alternating colour, descending rank for tableau
- Ascending same-suit for foundation (A→K)
- Auto-complete when all cards visible
- Unlimited undo (stack-based)
- Tap card → auto-move to best target (or highlight valid columns)
- Win animation + stats

---

## Spider — Spec (Phase 5)

- 10 tableau columns, 8 decks (104 cards total), 5 deal piles
- Difficulty: 1 suit (easy), 2 suits (medium), 4 suits (hard)
- Can move any descending sequence regardless of suit
- Complete sequence (K→A same suit) auto-removes to foundation
- Unlimited undo
- Difficulty selector on game start

---

## Sudoku — Spec (Phase 6)

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

## FreeCell — Spec (Phase 7)

- 8 tableau columns, 4 free cells (top left), 4 foundations (top right)
- Standard FreeCell rules: any single card to free cell, ordered sequences to tableau
- Multi-card move: can move N cards if enough free cells/columns (formula: (freeCells+1) × 2^emptyCols)
- Auto-move to foundation when safe
- Unlimited undo
- Deal number display (seed-based so Dad can retry same deal)

---

## Card Rendering (shared by Solitaire, Spider, FreeCell)

Build this BEFORE any card game. Pure CSS, no images.

```html
<!-- Card structure -->
<div class="card rank-A suit-hearts face-up">
  <span class="card-corner top">A♥</span>
  <span class="card-center">♥</span>
  <span class="card-corner bottom">A♥</span>
</div>
<div class="card face-down"></div>
```

- Red suits (♥♦): `var(--card-red)` → warm red, not neon
- Black suits (♠♣): near-black
- Card background: off-white/cream — not stark white
- Face-down: subtle pattern (CSS diagonal lines or dots)
- Card size: responsive, fills column width

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

---

## APK Packaging (Phase 8)

1. Ensure all files in `sw.js` CORE_ASSETS exist
2. All offline — no external API calls at runtime (fonts cached by SW)
3. Go to pwabuilder.com on laptop browser
4. Enter `http://localhost:8080` (or LAN IP if testing on tablet)
5. Download Android package → sign with debug key
6. Transfer APK to tablet → sideload

---

## Nice-to-Haves (Phase 9 — only if time permits)

- Best times / win streaks per game (already tracked in Settings)
- FreeCell deal number entry (retry specific deals)
- Woord Soek word categories (if `words.json` supports grouping)
- Sudoku daily puzzle (date-seeded RNG)
- Colour theme options (dark/sepia/high-contrast)
- Font size setting (already wired in Settings + welcome screen)
