# Roadmap: Con se Speletjies

## Milestones

- ✅ **v1.0 MVP** — Phases 1-9 + 8.1 (shipped 2026-03-09)
- 🚧 **v1.1 Kruiswoordraaisel** — Phases 10-12 (in progress)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-9) — SHIPPED 2026-03-09</summary>

- [x] Phase 1: Scaffold (pre-existing)
- [x] Phase 2: Welcome Screen (pre-existing)
- [x] Phase 3: Woord Soek (3/3 plans) — completed 2026-03-09
- [x] Phase 4: Card Renderer (2/2 plans) — completed 2026-03-09
- [x] Phase 5: Solitaire (3/3 plans) — completed 2026-03-09
- [x] Phase 6: Spider Solitaire (3/3 plans) — completed 2026-03-09
- [x] Phase 7: Sudoku (3/3 plans) — completed 2026-03-09
- [x] Phase 8: FreeCell (3/3 plans) — completed 2026-03-09
- [x] Phase 8.1: Polish & Settings (4/4 plans) — completed 2026-03-09
- [x] Phase 9: Packaging (2/2 plans) — completed 2026-03-09

Full details archived to `milestones/v1.0-ROADMAP.md`

</details>

### 🚧 v1.1 Kruiswoordraaisel (In Progress)

**Milestone Goal:** Add the 6th and final game — an Afrikaans crossword puzzle — to complete Con's game suite.

- [ ] **Phase 10: Clue Data Pipeline** - Build and validate clues.json (~300 Afrikaans word+clue pairs)
- [ ] **Phase 11: Crossword Engine** - Generate valid grids for all three difficulty levels
- [ ] **Phase 12: UI & Integration** - Full playable game with cell interaction, clue navigation, win flow, and SW cache update

## Phase Details

### Phase 10: Clue Data Pipeline
**Goal**: A validated clues.json exists with ~300 quality Afrikaans word+clue pairs ready for the engine
**Depends on**: Nothing (first phase of v1.1)
**Requirements**: DATA-01, DATA-02, DATA-03
**Success Criteria** (what must be TRUE):
  1. clues.json loads in a browser without error and contains approximately 300 entries, each with "word" and "clue" fields
  2. Every word is 4-10 characters, alphabetic only, with no proper nouns or offensive terms
  3. Every clue is in Afrikaans, at most 8 words, and contains neither the answer word nor its root
  4. The file cross-references words.json — every word in clues.json is present in the existing dictionary
**Plans:** 1 plan
Plans:
- [ ] 10-01-PLAN.md — Download kaikki.org data, filter, translate to Afrikaans clues, validate, write clues.json

### Phase 11: Crossword Engine
**Goal**: The engine reliably generates a valid, numbered crossword grid for any difficulty level on demand
**Depends on**: Phase 10
**Requirements**: ENG-01, ENG-02, ENG-03, ENG-04, ENG-05
**Success Criteria** (what must be TRUE):
  1. Calling the engine with Easy produces a 9×9 grid with at least 7 placed, intersecting words
  2. Calling the engine with Medium produces a 13×13 grid with at least 13 placed, intersecting words
  3. Calling the engine with Hard produces a 17×17 grid with at least 18 placed, intersecting words
  4. Every word-start cell carries the correct superscript number, assigned left-to-right then top-to-bottom
  5. When the minimum word count is not reached, the engine retries up to 5 times before returning the best result
**Plans**: TBD

### Phase 12: UI & Integration
**Goal**: Con can tap Kruiswoordraaisel, choose a difficulty, fill in the grid with his S Pen, and reach a congratulations screen when complete — with the game card on the welcome screen and all files in the SW cache
**Depends on**: Phase 11
**Requirements**: UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07, UI-08, UI-09, UI-10, UI-11, UI-12, UI-13
**Success Criteria** (what must be TRUE):
  1. Kruiswoordraaisel appears as a tappable game card on the welcome screen with a stats chip showing wins and best time
  2. Tapping a cell highlights the full word in that direction; tapping the same cell again toggles between Across and Down; tapping a clue jumps to the first empty cell of that word
  3. Letters entered via keyboard or S Pen handwriting appear in the correct cell and the cursor advances automatically to the next empty cell in the word
  4. Completing a correct word flashes it green and plays the word_found sound; completing all words triggers the congratulations modal and plays board_finished, then records the win via Settings.recordWin
  5. The back button from an in-progress puzzle shows a confirmation prompt before returning to the welcome screen
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Scaffold | v1.0 | - | Complete | - |
| 2. Welcome Screen | v1.0 | - | Complete | - |
| 3. Woord Soek | v1.0 | 3/3 | Complete | 2026-03-09 |
| 4. Card Renderer | v1.0 | 2/2 | Complete | 2026-03-09 |
| 5. Solitaire | v1.0 | 3/3 | Complete | 2026-03-09 |
| 6. Spider Solitaire | v1.0 | 3/3 | Complete | 2026-03-09 |
| 7. Sudoku | v1.0 | 3/3 | Complete | 2026-03-09 |
| 8. FreeCell | v1.0 | 3/3 | Complete | 2026-03-09 |
| 8.1. Polish & Settings | v1.0 | 4/4 | Complete | 2026-03-09 |
| 9. Packaging | v1.0 | 2/2 | Complete | 2026-03-09 |
| 10. Clue Data Pipeline | v1.1 | 0/1 | Planning | - |
| 11. Crossword Engine | v1.1 | 0/TBD | Not started | - |
| 12. UI & Integration | v1.1 | 0/TBD | Not started | - |
