# Requirements: Dad se Speletjies

**Defined:** 2026-03-08
**Core Value:** Dad can pick up his tablet, tap a game, play it to completion, and return to the menu — for all five games — without needing any help.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Woord Soek

- [ ] **WS-01**: User can start a new Woord Soek puzzle with 10-15 Afrikaans words placed in a 12x12 grid
- [ ] **WS-02**: Words are placed in all 8 directions (N/S/E/W/NE/NW/SE/SW) with collision-safe placement
- [ ] **WS-03**: User can select a word by tapping first letter then last letter
- [ ] **WS-04**: Found words are highlighted on grid with unique colours and struck through in word list
- [ ] **WS-05**: Sound effect plays when word is found and when puzzle is complete
- [ ] **WS-06**: User can request a hint that flashes the first letter of a random unfound word
- [ ] **WS-07**: User can start a new puzzle via "Nuwe Raaisel" button
- [ ] **WS-08**: Timer counts up during play and word counter shows X of Y found

### Card Renderer

- [ ] **CR-01**: Pure CSS card rendering with rank, suit, and face-up/face-down states
- [ ] **CR-02**: Red suits (hearts/diamonds) and black suits (spades/clubs) with distinct colours
- [ ] **CR-03**: Face-down cards show a subtle CSS pattern (diagonal lines or dots)
- [ ] **CR-04**: Cards are responsive and fill column width appropriately

### Solitaire

- [ ] **SOL-01**: User can play full Klondike solitaire with 52-card deck, 7 tableau columns, 4 foundations
- [ ] **SOL-02**: Tableau follows alternating colour, descending rank rules
- [ ] **SOL-03**: Foundation follows ascending same-suit rules (A→K)
- [ ] **SOL-04**: User can move cards by tapping card then tapping target (auto-move to best target)
- [ ] **SOL-05**: User can undo moves with unlimited undo stack
- [ ] **SOL-06**: Auto-complete triggers when all cards are face-up
- [ ] **SOL-07**: Win condition detected with celebration animation and stats recorded

### Spider Solitaire

- [ ] **SPI-01**: User can play Spider Solitaire with 10 columns, 104 cards, 5 deal piles
- [ ] **SPI-02**: 1-suit mode available (MVP difficulty)
- [ ] **SPI-03**: User can move any descending sequence regardless of suit
- [ ] **SPI-04**: Complete K→A same-suit sequence auto-removes to foundation
- [ ] **SPI-05**: User can deal new row of cards from stock pile
- [ ] **SPI-06**: User can undo moves with unlimited undo stack
- [ ] **SPI-07**: Win condition detected with celebration animation and stats recorded

### Sudoku

- [ ] **SDK-01**: User can play Sudoku on a 9x9 grid with standard rules
- [ ] **SDK-02**: Puzzle generator creates puzzles at 4 difficulty levels (Easy ~45, Medium ~35, Hard ~27, Expert ~22 revealed cells)
- [ ] **SDK-03**: Each generated puzzle has a unique solution
- [ ] **SDK-04**: User can input numbers via on-screen number pad (1-9 + erase)
- [ ] **SDK-05**: User can toggle notes/pencil mode to place small candidate numbers per cell
- [ ] **SDK-06**: User can tap a number to highlight all instances of that number across the grid
- [ ] **SDK-07**: User can request a hint that reveals one correct cell
- [ ] **SDK-08**: User can check work — incorrect cells flash red
- [ ] **SDK-09**: Timer with pause functionality
- [ ] **SDK-10**: Win condition detected with celebration animation and stats recorded

### FreeCell

- [ ] **FC-01**: User can play FreeCell with 8 tableau columns, 4 free cells, 4 foundations
- [ ] **FC-02**: Standard FreeCell rules: single card to free cell, ordered sequences on tableau
- [ ] **FC-03**: Multi-card moves calculated by formula: (freeCells+1) × 2^emptyCols
- [ ] **FC-04**: Auto-move to foundation when safe
- [ ] **FC-05**: User can undo moves with unlimited undo stack
- [ ] **FC-06**: Deal number displayed (seed-based for replay)
- [ ] **FC-07**: Win condition detected with celebration animation and stats recorded

### Platform

- [ ] **PLT-01**: All game assets cached by service worker for full offline play
- [ ] **PLT-02**: APK packaged via PWA Builder, signed, and sideloadable on Samsung Galaxy Tab S6 Lite
- [ ] **PLT-03**: Sound toggle (on/off) accessible from settings panel
- [ ] **PLT-04**: Game timer counts up per session, wins/played stats shown on welcome screen buttons
- [ ] **PLT-05**: Back button on every game screen returns to welcome screen
- [ ] **PLT-06**: All tap targets are minimum 56px for comfortable use by older hands
- [ ] **PLT-07**: Text readable at arm's length on 10.4" tablet in landscape

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
| Play Store listing | Sideload only — no store compliance needed |
| npm / build pipeline / TypeScript | Vanilla HTML/CSS/JS only, no build step |
| ES module imports | IIFE pattern only for browser compatibility |
| External API calls at runtime | Must work 100% offline |
| Image-based card assets | Pure CSS rendering, smaller APK |
| Drag-to-select in Woord Soek | Tap-first/tap-last is primary; drag is nice-to-have |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| (populated during roadmap creation) | | |

**Coverage:**
- v1 requirements: 38 total
- Mapped to phases: 0
- Unmapped: 38 ⚠️

---
*Requirements defined: 2026-03-08*
*Last updated: 2026-03-08 after initial definition*
