# Phase 3: Woord Soek - Research

**Researched:** 2026-03-08
**Domain:** Word search puzzle game — grid generation, touch interaction, vanilla JS
**Confidence:** HIGH

## Summary

Phase 3 implements a complete Afrikaans word search game within an existing PWA scaffold. The core challenge has two halves: (1) a puzzle engine that places words in 8 directions on a variable-size grid with collision handling, and (2) a touch-optimized UI with tap-tap selection, a preview line, word highlighting with cycling colours, and a togglable word list layout. All infrastructure is in place — Router, Settings, Audio, shared CSS, the win-overlay, and toast system are ready. The `words.json` file contains 7,732 Afrikaans words; analysis shows 5,000 words are 3-8 characters long, providing ample material for all difficulty levels.

The architecture is single-page: the Woord Soek screen is already a `<section data-screen="woordsoek">` in `index.html`. The engine and UI go in `games/woordsoek/engine.js` and `games/woordsoek/ui.js`, loaded as IIFEs via `<script>` tags. No build step, no ESM imports. The game fetches `words.json` once, filters by word length appropriate to grid size, places words with backtracking-retry, and fills remaining cells with common Afrikaans letters.

**Primary recommendation:** Build engine.js first (pure logic, testable), then ui.js (rendering + touch interaction), wiring into existing Router/Settings/Audio hooks. The difficulty modal reuses the win-overlay CSS pattern.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Selection interaction:** Tap-tap only (no drag/swipe). First tap fills cell with colour. Preview line shows faint highlighted cells along valid direction as finger moves. Invalid second tap resets silently (new tap becomes first letter). No error messages or red flashes.
- **Found word highlighting:** Coloured cell background fill. 6-8 distinct colours cycling. Overlapping cells: last found word wins colour. Word list: plain strikethrough, no colour matching.
- **Word list panel position:** Toggle switch for right-side (landscape default ~35%) vs below-grid layout. Store preference in Settings.
- **Difficulty & grid config:** Modal on entry and "Nuwe Raaisel". Three levels: Maklik (10x10, 8 words), Medium (12x12, 12 words), Moeilik (15x15, 18 words). Afrikaans labels. Remember last difficulty. Modal always shows; header button to re-open.
- **Completion & replay:** Win overlay with "Baie goed!", time, words found. Buttons: "Nuwe Raaisel" + "Tuis". Optional auto-continue (Settings toggle, default off). Sounds on word found and completion. Stats via `Settings.recordWin('woordsoek', timeSeconds)`.
- **Hints:** Flash first letter of random unfound word. Unlimited.
- **New puzzle confirmation:** Confirm dialog mid-game: "Begin nuwe raaisel? Huidige vordering sal verlore gaan."

### Claude's Discretion
- Exact highlight colour palette (must work on warm dark background)
- Grid cell sizing and spacing for 10.4" tablet
- Preview line visual style (opacity, colour)
- Timer and counter placement in header
- Animation timing and easing for highlights
- Difficulty modal styling (can reuse win-overlay)

### Deferred Ideas (OUT OF SCOPE)
- Light/dark theme toggle (Phase 9)
- Word categories in Woord Soek (Phase 9)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| WS-01 | User can start a new puzzle with 10-15 words in a 12x12 grid | Engine word placement algorithm; difficulty config maps grid sizes to word counts |
| WS-02 | Words placed in all 8 directions with collision-safe placement | Direction vectors pattern; collision-only-on-matching-letter logic |
| WS-03 | User can select word by tapping first then last letter | Tap-tap selection state machine; preview line rendering |
| WS-04 | Found words highlighted on grid with unique colours + struck through in list | Cycling colour palette; cell background highlighting; strikethrough CSS |
| WS-05 | Sound on word found and puzzle complete | Existing `Audio.play('word_found')` and `Audio.play('board_finished')` |
| WS-06 | Hint flashes first letter of random unfound word | CSS flash animation; random selection from remaining words |
| WS-07 | "Nuwe Raaisel" button with new puzzle | Confirm dialog mid-game; difficulty modal flow |
| WS-08 | Timer counts up + word counter shows X of Y | setInterval timer; counter in header |
| PLT-03 | Sound toggle accessible from settings | Already built in settings panel |
| PLT-04 | Game timer + stats on welcome buttons | Timer in game; `Settings.recordWin()` already updates stats chips |
| PLT-05 | Back button returns to welcome screen | `Router.back()` already wired on placeholder |
| PLT-06 | All tap targets minimum 56px | Grid cell sizing math; `--tap-min` CSS variable |
| PLT-07 | Text readable at arm's length on 10.4" tablet | Font sizing via CSS variables; clamp-based scaling |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla JS (IIFE) | ES2020 | All game logic | Project constraint — no build step, no ESM |
| CSS custom properties | N/A | Theming, sizing | Already established in shared.css |
| Tailwind CDN | Play CDN | Utility classes if needed | Already loaded in index.html |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `js/router.js` | Built | Screen navigation + lifecycle | `Router.onEnter/onLeave('woordsoek', fn)` |
| `js/settings.js` | Built | Persist difficulty, layout pref, auto-continue | `Settings.get/set()` |
| `js/audio.js` | Built | Sound effects | `Audio.play('word_found')`, `Audio.play('board_finished')` |
| `window.showToast()` | Built | Brief notifications | Auto-continue toast, hint feedback |
| `window.formatTime()` | Built | Timer display | Format elapsed seconds as M:SS |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom word placement | Third-party word search lib | Unnecessary dependency; custom is simple enough and required for offline |
| CSS Grid for puzzle grid | HTML table or canvas | CSS Grid is semantic, accessible, and responsive; canvas harder to style |

**Installation:** None needed. All dependencies are already in the project.

## Architecture Patterns

### Project Structure
```
games/woordsoek/
├── engine.js       # Pure logic: word selection, grid generation, placement, validation
└── ui.js           # DOM rendering, touch handling, timer, state management
```

Both loaded as `<script>` tags in `index.html`. Engine exposes a global `WoordSoekEngine`, UI exposes `WoordSoekUI`. The `#screen-woordsoek` section in `index.html` gets its inner HTML replaced.

### Pattern 1: Engine as Pure Data Module (IIFE)
**What:** Engine handles all game logic with no DOM access. Returns data structures the UI renders.
**When to use:** Always — keeps logic testable and separated from rendering.
**Example:**
```javascript
const WoordSoekEngine = (() => {
  // Direction vectors: [rowDelta, colDelta]
  const DIRECTIONS = {
    NORTH:      [-1,  0],
    SOUTH:      [ 1,  0],
    EAST:       [ 0,  1],
    WEST:       [ 0, -1],
    NORTH_EAST: [-1,  1],
    NORTH_WEST: [-1, -1],
    SOUTH_EAST: [ 1,  1],
    SOUTH_WEST: [ 1, -1],
  };

  function generatePuzzle(words, rows, cols, wordCount) {
    // 1. Filter words that fit in grid (length <= max(rows, cols))
    // 2. Shuffle and pick wordCount words
    // 3. Place each word with random position + direction
    // 4. Fill empty cells with random Afrikaans-friendly letters
    // Returns: { grid: [][], placedWords: [{ word, row, col, direction }] }
  }

  function checkSelection(startRow, startCol, endRow, endCol, placedWords) {
    // Validate that start->end forms a valid line matching a placed word
    // Returns: { found: true, word: '...' } or { found: false }
  }

  return { generatePuzzle, checkSelection, DIRECTIONS };
})();
```

### Pattern 2: UI State Machine for Tap Selection
**What:** The selection flow is a simple state machine: IDLE -> FIRST_SELECTED -> (validate second tap) -> IDLE.
**When to use:** Always for the tap-tap interaction.
**Example:**
```javascript
// Selection states
let selectionState = 'idle'; // 'idle' | 'first_selected'
let firstCell = null;        // { row, col }

function onCellTap(row, col) {
  if (selectionState === 'idle') {
    firstCell = { row, col };
    selectionState = 'first_selected';
    highlightFirstCell(row, col);
  } else {
    // Check if second tap is in a valid 8-direction line from first
    const direction = getDirection(firstCell.row, firstCell.col, row, col);
    if (direction) {
      const result = WoordSoekEngine.checkSelection(
        firstCell.row, firstCell.col, row, col, placedWords
      );
      if (result.found) {
        markWordFound(result.word);
      }
    }
    // Always reset — invalid tap silently starts new selection
    clearFirstCellHighlight();
    selectionState = 'idle';
    // If this tap didn't find a word, treat it as new first tap
    if (!result || !result.found) {
      firstCell = { row, col };
      selectionState = 'first_selected';
      highlightFirstCell(row, col);
    }
  }
}
```

### Pattern 3: Router Lifecycle Hooks
**What:** Use `Router.onEnter` and `Router.onLeave` for game init/cleanup.
**When to use:** Every game screen.
**Example:**
```javascript
Router.onEnter('woordsoek', () => {
  // Show difficulty modal, load words if not loaded, start game
  WoordSoekUI.init();
});

Router.onLeave('woordsoek', () => {
  // Stop timer, cleanup event listeners
  WoordSoekUI.cleanup();
});
```

### Pattern 4: CSS Grid for the Puzzle Grid
**What:** Use CSS Grid for the letter grid — `grid-template-columns: repeat(N, 1fr)` where N is the grid width.
**When to use:** Always for the puzzle grid.
**Example:**
```css
.ws-grid {
  display: grid;
  /* Set dynamically based on difficulty */
  grid-template-columns: repeat(var(--ws-cols, 12), 1fr);
  gap: 2px;
  aspect-ratio: 1;
  max-height: calc(100vh - 80px); /* leave room for header */
}

.ws-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-body);
  font-weight: 700;
  font-size: clamp(0.85rem, 2.5vw, 1.3rem);
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  cursor: pointer;
  min-width: 0; /* allow grid to shrink */
  min-height: var(--tap-min); /* 56px minimum */
  user-select: none;
  transition: background var(--dur-fast);
}
```

### Anti-Patterns to Avoid
- **Canvas for the grid:** CSS Grid is simpler, accessible, and supports individual cell styling for highlights. Canvas would require custom hit testing and no CSS transitions.
- **ESM import/export:** Project uses IIFE pattern. Never `import` or `export`.
- **Drag-based selection:** User decision explicitly says tap-tap only. No `touchmove` selection.
- **Blocking word load:** `words.json` is 7,732 entries. Fetch it async and cache in memory. Do not block UI.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | Custom popup system | `window.showToast()` | Already built, consistent |
| Win celebration | Custom modal | `.win-overlay` + `.win-card` CSS | Already styled and animated |
| Sound playback | Manual AudioContext management | `Audio.play('word_found')` | Already handles context resume, preloading |
| Settings persistence | Custom localStorage wrapper | `Settings.get/set()` | Already built with prefix scoping |
| Screen navigation | Manual DOM show/hide | `Router.go()`, `Router.back()` | Already handles history, onEnter/onLeave |
| Timer formatting | Manual string formatting | `window.formatTime(seconds)` | Already built |
| Stats recording | Custom stats logic | `Settings.recordWin('woordsoek', seconds)` | Already handles wins, played, bestTime |

**Key insight:** Phase 1-2 built extensive infrastructure specifically for game screens. Using it ensures consistency and avoids duplication.

## Common Pitfalls

### Pitfall 1: Words Not Fitting in Grid
**What goes wrong:** Trying to place 18 words in a 15x15 grid with all 8 directions — many long words won't fit, or placement fails after too many retries.
**Why it happens:** Random placement with backtracking can stall if words are too long for the grid.
**How to avoid:** Filter `words.json` by length before selection. For a 10x10 grid, use words 3-8 chars. For 12x12, use 4-10. For 15x15, use 4-12. Shuffle filtered words, attempt placement with a retry limit per word (e.g., 100 attempts), and pick replacement words from the pool if placement fails. Always have more candidate words than needed.
**Warning signs:** Puzzle generation takes >500ms or fails entirely.

### Pitfall 2: Invalid Direction Detection
**What goes wrong:** Second tap doesn't align with any of the 8 compass directions from the first tap, but code tries to force a direction.
**How to avoid:** Calculate `deltaRow = endRow - startRow` and `deltaCol = endCol - startCol`. Valid directions require: `deltaRow === 0` OR `deltaCol === 0` OR `abs(deltaRow) === abs(deltaCol)`. If none match, the tap is invalid. Use `Math.sign()` to normalize to direction unit vector.
**Warning signs:** Words found at wrong positions or diagonal detection failing.

### Pitfall 3: Touch Event Handling on Tablet
**What goes wrong:** `click` events have 300ms delay on mobile; touch events fire but coordinates are wrong.
**Why it happens:** Mobile browsers delay click to distinguish tap from double-tap.
**How to avoid:** The project already has `touch-action: manipulation` on body (disables double-tap zoom, removes 300ms delay). Use `click` events on the grid cells — they will fire promptly. For the preview line (showing direction as finger moves after first tap), use `touchmove`/`mousemove` on the grid container.
**Warning signs:** Tap feels laggy; preview line doesn't track finger.

### Pitfall 4: Grid Cell Size vs 56px Minimum
**What goes wrong:** 15x15 grid on a 10.4" tablet — cells might be smaller than 56px.
**Why it happens:** Available grid area divided by 15 may be less than 56px per cell.
**How to avoid:** Calculate: tablet viewport in landscape is ~2000x1200. Grid area is ~65% width = 1300px, minus padding. For 15 columns: 1300/15 = 86px (safe). For height: available ~1100px / 15 = 73px (safe). But if word list is beside grid in landscape, width shrinks. With 65% width: 1300px / 15 = 86px per cell (still fine). When word list is below, grid gets full width — even safer. Monitor actual cell size in devtools.
**Warning signs:** Cells below 56px in Chrome DevTools at 2000x1200.

### Pitfall 5: words.json Contains Special Characters
**What goes wrong:** Some words contain hyphens (`-`) and colons (`:`) which shouldn't appear in a word search grid.
**Why it happens:** The word list was extracted from an APK and includes compound words and abbreviations.
**How to avoid:** Filter words during loading: reject any word containing non-alphabetic characters (`/[^a-zA-Z]/`). Also filter by length range appropriate to difficulty.
**Warning signs:** Grid displays hyphens or colons; word matching fails on special chars.

### Pitfall 6: Afrikaans Letters - No Q in Common Use
**What goes wrong:** Fill letters include Q, X, or other letters uncommon in Afrikaans, making the puzzle look obviously non-Afrikaans.
**Why it happens:** Using uniform random A-Z for fill characters.
**How to avoid:** Use weighted letter distribution for fill characters. Common Afrikaans letters: A, E, I, O, S, T, N, R, D, L, K, G. Avoid Q (not in dataset at all), minimize X (rare). The dataset confirms: unique chars are A-Z minus Q, plus hyphen/colon (which we filter).
**Warning signs:** Grid looks unnatural with too many Q/X/Z cells.

### Pitfall 7: Service Worker Cache
**What goes wrong:** `sw.js` already lists `games/woordsoek/engine.js` and `games/woordsoek/ui.js` in CORE_ASSETS, but the files don't exist yet. SW install will fail.
**Why it happens:** SW was pre-configured with all future file paths.
**How to avoid:** These files MUST be created as part of this phase. The SW will work once the files exist. No changes to sw.js needed.
**Warning signs:** SW install error in console during development — expected until files are created.

## Code Examples

### Word Placement Algorithm
```javascript
// Place a single word in the grid, returning true on success
function placeWord(grid, word, rows, cols) {
  const dirKeys = Object.keys(DIRECTIONS);
  // Shuffle directions for variety
  shuffle(dirKeys);

  for (const dirName of dirKeys) {
    const [dr, dc] = DIRECTIONS[dirName];
    const len = word.length;

    // Calculate valid starting positions for this direction
    const startRows = dr > 0 ? range(0, rows - len) :
                      dr < 0 ? range(len - 1, rows) :
                      range(0, rows);
    const startCols = dc > 0 ? range(0, cols - len) :
                      dc < 0 ? range(len - 1, cols) :
                      range(0, cols);

    // Shuffle start positions
    const positions = [];
    for (const r of startRows) {
      for (const c of startCols) {
        positions.push([r, c]);
      }
    }
    shuffle(positions);

    for (const [startR, startC] of positions) {
      if (canPlace(grid, word, startR, startC, dr, dc)) {
        doPlace(grid, word, startR, startC, dr, dc);
        return { word, row: startR, col: startC, direction: dirName };
      }
    }
  }
  return null; // Could not place this word
}

function canPlace(grid, word, startR, startC, dr, dc) {
  for (let i = 0; i < word.length; i++) {
    const r = startR + i * dr;
    const c = startC + i * dc;
    const cell = grid[r][c];
    if (cell !== null && cell !== word[i].toUpperCase()) {
      return false; // Collision with different letter
    }
  }
  return true;
}
```

### Direction Validation (for tap-tap selection)
```javascript
function getDirection(r1, c1, r2, c2) {
  const dr = r2 - r1;
  const dc = c2 - c1;
  if (dr === 0 && dc === 0) return null; // Same cell

  // Must be horizontal, vertical, or 45-degree diagonal
  if (dr !== 0 && dc !== 0 && Math.abs(dr) !== Math.abs(dc)) return null;

  return {
    dr: Math.sign(dr),
    dc: Math.sign(dc),
    length: Math.max(Math.abs(dr), Math.abs(dc)) + 1
  };
}
```

### Highlight Colour Palette (for warm dark background)
```javascript
// 8 colours that are visible on --bg-base (#1a1610) and --bg-surface (#252018)
const HIGHLIGHT_COLOURS = [
  'rgba(91, 155, 213, 0.45)',   // Blue
  'rgba(76, 175, 120, 0.45)',   // Green
  'rgba(224, 150, 60, 0.45)',   // Orange
  'rgba(180, 100, 200, 0.45)',  // Purple
  'rgba(230, 80, 80, 0.45)',    // Red
  'rgba(60, 200, 200, 0.45)',   // Teal
  'rgba(220, 200, 60, 0.45)',   // Yellow
  'rgba(200, 120, 160, 0.45)',  // Pink
];
// Cycle: colourIndex = foundWordsCount % HIGHLIGHT_COLOURS.length
```

### Fill Letters (Afrikaans-weighted)
```javascript
// Weighted towards common Afrikaans letters
const FILL_LETTERS = 'AAABCDDEEEEFGGHIIIJKKLLMNNOOOPRRSSSSTTTTUUVWYZ';

function randomFillLetter() {
  return FILL_LETTERS[Math.floor(Math.random() * FILL_LETTERS.length)];
}
```

### Layout Toggle (right-side vs below)
```css
/* Default: grid left, word list right */
.ws-layout {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.ws-grid-container {
  flex: 0 0 65%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--gap-md);
}

.ws-word-list-panel {
  flex: 0 0 35%;
  overflow-y: auto;
  padding: var(--gap-md);
  border-left: 1px solid var(--border-subtle);
}

/* When toggled to below-grid layout */
.ws-layout.layout-below {
  flex-direction: column;
}

.ws-layout.layout-below .ws-grid-container {
  flex: 1 1 auto;
}

.ws-layout.layout-below .ws-word-list-panel {
  flex: 0 0 auto;
  max-height: 30%;
  border-left: none;
  border-top: 1px solid var(--border-subtle);
}
```

### Difficulty Modal (reusing win-overlay pattern)
```html
<div class="win-overlay" id="ws-difficulty-modal">
  <div class="win-card">
    <h2>Woord Soek</h2>
    <p>Kies moeilikheidsgraad</p>
    <div style="display:flex;flex-direction:column;gap:12px;">
      <button class="btn btn-secondary" onclick="WoordSoekUI.startGame('easy')">
        Maklik (10x10, 8 woorde)
      </button>
      <button class="btn btn-secondary" onclick="WoordSoekUI.startGame('medium')">
        Medium (12x12, 12 woorde)
      </button>
      <button class="btn btn-secondary" onclick="WoordSoekUI.startGame('hard')">
        Moeilik (15x15, 18 woorde)
      </button>
    </div>
  </div>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `touchstart` + custom 300ms delay handling | `touch-action: manipulation` + `click` | CSS property widely supported since ~2018 | No need to manually handle touch delay |
| Manual DOM manipulation for grid | CSS Grid `repeat(N, 1fr)` + CSS custom properties | CSS Grid fully supported | Responsive grid without JS calculations |
| Fisher-Yates in-place shuffle | Same — Fisher-Yates is still the standard | N/A | Correct O(n) shuffle, use it for word selection and direction randomization |

**Deprecated/outdated:**
- `onclick` attributes are used throughout the project (welcome screen, settings). Continue this pattern for consistency rather than `addEventListener` in markup.

## Open Questions

1. **Word length filtering per difficulty**
   - What we know: Words range from 4-22 characters. Grid sizes are 10, 12, 15.
   - What's unclear: Exact min/max word length per difficulty for best gameplay.
   - Recommendation: Maklik: 4-7 chars, Medium: 4-9 chars, Moeilik: 4-12 chars. This ensures words fit and aren't trivially short.

2. **Preview line on touchmove**
   - What we know: User wants faint highlighted cells showing direction after first tap.
   - What's unclear: How to determine which cells to highlight while finger moves between cells (finger position may be between cells).
   - Recommendation: On `touchmove`, calculate nearest grid cell to touch point, compute direction from first cell to that cell, and highlight all cells along that line. Update on each move event. Clear on touchend if no second tap registered.

3. **Script loading order in index.html**
   - What we know: Current pattern loads `settings.js`, `router.js`, `audio.js` in `index.html`.
   - What's unclear: Whether `engine.js` and `ui.js` should also go in `index.html` or in a separate page.
   - Recommendation: Add `<script>` tags in `index.html` after the existing shared scripts, since the project uses a single-page architecture with `data-screen` sections. The `games/woordsoek/index.html` files listed in CORE_ASSETS should be empty stubs or redirects to maintain SW compatibility, OR remove them from SW and load scripts directly in `index.html`.

## Sources

### Primary (HIGH confidence)
- Project codebase: `index.html`, `css/shared.css`, `js/router.js`, `js/settings.js`, `js/audio.js` — full analysis of existing patterns and APIs
- `words.json` — direct analysis: 7,732 words, lengths 4-22, chars A-Z plus hyphen/colon, no Q
- `sw.js` — CORE_ASSETS pre-lists woordsoek files

### Secondary (MEDIUM confidence)
- Word search puzzle generation algorithms — well-established computer science pattern (backtracking placement with collision detection)
- CSS Grid layout — stable web platform feature, fully supported on Android 10+ Chrome

### Tertiary (LOW confidence)
- Afrikaans letter frequency distribution — the fill letter weights are estimated from the word list character analysis rather than formal linguistic corpus data. The recommendation (heavy on A, E, I, O, S, T, N, R) is reasonable but could be refined.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No external libraries needed; all infrastructure already built and verified by reading source
- Architecture: HIGH - Follows established project patterns (IIFE, Router hooks, shared CSS); grid generation is a well-understood algorithm
- Pitfalls: HIGH - Identified through direct code analysis (special chars in words.json, SW cache, touch events, grid sizing math)

**Research date:** 2026-03-08
**Valid until:** 2026-04-08 (stable — no external dependencies to change)
