# Phase 7: Sudoku - Research

**Researched:** 2026-03-09
**Domain:** Sudoku puzzle generation, grid UI, vanilla JS game logic
**Confidence:** HIGH

## Summary

Sudoku for this project is a self-contained vanilla JS game with no external dependencies. The core challenge is twofold: (1) a puzzle generator that produces valid, unique-solution puzzles at four difficulty levels using backtracking, and (2) a responsive 9x9 grid UI optimized for a 10.4" tablet with large tap targets, number pad input, pencil marks, hints, and error checking.

The project's established patterns (IIFE modules, engine/ui split, Router lifecycle hooks, Settings for persistence, overlay-based modals) apply directly. No new libraries or frameworks are needed. The Sudoku screen placeholder already exists in `index.html` and the `games/sudoku/` directory is created but empty.

**Primary recommendation:** Implement engine.js with backtracking generator + solver, then ui.js following the exact Solitaire/Spider IIFE pattern. Cell-first input flow (tap cell, then tap number). Auto-save board state to localStorage on every move.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Cell-first input:** Tap a cell to select it, then tap a number on the pad to enter it. Matches MS Sudoku.
- **Notes mode toggle:** A toggle button switches the number pad between normal entry and pencil/notes mode. Clear visual indicator of current mode.
- **Number highlighting:** Tapping a cell with a number highlights all instances of that same number across the entire grid.
- **Completed number greying:** Numbers with all 9 instances placed get greyed out/disabled on the pad. Completed number greying.
- **Given vs entered colors:** Given (puzzle) numbers in bright white (fixed feel). Player-entered numbers in accent gold (#d4a23a).
- **3x3 box borders:** Thick gold borders between 3x3 boxes. Thinner subtle borders between individual cells.
- **Notes layout:** 3x3 mini-grid inside each cell for pencil marks (1 top-left, 2 top-center, ... 9 bottom-right).
- **Error feedback:** "Check" button flashes incorrect cells red briefly (1-2 seconds), then fades back to normal. Not persistent.
- **Difficulty selection:** Start screen with 4 buttons: Maklik / Medium / Moeilik / Kenner. No English subtitles.
- **New game only:** Changing difficulty requires starting a new game. "Nuwe Spel" button returns to difficulty selection.
- **No stats on difficulty screen:** Keep it clean -- just the 4 buttons.
- **Hide grid on pause:** Full overlay covers the grid when paused. Shows elapsed time and a "Hervat" (Resume) button.
- **Auto-save:** Board state saved to localStorage on every move. Resume prompt: "Wil jy voortgaan?" with Resume / Nuwe Spel buttons.
- **Auto-pause on leave:** Timer pauses via visibilitychange event when Con switches apps or tabs.
- **Emulate MS Sudoku** as closely as possible within the warm dark theme.
- **Afrikaans UI throughout:** Pouse, Hervat, Nuwe Spel, Wil jy voortgaan?

### Claude's Discretion
- Exact cell sizing and spacing for 10.4" tablet landscape
- Selected cell highlight color/style (within theme)
- Hint animation style
- Win celebration animation (consistent with other games)
- Number pad button layout and sizing
- Undo implementation details

### Deferred Ideas (OUT OF SCOPE)
- Theme selection / light mode / MS theme -- belongs in Phase 10
- Per-difficulty stats on difficulty screen -- could revisit in Phase 10
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| SDK-01 | 9x9 grid with standard Sudoku rules | Engine: row/col/box constraint validation; UI: CSS grid layout |
| SDK-02 | Puzzle generator at 4 difficulty levels (Easy ~45, Medium ~35, Hard ~27, Expert ~22 revealed) | Engine: backtracking fill + cell removal with unique-solution check |
| SDK-03 | Each generated puzzle has a unique solution | Engine: solver counts solutions during removal; stop at 1 |
| SDK-04 | Number input via on-screen pad (1-9 + erase) | UI: number pad component, cell-first input flow |
| SDK-05 | Notes/pencil mode toggle for candidate numbers | UI: notes mode state, 3x3 mini-grid rendering per cell |
| SDK-06 | Tap number to highlight all instances across grid | UI: number highlighting on cell selection |
| SDK-07 | Hint reveals one correct cell | Engine: expose solution lookup; UI: hint button + animation |
| SDK-08 | Check work -- incorrect cells flash red | Engine: compare against solution; UI: flash animation (1-2s) |
| SDK-09 | Timer with pause functionality | UI: setInterval timer, pause overlay, visibilitychange handler, auto-save |
| SDK-10 | Win condition with celebration and stats | Engine: check all cells filled correctly; UI: win overlay + Settings.recordWin |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla JS | ES5-compatible | All game logic and UI | Project mandate: no build step, no npm, IIFE modules |
| CSS Variables | N/A | Theme integration | Already defined in `css/shared.css` |
| localStorage | Web API | Auto-save, settings, stats | Already wrapped by `Settings` module |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Settings.js | (existing) | Persist game state, record wins | Auto-save on every move, win recording |
| Router.js | (existing) | Screen lifecycle | onEnter/onLeave hooks for init/cleanup |
| Audio.js | (existing) | Sound effects | word_found on hint, board_finished on win |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom backtracking generator | Pre-generated puzzle bank | Bank approach simpler but limits variety; generator gives infinite puzzles at each difficulty. Generator is the right choice. |
| CSS Grid for 9x9 | HTML table | CSS Grid is cleaner, better for responsive sizing, and avoids table semantics. Use CSS Grid. |

**Installation:** None needed. All vanilla JS in project root.

## Architecture Patterns

### Recommended Project Structure
```
games/sudoku/
  engine.js    # Puzzle generation, validation, solution, state
  ui.js        # DOM rendering, events, timer, overlays
(index.html)   # Redirect stub (already pattern in project)
(index.html)   # Main game UI lives in root index.html screen section
```

### Pattern 1: Backtracking Sudoku Generator
**What:** Fill a complete 9x9 grid using backtracking with randomized candidates, then remove cells one by one, checking after each removal that the puzzle still has exactly one solution.
**When to use:** Every new game.
**Algorithm:**
```javascript
// Step 1: Generate complete valid grid
function fillGrid(grid) {
  var empty = findEmpty(grid);
  if (!empty) return true; // grid full = success
  var nums = shuffle([1,2,3,4,5,6,7,8,9]);
  for (var i = 0; i < nums.length; i++) {
    if (isValid(grid, empty.row, empty.col, nums[i])) {
      grid[empty.row][empty.col] = nums[i];
      if (fillGrid(grid)) return true;
      grid[empty.row][empty.col] = 0;
    }
  }
  return false;
}

// Step 2: Remove cells while maintaining unique solution
function removeCells(grid, solution, count) {
  var cells = shuffle(allCellPositions());
  var removed = 0;
  for (var i = 0; i < cells.length && removed < count; i++) {
    var r = cells[i].row, c = cells[i].col;
    var backup = grid[r][c];
    grid[r][c] = 0;
    if (countSolutions(grid) === 1) {
      removed++;
    } else {
      grid[r][c] = backup; // restore -- removing breaks uniqueness
    }
  }
  return grid;
}
```

### Pattern 2: Solution Counter (for unique-solution guarantee)
**What:** A solving function that counts solutions up to 2 (early exit -- we only need to know if there is more than 1).
**Why critical:** SDK-03 requires unique solutions. Without this, some puzzles may have multiple valid completions.
```javascript
function countSolutions(grid, limit) {
  limit = limit || 2;
  var count = { n: 0 };
  function solve(g) {
    if (count.n >= limit) return;
    var empty = findEmpty(g);
    if (!empty) { count.n++; return; }
    for (var num = 1; num <= 9; num++) {
      if (isValid(g, empty.row, empty.col, num)) {
        g[empty.row][empty.col] = num;
        solve(g);
        g[empty.row][empty.col] = 0;
      }
    }
  }
  solve(grid);
  return count.n;
}
```

### Pattern 3: IIFE Module (project-standard)
**What:** All game modules use `var ModuleName = (function() { ... })()` pattern.
**Example from Solitaire:**
```javascript
var SudokuEngine = (function() {
  'use strict';
  var _state = null;
  // ... private functions ...
  return { newGame: newGame, getState: getState, /* ... */ };
})();
```

### Pattern 4: Auto-Save State to localStorage
**What:** Serialize full board state on every move. On game entry, check for saved state and prompt to resume.
**Key data to save:**
```javascript
{
  grid: [[...]], // 9x9 current values (0 = empty)
  solution: [[...]], // 9x9 solution for hints/check
  given: [[...]], // 9x9 booleans (true = original puzzle cell)
  notes: [[...]], // 9x9 arrays of sets/arrays of candidate numbers
  difficulty: 'maklik',
  elapsedSeconds: 142,
  moves: 23
}
```

### Pattern 5: CSS Grid for 9x9 Board
**What:** Use CSS Grid with thick borders on 3x3 box boundaries.
```css
.sdk-grid {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  grid-template-rows: repeat(9, 1fr);
  aspect-ratio: 1;
  max-height: calc(100vh - 160px); /* Leave room for header + numpad */
  gap: 0;
}
.sdk-cell {
  border: 1px solid var(--border-subtle);
  min-height: var(--tap-min);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(1.2rem, 3vw, 2rem);
  cursor: pointer;
}
/* Thick borders for 3x3 box boundaries */
.sdk-cell:nth-child(9n+4), .sdk-cell:nth-child(9n+7) {
  border-left: 2px solid var(--accent-gold);
}
.sdk-cell:nth-child(n+19):nth-child(-n+27),
.sdk-cell:nth-child(n+46):nth-child(-n+54) {
  border-top: 2px solid var(--accent-gold);
}
```

### Anti-Patterns to Avoid
- **Generating puzzles by removing random cells without solution-count check:** Produces puzzles with multiple solutions. MUST verify uniqueness.
- **Using ES modules (import/export):** Project uses IIFE pattern only. No ESM.
- **Storing notes as a flat string:** Use array-of-arrays for fast lookup and toggle. Each cell gets `notes[r][c] = [1,0,0,1,0,0,0,0,1]` (boolean array indexed 0-8 for digits 1-9).
- **Rebuilding the entire grid DOM on every change:** Only update the changed cell(s). Full re-render is acceptable for initial load and new game, but cell updates should be targeted.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Timer display | Custom time formatter | `window.formatTime(seconds)` | Already exists in index.html |
| Sound effects | Custom audio | `Audio.play('word_found')` / `Audio.play('board_finished')` | Already wired |
| Game stats | Custom stats tracking | `Settings.recordWin('sudoku', seconds)` | Already handles win/loss/bestTime |
| Screen navigation | Custom nav | `Router.go()` / `Router.back()` | Already handles history, onEnter/onLeave |
| Persistent settings | Custom localStorage | `Settings.get/set()` | Already handles JSON serialization |
| Toast messages | Custom notification | `window.showToast(msg)` | Already styled and animated |

**Key insight:** The shared modules cover all infrastructure. Engine needs only game logic; UI needs only Sudoku-specific rendering and interaction.

## Common Pitfalls

### Pitfall 1: Slow Puzzle Generation at Expert Difficulty
**What goes wrong:** Expert puzzles (~22 revealed cells, 59 removed) require many solution-count checks. Each check is a full backtracking solve. Can take 1-5 seconds on mobile.
**Why it happens:** `countSolutions` is O(9^n) worst case where n is empty cells. With 59 empty cells, naive approach is slow.
**How to avoid:**
1. Generate in a `setTimeout(0)` or chunk the removal loop to avoid blocking the UI thread
2. Show a "Genereer legkaart..." loading indicator during generation
3. Optimize solver: use constraint propagation (naked singles + hidden singles) before backtracking
4. Early exit in `countSolutions` as soon as count reaches 2
5. If generation takes > 2 seconds, accept current state (may have slightly more revealed cells than target)
**Warning signs:** UI freezes on "Kenner" difficulty selection.

### Pitfall 2: Pencil Marks Not Auto-Cleared
**What goes wrong:** Player enters a number but pencil marks containing that number remain in the same row/col/box.
**Why it happens:** Forgetting to clean up notes when a number is placed.
**How to avoid:** When a number is placed in a cell, remove that number from notes in all cells sharing the same row, column, and 3x3 box. This is standard MS Sudoku behavior.
**Warning signs:** Notes showing impossible candidates after placing numbers.

### Pitfall 3: Auto-Save/Resume State Corruption
**What goes wrong:** Saved state becomes invalid (e.g., solution doesn't match grid after code changes).
**Why it happens:** Schema changes between versions, or partial save during error.
**How to avoid:** Version-stamp the saved state. On load, validate structure before restoring. If invalid, discard and show difficulty selector.
**Warning signs:** Console errors on game entry, blank grid with timer running.

### Pitfall 4: Cell Sizing Doesn't Fill Available Space
**What goes wrong:** Grid is too small or overflows on 10.4" landscape tablet.
**Why it happens:** Fixed pixel sizes or incorrect viewport calculations.
**How to avoid:** Use `aspect-ratio: 1` on the grid, constrain by available height (viewport minus header minus numpad), and let cells size from the grid. Landscape layout: grid on left, numpad on right (or grid centered with numpad below).
**Warning signs:** Tiny cells on tablet, grid cut off at bottom.

### Pitfall 5: Tap Target Too Small for Notes Mini-Grid
**What goes wrong:** Individual pencil mark numbers are too small to read.
**Why it happens:** 9 tiny numbers in a cell that may only be 56-70px.
**How to avoid:** Notes are display-only (not individually tappable). The cell itself is the tap target. Notes toggle applies to the whole number pad. Each pencil mark number should be at least 8-10px font size. Use the 3x3 mini-grid layout for visual clarity.
**Warning signs:** Dad can't read pencil marks at arm's length.

### Pitfall 6: Highlight + Selection Visual Conflict
**What goes wrong:** Selected cell highlight, same-number highlight, and error flash all compete visually.
**Why it happens:** Multiple visual states applied simultaneously without priority.
**How to avoid:** Define clear visual priority: error flash (highest, temporary) > selected cell (active border/glow) > same-number highlight (subtle background) > default. Use distinct CSS classes with proper specificity.

## Code Examples

### Engine API Surface (recommended)
```javascript
var SudokuEngine = (function() {
  'use strict';
  // State: { grid, solution, given, notes, difficulty, moves, undoStack }
  return {
    newGame: function(difficulty) {},     // Generate puzzle, return state
    getState: function() {},              // Return state copy
    setValue: function(row, col, val) {}, // Place number (0 to erase)
    toggleNote: function(row, col, n) {},  // Toggle pencil mark
    checkErrors: function() {},           // Return array of {row,col} with wrong values
    getHint: function() {},               // Return {row, col, value} for one empty cell
    isComplete: function() {},            // All cells filled correctly?
    undo: function() {},                  // Reverse last action
    getSavedGame: function() {},          // Return serializable state for localStorage
    loadGame: function(savedState) {}     // Restore from localStorage
  };
})();
```

### UI Landscape Layout (recommended)
```
+----------------------------------------------------------+
| [<- Terug]     Sudoku      [timer] [Pouse] [Nuwe Spel]  |
+----------------------------------------------------------+
|                    |                                      |
|    9x9 GRID       |   [1] [2] [3]                        |
|    (square,        |   [4] [5] [6]                        |
|     centered)      |   [7] [8] [9]                        |
|                    |   [Notes] [Erase]                    |
|                    |   [Hint] [Check] [Undo]              |
|                    |                                      |
+----------------------------------------------------------+
```
Grid takes ~60% width, numpad + controls take ~40%. Grid height constrained to viewport minus header. Numpad buttons at least 56px for tap targets.

### Difficulty Cell Counts
```javascript
var DIFFICULTY = {
  maklik:  { label: 'Maklik',  revealedCells: 45 },
  medium:  { label: 'Medium',  revealedCells: 35 },
  moeilik: { label: 'Moeilik', revealedCells: 27 },
  kenner:  { label: 'Kenner',  revealedCells: 22 }
};
```

### Auto-Save Pattern
```javascript
function autoSave() {
  var state = SudokuEngine.getSavedGame();
  state.elapsedSeconds = _elapsedSeconds;
  Settings.set('sudoku-save', state);
}

// On enter:
var saved = Settings.get('sudoku-save', null);
if (saved) {
  // Show resume prompt overlay
} else {
  // Show difficulty selector
}
```

### visibilitychange for Auto-Pause
```javascript
document.addEventListener('visibilitychange', function() {
  if (document.hidden) {
    pauseTimer();
    autoSave();
  } else {
    // Only resume if not manually paused
    if (!_manuallyPaused) resumeTimer();
  }
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pre-generated puzzle databases | Real-time backtracking generation | Standard for years | Infinite puzzle variety per difficulty |
| Table-based grid layout | CSS Grid | CSS Grid widely supported | Cleaner responsive sizing |
| Alert-based error feedback | Inline visual feedback (flash red) | Modern UX standard | Non-disruptive, matches MS Sudoku |

**Deprecated/outdated:**
- None relevant. Sudoku implementation patterns are stable and well-established.

## Open Questions

1. **Expert generation performance on Android 10 tablet**
   - What we know: Backtracking solver is O(9^n). Expert has ~59 empty cells. Modern phones handle this in <1s typically.
   - What's unclear: Exact performance on Samsung Galaxy Tab S6 Lite (Exynos 9611, 2020 chip).
   - Recommendation: Implement with loading spinner. If too slow, add constraint propagation optimization. Could also pre-generate a few Expert puzzles as fallback.

2. **Optimal grid size for 10.4" landscape**
   - What we know: Viewport ~2000x1200. Header ~56px. Need room for numpad.
   - What's unclear: Exact cell px size that balances readability with fitting numpad beside grid.
   - Recommendation: Use `min(calc(100vh - 120px), 60vw)` for grid container. Test in DevTools at 2000x1200. Each cell will be ~120px at that size, well above 56px tap minimum.

## Sources

### Primary (HIGH confidence)
- Project codebase: `games/solitaire/engine.js`, `games/solitaire/ui.js`, `games/spider/engine.js` -- established IIFE patterns, engine/ui split, undo stack pattern
- Project codebase: `js/settings.js`, `js/router.js`, `js/audio.js` -- shared module APIs
- Project codebase: `css/shared.css` -- CSS variables, theme tokens, component styles
- Project codebase: `index.html` -- existing Sudoku screen placeholder, overlay patterns
- 07-CONTEXT.md -- all locked user decisions

### Secondary (MEDIUM confidence)
- Sudoku backtracking generation is a well-documented algorithm (standard CS approach, consistent across multiple references)
- CSS Grid for game boards is standard practice for responsive grid-based games

### Tertiary (LOW confidence)
- Performance of backtracking solver on Exynos 9611 -- untested, estimated from general mobile benchmarks

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no external dependencies, all vanilla JS with established project patterns
- Architecture: HIGH - engine/ui split proven across 3 prior games; Sudoku generation via backtracking is textbook
- Pitfalls: HIGH - Sudoku generation pitfalls are well-known (uniqueness, performance, auto-clear notes)

**Research date:** 2026-03-09
**Valid until:** Indefinite (no external dependencies that could change)
