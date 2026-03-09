# Requirements: Dad se Speletjies

**Defined:** 2026-03-08
**Core Value:** Dad can pick up his tablet, tap a game, play it to completion, and return to the menu -- for all five games -- without needing any help.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Woord Soek

- [x] **WS-01**: User can start a new Woord Soek puzzle with 10-15 Afrikaans words placed in a 12x12 grid
- [x] **WS-02**: Words are placed in all 8 directions (N/S/E/W/NE/NW/SE/SW) with collision-safe placement
- [x] **WS-03**: User can select a word by tapping first letter then last letter
- [x] **WS-04**: Found words are highlighted on grid with unique colours and struck through in word list
- [x] **WS-05**: Sound effect plays when word is found and when puzzle is complete
- [x] **WS-06**: User can request a hint that flashes the first letter of a random unfound word
- [x] **WS-07**: User can start a new puzzle via "Nuwe Raaisel" button
- [x] **WS-08**: Timer counts up during play and word counter shows X of Y found

### Card Renderer

- [x] **CR-01**: Pure CSS card rendering with rank, suit, and face-up/face-down states
- [x] **CR-02**: Red suits (hearts/diamonds) and black suits (spades/clubs) with distinct colours
- [x] **CR-03**: Face-down cards show a subtle CSS pattern (diagonal lines or dots)
- [x] **CR-04**: Cards are responsive and fill column width appropriately

### Solitaire

- [x] **SOL-01**: User can play full Klondike solitaire with 52-card deck, 7 tableau columns, 4 foundations
- [x] **SOL-02**: Tableau follows alternating colour, descending rank rules
- [x] **SOL-03**: Foundation follows ascending same-suit rules (A->K)
- [x] **SOL-04**: User can move cards by tapping card then tapping target (auto-move to best target)
- [x] **SOL-05**: User can undo moves with unlimited undo stack
- [x] **SOL-06**: Auto-complete triggers when all cards are face-up
- [x] **SOL-07**: Win condition detected with celebration animation and stats recorded

### Spider Solitaire

- [x] **SPI-01**: User can play Spider Solitaire with 10 columns, 104 cards, 5 deal piles
- [x] **SPI-02**: 1-suit mode available (MVP difficulty)
- [x] **SPI-03**: User can move any descending sequence regardless of suit
- [x] **SPI-04**: Complete K->A same-suit sequence auto-removes to foundation
- [x] **SPI-05**: User can deal new row of cards from stock pile
- [x] **SPI-06**: User can undo moves with unlimited undo stack
- [x] **SPI-07**: Win condition detected with celebration animation and stats recorded

### Sudoku

- [x] **SDK-01**: User can play Sudoku on a 9x9 grid with standard rules
- [x] **SDK-02**: Puzzle generator creates puzzles at 4 difficulty levels (Easy ~45, Medium ~35, Hard ~27, Expert ~22 revealed cells)
- [x] **SDK-03**: Each generated puzzle has a unique solution
- [x] **SDK-04**: User can input numbers via on-screen number pad (1-9 + erase)
- [x] **SDK-05**: User can toggle notes/pencil mode to place small candidate numbers per cell
- [x] **SDK-06**: User can tap a number to highlight all instances of that number across the grid
- [x] **SDK-07**: User can request a hint that reveals one correct cell
- [x] **SDK-08**: User can check work -- incorrect cells flash red
- [x] **SDK-09**: Timer with pause functionality
- [x] **SDK-10**: Win condition detected with celebration animation and stats recorded

### FreeCell

- [x] **FC-01**: User can play FreeCell with 8 tableau columns, 4 free cells, 4 foundations
- [x] **FC-02**: Standard FreeCell rules: single card to free cell, ordered sequences on tableau
- [x] **FC-03**: Multi-card moves calculated by formula: (freeCells+1) x 2^emptyCols
- [x] **FC-04**: Auto-move to foundation when safe
- [x] **FC-05**: User can undo moves with unlimited undo stack
- [x] **FC-06**: Deal number displayed (seed-based for replay)
- [x] **FC-07**: Win condition detected with celebration animation and stats recorded

### Polish & Settings (Phase 08.1)

- [x] **POL-01**: Card games (Solitaire, Spider, FreeCell) display MS-style green felt background
- [x] **POL-02**: Face-down cards show classic MS blue crosshatch pattern as default
- [x] **POL-03**: Woord Soek displays parchment/cream background with readable dark text
- [x] **POL-04**: User can drag from first letter to last letter in Woord Soek to select a word (alongside tap-tap)
- [x] **POL-05**: All 5 games have a standardized gear-icon settings modal with game-specific toggles
- [x] **POL-06**: Font size setting (Klein/Medium/Groot) propagates to all game text without breaking card or grid layouts

### Platform

- [x] **PLT-01**: All game assets cached by service worker for full offline play
- [ ] **PLT-02**: APK packaged via PWA Builder, signed, and sideloadable on Samsung Galaxy Tab S6 Lite
- [x] **PLT-03**: Sound toggle (on/off) accessible from settings panel
- [x] **PLT-04**: Game timer counts up per session, wins/played stats shown on welcome screen buttons
- [x] **PLT-05**: Back button on every game screen returns to welcome screen
- [x] **PLT-06**: All tap targets are minimum 56px for comfortable use by older hands
- [x] **PLT-07**: Text readable at arm's length on 10.4" tablet in landscape

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Spider Solitaire

- **SPI-V2-01**: 2-suit mode (medium difficulty)
- **SPI-V2-02**: 4-suit mode (hard difficulty)

### Nice-to-Haves

- **NH-01**: Best times / win streaks per game
- **NH-02**: FreeCell deal number entry (retry specific deals)
- **NH-03**: Woord Soek word categories
- **NH-04**: Daily Sudoku (date-seeded RNG)
- **NH-05**: Colour theme options (dark/sepia/high-contrast)
- **NH-06**: Font size setting UI (shell wired, needs hook-up)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Play Store listing | Sideload only -- no store compliance needed |
| npm / build pipeline / TypeScript | Vanilla HTML/CSS/JS only, no build step |
| ES module imports | IIFE pattern only for browser compatibility |
| External API calls at runtime | Must work 100% offline |
| Image-based card assets | Pure CSS rendering, smaller APK |
| Theme toggle (MS vs warm-dark) | MS is default, toggle deferred to v2 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| WS-01 | Phase 3: Woord Soek | Complete |
| WS-02 | Phase 3: Woord Soek | Complete |
| WS-03 | Phase 3: Woord Soek | Complete |
| WS-04 | Phase 3: Woord Soek | Complete |
| WS-05 | Phase 3: Woord Soek | Complete |
| WS-06 | Phase 3: Woord Soek | Complete |
| WS-07 | Phase 3: Woord Soek | Complete |
| WS-08 | Phase 3: Woord Soek | Complete |
| CR-01 | Phase 4: Card Renderer | Complete |
| CR-02 | Phase 4: Card Renderer | Complete |
| CR-03 | Phase 4: Card Renderer | Complete |
| CR-04 | Phase 4: Card Renderer | Complete |
| SOL-01 | Phase 5: Solitaire | Complete |
| SOL-02 | Phase 5: Solitaire | Complete |
| SOL-03 | Phase 5: Solitaire | Complete |
| SOL-04 | Phase 5: Solitaire | Complete |
| SOL-05 | Phase 5: Solitaire | Complete |
| SOL-06 | Phase 5: Solitaire | Complete |
| SOL-07 | Phase 5: Solitaire | Complete |
| SPI-01 | Phase 6: Spider Solitaire | Complete |
| SPI-02 | Phase 6: Spider Solitaire | Complete |
| SPI-03 | Phase 6: Spider Solitaire | Complete |
| SPI-04 | Phase 6: Spider Solitaire | Complete |
| SPI-05 | Phase 6: Spider Solitaire | Complete |
| SPI-06 | Phase 6: Spider Solitaire | Complete |
| SPI-07 | Phase 6: Spider Solitaire | Complete |
| SDK-01 | Phase 7: Sudoku | Complete |
| SDK-02 | Phase 7: Sudoku | Complete |
| SDK-03 | Phase 7: Sudoku | Complete |
| SDK-04 | Phase 7: Sudoku | Complete |
| SDK-05 | Phase 7: Sudoku | Complete |
| SDK-06 | Phase 7: Sudoku | Complete |
| SDK-07 | Phase 7: Sudoku | Complete |
| SDK-08 | Phase 7: Sudoku | Complete |
| SDK-09 | Phase 7: Sudoku | Complete |
| SDK-10 | Phase 7: Sudoku | Complete |
| FC-01 | Phase 8: FreeCell | Complete |
| FC-02 | Phase 8: FreeCell | Complete |
| FC-03 | Phase 8: FreeCell | Complete |
| FC-04 | Phase 8: FreeCell | Complete |
| FC-05 | Phase 8: FreeCell | Complete |
| FC-06 | Phase 8: FreeCell | Complete |
| FC-07 | Phase 8: FreeCell | Complete |
| POL-01 | Phase 08.1: Polish & Settings | Complete |
| POL-02 | Phase 08.1: Polish & Settings | Complete |
| POL-03 | Phase 08.1: Polish & Settings | Complete |
| POL-04 | Phase 08.1: Polish & Settings | Complete |
| POL-05 | Phase 08.1: Polish & Settings | Complete |
| POL-06 | Phase 08.1: Polish & Settings | Complete |
| PLT-01 | Phase 9: Packaging | Complete |
| PLT-02 | Phase 9: Packaging | Pending |
| PLT-03 | Phase 3: Woord Soek | Complete |
| PLT-04 | Phase 3: Woord Soek | Complete |
| PLT-05 | Phase 3: Woord Soek | Complete |
| PLT-06 | Phase 3: Woord Soek | Complete |
| PLT-07 | Phase 3: Woord Soek | Complete |

**Coverage:**
- v1 requirements: 56 total
- Mapped to phases: 56
- Unmapped: 0

---
*Requirements defined: 2026-03-08*
*Last updated: 2026-03-09 after Phase 08.1 planning*
