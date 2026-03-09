# Roadmap: Dad se Speletjies

## Overview

Deliver five fully playable games in a single offline PWA for Dad's tablet. Woord Soek goes first (no shared dependencies), then the card renderer (shared by three games), then the three card games (Solitaire, Spider, FreeCell), then Sudoku (independent), and finally APK packaging. Phases 1-2 (scaffold + welcome screen) are already complete.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Scaffold** - Shared CSS, router, settings, audio, PWA shell (DONE)
- [x] **Phase 2: Welcome Screen** - Game menu with 5 buttons, settings panel (DONE)
- [x] **Phase 3: Woord Soek** - Afrikaans word search with dictionary, 8-direction placement, tap selection
- [ ] **Phase 4: Card Renderer** - Pure CSS card components shared by all three card games
- [ ] **Phase 5: Solitaire** - Full Klondike with undo, auto-complete, win detection
- [ ] **Phase 6: Spider Solitaire** - 1/2/4 suit modes with 10 columns, sequence removal
- [ ] **Phase 7: Sudoku** - 4 difficulty levels, number pad, notes mode, hints
- [ ] **Phase 8: FreeCell** - Free cells, multi-card moves, deal numbers
- [ ] **Phase 9: Packaging** - Service worker finalization, APK build, sideload

## Phase Details

### Phase 1: Scaffold
**Goal**: Foundation infrastructure for all games (COMPLETE)
**Depends on**: Nothing
**Status**: Complete

### Phase 2: Welcome Screen
**Goal**: Entry point where Dad picks a game (COMPLETE)
**Depends on**: Phase 1
**Status**: Complete

### Phase 3: Woord Soek
**Goal**: Dad can play a complete Afrikaans word search puzzle from start to finish
**Depends on**: Phase 2
**Status**: Complete
**Requirements**: WS-01, WS-02, WS-03, WS-04, WS-05, WS-06, WS-07, WS-08, PLT-03, PLT-04, PLT-05, PLT-06, PLT-07
**Success Criteria** (what must be TRUE):
  1. User can start a new puzzle and see 10-15 Afrikaans words hidden in a 12x12 grid with a word list alongside
  2. User can find a word by tapping its first letter then its last letter, and the word highlights on the grid and strikes through in the list
  3. User can see how many words remain (X of Y), see the timer counting, get a hint, and start a fresh puzzle at any time
  4. Sound plays on word found and on puzzle completion, with sound toggle working from settings
  5. Back button returns to welcome screen, all tap targets are comfortable (56px+), text is readable at arm's length
**Plans:** 3 plans

Plans:
- [x] 03-01-PLAN.md — Puzzle engine (word placement, grid generation, selection validation) + HTML skeleton
- [x] 03-02-PLAN.md — UI module (grid rendering, tap-tap selection, game flow, modals, timer, hints)
- [x] 03-03-PLAN.md — Human verification checkpoint

### Phase 4: Card Renderer
**Goal**: Reusable CSS card components that look great on the tablet for all three card games
**Depends on**: Phase 2
**Requirements**: CR-01, CR-02, CR-03, CR-04
**Success Criteria** (what must be TRUE):
  1. A test page renders face-up cards showing rank and suit with red/black colour distinction
  2. Face-down cards display a distinct back pattern distinguishable from face-up cards
  3. Cards scale responsively to fill their container width and remain legible on a 10.4" tablet
**Plans**: 2 plans

Plans:
- [ ] 04-01-PLAN.md — Card CSS + JS factory + visual test page
- [ ] 04-02-PLAN.md — Human visual verification checkpoint

### Phase 5: Solitaire
**Goal**: Dad can play a full game of Klondike solitaire with tap-to-move, undo, and auto-complete
**Depends on**: Phase 4
**Requirements**: SOL-01, SOL-02, SOL-03, SOL-04, SOL-05, SOL-06, SOL-07
**Success Criteria** (what must be TRUE):
  1. User can deal a new game and see 7 tableau columns with top cards face-up, a stock pile, and 4 empty foundations
  2. User can move cards between tableau columns (alternating colour, descending rank) and to foundations (ascending same-suit) by tapping
  3. User can undo any number of moves, and auto-complete triggers when all cards are face-up
  4. Win is detected with a celebration animation and the win is recorded in stats
**Plans:** 3 plans

Plans:
- [ ] 05-01-PLAN.md — Engine (Klondike logic, move validation, undo, auto-complete) + HTML screen skeleton
- [ ] 05-02-PLAN.md — UI module (rendering, tap-tap, drag-and-drop, auto-complete animation, win celebration)
- [ ] 05-03-PLAN.md — Human verification checkpoint

### Phase 6: Spider Solitaire
**Goal**: Dad can play Spider Solitaire in 1/2/4 suit modes with deal, sequence removal, undo, and win detection
**Depends on**: Phase 4
**Requirements**: SPI-01, SPI-02, SPI-03, SPI-04, SPI-05, SPI-06, SPI-07
**Success Criteria** (what must be TRUE):
  1. User can start a Spider game in 1, 2, or 4 suit mode with 10 columns of cards and a stock pile for dealing
  2. User can move descending sequences between columns and deal new rows from stock
  3. A complete K-to-A same-suit sequence auto-removes to foundation
  4. User can undo moves, and win is detected with celebration animation and stats recorded
**Plans:** 3 plans

Plans:
- [ ] 06-01-PLAN.md — Engine (Spider logic, 3 suit modes, move validation, deal, sequence detection, undo) + HTML skeleton
- [ ] 06-02-PLAN.md — UI module (rendering, tap/drag interaction, deal animation, sequence completion, win celebration, settings)
- [ ] 06-03-PLAN.md — Human verification checkpoint

### Phase 7: Sudoku
**Goal**: Dad can play Sudoku at any difficulty with number pad, notes, hints, and error checking
**Depends on**: Phase 2
**Requirements**: SDK-01, SDK-02, SDK-03, SDK-04, SDK-05, SDK-06, SDK-07, SDK-08, SDK-09, SDK-10
**Success Criteria** (what must be TRUE):
  1. User can pick a difficulty (Easy/Medium/Hard/Expert) and get a unique-solution puzzle with the appropriate number of revealed cells
  2. User can enter numbers via on-screen pad, toggle notes mode for pencil marks, and erase entries
  3. User can tap a number to see all instances highlighted, request a hint to reveal a cell, and check work to see errors flash red
  4. Timer counts up with pause support, and completing the puzzle triggers celebration animation with stats recorded
**Plans**: 3 plans

Plans:
- [x] 07-01-PLAN.md — Engine (backtracking generator, solver, game state, undo, save/load) + HTML skeleton
- [ ] 07-02-PLAN.md — UI module (grid rendering, cell-first input, notes, highlighting, timer, auto-save, win celebration) + CSS
- [ ] 07-03-PLAN.md — Human verification checkpoint

### Phase 8: FreeCell
**Goal**: Dad can play FreeCell with free cells, multi-card moves, auto-foundation, and deal replay
**Depends on**: Phase 4
**Requirements**: FC-01, FC-02, FC-03, FC-04, FC-05, FC-06, FC-07
**Success Criteria** (what must be TRUE):
  1. User can start a FreeCell game with 8 tableau columns, 4 free cells, and 4 foundations, with a visible deal number
  2. User can move single cards to free cells and ordered sequences between columns, with multi-card moves respecting the (freeCells+1) x 2^emptyCols formula
  3. Cards auto-move to foundation when safe, user can undo any number of moves
  4. Win is detected with celebration animation and stats recorded
**Plans**: 3 plans

Plans:
- [ ] 08-01-PLAN.md — Engine (FreeCell logic, seeded deals, multi-card formula, auto-foundation, undo) + HTML skeleton
- [ ] 08-02-PLAN.md — UI module (rendering, tap/drag/double-tap, auto-foundation animation, shake, win celebration) + CSS
- [ ] 08-03-PLAN.md — Human verification checkpoint

### Phase 08.1: Polish & Settings (INSERTED)

**Goal:** MS Solitaire-style themes, drag-to-select for Woord Soek, standardized settings modals, and font size propagation across all games
**Requirements**: POL-01, POL-02, POL-03, POL-04, POL-05, POL-06
**Depends on:** Phase 8
**Success Criteria** (what must be TRUE):
  1. Card games display classic MS green felt background with blue crosshatch card backs
  2. Woord Soek displays parchment/cream background with readable dark text
  3. User can drag from first letter to last letter in Woord Soek to select a word (alongside tap-tap)
  4. All 5 games have a gear-icon settings modal with consistent styling and game-specific toggles
  5. Font size Klein/Medium/Groot scales text across all games without breaking card or grid layouts
**Plans:** 4/4 plans complete

Plans:
- [ ] 08.1-01-PLAN.md — CSS themes (green felt, parchment, MS card backs) + apply to game containers
- [ ] 08.1-02-PLAN.md — Drag-to-select for Woord Soek (touch handling alongside tap-tap)
- [ ] 08.1-03-PLAN.md — Settings modals (Sudoku + Woord Soek new, alignment) + font size audit
- [ ] 08.1-04-PLAN.md — Human verification checkpoint

### Phase 9: Packaging
**Goal**: The complete game suite is packaged as an APK and runs offline on Dad's tablet
**Depends on**: Phase 3, Phase 5, Phase 6, Phase 7, Phase 8
**Requirements**: PLT-01, PLT-02
**Success Criteria** (what must be TRUE):
  1. Service worker caches all game assets and the app works fully offline after first load
  2. APK is built via PWA Builder, signed, and installs on Samsung Galaxy Tab S6 Lite
  3. All five games are playable from the APK without internet connection
**Plans**: TBD

Plans:
- [ ] 09-01: TBD
- [ ] 09-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 3 -> 4 -> 5 -> 6 -> 7 -> 8 -> 08.1 -> 9
(Note: Phase 7 Sudoku has no dependency on Phase 4-6 and could execute in parallel if needed)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffold | - | Complete | - |
| 2. Welcome Screen | - | Complete | - |
| 3. Woord Soek | 3/3 | Complete | 2026-03-09 |
| 4. Card Renderer | 0/1 | Not started | - |
| 5. Solitaire | 0/3 | Not started | - |
| 6. Spider Solitaire | 0/3 | Not started | - |
| 7. Sudoku | 1/3 | In progress | - |
| 8. FreeCell | 0/3 | Not started | - |
| 08.1. Polish & Settings | 4/4 | Complete   | 2026-03-09 |
| 9. Packaging | 0/2 | Not started | - |
