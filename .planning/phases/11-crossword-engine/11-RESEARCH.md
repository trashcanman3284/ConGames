# Phase 11: Crossword Engine - Research

**Researched:** 2026-03-19
**Domain:** Crossword grid generation algorithm, vanilla JS IIFE engine pattern
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Word Placement Strategy**
- Every word must intersect at least one other word — no isolated words, single connected crossword
- Select words randomly from the 300-word pool but ensure a mix of short (4-5), medium (6-7), and long (8-10) character words
- Always fresh puzzle — new random selection each time, no seeded/daily puzzles
- Place longest word horizontally at grid centre as anchor, then find letter intersections for subsequent words

**Grid Quality Rules**
- No rotational symmetry required — let the algorithm place words wherever they fit best
- Minimum 1 intersection per word (implied by the connected-grid rule)
- Prevent parallel adjacency — two words running side-by-side would create unintended cross-words in the perpendicular direction
- No shared endpoints — words must have a blank cell or grid edge before the first letter and after the last letter in their direction

**Engine API Shape**
- Return 2D grid array + word list: `grid[row][col]` = `{letter, number, isBlack}`, `words[]` = `{word, clue, number, direction, row, col, length}`
- Single word list with `direction: 'across' | 'down'` field — UI groups as needed
- Engine owns answer checking: exposes `checkWord(number, direction)` and `isComplete()`
- Engine tracks full game state (entered letters, elapsed time, completed words, undo stack) — consistent with SudokuEngine pattern

**Difficulty Tuning**
- Afrikaans labels: Maklik (9x9, 7 words), Medium (13x13, 13 words), Moeilik (17x17, 18 words)
- Grid sizes and word counts are firm constants, not configurable
- After 5 retries, return best attempt (grid with most placed words) — a slightly sparse grid is still playable
- 2-second generation time cap — if exceeded, return best grid so far to avoid freezing Con's tablet

### Claude's Discretion
- Exact intersection scoring algorithm for word placement
- Internal data structures for the placement engine
- Undo stack implementation details
- Timer management approach

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ENG-01 | Generate valid crossword grid for Easy difficulty (9×9, 7 words) | Algorithm research: anchor placement, intersection search, parallel adjacency check |
| ENG-02 | Generate valid crossword grid for Medium difficulty (13×13, 13 words) | Same algorithm, larger grid; word pool analysis confirms sufficient candidates |
| ENG-03 | Generate valid crossword grid for Hard difficulty (17×17, 18 words) | Largest grid; word pool has 300 entries covering all length buckets needed |
| ENG-04 | Cell numbers assigned left-to-right, top-to-bottom for across/down word starts | Standard crossword numbering scan; well-defined algorithm |
| ENG-05 | Retry logic (up to 5 attempts) if placed word count does not meet minimum | Retry loop with best-result tracking + 2-second wall-clock cap |
</phase_requirements>

---

## Summary

This phase implements a pure-logic crossword grid generator in vanilla JavaScript using the project's established IIFE pattern. There are no third-party libraries involved — the entire engine is custom algorithm code, following the same `var KruiswoordEngine = (function() { ... })()` structure already used by SudokuEngine and WoordSoekEngine.

The generation algorithm is locked: place the longest available word horizontally at grid centre as anchor, then iteratively find candidate positions for remaining words by scanning existing placed words for letter intersections. Each candidate placement must pass parallel adjacency and shared-endpoint checks before scoring. The best-scoring placement is committed; if the target word count is not met after exhausting candidates, retry the entire generation (up to 5 times) or abort when 2 seconds wall-clock time is exceeded.

The engine also owns full game state: entered letters, completed words, elapsed time, and an undo stack. This matches the SudokuEngine pattern and gives the Phase 12 UI a clean, stateful API to consume.

**Primary recommendation:** Implement `KruiswoordEngine` as a single IIFE file at `games/kruiswoord/engine.js`, modelled directly on SudokuEngine's state/API structure and WoordSoekEngine's grid/placement helpers.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla JS ES5 | N/A | Engine implementation | Project constraint: no build step, IIFE only, no ESM |
| clues.json | Phase 10 output | 300 Afrikaans word+clue pairs | Only input data source available |

No npm packages. No external dependencies. This phase is pure algorithm code.

### Supporting (existing project modules — reuse, don't rebuild)
| Module | File | How Engine Uses It |
|--------|------|--------------------|
| Settings | `js/settings.js` | `Settings.recordWin('kruiswoord', secs)` called by UI (not engine) on completion |
| shuffle utility | already in WoordSoekEngine / SudokuEngine | Inline a copy in KruiswoordEngine — no shared utility file |

**Installation:** None. No packages to install.

---

## Architecture Patterns

### Recommended Project Structure
```
games/kruiswoord/
├── clues.json       # Input data (Phase 10) — READ ONLY
├── engine.js        # This phase — KruiswoordEngine IIFE
└── ui.js            # Phase 12
```

### Pattern 1: IIFE Engine with `_state`

Every game engine in this project follows this exact shape:

```javascript
// Source: games/sudoku/engine.js (direct template)
var KruiswoordEngine = (function() {
  'use strict';

  var DIFFICULTY = {
    maklik:  { label: 'Maklik',  size: 9,  wordCount:  7 },
    medium:  { label: 'Medium',  size: 13, wordCount: 13 },
    moeilik: { label: 'Moeilik', size: 17, wordCount: 18 }
  };

  var _state = {
    grid:           [],   // 2D array of {letter, number, isBlack, entered}
    words:          [],   // [{word, clue, number, direction, row, col, length, complete}]
    difficulty:     '',
    startTime:      0,
    elapsedSeconds: 0,
    undoStack:      []
  };

  // ... internal functions ...

  return {
    DIFFICULTY: DIFFICULTY,
    generate:   generate,    // generate(difficulty) → {grid, words}
    setLetter:  setLetter,   // setLetter(row, col, letter)
    checkWord:  checkWord,   // checkWord(number, direction) → {correct, letters}
    isComplete: isComplete,  // isComplete() → boolean
    undo:       undo,        // undo() → {success}
    getState:   getState,    // getState() → deep-cloned snapshot
    getElapsed: getElapsed   // getElapsed() → seconds
  };
})();
```

### Pattern 2: Grid Cell Object

Every cell in the 2D grid is an object literal:

```javascript
// Black cell (unused crossword square)
{ letter: '', number: 0, isBlack: true,  entered: '' }

// White cell (playable square)
{ letter: 'H', number: 3, isBlack: false, entered: '' }
// letter    = correct answer letter (A-Z)
// number    = 1..N if this cell starts an Across or Down word, else 0
// isBlack   = true for filler squares
// entered   = what Con has typed ('' = empty, 'H' = entered)
```

The UI reads `letter` only for answer-checking. It reads `entered` for display. It reads `number` to render superscript clue numbers.

### Pattern 3: Generation Algorithm

```
generate(difficulty):
  1. Load candidate pool from clues.json
  2. Bucket candidates: short=[4-5], medium=[6-7], long=[8-10]
  3. Shuffle each bucket
  4. Select wordCount words with mix: 30% short, 40% medium, 30% long
     (adjust ratios to fill quota if a bucket is depleted)
  5. Sort selected words by length descending
  6. anchor = longest word (pick first, shuffle tie-breakers)
  7. Place anchor horizontally at grid centre row, centred on mid-col
  8. Mark cells occupied; push anchor to placedWords
  9. startTime = Date.now()

  10. FOR each remaining word (in descending-length order):
        candidates = findCandidatePlacements(word, placedWords, grid)
        if candidates.length > 0:
          best = scoreBest(candidates)
          commitPlacement(best, grid, placedWords)

  11. IF placedWords.length < wordCount AND retryCount < 5
          AND (Date.now() - startTime) < 2000:
        retryCount++
        save bestAttempt if better than previous
        goto step 1 (re-select words, re-generate)

  12. assignCellNumbers(grid, placedWords)
  13. Return {grid, words: placedWords}
```

### Pattern 4: findCandidatePlacements

For each already-placed word, scan every letter:
- For each letter in `word` (candidate) that matches a letter in `placedWord` at position `i`:
  - If placedWord is Across: candidate must go Down, crossing at that cell
  - If placedWord is Down: candidate must go Across, crossing at that cell
  - Compute candidate start position from the intersection
  - Call `canPlace()` — bounds check + no conflicts with existing letters
  - Call `checkParallelAdjacency()` — ensure no side-by-side parallel words
  - Call `checkEndpointClearance()` — ensure blank/edge before start and after end
  - If all pass: push to candidates list with intersection count as score

```javascript
// Source: derived from WoordSoekEngine canPlace() pattern
function canPlace(grid, word, row, col, direction, size) {
  var dr = direction === 'down' ? 1 : 0;
  var dc = direction === 'across' ? 1 : 0;
  for (var i = 0; i < word.length; i++) {
    var r = row + i * dr;
    var c = col + i * dc;
    if (r < 0 || r >= size || c < 0 || c >= size) return false;
    var cell = grid[r][c];
    // Must be empty OR already this letter (shared intersection)
    if (!cell.isBlack && cell.letter !== '' && cell.letter !== word[i]) return false;
    // Must not be a black cell
    if (cell.isBlack) return false;
  }
  return true;
}
```

### Pattern 5: Parallel Adjacency Check

This is the most complex validity check. A horizontal word being placed must not have another horizontal word immediately above or below in any overlapping column. A vertical word must not have another vertical word immediately to the left or right.

```javascript
function checkParallelAdjacency(grid, word, row, col, direction, size) {
  var dr = direction === 'down' ? 1 : 0;
  var dc = direction === 'across' ? 1 : 0;
  // Perpendicular direction
  var pr = direction === 'across' ? 1 : 0;  // check row above/below
  var pc = direction === 'down'   ? 1 : 0;  // check col left/right

  for (var i = 0; i < word.length; i++) {
    var r = row + i * dr;
    var c = col + i * dc;
    // Check both perpendicular neighbours
    for (var side = -1; side <= 1; side += 2) {
      var nr = r + side * pr;
      var nc = c + side * pc;
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
      var neighbour = grid[nr][nc];
      // If neighbour has a letter AND that letter is part of a word
      // in the SAME direction as candidate → parallel adjacency violation
      if (!neighbour.isBlack && neighbour.letter !== '') {
        if (isPartOfWordInDirection(nr, nc, direction)) return false;
      }
    }
  }
  return true;
}
```

Implementation note: `isPartOfWordInDirection` scans `_state.placedWords` for any word of the given direction that contains cell (nr, nc). This is O(W * L) where W = placed words, L = avg word length — acceptable for ≤ 18 words.

### Pattern 6: Cell Numbering

```javascript
function assignCellNumbers(grid, words, size) {
  var num = 1;
  for (var r = 0; r < size; r++) {
    for (var c = 0; c < size; c++) {
      if (grid[r][c].isBlack) continue;
      var startsAcross = (c === 0 || grid[r][c-1].isBlack) &&
                         (c + 1 < size && !grid[r][c+1].isBlack);
      var startsDown   = (r === 0 || grid[r-1][c].isBlack) &&
                         (r + 1 < size && !grid[r+1][c].isBlack);
      if (startsAcross || startsDown) {
        grid[r][c].number = num;
        // Also update matching word entry
        assignNumberToWord(words, r, c, num);
        num++;
      }
    }
  }
}
```

This produces the standard left-to-right, top-to-bottom numbering (ENG-04).

### Anti-Patterns to Avoid

- **Placing words in 8 directions** — classic crossword is Across and Down only. WoordSoekEngine uses 8 directions (word search), KruiswoordEngine must use only horizontal and vertical.
- **Filling black cells with random letters** — crossword black cells must stay black, not get filled like WoordSoek's filler letters.
- **Symmetric black cell patterns** — not required (locked decision), don't implement it.
- **Backtracking over already-placed words** — the intersection-first strategy avoids needing this. Retry at the top level instead.
- **Generating all possible placements** — combinatorial explosion. Enumerate intersections with placed words only (not brute-force the entire grid).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Undo stack | Custom diff/patch system | Simple array of `{row, col, prevEntered}` objects — same as SudokuEngine |
| Timer | Custom setInterval timer | Store `startTime = Date.now()` at game start; `getElapsed()` = `Math.floor((Date.now() - startTime) / 1000)` |
| Word shuffling | Custom Fisher-Yates | Copy the `shuffle()` already in WoordSoekEngine/SudokuEngine |
| Length filtering | Custom sort/filter | Simple JS array methods, no library |

**Key insight:** Every utility this engine needs already exists verbatim in other engine files. Copy the patterns, don't invent new ones.

---

## Common Pitfalls

### Pitfall 1: Insufficient Long Words for Anchor
**What goes wrong:** `generate('moeilik')` shuffles the pool and the longest selected word is 6 chars — grid ends up with many short words that can't span the 17-column grid.
**Why it happens:** The 300-word pool has only 16 words of length 10 and 33 of length 9. Random selection can produce a pool with no long words.
**How to avoid:** Always pick the anchor word from the longest available bucket (8-10 chars). Guarantee the anchor selection before random-filling the rest of the quota. For Hard mode, minimum anchor length should be 8.
**Warning signs:** Anchor word shorter than `Math.floor(size * 0.4)` — that's 7 for 17x17, which fits but leaves huge dead space.

### Pitfall 2: Parallel Adjacency Check Too Weak
**What goes wrong:** Two horizontal words on adjacent rows share overlapping columns. The grid technically places both words correctly, but the cells between them form phantom vertical "words" of length 1 (single letters in a column with letters above and below) — the UI would number and clue these phantom words.
**Why it happens:** canPlace() only checks letter conflicts, not whether neighbours form unintended words.
**How to avoid:** After placing a word, check: does any cell of this word have a letter in the same direction (same row for Across, same column for Down) in an adjacent row/column? If yes, reject.
**Warning signs:** Cell numbering produces more numbered cells than expected word count.

### Pitfall 3: Shared Endpoint Violation Creates Phantom Continuations
**What goes wrong:** Word HOND ends at col 7. Word HAND starts at col 7 in the same row (different row). They don't share letters but they're adjacent — the UI might interpret them as a single longer word.
**Why it happens:** canPlace() allows placement starting directly adjacent to an existing word's endpoint.
**How to avoid:** `checkEndpointClearance()` — require that `cell[row][col-1]` (for Across) or `cell[row-1][col]` (for Down) is either out of bounds or a black/empty cell with no letter, before the word's first letter. Same check after the last letter.

### Pitfall 4: 2-Second Cap Not Checked Inside Inner Loop
**What goes wrong:** The inner intersection-search loop runs thousands of iterations on Hard difficulty, exceeding 2 seconds within a single retry attempt.
**Why it happens:** Developer adds the time check only in the retry outer loop.
**How to avoid:** Check `Date.now() - startTime >= 2000` inside `findCandidatePlacements()` — return empty candidates to short-circuit placement if time is exceeded. The outer loop will then return the best attempt so far.

### Pitfall 5: Word Mix Not Enforced Causes Uncrossable Grids
**What goes wrong:** All selected words are 4-5 chars. Short words have fewer letters = fewer intersection opportunities. Generation fails to reach target word count even after 5 retries.
**Why it happens:** Random selection from the full 300 pool skews short because short words dominate (48+42=90 of 300 entries are 4-5 chars).
**How to avoid:** Bucket selection: explicitly pick 30% from [4-5], 40% from [6-7], 30% from [8-10] before generating. This guarantees long words available for intersection-rich placement.

### Pitfall 6: `clues.json` Not Loaded When Engine Called
**What goes wrong:** `KruiswoordEngine.generate('maklik')` called before clues.json has been fetched, crashing with undefined.
**Why it happens:** In the project architecture, clues.json is loaded by the UI layer via fetch/JSON.parse, not inside the engine IIFE.
**How to avoid:** Engine receives the clues array as a parameter: `generate(difficulty, clues)`. The UI passes the pre-loaded clues array. This mirrors WoordSoekEngine's `generatePuzzle(filteredWords, difficulty)` signature.

### Pitfall 7: Cell Number Assignment Off-By-One
**What goes wrong:** A cell starts a Down word (has a letter in the cell below, but nothing above) AND starts an Across word. It should get one number. The scan must assign one number to the cell, not one per word direction.
**Why it happens:** Developer loops over words rather than cells when assigning numbers.
**How to avoid:** Always scan cells first (row-major order), check if cell starts any word in any direction, assign one number per cell. Then back-fill the `number` field into matching word objects.

---

## Code Examples

### Anchor Placement (centre of grid)

```javascript
// Source: derived from crossword convention + grid math
function placeAnchor(grid, word, size) {
  var midRow = Math.floor(size / 2);
  var startCol = Math.floor((size - word.length) / 2);
  for (var c = 0; c < word.length; c++) {
    grid[midRow][startCol + c].letter = word[c];
    grid[midRow][startCol + c].isBlack = false;
  }
  return { word: word, row: midRow, col: startCol, direction: 'across', length: word.length };
}
```

### Endpoint Clearance Check

```javascript
// Source: crossword grid quality rule (locked decision)
function checkEndpointClearance(grid, row, col, direction, length, size) {
  var dr = direction === 'down' ? 1 : 0;
  var dc = direction === 'across' ? 1 : 0;
  // Before first letter
  var preR = row - dr;
  var preC = col - dc;
  if (preR >= 0 && preC >= 0 && grid[preR][preC].letter !== '') return false;
  // After last letter
  var endR = row + dr * length;
  var endC = col + dc * length;
  if (endR < size && endC < size && grid[endR][endC].letter !== '') return false;
  return true;
}
```

### Scoring Candidate Placements

```javascript
// Prefer more intersections (richer crossword connectivity)
// Prefer central positions (aesthetically balanced grid)
function scoreCandidate(candidate, size) {
  var intersections = candidate.intersections; // count of shared letters
  var midR = size / 2;
  var midC = size / 2;
  var distFromCentre = Math.abs(candidate.row - midR) + Math.abs(candidate.col - midC);
  // Higher is better
  return (intersections * 10) - distFromCentre;
}
```

### Retry Loop with Time Cap

```javascript
// Source: pattern from WoordSoekEngine retry + 2-sec cap (locked decision)
function generate(difficulty, clues) {
  var config = DIFFICULTY[difficulty];
  var startTime = Date.now();
  var bestResult = null;

  for (var attempt = 0; attempt < 5; attempt++) {
    if (Date.now() - startTime >= 2000) break;
    var result = _tryGenerate(config, clues, startTime);
    if (!bestResult || result.words.length > bestResult.words.length) {
      bestResult = result;
    }
    if (result.words.length >= config.wordCount) break;
  }

  assignCellNumbers(bestResult.grid, bestResult.words, config.size);
  _state.grid  = bestResult.grid;
  _state.words = bestResult.words;
  _state.difficulty   = difficulty;
  _state.startTime    = Date.now();
  _state.undoStack    = [];
  return getState();
}
```

### checkWord Implementation

```javascript
// Source: locked API decision in CONTEXT.md
function checkWord(number, direction) {
  var word = null;
  for (var i = 0; i < _state.words.length; i++) {
    if (_state.words[i].number === number && _state.words[i].direction === direction) {
      word = _state.words[i];
      break;
    }
  }
  if (!word) return { correct: false, letters: [] };

  var dr = direction === 'down' ? 1 : 0;
  var dc = direction === 'across' ? 1 : 0;
  var allCorrect = true;
  var letters = [];

  for (var j = 0; j < word.length; j++) {
    var r = word.row + j * dr;
    var c = word.col + j * dc;
    var cell = _state.grid[r][c];
    var correct = cell.entered.toUpperCase() === cell.letter;
    letters.push({ row: r, col: c, correct: correct });
    if (!correct) allCorrect = false;
  }

  if (allCorrect) {
    word.complete = true;
  }
  return { correct: allCorrect, letters: letters };
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Symmetric black cell fill | No symmetry required (locked) | Simpler algorithm, faster generation |
| Backtracking placement | Intersection-first greedy + retry | Predictable performance, no exponential worst case |
| 8-direction word placement | Across/Down only | Classic crossword readability |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected — project has no test runner |
| Config file | None — see Wave 0 |
| Quick run command | Open `test-engine.html` in browser, check console |
| Full suite command | Same (manual verification against success criteria) |

The project has no `npm test`, no jest/vitest config, and no `package.json` test scripts. The project runs with `python3 -m http.server 8080` and is tested by direct browser observation. Automated test infrastructure is out of scope for this project (no build pipeline, no npm).

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | How to Verify |
|--------|----------|-----------|---------------|
| ENG-01 | `generate('maklik', clues)` returns 9×9 grid with ≥7 placed words | Manual/console | `console.assert(result.words.length >= 7)` in browser |
| ENG-02 | `generate('medium', clues)` returns 13×13 grid with ≥13 words | Manual/console | `console.assert(result.words.length >= 13)` |
| ENG-03 | `generate('moeilik', clues)` returns 17×17 grid with ≥18 words | Manual/console | `console.assert(result.words.length >= 18)` |
| ENG-04 | Cell numbers assigned left-to-right top-to-bottom | Manual/console | Scan grid, verify numbers are sequential in row-major order |
| ENG-05 | Retry up to 5 times before returning best | Manual/console | Add `console.log('attempt', attemptNum)` in retry loop during dev |

### Wave 0 Gaps
- [ ] `games/kruiswoord/engine.js` — the engine file itself does not exist yet (primary deliverable)
- No test runner infrastructure needed (project uses browser manual testing only)

---

## Open Questions

1. **Maklik grid too dense for 300-word pool**
   - What we know: Easy is 9×9 = 81 cells. With 7 words averaging 5 chars, ~35 letters are placed, filling ~43% of white cells. This is comfortable.
   - What's unclear: Whether 7 connected words reliably fit in 9×9 with the adjacency constraints. The anchor alone (longest available word from short bucket) will be 5 chars centred on a 9-wide grid — leaving only 4 columns per side for intersecting down-words of length 4-5.
   - Recommendation: In `_tryGenerate`, if Maklik fails 3 times, relax the anchor to any word of length 4-7 (not just the longest). The 2-second cap provides the hard safety net.

2. **Word selection guarantees for Moeilik**
   - What we know: 18 words needed, 16 words of length 10 exist. If we pick anchor from the 10-char bucket it might be the same word every game.
   - What's unclear: How often the same anchor word recurs across sessions.
   - Recommendation: Shuffle the long bucket before picking anchor. Only 16 ten-char words means repeats are possible but not every game. Acceptable given the offline single-user context.

---

## Sources

### Primary (HIGH confidence)
- `games/sudoku/engine.js` — direct template for IIFE structure, `_state`, undo, `checkWord`, `isComplete`, `getState`, `newGame` pattern
- `games/woordsoek/engine.js` — `shuffle()`, `canPlace()`, `doPlace()`, retry loop pattern, difficulty constants
- `games/kruiswoord/clues.json` — verified word count (300), length distribution: 4(48) 5(42) 6(53) 7(67) 8(41) 9(33) 10(16)
- `CLAUDE.md §Kruiswoordraaisel Spec` — locked algorithm description, IIFE constraint, offline-first constraint
- `.planning/phases/11-crossword-engine/11-CONTEXT.md` — all locked decisions

### Secondary (MEDIUM confidence)
- Standard crossword grid conventions (cell numbering, black cells, across/down directions) — well-established domain knowledge, no library dependency

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no external libraries, all implementation is internal algorithm + existing project patterns
- Architecture: HIGH — directly modelled on two existing engines in the codebase
- Algorithm details (parallel adjacency, endpoint clearance, scoring): MEDIUM — derived from crossword conventions + pattern analysis; exact scoring weights are Claude's discretion
- Pitfalls: HIGH — identified from analysis of the clue pool data and existing engine code

**Research date:** 2026-03-19
**Valid until:** No expiry — no external libraries, all constraints are internal to this codebase
