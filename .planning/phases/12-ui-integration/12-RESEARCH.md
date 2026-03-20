# Phase 12: UI & Integration — Research

**Researched:** 2026-03-20
**Domain:** Vanilla JS DOM UI, HTML5 crossword interaction, PWA service worker
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Grid layout & cell sizing**
- Grid centred in the screen with clue panels below
- Cell size scales by difficulty: Easy (9x9) uses larger cells ~48px, Medium (13x13) ~36px, Hard (17x17) ~28px — all above minimum tap target when accounting for S Pen precision
- Black cells use `var(--bg-base)` (#1a1610), input cells use white/cream background for contrast
- Superscript cell numbers positioned top-left of cell, small font, semi-transparent
- Grid has thin borders between cells — classic crossword look

**Cell selection & navigation**
- Tap cell → selects it, highlights entire word in that direction with accent gold background
- Tap same cell again → toggles between Across and Down direction
- After entering a letter, cursor auto-advances to next empty cell in the current word
- If current word is complete, cursor stays (no auto-jump to another word)
- Hidden `<input>` positioned off-screen, focused on cell tap — Samsung OS handles S Pen handwriting automatically
- Input accepts single uppercase letter, ignores numbers/symbols

**Clue panel layout**
- Two-column layout below grid: "Dwarsrigting" (Across) left, "Afrigting" (Down) right
- Each clue shows number + clue text (e.g., "3. Troue viervoetige huisdier")
- Active clue highlighted with accent gold — scrolls into view if off-screen
- Tap clue → jumps to first empty cell of that word (or first cell if word complete)
- Completed clues shown with strikethrough or muted styling

**Win flow & feedback**
- Correct word: cells flash green (#4caf78) for 600ms, then lock (no further editing), play `word_found` sound
- All words complete: congratulations modal with time display, play `board_finished` sound, record via `Settings.recordWin('kruiswoord', timeSeconds)`
- Congratulations modal matches existing game modals (warm dark theme, gold accent, "Nuwe Spel" and "Tuis" buttons)
- Back button during active puzzle: confirmation dialog "Wil jy opgee? Vordering sal verlore gaan." with Ja/Nee

**Welcome screen integration**
- Game card added as 6th button in welcome screen grid, matching existing card pattern
- Icon: crossword grid emoji or puzzle piece — consistent size with other game icons
- Stats chip shows wins count and best time, same pattern as other games
- Game ID: `'kruiswoord'` for Router, Settings, and stats

**Service worker & versioning**
- Add `games/kruiswoord/engine.js`, `games/kruiswoord/ui.js`, `games/kruiswoord/clues.json` to CORE_ASSETS in `sw.js`
- Bump version in `sw.js`, `manifest.json`, and `index.html` on final commit

### Claude's Discretion
- Exact CSS class names and element IDs (follow existing conventions: `kw-` prefix)
- Timer display implementation (whether to show elapsed time during gameplay)
- Difficulty modal exact layout (follow existing Sudoku pattern)
- Grid rendering approach (DOM elements vs canvas — DOM preferred for accessibility)
- Scroll behavior for clue panels on smaller grids
- Auto-save/resume implementation (if time permits, not required)

### Deferred Ideas (OUT OF SCOPE)
- Hint system (reveal letter/word) — KW-01
- Timer display during gameplay — KW-02
- Pencil/pen mode toggle — KW-03
- Daily crossword (date-seeded) — KW-04
- Auto-save/resume mid-puzzle — nice-to-have, not required for v1.1
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UI-01 | Game card on welcome screen with stats chip | Welcome screen pattern documented — 6th button in `.game-grid`, `stats-kruiswoord` chip, `refreshStats()` must include `'kruiswoord'` |
| UI-02 | Difficulty modal on game entry (Easy/Medium/Hard) | Sudoku difficulty modal pattern is direct template — `win-overlay` + `win-card` + 3 buttons |
| UI-03 | Grid renders with black cells, white cells, superscript cell numbers | DOM grid pattern documented — `kw-cell` divs, `isBlack` check, `number` superscript via `<sup>` child element |
| UI-04 | Tap cell selects it and highlights full word in that direction | Selection state machine documented — `_selectedWord`, highlight all cells in word span with gold |
| UI-05 | Tap already-selected cell toggles between Across and Down | Direction toggle logic documented — check if cell belongs to both directions, cycle `_selectedDirection` |
| UI-06 | Tap clue jumps to first empty cell of that word | Clue click handler — find word by number+direction, find first empty cell, call `focusCell()` |
| UI-07 | Hidden input for letter entry with auto-advance | Hidden `<input>` pattern documented — `position:fixed;top:-100px`, `keydown`/`input` event handling, auto-advance logic |
| UI-08 | Correct word flashes green, locks cells, plays word_found sound | `checkWord()` API documented — flash CSS animation 600ms, `kw-cell-locked` class, `Audio.play('word_found')` |
| UI-09 | Puzzle complete triggers congratulations modal and board_finished sound | `isComplete()` + `showOverlay('kw-win-overlay')`, `Audio.play('board_finished')` |
| UI-10 | Stats recorded via Settings.recordWin('kruiswoord', timeSeconds) | `Settings.recordWin()` API confirmed working — call on win, `KruiswoordEngine.getElapsed()` provides elapsed seconds |
| UI-11 | Back button confirmation if puzzle in progress | `Router.onLeave` hook or intercept `Router.back()` — show confirm modal, gate on `_gameActive` |
| UI-12 | New game files added to sw.js CORE_ASSETS | Three paths to add: `/ConGames/games/kruiswoord/engine.js`, `ui.js`, `clues.json` |
| UI-13 | Version number incremented on final commit | Three locations: `sw.js` CACHE_NAME, `manifest.json` `"version"`, `index.html` version span |
</phase_requirements>

---

## Summary

Phase 12 is a pure DOM/CSS/JS implementation phase — no new libraries, no new patterns outside what already exists in the codebase. All the scaffolding (Router, Settings, Audio, shared CSS, win-overlay pattern) is fully operational. The primary template is `SudokuUI` for game lifecycle (difficulty modal, state management, win overlay) and `WoordSoekUI` for grid rendering and word-level highlight logic.

The crossword UI has one novel interaction not present in any existing game: the cell selection model that maintains "active word" state with Across/Down direction toggling. This is the core interaction to get right. The hidden-input S Pen pattern is the correct approach — Samsung OS routes handwriting through the standard input event pipeline automatically.

The `KruiswoordEngine` API is clean and purpose-built for this UI: `generate()` returns full grid state, `setLetter()` + `checkWord()` handle input/validation, `isComplete()` detects win, `getElapsed()` provides timing. The UI owns no game logic — pure presentation layer.

**Primary recommendation:** Model the file structure directly on `games/sudoku/ui.js` (lifecycle) and follow the exact HTML pattern of `screen-sudoku` for the screen section in `index.html`. Build `games/kruiswoord/ui.js` as a single IIFE with `init`/`cleanup` public API, Router hooks at bottom.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla JS (ES5 IIFE) | — | All game logic and DOM | No build step; CLAUDE.md mandates no ESM |
| HTML5 DOM | — | Grid rendering, input | DOM preferred over canvas for accessibility and S Pen tap targeting |
| CSS custom properties | — | Theming, transitions | All design tokens already in `css/shared.css` |

### Supporting
| Module | File | API Used |
|--------|------|----------|
| KruiswoordEngine | `games/kruiswoord/engine.js` | `generate(difficulty, clues)`, `setLetter(r, c, letter)`, `checkWord(number, direction)`, `isComplete()`, `getElapsed()` |
| Router | `js/router.js` | `Router.go(screen)`, `Router.back()`, `Router.onEnter(id, fn)`, `Router.onLeave(id, fn)` |
| Settings | `js/settings.js` | `Settings.recordWin('kruiswoord', secs)`, `Settings.getStats('kruiswoord')` |
| Audio | `js/audio.js` | `Audio.play('word_found')`, `Audio.play('board_finished')` |
| Global utilities | `index.html` | `window.showToast(msg)`, `window.formatTime(seconds)` |

**No new npm installs required.** All dependencies are already present.

---

## Architecture Patterns

### Recommended Project Structure

```
games/kruiswoord/
├── engine.js     (Phase 11 — complete)
├── clues.json    (Phase 10 — complete)
└── ui.js         (Phase 12 — new)
```

New additions to existing files:
- `index.html` — welcome button, screen section, script tags, refreshStats update
- `sw.js` — CORE_ASSETS additions + version bump
- `manifest.json` — version bump

### Pattern 1: IIFE Module Structure

Follows every existing game UI exactly.

```javascript
var KruiswoordUI = (function() {
  'use strict';

  // State
  var _els = {};
  var _state = null;          // deep clone from KruiswoordEngine.getState()
  var _clues = null;          // loaded once from clues.json
  var _gameActive = false;
  var _selectedCell = null;   // { row, col }
  var _selectedDirection = 'across';  // 'across' | 'down'
  var _selectedWord = null;   // word object from _state.words

  function el(id) {
    if (!_els[id]) _els[id] = document.getElementById(id);
    return _els[id];
  }

  function init() { /* reset state, load clues, show difficulty modal */ }
  function cleanup() { /* clear timers, reset state */ }

  return { init: init, cleanup: cleanup };
})();

Router.onEnter('kruiswoord', function() { KruiswoordUI.init(); });
Router.onLeave('kruiswoord', function() { KruiswoordUI.cleanup(); });
```

**Source:** Observed pattern in `games/sudoku/ui.js` and all other game UI files.

### Pattern 2: Clues Loading

`clues.json` must be fetched on first entry (like `words.json` in WoordSoekUI). Cache after first load.

```javascript
var _clues = null;  // module-level cache

function init() {
  if (_clues) {
    showDifficultyModal();
  } else {
    fetch('games/kruiswoord/clues.json')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        _clues = data;
        showDifficultyModal();
      })
      .catch(function() { showToast('Kon nie leidrade laai nie'); });
  }
}
```

**Note:** The SW caches this file at `/ConGames/games/kruiswoord/clues.json`. The relative path `games/kruiswoord/clues.json` works from index.html's base URL.

### Pattern 3: Grid Rendering

Each cell is a `<div>` with `data-row` and `data-col` attributes. Black cells get a class, white cells get a text content area and a superscript number span.

```javascript
function buildGrid(state) {
  var gridEl = el('kw-grid');
  gridEl.innerHTML = '';
  _cellEls = [];

  var size = state.grid.length;
  gridEl.style.gridTemplateColumns = 'repeat(' + size + ', 1fr)';

  for (var r = 0; r < size; r++) {
    _cellEls[r] = [];
    for (var c = 0; c < size; c++) {
      var cell = document.createElement('div');
      var data = state.grid[r][c];

      if (data.isBlack) {
        cell.className = 'kw-cell kw-cell-black';
      } else {
        cell.className = 'kw-cell kw-cell-white';
        if (data.number > 0) {
          var num = document.createElement('span');
          num.className = 'kw-cell-num';
          num.textContent = String(data.number);
          cell.appendChild(num);
        }
        var letter = document.createElement('span');
        letter.className = 'kw-cell-letter';
        letter.textContent = data.entered || '';
        cell.appendChild(letter);

        (function(row, col) {
          cell.addEventListener('click', function() { handleCellClick(row, col); });
        })(r, c);
      }

      cell.setAttribute('data-row', String(r));
      cell.setAttribute('data-col', String(c));
      gridEl.appendChild(cell);
      _cellEls[r][c] = cell;
    }
  }
}
```

### Pattern 4: Cell Selection — Active Word Highlighting

The crossword selection model differs from Sudoku. Instead of highlighting a single cell, we highlight all cells of the active word.

```javascript
function handleCellClick(row, col) {
  if (!_gameActive) return;

  var clickedCell = _state.grid[row][col];
  if (clickedCell.isBlack) return;

  // Find which words pass through this cell
  var acrossWord = getWordAtCell(row, col, 'across');
  var downWord   = getWordAtCell(row, col, 'down');

  if (_selectedCell && _selectedCell.row === row && _selectedCell.col === col) {
    // Same cell tapped — toggle direction if both exist
    if (acrossWord && downWord) {
      _selectedDirection = (_selectedDirection === 'across') ? 'down' : 'across';
    }
  } else {
    // New cell — prefer current direction if word exists there, else use other
    _selectedCell = { row: row, col: col };
    if (_selectedDirection === 'across' && acrossWord) {
      // keep across
    } else if (_selectedDirection === 'down' && downWord) {
      // keep down
    } else if (acrossWord) {
      _selectedDirection = 'across';
    } else if (downWord) {
      _selectedDirection = 'down';
    }
  }

  _selectedWord = (_selectedDirection === 'across') ? acrossWord : downWord;
  focusHiddenInput();
  renderHighlights();
  scrollActiveClueIntoView();
}

function getWordAtCell(row, col, direction) {
  for (var i = 0; i < _state.words.length; i++) {
    var w = _state.words[i];
    if (w.direction !== direction) continue;
    var dr = direction === 'down' ? 1 : 0;
    var dc = direction === 'across' ? 1 : 0;
    for (var j = 0; j < w.length; j++) {
      if (w.row + j * dr === row && w.col + j * dc === col) return w;
    }
  }
  return null;
}
```

### Pattern 5: Hidden Input for S Pen

One hidden `<input>` element exists for the whole game. Focused on cell tap. Samsung OS routes S Pen handwriting through the keyboard input pipeline.

```html
<!-- In screen HTML -->
<input id="kw-hidden-input" type="text"
       autocomplete="off" autocorrect="off" autocapitalize="characters"
       style="position:fixed;top:-200px;left:-200px;opacity:0;width:1px;height:1px;" />
```

```javascript
function focusHiddenInput() {
  var input = el('kw-hidden-input');
  input.value = '';
  input.focus();
}

// Wire once during init:
el('kw-hidden-input').addEventListener('keydown', function(e) {
  handleKeyInput(e.key);
  e.preventDefault();
});

// Also wire 'input' event for S Pen/handwriting which may bypass keydown:
el('kw-hidden-input').addEventListener('input', function(e) {
  var val = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase();
  if (val.length > 0) {
    handleKeyInput(val[val.length - 1]);
  }
  e.target.value = '';
});

function handleKeyInput(key) {
  if (!_selectedCell || !_selectedWord || !_gameActive) return;
  if (key === 'Backspace') {
    handleBackspace();
    return;
  }
  var letter = key.toUpperCase();
  if (!/^[A-Z]$/.test(letter)) return;

  KruiswoordEngine.setLetter(_selectedCell.row, _selectedCell.col, letter);
  _state = KruiswoordEngine.getState();
  renderCell(_selectedCell.row, _selectedCell.col);

  // Check word after each letter
  var result = KruiswoordEngine.checkWord(_selectedWord.number, _selectedWord.direction);
  if (result.correct) {
    flashWordGreen(_selectedWord);
    Audio.play('word_found');
    _state = KruiswoordEngine.getState();
    if (KruiswoordEngine.isComplete()) {
      onPuzzleComplete();
    }
  } else {
    advanceCursor();
  }
}
```

**Critical:** Wire BOTH `keydown` and `input` events. `keydown` handles hardware keyboard; `input` handles Samsung S Pen handwriting IME which fires `input` not `keydown`.

### Pattern 6: Auto-advance Cursor

After entering a letter, move to the next empty cell in the current word direction.

```javascript
function advanceCursor() {
  if (!_selectedWord) return;
  var dr = _selectedWord.direction === 'down' ? 1 : 0;
  var dc = _selectedWord.direction === 'across' ? 1 : 0;

  // Find position of current cell within the word
  var pos = -1;
  for (var j = 0; j < _selectedWord.length; j++) {
    if (_selectedWord.row + j * dr === _selectedCell.row &&
        _selectedWord.col + j * dc === _selectedCell.col) {
      pos = j;
      break;
    }
  }
  if (pos < 0) return;

  // Scan forward for next empty cell
  for (var k = pos + 1; k < _selectedWord.length; k++) {
    var nr = _selectedWord.row + k * dr;
    var nc = _selectedWord.col + k * dc;
    if (_state.grid[nr][nc].entered === '') {
      _selectedCell = { row: nr, col: nc };
      renderHighlights();
      return;
    }
  }
  // Word complete or no empty cell ahead — cursor stays
}
```

### Pattern 7: Word Flash Animation

Use CSS animation class added/removed via setTimeout.

```javascript
function flashWordGreen(word) {
  var dr = word.direction === 'down' ? 1 : 0;
  var dc = word.direction === 'across' ? 1 : 0;
  var cells = [];

  for (var j = 0; j < word.length; j++) {
    var r = word.row + j * dr;
    var c = word.col + j * dc;
    var cellEl = _cellEls[r][c];
    if (cellEl) {
      cellEl.classList.add('kw-cell-correct');
      cells.push(cellEl);
    }
  }

  setTimeout(function() {
    for (var i = 0; i < cells.length; i++) {
      cells[i].classList.remove('kw-cell-correct');
      cells[i].classList.add('kw-cell-locked');
    }
    // Deselect if this was the active word
    if (_selectedWord && _selectedWord.number === word.number &&
        _selectedWord.direction === word.direction) {
      _selectedWord = null;
      _selectedCell = null;
      renderHighlights();
    }
  }, 600);
}
```

CSS for flash + locked:
```css
.kw-cell-correct { background: #4caf78 !important; color: #fff; transition: background 0.1s; }
.kw-cell-locked  { background: rgba(76, 175, 120, 0.15); pointer-events: none; }
```

### Pattern 8: Overlay/Modal Pattern

Reuse the exact `win-overlay` / `win-card` pattern from all existing games.

```javascript
function showOverlay(id) {
  var o = el(id);
  if (o) { o.style.display = 'flex'; o.classList.add('active'); }
}

function hideOverlay(id) {
  var o = el(id);
  if (o) { o.classList.remove('active'); o.style.display = 'none'; }
}
```

### Pattern 9: Back Button Confirmation

Intercept `Router.back()` via the back button's `onclick`, not via Router hook (Router.onLeave fires after navigation, too late for confirmation).

```html
<button class="btn-back" onclick="KruiswoordUI.handleBack()">&#8592; Terug</button>
```

```javascript
function handleBack() {
  if (_gameActive) {
    showOverlay('kw-confirm-quit');
  } else {
    Router.back();
  }
}
```

Alternatively, intercept in `Router.onLeave` before the screen hides — check existing Router implementation first to confirm hook timing.

### Pattern 10: Welcome Screen Integration

The `.game-grid` has `grid-template-columns: repeat(5, 1fr)` for 5 games. Adding a 6th creates a 6th column. Change to `repeat(3, 1fr)` with auto-rows, or simply add the 6th button and let it wrap naturally to a second row. The portrait `@media` already handles `repeat(3, 1fr)`.

**Recommendation:** Add 6th button; update animation delay to include `nth-child(6)`. The welcome screen grid will reflow to 3+3 in portrait and 6 across in landscape (current 5-column layout should become `repeat(auto-fill, minmax(160px, 1fr))` or simply `repeat(6, 1fr)`).

**Stats integration:** The `refreshStats()` function in index.html currently iterates a hardcoded array. Add `'kruiswoord'` to that array.

```javascript
// Current (line 1076):
const games = ['woordsoek', 'solitaire', 'spider', 'sudoku', 'freecell'];
// Update to:
const games = ['woordsoek', 'solitaire', 'spider', 'sudoku', 'freecell', 'kruiswoord'];
```

### Anti-Patterns to Avoid

- **Canvas rendering:** DOM grid is correct for this project — accessible, styleable, touch-compatible
- **ESM import/export:** IIFE only. `var KruiswoordUI = (function() { ... })();`
- **Hardcoded cell pixel sizes:** Use CSS grid `1fr` columns with `aspect-ratio:1` on cells — size adapts automatically
- **Checking word on every render:** Only call `KruiswoordEngine.checkWord()` after a letter is set, not on every render pass
- **Mutating `_state` directly:** Always call engine methods then get fresh state via `KruiswoordEngine.getState()`
- **Parallel word direction adjacency bug:** The engine handles placement constraints; the UI doesn't need to validate word adjacency

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Crossword generation | Custom placement algorithm | `KruiswoordEngine.generate()` | Already built, tested, Phase 11 complete |
| Word validation | Letter-by-letter comparison | `KruiswoordEngine.checkWord(number, direction)` | Returns per-cell correctness, sets `complete` flag |
| Elapsed time tracking | `setInterval` counter | `KruiswoordEngine.getElapsed()` | Engine tracks `startTime`, returns seconds since generate() |
| Undo stack | Custom history | `KruiswoordEngine.undo()` | Built into engine with full undo stack |
| S Pen handwriting | Samsung SDK / custom OCR | Native `<input>` with `input` event | Samsung OS routes S Pen through standard IME |
| Overlay/modal system | Custom modal manager | `win-overlay` CSS class + `style.display` | Already proven pattern in 5 other games |

**Key insight:** The engine does all crossword logic. The UI's only job is: render state, handle taps, feed letters to engine, react to engine responses.

---

## Common Pitfalls

### Pitfall 1: S Pen Handwriting Event Pipeline
**What goes wrong:** Wiring only `keydown` misses S Pen input — Samsung's handwriting IME fires `input` events, not `keydown`.
**Why it happens:** Standard keyboard fires `keydown`+`keyup`+`input`; handwriting IME fires only `input` with composed characters.
**How to avoid:** Wire BOTH `keydown` and `input` on the hidden `<input>`. In the `input` handler, strip non-alpha, take last character, call the same `handleKeyInput` function. Clear `e.target.value` at end of `input` handler.
**Warning signs:** Letters appear in the OS handwriting panel but not in grid cells.

### Pitfall 2: Direction Toggle When Cell Has Only One Word
**What goes wrong:** Toggling direction when a cell only belongs to one word (e.g., a cell at a word endpoint that doesn't have a crossing word) causes `_selectedWord` to become null.
**Why it happens:** Not all white cells have both across and down words. Only intersection cells have two.
**How to avoid:** In the toggle handler, only toggle if BOTH `acrossWord` and `downWord` are non-null for the selected cell. If only one direction exists, ignore the tap-same-cell gesture (don't toggle).

### Pitfall 3: refreshStats() Not Updated
**What goes wrong:** Stats chip for kruiswoord shows blank even after winning.
**Why it happens:** `refreshStats()` in index.html has a hardcoded array of game IDs; `'kruiswoord'` missing.
**How to avoid:** Add `'kruiswoord'` to the games array in `refreshStats()`. Also add `id="stats-kruiswoord"` to the welcome card button.

### Pitfall 4: SW Cache Miss on First Launch After Update
**What goes wrong:** App tries to load `kruiswoord/engine.js` or `clues.json` and gets 404 or stale cache.
**Why it happens:** New files not in CORE_ASSETS means SW won't pre-cache them on install.
**How to avoid:** Add all three paths to CORE_ASSETS before pushing. Bump CACHE_NAME version string so old SW cache is replaced. Bump `manifest.json` version and `index.html` version span on same commit.

### Pitfall 5: Grid Layout CSS — Black Cell Occupying Space
**What goes wrong:** Black cells display as visible dark squares but with incorrect sizing, creating grid alignment issues.
**Why it happens:** If CSS sets `display:none` or `visibility:hidden` on black cells rather than styling them as filled squares, the grid column structure breaks.
**How to avoid:** Black cells MUST be `display:block` (or `display:flex`) in the grid — they just get `background:var(--bg-base)` and `cursor:default`. Never hide them.

### Pitfall 6: Hidden Input Focus on iOS/Android
**What goes wrong:** Keyboard doesn't appear after cell tap on some Android configurations.
**Why it happens:** Mobile browsers restrict `input.focus()` to direct user gesture handlers; calling focus inside a `setTimeout` may fail.
**How to avoid:** Call `input.focus()` directly within the `click` event handler, not deferred. If needed for other reasons, call `input.focus()` synchronously inside `handleCellClick`.

### Pitfall 7: Clue Panel Scroll on Active Clue Change
**What goes wrong:** Active clue highlighted in gold but not visible because clue list is scrolled to top.
**Why it happens:** Highlighting a clue doesn't scroll the panel; the user must manually scroll.
**How to avoid:** After updating active clue highlight, call `activeClueEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' })`.

### Pitfall 8: checkWord() Called on Incomplete Word Returns Correct=False
**What goes wrong:** A word with some cells empty is checked and returns `correct: false` — but this false-negative could mislead if the result is misinterpreted.
**Why it happens:** `checkWord()` compares `entered` to `letter` for all cells; empty `entered` never matches.
**How to avoid:** Only show "incorrect" feedback if the word is fully filled. Check that all cells in the word have non-empty `entered` before checking. Or simply let `checkWord()` return false — the UI only flashes green on `result.correct === true`, so incomplete words silently don't trigger the green flash.

---

## Code Examples

### Difficulty Modal HTML (from existing Sudoku pattern)

```html
<!-- Source: index.html line 829 — sdk-difficulty-modal -->
<div class="win-overlay" id="kw-difficulty-modal" style="display:flex;">
  <div class="win-card">
    <h2 style="font-size:1.8rem;">Kruiswoordraaisel</h2>
    <p>Kies moeilikheidsgraad</p>
    <div style="display:flex;flex-direction:column;gap:12px;">
      <button class="btn btn-secondary" id="kw-diff-maklik">Maklik (9&#215;9, 7 woorde)</button>
      <button class="btn btn-secondary" id="kw-diff-medium">Medium (13&#215;13, 13 woorde)</button>
      <button class="btn btn-secondary" id="kw-diff-moeilik">Moeilik (17&#215;17, 18 woorde)</button>
    </div>
  </div>
</div>
```

### Welcome Button HTML (from existing pattern)

```html
<!-- Source: index.html line 463 — game-btn pattern -->
<button class="game-btn" data-game="kruiswoord" onclick="Router.go('kruiswoord')">
  <span class="game-icon">&#9638;</span>
  <span class="game-name">Kruiswoordraaisel</span>
  <span class="game-sub">Afrikaans</span>
  <span class="game-stats-chip" id="stats-kruiswoord"></span>
</button>
```

Note: `&#9638;` is a grid symbol (▮). The CONTEXT.md allows Claude's discretion for exact icon. Other options: `&#9783;` or a CSS-drawn mini crossword. Keep it consistent with other emoji-based icons.

### Win Overlay HTML

```html
<!-- Source: index.html line 864 — sdk-win-overlay pattern -->
<div class="win-overlay" id="kw-win-overlay">
  <div class="win-card">
    <h2>Baie goed!</h2>
    <p id="kw-win-message"></p>
    <div style="display:flex;gap:12px;justify-content:center;">
      <button class="btn btn-primary" id="kw-win-newgame">Nuwe Spel</button>
      <button class="btn btn-secondary" id="kw-win-home">Tuis</button>
    </div>
  </div>
</div>
```

### Quit Confirmation Modal HTML

```html
<div class="win-overlay" id="kw-confirm-quit">
  <div class="win-card">
    <h2 style="font-size:1.4rem;">Wil jy opgee?</h2>
    <p>Vordering sal verlore gaan.</p>
    <div style="display:flex;gap:12px;justify-content:center;">
      <button class="btn btn-primary" id="kw-quit-ja">Ja</button>
      <button class="btn btn-secondary" id="kw-quit-nee">Nee</button>
    </div>
  </div>
</div>
```

### SW Cache Entries to Add

```javascript
// Source: sw.js CORE_ASSETS — add these three lines
'/ConGames/games/kruiswoord/engine.js',
'/ConGames/games/kruiswoord/ui.js',
'/ConGames/games/kruiswoord/clues.json',
```

Also bump: `const CACHE_NAME = 'congames-v1.1.0';`

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Separate HTML file per game (`/games/solitaire/index.html`) | Embedded `<section>` in main `index.html` (woordsoek pattern) | Kruiswoord follows the embedded pattern, not the separate file pattern |
| Manual SW cache invalidation | Version bump in CACHE_NAME string | Must change from `v1.0.4` to `v1.1.0` (or similar) to force SW re-install |

**Note on layout change:** The current welcome screen uses `grid-template-columns: repeat(5, 1fr)`. Adding a 6th game requires either changing to `repeat(6, 1fr)` (tight on landscape) or `repeat(3, 1fr)` with 2 rows. At 2000×1200 with the current card min-height of 160px and gap of 16px, 6 cards in one row is viable (~290px each). The portrait media query already handles 3-column. The 6th card gets no animation delay defined — add `nth-child(6) { animation-delay: 480ms; }`.

---

## Open Questions

1. **Welcome screen grid: 6-across vs 3+3?**
   - What we know: Current CSS uses `repeat(5, 1fr)`. Landscape viewport is 2000×1200.
   - What's unclear: Whether 6-across feels too cramped or looks fine at 290px wide each.
   - Recommendation: Try `repeat(6, 1fr)` first — at 2000px wide it's ~290px per card, well above minimum. If it looks cramped, fall back to `repeat(3, 1fr)` with `grid-auto-rows: auto`.

2. **Timer display during gameplay (deferred)**
   - Timer is deferred (KW-02) but `KruiswoordEngine.getElapsed()` exists for win recording.
   - Recommendation: Track time internally for `Settings.recordWin()` using `getElapsed()` at win time. No visible timer in the UI per deferred scope.

---

## Validation Architecture

`workflow.nyquist_validation` key is absent from `.planning/config.json` — treat as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — this is a browser-based vanilla JS project |
| Config file | `package.json` has `npm test` but no test framework installed |
| Quick run command | `npm test` (currently runs nothing — see Wave 0 Gaps) |
| Full suite command | Manual browser test in Chrome DevTools tablet emulation |

**Note:** The existing test suite referenced in CLAUDE.md (`npm test`) checks game logic and collision detection for a different project (Red Stapler Shooter in `/home/trashdev/projects/CLAUDE.md`). This project (congames) has no automated test infrastructure. All validation is manual browser testing.

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Verification Method |
|--------|----------|-----------|---------------------|
| UI-01 | Game card on welcome screen | visual | Open app, verify kruiswoord card appears with stats chip |
| UI-02 | Difficulty modal on entry | manual-only | Tap kruiswoord, verify 3-button modal appears |
| UI-03 | Grid renders correctly | visual | Start Easy game, verify 9×9 grid with black/white cells and numbers |
| UI-04 | Cell tap highlights word | manual-only | Tap a white cell, verify all cells of that word highlight gold |
| UI-05 | Same cell toggles direction | manual-only | Tap intersection cell twice, verify direction changes |
| UI-06 | Clue tap jumps to word | manual-only | Tap a clue in the panel, verify cursor moves to first empty cell |
| UI-07 | Letter entry + auto-advance | manual-only | Type a letter, verify it appears in cell and cursor advances |
| UI-08 | Correct word flashes green | manual-only | Complete a word correctly, verify 600ms green flash then lock |
| UI-09 | Completion modal | manual-only | Complete all words, verify congratulations modal appears |
| UI-10 | Stats recorded | manual-only | Complete a game, return to welcome, verify stats chip updates |
| UI-11 | Back button confirmation | manual-only | Mid-puzzle, tap back, verify Afrikaans confirm dialog |
| UI-12 | SW cache updated | manual-only | Check sw.js CORE_ASSETS for three kruiswoord paths |
| UI-13 | Version incremented | code-review | Check sw.js, manifest.json, index.html version strings |

### Wave 0 Gaps

No automated test framework exists for this project. All phase 12 verification is manual browser testing in Chrome DevTools (2000×1200, landscape, touch enabled). No test files to create.

- Manual testing checklist: covered by Definition of Done in CLAUDE.md
- Chrome DevTools setup: `python3 -m http.server 8080` then custom 2000×1200 touch device

*(No Wave 0 automated test gaps — project design intentionally uses manual testing only.)*

---

## Sources

### Primary (HIGH confidence)
- `games/sudoku/ui.js` — Complete reference implementation for game lifecycle, overlay pattern, cell selection, win detection
- `games/woordsoek/ui.js` — Reference for grid rendering, word highlight pattern, clue list
- `games/kruiswoord/engine.js` — Phase 11 output, exact API surface documented
- `index.html` — Exact HTML structure for welcome screen buttons, screen sections, script loading, refreshStats
- `sw.js` — CORE_ASSETS format, CACHE_NAME versioning pattern
- `css/shared.css` — All design tokens confirmed present
- `CLAUDE.md` §Kruiswoordraaisel Spec, §Design System, §Gotchas, §Navigation Pattern

### Secondary (MEDIUM confidence)
- Samsung S Pen handwriting input via `input` event: inferred from CLAUDE.md "S Pen handwriting works automatically via Samsung OS — no custom handwriting code needed" + standard IME pipeline behavior

### Tertiary (LOW confidence)
- None — all findings are from direct code inspection of the project

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all from direct code inspection
- Architecture patterns: HIGH — direct template from existing game UIs
- Pitfalls: HIGH (S Pen), HIGH (direction toggle), HIGH (refreshStats), MEDIUM (scroll-into-view) — all from code analysis
- HTML structure: HIGH — copied from working implementations

**Research date:** 2026-03-20
**Valid until:** Indefinite — based on stable project source code, not external dependencies
