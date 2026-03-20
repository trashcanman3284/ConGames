# Phase 11: Crossword Engine - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Generate valid, numbered Afrikaans crossword grids for three difficulty levels (Maklik/Medium/Moeilik) on demand. Pure logic engine — no DOM, no UI. Consumes `clues.json` (300 word+clue pairs). UI and integration are Phase 12.

</domain>

<decisions>
## Implementation Decisions

### Word Placement Strategy
- Every word must intersect at least one other word — no isolated words, single connected crossword
- Select words randomly from the 300-word pool but ensure a mix of short (4-5), medium (6-7), and long (8-10) character words
- Always fresh puzzle — new random selection each time, no seeded/daily puzzles
- Place longest word horizontally at grid centre as anchor, then find letter intersections for subsequent words

### Grid Quality Rules
- No rotational symmetry required — let the algorithm place words wherever they fit best
- Minimum 1 intersection per word (implied by the connected-grid rule)
- Prevent parallel adjacency — two words running side-by-side would create unintended cross-words in the perpendicular direction
- No shared endpoints — words must have a blank cell or grid edge before the first letter and after the last letter in their direction

### Engine API Shape
- Return 2D grid array + word list: `grid[row][col]` = `{letter, number, isBlack}`, `words[]` = `{word, clue, number, direction, row, col, length}`
- Single word list with `direction: 'across' | 'down'` field — UI groups as needed
- Engine owns answer checking: exposes `checkWord(number, direction)` and `isComplete()`
- Engine tracks full game state (entered letters, elapsed time, completed words, undo stack) — consistent with SudokuEngine pattern

### Difficulty Tuning
- Afrikaans labels: Maklik (9x9, 7 words), Medium (13x13, 13 words), Moeilik (17x17, 18 words)
- Grid sizes and word counts are firm constants, not configurable
- After 5 retries, return best attempt (grid with most placed words) — a slightly sparse grid is still playable
- 2-second generation time cap — if exceeded, return best grid so far to avoid freezing Con's tablet

### Claude's Discretion
- Exact intersection scoring algorithm for word placement
- Internal data structures for the placement engine
- Undo stack implementation details
- Timer management approach

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Engine requirements
- `.planning/REQUIREMENTS.md` — ENG-01 through ENG-05: grid sizes, word counts, cell numbering, retry logic
- `.planning/ROADMAP.md` §Phase 11 — Success criteria (5 items) defining what "valid grid" means

### Clue data
- `games/kruiswoord/clues.json` — 300 Afrikaans word+clue pairs, words 4-10 chars, the engine's input data

### Existing engine patterns
- `games/sudoku/engine.js` — Reference IIFE engine: internal `_state`, difficulty constants, public API, undo stack
- `games/woordsoek/engine.js` — Reference IIFE engine: word placement on grid, shuffle utility, difficulty tiers

### Project constraints
- `CLAUDE.md` §Kruiswoordraaisel Spec — High-level engine algorithm description
- `CLAUDE.md` §Gotchas — IIFE only, no ESM, offline-first

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SudokuEngine` pattern: IIFE with `_state` object, difficulty constants, `generate()` entry point, `checkWord()`-style validation — direct template for KruiswoordEngine
- `WoordSoekEngine` pattern: `shuffle()` utility, grid-based word placement with direction handling — relevant algorithm patterns
- `games/kruiswoord/clues.json`: 300 entries ready to consume, length distribution: 4-char(48), 5(42), 6(53), 7(67), 8(41), 9(33), 10(16)

### Established Patterns
- All game engines use `var X = (function() { 'use strict'; ... })()` IIFE pattern
- Difficulty objects with Afrikaans labels (`Maklik`, `Medium`, `Moeilik`, `Kenner`)
- Internal `_state` object for all mutable game state
- Public API via returned object literal

### Integration Points
- Engine will be loaded via `<script>` tag in `index.html` — no imports
- UI layer (Phase 12) will call `KruiswoordEngine.generate('maklik')` and render the returned grid
- `Settings.recordWin('kruiswoord', timeSeconds)` for stats — engine tracks elapsed time

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. The CLAUDE.md spec provides the algorithm outline: longest word at centre, intersection-based placement, retry on failure.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 11-crossword-engine*
*Context gathered: 2026-03-19*
