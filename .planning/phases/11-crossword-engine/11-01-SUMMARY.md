---
phase: 11-crossword-engine
plan: 01
subsystem: game-engine
tags: [crossword, algorithm, grid-generation, afrikaans, vanilla-js, iife, es5]

requires: []

provides:
  - KruiswoordEngine IIFE at games/kruiswoord/engine.js
  - generate(difficulty, clues) returning {grid, words} for maklik/medium/moeilik
  - Game state API: setLetter, checkWord, isComplete, undo, getState, getElapsed
  - Functional test suite at games/kruiswoord/test-engine.js

affects:
  - 11-crossword-ui (Phase 12 UI will consume KruiswoordEngine directly)

tech-stack:
  added: []
  patterns:
    - "IIFE engine module pattern (var KruiswoordEngine = (function(){ ... })())"
    - "Multi-pass greedy placement with time-capped retry loop"
    - "Word-list-based cell numbering (source of truth, not topology scan)"
    - "3x candidate pool with multi-pass exhaustion before retry"

key-files:
  created:
    - games/kruiswoord/engine.js
    - games/kruiswoord/test-engine.js
  modified: []

key-decisions:
  - "Multi-pass placement: after one pass through the candidate pool, cycle through unplaced words again — new intersections become available as the grid fills"
  - "100-retry outer loop with 1500ms time budget (each attempt ~1ms, allows ~100+ attempts for tough medium grids)"
  - "3x candidate pool (not 2x) to give the placement loop more diversity per attempt"
  - "Word-list-based assignCellNumbers: use words[] as source of truth for start positions, not topological scan — avoids number=0 bugs from endpoint-clearance timing"
  - "Anchor capped to grid.size-2 to guarantee placeAnchor never generates negative startCol"

requirements-completed: [ENG-01, ENG-02, ENG-03, ENG-04, ENG-05]

duration: 8min
completed: 2026-03-19
---

# Phase 11 Plan 01: KruiswoordEngine Summary

**Greedy intersection-first crossword engine generating 9x9/13x13/17x17 grids with full game state API — 30/30 tests pass on all three difficulty levels with 0 failures across 50 stress-test runs**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-19T04:00:00Z
- **Completed:** 2026-03-19T04:08:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Complete KruiswoordEngine IIFE (662 lines) implementing crossword grid generation and game state management
- All three difficulty levels verified: maklik (9x9, 7 words), medium (13x13, 13 words), moeilik (17x17, 18 words)
- Full game state API functional: setLetter, checkWord (with word.complete), isComplete, undo stack, getState deep clone, getElapsed timer
- 50-run stress test: 0 failures, average 2ms per triple-difficulty generation

## Task Commits

1. **Task 1: Build crossword grid generation algorithm** - `efd5158` (feat)
2. **Auto-fix: anchor cap, word count reliability, cell numbering** - `ea4880c` (fix)
3. **Task 2: Functional verification test suite** - `9c79983` (test)

## Files Created/Modified

- `games/kruiswoord/engine.js` — Complete KruiswoordEngine IIFE: DIFFICULTY constants, grid generator, placement validation (canPlace, checkEndpointClearance, checkParallelAdjacency), scoring, retry loop, game state API
- `games/kruiswoord/test-engine.js` — Node.js test script: 30 tests covering ENG-01 through ENG-05, word structure, grid integrity, intersection check, full game state API

## Decisions Made

- Multi-pass placement (cycle through unplaced candidates again after each pass) rather than single-pass, enabling later-placed words to unlock positions for earlier-skipped candidates
- 100-iteration retry outer loop within 1500ms budget rather than fixed 5 retries — each iteration takes ~1ms, so 100+ attempts fit comfortably within 2s spec
- 3x candidate pool size ensures enough word diversity per attempt without exhausting bucket distribution
- Word-list-based cell numbering: iterate words array for start positions rather than using topological `startsAcross`/`startsDown` flags — eliminates number=0 edge case where a cell triggers one direction's topology check but not the other's

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed anchor-word length crash on maklik grid**
- **Found during:** Task 2 (test run)
- **Issue:** selectWords always picked the globally longest word (10 chars) as anchor, giving startCol=-1 for size=9 grid, crashing placeAnchor with "Cannot set properties of undefined"
- **Fix:** Cap anchor selection to words with length <= config.size - 2
- **Files modified:** games/kruiswoord/engine.js
- **Verification:** maklik generation no longer crashes; 50 stress-test runs pass
- **Committed in:** ea4880c

**2. [Rule 1 - Bug] Fixed words getting number=0 after assignCellNumbers**
- **Found during:** Task 2 (test run — "word PLANTASIE has number=0")
- **Issue:** Original topology-based scan used `startsAcross && w.direction==='across'` condition — a Down word at a cell that only triggered `startsDown` (not `startsAcross`) wouldn't get numbered if the cell happened to be the start of an Across word whose adjacency caused the topology check to fire only one flag
- **Fix:** Rewrote assignCellNumbers to use words[] as source of truth: scan cells row-major, check if any word starts at that cell (regardless of direction flags), assign the sequential number to all words at that position
- **Files modified:** games/kruiswoord/engine.js
- **Verification:** ENG-04 test "all words have a number assigned" passes on all runs
- **Committed in:** ea4880c

**3. [Rule 1 - Bug] Fixed medium difficulty word count shortfall (12/13)**
- **Found during:** Task 2 (test run)
- **Issue:** 5-retry outer loop + 2x candidate pool insufficient for medium's 13-word target in 13x13 — ~55% failure rate; single-pass through pool meant words that couldn't intersect early were discarded even though later placements created new intersection opportunities
- **Fix:** (a) Multi-pass inner loop: re-queue unplaced words and retry until no progress; (b) 3x candidate pool size; (c) 100-iteration outer retry loop within 1500ms budget
- **Files modified:** games/kruiswoord/engine.js
- **Verification:** 0 failures across 50 runs (150 total generations)
- **Committed in:** ea4880c

---

**Total deviations:** 3 auto-fixed (3 bugs)
**Impact on plan:** All fixes necessary for correctness. No scope creep.

## Issues Encountered

None beyond the auto-fixed bugs above.

## Next Phase Readiness

- KruiswoordEngine is complete and fully tested — Phase 12 UI can consume it directly
- Public API surface: `generate(difficulty, clues)`, `setLetter`, `checkWord`, `isComplete`, `undo`, `getState`, `getElapsed`, `DIFFICULTY`
- clues.json is already at games/kruiswoord/clues.json (300 Afrikaans word+clue pairs)
- No blockers for Phase 12

---
*Phase: 11-crossword-engine*
*Completed: 2026-03-19*
